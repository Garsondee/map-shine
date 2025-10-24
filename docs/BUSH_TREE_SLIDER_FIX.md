# Bush & Tree Slider Fix

## Problem
UI sliders for `_Bush` and `_Tree` effects were not updating the visual effects. Users could change slider values but the distortion effects on bush/tree tiles remained unchanged.

## Root Causes

### 1. Missing from ProfileManager CONFIG_SYSTEM_MAP
**Location:** `scripts/managers/ProfileManager.js` lines 10-44

**Issue:** Bush and tree effects were not registered in the `CONFIG_SYSTEM_MAP`, which tells ProfileManager how to route configuration updates to the correct systems.

**Result:** When sliders changed, the system fell back to `updateAllSystemsFromConfig()` but this wasn't enough because...

### 2. updateFromConfig() Didn't Update Filter Uniforms
**Locations:**
- `BushLayer.updateFromConfig()` - module.js line 27772
- `TreeLayer.updateFromConfig()` - module.js line 27939

**Issue:** Both methods only called `_findAndApplyFilters()` which rescans for new tiles but **doesn't update the shader uniforms on existing filters**.

**Code Before:**
```javascript
async updateFromConfig(config) {
  // Re-scan for tiles in case new ones were added
  this._findAndApplyFilters();
}
```

This meant:
- New filters created from initial scan got correct values
- Existing filters kept their original values forever
- Slider changes had no effect on already-created filters

### 3. Filter Updates Only Happened in _onAnimate
The filter uniforms were being updated in `_onAnimate()` every frame, but this reads from `game.mapShine.profileManager.activeConfig` which was already updated. The problem was that `updateFromConfig()` wasn't forcing a refresh.

## The Fix

### 1. Added to CONFIG_SYSTEM_MAP
**File:** `scripts/managers/ProfileManager.js`

```javascript
bush: { type: 'layer', layerClass: 'BushLayer' },
tree: { type: 'layer', layerClass: 'TreeLayer' },
```

Now ProfileManager knows to call `updateFromConfig()` on these layers when their configuration changes.

### 2. Updated BushLayer.updateFromConfig()
**File:** `scripts/module.js` lines 27772-27797

```javascript
async updateFromConfig(config) {
  // Re-scan for tiles in case new ones were added
  this._findAndApplyFilters();
  
  // Update existing filter uniforms with new config values
  const bushConfig = config.bush;
  if (!bushConfig) return;
  
  for (const filter of this.affectedTiles.values()) {
    // Update rustle layer
    filter.uniforms.u_rustleScale = bushConfig.rustleScale;
    filter.uniforms.u_rustleSpeed = bushConfig.rustleSpeed;
    filter.uniforms.u_rustleFrequency = bushConfig.rustleFrequency;
    filter.uniforms.u_rustleIntensity = bushConfig.rustleIntensity;
    
    // Update sway layer
    filter.uniforms.u_swayScale = bushConfig.swayScale;
    filter.uniforms.u_swaySpeed = bushConfig.swaySpeed;
    filter.uniforms.u_swayFrequency = bushConfig.swayFrequency;
    filter.uniforms.u_swayIntensity = bushConfig.swayIntensity;
    filter.uniforms.u_swayWindMultiplier = bushConfig.swayWindMultiplier;
    
    // Update mixing
    filter.uniforms.u_perpendicularMix = bushConfig.perpendicularMix;
  }
}
```

### 3. Updated TreeLayer.updateFromConfig()
**File:** `scripts/module.js` lines 27961-27986

Same fix as above but for tree config parameters.

## Result

✅ All 10 bush sliders now immediately update the visual effect:
- Rustle Distance, Speed, Frequency, Intensity
- Sway Distance, Speed, Frequency, Intensity, Wind Response
- Turbulence Mix

✅ All 10 tree sliders now immediately update the visual effect:
- Same parameters as bush with tree-specific ranges

✅ Changes are immediate - no need to reload or change scenes

## Testing
1. Open Material Editor
2. Find a scene with `_Bush` or `_Tree` tiles
3. Adjust any slider in the Bush/Tree Distortion sections
4. Effect should update immediately

## Related Systems
This same pattern applies to all layer-based effects:
- Configuration changes trigger `ProfileManager.updateSystemFromPath()`
- ProfileManager looks up the effect in `CONFIG_SYSTEM_MAP`
- Calls the layer's `updateFromConfig()` method
- Layer must update its internal state (filters, uniforms, etc.)

If any other layer-based effect has non-responsive sliders, check:
1. Is it in `CONFIG_SYSTEM_MAP`?
2. Does `updateFromConfig()` actually update the visual state?
