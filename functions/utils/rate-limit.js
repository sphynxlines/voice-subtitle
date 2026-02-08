/**
 * Rate Limiting Utilities using Cloudflare KV
 */

const RATE_LIMIT_PER_MINUTE = 30;
const RATE_WINDOW = 60; // seconds

/**
 * Check rate limit using KV storage
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} ip - Client IP address
 * @returns {Promise<boolean>} - True if allowed, false if rate limited
 */
export async function checkRateLimit(kv, ip) {
  if (!kv) {
    console.warn('KV namespace not available, skipping rate limit');
    return true;
  }

  const key = `ratelimit:${ip}`;
  const now = Date.now();
  
  try {
    // Get current record
    const recordStr = await kv.get(key);
    const record = recordStr ? JSON.parse(recordStr) : null;
    
    // Check if window has expired
    if (!record || now - record.startTime > RATE_WINDOW * 1000) {
      // Start new window
      await kv.put(key, JSON.stringify({
        count: 1,
        startTime: now
      }), { expirationTtl: RATE_WINDOW });
      return true;
    }
    
    // Check if limit exceeded
    if (record.count >= RATE_LIMIT_PER_MINUTE) {
      return false;
    }
    
    // Increment count
    record.count++;
    await kv.put(key, JSON.stringify(record), { 
      expirationTtl: RATE_WINDOW 
    });
    
    return true;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if rate limit check fails
    return true;
  }
}

/**
 * Get remaining requests for IP
 */
export async function getRemainingRequests(kv, ip) {
  if (!kv) return RATE_LIMIT_PER_MINUTE;

  const key = `ratelimit:${ip}`;
  const now = Date.now();
  
  try {
    const recordStr = await kv.get(key);
    const record = recordStr ? JSON.parse(recordStr) : null;
    
    if (!record || now - record.startTime > RATE_WINDOW * 1000) {
      return RATE_LIMIT_PER_MINUTE;
    }
    
    return Math.max(0, RATE_LIMIT_PER_MINUTE - record.count);
  } catch (error) {
    console.error('Get remaining requests error:', error);
    return RATE_LIMIT_PER_MINUTE;
  }
}
