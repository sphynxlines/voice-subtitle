/**
 * AI Summarization API with configurable provider
 * Supports: SiliconFlow (China-friendly) and Groq (Global)
 * Provider selection via environment variable
 */

import { 
  jsonResponse, 
  errorResponse, 
  forbiddenResponse 
} from '../utils/response.js';
import { checkReferer } from '../utils/referer-check.js';

// Provider configurations
const PROVIDERS = {
  SILICONFLOW: {
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    envKey: 'SILICONFLOW_API_KEY'
  },
  GROQ: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.1-8b-instant',
    envKey: 'GROQ_API_KEY'
  }
};

const MAX_RETRIES = 2;
const TIMEOUT_MS = 45000; // 45 seconds

/**
 * Get active provider configuration
 */
function getProvider(env) {
  // Check environment variable for provider selection
  // Default to SiliconFlow if not specified
  const providerName = env.AI_PROVIDER || 'SILICONFLOW';
  const provider = PROVIDERS[providerName.toUpperCase()];
  
  if (!provider) {
    console.error('[SUMMARIZE] Invalid provider:', providerName);
    return PROVIDERS.SILICONFLOW; // Fallback to SiliconFlow
  }
  
  console.log('[SUMMARIZE] Using provider:', provider.name);
  return provider;
}

/**
 * Call AI API with retry logic
 */
async function callAI(provider, apiKey, messages, attempt = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    console.log(`[SUMMARIZE] Calling ${provider.name} API (attempt ${attempt})...`);
    
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: provider.defaultModel,
        messages: messages,
        temperature: 0.3,
        max_tokens: 300
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Success
    if (response.status === 200) {
      const data = await response.json();
      console.log(`[SUMMARIZE] ${provider.name} success`);
      return {
        success: true,
        content: data.choices[0].message.content,
        usage: data.usage,
        provider: provider.name
      };
    }

    // Authentication error - don't retry
    if (response.status === 401) {
      const errorText = await response.text();
      console.error(`[SUMMARIZE] ${provider.name} auth error:`, errorText);
      return {
        success: false,
        error: 'API密钥无效，请检查配置',
        retryable: false
      };
    }

    // Rate limit - retry with backoff
    if (response.status === 429) {
      if (attempt < MAX_RETRIES) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[SUMMARIZE] Rate limited, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callAI(provider, apiKey, messages, attempt + 1);
      }
      return {
        success: false,
        error: '请求过于频繁，请稍后重试',
        retryable: false
      };
    }

    // Forbidden (may be region/key issue)
    if (response.status === 403) {
      const errorText = await response.text();
      console.error(`[SUMMARIZE] ${provider.name} forbidden:`, errorText);
      
      // Check for SiliconFlow balance error
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.code === 30001) {
          return {
            success: false,
            error: '账户余额不足，请充值',
            retryable: false
          };
        }
      } catch (e) {
        // Not JSON, continue
      }
      
      return {
        success: false,
        error: 'API访问被拒绝，请检查密钥或区域限制',
        retryable: false
      };
    }

    // Server errors - retry
    if (response.status >= 500) {
      if (attempt < MAX_RETRIES) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[SUMMARIZE] Server error ${response.status}, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return callAI(provider, apiKey, messages, attempt + 1);
      }
      return {
        success: false,
        error: '服务暂时不可用，请稍后重试',
        retryable: true
      };
    }

    // Other errors
    const errorText = await response.text();
    console.error(`[SUMMARIZE] ${provider.name} error:`, response.status, errorText);
    return {
      success: false,
      error: `请求失败 (${response.status})`,
      retryable: false
    };

  } catch (error) {
    clearTimeout(timeoutId);

    // Timeout
    if (error.name === 'AbortError') {
      console.error(`[SUMMARIZE] ${provider.name} timeout`);
      return {
        success: false,
        error: '请求超时，请检查网络连接',
        retryable: true
      };
    }

    // Network error
    console.error(`[SUMMARIZE] ${provider.name} network error:`, error);
    return {
      success: false,
      error: '网络错误，请检查连接',
      retryable: true
    };
  }
}

/**
 * Handle POST request for conversation summarization
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // Log Cloudflare region info for debugging
  const cf = request.cf;
  if (cf) {
    console.log('[REGION] Data center:', cf.colo);
    console.log('[REGION] Country:', cf.country);
    console.log('[REGION] City:', cf.city);
  }

  // Check referer
  if (!checkReferer(request)) {
    console.error('[SUMMARIZE] Referer check failed');
    return forbiddenResponse('Unauthorized');
  }

  // Get provider configuration
  const provider = getProvider(env);
  const apiKey = env[provider.envKey];

  // Validate API key
  if (!apiKey) {
    console.error(`[SUMMARIZE] ${provider.name} API key not configured`);
    return errorResponse('AI总结功能未配置', 503);
  }

  try {
    // Parse request body
    const { transcript } = await request.json();

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      console.error('[SUMMARIZE] Invalid transcript');
      return errorResponse('无效的对话记录', 400);
    }

    console.log('[SUMMARIZE] Processing', transcript.length, 'items');

    // Format transcript
    const conversationText = transcript
      .map(item => `${item.speaker}: ${item.text}`)
      .join('\n');

    // Limit length
    const maxLength = 4000;
    const truncatedText = conversationText.length > maxLength 
      ? conversationText.substring(0, maxLength) + '...'
      : conversationText;

    console.log('[SUMMARIZE] Text length:', truncatedText.length);

    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的会议记录助手。请用简洁的中文总结对话内容，突出关键点和重要信息。总结应该在3-5句话之内。'
      },
      {
        role: 'user',
        content: `请总结以下对话：\n\n${truncatedText}`
      }
    ];

    // Call AI API with retry logic
    const result = await callAI(provider, apiKey, messages);

    if (result.success) {
      console.log('[SUMMARIZE] Success, summary length:', result.content.length);
      return jsonResponse({ 
        summary: result.content,
        usage: result.usage,
        provider: result.provider
      });
    } else {
      console.error('[SUMMARIZE] Failed:', result.error);
      return errorResponse(result.error, result.retryable ? 503 : 400);
    }

  } catch (error) {
    console.error('[SUMMARIZE] Unexpected error:', error);
    return errorResponse('总结生成失败，请稍后重试', 500);
  }
}
