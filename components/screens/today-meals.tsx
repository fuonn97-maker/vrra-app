'use client'

import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { getTodayDateString, getScansForLocalDate } from '@/lib/date-utils'

interface Meal {
  id: string
  meal_name: string
  created_at: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface TodayMealsProps {
  refreshKey?: number
  onTotalsUpdate?: (totals: { calories: number; protein: number; carbs: number; fat: number }) => void
  onMealDeleted?: () => void
}

export default function TodayMeals({ refreshKey = 0, onTotalsUpdate, onMealDeleted }: TodayMealsProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [scoreDiffByMeal, setScoreDiffByMeal] = useState<Record<string, number>>({})
  const [removingMealId, setRemovingMealId] = useState<string | null>(null)

  useEffect(() => {
    fetchTodayMeals()
  }, [refreshKey])

  useEffect(() => {
    // Calculate and emit totals whenever meals change
    const totals = {
      calories: meals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
      protein: meals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
      carbs: meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0),
      fat: meals.reduce((sum, meal) => sum + (meal.fat || 0), 0),
    }
    onTotalsUpdate?.(totals)
  }, [meals, onTotalsUpdate])

  const fetchTodayMeals = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      // Get session token
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setIsLoading(false)
        return
      }

      // Fetch today's scans (excluding soft-deleted ones)
      const today = getTodayDateString()
      console.log('[v0] === FETCHING TODAY MEALS ===')
      console.log('[v0] Local date today:', today)
      
      // Fetch ALL scans for this user, then filter locally for today
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('[v0] Total scans fetched:', data?.length || 0)
      
      if (error) {
        console.error('[v0] Error fetching scans:', error)
        setMeals([])
      } else {
        // Filter to scans for today only
        const todayScans = getScansForLocalDate(data || [], today)
        console.log('[v0] Scans for local date', today, ':', todayScans.length)
        
        // Filter out deleted scans (is_deleted IS NOT TRUE)
        const validTodayScans = todayScans.filter(scan => scan.is_deleted !== true)
        console.log('[v0] Valid scans for today (not deleted):', validTodayScans.length)
        console.log('[v0] === END FETCHING TODAY MEALS ===')
        
        setMeals(validTodayScans)
      }
    } catch (error) {
      console.error('[v0] Error fetching today meals:', error)
      setMeals([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (mealId: string) => {
  setDeleting(mealId)

  try {
    const { error } = await supabase
      .from('scans')
      .update({ is_deleted: true })
      .eq('id', mealId)

    if (error) throw error

    let scoreDiff = 0

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const today = new Date().toISOString().split('T')[0]

      const { data: scans } = await supabase
        .from('scans')
        .select('calories, protein, created_at')
        .eq('user_id', user.id)
        .eq('is_deleted', false)

      const todayScans = (scans || []).filter((scan) => {
        const scanDate = new Date(scan.created_at).toISOString().split('T')[0]
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

      const { data: existingScore } = await supabase
        .from('user_scores')
        .select('body_score')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      const oldScore = existingScore?.body_score ?? 0
      scoreDiff = avg - oldScore

      const { error: updateScoreError } = await supabase
        .from('user_scores')
        .update({
          meal_score: avg,
          daily_score: avg,
          body_score: avg,
        })
        .eq('user_id', user.id)
        .eq('date', today)

      if (updateScoreError) {
        console.error('DELETE TODAY updateScoreError =', updateScoreError)
      }
    }

    if (scoreDiff !== 0) {
      setRemovingMealId(mealId)
      setScoreDiffByMeal((prev) => ({ ...prev, [mealId]: scoreDiff }))

      toast.success(
        scoreDiff > 0
          ? `Meal improved (+${scoreDiff} score)`
          : `Meal removed (${scoreDiff} score)`
      )

      setTimeout(async () => {
        setScoreDiffByMeal((prev) => {
          const next = { ...prev }
          delete next[mealId]
          return next
        })

        setRemovingMealId(null)
        await fetchTodayMeals()
        onMealDeleted?.()
      }, 2500)
    } else {
      toast.success('Meal removed')
      await fetchTodayMeals()
      onMealDeleted?.()
    }
  } catch (error) {
    toast.error('Failed to remove meal')
    console.error('Error deleting meal:', error)
  } finally {
    setDeleting(null)
  }
}

  const calculateTotals = () => {
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fat: acc.fat + (meal.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  const totals = calculateTotals()

if (isLoading) {
  return (
    <div className="w-full max-w-md mx-auto px-6 py-8">
      <div className="h-20 bg-card/20 rounded-lg animate-pulse" />
    </div>
  )
}

return (
  <div className="w-full max-w-md mx-auto px-6 py-8 space-y-6">
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-foreground">Today's Meals</h2>
        <p className="text-sm text-muted-foreground">
          {meals.length === 0
            ? 'No meals added today yet'
            : `${meals.length} meals logged today`}
        </p>
      </div>

      {meals.length === 0 ? (
        <div className="bg-card/20 border border-border/20 rounded-xl p-8 text-center space-y-3">
          <p className="text-muted-foreground">No meals added today yet</p>
          <p className="text-xs text-muted-foreground/70">
            Scan your first meal to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={`relative bg-card/40 border border-border/20 rounded-lg p-4 flex items-start justify-between gap-3 transition-all duration-500 ${
                removingMealId === meal.id ? 'opacity-60 scale-[0.98]' : ''
              }`}
            >
              {scoreDiffByMeal[meal.id] !== undefined && (
                <div
                  className={`absolute right-3 top-2 z-20 pointer-events-none rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm animate-pulse ${
                    scoreDiffByMeal[meal.id] > 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {scoreDiffByMeal[meal.id] > 0 ? '+' : ''}
                  {scoreDiffByMeal[meal.id]} score
                </div>
              )}

              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {meal.meal_name}
                </h3>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground/70">Cal</p>
                    <p className="font-semibold text-foreground">{meal.calories}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground/70">P</p>
                    <p className="font-semibold text-primary">{meal.protein}g</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground/70">C</p>
                    <p className="font-semibold text-secondary">{meal.carbs}g</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground/70">F</p>
                    <p className="font-semibold text-accent">{meal.fat}g</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(meal.id)}
                disabled={deleting === meal.id}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                aria-label="Delete meal"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {meals.length > 0 && (
        <div className="bg-gradient-to-br from-primary/15 to-secondary/10 border border-border/20 rounded-xl p-4">
          <h3 className="font-semibold text-foreground">Today's Total</h3>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
                Calories
              </p>
              <p className="text-3xl font-black text-foreground">
                {Math.round(totals.calories)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
                Protein
              </p>
              <p className="text-3xl font-black text-primary">
                {Math.round(totals.protein)}g
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
                Carbs
              </p>
              <p className="text-2xl font-bold text-secondary">
                {Math.round(totals.carbs)}g
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground/70 uppercase tracking-wider">
                Fat
              </p>
              <p className="text-2xl font-bold text-accent">
                {Math.round(totals.fat)}g
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)
}