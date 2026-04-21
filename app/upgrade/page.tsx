'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, ArrowLeft, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PRICING_PLANS, PREMIUM_FEATURES, getPricingPlan, type BillingPeriod } from '@/lib/pricing-config'

declare global {
  interface Window {
    Stripe: any
  }
}

export default function UpgradePage() {
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [stripeLoaded, setStripeLoaded] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod>('monthly')

  // Load Stripe.js library only once
  useEffect(() => {
    // Check if Stripe is already loaded
    if (window.Stripe) {
      setStripeLoaded(true)
      return
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => setStripeLoaded(true))
      existingScript.addEventListener('error', () => {
        console.error('[v0] Failed to load Stripe.js')
        toast?.error?.('Failed to load payment system')
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = () => {
      console.log('[v0] Stripe.js loaded successfully')
      setStripeLoaded(true)
    }
    script.onerror = () => {
      console.error('[v0] Failed to load Stripe.js')
      toast?.error?.('Failed to load payment system')
    }
    document.head.appendChild(script)
  }, [])

  const handleCheckout = async () => {
    if (!stripeLoaded) {
      toast?.error?.('Payment system is loading. Please try again.')
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const plan = getPricingPlan(selectedPlan)
      console.log('[v0] Starting checkout for plan:', selectedPlan)
      console.log('[v0] Price ID:', plan.priceId)
      console.log('[v0] Display price:', plan.displayPrice)
      console.log('[v0] User ID:', user.id)

      // Call Stripe checkout endpoint with priceId and email
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, priceId: plan.priceId, userEmail: user.email }),
      })

      console.log('[v0] Checkout API response status:', response.status)

      const data = await response.json()
      console.log('[v0] Checkout API response data:', data)
      
      if (!response.ok || data.error) {
        const errorMsg = data.error || 'Unable to start checkout'
        toast?.error?.(errorMsg)
        console.error('[v0] Checkout API error:', errorMsg)
        setIsLoading(false)
        return
      }

      if (data.url) {
        console.log('[v0] Redirecting to Stripe Checkout:', data.url)
        window.location.href = data.url
      } else if (data.sessionId) {
        console.log('[v0] Creating Stripe instance and redirecting...')
        // Use the session ID with stripe.redirectToCheckout
        const stripe = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        
        if (error) {
          toast?.error?.('Unable to start checkout. Please try again.')
          console.error('[v0] Stripe redirect error:', error)
          setIsLoading(false)
        }
      } else {
        toast?.error?.('Unable to start checkout. Please try again.')
        console.error('[v0] No checkout URL or session ID in response')
        setIsLoading(false)
      }
    } catch (error) {
      toast?.error?.('Unable to start checkout. Please try again.')
      console.error('[v0] Checkout error:', error)
      setIsLoading(false)
    }
  }

  const monthlyPlan = getPricingPlan('monthly')
  const yearlyPlan = getPricingPlan('yearly')
  const currentPlan = getPricingPlan(selectedPlan)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-foreground/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-foreground">Premium Plan</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Zap size={24} />
            <span className="text-sm font-bold uppercase tracking-widest">Unlock Premium</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-balance leading-tight">
            Level Up Your Fitness
          </h1>
          <p className="text-xl text-foreground/70 text-balance">
            Get unlimited scans, advanced analytics, and AI-powered insights to transform your nutrition journey.
          </p>
        </div>
      </div>

      {/* Plan Selection */}
      <div className="px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Plan Toggle */}
          <div className="flex gap-4 mb-8 bg-card/50 border border-border/40 rounded-2xl p-1.5 w-fit mx-auto">
            {(['monthly', 'yearly'] as BillingPeriod[]).map(period => {
              const plan = getPricingPlan(period)
              const isSelected = selectedPlan === period
              return (
                <button
                  key={period}
                  onClick={() => setSelectedPlan(period)}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{plan.label}</span>
                    {plan.savings && isSelected && (
                      <span className="text-xs bg-primary/20 px-2 py-1 rounded-full text-primary font-bold">
                        {plan.savings}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Pricing Card */}
          <div className={`bg-gradient-to-br rounded-3xl p-8 backdrop-blur-sm space-y-8 transition-all duration-300 border ${
            selectedPlan === 'yearly'
              ? 'from-primary/20 to-secondary/10 border-primary/60 shadow-2xl shadow-primary/30 ring-2 ring-primary/50'
              : 'from-card/80 to-card/40 border-primary/30 shadow-lg shadow-primary/10'
          }`}>
            {/* Badge */}
            {currentPlan.badge && (
              <div className="flex justify-center">
                <span className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/40 text-primary">
                  {currentPlan.badge}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-6xl md:text-7xl font-black text-primary">{currentPlan.displayPrice}</span>
                <span className="text-lg text-foreground/60">{currentPlan.displayPeriod}</span>
              </div>
              {currentPlan.monthlyBreakdown && (
                <p className="text-sm font-semibold text-accent text-center">{currentPlan.monthlyBreakdown}</p>
              )}
              <p className="text-foreground/70 text-center text-sm">Cancel anytime. No commitment required.</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-y border-border/40">
              {PREMIUM_FEATURES.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-1.5 mt-1 flex-shrink-0">
                    <Check size={16} className="text-primary font-bold" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                    <p className="text-xs text-foreground/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary via-primary to-secondary text-primary-foreground font-bold py-4 px-6 rounded-2xl hover:shadow-[0_0_40px_rgba(156,204,102,0.5)] active:scale-95 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg uppercase tracking-wider"
            >
              {isLoading ? 'Redirecting to Payment...' : selectedPlan === 'monthly' ? 'Start Monthly Plan' : '🔥 Get Best Value (Save 66%)'}
            </button>

            {/* Security Note */}
            <div className="text-center space-y-2 text-sm text-foreground/60">
              <p>🔒 Secure checkout powered by Stripe</p>
              <p className="text-xs">Your payment information is encrypted and secure</p>
            </div>
          </div>

          {/* Value Props */}
          <div className="mt-16 space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-8">Why Premium?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3 text-left md:text-center">
                  <p className="text-4xl font-black text-primary">∞</p>
                  <p className="font-semibold text-foreground">Unlimited Scans</p>
                  <p className="text-sm text-foreground/60">Log as many meals as you want daily</p>
                </div>
                <div className="space-y-3 text-left md:text-center">
                  <p className="text-4xl font-black text-primary">📊</p>
                  <p className="font-semibold text-foreground">Deep Analytics</p>
                  <p className="text-sm text-foreground/60">AI-powered nutrition insights</p>
                </div>
                <div className="space-y-3 text-left md:text-center">
                  <p className="text-4xl font-black text-primary">🔐</p>
                  <p className="font-semibold text-foreground">Your Data</p>
                  <p className="text-sm text-foreground/60">100% encrypted and private</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="bg-gradient-to-br from-accent/15 to-primary/10 border border-primary/30 rounded-2xl p-8 text-center">
              <p className="text-foreground font-bold text-lg mb-2">Most users choose yearly for better results</p>
              <p className="text-sm text-foreground/60">Join thousands improving their fitness journey today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

