#!/usr/bin/env node

/**
 * Test AI Provider Configuration
 * Tests which provider is configured and working
 */

import { readFileSync } from 'fs';

console.log('🔍 Checking AI Provider Configuration...\n');

// Read .dev.vars
const envContent = readFileSync('.dev.vars', 'utf-8');

// Get AI_PROVIDER
const providerMatch = envContent.match(/AI_PROVIDER=["']?([^"'\n\r]+)["']?/);
const provider = providerMatch ? providerMatch[1].trim().toUpperCase() : 'SILICONFLOW';

console.log('📋 Configuration:');
console.log('  Provider:', provider);

// Check SiliconFlow key
const siliconMatch = envContent.match(/SILICONFLOW_API_KEY=["']?([^"'\n\r]+)["']?/);
const hasSiliconFlow = siliconMatch && siliconMatch[1] && siliconMatch[1] !== 'your_siliconflow_api_key_here';

if (hasSiliconFlow) {
  console.log('  ✅ SiliconFlow key: Configured (length:', siliconMatch[1].trim().length + ')');
} else {
  console.log('  ❌ SiliconFlow key: Not configured');
}

// Check Groq key
const groqMatch = envContent.match(/GROQ_API_KEY=["']?([^"'\n\r]+)["']?/);
const hasGroq = groqMatch && groqMatch[1] && groqMatch[1] !== 'your_groq_api_key_here';

if (hasGroq) {
  console.log('  ✅ Groq key: Configured (length:', groqMatch[1].trim().length + ')');
} else {
  console.log('  ❌ Groq key: Not configured');
}

console.log('\n' + '='.repeat(50));

// Validate configuration
if (provider === 'GROQ') {
  if (hasGroq) {
    console.log('✅ Configuration valid: Using Groq');
    console.log('\n🎯 Next steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Test summarization feature');
    console.log('3. Check logs for: [SUMMARIZE] Using provider: Groq');
    console.log('4. Verify region: [REGION] Data center: (should be outside China)');
  } else {
    console.log('❌ Configuration error: AI_PROVIDER=GROQ but no GROQ_API_KEY');
    console.log('\n💡 Solution:');
    console.log('1. Get key from: https://console.groq.com/keys');
    console.log('2. Add to .dev.vars: GROQ_API_KEY=gsk-xxx');
    console.log('3. Or change to: AI_PROVIDER=SILICONFLOW');
  }
} else if (provider === 'SILICONFLOW') {
  if (hasSiliconFlow) {
    console.log('✅ Configuration valid: Using SiliconFlow');
    console.log('\n🎯 Next steps:');
    console.log('1. Ensure account has balance');
    console.log('2. Start dev server: npm run dev');
    console.log('3. Test summarization feature');
    console.log('4. Check logs for: [SUMMARIZE] Using provider: SiliconFlow');
  } else {
    console.log('❌ Configuration error: AI_PROVIDER=SILICONFLOW but no SILICONFLOW_API_KEY');
    console.log('\n💡 Solution:');
    console.log('1. Get key from: https://cloud.siliconflow.cn/account/ak');
    console.log('2. Add to .dev.vars: SILICONFLOW_API_KEY=sk-xxx');
    console.log('3. Or change to: AI_PROVIDER=GROQ');
  }
} else {
  console.log('⚠️  Unknown provider:', provider);
  console.log('   Defaulting to SiliconFlow');
  if (hasSiliconFlow) {
    console.log('   ✅ SiliconFlow key available');
  } else {
    console.log('   ❌ SiliconFlow key missing');
  }
}

console.log('\n📚 Documentation:');
console.log('  - AI_PROVIDER_CONFIG.md - Provider configuration guide');
console.log('  - SETUP_SMART_PLACEMENT.md - Region routing setup');
console.log('  - API_KEY_TROUBLESHOOTING.md - Troubleshooting guide');
