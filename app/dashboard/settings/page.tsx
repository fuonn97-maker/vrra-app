'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ChevronLeft, Save, Clock, Download, LogOut } from 'lucide-react'
import { useUserTimezone } from '@/hooks/use-user-timezone'

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
]

export default function SettingsPage() {
  const router = useRouter()
  const { userTimezone, setUserTimezone } = useUserTimezone()
  const [selectedTimezone, setSelectedTimezone] = useState(userTimezone || 'UTC')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setShowSaveSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      setSelectedTimezone(userTimezone || 'UTC')
      setIsLoading(false)
    }
    getUser()
  }, [userTimezone, router])

  const handleSaveTimezone = async () => {
    if (selectedTimezone === userTimezone) {
      return
    }

    setIsSaving(true)
    try {
      // Save to localStorage (can be extended to save to profiles table later)
      setUserTimezone(selectedTimezone)
      setShowSaveSuccess(true)
      setTimeout(() => setShowSaveSuccess(false), 3000)
      console.log('[v0] Timezone saved:', selectedTimezone)
    } catch (error) {
      console.error('[v0] Error saving timezone:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all user data
      const { data: scans } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const { data: scores } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      // Create JSON export
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        scans: scans || [],
        dailyScores: scores || [],
      }

      // Trigger download
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `nutrition-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('[v0] Data exported successfully')
    } catch (error) {
      console.error('[v0] Error exporting data:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('[v0] Error signing out:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card/30 rounded w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-card/30 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-card/30 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-600 text-sm">
            ✓ Timezone updated successfully
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Timezone Setting */}
          <div className="bg-card/40 border border-border/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={20} />
              <h2 className="text-lg font-semibold">Timezone</h2>
            </div>
            <p className="text-foreground/60 text-sm mb-4">
              Set your timezone to ensure meals and scores are recorded correctly for your location.
            </p>
            <div className="space-y-3">
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full bg-background border border-border/50 rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">Select a timezone...</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-foreground/50">
                Current timezone: <span className="font-mono">{userTimezone || 'Browser default'}</span>
              </p>
              <button
                onClick={handleSaveTimezone}
                disabled={isSaving || selectedTimezone === userTimezone}
                className="w-full bg-primary text-primary-foreground rounded-lg p-3 font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Timezone'}
              </button>
            </div>
          </div>

          {/* Data Export */}
          <div className="bg-card/40 border border-border/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download size={20} />
              <h2 className="text-lg font-semibold">Export Data</h2>
            </div>
            <p className="text-foreground/60 text-sm mb-4">
              Download all your nutrition data and daily scores as a JSON file for backup or analysis.
            </p>
            <button
              onClick={handleExportData}
              className="w-full bg-foreground/10 text-foreground rounded-lg p-3 font-medium hover:bg-foreground/20 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Export All Data
            </button>
          </div>

          {/* Account */}
          <div className="bg-card/40 border border-border/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <LogOut size={20} />
              <h2 className="text-lg font-semibold">Account</h2>
            </div>
            <p className="text-foreground/60 text-sm mb-4">
              Signed in as: <span className="font-mono text-foreground">{user?.email}</span>
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-lg p-3 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
