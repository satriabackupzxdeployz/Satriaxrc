const store = new Map<string, { count: number; resetAt: number }>()

export const RATE_LIMIT = 20
export const RATE_WINDOW_MS = 2 * 60 * 60 * 1000

function getEntry(key: string) {
  const now = Date.now()
  let entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_WINDOW_MS }
    store.set(key, entry)
  }
  return entry
}

export function checkRateLimit(ip: string, apiKey: string): {
  allowed: boolean
  used: number
  remaining: number
  resetIn: string
} {
  const key = `${ip}::${apiKey}`
  const entry = getEntry(key)
  const ms = Math.max(0, entry.resetAt - Date.now())
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const resetIn = `${h}h ${m}m`

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, used: entry.count, remaining: 0, resetIn }
  }

  entry.count += 1
  return {
    allowed: true,
    used: entry.count,
    remaining: RATE_LIMIT - entry.count,
    resetIn,
  }
}
