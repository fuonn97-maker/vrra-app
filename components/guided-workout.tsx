'use client'

import { useEffect, useState } from 'react'

type Exercise = {
  name: string
  sets: number | null
  reps: number | null
  note?: string
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
      }
    }
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-6 p-6">
        <h1 className="text-3xl font-black">🎉 Workout Complete</h1>

        <p className="text-foreground/60">
          You finished {workoutName} 💪
        </p>

        <button
          onClick={onClose}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold"
        >
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-bold">{workoutName}</h1>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="w-full h-2 bg-background/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="text-center space-y-6">
        <p className="text-sm text-foreground/50">
          {isResting ? 'Rest' : 'Exercise'}
        </p>

        {current.video && (
          <div className="flex justify-center mb-4">
            <video
              key={current.video}
              src={current.video}
              autoPlay
              loop
              muted
              playsInline
              className="w-56 h-56 object-cover rounded-2xl"
            />
          </div>
        )}

        <h2 className="text-3xl font-black">{current.name}</h2>

        <p className="text-foreground/60">
          Set {setCount} {current.sets ? `/ ${current.sets}` : ''}
        </p>

        <div className="text-6xl font-black">
          {`${timer}s`}
        </div>

        {isResting && (
          <div className="space-y-2">
            <p className="text-lg font-black text-primary">Recover</p>
            <p className="text-sm text-foreground/60">
              Next: {nextExercise?.name || current.name}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => {
            if (!isRunning) {
              if (timer <= 0) {
                setTimer(30)
              }
              setIsRunning(true)
            } else {
              setIsRunning(false)
            }
          }}
          className="w-full bg-primary text-white py-3 rounded-xl font-bold"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <button
          onClick={handleNext}
          className="w-full bg-secondary text-white py-3 rounded-xl"
        >
          Skip
        </button>
      </div>
    </div>
  )
}