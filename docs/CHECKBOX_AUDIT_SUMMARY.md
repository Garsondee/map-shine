# Checkbox Audit - Quick Reference

**Status:** 🔴 35+ broken checkboxes identified  
**Priority:** HIGH (user-facing functionality)  
**Effort:** 34 hours (5 days)

---

## The Problem

**Users uncheck enable/disable boxes but effects keep running.**

Example:
```
1. User unchecks "Enable Cloud Shadows" ✅
2. Config value changes to enabled: false ✅
3. CloudShadowsLayer._onAnimate() keeps rendering ❌
4. Effect still visible on screen ❌
```

---

## Root Cause

**Two failure patterns:**

### Pattern 1: MaskedEffectLayer (8 layers)
```javascript
_onAnimate(deltaTime) {
  if (this._destroyed) return;
  // ❌ MISSING: Check config.enabled flag
  // ... rendering code runs anyway
}
```

### Pattern 2: ParticleLayer
```javascript
async _draw(options) {
  // ❌ MISSING: Check config before creating controllers
  this.dustController = new ParticleEffectController(...);
  this.fireController = new ParticleEffectController(...);
  // Controllers created even when enabled: false
}
```

---

## Broken Checkboxes by Category

### Core Layers (14)
- baseShine.enabled
- cloudShadows.enabled
- canopy.enabled
- structuralShadows.enabled
- iridescence.enabled
- prism.enabled
- waterFX.enabled
- buildingShadows.enabled
- timeOfDay.enabled
- ambient.enabled
- groundGlow.enabled
- heatDistortion.enabled
- overheadEffect.enabled
- foam.enabled

### Particles (8)
- dust.enabled
- fire.enabled
- biofilm.enabled
- metallicGlints.enabled
- smellyFlies.enabled
- sparks.enabled
- glint.enabled
- steam.enabled

### Sub-Features (10+)
- fire.rotation.enabled
- fire.toneCurve.enabled
- fire.colorCorrection.enabled
- sparks.motionBlur.enabled
- steam.rotation.enabled
- glint.rgbSplit.enabled
- glint.rotation.enabled
- dust.rotation.enabled
- smellyFlies.motionBlur.enabled
- (and more...)

---

## Quick Fixes

### Fix 1: MaskedEffectLayer Base (2 hours)

**File:** `module.js` line ~23200

```javascript
class MaskedEffectLayer extends ResizableAnimatedCanvasLayer {
  _onAnimate(deltaTime) {
    if (this._destroyed) return;
    
    // ✅ ADD THIS
    const effectKey = this.options?.effectKey || this._effectKey;
    if (effectKey) {
      const config = game.mapShine.profileManager.activeConfig[effectKey];
      if (!config || config.enabled === false) return;
    }
    
    // ... existing code
  }
}
```

**Result:** Automatically fixes 8 layers

### Fix 2: Individual Layers (3 hours)

Add to each of 6 layers:

```javascript
_onAnimate(deltaTime) {
  if (this._destroyed) return;
  
  // ✅ ADD THIS
  const config = game.mapShine.profileManager.activeConfig.baseShine; // or groundGlow, etc.
  if (!config || !config.enabled) return;
  
  // ... existing code
}
```

### Fix 3: ParticleLayer (4 hours)

**File:** `module.js` lines 17100-17250

```javascript
async _draw(options) {
  await super._draw(options);
  
  const config = game.mapShine.profileManager.activeConfig;
  
  // ✅ CONDITIONAL CREATION
  if (config.dust?.enabled) {
    this.dustController = new ParticleEffectController(...);
  }
  
  if (config.fire?.enabled) {
    this.fireController = new ParticleEffectController(...);
  }
  // ... etc for all 8 particle types
}

_onAnimate(deltaTime) {
  if (this._destroyed) return;
  
  // ✅ NULL CHECKS
  this.dustController?.update(deltaTime);
  this.fireController?.update(deltaTime);
  // ... etc
}
```

---

## Master Disable Switch

### NEW: Top-Level Checkbox

**Location:** Very top of debugger UI, before all effects

**UI Code:**
```javascript
// Add to DebuggerUIBuilder._buildMainContent()
<div class="master-control-section" style="
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
  border: 2px solid #ff4444;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
">
  <div style="display: flex; align-items: center; gap: 12px;">
    <i class="fas fa-power-off" style="font-size: 24px; color: #ff4444;"></i>
    <div style="flex: 1;">
      <h3 style="color: #ff4444;">Master Control</h3>
      <p style="color: #aaa; font-size: 12px;">Disable all Map Shine effects</p>
    </div>
    <input type="checkbox" 
           id="control-master-enabled" 
           data-path="enabled" 
           checked>
    <label for="control-master-enabled" style="color: #ff4444; font-weight: bold;">
      ALL EFFECTS ENABLED
    </label>
  </div>
</div>
```

**Config Addition:**
```javascript
const MODULE_DEFAULTS = {
  enabled: true,  // ✅ NEW: Master toggle
  baseShine: { /* ... */ },
  // ... rest
};
```

**Enforcement:**
```javascript
// Add to ALL layers
_onAnimate(deltaTime) {
  if (this._destroyed) return;
  
  // ✅ Check master flag FIRST
  const config = game.mapShine.profileManager.activeConfig;
  if (config.enabled === false) return;
  
  // Then check individual flag
  if (!config.baseShine?.enabled) return;
  
  // ... render
}
```

---

## Implementation Order

1. **Master Disable Switch** (2 hours) - Huge user value
2. **MaskedEffectLayer Fix** (2 hours) - Fixes 8 layers instantly
3. **6 Direct Layers** (3 hours) - Individual fixes
4. **ParticleLayer** (4 hours) - Conditional creation
5. **Sub-Features** (2 hours) - Rotation, motion blur, etc.
6. **Testing** (2 hours) - Verify all 35+ checkboxes

**Total:** 15 hours (2 days) for core functionality

---

## Testing Command

```javascript
// Test a checkbox works
async function testCheckbox(path) {
  console.log(`Testing: ${path}`);
  
  // Disable
  await game.mapShine.profileManager.recordUserChange(path, false);
  await new Promise(r => setTimeout(r, 500));
  console.log('Effect should be INVISIBLE now - inspect visually');
  await new Promise(r => setTimeout(r, 3000));
  
  // Re-enable
  await game.mapShine.profileManager.recordUserChange(path, true);
  console.log('Effect should be VISIBLE again');
}

// Test all broken ones
const brokenCheckboxes = [
  'baseShine.enabled',
  'cloudShadows.enabled',
  'canopy.enabled',
  // ... all 35+
];

for (const path of brokenCheckboxes) {
  await testCheckbox(path);
}
```

---

## Success Criteria

- ✅ Unchecking any checkbox instantly disables that effect
- ✅ Re-checking instantly re-enables it
- ✅ Master disable switch turns off ALL effects
- ✅ Performance improves when effects disabled
- ✅ No visual regressions when enabled

---

## Next Steps

1. Review full audit: `docs/CHECKBOX_AUDIT.md`
2. Implement master disable switch first (quick win)
3. Fix MaskedEffectLayer base class (fixes 8 at once)
4. Test each fixed checkbox manually
5. Update documentation

---

**Full Documentation:** `docs/CHECKBOX_AUDIT.md` (8,000+ words)  
**Priority:** 🔴 HIGH  
**Risk:** 🟢 LOW (isolated changes)  
**User Impact:** 🟢 HIGH (broken functionality fixed)
