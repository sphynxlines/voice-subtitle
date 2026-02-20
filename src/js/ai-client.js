/**
 * AI Summarization Client
 * Handles communication with backend AI API
 */

export class AIClient {
  constructor() {
    this.apiEndpoint = '/api/summarize';
    this.timeout = 50000; // 50 seconds
  }

  /**
   * Summarize conversation transcript
   * @param {Array} transcript - Array of {speaker, text, timestamp} objects
   * @returns {Promise<string>} - Summary text
   */
  async summarize(transcript) {
    if (!transcript || transcript.length === 0) {
      throw new Error('没有对话内容可以总结');
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '未知错误' }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.summary) {
        throw new Error('服务器未返回总结内容');
      }
      
      return data.summary;

    } catch (error) {
      console.error('AI summarization error:', error);
      
      // Provide user-friendly error messages
      if (error.name === 'AbortError') {
        throw new Error('总结请求超时，请检查网络连接');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('网络错误，请检查连接');
      } else if (error.message.includes('503')) {
        throw new Error('AI服务暂时不可用，请稍后重试');
      }
      
      throw error;
    }
  }
}

export default AIClient;
