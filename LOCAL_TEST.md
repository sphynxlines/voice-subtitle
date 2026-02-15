# Local Testing Guide

## Quick Start (Choose One Method)

### Method 1: Python (Simplest)
```bash
# Python 3
python3 -m http.server 8000

# Then open: http://localhost:8000
```

### Method 2: Node.js (If you have it)
```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run server
http-server -p 8000

# Then open: http://localhost:8000
```

### Method 3: PHP (If you have it)
```bash
php -S localhost:8000

# Then open: http://localhost:8000
```

### Method 4: VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## Important: Browser Cache

If you don't see the layout changes, **clear your browser cache**:

### Chrome/Edge:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

OR:
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select "Cached images and files"
3. Click "Clear data"

### Firefox:
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select "Cache"
3. Click "Clear Now"

### Safari:
1. Press `Cmd+Option+E` to empty caches
2. Reload page

## Verify Changes

After clearing cache, you should see:

```
┌─────────────────────────────────┐
│  实时                            │ ← Label in gray
│  点击下方按钮开始                │ ← Large text
├─────────────────────────────────┤
│  优化                            │ ← Label in gray
│  等待中...                       │ ← Large text
├─────────────────────────────────┤
│       ⚫ 开始                    │ ← Green button
│       准备就绪                   │ ← Status
└─────────────────────────────────┘
```

## Testing the Feature

1. **Start the server** (using one of the methods above)
2. **Open in browser**: http://localhost:8000
3. **Clear cache** (if needed)
4. **Click "开始" button**
5. **Grant microphone permission**
6. **Speak**: Try saying something with filler words

### Example Test:
Say: "嗯...那个...我觉得...这个方案很好"

You should see:
- **Top (实时)**: "A: 嗯...那个...我觉得...这个方案很好" (instant)
- **Bottom (优化)**: "A: 我觉得 方案很好" (after 500ms, cleaned)

## Troubleshooting

### Issue: Old layout still showing
**Solution**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: "点击下方按钮开始" not showing
**Solution**: Check browser console (F12) for JavaScript errors

### Issue: Service Worker caching old version
**Solution**: 
```javascript
// In browser console:
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);
// Then reload
```

### Issue: CSS not loading
**Solution**: Check that `src/css/main.css` exists and server is serving it

### Issue: Can't test microphone (need HTTPS)
**Solution**: For microphone testing, you need:
1. Use `localhost` (works without HTTPS)
2. OR set up HTTPS (see DEV_SETUP.md)

## Quick Verification Checklist

- [ ] Server running on port 8000
- [ ] Browser cache cleared
- [ ] Page shows two sections: "实时" and "优化"
- [ ] Only one button visible (no font controls)
- [ ] Both sections have equal height
- [ ] Labels are small and gray
- [ ] Text is large and centered

## Need Backend Functions?

If you need the token API to work (for actual speech recognition):

### Cloudflare Pages:
```bash
# Install Wrangler
npm install -g wrangler

# Run dev server with functions
wrangler pages dev .
```

### Netlify:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run dev server with functions
netlify dev
```

## Production Testing

If deployed to production (Cloudflare Pages, Netlify, etc.):
1. Push changes to git
2. Wait for deployment
3. Visit your production URL
4. Hard refresh to clear cache

## Still Not Working?

Check these files were updated:
- ✅ `index.html` - New dual display structure
- ✅ `src/css/main.css` - New layout styles
- ✅ `src/js/ui-controller.js` - Polished text handling
- ✅ `src/js/text-polisher.js` - New file created
- ✅ `src/js/app.js` - Updated event handlers

If any are missing, the layout won't work correctly.
