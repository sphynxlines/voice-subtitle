/**
 * Application Configuration Constants
 */

export const CONFIG = {
  // Font size settings
  FONT_SIZE: {
    MIN: 24,
    MAX: 96,
    DEFAULT: 48,
    STEP: 8
  },

  // Token and session management
  TOKEN_REFRESH_INTERVAL: 9 * 60 * 1000, // 9 minutes in milliseconds
  TOKEN_REFRESH_BUFFER: 60 * 1000, // Refresh 1 minute before expiry

  // History settings
  HISTORY_MAX_ITEMS: 10,

  // Rate limiting
  RATE_LIMIT: {
    PER_MINUTE: 30,
    WINDOW: 60 * 1000 // 1 minute
  },

  // Speaker labels
  SPEAKER_LABELS: ['A', 'B', 'C', 'D', 'E'],

  // Vibration feedback durations (ms)
  VIBRATION: {
    SHORT: 50,
    LONG: 100
  },

  // Azure Speech SDK settings
  SPEECH: {
    LANGUAGE: 'zh-CN'
  },

  // Network status check interval
  NETWORK_CHECK_INTERVAL: 5000,

  // Storage keys
  STORAGE_KEYS: {
    STATS_KEY: 'stats_key',
    FONT_SIZE: 'subtitle_font_size'
  },

  // API endpoints
  API: {
    TOKEN: '/api/token',
    STATS: '/api/stats'
  },

  // Allowed domains for CORS
  ALLOWED_DOMAINS: [
    'voice.calm.rocks',
    'localhost',
    '127.0.0.1'
  ],

  // Feature flags
  FEATURES: {
    // Enable/disable AI summarization
    // Set to false to disable summary generation
    ENABLE_SUMMARY: false  // Set to true when SILICONFLOW_API_KEY is configured
  }
};

export default CONFIG;
