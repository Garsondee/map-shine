# Structural Effect Enhancement Plan

## Current Implementation Analysis

### Architecture
- **StructuralFilter** applies to `canvas.primary.filters`
- **MetallicShineLayer** renders as a separate canvas layer on top
- Current blend mode: Multiply (default), which darkens everything

### Rendering Order
```
canvas.primary (tiles, drawings, etc.)
  ├─ CloudShadows filter
  ├─ Canopy filter  
  ├─ Structural filter ← Applied here
  ├─ Water filter
  ├─ Building Shadows filter
  └─ TimeOfDay filter

MetallicShineLayer (separate layer, rendered on top)
```

## Enhancement Requests

### 1. RGB Split (Chromatic Aberration)
**Goal**: Simulate light diffraction through thick window glass on brightest parts

**Implementation**:
- Add threshold-based RGB split that only affects bright areas of _Structural mask
- Use smoothstep to create smooth transition
- Configurable:
  - `rgbSplit.enabled` (bool)
  - `rgbSplit.amount` (0-10 pixels)
  - `rgbSplit.threshold` (0-1, brightness level)
  - `rgbSplit.softness` (0-1, transition smoothness)

**Shader Logic**:
```glsl
if (rgbSplitEnabled) {
  float luminance = dot(structuralColor, lum_weights);
  float splitMask = smoothstep(
    rgbSplitThreshold - rgbSplitSoftness,
    rgbSplitThreshold + rgbSplitSoftness,
    luminance
  );
  
  if (splitMask > 0.01) {
    vec2 offset = vec2(rgbSplitAmount * texelSize.x, 0.0) * splitMask;
    vec3 r = texture2D(uStructuralMask, vScreenCoord - offset).rgb;
    vec3 g = structuralColor; // center sample
    vec3 b = texture2D(uStructuralMask, vScreenCoord + offset).rgb;
    structuralColor = vec3(r.r, g.g, b.b);
  }
}
```

### 2. Exposure Control
**Goal**: Boost brightness to make window light "pop"

**Implementation**:
- Add `exposure` parameter to color correction (-3 to +3)
- Apply BEFORE other color corrections for proper HDR-style boost
- Formula: `color = color * pow(2.0, exposure)`

**Updated Color Correction Order**:
1. Exposure (HDR boost)
2. Gamma
3. Brightness
4. Contrast
5. Saturation
6. Tint

### 3. Metallic Shine Preservation
**Issue Investigation**: 
The Structural filter affects `canvas.primary`, but MetallicShineLayer renders as a separate layer on top. They SHOULD NOT interact directly.

**Potential Problem**:
If the _Structural mask overlaps with _Specular mask areas, the structural effect darkens the scene tiles underneath where metallic objects would shine.

**Solution**:
- Sample the metallic shine specular mask
- Where both _Structural AND _Specular are bright, blend additively instead of multiply
- This allows bright structural window light to preserve/enhance metallic reflections

**Implementation**:
```glsl
uniform sampler2D uMetallicMask; // From MetallicShineLayer

// In main():
float metallicLuminance = dot(texture2D(uMetallicMask, vScreenCoord).rgb, lum_weights);
float structuralLuminance = dot(structuralColor, lum_weights);

// If both are bright, use additive blending instead
if (metallicLuminance > 0.5 && structuralLuminance > 0.5) {
  // Additive blend preserves brightness
  effectColor = originalColor.rgb + effectLayer;
} else {
  // Normal blend modes
  effectColor = blend(originalColor.rgb, effectLayer);
}
```

## Configuration Schema Additions

```javascript
"structuralShadows": {
  // ... existing config ...
  "colorCorrection": {
    "enabled": true,
    "exposure": 0.0,        // NEW: -3 to +3
    "saturation": 1,
    "brightness": -0.01,
    "contrast": 0.6,
    "gamma": 1.2,
    "tint": { ... }
  },
  "rgbSplit": {              // NEW
    "enabled": false,
    "amount": 2.0,           // pixels
    "threshold": 0.7,        // 0-1
    "softness": 0.2          // 0-1
  },
  "metallicPreservation": {  // NEW
    "enabled": true,
    "threshold": 0.5,        // brightness level
    "blendMode": 1           // 1=Add, 3=Screen
  }
}
```

## UI Additions

### RGB Split Section
```html
<details id="details-structuralShadows-rgbSplit">
  <summary>
    <span class="accordion-toggle"></span>
    <div class="summary-control">
      <checkbox> RGB Split (Glass Diffraction)
    </div>
  </summary>
  <p>Simulates light diffraction through thick window glass on the brightest areas.</p>
  <slider> Amount (0-10 px)
  <slider> Brightness Threshold (0-1)
  <slider> Threshold Softness (0-1)
</details>
```

### Updated Color Correction
```html
<details id="details-structuralShadows-colorCorrection">
  ...
  <slider> Exposure (-3 to +3) <!-- NEW, at top -->
  <slider> Saturation
  <slider> Brightness
  <slider> Contrast
  <slider> Gamma
  ...
</details>
```

### Metallic Preservation
```html
<details id="details-structuralShadows-metallicPreservation">
  <summary>
    <span class="accordion-toggle"></span>
    <div class="summary-control">
      <checkbox> Preserve Metallic Shine
    </div>
  </summary>
  <p>Prevents structural effect from darkening metallic/reflective surfaces.</p>
  <slider> Brightness Threshold (0-1)
  <select> Blend Mode (Add / Screen)
</details>
```

## Implementation Checklist

- [ ] Add shader uniforms for RGB split
- [ ] Add shader uniforms for exposure
- [ ] Add shader uniforms for metallic preservation
- [ ] Implement RGB split logic in fragment shader
- [ ] Add exposure to color correction chain
- [ ] Add metallic mask sampling and preservation logic
- [ ] Update MODULE_DEFAULTS configuration
- [ ] Add UI controls for RGB split
- [ ] Add exposure slider to color correction
- [ ] Add UI controls for metallic preservation
- [ ] Update StructuralShadowsLayer.updateFromConfig()
- [ ] Update StructuralShadowsLayer._onAnimate() to pass metallic mask
- [ ] Test visual results
- [ ] Update version to 1.1.52

## Testing Plan

1. **RGB Split Testing**:
   - Create scene with bright _Structural window light
   - Enable RGB split, adjust amount to 3-5px
   - Verify chromatic aberration only on bright areas
   - Verify smooth falloff with threshold/softness

2. **Exposure Testing**:
   - Set exposure to +1.0, +2.0, +3.0
   - Verify window light "pops" without hard clipping
   - Test with different base brightness values

3. **Metallic Preservation**:
   - Create overlapping _Structural and _Specular masks
   - Verify metallic shine isn't darkened by structural effect
   - Test different blend modes (Add vs Screen)

## Expected Visual Results

- **RGB Split**: Subtle rainbow fringe on bright window edges (realistic glass diffraction)
- **Exposure**: Bright, HDR-style window light that stands out from darker interiors
- **Metallic Preservation**: Shiny metal objects in window light maintain their reflective quality
