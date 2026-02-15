/**
 * Test Groq API connectivity
 * Run with: node test-groq.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devVarsPath = path.join(__dirname, '.dev.vars');
if (!fs.existsSync(devVarsPath)) {
  console.error('❌ .dev.vars file not found');
  process.exit(1);
}

const devVars = fs.readFileSync(devVarsPath, 'utf8');
const apiKeyMatch = devVars.match(/GROQ_API_KEY=(.+)/);

if (!apiKeyMatch) {
  console.error('❌ GROQ_API_KEY not found in .dev.vars');
  process.exit(1);
}

const GROQ_API_KEY = apiKeyMatch[1].trim();
console.log('✅ API key found, length:', GROQ_API_KEY.length);

// Test API call
async function testGroqAPI() {
  console.log('\n🔄 Testing Groq API...\n');
  
  const startTime = Date.now();
  
  try {
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
            role: 'user',
            content: '请用中文说"你好"'
          }
        ],
        max_tokens: 50
      })
    });

    const elapsed = Date.now() - startTime;
    console.log(`⏱️  Response time: ${elapsed}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error response:', error);
      console.error('\n💡 Solution: Generate a new API key at https://console.groq.com/keys\n');
      process.exit(1);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('✅ Success!');
    console.log('📝 Response:', content);
    console.log('\n✨ Groq API is working correctly!');
    console.log('💡 You can now enable ENABLE_SUMMARY: true in src/js/config.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testGroqAPI();
