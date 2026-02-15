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
    
    this.isListening = false;
    this.isPrewarming = false;
    
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
    // Prevent multiple simultaneous prewarm attempts
    if (this.isPrewarming || this.isListening) {
      return;
    }
    
    this.isPrewarming = true;
    
    try {
      // Only prewarm if we don't have a transcriber or it needs refresh
      if (this.speechService.needsReinitialization()) {
        await this.speechService.ensureFreshTranscriber();
        console.log('Speech service pre-initialized');
      }
    } catch (error) {
      // Non-critical failure - start() will handle initialization
      console.warn('Speech service prewarm failed (will initialize on start):', error);
    } finally {
      this.isPrewarming = false;
    }
  }

  /**
   * Setup speech service event handlers
   */
  setupEventHandlers() {
    // Real-time transcription
    this.speechService.onTranscribing = (speaker, text, isRecognizing) => {
      console.log('onTranscribing fired:', { speaker, text, isListening: this.isListening });
      // Only update if still listening
      if (this.isListening) {
        this.ui.updateSubtitle(speaker, text, isRecognizing);
      } else {
        console.log('Ignoring transcribing event - not listening');
      }
    };

    // Final transcription
    this.speechService.onTranscribed = (speaker, text, isRecognizing) => {
      console.log('onTranscribed fired:', { speaker, text, isListening: this.isListening });
      // Only update if still listening
      if (this.isListening) {
        const line = `${speaker}: ${text}`;
        this.ui.updateSubtitle(speaker, text, isRecognizing);
        this.ui.addToHistory(line);
      } else {
        console.log('Ignoring transcribed event - not listening');
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
      // Could show a brief notification to user if desired
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
      
      if (!isOnline && this.isListening) {
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
      if (document.visibilityState === 'visible' && this.isListening) {
        await this.wakeLock.request();
      }
    });
    
    // Setup help modal handlers
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
   * Toggle listening state
   */
  async toggleListening() {
    vibrate();
    
    // Prevent rapid clicking
    if (this.speechService.isTransitioning) {
      console.log('Operation in progress, ignoring click');
      return;
    }
    
    if (this.isListening) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  /**
   * Start listening
   */
  async start() {
    // Check network
    if (!this.networkMonitor.getStatus()) {
      this.ui.showError(new NetworkError());
      return;
    }

    // Show appropriate loading message
    const needsInit = this.speechService.needsReinitialization();
    this.ui.showLoading(needsInit ? '正在初始化...' : '正在启动...');
    
    // Reset speaker mapping
    this.speechService.resetSpeakers();

    try {
      await this.speechService.start();
      
      this.isListening = true;
      this.ui.updateButton(true);
      this.ui.updateStatus('🎤 正在听...');
      this.ui.updateSubtitle('', '正在听...');
      this.ui.hideLoading();
      
      // Enable wake lock
      await this.wakeLock.request();
      
    } catch (error) {
      console.error('Start error:', error);
      const parsedError = parseError(error);
      this.ui.showError(parsedError);
      this.ui.hideLoading();
      
      // Clean up on error to ensure fresh start next time
      try {
        if (this.speechService.transcriber) {
          this.speechService.transcriber.close();
          this.speechService.transcriber = null;
        }
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
    }
  }

  /**
   * Stop listening
   */
  async stop() {
    console.log('=== STOP CALLED ===');
    
    // Prevent double-stop
    if (!this.isListening) {
      console.log('Already stopped, ignoring');
      return;
    }
    
    try {
      // Set flag first to prevent event handlers from updating UI
      this.isListening = false;
      console.log('isListening set to false');
      
      await this.speechService.stop();
      console.log('speechService.stop() completed');
      
      this.ui.updateButton(false);
      console.log('Button updated');
      
      this.ui.updateStatus('已停止');
      console.log('Status updated');
      
      // Clear subtitle and show default message
      this.ui.updateSubtitle('点击下方按钮开始', '');
      console.log('Subtitle reset completed');
      
      // Release wake lock
      await this.wakeLock.release();
      
    } catch (error) {
      console.error('Stop error:', error);
      
      // Force state reset even on error
      this.isListening = false;
      this.ui.updateButton(false);
      this.ui.updateStatus('已停止 (出错)');
      this.ui.updateSubtitle('点击下方按钮开始', '');
      
      // Try to clean up transcriber
      try {
        if (this.speechService.transcriber) {
          this.speechService.transcriber.close();
          this.speechService.transcriber = null;
        }
      } catch (cleanupError) {
        console.warn('Cleanup error:', cleanupError);
      }
    }
  }

  /**
   * Change font size
   */
  changeFontSize(delta) {
    this.ui.changeFontSize(delta);
  }
  
  /**
   * Toggle help modal
   */
  toggleHelp() {
    vibrate();
    
    const modal = document.getElementById('helpModal');
    const iframe = document.getElementById('helpFrame');
    const body = document.body;
    
    if (modal.classList.contains('active')) {
      // Close modal
      modal.classList.remove('active');
      body.classList.remove('modal-open');
      iframe.src = ''; // Clear iframe to stop any activity
    } else {
      // Open modal
      iframe.src = '/help.html';
      modal.classList.add('active');
      body.classList.add('modal-open');
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
