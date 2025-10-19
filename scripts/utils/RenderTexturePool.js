/**
 * @fileoverview Shared RenderTexture Pool for Map Shine Module
 * 
 * Manages a pool of PIXI.RenderTextures that can be borrowed and returned
 * for temporary rendering operations. Eliminates redundant texture allocation
 * across multiple systems by enabling temporal texture sharing.
 * 
 * USAGE:
 *   const temp = RenderTexturePool.acquire(960, 540);
 *   renderer.render(sprite, { renderTexture: temp });
 *   RenderTexturePool.release(temp);
 * 
 * CRITICAL RULES:
 *   1. ALWAYS release borrowed textures (use try-finally)
 *   2. NEVER store pooled textures as persistent properties
 *   3. NEVER destroy pooled textures manually
 *   4. Acquired textures are valid only until released
 * 
 * @author Garsondee
 * @version 1.0.0
 * @since Map Shine v2.0.0
 */

export class RenderTexturePool {
  /**
   * Pool storage organized by texture size
   * @type {Map<string, PIXI.RenderTexture[]>}
   * @private
   */
  static _pools = new Map();

  /**
   * Default texture creation options
   * @type {Object}
   * @private
   */
  static _defaultOptions = {
    scaleMode: PIXI.SCALE_MODES.LINEAR,
    type: PIXI.TYPES.UNSIGNED_BYTE,
  };

  /**
   * Pool statistics for monitoring and diagnostics
   * @type {Object}
   * @private
   */
  static _stats = {
    acquires: 0,
    releases: 0,
    hits: 0, // Reused existing texture
    misses: 0, // Created new texture
    active: new Set(), // Currently borrowed textures
    leakWarnings: 0,
  };

  /**
   * Pool configuration
   * @type {Object}
   * @private
   */
  static _config = {
    maxPoolSize: 4, // Max textures per size category
    enableLogging: false, // Detailed operation logging
    trackLeaks: true, // Warn if textures not returned
    clearOnRelease: false, // Clear textures when returned (debug only)
    warmupSizes: true, // Pre-create common sizes
  };

  /**
   * Initialize the texture pool system
   * Should be called once during module initialization
   */
  static initialize() {
    if (this._initialized) {
      console.warn("[RenderTexturePool] Already initialized");
      return;
    }

    this._initialized = true;

    // Pre-warm pool with commonly used sizes
    if (this._config.warmupSizes) {
      this._warmupPool();
    }

    // Register window resize handler
    window.addEventListener("resize", this._onResize.bind(this));

    console.log(
      "%c[RenderTexturePool] Initialized",
      "color: #4CAF50; font-weight: bold"
    );
  }

  /**
   * Pre-create textures for common sizes to avoid initial allocation lag
   * @private
   */
  static _warmupPool() {
    const screen = canvas?.app?.renderer?.screen;
    if (!screen) {
      console.warn("[RenderTexturePool] Cannot warmup - screen not available");
      return;
    }

    const commonSizes = [
      {
        width: Math.floor(screen.width / 2),
        height: Math.floor(screen.height / 2),
        count: 2,
      },
      { width: screen.width, height: screen.height, count: 1 },
    ];

    for (const { width, height, count } of commonSizes) {
      for (let i = 0; i < count; i++) {
        const temp = this.acquire(width, height);
        this.release(temp);
      }
    }

    console.log("[RenderTexturePool] Pool warmed with common sizes");
  }

  /**
   * Acquire a render texture from the pool
   * 
   * @param {number} width - Texture width in pixels
   * @param {number} height - Texture height in pixels
   * @param {Object} options - Optional PIXI texture options (type, scaleMode, etc.)
   * @returns {PIXI.RenderTexture} Texture ready for rendering
   * 
   * @example
   * const temp = RenderTexturePool.acquire(960, 540);
   * try {
   *   renderer.render(sprite, { renderTexture: temp });
   * } finally {
   *   RenderTexturePool.release(temp);
   * }
   */
  static acquire(width, height, options = {}) {
    const key = `${width}x${height}`;
    const pool = this._pools.get(key) || [];

    this._stats.acquires++;

    // Try to reuse existing texture from pool
    if (pool.length > 0) {
      const texture = pool.pop();
      this._stats.hits++;
      this._stats.active.add(texture);

      if (this._config.enableLogging) {
        console.log(
          `[RenderTexturePool] Acquired ${key} (reused, pool: ${pool.length})`
        );
      }

      return texture;
    }

    // Pool empty - create new texture
    this._stats.misses++;
    const mergedOptions = {
      width,
      height,
      ...this._defaultOptions,
      ...options,
    };
    const texture = PIXI.RenderTexture.create(mergedOptions);

    // CRITICAL: Set wrap mode to CLAMP to prevent edge artifacts
    // Kawase blur and other filters sample outside bounds
    texture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;

    this._stats.active.add(texture);

    if (this._config.enableLogging) {
      console.log(
        `[RenderTexturePool] Acquired ${key} (created new, pool: ${pool.length})`
      );
    }

    return texture;
  }

  /**
   * Return a texture to the pool for reuse
   * 
   * @param {PIXI.RenderTexture} texture - Texture to return
   * 
   * @example
   * RenderTexturePool.release(temp);
   */
  static release(texture) {
    if (!texture) {
      console.warn("[RenderTexturePool] Attempted to release null texture");
      return;
    }

    if (texture.destroyed) {
      console.warn(
        "[RenderTexturePool] Attempted to release destroyed texture"
      );
      return;
    }

    if (!this._stats.active.has(texture)) {
      console.warn(
        "[RenderTexturePool] Attempted to release texture not acquired from pool"
      );
      return;
    }

    this._stats.releases++;
    this._stats.active.delete(texture);

    const key = `${texture.width}x${texture.height}`;
    const pool = this._pools.get(key) || [];

    // Optional: Clear texture for debugging (helps catch reuse bugs)
    if (this._config.clearOnRelease && canvas?.app?.renderer) {
      const renderer = canvas.app.renderer;
      try {
        renderer.renderTexture.bind(texture);
        renderer.renderTexture.clear([0, 0, 0, 0]);
        renderer.renderTexture.bind(null);
      } catch (e) {
        console.warn("[RenderTexturePool] Failed to clear texture:", e);
      }
    }

    // Enforce max pool size - destroy excess textures
    if (pool.length < this._config.maxPoolSize) {
      pool.push(texture);
      this._pools.set(key, pool);

      if (this._config.enableLogging) {
        console.log(
          `[RenderTexturePool] Released ${key} (pool: ${pool.length})`
        );
      }
    } else {
      // Pool full - destroy excess texture
      texture.destroy(true);

      if (this._config.enableLogging) {
        console.log(
          `[RenderTexturePool] Released ${key} (pool full, destroyed)`
        );
      }
    }
  }

  /**
   * Acquire multiple textures at once (convenience method)
   * 
   * @param {number} count - Number of textures to acquire
   * @param {number} width - Texture width
   * @param {number} height - Texture height
   * @param {Object} options - Texture options
   * @returns {PIXI.RenderTexture[]} Array of textures
   * 
   * @example
   * const [temp1, temp2] = RenderTexturePool.acquireBatch(2, 960, 540);
   */
  static acquireBatch(count, width, height, options = {}) {
    const textures = [];
    for (let i = 0; i < count; i++) {
      textures.push(this.acquire(width, height, options));
    }
    return textures;
  }

  /**
   * Release multiple textures at once (convenience method)
   * 
   * @param {PIXI.RenderTexture[]} textures - Array of textures to release
   * 
   * @example
   * RenderTexturePool.releaseBatch([temp1, temp2]);
   */
  static releaseBatch(textures) {
    for (const texture of textures) {
      this.release(texture);
    }
  }

  /**
   * Destroy all pooled textures and reset the pool
   * Call during scene teardown or module disable
   */
  static destroy() {
    // Destroy all textures in pools
    for (const pool of this._pools.values()) {
      for (const texture of pool) {
        texture.destroy(true);
      }
    }

    // Destroy any active (unreturned) textures
    for (const texture of this._stats.active) {
      console.warn(
        "[RenderTexturePool] Destroying unreturned texture:",
        `${texture.width}x${texture.height}`
      );
      texture.destroy(true);
    }

    this._pools.clear();
    this._stats.active.clear();

    console.log("[RenderTexturePool] Destroyed all pooled textures");
  }

  /**
   * Get current pool statistics
   * 
   * @returns {Object} Statistics object
   */
  static getStats() {
    const poolSizes = {};
    for (const [key, pool] of this._pools.entries()) {
      poolSizes[key] = pool.length;
    }

    const hitRate = this._stats.hits / Math.max(1, this._stats.acquires);

    return {
      acquires: this._stats.acquires,
      releases: this._stats.releases,
      hits: this._stats.hits,
      misses: this._stats.misses,
      hitRate: hitRate,
      hitRatePercent: (hitRate * 100).toFixed(1) + "%",
      activeCount: this._stats.active.size,
      poolSizes,
      estimatedVRAM: this._calculateVRAM(),
      leakWarnings: this._stats.leakWarnings,
    };
  }

  /**
   * Calculate total VRAM usage of pool and active textures
   * 
   * @returns {string} VRAM usage in MB
   * @private
   */
  static _calculateVRAM() {
    let totalBytes = 0;

    // Count pooled textures
    for (const [key, pool] of this._pools.entries()) {
      const [width, height] = key.split("x").map(Number);
      const bytesPerTexture = width * height * 4; // RGBA8
      totalBytes += bytesPerTexture * pool.length;
    }

    // Count active textures
    for (const texture of this._stats.active) {
      totalBytes += texture.width * texture.height * 4;
    }

    return (totalBytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  /**
   * Check for leaked textures (acquired but not released)
   * Logs warnings if textures are held too long
   */
  static checkLeaks() {
    if (this._stats.active.size > 0 && this._config.trackLeaks) {
      this._stats.leakWarnings++;

      const leakedSizes = Array.from(this._stats.active).map(
        (t) => `${t.width}x${t.height}`
      );

      console.warn(
        `[RenderTexturePool] Memory leak detected: ${this._stats.active.size} textures not returned`,
        leakedSizes
      );
    }
  }

  /**
   * Print detailed diagnostic report to console
   */
  static printReport() {
    const stats = this.getStats();

    console.group(
      "%c[RenderTexturePool] Performance Report",
      "color: #4CAF50; font-weight: bold"
    );
    console.log("Total Acquires:", stats.acquires);
    console.log("Total Releases:", stats.releases);
    console.log("Cache Hits:", stats.hits, `(${stats.hitRatePercent})`);
    console.log("Cache Misses:", stats.misses);
    console.log("Currently Active:", stats.activeCount);
    console.log("Pool Sizes:", stats.poolSizes);
    console.log("Estimated VRAM:", stats.estimatedVRAM);
    console.log("Leak Warnings:", stats.leakWarnings);

    // Efficiency analysis
    if (stats.hitRate < 0.5) {
      console.warn("⚠️ Low cache hit rate - consider increasing pool size");
    } else if (stats.hitRate > 0.9) {
      console.log("✅ Excellent cache hit rate");
    }

    if (stats.activeCount > 5) {
      console.warn("⚠️ High number of active textures - possible leak");
    }

    console.groupEnd();
  }

  /**
   * Reset all statistics (for benchmarking)
   */
  static resetStats() {
    this._stats.acquires = 0;
    this._stats.releases = 0;
    this._stats.hits = 0;
    this._stats.misses = 0;
    this._stats.leakWarnings = 0;
    // Don't reset active set - those are real outstanding borrows
  }

  /**
   * Handle window resize - destroy all pooled textures
   * They'll be recreated at the new screen size on next acquire
   * 
   * @private
   */
  static _onResize() {
    console.log("[RenderTexturePool] Resize detected, clearing pool");

    // Destroy pooled textures (but not active ones - systems still using them)
    for (const pool of this._pools.values()) {
      for (const texture of pool) {
        texture.destroy(true);
      }
    }

    this._pools.clear();

    // Re-warm pool at new size
    if (this._config.warmupSizes) {
      this._warmupPool();
    }
  }

  /**
   * Update pool configuration
   * 
   * @param {Object} config - Configuration overrides
   */
  static configure(config) {
    Object.assign(this._config, config);
    console.log("[RenderTexturePool] Configuration updated:", config);
  }

  /**
   * Get current configuration
   * 
   * @returns {Object} Current configuration
   */
  static getConfig() {
    return { ...this._config };
  }
}

// Make available globally for console debugging
if (typeof window !== "undefined") {
  window.RenderTexturePool = RenderTexturePool;
}
