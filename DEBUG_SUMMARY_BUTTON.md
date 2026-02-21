# Debug Summary Button

## Quick Checklist

### 1. Feature Enabled?
```javascript
// src/js/config.js
ENABLE_SUMMARY: true  // ✅ Must be true
```

### 2. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Clear Browser Cache
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

### 4. Test Flow
```
1. Click "开始"
2. Speak at least one sentence
3. Wait for final transcription (not gray/recognizing)
4. Click "停止"
5. Check console logs
```

---

## Console Logs to Check

### When Starting
```
[APP START] Begin
[APP START] Success
```

### When Speaking (Final Text)
```
[TRANSCRIPT] Added: { speaker: 'A', text: '你好', total: 1 }
[TRANSCRIPT] Added: { speaker: 'B', text: '你好', total: 2 }
```

### When Stopping
```
[APP STOP] Begin
[SUMMARY BUTTON] Called
[SUMMARY BUTTON] Feature enabled: true
[SUMMARY BUTTON] Transcript length: 2
[SUMMARY BUTTON] Transcript: [{...}, {...}]
[SUMMARY] Showing summary button for 2 items
[SUMMARY BUTTON] Click handler attached
[APP STOP] Success
```

---

## Common Issues

### Issue 1: No Transcript Added

**Symptom:**
```
[SUMMARY BUTTON] Transcript length: 0
[SUMMARY] No transcript to summarize
```

**Cause:** 
- Text is still in "recognizing" state (gray)
- Not waiting for final transcription

**Solution:**
- Wait 1-2 seconds after speaking
- Look for text to turn from gray to white
- Then click "停止"

### Issue 2: Feature Disabled

**Symptom:**
```
[SUMMARY BUTTON] Feature enabled: false
[SUMMARY] Feature disabled in config
```

**Solution:**
```javascript
// src/js/config.js
ENABLE_SUMMARY: true  // Change to true
```

Then restart dev server.

### Issue 3: Button Not Showing

**Symptom:**
- No button appears
- No console logs

**Possible Causes:**

1. **Cache not cleared**
   - Solution: Hard reload (Ctrl+Shift+R)

2. **Service worker not updated**
   - Solution: 
     - DevTools → Application → Service Workers
     - Click "Unregister"
     - Refresh page

3. **JavaScript error**
   - Solution: Check console for errors

---

## Step-by-Step Debug

### Step 1: Check Config
```bash
# Run this to verify configuration
npm run test-provider
```

Should show:
```
✅ Configuration valid: Using Groq (or SiliconFlow)
```

### Step 2: Start Dev Server
```bash
npm run dev
```

### Step 3: Open Browser Console
```
1. Open http://localhost:8000
2. Press F12 (DevTools)
3. Go to Console tab
4. Clear console (Ctrl+L)
```

### Step 4: Test Recording
```
1. Click "开始"
2. Check console for: [APP START] Success
3. Speak: "你好"
4. Wait 2 seconds
5. Check console for: [TRANSCRIPT] Added
6. Speak: "今天天气很好"
7. Wait 2 seconds
8. Check console for: [TRANSCRIPT] Added (total: 2)
```

### Step 5: Stop and Check
```
1. Click "停止"
2. Check console logs:
   - [APP STOP] Begin
   - [SUMMARY BUTTON] Called
   - [SUMMARY BUTTON] Feature enabled: true
   - [SUMMARY BUTTON] Transcript length: 2
   - [SUMMARY] Showing summary button for 2 items
3. Look for button on screen
```

### Step 6: If Button Appears
```
1. Click "📝 生成对话总结"
2. Check console for:
   - [SUMMARY] Generating summary for 2 items
   - [SUMMARIZE] Using provider: Groq
   - [REGION] Data center: ...
3. Wait for summary to appear
```

---

## Manual Testing

If automatic testing doesn't work, try manual console commands:

### 1. Check if UI Controller Exists
```javascript
// In browser console
window.app.ui
// Should show UIController object
```

### 2. Check Transcript
```javascript
window.app.ui.transcript
// Should show array of transcript items
```

### 3. Manually Trigger Button
```javascript
window.app.ui.showSummaryButton()
// Should show button if transcript has items
```

### 4. Check Feature Flag
```javascript
window.app.ui.constructor.name
// Should be "UIController"

// Check config
import('./src/js/config.js').then(m => console.log(m.CONFIG.FEATURES))
// Should show ENABLE_SUMMARY: true
```

---

## Expected Behavior

### Correct Flow:

1. **Start:** Click "开始"
   - Status: "🎤 正在听..."
   - Subtitle: "正在听..."

2. **Speak:** Say something
   - Subtitle shows gray text (recognizing)
   - After 1-2 seconds, turns white (final)
   - Console: `[TRANSCRIPT] Added`

3. **Stop:** Click "停止"
   - Status: "已停止"
   - Console: `[SUMMARY BUTTON] Called`
   - Button appears: "📝 生成对话总结"

4. **Generate:** Click button
   - Shows: "📝 正在生成对话总结..."
   - Console: `[SUMMARIZE] Using provider: ...`
   - Shows summary with "🔄 重新生成" button

---

## Quick Fixes

### Fix 1: Force Enable Feature
```javascript
// In browser console
window.app.ui.transcript = [
  { speaker: 'A', text: '测试', timestamp: Date.now() },
  { speaker: 'B', text: '测试2', timestamp: Date.now() }
];
window.app.ui.showSummaryButton();
```

### Fix 2: Clear Everything
```bash
# Stop server
# Delete node_modules/.cache (if exists)
# Restart
npm run dev
```

### Fix 3: Check Network
```
DevTools → Network tab
Look for:
- /api/token (should be 200)
- /api/summarize (when clicking button)
```

---

## Still Not Working?

### Collect Debug Info

1. **Console logs:**
   - Copy all console output
   - Look for errors (red text)

2. **Network tab:**
   - Check if /api/summarize is called
   - Check response status

3. **Config:**
   ```bash
   cat src/js/config.js | grep ENABLE_SUMMARY
   cat .dev.vars | grep AI_PROVIDER
   ```

4. **Browser:**
   - Which browser? (Chrome, Firefox, Safari)
   - Version?
   - Any extensions blocking?

### Share This Info

If still having issues, share:
- Console logs
- Network tab screenshot
- Config values
- Browser info

