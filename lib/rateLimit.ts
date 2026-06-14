// Simple in-memory rate limiter — no external services needed.
// Suitable for single-instance deployments (VPS, single Vercel region with
// a persistent Node process, etc). Resets on server restart.
//
// Usage:
//   const limited = rateLimit(`cart:${userId}`, 20, 60_000) // 20 requests per 60s
//   if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodically clean up old buckets so memory doesn't grow forever
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}, 5 * 60_000) // every 5 minutes

/**
 * Returns true if the request should be BLOCKED (rate limit exceeded).
 *
 * @param key Unique identifier — e.g. `${ip}:${route}` or `${userId}:${route}`
 * @param limit Max number of requests allowed within the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  bucket.count += 1

  if (bucket.count > limit) {
    return true
  }

  return false
}

/**
 * Helper to get a client identifier from a request.
 * Falls back to a generic key if IP can't be determined (e.g. behind some proxies).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return "unknown"
}
