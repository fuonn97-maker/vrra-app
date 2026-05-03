'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProfileScreen from '@/components/screens/profile-screen'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <ProfileScreen user={user} />
}