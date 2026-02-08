/**
 * Network Monitor - Tracks online/offline status
 */

import { isOnline } from './utils.js';

export class NetworkMonitor {
  constructor() {
    this.isOnline = isOnline();
    this.listeners = new Set();
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    console.log('Network: Online');
    this.notifyListeners('online');
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    console.log('Network: Offline');
    this.notifyListeners('offline');
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return this.isOnline;
  }
}

export default NetworkMonitor;
