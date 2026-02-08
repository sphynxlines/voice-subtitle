/**
 * Stats Page Controller
 */

import { CONFIG } from './config.js';
import { storage, formatNumber, formatDate } from './utils.js';
import { statsAPI } from './api.js';

class StatsPage {
  constructor() {
    this.elements = {
      loginBox: document.getElementById('loginBox'),
      reportContent: document.getElementById('reportContent'),
      errorBox: document.getElementById('errorBox'),
      keyInput: document.getElementById('keyInput'),
      totalCount: document.getElementById('totalCount'),
      monthCount: document.getElementById('monthCount'),
      todayCount: document.getElementById('todayCount'),
      todayUnique: document.getElementById('todayUnique'),
      chart: document.getElementById('chart'),
      tableBody: document.getElementById('tableBody'),
      lastUpdated: document.getElementById('lastUpdated')
    };

    this.savedKey = storage.get(CONFIG.STORAGE_KEYS.STATS_KEY, '');
    this.init();
  }

  init() {
    // Auto-load if key is saved
    if (this.savedKey) {
      this.elements.keyInput.value = this.savedKey;
      this.loadStats();
    }

    // Enter key handler
    this.elements.keyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.loadStats();
      }
    });
  }

  async loadStats() {
    const key = this.elements.keyInput.value.trim();
    
    if (!key) {
      alert('请输入密钥');
      return;
    }

    // Save key
    storage.set(CONFIG.STORAGE_KEYS.STATS_KEY, key);

    try {
      const data = await statsAPI.getStats(key);
      this.displayStats(data);
      this.showReport();
      this.hideError();
      this.updateTimestamp();
      
    } catch (error) {
      this.showError(error.message);
      
      if (error.message === '密钥错误') {
        storage.remove(CONFIG.STORAGE_KEYS.STATS_KEY);
      }
    }
  }

  displayStats(data) {
    // Update cards
    this.elements.totalCount.textContent = formatNumber(data.total);
    this.elements.monthCount.textContent = formatNumber(data.thisMonth);
    this.elements.todayCount.textContent = formatNumber(data.today);
    this.elements.todayUnique.textContent = formatNumber(data.todayUnique);

    // Update chart
    this.renderChart(data.last7Days);

    // Update table
    this.renderTable(data.last7Days);
  }

  renderChart(days) {
    this.elements.chart.innerHTML = '';
    
    const maxRequests = Math.max(...days.map(d => d.requests), 1);
    const sortedDays = [...days].reverse();
    
    sortedDays.forEach(day => {
      const height = (day.requests / maxRequests) * 150;
      
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.innerHTML = `
        <div class="value">${day.requests}</div>
        <div class="bar" style="height: ${Math.max(height, 4)}px"></div>
        <div class="date">${formatDate(day.date)}</div>
      `;
      
      this.elements.chart.appendChild(bar);
    });
  }

  renderTable(days) {
    this.elements.tableBody.innerHTML = '';
    
    days.forEach(day => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${day.date}</td>
        <td>${day.requests}</td>
        <td>${day.uniqueUsers}</td>
      `;
      this.elements.tableBody.appendChild(row);
    });
  }

  showReport() {
    this.elements.loginBox.classList.add('hidden');
    this.elements.reportContent.classList.remove('hidden');
  }

  showError(message) {
    this.elements.errorBox.textContent = message;
    this.elements.errorBox.classList.remove('hidden');
  }

  hideError() {
    this.elements.errorBox.classList.add('hidden');
  }

  updateTimestamp() {
    const now = new Date().toLocaleTimeString('zh-CN');
    this.elements.lastUpdated.textContent = `更新于 ${now}`;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.statsPage = new StatsPage();
  });
} else {
  window.statsPage = new StatsPage();
}

// Expose loadStats for button onclick
window.loadStats = () => window.statsPage.loadStats();
