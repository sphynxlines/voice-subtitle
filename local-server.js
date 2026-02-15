#!/usr/bin/env node

/**
 * Local Development Server with Mock API
 * Run with: node local-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Mock Azure token (for local testing only - won't actually work with Azure)
const MOCK_TOKEN = 'mock_token_for_local_testing_' + Date.now();
const MOCK_REGION = 'eastus';

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Handle API endpoints
  if (req.url === '/api/token') {
    // Mock token endpoint
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      token: MOCK_TOKEN, 
      region: MOCK_REGION 
    }));
    return;
  }

  if (req.url === '/api/stats') {
    // Mock stats endpoint
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Serve static files
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 Local Development Server Running!');
  console.log('');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('');
  console.log('📝 Features:');
  console.log('   ✅ Static file serving');
  console.log('   ✅ Mock /api/token endpoint');
  console.log('   ✅ Mock /api/stats endpoint');
  console.log('');
  console.log('⚠️  Note: Mock token won\'t work with real Azure Speech SDK');
  console.log('   For real speech recognition, deploy to Cloudflare Pages');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
