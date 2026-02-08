/**
 * Azure Speech Token API
 * Provides temporary tokens for Azure Speech SDK
 */

import { 
  jsonResponse, 
  errorResponse, 
  forbiddenResponse, 
  rateLimitResponse 
} from '../utils/response.js';
import { checkRateLimit } from '../utils/rate-limit.js';
import { checkReferer, getClientIP } from '../utils/referer-check.js';
import { recordUsage } from '../utils/stats.js';

/**
 * Handle GET request for Azure Speech token
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const ip = getClientIP(request);

  // Check referer
  if (!checkReferer(request)) {
    return forbiddenResponse('Unauthorized');
  }

  // Check rate limit using KV
  const isAllowed = await checkRateLimit(env.RATE_LIMIT, ip);
  if (!isAllowed) {
    return rateLimitResponse();
  }

  // Record usage statistics
  await recordUsage(env.STATS, ip);

  // Validate Azure credentials
  const { AZURE_KEY, AZURE_REGION } = env;
  if (!AZURE_KEY || !AZURE_REGION) {
    console.error('Azure credentials not configured');
    return errorResponse('Service configuration error', 500);
  }

  try {
    // Request token from Azure
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
      console.error('Azure token request failed:', tokenResponse.status);
      throw new Error('Failed to get token from Azure');
    }

    const token = await tokenResponse.text();

    return jsonResponse({ 
      token, 
      region: AZURE_REGION 
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return errorResponse('Failed to generate token', 500);
  }
}