# Wind Direction System Analysis Report

## Problem Summary
The cloud movement is 90 degrees counter-clockwise from particles and windsock direction.

## Wind Convention Standard
The system uses standard meteorological/compass convention:
- **0°** = East (right, +X direction)
- **90°** = North (up, -Y in screen coordinates)
- **180°** = West (left, -X direction)
- **270°** = South (down, +Y in screen coordinates)

## Screen Coordinate System
Canvas/PIXI uses inverted Y-axis:
- **X-axis**: increases to the right (East)
- **Y-axis**: increases DOWNWARD (South) - opposite of mathematical convention

---

## Component Analysis

### 1. WindManager (Lines 13410-13566) ✅ CORRECT
**Purpose**: Central source of truth for wind angle and speed

**Output**:
- `angle`: Wind angle in degrees (0° = East)
- `speed`: Current wind speed
- `smoothedAngle`: Long-term averaged angle for clouds
- `smoothedSpeed`: Long-term averaged speed for clouds

**Status**: ✅ Working as intended - provides standard angle values

---

### 2. Particles - WindBehavior (Lines 16269-16341) ✅ CORRECT
**Code** (lines 16310-16314):
```javascript
const windAngleRad = windManager.angle * (Math.PI / 180.0);
const windForce = windManager.speed * this.config.force;
const windAccelX = Math.cos(windAngleRad) * windForce;
// Negate Y for screen coordinates (Y increases downward)
const windAccelY = -Math.sin(windAngleRad) * windForce;
```

**Behavior**:
- Uses `windManager.angle` directly
- Applies standard trigonometry
- Negates Y component for screen coordinates
- Directly updates particle positions

**Status**: ✅ Working correctly - particles move in the correct direction

---

### 3. Windsock Display (Lines 30370-30403) ✅ CORRECT
**Code** (line 30394):
```javascript
arrow.style.transform = `rotate(${angle + 90}deg) scaleY(${scale})`;
```

**Behavior**:
- Adds 90° to align with standard wind direction
- CSS rotation 0° points up (north), but wind angle 0° = east
- The +90° adjustment makes them align

**Status**: ✅ Working correctly - windsock points in the wind direction

---

### 4. CloudShadowsLayer (Lines 24369-24450) ⚠️ ISSUE IDENTIFIED
**Code** (lines 24390-24412):
```javascript
// Complex wind mode (linkToWind = true)
const windAngleRad = windManager.smoothedAngle * (Math.PI / 180.0);
const windForceMagnitude = windManager.smoothedSpeed * (windConfig.linkedWindForce ?? 0.001);
const accelX = Math.cos(windAngleRad) * windForceMagnitude;
// Negate Y for screen coordinates (Y increases downward)
const accelY = -Math.sin(windAngleRad) * windForceMagnitude;
this._cloudVelocity.x += accelX * deltaInSeconds;
this._cloudVelocity.y += accelY * deltaInSeconds;
// ... drag and max speed ...
// Negate when passing to shader because UV scrolling moves pattern opposite to scroll direction
u.u_windDirection = [-this._cloudVelocity.x, -this._cloudVelocity.y];
```

**Simple wind mode** (lines 24414-24420):
```javascript
const simpleAngleRad = (windConfig.angle ?? 45.0) * (Math.PI / 180.0);
const simpleSpeed = windConfig.speed ?? 0.01;
this._cloudVelocity.x = Math.cos(simpleAngleRad) * simpleSpeed;
// Negate Y for screen coordinates (Y increases downward)
this._cloudVelocity.y = -Math.sin(simpleAngleRad) * simpleSpeed;
// Negate when passing to shader because UV scrolling moves pattern opposite to scroll direction
u.u_windDirection = [-this._cloudVelocity.x, -this._cloudVelocity.y];
```

**The Problem**:
1. Calculates velocity with correct screen coordinate conversion (Y negated)
2. Then negates BOTH X and Y when passing to shader
3. This double negation causes the 90° rotation issue

**Why Double Negation?**:
The comment says "UV scrolling moves pattern opposite to scroll direction". This is true for UV scrolling, BUT:
- When you ADD a positive X velocity to UV, the pattern moves LEFT (west)
- When you ADD a positive Y velocity to UV, the pattern moves DOWN (south)

However, the screen coordinate Y is already inverted. So:
- `_cloudVelocity.y` is negative for northward wind (already correct for UV scrolling)
- Negating it AGAIN makes it positive, which moves pattern south instead of north

**Status**: ⚠️ **INCORRECT** - Double negation causing 90° rotation

---

### 5. StructuralShadowsLayer (Lines 25975-25980) ⚠️ INHERITS ISSUE
**Code**:
```javascript
const cloudLayer = canvas.layers.find(l => l instanceof CloudShadowsLayer);
if (cloudLayer && cloudLayer._cloudVelocity) {
  u.u_windDirection = [-cloudLayer._cloudVelocity.x, -cloudLayer._cloudVelocity.y];
}
```

**Behavior**:
- Copies the already-double-negated wind direction from CloudShadowsLayer
- Inherits the same incorrect behavior

**Status**: ⚠️ **INCORRECT** - Inherits cloud layer's double negation issue

---

### 6. Rain Shader (Lines 14125-14235) ⚠️ POTENTIAL ISSUE
**Code** (lines 14138-14163):
```javascript
const windAngleRad = (windManager.angle * Math.PI / 180);
// ...
// Rain rotation: map wind angle to shader rotation
// Add π/2 (90°) to align rain direction with wind
const weatherConfig = game.mapShine?.profileManager?.getConfig()?.weather;
const rotationOffset = weatherConfig?.rain?.rotation ?? 0;
rainEffect.shader.uniforms.rotation = -windAngleRad + (Math.PI / 2) + rotationOffset;
```

**Behavior**:
- Takes wind angle in radians
- Negates it
- Adds π/2 (90°)
- This creates a complex transformation

**Analysis**:
- If wind is 0° (East), rotation = -0 + π/2 = π/2 (90°)
- If wind is 90° (North), rotation = -π/2 + π/2 = 0
- This appears to be rotating 90° counter-clockwise from wind direction

**The Issue**: The shader uses `rot(rotation)` function which applies a 2D rotation matrix. The rain shader then rotates the UV coordinates before sampling, but the relationship between wind angle and visual result may not be intuitive.

**Status**: ⚠️ **NEEDS VERIFICATION** - Complex rotation math may not align with wind

---

## Recommendations

### Fix 1: Debug the Shader Coordinate System
**Priority: CRITICAL**

Add debug logging to verify the actual wind direction values:
```javascript
// In CloudShadowsLayer.renderEffectNow(), after setting u_windDirection
console.log(`Wind Debug: angle=${windManager.smoothedAngle.toFixed(1)}°, ` +
            `velocity=(${this._cloudVelocity.x.toFixed(4)}, ${this._cloudVelocity.y.toFixed(4)}), ` +
            `shader=(${u.u_windDirection[0].toFixed(4)}, ${u.u_windDirection[1].toFixed(4)})`);
```

Test with wind at 0°, 90°, 180°, 270° and observe cloud movement.

### Fix 2: Check Shader UV Application
**Priority: CRITICAL**

Inspect the CloudShadowsFilter fragment shader (lines 23727, 23740, 23752, etc.):
```glsl
layer1_uv += u_time * u_windDirection * u_layer1_speed;
```

Verify:
1. Is `u_windDirection` being used correctly?
2. Are there any transforms applied before this line?
3. Is the noise function using (x,y) or (y,x)?

### Fix 3: Unified Wind Application Helper
**Priority: HIGH**

Create a centralized wind calculation utility:
```javascript
class WindDirectionHelper {
  /**
   * Get wind direction for direct position updates (particles, ropes)
   * Returns screen-space velocity vector
   */
  static getScreenSpaceVelocity(windManager, speed) {
    const angleRad = windManager.angle * (Math.PI / 180);
    return {
      x: Math.cos(angleRad) * speed,
      y: -Math.sin(angleRad) * speed  // Negate for screen coords
    };
  }
  
  /**
   * Get wind direction for UV scrolling (clouds, water displacement)
   * Returns UV scroll vector (negated from screen space)
   */
  static getUVScrollVector(windManager, speed) {
    const velocity = this.getScreenSpaceVelocity(windManager, speed);
    return {
      x: -velocity.x,  // Negate for UV scrolling
      y: -velocity.y
    };
  }
  
  /**
   * Get wind rotation for shader rotation matrices (rain, fog)
   * Returns rotation in radians
   */
  static getRotationRadians(windManager, offsetDegrees = 0) {
    return ((windManager.angle + offsetDegrees) % 360) * (Math.PI / 180);
  }
}
```

### Fix 4: Verify Rain Shader Wind Integration
**Priority: MEDIUM**

The rain shader applies wind as rotation rather than velocity:
```javascript
rainEffect.shader.uniforms.rotation = -windAngleRad + (Math.PI / 2) + rotationOffset;
```

This should be tested to ensure rain falls at the correct angle.

### Fix 5: Add Visual Wind Direction Indicator
**Priority: LOW**

Add a debug overlay showing:
- Wind angle as text
- Arrow pointing in wind direction
- Separate indicators for particles vs clouds
- This will make misalignments immediately obvious

---

## Testing Protocol

1. **Set wind to 0° (East)**
   - ✅ Windsock points right
   - ✅ Particles drift right
   - ❓ Clouds drift right (currently drifting up?)
   - ❓ Rain falls at rightward angle

2. **Set wind to 90° (North)**
   - ✅ Windsock points up
   - ✅ Particles drift up
   - ❓ Clouds drift up (currently drifting left?)
   - ❓ Rain falls at upward angle

3. **Set wind to 180° (West)**
   - ✅ Windsock points left
   - ✅ Particles drift left
   - ❓ Clouds drift left (currently drifting down?)
   - ❓ Rain falls at leftward angle

4. **Set wind to 270° (South)**
   - ✅ Windsock points down
   - ✅ Particles drift down  
   - ❓ Clouds drift down (currently drifting right?)
   - ❓ Rain falls at downward angle

---

## Next Steps

1. **Immediate**: Add debug logging to CloudShadowsLayer to confirm wind vector values
2. **Verify**: Test with cardinal directions (0°, 90°, 180°, 270°) to confirm 90° rotation
3. **Inspect**: Examine CloudShadowsFilter shader code for coordinate transforms
4. **Fix**: Likely need to swap X/Y or adjust sign in shader UV application
5. **Validate**: Ensure rain shader also aligns with corrected system
6. **Refactor**: Implement WindDirectionHelper for consistency across all systems

---

## Root Cause (Updated After Analysis)

The primary issue is in **CloudShadowsLayer** (lines 24412 and 24420):

```javascript
// PROBLEM: Double negation
u.u_windDirection = [-this._cloudVelocity.x, -this._cloudVelocity.y];
```

### Why This Is Wrong

1. `_cloudVelocity.y` is calculated as `-Math.sin(windAngleRad) * speed`
2. For 0° wind (East): `velocityY = -sin(0) = 0` ✅ Correct
3. For 90° wind (North): `velocityY = -sin(π/2) = -1` ✅ Correct (negative Y = upward)
4. **BUT** then it negates again: `u.u_windDirection[1] = -(-1) = 1`
5. In shader: `uv.y += 1 * time` makes pattern move DOWN (south)
6. **Result**: 90° wind (North) makes clouds move South (opposite direction)

### Detailed Mathematical Trace

**Particles (CORRECT)**:
```javascript
// Wind 0° (East)
windAngleRad = 0
windAccelX = cos(0) * force = force (positive X, rightward)
windAccelY = -sin(0) * force = 0
→ Particle moves EAST ✅

// Wind 90° (North)  
windAngleRad = π/2
windAccelX = cos(π/2) * force = 0
windAccelY = -sin(π/2) * force = -force (negative Y, upward)
→ Particle moves NORTH ✅
```

**Clouds (INCORRECT - 90° Rotation)**:
```javascript
// Wind 0° (East)
windAngleRad = 0
accelX = cos(0) * force = force
accelY = -sin(0) * force = 0
_cloudVelocity = {x: force, y: 0}
u_windDirection = [-force, 0]  // Negated
Shader: layer_uv.x += -force * time → uv.x decreases
Result: Pattern samples from LEFT side of texture → pattern appears to move RIGHT ✅

// Wind 90° (North)
windAngleRad = π/2  
accelX = cos(π/2) * force = 0
accelY = -sin(π/2) * force = -force
_cloudVelocity = {x: 0, y: -force}
u_windDirection = [0, force]  // Negated Y becomes positive!
Shader: layer_uv.y += force * time → uv.y increases
Result: Pattern samples from BELOW → pattern appears to move UP
```

Wait, both seem correct mathematically. **The issue must be elsewhere!**

### Re-examining the Evidence

Let me reconsider what "90° counter-clockwise" actually means:
- If windsock points EAST, clouds move NORTH
- If windsock points NORTH, clouds move WEST

This is a **90° LEFT ROTATION**, which suggests **X and Y are swapped** somewhere!

**Hypothesis: The shader is using (Y, X) instead of (X, Y)**

Looking at the shader code:
```glsl
layer1_uv += u_time * u_windDirection * u_layer1_speed;
```

The shader receives `u_windDirection` as a `vec2`. Let me check how it's being used...

### FOUND THE BUG!

Looking at line 24412 and 24420, the issue is that the negation logic is creating the wrong mapping. Let me trace what SHOULD happen:

**For UV scrolling to work correctly:**
- When wind blows EAST (0°), clouds should drift EAST (pattern moves right)
  - To make pattern move right, we sample from the LEFT → decrease UV.x
  - Need u_windDirection.x = NEGATIVE
  - velocity.x = cos(0) = +1 → u_windDirection.x = -1 ✅

- When wind blows NORTH (90°), clouds should drift NORTH (pattern moves up)
  - In screen space: UP = negative Y
  - To make pattern move up, we sample from BELOW → increase UV.y
  - Need u_windDirection.y = POSITIVE  
  - velocity.y = -sin(90°) = -1 → u_windDirection.y = -(-1) = +1 ✅

So mathematically the double negation IS correct!

**BUT** - I need to check if there's a coordinate system mismatch in the shader itself.

### Alternative Theory: Shader UV Coordinate System

The shader might be using a different UV coordinate system than expected. Let me check if the shader has any transforms applied to the coordinates before using `u_windDirection`.

Actually, looking at the reported behavior more carefully:
- "clouds 90 degrees counter clockwise to particles"
- This means if particles go EAST (0°), clouds go NORTH (90°)

This is **swapping X and Y axes with a sign change**. The formula for 90° CCW rotation is:
```
new_x = -old_y
new_y = old_x
```

Let's see if this matches:
- Wind East: particles (X=1, Y=0), clouds should be (-Y, X) = (0, 1) = North ✅
- Wind North: particles (X=0, Y=-1), clouds should be (-Y, X) = (1, 0) = East ✅

This confirms **X and Y are swapped**, likely in how the shader applies the wind direction!

---

## Summary of Root Causes

### Primary Issue: Coordinate System Mismatch

The CloudShadowsLayer calculates wind direction correctly for screen/world coordinates, but the shader is applying it with **X and Y swapped or rotated**.

Possible causes:
1. The shader's noise function uses (y, x) instead of (x, y)
2. The layer_uv coordinate system is rotated 90° from world space
3. The stretch/scale vectors are being applied in the wrong order

### Secondary Issue: Inconsistent Wind Integration

Different systems use wind in different ways:
- **Particles**: Direct position updates with screen coordinates
- **Clouds**: UV scrolling with double negation
- **Rain shader**: Rotation-based with π/2 offset

This creates a fragile system where each component implements wind differently.

---

## Conclusion

**Status**: The wind direction system has a **90° coordinate mismatch** between particles/windsock (which work correctly) and clouds (which are rotated 90° CCW).

**Most Likely Cause**: The CloudShadowsFilter shader is applying `u_windDirection` with **X and Y swapped** or there's a coordinate transform that rotates the wind vector by 90°.

**Immediate Action Required**:
1. Add debug logging to confirm wind values at each stage
2. Test with cardinal directions to verify the exact rotation
3. Inspect shader code for coordinate transforms or swapped axes
4. Apply fix (likely swap X/Y or adjust signs in shader)

**Long-term Improvement**:
Implement a unified `WindDirectionHelper` class to ensure all systems calculate wind direction consistently, preventing future mismatches.
