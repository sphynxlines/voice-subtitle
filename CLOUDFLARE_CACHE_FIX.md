# Cloudflare Cache Fix - Force New Version to Show

## What Was the Problem?

Two caching layers were preventing the new layout from showing:

1. **Service Worker Cache** - Was using version `v1` and missing `text-polisher.js`
2. **Cloudflare CDN Cache** - Cached the old HTML/CSS/JS files

## Fix Applied

✅ Updated service worker to version `v2`
✅ Added `text-polisher.js` to cached assets
✅ Pushed to GitHub (commit `d2c34a5`)

## Now Follow These Steps

### Step 1: Wait for Cloudflare Build (2-3 minutes)

Check your Cloudflare Pages dashboard:
- Build should show as "Success"
- Deployment should be "Active"

### Step 2: Purge Cloudflare Cache

**Option A - Purge Everything (Recommended):**
1. Go to Cloudflare Dashboard
2. Select your domain
3. Click **Caching** → **Configuration**
4. Click **"Purge Everything"**
5. Confirm

**Option B - Purge Specific URLs:**
1. Click **"Custom Purge"**
2. Select **"Purge by URL"**
3. Add these (replace with your domain):
```
https://yourdomain.com/
https://yourdomain.com/index.html
https://yourdomain.com/sw.js
https://yourdomain.com/src/css/main.css
https://yourdomain.com/src/js/ui-controller.js
https://yourdomain.com/src/js/text-polisher.js
https://yourdomain.com/src/js/app.js
```

### Step 3: Clear Browser Cache

**On your browser:**

1. Open your site
2. Open DevTools (F12)
3. Go to **Application** tab
4. Click **Service Workers** (left sidebar)
5. Click **"Unregister"** next to your service worker
6. Click **Storage** (left sidebar)
7. Click **"Clear site data"**
8. Close DevTools
9. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

**Or use Console:**
```javascript
// Paste in browser console (F12):
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  console.log('✅ Service workers cleared');
});

// Then:
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('✅ Cache cleared');
});

// Then hard refresh
location.reload(true);
```

### Step 4: Verify New Layout

You should now see:

```
┌─────────────────────────────────┐
│  实时                            │ ← Small gray label
│  点击下方按钮开始                │ ← Large text
├─────────────────────────────────┤
│  优化                            │ ← Small gray label
│  等待中...                       │ ← Large text (darker bg)
├─────────────────────────────────┤
│       ⚫ 开始                    │ ← Green button
│       准备就绪                   │ ← Status
└─────────────────────────────────┘
```

**Key changes:**
- ✅ Two sections instead of one
- ✅ No font size controls (A- / A+)
- ✅ No help button (?)
- ✅ No history section
- ✅ Cleaner, simpler interface

## Still Not Working?

### Check 1: Verify Build Deployed
```bash
# Check latest commit on GitHub
git log --oneline -1
# Should show: d2c34a5 Update service worker cache version...
```

### Check 2: Check Service Worker Version
1. Open your site
2. Open DevTools (F12)
3. Go to **Console** tab
4. Type: `caches.keys()`
5. Should show: `["voice-subtitle-v2"]` (not v1)

### Check 3: Verify Files Exist
Open these URLs directly (replace with your domain):
- `https://yourdomain.com/src/js/text-polisher.js` - Should load
- `https://yourdomain.com/sw.js` - Should show `v2` in the code

### Check 4: Try Incognito/Private Mode
- Opens without any cache
- If it works here, it's a cache issue
- Clear cache and try again

### Check 5: Check Browser Console for Errors
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red errors
4. Share any errors you see

## Cloudflare Cache Settings (Optional)

To prevent this in the future, you can adjust cache rules:

1. Go to **Caching** → **Configuration**
2. Set **Browser Cache TTL** to "Respect Existing Headers"
3. Add **Page Rules** for development:
   - URL: `yourdomain.com/*`
   - Setting: Cache Level = Bypass (for testing)
   - Remove after testing

## Testing Checklist

- [ ] Cloudflare build succeeded
- [ ] Cache purged in Cloudflare dashboard
- [ ] Service worker unregistered in browser
- [ ] Browser cache cleared
- [ ] Hard refresh performed
- [ ] New layout visible (two sections)
- [ ] No font controls visible
- [ ] Text polisher working (优化 section updates)

## Timeline

- **Commit pushed**: Now ✅
- **Cloudflare build**: 2-3 minutes
- **Cache purge**: Instant
- **Browser update**: After hard refresh

Total time: ~5 minutes from now

## Need Help?

If still not working after 10 minutes:
1. Share your domain URL
2. Share screenshot of what you see
3. Share browser console errors (F12 → Console)
4. Check Cloudflare build logs for errors
