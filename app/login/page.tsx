'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loader from '@/components/Loader'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/onboarding')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Loader />
    </div>
  )
}