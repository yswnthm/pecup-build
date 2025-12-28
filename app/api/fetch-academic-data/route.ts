import { NextResponse, NextRequest } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { AcademicConfigManager } from '@/lib/academic-config'
import { getOrSetCache } from '@/lib/redis'
import { apiError } from '@/lib/api-utils'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const paramBranchCode = searchParams.get('branch')
  const paramYearString = searchParams.get('year')
  // const paramSemesterString = searchParams.get('semester') // Not needed for bulk static/dynamic

  const startTime = Date.now()
  const t = {
    profileStart: Date.now(),
    profileMs: 0,
    staticMs: 0,
    dynamicMs: 0,
  }

  try {
    const supabase = createSupabaseAdmin()
    // const academicConfig = AcademicConfigManager.getInstance() // Removed if unused

    // We no longer rely on DB profile. 
    // We expect the client to strictly provide the context.

    // However, for backward compatibility or robust data fetching, we try to interpret what we have.
    const currentYear = paramYearString ? parseInt(paramYearString) : null
    // const semesterNumber = paramSemesterString ? parseInt(paramSemesterString) : null
    const branchCode = paramBranchCode

    t.profileMs = 0 // Skipped profile fetch

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

        const [recentUpdates, upcomingExams] = await Promise.all([
          recentUpdatesQuery,
          examsQuery,
        ])

        return { recentUpdates, upcomingExams, usersCount }
      })

      t.dynamicMs = Date.now() - secStart
      return result
    })()

    const [staticResults, dynamicResults] = await Promise.all([
      staticPromise,
      dynamicPromise,
    ])

    const [branches, years, semesters] = staticResults
    const { recentUpdates, upcomingExams, usersCount } = dynamicResults

    // Construct response
    // We return profile: null to indicate no DB profile was fetched
    const responseBody = {
      profile: null,
      // subjects: [], // Removed
      static: {
        branches: branches?.data || [],
        years: years?.data || [],
        semesters: semesters?.data || []
      },
      dynamic: {
        recentUpdates: recentUpdates?.data || [],
        upcomingExams: upcomingExams?.data || [],
        usersCount: usersCount || 0
      },
      // resources: {}, // Removed
      contextWarnings: [], // No DB warnings
      timestamp: Date.now(),
      meta: {
        loadedInMs: Date.now() - startTime,
        timings: {
          profileMs: t.profileMs,
          staticMs: t.staticMs,
          dynamicMs: t.dynamicMs,
        }
      }
    }

    return NextResponse.json(responseBody)
  } catch (error: any) {
    console.error('Bulk fetch error:', error)
    const message = typeof error?.message === 'string' ? error.message : 'Failed to fetch data'
    return apiError(message, 500, 'INTERNAL_ERROR')
  }
}
