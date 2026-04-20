import { TrendingUp, Zap } from 'lucide-react'

interface ProgressInsightsProps {
  improvementPercent?: number
  isImproving?: boolean
  improvementText?: string
}

export default function ProgressInsights({
  improvementPercent = 23,
  isImproving = true,
  improvementText = 'Based on your last 7 days activity, your consistency has improved by 23%.',
}: ProgressInsightsProps) {
  const IconComponent = isImproving ? TrendingUp : Zap

  return (
    <div className="relative rounded-2xl overflow-hidden backdrop-blur-sm">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-emerald-500/8 to-transparent" />
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl border border-emerald-500/30" />

      {/* Content */}
      <div className="relative p-6 space-y-3">
        {/* Title with icon */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <IconComponent size={20} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {isImproving ? "You're improving" : improvementPercent === 0 ? "On track" : "Building back"}
          </h2>
        </div>

        {/* Description */}
        <p className="text-xs text-foreground/60 leading-relaxed pl-11">
          {improvementText}
        </p>
      </div>
    </div>
  )
}
