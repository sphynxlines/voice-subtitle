export async function onRequestGet(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  // 简单的密码保护
  const password = url.searchParams.get('key');
  if (password !== context.env.STATS_KEY) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  if (!context.env.STATS) {
    return new Response(
      JSON.stringify({ error: 'Stats not configured' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.substring(0, 7);
    
    // 获取最近 7 天的数据
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = parseInt(await context.env.STATS.get(`daily:${dateStr}`)) || 0;
      const unique = parseInt(await context.env.STATS.get(`unique:${dateStr}`)) || 0;
      
      last7Days.push({
        date: dateStr,
        requests: count,
        uniqueUsers: unique
      });
    }
    
    // 获取统计
    const stats = {
      total: parseInt(await context.env.STATS.get('total')) || 0,
      today: parseInt(await context.env.STATS.get(`daily:${today}`)) || 0,
      todayUnique: parseInt(await context.env.STATS.get(`unique:${today}`)) || 0,
      thisMonth: parseInt(await context.env.STATS.get(`monthly:${month}`)) || 0,
      last7Days: last7Days
    };
    
    return new Response(
      JSON.stringify(stats, null, 2),
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