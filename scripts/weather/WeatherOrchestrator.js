/**
 * Weather Orchestrator - Main Controller
 * 
 * Coordinates all weather orchestration systems:
 * - Atmospheric parameter tracking (AtmosphericParameters)
 * - Random walk simulation (RandomWalkEngine)
 * - State resolution (WeatherStateResolver)
 * - Weather system integration (WeatherSystemManager)
 * 
 * @module WeatherOrchestrator
 */

import { AtmosphericParameters } from './AtmosphericParameters.js';
import { RandomWalkEngine } from './RandomWalkEngine.js';
import { WeatherStateResolver } from './WeatherStateResolver.js';

export class WeatherOrchestrator {
  /**
   * Creates a new weather orchestrator
   * @param {Object} config - Configuration from MODULE_DEFAULTS.weather.orchestrator
   * @param {WeatherSystemManager} weatherSystemManager - Weather system to control
   */
  constructor(config, weatherSystemManager) {
    this.config = config;
    this.enabled = config.enabled || false;
    this.weatherSystemManager = weatherSystemManager;
    
    // Initialize subsystems
    this.atmosphericParams = new AtmosphericParameters(config);
    this.randomWalkEngine = new RandomWalkEngine(config);
    
    // Current resolved state
    this.currentResolvedState = null;
    this.lastTransitionTime = 0;
    
    // Narrative override
    this.narrativeOverride = {
      enabled: config.narrativeOverride?.enabled || false,
      targetState: config.narrativeOverride?.targetState || null,
      forceStrength: config.narrativeOverride?.forceStrength || 0.3,
      onReached: config.narrativeOverride?.onReached || 'resume' // 'resume' or 'hold'
    };
    
    console.log('MapShine | WeatherOrchestrator initialized:', {
      enabled: this.enabled,
      temp: this.atmosphericParams.temperature,
      humidity: this.atmosphericParams.humidity
    });
  }
  
  /**
   * Initialize the orchestrator
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!this.enabled) {
      console.log('MapShine | WeatherOrchestrator is disabled');
      return;
    }
    
    // Mark weather system as orchestrator-controlled
    if (this.weatherSystemManager) {
      this.weatherSystemManager.orchestratorActive = true;
    }
    
    // Resolve initial state
    this._resolveAndApplyWeather();
    
    console.log('MapShine | WeatherOrchestrator initialized and active');
  }
  
  /**
   * Update the orchestrator (called each frame)
   * @param {number} deltaTime - Time since last frame in seconds
   */
  update(deltaTime) {
    if (!this.enabled) return;
    
    // Update random walk engine
    const parameterChanges = this.randomWalkEngine.update(deltaTime);
    
    // If a tick occurred, update atmospheric parameters
    if (parameterChanges) {
      // Update temperature
      this.atmosphericParams.updateTemperature(parameterChanges.temperature);
      
      // Update humidity
      this.atmosphericParams.updateHumidity(parameterChanges.humidity);
      
      // Resolve new weather state
      this._resolveAndApplyWeather();
    }
  }
  
  /**
   * Resolve atmospheric parameters to weather state and apply
   * @private
   */
  _resolveAndApplyWeather() {
    // Get current atmospheric state
    const temp = this.atmosphericParams.temperature;
    const humidity = this.atmosphericParams.humidity;
    const windStrength = this.atmosphericParams.windStrength;
    
    // Resolve to weather state
    const resolved = WeatherStateResolver.resolve(temp, humidity, windStrength);
    
    // Check if we should apply narrative override
    if (this.narrativeOverride.enabled && this.narrativeOverride.targetState) {
      this._applyNarrativeOverride(resolved);
    }
    
    // Check if transition is needed
    const currentState = this.weatherSystemManager?.currentState || 'clear';
    const currentIntensity = this.weatherSystemManager?._intensityOverride || 0.5;
    
    const shouldTransition = WeatherStateResolver.shouldTransition(
      currentState,
      resolved.state,
      currentIntensity,
      resolved.intensity
    );
    
    if (shouldTransition) {
      this._applyWeatherTransition(resolved);
    }
    
    // Store resolved state
    this.currentResolvedState = resolved;
  }
  
  /**
   * Apply narrative override to push weather toward target state
   * @param {Object} resolved - Resolved weather state
   * @private
   */
  _applyNarrativeOverride(resolved) {
    const targetState = this.narrativeOverride.targetState;
    const idealConditions = WeatherStateResolver.getIdealConditionsForState(targetState);
    
    // Calculate deltas to ideal conditions
    const tempDelta = idealConditions.temperature - this.atmosphericParams.temperature;
    const humidityDelta = idealConditions.humidity - this.atmosphericParams.humidity;
    
    // Apply gentle force through random walk engine
    this.randomWalkEngine.enableNarrativeOverride({
      targetTemp: Math.sign(tempDelta),
      targetHumidity: Math.sign(humidityDelta),
      forceStrength: this.narrativeOverride.forceStrength
    });
    
    // Check if we've reached the target
    const isClose = Math.abs(tempDelta) < 3 && Math.abs(humidityDelta) < 10;
    if (isClose && resolved.state === targetState) {
      console.log(`MapShine | Narrative target "${targetState}" reached`);
      
      if (this.narrativeOverride.onReached === 'resume') {
        this.disableNarrativeOverride();
      }
    }
  }
  
  /**
   * Apply weather transition to system manager
   * @param {Object} resolved - Resolved weather state
   * @private
   */
  _applyWeatherTransition(resolved) {
    if (!this.weatherSystemManager) {
      console.warn('MapShine | No WeatherSystemManager available for orchestrator');
      return;
    }
    
    // Get transition compatibility
    const currentState = this.weatherSystemManager.currentState;
    const compatibility = WeatherStateResolver.getTransitionCompatibility(
      currentState,
      resolved.state
    );
    
    // Apply transition with intensity override
    const duration = this.config.transitionDuration || compatibility.duration;
    
    console.log(`MapShine | Orchestrator transition: ${currentState} → ${resolved.state} (${resolved.description})`);
    console.log(`  Atmospheric: ${this.atmosphericParams.temperature.toFixed(1)}°C, ${this.atmosphericParams.humidity.toFixed(0)}% humidity`);
    console.log(`  Intensity: ${resolved.intensity.toFixed(2)}, Duration: ${duration}ms`);
    
    this.weatherSystemManager.transitionTo(resolved.state, {
      duration: duration,
      intensity: resolved.intensity
    });
    
    this.lastTransitionTime = Date.now();
  }
  
  /**
   * Enable the orchestrator
   */
  enable() {
    this.enabled = true;
    if (this.weatherSystemManager) {
      this.weatherSystemManager.orchestratorActive = true;
    }
    console.log('MapShine | WeatherOrchestrator enabled');
  }
  
  /**
   * Disable the orchestrator
   */
  disable() {
    this.enabled = false;
    if (this.weatherSystemManager) {
      this.weatherSystemManager.orchestratorActive = false;
    }
    this.randomWalkEngine.disableNarrativeOverride();
    console.log('MapShine | WeatherOrchestrator disabled');
  }
  
  /**
   * Enable narrative override to push toward a specific weather state
   * @param {Object} options - Override options
   * @param {string} options.targetState - Target weather state
   * @param {number} [options.forceStrength=0.3] - Force strength (0-1)
   * @param {string} [options.onReached='resume'] - Action when reached ('resume' or 'hold')
   */
  enableNarrativeOverride(options) {
    this.narrativeOverride.enabled = true;
    this.narrativeOverride.targetState = options.targetState;
    this.narrativeOverride.forceStrength = options.forceStrength ?? 0.3;
    this.narrativeOverride.onReached = options.onReached ?? 'resume';
    
    console.log(`MapShine | Narrative override enabled: pushing toward "${options.targetState}"`);
  }
  
  /**
   * Disable narrative override
   */
  disableNarrativeOverride() {
    this.narrativeOverride.enabled = false;
    this.randomWalkEngine.disableNarrativeOverride();
    console.log('MapShine | Narrative override disabled, resuming natural weather');
  }
  
  /**
   * Set atmospheric parameters directly (for manual control)
   * @param {Object} params - Parameter values
   * @param {number} [params.temperature] - Temperature in Celsius
   * @param {number} [params.humidity] - Humidity percentage
   */
  setAtmosphericParameters(params) {
    if (params.temperature !== undefined) {
      this.atmosphericParams.setTemperature(params.temperature);
    }
    if (params.humidity !== undefined) {
      this.atmosphericParams.setHumidity(params.humidity);
    }
    
    // Immediately resolve and apply
    this._resolveAndApplyWeather();
  }
  
  /**
   * Get current state for persistence
   * @returns {Object} State object
   */
  getState() {
    return {
      enabled: this.enabled,
      atmosphericParams: this.atmosphericParams.getState(),
      narrativeOverride: { ...this.narrativeOverride },
      lastTransitionTime: this.lastTransitionTime
    };
  }
  
  /**
   * Restore state from saved data
   * @param {Object} state - Saved state object
   */
  setState(state) {
    if (state.enabled !== undefined) this.enabled = state.enabled;
    if (state.atmosphericParams) {
      this.atmosphericParams.setState(state.atmosphericParams);
    }
    if (state.narrativeOverride) {
      this.narrativeOverride = { ...state.narrativeOverride };
    }
    if (state.lastTransitionTime) {
      this.lastTransitionTime = state.lastTransitionTime;
    }
    
    console.log('MapShine | WeatherOrchestrator state restored');
    
    // Re-resolve weather based on restored parameters
    this._resolveAndApplyWeather();
  }
  
  /**
   * Get diagnostics for UI display
   * @returns {Object} Diagnostic data
   */
  getDiagnostics() {
    const timeSinceTransition = Date.now() - this.lastTransitionTime;
    
    return {
      enabled: this.enabled,
      orchestratorActive: this.weatherSystemManager?.orchestratorActive || false,
      atmospheric: this.atmosphericParams.getDiagnostics(),
      randomWalk: this.randomWalkEngine.getDiagnostics(),
      currentState: {
        resolved: this.currentResolvedState?.state || 'N/A',
        intensity: this.currentResolvedState?.intensity?.toFixed(2) || 'N/A',
        description: this.currentResolvedState?.description || 'N/A',
        tempBand: this.currentResolvedState?.tempBand || 'N/A',
        humidityBand: this.currentResolvedState?.humidityBand || 'N/A'
      },
      narrative: {
        enabled: this.narrativeOverride.enabled,
        target: this.narrativeOverride.targetState || 'N/A',
        forceStrength: this.narrativeOverride.forceStrength
      },
      lastTransition: `${(timeSinceTransition / 1000).toFixed(0)}s ago`
    };
  }
  
  /**
   * Force an immediate tick (for testing)
   */
  forceTick() {
    const changes = this.randomWalkEngine.forceTick();
    this.atmosphericParams.updateTemperature(changes.temperature);
    this.atmosphericParams.updateHumidity(changes.humidity);
    this._resolveAndApplyWeather();
  }
  
  /**
   * Destroy the orchestrator
   */
  destroy() {
    this.enabled = false;
    if (this.weatherSystemManager) {
      this.weatherSystemManager.orchestratorActive = false;
    }
    console.log('MapShine | WeatherOrchestrator destroyed');
  }
}
