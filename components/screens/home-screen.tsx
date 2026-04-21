'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RecentMeals from './recent-meals'

export default function HomeScreen() {
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScore()
  }, [])

  const fetchScore = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('scores')
        .select('body_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setScore(data.body_score)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="mx-auto max-w-md space-y-6">

        {/* 🔥 BODY SCORE */}
        <div className="text-center">
          <h2 className="text-sm text-gray-400">YOUR BODY SCORE</h2>

          <div className="mt-4 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full border border-white/10 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-lime-400">
                {loading ? '...' : score}
              </span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* 🍽 TODAY MEALS */}
        <div>
          <h2 className="text-lg font-bold mb-3">Today's Meals</h2>

          <RecentMeals />
        </div>

      </div>
    </div>
  )
}
