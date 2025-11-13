export class WindManager {
  constructor(config = {}) {
    this.config = config;

    this.angle = 0; // Current wind angle in degrees
    this.speed = config.baseSpeed || 50;

    this._targetAngle = 0;
    this._angleChangeTimer = 0;
    this._timeToNextAngleChange = this._getRandom(
      this.config.angleChangeFrequencyMin,
      this.config.angleChangeFrequencyMax
    );

    this._isGusting = false;
    this._gustTimer = 0;
    this._timeToNextGust = this._getRandom(
      this.config.gustFrequencyMin,
      this.config.gustFrequencyMax
    );
    this._gustDuration = 0;

    // Smoothed wind for clouds - tracks long-term averaged direction
    this.smoothedAngle = 0; // Long-term averaged wind angle for clouds
    this.smoothedSpeed = config.baseSpeed || 50; // Long-term averaged speed for clouds
  }

  getNormalizedStrength() {
    if (!this.config || !this.config.gustSpeed || this.config.gustSpeed === 0) {
      return 0;
    }
    // Clamp between 0 and 1, in case speed overshoots gustSpeed briefly during lerp.
    return Math.max(0, Math.min(1, this.speed / this.config.gustSpeed));
  }

  destroy() {
    // No active listeners to remove, but this provides a consistent teardown point.
    // Future versions might add tickers or hooks that would be cleaned up here.
  }

  updateFromConfig(config) {
    // Validate critical fields if provided
    if (config.baseSpeed !== undefined && (config.baseSpeed < 0 || config.baseSpeed > 300)) {
      console.warn('WindManager | Invalid baseSpeed:', config.baseSpeed, '(must be 0-300)');
      return false;
    }
    if (config.gustSpeed !== undefined && (config.gustSpeed < 0 || config.gustSpeed > 500)) {
      console.warn('WindManager | Invalid gustSpeed:', config.gustSpeed, '(must be 0-500)');
      return false;
    }
    
    // Merge with existing config (supports partial updates)
    this.config = {
      ...this.config,  // Keep existing values
      ...config         // Override with new values
    };
    
    // Apply baseSpeed immediately if provided
    if (config.baseSpeed !== undefined) {
      this.speed = config.baseSpeed;
    }
    
    return true;
  }

  update(delta) {
    // --- Angle Update Logic ---
    this._angleChangeTimer += delta;
    if (this._angleChangeTimer >= this._timeToNextAngleChange) {
      const range = this.config.angleChangeRange || 20;
      this._targetAngle = this.angle + this._getRandom(-range, range);
      this._timeToNextAngleChange = this._getRandom(
        this.config.angleChangeFrequencyMin,
        this.config.angleChangeFrequencyMax
      );
      this._angleChangeTimer = 0;
    }
    // Lerp angle towards target
    this.angle += (this._targetAngle - this.angle) * 0.01;

    // --- Gust Update Logic ---
    this._gustTimer += delta;
    if (this._isGusting) {
      if (this._gustTimer >= this._gustDuration) {
        this._isGusting = false;
        this._gustTimer = 0;
        this._timeToNextGust = this._getRandom(
          this.config.gustFrequencyMin,
          this.config.gustFrequencyMax
        );
      }
    } else {
      if (this._gustTimer >= this._timeToNextGust) {
        this._isGusting = true;
        this._gustTimer = 0;
        this._gustDuration = this._getRandom(
          this.config.gustDurationMin,
          this.config.gustDurationMax
        );
      }
    }

    // Lerp speed towards base or gust speed
    const targetSpeed = this._isGusting
      ? this.config.gustSpeed
      : this.config.baseSpeed;
    this.speed += (targetSpeed - this.speed) * 0.1;

    // Update smoothed values for clouds (much slower lerp for stable drift)
    // Only use base speed for smoothed, ignore gusts entirely
    this.smoothedSpeed += (this.config.baseSpeed - this.smoothedSpeed) * 0.001;
    
    // CRITICAL FIX: Smoothed angle tracks the gradually-changing 'angle', NOT the jump-prone '_targetAngle'
    // This creates cascading smoothing: _targetAngle → angle (fast) → smoothedAngle (very slow)
    // Result: Clouds have massive inertia and take minutes to change direction
    this.smoothedAngle += (this.angle - this.smoothedAngle) * 0.0001;
  }

  _getRandom(min, max) {
    // Provide defaults to prevent NaN errors if config values are missing on initialization.
    const safeMin = min ?? 1;
    const safeMax = max ?? 5;
    if (safeMin > safeMax) return safeMin; // Handle inverted ranges gracefully
    return Math.random() * (safeMax - safeMin) + safeMin;
  }
}
