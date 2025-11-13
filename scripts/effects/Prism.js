import { PIXI, Texture, Filter } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { NoiseTextureManager } from "../managers/NoiseTextureManager.js";
import { ScreenEffectsManager } from "../managers/ScreenEffectsManager.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { MaskedEffectLayer } from "./MaskedEffectLayer.js";

export class PrismLayer extends MaskedEffectLayer {
  constructor() {
    super({
      maskSuffix: "prism",
      effectKey: "prism",
    });

    this.distortionNoiseManager = null;
    this._framesSinceLoad = 0;
  }

  static getSettingsHTML() {
    const effectKey = "prism";
    const path = `${effectKey}.worldBasedOnly`;
    const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(
      path,
      "World Based Only",
      false,
      "Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set."
    );
    const iconHTML = `<button type="button" class="world-based-badge" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings." style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(76, 175, 80, 0.15); border-radius: 3px; cursor: default; pointer-events: none;"><i class="fas fa-globe" style="font-size: 12px; color: #90ee90;"></i></button>`;

    const content = `
                            ${checkboxHTML}
                            <hr style="border-color: #555; margin: 4px 0;">
                            ${DebuggerUIBuilder._createTextureInputHTML(
                              "prism",
                              "Effect Mask (_Prism)"
                            )}
                            <p class="description-text">Splits the light from the brightest parts of the scene into a prismatic, chromatic aberration effect.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              "prism.intensity",
                              "Intensity",
                              0,
                              50,
                              0.5,
                              "The distance in pixels the color channels are split."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              "prism.angle",
                              "Angle",
                              0,
                              360,
                              1,
                              "The direction of the color split."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              "prism.threshold",
                              "Luminance Threshold",
                              0,
                              1,
                              0.01,
                              "The effect will only apply to pixels brighter than this value."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              "prism.softness",
                              "Threshold Softness",
                              0.01,
                              1,
                              0.01,
                              "The softness of the transition at the luminance threshold."
                            )}

                            <details id="details-prism-distortionNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                              "prism.distortionNoise.enabled",
                              "Distortion",
                              true
                            )}</div></summary>
                                <div style="padding-left: 5px;">
                                    <p class="description-text">Uses a noise pattern to warp and animate the prism effect.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "prism.distortionStrength",
                                      "Distortion Strength",
                                      0,
                                      10,
                                      0.1
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "prism.distortionNoise.speed",
                                      "Speed",
                                      -0.5,
                                      0.5,
                                      0.005
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "prism.distortionNoise.scale",
                                      "Scale",
                                      0.01,
                                      10,
                                      0.01
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "prism.distortionNoise.evolution",
                                      "Evolution",
                                      0,
                                      1,
                                      0.01
                                    )}
                                    <details id="details-prism-distortionNoise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "prism.distortionNoise.threshold",
                                              "Threshold",
                                              0,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "prism.distortionNoise.brightness",
                                              "Brightness",
                                              -1,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "prism.distortionNoise.contrast",
                                              "Contrast",
                                              0,
                                              5,
                                              0.05
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "prism.distortionNoise.softness",
                                              "Softness",
                                              0.01,
                                              1,
                                              0.01
                                            )}
                                        </div>
                                    </details>
                                </div>
                            </details>
                        `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Prism Effect",
      content,
      iconHTML
    );
  }

  async _draw(options) {
    await super._draw(options);

    this._framesSinceLoad = 0;
    this._destroyed = false;

    const renderer = canvas.app.renderer;
    this.distortionNoiseManager = new NoiseTextureManager(
      renderer,
      "prism.distortionNoise",
      true
    );

    // This layer has no visible children. It only manages textures for a global filter.

    // Initial config update
    this.updateFromConfig(game.mapShine.profileManager.activeConfig);
  }

  _onAnimate(deltaTime) {
    super._onAnimate(deltaTime); // This renders the combined mask if needed
    if (this._destroyed) return;
    this._framesSinceLoad++;

    const prismFilter = ScreenEffectsManager.getFilter("prism");
    if (!prismFilter) return;

    // Check if the layer has any active mask textures.
    const hasActiveMasks =
      this.maskSprites.size > 0 &&
      Array.from(this.maskSprites.values()).some((s) => s.texture.valid);

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
    this.distortionNoiseManager.update(
      deltaTime * timeFactor,
      canvas.app.renderer
    );

    // Feed the generated textures into the global filter's uniforms.
    const resourceManager = game.mapShine.resourceManager;
    const u = prismFilter.uniforms;
    u.uPrismMask = this.getMaskTexture();
    u.uDistortionMap = resourceManager
      ? resourceManager.getPrismDistortionNoise()
      : this.distortionNoiseManager.getTexture();
    u.uDistortionStrength = pConfig.distortionNoise.enabled
      ? pConfig.distortionStrength
      : 0.0;

    // Pass the normalized scene rectangle from the CoordinateManager to the filter.
    u.uSceneRectNorm = CoordinateManager.getSceneRectNormalizedArray();
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
    const prismFilter = ScreenEffectsManager.getFilter("prism");
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

class PrismFilter extends PIXI.Filter {
  constructor(options = {}) {
    const fragmentSrc = `
                            precision mediump float;
                            varying vec2 vTextureCoord;

                            uniform sampler2D uSampler;
                            uniform sampler2D uPrismMask;
                            uniform sampler2D uDistortionMap;

                            // Uniform for scene boundaries
                            uniform vec4 uSceneRectNorm;

                            uniform float uIntensity;
                            uniform float uAngleRad;
                            uniform float uThreshold;
                            uniform float uSoftness;
                            uniform float uDistortionStrength;
                            uniform vec2 uTexelSize;

                            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                            void main(void) {
                                vec4 originalColor = texture2D(uSampler, vTextureCoord);

                                // Check if the current pixel is outside the defined scene rectangle.
                                vec2 sceneMin = uSceneRectNorm.xy;
                                vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
                                if (vTextureCoord.x < sceneMin.x || vTextureCoord.x > sceneMax.x || vTextureCoord.y < sceneMin.y || vTextureCoord.y > sceneMax.y) {
                                    gl_FragColor = originalColor;
                                    return;
                                }

                                float maskValue = texture2D(uPrismMask, vTextureCoord).r;
                                if (maskValue < 0.01) {
                                    gl_FragColor = originalColor;
                                    return;
                                }

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

      uSceneRectNorm: [0, 0, 1, 1],
      uIntensity: options.intensity ?? 5.0,

      uAngleRad: (options.angle ?? 45.0) * (Math.PI / 180.0),
      uThreshold: options.threshold ?? 0.85,
      uSoftness: options.softness ?? 0.1,
      uDistortionStrength: options.distortionStrength ?? 2.0,

      uTexelSize: [0.001, 0.001], // Default value, will be updated in animation loop
    });
  }
}