# Phase 3: Eliminate Duplicate Render Pass

## Current Problem

CloudShadowsLayer renders clouds **TWICE per frame** with the same expensive computation:

1. **Main Pass** (canvas.primary):
   - Full 6-layer FBM calculation
   - u_outputRawCloud = false
   - Applies shadow darkening directly

2. **Raw Texture Pass** (_patternGeneratorSprite → rawCloudTexture):
   - **Same** full 6-layer FBM calculation  
   - u_outputRawCloud = true
   - Outputs grayscale pattern

**Cost:** ~7-10ms per frame (both passes do identical noise generation)

## Solution Architecture

Split into two specialized filters:

### 1. CloudPatternGeneratorFilter (Heavy, runs once)
- **Purpose:** Generate raw cloud pattern texture
- **Complexity:** Full 6-layer FBM with domain warping
- **Output:** Grayscale cloud value (0-1)
- **Used by:** _patternGeneratorSprite → rawCloudTexture
- **Cost:** 3.5-5ms per frame

### 2. CloudShadowApplyFilter (Lightweight, runs once)
- **Purpose:** Sample pre-generated texture and apply shadows
- **Complexity:** Texture lookup + simple math
- **Input:** Samples rawCloudTexture
- **Output:** Darkened scene with cloud shadows
- **Used by:** canvas.primary filter
- **Cost:** 0.5-1ms per frame

## Implementation Steps

### Step 1: Create CloudShadowApplyFilter
```javascript
class CloudShadowApplyFilter extends PIXI.Filter {
  // Inputs:
  // - uSampler (scene)
  // - uCloudTexture (pre-generated clouds)
  // - uOutdoorsMask
  // - uLightPolygonMask
  
  // Simple fragment shader:
  // 1. Sample uCloudTexture at vScreenCoord
  // 2. Apply mask, shadow intensity, light occlusion
  // 3. Darken originalColor based on cloud value
}
```

### Step 2: Simplify CloudShadowsFilterEnhanced
```javascript
// Remove:
// - u_outputRawCloud uniform
// - Conditional logic at end of shader
// - Shadow application code

// Keep:
// - Full FBM generation
// - Weather integration
// - Time-of-day integration (for future cloud tops)

// Always output:
// - gl_FragColor = vec4(vec3(shadedCloudValue), 1.0);
```

### Step 3: Update CloudShadowsLayer
```javascript
async _draw(options) {
  // Create pattern generator filter (heavy)
  this.cloudPatternFilter = new CloudShadowsFilterEnhanced({});
  
  // Create shadow apply filter (lightweight)
  this.cloudShadowFilter = new CloudShadowApplyFilter({});
  
  // Apply ONLY the lightweight filter to canvas.primary
  canvas.primary.filters = [...filters, this.cloudShadowFilter];
  
  // Pattern generator sprite uses heavy filter
  this._patternGeneratorSprite.filters = [this.cloudPatternFilter];
}

renderEffectNow(deltaTime) {
  // Update uniforms on BOTH filters
  
  // Render pattern (heavy, once per frame)
  renderer.render(this._patternGeneratorSprite, {
    renderTexture: this.rawCloudTexture
  });
  
  // Pass texture to apply filter
  this.cloudShadowFilter.uniforms.uCloudTexture = this.rawCloudTexture;
  
  // canvas.primary automatically renders with apply filter (lightweight)
}
```

## Expected Performance Gain

| Component | Before | After | Savings |
|-----------|--------|-------|---------|
| **Pattern generation** | 3.5-5ms × 2 | 3.5-5ms × 1 | **3.5-5ms** |
| **Shadow application** | Included above | 0.5-1ms | -0.5-1ms |
| **Net savings** | - | - | **3-4ms** |

## Benefits

1. ✅ **40-50% faster** cloud rendering
2. ✅ **Cleaner architecture** - single responsibility per filter
3. ✅ **Same visual result** - identical output
4. ✅ **Easier to optimize** - can tune each filter independently
5. ✅ **Better for future features** - can reuse pattern for other effects

## Risks

- **Medium complexity change** - requires careful shader work
- **Testing needed** - ensure visual parity
- **Coordinate systems** - must match between filters

## Testing Checklist

- [ ] Cloud shadows appear identical to before
- [ ] Weather integration still works (density, coverage, etc.)
- [ ] Time-of-day tinting applies correctly
- [ ] Light occlusion functions properly
- [ ] Zoom masking threshold works
- [ ] CloudDepthLayer receives correct texture
- [ ] Performance improvement confirmed (3-4ms)

## Rollback Plan

If issues occur:
1. Revert CloudShadowsLayer._draw() changes
2. Restore u_outputRawCloud dual-mode
3. Remove new CloudShadowApplyFilter
4. Keep Phase 2 half-resolution optimization

## Timeline

- **Filter creation:** 1 hour
- **Layer integration:** 1 hour  
- **Testing & debugging:** 1-2 hours
- **Total:** 3-4 hours
