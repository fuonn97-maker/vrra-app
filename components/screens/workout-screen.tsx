'use client'

import { useState } from 'react'
import GuidedWorkout from '../guided-workout'

type Exercise = {
  name: string
  sets: number | null
  reps: number | null
  note?: string
  target?: string
  video?: string
}

interface WorkoutScreenProps {
  isPremium: boolean
}

const WORKOUT_PLAN: Record<string, {
  name: string
  emoji: string
  focus: string
  exercises: Exercise[]
}> = {
  Monday: {
    name: 'Chest',
    emoji: '🔥',
    focus: 'Build upper body power',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 25, target: 'Chest strength', video: '/workout-videos/bench-press.mp4' },
      { name: 'Incline Dumbbell Press', sets: 4, reps: 25, target: 'Upper chest', video: '/workout-videos/incline-dumbbell-press.mp4' },
      { name: 'Chest Fly', sets: 4, reps: 25, target: 'Chest shape', video: '/workout-videos/chest-fly.mp4' },
      { name: 'Push Ups', sets: 4, reps: 20, note: 'to failure', target: 'Burnout', video: '/workout-videos/push-up.mp4' },
    ],
  },

  Tuesday: {
    name: 'Back',
    emoji: '💪',
    focus: 'Improve posture and width',
    exercises: [
      { name: 'Cable Bent Over Bar Pullover', sets: 4, reps: 25, target: 'Upper back', video: '/workout-videos/cable-bent-over-bar-pullover.mp4' },
      { name: 'Machine 45 Degree Back Extension', sets: 4, reps: 25, target: 'Lower back', video: '/workout-videos/machine-45-degree-back-extension.mp4' },
      { name: 'Kettlebell Incline Shrug', sets: 4, reps: 25, target: 'Back', video: '/workout-videos/kettlebell-incline-shrug.mp4' },
    ],
  },

  Wednesday: {
    name: 'Legs',
    emoji: '⚡',
    focus: 'Strength & power',
    exercises: [
      { name: 'Machine Hamstring Curl', sets: 8, reps: 20, target: 'Leg', video: '/workout-videos/machine-hamstring-curl.mp4' },
      { name: 'Machine Standing Calf Raises', sets: 8, reps: 20, target: 'Leg', video: '/workout-videos/machine-standing-calf-raises.mp4' },
    ],
  },

  Thursday: {
    name: 'Shoulders',
    emoji: '🏆',
    focus: 'Build V shape',
    exercises: [
      { name: 'Dumbbell Seated Overhead Press', sets: 4, reps: 25, target: 'Shoulders', video: '/workout-videos/dumbbell-seated-overhead-press.mp4' },
      { name: 'Cable Low Single Arm Lateral Raise', sets: 4, reps: 25, target: 'Side delts', video: '/workout-videos/cable-low-single-arm-lateral-raise.mp4' },
      { name: 'Cable Rope Face Pulls', sets: 4, reps: 25, target: 'Rear delts', video: '/workout-videos/cable-rope-face-pulls.mp4' },
      { name: 'Machine Reverse Fly', sets: 4, reps: 25, target: 'Rear delts', video: '/workout-videos/machine-reverse-fly.mp4' },
      { name: 'Dumbbell Seated Rear Delt Fly', sets: 4, reps: 25, target: 'Rear delts', video: '/workout-videos/dumbbell-seated-rear-delt-fly.mp4' },
    ],
  },

  Friday: {
    name: 'Arms',
    emoji: '🚀',
    focus: 'Pump day',
    exercises: [
      { name: 'Cable Rope Pushdown', sets: 4, reps: 25, target: 'Triceps', video: '/workout-videos/cable-rope-pushdown.mp4' },
      { name: 'Dumbbell Preacher Curl', sets: 4, reps: 25, target: 'Biceps', video: '/workout-videos/dumbbell-preacher-curl.mp4' },
      { name: 'Dumbbell Incline Curl', sets: 4, reps: 25, target: 'Biceps', video: '/workout-videos/dumbbell-incline-curl.mp4' },
      { name: 'Dumbbell Skullcrusher', sets: 4, reps: 25, target: 'Triceps', video: '/workout-videos/dumbbell-skullcrusher.mp4' },
    ],
  },

  Saturday: {
    name: 'Core',
    emoji: '🧠',
    focus: 'Abs & stability',
    exercises: [
      { name: 'Hand Plank', sets: 4, reps: 25, target: 'Core', video: '/workout-videos/hand-plank.mp4' },
      { name: 'Machine 45 Degree Back Extension', sets: 4, reps: 25, target: 'Lower back', video: '/workout-videos/machine-45-degree-back-extension.mp4' },
      { name: 'Hand Side Plank', sets: 4, reps: 25, target: 'Core', video: '/workout-videos/hand-side-plank.mp4' },
    ],
  },

  Sunday: {
    name: 'Rest',
    emoji: '🌿',
    focus: 'Recovery day',
    exercises: [
      {
        name: 'Light walking or stretching',
        sets: null,
        reps: null,
        note: 'Recovery',
        target: 'Recovery',
      },
    ],
  },
}

export default function WorkoutScreen({ isPremium }: WorkoutScreenProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [isGuidedMode, setIsGuidedMode] = useState(false)
  const [showLocked, setShowLocked] = useState(false)
  const [gender, setGender] = useState<'male' | 'female' | null>(null)
  const [age, setAge] = useState<number | null>(null)
  const [goal, setGoal] = useState<'lose_weight' | 'gain_strength' | 'gain_muscle' | null>(null)
  const [level, setLevel] = useState<'novice' | 'beginner' | 'intermediate' | 'advanced' | null>(null)
  const [equipment, setEquipment] = useState<'barbell' | 'dumbbells' | 'bodyweight' | 'machine' | 'kettlebells' | 'cables' | 'band' | 'all' | null>(null)
  const [bodyFocus, setBodyFocus] = useState<'upper_push' | 'upper_pull' | 'lower_push' | 'lower_pull' | 'core' | 'arms' | 'shoulders' | 'full_body' | null>(null)

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const currentDay = days[new Date().getDay()]
  const displayDay = selectedDay || currentDay
  const workout = WORKOUT_PLAN[displayDay]

  const totalSets = workout.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0)

  const handleStart = () => {
    if (!isPremium) {
      setShowLocked(true)
      return
    }

    setIsGuidedMode(true)
  }

  const isWorkoutProfileComplete =
  gender && age && goal && level && equipment && bodyFocus

  if (isGuidedMode && workout.name !== 'Recovery') {
    return (
      <GuidedWorkout
        exercises={workout.exercises}
        workoutName={workout.name}
        onClose={() => setIsGuidedMode(false)}
      />
    )
  }

  if (!isWorkoutProfileComplete) {
  return (
    <div className="pb-24 px-4 space-y-6">
      <div className="pt-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-card/70 to-background p-5 shadow-xl">
        <p className="text-sm text-primary font-bold">AI Workout Builder</p>
        <h1 className="text-3xl font-black text-foreground mt-1">
          Build Your Plan
        </h1>
        <p className="text-sm text-foreground/60 mt-2">
          Answer a few questions and VRRA will prepare a workout plan for you.
        </p>
      </div>

      <div className="space-y-5">
        <SelectionBlock
          title="1. Gender"
          options={[
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ]}
          selected={gender}
          onSelect={(value) => setGender(value as 'male' | 'female')}
        />

        <div className="rounded-3xl border border-white/10 bg-card/50 p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground/70">2. Age</h2>
          <input
            type="number"
            min="12"
            max="90"
            value={age || ''}
            onChange={(e) => setAge(Number(e.target.value))}
            placeholder="Enter your age"
            className="w-full rounded-2xl bg-background/60 border border-white/10 px-4 py-3 outline-none"
          />
        </div>

        <SelectionBlock
          title="3. Goal"
          options={[
            { label: 'Lose Weight', value: 'lose_weight' },
            { label: 'Gain Strength', value: 'gain_strength' },
            { label: 'Gain Muscle', value: 'gain_muscle' },
          ]}
          selected={goal}
          onSelect={(value) =>
            setGoal(value as 'lose_weight' | 'gain_strength' | 'gain_muscle')
          }
        />

        <SelectionBlock
          title="4. Experience Level"
          options={[
            { label: 'Novice', value: 'novice' },
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
          ]}
          selected={level}
          onSelect={(value) =>
            setLevel(value as 'novice' | 'beginner' | 'intermediate' | 'advanced')
          }
        />

        <SelectionBlock
          title="5. Equipment"
          options={[
            { label: 'Barbell', value: 'barbell' },
            { label: 'Dumbbells', value: 'dumbbells' },
            { label: 'Bodyweight', value: 'bodyweight' },
            { label: 'Machine', value: 'machine' },
            { label: 'Kettlebells', value: 'kettlebells' },
            { label: 'Cables', value: 'cables' },
            { label: 'Band', value: 'band' },
            { label: 'All', value: 'all' },
          ]}
          selected={equipment}
          onSelect={(value) =>
            setEquipment(
              value as
                | 'barbell'
                | 'dumbbells'
                | 'bodyweight'
                | 'machine'
                | 'kettlebells'
                | 'cables'
                | 'band'
                | 'all'
            )
          }
        />

        <SelectionBlock
          title="6. Body Focus"
          options={[
            { label: 'Upper Body Push', value: 'upper_push' },
            { label: 'Upper Body Pull', value: 'upper_pull' },
            { label: 'Lower Body Push', value: 'lower_push' },
            { label: 'Lower Body Pull', value: 'lower_pull' },
            { label: 'Core', value: 'core' },
            { label: 'Arms', value: 'arms' },
            { label: 'Shoulders', value: 'shoulders' },
            { label: 'Full Body', value: 'full_body' },
          ]}
          selected={bodyFocus}
          onSelect={(value) =>
            setBodyFocus(
              value as
                | 'upper_push'
                | 'upper_pull'
                | 'lower_push'
                | 'lower_pull'
                | 'core'
                | 'arms'
                | 'shoulders'
                | 'full_body'
            )
          }
        />
      </div>
    </div>
  )
}
  
  return (
    <div className="pb-24 px-4 space-y-6">
      {/* Hero */}
      <div className="pt-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-card/70 to-background p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-primary font-bold">
              {displayDay === currentDay ? 'Today’s Workout' : displayDay}
            </p>
            <h1 className="text-3xl font-black text-foreground mt-1">
              {workout.emoji} {workout.name} Builder
            </h1>
            <p className="text-sm text-foreground/60 mt-1">
              {workout.focus}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-foreground/50">Total</p>
            <p className="text-xl font-black text-primary">{totalSets}</p>
            <p className="text-xs text-foreground/50">sets</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-2xl bg-background/40 border border-white/10 p-3 text-center">
            <p className="text-lg font-black">{workout.exercises.length}</p>
            <p className="text-xs text-foreground/50">Exercises</p>
          </div>
          <div className="rounded-2xl bg-background/40 border border-white/10 p-3 text-center">
            <p className="text-lg font-black">{totalSets}</p>
            <p className="text-xs text-foreground/50">Sets</p>
          </div>
          <div className="rounded-2xl bg-background/40 border border-white/10 p-3 text-center">
            <p className="text-lg font-black">{isPremium ? 'PRO' : 'LOCK'}</p>
            <p className="text-xs text-foreground/50">Mode</p>
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground/70">Weekly Plan</h2>

        <div className="grid grid-cols-4 gap-2">
          {Object.keys(WORKOUT_PLAN).map((day) => {
            const item = WORKOUT_PLAN[day]
            const active = displayDay === day
            const today = currentDay === day

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  active
                    ? 'bg-primary/25 border-primary shadow-lg shadow-primary/20'
                    : 'bg-card/50 border-white/10'
                }`}
              >
                <p className="text-lg">{item.emoji}</p>
                <p className="text-xs font-bold mt-1">{day.slice(0, 3)}</p>
                {today && (
                  <p className="text-[10px] text-primary font-bold mt-1">
                    Today
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Unlock CTA */}
      {workout.name !== 'Recovery' && (
        <button
  onClick={() => {
    if (!isPremium) {
      window.location.href = '/premium'
      return
    }

    handleStart()
  }}
  className="w-full rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 font-black"
>
  {isPremium ? '▶ Start Guided Workout' : '🔒 Unlock Full Guided Workout'}

  <p className="text-xs font-medium opacity-80 mt-1">
    Real-time coach • video guide • progress tracking
  </p>
</button>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground/70">
            Exercises
          </h2>
          <p className="text-xs text-foreground/50">
            {workout.exercises.length} moves
          </p>
        </div>

        {workout.exercises.map((exercise, index) => (
          <div
            key={index}
            className="rounded-3xl border border-white/10 bg-card/50 p-4 shadow-lg space-y-3"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-xl font-black text-primary">
                {index + 1}
              </div>

              <div className="flex-1">
                <h3 className="font-black text-foreground">
                  {exercise.name}
                </h3>

                <p className="text-xs text-foreground/50 mt-1">
                  {exercise.target || 'Strength'} •{' '}
                  {exercise.sets ? `${exercise.sets} sets` : 'Recovery'}{' '}
                  {exercise.reps ? `• ${exercise.reps} reps` : ''}
                  {exercise.note ? ` • ${exercise.note}` : ''}
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-black text-primary">
                  {exercise.sets ? `${exercise.sets}x` : '—'}
                </p>
                <p className="text-xs text-foreground/50">
                  {exercise.reps || exercise.note || ''}
                </p>
              </div>
            </div>

            {exercise.target && (
              <div className="rounded-2xl bg-background/40 border border-white/10 px-3 py-2">
                <p className="text-xs text-foreground/60">
                  🎯 Target: <span className="text-foreground font-semibold">{exercise.target}</span>
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Locked box */}
      {!isPremium && showLocked && (
        <div className="rounded-3xl border border-primary/30 bg-primary/10 p-5 text-center space-y-2">
          <p className="font-black text-foreground">
            Premium Only
          </p>
          <p className="text-sm text-foreground/60">
            Unlock guided workout, videos, timer, rest coach and tracking.
          </p>
        </div>
      )}
    </div>
  )
}

function SelectionBlock({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string
  options: { label: string; value: string }[]
  selected: string | null
  onSelect: (value: string) => void
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-card/50 p-4 space-y-3">
      <h2 className="text-sm font-bold text-foreground/70">{title}</h2>

      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => {
          const active = selected === option.value

          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`rounded-2xl border px-3 py-3 text-sm font-bold transition-all ${
                active
                  ? 'bg-primary/25 border-primary text-primary'
                  : 'bg-background/40 border-white/10 text-foreground/70'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}