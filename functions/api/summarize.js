/**
 * Groq LLM Summarization API
 * Summarizes conversation transcripts using Groq
 */

import { 
  jsonResponse, 
  errorResponse, 
  forbiddenResponse 
} from '../utils/response.js';
import { checkReferer, getClientIP } from '../utils/referer-check.js';

/**
 * Handle POST request for conversation summarization
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // Check referer
  if (!checkReferer(request)) {
    return forbiddenResponse('Unauthorized');
  }

  // Validate Groq credentials
  const { GROQ_API_KEY } = env;
  if (!GROQ_API_KEY) {
    console.error('Groq API key not configured');
    return errorResponse('Service configuration error', 500);
  }

  try {
    // Parse request body
    const { transcript } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return errorResponse('Invalid transcript', 400);
    }

    // Format transcript for LLM
    const conversationText = transcript
      .map(item => `${item.speaker}: ${item.text}`)
      .join('\n');

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and capable model
        messages: [
          {
            role: 'system',
            content: '你是一个专业的会议记录助手。请用简洁的中文总结对话内容，突出关键点和重要信息。总结应该在3-5句话之内。'
          },
          {
            role: 'user',
            content: `请总结以下对话：\n\n${conversationText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!groqResponse.ok) {
      const error = await groqResponse.json().catch(() => ({}));
      console.error('Groq API error:', error);
      throw new Error(error.error?.message || `Groq API returned ${groqResponse.status}`);
    }

    const data = await groqResponse.json();
    const summary = data.choices[0]?.message?.content || '无法生成总结';

    return jsonResponse({ summary });

  } catch (error) {
    console.error('Summarization error:', error);
    return errorResponse(error.message || 'Failed to generate summary', 500);
  }
}
