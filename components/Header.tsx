'use client'
import { useEffect, useMemo, useState } from 'react'
import { useProfile } from '@/lib/enhanced-profile-context'
import { Skeleton } from '@/components/ui/skeleton'

export function Header() {
  // Debug logging
  console.log('[DEBUG] Header component rendering on page:', typeof window !== 'undefined' ? window.location.pathname : 'SSR')

  const { profile, loading: profileLoading } = useProfile()

  const displayName = profile?.name

  const showNameSkeleton = !displayName && profileLoading

  const metaLine = useMemo(() => {
    if (!profile?.year || !profile?.branch) return null
    const parts: string[] = [`Year ${profile.year}`]
    if (profile.semester) parts.push(`Sem ${profile.semester}`)
    parts.push(profile.branch)
    return parts.join(' • ')
  }, [profile])

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl md:text-3xl font-bold">
        Welcome, {showNameSkeleton ? (
          <span className="inline-flex align-middle"><Skeleton className="h-6 md:h-7 w-24 inline-block align-middle" /></span>
        ) : (
          <span>{displayName || 'User'}</span>
        )}
      </h1>
      {metaLine ? (
        <div className="text-sm text-muted-foreground">{metaLine}</div>
      ) : (
        profileLoading && (
          <div className="h-4 w-40"><Skeleton className="h-4 w-40" /></div>
        )
      )}
    </div>
  )
}