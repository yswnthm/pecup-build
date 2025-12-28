'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ProfileProvider } from '@/lib/enhanced-profile-context'
import { Toaster } from '@/components/ui/toaster'
import CacheDebugger from '@/components/CacheDebugger'
import { CACHE_TTL } from '@/lib/constants'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE_TTL.RESOURCES * 1000,
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
        refetchOnWindowFocus: false, // Prevent excessive refetching
        retry: 1,
      },
    },
  }))

  return (
    <Suspense>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <CacheDebugger />
            <Toaster />
          </ThemeProvider>
        </ProfileProvider>
      </QueryClientProvider>
    </Suspense>
  )
}
