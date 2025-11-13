// =================================================================================
// SECTION 4: RESOURCE & TEXTURE MANAGEMENT
// =================================================================================
// Description: Classes for managing shared rendering resources, texture loading,
//              and texture manipulation. Includes ResourceManager, TextureAutoLoader,
//              NoiseTextureManager, and CompositeMaskGenerator.
// ---------------------------------------------------------------------------------
// =================================================================================
// SECTION 5: MASKING SYSTEMS
// =================================================================================
// Description: Unified masking infrastructure including light masks, geometry masks,
//              dynamic token masks, and specialized mask filters. These systems provide
//              occlusion, clipping, and selective rendering capabilities.
// ---------------------------------------------------------------------------------
// NOTE: SceneChangeManager has been moved to scripts/managers/SceneChangeManager.js
// All new functionality should consider whether it needs registration in SceneChangeManager
// for proper setup and teardown during scene transitions.
/**
 * Unified Transition Manager
 *
 * Handles smooth transitions for both time of day and weather state changes.
 * Supports overlapping transitions with proper blending when a new transition
 * starts before the previous one completes.
 *
 * Features:
 * - Time of day transitions (15s to 30min)
 * - Weather state transitions (15s to 30min)
 * - Simultaneous time + weather transitions
 * - Interruption handling (new transition blends from current interpolated state)
 * - Easing functions for natural motion
 *
 * @class UnifiedTransitionManager
 */

export class UnifiedTransitionManager {
  constructor() {
    /** @type {Array<Object>} Active transitions */
    this.activeTransitions = [];

    /** @type {number|null} Animation frame ID */
    this._animationFrameId = null;

    /** @type {Object} Current blended state */
    this.currentState = {
      time: null,
      weather: null
    };

    console.log('MapShine | UnifiedTransitionManager initialized');
  }

  /**
   * Start a time of day transition
   * @param {number} targetTime - Target time (0-24)
   * @param {number} durationMs - Transition duration in milliseconds (15000 to 1800000)
   * @returns {string} Transition ID
   */
  transitionTime(targetTime, durationMs = 3000) {
    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config) {
      console.warn('MapShine | UnifiedTransitionManager: No active config available');
      return null;
    }

    // Get current time (from ongoing transition or config)
    const currentTime = this.currentState.time ?? config.timeOfDay.currentTime ?? 12.0;

    // Handle time wraparound (shortest path)
    let adjustedTarget = targetTime;
    const diff = targetTime - currentTime;
    if (diff > 12) {
      adjustedTarget = targetTime - 24;
    } else if (diff < -12) {
      adjustedTarget = targetTime + 24;
    }

    const transitionId = `time-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transition = {
      id: transitionId,
      type: 'time',
      startValue: currentTime,
      targetValue: adjustedTarget,
      originalTarget: targetTime, // Store original for wraparound
      startTime: performance.now(),
      duration: durationMs,
      progress: 0,
      active: true
    };

    // Cancel any existing time transitions (replace, don't blend)
    this.activeTransitions = this.activeTransitions.filter(t => t.type !== 'time');

    this.activeTransitions.push(transition);
    this._ensureAnimationLoop();

    console.log(`MapShine | Time transition started: ${currentTime.toFixed(2)} → ${targetTime.toFixed(2)} over ${(durationMs / 1000).toFixed(1)}s`);

    // Emit hook
    Hooks.callAll('mapShine:timeTransitionStart', {
      id: transitionId,
      from: currentTime,
      to: targetTime,
      duration: durationMs
    });

    return transitionId;
  }

  /**
   * Start a weather transition
   * @param {string} targetState - Target weather state
   * @param {number} durationMs - Transition duration in milliseconds
   * @returns {string} Transition ID
   */
  transitionWeather(targetState, durationMs = 10000) {
    const weatherManager = game.mapShine?.weatherSystemManager;
    if (!weatherManager) {
      console.warn('MapShine | UnifiedTransitionManager: WeatherSystemManager not available');
      return null;
    }

    // Get current state (from ongoing transition or manager)
    const currentState = this.currentState.weather ?? weatherManager.currentState ?? 'clear';

    const transitionId = `weather-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transition = {
      id: transitionId,
      type: 'weather',
      startValue: currentState,
      targetValue: targetState,
      startTime: performance.now(),
      duration: durationMs,
      progress: 0,
      active: true
    };

    // Cancel any existing weather transitions (replace, don't blend)
    this.activeTransitions = this.activeTransitions.filter(t => t.type !== 'weather');

    this.activeTransitions.push(transition);
    this._ensureAnimationLoop();

    console.log(`MapShine | Weather transition started: ${currentState} → ${targetState} over ${(durationMs / 1000).toFixed(1)}s`);

    // Start the weather system transition
    weatherManager.transitionToState(targetState, durationMs);

    // Emit hook
    Hooks.callAll('mapShine:weatherTransitionStart', {
      id: transitionId,
      from: currentState,
      to: targetState,
      duration: durationMs
    });

    return transitionId;
  }

  /**
   * Start simultaneous time and weather transition
   * @param {number} targetTime - Target time
   * @param {string} targetWeather - Target weather state
   * @param {number} durationMs - Transition duration
   * @returns {Object} Object with timeId and weatherId
   */
  transitionBoth(targetTime, targetWeather, durationMs = 10000) {
    const timeId = this.transitionTime(targetTime, durationMs);
    const weatherId = this.transitionWeather(targetWeather, durationMs);

    console.log(`MapShine | Simultaneous transition: Time → ${targetTime.toFixed(2)}, Weather → ${targetWeather}`);

    return { timeId, weatherId };
  }

  /**
   * Cancel a specific transition
   * @param {string} transitionId - ID of transition to cancel
   */
  cancelTransition(transitionId) {
    const index = this.activeTransitions.findIndex(t => t.id === transitionId);
    if (index !== -1) {
      const transition = this.activeTransitions[index];
      this.activeTransitions.splice(index, 1);

      console.log(`MapShine | Transition cancelled: ${transitionId}`);

      // Emit cancellation hook
      Hooks.callAll('mapShine:transitionCancelled', { id: transitionId, type: transition.type });
    }
  }

  /**
   * Cancel all active transitions
   */
  cancelAll() {
    const count = this.activeTransitions.length;
    this.activeTransitions = [];

    if (count > 0) {
      console.log(`MapShine | All transitions cancelled (${count} active)`);
      Hooks.callAll('mapShine:allTransitionsCancelled', { count });
    }
  }

  /**
   * Cubic ease-in-out easing function
   * @param {number} t - Progress (0-1)
   * @returns {number} Eased progress (0-1)
   */
  _easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Main animation loop - updates all active transitions
   * @private
   */
  _animate() {
    if (this.activeTransitions.length === 0) {
      this._stopAnimationLoop();
      return;
    }

    const now = performance.now();
    const completedTransitions = [];

    // Update each transition
    for (const transition of this.activeTransitions) {
      if (!transition.active) continue;

      const elapsed = now - transition.startTime;
      const rawProgress = Math.min(1, elapsed / transition.duration);
      transition.progress = this._easeInOutCubic(rawProgress);

      // Apply transition based on type
      if (transition.type === 'time') {
        this._applyTimeTransition(transition);
      } else if (transition.type === 'weather') {
        this._applyWeatherTransition(transition);
      }

      // Check if complete
      if (rawProgress >= 1) {
        transition.active = false;
        completedTransitions.push(transition);
      }
    }

    // Handle completed transitions
    for (const transition of completedTransitions) {
      this._onTransitionComplete(transition);
      this.activeTransitions = this.activeTransitions.filter(t => t.id !== transition.id);
    }

    // Continue animation loop
    this._animationFrameId = requestAnimationFrame(() => this._animate());
  }

  /**
   * Apply time transition (interpolate time value)
   * @private
   */
  _applyTimeTransition(transition) {
    const interpolatedTime = transition.startValue +
      (transition.targetValue - transition.startValue) * transition.progress;

    // Handle wraparound
    let finalTime = interpolatedTime;
    if (finalTime < 0) finalTime += 24;
    if (finalTime >= 24) finalTime -= 24;

    this.currentState.time = finalTime;

    // Update config directly without triggering full system regeneration
    // This allows smooth interpolation during the transition
    if (game.mapShine?.profileManager?.activeConfig) {
      game.mapShine.profileManager.activeConfig.timeOfDay.currentTime = finalTime;

      // Lightweight update: just refresh time-dependent values without regeneration
      if (game.mapShine.profileManager.updateTimeBasedSystems) {
        game.mapShine.profileManager.updateTimeBasedSystems();
      }
    }
  }

  /**
   * Apply weather transition (managed by WeatherSystemManager)
   * @private
   */
  _applyWeatherTransition(transition) {
    // Weather transitions are handled by WeatherSystemManager
    // We just track state here
    this.currentState.weather = transition.targetValue;
  }

  /**
   * Handle transition completion
   * @private
   */
  _onTransitionComplete(transition) {
    console.log(`MapShine | Transition complete: ${transition.type} - ${transition.id}`);

    if (transition.type === 'time') {
      // Ensure final time is set correctly (handle wraparound)
      const finalTime = transition.originalTarget;
      this.currentState.time = finalTime;

      if (game.mapShine?.updateTimeOfDay) {
        game.mapShine.updateTimeOfDay(finalTime);
      }

      // Emit completion hook
      Hooks.callAll('mapShine:timeTransitionComplete', {
        id: transition.id,
        time: finalTime
      });
    } else if (transition.type === 'weather') {
      // Emit completion hook
      Hooks.callAll('mapShine:weatherTransitionComplete', {
        id: transition.id,
        state: transition.targetValue
      });
    }
  }

  /**
   * Ensure animation loop is running
   * @private
   */
  _ensureAnimationLoop() {
    if (this._animationFrameId === null) {
      this._animationFrameId = requestAnimationFrame(() => this._animate());
    }
  }

  /**
   * Stop animation loop
   * @private
   */
  _stopAnimationLoop() {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * Get diagnostics for UI display
   * @returns {Object} Diagnostic information
   */
  getDiagnostics() {
    return {
      activeTransitions: this.activeTransitions.length,
      transitions: this.activeTransitions.map(t => ({
        id: t.id,
        type: t.type,
        progress: `${(t.progress * 100).toFixed(1)}%`,
        remaining: `${((t.duration - (performance.now() - t.startTime)) / 1000).toFixed(1)}s`
      })),
      currentState: { ...this.currentState }
    };
  }

  /**
   * Destroy the manager
   */
  destroy() {
    this.cancelAll();
    this._stopAnimationLoop();
    console.log('MapShine | UnifiedTransitionManager destroyed');
  }
}
