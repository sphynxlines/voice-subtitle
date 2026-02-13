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
    console.log('=== STOP CALLED ===');
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
      
      // Clear subtitle and show default message immediately
      console.log('About to reset subtitle...');
      this.ui.updateSubtitle('点击下方按钮开始', '');
      console.log('Subtitle reset completed');
      
      // Also try with a delay to see if something overwrites it
      setTimeout(() => {
        console.log('Delayed subtitle reset...');
        this.ui.updateSubtitle('点击下方按钮开始', '');
        console.log('Delayed subtitle reset completed');
      }, 200);
      
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
   * Open help page (works in both browser and PWA mode)
   */
  openHelp() {
    vibrate();
    
    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;
    
    if (isPWA) {
      // In PWA mode, open in new window/tab
      window.open('/help.html', '_blank', 'noopener,noreferrer');
    } else {
      // In browser mode, navigate normally
      window.location.href = '/help.html';
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
