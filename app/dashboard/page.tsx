'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/app-header'
import HomeScreen from '@/components/screens/home-screen'
import ProgressScreen from '@/components/screens/progress-screen'
import WorkoutScreen from '@/components/screens/workout-screen'
import Navigation from '@/components/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [scansToday, setScansToday] = useState(0)
  const [isPremium, setIsPremium] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const MAX_SCANS = 3

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (activeTab === 'home') {
      if (user) {
        calculateTodayScans(user.id)
      }
      setRefreshKey((prev) => prev + 1)
    }
  }, [activeTab, user])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/auth/login')
      return
    }

    setUser(session.user)

    let { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

const now = new Date()

      if (
  profileData?.is_premium &&
  profileData?.premium_ends_at &&
  new Date(profileData.premium_ends_at) < now
) {
  await supabase
    .from('profiles')
    .update({
      is_premium: false,
    })
    .eq('id', session.user.id)

  profileData.is_premium = false
}

    if (error && error.code === 'PGRST116') {
      try {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            is_premium: false,
            scans_used: 0, // ✅ 统一这里
          })
          .select()
          .single()

        if (!createError) {
          profileData = newProfile
        } else {
          console.error('[v0] Error creating missing profile:', createError)
        }
      } catch (err) {
        console.error('[v0] Error in profile creation fallback:', err)
      }
    }

    if (profileData) {
      setProfile(profileData)
      setIsPremium(profileData.is_premium || false)
    }

    await calculateTodayScans(session.user.id)
    setLoading(false)
  }

  const calculateTodayScans = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('is_premium, free_scans_used') // ✅ 统一这里
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[v0] Error fetching profile for scans:', error)
        setScansToday(0)
        return
      }

      const scansUsed = profileData?.free_scans_used || 0 // ✅ 统一这里
      setScansToday(scansUsed)
    } catch (error) {
      console.error('[v0] Error in calculateTodayScans:', error)
      setScansToday(0)
    }
  }

  const handleScanAttempt = () => {
    router.push('/scan-meal')
  }

  const handleScanComplete = () => {
    if (user) {
      calculateTodayScans(user.id)
    }
    setRefreshKey((prev) => prev + 1)
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
  key={`home-${refreshKey}`}
  scansToday={scansToday}
  maxScans={MAX_SCANS}
  isPremium={isPremium}
  onWorkoutClick={() => setActiveTab('workout')}
/>
        )
      case 'progress':
        return <ProgressScreen />
      case 'workout':
        return <WorkoutScreen isPremium={isPremium} />
      default:
        return (
          <HomeScreen
  key={`home-${refreshKey}`}
  scansToday={scansToday}
  maxScans={MAX_SCANS}
  isPremium={isPremium}
  onWorkoutClick={() => setActiveTab('workout')}
/>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#0a0f1a] to-background flex flex-col">
      <AppHeader
        userEmail={user?.email || ''}
        isPremium={isPremium}
        scansUsed={scansToday}
        maxScans={MAX_SCANS}
      />

      <div className="flex-1 overflow-y-auto pb-24">{renderScreen()}</div>

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onScanClick={handleScanAttempt}
      />
    </div>
  )
}
