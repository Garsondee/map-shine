/**
 * @fileoverview NativeAnimation - Lightweight GSAP-like animation system
 * 
 * A lightweight animation system that provides GSAP-like functionality using requestAnimationFrame.
 * Supports property tweening, easing functions, and animation lifecycle management.
 * 
 * This class serves as a replacement for GSAP animations when external dependencies
 * are not desired or available. It provides smooth property interpolation with
 * common easing functions and proper cleanup mechanisms.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.2.0
 * @since 1.0.0
 */

/**
 * A lightweight animation system that provides GSAP-like functionality using requestAnimationFrame.
 * Supports property tweening, easing functions, and animation lifecycle management.
 * 
 * @class NativeAnimation
 * @example
 * // Animate an object's opacity
 * const animation = NativeAnimation.to(myObject, {
 *   opacity: 0,
 *   duration: 1.5,
 *   ease: "power2.inOut",
 *   onComplete: () => console.log("Animation finished!")
 * });
 * 
 * // Stop the animation early
 * animation.kill();
 */
export class NativeAnimation {
  /**
   * A map to store active animations, allowing them to be cancelled.
   * The key can be any unique identifier (e.g., a PIXI object, a string).
   */
  static activeAnimations = new Map();

  /**
   * A collection of common easing functions, which can be nested.
   * Allows for dot-notation access like "power2.inOut".
   * @type {*}
   */
  static easing = {
    /** @param {number} t */
    linear: (t) => t,
    power2: {
      /** @param {number} t */
      in: (t) => t * t,
      /** @param {number} t */
      out: (t) => 1 - (1 - t) * (1 - t),
      /** @param {number} t */
      inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    },
    power1: {
      /** @param {number} t */
      inOut: (t) => (t < 0.5 ? t : 1 - t), // Simple linear ramp up/down
    },
  };

  /**
   * A simple GSAP `to` replacement using requestAnimationFrame.
   * The config object contains the duration and callbacks, plus any properties on the target object to animate.
   * 
   * @param {object} target - The object whose properties you want to animate.
   * @param {object} config - Animation configuration. Include duration, onUpdate, onComplete, ease, key, and any properties to animate.
   * @param {number} config.duration - Duration in seconds
   * @param {Function} [config.onUpdate] - Callback fired on each animation frame
   * @param {Function} [config.onComplete] - Callback fired when animation completes
   * @param {string|Function} [config.ease="linear"] - Easing function name or custom function
   * @param {*} [config.key] - Unique key for this animation (defaults to target object)
   * @returns {{kill: function}} An object with a kill method to stop the animation.
   * 
   * @example
   * NativeAnimation.to(sprite, {
   *   x: 100,
   *   y: 200,
   *   alpha: 0.5,
   *   duration: 2,
   *   ease: "power2.inOut",
   *   onComplete: () => console.log("Done!")
   * });
   */
  static to(target, config) {
    const { duration, onUpdate, onComplete, ease, ...properties } = config;
    const key = config.key || target; // Use a provided key or the target object itself

    // If there's an existing animation on this target, kill it.
    if (this.activeAnimations.has(key)) {
      this.activeAnimations.get(key).kill();
    }

    const startValues = {};
    const endValues = {};
    for (const prop in properties) {
      startValues[prop] = target[prop];
      endValues[prop] = properties[prop];
    }

    const easingFunction =
      typeof ease === "string"
        ? foundry.utils.getProperty(this.easing, ease) || this.easing.linear
        : typeof ease === "function"
        ? ease
        : this.easing.linear;

    let startTime = null;
    let animationFrameId = null;

    const animationController = {
      kill: () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
          this.activeAnimations.delete(key);
        }
      },
    };

    this.activeAnimations.set(key, animationController);

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const easedProgress = easingFunction(progress);

      for (const prop in properties) {
        target[prop] =
          startValues[prop] +
          (endValues[prop] - startValues[prop]) * easedProgress;
      }

      if (onUpdate) onUpdate();

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
        this.activeAnimations.delete(key);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return animationController;
  }
}
