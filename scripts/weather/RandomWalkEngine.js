/**
 * Random Walk Engine for Weather Orchestrator
 * 
 * Uses dice-based random walks to create natural atmospheric parameter drift.
 * Implements 2d6 system for bell curve distribution (most results near average).
 * 
 * @module RandomWalkEngine
 */

import { DiceRoller } from '../utils/DiceRoller.js';

export class RandomWalkEngine {
  /**
   * Creates a new random walk engine
   * @param {Object} config - Configuration from MODULE_DEFAULTS.weather.orchestrator
   */
  constructor(config) {
    this.config = config;
    this.diceType = config.diceType || '2d6';
    
    // Step sizes for each parameter
    this.tempStepSize = config.tempStepSize || 0.5;
    this.humidityStepSize = config.humidityStepSize || 2.0;
    
    // Tick interval in seconds
    this.tickInterval = config.tickInterval || 60;
    this.lastTickTime = Date.now();
    
    // Narrative override settings
    this.narrativeOverride = {
      enabled: false,
      targetTemp: null,
      targetHumidity: null,
      forceStrength: 0.3 // How strongly to push toward target (0-1)
    };
    
    console.log(`MapShine | RandomWalkEngine initialized with ${this.diceType} system`);
  }
  
  /**
   * Update the engine (called each frame)
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {Object|null} Parameter changes if tick occurred, null otherwise
   */
  update(deltaTime) {
    const now = Date.now();
    const elapsed = (now - this.lastTickTime) / 1000;
    
    if (elapsed >= this.tickInterval) {
      this.lastTickTime = now;
      return this.tick();
    }
    
    return null;
  }
  
  /**
   * Perform a single tick of the random walk
   * @returns {Object} Delta values for temperature and humidity
   */
  tick() {
    const tempDelta = this.rollTemperatureChange();
    const humidityDelta = this.rollHumidityChange();
    
    console.log(`MapShine | Random Walk Tick: temp ${tempDelta > 0 ? '+' : ''}${tempDelta.toFixed(2)}, humidity ${humidityDelta > 0 ? '+' : ''}${humidityDelta.toFixed(2)}`);
    
    return {
      temperature: tempDelta,
      humidity: humidityDelta
    };
  }
  
  /**
   * Roll for temperature change
   * @returns {number} Temperature delta
   */
  rollTemperatureChange() {
    // Roll dice
    let roll = DiceRoller.rollByType(this.diceType);
    
    // Convert to delta based on dice type
    let delta = this._convertRollToDelta(roll, this.diceType);
    
    // Scale by step size
    delta *= this.tempStepSize;
    
    // Apply narrative override if active
    if (this.narrativeOverride.enabled && this.narrativeOverride.targetTemp !== null) {
      delta = this._applyNarrativeForce(delta, 'temperature');
    }
    
    return delta;
  }
  
  /**
   * Roll for humidity change
   * @returns {number} Humidity delta
   */
  rollHumidityChange() {
    // Roll dice
    let roll = DiceRoller.rollByType(this.diceType);
    
    // Convert to delta
    let delta = this._convertRollToDelta(roll, this.diceType);
    
    // Scale by step size
    delta *= this.humidityStepSize;
    
    // Apply narrative override if active
    if (this.narrativeOverride.enabled && this.narrativeOverride.targetHumidity !== null) {
      delta = this._applyNarrativeForce(delta, 'humidity');
    }
    
    return delta;
  }
  
  /**
   * Convert dice roll to delta value (-1 to +1)
   * @param {number} roll - Dice roll result
   * @param {string} diceType - Type of dice used
   * @returns {number} Delta value
   * @private
   */
  _convertRollToDelta(roll, diceType) {
    switch (diceType) {
      case '2d6':
        // 2d6: Result 2-12, average 7
        // Map: 2 → -1, 7 → 0, 12 → +1
        return (roll - 7) / 5;
        
      case '3d6':
        // 3d6: Result 3-18, average 10.5
        // Map: 3 → -1, 10.5 → 0, 18 → +1
        return (roll - 10.5) / 7.5;
        
      case '1d20':
        // 1d20: Result 1-20, average 10.5
        // Map: 1 → -1, 10.5 → 0, 20 → +1
        return (roll - 10.5) / 9.5;
        
      default:
        console.warn(`RandomWalkEngine | Unknown dice type ${diceType}, using 2d6`);
        return (roll - 7) / 5;
    }
  }
  
  /**
   * Apply narrative force to gently push parameters toward target
   * @param {number} baseDelta - Base random delta
   * @param {string} param - Parameter name ('temperature' or 'humidity')
   * @returns {number} Modified delta
   * @private
   */
  _applyNarrativeForce(baseDelta, param) {
    const target = param === 'temperature' 
      ? this.narrativeOverride.targetTemp 
      : this.narrativeOverride.targetHumidity;
    
    if (target === null) return baseDelta;
    
    // Get current value from atmospheric parameters (passed in via orchestrator)
    // For now, just apply force in the direction of the target
    const forceStrength = this.narrativeOverride.forceStrength;
    
    // If baseDelta moves us toward target, amplify it
    // If baseDelta moves us away from target, dampen it
    // This creates a gentle bias without overriding randomness completely
    
    // Simplified: Just add a small bias toward target
    const bias = target > 0 ? forceStrength : -forceStrength;
    
    return baseDelta + bias;
  }
  
  /**
   * Enable narrative override to push weather toward a specific state
   * @param {Object} options - Override options
   * @param {number} options.targetTemp - Target temperature (null to disable)
   * @param {number} options.targetHumidity - Target humidity (null to disable)
   * @param {number} options.forceStrength - Force strength (0-1)
   */
  enableNarrativeOverride(options) {
    this.narrativeOverride.enabled = true;
    this.narrativeOverride.targetTemp = options.targetTemp ?? null;
    this.narrativeOverride.targetHumidity = options.targetHumidity ?? null;
    this.narrativeOverride.forceStrength = options.forceStrength ?? 0.3;
    
    console.log('MapShine | Narrative override enabled:', this.narrativeOverride);
  }
  
  /**
   * Disable narrative override
   */
  disableNarrativeOverride() {
    this.narrativeOverride.enabled = false;
    console.log('MapShine | Narrative override disabled');
  }
  
  /**
   * Set tick interval
   * @param {number} seconds - New interval in seconds
   */
  setTickInterval(seconds) {
    this.tickInterval = seconds;
    console.log(`MapShine | Tick interval set to ${seconds}s`);
  }
  
  /**
   * Set dice type
   * @param {string} diceType - Dice type ('2d6', '3d6', '1d20')
   */
  setDiceType(diceType) {
    this.diceType = diceType;
    console.log(`MapShine | Dice type set to ${diceType}`);
  }
  
  /**
   * Get diagnostics for UI
   * @returns {Object} Diagnostic data
   */
  getDiagnostics() {
    const now = Date.now();
    const elapsed = (now - this.lastTickTime) / 1000;
    const nextTickIn = Math.max(0, this.tickInterval - elapsed);
    
    return {
      diceType: this.diceType,
      tickInterval: `${this.tickInterval}s`,
      nextTickIn: `${nextTickIn.toFixed(1)}s`,
      tempStepSize: this.tempStepSize,
      humidityStepSize: this.humidityStepSize,
      narrativeOverride: this.narrativeOverride.enabled,
      narrativeTarget: this.narrativeOverride.enabled 
        ? `T:${this.narrativeOverride.targetTemp}, H:${this.narrativeOverride.targetHumidity}`
        : 'N/A'
    };
  }
  
  /**
   * Force an immediate tick (for testing)
   * @returns {Object} Parameter changes
   */
  forceTick() {
    this.lastTickTime = Date.now();
    return this.tick();
  }
}
