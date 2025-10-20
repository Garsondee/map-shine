/**
 * @fileoverview AnimatedCanvasLayer - Base class for canvas layers with animation loops
 * 
 * This class provides automatic ticker management for layers that need to update every frame.
 * It standardizes the pattern of binding/unbinding ticker listeners and ensures proper cleanup
 * to prevent memory leaks.
 * 
 * Usage:
 * ```javascript
 * class MyLayer extends AnimatedCanvasLayer {
 *   async _draw(options) {
 *     await super._draw(options);
 *     // Your initialization code
 *   }
 * 
 *   _onAnimate(deltaTime) {
 *     if (!this.visible || this._destroyed) return;
 *     // Your animation logic
 *   }
 * 
 *   async _tearDown(options) {
 *     // Your cleanup code
 *     await super._tearDown(options);
 *   }
 * }
 * ```
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @since 1.0.0
 */

/**
 * Base class for canvas layers that require animation frame updates via ticker.
 * 
 * Automatically handles:
 * - Binding ticker listener in _draw()
 * - Unbinding ticker listener in _tearDown()
 * - Proper lifecycle state management
 * - Memory leak prevention
 * 
 * Subclasses must implement:
 * - _onAnimate(deltaTime) method for frame updates
 * 
 * @extends foundry.canvas.layers.CanvasLayer
 */
export class AnimatedCanvasLayer extends foundry.canvas.layers.CanvasLayer {
  constructor() {
    super();
    
    /**
     * Bound reference to the animation callback for ticker management
     * @type {Function|null}
     * @private
     */
    this._onAnimateBound = null;
    
    /**
     * Flag indicating if the layer has been destroyed
     * @type {boolean}
     * @protected
     */
    this._destroyed = false;
  }

  /**
   * Draws the layer and automatically binds the ticker listener.
   * Subclasses should call super._draw(options) first, then perform their initialization.
   * 
   * @param {object} options - Drawing options
   * @returns {Promise<void>}
   * @override
   */
  async _draw(options) {
    // Reset destruction flag
    this._destroyed = false;
    
    // Set to non-interactive by default (can be overridden by subclasses)
    this.eventMode = "none";
    
    // Bind and register animation callback if _onAnimate is implemented
    if (typeof this._onAnimate === 'function') {
      this._onAnimateBound = this._onAnimate.bind(this);
      canvas.app.ticker.add(this._onAnimateBound);
    } else {
      console.warn(`${this.constructor.name} extends AnimatedCanvasLayer but does not implement _onAnimate()`);
    }
  }

  /**
   * Animation callback that subclasses must implement.
   * Called every frame by the PIXI ticker.
   * 
   * @param {number} deltaTime - Time elapsed since last frame (in seconds at 60fps = ~0.016)
   * @abstract
   * @protected
   */
  _onAnimate(deltaTime) {
    throw new Error(`${this.constructor.name} must implement _onAnimate(deltaTime) method`);
  }

  /**
   * Tears down the layer and automatically unbinds the ticker listener.
   * Subclasses should perform their cleanup first, then call super._tearDown(options).
   * 
   * @param {object} options - Teardown options
   * @returns {Promise<void>}
   * @override
   */
  async _tearDown(options) {
    // Prevent duplicate teardown
    if (this._destroyed) return;
    
    // Set destruction flag
    this._destroyed = true;
    
    // Remove ticker listener
    if (this._onAnimateBound) {
      canvas.app.ticker.remove(this._onAnimateBound);
      this._onAnimateBound = null;
    }
    
    // Call parent cleanup (destroys all children by default)
    await super._tearDown(options);
  }
}

/**
 * Base class for animated layers that also need window resize handling.
 * 
 * Automatically handles:
 * - Everything from AnimatedCanvasLayer
 * - Binding window resize listener in _draw()
 * - Unbinding window resize listener in _tearDown()
 * 
 * Subclasses must implement:
 * - _onAnimate(deltaTime) method
 * - _onResize() method for handling window resize events
 * 
 * @extends AnimatedCanvasLayer
 */
export class ResizableAnimatedCanvasLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    
    /**
     * Bound reference to the resize callback
     * @type {Function|null}
     * @private
     */
    this._onResizeBound = null;
  }

  /**
   * Draws the layer and automatically binds both ticker and resize listeners.
   * 
   * @param {object} options - Drawing options
   * @returns {Promise<void>}
   * @override
   */
  async _draw(options) {
    await super._draw(options);
    
    // Bind and register resize callback if _onResize is implemented
    if (typeof this._onResize === 'function') {
      this._onResizeBound = this._onResize.bind(this);
      window.addEventListener('resize', this._onResizeBound);
    } else {
      console.warn(`${this.constructor.name} extends ResizableAnimatedCanvasLayer but does not implement _onResize()`);
    }
  }

  /**
   * Resize callback that subclasses must implement.
   * Called whenever the window is resized.
   * 
   * @abstract
   * @protected
   */
  _onResize() {
    throw new Error(`${this.constructor.name} must implement _onResize() method`);
  }

  /**
   * Tears down the layer and automatically unbinds ticker and resize listeners.
   * 
   * @param {object} options - Teardown options
   * @returns {Promise<void>}
   * @override
   */
  async _tearDown(options) {
    // Remove resize listener
    if (this._onResizeBound) {
      window.removeEventListener('resize', this._onResizeBound);
      this._onResizeBound = null;
    }
    
    // Call parent teardown (handles ticker removal)
    await super._tearDown(options);
  }
}
