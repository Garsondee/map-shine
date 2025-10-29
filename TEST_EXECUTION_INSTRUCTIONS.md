# Test Execution Instructions

## How to Run the Comprehensive Test Sequence

### Method 1: Browser Console (Recommended)

1. **Load Foundry VTT** with your world
2. **Wait for Map Shine to fully initialize** (~10 seconds after scene loads)
3. **Open Browser Console** (F12)
4. **Copy and paste** the entire contents of `tests/run-comprehensive-test.js`
5. **Press Enter** - tests will run automatically

**Expected Duration:** ~75 seconds total
- Phase 1: Quick Health (~2s)
- Phase 2: Memory Leaks (~30s)
- Phase 3: Performance (~30s)
- Phase 4: Shaders (~3s)

### Method 2: Direct Function Call

If you've already loaded the script:

```javascript
await runComprehensiveTests()
```

### Method 3: Simpler Quick Tests

For faster validation, run individual validators:

```javascript
// Quick health check (instant)
console.log('Map Shine:', !!game.mapShine);
console.log('Canvas:', !!canvas.ready);

// Memory snapshot (instant)
const { MemoryLeakDetector } = await import('./tests/validators/MemoryLeakDetector.js');
const snapshot = MemoryLeakDetector.takeSnapshot('quick');
console.log('Pool Active:', snapshot.poolActiveTextures); // Should be 0
console.log('Emitters:', snapshot.particleEmitters);

// Shader validation (instant)
const { ShaderValidator } = await import('./tests/validators/ShaderValidator.js');
const shaderResults = ShaderValidator.validateAllShaders();
console.log('Shaders:', shaderResults);

// Performance (30s)
const { PerformanceValidator } = await import('./tests/validators/PerformanceValidator.js');
const perf = await PerformanceValidator.monitorPerformance(30000);
console.log('FPS:', perf.avgFPS.toFixed(2));
```

---

## Interpreting Results

### ✅ Success Indicators

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
```

**What this means:**
- No memory leaks detected
- Performance within acceptable thresholds
- All shaders compiled successfully
- System is healthy

### 🟡 Warnings (Non-Critical)

```
⚠️  Performance warnings:
   - Frame time variance 12.45ms indicates stuttering
   - Pool cache hit rate 85.3% below 90.0%
```

**What to do:**
- Investigate stuttering causes (check for expensive operations)
- Review pool usage patterns if cache hit rate is low
- Monitor but not critical for production

### 🔴 Failures (Critical)

```
❌ Failed:    3

Phase 2: Memory Leak Detection
   ❌ Pool has 2 unreleased textures (LEAK!)
   
Phase 3: Performance Monitoring
   ❌ Performance issues detected:
      - Average FPS 27.34 below threshold 30
      
Phase 4: Shader Validation
   ❌ Failed Shaders:
      - MetallicShineFilter:
         ❌ Texture "u_normalMap" has null baseTexture
```

**What to do:**
- **Pool leaks:** Check for missing try-finally blocks in code that uses RenderTexturePool
- **Low FPS:** Profile with browser DevTools, check for expensive operations
- **Shader errors:** Fix null texture bindings, add validation

---

## Exporting the Report

After tests complete, the report is saved to `window.mapShineTestReport`.

### Export to JSON

```javascript
// In browser console
copy(JSON.stringify(window.mapShineTestReport, null, 2))
```

Then paste into a file: `test-report-YYYY-MM-DD.json`

### Export to Console

The full report is already printed to console. To save:
1. Right-click in console
2. Select "Save as..."
3. Save as: `test-console-output.txt`

---

## What Gets Tested

### Phase 1: Quick Health Check
- ✅ Map Shine loaded
- ✅ Canvas ready
- ✅ All managers initialized

### Phase 2: Memory Leak Detection
- ✅ Initial memory snapshot
- ✅ RenderTexturePool has no active textures
- ✅ Layer destruction flags correct
- ✅ Scene transition doesn't leak (if 2+ scenes)
- ✅ Effect toggle doesn't leak

### Phase 3: Performance Monitoring
- ✅ Average FPS ≥ 30
- ✅ Frame time ≤ 33.33ms
- ✅ Frame variance ≤ 10ms (stuttering)
- ✅ VRAM growth ≤ 50MB
- ✅ Pool cache hit rate ≥ 90%

### Phase 4: Shader Validation
- ✅ All 14+ shaders compile
- ✅ No undefined uniforms
- ✅ No null baseTexture bindings
- ✅ No GL errors
- ✅ No runtime shader errors

---

## Troubleshooting

### "Failed to import validator"

The validators may not be in the correct path. Check:
```javascript
// Test if files exist
console.log('Memory:', await import('./tests/validators/MemoryLeakDetector.js'));
console.log('Perf:', await import('./tests/validators/PerformanceValidator.js'));
console.log('Shader:', await import('./tests/validators/ShaderValidator.js'));
```

### "Game not ready"

Wait for:
- Foundry to fully load
- World to load
- Scene to render
- Map Shine to initialize (check console for "Map Shine | Initialized")

### Performance test hangs

If the performance monitor hangs, refresh the page. The ticker callback may not have been removed.

### Scene transition test skipped

You need at least 2 scenes in your world for the scene transition test. Create another scene or skip this test.

---

## Automated CI/CD Testing

For headless CI/CD:

```bash
# Set environment variable
export MAP_SHINE_TEST_MODE=true

# Run headless Foundry
node "C:\Program Files\Foundry Virtual Tabletop\resources\app\main.js" \
  --headless \
  --world=map-development-world

# Exit code: 0 = pass, 1 = fail
```

---

## Next Steps After Testing

### If All Tests Pass ✅
- Document baseline metrics
- Commit changes
- Deploy with confidence

### If Tests Fail ❌
1. Review detailed reports
2. Fix identified issues
3. Re-run tests
4. Compare before/after metrics

### If Warnings Present 🟡
1. Monitor in production
2. Investigate performance issues
3. Consider optimization
4. Re-test after changes

---

## Report Storage

Reports are automatically saved to:
- **Memory:** `window.mapShineTestReport` (JSON object)
- **Console:** Full output with colors and formatting

To keep reports:
1. Export JSON with `copy()` command
2. Save console output as text file
3. Create dated report files: `test-report-2025-10-26.json`

---

## Contact & Support

For issues with the testing system:
- Check `docs/SELF_TESTING_COMMANDS.md`
- Review `docs/TESTING_QUICK_START.md`
- See validator source: `tests/validators/`
