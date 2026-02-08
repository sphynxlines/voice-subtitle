/**
 * Main Application Controller
 */

import { CONFIG } from './config.js';
import { NetworkError, parseError } from './errors.js';
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
    
    this.setupEventHandlers();
    this.setupNetworkMonitoring();
    this.setupVisibilityHandling();
  }

  /**
   * Setup speech service event handlers
   */
  setupEventHandlers() {
    // Real-time transcription
    this.speechService.onTranscribing = (speaker, text, isRecognizing) => {
      this.ui.updateSubtitle(speaker, text, isRecognizing);
    };

    // Final transcription
    this.speechService.onTranscribed = (speaker, text, isRecognizing) => {
      const line = `${speaker}: ${text}`;
      this.ui.updateSubtitle(speaker, text, isRecognizing);
      this.ui.addToHistory(line);
    };

    // Error handling
    this.speechService.onError = (error) => {
      this.ui.showError(error);
      this.stop();
    };

    // Session events
    this.speechService.onSessionStarted = () => {
      console.log('Session started');
    };

    this.speechService.onSessionStopped = () => {
      console.log('Session stopped');
    };
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
  }

  /**
   * Toggle listening state
   */
  async toggleListening() {
    vibrate();
    
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

    this.ui.showLoading('正在初始化...');
    
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
    }
  }

  /**
   * Stop listening
   */
  async stop() {
    try {
      await this.speechService.stop();
      
      this.isListening = false;
      this.ui.updateButton(false);
      this.ui.updateStatus('已停止');
      // Clear subtitle and show default message
      this.ui.updateSubtitle('点击下方按钮开始', '');
      
      // Release wake lock
      await this.wakeLock.release();
      
    } catch (error) {
      console.error('Stop error:', error);
    }
  }

  /**
   * Change font size
   */
  changeFontSize(delta) {
    this.ui.changeFontSize(delta);
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
