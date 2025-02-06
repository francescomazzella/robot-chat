import { Peer } from "./peer"

type RateLimit = {
  limit: number
  remaining: number
  reset: number
}

const RATE_LIMIT = 5 // 10 requests per minute
const RATE_LIMIT_RESET = 1000 * 60 // 1 minute

const rateLimits = new Map<string, RateLimit>()

export function rateLimiter(peer: Peer): boolean {
  const rateLimit = rateLimits.get(peer.id)
  if (rateLimit) {
    if (rateLimit.reset < Date.now()) {
      rateLimit.remaining = RATE_LIMIT
      rateLimit.reset = Date.now() + RATE_LIMIT_RESET
    }

    if (rateLimit.remaining <= 0) {
      return false
    }
    rateLimit.remaining--
  } else {
    rateLimits.set(peer.id, {
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
      reset: Date.now() + RATE_LIMIT_RESET
    })
  }
  return true
}
