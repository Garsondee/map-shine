# Atmospheric Lightning Flash Enhancement

**Status:** 🔶 PLANNED - Not Yet Implemented  
**Priority:** Medium  
**Estimated Effort:** 3-5 hours  
**Target Date:** Tomorrow

---

## Overview

Add atmospheric lightning flashes to the weather system that respect Foundry VTT's wall/door/window system by leveraging the existing illumination buffer. This creates physically accurate lighting where flashes are bright outdoors, dim in shadows, and blocked by walls - without any raycasting or wall data processing.

## The Key Insight

**Foundry VTT already does all the hard work!**

A really strong way to approach this would be to temporarily create a light in the very border of the Foundry VTT Scene, and then have that light rapidly fade from 9999 bright to something more reasonable and then slowly fade down to nothing over the course of a few seconds. This will illuminate interior spaces which aren't blocked by other buildings and will cause light to stream through windows.


Another approach would be:


The `canvas.effects.illumination.texture` render texture contains:
- ✅ Wall occlusion (fully calculated)
- ✅ Door states (open/closed)
- ✅ Window transparency
- ✅ Light falloff and vision blocking
- ✅ All raycasting already computed

By multiplying our lightning flash against this texture, we inherit ALL of Foundry's lighting logic for free.

---

## Implementation Approach

### Phase 1: Simple Atmospheric Flash (2-3 hours)

Create basic full-screen lightning pulse without wall awareness.

**Benefits:**
- Quick to implement
- Works immediately
- Good for testing timing/color/intensity
- Looks fine for distant lightning

**Shader Code:**
```glsl
// In AtmosphericShader.js fragment shader
uniform float u_lightningIntensity;  // 0-1, pulsed from CPU
uniform vec3 u_lightningColor;       // Blueish white [0.8, 0.9, 1.0]
uniform vec2 u_lightningOrigin;      // Sky position (0.5, 0.0 = top center)

void main() {
  // Simple radial gradient from sky
  float dist = distance(vUvs, u_lightningOrigin);
  float flash = u_lightningIntensity * smoothstep(1.0, 0.2, dist);
  
  vec3 lightningFlash = u_lightningColor * flash;
  gl_FragColor = vec4(lightningFlash, flash);
}
```

**CPU Integration:**
```javascript
// In WeatherSystemManager
_triggerLightning() {
  const config = game.mapShine?.profileManager?.activeConfig?.weather;
  if (!config?.lightning?.flashEnabled) return;
  
  const atmosphericShader = this.weatherEffectLayer.effects.get('atmospheric');
  if (!atmosphericShader) return;
  
  // Pulse intensity: 0 → 1 → 0 over ~150ms
  this._lightningIntensity = 1.0;
  const startTime = performance.now();
  const duration = config.lightning.flashDuration ?? 150;
  
  const animate = () => {
    const elapsed = performance.now() - startTime;
    const progress = elapsed / duration;
    
    if (progress < 1.0) {
      // Fast rise, slow fall
      this._lightningIntensity = progress < 0.3 
        ? progress / 0.3  // Rise in 30% of duration
        : 1.0 - ((progress - 0.3) / 0.7); // Fall in 70%
      
      atmosphericShader.shader.uniforms.u_lightningIntensity = this._lightningIntensity;
      requestAnimationFrame(animate);
    } else {
      this._lightningIntensity = 0;
      atmosphericShader.shader.uniforms.u_lightningIntensity = 0;
    }
  };
  
  animate();
}
```

---

### Phase 2: Physically Accurate Flash (+1-2 hours)

Enhance with Foundry's illumination texture for wall/door awareness.

**Benefits:**
- Physically accurate lighting
- Respects all Foundry lighting rules
- No custom raycasting needed
- Automatically handles walls/doors/windows

**Enhanced Shader Code:**
```glsl
// In AtmosphericShader.js fragment shader
uniform sampler2D u_illuminationTexture; // Foundry's lighting
uniform float u_lightningIntensity;      
uniform vec3 u_lightningColor;           
uniform vec2 u_lightningOrigin;          
uniform bool u_usePhysicalLighting;      // Toggle: simple vs accurate

void main() {
  // Calculate base flash strength
  float dist = distance(vUvs, u_lightningOrigin);
  float flashStrength = u_lightningIntensity * smoothstep(1.0, 0.2, dist);
  
  vec3 lightningFlash = u_lightningColor * flashStrength;
  
  if (u_usePhysicalLighting) {
    // Sample Foundry's pre-computed lighting
    vec4 currentLight = texture2D(u_illuminationTexture, vUvs);
    
    // Apply flash THROUGH existing lighting
    // Areas blocked by walls will naturally be darker/invisible
    lightningFlash *= (0.3 + currentLight.rgb * 0.7); // Blend 30% ambient + 70% lit
  }
  
  gl_FragColor = vec4(lightningFlash, flashStrength);
}
```

**Enhanced CPU Integration:**
```javascript
// In WeatherSystemManager._triggerLightning()
_triggerLightning() {
  const config = game.mapShine?.profileManager?.activeConfig?.weather;
  const atmosphericShader = this.weatherEffectLayer.effects.get('atmospheric');
  
  // Get Foundry's illumination texture (if available)
  const illuminationTexture = canvas.effects?.illumination?.texture;
  if (illuminationTexture?.valid) {
    atmosphericShader.shader.uniforms.u_illuminationTexture = illuminationTexture;
    atmosphericShader.shader.uniforms.u_usePhysicalLighting = true;
  } else {
    atmosphericShader.shader.uniforms.u_usePhysicalLighting = false;
  }
  
  // ... rest of pulse animation code from Phase 1 ...
}
```

---

## Integration Points

### 1. Create AtmosphericShader.js

New file: `scripts/weather/AtmosphericShader.js`

```javascript
import { WeatherShaderBase } from './WeatherShaderBase.js';

export class AtmosphericShader extends WeatherShaderBase {
  static defaultUniforms = {
    // Lightning flash
    u_lightningIntensity: 0,
    u_lightningColor: [0.8, 0.9, 1.0],
    u_lightningOrigin: [0.5, 0.0],
    u_usePhysicalLighting: false,
    u_illuminationTexture: null,
    
    // Screen-space rain streaks (future)
    u_rainStreakIntensity: 0,
    
    // Vignette darkening (future)
    u_vignetteStrength: 0,
    
    // Dust motes (future)
    u_dustMoteIntensity: 0
  };

  static fragmentShader = `
    ${this.FRAGMENT_HEADER}
    ${this.CONSTANTS}
    ${this.PRNG}
    
    // Lightning uniforms
    uniform float u_lightningIntensity;
    uniform vec3 u_lightningColor;
    uniform vec2 u_lightningOrigin;
    uniform bool u_usePhysicalLighting;
    uniform sampler2D u_illuminationTexture;
    
    void main() {
      ${this.COMPUTE_MASK}
      
      vec3 finalColor = vec3(0.0);
      float finalAlpha = 0.0;
      
      // === LIGHTNING FLASH ===
      if (u_lightningIntensity > 0.001) {
        float dist = distance(vUvs, u_lightningOrigin);
        float flashStrength = u_lightningIntensity * smoothstep(1.0, 0.2, dist);
        
        vec3 lightningFlash = u_lightningColor * flashStrength;
        
        if (u_usePhysicalLighting) {
          vec4 currentLight = texture2D(u_illuminationTexture, vUvs);
          lightningFlash *= (0.3 + currentLight.rgb * 0.7);
        }
        
        finalColor += lightningFlash;
        finalAlpha = max(finalAlpha, flashStrength);
      }
      
      // TODO: Add rain streaks, vignette, dust motes here in future
      
      gl_FragColor = vec4(finalColor, finalAlpha) * vec4(tint, 1.0) * mask * alpha;
    }
  `;
}
```

### 2. Add to WeatherEffectLayer

In `scripts/weather/WeatherEffectLayer.js`:

```javascript
import { AtmosphericShader } from './AtmosphericShader.js';

_createEffectInstances() {
  // ... existing rain/snow/fog effects ...
  
  // Create atmospheric enhancement effect
  const atmosphericEffect = new WeatherShaderEffect({
    u_lightningIntensity: 0
  }, AtmosphericShader);
  atmosphericEffect.blendMode = PIXI.BLEND_MODES.ADD; // Additive for brightness
  atmosphericEffect.zIndex = 3; // Render last
  this.weatherEffects.addChild(atmosphericEffect);
  this.effects.set('atmospheric', atmosphericEffect);
}
```

### 3. Trigger from WeatherSystemManager

In `scripts/module.js` WeatherSystemManager class:

```javascript
// Add to update() method
update(deltaTime) {
  // ... existing code ...
  
  // Trigger random lightning flashes during storm
  if (this.currentState === 'storm' || this.currentState === 'blizzard') {
    this._updateLightning(deltaTime);
  }
}

_updateLightning(deltaTime) {
  if (!this._lightningTimer) {
    this._lightningTimer = 0;
  }
  
  this._lightningTimer += deltaTime;
  
  const config = game.mapShine?.profileManager?.activeConfig?.weather;
  const minDelay = config?.lightning?.minFrequency ?? 5000; // 5 seconds
  const maxDelay = config?.lightning?.maxFrequency ?? 15000; // 15 seconds
  
  if (!this._nextLightningTime) {
    this._nextLightningTime = minDelay + Math.random() * (maxDelay - minDelay);
  }
  
  if (this._lightningTimer >= this._nextLightningTime) {
    this._triggerLightning();
    this._lightningTimer = 0;
    this._nextLightningTime = minDelay + Math.random() * (maxDelay - minDelay);
  }
}
```

### 4. Configuration Schema

Add to weather config in `UNIVERSAL_EFFECT_DEFAULTS.weather`:

```javascript
lightning: {
  flashEnabled: true,
  minFrequency: 5000,        // ms between flashes
  maxFrequency: 15000,       // ms between flashes
  flashDuration: 150,        // ms flash duration
  flashIntensity: 0.8,       // 0-1 brightness
  flashColor: {              // RGB color
    r: 0.8,
    g: 0.9,
    b: 1.0
  },
  usePhysicalLighting: true, // Use illumination buffer
  playThunderSound: false    // Future feature
}
```

---

## Existing Code References

Your codebase already accesses the illumination texture in diagnostics:

**Line 23279-23283 in module.js:**
```javascript
if (displaySuffix === "external_illumination") {
  fullscreenTexture = game.modules
    .get("illuminationbuffer")
    ?.api?.getLightingTexture();
}
```

**Line 23286-23288 in module.js:**
```javascript
if (displaySuffix === "external_lightingLayer") {
  fullscreenTexture = canvas.effects.illumination?.texture;
}
```

**Use the second approach** (`canvas.effects.illumination.texture`) as it's always available in Foundry VTT core.

---

## Testing Checklist

### Phase 1 (Simple Flash)
- [ ] Flash appears during storm weather
- [ ] Timing feels natural (not too frequent)
- [ ] Color is appropriate (blueish-white)
- [ ] Intensity is visible but not overwhelming
- [ ] Works across different scenes
- [ ] No performance issues

### Phase 2 (Physical Accuracy)
- [ ] Flash is bright in outdoor lit areas
- [ ] Flash is dim/dark in shadowed areas
- [ ] Flash doesn't penetrate walls
- [ ] Flash respects closed doors
- [ ] Flash passes through open doors
- [ ] Flash has correct intensity through windows
- [ ] Works with GM vs player vision differences

---

## Performance Considerations

**Expected Cost:**
- Simple flash: <0.1ms per frame (only when active)
- Physical flash: <0.2ms per frame (one texture sample)
- Memory: ~0MB (no additional textures)

**Optimization:**
- Flash only runs during storm/blizzard states
- Shader only active when `u_lightningIntensity > 0`
- No continuous animation when dormant

---

## Future Enhancements

Once lightning flash works, this shader can host additional atmospheric effects:

1. **Screen-space rain streaks** (droplets running down "camera")
2. **Storm vignette** (edge darkening during heavy weather)
3. **Dust motes** (subtle floating particles in sunlight)
4. **Heat shimmer** (screen distortion during hot weather)

All can share the same shader for minimal performance cost.

---

## Notes

- This is additive to your existing `LightningLayer` (bolt rendering)
- The bolt drawing is geometric/visual, this is atmospheric/lighting
- They can work together for maximum effect
- Consider triggering flash slightly before/during bolt appearance for synchronization

---

**Ready to implement tomorrow!** ⚡

