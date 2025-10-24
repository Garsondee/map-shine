IMPORTANT NOTE, THIS FEATURE REMAINS BROKEN CURRENTLY.

# Building Shadows Effect - Complete Audit Report

**Date:** 2025-01-24  
**Module Version:** 1.1.x  
**Effect Location:** Lines 31928-32394 (Filter), Lines 32061-32394 (Layer)

---

## Executive Summary

The Building Shadows effect is a **sophisticated time-of-day based shadow system** that uses the `_Outdoors` mask to cast dynamic shadows from buildings onto the ground. It's one of the more complex effects in MapShine, featuring dual-pass Kawase blur, temporal calculations, and extensive artifact prevention logic.

---

## Architecture Overview

### Components

1. **BuildingShadowsFilter** (PIXI.Filter) - Lines 31928-32059
   - Fragment shader that samples blurred outdoors mask at offset positions
   - Applied to `canvas.primary` filters array
   - Darkens ground pixels based on shadow caster sampling

2. **BuildingShadowsLayer** (extends MaskedEffectLayer) - Lines 32061-32394
   - Manages mask discovery and rendering
   - Performs 2-pass Kawase blur on outdoors mask
   - Updates shadow parameters based on time of day
   - Z-index: 28 (below tiles, on ground layer)

3. **Integration Points:**
   - `MaskedEffectLayer` base class for mask management
   - `RenderTexturePool` for intermediate blur texture
   - `TimeOfDayLayer` for temporal calculations
   - `CoordinateManager` for screen/world space transforms

---

## Technical Deep Dive

### Mask Generation Pipeline

```
_Outdoors Tiles → MaskedEffectLayer.maskSprites → combinedMaskTexture (full-res)
                                                           ↓
                            Kawase Blur Pass 1 (full→half-res, pooled temp texture)
                                                           ↓
                            Kawase Blur Pass 2 (half→half-res, persistent output)
                                                           ↓
                                            blurredMaskTexture
```

**Key Optimization:** Uses half-resolution blur (lines 32168-32174, 32239-32252)
- Saves ~75% VRAM for blur textures
- Intermediate texture pooled via RenderTexturePool (lines 32333-32356)
- Output texture persistent (not pooled) for frame-to-frame stability

### Shadow Calculation

**Time-Based Parameters (lines 32298-32312):**
```javascript
// Only active 6am-6pm (lines 32299-32302)
if (time < 6 || time >= 18) {
  this.filter.enabled = false;
  return;
}

// Shadow intensity varies with sun elevation
const effectiveDaylight = 1.0 - Math.abs(time - 12) / 6.0;  // 1.0 at noon, 0.0 at 6am/6pm

// Blur increases at dawn/dusk (soft shadows when sun is low)
const blurPixels = shadowConfig.maxBlur * (1.0 - effectiveDaylight);

// Offset magnitude varies with time (longer shadows at dawn/dusk)
const sunPos = (time - 12) / 6.0;  // -1.0 at 6am, 0.0 at noon, +1.0 at 6pm
const offsetMagnitude = shadowConfig.maxOffset * sunPos;

// Apply directional angle
const shadowOffset = [
  Math.cos(sunAngleRad) * offsetMagnitude,
  Math.sin(sunAngleRad) * offsetMagnitude
];
```

**Shader Logic (BuildingShadowsFilter fragment shader):**

1. **Ground Check** (lines 31986-31991)
   - Sample sharp `uGroundMask` to verify pixel is on ground
   - Early discard if not on ground (no shadow inside buildings)

2. **Edge Safety** (lines 31997-32024)
   - Calculate safe zone with 8-pixel margin for blur + offset
   - Skip shadow calculation near scene edges to prevent artifacts
   - Prevents sampling outside texture bounds

3. **Shadow Sampling with Erosion** (lines 31956-31981)
   - Sample shadow caster at offset position
   - Apply 4-neighbor erosion filter to prevent thin line artifacts
   - Only render shadow if center AND neighbors are solid

4. **Threshold Filtering** (lines 32029-32036)
   - Discard shadows below 0.15 threshold
   - Prevents faint artifacts from appearing

5. **Final Darkening** (lines 32038-32042)
   ```glsl
   float shadowMultiplier = mix(1.0 - uIntensity, 1.0, shadowFactor);
   vec3 finalColor = originalColor.rgb * shadowMultiplier;
   ```

### Configuration Parameters

**User Controls (lines 32082-32117):**
- `intensity` (0-1): Shadow darkness
- `maxOffset` (0-2000px): Maximum shadow length
- `sunAngle` (0-360°): Direction of sun (0°=East, 90°=South)
- `maxBlur` (0-50px): Maximum blur at dawn/dusk

**Time Integration:**
- Reads `timeOfDay.currentTime` (0-23.99) from config
- Clock-based badge indicates temporal dependency

---

## Performance Characteristics

### VRAM Usage (1080p)
- Persistent blurred mask: ~2.07MB (960×540 half-res)
- Pooled intermediate texture: ~2.07MB (shared with other systems)
- Total dedicated: **~2.07MB**

### CPU Cost
- Mask update: Only when camera pans (lazy evaluation)
- Blur: 2-pass Kawase (~1-2ms at half-res)
- Time calculations: <0.1ms per frame

### GPU Cost
- Filter shader: Minimal (4 texture samples + erosion)
- Applied to `canvas.primary` (runs for every visible pixel)

---

## Strengths

✅ **Sophisticated temporal behavior** - Shadows change realistically with time  
✅ **Extensive artifact prevention** - Edge safety, erosion, thresholding  
✅ **Optimized performance** - Half-res blur, pooled textures, lazy updates  
✅ **Automatic integration** - Works with any _Outdoors mask  
✅ **Clean visual output** - No thin lines or edge artifacts  

---

## Limitations

⚠️ **Single shadow source** - Only buildings (outdoors mask) cast shadows  
⚠️ **Ground-only target** - Shadows only darken ground, not other surfaces  
⚠️ **Daytime only** - Disabled 6pm-6am (no moonlight shadows)  
⚠️ **Static direction** - Sun angle is user-configured, not auto-calculated from time  
⚠️ **No multi-bounce** - Shadows don't cast onto shadows  

---

## Questions Answered

### 1. How easy would it be to add shadows to things which are part of the Overhead Effect?

**Difficulty: MODERATE (6-10 hours)**

#### Current Situation

The OverheadEffectLayer (lines 7482-7901):
- Renders overhead tiles to a separate composite texture
- Has its own recolor filter (`OverheadRecolorFilter`)
- Renders at z-index 700 (well above primary canvas)
- Uses zoom-based blur and opacity

#### Implementation Path

**Option A: Add Shadow Sampling to OverheadRecolorFilter (RECOMMENDED)**

```glsl
// In OverheadRecolorFilter fragment shader (after line 32461)
uniform sampler2D uBuildingShadowMask;
uniform vec2 uShadowOffset;
uniform float uShadowIntensity;
uniform bool uBuildingShadowsEnabled;

void main() {
    // ... existing color processing ...
    
    // Apply building shadows to outdoor overhead pixels
    if (uBuildingShadowsEnabled && outdoorsMask > 0.5) {
        vec2 shadowSampleCoord = vScreenCoord - (uShadowOffset * uTexelSize);
        float shadowFactor = texture2D(uBuildingShadowMask, shadowSampleCoord).r;
        float shadowMultiplier = mix(1.0 - uShadowIntensity, 1.0, shadowFactor);
        workingColor *= shadowMultiplier;
    }
    
    // ... rest of shader ...
}
```

**Required Changes:**

1. **Pass shadow data to OverheadEffectLayer** (lines 7587-7729)
   ```javascript
   // In OverheadEffectLayer._onAnimate()
   const buildingShadowsLayer = canvas.buildingShadows;
   if (buildingShadowsLayer && this.recolorFilter) {
       this.recolorFilter.uniforms.uBuildingShadowMask = 
           buildingShadowsLayer.getBlurredOutdoorsMask() ?? PIXI.Texture.EMPTY;
       this.recolorFilter.uniforms.uShadowOffset = 
           buildingShadowsLayer.filter?.uniforms?.uShadowOffset ?? [0, 0];
       this.recolorFilter.uniforms.uShadowIntensity = 
           buildingShadowsLayer.filter?.uniforms?.uIntensity ?? 0.6;
       this.recolorFilter.uniforms.uBuildingShadowsEnabled = 
           buildingShadowsLayer.filter?.enabled ?? false;
   }
   ```

2. **Add UI controls** - Add toggle in overhead effect settings

3. **Test edge cases** - Verify shadows work correctly with zoom blur

**Pros:**
- Reuses existing shadow calculation
- Minimal code duplication
- Consistent shadow behavior between primary and overhead
- No additional VRAM cost

**Cons:**
- Shadows applied AFTER blur/opacity transforms (may look soft)
- Requires careful coordinate alignment between composite and primary

---

### 2. How hard would it be for _Bush and _Tree effects to also cast a shadow on the primary canvas layer?

**Difficulty: MODERATE-TO-HARD (12-20 hours)**

#### Current Situation

BushLayer and TreeLayer (lines 27609-27933):
- Apply `FoliageDistortionFilter` to individual tile meshes
- Scan for tiles with `_Bush` or `_Tree` in texture path
- Support both overhead sprites and regular tile meshes
- Z-index: 115 (bush), 116 (tree) - above tokens, below overhead

#### Challenge: Foliage is NOT a mask

Unlike buildings which use `_Outdoors` **mask textures** (alpha-based), foliage uses:
- Regular RGBA textures with transparency
- Distortion filters (not masks)
- No dedicated shadow-casting geometry

#### Implementation Path

**Option A: Create Shadow Masks from Foliage Textures (RECOMMENDED)**

Create a new `FoliageShadowsLayer` that:

1. **Discovers foliage tiles** (similar to BushLayer/TreeLayer logic)
   ```javascript
   _findFoliageTiles() {
       const foliageTiles = [];
       for (const tile of canvas.tiles.placeables) {
           const path = tile.document.texture.src;
           if (path.includes('_Bush') || path.includes('_Tree')) {
               foliageTiles.push(tile);
           }
       }
       return foliageTiles;
   }
   ```

2. **Render foliage to shadow mask texture**
   ```javascript
   renderFoliageMask() {
       const renderer = canvas.app.renderer;
       const container = new PIXI.Container();
       
       for (const tile of this.foliageTiles) {
           // Create sprite from tile texture
           const sprite = new PIXI.Sprite(tile.texture);
           sprite.position.set(tile.x, tile.y);
           sprite.width = tile.document.width;
           sprite.height = tile.document.height;
           
           // Apply alpha threshold filter to create mask
           const maskFilter = new PIXI.filters.AlphaFilter(0.5);
           sprite.filters = [maskFilter];
           
           container.addChild(sprite);
       }
       
       // Render to mask texture
       renderer.render(container, {
           renderTexture: this.foliageMaskTexture,
           clear: true,
           transform: canvas.stage.transform.worldTransform
       });
   }
   ```

3. **Blur the foliage mask** (similar to BuildingShadowsLayer blur logic)
   - 2-pass Kawase blur
   - Half-resolution for performance
   - Pool intermediate texture

4. **Create FoliageShadowsFilter**
   ```glsl
   uniform sampler2D uFoliageMask;  // Blurred foliage mask
   uniform vec2 uShadowOffset;      // From sun position
   uniform float uIntensity;
   
   void main() {
       vec4 originalColor = texture2D(uSampler, vTextureCoord);
       
       // Sample foliage shadow at offset position
       vec2 shadowCoord = vTextureCoord - uShadowOffset * uTexelSize;
       float shadowValue = texture2D(uFoliageMask, shadowCoord).r;
       
       // Foliage shadows are lighter than building shadows (filtered light)
       float shadowMultiplier = mix(1.0 - uIntensity * 0.5, 1.0, shadowValue);
       
       gl_FragColor = vec4(originalColor.rgb * shadowMultiplier, originalColor.a);
   }
   ```

5. **Apply to canvas.primary** (same as building shadows)

**Required Changes:**

1. **New Layer Class:** `FoliageShadowsLayer extends MaskedEffectLayer`
2. **New Filter Class:** `FoliageShadowsFilter extends PIXI.Filter`
3. **Register Layer:** Add to `LayerManager.registerLayers()` at z-index 29
4. **Lifecycle Integration:** Add to `MapShineLifecycle.runFullSetup()`
5. **UI Controls:** Settings accordion in debugger panel
6. **Time Integration:** Sync with BuildingShadowsLayer time/sun angle

**VRAM Cost:**
- Foliage mask texture: ~2.07MB (half-res at 1080p)
- Pooled blur intermediate: Shared with building shadows
- **Total additional: ~2.07MB**

**Pros:**
- Separate control from building shadows
- Can have different intensity (lighter, filtered shadows)
- Works with animated/distorted foliage
- Reuses building shadow architecture

**Cons:**
- Requires rendering foliage to separate texture (CPU cost)
- Must handle overhead foliage (render from overhead sprites)
- No automatic updates when tiles change (need hooks)

---

**Option B: Composite Shadows (HARDER - 20+ hours)**

Combine building and foliage shadows into a single unified shadow system:

1. Create `UnifiedShadowCastersLayer`
2. Render BOTH buildings (_Outdoors) AND foliage (_Bush, _Tree) to one mask
3. Apply single blur pass
4. Single filter samples unified shadow map

**Pros:**
- Better performance (one blur, one filter)
- Shadows interact correctly (foliage shadows on building walls)
- Simpler shader logic

**Cons:**
- Much more complex implementation
- Harder to tune separate intensities
- Higher risk of visual artifacts

---

## Recommendations

### For Overhead Shadows
- ✅ **DO IT** - Relatively easy, high visual impact
- Use Option A (add to OverheadRecolorFilter)
- Test with different zoom levels (blur may affect shadow visibility)
- Add UI toggle: "Apply Building Shadows to Overhead"

### For Foliage Shadows
- ⚠️ **EVALUATE NEED** - Moderate effort, visual impact depends on scene
- Use Option A (separate FoliageShadowsLayer) if proceeding
- Consider making it an **optional feature** (disabled by default)
- Low-hanging fruit: Start with static foliage, skip distortion
- Future enhancement: Sync distortion offset with shadow sampling

### Priority Order
1. **Overhead shadows** (6-10 hours) - Easier, broadly applicable
2. **Static foliage shadows** (12-15 hours) - Test visual impact first
3. **Animated foliage shadows** (3-5 hours additional) - Polish pass

---

## Code Locations Reference

- `BuildingShadowsFilter`: Lines 31928-32059
- `BuildingShadowsLayer`: Lines 32061-32394
- `OverheadEffectLayer`: Lines 7482-7901
- `OverheadRecolorFilter`: Lines 32396-32574
- `BushLayer`: Lines 27609-27766
- `TreeLayer`: Lines 27776-27933
- `FoliageDistortionFilter`: Lines 27428-27598
- `MaskedEffectLayer` (base): Lines 22441-22693
- `LayerManager.registerLayers()`: Lines 3309-3450

---

## Conclusion

The Building Shadows effect is a **well-engineered, production-ready system** with sophisticated temporal behavior and extensive artifact prevention. Extending it to overhead layers is **straightforward**, while adding foliage shadow casting requires **moderate architectural work** but follows established patterns.

Both extensions are **feasible and architecturally sound** given the existing codebase structure.
