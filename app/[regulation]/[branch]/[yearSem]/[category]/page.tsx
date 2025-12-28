'use client'

import Link from "next/link"
import { Header } from '@/components/Header'

import { ChevronRight, Users, Loader2 } from "lucide-react"
import { Badge } from '@/components/ui/badge'
import { useEffect, useState, use } from 'react'
import { useProfile } from '@/lib/enhanced-profile-context'
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { generateBreadcrumbs } from '@/lib/navigation-utils'
import ResourcesFiltersClient from '@/app/resources/[category]/ResourcesFiltersClient'
import { CATEGORY_TITLES, CATEGORY_DESCRIPTIONS } from '@/lib/constants'

export default function ContextCategoryPage({ params }: {
  params: Promise<{ regulation: string; branch: string; yearSem: string; category: string }>
}) {
  const { profile } = useProfile()
  const unwrappedParams = use(params)
  const { regulation, branch, yearSem, category } = unwrappedParams



  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'student':
        return null
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

  if (!CATEGORY_TITLES[category as keyof typeof CATEGORY_TITLES]) {
    notFound()
  }
  const categoryTitle = CATEGORY_TITLES[category as keyof typeof CATEGORY_TITLES];
  const categoryDescription = CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS];

  const breadcrumbs = generateBreadcrumbs(regulation, branch, yearSem, category)

  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      <Header />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb items={breadcrumbs} />
          </div>
          <div className="flex items-center gap-4">
            {profile?.role && getRoleDisplay(profile.role)}
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
          context={{
            regulation,
            branch,
            yearSem
          }}
        />

      </div>
    </div>
  )
}
