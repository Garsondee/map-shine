# Lazy Accordion Testing Guide

## Quick Start

1. **Reload Foundry VTT** (press `Ctrl+F5` to clear cache)
2. **Open a scene** and enable the Map Shine module
3. **Open the Map Shine Editor** (token controls toolbar)
4. **Open the browser console** (F12)

## Performance Testing

### Step 1: Verify Lazy Loading is Active
```javascript
MapShineLazyAccordions.printReport()
```

**Expected Output:**
```
╔════════════════════════════════════════════╗
║   Lazy Accordion Performance Report       ║
╠════════════════════════════════════════════╣
║ Registered Accordions:              273   ║
║ Currently Open:                       0   ║
║ Current DOM Elements:              ~500   ║  ← Should be around 500
║ Expected Idle DOM:                 ~500   ║
║ Original DOM Count:               ~6862   ║
║ DOM Reduction:                     ~92%   ║  ← Should be 90%+
╚════════════════════════════════════════════╝
```

### Step 2: Check FPS Before Opening Accordions
- Look at the FPS counter (if you have one)
- Or use Chrome DevTools Performance tab
- **Expected:** ~100 FPS (or close to your normal canvas FPS)

### Step 3: Open 3-5 Accordions
- Click on different accordion sections (Weather System, Bloom, etc.)
- Watch the FPS counter
- Run `MapShineLazyAccordions.printReport()` again

**Expected:**
- FPS should stay above 90
- "Currently Open" should show 3-5
- "Current DOM Elements" should be ~600-700 (not thousands)

### Step 4: Test Accordion Content
- Adjust sliders in opened accordions
- Toggle checkboxes
- Use color pickers
- Change dropdown values

**Expected:**
- All controls should work normally
- Settings should apply to the map
- No console errors

### Step 5: Close Accordions
- Click to close the accordions
- Run `MapShineLazyAccordions.printReport()` again

**Expected:**
- DOM elements should drop back to ~500
- FPS should return to ~100

### Step 6: Test Re-render
- Open 2-3 accordions
- Click a profile button or trigger a UI re-render
- Check if accordions stay open with correct content

**Expected:**
- Open accordions should remain open
- Content should be preserved
- No console errors

## Diagnostic Commands

### Get Current Stats
```javascript
MapShineLazyAccordions.getStats()
```
Returns:
```javascript
{
  registered: 273,        // Total accordions managed
  injected: 3,           // Currently open accordions
  domElements: 575,      // Total DOM elements in UI
  cached: 273            // Cached content generators
}
```

### List All Accordions
```javascript
MapShineLazyAccordions.listAccordions()
```
Shows all registered accordions and their states:
```
Registered Accordions:
  weather: closed (stripped)
  bloom: OPEN (content in DOM)
  chromaticAberration: closed (stripped)
  ...
```

### Monitor DOM Changes in Real-Time
```javascript
// Before opening an accordion
let before = MapShineLazyAccordions.getStats();

// Open accordion...

// After opening
let after = MapShineLazyAccordions.getStats();
console.log(`DOM elements added: ${after.domElements - before.domElements}`);
```

## Chrome DevTools Performance Profiling

### Record Baseline Performance
1. Open Chrome DevTools (F12)
2. Go to "Performance" tab
3. Click "Record" (red circle)
4. Wait 5 seconds with UI visible (no accordions open)
5. Click "Stop"
6. Look at the FPS graph and frames timeline

### Record With Accordions Open
1. Open 5 accordions
2. Start recording
3. Wait 5 seconds
4. Stop recording
5. Compare FPS to baseline

**Expected:**
- FPS should stay above 90 in both tests
- No long tasks or janky frames
- Minimal style recalculation overhead

## Troubleshooting

### Issue: Controls Don't Work in Opened Accordions
**Cause:** Event listeners not being rebound after content injection

**Fix:** Check console for errors, verify `rebindDynamicControls()` is being called

### Issue: High DOM Element Count
**Cause:** Accordions not being stripped properly

**Debug:**
```javascript
// Check how many details elements exist
document.querySelectorAll('details').length

// Check how many have data-lazy attribute
document.querySelectorAll('details[data-lazy="true"]').length

// Check how many are open
document.querySelectorAll('details[open]').length
```

### Issue: Content Doesn't Update After Re-render
**Cause:** Content cache not being refreshed

**Debug:**
```javascript
// Check if setupLazyAccordions is being called
// Look for console log: "LazyAccordionManager | Starting accordion conversion..."
```

### Issue: Memory Leak
**Cause:** Event listeners not being cleaned up

**Test:**
1. Open Chrome DevTools Memory tab
2. Take heap snapshot
3. Open/close accordions 20 times
4. Take another heap snapshot
5. Compare - look for growing detached DOM nodes

## Success Criteria

- ✅ FPS stays above 90 with UI open (idle)
- ✅ FPS stays above 80 with 5 accordions open
- ✅ DOM element count is ~500 when idle
- ✅ DOM element count is <1000 with 5 accordions open
- ✅ All controls work in opened accordions
- ✅ No console errors
- ✅ No memory leaks after repeated open/close

## Reporting Results

After testing, please report:
1. **FPS with UI closed:** ___ FPS
2. **FPS with UI open (idle):** ___ FPS
3. **FPS with 5 accordions open:** ___ FPS
4. **DOM element count (idle):** ___
5. **DOM element count (5 open):** ___
6. **Any issues encountered:** ___

You can get exact numbers by running:
```javascript
console.log('=== Performance Report ===');
console.log('FPS:', game.canvas.app.ticker.FPS.toFixed(0));
MapShineLazyAccordions.printReport();
```
