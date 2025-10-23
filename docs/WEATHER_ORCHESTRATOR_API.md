# Weather Orchestrator - API Reference

**Companion Document to:** WEATHER_ORCHESTRATOR_PLAN.md  
**Version:** 1.0  
**Status:** Reference Implementation

---

## Class Specifications

### WeatherOrchestrator

Main controller class managing the entire orchestration system.

```javascript
class WeatherOrchestrator {
  constructor(config) {
    this.config = config;
    this.enabled = false;
    this.paused = false;
    
    // Components
    this.parameters = new AtmosphericParameters(config);
    this.walkEngine = new RandomWalkEngine(config, this.parameters);
    this.resolver = new WeatherStateResolver();
    
    // State
    this.tickTimer = null;
    this.lastTickTime = 0;
    this.tickCount = 0;
    this.stateHistory = [];
  }
  
  /**
   * Start the orchestrator
   */
  start() {
    if (this.enabled) return;
    this.enabled = true;
    this.paused = false;
    this._scheduleTick();
    console.log('Weather Orchestrator | Started');
  }
  
  /**
   * Stop the orchestrator
   */
  stop() {
    this.enabled = false;
    this._clearTimer();
    console.log('Weather Orchestrator | Stopped');
  }
  
  /**
   * Pause without resetting state
   */
  pause() {
    this.paused = true;
    this._clearTimer();
  }
  
  /**
   * Resume from pause
   */
  resume() {
    if (!this.enabled) return;
    this.paused = false;
    this._scheduleTick();
  }
  
  /**
   * Perform one orchestrator tick
   * @private
   */
  _tick() {
    if (!this.enabled || this.paused) return;
    
    // Update atmospheric parameters via random walk
    this.walkEngine.step();
    
    // Resolve weather state from parameters
    const resolvedState = this.resolver.resolve(
      this.parameters.temperature,
      this.parameters.humidity,
      this.parameters.pressure
    );
    
    // Apply to weather systems
    this._applyResolvedState(resolvedState);
    
    // Record history
    this.stateHistory.push({
      tick: this.tickCount,
      timestamp: Date.now(),
      ...resolvedState,
      temp: this.parameters.temperature,
      humidity: this.parameters.humidity
    });
    
    // Limit history to last 100 ticks
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
    
    this.tickCount++;
    this.lastTickTime = Date.now();
    
    // Schedule next tick
    this._scheduleTick();
  }
  
  /**
   * Schedule next tick
   * @private
   */
  _scheduleTick() {
    this._clearTimer();
    const interval = this.config.tickInterval * 1000; // Convert to ms
    this.tickTimer = setTimeout(() => this._tick(), interval);
  }
  
  /**
   * Clear tick timer
   * @private
   */
  _clearTimer() {
    if (this.tickTimer) {
      clearTimeout(this.tickTimer);
      this.tickTimer = null;
    }
  }
  
  /**
   * Apply resolved weather state to all systems
   * @param {Object} resolvedState - State from resolver
   * @private
   */
  _applyResolvedState(resolvedState) {
    // 1. Update WeatherSystemManager
    const weatherManager = game.mapShine?.weatherSystemManager;
    if (weatherManager) {
      weatherManager.transitionTo(resolvedState.state, {
        duration: this.config.transitionDuration,
        intensity: resolvedState.intensity
      });
    }
    
    // 2. Update WindManager
    this._applyWindConditions(resolvedState);
    
    // 3. Update CloudShadowsLayer
    this._applyCloudConditions(resolvedState);
    
    // 4. WeatherEffectLayer updates automatically from config
  }
  
  /**
   * Calculate and apply wind conditions
   * @param {Object} resolvedState
   * @private
   */
  _applyWindConditions(resolvedState) {
    const windManager = game.mapShine?.windManager;
    if (!windManager) return;
    
    const windData = this._calculateWind(
      this.parameters.temperature,
      this.parameters.humidity,
      this.parameters.pressure
    );
    
    windManager.updateFromConfig({
      baseSpeed: windData.baseSpeed,
      gustSpeed: windData.gustSpeed,
      gustFrequencyMin: 5,
      gustFrequencyMax: 15,
      angleChangeRange: 20 + windData.baseSpeed * 0.2
    });
  }
  
  /**
   * Calculate wind from atmospheric conditions
   * @param {number} temp - Temperature in °C
   * @param {number} humidity - Humidity 0-100%
   * @param {number} pressure - Pressure in hPa
   * @returns {Object} Wind configuration
   * @private
   */
  _calculateWind(temp, humidity, pressure) {
    const humidityWind = humidity * 0.5;
    const pressureWind = (1013 - pressure) * 2;
    const tempEffect = Math.abs(temp - 15) * 0.3;
    
    const baseSpeed = Math.max(20, humidityWind + pressureWind + tempEffect);
    const gustSpeed = baseSpeed * 1.8;
    
    return {
      baseSpeed: Math.round(baseSpeed),
      gustSpeed: Math.round(gustSpeed)
    };
  }
  
  /**
   * Calculate and apply cloud conditions
   * @param {Object} resolvedState
   * @private
   */
  _applyCloudConditions(resolvedState) {
    const cloudLayer = canvas.layers.find(l => l.constructor.name === 'CloudShadowsLayer');
    if (!cloudLayer) return;
    
    const config = game.mapShine.profileManager.activeConfig;
    const cloudData = this._calculateClouds(
      this.parameters.humidity,
      resolvedState.state
    );
    
    config.cloudShadows.density = cloudData.density;
    config.cloudShadows.threshold = cloudData.threshold;
    config.cloudShadows.softness = cloudData.softness;
    
    cloudLayer.updateFromConfig(config);
  }
  
  /**
   * Calculate cloud properties from humidity
   * @param {number} humidity - 0-100%
   * @param {string} state - Weather state
   * @returns {Object} Cloud configuration
   * @private
   */
  _calculateClouds(humidity, state) {
    const density = Math.min(1.0, 0.1 + humidity * 0.009);
    const threshold = ['storm', 'blizzard'].includes(state) 
      ? 0.25 
      : 0.5 - humidity * 0.003;
    const softness = 0.4 + density * 0.3;
    
    return { density, threshold, softness };
  }
  
  /**
   * Reset to center of ranges
   */
  resetToCenter() {
    const tempCenter = (this.config.temperatureMin + this.config.temperatureMax) / 2;
    const humidityCenter = (this.config.humidityMin + this.config.humidityMax) / 2;
    
    this.parameters.setTemperature(tempCenter);
    this.parameters.setHumidity(humidityCenter);
    this.walkEngine.resetMomentum();
    
    console.log(`Weather Orchestrator | Reset to ${tempCenter}°C, ${humidityCenter}%`);
  }
  
  /**
   * Get diagnostic information
   * @returns {Object} Diagnostics
   */
  getDiagnostics() {
    const nextTickIn = this.tickTimer 
      ? Math.max(0, this.config.tickInterval - (Date.now() - this.lastTickTime) / 1000)
      : 0;
    
    return {
      enabled: this.enabled,
      paused: this.paused,
      tickCount: this.tickCount,
      nextTickIn: Math.round(nextTickIn),
      
      temperature: this.parameters.temperature,
      humidity: this.parameters.humidity,
      pressure: this.parameters.pressure,
      
      tempMomentum: this.walkEngine.tempMomentum,
      humidityMomentum: this.walkEngine.humidityMomentum,
      
      currentState: this.stateHistory.length > 0 
        ? this.stateHistory[this.stateHistory.length - 1].state 
        : 'unknown',
      
      stateHistory: this.stateHistory
    };
  }
  
  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.walkEngine.updateConfig(this.config);
    this.parameters.updateRanges(
      newConfig.temperatureMin,
      newConfig.temperatureMax,
      newConfig.humidityMin,
      newConfig.humidityMax
    );
  }
  
  /**
   * Destroy orchestrator
   */
  destroy() {
    this.stop();
    this.walkEngine = null;
    this.parameters = null;
    this.resolver = null;
    console.log('Weather Orchestrator | Destroyed');
  }
}
```

---

### RandomWalkEngine

Handles dice-based random walks with momentum.

```javascript
class RandomWalkEngine {
  constructor(config, parameters) {
    this.config = config;
    this.parameters = parameters;
    
    // Momentum state
    this.tempMomentum = 0;
    this.humidityMomentum = 0;
  }
  
  /**
   * Perform one random walk step
   */
  step() {
    // Roll dice
    const tempRoll = this._rollDice();
    const humidityRoll = this._rollDice();
    
    // Calculate raw deltas
    const rawTempDelta = (tempRoll - 7) * this.config.tempStepSize;
    const rawHumidityDelta = (humidityRoll - 7) * this.config.humidityStepSize;
    
    // Apply momentum blending
    const momentumFactor = this.config.momentum;
    this.tempMomentum = this.tempMomentum * momentumFactor + rawTempDelta * (1 - momentumFactor);
    this.humidityMomentum = this.humidityMomentum * momentumFactor + rawHumidityDelta * (1 - momentumFactor);
    
    // Apply to parameters
    this.parameters.adjustTemperature(this.tempMomentum);
    this.parameters.adjustHumidity(this.humidityMomentum);
  }
  
  /**
   * Roll dice based on configured system
   * @returns {number} Roll result
   * @private
   */
  _rollDice() {
    const type = this.config.diceType;
    
    switch (type) {
      case '2d6':
        return this._roll(2, 6);
      case '1d20':
        // Map 1d20 to 2-12 range for compatibility
        const d20 = this._roll(1, 20);
        return 2 + Math.floor((d20 - 1) / 2); // 1-20 → 2-12
      case '3d6':
        return this._roll(3, 6);
      default:
        return this._roll(2, 6); // Fallback
    }
  }
  
  /**
   * Roll N dice with D sides
   * @param {number} count - Number of dice
   * @param {number} sides - Number of sides
   * @returns {number} Sum of rolls
   * @private
   */
  _roll(count, sides) {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += Math.floor(Math.random() * sides) + 1;
    }
    return sum;
  }
  
  /**
   * Reset momentum to zero
   */
  resetMomentum() {
    this.tempMomentum = 0;
    this.humidityMomentum = 0;
  }
  
  /**
   * Update configuration
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}
```

---

### AtmosphericParameters

Manages temperature, humidity, and pressure with clamping.

```javascript
class AtmosphericParameters {
  constructor(config) {
    this.config = config;
    
    // Current values
    this._temperature = config.temperatureCurrent || 18;
    this._humidity = config.humidityCurrent || 60;
    this._pressure = 1013; // Will be derived
  }
  
  /**
   * Temperature getter
   */
  get temperature() {
    return this._temperature;
  }
  
  /**
   * Humidity getter
   */
  get humidity() {
    return this._humidity;
  }
  
  /**
   * Pressure getter (derived)
   */
  get pressure() {
    if (this.config.usePressure) {
      return this._derivePressure();
    }
    return 1013; // Standard pressure if not using system
  }
  
  /**
   * Set temperature directly
   * @param {number} value
   */
  setTemperature(value) {
    this._temperature = this._clampTemp(value);
    this._updatePressure();
  }
  
  /**
   * Set humidity directly
   * @param {number} value
   */
  setHumidity(value) {
    this._humidity = this._clampHumidity(value);
    this._updatePressure();
  }
  
  /**
   * Adjust temperature by delta
   * @param {number} delta
   */
  adjustTemperature(delta) {
    this._temperature = this._clampTemp(this._temperature + delta);
    this._updatePressure();
  }
  
  /**
   * Adjust humidity by delta
   * @param {number} delta
   */
  adjustHumidity(delta) {
    this._humidity = this._clampHumidity(this._humidity + delta);
    this._updatePressure();
  }
  
  /**
   * Clamp temperature to configured range
   * @param {number} value
   * @returns {number} Clamped value
   * @private
   */
  _clampTemp(value) {
    return Math.max(
      this.config.temperatureMin,
      Math.min(this.config.temperatureMax, value)
    );
  }
  
  /**
   * Clamp humidity to 0-100%
   * @param {number} value
   * @returns {number} Clamped value
   * @private
   */
  _clampHumidity(value) {
    // Also respect configured range
    const min = this.config.humidityMin || 0;
    const max = this.config.humidityMax || 100;
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Derive pressure from temperature and humidity
   * @returns {number} Pressure in hPa
   * @private
   */
  _derivePressure() {
    const basePressure = 1013;
    const humidityEffect = (50 - this._humidity) * 0.4;
    const tempEffect = (15 - this._temperature) * 0.3;
    return basePressure + humidityEffect + tempEffect;
  }
  
  /**
   * Update derived pressure
   * @private
   */
  _updatePressure() {
    this._pressure = this._derivePressure();
  }
  
  /**
   * Update valid ranges
   * @param {number} tempMin
   * @param {number} tempMax
   * @param {number} humidityMin
   * @param {number} humidityMax
   */
  updateRanges(tempMin, tempMax, humidityMin, humidityMax) {
    this.config.temperatureMin = tempMin;
    this.config.temperatureMax = tempMax;
    this.config.humidityMin = humidityMin;
    this.config.humidityMax = humidityMax;
    
    // Re-clamp current values to new ranges
    this._temperature = this._clampTemp(this._temperature);
    this._humidity = this._clampHumidity(this._humidity);
  }
}
```

---

### WeatherStateResolver

Maps atmospheric parameters to weather states.

```javascript
class WeatherStateResolver {
  /**
   * Resolve weather state from atmospheric parameters
   * @param {number} temperature - °C
   * @param {number} humidity - 0-100%
   * @param {number} pressure - hPa
   * @returns {Object} Resolved state
   */
  resolve(temperature, humidity, pressure) {
    // Determine precipitation type from temperature
    const precipType = this._getPrecipitationType(temperature);
    
    // Determine state and intensity from humidity
    const { state, intensity } = this._getStateFromHumidity(humidity, precipType);
    
    return {
      state,
      intensity,
      precipType,
      temperature,
      humidity,
      pressure
    };
  }
  
  /**
   * Get precipitation type from temperature
   * @param {number} temp
   * @returns {string|null}
   * @private
   */
  _getPrecipitationType(temp) {
    if (temp < -2) return 'snow';
    if (temp <= 2) return 'sleet';
    return 'rain';
  }
  
  /**
   * Get state and intensity from humidity and precip type
   * @param {number} humidity
   * @param {string|null} precipType
   * @returns {Object} {state, intensity}
   * @private
   */
  _getStateFromHumidity(humidity, precipType) {
    // 0-30%: Clear
    if (humidity < 30) {
      return { state: 'clear', intensity: 0 };
    }
    
    // 30-60%: Light precipitation or clear
    if (humidity < 60) {
      const intensity = 0.3 + (humidity - 30) / 30 * 0.3; // 0.3-0.6
      
      if (precipType === 'rain') {
        return { state: 'drizzle', intensity };
      } else if (precipType === 'snow') {
        return { state: 'snow', intensity: intensity * 0.8 }; // Lighter
      } else { // sleet
        return { state: 'sleet', intensity };
      }
    }
    
    // 60-80%: Moderate to heavy precipitation
    if (humidity < 80) {
      const intensity = 0.6 + (humidity - 60) / 20 * 0.3; // 0.6-0.9
      
      if (precipType === 'rain') {
        return { state: 'rain', intensity };
      } else if (precipType === 'snow') {
        return { state: 'snow', intensity };
      } else { // sleet
        return { state: 'sleet', intensity };
      }
    }
    
    // 80-100%: Storm conditions
    const intensity = 0.9 + (humidity - 80) / 20 * 0.1; // 0.9-1.0
    
    if (precipType === 'snow') {
      return { state: 'blizzard', intensity };
    } else {
      return { state: 'storm', intensity }; // Rain or sleet
    }
  }
}
```

---

## Integration Example

```javascript
// In module.js initialization
class MapShineLifecycle {
  static async runFullSetup() {
    // ... existing setup ...
    
    // Initialize Weather Orchestrator
    const orchestratorConfig = game.mapShine.profileManager.activeConfig.weather.orchestrator;
    
    if (orchestratorConfig.enabled) {
      game.mapShine.weatherOrchestrator = new WeatherOrchestrator(orchestratorConfig);
      game.mapShine.weatherOrchestrator.start();
      console.log('Map Shine | Weather Orchestrator started');
    }
  }
}

// In scene teardown
class SceneChangeManager {
  async _performTeardown() {
    // ... existing teardown ...
    
    // Save orchestrator state
    if (game.mapShine.weatherOrchestrator) {
      const config = game.mapShine.profileManager.activeConfig.weather.orchestrator;
      const params = game.mapShine.weatherOrchestrator.parameters;
      
      config.temperatureCurrent = params.temperature;
      config.humidityCurrent = params.humidity;
      config.tempMomentum = game.mapShine.weatherOrchestrator.walkEngine.tempMomentum;
      config.humidityMomentum = game.mapShine.weatherOrchestrator.walkEngine.humidityMomentum;
      
      // Save to profile
      await game.mapShine.profileManager.saveActiveConfig();
    }
  }
}
```

---

## Narrative Override Feature

```javascript
class WeatherOrchestrator {
  /**
   * Enable narrative override to force weather toward target
   * @param {string} targetState - Desired state
   * @param {number} forceStrength - 0-1, how aggressively to push
   * @param {string} onReached - 'hold', 'resume', or 'stop'
   */
  enableNarrativeOverride(targetState, forceStrength = 0.3, onReached = 'resume') {
    this.config.narrativeOverride = {
      enabled: true,
      targetState,
      forceStrength,
      onReached
    };
  }
  
  /**
   * Disable narrative override
   */
  disableNarrativeOverride() {
    this.config.narrativeOverride.enabled = false;
  }
  
  /**
   * Modified tick with narrative override
   * @private
   */
  _tick() {
    // Check if narrative override active
    if (this.config.narrativeOverride.enabled) {
      this._applyNarrativeOverride();
    } else {
      // Normal random walk
      this.walkEngine.step();
    }
    
    // ... rest of tick logic ...
  }
  
  /**
   * Apply narrative override force
   * @private
   */
  _applyNarrativeOverride() {
    const target = this.config.narrativeOverride.targetState;
    const force = this.config.narrativeOverride.forceStrength;
    
    // Get target conditions for desired state
    const targetConditions = this._getTargetConditions(target);
    
    // Calculate deltas toward target
    const tempDelta = (targetConditions.temp - this.parameters.temperature) * force;
    const humidityDelta = (targetConditions.humidity - this.parameters.humidity) * force;
    
    // Apply deltas
    this.parameters.adjustTemperature(tempDelta);
    this.parameters.adjustHumidity(humidityDelta);
    
    // Check if target reached
    const currentState = this.resolver.resolve(
      this.parameters.temperature,
      this.parameters.humidity,
      this.parameters.pressure
    ).state;
    
    if (currentState === target) {
      const action = this.config.narrativeOverride.onReached;
      
      if (action === 'hold') {
        // Keep forcing to maintain state
        // Do nothing, will keep applying force
      } else if (action === 'resume') {
        // Return to autonomous
        this.disableNarrativeOverride();
        console.log('Weather Orchestrator | Target reached, resuming autonomous');
      } else if (action === 'stop') {
        // Stop orchestrator entirely
        this.stop();
        console.log('Weather Orchestrator | Target reached, stopping');
      }
    }
  }
  
  /**
   * Get atmospheric conditions for a target state
   * @param {string} state
   * @returns {Object} {temp, humidity}
   * @private
   */
  _getTargetConditions(state) {
    // Map states to typical conditions
    const stateMap = {
      'clear': { temp: 20, humidity: 25 },
      'drizzle': { temp: 15, humidity: 45 },
      'rain': { temp: 12, humidity: 70 },
      'storm': { temp: 10, humidity: 90 },
      'sleet': { temp: 0, humidity: 75 },
      'snow': { temp: -5, humidity: 65 },
      'blizzard': { temp: -10, humidity: 85 }
    };
    
    return stateMap[state] || { temp: 15, humidity: 50 };
  }
}
```

---

*End of Weather Orchestrator API Reference*
