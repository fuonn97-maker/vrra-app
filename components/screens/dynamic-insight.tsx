'use client'

import { TrendingUp, Zap } from 'lucide-react'

interface DynamicInsightProps {
  todayScans: number
  streak: number
  last7DaysTotal: number
  previous7DaysTotal: number
  consistencyPercent: number
}

export function getDynamicInsight(data: DynamicInsightProps): {
  message: string
  icon: 'trend' | 'spark' | 'fire'
  isPositive: boolean
} {
  const { todayScans, streak, last7DaysTotal, previous7DaysTotal, consistencyPercent } = data

  // 1) If current 7-day activity > previous 7-day activity
  if (last7DaysTotal > previous7DaysTotal && last7DaysTotal > 0) {
    return {
      message: "You're doing better than last week",
      icon: 'trend',
      isPositive: true,
    }
  }

  // 2) Else if streak >= 3
  if (streak >= 3) {
    return {
      message: "You're maintaining strong consistency",
      icon: 'fire',
      isPositive: true,
    }
  }

  // 3) Else if today's scans > 0
  if (todayScans > 0) {
    return {
      message: "You're building momentum today",
      icon: 'spark',
      isPositive: true,
    }
  }

  // 4) Else
  return {
    message: "Start today and build momentum",
    icon: 'spark',
    isPositive: false,
  }
}

export default function DynamicInsight({
  todayScans,
  streak,
  last7DaysTotal,
  previous7DaysTotal,
  consistencyPercent,
}: DynamicInsightProps) {
  const { message, icon, isPositive } = getDynamicInsight({
    todayScans,
    streak,
    last7DaysTotal,
    previous7DaysTotal,
    consistencyPercent,
  })

  const IconComponent = icon === 'trend' ? TrendingUp : Zap
  const colorClass = isPositive ? 'text-primary' : 'text-foreground/70'

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <IconComponent size={16} className={colorClass} />
      <p className={`text-xs font-semibold ${colorClass}`}>{message}</p>
    </div>
  )
}
