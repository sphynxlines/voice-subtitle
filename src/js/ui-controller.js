/**
 * UI Controller - Manages all UI interactions and updates
 */

import { CONFIG } from './config.js';
import { ERROR_MESSAGES } from './errors.js';
import { vibrate, formatTime } from './utils.js';
import GroqClient from './groq-client.js';

export class UIController {
  constructor() {
    this.elements = {
      subtitleText: document.getElementById('subtitleText'),
      btnStart: document.getElementById('btnStart'),
      statusText: document.getElementById('statusText'),
      connectionIndicator: document.getElementById('connectionIndicator'),
      networkStatus: document.getElementById('networkStatus'),
      historyList: document.getElementById('historyList'),
      btnClearHistory: document.getElementById('btnClearHistory')
    };
    
    this.groqClient = new GroqClient();
    this.transcript = []; // Store full conversation
    this.setupHistoryHandlers();
  }

  /**
   * Setup history event handlers
   */
  setupHistoryHandlers() {
    if (this.elements.btnClearHistory) {
      this.elements.btnClearHistory.addEventListener('click', () => {
        this.clearHistory();
      });
    }
  }

  /**
   * Update subtitle text (real-time)
   */
  updateSubtitle(speaker, text, isRecognizing = false) {
    if (!text) {
      const newText = speaker || '点击下方按钮开始';
      this.elements.subtitleText.textContent = newText;
      return;
    }
    
    // Don't add placeholder text to transcript
    const isPlaceholder = text === '正在听...' || text === '点击下方按钮开始';
    
    const displayText = speaker ? `${speaker}: ${text}` : text;
    
    if (isRecognizing) {
      this.elements.subtitleText.innerHTML = 
        `<span class="recognizing">${displayText}</span>`;
    } else {
      this.elements.subtitleText.textContent = displayText;
      
      // Only add real speech to transcript and history (not placeholders)
      if (!isPlaceholder && speaker) {
        this.addToTranscript(speaker, text);
        this.addToHistory(speaker, text);
      }
    }
  }

  /**
   * Add to transcript (for summarization)
   */
  addToTranscript(speaker, text) {
    this.transcript.push({
      speaker,
      text,
      timestamp: Date.now()
    });
  }

  /**
   * Add to history display
   */
  addToHistory(speaker, text) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const time = new Date().toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    historyItem.innerHTML = `
      <div>
        <span class="history-item-speaker">${speaker}:</span>
        <span class="history-item-text">${text}</span>
      </div>
      <div class="history-item-time">${time}</div>
    `;
    
    this.elements.historyList.appendChild(historyItem);
    
    // Auto-scroll to bottom
    this.elements.historyList.scrollTop = this.elements.historyList.scrollHeight;
    
    // Limit history items (keep last 50)
    const items = this.elements.historyList.children;
    if (items.length > 50) {
      this.elements.historyList.removeChild(items[0]);
    }
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.elements.historyList.innerHTML = '';
    this.transcript = [];
    // Reset subtitle to default
    this.elements.subtitleText.textContent = '点击下方按钮开始';
  }

  /**
   * Generate and show summary
   */
  async showSummary() {
    // Only show summary if there's actual conversation (not just placeholders)
    if (this.transcript.length === 0) {
      console.log('[SUMMARY] No transcript to summarize');
      return;
    }

    console.log('[SUMMARY] Generating summary for', this.transcript.length, 'items');

    // Show loading in main subtitle area
    this.elements.subtitleText.innerHTML = 
      '<span class="recognizing">📝 正在生成对话总结...</span>';

    try {
      const summary = await this.groqClient.summarize(this.transcript);
      
      // Show summary in main subtitle area
      this.elements.subtitleText.innerHTML = `
        <div style="font-size: 0.6em; color: #27ae60; margin-bottom: 10px;">📝 对话总结</div>
        <div style="font-size: 0.7em; line-height: 1.5;">${summary}</div>
      `;
      
    } catch (error) {
      console.error('Failed to generate summary:', error);
      this.elements.subtitleText.innerHTML = 
        '<span style="color: #e74c3c;">总结生成失败: ' + error.message + '</span>';
    }
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
    this.elements.subtitleText.textContent = '点击下方按钮开始';
    this.updateStatus('准备就绪');
    this.updateButton(false);
    this.setButtonEnabled(true);
  }
}

export default UIController;
