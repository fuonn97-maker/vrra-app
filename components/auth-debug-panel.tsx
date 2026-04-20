'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<{
    isLoggedIn: boolean
    userEmail: string | null
    userId: string | null
    sessionExists: boolean
    accessTokenExists: boolean
  }>({
    isLoggedIn: false,
    userEmail: null,
    userId: null,
    sessionExists: false,
    accessTokenExists: false,
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      setDebugInfo({
        isLoggedIn: !!user,
        userEmail: user?.email || null,
        userId: user?.id || null,
        sessionExists: !!session,
        accessTokenExists: !!session?.access_token,
      })
    } catch (error) {
      console.error('[v0] Auth debug error:', error)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-xs z-50 border border-red-500/50">
      <div className="font-bold text-red-400 mb-2">🔧 AUTH DEBUG</div>
      <div>isLoggedIn: <span className={debugInfo.isLoggedIn ? 'text-green-400' : 'text-red-400'}>{String(debugInfo.isLoggedIn)}</span></div>
      <div>email: <span className="text-blue-400 truncate">{debugInfo.userEmail || 'null'}</span></div>
      <div>userId: <span className="text-blue-400 truncate">{debugInfo.userId?.slice(0, 8) || 'null'}...</span></div>
      <div>session: <span className={debugInfo.sessionExists ? 'text-green-400' : 'text-red-400'}>{String(debugInfo.sessionExists)}</span></div>
      <div>token: <span className={debugInfo.accessTokenExists ? 'text-green-400' : 'text-red-400'}>{String(debugInfo.accessTokenExists)}</span></div>
    </div>
  )
}
