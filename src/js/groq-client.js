/**
 * Groq API Client for LLM Summarization
 */

export class GroqClient {
  constructor() {
    this.apiEndpoint = '/api/summarize'; // Cloudflare Function endpoint
    this.timeout = 50000; // 50 second timeout (increased for slower networks)
  }

  /**
   * Summarize conversation transcript
   * @param {Array} transcript - Array of {speaker, text, timestamp} objects
   * @returns {Promise<string>} - Summary text
   */
  async summarize(transcript) {
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript to summarize');
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
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.summary) {
        throw new Error('No summary returned from API');
      }
      
      return data.summary;

    } catch (error) {
      console.error('Groq summarization error:', error);
      
      // Provide user-friendly error messages
      if (error.name === 'AbortError') {
        throw new Error('总结请求超时');
      } else if (error.message.includes('HTTP 500')) {
        throw new Error('服务器错误，请稍后重试');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('网络错误，请检查连接');
      }
      
      throw error;
    }
  }

  /**
   * Format transcript for display
   * @param {Array} transcript - Array of {speaker, text, timestamp} objects
   * @returns {string} - Formatted transcript
   */
  formatTranscript(transcript) {
    return transcript
      .map(item => `${item.speaker}: ${item.text}`)
      .join('\n');
  }
}

export default GroqClient;
