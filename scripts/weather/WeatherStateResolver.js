/**
 * Weather State Resolver
 * 
 * Maps atmospheric parameters (temperature, humidity) to weather states.
 * Uses a decision matrix to determine appropriate weather conditions.
 * 
 * @module WeatherStateResolver
 */

export class WeatherStateResolver {
  /**
   * Weather state matrix based on temperature and humidity
   * Each entry: { state, intensity, description }
   * 
   * Temperature ranges:
   *   Cold: < 5°C
   *   Cool: 5-15°C
   *   Mild: 15-25°C
   *   Warm: > 25°C
   * 
   * Humidity ranges:
   *   Low: < 40%
   *   Medium: 40-70%
   *   High: > 70%
   */
  static STATE_MATRIX = {
    // COLD (<5°C)
    'cold_low': { state: 'snow', intensity: 0.3, description: 'Light snow flurries' },
    'cold_medium': { state: 'snow', intensity: 0.5, description: 'Steady snowfall' },
    'cold_high': { state: 'blizzard', intensity: 0.8, description: 'Heavy snow/blizzard' },
    
    // COOL (5-15°C)
    'cool_low': { state: 'clear', intensity: 0.2, description: 'Cool and clear' },
    'cool_medium': { state: 'sleet', intensity: 0.4, description: 'Light sleet' },
    'cool_high': { state: 'sleet', intensity: 0.7, description: 'Heavy sleet/freezing rain' },
    
    // MILD (15-25°C)
    'mild_low': { state: 'clear', intensity: 0.3, description: 'Clear skies' },
    'mild_medium': { state: 'drizzle', intensity: 0.4, description: 'Light drizzle' },
    'mild_high': { state: 'rain', intensity: 0.6, description: 'Steady rain' },
    
    // WARM (>25°C)
    'warm_low': { state: 'clear', intensity: 0.5, description: 'Hot and clear' },
    'warm_medium': { state: 'drizzle', intensity: 0.5, description: 'Warm drizzle' },
    'warm_high': { state: 'storm', intensity: 0.9, description: 'Thunderstorm' }
  };
  
  /**
   * Resolve atmospheric parameters to a weather state
   * @param {number} temperature - Temperature in Celsius
   * @param {number} humidity - Humidity percentage (0-100)
   * @param {number} [windStrength] - Optional wind strength (0-1)
   * @returns {Object} Weather state info { state, intensity, description, tempBand, humidityBand }
   */
  static resolve(temperature, humidity, windStrength = null) {
    // Classify temperature
    const tempBand = this._classifyTemperature(temperature);
    
    // Classify humidity
    const humidityBand = this._classifyHumidity(humidity);
    
    // Lookup in matrix
    const key = `${tempBand}_${humidityBand}`;
    const result = this.STATE_MATRIX[key];
    
    if (!result) {
      console.warn(`WeatherStateResolver | No state found for ${key}, defaulting to clear`);
      return {
        state: 'clear',
        intensity: 0.3,
        description: 'Clear skies (default)',
        tempBand,
        humidityBand
      };
    }
    
    // Apply wind strength modulation if available
    let intensity = result.intensity;
    if (windStrength !== null) {
      intensity = this._modulateIntensityByWindStrength(intensity, windStrength);
    }
    
    return {
      state: result.state,
      intensity: intensity,
      description: result.description,
      tempBand,
      humidityBand
    };
  }
  
  /**
   * Classify temperature into bands
   * @param {number} temp - Temperature in Celsius
   * @returns {string} Band name ('cold', 'cool', 'mild', 'warm')
   * @private
   */
  static _classifyTemperature(temp) {
    if (temp < 5) return 'cold';
    if (temp < 15) return 'cool';
    if (temp < 25) return 'mild';
    return 'warm';
  }
  
  /**
   * Classify humidity into bands
   * @param {number} humidity - Humidity percentage
   * @returns {string} Band name ('low', 'medium', 'high')
   * @private
   */
  static _classifyHumidity(humidity) {
    if (humidity < 40) return 'low';
    if (humidity < 70) return 'medium';
    return 'high';
  }
  
  /**
   * Modulate intensity based on wind strength
   * @param {number} baseIntensity - Base intensity (0-1)
   * @param {number} windStrength - Wind strength (0-1)
   * @returns {number} Modulated intensity
   * @private
   */
  static _modulateIntensityByWindStrength(baseIntensity, windStrength) {
    // Low wind (< 0.3) reduces intensity
    // High wind (> 0.7) increases intensity
    // Moderate wind (0.3-0.7) has minimal effect
    
    if (windStrength < 0.3) {
      const reduction = (0.3 - windStrength) * 0.5; // Up to -0.15 intensity
      return Math.max(0.1, baseIntensity - reduction);
    } else if (windStrength > 0.7) {
      const boost = (windStrength - 0.7) * 0.5; // Up to +0.15 intensity
      return Math.min(1.0, baseIntensity + boost);
    }
    
    return baseIntensity;
  }
  
  /**
   * Check if a state transition would be significant enough to trigger
   * @param {string} currentState - Current weather state
   * @param {string} newState - Proposed new state
   * @param {number} currentIntensity - Current intensity
   * @param {number} newIntensity - Proposed intensity
   * @returns {boolean} True if transition should occur
   */
  static shouldTransition(currentState, newState, currentIntensity, newIntensity) {
    // Always transition if state changes
    if (currentState !== newState) {
      return true;
    }
    
    // For same state, only transition if intensity change is significant (>15%)
    const intensityDelta = Math.abs(newIntensity - currentIntensity);
    return intensityDelta > 0.15;
  }
  
  /**
   * Get ideal atmospheric conditions for a target weather state
   * Useful for narrative override calculations
   * @param {string} targetState - Target weather state
   * @returns {Object} { temperature, humidity, description }
   */
  static getIdealConditionsForState(targetState) {
    const ideals = {
      'clear': { temperature: 20, humidity: 30, description: 'Mild and dry' },
      'drizzle': { temperature: 18, humidity: 60, description: 'Mild and humid' },
      'rain': { temperature: 18, humidity: 75, description: 'Mild and very humid' },
      'storm': { temperature: 28, humidity: 85, description: 'Hot and humid' },
      'sleet': { temperature: 10, humidity: 70, description: 'Cool and humid' },
      'snow': { temperature: 0, humidity: 60, description: 'Cold and humid' },
      'blizzard': { temperature: -5, humidity: 80, description: 'Very cold and humid' }
    };
    
    return ideals[targetState] || ideals['clear'];
  }
  
  /**
   * Get all possible weather states from the matrix
   * @returns {Array<string>} List of unique state names
   */
  static getAllStates() {
    const states = new Set();
    Object.values(this.STATE_MATRIX).forEach(entry => {
      states.add(entry.state);
    });
    return Array.from(states);
  }
  
  /**
   * Get transition compatibility between states
   * Some transitions are more natural than others
   * @param {string} fromState - Current state
   * @param {string} toState - Target state
   * @returns {Object} { compatible, duration, description }
   */
  static getTransitionCompatibility(fromState, toState) {
    // Direct transition (same state)
    if (fromState === toState) {
      return {
        compatible: true,
        duration: 5000,
        description: 'Intensity adjustment'
      };
    }
    
    // Natural progressions (shorter transitions)
    const naturalProgressions = [
      ['clear', 'drizzle'],
      ['drizzle', 'rain'],
      ['rain', 'storm'],
      ['clear', 'snow'],
      ['snow', 'blizzard'],
      ['rain', 'sleet'],
      ['sleet', 'snow']
    ];
    
    const isNatural = naturalProgressions.some(([from, to]) => 
      (fromState === from && toState === to) || (fromState === to && toState === from)
    );
    
    if (isNatural) {
      return {
        compatible: true,
        duration: 8000,
        description: 'Natural progression'
      };
    }
    
    // Precipitation type changes (medium transitions)
    const bothPrecip = ['rain', 'storm', 'drizzle'].includes(fromState) && 
                      ['rain', 'storm', 'drizzle'].includes(toState);
    const bothSnow = ['snow', 'blizzard'].includes(fromState) && 
                    ['snow', 'blizzard'].includes(toState);
    
    if (bothPrecip || bothSnow) {
      return {
        compatible: true,
        duration: 10000,
        description: 'Similar precipitation'
      };
    }
    
    // Major changes (longer transitions)
    return {
      compatible: true,
      duration: 15000,
      description: 'Major weather shift'
    };
  }
}
