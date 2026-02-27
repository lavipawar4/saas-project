import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Graceful fallback when env vars are missing (dev without Redis)
const isConfigured =
    !!process.env.UPSTASH_REDIS_REST_URL &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = isConfigured
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    : null;

/**
 * Rate limit for single AI generation: 20 requests per user per minute.
 * Sliding window — avoids bursty behaviour.
 */
export const generateRatelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
        prefix: "rl:generate",
    })
    : null;

/**
 * Rate limit for batch generation: 3 batch runs per user per 10 minutes.
 * Batch is expensive — Claude calls per review in the batch.
 */
export const batchRatelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "10 m"),
        analytics: true,
        prefix: "rl:batch",
    })
    : null;

/**
 * Check a rate limit. Returns { allowed, remaining, reset }.
 * If Redis is not configured, always allows (graceful degradation).
 */
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    if (!limiter) return { allowed: true, remaining: 999, reset: 0 };

    const { success, remaining, reset } = await limiter.limit(identifier);
    return { allowed: success, remaining, reset };
}
