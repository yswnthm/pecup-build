import { NextResponse } from 'next/server'

import { createSupabaseAdmin } from '@/lib/supabase'
import { getOrSetCache } from '@/lib/redis'
import { apiError } from '@/lib/api-utils'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  let year = url.searchParams.get('year')
  const branchRaw = url.searchParams.get('branch')
  let semester = url.searchParams.get('semester')
  const regulationRaw = url.searchParams.get('regulation')
  const resourceType = url.searchParams.get('resource_type') // 'resources', 'records', or null for all

  // Normalize inputs to match DB case (uppercase)
  let branch = branchRaw ? branchRaw.toUpperCase() : null
  let regulation = regulationRaw ? regulationRaw.toUpperCase() : null

  // Normalize params for cache key
  const regulationKey = regulation || 'default'
  const yearKey = year || 'default'
  const branchKey = branch || 'default'
  const semesterKey = semester || 'default'
  const typeKey = resourceType || 'all'
  const cacheKey = `subjects:v2:${regulationKey}:${branchKey}:${yearKey}:${semesterKey}:${typeKey}`

  try {
    const data = await getOrSetCache(cacheKey, 3600, async () => { // Cache for 1 hour
      const supabase = createSupabaseAdmin()

      console.log(`[DEBUG] Initial params - regulation: ${regulation}, year: ${year}, branch: ${branch}, semester: ${semester}`)

      // Infer from profile ONLY if not provided in URL
      if (!year || !branch || !semester) {
        if (!semester) {
          // Default to Semester 1 when not specified
          semester = '1'
        }
      }

      // Default regulation if not provided
      const targetRegulation = regulation || 'R23'

      console.log(`[DEBUG] Final params - regulation: ${targetRegulation}, year: ${year}, branch: ${branch}, semester: ${semester}, resource_type: ${resourceType}`)

      if (!year || !branch || !semester) {
        // Return null to indicate missing context (will be handled outside)
        return { error: 'Missing context (year/branch/semester).', status: 400 }
      }

      // Try to get subjects from subject_offerings first (proper way)
      console.log(`[DEBUG] Subjects API - Looking for offerings: regulation=${targetRegulation}, year=${year}, branch=${branch}, semester=${semester}`)

      // Get subject_offerings first
      const { data: offeringsData, error: offeringsError } = await supabase
        .from('subject_offerings')
        .select('subject_id, display_order')
        .eq('regulation', targetRegulation)
        .eq('year', parseInt(year, 10))
        .eq('branch', branch)
        .eq('semester', parseInt(semester, 10))
        .eq('active', true)
        .order('display_order', { ascending: true })

      console.log(`[DEBUG] Subjects API - Found ${offeringsData?.length || 0} offerings:`, offeringsData)

      // Handle database query error
      if (offeringsError) {
        console.error(`[ERROR] Subjects API - Database error:`, offeringsError)
        return {
          error: 'Database error occurred while fetching subjects',
          details: offeringsError.message,
          status: 500
        }
      }

      if (!offeringsData || offeringsData.length === 0) {
        console.log(`[DEBUG] Subjects API - No offerings found for context, falling back to resources table`)

        // Fallback: try to find subjects from resources for this context so frontend still shows available subjects
        try {
          let resourcesQuery = supabase
            .from('resources')
            .select('subject')
            .eq('category', 'notes')
            .eq('unit', 1)
            .neq('subject', null)
            .limit(1000)

          // Apply context filters if available
          if (branch) resourcesQuery = resourcesQuery.eq('branch', branch)
          if (year) resourcesQuery = resourcesQuery.eq('year', parseInt(year, 10))
          if (semester) resourcesQuery = resourcesQuery.eq('semester', parseInt(semester, 10))

          const { data: resourcesData, error: resourcesError } = await resourcesQuery
          if (resourcesError) {
            console.warn('[DEBUG] Subjects API - resources fallback query failed:', resourcesError)
            return { subjects: [] }
          }

          const uniqueCodes = Array.from(new Set((resourcesData || []).map((r: any) => (r.subject || '').toUpperCase()).filter(Boolean)))
          const subjects = uniqueCodes.map((code: string) => ({ code, name: code, resource_type: 'resources' }))
          console.log(`[DEBUG] Subjects API - Returning ${subjects.length} subjects from resources fallback`)
          return { subjects }
        } catch (e) {
          console.warn('[DEBUG] Subjects API - resources fallback unexpected error', e)
          return { subjects: [] }
        }
      }

      // Get subjects separately with resource_type filtering
      const subjectIds = offeringsData.map((offering: any) => offering.subject_id)
      let subjectsQuery = supabase
        .from('subjects')
        .select('id, code, name, resource_type')
        .in('id', subjectIds)

      // Apply resource_type filter if specified
      if (resourceType && (resourceType === 'resources' || resourceType === 'records')) {
        subjectsQuery = subjectsQuery.eq('resource_type', resourceType)
      }

      const { data: subjectsData, error: subjectsError } = await subjectsQuery

      if (subjectsError) {
        console.error(`[ERROR] Subjects API - Failed to fetch subjects:`, subjectsError)
        return {
          error: 'Database error occurred while fetching subjects',
          details: subjectsError.message,
          status: 500
        }
      }

      // Map subjects back to offerings order
      const subjectMap = new Map(subjectsData?.map((s: any) => [s.id, s]) || [])
      const subjects = offeringsData
        .map((offering: any) => subjectMap.get(offering.subject_id))
        .filter(Boolean)
        .map((subject: any) => ({
          code: subject.code,
          name: subject.name,
          resource_type: subject.resource_type
        }))

      console.log(`[DEBUG] Subjects API - Returning ${subjects.length} subjects from offerings (filtered by resource_type: ${resourceType}):`, subjects)
      return { subjects }
    })

    if (data.error) {
      return apiError(data.error, data.status || 500, undefined, data.details)
    }

    return NextResponse.json(data)
  } catch (e) {
    return apiError('Unexpected server error', 500)
  }
}


