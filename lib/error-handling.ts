/**
 * Error handling utilities for consistent error messaging and logging
 */

export interface AppError {
  code: string
  message: string
  userMessage: string
  details?: any
  timestamp: string
}

/**
 * Error codes for different app scenarios
 */
export const ERROR_CODES = {
  // Auth errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Database errors
  DB_FETCH_FAILED: 'DB_FETCH_FAILED',
  DB_UPDATE_FAILED: 'DB_UPDATE_FAILED',
  DB_DELETE_FAILED: 'DB_DELETE_FAILED',
  DB_CREATE_FAILED: 'DB_CREATE_FAILED',

  // Scan/Meal errors
  INVALID_MEAL_DATA: 'INVALID_MEAL_DATA',
  SCAN_FAILED: 'SCAN_FAILED',
  MEAL_NOT_FOUND: 'MEAL_NOT_FOUND',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
}

/**
 * Create a standardized app error
 */
export function createAppError(
  code: string,
  userMessage: string,
  details?: any
): AppError {
  return {
    code,
    message: `${code}: ${userMessage}`,
    userMessage,
    details,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Get user-friendly error message based on error code
 */
export function getUserErrorMessage(code: string, defaultMessage: string = 'Something went wrong'): string {
  const messages: Record<string, string> = {
    [ERROR_CODES.AUTH_REQUIRED]: 'Please sign in to continue',
    [ERROR_CODES.AUTH_FAILED]: 'Authentication failed. Please try again.',
    [ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ERROR_CODES.UNAUTHORIZED]: 'You do not have permission to perform this action',

    [ERROR_CODES.DB_FETCH_FAILED]: 'Failed to fetch data. Please try again.',
    [ERROR_CODES.DB_UPDATE_FAILED]: 'Failed to save changes. Please try again.',
    [ERROR_CODES.DB_DELETE_FAILED]: 'Failed to delete item. Please try again.',
    [ERROR_CODES.DB_CREATE_FAILED]: 'Failed to create item. Please try again.',

    [ERROR_CODES.INVALID_MEAL_DATA]: 'Invalid meal data. Please check your input.',
    [ERROR_CODES.SCAN_FAILED]: 'Failed to process scan. Please try again.',
    [ERROR_CODES.MEAL_NOT_FOUND]: 'Meal not found. It may have been deleted.',

    [ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection.',
    [ERROR_CODES.TIMEOUT]: 'Request timed out. Please try again.',

    [ERROR_CODES.VALIDATION_ERROR]: 'Invalid input. Please check your data.',
    [ERROR_CODES.INVALID_INPUT]: 'Please provide valid input.',

    [ERROR_CODES.SERVER_ERROR]: 'Server error. Please try again later.',
    [ERROR_CODES.NOT_FOUND]: 'Resource not found.',
  }

  return messages[code] || defaultMessage
}

/**
 * Handle and log errors consistently
 */
export function handleError(
  error: any,
  context: string,
  defaultCode: string = ERROR_CODES.SERVER_ERROR
): AppError {
  const timestamp = new Date().toISOString()

  // Supabase errors
  if (error?.status || error?.statusText) {
    const code = error.status === 401 ? ERROR_CODES.UNAUTHORIZED : defaultCode
    console.error(`[v0] ${context} - Supabase Error [${error.status}]:`, error.message)
    return createAppError(code, getUserErrorMessage(code), error)
  }

  // Network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    console.error(`[v0] ${context} - Network Error:`, error.message)
    return createAppError(ERROR_CODES.NETWORK_ERROR, getUserErrorMessage(ERROR_CODES.NETWORK_ERROR), error)
  }

  // Timeout errors
  if (error?.message?.includes('timeout')) {
    console.error(`[v0] ${context} - Timeout Error:`, error.message)
    return createAppError(ERROR_CODES.TIMEOUT, getUserErrorMessage(ERROR_CODES.TIMEOUT), error)
  }

  // Generic error
  console.error(`[v0] ${context} - Error:`, error?.message || error)
  return createAppError(
    defaultCode,
    getUserErrorMessage(defaultCode, error?.message || 'Something went wrong'),
    error
  )
}

/**
 * Validate meal data
 */
export function validateMealData(meal: any): { valid: boolean; error?: AppError } {
  if (!meal.meal_name || typeof meal.meal_name !== 'string') {
    return {
      valid: false,
      error: createAppError(ERROR_CODES.INVALID_MEAL_DATA, 'Meal name is required', meal),
    }
  }

  if (!Number.isFinite(meal.calories) || meal.calories < 0) {
    return {
      valid: false,
      error: createAppError(ERROR_CODES.INVALID_MEAL_DATA, 'Invalid calorie value', meal),
    }
  }

  if (!Number.isFinite(meal.protein) || meal.protein < 0) {
    return {
      valid: false,
      error: createAppError(ERROR_CODES.INVALID_MEAL_DATA, 'Invalid protein value', meal),
    }
  }

  if (!Number.isFinite(meal.carbs) || meal.carbs < 0) {
    return {
      valid: false,
      error: createAppError(ERROR_CODES.INVALID_MEAL_DATA, 'Invalid carbs value', meal),
    }
  }

  if (!Number.isFinite(meal.fat) || meal.fat < 0) {
    return {
      valid: false,
      error: createAppError(ERROR_CODES.INVALID_MEAL_DATA, 'Invalid fat value', meal),
    }
  }

  return { valid: true }
}

/**
 * Retry logic for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
        console.log(`[v0] Retrying operation (attempt ${i + 2}/${maxRetries})`)
      }
    }
  }

  throw lastError
}
