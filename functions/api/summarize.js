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
    console.error('[SUMMARIZE] Referer check failed');
    return forbiddenResponse('Unauthorized');
  }

  // Validate Groq credentials
  const { GROQ_API_KEY } = env;
  if (!GROQ_API_KEY) {
    console.error('[SUMMARIZE] Groq API key not configured in environment');
    return errorResponse('Groq API key not configured. Please add GROQ_API_KEY to .dev.vars', 500);
  }

  console.log('[SUMMARIZE] API key present:', GROQ_API_KEY ? 'YES' : 'NO');
  console.log('[SUMMARIZE] API key length:', GROQ_API_KEY?.length || 0);

  try {
    // Parse request body
    const { transcript } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      console.error('[SUMMARIZE] Invalid transcript:', transcript);
      return errorResponse('Invalid transcript', 400);
    }

    console.log('[SUMMARIZE] Transcript items:', transcript.length);

    // Format transcript for LLM
    const conversationText = transcript
      .map(item => `${item.speaker}: ${item.text}`)
      .join('\n');

    // Limit conversation length to prevent timeout
    const maxLength = 4000; // characters
    const truncatedText = conversationText.length > maxLength 
      ? conversationText.substring(0, maxLength) + '...'
      : conversationText;

    console.log('[SUMMARIZE] Conversation length:', truncatedText.length);
    console.log('[SUMMARIZE] Calling Groq API...');

    // Call Groq API with longer timeout for slower networks
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[SUMMARIZE] Request timeout after 45 seconds');
      controller.abort();
    }, 45000); // 45 second timeout (increased for slower networks)

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Faster model for slower networks
        messages: [
          {
            role: 'system',
            content: '你是一个专业的会议记录助手。请用简洁的中文总结对话内容，突出关键点和重要信息。总结应该在3-5句话之内。'
          },
          {
            role: 'user',
            content: `请总结以下对话：\n\n${truncatedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300 // Reduced for faster response
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('[SUMMARIZE] Groq API response status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('[SUMMARIZE] Groq API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      console.error('[SUMMARIZE] Groq API error:', groqResponse.status, errorData);
      
      // Return user-friendly error messages
      if (groqResponse.status === 401) {
        return errorResponse('Invalid Groq API key. Please check your GROQ_API_KEY in .dev.vars', 401);
      } else if (groqResponse.status === 403) {
        return errorResponse('Groq API key forbidden. Your API key may have expired or been revoked. Please generate a new key at https://console.groq.com/keys', 403);
      } else if (groqResponse.status === 429) {
        return errorResponse('API rate limit exceeded, please try again later', 429);
      } else if (groqResponse.status >= 500) {
        return errorResponse('Groq service temporarily unavailable', 503);
      }
      
      return errorResponse(errorData.error?.message || `Groq API error: ${groqResponse.status}`, groqResponse.status);
    }

    const data = await groqResponse.json();
    console.log('[SUMMARIZE] Groq API response received');
    
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      console.error('[SUMMARIZE] No summary in response:', JSON.stringify(data));
      return errorResponse('Failed to generate summary - no content returned', 500);
    }

    console.log('[SUMMARIZE] Summary generated successfully, length:', summary.length);
    return jsonResponse({ summary });

  } catch (error) {
    console.error('[SUMMARIZE] Exception:', error);
    console.error('[SUMMARIZE] Error name:', error.name);
    console.error('[SUMMARIZE] Error message:', error.message);
    console.error('[SUMMARIZE] Error stack:', error.stack);
    
    // Handle timeout
    if (error.name === 'AbortError') {
      return errorResponse('Request timeout', 504);
    }
    
    return errorResponse(error.message || 'Failed to generate summary', 500);
  }
}
