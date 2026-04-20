import { AlertCircle } from 'lucide-react'

interface ReminderCardProps {
  message: string
  reminderTime: 'lunch' | 'dinner'
  onScanClick: () => void
}

export default function ReminderCard({
  message,
  reminderTime,
  onScanClick,
}: ReminderCardProps) {
  const timeLabel = reminderTime === 'lunch' ? '🍽️ Lunch' : '🍽️ Dinner'

  return (
    <div className="bg-gradient-to-br from-amber-500/20 to-red-500/10 border-2 border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-lg shadow-amber-500/20 animate-pulse">
      <div className="flex items-start gap-3">
        <AlertCircle size={24} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-bold text-amber-300">{timeLabel} Reminder</p>
          <p className="text-sm text-amber-200 font-semibold">
            ⚠️ You haven't logged any meals today
          </p>
          <p className="text-sm text-amber-100">
            🔥 {message}
          </p>
        </div>
      </div>

      <button
        onClick={onScanClick}
        className="w-full bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-bold py-3 rounded-lg transition-all duration-300 text-sm"
      >
        Scan Now
      </button>
    </div>
  )
}
