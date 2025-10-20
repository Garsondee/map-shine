# AnimatedCanvasLayer Migration Guide

**Date**: 2025-01-20  
**Purpose**: Guide for migrating existing layers to use the new `AnimatedCanvasLayer` base class  
**Status**: Ready for implementation

---

## Overview

The `AnimatedCanvasLayer` base class standardizes ticker management across all animated layers, eliminating boilerplate code and preventing potential memory leaks from forgotten listener cleanup.

### Benefits

1. ✅ **Automatic ticker management** - No need to manually bind/unbind
2. ✅ **Memory leak prevention** - Guaranteed cleanup in tearDown
3. ✅ **Consistent lifecycle** - Standardized initialization and cleanup patterns
4. ✅ **Less boilerplate** - 5-10 lines of code removed per layer
5. ✅ **Type safety** - Clear contract for what subclasses must implement
6. ✅ **Easier maintenance** - One place to fix ticker-related bugs

---

## Two Base Classes Available

### 1. `AnimatedCanvasLayer`
For layers that only need ticker updates.

**Provides:**
- Automatic `_onAnimateBound` binding/unbinding
- `_destroyed` flag management
- Ticker lifecycle management

**Requires:**
- Subclass must implement `_onAnimate(deltaTime)`

### 2. `ResizableAnimatedCanvasLayer`
For layers that need both ticker updates AND window resize handling.

**Provides:**
- Everything from `AnimatedCanvasLayer`
- Automatic `_onResizeBound` binding/unbinding
- Window resize listener management

**Requires:**
- Subclass must implement `_onAnimate(deltaTime)`
- Subclass must implement `_onResize()`

---

## Migration Pattern

### Before (Old Pattern)

```javascript
class MyLayer extends foundry.canvas.layers.CanvasLayer {
  constructor() {
    super();
    this._onAnimateBound = null;
    this._destroyed = false;
  }

  async _draw(options) {
    this._destroyed = false;
    this.eventMode = "none";
    
    // Layer-specific initialization
    this.mySprite = new PIXI.Sprite();
    this.addChild(this.mySprite);
    
    // Bind ticker
    this._onAnimateBound = this._onAnimate.bind(this);
    canvas.app.ticker.add(this._onAnimateBound);
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible) return;
    // Animation logic
  }

  async _tearDown(options) {
    if (this._destroyed) return;
    this._destroyed = true;
    
    // Remove ticker
    if (this._onAnimateBound) {
      canvas.app.ticker.remove(this._onAnimateBound);
      this._onAnimateBound = null;
    }
    
    // Layer-specific cleanup
    this.mySprite?.destroy();
    
    await super._tearDown(options);
  }
}
```

### After (New Pattern)

```javascript
import { AnimatedCanvasLayer } from './layers/AnimatedCanvasLayer.js';

class MyLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    // No need for _onAnimateBound or _destroyed
  }

  async _draw(options) {
    await super._draw(options); // Handles ticker binding
    
    // Layer-specific initialization
    this.mySprite = new PIXI.Sprite();
    this.addChild(this.mySprite);
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible) return;
    // Animation logic (unchanged)
  }

  async _tearDown(options) {
    // Layer-specific cleanup
    this.mySprite?.destroy();
    
    await super._tearDown(options); // Handles ticker unbinding
  }
}
```

**Lines Removed**: 8  
**Code Clarity**: Improved  
**Bug Risk**: Reduced

---

## Migration Checklist

For each layer:

- [ ] 1. Import `AnimatedCanvasLayer` or `ResizableAnimatedCanvasLayer`
- [ ] 2. Change extends clause from `foundry.canvas.layers.CanvasLayer`
- [ ] 3. Remove `this._onAnimateBound = null;` from constructor
- [ ] 4. Remove manual `_destroyed` flag (now inherited)
- [ ] 5. Remove ticker binding code from `_draw()`
- [ ] 6. Add `await super._draw(options)` at START of `_draw()`
- [ ] 7. Remove ticker unbinding code from `_tearDown()`
- [ ] 8. Move `await super._tearDown(options)` to END of `_tearDown()`
- [ ] 9. If using resize: Remove resize binding/unbinding code
- [ ] 10. Test layer initialization and cleanup

---

## Special Cases

### Layers with Resize Handling

**Before:**
```javascript
async _draw(options) {
  this._onAnimateBound = this._onAnimate.bind(this);
  canvas.app.ticker.add(this._onAnimateBound);
  
  this._onResizeBound = this._onResize.bind(this);
  window.addEventListener('resize', this._onResizeBound);
}

async _tearDown(options) {
  canvas.app.ticker.remove(this._onAnimateBound);
  window.removeEventListener('resize', this._onResizeBound);
  await super._tearDown(options);
}
```

**After:**
```javascript
import { ResizableAnimatedCanvasLayer } from './layers/AnimatedCanvasLayer.js';

class MyLayer extends ResizableAnimatedCanvasLayer {
  async _draw(options) {
    await super._draw(options); // Handles both ticker and resize
  }

  _onResize() {
    // Resize logic
  }

  async _tearDown(options) {
    // Cleanup
    await super._tearDown(options); // Handles both ticker and resize
  }
}
```

### Layers with Additional Hooks

If a layer also uses Hooks, manage them separately:

```javascript
async _draw(options) {
  await super._draw(options); // Handles ticker
  
  // Manual hook management
  this._onPanBound = this._onPan.bind(this);
  Hooks.on('canvasPan', this._onPanBound);
}

async _tearDown(options) {
  // Manual hook cleanup
  if (this._onPanBound) {
    Hooks.off('canvasPan', this._onPanBound);
    this._onPanBound = null;
  }
  
  await super._tearDown(options); // Handles ticker
}
```

---

## Priority Migration List

### High Priority (Simple, High Impact)

These layers only use ticker and have simple patterns:

1. **CloudDepthLayer** (module.js:25845)
2. **DiagnosticLayer** (module.js:22182)
3. **LightningLayer** (module.js:16230)

**Estimated Time**: 5 minutes each

### Medium Priority (Ticker + Resize)

These layers use both ticker and window resize:

4. **MetallicShineLayer** (module.js:24125)
5. **GroundGlowLayer** (module.js:27736)
6. **OverheadEffectLayer** (module.js:8594)
7. **FoamLayer** (module.js:21261)

**Estimated Time**: 10 minutes each

### Lower Priority (Complex Lifecycle)

These layers have additional hooks or complex initialization:

8. **ParticleLayer** (module.js:16014)
9. **SmellyFliesLayer** (module.js:18428)
10. **HeatDistortionLayer** (module.js:28084)
11. **BackgroundEffectTileLayer** (module.js:21822)

**Estimated Time**: 15 minutes each

### MaskedEffectLayer (Base Class)

**MaskedEffectLayer** (module.js:21921) should be migrated to extend `AnimatedCanvasLayer`:

```javascript
import { AnimatedCanvasLayer } from './layers/AnimatedCanvasLayer.js';

class MaskedEffectLayer extends AnimatedCanvasLayer {
  // Remove ticker management code
  // Keep masking logic
}
```

This will automatically cascade the benefits to all 8 layers that extend MaskedEffectLayer.

**Estimated Time**: 20 minutes + testing

---

## Testing Procedure

After migrating each layer:

1. **Load a scene** - Verify layer initializes
2. **Check animation** - Verify _onAnimate() is being called
3. **Change scenes** - Verify no console errors
4. **Reload browser** - Verify no memory leaks
5. **Open/close debugger** - Verify no ticker errors
6. **Run for 5 minutes** - Verify stable operation

---

## Example: Complete Migration

### Before (MetallicShineLayer)

```javascript
class MetallicShineLayer extends foundry.canvas.layers.CanvasLayer {
  constructor() {
    super();
    this._onAnimateBound = null;
    this._onResizeBound = null;
    this._onPanBound = null;
    this._destroyed = false;
    this._needsMaskUpdate = true;
  }

  async _draw() {
    this._destroyed = false;
    this.eventMode = "none";
    this._needsMaskUpdate = true;
    
    // ... initialization code ...
    
    this._onAnimateBound = this._onAnimate.bind(this);
    canvas.app.ticker.add(this._onAnimateBound);
    
    this._onResizeBound = this._onResize.bind(this);
    window.addEventListener('resize', this._onResizeBound);
    
    this._onPanBound = this._onPan.bind(this);
    Hooks.on('canvasPan', this._onPanBound);
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible) return;
    // Animation logic
  }

  _onResize() {
    // Resize logic
  }

  _onPan() {
    this._needsMaskUpdate = true;
  }

  async _tearDown(options) {
    if (this._destroyed) return;
    this._destroyed = true;

    canvas.app.ticker.remove(this._onAnimateBound);
    window.removeEventListener('resize', this._onResizeBound);
    Hooks.off('canvasPan', this._onPanBound);

    // ... cleanup code ...

    await super._tearDown(options);
  }
}
```

### After (MetallicShineLayer)

```javascript
import { ResizableAnimatedCanvasLayer } from './layers/AnimatedCanvasLayer.js';

class MetallicShineLayer extends ResizableAnimatedCanvasLayer {
  constructor() {
    super(); // Inherits _destroyed, _onAnimateBound, _onResizeBound
    this._onPanBound = null; // Still need this for Hooks
    this._needsMaskUpdate = true;
  }

  async _draw() {
    await super._draw(); // Handles ticker and resize binding
    this._needsMaskUpdate = true;
    
    // ... initialization code ...
    
    // Manual hook management (not handled by base class)
    this._onPanBound = this._onPan.bind(this);
    Hooks.on('canvasPan', this._onPanBound);
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible) return;
    // Animation logic (unchanged)
  }

  _onResize() {
    // Resize logic (unchanged)
  }

  _onPan() {
    this._needsMaskUpdate = true;
  }

  async _tearDown(options) {
    // Manual hook cleanup
    if (this._onPanBound) {
      Hooks.off('canvasPan', this._onPanBound);
      this._onPanBound = null;
    }

    // ... cleanup code ...

    await super._tearDown(options); // Handles ticker and resize unbinding
  }
}
```

**Result**:
- ✅ 6 lines removed from constructor
- ✅ 4 lines removed from _draw()
- ✅ 2 lines removed from _tearDown()
- ✅ Total: 12 lines of boilerplate eliminated
- ✅ Guaranteed ticker cleanup
- ✅ More readable code

---

## Common Pitfalls

### ❌ Forgetting to call super._draw()

```javascript
async _draw(options) {
  // Missing: await super._draw(options);
  this.mySprite = new PIXI.Sprite();
}
```

**Result**: Ticker never bound, animations don't work

### ❌ Calling super._tearDown() too early

```javascript
async _tearDown(options) {
  await super._tearDown(options); // TOO EARLY!
  this.mySprite?.destroy(); // May try to use destroyed objects
}
```

**Result**: Potential errors accessing destroyed state

### ❌ Not removing manual ticker bindings

```javascript
async _draw(options) {
  await super._draw(options);
  // Don't do this - super already bound the ticker
  this._onAnimateBound = this._onAnimate.bind(this);
  canvas.app.ticker.add(this._onAnimateBound); // DUPLICATE!
}
```

**Result**: Animation callback runs twice per frame

---

## Estimated Timeline

- **Phase 1** (CloudDepthLayer, DiagnosticLayer, LightningLayer): 15 minutes
- **Phase 2** (MetallicShineLayer, GroundGlowLayer, OverheadEffectLayer, FoamLayer): 40 minutes
- **Phase 3** (ParticleLayer, SmellyFliesLayer, HeatDistortionLayer, BackgroundEffectTileLayer): 1 hour
- **Phase 4** (MaskedEffectLayer base class): 30 minutes
- **Testing**: 30 minutes

**Total**: ~3 hours for all layers

---

## Next Steps

1. ✅ Create `AnimatedCanvasLayer.js` base class
2. ⏳ Migrate 3 simple layers (Phase 1)
3. ⏳ Test Phase 1 migrations
4. ⏳ Migrate 4 resize layers (Phase 2)
5. ⏳ Test Phase 2 migrations
6. ⏳ Migrate 4 complex layers (Phase 3)
7. ⏳ Test Phase 3 migrations
8. ⏳ Migrate MaskedEffectLayer base (Phase 4)
9. ⏳ Final integration testing
10. ⏳ Update module version

---

**Status**: Ready to begin migrations  
**Created**: 2025-01-20 12:15pm UTC+01:00  
**Author**: Cascade AI
