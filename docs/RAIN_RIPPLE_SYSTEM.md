# Rain Ripple Water Effect System

## Overview
The rain ripple system automatically enhances water wave distortion during rain weather states. Rain ripples are **ADDITIVE** to the base wave distortion, meaning the base wave effect always remains and rain adds extra ripples on top.

## How It Works

### 1. Weather State Detection
The `WeatherSystemManager` detects the current weather state and assigns a rain intensity multiplier:

- **CLEAR**: `0.0` (no rain ripples)
- **DRIZZLE**: `0.3` (30% rain ripple intensity)
- **RAIN**: `1.0` (100% rain ripple intensity) 
- **STORM**: `1.8` (180% rain ripple intensity - extra intense!)
- **SLEET**: `0.6` (60% rain ripple intensity)
- **SNOW/BLIZZARD**: `0.0` (no rain ripples)

### 2. Smooth Transitions
When weather changes (e.g., Clear → Rain → Storm), the system:
- Detects the transition using `this.isTransitioning`
- Interpolates between current and target rain intensities
- Uses `this.transitionProgress` (0-1) with eased timing
- Results in smooth, gradual ripple intensity changes

**Example Transition (Rain → Clear):**
```
Time 0s: rainIntensity = 1.0 (full rain ripples)
Time 2s: rainIntensity = 0.75 (fading out)
Time 5s: rainIntensity = 0.5 (halfway)
Time 8s: rainIntensity = 0.25 (almost gone)
Time 10s: rainIntensity = 0.0 (back to base wave only)
```

### 3. Additive Wave Distortion
The system calculates the final wave parameters additively:

```javascript
// Speed: Blended between base and rain speed
targetSpeed = lerp(baseSpeed, rainSpeed, rainIntensity)

// Scale: Blended between base and rain scale  
targetScale = lerp(baseScale, rainScale, rainIntensity)

// Intensity: BASE + RAIN (ADDITIVE!)
rainRippleAmount = rainRippleConfig.intensity × rainIntensity
targetIntensity = baseWaveIntensity + rainRippleAmount
```

**Key Point:** Rain ripples ADD to the base wave, they don't replace it!

### 4. Outdoor Masking
The shader applies wave distortion with outdoor mask modulation:

```glsl
// Sample outdoor mask (white = outdoor, black = indoor)
float outdoorsMaskValue = texture2D(u_outdoorsMask, vTextureCoord).r;

// Apply wave distortion only to outdoor water
wave_uv_offset = displacement × u_wave_intensity × outdoorsMaskValue;
```

**Result:**
- Indoor water (pools, fountains): Stays calm (no ripples)
- Outdoor water (ponds, rivers): Gets rain ripples during rain weather

## Configuration

### UI Controls (Water Effects → Wave Distortion → Rain Ripples)

**Enable Toggle:** `water.wave.rainRipple.enabled`
- Turn the entire rain ripple system on/off

**Rain Speed:** `water.wave.rainRipple.speed` (0-25)
- How fast the rain ripple animation plays
- Higher = faster, more chaotic water movement
- Default: 3.5

**Rain Scale:** `water.wave.rainRipple.scale` (0.1-40)
- Size/frequency of rain ripples
- Higher = smaller, tighter ripples
- Default: 15.0

**Rain Intensity:** `water.wave.rainRipple.intensity` (0-0.05)
- Strength of the distortion effect
- This is the maximum rain ripple intensity (at 100% rain state)
- Default: 0.015

### Weather State Multipliers (Automatic)

| Weather State | Intensity Multiplier | Effective Rain Intensity |
|--------------|---------------------|-------------------------|
| Clear        | 0.0×                | 0.000 (none)           |
| Drizzle      | 0.3×                | 0.0045 (light)         |
| Rain         | 1.0×                | 0.015 (normal)         |
| Storm        | 1.8×                | 0.027 (intense!)       |
| Sleet        | 0.6×                | 0.009 (moderate)       |

*Based on default intensity of 0.015*

## Example Behavior

### Scenario: Storm Transition
```
1. User changes weather dropdown: "Clear" → "Storm"
2. WeatherSystemManager.transitionToState("storm", 10000) called
3. Over 10 seconds:
   - rainIntensity smoothly interpolates 0.0 → 1.8
   - Wave speed blends from base (2.0) to rain (3.5)
   - Wave scale blends from base (10.0) to rain (15.0)
   - Wave intensity increases from base (0.01) to base+rain (0.01 + 0.027)
4. Result: Outdoor water gradually becomes more turbulent with rain ripples
5. Indoor water remains unaffected (outdoor mask = 0)
```

### Scenario: Rain to Clear
```
1. User changes weather: "Rain" → "Clear"
2. Over transition duration:
   - rainIntensity smoothly drops 1.0 → 0.0
   - Parameters return to base wave config values
   - Rain ripples fade out completely
3. Result: Water returns to calm base wave state
```

## Technical Details

### Code Locations

**Weather State Updates:**
- `WeatherSystemManager._applyRainRipples()` (lines 15177-15247)
- Called from `WeatherSystemManager.update()` (line 15116)
- Runs every frame, checks for transitions

**Wave Intensity Application:**
- `WaterFXLayer._onAnimate()` (lines 31800-31806)
- Uses `this._rainRippleIntensity` if set by weather system
- Falls back to base config if no rain ripples active

**Shader Outdoor Masking:**
- `WaterEffectsFilter` fragment shader (lines 30393-30401)
- Samples `u_outdoorsMask` texture
- Multiplies wave distortion by mask value

### State Storage

**Original Parameters:** `waterLayer._originalWaveParams`
- Stores base wave config (speed, scale, intensity)
- Captured on first rain ripple application
- Used as baseline for additive calculations

**Rain Ripple Intensity:** `waterLayer._rainRippleIntensity`
- Set by WeatherSystemManager each frame
- Contains base intensity + rain ripple amount
- Used by WaterFXLayer to override base config

## Benefits

✅ **Automatic Weather Integration** - No manual control needed, just change weather state
✅ **Smooth Transitions** - Rain ripples fade in/out naturally over transition duration
✅ **Additive Approach** - Base wave always present, rain adds on top
✅ **Outdoor-Only** - Indoor water unaffected by rain (uses _Outdoors mask)
✅ **Configurable** - UI controls allow tuning of rain ripple appearance
✅ **State-Aware** - Different intensities for drizzle/rain/storm

## Future Enhancements

- **Wind Direction Influence** - Rain ripples oriented by wind angle
- **Puddle Formation** - Additional rain effects for ground surfaces
- **Edge Droplets** - Particles spawning from building edges during rain
- **Rain Impact Normals** - Dynamic normal map distortion for rain hits
