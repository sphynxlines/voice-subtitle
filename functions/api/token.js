// 允许的域名列表
const ALLOWED_DOMAINS = [
  'voice.calm.rocks',  // 改成你的域名
  'localhost',
  '127.0.0.1'
];

// 简单的速率限制
const rateLimitMap = new Map();
const RATE_LIMIT_PER_MINUTE = 30;  // 每分钟 30 次，非常宽松
const RATE_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  // 清理旧记录（防止内存泄漏）
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
  
  // 如果没有 referer/origin（直接访问），允许（方便测试）
  if (!referer && !origin) {
    return true;
  }
  
  // 检查是否来自允许的域名
  return ALLOWED_DOMAINS.some(domain => 
    referer.includes(domain) || origin.includes(domain)
  );
}

export async function onRequestGet(context) {
  const request = context.request;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // 1. Referrer 检查
  if (!checkReferer(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 2. 速率限制检查
  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: '请求过于频繁，请稍后再试' }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // 3. 获取 Azure Token
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