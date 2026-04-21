'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Dumbbell, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function WorkoutPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCompleteWorkout = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('No user found:', userError)
        setLoading(false)
        return
      }

      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('workouts_completed')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        console.error('Fetch profile error:', fetchError)
        setLoading(false)
        return
      }

      const nextCount = (profile?.workouts_completed || 0) + 1

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ workouts_completed: nextCount })
        .eq('id', user.id)

      if (updateError) {
        console.error('Workout update error:', updateError)
        setLoading(false)
        return
      }

      console.log('Workout completed successfully')
      router.replace('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Workout error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="mx-auto max-w-md">
        <button
          onClick={() => router.push('/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-lime-500/20 p-3">
              <Dumbbell className="text-lime-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Today&apos;s Workout</h1>
              <p className="text-sm text-gray-400">
                Complete your workout and build your streak
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-2xl bg-black/30 p-4">
            <p className="text-sm text-gray-300">Suggested workout</p>
            <div className="mt-3 space-y-2 text-base">
              <p>• 20 Jumping Jacks</p>
              <p>• 15 Squats</p>
              <p>• 10 Push-ups</p>
              <p>• 30-second Plank</p>
            </div>
          </div>

          <button
            onClick={handleCompleteWorkout}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-500 px-4 py-4 text-lg font-bold text-black transition hover:bg-lime-400 disabled:opacity-50"
          >
            <CheckCircle size={20} />
            {loading ? 'Completing...' : 'Complete Workout'}
          </button>
        </div>
      </div>
    </div>
  )
}
