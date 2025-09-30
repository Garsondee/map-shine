// foundry-vtt-globals.d.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
  Emitter,
  EmitterConfigV3,
  ShapeSpawn,
} from "@pixi/particle-emitter";
import type {
  Tile,
  CanvasLayer,
  Canvas,
  Game,
  Combat,
  SceneControl,
  SettingConfig,
  ClientSettings,
  Scene,
} from "@league-of-foundry-developers/foundry-vtt-types";

// Augment the Particle type from @pixi/particle-emitter with custom properties
// used by our custom behaviors
declare module "@pixi/particle-emitter" {
  interface Particle {
    // Properties added by velocity-based behaviors
    velocity?: { x: number; y: number };

    // Properties added by custom behaviors
    spawnColor?: number | { r: number; g: number; b: number };
    config?: any; // Custom per-particle configuration
    oldPosition?: PIXI.Point; // Used for motion blur and path tracking
  }

  // Export types for PropertyList and PropertyNode utilities
  export class PropertyList<T = any> {
    constructor(isColor: boolean);
    reset(list: any): void;
    interpolate(t: number): T;
  }

  export class PropertyNode<T = any> {
    static createList(config: any): any;
  }
}

// Note: Custom hook augmentation is handled via global Hooks interface below

// --- Global Scope Augmentation ---
declare global {
  const MODULE_ID: "map-shine";

  namespace PIXI {
    namespace filters {
      // --- Custom Filter Placeholders ---
      // By using interfaces that extend PIXI.Filter, we add our custom uniforms
      // without losing the base properties like 'enabled' and 'destroy'.
      export interface CustomPIXIFilter extends PIXI.Filter {
        uniforms: Record<string, any>;
        update?(deltaTime: number): void;
      }
      export interface PrismFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface HeatDistortionFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface VignetteFilter extends CustomPIXIFilter {
        amount: number;
        softness: number;
      }
      export interface LensDistortionFilter extends CustomPIXIFilter {
        center: [number, number];
        amount: number;
      }
      export interface ChromaticAberrationFilter extends CustomPIXIFilter {
        center: [number, number];
        amount: number;
      }
      export interface ColorCorrectionFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface FilmGrainFilter extends CustomPIXIFilter {
        intensity: number;
        size: number;
        monochromatic: boolean;
        luminanceResponse: [number, number];
      }
      export interface AdvancedBloomFilter extends PIXI.Filter {
        threshold: number;
        bloomScale: number;
        brightness: number;
        blur: number;
        quality: number;
        blendMode: PIXI.BLEND_MODES;
      }
      export interface TiltShiftFilter extends PIXI.Filter {
        blur: number;
        gradientBlur: number;
        start: PIXI.Point;
        end: PIXI.Point;
      }
      export interface NoisePatternFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface OverheadRecolorFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface LightningOcclusionFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface StructuralFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface CloudShadowsFilter extends CustomPIXIFilter {
        _placeholder?: never;
      }
      export interface NoiseFilter extends CustomPIXIFilter {
        noiseAmount: number;
        destroy(): void;
      }

      export class KawaseBlurFilter extends PIXI.Filter {
        constructor(blur?: number, quality?: number, clamp?: boolean);
        blur: number;
        quality: number;
        clamp: boolean;
        destroy(): void;
      }
    }

    namespace particles {
      // Augment the PIXI.particles namespace with types from the particle emitter library.
      export { Emitter };
      export const Emitter: {
        new (container: PIXI.Container, config: EmitterConfigV3): Emitter;
        registerBehavior(behavior: any): void;
      };
      export namespace behaviors {
        export const ShapeSpawnBehavior: typeof ShapeSpawn & {
          registerShape(shape: any): void;
        };
        export enum BehaviorOrder {
          Early = 0,
          Normal = 1,
          Late = 2,
        }
      }
    }

    interface Container {
      sortChildren(): void;
      // Added to fix "property does not exist" errors
      readonly children: PIXI.DisplayObject[];
      transform: PIXI.Transform;
      blendMode: PIXI.BLEND_MODES;
      addChild(...children: PIXI.DisplayObject[]): PIXI.DisplayObject;
      removeChild(...children: PIXI.DisplayObject[]): PIXI.DisplayObject;
    }

    interface Graphics {
      beginFill(color: number, alpha?: number): this;
      drawPolygon(path: number[] | PIXI.Point[]): this;
      endFill(): this;
    }
  }

  interface Game {
    mapShine: any;
  }
  interface Canvas {
    mapShine: any;
    roofs: CanvasLayer | undefined;
  }
  interface Tile {
    isManagedByOverheadLayer: boolean;
    isManagedByBgLayer: boolean;
  }
  interface Scene {
    darkness: number;
    update(
      data: { darkness?: number; [key: string]: any },
      options?: { diff?: boolean; [key: string]: any }
    ): Promise<Scene>;
  }
  interface CanvasLayer {
    updateEffectTargets?(targets: any): Promise<void> | void;
    updateFromConfig?(config: any, options: any): Promise<void> | void;
    renderEffectNow?(deltaTime: number): void;
    finalShadowTexture?: PIXI.RenderTexture;
    _frameCache?: any;
    zIndex?: number;
  }

  interface Element {
    name?: string;
    // Added to fix "property does not exist" errors
    innerText?: string;
    style?: any;
  }
  interface UpdateOptions {
    userId?: string;
  }

  // Define the settings our module uses
  interface MapShineSettings {
    [key: string]: SettingConfig;
  }

  // Augment ClientSettings to recognize our module's settings
  interface ClientSettings {
    register(module: "map-shine", key: string, data: SettingConfig): void;
    get(module: "map-shine", key: string): any;
    set(module: "map-shine", key: string, value: any): Promise<void>;
  }

  // Augment FlagConfig for Scenes
  interface FlagConfig {
    Scene: {
      "map-shine": {
        [key: string]: unknown;
      };
    };
  }

  // Extend Foundry's HookConfig to include custom Map Shine hooks
  // Using augmentation to ensure these are properly merged with Foundry's types
  interface HookConfig {
    "mapShine:timeChanged": (time: number) => void;
    "mapShine:targetsRefreshed": () => void;
    "mapShine:mapPointsUpdated": (
      context?: { created?: string; updated?: string; deleted?: string }
    ) => void;
    "mapShine:activeTokenChanged": (token: any) => void;
    // Add missing Foundry hooks that aren't in the types package
    "combatEnd": (combat: Combat, ...args: any[]) => void;
  }

  // Override the strict Hooks interface to allow any string hook names
  // This prevents TypeScript errors for custom hooks and missing Foundry hooks
  interface Hooks {
    // Allow any hook name with any arguments
    callAll(hook: string, ...args: any[]): boolean;
    on(hook: string, fn: (...args: any[]) => any, options?: any): number;
    once(hook: string, fn: (...args: any[]) => any, options?: any): number;
    off(hook: string, fn: number | ((...args: any[]) => any)): void;
  }

  // NativeAnimation type definitions
  // Config allows any properties to be animated (like progress, opacity, etc.)
  // along with animation control properties
  type NativeAnimationConfig = {
    duration: number;
    onUpdate?: () => void;
    onComplete?: () => void;
    ease?: string | ((t: number) => number);
    key?: any;
    progress?: number; // Common animated property
    [key: string]: any; // Allow any other animated properties
  };

  interface NativeAnimation {
    kill(): void;
  }

  const NativeAnimation: {
    to(target: any, config: NativeAnimationConfig): NativeAnimation;
  };

  const libWrapper: any;
}

// This empty export makes sure the file is treated as a module.
export {};
