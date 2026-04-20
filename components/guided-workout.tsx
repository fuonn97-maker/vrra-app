'use client'

import { useState } from 'react'
import { ChevronRight, Check } from 'lucide-react'

interface Exercise {
  name: string
  sets: number
  reps: number | null
  note?: string
}

interface GuidedWorkoutProps {
  exercises: Exercise[]
  workoutName: string
  onClose: () => void
}

export default function GuidedWorkout({ exercises, workoutName, onClose }: GuidedWorkoutProps) {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [isComplete, setIsComplete] = useState(false)

  const totalExercises = exercises.length
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const currentExercise = exercises[currentExerciseIdx]
  const currentExerciseSets = currentExercise.sets

  // Calculate overall progress
  let completedSets = 0
  for (let i = 0; i < currentExerciseIdx; i++) {
    completedSets += exercises[i].sets
  }
  completedSets += currentSet - 1
  const progressPercentage = Math.round((completedSets / totalSets) * 100)

  const handleDoneSet = () => {
    if (currentSet === currentExerciseSets) {
      // Move to next exercise
      if (currentExerciseIdx === totalExercises - 1) {
        // Workout complete
        setIsComplete(true)
      } else {
        setCurrentExerciseIdx(currentExerciseIdx + 1)
        setCurrentSet(1)
      }
    } else {
      // Move to next set
      setCurrentSet(currentSet + 1)
    }
  }

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-background border border-primary/30 rounded-3xl p-8 max-w-sm w-full space-y-6 text-center">
          <div className="text-6xl">🔥</div>
          <h2 className="text-3xl font-black text-primary">Workout Complete!</h2>
          <p className="text-lg text-foreground/70">Great job! Keep going!</p>
          <div className="space-y-3 pt-4">
            <p className="text-2xl font-bold text-foreground">
              {totalExercises} exercises completed
            </p>
            <p className="text-sm text-foreground/60">{totalSets} total sets</p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-all"
          >
            Back to Workout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-primary/30 rounded-3xl p-8 max-w-sm w-full space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-primary">{workoutName}</h2>
          <p className="text-sm text-foreground/60">
            Exercise {currentExerciseIdx + 1} of {totalExercises}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">Workout Progress</span>
            <span className="font-bold text-primary">{progressPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Exercise Card */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-foreground">{currentExercise.name}</h3>
            <p className="text-sm text-foreground/60">
              Set {currentSet} of {currentExerciseSets}
            </p>
          </div>

          <div className="flex items-center gap-4 text-lg font-semibold text-primary">
            {currentExercise.reps && (
              <div className="flex items-center gap-2">
                <span>🔄</span>
                <span>{currentExercise.reps} reps</span>
              </div>
            )}
            {currentExercise.note && (
              <div className="text-sm text-foreground/70 italic">({currentExercise.note})</div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDoneSet}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-lg"
        >
          <Check size={24} />
          Done
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full bg-card border border-primary/20 text-foreground font-semibold py-3 rounded-xl hover:bg-card/80 transition-all"
        >
          Exit Workout
        </button>
      </div>
    </div>
  )
}
