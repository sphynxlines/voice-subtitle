/**
 * Usage Statistics API
 * Provides usage statistics with password protection
 */

import { jsonResponse, errorResponse, unauthorizedResponse } from '../utils/response.js';
import { getStatsSummary } from '../utils/stats.js';

/**
 * Handle GET request for statistics
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Validate password
  const password = url.searchParams.get('key');
  if (!password || password !== env.STATS_KEY) {
    return unauthorizedResponse('Invalid or missing key');
  }
  
  // Check if stats KV is configured
  if (!env.STATS) {
    console.error('Stats KV namespace not configured');
    return errorResponse('Stats service not configured', 500);
  }
  
  try {
    // Get statistics summary
    const stats = await getStatsSummary(env.STATS);
    
    return jsonResponse(stats);
    
  } catch (error) {
    console.error('Stats retrieval error:', error);
    return errorResponse('Failed to retrieve statistics', 500);
  }
}