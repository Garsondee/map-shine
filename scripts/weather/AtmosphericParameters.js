/**
 * Atmospheric Parameters State Manager
 * 
 * Manages the current state of atmospheric parameters (temperature, humidity, windStrength)
 * and provides state persistence, validation, and momentum tracking.
 * 
 * Wind Strength is used instead of atmospheric pressure for better intuition:
 * - More relatable (everyone understands "windy" vs "calm")
 * - Directly observable (affects particles, precipitation angle, cloud movement)
 * - Better game integration (works with existing WindManager)
 * - More narrative-friendly (e.g., "The wind is picking up...")
 * 
 * @module AtmosphericParameters
 */

export class AtmosphericParameters {
  /**
   * Creates a new atmospheric parameters manager
   * @param {Object} config - Configuration from MODULE_DEFAULTS.weather.orchestrator
   */
  constructor(config) {
    this.config = config;
    
    // Current parameter values
    this.temperature = config.temperatureCurrent;
    this.humidity = config.humidityCurrent;
    this.windStrength = 0.5; // Wind strength (0-1), affects weather intensity
    
    // Momentum for smooth transitions (prevents rapid oscillation)
    this.tempMomentum = config.tempMomentum || 0;
    this.humidityMomentum = config.humidityMomentum || 0;
    
    // Parameter ranges
    this.ranges = {
      temperature: {
        min: config.temperatureMin,
        max: config.temperatureMax
      },
      humidity: {
        min: config.humidityMin,
        max: config.humidityMax
      },
      windStrength: {
        min: 0.0,  // Calm
        max: 1.0   // Storm force winds
      }
    };
    
    // History for trend analysis (optional future feature)
    this.history = {
      temperature: [],
      humidity: [],
      maxLength: 100
    };
    
    console.log('MapShine | AtmosphericParameters initialized:', {
      temp: this.temperature,
      humidity: this.humidity,
      windStrength: this.windStrength
    });
  }
  
  /**
   * Update temperature with momentum and clamping
   * @param {number} delta - Change in temperature
   * @returns {number} New temperature value
   */
  updateTemperature(delta) {
    // Apply momentum (reduces oscillation)
    const momentumFactor = this.config.momentum || 0.7;
    this.tempMomentum = this.tempMomentum * momentumFactor + delta * (1 - momentumFactor);
    
    // Update temperature
    this.temperature += this.tempMomentum;
    
    // Clamp to range
    this.temperature = Math.max(
      this.ranges.temperature.min,
      Math.min(this.ranges.temperature.max, this.temperature)
    );
    
    // Add to history
    this._addToHistory('temperature', this.temperature);
    
    return this.temperature;
  }
  
  /**
   * Update humidity with momentum and clamping
   * @param {number} delta - Change in humidity
   * @returns {number} New humidity value
   */
  updateHumidity(delta) {
    // Apply momentum
    const momentumFactor = this.config.momentum || 0.7;
    this.humidityMomentum = this.humidityMomentum * momentumFactor + delta * (1 - momentumFactor);
    
    // Update humidity
    this.humidity += this.humidityMomentum;
    
    // Clamp to range
    this.humidity = Math.max(
      this.ranges.humidity.min,
      Math.min(this.ranges.humidity.max, this.humidity)
    );
    
    // Add to history
    this._addToHistory('humidity', this.humidity);
    
    return this.humidity;
  }
  
  /**
   * Set temperature directly (for narrative overrides)
   * @param {number} value - New temperature value
   */
  setTemperature(value) {
    this.temperature = Math.max(
      this.ranges.temperature.min,
      Math.min(this.ranges.temperature.max, value)
    );
    this.tempMomentum = 0; // Reset momentum on direct set
    this._addToHistory('temperature', this.temperature);
  }
  
  /**
   * Set humidity directly (for narrative overrides)
   * @param {number} value - New humidity value
   */
  setHumidity(value) {
    this.humidity = Math.max(
      this.ranges.humidity.min,
      Math.min(this.ranges.humidity.max, value)
    );
    this.humidityMomentum = 0; // Reset momentum on direct set
    this._addToHistory('humidity', this.humidity);
  }
  
  /**
   * Update wind strength (affects weather intensity)
   * @param {number} delta - Change in wind strength
   * @returns {number} New wind strength value
   */
  updateWindStrength(delta) {
    this.windStrength += delta;
    this.windStrength = Math.max(
      this.ranges.windStrength.min,
      Math.min(this.ranges.windStrength.max, this.windStrength)
    );
    return this.windStrength;
  }
  
  /**
   * Get current state for persistence
   * @returns {Object} State object
   */
  getState() {
    return {
      temperature: this.temperature,
      humidity: this.humidity,
      windStrength: this.windStrength,
      tempMomentum: this.tempMomentum,
      humidityMomentum: this.humidityMomentum
    };
  }
  
  /**
   * Restore state from saved data
   * @param {Object} state - Saved state object
   */
  setState(state) {
    if (state.temperature !== undefined) this.temperature = state.temperature;
    if (state.humidity !== undefined) this.humidity = state.humidity;
    if (state.windStrength !== undefined) this.windStrength = state.windStrength;
    if (state.tempMomentum !== undefined) this.tempMomentum = state.tempMomentum;
    if (state.humidityMomentum !== undefined) this.humidityMomentum = state.humidityMomentum;
    
    console.log('MapShine | AtmosphericParameters state restored:', this.getState());
  }
  
  /**
   * Get diagnostics for UI display
   * @returns {Object} Diagnostic data
   */
  getDiagnostics() {
    return {
      temperature: {
        current: this.temperature.toFixed(1),
        momentum: this.tempMomentum.toFixed(3),
        range: `${this.ranges.temperature.min}-${this.ranges.temperature.max}`,
        percentile: this._getPercentile('temperature')
      },
      humidity: {
        current: this.humidity.toFixed(1),
        momentum: this.humidityMomentum.toFixed(3),
        range: `${this.ranges.humidity.min}-${this.ranges.humidity.max}`,
        percentile: this._getPercentile('humidity')
      },
      windStrength: {
        current: this.windStrength.toFixed(2),
        description: this._getWindDescription(),
        percentile: (this.windStrength * 100).toFixed(0) + '%'
      }
    };
  }
  
  /**
   * Get parameter as percentile within its range (0-1)
   * @param {string} param - Parameter name ('temperature' or 'humidity')
   * @returns {number} Percentile 0-1
   * @private
   */
  _getPercentile(param) {
    const value = this[param];
    const range = this.ranges[param];
    const percentile = (value - range.min) / (range.max - range.min);
    return Math.max(0, Math.min(1, percentile));
  }
  
  /**
   * Get wind strength description
   * @returns {string} Wind description
   * @private
   */
  _getWindDescription() {
    if (this.windStrength < 0.2) return 'Calm';
    if (this.windStrength < 0.4) return 'Light breeze';
    if (this.windStrength < 0.6) return 'Moderate';
    if (this.windStrength < 0.8) return 'Strong winds';
    return 'Storm force';
  }
  
  /**
   * Add value to parameter history
   * @param {string} param - Parameter name
   * @param {number} value - Value to add
   * @private
   */
  _addToHistory(param, value) {
    if (!this.history[param]) return;
    
    this.history[param].push({
      value: value,
      timestamp: Date.now()
    });
    
    // Trim history to max length
    if (this.history[param].length > this.history.maxLength) {
      this.history[param].shift();
    }
  }
  
  /**
   * Get trend over recent history
   * @param {string} param - Parameter name
   * @param {number} sampleCount - Number of recent samples to analyze
   * @returns {string} Trend direction ('rising', 'falling', 'stable')
   */
  getTrend(param, sampleCount = 10) {
    const history = this.history[param];
    if (!history || history.length < sampleCount) return 'stable';
    
    const recent = history.slice(-sampleCount);
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    const delta = last - first;
    
    if (Math.abs(delta) < 0.5) return 'stable';
    return delta > 0 ? 'rising' : 'falling';
  }
}
