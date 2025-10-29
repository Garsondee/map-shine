# Water Effects Performance Analysis Report

**Generated:** 2025-10-28  
**Analysis Target:** WaterEffectLayer & WaterEffectsFilter  
**Performance Impact:** -364.09 FPS (-51.7%) - CRITICAL

---

## Executive Summary

Water Effects is the **4th worst performance offender** in Map Shine, causing a **51.7% FPS drop** (1.52ms frame time increase). The system performs **6 expensive render passes per frame** plus complex shader calculations, making it one of the most GPU-intensive effects.

---

## Root Cause Analysis

### 1. Multiple Render Passes (Primary Bottleneck)

The WaterFXLayer performs **6 separate render-to-texture operations every frame**:

```javascript
// In _onAnimate() method - 6 render passes per frame:
1. renderer.render(this.displacementSprite, { renderTexture: this.displacementTexture });
2. renderer.render(this.shorelineMaskContainer, { renderTexture: this.shorelineMaskTexture });
3. renderer.render(this.causticsMaskContainer, { renderTexture: this.combinedCausticsMaskTexture });
4. renderer.render(this.puddleMaskContainer, { renderTexture: this.puddleMaskTexture });
5. renderer.render(this.noWaterMaskContainer, { renderTexture: this.noWaterMaskTexture });
6. renderer.render(this.blurSourceSprite, { renderTexture: this.blurredWaterMaskTexture });
```

**Impact:** Each render pass requires:
- Full GPU pipeline setup
- Scene transformation calculations
- Texture memory bandwidth
- Frame buffer synchronization

### 2. Complex Fragment Shader

The WaterEffectsFilter shader is extremely complex with multiple expensive features:

**Active Features (when enabled):**
- **Wave Distortion:** Displacement map sampling with outdoor masking
- **Depth Displacement:** Parallax effect with wall smearing (8-sample loop)
- **Surface Effects:** FBM noise + specular calculations
- **Caustics:** Multiple snoise() calls + line distortion + bloom
- **Shoreline Foam:** FBM patterns + swirl displacement
- **Murkiness:** Dual noise layers (wavy + sandy) + modulation
- **Cloud Occlusion:** Additional texture sampling for caustics/specular

**Shader Complexity Metrics:**
- **6 texture samplers** (displacement, masks, clouds, etc.)
- **15+ uniform parameters**
- **Multiple FBM noise loops** (4-8 octaves each)
- **8-sample wall smearing loop** in depth displacement
- **Complex mathematical operations** per pixel

### 3. Full-Screen Processing

Water effects process the **entire screen** every frame, not just water areas:
- Early exit checks only happen **after** coordinate calculations
- No viewport culling or region-based optimization
- Processes indoor areas even when water is outdoor-only

### 4. Half-Resolution Limitations

While displacement and blur textures use half-resolution, the main shader still runs at full resolution:
- Displacement texture: 50% resolution (screen.width/2, screen.height/2)
- Main water shader: 100% resolution (every pixel)
- No adaptive quality based on zoom or water coverage

---

## Performance Optimization Plan

### Phase 1: Quick Wins (Low Risk - 1-2 days)

#### 1.1 Render Pass Culling (Estimated: 20-30% improvement)

**Problem:** All 6 render passes execute every frame, even when masks haven't changed.

**Solution:** Add dirty flags and conditional rendering:

```javascript
// Track when masks actually need updates
_onPan() {
  this._needsShorelineMaskUpdate = true;
  this._needsCausticsMaskUpdate = true;
  this._needsPuddleMaskUpdate = true;
  this._needsNoWaterMaskUpdate = true;
}

_onAnimate(deltaTime) {
  // Only render displacement map every frame (animation)
  renderer.render(this.displacementSprite, {
    renderTexture: this.displacementTexture,
    clear: true,
  });
  
  // Only update static masks when dirty
  if (this._needsShorelineMaskUpdate) {
    renderer.render(this.shorelineMaskContainer, {
      renderTexture: this.shorelineMaskTexture,
      transform: canvas.stage.transform.worldTransform,
      clear: true,
    });
    this._needsShorelineMaskUpdate = false;
  }
  // ... similar for other static masks
}
```

**Benefits:** Reduces from 6 render passes to 1-2 per frame during normal gameplay.

#### 1.2 Early Exit Optimization (Estimated: 10-15% improvement)

**Problem:** Shader processes entire screen before checking if water is present.

**Solution:** Move water mask check to shader start:

```glsl
void main() {
    // EARLY EXIT - Check masks first
    float waterMaskValue = texture2D(u_waterMask, vTextureCoord).r;
    float causticsMaskValue = u_hasCausticsMask ? texture2D(u_causticsMask, vTextureCoord).r : 0.0;
    float puddleCheckValue = (u_puddles_enabled && u_usePuddleMask) 
        ? texture2D(u_puddleMask, vTextureCoord).r : 0.0;
    
    if (max(waterMaskValue, max(causticsMaskValue, puddleCheckValue)) < 0.01) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
        return;
    }
    
    // ... rest of shader only runs on water pixels
}
```

#### 1.3 Viewport Culling (Estimated: 5-10% improvement)

**Problem:** Processes water areas outside visible viewport.

**Solution:** Add viewport bounds check to shader:

```glsl
// Add to uniforms
uniform vec4 u_viewportBounds; // x, y, width, height in texture coords

void main() {
    // Skip pixels outside viewport
    if (vTextureCoord.x < u_viewportBounds.x || 
        vTextureCoord.x > u_viewportBounds.x + u_viewportBounds.z ||
        vTextureCoord.y < u_viewportBounds.y || 
        vTextureCoord.y > u_viewportBounds.y + u_viewportBounds.w) {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
        return;
    }
    
    // ... water processing
}
```

### Phase 2: Feature Optimizations (Medium Risk - 3-4 days)

#### 2.1 Adaptive Quality System (Estimated: 15-25% improvement)

**Implementation:** Add quality levels based on performance:

```javascript
// Configuration options
water: {
  quality: {
    level: 'auto', // low, medium, high, auto
    targetFPS: 60,
    autoScale: true
  }
}

// Auto-adjust based on current FPS
if (currentFPS < targetFPS) {
  this._reduceQuality();
} else if (currentFPS > targetFPS + 10) {
  this._increaseQuality();
}
```

**Quality Levels:**
- **Low:** Disable caustics, disable shoreline foam, reduce octaves
- **Medium:** Disable bloom, reduce FBM octaves by 50%
- **High:** Full feature set

#### 2.2 Feature Toggles (Estimated: 10-20% improvement)

**Add granular disable options:**
- `water.caustics.enabled` - Most expensive feature
- `water.shoreline.enabled` - Moderate cost
- `water.surface.enabled` - Specular + foam calculations
- `water.murkiness.enabled` - Dual noise layers

#### 2.3 Half-Resolution Main Shader (Estimated: 20-30% improvement)

**Technique:** Render main water effects at half resolution, upscale with bilinear filtering.

```javascript
// Create half-res render target
this.waterRenderTexture = PIXI.RenderTexture.create({
  width: Math.floor(screen.width / 2),
  height: Math.floor(screen.height / 2),
  scaleMode: PIXI.SCALE_MODES.LINEAR
});

// Render to half-res, then apply to full screen
renderer.render(this.waterSprite, {
  renderTexture: this.waterRenderTexture,
  clear: true
});

// Apply as final filter
canvas.stage.filters = [this.waterUpscaleFilter];
```

### Phase 3: Architecture Improvements (High Risk - 1-2 weeks)

#### 3.1 RenderTexture Pool Integration

**Current Issue:** Water textures not using RenderTexturePool system.

**Solution:** Migrate to pooling system:

```javascript
// Use existing pool instead of persistent textures
this.displacementTexture = RenderTexturePool.acquire(
  halfWidth, halfHeight, PIXI.FORMATS.FLOAT
);

try {
  // ... rendering code
} finally {
  RenderTexturePool.release(this.displacementTexture);
}
```

**Expected Benefit:** 6.21MB VRAM savings (based on similar systems).

#### 3.2 GPU Instancing for Mask Sprites

**Current Issue:** Multiple mask containers rendered individually.

**Solution:** Combine mask sprites into instanced render calls.

#### 3.3 Compute Shader for Displacement

**Advanced:** Move displacement generation to compute shader (WebGL2 only).

---

## Recommended Implementation Order

### Immediate (This Session - Low Risk)
1. **Render Pass Culling** - Add dirty flags for static masks
2. **Early Exit Shader** - Move mask checks to shader start
3. **Feature Toggle UI** - Add disable options for expensive features

### Week 1 (Medium Risk)
1. **Viewport Culling** - Skip off-screen water areas
2. **Adaptive Quality System** - Auto-adjust based on FPS
3. **Quality Level Implementation** - Low/Medium/High presets

### Week 2+ (High Risk)
1. **RenderTexturePool Integration** - Memory optimization
2. **Half-Resolution Rendering** - Major performance boost
3. **Architecture Refactoring** - GPU instancing, compute shaders

---

## Expected Impact Summary

| Phase | FPS Improvement | Frame Time Reduction | Risk Level |
|-------|----------------|----------------------|------------|
| Phase 1 (Quick Wins) | +100-150 FPS | -0.4 to -0.6ms | **Low** |
| Phase 2 (Feature Opt) | +80-120 FPS | -0.3 to -0.5ms | **Medium** |
| Phase 3 (Architecture) | +60-100 FPS | -0.2 to -0.4ms | **High** |
| **Total Potential** | **+240-370 FPS** | **-0.9 to -1.5ms** | **Mixed** |

**Best Case Scenario:** Water effects go from -364 FPS to -134 FPS (63% improvement)

---

## Testing Strategy

### Performance Validation
```bash
# Before and after each optimization
npx playwright test quick-profile-test.spec.js --config=playwright-headed.config.js --workers=1
```

### Quality Validation
- Visual regression tests for each quality level
- Ensure water still looks acceptable at reduced settings
- Compare before/after screenshots for each optimization

### Memory Validation
```javascript
// Monitor VRAM usage
RenderTexturePool.getStats()
```

---

## Conclusion

Water Effects is a **critical performance bottleneck** due to:
1. **6 render passes per frame** (fixable with dirty flags)
2. **Complex full-screen shader** (fixable with early exits)
3. **No adaptive quality** (fixable with quality levels)

**Recommendation:** Implement Phase 1 optimizations immediately for **30-45% performance boost** with minimal risk. The remaining phases can be prioritized based on user feedback and performance requirements.

The system has good architectural foundations (separate textures, modular design) but needs optimization for the performance-intensive nature of real-time water simulation.
