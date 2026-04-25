'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Crown, Check, Zap, TrendingUp, Lock } from 'lucide-react'

export default function PremiumPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
  checkAuth()
}, [])

const checkAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      router.push('/auth/login')
      return
    }

    setUser(session.user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (profileData?.is_premium) {
      setIsPremium(true)
    } else {
      setIsPremium(false)
    }

    setLoading(false)
  } catch (error) {
    console.error('Error checking auth:', error)
    router.push('/auth/login')
  }
}

const handleManageBilling = async () => {
  try {
    if (!user?.id) return

    const res = await fetch('/api/billing-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error || 'Unable to open billing portal')
    }
  } catch (error) {
    console.error('Manage billing error:', error)
    alert('Unable to open billing portal')
  }
}

const handleCheckout = async (plan: 'monthly' | 'yearly') => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    const priceId =
  plan === 'yearly'
    ? 'price_1TOYSuFBDuwVWXr2tbmEL2nU'
    : 'price_1TOYSuFBDuwVWXr2G09dTmtC'

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: session.user.id,
        userEmail: session.user.email,
        priceId,
      }),
    })

    const text = await res.text()
    console.log('Checkout status:', res.status)
    console.log('Checkout raw response:', text)

    const data = text ? JSON.parse(text) : {}

    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error || 'No checkout URL returned. Check terminal.')
    }
  } catch (error) {
    console.error('Checkout error:', error)
    alert('Checkout failed')
  }
}

if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />
    </div>
  )
}

  const features = [
    { icon: Zap, title: 'Unlimited Meal Scans', desc: 'Log unlimited meals daily without restrictions' },
    { icon: TrendingUp, title: 'Advanced Progress Insights', desc: 'AI-powered analysis of your nutrition patterns' },
    { icon: Zap, title: 'Smart AI Nutrition Feedback', desc: 'Personalized recommendations based on your data' },
    { icon: Lock, title: 'Full Analytics Access', desc: 'Deep dive into your nutritional trends and patterns' },
    { icon: Crown, title: 'Streak Protection', desc: 'Maintain your streaks with priority support' },
    { icon: Check, title: 'Priority Support', desc: 'Get help first from our support team' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background">
      {/* Header */}
      <div className="border-b border-primary/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-lg font-bold text-foreground">Premium Membership</h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
            <Crown size={18} className="text-primary" />
            <span className="text-sm font-semibold text-primary">Premium Member</span>
          </div>
          <h2 className="text-5xl font-black text-foreground mb-4 text-balance">
  {isPremium ? "You're a Premium Member" : "Unlock VRRA Premium"}
</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
  {isPremium
    ? 'Welcome to unlimited nutrition tracking with AI-powered insights and advanced analytics.'
    : 'Get unlimited meal scans, full guided workouts, video guides, timers, and premium progress tracking.'}
</p>
        </div>

        {isPremium ? (
  <div className="mb-16 p-8 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-3xl shadow-2xl">
    <div className="flex items-start gap-6">
      <div className="p-4 bg-primary/20 rounded-full">
        <Crown size={32} className="text-primary" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-primary mb-2">
          Premium Active
        </h3>

        <p className="text-muted-foreground mb-4">
          All premium features are unlocked and ready to use.
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg text-sm font-semibold text-primary transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  </div>
) : (
  <div className="mb-16 p-8 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-3xl shadow-2xl text-center">
    <Crown size={42} className="text-primary mx-auto mb-4" />

    <h3 className="text-3xl font-black text-primary mb-3">
      Start Premium
    </h3>

    <p className="text-muted-foreground mb-6">
      Unlock guided workouts, unlimited scans, and AI fitness tracking.
    </p>

    <button
      onClick={() => handleCheckout('monthly')}
      className="w-full mb-3 rounded-2xl bg-primary py-4 font-black text-black"
    >
      Monthly — USD 4.99
    </button>

    <button
      onClick={() => handleCheckout('yearly')}
      className="w-full rounded-2xl bg-white py-4 font-black text-black"
    >
      Yearly — USD 19.99
    </button>
  </div>
)}

        {/* Unlocked Features Grid */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8">Unlocked Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div
                  key={idx}
                  className="p-6 bg-card/40 border border-primary/10 rounded-2xl hover:border-primary/30 transition-all hover:bg-card/60"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon size={24} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Subscription Management Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8">Subscription Management</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Manage Subscription */}
            <div className="p-6 bg-card/40 border border-primary/10 rounded-2xl">
              <h4 className="font-semibold text-foreground mb-2">Manage Subscription</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Update your billing details, change your plan, or view billing history.
              </p>
              <button
  onClick={handleManageBilling}
  className="w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg text-sm font-semibold text-primary transition-all"
>
  Manage Billing
</button>
            </div>

            {/* Restore Purchase */}
            <div className="p-6 bg-card/40 border border-primary/10 rounded-2xl">
              <h4 className="font-semibold text-foreground mb-2">Restore Purchase</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Restore your premium access if you&apos;ve purchased on another device.
              </p>
              <button className="w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-lg text-sm font-semibold text-primary transition-all">
                Restore Access
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Section */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-8">Premium Dashboard</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Unlimited Scans Card */}
            <div className="p-6 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-2xl">
              <div className="text-3xl font-black text-emerald-400 mb-2">∞</div>
              <h4 className="font-semibold text-foreground mb-1">Unlimited Scans</h4>
              <p className="text-sm text-muted-foreground">No daily limits on meal logging</p>
            </div>

            {/* AI Insights Card */}
            <div className="p-6 bg-gradient-to-br from-blue-500/15 to-blue-500/5 border border-blue-500/30 rounded-2xl">
              <div className="text-2xl mb-2">🤖</div>
              <h4 className="font-semibold text-foreground mb-1">AI Insights</h4>
              <p className="text-sm text-muted-foreground">Smart nutrition recommendations</p>
            </div>

            {/* Priority Support Card */}
            <div className="p-6 bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 rounded-2xl">
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-semibold text-foreground mb-1">Priority Support</h4>
              <p className="text-sm text-muted-foreground">Get help when you need it</p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about your premium membership? <br />
            <button className="text-primary hover:text-primary/80 font-semibold">Contact support</button>
          </p>
        </div>
      </div>
    </div>
  )
}
