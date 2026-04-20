'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/supabase'
import Link from 'next/link'

// Standard email regex that accepts all valid email formats
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitAttempted = useRef(false)
  const router = useRouter()

  const validateEmail = (emailValue: string) => {
    if (!emailValue) {
      setEmailError(null)
      return false
    }

    if (!EMAIL_REGEX.test(emailValue)) {
      setEmailError('Email is invalid')
      return false
    }

    setEmailError(null)
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    validateEmail(value)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isSubmitting || submitAttempted.current) {
      return
    }

    setError(null)

    // Validate email before submission
    if (!validateEmail(email)) {
      return
    }

    // Mark submission as attempted and set loading state immediately
    submitAttempted.current = true
    setIsSubmitting(true)
    setLoading(true)

    try {
      const { data, error: authError } = await signUp(email, password)

      if (authError) {
        // Handle rate limit errors specifically
        if (authError.message.includes('rate limit') || authError.message.includes('too many')) {
          setError('Too many signup attempts. Please try again in a few minutes.')
        } else {
          setError(authError.message)
        }
        
        // Allow retry after error
        submitAttempted.current = false
        setIsSubmitting(false)
        setLoading(false)
        return
      }

      if (data.user) {
        // After email confirmation, user will be redirected to /dashboard
        router.push('/auth/confirm-email')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      submitAttempted.current = false
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  const isFormDisabled = loading || isSubmitting

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card/40 border border-border/30 rounded-3xl p-8 backdrop-blur-sm space-y-6">
          <div>
            <h1 className="text-3xl font-black text-foreground">Create Account</h1>
            <p className="text-muted-foreground mt-2">Join VRRA and start tracking your fitness</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 animate-fadeIn">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
                placeholder="your@email.com"
                disabled={isFormDisabled}
                className={`w-full bg-card/60 border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  emailError ? 'border-destructive/50' : 'border-border/30'
                }`}
                required
              />
              {emailError && (
                <p className="text-sm text-destructive mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isFormDisabled}
                className="w-full bg-card/60 border border-border/30 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isFormDisabled || !!emailError}
              aria-busy={isSubmitting}
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-3 rounded-lg hover:shadow-[0_0_32px_rgba(156,204,102,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
