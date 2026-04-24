'use client'

import { useState } from 'react'
import GuidedWorkout from '../guided-workout'

interface WorkoutScreenProps {
  isPremium: boolean
}

type Exercise = {
  name: string
  sets: number | null
  reps: number | null
  note?: string
  target?: string
  video?: string
}

const WORKOUT_PLAN: Record<string, { name: string; emoji: string; focus: string; exercises: Exercise[] }> = {
  Monday: {
    name: 'Chest',
    emoji: '🔥',
    focus: 'Build upper body power',
    exercises: [
      {
  name: 'Bench Press',
  sets: 4,
  reps: 25,
  target: 'Chest strength',
  video: '/workout-videos/bench-press.mp4',
},
      { 
  name: 'Incline Dumbbell Press',
  sets: 4,
  reps: 25,
  target: 'Upper chest' ,
  video: '/workout-videos/incline-dumbbell-press.mp4',
},

     { 
  name: 'Chest Fly', 
  sets: 4, 
  reps: 25, 
  target: 'Chest shape' ,
  video: '/workout-videos/chest-fly.mp4',
  },
      {
  name: 'Push Ups',
  sets: 4,
  reps: 20,
  note: 'to failure',
  target: 'Burnout',
  video: '/workout-videos/push-up.mp4'
},
    ],
  },
  Tuesday: {
    name: 'Back',
    emoji: '💪',
    focus: 'Improve posture and width',
    exercises: [
{ 
   name: 'Cable Bent Over Bar Pullover',
   sets: 4, 
   reps: 25,
   target:'upper back',
   video:'/workout-videos/cable-bent-over-bar-pullover.mp4',
},
{  name: 'Machine 45 Degree Back Extension', 
   sets: 4, 
   reps: 25,
   target:'upper back',
   video:'/workout-videos/machine-45-degree-back-extension.mp4'
  },
{ 
    name: 'Kettlebell Incline Shrug.mp4', 
    sets: 4, 
    reps: 25,
    target:'back',
    video:'/workout-videos/kettlebell-incline-shrug.mp4',
  },
      ],
  },
  Wednesday: {
    name: 'Legs',
    emoji: '⚡',
    focus: 'Strength & power',
    exercises: [
{ 
    name: 'Machine Hamstring Curl',
    sets: 8, 
    reps: 20,
    target:'leg',
    video:'/workout-videos/machine-hamstring-curl.mp4',
  },
{
    name: 'Machine Standing Calf Raises', 
    sets: 8, 
    reps: 20,
    target:'leg',
    video:'/workout-videos/machine-standing-calf-raises.mp4',
  },
      
    ],
  },
  Thursday: {
    name: 'Shoulders',
    emoji: '🏆',
    focus: 'Build V shape',
    exercises: [
{ 
    name: 'Dumbbell Seated Overhead Pres', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/dumbbell-seated-overhead-press.mp4',
  },
{ 
    name: 'Cable Low Single Arm Lateral Raise', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/cable-low-single-arm-lateral-raise.mp4',
  },
{
    name: 'Cable Rope Face Pulls', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/cable-rope-face-pulls',
  },
{
    name: 'Machine Reverse Fly',
    sets: 4, 
    reps: 25, 
    video:'/workout-videos/machine-reverse-fly.mp4',
  },
  {
    name:'Dumbbell Seated Rear Delt Fly',
    sets: 4,
    reps: 25,
    video:'/workout-videos/dumbbell-seated-rear-delt-fly.mp4',
  },
    ],
  },
  Friday: {
    name: 'Arms',
    emoji: '🚀',
    focus: 'Pump day',
    exercises: [
{
    name: 'Cable Rope Pushdown',
    sets: 4,
    reps: 25,
    video:'/workout-videos/cable-rope-pushdown.mp4',
  },
{   name: 'Dumbbell Preacher Curl', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/dumbbell-preacher-curl.mp4',
  },
{   name: 'Dumbbell Incline Curl', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/dumbbell-incline-curl.mp4',
  },
{
    name: 'Dumbbell Skullcrusher', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/dumbbell-skullcrusher.mp4',
  },
    ],
  },
  Saturday: {
    name: 'Core',
    emoji: '🧠',
    focus: 'Abs & stability',
    exercises: [
{ 
    name: 'Hand Plank', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/hand-plank.mp4',
  },
{   name: 'Machine 45 Degree Back Extension', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/machine-45-degree-back-extension.mp4',
  },
{ 
    name: 'Hand Side Plank', 
    sets: 4, 
    reps: 25,
    video:'/workout-videos/hand-side-plank.mp4',
  },
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
    video:'null',
  },
    ],
  },
}

export default function WorkoutScreen({ isPremium }: WorkoutScreenProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [showLocked, setShowLocked] = useState(false)
  const [isGuidedMode, setIsGuidedMode] = useState(false)

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const currentDay = days[new Date().getDay()]
  const displayDay = selectedDay || currentDay
  const workout = WORKOUT_PLAN[displayDay]

  const handleStart = () => {
    if (!isPremium) {
      setShowLocked(true)
      return
    }

    setIsGuidedMode(true)
  }
  if (isGuidedMode && workout.name !== 'Rest') {
  return (
    <GuidedWorkout
      exercises={workout.exercises}
      workoutName={workout.name}
      onClose={() => setIsGuidedMode(false)}
    />
  )
}

  return (
    <div className="pb-24 px-4 space-y-6">

      {/* Header */}
      <div className="pt-6">
        <h1 className="text-3xl font-black">Workout</h1>
        <p className="text-sm text-foreground/60">Stay consistent</p>
      </div>

      {/* Days */}
      <div className="grid grid-cols-2 gap-3">
        {Object.keys(WORKOUT_PLAN).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`p-4 rounded-2xl border ${
              displayDay === day
                ? 'bg-primary/30 border-primary'
                : 'bg-card/50 border-primary/20'
            }`}
          >
            <p className="text-xs">{day.slice(0, 3)}</p>
            <p className="font-bold">{WORKOUT_PLAN[day].name}</p>
          </button>
        ))}
      </div>

      {/* Detail */}
      <div className="bg-card p-5 rounded-3xl space-y-4 border border-primary/20">
        <div className="flex justify-between">
          <div>
            <h2 className="text-xl font-bold">{workout.name} Day</h2>
            <p className="text-sm text-foreground/60">{workout.focus}</p>
          </div>
          <div className="text-3xl">{workout.emoji}</div>
        </div>

        {workout.name === 'Rest' ? (
          <p className="text-center text-foreground/60">
            Rest & recover
          </p>
        ) : (
          <>
            <button
              onClick={handleStart}
              className={`w-full py-3 rounded-xl font-bold ${
                isPremium
                  ? 'bg-primary text-white'
                  : 'bg-primary/30'
              }`}
            >
              {isPremium ? 'Start Workout' : '🔒 Unlock Workout'}
            </button>

            <div className="space-y-2">
              {workout.exercises.map((ex, i) => (
                <div key={i} className="flex justify-between bg-background/40 p-3 rounded-xl">
                  <p>{ex.name}</p>
                  <p className="text-xs">
                    {ex.sets ? `${ex.sets}x` : ''} {ex.reps ? `${ex.reps}` : ex.note}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Locked */}
      {!isPremium && showLocked && (
        <div className="p-5 text-center border border-primary/30 rounded-2xl bg-primary/10">
          <p className="font-bold">Premium Only</p>
          <p className="text-sm text-foreground/60">
            Guided workout + tracking
          </p>
        </div>
      )}

    </div>
  )
}