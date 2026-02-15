/**
 * Text Polisher - Clean up transcription text
 * Removes filler words, repetitions, and cleans up formatting
 * No LLM needed - fast client-side processing
 */

export class TextPolisher {
  constructor() {
    // Common Chinese filler words
    this.fillerWords = [
      '嗯', '啊', '呃', '额', '哦', '哎', '诶',
      '那个', '这个', '就是', '然后', '其实', '应该',
      '可能', '大概', '基本上', '差不多'
    ];
    
    // Build regex pattern for filler words
    this.fillerPattern = new RegExp(
      `(^|\\s)(${this.fillerWords.join('|')})(\\s|$|[，。！？、])`,
      'g'
    );
    
    // Buffer to accumulate text before polishing
    this.buffer = [];
    this.lastPolishedText = '';
  }
  
  /**
   * Add text to buffer for polishing
   */
  addText(speaker, text) {
    if (!text || !text.trim()) return;
    
    this.buffer.push({ speaker, text, timestamp: Date.now() });
    
    // Keep buffer size reasonable (last 10 items)
    if (this.buffer.length > 10) {
      this.buffer.shift();
    }
  }
  
  /**
   * Polish the buffered text
   */
  polish() {
    if (this.buffer.length === 0) {
      return this.lastPolishedText;
    }
    
    // Get recent text (last 3 items for context)
    const recentItems = this.buffer.slice(-3);
    
    // Combine text
    let combined = recentItems
      .map(item => `${item.speaker}: ${item.text}`)
      .join(' ');
    
    // Apply cleaning rules
    let polished = this.cleanText(combined);
    
    this.lastPolishedText = polished;
    return polished;
  }
  
  /**
   * Clean text using simple rules
   */
  cleanText(text) {
    if (!text) return '';
    
    let cleaned = text;
    
    // 1. Remove filler words
    cleaned = cleaned.replace(this.fillerPattern, '$1$3');
    
    // 2. Remove repeated punctuation
    cleaned = cleaned.replace(/([，。！？、])\1+/g, '$1');
    
    // 3. Remove excessive spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // 4. Remove repeated words (same word appearing 2+ times in a row)
    cleaned = cleaned.replace(/(\S+)\s+\1+/g, '$1');
    
    // 5. Clean up punctuation spacing
    cleaned = cleaned.replace(/\s+([，。！？、])/g, '$1');
    cleaned = cleaned.replace(/([，。！？、])\s+/g, '$1 ');
    
    // 6. Trim
    cleaned = cleaned.trim();
    
    return cleaned;
  }
  
  /**
   * Reset buffer
   */
  reset() {
    this.buffer = [];
    this.lastPolishedText = '';
  }
  
  /**
   * Get current buffer size
   */
  getBufferSize() {
    return this.buffer.length;
  }
}

export default TextPolisher;
