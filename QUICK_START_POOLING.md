# Texture Pooling Quick Start Guide

## Installation

1. **Import the pool:**
```javascript
import { RenderTexturePool } from './scripts/utils/RenderTexturePool.js';
```

2. **Initialize on startup:**
```javascript
// In MapShineLifecycle.initialize()
RenderTexturePool.initialize();
```

3. **Cleanup on teardown:**
```javascript
// In scene teardown
RenderTexturePool.destroy();
```

---

## Migration Pattern

### ❌ BEFORE (LightMaskManager)
```javascript
class LightMaskManager {
  initialize() {
    // Create and OWN textures forever
    this.intermediateBlurTexture = PIXI.RenderTexture.create({
      width: 960, height: 540
    });
    this.intermediateBlurTexture2 = PIXI.RenderTexture.create({
      width: 960, height: 540
    });
  }
  
  _render() {
    renderer.render(sprite1, { renderTexture: this.intermediateBlurTexture });
    renderer.render(sprite2, { renderTexture: this.intermediateBlurTexture2 });
  }
  
  destroy() {
    this.intermediateBlurTexture?.destroy(true);
    this.intermediateBlurTexture2?.destroy(true);
  }
}
```

### ✅ AFTER (Pooled)
```javascript
class LightMaskManager {
  initialize() {
    // Just store dimensions, don't create textures
    this._blurWidth = 960;
    this._blurHeight = 540;
  }
  
  _render() {
    // Borrow textures only when needed
    const temp1 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight);
    const temp2 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight);
    
    try {
      renderer.render(sprite1, { renderTexture: temp1 });
      renderer.render(sprite2, { renderTexture: temp2 });
      
      // Final output to persistent texture
      renderer.render(finalSprite, { 
        renderTexture: this.blurredLightMaskTexture 
      });
    } finally {
      // CRITICAL: Always return to pool
      RenderTexturePool.release(temp1);
      RenderTexturePool.release(temp2);
    }
  }
  
  destroy() {
    // Only destroy persistent textures
    this.blurredLightMaskTexture?.destroy(true);
    // Pool handles its own cleanup
  }
}
```

---

## Critical Rules

1. **ALWAYS use try-finally**
2. **NEVER store pooled textures** as class properties
3. **NEVER destroy pooled textures** manually
4. **Release immediately** after use

---

## Diagnostics

```javascript
// Check pool performance
RenderTexturePool.printReport();

// Get stats
const stats = RenderTexturePool.getStats();
console.log('Hit Rate:', stats.hitRatePercent);
console.log('VRAM:', stats.estimatedVRAM);
```

---

## Target Systems (Week 1)

1. ✅ LightMaskManager (3 textures → pool)
2. ✅ BuildingShadowsLayer (2 textures → pool)
3. ✅ CanopyDistortionLayer (2 textures → pool)
4. ✅ WaterEffectLayer (1 texture → pool)

**Expected Savings:** 18MB → 6MB (66% reduction)
