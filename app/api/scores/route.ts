    
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

    import { NextResponse } from 'next/server'

export async function GET() {
  try {

    const scores = []
    const bodyScore = 0
    const dailyScore = 0
    const streak = 0
    const hasTodayScans = false
    const profileData = null

    return NextResponse.json({
      scores,
      bodyScore,
      dailyScore,
      streak,
      hasTodayScans,
      workoutsCompleted: profileData?.workouts_completed || 0,
    })

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
