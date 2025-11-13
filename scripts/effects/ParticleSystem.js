import { AnimatedCanvasLayer } from "../layers/AnimatedCanvasLayer.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { MAX_DELTA_TIME } from "../config/constants.js";
import { hexToRgbArray } from "../utils/ColorUtils.js";
import { EFFECT_SOURCE_OPTIONS } from "../config/presets.js";
import { BLEND_MODE_OPTIONS } from "../config/blend-modes.js";

// Local fallback: use global helper if present, otherwise define a minimal safe applier
const safeApplyFilters = (globalThis && typeof globalThis.safeApplyFilters === "function")
  ? globalThis.safeApplyFilters
  : function(container, filters, context = "ParticleSystem") {
      try {
        if (!container) {
          console.warn(`Map Shine | safeApplyFilters (${context}): Container is null`);
          return false;
        }
        const cleaned = (filters || []).filter(f => !!f);
        if (cleaned.length === 0) {
          container.filters = null;
          return false;
        }
        container.filters = cleaned;
        return true;
      } catch (err) {
        console.error(`Map Shine | safeApplyFilters (${context}): Exception applying filters`, err);
        try { container.filters = null; } catch (_) {}
        return false;
      }
    };

// Safe accessor for Map Points groups to avoid ReferenceError when manager isn't loaded yet
function getMapPointsGroups() {
  try {
    const mgr = game?.mapShine?.mapPointsManager;
    if (mgr && typeof mgr.getGroups === "function") return mgr.getGroups();
  } catch (_) {}
  return {};
}

// Ensure the custom geometry spawn shape is registered with PIXI.particles
let __geometryShapeRegistered = false;
function ensureGeometryShapeRegistered() {
  if (__geometryShapeRegistered) return true;
  try {
    const ShapeSpawn = PIXI?.particles?.behaviors?.ShapeSpawnBehavior;
    const GeometryMaskShape = globalThis && globalThis.GeometryMaskShape;
    if (ShapeSpawn && typeof ShapeSpawn.registerShape === "function" && GeometryMaskShape) {
      ShapeSpawn.registerShape(GeometryMaskShape);
      __geometryShapeRegistered = true;
      return true;
    }
  } catch (_) {}
  return false;
}

// =================================================================================
// HELPER FUNCTIONS
// =================================================================================

// Safely detect if the Pixi BatchRenderer is initialized enough to accept work
// Keep this permissive: requiring internal buffers can be version-fragile and block rendering
function isBatchRendererReady() {
  try {
    const renderer = canvas?.app?.renderer;
    if (!renderer || renderer.destroyed) return false;
    // Presence of the batch plugin is sufficient; Pixi will lazily set up buffers on demand
    return !!renderer.plugins?.batch;
  } catch (_) {
    return false;
  }
}

/**
 * Generates separate color and alpha lists for the particle emitter from a single gradient array.
 * @param {Array<object>} gradient - An array of stop objects, each with {time, color, alpha}.
 * @returns {{isColorStatic: boolean, staticColor?: string, colorList?: object, isAlphaStatic: boolean, staticAlpha?: number, alphaList?: object}}
 */
function _generateBehaviorListsFromGradient(gradient) {
  if (!gradient || gradient.length === 0) {
    return {
      isColorStatic: true,
      staticColor: "#ffffff",
      isAlphaStatic: true,
      staticAlpha: 1.0,
    };
  }

  const sortedGradient = [...gradient].sort((a, b) => a.time - b.time);

  const firstColor = sortedGradient[0].color;
  const allColorsSame = sortedGradient.every((stop) => stop.color === firstColor);

  const firstAlpha = sortedGradient[0].alpha;
  const allAlphasSame = sortedGradient.every(
    (stop) => Math.abs(stop.alpha - firstAlpha) < 0.001
  );

  const result = {
    isColorStatic: allColorsSame,
    isAlphaStatic: allAlphasSame,
  };

  if (allColorsSame) {
    result.staticColor = firstColor;
  } else {
    result.colorList = {
      list: sortedGradient.map((s) => ({ value: s.color, time: s.time })),
    };
  }

  if (allAlphasSame) {
    result.staticAlpha = firstAlpha;
  } else {
    result.alphaList = {
      list: sortedGradient.map((s) => ({ value: s.alpha, time: s.time })),
    };
  }

  return result;
}

/**
 * Generates an emissive color list from a gradient for use in particle behaviors.
 * Preserves RGB tint and computes brightness from luminance and alpha.
 * @param {Array<object>} gradient - An array of stop objects, each with {time, color, alpha}.
 * @returns {{colorList: object, brightnessList: object}}
 */
function _generateEmissiveColorListFromGradient(gradient) {
  if (!gradient || gradient.length < 1) {
    return {
      colorList: { list: [{ value: 0xffffff, time: 0 }] },
      brightnessList: { list: [{ value: 0, time: 0 }] },
    };
  }

  const sortedGradient = [...gradient].sort((a, b) => a.time - b.time);
  const colorList = [];
  const brightnessList = [];
  const lum_weights = { r: 0.299, g: 0.587, b: 0.114 };

  for (const stop of sortedGradient) {
    const rgb = hexToRgbArray(stop.color); // [0-1, 0-1, 0-1]

    const r8 = Math.round(rgb[0] * 255);
    const g8 = Math.round(rgb[1] * 255);
    const b8 = Math.round(rgb[2] * 255);
    const tintValue = (r8 << 16) | (g8 << 8) | b8;

    const luminance =
      rgb[0] * lum_weights.r + rgb[1] * lum_weights.g + rgb[2] * lum_weights.b;
    const brightnessValue = luminance * (stop.alpha ?? 1.0);

    colorList.push({ value: tintValue, time: stop.time });
    brightnessList.push({ value: brightnessValue, time: stop.time });
  }

  // Avoid identical values triggering PropertyNode bugs
  if (brightnessList.length > 1) {
    const firstBrightness = brightnessList[0].value;
    const allBrightnessSame = brightnessList.every(
      (item) => Math.abs(item.value - firstBrightness) < 0.001
    );
    if (allBrightnessSame) {
      return {
        colorList: { list: colorList },
        brightnessList: { list: [{ value: firstBrightness, time: 0 }] },
      };
    }
  }

  return {
    colorList: { list: colorList },
    brightnessList: { list: brightnessList },
  };
}

class ParticleManager {
  constructor() {
    this.masterContainer = new PIXI.Container();
    this.controllers = new Map();
    this._processingPending = false;
  }

  get totalParticleCount() {
    let count = 0;
    for (const controller of this.controllers.values()) {
      for (const { emitter } of controller.emitters.values()) {
        count += emitter.particleCount;
      }
    }
    return count;
  }

  initialize() {
    for (const [key, definition] of Object.entries(
      PARTICLE_EFFECT_DEFINITIONS
    )) {
      if (key === "smellyFlies") continue;

      const effectContainer = new PIXI.Container();
      const controller = new ParticleEffectController(
        key,
        definition,
        effectContainer
      );
      this.controllers.set(key, controller);

      this.masterContainer.addChild(effectContainer);
    }
    console.log(
      `Map Shine | ParticleManager initialized with ${this.controllers.size} effect controllers.`
    );
  }

  updateEffectTargets(targets, options = {}) {
    if (!this.controllers.size) return;
    const config = game.mapShine.profileManager.activeConfig;
    const changedGroupId = options?.changedGroupId;

    if (changedGroupId) {
      console.log(
        `Map Shine | ParticleManager: Targeting rebuild for changed group: ${changedGroupId}`
      );
    }

    for (const controller of this.controllers.values()) {
      controller.updateTargets(targets, config, { changedGroupId });
    }
  }

  updateFromConfig(config) {
    for (const controller of this.controllers.values()) {
      controller.updateFromConfig(config);
    }
  }

  async processAllPendingTargets() {
    if (this._processingPending) return; // Already processing
    this._processingPending = true;
    try {
      const promises = [];
      for (const controller of this.controllers.values()) {
        promises.push(controller.processAllPendingTargets());
      }
      await Promise.all(promises);
    } finally {
      this._processingPending = false;
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
      children: true,
    });
    console.log("Map Shine | ParticleManager destroyed.");
  }
}

const PARTICLE_EFFECT_DEFINITIONS = {
  dust: {
    title: "Dust Motes",
    description:
      "Floating dust particles that appear in areas defined by the _Dust map. Requires a _Dust.webp texture.",
    configPath: "dust",
    triggerTexture: "dust",
    buildEmitterConfig: (effectConfig, targetData) =>
      buildParticleEmitterConfig(effectConfig, targetData, "dust"),
  },
  glint: {
    title: "Glint Particles",
    description:
      "Sparkling glints that appear in areas defined by the _Prism map. Requires a _Prism.webp texture.",
    configPath: "glint",
    triggerTexture: "prism",
    buildEmitterConfig: (effectConfig, targetData) =>
      buildParticleEmitterConfig(effectConfig, targetData, "prism"),
  },
  candleFlame: {
    title: "Candle Flame",
    description:
      "A jiggling flame effect suitable for candles viewed from above. Requires a Point group from Map Points.",
    configPath: "candleFlame",
    triggerTexture: "candleFlame", // This is a dummy key, effect is geometry-based
    buildEmitterConfig: (effectConfig, targetData, maskKey, group) =>
      buildCandleFlameEmitterConfig(effectConfig, targetData, group),
  },
  smellyFlies: {
    title: "Smelly Flies",
    description:
      "Simulates a swarm of flies orbiting a central point, occasionally landing and walking around. Requires a Point or Area group from Map Points. The first point of the group defines the center of the swarm, and the area defines where they can walk.",
    configPath: "smellyFlies",
    triggerTexture: "smellyFlies", // This is a dummy key for the UI, effect is geometry-based

    buildEmitterConfig: (effectConfig, targetData, maskKey, group) =>
      buildSmellyFliesEmitterConfig(effectConfig, targetData, group),
  },
  waterGlints: {
    title: "Water Glints / Spray",
    description:
      "General-purpose particles spawned across the entire water surface.",
    configPath: "water.glintParticles",
    triggerTexture: "water",
    spawnOn: "tiles",
    buildEmitterConfig: (effectConfig, targetData) =>
      buildParticleEmitterConfig(effectConfig, targetData, "water"),
  },
  fire: {
    title: "Flames",
    description:
      "A fire effect with animated flame particles. Requires a _Fire.webp map where white areas are the heart of the flame.",
    configPath: "fire.particles",
    triggerTexture: "fire",
    buildEmitterConfig: (effectConfig, targetData) =>
      buildParticleEmitterConfig(effectConfig, targetData, "fire"),
  },
  metallicGlints: {
    title: "Metallic Glints",
    description:
      "Sparkling glints that appear on specular surfaces. Requires a _Specular.webp map.",
    configPath: "metallicGlints",
    triggerTexture: "specular",
    buildEmitterConfig: (effectConfig, targetData) =>
      buildParticleEmitterConfig(effectConfig, targetData, "specular"),
  },
  sparks: {
    title: "Sparks",
    description:
      "Creates sparks that fly off in turbulent paths. Requires a _Sparks.webp map.",
    configPath: "sparks",
    triggerTexture: "sparks",
    buildEmitterConfig: (effectConfig, targetData) =>
      buildSparkEmitterConfig(effectConfig, targetData, "sparks"),
  },
  biofilm: {
    title: "Water Splashes",
    description:
      "Big splashy particles which are spawned near hard water edges.",
    configPath: "biofilm",
    triggerTexture: "water",
    buildEmitterConfig: (effectConfig, targetData) =>
      buildParticleEmitterConfig(effectConfig, targetData, "water", null, {
        spawnMode: "range",
      }),
  },
  pressurisedSteam: {
    title: "Pressurised Steam",
    description:
      "Creates intermittent bursts of steam from defined areas. Requires a _Steam.webp texture or a Map Point group.",
    configPath: "pressurisedSteam",
    triggerTexture: "steam",
    buildEmitterConfig: (effectConfig, targetData, maskKey, groupData) =>
      buildPressurisedSteamEmitterConfig(
        effectConfig,
        targetData,
        maskKey || "steam",
        groupData
      ),
  },
};

class ParticleEffectController {
  constructor(key, definition, parentContainer) {
    this.key = key;
    this.definition = definition;
    this.parentContainer = parentContainer; // This is the main container from ParticleManager
    this.emitters = new Map();
    this.pendingTargets = new Map();
    this.config = {};
    
    // Rate limiting for UI-triggered rebuilds - prevents rapid slider changes from causing orphaned particles
    this._lastRebuildTime = 0;
    this._rebuildCooldown = 5000; // Minimum 5 seconds between rebuilds
    this._pendingRebuild = null; // Stores pending rebuild request during cooldown
    this._rebuildDebounceTimer = null; // Debounce timer for rapid changes
    
    this.rgbSplitFilter = null;
    this.cloudSuppressorFilter = null;
    this.fireToneFilter = null;
    this.fireColorCorrectionFilter = null;

    // Defer biofilm-specific resource creation
    this.displacementFilter = null;
    this.displacementSprite = null;
    this.biofilmMaskFilter = null;
    this.particleOutputTexture = null;

    this.particleOnlyContainer = null;

    // Special handling for effects with filters that need to operate on blended particles
    if (definition.configPath === "glint") {
      this.rgbSplitFilter = new ParticleRgbSplitFilter();
    }

    // Create the suppressor filter for the specified particle effects.
    if (
      definition.configPath === "glint" ||
      definition.configPath === "metallicGlints" ||
      definition.configPath === "water.glintParticles"
    ) {
      this.cloudSuppressorFilter = new CloudSuppressorFilter();
    }
  }

  /**
   * Initializes biofilm-specific PIXI resources on demand.
   * This ensures resources are created only when the canvas is fully ready.
   * @private
   */
  _initializeBiofilmResources() {
    // This is a one-time initialization. If resources exist, do nothing.
    if (this.particleOutputTexture) return;

    // Use global coordinate manager if available, otherwise fall back to canvas screen size
    const screen = (game?.mapShine?.coordinateManager?.getScreenDimensions?.()) || canvas?.app?.screen || { width: 0, height: 0 };

    this.particleOutputTexture = PIXI.RenderTexture.create({
      width: screen.width,
      height: screen.height,
    });

    this.displacementSprite = new PIXI.Sprite();

    this.displacementFilter = new PIXI.DisplacementFilter(
      this.displacementSprite
    );
    this.biofilmMaskFilter = new BiofilmMaskFilter();
    this.parentContainer.filterArea = canvas.app.screen; // Crucial for filters on containers
  }

  static getSettingsHTML(effectKey) {
    const definition = PARTICLE_EFFECT_DEFINITIONS[effectKey];
    if (!definition) return "";

    const path = definition.configPath;
    let content = `<p class="description-text">${definition.description}</p>`;
    content += DebuggerUIBuilder._createSelectHTML(
      `${path}.blendMode`,
      "Blend Mode",
      BLEND_MODE_OPTIONS
    );

    if (effectKey === "sparks") {
      const sparksPath = "sparks";
      let sparksContent = `
                    <p class="description-text">${definition.description}</p>
                    <details>
                      <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                      <div style="padding-left: 5px;">
                        ${DebuggerUIBuilder._createTextureInputHTML(
                          definition.triggerTexture,
                          `Effect Mask (_${
                            definition.triggerTexture.charAt(0).toUpperCase() +
                            definition.triggerTexture.slice(1)
                          })`
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `${sparksPath}.maskInfluence`,
                          "Particle Density",
                          0.01,
                          5,
                          0.01
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `${sparksPath}.frequency`,
                          "Spawn Rate (s)",
                          0.01,
                          2,
                          0.01
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `${sparksPath}.maskThreshold`,
                          "Mask Threshold",
                          0,
                          1,
                          0.01,
                          "Luminance from the _Sparks map required to spawn sparks."
                        )}
                      </div>
                    </details>
                    <details>
                      <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                      <div style="padding-left: 5px;">
                        ${DebuggerUIBuilder._createSelectHTML(
                          `${sparksPath}.blendMode`,
                          "Blend Mode",
                          BLEND_MODE_OPTIONS
                        )}
                        ${DebuggerUIBuilder._createTextInputHTML(
                          `${sparksPath}.particleTexture`,
                          "Particle Texture"
                        )}
                        <details>
                          <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                          <div style="padding-left: 5px;">
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.lifetime.min`,
                              "Min Lifetime (s)",
                              0.5,
                              5,
                              0.1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.lifetime.max`,
                              "Max Lifetime (s)",
                              0.5,
                              5,
                              0.1
                            )}
                          </div>
                        </details>

                        ${DebuggerUIBuilder._createGradientEditorHTML(
                          `${sparksPath}.colorAlphaGradient`,
                          "Color & Alpha Over Life"
                        )}
                        ${DebuggerUIBuilder._createGradientEditorHTML(
                          `${sparksPath}.emissiveGradient`,
                          "Emissive (Brightness) Over Life"
                        )}

                        <details>
                          <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                          <div style="padding-left: 5px;">
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.scale.sizeMultiplier`,
                              "Global Size",
                              0.1,
                              2,
                              0.05
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.scale.start`,
                              "Start Scale",
                              0.1,
                              2,
                              0.05
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.scale.end`,
                              "End Scale",
                              0,
                              2,
                              0.05
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.scale.minMult`,
                              "Random Size Min",
                              0.1,
                              1,
                              0.01
                            )}
                          </div>
                        </details>
                      </div>
                    </details>
                    <details>
                      <summary><span class="accordion-toggle"></span><strong>Movement (Spark Path)</strong></summary>
                      <div style="padding-left: 8px;">
                        <details>
                          <summary><span class="accordion-toggle"></span><strong>Speed Along Path</strong></summary>
                          <div style="padding-left: 8px;">
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.speed.start`,
                              "Start Speed",
                              10,
                              200,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.speed.end`,
                              "End Speed",
                              10,
                              200,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.speed.minMult`,
                              "Random Speed Min",
                              0.1,
                              1,
                              0.01
                            )}
                          </div>
                        </details>
                        <details>
                          <summary><span class="accordion-toggle"></span><strong>Path Shape</strong></summary>
                          <div style="padding-left: 8px;">
                            <p class="description-text">Controls the random sine wave path for each spark.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.amplitude.min`,
                              "Min Wave Width",
                              0,
                              100,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.amplitude.max`,
                              "Max Wave Width",
                              0,
                              100,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.frequency.min`,
                              "Min Wave Freq",
                              10,
                              200,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.frequency.max`,
                              "Max Wave Freq",
                              10,
                              200,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.damping`,
                              "Damping",
                              0,
                              1,
                              0.05,
                              "How quickly the path straightens out over the spark\\s life."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.angle.min`,
                              "Min Start Angle",
                              -90,
                              90,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.angle.max`,
                              "Max Start Angle",
                              -90,
                              90,
                              1
                            )}
                          </div>
                        </details>
                        <details>
                          <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                            `${sparksPath}.path.motionBlur.enabled`,
                            "Motion Blur",
                            true
                          )}</div></summary>
                          <div style="padding-left: 8px;">
                            <p class="description-text">Stretches particles based on their speed to simulate motion blur.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.motionBlur.strength`,
                              "Strength",
                              0,
                              1,
                              0.01,
                              "Multiplier for how much speed affects particle length."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${sparksPath}.path.motionBlur.maxLength`,
                              "Max Length",
                              0,
                              10,
                              0.1,
                              "The maximum amount to stretch the particle scale."
                            )}
                          </div>
                        </details>
                      </div>
                    </details>
                    
                    ${DebuggerUIBuilder._createEffectPointGroupsHTML("sparks", {
                      effectName: "Sparks",
                      defaultGroupType: "area",
                      description:
                        "Create spark particle spawn areas. Draw areas or lines where sparks should emit.",
                    })}
                  `;
      const headerExtra = `<button type="button" class="create-effect-from-ui" data-action="create-particle-effect-area" data-effect-key="${effectKey}" title="Create new area for this particle effect" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 250, 64, 0.5); background: rgba(76, 250, 64, 0.15); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-plus-square" style="font-size: 12px; pointer-events: none; color: #6fdd73;"></i></button>`;
      return DebuggerUIBuilder._createAccordionHTML(
        effectKey,
        definition.title,
        sparksContent,
        headerExtra
      );
    } else if (effectKey === "fire") {
      const firePath = "fire.particles";
      const headerExtra = `<button type="button" class="create-effect-from-ui" data-action="create-particle-effect-area" data-effect-key="${effectKey}" title="Create new area for this particle effect" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 250, 64, 0.5); background: rgba(76, 250, 64, 0.15); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-plus-square" style="font-size: 12px; pointer-events: none; color: #6fdd73;"></i></button>`;
      const fireContent = `
          <p class="description-text">${definition.description}</p>
          ${DebuggerUIBuilder._createTextureInputHTML(
            definition.triggerTexture,
            `Effect Mask (_${
              definition.triggerTexture.charAt(0).toUpperCase() +
              definition.triggerTexture.slice(1)
            })`
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${firePath}.maskInfluence`,
            "Particle Density",
            0.01,
            5,
            0.01
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${firePath}.maskThreshold`,
            "Mask Threshold",
            0,
            1,
            0.01
          )}

          <details>
            <summary><span class="accordion-toggle"></span><strong>Appearance</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSelectHTML(
                `${firePath}.blendMode`,
                "Blend Mode",
                BLEND_MODE_OPTIONS
              )}
              ${DebuggerUIBuilder._createTextInputHTML(
                `${firePath}.particleTexture`,
                "Particle Texture"
              )}
              ${DebuggerUIBuilder._createGradientEditorHTML(
                `${firePath}.colorAlphaGradient`,
                "Color & Alpha Over Life"
              )}
              ${DebuggerUIBuilder._createGradientEditorHTML(
                `${firePath}.emissiveGradient`,
                "Emissive Over Life"
              )}
            </div>
          </details>
          
          <details>
            <summary><span class="accordion-toggle"></span><strong>Spawning & Lifetime</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.frequency`,
                "Spawn Rate (s)",
                0.001,
                0.1,
                0.001
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.lifetime.min`,
                "Min Lifetime (s)",
                0.1,
                5,
                0.1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.lifetime.max`,
                "Max Lifetime (s)",
                0.1,
                5,
                0.1
              )}
            </div>
          </details>
          
          <details>
            <summary><span class="accordion-toggle"></span><strong>Shape & Size</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.scale.sizeMultiplier`,
                "Global Size",
                0.01,
                3,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.scale.start`,
                "Start Scale",
                0,
                2,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.scale.end`,
                "End Scale",
                0,
                2,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.scale.minMult`,
                "Random Size Min",
                0.1,
                1,
                0.01
              )}
            </div>
          </details>
          
          <details>
            <summary><span class="accordion-toggle"></span><strong>Speed & Motion</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.speed.start`,
                "Start Speed",
                0,
                10,
                0.1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.speed.end`,
                "End Speed",
                0,
                10,
                0.1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.speed.minMult`,
                "Random Speed Min",
                0.1,
                1,
                0.01
              )}
            </div>
          </details>
          
          <details>
            <summary><span class="accordion-toggle"></span><strong>Rotation</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createCheckboxHTML(
                `${firePath}.rotation.enabled`,
                "Enable Rotation",
                false
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.rotation.minSpeed`,
                "Min Rotation Speed (°/s)",
                -360,
                360,
                1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.rotation.maxSpeed`,
                "Max Rotation Speed (°/s)",
                -360,
                360,
                1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.rotation.accel`,
                "Rotation Acceleration",
                0,
                200,
                1
              )}
            </div>
          </details>
          
          <details>
            <summary><span class="accordion-toggle"></span><strong>Wind Influence</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text" style="font-style: italic; color: #999;">Wind is now controlled globally in the "Wind" section. The values below reflect the current global settings.</p>
              ${DebuggerUIBuilder._createReadOnlyDisplayHTML(
                `${firePath}.wind.enabled`,
                "Wind Enabled"
              )}
              ${DebuggerUIBuilder._createReadOnlyDisplayHTML(
                `${firePath}.wind.force`,
                "Wind Force"
              )}
              ${DebuggerUIBuilder._createReadOnlyDisplayHTML(
                `${firePath}.wind.baseSpeed`,
                "Base Wind Speed"
              )}
              ${DebuggerUIBuilder._createReadOnlyDisplayHTML(
                `${firePath}.wind.gustSpeed`,
                "Gust Speed"
              )}
            </div>
          </details>

          <details>
            <summary><span class="accordion-toggle"></span><strong>Flame Tone Curve</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createCheckboxHTML(
                `${firePath}.toneCurve.enabled`,
                "Enable Fire Tone Curve",
                false
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.toneCurve.contrast`,
                "Contrast",
                0.5,
                3.0,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.toneCurve.gamma`,
                "Gamma",
                0.5,
                3.0,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.toneCurve.knee`,
                "Knee",
                0.0,
                1.0,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.toneCurve.coreClamp`,
                "Core Clamp",
                0.5,
                1.5,
                0.01
              )}
            </div>
          </details>
          
          <details>
            <summary><span class="accordion-toggle"></span><strong>Fire Color Correction</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Apply color correction filters specifically to fire particles.</p>
              ${DebuggerUIBuilder._createCheckboxHTML(
                `${firePath}.colorCorrection.enabled`,
                "Enable Fire CC",
                false
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.colorCorrection.saturation`,
                "Saturation",
                0,
                2,
                0.05
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.colorCorrection.brightness`,
                "Brightness",
                -1,
                1,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.colorCorrection.contrast`,
                "Contrast",
                0,
                3,
                0.05
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.colorCorrection.exposure`,
                "Exposure",
                -2,
                2,
                0.05
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${firePath}.colorCorrection.gamma`,
                "Gamma",
                0.1,
                3,
                0.05
              )}
            </div>
          </details>
          
          ${DebuggerUIBuilder._createEffectPointGroupsHTML("fire", {
            effectName: "Fire Particles",
            defaultGroupType: "area",
            description:
              "Create fire particle spawn areas. Draw areas or lines where fire should emit.",
          })}
        `;
      return DebuggerUIBuilder._createAccordionHTML(
        effectKey,
        definition.title,
        fireContent,
        headerExtra
      );
    } else if (effectKey === "candleFlame") {
      const candlePath = "candleFlame";
      const headerExtra = `<button type="button" class="create-effect-from-ui" data-action="create-particle-effect-area" data-effect-key="${effectKey}" title="Create new point for this particle effect" style="width: 24px; height: 24px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 250, 64, 0.5); background: rgba(76, 250, 64, 0.15); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-plus-square" style="font-size: 12px; pointer-events: none; color: #6fdd73;"></i></button>`;
      const candleContent = `
          <p class="description-text">${definition.description}</p>
          <details>
            <summary><span class="accordion-toggle"></span><strong>Appearance</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSelectHTML(
                `${candlePath}.blendMode`,
                "Blend Mode",
                BLEND_MODE_OPTIONS
              )}
              ${DebuggerUIBuilder._createTextInputHTML(
                `${candlePath}.particleTexture`,
                "Particle Texture"
              )}
              ${DebuggerUIBuilder._createGradientEditorHTML(
                `${candlePath}.colorAlphaGradient`,
                "Color & Alpha Over Life"
              )}
              ${DebuggerUIBuilder._createGradientEditorHTML(
                `${candlePath}.emissiveGradient`,
                "Emissive Over Life"
              )}
            </div>
          </details>
          <details>
            <summary><span class="accordion-toggle"></span><strong>Spawning & Lifetime</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.frequency`,
                "Spawn Rate (s)",
                0.001,
                0.1,
                0.001
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.lifetime.min`,
                "Min Lifetime (s)",
                0.1,
                5,
                0.1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.lifetime.max`,
                "Max Lifetime (s)",
                0.1,
                5,
                0.1
              )}
            </div>
          </details>
          <details>
            <summary><span class="accordion-toggle"></span><strong>Shape & Size</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.scale.sizeMultiplier`,
                "Global Size",
                0.01,
                2,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.scale.start`,
                "Start Scale",
                0,
                2,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.scale.end`,
                "End Scale",
                0,
                2,
                0.01
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.scale.minMult`,
                "Random Size Min",
                0.1,
                1,
                0.01
              )}
            </div>
          </details>
          <details>
            <summary><span class="accordion-toggle"></span><strong>Jiggle Motion</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.jiggle.upwardVelocity`,
                "Upward Velocity",
                -200,
                0,
                1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.jiggle.amplitude`,
                "Jiggle Amplitude",
                0,
                100,
                1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.jiggle.frequency`,
                "Jiggle Frequency",
                0.1,
                20,
                0.1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${candlePath}.jiggle.risingFactor`,
                "Rising Factor",
                0.1,
                5,
                0.1,
                "Controls how much the jiggle increases towards the tip."
              )}
            </div>
          </details>
          
          ${DebuggerUIBuilder._createEffectPointGroupsHTML("candleFlame", {
            effectName: "Candle Flame",
            defaultGroupType: "point",
            description:
              "Create candle flame spawn points. Each point will emit flame particles.",
          })}
        `;
      return DebuggerUIBuilder._createAccordionHTML(
        effectKey,
        definition.title,
        candleContent,
        headerExtra
      );
    } else if (effectKey === "pressurisedSteam") {
      const steamPath = "pressurisedSteam";
      const steamContent = `
          <p class="description-text">${definition.description}</p>
          <details>
              <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
              <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createTextureInputHTML(
                    definition.triggerTexture,
                    `Effect Mask (_Steam)`
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${steamPath}.maskInfluence`,
                    "Particle Density",
                    0.01,
                    5,
                    0.01
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${steamPath}.maskThreshold`,
                    "Mask Threshold",
                    0,
                    1,
                    0.01
                  )}
              </div>
          </details>
          <details>
              <summary><span class="accordion-toggle"></span><strong>Burst Emission Cycle</strong></summary>
              <div style="padding-left: 5px;">
                  <p class="description-text">Controls the on/off cycle of the steam bursts.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${steamPath}.burst.onDuration`,
                    "On Duration (s)",
                    0.1,
                    60,
                    0.1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${steamPath}.burst.offDuration`,
                    "Off Duration (s)",
                    0.1,
                    60,
                    0.1
                  )}
                  <hr style="border-color: #555; margin: 4px 0;">
                  <p class="description-text">The rate of particle emission when the burst is active.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${steamPath}.burst.frequency`,
                    "Spawn Rate (s)",
                    0.001,
                    0.5,
                    0.001
                  )}
              </div>
          </details>
          <details>
              <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
              <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSelectHTML(
                    `${steamPath}.blendMode`,
                    "Blend Mode",
                    BLEND_MODE_OPTIONS
                  )}
                  ${DebuggerUIBuilder._createTextInputHTML(
                    `${steamPath}.particleTexture`,
                    "Particle Texture"
                  )}
                  <details>
                      <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                      <div style="padding-left: 5px;">
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.lifetime.min`,
                            "Min Lifetime (s)",
                            0.1,
                            5,
                            0.1
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.lifetime.max`,
                            "Max Lifetime (s)",
                            0.1,
                            5,
                            0.1
                          )}
                      </div>
                  </details>
                  ${DebuggerUIBuilder._createGradientEditorHTML(
                    `${steamPath}.colorAlphaGradient`,
                    "Color & Alpha Over Life"
                  )}
                  ${DebuggerUIBuilder._createGradientEditorHTML(
                    `${steamPath}.emissiveGradient`,
                    "Emissive (Brightness) Over Life"
                  )}
                  <details>
                      <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                      <div style="padding-left: 5px;">
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.scale.sizeMultiplier`,
                            "Global Size",
                            0.1,
                            5,
                            0.05
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.scale.start`,
                            "Start Scale",
                            0.1,
                            2,
                            0.05
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.scale.end`,
                            "End Scale",
                            0,
                            2,
                            0.05
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.scale.minMult`,
                            "Random Size Min",
                            0.1,
                            1,
                            0.01
                          )}
                      </div>
                  </details>
              </div>
          </details>
          <details>
              <summary><span class="accordion-toggle"></span><strong>Movement & Physics</strong></summary>
              <div style="padding-left: 8px;">
                  <details>
                      <summary><span class="accordion-toggle"></span><strong>Initial Velocity (Air Drag)</strong></summary>
                      <div style="padding-left: 8px;">
                          <p class="description-text">High start and low end speed simulates air drag.</p>
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.speed.start`,
                            "Start Speed",
                            10,
                            500,
                            1
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.speed.end`,
                            "End Speed",
                            0,
                            100,
                            1
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.speed.minMult`,
                            "Random Speed Min",
                            0.1,
                            1,
                            0.01
                          )}
                      </div>
                  </details>
                  <details>
                      <summary><span class="accordion-toggle"></span><strong>Direction</strong></summary>
                      <div style="padding-left: 8px;">
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.path.angle.min`,
                            "Min Start Angle",
                            -180,
                            180,
                            1
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.path.angle.max`,
                            "Max Start Angle",
                            -180,
                            180,
                            1
                          )}
                      </div>
                  </details>
                  <details>
                      <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                        `${steamPath}.rotation.enabled`,
                        "Tumbling / Rotation",
                        true
                      )}</div></summary>
                      <div style="padding-left: 5px;">
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.rotation.minSpeed`,
                            "Min Rot. Speed",
                            -180,
                            180,
                            1
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.rotation.maxSpeed`,
                            "Max Rot. Speed",
                            -180,
                            180,
                            1
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${steamPath}.rotation.accel`,
                            "Rot. Accel.",
                            -90,
                            90,
                            1
                          )}
                      </div>
                  </details>
              </div>
          </details>
          
          ${DebuggerUIBuilder._createEffectPointGroupsHTML("pressurisedSteam", {
            effectName: "Pressurised Steam",
            defaultGroupType: "area",
            description:
              "Create steam emission areas. Draw areas or lines where steam should burst from.",
          })}
      `;
      const headerExtra = `<button type="button" class="create-effect-from-ui" data-action="create-particle-effect-area" data-effect-key="${effectKey}" title="Create new area for this particle effect" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 250, 64, 0.5); background: rgba(76, 250, 64, 0.15); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-plus-square" style="font-size: 12px; pointer-events: none; color: #6fdd73;"></i></button>`;
      return DebuggerUIBuilder._createAccordionHTML(
        effectKey,
        definition.title,
        steamContent,
        headerExtra
      );
    }

    // Common particle sections
    content += `
                    <details>
                      <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                      <div style="padding-left: 5px;">
                        ${DebuggerUIBuilder._createTextureInputHTML(
                          definition.triggerTexture,
                          `Effect Mask (_${
                            definition.triggerTexture.charAt(0).toUpperCase() +
                            definition.triggerTexture.slice(1)
                          })`
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `${path}.maskInfluence`,
                          "Particle Density",
                          0.01,
                          5,
                          0.01,
                          "Controls the maximum number of particles."
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `${path}.frequency`,
                          "Spawn Rate (s)",
                          0.001,
                          1,
                          0.001,
                          "Time in seconds between particle spawns. Lower is faster."
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `${path}.maskThreshold`,
                          "Mask Threshold",
                          0,
                          1,
                          0.01,
                          "Luminance from the mask required to spawn particles."
                        )}

                      </div>
                    </details>
                    <details>
                      <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                      <div style="padding-left: 5px;">
                        ${DebuggerUIBuilder._createTextInputHTML(
                          `${path}.particleTexture`,
                          "Particle Texture",
                          "Path to the particle image."
                        )}
                        <details>
                          <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                          <div style="padding-left: 5px;">
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.lifetime.min`,
                              "Min Lifetime (s)",
                              0.1,
                              20,
                              0.1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.lifetime.max`,
                              "Max Lifetime (s)",
                              0.1,
                              20,
                              0.1
                            )}
                          </div>
                        </details>

                        ${
                          effectKey === "metallicGlints"
                            ? '<p class="description-text" style="font-style: italic; color: #999; margin: 8px 0;">Metallic glints get their color from the _Specular map texture at spawn location.</p>'
                            : `${DebuggerUIBuilder._createGradientEditorHTML(
                                `${path}.colorAlphaGradient`,
                                "Color & Alpha Over Life"
                              )}
                              ${DebuggerUIBuilder._createGradientEditorHTML(
                                `${path}.emissiveGradient`,
                                "Emissive Color Over Life",
                                "color"
                              )}`
                        }

                        <details>
                          <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                          <div style="padding-left: 5px;">
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.scale.sizeMultiplier`,
                              "Global Size",
                              0.1,
                              50,
                              1,
                              "A global multiplier for particle size."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.scale.start`,
                              "Start Scale Mult",
                              0,
                              2,
                              0.01,
                              "Particle size at birth (multiplied by Global Size)."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.scale.end`,
                              "End Scale Mult",
                              0,
                              2,
                              0.01,
                              "Particle size at death (multiplied by Global Size)."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.scale.minMult`,
                              "Random Size Min",
                              0.1,
                              1,
                              0.01,
                              "Minimum random scale multiplier for each particle (from this value to 1.0)."
                            )}
                          </div>
                        </details>
                        ${
                          effectKey === "glint"
                            ? `
                        <details>
                          <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                            `${path}.rgbSplit.enabled`,
                            "RGB Split Effect",
                            true
                          )}</div></summary>
                          <div style="padding-left: 5px;">
                            <p class="description-text">Applies a chromatic aberration effect to the particles.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.rgbSplit.amount`,
                              "Amount",
                              0,
                              10,
                              0.1
                            )}
                          </div>
                        </details>`
                            : ""
                        }
                      </div>
                    </details>
                    <details>
                      <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                      <div style="padding-left: 5px;">
                        <details>
                          <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                          <div style="padding-left: 5px;">
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.speed.start`,
                              "Start Speed",
                              -50,
                              50,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.speed.end`,
                              "End Speed",
                              -50,
                              50,
                              1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.speed.minMult`,
                              "Random Speed Min",
                              0.1,
                              1,
                              0.01,
                              "Minimum random speed multiplier for each particle (from this value to 1.0)."
                            )}
                          </div>
                        </details>
                        <details>
                          <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                            `${path}.rotation.enabled`,
                            "Tumbling / Rotation",
                            true
                          )}</div></summary>
                          <div style="padding-left: 5px;">
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.rotation.minSpeed`,
                              "Min Rot. Speed",
                              -180,
                              180,
                              1,
                              "Degrees per second."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.rotation.maxSpeed`,
                              "Max Rot. Speed",
                              -180,
                              180,
                              1,
                              "Degrees per second."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              `${path}.rotation.accel`,
                              "Rot. Accel.",
                              -90,
                              90,
                              1,
                              "Degrees per second squared."
                            )}
                          </div>
                        </details>
                      </div>
                    </details>
                  `;

    // Special case for Wind settings
    if (effectKey === "fire") {
      content += `
                      <details id="details-fire-wind">
                        <summary><span class="accordion-toggle"></span>
                          <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                            `${path}.wind.enabled`,
                            "Complex Wind",
                            true
                          )}</div>
                        </summary>
                        <div style="padding-left: 5px;">
                          <p class="description-text">Applies a dynamic wind force to all fire particles.</p>
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${path}.wind.force`,
                            "Wind Force",
                            0,
                            50,
                            0.5,
                            "How strongly the wind pushes the particles."
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${path}.wind.baseSpeed`,
                            "Base Speed",
                            0,
                            200,
                            1,
                            "The normal speed of the wind."
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            `${path}.wind.gustSpeed`,
                            "Gust Speed",
                            0,
                            500,
                            5,
                            "The peak speed during a gust."
                          )}
                          <details>
                            <summary><span class="accordion-toggle"></span><strong>Gust Timing</strong></summary>
                            <div style="padding-left: 5px;">
                              ${DebuggerUIBuilder._createSliderHTML(
                                `${path}.wind.gustFrequencyMin`,
                                "Min Time Between Gusts (s)",
                                0.1,
                                20,
                                0.1
                              )}
                              ${DebuggerUIBuilder._createSliderHTML(
                                `${path}.wind.gustFrequencyMax`,
                                "Max Time Between Gusts (s)",
                                0.1,
                                20,
                                0.1
                              )}
                              ${DebuggerUIBuilder._createSliderHTML(
                                `${path}.wind.gustDurationMin`,
                                "Min Gust Duration (s)",
                                0.1,
                                5,
                                0.1
                              )}
                              ${DebuggerUIBuilder._createSliderHTML(
                                `${path}.wind.gustDurationMax`,
                                "Max Gust Duration (s)",
                                0.1,
                                5,
                                0.1
                              )}
                            </div>
                          </details>
                          <details>
                            <summary><span class="accordion-toggle"></span><strong>Angle Change</strong></summary>
                            <div style="padding-left: 5px;">
                              ${DebuggerUIBuilder._createSliderHTML(
                                `${path}.wind.angleChangeFrequencyMin`,
                                "Min Time Between Changes (s)",
                                0.1,
                                30,
                                0.1
                              )}
                              ${DebuggerUIBuilder._createSliderHTML(
                                `${path}.wind.angleChangeFrequencyMax`,
                                "Max Time Between Changes (s)",
                                0.1,
                                30,
                                0.1
                              )}
                              ${DebuggerUIBuilder._createSliderHTML(
                                `${path}.wind.angleChangeRange`,
                                "Max Angle Change ( )",
                                0,
                                90,
                                1,
                                "Max degrees the angle can shift each time."
                              )}
                            </div>
                          </details>
                        </div>
                      </details>
                    `;
    }

    // Add point group controls if this effect supports map points
    if (EFFECT_SOURCE_OPTIONS[effectKey]) {
      content += DebuggerUIBuilder._createEffectPointGroupsHTML(effectKey, {
        effectName: definition.title,
        defaultGroupType: "area",
        description: `Create areas where ${definition.title.toLowerCase()} particles will emit.`,
      });
    }

    const mainAccordionPath =
      effectKey === "fire" ? "fire.particles.enabled" : `${path}.enabled`;
    const mainAccordionId =
      effectKey === "fire" ? "details-fire-particles" : `details-${effectKey}`;

    const headerExtra = `<button type="button" class="create-effect-from-ui" data-action="create-particle-effect-area" data-effect-key="${effectKey}" title="Create new area for this particle effect"><i class="fas fa-plus-square"></i></button>`;

    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      definition.title,
      content,
      headerExtra
    )
      .replace(`details-${effectKey}`, mainAccordionId)
      .replace(`${path}.enabled`, mainAccordionPath);
  }

  // NOTE: IMPORTANT. AT SOME POINT THIS NEEDS TO BE MOVED TO THE CORRECT PLACE. DON'T FORGET.
  static getSmellyFliesSettingsHTML() {
    const effectKey = "smellyFlies";
    const headerExtra = `<button type="button" class="create-effect-from-ui" data-action="create-particle-effect-area" data-effect-key="${effectKey}" title="Create new area for this particle effect"><i class="fas fa-plus-square"></i></button>`;
    const content = `
          <p class="description-text">Simulates a swarm of flies that fly around, land, and walk on surfaces defined by a Map Point Area group.</p>
          ${DebuggerUIBuilder._createSelectHTML(
            `${effectKey}.blendMode`,
            "Blend Mode",
            BLEND_MODE_OPTIONS
          )}
          ${DebuggerUIBuilder._createTextInputHTML(
            `${effectKey}.particleTexture`,
            "Particle Texture"
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${effectKey}.maxParticles`,
            "Max Particles",
            1,
            500,
            1
          )}

          <details id="details-smellyFlies-flying">
            <summary><span class="accordion-toggle"></span><strong>Flying Behavior</strong></summary>
            <div style="padding-left: 5px;">
              <details id="details-smellyFlies-takeoff">
                <summary><span class="accordion-toggle"></span><strong>Takeoff & Landing</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.takeoffDuration`,
                    "Takeoff Duration (s)",
                    0.1,
                    2.0,
                    0.1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.takeoffSpeedMin`,
                    "Min Takeoff Speed",
                    10,
                    500,
                    5
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.takeoffSpeedMax`,
                    "Max Takeoff Speed",
                    10,
                    500,
                    5
                  )}
                  <hr style="border-color: #555; margin: 4px 0;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.landChance`,
                    "Land Chance (%/sec)",
                    0,
                    1.0,
                    0.01,
                    "Chance per second for a fly to land if over a valid area."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.landingDuration`,
                    "Landing Duration (s)",
                    0.1,
                    2.0,
                    0.1
                  )}
                </div>
              </details>
              <details id="details-smellyFlies-physics">
                <summary><span class="accordion-toggle"></span><strong>Flight Physics</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.noiseStrength`,
                    "Erratic Force",
                    0,
                    2000,
                    50,
                    "How strongly random forces push the fly. Higher = more erratic."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.noiseFrequency`,
                    "Erratic Frequency",
                    1,
                    50,
                    0.5,
                    "How quickly the random force changes. Higher = more jittery."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.tetherStrength`,
                    "Tether Strength",
                    0,
                    10,
                    0.1,
                    "How strongly the fly is pulled back to its spawn area."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.maxSpeed`,
                    "Max Speed (px/s)",
                    50,
                    1000,
                    10
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.flying.drag`,
                    "Air Drag",
                    0,
                    1,
                    0.01,
                    "Friction/resistance. Higher values cause slower, less 'drifty' movement."
                  )}
                </div>
              </details>
            </div>
          </details>

          <details id="details-smellyFlies-walking">
            <summary><span class="accordion-toggle"></span><strong>Walking Behavior</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSliderHTML(
                `${effectKey}.walking.walkSpeed`,
                "Walk Speed (px/s)",
                5,
                100,
                1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${effectKey}.walking.takeoffChance`,
                "Takeoff Chance (%/sec)",
                0,
                1.0,
                0.01,
                "Chance per second for a walking fly to take off."
              )}
              <details>
                <summary><span class="accordion-toggle"></span><strong>Idle Timing</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.walking.minIdleTime`,
                    "Min Idle Time (s)",
                    0.1,
                    5,
                    0.1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.walking.maxIdleTime`,
                    "Max Idle Time (s)",
                    0.1,
                    5,
                    0.1
                  )}
                </div>
              </details>
              <details>
                <summary><span class="accordion-toggle"></span><strong>Rotation Timing</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.walking.minRotateTime`,
                    "Min Rotate Time (s)",
                    0.1,
                    2,
                    0.1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.walking.maxRotateTime`,
                    "Max Rotate Time (s)",
                    0.1,
                    2,
                    0.1
                  )}
                </div>
              </details>
              <details>
                <summary><span class="accordion-toggle"></span><strong>Move Distance</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.walking.minMoveDistance`,
                    "Min Move Distance (px)",
                    1,
                    200,
                    1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    `${effectKey}.walking.maxMoveDistance`,
                    "Max Move Distance (px)",
                    1,
                    200,
                    1
                  )}
                </div>
              </details>
            </div>
          </details>

          <details id="details-smellyFlies-motionBlur">
            <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
              `${effectKey}.motionBlur.enabled`,
              "Motion Blur",
              true
            )}</div></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Stretches particles based on their speed to simulate motion blur.</p>
              ${DebuggerUIBuilder._createSliderHTML(
                `${effectKey}.motionBlur.strength`,
                "Strength",
                0,
                1,
                0.01,
                "Multiplier for how much speed affects particle length."
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                `${effectKey}.motionBlur.maxLength`,
                "Max Length",
                1,
                10,
                0.1,
                "The maximum amount to stretch the particle scale."
              )}
            </div>
          </details>
          
          ${DebuggerUIBuilder._createEffectPointGroupsHTML("smellyFlies", {
            effectName: "Smelly Flies",
            defaultGroupType: "area",
            description:
              "Create areas where flies will spawn and wander. Flies will land on and walk around these areas.",
          })}
          `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Smelly Flies",
      content,
      headerExtra
    );
  }

  updateTargets(targets, fullConfig, options = {}) {
    // NON-DESTRUCTIVE UPDATE: Only destroy/create emitters that have actually changed

    this.config = foundry.utils.getProperty(
      fullConfig,
      this.definition.configPath
    );

    // If the effect is disabled, destroy all emitters and return
    if (!fullConfig.enabled || !this.config?.enabled) {
      this.destroyAllEmitters();
      return;
    }

    // TARGETED REBUILD: If a specific map point group changed, destroy its emitter first
    // This forces a clean recreation with the new geometry
    const changedGroupId = options?.changedGroupId;
    if (changedGroupId) {
      const changedTargetId = `geometry-${changedGroupId}`;
      if (this.emitters.has(changedTargetId)) {
        console.log(
          `Map Shine | ${this.key}: Destroying emitter for changed group '${changedGroupId}' to force rebuild`
        );
        const emitterData = this.emitters.get(changedTargetId);
        if (emitterData?.emitter) {
          if (emitterData.emitter._customMaskTexture) {
            try { emitterData.emitter._customMaskTexture.destroy(false); } catch (_) {}
            emitterData.emitter._customMaskTexture = null;
          }
          emitterData.emitter.destroy();
        }
        this.emitters.delete(changedTargetId);
      }
      // Also remove from pending if it exists
      this.pendingTargets.delete(changedTargetId);
    }

    // Build a set of target IDs that SHOULD exist based on current configuration
    const desiredTargetIds = new Set();

    // --- 1. Process File-Based Texture Targets ---
    let targetsToProcess = [];
    const spawnOn = this.definition.spawnOn;
    if (spawnOn === "tiles") {
      targetsToProcess = [...targets.tiles.values()];
    } else if (spawnOn === "background") {
      if (targets.background) {
        targetsToProcess = [targets.background];
      }
    } else {
      targetsToProcess = [targets.background, ...targets.tiles.values()].filter(
        Boolean
      );
    }

    for (const target of targetsToProcess) {
      const targetId = target.tile ? target.tile.id : "background";
      if (target[this.definition.triggerTexture]) {
        desiredTargetIds.add(targetId);
        // Only add to pending if it doesn't already have an emitter
        if (!this.emitters.has(targetId)) {
          this.pendingTargets.set(targetId, target);
        }
      }
    }

    // --- 2. Process Geometry-Based Mask Targets ---
    const effectKey = this.key;
    const groups = getMapPointsGroups();

    for (const group of Object.values(groups)) {
      if (
        group.isEffectSource &&
        group.effectTarget === effectKey &&
        group.points.length > 0 &&
        !group.isBroken
      ) {
        const targetId = `geometry-${group.id}`;
        desiredTargetIds.add(targetId);

        // Only add to pending if it doesn't already have an emitter
        if (!this.emitters.has(targetId)) {
          console.log(
            `Map Shine | Found new geometry group '${group.label}' for effect '${effectKey}'.`
          );
          const virtualTarget = {
            isGeometry: true,
            group: group,
          };
          this.pendingTargets.set(targetId, virtualTarget);
        }
      }
    }

    // --- 3. Remove emitters that are no longer needed (DIFF) ---
    const emittersToRemove = [];
    for (const [targetId, emitterData] of this.emitters.entries()) {
      if (!desiredTargetIds.has(targetId)) {
        emittersToRemove.push(targetId);
      }
    }

    // Destroy only the emitters that are no longer needed
    for (const targetId of emittersToRemove) {
      const emitterData = this.emitters.get(targetId);
      if (emitterData?.emitter) {
        if (emitterData.emitter._customMaskTexture) {
          try { emitterData.emitter._customMaskTexture.destroy(false); } catch (_) {}
          emitterData.emitter._customMaskTexture = null;
        }
        emitterData.emitter.destroy();
      }
      this.emitters.delete(targetId);
      console.log(
        `Map Shine | Removed emitter for target '${targetId}' (no longer needed)`
      );
    }

    // Also clean up any pending targets that are no longer needed
    const pendingToRemove = [];
    for (const targetId of this.pendingTargets.keys()) {
      if (!desiredTargetIds.has(targetId)) {
        pendingToRemove.push(targetId);
      }
    }
    for (const targetId of pendingToRemove) {
      this.pendingTargets.delete(targetId);
    }
  }

  async _createEmitterForTarget(targetData, targetId) {
    if (targetData.isGeometry) {
      // Geometry-based targets are handled separately and correctly.
      return await this._createEmitterForGeometry(targetData.group, targetId);
    }

    const localTargetData = { ...targetData };
    const maskKey = this.definition.triggerTexture;
    let spawnMaskSource = localTargetData[maskKey];

    // Handle the composite mask for dust (only if generator is available)
    if (
      this.definition.configPath === "dust" &&
      localTargetData.dust &&
      localTargetData.structural
    ) {
      const CMG = globalThis && globalThis.CompositeMaskGenerator;
      if (CMG && typeof CMG.generate === "function") {
        try {
          // Generate a composite texture. This will be an object, not a path.
          spawnMaskSource = await CMG.generate(
            localTargetData.dust,
            localTargetData.structural,
            localTargetData.rect
          );
        } catch (e) {
          console.warn("Map Shine | CompositeMaskGenerator failed; falling back to dust mask only.", e);
          spawnMaskSource = localTargetData.dust;
        }
      } else {
        // Fallback: use dust only
        if (!this._warnedNoCompositeMask) {
          console.warn(
            "Map Shine | CompositeMaskGenerator not available; using _Dust mask without structural shaping."
          );
          this._warnedNoCompositeMask = true;
        }
        spawnMaskSource = localTargetData.dust;
      }
    }

    if (!spawnMaskSource) return true;

    const particleTexPath =
      this.config.particleTexture ?? "modules/map-shine/assets/particle.webp";
    if (!particleTexPath || typeof particleTexPath !== "string") return true;

    // Defer emitter creation while a scene transition is active or systems are not ready,
    // or if the BatchRenderer is not initialized yet.
    if (game?.mapShine?.transitionActive || game?.mapShine?.systemsReady === false) {
      return false;
    }
    if (!isBatchRendererReady()) {
      return false;
    }

    try {
      // Asynchronously load both the particle texture and the spawn mask texture.
      const [particleTexture, spawnMaskTexture] = await Promise.all([
        TextureLoader.loadTexture(particleTexPath),
        spawnMaskSource instanceof PIXI.Texture
          ? Promise.resolve(spawnMaskSource)
          : TextureLoader.loadTexture(spawnMaskSource),
      ]);

      localTargetData[maskKey] = spawnMaskTexture;

      const emitterConfig = this.definition.buildEmitterConfig(
        this.config,
        localTargetData
      );

      if (emitterConfig.maxParticles === 0) {
        // Do not destroy provided textures; upstream systems may still reference them
        return true;
      }

      // Do not start emitting immediately to prevent a race condition with shape compilation.
      emitterConfig.emit = false;

      const textureBehavior = emitterConfig.behaviors.find(
        (b) => b.type === "textureSingle"
      );
      if (textureBehavior) textureBehavior.config.texture = particleTexture;

      const emitterParent = this.particleOnlyContainer || this.parentContainer;
      // Validate parent container before creating the emitter
      if (!emitterParent || emitterParent.destroyed) {
        return false;
      }
      const emitter = new PIXI.particles.Emitter(emitterParent, emitterConfig);

      // Await the shape compilation before starting emission.
      const spawnBehavior = emitter.initBehaviors?.find(
        (b) => b.constructor.type === "spawnShape"
      );
      if (spawnBehavior?.shape?.compilePoints) {
        try {
          // Re-check readiness before compiling shape points, since this can trigger GPU work
          if (!isBatchRendererReady() || game?.mapShine?.transitionActive) {
            // Defer until stable
            emitter.destroy();
            return false;
          }
          await spawnBehavior.shape.compilePoints();
        } catch (e) {
          console.error("TextureMaskShape | Error during point compilation (deferred)", e);
          // Destroy and defer retry until renderer/canvas stabilizes
          try { emitter.destroy(); } catch (_) {}
          return false;
        }
      }

      // Enable emission immediately after resources are loaded and shape is compiled
      // The await statements above ensure BatchRenderer and textures are ready
      emitter.emit = true;

      if (spawnMaskSource instanceof PIXI.Texture) {
        emitter._customMaskTexture = spawnMaskSource;
      }

      emitter.autoUpdate = false;

      // CRITICAL FIX: Override the particle initialization to force blend mode on sprites
      // The emitter config's blendMode doesn't always apply properly to particles
      if (emitterConfig.blendMode !== undefined) {
        const targetBlendMode = emitterConfig.blendMode;
        // Hook into the emitter's update to ensure particles have correct blend mode
        const originalUpdate = emitter.update.bind(emitter);
        emitter.update = function (deltaTime) {
          originalUpdate(deltaTime);
          // Ensure all active particles have the correct blend mode
          let particle = this._activeParticlesFirst;
          while (particle) {
            // Validate particle and its texture before setting blend mode
            if (particle && !particle.destroyed && particle.texture?.baseTexture?.valid) {
              if (particle.blendMode !== targetBlendMode) {
                particle.blendMode = targetBlendMode;
              }
            }
            particle = particle.next;
          }
        };
      }

      this.emitters.set(targetId, { emitter });
      return true;
    } catch (err) {
      console.error(
        `Map Shine | Failed to load textures for particle effect:`,
        err
      );
      // Do not destroy provided textures on error; avoid interfering with canvas teardown
      return false;
    }
  }

  async _createEmitterForGeometry(group, targetId) {
    // For most geometry-driven effects we depend on the GeometryMaskManager.
    // Point-based effects (smellyFlies, candleFlame) do NOT require it, since they use raw geometry groups directly.
    const isPointBased = this.definition.configPath === "smellyFlies" || this.definition.configPath === "candleFlame";
    if (!isPointBased) {
      if (!game.mapShine.geometryMaskManager) {
        return false;
      }
    }

    // Ensure the geometry spawn shape is registered before creating emitter
    // Point-based effects use custom geometry shapes and do not require the global registration to be ready.
    if (!isPointBased) {
      if (!ensureGeometryShapeRegistered()) {
        // Defer until the shape is available/registered by module.js
        return false;
      }
    }

    // Guard against unstable canvas states / renderer readiness
    if (game?.mapShine?.transitionActive || game?.mapShine?.systemsReady === false) {
      return false;
    }
    if (!isBatchRendererReady()) {
      return false;
    }

    const particleTexPath =
      this.config.particleTexture ?? "modules/map-shine/assets/particle.webp";
    if (!particleTexPath || typeof particleTexPath !== "string") return true; // Nothing to do, so count as "success".

    try {
      const texture = await TextureLoader.loadTexture(particleTexPath);
      const currentFullConfig = game.mapShine.profileManager.activeConfig;
      const currentEffectConfig = foundry.utils.getProperty(
        currentFullConfig,
        this.definition.configPath
      );

      if (
        !this.parentContainer ||
        !currentFullConfig.enabled ||
        !currentEffectConfig?.enabled
      )
        return true; // Effect is disabled, count as "success" to remove from pending.
      if (this.emitters.has(targetId)) return true; // Already created, count as "success".

      let emitterConfig;

      if (isPointBased) {
        // Point-based effects (smellyFlies, candleFlame) build config directly from group data
        emitterConfig = this.definition.buildEmitterConfig(
          currentEffectConfig,
          { rect: { x: 0, y: 0, width: 1, height: 1 } },
          null,
          group
        );
      } else {
        const maskTexture = game.mapShine.geometryMaskManager.getMask(
          group.effectTarget
        );
        if (!maskTexture) {
          // The manager exists, but the mask might not be ready yet. Defer.
          return false;
        }
        const virtualTargetData = {
          [group.effectTarget]: maskTexture,
          rect: {
            x: 0,
            y: 0,
            width: canvas.app.screen.width,
            height: canvas.app.screen.height,
          },
        };
        emitterConfig = this.definition.buildEmitterConfig(
          currentEffectConfig,
          virtualTargetData,
          group.effectTarget,
          group
        );
      }

      if (emitterConfig.maxParticles === 0) return true;

      // Do not start emitting immediately to prevent a race condition with shape compilation.
      emitterConfig.emit = false;

      const textureBehavior = emitterConfig.behaviors.find(
        (b) => b.type === "textureSingle"
      );
      if (textureBehavior) textureBehavior.config.texture = texture;

      const emitterParent = this.particleOnlyContainer || this.parentContainer;
      if (!emitterParent || emitterParent.destroyed) {
        return false;
      }
      const emitter = new PIXI.particles.Emitter(emitterParent, emitterConfig);

      // Await the shape compilation before starting emission.
      const spawnBehavior = emitter.initBehaviors?.find(
        (b) => b.constructor.type === "spawnShape"
      );
      if (spawnBehavior?.shape?.compilePoints) {
        try {
          // Re-check readiness before compiling points in case canvas is still stabilizing
          if (!isBatchRendererReady() || game?.mapShine?.transitionActive) {
            emitter.destroy();
            return false;
          }
          await spawnBehavior.shape.compilePoints();
        } catch (e) {
          console.error("GeometryMaskShape | Error during point compilation (smelly/geometry, deferred)", e);
          try { emitter.destroy(); } catch (_) {}
          return false;
        }
      }

      // Enable emission immediately after resources are loaded and shape is compiled
      // The await statements above ensure BatchRenderer and textures are ready
      emitter.emit = true;

      emitter.autoUpdate = false;

      // CRITICAL FIX: Override the particle initialization to force blend mode on sprites
      // The emitter config's blendMode doesn't always apply properly to particles
      if (emitterConfig.blendMode !== undefined) {
        const targetBlendMode = emitterConfig.blendMode;
        // Hook into the emitter's update to ensure particles have correct blend mode
        const originalUpdate = emitter.update.bind(emitter);
        emitter.update = function (deltaTime) {
          originalUpdate(deltaTime);
          // Ensure all active particles have the correct blend mode
          let particle = this._activeParticlesFirst;
          while (particle) {
            // Validate particle and its texture before setting blend mode
            if (particle && !particle.destroyed && particle.texture?.baseTexture?.valid) {
              if (particle.blendMode !== targetBlendMode) {
                particle.blendMode = targetBlendMode;
              }
            }
            particle = particle.next;
          }
        };
      }

      this.emitters.set(targetId, { emitter });
      return true; // Success!
    } catch (err) {
      console.error(
        `Map Shine | Failed to load particle texture for geometry emitter: "${particleTexPath}"`,
        err
      );
      return true; // Don't retry a failed texture load.
    }
  }

  getOutputTexture() {
    return this.particleOutputTexture;
  }

  async processAllPendingTargets() {
    // Batch process all pending targets in parallel for fast initialization
    // Each _createEmitterForTarget awaits resource loading and shape compilation
    // so they're safe to process in parallel
    if (this.pendingTargets.size === 0) return;
    
    const promises = [];
    const targetEntries = Array.from(this.pendingTargets.entries());
    
    for (const [targetId, targetData] of targetEntries) {
      promises.push(
        this._createEmitterForTarget(targetData, targetId).then(success => {
          if (success) {
            this.pendingTargets.delete(targetId);
          }
          return success;
        })
      );
    }
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r).length;
    
    if (successCount > 0) {
      console.log(`MapShine | ${this.key}: Batch initialized ${successCount}/${targetEntries.length} emitters`);
    }
  }

  async update(deltaTime) {
    if (this.definition.configPath === "biofilm") {
      this._initializeBiofilmResources();
    }
    if (!this.pendingTargets || !this.emitters) return;

    // Process pending targets - batch processing handled by processAllPendingTargets()
    // This just ensures any stragglers get processed if batch fails
    if (this.pendingTargets.size > 0 && this.pendingTargets.size < 5) {
      const [targetId, targetData] = this.pendingTargets.entries().next().value;
      const success = await this._createEmitterForTarget(targetData, targetId);
      if (success) {
        this.pendingTargets.delete(targetId);
      }
    }

    // Reduced frequency orphan cleanup: Every 300 frames (~5 seconds at 60fps)
    // Only needed as safety net for edge cases
    if (!this._orphanCleanupFrame) this._orphanCleanupFrame = 0;
    this._orphanCleanupFrame++;
    if (this._orphanCleanupFrame >= 300) {
      this._orphanCleanupFrame = 0;
      this._cleanupOrphanedParticles();
    }

    if (this.displacementFilter) {
      const resourceManager = game.mapShine.resourceManager;
      const waterConfig = game.mapShine.profileManager.activeConfig.water;

      if (resourceManager && waterConfig?.wave?.enabled) {
        const displacementMap =
          resourceManager.getWaterDisplacementMap(deltaTime);
        // Add null checks to prevent errors during scene transitions
        if (
          displacementMap &&
          displacementMap.baseTexture &&
          displacementMap.baseTexture.valid &&
          this.displacementSprite
        ) {
          this.displacementSprite.texture = displacementMap;
          const scale =
            waterConfig.wave.intensity *
            Math.max(canvas.app.screen.width, canvas.app.screen.height);
          this.displacementFilter.scale.x = scale;
          this.displacementFilter.scale.y = scale;
        }
      }
    }

    if (this.biofilmMaskFilter) {
      const resourceManager = game.mapShine.resourceManager;
      if (resourceManager) {
        this.biofilmMaskFilter.uniforms.uOutdoorsMask =
          resourceManager.getOutdoorsMask() || PIXI.Texture.WHITE;
        this.biofilmMaskFilter.uniforms.uWaterMask =
          resourceManager.getWaterMask() || PIXI.Texture.WHITE;
      }
    }

    // Update the cloud suppressor filter uniform with the latest cloud texture.
    if (this.cloudSuppressorFilter && this.cloudSuppressorFilter.enabled) {
      const resourceManager = game.mapShine.resourceManager;
      if (resourceManager) {
        this.cloudSuppressorFilter.uniforms.uCloudTexture =
          resourceManager.getRawCloudTexture(deltaTime) || PIXI.Texture.WHITE;
      }
    }

    // Periodically update the spawn points for metallic glints
    if (this.definition.configPath === "metallicGlints") {
      for (const { emitter } of this.emitters.values()) {
        if (!emitter || !emitter.behaviors) continue;

        const spawnBehavior = emitter.behaviors.find(
          (b) => b.type === "spawnShape"
        );
        if (spawnBehavior?.shape?.update) {
          spawnBehavior.shape.update();
        }
      }
    }

    // Get performance settings for viewport culling and LOD
    // These are stored during updateFromConfig() from universal.weather.performance
    const performanceConfig = this.performanceConfig || {};
    const cullOutsideViewport = performanceConfig.cullOutsideViewport ?? false;
    const lodEnabled = performanceConfig.lodEnabled ?? false;
    const lodDistanceThreshold = performanceConfig.lodDistanceThreshold ?? 2000;
    const lodReductionFactor = performanceConfig.lodReductionFactor ?? 0.5;

    // Get viewport bounds for culling
    let viewportBounds = null;
    if (cullOutsideViewport && game.mapShine?.coordinateManager) {
      const cameraOffset = game.mapShine.coordinateManager.getCameraOffset();
      const viewSize = game.mapShine.coordinateManager.getViewSize();
      viewportBounds = {
        left: cameraOffset.x,
        right: cameraOffset.x + viewSize.width,
        top: cameraOffset.y,
        bottom: cameraOffset.y + viewSize.height
      };
    }

    // Calculate LOD scaling factor based on zoom level
    let lodScale = 1.0;
    if (lodEnabled && game.mapShine?.coordinateManager) {
      const canvasScale = game.mapShine.coordinateManager.getCanvasScale();
      // If zoomed out (scale < 1), reduce particle count
      // lodDistanceThreshold represents the "comfortable viewing distance" in pixels
      // When zoomed out, 1 world unit = fewer pixels on screen
      const pixelsPerWorldUnit = canvasScale * 100; // Assuming ~100px grid squares at 1x zoom
      if (pixelsPerWorldUnit < lodDistanceThreshold) {
        // Gradually reduce particles as we zoom out
        const lodRatio = Math.max(0.1, pixelsPerWorldUnit / lodDistanceThreshold);
        lodScale = lodReductionFactor + (1.0 - lodReductionFactor) * lodRatio;
      }
    }

    for (const { emitter } of this.emitters.values()) {
      // Manually update any behaviors that have a custom `update(emitter, delta)` method.
      // This is a custom extension to the pixi-particles library's behavior system.
      if (emitter.initBehaviors) {
        for (const behavior of emitter.initBehaviors) {
          if (typeof behavior.update === "function") {
            behavior.update(emitter, deltaTime);
          }
        }
      }

      // Apply LOD by modifying spawn frequency
      if (lodEnabled && lodScale < 1.0 && emitter._frequency !== undefined) {
        // Store original frequency if not already stored
        if (emitter._originalFrequency === undefined) {
          emitter._originalFrequency = emitter._frequency;
        }
        // Reduce spawn rate by increasing frequency (time between spawns)
        emitter._frequency = emitter._originalFrequency / lodScale;
      } else if (emitter._originalFrequency !== undefined) {
        // Restore original frequency when LOD not active
        emitter._frequency = emitter._originalFrequency;
        emitter._originalFrequency = undefined;
      }

      // Update emitter
      emitter.update(deltaTime);

      // Apply viewport culling AFTER update to hide off-screen particles
      if (cullOutsideViewport && viewportBounds && emitter._parent) {
        for (let particle = emitter._activeParticlesFirst; particle; particle = particle.next) {
          const worldPos = particle.position;
          const isVisible = (
            worldPos.x >= viewportBounds.left &&
            worldPos.x <= viewportBounds.right &&
            worldPos.y >= viewportBounds.top &&
            worldPos.y <= viewportBounds.bottom
          );
          // Hide particles outside viewport but keep them alive
          // This saves rendering cost without destroying/recreating particles
          particle.visible = isVisible;
        }
      } else if (emitter._parent) {
        // Ensure all particles are visible when culling disabled
        for (let particle = emitter._activeParticlesFirst; particle; particle = particle.next) {
          particle.visible = true;
        }
      }
    }

    // If this controller is for biofilm, render its output to the dedicated texture.
    if (
      this.definition.configPath === "biofilm" &&
      this.particleOutputTexture
    ) {
      // CRITICAL: Check if BatchRenderer is ready before rendering
      const batchRenderer = canvas.app.renderer.plugins?.batch;
      if (!batchRenderer || !batchRenderer._bufferedElements || !batchRenderer._aIndex || batchRenderer._aIndex.length === 0) {
        return; // Defer rendering until BatchRenderer is initialized
      }
      
      // Validate container before rendering biofilm particles
      if (this.parentContainer && !this.parentContainer.destroyed && this.particleOutputTexture?.valid) {
        canvas.app.renderer.render(this.parentContainer, {
          renderTexture: this.particleOutputTexture,
          clear: true,
        });
      }
    }
  }

  /**
   * Cleans up orphaned particle sprites that are no longer managed by any emitter.
   * This runs periodically to catch particles that somehow escape proper cleanup.
   * @private
   */
  _cleanupOrphanedParticles() {
    if (!this.parentContainer && !this.particleOnlyContainer) return;

    // Build a Set of all particle sprites currently managed by active emitters
    const managedParticles = new Set();
    for (const { emitter } of this.emitters.values()) {
      if (!emitter || !emitter._parent) continue;
      
      // Walk through all active particles in this emitter
      let particle = emitter._activeParticlesFirst;
      while (particle) {
        managedParticles.add(particle);
        particle = particle.next;
      }
      
      // Also walk through pooled particles (they shouldn't have parents, but check anyway)
      particle = emitter._poolFirst;
      while (particle) {
        managedParticles.add(particle);
        particle = particle.next;
      }
    }

    // Check both containers for orphaned children
    const containersToCheck = [];
    if (this.particleOnlyContainer) {
      containersToCheck.push(this.particleOnlyContainer);
    }
    if (this.parentContainer && !this.particleOnlyContainer) {
      containersToCheck.push(this.parentContainer);
    }

    let orphanCount = 0;
    for (const container of containersToCheck) {
      if (!container || container.destroyed) continue;
      
      // Find children that aren't in our managed set
      const orphans = [];
      for (const child of container.children) {
        // Skip if this child is managed by an emitter
        if (managedParticles.has(child)) continue;
        
        // CRITICAL FIX: Particles HAVE an .emitter property - they're orphaned if they have
        // an emitter reference but aren't in any emitter's active/pooled lists
        if (child.emitter && child.constructor.name === 'Sprite') {
          orphans.push(child);
        }
      }
      
      // Remove and destroy orphans
      for (const orphan of orphans) {
        orphanCount++;
        container.removeChild(orphan);
        if (!orphan.destroyed) {
          orphan.destroy({ children: true, texture: false, baseTexture: false });
        }
      }
    }

    if (orphanCount > 0) {
      console.log(`MapShine | Cleaned up ${orphanCount} orphaned particle sprites in ${this.key}`);
    }
  }

  updateFromConfig(fullConfig) {
    // Ensure this.config is updated with the latest settings at the start of this method.
    this.config = foundry.utils.getProperty(
      fullConfig,
      this.definition.configPath
    );

    // Store performance config from profile
    this.performanceConfig = {
      cullOutsideViewport: fullConfig.weather.performance.cullOutsideViewport ?? false,
      lodEnabled: fullConfig.weather.performance.lodEnabled ?? false,
      lodDistanceThreshold: fullConfig.weather.performance.lodDistanceThreshold ?? 2000,
      lodReductionFactor: fullConfig.weather.performance.lodReductionFactor ?? 0.5,
    };

    // Force initialization of special resources before configuration is applied.
    if (this.definition.configPath === "biofilm") {
      this._initializeBiofilmResources();
    }

    const controllerConfig = this.config;
    const particleSystemConfig = fullConfig.particleSystems;

    // Determine visibility based on the global toggle, particle systems toggle, and this effect's specific toggle.
    // The fire effect also depends on the parent `fire.enabled` flag.
    let isVisible =
      fullConfig.enabled &&
      particleSystemConfig.enabled &&
      controllerConfig?.enabled;
    if (this.definition.configPath === "fire.particles") {
      const fireConfig = foundry.utils.getProperty(fullConfig, "fire");

      isVisible = isVisible && fireConfig?.enabled;
    }
    this.parentContainer.visible = isVisible;
    // DO NOT set blendMode on containers - this prevents particles from blending with each other!
    // The emitter config's blendMode applies to individual particle sprites, which is what we want.
    // Setting it on the container would control how the whole container blends with the background.
    // Keep containers at NORMAL blend mode so particles can blend with each other inside.
    // We now force particle sprites to have the correct blend mode in the emitter update loop.
    if (this.particleOnlyContainer) {
      this.particleOnlyContainer.blendMode = PIXI.BLEND_MODES.NORMAL;
      this.parentContainer.blendMode = PIXI.BLEND_MODES.NORMAL;
    } else {
      this.parentContainer.blendMode = PIXI.BLEND_MODES.NORMAL;
    }

    this.parentContainer.alpha = 1.0;

    if (this.rgbSplitFilter) {
      const rgbConfig = this.config?.rgbSplit;
      const shouldUseRgb = this.parentContainer.visible && rgbConfig?.enabled;
      if (shouldUseRgb) {
        this.rgbSplitFilter.enabled = true;
        this.rgbSplitFilter.uniforms.uAmount = rgbConfig.amount;
        const screen = canvas?.app?.screen;
        if (screen) {
          this.rgbSplitFilter.uniforms.uTexelSize = [
            1 / screen.width,
            1 / screen.height,
          ];
        }
        if (!this.parentContainer.filters?.includes(this.rgbSplitFilter)) {
          this.parentContainer.filters = [
            ...(this.parentContainer.filters || []),
            this.rgbSplitFilter,
          ];
        }
      } else {
        if (this.parentContainer.filters?.includes(this.rgbSplitFilter)) {
          this.parentContainer.filters = this.parentContainer.filters.filter(
            (f) => f !== this.rgbSplitFilter
          );
        }
      }
    }

    const allFilters = this.parentContainer.filters
      ? [...this.parentContainer.filters]
      : [];

    const manageFilter = (filter, shouldBeActive) => {
      if (!filter) return;
      const isPresent = allFilters.includes(filter);
      if (shouldBeActive && !isPresent) {
        allFilters.push(filter);
      } else if (!shouldBeActive && isPresent) {
        const index = allFilters.indexOf(filter);
        if (index > -1) {
          allFilters.splice(index, 1);
        }
      }
    };

    if (this.displacementFilter) {
      const waterConfig = fullConfig.water;
      const shouldUseDisplacement =
        this.parentContainer.visible && waterConfig?.wave?.enabled;
      manageFilter(this.displacementFilter, shouldUseDisplacement);
    }

    if (this.biofilmMaskFilter) {
      const shouldUseMask = this.parentContainer.visible;
      manageFilter(this.biofilmMaskFilter, shouldUseMask);
    }

    // Manage Fire Tone Curve filter for Flames
    if (this.definition.configPath === "fire.particles") {
      const tc = controllerConfig?.toneCurve;
      const shouldUseTone = this.parentContainer.visible && tc?.enabled;
      if (shouldUseTone) {
        if (!this.fireToneFilter) {
          this.fireToneFilter = new FireToneCurveFilter({
            contrast: tc.contrast,
            gamma: tc.gamma,
            knee: tc.knee,
            coreClamp: tc.coreClamp,
          });
        } else if (this.fireToneFilter.uniforms) {
          const u = this.fireToneFilter.uniforms;
          u.u_contrast = tc.contrast;
          u.u_gamma = tc.gamma;
          u.u_knee = tc.knee;
          u.u_coreClamp = tc.coreClamp;
        }
      }
      manageFilter(this.fireToneFilter, shouldUseTone);

      // Manage Fire Color Correction filter
      const cc = controllerConfig?.colorCorrection;
      const shouldUseCC = this.parentContainer.visible && cc?.enabled;
      if (shouldUseCC) {
        if (!this.fireColorCorrectionFilter) {
          const CCF = globalThis && globalThis.ColorCorrectionFilter;
          if (typeof CCF === "function") {
            this.fireColorCorrectionFilter = new CCF({
              saturation: cc.saturation,
              brightness: cc.brightness,
              contrast: cc.contrast,
              exposure: cc.exposure,
              gamma: cc.gamma,
            });
          } else {
            console.warn(
              "Map Shine | Fire CC requested but ColorCorrectionFilter is not available globally. Skipping."
            );
          }
        } else if (this.fireColorCorrectionFilter?.uniforms) {
          const u = this.fireColorCorrectionFilter.uniforms;
          u.uSaturation = cc.saturation;
          u.uBrightness = cc.brightness;
          u.uContrast = cc.contrast;
          u.uExposure = cc.exposure;
          u.uGamma = cc.gamma;
        }
      }
      manageFilter(this.fireColorCorrectionFilter, shouldUseCC);
    }

    // Use safe filter application for Fire effect container
    safeApplyFilters(this.parentContainer, allFilters.length > 0 ? allFilters : [], "FireEffectController.parentContainer");
  }

  /**
   * Rate-limited rebuild for UI-triggered changes.
   * Debounces rapid slider changes and enforces cooldown between rebuilds.
   * @param {Object} targets - Effect targets from EffectTargetManager
   * @param {Object} config - Active configuration
   */
  requestRebuild(targets, config) {
    const now = Date.now();
    const timeSinceLastRebuild = now - this._lastRebuildTime;
    
    // Clear existing debounce timer
    if (this._rebuildDebounceTimer) {
      clearTimeout(this._rebuildDebounceTimer);
      this._rebuildDebounceTimer = null;
    }
    
    // Store the pending rebuild request
    this._pendingRebuild = { targets, config };
    
    // Check if we're still in cooldown
    if (timeSinceLastRebuild < this._rebuildCooldown) {
      const remainingCooldown = this._rebuildCooldown - timeSinceLastRebuild;
      console.log(`MapShine | ${this.key}: Rebuild requested but in cooldown (${(remainingCooldown/1000).toFixed(1)}s remaining). Queueing for later.`);
      
      // Schedule rebuild for when cooldown expires
      this._rebuildDebounceTimer = setTimeout(() => {
        this._executeRebuild();
      }, remainingCooldown + 100); // Add 100ms buffer
      
      ui.notifications.warn(`Particle rebuild on cooldown. Changes will apply in ${Math.ceil(remainingCooldown/1000)}s.`);
      return;
    }
    
    // Debounce: wait for user to stop changing sliders (500ms)
    console.log(`MapShine | ${this.key}: Rebuild requested, debouncing for 500ms...`);
    this._rebuildDebounceTimer = setTimeout(() => {
      this._executeRebuild();
    }, 500);
  }
  
  /**
   * Executes the actual rebuild after debounce/cooldown
   * @private
   */
  _executeRebuild() {
    if (!this._pendingRebuild) return;
    
    const { targets, config } = this._pendingRebuild;
    const now = Date.now();
    
    console.log(`MapShine | ${this.key}: Executing rate-limited rebuild`);
    
    // Update timestamp BEFORE rebuild to prevent race conditions
    this._lastRebuildTime = now;
    this._pendingRebuild = null;
    this._rebuildDebounceTimer = null;
    
    // Perform the actual rebuild
    this.destroyAllEmitters();
    this.updateTargets(targets, config, {});
    
    ui.notifications.info(`${this.key} particles rebuilding... (5s cooldown active)`);
  }

  destroyAllEmitters() {
    if (!this.emitters) this.emitters = new Map();
    if (!this.pendingTargets) this.pendingTargets = new Map();

    for (const { emitter } of this.emitters.values()) {
      if (emitter._customMaskTexture) {
        emitter._customMaskTexture.destroy(false);
        emitter._customMaskTexture = null;
      }
      emitter.destroy();
    }
    this.emitters.clear();
    this.pendingTargets.clear();
    
    // CRITICAL: Clean up any orphaned particle sprites after destroying emitters
    // This catches particles that escape proper cleanup during batch operations
    this._cleanupOrphanedParticles();
    
    // NUCLEAR OPTION: Force remove ALL children from containers as final safety net
    // This ensures zero orphans remain, even if detection logic has bugs
    if (this.particleOnlyContainer && this.particleOnlyContainer.children.length > 0) {
      console.warn(`MapShine | ${this.key}: Forcibly removing ${this.particleOnlyContainer.children.length} remaining children from particleOnlyContainer`);
      const removed = this.particleOnlyContainer.removeChildren();
      removed.forEach(child => {
        if (child && !child.destroyed) child.destroy({ children: true, texture: false, baseTexture: false });
      });
    }
    if (this.parentContainer && !this.particleOnlyContainer && this.parentContainer.children.length > 0) {
      console.warn(`MapShine | ${this.key}: Forcibly removing ${this.parentContainer.children.length} remaining children from parentContainer`);
      const removed = this.parentContainer.removeChildren();
      removed.forEach(child => {
        if (child && !child.destroyed) child.destroy({ children: true, texture: false, baseTexture: false });
      });
    }
  }

  destroy() {
    this.destroyAllEmitters();

    this.rgbSplitFilter?.destroy();
    this.displacementFilter?.destroy();
    this.displacementSprite?.destroy();
    this.fireToneFilter?.destroy();
    this.fireColorCorrectionFilter?.destroy();

    this.biofilmMaskFilter?.destroy();
    this.particleOutputTexture?.destroy(false);

    this.rgbSplitFilter = null;
    this.displacementFilter = null;
    this.displacementSprite = null;
    this.fireToneFilter = null;
    this.fireColorCorrectionFilter = null;
    this.biofilmMaskFilter = null;
    this.particleOutputTexture = null;

    this.particleOnlyContainer?.destroy({
      children: true,
    });
    this.particleOnlyContainer = null;

    if (this.parentContainer) {
      this.parentContainer.filters = null;
      this.parentContainer = null;
    }
  }
}


/**
 * Helper function to add blend mode as a behavior to particle emitters.
 * The PIXI particle emitter requires blend modes to be set via a behavior, not just the config.
 * @param {Array} behaviors - The behaviors array to add the blend mode to
 * @param {number} blendMode - The numeric PIXI blend mode constant
 */
const addBlendModeBehavior = (behaviors, blendMode) => {
  // Convert numeric blend mode to string name for BlendModeBehavior
  const blendModeNames = {
    [PIXI.BLEND_MODES.NORMAL]: "normal",
    [PIXI.BLEND_MODES.ADD]: "add",
    [PIXI.BLEND_MODES.MULTIPLY]: "multiply",
    [PIXI.BLEND_MODES.SCREEN]: "screen",
    [PIXI.BLEND_MODES.OVERLAY]: "overlay",
    [PIXI.BLEND_MODES.DARKEN]: "darken",
    [PIXI.BLEND_MODES.LIGHTEN]: "lighten",
    [PIXI.BLEND_MODES.COLOR_DODGE]: "color_dodge",
    [PIXI.BLEND_MODES.COLOR_BURN]: "color_burn",
    [PIXI.BLEND_MODES.HARD_LIGHT]: "hard_light",
    [PIXI.BLEND_MODES.SOFT_LIGHT]: "soft_light",
    [PIXI.BLEND_MODES.DIFFERENCE]: "difference",
    [PIXI.BLEND_MODES.EXCLUSION]: "exclusion",
  };
  const blendModeName = blendModeNames[blendMode] || "normal";

  behaviors.push({
    type: "blendMode",
    config: {
      blendMode: blendModeName,
    },
  });
};

const buildParticleEmitterConfig = (
  effectConfig,
  targetData,
  maskKey,
  groupData = null,
  options = {}
) => {
  const globalParticleConfig =
    game.mapShine.profileManager.activeConfig.particleSystems;
  const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
  const config = effectConfig || {};
  const rect = targetData?.rect;

  if (!rect) {
    return {
      lifetime: { min: 1, max: 1 },
      frequency: 9999,
      maxParticles: 0,
      behaviors: [],
    };
  }

  let intensityMultiplier = 1.0;
  if (groupData?.emission) {
    intensityMultiplier = groupData.emission.intensity ?? 1.0;
  }

  const spawnMaskTexture = targetData[maskKey];
  if (!spawnMaskTexture) {
    return { maxParticles: 0, behaviors: [] };
  }

  const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

  const spawnData = {
    texture: spawnMaskTexture,
    width: rect.width,
    height: rect.height,
    x: 0,
    y: 0,
    threshold: (config.maskThreshold ?? 0.5) * 255,
    isDynamicScreenMask: isScreenSpaceMask,
  };

  // For metallic glints, we need to sample color from the base texture, not the specular map
  if (maskKey === "specular" && targetData.baseTexturePath) {
    spawnData.colorTexturePath = targetData.baseTexturePath;
  }

  if (options.spawnMode === "range") {
    spawnData.spawnMode = "range";
    spawnData.upperThreshold = (config.maskUpperThreshold ?? 0.8) * 255;
  }

  const spawnBehavior = {
    type: "spawnShape",
    config: {
      type: "textureMask",
      data: spawnData,
    },
  };

  /** @type {Array<{type: string, config: any}>} */
  const behaviors = [
    {
      type: "textureSingle",
      config: {
        texture:
          config.particleTexture ?? "modules/map-shine/assets/particle.webp",
      },
    },
    spawnBehavior,
  ];

  if (config.colorAlphaGradient && config.colorAlphaGradient.length > 0) {
    const {
      isColorStatic,

      staticColor,
      colorList,

      isAlphaStatic,

      staticAlpha,
      alphaList,
    } = _generateBehaviorListsFromGradient(config.colorAlphaGradient);

    // If the effect is driven by the specular map (i.e., metallicGlints),
    // source the particle color from the spawn point on the map itself.
    if (maskKey === "specular") {
      behaviors.push({ type: "colorFromSpawn", config: {} });
    }
    // For all other effects, use the standard gradient-based coloring.
    else {
      if (isColorStatic) {
        behaviors.push({ type: "colorStatic", config: { color: staticColor } });
      } else {
        behaviors.push({ type: "color", config: { color: colorList } });
      }
    }

    // Alpha is handled by the gradient for all effects.
    if (isAlphaStatic) {
      behaviors.push({ type: "alphaStatic", config: { alpha: staticAlpha } });
    } else {
      behaviors.push({ type: "alpha", config: { alpha: alphaList } });
    }
  }

  const scaleConfig = config.scale ?? {};
  const startScale =
    (scaleConfig.start ?? 0.05) * (scaleConfig.sizeMultiplier ?? 1.0);
  const endScale =
    (scaleConfig.end ?? 0.15) * (scaleConfig.sizeMultiplier ?? 1.0);
  if (startScale === endScale) {
    behaviors.push({
      type: "scaleStatic",
      config: {
        min: startScale,
        max: startScale,
      },
    });
  } else {
    behaviors.push({
      type: "scale",
      config: {
        scale: {
          start: startScale,
          end: endScale,
        },
        minMult: scaleConfig.minMult ?? 0.5,
      },
    });
  }

  const lifetimeConfig = config.lifetime ?? {};

  // Add the new lighting behavior
  // Skip emissive for specular-based effects (metallicGlints) since they get color from spawn
  if (config.emissiveGradient && maskKey !== "specular") {
    const emissiveLists = _generateEmissiveColorListFromGradient(
      config.emissiveGradient
    );
    behaviors.push({
      type: "mapShineLighting",
      config: {
        emissive: emissiveLists.brightnessList,
        emissiveColor: emissiveLists.colorList,
      },
    });
  }

  // Add blend mode as a behavior (required for particles to respect it)
  const blendMode = config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
  addBlendModeBehavior(behaviors, blendMode);

  const emitterConfig = {
    lifetime: {
      min: lifetimeConfig.min ?? 4,
      max: lifetimeConfig.max ?? 12,
    },
    blendMode: blendMode,
    frequency:
      (config.frequency ?? 0.1) / globalMultiplier / intensityMultiplier,
    emitterLifetime: -1,
    maxParticles: Math.max(
      1,
      2000 *
        (config.maskInfluence ?? 1.0) *
        globalMultiplier *
        intensityMultiplier
    ),
    pos: {
      x: isScreenSpaceMask ? 0 : rect.x,
      y: isScreenSpaceMask ? 0 : rect.y,
    },
    addAtBack: false,
    behaviors: behaviors,
  };

  const speedConfig = config.speed ?? {};

  // --- REFACTORED MOVEMENT LOGIC ---
  if (maskKey === "fire") {
    // Fire particles have special movement logic for rising.
    if (config.wind?.enabled) {
      // With wind, all movement is handled by the custom WindBehavior.
      // We do NOT add moveAcceleration or set emitterConfig.speed, as that would
      // create conflicts with our custom physics simulation.
      behaviors.push({
        type: "wind",
        config: config.wind,
      });
    } else {
      // Without wind, fire still needs to rise. Use a simple initial upward velocity.
      emitterConfig.rotation = -90; // Point upwards
      emitterConfig.speed = {
        min: speedConfig.start ?? 1,
        max: speedConfig.end ?? 2,
      };
    }
  } else {
    // All other particle types use the standard moveSpeed behavior.
    const startSpeed = speedConfig.start ?? 5;
    const endSpeed = speedConfig.end ?? 15;
    if (startSpeed === endSpeed) {
      behaviors.push({
        type: "moveSpeedStatic",
        config: {
          min: startSpeed,
          max: startSpeed,
        },
      });
    } else {
      behaviors.push({
        type: "moveSpeed",
        config: {
          speed: {
            start: startSpeed,
            end: endSpeed,
          },
          minMult: speedConfig.minMult ?? 0.5,
        },
      });
    }
  }
  // --- END REFACTORED MOVEMENT LOGIC ---

  const rotConfig = config.rotation ?? {};
  if (rotConfig.enabled) {
    behaviors.push({
      type: "rotation",
      config: {
        minStart: 0,
        maxStart: 360,
        minSpeed: rotConfig.minSpeed ?? 0,
        maxSpeed: rotConfig.maxSpeed ?? 20,
        accel: rotConfig.accel ?? 0,
      },
    });
  } else {
    behaviors.push({
      type: "rotationStatic",
      config: {
        min: 0,
        max: 360,
      },
    });
  }

  return emitterConfig;
};

const buildSparkEmitterConfig = (effectConfig, targetData, maskKey) => {
  const globalParticleConfig =
    game.mapShine.profileManager.activeConfig.particleSystems;
  const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
  const config = effectConfig || {};
  const rect = targetData?.rect;

  if (!rect) {
    return {
      maxParticles: 0,
      behaviors: [],
    };
  }

  const spawnMaskTexture = targetData[maskKey];
  if (!spawnMaskTexture) {
    return {
      maxParticles: 0,
      behaviors: [],
    };
  }

  const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

  const spawnBehavior = {
    type: "spawnShape",
    config: {
      type: "textureMask",
      data: {
        texture: spawnMaskTexture,
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        threshold: (config.maskThreshold ?? 0.95) * 255,
        isDynamicScreenMask: isScreenSpaceMask,
      },
    },
  };

  const lifetimeConfig = config.lifetime ?? {};

  /** @type {Array<{type: string, config: any}>} */
  const behaviors = [
    {
      type: "textureSingle",
      config: {
        texture: config.particleTexture,
      },
    },
    spawnBehavior,
  ];

  // Add the new lighting behavior
  if (config.emissiveGradient) {
    const emissiveLists = _generateEmissiveColorListFromGradient(
      config.emissiveGradient
    );
    behaviors.push({
      type: "mapShineLighting",
      config: {
        emissive: emissiveLists.brightnessList,
        emissiveColor: emissiveLists.colorList,
      },
    });
  }

  if (config.colorAlphaGradient && config.colorAlphaGradient.length > 0) {
    const {
      isColorStatic,

      staticColor,
      colorList,

      isAlphaStatic,

      staticAlpha,
      alphaList,
    } = _generateBehaviorListsFromGradient(config.colorAlphaGradient);

    if (isColorStatic) {
      behaviors.push({ type: "colorStatic", config: { color: staticColor } });
    } else {
      behaviors.push({ type: "color", config: { color: colorList } });
    }

    if (isAlphaStatic) {
      behaviors.push({ type: "alphaStatic", config: { alpha: staticAlpha } });
    } else {
      behaviors.push({ type: "alpha", config: { alpha: alphaList } });
    }
  }

  const scaleConfig = config.scale ?? {};
  const pathConfig = config.path ?? {};
  const speedConfig = pathConfig.speed ?? {};

  const startScale =
    (scaleConfig.start ?? 1.0) * (scaleConfig.sizeMultiplier ?? 1.0);
  const endScale =
    (scaleConfig.end ?? 0.1) * (scaleConfig.sizeMultiplier ?? 1.0);
  if (startScale === endScale) {
    behaviors.push({
      type: "scaleStatic",
      config: {
        min: startScale,
        max: startScale,
      },
    });
  } else {
    behaviors.push({
      type: "scale",
      config: {
        scale: {
          start: startScale,
          end: endScale,
        },
        minMult: scaleConfig.minMult ?? 0.5,
      },
    });
  }

  behaviors.push({
    type: "sparkPath",
    config: {
      speed: {
        list: [
          {
            value: speedConfig.start ?? 80,
            time: 0,
          },
          {
            value: speedConfig.end ?? 40,
            time: 1,
          },
        ],
      },
      speedMinMult: speedConfig.minMult ?? 0.7,
      amplitude: pathConfig.amplitude ?? {
        min: 10,
        max: 40,
      },
      frequency: pathConfig.frequency ?? {
        min: 40,
        max: 80,
      },
      offset: pathConfig.offset ?? {
        min: 0,
        max: 6.28,
      },
      damping: pathConfig.damping ?? 0.5,
      angle: pathConfig.angle ?? {
        min: -20,
        max: 20,
      },
      motionBlur: pathConfig.motionBlur,
    },
  });

  // Add blend mode as a behavior (required for particles to respect it)
  const blendMode = config.blendMode ?? PIXI.BLEND_MODES.ADD;
  addBlendModeBehavior(behaviors, blendMode);

  return {
    lifetime: {
      min: lifetimeConfig.min ?? 1.5,
      max: lifetimeConfig.max ?? 3.0,
    },
    blendMode: blendMode,
    frequency: config.frequency / globalMultiplier,
    emitterLifetime: -1,
    maxParticles: Math.max(
      1,
      2000 * (config.maskInfluence ?? 0.5) * globalMultiplier
    ),
    pos: {
      x: isScreenSpaceMask ? 0 : rect.x,
      y: isScreenSpaceMask ? 0 : rect.y,
    },
    addAtBack: false,
    behaviors: behaviors,
  };
};

const buildCandleFlameEmitterConfig = (effectConfig, targetData, group) => {
  const globalParticleConfig =
    game.mapShine.profileManager.activeConfig.particleSystems;
  const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
  const config = effectConfig || {};

  // Candle flames are point-based, so they don't use a rect from a texture target.
  // The emitter position will be handled by the geometry spawner.
  if (!group || group.type !== "point" || group.points.length === 0) {
    return { maxParticles: 0, behaviors: [] };
  }

  const spawnBehavior = {
    type: "spawnShape",
    config: {
      type: "geometryMask",
      data: { group },
    },
  };

  const behaviors = [
    {
      type: "textureSingle",
      config: { texture: config.particleTexture },
    },
    spawnBehavior,
    {
      type: "candleFlame",
      config: config.jiggle,
    },
  ];

  // Color & Alpha
  if (config.colorAlphaGradient?.length > 0) {
    const {
      isColorStatic,
      staticColor,
      colorList,
      isAlphaStatic,
      staticAlpha,
      alphaList,
    } = _generateBehaviorListsFromGradient(config.colorAlphaGradient);
    if (isColorStatic)
      behaviors.push({ type: "colorStatic", config: { color: staticColor } });
    else behaviors.push({ type: "color", config: { color: colorList } });

    if (isAlphaStatic)
      behaviors.push({ type: "alphaStatic", config: { alpha: staticAlpha } });
    else behaviors.push({ type: "alpha", config: { alpha: alphaList } });
  }

  // Scale
  const scaleConfig = config.scale ?? {};
  const startScale =
    (scaleConfig.start ?? 0.5) * (scaleConfig.sizeMultiplier ?? 1.0);
  const endScale =
    (scaleConfig.end ?? 1.2) * (scaleConfig.sizeMultiplier ?? 1.0);
  behaviors.push({
    type: "scale",
    config: {
      scale: { start: startScale, end: endScale },
      minMult: scaleConfig.minMult ?? 0.8,
    },
  });

  // Lighting/Emissive
  if (config.emissiveGradient) {
    const emissiveLists = _generateEmissiveColorListFromGradient(
      config.emissiveGradient
    );
    behaviors.push({
      type: "mapShineLighting",
      config: {
        emissive: emissiveLists.brightnessList,
        emissiveColor: emissiveLists.colorList,
      },
    });
  }

  // Blend Mode
  const blendMode = config.blendMode ?? PIXI.BLEND_MODES.ADD;
  addBlendModeBehavior(behaviors, blendMode);

  return {
    lifetime: config.lifetime,
    frequency: config.frequency / globalMultiplier,
    emitterLifetime: -1,
    maxParticles: Math.floor(200 * globalMultiplier), // A sensible limit for a single flame point
    pos: { x: 0, y: 0 }, // Position is handled by spawnShape
    addAtBack: false,
    behaviors: behaviors,
    blendMode: blendMode,
  };
};

const buildPressurisedSteamEmitterConfig = (
  effectConfig,
  targetData,
  maskKey
) => {
  // This is mostly a copy of buildParticleEmitterConfig with modifications
  const globalParticleConfig =
    game.mapShine.profileManager.activeConfig.particleSystems;
  const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
  const config = effectConfig || {};
  const rect = targetData?.rect;

  if (!rect) {
    return { maxParticles: 0, behaviors: [] };
  }

  const spawnMaskTexture = targetData[maskKey];
  if (!spawnMaskTexture) {
    return { maxParticles: 0, behaviors: [] };
  }

  const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

  const spawnBehavior = {
    type: "spawnShape",
    config: {
      type: "textureMask",
      data: {
        texture: spawnMaskTexture,
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        threshold: (config.maskThreshold ?? 0.5) * 255,
        isDynamicScreenMask: isScreenSpaceMask,
      },
    },
  };

  const pathConfig = config.path ?? {};
  const minAngle = pathConfig.angle?.min ?? -100;
  const maxAngle = pathConfig.angle?.max ?? -80;

  /** @type {Array<{type: string, config: any}>} */
  const behaviors = [
    {
      type: "textureSingle",
      config: { texture: config.particleTexture },
    },
    spawnBehavior,
    // The custom behavior now receives the full speed config to manage movement.
    {
      type: "pressurisedSteam",
      config: {
        ...(config.burst ?? {}),
        minAngle: minAngle,
        maxAngle: maxAngle,
        speed: config.speed ?? { start: 250, end: 20, minMult: 0.8 },
      },
    },
  ];

  // Color/Alpha
  if (config.colorAlphaGradient && config.colorAlphaGradient.length > 0) {
    const {
      isColorStatic,

      staticColor,
      colorList,

      isAlphaStatic,

      staticAlpha,
      alphaList,
    } = _generateBehaviorListsFromGradient(config.colorAlphaGradient);
    if (isColorStatic) {
      behaviors.push({ type: "colorStatic", config: { color: staticColor } });
    } else {
      behaviors.push({ type: "color", config: { color: colorList } });
    }
    if (isAlphaStatic) {
      behaviors.push({ type: "alphaStatic", config: { alpha: staticAlpha } });
    } else {
      behaviors.push({ type: "alpha", config: { alpha: alphaList } });
    }
  }

  // Scale
  const scaleConfig = config.scale ?? {};
  const startScale =
    (scaleConfig.start ?? 0.2) * (scaleConfig.sizeMultiplier ?? 1.0);
  const endScale =
    (scaleConfig.end ?? 1.5) * (scaleConfig.sizeMultiplier ?? 1.0);
  behaviors.push({
    type: "scale",
    config: {
      scale: { start: startScale, end: endScale },
      minMult: scaleConfig.minMult ?? 0.7,
    },
  });

  // Lighting
  if (config.emissiveGradient) {
    const emissiveLists = _generateEmissiveColorListFromGradient(
      config.emissiveGradient
    );
    behaviors.push({
      type: "mapShineLighting",
      config: {
        emissive: emissiveLists.brightnessList,
        emissiveColor: emissiveLists.colorList,
      },
    });
  }

  // Rotation
  const rotConfig = config.rotation ?? {};
  if (rotConfig.enabled) {
    behaviors.push({
      type: "rotation",
      config: {
        minStart: 0,
        maxStart: 360,
        minSpeed: rotConfig.minSpeed ?? -50,
        maxSpeed: rotConfig.maxSpeed ?? 50,
        accel: rotConfig.accel ?? 0,
      },
    });
  }

  const lifetimeConfig = config.lifetime ?? {};

  // Add blend mode as a behavior (required for particles to respect it)
  const blendMode = config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
  addBlendModeBehavior(behaviors, blendMode);

  return {
    lifetime: {
      min: lifetimeConfig.min ?? 0.5,
      max: lifetimeConfig.max ?? 2.0,
    },
    blendMode: blendMode,
    frequency: config.burst?.frequency ?? 0.005,
    emitterLifetime: -1,
    maxParticles: Math.floor(
      2000 * (config.maskInfluence ?? 1.5) * globalMultiplier
    ),
    pos: {
      x: isScreenSpaceMask ? 0 : rect.x,
      y: isScreenSpaceMask ? 0 : rect.y,
    },
    addAtBack: false,
    behaviors: behaviors,
  };
};

class WindBehavior {
  static type = "wind";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
    this.config = config;
    this.turbulence = config.turbulence || 0; // Turbulence intensity (0-1)
  }

  /**
   * Initializes particles for this behavior.
   * This is required by the emitter library.
   * @param {PIXI.particles.Particle} first The first particle in the batch.
   */
  initParticles(first) {
    let p = first;
    while (p) {
      // Each particle gets its own velocity vector, initialized to zero.
      p.velocity = new PIXI.Point(0, 0);
      // Random turbulence phase for each particle
      p.turbulencePhase = Math.random() * Math.PI * 2;
      p = p.next;
    }
  }

  /**
   * Updates a single particle by applying wind forces and turbulence.
   * @param {PIXI.particles.Particle} particle The particle to update.
   * @param {number} deltaSec The time elapsed in seconds.
   */
  updateParticle(particle, deltaSec) {
    const windManager = game.mapShine?.windManager;
    // Do nothing if the particle is invalid or the necessary systems aren't ready.

    if (!particle.velocity || !windManager || !this.config.enabled) return;

    // STOP ALL WIND EFFECTS when particle hits ground (90%+)
    if (particle.agePercent >= 0.90) {
      return; // No wind or turbulence after ground impact
    }

    // Calculate wind acceleration multiplier (0 to 1 based on particle age)
    let windMultiplier = 1.0;
    if (this.config.accelerationTime && this.config.accelerationTime > 0) {
      // Gradually ramp up from 0 to 1 over accelerationTime seconds
      const ageInSeconds = particle.age;
      windMultiplier = Math.min(1.0, ageInSeconds / this.config.accelerationTime);
    }

    // 1. Get the current wind force from the manager.
    const windAngleRad = windManager.angle * (Math.PI / 180.0);
    const windForce = windManager.speed * this.config.force * windMultiplier;
    const windAccelX = Math.cos(windAngleRad) * windForce;
    const windAccelY = -Math.sin(windAngleRad) * windForce;  // Negate for screen Y-axis

    // 2. Add turbulence - random chaotic motion scaled by wind speed
    //    Only apply turbulence between 50-85% of particle lifetime
    let turbulenceX = 0;
    let turbulenceY = 0;
    if (this.turbulence > 0) {
      // Calculate turbulence multiplier based on particle age (0-1)
      let turbulenceMultiplier = 0;
      const agePercent = particle.agePercent; // 0.0 at birth, 1.0 at death
      
      if (agePercent < 0.50) {
        // 0-50%: No turbulence
        turbulenceMultiplier = 0;
      } else if (agePercent < 0.55) {
        // 50-55%: Smoothly ramp up turbulence
        turbulenceMultiplier = (agePercent - 0.50) / 0.05;
      } else if (agePercent < 0.80) {
        // 55-80%: Full turbulence
        turbulenceMultiplier = 1.0;
      } else if (agePercent < 0.85) {
        // 80-85%: Smoothly ramp down turbulence
        turbulenceMultiplier = 1.0 - ((agePercent - 0.80) / 0.05);
      } else {
        // 85-90%: No turbulence (preparing for ground)
        turbulenceMultiplier = 0;
      }
      
      // Turbulence intensity scales with wind speed (more wind = more chaos)
      const turbulenceIntensity = this.turbulence * windManager.speed * 0.5 * turbulenceMultiplier;
      
      // Use time-based noise for smooth chaotic motion
      particle.turbulencePhase += deltaSec * 3; // Advance phase
      turbulenceX = Math.sin(particle.turbulencePhase) * turbulenceIntensity;
      turbulenceY = Math.cos(particle.turbulencePhase * 1.3) * turbulenceIntensity;
    }

    // 3. Calculate the total acceleration for this frame (wind + turbulence).
    const totalAccelX = windAccelX + turbulenceX;
    const totalAccelY = windAccelY + turbulenceY;

    // 4. Update the particle's velocity based on the total acceleration.
    particle.velocity.x += totalAccelX * deltaSec;
    particle.velocity.y += totalAccelY * deltaSec;

    // 5. Update the particle's screen position based on its new velocity.
    particle.position.x += particle.velocity.x * deltaSec;
    particle.position.y += particle.velocity.y * deltaSec;
  }
}

/**
 * ZDepthBehavior - Simulates a Z-axis (height/depth) for particles in top-down view
 * Particles fall through virtual 3D space while staying in roughly the same X/Y map position
 * Provides perspective scaling (far = small, near = large) and Z-velocity for streaks
 */
class ZDepthBehavior {
  static type = "zDepth";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal; // Run during normal update
    this.startHeight = config.startHeight || 1000; // Starting Z-height in pixels
    this.endHeight = config.endHeight || 0; // Ground level (Z=0)
    
    // Validate fallSpeed - ensure min/max are numbers, not undefined
    const fallSpeedConfig = config.fallSpeed || {};
    this.fallSpeedMin = fallSpeedConfig.min ?? 400; // Default: 400 px/s
    this.fallSpeedMax = fallSpeedConfig.max ?? 600; // Default: 600 px/s
    
    this.scaleAtTop = config.scaleAtTop || 3.0; // Scale when at max height (far from camera)
    this.scaleAtBottom = config.scaleAtBottom || 0.1; // Scale when at ground (near camera)
  }

  /**
   * Initialize particles with Z-height and Z-velocity
   */
  initParticles(first) {
    let particle = first;
    while (particle) {
      // Initialize Z-coordinate (height above ground)
      if (!particle.zDepth) {
        particle.zDepth = {};
      }
      
      // Start at maximum height
      particle.zDepth.z = this.startHeight;
      particle.zDepth.startHeight = this.startHeight; // Store for VelocityStreakBehavior
      
      // Random fall speed within range
      const speed = this.fallSpeedMin + Math.random() * (this.fallSpeedMax - this.fallSpeedMin);
      particle.zDepth.zVelocity = -speed; // Negative = falling downward
      
      particle = particle.next;
    }
  }

  /**
   * Update particle Z-position and apply perspective scaling
   */
  updateParticle(particle, deltaSec) {
    if (!particle.zDepth) {
      // Initialize if missing (shouldn't happen)
      particle.zDepth = {
        z: this.startHeight,
        zVelocity: -(this.fallSpeedMin + Math.random() * (this.fallSpeedMax - this.fallSpeedMin))
      };
    }

    // Update Z-position (falling through virtual space)
    particle.zDepth.z += particle.zDepth.zVelocity * deltaSec;
    
    // Clamp to ground level (don't go below 0)
    if (particle.zDepth.z < this.endHeight) {
      particle.zDepth.z = this.endHeight;
      particle.zDepth.zVelocity = 0;
    }
    
    // Calculate perspective scale based on Z-height
    // Higher Z = farther from camera = smaller scale
    // Lower Z = closer to camera = larger scale
    const heightPercent = particle.zDepth.z / this.startHeight; // 1.0 at top, 0.0 at bottom
    const perspectiveScale = this.scaleAtTop + (this.scaleAtBottom - this.scaleAtTop) * (1.0 - heightPercent);
    
    // Apply perspective scale (this is the base scale, VelocityStreakBehavior will modify Y-scale)
    particle.scale.x = perspectiveScale;
    particle.scale.y = perspectiveScale;
  }
}

class MapShineLightingBehavior {
  static type = "mapShineLighting";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late + 1; // Run after color and alpha
    this.config = config;
    this._emissive = null;
    this._isStatic = false;
    this._emissiveColor = null;
    this._colorIsStatic = false;

    // Brightness list (for alpha/lighting calculations)
    if (
      config.emissive &&
      config.emissive.list &&
      config.emissive.list.length > 0
    ) {
      if (config.emissive.list.length === 1) {
        this._isStatic = true;
        this._emissive = config.emissive.list[0].value;
      } else if (config.emissive.list.length > 1) {
        try {
          this._emissive = new PIXI.particles.PropertyList(false);
          this._emissive.reset(
            PIXI.particles.PropertyNode.createList(config.emissive)
          );
        } catch (e) {
          console.warn(
            "MapShine | Failed to create emissive PropertyList:",
            e,
            config.emissive
          );
          // Fallback to static value using first entry
          this._isStatic = true;
          this._emissive = config.emissive.list[0].value;
        }
      }
    }

    // Color list (for tint animation)
    // Store as raw array for manual interpolation since PropertyList doesn't handle colors well
    if (config.emissiveColor && config.emissiveColor.list) {
      if (config.emissiveColor.list.length === 1) {
        this._colorIsStatic = true;
        this._emissiveColor = config.emissiveColor.list[0].value;
      } else if (config.emissiveColor.list.length > 1) {
        // Store the sorted list for manual interpolation
        this._emissiveColor = [...config.emissiveColor.list].sort(
          (a, b) => a.time - b.time
        );
      }
    }
  }

  initParticles() {
    // No per-particle init needed
  }

  /**
   * Manually interpolates a color value from a sorted list based on age percent.
   * @param {Array} colorList - Sorted array of {time, value} objects where value is a color integer
   * @param {number} agePercent - Age of the particle (0.0 to 1.0)
   * @returns {number} Interpolated color as integer (0xRRGGBB)
   * @private
   */
  _interpolateColor(colorList, agePercent) {
    // Find the two stops to interpolate between
    let i = 0;
    while (i < colorList.length - 1 && colorList[i + 1].time < agePercent) {
      i++;
    }

    // If we're at or past the last stop, return the last color
    if (i >= colorList.length - 1) {
      return colorList[colorList.length - 1].value;
    }

    const startStop = colorList[i];
    const endStop = colorList[i + 1];

    // Calculate interpolation factor between the two stops
    const t = (agePercent - startStop.time) / (endStop.time - startStop.time);

    // Extract RGB components from both colors
    const startR = (startStop.value >> 16) & 0xff;
    const startG = (startStop.value >> 8) & 0xff;
    const startB = startStop.value & 0xff;

    const endR = (endStop.value >> 16) & 0xff;
    const endG = (endStop.value >> 8) & 0xff;
    const endB = endStop.value & 0xff;

    // Interpolate each component
    const r = Math.round(startR + (endR - startR) * t);
    const g = Math.round(startG + (endG - startG) * t);
    const b = Math.round(startB + (endB - startB) * t);

    // Combine back into integer
    return (r << 16) | (g << 8) | b;
  }

  updateParticle(particle) {
    // This behavior runs *after* the standard Alpha behavior, so particle.alpha
    // has already been set for this frame according to its lifetime gradient.
    if (particle.alpha === undefined || this._emissive === null) return;

    // Get the particle's "emissive strength" for the current frame (0.0 to 1.0).
    let emissiveValue;
    try {
      emissiveValue = this._isStatic
        ? this._emissive
        : this._emissive.interpolate(particle.agePercent);
    } catch (e) {
      // If interpolation fails, bail out
      console.warn("MapShine | Emissive interpolation failed:", e);
      return;
    }

    // Get the emissive color for the current frame (if color animation is enabled)
    let emissiveColor = null;
    if (this._emissiveColor !== null) {
      if (this._colorIsStatic) {
        emissiveColor = this._emissiveColor;
      } else {
        // Manual interpolation for color values
        emissiveColor = this._interpolateColor(
          this._emissiveColor,
          particle.agePercent
        );
      }
    }

    // Get scene darkness level (0.0 is bright, 1.0 is pitch black).
    const darkness = canvas.scene?.environment.darknessLevel ?? 0;
    const lightLevel = 1.0 - darkness;

    // Store the alpha that the particle *would* have based on its lifetime fade.
    const baseAlpha = particle.alpha;

    // Step 1: Calculate the particle's alpha after being affected by scene darkness.
    const darkenedAlpha = baseAlpha * lightLevel;

    // Step 2: Calculate the emissive boost. The boost is the particle's emissive
    // strength, also scaled by its base lifetime alpha. This ensures a particle
    // that is fading out also has its glow fade out.
    const emissiveBoost = baseAlpha * emissiveValue;

    // Step 3: The final alpha is the darkened alpha plus the emissive boost.
    // For non-emissive particles (emissiveValue=0), this is just the darkenedAlpha.
    // For emissive particles, this adds their glow back on top of the darkened base.
    particle.alpha = darkenedAlpha + emissiveBoost;

    // Step 4: Apply emissive color and brightness to the particle tint.
    if (emissiveValue > 0) {
      // If we have an emissive color animation, use it directly as the base tint
      // Otherwise, use the particle's current tint
      let baseTint =
        emissiveColor !== null ? emissiveColor : particle.tint ?? 0xffffff;

      // Scale up the brightness - emissiveValue of 1.0 makes it much brighter
      const brightnessMultiplier = 1.0 + emissiveValue * 3.0; // Up to 4x brighter at full emissive

      // Extract RGB from the base tint (stored as a single integer)
      const r = ((baseTint >> 16) & 0xff) / 255;
      const g = ((baseTint >> 8) & 0xff) / 255;
      const b = (baseTint & 0xff) / 255;

      // Brighten the color, clamping to white (1.0)
      const brightR = Math.min(1.0, r * brightnessMultiplier);
      const brightG = Math.min(1.0, g * brightnessMultiplier);
      const brightB = Math.min(1.0, b * brightnessMultiplier);

      // Convert back to integer tint
      particle.tint =
        ((brightR * 255) << 16) | ((brightG * 255) << 8) | (brightB * 255);
    } else if (emissiveColor !== null) {
      // Even with no brightness, apply the emissive color if it exists
      particle.tint = emissiveColor;
    }
  }

  destroy() {
    // No special cleanup needed
  }
}


/**
 * VelocityStreakBehavior - Dynamically adjusts rain particle rotation and scale based on velocity
 * Creates realistic motion blur streaks that lengthen with speed
 * NOW USES Z-VELOCITY from ZDepthBehavior for streak length
 */
class VelocityStreakBehavior {
  static type = "velocityStreak";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late; // Run after movement
    this.baseStreakLength = config.baseStreakLength || 1.0; // Multiplier for streak length
    this.minStretch = config.minStretch || 1.0; // Minimum Y-scale
    this.maxStretch = config.maxStretch || 3.0; // Maximum Y-scale
    this.velocityThreshold = config.velocityThreshold || 50; // Speed needed for max stretch
    this.fadeInTime = config.fadeInTime || 0.1; // Fade in streak during first 10% of life
    this.fadeOutTime = config.fadeOutTime || 0.9; // Fade out streak during last 10% of life
  }

  /**
   * Initialize particles with streak properties
   */
  initParticles(first) {
    // Nothing to initialize
  }

  /**
   * Update particle rotation and scale based on Z-velocity (falling speed)
   */
  updateParticle(particle, deltaSec) {
    // Use Z-velocity for streak length (falling speed through virtual 3D space)
    const zVelocity = particle.zDepth?.zVelocity || 0;
    const speed = Math.abs(zVelocity); // Falling speed magnitude
    
    if (speed > 1) {
      // TOP-DOWN VIEW: Rain falls straight down through Z-axis
      // Streaks should always be VERTICAL (pointing down the screen) regardless of wind
      // Wind only creates horizontal drift, but doesn't tilt the rain
      // rotation = 0 keeps the texture vertical (our 1x8px texture is already vertical)
      particle.rotation = 0;

      // Stretch Y-scale based on Z-speed (falling speed)
      // Faster falling = longer streaks
      const stretchFactor = Math.min(speed / this.velocityThreshold, 1.0);
      const yStretch = this.minStretch + (this.maxStretch - this.minStretch) * stretchFactor;
      
      // Fade streak length based on Z-height (fade in when spawning high, fade out when reaching ground)
      const zHeight = particle.zDepth?.z || 0;
      const zMax = particle.zDepth?.startHeight || 1000;
      const heightPercent = zHeight / zMax; // 1.0 at top, 0.0 at bottom
      
      let heightFade = 1.0;
      
      if (heightPercent > this.fadeOutTime) {
        // Fade in at top: 1.0→0.9 height = 0→1 fade
        heightFade = (1.0 - heightPercent) / (1.0 - this.fadeOutTime);
      } else if (heightPercent < this.fadeInTime) {
        // Fade out at bottom: 0.1→0.0 height = 0→1 fade
        heightFade = heightPercent / this.fadeInTime;
      }
      
      // Apply the stretch with height fade
      particle.scale.y = particle.scale.x * yStretch * this.baseStreakLength * heightFade;
    } else {
      // At low/zero speed, keep scale minimal
      particle.scale.y = particle.scale.x;
    }
  }
}

/**
 * GroundCollisionBehavior - Stops particle movement when reaching ground
 * Simulates water droplets hitting the ground and spreading before stopping
 */
class GroundCollisionBehavior {
  static type = "groundCollision";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late; // Run after wind
    this.groundAge = config.groundAge || 0.90; // Age at which particle hits ground
    this.stopAge = config.stopAge || 0.95; // Age at which movement fully stops (after splash)
  }

  initParticles(first) {
    // No initialization needed
  }

  updateParticle(particle, deltaSec) {
    // Stop ALL movement immediately when hitting ground
    if (particle.agePercent >= this.groundAge) {
      if (particle.velocity) {
        particle.velocity.x = 0;
        particle.velocity.y = 0;
      }
    }
  }
}

/**
 * DropletStreakBehavior - Creates motion blur streaks for droplet particles
 * Cheap fake motion blur: tracks velocity and elongates particles in direction of travel
 */
class DropletStreakBehavior {
  static type = "dropletStreak";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late; // Run after movement
    this.strength = config.strength ?? 2.0; // How much speed affects length (higher = more sensitive)
    this.maxLength = config.maxLength ?? 8.0; // Maximum elongation multiplier
  }

  initParticles(first) {
    let particle = first;
    while (particle) {
      // Track previous position for velocity calculation
      particle.oldPosition = new PIXI.Point(particle.x, particle.y);
      particle = particle.next;
    }
  }

  updateParticle(particle, deltaSec) {
    if (!particle.oldPosition) {
      particle.oldPosition = new PIXI.Point(particle.x, particle.y);
      return;
    }

    // Store the base scale set by ScaleBehavior (before we modify it)
    if (!particle.baseScale) {
      particle.baseScale = particle.scale.y;
    } else {
      // Update base scale from ScaleBehavior each frame
      particle.baseScale = particle.scale.y;
    }

    // Calculate frame velocity
    const dx = particle.position.x - particle.oldPosition.x;
    const dy = particle.position.y - particle.oldPosition.y;
    
    // Only apply motion blur if particle is moving AND not on ground (ULTRA LOW THRESHOLD)
    if ((Math.abs(dx) > 0.00001 || Math.abs(dy) > 0.00001) && particle.agePercent < 0.90) {
      // Set rotation to face direction of movement
      particle.rotation = Math.atan2(dy, dx);
      
      // Calculate speed and elongation
      const frameSpeed = Math.sqrt(dx * dx + dy * dy);
      let elongation = frameSpeed * this.strength;
      elongation = Math.min(elongation, this.maxLength);
      
      // Apply elongation RELATIVE to base scale (don't overwrite it)
      particle.scale.x = particle.baseScale + elongation;
      particle.scale.y = particle.baseScale;
    } else {
      // On ground or not moving: restore uniform scale (for splash spread)
      particle.scale.x = particle.baseScale;
      particle.scale.y = particle.baseScale;
      particle.rotation = 0; // Reset rotation for circular splash
    }
    
    // Update position tracking
    particle.oldPosition.copyFrom(particle.position);
  }
}

/**
 * EdgePointsSpawnBehavior - Spawns particles from a list of edge points
 * Used for weather effects that spawn from building edges based on wind direction
 */
class EdgePointsSpawnBehavior {
  static type = "edgePoints";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Spawn;
    this.edgePoints = config.edgePoints || []; // Array of {x, y} world coordinates
    this.spreadRadius = config.spreadRadius || 10; // Random offset from edge point
  }

  /**
   * Set the edge points to spawn from (called externally by controller)
   */
  setEdgePoints(points) {
    this.edgePoints = points || [];
  }

  initParticles(first) {
    let particle = first;
    while (particle) {
      if (this.edgePoints.length > 0) {
        // Pick a random edge point
        const edgePoint = this.edgePoints[Math.floor(Math.random() * this.edgePoints.length)];
        
        // Add small random offset for variation
        const offsetX = (Math.random() - 0.5) * this.spreadRadius * 2;
        const offsetY = (Math.random() - 0.5) * this.spreadRadius * 2;
        
        // Set particle position (relative to emitter position)
        particle.position.x = edgePoint.x + offsetX;
        particle.position.y = edgePoint.y + offsetY;
      } else {
        // No edge points available - spawn at emitter position
        particle.position.x = 0;
        particle.position.y = 0;
      }
      
      particle = particle.next;
    }
  }
}

class PressurisedSteamBehavior {
  static type = "pressurisedSteam";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
    this.config = config;
  }

  /**
   * Initializes the state for a given emitter.
   * @param {PIXI.particles.Emitter} emitter The emitter to initialize.
   */
  initEmitter(emitter) {
    emitter._steamState = "on";

    emitter._steamTimer = this.config.onDuration ?? 10.0;
    emitter.emit = true;
  }

  /**
   * Updates the emitter's state machine (on/off cycle).
   * @param {PIXI.particles.Emitter} emitter The emitter to update.
   * @param {number} delta The time elapsed in seconds.
   */
  update(emitter, delta) {
    if (emitter._steamState === undefined) {
      this.initEmitter(emitter);
    }

    emitter._steamTimer -= delta;

    while (emitter._steamTimer <= 0) {
      if (emitter._steamState === "on") {
        emitter._steamState = "off";

        emitter._steamTimer += this.config.offDuration ?? 10.0;
        emitter.emit = false;
      } else {
        emitter._steamState = "on";

        emitter._steamTimer += this.config.onDuration ?? 10.0;
        emitter.emit = true;
      }
    }
  }

  /**
   * Initializes newly created particles with a unique, random velocity.
   * @param {PIXI.particles.Particle} first The first particle in the new batch.
   */
  initParticles(first) {
    let p = first;
    while (p) {
      if (!p.velocity) {
        p.velocity = new PIXI.Point();
      }
      const pConfig = p.config || (p.config = {});

      // Calculate a new random angle FOR EACH PARTICLE within the configured range.
      const angleDegrees =
        this.config.minAngle +
        Math.random() * (this.config.maxAngle - this.config.minAngle);
      const angleRadians = angleDegrees * (Math.PI / 180.0);

      const speedConfig = this.config.speed;
      const speedMult =
        speedConfig.minMult + Math.random() * (1 - speedConfig.minMult);
      const startSpeed = speedConfig.start * speedMult;

      // Set initial velocity based on the particle's unique random angle.

      p.velocity.x = Math.cos(angleRadians) * startSpeed;

      p.velocity.y = Math.sin(angleRadians) * startSpeed;

      pConfig.startSpeed = startSpeed;
      pConfig.endSpeed = speedConfig.end * speedMult;

      p = p.next;
    }
  }

  /**
   * Updates a single particle's position and velocity each frame.
   * @param {PIXI.particles.Particle} particle The particle to update.
   * @param {number} delta The time elapsed in seconds.
   */
  updateParticle(particle, delta) {
    if (!particle.velocity || !particle.config) return;

    const pConfig = particle.config;

    const currentSpeed =
      pConfig.startSpeed +
      (pConfig.endSpeed - pConfig.startSpeed) * particle.agePercent;

    const magnitude = Math.hypot(
      particle.velocity.x,

      particle.velocity.y
    );
    if (magnitude > 0) {
      particle.velocity.x = (particle.velocity.x / magnitude) * currentSpeed;

      particle.velocity.y = (particle.velocity.y / magnitude) * currentSpeed;
    }

    particle.position.x += particle.velocity.x * delta;

    particle.position.y += particle.velocity.y * delta;
  }

  destroy() {
    // No special cleanup needed
  }
}

/**
 * A custom particle behavior that sets a particle's tint based on color data
 * attached to it during the spawn process.
 * This allows particles to inherit color from their spawn location on a texture.
 */
class ColorFromSpawnBehavior {
  static type = "colorFromSpawn";

  constructor() {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
  }

  initParticles(first) {
    let next = first;
    while (next) {
      if (next.spawnColor) {
        const color = next.spawnColor; // [r, g, b] from 0-255
        // Convert the RGB array to a single hex number for the tint property.
        next.tint = (color[0] << 16) + (color[1] << 8) + color[2];
      }
      next = next.next;
    }
  }

  // Required method, even if empty.

  updateParticle() {
    // This is a one-shot behavior on initialization.
  }

  // Required method for cleanup.
  destroy() {
    // Nothing to destroy.
  }
}

class SmellyFliesBehavior {
  static type = "smellyFlies";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late;
    this.config = config;
    this.group = config.group;

    if (this.group) {
      const GMS = (typeof globalThis !== 'undefined') ? globalThis.GeometryMaskShape : undefined;
      if (GMS) {
        this.shape = new GMS({ group: this.group });
      } else {
        // GeometryMaskShape not registered yet; operate without a compiled shape
        // Behavior will fall back to group data directly
        this.shape = null;
        if (!SmellyFliesBehavior._warnedNoGeomShape) {
          console.warn("Map Shine | SmellyFliesBehavior: GeometryMaskShape not available yet; proceeding without precompiled shape.");
          SmellyFliesBehavior._warnedNoGeomShape = true;
        }
      }
    } else {
      this.shape = null;
    }

    this.WALKING_SCALE = 0.17;
    this.FLYING_SCALE = 0.19;
  }

  _lerp(start, end, amount) {
    return (1 - amount) * start + amount * end;
  }

  // Simplex noise in 3D, adapted from a public domain implementation.
  _simplexNoise3D = (function () {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;
    const grad3 = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1],
    ];
    // A random permutation array. This is pre-calculated for speed.
    const p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
      120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177,
      33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
      71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
      133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
      63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
      135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
      226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
      59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248,
      152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22,
      39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
      246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
      81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
      222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
    }

    function dot(g, x, y, z) {
      return g[0] * x + g[1] * y + g[2] * z;
    }

    return function (x, y, z) {
      let n0, n1, n2, n3;
      const s = (x + y + z) * F3;
      const i = Math.floor(x + s);
      const j = Math.floor(y + s);
      const k = Math.floor(z + s);
      const t = (i + j + k) * G3;
      const X0 = i - t;
      const Y0 = j - t;
      const Z0 = k - t;
      const x0 = x - X0;
      const y0 = y - Y0;
      const z0 = z - Z0;

      let i1, j1, k1;
      let i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        }
      } else {
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        }
      }

      const x1 = x0 - i1 + G3;
      const y1 = y0 - j1 + G3;
      const z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2.0 * G3;
      const y2 = y0 - j2 + 2.0 * G3;
      const z2 = z0 - k2 + 2.0 * G3;
      const x3 = x0 - 1.0 + 3.0 * G3;
      const y3 = y0 - 1.0 + 3.0 * G3;
      const z3 = z0 - 1.0 + 3.0 * G3;

      const ii = i & 255;
      const jj = j & 255;
      const kk = k & 255;

      const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
      const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
      const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
      const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;

      let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) n0 = 0.0;
      else {
        t0 *= t0;
        n0 = t0 * t0 * dot(grad3[gi0], x0, y0, z0);
      }

      let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) n1 = 0.0;
      else {
        t1 *= t1;
        n1 = t1 * t1 * dot(grad3[gi1], x1, y1, z1);
      }

      let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) n2 = 0.0;
      else {
        t2 *= t2;
        n2 = t1 * t1 * dot(grad3[gi2], x2, y2, z2);
      }

      let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) n3 = 0.0;
      else {
        t3 *= t3;
        n3 = t3 * t3 * dot(grad3[gi3], x3, y3, z3);
      }

      return 32.0 * (n0 + n1 + n2 + n3);
    };
  })();

  /**
   * Initializes per-emitter state.
   * @param {PIXI.particles.Emitter} emitter The emitter instance.
   */
  initEmitter(emitter) {
    emitter._smellyFliesElapsedTime = 0;
  }

  /**
   * Updates the emitter's shared timer once per frame.
   * @param {PIXI.particles.Emitter} emitter The emitter instance.
   * @param {number} deltaSec Time elapsed in seconds.
   */
  update(emitter, deltaSec) {
    if (emitter._smellyFliesElapsedTime === undefined) {
      this.initEmitter(emitter);
    }

    emitter._smellyFliesElapsedTime += deltaSec;
  }

  /**
   * Sets up all parameters required for a fly to begin its take-off animation.
   * @param {PIXI.particles.Particle} fly The particle to prepare.
   * @param {object} cfg The particle's configuration object.
   */

  _prepareForTakeOff(fly, cfg) {
    const flyConfig = this.config.flying;
    cfg.state = "taking_off";
    cfg.stateTimer = flyConfig.takeoffDuration ?? 0.5;

    // Impart a sudden burst of speed in a random direction
    const takeoffSpeed =
      flyConfig.takeoffSpeedMin +
      Math.random() * (flyConfig.takeoffSpeedMax - flyConfig.takeoffSpeedMin);
    const angle = Math.random() * Math.PI * 2;

    // This is the target velocity we want to reach by the end of the takeoff animation
    cfg.targetVelocity = {
      x: Math.cos(angle) * takeoffSpeed,
      y: Math.sin(angle) * takeoffSpeed,
    };

    // Start with zero velocity
    cfg.velocity = { x: 0, y: 0 };
  }

  initParticles(first) {
    let p = first;
    while (p) {
      const fly = p;
      fly.config = {}; // Use a dedicated config object for our state
      const cfg = fly.config;

      // Core properties
      cfg.id = Math.random() * 10000;
      cfg.scaleMultiplier = 0.8 + Math.random() * 0.4;

      // Get a random home base for this fly.
      if (this.shape) {
        const tempParticle = {
          position: new PIXI.Point(),
        };

        this.shape.getRandPos(tempParticle);
        cfg.home = tempParticle.position;
      } else {
        cfg.home = this.group.points[0];
      }

      // Initialize velocity for the new physics-based model
      cfg.velocity = { x: 0, y: 0 };

      this._prepareForTakeOff(fly, cfg);

      fly.oldPosition = new PIXI.Point(fly.position.x, fly.position.y);

      p = p.next;
    }
  }

  updateParticle(particle, deltaSec) {
    const fly = particle;
    const cfg = fly.config;
    if (!cfg) return;

    // Read the per-emitter elapsed time, which is now correctly updated once per frame.
    const elapsedTime = fly.emitter._smellyFliesElapsedTime ?? 0;

    const oldPosition = fly.oldPosition;
    oldPosition.copyFrom(fly.position);

    switch (cfg.state) {
      case "taking_off":
        this._updateTakingOff(fly, deltaSec);
        break;
      case "flying":
        this._updateFlying(fly, deltaSec, elapsedTime);
        break;
      case "landing":
        this._updateLanding(fly, deltaSec);
        break;
      case "walking":
        this._updateWalking(fly, deltaSec);
        break;
    }

    const dx = fly.position.x - oldPosition.x;
    const dy = fly.position.y - oldPosition.y;
    // Only update rotation if the fly has moved a meaningful amount
    if (Math.hypot(dx, dy) > 0.1) {
      fly.rotation = Math.atan2(dy, dx);
    }

    // --- Motion Blur and Scaling ---
    const mbConfig = this.config.motionBlur || {
      enabled: true,
      strength: 0.5,
      maxLength: 4,
    };
    let elongation = 0;

    // Only apply motion blur if enabled and the fly is in a fast-moving state.
    if (mbConfig.enabled && cfg.state !== "walking") {
      const frameSpeed = Math.hypot(dx, dy);
      elongation = frameSpeed * mbConfig.strength;
      elongation = Math.min(elongation, mbConfig.maxLength);
    }

    // The base scale is set by the state update methods and stored in cfg.currentBaseScale.
    const baseScale =
      (cfg.currentBaseScale ?? this.FLYING_SCALE) * cfg.scaleMultiplier;

    fly.scale.y = baseScale;
    fly.scale.x = baseScale + elongation; // Additive elongation for the blur effect.
  }

  _updateTakingOff(fly, deltaSec) {
    const cfg = fly.config;
    const totalDuration = this.config.flying.takeoffDuration ?? 0.5;
    cfg.stateTimer -= deltaSec;

    if (cfg.stateTimer <= 0) {
      // Transition complete, snap to final values
      cfg.velocity = cfg.targetVelocity;
      cfg.currentBaseScale = this.FLYING_SCALE;
      cfg.state = "flying";
      this._updateFlying(fly, 0, fly.emitter._smellyFliesElapsedTime); // Update once with zero delta to finalize position
    } else {
      const progress = 1.0 - cfg.stateTimer / totalDuration;
      const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      // Interpolate velocity from 0 to the target takeoff velocity
      cfg.velocity.x = this._lerp(0, cfg.targetVelocity.x, ease);
      cfg.velocity.y = this._lerp(0, cfg.targetVelocity.y, ease);

      // Update position based on the current interpolated velocity
      fly.position.x += cfg.velocity.x * deltaSec;
      fly.position.y += cfg.velocity.y * deltaSec;

      // Interpolate base scale and store it for the main update loop.
      cfg.currentBaseScale = this._lerp(
        this.WALKING_SCALE,
        this.FLYING_SCALE,
        ease
      );
    }
  }

  _updateFlying(fly, deltaSec, elapsedTime) {
    const cfg = fly.config;
    const flyConfig = this.config.flying;
    const homePoint = cfg.home;

    // --- FORCES ---

    // 1. Random erratic movement force using simplex noise
    const noiseStrength = flyConfig.noiseStrength ?? 400;
    const noiseFrequency = flyConfig.noiseFrequency ?? 2.0;
    const time = elapsedTime * noiseFrequency;
    // Get a smoothly changing angle from noise
    const randomAngle = this._simplexNoise3D(cfg.id, time, 0) * Math.PI * 2;
    const randomForce = {
      x: Math.cos(randomAngle) * noiseStrength,
      y: Math.sin(randomAngle) * noiseStrength,
    };
    cfg.velocity.x += randomForce.x * deltaSec;
    cfg.velocity.y += randomForce.y * deltaSec;

    // 2. Tether force to pull the fly back to its home area
    const tetherStrength = flyConfig.tetherStrength ?? 0.8;
    const dx = homePoint.x - fly.position.x;
    const dy = homePoint.y - fly.position.y;
    cfg.velocity.x += dx * tetherStrength * deltaSec;
    cfg.velocity.y += dy * tetherStrength * deltaSec;

    // --- PHYSICS ---

    // 3. Speed limit
    const maxSpeed = flyConfig.maxSpeed ?? 150;
    const speed = Math.hypot(cfg.velocity.x, cfg.velocity.y);
    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed;
      cfg.velocity.x *= ratio;
      cfg.velocity.y *= ratio;
    }

    // 4. Drag/Friction to slow the fly down naturally
    const drag = flyConfig.drag ?? 0.5;
    cfg.velocity.x *= 1 - drag * deltaSec;
    cfg.velocity.y *= 1 - drag * deltaSec;

    // --- UPDATE POSITION ---
    fly.position.x += cfg.velocity.x * deltaSec;
    fly.position.y += cfg.velocity.y * deltaSec;

    cfg.currentBaseScale = this.FLYING_SCALE;

    // --- STATE CHANGE: LANDING ---
    if (this.group.type === "area" && this.group.points.length > 2) {
      if (
        Math.random() < flyConfig.landChance * deltaSec &&
        this._isPointInPolygon(fly.position)
      ) {
        cfg.state = "landing";
        cfg.stateTimer = flyConfig.landingDuration ?? 1.0;
      }
    }
  }

  _updateLanding(fly, deltaSec) {
    const cfg = fly.config;
    const flyConfig = this.config.flying;
    const totalDuration = flyConfig.landingDuration ?? 1.0;
    cfg.stateTimer -= deltaSec;

    const progress = 1.0 - cfg.stateTimer / totalDuration;
    const ease = 1 - Math.pow(1 - progress, 5); // Ease out quint for a strong slowdown

    // Apply a very strong drag that increases as the animation progresses
    const landingDrag = this._lerp(0.5, 0.95, ease);
    cfg.velocity.x *= 1 - landingDrag * deltaSec * 60; // Make drag frame-rate independent
    cfg.velocity.y *= 1 - landingDrag * deltaSec * 60;

    fly.position.x += cfg.velocity.x * deltaSec;
    fly.position.y += cfg.velocity.y * deltaSec;

    // Interpolate the scale downwards
    cfg.currentBaseScale = this._lerp(
      this.FLYING_SCALE,
      this.WALKING_SCALE,
      ease
    );

    if (cfg.stateTimer <= 0) {
      cfg.currentBaseScale = this.WALKING_SCALE;
      cfg.velocity = { x: 0, y: 0 };
      cfg.state = "walking";
      cfg.walkingState = "idle";
      cfg.stateTimer =
        this.config.walking.minIdleTime +
        Math.random() *
          (this.config.walking.maxIdleTime - this.config.walking.minIdleTime);
    }
  }

  _updateWalking(fly, deltaSec) {
    const cfg = fly.config;
    const walkConfig = this.config.walking;

    cfg.currentBaseScale = this.WALKING_SCALE;

    // Chance to take off at any point during the walking phase
    if (Math.random() < walkConfig.takeoffChance * deltaSec) {
      this._prepareForTakeOff(fly, cfg);
      return;
    }

    cfg.stateTimer -= deltaSec;

    // State: Idle. Waiting for a bit before deciding what to do next.
    if (cfg.walkingState === "idle") {
      if (cfg.stateTimer <= 0) {
        // Idle time over, decide on a new destination.
        const moveDistance =
          walkConfig.minMoveDistance +
          Math.random() *
            (walkConfig.maxMoveDistance - walkConfig.minMoveDistance);

        let targetPoint;
        let attempts = 0;
        const MAX_ATTEMPTS = 10;

        do {
          const moveAngle = Math.random() * Math.PI * 2;
          targetPoint = new PIXI.Point(
            fly.position.x + Math.cos(moveAngle) * moveDistance,
            fly.position.y + Math.sin(moveAngle) * moveDistance
          );
          attempts++;
        } while (
          this.shape &&
          !this.shape._isPointInPolygon(targetPoint) &&
          attempts < MAX_ATTEMPTS
        );

        // If we failed to find a valid point after several tries, just idle again.
        if (
          attempts >= MAX_ATTEMPTS &&
          this.shape &&
          !this.shape._isPointInPolygon(targetPoint)
        ) {
          cfg.walkingState = "idle";
          cfg.stateTimer =
            walkConfig.minIdleTime +
            Math.random() * (walkConfig.maxIdleTime - walkConfig.minIdleTime);
          return;
        }

        cfg.walkTarget = targetPoint;

        // Transition to rotating state
        cfg.walkingState = "rotating";
        const dx = cfg.walkTarget.x - fly.position.x;
        const dy = cfg.walkTarget.y - fly.position.y;
        cfg.targetRotation = Math.atan2(dy, dx);
        cfg.startRotation = fly.rotation;

        cfg.stateTimer =
          walkConfig.minRotateTime +
          Math.random() * (walkConfig.maxRotateTime - walkConfig.minRotateTime);
        cfg.rotationDuration = cfg.stateTimer;
      }
    }
    // State: Rotating to face the new destination.
    else if (cfg.walkingState === "rotating") {
      const progress = Math.min(
        1.0,
        1.0 - cfg.stateTimer / cfg.rotationDuration
      );

      // Interpolate angle, handling the wrap-around for the shortest path
      let start = cfg.startRotation;
      let end = cfg.targetRotation;
      let diff = end - start;
      if (diff > Math.PI) end -= 2 * Math.PI;
      if (diff < -Math.PI) end += 2 * Math.PI;
      fly.rotation = this._lerp(start, end, progress);

      if (cfg.stateTimer <= 0) {
        fly.rotation = cfg.targetRotation;
        cfg.walkingState = "moving";

        const distance = Math.hypot(
          cfg.walkTarget.x - fly.position.x,
          cfg.walkTarget.y - fly.position.y
        );
        cfg.stateTimer = distance / walkConfig.walkSpeed;
        cfg.moveDuration = cfg.stateTimer;
        cfg.startPosition = new PIXI.Point(fly.position.x, fly.position.y);
      }
    }
    // State: Moving towards the destination.
    else if (cfg.walkingState === "moving") {
      if (
        cfg.stateTimer <= 0 ||
        !cfg.moveDuration ||
        cfg.moveDuration <= 0 ||
        !cfg.startPosition
      ) {
        if (cfg.walkTarget) fly.position.copyFrom(cfg.walkTarget);
        cfg.walkingState = "idle";
        cfg.stateTimer =
          walkConfig.minIdleTime +
          Math.random() * (walkConfig.maxIdleTime - walkConfig.minIdleTime);
      } else {
        const progress = Math.min(1.0, 1.0 - cfg.stateTimer / cfg.moveDuration);
        fly.position.x = this._lerp(
          cfg.startPosition.x,
          cfg.walkTarget.x,
          progress
        );
        fly.position.y = this._lerp(
          cfg.startPosition.y,
          cfg.walkTarget.y,
          progress
        );
      }
    }
  }

  _isPointInPolygon(point) {
    let isInside = false;
    const points = this.group.points;
    const n = points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xj = points[j].x,
        yj = points[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }
}

const buildSmellyFliesEmitterConfig = (effectConfig, targetData, group) => {
  const globalParticleConfig =
    game.mapShine.profileManager.activeConfig.particleSystems;
  const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
  const config = effectConfig || {};
  const rect = targetData?.rect;

  if (!rect || !group || group.points.length === 0) {
    return { maxParticles: 0, behaviors: [] };
  }

  const spawnBehavior = {
    type: "spawnShape",
    config: {
      type: "geometryMask",
      data: {
        group: group,
      },
    },
  };

  const behaviors = [
    {
      type: "textureSingle",
      config: {
        texture: config.particleTexture,
      },
    },
    {
      type: "scaleStatic",
      config: {
        min: 1.0,
        max: 1.0,
      },
    },
    // Use a static alpha to prevent default fade-out, ensuring flies are persistent.
    {
      type: "alphaStatic",
      config: {
        alpha: 1.0,
      },
    },
    // The moveSpeedStatic behavior is removed to prevent conflicts with the custom behavior.
    spawnBehavior,
    {
      type: "smellyFlies",
      config: { ...config, group }, // Pass the full config and group data to the behavior
    },
  ];

  // Add blend mode as a behavior (required for particles to respect it)
  const blendMode = config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
  addBlendModeBehavior(behaviors, blendMode);

  return {
    lifetime: { min: 60, max: 120 }, // Flies live for a long time
    // A low frequency makes this a continuous emitter. It will spawn
    // particles over time until the maxParticles limit is reached, and
    // will replace particles that expire. The rate is tied to the
    // maxParticles setting to fill larger swarms more quickly.
    frequency: 1.0 / ((config.maxParticles || 100) * 0.1),
    emitterLifetime: -1,
    maxParticles: Math.floor(config.maxParticles * globalMultiplier),
    blendMode: blendMode,
    pos: { x: 0, y: 0 },
    addAtBack: false,
    behaviors: behaviors,
  };
};

export class SmellyFliesLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this.controller = null; // Will hold the ParticleEffectController for smellyFlies
    this._onMapPointsUpdatedBound = null;
    this._initialized = false;
  }

  async _draw() {
    await super._draw(); // Handles ticker binding and _destroyed flag
    this._initialized = false;
    this.eventMode = "none";

    const definition = PARTICLE_EFFECT_DEFINITIONS.smellyFlies;
    if (definition) {
      // The controller's parent container is this layer itself.
      this.controller = new ParticleEffectController(
        "smellyFlies",
        definition,
        this
      );
    } else {
      console.error("Map Shine | SmellyFlies particle definition not found!");
    }

    // Bind and register listener for mask rendering completion to prevent race conditions.
    this._onMasksRenderedBound = this._onMasksRendered.bind(this);

    Hooks.on("mapShine:masksRendered", this._onMasksRenderedBound);
    
    // Start animation ticker now that initialization is complete
    this.startAnimation();
  }

  async _tearDown(options) {
    if (this._destroyed) return;

    if (this._onMasksRenderedBound) {
      Hooks.off("mapShine:masksRendered", this._onMasksRenderedBound);
    }

    this.controller?.destroy();
    this.controller = null;

    await super._tearDown(options); // Handles ticker unbinding and _destroyed flag
  }

  /**
   * Handler for when geometry masks have finished rendering.
   * Called AFTER GeometryMaskManager completes rendering to prevent race conditions.
   */
  async _onMasksRendered(data) {
    const changedGroupId = data?.changedGroupId;
    if (game.mapShine.effectTargetManager) {
      // Refresh targets to pick up any new map point groups that were just added
      await game.mapShine.effectTargetManager.refresh();
      if (game.mapShine.effectTargetManager.targets) {
        this.updateEffectTargets(game.mapShine.effectTargetManager.targets, {
          changedGroupId,
        });
      }
    }
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.controller) return;
    if (!this._initialized && game.mapShine.systemsReady) {
      this._initialized = true;
    }
    if (!this._initialized) return;

    // Clamp delta time to prevent physics explosions on frame drops
    const clampedDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME);

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    const deltaInSeconds = clampedDeltaTime * timeFactor;

    // Proactively process any pending geometry targets so flies start spawning promptly
    if (this.controller?.pendingTargets?.size > 0) {
      this.controller.processAllPendingTargets().catch((err) => {
        console.warn("Map Shine | SmellyFlies: error processing pending targets:", err);
      });
    }
    this.controller.update(deltaInSeconds);
  }

  async updateEffectTargets(targets, options = {}) {
    this.controller?.updateTargets(
      targets,
      game.mapShine.profileManager.activeConfig,
      options
    );
  }

  async updateFromConfig(config, options = {}) {
    if (this.controller) {
      this.controller.updateFromConfig(config);

      if (!options?.timeOnly && !options?.lightingOnly) {
        const targets = game.mapShine.effectTargetManager.targets;
        if (targets) {
          this.updateEffectTargets(targets);
        }
      }
    }
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
      uTexelSize: options.texelSize ?? [
        1.0 / (window.innerWidth || 1),
        1.0 / (window.innerHeight || 1),
      ],
    });
  }
}



class CloudSuppressorFilter extends PIXI.Filter {
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
                    // Calculate normalized screen coordinates from the vertex's final position.
                    // This is the robust way to get screen-space UVs for a post-processing filter.
                    vScreenCoord = gl_Position.xy * 0.5 + 0.5;
                }
            `;

    const fragmentSrc = `
                precision mediump float;
                varying vec2 vTextureCoord;
                varying vec2 vScreenCoord;

                uniform sampler2D uSampler;
                uniform sampler2D uCloudTexture;

                void main() {
                    // The particle's own premultiplied color and alpha.
                    vec4 particleColor = texture2D(uSampler, vTextureCoord);

                    // If the particle is already fully transparent, no need for further calculations.
                    if (particleColor.a < 0.01) {
                        discard;
                        return;
                    }

                    // Sample the PRE-PROCESSED cloud mask using the correct screen coordinates.
                    // The uCloudTexture from ResourceManager.getRawCloudTexture() already contains the final black-and-white cloud shape.
                    float processedCloudValue = texture2D(uCloudTexture, vScreenCoord).r;

                    // Multiply the particle's premultiplied RGBA color by the INVERSE of the cloud mask value.
                    // This correctly fades both the color and alpha in the shadowed (cloudy) areas.
                    // A clamp is used for safety against GPU interpolation artifacts.
                    particleColor *= (1.0 - clamp(processedCloudValue, 0.0, 1.0));

                    gl_FragColor = particleColor;
                }
            `;
    super(vertexSrc, fragmentSrc, {
      uCloudTexture: options.uCloudTexture ?? PIXI.Texture.EMPTY,
      // The shading uniforms are no longer needed here as the logic is removed from the shader.
    });
  }
}

class BiofilmMaskFilter extends PIXI.Filter {
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

                uniform sampler2D uSampler; // The input texture (the rendered particles)
                uniform sampler2D uOutdoorsMask; // The outdoors mask
                uniform sampler2D uWaterMask; // The water mask

                void main() {
                    // Get the color of the particle at this pixel
                    vec4 particleColor = texture2D(uSampler, vTextureCoord);

                    // Get the value of both masks at the same screen position
                    float outdoorsMaskValue = texture2D(uOutdoorsMask, vScreenCoord).r;
                    float waterMaskValue = texture2D(uWaterMask, vScreenCoord).r;

                    // Multiply the particle's color by both mask values.
                    // This ensures particles are only visible where both masks are bright.
                    particleColor *= outdoorsMaskValue * waterMaskValue;

                    gl_FragColor = particleColor;
                }
            `;

    super(vertexSrc, fragmentSrc, {
      uOutdoorsMask: options.uOutdoorsMask ?? PIXI.Texture.EMPTY,
      uWaterMask: options.uWaterMask ?? PIXI.Texture.EMPTY,
    });
  }
}

/**
 * FireToneCurveFilter: A lightweight mask-only tone curve for fire particles
 * This file is JS-checked; JSDoc annotations are provided for type safety.
 */

/**
 * @typedef {Object} FireToneCurveOptions
 * @property {number} [contrast]
 * @property {number} [gamma]
 * @property {number} [knee]
 * @property {number} [coreClamp]
 */
 
/** @type {string} */
const vertex = `
precision mediump float;
 
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void){
  vTextureCoord = aTextureCoord;
  gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}
`;

/** @type {string} */
const fragment = `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform float u_contrast;   // 0.5 - 3.0
uniform float u_gamma;      // 0.5 - 3.0 (applied as pow(i, 1.0/u_gamma))
uniform float u_knee;       // 0.0 - 1.0 (soft knee strength)
uniform float u_coreClamp;  // 0.5 - 1.5 (max output scaling)

// Simple soft knee function around 0.5
float softKnee(float x, float k){
  // Blend towards a smooth curve near mid-tones; k is knee strength
  if (k <= 0.0001) return x;
  float t = clamp((x - 0.5) / max(k, 1e-4) + 0.5, 0.0, 1.0);
  // Hermite smoothstep for pleasant roll-off
  return t * t * (3.0 - 2.0 * t);
}

void main(){
  vec4 c = texture2D(uSampler, vTextureCoord);

  // Intensity proxy: max channel, preserves hot core
  float i = max(max(c.r, c.g), c.b);

  // Gamma/power remap
  float ig = pow(i, 1.0 / max(u_gamma, 0.0001));

  // Contrast around 0.5
  float centered = ig - 0.5;
  float ic = centered * u_contrast + 0.5;

  // Soft knee near mid-tones
  float isk = softKnee(ic, u_knee);

  // Core clamp to keep highlights controlled
  float outI = min(isk, u_coreClamp);

  // Scale original color by ratio; avoid divide-by-zero
  float denom = max(i, 1e-4);
  vec3 outColor = c.rgb * (outI / denom);

  gl_FragColor = vec4(outColor, c.a);
}
`;

export class FireToneCurveFilter extends PIXI.Filter {
  /**
   * @param {FireToneCurveOptions} [options]
   */
  constructor(options = {}){
    const uniforms = {
      u_contrast: options.contrast ?? 1.4,
      u_gamma: options.gamma ?? 0.9,
      u_knee: options.knee ?? 0.2,
      u_coreClamp: options.coreClamp ?? 1.2,
    };
    super(vertex, fragment, uniforms);
  }

  /**
   * Clean up texture references to prevent memory leaks and scene teardown errors
   */
  destroy() {
    // This filter doesn't hold custom texture references,
    // but we still call super.destroy() for proper cleanup
    super.destroy();
  }
}

class SparkPathBehavior {
  static type = "sparkPath";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late;
    this.config = config;

    this._speed = new PIXI.particles.PropertyList(false);

    // Initialize the speed PropertyList using the robust method from the old version.
    // This correctly parses the { list: [...] } structure from the config.
    if (this.config.speed) {
      this._speed.reset(
        PIXI.particles.PropertyNode.createList(this.config.speed)
      );
    } else {
      console.warn(
        "MapShine | SparkPathBehavior received no speed config, using fallback."
      );
      this._speed.reset(
        PIXI.particles.PropertyNode.createList({
          list: [
            {
              value: 50,
              time: 0,
            },
            {
              value: 50,
              time: 1,
            },
          ],
        })
      );
    }
  }

  initParticles(first) {
    let next = first;
    while (next) {
      const config = this.config;
      const pConfig = next.config || (next.config = {});

      pConfig.initRotation =
        next.rotation +
        this._getRandom(config.angle.min, config.angle.max) * (Math.PI / 180);
      pConfig.initPosition = new PIXI.Point(next.x, next.y);
      // Store the initial position to calculate the first frame's direction.
      next.oldPosition = new PIXI.Point(next.x, next.y);
      pConfig.movement = 0;

      pConfig.pathAmplitude = this._getRandom(
        config.amplitude.min,
        config.amplitude.max
      );
      pConfig.pathFrequency = this._getRandom(
        config.frequency.min,
        config.frequency.max
      );
      pConfig.pathOffset = this._getRandom(
        config.offset.min,
        config.offset.max
      );
      pConfig.pathDamping = config.damping ?? 0.5;

      // Add swirl parameters. These are derived from the main path parameters to create
      // a secondary, faster, smaller circular motion that generates loops.
      pConfig.swirlRadius = pConfig.pathAmplitude * this._getRandom(0.4, 0.8);
      pConfig.swirlFrequency =
        pConfig.pathFrequency * this._getRandom(0.3, 0.6);
      pConfig.swirlOffset = this._getRandom(0, Math.PI * 2);

      // Pre-calculate the initial state of the swirl to ensure the path starts at a zero offset.
      pConfig.swirlInitialSin = Math.sin(pConfig.swirlOffset);
      pConfig.swirlInitialCos = Math.cos(pConfig.swirlOffset);

      // Use the separate speed multiplier property.
      pConfig.speedMult = this._getRandom(config.speedMinMult, 1);

      next = next.next;
    }
  }

  updateParticle(particle, deltaSec) {
    // More robust check to ensure the particle and its configuration are valid before proceeding.
    // This prevents errors if a particle is in an inconsistent state during recycling.
    if (!particle.config || !particle.config.initPosition) {
      return;
    }

    const pConfig = particle.config;

    const speed =
      this._speed.interpolate(particle.agePercent) * pConfig.speedMult;
    pConfig.movement += speed * deltaSec;

    // Damping affects both the main wave and the swirl, making the path straighten out over time.
    const dampingFactor = 1.0 - pConfig.pathDamping * particle.agePercent;
    const amplitude = pConfig.pathAmplitude * dampingFactor;
    const swirlRadius = pConfig.swirlRadius * dampingFactor;

    const forward_dist = pConfig.movement;

    // Primary sideways oscillation (the original sine wave)
    const main_t = forward_dist / pConfig.pathFrequency + pConfig.pathOffset;
    const main_y =
      amplitude * (Math.sin(main_t) - Math.sin(pConfig.pathOffset));

    // Secondary circular "swirl" motion to create loops and turbulence
    const swirl_t = forward_dist / pConfig.swirlFrequency + pConfig.swirlOffset;
    // Subtract the initial sin/cos values to make the swirl relative to the start point.
    const swirl_x = swirlRadius * (Math.sin(swirl_t) - pConfig.swirlInitialSin);
    const swirl_y = swirlRadius * (Math.cos(swirl_t) - pConfig.swirlInitialCos);

    // Combine the motions: forward motion is now perturbed by the swirl's x-component.
    // The final y is a combination of the main wave and the swirl's y-component.
    const x = forward_dist + swirl_x;
    const y = main_y + swirl_y;

    const helperPoint = new PIXI.Point(x, y);

    if (pConfig.initRotation !== 0) {
      const s = Math.sin(pConfig.initRotation);
      const c = Math.cos(pConfig.initRotation);
      const xnew = helperPoint.x * c - helperPoint.y * s;
      const ynew = helperPoint.x * s + helperPoint.y * c;
      helperPoint.x = xnew;
      helperPoint.y = ynew;
    }

    particle.position.x = pConfig.initPosition.x + helperPoint.x;
    particle.position.y = pConfig.initPosition.y + helperPoint.y;

    // Calculate direction and apply rotation
    const dx = particle.position.x - particle.oldPosition.x;
    const dy = particle.position.y - particle.oldPosition.y;

    // Only update rotation if the particle has moved a meaningful amount
    // to prevent jerky rotation at low speeds.
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      particle.rotation = Math.atan2(dy, dx);
    }

    const mbConfig = this.config.motionBlur;
    if (mbConfig && mbConfig.enabled) {
      // The actual distance moved in this frame.
      const frameSpeed = Math.sqrt(dx * dx + dy * dy);
      let elongation = frameSpeed * mbConfig.strength;

      elongation = Math.min(elongation, mbConfig.maxLength);

      // The 'scale' behavior runs before this one and sets both scale.x and scale.y.
      // We'll use scale.y as the base width and elongate scale.x.
      const baseScale = particle.scale.y;
      particle.scale.x = baseScale + elongation;
    }

    // Update oldPosition for the next frame
    particle.oldPosition.copyFrom(particle.position);
  }

  _getRandom(min, max) {
    if (min === max) return min;
    return Math.random() * (max - min) + min;
  }
}

class CandleFlameBehavior {
  static type = "candleFlame";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
    this.config = config;
    this.time = 0; // Shared time for all particles using this behavior instance
  }

  initParticles(first) {
    let p = first;
    while (p) {
      p.config = p.config || {};
      // Give each particle a random offset so they don't all jiggle in perfect sync
      p.config.jiggleOffset = Math.random() * Math.PI * 2;
      p = p.next;
    }
  }

  // A custom update method called by the emitter controller to update shared time
  update(emitter, delta) {
    this.time += delta;
  }

  updateParticle(particle, deltaSec) {
    if (!particle.config) return;

    const cfg = this.config;
    const pcfg = particle.config;

    // 1. Upward motion
    particle.position.y += cfg.upwardVelocity * deltaSec;

    // 2. Jiggle motion
    // The amplitude of the jiggle increases as the particle gets older (moves up)
    const currentAmplitude =
      cfg.amplitude * Math.pow(particle.agePercent, cfg.risingFactor);
    const jiggle =
      Math.sin(this.time * cfg.frequency + pcfg.jiggleOffset) *
      currentAmplitude;

    particle.position.x += jiggle * deltaSec;
  }

  destroy() {
    // No special cleanup needed
  }
}


// =================================================================================
// EXPORTS
// =================================================================================

export {
  // Core particle system classes
  ParticleManager,
  ParticleEffectController,
  PARTICLE_EFFECT_DEFINITIONS,
  
  // Emitter config builders
  buildParticleEmitterConfig,
  buildSparkEmitterConfig,
  buildCandleFlameEmitterConfig,
  buildPressurisedSteamEmitterConfig,
  buildSmellyFliesEmitterConfig,
  
  // Particle behaviors
  SparkPathBehavior,
  CandleFlameBehavior,
  WindBehavior,
  ZDepthBehavior,
  MapShineLightingBehavior,
  VelocityStreakBehavior,
  GroundCollisionBehavior,
  DropletStreakBehavior,
  EdgePointsSpawnBehavior,
  PressurisedSteamBehavior,
  ColorFromSpawnBehavior,
  SmellyFliesBehavior,
  
  // Particle filters
  ParticleRgbSplitFilter,
  CloudSuppressorFilter,
  BiofilmMaskFilter,
  
  // Helper functions
  addBlendModeBehavior
};
