"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import type { Subject } from '@/lib/enhanced-profile-context'
import { getResourceTypeForCategory } from '@/lib/resource-utils'
import { useProfile } from '@/lib/enhanced-profile-context'
import { useSubjects } from '@/hooks/use-academic-data'
import { getSubjectDisplay } from '@/lib/subject-display'

type ResourceSubject = Subject

interface ResourcesFiltersClientProps {
  category: string
  categoryData: {
    title: string
    description: string
  }
  context?: {
    regulation: string
    branch: string
    yearSem: string
  }
}

export default function ResourcesFiltersClient({ category, categoryData, context }: ResourcesFiltersClientProps) {
  const searchParams = useSearchParams()
  const { profile } = useProfile()

  // Determine context params
  const contextParams = useMemo(() => {
    let year: string | number | null | undefined = searchParams.get('year')
    let branch: string | null | undefined = searchParams.get('branch')
    let semester: string | number | null | undefined = searchParams.get('semester')
    let regulation: string | null | undefined = searchParams.get('regulation')

    if (context) {
      branch = context.branch
      regulation = context.regulation
      if (context.yearSem.length === 2) {
        year = context.yearSem.charAt(0)
        semester = context.yearSem.charAt(1)
      }
    } else if (!year && !branch && profile) {
      year = profile.year
      branch = profile.branch
      semester = profile.semester
    }

    return { year, branch, semester, regulation }
  }, [searchParams, context, profile])

  const { year, branch, semester, regulation } = contextParams

  const resourceType = useMemo(() => getResourceTypeForCategory(category), [category])

  const { data: subjectsData, isLoading } = useSubjects({
    year,
    branch,
    semester,
    regulation, 
    resourceType: resourceType || undefined,
    enabled: !!year && !!branch && !!semester
  })

  const subjects = useMemo(() => subjectsData?.subjects || [], [subjectsData])

  const getSubjectHref = useCallback((s: ResourceSubject) => {
    if (context) {
      return `/${context.regulation}/${context.branch}/${context.yearSem}/${category}/${encodeURIComponent(s.code.toLowerCase())}`
    } else {
      const qp = new URLSearchParams()
      if (year) qp.set('year', String(year))
      if (semester) qp.set('semester', String(semester))
      if (branch) qp.set('branch', branch || '')
      const q = qp.toString()
      return `/resources/${category}/${encodeURIComponent(s.code.toLowerCase())}${q ? `?${q}` : ''}`
    }
  }, [context, category, year, semester, branch])

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoading && subjects.map((s: ResourceSubject) => (
          <Link key={s.code} href={getSubjectHref(s)} className="block">
            <Card className="h-full transition-all-smooth hover-lift">
              <CardHeader>
                <CardTitle>{getSubjectDisplay(s, true)}</CardTitle>
                <CardDescription>Explore resources and tools for {categoryData.title.toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <ChevronRight className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
        {!isLoading && subjects.length === 0 && (
          <div className="text-sm text-muted-foreground col-span-full text-center p-8">
            No subjects found for {branch?.toUpperCase()} {year}-{semester}.
          </div>
        )}
        {isLoading && (
          <>
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent className="flex justify-end">
                <Skeleton className="h-5 w-5" />
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-36" />
              </CardHeader>
              <CardContent className="flex justify-end">
                <Skeleton className="h-5 w-5" />
              </CardContent>
            </Card>
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-44" />
              </CardHeader>
              <CardContent className="flex justify-end">
                <Skeleton className="h-5 w-5" />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
