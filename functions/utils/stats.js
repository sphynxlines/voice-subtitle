/**
 * Usage Statistics Utilities
 */

/**
 * Record usage statistics
 * @param {KVNamespace} kv - Cloudflare KV namespace for stats
 * @param {string} ip - Client IP address
 */
export async function recordUsage(kv, ip) {
  if (!kv) {
    console.warn('Stats KV namespace not available');
    return;
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    // Record daily count
    await incrementCounter(kv, `daily:${today}`, 90 * 86400);
    
    // Record monthly count
    await incrementCounter(kv, `monthly:${month}`, 365 * 86400);
    
    // Record total count
    await incrementCounter(kv, 'total');
    
    // Record unique IP for today
    const ipKey = `ip:${today}:${ip}`;
    const isNewIp = !(await kv.get(ipKey));
    
    if (isNewIp) {
      await kv.put(ipKey, '1', { expirationTtl: 86400 });
      await incrementCounter(kv, `unique:${today}`, 90 * 86400);
    }
  } catch (error) {
    console.error('Stats recording error:', error);
  }
}

/**
 * Increment a counter in KV
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {string} key - Counter key
 * @param {number} ttl - Time to live in seconds (optional)
 */
async function incrementCounter(kv, key, ttl = null) {
  const currentValue = parseInt(await kv.get(key)) || 0;
  const newValue = currentValue + 1;
  
  const options = ttl ? { expirationTtl: ttl } : {};
  await kv.put(key, newValue.toString(), options);
}

/**
 * Get statistics for last N days
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @param {number} days - Number of days to retrieve
 * @returns {Promise<Array>} - Array of daily stats
 */
export async function getLastNDaysStats(kv, days = 7) {
  const stats = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const requests = parseInt(await kv.get(`daily:${dateStr}`)) || 0;
    const uniqueUsers = parseInt(await kv.get(`unique:${dateStr}`)) || 0;
    
    stats.push({
      date: dateStr,
      requests,
      uniqueUsers
    });
  }
  
  return stats;
}

/**
 * Get current statistics summary
 * @param {KVNamespace} kv - Cloudflare KV namespace
 * @returns {Promise<Object>} - Statistics summary
 */
export async function getStatsSummary(kv) {
  const today = new Date().toISOString().split('T')[0];
  const month = today.substring(0, 7);
  
  const [total, todayCount, todayUnique, monthCount, last7Days] = await Promise.all([
    kv.get('total'),
    kv.get(`daily:${today}`),
    kv.get(`unique:${today}`),
    kv.get(`monthly:${month}`),
    getLastNDaysStats(kv, 7)
  ]);
  
  return {
    total: parseInt(total) || 0,
    today: parseInt(todayCount) || 0,
    todayUnique: parseInt(todayUnique) || 0,
    thisMonth: parseInt(monthCount) || 0,
    last7Days
  };
}
