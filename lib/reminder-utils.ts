import { useEffect, useState } from 'react'

export interface ReminderState {
  shouldShow: boolean
  message: string
  reminderTime: 'lunch' | 'dinner'
}

// Randomized reminder messages to avoid boredom
const REMINDER_MESSAGES = [
  "Don't break your streak! Log your meal now",
  "You're one step away from staying consistent",
  "Quick scan = keep your progress alive",
  "Your future body will thank you",
  "Stay on track — log your meal today",
  "You're doing great, don't stop now",
  "Every meal logged brings you closer to your goals",
  "One scan away from an amazing day",
]

export function getRandomReminderMessage(): string {
  const randomIndex = Math.floor(Math.random() * REMINDER_MESSAGES.length)
  return REMINDER_MESSAGES[randomIndex]
}

export function getReminderTime(): 'lunch' | 'dinner' {
  const now = new Date()
  const hour = now.getHours()
  // Before 7 PM, show lunch reminder; after 7 PM, show dinner reminder
  return hour < 19 ? 'lunch' : 'dinner'
}

export function shouldShowReminder(
  hasTodayScans: boolean,
  currentHour: number
): boolean {
  // Show reminder if user hasn't scanned yet and it's past lunch (12 PM) or dinner (7 PM)
  if (hasTodayScans) return false

  // First reminder at 12 PM (lunch)
  if (currentHour >= 12 && currentHour < 19) return true

  // Second reminder at 7 PM (dinner)
  if (currentHour >= 19) return true

  return false
}

export function useReminderState(
  hasTodayScans: boolean
): ReminderState | null {
  const [reminder, setReminder] = useState<ReminderState | null>(null)

  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()

    if (shouldShowReminder(hasTodayScans, hour)) {
      const reminderTime = getReminderTime()
      const message = getRandomReminderMessage()

      setReminder({
        shouldShow: true,
        message,
        reminderTime,
      })
    } else {
      setReminder(null)
    }
  }, [hasTodayScans])

  return reminder
}
