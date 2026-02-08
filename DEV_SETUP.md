# Development Setup Guide

## Avoiding Microphone Permission Resets

### Problem
Browser resets microphone permissions when files change during development.

### Solutions

#### 1. Use HTTPS in Development (Best)
```bash
# Install mkcert (one-time setup)
brew install mkcert  # macOS
# or
choco install mkcert  # Windows

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1

# Use with your dev server
# Example for Python:
python -m http.server 8000 --bind localhost

# Example for Node.js (http-server):
http-server -S -C localhost.pem -K localhost-key.pem
```

#### 2. Set Permanent Browser Permissions

**Chrome/Edge:**
1. Visit `chrome://settings/content/microphone`
2. Click "Add" under "Allowed to use your microphone"
3. Enter: `http://localhost:*` or your dev URL
4. Permissions persist across reloads

**Firefox:**
1. Visit `about:preferences#privacy`
2. Scroll to "Permissions" → "Microphone" → "Settings"
3. Find your localhost URL
4. Set to "Allow" and check "Save changes"

**Safari:**
1. Safari → Settings → Websites → Microphone
2. Set localhost to "Allow"

#### 3. Use Service Worker
The service worker (`sw.js`) is now registered and helps maintain app stability.

#### 4. Development Workflow

**Option A: Use a stable dev server**
```bash
# Vercel CLI (recommended)
npm i -g vercel
vercel dev

# Cloudflare Wrangler
npm i -g wrangler
wrangler pages dev .
```

**Option B: Use browser profiles**
Create a dedicated browser profile for development:
```bash
# Chrome with custom profile
chrome --user-data-dir=/tmp/chrome-dev-profile http://localhost:8000

# Firefox with custom profile
firefox -P dev-profile http://localhost:8000
```

#### 5. Hot Reload Without Full Refresh
If using a build tool, configure it to use HMR (Hot Module Replacement) instead of full page reloads:

```javascript
// Example: Vite config
export default {
  server: {
    hmr: true,
    https: true
  }
}
```

### Quick Test
After setup, test that permissions persist:
1. Grant microphone permission
2. Make a code change
3. Reload page
4. Permission should still be granted ✅

### Troubleshooting

**Permission still resets?**
- Check if you're using `http://` instead of `https://`
- Verify service worker is registered (check DevTools → Application → Service Workers)
- Clear browser cache and re-grant permission
- Try a different port number

**Service Worker not updating?**
```javascript
// In DevTools Console:
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);
// Then reload
```

### Production Deployment
Once deployed to production with HTTPS, permissions are much more stable:
- Users grant permission once
- Permission persists across sessions
- Service worker enables offline functionality
