# Profiler Fix & Solo Mode Implementation

## Summary
Fixed critical issue where profiler wasn't actually disabling effects during testing, and added Solo Mode profiling to measure isolated effect impact.

## Issues Fixed

### 1. Effects Weren't Being Disabled ❌ → ✅
**Problem:** `MaskedEffectLayer` and subclasses checked `effectKey` but layers didn't set it.

**Root Cause:**
```javascript
// MaskedEffectLayer._onAnimate() checked:
const effectKey = this.options?.effectKey;  // ← undefined!
if (effectKey && config[effectKey]?.enabled === false) return;
```

**Solution:** Added `effectKey` to all 8 `MaskedEffectLayer` subclasses:
- ✅ CloudShadowsLayer → `effectKey: "cloudShadows"`
- ✅ CanopyLayer → `effectKey: "canopy"`
- ✅ StructuralShadowsLayer → `effectKey: "structuralShadows"`
- ✅ IridescenceLayer → `effectKey: "iridescence"`
- ✅ PrismLayer → `effectKey: "prism"`
- ✅ WaterFXLayer → `effectKey: "waterFX"`
- ✅ BuildingShadowsLayer → `effectKey: "buildingShadows"`
- ✅ TimeOfDayLayer → `effectKey: "timeOfDay"`

**Now:** Effects properly disable when `config[effectKey].enabled = false`

---

## New Feature: Solo Mode Profiling 🆕

### Two Profiling Approaches

#### 1. **DISABLED Mode** (Original)
- Measures improvement when **disabling each effect**
- Baseline: All effects enabled
- Test: Disable one effect, measure FPS gain
- **Use case:** "What do I gain by turning this off?"

#### 2. **SOLO Mode** (New)
- Measures cost of **each effect in isolation**
- Baseline: All effects disabled
- Test: Enable one effect alone, measure FPS cost
- **Use case:** "What's the true cost of this single effect?"

### Implementation

**EffectProfiler.js:**
```javascript
static async profileCurrentScene(options = {}) {
  const soloMode = options.soloMode || false;
  
  if (soloMode) {
    // Disable all effects for baseline
    for (const effect of discovery.enabledEffects) {
      await this._toggleEffect(effect.path, false);
    }
    
    // Test each effect solo
    for (const effect of discovery.enabledEffects) {
      await this._toggleEffect(effect.path, true);  // Enable ONLY this one
      const measurement = await PerformanceValidator.monitorPerformance(...);
      await this._toggleEffect(effect.path, false); // Disable again
    }
  } else {
    // Normal: Baseline with all enabled
    // Test by disabling each one
  }
}
```

**Test Suite:**
- Test 1: **Disabled Mode** - `profileCurrentScene()` (default)
- Test 2: **Solo Mode** - `profileCurrentScene({ soloMode: true })`
- Test 3: **Multi-Scene** - Tests across multiple scenes

---

## Why Both Modes Matter

### Disabled Mode Results:
```
Baseline: 60 FPS (all effects on)
Without CloudShadows: 62 FPS (+2 FPS, +3.3%)
```
**Problem:** Effect interactions muddy the water. Is the 2 FPS from CloudShadows alone, or from it + other effects working together?

### Solo Mode Results:
```
Baseline: 120 FPS (no effects)
With CloudShadows solo: 80 FPS (-40 FPS, -33%)
```
**Clarity:** CloudShadows ALONE costs 40 FPS. Pure, isolated impact.

### Combined Analysis:
- **Solo Mode:** True standalone cost
- **Disabled Mode:** Benefit in production environment
- **Gap between them:** Effect interaction/overhead

---

## Testing

### Run All Tests:
```powershell
npx playwright test tests\playwright\effect-profiling.spec.js --config=playwright-headed.config.js --workers=1
```

### Run Specific Mode:
```powershell
# Disabled mode only
npx playwright test tests\playwright\effect-profiling.spec.js --config=playwright-headed.config.js --workers=1 --grep "DISABLED mode"

# Solo mode only
npx playwright test tests\playwright\effect-profiling.spec.js --config=playwright-headed.config.js --workers=1 --grep "SOLO MODE"
```

---

## Files Modified

1. **scripts/module.js** (8 edits)
   - Added `effectKey` to 8 layer constructors

2. **tests/validators/EffectProfiler.js** (major refactor)
   - Added `soloMode` parameter
   - Dual profiling logic
   - Updated result structure

3. **tests/playwright/effect-profiling.spec.js** (3 tests)
   - Test 1: Disabled mode profiling
   - Test 2: Solo mode profiling (NEW)
   - Test 3: Multi-scene profiling

---

## Expected Output

### Disabled Mode Report:
```
🎯 TOP 5 PERFORMANCE BOTTLENECKS:
   1. Cloud Shadows
      FPS Delta: +2.50 FPS
      Improvement: +4.2%
      Impact: MODERATE
```

### Solo Mode Report:
```
💰 TOP 5 MOST EXPENSIVE EFFECTS (Solo):
   1. Cloud Shadows
      FPS Cost: 35.00 FPS
      % Impact: 42.0%
      Frame Time: 8.33ms
```

---

## Status
✅ Effects now properly disable during profiling
✅ Solo mode implemented and tested
✅ Both profiling approaches available
✅ Ready for production testing
