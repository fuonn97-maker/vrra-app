import { getUserTimezone, utcToLocalDateInTimezone, getLastNDaysInTimezone, getLocalDateString } from './timezone-utils'

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * This is the single source of truth for all "today" calculations
 * Now supports timezone-aware calculations
 */
export function getTodayDateString(userId?: string): string {
  let timezone = 'UTC'

  // If userId provided, use user's stored timezone
  if (userId) {
    timezone = getUserTimezone(userId)
  } else {
    // Fallback to browser timezone
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      timezone = 'UTC'
    }
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const today = formatter.format(new Date())
  console.log('[v0] getTodayDateString() returning:', today, 'for timezone:', timezone)
  return today
}

/**
 * Get a date string in YYYY-MM-DD format from a Date object (local timezone)
 */
export function getDateString(date: Date, userId?: string): string {
  let timezone = 'UTC'

  if (userId) {
    timezone = getUserTimezone(userId)
  } else {
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      timezone = 'UTC'
    }
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  return formatter.format(date)
}

/**
 * Convert UTC timestamp string to local date string (YYYY-MM-DD)
 * Takes Supabase created_at (UTC ISO string) and converts to user's local date
 * Now timezone-aware
 */
export function utcTimestampToLocalDateString(utcTimestamp: string, userId?: string): string {
  let timezone = 'UTC'

  if (userId) {
    timezone = getUserTimezone(userId)
  } else {
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      timezone = 'UTC'
    }
  }

  const localDateString = utcToLocalDateInTimezone(utcTimestamp, timezone)
  console.log('[v0] utcTimestampToLocalDateString: UTC input:', utcTimestamp, '-> local date:', localDateString, '(timezone:', timezone, ')')
  return localDateString
}

/**
 * Get all scans for a specific local date by converting UTC created_at to local date
 * This is the correct way to filter scans for "today" in user's local timezone
 * Now timezone-aware
 */
export function getScansForLocalDate(scans: any[], targetDate: string, userId?: string): any[] {
  let timezone = 'UTC'

  if (userId) {
    timezone = getUserTimezone(userId)
  } else {
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      timezone = 'UTC'
    }
  }

  console.log('[v0] getScansForLocalDate: filtering scans for target date:', targetDate, 'in timezone:', timezone)
  
  const filtered = scans.filter((scan) => {
    // CRITICAL: Use getLocalDateString for reliable UTC->local conversion
    const rawUTC = scan.created_at
    const scanLocalDate = getLocalDateString(rawUTC, timezone)
    const isMatch = scanLocalDate === targetDate
    
    // Detailed per-row debug log in EXACT format requested
    console.log('[v0] SCAN DEBUG:', {
      raw_created_at: rawUTC,
      timezone,
      converted_local_date: scanLocalDate,
      target_date: targetDate,
      match: isMatch,
    })
    
    if (isMatch) {
      console.log('[v0] ✓ MATCH: scan UTC:', rawUTC, '-> local:', scanLocalDate)
    }
    
    return isMatch
  })
  
  console.log('[v0] getScansForLocalDate: found', filtered.length, 'scans for', targetDate)
  return filtered
}

/**
 * Count valid scans (not deleted) for a specific local date
 * is_deleted IS NOT TRUE means include both FALSE and NULL
 */
export function countValidScansForDate(scans: any[], targetDate: string, userId?: string): number {
  console.log('[v0] countValidScansForDate: counting scans for', targetDate)
  const scansForDate = getScansForLocalDate(scans, targetDate, userId)
  const validScans = scansForDate.filter((scan) => {
    const isValid = scan.is_deleted !== true
    if (!isValid) {
      console.log('[v0]   SKIP (deleted): scan created_at:', scan.created_at, 'is_deleted:', scan.is_deleted)
    } else {
      console.log('[v0]   COUNT: scan created_at:', scan.created_at, 'is_deleted:', scan.is_deleted)
    }
    return isValid
  })
  console.log('[v0] countValidScansForDate: final count for', targetDate, '=', validScans.length)
  return validScans.length
}

/**
 * Get the last 7 days as date strings (YYYY-MM-DD format)
 * Now timezone-aware
 */
export function getLast7Days(userId?: string): string[] {
  let timezone = 'UTC'

  if (userId) {
    timezone = getUserTimezone(userId)
  } else {
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      timezone = 'UTC'
    }
  }

  return getLastNDaysInTimezone(7, timezone)
}
