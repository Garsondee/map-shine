(() => {
  // scripts/module.js
  var MODULE_ID = "map-shine";
  var PROFILES_SETTING = "profiles";
  var DEFAULT_PROFILE_SETTING = "defaultProfile";
  var BLEND_MODE_OPTIONS = {
    "NORMAL": PIXI.BLEND_MODES.NORMAL,
    "ADD": PIXI.BLEND_MODES.ADD,
    "MULTIPLY": PIXI.BLEND_MODES.MULTIPLY,
    "SCREEN": PIXI.BLEND_MODES.SCREEN,
    "OVERLAY": PIXI.BLEND_MODES.OVERLAY,
    "DARKEN": PIXI.BLEND_MODES.DARKEN,
    "LIGHTEN": PIXI.BLEND_MODES.LIGHTEN,
    "COLOR_DODGE": PIXI.BLEND_MODES.COLOR_DODGE,
    "COLOR_BURN": PIXI.BLEND_MODES.COLOR_BURN,
    "HARD_LIGHT": PIXI.BLEND_MODES.HARD_LIGHT,
    "SOFT_LIGHT": PIXI.BLEND_MODES.SOFT_LIGHT,
    "DIFFERENCE": PIXI.BLEND_MODES.DIFFERENCE,
    "EXCLUSION": PIXI.BLEND_MODES.EXCLUSION
  };
  var GRADIENT_PRESETS = {
    rainbow: {
      colors: ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000"]
    },
    "magma": {
      colors: ["#000000", "#3c1000", "#d23c02", "#f9c302", "#ffffff", "#f9c302", "#d23c02", "#3c1000", "#000000"]
    },
    "ice": {
      colors: ["#e3f8ff", "#a1d7ff", "#5d9fff", "#2a6bff", "#0041a7", "#2a6bff", "#5d9fff", "#a1d7ff", "#e3f8ff"]
    },
    "toxic": {
      colors: ["#4a004a", "#a400a4", "#00ff00", "#008300", "#000000", "#008300", "#00ff00", "#a400a4", "#4a004a"]
    },
    "sunset": {
      colors: ["#f9e075", "#f79e52", "#e25442", "#982c44", "#401b3b", "#982c44", "#e25442", "#f79e52", "#f9e075"]
    },
    "synthwave": {
      colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0", "#4361ee", "#3a0ca3", "#7209b7", "#f72585"]
    }
  };
  var MODULE_DEFAULTS = {
    "enabled": true,
    "debug": true,
    "showTokenMask": false,
    "tileOpacity": 0,
    "baseShine": {
      "enabled": true,
      "specularTexturePath": "",
      "patternType": "stripes",
      "compositing": {
        "layerBlendMode": 1
      },
      "animation": {
        "globalIntensity": 4,
        "hotspot": 0,
        "updateFrequency": 5,
        "parallaxAmount": 1
      },
      "pattern": {
        "shared": {
          "patternScale": 0.14,
          "maxBrightness": 0.5
        },
        "stripes1": {
          "enabled": true,
          "intensity": 0.5,
          "speed": -6e-3,
          "tintColor": "#FFFFFF",
          "angle": 50,
          "sharpness": 8,
          "bandDensity": 1,
          "bandWidth": 1,
          "subStripeMaxCount": 5,
          "subStripeMaxSharp": 0
        },
        "stripes2": {
          "enabled": true,
          "intensity": 0.5,
          "speed": 4e-3,
          "tintColor": "#FFFFFF",
          "angle": 44,
          "sharpness": 8,
          "bandDensity": 1,
          "bandWidth": 1,
          "subStripeMaxCount": 5,
          "subStripeMaxSharp": 0
        },
        "checkerboard": {
          "gridSize": 8,
          "brightness1": 0.15,
          "brightness2": 0.05
        }
      },
      "noise": {
        "enabled": false,
        "speed": -2e-3,
        "scale": 0.2,
        "threshold": 0.11,
        "brightness": -0.4,
        "contrast": 0.5,
        "softness": 1
      },
      "shineBloom": {
        "enabled": false,
        "threshold": 0.19,
        "brightness": 1.5,
        "blur": 0,
        "quality": 4
      },
      "starburst": {
        "enabled": false,
        "blendMode": 1,
        "threshold": 0.72,
        "intensity": 4,
        "angle": 18,
        "points": 2,
        "size": 6,
        "falloff": 0.7
      },
      "rgbSplit": {
        "enabled": true,
        "amount": 1.1
      },
      "colorCorrection": {
        "enabled": true,
        "saturation": 3.45,
        "brightness": -0.3,
        "contrast": 1,
        "exposure": -1.6,
        "gamma": 0.5,
        "levels": {
          "inBlack": 0,
          "inWhite": 1
        },
        "tint": {
          "color": "#ffcb2d",
          "amount": 0.2
        }
      }
    },
    "cloudShadows": {
      "enabled": true,
      "blendMode": 0,
      "shadowIntensity": 0.3,
      "maskBlur": 0,
      "illumination": {
        "enabled": false,
        "intensity": 0.8,
        "luminanceThreshold": 0.1,
        "softness": 0.2
      },
      "wind": {
        "angle": 45,
        "speed": 1e-3
      },
      "noise": {
        "scale": 0.11,
        "octaves": 5,
        "persistence": 0.4,
        "lacunarity": 2.6
      },
      "shading": {
        "threshold": 1,
        "softness": 0.2,
        "brightness": 0.51,
        "contrast": 1,
        "gamma": 1
      }
    },
    "iridescence": {
      "enabled": true,
      "texturePath": "",
      "blendMode": 1,
      "intensity": 0.8,
      "speed": 1e-3,
      "scale": 0.2,
      "parallax": 0,
      "fbm": {
        "octaves": 5,
        "persistence": 0.5,
        "lacunarity": 2,
        "evolution": 0.1,
        "brightness": 0.5,
        "contrast": 1
      },
      "distortion": {
        "enabled": true,
        "strength": 5.26
      },
      "noise": {
        "enabled": true,
        "speed": 0,
        "scale": 1.5,
        "threshold": 0.05,
        "brightness": -0.01,
        "contrast": 0.25,
        "softness": 1
      },
      "gradient": {
        "name": "magma",
        "hueShift": 0,
        "brightness": 0.52,
        "contrast": 0.45
      }
    },
    "canopy": {
      "enabled": true,
      "shadowIntensity": 0.7,
      "tint": "#050805",
      "illumination": {
        "enabled": false,
        "intensity": 0.8,
        "luminanceThreshold": 0.1,
        "softness": 0.2
      },
      "distortion": {
        "enabled": true,
        "intensity": 5,
        "speed": 0.05,
        "scale": 0.15,
        "evolution": 0.1,
        "threshold": 0,
        "brightness": 0,
        "contrast": 1,
        "softness": 1
      }
    },
    "structuralShadows": {
      "enabled": true,
      "shadowIntensity": 0.6,
      "tint": "#000000",
      "parallax": 0.15,
      "rgbSplit": {
        "enabled": true,
        "intensity": 2,
        "threshold": 0.5
      },
      "illumination": {
        "enabled": false,
        "intensity": 0.8,
        "luminanceThreshold": 0.1,
        "softness": 0.2
      },
      "intensityNoise": {
        "enabled": true,
        "amount": 0.4,
        "speed": 0.01,
        "scale": 2,
        "evolution": 0.02,
        "threshold": 0,
        "brightness": 0,
        "contrast": 1,
        "softness": 1
      },
      "cloudOcclusion": {
        "enabled": false,
        "intensity": 1,
        "wind": {
          "angle": 45,
          "speed": 1e-3
        },
        "noise": {
          "scale": 0.11,
          "octaves": 5,
          "persistence": 0.4,
          "lacunarity": 2.6
        },
        "shading": {
          "threshold": 1,
          "softness": 0.2,
          "brightness": 0.51,
          "contrast": 1,
          "gamma": 1
        }
      }
    },
    "prism": {
      "enabled": true,
      "intensity": 5,
      "angle": 45,
      "threshold": 0.85,
      "softness": 0.1,
      "distortionStrength": 2,
      "distortionNoise": {
        "enabled": true,
        "speed": 0.05,
        "scale": 1.5,
        "evolution": 0.1,
        "threshold": 0,
        "brightness": 0,
        "contrast": 1,
        "softness": 1
      }
    },
    "ambient": {
      "enabled": true,
      "texturePath": "",
      "blendMode": 1,
      "intensity": 1.25,
      "masking": {
        "enabled": true,
        "threshold": 0,
        "softness": 0.25
      },
      "tokenMasking": {
        "enabled": true,
        "threshold": 0
      },
      "colorCorrection": {
        "enabled": true,
        "saturation": 1.2,
        "brightness": 0,
        "contrast": 1,
        "gamma": 1,
        "tint": {
          "color": "#ff0209",
          "amount": 0
        }
      }
    },
    "groundGlow": {
      "enabled": true,
      "texturePath": "",
      "blendMode": 1,
      "intensity": 1.05,
      "luminanceThreshold": 0.25,
      "brightness": 1.2,
      "saturation": 1.2,
      "softness": 1,
      "invert": false,
      "tokenMasking": {
        "enabled": true,
        "threshold": 0
      }
    },
    "heatDistortion": {
      "enabled": true,
      "texturePath": "",
      "intensity": 5e-4,
      "noise": {
        "speed": 0.095,
        "scale": 2.9,
        "threshold": 0,
        "brightness": 0.09,
        "contrast": 0.45,
        "softness": 1,
        "evolution": 0.1
      }
    },
    "advancedBloom": {
      "enabled": false,
      "threshold": 0.5,
      "bloomScale": 1,
      "brightness": 1,
      "blur": 8,
      "quality": 4
    },
    "postProcessing": {
      "enabled": true,
      "colorCorrection": {
        "enabled": true,
        "saturation": 1.15,
        "brightness": 0,
        "contrast": 1.05,
        "invert": false,
        "tint": {
          "color": "#FFFFFF",
          "amount": 0
        },
        "exposure": 0,
        "gamma": 0.9,
        "levels": {
          "inBlack": 0,
          "inWhite": 1
        },
        "whiteBalance": {
          "temperature": 0,
          "tint": -0.1
        },
        "highlightCloud": {
          "enabled": false,
          "brightness": 0
        },
        "highlightCanopy": {
          "enabled": false,
          "brightness": 0
        },
        "highlightStructural": {
          "enabled": false,
          "brightness": 0
        },
        "mask": {
          "enabled": false,
          "invert": false,
          "luminanceThreshold": 0.25,
          "softness": 0.1
        },
        "selective": {
          "enabled": false,
          "color": "#ff0000",
          "hueRange": 0.05,
          "saturationRange": 0.3
        }
      },
      "vignette": {
        "enabled": true,
        "amount": 0.25,
        "softness": 0.45
      },
      "lensDistortion": {
        "enabled": false,
        "amount": 0.02,
        "centerX": 0.5,
        "centerY": 0.5
      },
      "chromaticAberration": {
        "enabled": false,
        "amount": 0,
        "centerX": 0.5,
        "centerY": 0.5
      },
      "tiltShift": {
        "enabled": false,
        "blur": 15,
        "gradientBlur": 15,
        "startX": 0,
        "startY": 0.5,
        "endX": 1,
        "endY": 0.5
      }
    },
    "ambientLayerZIndex": 250
  };
  var hexToRgbArray = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
  };
  var MapShineLifecycle = class _MapShineLifecycle {
    static async onCanvasReady(canvas2) {
      if (!canvas2.scene)
        return;
      canvas2.mapShine = {
        isModuleActive: true
      };
      console.log("Map Shine | canvasReady: Initializing systems for the current canvas.");
      const disableLoadingScreen = game.settings.get(MODULE_ID, "disable-loading-screen");
      if (!disableLoadingScreen && !game.mapShine.loadingScreen) {
        try {
          game.mapShine.loadingScreen = new LoadingScreen();
          game.mapShine.loadingScreen.show();
        } catch (err) {
          console.error("Map Shine | Failed to show loading screen:", err);
          game.mapShine.loadingScreen = null;
        }
      }
      _MapShineLifecycle.beginPersistentDiscovery(canvas2);
    }
    static async beginPersistentDiscovery(canvas2, attempt = 1, maxAttempts = 5) {
      if (!canvas2?.scene || !canvas2.mapShine?.isModuleActive) {
        console.log("Map Shine | Discovery aborted, canvas is no longer active.");
        return;
      }
      if (attempt > maxAttempts) {
        console.warn(`Map Shine | Texture discovery failed after ${maxAttempts} attempts. No effect maps found.`);
        if (game.mapShine.loadingScreen) {
          await game.mapShine.loadingScreen.hide();
          game.mapShine.loadingScreen = null;
        }
        this.runMinimalSetup(canvas2);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 100 : 250));
      await game.mapShine.effectTargetManager.refresh();
      const targets = game.mapShine.effectTargetManager.targets;
      const hasBackgroundTarget = targets.background && Object.values(targets.background).some((v) => v && typeof v === "string");
      const hasTileTargets = Array.from(targets.tiles.values()).length > 0;
      if (hasBackgroundTarget || hasTileTargets) {
        console.log(`Map Shine | Texture discovery successful on attempt #${attempt}. Initializing all systems.`);
        this.runFullSetup(canvas2);
      } else {
        console.log(`Map Shine | Texture discovery attempt #${attempt} found no targets. Retrying...`);
        _MapShineLifecycle.beginPersistentDiscovery(canvas2, attempt + 1, maxAttempts);
      }
    }
    static async runFullSetup(canvas2) {
      const loadingScreen = game.mapShine.loadingScreen;
      game.mapShine.profileManager.initializeForScene();
      this.finalizeConfigurationAndUI();
      await game.mapShine.profileManager.updateAllSystemsFromConfig();
      ScreenEffectsManager.initialize(canvas2.stage);
      ScreenEffectsManager.setupAllGlobalFilters();
      ScreenEffectsManager.updateAllFiltersFromConfig(game.mapShine.profileManager.activeConfig);
      if (game.mapShine.debugger) {
        game.mapShine.debugger.eventHandler.updateAllControls();
      }
      canvas2.mapShine.lightingEffectManager = new LightingEffectManager(canvas2);
      canvas2.mapShine.ambientMaskManager = new AmbientMaskManager(canvas2);
      canvas2.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas2);
      if (loadingScreen) {
        await loadingScreen.hide();
        game.mapShine.loadingScreen = null;
      }
    }
    static async runMinimalSetup(canvas2) {
      game.mapShine.profileManager.initializeForScene();
      await game.mapShine.profileManager.updateAllSystemsFromConfig();
      ScreenEffectsManager.initialize(canvas2.stage);
      ScreenEffectsManager.setupAllGlobalFilters();
      ScreenEffectsManager.updateAllFiltersFromConfig(game.mapShine.profileManager.activeConfig);
    }
    static onCanvasTearDown(tornDownCanvas) {
      if (!tornDownCanvas?.mapShine)
        return;
      console.log("Map Shine | canvasTearDown: Tearing down systems for a specific canvas.");
      if (tornDownCanvas.mapShine._debugTicker) {
        tornDownCanvas.app.ticker.remove(tornDownCanvas.mapShine._debugTicker);
      }
      if (tornDownCanvas.mapShine.tokenMaskDebugSprite) {
        tornDownCanvas.mapShine.tokenMaskDebugSprite.destroy();
      }
      tornDownCanvas.mapShine.lightingEffectManager?.destroy();
      tornDownCanvas.mapShine.ambientMaskManager?.destroy();
      tornDownCanvas.mapShine.tokenMaskManager?.destroy();
      ScreenEffectsManager.tearDown();
      game.mapShine.particleManager.destroy();
      tornDownCanvas.mapShine.isModuleActive = false;
      tornDownCanvas.mapShine = null;
    }
    static finalizeConfigurationAndUI() {
      console.log("Map Shine | Finalizing configuration based on available textures.");
      const EFFECT_TEXTURE_MAP = {
        baseShine: "specular",
        cloudShadows: "outdoors",
        canopy: "canopy",
        structuralShadows: "structural",
        iridescence: "iridescence",
        ambient: "ambient",
        groundGlow: "groundGlow",
        heatDistortion: "heat",
        prism: "prism"
      };
      const targets = game.mapShine.effectTargetManager.targets;
      const allTargets = [
        targets.background,
        ...targets.tiles.values()
      ].filter(Boolean);
      const config = game.mapShine.profileManager.activeConfig;
      const handler = game.mapShine.debugger?.eventHandler;
      for (const [effectKey, textureKey] of Object.entries(EFFECT_TEXTURE_MAP)) {
        const hasTexture = allTargets.some((target) => target[textureKey]);
        const path = `${effectKey}.enabled`;
        const isCurrentlyEnabled = foundry.utils.getProperty(config, path);
        if (!hasTexture && isCurrentlyEnabled) {
          foundry.utils.setProperty(config, path, false);
          console.log(`Map Shine | Effect '${effectKey}' auto-disabled: No '${textureKey}' texture found.`);
        }
        handler?.setEffectAvailability(effectKey, hasTexture);
      }
    }
  };
  var SystemStatusManager = class _SystemStatusManager {
    constructor() {
      if (_SystemStatusManager._instance) {
        return _SystemStatusManager._instance;
      }
      _SystemStatusManager._instance = this;
      this._callbacks = {};
      this._state = {
        shaders: {
          baseShine: {
            state: "unknown",
            message: "Not yet compiled."
          },
          noise: {
            state: "unknown",
            message: "Not yet compiled."
          },
          bloom: {
            state: "unknown",
            message: "Not yet compiled."
          },
          iridescence: {
            state: "unknown",
            message: "Not yet compiled."
          },
          prism: {
            state: "unknown",
            message: "Not yet compiled."
          },
          heat: {
            state: "unknown",
            message: "Not yet compiled."
          },
          cloudShadows: {
            state: "unknown",
            message: "Not yet compiled."
          },
          structuralShadows: {
            state: "unknown",
            message: "Not yet compiled."
          },
          postProcessing: {
            state: "unknown",
            message: "Not yet initialized."
          },
          internal: {
            state: "unknown",
            message: "Not yet initialized."
          },
          debug: {
            state: "unknown",
            message: "Not yet initialized."
          }
        },
        textures: {
          specular: {
            state: "inactive",
            message: "No path specified."
          },
          ambient: {
            state: "inactive",
            message: "No path specified."
          },
          iridescence: {
            state: "inactive",
            message: "No path specified."
          },
          groundGlow: {
            state: "inactive",
            message: "No path specified."
          },
          heat: {
            state: "inactive",
            message: "No path specified."
          },
          dust: {
            state: "inactive",
            message: "No path specified."
          },
          outdoors: {
            state: "inactive",
            message: "No path specified."
          },
          canopy: {
            state: "inactive",
            message: "No path specified."
          },
          structural: {
            state: "inactive",
            message: "No path specified."
          },
          prism: {
            state: "inactive",
            message: "No path specified."
          }
        },
        pipelines: {
          noiseToShine: {
            state: "inactive",
            message: "Pipeline inactive."
          }
        }
      };
    }
    static get instance() {
      if (!_SystemStatusManager._instance) {
        new _SystemStatusManager();
      }
      return _SystemStatusManager._instance;
    }
    on(event, callback) {
      if (!this._callbacks[event]) {
        this._callbacks[event] = [];
      }
      this._callbacks[event].push(callback);
    }
    off(event, callback) {
      if (!this._callbacks[event]) {
        return;
      }
      this._callbacks[event] = this._callbacks[event].filter((cb) => cb !== callback);
    }
    emit(event, ...args) {
      if (this._callbacks[event]) {
        this._callbacks[event].forEach((callback) => callback(...args));
      }
    }
    update(category, key, statusObject) {
      if (this._state[category] && this._state[category][key]) {
        this._state[category][key] = statusObject;
        this.emit("statusChanged", category, key, statusObject);
      } else {
        console.warn(`SystemStatusManager | Attempted to update non-existent status: ${category}.${key}`);
      }
    }
    getStatus(category, key) {
      return this._state[category]?.[key] || {
        state: "error",
        message: "Status key not found."
      };
    }
    getAllStatuses() {
      return this._state;
    }
    evaluatePipelines() {
      if (!OVERLAY_CONFIG.baseShine.noise.enabled) {
        this.update("pipelines", "noiseToShine", {
          state: "disabled",
          message: "Noise mask is disabled by user."
        });
      } else if (this.getStatus("shaders", "noise").state !== "ok") {
        this.update("pipelines", "noiseToShine", {
          state: "error",
          message: "Pipeline broken: Noise shader failed to compile."
        });
      } else {
        this.update("pipelines", "noiseToShine", {
          state: "ok",
          message: "Pipeline active: Noise mask is modulating the shine pattern."
        });
      }
    }
  };
  var systemStatus = new SystemStatusManager();
  var TextureAutoLoader = class _TextureAutoLoader {
    static SUFFIX_MAP = {
      specular: "_Specular",
      ambient: "_Ambient",
      iridescence: "_Iridescence",
      groundGlow: "_GroundGlow",
      heat: "_Heat",
      dust: "_Dust",
      outdoors: "_Outdoors",
      canopy: "_Canopy",
      structural: "_Structural",
      prism: "_Prism"
    };
    async discoverAllTargets() {
      const results = {
        background: null,
        tiles: /* @__PURE__ */ new Map()
      };
      const backgroundTarget = await this._processSceneBackground();
      if (backgroundTarget) {
        results.background = backgroundTarget;
      }
      for (const tile of canvas.tiles.placeables) {
        const tileTarget = await this._processTile(tile);
        if (tileTarget) {
          results.tiles.set(tile.id, tileTarget);
        }
      }
      console.log("MapShine | Full Texture Discovery Results:", results);
      return results;
    }
    async _processSceneBackground() {
      const bgSrc = canvas.scene?.background.src;
      if (!bgSrc) {
        console.info("MapShine | No scene background texture found.");
        return null;
      }
      const targetData = await this._findSuffixesForBaseTexture(bgSrc);
      targetData.baseTexturePath = bgSrc;
      targetData.rect = canvas.scene.dimensions.sceneRect;
      return targetData;
    }
    async _processTile(tile) {
      const tileSrc = tile.document.texture.src;
      if (!tileSrc)
        return null;
      const suffixData = await this._findSuffixesForBaseTexture(tileSrc);
      const hasEffectMap = Object.values(suffixData).some((path) => path && typeof path === "string");
      if (hasEffectMap) {
        return {
          tile,
          baseTexturePath: tileSrc,
          rect: {
            x: tile.document.x,
            y: tile.document.y,
            width: tile.document.width,
            height: tile.document.height,
            rotation: tile.document.rotation * (Math.PI / 180)
          },
          ...suffixData
        };
      }
      return null;
    }
    async _findSuffixesForBaseTexture(baseTexturePath) {
      const discoveredPaths = {};
      Object.keys(_TextureAutoLoader.SUFFIX_MAP).forEach((key) => discoveredPaths[key] = null);
      const lastSlash = baseTexturePath.lastIndexOf("/");
      if (lastSlash === -1)
        return discoveredPaths;
      const directoryPath = baseTexturePath.substring(0, lastSlash);
      const filename = baseTexturePath.substring(lastSlash + 1);
      let decodedFilename;
      try {
        decodedFilename = decodeURI(filename);
      } catch (e) {
        decodedFilename = filename;
      }
      const lastDot = decodedFilename.lastIndexOf(".");
      if (lastDot === -1)
        return discoveredPaths;
      const baseName = decodedFilename.substring(0, lastDot);
      const extension = decodedFilename.substring(lastDot);
      if (!baseName || !directoryPath)
        return discoveredPaths;
      let filesInDir = [];
      try {
        const source = game.settings.get("core", "noCanvas") ? "public" : "data";
        filesInDir = (await foundry.applications.apps.FilePicker.implementation.browse(source, directoryPath)).files;
      } catch (e) {
        const readableDir = (() => {
          try {
            return decodeURI(directoryPath);
          } catch {
            return directoryPath;
          }
        })();
        console.warn(`MapShine | Could not browse directory "${readableDir}" for base texture "${baseName}". This is normal for core assets or non-existent paths.`);
        return discoveredPaths;
      }
      for (const [key, suffix] of Object.entries(_TextureAutoLoader.SUFFIX_MAP)) {
        const expectedFilename = `${baseName}${suffix}${extension}`;
        const foundFile = filesInDir.find((fullPath) => {
          const fNameOnly = fullPath.substring(fullPath.lastIndexOf("/") + 1);
          let decodedFNameOnly;
          try {
            decodedFNameOnly = decodeURI(fNameOnly);
          } catch (e) {
            decodedFNameOnly = fNameOnly;
          }
          return decodedFNameOnly.toLowerCase() === expectedFilename.toLowerCase();
        });
        if (foundFile) {
          discoveredPaths[key] = foundFile;
        }
      }
      return discoveredPaths;
    }
  };
  var ScreenEffectsManager = class {
    static _filters = /* @__PURE__ */ new Map();
    static _container = null;
    static initialize(container) {
      if (!this._container) {
        this._container = container;
      }
    }
    static addFilter(key, filter) {
      if (!this._container)
        return;
      this.removeFilter(key);
      this._filters.set(key, filter);
      this._updateContainerFilters();
    }
    static getFilter(key) {
      return this._filters.get(key);
    }
    static removeFilter(key) {
      if (!this._container || !this._filters.has(key))
        return;
      const filter = this._filters.get(key);
      filter?.destroy();
      this._filters.delete(key);
      this._updateContainerFilters();
    }
    static _updateContainerFilters() {
      if (!this._container)
        return;
      const filterClasses = [PrismFilter, HeatDistortionFilter, VignetteFilter, LensDistortionFilter, ChromaticAberrationFilter, ColorCorrectionFilter];
      const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter;
      if (BloomFilterConstructor) {
        filterClasses.push(BloomFilterConstructor);
      }
      const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter;
      if (TiltShiftFilterConstructor) {
        filterClasses.push(TiltShiftFilterConstructor);
      }
      const otherFilters = (this._container.filters || []).filter((f) => !filterClasses.some((cls) => f instanceof cls));
      const newFilters = [
        ...otherFilters,
        ...Array.from(this._filters.values())
      ];
      this._container.filters = newFilters.length > 0 ? newFilters : null;
    }
    static setupAllGlobalFilters() {
      const ppErrors = [];
      const heatErrors = [];
      try {
        this.addFilter("prism", new PrismFilter());
        systemStatus.update("shaders", "prism", {
          state: "ok",
          message: "Compiled successfully."
        });
      } catch (e) {
        console.error("MapShine | Failed to compile PrismFilter", e);
        systemStatus.update("shaders", "prism", {
          state: "error",
          message: `Compilation failed: ${e.message}`
        });
      }
      try {
        this.addFilter("heatDistortion", new HeatDistortionFilter());
      } catch (e) {
        heatErrors.push("HeatDistortion");
        console.error("MapShine | Failed to compile HeatDistortionFilter", e);
      }
      systemStatus.update("shaders", "heat", {
        state: heatErrors.length === 0 ? "ok" : "error",
        message: heatErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${heatErrors.join(", ")}`
      });
      try {
        this.addFilter("vignette", new VignetteFilter());
      } catch (e) {
        ppErrors.push("Vignette");
      }
      try {
        this.addFilter("lensDistortion", new LensDistortionFilter());
      } catch (e) {
        ppErrors.push("LensDistortion");
      }
      try {
        this.addFilter("chromaticAberration", new ChromaticAberrationFilter());
      } catch (e) {
        ppErrors.push("ChromaticAberration (Post)");
      }
      try {
        this.addFilter("colorCorrection", new ColorCorrectionFilter());
      } catch (e) {
        ppErrors.push("ColorCorrection");
      }
      try {
        const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter;
        if (BloomFilterConstructor) {
          const bloomFilter = new BloomFilterConstructor(game.mapShine.profileManager.activeConfig.advancedBloom);
          this.addFilter("advancedBloom", bloomFilter);
          console.log("MapShine | AdvancedBloomFilter created successfully from bundled library.");
        } else {
          const errorMsg = "Could not find PIXI.filters.AdvancedBloomFilter. The bundled script may have failed to load.";
          console.error(`MapShine | ${errorMsg}`);
          ppErrors.push("AdvancedBloom (Bundling Failed)");
        }
      } catch (e) {
        console.error("MapShine | Failed to create AdvancedBloomFilter instance:", e);
        ppErrors.push("AdvancedBloom (Creation Failed)");
      }
      try {
        const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter;
        if (TiltShiftFilterConstructor) {
          const tiltShiftFilter = new TiltShiftFilterConstructor();
          this.addFilter("tiltShift", tiltShiftFilter);
          console.log("MapShine | TiltShiftFilter created successfully from bundled library.");
        } else {
          const errorMsg = "Could not find PIXI.filters.TiltShiftFilter. The bundled script may have failed to load.";
          console.error(`MapShine | ${errorMsg}`);
          ppErrors.push("TiltShift (Bundling Failed)");
        }
      } catch (e) {
        console.error("MapShine | Failed to create TiltShiftFilter instance:", e);
        ppErrors.push("TiltShift (Creation Failed)");
      }
      systemStatus.update("shaders", "postProcessing", {
        state: ppErrors.length === 0 ? "ok" : "error",
        message: ppErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${ppErrors.join(", ")}`
      });
    }
    static updateAllFiltersFromConfig(config) {
      const pp = config.postProcessing;
      const ab = config.advancedBloom;
      const prismFilter = this.getFilter("prism");
      if (prismFilter instanceof PrismFilter) {
        const pConfig = config.prism;
        prismFilter.enabled = config.enabled && pConfig.enabled;
        const u = prismFilter.uniforms;
        u.uIntensity = pConfig.intensity;
        u.uAngleRad = pConfig.angle * (Math.PI / 180);
        u.uThreshold = pConfig.threshold;
        u.uSoftness = pConfig.softness;
        u.uDistortionStrength = pConfig.distortionStrength;
        const screen = canvas?.app?.screen;
        if (screen) {
          u.uTexelSize = [1 / screen.width, 1 / screen.height];
        }
      }
      const advancedBloomFilter = this.getFilter("advancedBloom");
      const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter;
      if (advancedBloomFilter && BloomFilterConstructor && advancedBloomFilter instanceof BloomFilterConstructor) {
        advancedBloomFilter.enabled = config.enabled && pp.enabled && ab.enabled;
        advancedBloomFilter.threshold = ab.threshold;
        advancedBloomFilter.bloomScale = ab.bloomScale;
        advancedBloomFilter.brightness = ab.brightness;
        advancedBloomFilter.blur = ab.blur;
        advancedBloomFilter.quality = ab.quality;
      }
      const tiltShiftFilter = this.getFilter("tiltShift");
      const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter;
      if (tiltShiftFilter && TiltShiftFilterConstructor && tiltShiftFilter instanceof TiltShiftFilterConstructor) {
        const tsConfig = pp.tiltShift;
        tiltShiftFilter.enabled = config.enabled && pp.enabled && tsConfig.enabled;
        tiltShiftFilter.blur = tsConfig.blur;
        tiltShiftFilter.gradientBlur = tsConfig.gradientBlur;
        const screen = canvas.app.screen;
        if (tiltShiftFilter.start) {
          tiltShiftFilter.start.x = tsConfig.startX * screen.width;
          tiltShiftFilter.start.y = tsConfig.startY * screen.height;
        }
        if (tiltShiftFilter.end) {
          tiltShiftFilter.end.x = tsConfig.endX * screen.width;
          tiltShiftFilter.end.y = tsConfig.endY * screen.height;
        }
      }
      const vignetteFilter = this.getFilter("vignette");
      if (vignetteFilter instanceof VignetteFilter) {
        vignetteFilter.enabled = config.enabled && pp.enabled && pp.vignette.enabled;
        vignetteFilter.amount = pp.vignette.amount;
        vignetteFilter.softness = pp.vignette.softness;
      }
      const lensDistortionFilter = this.getFilter("lensDistortion");
      if (lensDistortionFilter instanceof LensDistortionFilter) {
        lensDistortionFilter.enabled = config.enabled && pp.enabled && pp.lensDistortion.enabled;
        lensDistortionFilter.amount = pp.lensDistortion.amount;
        lensDistortionFilter.center = [pp.lensDistortion.centerX, pp.lensDistortion.centerY];
      }
      const caFilter = this.getFilter("chromaticAberration");
      if (caFilter instanceof ChromaticAberrationFilter) {
        caFilter.enabled = config.enabled && pp.enabled && pp.chromaticAberration.enabled;
        caFilter.amount = pp.chromaticAberration.amount;
        caFilter.center = [pp.chromaticAberration.centerX, pp.chromaticAberration.centerY];
      }
      const ccFilter = this.getFilter("colorCorrection");
      if (ccFilter instanceof ColorCorrectionFilter) {
        const ccConfig = pp.colorCorrection;
        ccFilter.enabled = config.enabled && pp.enabled && ccConfig.enabled;
        const u = ccFilter.uniforms;
        u.uSaturation = ccConfig.saturation;
        u.uBrightness = ccConfig.brightness;
        u.uContrast = ccConfig.contrast;
        u.uInvert = ccConfig.invert;
        u.uExposure = ccConfig.exposure;
        u.uGamma = ccConfig.gamma;
        u.uInBlack = ccConfig.levels.inBlack;
        u.uInWhite = ccConfig.levels.inWhite;
        u.uTemperature = ccConfig.whiteBalance.temperature;
        u.uWbTint = ccConfig.whiteBalance.tint;
        u.uTintColor = hexToRgbArray(ccConfig.tint.color);
        u.uTintAmount = ccConfig.tint.amount;
        u.uSelectiveEnabled = ccConfig.selective.enabled;
        u.uSelectiveColor = hexToRgbArray(ccConfig.selective.color);
        u.uSelectiveHueRange = ccConfig.selective.hueRange;
        u.uSelectiveSatRange = ccConfig.selective.saturationRange;
      }
    }
    static tearDown() {
      if (!this._container)
        return;
      this._filters.forEach((filter) => filter.destroy());
      this._filters.clear();
      this._updateContainerFilters();
      this._container = null;
    }
  };
  var NoiseTextureManager = class {
    constructor(renderer, configPath, isWorldSpace = false) {
      this.configPath = configPath;
      this.isWorldSpace = isWorldSpace;
      this._needsUpdate = true;
      const screen = renderer.screen;
      this.renderTexture = PIXI.RenderTexture.create({
        width: screen.width,
        height: screen.height,
        scaleMode: PIXI.SCALE_MODES.LINEAR
      });
      this.renderTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
      this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this.sourceSprite.width = screen.width;
      this.sourceSprite.height = screen.height;
      this.filter = null;
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
      if (!this.renderTexture || !this.sourceSprite)
        return;
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
      const n = foundry.utils.getProperty(config, this.configPath);
      if (!n)
        return;
      if (!this.filter) {
        try {
          const renderer = canvas.app.renderer;
          this.filter = new NoisePatternFilter({
            u_time: 0,
            u_resolution: [renderer.screen.width, renderer.screen.height],
            u_isWorldSpace: this.isWorldSpace
          });
          systemStatus.update("shaders", "noise", {
            state: "ok",
            message: "Compiled successfully."
          });
        } catch (err) {
          console.error("MaterialToolkit | Failed to compile NoisePatternFilter!", err);
          systemStatus.update("shaders", "noise", {
            state: "error",
            message: `Compilation failed: ${err.message}`
          });
          this.filter = null;
          return;
        }
      }
      const u = this.filter.uniforms;
      u.u_speed = n.speed;
      u.u_scale = n.scale;
      u.u_threshold = n.threshold;
      u.u_brightness = n.brightness;
      u.u_contrast = n.contrast;
      u.u_softness = n.softness;
      u.u_evolution = n.evolution ?? 0;
      this.sourceSprite.filters = this.filter ? [this.filter] : [];
      this._needsUpdate = true;
    }
    update(deltaTime, renderer) {
      if (!this.filter || !this.sourceSprite || !this.renderTexture)
        return;
      const n = foundry.utils.getProperty(game.mapShine.profileManager.activeConfig, this.configPath);
      const isAnimated = n && (n.speed !== 0 || n.evolution !== 0);
      if (!this._needsUpdate && !isAnimated)
        return;
      this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + deltaTime;
      if (this.isWorldSpace) {
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({
          x: 0,
          y: 0
        });
        const u = this.filter.uniforms;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
      }
      renderer.render(this.sourceSprite, {
        renderTexture: this.renderTexture,
        clear: true
      });
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
  };
  var LightingMaskFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler; 
            uniform float uLuminanceThreshold;
            uniform float uSoftness;
            uniform bool uInvert;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 lightingColor = texture2D(uSampler, vTextureCoord);
                float lightLevel = dot(lightingColor.rgb, lum_weights);

                float maskAlpha = smoothstep(uLuminanceThreshold, uLuminanceThreshold + uSoftness, lightLevel);

                float finalAlpha = uInvert ? maskAlpha : 1.0 - maskAlpha;

                gl_FragColor = vec4(vec3(finalAlpha), 1.0);
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        uLuminanceThreshold: options.luminanceThreshold ?? 0.25,
        uSoftness: options.softness ?? 0.1,
        uInvert: options.invert ?? false
      });
    }
  };
  var LightingMaskGenerator = class {
    constructor() {
      const screen = canvas.app.screen;
      this.renderTexture = PIXI.RenderTexture.create({
        width: screen.width,
        height: screen.height
      });
      this.maskFilter = new LightingMaskFilter();
      this.sourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
      this.sourceSprite.width = screen.width;
      this.sourceSprite.height = screen.height;
      this.sourceSprite.filters = [this.maskFilter];
    }
    update(renderer, illuminationTexture, threshold, softness, invert) {
      if (!this.sourceSprite || !illuminationTexture)
        return;
      this.sourceSprite.texture = illuminationTexture;
      this.maskFilter.uniforms.uLuminanceThreshold = threshold;
      this.maskFilter.uniforms.uSoftness = softness;
      this.maskFilter.uniforms.uInvert = invert;
      renderer.render(this.sourceSprite, {
        renderTexture: this.renderTexture,
        clear: true
      });
    }
    getMaskTexture() {
      return this.renderTexture;
    }
    resize(width, height) {
      this.renderTexture.resize(width, height);
      this.sourceSprite.width = width;
      this.sourceSprite.height = height;
    }
    destroy() {
      this.renderTexture?.destroy(true);
      this.maskFilter?.destroy();
      this.sourceSprite?.destroy();
      this.renderTexture = this.maskFilter = this.sourceSprite = null;
    }
  };
  var DynamicTokenMaskManager = class {
    constructor(canvas2) {
      this.canvas = canvas2;
      if (!this.canvas?.app?.renderer) {
        console.error("DynamicTokenMaskManager | Cannot initialize without a canvas renderer.");
        return;
      }
      console.log("DynamicTokenMaskManager | Initializing with sprite pooling.");
      const renderer = this.canvas.app.renderer;
      this.renderTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      this.tokenContainer = new PIXI.Container();
      this.tokenSprites = /* @__PURE__ */ new Map();
      this._needsUpdate = true;
      this._destroyed = false;
      this._frameCount = 0;
      this.updateFrequency = 3;
      this._boundOnTokenChange = this._requestUpdate.bind(this);
      Hooks.on("createToken", this._boundOnTokenChange);
      Hooks.on("deleteToken", this._boundOnTokenChange);
      Hooks.on("canvasPan", this._boundOnTokenChange);
      this._boundOnAnimate = () => {
        if (this._destroyed || !this.canvas?.stage?.transform)
          return;
        this._frameCount++;
        const isNthFrame = this._frameCount % this.updateFrequency === 0;
        if (this._needsUpdate || isNthFrame) {
          this.renderMask();
          this._needsUpdate = false;
        }
      };
      this.canvas.app.ticker.add(this._boundOnAnimate);
      this.renderMask();
    }
    _requestUpdate() {
      this._needsUpdate = true;
    }
    renderMask() {
      if (this._destroyed || !this.tokenContainer || !this.canvas?.tokens?.placeables)
        return;
      const renderer = this.canvas.app.renderer;
      const currentTokenIds = /* @__PURE__ */ new Set();
      for (const token of this.canvas.tokens.placeables) {
        if (!token.visible || !token.texture?.valid || token.document.hidden) {
          continue;
        }
        currentTokenIds.add(token.id);
        let sprite = this.tokenSprites.get(token.id);
        if (!sprite) {
          sprite = new PIXI.Sprite(token.texture);
          sprite.tint = 16777215;
          this.tokenSprites.set(token.id, sprite);
          this.tokenContainer.addChild(sprite);
        }
        if (sprite.texture !== token.texture) {
          sprite.texture = token.texture;
        }
        const anchorX = token.document.texture.anchorX ?? 0.5;
        const anchorY = token.document.texture.anchorY ?? 0.5;
        sprite.anchor.set(anchorX, anchorY);
        sprite.position.set(token.center.x, token.center.y);
        sprite.width = token.w;
        sprite.height = token.h;
        sprite.rotation = Math.toRadians(token.document.rotation);
      }
      for (const [tokenId, sprite] of this.tokenSprites.entries()) {
        if (!currentTokenIds.has(tokenId)) {
          sprite.destroy();
          this.tokenSprites.delete(tokenId);
        }
      }
      if (!this.canvas?.stage?.transform)
        return;
      renderer.render(this.tokenContainer, {
        renderTexture: this.renderTexture,
        transform: this.canvas.stage.transform.worldTransform,
        clear: true
      });
    }
    getMaskTexture() {
      return this.renderTexture;
    }
    destroy() {
      if (this._destroyed)
        return;
      this._destroyed = true;
      console.log("DynamicTokenMaskManager | Destroying.");
      Hooks.off("createToken", this._boundOnTokenChange);
      Hooks.off("deleteToken", this._boundOnTokenChange);
      Hooks.off("canvasPan", this._boundOnTokenChange);
      this.canvas.app.ticker.remove(this._boundOnAnimate);
      this.renderTexture?.destroy(true);
      for (const sprite of this.tokenSprites.values()) {
        sprite.destroy();
      }
      this.tokenSprites.clear();
      this.tokenContainer?.destroy({
        children: true
      });
      this.renderTexture = null;
      this.tokenContainer = null;
    }
  };
  var AmbientMaskManager = class {
    constructor(canvas2) {
      console.log("AmbientMaskManager | Initializing.");
      this.canvas = canvas2;
      this.maskGenerator = new LightingMaskGenerator();
      this.maskSprite = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
      this._destroyed = false;
      this._tickerFunction = this.update.bind(this);
      this.canvas.app.ticker.add(this._tickerFunction);
      this._onResizeBound = this._onResize.bind(this);
      window.addEventListener("resize", this._onResizeBound);
    }
    destroy() {
      if (this._destroyed)
        return;
      this._destroyed = true;
      console.log("AmbientMaskManager | Destroying.");
      this.canvas.app.ticker.remove(this._tickerFunction);
      window.removeEventListener("resize", this._onResizeBound);
      const ambientLayer = this.canvas.layers.find((l) => l instanceof AmbientLayer);
      if (ambientLayer) {
        ambientLayer.mask = null;
      }
      this.maskGenerator?.destroy();
      this.maskSprite?.destroy();
    }
    _onResize() {
      if (this.maskGenerator) {
        const screen = this.canvas.app.screen;
        this.maskGenerator.resize(screen.width, screen.height);
      }
      this.update();
    }
    update() {
      if (this._destroyed)
        return;
      const ambientLayer = this.canvas.layers.find((l) => l instanceof AmbientLayer);
      const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
      const mConfig = game.mapShine.profileManager.activeConfig.ambient.masking;
      const shouldBeEnabled = mConfig.enabled && ambientLayer?.visible && !!illuminationAPI;
      if (!shouldBeEnabled) {
        if (ambientLayer && ambientLayer.mask) {
          ambientLayer.mask = null;
        }
        return;
      }
      const illuminationTexture = illuminationAPI.getLightingTexture();
      if (!illuminationTexture?.valid) {
        if (ambientLayer.mask)
          ambientLayer.mask = null;
        return;
      }
      this.maskGenerator.update(
        this.canvas.app.renderer,
        illuminationTexture,
        mConfig.threshold,
        mConfig.softness,
        true
      );
      if (ambientLayer.mask !== this.maskSprite) {
        ambientLayer.mask = this.maskSprite;
      }
      const stage = this.canvas.stage;
      const screen = this.canvas.app.renderer.screen;
      const topLeft = stage.toLocal({
        x: 0,
        y: 0
      });
      this.maskSprite.position.copyFrom(topLeft);
      this.maskSprite.width = screen.width / stage.scale.x;
      this.maskSprite.height = screen.height / stage.scale.y;
    }
  };
  var LightingEffectManager = class {
    constructor(canvas2) {
      console.log("LightingEffectManager | Initializing.");
      this.canvas = canvas2;
      this.maskGenerator = new LightingMaskGenerator();
      this._tickerFunction = this.update.bind(this);
      this.canvas.app.ticker.add(this._tickerFunction);
      this._destroyed = false;
    }
    destroy() {
      if (this._destroyed)
        return;
      this._destroyed = true;
      console.log("LightingEffectManager | Destroying.");
      this.canvas.app.ticker.remove(this._tickerFunction);
      this.maskGenerator?.destroy();
    }
    update() {
      if (this._destroyed)
        return;
      const config = game.mapShine.profileManager.activeConfig.postProcessing.colorCorrection;
      const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
      const ccFilter = ScreenEffectsManager.getFilter("colorCorrection");
      if (!ccFilter)
        return;
      const u = ccFilter.uniforms;
      const useIllumMask = config.mask.enabled && !!illuminationAPI;
      u.uMaskEnabled = useIllumMask;
      if (useIllumMask) {
        this.maskGenerator.update(
          this.canvas.app.renderer,
          illuminationAPI.getLightingTexture(),
          config.mask.luminanceThreshold,
          config.mask.softness,
          config.mask.invert
        );
        u.uMaskTexture = this.maskGenerator.getMaskTexture();
      }
      const cloudLayer = this.canvas.layers.find((l) => l instanceof CloudShadowsLayer);
      u.uCloudHighlightsEnabled = config.highlightCloud.enabled && !!cloudLayer?.visible;
      if (u.uCloudHighlightsEnabled) {
        u.uCloudHighlightsMask = cloudLayer.getHighlightMaskTexture();
        u.uCloudHighlightsBrightness = config.highlightCloud.brightness;
      }
      const canopyLayer = this.canvas.layers.find((l) => l instanceof CanopyLayer);
      const canopyMask = canopyLayer?.getMaskTexture();
      u.uCanopyHighlightsEnabled = config.highlightCanopy.enabled && !!canopyLayer?.visible && !!canopyMask?.valid;
      if (u.uCanopyHighlightsEnabled) {
        u.uCanopyHighlightsMask = canopyMask;
        u.uCanopyHighlightsBrightness = config.highlightCanopy.brightness;
        const outdoorsMask = canopyLayer.outdoorsMaskTexture;
        u.uCanopyOutdoorsMaskEnabled = !!outdoorsMask?.valid;
        if (u.uCanopyOutdoorsMaskEnabled) {
          u.uCanopyOutdoorsMask = outdoorsMask;
        }
      } else {
        u.uCanopyOutdoorsMaskEnabled = false;
      }
      const structuralLayer = this.canvas.layers.find((l) => l instanceof StructuralShadowsLayer);
      const structuralFilter = structuralLayer?.structuralFilter;
      const structuralHighlightMask = structuralLayer?.getHighlightMaskTexture();
      u.uStructuralHighlightsEnabled = config.highlightStructural.enabled && !!structuralHighlightMask?.valid;
      if (u.uStructuralHighlightsEnabled && structuralFilter) {
        u.uStructuralHighlightsMask = structuralHighlightMask;
        u.uStructuralHighlightsBrightness = config.highlightStructural.brightness;
        const isSplitEnabled = structuralLayer.isRgbSplitEnabled();
        u.uStructuralSplitHighlightsEnabled = isSplitEnabled;
        if (isSplitEnabled) {
          u.uStructuralSplitHighlightsMask = structuralLayer.getSplitHighlightMaskTexture();
        }
        const outdoorsMask = structuralLayer.outdoorsMaskTexture;
        u.uStructuralOutdoorsMaskEnabled = !!outdoorsMask?.valid;
        if (u.uStructuralOutdoorsMaskEnabled) {
          u.uStructuralOutdoorsMask = outdoorsMask;
        }
        const sf_u = structuralFilter.uniforms;
        u.uStructuralParallaxEnabled = true;
        u.uStructuralParallaxAmount = sf_u.u_parallax;
        u.uStructuralSceneRect = sf_u.u_scene_rect;
        u.uStructuralCameraOffset = sf_u.u_camera_offset;
        u.uStructuralViewSize = sf_u.u_view_size;
      } else {
        u.uStructuralOutdoorsMaskEnabled = false;
        u.uStructuralParallaxEnabled = false;
        u.uStructuralSplitHighlightsEnabled = false;
      }
    }
  };
  var NoisePatternFilter = class extends PIXI.Filter {
    constructor(options) {
      const fragmentSrc = `
            precision mediump float; 
            varying vec2 vTextureCoord;

            uniform float u_time; 
            uniform vec2 u_resolution;
            uniform float u_speed, u_scale, u_threshold, u_brightness, u_contrast, u_softness;
            uniform float u_evolution;
            
            // New uniforms for world-space mode
            uniform bool u_isWorldSpace;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            float random(vec3 st) { 
                return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.731))) * 43758.5453123); 
            }

            float value_noise(vec3 st) {
                vec3 i = floor(st); 
                vec3 f = fract(st); 

                float a = random(i + vec3(0.0, 0.0, 0.0));
                float b = random(i + vec3(1.0, 0.0, 0.0));
                float c = random(i + vec3(0.0, 1.0, 0.0));
                float d = random(i + vec3(1.0, 1.0, 0.0));
                float e = random(i + vec3(0.0, 0.0, 1.0));
                float f_ = random(i + vec3(1.0, 0.0, 1.0));
                float g = random(i + vec3(0.0, 1.0, 1.0));
                float h = random(i + vec3(1.0, 1.0, 1.0));

                vec3 u = f * f * (3.0 - 2.0 * f);

                float bottom_x = mix(a, b, u.x);
                float top_x = mix(c, d, u.x);
                float bottom_face_mix = mix(bottom_x, top_x, u.y);

                float bottom_x_top = mix(e, f_, u.x);
                float top_x_top = mix(g, h, u.x);
                float top_face_mix = mix(bottom_x_top, top_x_top, u.y);

                return mix(bottom_face_mix, top_face_mix, u.z);
            }

            void main() {
                vec2 uv;
                if (u_isWorldSpace) {
                    vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                    // Use a large divisor to keep the user-facing scale value in a reasonable range (e.g., 0.1-10)
                    uv = world_coord * u_scale / 1000.0;
                } else {
                    // Original screen-space calculation
                    vec2 screen_pixel_coord = vTextureCoord * u_resolution;
                    vec2 screen_center_pixel_coord = u_resolution * 0.5;
                    uv = (screen_pixel_coord - screen_center_pixel_coord) * u_scale / 30.0;
                }
                
                uv.x += u_time * u_speed;
                float time_z = u_time * u_evolution;
                float noise = value_noise(vec3(uv, time_z));

                noise += u_brightness;
                noise = (noise - 0.5) * u_contrast + 0.5;
                noise = smoothstep(u_threshold, u_threshold + u_softness, noise);
                gl_FragColor = vec4(vec3(clamp(noise, 0.0, 1.0)), 1.0);
            }
        `;
      const newOptions = {
        ...options,
        u_evolution: options.u_evolution ?? 0,
        u_isWorldSpace: options.u_isWorldSpace ?? false,
        u_camera_offset: options.u_camera_offset ?? [0, 0],
        u_view_size: options.u_view_size ?? [0, 0]
      };
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, newOptions);
    }
  };
  var ColorCorrectionFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D uMaskTexture;

            uniform sampler2D uAmbientCompositeTexture;
            uniform bool uAmbientCompositeEnabled;
            uniform int uAmbientCompositeBlendMode;

            uniform sampler2D uAmbientIlluminationMask;
            uniform bool uAmbientIlluminationMaskEnabled;

            uniform float uSaturation, uBrightness, uContrast;
            uniform float uExposure, uGamma, uInBlack, uInWhite;
            uniform float uTemperature, uWbTint;
            uniform bool uInvert;
            uniform vec3 uTintColor;
            uniform float uTintAmount;
            uniform bool uMaskEnabled;
            uniform bool uSelectiveEnabled;
            uniform vec3 uSelectiveColor;
            uniform float uSelectiveHueRange, uSelectiveSatRange;

            uniform bool uCloudHighlightsEnabled;
            uniform sampler2D uCloudHighlightsMask;
            uniform float uCloudHighlightsBrightness;

            uniform bool uCanopyHighlightsEnabled;
            uniform sampler2D uCanopyHighlightsMask;
            uniform float uCanopyHighlightsBrightness;
            uniform sampler2D uCanopyOutdoorsMask;
            uniform bool uCanopyOutdoorsMaskEnabled;

            uniform bool uStructuralHighlightsEnabled;
            uniform sampler2D uStructuralHighlightsMask;
            uniform float uStructuralHighlightsBrightness;
            uniform sampler2D uStructuralOutdoorsMask;
            uniform bool uStructuralOutdoorsMaskEnabled;
            
            // New uniforms for structural highlight parallax
            uniform bool uStructuralParallaxEnabled;
            uniform float uStructuralParallaxAmount;
            uniform vec4 uStructuralSceneRect;
            uniform vec2 uStructuralCameraOffset;
            uniform vec2 uStructuralViewSize;

            // New uniforms for Structural RGB Split
            uniform bool uStructuralSplitHighlightsEnabled;
            uniform sampler2D uStructuralSplitHighlightsMask;


            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            vec3 rgb2hsl(vec3 c) {
                float max_c = max(max(c.r, c.g), c.b);
                float min_c = min(min(c.r, c.g), c.b);
                float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                if (max_c != min_c) {
                    float d = max_c - min_c;
                    s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                    if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                    else if (max_c == c.g) h = (c.b - c.r) / d + 2.0;
                    else h = (c.r - c.g) / d + 4.0;
                    h /= 6.0;
                }
                return vec3(h, s, l);
            }

            vec3 applyWhiteBalance(vec3 color, float temp, float green_tint) {
                color.r += temp * 0.15;
                color.b -= temp * 0.15;
                color.g += green_tint * 0.15;
                return color;
            }

            void main(void) {
                vec4 originalColor = texture2D(uSampler, vTextureCoord);

                vec3 workingColor = originalColor.rgb;
                if (originalColor.a > 0.0) {
                    workingColor /= originalColor.a;
                }

                vec3 uncorrectedColor = workingColor; 

                if (uSelectiveEnabled) {
                    vec3 pixel_hsl = rgb2hsl(workingColor);
                    vec3 target_hsl = rgb2hsl(uSelectiveColor);
                    float hue_dist = min(abs(pixel_hsl.x - target_hsl.x), 1.0 - abs(pixel_hsl.x - target_hsl.x));
                    if (hue_dist > uSelectiveHueRange || abs(pixel_hsl.y - target_hsl.y) > uSelectiveSatRange) {
                        workingColor = vec3(dot(workingColor, lum_weights));
                    }
                }

                if (uInWhite > uInBlack) workingColor = (workingColor - uInBlack) / (uInWhite - uInBlack);
                workingColor *= pow(2.0, uExposure);
                workingColor = applyWhiteBalance(workingColor, uTemperature, uWbTint);
                if (uGamma > 0.0) workingColor = pow(workingColor, vec3(1.0 / uGamma));
                workingColor += uBrightness;
                workingColor = (workingColor - 0.5) * uContrast + 0.5;
                float final_luminance = dot(workingColor, lum_weights);
                workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                workingColor = mix(workingColor, uTintColor, uTintAmount);
                if (uInvert) workingColor = 1.0 - workingColor;

                vec3 final_rgb = workingColor;

                if (uMaskEnabled) {
                    float maskValue = texture2D(uMaskTexture, vTextureCoord).r;
                    final_rgb = mix(uncorrectedColor, workingColor, maskValue);
                }

                if (uCloudHighlightsEnabled) {
                    float lightAmount = texture2D(uCloudHighlightsMask, vTextureCoord).r;
                    final_rgb *= (1.0 + uCloudHighlightsBrightness * lightAmount);
                }
                if (uCanopyHighlightsEnabled) {
                    float lightAmount = texture2D(uCanopyHighlightsMask, vTextureCoord).r;
                    if (uCanopyOutdoorsMaskEnabled) {
                        lightAmount *= texture2D(uCanopyOutdoorsMask, vTextureCoord).r;
                    }
                    final_rgb *= (1.0 + uCanopyHighlightsBrightness * lightAmount);
                }
                
                if (uStructuralHighlightsEnabled) {
                    vec2 highlightTexCoord = vTextureCoord;

                    // Apply parallax to the highlight mask sampling if enabled
                    if ( uStructuralParallaxEnabled && uStructuralViewSize.y > 0.0) {
                        vec2 camera_center_world = uStructuralCameraOffset + (uStructuralViewSize * 0.5);
                        vec2 scene_center_world = uStructuralSceneRect.xy + (uStructuralSceneRect.zw * 0.5);
                        vec2 offset_from_center = camera_center_world - scene_center_world;
                        vec2 parallax_uv_offset = (offset_from_center / uStructuralViewSize) * uStructuralParallaxAmount;
                        highlightTexCoord = vTextureCoord - parallax_uv_offset;
                    }

                    if (uStructuralSplitHighlightsEnabled) {
                        vec3 splitLight = texture2D(uStructuralSplitHighlightsMask, highlightTexCoord).rgb;
                        if (uStructuralOutdoorsMaskEnabled) {
                           splitLight *= (1.0 - texture2D(uStructuralOutdoorsMask, vTextureCoord).r);
                        }
                        vec3 highlightBoost = splitLight * uStructuralHighlightsBrightness;
                        final_rgb *= (vec3(1.0) + highlightBoost);

                    } else {
                        float lightAmount = texture2D(uStructuralHighlightsMask, highlightTexCoord).r;
                        if (uStructuralOutdoorsMaskEnabled) {
                            lightAmount *= (1.0 - texture2D(uStructuralOutdoorsMask, vTextureCoord).r);
                        }
                        final_rgb *= (1.0 + uStructuralHighlightsBrightness * lightAmount);
                    }
                }

                if (uAmbientCompositeEnabled) {
                    vec4 ambient = texture2D(uAmbientCompositeTexture, vTextureCoord);
                    if (ambient.a > 0.0) {

                        float lightMask = 1.0;
                        if (uAmbientIlluminationMaskEnabled) {
                            lightMask = dot(texture2D(uAmbientIlluminationMask, vTextureCoord).rgb, lum_weights);
                        }

                        vec3 ambientRGB = (ambient.rgb / ambient.a) * lightMask;

                        if (uAmbientCompositeBlendMode == 1) { 
                            final_rgb += ambientRGB;
                        } else if (uAmbientCompositeBlendMode == 2) { 
                            final_rgb *= ambientRGB;
                        } else if (uAmbientCompositeBlendMode == 3) { 
                             final_rgb = 1.0 - (1.0 - final_rgb) * (1.0 - ambientRGB);
                        } else { 
                            final_rgb = mix(final_rgb, ambientRGB, ambient.a);
                        }
                    }
                }

                vec3 premultiplied_rgb = clamp(final_rgb, 0.0, 1.0) * originalColor.a;
                gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        uSaturation: 1,
        uBrightness: 0,
        uContrast: 1,
        uExposure: 0,
        uGamma: 1,
        uInBlack: 0,
        uInWhite: 1,
        uTemperature: 0,
        uWbTint: 0,
        uInvert: false,
        uTintColor: [1, 1, 1],
        uTintAmount: 0,
        uMaskTexture: PIXI.Texture.EMPTY,
        uMaskEnabled: false,
        uSelectiveEnabled: false,
        uSelectiveColor: [1, 0, 0],
        uSelectiveHueRange: 0.1,
        uSelectiveSatRange: 0.4,
        uAmbientCompositeTexture: PIXI.Texture.EMPTY,
        uAmbientCompositeEnabled: false,
        uAmbientCompositeBlendMode: PIXI.BLEND_MODES.NORMAL,
        uAmbientIlluminationMask: PIXI.Texture.EMPTY,
        uAmbientIlluminationMaskEnabled: false,
        uCloudHighlightsEnabled: false,
        uCloudHighlightsMask: PIXI.Texture.EMPTY,
        uCloudHighlightsBrightness: 0,
        uCanopyHighlightsEnabled: false,
        uCanopyHighlightsMask: PIXI.Texture.EMPTY,
        uCanopyHighlightsBrightness: 0,
        uCanopyOutdoorsMask: PIXI.Texture.EMPTY,
        uCanopyOutdoorsMaskEnabled: false,
        uStructuralHighlightsEnabled: false,
        uStructuralHighlightsMask: PIXI.Texture.EMPTY,
        uStructuralHighlightsBrightness: 0,
        uStructuralOutdoorsMask: PIXI.Texture.EMPTY,
        uStructuralOutdoorsMaskEnabled: false,
        uStructuralSplitHighlightsEnabled: false,
        uStructuralSplitHighlightsMask: PIXI.Texture.EMPTY,
        uStructuralParallaxEnabled: false,
        uStructuralParallaxAmount: 0,
        uStructuralSceneRect: [0, 0, 1, 1],
        uStructuralCameraOffset: [0, 0],
        uStructuralViewSize: [1, 1]
      });
    }
    get saturation() {
      return this.uniforms.uSaturation;
    }
    set saturation(v) {
      this.uniforms.uSaturation = v;
    }
    get brightness() {
      return this.uniforms.uBrightness;
    }
    set brightness(v) {
      this.uniforms.uBrightness = v;
    }
    get contrast() {
      return this.uniforms.uContrast;
    }
    set contrast(v) {
      this.uniforms.uContrast = v;
    }
  };
  var VignetteFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform float u_softness;
            void main(void) {
                if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec4 color = texture2D(uSampler, vTextureCoord);
                float dist = distance(vTextureCoord, vec2(0.5));
                float start = u_softness - 0.15;
                float end = u_softness + 0.15;
                float falloff = smoothstep(start, end, dist);
                color.rgb *= (1.0 - (u_amount * falloff));
                gl_FragColor = color;
            }
        `, {
        u_amount: options.amount ?? 0.5,
        u_softness: options.softness ?? 0.5
      });
    }
    get amount() {
      return this.uniforms.u_amount;
    }
    set amount(v) {
      this.uniforms.u_amount = v;
    }
    get softness() {
      return this.uniforms.u_softness;
    }
    set softness(v) {
      this.uniforms.u_softness = v;
    }
  };
  var LensDistortionFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
            void main(void) {
                if (u_amount == 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec2 D = vTextureCoord - u_center;
                float r = length(D);
                vec2 distorted_coord = u_center + D * (1.0 + u_amount * r * r);
                gl_FragColor = texture2D(uSampler, distorted_coord);
            }
        `, {
        u_amount: options.amount ?? 0,
        u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5]
      });
    }
    get amount() {
      return this.uniforms.u_amount;
    }
    set amount(v) {
      this.uniforms.u_amount = v;
    }
    get center() {
      return this.uniforms.u_center;
    }
    set center(v) {
      this.uniforms.u_center = v;
    }
  };
  var ChromaticAberrationFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
            void main(void) {
                if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec2 offset = (vTextureCoord - u_center) * u_amount;
                float r = texture2D(uSampler, vTextureCoord - offset).r;
                float g = texture2D(uSampler, vTextureCoord).g;
                float b = texture2D(uSampler, vTextureCoord + offset).b;
                float a = texture2D(uSampler, vTextureCoord).a;
                gl_FragColor = vec4(r, g, b, a);
            }
        `, {
        u_amount: options.amount ?? 0,
        u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5]
      });
    }
    get amount() {
      return this.uniforms.u_amount;
    }
    set amount(v) {
      this.uniforms.u_amount = v;
    }
    get center() {
      return this.uniforms.u_center;
    }
    set center(v) {
      this.uniforms.u_center = v;
    }
  };
  var PrismFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D uPrismMask;
            uniform sampler2D uDistortionMap;

            uniform float uIntensity;
            uniform float uAngleRad;
            uniform float uThreshold;
            uniform float uSoftness;
            uniform float uDistortionStrength;
            uniform vec2 uTexelSize;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                float maskValue = texture2D(uPrismMask, vTextureCoord).r;
                if (maskValue < 0.01) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }

                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                float luminance = dot(originalColor.rgb, lum_weights);
                float effectVisibility = smoothstep(uThreshold, uThreshold + uSoftness, luminance);
                if (effectVisibility < 0.01) {
                    gl_FragColor = originalColor;
                    return;
                }

                vec2 distortionVec = (texture2D(uDistortionMap, vTextureCoord).rg - 0.5) * 2.0;
                vec2 splitDirection = vec2(cos(uAngleRad), sin(uAngleRad));
                vec2 finalOffset = (splitDirection + distortionVec * uDistortionStrength) * uIntensity * uTexelSize;
                
                float r = texture2D(uSampler, vTextureCoord - finalOffset).r;
                float g = originalColor.g;
                float b = texture2D(uSampler, vTextureCoord + finalOffset).b;
                
                vec3 splitColor = vec3(r, g, b);
                float blendAmount = maskValue * effectVisibility;
                vec3 finalColor = mix(originalColor.rgb, splitColor, blendAmount);
                
                gl_FragColor = vec4(finalColor, originalColor.a);
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        uPrismMask: PIXI.Texture.EMPTY,
        uDistortionMap: PIXI.Texture.EMPTY,
        uIntensity: options.intensity ?? 5,
        uAngleRad: (options.angle ?? 45) * (Math.PI / 180),
        uThreshold: options.threshold ?? 0.85,
        uSoftness: options.softness ?? 0.1,
        uDistortionStrength: options.distortionStrength ?? 2,
        uTexelSize: options.texelSize ?? [1 / (window.innerWidth || 1), 1 / (window.innerHeight || 1)]
      });
    }
  };
  var ParticleMaskFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D uMaskTexture;

            uniform float uLuminanceThreshold;
            uniform float uInfluence;

            void main(void) {
                vec4 particleColor = texture2D(uSampler, vTextureCoord);
                if (particleColor.a < 0.01) {
                    discard;
                }

                float maskValue = texture2D(uMaskTexture, vTextureCoord).r;
                
                float visibility = smoothstep(uLuminanceThreshold, uLuminanceThreshold + 0.05, maskValue);

                particleColor.a *= visibility;

                float brightnessMultiplier = 1.0 + (visibility * uInfluence);
                particleColor.rgb *= brightnessMultiplier;

                gl_FragColor = particleColor;
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        uMaskTexture: options.maskTexture || PIXI.Texture.EMPTY,
        uLuminanceThreshold: options.luminanceThreshold ?? 0.5,
        uInfluence: options.influence ?? 1
      });
    }
  };
  var MaskedEffectLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor(options) {
      super();
      this.options = options;
      this.maskContainer = null;
      this.combinedMaskTexture = null;
      this.maskSprites = /* @__PURE__ */ new Map();
      this._needsMaskUpdate = true;
      this._destroyed = false;
      this.bounds = this._getBounds();
      this._onAnimateBound = null;
      this._onResizeBound = null;
      this._onPanBound = null;
    }
    _getBounds() {
      if (canvas?.scene?.dimensions?.sceneRect) {
        return canvas.scene.dimensions.sceneRect;
      }
      return new PIXI.Rectangle(0, 0, 1, 1);
    }
    getMaskTexture() {
      return this.combinedMaskTexture;
    }
    computeUnionBounds() {
      const activeMaskSprites = Array.from(this.maskSprites.values()).filter((s) => s.texture?.valid);
      if (activeMaskSprites.length === 0)
        return null;
      let union = activeMaskSprites[0].getBounds().clone();
      for (let i = 1; i < activeMaskSprites.length; i++) {
        union.enlarge(activeMaskSprites[i].getBounds());
      }
      return union;
    }
    async _draw(options) {
      this._destroyed = false;
      this._needsMaskUpdate = true;
      this.bounds = this._getBounds();
      this._onAnimateBound = this._onAnimate.bind(this);
      this._onResizeBound = this._onResize.bind(this);
      this._onPanBound = this._onPan.bind(this);
      const renderer = canvas.app.renderer;
      this.maskContainer = new PIXI.Container();
      this.combinedMaskTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      canvas.app.ticker.add(this._onAnimateBound);
      window.addEventListener("resize", this._onResizeBound);
      if (!game.modules.get("libwrapper")?.active) {
        Hooks.on("canvasPan", this._onPanBound);
      }
    }
    /**
     * @override
     */
    async _tearDown(options) {
      if (this._destroyed)
        return;
      this._destroyed = true;
      if (this._onAnimateBound)
        canvas.app.ticker.remove(this._onAnimateBound);
      if (this._onResizeBound)
        window.removeEventListener("resize", this._onResizeBound);
      if (this._onPanBound)
        Hooks.off("canvasPan", this._onPanBound);
      this.combinedMaskTexture?.destroy(true);
      this.maskContainer?.destroy({ children: true, texture: true, baseTexture: true });
      this.maskSprites.clear();
      this.combinedMaskTexture = null;
      this.maskContainer = null;
      return super._tearDown(options);
    }
    /**
     * Base animation loop. Handles re-rendering the mask when needed.
     * Subclasses should call `super._onAnimate(deltaTime)` at the start of their own loop.
     */
    _onAnimate(deltaTime) {
      if (this._destroyed)
        return;
      if (this._needsMaskUpdate) {
        this.renderMask();
        this._needsMaskUpdate = false;
      }
    }
    /**
     * Handles pan events, flagging that the mask needs to be redrawn.
     */
    _onPan() {
      this._needsMaskUpdate = true;
    }
    /**
     * Handles resize events, resizing the mask texture and flagging a redraw.
     */
    _onResize() {
      const renderer = canvas.app.renderer;
      this.combinedMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
      this._needsMaskUpdate = true;
    }
    /**
     * Renders the maskContainer to the combinedMaskTexture.
     */
    renderMask() {
      if (!this.maskContainer || !this.combinedMaskTexture)
        return;
      canvas.app.renderer.render(this.maskContainer, {
        renderTexture: this.combinedMaskTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: true
      });
    }
    /**
     * @override
     * Updates the sprites in the mask container based on discovered effect targets.
     */
    async updateEffectTargets(targets) {
      if (!this.maskContainer)
        return;
      const maskSuffix = this.options.maskSuffix;
      if (!maskSuffix) {
        console.warn("MaskedEffectLayer | No 'maskSuffix' provided in options.");
        return;
      }
      const validTargetIds = /* @__PURE__ */ new Set();
      const allTargets = new Map([
        ["background", targets.background],
        ...targets.tiles.entries()
      ]);
      for (const [id, targetData] of allTargets.entries()) {
        const texturePath = targetData?.[maskSuffix];
        if (!texturePath)
          continue;
        validTargetIds.add(id);
        let sprite = this.maskSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.maskSprites.set(id, sprite);
          this.maskContainer.addChild(sprite);
        }
        await this._updateSpriteTransform(sprite, texturePath, targetData.rect);
      }
      for (const [id, sprite] of this.maskSprites.entries()) {
        if (!validTargetIds.has(id)) {
          sprite.destroy();
          this.maskSprites.delete(id);
        }
      }
      this._needsMaskUpdate = true;
    }
    /**
     * Helper to update a sprite's texture and transform.
     */
    async _updateSpriteTransform(sprite, texturePath, rect) {
      const currentPath = sprite.texture?.baseTexture?.resource?.src;
      if (texturePath !== currentPath) {
        try {
          sprite.texture = await foundry.canvas.loadTexture(texturePath);
        } catch (e) {
          sprite.texture = PIXI.Texture.EMPTY;
        }
      }
      if (!sprite.texture.valid || !rect)
        return;
      sprite.anchor.set(0.5);
      sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
      sprite.width = rect.width;
      sprite.height = rect.height;
      sprite.rotation = rect.rotation || 0;
    }
  };
  var BackgroundLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor() {
      super();
      this.effectSprites = /* @__PURE__ */ new Map();
      this._onResizeBound = this._onResize.bind(this);
    }
    async _draw(options) {
      console.log("BackgroundLayer | Drawing layer.");
      this.container = new PIXI.Container();
      this.addChild(this.container);
      window.addEventListener("resize", this._onResizeBound);
    }
    async updateEffectTargets(targets) {
      const validTargetIds = /* @__PURE__ */ new Set();
      const allTargets = new Map([
        ["background", targets.background],
        ...targets.tiles.entries()
      ]);
      for (const [id, targetData] of allTargets.entries()) {
        if (!targetData?.baseTexturePath)
          continue;
        validTargetIds.add(id);
        let sprite = this.effectSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.effectSprites.set(id, sprite);
          this.container.addChild(sprite);
        }
        await this._updateSpriteTransform(sprite, targetData.baseTexturePath, targetData.rect);
      }
      for (const [id, sprite] of this.effectSprites.entries()) {
        if (!validTargetIds.has(id)) {
          sprite.destroy();
          this.effectSprites.delete(id);
        }
      }
    }
    async _updateSpriteTransform(sprite, texturePath, rect) {
      const currentPath = sprite.texture?.baseTexture?.resource?.src;
      if (texturePath !== currentPath) {
        try {
          sprite.texture = await foundry.canvas.loadTexture(texturePath);
        } catch (e) {
          sprite.texture = PIXI.Texture.EMPTY;
        }
      }
      if (!sprite.texture.valid || !rect)
        return;
      sprite.anchor.set(0.5);
      sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
      sprite.width = rect.width;
      sprite.height = rect.height;
      sprite.rotation = rect.rotation || 0;
    }
    _onResize() {
      if (game.mapShine?.effectTargetManager?.targets) {
        this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
      }
    }
    _tearDown(options) {
      console.log("BackgroundLayer | Tearing down layer.");
      window.removeEventListener("resize", this._onResizeBound);
      this.container?.destroy({
        children: true
      });
      this.effectSprites.clear();
      this.container = null;
    }
  };
  var ShinePatternFilter = class extends PIXI.Filter {
    constructor(options) {
      super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D u_noiseMap;

            uniform float u_time;
            uniform vec2 u_resolution; 

            // Parallax & Transform Uniforms
            uniform float u_parallaxAmount; 
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            uniform float u_globalIntensity;
            uniform float u_shared_maxBrightness;
            uniform float u_shared_patternScale;

            uniform bool u_noise_enabled;
            uniform bool u_s1_enabled, u_s2_enabled;
            uniform float u_s1_speed, u_s1_intensity, u_s1_angle_rad, u_s1_sharpness, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp;
            uniform float u_s2_speed, u_s2_intensity, u_s2_angle_rad, u_s2_sharpness, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp;

            const float PI = 3.14159265359;
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

            float createStripeLayer(vec2 uv, float t, float angle, float density, float width, float sub_count, float sub_sharp, float sharp) {
                float p_perp = uv.x * cos(angle) + uv.y * sin(angle); 
                float band_coord = p_perp * density;
                float band_id = floor(band_coord); 
                float in_band_pos = fract(band_coord);

                float result = 0.0;
                if (in_band_pos <= width) {
                    float r1 = random(vec2(band_id)); 
                    float r2 = random(vec2(band_id, r1)); 
                    float r3 = random(vec2(r1, r2));
                    float num_sub = 2.0 + r1 * sub_count; 
                    float sub_stripe_s = 1.0 + r2 * sub_sharp; 
                    float sub_stripe_b = 0.5 + r3 * 0.5;
                    float sub_wave = (cos(in_band_pos * (num_sub / width) * 2.0 * PI + t) + 1.0) * 0.5;
                    sub_wave = pow(sub_wave, sub_stripe_s) * sub_stripe_b;
                    result = sub_wave * pow(sin((in_band_pos / width) * PI), sharp);
                }
                return result;
            }

            void main() {
                // Calculate world-space coordinates (fixed to the map)
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);

                // Calculate screen-space coordinates (fixed to the camera/screen)
                vec2 screen_coord = vTextureCoord * u_resolution - (u_resolution * 0.5);

                // Blend between world and screen space based on the parallax amount
                vec2 mixed_coords = mix(world_coord, screen_coord, u_parallaxAmount);

                // Apply the user-controlled pattern scale to the final mixed coordinates
                vec2 pattern_uv = mixed_coords * u_shared_patternScale / 80.0;
                
                float pattern1 = u_s1_enabled ? createStripeLayer(pattern_uv, u_time * u_s1_speed, u_s1_angle_rad, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp, u_s1_sharpness) * u_s1_intensity : 0.0;
                float pattern2 = u_s2_enabled ? createStripeLayer(pattern_uv, u_time * u_s2_speed, u_s2_angle_rad, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp, u_s2_sharpness) * u_s2_intensity : 0.0;

                float noise_mask = u_noise_enabled ? texture2D(u_noiseMap, vTextureCoord).r : 1.0; 
                float shineIntensity = max(pattern1, pattern2) * u_shared_maxBrightness * u_globalIntensity * noise_mask;

                vec3 final_rgb = vec3(1.0) * shineIntensity;
                gl_FragColor = vec4(final_rgb, 1.0);
            }
        `, {
        ...options
      });
    }
  };
  var MetallicShineFilter = class extends PIXI.Filter {
    constructor(options) {
      const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat3 projectionMatrix;

            varying vec2 vTextureCoord; 
            varying vec2 vScreenCoord;  

            void main(void)
            {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }
        `;
      const fragmentSrc = `
            precision mediump float;

            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            // Samplers
            uniform sampler2D uSampler;
            uniform sampler2D uShinePatternMap;

            // Base Shine Uniforms
            uniform float uBoost;

            // Color Correction Uniforms
            uniform bool uCCEnabled;
            uniform float uSaturation, uBrightness, uContrast;
            uniform float uExposure, uGamma, uInBlack, uInWhite;
            uniform vec3 uTintColor;
            uniform float uTintAmount;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 specularColor = texture2D(uSampler, vTextureCoord);
                float specularLuminance = dot(specularColor.rgb, lum_weights);

                if (specularColor.a < 0.1 || specularLuminance < 0.01) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                // 1. Get the raw animated shine pattern intensity
                float shinePatternIntensity = texture2D(uShinePatternMap, vScreenCoord).r;

                // 2. Start with the boosted pattern as the base color to be corrected
                vec3 workingColor = vec3(shinePatternIntensity * uBoost);

                // 3. If enabled, apply the full color correction pass to the shine itself
                if (uCCEnabled) {
                    // Apply Levels
                    if (uInWhite > uInBlack) {
                        workingColor = (workingColor - uInBlack) / (uInWhite - uInBlack);
                    }
                    
                    // Apply Exposure
                    workingColor *= pow(2.0, uExposure);

                    // Apply Gamma
                    if (uGamma > 0.0) {
                        workingColor = pow(workingColor, vec3(1.0 / uGamma));
                    }
                    
                    // Apply Brightness & Contrast
                    workingColor += uBrightness;
                    workingColor = (workingColor - 0.5) * uContrast + 0.5;

                    // Apply Saturation
                    float luminance = dot(workingColor, lum_weights);
                    workingColor = mix(vec3(luminance), workingColor, uSaturation);

                    // Apply Tint
                    workingColor = mix(workingColor, uTintColor, uTintAmount);
                }

                // 4. Use the specular map's luminance to mask the color-corrected shine
                vec3 finalColor = workingColor * specularLuminance;

                finalColor = clamp(finalColor, 0.0, 1.0);

                // The final alpha is based on the original pattern intensity and the specular map's alpha
                gl_FragColor = vec4(finalColor, shinePatternIntensity * specularColor.a);
            }
        `;
      super(vertexSrc, fragmentSrc, {
        uShinePatternMap: options.shinePatternTexture,
        uBoost: options.boost ?? 1,
        uCCEnabled: options.uCCEnabled ?? true,
        uSaturation: options.uSaturation ?? 1,
        uBrightness: options.uBrightness ?? 0,
        uContrast: options.uContrast ?? 1,
        uExposure: options.uExposure ?? 0,
        uGamma: options.uGamma ?? 1,
        uInBlack: options.uInBlack ?? 0,
        uInWhite: options.uInWhite ?? 1,
        uTintColor: options.uTintColor ?? [1, 1, 1],
        uTintAmount: options.uTintAmount ?? 0
      });
    }
  };
  var ThresholdFilter = class extends PIXI.Filter {
    constructor(threshold = 0.5) {
      super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_threshold;
            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                if (brightness < u_threshold) { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); }
                else { gl_FragColor = color; }
            }
        `, {
        u_threshold: threshold
      });
    }
    get threshold() {
      return this.uniforms.u_threshold;
    }
    set threshold(value) {
      this.uniforms.u_threshold = value;
    }
  };
  var StarburstFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;

            uniform float u_threshold;
            uniform float u_intensity;
            uniform float u_angle_rad;
            uniform int u_points;
            uniform float u_size;
            uniform float u_falloff;
            uniform vec2 u_texel_size;

            const float PI = 3.14159265359;
            const int MAX_SAMPLES_PER_RAY = 256; 

            const int MAX_POINTS = 16;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                float brightness = dot(originalColor.rgb, lum_weights);

                if (brightness < u_threshold) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                vec3 starColor = vec3(0.0);
                float angle_step = 2.0 * PI / float(u_points);

                for (int i = 0; i < MAX_POINTS; i++) {

                    if (i < u_points) {
                        float current_angle = u_angle_rad + float(i) * angle_step;
                        vec2 direction = vec2(cos(current_angle), sin(current_angle));

                        for (int j = 1; j < MAX_SAMPLES_PER_RAY; j++) {
                            if (float(j) <= u_size) {
                                float distance = float(j);
                                vec2 sampleCoord = vTextureCoord + direction * distance * u_texel_size;

                                vec3 sample_color = texture2D(uSampler, sampleCoord).rgb;
                                float sample_brightness = dot(sample_color, lum_weights);
                                float dist_falloff = pow(1.0 - (distance / u_size), u_falloff);

                                starColor += sample_color * sample_brightness * dist_falloff;
                            }
                        }
                    }
                }

                float star_brightness = dot(starColor * u_intensity, lum_weights);
                gl_FragColor = vec4(starColor * u_intensity, clamp(star_brightness, 0.0, 1.0));
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        u_threshold: options.threshold ?? 0.85,
        u_intensity: options.intensity ?? 0.5,
        u_angle_rad: (options.angle ?? 0) * (Math.PI / 180),
        u_points: options.points ?? 5,
        u_size: options.size ?? 80,
        u_falloff: options.falloff ?? 4,
        u_texel_size: [1 / (window.innerWidth * window.devicePixelRatio), 1 / (window.innerHeight * window.devicePixelRatio)]
      });
    }
  };
  var MetallicShineLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor() {
      super();
      this.patternTexture = null;
      this.patternSourceSprite = null;
      this.shinePatternFilter = null;
      this.noiseTextureManager = null;
      this.sourceContainer = null;
      this.effectSprites = /* @__PURE__ */ new Map();
      this.shinePassTexture = null;
      this.shineSprite = null;
      this.bloomSprite = null;
      this.starburstSprite = null;
      this.shineFilter = null;
      this.bloomFilters = [];
      this.starburstFilter = null;
      this._destroyed = false;
      this._framesSinceLoad = 0;
    }
    getPatternTexture() {
      return this.patternTexture;
    }
    async _draw(options) {
      console.log("MetallicShineLayer | Drawing FINAL, self-contained production version.");
      this._onResizeBound = this._onResize.bind(this);
      this._onAnimateBound = this._onAnimate.bind(this);
      this._framesSinceLoad = 0;
      this._destroyed = false;
      const renderer = canvas.app.renderer;
      const baseErrors = [];
      this.patternTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      this.patternSourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this.patternSourceSprite.width = renderer.screen.width;
      this.patternSourceSprite.height = renderer.screen.height;
      this.noiseTextureManager = new NoiseTextureManager(renderer, "baseShine.noise");
      try {
        this.shinePatternFilter = new ShinePatternFilter({});
        this.patternSourceSprite.filters = [this.shinePatternFilter];
      } catch (e) {
        console.error("MapShine | Failed to create ShinePatternFilter.", e);
        baseErrors.push("ShinePatternFilter");
      }
      this.sourceContainer = new PIXI.Container();
      this.shinePassTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      try {
        this.shineFilter = new MetallicShineFilter({
          shinePatternTexture: this.patternTexture
        });
        this.sourceContainer.filters = [this.shineFilter];
      } catch (e) {
        console.error("MapShine | Failed to create MetallicShineFilter.", e);
        baseErrors.push("MetallicShineFilter");
      }
      systemStatus.update("shaders", "baseShine", {
        state: baseErrors.length === 0 ? "ok" : "error",
        message: baseErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${baseErrors.join(", ")}`
      });
      try {
        const bloomThreshold = new ThresholdFilter();
        const bloomBlur = new PIXI.BlurFilter();
        const bloomBrightness = new PIXI.ColorMatrixFilter();
        const bloomAberration = new ChromaticAberrationFilter();
        this.bloomFilters = [bloomThreshold, bloomBlur, bloomBrightness, bloomAberration];
        this.starburstFilter = new StarburstFilter();
      } catch (e) {
        console.error("MapShine | Failed to create bloom/starburst filters.", e);
      }
      this.shineSprite = new PIXI.Sprite(this.shinePassTexture);
      this.bloomSprite = new PIXI.Sprite(this.shinePassTexture);
      this.starburstSprite = new PIXI.Sprite(this.shinePassTexture);
      this.bloomSprite.filters = this.bloomFilters;
      this.starburstSprite.filters = [this.starburstFilter];
      this.addChild(this.shineSprite, this.bloomSprite, this.starburstSprite);
      this.updateFromConfig(game.mapShine.profileManager.activeConfig);
      window.addEventListener("resize", this._onResizeBound);
      canvas.app.ticker.add(this._onAnimateBound);
    }
    _onAnimate(deltaTime) {
      if (this._destroyed)
        return;
      this._framesSinceLoad++;
      this.visible = false;
      const config = game.mapShine.profileManager.activeConfig;
      if (!config.enabled || !config.baseShine.enabled || !this.shineFilter || !this.shinePatternFilter)
        return;
      const hasActiveTargets = this.effectSprites.size > 0 && Array.from(this.effectSprites.values()).some((s) => s.texture.valid);
      if (!hasActiveTargets)
        return;
      if (this._framesSinceLoad < 5)
        return;
      this.visible = true;
      this.noiseTextureManager.update(deltaTime, canvas.app.renderer);
      const uPattern = this.shinePatternFilter.uniforms;
      uPattern.u_time = (uPattern.u_time || 0) + deltaTime;
      const stage = canvas.stage;
      const screen = canvas.app.screen;
      const topLeft = stage.toLocal({
        x: 0,
        y: 0
      });
      uPattern.u_camera_offset = [topLeft.x, topLeft.y];
      uPattern.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
      canvas.app.renderer.render(this.patternSourceSprite, {
        renderTexture: this.patternTexture,
        clear: true
      });
      canvas.app.renderer.render(this.sourceContainer, {
        renderTexture: this.shinePassTexture,
        clear: true,
        transform: canvas.stage.transform.worldTransform
      });
      [this.shineSprite, this.bloomSprite, this.starburstSprite].forEach((sprite) => {
        sprite.position.copyFrom(topLeft);
        sprite.width = screen.width / stage.scale.x;
        sprite.height = screen.height / stage.scale.y;
      });
    }
    async updateEffectTargets(targets) {
      if (!this.sourceContainer)
        return;
      const validTargetIds = /* @__PURE__ */ new Set();
      const allTargets = new Map([
        ["background", targets.background],
        ...targets.tiles.entries()
      ]);
      for (const [id, targetData] of allTargets.entries()) {
        if (!targetData?.specular)
          continue;
        validTargetIds.add(id);
        let sprite = this.effectSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.effectSprites.set(id, sprite);
          this.sourceContainer.addChild(sprite);
        }
        await this._updateSpriteTexture(sprite, targetData.specular);
        this._updateSpriteTransform(sprite, targetData.rect);
      }
      for (const [id, sprite] of this.effectSprites.entries()) {
        if (!validTargetIds.has(id)) {
          sprite.destroy();
          this.effectSprites.delete(id);
        }
      }
    }
    async updateFromConfig(config) {
      if (!this.shineFilter || !this.shinePatternFilter || !this.noiseTextureManager)
        return;
      this.noiseTextureManager.updateFromConfig(config);
      const bs = config.baseShine;
      const anim = bs.animation;
      const p = bs.pattern;
      const s1 = p.stripes1;
      const s2 = p.stripes2;
      const uPattern = this.shinePatternFilter.uniforms;
      uPattern.u_resolution = [canvas.app.screen.width, canvas.app.screen.height];
      uPattern.u_noiseMap = this.noiseTextureManager.getTexture();
      uPattern.u_parallaxAmount = anim.parallaxAmount;
      uPattern.u_globalIntensity = anim.globalIntensity;
      uPattern.u_shared_maxBrightness = p.shared.maxBrightness;
      uPattern.u_shared_patternScale = p.shared.patternScale;
      uPattern.u_noise_enabled = bs.noise.enabled;
      uPattern.u_s1_enabled = s1.enabled;
      uPattern.u_s1_speed = s1.speed;
      uPattern.u_s1_intensity = s1.intensity;
      uPattern.u_s1_angle_rad = s1.angle * (Math.PI / 180);
      uPattern.u_s1_sharpness = s1.sharpness;
      uPattern.u_s1_band_density = s1.bandDensity;
      uPattern.u_s1_band_width = s1.bandWidth;
      uPattern.u_s1_sub_stripe_max_count = s1.subStripeMaxCount;
      uPattern.u_s1_sub_stripe_max_sharp = s1.subStripeMaxSharp;
      uPattern.u_s2_enabled = s2.enabled;
      uPattern.u_s2_speed = s2.speed;
      uPattern.u_s2_intensity = s2.intensity;
      uPattern.u_s2_angle_rad = s2.angle * (Math.PI / 180);
      uPattern.u_s2_sharpness = s2.sharpness;
      uPattern.u_s2_band_density = s2.bandDensity;
      uPattern.u_s2_band_width = s2.bandWidth;
      uPattern.u_s2_sub_stripe_max_count = s2.subStripeMaxCount;
      uPattern.u_s2_sub_stripe_max_sharp = s2.subStripeMaxSharp;
      const uShine = this.shineFilter.uniforms;
      uShine.uBoost = anim.globalIntensity;
      const cc = bs.colorCorrection;
      uShine.uCCEnabled = cc.enabled;
      uShine.uSaturation = cc.saturation;
      uShine.uBrightness = cc.brightness;
      uShine.uContrast = cc.contrast;
      uShine.uExposure = cc.exposure;
      uShine.uGamma = cc.gamma;
      uShine.uInBlack = cc.levels.inBlack;
      uShine.uInWhite = cc.levels.inWhite;
      uShine.uTintColor = hexToRgbArray(cc.tint.color);
      uShine.uTintAmount = cc.tint.amount;
      this.shineSprite.blendMode = PIXI.BLEND_MODES.ADD;
      const bloomConfig = bs.shineBloom;
      const [threshold, blur, brightness, aberration] = this.bloomFilters;
      threshold.enabled = bloomConfig.enabled;
      threshold.threshold = bloomConfig.threshold;
      blur.enabled = bloomConfig.enabled;
      blur.strength = bloomConfig.blur;
      blur.quality = bloomConfig.quality;
      brightness.enabled = bloomConfig.enabled;
      brightness.brightness(bloomConfig.brightness, false);
      const rgbConfig = bs.rgbSplit;
      aberration.enabled = bloomConfig.enabled && rgbConfig.enabled;
      aberration.amount = rgbConfig.amount / 400;
      this.bloomSprite.visible = bloomConfig.enabled;
      this.bloomSprite.blendMode = bs.compositing.layerBlendMode;
      const starburstConfig = bs.starburst;
      this.starburstSprite.visible = starburstConfig.enabled;
      this.starburstSprite.blendMode = starburstConfig.blendMode;
      if (this.starburstFilter) {
        this.starburstFilter.enabled = starburstConfig.enabled;
        const uStarburst = this.starburstFilter.uniforms;
        uStarburst.u_threshold = starburstConfig.threshold;
        uStarburst.u_intensity = starburstConfig.intensity;
        uStarburst.u_angle_rad = starburstConfig.angle * (Math.PI / 180);
        uStarburst.u_points = Math.round(starburstConfig.points);
        uStarburst.u_size = starburstConfig.size;
        uStarburst.u_falloff = starburstConfig.falloff;
      }
    }
    async _updateSpriteTexture(sprite, texturePath) {
      const currentPath = sprite.texture?.baseTexture?.resource?.src;
      if (texturePath !== currentPath) {
        try {
          sprite.texture = await foundry.canvas.loadTexture(texturePath);
        } catch (e) {
          sprite.texture = PIXI.Texture.EMPTY;
        }
      }
    }
    _updateSpriteTransform(sprite, rect) {
      if (!sprite.texture.valid || !rect)
        return;
      sprite.anchor.set(0.5);
      sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
      sprite.width = rect.width;
      sprite.height = rect.height;
      sprite.rotation = rect.rotation || 0;
    }
    _onResize() {
      const renderer = canvas.app.renderer;
      this.patternTexture?.resize(renderer.screen.width, renderer.screen.height);
      this.shinePassTexture?.resize(renderer.screen.width, renderer.screen.height);
      this.noiseTextureManager?.resize(renderer);
      if (this.patternSourceSprite) {
        this.patternSourceSprite.width = renderer.screen.width;
        this.patternSourceSprite.height = renderer.screen.height;
      }
      if (this.starburstFilter) {
        this.starburstFilter.uniforms.u_texel_size = [1 / renderer.screen.width, 1 / renderer.screen.height];
      }
      if (game.mapShine?.effectTargetManager?.targets) {
        this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
      }
    }
    async _tearDown(options) {
      console.log(`MetallicShineLayer | Tearing down FINAL production version.`);
      if (this._destroyed)
        return;
      this._destroyed = true;
      if (this._onAnimateBound)
        canvas.app.ticker.remove(this._onAnimateBound);
      if (this._onResizeBound)
        window.removeEventListener("resize", this._onResizeBound);
      this.patternTexture?.destroy(true);
      this.patternSourceSprite?.destroy();
      this.shinePatternFilter?.destroy();
      this.noiseTextureManager?.destroy();
      this.sourceContainer?.destroy({
        children: true,
        texture: true,
        baseTexture: true
      });
      this.effectSprites.clear();
      this.shinePassTexture?.destroy(true);
      this.shineFilter?.destroy();
      this.starburstFilter?.destroy();
      this.bloomFilters.forEach((f) => f.destroy());
      this.bloomFilters = [];
      this.patternTexture = null;
      this.patternSourceSprite = null;
      this.shinePatternFilter = null;
      this.noiseTextureManager = null;
      this.sourceContainer = null;
      this.shinePassTexture = null;
      this.shineFilter = null;
      this.shineSprite = null;
      this.bloomSprite = null;
      this.starburstSprite = null;
      return super._tearDown(options);
    }
  };
  var CloudShadowsFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }
        `;
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            uniform sampler2D uOutdoorsMask;
            uniform sampler2D uIlluminationBuffer;

            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;
            uniform vec2 u_windDirection;

            uniform float u_noise_scale;
            uniform int u_noise_octaves;
            uniform float u_noise_persistence;
            uniform float u_noise_lacunarity;

            uniform float u_shading_threshold;
            uniform float u_shading_softness;
            uniform float u_shading_brightness;
            uniform float u_shading_contrast;
            uniform float u_shading_gamma;
            uniform float u_shadowIntensity;

            uniform bool u_outputHighlightMask;

            // Illumination Masking Uniforms
            uniform bool u_illum_enabled;
            uniform float u_illum_intensity;
            uniform float u_illum_luminanceThreshold;
            uniform float u_illum_softness;
            
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                float a = random(i);
                float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0));
                float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
            }

            float fbm(vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 10; i++) {
                    if (i >= u_noise_octaves) break;
                    value += amplitude * noise(st);
                    st *= u_noise_lacunarity;
                    amplitude *= u_noise_persistence;
                }
                return value;
            }

            float applyShadingControls(float value) {
                value += u_shading_brightness;
                value = (value - 0.5) * u_shading_contrast + 0.5;
                value = smoothstep(u_shading_threshold, u_shading_threshold + u_shading_softness, value);
                if (u_shading_gamma > 0.0) {
                    value = pow(value, u_shading_gamma);
                }
                return clamp(value, 0.0, 1.0);
            }

            void main() {
                float maskValue = texture2D(uOutdoorsMask, vScreenCoord).r;

                float shadedCloudValue = 0.0;
                if (maskValue > 0.01) {
                    vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                    vec2 noise_uv = world_coord / 100.0 * u_noise_scale;
                    noise_uv += u_time * u_windDirection;
                    float rawCloudValue = fbm(noise_uv);
                    shadedCloudValue = applyShadingControls(rawCloudValue);
                }

                if (u_outputHighlightMask) {
                    float lightAmount = 1.0 - shadedCloudValue;
                    gl_FragColor = vec4(vec3(lightAmount * maskValue), 1.0);
                    return;
                }

                float shadowAmount = shadedCloudValue * maskValue * u_shadowIntensity;

                if (u_illum_enabled) {
                    float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                    float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                    float reduction = lightMask * u_illum_intensity;
                    shadowAmount *= (1.0 - reduction);
                }
                
                shadowAmount = clamp(shadowAmount, 0.0, 1.0);
                
                gl_FragColor = vec4(vec3(1.0 - shadowAmount), 1.0);
            }
        `;
      super(vertexSrc, fragmentSrc, {
        uOutdoorsMask: PIXI.Texture.EMPTY,
        u_time: 0,
        u_camera_offset: [0, 0],
        u_view_size: [0, 0],
        u_windDirection: [0.01, 0.01],
        u_noise_scale: 0.1,
        u_noise_octaves: 5,
        u_noise_persistence: 0.5,
        u_noise_lacunarity: 2.5,
        u_shading_threshold: 1,
        u_shading_softness: 0.2,
        u_shading_brightness: 0.51,
        u_shading_contrast: 1,
        u_shading_gamma: 1,
        u_shadowIntensity: 0.5,
        u_outputHighlightMask: false,
        uIlluminationBuffer: PIXI.Texture.EMPTY,
        u_illum_enabled: false,
        u_illum_intensity: 0.8,
        u_illum_luminanceThreshold: 0.1,
        u_illum_softness: 0.2
      });
    }
  };
  var CloudShadowsLayer = class extends MaskedEffectLayer {
    constructor() {
      super({ maskSuffix: "outdoors" });
      this.cloudFilter = null;
      this.blurredMaskTexture = null;
      this.maskBlurFilter = null;
      this.blurSourceSprite = null;
      this._patternGeneratorSprite = null;
      this.cloudShadowTexture = null;
      this.cloudHighlightMaskTexture = null;
      this.effectSprite = null;
    }
    getHighlightMaskTexture() {
      return this.cloudHighlightMaskTexture;
    }
    async _draw(options) {
      await super._draw(options);
      const renderer = canvas.app.renderer;
      try {
        this.cloudFilter = new CloudShadowsFilter();
        systemStatus.update("shaders", "cloudShadows", {
          state: "ok",
          message: "Compiled successfully."
        });
      } catch (e) {
        console.error("MapShine | Failed to create final CloudShadowsFilter.", e);
        systemStatus.update("shaders", "cloudShadows", {
          state: "error",
          message: `Compilation Failed: ${e.message}`
        });
        return;
      }
      this.maskBlurFilter = new PIXI.BlurFilter();
      this.blurredMaskTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      this.blurSourceSprite = new PIXI.Sprite(this.combinedMaskTexture);
      this.blurSourceSprite.filters = [this.maskBlurFilter];
      this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this._patternGeneratorSprite.width = renderer.screen.width;
      this._patternGeneratorSprite.height = renderer.screen.height;
      this._patternGeneratorSprite.filters = [this.cloudFilter];
      this.cloudShadowTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      this.cloudHighlightMaskTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      this.effectSprite = new PIXI.Sprite(this.cloudShadowTexture);
      this.addChild(this.effectSprite);
      this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }
    _onPan() {
      super._onPan();
      this._updateSpriteAndUniformPositions();
    }
    _onAnimate(deltaTime) {
      super._onAnimate(deltaTime);
      if (this._destroyed || !this.visible || !this.cloudFilter)
        return;
      const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some((s) => s.texture.valid);
      if (!hasActiveMasks) {
        this.effectSprite.visible = false;
        return;
      }
      this.effectSprite.visible = true;
      if (this._needsMaskUpdate && this.maskBlurFilter?.enabled) {
        this.blurSourceSprite.texture = this.combinedMaskTexture;
        canvas.app.renderer.render(this.blurSourceSprite, {
          renderTexture: this.blurredMaskTexture,
          clear: true
        });
      }
      const finalMask = this.maskBlurFilter?.enabled ? this.blurredMaskTexture : this.getMaskTexture();
      const u = this.cloudFilter.uniforms;
      u.uOutdoorsMask = finalMask;
      u.u_time += deltaTime;
      this._updateSpriteAndUniformPositions();
      const illumConfig = game.mapShine.profileManager.activeConfig.cloudShadows.illumination;
      const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
      const illumTexture = illuminationAPI?.getLightingTexture();
      u.u_illum_enabled = illumConfig.enabled && !!illumTexture?.valid;
      if (u.u_illum_enabled) {
        u.uIlluminationBuffer = illumTexture;
        u.u_illum_intensity = illumConfig.intensity;
        u.u_illum_luminanceThreshold = illumConfig.luminanceThreshold;
        u.u_illum_softness = illumConfig.softness;
      }
      this.cloudFilter.uniforms.u_outputHighlightMask = true;
      canvas.app.renderer.render(this._patternGeneratorSprite, {
        renderTexture: this.cloudHighlightMaskTexture,
        clear: true
      });
      this.cloudFilter.uniforms.u_outputHighlightMask = false;
      canvas.app.renderer.render(this._patternGeneratorSprite, {
        renderTexture: this.cloudShadowTexture,
        clear: true
      });
    }
    _updateSpriteAndUniformPositions() {
      if (!this.cloudFilter || !this.effectSprite)
        return;
      const stage = canvas.stage, screen = canvas.app.screen;
      const topLeft = stage.toLocal({
        x: 0,
        y: 0
      });
      this.cloudFilter.uniforms.u_camera_offset = [topLeft.x, topLeft.y];
      this.cloudFilter.uniforms.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
      this.effectSprite.position.copyFrom(topLeft);
      this.effectSprite.width = screen.width / stage.scale.x;
      this.effectSprite.height = screen.height / stage.scale.y;
      this._patternGeneratorSprite.position.set(0, 0);
      this._patternGeneratorSprite.width = screen.width;
      this._patternGeneratorSprite.height = screen.height;
    }
    async updateFromConfig(config) {
      const csConfig = config.cloudShadows;
      this.visible = config.enabled && csConfig.enabled;
      if (!this.cloudFilter)
        return;
      if (this.maskBlurFilter) {
        this.maskBlurFilter.blur = csConfig.maskBlur ?? 0;
        this.maskBlurFilter.enabled = this.maskBlurFilter.blur > 0;
        if (this.maskBlurFilter.enabled)
          this._needsMaskUpdate = true;
      }
      const u = this.cloudFilter.uniforms;
      u.u_shadowIntensity = csConfig.shadowIntensity;
      const windAngleRad = (csConfig.wind.angle ?? 45) * (Math.PI / 180);
      const windSpeed = csConfig.wind.speed ?? 0.01;
      u.u_windDirection = [Math.cos(windAngleRad) * windSpeed, Math.sin(windAngleRad) * windSpeed];
      u.u_noise_scale = csConfig.noise.scale;
      u.u_noise_octaves = csConfig.noise.octaves;
      u.u_noise_persistence = csConfig.noise.persistence;
      u.u_noise_lacunarity = csConfig.noise.lacunarity;
      const s = csConfig.shading;
      u.u_shading_threshold = s.threshold;
      u.u_shading_softness = s.softness;
      u.u_shading_brightness = s.brightness;
      u.u_shading_contrast = s.contrast;
      u.u_shading_gamma = s.gamma;
      this.blendMode = PIXI.BLEND_MODES.NORMAL;
      if (this.effectSprite) {
        this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
      }
    }
    _onResize() {
      super._onResize();
      const renderer = canvas.app.renderer;
      this.blurredMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
      this.cloudShadowTexture?.resize(renderer.screen.width, renderer.screen.height);
      this.cloudHighlightMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
      if (this.effectSprite)
        this._updateSpriteAndUniformPositions();
    }
    async _tearDown(options) {
      this.cloudFilter?.destroy();
      this._patternGeneratorSprite?.destroy();
      this.cloudShadowTexture?.destroy(true);
      this.cloudHighlightMaskTexture?.destroy(true);
      this.effectSprite?.destroy();
      this.maskBlurFilter?.destroy();
      this.blurSourceSprite?.destroy();
      this.blurredMaskTexture?.destroy(true);
      this.cloudFilter = null;
      this.effectSprite = null;
      this.maskBlurFilter = null;
      this.blurSourceSprite = null;
      this.blurredMaskTexture = null;
      this._patternGeneratorSprite = null;
      this.cloudShadowTexture = null;
      this.cloudHighlightMaskTexture = null;
      await super._tearDown(options);
    }
  };
  var CanopyFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }
        `;
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            // Samplers
            uniform sampler2D uSampler;
            uniform sampler2D u_distortionNoise;
            uniform sampler2D uOutdoorsMask;
            uniform sampler2D uIlluminationBuffer;

            // Uniforms
            uniform float u_shadowIntensity;
            uniform vec3 u_tint;
            uniform bool u_distortion_enabled;
            uniform float u_distortion_intensity;

            // Illumination Masking Uniforms
            uniform bool u_illum_enabled;
            uniform float u_illum_intensity;
            uniform float u_illum_luminanceThreshold;
            uniform float u_illum_softness;

            // New uniforms for world-space calculations
            uniform vec4 u_scene_rect; // (x, y, width, height) of the entire scene
            uniform vec2 u_camera_offset; // World coordinate of the screen's top-left
            uniform vec2 u_view_size; // World dimensions of the screen
            
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main() {
                float outdoorMaskVal = texture2D(uOutdoorsMask, vScreenCoord).r;
                if (outdoorMaskVal < 0.01) {
                    discard;
                }

                vec2 distortedCoord = vTextureCoord;
                if (u_distortion_enabled && u_distortion_intensity > 0.0) {
                    
                    // --- World-Space Gradient Falloff ---
                    // 1. Calculate the true world coordinate of this pixel.
                    vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);

                    // 2. Normalize the world coordinate to a 0-1 range based on the scene dimensions.
                    vec2 world_uv = (world_coord - u_scene_rect.xy) / u_scene_rect.zw;

                    // 3. Calculate falloff based on distance from the center of the WORLD.
                    vec2 distFromCenter = abs(world_uv - 0.5) * 2.0;
                    float maxDist = max(distFromCenter.x, distFromCenter.y);
                    float falloff = 1.0 - smoothstep(0.8, 1.0, maxDist); // Fade out over the last 20% of the map edge

                    // --- Distortion Calculation ---
                    vec2 displacement = (texture2D(u_distortionNoise, vScreenCoord).rg - 0.5) * 2.0;
                    vec2 offset = displacement * u_distortion_intensity * 0.01 * falloff;
                    distortedCoord += offset;
                }

                float maskValue = texture2D(uSampler, distortedCoord).r;
                float maskAlpha = texture2D(uSampler, distortedCoord).a;
                float shadowAmount = 1.0 - maskValue;
                
                if (shadowAmount < 0.01 || maskAlpha < 0.01) {
                    discard;
                }
                
                float finalAlpha = shadowAmount * u_shadowIntensity * outdoorMaskVal;

                if (u_illum_enabled) {
                    float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                    float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                    float reduction = lightMask * u_illum_intensity;
                    finalAlpha *= (1.0 - reduction);
                }

                gl_FragColor = vec4(u_tint, finalAlpha);
            }
        `;
      super(vertexSrc, fragmentSrc, {
        u_distortionNoise: PIXI.Texture.EMPTY,
        uOutdoorsMask: PIXI.Texture.EMPTY,
        u_shadowIntensity: 0.7,
        u_tint: [0, 0, 0],
        u_distortion_enabled: true,
        u_distortion_intensity: 5,
        u_scene_rect: [0, 0, 1, 1],
        u_camera_offset: [0, 0],
        u_view_size: [1, 1],
        uIlluminationBuffer: PIXI.Texture.EMPTY,
        u_illum_enabled: false,
        u_illum_intensity: 0.8,
        u_illum_luminanceThreshold: 0.1,
        u_illum_softness: 0.2,
        ...options
      });
    }
  };
  var CanopyLayer = class extends MaskedEffectLayer {
    constructor() {
      super({ maskSuffix: "canopy" });
      this.canopyFilter = null;
      this.effectSprite = null;
      this.distortionNoiseManager = null;
      this.outdoorsMaskContainer = null;
      this.outdoorsMaskTexture = null;
      this.outdoorsMaskSprites = /* @__PURE__ */ new Map();
      this._needsOutdoorsMaskUpdate = true;
    }
    async _draw(options) {
      await super._draw(options);
      this._needsOutdoorsMaskUpdate = true;
      this.blendMode = PIXI.BLEND_MODES.MULTIPLY;
      const renderer = canvas.app.renderer;
      this.outdoorsMaskContainer = new PIXI.Container();
      this.outdoorsMaskTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      this.distortionNoiseManager = new NoiseTextureManager(renderer, "canopy.distortion", true);
      try {
        this.canopyFilter = new CanopyFilter();
      } catch (e) {
        console.error("MapShine | Failed to create CanopyFilter", e);
      }
      this.effectSprite = new PIXI.Sprite(this.getMaskTexture());
      this.effectSprite.filters = this.canopyFilter ? [this.canopyFilter] : [];
      this.addChild(this.effectSprite);
      this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }
    _onPan() {
      super._onPan();
      this._needsOutdoorsMaskUpdate = true;
    }
    _onResize() {
      super._onResize();
      const renderer = canvas.app.renderer;
      this.distortionNoiseManager?.resize(renderer);
      this.outdoorsMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
      if (this.effectSprite) {
        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
      }
      this._needsOutdoorsMaskUpdate = true;
    }
    _onAnimate(deltaTime) {
      super._onAnimate(deltaTime);
      if (this._destroyed || !this.visible || !this.canopyFilter)
        return;
      this.distortionNoiseManager.update(deltaTime, canvas.app.renderer);
      if (this._needsOutdoorsMaskUpdate) {
        canvas.app.renderer.render(this.outdoorsMaskContainer, {
          renderTexture: this.outdoorsMaskTexture,
          transform: canvas.stage.transform.worldTransform,
          clear: true
        });
        this._needsOutdoorsMaskUpdate = false;
      }
      const stage = canvas.stage;
      const screen = canvas.app.screen;
      const topLeft = stage.toLocal({ x: 0, y: 0 });
      const u = this.canopyFilter.uniforms;
      u.u_distortionNoise = this.distortionNoiseManager.getTexture();
      u.uOutdoorsMask = this.outdoorsMaskTexture;
      const dims = canvas.scene.dimensions;
      u.u_scene_rect = [dims.sceneX, dims.sceneY, dims.sceneWidth, dims.sceneHeight];
      u.u_camera_offset = [topLeft.x, topLeft.y];
      u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
      const illumConfig = game.mapShine.profileManager.activeConfig.canopy.illumination;
      const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
      const illumTexture = illuminationAPI?.getLightingTexture();
      u.u_illum_enabled = illumConfig.enabled && !!illumTexture?.valid;
      if (u.u_illum_enabled) {
        u.uIlluminationBuffer = illumTexture;
        u.u_illum_intensity = illumConfig.intensity;
        u.u_illum_luminanceThreshold = illumConfig.luminanceThreshold;
        u.u_illum_softness = illumConfig.softness;
      }
      this.effectSprite.position.copyFrom(topLeft);
      this.effectSprite.width = screen.width / stage.scale.x;
      this.effectSprite.height = screen.height / stage.scale.y;
    }
    async updateEffectTargets(targets) {
      await super.updateEffectTargets(targets);
      if (!this.outdoorsMaskContainer)
        return;
      this.outdoorsMaskContainer.removeChildren().forEach((c) => c.destroy({ texture: true, baseTexture: true }));
      this.outdoorsMaskSprites.clear();
      const allTargets = new Map([["background", targets.background], ...targets.tiles.entries()]);
      for (const [id, targetData] of allTargets.entries()) {
        if (targetData?.outdoors) {
          const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.outdoorsMaskSprites.set(id, sprite);
          this.outdoorsMaskContainer.addChild(sprite);
          await this._updateSpriteTransform(sprite, targetData.outdoors, targetData.rect);
        }
      }
      this._needsOutdoorsMaskUpdate = true;
    }
    async updateFromConfig(config) {
      const cConfig = config.canopy;
      this.visible = config.enabled && cConfig.enabled;
      this.distortionNoiseManager?.updateFromConfig(config);
      if (this.canopyFilter) {
        const u = this.canopyFilter.uniforms;
        u.u_shadowIntensity = cConfig.shadowIntensity;
        u.u_tint = hexToRgbArray(cConfig.tint);
        const distConfig = cConfig.distortion;
        u.u_distortion_enabled = distConfig.enabled;
        u.u_distortion_intensity = distConfig.intensity;
      }
    }
    async _tearDown(options) {
      this.distortionNoiseManager?.destroy();
      this.canopyFilter?.destroy();
      this.effectSprite?.destroy();
      this.outdoorsMaskContainer?.destroy({ children: true, texture: true, baseTexture: true });
      this.outdoorsMaskTexture?.destroy(true);
      this.outdoorsMaskSprites.clear();
      this.distortionNoiseManager = null;
      this.canopyFilter = null;
      this.effectSprite = null;
      this.outdoorsMaskContainer = null;
      this.outdoorsMaskTexture = null;
      await super._tearDown(options);
    }
  };
  var StructuralShadowsFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }
        `;
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            // Samplers
            uniform sampler2D uStructuralMask;
            uniform sampler2D u_intensityNoise;
            uniform sampler2D u_cloudNoise;
            uniform sampler2D uOutdoorsMask;
            uniform sampler2D uIlluminationBuffer;

            // Parallax & World Uniforms
            uniform float u_parallax;
            uniform vec4 u_scene_rect;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            // Effect Uniforms
            uniform float u_shadowIntensity;
            uniform vec3 u_tint;
            uniform bool u_intensityNoise_enabled;
            uniform float u_intensityNoise_amount;
            uniform bool u_cloud_enabled;
            uniform float u_cloud_intensity;

            // Illumination Masking Uniforms
            uniform bool u_illum_enabled;
            uniform float u_illum_intensity;
            uniform float u_illum_luminanceThreshold;
            uniform float u_illum_softness;

            // Control Uniform
            uniform bool u_outputHighlightMask;
            
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main() {
                // --- 1. Calculate final texture coordinates with parallax ---
                vec2 camera_center_world = u_camera_offset + (u_view_size * 0.5);
                vec2 scene_center_world = u_scene_rect.xy + (u_scene_rect.zw * 0.5);
                vec2 offset_from_center = camera_center_world - scene_center_world;
                vec2 parallax_uv_offset = (offset_from_center / u_view_size) * u_parallax;
                vec2 final_tex_coord = vScreenCoord - parallax_uv_offset;

                // --- 2. Create the definitive, animated structural light value ---
                float animatedLightValue = texture2D(uStructuralMask, final_tex_coord).r;

                // Step 2a: Apply cloud occlusion. This can only darken the light.
                if (u_cloud_enabled) {
                    float cloudShadowAmount = texture2D(u_cloudNoise, vScreenCoord).r;
                    float cloudLightMultiplier = 1.0 - (cloudShadowAmount * u_cloud_intensity);
                    animatedLightValue *= cloudLightMultiplier;
                }
                
                // Step 2b: Apply flicker. This can also only darken the light.
                if (u_intensityNoise_enabled) {
                    float noiseVal = texture2D(u_intensityNoise, final_tex_coord).r;
                    float flickerMultiplier = 1.0 - (noiseVal * u_intensityNoise_amount);
                    animatedLightValue *= flickerMultiplier;
                }
                
                animatedLightValue = clamp(animatedLightValue, 0.0, 1.0);

                // --- 3. Output the correct texture based on the mode ---
                if (u_outputHighlightMask) {
                    gl_FragColor = vec4(vec3(animatedLightValue), 1.0);
                } else {
                    float shadowAmount = 1.0 - animatedLightValue;
                    float outdoorAmount = texture2D(uOutdoorsMask, vScreenCoord).r;

                    if (shadowAmount < 0.01 || outdoorAmount > 0.99) {
                        gl_FragColor = vec4(1.0);
                        return;
                    }
                    
                    float finalAlpha = shadowAmount * u_shadowIntensity;

                    if (u_illum_enabled) {
                        float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                        float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                        finalAlpha *= (1.0 - (lightMask * u_illum_intensity));
                    }

                    finalAlpha *= (1.0 - outdoorAmount);
                    
                    vec3 final_rgb = mix(vec3(1.0), u_tint, clamp(finalAlpha, 0.0, 1.0));
                    gl_FragColor = vec4(final_rgb, 1.0);
                }
            }
        `;
      super(vertexSrc, fragmentSrc, {
        uStructuralMask: PIXI.Texture.EMPTY,
        u_intensityNoise: PIXI.Texture.EMPTY,
        u_cloudNoise: PIXI.Texture.EMPTY,
        uOutdoorsMask: PIXI.Texture.EMPTY,
        u_shadowIntensity: 0.7,
        u_tint: [0, 0, 0],
        u_parallax: 0.1,
        u_scene_rect: [0, 0, 1, 1],
        u_camera_offset: [0, 0],
        u_view_size: [1, 1],
        u_intensityNoise_enabled: true,
        u_intensityNoise_amount: 0.5,
        u_cloud_enabled: false,
        u_cloud_intensity: 1,
        uIlluminationBuffer: PIXI.Texture.EMPTY,
        u_illum_enabled: false,
        u_illum_intensity: 0.8,
        u_illum_luminanceThreshold: 0.1,
        u_illum_softness: 0.2,
        u_outputHighlightMask: false,
        ...options
      });
    }
  };
  var StructuralHighlightRgbSplitFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform float uIntensity;
            uniform float uThreshold;
            uniform vec2 uTexelSize;

            void main(void) {
                float lightAmount = texture2D(uSampler, vTextureCoord).r;
                
                if (lightAmount < uThreshold) {
                    gl_FragColor = vec4(vec3(lightAmount), 1.0);
                    return;
                }
                
                float split_factor = (lightAmount - uThreshold) / (1.0 - uThreshold);
                split_factor = clamp(split_factor, 0.0, 1.0);
                
                vec2 offset = vec2(uIntensity * split_factor * uTexelSize.x, 0.0);
                
                float r = texture2D(uSampler, vTextureCoord - offset).r;
                float g = lightAmount;
                float b = texture2D(uSampler, vTextureCoord + offset).r;
                
                gl_FragColor = vec4(r, g, b, 1.0);
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        uIntensity: options.intensity ?? 2,
        uThreshold: options.threshold ?? 0.5,
        uTexelSize: options.texelSize ?? [1 / (window.innerWidth || 1), 1 / (window.innerHeight || 1)]
      });
    }
  };
  var StructuralShadowsLayer = class extends MaskedEffectLayer {
    constructor() {
      super({
        maskSuffix: "structural"
      });
      this.structuralFilter = null;
      this.effectSprite = null;
      this._patternGeneratorSprite = null;
      this.finalShadowTexture = null;
      this.finalHighlightMaskTexture = null;
      this.intensityNoiseManager = null;
      this.cloudNoiseTexture = null;
      this.cloudNoiseFilter = null;
      this._cloudNoiseSprite = null;
      this.rgbSplitFilter = null;
      this.splitHighlightMaskTexture = null;
      this._splitHighlightSprite = null;
      this.outdoorsMaskContainer = null;
      this.outdoorsMaskTexture = null;
      this.outdoorsMaskSprites = /* @__PURE__ */ new Map();
      this._needsOutdoorsMaskUpdate = true;
    }
    getHighlightMaskTexture() {
      return this.finalHighlightMaskTexture;
    }
    getSplitHighlightMaskTexture() {
      return this.splitHighlightMaskTexture;
    }
    isRgbSplitEnabled() {
      const config = game.mapShine.profileManager.activeConfig;
      if (!config)
        return false;
      return config.enabled && config.structuralShadows.enabled && config.structuralShadows.rgbSplit.enabled;
    }
    async _draw(options) {
      await super._draw(options);
      this._needsOutdoorsMaskUpdate = true;
      this.blendMode = PIXI.BLEND_MODES.NORMAL;
      const renderer = canvas.app.renderer;
      const screen = renderer.screen;
      this.outdoorsMaskContainer = new PIXI.Container();
      this.outdoorsMaskTexture = PIXI.RenderTexture.create({
        width: screen.width,
        height: screen.height
      });
      this.intensityNoiseManager = new NoiseTextureManager(renderer, "structuralShadows.intensityNoise", true);
      this.cloudNoiseTexture = PIXI.RenderTexture.create({
        width: screen.width,
        height: screen.height
      });
      this.cloudNoiseFilter = new CloudNoiseFilter();
      this._cloudNoiseSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this._cloudNoiseSprite.width = screen.width;
      this._cloudNoiseSprite.height = screen.height;
      this._cloudNoiseSprite.filters = [this.cloudNoiseFilter];
      this.finalShadowTexture = PIXI.RenderTexture.create({
        width: screen.width,
        height: screen.height
      });
      this.finalHighlightMaskTexture = PIXI.RenderTexture.create({
        width: screen.width,
        height: screen.height
      });
      this.splitHighlightMaskTexture = PIXI.RenderTexture.create({
        width: screen.width,
        height: screen.height
      });
      this.rgbSplitFilter = new StructuralHighlightRgbSplitFilter();
      this._splitHighlightSprite = new PIXI.Sprite(this.finalHighlightMaskTexture);
      this._splitHighlightSprite.filters = [this.rgbSplitFilter];
      try {
        this.structuralFilter = new StructuralShadowsFilter();
        systemStatus.update("shaders", "structuralShadows", {
          state: "ok",
          message: "Compiled successfully."
        });
      } catch (e) {
        console.error("MapShine | Failed to create StructuralShadowsFilter", e);
        systemStatus.update("shaders", "structuralShadows", {
          state: "error",
          message: `Compilation Failed: ${e.message}`
        });
      }
      this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this._patternGeneratorSprite.width = screen.width;
      this._patternGeneratorSprite.height = screen.height;
      this._patternGeneratorSprite.filters = this.structuralFilter ? [this.structuralFilter] : [];
      this.effectSprite = new PIXI.Sprite(this.finalShadowTexture);
      this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
      this.addChild(this.effectSprite);
      this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }
    _onPan() {
      super._onPan();
      this._needsOutdoorsMaskUpdate = true;
    }
    _onResize() {
      super._onResize();
      const renderer = canvas.app.renderer;
      const screen = renderer.screen;
      this.intensityNoiseManager?.resize(renderer);
      this.outdoorsMaskTexture?.resize(screen.width, screen.height);
      this.cloudNoiseTexture?.resize(screen.width, screen.height);
      this.finalShadowTexture?.resize(screen.width, screen.height);
      this.finalHighlightMaskTexture?.resize(screen.width, screen.height);
      this.splitHighlightMaskTexture?.resize(screen.width, screen.height);
      if (this._patternGeneratorSprite) {
        this._patternGeneratorSprite.width = screen.width;
        this._patternGeneratorSprite.height = screen.height;
      }
      if (this._cloudNoiseSprite) {
        this._cloudNoiseSprite.width = screen.width;
        this._cloudNoiseSprite.height = screen.height;
      }
      if (this._splitHighlightSprite) {
        this._splitHighlightSprite.width = screen.width;
        this._splitHighlightSprite.height = screen.height;
      }
      if (this.rgbSplitFilter) {
        this.rgbSplitFilter.uniforms.uTexelSize = [1 / screen.width, 1 / screen.height];
      }
      if (this.effectSprite) {
        const stage = canvas.stage;
        const topLeft = stage.toLocal({
          x: 0,
          y: 0
        });
        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
      }
      this._needsOutdoorsMaskUpdate = true;
    }
    _onAnimate(deltaTime) {
      super._onAnimate(deltaTime);
      if (this._destroyed || !this.visible || !this.structuralFilter)
        return;
      const hasActiveTargets = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some((s) => s.texture.valid);
      if (!hasActiveTargets) {
        this.effectSprite.visible = false;
        return;
      }
      this.effectSprite.visible = true;
      const renderer = canvas.app.renderer;
      const stage = canvas.stage;
      const screen = renderer.screen;
      const topLeft = stage.toLocal({
        x: 0,
        y: 0
      });
      const viewSize = [screen.width / stage.scale.x, screen.height / stage.scale.y];
      this.intensityNoiseManager.update(deltaTime, renderer);
      const uCloud = this.cloudNoiseFilter.uniforms;
      uCloud.u_time += deltaTime;
      uCloud.u_camera_offset = [topLeft.x, topLeft.y];
      uCloud.u_view_size = viewSize;
      renderer.render(this._cloudNoiseSprite, {
        renderTexture: this.cloudNoiseTexture,
        clear: true
      });
      if (this._needsOutdoorsMaskUpdate) {
        renderer.render(this.outdoorsMaskContainer, {
          renderTexture: this.outdoorsMaskTexture,
          transform: stage.transform.worldTransform,
          clear: true
        });
        this._needsOutdoorsMaskUpdate = false;
      }
      const u = this.structuralFilter.uniforms;
      u.uStructuralMask = this.getMaskTexture();
      u.u_intensityNoise = this.intensityNoiseManager.getTexture();
      u.u_cloudNoise = this.cloudNoiseTexture;
      u.uOutdoorsMask = this.outdoorsMaskTexture;
      const dims = canvas.scene.dimensions;
      u.u_scene_rect = [dims.sceneX, dims.sceneY, dims.sceneWidth, dims.sceneHeight];
      u.u_camera_offset = [topLeft.x, topLeft.y];
      u.u_view_size = viewSize;
      const illumConfig = game.mapShine.profileManager.activeConfig.structuralShadows.illumination;
      const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
      const illumTexture = illuminationAPI?.getLightingTexture();
      u.u_illum_enabled = illumConfig.enabled && !!illumTexture?.valid;
      if (u.u_illum_enabled)
        u.uIlluminationBuffer = illumTexture;
      u.u_outputHighlightMask = true;
      renderer.render(this._patternGeneratorSprite, {
        renderTexture: this.finalHighlightMaskTexture,
        clear: true
      });
      u.u_outputHighlightMask = false;
      renderer.render(this._patternGeneratorSprite, {
        renderTexture: this.finalShadowTexture,
        clear: true
      });
      if (this.isRgbSplitEnabled()) {
        renderer.render(this._splitHighlightSprite, {
          renderTexture: this.splitHighlightMaskTexture,
          clear: true
        });
      }
      this.effectSprite.position.copyFrom(topLeft);
      this.effectSprite.width = screen.width / stage.scale.x;
      this.effectSprite.height = screen.height / stage.scale.y;
    }
    async updateEffectTargets(targets) {
      await super.updateEffectTargets(targets);
      if (!this.outdoorsMaskContainer)
        return;
      this.outdoorsMaskContainer.removeChildren().forEach((c) => c.destroy({
        texture: true,
        baseTexture: true
      }));
      this.outdoorsMaskSprites.clear();
      const allTargets = new Map([
        ["background", targets.background],
        ...targets.tiles.entries()
      ]);
      for (const [id, targetData] of allTargets.entries()) {
        if (targetData?.outdoors) {
          const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.outdoorsMaskSprites.set(id, sprite);
          this.outdoorsMaskContainer.addChild(sprite);
          await this._updateSpriteTransform(sprite, targetData.outdoors, targetData.rect);
        }
      }
      this._needsOutdoorsMaskUpdate = true;
    }
    async updateFromConfig(config) {
      const ssConfig = config.structuralShadows;
      this.visible = config.enabled && ssConfig.enabled;
      this.intensityNoiseManager?.updateFromConfig(config);
      if (this.cloudNoiseFilter) {
        const u = this.cloudNoiseFilter.uniforms;
        const cloudConfig = ssConfig.cloudOcclusion;
        const windAngleRad = (cloudConfig.wind.angle ?? 45) * (Math.PI / 180);
        const windSpeed = cloudConfig.wind.speed ?? 1e-3;
        u.u_windDirection = [Math.cos(windAngleRad) * windSpeed, Math.sin(windAngleRad) * windSpeed];
        const noise = cloudConfig.noise;
        u.u_noise_scale = noise.scale;
        u.u_noise_octaves = noise.octaves;
        u.u_noise_persistence = noise.persistence;
        u.u_noise_lacunarity = noise.lacunarity;
        const shading = cloudConfig.shading;
        u.u_shading_threshold = shading.threshold;
        u.u_shading_softness = shading.softness;
        u.u_shading_brightness = shading.brightness;
        u.u_shading_contrast = shading.contrast;
        u.u_shading_gamma = shading.gamma;
      }
      if (this.structuralFilter) {
        const u = this.structuralFilter.uniforms;
        u.u_shadowIntensity = ssConfig.shadowIntensity;
        u.u_tint = hexToRgbArray(ssConfig.tint);
        u.u_parallax = ssConfig.parallax;
        u.u_intensityNoise_enabled = ssConfig.intensityNoise.enabled;
        u.u_intensityNoise_amount = ssConfig.intensityNoise.amount;
        u.u_cloud_enabled = ssConfig.cloudOcclusion.enabled;
        u.u_cloud_intensity = ssConfig.cloudOcclusion.intensity;
        const illumConfig = ssConfig.illumination;
        u.u_illum_enabled = illumConfig.enabled;
        u.u_illum_intensity = illumConfig.intensity;
        u.u_illum_luminanceThreshold = illumConfig.luminanceThreshold;
        u.u_illum_softness = illumConfig.softness;
      }
      if (this.rgbSplitFilter) {
        const u = this.rgbSplitFilter.uniforms;
        const rgbConfig = ssConfig.rgbSplit;
        u.uIntensity = rgbConfig.intensity;
        u.uThreshold = rgbConfig.threshold;
      }
    }
    async _tearDown(options) {
      this.intensityNoiseManager?.destroy();
      this.cloudNoiseFilter?.destroy();
      this._cloudNoiseSprite?.destroy();
      this.cloudNoiseTexture?.destroy(true);
      this.structuralFilter?.destroy();
      this._patternGeneratorSprite?.destroy();
      this.finalShadowTexture?.destroy(true);
      this.finalHighlightMaskTexture?.destroy(true);
      this.effectSprite?.destroy();
      this.rgbSplitFilter?.destroy();
      this._splitHighlightSprite?.destroy();
      this.splitHighlightMaskTexture?.destroy(true);
      this.outdoorsMaskContainer?.destroy({
        children: true,
        texture: true,
        baseTexture: true
      });
      this.outdoorsMaskTexture?.destroy(true);
      this.outdoorsMaskSprites.clear();
      this.intensityNoiseManager = null;
      this.cloudNoiseFilter = null;
      this._cloudNoiseSprite = null;
      this.cloudNoiseTexture = null;
      this.structuralFilter = null;
      this._patternGeneratorSprite = null;
      this.finalShadowTexture = null;
      this.finalHighlightMaskTexture = null;
      this.effectSprite = null;
      this.outdoorsMaskContainer = null;
      this.outdoorsMaskTexture = null;
      this.rgbSplitFilter = null;
      this._splitHighlightSprite = null;
      this.splitHighlightMaskTexture = null;
      await super._tearDown(options);
    }
  };
  var CloudNoiseFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            // Time and Transform Uniforms
            uniform float u_time;
            uniform vec2 u_windDirection;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            // Noise Shape Uniforms
            uniform float u_noise_scale;
            uniform int u_noise_octaves;
            uniform float u_noise_persistence;
            uniform float u_noise_lacunarity;

            // Noise Shading Uniforms
            uniform float u_shading_threshold;
            uniform float u_shading_softness;
            uniform float u_shading_brightness;
            uniform float u_shading_contrast;
            uniform float u_shading_gamma;

            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float noise(vec2 st) {
                vec2 i = floor(st); vec2 f = fract(st);
                float a = random(i); float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
            }
            float fbm(vec2 st) {
                float value = 0.0; float amplitude = 0.5;
                for (int i = 0; i < 10; i++) {
                    if (i >= u_noise_octaves) break;
                    value += amplitude * noise(st);
                    st *= u_noise_lacunarity;
                    amplitude *= u_noise_persistence;
                }
                return value;
            }
            float applyShading(float value) {
                value += u_shading_brightness;
                value = (value - 0.5) * u_shading_contrast + 0.5;
                value = smoothstep(u_shading_threshold, u_shading_threshold + u_shading_softness, value);
                if (u_shading_gamma > 0.0) value = pow(value, u_shading_gamma);
                return clamp(value, 0.0, 1.0);
            }

            void main() {
                // Calculate the world coordinate for this pixel
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);

                // Scale and animate the world coordinate
                vec2 uv = world_coord / 100.0 * u_noise_scale;
                uv += u_time * u_windDirection;
                
                float rawCloudValue = fbm(uv);
                float shadedCloudValue = applyShading(rawCloudValue);
                
                gl_FragColor = vec4(vec3(shadedCloudValue), 1.0);
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        u_time: 0,
        u_windDirection: [0.01, 0.01],
        u_camera_offset: [0, 0],
        u_view_size: [1, 1],
        u_noise_scale: 0.1,
        u_noise_octaves: 5,
        u_noise_persistence: 0.5,
        u_noise_lacunarity: 2.5,
        u_shading_threshold: 1,
        u_shading_softness: 0.2,
        u_shading_brightness: 0.51,
        u_shading_contrast: 1,
        u_shading_gamma: 1,
        ...options
      });
    }
  };
  var IridescenceFilter = class _IridescenceFilter extends PIXI.Filter {
    static MAX_OCTAVES = 8;
    // The constant is now defined here.
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            const int MAX_OCTAVES = ${_IridescenceFilter.MAX_OCTAVES}; // Injected from JS
            const int MAX_COLORS = 8;

            // Input Textures
            uniform sampler2D uSampler;
            uniform sampler2D uMaskTexture;
            uniform sampler2D uDistortionMap;

            // World & Camera Uniforms
            uniform float uParallax;
            uniform vec2 uCameraOffset;
            uniform vec2 uViewSize;
            uniform vec2 uResolution;

            // Effect Uniforms
            uniform float uTime;
            uniform float uSpeed;
            uniform float uScale;
            uniform float uIntensity;
            uniform float uDistortionStrength;

            // FBM Uniforms
            uniform int uOctaves;
            uniform float uPersistence;
            uniform float uLacunarity;
            uniform float uFbmEvolution;
            uniform float uFbmBrightness;
            uniform float uFbmContrast;

            // Gradient Uniforms
            uniform vec3 uGradientColors[MAX_COLORS];
            uniform int uNumColors;
            uniform float uHueShift;
            uniform float uGradientBrightness;
            uniform float uGradientContrast;

            // --- NOISE FUNCTIONS ---
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }

            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                           mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
            }

            float fbm(vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                for (int i = 0; i < MAX_OCTAVES; i++) {
                    if (i >= uOctaves) break;
                    value += amplitude * noise(st * frequency);
                    st *= uLacunarity;
                    amplitude *= uPersistence;
                }
                return value;
            }

            // --- COLOR FUNCTIONS ---
            float hue2rgb(float p, float q, float t) {
                if (t < 0.0) t += 1.0;
                if (t > 1.0) t -= 1.0;
                if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                if (t < 1.0/2.0) return q;
                if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                return p;
            }

            vec3 hsl2rgb(vec3 c) {
                if (c.y == 0.0) return vec3(c.z);
                float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
                float p = 2.0 * c.z - q;
                return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0));
            }

            vec3 rgb2hsl(vec3 c) {
                float max_c = max(max(c.r, c.g), c.b);
                float min_c = min(min(c.r, c.g), c.b);
                float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                if (max_c != min_c) {
                    float d = max_c - min_c;
                    s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                    if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                    else if (max_c == c.g) h = (c.b - c.r) / d + 2.0;
                    else h = (c.r - c.g) / d + 4.0;
                    h /= 6.0;
                }
                return vec3(h, s, l);
            }

            vec3 getGradientColor(float t) {
                if (uNumColors <= 1) { return uGradientColors[0]; }
                float pos = t * float(uNumColors - 1);
                float mix_factor = fract(pos);
                if (pos < 1.0) { return mix(uGradientColors[0], uGradientColors[1], mix_factor); }
                else if (pos < 2.0) { return mix(uGradientColors[1], uGradientColors[2], mix_factor); }
                else if (pos < 3.0) { return mix(uGradientColors[2], uGradientColors[3], mix_factor); }
                else if (pos < 4.0) { return mix(uGradientColors[3], uGradientColors[4], mix_factor); }
                else if (pos < 5.0) { return mix(uGradientColors[4], uGradientColors[5], mix_factor); }
                else if (pos < 6.0) { return mix(uGradientColors[5], uGradientColors[6], mix_factor); }
                else if (pos < 7.0) { return mix(uGradientColors[6], uGradientColors[7], mix_factor); }
                else { return uGradientColors[7]; }
            }

            void main(void) {
                float maskValue = texture2D(uMaskTexture, vTextureCoord).r;
                if (maskValue < 0.01) {
                    discard;
                }

                vec2 worldCoord = uCameraOffset + (vTextureCoord * uViewSize);
                vec2 screenCoord = vTextureCoord * uResolution;
                vec2 parallaxCoord = mix(worldCoord, screenCoord, uParallax);

                vec2 distortionOffset = (texture2D(uDistortionMap, vTextureCoord).rg - 0.5) * 2.0;
                vec2 distortedCoord = parallaxCoord + (distortionOffset * uDistortionStrength * 10.0);

                vec2 scaledPatternUv = distortedCoord * uScale * 0.01;
                
                // Animate both directional drift and internal evolution
                vec2 fbm_uv = scaledPatternUv;
                fbm_uv += vec2(uTime * uSpeed * 0.1); // Scaled down directional drift
                fbm_uv.x += uTime * uFbmEvolution * 0.1; // Slower time evolution

                float patternDriver = fbm(fbm_uv);

                // Apply brightness and contrast to the raw noise value
                patternDriver = (patternDriver - 0.5 + uFbmBrightness) * uFbmContrast + 0.5;

                vec3 baseColor = getGradientColor(clamp(patternDriver, 0.0, 1.0));
                vec3 hsl = rgb2hsl(baseColor);
                hsl.x = fract(hsl.x + uHueShift);
                vec3 shiftedColor = hsl2rgb(hsl);
                shiftedColor += uGradientBrightness;
                shiftedColor = (shiftedColor - 0.5) * uGradientContrast + 0.5;

                vec3 finalRgb = clamp(shiftedColor, 0.0, 1.0) * uIntensity * maskValue;
                gl_FragColor = vec4(finalRgb, uIntensity * maskValue);
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        // Textures
        uMaskTexture: PIXI.Texture.EMPTY,
        uDistortionMap: PIXI.Texture.EMPTY,
        // World
        uParallax: options.parallax ?? 0,
        uCameraOffset: [0, 0],
        uViewSize: [1, 1],
        uResolution: [1, 1],
        // Effect
        uTime: 0,
        uSpeed: options.speed ?? 0,
        uScale: options.scale ?? 8,
        uIntensity: options.intensity ?? 1,
        uDistortionStrength: options.distortion?.strength ?? 0,
        // FBM
        uOctaves: options.fbm?.octaves ?? 5,
        uPersistence: options.fbm?.persistence ?? 0.5,
        uLacunarity: options.fbm?.lacunarity ?? 2,
        uFbmEvolution: options.fbm?.evolution ?? 0.1,
        uFbmBrightness: (options.fbm?.brightness ?? 0.5) - 0.5,
        uFbmContrast: options.fbm?.contrast ?? 1,
        // Gradient
        uGradientColors: [],
        uNumColors: 0,
        uHueShift: options.gradient?.hueShift ?? 0,
        uGradientBrightness: options.gradient?.brightness ?? 0,
        uGradientContrast: options.gradient?.contrast ?? 1
      });
    }
  };
  var IridescenceLayer = class extends MaskedEffectLayer {
    constructor() {
      super({ maskSuffix: "iridescence" });
      this.iridescenceFilter = null;
      this.effectSprite = null;
      this.distortionNoiseManager = null;
      this._framesSinceLoad = 0;
    }
    async _draw(options) {
      await super._draw(options);
      this._framesSinceLoad = 0;
      this.blendMode = PIXI.BLEND_MODES.NORMAL;
      const renderer = canvas.app.renderer;
      this.distortionNoiseManager = new NoiseTextureManager(renderer, "iridescence.noise", true);
      try {
        this.iridescenceFilter = new IridescenceFilter();
        systemStatus.update("shaders", "iridescence", {
          state: "ok",
          message: "Compiled successfully."
        });
      } catch (e) {
        console.error("MapShine | Failed to create IridescenceFilter", e);
        systemStatus.update("shaders", "iridescence", {
          state: "error",
          message: `Compilation Failed: ${e.message}`
        });
      }
      this.effectSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this.effectSprite.filters = this.iridescenceFilter ? [this.iridescenceFilter] : [];
      this.addChild(this.effectSprite);
      this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }
    _onAnimate(deltaTime) {
      super._onAnimate(deltaTime);
      if (this._destroyed || !this.visible || !this.iridescenceFilter)
        return;
      this._framesSinceLoad++;
      const hasActiveTargets = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some((s) => s.texture.valid);
      if (!hasActiveTargets || this._framesSinceLoad < 5) {
        this.effectSprite.visible = false;
        return;
      }
      this.effectSprite.visible = true;
      this.distortionNoiseManager.update(deltaTime, canvas.app.renderer);
      const stage = canvas.stage;
      const screen = canvas.app.screen;
      const topLeft = stage.toLocal({
        x: 0,
        y: 0
      });
      const u = this.iridescenceFilter.uniforms;
      u.uTime += deltaTime;
      u.uDistortionMap = this.distortionNoiseManager.getTexture();
      u.uMaskTexture = this.getMaskTexture();
      u.uCameraOffset = [topLeft.x, topLeft.y];
      u.uViewSize = [screen.width / stage.scale.x, screen.height / stage.scale.y];
      u.uResolution = [screen.width, screen.height];
      this.effectSprite.position.copyFrom(topLeft);
      this.effectSprite.width = screen.width / stage.scale.x;
      this.effectSprite.height = screen.height / stage.scale.y;
    }
    async updateFromConfig(config) {
      const iConfig = config.iridescence;
      this.visible = config.enabled && iConfig.enabled;
      if (this.effectSprite) {
        this.effectSprite.blendMode = iConfig.blendMode;
      }
      this.distortionNoiseManager?.updateFromConfig(config);
      if (this.iridescenceFilter) {
        const u = this.iridescenceFilter.uniforms;
        u.uIntensity = iConfig.intensity;
        u.uSpeed = iConfig.speed;
        u.uScale = iConfig.scale;
        u.uParallax = iConfig.parallax;
        u.uDistortionStrength = iConfig.distortion.enabled ? iConfig.distortion.strength : 0;
        const fbmConfig = iConfig.fbm;
        if (fbmConfig) {
          u.uOctaves = fbmConfig.octaves;
          u.uPersistence = fbmConfig.persistence;
          u.uLacunarity = fbmConfig.lacunarity;
          u.uFbmEvolution = fbmConfig.evolution;
          u.uFbmBrightness = (fbmConfig.brightness ?? 0.5) - 0.5;
          u.uFbmContrast = fbmConfig.contrast;
        }
        const gConfig = iConfig.gradient;
        const gradientData = GRADIENT_PRESETS[gConfig.name];
        if (gradientData) {
          u.uGradientColors = gradientData.colors.flatMap((hex) => hexToRgbArray(hex));
          u.uNumColors = gradientData.colors.length;
        }
        u.uHueShift = gConfig.hueShift;
        u.uGradientBrightness = gConfig.brightness;
        u.uGradientContrast = gConfig.contrast;
      }
      this._needsMaskUpdate = true;
    }
    _onResize() {
      super._onResize();
      const renderer = canvas.app.renderer;
      this.distortionNoiseManager?.resize(renderer);
      if (this.effectSprite) {
        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({
          x: 0,
          y: 0
        });
        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
      }
    }
    async _tearDown(options) {
      this.distortionNoiseManager?.destroy();
      this.iridescenceFilter?.destroy();
      this.effectSprite?.destroy();
      this.distortionNoiseManager = null;
      this.iridescenceFilter = null;
      this.effectSprite = null;
      await super._tearDown(options);
    }
  };
  var AmbientColorFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat3 projectionMatrix;

            varying vec2 vTextureCoord; 
            varying vec2 vScreenCoord;  

            void main(void)
            {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;

                vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }
        `;
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord; 

            uniform sampler2D uSampler;

            uniform float uSaturation, uBrightness, uContrast, uGamma;
            uniform vec3 uTintColor;
            uniform float uTintAmount;
            uniform float u_intensity;

            uniform sampler2D uTokenMask;
            uniform bool uTokenMaskEnabled;
            uniform float uTokenMaskThreshold;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {

                if (uTokenMaskEnabled) {

                    float maskValue = texture2D(uTokenMask, vScreenCoord).r;
                    if (maskValue > uTokenMaskThreshold) {
                        discard;
                    }
                }

                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                if (originalColor.a == 0.0) {
                    discard;
                }

                vec3 workingColor = originalColor.rgb;

                if (uGamma > 0.0) {
                    workingColor = pow(workingColor, vec3(1.0 / uGamma));
                }
                workingColor += uBrightness;
                workingColor = (workingColor - 0.5) * uContrast + 0.5;
                float final_luminance = dot(workingColor, lum_weights);
                workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                workingColor = mix(workingColor, uTintColor, uTintAmount);

                workingColor *= u_intensity;

                vec3 premultiplied_rgb = workingColor * originalColor.a;
                gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
            }
        `;
      super(vertexSrc, fragmentSrc, {
        uSaturation: options.saturation ?? 1,
        uBrightness: options.brightness ?? 0,
        uContrast: options.contrast ?? 1,
        uGamma: options.gamma ?? 1,
        uTintColor: options.tintColor ?? [1, 1, 1],
        uTintAmount: options.tintAmount ?? 0,
        u_intensity: options.intensity ?? 1,
        uTokenMask: PIXI.Texture.EMPTY,
        uTokenMaskEnabled: false,
        uTokenMaskThreshold: options.tokenMaskThreshold ?? 0.1
      });
    }
  };
  var AmbientLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor() {
      super();
      this.effectSprites = /* @__PURE__ */ new Map();
      this.colorFilter = null;
      this._destroyed = false;
      this._onAnimateBound = this._onAnimate.bind(this);
      this._onResizeBound = this._onResize.bind(this);
    }
    async _draw(options) {
      console.log("AmbientLayer | Drawing layer.");
      this.colorFilter = new AmbientColorFilter();
      this.blendMode = PIXI.BLEND_MODES.NORMAL;
      this._onResize();
      window.addEventListener("resize", this._onResizeBound);
      canvas.app.ticker.add(this._onAnimateBound);
    }
    async _tearDown(options) {
      this._destroyed = true;
      console.log("AmbientLayer | Tearing down layer.");
      canvas.app.ticker.remove(this._onAnimateBound);
      window.removeEventListener("resize", this._onResizeBound);
      this.colorFilter?.destroy();
      super._tearDown(options);
      this.effectSprites.clear();
    }
    _onAnimate() {
      if (this._destroyed || !this.visible)
        return;
      if (this.colorFilter) {
        const aConfig = game.mapShine.profileManager.activeConfig.ambient;
        const tmConfig = aConfig.tokenMasking;
        const u = this.colorFilter.uniforms;
        u.uTokenMaskEnabled = tmConfig.enabled && !!canvas.mapShine?.tokenMaskManager;
        if (u.uTokenMaskEnabled) {
          u.uTokenMask = canvas.mapShine.tokenMaskManager.getMaskTexture();
        }
      }
    }
    _onResize() {
      if (game.mapShine?.effectTargetManager?.targets) {
        this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
      }
    }
    async updateEffectTargets(targets) {
      if (!this.visible) {
        if (this.children.length > 0) {
          this.removeChildren().forEach((c) => c.destroy());
          this.effectSprites.clear();
        }
        return;
      }
      const validTargetIds = /* @__PURE__ */ new Set();
      const allTargets = new Map([
        ["background", targets.background],
        ...targets.tiles.entries()
      ]);
      for (const [id, targetData] of allTargets.entries()) {
        if (!targetData?.ambient)
          continue;
        validTargetIds.add(id);
        let effectSprite = this.effectSprites.get(id);
        if (!effectSprite) {
          effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          if (this.colorFilter) {
            effectSprite.filters = [this.colorFilter];
          }
          this.effectSprites.set(id, effectSprite);
          this.addChild(effectSprite);
        }
        await this._updateSpriteTransform(effectSprite, targetData.ambient, targetData.rect);
      }
      for (const [id, sprite] of this.effectSprites.entries()) {
        if (!validTargetIds.has(id)) {
          sprite.destroy();
          this.effectSprites.delete(id);
        }
      }
      await this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }
    async _updateSpriteTransform(sprite, texturePath, rect) {
      const currentPath = sprite.texture?.baseTexture?.resource?.src;
      if (texturePath !== currentPath) {
        try {
          sprite.texture = await foundry.canvas.loadTexture(texturePath);
        } catch (e) {
          sprite.texture = PIXI.Texture.EMPTY;
        }
      }
      if (!sprite.texture.valid || !rect)
        return;
      sprite.anchor.set(0.5);
      sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
      sprite.width = rect.width;
      sprite.height = rect.height;
      sprite.rotation = rect.rotation || 0;
    }
    async updateFromConfig(config) {
      const aConfig = config.ambient;
      const ccConfig = aConfig.colorCorrection;
      this.visible = config.enabled && aConfig.enabled;
      this.blendMode = PIXI.BLEND_MODES.NORMAL;
      this.alpha = 1;
      for (const sprite of this.effectSprites.values()) {
        sprite.blendMode = aConfig.blendMode;
        sprite.alpha = 1;
      }
      if (this.colorFilter) {
        this.colorFilter.enabled = ccConfig.enabled;
        const u = this.colorFilter.uniforms;
        u.uSaturation = ccConfig.saturation;
        u.uBrightness = ccConfig.brightness;
        u.uContrast = ccConfig.contrast;
        u.uGamma = ccConfig.gamma;
        u.uTintColor = hexToRgbArray(ccConfig.tint.color);
        u.uTintAmount = ccConfig.tint.amount;
        u.u_intensity = aConfig.intensity;
        u.uTokenMaskThreshold = aConfig.tokenMasking.threshold;
      }
      const mConfig = aConfig.masking;
      const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
      const shouldBeMasked = this.visible && mConfig.enabled && !!illuminationAPI;
      if (!shouldBeMasked && this.mask) {
        this.mask = null;
      } else if (shouldBeMasked && !this.mask) {
      }
    }
  };
  var GroundGlowLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor() {
      super();
      this.effectSprites = /* @__PURE__ */ new Map();
      this.maskGenerator = null;
      this.lightingMask = null;
      this.colorFilter = null;
      this._destroyed = false;
      this._onAnimateBound = this._onAnimate.bind(this);
      this._onResizeBound = this._onResize.bind(this);
    }
    async _draw(options) {
      console.log("GroundGlowLayer | Drawing layer with improved dependency handling.");
      this.maskGenerator = new LightingMaskGenerator();
      this.colorFilter = new AmbientColorFilter();
      this.container = new PIXI.Container();
      this.addChild(this.container);
      this.lightingMask = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
      this.container.mask = null;
      this._onResize();
      window.addEventListener("resize", this._onResizeBound);
      canvas.app.ticker.add(this._onAnimateBound, this);
    }
    async _tearDown(options) {
      this._destroyed = true;
      console.log("GroundGlowLayer | Tearing down layer.");
      if (this.container) {
        this.container.mask = null;
      }
      canvas.app.ticker.remove(this._onAnimateBound, this);
      window.removeEventListener("resize", this._onResizeBound);
      this.maskGenerator?.destroy();
      this.lightingMask?.destroy();
      this.container?.destroy({
        children: true,
        texture: true
      });
      this.effectSprites.clear();
      this.colorFilter?.destroy();
      this.maskGenerator = this.container = this.lightingMask = this.colorFilter = null;
      return super._tearDown(options);
    }
    async updateEffectTargets(targets) {
      if (!this.container)
        return;
      const config = game.mapShine.profileManager.activeConfig;
      const ggConfig = config.groundGlow;
      const isConfigEnabled = config.enabled && ggConfig.enabled;
      this.visible = isConfigEnabled;
      this.container.visible = isConfigEnabled;
      if (!isConfigEnabled) {
        if (this.effectSprites.size > 0) {
          for (const sprite of this.effectSprites.values()) {
            sprite.destroy();
          }
          this.effectSprites.clear();
        }
        return;
      }
      const validTargetIds = /* @__PURE__ */ new Set();
      const allTargets = new Map([
        ["background", targets.background],
        ...targets.tiles.entries()
      ]);
      for (const [id, targetData] of allTargets.entries()) {
        if (!targetData?.groundGlow)
          continue;
        validTargetIds.add(id);
        let sprite = this.effectSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          sprite.filters = [this.colorFilter];
          this.effectSprites.set(id, sprite);
          this.container.addChild(sprite);
        }
        await this._updateSpriteTransform(sprite, targetData.groundGlow, targetData.rect);
      }
      for (const [id, sprite] of this.effectSprites.entries()) {
        if (!validTargetIds.has(id)) {
          sprite.destroy();
          this.effectSprites.delete(id);
        }
      }
      await this.updateFromConfig(config);
    }
    async _updateSpriteTransform(sprite, texturePath, rect) {
      const currentPath = sprite.texture?.baseTexture?.resource?.src;
      if (texturePath !== currentPath) {
        try {
          sprite.texture = await foundry.canvas.loadTexture(texturePath);
        } catch (e) {
          sprite.texture = PIXI.Texture.EMPTY;
        }
      }
      if (!sprite.texture.valid || !rect)
        return;
      sprite.anchor.set(0.5);
      sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
      sprite.width = rect.width;
      sprite.height = rect.height;
      sprite.rotation = rect.rotation || 0;
    }
    _updateMaskTransform() {
      if (!this.lightingMask || !canvas?.stage)
        return;
      const stage = canvas.stage;
      const screen = canvas.app.renderer.screen;
      const topLeft = stage.toLocal({
        x: 0,
        y: 0
      });
      this.lightingMask.position.copyFrom(topLeft);
      this.lightingMask.width = screen.width / stage.scale.x;
      this.lightingMask.height = screen.height / stage.scale.y;
    }
    _onAnimate() {
      if (this._destroyed || !this.visible || !this.container)
        return;
      const ggConfig = game.mapShine.profileManager.activeConfig.groundGlow;
      const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
      const illuminationTexture = illuminationAPI?.getLightingTexture();
      if (!illuminationAPI || !illuminationTexture?.valid) {
        if (this.container.mask) {
          this.container.mask = null;
        }
        return;
      }
      if (!this.container.mask) {
        this.container.mask = this.lightingMask;
      }
      if (this.colorFilter) {
        const tmConfig = ggConfig.tokenMasking;
        const u = this.colorFilter.uniforms;
        u.uTokenMaskEnabled = tmConfig.enabled && !!canvas.mapShine?.tokenMaskManager;
        if (u.uTokenMaskEnabled) {
          u.uTokenMask = canvas.mapShine.tokenMaskManager.getMaskTexture();
        }
      }
      this.maskGenerator.update(
        canvas.app.renderer,
        illuminationTexture,
        ggConfig.luminanceThreshold,
        ggConfig.softness,
        ggConfig.invert
      );
      this._updateMaskTransform();
    }
    async updateFromConfig(config) {
      if (!this.container || !this.colorFilter)
        return;
      const ggConfig = config.groundGlow;
      this.visible = config.enabled && ggConfig.enabled;
      this.container.visible = this.visible;
      if (!this.visible)
        return;
      this.container.blendMode = ggConfig.blendMode;
      const u = this.colorFilter.uniforms;
      u.u_intensity = ggConfig.intensity;
      u.uBrightness = ggConfig.brightness - 1;
      u.uSaturation = ggConfig.saturation;
      u.uContrast = 1;
      u.uGamma = 1;
      u.uTintAmount = 0;
      u.uTokenMaskThreshold = ggConfig.tokenMasking.threshold;
      for (const sprite of this.effectSprites.values()) {
        sprite.alpha = 1;
      }
    }
    _onResize() {
      this.maskGenerator?.resize(canvas.app.screen.width, canvas.app.screen.height);
      this._updateMaskTransform();
      if (game.mapShine?.effectTargetManager?.targets) {
        this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
      }
    }
  };
  var HeatDistortionFilter = class extends PIXI.Filter {
    constructor(options = {}) {
      const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord; 

            uniform sampler2D uSampler;          
            uniform sampler2D u_displacementMap; 
            uniform sampler2D u_intensityMask;   

            uniform float u_intensity;

            void main(void) {

                float mask_value = texture2D(u_intensityMask, vTextureCoord).r;

                if (mask_value == 0.0) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }

                vec2 displacement = (texture2D(u_displacementMap, vTextureCoord).rg - 0.5) * 2.0;

                vec2 offset = displacement * u_intensity * mask_value;

                gl_FragColor = texture2D(uSampler, vTextureCoord + offset);
            }
        `;
      super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
        u_displacementMap: PIXI.Texture.EMPTY,
        u_intensityMask: PIXI.Texture.EMPTY,
        u_intensity: options.intensity ?? 0.01
      });
    }
  };
  var HeatDistortionLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor() {
      super();
      this.heatSourceContainer = null;
      this.combinedMaskTexture = null;
      this.noiseManager = null;
      this.heatSprites = /* @__PURE__ */ new Map();
      this._needsMaskUpdate = true;
      this._destroyed = false;
      this._framesSinceLoad = 0;
    }
    async _draw(options) {
      console.log("HeatDistortionLayer | Drawing layer with robust state management.");
      this.visible = false;
      this._onAnimateBound = this._onAnimate.bind(this);
      this._onResizeBound = this._onResize.bind(this);
      this._onPanBound = this._onPan.bind(this);
      this._framesSinceLoad = 0;
      this._needsMaskUpdate = true;
      this._destroyed = false;
      this.heatSourceContainer = new PIXI.Container();
      this.addChild(this.heatSourceContainer);
      const renderer = canvas.app.renderer;
      this.combinedMaskTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height
      });
      this.noiseManager = new NoiseTextureManager(renderer, "heatDistortion.noise");
      canvas.app.ticker.add(this._onAnimateBound);
      window.addEventListener("resize", this._onResizeBound);
      if (!game.modules.get("libwrapper")?.active) {
        Hooks.on("canvasPan", this._onPanBound);
      }
    }
    _onPan() {
      this._needsMaskUpdate = true;
    }
    async updateEffectTargets(targets) {
      if (!this.heatSourceContainer)
        return;
      const validTargetIds = /* @__PURE__ */ new Set();
      const allTargets = new Map([
        ["background", targets.background],
        ...targets.tiles.entries()
      ]);
      for (const [id, targetData] of allTargets.entries()) {
        if (!targetData?.heat)
          continue;
        validTargetIds.add(id);
        let sprite = this.heatSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.heatSprites.set(id, sprite);
          this.heatSourceContainer.addChild(sprite);
        }
        await this._updateSpriteTransform(sprite, targetData.heat, targetData.rect);
      }
      for (const [id, sprite] of this.heatSprites.entries()) {
        if (!validTargetIds.has(id)) {
          sprite.destroy();
          this.heatSprites.delete(id);
        }
      }
      this._needsMaskUpdate = true;
    }
    async _updateSpriteTransform(sprite, texturePath, rect) {
      const currentPath = sprite.texture?.baseTexture?.resource?.src;
      if (texturePath !== currentPath) {
        try {
          sprite.texture = await foundry.canvas.loadTexture(texturePath);
        } catch (e) {
          sprite.texture = PIXI.Texture.EMPTY;
        }
      }
      if (!sprite.texture.valid || !rect)
        return;
      sprite.anchor.set(0.5);
      sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
      sprite.width = rect.width;
      sprite.height = rect.height;
      sprite.rotation = rect.rotation || 0;
    }
    _onAnimate(deltaTime) {
      if (this._destroyed)
        return;
      this._framesSinceLoad++;
      const heatFilter = ScreenEffectsManager.getFilter("heatDistortion");
      if (heatFilter) {
        heatFilter.enabled = false;
      }
      const mainConfig = game.mapShine.profileManager.activeConfig;
      const config = mainConfig.heatDistortion;
      if (!mainConfig.enabled || !config.enabled || !heatFilter) {
        return;
      }
      const hasActiveHeatSources = this.heatSprites.size > 0 && Array.from(this.heatSprites.values()).some((s) => s.texture.valid);
      if (!hasActiveHeatSources) {
        return;
      }
      const noiseTexture = this.noiseManager?.getTexture();
      if (!noiseTexture?.valid) {
        return;
      }
      if (this._framesSinceLoad < 5) {
        return;
      }
      heatFilter.enabled = true;
      if (this._needsMaskUpdate) {
        canvas.app.renderer.render(this.heatSourceContainer, {
          renderTexture: this.combinedMaskTexture,
          transform: canvas.stage.transform.worldTransform,
          clear: true
        });
        this._needsMaskUpdate = false;
      }
      this.noiseManager.update(deltaTime, canvas.app.renderer);
      const u = heatFilter.uniforms;
      u.u_intensity = config.intensity;
      u.u_displacementMap = noiseTexture;
      u.u_intensityMask = this.combinedMaskTexture;
    }
    async updateFromConfig(config) {
      this.noiseManager?.updateFromConfig(config);
      this._needsMaskUpdate = true;
    }
    _onResize() {
      const renderer = canvas.app.renderer;
      this.combinedMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
      this.noiseManager?.resize(renderer);
      if (game.mapShine?.effectTargetManager?.targets) {
        this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
      }
      this._needsMaskUpdate = true;
    }
    async _tearDown(options) {
      console.log("HeatDistortionLayer | Tearing down layer completely.");
      if (this._destroyed)
        return;
      this._destroyed = true;
      if (this._onAnimateBound)
        canvas.app.ticker.remove(this._onAnimateBound);
      if (this._onResizeBound)
        window.removeEventListener("resize", this._onResizeBound);
      if (this._onPanBound)
        Hooks.off("canvasPan", this._onPanBound);
      this.noiseManager?.destroy();
      this.combinedMaskTexture?.destroy(true);
      this.heatSourceContainer?.destroy({
        children: true,
        texture: true,
        baseTexture: true
      });
      this.heatSprites.clear();
      this.heatSourceContainer = null;
      this.combinedMaskTexture = null;
      this.noiseManager = null;
      return super._tearDown(options);
    }
  };
  var LoadingScreen = class {
    constructor() {
      this.element = null;
      this.fadeOutDuration = 500;
      this.minDisplayTime = 1500;
      this.startTime = 0;
      this.fillElement = null;
      this.statusTextElement = null;
      this._textLoopActive = false;
      this.statusFadeDuration = 400;
      this.minStatusDisplayTime = 2e3;
      this.imaginativeMessages = [
        "Polishing the Specular...",
        "Herding Pixels into Place...",
        "Reticulating Splines...",
        "Discovering Hidden Textures...",
        "Calibrating Color Tones...",
        "Waking the Sprites...",
        "Configuring Effect Layers...",
        "Initializing Scene Managers...",
        "Conjuring Procedural Noise...",
        "Unfolding Dimensions...",
        "Aligning Ley Lines...",
        "Consulting the Oracles...",
        "Buffing the Bloom...",
        "Sharpening Shaders...",
        "Generating Dust Motes...",
        "Simulating Cloud Shadows...",
        "Applying Chromatic Aberration..."
      ];
    }
    show() {
      if (this.element)
        return;
      this.startTime = Date.now();
      this.element = document.createElement("div");
      this.element.id = "map-shine-loading-screen";
      this.element.style.opacity = "0";
      this.element.innerHTML = `
            <div class="loading-content">
                <img src="modules/map-shine/assets/fvtt.png" class="loading-logo" alt="Foundry VTT Logo">
                <h2 class="loading-subhead">Mythica Machina Presents...</h2>
                <h1 class="loading-title">Map Shine</h1>
                <div class="loading-bar-container">
                    <div class="loading-bar-fill"></div>
                </div>
                <div id="loading-status-text" class="loading-status"></div>
            </div>
            <style>

                #map-shine-loading-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 1); z-index: 100000; display: flex; justify-content: center; align-items: center; color: white; font-family: Signika, sans-serif; transition: opacity ${this.fadeOutDuration / 1e3}s ease-in-out; }
                .loading-content { text-align: center; }
                .loading-logo { width: 150px; height: auto; margin: 0 auto 10px auto; display: block; filter: drop-shadow(0 0 10px rgba(0,0,0,0.6)); }
                .loading-subhead { font-size: 24px; font-weight: normal; color: #bbb; margin: 0 0 10px 0; text-shadow: 0 0 5px #111; }
                .loading-title { font-size: 72px; margin: 0 0 30px 0; text-shadow: 0 0 10px #222; }
                .loading-bar-container { width: 400px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.5); margin: 0 auto; background-color: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; }
                .loading-bar-fill { width: 0%; height: 100%; background-color: rgba(255, 255, 255, 0.9); transform-origin: left; transition: width 0.2s ease-out; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
                .loading-status { margin-top: 15px; font-size: 16px; color: #ddd; height: 20px; line-height: 20px; opacity: 0; transition: opacity ${this.statusFadeDuration / 1e3}s ease-in-out; }
            </style>
        `;
      document.body.appendChild(this.element);
      this.fillElement = this.element.querySelector(".loading-bar-fill");
      this.statusTextElement = this.element.querySelector("#loading-status-text");
      this.statusTextElement.innerText = "Loading...";
      this.statusTextElement.style.opacity = "1";
      this._textLoopActive = true;
      this._runTextLoop();
      void this.element.offsetHeight;
      this.element.style.opacity = "1";
    }
    setProgress(progress) {
      if (!this.fillElement)
        return;
      const p = Math.min(100, Math.max(0, progress));
      this.fillElement.style.width = `${p}%`;
    }
    async _runTextLoop() {
      while (this._textLoopActive) {
        await new Promise((resolve) => setTimeout(resolve, this.minStatusDisplayTime));
        if (!this._textLoopActive)
          break;
        this.statusTextElement.style.opacity = "0";
        await new Promise((resolve) => setTimeout(resolve, this.statusFadeDuration));
        if (!this._textLoopActive)
          break;
        const newText = this.imaginativeMessages[Math.floor(Math.random() * this.imaginativeMessages.length)];
        this.statusTextElement.innerText = newText;
        this.statusTextElement.style.opacity = "1";
      }
    }
    async hide() {
      if (!this.element || !this.fillElement)
        return;
      this._textLoopActive = false;
      this.statusTextElement.style.opacity = "0";
      await new Promise((resolve) => setTimeout(resolve, this.statusFadeDuration));
      this.statusTextElement.innerText = "Almost ready...";
      this.statusTextElement.style.opacity = "1";
      await new Promise((resolve) => setTimeout(resolve, this.statusFadeDuration));
      const fakeLoadDuration = 3e3;
      this.fillElement.style.transition = `width ${fakeLoadDuration / 1e3}s ease-in-out`;
      this.setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, fakeLoadDuration));
      if (this.element) {
        this.element.style.opacity = "0";
        await new Promise((resolve) => setTimeout(resolve, this.fadeOutDuration + 100));
      }
      this.element?.remove();
      this.element = null;
      this.fillElement = null;
      this.statusTextElement = null;
    }
  };
  var CLIENT_OVERRIDES_CONFIG = {
    baseShine: {
      name: "Metallic Shine",
      path: "baseShine",
      intensitySubPath: "animation.globalIntensity"
    },
    cloudShadows: {
      name: "Cloud Shadows",
      path: "cloudShadows",
      intensitySubPath: "shadowIntensity"
    },
    canopy: {
      name: "Canopy Shadows",
      path: "canopy",
      intensitySubPath: "shadowIntensity"
    },
    structuralShadows: {
      name: "Structural Shadows",
      path: "structuralShadows",
      intensitySubPath: "shadowIntensity"
    },
    iridescence: {
      name: "Iridescence",
      path: "iridescence",
      intensitySubPath: "intensity"
    },
    ambient: {
      name: "Ambient / Emissive",
      path: "ambient",
      intensitySubPath: "intensity"
    },
    groundGlow: {
      name: "Glow in the Dark",
      path: "groundGlow",
      intensitySubPath: "intensity"
    },
    heatDistortion: {
      name: "Heat Distortion",
      path: "heatDistortion",
      intensitySubPath: "intensity"
    },
    prism: {
      name: "Prism",
      path: "prism",
      intensitySubPath: "intensity"
    },
    advancedBloom: {
      name: "Global Bloom",
      path: "advancedBloom",
      intensitySubPath: "brightness"
    },
    vignette: {
      name: "Post: Vignette",
      path: "postProcessing.vignette",
      intensitySubPath: "amount"
    },
    chromaticAberration: {
      name: "Post: Chromatic Aberration",
      path: "postProcessing.chromaticAberration",
      intensitySubPath: "amount"
    },
    postProcessing: {
      name: "Post Processing (Group)",
      path: "postProcessing"
    }
  };
  var ClientOverrides = class {
    static apply(config) {
      for (const [key, data] of Object.entries(CLIENT_OVERRIDES_CONFIG)) {
        const enabledSetting = game.settings.get(MODULE_ID, `user-${key}-enabled`);
        if (enabledSetting === false) {
          foundry.utils.setProperty(config, `${data.path}.enabled`, false);
          continue;
        }
        if (data.intensitySubPath) {
          const intensitySetting = game.settings.get(MODULE_ID, `user-${key}-intensity`);
          if (intensitySetting !== 100) {
            const fullIntensityPath = `${data.path}.${data.intensitySubPath}`;
            const originalValue = foundry.utils.getProperty(config, fullIntensityPath);
            if (typeof originalValue === "number") {
              const newValue = originalValue * (intensitySetting / 100);
              foundry.utils.setProperty(config, fullIntensityPath, newValue);
            }
          }
        }
      }
      const disableDistortion = game.settings.get(MODULE_ID, "user-disable-distortion");
      if (disableDistortion) {
        if (config.heatDistortion)
          config.heatDistortion.enabled = false;
        if (config.postProcessing?.lensDistortion)
          config.postProcessing.lensDistortion.enabled = false;
      }
      const disableFringe = game.settings.get(MODULE_ID, "user-disable-color-fringe");
      if (disableFringe) {
        if (config.baseShine?.rgbSplit)
          config.baseShine.rgbSplit.enabled = false;
        if (config.postProcessing?.chromaticAberration)
          config.postProcessing.chromaticAberration.enabled = false;
      }
      return config;
    }
  };
  var ProfileManager = class {
    constructor() {
      this.moduleId = MODULE_ID;
      this.ui = null;
      this.activeConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
      this._sceneProfile = null;
      this._userOverrides = {};
      this.activeSceneId = null;
      this.status = {
        sceneProfileLoaded: false,
        isDirty: false,
        error: null
      };
      this._worldProfiles = {};
      this._defaultProfileName = "";
    }
    get isGm() {
      return game.user?.isGM;
    }
    /**
     * Sanitizes a settings object by comparing it against a template (the defaults).
     * It removes keys from the settings object if:
     * 1. The key no longer exists in the template.
     * 2. The type is mismatched (e.g., template has an object, but setting has a primitive).
     * This prevents errors when new versions of the module change setting structures.
     * @param {object} template - The canonical object structure (e.g., MODULE_DEFAULTS).
     * @param {object} settings - The object to clean (e.g., _userOverrides or a scene profile).
     */
    _reconcileOverrides(template, settings) {
      for (const key in settings) {
        if (!(key in template)) {
          delete settings[key];
          continue;
        }
        const templateValue = template[key];
        const settingValue = settings[key];
        const isTemplateObject = typeof templateValue === "object" && templateValue !== null && !Array.isArray(templateValue);
        const isSettingObject = typeof settingValue === "object" && settingValue !== null && !Array.isArray(settingValue);
        if (isTemplateObject && !isSettingObject) {
          delete settings[key];
          continue;
        }
        if (isTemplateObject && isSettingObject) {
          this._reconcileOverrides(templateValue, settingValue);
          if (Object.keys(settingValue).length === 0) {
            delete settings[key];
          }
        }
      }
      return settings;
    }
    initializeForScene() {
      this.activeSceneId = canvas.scene?.id;
      if (!this.activeSceneId) {
        console.error("MapShine | Could not initialize ProfileManager for scene: No active scene.");
        this.activeConfig = this._getEffectiveConfig();
        return;
      }
      this._worldProfiles = game.settings.get(this.moduleId, PROFILES_SETTING) || {};
      this._defaultProfileName = game.settings.get(this.moduleId, DEFAULT_PROFILE_SETTING) || "";
      let rawSceneProfile = canvas.scene?.getFlag(this.moduleId, "profile") || null;
      if (rawSceneProfile) {
        this._sceneProfile = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawSceneProfile);
      } else {
        this._sceneProfile = null;
      }
      this.status.sceneProfileLoaded = !!this._sceneProfile;
      const allUserOverrides = game.settings.get(this.moduleId, "user-adjustments") || {};
      let rawUserOverrides = allUserOverrides[this.activeSceneId] || {};
      this._userOverrides = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawUserOverrides);
      this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);
      this.activeConfig = this._getEffectiveConfig();
      console.log("Map Shine | Live configuration has been built and set for the current scene.");
    }
    async initializeUI(ui2) {
      this.ui = ui2;
      if (this.ui?.eventHandler) {
        await this.ui.eventHandler._populateProfilesDropdown();
      }
      this.updateUIState();
    }
    /**
     * Constructs the final configuration by layering defaults, scene profiles, and user overrides.
     * This version includes special handling for arrays to prevent data loss during merging.
     */
    _getEffectiveConfig() {
      let effectiveConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
      if (this._sceneProfile) {
        this._customMerge(effectiveConfig, this._sceneProfile);
      }
      if (this._userOverrides) {
        this._customMerge(effectiveConfig, this._userOverrides);
      }
      return ClientOverrides.apply(effectiveConfig);
    }
    /**
     * A custom merge utility that intelligently handles arrays and prevents
     * outdated primitive values from overwriting newer object structures.
     * @param {object} target - The object to merge into.
     * @param {object} source - The object to merge from.
     */
    _customMerge(target, source) {
      for (const key of Object.keys(source)) {
        const sourceValue = source[key];
        const targetValue = target[key];
        if (typeof sourceValue === "object" && sourceValue !== null && !Array.isArray(sourceValue)) {
          if (typeof targetValue !== "object" || targetValue === null || Array.isArray(targetValue)) {
            target[key] = {};
          }
          this._customMerge(target[key], sourceValue);
        } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
          sourceValue.forEach((item, index) => {
            if (targetValue[index] && typeof item === "object" && item !== null) {
              this._customMerge(targetValue[index], item);
            } else if (item !== void 0) {
              targetValue[index] = item;
            }
          });
        } else {
          if (typeof targetValue !== "object" || targetValue === null) {
            target[key] = sourceValue;
          }
        }
      }
    }
    async recordUserChange(path, value) {
      foundry.utils.setProperty(this._userOverrides, path, value);
      const allUserOverrides = game.settings.get(this.moduleId, "user-adjustments") || {};
      allUserOverrides[this.activeSceneId] = this._userOverrides;
      await game.settings.set(this.moduleId, "user-adjustments", allUserOverrides);
      this.activeConfig = this._getEffectiveConfig();
      this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);
      this.updateUIState();
    }
    async updateAllSystemsFromConfig() {
      if (!canvas?.ready)
        return;
      const config = this.activeConfig;
      for (const layer of canvas.layers) {
        if (typeof layer.updateFromConfig === "function") {
          try {
            await layer.updateFromConfig(config);
          } catch (e) {
            console.error(`MapShine | Error updating layer ${layer.constructor.name}`, e);
          }
        }
      }
      ScreenEffectsManager.updateAllFiltersFromConfig(config);
      if (game.mapShine.effectTargetManager) {
        game.mapShine.effectTargetManager.applyTileOpacities();
      }
    }
    async saveConfigToScene() {
      if (!this.isGm)
        return;
      const configToSave = this._getEffectiveConfig();
      await canvas.scene.setFlag(this.moduleId, "profile", configToSave);
      ui.notifications.info("FX Profile saved to current scene.");
      const allUserOverrides = game.settings.get(this.moduleId, "user-adjustments") || {};
      delete allUserOverrides[this.activeSceneId];
      await game.settings.set(this.moduleId, "user-adjustments", allUserOverrides);
      this.initializeForScene();
      await this.updateAllSystemsFromConfig();
      if (this.ui) {
        this.updateUIState();
        this.ui.eventHandler.updateAllControls();
      }
    }
    async revertToSceneDefault() {
      this._userOverrides = {};
      const allUserOverrides = game.settings.get(this.moduleId, "user-adjustments") || {};
      delete allUserOverrides[this.activeSceneId];
      await game.settings.set(this.moduleId, "user-adjustments", allUserOverrides);
      this.initializeForScene();
      await this.updateAllSystemsFromConfig();
      if (this.ui) {
        this.updateUIState();
        this.ui.eventHandler.updateAllControls();
      }
      ui.notifications.info("Reverted to scene default FX.");
    }
    async revertToModuleDefault() {
      this._userOverrides = {};
      const allUserOverrides = game.settings.get(this.moduleId, "user-adjustments") || {};
      allUserOverrides[this.activeSceneId] = {};
      await game.settings.set(this.moduleId, "user-adjustments", allUserOverrides);
      const originalSceneProfile = this._sceneProfile;
      this._sceneProfile = null;
      this.initializeForScene();
      this._sceneProfile = originalSceneProfile;
      await this.updateAllSystemsFromConfig();
      if (this.ui) {
        this.updateUIState();
        this.ui.eventHandler.updateAllControls();
      }
      ui.notifications.info("Reverted to module default FX for this session.");
    }
    updateUIState() {
      if (!this.ui?.element)
        return;
      const light = this.ui.element.querySelector("#fx-status-light");
      const text = this.ui.element.querySelector("#fx-status-text");
      const saveSceneBtn = this.ui.element.querySelector("#profile-save-scene");
      const revertSceneBtn = this.ui.element.querySelector("#profile-revert-scene");
      if (saveSceneBtn)
        saveSceneBtn.style.display = this.isGm ? "" : "none";
      if (revertSceneBtn)
        revertSceneBtn.disabled = !this.status.sceneProfileLoaded;
      if (!light || !text)
        return;
      light.className = "fx-status-light";
      if (this.status.error) {
        light.classList.add("red");
        text.textContent = `Error: ${this.status.error}`;
      } else if (this.status.sceneProfileLoaded) {
        if (this.status.isDirty) {
          light.classList.add("blue");
          text.textContent = "Scene Default (with your temporary changes)";
        } else {
          light.classList.add("green");
          text.textContent = "Scene Default (active)";
        }
      } else {
        if (this.status.isDirty) {
          light.classList.add("blue");
          text.textContent = "Module Default (with your temporary changes)";
        } else {
          light.classList.add("grey");
          text.textContent = "Module Default (active)";
        }
      }
    }
    async getProfiles() {
      return this._worldProfiles;
    }
    getDefaultProfileName() {
      return this._defaultProfileName;
    }
    async loadProfile(name) {
      const profileData = this._worldProfiles[name];
      if (!profileData)
        return null;
      let configToLoad = profileData.config || profileData;
      configToLoad = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), foundry.utils.deepClone(configToLoad));
      this._userOverrides = foundry.utils.deepClone(configToLoad);
      const allUserOverrides = game.settings.get(this.moduleId, "user-adjustments") || {};
      allUserOverrides[this.activeSceneId] = this._userOverrides;
      await game.settings.set(this.moduleId, "user-adjustments", allUserOverrides);
      this.initializeForScene();
      await this.updateAllSystemsFromConfig();
      if (this.ui) {
        this.updateUIState();
        this.ui.eventHandler.updateAllControls();
        this.ui.eventHandler.applyProfileUIState(profileData);
      }
      ui.notifications.info(`Profile "${name}" loaded.`);
      return profileData;
    }
    async saveProfile(name, config, uiState) {
      if (!name) {
        ui.notifications.warn("Please enter a name for the profile.");
        return false;
      }
      if (this._worldProfiles[name]) {
        const overwrite = await Dialog.confirm({
          title: "Profile Exists",
          content: `<p>A world profile named "<strong>${name}</strong>" already exists. Overwrite it?</p>`,
          defaultYes: false
        });
        if (!overwrite)
          return false;
      }
      this._worldProfiles[name] = {
        config: foundry.utils.deepClone(config),
        ui: uiState
      };
      await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
      ui.notifications.info(`World Profile "${name}" saved!`);
      return true;
    }
    async updateProfile(name, config, uiState) {
      if (!name || !this._worldProfiles[name]) {
        ui.notifications.warn("Select a valid profile to update.");
        return false;
      }
      this._worldProfiles[name] = {
        config: foundry.utils.deepClone(config),
        ui: uiState
      };
      await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
      ui.notifications.info(`World Profile "${name}" updated.`);
      return true;
    }
    async deleteProfile(name) {
      if (!name || !this._worldProfiles[name])
        return false;
      delete this._worldProfiles[name];
      await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
      if (this.getDefaultProfileName() === name)
        await this.setDefaultProfile("");
      return true;
    }
    async setDefaultProfile(name) {
      await game.settings.set(this.moduleId, DEFAULT_PROFILE_SETTING, name);
      this._defaultProfileName = name;
      ui.notifications.info(`"${name}" is now the default profile for new scenes.`);
    }
    _cleanObject(obj) {
      return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (value === null || value === void 0)
          return void 0;
        if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)
          return void 0;
        return value;
      }));
    }
  };
  var DebuggerUIBuilder = class {
    constructor() {
    }
    buildRootElement() {
      const element = document.createElement("div");
      element.id = "material-editor-debugger";
      element.innerHTML = this._getStyles() + this._getBaseHTML();
      element.querySelector("#material-editor-top-bar").innerHTML = this._buildTopBar();
      element.querySelector("#material-editor-profiles-section").innerHTML = this._buildProfileSection();
      const effectsHTML = this._buildColumn1() + this._buildColumn2() + this._buildColumn3();
      const contentArea = element.querySelector(".main-content-area");
      contentArea.innerHTML = effectsHTML;
      element.querySelector("#material-editor-bottom-bar").innerHTML = this._buildBottomBar();
      element.querySelectorAll("details").forEach((detail) => {
        detail.addEventListener("toggle", () => {
        });
      });
      return element;
    }
    _getStyles() {
      return `<style>
            #material-editor-debugger { 
                position: fixed; 
                /* The top, left, and transform properties are now set via JavaScript for stability */
                z-index: 10000; 
                background: rgba(40, 40, 40, 0.95); 
                color: #fff; 
                border: 1px solid #111; 
                border-radius: 8px; 
                padding: 5px; 
                font-family: sans-serif; 
                font-size: 11px; 
                display: flex; 
                flex-direction: column; 
                gap: 4px; 
                width: 95vw; 
                max-width: 1300px;
                box-sizing: border-box;
                box-shadow: 0 0 25px rgba(0,0,0,0.7); 
                max-height: calc(100vh - 100px); 
                transition: width 0.3s ease-in-out; 
            }
            #material-editor-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; }
            #material-editor-header h3 { margin: 0; padding: 0; border: none; flex-grow: 1; text-align: center; cursor: move; user-select: none; font-size: 1.4em; }
            .header-btn { display: inline-block; text-decoration: none; background: #3a3a3a; border: 1px solid #666; color: #ccc; font-weight: bold; width: 22px; height: 22px; line-height: 22px; text-align: center; cursor: pointer; border-radius: 4px; flex-shrink: 0; font-size: 14px; padding: 0; }
            .header-btn:hover { background: #555; border-color: #888; }
            #material-editor-debugger details { background: rgba(255,255,255,0.05); border: 1px solid #555; border-radius: 4px; padding: 3px; margin-bottom: 4px; }
            #material-editor-debugger details[open] { background: rgba(255,255,255,0.08); padding-bottom: 5px; }
            #material-editor-debugger details[open] > summary .accordion-toggle { transform: rotate(90deg); }
            #material-editor-debugger details.disabled-effect > summary .summary-label { color: #888; }
            #material-editor-debugger summary { font-weight: bold; cursor: pointer; padding: 2px; display: flex; align-items: center; gap: 5px; list-style: none; }
            #material-editor-debugger summary::-webkit-details-marker { display: none; }
            #material-editor-debugger .accordion-toggle { flex-shrink: 0; width: 0; height: 0; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 5px solid #ccc; transition: transform 0.2s ease-in-out; margin-left: 2px; }
            #material-editor-debugger .summary-control { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            #material-editor-debugger details details { margin-left: 8px; margin-top: 4px; border-style: dashed; }
            #material-editor-debugger .traffic-light { width: 9px; height: 9px; border-radius: 50%; display: inline-block; box-shadow: 0 0 4px rgba(0,0,0,0.5); border: 1px solid #111; flex-shrink: 0; }
            #material-editor-debugger .traffic-light.ok { background-color: #4cfa40; }
            #material-editor-debugger .traffic-light.error { background-color: #fa4040; }
            #material-editor-debugger .traffic-light.warning { background-color: #f7a000; }
            #material-editor-debugger .traffic-light.unknown { background-color: #888; }
            #material-editor-debugger .traffic-light.inactive, #material-editor-debugger .traffic-light.disabled { background: none; border: 1px dashed #666; }
            #material-editor-debugger .control-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; padding: 1px 0; }
            #material-editor-debugger .control-row label { flex-shrink: 0; margin-right: 8px; display: flex; align-items: center; gap: 4px;}
            #material-editor-debugger .control-row .widget-group { display: flex; align-items: center; gap: 4px; }
            #material-editor-debugger .control-row-slider { display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center; }
            #material-editor-debugger .control-row-slider label { margin-right: 0; white-space: nowrap; }
            #material-editor-debugger .control-row-slider input[type=range] { width: 100%; }
            #material-editor-debugger .control-row .value-span { width: 40px; height: 18px; line-height: 18px; text-align: right; font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.4); padding: 0 4px; border-radius: 3px; box-sizing: border-box; }
            #material-editor-debugger input[type=range] { flex-grow: 1; width: 120px; height: 14px; }
            #material-editor-debugger input[type=color] { width: 100%; height: 22px; border: 1px solid #555; padding: 1px; background: #333; box-sizing: border-box; }
            #material-editor-debugger .main-content-area { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 8px; 
                flex-grow: 1; 
                min-height: 0; 
                padding: 4px; 
                background: rgba(0,0,0,0.2); 
                border-radius: 5px; 
                overflow-y: auto;
                align-items: start;
            }
            #material-editor-debugger .top-bar { flex-shrink: 0; display: flex; flex-direction: column; gap: 5px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 5px; }
            #material-editor-debugger .top-bar-row { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
            #material-editor-debugger .status-group { display: flex; flex-wrap: wrap; gap: 4px 10px; border-left: 2px solid #555; padding-left: 8px; }
            #material-editor-debugger .status-group-title { font-weight: bold; color: #aaa; }
            #material-editor-debugger #material-editor-profiles-section > details { margin-bottom: 0; }
            #material-editor-debugger #material-editor-profiles-section .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 5px; }
            #material-editor-debugger #material-editor-profiles-section .profile-group { display: flex; flex-direction: column; gap: 4px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; }
            .profile-controls { display: flex; flex-direction: column; gap: 4px; }
            #material-editor-debugger select { width: 100%; text-transform: capitalize; background-color: #222; color: #fff; border: 1px solid #555; border-radius: 3px; height: 20px; font-size: 11px; }
            .star-icon { font-size: 0 !important; background-color: #ccc; width: 12px; height: 12px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); margin: auto; }
            #material-editor-debugger.minimized { width: auto; height: auto; padding: 4px; gap: 0; box-shadow: 0 0 10px rgba(0,0,0,0.5); right: auto; }
            #material-editor-debugger.minimized #material-editor-header { padding: 0; cursor: move; }
            #material-editor-debugger.minimized > *:not(#material-editor-header) { display: none; }
            #material-editor-debugger.minimized #material-editor-help-btn, #material-editor-debugger.minimized #material-editor-title { display: none; }
            .fx-status-light { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #111; margin-right: 5px; vertical-align: middle; }
            .fx-status-light.green { background-color: #4cfa40; box-shadow: 0 0 5px #4cfa40; }
            .fx-status-light.blue { background-color: #40a0fa; box-shadow: 0 0 5px #40a0fa; }
            .fx-status-light.grey { background-color: #888; }
            .fx-status-light.red { background-color: #fa4040; box-shadow: 0 0 5px #fa4040; }
            .profile-controls button:disabled { background-color: #333; color: #777; cursor: not-allowed; border-color: #555; }
            .description-text { font-size: 10px; color: #aaa; margin: 4px 0 6px 0; padding-left: 5px; }
            .warning-box { background: #552222; border: 1px solid #ff6666; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 10px; }
            .warning-box strong { color: #ffaaaa; }
            .profile-group-title { font-weight: bold; text-align: center; display: block; margin-bottom: 5px; color: #ccc; border-bottom: 1px solid #555; padding-bottom: 3px;}

            #material-editor-bottom-bar {
                padding: 10px 15px;
                margin-top: 5px;
                background: rgba(15, 15, 15, 0.5);
                border-radius: 5px;
                border: 1px solid #666;
                display: grid; 
                grid-template-columns: 1fr auto; 
                align-items: center;
                gap: 30px;
            }

            #material-editor-bottom-bar .about-text {
                font-size: 11px;
                line-height: 1.5;
                color: #ccc;
            }

            #material-editor-bottom-bar .about-text p {
                margin: 0;
            }

            #material-editor-bottom-bar .about-text p:first-child {
                margin-bottom: 5px;
            }

            #material-editor-bottom-bar .support-links {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 8px;
            }

            #material-editor-bottom-bar .support-links a.patreon-link {
                color: #f96854;
                text-decoration: none;
                font-weight: bold;
                font-size: 13px;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
                padding: 6px 12px;
                border-radius: 4px;
                background: rgba(40, 40, 40, 0.9);
                border: 1px solid #777;
            }

            #material-editor-bottom-bar .support-links a.patreon-link:hover {
                color: #fff;
                background: #f96854;
                border-color: #f96854;
            }

            #material-editor-bottom-bar .support-links .patreon-logo {
                height: 20px;
                width: 20px;
            }

            #material-editor-bottom-bar .stores-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
                align-items: flex-end;
            }

            #material-editor-bottom-bar .stores-heading {
                margin: 0;
                padding: 0;
                font-size: 10px;
                font-weight: bold;
                color: #bbb;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            #material-editor-bottom-bar .store-links-inner {
                display: flex;
                gap: 15px;
                font-size: 11px;
            }

            #material-editor-bottom-bar .store-links-inner a {
                color: #8fb1ff;
                text-decoration: none;
                font-weight: bold;
            }

            #material-editor-bottom-bar .store-links-inner a:hover {
                color: #b3ceff;
                text-decoration: underline;
            }
            details.effect-unavailable {
                border-style: dashed;
                border-color: #444;
            }
            details.effect-unavailable > summary {
                opacity: 0.7;
            }
            details.effect-unavailable > summary .summary-label {
                text-decoration: line-through;
            }
</style>`;
    }
    _getBaseHTML() {
      return `
            <div id="material-editor-header">
                <a id="material-editor-help-btn" class="header-btn" href="https://github.com/Garsondee/map-shine" target="_blank" rel="noopener noreferrer" title="Help/Info (Opens GitHub page)">?</a>
                <h3 id="material-editor-title">Map Shine</h3>
                <button id="material-editor-minimize-btn" class="header-btn" title="Minimize">-</button>
                <button id="material-editor-close-btn" class="header-btn" title="Close" style="color: #ff8080;">X</button>
            </div>

            <div id="material-editor-top-bar" class="top-bar"></div>
            <div id="material-editor-profiles-section"></div>
            <div class="main-content-area"></div>
            <div id="material-editor-bottom-bar"></div>
        `;
    }
    _buildBottomBar() {
      return `
            <div class="about-text">
                <p><strong>Map Shine:</strong> A free toolkit for creating memorable, animated, and visually striking maps. It will <br>
                always be free for commercial use. Map making is both my passion and helps me support my family.<br>
                If you use this module, please consider giving credit by linking my Patreon or map stores.</p>
            </div>
            <div class="support-links">
                <a href="https://www.patreon.com/c/MythicaMachina" target="_blank" class="patreon-link">
                    <span>Support on Patreon</span>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/94/Patreon_logo.svg" class="patreon-logo" alt="Patreon Logo">
                </a>
                <div class="stores-group">
                    <h5 class="stores-heading">BUY MY MAPS AND HELP SUPPORT ME</h5>
                    <div class="store-links-inner">
                        <a href="https://www.foundryvtt.store/creators/mythica-machina" target="_blank">Foundry VTT Store</a>
                        <a href="https://www.drivethrurpg.com/en/publisher/29377/mythicamachina" target="_blank">DriveThruRPG</a>
                    </div>
                </div>
            </div>
        `;
    }
    _buildTopBar() {
      return `
        <div class="top-bar-row">
            <div class="widget-group">
                <input type="checkbox" id="global-enabled" data-path="enabled">
                <label for="global-enabled">Enable All Effects</label>
            </div>
            <div class="status-group" style="border: none; padding-left: 0;">
                <strong class="status-group-title">Configuration Status:</strong>
                <span id="fx-status-light" class="fx-status-light grey"></span>
                <span id="fx-status-text" style="color: #ddd;">Initializing...</span>
            </div>

            <div class="status-group">
                <span class="status-group-title">Shaders:</span>
                <div class="widget-group"><span id="status-shaders-baseShine" class="traffic-light unknown"></span>Base</div>
                <div class="widget-group"><span id="status-shaders-noise" class="traffic-light unknown"></span>Noise</div>
                <div class="widget-group"><span id="status-shaders-iridescence" class="traffic-light unknown"></span>Iridescence</div>
                <div class="widget-group"><span id="status-shaders-prism" class="traffic-light unknown"></span>Prism</div>
                <div class="widget-group"><span id="status-shaders-heat" class="traffic-light unknown"></span>Heat</div>
                <div class="widget-group"><span id="status-shaders-cloudShadows" class="traffic-light unknown"></span>Clouds</div>
                <div class="widget-group"><span id="status-shaders-structuralShadows" class="traffic-light unknown"></span>Structural</div>
                <div class="widget-group"><span id="status-shaders-postProcessing" class="traffic-light unknown"></span>PostFX</div>
            </div>
             <div class="widget-group" style="background: #551111; padding: 2px 4px; border-radius: 3px;">
                <label for="control-showTokenMask">Show Token Mask</label>
                <input type="checkbox" id="control-showTokenMask" data-path="showTokenMask">
            </div>
        </div>
        `;
    }
    _buildProfileSection() {
      return `
            <details id="details-profile-management" open>
                <summary>
                    <span class="accordion-toggle"></span>
                    <strong style="font-size: 1.1em;">Profiles & State Management</strong>
                </summary>
                <div class="profile-grid">
                    <div class="profile-group">
                        <strong class="profile-group-title">Manage Scene State</strong>
                        <p class="description-text" style="text-align: center;">Control the settings for the current scene.</p>
                        <button id="profile-save-scene" title="Save your current temporary changes as the new official default for this scene. (GM Only)">Commit Changes to Scene</button>
                        <button id="profile-revert-scene" title="Discard all of your temporary changes and revert to the last saved state for this scene.">Discard My Changes</button>
                        <button id="profile-revert-module" title="For this session only, ignore all scene settings and use the original module defaults.">Preview Module Defaults</button>
                    </div>
                    <div class="profile-group">
                        <strong class="profile-group-title">Manage World Profiles</strong>
                         <p class="description-text" style="text-align: center;">Load, save, and manage reusable profiles for your entire world.</p>
                        <div class="profile-controls">
                            <select id="profiles-dropdown"></select>
                            <div style="display: flex; gap: 5px;">
                                <button id="profile-load" title="Temporarily preview the selected profile. This will create unsaved changes.">Preview Profile</button>
                                <button id="profile-set-default" title="Set the selected profile as the default for new, unsaved scenes." style="flex-grow: 1;">Set as World Default</button>
                            </div>
                            <hr style="border-color: #555; margin: 2px 0;">
                            <input type="text" id="profile-name" placeholder="New/Existing Profile Name...">
                            <div style="display: flex; gap: 5px;">
                                <button id="profile-save" title="Save the current settings (including any temporary changes) as a NEW world-level profile.">Save as New</button>
                                <button id="profile-update" title="Overwrite the selected world profile with the current settings.">Update Selected</button>
                                <button id="profile-delete" style="color: #ff8080;" title="Permanently delete the selected world profile. This cannot be undone.">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </details>
        `;
    }
    _buildColumn1() {
      let content = this._createAccordionHTML("baseShine", "Metallic Shine", `
            ${this._createTextureInputHTML("specular", "Specular/Reflect Map")}
            <p class="description-text">A grayscale texture where white areas reflect the animated pattern and black areas reflect nothing. This is the primary mask for this effect.</p>
            <details id="details-baseShine-animation"><summary><span class="accordion-toggle"></span><strong>Animation & Compositing</strong></summary>
                <div>
                ${this._createSliderHTML("baseShine.animation.globalIntensity", "Global Intensity", 0, 10, 0.1, "Controls the overall brightness of the shine effect.")}
                ${this._createSliderHTML("baseShine.animation.parallaxAmount", "Parallax Amount", 0, 1, 0.01, "Controls shine movement with the camera. A value of 1 pins the effect to the camera, a low value means higher level of animation/movement.")}
                ${this._createSliderHTML("baseShine.animation.updateFrequency", "Update Frequency (Frames)", 0, 60, 1, "How often the pattern updates. Higher values improve performance but make animation less smooth. 0 = every frame.")}
                </div>
            </details>
            <details id="details-baseShine-pattern"><summary><span class="accordion-toggle"></span><strong>Pattern Generator</strong></summary>
                <div>
                    ${this._createSelectHTML("baseShine.patternType", "Type", { "Stripes": "stripes", "Checkerboard": "checkerboard" }, "The base procedural shape of the shine.")}
                    <div id="pattern-stripes-controls">
                        ${this._createSliderHTML("baseShine.pattern.shared.patternScale", "Pattern Scale", 0.01, 4, 0.01, "Overall zoom level of the stripe patterns.")}
                        ${this._createSliderHTML("baseShine.pattern.shared.maxBrightness", "Max Brightness", 0, 2, 0.01, "A cap on the brightness of the generated pattern.")}
                        <details id="details-baseShine-pattern-s1"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("baseShine.pattern.stripes1.enabled", "Stripe Layer A", true)}</div></summary>
                            <div>
                                ${this._createSliderHTML("baseShine.pattern.stripes1.intensity", "Intensity", 0, 2, 0.05, "Brightness of this individual stripe layer.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes1.speed", "Speed", -0.1, 0.1, 1e-3, "How fast the sub-stripes animate within the bands.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes1.angle", "Angle", 0, 360, 1)}
                                ${this._createSliderHTML("baseShine.pattern.stripes1.sharpness", "Edge Falloff", 0.1, 8, 0.1, "How soft or hard the edges of the main bands are.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes1.bandDensity", "Band Density", 1, 64, 0.5, "How many main bands appear on screen.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes1.bandWidth", "Band Width", 0.1, 1, 0.01, "The width of the main bands, as a fraction of the space between them.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes1.subStripeMaxCount", "Sub-Stripe Count", 1, 20, 1, "The maximum number of smaller stripes that can appear inside a main band.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes1.subStripeMaxSharp", "Sub-Stripe Sharp", 1, 32, 0.5, "The sharpness of the smaller, internal stripes.")}
                            </div>
                        </details>     
                        <details id="details-baseShine-pattern-s2"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("baseShine.pattern.stripes2.enabled", "Stripe Layer B", true)}</div></summary>
                            <div>
                                ${this._createSliderHTML("baseShine.pattern.stripes2.intensity", "Intensity", 0, 2, 0.05, "Brightness of this individual stripe layer.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes2.speed", "Speed", -0.1, 0.1, 1e-3, "How fast the sub-stripes animate within the bands.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes2.angle", "Angle", 0, 360, 1)}
                                ${this._createSliderHTML("baseShine.pattern.stripes2.sharpness", "Edge Falloff", 0.1, 8, 0.1, "How soft or hard the edges of the main bands are.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes2.bandDensity", "Band Density", 1, 64, 0.5, "How many main bands appear on screen.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes2.bandWidth", "Band Width", 0.1, 1, 0.01, "The width of the main bands, as a fraction of the space between them.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes2.subStripeMaxCount", "Sub-Stripe Count", 1, 20, 1, "The maximum number of smaller stripes that can appear inside a main band.")}
                                ${this._createSliderHTML("baseShine.pattern.stripes2.subStripeMaxSharp", "Sub-Stripe Sharp", 1, 32, 0.5, "The sharpness of the smaller, internal stripes.")}
                            </div>
                        </details>
                    </div>
                    <div id="pattern-checkerboard-controls" style="display: none;">
                        ${this._createSliderHTML("baseShine.pattern.checkerboard.gridSize", "Grid Size", 2, 64, 2)}
                        ${this._createSliderHTML("baseShine.pattern.checkerboard.brightness1", "Brightness 1", 0, 1, 0.01)}
                        ${this._createSliderHTML("baseShine.pattern.checkerboard.brightness2", "Brightness 2", 0, 1, 0.01)}
                    </div>
                </div>
            </details>
            <details id="details-baseShine-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("baseShine.noise.enabled", "Pattern Noise Mask", true)}</div></summary>
                <div>
                    <p class="description-text">Applies a noise pattern over the stripes to add texture and break up the uniformity.</p>
                    ${this._createSliderHTML("baseShine.noise.speed", "Speed", -0.5, 0.5, 1e-3)}
                    ${this._createSliderHTML("baseShine.noise.scale", "Scale", 0.1, 10, 0.1)}
                    ${this._createSliderHTML("baseShine.noise.threshold", "Threshold", 0, 1, 0.01, "Cuts off noise values below this, creating harder-edged noise.")}
                    ${this._createSliderHTML("baseShine.noise.brightness", "Brightness", -1, 1, 0.01)}
                    ${this._createSliderHTML("baseShine.noise.contrast", "Contrast", 0, 5, 0.05)}
                    ${this._createSliderHTML("baseShine.noise.softness", "Softness", 0.01, 1, 0.01, "How gradual the transition is at the threshold edge.")}
                </div>
            </details>
             <details id="details-baseShine-colorCorrection">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">${this._createCheckboxHTML("baseShine.colorCorrection.enabled", "Shine Color Correction", true)}</div>
                </summary>
                <div>
                    <p class="description-text">Fine-tunes the color and intensity of the metallic reflection itself, allowing for deep blacks and brilliant highlights.</p>
                    ${this._createSliderHTML("baseShine.colorCorrection.saturation", "Saturation", 0, 4, 0.05)}
                    ${this._createSliderHTML("baseShine.colorCorrection.brightness", "Brightness", -1, 1, 0.01)}
                    ${this._createSliderHTML("baseShine.colorCorrection.contrast", "Contrast", 0, 4, 0.05)}
                    ${this._createSliderHTML("baseShine.colorCorrection.exposure", "Exposure", -2, 2, 0.05)}
                    ${this._createSliderHTML("baseShine.colorCorrection.gamma", "Gamma", 0.2, 2.5, 0.05)}
                    <details id="details-baseShine-cc-levels">
                        <summary><span class="accordion-toggle"></span><strong>Levels</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createSliderHTML("baseShine.colorCorrection.levels.inBlack", "Black Point", 0, 1, 0.01)}
                            ${this._createSliderHTML("baseShine.colorCorrection.levels.inWhite", "White Point", 0, 1, 0.01)}
                        </div>
                    </details>
                    <details id="details-baseShine-cc-tint">
                        <summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createColorPickerHTML("baseShine.colorCorrection.tint.color", "Tint Color")}
                            ${this._createSliderHTML("baseShine.colorCorrection.tint.amount", "Tint Amount", 0, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
            <details id="details-baseShine-bloom"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("baseShine.shineBloom.enabled", "Shine Bloom Effect", true)}</div></summary>
                <div>
                    <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;">
                        <strong style="color: #ffddaa;">PERFORMANCE WARNING:</strong> This effect can be demanding. Lowering 'Quality' can improve performance significantly.
                    </div>
                    <p class="description-text">Adds a soft glow to the brightest parts of the shine effect.</p>
                    ${this._createSliderHTML("baseShine.shineBloom.threshold", "Threshold", 0, 1, 0.01, "Only areas brighter than this will bloom.")}
                    ${this._createSliderHTML("baseShine.shineBloom.brightness", "Brightness", 0, 5, 0.05)}
                    ${this._createSliderHTML("baseShine.shineBloom.blur", "Blur Amount", 0, 20, 0.5)}
                    ${this._createSliderHTML("baseShine.shineBloom.quality", "Quality", 1, 15, 1, "Number of blur samples. Higher is smoother but much slower.")}
                    <details id="details-baseShine-rgbSplit"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("baseShine.rgbSplit.enabled", "RGB Split", true)}</div></summary>
                        <div>${this._createSliderHTML("baseShine.rgbSplit.amount", "Amount", 0, 10, 0.1, "Adds a chromatic aberration effect to the bloom.")}</div>
                    </details>
                </div>
            </details>
            <details id="details-baseShine-starburst"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("baseShine.starburst.enabled", "Shine Starburst Effect", true)}</div></summary>
                <div>
                    <div class="warning-box">
                        <strong style="color: #ffaaaa;">EXTREME PERFORMANCE WARNING:</strong> This effect is VERY performance-heavy, especially with a high 'Ray Length' or many 'Points'. Use with caution!
                    </div>
                    <p class="description-text">Adds star-like rays that emanate from the brightest parts of the shine.</p>
                    ${this._createSliderHTML("baseShine.starburst.threshold", "Threshold", 0, 1, 0.01, "Only areas brighter than this will generate rays.")}
                    ${this._createSliderHTML("baseShine.starburst.intensity", "Intensity", 0, 4, 0.05)}
                    ${this._createSliderHTML("baseShine.starburst.points", "Points", 2, 16, 1)}
                    ${this._createSliderHTML("baseShine.starburst.angle", "Angle", 0, 360, 1)}
                    ${this._createSliderHTML("baseShine.starburst.size", "Ray Length", 1, 200, 1)}
                    ${this._createSliderHTML("baseShine.starburst.falloff", "Ray Falloff", 0.5, 8, 0.1, "How quickly the rays fade out with distance. Higher values mean a shorter, faster fade.")}
                    ${this._createSelectHTML("baseShine.starburst.blendMode", "Blend Mode", BLEND_MODE_OPTIONS)}
                </div>
            </details>
        `);
      return content;
    }
    _buildColumn2() {
      let content = "";
      content += this._createAccordionHTML("cloudShadows", "Cloud Shadows", `
            ${this._createTextureInputHTML("outdoors", "Outdoor Mask (_Outdoors)")}
            <p class="description-text">Simulates moving cloud shadows within the masked areas.</p>
            ${this._createSliderHTML("cloudShadows.shadowIntensity", "Global Intensity", 0, 2, 0.05)}
            ${this._createSliderHTML("cloudShadows.maskBlur", "Mask Blur", 0, 50, 1)}
            <details><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML("cloudShadows.wind.angle", "Angle", 0, 360, 1)}
                    ${this._createSliderHTML("cloudShadows.wind.speed", "Speed", 0, 0.01, 1e-4)}
                </div>
            </details>
            <details><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML("cloudShadows.noise.scale", "Scale", 0.01, 10, 0.01)}
                    ${this._createSliderHTML("cloudShadows.noise.octaves", "Detail Octaves", 1, 8, 1, "Adds more layers of detail to the noise. Higher is more complex.")}
                    ${this._createSliderHTML("cloudShadows.noise.persistence", "Roughness", 0.1, 1, 0.05, "How much each successive octave contributes. Lower values give a softer look.")}
                    ${this._createSliderHTML("cloudShadows.noise.lacunarity", "Detail Frequency", 1.5, 4, 0.1, "How much detail is added with each octave. Higher values create finer, more complex noise.")}
                </div>
            </details>
            <details><summary><span class="accordion-toggle"></span><strong>Shading & Appearance</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML("cloudShadows.shading.threshold", "Threshold", 0, 1, 0.01)}
                    ${this._createSliderHTML("cloudShadows.shading.softness", "Softness", 0.01, 1, 0.01)}
                    ${this._createSliderHTML("cloudShadows.shading.brightness", "Brightness", -1, 1, 0.01)}
                    ${this._createSliderHTML("cloudShadows.shading.contrast", "Contrast", 0.1, 5, 0.05)}
                    ${this._createSliderHTML("cloudShadows.shading.gamma", "Gamma", 0.1, 5, 0.05, "Adjusts the mid-tones of the shadows. < 1 lightens, > 1 darkens.")}
                </div>
            </details>
            <details id="details-cloudShadows-illumination">
                <summary><span class="accordion-toggle"></span>
                    <div class="summary-control">${this._createCheckboxHTML("cloudShadows.illumination.enabled", "Illumination Masking", true)}</div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                    ${this._createSliderHTML("cloudShadows.illumination.intensity", "Reduction Amount", 0, 1, 0.01, "How much to reduce shadow opacity in fully lit areas.")}
                    ${this._createSliderHTML("cloudShadows.illumination.luminanceThreshold", "Light Threshold", 0, 1, 0.01, "The scene brightness level above which shadows will start to fade.")}
                    ${this._createSliderHTML("cloudShadows.illumination.softness", "Edge Softness", 0.01, 1, 0.01, "How gradual the fade transition is.")}
                </div>
            </details>
        `);
      return content;
    }
    _buildColumn3() {
      let content = this._createAccordionHTML("iridescence", "Iridescence", `
            ${this._createTextureInputHTML("iridescence", "Iridescence Mask")}
            <p class="description-text">Creates a colorful, oil-slick-like effect within the masked areas.</p>
            ${this._createSliderHTML("iridescence.intensity", "Intensity", 0, 2, 0.05)}
            ${this._createSliderHTML("iridescence.speed", "Anim Speed", 0, 0.2, 1e-3, "Directional drift speed of the pattern.")}
            ${this._createSliderHTML("iridescence.scale", "Pattern Scale", 0.1, 20, 0.1)}
            ${this._createSliderHTML("iridescence.parallax", "Parallax", 0, 1, 0.01, "0 = Sticks to Map, 1 = Sticks to Screen")}
            <details id="details-iridescence-fbm"><summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                <div>
                    <p class="description-text">Controls the procedural noise used to generate the base pattern.</p>
                    ${this._createSliderHTML("iridescence.fbm.evolution", "Evolution", 0, 1, 1e-3, 'Internal "boiling" speed of the pattern.')}
                    ${this._createSliderHTML("iridescence.fbm.octaves", "Complexity (Octaves)", 1, IridescenceFilter.MAX_OCTAVES, 1, "Layers of noise. More is more detailed but slower.")}
                    ${this._createSliderHTML("iridescence.fbm.persistence", "Roughness", 0.1, 1, 0.01, "Influence of smaller details. Lower is smoother.")}
                    ${this._createSliderHTML("iridescence.fbm.lacunarity", "Detail Scale", 1.5, 4, 0.05, "Frequency of smaller details. Higher is finer.")}
                    ${this._createSliderHTML("iridescence.fbm.brightness", "Noise Brightness", 0, 1, 0.01, "Adjusts the brightness of the noise before color mapping.")}
                    ${this._createSliderHTML("iridescence.fbm.contrast", "Noise Contrast", 0, 5, 0.05, "Adjusts the contrast of the noise before color mapping.")}
                </div>
            </details>
            <details id="details-iridescence-gradient"><summary><span class="accordion-toggle"></span><strong>Gradient Controls</strong></summary>
                <div>
                    ${this._createGradientSelectHTML("iridescence.gradient.name", "Gradient Preset")}
                    ${this._createSliderHTML("iridescence.gradient.hueShift", "Hue Shift", 0, 1, 0.01, "Rotates the colors of the gradient.")}
                    ${this._createSliderHTML("iridescence.gradient.brightness", "Brightness", -1, 1, 0.01, "Final brightness adjustment applied to the colored result.")}
                    ${this._createSliderHTML("iridescence.gradient.contrast", "Contrast", 0, 4, 0.05, "Final contrast adjustment applied to the colored result.")}
                </div>
            </details>
            <details id="details-iridescence-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("iridescence.distortion.enabled", "Churn/Distortion Effect", true)}</div></summary>
                <div>
                    <p class="description-text">Uses a second, underlying noise pattern to warp the main iridescence effect.</p>
                    ${this._createSliderHTML("iridescence.distortion.strength", "Distortion Strength", 0, 20, 0.1)}
                    <details id="details-iridescence-distortion-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("iridescence.noise.enabled", "Distortion Noise", true)}</div></summary>
                        <div>
                            ${this._createSliderHTML("iridescence.noise.speed", "Speed", -0.5, 0.5, 1e-3)}
                            ${this._createSliderHTML("iridescence.noise.scale", "Scale", 0.1, 10, 0.1)}
                            ${this._createSliderHTML("iridescence.noise.threshold", "Threshold", 0, 1, 0.01)}
                            ${this._createSliderHTML("iridescence.noise.brightness", "Brightness", -1, 1, 0.01)}
                            ${this._createSliderHTML("iridescence.noise.contrast", "Contrast", 0, 5, 0.05)}
                            ${this._createSliderHTML("iridescence.noise.softness", "Softness", 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
        `);
      content += this._createAccordionHTML("heatDistortion", "Heat Distortion", `
            ${this._createTextureInputHTML("heat", "Intensity Mask (_Heat)")}
            <p class="description-text">Simulates rising heat waves, distorting the scene behind the masked areas.</p>
            ${this._createSliderHTML("heatDistortion.intensity", "Intensity", 0, 0.05, 5e-4)}
            <details id="details-heatDistortion-noise"><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML("heatDistortion.noise.speed", "Speed (Wind)", -0.5, 0.5, 5e-3, "Horizontal scrolling speed of the heat waves.")}
                    ${this._createSliderHTML("heatDistortion.noise.scale", "Scale", 0.1, 10, 0.1, "Zoom level of the heat waves.")}
                    ${this._createSliderHTML("heatDistortion.noise.evolution", "Evolution Speed", 0, 1, 0.01, 'The "boiling" or "morphing" speed of the noise, independent of wind.')}
                    ${this._createSliderHTML("heatDistortion.noise.threshold", "Threshold", 0, 1, 0.01)}
                    ${this._createSliderHTML("heatDistortion.noise.brightness", "Brightness", -1, 1, 0.01)}
                    ${this._createSliderHTML("heatDistortion.noise.contrast", "Contrast", 0, 5, 0.05)}
                    ${this._createSliderHTML("heatDistortion.noise.softness", "Softness", 0.01, 1, 0.01)}
                </div>
            </details>
        `);
      content += this._createAccordionHTML("canopy", "Canopy Shadows", `
            ${this._createTextureInputHTML("canopy", "Canopy Mask (_Canopy)")}
            <p class="description-text">A black and white texture where black areas are shadows and white areas are light. This effect simulates a leafy canopy overhead.</p>
            ${this._createSliderHTML("canopy.shadowIntensity", "Shadow Intensity", 0, 2, 0.01)}
            ${this._createColorPickerHTML("canopy.tint", "Shadow Tint")}
            <details id="details-canopy-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("canopy.distortion.enabled", "Shadow Animation", true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Animates the shadows using a procedural noise pattern to create a distortion effect.</p>
                    ${this._createSliderHTML("canopy.distortion.intensity", "Intensity", 0, 20, 0.1, "The overall strength of the distortion effect.")}
                    ${this._createSliderHTML("canopy.distortion.speed", "Speed", -0.5, 0.5, 5e-3, "Horizontal/Vertical scrolling speed of the distortion.")}
                    ${this._createSliderHTML("canopy.distortion.scale", "Scale", 0.01, 2, 0.01, "Zoom level of the distortion pattern.")}
                    ${this._createSliderHTML("canopy.distortion.evolution", "Evolution", 0, 1, 0.01, 'Internal "morphing" speed of the distortion.')}
                    <details id="details-canopy-distortion-noise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createSliderHTML("canopy.distortion.threshold", "Threshold", 0, 1, 0.01)}
                            ${this._createSliderHTML("canopy.distortion.brightness", "Brightness", -1, 1, 0.01)}
                            ${this._createSliderHTML("canopy.distortion.contrast", "Contrast", 0, 5, 0.05)}
                            ${this._createSliderHTML("canopy.distortion.softness", "Softness", 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
            <details id="details-canopy-illumination">
                <summary><span class="accordion-toggle"></span>
                    <div class="summary-control">${this._createCheckboxHTML("canopy.illumination.enabled", "Illumination Masking", true)}</div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                    ${this._createSliderHTML("canopy.illumination.intensity", "Reduction Amount", 0, 1, 0.01, "How much to reduce shadow opacity in fully lit areas.")}
                    ${this._createSliderHTML("canopy.illumination.luminanceThreshold", "Light Threshold", 0, 1, 0.01, "The scene brightness level above which shadows will start to fade.")}
                    ${this._createSliderHTML("canopy.illumination.softness", "Edge Softness", 0.01, 1, 0.01, "How gradual the fade transition is.")}
                </div>
            </details>
        `);
      content += this._createAccordionHTML("structuralShadows", "Structural Shadows", `
            ${this._createTextureInputHTML("structural", "Structural Mask (_Structural)")}
            <p class="description-text">A black and white texture for indoor shadows (rafters, beams, etc.). Black areas are shadows, white areas are light. Respects the Outdoor Mask.</p>
            ${this._createSliderHTML("structuralShadows.shadowIntensity", "Shadow Intensity", 0, 5, 0.01)}
            ${this._createColorPickerHTML("structuralShadows.tint", "Shadow Tint")}
            ${this._createSliderHTML("structuralShadows.parallax", "Parallax", 0, 1, 1e-3, "How much the shadows shift relative to camera movement. 0 = fixed to map, 1 = fixed to screen.")}
            <details id="details-structuralShadows-rgbSplit"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("structuralShadows.rgbSplit.enabled", "Highlight RGB Split", true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Applies a chromatic aberration effect to the structural highlights.</p>
                    ${this._createSliderHTML("structuralShadows.rgbSplit.intensity", "Intensity", 0, 20, 0.1)}
                    ${this._createSliderHTML("structuralShadows.rgbSplit.threshold", "Threshold", 0, 1, 0.01, "Only highlights brighter than this will be split.")}
                </div>
            </details>
            <details id="details-structuralShadows-intensityNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("structuralShadows.intensityNoise.enabled", "Intensity Noise (Flicker)", true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Animates the brightness of the shadows using a procedural noise pattern to create a flickering light effect.</p>
                    ${this._createSliderHTML("structuralShadows.intensityNoise.amount", "Amount", 0, 1, 0.01, "The maximum amount to brighten the shadows by.")}
                    ${this._createSliderHTML("structuralShadows.intensityNoise.speed", "Speed", -0.5, 0.5, 5e-3, "Horizontal/Vertical scrolling speed of the noise.")}
                    ${this._createSliderHTML("structuralShadows.intensityNoise.scale", "Scale", 0.01, 2, 0.01, "Zoom level of the noise pattern.")}
                    ${this._createSliderHTML("structuralShadows.intensityNoise.evolution", "Evolution", 0, 1, 0.01, 'Internal "morphing" speed of the noise.')}
                    <details id="details-structuralShadows-intensityNoise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createSliderHTML("structuralShadows.intensityNoise.threshold", "Threshold", 0, 1, 0.01)}
                            ${this._createSliderHTML("structuralShadows.intensityNoise.brightness", "Brightness", -5, 5, 0.01)}
                            ${this._createSliderHTML("structuralShadows.intensityNoise.contrast", "Contrast", 0, 5, 0.05)}
                            ${this._createSliderHTML("structuralShadows.intensityNoise.softness", "Softness", 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
             <details id="details-structuralShadows-cloudOcclusion"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("structuralShadows.cloudOcclusion.enabled", "Cloud Occlusion", true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Overlays animated cloud shadows on top of the structural shadows.</p>
                    ${this._createSliderHTML("structuralShadows.cloudOcclusion.intensity", "Cloud Intensity", 0, 2, 0.05)}
                    <details><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.wind.angle", "Angle", 0, 360, 1)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.wind.speed", "Speed", 0, 0.01, 1e-4)}
                        </div>
                    </details>
                    <details><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.noise.scale", "Scale", 0.01, 10, 0.01)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.noise.octaves", "Detail Octaves", 1, 8, 1)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.noise.persistence", "Roughness", 0.1, 1, 0.05)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.noise.lacunarity", "Detail Frequency", 1.5, 4, 0.1)}
                        </div>
                    </details>
                    <details><summary><span class="accordion-toggle"></span><strong>Shading & Appearance</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.shading.threshold", "Threshold", 0, 1, 0.01)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.shading.softness", "Softness", 0.01, 1, 0.01)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.shading.brightness", "Brightness", -1, 1, 0.01)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.shading.contrast", "Contrast", 0.1, 5, 0.05)}
                            ${this._createSliderHTML("structuralShadows.cloudOcclusion.shading.gamma", "Gamma", 0.1, 5, 0.05)}
                        </div>
                    </details>
                </div>
            </details>
            <details id="details-structuralShadows-illumination">
                <summary><span class="accordion-toggle"></span>
                    <div class="summary-control">${this._createCheckboxHTML("structuralShadows.illumination.enabled", "Illumination Masking", true)}</div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                    ${this._createSliderHTML("structuralShadows.illumination.intensity", "Reduction Amount", 0, 1, 0.01, "How much to reduce shadow opacity in fully lit areas.")}
                    ${this._createSliderHTML("structuralShadows.illumination.luminanceThreshold", "Light Threshold", 0, 1, 0.01, "The scene brightness level above which shadows will start to fade.")}
                    ${this._createSliderHTML("structuralShadows.illumination.softness", "Edge Softness", 0.01, 1, 0.01, "How gradual the fade transition is.")}
                </div>
            </details>
        `);
      content += this._createAccordionHTML("ambient", "Ambient / Emissive", `
            ${this._createTextureInputHTML("ambient", "Emissive Map (_Ambient)")}
            <p class="description-text">Applies color and effects to a texture, often used for glowing areas that are part of the map itself (e.g., lava, magic runes).</p>
            ${this._createSliderHTML("ambient.intensity", "Intensity", 0, 5, 0.05, "Brightness multiplier. Values > 1 are useful for additive blending.")}
            ${this._createSelectHTML("ambient.blendMode", "Blend Mode", BLEND_MODE_OPTIONS)}
    
            <details id="details-ambient-tokenMasking">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${this._createCheckboxHTML("ambient.tokenMasking.enabled", "Token Masking", true)}
                    </div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Hides the effect behind tokens. For this to work, you may need to increase this layer's Z-Index (see Rendering Order section) to be above the token layer.</p>
                    ${this._createSliderHTML("ambient.tokenMasking.threshold", "Mask Threshold", 0, 1, 0.01)}
                </div>
            </details>
    
            <details id="details-ambient-masking">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${this._createCheckboxHTML("ambient.masking.enabled", "Luminance Mask", true)}
                    </div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Fades out the effect in dark areas of the scene. Requires scene lighting and the Illumination Buffer module.</p>
                    ${this._createSliderHTML("ambient.masking.threshold", "Brightness Threshold", 0, 1, 0.01)}
                    ${this._createSliderHTML("ambient.masking.softness", "Edge Softness", 0.01, 1, 0.01)}
                </div>
            </details>
    
            <details id="details-ambient-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("ambient.colorCorrection.enabled", "Color Correction", true)}</div></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML("ambient.colorCorrection.saturation", "Saturation", 0, 4, 0.05)}
                    ${this._createSliderHTML("ambient.colorCorrection.brightness", "Brightness", -1, 1, 0.01)}
                    ${this._createSliderHTML("ambient.colorCorrection.contrast", "Contrast", 0, 4, 0.05)}
                    ${this._createSliderHTML("ambient.colorCorrection.gamma", "Gamma", 0.2, 2.5, 0.05)}
                    <details id="details-ambient-cc-tint"><summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary><div style="padding-left: 15px;">
                            ${this._createColorPickerHTML("ambient.colorCorrection.tint.color", "Tint Color")}
                            ${this._createSliderHTML("ambient.colorCorrection.tint.amount", "Tint Amount", 0, 1, 0.01)}
                    </div></details>
                </div>
            </details>
            <details id="details-ambient-rendering">
                <summary><span class="accordion-toggle"></span><strong>Rendering Order</strong></summary>
                <div>
                    <p class="description-text">Controls the draw order of this layer relative to others like lighting and tokens. Higher values are drawn on top.</p>
                    ${this._createSliderHTML("ambientLayerZIndex", "Layer Z-Index", 0, 500, 10, "Default z-indexes: Tokens=100, Lighting=200, Weather=300, Fog=400")}
                    <button id="reload-canvas-btn" style="width: 100%; margin-top: 5px;">Reload Canvas to Apply Z-Index</button>
                </div>
            </details>
        `);
      content += this._createAccordionHTML("groundGlow", "Glow in the Dark", `
            ${this._createTextureInputHTML("groundGlow", "Glow Texture")}
            <p class="description-text">Makes a texture appear to glow only in unlit areas of the scene. Requires scene lighting.</p>
            ${this._createSliderHTML("groundGlow.intensity", "Intensity", 0, 5, 0.05)}
    
            <details id="details-groundGlow-tokenMasking">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${this._createCheckboxHTML("groundGlow.tokenMasking.enabled", "Token Masking", true)}
                    </div>
                </summary>
                <div style="padding-left: 15px;">
                     <p class="description-text">Hides the effect behind tokens. This layer is already in a high-level group, so it should work by default.</p>
                    ${this._createSliderHTML("groundGlow.tokenMasking.threshold", "Mask Threshold", 0, 1, 0.01)}
                </div>
            </details>
    
            ${this._createSliderHTML("groundGlow.luminanceThreshold", "Light Threshold", 0, 1, 0.01, "The scene brightness level above which the glow will fade out.")}
            ${this._createSliderHTML("groundGlow.softness", "Edge Softness", 0.01, 1, 0.01)}
            ${this._createCheckboxHTML("groundGlow.invert", "Invert (Glow in Light)", false, "Makes the effect appear in lit areas instead of dark ones.")}
            ${this._createSliderHTML("groundGlow.brightness", "Brightness", 0, 5, 0.05)}
            ${this._createSliderHTML("groundGlow.saturation", "Saturation", 0, 5, 0.05)}
        `);
      content += this._createAccordionHTML("advancedBloom", "Global Bloom Effect", `
            <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;">
                <strong style="color: #ffddaa;">EXPERIMENTAL:</strong> This is a global post-processing effect that applies bloom to the entire scene. It is currently unsupported and may not work as expected or may conflict with other modules.
            </div>
            ${this._createSliderHTML("advancedBloom.threshold", "Threshold", 0, 1, 0.01)}
            ${this._createSliderHTML("advancedBloom.bloomScale", "Bloom Scale", 0, 4, 0.05)}
            ${this._createSliderHTML("advancedBloom.brightness", "Brightness", 0, 2, 0.05)}
            ${this._createSliderHTML("advancedBloom.blur", "Blur Amount", 0, 20, 0.5)}
            ${this._createSliderHTML("advancedBloom.quality", "Quality", 1, 15, 1)}
        `);
      content += this._createAccordionHTML("postProcessing", "Post Processing", `
            <p class="description-text">Applies global screen-space effects to the entire canvas, like a Photoshop filter.</p>
            <details id="details-postProcessing-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("postProcessing.colorCorrection.enabled", "Color Correction", true)}</div></summary>
                <div>
                    <details id="details-postProcessing-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 15px;">
                            ${this._createSliderHTML("postProcessing.colorCorrection.saturation", "Saturation", 0, 4, 0.05)}
                            ${this._createSliderHTML("postProcessing.colorCorrection.brightness", "Brightness", -1, 1, 0.01)}
                            ${this._createSliderHTML("postProcessing.colorCorrection.contrast", "Contrast", 0, 4, 0.05)}
                            ${this._createCheckboxHTML("postProcessing.colorCorrection.invert", "Invert Colors")}
                    </div></details>
                    <details id="details-postProcessing-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 15px;">
                            ${this._createSliderHTML("postProcessing.colorCorrection.exposure", "Exposure", -2, 2, 0.05, "Multiplies scene brightness, simulating camera exposure.")}
                            ${this._createSliderHTML("postProcessing.colorCorrection.gamma", "Gamma", 0.2, 2.5, 0.05, "Adjusts mid-tones. < 1 lightens, > 1 darkens.")}
                            ${this._createSliderHTML("postProcessing.colorCorrection.levels.inBlack", "Black Point", 0, 1, 0.01, "Sets the darkest point of the image.")}
                            ${this._createSliderHTML("postProcessing.colorCorrection.levels.inWhite", "White Point", 0, 1, 0.01, "Sets the brightest point of the image.")}
                    </div></details>
                    <details id="details-postProcessing-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 15px;">
                            <p class="description-text">Simulates camera white balance correction.</p>
                            ${this._createSliderHTML("postProcessing.colorCorrection.whiteBalance.temperature", "Temperature", -1, 1, 0.01, "Negative values are cooler (blue), positive are warmer (orange).")}
                            ${this._createSliderHTML("postProcessing.colorCorrection.whiteBalance.tint", "Tint", -1, 1, 0.01, "Negative values shift toward magenta, positive toward green.")}
                    </div></details>
                    <details id="details-postProcessing-cc-highlights">
                        <summary><span class="accordion-toggle"></span><strong>Highlight Adjustments</strong></summary>
                        <div style="padding-left: 15px;">
                            <p class="description-text">Boost brightness in areas unaffected by certain shadow effects.</p>
                            <details id="details-postProcessing-cc-highlightCloud">
                                <summary><span class="accordion-toggle"></span>
                                    <div class="summary-control">${this._createCheckboxHTML("postProcessing.colorCorrection.highlightCloud.enabled", "Cloud Highlights", true)}</div>
                                </summary>
                                <div style="padding-left: 15px;">
                                    <p class="description-text">Brightens the sky between cloud shadows.</p>
                                    ${this._createSliderHTML("postProcessing.colorCorrection.highlightCloud.brightness", "Brightness", 0, 2, 0.01)}
                                </div>
                            </details>
                            <details id="details-postProcessing-cc-highlightCanopy">
                                <summary><span class="accordion-toggle"></span>
                                    <div class="summary-control">${this._createCheckboxHTML("postProcessing.colorCorrection.highlightCanopy.enabled", "Canopy Highlights", true)}</div>
                                </summary>
                                <div style="padding-left: 15px;">
                                    <p class="description-text">Brightens the light filtering through the canopy.</p>
                                    ${this._createSliderHTML("postProcessing.colorCorrection.highlightCanopy.brightness", "Brightness", 0, 5, 0.01)}
                                    </div>
                                </details>
                                <details id="details-postProcessing-cc-highlightStructural">
                                    <summary><span class="accordion-toggle"></span>
                                        <div class="summary-control">${this._createCheckboxHTML("postProcessing.colorCorrection.highlightStructural.enabled", "Structural Highlights", true)}</div>
                                    </summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Brightens the areas not in structural shadow (e.g., areas between rafters).</p>
                                        ${this._createSliderHTML("postProcessing.colorCorrection.highlightStructural.brightness", "Brightness", 0, 5, 0.01)}
                                    </div>
                                </details>
                            </div>
                        </details>
                    <details id="details-postProcessing-cc-tint"><summary><span class="accordion-toggle"></span><strong>Global Tint</strong></summary><div style="padding-left: 15px;">
                            <p class="description-text">Applies a color overlay to the entire scene.</p>
                            ${this._createColorPickerHTML("postProcessing.colorCorrection.tint.color", "Tint Color")}
                            ${this._createSliderHTML("postProcessing.colorCorrection.tint.amount", "Tint Amount", 0, 1, 0.01)}
                    </div></details>
                     <details id="details-postProcessing-cc-mask"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("postProcessing.colorCorrection.mask.enabled", "Luminance Mask", true)}</div></summary><div style="padding-left: 15px;">
                            <p class="description-text">Applies the color correction only to lit areas of the scene. Requires the Illumination Buffer module.</p>
                            ${this._createCheckboxHTML("postProcessing.colorCorrection.mask.invert", "Invert Mask (Affect Dark Areas)")}
                            ${this._createSliderHTML("postProcessing.colorCorrection.mask.luminanceThreshold", "Light Threshold", 0, 1, 0.01)}
                            ${this._createSliderHTML("postProcessing.colorCorrection.mask.softness", "Edge Softness", 0.01, 1, 0.01)}
                    </div></details>
                     <details id="details-postProcessing-cc-selective"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("postProcessing.colorCorrection.selective.enabled", "Selective Color Desaturation", true)}</div></summary><div style="padding-left: 15px;">
                            <p class="description-text">Desaturates all colors except for a specific target color range.</p>
                            ${this._createColorPickerHTML("postProcessing.colorCorrection.selective.color", "Target Color")}
                            ${this._createSliderHTML("postProcessing.colorCorrection.selective.hueRange", "Hue Range", 0, 0.5, 0.01)}
                            ${this._createSliderHTML("postProcessing.colorCorrection.selective.saturationRange", "Saturation Range", 0, 0.5, 0.01)}
                    </div></details>
                </div>
            </details>
            <details id="details-postProcessing-vignette"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("postProcessing.vignette.enabled", "Vignette", true)}</div></summary>
                <div>${this._createSliderHTML("postProcessing.vignette.amount", "Amount", 0, 1, 0.01)}${this._createSliderHTML("postProcessing.vignette.softness", "Softness", 0.01, 1, 0.01)}</div>
            </details>
            <details id="details-postProcessing-lensDistortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("postProcessing.lensDistortion.enabled", "Lens Distortion", true)}</div></summary>
                <div>
                    ${this._createSliderHTML("postProcessing.lensDistortion.amount", "Amount", -0.2, 0.2, 1e-3)}
                    ${this._createSliderHTML("postProcessing.lensDistortion.centerX", "Center X", 0, 1, 0.01)}
                    ${this._createSliderHTML("postProcessing.lensDistortion.centerY", "Center Y", 0, 1, 0.01)}
                </div>
            </details>
             <details id="details-postProcessing-chromaticAberration"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("postProcessing.chromaticAberration.enabled", "Chromatic Aberration", true)}</div></summary>
                <div>
                    ${this._createSliderHTML("postProcessing.chromaticAberration.amount", "Amount", -0.05, 0.05, 1e-3)}
                    ${this._createSliderHTML("postProcessing.chromaticAberration.centerX", "Center X", 0, 1, 0.01)}
                    ${this._createSliderHTML("postProcessing.chromaticAberration.centerY", "Center Y", 0, 1, 0.01)}
                </div>
            </details>
            <details id="details-postProcessing-tiltShift"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("postProcessing.tiltShift.enabled", "Tilt Shift", true)}</div></summary>
                <div>
                    <p class="description-text">Simulates a tilt-shift lens, blurring the top and bottom of the screen. Requires a library that may not be bundled with all Foundry versions.</p>
                    ${this._createSliderHTML("postProcessing.tiltShift.blur", "Blur", 0, 50, 1)}
                    ${this._createSliderHTML("postProcessing.tiltShift.gradientBlur", "Gradient Size", 0, 5e3, 10)}
                    ${this._createSliderHTML("postProcessing.tiltShift.startX", "Start X", 0, 1, 0.01)}
                    ${this._createSliderHTML("postProcessing.tiltShift.startY", "Start Y", 0, 1, 0.01)}
                    ${this._createSliderHTML("postProcessing.tiltShift.endX", "End X", 0, 1, 0.01)}
                    ${this._createSliderHTML("postProcessing.tiltShift.endY", "End Y", 0, 1, 0.01)}
                </div>
            </details>
             <button id="output-config-btn" title="Log the current full config object to the console for copy/pasting." style="width: 100%; margin-top: 5px;">Log Full Config to Console</button>
        `);
      content += this._createAccordionHTML("prism", "Prism Effect", `
            ${this._createTextureInputHTML("prism", "Effect Mask (_Prism)")}
            <p class="description-text">Splits the light from the brightest parts of the scene into a prismatic, chromatic aberration effect.</p>
            ${this._createSliderHTML("prism.intensity", "Intensity", 0, 50, 0.5, "The distance in pixels the color channels are split.")}
            ${this._createSliderHTML("prism.angle", "Angle", 0, 360, 1, "The direction of the color split.")}
            ${this._createSliderHTML("prism.threshold", "Luminance Threshold", 0, 1, 0.01, "The effect will only apply to pixels brighter than this value.")}
            ${this._createSliderHTML("prism.softness", "Threshold Softness", 0.01, 1, 0.01, "The softness of the transition at the luminance threshold.")}
        
            <details id="details-prism-distortionNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML("prism.distortionNoise.enabled", "Distortion", true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Uses a noise pattern to warp and animate the prism effect.</p>
                    ${this._createSliderHTML("prism.distortionStrength", "Distortion Strength", 0, 10, 0.1)}
                    ${this._createSliderHTML("prism.distortionNoise.speed", "Speed", -0.5, 0.5, 5e-3)}
                    ${this._createSliderHTML("prism.distortionNoise.scale", "Scale", 0.01, 10, 0.01)}
                    ${this._createSliderHTML("prism.distortionNoise.evolution", "Evolution", 0, 1, 0.01)}
                    <details id="details-prism-distortionNoise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                        <div style="padding-left: 15px;">
                            ${this._createSliderHTML("prism.distortionNoise.threshold", "Threshold", 0, 1, 0.01)}
                            ${this._createSliderHTML("prism.distortionNoise.brightness", "Brightness", -1, 1, 0.01)}
                            ${this._createSliderHTML("prism.distortionNoise.contrast", "Contrast", 0, 5, 0.05)}
                            ${this._createSliderHTML("prism.distortionNoise.softness", "Softness", 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
           
        `);
      return content;
    }
    _createSafeId(path) {
      return `control-${path.replace(/\.|\[|\]|\s/g, "-")}`;
    }
    _createAccordionHTML(id, title, content) {
      const path = `${id}.enabled`;
      return `<details id="details-${id}">
                    <summary>
                         <span class="accordion-toggle"></span>
                         <div class="summary-control">
                            ${this._createCheckboxHTML(path, title, true)}
                         </div>
                    </summary>
                    <div style="padding-top: 5px;">${content}</div>
                </details>`;
    }
    _createCheckboxHTML(path, label, isSummary = false, title = "") {
      const id = this._createSafeId(path);
      const titleAttr = title ? `title="${title}"` : "";
      const checkbox = `<div class="widget-group"><input type="checkbox" id="${id}" data-path="${path}"></div>`;
      const labelHtml = isSummary ? `<span class="summary-label" ${titleAttr}>${label}</span>` : `<label for="${id}" class="summary-label" ${titleAttr}>${label}</label>`;
      if (isSummary) {
        return `${labelHtml}${checkbox}`;
      }
      return `<div class="control-row">${labelHtml}${checkbox}</div>`;
    }
    _createSliderHTML(path, label, min, max, step, title = "") {
      const id = this._createSafeId(path);
      const titleAttr = title ? `title="${title}"` : "";
      return `<div class="control-row control-row-slider"><label for="${id}" ${titleAttr}>${label}</label><input type="range" id="${id}" data-path="${path}" min="${min}" max="${max}" step="${step}"><span id="${id}-value" class="value-span">0.0</span></div>`;
    }
    _createColorPickerHTML(path, label) {
      const id = this._createSafeId(path);
      return `<div class="control-row"><label for="${id}">${label}</label><div class="widget-group" style="flex-grow: 1;"><input type="color" id="${id}" data-path="${path}"></div></div>`;
    }
    _createSelectHTML(path, label, options, title = "") {
      const id = this._createSafeId(path);
      const titleAttr = title ? `title="${title}"` : "";
      const opts = Object.entries(options).map(([k, v]) => `<option value="${v}">${k}</option>`).join("");
      return `<div class="control-row"><label for="${id}" ${titleAttr}>${label}</label><select id="${id}" data-path="${path}">${opts}</select></div>`;
    }
    _createGradientSelectHTML(path, label) {
      const id = this._createSafeId(path);
      const opts = Object.entries(GRADIENT_PRESETS).map(([name, data]) => {
        const gradientCSS = `linear-gradient(to right, ${data.colors.join(", ")})`;
        return `<option value="${name}" style="background: ${gradientCSS};">${name}</option>`;
      }).join("");
      return `<div class="control-row"><label for="${id}">${label}</label><select id="${id}" data-path="${path}" class="gradient-picker">${opts}</select></div>`;
    }
    _createTextureInputHTML(key, label) {
      return `<div class="control-row" style="margin-bottom: 5px;"><label><span id="status-textures-${key}" class="traffic-light unknown"></span>${label}</label><input type="text" id="texture-path-${key}" disabled title="This path is discovered automatically based on the base map's filename. (e.g., 'map.webp' -> 'map_Specular.webp')"></div>`;
    }
  };
  var DebuggerEventHandler = class {
    constructor(element, profileManager) {
      this.element = element;
      this.profileManager = profileManager;
    }
    get config() {
      return this.profileManager.activeConfig;
    }
    initialize() {
      this.addEventListeners();
      this._makeDraggable();
      this.updateAllControls();
    }
    addEventListeners() {
      this.element.addEventListener("input", this._handleGenericInput.bind(this));
      const addListener = (selector, event, handler) => {
        const el = this.element.querySelector(selector);
        if (el) {
          el.addEventListener(event, handler.bind(this));
        } else {
          console.warn(`MapShine Debugger: Could not find element with selector '${selector}' to attach event listener.`);
        }
      };
      addListener("#material-editor-close-btn", "click", this._onClose);
      addListener("#material-editor-minimize-btn", "click", this._onMinimize);
      addListener("#reload-canvas-btn", "click", () => window.location.reload());
      addListener("#profile-save", "click", this._onSaveProfile);
      addListener("#profile-load", "click", this._onLoadProfile);
      addListener("#profile-update", "click", this._onUpdateProfile);
      addListener("#profile-delete", "click", this._onDeleteProfile);
      addListener("#profile-set-default", "click", this._onSetDefaultProfile);
      addListener("#profile-save-scene", "click", () => this.profileManager.saveConfigToScene());
      addListener("#profile-revert-scene", "click", () => this.profileManager.revertToSceneDefault());
      addListener("#profile-revert-module", "click", () => this.profileManager.revertToModuleDefault());
      addListener("#output-config-btn", "click", this._onOutputConfig);
    }
    _createSafeId(path) {
      return `control-${path.replace(/\.|\[|\]|\s/g, "-")}`;
    }
    setEffectAvailability(effectKey, isAvailable) {
      if (!this.element)
        return;
      const detailsElement = this.element.querySelector(`#details-${effectKey}`);
      if (!detailsElement)
        return;
      const checkboxId = this._createSafeId(`${effectKey}.enabled`);
      const checkboxElement = this.element.querySelector(`#${checkboxId}`);
      if (isAvailable) {
        detailsElement.classList.remove("effect-unavailable");
        if (checkboxElement)
          checkboxElement.disabled = false;
      } else {
        detailsElement.classList.add("effect-unavailable");
        if (checkboxElement) {
          checkboxElement.disabled = true;
          checkboxElement.checked = false;
        }
      }
    }
    _onClose() {
      game.mapShine.debugger?.destroy();
    }
    _onMinimize() {
      this.element.classList.toggle("minimized");
    }
    _getPathValue(obj, path) {
      return foundry.utils.getProperty(obj, path);
    }
    async _handleGenericInput(e) {
      const path = e.target.dataset.path;
      if (!path)
        return;
      let value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      if (e.target.type === "range" || e.target.tagName === "SELECT" && !isNaN(Number(value))) {
        value = Number(value);
      }
      if (e.target.type === "range") {
        this._updateSliderValue(e.target.id, value, e.target.step);
      }
      if (e.target.type === "checkbox" && e.target.closest(".summary-control")) {
        const detailsElement = e.target.closest("details");
        if (detailsElement)
          detailsElement.classList.toggle("disabled-effect", !e.target.checked);
      }
      if (path === "baseShine.patternType") {
        this._updatePatternControlVisibility();
      }
      if (path === "tileOpacity") {
        await game.mapShine.effectTargetManager.refresh();
      }
    }
    updateAllControls() {
      this.element.querySelectorAll("[data-path]").forEach((el) => {
        const path = el.dataset.path;
        const value = this._getPathValue(this.config, path);
        if (value === void 0)
          return;
        if (el.type === "checkbox")
          el.checked = value;
        else
          el.value = value;
        if (el.type === "range")
          this._updateSliderValue(el.id, value, el.step);
        if (el.closest(".summary-control")) {
          const detailsElement = el.closest("details");
          if (detailsElement)
            detailsElement.classList.toggle("disabled-effect", !el.checked);
        }
      });
      this._updatePatternControlVisibility();
    }
    applyProfileUIState(profileData) {
      if (!profileData?.ui?.details)
        return;
      for (const [id, isOpen] of Object.entries(profileData.ui.details)) {
        const detailElement = this.element.querySelector(`#${id}`);
        if (detailElement)
          detailElement.open = isOpen;
      }
    }
    _updateSliderValue(elementId, value, step) {
      const valueEl = this.element.querySelector(`#${elementId}-value`);
      if (valueEl) {
        const stepString = String(step);
        const decimals = stepString.includes(".") ? stepString.split(".")[1].length : 0;
        valueEl.textContent = Number(value).toFixed(decimals);
      }
    }
    _updatePatternControlVisibility() {
      const isStripes = this.config.baseShine.patternType === "stripes";
      this.element.querySelector("#pattern-stripes-controls").style.display = isStripes ? "" : "none";
      this.element.querySelector("#pattern-checkerboard-controls").style.display = isStripes ? "none" : "";
    }
    async _populateProfilesDropdown() {
      const dropdown = this.element.querySelector("#profiles-dropdown");
      const profiles = await this.profileManager.getProfiles();
      const names = Object.keys(profiles).sort();
      const defaultProfileName = this.profileManager.getDefaultProfileName();
      dropdown.innerHTML = "";
      if (names.length) {
        names.forEach((n) => {
          const isDefault = n === defaultProfileName ? " (Default)" : "";
          dropdown.add(new Option(`${n}${isDefault}`, n));
        });
        dropdown.value = defaultProfileName || names[0];
        dropdown.disabled = false;
      } else {
        dropdown.add(new Option("No profiles saved", ""));
        dropdown.disabled = true;
      }
    }
    async _onSaveProfile() {
      const nameInput = this.element.querySelector("#profile-name");
      const name = nameInput.value.trim();
      const uiState = {
        details: {}
      };
      this.element.querySelectorAll("details[id]").forEach((el) => {
        uiState.details[el.id] = el.open;
      });
      const success = await this.profileManager.saveProfile(name, this.profileManager.activeConfig, uiState);
      if (success) {
        nameInput.value = "";
        this._populateProfilesDropdown();
      }
    }
    async _onUpdateProfile() {
      const name = this.element.querySelector("#profiles-dropdown").value;
      const uiState = {
        details: {}
      };
      this.element.querySelectorAll("details[id]").forEach((el) => {
        uiState.details[el.id] = el.open;
      });
      const success = await this.profileManager.updateProfile(name, this.profileManager.activeConfig, uiState);
      if (success) {
        this._populateProfilesDropdown();
      }
    }
    async _onLoadProfile() {
      const name = this.element.querySelector("#profiles-dropdown").value;
      if (name)
        await this.profileManager.loadProfile(name);
    }
    async _onDeleteProfile() {
      const name = this.element.querySelector("#profiles-dropdown").value;
      if (!name)
        return;
      const confirmed = await Dialog.confirm({
        title: "Delete Profile",
        content: `<p>Are you sure you want to delete the world profile "<strong>${name}</strong>"? This cannot be undone.</p>`,
        defaultYes: false
      });
      if (confirmed && await this.profileManager.deleteProfile(name)) {
        this._populateProfilesDropdown();
      }
    }
    async _onSetDefaultProfile() {
      const name = this.element.querySelector("#profiles-dropdown").value;
      if (name) {
        await this.profileManager.setDefaultProfile(name);
        this._populateProfilesDropdown();
      }
    }
    _onOutputConfig() {
      const configString = JSON.stringify(this.config, null, 4);
      console.log("--- MAP SHINE: CURRENT CONFIG VALUES ---");
      console.log(configString);
      console.log("--- END CONFIG ---");
      try {
        navigator.clipboard.writeText(configString);
        ui.notifications.info("Config logged to console & copied to clipboard.");
      } catch (err) {
        ui.notifications.warn("Config logged to console. (Copying failed).");
      }
    }
    _makeDraggable() {
      const elmnt = this.element;
      const header = elmnt.querySelector("#material-editor-header");
      if (!header)
        return;
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const dragMouseDown = (e) => {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      };
      const elementDrag = (e) => {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        let newTop = elmnt.offsetTop - pos2;
        let newLeft = elmnt.offsetLeft - pos1;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const elmntWidth = elmnt.offsetWidth;
        const headerHeight = header.offsetHeight;
        const minVisibleWidth = 100;
        newTop = Math.max(0, newTop);
        newTop = Math.min(newTop, winHeight - headerHeight);
        newLeft = Math.max(newLeft, -elmntWidth + minVisibleWidth);
        newLeft = Math.min(newLeft, winWidth - minVisibleWidth);
        elmnt.style.top = `${newTop}px`;
        elmnt.style.left = `${newLeft}px`;
      };
      const closeDragElement = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };
      header.onmousedown = dragMouseDown;
    }
  };
  var MaterialEditorDebugger = class {
    constructor() {
      this.element = null;
      this.uiBuilder = null;
      this.eventHandler = null;
      this.profileManager = null;
      this._boundUpdateIndicator = this._updateIndicator.bind(this);
    }
    initialize(profileManager) {
      this.profileManager = profileManager;
      this.uiBuilder = new DebuggerUIBuilder();
      this.element = this.uiBuilder.buildRootElement();
      document.body.appendChild(this.element);
      this.eventHandler = new DebuggerEventHandler(this.element, this.profileManager);
      this.eventHandler.initialize();
      const initialTop = 80;
      const initialLeft = (window.innerWidth - this.element.offsetWidth) / 2;
      this.element.style.top = `${initialTop}px`;
      this.element.style.left = `${initialLeft}px`;
      this._populateAllIndicators();
      systemStatus.on("statusChanged", this._boundUpdateIndicator);
      console.log("Material Editor | UI system initialized and subscribed to status updates.");
    }
    destroy() {
      systemStatus.off("statusChanged", this._boundUpdateIndicator);
      this.element?.remove();
      this.element = null;
      this.uiBuilder = null;
      this.eventHandler = null;
      this.profileManager = null;
      game.mapShine.debugger = null;
      ui.controls.render(true);
      console.log("Material Editor | UI destroyed.");
    }
    applyProfileState(profileData) {
      if (this.eventHandler) {
        this.eventHandler.updateAllControls();
        this.eventHandler.applyProfileUIState(profileData);
      }
    }
    _populateAllIndicators() {
      const allStatuses = systemStatus.getAllStatuses();
      for (const [category, statuses] of Object.entries(allStatuses)) {
        for (const [key, statusObject] of Object.entries(statuses)) {
          this._updateIndicator(category, key, statusObject);
        }
      }
    }
    _updateIndicator(category, key, statusObject) {
      const light = this.element.querySelector(`#status-${category}-${key}`);
      if (light) {
        light.className = `traffic-light ${statusObject.state}`;
        light.title = statusObject.message;
      }
      if (category === "textures") {
        const pathInput = this.element.querySelector(`#texture-path-${key}`);
        if (pathInput) {
          pathInput.value = statusObject.message;
          pathInput.title = statusObject.message;
        }
      }
    }
  };
  Hooks.once("init", () => {
    if (game.mapShine?.initialized) {
      console.log("Map Shine | Initialization aborted: module has already been initialized.");
      return;
    }
    game.mapShine = {
      initialized: true,
      loadingScreen: null,
      // Global handle for the loading screen
      profileManager: new ProfileManager(),
      debugger: null,
      // The UI is a global singleton
      // The effect target manager is global, as it's tied to the canvas object which is globally accessible.
      effectTargetManager: {
        targets: {
          background: null,
          tiles: /* @__PURE__ */ new Map()
        },
        async refresh() {
          console.log("MapShine | Refreshing effect targets and updating system status...");
          const loader = new TextureAutoLoader();
          this.targets = await loader.discoverAllTargets();
          const allTargets = [this.targets.background, ...this.targets.tiles.values()].filter((t) => t);
          for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
            const foundPath = allTargets.map((t) => t[key]).find((p) => p);
            if (foundPath) {
              systemStatus.update("textures", key, {
                state: "ok",
                message: foundPath
              });
            } else {
              systemStatus.update("textures", key, {
                state: "inactive",
                message: "Auto-discovery found no matching file."
              });
            }
          }
          this.applyTileOpacities();
          await this.broadcastUpdate();
          if (canvas.ready) {
            MapShineLifecycle.finalizeConfigurationAndUI();
          }
          Hooks.callAll("mapShine:targetsRefreshed");
        },
        async broadcastUpdate() {
          const updatePromises = [];
          for (const layer of canvas.layers) {
            if (typeof layer.updateEffectTargets === "function") {
              updatePromises.push(layer.updateEffectTargets(this.targets));
            }
          }
          await Promise.all(updatePromises);
        },
        applyTileOpacities() {
          const config = game.mapShine.profileManager.activeConfig;
          for (const tile of canvas.tiles.placeables) {
            if (!tile.mesh)
              continue;
            const isTargetWithEffects = this.targets.tiles.has(tile.id) && config.enabled;
            if (isTargetWithEffects) {
              tile.mesh.alpha = config.tileOpacity;
            } else {
              tile.mesh.alpha = 1;
            }
          }
        }
      },
      showEditor: async function() {
        if (game.mapShine.debugger) {
          game.mapShine.debugger.element.classList.remove("minimized");
          return;
        }
        game.mapShine.debugger = new MaterialEditorDebugger();
        game.mapShine.debugger.initialize(game.mapShine.profileManager);
        await game.mapShine.profileManager.initializeUI(game.mapShine.debugger);
      }
    };
    console.log("Map Shine | Library Test: Verifying PIXI.particles global.");
    if (PIXI.particles && typeof PIXI.particles.Emitter === "function") {
      console.log("%cSUCCESS:", "color: #4CAF50; font-weight: bold;", "pixi-particles library loaded correctly onto PIXI object.");
    } else {
      console.error("FAILURE: pixi-particles library did not attach to the global PIXI object.");
    }
    game.settings.register(MODULE_ID, "disable-loading-screen", {
      name: "Disable Loading Screen",
      hint: "Completely disables the loading screen feature. Disabling this may cause some effects and layers to pop into existence a moment after the scene has finished loading, which can be jarring. Recommended to keep enabled unless it causes issues.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false
    });
    game.settings.register(MODULE_ID, "user-disable-distortion", {
      name: "Global Override: Disable Screen Distortion",
      hint: "Disables all screen-warping effects (e.g., Heat, Lens Distortion) to prevent motion sickness. This overrides all other settings.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
      onChange: () => {
        if (canvas?.ready && game.mapShine?.profileManager) {
          game.mapShine.profileManager.initializeForScene();
          game.mapShine.profileManager.updateAllSystemsFromConfig();
        }
      }
    });
    game.settings.register(MODULE_ID, "user-disable-color-fringe", {
      name: "Global Override: Disable Color Fringe",
      hint: "Disables all 'chromatic aberration' effects to improve visual clarity. This overrides all other settings.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
      onChange: () => {
        if (canvas?.ready && game.mapShine?.profileManager) {
          game.mapShine.profileManager.initializeForScene();
          game.mapShine.profileManager.updateAllSystemsFromConfig();
        }
      }
    });
    Object.entries(CLIENT_OVERRIDES_CONFIG).forEach(([key, data]) => {
      game.settings.register(MODULE_ID, `user-${key}-enabled`, {
        name: data.name,
        hint: `Toggles the '${data.name}' effect. If off, this overrides the scene's setting.`,
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => {
          if (canvas?.ready && game.mapShine?.profileManager) {
            game.mapShine.profileManager.initializeForScene();
            game.mapShine.profileManager.updateAllSystemsFromConfig();
          }
        }
      });
      if (data.intensitySubPath) {
        game.settings.register(MODULE_ID, `user-${key}-intensity`, {
          name: `+- Intensity`,
          hint: `Modifies the intensity of '${data.name}' as a percentage of the scene's setting.`,
          scope: "client",
          config: true,
          type: Number,
          range: {
            min: 0,
            max: 100,
            step: 1
          },
          default: 100,
          onChange: () => {
            if (canvas?.ready && game.mapShine?.profileManager) {
              game.mapShine.profileManager.initializeForScene();
              game.mapShine.profileManager.updateAllSystemsFromConfig();
            }
          }
        });
      }
    });
    game.settings.register(MODULE_ID, PROFILES_SETTING, {
      name: "Material Effect Profiles",
      scope: "world",
      config: false,
      type: Object,
      default: {}
    });
    game.settings.register(MODULE_ID, DEFAULT_PROFILE_SETTING, {
      name: "Default Material Profile Name",
      scope: "world",
      config: false,
      type: String,
      default: ""
    });
    game.settings.register(MODULE_ID, "user-adjustments", {
      name: "User-specific FX Overrides",
      scope: "client",
      config: false,
      type: Object,
      default: {}
    });
    game.settings.register(MODULE_ID, "ambientLayerZIndex", {
      name: "Ambient Layer Z-Index (Requires Reload)",
      hint: "Controls the rendering order of the Ambient/Emissive layer. Changes require a canvas reload.",
      scope: "client",
      config: false,
      type: Number,
      default: 250
    });
    if (game.modules.get("libwrapper")?.active) {
      libwrapper.register(MODULE_ID, "Token.prototype.refresh", function(wrapped, ...args) {
        wrapped(...args);
        if (canvas?.mapShine?.tokenMaskManager) {
          canvas.mapShine.tokenMaskManager._requestUpdate();
        }
      }, "WRAPPER");
      libwrapper.register(MODULE_ID, "Canvas.prototype.pan", function(wrapped, ...args) {
        const result = wrapped(...args);
        for (const layer of canvas.layers) {
          if (typeof layer?._onPan === "function") {
            layer._onPan();
          }
          if (typeof layer?._onResize === "function") {
            layer._onResize();
          }
        }
        if (canvas?.mapShine?.ambientMaskManager?._onResize) {
          canvas.mapShine.ambientMaskManager._onResize();
        }
        return result;
      }, "WRAPPER");
      console.log("MapShine | libWrapper hooks for Token Refresh and Canvas Pan have been registered.");
    } else {
      console.warn("MapShine | libWrapper is not active. Some performance optimizations will not be available.");
    }
    Hooks.on("getSceneControlButtons", (controls) => {
      if (!game.user.isGM)
        return;
      const mapShineButton = {
        name: "map-shine",
        title: "Map Shine Toolkit",
        icon: "fas fa-star",
        layer: "mapShineControls",
        tools: {
          "open-editor": {
            name: "open-editor",
            title: "Open Editor",
            icon: "fas fa-star",
            toggle: true,
            active: !!game.mapShine?.debugger,
            onClick: (toggled) => {
              if (toggled) {
                if (game.mapShine?.showEditor) {
                  game.mapShine.showEditor();
                }
              } else {
                game.mapShine.debugger?.destroy();
              }
            }
          }
        },
        activeTool: "open-editor"
      };
      controls["map-shine"] = mapShineButton;
    });
    const ambientZIndex = game.settings.get(MODULE_ID, "ambientLayerZIndex");
    Object.assign(CONFIG.Canvas.layers, {
      mapShineBackground: {
        layerClass: BackgroundLayer,
        group: "primary"
      },
      dust: {
        layerClass: DustLayer,
        group: "environment"
      },
      groundGlow: {
        layerClass: GroundGlowLayer,
        group: "environment"
      },
      heatDistortion: {
        layerClass: HeatDistortionLayer,
        group: "primary"
      },
      iridescence: {
        layerClass: IridescenceLayer,
        group: "primary"
      },
      metallicShine: {
        layerClass: MetallicShineLayer,
        group: "primary"
      },
      canopy: {
        layerClass: CanopyLayer,
        group: "environment"
      },
      structuralShadows: {
        layerClass: StructuralShadowsLayer,
        group: "environment"
      },
      cloudShadows: {
        layerClass: CloudShadowsLayer,
        group: "environment"
      },
      ambient: {
        layerClass: AmbientLayer,
        group: "environment",
        zIndex: ambientZIndex
      },
      gpuParticleTest: {
        layerClass: GpuParticleTestLayer,
        group: "environment"
      }
    });
    console.log(`MaterialToolkit | Registered all settings and layers. AmbientLayer zIndex set to: ${ambientZIndex}.`);
    Hooks.on("createTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("updateTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("deleteTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("canvasReady", MapShineLifecycle.onCanvasReady);
    Hooks.on("canvasTearDown", MapShineLifecycle.onCanvasTearDown);
  });
  var MyStableLayer = class extends foundry.canvas.layers.CanvasLayer {
    /**
     * --- PRINCIPLE 1: THE SACRED CONSTRUCTOR ---
     * Only initialize properties to their default (usually null) state.
     * DO NOT create PIXI objects here. DO NOT bind listeners here.
     */
    constructor() {
      super();
      this.myContainer = null;
      this.mySprite = null;
      this.myFilter = null;
      this._destroyed = false;
      this._framesSinceLoad = 0;
    }
    /**
     * --- PRINCIPLE 2: THE ROBUST DRAW METHOD ---
     * Create all PIXI objects and bind all listeners here.
     * This is the layer's "birth" or "re-birth" on every scene load.
     */
    async _draw(options) {
      this._framesSinceLoad = 0;
      this._destroyed = false;
      this._onAnimateBound = this._onAnimate.bind(this);
      this.myContainer = new PIXI.Container();
      this.mySprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
      this.myFilter = new PIXI.filters.AlphaFilter(0.5);
      this.myContainer.filters = [this.myFilter];
      this.myContainer.addChild(this.mySprite);
      this.addChild(this.myContainer);
      canvas.app.ticker.add(this._onAnimateBound);
    }
    /**
     * --- PRINCIPLE 3: THE PATIENT SENTRY ANIMATION LOOP ---
     * Check all dependencies on every frame before rendering.
     */
    _onAnimate() {
      if (this._destroyed)
        return;
      this._framesSinceLoad++;
      this.myContainer.visible = false;
      if (!this.mySprite.texture.valid) {
        return;
      }
      if (this._framesSinceLoad < 5) {
        return;
      }
      this.myContainer.visible = true;
    }
    /**
     * --- PRINCIPLE 4: THE SCORCHED EARTH TEARDOWN ---
     * Meticulously destroy every object created in _draw and remove every listener.
     */
    async _tearDown(options) {
      if (this._destroyed)
        return;
      this._destroyed = true;
      if (this._onAnimateBound) {
        canvas.app.ticker.remove(this._onAnimateBound);
      }
      this.myFilter?.destroy();
      this.myContainer?.destroy({
        children: true,
        texture: true,
        baseTexture: true
      });
      this.myContainer = null;
      this.mySprite = null;
      this.myFilter = null;
      return super._tearDown(options);
    }
  };
  var GpuParticleTestLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor() {
      super();
      this.emitter = null;
    }
    async _draw(options) {
      console.log("Map Shine | Drawing GPU Particle Test Layer (Correct v4 API).");
      const particleContainer = new PIXI.Container();
      this.addChild(particleContainer);
      const art = ["modules/map-shine/assets/particle.webp"];
      const config = {
        alpha: { start: 0.8, end: 0 },
        scale: { start: 0.25, end: 0.05, minimumScaleMultiplier: 0.5 },
        speed: { start: 200, end: 100, minimumSpeedMultiplier: 1 },
        lifetime: { min: 1, max: 3 },
        frequency: 1e-3,
        emitterLifetime: -1,
        maxParticles: 1e3,
        pos: { x: 0, y: 0 },
        spawnType: "circle",
        spawnCircle: { x: 0, y: 0, r: 10 }
      };
      this.emitter = new Emitter(particleContainer, art, config);
      const view = canvas.app.screen;
      this.emitter.updateSpawnPos(view.width / 2, view.height / 2);
      this.emitter.emit = true;
      this.emitter.autoUpdate = true;
      return this;
    }
    async _tearDown(options) {
      console.log("Map Shine | Tearing down GPU Particle Test Layer.");
      if (this.emitter) {
        this.emitter.autoUpdate = false;
        this.emitter.destroy();
        this.emitter = null;
      }
      return super._tearDown(options);
    }
  };
  var DustLayer = class extends foundry.canvas.layers.CanvasLayer {
    constructor() {
      super();
      this.world = null;
      this.emitter = null;
      this.maskSprite = null;
    }
    async _draw() {
      const r = canvas.app.renderer;
      const dims = canvas.scene.dimensions;
      this.world = new PIXI.Container();
      this.addChild(this.world);
      const g = new PIXI.Graphics();
      g.beginFill(16711680).drawCircle(0, 0, 6).endFill();
      const redTex = r.generateTexture(g);
      g.destroy();
      const cfg = {
        alpha: { start: 0.9, end: 0 },
        scale: { start: 0.5, end: 0.2 },
        color: { start: "#ff0000", end: "#ff0000" },
        speed: { start: 60, end: 20 },
        lifetime: { min: 1, max: 2 },
        frequency: 1e-3,
        emitterLifetime: -1,
        maxParticles: 1600,
        pos: { x: 0, y: 0 },
        spawnType: "rect",
        spawnRect: { x: dims.sceneX, y: dims.sceneY, w: dims.sceneWidth, h: dims.sceneHeight }
      };
      this.emitter = new Emitter(this.world, [redTex], cfg);
      this.emitter.emit = true;
      this.emitter.autoUpdate = true;
      await this._attachBakedMask();
      this._forceMaskAlpha(0);
      return this;
    }
    async _attachBakedMask() {
      const t = this._findDustTarget();
      if (!t?.dust) {
        console.warn("DustLayer | No _Dust map found; skipping mask.");
        return;
      }
      const srcTex = await foundry.canvas.loadTexture(t.dust);
      const lumToAlpha = new PIXI.Filter(
        PIXI.Filter.defaultVertexSrc,
        `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        void main(){
          vec4 c = texture2D(uSampler, vTextureCoord);
          float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
          gl_FragColor = vec4(1.0, 1.0, 1.0, l); // white RGB, alpha=luminance
        }`
      );
      const baked = PIXI.RenderTexture.create({
        width: srcTex.width,
        height: srcTex.height,
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });
      const temp = new PIXI.Sprite(srcTex);
      temp.filters = [lumToAlpha];
      canvas.app.renderer.render(temp, { renderTexture: baked, clear: true });
      temp.destroy(true);
      const s = new PIXI.Sprite(baked);
      const rect = t.rect;
      s.anchor.set(0.5);
      s.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
      s.width = rect.width;
      s.height = rect.height;
      s.rotation = rect.rotation || 0;
      this.addChild(s);
      this.world.mask = s;
      this.maskSprite = s;
    }
    _forceMaskAlpha(value) {
      if (!this.maskSprite?.texture?.valid)
        return;
      const r = canvas.app.renderer;
      const baseTex = this.maskSprite.texture;
      const full = new PIXI.Filter(
        PIXI.Filter.defaultVertexSrc,
        `
        precision mediump float;
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float uA;
        void main(){
          vec4 c = texture2D(uSampler, vTextureCoord);
          gl_FragColor = vec4(1.0, 1.0, 1.0, uA);
        }`,
        { uA: value }
      );
      const rt = PIXI.RenderTexture.create({
        width: baseTex.width,
        height: baseTex.height,
        scaleMode: PIXI.SCALE_MODES.NEAREST
      });
      const tmp = new PIXI.Sprite(baseTex);
      tmp.filters = [full];
      r.render(tmp, { renderTexture: rt, clear: true });
      tmp.destroy(true);
      this.maskSprite.texture = rt;
    }
    _findDustTarget() {
      const targets = game.mapShine?.effectTargetManager?.targets;
      if (!targets)
        return null;
      return [targets.background, ...targets.tiles.values()].find((t) => t?.dust) || null;
    }
    async _tearDown(options) {
      if (this.emitter) {
        this.emitter.autoUpdate = false;
        this.emitter.destroy();
        this.emitter = null;
      }
      if (this.world) {
        this.world.mask = null;
        this.world.destroy({ children: true });
        this.world = null;
      }
      this.maskSprite?.destroy(true);
      this.maskSprite = null;
      return super._tearDown(options);
    }
  };
})();
