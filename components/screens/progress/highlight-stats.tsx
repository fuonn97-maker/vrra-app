import { Flame } from 'lucide-react'

interface HighlightStatsProps {
  streak?: number
  todayScans?: number
}

export default function HighlightStats({ streak = 0, todayScans = 0 }: HighlightStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Streak Card */}
      <div className="relative overflow-hidden rounded-2xl p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5" />
        <div className="absolute inset-0 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10" />
        <div className="relative space-y-3">
          {streak === 0 ? (
            <>
              <p className="text-sm text-emerald-400 font-semibold">Start today 🔥</p>
              <p className="text-xs text-foreground/70">No streak yet</p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-emerald-400" />
                <span className="text-2xl font-black text-emerald-400">{streak}</span>
              </div>
              <p className="text-xs text-foreground/70">Day Streak</p>
            </>
          )}
        </div>
      </div>

      {/* Today Scans Card */}
      <div className="relative overflow-hidden rounded-2xl p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-blue-500/5" />
        <div className="absolute inset-0 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10" />
        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-400">{todayScans}</span>
            <span className="text-xs text-blue-300">{todayScans === 1 ? 'scan' : 'scans'}</span>
          </div>
          <p className="text-xs text-foreground/70">Today</p>
        </div>
      </div>
    </div>
  )
}
