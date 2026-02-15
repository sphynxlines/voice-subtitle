/**
 * Main Application Controller
 */

import { CONFIG } from './config.js';
import { NetworkError, parseError, SessionTimeoutError } from './errors.js';
import { vibrate } from './utils.js';
import SpeechRecognitionService from './speech-recognition.js';
import UIController from './ui-controller.js';
import WakeLockManager from './wake-lock.js';
import NetworkMonitor from './network-monitor.js';

export class App {
  constructor() {
    this.speechService = new SpeechRecognitionService();
    this.ui = new UIController();
    this.wakeLock = new WakeLockManager();
    this.networkMonitor = new NetworkMonitor();
    
    this.setupEventHandlers();
    this.setupNetworkMonitoring();
    this.setupVisibilityHandling();
    
    // Preload token in background for faster startup
    this.preloadToken();
  }
  
  /**
   * Preload token in background to speed up first start
   * Failures are non-critical - token will be fetched on demand
   */
  async preloadToken() {
    try {
      await this.speechService.tokenManager.getToken();
      console.log('Token preloaded successfully');
    } catch (error) {
      // Non-critical failure - log but don't alert user
      console.warn('Token preload failed (will retry on start):', error);
    }
  }
  
  /**
   * Pre-initialize speech service for instant start
   * This is an optimization - failures are handled gracefully
   */
  async prewarmSpeechService() {
    // Don't prewarm if busy or already listening
    if (this.speechService.isBusy || this.speechService.isListening) {
      return;
    }
    
    try {
      if (this.speechService.needsReinitialization()) {
        await this.speechService.ensureFreshTranscriber();
        console.log('Speech service pre-initialized');
      }
    } catch (error) {
      console.warn('Speech service prewarm failed (will initialize on start):', error);
    }
  }

  /**
   * Setup speech service event handlers
   */
  setupEventHandlers() {
    // Real-time transcription
    this.speechService.onTranscribing = (speaker, text, isRecognizing) => {
      // Only update if actually listening (check service state)
      if (this.speechService.isListening) {
        this.ui.updateSubtitle(speaker, text, isRecognizing);
      }
    };

    // Final transcription
    this.speechService.onTranscribed = (speaker, text, isRecognizing) => {
      // Only update if actually listening (check service state)
      if (this.speechService.isListening) {
        this.ui.updateSubtitle(speaker, text, isRecognizing);
      }
    };

    // Error handling
    this.speechService.onError = (error) => {
      const parsedError = parseError(error);
      
      // Special handling for session timeout - auto restart
      if (parsedError.type === 'session-timeout') {
        console.log('Session timeout detected, auto-restarting...');
        this.handleSessionTimeout();
      } else {
        this.ui.showError(parsedError);
        this.stop();
      }
    };

    // Session events
    this.speechService.onSessionStarted = () => {
      console.log('Session started');
    };

    this.speechService.onSessionStopped = () => {
      console.log('Session stopped');
    };
    
    // Session expiring warning
    this.speechService.onSessionExpiring = () => {
      console.log('Session expiring soon, will auto-restart');
    };
  }
  
  /**
   * Handle session timeout with automatic restart
   */
  async handleSessionTimeout() {
    try {
      // Show brief message
      this.ui.updateStatus('🔄 重新连接中...');
      
      // Stop current session
      await this.speechService.stop();
      
      // Brief pause to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Restart automatically
      await this.speechService.start();
      
      this.ui.updateStatus('🎤 正在听...');
      console.log('Session restarted successfully after timeout');
      
    } catch (error) {
      console.error('Failed to restart after session timeout:', error);
      const parsedError = parseError(error);
      this.ui.showError(parsedError);
      this.isListening = false;
      this.ui.updateButton(false);
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    this.networkMonitor.subscribe((status, isOnline) => {
      this.ui.updateNetworkStatus(isOnline);
      
      // If network lost while listening, stop
      if (!isOnline && this.speechService.isListening) {
        this.ui.showError(new NetworkError());
        this.stop();
      }
    });
    
    // Initial status
    this.ui.updateNetworkStatus(this.networkMonitor.getStatus());
  }

  /**
   * Setup visibility change handling
   */
  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible' && this.speechService.isListening) {
        await this.wakeLock.request();
      }
    });
    
    this.setupHelpModal();
  }
  
  /**
   * Setup help modal event handlers
   */
  setupHelpModal() {
    const modal = document.getElementById('helpModal');
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        this.toggleHelp();
      }
    });
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.toggleHelp();
      }
    });
  }

  /**
   * Toggle listening state - SIMPLIFIED
   */
  async toggleListening() {
    vibrate();
    
    console.log(`[TOGGLE] Current state: ${this.speechService.state}`);
    
    // If busy, ignore click
    if (this.speechService.isBusy) {
      console.log('[TOGGLE] Busy, ignoring click');
      return;
    }
    
    // Toggle based on actual service state
    if (this.speechService.isListening) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Start listening - SIMPLIFIED
   */
  async start() {
    console.log('[APP START] Begin');
    
    // Check network
    if (!this.networkMonitor.getStatus()) {
      this.ui.showError(new NetworkError());
      return;
    }

    // Show loading
    const needsInit = this.speechService.needsReinitialization();
    this.ui.showLoading(needsInit ? '正在初始化...' : '正在启动...');
    
    // Reset speaker mapping and polished text
    this.speechService.resetSpeakers();
    this.ui.resetPolishedText();

    try {
      await this.speechService.start();
      
      // Update UI based on actual service state
      this.ui.updateButton(true);
      this.ui.updateStatus('🎤 正在听...');
      this.ui.updateSubtitle('', '正在听...');
      this.ui.hideLoading();
      
      // Enable wake lock
      await this.wakeLock.request();
      
      console.log('[APP START] Success');
      
    } catch (error) {
      console.error('[APP START] Error:', error);
      const parsedError = parseError(error);
      this.ui.showError(parsedError);
      this.ui.hideLoading();
      
      // Force reset on error
      this.speechService.forceReset();
      this.ui.updateButton(false);
    }
  }

  /**
   * Stop listening - SIMPLIFIED
   */
  async stop() {
    console.log('[APP STOP] Begin');
    
    try {
      await this.speechService.stop();
      
      // Update UI based on actual service state
      this.ui.updateButton(false);
      this.ui.updateStatus('已停止');
      this.ui.updateSubtitle('点击下方按钮开始', '');
      this.ui.resetPolishedText();
      
      // Release wake lock
      await this.wakeLock.release();
      
      console.log('[APP STOP] Success');
      
    } catch (error) {
      console.error('[APP STOP] Error:', error);
      
      // Force reset on error - always recover
      this.speechService.forceReset();
      this.ui.updateButton(false);
      this.ui.updateStatus('已停止');
      this.ui.updateSubtitle('点击下方按钮开始', '');
      this.ui.resetPolishedText();
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.speechService.destroy();
    this.wakeLock.release();
  }
}

// Initialize app when DOM is ready
let app;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    window.app = app; // Expose for inline event handlers
  });
} else {
  app = new App();
  window.app = app;
}

export default App;
