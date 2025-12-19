'use client'

import { ThemeProvider } from '@/components/theme-provider'
import { ProfileProvider } from '@/lib/enhanced-profile-context'
import { Toaster } from '@/components/ui/toaster'
import CacheDebugger from '@/components/CacheDebugger'

import { Suspense } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Removed SessionProvider as we are using LocalProfileService
  return (
    <Suspense>
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
    </Suspense>
  )
}
