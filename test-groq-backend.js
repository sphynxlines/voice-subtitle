/**
 * Test Groq API connectivity through backend
 * This simulates what happens when a user calls /api/summarize
 * Run with: node test-groq-backend.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read API key from .dev.vars
const devVarsPath = path.join(__dirname, '.dev.vars');
if (!fs.existsSync(devVarsPath)) {
  console.error('❌ .dev.vars file not found');
  console.log('💡 Create .dev.vars with your GROQ_API_KEY');
  process.exit(1);
}

const devVars = fs.readFileSync(devVarsPath, 'utf8');
const apiKeyMatch = devVars.match(/GROQ_API_KEY=["']?([^"'\n\r]+)["']?/);

if (!apiKeyMatch || !apiKeyMatch[1] || apiKeyMatch[1].trim() === 'your_groq_api_key_here') {
  console.error('❌ GROQ_API_KEY not found in .dev.vars');
  console.log('💡 Add this line to .dev.vars:');
  console.log('   GROQ_API_KEY=your_api_key_here');
  console.log('💡 Get a key from: https://console.groq.com/keys');
  process.exit(1);
}

const GROQ_API_KEY = apiKeyMatch[1].trim();
console.log('✅ API key found, length:', GROQ_API_KEY.length);

// Test transcript (simulating real usage)
const testTranscript = [
  { speaker: 'A', text: '你好，今天天气怎么样？', timestamp: Date.now() },
  { speaker: 'B', text: '今天天气很好，阳光明媚。', timestamp: Date.now() + 1000 },
  { speaker: 'A', text: '那我们去公园散步吧。', timestamp: Date.now() + 2000 }
];

// Test backend API call
async function testBackendSummarization() {
  console.log('\n🔄 Testing backend summarization flow...\n');
  console.log('📝 Test transcript:');
  testTranscript.forEach(item => {
    console.log(`   ${item.speaker}: ${item.text}`);
  });
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Format transcript (same as backend does)
    const conversationText = testTranscript
      .map(item => `${item.speaker}: ${item.text}`)
      .join('\n');

    console.log('🌐 Calling Groq API (simulating backend)...');
    
    // Call Groq API (same as backend does)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
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
        max_tokens: 300
      })
    });

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  Response time: ${elapsed}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ Error response:', errorText);
      
      if (response.status === 401) {
        console.error('\n💡 Solution: Your API key is invalid');
        console.error('   Generate a new key at: https://console.groq.com/keys');
      } else if (response.status === 403) {
        console.error('\n💡 Solution: Your API key may be expired or revoked');
        console.error('   Generate a new key at: https://console.groq.com/keys');
      } else if (response.status === 429) {
        console.error('\n💡 Solution: Rate limit exceeded, wait a moment and try again');
      }
      
      process.exit(1);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;
    
    if (!summary) {
      console.error('❌ No summary in response');
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('\n✅ Success!');
    console.log('📝 Summary:', summary);
    console.log('\n✨ Backend summarization is working correctly!');
    console.log('💡 You can now re-enable LLM in the app\n');

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ Error after ${elapsed}ms:`, error.message);
    
    if (error.name === 'AbortError') {
      console.error('💡 Request timed out - network may be slow or blocked');
    } else if (error.message.includes('fetch')) {
      console.error('💡 Network error - check your internet connection');
      console.error('💡 Groq API may be blocked in your region');
    }
    
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Test with timeout
const timeout = setTimeout(() => {
  console.error('\n❌ Test timed out after 30 seconds');
  console.error('💡 This suggests network connectivity issues');
  console.error('💡 Groq API may be blocked or very slow from your location');
  process.exit(1);
}, 30000);

testBackendSummarization().finally(() => {
  clearTimeout(timeout);
});
