// Extracted verbatim (no wiring changes): Particle systems consolidated here
import { PIXI, RenderTexture, Texture } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { PARTICLE_EFFECT_DEFINITIONS } from "../config/particle-definitions.js";
import { ParticleRgbSplitFilter, CloudSuppressorFilter, BiofilmMaskFilter } from "../postfx/filters-adapter.js";
import { TextureMaskShape } from "../shapes-adapter.js";
import { AnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";

// Clamp for delta time to prevent physics explosions on frame drops (seconds)
const MAX_DELTA_TIME = 0.05; // 50ms cap (~20 FPS minimum)

export class ParticleEffectController {
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

    const screen = CoordinateManager.getScreenDimensions();

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
    }
  }
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

export class ParticleLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this._onMapPointsUpdatedBound = null;
    this._initialized = false; // Flag to ensure one-time setup
    this._uiUpdateCounter = 0; // Frame counter for UI throttling
    this._uiUpdateFrequency = 15; // Update UI every 15 frames (approx. 4 times per second)
    this._onPanBoundForParticles = null; // To hold the bound pan listener
    
    // Particle update rate limiting (60 FPS cap)
    this._particleUpdateAccumulator = 0;
    this._particleUpdateInterval = 1 / 60; // Target 60 updates per second
  }

  async _draw() {
    await super._draw(); // Handles ticker binding and _destroyed flag
    this._initialized = false; // Reset flag for new scene
    this.eventMode = "none";

    game.mapShine.particleManager = new ParticleManager();
    this.addChild(game.mapShine.particleManager.masterContainer);
    game.mapShine.particleManager.initialize();

    // Bind and register the listener for mask rendering completion.
    // This fires AFTER GeometryMaskManager has rendered masks, preventing race conditions.
    this._onMasksRenderedBound = this._onMasksRendered.bind(this);

    Hooks.on("mapShine:masksRendered", this._onMasksRenderedBound);

    // This new hook will listen for camera pans to trigger a recompilation
    // of particle spawn points for dynamic screen-space masks.
    this._onPanBoundForParticles = () => {
      if (!game.mapShine.particleManager) return;
      for (const controller of game.mapShine.particleManager.controllers.values()) {
        for (const { emitter } of controller.emitters.values()) {
          if (!emitter.behaviors) continue;
          const spawnBehavior = emitter.behaviors.find(
            (b) => b.type === "spawnShape"
          );
          if (
            spawnBehavior?.shape instanceof TextureMaskShape &&
            spawnBehavior.shape.isDynamicScreenMask
          ) {
            spawnBehavior.shape.forceRecompile();
          }
        }
      }
    };
    Hooks.on("canvasPan", this._onPanBoundForParticles);
  }

  async _tearDown(options) {
    if (this._destroyed) return;

    // Unregister the mask rendering listener to prevent memory leaks.
    if (this._onMasksRenderedBound) {
      Hooks.off("mapShine:masksRendered", this._onMasksRenderedBound);
    }

    // Unregister the new pan listener.
    if (this._onPanBoundForParticles) {
      Hooks.off("canvasPan", this._onPanBoundForParticles);
    }

    if (game.mapShine.particleManager) {
      game.mapShine.particleManager.destroy();
      game.mapShine.particleManager = null;
    }

    await super._tearDown(options); // Handles ticker unbinding and _destroyed flag
  }

  /**
   * Handler for when geometry masks have finished rendering. This triggers a full refresh
   * of all particle emitters to ensure they use the latest mask data.
   * This is called AFTER GeometryMaskManager completes rendering, preventing race conditions.
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
        // Don't process pending targets here - let the animation loop handle it
      }
    }
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !game.mapShine.particleManager) return;
    
    // CRITICAL: Skip all updates during scene transitions to prevent rendering destroyed objects
    if (game.mapShine.transitionActive) return;

    // ✅ FIX: Check master enabled flag
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) return;

    // Clamp delta time to prevent physics explosions on frame drops
    const clampedDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME);

    // The CoordinateManager and ResourceManager are now updated by a dedicated high-priority ticker.

    // Once the main systems are ready, mark this layer as initialized so other systems can proceed.
    // The actual particle creation is handled by updateFromConfig.
    if (!this._initialized && game.mapShine.systemsReady) {
      this._initialized = true;
    }

    // Do not proceed with updates until the layer is officially initialized.
    if (!this._initialized) return;

    // Update the geometry mask system first. This is where the polling for map point data occurs.
    // If it finds new data, it will fire the `mapShine:mapPointsUpdated` hook, which
    // will trigger another call to `updateEffectTargets` to correctly rebuild the emitters.
    game.mapShine.geometryMaskManager?.update();

    // Process any pending particle emitter targets (async but non-blocking)
    // This happens after mask rendering to ensure masks are ready
    if (game.mapShine.particleManager) {
      game.mapShine.particleManager.processAllPendingTargets().catch((err) => {
        console.warn(
          "Map Shine | Error processing pending particle targets:",
          err
        );
      });
    }

    // Cap particle updates to 60 FPS using fixed timestep accumulator
    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    const deltaInSeconds = clampedDeltaTime * timeFactor;
    
    this._particleUpdateAccumulator += deltaInSeconds;
    
    // Update particles at fixed intervals (60 FPS cap)
    while (this._particleUpdateAccumulator >= this._particleUpdateInterval) {
      if (game.mapShine.windManager) {
        game.mapShine.windManager.update(this._particleUpdateInterval);
      }
      
      if (game.mapShine.weatherSystemManager) {
        game.mapShine.weatherSystemManager.update(this._particleUpdateInterval);
      }
      
      // Update weather orchestrator (dynamic weather control)
      if (game.mapShine.weatherOrchestrator?.enabled) {
        game.mapShine.weatherOrchestrator.update(this._particleUpdateInterval);
      }
      
      game.mapShine.particleManager.update(this._particleUpdateInterval);
      
      this._particleUpdateAccumulator -= this._particleUpdateInterval;
    }

    // Throttled UI updates for diagnostic panels
    // Only runs when debugger is visible to avoid FPS drops
    if (game.mapShine.debugger?.eventHandler && game.mapShine.debugger?.element?.style.display !== 'none') {
      this._uiUpdateCounter++;
      if (this._uiUpdateCounter >= this._uiUpdateFrequency) {
        this._uiUpdateCounter = 0;
        
        // Update particle count display
        const count = game.mapShine.particleManager.totalParticleCount;
        const limit =
          game.mapShine.profileManager.activeConfig.particleSystems
            .globalParticleLimit;
        game.mapShine.debugger.eventHandler.updateParticleCount(count, limit);
        
        // Update the zoom display for the overhead effect UI
        game.mapShine.debugger.eventHandler.updateZoomDisplay();
        
        // Update weather system diagnostics
        game.mapShine.debugger.eventHandler.updateWeatherDiagnostics();
      }
    }
  }

  async updateEffectTargets(targets, options = {}) {
    if (game.mapShine.particleManager) {
      // This method internally fetches the latest config to decide what to create.
      game.mapShine.particleManager.updateEffectTargets(targets, options);
    }
  }

  async updateFromConfig(config, options = {}) {
    if (game.mapShine.particleManager) {
      // Always update the live properties (like blend mode, visibility, etc.)
      // of any emitters that already exist. This is non-destructive.
      game.mapShine.particleManager.updateFromConfig(config);

      // ONLY if this is a full update (not just a time or lighting change),
      // re-evaluate which emitters should exist. This is the destructive part.
      if (!options?.timeOnly && !options?.lightingOnly) {
        const targets = game.mapShine.effectTargetManager.targets;
        if (targets) {
          this.updateEffectTargets(targets);
        }
      }
    }
  }

  /**
   * Awaits particle system setup during loading to batch-initialize all emitters.
   * 
   * CRITICAL: Without this, particle emitters are created one-by-one during animation
   * frames, causing 5-10ms stalls per effect type (dust, glints, etc.). By batch
   * processing during loading, we:
   * - Load all textures in parallel
   * - Compile all spawn shapes in parallel
   * - Initialize BatchRenderer with all textures at once
   * - Eliminate first-frame stutters
   * 
   * This is called during the loading screen after effect targets are discovered.
   */
  async awaitParticleSetup() {
    if (!game.mapShine.particleManager) {
      console.warn("Map Shine | No particle manager available for setup");
      return;
    }

    const startTime = performance.now();
    
    try {
      // Batch process all pending particle targets in parallel
      // This includes texture loading, shape compilation, and emitter creation
      await game.mapShine.particleManager.processAllPendingTargets();
      
      const elapsed = (performance.now() - startTime).toFixed(1);
      const controllerCount = game.mapShine.particleManager.controllers.size;
      let totalEmitters = 0;
      
      for (const controller of game.mapShine.particleManager.controllers.values()) {
        totalEmitters += controller.emitters.size;
      }
      
      console.log(`Map Shine | Particle setup complete: ${totalEmitters} emitters across ${controllerCount} controllers (${elapsed}ms)`);
    } catch (error) {
      console.error("Map Shine | Error during particle setup:", error);
      // Don't halt loading if particle setup fails
    }
  }
}
