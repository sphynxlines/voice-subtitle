# Local Development & E2E Testing Guide

## Quick Start (Recommended Method)

### 1. Install Dependencies

```bash
npm install
```

This installs Wrangler (Cloudflare's CLI) which provides:
- Local development server
- Cloudflare Functions support (your `/api/*` endpoints)
- Live reload
- Environment variable support

### 2. Setup Azure Credentials

Create a `.dev.vars` file (copy from example):

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` and add your Azure Speech credentials:

```
AZURE_KEY=your_actual_azure_key_here
AZURE_REGION=eastus
```

**Where to get Azure credentials:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Speech Service resource
3. Go to "Keys and Endpoint"
4. Copy Key 1 and Region

### 3. Run Development Server

```bash
npm run dev
```

This starts:
- Local server at `http://localhost:8000`
- Live reload (auto-refresh on file changes)
- Real Cloudflare Functions (`/api/token`, `/api/stats`)
- Real Azure Speech SDK integration

### 4. Test E2E

Open `http://localhost:8000` in your browser:

1. ✅ Click "开始" button
2. ✅ Grant microphone permission
3. ✅ Speak in Chinese
4. ✅ See real-time subtitles in top section
5. ✅ See polished subtitles in bottom section (after 500ms)

## Alternative Testing Methods

### Method 1: Mock Server (No Azure Credentials Needed)

If you don't have Azure credentials or just want to test the UI:

```bash
npm run dev:mock
```

This runs a mock server that:
- ✅ Serves static files
- ✅ Returns fake tokens (won't work with real speech)
- ✅ Good for UI/layout testing
- ❌ Speech recognition won't work

### Method 2: Python Simple Server (No npm)

```bash
python3 local-server.py
```

Same as mock server above, but using Python.

### Method 3: Cloudflare Wrangler (Production-like)

```bash
npx wrangler pages dev . --port 8000
```

This is what `npm run dev` does under the hood.

## Testing Checklist

### UI Tests (Can use mock server)

- [ ] Page loads without errors
- [ ] Two subtitle sections visible (实时 and 优化)
- [ ] Sections have equal height (50% each)
- [ ] Start button is visible and centered
- [ ] Button changes to "停止" when clicked
- [ ] Layout works on mobile (iPhone/iPad)
- [ ] No horizontal scrolling

### E2E Tests (Need real Azure credentials)

- [ ] Click "开始" button
- [ ] Microphone permission prompt appears
- [ ] Grant permission
- [ ] Status shows "🎤 正在听..."
- [ ] Speak: "嗯...那个...我觉得...这个方案很好"
- [ ] Top section shows: "A: 嗯...那个...我觉得...这个方案很好"
- [ ] Bottom section shows: "A: 我觉得 方案很好" (cleaned)
- [ ] Click "停止" button
- [ ] Status shows "已停止"
- [ ] Can restart by clicking "开始" again

### Long Session Tests

- [ ] Start listening
- [ ] Keep session running for 5+ minutes
- [ ] Verify no disconnections
- [ ] Check console for health check logs
- [ ] Session should auto-restart at ~8.5 minutes

### Error Recovery Tests

- [ ] Start listening
- [ ] Disconnect internet
- [ ] Should show network error
- [ ] Reconnect internet
- [ ] Should be able to restart

## Debugging

### Check Browser Console

Open DevTools (F12) and look for:

```
[INIT] Starting app initialization...
[INIT] App initialized successfully
[INIT] window.app exists: true
[BUTTON] Direct listeners attached
Token preloaded successfully
```

### Common Issues

#### Issue: "404 /api/token"
**Cause**: Not using Wrangler dev server
**Fix**: Use `npm run dev` instead of `python -m http.server`

#### Issue: "初始化失败"
**Cause**: Invalid Azure credentials or network error
**Fix**: 
1. Check `.dev.vars` has correct credentials
2. Check internet connection
3. Check browser console for specific error

#### Issue: Button not working
**Cause**: JavaScript error during initialization
**Fix**:
1. Open browser console (F12)
2. Look for red error messages
3. Check if `window.app` exists: type `window.app` in console
4. Check if function exists: type `typeof window.app.toggleListening`

#### Issue: Old version cached
**Fix**: Hard refresh
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or: DevTools → Network tab → Disable cache

#### Issue: Service Worker caching old version
**Fix**: Unregister service worker
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);
// Then reload page
```

### Test Specific Features

#### Test Button Click
```javascript
// In browser console:
window.app.toggleListening()
```

#### Test Token Fetch
```javascript
// In browser console:
fetch('/api/token').then(r => r.json()).then(console.log)
```

#### Check App State
```javascript
// In browser console:
window.app.speechService.getHealthStatus()
```

## File Structure

```
.
├── index.html              # Main page
├── src/
│   ├── js/
│   │   ├── app.js         # Main app controller
│   │   ├── ui-controller.js
│   │   ├── speech-recognition.js
│   │   ├── text-polisher.js
│   │   └── ...
│   └── css/
│       └── main.css       # Styles
├── functions/
│   └── api/
│       ├── token.js       # Token endpoint
│       └── stats.js       # Stats endpoint
├── .dev.vars              # Local env vars (gitignored)
├── .dev.vars.example      # Template
├── package.json           # npm scripts
└── local-server.js        # Mock server (fallback)
```

## NPM Scripts Reference

```bash
# Development with real Azure (recommended)
npm run dev

# Development with mock API (no Azure needed)
npm run dev:mock

# Deploy to Cloudflare Pages
npm run deploy

# Preview production build locally
npm run preview
```

## Environment Variables

### Local Development (`.dev.vars`)
```
AZURE_KEY=your_key
AZURE_REGION=eastus
```

### Production (Cloudflare Pages Dashboard)
Set these in Cloudflare Pages → Settings → Environment Variables:
- `AZURE_KEY`
- `AZURE_REGION`
- `RATE_LIMIT` (KV namespace binding)
- `STATS` (KV namespace binding)

## Tips

1. **Use `npm run dev`** for full E2E testing with real speech
2. **Use `npm run dev:mock`** for quick UI testing without Azure
3. **Clear cache** if you don't see changes (Ctrl+Shift+R)
4. **Check console** for errors and debug logs
5. **Test on mobile** using your local IP (e.g., `http://192.168.1.x:8000`)

## Mobile Testing

To test on your phone/tablet:

1. Find your computer's local IP:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. Start dev server:
   ```bash
   npm run dev
   ```

3. On your mobile device, open:
   ```
   http://YOUR_LOCAL_IP:8000
   ```
   Example: `http://192.168.1.100:8000`

4. Note: HTTPS is required for microphone on mobile (except localhost)
   - For real mobile testing, deploy to Cloudflare Pages
   - Or use ngrok/cloudflared tunnel

## Next Steps

After local testing passes:

1. Commit changes: `git add . && git commit -m "fix: button functionality"`
2. Push to GitHub: `git push`
3. Cloudflare Pages auto-deploys
4. Test on production URL
5. Clear cache if needed (see CLOUDFLARE_CACHE_FIX.md)

## Need Help?

- Check browser console for errors
- Run `test-button-fix.html` for diagnostics
- Check `debug-button.html` for basic button test
- Review error messages in UI
