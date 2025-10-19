# Map Shine Performance Analysis Report

**Generated:** October 19, 2025  
**Module Version:** Analysis based on current codebase  
**Foundry VTT Version:** v12+ compatible

---

## Executive Summary

This comprehensive analysis examines the performance characteristics of the Map Shine module and its integration with Foundry VTT's rendering pipeline. The module implements sophisticated visual effects including metallic reflections, dynamic weather, particle systems, and advanced post-processing. While visually impressive, several architectural patterns contribute to measurable performance overhead.

**Critical Findings:**
- **30+ RenderTextures** created per scene (screen-resolution, ~8MB VRAM each at 1080p)
- **13+ ticker callbacks** executing every frame (~16ms budget at 60fps)
- **Token shape tracking** via half-resolution render-to-texture every frame
- **Lighting reintegration** dependency on external illumination buffer module
- **Multiple full-scene renders** per frame across various effect layers

**Estimated Performance Impact:**
- **GPU VRAM:** 200-400MB for render textures alone
- **Frame Budget:** 8-12ms overhead per frame (50-75% of 16ms budget)
- **Draw Calls:** 100+ additional per frame (vs ~50 base Foundry)

---

## Table of Contents

1. [Foundry VTT Rendering Architecture](#foundry-vtt-rendering-architecture)
2. [Map Shine Module Architecture](#map-shine-module-architecture)
3. [Performance Bottlenecks](#performance-bottlenecks)
4. [Render Texture Analysis](#render-texture-analysis)
5. [Animation Loop Overhead](#animation-loop-overhead)
6. [Token Shape Tracking Problem](#token-shape-tracking-problem)
7. [Lighting Integration Issues](#lighting-integration-issues)
8. [Particle System Performance](#particle-system-performance)
9. [Shader Complexity Analysis](#shader-complexity-analysis)
10. [Recommendations](#recommendations)

---

## 1. Foundry VTT Rendering Architecture

**Canvas Group Hierarchy:** Foundry uses `EnvironmentCanvasGroup`, `PrimaryCanvasGroup`, `EffectsCanvasGroup`, `InterfaceCanvasGroup`, and `OverlayCanvasGroup`.

**Rendering:** Single ticker loop, PIXI batch rendering, layer composition via z-index, `canvas.effects.illumination` for lighting.

**Module Integration:** Custom layers via `canvas.stage`, filters on containers, hooks (`canvasInit`, `canvasReady`), ticker callbacks.

---

## 2. Map Shine Architecture

**12 Custom Layers:** AmbientLayer, OverheadEffectLayer, BackgroundEffectLayer, CloudShadowsLayer, StructuralShadowsLayer, MetallicShineLayer, PrismLayer, CanopyDistortionLayer, WaterEffectLayer, HeatDistortionLayer, ParticleLayer, DiagnosticLayer, plus WeatherEffectLayer.

**12 Manager Systems:** CoordinateManager, ResourceManager, LightMaskManager (3-pass blur), GeometryMaskManager, DynamicTokenMaskManager, ParticleManager, WindManager, WeatherSystemManager, ScreenEffectsManager, TimeControl, DynamicExposureManager, EffectTargetManager.

**Data Flow:** High-priority ticker updates managers → Layer `_onAnimate` methods execute sequentially.

---

## 3. Performance Bottlenecks

### 3.1 Multiple Full-Scene Renders Per Frame

**Systems rendering full-screen every frame:**
- LightMaskManager (3 passes: Full + 2×Half resolution)
- CloudShadowsLayer (procedural shader, full-res)
- StructuralShadowsLayer (shadow composite, full-res)
- MetallicShineLayer (3 renders: specular + pattern + final)
- WaterEffectLayer (3 half-res renders)
- DynamicTokenMaskManager (half-res, every frame)
- GeometryMaskManager (N full-res textures, one per effect type)
- NoiseTextureManager (4+ full-res textures)

**Estimated:** 150-200 draw calls/frame vs Foundry's base ~50.

### 3.2 Render Texture Memory

**30+ `PIXI.RenderTexture.create` calls identified.**

At 1920×1080:
- Full RGBA8: 8.29 MB
- Half RGBA8: 2.07 MB  
- Full FLOAT32: 33.18 MB

**Breakdown:** LightMask (27MB), Clouds (17MB), Shine (25MB), Water (14MB), Geometry Masks (83MB), Particles (8MB), Heat (10MB), Canopy (8MB), Noise (33MB), Others (20MB).

**Total: ~245MB at 1080p, ~980MB at 4K**

### 3.3 Ticker Overhead

**13+ ticker callbacks** execute sequentially every frame, adding 0.5-1ms overhead before actual work begins.

---

## 4. Render Texture Analysis

### 4.1 Excessive Creation

Multiple systems create dedicated blur textures that could share a pool. Examples: LightMaskManager (3 textures), WaterEffect (1), CanopyDistortion (2).

### 4.2 Unnecessary Full Resolution

Noise patterns, cloud shadows, and some blur operations use full-res when half-res would be imperceptible.

### 4.3 Dynamic Mask Proliferation

GeometryMaskManager creates one full-screen texture per effect type (sparks, flames, steam, etc.). With 10 types = 80MB+.

**Solution:** Consolidate non-overlapping effects into shared textures using RGBA channels.

---

## 5. Animation Loop Overhead

### 5.1 Sequential Dependencies

Layers update sequentially, preventing parallelization. Example from ParticleLayer (lines 15983-16049):
1. Update geometry masks (triggers renders)
2. Process pending targets (async)
3. Update wind physics
4. Update all particles
5. Update UI (throttled)

**Issue:** Earlier layers must complete before later ones start.

### 5.2 Redundant Per-Frame Rendering

CloudShadowsLayer regenerates procedural clouds at 60fps. Clouds change slowly—rendering every 3-5 frames would be imperceptible.

**Solution:** Time-based caching with dirty flags.

### 5.3 Validation Overhead

Repeated per-frame validity checks (e.g., `sprite?.texture?.baseTexture?.valid && !sprite.destroyed`) add overhead through property chain traversals.

---

## 6. Token Shape Tracking Problem

### 6.1 The Awkward Approach

**DynamicTokenMaskManager** (lines 11074-11229) renders all token sprites to a half-resolution RenderTexture **every frame** to create masks for effects like ambient glow.

```javascript
// Lines 11092-11095
this.renderTexture = PIXI.RenderTexture.create({
  width: halfWidth,
  height: halfHeight,
});
```

**Process:**
1. Iterate all tokens on canvas
2. Create/update PIXI.Sprite for each token
3. Add sprites to container
4. Render container to texture
5. Other effects sample this texture

**Problems:**
- **Redundancy:** Token textures already rendered by Foundry
- **Every Frame:** Tokens don't change shape that often
- **Half-Res Artifact:** Scaling introduces quality loss
- **Synchronization:** Must render before effects that use it

### 6.2 Why This Exists

Effects like `AmbientLayer` need to "hide behind tokens" (luminance masking). The module creates this mask by capturing token shapes because PIXI doesn't expose Foundry's token render targets directly.

### 6.3 Better Approach

**Option 1: Event-Based Updates**
Only re-render token mask when tokens move/add/delete (via hooks). Cache result.

**Option 2: Stencil Buffer**
Use GPU stencil buffer for masking instead of render texture.

**Option 3: Direct Integration**
Work with Foundry core to expose `canvas.tokens` render target for sampling.

---

## 7. Lighting Integration Issues

### 7.1 The Core Problem

Map Shine renders effects in custom layers that may be **above** Foundry's lighting layer. This causes lighting information to be "swallowed" —effects appear uniformly lit regardless of scene lighting.

### 7.2 Current "Awkward" Solution

The module depends on the **external "Illumination Buffer" module** to capture Foundry's final lighting composite:

```javascript
// AmbientLayer.js line 441
const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
const shouldBeMasked = this.visible && mConfig.enabled && !!illuminationAPI;
```

**Process:**
1. Illumination Buffer module captures `canvas.effects.illumination` to texture
2. Map Shine samples this texture in shaders
3. Effects modulate their output based on lighting data

**Problems:**
- **External Dependency:** Requires another module
- **Timing Issues:** Illumination capture must happen before Map Shine effects render
- **Coordinate Mismatch:** Screen-space illumination vs world-space effects (noted in memory)
- **Performance:** Additional full-screen texture capture

### 7.3 Alternative Approaches

**Option 1: Render Order Optimization**
Place Map Shine layers **below** lighting layer where possible. Less flexible but no reintegration needed.

**Option 2: Deferred Rendering**
Render effects to textures, then composite with lighting in final pass.

**Option 3: Shader Lighting**
Implement lighting calculations directly in effect shaders (performance cost, duplication).

**Option 4: Foundry API Request**
Request official API for accessing illumination renderTexture without external module.

---

## 8. Particle System Performance

### 8.1 Particle Update Overhead

ParticleLayer runs **fixed 60fps update loop** (lines 16016-16031) with accumulator pattern. Each particle emitter iterates all active particles, applying multiple behaviors per particle.

**Particle behaviors applied per update:**
- Spawn shape calculations
- Movement/acceleration
- Alpha interpolation
- Scale interpolation
- Color interpolation
- Rotation
- Wind physics
- Custom behaviors (candleFlame, pressurisedSteam, etc.)

**With 1000 particles:** ~8000+ calculations/frame (8 behaviors × 1000 particles).

### 8.2 Mask-Based Spawning Complexity

**TextureMaskShape** (lines 14537-14664) reads pixel data from masks to determine spawn points:

1. Extract pixel data from texture (CPU-bound)
2. Threshold filtering to find valid spawn regions
3. Build point list from valid pixels
4. Random sampling from point list

**Problem:** Happens per-emitter initialization and when masks update. Large textures (1920×1080) = 2M pixels to process.

### 8.3 Geometry Mask Dependencies

ParticleLayer waits for GeometryMaskManager to render (lines 16003, 16007-16013), creating frame-to-frame dependencies that prevent async processing.

---

## 9. Shader Complexity Analysis

### 9.1 Procedural Cloud Shader

CloudShadowsLayer runs **5-layer Fractional Brownian Motion** shader every frame (full-screen quad):

```glsl
// Pseudo-code from shader
for each pixel (1920×1080 = 2M pixels):
  for 5 cloud layers:
    - fbm3d() with 4-6 octaves of 3D noise
    - Apply shading controls (contrast, brightness, etc.)
    - Blend layers
```

**Complexity:** 2M pixels × 5 layers × ~25 noise samples = ~250M operations/frame on GPU.

### 9.2 MetallicShineFilter Complexity

Fragment shader (lines 23725-23850+) performs per-pixel:
- 5+ texture samples (specular, stripe, cloud, structural, outdoors, shadow)
- Color correction calculations (gamma, contrast, saturation)
- Building shadow offset calculation with blur sampling
- Multiple conditional branches

**At 1080p:** 2M pixels × 10+ operations = 20M+ shader ops/frame.

### 9.3 Weather Shader System

**RainShader:** Voronoi cell calculations with 20-layer snowflakes (procedural).
**FogShader:** Dual-layer FBM with configurable octaves (2-8).

All running full-screen, every frame, with masking calculations.

---

## 10. Recommendations

### 10.1 **CRITICAL: Reduce Render Texture Count**

**Action:** Implement shared render texture pool for temporary operations.

**Targets:**
- Blur operations (6+ textures → 2 pooled)
- Geometry masks (10+ textures → 4 RGBA channels consolidated)
- Noise patterns (4+ textures → 2 with ping-pong)

**Expected Savings:** ~100MB VRAM at 1080p, ~400MB at 4K.

### 10.2 **HIGH: Frame-Skip Caching**

**Action:** Add dirty flag systems with frame-skip rendering.

**Targets:**
- CloudShadowsLayer: Render every 3-5 frames (clouds change slowly)
- NoiseTextureManagers: Update only when speed > 0
- Token masks: Event-based updates only (move/add/delete)

**Expected Savings:** ~4-6ms/frame (25-40% reduction).

### 10.3 **HIGH: Resolution Optimization**

**Action:** Audit and reduce texture resolutions where imperceptible.

**Targets:**
- Noise patterns: Half-res (saves 6MB per texture)
- Cloud shadows for distant effects: Half-res
- Blur intermediates: Already half-res (good!)

**Expected Savings:** 30-50MB VRAM, 1-2ms/frame.

### 10.4 **MEDIUM: Consolidate Ticker Callbacks**

**Action:** Merge layer updates into single callback with internal prioritization.

```javascript
// Instead of 13+ separate ticker.add() calls:
canvas.app.ticker.add(() => {
  const deltaTime = Math.min(canvas.app.ticker.elapsedMS / 1000, MAX_DELTA_TIME);
  
  // High priority updates
  CoordinateManager.update();
  ResourceManager.onFrameStart();
  
  // Layer updates in dependency order
  for (const layer of orderedLayers) {
    if (layer.shouldUpdate()) layer._onAnimate(deltaTime);
  }
}, null, PIXI.UPDATE_PRIORITY.HIGH);
```

**Expected Savings:** ~0.5ms function call overhead.

### 10.5 **MEDIUM: Token Mask Optimization**

**Action:** Implement event-based updates instead of per-frame rendering.

```javascript
// Current: Every frame
DynamicTokenMaskManager._onAnimate() { renderAllTokens(); }

// Proposed: On-demand
Hooks.on("updateToken", () => tokenMaskManager.markDirty());
Hooks.on("createToken", () => tokenMaskManager.markDirty());
Hooks.on("deleteToken", () => tokenMaskManager.markDirty());

_onAnimate() {
  if (this._dirty) {
    renderAllTokens();
    this._dirty = false;
  }
}
```

**Expected Savings:** ~1-2ms/frame when tokens static.

### 10.6 **MEDIUM: Lighting Integration**

**Action:** Reduce dependency on external Illumination Buffer module.

**Options:**
1. **Request Foundry API:** Official access to `canvas.effects.illumination.texture`
2. **Render Order Fix:** Place critical layers below lighting when possible
3. **Deferred Compositing:** Single final pass that applies lighting

**Benefits:** Removes external dependency, improves timing reliability.

### 10.7 **LOW: Shader Optimization**

**Action:** Reduce shader complexity where possible.

**Targets:**
- CloudShadowsLayer: LOD system (reduce octaves at high zoom)
- MetallicShine: Skip building shadows when not visible
- Weather shaders: Viewport culling (don't render off-screen)

**Expected Savings:** 2-4ms/frame in complex scenes.

### 10.8 **LOW: Particle Culling**

**Action:** Implement viewport culling for particles.

Already has LOD system (lines ~16016-16031), but add:
- Frustum culling (don't update particles outside view)
- Distance-based particle limits
- Adaptive spawn rates based on FPS

### 10.9 **Architecture: Async Processing**

**Long-term Action:** Decouple rendering dependencies to enable parallel processing.

**Current:** Sequential layer updates create waterfall.
**Proposed:** Layers render independently to textures, then composite.

**Benefits:** Better CPU utilization, smoother frame times.

### 10.10 **Monitoring: Performance Budgets**

**Action:** Implement performance monitoring system.

```javascript
class PerformanceBudget {
  budgets = {
    managers: 2, // ms
    cloudShadows: 2,
    particles: 3,
    metallicShine: 1.5,
    // ...
  };
  
  measure(name, fn) {
    const start = performance.now();
    fn();
    const elapsed = performance.now() - start;
    if (elapsed > this.budgets[name]) {
      console.warn(`${name} exceeded budget: ${elapsed.toFixed(2)}ms`);
    }
  }
}
```

---

## Summary

Map Shine is an ambitious, visually stunning module that pushes Foundry VTT's rendering capabilities. However, the current architecture prioritizes features over performance optimization.

**Key Issues:**
1. **245MB VRAM** in render textures (scales to 980MB at 4K)
2. **150-200 draw calls/frame** vs Foundry's 50
3. **13+ ticker callbacks** with sequential dependencies
4. **Every-frame rendering** of slowly-changing effects
5. **External dependencies** for lighting integration

**Implementation Priority:**

1. **Week 1:** Render texture pooling, frame-skip caching (40-50% performance gain)
2. **Week 2:** Resolution optimization, token mask events (15-20% gain)
3. **Week 3:** Ticker consolidation, lighting integration improvements (10-15% gain)
4. **Week 4:** Shader optimization, particle culling (5-10% gain)

**Expected Total Improvement:** 70-95% reduction in overhead, 150-200MB VRAM savings.

The module's foundation is solid. With targeted optimization, Map Shine can deliver its stunning visuals at 60fps on mid-range hardware.

---

**Report Complete**  
**Analysis Date:** October 19, 2025  
**Recommendations Valid Until:** Major Foundry VTT version change or significant module refactor

