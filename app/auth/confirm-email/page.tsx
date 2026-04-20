'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmEmailPage() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card/40 border border-border/30 rounded-3xl p-8 backdrop-blur-sm space-y-6 text-center">
          {loaded && (
            <>
              <div className="flex justify-center">
                <CheckCircle2 size={64} className="text-primary" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-black text-foreground">Check Your Email</h1>
                <p className="text-muted-foreground">
                  We've sent a confirmation link to your email address. Click it to verify your account.
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm text-foreground">
                <p>After confirming your email, you'll be able to sign in and start tracking your fitness immediately.</p>
              </div>

              <div className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">Didn&apos;t receive the email? Check your spam folder.</p>
                <Link
                  href="/auth/login"
                  className="block w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-3 rounded-lg hover:shadow-[0_0_32px_rgba(156,204,102,0.4)] transition-all"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
