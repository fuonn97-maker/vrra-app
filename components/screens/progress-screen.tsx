'use client'

import { useEffect, useState } from 'react'
import { Flame, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/timezone-utils'
import ProgressHeader from './progress/progress-header'
import HighlightStats from './progress/highlight-stats'
import ProgressInsights from './progress/progress-insights'
import DailyScoreTrendCard from './progress/daily-score-trend-card'

interface TrendDataPoint {
  day: string
  score: number
}

interface ScoreData {
  scores: Array<{ date: string; body_score: number; meal_score: number; daily_score: number }>
  bodyScore: number
  dailyScore: number
  streak: number
}

export default function ProgressScreen() {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [todayScans, setTodayScans] = useState(0)
  const [chartData, setChartData] = useState<TrendDataPoint[]>([])
  const [improvementPercent, setImprovementPercent] = useState(0)
  const [isImproving, setIsImproving] = useState(true)
  const [consistencyPercent, setConsistencyPercent] = useState(0)
  const [trendDisplay, setTrendDisplay] = useState('No change')
  const [bestDayName, setBestDayName] = useState<string>('No data yet')
  const [bestDayCount, setBestDayCount] = useState<number>(0)
  const [hasBestDayData, setHasBestDayData] = useState<boolean>(false)
  const [isTodayActive, setIsTodayActive] = useState<boolean>(false)
  const [workoutsCompleted, setWorkoutsCompleted] = useState(0)

  useEffect(() => {
    fetchProgressData()
  }, [])

  const fetchProgressData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log('[v0] No user found')
        setIsLoading(false)
        return
      }

      // Get session to extract access token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        console.error('[v0] No access token found')
        setIsLoading(false)
        return
      }

      // Fetch scores data (same endpoint as Home page)
      const response = await fetch(`/api/scores?days=14`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await response.json()

      if (response.ok && data.bodyScore !== undefined) {
        setScoreData(data)
      }

      // Fetch raw scans for chart and today's count
      const { data: scans, error: scansError } = await supabase
        .from('scans')
        .select('created_at, is_deleted')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (scansError) {
        console.error('[v0] Error fetching scans:', scansError.message)
      }

      if (scans) {
        console.log('[v0] === PROGRESS SCREEN FULL DATA CALC ===')
        console.log('[v0] Total scans fetched from Supabase:', scans.length)

        // Fetch user profile to get timezone
        const { data: profileData } = await supabase
          .from('profiles')
          .select('timezone,workouts_completed')
          .eq('id', user.id)
          .single()

        const userTimezone = profileData?.timezone || 'UTC'
        setWorkoutsCompleted(profileData?.workouts_completed || 0)
        console.log('[v0] User timezone from profile:', userTimezone)

        // Filter to valid (non-deleted) scans for all calculations
        const validScans = scans.filter(scan => scan.is_deleted !== true)
        console.log('[v0] Valid scans (is_deleted NOT TRUE):', validScans.length)

        // Get today's date using getLocalDateString
        const today = getLocalDateString(new Date().toISOString(), userTimezone)
        console.log('[v0] Local date today:', today)

        // Get unique dates from ALL valid scans using getLocalDateString
        const uniqueDates = new Set<string>()
        validScans.forEach(scan => {
          const localDate = getLocalDateString(scan.created_at, userTimezone)
          uniqueDates.add(localDate)
        })
        console.log('[v0] Unique scan dates in history:', uniqueDates.size)

        // Get today's scans using getLocalDateString
        const todayScansCount = validScans.filter((scan) => {
          const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
          return scanLocalDate === today
        }).length
        
        console.log('[v0] Valid scans for today:', todayScansCount)
        setTodayScans(todayScansCount)
        setIsTodayActive(todayScansCount >= 2)

        // Build chart data for last 7 days using getLocalDateString
        const last7Days: string[] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          last7Days.push(getLocalDateString(date.toISOString(), userTimezone))
        }

        const dailyScans = last7Days.map((date) => {
          const dayScans = validScans.filter((scan) => {
            const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
            return scanLocalDate === date
          })
          return {
            day: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
            score: dayScans.length > 0 ? 50 + dayScans.length * 10 : 40,
          }
        })
        setChartData(dailyScans)
        console.log('[v0] Chart data generated for last 7 days')

        // Calculate improvement percentage - last 7 vs previous 7
        const sevenDaysAgoStr = getLocalDateString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), userTimezone)
        
        const last7Total = validScans.filter((scan) => {
          const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
          return scanLocalDate > sevenDaysAgoStr
        }).length

        const fourteenDaysAgoStr = getLocalDateString(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), userTimezone)
        
        const previous7Total = validScans.filter((scan) => {
          const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
          return scanLocalDate > fourteenDaysAgoStr && scanLocalDate <= sevenDaysAgoStr
        }).length

        console.log('[v0] Last 7 days scans:', last7Total, 'Previous 7 days scans:', previous7Total)

        // Calculate percentage change
        let percentChange = 0
        let improving = true
        if (previous7Total > 0) {
          percentChange = Math.round(((last7Total - previous7Total) / previous7Total) * 100)
        } else if (previous7Total === 0 && last7Total > 0) {
          percentChange = 100
        }

        improving = percentChange > 0

        // Generate trend display text
        let trend = 'No change'
        if (percentChange > 0) {
          trend = `↑ ${percentChange}% increase`
        } else if (percentChange < 0) {
          trend = `↓ ${Math.abs(percentChange)}% decrease`
        }

        setImprovementPercent(Math.abs(percentChange))
        setIsImproving(improving)
        setTrendDisplay(trend)

        // Calculate consistency percentage for LAST 7 DAYS ONLY
        // An "active day" is defined as a day with at least 2 scans
        const activeDaysCount = last7Days.filter((date) => {
          const dayScans = validScans.filter((scan) => {
            const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
            return scanLocalDate === date
          })
          return dayScans.length >= 2
        }).length

        const consistency = Math.round((activeDaysCount / 7) * 100)
        console.log('[v0] Consistency: Active days (2+ scans) in last 7 days:', activeDaysCount, '=', consistency + '%')
        setConsistencyPercent(consistency)

        // Calculate best day from ALL HISTORICAL DATA using getLocalDateString
        const allHistoricalDates = Array.from(uniqueDates).sort()
        console.log('[v0] Calculating best day from', allHistoricalDates.length, 'historical dates')

        const allDayScanCounts: { date: string; dayName: string; count: number }[] = []

        allHistoricalDates.forEach((dateStr) => {
          const dayScans = validScans.filter((scan) => {
            const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
            return scanLocalDate === dateStr
          })
          const dayName = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
          allDayScanCounts.push({ date: dateStr, dayName, count: dayScans.length })
        })

        console.log('[v0] All historical day scan counts:', allDayScanCounts.map(d => `${d.date}: ${d.count}`).join(', '))

        // Find the day with the most scans (most recent if tied)
        const bestDay = allDayScanCounts.reduce((best, current) => {
          if (current.count > best.count) {
            return current
          } else if (current.count === best.count && current.count > 0) {
            return current.date > best.date ? current : best
          }
          return best
        }, { date: '', dayName: 'No data yet', count: 0 })

        console.log('[v0] Best day:', bestDay.dayName, 'with', bestDay.count, 'scans')

        if (bestDay.count > 0) {
          setBestDayName(bestDay.dayName)
          setBestDayCount(bestDay.count)
          setHasBestDayData(true)
        } else {
          setBestDayName('No data yet')
          setBestDayCount(0)
          setHasBestDayData(false)
        }

        console.log('[v0] === END PROGRESS SCREEN FULL DATA CALC ===')
      }
    } catch (error) {
      console.error('[v0] Error fetching progress data:', error)
      setScoreData(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-foreground/60">Loading...</p>
      </div>
    )
  }
const streak = scoreData?.streak || 0
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md mx-auto px-6 py-16 space-y-8">
        {/* Header Section */}
        <ProgressHeader />

        {/* Highlight Stats - Streak & Today Scans */}
        <HighlightStats streak={streak || 0} todayScans={todayScans} />

        {/* Insights Section */}
        <ProgressInsights 
          improvementPercent={improvementPercent} 
          isImproving={isImproving}
          improvementText={
            improvementPercent === 0
              ? 'Your consistency is stable compared to the previous week.'
              : isImproving
              ? `Based on your last 7 days activity, your consistency has improved by ${improvementPercent}%.`
              : 'You\'re rebuilding your consistency. Keep going.'
          }
        />

        {/* Daily Score Trend Card */}
        <DailyScoreTrendCard data={chartData} trendDisplay={trendDisplay} />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Streak */}
          <div className={`bg-gradient-to-br rounded-2xl p-5 space-y-3 border transition-all ${
            streak === 0
              ? 'from-slate-500/10 to-slate-500/5 border-slate-500/20'
              : streak >= 7
              ? 'from-emerald-500/20 to-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
              : streak >= 3
              ? 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30'
              : 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <Flame size={18} className={streak >= 7 ? 'text-emerald-300' : 'text-emerald-400'} />
              <p className={`text-xs uppercase tracking-wider font-medium ${
                streak >= 7 ? 'text-emerald-300/70' : streak >= 3 ? 'text-emerald-400/70' : streak === 0 ? 'text-slate-400/70' : 'text-emerald-400/70'
              }`}>Streak</p>
            </div>
            <p className={`text-3xl font-black ${streak >= 7 ? 'text-emerald-300' : streak === 0 ? 'text-slate-400' : 'text-emerald-400'}`}>
              {streak || 0}
            </p>
            <div className="space-y-1">
              <p className="text-xs text-foreground/60">
                {streak === 0 ? 'Start today 🔥' : 'days in a row'}
              </p>
              {streak >= 7 && (
                <p className="text-xs font-semibold text-emerald-300">You're unstoppable!</p>
              )}
              {streak >= 3 && streak < 7 && (
                <p className="text-xs font-semibold text-emerald-400">Building momentum!</p>
              )}
            </div>
          </div>

          {/* Consistency */}
          <div className={`bg-gradient-to-br rounded-2xl p-5 space-y-3 border transition-all ${
            isTodayActive
              ? 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30'
              : 'from-blue-500/10 to-blue-500/5 border-blue-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className={isTodayActive ? 'text-emerald-400' : 'text-blue-400'} />
              <p className={`text-xs uppercase tracking-wider font-medium ${
                isTodayActive ? 'text-emerald-400/70' : 'text-blue-400/70'
              }`}>Consistency</p>
            </div>
            <p className={`text-3xl font-black ${isTodayActive ? 'text-emerald-400' : 'text-blue-400'}`}>
              {consistencyPercent}%
            </p>
            <div className="space-y-1">
              <p className="text-xs text-foreground/60">this week</p>
              
              {/* Dynamic Consistency Messages */}
              {consistencyPercent < 20 && (
                <p className="text-xs font-semibold text-blue-400">You're just getting started — keep going!</p>
              )}
              {consistencyPercent >= 20 && consistencyPercent <= 50 && (
                <p className="text-xs font-semibold text-emerald-400">You're building a habit — stay consistent!</p>
              )}
              {consistencyPercent > 50 && (
                <p className="text-xs font-semibold text-emerald-300">You're doing better than most users — amazing!</p>
              )}
              
              {isTodayActive && (
                <p className={`text-xs font-semibold ${todayScans >= 5 ? 'text-emerald-300' : 'text-emerald-400'}`}>
                  {todayScans >= 5 ? '🔥 Excellent progress today' : '🔥 Active today'}
                </p>
              )}
              {!isTodayActive && (
                <p className="text-xs text-foreground/50">Start scanning to build consistency</p>
              )}
            </div>
          </div>

          {/* Best Day */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-400" />
              <p className="text-xs text-purple-400/70 uppercase tracking-wider font-medium">Best Day</p>
            </div>
            <p className="text-2xl font-black text-purple-400">{bestDayName}</p>
            <p className="text-xs text-foreground/60">
              {hasBestDayData 
                ? `${bestDayCount} ${bestDayCount === 1 ? 'scan' : 'scans'}` 
                : 'Start scanning to see your best day'}
            </p>
          </div>

          {/* Total Scans */}
          <div className="bg-gradient-to-br from-slate-700/20 to-slate-700/10 border border-slate-600/20 rounded-2xl p-5 space-y-3">
            <p className="text-xs text-foreground/70 uppercase tracking-wider font-medium">Today</p>
            <p className="text-3xl font-black text-foreground">{todayScans}</p>
            <p className="text-xs text-foreground/60">scans</p>
          </div>
        </div>
      </div>
    </div>
  )
}
