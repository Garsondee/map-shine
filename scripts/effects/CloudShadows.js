import { MaskedEffectLayer } from "./MaskedEffectLayer.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { CloudShadowsFilterEnhanced as CloudShadowsFilter } from "./CloudDepth.js";

export class CloudShadowsLayer extends MaskedEffectLayer {
  constructor() {
    super({
      maskSuffix: "outdoors",
    });

    this.cloudFilter = null;
    this.blurredMaskTexture = null;
    this.maskBlurFilter = null;
    this.blurSourceSprite = null;

    this._patternGeneratorSprite = null;
    this.cloudShadowTexture = null;
    this.cloudHighlightMaskTexture = null;
    this.rawCloudTexture = null;
    this.effectSprite = null;
  }

  static getSettingsHTML() {
    const effectKey = "cloudShadows";
    const path = `${effectKey}.worldBasedOnly`;
    const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(
      path,
      "World Based Only",
      false,
      "Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set."
    );
    const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

    const content = `
                        ${checkboxHTML}
                        <hr style="border-color: #555; margin: 6px 0;">
                        ${DebuggerUIBuilder._createTextureInputHTML(
                          "outdoors",
                          "Outdoor Mask (_Outdoors)"
                        )}
                        <p class="description-text">Simulates moving cloud shadows within the masked areas.</p>
                        ${DebuggerUIBuilder._createSliderHTML(
                          "cloudShadows.shadowIntensity",
                          "Global Intensity",
                          0,
                          2,
                          0.05
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          "cloudShadows.maskBlur",
                          "Mask Blur",
                          0,
                          50,
                          1
                        )}
                        <details><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.wind.angle",
                                  "Angle",
                                  0,
                                  360,
                                  1
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.wind.speed",
                                  "Speed",
                                  0,
                                  0.01,
                                  0.0001
                                )}
                            </div>
                        </details>
                        <details><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.noise.scale",
                                  "Scale",
                                  0.01,
                                  10,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.noise.octaves",
                                  "Detail Octaves",
                                  1,
                                  8,
                                  1,
                                  "Adds more layers of detail to the noise. Higher is more complex."
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.noise.persistence",
                                  "Roughness",
                                  0.1,
                                  1,
                                  0.05,
                                  "How much each successive octave contributes. Lower values give a softer look."
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.noise.lacunarity",
                                  "Detail Frequency",
                                  1.5,
                                  4,
                                  0.1,
                                  "How much detail is added with each octave. Higher values create finer, more complex noise."
                                )}
                            </div>
                        </details>
                        <details><summary><span class="accordion-toggle"></span><strong>Shading & Appearance</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shading.threshold",
                                  "Threshold",
                                  0,
                                  1,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shading.softness",
                                  "Softness",
                                  0.01,
                                  1,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shading.brightness",
                                  "Brightness",
                                  -1,
                                  1,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shading.contrast",
                                  "Contrast",
                                  0.1,
                                  5,
                                  0.05
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shading.gamma",
                                  "Gamma",
                                  0.1,
                                  5,
                                  0.05,
                                  "Adjusts the mid-tones of the shadows. < 1 lightens, > 1 darkens."
                                )}
                            </div>
                        </details>
                        <details id="details-cloudShadows-shadowInteraction">
                            <summary><span class="accordion-toggle"></span>
                                <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "cloudShadows.shadowInteraction.enabled",
                                  "Illumination Masking",
                                  true
                                )}</div>
                            </summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shadowInteraction.intensity",
                                  "Reduction Amount",
                                  0,
                                  1,
                                  0.01,
                                  "How much to reduce shadow opacity in fully lit areas."
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shadowInteraction.luminanceThreshold",
                                  "Light Threshold",
                                  0,
                                  1,
                                  0.01,
                                  "The scene brightness level above which shadows will start to fade."
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "cloudShadows.shadowInteraction.softness",
                                  "Edge Softness",
                                  0.01,
                                  1,
                                  0.01,
                                  "How gradual the fade transition is."
                                )}
                            </div>
                        </details>
                    `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Cloud Shadows",
      content,
      iconHTML
    );
  }

  getHighlightMaskTexture() {
    return this.cloudHighlightMaskTexture;
  }

  getRawCloudTexture() {
    return this.rawCloudTexture;
  }

  async _draw(options) {
    await super._draw(options); // Sets up the outdoors mask

    const renderer = canvas.app.renderer;

    try {
      this.cloudFilter = new CloudShadowsFilter();
      systemStatus.update("shaders", "cloudShadows", {
        state: "ok",
        message: "Compiled successfully.",
      });
    } catch (e) {
      console.error("MapShine | Failed to create final CloudShadowsFilter.", e);
      systemStatus.update("shaders", "cloudShadows", {
        state: "error",
        message: `Compilation Failed: ${e.message}`,
      });
      return;
    }

    this.maskBlurFilter = new PIXI.BlurFilter();
    this.blurredMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });
    this.blurSourceSprite = new PIXI.Sprite(this.combinedMaskTexture);
    this.blurSourceSprite.filters = [this.maskBlurFilter];

    this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this._patternGeneratorSprite.width = renderer.screen.width;
    this._patternGeneratorSprite.height = renderer.screen.height;
    this._patternGeneratorSprite.filters = [this.cloudFilter];

    this.cloudShadowTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });
    this.cloudHighlightMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });
    this.rawCloudTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
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

    // The resource manager might not be initialized on the very first few frames.
    const resourceManager = game.mapShine.resourceManager;
    if (!resourceManager) return;

    // This layer now sources its own texture from the ResourceManager.
    // This ensures that if it is the first layer to run in a frame, it triggers the
    // render, and if another layer (like StructuralShadows) runs first, this layer
    // will get the already-generated texture from the cache. This keeps all
    // visual representations of the clouds perfectly in sync for the current frame.
    const cloudTexture = resourceManager.getCloudShadowTexture(deltaTime);

    // Update the sprite that is actually drawn to the screen with the definitive texture for this frame.
    if (this.effectSprite) {
      this.effectSprite.texture = cloudTexture;
    }
  }

  renderEffectNow(deltaTime = canvas.app.ticker.deltaTime) {
    if (this._destroyed || !this.visible || !this.cloudFilter) return;

    const hasActiveMasks =
      this.maskSprites.size > 0 &&
      Array.from(this.maskSprites.values()).some((s) => s.texture.valid);
    if (!hasActiveMasks) {
      this.effectSprite.visible = false;
      return;
    }

    this.effectSprite.visible = true;
    if (!this.effectSprite.filterArea) {
      this.effectSprite.filterArea = canvas.app.screen;
    }

    if (this._needsMaskUpdate && this.maskBlurFilter?.enabled) {
      this.blurSourceSprite.texture = this.combinedMaskTexture;
      canvas.app.renderer.render(this.blurSourceSprite, {
        renderTexture: this.blurredMaskTexture,
        clear: true,
      });
    }

    const finalMask = this.maskBlurFilter?.enabled
      ? this.blurredMaskTexture
      : this.getMaskTexture();
    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    const u = this.cloudFilter.uniforms;

    const rect = canvas.scene.dimensions.sceneRect;
    const screen = canvas.app.renderer.screen;
    if (rect && screen.width > 0 && screen.height > 0) {
      const topLeftScreen = canvas.stage.toGlobal({
        x: rect.x,
        y: rect.y,
      });
      const sceneWidthPixels = rect.width * canvas.stage.scale.x;
      const sceneHeightPixels = rect.height * canvas.stage.scale.y;
      u.uSceneRectNorm = [
        topLeftScreen.x / screen.width,
        topLeftScreen.y / screen.height,
        sceneWidthPixels / screen.width,
        sceneHeightPixels / screen.height,
      ];
    } else {
      u.uSceneRectNorm = [0, 0, 1, 1];
    }

    u.uOutdoorsMask = finalMask;
    u.u_time += deltaTime * timeFactor;
    this._updateSpriteAndUniformPositions();

    const csConfig = game.mapShine.profileManager.activeConfig?.cloudShadows || {};
    const interactionConfig = csConfig.shadowInteraction || csConfig.lightOcclusion || null;
    const illumTexture = game.mapShine.resourceManager.getIlluminationTexture();

    u.u_shadowInteraction_enabled = !!interactionConfig && interactionConfig.enabled && !!illumTexture?.valid;
    if (u.u_shadowInteraction_enabled) {
      u.uIlluminationBuffer = illumTexture;
      u.u_shadowInteraction_intensity = interactionConfig.intensity ?? 1.0;
      u.u_shadowInteraction_luminanceThreshold = interactionConfig.luminanceThreshold ?? 0.5;
      u.u_shadowInteraction_softness = interactionConfig.softness ?? 0.5;
    }

    u.u_outputHighlightMask = true;
    u.u_outputRawCloud = false;
    canvas.app.renderer.render(this._patternGeneratorSprite, {
      renderTexture: this.cloudHighlightMaskTexture,
      clear: true,
    });

    u.u_outputHighlightMask = false;
    u.u_outputRawCloud = false;
    canvas.app.renderer.render(this._patternGeneratorSprite, {
      renderTexture: this.cloudShadowTexture,
      clear: true,
    });

    // Render the raw, unmasked cloud FBM for other effects to use.
    u.u_outputHighlightMask = false;
    u.u_outputRawCloud = true;
    canvas.app.renderer.render(this._patternGeneratorSprite, {
      renderTexture: this.rawCloudTexture,
      clear: true,
    });
    u.u_outputRawCloud = false; // Reset the uniform
  }

  _updateSpriteAndUniformPositions() {
    if (!this.cloudFilter || !this.effectSprite) return;
    const stage = canvas.stage,
      screen = canvas.app.screen;
    const topLeft = stage.toLocal({
      x: 0,
      y: 0,
    });

    this.cloudFilter.uniforms.u_camera_offset = [topLeft.x, topLeft.y];
    this.cloudFilter.uniforms.u_view_size = [
      screen.width / stage.scale.x,
      screen.height / stage.scale.y,
    ];

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
    const windSpeed = csConfig.wind.speed ?? 0.01;
    u.u_windDirection = [
      Math.cos(windAngleRad) * windSpeed,
      Math.sin(windAngleRad) * windSpeed,
    ];

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

  /**
   * Overrides the base class method to change the mask's clear color.
   */
  renderMask() {
    if (!this.maskContainer || !this.combinedMaskTexture) return;
    const renderer = canvas.app.renderer;

    renderer.renderTexture.bind(this.combinedMaskTexture);

    // Clear the texture to solid black. This sets the default state to
    // "indoors" (value 0.0), so clouds only appear where an _Outdoors
    // mask explicitly paints the area white.
    renderer.renderTexture.clear([0.0, 0.0, 0.0, 1.0]);

    renderer.render(this.maskContainer, {
      renderTexture: this.combinedMaskTexture,
      transform: canvas.stage.transform.worldTransform,
      clear: false,
    });

    renderer.renderTexture.bind(null);
  }

  _onResize() {
    super._onResize(); // Handles the main outdoors mask texture
    const renderer = canvas.app.renderer;

    this.blurredMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.cloudShadowTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.cloudHighlightMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.rawCloudTexture?.resize(renderer.screen.width, renderer.screen.height);

    if (this.effectSprite) this._updateSpriteAndUniformPositions();
  }

  async _tearDown(options) {
    this.cloudFilter?.destroy();
    this._patternGeneratorSprite?.destroy();
    this.cloudShadowTexture?.destroy(true);
    this.cloudHighlightMaskTexture?.destroy(true);
    this.rawCloudTexture?.destroy(true);
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
    this.rawCloudTexture = null;

    await super._tearDown(options);
  }
}
