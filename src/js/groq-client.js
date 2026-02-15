/**
 * Groq API Client for LLM Summarization
 */

export class GroqClient {
  constructor() {
    this.apiEndpoint = '/api/summarize'; // Cloudflare Function endpoint
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
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transcript })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.summary;

    } catch (error) {
      console.error('Groq summarization error:', error);
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
