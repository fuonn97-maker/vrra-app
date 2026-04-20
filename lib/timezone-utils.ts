/**
 * Comprehensive timezone management system
 * Supports storing/retrieving user timezone and converting dates
 * Can work with browser timezone or stored user timezone preference
 */

// In-memory cache for user timezone preferences
// In production, this would come from user profile in Supabase
const userTimezoneCache = new Map<string, string>()

/**
 * Get all supported timezones (IANA timezone identifiers)
 */
export function getSupportedTimezones(): string[] {
  return [
    // UTC
    'UTC',
    
    // Americas
    'America/Los_Angeles',
    'America/Denver',
    'America/Chicago',
    'America/New_York',
    'America/Toronto',
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    
    // Europe
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Europe/Istanbul',
    
    // Asia
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Sydney',
    'Pacific/Auckland',
  ]
}

/**
 * Get timezone abbreviation (e.g., PST, EST, GMT, IST)
 */
export function getTimezoneAbbr(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short',
  })
  const parts = formatter.formatToParts(new Date())
  const timeZonePart = parts.find(part => part.type === 'timeZoneName')
  return timeZonePart?.value || 'UTC'
}

/**
 * Get the UTC offset for a timezone at a given date
 * Returns string like "-07:00" or "+05:30"
 */
export function getTimezoneOffset(timezone: string, date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024')
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '01') - 1
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '01')
  const hours = parseInt(parts.find(p => p.type === 'hour')?.value || '00')
  const minutes = parseInt(parts.find(p => p.type === 'minute')?.value || '00')

  const localDate = new Date(year, month, day, hours, minutes, 0)
  const diff = (date.getTime() - localDate.getTime()) / (1000 * 60) // difference in minutes
  const offsetHours = Math.floor(diff / 60)
  const offsetMinutes = Math.abs(diff % 60)

  const sign = offsetHours >= 0 ? '+' : '-'
  return `${sign}${String(Math.abs(offsetHours)).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
}

/**
 * Set user timezone preference (stores in memory, typically synced with Supabase profile)
 */
export function setUserTimezone(userId: string, timezone: string): void {
  if (!getSupportedTimezones().includes(timezone)) {
    console.warn(`[v0] Invalid timezone: ${timezone}. Using UTC as fallback.`)
    userTimezoneCache.set(userId, 'UTC')
    return
  }
  userTimezoneCache.set(userId, timezone)
  console.log(`[v0] User timezone set: ${userId} -> ${timezone}`)
}

/**
 * Get user timezone preference (returns UTC if not set)
 */
export function getUserTimezone(userId: string): string {
  return userTimezoneCache.get(userId) || 'UTC'
}

/**
 * Get browser's local timezone (IANA identifier)
 * Approximation based on browser timezone offset
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Get today's date in a specific timezone (YYYY-MM-DD format)
 */
export function getTodayDateInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(new Date())
}

/**
 * Get today's date in user's timezone
 */
export function getUserTodayDate(userId: string): string {
  const timezone = getUserTimezone(userId)
  return getTodayDateInTimezone(timezone)
}

/**
 * CRITICAL: Convert UTC timestamp to local date string (YYYY-MM-DD)
 * This is the ONLY reliable method for UTC-to-local conversion
 * Must be used for ALL date comparisons and grouping
 * 
 * @param timestamp UTC timestamp string (ISO format, with or without Z) or Date object
 * @param timeZone IANA timezone identifier (e.g., "Asia/Kuala_Lumpur")
 * @returns Local date in YYYY-MM-DD format
 */
export function getLocalDateString(timestamp: string | Date, timeZone: string): string {
  // Step 1: Ensure timestamp is treated as UTC
  let utcTimestamp = timestamp
  if (typeof timestamp === 'string') {
    // If it doesn't have Z suffix, add it to ensure UTC interpretation
    if (!timestamp.endsWith('Z') && !timestamp.includes('+')) {
      utcTimestamp = timestamp + 'Z'
    }
  }
  
  // Step 2: Create Date object from UTC timestamp
  const date = new Date(utcTimestamp)
  const utcISO = date.toISOString()
  
  // Step 3: Format using Intl.DateTimeFormat with timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  // Step 4: Use formatToParts to reliably extract year, month, day
  const parts = formatter.formatToParts(date)
  
  const year = parts.find(p => p.type === 'year')?.value || '2024'
  const month = parts.find(p => p.type === 'month')?.value || '01'
  const day = parts.find(p => p.type === 'day')?.value || '01'
  
  const localDate = `${year}-${month}-${day}`
  
  // DEBUG: Log conversion showing all steps
  console.log('[v0] getLocalDateString:', {
    raw_created_at: timestamp,
    normalized_utc: utcTimestamp,
    utc_iso: utcISO,
    timezone: timeZone,
    format_parts: { year, month, day },
    converted_local_date: localDate,
  })
  
  return localDate
}

/**
 * Format timestamp to local time string (e.g., "2:38 PM")
 * 
 * @param timestamp UTC timestamp string or Date object
 * @param timeZone IANA timezone identifier
 * @returns Formatted time string
 */
export function formatLocalTime(timestamp: string | Date, timeZone: string): string {
  // Ensure timestamp is treated as UTC
  let utcTimestamp = timestamp
  if (typeof timestamp === 'string') {
    if (!timestamp.endsWith('Z') && !timestamp.includes('+')) {
      utcTimestamp = timestamp + 'Z'
    }
  }
  
  const date = new Date(utcTimestamp)
  
  const formatted = new Intl.DateTimeFormat('en-MY', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
  
  console.log('[v0] formatLocalTime:', {
    input: timestamp,
    timezone: timeZone,
    output: formatted,
  })
  
  return formatted
}

/**
 * Convert UTC timestamp to date string in a specific timezone (YYYY-MM-DD)
 */
export function utcToLocalDateInTimezone(utcTimestamp: string, timezone: string): string {
  const date = new Date(utcTimestamp)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

/**
 * Convert UTC timestamp to date string in user's timezone
 */
export function utcToUserLocalDate(utcTimestamp: string, userId: string): string {
  const timezone = getUserTimezone(userId)
  return utcToLocalDateInTimezone(utcTimestamp, timezone)
}

/**
 * Get all scans for a specific date in user's timezone
 */
export function getScansForDateInUserTimezone(scans: any[], targetDate: string, userId: string): any[] {
  const timezone = getUserTimezone(userId)
  return scans.filter((scan) => {
    const scanLocalDate = utcToLocalDateInTimezone(scan.created_at, timezone)
    return scanLocalDate === targetDate
  })
}

/**
 * Convert local date string and time to UTC timestamp (for creating records)
 * Assumes the input date/time is in the specified timezone
 */
export function localToUTC(localDateStr: string, hours: number, minutes: number, timezone: string): Date {
  // Parse the local date string (YYYY-MM-DD)
  const [year, month, day] = localDateStr.split('-').map(Number)

  // Create a date in UTC first
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))

  // We need to adjust for the timezone offset
  // Get the offset of the timezone at this moment
  const testDate = new Date(year, month - 1, day, hours, minutes, 0)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(utcDate)
  const formattedHours = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const formattedMinutes = parseInt(parts.find(p => p.type === 'minute')?.value || '0')

  const hourDiff = hours - formattedHours
  const minuteDiff = minutes - formattedMinutes

  utcDate.setHours(utcDate.getHours() + hourDiff)
  utcDate.setMinutes(utcDate.getMinutes() + minuteDiff)

  return utcDate
}

/**
 * Format a date with time in a specific timezone
 */
export function formatDateTimeInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return formatter.format(date)
}

/**
 * Format a date with time in user's timezone
 */
export function formatDateTimeForUser(date: Date, userId: string): string {
  const timezone = getUserTimezone(userId)
  return formatDateTimeInTimezone(date, timezone)
}

/**
 * Get the last N days as date strings in a specific timezone
 */
export function getLastNDaysInTimezone(days: number, timezone: string): string[] {
  const result: string[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    result.push(formatter.format(date))
  }

  return result
}

/**
 * Get the last N days as date strings in user's timezone
 */
export function getLastNDaysForUser(days: number, userId: string): string[] {
  const timezone = getUserTimezone(userId)
  return getLastNDaysInTimezone(days, timezone)
}

// VALIDATION TEST: Verify the critical timezone conversion works correctly
console.log("TIMEZONE TEST", {
  timestamp: "2026-04-18T17:38:11Z",
  timezone: "Asia/Kuala_Lumpur",
  result: getLocalDateString("2026-04-18T17:38:11Z", "Asia/Kuala_Lumpur")
})
