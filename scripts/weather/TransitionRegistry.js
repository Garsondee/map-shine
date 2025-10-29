/**
 * Transition Registry - Weather State Transition Management
 * 
 * Manages transition rules, paths, and execution between weather states.
 * Provides natural progression detection and optimal transition routing.
 * 
 * @module TransitionRegistry
 */

export class TransitionRegistry {
  constructor() {
    // Transition rules between states
    this.transitionRules = new Map();
    
    // Active transitions being tracked
    this.activeTransitions = new Map();
    
    // Natural progression definitions
    this.naturalProgressions = new Set();
    
    // Transition path cache for optimization
    this.pathCache = new Map();
    
    console.log('MapShine | TransitionRegistry initialized');
  }
  
  /**
   * Register a transition rule between two states
   * @param {string} fromState - Source weather state
   * @param {string} toState - Target weather state
   * @param {Object} config - Transition configuration
   * @param {number} config.duration - Transition duration in milliseconds
   * @param {string} config.easing - Easing function name
   * @param {string} config.type - Transition type ('natural', 'similar', 'major')
   * @param {boolean} config.bidirectional - Whether rule applies both ways
   */
  registerTransition(fromState, toState, config) {
    const key = `${fromState}->${toState}`;
    
    this.transitionRules.set(key, {
      from: fromState,
      to: toState,
      duration: config.duration || 10000,
      easing: config.easing || 'easeInOut',
      type: config.type || 'default',
      priority: config.priority || 1,
      conditions: config.conditions || [],
      bidirectional: config.bidirectional || false
    });
    
    // Add bidirectional rule if specified
    if (config.bidirectional && fromState !== toState) {
      const reverseKey = `${toState}->${fromState}`;
      this.transitionRules.set(reverseKey, {
        from: toState,
        to: fromState,
        duration: config.duration || 10000,
        easing: config.easing || 'easeInOut',
        type: config.type || 'default',
        priority: config.priority || 1,
        conditions: config.conditions || [],
        bidirectional: false // Prevent infinite loops
      });
    }
    
    // Clear path cache when rules change
    this.pathCache.clear();
    
    console.log(`TransitionRegistry | Registered transition: ${key} (${config.type}, ${config.duration}ms)`);
  }
  
  /**
   * Register a natural progression between states
   * @param {string} fromState - Source state
   * @param {string} toState - Target state
   * @param {Object} config - Progression configuration
   */
  registerNaturalProgression(fromState, toState, config = {}) {
    this.registerTransition(fromState, toState, {
      duration: config.duration || 8000,
      easing: config.easing || 'easeInOut',
      type: 'natural',
      priority: 1,
      bidirectional: true
    });
    
    this.naturalProgressions.add(`${fromState}->${toState}`);
    this.naturalProgressions.add(`${toState}->${fromState}`);
  }
  
  /**
   * Get transition configuration between two states
   * @param {string} fromState - Source state
   * @param {string} toState - Target state
   * @returns {Object|null} Transition configuration
   */
  getTransition(fromState, toState) {
    return this.transitionRules.get(`${fromState}->${toState}`) || null;
  }
  
  /**
   * Check if a transition exists between two states
   * @param {string} fromState - Source state
   * @param {string} toState - Target state
   * @returns {boolean} Whether transition exists
   */
  hasTransition(fromState, toState) {
    return this.transitionRules.has(`${fromState}->${toState}`);
  }
  
  /**
   * Get the optimal transition path between states
   * Uses natural progressions when possible for realistic weather changes
   * @param {string} fromState - Starting state
   * @param {string} toState - Target state
   * @param {Object} options - Path options
   * @param {boolean} options.allowIndirect - Allow intermediate states
   * @param {number} options.maxSteps - Maximum number of steps in path
   * @returns {Array} Array of state names forming the path
   */
  getTransitionPath(fromState, toState, options = {}) {
    // Check cache first
    const cacheKey = `${fromState}->${toState}_${JSON.stringify(options)}`;
    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey);
    }
    
    // Direct transition exists
    if (this.hasTransition(fromState, toState)) {
      const path = [fromState, toState];
      this.pathCache.set(cacheKey, path);
      return path;
    }
    
    // If indirect transitions not allowed, return empty path
    if (!options.allowIndirect) {
      return [];
    }
    
    // Find optimal path through intermediate states
    const path = this._findOptimalPath(fromState, toState, options);
    
    // Cache the result
    if (path.length > 0) {
      this.pathCache.set(cacheKey, path);
    }
    
    return path;
  }
  
  /**
   * Start tracking an active transition
   * @param {string} transitionId - Unique transition identifier
   * @param {Object} transitionData - Transition information
   */
  startTransition(transitionId, transitionData) {
    this.activeTransitions.set(transitionId, {
      ...transitionData,
      startTime: Date.now(),
      status: 'active'
    });
    
    console.log(`TransitionRegistry | Started transition: ${transitionId}`);
  }
  
  /**
   * Complete an active transition
   * @param {string} transitionId - Transition identifier
   */
  completeTransition(transitionId) {
    const transition = this.activeTransitions.get(transitionId);
    if (transition) {
      transition.status = 'completed';
      transition.endTime = Date.now();
      transition.duration = transition.endTime - transition.startTime;
      
      console.log(`TransitionRegistry | Completed transition: ${transitionId} (${transition.duration}ms)`);
      
      // Clean up old completed transitions (keep last 10)
      this._cleanupOldTransitions();
    }
  }
  
  /**
   * Cancel an active transition
   * @param {string} transitionId - Transition identifier
   */
  cancelTransition(transitionId) {
    const transition = this.activeTransitions.get(transitionId);
    if (transition) {
      transition.status = 'cancelled';
      transition.endTime = Date.now();
      transition.duration = transition.endTime - transition.startTime;
      
      console.log(`TransitionRegistry | Cancelled transition: ${transitionId}`);
    }
  }
  
  /**
   * Get active transition information
   * @param {string} transitionId - Transition identifier
   * @returns {Object|null} Transition data
   */
  getActiveTransition(transitionId) {
    const transition = this.activeTransitions.get(transitionId);
    if (transition && transition.status === 'active') {
      return {
        ...transition,
        progress: Math.min((Date.now() - transition.startTime) / transition.duration, 1.0),
        remaining: Math.max(0, transition.duration - (Date.now() - transition.startTime))
      };
    }
    return null;
  }
  
  /**
   * Get all active transitions
   * @returns {Array} Array of active transition data
   */
  getAllActiveTransitions() {
    const active = [];
    for (const [id, transition] of this.activeTransitions.entries()) {
      if (transition.status === 'active') {
        active.push({
          id,
          ...transition,
          progress: Math.min((Date.now() - transition.startTime) / transition.duration, 1.0),
          remaining: Math.max(0, transition.duration - (Date.now() - transition.startTime))
        });
      }
    }
    return active;
  }
  
  /**
   * Check if two states have a natural progression relationship
   * @param {string} fromState - Source state
   * @param {string} toState - Target state
   * @returns {boolean} Whether progression is natural
   */
  isNaturalProgression(fromState, toState) {
    return this.naturalProgressions.has(`${fromState}->${toState}`);
  }
  
  /**
   * Get transition statistics
   * @returns {Object} Transition statistics
   */
  getStatistics() {
    const totalTransitions = this.activeTransitions.size;
    const activeTransitions = Array.from(this.activeTransitions.values())
      .filter(t => t.status === 'active').length;
    const completedTransitions = Array.from(this.activeTransitions.values())
      .filter(t => t.status === 'completed').length;
    const cancelledTransitions = Array.from(this.activeTransitions.values())
      .filter(t => t.status === 'cancelled').length;
    
    const averageDuration = completedTransitions > 0 
      ? Array.from(this.activeTransitions.values())
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + t.duration, 0) / completedTransitions
      : 0;
    
    return {
      totalRules: this.transitionRules.size,
      naturalProgressions: this.naturalProgressions.size,
      cachedPaths: this.pathCache.size,
      totalTransitions,
      activeTransitions,
      completedTransitions,
      cancelledTransitions,
      averageDuration: Math.round(averageDuration)
    };
  }
  
  /**
   * Initialize default weather transition rules
   * This sets up realistic weather change patterns
   */
  initializeDefaultRules() {
    console.log('TransitionRegistry | Initializing default weather transition rules...');
    
    // Natural progressions (short, realistic transitions)
    this.registerNaturalProgression('clear', 'partly-cloudy', { duration: 3000 });
    this.registerNaturalProgression('partly-cloudy', 'drizzle', { duration: 4000 });
    this.registerNaturalProgression('drizzle', 'rain', { duration: 6000 });
    this.registerNaturalProgression('rain', 'storm', { duration: 8000 });
    this.registerNaturalProgression('clear', 'snow', { duration: 5000 });
    this.registerNaturalProgression('snow', 'blizzard', { duration: 7000 });
    this.registerNaturalProgression('rain', 'sleet', { duration: 5000 });
    this.registerNaturalProgression('sleet', 'snow', { duration: 6000 });
    
    // Similar precipitation type transitions (medium duration)
    const rainStates = ['drizzle', 'rain', 'storm'];
    const snowStates = ['snow', 'blizzard'];
    
    // Rain-to-rain transitions
    for (let i = 0; i < rainStates.length; i++) {
      for (let j = 0; j < rainStates.length; j++) {
        if (i !== j && !this.hasTransition(rainStates[i], rainStates[j])) {
          this.registerTransition(rainStates[i], rainStates[j], {
            duration: 10000,
            type: 'similar'
          });
        }
      }
    }
    
    // Snow-to-snow transitions
    for (let i = 0; i < snowStates.length; i++) {
      for (let j = 0; j < snowStates.length; j++) {
        if (i !== j && !this.hasTransition(snowStates[i], snowStates[j])) {
          this.registerTransition(snowStates[i], snowStates[j], {
            duration: 10000,
            type: 'similar'
          });
        }
      }
    }
    
    // Major weather shifts (longer transitions)
    const allStates = ['clear', 'partly-cloudy', 'drizzle', 'rain', 'storm', 'sleet', 'snow', 'blizzard'];
    
    for (const from of allStates) {
      for (const to of allStates) {
        if (from !== to && !this.hasTransition(from, to)) {
          this.registerTransition(from, to, {
            duration: 15000,
            type: 'major'
          });
        }
      }
    }
    
    console.log(`TransitionRegistry | Initialized ${this.transitionRules.size} transition rules`);
  }
  
  /**
   * Clear all transition rules
   */
  clearRules() {
    this.transitionRules.clear();
    this.naturalProgressions.clear();
    this.pathCache.clear();
    console.log('TransitionRegistry | Cleared all transition rules');
  }
  
  /**
   * Export transition rules for backup/sharing
   * @returns {Object} Exportable transition rules
   */
  exportRules() {
    const rules = {};
    for (const [key, rule] of this.transitionRules.entries()) {
      rules[key] = {
        duration: rule.duration,
        easing: rule.easing,
        type: rule.type,
        priority: rule.priority
      };
    }
    return {
      rules,
      naturalProgressions: Array.from(this.naturalProgressions),
      timestamp: Date.now()
    };
  }
  
  /**
   * Import transition rules from exported data
   * @param {Object} data - Exported transition rules
   */
  importRules(data) {
    if (!data.rules) {
      console.warn('TransitionRegistry | No rules found in import data');
      return;
    }
    
    this.clearRules();
    
    for (const [key, config] of Object.entries(data.rules)) {
      const [from, to] = key.split('->');
      this.registerTransition(from, to, config);
    }
    
    // Restore natural progressions
    if (data.naturalProgressions) {
      for (const progression of data.naturalProgressions) {
        this.naturalProgressions.add(progression);
      }
    }
    
    console.log(`TransitionRegistry | Imported ${Object.keys(data.rules).length} transition rules`);
  }
  
  /**
   * Destroy the registry
   */
  destroy() {
    this.transitionRules.clear();
    this.activeTransitions.clear();
    this.naturalProgressions.clear();
    this.pathCache.clear();
    console.log('TransitionRegistry destroyed');
  }
  
  // === Private Methods ===
  
  /**
   * Find optimal path between states using breadth-first search
   * @param {string} fromState - Starting state
   * @param {string} toState - Target state
   * @param {Object} options - Search options
   * @returns {Array} Optimal path as array of state names
   * @private
   */
  _findOptimalPath(fromState, toState, options) {
    const maxSteps = options.maxSteps || 3;
    const queue = [[fromState]];
    const visited = new Set([fromState]);
    
    while (queue.length > 0) {
      const path = queue.shift();
      const currentState = path[path.length - 1];
      
      // Found target
      if (currentState === toState) {
        return path;
      }
      
      // Exceeded max steps
      if (path.length >= maxSteps) {
        continue;
      }
      
      // Explore neighbors
      const neighbors = this._getNeighborStates(currentState);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    
    return []; // No path found
  }
  
  /**
   * Get all states that can be transitioned to from a given state
   * @param {string} state - Source state
   * @returns {Array} Array of neighbor state names
   * @private
   */
  _getNeighborStates(state) {
    const neighbors = [];
    for (const [key, rule] of this.transitionRules.entries()) {
      if (rule.from === state) {
        neighbors.push(rule.to);
      }
    }
    return neighbors;
  }
  
  /**
   * Clean up old completed transitions
   * @private
   */
  _cleanupOldTransitions() {
    const completed = Array.from(this.activeTransitions.entries())
      .filter(([id, transition]) => transition.status !== 'active');
    
    // Keep only the most recent 10 completed transitions
    completed.sort((a, b) => b[1].endTime - a[1].endTime);
    
    // Remove older ones
    for (let i = 10; i < completed.length; i++) {
      this.activeTransitions.delete(completed[i][0]);
    }
  }
}
