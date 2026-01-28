// 允许的域名列表
const ALLOWED_DOMAINS = [
  'voice.calm.rocks',  // 改成你的域名
  'localhost',
  '127.0.0.1'
];

const rateLimitMap = new Map();
const RATE_LIMIT_PER_MINUTE = 30;
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (rateLimitMap.size > 10000) {
    rateLimitMap.clear();
  }
  
  if (!record || now - record.startTime > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  
  record.count++;
  return true;
}

function checkReferer(request) {
  const referer = request.headers.get('Referer') || '';
  const origin = request.headers.get('Origin') || '';
  
  if (!referer && !origin) {
    return true;
  }
  
  return ALLOWED_DOMAINS.some(domain => 
    referer.includes(domain) || origin.includes(domain)
  );
}

// 记录使用统计
async function recordUsage(env, ip) {
  if (!env.STATS) return;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    // 今日统计
    const dailyKey = `daily:${today}`;
    const dailyCount = parseInt(await env.STATS.get(dailyKey)) || 0;
    await env.STATS.put(dailyKey, (dailyCount + 1).toString(), {
      expirationTtl: 90 * 86400  // 保留 90 天
    });
    
    // 本月统计
    const monthlyKey = `monthly:${month}`;
    const monthlyCount = parseInt(await env.STATS.get(monthlyKey)) || 0;
    await env.STATS.put(monthlyKey, (monthlyCount + 1).toString(), {
      expirationTtl: 365 * 86400  // 保留 1 年
    });
    
    // 总计
    const totalCount = parseInt(await env.STATS.get('total')) || 0;
    await env.STATS.put('total', (totalCount + 1).toString());
    
    // 独立 IP 统计（今日）
    const ipKey = `ip:${today}:${ip}`;
    const isNewIp = !(await env.STATS.get(ipKey));
    if (isNewIp) {
      await env.STATS.put(ipKey, '1', { expirationTtl: 86400 });
      
      const uniqueKey = `unique:${today}`;
      const uniqueCount = parseInt(await env.STATS.get(uniqueKey)) || 0;
      await env.STATS.put(uniqueKey, (uniqueCount + 1).toString(), {
        expirationTtl: 90 * 86400
      });
    }
  } catch (e) {
    console.error('Stats error:', e);
  }
}

export async function onRequestGet(context) {
  const request = context.request;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (!checkReferer(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: '请求过于频繁，请稍后再试' }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 记录使用统计
  await recordUsage(context.env, ip);

  const AZURE_KEY = context.env.AZURE_KEY;
  const AZURE_REGION = context.env.AZURE_REGION;

  if (!AZURE_KEY || !AZURE_REGION) {
    return new Response(
      JSON.stringify({ error: 'Azure credentials not configured' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const tokenResponse = await fetch(
      `https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to get token');
    }

    const token = await tokenResponse.text();

    return new Response(
      JSON.stringify({ token, region: AZURE_REGION }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}