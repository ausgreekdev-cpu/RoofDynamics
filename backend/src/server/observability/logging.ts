/** Structured JSON logger with LOG_LEVEL filtering. */
import { env } from '../../env'

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const
type Level = keyof typeof LEVELS

const threshold = LEVELS[env.LOG_LEVEL] ?? LEVELS.info

export interface LogEntry {
  level: Level
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

function emit(level: Level, message: string, context?: Record<string, unknown>): LogEntry | null {
  if (LEVELS[level] < threshold) return null
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  }
  const line = JSON.stringify(entry)
  if (level === 'error') process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
  return entry
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
}
