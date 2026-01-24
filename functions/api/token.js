export async function onRequestGet(context) {
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
