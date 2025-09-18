// lib/logger.ts

// Define a proper error type
interface LogError {
  message: string
  stack?: string
  code?: string | number
  [key: string]: unknown
}

export function logError(error: LogError | Error | unknown, context: string): void {
  console.error(`[${context}] Error:`, error)
  // Add your preferred logging service here (e.g., Winston, Pino, etc.)
}

export function logInfo(message: string, context: string): void {
  console.log(`[${context}] ${message}`)
  // Add your preferred logging service here
}