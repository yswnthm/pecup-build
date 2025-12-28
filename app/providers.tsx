'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, Suspense } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { ProfileProvider } from '@/lib/enhanced-profile-context'
import { Toaster } from '@/components/ui/toaster'
import CacheDebugger from '@/components/CacheDebugger'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
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
