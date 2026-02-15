# Dual Display Feature - Real-time + Polished Subtitles

## Overview
Split-screen display showing both raw real-time transcription and cleaned/polished version simultaneously.

## Layout Changes

### Before:
```
┌─────────────────────────────────┐
│                                  │
│     Large Subtitle Area          │
│                                  │
├─────────────────────────────────┤
│  Button | Font | Help | History │
└─────────────────────────────────┘
```

### After:
```
┌─────────────────────────────────┐
│  实时 (Real-time)                │
│  A: 嗯...那个...我觉得...        │ ← Raw, instant
├─────────────────────────────────┤
│  优化 (Polished)                 │
│  A: 我觉得这个方案很好           │ ← Cleaned, 500ms delay
├─────────────────────────────────┤
│       Button | Status            │
└─────────────────────────────────┘
```

## Features

### 1. Real-time Display (Top Half)
- Shows raw transcription instantly
- No processing delay
- Includes all filler words and repetitions
- Gray text while recognizing
- Scrollable for long text

### 2. Polished Display (Bottom Half)
- Shows cleaned version with 500ms delay
- Removes filler words automatically
- Removes repetitions
- Better punctuation
- Scrollable for long text

### 3. Simplified Controls
- Removed: Font size controls, Help button, History
- Kept: Start/Stop button, Status indicator
- Cleaner, mobile-friendly interface
- More space for subtitles

## Text Polishing Rules

### Client-Side Processing (No LLM)
Fast, instant, no API calls needed:

1. **Remove Filler Words**
   - Chinese: 嗯, 啊, 呃, 额, 哦, 那个, 这个, 就是, 然后
   - Pattern matching with context awareness

2. **Remove Repetitions**
   - Same word appearing 2+ times in a row
   - Example: "我我我觉得" → "我觉得"

3. **Clean Punctuation**
   - Remove repeated punctuation: "。。。" → "。"
   - Fix spacing around punctuation
   - Trim excessive spaces

4. **Buffer Management**
   - Keeps last 10 text items in buffer
   - Combines last 3 items for context
   - Updates every 500ms after new text

### Why No LLM?
- **Latency**: LLM would add 1-3 seconds delay
- **Cost**: API calls for every sentence
- **Complexity**: Need backend service
- **Unnecessary**: Simple rules work well for this use case

## Technical Implementation

### TextPolisher Class
```javascript
// Fast client-side text cleaning
class TextPolisher {
  - addText(speaker, text)     // Add to buffer
  - polish()                    // Clean and return
  - cleanText(text)             // Apply rules
  - reset()                     // Clear buffer
}
```

### Update Flow
```
Speech Recognition
    ↓
Raw Text → Display Immediately (Top)
    ↓
Add to Buffer
    ↓
Wait 500ms (debounced)
    ↓
Polish Text → Display (Bottom)
```

### Performance
- Buffer size: Last 10 items
- Context window: Last 3 items
- Update delay: 500ms (debounced)
- Processing time: < 5ms per update
- Memory usage: Minimal (~1KB)

## Mobile Optimization

### Responsive Design
- Font size: 36px on desktop, 28px on mobile
- Button size: 100px on desktop, 80px on mobile
- Equal space for both subtitle areas
- Both areas independently scrollable
- Touch-friendly controls

### Space Efficiency
- Removed unnecessary controls
- 50/50 split for subtitles
- Compact status bar
- No wasted space

## User Experience

### Benefits
1. **See what's happening NOW** - Real-time display
2. **Read cleaned version** - Polished display
3. **No waiting** - Instant raw text
4. **Better readability** - Cleaned text easier to read
5. **Mobile-friendly** - Simplified interface

### Use Cases
- **Presentations**: Show polished version to audience
- **Note-taking**: Copy from polished version
- **Real-time monitoring**: Watch raw version
- **Long conversations**: Both versions scrollable

## Configuration

### Filler Words (Customizable)
Edit `src/js/text-polisher.js`:
```javascript
this.fillerWords = [
  '嗯', '啊', '呃', '额', '哦',
  '那个', '这个', '就是', '然后',
  // Add more as needed
];
```

### Polish Delay (Customizable)
Edit `src/js/ui-controller.js`:
```javascript
// Change 500ms to desired delay
this.polishTimer = setTimeout(() => {
  // ...
}, 500);
```

### Buffer Size (Customizable)
Edit `src/js/text-polisher.js`:
```javascript
// Keep last 10 items (change as needed)
if (this.buffer.length > 10) {
  this.buffer.shift();
}
```

## Future Enhancements

### Possible Additions
1. **Toggle button** - Switch between dual/single display
2. **Font size control** - Per-display font adjustment
3. **Export polished text** - Copy/download cleaned version
4. **Custom filler words** - User-defined word list
5. **LLM option** - Optional AI polishing (with latency warning)

### Not Recommended
- ❌ LLM for real-time (too slow)
- ❌ Complex NLP (overkill)
- ❌ Server-side processing (adds latency)

## Testing

### Test Scenarios
1. **Rapid speech** - Both displays update correctly
2. **Filler words** - Removed in polished version
3. **Repetitions** - Cleaned in polished version
4. **Long text** - Both areas scroll independently
5. **Mobile view** - Layout adapts properly

### Expected Behavior
- Raw text: Instant, shows everything
- Polished text: 500ms delay, cleaned up
- No lag or freezing
- Smooth scrolling
- Clean state transitions

## Summary

Simple, effective dual-display solution:
- ✅ No LLM needed
- ✅ No latency concerns
- ✅ Mobile-friendly
- ✅ Easy to customize
- ✅ Scrollable displays
- ✅ Clean interface

Perfect for live conversation transcription with automatic text cleanup.
