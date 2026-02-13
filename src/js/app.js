/**
 * Main Application Controller
 */

import { CONFIG } from './config.js';
import { NetworkError, parseError } from './errors.js';
import { vibrate, storage } from './utils.js';
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
    this.autoStartAttempted = false;
    
    this.setupEventHandlers();
    this.setupNetworkMonitoring();
    this.setupVisibilityHandling();
    
    // Check permission and auto-start if granted
    this.checkPermissionAndAutoStart();
  }
  
  /**
   * Check microphone permission and auto-start if granted
   */
  async checkPermissionAndAutoStart() {
    try {
      // Check user preference for auto-start
      const autoStartEnabled = storage.get(CONFIG.STORAGE_KEYS.AUTO_START, true); // Default: enabled
      
      if (!autoStartEnabled) {
        console.log('Auto-start disabled by user preference');
        this.ui.updateStatus('准备就绪');
        return;
      }
      
      // Check if Permissions API is available
      if (!navigator.permissions || !navigator.permissions.query) {
        console.log('Permissions API not available');
        return;
      }
      
      // Query microphone permission
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      
      console.log('Microphone permission status:', permissionStatus.state);
      
      if (permissionStatus.state === 'granted') {
        // Permission already granted, auto-start after a short delay
        console.log('Microphone permission granted, auto-starting...');
        this.ui.updateStatus('🎤 自动启动中...');
        
        // Small delay to let UI settle
        setTimeout(() => {
          this.autoStartAttempted = true;
          this.start();
        }, 500);
      } else if (permissionStatus.state === 'prompt') {
        console.log('Microphone permission will be prompted');
        this.ui.updateStatus('点击「开始」按钮使用');
      } else {
        console.log('Microphone permission denied');
        this.ui.updateStatus('需要麦克风权限');
      }
      
      // Listen for permission changes
      permissionStatus.addEventListener('change', () => {
        console.log('Permission changed to:', permissionStatus.state);
        if (permissionStatus.state === 'granted' && !this.isListening && !this.autoStartAttempted && autoStartEnabled) {
          this.autoStartAttempted = true;
          this.start();
        }
      });
      
    } catch (error) {
      console.log('Permission check error:', error);
      // Fallback: just show ready state
      this.ui.updateStatus('准备就绪');
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
    
    // Setup help modal handlers
    this.setupHelpModal();
  }
  
  /**
   * Setup help modal event handlers
   */
  setupHelpModal() {
    const helpModal = document.getElementById('helpModal');
    const settingsModal = document.getElementById('settingsModal');
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (helpModal.classList.contains('active')) {
          this.toggleHelp();
        } else if (settingsModal.classList.contains('active')) {
          this.toggleSettings();
        }
      }
    });
    
    // Close on click outside
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        this.toggleHelp();
      }
    });
    
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        this.toggleSettings();
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
   * Toggle settings modal
   */
  toggleSettings() {
    vibrate();
    
    const modal = document.getElementById('settingsModal');
    const checkbox = document.getElementById('autoStartCheckbox');
    const body = document.body;
    
    if (modal.classList.contains('active')) {
      // Close modal
      modal.classList.remove('active');
      body.classList.remove('modal-open');
    } else {
      // Open modal and set checkbox state
      const autoStartEnabled = storage.get(CONFIG.STORAGE_KEYS.AUTO_START, true);
      checkbox.checked = autoStartEnabled;
      modal.classList.add('active');
      body.classList.add('modal-open');
    }
  }
  
  /**
   * Toggle auto-start preference
   */
  toggleAutoStart(enabled) {
    vibrate();
    storage.set(CONFIG.STORAGE_KEYS.AUTO_START, enabled);
    console.log('Auto-start preference:', enabled ? 'enabled' : 'disabled');
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
