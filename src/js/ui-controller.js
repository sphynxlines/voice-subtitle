/**
 * UI Controller - Manages all UI interactions and updates
 */

import { CONFIG } from './config.js';
import { ERROR_MESSAGES } from './errors.js';
import { vibrate, formatTime, storage, createElement } from './utils.js';
import AIClient from './ai-client.js';

export class UIController {
  constructor() {
    this.elements = {
      subtitleText: document.getElementById('subtitleText'),
      btnStart: document.getElementById('btnStart'),
      statusText: document.getElementById('statusText'),
      connectionIndicator: document.getElementById('connectionIndicator'),
      history: document.getElementById('history'),
      networkStatus: document.getElementById('networkStatus'),
      fontSizeDisplay: document.getElementById('fontSizeDisplay')
    };
    
    this.aiClient = new AIClient();
    this.transcript = []; // Store conversation for summarization
    this.fontSize = storage.get(CONFIG.STORAGE_KEYS.FONT_SIZE, CONFIG.FONT_SIZE.DEFAULT);
    this.sessionStartTime = null;
    this.sessionDurationTimer = null;
    
    // Only apply font size if element exists
    if (this.elements.fontSizeDisplay) {
      this.applyFontSize();
    }
  }

  /**
   * Update subtitle text
   */
  updateSubtitle(speaker, text, isRecognizing = false) {
    console.log('updateSubtitle called:', { speaker, text, isRecognizing });
    
    if (!text) {
      // If no text provided, clear subtitle
      const newText = speaker || '点击下方按钮开始';
      console.log('Setting subtitle to:', newText);
      this.elements.subtitleText.textContent = newText;
      console.log('Subtitle element textContent is now:', this.elements.subtitleText.textContent);
      return;
    }
    
    const displayText = speaker ? `${speaker}: ${text}` : text;
    
    if (isRecognizing) {
      this.elements.subtitleText.innerHTML = 
        `<span class="recognizing">${displayText}</span>`;
    } else {
      this.elements.subtitleText.textContent = displayText;
      
      // Add to transcript for summarization (only final text, not recognizing)
      if (speaker && text) {
        this.transcript.push({
          speaker,
          text,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Generate and show AI summary
   */
  async showSummary() {
    // Check if feature is enabled
    if (!CONFIG.FEATURES.ENABLE_SUMMARY) {
      console.log('[SUMMARY] Feature disabled in config');
      return;
    }

    // Check if there's content to summarize
    if (this.transcript.length === 0) {
      console.log('[SUMMARY] No transcript to summarize');
      return;
    }

    console.log('[SUMMARY] Generating summary for', this.transcript.length, 'items');

    // Show loading state
    this.elements.subtitleText.innerHTML = 
      '<span class="recognizing">📝 正在生成对话总结...</span>';

    try {
      const summary = await this.aiClient.summarize(this.transcript);
      
      // Show summary
      this.elements.subtitleText.innerHTML = `
        <div style="font-size: 0.6em; color: #27ae60; margin-bottom: 10px;">📝 对话总结</div>
        <div style="font-size: 0.7em; line-height: 1.5;">${summary}</div>
      `;
      
      console.log('[SUMMARY] Success');
      
    } catch (error) {
      console.error('[SUMMARY] Failed:', error);
      
      // Show error briefly, then return to default
      this.elements.subtitleText.innerHTML = 
        `<span style="color: #e74c3c;">总结生成失败: ${error.message}</span>`;
      
      // Return to default after 3 seconds
      setTimeout(() => {
        this.elements.subtitleText.textContent = '点击下方按钮开始';
      }, 3000);
    }
  }

  /**
   * Clear transcript
   */
  clearTranscript() {
    this.transcript = [];
  }

  /**
   * Show error message
   */
  showError(error) {
    vibrate(CONFIG.VIBRATION.LONG);
    
    const message = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.unknown;
    this.elements.subtitleText.textContent = message;
    this.elements.statusText.textContent = '❌ ' + error.message;
    this.updateConnectionStatus('disconnected');
  }

  /**
   * Update status text
   */
  updateStatus(text) {
    this.elements.statusText.textContent = text;
  }
  
  /**
   * Update connection status indicator
   */
  updateConnectionStatus(state) {
    this.elements.connectionIndicator.className = 'connection-indicator';
    if (state === 'connected') {
      this.elements.connectionIndicator.classList.add('connected');
    } else if (state === 'reconnecting') {
      this.elements.connectionIndicator.classList.add('reconnecting');
    }
  }
  
  /**
   * Update session duration display
   */
  updateSessionDuration() {
    if (!this.sessionStartTime) return;
    
    const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    if (minutes > 0) {
      this.elements.statusText.textContent = 
        `🎤 正在听... (${minutes}:${seconds.toString().padStart(2, '0')})`;
    }
  }
  
  /**
   * Start session duration timer
   */
  startSessionDurationTimer() {
    this.sessionStartTime = Date.now();
    if (this.sessionDurationTimer) {
      clearInterval(this.sessionDurationTimer);
    }
    this.sessionDurationTimer = setInterval(() => this.updateSessionDuration(), 1000);
  }
  
  /**
   * Stop session duration timer
   */
  stopSessionDurationTimer() {
    if (this.sessionDurationTimer) {
      clearInterval(this.sessionDurationTimer);
      this.sessionDurationTimer = null;
    }
    this.sessionStartTime = null;
  }

  /**
   * Update button state
   */
  updateButton(isListening) {
    if (isListening) {
      this.elements.btnStart.textContent = '停止';
      this.elements.btnStart.classList.add('listening');
      this.elements.btnStart.setAttribute('aria-pressed', 'true');
      this.elements.btnStart.setAttribute('aria-label', '停止语音识别');
    } else {
      this.elements.btnStart.textContent = '开始';
      this.elements.btnStart.classList.remove('listening');
      this.elements.btnStart.setAttribute('aria-pressed', 'false');
      this.elements.btnStart.setAttribute('aria-label', '开始语音识别');
    }
  }

  /**
   * Enable/disable button
   */
  setButtonEnabled(enabled) {
    this.elements.btnStart.disabled = !enabled;
  }

  /**
   * Show loading state
   */
  showLoading(message = '正在初始化...') {
    this.updateStatus(message);
    this.setButtonEnabled(false);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.setButtonEnabled(true);
  }

  /**
   * Update network status
   */
  updateNetworkStatus(isOnline) {
    if (isOnline) {
      this.elements.networkStatus.classList.remove('offline');
      this.updateStatus('✅ 网络已恢复');
    } else {
      this.elements.networkStatus.classList.add('offline');
      this.updateStatus('⚠️ 网络已断开');
    }
  }

  /**
   * Add to history
   */
  addToHistory(text) {
    if (!text.trim()) return;
    
    const time = formatTime();
    const item = createElement('div', {
      textContent: `[${time}] ${text}`,
      className: 'history-item'
    });
    
    this.elements.history.insertBefore(item, this.elements.history.firstChild);
    
    // Keep only last N items
    while (this.elements.history.children.length > CONFIG.HISTORY_MAX_ITEMS) {
      this.elements.history.removeChild(this.elements.history.lastChild);
    }
  }

  /**
   * Change font size
   */
  changeFontSize(delta) {
    vibrate();
    
    this.fontSize = Math.max(
      CONFIG.FONT_SIZE.MIN,
      Math.min(CONFIG.FONT_SIZE.MAX, this.fontSize + delta)
    );
    
    this.applyFontSize();
    storage.set(CONFIG.STORAGE_KEYS.FONT_SIZE, this.fontSize);
  }

  /**
   * Apply font size
   */
  applyFontSize() {
    if (this.elements.subtitleText) {
      this.elements.subtitleText.style.fontSize = this.fontSize + 'px';
    }
    if (this.elements.fontSizeDisplay) {
      this.elements.fontSizeDisplay.textContent = this.fontSize + 'px';
    }
  }

  /**
   * Reset UI to initial state
   */
  reset() {
    this.updateSubtitle('', '点击下方按钮开始');
    this.updateStatus('准备就绪');
    this.updateButton(false);
    this.setButtonEnabled(true);
  }
}

export default UIController;
