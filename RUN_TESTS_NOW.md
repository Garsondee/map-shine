# 🚀 Run Tests Now - Quick Start

## What You Need to Do

### Step 1: Load Foundry VTT
1. Start Foundry VTT
2. Load your development world (map-development-world)
3. Wait for scene to fully load (~10 seconds)
4. Confirm Map Shine initialized (check console for "Map Shine | Initialized")

### Step 2: Open Browser Console
Press **F12** to open Developer Tools

### Step 3: Run Test Script

**Option A - Copy/Paste Full Script:**
1. Open file: `tests/run-comprehensive-test.js`
2. Copy entire contents
3. Paste into console
4. Press Enter

**Option B - Import and Run:**
```javascript
const testScript = await import('./tests/run-comprehensive-test.js');
```

**Option C - Quick Individual Tests:**
```javascript
// Memory check (instant)
const { MemoryLeakDetector } = await import('./tests/validators/MemoryLeakDetector.js');
const snapshot = MemoryLeakDetector.takeSnapshot('now');
console.log('Pool Active:', snapshot.poolActiveTextures); // Should be 0

// Shader check (instant)
const { ShaderValidator } = await import('./tests/validators/ShaderValidator.js');
const shaders = ShaderValidator.validateAllShaders();
console.log(`Shaders: ${shaders.passed}/${shaders.total} passed`);

// Performance (30s)
const { PerformanceValidator } = await import('./tests/validators/PerformanceValidator.js');
const perf = await PerformanceValidator.monitorPerformance(30000);
console.log(`FPS: ${perf.avgFPS.toFixed(2)}`);
```

---

## What Will Happen

### Timeline (~75 seconds total)

```
0:00 - Phase 1: Quick Health Check (2s)
       ✅ Checking Map Shine loaded
       ✅ Checking managers initialized
       
0:02 - Phase 2: Memory Leak Detection (30s)
       📸 Taking memory snapshot
       🔍 Checking RenderTexturePool
       🔍 Checking layer destruction flags
       🔄 Testing scene transitions
       🔄 Testing effect toggles
       
0:32 - Phase 3: Performance Monitor (30s)
       📊 Measuring FPS
       📊 Tracking frame times
       📊 Detecting stutters
       📊 Monitoring VRAM
       
1:02 - Phase 4: Shader Validation (3s)
       🎨 Validating shader compilation
       🎨 Checking uniforms
       🎨 Checking texture bindings
       
1:05 - COMPLETE ✅
       📋 Results printed to console
       💾 Report saved to window.mapShineTestReport
```

---

## Expected Results

### ✅ Ideal Output

```
═══════════════════════════════════════════════════════════════════════════════
    TEST SUMMARY
═══════════════════════════════════════════════════════════════════════════════
Total Tests:  8
✅ Passed:    8
❌ Failed:    0
⚠️  Warnings:  0
⏱️  Duration:  68.3s
📊 Status:    ✅ ALL PASSED
═══════════════════════════════════════════════════════════════════════════════
```

### Key Metrics to Watch

**Memory:**
- Pool Active Textures: **0** (anything > 0 is a leak)
- Texture Cache: Should be stable
- Emitters: Should match expected count

**Performance:**
- Average FPS: **≥ 30** (ideally 60+)
- Frame Variance: **< 10ms** (low = smooth)
- Stutter Events: **0-2** (acceptable), **5+** (investigate)
- VRAM Growth: **< 50MB** over 30 seconds

**Shaders:**
- Passed: **All shaders** should compile
- Failed: **0** (any failure is critical)
- Warnings: A few warnings OK, many = investigate

---

## After Tests Complete

### Export the Report

```javascript
// Copy report to clipboard
copy(JSON.stringify(window.mapShineTestReport, null, 2))
```

Paste into a new file: `test-reports/test-report-2025-10-26.json`

### Review Detailed Output

Scroll up in console to see:
- Detailed metrics for each phase
- Any error messages
- Performance breakdowns
- Shader validation details

### Share Results

If sharing with others:
1. Export JSON report
2. Save console output as text
3. Include:
   - Foundry version
   - Map Shine version
   - Browser (Chrome/Firefox/Edge)
   - OS (Windows/Mac/Linux)
   - Any errors or warnings

---

## Common Issues & Fixes

### "MemoryLeakDetector is not defined"

**Cause:** Validators not loaded
**Fix:**
```javascript
// Import manually first
const { MemoryLeakDetector } = await import('./tests/validators/MemoryLeakDetector.js');
const { PerformanceValidator } = await import('./tests/validators/PerformanceValidator.js');
const { ShaderValidator } = await import('./tests/validators/ShaderValidator.js');
```

### "Pool has 2 unreleased textures"

**Cause:** Memory leak - textures not released
**Fix:** Check code for missing try-finally around pool usage

### "Average FPS 27.34 below threshold 30"

**Cause:** Performance issue
**Fix:** 
- Check for expensive operations in _onAnimate
- Profile with browser DevTools
- Disable effects one by one to isolate

### "Shader compilation failed"

**Cause:** Shader syntax error or missing uniform
**Fix:** Check shader source, add missing uniforms

### Scene transition test skipped

**Cause:** Only 1 scene in world
**Fix:** Create second scene or accept skip (not critical)

---

## What to Do Next

### If All Tests Pass ✅

1. **Document baseline:**
   ```javascript
   // Save this for comparison
   const baseline = window.mapShineTestReport;
   ```

2. **Commit changes** with confidence
3. **Deploy** knowing system is healthy

### If Tests Fail ❌

1. **Review error details** in console
2. **Check detailed reports:**
   ```javascript
   MemoryLeakDetector.generateReport()
   PerformanceValidator.generateReport()
   ShaderValidator.generateReport()
   ```
3. **Fix issues** identified
4. **Re-run tests** to confirm fixes

### If Warnings Present 🟡

1. **Monitor** but don't block deployment
2. **Investigate** performance issues
3. **Consider optimization** but not critical
4. **Document** for future reference

---

## Need Help?

**Documentation:**
- `TEST_EXECUTION_INSTRUCTIONS.md` - Detailed instructions
- `docs/TESTING_QUICK_START.md` - Quick reference
- `docs/SELF_TESTING_COMMANDS.md` - All commands

**Validator Source:**
- `tests/validators/MemoryLeakDetector.js`
- `tests/validators/PerformanceValidator.js`
- `tests/validators/ShaderValidator.js`

---

## Ready? Let's Go! 🚀

1. Open Foundry VTT
2. Press F12
3. Copy/paste test script
4. Wait ~75 seconds
5. Review results
6. Export report

**That's it!** The tests will run automatically and give you a complete health report.
