# Standby Mode - Quick Implementation Guide

**Priority:** 🔴 HIGH - Significant performance waste identified  
**Effort:** 2-3 weeks  
**Risk:** Low (no impact on full-featured scenes)

---

## The Problem in One Sentence

**Map Shine initializes 43 systems and runs 15+ animation loops in blank scenes with zero effect maps, wasting 5.5ms per frame and 74MB VRAM.**

---

## The Solution in One Sentence

**Add a `StandbyModeManager` that analyzes discovered textures and only activates systems that have something to render.**

---

## Critical Offenders (Priority Order)

### 1. DynamicTokenMaskManager ⚠️ HIGHEST PRIORITY
**File:** `module.js` lines 10517-10688  
**Problem:** Renders token silhouettes every 30 frames even when NO particles exist  
**Cost:** 0.3ms/30f + 2MB VRAM + 3 hooks  
**Fix:** Only initialize if particle effects with `useTokenOcclusion` are enabled

```javascript
// Current: ALWAYS initializes
await this.safeInitializeManager('DynamicTokenMaskManager', async () => {
  game.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas);
}, this.CRITICALITY.OPTIONAL);

// Fixed: Conditional initialization
const needsTokenMask = standbyMode.shouldActivate('DynamicTokenMaskManager');
if (needsTokenMask) {
  await this.safeInitializeManager('DynamicTokenMaskManager', async () => {
    game.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas);
  }, this.CRITICALITY.OPTIONAL);
}
```

### 2. WeatherSystemManager ⚠️ HIGH PRIORITY
**File:** `module.js` lines 14411-15500  
**Problem:** Compiles weather shaders and creates layers even when weather disabled  
**Cost:** 1.2ms + 8MB VRAM  
**Fix:** Only initialize if `config.weather.enabled === true`

```javascript
// Add to activation rules
this.activationConditions.set('WeatherSystemManager', () => {
  const config = game.mapShine.profileManager.activeConfig;
  return config.weather?.enabled === true;
});
```

### 3. LightMaskManager ⚠️ HIGH PRIORITY
**File:** `module.js` lines 5909-6079  
**Problem:** Creates 12MB of render textures even when no effects need light masking  
**Cost:** 0ms (event-driven) + 12MB VRAM + 7 hooks  
**Fix:** Only initialize if _Specular or _Iridescence textures found

```javascript
this.activationConditions.set('LightMaskManager', () => {
  return this.availableTextures.has('specular') ||
         this.availableTextures.has('iridescence');
});
```

### 4. All MaskedEffectLayers (8 layers) ⚠️ MODERATE PRIORITY
**Files:** Various, lines 23117-34900  
**Problem:** Each layer runs `_onAnimate()` even without textures  
**Cost:** 1.5ms total + 24MB VRAM  
**Fix:** Add dormancy check in `_draw()` method

```javascript
async _draw(options) {
  await super._draw(options);
  
  const standbyMode = game.mapShine.standbyMode;
  if (!standbyMode.shouldActivate(this.constructor.name)) {
    this._dormant = true;
    console.log(`${this.constructor.name} | Entering dormant mode (no textures)`);
    return; // Skip all initialization
  }
  
  // Normal initialization...
}
```

---

## Implementation Steps

### Step 1: Create StandbyModeManager (2-3 hours)
**New File:** `scripts/core/StandbyModeManager.js`

Key methods:
- `analyzeScene()` - Discover available textures
- `shouldActivate(systemName)` - Check activation conditions
- `activateSystem(name, initFn)` - Lazy initialization
- `getStatus()` - Diagnostic info

### Step 2: Integrate into MapShineLifecycle (1-2 hours)
**File:** `scripts/module.js` lines 8377-8736

Changes to `runFullSetup()`:
1. Create StandbyModeManager instance
2. Call `analyzeScene()` after discovery
3. Wrap conditional systems in `standbyMode.activateSystem()`
4. Add console logging for standby decisions

### Step 3: Add Layer Dormancy (4-6 hours)
**Files:** All 19 canvas layers

For each layer:
1. Add `_dormant = false` flag
2. Check `shouldActivate()` in `_draw()`
3. Return early if dormant
4. Guard `_onAnimate()` with dormancy check
5. Implement `_wakeFromDormancy()` method

### Step 4: Testing & Validation (2-3 hours)
- Test blank scene (verify systems stay dormant)
- Test minimal scene (verify selective activation)
- Test full scene (verify no performance regression)
- Test dynamic activation (enable effect at runtime)

---

## Activation Rules Reference

```javascript
// System -> Condition
'LightMaskManager' -> Has specular OR iridescence textures
'MetallicShineLayer' -> Has specular texture
'CloudShadowsLayer' -> Has outdoors texture
'CanopyLayer' -> Has canopy texture
'StructuralShadowsLayer' -> Has structural texture
'IridescenceLayer' -> Has iridescence texture
'PrismLayer' -> Has prism texture
'WaterFXLayer' -> Has water texture
'BuildingShadowsLayer' -> Has outdoors texture
'ParticleLayer' -> Any particle effect enabled
'WeatherSystemManager' -> config.weather.enabled === true
'DynamicTokenMaskManager' -> Particles with token occlusion enabled
'WindManager' -> Particles OR weather OR ropes active
'GeometryMaskManager' -> Custom masks discovered
```

---

## Expected Results

### Blank Scene (No Textures)
- ✅ Frame cost: 5.5ms → **0.5ms** (91% reduction)
- ✅ VRAM usage: 74MB → **8MB** (89% reduction)
- ✅ Active systems: 43 → **6** (86% reduction)

### Minimal Scene (3 Effects)
- ✅ Frame cost: 5.5ms → **2.5ms** (55% reduction)
- ✅ VRAM usage: 74MB → **32MB** (57% reduction)

### Full Scene (All Effects)
- ✅ Frame cost: **5.5ms** (0% change - no regression!)
- ✅ VRAM usage: **74MB** (0% change - no regression!)

---

## Quick Win: Disable DynamicTokenMaskManager (30 minutes)

For immediate relief, add this check to `runFullSetup()`:

```javascript
// Line ~8671 in module.js
// BEFORE:
await this.safeInitializeManager('DynamicTokenMaskManager', async () => {
  game.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas);
}, this.CRITICALITY.OPTIONAL);

// AFTER:
const config = game.mapShine.profileManager.activeConfig;
const particleEffects = ['dust', 'fire', 'biofilm', 'metallicGlints'];
const needsTokenMask = particleEffects.some(effectKey => {
  const effectConfig = config[effectKey];
  return effectConfig?.enabled && effectConfig?.useTokenOcclusion;
});

if (needsTokenMask) {
  await this.safeInitializeManager('DynamicTokenMaskManager', async () => {
    game.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas);
  }, this.CRITICALITY.OPTIONAL);
} else {
  console.log('Map Shine | DynamicTokenMaskManager staying dormant (no particle occlusion needed)');
}
```

**Impact:** Saves 0.3ms/30f + 2MB VRAM in most scenes (particles rarely use token occlusion)

---

## Diagnostic Commands

```javascript
// View standby status
game.mapShine.standbyMode?.getStatus()

// Check specific layer
canvas.layers.find(l => l.constructor.name === 'MetallicShineLayer')?._dormant

// Force wake a dormant layer
const layer = canvas.layers.find(l => l.constructor.name === 'ParticleLayer');
await layer._wakeFromDormancy();
```

---

## Timeline

- **Week 1:** Core infrastructure + token mask quick win
- **Week 2:** Manager conditional init (Weather, Light, Wind)
- **Week 3:** Layer dormancy system
- **Week 4:** Testing + documentation

**Total:** 2-3 weeks for complete implementation

---

## Feature Flag Strategy

```javascript
// Add to module settings
game.settings.register(MODULE_ID, "enable-standby-mode", {
  name: "⚡ Enable Standby Mode (Experimental)",
  hint: "Automatically disables systems in scenes without effect maps. Improves performance in minimal scenes. Disable if you experience issues.",
  scope: "world",
  config: true,
  type: Boolean,
  default: false, // Safe default for v1.2.11
  requiresReload: true
});

// Check in runFullSetup()
const standbyModeEnabled = game.settings.get(MODULE_ID, "enable-standby-mode");
if (standbyModeEnabled) {
  game.mapShine.standbyMode = new StandbyModeManager();
  game.mapShine.standbyMode.analyzeScene();
}
```

**Rollout Plan:**
- v1.2.11: Feature flag OFF by default (opt-in testing)
- v1.2.12: Feature flag ON by default after 2 weeks testing
- v1.3.0: Remove flag, always enabled (if no issues)

---

## Success Criteria

- ✅ Blank scene loads in < 2 seconds (vs ~8 seconds currently)
- ✅ Blank scene uses < 10MB Map Shine VRAM
- ✅ Frame budget in blank scene < 1ms for Map Shine
- ✅ Zero visual regressions in full-featured scenes
- ✅ Zero user-reported bugs after 1 week opt-in testing

---

## Next Actions

1. **Review audit:** Read `STANDBY_MODE_AUDIT.md` for full technical details
2. **Quick win:** Implement DynamicTokenMaskManager conditional init (30 min)
3. **Create branch:** `feature/standby-mode-optimization`
4. **Week 1 work:** Build StandbyModeManager core infrastructure
5. **Test continuously:** Profile every change with blank/minimal/full scenes
