'use client'

import Link from "next/link"
import { Header } from '@/components/Header'

import { ChevronRight, Users, Loader2 } from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { use } from 'react'
import { useProfile } from '@/lib/enhanced-profile-context'
import { useDynamicData } from '@/hooks/use-academic-data'
import { notFound } from 'next/navigation'
import ResourcesFiltersClient from './ResourcesFiltersClient'
import { CATEGORY_TITLES, CATEGORY_DESCRIPTIONS } from '@/lib/constants'

export default function CategoryPage({ params, searchParams }: {
  params: Promise<{ category: string }>
  searchParams: { year?: string; semester?: string; branch?: string }
}) {
  const { profile } = useProfile()
  const unwrappedParams = use(params)
  
  // Use React Query for dynamic data (user count)
  // We don't strictly need branch/year for global user count, but passing them doesn't hurt if we want localized data later
  const { data: dynamicData } = useDynamicData({
    branch: profile?.branch,
    year: profile?.year
  })

  const usersCount = dynamicData?.usersCount || 0

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'student':
        return <Badge variant="secondary">Student</Badge>
      case 'representative':
        return <Badge variant="default">Representative</Badge>
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>
      case 'yeshh':
        return <Badge variant="destructive">Yeshh</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const { category } = unwrappedParams
  // const resolvedSearchParams = searchParams // unused

  if (!CATEGORY_TITLES[category as keyof typeof CATEGORY_TITLES]) {
    notFound()
  }
  const categoryTitle = CATEGORY_TITLES[category as keyof typeof CATEGORY_TITLES];
  const categoryDescription = CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS];

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      <Header />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-4 w-4" />
              <span aria-current="page">{categoryTitle}</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {profile?.role && getRoleDisplay(profile.role)}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
              <Users className="h-3 w-3 text-primary" />
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm">
                  {usersCount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">users</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-start justify-center">
            <h1 className="text-3xl font-bold tracking-tight text-center">{categoryTitle}</h1>
          </div>
          <p className="text-muted-foreground text-center">{categoryDescription}</p>
        </div>

        <ResourcesFiltersClient 
          category={category} 
          categoryData={{ title: categoryTitle, description: categoryDescription }} 
        />

      </div>
    </div>
  )
}