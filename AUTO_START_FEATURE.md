# Auto-Start Feature

## Overview

The app now automatically starts listening when:
1. Microphone permission is already granted
2. User has auto-start enabled (default: ON)
3. App is opened or refreshed

## How It Works

### Permission Detection
```javascript
// Uses Permissions API to check microphone status
const permissionStatus = await navigator.permissions.query({ name: 'microphone' });

if (permissionStatus.state === 'granted') {
  // Auto-start after 500ms delay
  setTimeout(() => this.start(), 500);
}
```

### Permission States
- **granted**: Auto-start immediately (if enabled)
- **prompt**: Show "点击「开始」按钮使用"
- **denied**: Show "需要麦克风权限"

### User Preference
Users can toggle auto-start in Settings (⚙️ button):
- Default: **Enabled**
- Stored in localStorage
- Persists across sessions

## User Experience

### First Time User
1. Opens app
2. Sees "点击「开始」按钮使用"
3. Clicks start button
4. Grants microphone permission
5. Next time: Auto-starts immediately ✨

### Returning User (Permission Granted)
1. Opens app
2. Sees "🎤 自动启动中..."
3. Starts listening automatically (500ms delay)
4. No button click needed ✨

### User Who Disabled Auto-Start
1. Opens app
2. Sees "准备就绪"
3. Must click start button manually

## Settings Modal

### Access
Click the ⚙️ (settings) button in the control area

### Options
- **自动开始监听**: Toggle auto-start on/off
  - Description: "如果已授予麦克风权限，打开应用时自动开始监听"

### Controls
- Close with × button
- Close with ESC key
- Close by clicking outside modal

## Implementation Details

### Files Modified

1. **index.html**
   - Added settings button (⚙️)
   - Added settings modal HTML

2. **src/js/app.js**
   - Added `checkPermissionAndAutoStart()` method
   - Added `toggleSettings()` method
   - Added `toggleAutoStart()` method
   - Added permission change listener
   - Added `autoStartAttempted` flag to prevent multiple attempts

3. **src/js/config.js**
   - Added `AUTO_START` storage key

4. **src/css/main.css**
   - Added settings modal styles
   - Added checkbox styles
   - Added setting item styles

### Storage Key
```javascript
CONFIG.STORAGE_KEYS.AUTO_START = 'auto_start_enabled'
```

### Default Value
```javascript
const autoStartEnabled = storage.get(CONFIG.STORAGE_KEYS.AUTO_START, true);
// Default: true (enabled)
```

## Browser Compatibility

### Permissions API Support
- ✅ Chrome 43+
- ✅ Edge 79+
- ✅ Firefox 46+
- ✅ Safari 16+ (iOS 16+)
- ⚠️ Older browsers: Falls back gracefully (no auto-start)

### Fallback Behavior
If Permissions API is not available:
- Shows "准备就绪"
- User must click start button
- No error shown to user

## Edge Cases Handled

### 1. Permission Denied
- Shows "需要麦克风权限"
- Does not attempt auto-start
- User must grant permission manually

### 2. Network Offline
- Auto-start checks network status
- Shows network error if offline
- Does not start listening

### 3. Multiple Auto-Start Attempts
- `autoStartAttempted` flag prevents duplicate starts
- Only attempts once per session

### 4. Permission Changed During Session
- Listens for permission changes
- Auto-starts if permission granted while app is open
- Only if auto-start is enabled

### 5. User Stops Manually
- Does not auto-restart
- Respects user's stop action
- Only auto-starts on app open/refresh

## Benefits

### For Users
1. **Faster workflow**: No need to click start every time
2. **Better UX**: App is ready immediately
3. **Flexible**: Can disable if preferred
4. **Transparent**: Clear status messages

### For Accessibility
1. **Reduces clicks**: Helpful for motor impairments
2. **Faster access**: Important for urgent communication
3. **Predictable**: Consistent behavior

## Testing Checklist

- [ ] First time: Prompts for permission
- [ ] Permission granted: Auto-starts on next open
- [ ] Permission denied: Shows error, no auto-start
- [ ] Auto-start disabled: Doesn't auto-start
- [ ] Settings toggle: Saves preference
- [ ] Settings modal: Opens and closes properly
- [ ] ESC key: Closes settings modal
- [ ] Click outside: Closes settings modal
- [ ] Network offline: Doesn't auto-start
- [ ] Permission changed: Auto-starts if enabled
- [ ] Multiple opens: Doesn't duplicate starts

## Future Enhancements

Possible improvements:
1. Add "Remember my choice" option on first permission prompt
2. Add notification when auto-start is disabled
3. Add analytics to track auto-start usage
4. Add more settings options (language, theme, etc.)
5. Add keyboard shortcut to toggle auto-start

## User Feedback

Expected positive feedback:
- "太方便了！不用每次都点开始"
- "打开就能用，很快"
- "省了很多时间"

Expected questions:
- "怎么关闭自动开始？" → Settings (⚙️) button
- "为什么没有自动开始？" → Check microphone permission

## Privacy & Security

- **No data collection**: Permission status not sent to server
- **Local storage only**: Preference stored locally
- **User control**: Can disable anytime
- **Transparent**: Clear status messages
- **Secure**: Uses standard Permissions API
