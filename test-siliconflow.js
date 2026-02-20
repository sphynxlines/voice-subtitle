#!/usr/bin/env node

/**
 * Test script for SiliconFlow API
 * Tests the AI summarization backend
 */

import { readFileSync } from 'fs';

// Read API key from .dev.vars
function getApiKey() {
  try {
    const envContent = readFileSync('.dev.vars', 'utf-8');
    const match = envContent.match(/SILICONFLOW_API_KEY=["']?([^"'\n\r]+)["']?/);
    if (match && match[1] && match[1].trim() !== 'your_siliconflow_api_key_here') {
      return match[1].trim();
    }
    return null;
  } catch (error) {
    console.error('❌ Error reading .dev.vars:', error.message);
    return null;
  }
}

// Test SiliconFlow API
async function testSiliconFlow() {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error('❌ SILICONFLOW_API_KEY not found in .dev.vars');
    console.log('\n📝 Setup instructions:');
    console.log('1. Get API key from: https://cloud.siliconflow.cn/account/ak');
    console.log('2. Add to .dev.vars: SILICONFLOW_API_KEY=sk-xxx');
    console.log('3. Run this test again');
    process.exit(1);
  }

  console.log('✅ API key found, length:', apiKey.length);
  console.log('🔄 Testing SiliconFlow API...\n');

  // Test conversation
  const testTranscript = [
    { speaker: 'A', text: '今天天气真好' },
    { speaker: 'B', text: '是啊，我们去公园散步吧' },
    { speaker: 'A', text: '好主意，我带上相机' }
  ];

  const conversationText = testTranscript
    .map(item => `${item.speaker}: ${item.text}`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content: '你是一个专业的会议记录助手。请用简洁的中文总结对话内容，突出关键点和重要信息。总结应该在3-5句话之内。'
    },
    {
      role: 'user',
      content: `请总结以下对话：\n\n${conversationText}`
    }
  ];

  try {
    const startTime = Date.now();
    
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-72B-Instruct',  // Same model as Python script
        messages: messages,
        temperature: 0.3,
        max_tokens: 300
      })
    });

    const responseTime = Date.now() - startTime;
    console.log('⏱️  Response time:', responseTime + 'ms');
    console.log('📊 Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      
      // Parse error for better messages
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.code === 30001) {
          console.log('\n💡 Solution: Your account balance is insufficient');
          console.log('   Top up at: https://cloud.siliconflow.cn/account/billing');
        } else if (response.status === 401) {
          console.log('\n💡 Solution: Check your API key at https://cloud.siliconflow.cn/account/ak');
        } else if (response.status === 429) {
          console.log('\n💡 Solution: Rate limit exceeded, wait a moment and try again');
        } else if (response.status >= 500) {
          console.log('\n💡 Solution: Server error, try again later');
        }
      } catch (e) {
        // Error text is not JSON
        if (response.status === 401) {
          console.log('\n💡 Solution: Check your API key at https://cloud.siliconflow.cn/account/ak');
        } else if (response.status === 429) {
          console.log('\n💡 Solution: Rate limit exceeded, wait a moment and try again');
        } else if (response.status >= 500) {
          console.log('\n💡 Solution: Server error, try again later');
        }
      }
      
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('\n✅ Success!');
    console.log('\n📝 Test conversation:');
    console.log(conversationText);
    console.log('\n🤖 AI Summary:');
    console.log(data.choices[0].message.content);
    console.log('\n📊 Token usage:');
    console.log('  - Prompt tokens:', data.usage.prompt_tokens);
    console.log('  - Completion tokens:', data.usage.completion_tokens);
    console.log('  - Total tokens:', data.usage.total_tokens);
    
    console.log('\n✅ SiliconFlow API is working correctly!');
    console.log('\n🎯 Next steps:');
    console.log('1. Set ENABLE_SUMMARY: true in src/js/config.js');
    console.log('2. Restart dev server: npm run dev');
    console.log('3. Test end-to-end in the app');

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Solution: Check your internet connection');
      console.log('   SiliconFlow API requires internet access');
    }
    
    process.exit(1);
  }
}

// Run test
testSiliconFlow();
