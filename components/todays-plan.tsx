'use client'

import { useState, useEffect } from 'react'

interface TodaysPlanProps {
  scansToday: number
  maxScans?: number
  hasCompletedWorkout?: boolean
  isPremium?: boolean
  streak?: number
  mealTotals?: { calories: number; protein: number; carbs: number; fat: number }
  onScanClick?: () => void
  onWorkoutClick?: () => void
}

const DAILY_AI_MESSAGES = [
  "You showed up today. That matters.",
  "Small steps build strong bodies.",
  "Consistency beats perfection.",
  "You're closer than you think.",
  "Every choice moves you forward.",
  "Your future self is grateful.",
  "Progress isn't always visible, but it's happening.",
  "You're building something real.",
]

const MOTIVATIONAL_QUOTES = [
  'Consistency beats motivation',
  'Every rep counts',
  'Small steps, big results',
  'Your future self will thank you',
  'Progress over perfection',
]

// AI Coach personality messages
const getNutritionMessage = (scansToday: number) => {
  if (scansToday === 0) {
    return {
      title: "You haven't logged any meals today",
      subtitle: "Let's start small — your future self will thank you",
      emoji: "🤍"
    }
  } else if (scansToday === 1) {
    return {
      title: "Good start",
      subtitle: "Keep going, you're building a healthy habit",
      emoji: "🌱"
    }
  } else {
    return {
      title: "You're doing great",
      subtitle: "Stay consistent, you're on track",
      emoji: "💪"
    }
  }
}

const getWorkoutMessage = (isRest: boolean, hasCompletedWorkout: boolean, scansToday: number, bodyPart: string) => {
  // Smart recommendation linked to meal scans
  if (isRest) {
    if (scansToday === 0) {
      return {
        title: "Rest day — focus on recovery",
        subtitle: "Consider a light walk and stay hydrated",
        emoji: "😌"
      }
    } else {
      return {
        title: "Rest and refuel day",
        subtitle: "Your body is recovering and getting stronger",
        emoji: "💚"
      }
    }
  } else {
    // Not a rest day
    if (scansToday === 0) {
      return {
        title: "You haven't fueled your body yet",
        subtitle: "Start with a light workout or log your first meal",
        emoji: "🤍"
      }
    } else if (scansToday === 1) {
      return {
        title: "Good start — your body has some energy",
        subtitle: `Today's workout: ${bodyPart}`,
        emoji: "🌱"
      }
    } else {
      return {
        title: "Great fuel today — perfect time to train",
        subtitle: `Focus: ${bodyPart} workout`,
        emoji: "🔥"
      }
    }
  }
}

// Smart AI Coach Line - More human and personal
const getSmartAICoachLine = (scansToday: number, mealTotals?: { calories: number; protein: number; carbs: number; fat: number }, isRest?: boolean) => {
  if (!mealTotals) return null
  
  if (isRest) {
    return "Recovery is just as important as training. You're being smart."
  }
  
  if (scansToday === 0) {
    return "Start with one small action — a meal or a workout."
  }
  
  if (mealTotals.protein < 80) {
    return "You're doing well — just improve protein intake for better recovery."
  }
  
  if (mealTotals.calories < 1500) {
    return "Based on your meals, you might need more fuel for today's workout."
  }
  
  return "Your consistency is your biggest strength. Keep it up."
}

// Streak Pressure Message
const getStreakMessage = (streak: number) => {
  if (streak === 0) {
    return "Start your first streak today"
  }
  if (streak === 1) {
    return "You're building momentum — keep going"
  }
  return "Don't break your streak now"
}

// Today's Focus - Dynamic message based on scans and rest day
const getTodaysFocus = (scansToday: number, isRest: boolean) => {
  if (isRest) {
    return "Recovery + stay consistent with meals"
  }
  if (scansToday === 0) {
    return "Start small — log a meal or do a light workout"
  }
  if (scansToday === 1) {
    return "Good start — keep your momentum going"
  }
  if (scansToday >= 2) {
    return "You're well fueled — great time for a strong workout"
  }
  return "Stay consistent today"
}

// Gentle anxiety triggers
const getRetentionMessage = (scansToday: number, maxScans: number, streak: number, isPremium: boolean, isInactive: boolean) => {
  if (isInactive) {
    return {
      text: "It's okay to start small. Just one action today makes a difference.",
      show: true
    }
  }
  
  if (scansToday === 0 && maxScans > 0) {
    return {
      text: "You're close to missing today's progress",
      show: true
    }
  }
  
  if (streak >= 2) {
    return {
      text: "Don't break your streak — you're doing so well",
      show: true
    }
  }
  
  if (scansToday >= 2 && !isPremium && maxScans > 0 && scansToday >= maxScans - 1) {
    return {
      text: "You're near your daily limit. Upgrade for unlimited tracking",
      show: true
    }
  }
  
  return { text: '', show: false }
}

  export default function TodaysPlan(props: TodaysPlanProps) {
  const {
    scansToday,
    maxScans,
    isPremium,
    streak,
    mealTotals,
    onScanClick,
    onWorkoutClick,
    hasCompletedWorkout,
  } = props
  const [currentQuote, setCurrentQuote] = useState('')
  const [dailyMessage, setDailyMessage] = useState('')
  const [workoutsCompleted, setWorkoutsCompleted] = useState(5)

  useEffect(() => {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
    setCurrentQuote(randomQuote)
    
    const randomMessage = DAILY_AI_MESSAGES[Math.floor(Math.random() * DAILY_AI_MESSAGES.length)]
    setDailyMessage(randomMessage)
  }, [])

  const getTodayWorkout = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = days[new Date().getDay()]
    
    const workoutMap: Record<string, { name: string; nextExercise: string; isRest: boolean }> = {
      Monday: { name: 'Chest Day', nextExercise: 'Bench Press', isRest: false },
      Tuesday: { name: 'Back Day', nextExercise: 'Bent Over Rows', isRest: false },
      Wednesday: { name: 'Legs Day', nextExercise: 'Squats', isRest: false },
      Thursday: { name: 'Shoulders Day', nextExercise: 'Military Press', isRest: false },
      Friday: { name: 'Arms Day', nextExercise: 'Barbell Curls', isRest: false },
      Saturday: { name: 'Core Day', nextExercise: 'Planks', isRest: false },
      Sunday: { name: 'Rest Day', nextExercise: 'Active Recovery', isRest: true },
    }
    
    return workoutMap[dayName] || { name: 'Rest Day', nextExercise: 'Recovery', isRest: true }
  }

  const todayWorkout = getTodayWorkout()
  const bodyPart = todayWorkout.name.replace(' Day', '')
  const nutritionMsg = getNutritionMessage(scansToday)
  const workoutMsg = getWorkoutMessage(todayWorkout.isRest, hasCompletedWorkout, scansToday, bodyPart)
  const focusMsg = getTodaysFocus(scansToday, todayWorkout.isRest)
  const smartAICoachLine = getSmartAICoachLine(scansToday, mealTotals, todayWorkout.isRest)
  const streakMessage = getStreakMessage(streak)
  const isInactive = scansToday === 0 && !hasCompletedWorkout
  const retentionMsg = getRetentionMessage(scansToday, maxScans, streak, isPremium, isInactive)

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Daily AI Message - Top Section */}
      {dailyMessage && (
        <div className="bg-gradient-to-r from-primary/8 to-secondary/8 border border-primary/20 rounded-2xl p-5 text-center backdrop-blur-sm animate-fadeIn">
          <p className="text-sm font-medium text-foreground leading-relaxed italic">
            {dailyMessage}
          </p>
        </div>
      )}
      
      <h2 className="text-2xl font-black text-primary">Today's Plan</h2>
      
      <div className="space-y-3">
        {/* Nutrition Section - AI Coach Tone */}
        <div className="bg-gradient-to-br from-card/80 to-card/40 border border-primary/30 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-semibold text-foreground block">{nutritionMsg.title}</span>
            </div>
            <span className="text-3xl ml-3">{nutritionMsg.emoji}</span>
          </div>
          
          <button
  onClick={onScanClick}
  className="w-full bg-primary/20 border border-primary/40 text-primary font-semibold py-2 px-3 rounded-xl hover:opacity-90"
>
  {scansToday > 0 ? 'Continue Tracking' : 'Scan First Meal'}
</button>
        </div>

        {/* Workout Section - AI Coach Tone */}
        <div className={`bg-gradient-to-br ${todayWorkout.isRest ? 'from-secondary/15 to-secondary/5' : 'from-primary/15 to-secondary/5'} border border-primary/30 rounded-2xl p-4 space-y-3 animate-fadeIn`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <span className="font-semibold text-foreground block">{workoutMsg.title}</span>
            </div>
            <span className="text-3xl ml-3">{workoutMsg.emoji}</span>
          </div>
          
          {!todayWorkout.isRest && !hasCompletedWorkout && (
            <button
  onClick={onWorkoutClick}
  className="w-full bg-primary text-primary-foreground font-semibold py-2 px-3 rounded-xl hover:opacity-90"
>
  Start your workout
</button>
          )}
        </div>

        {/* AI Coach Insight - Main Focus */}
        {smartAICoachLine && (
          <div className="bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/30 rounded-2xl p-4 text-center animate-fadeIn">
            <p className="text-sm font-medium text-foreground">{smartAICoachLine}</p>
          </div>
        )}

        {/* Gamification Stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Streak */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl p-3 text-center space-y-1 animate-fadeIn">
            <p className="text-xs text-foreground/60">Streak</p>
            <p className="text-2xl font-black text-primary">{streak}</p>
            <p className="text-xs text-foreground/60">days</p>
          </div>

          {/* Workouts Completed */}
          <div className="bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 rounded-2xl p-3 text-center space-y-1 animate-fadeIn">
            <p className="text-xs text-foreground/60">Workouts</p>
            <p className="text-2xl font-black text-secondary">{workoutsCompleted}</p>
            <p className="text-xs text-foreground/60">done</p>
          </div>
        </div>

        {/* Streak Pressure Message - Below Streak */}
        {streak >= 0 && (
          <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-transparent border border-primary/25 rounded-2xl p-3 text-center animate-fadeIn">
            <p className="text-xs font-semibold text-foreground/80">{streakMessage}</p>
          </div>
        )}

        {/* Near Limit Warning - Premium Upgrade CTA */}
        {scansToday >= maxScans - 1 && !isPremium && maxScans > 0 && (
          <div className="bg-gradient-to-br from-secondary/30 to-secondary/10 border border-secondary/40 rounded-2xl p-4 text-center space-y-2 animate-fadeIn">
            <p className="text-sm font-semibold text-foreground">
              You're getting consistent
            </p>
            <p className="text-xs text-foreground/70">
              Upgrade for unlimited tracking
            </p>
          </div>
        )}

        {/* Premium Micro Nudge - Limited Scans Message */}
        {scansToday < maxScans && !isPremium && maxScans > 0 && (
          <div className="text-center px-3 py-2 bg-secondary/10 border border-secondary/20 rounded-xl animate-fadeIn">
            <p className="text-xs text-foreground/70">
              You have <span className="font-semibold text-secondary">{maxScans - scansToday}</span> scans left today
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
