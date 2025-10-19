# Texture Pooling Implementation Plan
## Map Shine Performance Optimization - Phase 1

**Created:** October 19, 2025  
**Priority:** CRITICAL  
**Expected Impact:** 40-50% performance gain, 100+ MB VRAM savings

---

## Executive Summary

Implement a shared RenderTexture pool to eliminate redundant texture allocation across Map Shine's systems. Currently, 30+ identical textures are created independently, wasting 245MB VRAM at 1080p. The pool will reduce this to 20-40MB while enabling temporal texture sharing.

**Key Metrics:**
- **Current State:** 30+ textures, 245MB VRAM (1080p), 980MB (4K)
- **Target State:** 3-5 active textures, 20-40MB VRAM (1080p), 80-160MB (4K)
- **Savings:** ~200MB at 1080p, ~800MB at 4K (71-81% reduction)
- **Implementation Time:** Week 1 (5-7 days)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [RenderTexturePool Class Design](#2-rendertexturepool-class-design)
3. [Integration Points](#3-integration-points)
4. [Migration Strategy](#4-migration-strategy)
5. [Testing & Validation](#5-testing--validation)
6. [Rollout Plan](#6-rollout-plan)
7. [Performance Monitoring](#7-performance-monitoring)
8. [Rollback Strategy](#8-rollback-strategy)

---

## 1. Architecture Overview

### 1.1 Core Concept

**Before (Current):**
```
LightMaskManager
├─ intermediateBlurTexture (960×540) = 2.07MB ❌ Owned forever
├─ intermediateBlurTexture2 (960×540) = 2.07MB ❌ Owned forever
└─ blurredLightMaskTexture (1920×1080) = 8.29MB ❌ Owned forever

WaterEffectLayer
└─ blurredWaterMaskTexture (960×540) = 2.07MB ❌ Owned forever (redundant!)

BuildingShadowsLayer
├─ intermediateBlurTexture (960×540) = 2.07MB ❌ Owned forever (redundant!)
└─ blurredMaskTexture (960×540) = 2.07MB ❌ Owned forever (redundant!)

Total: 6 textures, 18.64MB (just for blur operations!)
```

**After (Pooled):**
```
RenderTexturePool
├─ 960×540 pool: [texture1, texture2] ✅ Shared by all systems
└─ 1920×1080 pool: [texture1] ✅ Shared by all systems

LightMaskManager._render()
├─ temp1 = pool.acquire(960, 540) → Use for 2ms
├─ temp2 = pool.acquire(960, 540) → Use for 2ms
├─ pool.release(temp1)
└─ pool.release(temp2)

WaterEffectLayer._render()
└─ temp = pool.acquire(960, 540) → Reuses same texture!

Total: 2-3 textures, 6.21MB (66% savings!)
```

### 1.2 Temporal Sharing Timeline

```
Frame (16ms at 60fps):
├─ [0-2ms]   LightMask blur (borrows 2× half-res)
├─ [2-4ms]   Water blur (borrows 1× half-res) ← Same texture!
├─ [4-6ms]   Building shadows blur (borrows 2× half-res) ← Same textures!
├─ [6-8ms]   Canopy blur (borrows 2× half-res) ← Same textures!
└─ [8-16ms]  No blur needed, all textures in pool

All systems share the SAME 2 textures sequentially!
```

### 1.3 Pool Size Calculation

**Minimum viable pool sizes:**

| Resolution | Concurrent Users | Pool Size | Total VRAM |
|------------|------------------|-----------|------------|
| 960×540 (half-res) | 2 | 2 textures | 4.14 MB |
| 1920×1080 (full-res) | 1 | 1 texture | 8.29 MB |
| **Total** | | **3 textures** | **12.43 MB** |

**Maximum pool sizes (safety margin):**

| Resolution | Pool Size | Total VRAM |
|------------|-----------|------------|
| 960×540 | 4 textures | 8.28 MB |
| 1920×1080 | 2 textures | 16.58 MB |
| **Total** | **6 textures** | **24.86 MB** |

**Conservative approach:** Start with max sizes, monitor usage, trim later.

---

## 2. RenderTexturePool Class Design

### 2.1 Class Structure

```javascript
/**
 * Manages a shared pool of PIXI.RenderTextures for temporary operations.
 * Provides acquire/release semantics for texture borrowing.
 * 
 * Usage:
 *   const temp = pool.acquire(960, 540);
 *   renderer.render(sprite, { renderTexture: temp });
 *   pool.release(temp);
 * 
 * @class RenderTexturePool
 * @static
 */
class RenderTexturePool {
  // Pool storage: Map<sizeKey, texture[]>
  static _pools = new Map();
  
  // Texture options templates
  static _defaultOptions = {
    scaleMode: PIXI.SCALE_MODES.LINEAR,
    type: PIXI.TYPES.UNSIGNED_BYTE
  };
  
  // Statistics tracking
  static _stats = {
    acquires: 0,
    releases: 0,
    hits: 0,      // Reused existing texture
    misses: 0,    // Created new texture
    active: new Set()  // Currently borrowed textures
  };
  
  // Configuration
  static _config = {
    maxPoolSize: 4,          // Max textures per size
    enableLogging: false,    // Performance logging
    trackLeaks: true         // Warn if textures not returned
  };
}
```

### 2.2 Core Methods

```javascript
/**
 * Acquire a render texture from the pool
 * @param {number} width - Texture width in pixels
 * @param {number} height - Texture height in pixels
 * @param {Object} options - Optional PIXI texture options
 * @returns {PIXI.RenderTexture} Texture ready for rendering
 */
static acquire(width, height, options = {}) {
  const key = `${width}x${height}`;
  const pool = this._pools.get(key) || [];
  
  this._stats.acquires++;
  
  // Try to reuse existing texture
  if (pool.length > 0) {
    const texture = pool.pop();
    this._stats.hits++;
    this._stats.active.add(texture);
    
    if (this._config.enableLogging) {
      console.log(`[TexturePool] Acquired ${key} (reused, pool: ${pool.length})`);
    }
    
    return texture;
  }
  
  // Create new texture (pool was empty)
  this._stats.misses++;
  const mergedOptions = { width, height, ...this._defaultOptions, ...options };
  const texture = PIXI.RenderTexture.create(mergedOptions);
  
  // CRITICAL: Set wrap mode to prevent edge artifacts
  texture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
  
  this._stats.active.add(texture);
  
  if (this._config.enableLogging) {
    console.log(`[TexturePool] Acquired ${key} (created new, pool: ${pool.length})`);
  }
  
  return texture;
}

/**
 * Return a texture to the pool for reuse
 * @param {PIXI.RenderTexture} texture - Texture to return
 */
static release(texture) {
  if (!texture || texture.destroyed) {
    console.warn('[TexturePool] Attempted to release destroyed texture');
    return;
  }
  
  this._stats.releases++;
  this._stats.active.delete(texture);
  
  const key = `${texture.width}x${texture.height}`;
  const pool = this._pools.get(key) || [];
  
  // Optional: Clear texture (GPU will overwrite anyway, but helps debugging)
  if (this._config.clearOnRelease) {
    const renderer = canvas.app.renderer;
    renderer.renderTexture.bind(texture);
    renderer.renderTexture.clear([0, 0, 0, 0]);
    renderer.renderTexture.bind(null);
  }
  
  // Enforce max pool size
  if (pool.length < this._config.maxPoolSize) {
    pool.push(texture);
    this._pools.set(key, pool);
    
    if (this._config.enableLogging) {
      console.log(`[TexturePool] Released ${key} (pool: ${pool.length})`);
    }
  } else {
    // Pool full, destroy excess texture
    texture.destroy(true);
    
    if (this._config.enableLogging) {
      console.log(`[TexturePool] Released ${key} (pool full, destroyed)`);
    }
  }
}

/**
 * Destroy all pooled textures and reset
 */
static destroy() {
  for (const pool of this._pools.values()) {
    for (const texture of pool) {
      texture.destroy(true);
    }
  }
  
  this._pools.clear();
  this._stats.active.clear();
  
  console.log('[TexturePool] Destroyed all pooled textures');
}

/**
 * Get diagnostic information
 */
static getStats() {
  const poolSizes = {};
  for (const [key, pool] of this._pools.entries()) {
    poolSizes[key] = pool.length;
  }
  
  return {
    acquires: this._stats.acquires,
    releases: this._stats.releases,
    hits: this._stats.hits,
    misses: this._stats.misses,
    hitRate: this._stats.hits / Math.max(1, this._stats.acquires),
    activeCount: this._stats.active.size,
    poolSizes,
    estimatedVRAM: this._calculateVRAM()
  };
}

/**
 * Calculate total VRAM usage
 * @private
 */
static _calculateVRAM() {
  let totalBytes = 0;
  
  for (const [key, pool] of this._pools.entries()) {
    const [width, height] = key.split('x').map(Number);
    const bytesPerTexture = width * height * 4; // RGBA8
    totalBytes += bytesPerTexture * pool.length;
  }
  
  // Add active textures
  for (const texture of this._stats.active) {
    totalBytes += texture.width * texture.height * 4;
  }
  
  return (totalBytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Check for leaked textures (not returned to pool)
 */
static checkLeaks() {
  if (this._stats.active.size > 0) {
    console.warn(
      `[TexturePool] Memory leak detected: ${this._stats.active.size} textures not returned`,
      Array.from(this._stats.active).map(t => `${t.width}x${t.height}`)
    );
  }
}

/**
 * Print diagnostic report
 */
static printReport() {
  const stats = this.getStats();
  
  console.group('%c[TexturePool] Performance Report', 'color: #4CAF50; font-weight: bold');
  console.log('Total Acquires:', stats.acquires);
  console.log('Total Releases:', stats.releases);
  console.log('Cache Hits:', stats.hits, `(${(stats.hitRate * 100).toFixed(1)}%)`);
  console.log('Cache Misses:', stats.misses);
  console.log('Currently Active:', stats.activeCount);
  console.log('Pool Sizes:', stats.poolSizes);
  console.log('Estimated VRAM:', stats.estimatedVRAM);
  console.groupEnd();
}
```

### 2.3 Helper Methods

```javascript
/**
 * Pre-warm the pool with commonly used sizes
 */
static initialize() {
  const screen = canvas.app.renderer.screen;
  const commonSizes = [
    { width: Math.floor(screen.width / 2), height: Math.floor(screen.height / 2) },
    { width: screen.width, height: screen.height }
  ];
  
  for (const size of commonSizes) {
    // Pre-create 2 textures per size
    const temp1 = this.acquire(size.width, size.height);
    const temp2 = this.acquire(size.width, size.height);
    this.release(temp1);
    this.release(temp2);
  }
  
  console.log('[TexturePool] Initialized with pre-warmed pool');
}

/**
 * Handle window resize - destroy all textures, they'll be recreated at new size
 */
static onResize() {
  console.log('[TexturePool] Resize detected, clearing pool');
  this.destroy();
}

/**
 * Acquire multiple textures (convenience method)
 */
static acquireBatch(count, width, height, options) {
  const textures = [];
  for (let i = 0; i < count; i++) {
    textures.push(this.acquire(width, height, options));
  }
  return textures;
}

/**
 * Release multiple textures (convenience method)
 */
static releaseBatch(textures) {
  for (const texture of textures) {
    this.release(texture);
  }
}
```

---

## 3. Integration Points

### 3.1 Target Systems (Priority Order)

**Phase 1A: Blur Operations (Highest Impact)**
1. **LightMaskManager** (lines 6995-7006)
   - 2× half-res intermediates + 1× full-res output
   - Savings: 12.43 MB → pool shared
   
2. **BuildingShadowsLayer** (lines 30752-30755)
   - 2× half-res blur textures
   - Savings: 4.14 MB → pool shared
   
3. **CanopyDistortionLayer** (similar pattern)
   - 2× half-res blur textures
   - Savings: 4.14 MB → pool shared
   
4. **WaterEffectLayer** (line 29933-29934)
   - 1× half-res blur texture
   - Savings: 2.07 MB → pool shared

**Phase 1B: Geometry Masks (Medium Impact)**
5. **GeometryMaskManager** (lines 10502-10505)
   - 10+ full-res masks (one per effect type)
   - Savings: 83 MB → 16 MB (consolidate to 2 shared via ping-pong)

**Phase 1C: Composite Operations (Lower Impact)**
6. **MetallicShineLayer** (lines 24216-24242)
   - 3× full-res composites
   - Keep as-is (need to persist across frames)
   
7. **Other layers:** Evaluate case-by-case

### 3.2 Migration Pattern

**Before (LightMaskManager example):**
```javascript
class LightMaskManager {
  initialize() {
    // Create owned textures
    this.intermediateBlurTexture = PIXI.RenderTexture.create({
      width: downscaledWidth,
      height: downscaledHeight
    });
    this.intermediateBlurTexture2 = PIXI.RenderTexture.create({
      width: downscaledWidth,
      height: downscaledHeight
    });
  }
  
  _render() {
    // Use owned textures
    renderer.render(sprite1, { renderTexture: this.intermediateBlurTexture });
    renderer.render(sprite2, { renderTexture: this.intermediateBlurTexture2 });
  }
  
  destroy() {
    this.intermediateBlurTexture?.destroy(true);
    this.intermediateBlurTexture2?.destroy(true);
  }
}
```

**After (pooled):**
```javascript
class LightMaskManager {
  initialize() {
    // No texture creation! Pool handles it.
    // Just store dimensions for later acquire calls
    this._blurWidth = downscaledWidth;
    this._blurHeight = downscaledHeight;
  }
  
  _render() {
    // Borrow textures for duration of operation
    const temp1 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight);
    const temp2 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight);
    
    try {
      renderer.render(sprite1, { renderTexture: temp1 });
      renderer.render(sprite2, { renderTexture: temp2 });
      
      // Final output to persistent texture (not pooled)
      renderer.render(finalSprite, { renderTexture: this.blurredLightMaskTexture });
    } finally {
      // CRITICAL: Always return to pool
      RenderTexturePool.release(temp1);
      RenderTexturePool.release(temp2);
    }
  }
  
  destroy() {
    // Only destroy persistent textures
    this.blurredLightMaskTexture?.destroy(true);
    // Pooled textures are NOT destroyed here
  }
}
```

### 3.3 Critical Distinctions

**When to pool:**
- ✅ Intermediate blur passes
- ✅ Temporary compositing operations
- ✅ Single-frame render targets
- ✅ Ping-pong buffers during operations

**When NOT to pool:**
- ❌ Textures that persist across frames (e.g., final outputs)
- ❌ Textures sampled by shaders later in frame
- ❌ Textures used for caching (intentionally persistent)
- ❌ Textures with custom formats (FLOAT, HALF_FLOAT) - needs separate pool

---

## 4. Migration Strategy

### 4.1 Three-Phase Rollout

**Week 1, Days 1-2: Foundation**
1. Create `RenderTexturePool` class
2. Add to `scripts/utils/RenderTexturePool.js`
3. Integrate into `MapShineLifecycle.initialize()`
4. Add window resize listener
5. Unit test pool acquire/release cycle

**Week 1, Days 3-4: Phase 1A Integration**
6. Migrate `LightMaskManager` (highest impact)
7. Migrate `BuildingShadowsLayer`
8. Migrate `CanopyDistortionLayer`
9. Migrate `WaterEffectLayer`
10. Test blur operations in-game

**Week 1, Days 5-7: Phase 1B Integration**
11. Migrate `GeometryMaskManager` (consolidation strategy)
12. Test all particle effects (depend on geometry masks)
13. Performance profiling
14. Memory leak testing
15. Documentation

### 4.2 Testing Checklist

**Per-System Tests:**
- [ ] Visual output identical to before migration
- [ ] No texture leaks (check pool stats after 1 minute)
- [ ] No visual artifacts (edge bleeding, wrong colors)
- [ ] Performance improvement measured
- [ ] Works across scene transitions
- [ ] Works across window resize

**Integration Tests:**
- [ ] All blur operations work simultaneously
- [ ] No texture contention (enough pool capacity)
- [ ] Geometry masks work for all particle types
- [ ] No crashes or WebGL errors
- [ ] Memory usage stable over time

**Stress Tests:**
- [ ] 10 rapid scene transitions
- [ ] Resize window repeatedly
- [ ] Enable all effects simultaneously
- [ ] Run for 30 minutes continuous
- [ ] Monitor VRAM usage (should not grow)

---

## 5. Testing & Validation

### 5.1 Memory Profiling

**Before migration (baseline):**
```javascript
const before = MemoryProfiler.collectStats();
console.log('Baseline VRAM:', before.summary.estimatedVRAM);
console.log('RenderTextures:', before.renderTextures.total);
```

**After migration:**
```javascript
const after = MemoryProfiler.collectStats();
const savings = parseFloat(before.summary.estimatedVRAM) - parseFloat(after.summary.estimatedVRAM);
console.log('VRAM Savings:', savings, 'MB');
console.log('RenderTextures reduced:', before.renderTextures.total - after.renderTextures.total);

RenderTexturePool.printReport();
```

### 5.2 Visual Regression Testing

Create comparison screenshots:

1. **Before migration:** Capture screenshots of all effects
2. **After migration:** Capture identical screenshots
3. **Pixel-diff:** Use image comparison tool
4. **Acceptable delta:** < 0.1% pixel difference (due to floating-point precision)

**Test scenes:**
- Metallic shine with building shadows
- Water with caustics and foam
- Particles (fire, sparks, biofilm)
- All effects enabled simultaneously

### 5.3 Performance Benchmarking

```javascript
class PoolingBenchmark {
  static async run() {
    const results = {
      baseline: {},
      pooled: {}
    };
    
    // Baseline (current system, no pooling)
    results.baseline.vram = MemoryProfiler.collectStats().summary.estimatedVRAM;
    results.baseline.frameTime = await this.measureFrameTime(60);
    
    // Pooled (new system)
    results.pooled.vram = MemoryProfiler.collectStats().summary.estimatedVRAM;
    results.pooled.frameTime = await this.measureFrameTime(60);
    results.pooled.hitRate = RenderTexturePool.getStats().hitRate;
    
    // Calculate improvements
    const vramSavings = parseFloat(results.baseline.vram) - parseFloat(results.pooled.vram);
    const frameTimeImprovement = results.baseline.frameTime - results.pooled.frameTime;
    
    console.group('Pooling Performance Report');
    console.log('VRAM Savings:', vramSavings.toFixed(2), 'MB');
    console.log('Frame Time Improvement:', frameTimeImprovement.toFixed(2), 'ms');
    console.log('Cache Hit Rate:', (results.pooled.hitRate * 100).toFixed(1), '%');
    console.groupEnd();
    
    return results;
  }
  
  static async measureFrameTime(frames) {
    const times = [];
    const measure = () => {
      const start = performance.now();
      requestAnimationFrame(() => {
        times.push(performance.now() - start);
        if (times.length < frames) measure();
      });
    };
    
    measure();
    await new Promise(resolve => setTimeout(resolve, frames * 20));
    
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

---

## 6. Rollout Plan

### 6.1 Feature Flag

Add setting to enable/disable pooling:

```javascript
game.settings.register(MODULE_ID, "enable-texture-pooling", {
  name: "Enable Texture Pooling (Experimental)",
  hint: "Reduces memory usage by sharing temporary textures. Disable if visual artifacts occur.",
  scope: "client",
  config: true,
  type: Boolean,
  default: false,  // Start disabled, enable after testing
  requiresReload: true
});
```

### 6.2 Phased Enablement

**Week 1:** Development build only, pooling ON by default
**Week 2:** Beta release, pooling OFF by default, opt-in for testers
**Week 3:** Collect feedback, fix issues
**Week 4:** Production release, pooling ON by default

### 6.3 Rollback Plan

If critical issues found:

1. **Immediate:** Disable via feature flag (no code changes needed)
2. **Next patch:** Revert pooling PRs, restore old system
3. **Investigation:** Fix issues in development branch
4. **Retry:** Re-release pooling in future version

---

## 7. Performance Monitoring

### 7.1 Production Metrics

Add lightweight monitoring (minimal overhead):

```javascript
class PoolMonitor {
  static _interval = null;
  
  static startMonitoring() {
    if (!game.settings.get(MODULE_ID, "enable-pool-monitoring")) return;
    
    this._interval = setInterval(() => {
      const stats = RenderTexturePool.getStats();
      
      // Warn if hit rate drops below 80%
      if (stats.hitRate < 0.8) {
        console.warn('[PoolMonitor] Low cache hit rate:', (stats.hitRate * 100).toFixed(1), '%');
        console.warn('[PoolMonitor] Consider increasing pool size');
      }
      
      // Warn if textures not returned
      if (stats.activeCount > 10) {
        console.warn('[PoolMonitor] High active texture count:', stats.activeCount);
        RenderTexturePool.checkLeaks();
      }
    }, 10000); // Check every 10 seconds
  }
  
  static stopMonitoring() {
    if (this._interval) clearInterval(this._interval);
  }
}
```

### 7.2 User-Facing Diagnostics

Add to debugger UI:

```html
<div class="pool-diagnostics">
  <h4>Texture Pool Status</h4>
  <div>Cache Hit Rate: <span id="pool-hit-rate">--</span></div>
  <div>Active Textures: <span id="pool-active">--</span></div>
  <div>VRAM Usage: <span id="pool-vram">--</span></div>
  <button onclick="RenderTexturePool.printReport()">Print Report</button>
</div>
```

---

## 8. Rollback Strategy

### 8.1 Compatibility Layer

Keep old texture creation path as fallback:

```javascript
class LightMaskManager {
  initialize() {
    if (game.settings.get(MODULE_ID, "enable-texture-pooling")) {
      // New pooled path
      this._blurWidth = downscaledWidth;
      this._blurHeight = downscaledHeight;
      this._usePooling = true;
    } else {
      // Old owned texture path (fallback)
      this.intermediateBlurTexture = PIXI.RenderTexture.create({...});
      this.intermediateBlurTexture2 = PIXI.RenderTexture.create({...});
      this._usePooling = false;
    }
  }
  
  _render() {
    if (this._usePooling) {
      // Pooled path
      const temp1 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight);
      const temp2 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight);
      try {
        // ... rendering ...
      } finally {
        RenderTexturePool.release(temp1);
        RenderTexturePool.release(temp2);
      }
    } else {
      // Fallback path (old behavior)
      renderer.render(sprite1, { renderTexture: this.intermediateBlurTexture });
      renderer.render(sprite2, { renderTexture: this.intermediateBlurTexture2 });
    }
  }
}
```

### 8.2 Emergency Disable

Console command for users experiencing issues:

```javascript
game.mapShine.disablePooling = async function() {
  await game.settings.set(MODULE_ID, "enable-texture-pooling", false);
  ui.notifications.info("Texture pooling disabled. Reload Foundry VTT to apply.");
  console.log("Run: location.reload()");
};
```

---

## Success Criteria

### Must-Have (MVP)
- ✅ RenderTexturePool class implemented and tested
- ✅ LightMaskManager migrated (blur operations pooled)
- ✅ BuildingShadowsLayer migrated
- ✅ Visual regression tests pass (< 0.1% pixel diff)
- ✅ No memory leaks after 30 minutes
- ✅ VRAM savings >= 40MB at 1080p
- ✅ Feature flag for enable/disable

### Should-Have (Full Implementation)
- ✅ All blur operations migrated to pool
- ✅ GeometryMaskManager consolidated
- ✅ Pool monitoring diagnostics
- ✅ Performance benchmarking suite
- ✅ VRAM savings >= 100MB at 1080p
- ✅ Cache hit rate >= 80%

### Nice-to-Have (Polish)
- ✅ Debugger UI integration
- ✅ Automatic pool size tuning
- ✅ Per-effect toggle (pool vs owned)
- ✅ VRAM savings >= 200MB at 1080p
- ✅ Zero performance regression

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Visual artifacts from texture reuse | Low | High | Thorough testing, clear-on-release option |
| Memory leaks from unreturned textures | Medium | High | Leak detection, try-finally blocks |
| Performance regression | Low | Medium | Benchmarking, rollback plan |
| Compatibility issues | Low | Low | Feature flag, fallback path |
| Increased complexity | Medium | Low | Good documentation, clear patterns |

---

## Next Steps

**Immediate (Today):**
1. Create `scripts/utils/RenderTexturePool.js` file
2. Implement core pool class
3. Add unit tests

**Tomorrow:**
4. Integrate into `MapShineLifecycle`
5. Migrate LightMaskManager (first target)
6. Visual regression test

**This Week:**
7. Migrate remaining blur operations
8. Performance profiling
9. Documentation
10. Pull request for review

---

## Conclusion

Texture pooling is a **high-impact, low-risk optimization** that will dramatically reduce Map Shine's memory footprint. By sharing textures temporally instead of spatially, we eliminate 70%+ of redundant allocations while maintaining identical visual output.

**Expected Outcome:**
- **245MB → 40MB VRAM** at 1080p (83% reduction)
- **Zero visual regression** (pixel-perfect output)
- **Improved frame times** (less memory pressure = better cache coherency)
- **Foundation for future optimizations** (frame-skip caching, resolution scaling)

Let's build it! 🚀
