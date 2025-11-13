import { PIXI, Texture, BLEND_MODES } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { NoiseTextureManager } from "../managers/NoiseTextureManager.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { hexToRgbArray } from "../utils/ColorUtils.js";
import { GRADIENT_PRESETS } from "../config/presets.js";
import { MaskedEffectLayer } from "./MaskedEffectLayer.js";
import { systemStatus } from "../module.js";

class IridescenceFilter extends PIXI.Filter {
  static MAX_OCTAVES = 8; // The constant is now defined here.

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
                            uniform vec4 uSceneRectNorm;

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
                                vec2 sceneMin = uSceneRectNorm.xy;
                                vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
                                if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x || vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
                                    discard;
                                    return;
                                }

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

    super(vertexSrc, fragmentSrc, {
      // Textures

      uMaskTexture: PIXI.Texture.EMPTY,

      uDistortionMap: PIXI.Texture.EMPTY,
      // World
      uParallax: options.parallax ?? 0.0,

      uCameraOffset: [0, 0],

      uViewSize: [1, 1],

      uResolution: [1, 1],

      uSceneRectNorm: [0, 0, 1, 1],
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

export class IridescenceLayer extends MaskedEffectLayer {
  constructor() {
    super({
      maskSuffix: "iridescence",
      effectKey: "iridescence",
    });

    this.iridescenceFilter = null;
    this.effectSprite = null;
    this.distortionNoiseManager = null;
    this._framesSinceLoad = 0;
  }

  static getSettingsHTML() {
    const effectKey = "iridescence";
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
                              "iridescence",
                              "Iridescence Mask"
                            )}
                            <p class="description-text">Creates a colorful, oil-slick-like effect within the masked areas.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              "iridescence.intensity",
                              "Intensity",
                              0,
                              2,
                              0.05
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              "iridescence.speed",
                              "Anim Speed",
                              0,
                              0.2,
                              0.001,
                              "Directional drift speed of the pattern."
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              "iridescence.scale",
                              "Pattern Scale",
                              0.1,
                              20,
                              0.1
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              "iridescence.parallax",
                              "Parallax",
                              0,
                              1,
                              0.01,
                              "0 = Sticks to Map, 1 = Sticks to Screen"
                            )}
                            <details id="details-iridescence-fbm"><summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                                <div>
                                    <p class="description-text">Controls the procedural noise used to generate the base pattern.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.fbm.evolution",
                                      "Evolution",
                                      0,
                                      1,
                                      0.001,
                                      'Internal "boiling" speed of the pattern.'
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.fbm.octaves",
                                      "Complexity (Octaves)",
                                      1,
                                      IridescenceFilter.MAX_OCTAVES,
                                      1,
                                      "Layers of noise. More is more detailed but slower."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.fbm.persistence",
                                      "Roughness",
                                      0.1,
                                      1,
                                      0.01,
                                      "Influence of smaller details. Lower is smoother."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.fbm.lacunarity",
                                      "Detail Scale",
                                      1.5,
                                      4,
                                      0.05,
                                      "Frequency of smaller details. Higher is finer."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.fbm.brightness",
                                      "Noise Brightness",
                                      0,
                                      1,
                                      0.01,
                                      "Adjusts the brightness of the noise before color mapping."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.fbm.contrast",
                                      "Noise Contrast",
                                      0,
                                      5,
                                      0.05,
                                      "Adjusts the contrast of the noise before color mapping."
                                    )}
                                </div>
                            </details>
                            <details id="details-iridescence-gradient"><summary><span class="accordion-toggle"></span><strong>Gradient Controls</strong></summary>
                                <div>
                                    ${DebuggerUIBuilder._createGradientSelectHTML(
                                      "iridescence.gradient.name",
                                      "Gradient Preset"
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.gradient.hueShift",
                                      "Hue Shift",
                                      0,
                                      1,
                                      0.01,
                                      "Rotates the colors of the gradient."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.gradient.brightness",
                                      "Brightness",
                                      -1,
                                      1,
                                      0.01,
                                      "Final brightness adjustment applied to the colored result."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.gradient.contrast",
                                      "Contrast",
                                      0,
                                      4,
                                      0.05,
                                      "Final contrast adjustment applied to the colored result."
                                    )}
                                </div>
                            </details>
                            <details id="details-iridescence-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                              "iridescence.distortion.enabled",
                              "Churn/Distortion Effect",
                              true
                            )}</div></summary>
                                <div>
                                    <p class="description-text">Uses a second, underlying noise pattern to warp the main iridescence effect.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "iridescence.distortion.strength",
                                      "Distortion Strength",
                                      0,
                                      20,
                                      0.1
                                    )}
                                    <details id="details-iridescence-distortion-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                      "iridescence.noise.enabled",
                                      "Distortion Noise",
                                      true
                                    )}</div></summary>
                                        <div>
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "iridescence.noise.speed",
                                              -0.5,
                                              0.5,
                                              0.001
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "iridescence.noise.scale",
                                              "Scale",
                                              0.1,
                                              10,
                                              0.1
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "iridescence.noise.threshold",
                                              "Threshold",
                                              0,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "iridescence.noise.brightness",
                                              "Brightness",
                                              -1,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "iridescence.noise.contrast",
                                              "Contrast",
                                              0,
                                              5,
                                              0.05
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "iridescence.noise.softness",
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
      "Iridescence",
      content,
      iconHTML
    );
  }

  async _draw(options) {
    await super._draw(options);

    this._framesSinceLoad = 0;
    this.blendMode = PIXI.BLEND_MODES.NORMAL;
    const renderer = canvas.app.renderer;

    this.distortionNoiseManager = new NoiseTextureManager(
      renderer,
      "iridescence.noise",
      true
    );

    try {
      this.iridescenceFilter = new IridescenceFilter();
      systemStatus.update("shaders", "iridescence", {
        state: "ok",
        message: "Compiled successfully.",
      });
    } catch (e) {
      console.error("MapShine | Failed to create IridescenceFilter", e);
      systemStatus.update("shaders", "iridescence", {
        state: "error",
        message: `Compilation Failed: ${e.message}`,
      });
    }

    this.effectSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.effectSprite.filters = this.iridescenceFilter
      ? [this.iridescenceFilter]
      : [];
    this.addChild(this.effectSprite);

    this.updateFromConfig(game.mapShine.profileManager.activeConfig);
  }

  _onAnimate(deltaTime) {
    super._onAnimate(deltaTime);
    if (this._destroyed || !this.visible || !this.iridescenceFilter || !this.effectSprite) return;
    
    // CRITICAL: Skip all updates during scene transitions
    if (game.mapShine.transitionActive) return;
    this._framesSinceLoad++;

    const hasActiveTargets =
      this.maskSprites.size > 0 &&
      Array.from(this.maskSprites.values()).some((s) => s.texture.valid);
    if (!hasActiveTargets || this._framesSinceLoad < 5) {
      this.effectSprite.visible = false;
      return;
    }
    this.effectSprite.visible = true;

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    this.distortionNoiseManager.update(
      deltaTime * timeFactor,
      canvas.app.renderer
    );

    const u = this.iridescenceFilter.uniforms;
    const resourceManager = game.mapShine.resourceManager;

    // Update time and input textures
    u.uTime += deltaTime * timeFactor;
    u.uDistortionMap = resourceManager
      ? resourceManager.getIridescenceDistortionNoise()
      : this.distortionNoiseManager.getTexture();
    u.uMaskTexture = this.getMaskTexture();

    // Get all coordinate uniforms from the manager
    Object.assign(u, CoordinateManager.getShaderUniforms());

    // Position the effect sprite to cover the full screen view

    this.effectSprite.position.copyFrom(CoordinateManager.getCameraOffset());
    this.effectSprite.width = CoordinateManager.getViewSize().width;
    this.effectSprite.height = CoordinateManager.getViewSize().height;
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
      // Apply scaling factor
      u.uSpeed = (iConfig.speed ?? 1.0) * 0.01;
      u.uScale = iConfig.scale;
      u.uParallax = iConfig.parallax;
      u.uDistortionStrength = iConfig.distortion.enabled
        ? iConfig.distortion.strength
        : 0.0;

      const fbmConfig = iConfig.fbm;
      if (fbmConfig) {
        u.uOctaves = fbmConfig.octaves;
        u.uPersistence = fbmConfig.persistence;
        u.uLacunarity = fbmConfig.lacunarity;
        // Apply scaling factor
        u.uFbmEvolution = (fbmConfig.evolution ?? 0.0) * 0.01;
        u.uFbmBrightness = (fbmConfig.brightness ?? 0.5) - 0.5;
        u.uFbmContrast = fbmConfig.contrast;
      }

      const gConfig = iConfig.gradient;
      const gradientData = GRADIENT_PRESETS[gConfig.name];
      if (gradientData) {
        u.uGradientColors = gradientData.colors.flatMap((hex) =>
          hexToRgbArray(hex)
        );
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
        y: 0,
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
