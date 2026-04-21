import { Camera, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getLocalDateString } from '@/lib/timezone-utils'
import RecentMeals from './recent-meals'
import DynamicInsight from './dynamic-insight'
import LimitReachedModal from '../limit-reached-modal'
import MealToast from '../meal-toast'
import ReminderCard from '../reminder-card'
import TodaysPlan from '../todays-plan'
import { useReminderState } from '@/lib/reminder-utils'

interface HomeScreenProps {
  scansToday: number
  maxScans: number
  isPremium: boolean
  workoutsCompleted: number
  onRefresh?: () => void
  onWorkoutClick?: () => void
}

interface ScoreData {
  scores: Array<{ date: string; body_score: number; meal_score: number; daily_score: number }>
  bodyScore: number
  dailyScore: number
  streak: number
  hasTodayScans: boolean
  workoutsCompleted: number
}

export default function HomeScreen(props: HomeScreenProps) {
  const {
    scansToday,
    maxScans,
    isPremium,
    workoutsCompleted
    onRefresh,
    onWorkoutClick,
  } = props
  const router = useRouter()
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [refreshKey, setRefreshKey] = useState(0)
  const [yesterday7DaysScores, setYesterday7DaysScores] = useState<number[]>([])
  const [todayMealsKey, setTodayMealsKey] = useState(0)
  const [mealTotals, setMealTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [last7DaysScans, setLast7DaysScans] = useState(0)
  const [previous7DaysScans, setPrevious7DaysScans] = useState(0)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [showMealToast, setShowMealToast] = useState(false)
  const reminderState = useReminderState(scoreData?.hasTodayScans ?? false)
  const scansRemaining = Math.max(0, maxScans - scansToday)
  const isLimitReached = !isPremium && scansRemaining <= 0

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
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

      const url = `/api/scores?days=14`
      console.log('[v0] Fetching from:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await response.json()

      console.log("DASHBOARD API DATA:", data)
      console.log('[v0] Response status:', response.status)
      console.log('[v0] Data bodyScore:', data.bodyScore, 'Type:', typeof data.bodyScore)

      if (response.ok && data.bodyScore !== undefined) {
        console.log("Dashboard scoreData:", data)
        console.log('[v0] Setting scoreData, bodyScore =', data.bodyScore)
        setScoreData(data)

        // Fetch user profile to get timezone for date calculations
        const { data: profileData } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id', user.id)
          .single()

        const userTimezone = profileData?.timezone || 'UTC'
        console.log('[v0] User timezone from profile:', userTimezone)

        // Get today's date using getLocalDateString
        const today = getLocalDateString(new Date().toISOString(), userTimezone)
        console.log('[v0] Local date today:', today)

        const last7Scores = data.scores
          .filter((s: any) => s.date !== today)
          .slice(-7)
          .map((s: any) => s.body_score || 0)

        setYesterday7DaysScores(last7Scores)

        // Calculate last 7 days and previous 7 days scans using getLocalDateString
        const last7Start = new Date()
        last7Start.setDate(last7Start.getDate() - 7)
        const last7StartLocalDate = getLocalDateString(last7Start.toISOString(), userTimezone)

        const previous7Start = new Date()
        previous7Start.setDate(previous7Start.getDate() - 14)
        const previous7StartLocalDate = getLocalDateString(previous7Start.toISOString(), userTimezone)
        const previous7EndLocalDate = last7StartLocalDate

        console.log('[v0] Date range for last 7 days (local):', last7StartLocalDate, 'to', today)
        console.log('[v0] Date range for previous 7 days (local):', previous7StartLocalDate, 'to', previous7EndLocalDate)

        // Fetch all scans and filter locally using getLocalDateString
        const { data: allScans } = await supabase
          .from('scans')
          .select('created_at, is_deleted')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (allScans) {
          console.log('[v0] Total scans fetched for metrics:', allScans.length)

          // Filter scans for last 7 days using getLocalDateString
          const last7Scans = allScans.filter((scan) => {
            const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
            
            const isInRange = scanLocalDate >= last7StartLocalDate && scanLocalDate <= today
            if (isInRange && scan.is_deleted !== true) {
              console.log('[v0]   ✓ Last 7 valid scan:', scanLocalDate)
            }
            return isInRange && scan.is_deleted !== true
          })

          // Filter scans for previous 7 days using getLocalDateString
          const previous7Scans = allScans.filter((scan) => {
            const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
            
            const isInRange = scanLocalDate >= previous7StartLocalDate && scanLocalDate < last7StartLocalDate
            if (isInRange && scan.is_deleted !== true) {
              console.log('[v0]   ✓ Previous 7 valid scan:', scanLocalDate)
            }
            return isInRange && scan.is_deleted !== true
          })

          setLast7DaysScans(last7Scans.length)
          setPrevious7DaysScans(previous7Scans.length)
          console.log('[v0] Last 7 days valid scans:', last7Scans.length)
          console.log('[v0] Previous 7 days valid scans:', previous7Scans.length)
        }

        console.log('[v0] State updated successfully')
      } else {
        console.error('[v0] Invalid response:', response.status, data)
        setScoreData(null)
      }
    } catch (error) {
      console.error('[v0] Error fetching scores:', error)
      setScoreData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScanMeal = () => {
    // Enforce scan limit for free users
    if (!isPremium && scansRemaining <= 0) {
      setShowLimitModal(true)
      return
    }
    router.push('/scan-meal')
  }

  const handleUpgradeClick = () => {
    setShowLimitModal(false)
    // TODO: Navigate to upgrade page when available
    router.push('/upgrade')
  }

  const refreshMeals = () => {
    setTodayMealsKey(prev => prev + 1)
  }

  const refreshScores = async () => {
    console.log('[v0] Refreshing scores after meal deletion')
    await fetchScores()
    console.log('[v0] Scores refreshed after meal deletion')
  }

  const handleMealDeleted = () => {
    // Refresh the home screen when a meal is deleted
    setRefreshKey(prev => prev + 1)
  }

  const handleMealAdded = () => {
    // Show dopamine feedback when a meal is logged
    setShowMealToast(true)
    // Refresh to show updated counts and streaks
    setRefreshKey(prev => prev + 1)
  }
  return (
    <div className="w-full max-w-md mx-auto px-6 py-8 space-y-12">
      {/* Main Daily Score - Centered Hero Focal Point */}
      <div className="flex flex-col items-center justify-center py-12 space-y-8">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Your Body Score</p>
        <div className="relative w-48 h-48">
          {/* Outer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl" />
          
          {/* Circular progress ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#ringGradient)"
              strokeWidth="3"
              strokeDasharray={`${282 * ((scoreData?.bodyScore || 0) / 100)} ${282 * ((100 - (scoreData?.bodyScore || 0)) / 100)}`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(156,204,102,1)" />
                <stop offset="100%" stopColor="rgba(96,165,250,1)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Score content */}
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center">
            <div className="text-6xl font-black text-primary leading-none">
              {scoreData?.bodyScore ?? 0}
            </div>
            <div className="text-xs text-primary font-semibold mt-2">of 100</div>
            <div className="text-sm text-accent font-bold mt-3 flex items-center gap-1">
              {scoreData && yesterday7DaysScores.length > 0 
                ? `+${Math.round(scoreData.bodyScore - (yesterday7DaysScores[yesterday7DaysScores.length - 1] || 0))}`
                : '+5'} <span className="text-accent">↑</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">from yesterday</p>
          </div>
        </div>

        {/* 7-Day Trend Dots */}
        <div className="flex items-end justify-center gap-1.5 h-12">
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : yesterday7DaysScores.length > 0 ? (
            yesterday7DaysScores.map((score, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="rounded-full bg-gradient-to-b from-primary to-secondary transition-all hover:scale-110"
                  style={{
                    width: '8px',
                    height: `${Math.max(8, (score / 100) * 40)}px`,
                  }}
                  title={`Day ${idx - yesterday7DaysScores.length + 1}: ${score}/100`}
                />
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No data yet</p>
          )}
        </div>

        {/* Streak Badge with Milestone Rewards */}
        {scoreData && (
          <div className="space-y-2">
            <div className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-all ${
              scoreData.streak === 0
                ? 'bg-slate-500/10 border-slate-500/30'
                : scoreData.streak >= 7
                ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : scoreData.streak >= 3
                ? 'bg-emerald-500/15 border-emerald-500/40'
                : 'bg-accent/10 border-accent/40'
            }`}>
              <span className="text-lg">🔥</span>
              <span className={`text-sm font-bold ${
                scoreData.streak >= 7 ? 'text-emerald-300' : scoreData.streak >= 3 ? 'text-emerald-400' : 'text-accent'
              }`}>{scoreData.streak} day streak</span>
            </div>
            
            {/* Streak Milestone Messages */}
            {scoreData.streak >= 7 && (
              <p className="text-xs text-emerald-400 font-semibold px-4">You're unstoppable!</p>
            )}
            {scoreData.streak >= 3 && scoreData.streak < 7 && (
              <p className="text-xs text-emerald-400 font-semibold px-4">You're building momentum!</p>
            )}
            {scoreData.streak === 0 && (
              <p className="text-xs text-muted-foreground/70 px-4">Start today to begin your streak</p>
            )}
            
            {/* Streak Status Message */}
            {scoreData.hasTodayScans ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-semibold text-emerald-400">Keep going, don't break your streak!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <span className="text-sm">⚠️</span>
                <span className="text-xs font-semibold text-amber-400">Log a meal now to keep your streak alive</span>
              </div>
            )}
          </div>
        )}
        
        {/* Dynamic Insight */}
        {scoreData && (
          <DynamicInsight
            todayScans={scansToday}
            streak={scoreData.streak}
            last7DaysTotal={last7DaysScans}
            previous7DaysTotal={previous7DaysScans}
            consistencyPercent={0}
          />
        )}

        {/* Today's Plan Section */}
        <div className="pt-4">
          <TodaysPlan
  scansToday={scansToday}
  maxScans={maxScans}
  isPremium={isPremium}
  streak={scoreData?.streak || 0}
  mealTotals={mealTotals}
  onScanClick={handleScanMeal}
  onWorkoutClick={onWorkoutClick}
  hasCompletedWorkout={false}
            
  workoutsCompleted={scoreData?.workoutsCompleted || 0}          
/>
        </div>
      </div>

      {/* Daily Scans Card - Premium placement */}
      {!isPremium && (
        <div className={`bg-gradient-to-br from-card/60 to-card/30 border rounded-2xl p-6 backdrop-blur-sm transition-all ${
          isLimitReached 
            ? 'border-red-500/50 bg-red-500/5 animate-pulse' 
            : 'border-primary/20'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Scans remaining today</p>
              <p className={`text-4xl font-black ${isLimitReached ? 'text-red-500' : 'text-primary'}`}>
                {scansRemaining}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-2">Of {maxScans} daily</p>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isLimitReached
                  ? 'bg-red-500/20'
                  : 'bg-gradient-to-br from-primary/20 to-secondary/20'
              }`}>
                <span className={`text-sm font-bold ${isLimitReached ? 'text-red-500' : 'text-primary'}`}>
                  {Math.round(((maxScans - scansToday) / maxScans) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Upgrade to Premium for unlimited scans</p>
          
          {isLimitReached && (
            <button
              onClick={() => router.push('/upgrade')}
              className="w-full mt-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg hover:shadow-red-500/30"
            >
              Upgrade Now
            </button>
          )}
        </div>
      )}

      {isPremium && (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/40 rounded-full">
            <Crown size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">Premium Active</span>
          </div>
          <button
            onClick={() => router.push('/premium')}
            className="text-xs px-3 py-1.5 text-primary/70 hover:text-primary font-medium transition-colors"
          >
            Manage Plan
          </button>
        </div>
      )}

      {/* Premium Scan Button Section */}
      <div className="space-y-3 pt-2">
        <p className="text-xs text-foreground/60 font-medium">Stay on track with your next scan</p>
        <button
          onClick={handleScanMeal}
          disabled={isLimitReached && !isPremium}
          className="w-full group relative overflow-hidden bg-gradient-to-r from-primary via-secondary to-cyan-400 text-primary-foreground font-bold py-4 px-6 rounded-2xl hover:shadow-[0_0_40px_rgba(156,204,102,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 group-hover:via-white/20 transition-all duration-300" />
          
          {/* Content */}
          <div className="relative flex items-center justify-center gap-2">
            <Camera size={20} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="text-base tracking-wide">Scan Your Next Meal</span>
          </div>
        </button>
      </div>

      {/* Daily Reminder - Shows if user hasn't scanned today */}
      {reminderState?.shouldShow && (
        <ReminderCard
          message={reminderState.message}
          reminderTime={reminderState.reminderTime}
          onScanClick={handleScanMeal}
        />
      )}

      {/* Recent Meals Section */}
      <RecentMeals refreshKey={todayMealsKey} onTotalsUpdate={setMealTotals} onMealDeleted={handleMealDeleted} />

      {/* Calories - Compact */}
      <div className="space-y-5 bg-card/40 border border-border/30 rounded-2xl p-7 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-foreground/60 text-xs uppercase tracking-wider font-semibold">Calories</p>
            <p className="text-3xl font-black text-foreground mt-3">{mealTotals.calories.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-primary">{Math.min(Math.round((mealTotals.calories / 2000) * 100), 100)}%</div>
            <p className="text-xs text-muted-foreground mt-1">/ 2,000 kcal</p>
          </div>
        </div>
        <div className="h-2.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            style={{ width: `${Math.min((mealTotals.calories / 2000) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Macronutrients - Clean */}
      <div className="space-y-5 bg-card/40 border border-border/30 rounded-2xl p-7 backdrop-blur-sm">
        <p className="text-foreground/60 text-xs uppercase tracking-wider font-semibold">Macronutrients</p>
        <div className="space-y-5">
          {[
            { label: 'Protein', value: mealTotals.protein, target: 150, unit: 'g' },
            { label: 'Carbs', value: mealTotals.carbs, target: 250, unit: 'g' },
            { label: 'Fat', value: mealTotals.fat, target: 65, unit: 'g' },
          ].map((macro) => {
            const percent = Math.min((macro.value / macro.target) * 100, 100)
            return (
              <div key={macro.label}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground font-medium">{macro.label}</span>
                  <span className="text-sm text-primary font-semibold">{Math.round(macro.value)}{macro.unit}</span>
                </div>
                <div className="h-2 bg-border/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">/ {macro.target}{macro.unit}</p>
              </div>
            )
          })}
        </div>

        {/* AI Macro Feedback */}
        <div className="border-t border-border/20 pt-4 mt-4">
          <p className="text-xs font-semibold text-foreground/70 mb-2">Macro Insight</p>
          <p className="text-sm text-foreground">
            {mealTotals.protein < 100 && "You need more protein today"}
            {mealTotals.protein >= 100 && mealTotals.fat > 70 && "Fat intake is higher than target"}
            {mealTotals.protein >= 100 && mealTotals.fat <= 70 && mealTotals.carbs >= 200 && "You're well balanced today"}
            {mealTotals.protein >= 100 && mealTotals.fat <= 70 && mealTotals.carbs < 200 && "Good protein intake, consider more carbs"}
          </p>
        </div>
      </div>

      {/* Scan Meal Button */}
      <button 
        onClick={handleScanMeal} 
        disabled={isLimitReached}
        className={`w-full font-bold py-6 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 group border text-lg ${
          isLimitReached
            ? 'bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed opacity-60'
            : 'bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:shadow-[0_0_32px_rgba(156,204,102,0.4)] border-primary/30'
        }`}
      >
        <Camera size={24} className="group-hover:scale-110 transition-transform" />
        {isLimitReached ? 'Limit Reached' : 'Scan Meal'}
      </button>

      {/* Limit Reached Modal */}
      <LimitReachedModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        onUpgrade={handleUpgradeClick}
      />

      {/* Meal Logged Toast */}
      <MealToast 
        isVisible={showMealToast} 
        onHide={() => setShowMealToast(false)}
      />
    </div>
  )
}
