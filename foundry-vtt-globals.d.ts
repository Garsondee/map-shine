// foundry-vtt-globals.d.ts

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

// --- Global Scope Augmentation ---
declare global {
  const MODULE_ID: "map-shine";

  namespace PIXI {
    // --- Custom Filter Placeholders ---
    // By using interfaces that extend PIXI.Filter, we add our custom uniforms
    // without losing the base properties like 'enabled' and 'destroy'.
    interface CustomPIXIFilter extends PIXI.Filter {
      uniforms: Record<string, any>;
      update?(deltaTime: number): void;
    }
    interface PrismFilter extends CustomPIXIFilter {}
    interface HeatDistortionFilter extends CustomPIXIFilter {}
    interface VignetteFilter extends CustomPIXIFilter {
      amount: number;
      softness: number;
    }
    interface LensDistortionFilter extends CustomPIXIFilter {
      center: [number, number];
      amount: number;
    }
    interface ChromaticAberrationFilter extends CustomPIXIFilter {
      center: [number, number];
      amount: number;
    }
    interface ColorCorrectionFilter extends CustomPIXIFilter {}
    interface FilmGrainFilter extends CustomPIXIFilter {
      intensity: number;
      size: number;
      monochromatic: boolean;
      luminanceResponse: [number, number];
    }
    interface AdvancedBloomFilter extends PIXI.Filter {
      threshold: number;
      bloomScale: number;
      brightness: number;
      blur: number;
      quality: number;
      blendMode: PIXI.BLEND_MODES;
    }
    interface TiltShiftFilter extends PIXI.Filter {
      blur: number;
      gradientBlur: number;
      start: PIXI.Point;
      end: PIXI.Point;
    }
    interface NoisePatternFilter extends CustomPIXIFilter {}
    interface OverheadRecolorFilter extends CustomPIXIFilter {}
    interface LightningOcclusionFilter extends CustomPIXIFilter {}
    interface StructuralFilter extends CustomPIXIFilter {}
    interface CloudShadowsFilter extends CustomPIXIFilter {}

    namespace particles {
      // Augment the PIXI.particles namespace with types from the particle emitter library.
      export { Emitter };
      export const Emitter: {
        new (container: PIXI.Container, config: EmitterConfigV3): Emitter;
        registerBehavior(behavior: any): void;
      };
      const behaviors: {
        ShapeSpawn: typeof ShapeSpawn;
      };
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
  interface CanvasLayer {
    updateEffectTargets?(targets: any): Promise<void> | void;
    updateFromConfig?(config: any, options: any): Promise<void> | void;
    renderEffectNow?(deltaTime: number): void;
    finalShadowTexture?: PIXI.RenderTexture;
    _frameCache?: any;
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

  // Define the custom hooks our module uses
  interface HookConfig {
    "mapShine:timeChanged": (time: number) => void;
    "mapShine:targetsRefreshed": () => void;
    "mapShine:activeTokenChanged": () => void;
    "mapShine:mapPointsUpdated": () => void;
    combatEnd: (
      combat: Combat,
      options: { round: number; turn: number },
      userId: string
    ) => void;
    getSceneControlButtons: (controls: SceneControl[]) => void;
  }

  const libWrapper: any;
}

namespace particles {
  // Augment the PIXI.particles namespace with types from the particle emitter library.
  export { Emitter };
  export const Emitter: {
    new (container: PIXI.Container, config: EmitterConfigV3): Emitter;
    registerBehavior(behavior: any): void;
  };
  // behaviors namespace surface used by this module
  namespace behaviors {
    // Execution order for custom behaviors
    enum BehaviorOrder {
      Early = 0,
      Normal = 1,
      Late = 2,
    }
    // Re-export ShapeSpawn to allow ShapeSpawn.registerShape(...)
    export { ShapeSpawn };
  }
  // Property utilities used by behavior configs
  class PropertyList<T = any> {
    constructor(isColor: boolean);
    reset(list: any): void;
    interpolate(t: number): T;
  }
  class PropertyNode<T = any> {
    static createList(config: any): any;
  }
  // Particle type used in JSDoc annotations within module.js
  type Particle = any;
}

// This empty export makes sure the file is treated as a module.
export {};
