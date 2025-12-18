import { ReactNode } from 'react'
import { ProfileProvider } from '@/lib/enhanced-profile-context'

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  // Use Client-side ProfileProvider which will check for local profile or redirect.
  // We removed server-side session checks.

  return (
    <div className="w-full">
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </div>
  )
}
