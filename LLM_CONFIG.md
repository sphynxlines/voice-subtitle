# LLM Summarization Configuration

## Current Status: DISABLED

The LLM summarization feature is currently disabled due to API issues. The app works perfectly without it - you'll still get real-time transcription and history.

## Common Issues

### 403 Forbidden Error

**Symptom**: "总结生成失败: 服务器错误" with 403 status

**Cause**: Your Groq API key is invalid, expired, or revoked

**Solution**:
1. Go to https://console.groq.com/keys
2. Generate a new API key
3. Update your `.dev.vars` file:
   ```
   GROQ_API_KEY=your_new_api_key_here
   ```
4. Restart `npm run dev`
5. Enable summarization in `src/js/config.js`:
   ```javascript
   ENABLE_SUMMARY: true
   ```

### 504 Timeout Error

**Symptom**: Request times out after 45 seconds

**Cause**: Slow network connection or Groq API is slow

**Solution**: The timeout has been increased to 45s and we're using the faster `llama-3.1-8b-instant` model. If still timing out, keep summarization disabled.

## Testing Your API Key

Run this command to test if your Groq API key works:

```bash
node test-groq.js
```

This will show:
- ✅ If the API key is valid
- ⏱️ Response time
- 📝 A test response

## How to Disable LLM Summarization

Edit `src/js/config.js` and change:

```javascript
FEATURES: {
  ENABLE_SUMMARY: false  // Change from true to false
}
```

### What This Does

When `ENABLE_SUMMARY` is set to `false`:
- No summary will be generated when you stop recording
- The app will skip the "正在生成对话总结..." loading state
- No API calls will be made to `/api/summarize`
- The conversation history will still be saved and displayed

### Error Handling Improvements

Even with summarization enabled, the following improvements have been added:

1. **Timeout Protection**: 45-50 second timeouts to prevent infinite loops
2. **Better Error Messages**: User-friendly Chinese error messages for common issues
3. **Graceful Degradation**: If summarization fails, the app continues working normally
4. **Rate Limit Handling**: Proper handling of API rate limits (429 errors)
5. **Service Unavailable**: Handles 500/503 errors from Groq API gracefully
6. **Faster Model**: Using `llama-3.1-8b-instant` for quicker responses

### Common Issues

**Issue**: "总结生成失败: 服务器错误"
- **Cause**: Groq API returned 500 error
- **Solution**: Disable summarization or wait and try again

**Issue**: "总结请求超时"
- **Cause**: API call took longer than 50 seconds
- **Solution**: Disable summarization or check your network connection

**Issue**: "Groq API key forbidden"
- **Cause**: API key expired or revoked
- **Solution**: Generate new API key at https://console.groq.com/keys

**Issue**: Infinite loop on stop
- **Cause**: API call never completes
- **Solution**: Now fixed with timeout protection, or disable summarization

### Testing

After changing the config:
1. Clear browser cache or force reload (Cmd+Shift+R / Ctrl+Shift+R)
2. Test by recording a short conversation and stopping
3. Verify no summary is shown (if disabled) or summary works (if enabled)

### Re-enabling

To re-enable summarization later:

1. Make sure you have a valid Groq API key in `.dev.vars`
2. Test it with `node test-groq.js`
3. Change config to:
   ```javascript
   FEATURES: {
     ENABLE_SUMMARY: true
   }
   ```
4. Restart the dev server
