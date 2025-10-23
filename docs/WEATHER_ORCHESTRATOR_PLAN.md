# Weather Orchestrator - Implementation Plan

**Version:** 1.0  
**Status:** Planning Phase  
**Estimated Time:** 40-60 hours (1-2 weeks)

---

## Executive Summary

The **Weather Orchestrator** is an autonomous weather simulation system using atmospheric parameters (temperature & humidity) to drive realistic weather transitions. GMs set environmental ranges and let the system evolve conditions naturally using dice-based random walks, creating smooth transitions from sunny days to hurricanes or warm weather to blizzards.

---

## Core Concept

### The Problem
- Manual weather state selection feels static
- No dynamic evolution over time
- Requires constant GM micromanagement

### The Solution
**Atmospheric-driven simulation:**
- **Temperature** (°C) determines precipitation type (rain vs snow)
- **Humidity** (0-100%) determines precipitation intensity  
- **Random walks** (dice-based) create natural drift
- **Weather states** emerge from atmospheric parameters

### Key Benefits
1. Autonomous evolution - set ranges and forget
2. Realistic transitions based on physics
3. Emergent complex weather from simple rules
4. GM control via boundaries
5. Narrative alignment for story beats

---

## Architecture Overview

```
WeatherOrchestrator
├── AtmosphericParameters (temp, humidity, pressure)
├── RandomWalkEngine (dice-based drift, 60s ticks)
├── WeatherStateResolver (temp/humidity → state mapping)
└── System Controllers
    ├── WeatherSystemManager (state transitions)
    ├── WindManager (speed/direction)
    ├── CloudShadowsLayer (density/appearance)
    └── WeatherEffectLayer (rain/snow/fog shaders)
```

**Data Flow:**
1. GM sets temp range (15-25°C), humidity range (40-80%)
2. Every 60s: Roll 2d6, adjust temp/humidity
3. Resolve: temp/humidity → weather state + intensity
4. Propagate: Update wind, clouds, precipitation
5. Repeat

---

## Atmospheric Parameters

### Temperature System
- **Range:** -20°C to +40°C
- **Effects:**
  - `< -2°C` → Snow
  - `-2°C to +2°C` → Sleet
  - `> +2°C` → Rain
  - `> +30°C` → Reduced humidity, heat effects

### Humidity System
- **Range:** 0-100% (relative)
- **Effects:**
  - `0-30%` → Clear, no precipitation
  - `30-60%` → Light clouds, drizzle
  - `60-80%` → Heavy clouds, steady precipitation
  - `80-100%` → Storm conditions, maximum precipitation

### Pressure (Derived/Optional)
- **Range:** 950-1050 hPa
- **Formula:** `1013 + (50 - humidity) * 0.4 + (15 - temp) * 0.3`
- **Effects:**
  - `< 980 hPa` → Low pressure → storms, strong winds
  - `> 1020 hPa` → High pressure → clear, light winds

---

## Random Walk Engine

### Dice System (2d6 Bell Curve)

```javascript
// Every 60 seconds
const tempRoll = rollDice(2, 6);      // 2-12
const humidityRoll = rollDice(2, 6);  // 2-12

// Convert to deltas (-5 to +5)
const tempDelta = (tempRoll - 7) * config.tempStepSize;
const humidityDelta = (humidityRoll - 7) * config.humidityStepSize;
```

**Probability:**
- **7** (no change): 16.67%
- **6 or 8** (±1 step): 13.89%
- **5 or 9** (±2 steps): 11.11%
- **2 or 12** (±5 steps): 2.78% (extreme)

### Momentum System

Smooth transitions with inertia:
```javascript
// Apply momentum (70% old + 30% new)
this.tempMomentum = momentum * 0.7 + rawDelta * 0.3;
this.temperature += this.tempMomentum;

// Clamp to GM ranges
this.temperature = clamp(temp, config.tempMin, config.tempMax);
```

### Boundary Behavior

Soft bouncing at range limits:
```javascript
// Near max (>90%), bias dice rolls downward
// Near min (<10%), bias dice rolls upward
// Creates natural bounce instead of hard stops
```

---

## Weather State Mapping

### Temperature-Humidity Matrix

| Temp (°C) | 0-30% Humidity | 30-60% Humidity | 60-80% Humidity | 80-100% Humidity |
|-----------|----------------|-----------------|-----------------|------------------|
| > +30     | Clear/Hazy     | Clear           | Drizzle         | Rain             |
| +15-30    | Clear          | Clear           | Rain            | Storm            |
| +2-15     | Clear          | Drizzle         | Rain            | Storm            |
| -2-+2     | Clear          | Sleet (light)   | Sleet           | Sleet (heavy)    |
| -10--2    | Clear          | Snow (light)    | Snow            | Snow (heavy)     |
| < -10     | Clear          | Snow            | Blizzard        | Blizzard         |

### Resolution Algorithm

```javascript
function resolveWeatherState(temp, humidity) {
  // Determine precipitation type
  const precipType = temp < -2 ? 'snow' : 
                     temp <= 2 ? 'sleet' : 'rain';
  
  // Determine state and intensity from humidity
  if (humidity < 30) return { state: 'clear', intensity: 0 };
  if (humidity < 60) return { state: precipType === 'rain' ? 'drizzle' : precipType, 
                               intensity: 0.3 + (humidity - 30) / 30 * 0.3 };
  if (humidity < 80) return { state: precipType, 
                               intensity: 0.6 + (humidity - 60) / 20 * 0.3 };
  
  // >= 80%
  const stormState = precipType === 'snow' ? 'blizzard' : 'storm';
  return { state: stormState, intensity: 0.9 + (humidity - 80) / 20 * 0.1 };
}
```

### Wind Calculation

```javascript
function calculateWind(temp, humidity, pressure) {
  const humidityWind = humidity * 0.5;          // 0-50
  const pressureWind = (1013 - pressure) * 2;   // Gradient effect
  const tempEffect = Math.abs(temp - 15) * 0.3; // Extremes = wind
  
  const baseSpeed = Math.max(20, humidityWind + pressureWind + tempEffect);
  return { baseSpeed, gustSpeed: baseSpeed * 1.8 };
}
```

### Cloud Properties

```javascript
function calculateClouds(humidity, state) {
  return {
    density: 0.1 + humidity * 0.009,  // 0.1-1.0
    threshold: state === 'storm' ? 0.25 : 0.5 - humidity * 0.003,
    softness: 0.4 + density * 0.3
  };
}
```

---

## Integration Points

### 1. WeatherSystemManager
```javascript
orchestrator.applyWeatherState(resolvedState) {
  weatherManager.transitionTo(resolvedState.state, {
    duration: config.transitionDuration,
    intensity: resolvedState.intensity
  });
}
```

### 2. WindManager
```javascript
orchestrator.applyWind(windData) {
  windManager.updateFromConfig({
    baseSpeed: windData.baseSpeed,
    gustSpeed: windData.gustSpeed,
    angleChangeRange: 20 + baseSpeed * 0.2
  });
}
```

### 3. CloudShadowsLayer
```javascript
orchestrator.applyClouds(cloudData) {
  config.cloudShadows.density = cloudData.density;
  config.cloudShadows.threshold = cloudData.threshold;
  cloudLayer.updateFromConfig(config);
}
```

### 4. WeatherEffectLayer
Reads from profile config automatically - no direct control needed.

---

## UI Design

### Main Panel (in Weather accordion)

```
┌─────────────────────────────────────────────────────┐
│ [✓] Weather Orchestrator (Autonomous)               │
│                                                      │
│ Temperature Range: [-10°C] ━━━●━━ [+30°C]          │
│ Current: 18.5°C  ↑ +0.3°C/min                      │
│                                                      │
│ Humidity Range: [20%] ━━━━━●━━ [90%]               │
│ Current: 62.3%  ↑ +1.2%/min                        │
│                                                      │
│ Settings:                                            │
│   Tick Interval: [60] seconds                       │
│   Temp Step: [0.5] °C    Humidity Step: [2.0] %    │
│   Momentum: [0.7] (inertia factor)                  │
│                                                      │
│ Current Conditions:                                  │
│   State: RAIN (intensity 0.72)                      │
│   Wind: 68 km/h (gusts 122 km/h)                   │
│   Clouds: Dense (82% coverage)                      │
│   Pressure: 997 hPa (Low)                           │
│   Next Tick: 42s                                    │
│                                                      │
│ [ Reset to Center ]  [ Pause ]  [ Resume ]          │
└─────────────────────────────────────────────────────┘
```

### Advanced Options (Collapsible)

```
┌── Advanced ──────────────────────────────────────┐
│ [ ] Use Pressure System                          │
│ [ ] Seasonal Bias (shift ranges by month)        │
│ Dice System: [2d6 ▼] (2d6, 1d20, 3d6, custom)   │
│                                                   │
│ Narrative Override:                               │
│   [ ] Force toward: [STORM ▼]                    │
│   Force Strength: [0.3] (0=none, 1=instant)      │
│   When reached: ( ) Hold (•) Resume ( ) Stop     │
└──────────────────────────────────────────────────┘
```

---

## Pre-Production Tasks

**Purpose:** Prepare the existing weather systems for orchestrator integration. These small utility tasks will make Phase 2 (Integration) significantly easier and reduce debugging time.

**Total Estimated Time:** 8-12 hours  
**Should be completed BEFORE starting Phase 1**

---

### Task 1: Enhance WeatherSystemManager API (2-3 hrs)

**Objective:** Add orchestrator-friendly methods to WeatherSystemManager

**Changes Needed:**

1. **Add `transitionTo()` method with intensity support:**
```javascript
// In WeatherSystemManager class
transitionTo(stateName, options = {}) {
  const { duration, intensity } = options;
  
  // Call existing transitionToState
  this.transitionToState(stateName, duration);
  
  // Store intensity override for use during transition
  if (intensity !== undefined) {
    this._intensityOverride = intensity;
  }
}
```

2. **Add intensity override support in `_updateWeatherShaders()`:**
```javascript
_updateWeatherShaders(currentWeather) {
  // Apply intensity override if orchestrator is active
  if (this._intensityOverride !== undefined) {
    // Scale shader parameters by override intensity
    // This allows orchestrator to fine-tune weather strength
  }
  // ... existing shader update code ...
}
```

3. **Add orchestrator state tracking:**
```javascript
constructor() {
  // ... existing code ...
  this.orchestratorActive = false; // Track if orchestrator controls this manager
  this._intensityOverride = undefined;
}
```

**Testing:**
- Call `transitionTo('storm', { duration: 5000, intensity: 0.5 })`
- Verify state changes AND intensity scales correctly

---

### Task 2: Add WindManager Config Update Method (1-2 hrs)

**Objective:** Ensure WindManager can accept orchestrator wind data smoothly

**Changes Needed:**

1. **Validate `updateFromConfig()` signature:**
```javascript
// In WindManager class
updateFromConfig(config) {
  // Ensure this accepts partial configs
  this.config = {
    ...this.config,  // Keep existing values
    ...config         // Override with new values
  };
  
  // Apply immediately (no need to wait for next update)
  this.speed = config.baseSpeed || this.speed;
}
```

2. **Add validation:**
```javascript
updateFromConfig(config) {
  // Validate required fields
  if (config.baseSpeed !== undefined && (config.baseSpeed < 0 || config.baseSpeed > 300)) {
    console.warn('WindManager | Invalid baseSpeed:', config.baseSpeed);
    return false;
  }
  
  // ... apply config ...
  return true;
}
```

**Testing:**
- Call with partial config: `windManager.updateFromConfig({ baseSpeed: 75 })`
- Verify only baseSpeed changes, other properties unchanged

---

### Task 3: CloudShadowsLayer Direct Update Method (2-3 hrs)

**Objective:** Allow orchestrator to update cloud properties without full config rebuild

**Changes Needed:**

1. **Add `updateCloudProperties()` method:**
```javascript
// In CloudShadowsLayer class
updateCloudProperties(properties) {
  const { density, threshold, softness, speed } = properties;
  
  // Update filter uniforms directly
  if (this.filter) {
    if (density !== undefined) this.filter.uniforms.u_density = density;
    if (threshold !== undefined) this.filter.uniforms.u_threshold = threshold;
    if (softness !== undefined) this.filter.uniforms.u_softness = softness;
    if (speed !== undefined) this.filter.uniforms.u_speed = speed;
  }
  
  // Also update config for persistence
  const config = game.mapShine.profileManager.activeConfig;
  if (config?.cloudShadows) {
    Object.assign(config.cloudShadows, properties);
  }
}
```

2. **Add getter for current cloud state:**
```javascript
getCloudState() {
  return {
    density: this.filter?.uniforms.u_density || 0,
    threshold: this.filter?.uniforms.u_threshold || 0,
    softness: this.filter?.uniforms.u_softness || 0,
    speed: this.filter?.uniforms.u_speed || 0
  };
}
```

**Testing:**
- Call `cloudLayer.updateCloudProperties({ density: 0.8 })`
- Verify visual change is immediate
- Verify config is updated

---

### Task 4: Add Orchestrator Configuration Schema (1-2 hrs)

**Objective:** Add orchestrator config section to MODULE_DEFAULTS

**Changes Needed:**

Add to `MODULE_DEFAULTS.weather` (around line 1750):
```javascript
orchestrator: {
  enabled: false,
  
  // Parameter ranges
  temperatureMin: 10,
  temperatureMax: 25,
  humidityMin: 40,
  humidityMax: 80,
  
  // Current state (persisted)
  temperatureCurrent: 18,
  humidityCurrent: 60,
  tempMomentum: 0,
  humidityMomentum: 0,
  
  // Engine settings
  tickInterval: 60,
  tempStepSize: 0.5,
  humidityStepSize: 2.0,
  momentum: 0.7,
  transitionDuration: 10,
  
  // Advanced
  usePressure: false,
  seasonalBias: false,
  diceType: '2d6',
  
  // Narrative override
  narrativeOverride: {
    enabled: false,
    targetState: 'storm',
    forceStrength: 0.3,
    onReached: 'resume'
  }
}
```

**Testing:**
- Verify config loads without errors
- Check with `game.mapShine.profileManager.activeConfig.weather.orchestrator`

---

### Task 5: State Preset Validation & Completeness (1-2 hrs)

**Objective:** Ensure all 7 weather state presets have complete data for orchestrator

**Changes Needed:**

1. **Audit each state preset** (lines 1790-1956) for missing fields:
   - ✅ cloudDensity
   - ✅ cloudThreshold
   - ✅ cloudSoftness
   - ✅ precipitationIntensity
   - ✅ precipitationType
   - ✅ particleCount
   - ✅ windSpeedMultiplier
   - ✅ atmosphericTint
   - ✅ wind (baseSpeed, gustSpeed, etc.)
   - ✅ cloudWind (maxSpeed, force, drag)

2. **Add missing fields if any:**
```javascript
// Example: If 'sleet' state is missing windSpeedMultiplier
sleet: {
  // ... existing fields ...
  windSpeedMultiplier: 1.2,  // ADD THIS
}
```

3. **Validate consistency:**
   - Storm should have highest wind speeds
   - Clear should have lowest cloud density
   - Precipitation types should match temperature expectations

**Testing:**
- Loop through all states: `Object.values(MODULE_DEFAULTS.weather.statePresets)`
- Check each has all required fields
- Log any missing fields

---

### Task 6: Save/Load Orchestrator State (1-2 hrs)

**Objective:** Persist orchestrator state across scene changes and sessions

**Changes Needed:**

1. **Update `SceneChangeManager._performTeardown()`** (around line 6014):
```javascript
async _performTeardown() {
  // ... existing teardown ...
  
  // Save orchestrator state before teardown
  if (game.mapShine.weatherOrchestrator) {
    const config = game.mapShine.profileManager.activeConfig.weather.orchestrator;
    const params = game.mapShine.weatherOrchestrator.parameters;
    const engine = game.mapShine.weatherOrchestrator.walkEngine;
    
    config.temperatureCurrent = params.temperature;
    config.humidityCurrent = params.humidity;
    config.tempMomentum = engine.tempMomentum;
    config.humidityMomentum = engine.humidityMomentum;
    
    await game.mapShine.profileManager.saveActiveConfig();
    console.log('Weather Orchestrator | State saved for scene transition');
  }
}
```

2. **Update `MapShineLifecycle.runFullSetup()`** (around line 9190):
```javascript
static async runFullSetup() {
  // ... existing setup ...
  
  // Initialize Weather Orchestrator if enabled
  const orchestratorConfig = game.mapShine.profileManager.activeConfig.weather.orchestrator;
  if (orchestratorConfig?.enabled) {
    const { WeatherOrchestrator } = await import('./weather/WeatherOrchestrator.js');
    game.mapShine.weatherOrchestrator = new WeatherOrchestrator(orchestratorConfig);
    
    // Restore saved state
    game.mapShine.weatherOrchestrator.parameters.setTemperature(
      orchestratorConfig.temperatureCurrent
    );
    game.mapShine.weatherOrchestrator.parameters.setHumidity(
      orchestratorConfig.humidityCurrent
    );
    game.mapShine.weatherOrchestrator.walkEngine.tempMomentum = 
      orchestratorConfig.tempMomentum;
    game.mapShine.weatherOrchestrator.walkEngine.humidityMomentum = 
      orchestratorConfig.humidityMomentum;
    
    game.mapShine.weatherOrchestrator.start();
    console.log('Weather Orchestrator | Restored and started');
  }
}
```

**Testing:**
- Enable orchestrator, let it run for 5 minutes
- Change scenes
- Verify temp/humidity/momentum restored correctly

---

### Task 7: Add getDiagnostics() to WeatherSystemManager (1 hr)

**Objective:** Provide diagnostic data for orchestrator and UI

**Changes Needed:**

Add method to WeatherSystemManager (around line 14750):
```javascript
getDiagnostics() {
  return {
    // Current state
    currentState: this.currentState,
    targetState: this.targetState,
    isTransitioning: this.isTransitioning,
    transitionProgress: this.transitionProgress,
    
    // Weather properties
    cloudTextureValid: this.cloudTextureValid,
    
    // System health
    isReady: this.isReady,
    lastError: this.lastError,
    lastErrorTime: this.lastErrorTime,
    
    // Effect layer status
    weatherEffectLayerActive: this.weatherEffectLayer !== null,
    
    // State definition info
    currentStateDefinition: this.stateDefinitions[this.currentState]
  };
}
```

**Testing:**
- Call `game.mapShine.weatherSystemManager.getDiagnostics()`
- Verify all fields populated correctly
- Use in UI diagnostic panel

---

### Task 8: Create Utility Module for Dice Rolling (30 min)

**Objective:** Reusable dice rolling utility for orchestrator and future features

**Create File:** `scripts/utils/DiceRoller.js`

```javascript
/**
 * Utility for rolling dice with various configurations
 */
export class DiceRoller {
  /**
   * Roll N dice with D sides
   * @param {number} count - Number of dice
   * @param {number} sides - Number of sides per die
   * @returns {number} Sum of all dice
   */
  static roll(count, sides) {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += Math.floor(Math.random() * sides) + 1;
    }
    return sum;
  }
  
  /**
   * Roll 2d6 (standard bell curve)
   * @returns {number} 2-12
   */
  static roll2d6() {
    return this.roll(2, 6);
  }
  
  /**
   * Roll 3d6 (tighter bell curve)
   * @returns {number} 3-18
   */
  static roll3d6() {
    return this.roll(3, 6);
  }
  
  /**
   * Roll 1d20 (uniform distribution)
   * @returns {number} 1-20
   */
  static roll1d20() {
    return this.roll(1, 20);
  }
  
  /**
   * Get probability distribution for 2d6
   * @returns {Object} Map of result to probability
   */
  static get2d6Distribution() {
    return {
      2: 0.0278,  3: 0.0556,  4: 0.0833,
      5: 0.1111,  6: 0.1389,  7: 0.1667,
      8: 0.1389,  9: 0.1111,  10: 0.0833,
      11: 0.0556, 12: 0.0278
    };
  }
}
```

**Testing:**
- Roll 10,000 times, verify distribution matches theoretical
- Use in RandomWalkEngine when implementing

---

### Task 9: UI Infrastructure for Range Sliders (1-2 hrs)

**Objective:** Create dual-slider control for temp/humidity ranges

**Changes Needed:**

Add to `DebuggerUIBuilder` class (around line 32000):
```javascript
/**
 * Create a dual range slider (min/max)
 * @param {string} pathMin - Config path for minimum value
 * @param {string} pathMax - Config path for maximum value
 * @param {string} label - Display label
 * @param {number} absMin - Absolute minimum allowed
 * @param {number} absMax - Absolute maximum allowed
 * @param {number} step - Step size
 * @param {string} unit - Unit label (e.g., "°C", "%")
 * @returns {string} HTML for dual range control
 */
static _createDualRangeSliderHTML(pathMin, pathMax, label, absMin, absMax, step, unit = '') {
  return `
    <div class="control-row" style="display: flex; flex-direction: column; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <label style="font-weight: bold;">${label}</label>
        <div style="display: flex; gap: 10px;">
          <span style="font-size: 11px;">
            Min: <span data-path="${pathMin}" class="setting-value">--</span>${unit}
          </span>
          <span style="font-size: 11px;">
            Max: <span data-path="${pathMax}" class="setting-value">--</span>${unit}
          </span>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <input 
          type="range" 
          data-path="${pathMin}"
          min="${absMin}" 
          max="${absMax}" 
          step="${step}"
          style="flex: 1;"
        />
        <input 
          type="range" 
          data-path="${pathMax}"
          min="${absMin}" 
          max="${absMax}" 
          step="${step}"
          style="flex: 1;"
        />
      </div>
    </div>
  `;
}
```

**Testing:**
- Use in orchestrator UI mockup
- Verify both sliders work independently
- Verify values update in real-time

---

### Task 10: Test Manual State Transitions (30 min)

**Objective:** Ensure all 7 weather states can be reached manually before orchestrator

**Testing Script:**
```javascript
// Run in console to test all transitions
const states = ['clear', 'drizzle', 'rain', 'storm', 'sleet', 'snow', 'blizzard'];
const weatherManager = game.mapShine.weatherSystemManager;

for (const state of states) {
  console.log(`Testing transition to: ${state}`);
  weatherManager.transitionToState(state, 5000);
  await new Promise(resolve => setTimeout(resolve, 6000));
}
console.log('All state transitions complete!');
```

**Expected Results:**
- All 7 states transition smoothly
- No console errors
- Visual appearance matches expectations
- Wind/clouds/precipitation sync correctly

---

## Pre-Production Checklist

Before starting Phase 1 implementation:

- [ ] **Task 1:** WeatherSystemManager API enhanced with `transitionTo()` and intensity override
- [ ] **Task 2:** WindManager `updateFromConfig()` validated and tested
- [ ] **Task 3:** CloudShadowsLayer `updateCloudProperties()` method added
- [ ] **Task 4:** Orchestrator configuration schema added to MODULE_DEFAULTS
- [ ] **Task 5:** All 7 state presets validated for completeness
- [ ] **Task 6:** Save/load hooks added for orchestrator state persistence
- [ ] **Task 7:** `getDiagnostics()` method added to WeatherSystemManager
- [ ] **Task 8:** DiceRoller utility module created and tested
- [ ] **Task 9:** Dual range slider UI component created
- [ ] **Task 10:** Manual state transition test passed for all 7 states

**Total Time Investment:** 8-12 hours  
**Expected Benefit:** Reduce Phase 2 time by 30-40%, fewer integration bugs

---

## Implementation Phases

### Phase 1: Core (12-16 hrs)
**Files:**
- `scripts/weather/WeatherOrchestrator.js`
- `scripts/weather/RandomWalkEngine.js`
- `scripts/weather/AtmosphericParameters.js`
- `scripts/weather/WeatherStateResolver.js`

**Tasks:**
1. Create class skeletons
2. Implement dice rolling + probability
3. Add momentum system
4. Build state resolution matrix
5. Implement 60s tick system
6. Add boundary behavior

**Test:** Console log 10min parameter drift, verify distributions

### Phase 2: Integration (10-14 hrs)
**Tasks:**
1. Connect to WeatherSystemManager
2. Connect to WindManager
3. Connect to CloudShadowsLayer
4. Connect to WeatherEffectLayer
5. Add enable/disable flag
6. Save orchestrator state in config

**Test:** Full weather cycles, all 7 states reachable

### Phase 3: UI (8-12 hrs)
**Tasks:**
1. Create UI panel in debugger
2. Add range sliders (temp, humidity)
3. Current conditions display
4. Real-time updates (arrows, rates)
5. Diagnostic panel
6. Control buttons
7. Settings controls

**Test:** UI responsiveness, slider validation, display accuracy

### Phase 4: Advanced (10-14 hrs)
**Tasks:**
1. Pressure system (derived)
2. Narrative override (force to target)
3. Seasonal bias (optional)
4. Alternative dice (1d20, 3d6)
5. Storm clustering (optional)

**Test:** Feature validation, edge cases

### Phase 5: Polish (4-6 hrs)
**Tasks:**
1. JSDoc comments
2. User guide markdown
3. Tooltips
4. Performance optimization
5. Error handling
6. Demo presets (tropical, arctic, temperate)

---

## Configuration Schema

```javascript
// Add to MODULE_DEFAULTS.weather
orchestrator: {
  enabled: false,
  
  // Ranges
  temperatureMin: 10,
  temperatureMax: 25,
  humidityMin: 40,
  humidityMax: 80,
  
  // Current state
  temperatureCurrent: 18,
  humidityCurrent: 60,
  tempMomentum: 0,
  humidityMomentum: 0,
  
  // Engine config
  tickInterval: 60,        // seconds
  tempStepSize: 0.5,       // °C per dice point
  humidityStepSize: 2.0,   // % per dice point
  momentum: 0.7,           // 0=random, 1=inertia
  transitionDuration: 10,  // seconds for state changes
  
  // Advanced
  usePressure: false,
  seasonalBias: false,
  diceType: '2d6',
  
  // Narrative override
  narrativeOverride: {
    enabled: false,
    targetState: 'storm',
    forceStrength: 0.3,
    onReached: 'resume'    // 'hold', 'resume', 'stop'
  }
}
```

---

## Technical Challenges

### 1. Smooth Transitions
**Challenge:** Avoid jarring jumps between states  
**Solution:** Momentum system + long transition durations + intensity scaling

### 2. State Convergence
**Challenge:** System stuck in one state  
**Solution:** Dice probability ensures drift, boundary behavior prevents edge-locking

### 3. Performance
**Challenge:** 60s ticks add overhead  
**Solution:** Lightweight calculations, cache resolved values, only update on change

### 4. Save/Load
**Challenge:** Preserve orchestrator state across sessions  
**Solution:** Store temp, humidity, momentum in profile config

### 5. Manual Override
**Challenge:** GM wants to manually set weather  
**Solution:** Pause button, disable flag, narrative override system

---

## Testing Strategy

### Unit Tests
- Dice probability distribution (2d6 matches bell curve)
- State resolution (all temp/humidity combos → correct state)
- Wind calculation (realistic speeds)
- Cloud mapping (0-100% humidity → 0.1-1.0 density)
- Boundary behavior (soft bouncing)

### Integration Tests
- 10min autonomous run (verify no crashes)
- Clear → Storm → Clear cycle
- Temp crossing freezing point (rain → sleet → snow)
- All 7 weather states reached over 1hr
- Save/load preserves state

### Performance Tests
- CPU usage per tick (< 5ms target)
- Memory stable over 1hr runtime
- No memory leaks

### User Acceptance
- GM can set ranges easily
- Real-time display accurate
- Controls responsive
- Weather feels realistic

---

## Future Enhancements

1. **Regional Weather**: Different zones with different conditions
2. **Weather Fronts**: Moving pressure systems across map
3. **Seasonal Cycles**: Auto-adjust temp ranges by month
4. **Historical Log**: Chart showing weather over time
5. **Weather Presets**: "Tropical Storm", "Arctic Winter", "Desert Summer"
6. **API Events**: Hooks for modules to react to weather changes
7. **Weather Forecast**: Show predicted conditions 10min ahead
8. **Climate Zones**: Temperate, tropical, arctic biomes with different rules

---

## File Structure

```
scripts/weather/
├── WeatherOrchestrator.js        (Main controller)
├── RandomWalkEngine.js           (Dice + drift logic)
├── AtmosphericParameters.js      (Temp/humidity/pressure)
├── WeatherStateResolver.js       (State mapping)
└── OrchestratorUI.js             (UI panel builder)

docs/
├── WEATHER_ORCHESTRATOR_PLAN.md  (This file)
├── WEATHER_ORCHESTRATOR_GUIDE.md (User manual)
└── WEATHER_ORCHESTRATOR_API.md   (Developer reference)
```

---

## Success Criteria

✅ **Core Functionality**
- Autonomous weather evolution over 1hr+ runtime
- All 7 weather states reachable
- Smooth transitions (no jarring jumps)
- Temperature determines precipitation type
- Humidity determines intensity

✅ **Integration**
- Wind synced with atmospheric conditions
- Clouds reflect humidity accurately
- Precipitation matches resolved state
- Manual controls still work when orchestrator disabled

✅ **User Experience**
- Easy to enable/configure
- Real-time feedback clear and accurate
- Controls intuitive
- Performance acceptable (<100ms per tick)

✅ **Robustness**
- No crashes during extended runtime
- Save/load preserves state
- Graceful degradation if systems unavailable
- Error handling prevents cascading failures

---

## Timeline Estimate

| Phase | Description | Hours | Dependencies |
|-------|-------------|-------|--------------|
| 1 | Core Infrastructure | 12-16 | None |
| 2 | Integration | 10-14 | Phase 1 |
| 3 | UI Development | 8-12 | Phase 1-2 |
| 4 | Advanced Features | 10-14 | Phase 1-3 |
| 5 | Polish & Docs | 4-6 | All phases |
| **Total** | **Full Implementation** | **44-62** | — |

**Realistic Schedule:** 1-2 weeks of focused development

---

## Conclusion

The Weather Orchestrator transforms Map Shine's weather system from static/manual to dynamic/autonomous. By modeling atmospheric physics (temperature, humidity, pressure) and using dice-based random walks, it creates emergent weather patterns that feel realistic and alive. GMs gain narrative control through range boundaries and override systems while enjoying hands-off weather evolution perfect for long sessions.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1 implementation
3. Iterate based on testing feedback
4. Deploy to production after Phase 5

---

*End of Weather Orchestrator Implementation Plan*
