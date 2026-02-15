# Simplified State Machine

## Problem Solved
The app was getting stuck showing "Stop" button but not actually listening. This happened because:
- Multiple state flags (`app.isListening`, `service.isListening`, `service.isTransitioning`) could get out of sync
- Errors during transitions left the system in inconsistent states
- No automatic recovery mechanism

## Solution: Single Source of Truth

### One State Variable
```javascript
// ONLY this matters - everything else derives from it
this._state = 'stopped' | 'starting' | 'listening' | 'stopping'
```

### State Transitions
```
stopped ──start()──> starting ──success──> listening
                         │
                         └──error──> stopped (auto-recovery)

listening ──stop()──> stopping ──success──> stopped
                         │
                         └──error──> stopped (auto-recovery)
```

### Auto-Recovery Rules

**Rule 1: Stuck in Transition?**
```javascript
if (state === 'starting' || state === 'stopping') {
  forceReset(); // Back to 'stopped'
}
```

**Rule 2: Any Error?**
```javascript
catch (error) {
  this._state = 'stopped'; // Always reset
}
```

**Rule 3: Timeout Protection**
```javascript
// Start timeout: 10 seconds
// Stop timeout: 5 seconds
// After timeout → force to 'stopped'
```

## Key Features

### 1. Single State Check
```javascript
// UI always checks service state directly
if (this.speechService.isListening) {
  // Update UI
}

// Button state matches service state
this.ui.updateButton(this.speechService.isListening);
```

### 2. Automatic Recovery
```javascript
// If stuck, force reset
forceReset() {
  this._state = 'stopped';
  // Clean up everything
  // Next operation gets fresh start
}
```

### 3. Idempotent Operations
```javascript
// Safe to call multiple times
start() {
  if (state === 'listening') return; // Already there
  if (state === 'starting') forceReset(); // Stuck? Fix it
  // ... proceed
}

stop() {
  if (state === 'stopped') return; // Already there
  if (state === 'stopping') forceReset(); // Stuck? Fix it
  // ... proceed
}
```

### 4. Error Always Resets
```javascript
try {
  // Do operation
} catch (error) {
  this._state = 'stopped'; // ALWAYS
  throw error;
}
```

## State Properties

```javascript
// Read-only properties derived from state
get isListening() {
  return this._state === 'listening';
}

get isBusy() {
  return this._state === 'starting' || this._state === 'stopping';
}
```

## UI Synchronization

```javascript
// UI always reflects actual service state
toggleListening() {
  if (service.isBusy) return; // Ignore clicks during transition
  
  if (service.isListening) {
    stop();
  } else {
    start();
  }
}
```

## Recovery Scenarios

### Scenario 1: Stuck Showing "Stop" But Not Listening
**Before**: State desync - UI thinks listening, service thinks stopped
**After**: UI checks `service.isListening` directly - always in sync

### Scenario 2: Click Stop → Error → Stuck
**Before**: Error leaves state as 'stopping', next click fails
**After**: Error forces state to 'stopped', next click works

### Scenario 3: Rapid Clicking
**Before**: Multiple operations overlap, state corrupted
**After**: `isBusy` check blocks clicks during transitions

### Scenario 4: Start Timeout
**Before**: Hangs forever in 'starting' state
**After**: 10-second timeout forces back to 'stopped'

## Testing

### Test 1: Stuck State Recovery
```javascript
// Manually corrupt state
service._state = 'starting';

// Try to start
await service.start();
// ✓ Auto-detects stuck state
// ✓ Calls forceReset()
// ✓ Proceeds with fresh start
```

### Test 2: Error Recovery
```javascript
// Cause an error during start
await service.start(); // Fails

// Try again
await service.start();
// ✓ State was reset to 'stopped'
// ✓ Fresh start succeeds
```

### Test 3: Rapid Clicks
```javascript
// Click start 5 times rapidly
for (let i = 0; i < 5; i++) {
  app.toggleListening();
}
// ✓ Only first click processes
// ✓ Others blocked by isBusy check
// ✓ No state corruption
```

## Debugging

Check state at any time:
```javascript
console.log(app.speechService.state);
// 'stopped', 'starting', 'listening', or 'stopping'

console.log(app.speechService.getHealthStatus());
// {
//   state: 'listening',
//   hasTranscriber: true,
//   sessionMinutes: 3,
//   ...
// }
```

Force recovery if needed:
```javascript
app.speechService.forceReset();
// Immediately returns to 'stopped' state
// Cleans up all resources
```

## Summary

**Before**: 3 state flags, complex sync logic, easy to break
**After**: 1 state variable, automatic recovery, impossible to break

**Key Principle**: When in doubt, reset to 'stopped'. Always recoverable.
