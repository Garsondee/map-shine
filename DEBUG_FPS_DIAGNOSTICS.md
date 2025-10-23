# FPS Diagnostics - UI Performance Investigation

## Problem
UI open: 20 FPS
UI closed: 110 FPS
**82% FPS drop when debugger is visible**

## CSS Fixes Already Applied ✅
- Removed `backdrop-filter: blur()` (4 instances)
- Removed `filter: brightness/saturate/grayscale` from accordions
- Removed `drop-shadow` filters
- Removed infinite `pulseLogo` animation

## Remaining Suspects (JavaScript)

### 1. **`_updateColumnWidths()` - HIGHEST SUSPECT** 🔴
**Location:** Lines 40676-40680, called in `requestAnimationFrame`
**Why:** Called EVERY time render() is called, which happens on:
- Initial open
- Profile changes
- Map points updates
- User interactions

**Diagnostic:** Temporarily disable this call

### 2. **Throttled UI Updates** 🟡
**Location:** Lines 16091-16108 in `ParticleLayer._onAnimate`
**Why:** Updates DOM every N frames even when throttled
- `updateParticleCount()`
- `updateZoomDisplay()`
- `updateWeatherDiagnostics()`

**Already has check:** Only runs if UI visible

### 3. **`rebindDynamicControls()`** 🟡
**Location:** Line 40673 in `MaterialEditorDebugger.render()`
**Why:** Re-attaches event listeners on every render, could be expensive

### 4. **ResizeObserver** 🟢
**Location:** Lines 40755-40772
**Why:** Debounced to 200ms, unlikely culprit but possible

### 5. **Combat Effect UI Updates** 🟢
**Location:** Lines 7283-7294 in `CombatEffectManager._updateEffects`
**Why:** Updates slider value during combat transitions

## Quick Tests

### Test 1: Disable Column Width Calculation
```javascript
// In MaterialEditorDebugger.render() around line 40676
// Comment out:
/*
requestAnimationFrame(() => {
  if (this.eventHandler) {
    this.eventHandler._updateColumnWidths();
  }
});
*/
```

### Test 2: Disable Throttled UI Updates
```javascript
// In ParticleLayer._onAnimate() around line 16097
// Change condition:
if (false && game.mapShine.debugger?.eventHandler...) {
```

### Test 3: Disable rebindDynamicControls
```javascript
// In MaterialEditorDebugger.render() around line 40673
// Comment out:
// this.eventHandler.rebindDynamicControls();
```

## Expected Results

If **Test 1** fixes it → Column width calculation is forcing layout reflow
If **Test 2** fixes it → DOM updates are the issue (even throttled)
If **Test 3** fixes it → Event listener rebinding is expensive

## Tools

### Browser DevTools Performance Profile
1. Open debugger → FPS drops to 20
2. Open Chrome DevTools → Performance tab
3. Click Record
4. Wait 3 seconds
5. Stop recording
6. Look for:
   - Long "Rendering" tasks
   - "Layout" or "Recalculate Style" spikes
   - JavaScript execution time

### Console Commands
```javascript
// Check how many DOM elements are in the debugger
game.mapShine.debugger?.element.querySelectorAll('*').length

// Force a render and time it
console.time('render');
game.mapShine.debugger?.render();
console.timeEnd('render');

// Check ResizeObserver
game.mapShine.debugger.resizeObserver
```
