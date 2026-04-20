'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface TrendDataPoint {
  day: string
  score: number
}

interface DailyScoreTrendCardProps {
  data?: TrendDataPoint[]
  trendDisplay?: string
}

const defaultData = [
  { day: 'Mon', score: 65 },
  { day: 'Tue', score: 72 },
  { day: 'Wed', score: 68 },
  { day: 'Thu', score: 78 },
  { day: 'Fri', score: 82 },
  { day: 'Sat', score: 85 },
  { day: 'Sun', score: 88 },
]

const CustomDot = (props: any) => {
  const { cx, cy, payload, dataKey } = props
  const isLast = payload.day === 'Sun'
  
  if (isLast) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="rgb(16, 185, 129)" opacity={1} />
        <circle cx={cx} cy={cy} r={8} fill="rgb(16, 185, 129)" opacity={0.3} />
      </g>
    )
  }
  return null
}

export default function DailyScoreTrendCard({ data = defaultData, trendDisplay = 'No change' }: DailyScoreTrendCardProps) {
  return (
    <div className="w-full animate-fade-in">
      {/* Premium Card Container */}
      <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900" />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/8 via-blue-500/5 to-emerald-400/5" />
        
        {/* Border glow */}
        <div className="absolute inset-0 rounded-3xl border border-emerald-500/30 shadow-xl shadow-emerald-500/20" />

        {/* Content */}
        <div className="relative p-8 space-y-6">
          {/* Header */}
          <div>
            <p className="text-emerald-400/70 text-xs uppercase tracking-widest font-semibold mb-1">
              Daily Score Trend
            </p>
            <p className="text-foreground/70 text-sm">Last 7 days</p>
          </div>

          {/* Chart Container */}
          <div className="w-full h-56 -mx-8 px-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 15, right: 20, left: -20, bottom: 15 }}
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.3)" />
                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
                  </linearGradient>
                </defs>

                <CartesianGrid 
                  strokeDasharray="0" 
                  stroke="rgba(16, 185, 129, 0.05)" 
                  vertical={false}
                  horizontalPoints={[25, 50, 75]}
                />

                <XAxis
                  dataKey="day"
                  stroke="rgba(16, 185, 129, 0.25)"
                  style={{ fontSize: '12px' }}
                  axisLine={{ stroke: 'rgba(16, 185, 129, 0.1)' }}
                  tick={{ dy: 5 }}
                  interval={1}
                />

                <YAxis hide />

                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ color: 'rgba(16, 185, 129, 1)', fontSize: '13px', fontWeight: 600 }}
                  formatter={(value) => [`${value} score`, '']}
                  cursor={{ stroke: 'rgba(16, 185, 129, 0.5)', strokeWidth: 2 }}
                />

                <Area
                  type="natural"
                  dataKey="score"
                  stroke="rgba(16, 185, 129, 1)"
                  strokeWidth={3}
                  fill="url(#colorScore)"
                  dot={<CustomDot />}
                  isAnimationActive
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Footer with stats */}
          <div className="flex items-center justify-between pt-5 border-t border-emerald-500/15">
            <p className="text-foreground/60 text-xs font-medium">Last 7 days</p>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-sm">{trendDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add fade-in animation to globals if not present */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
