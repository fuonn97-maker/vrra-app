'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Exercise = {
  name: string
  sets: number | null
  reps: number | null
  note?: string
  target?: string
  video?: string
}

interface Props {
  exercises: Exercise[]
  workoutName: string
  onClose: () => void
}

export default function GuidedWorkout({ exercises, workoutName, onClose }: Props) {
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [setCount, setSetCount] = useState(1)
  const [timer, setTimer] = useState(30)
  const [isRunning, setIsRunning] = useState(false)
  const [isResting, setIsResting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const current = exercises[exerciseIndex]
  const nextExercise = exercises[exerciseIndex + 1]
  const saveWorkoutCompleted = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('workouts_completed')
    .eq('id', user.id)
    .single()

  const currentCount = profile?.workouts_completed || 0

  await supabase
    .from('profiles')
    .update({
      workouts_completed: currentCount + 1,
    })
    .eq('id', user.id)
}

  const progress =
    ((exerciseIndex + setCount / (current.sets || 1)) / exercises.length) * 100

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleNext()
          return isResting ? 30 : 15
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isResting, exerciseIndex, setCount])

  const handleNext = () => {
    if (isResting) {
      setIsResting(false)
      setTimer(30)
      return
    }

    if (current.sets && setCount < current.sets) {
      setSetCount(setCount + 1)
      setIsResting(true)
      setTimer(15)
    } else {
      if (exerciseIndex < exercises.length - 1) {
        setExerciseIndex(exerciseIndex + 1)
        setSetCount(1)
        setIsResting(false)
        setTimer(30)
      } else {
        setIsFinished(true)
        setIsRunning(false)
        saveWorkoutCompleted()
      }
    }
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col items-center justify-center text-center p-6 space-y-8">
        <div className="space-y-4">
          <div className="text-7xl animate-bounce">🎉</div>

          <h1 className="text-4xl font-black">
            Workout Complete
          </h1>

          <p className="text-white/60">
            You finished {workoutName} 💪
          </p>

          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-2xl font-black">{exercises.length}</p>
              <p className="text-xs text-white/50">Moves</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-2xl font-black">🔥</p>
              <p className="text-xs text-white/50">Done</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-2xl font-black">+1</p>
              <p className="text-xs text-white/50">Workout</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full max-w-sm bg-primary text-white py-4 rounded-2xl font-black"
        >
          Back to Workout
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-5">
      {/* Top */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40">
              Guided Workout
            </p>
            <h1 className="text-lg font-black">
              {workoutName}
            </h1>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl"
          >
            ×
          </button>
        </div>

        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div
          className={`px-4 py-2 rounded-full text-xs font-black ${
            isResting
              ? 'bg-green-500/20 text-green-400'
              : 'bg-primary/20 text-primary'
          }`}
        >
          {isResting ? 'RECOVER' : 'EXERCISE'}
        </div>

        {current.video && (
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />

            <video
              key={current.video}
              src={current.video}
              autoPlay
              loop
              muted
              playsInline
              className="relative w-64 h-64 object-cover rounded-3xl border border-white/10 shadow-2xl"
            />
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-3xl font-black leading-tight">
            {current.name}
          </h2>

          <p className="text-white/50 text-sm">
            Set {setCount} {current.sets ? `/ ${current.sets}` : ''}
          </p>

          {current.target && (
            <p className="text-xs text-white/50">
              Target: <span className="text-white font-bold">{current.target}</span>
            </p>
          )}
        </div>

        <div
          className={`text-8xl font-black tracking-tight ${
            isResting ? 'text-green-400' : 'text-white'
          }`}
        >
          {timer}s
        </div>

        {isResting && (
          <div className="rounded-3xl bg-white/10 border border-white/10 px-5 py-4 max-w-sm w-full">
            <p className="text-green-400 font-black">
              Recover
            </p>
            <p className="text-sm text-white/60 mt-1">
              Next: {nextExercise?.name || current.name}
            </p>
          </div>
        )}

        {!isResting && current.note && (
          <div className="rounded-3xl bg-white/10 border border-white/10 px-5 py-4 max-w-sm w-full">
            <p className="text-sm text-white/60">
              💡 {current.note}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <button
          onClick={() => {
            if (!isRunning) {
              if (timer <= 0) setTimer(30)
              setIsRunning(true)
            } else {
              setIsRunning(false)
            }
          }}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${
            isRunning
              ? 'bg-white text-black'
              : 'bg-primary text-white'
          }`}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-bold bg-white/10 text-white border border-white/10"
        >
          Skip
        </button>
      </div>
    </div>
  )
}