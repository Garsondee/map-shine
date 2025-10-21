# Wind Direction Unification Report
**Date:** 2025-10-21  
**Status:** CRITICAL INCONSISTENCY IDENTIFIED  
**Priority:** HIGH

---

## Executive Summary

The Map Shine module has **inconsistent wind direction handling** across three major systems:
1. **Windsock display** - Points East (correct)
2. **Particles (WindBehavior)** - Move North (90° off)
3. **Clouds (CloudShadowsLayer)** - Move in same direction as particles (also 90° off)

The root cause is a **coordinate system confusion** between:
- Standard wind convention (0° = East)
- Screen coordinate Y-axis inversion
- UV scrolling inverse motion
- Shader coordinate transformations

---

## Wind Convention Standard

The system SHOULD use standard meteorological/compass convention:
- **0°** = East (wind blowing right, +X direction)
- **90°** = North (wind blowing up, -Y in screen coordinates)
- **180°** = West (wind blowing left, -X direction)  
- **270°** = South (wind blowing down, +Y in screen coordinates)

---

## System Analysis

### 1. WindManager ✅ CORRECT
**Location:** `module.js` lines 13422-13589  
**Purpose:** Single source of truth for wind angle and speed

**Output Properties:**
```javascript
windManager.angle          // Current angle in degrees (0° = East)
windManager.speed          // Current speed with gusts
windManager.smoothedAngle  // Long-term averaged angle for clouds
windManager.smoothedSpeed  // Long-term averaged speed (no gusts)
```

**Status:** ✅ **Working correctly** - provides standard angle values

---

### 2. Windsock Display ✅ CORRECT
**Location:** `module.js` lines 30463-30480  
**Code:**
```javascript
const angle = windManager.angle;
const strength = windManager.getNormalizedStrength();
const scale = strength * 0.45;

// Add 90 degrees to align with standard wind direction (0=East, 90=North, etc.)
arrow.style.transform = `rotate(${angle + 90}deg) scaleY(${scale})`;
```

**Behavior:**
- CSS rotation 0° points UP (north), but wind angle 0° = EAST (right)
- Adding +90° compensates: when angle=0°, rotation=90° (points right)
- When angle=90°, rotation=180° (points up)

**Status:** ✅ **Working correctly** - windsock points in the correct direction

---

### 3. Particles - WindBehavior ❌ CRITICAL ERROR
**Location:** `module.js` lines 16285-16356  
**Code:**
```javascript
updateParticle(particle, deltaSec) {
  const windManager = game.mapShine?.windManager;
  if (!particle.velocity || !windManager || !this.config.enabled) return;

  // 1. Get the current wind force from the manager.
  const windAngleRad = windManager.angle * (Math.PI / 180.0);
  const windForce = windManager.speed * this.config.force;
  const windAccelX = Math.cos(windAngleRad) * windForce;
  // Negate Y for screen coordinates (Y increases downward)
  const windAccelY = -Math.sin(windAngleRad) * windForce;  // ← NEGATED
  
  // ... turbulence code ...
  
  // 4. Update the particle's velocity based on the total acceleration.
  particle.velocity.x += totalAccelX * deltaSec;
  particle.velocity.y += totalAccelY * deltaSec;

  // 5. Update the particle's screen position based on its new velocity.
  particle.position.x += particle.velocity.x * deltaSec;
  particle.position.y += particle.velocity.y * deltaSec;
}
```

**The Problem - X and Y are SWAPPED!**

The math looks correct, but **user reports particles move 90° counter-clockwise** from the windsock/clouds.

**90° CCW Rotation Analysis:**

For wind angle 0° (East):
```javascript
windAccelX = cos(0) * force = +force  // Should move RIGHT
windAccelY = -sin(0) * force = 0
```
**Expected:** Particles move East (right)  
**Actual:** Particles move North (up) ❌

This is the transformation: `(x, y) → (-y, x)` = 90° counter-clockwise rotation!

**Mathematical Analysis:**

| Wind Angle | cos(θ) | sin(θ) | windAccelX | windAccelY | Expected | Actual (90° CCW) |
|------------|--------|--------|------------|-----------|----------|------------------|
| 0° (East)  | 1.0    | 0.0    | +force     | 0         | RIGHT    | UP ❌             |
| 90° (North)| 0.0    | 1.0    | 0          | -force    | UP       | LEFT ❌           |
| 180° (West)| -1.0   | 0.0    | -force     | 0         | LEFT     | DOWN ❌           |
| 270° (South)| 0.0   | -1.0   | 0          | +force    | DOWN     | RIGHT ❌          |

**Root Cause:** The PIXI.particles system is applying a 90° CCW rotation: `(x, y) → (-y, x)`

To compensate, we need to apply the **inverse transform** to our calculations.

**The Inverse Transform:**
If system applies: `(x, y) → (-y, x)`  
Then we need to pre-calculate: `(x, y) → (y, -x)` to get correct final result.

For wind velocity `(cos(θ), -sin(θ))`, apply inverse:
```javascript
// Current (wrong):
const windAccelX = Math.cos(windAngleRad) * windForce;
const windAccelY = -Math.sin(windAngleRad) * windForce;

// Correct (apply inverse transform):
const windAccelX = -Math.sin(windAngleRad) * windForce;  // Use -sin for X
const windAccelY = -Math.cos(windAngleRad) * windForce;  // Use -cos for Y
```

**Verification:**
- Wind 0° (East): Calculate (-sin(0), -cos(0)) = (0, -1)
- System applies 90° CCW: (-(-1), 0) = **(1, 0) = RIGHT ✓**
- Wind 90° (North): Calculate (-sin(90°), -cos(90°)) = (-1, 0)  
- System applies 90° CCW: (-(0), -1) = **(0, -1) = UP ✓**

**Status:** ❌ **BROKEN** - Needs inverse transform applied to compensate for particle system rotation

---

### 4. CloudShadowsLayer ✅ CORRECT
**Location:** `module.js` lines 24440-24492  
**Code:**
```javascript
renderEffectNow(deltaTime = canvas.app.ticker.deltaTime) {
  const windConfig = csConfig.wind;
  const deltaInSeconds = deltaTime / 1000;
  
  if (windConfig.linkToWind && game.mapShine.windManager?.config?.enabled) {
    const windManager = game.mapShine.windManager;
    // Use smoothedAngle for clouds to give them inertia and steady drift
    const windAngleRad = windManager.smoothedAngle * (Math.PI / 180.0);
    const windForceMagnitude = windManager.smoothedSpeed * (windConfig.linkedWindForce ?? 0.02);
    
    const accelX = Math.cos(windAngleRad) * windForceMagnitude;
    // Negate Y for screen coordinates (Y increases downward)
    const accelY = -Math.sin(windAngleRad) * windForceMagnitude;  // ← NEGATED
    
    this._cloudVelocity.x += accelX * deltaInSeconds;
    this._cloudVelocity.y += accelY * deltaInSeconds;
    
    // Apply drag and max speed limits
    const dragFactor = 1.0 - (windConfig.linkedDrag ?? 0.5) * deltaInSeconds;
    this._cloudVelocity.x *= dragFactor;
    this._cloudVelocity.y *= dragFactor;
    
    // Negate when passing to shader because UV scrolling moves pattern opposite to scroll direction
    u.u_windDirection = [-this._cloudVelocity.x, -this._cloudVelocity.y];  // ← DOUBLE NEGATION!
  } else {
    const simpleAngleRad = (windConfig.angle ?? 45.0) * (Math.PI / 180.0);
    const simpleSpeed = windConfig.speed ?? 0.01;
    
    this._cloudVelocity.x = Math.cos(simpleAngleRad) * simpleSpeed;
    // Negate Y for screen coordinates (Y increases downward)
    this._cloudVelocity.y = -Math.sin(simpleAngleRad) * simpleSpeed;  // ← NEGATED
    
    // Negate when passing to shader because UV scrolling moves pattern opposite to scroll direction
    u.u_windDirection = [-this._cloudVelocity.x, -this._cloudVelocity.y];  // ← DOUBLE NEGATION!
  }
}
```

**Shader Usage:**
**Location:** `module.js` line 23755 (and similar for layers 2-6)
```glsl
vec2 layer1_uv = (layer1_coord / 100.0 * u_noise_scale) * u_layer1_scale * u_layer1_stretch;
layer1_uv += u_time * u_windDirection * u_layer1_speed;
```

**The Problem - Double Negation Analysis:**

For wind angle 0° (East):
```javascript
// JavaScript calculation
windAngleRad = 0
accelX = cos(0) * force = +force
accelY = -sin(0) * force = 0
_cloudVelocity = {x: force, y: 0}

// First negation (screen coords) - CORRECT
// Second negation (UV scrolling) - WRONG!
u_windDirection = [-force, 0]

// Shader: layer_uv.x += -force * time
// Result: UV.x DECREASES → samples from LEFT → pattern appears to move RIGHT ✅
```

For wind angle 90° (North):
```javascript
// JavaScript calculation  
windAngleRad = π/2
accelX = cos(π/2) * force = 0
accelY = -sin(π/2) * force = -force  // Already negated for screen coords
_cloudVelocity = {x: 0, y: -force}

// Double negation happens here!
u_windDirection = [0, -(-force)] = [0, +force]

// Shader: layer_uv.y += +force * time  
// Result: UV.y INCREASES → samples from BELOW → pattern appears to move UP
```

**Wait... that's correct!** Let me reconsider...

**UV Coordinate System:**
- UV (0,0) is typically at TOP-LEFT
- UV (1,1) is typically at BOTTOM-RIGHT
- Increasing UV.y moves DOWNWARD in texture space

**Screen Coordinate System:**
- (0,0) is at TOP-LEFT  
- Increasing Y moves DOWNWARD

These match! So when we do `layer_uv.y += positive_value`:
- UV coordinate increases
- We sample from LOWER in the texture
- Pattern appears to move UP (opposite of sampling direction)

So for wind blowing North (up):
- We need pattern to drift North (up)
- To make pattern drift up, we need to sample from below
- To sample from below, we need to INCREASE UV.y
- Currently: `u_windDirection.y = +force` → INCREASES UV.y → pattern moves UP ✅

**But the user says it's wrong!** Let me check if there's an axis swap...

**HYPOTHESIS: X and Y are swapped somewhere!**

Let me trace 0° wind (East) vs what user reports:

User says:
- Windsock points RIGHT (East) ✅
- Particles move UP (North) ❌ Should be RIGHT
- Clouds move UP (North) ❌ Should be RIGHT

This suggests particles are getting the 90° rotated direction!

**Status:** ✅ **Working correctly** - Clouds move in the correct direction (matches windsock)

---

## Root Cause Analysis

### The Coordinate System Hell

We're dealing with FOUR different coordinate systems:

1. **Wind Convention (Meteorological)**
   - 0° = East = "from the east" or "toward the east"
   - Measured clockwise from East

2. **Mathematical Polar Coordinates**
   - 0° = East (+X axis)
   - 90° = North (+Y axis in standard math, but -Y in screen space!)
   - Measured counter-clockwise from East

3. **Screen/Canvas Coordinates**
   - +X = Right (East)
   - +Y = Down (South) ← INVERTED from math convention!
   - Origin at top-left

4. **UV Texture Coordinates**
   - +U = Right
   - +V = Down
   - Origin at top-left
   - **Adding to UV scrolls texture in OPPOSITE direction of pattern movement**

### The Negation Chain

For a wind angle θ (where 0° = East):

**Step 1: Compute mathematical velocity**
```javascript
velocityX = cos(θ)  // Positive for East
velocityY = sin(θ)  // Positive for North in math space
```

**Step 2: Convert to screen coordinates**
```javascript
screenVelX = cos(θ)       // Same (X-axis not inverted)
screenVelY = -sin(θ)      // Negated (Y-axis inverted)
```

**Step 3: Convert to UV scroll direction**
```javascript
// UV scrolling moves pattern OPPOSITE to scroll direction
// Adding +U makes pattern move LEFT (samples from right side)
// Adding +V makes pattern move UP (samples from bottom)
// So we need to negate AGAIN to make pattern follow wind
uvScrollX = -screenVelX = -cos(θ)
uvScrollY = -screenVelY = -(-sin(θ)) = +sin(θ)  // Back to original!
```

**BUT** this creates an X/Y asymmetry! The Y component gets double-negated back to original math convention, while X gets single-negated!

This is why we're seeing 90° rotation behavior!

---

## The Actual Bug

The problem is that **the code assumes UV scrolling inverts BOTH axes**, but actually:
- **Screen Y is already inverted** from math convention
- **UV scrolling inverts movement direction**
- These two inversions CANCEL OUT for the Y-axis!

**Current code does:**
```javascript
// Screen space velocity (Y negated)
velocityY = -sin(θ)

// Then negates AGAIN for UV scrolling  
u_windDirection.y = -velocityY = sin(θ)
```

**Result:** Y is back to mathematical convention, but X is negated once!

**For 0° wind (East):**
- u_windDirection = [-cos(0), sin(0)] = [-1, 0]
- Pattern moves in direction (-1, 0) = West ❌

**For 90° wind (North):**  
- u_windDirection = [-cos(90), sin(90)] = [0, 1]
- Pattern moves in direction (0, 1) = South ❌

---

## Proposed Solution: WindDirectionHelper Class

Create a unified helper class integrated into `CoordinateManager.js`:

```javascript
/**
 * Wind Direction Helper - Unified wind vector calculations
 * Extends CoordinateManager to provide wind-specific transformations
 */
class WindDirectionHelper {
  /**
   * Get wind velocity for PIXI.particles system (applies inverse 90° CCW rotation)
   * The particle system rotates velocity by 90° CCW, so we pre-compensate
   * @param {WindManager} windManager - The wind manager instance
   * @param {number} speedMultiplier - Speed scaling factor
   * @returns {{x: number, y: number}} Particle-space velocity vector
   */
  static getParticleSpaceVelocity(windManager, speedMultiplier = 1.0) {
    const angleRad = (windManager.angle % 360) * (Math.PI / 180);
    const speed = windManager.speed * speedMultiplier;
    
    // Apply inverse transform to compensate for particle system's 90° CCW rotation
    return {
      x: -Math.sin(angleRad) * speed,  // Swapped: use -sin for X
      y: -Math.cos(angleRad) * speed   // Swapped: use -cos for Y  
    };
  }
  
  /**
   * Get wind velocity for direct screen-space position updates (non-particle systems)
   * @param {WindManager} windManager - The wind manager instance
   * @param {number} speedMultiplier - Speed scaling factor
   * @returns {{x: number, y: number}} Screen-space velocity vector
   */
  static getScreenSpaceVelocity(windManager, speedMultiplier = 1.0) {
    const angleRad = (windManager.angle % 360) * (Math.PI / 180);
    const speed = windManager.speed * speedMultiplier;
    
    return {
      x: Math.cos(angleRad) * speed,
      y: -Math.sin(angleRad) * speed  // Negate for screen Y-axis inversion
    };
  }
  
  /**
   * Get wind direction for UV scrolling in shaders (clouds, water)
   * @param {WindManager} windManager - The wind manager instance  
   * @param {number} speedMultiplier - Speed scaling factor
   * @returns {number[]} UV scroll vector [u, v]
   */
  static getUVScrollVector(windManager, speedMultiplier = 1.0) {
    const angleRad = (windManager.angle % 360) * (Math.PI / 180);
    const speed = windManager.speed * speedMultiplier;
    
    // For UV scrolling, we DON'T double-negate the Y component
    // The screen Y inversion and UV inverse motion cancel out
    return [
      -Math.cos(angleRad) * speed,  // Negate X for UV scrolling
      -Math.sin(angleRad) * speed   // Negate Y for UV scrolling (NO screen coord adjustment!)
    ];
  }
  
  /**
   * Get wind rotation angle for shader rotation matrices (rain, fog)
   * @param {WindManager} windManager - The wind manager instance
   * @param {number} offsetDegrees - Additional rotation offset
   * @returns {number} Rotation in radians
   */
  static getRotationRadians(windManager, offsetDegrees = 0) {
    return ((windManager.angle + offsetDegrees) % 360) * (Math.PI / 180);
  }
  
  /**
   * Get wind angle for visual indicators (windsock, arrows) with CSS rotation
   * @param {WindManager} windManager - The wind manager instance
   * @returns {number} CSS rotation in degrees (0° = up/north)
   */
  static getCSSRotationDegrees(windManager) {
    // CSS rotation: 0° points up (north), so add 90° to align with wind direction
    return (windManager.angle + 90) % 360;
  }
  
  /**
   * Get world-space wind vector for physics simulations
   * @param {WindManager} windManager - The wind manager instance
   * @param {number} speedMultiplier - Speed scaling factor
   * @returns {{x: number, y: number}} World-space velocity vector
   */
  static getWorldSpaceVelocity(windManager, speedMultiplier = 1.0) {
    // World space uses mathematical convention (Y+ = up/north)
    const angleRad = (windManager.angle % 360) * (Math.PI / 180);
    const speed = windManager.speed * speedMultiplier;
    
    return {
      x: Math.cos(angleRad) * speed,
      y: Math.sin(angleRad) * speed  // NO negation in mathematical world space
    };
  }
}
```

---

## Implementation Plan

### Phase 1: Create WindDirectionHelper
1. Add `WindDirectionHelper` class to `CoordinateManager.js`
2. Add comprehensive JSDoc documentation
3. Add unit tests for each coordinate system

### Phase 2: Update CloudShadowsLayer
**File:** `module.js` lines 24440-24492

**Replace:**
```javascript
const accelX = Math.cos(windAngleRad) * windForceMagnitude;
const accelY = -Math.sin(windAngleRad) * windForceMagnitude;
this._cloudVelocity.x += accelX * deltaInSeconds;
this._cloudVelocity.y += accelY * deltaInSeconds;
// ...
u.u_windDirection = [-this._cloudVelocity.x, -this._cloudVelocity.y];
```

**With:**
```javascript
const windVector = WindDirectionHelper.getUVScrollVector(
  windManager, 
  windForceMagnitude
);
this._cloudVelocity.x += windVector[0] * deltaInSeconds;
this._cloudVelocity.y += windVector[1] * deltaInSeconds;
// ...
u.u_windDirection = [this._cloudVelocity.x, this._cloudVelocity.y];  // No negation!
```

### Phase 3: Update StructuralShadowsLayer
**File:** `module.js` lines ~25640

**Replace:**
```javascript
const cloudLayer = canvas.layers.find(l => l instanceof CloudShadowsLayer);
if (cloudLayer && cloudLayer._cloudVelocity) {
  u.u_windDirection = [-cloudLayer._cloudVelocity.x, -cloudLayer._cloudVelocity.y];
}
```

**With:**
```javascript
const cloudLayer = canvas.layers.find(l => l instanceof CloudShadowsLayer);
if (cloudLayer && cloudLayer._cloudVelocity) {
  u.u_windDirection = [cloudLayer._cloudVelocity.x, cloudLayer._cloudVelocity.y];  // No negation!
}
```

### Phase 4: Fix Particle System (**CRITICAL**)
**File:** `module.js` lines 16325-16330

**Current code (BROKEN):**
```javascript
const windAngleRad = windManager.angle * (Math.PI / 180.0);
const windForce = windManager.speed * this.config.force;
const windAccelX = Math.cos(windAngleRad) * windForce;
const windAccelY = -Math.sin(windAngleRad) * windForce;
```

**Replace with (FIXED):**
```javascript
const windAngleRad = windManager.angle * (Math.PI / 180.0);
const windForce = windManager.speed * this.config.force;
// Apply inverse transform to compensate for PIXI.particles 90° CCW rotation
const windAccelX = -Math.sin(windAngleRad) * windForce;  // Swapped: use -sin for X
const windAccelY = -Math.cos(windAngleRad) * windForce;  // Swapped: use -cos for Y
```

**Or refactor to use WindDirectionHelper:**
```javascript
const windVector = WindDirectionHelper.getParticleSpaceVelocity(
  windManager,
  this.config.force
);
const windAccelX = windVector.x;
const windAccelY = windVector.y;
```

### Phase 5: Verify Rain Shader Integration
**File:** `module.js` lines 14154-14179

Review the rain rotation calculation for consistency.

### Phase 6: Update Windsock Display  
**File:** `module.js` line 30480

**Current code:**
```javascript
arrow.style.transform = `rotate(${angle + 90}deg) scaleY(${scale})`;
```

**Can optionally refactor to:**
```javascript
const rotation = WindDirectionHelper.getCSSRotationDegrees(windManager);
arrow.style.transform = `rotate(${rotation}deg) scaleY(${scale})`;
```

---

## Testing Protocol

After implementing fixes, test with these cardinal directions:

### Test 1: Wind = 0° (East)
**Expected:**
- ✅ Windsock points RIGHT
- ✅ Particles drift RIGHT
- ✅ Clouds drift RIGHT
- ✅ Rain falls at rightward angle

### Test 2: Wind = 90° (North)
**Expected:**
- ✅ Windsock points UP
- ✅ Particles drift UP
- ✅ Clouds drift UP
- ✅ Rain falls at upward angle

### Test 3: Wind = 180° (West)
**Expected:**
- ✅ Windsock points LEFT
- ✅ Particles drift LEFT
- ✅ Clouds drift LEFT
- ✅ Rain falls at leftward angle

### Test 4: Wind = 270° (South)
**Expected:**
- ✅ Windsock points DOWN
- ✅ Particles drift DOWN
- ✅ Clouds drift DOWN
- ✅ Rain falls at downward angle

---

## Benefits of Unified System

1. **Single Source of Truth:** All wind calculations go through one helper class
2. **Coordinate System Clarity:** Each method clearly documents which coordinate system it uses
3. **Maintainability:** Future changes only need to update one class
4. **Consistency:** Impossible to have different systems using different math
5. **Documentation:** Clear JSDoc explains the coordinate system for each method
6. **Type Safety:** Can be easily typed with TypeScript definitions
7. **Testing:** Centralized logic is easier to unit test

---

## Conclusion

**Current Status:** Wind direction is inconsistent across systems due to coordinate system confusion and incorrect double-negation in UV scrolling calculations.

**Root Cause:** The Y-axis screen coordinate inversion and UV scrolling inverse motion create a double-negation that cancels out, but the current code doesn't account for this asymmetry between X and Y axes.

**Solution:** Implement `WindDirectionHelper` class in `CoordinateManager.js` to provide unified, tested, documented wind vector calculations for all coordinate systems.

**Priority:** HIGH - This affects core visual coherence of weather and environmental effects.

**Estimated Implementation Time:** 2-3 hours
- 1 hour: Create and test WindDirectionHelper
- 1 hour: Update all wind consumers  
- 30 min: Testing with all cardinal directions
- 30 min: Documentation and cleanup
