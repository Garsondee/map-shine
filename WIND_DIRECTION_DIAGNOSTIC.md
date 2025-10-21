# Wind Direction Diagnostic Guide

## Current Status

We need to debug the wind direction inconsistency systematically. I've added debug logging to all three systems to understand what's actually happening.

## What You're Seeing

- **Windsock**: Points east (right and downwards)
- **Flame Particles**: Move north (upwards)
- **Clouds**: Move right but upwards/northwards (different from windsock)

## Debug Logging Added

I've added console logging to three key systems:

### 1. Windsock (5% of frames)
```
[Windsock Debug] Wind angle: X.X°, CSS rotation: X.X°
```

### 2. Particles (1% of updates)
```
[WindBehavior Debug] Angle: X.X°, AccelX: X.XX, AccelY: X.XX, 
  Particle pos: (X, Y), Velocity: (X.XX, Y.XX)
```

### 3. Clouds (1% of frames)
```
[CloudShadows Debug] Wind angle: X.X°, 
  Cloud velocity: (X.XXXX, Y.XXXX), 
  Shader u_windDirection: (X.XXXX, Y.XXXX)
```

## What to Do Next

1. **Open the browser console** (F12)
2. **Watch the wind for ~30 seconds** while looking at:
   - Where the windsock is pointing
   - Where particles are moving
   - Where clouds are drifting
3. **Copy the console logs** that appear during this time
4. **Report back with**:
   - What direction the windsock is pointing (use compass directions or clock positions)
   - What direction particles are moving
   - What direction clouds are moving
   - The console log output

## Expected Log Format

You should see output like this:
```
[Windsock Debug] Wind angle: 0.0°, CSS rotation: 90.0°
[WindBehavior Debug] Angle: 0.1°, AccelX: 14.99, AccelY: 0.03, Particle pos: (450, 300), Velocity: (2.50, 0.01)
[CloudShadows Debug] Wind angle: 0.0°, Cloud velocity: (0.0012, 0.0000), Shader u_windDirection: (-0.0012, -0.0000)
```

## Key Questions to Answer

From the logs, we need to determine:

1. **What is the actual wind angle?** (From any of the three logs)
2. **For particles:**
   - When AccelX is positive (right), are particles moving right or up?
   - When AccelY is negative (up in screen coords), are particles moving up or right?
3. **For clouds:**
   - When Cloud velocity.x is positive, do clouds move right or in another direction?
   - When Cloud velocity.y is negative, do clouds move up or down?
4. **For windsock:**
   - Does the CSS rotation match where it's actually pointing?
   - Example: CSS rotation 90° should point right (3 o'clock position)

## Coordinate System Reference

### Screen Coordinates
- **+X = Right (East)**
- **+Y = Down (South)**
- **-Y = Up (North)**

### Wind Angle Convention
- **0° = East (Right)**
- **90° = North (Up)**  
- **180° = West (Left)**
- **270° = South (Down)**

### CSS Rotation (Windsock)
- **0° = Up (12 o'clock)**
- **90° = Right (3 o'clock)**
- **180° = Down (6 o'clock)**
- **270° = Left (9 o'clock)**

So when wind angle is 0° (East), the windsock should show CSS rotation 90° and point right.

## Next Steps After Diagnosis

Once we see the actual console output, we'll be able to determine:
- Whether there's a 90° rotation happening
- Whether there's an X/Y swap
- Whether there's a sign inversion
- Or something entirely different

This will allow us to apply the correct fix instead of guessing.

## Quick Test

To make diagnosis easier, you can temporarily set a fixed wind direction:

Open the console and run:
```javascript
game.mapShine.windManager.angle = 0;  // Force East
game.mapShine.windManager.smoothedAngle = 0;
```

Then observe:
- Windsock should point RIGHT (3 o'clock)
- Particles should drift RIGHT
- Clouds should drift RIGHT

If any of these is wrong, note which one and in which direction it's actually going.

## Files Modified

- `scripts/module.js` line 16330-16341: Added WindBehavior debug logging
- `scripts/module.js` line 24496-24501: Added CloudShadows debug logging  
- `scripts/module.js` line 30494-30497: Added Windsock debug logging

All logging will be removed once we identify and fix the root cause.
