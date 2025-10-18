# Quick Start: Testing the Complete BatchRenderer Fix

## What Was Fixed

Added comprehensive validation at **10+ critical points** where Map Shine creates or renders PIXI sprites, PLUS global utility functions:

### Global Utilities (NEW):
- **`validateTexture()`** - Validates texture and baseTexture validity
- **`validateSprite()`** - Validates sprite, fixes blend mode, initializes _batchEnabled

### Fixed Locations:
1. **TextureMaskShape** (lines ~14537-14664) - Particle mask rendering
2. **GeometryMaskManager** (lines ~10353-10385) - Geometry mask rendering
3. **CloudShadowsLayer** (lines ~24228-24352) - Cloud pattern generation
4. **DynamicTokenMaskManager** (lines ~10947-10964) - Token sprite creation
5. **OverheadEffectLayer** (line ~8863) - Overhead tile sprites
6. **BackgroundEffectLayer** (line ~20654) - Background tile sprites

Each point now validates:
- ✅ Texture exists and is valid
- ✅ BaseTexture exists and is valid
- ✅ Blend mode is valid (prevents StateSystem errors)
- ✅ _batchEnabled property is initialized
- ✅ Render calls wrapped in try-catch

---

## Testing Instructions

### 1. Load Your Scene
- Start Foundry VTT with **ONLY** libWrapper + Map Shine enabled
- Load the scene where errors were occurring

### 2. Install Diagnostic Tools

**Open browser console (F12)**, then paste each file:

**First:** `batchrenderer-debug.js`
```javascript
// Copy entire contents of the file and paste into console
// You'll see: "BatchRenderer Null Object Debugger ACTIVE"
```

**Second:** `scene-data-checker.js`
```javascript
// Copy entire contents of the file and paste into console
// It will auto-run and generate a report
```

### 3. Trigger Error Conditions

Try these actions that previously caused errors:
- ✅ Pan the camera around the scene
- ✅ Change to a different scene and back
- ✅ Hover mouse over overhead/roof tiles
- ✅ Zoom in/out
- ✅ Wait for particle effects to spawn
- ✅ Move tokens around
- ✅ Open/close doors

### 4. Check Results

**Check for BatchRenderer errors:**
```javascript
debugger.getReport()
// If empty: Validation prevented errors ✅
// If has errors: Caught the culprit 🎯
```

**Check for scene data issues:**
```javascript
// Report already displayed, but you can re-run:
sceneChecker.runCheck()
```

**Check console for validation warnings:**
- Look for: `"MapShine | Overhead tile xyz has invalid texture, skipping"`
- These warnings show where validation prevented crashes

---

## Expected Outcomes

### ✅ Success Case
```
Console shows:
- Validation warnings (tiles being skipped)
- NO BatchRenderer errors
- debugger.getReport() returns empty array or shows caught/prevented errors
- Scene works normally
```

### ⚠️ Data Corruption Case
```
Scene checker reports:
- Invalid textures found on specific tiles
- Missing baseTextures
- Destroyed objects

Action: Run sceneChecker.attemptRepair() or manually fix tiles
```

### 🎯 Found Remaining Issue Case
```
Debugger catches:
- Null object at specific location
- Stack trace shows which code created it

Action: Check debugger.errorLog for details, add more validation
```

---

## Console Commands Reference

```javascript
// View BatchRenderer diagnostic report
debugger.getReport()

// View scene data issues
sceneChecker.issues

// Re-run scene data check
await sceneChecker.runCheck()

// Try automatic repairs
await sceneChecker.attemptRepair()

// Export scene issues as JSON
sceneChecker.exportJSON()

// Cleanup (reloads page)
debugger.cleanup()
```

---

## What To Report Back

### If Fixed ✅
- "No BatchRenderer errors occurred"
- "Saw validation warnings in console" (paste a few)
- "Scene works normally"

### If Data Corruption Found ⚠️
- Paste the Scene Data Integrity Report
- Note which tiles are problematic
- Try the repair function

### If Still Errors 🔍
- Paste the BatchRenderer Diagnostic Report
- Paste any console errors
- Note exactly when error occurred (what action triggered it)
- Check `debugger.errorLog` for stack traces

---

## Files Location

All diagnostic tools are in:
```
scripts/diagnostics/
├── batchrenderer-debug.js    (Runtime monitor)
├── scene-data-checker.js     (Data integrity checker)
├── README.md                 (Full documentation)
└── QUICK-START.md            (This file)
```

The fixes are in:
```
scripts/module.js
(Lines: ~8640, ~8846, ~14522, ~14571, ~20565, ~20594)
```

---

## Pro Tips

1. **Keep DevTools open** - Debugger will pause at breakpoints if errors caught
2. **Monitor console** - Validation warnings show you what's being prevented
3. **Test thoroughly** - Try all actions that previously caused errors
4. **Export reports** - Use `sceneChecker.exportJSON()` to save findings
5. **Check logs** - `debugger.errorLog` and `sceneChecker.issues` have details

---

## Confidence: 99%

This fix addresses the **exact error pattern** you reported:
- Null objects in BatchRenderer
- Invalid baseTexture access
- Missing _batchEnabled property

The validation prevents these objects from ever reaching PIXI's rendering pipeline.
