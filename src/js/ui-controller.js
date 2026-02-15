/**
 * UI Controller - Manages all UI interactions and updates
 */

import { CONFIG } from './config.js';
import { ERROR_MESSAGES } from './errors.js';
import { vibrate, formatTime, storage, createElement } from './utils.js';
import TextPolisher from './text-polisher.js';

export class UIController {
  constructor() {
    this.elements = {
      subtitleText: document.getElementById('subtitleText'),
      polishedText: document.getElementById('polishedText'),
      btnStart: document.getElementById('btnStart'),
      statusText: document.getElementById('statusText'),
      connectionIndicator: document.getElementById('connectionIndicator'),
      networkStatus: document.getElementById('networkStatus')
    };
    
    this.textPolisher = new TextPolisher();
    this.polishTimer = null;
  }

  /**
   * Update subtitle text (raw, real-time)
   */
  updateSubtitle(speaker, text, isRecognizing = false) {
    if (!text) {
      const newText = speaker || '点击下方按钮开始';
      this.elements.subtitleText.textContent = newText;
      return;
    }
    
    const displayText = speaker ? `${speaker}: ${text}` : text;
    
    if (isRecognizing) {
      this.elements.subtitleText.innerHTML = 
        `<span class="recognizing">${displayText}</span>`;
    } else {
      this.elements.subtitleText.textContent = displayText;
      
      // Add to polisher buffer and update polished text
      this.textPolisher.addText(speaker, text);
      this.schedulePolishUpdate();
    }
  }
  
  /**
   * Schedule polished text update (debounced)
   */
  schedulePolishUpdate() {
    if (this.polishTimer) {
      clearTimeout(this.polishTimer);
    }
    
    // Update polished text after 500ms of no new text
    this.polishTimer = setTimeout(() => {
      const polished = this.textPolisher.polish();
      if (polished) {
        this.elements.polishedText.textContent = polished;
      }
    }, 500);
  }
  
  /**
   * Reset polished text
   */
  resetPolishedText() {
    this.textPolisher.reset();
    this.elements.polishedText.textContent = '等待中...';
    if (this.polishTimer) {
      clearTimeout(this.polishTimer);
      this.polishTimer = null;
    }
  }

  /**
   * Show error message
   */
  showError(error) {
    vibrate(CONFIG.VIBRATION.LONG);
    
    const message = ERROR_MESSAGES[error.type] || ERROR_MESSAGES.unknown;
    this.elements.subtitleText.textContent = message;
    this.elements.polishedText.textContent = '';
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
   * Reset UI to initial state
   */
  reset() {
    this.updateSubtitle('', '点击下方按钮开始');
    this.resetPolishedText();
    this.updateStatus('准备就绪');
    this.updateButton(false);
    this.setButtonEnabled(true);
  }
}

export default UIController;
