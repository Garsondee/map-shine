/**
 * Type definitions for NativeAnimation class
 */

type EasingFunction = (t: number) => number;

interface NativeAnimationConfig {
  /** Animation duration in seconds */
  duration: number;
  /** Callback on each animation frame */
  onUpdate?: () => void;
  /** Callback on animation completion */
  onComplete?: () => void;
  /** Easing function or name (e.g., "power2.inOut") */
  ease?: string | EasingFunction;
  /** A unique key for this animation, defaults to the target object */
  key?: unknown;
  /** Allow any additional properties to be animated */
  [key: string]: unknown;
}

interface NativeAnimationController {
  kill: () => void;
}

declare class NativeAnimation {
  static activeAnimations: Map<unknown, NativeAnimationController>;
  static easing: {
    linear: (t: number) => number;
    power2: {
      in: (t: number) => number;
      out: (t: number) => number;
      inOut: (t: number) => number;
    };
    power1: {
      inOut: (t: number) => number;
    };
  };

  static to(
    target: object,
    config: NativeAnimationConfig
  ): NativeAnimationController;
}
