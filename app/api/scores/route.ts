import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLocalDateString } from '@/lib/timezone-utils'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

interface MealData {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Calculate meal score based on macronutrients
function calculateMealScore(meal: MealData): number {
  const { calories, protein, carbs, fat } = meal

  console.log('[v0] calculateMealScore called with:', { calories, protein, carbs, fat })

  // Validate that we have meaningful data
  if (!calories || calories === 0) {
    console.log('[v0] WARNING: No/zero calories, returning default 50')
    return 50
  }

  // Optimal macro ratios for balanced nutrition
  const proteinCals = (protein || 0) * 4
  const carbsCals = (carbs || 0) * 4
  const fatCals = (fat || 0) * 9
  const totalCalories = proteinCals + carbsCals + fatCals

  console.log('[v0] Calorie breakdown: protein_cals:', proteinCals, 'carbs_cals:', carbsCals, 'fat_cals:', fatCals, 'total:', totalCalories)

  if (totalCalories === 0) {
    console.log('[v0] WARNING: No macro data, returning default 50')
    return 50
  }

  const proteinRatio = proteinCals / totalCalories
  const carbsRatio = carbsCals / totalCalories
  const fatRatio = fatCals / totalCalories

  console.log('[v0] Macro ratios: protein:', proteinRatio.toFixed(2), 'carbs:', carbsRatio.toFixed(2), 'fat:', fatRatio.toFixed(2))

  let score = 50 // Start with base score

  // Protein scoring (ideal: 20-35%)
  if (proteinRatio >= 0.2 && proteinRatio <= 0.35) {
    score += 25
  } else if (proteinRatio >= 0.15 && proteinRatio <= 0.4) {
    score += 15
  } else if (proteinRatio >= 0.1 && proteinRatio <= 0.45) {
    score += 5
  }

  // Carbs scoring (ideal: 45-65%)
  if (carbsRatio >= 0.45 && carbsRatio <= 0.65) {
    score += 20
  } else if (carbsRatio >= 0.35 && carbsRatio <= 0.75) {
    score += 10
  }

  // Fat scoring (ideal: 20-35%)
  if (fatRatio >= 0.2 && fatRatio <= 0.35) {
    score += 15
  } else if (fatRatio >= 0.15 && fatRatio <= 0.4) {
    score += 10
  }

  // Calorie balance (300-800 kcal is ideal for a meal)
  if (calories >= 300 && calories <= 800) {
    score += 10
  } else if (calories >= 200 && calories <= 1000) {
    score += 5
  }

  // Ensure score is between 0-100
  const finalScore = Math.min(100, Math.max(0, score))
  console.log('[v0] Score calculations complete. Final score:', finalScore)
  console.log('[v0] (base:50 + bonuses) = finalScore')
  return finalScore
}

// Get feedback based on meal score
function getMealFeedback(score: number): { message: string; type: 'excellent' | 'good' | 'fair' | 'improve' } {
  if (score >= 85) {
    return {
      message: '✨ Excellent! This meal has great macro balance and is perfect for your fitness goals.',
      type: 'excellent',
    }
  } else if (score >= 70) {
    return {
      message: '👍 Good meal! The nutrition is well-balanced. Consider adding more vegetables for micronutrients.',
      type: 'good',
    }
  } else if (score >= 50) {
    return {
      message: '⚠️ Fair nutritional profile. Try increasing protein or reducing refined carbs.',
      type: 'fair',
    }
  } else {
    return {
      message: '💡 Opportunity to improve! Focus on adding lean protein and whole grains.',
      type: 'improve',
    }
  }
}


export async function POST(req: NextRequest) {
  try {
    const { mealData, foodName } = await req.json()

    console.log('[v0] POST /api/scores - Received request')
    console.log('[v0] foodName:', foodName)
    console.log('[v0] mealData:', mealData)

    // Get authenticated user from Supabase context
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.split('Bearer ')[1]

    if (!token) {
      console.log('[v0] Missing authorization token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create temporary client just to verify the token
    const tempClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Set auth session with token
    const {
      data: { user },
      error: authError,
    } = await tempClient.auth.getUser(token)

    if (authError || !user) {
      console.error('[v0] Auth error:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    console.log('[v0] ===== STEP 1: AUTHENTICATED USER =====')
    console.log('[v0] Authenticated user ID:', userId)

    // Create authenticated Supabase client with Bearer token
    // This ensures all queries run as the authenticated user, not as anon
    const authenticatedSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    if (!mealData) {
      console.log('[v0] Missing mealData')
      return NextResponse.json({ error: 'Missing mealData' }, { status: 400 })
    }

    // Calculate meal score
    const mealScore = calculateMealScore(mealData)
    const feedback = getMealFeedback(mealScore)

    console.log('[v0] Calculated mealScore:', mealScore)

    // Get today's date using getLocalDateString with user's timezone
    const { data: profileData } = await authenticatedSupabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .single()

    const userTimezone = profileData?.timezone || 'UTC'
    const today = getLocalDateString(new Date().toISOString(), userTimezone)

    // Insert scan into database first
    const scanPayload = {
      user_id: userId,
      meal_name: foodName || 'Meal',
      calories: Math.round(mealData.calories) || 0,
      protein: mealData.protein || 0,
      carbs: mealData.carbs || 0,
      fat: mealData.fat || 0,
    }

    const { data: scanData, error: scanError } = await authenticatedSupabase
      .from('scans')
      .insert([scanPayload])
      .select()

    if (scanError) {
      console.error('[v0] Scan insert error:', scanError.message, scanError.code, scanError.details)
      return NextResponse.json({ error: `Failed to save scan: ${scanError.message}` }, { status: 500 })
    }

    // Step 2: Fetch ALL scans for this user (NO DATE FILTER - debugging)
    console.log('[v0] ===== STEP 2: FETCHING ALL SCANS =====')
    console.log('[v0] Fetching all scans for user_id:', userId)
    
    const { data: todayScans, error: scansError } = await authenticatedSupabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (scansError) {
      console.error('[v0] Error fetching scans:', scansError.message, scansError.code, scansError.details)
      return NextResponse.json({ error: `Failed to fetch scans: ${scansError.message}` }, { status: 500 })
    }

    console.log('[v0] ===== STEP 3: SCANS COUNT =====')
    console.log('[v0] Total scans found:', todayScans?.length || 0)
    
    if (!todayScans || todayScans.length === 0) {
      console.error('[v0] No scans found for this user')
      return NextResponse.json({ error: 'No scans found' }, { status: 400 })
    }

    // Step 3: Log each scan and calculate individual meal scores
    console.log('[v0] ===== STEP 4: INDIVIDUAL SCAN DATA & MEAL SCORES =====')
    const allMealScores: number[] = []
    
    todayScans.forEach((scan, idx) => {
      console.log(`[v0] Scan #${idx + 1}:`)
      console.log(`[v0]   meal_name: "${scan.meal_name}"`)
      console.log(`[v0]   calories: ${scan.calories}`)
      console.log(`[v0]   protein: ${scan.protein}`)
      console.log(`[v0]   carbs: ${scan.carbs}`)
      console.log(`[v0]   fat: ${scan.fat}`)
      
      const scanScore = calculateMealScore({
        calories: scan.calories || 0,
        protein: scan.protein || 0,
        carbs: scan.carbs || 0,
        fat: scan.fat || 0,
      })
      
      console.log(`[v0]   calculated meal_score: ${scanScore}`)
      allMealScores.push(scanScore)
    })

    // Step 4: Log mealScores array
    console.log('[v0] ===== STEP 5: MEAL SCORES ARRAY =====')
    console.log('[v0] All meal scores:', allMealScores)

    // Step 5: Calculate final daily_score
    console.log('[v0] ===== STEP 6: FINAL DAILY SCORE CALCULATION =====')
    const totalScore = allMealScores.reduce((sum, score) => sum + score, 0)
    const dailyScore = allMealScores.length > 0 ? Math.round(totalScore / allMealScores.length) : 0
    console.log(`[v0] Sum of all scores: ${totalScore}`)
    console.log(`[v0] Number of meals: ${allMealScores.length}`)
    console.log(`[v0] Daily score calculation: ${totalScore} / ${allMealScores.length} = ${dailyScore}`)

    // Step 6: Log final body_score
    console.log('[v0] ===== STEP 7: FINAL BODY SCORE =====')
    const bodyScore = dailyScore
    console.log('[v0] Body score:', bodyScore)

    // Step 7: Log the exact user_scores upsert payload
    console.log('[v0] ===== STEP 8: UPSERT PAYLOAD =====')
    const now = new Date().toISOString()
    console.log('[v0] Today date (YYYY-MM-DD):', today)
    console.log('[v0] Type of date:', typeof today)
    
    const upsertPayload = {
      user_id: userId,
      date: today,
      meal_score: mealScore,
      daily_score: dailyScore,
      body_score: bodyScore,
      created_at: now,
    }
    console.log('[v0] Exact upsert payload:')
    console.log('[v0]   user_id:', upsertPayload.user_id)
    console.log('[v0]   date:', upsertPayload.date)
    console.log('[v0]   meal_score:', upsertPayload.meal_score)
    console.log('[v0]   daily_score:', upsertPayload.daily_score)
    console.log('[v0]   body_score:', upsertPayload.body_score)
    console.log('[v0]   created_at:', upsertPayload.created_at)

    // Step 8: Upsert and log success/failure
    console.log('[v0] ===== STEP 9: UPSERT OPERATION =====')
    console.log('[v0] Calling upsert with onConflict: user_id,date')
    
    // First, check if row exists
    const { data: existingRow, error: checkError } = await authenticatedSupabase
      .from('user_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[v0] Error checking existing row:', checkError.message)
    } else {
      if (existingRow) {
        console.log('[v0] Existing row found, will UPDATE')
      } else {
        console.log('[v0] No existing row found, will INSERT')
      }
    }

    const { data: upsertResult, error: upsertError } = await authenticatedSupabase
      .from('user_scores')
      .upsert([upsertPayload], { onConflict: 'user_id,date' })
      .select()

    if (upsertError) {
      console.error('[v0] UPSERT FAILED')
      console.error('[v0]   Error message:', upsertError.message)
      console.error('[v0]   Error code:', upsertError.code)
      console.error('[v0]   Error details:', JSON.stringify(upsertError.details))
      console.error('[v0]   Full error object:', JSON.stringify(upsertError))
      return NextResponse.json({ error: `Failed to upsert score: ${upsertError.message}` }, { status: 500 })
    }

    console.log('[v0] UPSERT SUCCEEDED')
    console.log('[v0]   Number of rows returned:', upsertResult?.length || 0)
    if (upsertResult && upsertResult.length > 0) {
      const returnedRow = upsertResult[0]
      console.log('[v0]   Returned row from Supabase:')
      console.log('[v0]     id:', returnedRow.id)
      console.log('[v0]     user_id:', returnedRow.user_id)
      console.log('[v0]     date:', returnedRow.date)
      console.log('[v0]     meal_score:', returnedRow.meal_score)
      console.log('[v0]     daily_score:', returnedRow.daily_score)
      console.log('[v0]     body_score:', returnedRow.body_score)
      console.log('[v0]     created_at:', returnedRow.created_at)
      console.log('[v0]   ✓ Verified: Row was actually inserted/updated in database')
    } else {
      console.error('[v0]   WARNING: Upsert returned no rows!')
    }

    console.log('[v0] Returning success response')
    return NextResponse.json({
      mealScore,
      dailyScore,
      bodyScore,
      feedback,
      success: true,
    })
  } catch (error) {
    console.error('[v0] Score calculation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint to fetch user's scores
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = searchParams.get('days') || '7' // Default to last 7 days

    console.log('[v0] GET /api/scores - Received request')
    console.log('[v0] days:', days)

    // Extract Bearer token from Authorization header
    const authHeader = req.headers.get('authorization')
    console.log('[v0] Authorization header:', authHeader ? 'Present' : 'Missing')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[v0] Missing or invalid Authorization header')
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('[v0] Token extracted, length:', token.length)

    // Create temp client to extract user from token
    const tempClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await tempClient.auth.getUser(token)

    if (authError || !user) {
      console.error('[v0] Failed to get user from token:', authError?.message)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = user.id
    console.log('[v0] User authenticated, userId:', userId)

    // Get user's timezone from profile
    const authenticatedSupabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    const { data: profileData } = await authenticatedSupabase
      .from('profiles')
      .select('timezone,streak,workouts_cmpleted')
      .eq('id', userId)
      .single()

    const userTimezone = profileData?.timezone || 'UTC'

    const daysNum = parseInt(days)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysNum)
    const startDateStr = getLocalDateString(startDate.toISOString(), userTimezone)

    console.log('[v0] Fetching scores from', startDateStr, 'onwards')

    const { data: scores, error } = await authenticatedSupabase
      .from('user_scores')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: true })

    if (error) {
      console.error('[v0] Fetch error:', error.message, error.code)
      return NextResponse.json({ error: `Failed to fetch scores: ${error.message}` }, { status: 500 })
    }

    console.log('[v0] Fetched', scores.length, 'score records')

    // Get TODAY'S body score using user's local timezone
    const today = getLocalDateString(new Date().toISOString(),userTimezone)
    const todayScore = scores.find((s) => s.date === today)
    const bodyScore = todayScore?.body_score ?? 0
    const dailyScore = todayScore?.daily_score ?? 0

    console.log('[v0] Today local date:', today)
    console.log('[v0] Matched todayScore:', todayScore)
    console.log('[v0] Returning bodyScore:', bodyScore, 'dailyScore:', dailyScore)

    // Calculate streak based on scans table
    // Get all scans for this user (no date limit) - EXCLUDING soft-deleted scans for streak
    const { data: allScans, error: scansError } = await authenticatedSupabase
      .from('scans')
      .select('created_at, is_deleted')
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    if (scansError) {
      console.error('[v0] Error fetching scans for streak:', scansError.message)
    }

    // Extract unique dates from non-deleted scans using getLocalDateString
    const uniqueScanDates = new Set<string>()
    
    if (allScans) {
  for (const scan of allScans) {
    const localDateStr = getLocalDateString(scan.created_at, userTimezone)
    console.log('[v0] scan created_at raw:', scan.created_at)
    console.log('[v0] scan localDateStr:', localDateStr)
    uniqueScanDates.add(localDateStr)
  }
}

    // Sort dates in descending order for easier processing
    const sortedDates = Array.from(uniqueScanDates).sort().reverse()
    console.log('[v0] Local scan dates (sorted descending):', sortedDates.join(', '))

    // Calculate streak: count consecutive days backwards from today
    // Start from today's local date and count backwards
    let streak = 0
    const todayLocalDate = getLocalDateString(new Date().toISOString(), userTimezone)
    console.log('[v0] todayLocalDate:', todayLocalDate)
    
    // Build date strings for each day counting backwards
    let currentCheckDate = new Date()
    currentCheckDate.setHours(0, 0, 0, 0) // Start at beginning of today
    
    for (let i = 0; i < 365; i++) {
      const checkDateStr = getLocalDateString(currentCheckDate.toISOString(), userTimezone)
      console.log('[v0] Checking day', i, ':', checkDateStr, 'exists:', uniqueScanDates.has(checkDateStr))
      
      if (uniqueScanDates.has(checkDateStr)) {
        streak++
        // Move to previous day in UTC, then convert to local date
        currentCheckDate.setDate(currentCheckDate.getDate() - 1)
      } else {
        // Day is missing, break the streak
        break
      }
    }

    // Check if today has scans (for motivational messaging)
    const hasTodayScans = uniqueScanDates.has(todayLocalDate)

    console.log('[v0] === STREAK CALCULATION COMPLETE ===')
    console.log('[v0] Today local date:', todayLocalDate)
    console.log('[v0] Unique scan dates count:', uniqueScanDates.size)
    console.log('[v0] Calculated streak:', streak)
    console.log('[v0] Has today scans:', hasTodayScans)

    return NextResponse.json({
      scores,
      bodyScore,
      dailyScore,
      streak,
      hasTodayScans,
      workoutsCompleted:
    profileData?.workouts_completed || 0,
    })
  } catch (error) {
    console.error('[v0] GET /api/scores error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
