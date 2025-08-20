
/******************************************************************************
 *
 *                            MAP SHINE 
 *
 *  The major objective of this module is to provide map makers with a range
 *  of new tools for producing highly specific visual effects.
 *
 *  Ultimately, all effects are designed to activate automatically when a
 *  correctly named texture is found. This means map makers only need to
 *  create the specific maps they want to enable the corresponding features.
 *
 *  I plan to continuously add new effects, filters, and texture overlays,
 *  with the goal of making this a powerful and flexible toolkit that can
 *  bring life and animation to scenes in new and unusual ways.
 *
 ******************************************************************************/

// =================================================================================
// SECTION 1: MODULE SETUP & CONFIGURATION
// =================================================================================
// Description: Global constants, default settings, and simple utility functions.
// ---------------------------------------------------------------------------------

const MODULE_ID = 'map-shine';

const PROFILES_SETTING = 'profiles';

const DEFAULT_PROFILE_SETTING = 'defaultProfile';

const BLEND_MODE_OPTIONS = {
    'NORMAL': PIXI.BLEND_MODES.NORMAL,
    'ADD': PIXI.BLEND_MODES.ADD,
    'MULTIPLY': PIXI.BLEND_MODES.MULTIPLY,
    'SCREEN': PIXI.BLEND_MODES.SCREEN,
    'OVERLAY': PIXI.BLEND_MODES.OVERLAY,
    'DARKEN': PIXI.BLEND_MODES.DARKEN,
    'LIGHTEN': PIXI.BLEND_MODES.LIGHTEN,
    'COLOR_DODGE': PIXI.BLEND_MODES.COLOR_DODGE,
    'COLOR_BURN': PIXI.BLEND_MODES.COLOR_BURN,
    'HARD_LIGHT': PIXI.BLEND_MODES.HARD_LIGHT,
    'SOFT_LIGHT': PIXI.BLEND_MODES.SOFT_LIGHT,
    'DIFFERENCE': PIXI.BLEND_MODES.DIFFERENCE,
    'EXCLUSION': PIXI.BLEND_MODES.EXCLUSION,
};

const GRADIENT_PRESETS = {
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
    },
};

const MODULE_DEFAULTS = {
    "timeControl": {
      "globalTime": 100
    },
    "enabled": true,
    "debug": true,
    "showTokenMask": false,
    "showDustMaskDebug": false,
    "showGlintMaskDebug": false,
    "tileOpacity": 0,
    "baseShine": {
      "enabled": true,
      "specularTexturePath": "",
      "patternType": "stripes",
      "compositing": {
        "layerBlendMode": 1
      },
      "animation": {
        "globalIntensity": 2.9,
        "hotspot": 0,
        "updateFrequency": 10,
        "parallaxAmount": 0.94,
        "parallaxJitter": 1.5,
        "parallaxJitterSpeed": 0.3
      },
      "pattern": {
        "shared": {
          "patternScale": 0.16,
          "maxBrightness": 0.26
        },
        "stripes1": {
          "enabled": true,
          "intensity": 0.5,
          "speed": -0.006,
          "tintColor": "#FFFFFF",
          "angle": 50,
          "sharpness": 8,
          "bandDensity": 2,
          "bandWidth": 1,
          "subStripeMaxCount": 5,
          "subStripeMaxSharp": 1.5
        },
        "stripes2": {
          "enabled": true,
          "intensity": 0.5,
          "speed": 0.004,
          "tintColor": "#FFFFFF",
          "angle": 44,
          "sharpness": 8,
          "bandDensity": 1,
          "bandWidth": 1,
          "subStripeMaxCount": 3,
          "subStripeMaxSharp": 0
        },
        "checkerboard": {
          "gridSize": 8,
          "brightness1": 0.15,
          "brightness2": 0.05
        }
      },
      "noise": {
        "enabled": true,
        "speed": -0.003,
        "scale": 0.7,
        "threshold": 0.7,
        "brightness": 1,
        "contrast": 4.15,
        "softness": 1
      },
      "shineBloom": {
        "enabled": false,
        "threshold": 0.58,
        "brightness": 1.75,
        "blur": 4,
        "quality": 2
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
        "amount": 6.7
      },
      "colorCorrection": {
        "enabled": false,
        "saturation": 3,
        "brightness": 1,
        "contrast": 1.1,
        "exposure": 0,
        "gamma": 0.95,
        "levels": {
          "inBlack": 0,
          "inWhite": 1
        },
        "tint": {
          "color": "#ffcb2d",
          "amount": 0
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
        "intensity": 1,
        "luminanceThreshold": 0.97,
        "softness": 0.01
      },
      "wind": {
        "angle": 45,
        "speed": 0.0024
      },
      "noise": {
        "scale": 0.35,
        "octaves": 7,
        "persistence": 0.35,
        "lacunarity": 1.9
      },
      "shading": {
        "threshold": 1,
        "softness": 0.71,
        "brightness": 0.14,
        "contrast": 5,
        "gamma": 1.6
      }
    },
    "iridescence": {
      "enabled": true,
      "texturePath": "",
      "blendMode": 1,
      "intensity": 0.8,
      "speed": 0,
      "scale": 0.2,
      "parallax": 0,
      "fbm": {
        "octaves": 4,
        "persistence": 0.5,
        "lacunarity": 2.5,
        "evolution": 0.003,
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
        "name": "rainbow",
        "hueShift": 0,
        "brightness": 0.52,
        "contrast": 0.45
      }
    },
    "canopy": {
      "enabled": true,
      "shadowIntensity": 0.3,
      "tint": "#050805",
      "illumination": {
        "enabled": false,
        "intensity": 0.8,
        "luminanceThreshold": 0.1,
        "softness": 0.2
      },
      "distortion": {
        "enabled": true,
        "intensity": 1.2,
        "speed": 0.005,
        "scale": 0.01,
        "evolution": 0.01,
        "threshold": 0,
        "brightness": -0.37,
        "contrast": 1,
        "softness": 1
      }
    },
    "structuralShadows": {
      "enabled": true,
      "shadowIntensity": 0.91,
      "tint": "#000000",
      "parallax": 0,
      "rgbSplit": {
        "enabled": true,
        "intensity": 5,
        "threshold": 0
      },
      "illumination": {
        "enabled": true,
        "intensity": 1,
        "luminanceThreshold": 0.9,
        "softness": 0.35
      },
      "intensityNoise": {
        "enabled": false,
        "amount": 0,
        "speed": 0.15,
        "scale": 1.25,
        "evolution": 0,
        "threshold": 0.71,
        "brightness": -1.13,
        "contrast": 2.8,
        "softness": 1
      },
      "cloudOcclusion": {
        "enabled": true,
        "intensity": 0.8,
        "wind": {
          "angle": 45,
          "speed": 0.0025
        },
        "noise": {
          "scale": 0.18,
          "octaves": 5,
          "persistence": 0.4,
          "lacunarity": 2.6
        },
        "shading": {
          "threshold": 0.56,
          "softness": 0.2,
          "brightness": 0.5,
          "contrast": 1,
          "gamma": 0.75,
          "exposure": -0.85,
          "levels": {
            "inBlack": 0,
            "inWhite": 1
          }
        }
      }
    },
    "prism": {
      "enabled": true,
      "intensity": 1,
      "angle": 218,
      "threshold": 0.1,
      "softness": 0.5,
      "distortionStrength": 1.9,
      "distortionNoise": {
        "enabled": true,
        "speed": 0,
        "scale": 3.83,
        "evolution": 0,
        "threshold": 0,
        "brightness": 0.11,
        "contrast": 1.85,
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
      "enabled": false,
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
      "intensity": 0.0015,
      "noise": {
        "speed": 0.02,
        "scale": 1.9,
        "threshold": 0.14,
        "brightness": 0.02,
        "contrast": 0.25,
        "softness": 1,
        "evolution": 0.07
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
    "pauseEffect": {
      "enabled": true,
      "duration": 3000,
      "colorCorrection": {
        "enabled": true,
        "saturation": 0.5,
        "brightness": -0.1,
        "contrast": 0.9,
        "invert": false,
        "tint": {
          "color": "#FFFFFF",
          "amount": 0
        },
        "exposure": 0,
        "gamma": 1,
        "levels": {
          "inBlack": 0,
          "inWhite": 1
        },
        "whiteBalance": {
          "temperature": 0,
          "tint": 0
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
      }
    },
    "postProcessing": {
      "enabled": true,
      "colorCorrection": {
        "enabled": true,
        "saturation": 1,
        "brightness": 0,
        "contrast": 1,
        "invert": false,
        "tint": {
          "color": "#FFFFFF",
          "amount": 0
        },
        "exposure": 0,
        "gamma": 1,
        "levels": {
          "inBlack": 0,
          "inWhite": 1
        },
        "whiteBalance": {
          "temperature": 0.5,
          "tint": 0
        },
        "highlightCloud": {
          "enabled": true,
          "brightness": 0
        },
        "highlightCanopy": {
          "enabled": true,
          "brightness": 0
        },
        "highlightStructural": {
          "enabled": true,
          "brightness": 3
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
        "amount": 0.24,
        "softness": 0.36
      },
      "lensDistortion": {
        "enabled": true,
        "amount": 0.015,
        "centerX": 0.5,
        "centerY": 0.5
      },
      "chromaticAberration": {
        "enabled": false,
        "amount": 0.001,
        "centerX": 0.5,
        "centerY": 0.5
      },
      "tiltShift": {
        "enabled": false,
        "blur": 23,
        "gradientBlur": 3610,
        "startX": 0,
        "startY": 0.5,
        "endX": 1,
        "endY": 0.5
      }
    },
    "dust": {
      "enabled": true,
      "blendMode": 0,
      "maskThreshold": 0.8,
      "maskInfluence": 1,
      "particleTexture": "modules/map-shine/assets/particle.webp",
      "frequency": 0.1,
      "lifetime": {
        "min": 4,
        "max": 12
      },
      "color": {
        "start": "#ffd275",
        "end": "#ffe9b9"
      },
      "alpha": {
        "max": 0.2,
        "fadeIn": 0.5,
        "fadeOut": 0.5
      },
      "scale": {
        "sizeMultiplier": 3,
        "start": 0.4,
        "end": 0.47,
        "minMult": 0.86
      },
      "speed": {
        "start": 3,
        "end": 6,
        "minMult": 0.5
      },
      "rotation": {
        "enabled": false,
        "minSpeed": 0,
        "maxSpeed": 20,
        "accel": 0
      }
    },
    "glint": {
      "enabled": true,
      "darknessAffectsIntensity": true,
      "blendMode": 0,
      "maskThreshold": 0.9,
      "maskInfluence": 0.09,
      "particleTexture": "modules/map-shine/assets/glint.webp",
      "frequency": 0.932,
      "lifetime": {
        "min": 0.8,
        "max": 2.9
      },
      "color": {
        "start": "#FFFFFF",
        "end": "#FFFFFF"
      },
      "alpha": {
        "max": 0.95,
        "fadeIn": 0.05,
        "fadeOut": 0.94
      },
      "scale": {
        "sizeMultiplier": 9,
        "start": 1.5,
        "end": 0.61,
        "minMult": 0.9
      },
      "speed": {
        "start": 0,
        "end": 0,
        "minMult": 0.5
      },
      "rotation": {
        "enabled": false,
        "minSpeed": 0,
        "maxSpeed": 20,
        "accel": 0
      },
      "rgbSplit": {
        "enabled": true,
        "amount": 8.2
      }
    },
    "water": {
      "enabled": true,
      "wave": {
        "enabled": true,
        "speed": 0.0035,
        "scale": 10.3,
        "intensity": 0.0005
      },
      "surface": {
        "enabled": true,
        "foamColor": "#33adff",
        "foamIntensity": 0,
        "foamCoverage": 0,
        "foamSharpness": 0.13,
        "fbmScale": 15.196,
        "fbmSpeed": 0.01,
        "fbmEvolution": 0.03,
        "fbmOctaves": 5,
        "fbmLacunarity": 4,
        "fbmPersistence": 0.1,
        "sheenEnabled": true,
        "sheenIntensity": 0.884,
        "sheenColor": "#FFFFFF",
        "sheenScale": 8.7,
        "sheenSpeed": 0.002,
        "sheenStretch": 1,
        "sheenSharpness": 0.8
      },
      "caustics": {
        "enabled": true,
        "intensity": 0.036,
        "scale": 0.6,
        "speed": 0.02,
        "color": "#87CEFA",
        "lineSharpness": 2,
        "bloomIntensity": 1,
        "lineDistortion": 0.1,
        "lineDistortionScale": 1.9,
        "intersectionBoost": 20,
        "roughnessScale": 4.4,
        "roughnessIntensity": 0.65
      },
      "shoreline": {
        "enabled": false,
        "detectionBlur": 1,
        "foamColor": "#FFFFFF",
        "foamIntensity": 0.5,
        "foamPattern": {
          "scale": 1,
          "speed": 0,
          "evolution": 0.01,
          "octaves": 4,
          "lacunarity": 2.05,
          "persistence": 0.15,
          "brightness": 0.5,
          "contrast": 1
        },
        "displacement": {
          "enabled": false,
          "scale": 0.4,
          "speed": 0.011,
          "strength": 0.0025
        },
        "particleMaskBrightness": 0,
        "particleMaskContrast": 1,
        "foamParticles": {
          "enabled": false,
          "blendMode": 1,
          "maskThreshold": 0.8,
          "maskInfluence": 5,
          "particleTexture": "modules/map-shine/assets/tight.webp",
          "frequency": 0.006,
          "lifetime": {
            "min": 3.9,
            "max": 3.7
          },
          "color": {
            "start": "#9fcdff",
            "end": "#d0faff"
          },
          "alpha": {
            "max": 1,
            "fadeIn": 0.02,
            "fadeOut": 0.08
          },
          "scale": {
            "sizeMultiplier": 0.6,
            "start": 1.04,
            "end": 0.26,
            "minMult": 0.5
          },
          "speed": {
            "start": 2,
            "end": 6,
            "minMult": 0.78
          },
          "rotation": {
            "enabled": false,
            "minSpeed": 0,
            "maxSpeed": 0,
            "accel": 0
          }
        }
      },
      "glintParticles": {
        "enabled": true,
        "blendMode": 9,
        "maskThreshold": 0.17,
        "maskInfluence": 5,
        "particleTexture": "modules/map-shine/assets/glint.webp",
        "frequency": 0.272,
        "lifetime": {
          "min": 0.4,
          "max": 0.8
        },
        "color": {
          "start": "#eef7ff",
          "end": "#eef9ff"
        },
        "alpha": {
          "max": 1,
          "fadeIn": 0.25,
          "fadeOut": 0.25
        },
        "scale": {
          "sizeMultiplier": 0.6,
          "start": 0.76,
          "end": 0.82,
          "minMult": 0.95
        },
        "speed": {
          "start": 5,
          "end": 11,
          "minMult": 0.47
        },
        "rotation": {
          "enabled": true,
          "minSpeed": 116,
          "maxSpeed": 123,
          "accel": 52
        }
      }
    },
    "fire": {
      "enabled": true,
      "bloom": {
        "enabled": true,
        "threshold": 0.15,
        "bloomScale": 5,
        "brightness": 3.2,
        "blur": 4,
        "quality": 4
      },
      "particles": {
        "enabled": true,
        "blendMode": 1,
        "maskThreshold": 0.9,
        "maskInfluence": 0.84,
        "particleTexture": "modules/map-shine/assets/flame.webp",
        "frequency": 0.005,
        "lifetime": {
          "min": 0.4,
          "max": 0.9
        },
        "color": {
          "start": "#FFDD88",
          "end": "#ea7500"
        },
        "alpha": {
          "max": 0.8,
          "fadeIn": 0.02,
          "fadeOut": 0.95
        },
        "scale": {
          "sizeMultiplier": 0.4,
          "start": 0.05,
          "end": 1.16,
          "minMult": 0.43
        },
        "speed": {
          "start": 10,
          "end": 20,
          "minMult": 0.5
        },
        "rotation": {
          "enabled": false,
          "minSpeed": 0,
          "maxSpeed": 0,
          "accel": 0
        },
        "wind": {
          "enabled": false,
          "force": 0,
          "baseSpeed": 0,
          "gustSpeed": 0,
          "gustFrequencyMin": 3,
          "gustFrequencyMax": 8,
          "gustDurationMin": 0.2,
          "gustDurationMax": 0.8,
          "angleChangeFrequencyMin": 5,
          "angleChangeFrequencyMax": 15,
          "angleChangeRange": 20
        }
      }
    },
    "ambientLayerZIndex": 250
  }

const hexToRgbArray = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
};

// =================================================================================
// SECTION 2: CORE SYSTEMS & MANAGERS
// =================================================================================
// Description: The "brains" of the module. These classes manage state, data,
//              and the overall lifecycle of effects.
// ---------------------------------------------------------------------------------

class MapShineLifecycle {
    static async onCanvasReady(canvas) {
        if (!canvas.scene) return;

        game.mapShine.systemsReady = false;

        canvas.mapShine = {
            isModuleActive: true
        };


        console.log("Map Shine | canvasReady: Initializing systems for the current canvas.");


        const disableLoadingScreen = game.settings.get(MODULE_ID, 'disable-loading-screen');

        if (!disableLoadingScreen && !game.mapShine.loadingScreen) {
            try {
                game.mapShine.loadingScreen = new LoadingScreen();
                game.mapShine.loadingScreen.show();
            } catch (err) {
                console.error("Map Shine | Failed to show loading screen:", err);
                game.mapShine.loadingScreen = null;
            }
        }

        MapShineLifecycle.beginPersistentDiscovery(canvas);
    }

    static async beginPersistentDiscovery(canvas, attempt = 1, maxAttempts = 5) {
        if (!canvas?.scene || !canvas.mapShine?.isModuleActive) {
            console.log("Map Shine | Discovery aborted, canvas is no longer active.");
            return;
        }

        if (attempt > maxAttempts) {
            console.warn(`Map Shine | Texture discovery failed after ${maxAttempts} attempts. No effect maps found.`);
            if (game.mapShine.loadingScreen) {
                await game.mapShine.loadingScreen.hide();
                game.mapShine.loadingScreen = null;
            }
            this.runMinimalSetup(canvas);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, attempt === 1 ? 100 : 250));

        await game.mapShine.effectTargetManager.refresh();
        const targets = game.mapShine.effectTargetManager.targets;
        const hasBackgroundTarget = targets.background && Object.values(targets.background).some(v => v && typeof v === 'string');
        const hasTileTargets = Array.from(targets.tiles.values()).length > 0;

        if (hasBackgroundTarget || hasTileTargets) {
            console.log(`Map Shine | Texture discovery successful on attempt #${attempt}. Initializing all systems.`);
            this.runFullSetup(canvas);
        } else {
            console.log(`Map Shine | Texture discovery attempt #${attempt} found no targets. Retrying...`);
            MapShineLifecycle.beginPersistentDiscovery(canvas, attempt + 1, maxAttempts);
        }
    }

    static async runFullSetup(canvas) {
        const loadingScreen = game.mapShine.loadingScreen;

        // 1. Initialize the profile manager with whatever is saved for the scene.
        game.mapShine.profileManager.initializeForScene();

        if (!game.mapShine.fireWindManager) {
            game.mapShine.fireWindManager = new FireWindManager();
        }
        // Update the wind manager with the finalized, time-scaled configuration
        game.mapShine.fireWindManager.updateFromConfig(game.mapShine.profileManager.activeConfig.fire.particles.wind);

        // At this point, game.mapShine.profileManager.activeConfig is ready, but it has not
        // yet been adjusted based on the textures we just found.

        // 2. Discover textures. This happens in effectTargetManager.refresh() right before this function is called.

        // 3. (NEW) Finalize the configuration based on discovered textures.
        // This modifies the activeConfig in memory.
        this.finalizeConfigurationAndUI();

        // The problematic broadcastUpdate() call has been removed.
        // The particle layer will now pull its own targets when it is ready.

        // 5. NOW we broadcast the finalized configuration to all systems.
        // This is safe because it only updates uniforms, it doesn't create objects.
        const config = game.mapShine.profileManager.activeConfig;
        for (const layer of canvas.layers) {
            if (layer instanceof ParticleLayer) continue; // Skip the particle layer
            if (typeof layer.updateFromConfig === 'function') {
                try {
                    await layer.updateFromConfig(config);
                } catch (e) {
                    console.error(`MapShine | Error updating layer ${layer.constructor.name}`, e);
                }
            }
        }
        ScreenEffectsManager.updateAllFiltersFromConfig(config);

        // 6. Initialize the global screen filters.
        ScreenEffectsManager.initialize(canvas.stage);
        ScreenEffectsManager.setupAllGlobalFilters();
        ScreenEffectsManager.updateAllFiltersFromConfig(game.mapShine.profileManager.activeConfig);

        if (game.mapShine.pauseEffectManager) {
            game.mapShine.pauseEffectManager.initialize();
        }

        // 6. (NEW) Update the UI controls to reflect the finalized configuration.
        if (game.mapShine.debugger) {
            game.mapShine.debugger.eventHandler.updateAllControls();
        }

        // 7. Initialize canvas-specific managers.
        canvas.mapShine.lightingEffectManager = new LightingEffectManager(canvas);
        canvas.mapShine.ambientMaskManager = new AmbientMaskManager(canvas);
        canvas.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas);

        // 8. Hide the loading screen.
        if (loadingScreen) {
            await loadingScreen.hide();
            game.mapShine.loadingScreen = null;
        }

        game.mapShine.systemsReady = true;
    }

    static async runMinimalSetup(canvas) {
        game.mapShine.profileManager.initializeForScene();
        await game.mapShine.profileManager.updateAllSystemsFromConfig();
        ScreenEffectsManager.initialize(canvas.stage);
        ScreenEffectsManager.setupAllGlobalFilters();
        ScreenEffectsManager.updateAllFiltersFromConfig(game.mapShine.profileManager.activeConfig);
    }

    static onCanvasTearDown(tornDownCanvas) {
        if (!tornDownCanvas?.mapShine) return;
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
            baseShine: 'specular',
            cloudShadows: 'outdoors',
            canopy: 'canopy',
            structuralShadows: 'structural',
            iridescence: 'iridescence',
            ambient: 'ambient',
            groundGlow: 'groundGlow',
            heatDistortion: 'heat',
            prism: 'prism',
            dust: 'dust', // ADDED DUST TO THE MAP
            glint: 'prism', // Glint particles are driven by the _Prism texture
            fire: 'fire',
        };

        const targets = game.mapShine.effectTargetManager.targets;
        const allTargets = [
            targets.background,
            ...targets.tiles.values()
        ].filter(Boolean);
        const config = game.mapShine.profileManager.activeConfig;
        const handler = game.mapShine.debugger?.eventHandler;

        // --- Adjust effect enablement based on texture availability ---
        for (const [effectKey, textureKey] of Object.entries(EFFECT_TEXTURE_MAP)) {
            const hasTexture = allTargets.some(target => target[textureKey]);
            const path = `${effectKey}.enabled`;
            const currentSetting = foundry.utils.getProperty(config, path);
            const defaultSetting = foundry.utils.getProperty(MODULE_DEFAULTS, path); // Get original default from MODULE_DEFAULTS

            let newSetting = currentSetting; // Start with the current state

            if (hasTexture && defaultSetting === false && currentSetting === false) {
                // Scenario: Texture found, default is OFF, and it's currently OFF.
                // Action: Automatically ENABLE the effect.
                newSetting = true;
                console.log(`Map Shine | Effect '${effectKey}' auto-enabled: '${textureKey}' texture found.`);
            } else if (!hasTexture && currentSetting === true) {
                // Scenario: Texture is missing AND the effect is currently enabled.
                // Action: Automatically DISABLE the effect.
                newSetting = false;
                console.log(`Map Shine | Effect '${effectKey}' auto-disabled: No '${textureKey}' texture found.`);
            }
            // Other scenarios:
            // - hasTexture && defaultSetting === true && currentSetting === true (no change, already enabled)
            // - hasTexture && defaultSetting === false && currentSetting === true (user enabled it, keep it enabled)
            // - !hasTexture && defaultSetting === false && currentSetting === false (no change, already disabled)

            // Only update the config if the setting has actually changed
            if (newSetting !== currentSetting) {
                foundry.utils.setProperty(config, path, newSetting);
            }

            // Update the UI availability regardless of the config setting.
            // This ensures the UI accurately reflects whether a texture exists to power the effect.
            handler?.setEffectAvailability(effectKey, hasTexture);
        }
    }
}

class SystemStatusManager {
    constructor() {
        if (SystemStatusManager._instance) {
            return SystemStatusManager._instance;
        }
        SystemStatusManager._instance = this;

        this._callbacks = {};
        this._state = {
            shaders: {
                baseShine: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                noise: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                bloom: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                iridescence: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                prism: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                heat: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                cloudShadows: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                structuralShadows: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                postProcessing: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                },
                internal: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                },
                debug: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                }
            },
            textures: {
                specular: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                ambient: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                iridescence: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                groundGlow: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                heat: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                fire: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                dust: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                outdoors: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                canopy: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                structural: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                prism: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                water: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                shoreline: {
                    state: 'inactive',
                    message: 'No path specified.'
                }
            },
            pipelines: {
                noiseToShine: {
                    state: 'inactive',
                    message: 'Pipeline inactive.'
                },
            },
        };
    }

    static get instance() {
        if (!SystemStatusManager._instance) {
            new SystemStatusManager();
        }
        return SystemStatusManager._instance;
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

        this._callbacks[event] = this._callbacks[event].filter(cb => cb !== callback);
    }

    emit(event, ...args) {
        if (this._callbacks[event]) {
            this._callbacks[event].forEach(callback => callback(...args));
        }
    }

    update(category, key, statusObject) {
        if (this._state[category] && this._state[category][key]) {
            this._state[category][key] = statusObject;
            this.emit('statusChanged', category, key, statusObject);
        } else {
            console.warn(`SystemStatusManager | Attempted to update non-existent status: ${category}.${key}`);
        }
    }

    getStatus(category, key) {
        return this._state[category]?.[key] || {
            state: 'error',
            message: 'Status key not found.'
        };
    }

    getAllStatuses() {
        return this._state;
    }

    evaluatePipelines() {
        if (!OVERLAY_CONFIG.baseShine.noise.enabled) {
            this.update('pipelines', 'noiseToShine', {
                state: 'disabled',
                message: 'Noise mask is disabled by user.'
            });
        } else if (this.getStatus('shaders', 'noise').state !== 'ok') {
            this.update('pipelines', 'noiseToShine', {
                state: 'error',
                message: 'Pipeline broken: Noise shader failed to compile.'
            });
        } else {
            this.update('pipelines', 'noiseToShine', {
                state: 'ok',
                message: 'Pipeline active: Noise mask is modulating the shine pattern.'
            });
        }
    }
}

class PauseEffectManager {
    constructor() {
        this._animationState = {
            progress: game.paused ? 1 : 0
        };
        this._animation = null;
        this._pauseFilter = null;
        this._originalGlobalTime = 100;
        this._isInitialized = false;
    }

    initialize() {
        if (this._isInitialized) return;
        this._pauseFilter = ScreenEffectsManager.getFilter('pauseEffect');
        if (!this._pauseFilter) {
            console.error("Map Shine | PauseEffectManager could not find its dedicated filter.");
            return;
        }

        const config = game.mapShine.profileManager.activeConfig;
        this._originalGlobalTime = config.timeControl.globalTime;

        // Set initial state without animation, in case the game loads while paused.
        this._updateEffects(this._animationState.progress);

        Hooks.on('pauseGame', this._onPauseChange.bind(this));
        this._isInitialized = true;
        console.log("Map Shine | Pause Effect Manager Initialized.");
    }

    _onPauseChange(paused) {
        if (!this._pauseFilter) return;

        const config = game.mapShine.profileManager.activeConfig;
        const peConfig = config.pauseEffect;

        if (!peConfig.enabled) {
            // If the effect is disabled, ensure time is restored and the filter is off.
            this._updateEffects(0);
            if (config.timeControl.globalTime < this._originalGlobalTime) {
                foundry.utils.setProperty(config, 'timeControl.globalTime', this._originalGlobalTime);
                game.mapShine.profileManager.updateAllSystemsFromConfig();
                if (game.mapShine.debugger) {
                    game.mapShine.debugger.eventHandler.updateAllControls();
                }
            }
            return;
        }

        if (this._animation) {
            this._animation.kill();
        }

        const targetProgress = paused ? 1 : 0;

        // Before starting a "pausing" animation, store the current time.
        // But only if we aren't already paused (e.g. from a previous animation)
        if (paused && this._animationState.progress < 1) {
            this._originalGlobalTime = game.mapShine.profileManager.activeConfig.timeControl.globalTime;
        }

        this._animation = gsap.to(this._animationState, {
            progress: targetProgress,
            duration: peConfig.duration / 1000, // GSAP uses seconds
            ease: "power2.inOut",
            onUpdate: () => this._updateEffects(this._animationState.progress),
            onComplete: () => {
                this._animation = null;
                this._updateEffects(targetProgress); // Final snap to value
            }
        });
    }

    _updateEffects(progress) {
        if (!this._pauseFilter) return;

        const config = game.mapShine.profileManager.activeConfig;
        const peConfig = config.pauseEffect;
        const timeControlPath = 'timeControl.globalTime';

        // --- 1. Update Time Control ---
        const newTime = this._originalGlobalTime * (1 - progress);
        
        // Directly update the live timeFactor and the config object for consistency
        game.mapShine.timeControl.timeFactor = newTime / 100.0;
        foundry.utils.setProperty(config, timeControlPath, newTime);
        
        // We only need to call updateAllSystemsFromConfig for the time change.
        // The color correction is handled directly on the filter below.
        // Pass a flag to indicate this is a time-only update to prevent particle resets.
        game.mapShine.profileManager.updateAllSystemsFromConfig({ timeOnly: true });

        // Update the debugger UI to reflect the change without treating it as a user override
        if (game.mapShine.debugger) {
            const slider = game.mapShine.debugger.element.querySelector('#control-timeControl-globalTime');
            if (slider) {
                slider.value = newTime;
                game.mapShine.debugger.eventHandler._updateSliderValue(slider.id, newTime, slider.step);
            }
        }

        // --- 2. Update Color Correction Filter ---
        const u = this._pauseFilter.uniforms;
        const cc = peConfig.colorCorrection;
        
        // This filter is only active during a transition or when fully paused.
        this._pauseFilter.enabled = progress > 0.001 && cc.enabled;

        // Animate the overall intensity of the color correction effect.
        u.uIntensity = progress;

        // Interpolate each value from its neutral state to the target "paused" state.
        // Note: these are now effectively pre-multiplied by the uIntensity uniform in the shader.
        u.uSaturation = cc.saturation;
        u.uBrightness = cc.brightness;
        u.uContrast = cc.contrast;
        u.uExposure = cc.exposure;
        u.uGamma = cc.gamma;
        u.uInBlack = cc.levels.inBlack;
        u.uInWhite = cc.levels.inWhite;
        u.uTemperature = cc.whiteBalance.temperature;
        u.uWbTint = cc.whiteBalance.tint;
        u.uTintAmount = cc.tint.amount;
        u.uTintColor = hexToRgbArray(cc.tint.color);

        // Boolean values are not interpolated.
        u.uInvert = cc.invert;
        u.uSelectiveEnabled = cc.selective.enabled;
        u.uSelectiveColor = hexToRgbArray(cc.selective.color);
        u.uSelectiveHueRange = cc.selective.hueRange;
        u.uSelectiveSatRange = cc.selective.saturationRange;
    }
}

const systemStatus = new SystemStatusManager();

class TextureAutoLoader {
    static SUFFIX_MAP = {
        specular: "_Specular",
        ambient: "_Ambient",
        iridescence: "_Iridescence",
        groundGlow: "_GroundGlow",
        heat: "_Heat",
        fire: "_Fire",
        dust: "_Dust",
        outdoors: "_Outdoors",
        canopy: "_Canopy",
        structural: "_Structural",
        prism: "_Prism",
        water: "_Water",
        shoreline: "_Shoreline"
    };

    async discoverAllTargets() {
        const results = {
            background: null,
            tiles: new Map()
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
        if (!tileSrc) return null;

        const suffixData = await this._findSuffixesForBaseTexture(tileSrc);
        const hasEffectMap = Object.values(suffixData).some(path => path && typeof path === 'string');

        if (hasEffectMap) {

            return {
                tile,
                baseTexturePath: tileSrc,
                rect: {
                    x: tile.document.x,
                    y: tile.document.y,
                    width: tile.document.width,
                    height: tile.document.height,
                    rotation: tile.document.rotation * (Math.PI / 180),
                },
                ...suffixData
            };
        }
        return null;
    }

    async _findSuffixesForBaseTexture(baseTexturePath) {
        const discoveredPaths = {};
        Object.keys(TextureAutoLoader.SUFFIX_MAP).forEach(key => discoveredPaths[key] = null);

        // --- DIAGNOSTIC LOGGING ---
        const isWaterTile = baseTexturePath.toLowerCase().includes("water");
        if (isWaterTile) {
            console.log(`--- Map Shine | DIAGNOSTIC: Auto-discovery for water-related tile ---`);
            console.log(`Base Texture Path: ${baseTexturePath}`);
        }

        const lastSlash = baseTexturePath.lastIndexOf('/');
        if (lastSlash === -1) return discoveredPaths;

        const directoryPath = baseTexturePath.substring(0, lastSlash);
        const filename = baseTexturePath.substring(lastSlash + 1);

        let decodedFilename;
        try {
            decodedFilename = decodeURI(filename);
        } catch (e) {
            decodedFilename = filename;
        }

        const lastDot = decodedFilename.lastIndexOf('.');
        if (lastDot === -1) return discoveredPaths;

        const baseName = decodedFilename.substring(0, lastDot);
        const extension = decodedFilename.substring(lastDot);

        if (isWaterTile) {
            console.log(`Parsed Directory: ${directoryPath}`);
            console.log(`Parsed Base Name: ${baseName}`);
            console.log(`Parsed Extension: ${extension}`);
        }

        if (!baseName || !directoryPath) return discoveredPaths;

        let filesInDir = [];
        try {
            const source = game.settings.get("core", "noCanvas") ? "public" : "data";
            filesInDir = (await foundry.applications.apps.FilePicker.implementation.browse(source, directoryPath)).files;
            if (isWaterTile) {
                console.log(`Files found in directory:`, filesInDir);
            }
        } catch (e) {
            // This part is unchanged
            return discoveredPaths;
        }

        for (const [key, suffix] of Object.entries(TextureAutoLoader.SUFFIX_MAP)) {
            const expectedFilename = `${baseName}${suffix}${extension}`;

            // --- DIAGNOSTIC LOGGING for the shoreline ---
            if (isWaterTile && key === 'shoreline') {
                console.log(`Searching for key '${key}' with suffix '${suffix}'`);
                console.log(`Constructed Expected Filename: ${expectedFilename}`);
            }

            const foundFile = filesInDir.find(fullPath => {
                const fNameOnly = fullPath.substring(fullPath.lastIndexOf('/') + 1);
                let decodedFNameOnly;
                try {
                    decodedFNameOnly = decodeURI(fNameOnly);
                } catch (e) {
                    decodedFNameOnly = fNameOnly;
                }
                return decodedFNameOnly.toLowerCase() === expectedFilename.toLowerCase();
            });

            if (foundFile) {
                if (isWaterTile && key === 'shoreline') {
                    console.log(`SUCCESS: Found matching file path: ${foundFile}`);
                }
                discoveredPaths[key] = foundFile;
            } else {
                if (isWaterTile && key === 'shoreline') {
                    console.log(`FAILURE: No match found for '${expectedFilename}'.`);
                }
            }
        }
        if (isWaterTile) console.log(`--- END DIAGNOSTIC ---`);
        return discoveredPaths;
    }
}

class ScreenEffectsManager {
    static _filters = new Map();
    static _container = null;

    static getSettingsHTML() {
        let content = DebuggerUIBuilder._createAccordionHTML('pauseEffect', 'Pause Transition Effect', `
            <p class="description-text">Applies a transition effect when the game is paused, including a color correction pass and slowing down all animations.</p>
            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.duration', 'Transition Duration (ms)', 100, 10000, 100)}
            <details id="details-pauseEffect-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                <div>
                    <details id="details-pauseEffect-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                            ${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.invert', 'Invert Colors')}
                    </div></details>
                    <details id="details-pauseEffect-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies scene brightness, simulating camera exposure.')}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05, 'Adjusts mid-tones. < 1 lightens, > 1 darkens.')}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the image.')}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the image.')}
                    </div></details>
                    <details id="details-pauseEffect-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 15px;">
                            <p class="description-text">Simulates camera white balance correction.</p>
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.whiteBalance.temperature', 'Temperature', -1, 1, 0.01, 'Negative values are cooler (blue), positive are warmer (orange).')}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.whiteBalance.tint', 'Tint', -1, 1, 0.01, 'Negative values shift toward magenta, positive toward green.')}
                    </div></details>
                    <details id="details-pauseEffect-cc-tint"><summary><span class="accordion-toggle"></span><strong>Global Tint</strong></summary><div style="padding-left: 15px;">
                            <p class="description-text">Applies a color overlay to the entire scene.</p>
                            ${DebuggerUIBuilder._createColorPickerHTML('pauseEffect.colorCorrection.tint.color', 'Tint Color')}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                    </div></details>
                    <details id="details-pauseEffect-cc-mask"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.mask.enabled', 'Luminance Mask', true)}</div></summary><div style="padding-left: 15px;">
                            <p class="description-text">Applies the color correction only to lit areas of the scene. Requires the Illumination Buffer module.</p>
                            ${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.mask.invert', 'Invert Mask (Affect Dark Areas)')}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.mask.luminanceThreshold', 'Light Threshold', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.mask.softness', 'Edge Softness', 0.01, 1, 0.01)}
                    </div></details>
                    <details id="details-pauseEffect-cc-selective"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.selective.enabled', 'Selective Color Desaturation', true)}</div></summary><div style="padding-left: 15px;">
                            <p class="description-text">Desaturates all colors except for a specific target color range.</p>
                            ${DebuggerUIBuilder._createColorPickerHTML('pauseEffect.colorCorrection.selective.color', 'Target Color')}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.selective.hueRange', 'Hue Range', 0, 0.5, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.selective.saturationRange', 'Saturation Range', 0, 0.5, 0.01)}
                    </div></details>
                </div>
            </details>
        `);

        content += DebuggerUIBuilder._createAccordionHTML('postProcessing', 'Post Processing', `
                <p class="description-text">Applies global screen-space effects to the entire canvas, like a Photoshop filter.</p>
                <details id="details-postProcessing-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                    <div>
                        <details id="details-postProcessing-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                                ${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.invert', 'Invert Colors')}
                        </div></details>
                        <details id="details-postProcessing-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies scene brightness, simulating camera exposure.')}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05, 'Adjusts mid-tones. < 1 lightens, > 1 darkens.')}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the image.')}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the image.')}
                        </div></details>
                        <details id="details-postProcessing-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 15px;">
                                <p class="description-text">Simulates camera white balance correction.</p>
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.whiteBalance.temperature', 'Temperature', -1, 1, 0.01, 'Negative values are cooler (blue), positive are warmer (orange).')}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.whiteBalance.tint', 'Tint', -1, 1, 0.01, 'Negative values shift toward magenta, positive toward green.')}
                        </div></details>
                        <details id="details-postProcessing-cc-highlights">
                            <summary><span class="accordion-toggle"></span><strong>Highlight Adjustments</strong></summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Boost brightness in areas unaffected by certain shadow effects.</p>
                                <details id="details-postProcessing-cc-highlightCloud">
                                    <summary><span class="accordion-toggle"></span>
                                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightCloud.enabled', 'Cloud Highlights', true)}</div>
                                    </summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Brightens the sky between cloud shadows.</p>
                                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightCloud.brightness', 'Brightness', 0, 2, 0.01)}
                                    </div>
                                </details>
                                <details id="details-postProcessing-cc-highlightCanopy">
                                    <summary><span class="accordion-toggle"></span>
                                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightCanopy.enabled', 'Canopy Highlights', true)}</div>
                                    </summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Brightens the light filtering through the canopy.</p>
                                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightCanopy.brightness', 'Brightness', 0, 5, 0.01)}
                                        </div>
                                    </details>
                                    <details id="details-postProcessing-cc-highlightStructural">
                                        <summary><span class="accordion-toggle"></span>
                                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightStructural.enabled', 'Structural Highlights', true)}</div>
                                        </summary>
                                        <div style="padding-left: 15px;">
                                            <p class="description-text">Brightens the areas not in structural shadow (e.g., areas between rafters).</p>
                                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightStructural.brightness', 'Brightness', 0, 5, 0.01)}
                                        </div>
                                    </details>
                                </div>
                            </details>
                        <details id="details-postProcessing-cc-tint"><summary><span class="accordion-toggle"></span><strong>Global Tint</strong></summary><div style="padding-left: 15px;">
                                <p class="description-text">Applies a color overlay to the entire scene.</p>
                                ${DebuggerUIBuilder._createColorPickerHTML('postProcessing.colorCorrection.tint.color', 'Tint Color')}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                        </div></details>
                        <details id="details-postProcessing-cc-mask"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.mask.enabled', 'Luminance Mask', true)}</div></summary><div style="padding-left: 15px;">
                                <p class="description-text">Applies the color correction only to lit areas of the scene. Requires the Illumination Buffer module.</p>
                                ${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.mask.invert', 'Invert Mask (Affect Dark Areas)')}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.mask.luminanceThreshold', 'Light Threshold', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.mask.softness', 'Edge Softness', 0.01, 1, 0.01)}
                        </div></details>
                        <details id="details-postProcessing-cc-selective"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.selective.enabled', 'Selective Color Desaturation', true)}</div></summary><div style="padding-left: 15px;">
                                <p class="description-text">Desaturates all colors except for a specific target color range.</p>
                                ${DebuggerUIBuilder._createColorPickerHTML('postProcessing.colorCorrection.selective.color', 'Target Color')}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.selective.hueRange', 'Hue Range', 0, 0.5, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.selective.saturationRange', 'Saturation Range', 0, 0.5, 0.01)}
                        </div></details>
                    </div>
                </details>
                <details id="details-postProcessing-vignette"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.vignette.enabled', 'Vignette', true)}</div></summary>
                    <div>${DebuggerUIBuilder._createSliderHTML('postProcessing.vignette.amount', 'Amount', 0, 1, 0.01)}${DebuggerUIBuilder._createSliderHTML('postProcessing.vignette.softness', 'Softness', 0.01, 1, 0.01)}</div>
                </details>
                <details id="details-postProcessing-lensDistortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.lensDistortion.enabled', 'Lens Distortion', true)}</div></summary>
                    <div>
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.lensDistortion.amount', 'Amount', -0.2, 0.2, 0.001)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.lensDistortion.centerX', 'Center X', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.lensDistortion.centerY', 'Center Y', 0, 1, 0.01)}
                    </div>
                </details>
                <details id="details-postProcessing-chromaticAberration"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.chromaticAberration.enabled', 'Chromatic Aberration', true)}</div></summary>
                    <div>
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.chromaticAberration.amount', 'Amount', -0.05, 0.05, 0.001)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.chromaticAberration.centerX', 'Center X', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.chromaticAberration.centerY', 'Center Y', 0, 1, 0.01)}
                    </div>
                </details>
                <details id="details-postProcessing-tiltShift"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.tiltShift.enabled', 'Tilt Shift', true)}</div></summary>
                    <div>
                        <p class="description-text">Simulates a tilt-shift lens, blurring the top and bottom of the screen. Requires a library that may not be bundled with all Foundry versions.</p>
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.blur', 'Blur', 0, 50, 1)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.gradientBlur', 'Gradient Size', 0, 5000, 10)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.startX', 'Start X', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.startY', 'Start Y', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.endX', 'End X', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.endY', 'End Y', 0, 1, 0.01)}
                    </div>
                </details>
                <button id="output-config-btn" title="Log the current full config object to the console for copy/pasting." style="width: 100%; margin-top: 5px;">Log Full Config to Console</button>
            `);

        return content;
    }

    static initialize(container) {
        if (!this._container) {
            this._container = container;
        }
    }

    static addFilter(key, filter) {
        if (!this._container) return;
        this.removeFilter(key);
        this._filters.set(key, filter);
        this._updateContainerFilters();
    }

    static getFilter(key) {
        return this._filters.get(key);
    }

    static removeFilter(key) {
        if (!this._container || !this._filters.has(key)) return;
        const filter = this._filters.get(key);
        filter?.destroy();
        this._filters.delete(key);
        this._updateContainerFilters();
    }

    static _updateContainerFilters() {
        if (!this._container) return;

        const filterClasses = [WaterEffectsFilter, PrismFilter, HeatDistortionFilter, VignetteFilter, LensDistortionFilter, ChromaticAberrationFilter, ColorCorrectionFilter];

        const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
        if (BloomFilterConstructor) {
            filterClasses.push(BloomFilterConstructor);
        }

        const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
        if (TiltShiftFilterConstructor) {
            filterClasses.push(TiltShiftFilterConstructor);
        }

        const otherFilters = (this._container.filters || []).filter(f => !filterClasses.some(cls => f instanceof cls));

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
            this.addFilter('prism', new PrismFilter());
            systemStatus.update('shaders', 'prism', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to compile PrismFilter", e);
            systemStatus.update('shaders', 'prism', {
                state: 'error',
                message: `Compilation failed: ${e.message}`
            });
        }

        try {
            this.addFilter('heatDistortion', new HeatDistortionFilter());
        } catch (e) {
            heatErrors.push('HeatDistortion');
            console.error("MapShine | Failed to compile HeatDistortionFilter", e);
        }


        systemStatus.update('shaders', 'heat', {
            state: heatErrors.length === 0 ? 'ok' : 'error',
            message: heatErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${heatErrors.join(', ')}`
        });

        try {
            this.addFilter('vignette', new VignetteFilter());
        } catch (e) {
            ppErrors.push('Vignette');
        }
        try {
            this.addFilter('lensDistortion', new LensDistortionFilter());
        } catch (e) {
            ppErrors.push('LensDistortion');
        }
        try {
            this.addFilter('chromaticAberration', new ChromaticAberrationFilter());
        } catch (e) {
            ppErrors.push('ChromaticAberration (Post)');
        }
        try {
            this.addFilter('colorCorrection', new ColorCorrectionFilter());
            // Create the filter instance first
            const pauseFilter = new ColorCorrectionFilter();
            // Explicitly disable it on initialization. The 'pause' hook will manage its state.
            pauseFilter.enabled = false;
            this.addFilter('pauseEffect', pauseFilter);
        } catch (e) {
            ppErrors.push('ColorCorrection');
        }

        try {
            const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);

            if (BloomFilterConstructor) {
                const bloomFilter = new BloomFilterConstructor(game.mapShine.profileManager.activeConfig.advancedBloom);
                this.addFilter('advancedBloom', bloomFilter);
                console.log("MapShine | AdvancedBloomFilter created successfully from bundled library.");
            } else {
                const errorMsg = "Could not find PIXI.filters.AdvancedBloomFilter. The bundled script may have failed to load.";
                console.error(`MapShine | ${errorMsg}`);
                ppErrors.push('AdvancedBloom (Bundling Failed)');
            }
        } catch (e) {
            console.error("MapShine | Failed to create AdvancedBloomFilter instance:", e);
            ppErrors.push('AdvancedBloom (Creation Failed)');
        }

        try {
            const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
            if (TiltShiftFilterConstructor) {
                const tiltShiftFilter = new TiltShiftFilterConstructor();
                this.addFilter('tiltShift', tiltShiftFilter);
                console.log("MapShine | TiltShiftFilter created successfully from bundled library.");
            } else {
                const errorMsg = "Could not find PIXI.filters.TiltShiftFilter. The bundled script may have failed to load.";
                console.error(`MapShine | ${errorMsg}`);
                ppErrors.push('TiltShift (Bundling Failed)');
            }
        } catch (e) {
            console.error("MapShine | Failed to create TiltShiftFilter instance:", e);
            ppErrors.push('TiltShift (Creation Failed)');
        }

        systemStatus.update('shaders', 'postProcessing', {
            state: ppErrors.length === 0 ? 'ok' : 'error',
            message: ppErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${ppErrors.join(', ')}`
        });

        try {
            this.addFilter('water', new WaterEffectsFilter());
        } catch(e) {
            console.error("MapShine | Failed to compile WaterEffectsFilter", e);
             systemStatus.update('shaders', 'water', { state: 'error', message: `Compilation failed: ${e.message}` });
        }
    }

    static updateAllFiltersFromConfig(config) {
        const pp = config.postProcessing;
        const ab = config.advancedBloom;

        const prismFilter = this.getFilter('prism');
        if (prismFilter instanceof PrismFilter) {
            const pConfig = config.prism;
            prismFilter.enabled = config.enabled && pConfig.enabled;

            const u = prismFilter.uniforms;
            u.uIntensity = pConfig.intensity;
            u.uAngleRad = pConfig.angle * (Math.PI / 180.0);
            u.uThreshold = pConfig.threshold;
            u.uSoftness = pConfig.softness;
            u.uDistortionStrength = pConfig.distortionStrength;

            const screen = canvas?.app?.screen;
            if (screen) {
                u.uTexelSize = [1 / screen.width, 1 / screen.height];
            }
        }


        const advancedBloomFilter = this.getFilter('advancedBloom');
        const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
        if (advancedBloomFilter && BloomFilterConstructor && advancedBloomFilter instanceof BloomFilterConstructor) {
            advancedBloomFilter.enabled = config.enabled && pp.enabled && ab.enabled;
            advancedBloomFilter.threshold = ab.threshold;
            advancedBloomFilter.bloomScale = ab.bloomScale;
            advancedBloomFilter.brightness = ab.brightness;
            advancedBloomFilter.blur = ab.blur;
            advancedBloomFilter.quality = ab.quality;
        }

        const tiltShiftFilter = this.getFilter('tiltShift');
        const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
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

        const vignetteFilter = this.getFilter('vignette');
        if (vignetteFilter instanceof VignetteFilter) {
            vignetteFilter.enabled = config.enabled && pp.enabled && pp.vignette.enabled;
            vignetteFilter.amount = pp.vignette.amount;
            vignetteFilter.softness = pp.vignette.softness;
        }

        const lensDistortionFilter = this.getFilter('lensDistortion');
        if (lensDistortionFilter instanceof LensDistortionFilter) {
            lensDistortionFilter.enabled = config.enabled && pp.enabled && pp.lensDistortion.enabled;
            lensDistortionFilter.amount = pp.lensDistortion.amount;
            lensDistortionFilter.center = [pp.lensDistortion.centerX, pp.lensDistortion.centerY];
        }

        const caFilter = this.getFilter('chromaticAberration');
        if (caFilter instanceof ChromaticAberrationFilter) {
            caFilter.enabled = config.enabled && pp.enabled && pp.chromaticAberration.enabled;
            caFilter.amount = pp.chromaticAberration.amount;
            caFilter.center = [pp.chromaticAberration.centerX, pp.chromaticAberration.centerY];
        }

        const ccFilter = this.getFilter('colorCorrection');
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

        const pauseFilter = this.getFilter('pauseEffect');
        if (pauseFilter instanceof ColorCorrectionFilter) {
            const pauseConfig = config.pauseEffect.colorCorrection;
            // The filter's .enabled property is handled by the 'pause' hook, so we do not set it here.

            const u = pauseFilter.uniforms;
            u.uSaturation = pauseConfig.saturation;
            u.uBrightness = pauseConfig.brightness;
            u.uContrast = pauseConfig.contrast;
            u.uInvert = pauseConfig.invert;
            u.uExposure = pauseConfig.exposure;
            u.uGamma = pauseConfig.gamma;
            u.uInBlack = pauseConfig.levels.inBlack;
            u.uInWhite = pauseConfig.levels.inWhite;
            u.uTemperature = pauseConfig.whiteBalance.temperature;
            u.uWbTint = pauseConfig.whiteBalance.tint;
            u.uTintColor = hexToRgbArray(pauseConfig.tint.color);
            u.uTintAmount = pauseConfig.tint.amount;
            u.uSelectiveEnabled = pauseConfig.selective.enabled;
            u.uSelectiveColor = hexToRgbArray(pauseConfig.selective.color);
            u.uSelectiveHueRange = pauseConfig.selective.hueRange;
            u.uSelectiveSatRange = pauseConfig.selective.saturationRange;
        }

        const waterFilter = this.getFilter('water');
        if (waterFilter instanceof WaterEffectsFilter) {
            const wConfig = config.water;
            const u = waterFilter.uniforms;

            // Parameter uniforms are set here from config.
            // Texture uniforms (like masks) are set by the WaterFXLayer in its animation loop.
            u.u_wave_enabled = wConfig.wave.enabled;
            u.u_wave_intensity = wConfig.wave.intensity;
            const srfConfig = wConfig.surface;
            u.u_surface_enabled = srfConfig.enabled;
            u.u_openWaterFoamColor = hexToRgbArray(srfConfig.foamColor);
            u.u_openWaterFoamIntensity = srfConfig.foamIntensity;
            u.u_openWaterFoamCoverage = srfConfig.foamCoverage;
            u.u_openWaterFoamSharpness = srfConfig.foamSharpness;
            u.u_openWaterFbmScale = srfConfig.fbmScale;
            u.u_openWaterFbmSpeed = srfConfig.fbmSpeed;
            u.u_openWaterFbmEvolution = srfConfig.fbmEvolution;
            u.u_openWaterFbmOctaves = srfConfig.fbmOctaves;
            u.u_openWaterFbmLacunarity = srfConfig.fbmLacunarity;
            u.u_openWaterFbmPersistence = srfConfig.fbmPersistence;
            u.u_sheenEnabled = srfConfig.sheenEnabled;
            u.u_sheenColor = hexToRgbArray(srfConfig.sheenColor);
            u.u_sheenIntensity = srfConfig.sheenIntensity;
            u.u_sheenScale = srfConfig.sheenScale;
            u.u_sheenSpeed = srfConfig.sheenSpeed;
            u.u_sheenStretch = srfConfig.sheenStretch;
            u.u_sheenSharpness = srfConfig.sheenSharpness;
            const cConfig = wConfig.caustics;
            u.u_caustics_enabled = cConfig.enabled;
            u.u_causticsColor = hexToRgbArray(cConfig.color);
            u.u_causticsIntensity = cConfig.intensity;
            u.u_causticsScale = cConfig.scale;
            u.u_causticsSpeed = cConfig.speed;
            u.u_causticsLineSharpness = cConfig.lineSharpness;
            u.u_causticsBloomIntensity = cConfig.bloomIntensity;
            u.u_causticsLineDistortion = cConfig.lineDistortion;
            u.u_causticsLineDistortionScale = cConfig.lineDistortionScale;
            u.u_causticsIntersectionBoost = cConfig.intersectionBoost;
            u.u_causticsRoughnessScale = cConfig.roughnessScale;
            u.u_causticsRoughnessIntensity = cConfig.roughnessIntensity;
            const shConfig = wConfig.shoreline;
            u.u_shoreline_enabled = shConfig.enabled;
            u.u_shorelineFoamColor = hexToRgbArray(shConfig.foamColor);
            u.u_shorelineFoamIntensity = shConfig.foamIntensity;
            const dispConfig = shConfig.displacement;
            if (dispConfig) {
                u.u_shorelineDisplacementEnabled = dispConfig.enabled;
                u.u_shorelineDisplacementScale = dispConfig.scale;
                u.u_shorelineDisplacementSpeed = dispConfig.speed;
                u.u_shorelineDisplacementStrength = dispConfig.strength;
            }
            const foamPatternConfig = shConfig.foamPattern;
            u.u_shorelinePatternScale = foamPatternConfig.scale;
            u.u_shorelinePatternSpeed = foamPatternConfig.speed;
            u.u_shorelinePatternEvolution = foamPatternConfig.evolution;
            u.u_shorelinePatternOctaves = foamPatternConfig.octaves;
            u.u_shorelinePatternLacunarity = foamPatternConfig.lacunarity;
            u.u_shorelinePatternPersistence = foamPatternConfig.persistence;
            u.u_shorelinePatternBrightness = foamPatternConfig.brightness;
            u.u_shorelinePatternContrast = foamPatternConfig.contrast;
            u.u_particleMaskBrightness = shConfig.particleMaskBrightness;
            u.u_particleMaskContrast = shConfig.particleMaskContrast;
        }
    }

    static tearDown() {
        if (!this._container) return;
        this._filters.forEach(filter => filter.destroy());
        this._filters.clear();
        this._updateContainerFilters();
        this._container = null;
    }
}

class NoiseTextureManager {
    constructor(renderer, configPath, isWorldSpace = false) {
        this.configPath = configPath;
        this.isWorldSpace = isWorldSpace;
        this._needsUpdate = true; // A flag to force an update after config changes or pans.

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
        // START OF MODIFICATION
        this.filter = new NoisePatternFilter({
            u_isWorldSpace: this.isWorldSpace,
            u_resolution: [screen.width, screen.height] // Pass initial screen resolution here
        });
        this.sourceSprite.filters = [this.filter];
        // END OF MODIFICATION

        // If this is a world-space noise, it must re-render on pan.
        if (this.isWorldSpace) {
            this._onPanBound = this.requestUpdate.bind(this);
            if (!game.modules.get('libwrapper')?.active) {
                Hooks.on('canvasPan', this._onPanBound);
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
        // If the noise config for this path doesn't exist (e.g., parent effect is disabled),
        // then disable this internal filter and return.
        if (!nConfig) {
            if (this.filter) this.filter.enabled = false;
            return;
        }

        // Ensure the filter object has been instantiated.
        if (!this.filter) return;

        // The internal noise filter should always be enabled if its configuration is present.
        // Its output is consumed by other filters/layers, which handle the overall effect's enablement.
        this.filter.enabled = true;

        // Now, safely update all the uniform parameters.
        const u = this.filter.uniforms;
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        u.u_speed = nConfig.speed * timeFactor;
        u.u_scale = nConfig.scale;
        u.u_threshold = nConfig.threshold;
        u.u_brightness = nConfig.brightness;
        u.u_contrast = nConfig.contrast;
        u.u_softness = nConfig.softness;
        u.u_evolution = nConfig.evolution ?? 0.0;

        // Request an update to the noise texture after parameters have changed.
        this.requestUpdate();
    }

    update(deltaTime, renderer) {
        if (!this.filter || !this.sourceSprite || !this.renderTexture) return;
        
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const nConfig = foundry.utils.getProperty(game.mapShine.profileManager.activeConfig, this.configPath);
        const isAnimated = nConfig && ((nConfig.speed * timeFactor) !== 0 || (nConfig.evolution * timeFactor) !== 0);

        if (!this._needsUpdate && !isAnimated) return;

        this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + (deltaTime * timeFactor);

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
            Hooks.off('canvasPan', this._onPanBound);
        }
        this.filter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture?.destroy(true);
    }
}

class LightingMaskGenerator {
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
        if (!this.sourceSprite || !illuminationTexture) return;
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
}

class DynamicTokenMaskManager {
    constructor(canvas) {
        this.canvas = canvas;
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
        this.tokenSprites = new Map();
        this._needsUpdate = true;
        this._destroyed = false;

        this._frameCount = 0;
        this.updateFrequency = 3;

        this._boundOnTokenChange = this._requestUpdate.bind(this);

        Hooks.on("createToken", this._boundOnTokenChange);
        Hooks.on("deleteToken", this._boundOnTokenChange);
        Hooks.on("canvasPan", this._boundOnTokenChange);

        this._boundOnAnimate = () => {
            if (this._destroyed || !this.canvas?.stage?.transform) return;

            this._frameCount++;
            const isNthFrame = (this._frameCount % this.updateFrequency === 0);

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
        if (this._destroyed || !this.tokenContainer || !this.canvas?.tokens?.placeables) return;
        const renderer = this.canvas.app.renderer;

        const currentTokenIds = new Set();

        for (const token of this.canvas.tokens.placeables) {
            if (!token.visible || !token.texture?.valid || token.document.hidden) {
                continue;
            }
            currentTokenIds.add(token.id);

            let sprite = this.tokenSprites.get(token.id);

            if (!sprite) {
                sprite = new PIXI.Sprite(token.texture);
                sprite.tint = 0xFFFFFF;
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

        if (!this.canvas?.stage?.transform) return;

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
        if (this._destroyed) return;
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
}

class AmbientMaskManager {
    constructor(canvas) {
        console.log("AmbientMaskManager | Initializing.");
        this.canvas = canvas;
        this.maskGenerator = new LightingMaskGenerator();
        this.maskSprite = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
        this._destroyed = false;

        this._tickerFunction = this.update.bind(this);
        this.canvas.app.ticker.add(this._tickerFunction);

        this._onResizeBound = this._onResize.bind(this);
        window.addEventListener('resize', this._onResizeBound);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        console.log("AmbientMaskManager | Destroying.");
        this.canvas.app.ticker.remove(this._tickerFunction);
        window.removeEventListener('resize', this._onResizeBound);

        const ambientLayer = this.canvas.layers.find(l => l instanceof AmbientLayer);
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
        if (this._destroyed) return;
        const ambientLayer = this.canvas.layers.find(l => l instanceof AmbientLayer);
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;

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
            if (ambientLayer.mask) ambientLayer.mask = null;
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
}

class LightingEffectManager {
    constructor(canvas) {
        console.log("LightingEffectManager | Initializing.");
        this.canvas = canvas;
        this.maskGenerator = new LightingMaskGenerator();
        this.pauseMaskGenerator = new LightingMaskGenerator();
        this._tickerFunction = this.update.bind(this);
        this.canvas.app.ticker.add(this._tickerFunction);
        this._destroyed = false;
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        console.log("LightingEffectManager | Destroying.");
        this.canvas.app.ticker.remove(this._tickerFunction);
        this.maskGenerator?.destroy();
        this.pauseMaskGenerator?.destroy();
    }

    update() {
        if (this._destroyed) return;

        const fullConfig = game.mapShine.profileManager.activeConfig;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;

        // --- Handle Post-Processing Filter (Main + Highlights) ---
        const ccFilter = ScreenEffectsManager.getFilter('colorCorrection');
        if (ccFilter) {
            const config = fullConfig.postProcessing.colorCorrection;
            const u = ccFilter.uniforms;

            const rect = this.canvas.scene.dimensions.sceneRect; // Use the un-padded scene rectangle
            const screen = this.canvas.app.renderer.screen;

            if (rect && screen.width > 0 && screen.height > 0) {
                // Convert top-left world coordinate to screen pixel coordinate
                const topLeftScreen = this.canvas.stage.toGlobal({ x: rect.x, y: rect.y });
                
                // Get width/height in pixels by multiplying world size by current scale
                const sceneWidthPixels = rect.width * this.canvas.stage.scale.x;
                const sceneHeightPixels = rect.height * this.canvas.stage.scale.y;
            
                // Normalize by screen dimensions and pass to shader
                u.uSceneRectNorm = [
                    topLeftScreen.x / screen.width,
                    topLeftScreen.y / screen.height,
                    sceneWidthPixels / screen.width,
                    sceneHeightPixels / screen.height
                ];
            }

            // Standard illumination-based mask for color correction.
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

            // Cloud Highlights
            const cloudLayer = this.canvas.layers.find(l => l instanceof CloudShadowsLayer);
            u.uCloudHighlightsEnabled = config.highlightCloud.enabled && !!cloudLayer?.visible;
            if (u.uCloudHighlightsEnabled) {
                u.uCloudHighlightsMask = cloudLayer.getHighlightMaskTexture();
                u.uCloudHighlightsBrightness = config.highlightCloud.brightness;
            }

            // Canopy Highlights
            const canopyLayer = this.canvas.layers.find(l => l instanceof CanopyLayer);
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

            // Structural Highlights
            const structuralLayer = this.canvas.layers.find(l => l instanceof StructuralShadowsLayer);
            const structuralHighlightMask = structuralLayer?.getHighlightMaskTexture();
            u.uStructuralHighlightsEnabled = config.highlightStructural.enabled && !!structuralHighlightMask?.valid;
            if (u.uStructuralHighlightsEnabled) {
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
            } else {
                u.uStructuralOutdoorsMaskEnabled = false;
                u.uStructuralSplitHighlightsEnabled = false;
            }
        }

        // --- Handle Pause Effect Filter ---
        const pauseFilter = ScreenEffectsManager.getFilter('pauseEffect');
        if (pauseFilter) {
            const config = fullConfig.pauseEffect.colorCorrection;
            const u = pauseFilter.uniforms;

            const useIllumMask = config.mask.enabled && !!illuminationAPI;
            u.uMaskEnabled = useIllumMask;
            if (useIllumMask) {
                this.pauseMaskGenerator.update(
                    this.canvas.app.renderer,
                    illuminationAPI.getLightingTexture(),
                    config.mask.luminanceThreshold,
                    config.mask.softness,
                    config.mask.invert
                );
                u.uMaskTexture = this.pauseMaskGenerator.getMaskTexture();
            }
        }
    }
}

class CompositeMaskGenerator {
    /**
     * Creates a new texture by blending two source textures with a MULTIPLY effect.
     * @param {string} baseTexturePath - The path to the first texture (e.g., _Dust).
     * @param {string} overlayTexturePath - The path to the second texture (e.g., _Structural).
     * @param {PIXI.Rectangle} rect - The world-space rectangle defining the target area.
     * @returns {Promise<PIXI.RenderTexture|null>} A promise that resolves to the new composite texture, or null on failure.
     */
    static async generate(baseTexturePath, overlayTexturePath, rect) {
        const renderer = canvas.app?.renderer;
        if (!renderer || !rect || !baseTexturePath || !overlayTexturePath) return null;

        try {
            const [baseTex, overlayTex] = await Promise.all([
                foundry.canvas.loadTexture(baseTexturePath),
                foundry.canvas.loadTexture(overlayTexturePath)
            ]);

            const container = new PIXI.Container();
            const baseSprite = new PIXI.Sprite(baseTex);
            const overlaySprite = new PIXI.Sprite(overlayTex);

            // Set sprite properties to match the target tile/background
            baseSprite.width = overlaySprite.width = rect.width;
            baseSprite.height = overlaySprite.height = rect.height;
            baseSprite.position.set(rect.x, rect.y);
            overlaySprite.position.set(rect.x, rect.y);

            // Set the blend mode to MULTIPLY to get the intersection
            overlaySprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

            container.addChild(baseSprite, overlaySprite);

            // Create a render texture to capture the result
            const renderTexture = PIXI.RenderTexture.create({
                width: renderer.screen.width,
                height: renderer.screen.height
            });

            // Render the container with the world transform to the screen-sized texture
            renderer.render(container, {
                renderTexture: renderTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });

            // Clean up the temporary PIXI objects
            container.destroy({ children: true });

            return renderTexture;

        } catch (error) {
            console.error(`Map Shine | Failed to generate composite mask from "${baseTexturePath}" and "${overlayTexturePath}"`, error);
            return null;
        }
    }
}

// =================================================================================
// SECTION 3: PARTICLE SYSTEMS
// =================================================================================
// Description: This section contains the management system for all particle effects.
// ---------------------------------------------------------------------------------

const PARTICLE_EFFECT_DEFINITIONS = {
    dust: {
        title: "Dust Motes",
        description: "Floating dust particles that appear in areas defined by the _Dust map. Requires a _Dust.webp texture.",
        configPath: 'dust',
        triggerTexture: 'dust',
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'dust')
    },
    glint: {
        title: "Glint Particles",
        description: "Sparkling glints that appear in areas defined by the _Prism map. Requires a _Prism.webp texture.",
        configPath: 'glint',
        triggerTexture: 'prism',
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'prism')
    },
    waterGlints: {
        title: "Water Glints / Spray",
        description: "General-purpose particles spawned across the entire water surface.",
        configPath: 'water.glintParticles',
        triggerTexture: 'water',
        spawnOn: "tiles",
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'water')
    },
    foam: {
        title: "Shoreline Foam Particles",
        description: "Spawns particles on the brightest parts of the animated shoreline foam.",
        configPath: 'water.shoreline.foamParticles',
        triggerTexture: 'shoreline', // Triggered by the presence of a _Shoreline texture
        spawnOn: "tiles",
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'shoreline') // Use the shoreline texture as the mask
    },
    fire: {
        title: "Fire & Embers",
        description: "A multi-stage effect for fire, combining particles and a bloom glow. Requires a _Fire.webp map where white areas are the heart of the flame.",
        configPath: 'fire.particles',
        triggerTexture: 'fire',
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'fire')
    }
};

class ParticleEffectController {
    constructor(definition, parentContainer) {
        this.definition = definition;
        this.parentContainer = parentContainer; // This is the main container from ParticleManager
        this.emitters = new Map();
        this.pendingTargets = new Map();
        this.config = {};
        this.rgbSplitFilter = null;
        this.bloomFilter = null;

        // This will be the container that holds only the particles for effects needing pre-filtering blending.
        this.particleOnlyContainer = null;

        // Special handling for effects with filters that need to operate on blended particles
        if (definition.configPath === 'glint') {
            this.rgbSplitFilter = new ParticleRgbSplitFilter();
        }
        if (definition.configPath === 'fire.particles') {
            const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
            if (BloomFilterConstructor) {
                this.bloomFilter = new BloomFilterConstructor();
            }
            // For fire, we need a wrapper so blending happens before bloom.
            this.particleOnlyContainer = new PIXI.Container();
            this.parentContainer.addChild(this.particleOnlyContainer);
        }
    }

    static getSettingsHTML(effectKey) {
        const definition = PARTICLE_EFFECT_DEFINITIONS[effectKey];
        if (!definition) return '';

        const path = definition.configPath;
        let content = `<p class="description-text">${definition.description}</p>`;
        content += DebuggerUIBuilder._createSelectHTML(`${path}.blendMode`, 'Blend Mode', BLEND_MODE_OPTIONS);

        // Special case for Fire Bloom
        if (effectKey === 'fire') {
            content += `
                    <details id="details-fire-bloom" open>
                        <summary><span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('fire.bloom.enabled', 'Bloom Effect', true)}</div>
                        </summary>
                        <div style="padding-left: 15px;">
                            <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;"><strong style="color: #ffddaa;">PERFORMANCE WARNING:</strong> This can be demanding. Lowering 'Quality' can improve performance.</div>
                            <p class="description-text">Adds a soft glow to the fire particles.</p>
                            ${DebuggerUIBuilder._createSliderHTML('fire.bloom.threshold', 'Threshold', 0, 1, 0.01, 'Only particles brighter than this will bloom.')}
                            ${DebuggerUIBuilder._createSliderHTML('fire.bloom.brightness', 'Brightness', 0, 5, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('fire.bloom.bloomScale', 'Scale', 0.1, 5, 0.1, 'The size of the bloom effect.')}
                            ${DebuggerUIBuilder._createSliderHTML('fire.bloom.blur', 'Blur Amount', 0, 20, 0.5)}
                            ${DebuggerUIBuilder._createSliderHTML('fire.bloom.quality', 'Quality', 1, 15, 1, 'Number of blur samples. Higher is smoother but much slower.')}
                        </div>
                    </details>
                `;
        }

        // Common particle sections
        content += `
                <details open>
                    <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createTextureInputHTML(definition.triggerTexture, `Effect Mask (_${definition.triggerTexture.charAt(0).toUpperCase() + definition.triggerTexture.slice(1)})`)}
                        ${DebuggerUIBuilder._createSliderHTML(`${path}.maskInfluence`, 'Particle Density', 0.01, 5, 0.01, 'Controls the maximum number of particles.')}
                        ${DebuggerUIBuilder._createSliderHTML(`${path}.frequency`, 'Spawn Rate (s)', 0.001, 1, 0.001, 'Time in seconds between particle spawns. Lower is faster.')}
                        ${DebuggerUIBuilder._createSliderHTML(`${path}.maskThreshold`, 'Mask Threshold', 0, 1, 0.01, 'Luminance from the mask required to spawn particles.')}
                        ${effectKey === 'glint' ? DebuggerUIBuilder._createCheckboxHTML(`${path}.darknessAffectsIntensity`, 'Darkness Reduces Intensity', false, 'If checked, the scene darkness level will reduce the particle spawn rate.') : ''}
                    </div>
                </details>
                <details>
                    <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createTextInputHTML(`${path}.particleTexture`, 'Particle Texture', 'Path to the particle image.')}
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.lifetime.min`, 'Min Lifetime (s)', 0.1, 20, 0.1)}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.lifetime.max`, 'Max Lifetime (s)', 0.1, 20, 0.1)}
                            </div>
                        </details>
                        <details open>
                            <summary><span class="accordion-toggle"></span><strong>Color Over Life</strong></summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Sets particle color at birth and death. If colors are the same, a static color is used.</p>
                                ${DebuggerUIBuilder._createColorPickerHTML(`${path}.color.start`, 'Start Color')}
                                ${DebuggerUIBuilder._createColorPickerHTML(`${path}.color.end`, 'End Color')}
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Alpha / Opacity</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.alpha.max`, 'Max Alpha', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.alpha.fadeIn`, 'FadeIn Time (%)', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.alpha.fadeOut`, 'FadeOut Time (%)', 0, 1, 0.01)}
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.sizeMultiplier`, 'Global Size', 0.1, 10, 0.1, 'A global multiplier for particle size.')}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.start`, 'Start Scale Mult', 0, 2, 0.01, 'Particle size at birth (multiplied by Global Size).')}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.end`, 'End Scale Mult', 0, 2, 0.01, 'Particle size at death (multiplied by Global Size).')}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.minMult`, 'Random Size Min', 0.1, 1, 0.01, 'Minimum random scale multiplier for each particle (from this value to 1.0).')}
                            </div>
                        </details>
                        ${effectKey === 'glint' ? `
                        <details>
                            <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(`${path}.rgbSplit.enabled`, 'RGB Split Effect', true)}</div></summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Applies a chromatic aberration effect to the particles.</p>
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.rgbSplit.amount`, 'Amount', 0, 10, 0.1)}
                            </div>
                        </details>` : ''}
                    </div>
                </details>
                <details>
                    <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                    <div style="padding-left: 15px;">
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.speed.start`, 'Start Speed', -50, 50, 1)}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.speed.end`, 'End Speed', -50, 50, 1)}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.speed.minMult`, 'Random Speed Min', 0.1, 1, 0.01, 'Minimum random speed multiplier for each particle (from this value to 1.0).')}
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(`${path}.rotation.enabled`, 'Tumbling / Rotation', true)}</div></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.rotation.minSpeed`, 'Min Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.rotation.maxSpeed`, 'Max Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.rotation.accel`, 'Rot. Accel.', -90, 90, 1, 'Degrees per second squared.')}
                            </div>
                        </details>
                    </div>
                </details>
            `;

        // Special case for Fire Wind
        if (effectKey === 'fire') {
            content += `
                    <details id="details-fire-wind" open>
                        <summary><span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(`${path}.wind.enabled`, 'Complex Wind', true)}</div>
                        </summary>
                        <div style="padding-left: 15px;">
                            <p class="description-text">Applies a dynamic wind force to all fire particles.</p>
                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.force`, 'Wind Force', 0, 500, 5, 'How strongly the wind pushes the particles.')}
                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.baseSpeed`, 'Base Speed', 0, 200, 1, 'The normal speed of the wind.')}
                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustSpeed`, 'Gust Speed', 0, 500, 5, 'The peak speed during a gust.')}
                            <details>
                                <summary><span class="accordion-toggle"></span><strong>Gust Timing</strong></summary>
                                <div style="padding-left: 15px;">
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustFrequencyMin`, 'Min Time Between Gusts (s)', 0.1, 20, 0.1)}
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustFrequencyMax`, 'Max Time Between Gusts (s)', 0.1, 20, 0.1)}
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustDurationMin`, 'Min Gust Duration (s)', 0.1, 5, 0.1)}
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustDurationMax`, 'Max Gust Duration (s)', 0.1, 5, 0.1)}
                                </div>
                            </details>
                            <details>
                                <summary><span class="accordion-toggle"></span><strong>Angle Change</strong></summary>
                                <div style="padding-left: 15px;">
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.angleChangeFrequencyMin`, 'Min Time Between Changes (s)', 0.1, 30, 0.1)}
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.angleChangeFrequencyMax`, 'Max Time Between Changes (s)', 0.1, 30, 0.1)}
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.angleChangeRange`, 'Max Angle Change ( )', 0, 90, 1, 'Max degrees the angle can shift each time.')}
                                </div>
                            </details>
                        </div>
                    </details>
                `;
        }

        const mainAccordionPath = effectKey === 'fire' ? 'fire.particles.enabled' : `${path}.enabled`;
        const mainAccordionId = effectKey === 'fire' ? 'details-fire-particles' : `details-${effectKey}`;

        return DebuggerUIBuilder._createAccordionHTML(effectKey, definition.title, content).replace(`details-${effectKey}`, mainAccordionId).replace(`${path}.enabled`, mainAccordionPath);
    }


    updateTargets(targets, fullConfig) {
        // Always destroy and recreate emitters to pick up config changes like lifetime, scale, etc.
        this.destroyAllEmitters();

        this.config = foundry.utils.getProperty(fullConfig, this.definition.configPath);
        if (!fullConfig.enabled || !this.config?.enabled) {
            return; // Emitters are already destroyed, nothing more to do.
        }

        // Determine which targets are valid for this effect.
        let targetsToProcess = [];
        const spawnOn = this.definition.spawnOn;
        if (spawnOn === "tiles") {
            targetsToProcess = [...targets.tiles.values()];
        } else if (spawnOn === "background") {
            if (targets.background) {
                targetsToProcess = [targets.background];
            }
        } else {
            targetsToProcess = [targets.background, ...targets.tiles.values()].filter(Boolean);
        }

        // Add all valid targets to the pending list for recreation.
        for (const target of targetsToProcess) {
            const targetId = target.tile ? target.tile.id : 'background';
            if (target[this.definition.triggerTexture]) {
                this.pendingTargets.set(targetId, target);
            }
        }
    }

    async _createEmitterForTarget(targetData, targetId) {
        let customMaskTexture = null;

        // Check for the specific "god ray" condition.
        if (this.definition.configPath === 'dust' && targetData.dust && targetData.structural) {
            console.log(`Map Shine | Creating composite mask for Volumetric Dust on target '${targetId}'.`);
            customMaskTexture = await CompositeMaskGenerator.generate(targetData.dust, targetData.structural, targetData.rect);
            if (customMaskTexture) {
                // IMPORTANT: We now modify the targetData object in-flight.
                // The buildParticleEmitterConfig function looks for a texture at targetData[maskKey].
                // We are replacing the path string with the actual PIXI.Texture object we just created.
                targetData.dust = customMaskTexture; // 'dust' is the triggerTexture for this effect.
            }
        }

        const particleTexPath = this.config.particleTexture ?? "modules/map-shine/assets/particle.webp";

        if (!particleTexPath || typeof particleTexPath !== 'string') {
            console.error(`Map Shine | Invalid or missing particle texture path for ${this.definition.configPath}`);
            return;
        }

        try {
            const texture = await foundry.canvas.loadTexture(particleTexPath);
            const currentFullConfig = game.mapShine.profileManager.activeConfig;
            const currentEffectConfig = foundry.utils.getProperty(currentFullConfig, this.definition.configPath);
            if (!this.parentContainer || !currentFullConfig.enabled || !currentEffectConfig?.enabled) {
                // If a custom mask was created but the effect is now disabled, clean it up.
                customMaskTexture?.destroy(true);
                return;
            }
            if (this.emitters.has(targetId)) {
                // As above, clean up if we're aborting.
                customMaskTexture?.destroy(true);
                return;
            }
            const emitterConfig = this.definition.buildEmitterConfig(currentEffectConfig, targetData);
            if (emitterConfig.maxParticles === 0) {
                customMaskTexture?.destroy(true);
                return;
            }
            const textureBehavior = emitterConfig.behaviors.find(b => b.type === 'textureSingle');
            if (textureBehavior) {
                textureBehavior.config.texture = texture;
            }
            const emitterParent = this.particleOnlyContainer || this.parentContainer;
            const emitter = new PIXI.particles.Emitter(emitterParent, emitterConfig);

            // Attach the custom texture to the emitter instance so we can destroy it later.
            if (customMaskTexture) {
                emitter._customMaskTexture = customMaskTexture;
            }

            emitter.autoUpdate = false;
            this.emitters.set(targetId, emitter);
            console.log(`Map Shine | Created '${this.definition.configPath}' particle emitter for target '${targetId}'.`);
            this.updateFromConfig(currentFullConfig);
        } catch (err) {
            console.error(`Map Shine | Failed to load particle texture: "${particleTexPath}"`, err);
            ui.notifications.error(`Map Shine: Could not load particle texture for effect '${this.definition.configPath}'. Check path and console (F12) for details.`);
            // If texture loading fails, make sure to clean up the custom mask if it was created.
            customMaskTexture?.destroy(true);
        }
    }

    update(deltaTime) {
        if (this.pendingTargets.size > 0) {
            for (const [targetId, targetData] of this.pendingTargets.entries()) {
                this._createEmitterForTarget(targetData, targetId);
            }
            this.pendingTargets.clear();
        }

        for (const emitter of this.emitters.values()) {
            emitter.update(deltaTime);
        }
    }

    updateFromConfig(fullConfig) {
        this.config = foundry.utils.getProperty(fullConfig, this.definition.configPath);

        const pathParts = this.definition.configPath.split('.');
        let isEnabledByConfig = fullConfig.enabled;
        let currentPath = "";
        for (const part of pathParts) {
            currentPath = currentPath ? `${currentPath}.${part}` : part;
            const currentConfig = foundry.utils.getProperty(fullConfig, currentPath);
            if (typeof currentConfig === 'object' && currentConfig !== null) {
                if ((currentConfig.enabled ?? true) === false) {
                    isEnabledByConfig = false;
                    break;
                }
            }
        }

        this.parentContainer.visible = isEnabledByConfig;

        // --- BLEND MODE AND CONTAINER SETUP ---
        // Special handling for fire's wrapped container setup.
        if (this.particleOnlyContainer) {
            // The inner container gets the particle-specific blend mode (e.g., ADD).
            this.particleOnlyContainer.blendMode = this.config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
            // The outer container's blend mode should also be ADD to blend the final result correctly.
            this.parentContainer.blendMode = this.config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
        }
        // Standard handling for all other effects.
        else if (this.config?.blendMode !== undefined) {
            this.parentContainer.blendMode = this.config.blendMode;
        }

        let shouldEmit = isEnabledByConfig;
        let containerAlpha = 1.0;

        if (this.definition.configPath === 'glint' && this.config.darknessAffectsIntensity) {
            const darkness = canvas.scene?.darkness ?? 0;
            containerAlpha = 1.0 - darkness;
            if (darkness > 0.99) shouldEmit = false;
        }

        this.parentContainer.alpha = containerAlpha;

        for (const emitter of this.emitters.values()) {
            emitter.emit = shouldEmit;
        }

        // Manage RGB Split filter for Glint
        if (this.rgbSplitFilter) {
            const rgbConfig = this.config?.rgbSplit;
            const shouldUseRgb = rgbConfig?.enabled && isEnabledByConfig;
            if (shouldUseRgb) {
                this.rgbSplitFilter.enabled = true;
                this.rgbSplitFilter.uniforms.uAmount = rgbConfig.amount;
                const screen = canvas?.app?.screen;
                if (screen) {
                    this.rgbSplitFilter.uniforms.uTexelSize = [1 / screen.width, 1 / screen.height];
                }
                if (!this.parentContainer.filters?.includes(this.rgbSplitFilter)) {
                    this.parentContainer.filters = [...(this.parentContainer.filters || []), this.rgbSplitFilter];
                }
            } else {
                if (this.parentContainer.filters?.includes(this.rgbSplitFilter)) {
                    this.parentContainer.filters = this.parentContainer.filters.filter(f => f !== this.rgbSplitFilter);
                }
            }
        }

        // Manage Bloom filter for Fire
        if (this.bloomFilter) {
            const fireConfig = foundry.utils.getProperty(fullConfig, 'fire');
            const bloomConfig = fireConfig?.bloom;
            const shouldUseBloom = isEnabledByConfig && bloomConfig?.enabled;

            if (shouldUseBloom) {
                this.bloomFilter.enabled = true;
                foundry.utils.mergeObject(this.bloomFilter, bloomConfig);
                // The filter is applied to the WRAPPER (parentContainer), not the inner particleOnlyContainer.
                if (!this.parentContainer.filters?.includes(this.bloomFilter)) {
                    this.parentContainer.filters = [...(this.parentContainer.filters || []), this.bloomFilter];
                }
                // Set the filterArea to the screen rectangle. This stabilizes the filter's
                // operating area, preventing jitter caused by fluctuating particle bounds.
                if (canvas?.app?.screen) {
                    this.parentContainer.filterArea = canvas.app.screen;
                }
            } else {
                if (this.parentContainer.filters?.includes(this.bloomFilter)) {
                    this.parentContainer.filters = this.parentContainer.filters.filter(f => f !== this.bloomFilter);
                }
                // Unset the filterArea when the filter is removed to avoid unnecessary processing.
                this.parentContainer.filterArea = null;
            }
        }
    }

    destroyAllEmitters() {
        for (const emitter of this.emitters.values()) {
            // If this emitter has a custom composite mask, destroy it now.
            if (emitter._customMaskTexture) {
                emitter._customMaskTexture.destroy(true);
                emitter._customMaskTexture = null;
            }
            emitter.destroy();
        }
        this.emitters.clear();
        this.pendingTargets.clear();
    }

    destroy() {
        this.destroyAllEmitters();
        this.rgbSplitFilter?.destroy();
        this.bloomFilter?.destroy();

        // If we created a special inner container, destroy it now.
        this.particleOnlyContainer?.destroy({
            children: true
        });

        this.parentContainer = null;
    }
}

const buildParticleEmitterConfig = (effectConfig, targetData, maskKey) => {
    const config = effectConfig || {};
    const rect = targetData?.rect;

    if (!rect) {
        return {
            lifetime: {
                min: 1,
                max: 1
            },
            frequency: 9999,
            maxParticles: 0,
            behaviors: []
        };
    }

    const spawnMaskTexture = targetData[maskKey];
    if (!spawnMaskTexture) {
        console.warn(`Map Shine | buildParticleEmitterConfig: Missing spawn mask texture for key '${maskKey}' on target.`);
        return {
            lifetime: {
                min: 1,
                max: 1
            },
            frequency: 9999,
            maxParticles: 0,
            behaviors: []
        };
    }

    const spawnBehavior = {
        type: 'spawnShape',
        config: {
            type: 'textureMask',
            data: {
                texture: spawnMaskTexture,
                width: rect.width,
                height: rect.height,
                x: 0,
                y: 0,
                threshold: (config.maskThreshold ?? 0.5) * 255,
                isDynamicScreenMask: false
            }
        }
    };

    const behaviors = [{
            type: 'textureSingle',
            config: {
                texture: config.particleTexture ?? "modules/map-shine/assets/particle.webp"
            }
        },
        spawnBehavior
    ];

    const alphaConfig = config.alpha ?? {};
    let fadeInTime = Math.max(0, alphaConfig.fadeIn ?? 0.1);
    let fadeOutTime = Math.max(0, alphaConfig.fadeOut ?? 0.1);
    if (fadeInTime + fadeOutTime >= 1) {
        const total = fadeInTime + fadeOutTime;
        fadeInTime /= total;
        fadeOutTime /= total;
    }
    behaviors.push({
        type: 'alpha',
        config: {
            alpha: {
                list: [{
                        value: 0,
                        time: 0
                    },
                    {
                        value: alphaConfig.max ?? 0.7,
                        time: fadeInTime
                    },
                    {
                        value: alphaConfig.max ?? 0.7,
                        time: 1 - fadeOutTime
                    },
                    {
                        value: 0,
                        time: 1
                    }
                ]
            }
        }
    });

    const scaleConfig = config.scale ?? {};
    const startScale = (scaleConfig.start ?? 0.05) * (scaleConfig.sizeMultiplier ?? 1.0);
    const endScale = (scaleConfig.end ?? 0.15) * (scaleConfig.sizeMultiplier ?? 1.0);
    if (startScale === endScale) {
        behaviors.push({
            type: 'scaleStatic',
            config: {
                min: startScale,
                max: startScale
            }
        });
    } else {
        behaviors.push({
            type: 'scale',
            config: {
                scale: {
                    start: startScale,
                    end: endScale
                },
                minMult: scaleConfig.minMult ?? 0.5
            }
        });
    }

    const speedConfig = config.speed ?? {};
    const startSpeed = speedConfig.start ?? 5;
    const endSpeed = speedConfig.end ?? 15;
    if (startSpeed === endSpeed) {
        behaviors.push({
            type: 'moveSpeedStatic',
            config: {
                min: startSpeed,
                max: startSpeed
            }
        });
    } else {
        behaviors.push({
            type: 'moveSpeed',
            config: {
                speed: {
                    start: startSpeed,
                    end: endSpeed
                },
                minMult: speedConfig.minMult ?? 0.5
            }
        });
    }

    const colorConfig = config.color ?? {};
    const startColor = colorConfig.start ?? "#FFFFFF";
    const endColor = colorConfig.end ?? "#FFFFFF";
    if (startColor === endColor) {
        behaviors.push({
            type: 'colorStatic',
            config: {
                color: startColor
            }
        });
    } else {
        behaviors.push({
            type: 'color',
            config: {
                color: {
                    start: startColor,
                    end: endColor
                }
            }
        });
    }

    const rotConfig = config.rotation ?? {};
    if (rotConfig.enabled) {
        behaviors.push({
            type: 'rotation',
            config: {
                minStart: 0,
                maxStart: 360,
                minSpeed: rotConfig.minSpeed ?? 0,
                maxSpeed: rotConfig.maxSpeed ?? 20,
                accel: rotConfig.accel ?? 0
            }
        });
    } else {
        behaviors.push({
            type: 'rotationStatic',
            config: {
                min: 0,
                max: 360
            }
        });
    }

    const lifetimeConfig = config.lifetime ?? {};
    return {
        lifetime: {
            min: lifetimeConfig.min ?? 4,
            max: lifetimeConfig.max ?? 12
        },
        blendMode: config.blendMode ?? PIXI.BLEND_MODES.NORMAL, // This is the corrected line
        frequency: config.frequency ?? 0.1,
        emitterLifetime: -1,
        maxParticles: Math.max(1, 2000 * (config.maskInfluence ?? 1.0)),
        pos: {
            x: rect.x,
            y: rect.y
        },
        addAtBack: false,
        behaviors: behaviors
    };
};

class ParticleManager {
    constructor() {
        this.masterContainer = new PIXI.Container();
        this.controllers = new Map();
    }

    initialize() {
        for (const [key, definition] of Object.entries(PARTICLE_EFFECT_DEFINITIONS)) {
            const effectContainer = new PIXI.Container();
            const controller = new ParticleEffectController(definition, effectContainer);
            this.controllers.set(key, controller);

            this.masterContainer.addChild(effectContainer);
        }
        console.log(`Map Shine | ParticleManager initialized with ${this.controllers.size} effect controllers.`);
    }

    updateEffectTargets(targets) {
        if (!this.controllers.size) return;
        const config = game.mapShine.profileManager.activeConfig;
        for (const controller of this.controllers.values()) {
            controller.updateTargets(targets, config);
        }
    }

    updateFromConfig(config) {
        for (const controller of this.controllers.values()) {
            controller.updateFromConfig(config);
        }
    }

    update(deltaTime) {
        for (const controller of this.controllers.values()) {
            controller.update(deltaTime);
        }
    }

    destroy() {
        for (const controller of this.controllers.values()) {
            controller.destroy();
        }
        this.controllers.clear();
        this.masterContainer?.destroy({
            children: true
        });
        console.log("Map Shine | ParticleManager destroyed.");
    }
}

class FireWindManager {
    constructor(config = {}) {
        this.config = config;

        this.angle = 0; // Current wind angle in degrees
        this.speed = config.baseSpeed || 50;

        this._targetAngle = 0;
        this._angleChangeTimer = 0;
        this._timeToNextAngleChange = this._getRandom(this.config.angleChangeFrequencyMin, this.config.angleChangeFrequencyMax);

        this._isGusting = false;
        this._gustTimer = 0;
        this._timeToNextGust = this._getRandom(this.config.gustFrequencyMin, this.config.gustFrequencyMax);
        this._gustDuration = 0;
    }

    updateFromConfig(config) {
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        // This now correctly applies the timeFactor to the base config values each time it's called.
        // The time delta passed to update() is also scaled, so we no longer double-apply the time scaling.
        this.config = {
            ...config,
            baseSpeed: config.baseSpeed,
            gustSpeed: config.gustSpeed,
            // Frequencies are time between events, so they get longer as time slows down.
            gustFrequencyMin: config.gustFrequencyMin,
            gustFrequencyMax: config.gustFrequencyMax,
            gustDurationMin: config.gustDurationMin,
            gustDurationMax: config.gustDurationMax,
            angleChangeFrequencyMin: config.angleChangeFrequencyMin,
            angleChangeFrequencyMax: config.angleChangeFrequencyMax
        };
    }

    update(delta) {
        // --- Angle Update Logic ---
        this._angleChangeTimer += delta;
        if (this._angleChangeTimer >= this._timeToNextAngleChange) {
            const range = this.config.angleChangeRange || 20;
            this._targetAngle = this.angle + this._getRandom(-range, range);
            this._timeToNextAngleChange = this._getRandom(this.config.angleChangeFrequencyMin, this.config.angleChangeFrequencyMax);
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
                this._timeToNextGust = this._getRandom(this.config.gustFrequencyMin, this.config.gustFrequencyMax);
            }
        } else {
            if (this._gustTimer >= this._timeToNextGust) {
                this._isGusting = true;
                this._gustTimer = 0;
                this._gustDuration = this._getRandom(this.config.gustDurationMin, this.config.gustDurationMax);
            }
        }

        // Lerp speed towards base or gust speed
        const targetSpeed = this._isGusting ? this.config.gustSpeed : this.config.baseSpeed;
        this.speed += (targetSpeed - this.speed) * 0.1;
    }

    _getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }
}

/**
 * A spawn shape that uses a texture as a mask.
 * Particles are only spawned on pixels that are above a certain color threshold.
 * This shape pre-calculates all valid spawn points for high performance during emission.
 */
class TextureMaskShape {
    static type = "textureMask";

    constructor(config) {
        this.width = config.width;
        this.height = config.height;
        this.offsetX = config.x || 0;
        this.offsetY = config.y || 0;
        this.threshold = config.threshold ?? 128;
        this.validPoints = [];
        this.texture = null;
        this.pointCompilationDensity = 4;
        this.isDynamicScreenMask = config.isDynamicScreenMask ?? false;

        const textureSource = config.texture;

        if (!textureSource) {
            console.error("TextureMaskShape | No texture source provided in config.");
            this.texture = PIXI.Texture.EMPTY;
            return;
        }

        if (textureSource instanceof PIXI.Texture) {
            this.texture = textureSource;
            if (this.texture.baseTexture.valid) {
                this._compileValidPoints();
            } else {
                this.texture.baseTexture.once('loaded', () => this._compileValidPoints());
                this.texture.baseTexture.once('error', (bt, err) => console.error(`TextureMaskShape | PIXI.Texture failed to load`, err));
            }
        } else if (typeof textureSource === 'string') {
            foundry.canvas.loadTexture(textureSource).then(texture => {
                this.texture = texture;
                this._compileValidPoints();
            }).catch(err => {
                console.error(`TextureMaskShape | Failed to load texture from path: ${textureSource}`, err);
                this.texture = PIXI.Texture.EMPTY;
            });
        } else {
            console.warn("TextureMaskShape | Unknown texture source type provided:", textureSource);
            this.texture = PIXI.Texture.EMPTY;
        }
    }

    updateTexture(newTexture) {
        if (this.texture === newTexture || !newTexture?.valid) return;
        this.texture = newTexture;
        this._compileValidPoints();
    }

    _compileValidPoints() {
        const renderer = canvas.app?.renderer;
        if (!renderer || !this.texture?.valid || this.texture.width === 0 || this.texture.height === 0) {
            return;
        }

        this.validPoints.length = 0;
        const texture = this.texture;
        const step = Math.max(1, Math.floor(this.pointCompilationDensity));

        const renderTexture = PIXI.RenderTexture.create({
            width: texture.width,
            height: texture.height
        });
        const sprite = new PIXI.Sprite(texture);
        renderer.render(sprite, {
            renderTexture: renderTexture,
            clear: true
        });
        const pixelData = renderer.extract.pixels(renderTexture);
        sprite.destroy();

        if (this.isDynamicScreenMask) {
            // Path for dynamic, screen-sized masks (like animated foam).
            // Iterates through the screen-space texture and converts valid pixel locations
            // back to world-space for particle spawning.
            for (let y = 0; y < texture.height; y += step) {
                for (let x = 0; x < texture.width; x += step) {
                    const index = (y * texture.width + x) * 4;
                    const pixelValue = pixelData[index]; // Use red channel for grayscale
                    if (pixelValue >= this.threshold) {
                        const screenPoint = new PIXI.Point(x, y);
                        const worldPoint = canvas.stage.toLocal(screenPoint);
                        this.validPoints.push(worldPoint);
                    }
                }
            }
        } else {
            // Path for static, world-aligned masks (like a _Dust.webp on a tile).
            // Iterates through the mask texture and maps its local coordinates to the
            // world-space rectangle defined by the tile's position and dimensions.
            for (let y = 0; y < texture.height; y += step) {
                for (let x = 0; x < texture.width; x += step) {
                    const index = (y * texture.width + x) * 4;
                    const pixelValue = pixelData[index]; // Use red channel for grayscale
                    if (pixelValue >= this.threshold) {
                        const relativeX = (x / texture.width) * this.width;
                        const relativeY = (y / texture.height) * this.height;
                        const worldX = this.offsetX + relativeX;
                        const worldY = this.offsetY + relativeY;
                        this.validPoints.push(new PIXI.Point(worldX, worldY));
                    }
                }
            }
        }
        renderTexture.destroy(true); // Clean up the temporary texture
    }

    getRandPos(particle) {
        if (this.validPoints.length === 0) {
            return;
        }
        const point = this.validPoints[Math.floor(Math.random() * this.validPoints.length)];
        particle.position.copyFrom(point);
    }
}

/**
 * A generic canvas layer for hosting all particle effects managed by the ParticleManager.
 */
class ParticleLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this._onAnimateBound = null;
        this._destroyed = false;
        this._framesSinceDraw = 0; // A counter to delay initial setup
        this._initialUpdateComplete = false;
    }

    async _draw(options) {
        this._destroyed = false;
        this._framesSinceDraw = 0; // Reset counter on each draw
        this._initialUpdateComplete = false;

        game.mapShine.particleManager = new ParticleManager();
        this.addChild(game.mapShine.particleManager.masterContainer);
        game.mapShine.particleManager.initialize();

        this._onAnimateBound = this._onAnimate.bind(this);
        canvas.app.ticker.add(this._onAnimateBound);
    }

    async _tearDown(options) {
        if (this._destroyed) return;
        this._destroyed = true;

        if (this._onAnimateBound) {
            canvas.app.ticker.remove(this._onAnimateBound);
        }

        if (game.mapShine.particleManager) {
            game.mapShine.particleManager.destroy();
            game.mapShine.particleManager = null;
        }

        return super._tearDown(options);
    }

    _onAnimate(deltaTime) {
        if (this._destroyed || !game.mapShine.particleManager) return;

        // --- ONE-TIME SAFE INITIALIZATION ---
        // This now waits for an explicit signal from the main lifecycle manager
        // instead of relying on a fragile frame counter.
        if (!this._initialUpdateComplete && game.mapShine.systemsReady) {
            console.log("Map Shine | ParticleLayer executing safe initial setup (triggered by systemsReady flag).");
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
            this.updateFromConfig(game.mapShine.profileManager.activeConfig);
            this._initialUpdateComplete = true;
        }

        // --- CONTINUOUS UPDATE ---
        // Only run the particle simulation if the one-time setup is complete.
        if (this._initialUpdateComplete) {
            // The PIXI ticker's deltaTime is in frames; divide by FPS to get seconds.
            const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
            // The PIXI ticker's deltaTime is in frames; divide by FPS to get seconds.
            const deltaInSeconds = (deltaTime / canvas.app.ticker.FPS) * timeFactor;
            if (game.mapShine.fireWindManager) game.mapShine.fireWindManager.update(deltaInSeconds);
            game.mapShine.particleManager.update(deltaInSeconds);
        }
    }

    async updateEffectTargets(targets) {
        if (game.mapShine.particleManager) {
            // This method internally fetches the latest config to decide what to create.
            game.mapShine.particleManager.updateEffectTargets(targets);
        }
    }

    async updateFromConfig(config, options = {}) {
        if (game.mapShine.particleManager) {
            // Always update the live properties (like blend mode, visibility, etc.)
            // of any emitters that already exist. This is non-destructive.
            game.mapShine.particleManager.updateFromConfig(config);

            // ONLY if this is a full update (not just a time change),
            // re-evaluate which emitters should exist. This is the destructive part.
            if (!options?.timeOnly) {
                const targets = game.mapShine.effectTargetManager.targets;
                if (targets) {
                    this.updateEffectTargets(targets);
                }
            }
        }
    }
}

// =================================================================================
// SECTION 4: GENERIC FILTERS
// =================================================================================
// Description: Reusable PIXI.Filter classes used by various layers or as
//              global post-processing effects.
// ---------------------------------------------------------------------------------

class NoisePatternFilter extends PIXI.Filter {
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
                        // Apply animation directly to the world coordinates to ensure stability.
                        // A multiplier is used to make the UI speed value more intuitive.
                        world_coord.x += u_time * u_speed * 10.0;

                        // Use a large divisor to keep the user-facing scale value in a reasonable range (e.g., 0.1-10)
                        uv = world_coord * u_scale / 1000.0;
                    } else {
                        // Original screen-space calculation
                        vec2 screen_pixel_coord = vTextureCoord * u_resolution;
                        vec2 screen_center_pixel_coord = u_resolution * 0.5;
                        uv = (screen_pixel_coord - screen_center_pixel_coord) * u_scale / 30.0;
                        uv.x += u_time * u_speed;
                    }
                    
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
            u_evolution: options.u_evolution ?? 0.0,
            u_isWorldSpace: options.u_isWorldSpace ?? false,
            u_camera_offset: options.u_camera_offset ?? [0, 0],
            u_view_size: options.u_view_size ?? [0, 0],
        };
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, newOptions);
    }
}

class ParallaxMaskFilter extends PIXI.Filter {
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

            uniform sampler2D uMask;
            uniform float uParallax;
            uniform vec2 uCameraOffset;
            uniform vec2 uViewSize;

            void main() {
                vec2 parallaxTexCoord = vScreenCoord;
                if (uParallax > 0.0 && uViewSize.y > 0.0) {
                    vec2 normalized_camera_offset_pixels = uCameraOffset / uViewSize;
                    parallaxTexCoord = vScreenCoord - (normalized_camera_offset_pixels * uParallax);
                }
                gl_FragColor = texture2D(uMask, parallaxTexCoord);
            }
        `;
        super(vertexSrc, fragmentSrc, {
            uMask: PIXI.Texture.EMPTY,
            uParallax: options.parallax ?? 0.0,
            uCameraOffset: [0, 0],
            uViewSize: [1, 1]
        });
    }
}

class LightingMaskFilter extends PIXI.Filter {
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
            uInvert: options.invert ?? false,
        });
    }
}

class ColorCorrectionFilter extends PIXI.Filter {
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

                uniform bool uStructuralSplitHighlightsEnabled;
                uniform sampler2D uStructuralSplitHighlightsMask;

                uniform float uIntensity;
                uniform vec4 uSceneRectNorm;


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
                    // Use a curve that has maximum effect on mid-tones and falls off towards black and white
                    // to prevent clipping and crushing blacks. The curve is x * (1.0 - x).
                    const float STRENGTH = 0.5; // Controls the overall strength of the effect.
                    color.r += temp * (color.r * (1.0 - color.r)) * STRENGTH;
                    color.b -= temp * (color.b * (1.0 - color.b)) * STRENGTH;
                    color.g += green_tint * (color.g * (1.0 - color.g)) * STRENGTH;
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

                    vec3 final_rgb = mix(uncorrectedColor, workingColor, uIntensity);

                    if (uMaskEnabled) {
                        float maskValue = texture2D(uMaskTexture, vTextureCoord).r;
                        final_rgb = mix(uncorrectedColor, final_rgb, maskValue);
                    }
                    
                    vec2 sceneMin = uSceneRectNorm.xy;
                    vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
                    bool isInsideScene = vTextureCoord.x >= sceneMin.x && vTextureCoord.x < sceneMax.x &&
                                         vTextureCoord.y >= sceneMin.y && vTextureCoord.y < sceneMax.y;

                    if (isInsideScene) {
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
                            // The highlight masks already have parallax baked in from their respective layers.
                            // We just need to sample them with the standard screen coordinate.
                            if (uStructuralSplitHighlightsEnabled) {
                                vec3 splitLight = texture2D(uStructuralSplitHighlightsMask, vTextureCoord).rgb;
                                if (uStructuralOutdoorsMaskEnabled) {
                                    splitLight *= (1.0 - texture2D(uStructuralOutdoorsMask, vTextureCoord).r);
                                }
                                vec3 highlightBoost = splitLight * uStructuralHighlightsBrightness;
                                final_rgb *= (vec3(1.0) + highlightBoost);
                            } else {
                                float lightAmount = texture2D(uStructuralHighlightsMask, vTextureCoord).r;
                                if (uStructuralOutdoorsMaskEnabled) {
                                    lightAmount *= (1.0 - texture2D(uStructuralOutdoorsMask, vTextureCoord).r);
                                }
                                final_rgb *= (1.0 + uStructuralHighlightsBrightness * lightAmount);
                            }
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
            uSaturation: 1.0,
            uBrightness: 0.0,
            uContrast: 1.0,
            uExposure: 0.0,
            uGamma: 1.0,
            uInBlack: 0.0,
            uInWhite: 1.0,
            uTemperature: 0.0,
            uWbTint: 0.0,
            uInvert: false,
            uTintColor: [1.0, 1.0, 1.0],
            uTintAmount: 0.0,
            uMaskTexture: PIXI.Texture.EMPTY,
            uMaskEnabled: false,
            uSelectiveEnabled: false,
            uSelectiveColor: [1.0, 0.0, 0.0],
            uSelectiveHueRange: 0.1,
            uSelectiveSatRange: 0.4,
            uAmbientCompositeTexture: PIXI.Texture.EMPTY,
            uAmbientCompositeEnabled: false,
            uAmbientCompositeBlendMode: PIXI.BLEND_MODES.NORMAL,
            uAmbientIlluminationMask: PIXI.Texture.EMPTY,
            uAmbientIlluminationMaskEnabled: false,
            uCloudHighlightsEnabled: false,
            uCloudHighlightsMask: PIXI.Texture.EMPTY,
            uCloudHighlightsBrightness: 0.0,
            uCanopyHighlightsEnabled: false,
            uCanopyHighlightsMask: PIXI.Texture.EMPTY,
            uCanopyHighlightsBrightness: 0.0,
            uCanopyOutdoorsMask: PIXI.Texture.EMPTY,
            uCanopyOutdoorsMaskEnabled: false,
            uStructuralHighlightsEnabled: false,
            uStructuralHighlightsMask: PIXI.Texture.EMPTY,
            uStructuralHighlightsBrightness: 0.0,
            uStructuralOutdoorsMask: PIXI.Texture.EMPTY,
            uStructuralOutdoorsMaskEnabled: false,
            uStructuralSplitHighlightsEnabled: false,
            uStructuralSplitHighlightsMask: PIXI.Texture.EMPTY,
            uSceneRectNorm: [0, 0, 1, 1],
            uIntensity: options.intensity ?? 1.0,
        });
    }
}

class VignetteFilter extends PIXI.Filter {
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
            u_softness: options.softness ?? 0.5,
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
}

class LensDistortionFilter extends PIXI.Filter {
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
            u_amount: options.amount ?? 0.0,
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
}

class ChromaticAberrationFilter extends PIXI.Filter {
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
            u_amount: options.amount ?? 0.0,
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
}

class ParticleRgbSplitFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
                precision mediump float;
                varying vec2 vTextureCoord;

                uniform sampler2D uSampler;
                uniform float uAmount;
                uniform vec2 uTexelSize;

                void main(void) {
                    if (uAmount == 0.0) {
                        gl_FragColor = texture2D(uSampler, vTextureCoord);
                        return;
                    }
                    
                    vec2 offset = vec2(uAmount * uTexelSize.x, 0.0);
                    
                    float r = texture2D(uSampler, vTextureCoord - offset).r;
                    float g = texture2D(uSampler, vTextureCoord).g;
                    float b = texture2D(uSampler, vTextureCoord + offset).b;
                    float a = texture2D(uSampler, vTextureCoord).a;

                    gl_FragColor = vec4(r, g, b, a);
                }
            `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uAmount: options.amount ?? 0.0,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}

class PrismFilter extends PIXI.Filter {
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
            uIntensity: options.intensity ?? 5.0,
            uAngleRad: (options.angle ?? 45.0) * (Math.PI / 180.0),
            uThreshold: options.threshold ?? 0.85,
            uSoftness: options.softness ?? 0.1,
            uDistortionStrength: options.distortionStrength ?? 2.0,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}

// =================================================================================
// SECTION 5: EFFECT LAYERS & THEIR DEDICATED COMPONENTS
// =================================================================================
// Description: The main CanvasLayer implementations and any PIXI.Filters
//              that are tightly coupled to a single layer.
// ---------------------------------------------------------------------------------

/**
 * An abstract base class for layers that generate a single, combined mask texture
 * from multiple source images (_Dust, _Canopy, etc.) found on the map.
 *
 * This class handles the common logic for:
 * - Identifying and loading source mask textures based on a suffix.
 * - Rendering source sprites into a combined RenderTexture.
 * - Caching the RenderTexture and only re-rendering it when necessary (on pan or target changes).
 * - Managing the lifecycle of all related PIXI objects.
 */
class MaskedEffectLayer extends foundry.canvas.layers.CanvasLayer {
    constructor(options) {
        super();
        this.options = options;

        // Properties managed by this base class
        this.maskContainer = null;
        this.combinedMaskTexture = null;
        this.maskSprites = new Map();

        this._needsMaskUpdate = true;
        this._destroyed = false;

        // Initialize bounds safely - will be updated in _draw if needed
        this.bounds = this._getBounds();

        // Bound listeners, defined in _draw
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
        const activeMaskSprites = Array.from(this.maskSprites.values()).filter(s => s.texture?.valid);
        if (activeMaskSprites.length === 0) return null;

        // Get bounds in world/canvas space
        let union = activeMaskSprites[0].getBounds().clone();
        for (let i = 1; i < activeMaskSprites.length; i++) {
            union.enlarge(activeMaskSprites[i].getBounds());
        }
        return union;
    }

    async _draw(options) {
        this._destroyed = false;
        this._needsMaskUpdate = true;

        // Update bounds now that canvas is ready
        this.bounds = this._getBounds();


        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        this._onPanBound = this._onPan.bind(this);

        const renderer = canvas.app.renderer;
        this.maskContainer = new PIXI.Container();
        this.combinedMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height,
        });

        // Add listeners
        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);
        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    /**
     * @override
     */
    async _tearDown(options) {
        if (this._destroyed) return;
        this._destroyed = true;

        // Remove listeners
        if (this._onAnimateBound) canvas.app.ticker.remove(this._onAnimateBound);
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);
        if (this._onPanBound) Hooks.off('canvasPan', this._onPanBound);

        // Destroy PIXI objects
        this.combinedMaskTexture?.destroy(true);
        this.maskContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
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
        if (this._destroyed) return;

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
        if (!this.maskContainer || !this.combinedMaskTexture) return;
        // This is the correct way to bake world-space objects into a screen-aligned texture.
        // We provide the stage's transform matrix to map the world-space sprites
        // into the coordinate system of the screen-sized render texture.
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
        if (!this.maskContainer) return;

        const maskSuffix = this.options.maskSuffix;
        if (!maskSuffix) {
            console.warn("MaskedEffectLayer | No 'maskSuffix' provided in options.");
            return;
        }

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            const texturePath = targetData?.[maskSuffix];
            if (!texturePath) continue;

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

        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }
}

// --- 5.1. Background Layer (Simple passthrough for base textures) ---

class BackgroundLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();

        this.effectSprites = new Map();
        this._onResizeBound = this._onResize.bind(this);
    }

    async _draw(options) {
        console.log("BackgroundLayer | Drawing layer.");

        this.container = new PIXI.Container();
        this.addChild(this.container);

        window.addEventListener('resize', this._onResizeBound);
    }

    async updateEffectTargets(targets) {
        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {

            if (!targetData?.baseTexturePath) continue;

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

        if (!sprite.texture.valid || !rect) return;

        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
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
        window.removeEventListener('resize', this._onResizeBound);

        // The container holds all the effect sprites. Destroying it will destroy them.
        this.container?.destroy({
            children: true
        });

        // Clear the map and nullify references
        this.effectSprites.clear();
        this.container = null;
    }
}

// --- 5.2. Metallic Shine ---

class ShinePatternFilter extends PIXI.Filter {
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
            uniform float u_parallaxJitter;
            uniform float u_parallaxJitterSpeed;
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

            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                        mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
            }

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
                
                // Add parallax jitter if enabled
                if (u_parallaxJitter > 0.0) {
                    float jitter_time = u_time * u_parallaxJitterSpeed * 0.1;
                    vec2 jitter_noise_coord = world_coord * 0.05; // Use world coordinates for stable noise
                    float jitter_x = (noise(jitter_noise_coord + jitter_time) - 0.5) * 2.0;
                    float jitter_y = (noise(jitter_noise_coord - jitter_time + vec2(37.3, -84.1)) - 0.5) * 2.0;
                    mixed_coords += vec2(jitter_x, jitter_y) * u_parallaxJitter;
                }

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
}

class MetallicShineFilter extends PIXI.Filter {
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
            uniform sampler2D uStructuralMask;
            uniform sampler2D uOutdoorsMask;

            // Toggles
            uniform bool uUseStructuralMask;
            uniform bool uUseOutdoorsMask;

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
                float baseSpecularLuminance = dot(specularColor.rgb, lum_weights);
                float finalSpecularLuminance = baseSpecularLuminance;

                // Conditionally apply structural shadows.
                if (uUseStructuralMask) {
                    float structuralLight = texture2D(uStructuralMask, vScreenCoord).r;
                    
                    if (uUseOutdoorsMask) {
                        float outdoorsAmount = texture2D(uOutdoorsMask, vScreenCoord).r;
                        // When outdoors (outdoorsAmount=1), use the original specular.
                        // When indoors (outdoorsAmount=0), use the specular multiplied by the structural light.
                        finalSpecularLuminance = mix(baseSpecularLuminance * structuralLight, baseSpecularLuminance, outdoorsAmount);
                    } else {
                        // If no outdoors mask is present, apply shadows everywhere.
                        finalSpecularLuminance = baseSpecularLuminance * structuralLight;
                    }
                }

                if (specularColor.a < 0.1 || finalSpecularLuminance < 0.01) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                float shinePatternIntensity = texture2D(uShinePatternMap, vScreenCoord).r;
                vec3 workingColor = vec3(shinePatternIntensity * uBoost);

                if (uCCEnabled) {
                    if (uInWhite > uInBlack) workingColor = (workingColor - uInBlack) / (uInWhite - uInBlack);
                    workingColor *= pow(2.0, uExposure);
                    if (uGamma > 0.0) workingColor = pow(workingColor, vec3(1.0 / uGamma));
                    workingColor += uBrightness;
                    workingColor = (workingColor - 0.5) * uContrast + 0.5;
                    float luminance = dot(workingColor, lum_weights);
                    workingColor = mix(vec3(luminance), workingColor, uSaturation);
                    workingColor = mix(workingColor, uTintColor, uTintAmount);
                }

                vec3 finalColor = workingColor * finalSpecularLuminance;
                finalColor = clamp(finalColor, 0.0, 1.0);
                gl_FragColor = vec4(finalColor, shinePatternIntensity * specularColor.a);
            }
        `;

        super(vertexSrc, fragmentSrc, {
            uShinePatternMap: options.shinePatternTexture,
            uStructuralMask: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            uUseStructuralMask: false,
            uUseOutdoorsMask: false,
            uBoost: options.boost ?? 1.0,

            uCCEnabled: options.uCCEnabled ?? true,
            uSaturation: options.uSaturation ?? 1.0,
            uBrightness: options.uBrightness ?? 0.0,
            uContrast: options.uContrast ?? 1.0,
            uExposure: options.uExposure ?? 0.0,
            uGamma: options.uGamma ?? 1.0,
            uInBlack: options.uInBlack ?? 0.0,
            uInWhite: options.uInWhite ?? 1.0,
            uTintColor: options.uTintColor ?? [1.0, 1.0, 1.0],
            uTintAmount: options.uTintAmount ?? 0.0,
        });
    }
}

class ThresholdFilter extends PIXI.Filter {
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
}

class StarburstFilter extends PIXI.Filter {
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
            u_angle_rad: (options.angle ?? 0.0) * (Math.PI / 180.0),
            u_points: options.points ?? 5,
            u_size: options.size ?? 80.0,
            u_falloff: options.falloff ?? 4.0,
            u_texel_size: [1.0 / (window.innerWidth * window.devicePixelRatio), 1.0 / (window.innerHeight * window.devicePixelRatio)]
        });
    }
}

class MetallicShineLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        // --- Self-Contained Pipeline Objects ---
        this.patternTexture = null;
        this.patternSourceSprite = null;
        this.shinePatternFilter = null;
        this.noiseTextureManager = null;

        this.sourceContainer = null;
        this.effectSprites = new Map();
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

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('baseShine', 'Metallic Shine', `
            ${DebuggerUIBuilder._createTextureInputHTML('specular', 'Specular/Reflect Map')}
            <p class="description-text">A grayscale texture where white areas reflect the animated pattern and black areas reflect nothing. This is the primary mask for this effect.</p>
            <details id="details-baseShine-animation"><summary><span class="accordion-toggle"></span><strong>Animation & Compositing</strong></summary>
                <div>
                ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.globalIntensity', 'Global Intensity', 0, 10, 0.1, 'Controls the overall brightness of the shine effect.')}
                ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.parallaxAmount', 'Parallax Amount', 0, 1, 0.01, "Controls shine movement with the camera. A value of 1 pins the effect to the camera, a low value means higher level of animation/movement.")}
                ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.parallaxJitter', 'Parallax Jitter', 0, 2.0, 0.01, 'Adds a high-frequency shimmer to the parallax effect based on camera position.')}
                ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.parallaxJitterSpeed', 'Jitter Speed', 0, 20, 0.1, 'The animation speed of the parallax jitter noise.')}
                ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.updateFrequency', 'Update Frequency (Frames)', 0, 60, 1, 'How often the pattern updates. Higher values improve performance but make animation less smooth. 0 = every frame.')}
                </div>
            </details>
            <details id="details-baseShine-pattern"><summary><span class="accordion-toggle"></span><strong>Pattern Generator</strong></summary>
                <div>
                    ${DebuggerUIBuilder._createSelectHTML('baseShine.patternType', 'Type', {'Stripes': 'stripes', 'Checkerboard': 'checkerboard'}, 'The base procedural shape of the shine.')}
                    <div id="pattern-stripes-controls">
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.shared.patternScale', 'Pattern Scale', 0.01, 4, 0.01, 'Overall zoom level of the stripe patterns.')}
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.shared.maxBrightness', 'Max Brightness', 0, 2, 0.01, 'A cap on the brightness of the generated pattern.')}
                        <details id="details-baseShine-pattern-s1"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.pattern.stripes1.enabled', 'Stripe Layer A', true)}</div></summary>
                            <div>
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.intensity', 'Intensity', 0, 2, 0.05, 'Brightness of this individual stripe layer.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.speed', 'Speed', -0.1, 0.1, 0.001, 'How fast the sub-stripes animate within the bands.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.angle', 'Angle', 0, 360, 1)}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.sharpness', 'Edge Falloff', 0.1, 8, 0.1, 'How soft or hard the edges of the main bands are.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.bandDensity', 'Band Density', 1, 64, 0.5, 'How many main bands appear on screen.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.bandWidth', 'Band Width', 0.1, 1, 0.01, 'The width of the main bands, as a fraction of the space between them.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1, 'The maximum number of smaller stripes that can appear inside a main band.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5, 'The sharpness of the smaller, internal stripes.')}
                            </div>
                        </details>     
                        <details id="details-baseShine-pattern-s2"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.pattern.stripes2.enabled', 'Stripe Layer B', true)}</div></summary>
                            <div>
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.intensity', 'Intensity', 0, 2, 0.05, 'Brightness of this individual stripe layer.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.speed', 'Speed', -0.1, 0.1, 0.001, 'How fast the sub-stripes animate within the bands.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.angle', 'Angle', 0, 360, 1)}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.sharpness', 'Edge Falloff', 0.1, 8, 0.1, 'How soft or hard the edges of the main bands are.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.bandDensity', 'Band Density', 1, 64, 0.5, 'How many main bands appear on screen.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.bandWidth', 'Band Width', 0.1, 1, 0.01, 'The width of the main bands, as a fraction of the space between them.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1, 'The maximum number of smaller stripes that can appear inside a main band.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5, 'The sharpness of the smaller, internal stripes.')}
                            </div>
                        </details>
                    </div>
                    <div id="pattern-checkerboard-controls" style="display: none;">
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.checkerboard.gridSize', 'Grid Size', 2, 64, 2)}
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.checkerboard.brightness1', 'Brightness 1', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.checkerboard.brightness2', 'Brightness 2', 0, 1, 0.01)}
                    </div>
                </div>
            </details>
            <details id="details-baseShine-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.noise.enabled', 'Pattern Noise Mask', true)}</div></summary>
                <div>
                    <p class="description-text">Applies a noise pattern over the stripes to add texture and break up the uniformity.</p>
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.speed', 'Speed', -0.5, 0.5, 0.001)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.scale', 'Scale', 0.1, 10, 0.1)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.threshold', 'Threshold', 0, 1, 0.01, 'Cuts off noise values below this, creating harder-edged noise.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.brightness', 'Brightness', -1, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.contrast', 'Contrast', 0, 5, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.softness', 'Softness', 0.01, 1, 0.01, 'How gradual the transition is at the threshold edge.')}
                </div>
            </details>
            <details id="details-baseShine-colorCorrection">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.colorCorrection.enabled', 'Shine Color Correction', true)}</div>
                </summary>
                <div>
                    <p class="description-text">Fine-tunes the color and intensity of the metallic reflection itself, allowing for deep blacks and brilliant highlights.</p>
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.exposure', 'Exposure', -2, 2, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05)}
                    <details id="details-baseShine-cc-levels">
                        <summary><span class="accordion-toggle"></span><strong>Levels</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01)}
                        </div>
                    </details>
                    <details id="details-baseShine-cc-tint">
                        <summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createColorPickerHTML('baseShine.colorCorrection.tint.color', 'Tint Color')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
            <details id="details-baseShine-bloom"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.shineBloom.enabled', 'Shine Bloom Effect', true)}</div></summary>
                <div>
                    <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;">
                        <strong style="color: #ffddaa;">PERFORMANCE WARNING:</strong> This effect can be demanding. Lowering 'Quality' can improve performance significantly.
                    </div>
                    <p class="description-text">Adds a soft glow to the brightest parts of the shine effect.</p>
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.threshold', 'Threshold', 0, 1, 0.01, 'Only areas brighter than this will bloom.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.brightness', 'Brightness', 0, 5, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.blur', 'Blur Amount', 0, 20, 0.5)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.quality', 'Quality', 1, 15, 1, 'Number of blur samples. Higher is smoother but much slower.')}
                    <details id="details-baseShine-rgbSplit"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.rgbSplit.enabled', 'RGB Split', true)}</div></summary>
                        <div>${DebuggerUIBuilder._createSliderHTML('baseShine.rgbSplit.amount', 'Amount', 0, 10, 0.1, 'Adds a chromatic aberration effect to the bloom.')}</div>
                    </details>
                </div>
            </details>
            <details id="details-baseShine-starburst"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.starburst.enabled', 'Shine Starburst Effect', true)}</div></summary>
                <div>
                    <div class="warning-box">
                        <strong style="color: #ffaaaa;">EXTREME PERFORMANCE WARNING:</strong> This effect is VERY performance-heavy, especially with a high 'Ray Length' or many 'Points'. Use with caution!
                    </div>
                    <p class="description-text">Adds star-like rays that emanate from the brightest parts of the shine.</p>
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.threshold', 'Threshold', 0, 1, 0.01, 'Only areas brighter than this will generate rays.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.intensity', 'Intensity', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.points', 'Points', 2, 16, 1)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.angle', 'Angle', 0, 360, 1)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.size', 'Ray Length', 1, 200, 1)}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.falloff', 'Ray Falloff', 0.5, 8, 0.1, 'How quickly the rays fade out with distance. Higher values mean a shorter, faster fade.')}
                    ${DebuggerUIBuilder._createSelectHTML('baseShine.starburst.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                </div>
            </details>
        `);
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

        // --- Setup for Pass 1: Internal Pattern Generation ---
        this.patternTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.patternSourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.patternSourceSprite.width = renderer.screen.width;
        this.patternSourceSprite.height = renderer.screen.height;
        this.noiseTextureManager = new NoiseTextureManager(renderer, 'baseShine.noise');

        try {
            this.shinePatternFilter = new ShinePatternFilter({});
            this.patternSourceSprite.filters = [this.shinePatternFilter];
        } catch (e) {
            console.error("MapShine | Failed to create ShinePatternFilter.", e);
            baseErrors.push('ShinePatternFilter');
        }

        // --- Setup for Pass 2: Shine Rendering ---
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
            baseErrors.push('MetallicShineFilter');
        }

        systemStatus.update('shaders', 'baseShine', {
            state: baseErrors.length === 0 ? 'ok' : 'error',
            message: baseErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${baseErrors.join(', ')}`
        });

        // --- Setup for Bloom & Starburst Filters ---
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

        // Final output sprites
        this.shineSprite = new PIXI.Sprite(this.shinePassTexture);
        this.bloomSprite = new PIXI.Sprite(this.shinePassTexture);
        this.starburstSprite = new PIXI.Sprite(this.shinePassTexture);

        this.bloomSprite.filters = this.bloomFilters;
        this.starburstSprite.filters = [this.starburstFilter];

        this.addChild(this.shineSprite, this.bloomSprite, this.starburstSprite);

        // Immediately configure this layer from the scene settings.
        this.updateFromConfig(game.mapShine.profileManager.activeConfig);

        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
    }

    _onAnimate(deltaTime) {
        if (this._destroyed) return;
        this._framesSinceLoad++;
    
        this.visible = false;
    
        const config = game.mapShine.profileManager.activeConfig;
        if (!config.enabled || !config.baseShine.enabled || !this.shineFilter || !this.shinePatternFilter) return;
    
        const hasActiveTargets = this.effectSprites.size > 0 && Array.from(this.effectSprites.values()).some(s => s.texture.valid);
        if (!hasActiveTargets) return;
    
        if (this._framesSinceLoad < 5) return;
    
        this.visible = true;
    
        // --- Pass 1: Generate the Shine Pattern ---
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.noiseTextureManager.update(deltaTime * timeFactor, canvas.app.renderer);
        const uPattern = this.shinePatternFilter.uniforms;
        uPattern.u_time = (uPattern.u_time || 0) + (deltaTime * timeFactor);
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
    
        const structuralLayer = canvas.layers.find(l => l instanceof StructuralShadowsLayer);
        const cleanStructuralMask = structuralLayer?.getCleanStructuralLightMask();
        const outdoorsMask = structuralLayer?.outdoorsMaskTexture;
        
        // Check if all required components are available and active.
        if (this.shineFilter && structuralLayer?.visible && cleanStructuralMask?.valid) {
            this.shineFilter.uniforms.uStructuralMask = cleanStructuralMask;
            this.shineFilter.uniforms.uUseStructuralMask = true;
    
            // Also pass the outdoors mask if it's available.
            if (outdoorsMask?.valid) {
                this.shineFilter.uniforms.uOutdoorsMask = outdoorsMask;
                this.shineFilter.uniforms.uUseOutdoorsMask = true;
            } else {
                 this.shineFilter.uniforms.uUseOutdoorsMask = false;
            }
    
        } else if (this.shineFilter) {
            this.shineFilter.uniforms.uUseStructuralMask = false;
            this.shineFilter.uniforms.uUseOutdoorsMask = false;
        }
    
        // --- Pass 2: Render the Final Shine using the generated pattern ---
        canvas.app.renderer.render(this.sourceContainer, {
            renderTexture: this.shinePassTexture,
            clear: true,
            transform: canvas.stage.transform.worldTransform,
        });
    
        // Position the final output sprites
        [this.shineSprite, this.bloomSprite, this.starburstSprite].forEach(sprite => {
            sprite.position.copyFrom(topLeft);
            sprite.width = screen.width / stage.scale.x;
            sprite.height = screen.height / stage.scale.y;
        });
    }

    async updateEffectTargets(targets) {
        if (!this.sourceContainer) return;

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.specular) continue;
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
        if (!this.shineFilter || !this.shinePatternFilter || !this.noiseTextureManager) return;

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
        uPattern.u_parallaxJitter = anim.parallaxJitter;
        // The timeFactor is applied to the time accumulator in the animate loop, so we don't apply it here.
        uPattern.u_parallaxJitterSpeed = anim.parallaxJitterSpeed;
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
            uStarburst.u_angle_rad = starburstConfig.angle * (Math.PI / 180.0);
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
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
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
            this.starburstFilter.uniforms.u_texel_size = [1.0 / renderer.screen.width, 1.0 / renderer.screen.height];
        }

        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }

    async _tearDown(options) {
        console.log(`MetallicShineLayer | Tearing down FINAL production version.`);
        if (this._destroyed) return;
        this._destroyed = true;

        if (this._onAnimateBound) canvas.app.ticker.remove(this._onAnimateBound);
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);

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
        this.bloomFilters.forEach(f => f.destroy());
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
}

// --- 5.4. Cloud Shadows ---

class CloudShadowsFilter extends PIXI.Filter {
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
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [0, 0],
            u_windDirection: [0.01, 0.01],
            u_noise_scale: 0.1,
            u_noise_octaves: 5,
            u_noise_persistence: 0.5,
            u_noise_lacunarity: 2.5,
            u_shading_threshold: 1.0,
            u_shading_softness: 0.2,
            u_shading_brightness: 0.51,
            u_shading_contrast: 1.0,
            u_shading_gamma: 1.0,
            u_shadowIntensity: 0.5,
            u_outputHighlightMask: false,
            uIlluminationBuffer: PIXI.Texture.EMPTY,
            u_illum_enabled: false,
            u_illum_intensity: 0.8,
            u_illum_luminanceThreshold: 0.1,
            u_illum_softness: 0.2,
        });
    }
}

class CloudShadowsLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'outdoors'
        });

        this.cloudFilter = null;
        this.blurredMaskTexture = null;
        this.maskBlurFilter = null;
        this.blurSourceSprite = null;

        this._patternGeneratorSprite = null;
        this.cloudShadowTexture = null;
        this.cloudHighlightMaskTexture = null;
        this.effectSprite = null;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('cloudShadows', 'Cloud Shadows', `
                ${DebuggerUIBuilder._createTextureInputHTML('outdoors', 'Outdoor Mask (_Outdoors)')}
                <p class="description-text">Simulates moving cloud shadows within the masked areas.</p>
                ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shadowIntensity', 'Global Intensity', 0, 2, 0.05)}
                ${DebuggerUIBuilder._createSliderHTML('cloudShadows.maskBlur', 'Mask Blur', 0, 50, 1)}
                <details><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.wind.angle', 'Angle', 0, 360, 1)}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.wind.speed', 'Speed', 0, 0.01, 0.0001)}
                    </div>
                </details>
                <details><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.scale', 'Scale', 0.01, 10, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.octaves', 'Detail Octaves', 1, 8, 1, 'Adds more layers of detail to the noise. Higher is more complex.')}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.persistence', 'Roughness', 0.1, 1, 0.05, 'How much each successive octave contributes. Lower values give a softer look.')}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.lacunarity', 'Detail Frequency', 1.5, 4, 0.1, 'How much detail is added with each octave. Higher values create finer, more complex noise.')}
                    </div>
                </details>
                <details><summary><span class="accordion-toggle"></span><strong>Shading & Appearance</strong></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.threshold', 'Threshold', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.softness', 'Softness', 0.01, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.brightness', 'Brightness', -1, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.contrast', 'Contrast', 0.1, 5, 0.05)}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.gamma', 'Gamma', 0.1, 5, 0.05, 'Adjusts the mid-tones of the shadows. < 1 lightens, > 1 darkens.')}
                    </div>
                </details>
                <details id="details-cloudShadows-illumination">
                    <summary><span class="accordion-toggle"></span>
                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('cloudShadows.illumination.enabled', 'Illumination Masking', true)}</div>
                    </summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.illumination.intensity', 'Reduction Amount', 0, 1, 0.01, 'How much to reduce shadow opacity in fully lit areas.')}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.illumination.luminanceThreshold', 'Light Threshold', 0, 1, 0.01, 'The scene brightness level above which shadows will start to fade.')}
                        ${DebuggerUIBuilder._createSliderHTML('cloudShadows.illumination.softness', 'Edge Softness', 0.01, 1, 0.01, 'How gradual the fade transition is.')}
                    </div>
                </details>
            `);
    }

    getHighlightMaskTexture() {
        return this.cloudHighlightMaskTexture;
    }

    async _draw(options) {
        await super._draw(options); // Sets up the outdoors mask

        const renderer = canvas.app.renderer;

        try {
            this.cloudFilter = new CloudShadowsFilter();
            systemStatus.update('shaders', 'cloudShadows', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to create final CloudShadowsFilter.", e);
            systemStatus.update('shaders', 'cloudShadows', {
                state: 'error',
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
        if (this._destroyed || !this.visible || !this.cloudFilter) return;

        const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);
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
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const u = this.cloudFilter.uniforms;
        u.uOutdoorsMask = finalMask;
        u.u_time += deltaTime * timeFactor;
        this._updateSpriteAndUniformPositions();

        const illumConfig = game.mapShine.profileManager.activeConfig.cloudShadows.illumination;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
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
        if (!this.cloudFilter || !this.effectSprite) return;
        const stage = canvas.stage,
            screen = canvas.app.screen;
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
        if (!this.cloudFilter) return;

        if (this.maskBlurFilter) {
            this.maskBlurFilter.blur = csConfig.maskBlur ?? 0.0;
            this.maskBlurFilter.enabled = this.maskBlurFilter.blur > 0;
            if (this.maskBlurFilter.enabled) this._needsMaskUpdate = true;
        }

        const u = this.cloudFilter.uniforms;
        u.u_shadowIntensity = csConfig.shadowIntensity;

        // The timeFactor is applied to the time accumulator in the animate loop, so we use the raw speed here.
        const windAngleRad = (csConfig.wind.angle ?? 45.0) * (Math.PI / 180);
        const windSpeed = (csConfig.wind.speed ?? 0.01);
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
        super._onResize(); // Handles the main outdoors mask texture
        const renderer = canvas.app.renderer;

        this.blurredMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.cloudShadowTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.cloudHighlightMaskTexture?.resize(renderer.screen.width, renderer.screen.height);

        if (this.effectSprite) this._updateSpriteAndUniformPositions();
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
}

// --- 5.5. Canopy Shadows ---

class CanopyFilter extends PIXI.Filter {
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

                    gl_FragColor = vec4(u_tint * finalAlpha, finalAlpha);
                }
            `;

        super(vertexSrc, fragmentSrc, {
            u_distortionNoise: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            u_shadowIntensity: 0.7,
            u_tint: [0.0, 0.0, 0.0],
            u_distortion_enabled: true,
            u_distortion_intensity: 5.0,
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
}

class CanopyLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'canopy'
        });

        this.canopyFilter = null;
        this.effectSprite = null;
        this.distortionNoiseManager = null;

        // Properties for the second (outdoors) mask
        this.outdoorsMaskContainer = null;
        this.outdoorsMaskTexture = null;
        this.outdoorsMaskSprites = new Map();
        this._needsOutdoorsMaskUpdate = true;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('canopy', 'Canopy Shadows', `
                ${DebuggerUIBuilder._createTextureInputHTML('canopy', 'Canopy Mask (_Canopy)')}
                <p class="description-text">A black and white texture where black areas are shadows and white areas are light. This effect simulates a leafy canopy overhead.</p>
                ${DebuggerUIBuilder._createSliderHTML('canopy.shadowIntensity', 'Shadow Intensity', 0, 2, 0.01)}
                ${DebuggerUIBuilder._createColorPickerHTML('canopy.tint', 'Shadow Tint')}
                <details id="details-canopy-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('canopy.distortion.enabled', 'Shadow Animation', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Animates the shadows using a procedural noise pattern to create a distortion effect.</p>
                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.intensity', 'Intensity', 0, 20, 0.1, 'The overall strength of the distortion effect.')}
                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.speed', 'Speed', -0.5, 0.5, 0.005, 'Horizontal/Vertical scrolling speed of the distortion.')}
                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.scale', 'Scale', 0.01, 2, 0.01, 'Zoom level of the distortion pattern.')}
                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.evolution', 'Evolution', 0, 1, 0.01, 'Internal "morphing" speed of the distortion.')}
                        <details id="details-canopy-distortion-noise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.threshold', 'Threshold', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.brightness', 'Brightness', -1, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.contrast', 'Contrast', 0, 5, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.softness', 'Softness', 0.01, 1, 0.01)}
                            </div>
                        </details>
                    </div>
                </details>
                <details id="details-canopy-illumination">
                    <summary><span class="accordion-toggle"></span>
                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('canopy.illumination.enabled', 'Illumination Masking', true)}</div>
                    </summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                        ${DebuggerUIBuilder._createSliderHTML('canopy.illumination.intensity', 'Reduction Amount', 0, 1, 0.01, 'How much to reduce shadow opacity in fully lit areas.')}
                        ${DebuggerUIBuilder._createSliderHTML('canopy.illumination.luminanceThreshold', 'Light Threshold', 0, 1, 0.01, 'The scene brightness level above which shadows will start to fade.')}
                        ${DebuggerUIBuilder._createSliderHTML('canopy.illumination.softness', 'Edge Softness', 0.01, 1, 0.01, 'How gradual the fade transition is.')}
                    </div>
                </details>
            `);
    }

    async _draw(options) {
        await super._draw(options); // Sets up the PRIMARY (_Canopy) mask

        this._needsOutdoorsMaskUpdate = true;
        this.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        const renderer = canvas.app.renderer;

        // Setup for the SECONDARY (_Outdoors) mask
        this.outdoorsMaskContainer = new PIXI.Container();
        this.outdoorsMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'canopy.distortion', true);

        try {
            this.canopyFilter = new CanopyFilter();
        } catch (e) {
            console.error("MapShine | Failed to create CanopyFilter", e);
        }

        // The effect sprite now uses the primary mask texture from the base class
        this.effectSprite = new PIXI.Sprite(this.getMaskTexture());
        this.effectSprite.filters = this.canopyFilter ? [this.canopyFilter] : [];
        this.addChild(this.effectSprite);

        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    _onPan() {
        super._onPan(); // Flags primary mask for update
        this._needsOutdoorsMaskUpdate = true;
    }

    _onResize() {
        super._onResize(); // Resizes primary mask texture
        const renderer = canvas.app.renderer;
        this.distortionNoiseManager?.resize(renderer);
        this.outdoorsMaskTexture?.resize(renderer.screen.width, renderer.screen.height);

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
        this._needsOutdoorsMaskUpdate = true;
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime); // Renders primary mask if needed
        if (this._destroyed || !this.visible || !this.canopyFilter) return;

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
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        const u = this.canopyFilter.uniforms;

        u.u_distortionNoise = this.distortionNoiseManager.getTexture();
        u.uOutdoorsMask = this.outdoorsMaskTexture;

        const dims = canvas.scene.dimensions;
        u.u_scene_rect = [dims.sceneX, dims.sceneY, dims.sceneWidth, dims.sceneHeight];
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        const illumConfig = game.mapShine.profileManager.activeConfig.canopy.illumination;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
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
        await super.updateEffectTargets(targets); // Handles the primary (_Canopy) mask

        if (!this.outdoorsMaskContainer) return;

        this.outdoorsMaskContainer.removeChildren().forEach(c => c.destroy({
            texture: true,
            baseTexture: true
        }));
        this.outdoorsMaskSprites.clear();

        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
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

        this.outdoorsMaskContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.outdoorsMaskTexture?.destroy(true);
        this.outdoorsMaskSprites.clear();

        this.distortionNoiseManager = null;
        this.canopyFilter = null;
        this.effectSprite = null;
        this.outdoorsMaskContainer = null;
        this.outdoorsMaskTexture = null;

        await super._tearDown(options);
    }
}

class StructuralHighlightRgbSplitFilter extends PIXI.Filter {
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
            uIntensity: options.intensity ?? 2.0,
            uThreshold: options.threshold ?? 0.5,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}

class StructuralShadowsFilter extends PIXI.Filter {
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
                uniform sampler2D uOutdoorsMask;
                uniform sampler2D u_intensityNoise;
                uniform sampler2D uIlluminationBuffer;
    
                // Main Uniforms
                uniform vec3 u_tint;
                uniform float u_shadowIntensity;
                uniform float u_parallax;
                uniform float u_time;
    
                // World & Camera Uniforms
                uniform vec2 u_camera_offset;
                uniform vec2 u_view_size;
    
                // Feature Toggles & Parameters
                uniform bool u_intensityNoise_enabled;
                uniform float u_intensityNoise_amount;
                uniform bool u_illum_enabled;
                uniform float u_illum_intensity;
                uniform float u_illum_luminanceThreshold;
                uniform float u_illum_softness;
                uniform bool u_outputHighlightMask;

                // Cloud Occlusion Toggles & Parameters
                uniform bool u_cloud_enabled;
                uniform float u_cloud_intensity;
                uniform vec2 u_windDirection;
                // Cloud Noise
                uniform float u_noise_scale;
                uniform int u_noise_octaves;
                uniform float u_noise_persistence;
                uniform float u_noise_lacunarity;
                // Cloud Shading
                uniform float u_cloud_shading_threshold;
                uniform float u_cloud_shading_softness;
                uniform float u_cloud_shading_brightness;
                uniform float u_cloud_shading_contrast;
                uniform float u_cloud_shading_gamma;
                uniform float u_cloud_shading_exposure;
                uniform float u_cloud_shading_inBlack;
                uniform float u_cloud_shading_inWhite;
    
                const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                // --- CLOUD NOISE GENERATION FUNCTIONS ---
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
                float applyCloudShading(float value) {
                    if (u_cloud_shading_inWhite > u_cloud_shading_inBlack) {
                        value = (value - u_cloud_shading_inBlack) / (u_cloud_shading_inWhite - u_cloud_shading_inBlack);
                    }
                    value *= pow(2.0, u_cloud_shading_exposure);
                    value += u_cloud_shading_brightness;
                    value = (value - 0.5) * u_cloud_shading_contrast + 0.5;
                    value = smoothstep(u_cloud_shading_threshold, u_cloud_shading_threshold + u_cloud_shading_softness, value);
                    if (u_cloud_shading_gamma > 0.0) {
                        value = pow(value, u_cloud_shading_gamma);
                    }
                    return clamp(value, 0.0, 1.0);
                }
    
                void main() {
                    float indoorMask = 1.0 - texture2D(uOutdoorsMask, vScreenCoord).r;
                    if (indoorMask < 0.01 && !u_outputHighlightMask) {
                        gl_FragColor = vec4(1.0); 
                        return;
                    }
    
                    vec2 parallaxTexCoord = vScreenCoord;
                    if (u_parallax > 0.0 && u_view_size.y > 0.0) {
                        vec2 normalized_camera_offset = u_camera_offset / u_view_size;
                        parallaxTexCoord = vScreenCoord - (normalized_camera_offset * u_parallax);
                    }
                    
                    vec4 structuralTexel = texture2D(uStructuralMask, parallaxTexCoord);
                    
                    if (structuralTexel.a < 0.01) {
                        gl_FragColor = vec4(1.0);
                        return;
                    }

                    float lightAmount = structuralTexel.r;
    
                    if (u_intensityNoise_enabled) {
                        float flicker = texture2D(u_intensityNoise, vScreenCoord).r;
                        lightAmount = min(1.0, lightAmount + flicker * u_intensityNoise_amount);
                    }
                    
                    if (u_cloud_enabled) {
                        vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                        vec2 noise_uv = world_coord / 100.0 * u_noise_scale;
                        noise_uv += u_time * u_windDirection;
                        float rawCloudValue = fbm(noise_uv);
                        float shadedCloudValue = applyCloudShading(rawCloudValue);
                        
                        lightAmount *= (1.0 - shadedCloudValue * u_cloud_intensity);
                    }
                    
                    lightAmount = clamp(lightAmount, 0.0, 1.0);
    
                    if (u_outputHighlightMask) {
                        gl_FragColor = vec4(vec3(lightAmount * indoorMask), 1.0);
                        return;
                    }
    
                    float shadowAmount = 1.0 - lightAmount;
                    shadowAmount *= u_shadowIntensity;
                    
                    if (u_illum_enabled) {
                        float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                        float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                        float reduction = lightMask * u_illum_intensity;
                        shadowAmount *= (1.0 - reduction);
                    }
                    
                    shadowAmount *= indoorMask;
                    shadowAmount = clamp(shadowAmount, 0.0, 1.0);
    
                    vec3 shadowColor = mix(vec3(1.0), u_tint, shadowAmount);
                    gl_FragColor = vec4(shadowColor, 1.0);
                }
            `;

        super(vertexSrc, fragmentSrc, {
            uStructuralMask: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            u_intensityNoise: PIXI.Texture.EMPTY,
            uIlluminationBuffer: PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_tint: [0.0, 0.0, 0.0],
            u_shadowIntensity: 0.6,
            u_parallax: 0.15,
            u_camera_offset: [0, 0],
            u_view_size: [1, 1],
            u_intensityNoise_enabled: true,
            u_cloud_enabled: false,
            u_illum_enabled: false,
            u_outputHighlightMask: false,
            u_intensityNoise_amount: 0.4,
            u_illum_intensity: 0.8,
            u_illum_luminanceThreshold: 0.1,
            u_illum_softness: 0.2,
            
            // Cloud Uniforms
            u_cloud_intensity: 1.0,
            u_windDirection: [0.01, 0.01],
            u_noise_scale: 0.1,
            u_noise_octaves: 5,
            u_noise_persistence: 0.5,
            u_noise_lacunarity: 2.5,
            u_cloud_shading_threshold: 1.0,
            u_cloud_shading_softness: 0.2,
            u_cloud_shading_brightness: 0.51,
            u_cloud_shading_contrast: 1.0,
            u_cloud_shading_gamma: 1.0,
            u_cloud_shading_exposure: 0.0,
            u_cloud_shading_inBlack: 0.0,
            u_cloud_shading_inWhite: 1.0,
            ...options
        });
    }
}

class StructuralShadowsLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'structural'
        });

        this.structuralFilter = null;
        this.effectSprite = null;
        this._patternGeneratorSprite = null;
        this.finalShadowTexture = null;
        this.finalHighlightMaskTexture = null;
        this.intensityNoiseManager = null;
        this.rgbSplitFilter = null;
        this.splitHighlightMaskTexture = null;
        this._splitHighlightSprite = null;
        this.outdoorsMaskContainer = null;
        this.outdoorsMaskTexture = null;
        this.outdoorsMaskSprites = new Map();
        this._needsOutdoorsMaskUpdate = true;

        // New properties for the clean mask generation
        this.cleanStructuralLightMask = null;
        this.parallaxMaskFilter = null;
        this._parallaxMaskSprite = null;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('structuralShadows', 'Structural Shadows', `
                ${DebuggerUIBuilder._createTextureInputHTML('structural', 'Structural Mask (_Structural)')}
                <p class="description-text">A black and white texture for indoor shadows (rafters, beams, etc.). Black areas are shadows, white areas are light. Respects the Outdoor Mask.</p>
                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.shadowIntensity', 'Shadow Intensity', 0, 5, 0.01)}
                ${DebuggerUIBuilder._createColorPickerHTML('structuralShadows.tint', 'Shadow Tint')}
                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.parallax', 'Parallax', 0, 1, 0.001, 'How much the shadows shift relative to camera movement. 0 = fixed to map, 1 = fixed to screen.')}
                <details id="details-structuralShadows-rgbSplit"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.rgbSplit.enabled', 'Highlight RGB Split', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Applies a chromatic aberration effect to the structural highlights.</p>
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.rgbSplit.intensity', 'Intensity', 0, 20, 0.1)}
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.rgbSplit.threshold', 'Threshold', 0, 1, 0.01, 'Only highlights brighter than this will be split.')}
                    </div>
                </details>
                <details id="details-structuralShadows-intensityNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.intensityNoise.enabled', 'Intensity Noise (Flicker)', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Animates the brightness of the shadows using a procedural noise pattern to create a flickering light effect.</p>
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.amount', 'Amount', 0, 1, 0.01, 'The maximum amount to brighten the shadows by.')}
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.speed', 'Speed', -0.5, 0.5, 0.005, 'Horizontal/Vertical scrolling speed of the noise.')}
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.scale', 'Scale', 0.01, 2, 0.01, 'Zoom level of the noise pattern.')}
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.evolution', 'Evolution', 0, 1, 0.01, 'Internal "morphing" speed of the noise.')}
                        <details id="details-structuralShadows-intensityNoise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.threshold', 'Threshold', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.brightness', 'Brightness', -5, 5, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.contrast', 'Contrast', 0, 5, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.softness', 'Softness', 0.01, 1, 0.01)}
                            </div>
                        </details>
                    </div>
                </details>
                <details id="details-structuralShadows-cloudOcclusion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.cloudOcclusion.enabled', 'Cloud Occlusion', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Overlays animated cloud shadows on top of the structural shadows.</p>
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.intensity', 'Cloud Intensity', 0, 2, 0.05)}
                        <details><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.wind.angle', 'Angle', 0, 360, 1)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.wind.speed', 'Speed', 0, 0.01, 0.0001)}
                            </div>
                        </details>
                        <details><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.scale', 'Scale', 0.01, 10, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.octaves', 'Detail Octaves', 1, 8, 1)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.persistence', 'Roughness', 0.1, 1, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.lacunarity', 'Detail Frequency', 1.5, 4, 0.1)}
                            </div>
                        </details>
                        <details open><summary><span class="accordion-toggle"></span><strong>Cloud Shading & Appearance</strong></summary>
                            <div style="padding-left: 15px;">
                                 <details><summary><span class="accordion-toggle"></span><strong>Tone & Gamma</strong></summary><div style="padding-left:15px;">
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.brightness', 'Brightness', -1, 1, 0.01)}
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.contrast', 'Contrast', 0.1, 5, 0.05)}
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.gamma', 'Gamma', 0.1, 5, 0.05)}
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies cloud noise brightness, simulating camera exposure.')}
                                </div></details>
                                <details open><summary><span class="accordion-toggle"></span><strong>Levels & Threshold</strong></summary><div style="padding-left:15px;">
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the cloud noise. Increase to make clouds cover less area.')}
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the cloud noise. Decrease to make clouds cover more area.')}
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.threshold', 'Threshold', 0, 1, 0.01, 'Cuts off noise values below this, creating harder-edged clouds.')}
                                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.softness', 'Softness', 0.01, 1, 0.01, 'How gradual the transition is at the threshold edge.')}
                                </div></details>
                            </div>
                        </details>
                    </div>
                </details>
                <details id="details-structuralShadows-illumination">
                    <summary><span class="accordion-toggle"></span>
                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.illumination.enabled', 'Illumination Masking', true)}</div>
                    </summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.illumination.intensity', 'Reduction Amount', 0, 1, 0.01, 'How much to reduce shadow opacity in fully lit areas.')}
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.illumination.luminanceThreshold', 'Light Threshold', 0, 1, 0.01, 'The scene brightness level above which shadows will start to fade.')}
                        ${DebuggerUIBuilder._createSliderHTML('structuralShadows.illumination.softness', 'Edge Softness', 0.01, 1, 0.01, 'How gradual the fade transition is.')}
                    </div>
                </details>
            `);
    }

    getHighlightMaskTexture() {
        return this.finalHighlightMaskTexture;
    }

    getCleanStructuralLightMask() {
        return this.cleanStructuralLightMask;
    }

    getSplitHighlightMaskTexture() {
        return this.splitHighlightMaskTexture;
    }

    isRgbSplitEnabled() {
        const config = game.mapShine.profileManager.activeConfig;
        if (!config) return false;
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
        this.intensityNoiseManager = new NoiseTextureManager(renderer, 'structuralShadows.intensityNoise', true);
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

        // New setup for clean mask generation
        this.cleanStructuralLightMask = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.parallaxMaskFilter = new ParallaxMaskFilter();
        this._parallaxMaskSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._parallaxMaskSprite.width = screen.width;
        this._parallaxMaskSprite.height = screen.height;
        this._parallaxMaskSprite.filters = [this.parallaxMaskFilter];

        try {
            this.structuralFilter = new StructuralShadowsFilter();
            systemStatus.update('shaders', 'structuralShadows', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to create StructuralShadowsFilter", e);
            systemStatus.update('shaders', 'structuralShadows', {
                state: 'error',
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
        this.finalShadowTexture?.resize(screen.width, screen.height);
        this.finalHighlightMaskTexture?.resize(screen.width, screen.height);
        this.splitHighlightMaskTexture?.resize(screen.width, screen.height);
        this.cleanStructuralLightMask?.resize(screen.width, screen.height);
        if (this._patternGeneratorSprite) {
            this._patternGeneratorSprite.width = screen.width;
            this._patternGeneratorSprite.height = screen.height;
        }
        if (this._splitHighlightSprite) {
            this._splitHighlightSprite.width = screen.width;
            this._splitHighlightSprite.height = screen.height;
        }
        if (this._parallaxMaskSprite) {
            this._parallaxMaskSprite.width = screen.width;
            this._parallaxMaskSprite.height = screen.height;
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
        if (this._destroyed || !this.visible || !this.structuralFilter) return;
        const hasActiveTargets = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);
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
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.intensityNoiseManager.update(deltaTime * timeFactor, renderer);
        if (this._needsOutdoorsMaskUpdate) {
            renderer.render(this.outdoorsMaskContainer, {
                renderTexture: this.outdoorsMaskTexture,
                transform: stage.transform.worldTransform,
                clear: true
            });
            this._needsOutdoorsMaskUpdate = false;
        }

        // --- New Pass: Generate the clean, parallax-only structural mask ---
        if (this.parallaxMaskFilter) {
            const p_u = this.parallaxMaskFilter.uniforms;
            p_u.uMask = this.getMaskTexture();
            p_u.uCameraOffset = [topLeft.x, topLeft.y];
            p_u.uViewSize = viewSize;
            renderer.render(this._parallaxMaskSprite, {
                renderTexture: this.cleanStructuralLightMask,
                clear: true
            });
        }

        // --- Main Pass: Generate the final shadows and highlight mask ---
        const u = this.structuralFilter.uniforms;
        u.uStructuralMask = this.getMaskTexture();
        u.u_intensityNoise = this.intensityNoiseManager.getTexture();
        u.uOutdoorsMask = this.outdoorsMaskTexture;
        u.u_time += deltaTime * timeFactor;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = viewSize;
        const illumConfig = game.mapShine.profileManager.activeConfig.structuralShadows.illumination;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illumTexture = illuminationAPI?.getLightingTexture();
        u.u_illum_enabled = illumConfig.enabled && !!illumTexture?.valid;
        if (u.u_illum_enabled) u.uIlluminationBuffer = illumTexture;
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

        // --- Optional Pass: Generate RGB split highlight mask ---
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
        if (!this.outdoorsMaskContainer) return;
        this.outdoorsMaskContainer.removeChildren().forEach(c => c.destroy({
            texture: true,
            baseTexture: true
        }));
        this.outdoorsMaskSprites.clear();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
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
        if (this.structuralFilter) {
            const u = this.structuralFilter.uniforms;
            const cloudConfig = ssConfig.cloudOcclusion;
            const windAngleRad = (cloudConfig.wind.angle ?? 45.0) * (Math.PI / 180);
            const windSpeed = (cloudConfig.wind.speed ?? 0.001);
            u.u_windDirection = [Math.cos(windAngleRad) * windSpeed, Math.sin(windAngleRad) * windSpeed];
            const noise = cloudConfig.noise;
            u.u_noise_scale = noise.scale;
            u.u_noise_octaves = noise.octaves;
            u.u_noise_persistence = noise.persistence;
            u.u_noise_lacunarity = noise.lacunarity;
            const shading = cloudConfig.shading;
            u.u_cloud_shading_threshold = shading.threshold;
            u.u_cloud_shading_softness = shading.softness;
            u.u_cloud_shading_brightness = shading.brightness;
            u.u_cloud_shading_contrast = shading.contrast;
            u.u_cloud_shading_gamma = shading.gamma;
            u.u_cloud_shading_exposure = shading.exposure;
            u.u_cloud_shading_inBlack = shading.levels.inBlack;
            u.u_cloud_shading_inWhite = shading.levels.inWhite;
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
        if (this.parallaxMaskFilter) {
            this.parallaxMaskFilter.uniforms.uParallax = ssConfig.parallax;
        }
    }

    async _tearDown(options) {
        this.intensityNoiseManager?.destroy();
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
        this.cleanStructuralLightMask?.destroy(true);
        this.parallaxMaskFilter?.destroy();
        this._parallaxMaskSprite?.destroy();
        this.intensityNoiseManager = null;
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
        this.cleanStructuralLightMask = null;
        this.parallaxMaskFilter = null;
        this._parallaxMaskSprite = null;
        await super._tearDown(options);
    }
}

// --- 5.7. Iridescence ---

class IridescenceFilter extends PIXI.Filter {
    static MAX_OCTAVES = 8; // The constant is now defined here.

    constructor(options = {}) {

        const fragmentSrc = `
                precision mediump float;
                varying vec2 vTextureCoord;

                const int MAX_OCTAVES = ${IridescenceFilter.MAX_OCTAVES}; // Injected from JS
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
            uParallax: options.parallax ?? 0.0,
            uCameraOffset: [0, 0],
            uViewSize: [1, 1],
            uResolution: [1, 1],
            // Effect
            uTime: 0.0,
            uSpeed: options.speed ?? 0.0,
            uScale: options.scale ?? 8.0,
            uIntensity: options.intensity ?? 1.0,
            uDistortionStrength: options.distortion?.strength ?? 0.0,
            // FBM
            uOctaves: options.fbm?.octaves ?? 5,
            uPersistence: options.fbm?.persistence ?? 0.5,
            uLacunarity: options.fbm?.lacunarity ?? 2.0,
            uFbmEvolution: options.fbm?.evolution ?? 0.1,
            uFbmBrightness: (options.fbm?.brightness ?? 0.5) - 0.5,
            uFbmContrast: options.fbm?.contrast ?? 1.0,
            // Gradient
            uGradientColors: [],
            uNumColors: 0,
            uHueShift: options.gradient?.hueShift ?? 0.0,
            uGradientBrightness: options.gradient?.brightness ?? 0.0,
            uGradientContrast: options.gradient?.contrast ?? 1.0,
        });
    }
}

class IridescenceLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'iridescence'
        });

        this.iridescenceFilter = null;
        this.effectSprite = null;
        this.distortionNoiseManager = null;
        this._framesSinceLoad = 0;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('iridescence', 'Iridescence', `
                ${DebuggerUIBuilder._createTextureInputHTML('iridescence', 'Iridescence Mask')}
                <p class="description-text">Creates a colorful, oil-slick-like effect within the masked areas.</p>
                ${DebuggerUIBuilder._createSliderHTML('iridescence.intensity', 'Intensity', 0, 2, 0.05)}
                ${DebuggerUIBuilder._createSliderHTML('iridescence.speed', 'Anim Speed', 0, 0.2, 0.001, 'Directional drift speed of the pattern.')}
                ${DebuggerUIBuilder._createSliderHTML('iridescence.scale', 'Pattern Scale', 0.1, 20, 0.1)}
                ${DebuggerUIBuilder._createSliderHTML('iridescence.parallax', 'Parallax', 0, 1, 0.01, '0 = Sticks to Map, 1 = Sticks to Screen')}
                <details id="details-iridescence-fbm"><summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                    <div>
                        <p class="description-text">Controls the procedural noise used to generate the base pattern.</p>
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.evolution', 'Evolution', 0, 1, 0.001, 'Internal "boiling" speed of the pattern.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.octaves', 'Complexity (Octaves)', 1, IridescenceFilter.MAX_OCTAVES, 1, 'Layers of noise. More is more detailed but slower.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.persistence', 'Roughness', 0.1, 1, 0.01, 'Influence of smaller details. Lower is smoother.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.lacunarity', 'Detail Scale', 1.5, 4, 0.05, 'Frequency of smaller details. Higher is finer.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.brightness', 'Noise Brightness', 0, 1, 0.01, 'Adjusts the brightness of the noise before color mapping.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.contrast', 'Noise Contrast', 0, 5, 0.05, 'Adjusts the contrast of the noise before color mapping.')}
                    </div>
                </details>
                <details id="details-iridescence-gradient"><summary><span class="accordion-toggle"></span><strong>Gradient Controls</strong></summary>
                    <div>
                        ${DebuggerUIBuilder._createGradientSelectHTML('iridescence.gradient.name', 'Gradient Preset')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.gradient.hueShift', 'Hue Shift', 0, 1, 0.01, 'Rotates the colors of the gradient.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.gradient.brightness', 'Brightness', -1, 1, 0.01, 'Final brightness adjustment applied to the colored result.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.gradient.contrast', 'Contrast', 0, 4, 0.05, 'Final contrast adjustment applied to the colored result.')}
                    </div>
                </details>
                <details id="details-iridescence-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('iridescence.distortion.enabled', 'Churn/Distortion Effect', true)}</div></summary>
                    <div>
                        <p class="description-text">Uses a second, underlying noise pattern to warp the main iridescence effect.</p>
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.distortion.strength', 'Distortion Strength', 0, 20, 0.1)}
                        <details id="details-iridescence-distortion-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('iridescence.noise.enabled', 'Distortion Noise', true)}</div></summary>
                            <div>
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.speed', 'Speed', -0.5, 0.5, 0.001)}
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.scale', 'Scale', 0.1, 10, 0.1)}
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.threshold', 'Threshold', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.brightness', 'Brightness', -1, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.contrast', 'Contrast', 0, 5, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.softness', 'Softness', 0.01, 1, 0.01)}
                            </div>
                        </details>
                    </div>
                </details>
            `);
    }

    async _draw(options) {
        await super._draw(options);

        this._framesSinceLoad = 0;
        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        const renderer = canvas.app.renderer;

        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'iridescence.noise', true);

        try {
            this.iridescenceFilter = new IridescenceFilter();
            systemStatus.update('shaders', 'iridescence', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to create IridescenceFilter", e);
            systemStatus.update('shaders', 'iridescence', {
                state: 'error',
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
        if (this._destroyed || !this.visible || !this.iridescenceFilter) return;
        this._framesSinceLoad++;

        const hasActiveTargets = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);
        if (!hasActiveTargets || this._framesSinceLoad < 5) {
            this.effectSprite.visible = false;
            return;
        }
        this.effectSprite.visible = true;

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.distortionNoiseManager.update(deltaTime * timeFactor, canvas.app.renderer);

        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        const u = this.iridescenceFilter.uniforms;

        u.uTime += deltaTime * timeFactor;
        u.uDistortionMap = this.distortionNoiseManager.getTexture();
        u.uMaskTexture = this.getMaskTexture(); // Use the getter from the base class

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
            // The timeFactor is applied to the time accumulator in the animate loop, so we use raw speed values here.
            u.uSpeed = iConfig.speed;
            u.uScale = iConfig.scale;
            u.uParallax = iConfig.parallax;
            u.uDistortionStrength = iConfig.distortion.enabled ? iConfig.distortion.strength : 0.0;

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
                u.uGradientColors = gradientData.colors.flatMap(hex => hexToRgbArray(hex));
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
}

// --- 5.8. Ambient & Ground Glow ---

class AmbientColorFilter extends PIXI.Filter {
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
            uSaturation: options.saturation ?? 1.0,
            uBrightness: options.brightness ?? 0.0,
            uContrast: options.contrast ?? 1.0,
            uGamma: options.gamma ?? 1.0,
            uTintColor: options.tintColor ?? [1.0, 1.0, 1.0],
            uTintAmount: options.tintAmount ?? 0.0,

            u_intensity: options.intensity ?? 1.0,

            uTokenMask: PIXI.Texture.EMPTY,
            uTokenMaskEnabled: false,
            uTokenMaskThreshold: options.tokenMaskThreshold ?? 0.1,
        });
    }
}

class AmbientLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.effectSprites = new Map();
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
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('ambient', 'Ambient / Emissive', `
                ${DebuggerUIBuilder._createTextureInputHTML('ambient', 'Emissive Map (_Ambient)')}
                <p class="description-text">Applies color and effects to a texture, often used for glowing areas that are part of the map itself (e.g., lava, magic runes).</p>
                ${DebuggerUIBuilder._createSliderHTML('ambient.intensity', 'Intensity', 0, 5, 0.05, 'Brightness multiplier. Values > 1 are useful for additive blending.')}
                ${DebuggerUIBuilder._createSelectHTML('ambient.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
        
                <details id="details-ambient-tokenMasking">
                    <summary>
                        <span class="accordion-toggle"></span>
                        <div class="summary-control">
                            ${DebuggerUIBuilder._createCheckboxHTML('ambient.tokenMasking.enabled', 'Token Masking', true)}
                        </div>
                    </summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Hides the effect behind tokens. For this to work, you may need to increase this layer's Z-Index (see Rendering Order section) to be above the token layer.</p>
                        ${DebuggerUIBuilder._createSliderHTML('ambient.tokenMasking.threshold', 'Mask Threshold', 0, 1, 0.01)}
                    </div>
                </details>
        
                <details id="details-ambient-masking">
                    <summary>
                        <span class="accordion-toggle"></span>
                        <div class="summary-control">
                            ${DebuggerUIBuilder._createCheckboxHTML('ambient.masking.enabled', 'Luminance Mask', true)}
                        </div>
                    </summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Fades out the effect in dark areas of the scene. Requires scene lighting and the Illumination Buffer module.</p>
                        ${DebuggerUIBuilder._createSliderHTML('ambient.masking.threshold', 'Brightness Threshold', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('ambient.masking.softness', 'Edge Softness', 0.01, 1, 0.01)}
                    </div>
                </details>
        
                <details id="details-ambient-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('ambient.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                        ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                        ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05)}
                        <details id="details-ambient-cc-tint"><summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary><div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createColorPickerHTML('ambient.colorCorrection.tint.color', 'Tint Color')}
                                ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                        </div></details>
                    </div>
                </details>
                <details id="details-ambient-rendering">
                    <summary><span class="accordion-toggle"></span><strong>Rendering Order</strong></summary>
                    <div>
                        <p class="description-text">Controls the draw order of this layer relative to others like lighting and tokens. Higher values are drawn on top.</p>
                        ${DebuggerUIBuilder._createSliderHTML('ambientLayerZIndex', 'Layer Z-Index', 0, 500, 10, 'Default z-indexes: Tokens=100, Lighting=200, Weather=300, Fog=400')}
                        <button id="reload-canvas-btn" style="width: 100%; margin-top: 5px;">Reload Canvas to Apply Z-Index</button>
                    </div>
                </details>
            `);
    }

    async _tearDown(options) {
        this._destroyed = true;
        console.log("AmbientLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);

        this.colorFilter?.destroy();

        super._tearDown(options);
        this.effectSprites.clear();
    }

    _onAnimate() {
        if (this._destroyed || !this.visible) return;

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
                this.removeChildren().forEach(c => c.destroy());
                this.effectSprites.clear();
            }
            return;
        }

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.ambient) continue;
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
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    async updateFromConfig(config) {
        const aConfig = config.ambient;
        const ccConfig = aConfig.colorCorrection;

        this.visible = config.enabled && aConfig.enabled;

        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this.alpha = 1.0;

        for (const sprite of this.effectSprites.values()) {
            sprite.blendMode = aConfig.blendMode;
            sprite.alpha = 1.0;
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
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const shouldBeMasked = this.visible && mConfig.enabled && !!illuminationAPI;
        if (!shouldBeMasked && this.mask) {
            this.mask = null;
        } else if (shouldBeMasked && !this.mask) {

        }
    }
}

class GroundGlowLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.effectSprites = new Map();
        this.maskGenerator = null;
        this.lightingMask = null;
        this.colorFilter = null;
        this._destroyed = false;
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('groundGlow', 'Glow in the Dark', `
                ${DebuggerUIBuilder._createTextureInputHTML('groundGlow', 'Glow Texture')}
                <p class="description-text">Makes a texture appear to glow only in unlit areas of the scene. Requires scene lighting.</p>
                ${DebuggerUIBuilder._createSliderHTML('groundGlow.intensity', 'Intensity', 0, 5, 0.05)}
        
                <details id="details-groundGlow-tokenMasking">
                    <summary>
                        <span class="accordion-toggle"></span>
                        <div class="summary-control">
                            ${DebuggerUIBuilder._createCheckboxHTML('groundGlow.tokenMasking.enabled', 'Token Masking', true)}
                        </div>
                    </summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Hides the effect behind tokens. This layer is already in a high-level group, so it should work by default.</p>
                        ${DebuggerUIBuilder._createSliderHTML('groundGlow.tokenMasking.threshold', 'Mask Threshold', 0, 1, 0.01)}
                    </div>
                </details>
        
                ${DebuggerUIBuilder._createSliderHTML('groundGlow.luminanceThreshold', 'Light Threshold', 0, 1, 0.01, 'The scene brightness level above which the glow will fade out.')}
                ${DebuggerUIBuilder._createSliderHTML('groundGlow.softness', 'Edge Softness', 0.01, 1, 0.01)}
                ${DebuggerUIBuilder._createCheckboxHTML('groundGlow.invert', 'Invert (Glow in Light)', false, 'Makes the effect appear in lit areas instead of dark ones.')}
                ${DebuggerUIBuilder._createSliderHTML('groundGlow.brightness', 'Brightness', 0, 5, 0.05)}
                ${DebuggerUIBuilder._createSliderHTML('groundGlow.saturation', 'Saturation', 0, 5, 0.05)}
            `);
    }

    async _draw(options) {
        console.log("GroundGlowLayer | Drawing layer with improved dependency handling.");
        this.maskGenerator = new LightingMaskGenerator();
        this.colorFilter = new AmbientColorFilter();
        this.container = new PIXI.Container();
        this.addChild(this.container);
        this.lightingMask = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
        // The mask is now applied conditionally in the animate loop, not on draw.
        this.container.mask = null;
        this._onResize();
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound, this);
    }

    async _tearDown(options) {
        this._destroyed = true;
        console.log("GroundGlowLayer | Tearing down layer.");

        if (this.container) {
            this.container.mask = null;
        }

        canvas.app.ticker.remove(this._onAnimateBound, this);
        window.removeEventListener('resize', this._onResizeBound);
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
        if (!this.container) return;

        const config = game.mapShine.profileManager.activeConfig;
        const ggConfig = config.groundGlow;
        // Check only if the effect is enabled in the configuration.
        // The dependency on the illumination API will be handled in the animation loop.
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

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.groundGlow) continue;
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
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _updateMaskTransform() {
        if (!this.lightingMask || !canvas?.stage) return;
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
        if (this._destroyed || !this.visible || !this.container) return;

        const ggConfig = game.mapShine.profileManager.activeConfig.groundGlow;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illuminationTexture = illuminationAPI?.getLightingTexture();

        // If the API or its texture is not ready, disable the mask and wait for the next frame.
        if (!illuminationAPI || !illuminationTexture?.valid) {
            if (this.container.mask) {
                this.container.mask = null;
            }
            return;
        }

        // If we reach here, the API and texture are available. Ensure the mask is active.
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
        if (!this.container || !this.colorFilter) return;
        const ggConfig = config.groundGlow;

        // Visibility is now determined only by config, not API availability.
        this.visible = config.enabled && ggConfig.enabled;
        this.container.visible = this.visible;

        if (!this.visible) return;

        this.container.blendMode = ggConfig.blendMode;
        const u = this.colorFilter.uniforms;
        u.u_intensity = ggConfig.intensity;
        u.uBrightness = ggConfig.brightness - 1.0;
        u.uSaturation = ggConfig.saturation;
        u.uContrast = 1.0;
        u.uGamma = 1.0;
        u.uTintAmount = 0.0;
        u.uTokenMaskThreshold = ggConfig.tokenMasking.threshold;
        for (const sprite of this.effectSprites.values()) {
            sprite.alpha = 1.0;
        }
    }

    _onResize() {
        this.maskGenerator?.resize(canvas.app.screen.width, canvas.app.screen.height);
        this._updateMaskTransform();
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }
}

// --- 5.9. Heat Distortion ---

class HeatDistortionFilter extends PIXI.Filter {
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
            u_intensity: options.intensity ?? 0.01,
        });
    }
}

class HeatDistortionLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        // All properties are initialized to null. No bindings happen here.
        this.heatSourceContainer = null;
        this.combinedMaskTexture = null;
        this.noiseManager = null;
        this.heatSprites = new Map();

        this._needsMaskUpdate = true;
        this._destroyed = false;
        this._framesSinceLoad = 0;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('heatDistortion', 'Heat Distortion', `
                ${DebuggerUIBuilder._createTextureInputHTML('heat', 'Intensity Mask (_Heat)')}
                <p class="description-text">Simulates rising heat waves, distorting the scene behind the masked areas.</p>
                ${DebuggerUIBuilder._createSliderHTML('heatDistortion.intensity', 'Intensity', 0, 0.05, 0.0005)}
                <details id="details-heatDistortion-noise"><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.speed', 'Speed (Wind)', -0.5, 0.5, 0.005, 'Horizontal scrolling speed of the heat waves.')}
                        ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.scale', 'Scale', 0.1, 10, 0.1, 'Zoom level of the heat waves.')}
                        ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.evolution', 'Evolution Speed', 0, 1, 0.01, 'The "boiling" or "morphing" speed of the noise, independent of wind.')}
                        ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.threshold', 'Threshold', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.brightness', 'Brightness', -1, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.contrast', 'Contrast', 0, 5, 0.05)}
                        ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.softness', 'Softness', 0.01, 1, 0.01)}
                    </div>
                </details>
            `);
    }

    async _draw(options) {
        console.log("HeatDistortionLayer | Drawing layer with robust state management.");
        this.visible = false; // Start as invisible until ready.

        // Bind event handlers here, in _draw, for stability.
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        this._onPanBound = this._onPan.bind(this);

        // Reset state for the new scene.
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

        this.noiseManager = new NoiseTextureManager(renderer, 'heatDistortion.noise');

        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);
        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    _onPan() {
        this._needsMaskUpdate = true;
    }

    async updateEffectTargets(targets) {
        if (!this.heatSourceContainer) return;

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);
        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.heat) continue;
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
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _onAnimate(deltaTime) {
        if (this._destroyed) return;

        this._framesSinceLoad++;
        const heatFilter = ScreenEffectsManager.getFilter('heatDistortion');

        // Default to disabled. It must pass all checks to become active.
        if (heatFilter) {
            heatFilter.enabled = false;
        }

        // --- Dependency Checks ---
        const mainConfig = game.mapShine.profileManager.activeConfig;
        const config = mainConfig.heatDistortion;
        if (!mainConfig.enabled || !config.enabled || !heatFilter) {
            return;
        }

        const hasActiveHeatSources = this.heatSprites.size > 0 && Array.from(this.heatSprites.values()).some(s => s.texture.valid);
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
        // --- All checks passed, make the effect active ---
        heatFilter.enabled = true;

        if (this._needsMaskUpdate) {
            canvas.app.renderer.render(this.heatSourceContainer, {
                renderTexture: this.combinedMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });
            this._needsMaskUpdate = false;
        }
        
        // Pass the unscaled deltaTime; the noiseManager will handle the timeFactor internally.
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
        if (this._destroyed) return;
        this._destroyed = true;

        if (this._onAnimateBound) canvas.app.ticker.remove(this._onAnimateBound);
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);
        if (this._onPanBound) Hooks.off('canvasPan', this._onPanBound);

        // Meticulously destroy all created PIXI objects
        this.noiseManager?.destroy();
        this.combinedMaskTexture?.destroy(true);
        this.heatSourceContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.heatSprites.clear();

        // Nullify all properties
        this.heatSourceContainer = null;
        this.combinedMaskTexture = null;
        this.noiseManager = null;

        return super._tearDown(options);
    }
}

// --- 5.10. Prism Effect ---

class PrismLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'prism'
        });

        this.distortionNoiseManager = null;
        this._framesSinceLoad = 0;
        this._destroyed = false;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('prism', 'Prism Effect', `
                ${DebuggerUIBuilder._createTextureInputHTML('prism', 'Effect Mask (_Prism)')}
                <p class="description-text">Splits the light from the brightest parts of the scene into a prismatic, chromatic aberration effect.</p>
                ${DebuggerUIBuilder._createSliderHTML('prism.intensity', 'Intensity', 0, 50, 0.5, 'The distance in pixels the color channels are split.')}
                ${DebuggerUIBuilder._createSliderHTML('prism.angle', 'Angle', 0, 360, 1, 'The direction of the color split.')}
                ${DebuggerUIBuilder._createSliderHTML('prism.threshold', 'Luminance Threshold', 0, 1, 0.01, 'The effect will only apply to pixels brighter than this value.')}
                ${DebuggerUIBuilder._createSliderHTML('prism.softness', 'Threshold Softness', 0.01, 1, 0.01, 'The softness of the transition at the luminance threshold.')}
            
                <details id="details-prism-distortionNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('prism.distortionNoise.enabled', 'Distortion', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Uses a noise pattern to warp and animate the prism effect.</p>
                        ${DebuggerUIBuilder._createSliderHTML('prism.distortionStrength', 'Distortion Strength', 0, 10, 0.1)}
                        ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.speed', 'Speed', -0.5, 0.5, 0.005)}
                        ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.scale', 'Scale', 0.01, 10, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.evolution', 'Evolution', 0, 1, 0.01)}
                        <details id="details-prism-distortionNoise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.threshold', 'Threshold', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.brightness', 'Brightness', -1, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.contrast', 'Contrast', 0, 5, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.softness', 'Softness', 0.01, 1, 0.01)}
                            </div>
                        </details>
                    </div>
                </details>
            `);
    }

    async _draw(options) {
        await super._draw(options);

        this._framesSinceLoad = 0;
        this._destroyed = false;

        const renderer = canvas.app.renderer;
        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'prism.distortionNoise', true);

        // This layer has no visible children. It only manages textures for a global filter.

        // Initial config update
        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime); // This renders the combined mask if needed
        if (this._destroyed) return;
        this._framesSinceLoad++;

        const prismFilter = ScreenEffectsManager.getFilter('prism');
        if (!prismFilter) return;

        // Check if the layer has any active mask textures.
        const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);

        const config = game.mapShine.profileManager.activeConfig;
        const pConfig = config.prism;

        // Enable the global filter only if the module is on, the effect is on, AND there's a _Prism texture.
        prismFilter.enabled = config.enabled && pConfig.enabled && hasActiveMasks;

        // Don't do any processing if the filter is disabled or if we're in the first few stabilization frames.
        if (!prismFilter.enabled || this._framesSinceLoad < 5) {
            return;
        }

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        // Update the noise manager for the distortion effect.
        this.distortionNoiseManager.update(deltaTime * timeFactor, canvas.app.renderer);

        // Feed the generated textures into the global filter's uniforms.
        const u = prismFilter.uniforms;
        u.uPrismMask = this.getMaskTexture();
        u.uDistortionMap = this.distortionNoiseManager.getTexture();
        u.uDistortionStrength = pConfig.distortionNoise.enabled ? pConfig.distortionStrength : 0.0;
    }

    async updateFromConfig(config) {
        // We only need to tell the distortion noise manager about the new config.
        // The other uniforms for PrismFilter are handled by ScreenEffectsManager or _onAnimate.
        this.distortionNoiseManager?.updateFromConfig(config);
    }

    _onResize() {
        super._onResize(); // Handles resizing the main _Prism mask texture.
        const renderer = canvas.app.renderer;
        this.distortionNoiseManager?.resize(renderer);
    }

    async _tearDown(options) {
        if (this._destroyed) return;
        this._destroyed = true;

        // On teardown, clear the textures from the global filter to prevent artifacts on the next scene.
        const prismFilter = ScreenEffectsManager.getFilter('prism');
        if (prismFilter) {
            prismFilter.uniforms.uPrismMask = PIXI.Texture.EMPTY;
            prismFilter.uniforms.uDistortionMap = PIXI.Texture.EMPTY;
            prismFilter.enabled = false;
        }

        this.distortionNoiseManager?.destroy();
        this.distortionNoiseManager = null;

        await super._tearDown(options);
    }
}

// --- 5.11 Water Effects ---

class WaterEffectsFilter extends PIXI.Filter {
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
    
                // Input textures & masks
                uniform sampler2D uSampler;
                uniform sampler2D u_displacementMap;
                uniform sampler2D u_waterMask;
                uniform sampler2D u_shorelineMask;
                uniform sampler2D u_blurredWaterMask;
    
                // Uniforms for toggles and parameters
                uniform bool u_useShorelineMask;
                uniform vec2 u_camera_offset;
                uniform vec2 u_view_size;
                uniform float u_time;
                uniform bool u_outputShorelineFoamMask;
    
                // Wave & Distortion
                uniform bool u_wave_enabled;
                uniform float u_wave_intensity;
    
                // Surface (Open Water Foam & Sheen)
                uniform bool u_surface_enabled;
                uniform vec3 u_openWaterFoamColor;
                uniform float u_openWaterFoamIntensity;
                uniform float u_openWaterFoamCoverage;
                uniform float u_openWaterFoamSharpness;
                uniform float u_openWaterFbmScale;
                uniform float u_openWaterFbmSpeed;
                uniform float u_openWaterFbmEvolution;
                uniform int u_openWaterFbmOctaves;
                uniform float u_openWaterFbmLacunarity;
                uniform float u_openWaterFbmPersistence;
                
                // Sheen (Now calculated directly in this shader)
                uniform bool u_sheenEnabled;
                uniform vec3 u_sheenColor;
                uniform float u_sheenIntensity;
                uniform float u_sheenScale;
                uniform float u_sheenSpeed;
                uniform float u_sheenStretch;
                uniform float u_sheenSharpness;
    
                // Caustics
                uniform bool u_caustics_enabled;
                uniform vec3 u_causticsColor;
                uniform float u_causticsIntensity;
                uniform float u_causticsScale;
                uniform float u_causticsSpeed;
                uniform float u_causticsLineSharpness;
                uniform float u_causticsBloomIntensity;
                uniform float u_causticsLineDistortion;
                uniform float u_causticsLineDistortionScale;
                uniform float u_causticsIntersectionBoost;
                uniform float u_causticsRoughnessScale;
                uniform float u_causticsRoughnessIntensity;
                
                // Shoreline
                uniform bool u_shoreline_enabled;
                uniform vec3 u_shorelineFoamColor;
                uniform float u_shorelineFoamIntensity;
    
                // Shoreline Foam Pattern
                uniform float u_shorelinePatternScale;
                uniform float u_shorelinePatternSpeed;
                uniform float u_shorelinePatternEvolution;
                uniform int u_shorelinePatternOctaves;
                uniform float u_shorelinePatternLacunarity;
                uniform float u_shorelinePatternPersistence;
                uniform float u_shorelinePatternBrightness;
                uniform float u_shorelinePatternContrast;
                
                // Shoreline Displacement Swirl
                uniform bool u_shorelineDisplacementEnabled;
                uniform float u_shorelineDisplacementScale;
                uniform float u_shorelineDisplacementSpeed;
                uniform float u_shorelineDisplacementStrength;
    
                // Shoreline Particle Mask Processing
                uniform float u_particleMaskBrightness;
                uniform float u_particleMaskContrast;
    
                vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 =   v - i + dot(i, C.xxx) ;
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod(i, 289.0);
                    vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }
                
                float fbm(vec3 st, int octaves, float lacunarity, float persistence) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 8; i++) {
                        if (i >= octaves) break;
                        value += amplitude * snoise(st);
                        st *= lacunarity;
                        amplitude *= persistence;
                    }
                    return value * 0.5 + 0.5;
                }
    
                void main() {
                    float waterMaskValue = texture2D(u_waterMask, vTextureCoord).r;

                    if (waterMaskValue < 0.01 && !u_outputShorelineFoamMask) {
                        gl_FragColor = texture2D(uSampler, vTextureCoord);
                        return;
                    }

                    vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
    
                    vec2 wave_uv_offset = vec2(0.0);
                    if (u_wave_enabled) {
                        wave_uv_offset = (texture2D(u_displacementMap, vTextureCoord).xy - 0.5) * 2.0 * u_wave_intensity;
                    }
    
                    vec2 swirl_world_offset = vec2(0.0);
                    if (u_shoreline_enabled && u_shorelineDisplacementEnabled) {
                        float currentShorelineMask = u_useShorelineMask ? texture2D(u_shorelineMask, vTextureCoord).r : clamp((texture2D(u_blurredWaterMask, vTextureCoord).r - waterMaskValue) * 5.0, 0.0, 1.0);
                        if (currentShorelineMask > 0.0) {
                            vec2 swirl_noise_coord = world_coord * u_shorelineDisplacementScale * 0.01;
                            float displacement_time = u_time * u_shorelineDisplacementSpeed;
                            float dx = snoise(vec3(swirl_noise_coord, displacement_time));
                            float dy = snoise(vec3(swirl_noise_coord + vec2(17.8, 93.4), displacement_time));
                            swirl_world_offset = vec2(dx, dy) * u_shorelineDisplacementStrength * currentShorelineMask;
                        }
                    }
    
                    vec2 final_distorted_uv = vTextureCoord + wave_uv_offset;
                    vec2 final_distorted_world_coord = world_coord + swirl_world_offset;
                    
                    vec4 sceneColor = texture2D(uSampler, mix(vTextureCoord, final_distorted_uv, waterMaskValue));
                    
                    vec3 finalColor = sceneColor.rgb;
    
                    if (u_caustics_enabled) {
                        float time = u_time * u_causticsSpeed;
                        vec3 dist_coord = vec3(world_coord * u_causticsLineDistortionScale * 0.01, time * 2.0);
                        float distortion_noise = snoise(dist_coord) * u_causticsLineDistortion;
                        vec3 coord1 = vec3(world_coord * u_causticsScale * 0.02 + distortion_noise, time);
                        float pattern1 = pow(max(0.0, 1.0 - abs(snoise(coord1))), u_causticsLineSharpness);
                        vec3 coord2 = vec3(world_coord * u_causticsScale * 0.01 - distortion_noise, time * 0.5);
                        float pattern2 = pow(max(0.0, 1.0 - abs(snoise(coord2))), u_causticsLineSharpness);
                        vec3 rough_coord = vec3(world_coord * u_causticsRoughnessScale * 0.01, time * 1.5);
                        float roughness_noise = snoise(rough_coord) * 0.5 + 0.5;
                        roughness_noise = 1.0 - u_causticsRoughnessIntensity + (roughness_noise * u_causticsRoughnessIntensity);
                        vec3 coord3 = vec3(world_coord * u_causticsScale * 0.005, time * 0.2);
                        float bloom_pattern = smoothstep(0.6, 1.0, snoise(coord3) * 0.5 + 0.5);
                        float line_pattern = pattern1 * pattern2 * u_causticsIntersectionBoost;
                        float final_pattern = (line_pattern * roughness_noise) + bloom_pattern * u_causticsBloomIntensity;
                        vec3 caustics = u_causticsColor * final_pattern * u_causticsIntensity;
                        finalColor += caustics * waterMaskValue;
                    }
    
                    if (u_surface_enabled) {
                        vec2 foam_wave_distortion = wave_uv_offset * u_openWaterFbmScale * 10.0;
                        vec2 baseFoamUV = (final_distorted_world_coord * u_openWaterFbmScale * 0.01) + foam_wave_distortion;

                        baseFoamUV += u_time * u_openWaterFbmSpeed * 0.1;
                        float foamTime = u_time * u_openWaterFbmEvolution * 0.1;
                        float foamNoise = fbm(vec3(baseFoamUV, foamTime), u_openWaterFbmOctaves, u_openWaterFbmLacunarity, u_openWaterFbmPersistence);
                        float openWaterFoamAmount = smoothstep(1.0 - u_openWaterFoamCoverage, 1.0 - u_openWaterFoamCoverage + u_openWaterFoamSharpness, foamNoise);
                        vec3 openWaterFoamResult = u_openWaterFoamColor * openWaterFoamAmount * u_openWaterFoamIntensity;
                        
                        vec3 sheenResult = vec3(0.0);
                        if (u_sheenEnabled) {
                            vec2 sheen_wave_distortion = wave_uv_offset * u_sheenScale * 10.0;
                            vec2 sheenUV = (final_distorted_world_coord * u_sheenScale * 0.01) + sheen_wave_distortion;
                            sheenUV.x *= u_sheenStretch;
                            sheenUV.y += u_time * u_sheenSpeed * 0.1;
                            float sheenNoise = snoise(vec3(sheenUV, u_time * 0.01));
                            sheenNoise = pow(smoothstep(0.8, 1.0, sheenNoise), u_sheenSharpness);
                            sheenResult = u_sheenColor * sheenNoise * u_sheenIntensity;
                        }
                        finalColor += (openWaterFoamResult + sheenResult) * waterMaskValue;
                    }
    
                    if (u_shoreline_enabled) {
                        float shorelineMaskValue = u_useShorelineMask ? texture2D(u_shorelineMask, vTextureCoord).r : clamp((texture2D(u_blurredWaterMask, vTextureCoord).r - waterMaskValue) * 5.0, 0.0, 1.0);
                        
                        vec2 shore_foam_wave_distortion = wave_uv_offset * u_shorelinePatternScale * 10.0;
                        vec2 final_foam_uv = (final_distorted_world_coord * u_shorelinePatternScale * 0.01) + shore_foam_wave_distortion;

                        final_foam_uv.x += u_time * u_shorelinePatternSpeed;
                        float foam_time = u_time * u_shorelinePatternEvolution;
                        float foam_noise = fbm(vec3(final_foam_uv, foam_time), u_shorelinePatternOctaves, u_shorelinePatternLacunarity, u_shorelinePatternPersistence);
                        foam_noise = (foam_noise - 0.5 + u_shorelinePatternBrightness) * u_shorelinePatternContrast + 0.5;
                        float final_foam_amount = clamp(foam_noise, 0.0, 1.0) * shorelineMaskValue;
    
                        if (u_outputShorelineFoamMask) {
                            float particle_mask_value = (final_foam_amount + u_particleMaskBrightness - 0.5) * u_particleMaskContrast + 0.5;
                            gl_FragColor = vec4(vec3(clamp(particle_mask_value, 0.0, 1.0)), 1.0);
                            return;
                        }
                        
                        vec3 shoreline_foam_result = u_shorelineFoamColor * final_foam_amount * u_shorelineFoamIntensity;
                        finalColor += shoreline_foam_result;
                    }
    
                    if (u_outputShorelineFoamMask) {
                        gl_FragColor = vec4(0.0);
                        return;
                    }
    
                    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), sceneColor.a);
                }
            `;

        super(vertexSrc, fragmentSrc, {
            ...options,
            u_displacementMap: options.u_displacementMap ?? PIXI.Texture.EMPTY,
            u_waterMask: options.u_waterMask ?? PIXI.Texture.EMPTY,
            u_shorelineMask: options.u_shorelineMask ?? PIXI.Texture.EMPTY,
            u_blurredWaterMask: options.u_blurredWaterMask ?? PIXI.Texture.EMPTY,
            u_outputShorelineFoamMask: false,

            u_causticsLineSharpness: 20.0,
            u_causticsBloomIntensity: 0.3,
            u_causticsLineDistortion: 0.3,
            u_causticsLineDistortionScale: 1.5,
            u_causticsIntersectionBoost: 4.0,
            u_causticsRoughnessScale: 5.0,
            u_causticsRoughnessIntensity: 0.4,

            u_shorelinePatternScale: 5.0,
            u_shorelinePatternSpeed: 0.1,
            u_shorelinePatternEvolution: 0.2,
            u_shorelinePatternOctaves: 3,
            u_shorelinePatternLacunarity: 2.0,
            u_shorelinePatternPersistence: 0.5,
            u_shorelinePatternBrightness: 0.5,
            u_shorelinePatternContrast: 1.5,

            u_shorelineDisplacementEnabled: true,
            u_shorelineDisplacementScale: 2.0,
            u_shorelineDisplacementSpeed: 0.05,
            u_shorelineDisplacementStrength: 10.0,

            u_particleMaskBrightness: 0.0,
            u_particleMaskContrast: 5.0,
        });
    }
}

class WaterFXLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'water'
        });

        // Water effect properties
        this.displacementFilter = null;
        this.displacementSprite = null;
        this.displacementTexture = null;
        this.blurFilter = null;
        this.blurSourceSprite = null;
        this.blurredWaterMaskTexture = null;
        this.shorelineMaskContainer = null;
        this.shorelineMaskTexture = null;
        this.shorelineMaskSprites = new Map();
        this._needsShorelineMaskUpdate = true;
        this.time = 0;

        // Particle mask generation properties
        this.particleMaskGeneratorSprite = null;
        this.shorelineParticleMaskTexture = null;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('water', 'Water Effects', `
                ${DebuggerUIBuilder._createTextureInputHTML('water', 'Water Mask (_Water)')}
                <p class="description-text">A multi-layered effect for water surfaces, foam, and underwater caustics. Requires a _Water.webp mask.</p>
                <details id="details-water-wave" open>
                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.wave.enabled', 'Wave Distortion', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        <p class="description-text">Controls the underlying ripple/wobble of the water surface. This distortion affects the scene viewed through the water, as well as the foam and sheen on the surface.</p>
                        ${DebuggerUIBuilder._createSliderHTML('water.wave.speed', 'Speed', 0, 0.1, 0.0001, 'The animation speed of the wave noise pattern.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.wave.scale', 'Scale', 0.1, 40, 0.1, 'The zoom level of the wave noise. Larger values create smaller, more frequent ripples.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.wave.intensity', 'Intensity', 0, 0.05, 0.0001, 'The strength of the distortion. Higher values push the pixels further.')}
                    </div>
                </details>
                <details id="details-water-surface" open>
                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.surface.enabled', 'Open Water Surface', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        <details id="details-water-foam" open>
                            <summary><span class="accordion-toggle"></span><strong>Foam</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createColorPickerHTML('water.surface.foamColor', 'Color')}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.foamIntensity', 'Base Intensity', 0, 2, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.foamCoverage', 'Coverage', 0, 1, 0.01, 'Amount of water surface covered by foam.')}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.foamSharpness', 'Edge Sharpness', 0.01, 1, 0.01, 'Hardness of the foam edges.')}
                                <details id="details-water-foam-fbm">
                                    <summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Controls the procedural noise used for the foam pattern.</p>
                                        ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmScale', 'Scale', 0.001, 50, 0.001)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmSpeed', 'Speed', 0, 0.5, 0.01, 'Directional drift speed of the foam.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmEvolution', 'Evolution', 0, 0.5, 0.01, 'Internal "boiling" speed of the foam.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmOctaves', 'Complexity (Octaves)', 1, 8, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmLacunarity', 'Detail Scale', 1.5, 4, 0.05)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmPersistence', 'Roughness', 0.1, 1, 0.05)}
                                    </div>
                                </details>
                            </div>
                        </details>
                        <details id="details-water-sheen" open>
                            <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.surface.sheenEnabled', 'Surface Sheen', true)}</div></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createColorPickerHTML('water.surface.sheenColor', 'Color')}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenIntensity', 'Intensity', 0, 1, 0.001)}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenScale', 'Scale', 0.1, 10, 0.1)}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenSpeed', 'Speed', 0, 0.5, 0.001)}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenStretch', 'Stretch', 1, 10, 0.1, 'Stretches the sheen horizontally for a more reflective look.')}
                                ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenSharpness', 'Sharpness', 0.5, 5, 0.1, 'Hardness of the sheen highlights.')}
                            </div>
                        </details>
                    </div>
                </details>
                <details id="details-water-caustics" open>
                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.caustics.enabled', 'Underwater Caustics', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.intensity', 'Intensity', 0, 1, 0.001)}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.scale', 'Scale', 0.1, 10, 0.1)}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.speed', 'Speed', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createColorPickerHTML('water.caustics.color', 'Caustic Color')}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.lineSharpness', 'Line Sharpness', 1, 40, 1, 'Exponent for sharpening the caustic lines.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.bloomIntensity', 'Bloom Intensity', 0, 1, 0.01, 'Brightness of the soft underlying glow.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.lineDistortion', 'Line Distortion', 0, 2, 0.01, 'How much the lines are broken up and warped.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.lineDistortionScale', 'Distortion Scale', 0.1, 10, 0.1, 'The scale of the line distortion noise.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.intersectionBoost', 'Intersection Boost', 1, 20, 0.1, 'Multiplies the brightness of intersecting lines.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.roughnessScale', 'Roughness Scale', 0.1, 20, 0.1, 'Scale of the noise that breaks up the lines.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.caustics.roughnessIntensity', 'Roughness Intensity', 0, 1, 0.01, 'How strongly the noise affects line brightness.')}
                    </div>
                </details>
                <details id="details-water-shoreline" open>
                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.enabled', 'Shoreline Foam', true)}</div></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createTextureInputHTML('shoreline', 'Shoreline Override (_Shoreline)')}
                        <p class="description-text">Controls foam near land. Best results with a soft-edged, grayscale _Shoreline map.</p>
                        
                        <details><summary><span class="accordion-toggle"></span><strong>Foam Appearance</strong></summary><div style="padding-left:15px;">
                            ${DebuggerUIBuilder._createColorPickerHTML('water.shoreline.foamColor', 'Foam Color')}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamIntensity', 'Intensity', 0, 5, 0.1)}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.detectionBlur', 'Auto-Detection Blur', 1, 32, 1, 'Thickness of the shoreline when auto-detected (no _Shoreline file).')}
                        </div></details>

                        <details id="details-water-shoreline-displacement" open>
                            <summary><span class="accordion-toggle"></span>
                                <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.displacement.enabled', 'Displacement Swirl', true)}</div>
                            </summary>
                            <div style="padding-left:15px;">
                                <p class="description-text">Adds a swirling distortion to the shoreline foam pattern, simulating churning water.</p>
                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.displacement.scale', 'Swirl Scale', 0.1, 10, 0.1, 'The size of the swirling patterns.')}
                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.displacement.speed', 'Swirl Speed', 0, 0.2, 0.001, 'How fast the swirls animate.')}
                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.displacement.strength', 'Swirl Strength', 0, 0.05, 0.0005, 'How much the foam pattern is distorted by the swirl.')}
                            </div>
                        </details>
                        
                        <details><summary><span class="accordion-toggle"></span><strong>Foam Pattern (FBM)</strong></summary><div style="padding-left:15px;">
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.scale', 'Scale', 1, 50, 0.5)}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.speed', 'Speed', 0, 0.5, 0.01, 'Directional drift speed of the foam.')}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.evolution', 'Evolution', 0, 0.5, 0.01, 'Internal "boiling" speed of the foam.')}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.octaves', 'Complexity (Octaves)', 1, 8, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.lacunarity', 'Detail Scale', 1.5, 4, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.persistence', 'Roughness', 0.1, 1, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.brightness', 'Brightness', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.contrast', 'Contrast', 0, 5, 0.05)}
                        </div></details>
                        
                        <details id="details-water-shoreline-foam-particles" open>
                        <summary><span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.foamParticles.enabled', 'Shoreline Foam Particles', true)}</div>
                        </summary>
                        <div style="padding-left:15px;">
                            <p class="description-text">Spawns particles on the brightest parts of the animated shoreline foam.</p>
                            ${DebuggerUIBuilder._createSelectHTML('water.shoreline.foamParticles.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                            <details>
                                <summary><span class="accordion-toggle"></span><strong>Particle Mask Processing</strong></summary>
                                <div style="padding-left: 15px;">
                                    <p class="description-text">Boosts the brightness/contrast of the underlying foam mask to make it suitable for particle spawning.</p>
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.particleMaskBrightness', 'Brightness', -1, 1, 0.05)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.particleMaskContrast', 'Contrast', 1, 20, 0.1)}
                                </div>
                            </details>
                            <details open>
            <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
            <div style="padding-left: 15px;">
                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.maskInfluence', 'Particle Density', 0.01, 5, 0.01, 'Controls the maximum number of particles.')}
                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.frequency', 'Spawn Rate (s)', 0.001, 1, 0.001, 'Time in seconds between particle spawns. Lower is faster.')}
                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.maskThreshold', 'Spawn Threshold', 0, 1, 0.01, 'Foam brightness required to spawn particles.')}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createTextInputHTML('water.shoreline.foamParticles.particleTexture', 'Particle Texture', 'Path to the particle image.')}
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.lifetime.min', 'Min Lifetime (s)', 0.1, 20, 0.1)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.lifetime.max', 'Max Lifetime (s)', 0.1, 20, 0.1)}
                                            </div>
                                        </details>
                                        <details open>
                                            <summary><span class="accordion-toggle"></span><strong>Color Over Life</strong></summary>
                                            <div style="padding-left: 15px;">
                                                <p class="description-text">Sets particle color at birth and death. If colors are the same, a static color is used.</p>
                                                ${DebuggerUIBuilder._createColorPickerHTML('water.shoreline.foamParticles.color.start', 'Start Color')}
                                                ${DebuggerUIBuilder._createColorPickerHTML('water.shoreline.foamParticles.color.end', 'End Color')}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Alpha / Opacity</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.alpha.max', 'Max Alpha', 0, 1, 0.01)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.alpha.fadeIn', 'FadeIn Time (%)', 0, 0.5, 0.01)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.alpha.fadeOut', 'FadeOut Time (%)', 0, 0.5, 0.01)}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.sizeMultiplier', 'Global Size', 0.1, 10, 0.1, 'A global multiplier for particle size.')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.start', 'Start Scale Mult', 0, 2, 0.01, 'Particle size at birth (multiplied by Global Size).')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.end', 'End Scale Mult', 0, 2, 0.01, 'Particle size at death (multiplied by Global Size).')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.minMult', 'Random Size Min', 0.1, 1, 0.01, 'Minimum random scale multiplier for each particle (from this value to 1.0).')}
                                            </div>
                                        </details>
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                                    <div style="padding-left: 15px;">
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.speed.start', 'Start Speed', -50, 50, 1)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.speed.end', 'End Speed', -50, 50, 1)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.speed.minMult', 'Random Speed Min', 0.1, 1, 0.01, 'Minimum random speed multiplier for each particle (from this value to 1.0).')}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.foamParticles.rotation.enabled', 'Tumbling / Rotation', true)}</div></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.rotation.minSpeed', 'Min Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.rotation.maxSpeed', 'Max Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.rotation.accel', 'Rot. Accel.', -90, 90, 1, 'Degrees per second squared.')}
                                            </div>
                                        </details>
                                    </div>
                                </details>
                            </div>
                        </details>
                    </div>
                </details>
                <details id="details-water-glint-particles" open>
                    <summary><span class="accordion-toggle"></span>
                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.glintParticles.enabled', 'Water Glints / Spray', true)}</div>
                    </summary>
                    <div style="padding-left:15px;">
                        <p class="description-text">General-purpose particles spawned across the entire water surface.</p>
                        ${DebuggerUIBuilder._createSelectHTML('water.glintParticles.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                        <details open>
                            <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.maskInfluence', 'Particle Density', 0.01, 5, 0.01, 'Controls the maximum number of particles.')}
                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.frequency', 'Spawn Rate (s)', 0.001, 1, 0.001, 'Time in seconds between particle spawns. Lower is faster.')}
                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.maskThreshold', 'Spawn Threshold', 0, 1, 0.01, 'Water mask brightness required to spawn particles.')}
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createTextInputHTML('water.glintParticles.particleTexture', 'Particle Texture', 'Path to the particle image.')}
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.lifetime.min', 'Min Lifetime (s)', 0.1, 20, 0.1)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.lifetime.max', 'Max Lifetime (s)', 0.1, 20, 0.1)}
                                    </div>
                                </details>
                                <details open>
                                    <summary><span class="accordion-toggle"></span><strong>Color Over Life</strong></summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Sets particle color at birth and death. If colors are the same, a static color is used.</p>
                                        ${DebuggerUIBuilder._createColorPickerHTML('water.glintParticles.color.start', 'Start Color')}
                                        ${DebuggerUIBuilder._createColorPickerHTML('water.glintParticles.color.end', 'End Color')}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Alpha / Opacity</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.alpha.max', 'Max Alpha', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.alpha.fadeIn', 'FadeIn Time (%)', 0, 0.5, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.alpha.fadeOut', 'FadeOut Time (%)', 0, 0.5, 0.01)}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.sizeMultiplier', 'Global Size', 0.1, 10, 0.1, 'A global multiplier for particle size.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.start', 'Start Scale Mult', 0, 2, 0.01, 'Particle size at birth (multiplied by Global Size).')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.end', 'End Scale Mult', 0, 2, 0.01, 'Particle size at death (multiplied by Global Size).')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.minMult', 'Random Size Min', 0.1, 1, 0.01, 'Minimum random scale multiplier for each particle (from this value to 1.0).')}
                                    </div>
                                </details>
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                            <div style="padding-left: 15px;">
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.speed.start', 'Start Speed', -50, 50, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.speed.end', 'End Speed', -50, 50, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.speed.minMult', 'Random Speed Min', 0.1, 1, 0.01, 'Minimum random speed multiplier for each particle (from this value to 1.0).')}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.glintParticles.rotation.enabled', 'Tumbling / Rotation', true)}</div></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.rotation.minSpeed', 'Min Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.rotation.maxSpeed', 'Max Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.rotation.accel', 'Rot. Accel.', -90, 90, 1, 'Degrees per second squared.')}
                                    </div>
                                </details>
                            </div>
                        </details>
                    </div>
                </details>
            `);
    }

    async _draw(options) {
        await super._draw(options);
        this.time = 0;
        this._needsShorelineMaskUpdate = true;
        const renderer = canvas.app.renderer;

        // --- Shared Resources ---
        this.displacementFilter = new WaveDisplacementFilter();
        this.displacementSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.displacementSprite.width = renderer.screen.width;
        this.displacementSprite.height = renderer.screen.height;
        this.displacementSprite.filters = [this.displacementFilter];
        this.displacementTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        const initialBlur = game.mapShine.profileManager.activeConfig.water.shoreline.detectionBlur;
        this.blurFilter = new PIXI.BlurFilter(initialBlur, 4);
        this.blurredWaterMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.blurSourceSprite = new PIXI.Sprite(this.getMaskTexture());
        this.blurSourceSprite.filters = [this.blurFilter];
        this.shorelineMaskContainer = new PIXI.Container();
        this.shorelineMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        // --- Particle Mask Generation System ---
        const particleMaskFilter = new WaterEffectsFilter();
        this.particleMaskGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.particleMaskGeneratorSprite.width = renderer.screen.width;
        this.particleMaskGeneratorSprite.height = renderer.screen.height;
        this.particleMaskGeneratorSprite.filters = [particleMaskFilter];
        this.shorelineParticleMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    updateFromConfig(config) {
        const wConfig = config.water;
        this.visible = config.enabled && wConfig.enabled;
        if (!this.displacementFilter || !this.blurFilter) return;

        this.displacementFilter.uniforms.u_speed = wConfig.wave.speed;
        this.displacementFilter.uniforms.u_scale = wConfig.wave.scale;
        this.blurFilter.blur = wConfig.shoreline.detectionBlur;

        // Parameter uniforms for the particle mask generator are synced by ScreenEffectsManager
        // so we don't need a separate call here.
    }

    _onPan() {
        super._onPan();
        this._needsShorelineMaskUpdate = true;
    }

    _onResize() {
        super._onResize();
        const renderer = canvas.app.renderer;
        this.displacementTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.blurredWaterMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.shorelineMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.shorelineParticleMaskTexture?.resize(renderer.screen.width, renderer.screen.height);

        if (this.displacementSprite) this.displacementSprite.width = renderer.screen.width;
        if (this.particleMaskGeneratorSprite) this.particleMaskGeneratorSprite.width = renderer.screen.height;

        this._needsShorelineMaskUpdate = true;
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime);
        const waterEffectsFilter = ScreenEffectsManager.getFilter('water');
        if (this._destroyed || !waterEffectsFilter) return;

        const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture?.valid);
        waterEffectsFilter.enabled = this.visible && hasActiveMasks;

        if (!waterEffectsFilter.enabled) return;

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.time += deltaTime * timeFactor;
        const renderer = canvas.app.renderer;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        const viewSize = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        renderer.render(this.displacementSprite, {
            renderTexture: this.displacementTexture,
            clear: true
        });
        if (this._needsShorelineMaskUpdate) {
            renderer.render(this.shorelineMaskContainer, {
                renderTexture: this.shorelineMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });
            this._needsShorelineMaskUpdate = false;
        }
        this.blurSourceSprite.texture = this.getMaskTexture();
        renderer.render(this.blurSourceSprite, {
            renderTexture: this.blurredWaterMaskTexture,
            clear: true
        });

        const useShorelineMask = this.shorelineMaskSprites.size > 0;
        this.displacementFilter.uniforms.u_time = this.time;

        const u = waterEffectsFilter.uniforms;
        u.u_time = this.time;
        u.u_displacementMap = this.displacementTexture;
        u.u_waterMask = this.getMaskTexture();
        u.u_shorelineMask = this.shorelineMaskTexture;
        u.u_blurredWaterMask = this.blurredWaterMaskTexture;
        u.u_useShorelineMask = useShorelineMask;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = viewSize;

        const foamController = game.mapShine.particleManager?.controllers.get('foam');
        const foamParticlesEnabled = game.mapShine.profileManager.activeConfig.water.shoreline.foamParticles.enabled;

        if (foamController && foamParticlesEnabled) {
             const particleMaskFilter = this.particleMaskGeneratorSprite.filters[0];
            
             // We need to sync the live textures to the particle mask generator as well.
             const p_u = particleMaskFilter.uniforms;
             p_u.u_time = this.time;
             p_u.u_displacementMap = this.displacementTexture;
             p_u.u_waterMask = this.getMaskTexture();
             p_u.u_shorelineMask = this.shorelineMaskTexture;
             p_u.u_blurredWaterMask = this.blurredWaterMaskTexture;
             p_u.u_useShorelineMask = useShorelineMask;
             p_u.u_camera_offset = [topLeft.x, topLeft.y];
             p_u.u_view_size = viewSize;
 
             // Now generate the mask
             p_u.u_outputShorelineFoamMask = true;
             renderer.render(this.particleMaskGeneratorSprite, { renderTexture: this.shorelineParticleMaskTexture, clear: true });
             p_u.u_outputShorelineFoamMask = false;
 
             // Find the foam particle controller and update its dynamic texture mask
             const foamEmitter = game.mapShine.particleManager?.controllers?.get('foam')?.emitters?.values()?.next()?.value;
             if (foamEmitter) {
                 const shape = foamEmitter.behaviors.find(b => b.type === 'spawnShape')?.shape;
                 if (shape instanceof TextureMaskShape) {
                     shape.updateTexture(this.shorelineParticleMaskTexture);
                 }
             }
        }
    }

    async updateEffectTargets(targets) {
        await super.updateEffectTargets(targets);
        if (!this.shorelineMaskContainer) return;

        const validShorelineIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (targetData?.shoreline) {
                validShorelineIds.add(id);
                let sprite = this.shorelineMaskSprites.get(id);
                if (!sprite) {
                    sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                    this.shorelineMaskSprites.set(id, sprite);
                    this.shorelineMaskContainer.addChild(sprite);
                }
                await this._updateSpriteTransform(sprite, targetData.shoreline, targetData.rect);
            }
        }

        for (const [id, sprite] of this.shorelineMaskSprites.entries()) {
            if (!validShorelineIds.has(id)) {
                sprite.destroy();
                this.shorelineMaskSprites.delete(id);
            }
        }
        this._needsShorelineMaskUpdate = true;
    }

    async _tearDown(options) {
        // The global filter is managed by ScreenEffectsManager, so we just need to disable it.
        const waterEffectsFilter = ScreenEffectsManager.getFilter('water');
        if (waterEffectsFilter) {
            waterEffectsFilter.enabled = false;
        }

        this.displacementFilter?.destroy();
        this.displacementSprite?.destroy();
        this.displacementTexture?.destroy(true);
        this.blurFilter?.destroy();
        this.blurSourceSprite?.destroy();
        this.blurredWaterMaskTexture?.destroy(true);
        this.shorelineMaskContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.shorelineMaskTexture?.destroy(true);
        this.shorelineMaskSprites.clear();

        this.particleMaskGeneratorSprite?.filters[0]?.destroy();
        this.particleMaskGeneratorSprite?.destroy();
        this.shorelineParticleMaskTexture?.destroy(true);

        this.displacementFilter = null;
        this.displacementSprite = null;
        this.displacementTexture = null;
        this.blurFilter = null;
        this.blurSourceSprite = null;
        this.blurredWaterMaskTexture = null;
        this.shorelineMaskContainer = null;
        this.shorelineMaskTexture = null;
        this.particleMaskGeneratorSprite = null;
        this.shorelineParticleMaskTexture = null;

        await super._tearDown(options);
    }
}

/**
 * A filter that generates a wave displacement map using simplex noise.
 * The output R and G channels represent the X and Y offsets of the wave motion.
 */
class WaveDisplacementFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
                precision mediump float;
                varying vec2 vTextureCoord;
    
                uniform float u_time;
                uniform float u_speed;
                uniform float u_scale;
    
                //
                // Description : Array and textureless GLSL 3D simplex noise function.
                //      Author : Ian McEwan, Ashima Arts.
                //  Maintainer : ijm
                //     Lastmod : 20110822 (ijm)
                //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
                //               Distributed under the MIT License. See LICENSE file.
                //               https://github.com/ashima/webgl-noise
                //
                vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    
                float snoise(vec3 v) {
                    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
                    // First corner
                    vec3 i  = floor(v + dot(v, C.yyy) );
                    vec3 x0 =   v - i + dot(i, C.xxx) ;
    
                    // Other corners
                    vec3 g = step(x0.yzx, x0.xyz);
                    vec3 l = 1.0 - g;
                    vec3 i1 = min( g.xyz, l.zxy );
                    vec3 i2 = max( g.xyz, l.zxy );
    
                    vec3 x1 = x0 - i1 + C.xxx;
                    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
                    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
    
                    // Permutations
                    i = mod(i, 289.0);
                    vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
    
                    // Gradients: 7x7 points over a square, mapped onto an octahedron.
                    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
                    float n_ = 0.142857142857; // 1.0/7.0
                    vec3  ns = n_ * D.wyz - D.xzx;
    
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
    
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
    
                    vec4 x = x_ *ns.x + ns.yyyy;
                    vec4 y = y_ *ns.x + ns.yyyy;
                    vec4 h = 1.0 - abs(x) - abs(y);
    
                    vec4 b0 = vec4( x.xy, y.xy );
                    vec4 b1 = vec4( x.zw, y.zw );
    
                    vec4 s0 = floor(b0)*2.0 + 1.0;
                    vec4 s1 = floor(b1)*2.0 + 1.0;
                    vec4 sh = -step(h, vec4(0.0));
    
                    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
    
                    vec3 p0 = vec3(a0.xy,h.x);
                    vec3 p1 = vec3(a0.zw,h.y);
                    vec3 p2 = vec3(a1.xy,h.z);
                    vec3 p3 = vec3(a1.zw,h.w);
    
                    // Normalise gradients
                    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                    p0 *= norm.x;
                    p1 *= norm.y;
                    p2 *= norm.z;
                    p3 *= norm.w;
    
                    // Mix final noise value
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }
    
                void main() {
                    float time = u_time * u_speed;
                    vec2 uv1 = vTextureCoord * u_scale + vec2(time * 0.5, time * 0.2);
                    vec2 uv2 = vTextureCoord * u_scale * 1.5 - vec2(time * -0.2, time * 0.5);
    
                    float noise1_x = snoise(vec3(uv1, time));
                    float noise1_y = snoise(vec3(uv1 + 10.0, time));
    
                    float noise2_x = snoise(vec3(uv2, time));
                    float noise2_y = snoise(vec3(uv2 + 20.0, time));
    
                    // Combine noises for a more complex pattern
                    vec2 displacement = vec2(noise1_x + noise2_x, noise1_y + noise2_y) * 0.5;
    
                    // Output the displacement vector in the R and G channels, normalized to 0-1 range
                    gl_FragColor = vec4(displacement * 0.5 + 0.5, 0.0, 1.0);
                }
            `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_time: 0.0,
            u_speed: options.speed ?? 0.05,
            u_scale: options.scale ?? 4.0,
        });
    }
}

// =================================================================================
// SECTION 6: USER INTERFACE & SETTINGS MANAGEMENT
// =================================================================================
// Description: Classes for the loading screen, debugger UI, profile management,
//              and client-side settings overrides.
// ---------------------------------------------------------------------------------

class LoadingScreen {
    constructor() {
        this.element = null;
        this.fadeOutDuration = 500;
        this.minDisplayTime = 1500;
        this.startTime = 0;
        this.fillElement = null;
        this.statusTextElement = null;

        this._textLoopActive = false;
        this.statusFadeDuration = 400;
        this.minStatusDisplayTime = 2000;

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
        if (this.element) return;
        this.startTime = Date.now();

        this.element = document.createElement('div');
        this.element.id = 'map-shine-loading-screen';
        this.element.style.opacity = '0';

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

                    #map-shine-loading-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 1); z-index: 100000; display: flex; justify-content: center; align-items: center; color: white; font-family: Signika, sans-serif; transition: opacity ${this.fadeOutDuration / 1000}s ease-in-out; }
                    .loading-content { text-align: center; }
                    .loading-logo { width: 150px; height: auto; margin: 0 auto 10px auto; display: block; filter: drop-shadow(0 0 10px rgba(0,0,0,0.6)); }
                    .loading-subhead { font-size: 24px; font-weight: normal; color: #bbb; margin: 0 0 10px 0; text-shadow: 0 0 5px #111; }
                    .loading-title { font-size: 72px; margin: 0 0 30px 0; text-shadow: 0 0 10px #222; }
                    .loading-bar-container { width: 400px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.5); margin: 0 auto; background-color: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; }
                    .loading-bar-fill { width: 0%; height: 100%; background-color: rgba(255, 255, 255, 0.9); transform-origin: left; transition: width 0.2s ease-out; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
                    .loading-status { margin-top: 15px; font-size: 16px; color: #ddd; height: 20px; line-height: 20px; opacity: 0; transition: opacity ${this.statusFadeDuration / 1000}s ease-in-out; }
                </style>
            `;

        document.body.appendChild(this.element);
        this.fillElement = this.element.querySelector('.loading-bar-fill');
        this.statusTextElement = this.element.querySelector('#loading-status-text');

        this.statusTextElement.innerText = "Loading...";
        this.statusTextElement.style.opacity = '1';
        this._textLoopActive = true;
        this._runTextLoop();

        void this.element.offsetHeight;
        this.element.style.opacity = '1';
    }

    setProgress(progress) {
        if (!this.fillElement) return;
        const p = Math.min(100, Math.max(0, progress));
        this.fillElement.style.width = `${p}%`;
    }

    async _runTextLoop() {
        while (this._textLoopActive) {

            await new Promise(resolve => setTimeout(resolve, this.minStatusDisplayTime));

            if (!this._textLoopActive) break;

            this.statusTextElement.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, this.statusFadeDuration));
            if (!this._textLoopActive) break;

            const newText = this.imaginativeMessages[Math.floor(Math.random() * this.imaginativeMessages.length)];
            this.statusTextElement.innerText = newText;

            this.statusTextElement.style.opacity = '1';
        }
    }

    async hide() {
        if (!this.element || !this.fillElement) return;

        this._textLoopActive = false;

        this.statusTextElement.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, this.statusFadeDuration));
        this.statusTextElement.innerText = "Almost ready...";
        this.statusTextElement.style.opacity = '1';
        await new Promise(resolve => setTimeout(resolve, this.statusFadeDuration));

        const fakeLoadDuration = 3000;
        this.fillElement.style.transition = `width ${fakeLoadDuration / 1000}s ease-in-out`;
        this.setProgress(100);
        await new Promise(resolve => setTimeout(resolve, fakeLoadDuration));

        if (this.element) {
            this.element.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, this.fadeOutDuration + 100));
        }

        this.element?.remove();
        this.element = null;
        this.fillElement = null;
        this.statusTextElement = null;
    }
}

const CLIENT_OVERRIDES_CONFIG = {
    baseShine: {
        name: "Metallic Shine",
        path: 'baseShine',
        intensitySubPath: 'animation.globalIntensity'
    },

    cloudShadows: {
        name: "Cloud Shadows",
        path: 'cloudShadows',
        intensitySubPath: 'shadowIntensity'
    },
    canopy: {
        name: "Canopy Shadows",
        path: 'canopy',
        intensitySubPath: 'shadowIntensity'
    },
    structuralShadows: {
        name: "Structural Shadows",
        path: 'structuralShadows',
        intensitySubPath: 'shadowIntensity'
    },
    iridescence: {
        name: "Iridescence",
        path: 'iridescence',
        intensitySubPath: 'intensity'
    },
    ambient: {
        name: "Ambient / Emissive",
        path: 'ambient',
        intensitySubPath: 'intensity'
    },
    groundGlow: {
        name: "Glow in the Dark",
        path: 'groundGlow',
        intensitySubPath: 'intensity'
    },
    heatDistortion: {
        name: "Heat Distortion",
        path: 'heatDistortion',
        intensitySubPath: 'intensity'
    },
    prism: {
        name: "Prism",
        path: 'prism',
        intensitySubPath: 'intensity'
    },
    advancedBloom: {
        name: "Global Bloom",
        path: 'advancedBloom',
        intensitySubPath: 'brightness'
    },
    vignette: {
        name: "Post: Vignette",
        path: 'postProcessing.vignette',
        intensitySubPath: 'amount'
    },
    chromaticAberration: {
        name: "Post: Chromatic Aberration",
        path: 'postProcessing.chromaticAberration',
        intensitySubPath: 'amount'
    },
    postProcessing: {
        name: "Post Processing (Group)",
        path: 'postProcessing'
    },
    dust: {
        name: "Dust Motes",
        path: 'dust',
        intensitySubPath: 'maskInfluence'
    },
    glint: {
        name: "Glint Particles",
        path: 'glint',
        intensitySubPath: 'maskInfluence'
    }
};

class ClientOverrides {
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
                    if (typeof originalValue === 'number') {
                        const newValue = originalValue * (intensitySetting / 100);
                        foundry.utils.setProperty(config, fullIntensityPath, newValue);
                    }
                }
            }
        }

        // New global accessibility overrides
        const disableDistortion = game.settings.get(MODULE_ID, 'user-disable-distortion');
        if (disableDistortion) {
            if (config.heatDistortion) config.heatDistortion.enabled = false;
            if (config.postProcessing?.lensDistortion) config.postProcessing.lensDistortion.enabled = false;
        }

        const disableFringe = game.settings.get(MODULE_ID, 'user-disable-color-fringe');
        if (disableFringe) {
            if (config.baseShine?.rgbSplit) config.baseShine.rgbSplit.enabled = false;
            if (config.postProcessing?.chromaticAberration) config.postProcessing.chromaticAberration.enabled = false;
        }

        return config;
    }
}

class ProfileManager {
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
        this._defaultProfileName = '';
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
            // If the key doesn't even exist in the new defaults, it's from a removed feature. Delete it.
            if (!(key in template)) {
                delete settings[key];
                continue;
            }

            const templateValue = template[key];
            const settingValue = settings[key];

            const isTemplateObject = typeof templateValue === 'object' && templateValue !== null && !Array.isArray(templateValue);
            const isSettingObject = typeof settingValue === 'object' && settingValue !== null && !Array.isArray(settingValue);

            // This is the critical check for the bug you found.
            // If the default is an object (e.g., size: {start, end}) but the saved setting
            // is a primitive (e.g., size: 1.0), we must delete the primitive.
            if (isTemplateObject && !isSettingObject) {
                delete settings[key];
                continue;
            }

            // If both are objects, we need to check their children recursively.
            if (isTemplateObject && isSettingObject) {
                this._reconcileOverrides(templateValue, settingValue);
                // After reconciling, if the override object has become empty, remove it too.
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
        this._defaultProfileName = game.settings.get(this.moduleId, DEFAULT_PROFILE_SETTING) || '';

        let rawSceneProfile = canvas.scene?.getFlag(this.moduleId, 'profile') || null;

        // If there's no scene-specific profile, check if a world-default is set and available.
        if (!rawSceneProfile && this._defaultProfileName && this._worldProfiles[this._defaultProfileName]) {
            console.log(`Map Shine | No scene profile found. Applying world default profile: "${this._defaultProfileName}"`);
            // Get the config part of the saved world profile. The profile might also contain UI state.
            const defaultConfigData = this._worldProfiles[this._defaultProfileName].config;
            if (defaultConfigData) {
                rawSceneProfile = foundry.utils.deepClone(defaultConfigData);
            }
        }

        if (rawSceneProfile) {
            // Sanitize the loaded scene profile against the latest defaults to remove outdated settings.
            this._sceneProfile = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawSceneProfile);
        } else {
            this._sceneProfile = null;
        }

        this.status.sceneProfileLoaded = !!this._sceneProfile;

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        let rawUserOverrides = allUserOverrides[this.activeSceneId] || {};

        // Sanitize the loaded user overrides against the latest defaults.
        this._userOverrides = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawUserOverrides);

        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);

        this.activeConfig = this._getEffectiveConfig();
        console.log("Map Shine | Live configuration has been built and set for the current scene.");
    }

    async initializeUI(ui) {
        this.ui = ui;
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
        // Start with a clean copy of the module's hardcoded defaults.
        let effectiveConfig = foundry.utils.deepClone(MODULE_DEFAULTS);

        // Layer 1: The scene's saved profile.
        if (this._sceneProfile) {
            // Use a custom merge to handle arrays correctly.
            this._customMerge(effectiveConfig, this._sceneProfile);
        }

        // Layer 2: The user's temporary overrides for this session.
        if (this._userOverrides) {
            // Use the same custom merge to apply temporary changes.
            this._customMerge(effectiveConfig, this._userOverrides);
        }

        // Layer 3: Apply any client-side accessibility/intensity modifiers.
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

            // If the source has an object, we want to recurse into it.
            if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue)) {

                // If the target doesn't have an object at this key, create one before recursing.
                if (typeof targetValue !== 'object' || targetValue === null || Array.isArray(targetValue)) {
                    target[key] = {};
                }
                this._customMerge(target[key], sourceValue);

            }
            // Handle arrays of objects specifically (for potential future use).
            else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                sourceValue.forEach((item, index) => {
                    if (targetValue[index] && typeof item === 'object' && item !== null) {
                        this._customMerge(targetValue[index], item);
                    } else if (item !== undefined) {
                        targetValue[index] = item;
                    }
                });
            }
            // THE FIX IS HERE: This handles primitives from the source.
            else {
                // ONLY assign the primitive value from the source if the target
                // is not currently an object. This prevents an old number (e.g., `size: 1.1`)
                // from overwriting a new object (e.g., `size: {start, end}`).
                if (typeof targetValue !== 'object' || targetValue === null) {
                    target[key] = sourceValue;
                }
                // If targetValue is an object and sourceValue is a primitive, we do nothing,
                // effectively ignoring the outdated primitive from the saved settings.
            }
        }
    }

    async recordUserChange(path, value) {
        foundry.utils.setProperty(this._userOverrides, path, value);

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = this._userOverrides;
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        this.activeConfig = this._getEffectiveConfig();

        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);
        this.updateUIState();
    }

    async updateAllSystemsFromConfig(options = {}) {
        if (!canvas?.ready) return;

        const config = this.activeConfig;

        // Update all canvas layers that have the update method
        for (const layer of canvas.layers) {
            if (typeof layer.updateFromConfig === 'function') {
                try {
                    await layer.updateFromConfig(config, options);
                } catch (e) {
                    console.error(`MapShine | Error updating layer ${layer.constructor.name}`, e);
                }
            }
        }

        // Update global screen-space filters
        ScreenEffectsManager.updateAllFiltersFromConfig(config);

        // Update tile opacities which also depend on the config
        if (game.mapShine.effectTargetManager) {
            game.mapShine.effectTargetManager.applyTileOpacities();
        }
    }


    async saveConfigToScene() {
        if (!this.isGm) return;

        const configToSave = this._getEffectiveConfig();
        await canvas.scene.setFlag(this.moduleId, 'profile', configToSave);
        ui.notifications.info("FX Profile saved to current scene.");

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        delete allUserOverrides[this.activeSceneId];
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        this.initializeForScene();
        await this.updateAllSystemsFromConfig();
        if (this.ui) {
            this.updateUIState();
            this.ui.eventHandler.updateAllControls();
        }
    }

    async revertToSceneDefault() {
        this._userOverrides = {};
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        delete allUserOverrides[this.activeSceneId];
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

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
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = {};
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

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
        if (!this.ui?.element) return;
        const light = this.ui.element.querySelector('#fx-status-light');
        const text = this.ui.element.querySelector('#fx-status-text');
        const saveSceneBtn = this.ui.element.querySelector('#profile-save-scene');
        const revertSceneBtn = this.ui.element.querySelector('#profile-revert-scene');
        if (saveSceneBtn) saveSceneBtn.style.display = this.isGm ? '' : 'none';
        if (revertSceneBtn) revertSceneBtn.disabled = !this.status.sceneProfileLoaded;
        if (!light || !text) return;
        light.className = 'fx-status-light';

        if (this.status.error) {
            light.classList.add('red');
            text.textContent = `Error: ${this.status.error}`;
        } else if (this.status.sceneProfileLoaded) {
            if (this.status.isDirty) {
                light.classList.add('blue');
                text.textContent = "Scene Default (with your temporary changes)";
            } else {
                light.classList.add('green');
                text.textContent = "Scene Default (active)";
            }
        } else {
            if (this.status.isDirty) {
                light.classList.add('blue');
                text.textContent = "Module Default (with your temporary changes)";
            } else {
                light.classList.add('grey');
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
        if (!profileData) return null;
        let configToLoad = profileData.config || profileData;

        // Sanitize the profile being loaded
        configToLoad = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), foundry.utils.deepClone(configToLoad));

        this._userOverrides = foundry.utils.deepClone(configToLoad);
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = this._userOverrides;
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

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
            if (!overwrite) return false;
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
        if (!name || !this._worldProfiles[name]) return false;
        delete this._worldProfiles[name];
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        if (this.getDefaultProfileName() === name) await this.setDefaultProfile("");
        return true;
    }

    async setDefaultProfile(name) {
        await game.settings.set(this.moduleId, DEFAULT_PROFILE_SETTING, name);
        this._defaultProfileName = name;
        ui.notifications.info(`"${name}" is now the default profile for new scenes.`);
    }

    _cleanObject(obj) {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            if (value === null || value === undefined) return undefined;
            if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return undefined;
            return value;
        }));
    }

    async copySettingsToClipboard() {
        const configToCopy = this._getEffectiveConfig();
        const configString = JSON.stringify(configToCopy, null, 2);

        try {
            await navigator.clipboard.writeText(configString);
            ui.notifications.info("Current FX settings copied to clipboard.");
        } catch (err) {
            console.error("Map Shine | Failed to copy settings to clipboard:", err);
            console.log("--- MAP SHINE: Current Settings Fallback ---");
            console.log(configString);
            console.log("--- END ---");
            ui.notifications.warn("Could not copy to clipboard. Settings logged to console (F12).");
        }
    }

    async pasteSettingsFromClipboard() {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) {
                ui.notifications.warn("Clipboard is empty.");
                return;
            }

            let pastedConfig;
            try {
                pastedConfig = JSON.parse(clipboardText);
            } catch (err) {
                ui.notifications.error("Clipboard content is not valid JSON.");
                console.error("Map Shine | Clipboard parse error:", err);
                return;
            }

            // A simple validation check to see if it looks like one of our configs.
            if (typeof pastedConfig !== 'object' || pastedConfig === null || !pastedConfig.baseShine) {
                ui.notifications.error("Pasted data does not appear to be a valid Map Shine profile.");
                return;
            }

            const sanitizedConfig = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), pastedConfig);

            this._userOverrides = sanitizedConfig;

            const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
            allUserOverrides[this.activeSceneId] = this._userOverrides;
            await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

            this.initializeForScene();
            await this.updateAllSystemsFromConfig();

            if (this.ui) {
                this.updateUIState();
                this.ui.eventHandler.updateAllControls();
            }

            ui.notifications.info("Settings pasted from clipboard and applied as temporary changes.");

        } catch (err) {
            ui.notifications.error("Failed to read from clipboard. Check browser permissions.");
            console.error("Map Shine | Clipboard read error:", err);
        }
    }
}

class DebuggerUIBuilder {
    constructor() {}

    buildRootElement() {
        const element = document.createElement('div');
        element.id = 'material-editor-debugger';
        element.innerHTML = DebuggerUIBuilder._getStyles() + DebuggerUIBuilder._getBaseHTML();

        element.querySelector('#material-editor-top-bar').innerHTML = DebuggerUIBuilder._buildTopBar();
        element.querySelector('#material-editor-time-control-section').innerHTML = this._buildTimeControlSection();
        element.querySelector('#material-editor-profiles-section').innerHTML = DebuggerUIBuilder._buildProfileSection();

        // --- Start of new column distribution logic ---
        const effectSections = this._getEffectSections();
        const totalSections = effectSections.length;

        let numColumns;
        if (totalSections <= 5) { // 1 to 5 items: 1 column
            numColumns = 1;
        } else if (totalSections <= 9) { // 6 to 9 items: 2 columns
            numColumns = 2;
        } else { // 10+ items: 3 columns (maximum)
            numColumns = 3;
        }

        const columnCounts = this._getColumnCounts(totalSections, numColumns);
        let currentSectionIndex = 0;
        let columnsHtml = [];

        for (let i = 0; i < numColumns; i++) {
            const sectionsInThisColumn = effectSections.slice(
                currentSectionIndex,
                currentSectionIndex + columnCounts[i]
            );
            columnsHtml.push(`<div class="fx-column">${sectionsInThisColumn.join('')}</div>`);
            currentSectionIndex += columnCounts[i];
        }

        const contentArea = element.querySelector('.main-content-area');
        contentArea.classList.add(`columns-${numColumns}`); // Add class for CSS
        contentArea.innerHTML = columnsHtml.join('');
        // --- End of new column distribution logic ---

        element.querySelector('#material-editor-bottom-bar').innerHTML = DebuggerUIBuilder._buildBottomBar();

        // Accordion toggle events no longer need special handling for position.
        element.querySelectorAll('details').forEach(detail => {
            detail.addEventListener('toggle', () => {
                /* Future logic can go here if needed */
            });
        });


        return element;
    }

    static _getStyles() {
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
                        gap: 8px; /* Gap between columns */
                        flex-grow: 1;
                        min-height: 0;
                        padding: 4px;
                        background: rgba(0,0,0,0.2);
                        border-radius: 5px;
                        overflow-y: auto;
                        align-items: start; /* Align items to the start of their grid cell */
                    }
                    .main-content-area.columns-1 {
                        grid-template-columns: 1fr;
                    }
                    .main-content-area.columns-2 {
                        grid-template-columns: 1fr 1fr;
                    }
                    .main-content-area.columns-3 {
                        grid-template-columns: 1fr 1fr 1fr;
                    }
                    /* Styling for the new column containers */
                    .fx-column {
                        display: flex;
                        flex-direction: column;
                        gap: 4px; /* Gap between accordions within a column */
                    }
                    /* Adjust details margin-bottom to rely on parent's gap */
                    #material-editor-debugger details {
                        /* ... existing styles ... */
                        margin-bottom: 0; /* Remove this as we'll use gap on parent (.fx-column) */
                    }
                    #material-editor-debugger .top-bar { flex-shrink: 0; display: flex; flex-direction: column; gap: 5px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 5px; }
                    #material-editor-debugger .top-bar-row { display: flex; gap: 10px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
                    #material-editor-debugger .status-group { display: flex; flex-wrap: wrap; gap: 4px 10px; border-left: 2px solid #555; padding-left: 8px; }
                    #material-editor-debugger .status-group-title { font-weight: bold; color: #aaa; }
                    #material-editor-debugger #material-editor-profiles-section > details { margin-bottom: 0; }
                    #material-editor-debugger #material-editor-time-control-section > details { margin-bottom: 0; background-color: rgba(64, 160, 250, 0.1); border-color: #40a0fa; }
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
                    /* Style for the new column wrapper for testing */
                    #new-controls-column-0 { 
                        border: 2px dashed #40a0fa;
                        padding: 5px;
                        border-radius: 5px;
                    }
                    #new-controls-column-0 > details > summary {
                        background-color: rgba(64, 160, 250, 0.2);
                    }
    
        </style>`;
    }

    static _getBaseHTML() {
        return `
                <div id="material-editor-header">
                    <a id="material-editor-help-btn" class="header-btn" href="https://github.com/Garsondee/map-shine" target="_blank" rel="noopener noreferrer" title="Help/Info (Opens GitHub page)">?</a>
                    <h3 id="material-editor-title">Map Shine</h3>
                    <button id="material-editor-minimize-btn" class="header-btn" title="Minimize">-</button>
                    <button id="material-editor-close-btn" class="header-btn" title="Close" style="color: #ff8080;">X</button>
                </div>
    
                <div id="material-editor-top-bar" class="top-bar"></div>
                <div id="material-editor-time-control-section"></div>
                <div id="material-editor-profiles-section"></div>
                <div class="main-content-area"></div>
                <div id="material-editor-bottom-bar"></div>
            `;
    }

    _buildTimeControlSection() {
        return `
            <details id="details-timeControl" open>
                <summary>
                    <span class="accordion-toggle"></span>
                    <strong style="font-size: 1.1em; color: #aadcff;">Time Control</strong>
                </summary>
                <div style="padding-top: 5px;">
                     ${DebuggerUIBuilder._createSliderHTML('timeControl.globalTime', 'Global Time Scale', 0, 100, 1, 'Controls the master speed of all animated effects in this module. 100% is normal speed, 0% is frozen.')}
                </div>
            </details>
            `;
    }

    static _buildBottomBar() {
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

    static _buildTopBar() {
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

    static _buildProfileSection() {
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
                            <hr style="border-color: #555; margin: 4px 0;">
                            <div style="display: flex; gap: 5px;">
                                <button id="profile-copy-settings" title="Copy the current active settings to the clipboard as JSON text.">Copy Settings</button>
                                <button id="profile-paste-settings" title="Load settings from JSON text on the clipboard. This will create unsaved changes.">Paste Settings</button>
                            </div>
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


    static _createSafeId(path) {
        return `control-${path.replace(/\.|\[|\]|\s/g, '-')}`;
    }
    static _createAccordionHTML(id, title, content) {
        const path = `${id}.enabled`;
        return `<details id="details-${id}">
                        <summary>
                            <span class="accordion-toggle"></span>
                            <div class="summary-control">
                                ${DebuggerUIBuilder._createCheckboxHTML(path, title, true)}
                            </div>
                        </summary>
                        <div style="padding-top: 5px;">${content}</div>
                    </details>`;
    }
    static _createCheckboxHTML(path, label, isSummary = false, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        const checkbox = `<div class="widget-group"><input type="checkbox" id="${id}" data-path="${path}"></div>`;
        const labelHtml = isSummary ? `<span class="summary-label" ${titleAttr}>${label}</span>` : `<label for="${id}" class="summary-label" ${titleAttr}>${label}</label>`;
        if (isSummary) {
            return `${labelHtml}${checkbox}`;
        }
        return `<div class="control-row">${labelHtml}${checkbox}</div>`;
    }
    static _createSliderHTML(path, label, min, max, step, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        return `<div class="control-row control-row-slider"><label for="${id}" ${titleAttr}>${label}</label><input type="range" id="${id}" data-path="${path}" min="${min}" max="${max}" step="${step}"><span id="${id}-value" class="value-span">0.0</span></div>`;
    }
    static _createColorPickerHTML(path, label) {
        const id = this._createSafeId(path);
        return `<div class="control-row"><label for="${id}">${label}</label><div class="widget-group" style="flex-grow: 1;"><input type="color" id="${id}" data-path="${path}"></div></div>`;
    }
    static _createSelectHTML(path, label, options, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        const opts = Object.entries(options).map(([k, v]) => `<option value="${v}">${k}</option>`).join('');
        return `<div class="control-row"><label for="${id}" ${titleAttr}>${label}</label><select id="${id}" data-path="${path}">${opts}</select></div>`;
    }
    static _createGradientSelectHTML(path, label) {
        const id = this._createSafeId(path);
        const opts = Object.entries(GRADIENT_PRESETS).map(([name, data]) => {
            const gradientCSS = `linear-gradient(to right, ${data.colors.join(', ')})`;
            return `<option value="${name}" style="background: ${gradientCSS};">${name}</option>`;
        }).join('');
        return `<div class="control-row"><label for="${id}">${label}</label><select id="${id}" data-path="${path}" class="gradient-picker">${opts}</select></div>`;
    }

    static _createTextInputHTML(path, label, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        return `<div class="control-row" style="margin-bottom: 3px;"><label for="${id}" ${titleAttr}>${label}</label><input type="text" id="${id}" data-path="${path}" style="flex-grow:1;font-family:monospace;font-size:10px;"></div>`;
    }

    static _createTextureInputHTML(key, label) {
        return `<div class="control-row" style="margin-bottom: 5px;"><label><span id="status-textures-${key}" class="traffic-light unknown"></span>${label}</label><input type="text" id="texture-path-${key}" disabled title="This path is discovered automatically based on the base map's filename. (e.g., 'map.webp' -> 'map_Specular.webp')"></div>`;
    }

    _getEffectSections() {
        return [
            MetallicShineLayer.getSettingsHTML(),
            WaterFXLayer.getSettingsHTML(),
            CloudShadowsLayer.getSettingsHTML(),
            IridescenceLayer.getSettingsHTML(),
            HeatDistortionLayer.getSettingsHTML(),
            CanopyLayer.getSettingsHTML(),
            StructuralShadowsLayer.getSettingsHTML(),
            AmbientLayer.getSettingsHTML(),
            GroundGlowLayer.getSettingsHTML(),
            PrismLayer.getSettingsHTML(),
            ParticleEffectController.getSettingsHTML('fire'),
            ParticleEffectController.getSettingsHTML('dust'),
            ParticleEffectController.getSettingsHTML('glint'),
            ScreenEffectsManager.getSettingsHTML(),
        ];
    }

    /**
     * Calculates how many items should go into each column for even distribution.
     * @param {number} totalItems - Total number of items to distribute.
     * @param {number} maxColumns - Maximum number of columns desired.
     * @returns {number[]} An array where each element is the count of items for that column.
     *                   e.g., for 14 items and 3 columns: [5, 5, 4]
     */
    _getColumnCounts(totalItems, maxColumns) {
        let numColumns = Math.min(maxColumns, totalItems);
        if (numColumns === 0) return [];

        let counts = Array(numColumns).fill(0);
        let baseItemsPerColumn = Math.floor(totalItems / numColumns);
        let remainder = totalItems % numColumns;

        for (let i = 0; i < numColumns; i++) {
            counts[i] = baseItemsPerColumn + (i < remainder ? 1 : 0);
        }
        return counts;
    }
}

class DebuggerEventHandler {
    constructor(element, profileManager) {
        this.element = element;
        this.profileManager = profileManager;
        this.sliderDebounceTimeout = null;
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
        this.element.addEventListener('input', this._handleGenericInput.bind(this));
        // Use 'change' for sliders to fire only when the user releases the mouse,
        // which is less resource-intensive than 'input'.
        this.element.addEventListener('change', this._handleGenericInput.bind(this));

        const addListener = (selector, event, handler) => {
            const el = this.element.querySelector(selector);
            if (el) {
                el.addEventListener(event, handler.bind(this));
            } else {
                console.warn(`MapShine Debugger: Could not find element with selector '${selector}' to attach event listener.`);
            }
        };

        addListener('#material-editor-close-btn', 'click', this._onClose);
        addListener('#material-editor-minimize-btn', 'click', this._onMinimize);
        addListener('#reload-canvas-btn', 'click', () => window.location.reload());

        // Profile Listeners
        addListener('#profile-save', 'click', this._onSaveProfile);
        addListener('#profile-load', 'click', this._onLoadProfile);
        addListener('#profile-update', 'click', this._onUpdateProfile);
        addListener('#profile-delete', 'click', this._onDeleteProfile);
        addListener('#profile-set-default', 'click', this._onSetDefaultProfile);
        addListener('#profile-save-scene', 'click', () => this.profileManager.saveConfigToScene());
        addListener('#profile-revert-scene', 'click', () => this.profileManager.revertToSceneDefault());
        addListener('#profile-revert-module', 'click', () => this.profileManager.revertToModuleDefault());
        addListener('#output-config-btn', 'click', this._onOutputConfig);
        addListener('#profile-copy-settings', 'click', () => this.profileManager.copySettingsToClipboard());
        addListener('#profile-paste-settings', 'click', () => this.profileManager.pasteSettingsFromClipboard());
    }

    _createSafeId(path) {
        return `control-${path.replace(/\.|\[|\]|\s/g, '-')}`;
    }

    setEffectAvailability(effectKey, isAvailable) {
        if (!this.element) return;
        const detailsElement = this.element.querySelector(`#details-${effectKey}`);
        if (!detailsElement) return;

        const checkboxId = this._createSafeId(`${effectKey}.enabled`);
        const checkboxElement = this.element.querySelector(`#${checkboxId}`);

        if (isAvailable) {
            detailsElement.classList.remove('effect-unavailable');
            if (checkboxElement) checkboxElement.disabled = false;
        } else {
            detailsElement.classList.add('effect-unavailable');
            if (checkboxElement) {
                checkboxElement.disabled = true;
                checkboxElement.checked = false; // Also ensure it's visually off
            }
        }
    }


    _onClose() {
        game.mapShine.debugger?.destroy();
    }

    _onMinimize() {
        this.element.classList.toggle('minimized');
    }

    _getPathValue(obj, path) {
        return foundry.utils.getProperty(obj, path);
    }

    async _handleGenericInput(e) {
        const path = e.target.dataset.path;
        if (!path) return;

        const isSlider = e.target.type === 'range';
        const value = e.target.type === 'checkbox' ? e.target.checked : (isSlider ? Number(e.target.value) : e.target.value);

        // For sliders, update the text display live as the user drags.
        if (isSlider && e.type === 'input') {
            this._updateSliderValue(e.target.id, value, e.target.step);
            // We don't apply the full config update on every input event for performance.
            // The final update happens on the 'change' event when the user releases the slider.
            return;
        }

        // --- Final Change Application (on 'change' event for sliders, or immediately for others) ---
        let processedValue = value;
        if (e.target.tagName === 'SELECT' && !isNaN(Number(value))) {
            processedValue = Number(value);
        }

        // Record the user's change to the temporary override state.
        await this.profileManager.recordUserChange(path, processedValue);

        // Determine if this is a time-only update to prevent particle system resets.
        const updateOptions = {
            timeOnly: path === 'timeControl.globalTime'
        };

        // Now, broadcast the configuration change to all systems.
        // This will either be a full update or a time-only update.
        await this.profileManager.updateAllSystemsFromConfig(updateOptions);

        // Special post-update logic for particles, to ensure emitters are recreated if necessary.
        // This check is now safe because a `timeOnly` update won't require this.
        const isParticleSetting = Object.values(PARTICLE_EFFECT_DEFINITIONS).some(def => path.startsWith(def.configPath));
        if (isParticleSetting && !updateOptions.timeOnly) {
            const particleLayer = canvas.layers.find(l => l instanceof ParticleLayer);
            if (particleLayer && game.mapShine.effectTargetManager.targets) {
                await particleLayer.updateEffectTargets(game.mapShine.effectTargetManager.targets);
            }
        }

        // Finally, update the UI visuals based on the applied change.
        if (isSlider) {
            this._updateSliderValue(e.target.id, value, e.target.step);
        }
        if (e.target.type === 'checkbox' && e.target.closest('.summary-control')) {
            const detailsElement = e.target.closest('details');
            if (detailsElement) detailsElement.classList.toggle('disabled-effect', !e.target.checked);
        }
        if (path === 'baseShine.patternType') {
            this._updatePatternControlVisibility();
        }
        if (path === 'tileOpacity') {
            game.mapShine.effectTargetManager.applyTileOpacities();
        }
    }

    updateAllControls() {
        if (!this.element) return;
        this.element.querySelectorAll('[data-path]').forEach(el => {
            const path = el.dataset.path;
            const value = this._getPathValue(this.config, path);
            if (value === undefined || value === null) return;

            if (el.type === 'checkbox') el.checked = Boolean(value);
            else el.value = value;

            if (el.type === 'range') this._updateSliderValue(el.id, value, el.step);

            if (el.closest('.summary-control')) {
                const detailsElement = el.closest('details');
                if (detailsElement) detailsElement.classList.toggle('disabled-effect', !el.checked);
            }
        });
        this._updatePatternControlVisibility();

        // Update time control slider separately as it's not in the main config
        const timeSlider = this.element.querySelector('#control-timeControl-globalTime');
        if (timeSlider) {
            const timeValue = (game.mapShine.timeControl.timeFactor ?? 1.0) * 100;
            timeSlider.value = timeValue;
            this._updateSliderValue(timeSlider.id, timeValue, timeSlider.step);
        }
    }

    applyProfileUIState(profileData) {
        if (!profileData?.ui?.details) return;
        for (const [id, isOpen] of Object.entries(profileData.ui.details)) {
            const detailElement = this.element.querySelector(`#${id}`);
            if (detailElement) detailElement.open = isOpen;
        }
    }

    _updateSliderValue(elementId, value, step) {
        const valueEl = this.element.querySelector(`#${elementId}-value`);
        if (valueEl) {
            const stepString = String(step);
            const decimals = stepString.includes('.') ? stepString.split('.')[1].length : 0;
            valueEl.textContent = Number(value).toFixed(decimals);
        }
    }

    _updatePatternControlVisibility() {
        const patternType = this._getPathValue(this.config, 'baseShine.patternType');
        const isStripes = patternType === 'stripes';
        const stripesControls = this.element.querySelector('#pattern-stripes-controls');
        const checkerControls = this.element.querySelector('#pattern-checkerboard-controls');

        if (stripesControls) stripesControls.style.display = isStripes ? '' : 'none';
        if (checkerControls) checkerControls.style.display = isStripes ? 'none' : '';
    }

    async _populateProfilesDropdown() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const profiles = await this.profileManager.getProfiles();
        const names = Object.keys(profiles).sort();
        const defaultProfileName = this.profileManager.getDefaultProfileName();

        dropdown.innerHTML = '';
        if (names.length) {
            names.forEach(n => {
                const isDefault = (n === defaultProfileName) ? ' (Default)' : '';
                dropdown.add(new Option(`${n}${isDefault}`, n));
            });
            dropdown.value = defaultProfileName || names[0];
            dropdown.disabled = false;
        } else {
            dropdown.add(new Option('No profiles saved', ''));
            dropdown.disabled = true;
        }
    }

    async _onSaveProfile() {
        const nameInput = this.element.querySelector('#profile-name');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        const uiState = {
            details: {}
        };
        this.element.querySelectorAll('details[id]').forEach(el => {
            uiState.details[el.id] = el.open;
        });
        const success = await this.profileManager.saveProfile(name, this.profileManager.activeConfig, uiState);
        if (success) {
            nameInput.value = '';
            this._populateProfilesDropdown();
        }
    }

    async _onUpdateProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
        const uiState = {
            details: {}
        };
        this.element.querySelectorAll('details[id]').forEach(el => {
            uiState.details[el.id] = el.open;
        });
        const success = await this.profileManager.updateProfile(name, this.profileManager.activeConfig, uiState);
        if (success) {
            this._populateProfilesDropdown();
        }
    }

    async _onLoadProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
        if (name) await this.profileManager.loadProfile(name);
    }

    async _onDeleteProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
        if (!name) return;
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
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
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
        const header = elmnt.querySelector('#material-editor-header');
        if (!header) return;
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;

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

            // Get window and element dimensions
            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;
            const elmntWidth = elmnt.offsetWidth;
            const headerHeight = header.offsetHeight;
            const minVisibleWidth = 100; // Minimum pixels to keep visible on the sides

            // Clamp vertical position
            newTop = Math.max(0, newTop); // Prevent top from going above the viewport
            newTop = Math.min(newTop, winHeight - headerHeight); // Prevent bottom from going above where the header would be

            // Clamp horizontal position
            newLeft = Math.max(newLeft, -elmntWidth + minVisibleWidth); // Prevent left side from disappearing too much
            newLeft = Math.min(newLeft, winWidth - minVisibleWidth); // Prevent right side from disappearing too much

            elmnt.style.top = `${newTop}px`;
            elmnt.style.left = `${newLeft}px`;
        };

        const closeDragElement = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };
        header.onmousedown = dragMouseDown;
    }
}

class MaterialEditorDebugger {
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

        // Set the initial position of the window to be stable
        const initialTop = 80; // A fixed distance from the top of the viewport
        const initialLeft = (window.innerWidth - this.element.offsetWidth) / 2;
        this.element.style.top = `${initialTop}px`;
        this.element.style.left = `${initialLeft}px`;

        // When the UI is created, immediately populate all indicators from the current system status.
        this._populateAllIndicators();
        // Then, subscribe to any future changes.
        systemStatus.on('statusChanged', this._boundUpdateIndicator);

        console.log("Material Editor | UI system initialized and subscribed to status updates.");
    }

    destroy() {
        systemStatus.off('statusChanged', this._boundUpdateIndicator);
        this.element?.remove();
        this.element = null;
        this.uiBuilder = null;
        this.eventHandler = null;
        this.profileManager = null;
        game.mapShine.debugger = null;

        // ADD THIS LINE to force the scene controls to re-render
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
        if (category === 'textures') {
            const pathInput = this.element.querySelector(`#texture-path-${key}`);
            if (pathInput) {
                pathInput.value = statusObject.message;
                pathInput.title = statusObject.message;
            }
        }
    }
}

// =================================================================================
// SECTION 7: HOOKS
// =================================================================================
// Description: The main init hook that registers all layers, settings, and hooks.
//              Also contains template/example code.
// ---------------------------------------------------------------------------------

Hooks.once('init', () => {
    if (game.mapShine?.initialized) {
        console.log("Map Shine | Initialization aborted: module has already been initialized.");
        return;
    }

    game.mapShine = {
        initialized: true,
        isCustomPaused: false,
        pauseEffectManager: new PauseEffectManager(),
        timeControl: { timeFactor: 1.0 },
        systemsReady: false,
        loadingScreen: null,
        profileManager: new ProfileManager(),
        debugger: null,
        particleManager: null,
        fireWindManager: null,

        effectTargetManager: {
            targets: {
                background: null,
                tiles: new Map()
            },
            async refresh() {
                console.log("MapShine | Refreshing effect targets and updating system status...");
                const loader = new TextureAutoLoader();
                this.targets = await loader.discoverAllTargets();

                const allTargets = [this.targets.background, ...this.targets.tiles.values()].filter(t => t);
                for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
                    const foundPath = allTargets.map(t => t[key]).find(p => p);
                    if (foundPath) {
                        systemStatus.update('textures', key, {
                            state: 'ok',
                            message: foundPath
                        });
                    } else {
                        systemStatus.update('textures', key, {
                            state: 'inactive',
                            message: 'Auto-discovery found no matching file.'
                        });
                    }
                }

                this.applyTileOpacities();
                await this.broadcastUpdate();

                if (canvas.ready) {
                    MapShineLifecycle.finalizeConfigurationAndUI();
                }

                Hooks.callAll('mapShine:targetsRefreshed');
            },
            async broadcastUpdate() {
                const updatePromises = [];
                for (const layer of canvas.layers) {
                    if (typeof layer.updateEffectTargets === 'function') {
                        updatePromises.push(layer.updateEffectTargets(this.targets));
                    }
                }
                await Promise.all(updatePromises);
            },
            applyTileOpacities() {
                const config = game.mapShine.profileManager.activeConfig;
                for (const tile of canvas.tiles.placeables) {
                    if (!tile.mesh) continue;
                    const isTargetWithEffects = this.targets.tiles.has(tile.id) && config.enabled;
                    if (isTargetWithEffects) {
                        tile.mesh.alpha = config.tileOpacity;
                    } else {
                        tile.mesh.alpha = 1.0;
                    }
                }
            }
        },

        showEditor: async function() {
            if (game.mapShine.debugger) {
                game.mapShine.debugger.element.classList.remove('minimized');
                return;
            }
            game.mapShine.debugger = new MaterialEditorDebugger();
            game.mapShine.debugger.initialize(game.mapShine.profileManager);
            await game.mapShine.profileManager.initializeUI(game.mapShine.debugger);
        }
    };

    console.log("Map Shine | Library Test: Verifying PIXI.particles global.");
    if (PIXI.particles && typeof PIXI.particles.Emitter === 'function') {
        console.log("%cSUCCESS:", "color: #4CAF50; font-weight: bold;", "pixi-particles library loaded correctly onto PIXI object.");
        PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(TextureMaskShape);
    } else {
        console.error("FAILURE: pixi-particles library did not attach to the global PIXI object.");
    }

    game.settings.register(MODULE_ID, 'disable-loading-screen', {
        name: "Disable Loading Screen",
        hint: "Completely disables the loading screen feature. Disabling this may cause some effects and layers to pop into existence a moment after the scene has finished loading, which can be jarring. Recommended to keep enabled unless it causes issues.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });


    // --- Global Accessibility Settings ---
    game.settings.register(MODULE_ID, 'user-disable-distortion', {
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
        },
    });

    game.settings.register(MODULE_ID, 'user-disable-color-fringe', {
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
        },
    });

    // --- Per-Effect Override Settings ---
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
            },
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
                },
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

    game.settings.register(MODULE_ID, 'user-adjustments', {
        name: "User-specific FX Overrides",
        scope: "client",
        config: false,
        type: Object,
        default: {}
    });

    game.settings.register(MODULE_ID, 'ambientLayerZIndex', {
        name: "Ambient Layer Z-Index (Requires Reload)",
        hint: "Controls the rendering order of the Ambient/Emissive layer. Changes require a canvas reload.",
        scope: "client",
        config: false,
        type: Number,
        default: 250
    });

    game.settings.register(MODULE_ID, 'showDustMaskDebug', {
        name: "Show Dust Mask (Debug)",
        hint: "The new particle system does not have a single combined mask, so this debug view is no longer applicable.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    

    
    

    Hooks.on('lightingRefresh', () => {
        if (canvas?.ready && game.mapShine?.profileManager?.activeConfig) {
            game.mapShine.profileManager.updateAllSystemsFromConfig();
        }
    });


    Hooks.on('getSceneControlButtons', (controls) => {
        // This hook should only run for Game Masters.
        if (!game.user.isGM) return;

        // Define the new control group.
        const mapShineGroup = {
            name: "map-shine", // A unique machine-readable name for the group
            title: "Map Shine", // The tooltip title for the group icon
            icon: "fas fa-star", // The icon for the group on the left bar

            // THE FIX IS HERE: 'tools' must be an OBJECT, not an array.
            // The key of each entry in this object is the tool's unique name.
            tools: {
                editor: { // This is the tool's name, used in 'activeTool' below.
                    title: "Toggle Map Shine Editor", // Tooltip for the actual button
                    icon: "fas fa-sliders-h", // Icon for the actual button
                    toggle: true,
                    active: !!game.mapShine?.debugger, // Set initial active state
                    onClick: (toggled) => {
                        if (toggled) {
                            game.mapShine?.showEditor();
                        } else {
                            game.mapShine?.debugger?.destroy();
                        }
                    }
                }
            },
            activeTool: "editor" // The name of the tool that should be active in this group.
        };

        // Add our new group to the controls object by assigning it a new key.
        controls["map-shine"] = mapShineGroup;
    });


    // --- LAYER REGISTRATION ---
    const ambientZIndex = game.settings.get(MODULE_ID, 'ambientLayerZIndex');

    Object.assign(CONFIG.Canvas.layers, {
        mapShineBackground: {
            layerClass: BackgroundLayer,
            group: "primary"
        },
        groundGlow: {
            layerClass: GroundGlowLayer,
            group: "environment"
        },
        prism: {
            layerClass: PrismLayer,
            group: "primary"
        },
        iridescence: {
            layerClass: IridescenceLayer,
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
        metallicShine: {
            layerClass: MetallicShineLayer,
            group: "primary"
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
        particleLayer: {
            layerClass: ParticleLayer,
            group: "environment"
        },
        waterFX: {
            layerClass: WaterFXLayer,
            group: "primary"
        },
        heatDistortion: {
            layerClass: HeatDistortionLayer,
            group: "primary"
        },
    });

    console.log(`MaterialToolkit | Registered all settings and layers. AmbientLayer zIndex set to: ${ambientZIndex}.`);

    // GNU Terry Pratchett
    console.log(`GNU Terry Pratchett: For as long as his name is still passed along the clacks, Death can't have him.`);

    Hooks.on("createTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("updateTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("deleteTile", () => game.mapShine?.effectTargetManager.refresh());

    Hooks.on('canvasReady', MapShineLifecycle.onCanvasReady);
    Hooks.on('canvasTearDown', MapShineLifecycle.onCanvasTearDown);
});