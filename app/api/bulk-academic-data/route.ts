import { NextResponse, NextRequest } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { AcademicConfigManager } from '@/lib/academic-config'
import { getOrSetCache } from '@/lib/redis'

export const runtime = 'nodejs'

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
      meta: { timestamp: Date.now(), path: '/api/bulk-academic-data' }
    },
    { status }
  )
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paramBranchCode = searchParams.get('branch')
  const paramYearString = searchParams.get('year')
  const paramSemesterString = searchParams.get('semester')

  // These IDs are needed to fetch resources properly if we want to filter by them
  const paramBranchId = searchParams.get('branch_id')
  const paramYearId = searchParams.get('year_id')
  const paramSemesterId = searchParams.get('semester_id')

  const startTime = Date.now()
  const t = {
    profileStart: Date.now(),
    profileMs: 0,
    subjectsMs: 0,
    staticMs: 0,
    dynamicMs: 0,
    resourcesMs: 0,
  }

  try {
    const supabase = createSupabaseAdmin()
    const academicConfig = AcademicConfigManager.getInstance()

    // We no longer rely on DB profile. 
    // We expect the client to strictly provide the context.

    // However, for backward compatibility or robust data fetching, we try to interpret what we have.
    const currentYear = paramYearString ? parseInt(paramYearString) : null
    const semesterNumber = paramSemesterString ? parseInt(paramSemesterString) : null
    const branchCode = paramBranchCode

    // IDs for resource fetching
    const branchId = paramBranchId
    const yearId = paramYearId
    const semesterId = paramSemesterId

    t.profileMs = 0 // Skipped profile fetch

    // Fetch subjects using subject_offerings
    const subjectsPromise = (async () => {
      const secStart = Date.now()
      if (!branchCode || !currentYear || !semesterNumber) return { data: [] as any[] }

      const cacheKey = `subjects:${branchCode}:${currentYear}:${semesterNumber}`
      const result = await getOrSetCache(cacheKey, 3600, async () => { // 1 hour
        // Try to detect latest regulation from offerings for this context
        const { data: regs } = await supabase
          .from('subject_offerings')
          .select('regulation')
          .eq('branch', branchCode)
          .eq('year', currentYear)
          .eq('semester', semesterNumber)
          .eq('active', true)

        const uniqueRegs = regs ? [...new Set(regs.map((r: any) => r.regulation).filter(Boolean))] : []
        let regulation: string | null = null
        if (uniqueRegs.length > 0) {
          const regWithNums = uniqueRegs.map(reg => ({
            reg,
            num: parseInt(reg.replace(/\D/g, '')) || 0
          }))
          const sortedRegs = regWithNums.sort((a, b) => b.num - a.num)
          regulation = sortedRegs[0].reg
        }

        let offeringsQuery = supabase
          .from('subject_offerings')
          .select('subject_id, display_order')
          .eq('branch', branchCode)
          .eq('year', currentYear)
          .eq('semester', semesterNumber)
          .eq('active', true)
          .order('display_order', { ascending: true })

        if (regulation) {
          offeringsQuery = offeringsQuery.eq('regulation', regulation)
        }

        const { data: offerings, error: offeringsErr } = await offeringsQuery
        if (offeringsErr) {
          console.error('[bulk] offerings query error:', offeringsErr)
          return { data: [] as any[] }
        }
        if (!offerings || offerings.length === 0) return { data: [] as any[] }

        const subjectIds = offerings.map(o => o.subject_id)
        const { data: subjects, error: subjectsErr } = await supabase
          .from('subjects')
          .select('id, code, name, resource_type')
          .in('id', subjectIds)
        if (subjectsErr) {
          console.error('[bulk] subjects query error:', subjectsErr)
          return { data: [] as any[] }
        }
        // Sort by display_order
        const orderMap = new Map<string, number | null>(offerings.map(o => [o.subject_id, o.display_order]))
        const sorted = (subjects || []).slice().sort((a: any, b: any) => {
          const oa = orderMap.get(a.id)
          const ob = orderMap.get(b.id)
          if (oa === ob) {
            return a.id.localeCompare(b.id)
          }
          if (oa == null) return -1
          if (ob == null) return 1
          return oa - ob
        })
        return { data: sorted }
      })

      const duration = Date.now() - secStart
      return { ...result, _meta: { durationMs: duration } }
    })()

    // Static data
    const staticPromise = (async () => {
      const secStart = Date.now()
      const res = await getOrSetCache('static:data', 86400, async () => { // 24 hours
        return await Promise.all([
          supabase.from('branches').select('*'),
          supabase.from('years').select('*'),
          supabase.from('semesters').select('*')
        ])
      })
      t.staticMs = Date.now() - secStart
      return res
    })()

    // Dynamic data
    const dynamicPromise = (async () => {
      const secStart = Date.now()
      const cacheKey = `dynamic:${branchCode || 'all'}:${currentYear || 'all'}`

      const result = await getOrSetCache(cacheKey, 300, async () => { // 5 minutes
        // Dates for exams window
        const start = new Date()
        start.setUTCHours(0, 0, 0, 0)
        const end = new Date(start)
        end.setUTCDate(end.getUTCDate() + 5)
        const startDateStr = start.toISOString().slice(0, 10)
        const endDateStr = end.toISOString().slice(0, 10)

        // Get users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // recent_updates: filter by context when available; else return latest
        let recentUpdatesQuery = supabase
          .from('recent_updates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
        if (branchCode && currentYear) {
          recentUpdatesQuery = recentUpdatesQuery.eq('branch', branchCode).eq('year', currentYear)
        }

        // exams
        let examsQuery = supabase
          .from('exams')
          .select('subject, exam_date, year, branch')
          .gte('exam_date', startDateStr)
          .lte('exam_date', endDateStr)
          .order('exam_date', { ascending: true })
        if (branchCode) examsQuery = examsQuery.eq('branch', branchCode)
        if (currentYear) examsQuery = examsQuery.eq('year', currentYear)

        // reminders
        let remindersQuery = supabase
          .from('reminders')
          .select('*')
          .is('deleted_at', null)
          .gte('due_date', startDateStr)
          .order('due_date', { ascending: true })
          .limit(5)
        if (branchCode && currentYear) {
          remindersQuery = remindersQuery.eq('branch', branchCode).eq('year', currentYear)
        }

        const [recentUpdates, upcomingExams, upcomingReminders] = await Promise.all([
          recentUpdatesQuery,
          examsQuery,
          remindersQuery
        ])

        return { recentUpdates, upcomingExams, upcomingReminders, usersCount }
      })

      t.dynamicMs = Date.now() - secStart
      return result
    })()

    // Resources data
    // Requires IDs
    const resourcesPromise = (async () => {
      const secStart = Date.now()
      if (!branchId || !yearId || !semesterId) return {}

      const cacheKey = `resources:${branchId}:${yearId}:${semesterId}`
      const grouped = await getOrSetCache(cacheKey, 3600, async () => { // 1 hour
        const { data: resources, error } = await supabase
          .from('resources')
          .select('*')
          .eq('branch_id', branchId)
          .eq('year_id', yearId)
          .or(`semester_id.eq.${semesterId},semester_id.is.null`)
          .order('unit', { ascending: true })
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[bulk] resources query error:', error)
          return {}
        }

        // Group by category and subject
        const grouped = {} as Record<string, Record<string, any[]>>
        (resources || []).forEach((r: any) => {
          if (!grouped[r.subject]) grouped[r.subject] = {}
          if (!grouped[r.subject][r.category]) grouped[r.subject][r.category] = []
          grouped[r.subject][r.category].push(r)
        })

        return grouped
      })

      t.resourcesMs = Date.now() - secStart
      return grouped
    })()

    const [subjectsResult, staticResults, dynamicResults, resourcesResult] = await Promise.all([
      subjectsPromise,
      staticPromise,
      dynamicPromise,
      resourcesPromise
    ])
    t.subjectsMs = (subjectsResult as any)?._meta?.durationMs ?? t.subjectsMs

    const [branches, years, semesters] = staticResults
    const { recentUpdates, upcomingExams, upcomingReminders, usersCount } = dynamicResults

    // Construct response
    // We return profile: null to indicate no DB profile was fetched
    const responseBody = {
      profile: null,
      subjects: subjectsResult.data || [],
      static: {
        branches: branches?.data || [],
        years: years?.data || [],
        semesters: semesters?.data || []
      },
      dynamic: {
        recentUpdates: recentUpdates?.data || [],
        upcomingExams: upcomingExams?.data || [],
        upcomingReminders: upcomingReminders?.data || [],
        usersCount: usersCount || 0
      },
      resources: resourcesResult || {},
      contextWarnings: [], // No DB warnings
      timestamp: Date.now(),
      meta: {
        loadedInMs: Date.now() - startTime,
        timings: {
          profileMs: t.profileMs,
          subjectsMs: t.subjectsMs,
          staticMs: t.staticMs,
          dynamicMs: t.dynamicMs,
          resourcesMs: t.resourcesMs,
        }
      }
    }

    return NextResponse.json(responseBody)
  } catch (error: any) {
    console.error('Bulk fetch error:', error)
    const message = typeof error?.message === 'string' ? error.message : 'Failed to fetch data'
    return errorResponse('INTERNAL_ERROR', message, 500)
  }
}
