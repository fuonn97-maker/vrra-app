'use client'

import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getLocalDateString, formatLocalTime } from '@/lib/timezone-utils'

interface Meal {
  id: string
  meal_name: string
  created_at: string
  calories: number
  protein: number
  carbs: number
  fat: number
  is_deleted?: boolean
}

interface MealGroup {
  date: string
  label: string
  meals: Meal[]
}

interface RecentMealsProps {
  refreshKey?: number
  onTotalsUpdate?: (totals: { calories: number; protein: number; carbs: number; fat: number }) => void
  onMealDeleted?: () => void
  showAll?: boolean
}

export default function RecentMeals({ refreshKey = 0, onTotalsUpdate, onMealDeleted, showAll = false }: RecentMealsProps) {
  const router = useRouter()
  const [mealGroups, setMealGroups] = useState<MealGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [userTimezone, setUserTimezone] = useState('UTC')

  useEffect(() => {
    fetchRecentMeals()
  }, [refreshKey])

  useEffect(() => {
    // Calculate and emit totals for all meals combined
    const allMeals = mealGroups.flatMap(group => group.meals)
    const totals = {
      calories: allMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
      protein: allMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
      carbs: allMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
      fat: allMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0),
    }
    onTotalsUpdate?.(totals)
  }, [mealGroups, onTotalsUpdate])

  const fetchRecentMeals = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log('[v0] No user found')
        setIsLoading(false)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setIsLoading(false)
        return
      }

      // Fetch user profile to get timezone
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single()

      const userTimezone = profileData?.timezone || 'UTC'
      console.log('[v0] === RECENT MEALS FETCH START ===')
      console.log('[v0] User timezone from profile:', userTimezone)
      
      setUserTimezone(userTimezone)

      // Fetch all scans for this user
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[v0] Error fetching scans:', error)
        setMealGroups([])
      } else {
        // Filter out deleted scans
        const validScans = (data || []).filter(scan => scan.is_deleted !== true)
        console.log('[v0] Total valid scans fetched:', validScans.length)
        
        // TEST: Log first scan conversion for debugging
        if (validScans.length > 0) {
          const firstScan = validScans[0]
          console.log('[TEST SCAN CONVERSION]', {
            rawUTC: firstScan.created_at,
            timezone: userTimezone,
            localDate: getLocalDateString(firstScan.created_at, userTimezone),
            localTime: formatLocalTime(firstScan.created_at, userTimezone),
          })
        }

        // Get today's date in user's timezone using getLocalDateString
        const today = getLocalDateString(new Date().toISOString(), userTimezone)
        console.log('[v0] Today local date (', userTimezone, '):', today)

        // Group scans by converting UTC to user timezone using getLocalDateString
        const todayScans = validScans
          .filter((scan) => {
            const scanLocalDate = getLocalDateString(scan.created_at, userTimezone)
            const isToday = scanLocalDate === today
            if (isToday) {
              console.log('[v0]   ✓ Scan', scan.id, 'is today:', scanLocalDate)
            }
            return isToday
          })
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        console.log('[v0] Scans for today:', todayScans.length)

        // Build meal groups - only today
        const groups: MealGroup[] = []

        // Add today if there are scans
        if (todayScans.length > 0) {
          groups.push({
            date: today,
            label: "Today's Meals",
            meals: todayScans,
          })
        }

        setMealGroups(groups)
        console.log('[v0] === RECENT MEALS FETCH COMPLETE ===')
      }
      setIsLoading(false)
    } catch (error) {
      console.error('[v0] Error in fetchRecentMeals:', error)
      setMealGroups([])
      setIsLoading(false)
    }
  }

  const handleDelete = async (mealId: string) => {
  console.log('RECENT DELETE CLICKED', mealId)

  setDeleting(mealId)

  try {
    const { error } = await supabase
      .from('scans')
      .update({ is_deleted: true })
      .eq('id', mealId)

    if (error) throw error

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const today = new Date().toLocaleDateString('en-CA')

      const { data: scans } = await supabase
        .from('scans')
        .select('calories, protein, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)

      const todayScans = (scans || []).filter((scan) => {
        const scanDate = new Date(scan.created_at).toLocaleDateString('en-CA')
        return scanDate === today
      })

      let totalScore = 0

      todayScans.forEach((scan) => {
        totalScore += Math.max(
          0,
          100 - scan.calories / 10 + scan.protein * 2
        )
      })

      const avg =
        todayScans.length > 0
          ? Math.round(totalScore / todayScans.length)
          : 0

      const { data: updatedScores, error: updateScoreError } = await supabase
        .from('user_scores')
        .update({
          meal_score: avg,
          daily_score: avg,
          body_score: avg,
        })
        .eq('user_id', user.id)
        .eq('date', today)
        .select()

      console.log('DELETE TODAY avg =', avg)
      console.log('DELETE TODAY updatedScores =', updatedScores)
      console.log('DELETE TODAY updateScoreError =', updateScoreError)
    }

    toast.success('Meal removed')
    await fetchRecentMeals()
    onMealDeleted?.()
  } catch (error) {
    toast.error('Failed to remove meal')
    console.error('[v0] Error deleting meal:', error)
  } finally {
    setDeleting(null)
  }
}

  // Empty state
  if (!isLoading && mealGroups.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Today's Meals</h3>
        <div className="bg-card/30 border border-border/30 rounded-2xl p-8 text-center">
          <p className="text-foreground/60">No meals logged today yet</p>
          <p className="text-sm text-foreground/40 mt-2">Scan or log your first meal to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold">Today's Meals</h3>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : mealGroups.flatMap((g) => g.meals).length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center space-y-2">
          <p className="text-foreground/70 font-medium">No meals logged yet</p>
          <p className="text-sm text-foreground/50">Scan or log your first meal to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mealGroups
            .flatMap((g) => g.meals)
            .slice(0, showAll ? undefined : 2)
            .map((meal) => (
              <div
                key={meal.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-primary/30 transition-all duration-200 group"
              >
                {/* Top row: Meal name (left) + Delete button (right) */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate flex-1">
                    {meal.meal_name}
                  </h4>
                  <button
                    onClick={() => handleDelete(meal.id)}
                    disabled={deleting === meal.id}
                    className="flex-shrink-0 p-2 text-foreground/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                    aria-label="Delete meal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Time below */}
                <p className="text-xs text-foreground/50 mb-4">
                  {formatLocalTime(meal.created_at, userTimezone)}
                </p>

                {/* Nutrition grid: CAL, PRO, CARB, FAT */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-black/20 hover:bg-primary/20 rounded-lg p-3 text-center transition-colors">
                    <p className="text-xs text-foreground/50 uppercase tracking-wider font-medium">Cal</p>
                    <p className="font-bold text-sm text-foreground mt-1">{meal.calories}</p>
                  </div>
                  <div className="bg-black/20 hover:bg-primary/20 rounded-lg p-3 text-center transition-colors">
                    <p className="text-xs text-foreground/50 uppercase tracking-wider font-medium">Pro</p>
                    <p className="font-bold text-sm text-foreground mt-1">{meal.protein}g</p>
                  </div>
                  <div className="bg-black/20 hover:bg-primary/20 rounded-lg p-3 text-center transition-colors">
                    <p className="text-xs text-foreground/50 uppercase tracking-wider font-medium">Carb</p>
                    <p className="font-bold text-sm text-foreground mt-1">{meal.carbs}g</p>
                  </div>
                  <div className="bg-black/20 hover:bg-primary/20 rounded-lg p-3 text-center transition-colors">
                    <p className="text-xs text-foreground/50 uppercase tracking-wider font-medium">Fat</p>
                    <p className="font-bold text-sm text-foreground mt-1">{meal.fat}g</p>
                  </div>
                </div>
              </div>
            ))}
          
          {/* View All Meals Button - Show if more than 2 meals and not showing all */}
          {!showAll && mealGroups.flatMap((g) => g.meals).length > 2 && (
            <button 
              onClick={() => router.push('/dashboard/meals')}
              className="w-full py-2 text-center text-sm text-primary/70 hover:text-primary font-medium transition-colors border border-primary/20 rounded-xl hover:border-primary/40 hover:bg-primary/5"
            >
              View All Meals
            </button>
          )}
        </div>
      )}
    </div>
  )
}
