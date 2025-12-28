"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useMemo } from 'react'
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
  let year: string | number | null | undefined = searchParams.get('year')
  let branch: string | null | undefined = searchParams.get('branch')
  let semester: string | number | null | undefined = searchParams.get('semester')

  if (context) {
    branch = context.branch
    // naive parsing of yearSem "31" -> year 3, sem 1
    if (context.yearSem.length === 2) {
        year = context.yearSem.charAt(0)
        semester = context.yearSem.charAt(1)
    }
  } else if (!year && !branch && profile) {
    // Fallback to profile if no explicit params
    year = profile.year
    branch = profile.branch
    semester = profile.semester
  }

  const resourceType = getResourceTypeForCategory(category)

  const { data: subjectsData, isLoading } = useSubjects({
    year,
    branch,
    semester,
    resourceType: resourceType || undefined,
    enabled: !!year && !!branch && !!semester
  })

  // useSubjects returns { subjects: [...] }
  const subjects = subjectsData?.subjects || []

  // If resourceType was passed to API, it's already filtered. 
  // But we can double check or just use it directly. 
  // The API filter logic matches the previous client-side logic.
  const filteredSubjects = subjects as ResourceSubject[]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {!isLoading && filteredSubjects.map((s: ResourceSubject) => {
        let href: string;
        
        if (context) {
          // Use hierarchical URL if context is provided
          href = `/${context.regulation}/${context.branch}/${context.yearSem}/${category}/${encodeURIComponent(s.code.toLowerCase())}`
        } else {
          // Fallback to legacy query params
          const qp = new URLSearchParams()
          // Use the resolved values for links to persist context
          if (year) qp.set('year', String(year))
          if (semester) qp.set('semester', String(semester))
          if (branch) qp.set('branch', branch || '')
          const q = qp.toString()
          href = `/resources/${category}/${encodeURIComponent(s.code.toLowerCase())}${q ? `?${q}` : ''}`
        }

        return (
          <Link key={s.code} href={href} className="block">
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
        )
      })}
      {!isLoading && filteredSubjects.length === 0 && (
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
