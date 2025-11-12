/**
 * User-friendly error messages mapping
 * Maps error codes and error types to user-friendly messages
 */

export interface ApiError {
  error: string;
  error_code?: string;
  details?: any;
}

// Error code to user-friendly message mapping
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  AUTH_001: 'Please log in to continue.',
  AUTH_002: 'Your session is invalid. Please log in again.',
  AUTH_003: 'Your session has expired. Please log in again.',
  AUTH_004: 'Invalid email or password. Please try again.',
  AUTH_005: 'An account with this email already exists.',
  
  // Validation errors
  VAL_001: 'Please check your input and try again.',
  VAL_002: 'Invalid data format. Please check your input.',
  VAL_003: 'Invalid value provided. Please check your input.',
  
  // Resource errors
  RES_001: 'The requested item was not found.',
  RES_002: 'This item already exists.',
  
  // Database errors
  DB_001: 'Connection error. Please check your internet connection and try again.',
  DB_002: 'A database error occurred. Please try again later.',
  DB_003: 'The system is being set up. Please try again in a moment.',
  
  // Server errors
  SRV_001: 'Something went wrong. Please try again later.',
  SRV_002: 'Request timed out. Please try again.',
  SRV_003: 'Service is temporarily unavailable. Please try again later.',
};

// Network error messages
export const NETWORK_ERRORS = {
  TIMEOUT: 'Request timed out. Please check your internet connection and try again.',
  OFFLINE: 'You appear to be offline. Please check your internet connection.',
  FAILED: 'Network request failed. Please check your internet connection and try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message from API error
 */
export function getUserFriendlyError(error: ApiError | Error | string): string {
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return NETWORK_ERRORS.FAILED;
    }
    if (error.message.includes('timeout')) {
      return NETWORK_ERRORS.TIMEOUT;
    }
    return error.message || NETWORK_ERRORS.UNKNOWN;
  }
  
  // Handle API error objects
  if (error.error_code && ERROR_MESSAGES[error.error_code]) {
    return ERROR_MESSAGES[error.error_code];
  }
  
  // Use error message if available
  if (error.error) {
    return error.error;
  }
  
  return NETWORK_ERRORS.UNKNOWN;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  if (error instanceof Error) {
    return error.message.includes('Failed to fetch') || 
           error.message.includes('NetworkError') ||
           error.message.includes('timeout');
  }
  return false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any, statusCode?: number): boolean {
  // Network errors are retryable
  if (isNetworkError(error)) {
    return true;
  }
  
  // 5xx errors are retryable (server errors)
  if (statusCode && statusCode >= 500 && statusCode < 600) {
    return true;
  }
  
  // 503 Service Unavailable is retryable
  if (statusCode === 503) {
    return true;
  }
  
  // 429 Too Many Requests is retryable
  if (statusCode === 429) {
    return true;
  }
  
  return false;
}

/**
 * Get retry delay based on attempt number
 */
export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff: 1s, 2s, 4s
  return baseDelay * Math.pow(2, attempt);
}

