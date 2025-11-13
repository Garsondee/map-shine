import { PIXI, RenderTexture, Texture, SCALE_MODES, WRAP_MODES } from "../pixi-adapter.js";
import { CoordinateManager } from "./CoordinateManager.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";

export class NoiseTextureManager {
  constructor(renderer, configPath, isWorldSpace = false) {
    this.configPath = configPath;
    this.isWorldSpace = isWorldSpace;
    this._needsUpdate = true; // A flag to force an update after config changes or pans.

    const screen = renderer.screen;

    this.renderTexture = PIXI.RenderTexture.create({
      width: screen.width,
      height: screen.height,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    });
    this.renderTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
    this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.sourceSprite.width = screen.width;
    this.sourceSprite.height = screen.height;
    // START OF MODIFICATION
    const FilterCtor = globalThis && globalThis.NoisePatternFilter ? globalThis.NoisePatternFilter : null;
    if (FilterCtor) {
      this.filter = safeCreateFilter(
        FilterCtor,
        {
          u_isWorldSpace: this.isWorldSpace,
          u_resolution: [screen.width, screen.height], // Pass initial screen resolution here
        },
        "DynamicTokenMaskManager.NoisePatternFilter"
      );
    } else {
      console.warn("MapShine | NoiseTextureManager: NoisePatternFilter not available at init; skipping filter creation.");
      this.filter = null;
    }
    
    if (this.filter) {
      safeApplyFilters(this.sourceSprite, [this.filter], "DynamicTokenMaskManager.sourceSprite");
    } else {
      console.error("Map Shine | DynamicTokenMaskManager: Failed to create NoisePatternFilter");
    }
    // END OF MODIFICATION

    // If this is a world-space noise, it must re-render on pan.
    if (this.isWorldSpace) {
      this._onPanBound = this.requestUpdate.bind(this);
      if (!game.modules.get("libwrapper")?.active) {
        Hooks.on("canvasPan", this._onPanBound);
      }
    }
  }

  requestUpdate() {
    this._needsUpdate = true;
  }

  resize(renderer) {
    if (!this.renderTexture || !this.sourceSprite) return;
    const screen = renderer.screen;
    this.renderTexture.resize(screen.width, screen.height, true);
    this.sourceSprite.width = screen.width;
    this.sourceSprite.height = screen.height;
    if (this.filter) {
      this.filter.uniforms.u_resolution = [screen.width, screen.height];
    }
    this._needsUpdate = true;
  }

  updateFromConfig(config) {
    const nConfig = foundry.utils.getProperty(config, this.configPath);
    if (!nConfig || typeof nConfig !== "object") {
      if (this.filter) this.filter.enabled = false;
      return;
    }

    if (!this.filter) return;
    this.filter.enabled = true;

    // Define scaling factors based on the effect path to normalize UI values.
    const SCALING_FACTORS = {
      "canopy.distortion": { speed: 0.01, evolution: 0.01 },
      "prism.distortionNoise": { speed: 0.1, evolution: 0.1 },
      "structuralShadows.intensityNoise": { speed: 0.1, evolution: 0.1 },
      "iridescence.noise": { speed: 0.01, evolution: 0.01 },
    };
    const factors = SCALING_FACTORS[this.configPath] || {
      speed: 1.0,
      evolution: 1.0,
    };

    const u = this.filter.uniforms;
    u.u_speed = (nConfig["speed"] ?? 0.0) * (factors.speed ?? 1.0);
    u.u_scale = nConfig["scale"] ?? 1.0;
    u.u_threshold = nConfig["threshold"] ?? 0.5;
    u.u_brightness = nConfig["brightness"] ?? 1.0;
    u.u_contrast = nConfig["contrast"] ?? 1.0;
    u.u_softness = nConfig["softness"] ?? 0.0;
    u.u_evolution = (nConfig["evolution"] ?? 0.0) * (factors.evolution ?? 1.0);

    this.requestUpdate();
  }

  update(deltaTime, renderer) {
    if (!this.filter || !this.filter.enabled) return;

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    const nConfig = foundry.utils.getProperty(
      game.mapShine.profileManager.activeConfig,
      this.configPath
    );
    const isAnimated =
      nConfig &&
      ((nConfig["speed"] ?? 0) * timeFactor !== 0 ||
        (nConfig["evolution"] ?? 0) * timeFactor !== 0);

    if (!this._needsUpdate && !isAnimated) return;

    this.filter.uniforms.uTime += deltaTime * timeFactor;

    // Get all necessary coordinate data from the centralized manager.
    if (this.isWorldSpace) {
      Object.assign(
        this.filter.uniforms,
        CoordinateManager.getShaderUniforms()
      );
    } else {
      // Screen-space filters only need resolution.
      this.filter.uniforms.uViewSize = [
        CoordinateManager.screenDimensions.width,
        CoordinateManager.screenDimensions.height,
      ];
    }

    // Validate sprite and textures before rendering
    if (this.sourceSprite?.texture?.baseTexture?.valid && !this.sourceSprite.destroyed && this.renderTexture?.valid) {
      renderer.render(this.sourceSprite, {
        renderTexture: this.renderTexture,
        clear: true,
      });
    } else {
      console.warn("ScreenEffect | Invalid sourceSprite or renderTexture, skipping render");
    }
    this._needsUpdate = false;
  }

  getTexture() {
    return this.renderTexture;
  }

  destroy() {
    if (this.isWorldSpace && this._onPanBound) {
      Hooks.off("canvasPan", this._onPanBound);
    }

    this.filter?.destroy();
    this.sourceSprite?.destroy();
    this.renderTexture?.destroy(true);
  }
}