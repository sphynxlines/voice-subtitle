/**
 * API Layer - Handles all HTTP requests
 */

import { CONFIG } from './config.js';
import { TokenError, NetworkError } from './errors.js';
import { isOnline } from './utils.js';

/**
 * API Client for Azure Speech Token
 */
export class SpeechAPI {
  constructor() {
    this.baseUrl = '';
  }

  /**
   * Get Azure Speech token
   */
  async getToken() {
    if (!isOnline()) {
      throw new NetworkError();
    }

    try {
      const response = await fetch(CONFIG.API.TOKEN);
      
      if (!response.ok) {
        throw new TokenError();
      }
      
      const data = await response.json();
      
      if (!data.token || !data.region) {
        throw new TokenError();
      }
      
      return data;
    } catch (error) {
      if (error instanceof NetworkError || error instanceof TokenError) {
        throw error;
      }
      console.error('Token fetch error:', error);
      throw new TokenError();
    }
  }
}

/**
 * API Client for Stats
 */
export class StatsAPI {
  constructor() {
    this.baseUrl = '';
  }

  /**
   * Get usage statistics
   */
  async getStats(key) {
    if (!key) {
      throw new Error('Stats key is required');
    }

    try {
      const url = `${CONFIG.API.STATS}?key=${encodeURIComponent(key)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('密钥错误');
        }
        throw new Error('加载失败');
      }
      
      return await response.json();
    } catch (error) {
      if (error.message === '密钥错误' || error.message === '加载失败') {
        throw error;
      }
      throw new Error('网络错误: ' + error.message);
    }
  }
}

/**
 * Singleton instances
 */
export const speechAPI = new SpeechAPI();
export const statsAPI = new StatsAPI();
