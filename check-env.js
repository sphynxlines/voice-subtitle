#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Verifies all required environment variables are set
 */

import { readFileSync, existsSync } from 'fs';

console.log('🔍 Checking environment configuration...\n');

// Check if .dev.vars exists
if (!existsSync('.dev.vars')) {
  console.error('❌ .dev.vars file not found');
  console.log('💡 Copy .dev.vars.example to .dev.vars and fill in your credentials');
  process.exit(1);
}

// Read .dev.vars
const envContent = readFileSync('.dev.vars', 'utf-8');

// Check Azure credentials
const azureKeyMatch = envContent.match(/AZURE_KEY=(.+)/);
const azureRegionMatch = envContent.match(/AZURE_REGION=(.+)/);

console.log('📋 Azure Speech Service:');
if (azureKeyMatch && azureKeyMatch[1] && azureKeyMatch[1] !== 'your_azure_speech_key_here') {
  console.log('  ✅ AZURE_KEY: Configured (length: ' + azureKeyMatch[1].length + ')');
} else {
  console.log('  ❌ AZURE_KEY: Not configured');
}

if (azureRegionMatch && azureRegionMatch[1] && azureRegionMatch[1] !== 'eastus') {
  console.log('  ✅ AZURE_REGION: ' + azureRegionMatch[1]);
} else {
  console.log('  ⚠️  AZURE_REGION: Using default (eastus)');
}

// Check SiliconFlow API key
console.log('\n📋 SiliconFlow AI:');
const siliconFlowMatch = envContent.match(/SILICONFLOW_API_KEY=["']?([^"'\n\r]+)["']?/);

if (siliconFlowMatch && siliconFlowMatch[1] && siliconFlowMatch[1] !== 'your_siliconflow_api_key_here') {
  const key = siliconFlowMatch[1].trim();
  console.log('  ✅ SILICONFLOW_API_KEY: Configured (length: ' + key.length + ')');
  
  if (key.startsWith('sk-')) {
    console.log('  ✅ Key format: Valid (starts with sk-)');
  } else {
    console.log('  ⚠️  Key format: Unusual (should start with sk-)');
  }
} else {
  console.log('  ❌ SILICONFLOW_API_KEY: Not configured');
  console.log('  💡 Get key from: https://cloud.siliconflow.cn/account/ak');
}

// Check config.js
console.log('\n📋 Feature Configuration:');
try {
  const configContent = readFileSync('src/js/config.js', 'utf-8');
  const enableSummaryMatch = configContent.match(/ENABLE_SUMMARY:\s*(true|false)/);
  
  if (enableSummaryMatch) {
    const isEnabled = enableSummaryMatch[1] === 'true';
    if (isEnabled) {
      console.log('  ✅ ENABLE_SUMMARY: true (AI summary enabled)');
    } else {
      console.log('  ⚠️  ENABLE_SUMMARY: false (AI summary disabled)');
      console.log('  💡 Set to true in src/js/config.js to enable');
    }
  }
} catch (error) {
  console.log('  ❌ Could not read src/js/config.js');
}

// Summary
console.log('\n' + '='.repeat(50));

const hasAzure = azureKeyMatch && azureKeyMatch[1] !== 'your_azure_speech_key_here';
const hasSiliconFlow = siliconFlowMatch && siliconFlowMatch[1] !== 'your_siliconflow_api_key_here';

if (hasAzure && hasSiliconFlow) {
  console.log('✅ All credentials configured!');
  console.log('\n🎯 Next steps:');
  console.log('1. Test SiliconFlow: node test-siliconflow.js');
  console.log('2. Enable feature: Set ENABLE_SUMMARY: true in src/js/config.js');
  console.log('3. Start dev server: npm run dev');
} else if (hasAzure) {
  console.log('⚠️  Azure configured, but SiliconFlow missing');
  console.log('\n🎯 To enable AI summary:');
  console.log('1. Get key: https://cloud.siliconflow.cn/account/ak');
  console.log('2. Add to .dev.vars: SILICONFLOW_API_KEY=sk-xxx');
  console.log('3. Test: node test-siliconflow.js');
} else {
  console.log('❌ Missing required credentials');
  console.log('\n🎯 Setup required:');
  console.log('1. Configure Azure Speech Service in .dev.vars');
  console.log('2. Get SiliconFlow key from https://cloud.siliconflow.cn/account/ak');
  console.log('3. Add to .dev.vars');
}

console.log('\n📚 Documentation:');
console.log('  - AI Setup: AI_SUMMARY_SETUP.md');
console.log('  - Cloudflare: CLOUDFLARE_ENV_SETUP.md');
console.log('  - Quick Start: QUICK_START.md');
