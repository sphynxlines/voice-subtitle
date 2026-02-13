# PWA Help Button Fix

## Problem
When the app is installed as a PWA (Progressive Web App), clicking the help button (?) didn't open the help page. This is because PWAs run in standalone mode, and regular `<a>` links don't behave the same way as in a browser.

## Solution Implemented

### 1. Main App (index.html + app.js)
Changed the help link from a static `<a>` tag to a button with JavaScript handler:

**Before:**
```html
<a href="/help.html" class="help-link">?</a>
```

**After:**
```html
<button class="help-link" onclick="window.app.openHelp()">?</button>
```

**JavaScript Handler (app.js):**
```javascript
openHelp() {
  vibrate();
  
  // Check if running as PWA
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;
  
  if (isPWA) {
    // In PWA mode, open in new window/tab
    window.open('/help.html', '_blank', 'noopener,noreferrer');
  } else {
    // In browser mode, navigate normally
    window.location.href = '/help.html';
  }
}
```

### 2. Help Page (help.html)
Changed the back button to handle both browser and PWA modes:

**Before:**
```html
<a href="/" class="back-link">← 返回</a>
```

**After:**
```html
<button class="back-link" onclick="goBack()">← 返回</button>
```

**JavaScript Handler:**
```javascript
function goBack() {
  const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true;
  
  if (isPWA) {
    // In PWA mode, close window if opened from main app
    if (window.opener) {
      window.close();
    } else {
      window.location.href = '/';
    }
  } else {
    // In browser mode, use history or navigate to home
    if (document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }
}
```

### 3. CSS Updates
Updated styles to work with `<button>` elements instead of `<a>` tags:

**main.css:**
- Removed `text-decoration: none` from `.help-link`
- Kept all other button styles

**help.css:**
- Added button-specific styles (border: none, background: transparent, etc.)
- Added `font-family: inherit` to match body font
- Added `cursor: pointer` for better UX

## How It Works

### In Browser Mode:
1. Click help button → navigates to /help.html
2. Click back button → uses browser history or navigates to /

### In PWA Mode:
1. Click help button → opens /help.html in a new window
2. Click back button → closes the help window (returns to main app)

### Detection Method:
```javascript
const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
              window.navigator.standalone === true;
```

This checks:
- `display-mode: standalone` - Works on Android and modern browsers
- `window.navigator.standalone` - Works on iOS Safari

## Benefits

1. **Works in both modes**: Browser and PWA
2. **Better UX in PWA**: Opens help in new window, easy to close
3. **Maintains functionality**: All existing features work as expected
4. **Accessible**: Buttons have proper ARIA labels
5. **Consistent styling**: Looks the same as before

## Testing Checklist

- [ ] Browser mode: Help button opens help page
- [ ] Browser mode: Back button returns to main page
- [ ] PWA mode (Android): Help button opens in new window
- [ ] PWA mode (Android): Back button closes help window
- [ ] PWA mode (iOS): Help button opens in new window
- [ ] PWA mode (iOS): Back button closes help window
- [ ] Styling looks correct in both modes
- [ ] Vibration feedback works on help button click
