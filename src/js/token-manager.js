/**
 * Token Manager - Handles token lifecycle and refresh
 */

import { CONFIG } from './config.js';
import { speechAPI } from './api.js';

export class TokenManager {
  constructor() {
    this.token = null;
    this.region = null;
    this.tokenExpiry = null;
    this.refreshTimer = null;
  }

  /**
   * Get current token, refresh if needed
   */
  async getToken() {
    if (!this.token || this.isExpiringSoon()) {
      await this.refreshToken();
    }
    return { token: this.token, region: this.region };
  }

  /**
   * Check if token is expiring soon
   */
  isExpiringSoon() {
    if (!this.tokenExpiry) return true;
    const timeUntilExpiry = this.tokenExpiry - Date.now();
    return timeUntilExpiry < CONFIG.TOKEN_REFRESH_BUFFER;
  }

  /**
   * Refresh token from API
   */
  async refreshToken() {
    console.log('Refreshing token...');
    
    try {
      const data = await speechAPI.getToken();
      this.token = data.token;
      this.region = data.region;
      this.tokenExpiry = Date.now() + CONFIG.TOKEN_REFRESH_INTERVAL;
      
      this.scheduleRefresh();
      
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Schedule next token refresh
   */
  scheduleRefresh() {
    this.clearRefreshTimer();
    
    const refreshIn = CONFIG.TOKEN_REFRESH_INTERVAL - CONFIG.TOKEN_REFRESH_BUFFER;
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
        // Retry after a shorter interval
        setTimeout(() => this.refreshToken(), 30000);
      }
    }, refreshIn);
  }

  /**
   * Clear refresh timer
   */
  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Reset token manager
   */
  reset() {
    this.token = null;
    this.region = null;
    this.tokenExpiry = null;
    this.clearRefreshTimer();
  }
}

export default TokenManager;
