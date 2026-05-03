'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function WorkoutHistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    loadWorkoutHistory()
  }, [])

  const loadWorkoutHistory = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('workout_history')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    if (!error && data) {
      setHistory(data)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-5 pb-24">
      <button onClick={() => router.back()} className="mb-6 text-white/70">
        ← Back
      </button>

      <h1 className="text-3xl font-black mb-2">Workout History</h1>
      <p className="text-white/50 mb-6">Your completed workout records</p>

      {history.length === 0 ? (
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-center">
          <p className="text-xl font-bold">No workout history yet</p>
          <p className="text-white/50 mt-2">
            Complete a workout to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-white/5 border border-white/10 p-5"
            >
              <h2 className="text-lg font-bold">{item.workout_name}</h2>
              <p className="text-white/50 text-sm mb-4">
                {new Date(item.completed_at).toLocaleDateString()}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/5 p-3 text-center">
                  <p className="text-xl font-bold">{item.total_exercises}</p>
                  <p className="text-white/50 text-xs">Exercises</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-3 text-center">
                  <p className="text-xl font-bold">{item.total_sets}</p>
                  <p className="text-white/50 text-xs">Sets</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-3 text-center">
                  <p className="text-xl font-bold">{item.calories}</p>
                  <p className="text-white/50 text-xs">Calories</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}