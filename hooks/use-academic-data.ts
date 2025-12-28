'use client'

import { useQuery } from '@tanstack/react-query'
import { Subject, Resource, Branch, Year, Semester } from '@/lib/types'

// Response types
interface SubjectsResponse {
  subjects: Pick<Subject, 'code' | 'name' | 'resource_type'>[]
}

interface StaticDataResponse {
  branches: Branch[]
  years: Year[]
  semesters: Semester[]
}

interface DynamicDataResponse {
  recentUpdates: any[] // TODO: Define strict type if needed
  upcomingExams: any[]
  usersCount: number
}

// Params
interface UseSubjectsParams {
  year?: string | number | null
  branch?: string | null
  semester?: string | number | null
  regulation?: string | null
  resourceType?: string | null
  enabled?: boolean
}

interface UseResourcesParams {
  category?: string
  subject?: string
  unit?: string | number
  year?: string | number | null
  branch?: string | null
  semester?: string | number | null
  regulation?: string | null
  enabled?: boolean
}

interface UseDynamicDataParams {
  branch?: string | null
  year?: string | number | null
  enabled?: boolean
}

// Hook: useSubjects
export function useSubjects({ year, branch, semester, regulation, resourceType, enabled = true }: UseSubjectsParams) {
  return useQuery({
    queryKey: ['subjects', year, branch, semester, regulation, resourceType],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (year) params.append('year', String(year))
      if (branch) params.append('branch', branch)
      if (semester) params.append('semester', String(semester))
      if (regulation) params.append('regulation', regulation)
      if (resourceType) params.append('resource_type', resourceType)

      const res = await fetch(`/api/subjects?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch subjects')
      }
      return res.json() as Promise<SubjectsResponse>
    },
    enabled: enabled && !!year && !!branch && !!semester,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

// Hook: useResources
export function useResources({ category, subject, unit, year, branch, semester, regulation, enabled = true }: UseResourcesParams) {
  return useQuery({
    queryKey: ['resources', category, subject, unit, year, branch, semester, regulation],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (subject) params.append('subject', encodeURIComponent(subject))
      if (unit) params.append('unit', String(unit))
      // Support both ID and code/number params (API handles both)
      if (year) params.append('year', String(year))
      if (branch) params.append('branch', branch)
      if (semester) params.append('semester', String(semester))
      if (regulation) params.append('regulation', regulation)

      const res = await fetch(`/api/resources?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch resources')
      }
      return res.json() as Promise<Resource[]>
    },
    enabled: enabled && !!category && !!subject,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Hook: useStaticData
function useStaticData() {
  return useQuery({
    queryKey: ['static-data'],
    queryFn: async () => {
      // leveraging the bulk endpoint for now as it caches static data effectively on server
      const res = await fetch('/api/fetch-academic-data')
      if (!res.ok) throw new Error('Failed to fetch static data')
      const data = await res.json()
      return data.static as StaticDataResponse
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

// Hook: useDynamicData
export function useDynamicData({ branch, year, enabled = true }: UseDynamicDataParams) {
  return useQuery({
    queryKey: ['dynamic-data', branch, year],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (branch) params.append('branch', branch)
      if (year) params.append('year', String(year))

      const res = await fetch(`/api/fetch-academic-data?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch dynamic data')
      const data = await res.json()
      return data.dynamic as DynamicDataResponse
    },
    enabled: enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
