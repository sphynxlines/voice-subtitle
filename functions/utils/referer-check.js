/**
 * Referer/Origin Checking Utilities
 */

const ALLOWED_DOMAINS = [
  'voice.calm.rocks',
  'localhost',
  '127.0.0.1'
];

/**
 * Check if request is from allowed domain
 * @param {Request} request - Cloudflare request object
 * @returns {boolean} - True if allowed, false otherwise
 */
export function checkReferer(request) {
  const referer = request.headers.get('Referer') || '';
  const origin = request.headers.get('Origin') || '';
  
  // Allow requests with no referer/origin (direct API calls)
  if (!referer && !origin) {
    return true;
  }
  
  // Check if referer or origin contains allowed domain
  return ALLOWED_DOMAINS.some(domain => 
    referer.includes(domain) || origin.includes(domain)
  );
}

/**
 * Get client IP address
 * @param {Request} request - Cloudflare request object
 * @returns {string} - Client IP address
 */
export function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For')?.split(',')[0] || 
         'unknown';
}
