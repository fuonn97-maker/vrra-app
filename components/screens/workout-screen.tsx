'use client'

import { useState } from 'react'
import GuidedWorkout from '../guided-workout'

interface WorkoutScreenProps {
  isPremium: boolean
}

const WORKOUT_PLAN = {
  Monday: { name: 'Chest', exercises: [
    { name: 'Bench Press', sets: 4, reps: 10 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 12 },
    { name: 'Chest Fly', sets: 3, reps: 15 },
    { name: 'Push Ups', sets: 2, reps: null, note: 'to failure' }
  ]},
  Tuesday: { name: 'Back', exercises: [
    { name: 'Bent Over Rows', sets: 4, reps: 8 },
    { name: 'Pull Ups', sets: 3, reps: 10 },
    { name: 'Lat Pulldown', sets: 3, reps: 12 },
    { name: 'Face Pulls', sets: 3, reps: 15 }
  ]},
  Wednesday: { name: 'Legs', exercises: [
    { name: 'Squats', sets: 4, reps: 8 },
    { name: 'Leg Press', sets: 3, reps: 10 },
    { name: 'Leg Curls', sets: 3, reps: 12 },
    { name: 'Calf Raises', sets: 3, reps: 15 }
  ]},
  Thursday: { name: 'Shoulders', exercises: [
    { name: 'Military Press', sets: 4, reps: 8 },
    { name: 'Lateral Raises', sets: 3, reps: 12 },
    { name: 'Reverse Fly', sets: 3, reps: 12 },
    { name: 'Shrugs', sets: 3, reps: 10 }
  ]},
  Friday: { name: 'Arms', exercises: [
    { name: 'Barbell Curls', sets: 4, reps: 8 },
    { name: 'Tricep Dips', sets: 3, reps: 10 },
    { name: 'Hammer Curls', sets: 3, reps: 12 },
    { name: 'Tricep Pushdown', sets: 3, reps: 12 }
  ]},
  Saturday: { name: 'Core', exercises: [
    { name: 'Planks', sets: 3, reps: null, note: 'hold 60s' },
    { name: 'Sit Ups', sets: 3, reps: 20 },
    { name: 'Russian Twists', sets: 3, reps: 15 },
    { name: 'Leg Raises', sets: 3, reps: 12 }
  ]},
  Sunday: { name: 'Rest', exercises: [
    { name: 'Active Recovery', sets: null, reps: null, note: 'Light walking or stretching' }
  ]}
}

export default function WorkoutScreen({ isPremium }: WorkoutScreenProps) {
  const [isGuidedMode, setIsGuidedMode] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  
  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date().getDay()]
  }

  const currentDay = getDayOfWeek()
  const todayWorkout = WORKOUT_PLAN[currentDay as keyof typeof WORKOUT_PLAN]
  const displayDay = selectedDay || currentDay
  const displayWorkout = WORKOUT_PLAN[displayDay as keyof typeof WORKOUT_PLAN]

  if (isGuidedMode && displayWorkout.name !== 'Rest') {
    return <GuidedWorkout 
      exercises={displayWorkout.exercises} 
      workoutName={displayWorkout.name} 
      onClose={() => setIsGuidedMode(false)}
    />
  }

  return (
    <div className="pb-24 px-4 space-y-8">
      {/* Header */}
      <div className="pt-6 space-y-2">
        <h1 className="text-3xl font-black text-primary">Workout Plan</h1>
        <p className="text-sm text-foreground/60">Stay consistent, get stronger</p>
      </div>

      {/* Weekly Grid - Center everything */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground text-center">This Week</h2>
        
        <div className="flex flex-col gap-4">
          {/* Mon/Tue/Wed */}
          <div className="grid grid-cols-2 gap-3">
            <DayCard day="Monday" isToday={currentDay === 'Monday'} isSelected={selectedDay === 'Monday'} onSelect={setSelectedDay} />
            <DayCard day="Tuesday" isToday={currentDay === 'Tuesday'} isSelected={selectedDay === 'Tuesday'} onSelect={setSelectedDay} />
          </div>

          {/* Wed/Thu */}
          <div className="grid grid-cols-2 gap-3">
            <DayCard day="Wednesday" isToday={currentDay === 'Wednesday'} isSelected={selectedDay === 'Wednesday'} onSelect={setSelectedDay} />
            <DayCard day="Thursday" isToday={currentDay === 'Thursday'} isSelected={selectedDay === 'Thursday'} onSelect={setSelectedDay} />
          </div>

          {/* Fri/Sat */}
          <div className="grid grid-cols-2 gap-3">
            <DayCard day="Friday" isToday={currentDay === 'Friday'} isSelected={selectedDay === 'Friday'} onSelect={setSelectedDay} />
            <DayCard day="Saturday" isToday={currentDay === 'Saturday'} isSelected={selectedDay === 'Saturday'} onSelect={setSelectedDay} />
          </div>

          {/* Sun - Full width */}
          <div className="grid grid-cols-2 gap-3">
            <DayCard day="Sunday" isToday={currentDay === 'Sunday'} isSelected={selectedDay === 'Sunday'} onSelect={setSelectedDay} />
            <div />
          </div>
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="bg-gradient-to-br from-card/80 to-card/40 border border-primary/30 rounded-3xl p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-foreground">{displayWorkout.name} Day</h3>
            {displayDay === currentDay && <span className="text-lg">🔥</span>}
          </div>
          <p className="text-sm text-foreground/60">{displayDay}</p>
        </div>

        {displayWorkout.name === 'Rest' ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-lg text-foreground/70">
              Active recovery recommended
            </p>
            <p className="text-sm text-foreground/60">
              Light walking or stretching to aid recovery
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setIsGuidedMode(true)}
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-3 px-4 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-lg"
            >
              <span>▶️</span>
              Start Workout
            </button>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground/70">Today's exercises:</p>
              <div className="space-y-2">
                {displayWorkout.exercises.map((exercise, idx) => (
                  <div 
                    key={idx}
                    className="bg-background/40 border border-primary/20 rounded-2xl p-3 flex items-center justify-between"
                  >
                    <h4 className="font-semibold text-foreground text-sm">{exercise.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                      {exercise.sets && <span>{exercise.sets}x</span>}
                      {exercise.reps && <span>{exercise.reps} reps</span>}
                      {exercise.note && <span className="italic">({exercise.note})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Upgrade Prompt */}
      {!isPremium && (
        <div className="bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/30 rounded-3xl p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-foreground">
            Unlock Premium for Advanced Features
          </p>
          <p className="text-xs text-foreground/70">
            Get personalized workouts, progress tracking, and more
          </p>
        </div>
      )}
    </div>
  )
}

// DayCard component for weekly grid
function DayCard({ 
  day, 
  isToday, 
  isSelected,
  onSelect 
}: { 
  day: string
  isToday: boolean
  isSelected: boolean
  onSelect: (day: string) => void
}) {
  const workout = WORKOUT_PLAN[day as keyof typeof WORKOUT_PLAN]
  
  return (
    <button
      onClick={() => onSelect(isSelected ? null : day)}
      className={`p-4 rounded-2xl border transition-all text-left ${
        isToday
          ? 'bg-gradient-to-br from-primary/40 to-primary/10 border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/20 scale-105'
          : isSelected
          ? 'bg-primary/30 border-primary/40'
          : 'bg-card/50 border-primary/20 hover:border-primary/40'
      }`}
    >
      <p className="text-xs font-medium text-foreground/60">{day.slice(0, 3)}</p>
      <p className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
        {workout.name}
      </p>
      {isToday && <p className="text-xs text-primary font-semibold mt-1">🔥 Today</p>}
    </button>
  )
}
