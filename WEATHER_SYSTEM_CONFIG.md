# Weather System Configuration Architecture

## ✅ Current Implementation Status

The weather system configuration is **correctly implemented** with a clean separation between:
1. **User-configurable runtime values** (stored in settings)
2. **System constants** (hardcoded in WeatherSystemManager)

## Configuration Structure

### UNIVERSAL_EFFECT_DEFAULTS.weather (Lines 344-348)
```javascript
weather: {
  enabled: true,                    // Master toggle
  currentState: "clear",            // Active weather state (persisted)
  transitionDuration: 10000,        // Transition time in ms (persisted)
}
```

### Registered Settings (Lines 4376-4392)
```javascript
registerUniversalSetting("weather.enabled", Boolean, default: true)
registerUniversalSetting("weather.currentState", String, default: "clear")
registerUniversalSetting("weather.transitionDuration", Number, default: 10000)
```

### System Constants (WeatherSystemManager._initializeStateDefinitions)
**These are intentionally hardcoded** and NOT persisted to settings:

#### State Definitions (Lines 14860-14945)
Each weather state includes:
- `name`: Display name
- `cloudDensity`: 0-1 cloud coverage
- `cloudThreshold`: 0-1 visibility threshold
- `cloudSoftness`: 0-1 edge softness
- `precipitationIntensity`: 0-1 intensity
- `precipitationType`: 'none'|'rain'|'snow'|'sleet'
- `particleCount`: Number of particles
- `windSpeedMultiplier`: Wind effect multiplier
- `atmosphericTint`: {r, g, b} color tint
- `description`: Human-readable description

#### Weather States
1. **CLEAR**: No precipitation, minimal clouds
2. **DRIZZLE**: Light rain (intensity 0.3)
3. **RAIN**: Steady rainfall (intensity 0.6)
4. **STORM**: Heavy rain with wind (intensity 0.9)
5. **SLEET**: Mixed rain/snow (intensity 0.7)
6. **SNOW**: Snowfall (intensity 0.5)
7. **BLIZZARD**: Heavy snow with wind (intensity 1.0)

## Integration Points

### Initialization (Line 9386-9396)
```javascript
game.mapShine.weatherSystemManager = new WeatherSystemManager();
await game.mapShine.weatherSystemManager.initialize();
```

### Config Loading (Line 15439-15442)
```javascript
const config = game.mapShine?.profileManager?.activeConfig;
if (config?.weather?.currentState) {
  this.setInitialState(config.weather.currentState);
}
```

### Frame Update (Line 5190)
```javascript
game.mapShine.weatherSystemManager?.update(deltaTime);
```

### Teardown (Line 5951-5960)
```javascript
game.mapShine.weatherSystemManager.destroy();
game.mapShine.weatherSystemManager = null;
```

## Architecture Decision: Why State Definitions Are NOT in Defaults

### ✅ Correct (Current Implementation)
State definitions are **hardcoded constants** because they define:
- Game mechanics (wind multipliers, particle counts)
- Visual parameters (cloud density, atmospheric tints)
- Balance values (precipitation intensity curves)

These are **system design decisions**, not user preferences.

### ❌ Incorrect (Alternative)
Storing state definitions in UNIVERSAL_EFFECT_DEFAULTS would:
- Allow users to accidentally break the system
- Create maintenance burden (every state needs 9+ properties)
- Complicate version upgrades (migrating complex nested objects)
- Bloat the settings database

## User Control Points

Users can control weather through:
1. **Enable/Disable**: `weather.enabled`
2. **Current State**: `weather.currentState` (clear/drizzle/rain/storm/sleet/snow/blizzard)
3. **Transition Speed**: `weather.transitionDuration` (milliseconds)

## State Transition System

### Smooth Interpolation
During transitions, all state properties are interpolated:
- Cloud density, threshold, softness
- Precipitation intensity
- Particle counts
- Wind multipliers
- Atmospheric tints

### Shader Animation
Shaders remain **actively animating** during transitions:
- `shader.speed` controls animation rate (kept > 0)
- `shader.uniforms.opacity`/`alpha` control visibility (0-1 fade)
- Both source and target shaders run simultaneously

## Persistence Flow

### Save
1. User changes weather state via UI
2. `ProfileManager.recordUserChange("weather.currentState", "rain")`
3. Value saved to Foundry settings
4. `WeatherSystemManager.transitionToState("rain")` triggered

### Load
1. Scene loads
2. `ProfileManager.activeConfig` built from settings
3. `WeatherSystemManager.setInitialState(config.weather.currentState)`
4. State applied immediately (no transition)

### Transition
1. `WeatherSystemManager.update(deltaTime)` called each frame
2. Transition progress tracked (0 to 1)
3. State properties interpolated with ease-in-out cubic
4. Shaders updated with faded opacity values
5. On completion: `currentState = targetState`, `isTransitioning = false`

## Validation

### ✅ All Required Components Present
- [x] UNIVERSAL_EFFECT_DEFAULTS.weather defined
- [x] Settings registered in Foundry
- [x] WeatherSystemManager class implemented
- [x] State definitions initialized
- [x] Integration with ProfileManager
- [x] Frame update loop connected
- [x] Teardown/cleanup implemented
- [x] Shader system integrated (WeatherEffectLayer)

### ✅ Configuration Flow Complete
```
UNIVERSAL_EFFECT_DEFAULTS (defaults)
  ↓
registerUniversalSetting (Foundry settings)
  ↓
ProfileManager.activeConfig (runtime)
  ↓
WeatherSystemManager.setInitialState (initialization)
  ↓
WeatherSystemManager.update (per-frame)
  ↓
WeatherEffectLayer.updateFromConfig (shader rendering)
```

## Conclusion

**The weather system configuration is correctly implemented.** No changes needed to MODULE_DEFAULTS/UNIVERSAL_EFFECT_DEFAULTS. The three essential user-configurable properties are properly saved and loaded. State definitions are appropriately hardcoded as system constants.
