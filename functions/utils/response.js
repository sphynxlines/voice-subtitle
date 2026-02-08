/**
 * Shared Response Utilities for Cloudflare Functions
 */

/**
 * Create JSON response
 */
export function jsonResponse(data, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...additionalHeaders
    }
  });
}

/**
 * Create error response
 */
export function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

/**
 * Create success response
 */
export function successResponse(data) {
  return jsonResponse(data, 200);
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse(message, 403);
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(message = '请求过于频繁，请稍后再试') {
  return errorResponse(message, 429);
}

/**
 * Create not found response
 */
export function notFoundResponse(message = 'Not Found') {
  return errorResponse(message, 404);
}
