/**
 * Effect Registry - Weather System Integration Management
 * 
 * Manages registration and coordination of all weather effect systems.
 * Provides unified interface for applying weather states to different systems.
 * 
 * @module EffectRegistry
 */

export class EffectRegistry {
  constructor() {
    // Registered effect systems
    this.registeredEffects = new Map();
    
    // Effect update queue sorted by priority
    this.updateQueue = [];
    
    // System capabilities registry
    this.systemCapabilities = new Map();
    
    // Effect dependencies
    this.dependencies = new Map();
    
    // Update statistics
    this.updateStats = {
      totalUpdates: 0,
      failedUpdates: 0,
      lastUpdateTime: 0,
      averageUpdateTime: 0
    };
    
    console.log('MapShine | EffectRegistry initialized');
  }
  
  /**
   * Register a weather effect system
   * @param {string} effectName - Unique name for the effect
   * @param {Object} effectConfig - Effect configuration
   * @param {Function} effectConfig.updateFunction - Function called when weather state changes
   * @param {Function} effectConfig.transitionFunction - Function called during transitions
   * @param {number} effectConfig.priority - Update priority (lower = earlier)
   * @param {Array} effectConfig.capabilities - Array of effect capabilities
   * @param {Array} effectConfig.dependencies - Array of required dependencies
   * @param {boolean} effectConfig.enabled - Whether effect is initially enabled
   * @returns {boolean} Success status
   */
  registerEffect(effectName, effectConfig) {
    // Validate required properties
    if (!effectConfig.updateFunction || typeof effectConfig.updateFunction !== 'function') {
      console.error(`EffectRegistry | Effect ${effectName} must provide updateFunction`);
      return false;
    }
    
    // Check for name conflicts
    if (this.registeredEffects.has(effectName)) {
      console.warn(`EffectRegistry | Effect ${effectName} is already registered`);
      return false;
    }
    
    const effect = {
      name: effectName,
      updateFunction: effectConfig.updateFunction,
      transitionFunction: effectConfig.transitionFunction || function(fromState, toState, progress) {
        // Default transition behavior
        const transitionState = this._createTransitionState(fromState, toState, progress);
        effectConfig.updateFunction(transitionState);
      }.bind(this),
      priority: effectConfig.priority || 100,
      capabilities: new Set(effectConfig.capabilities || []),
      dependencies: new Set(effectConfig.dependencies || []),
      enabled: effectConfig.enabled !== false,
      lastUpdate: 0,
      updateCount: 0,
      errorCount: 0,
      lastError: null
    };
    
    this.registeredEffects.set(effectName, effect);
    this._rebuildUpdateQueue();
    
    // Update capabilities registry
    this.systemCapabilities.set(effectName, effect.capabilities);
    
    // Update dependencies registry
    this.dependencies.set(effectName, effect.dependencies);
    
    console.log(`EffectRegistry | Registered effect: ${effectName} (priority: ${effect.priority})`);
    return true;
  }
  
  /**
   * Unregister a weather effect system
   * @param {string} effectName - Name of the effect to unregister
   * @returns {boolean} Success status
   */
  unregisterEffect(effectName) {
    const removed = this.registeredEffects.delete(effectName);
    if (removed) {
      this.systemCapabilities.delete(effectName);
      this.dependencies.delete(effectName);
      this._rebuildUpdateQueue();
      console.log(`EffectRegistry | Unregistered effect: ${effectName}`);
    }
    return removed;
  }
  
  /**
   * Enable or disable a weather effect
   * @param {string} effectName - Name of the effect
   * @param {boolean} enabled - Whether to enable the effect
   * @returns {boolean} Success status
   */
  setEffectEnabled(effectName, enabled) {
    const effect = this.registeredEffects.get(effectName);
    if (!effect) {
      console.warn(`EffectRegistry | Effect ${effectName} not found`);
      return false;
    }
    
    effect.enabled = enabled;
    console.log(`EffectRegistry | Effect ${effectName} ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }
  
  /**
   * Apply weather state to all registered effects
   * @param {Object} weatherState - Weather state definition
   * @param {Object} options - Apply options
   * @param {boolean} options.forceUpdate - Force update even if state hasn't changed
   * @param {Array} options.onlyEffects - Only update specific effects
   * @returns {Object} Update results
   */
  applyWeatherState(weatherState, options = {}) {
    console.log('EffectRegistry | applyWeatherState called with:', weatherState?.name || weatherState);
    console.log('EffectRegistry | Registered effects count:', this.registeredEffects.size);
    const startTime = Date.now();
    const results = {
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
    
    const effectsToUpdate = options.onlyEffects 
      ? this.updateQueue.filter(effect => options.onlyEffects.includes(effect.name))
      : this.updateQueue;
    
    for (const effect of effectsToUpdate) {
      if (!effect.enabled) {
        results.skipped++;
        continue;
      }
      
      try {
        // Check dependencies
        if (!this._checkDependencies(effect.name)) {
          console.warn(`EffectRegistry | Skipping ${effect.name} due to unmet dependencies`);
          results.skipped++;
          continue;
        }
        
        // Update the effect
        effect.updateFunction(weatherState);
        effect.lastUpdate = startTime;
        effect.updateCount++;
        results.updated++;
        
      } catch (error) {
        effect.errorCount++;
        effect.lastError = error;
        results.failed++;
        results.errors.push({
          effect: effect.name,
          error: error.message
        });
        console.error(`EffectRegistry | Failed to update effect ${effect.name}:`, error);
      }
    }
    
    // Update statistics
    const duration = Date.now() - startTime;
    this.updateStats.totalUpdates++;
    this.updateStats.lastUpdateTime = startTime;
    this.updateStats.averageUpdateTime = 
      (this.updateStats.averageUpdateTime * (this.updateStats.totalUpdates - 1) + duration) 
      / this.updateStats.totalUpdates;
    
    if (results.failed > 0) {
      this.updateStats.failedUpdates++;
    }
    
    return results;
  }
  
  /**
   * Apply weather transition to all registered effects
   * @param {string} fromState - Source weather state name
   * @param {string} toState - Target weather state name
   * @param {number} progress - Transition progress (0-1)
   * @param {Object} fromStateDef - Source state definition
   * @param {Object} toStateDef - Target state definition
   * @param {Object} options - Transition options
   * @returns {Object} Transition results
   */
  applyWeatherTransition(fromState, toState, progress, fromStateDef, toStateDef, options = {}) {
    const startTime = Date.now();
    const results = {
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
    
    // Create interpolated state
    const interpolatedState = this._createTransitionState(fromStateDef, toStateDef, progress);
    
    for (const effect of this.updateQueue) {
      if (!effect.enabled) {
        results.skipped++;
        continue;
      }
      
      try {
        // Check dependencies
        if (!this._checkDependencies(effect.name)) {
          results.skipped++;
          continue;
        }
        
        // Apply transition
        if (effect.transitionFunction) {
          effect.transitionFunction(fromStateDef, toStateDef, progress, interpolatedState);
        } else {
          effect.updateFunction(interpolatedState);
        }
        
        effect.lastUpdate = startTime;
        effect.updateCount++;
        results.updated++;
        
      } catch (error) {
        effect.errorCount++;
        effect.lastError = error;
        results.failed++;
        results.errors.push({
          effect: effect.name,
          error: error.message
        });
        console.error(`EffectRegistry | Failed to transition effect ${effect.name}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Get effects that support specific capabilities
   * @param {Array|string} capabilities - Required capabilities
   * @returns {Array} Array of effect names
   */
  getEffectsByCapabilities(capabilities) {
    const requiredCaps = Array.isArray(capabilities) ? capabilities : [capabilities];
    const matchingEffects = [];
    
    for (const [name, caps] of this.systemCapabilities.entries()) {
      if (requiredCaps.every(cap => caps.has(cap))) {
        matchingEffects.push(name);
      }
    }
    
    return matchingEffects;
  }
  
  /**
   * Get effects that depend on specific effects
   * @param {Array|string} dependencies - Dependencies to check
   * @returns {Array} Array of effect names
   */
  getEffectsByDependencies(dependencies) {
    const requiredDeps = Array.isArray(dependencies) ? dependencies : [dependencies];
    const dependentEffects = [];
    
    for (const [name, deps] of this.dependencies.entries()) {
      if (requiredDeps.some(dep => deps.has(dep))) {
        dependentEffects.push(name);
      }
    }
    
    return dependentEffects;
  }
  
  /**
   * Get effect information
   * @param {string} effectName - Name of the effect
   * @returns {Object|null} Effect information
   */
  getEffectInfo(effectName) {
    const effect = this.registeredEffects.get(effectName);
    if (!effect) {
      return null;
    }
    
    return {
      name: effect.name,
      priority: effect.priority,
      enabled: effect.enabled,
      capabilities: Array.from(effect.capabilities),
      dependencies: Array.from(effect.dependencies),
      updateCount: effect.updateCount,
      errorCount: effect.errorCount,
      lastError: effect.lastError?.message,
      lastUpdate: effect.lastUpdate
    };
  }
  
  /**
   * Get all registered effects information
   * @returns {Array} Array of effect information
   */
  getAllEffects() {
    return Array.from(this.registeredEffects.keys()).map(name => this.getEffectInfo(name));
  }
  
  /**
   * Get registry statistics
   * @returns {Object} Statistics information
   */
  getStatistics() {
    const enabledEffects = Array.from(this.registeredEffects.values())
      .filter(effect => effect.enabled).length;
    const effectsWithErrors = Array.from(this.registeredEffects.values())
      .filter(effect => effect.errorCount > 0).length;
    
    return {
      totalEffects: this.registeredEffects.size,
      enabledEffects,
      disabledEffects: this.registeredEffects.size - enabledEffects,
      effectsWithErrors,
      totalUpdates: this.updateStats.totalUpdates,
      failedUpdates: this.updateStats.failedUpdates,
      averageUpdateTime: Math.round(this.updateStats.averageUpdateTime * 100) / 100,
      lastUpdateTime: this.updateStats.lastUpdateTime
    };
  }
  
  /**
   * Validate effect configuration
   * @param {Object} effectConfig - Effect configuration to validate
   * @returns {Object} Validation result
   */
  validateEffectConfig(effectConfig) {
    const errors = [];
    const warnings = [];
    
    // Required properties
    if (!effectConfig.updateFunction) {
      errors.push('Missing required updateFunction');
    } else if (typeof effectConfig.updateFunction !== 'function') {
      errors.push('updateFunction must be a function');
    }
    
    // Optional but recommended properties
    if (effectConfig.transitionFunction && typeof effectConfig.transitionFunction !== 'function') {
      warnings.push('transitionFunction should be a function');
    }
    
    if (effectConfig.priority && (typeof effectConfig.priority !== 'number' || effectConfig.priority < 0)) {
      warnings.push('priority should be a non-negative number');
    }
    
    if (!effectConfig.capabilities || !Array.isArray(effectConfig.capabilities)) {
      warnings.push('capabilities should be an array of strings');
    }
    
    if (!effectConfig.dependencies || !Array.isArray(effectConfig.dependencies)) {
      warnings.push('dependencies should be an array of strings');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Check if all dependencies for an effect are satisfied
   * @param {string} effectName - Name of the effect
   * @returns {boolean} Whether dependencies are satisfied
   * @private
   */
  _checkDependencies(effectName) {
    const deps = this.dependencies.get(effectName);
    if (!deps || deps.size === 0) {
      return true; // No dependencies
    }
    
    // Check if all dependencies are enabled and registered
    for (const dep of deps) {
      const depEffect = this.registeredEffects.get(dep);
      if (!depEffect || !depEffect.enabled) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Create interpolated weather state for transitions
   * @param {Object} fromState - Source state definition
   * @param {Object} toState - Target state definition
   * @param {number} progress - Transition progress (0-1)
   * @returns {Object} Interpolated state
   * @private
   */
  _createTransitionState(fromState, toState, progress) {
    const t = this._easeInOutCubic(progress);
    const interpolated = {
      name: `${fromState.name} → ${toState.name}`,
      isTransition: true,
      progress,
      easing: t
    };
    
    // Interpolate common properties
    for (const category of ['atmospheric', 'visual', 'clouds', 'precipitation', 'environment', 'audio', 'effects']) {
      if (fromState[category] && toState[category]) {
        interpolated[category] = this._interpolateObject(fromState[category], toState[category], t);
      } else if (toState[category]) {
        interpolated[category] = toState[category];
      } else if (fromState[category]) {
        interpolated[category] = fromState[category];
      }
    }
    
    return interpolated;
  }
  
  /**
   * Interpolate object properties
   * @param {Object} from - Source object
   * @param {Object} to - Target object
   * @param {number} t - Progress (0-1)
   * @returns {Object} Interpolated object
   * @private
   */
  _interpolateObject(from, to, t) {
    if (typeof from !== 'object' || typeof to !== 'object') {
      return typeof from === 'number' && typeof to === 'number'
        ? from + (to - from) * t
        : to; // Fallback to target for non-numeric types
    }
    
    const result = {};
    
    // Handle color objects with r,g,b properties
    if (from.r !== undefined && to.r !== undefined) {
      result.r = from.r + (to.r - from.r) * t;
      result.g = from.g + (to.g - from.g) * t;
      result.b = from.b + (to.b - from.b) * t;
      return result;
    }
    
    // Handle generic objects
    for (const key of Object.keys(to)) {
      if (from[key] !== undefined && to[key] !== undefined) {
        if (typeof from[key] === 'number' && typeof to[key] === 'number') {
          result[key] = from[key] + (to[key] - from[key]) * t;
        } else if (typeof from[key] === 'object' && typeof to[key] === 'object') {
          result[key] = this._interpolateObject(from[key], to[key], t);
        } else {
          result[key] = t < 0.5 ? from[key] : to[key];
        }
      } else {
        result[key] = to[key];
      }
    }
    
    return result;
  }
  
  /**
   * Ease-in-out cubic function
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased progress
   * @private
   */
  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Rebuild the update queue sorted by priority
   * @private
   */
  _rebuildUpdateQueue() {
    this.updateQueue = Array.from(this.registeredEffects.values())
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Destroy the registry
   */
  destroy() {
    this.registeredEffects.clear();
    this.updateQueue.length = 0;
    this.systemCapabilities.clear();
    this.dependencies.clear();
    
    // Reset statistics
    this.updateStats = {
      totalUpdates: 0,
      failedUpdates: 0,
      lastUpdateTime: 0,
      averageUpdateTime: 0
    };
    
    console.log('EffectRegistry destroyed');
  }
}
