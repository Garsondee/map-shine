# DebuggerEventHandler Binding Error Fix

## Issue
Fatal error when opening Material Editor (Advanced Mode):
```
Uncaught (in promise) TypeError: can't access property "bind", this._onTimeChanged is undefined
at DebuggerEventHandler module.js:41070
```

## Root Cause
The `DebuggerEventHandler` constructor was trying to bind a non-existent method `_onTimeChanged` at line 41070. The `destroy()` method was also trying to unhook this non-existent listener at line 45035.

This appears to be leftover code from a refactor - there's a similar method `_onTimeControlChanged` that exists and uses the `_lastTimeChangedUpdate` property for throttling.

## Solution

### Changes Made

**1. Removed broken binding in constructor (line 41070):**
```javascript
// BEFORE (BROKEN):
this._onTimeChangedBound = this._onTimeChanged.bind(this);
this._lastTimeChangedUpdate = 0; // Throttle time-based UI updates

// AFTER (FIXED):
this._lastTimeChangedUpdate = 0; // Throttle time-based UI updates
```

**2. Removed broken unhook in destroy() method (line 45035):**
```javascript
// BEFORE (BROKEN):
destroy() {
  // Remove the global hook listener
  Hooks.off("mapShine:timeChanged", this._onTimeChangedBound);
  // ... rest of cleanup
}

// AFTER (FIXED):
destroy() {
  // Destroy the UI clock component if it exists
  // ... cleanup code (no broken hook removal)
}
```

## Why This Happened
The method `_onTimeChanged` was likely renamed to `_onTimeControlChanged` during development, but the binding and unhook calls were not updated. The `_lastTimeChangedUpdate` property is still used by `_onTimeControlChanged` for throttling time-based UI updates.

## Testing
- ✅ Syntax check passed: `node --check .\scripts\module.js`
- Material Editor should now open without errors
- Time control functionality preserved through `_onTimeControlChanged` method

## Files Modified
- `scripts/module.js` - Lines 41070 and 45035

## Related Code
- `_onTimeControlChanged()` method (line 42637) - Uses `_lastTimeChangedUpdate` for throttling
- `_lastTimeChangedUpdate` property - Still needed and preserved
