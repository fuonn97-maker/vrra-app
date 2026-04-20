import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  getBrowserTimezone,
  getUserTimezone,
  setUserTimezone,
  getSupportedTimezones,
  getTimezoneAbbr,
} from '@/lib/timezone-utils'

/**
 * Hook for managing user timezone preferences
 * Initializes from browser, can be synced with user profile
 */
export function useUserTimezone() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userTimezone, setUserTimezoneState] = useState<string>('UTC')
  const [browserTimezone] = useState(getBrowserTimezone())
  const [isLoading, setIsLoading] = useState(true)
  const [supportedTimezones] = useState(getSupportedTimezones())

  // Initialize timezone from Supabase user
  useEffect(() => {
    const initializeTimezone = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          setUserId(user.id)

          // In future, we can fetch from user profile:
          // const { data: profile } = await supabase
          //   .from('profiles')
          //   .select('timezone')
          //   .eq('id', user.id)
          //   .single()

          // For now, use browser timezone as default
          const timezone = browserTimezone || 'UTC'
          setUserTimezone(user.id, timezone)
          setUserTimezoneState(timezone)

          console.log('[v0] User timezone initialized:', timezone)
        }
      } catch (error) {
        console.error('[v0] Error initializing timezone:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeTimezone()
  }, [browserTimezone])

  const updateTimezone = (newTimezone: string) => {
    if (!supportedTimezones.includes(newTimezone)) {
      console.warn('[v0] Invalid timezone:', newTimezone)
      return false
    }

    if (userId) {
      setUserTimezone(userId, newTimezone)
    }
    setUserTimezoneState(newTimezone)
    console.log('[v0] Timezone updated to:', newTimezone)
    return true
  }

  const getTimezoneInfo = () => {
    const abbr = getTimezoneAbbr(userTimezone)
    return {
      timezone: userTimezone,
      abbreviation: abbr,
      browser: browserTimezone,
    }
  }

  return {
    userId,
    userTimezone,
    browserTimezone,
    isLoading,
    supportedTimezones,
    updateTimezone,
    getTimezoneInfo,
  }
}
