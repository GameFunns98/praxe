const buckets = new Map<string, { count: number; resetAt: number }>();

export function hitRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { blocked: false, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { blocked: true, remaining: 0, retryAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { blocked: false, remaining: limit - bucket.count };
}
