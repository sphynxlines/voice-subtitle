/**
 * Wake Lock Manager - Keeps screen awake during transcription
 */

export class WakeLockManager {
  constructor() {
    this.wakeLock = null;
    this.isSupported = 'wakeLock' in navigator;
  }

  /**
   * Request wake lock
   */
  async request() {
    if (!this.isSupported) {
      console.log('Wake Lock API not supported');
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      console.log('Screen wake lock enabled');
      
      // Re-request on visibility change
      this.wakeLock.addEventListener('release', () => {
        console.log('Screen wake lock released');
      });
      
      return true;
    } catch (err) {
      console.error('Wake lock request failed:', err);
      return false;
    }
  }

  /**
   * Release wake lock
   */
  async release() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('Screen wake lock disabled');
      } catch (err) {
        console.error('Wake lock release failed:', err);
      }
    }
  }

  /**
   * Check if wake lock is active
   */
  isActive() {
    return this.wakeLock !== null;
  }
}

export default WakeLockManager;
