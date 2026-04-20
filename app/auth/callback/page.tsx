'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Initialize the auth session from URL parameters
        // Supabase automatically handles the redirect parameters in the URL
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // User successfully authenticated, redirect to dashboard
          router.push('/dashboard')
        } else {
          // No session found, redirect to login
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('[v0] Error in auth callback:', error)
        router.push('/auth/login')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Confirming your account...</p>
      </div>
    </div>
  )
}
