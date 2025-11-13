import { PIXI, RenderTexture, Texture } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { BLEND_MODE_OPTIONS } from "../config/blend-modes.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import { hexToRgbArray } from "../utils/ColorUtils.js";
import { ResizableAnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";
import * as FilterAdapter from "../postfx/filters-adapter.js";

export class MetallicShineLayer extends ResizableAnimatedCanvasLayer {
  constructor() {
    super();
    // For compositing _Specular maps
    this.sourceContainer = null;
    this.specularCompositeTexture = null;

    // For generating the stripe pattern
    this.stripePatternFilter = null;
    this.stripeGeneratorSprite = null;
    this.stripePatternTexture = null;

    // For the final composition
    this.shineFilter = null;
    this.effectSprite = null;

    // New texture to hold the final rendered output
    this.finalShineTexture = null;

    this.time = 0;
    this.currentTime = 12.0;
    this._needsMaskUpdate = true;
  }

  // Add a getter for the final texture
  getEffectTexture() {
    return this.finalShineTexture;
  }

  // Add a getter for the specular map texture
  getSpecularMaskTexture() {
    return this.specularCompositeTexture;
  }

  // NEW METHOD: Exposes the internal mask rendering logic to the ResourceManager.
  renderSpecularMask() {
    this._renderSpecularCompositeTexture();
  }

  static getSettingsHTML() {
    const effectKey = "baseShine";
    const path = `${effectKey}.worldBasedOnly`;
    const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(
      path,
      "World Based Only",
      false,
      "Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set."
    );
    const badgeHTML = `<button type="button" class="world-based-badge" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings." style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(76, 175, 80, 0.15); border-radius: 3px; cursor: default; pointer-events: none;"><i class="fas fa-globe" style="font-size: 12px; color: #90ee90;"></i></button>`;

    const content = `
          ${checkboxHTML}
          <hr style="border-color: #555; margin: 4px 0;">
          ${DebuggerUIBuilder._createTextureInputHTML(
            "specular",
            "Specular Map (_Specular)"
          )}
          <p class="description-text">Displays an animated stripe pattern, masked by the specular map.</p>

          ${DebuggerUIBuilder._createSelectHTML(
            "baseShine.compositing.layerBlendMode",
            "Blend Mode",
            BLEND_MODE_OPTIONS
          )}

          ${DebuggerUIBuilder._createSliderHTML(
            "baseShine.animation.globalIntensity",
            "Global Intensity",
            0,
            4,
            0.1,
            "Controls the brightness of the final effect."
          )}

          <details id="details-baseShine-pattern-stripes">
              <summary><span class="accordion-toggle"></span><strong>Shine Stripes Pattern</strong></summary>
              <div style="padding-left: 5px;">
                  <p class="description-text">Controls the animated stripes that create the shine effect.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.speed",
                    "Scroll Speed",
                    -0.2,
                    0.2,
                    0.001
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.angle",
                    "Angle",
                    0,
                    180,
                    1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.scale",
                    "Frequency / Scale",
                    0.001,
                    2,
                    0.001,
                    "The number of stripes. Higher values mean more, thinner stripes."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.parallax",
                    "Parallax",
                    0,
                    1,
                    0.01
                  )}
                  <hr style="border-color: #555; margin: 4px 0;">
                  <p class="description-text" style="font-weight: bold;">Stripe Appearance</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.width",
                    "Width",
                    0.01,
                    1.0,
                    0.01,
                    "The base width of the bright part of each stripe."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.softness",
                    "Softness",
                    0.01,
                    0.5,
                    0.01,
                    "How soft or feathered the edges of the stripes are."
                  )}
                  <hr style="border-color: #555; margin: 4px 0;">
                  <p class="description-text" style="font-weight: bold;">Randomness</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.randomWidth",
                    "Width Variation",
                    0,
                    0.49,
                    0.01,
                    "The amount of random variation in each stripe's width."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.pattern.stripes.randomIntensity",
                    "Intensity Variation",
                    0,
                    1.0,
                    0.01,
                    "The amount of random variation in each stripe's brightness."
                  )}
              </div>
          </details>
          <details id="details-baseShine-colorCorrection">
              <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                "baseShine.colorCorrection.enabled",
                "Color Correction",
                true
              )}</div></summary>
              <div style="padding-left: 5px;">
                  <p class="description-text">Adjusts the color of the final shine effect.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.colorCorrection.saturation",
                    "Saturation",
                    0,
                    4,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.colorCorrection.brightness",
                    "Brightness",
                    -1,
                    1,
                    0.01
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.colorCorrection.contrast",
                    "Contrast",
                    0,
                    4,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.colorCorrection.gamma",
                    "Gamma",
                    0.2,
                    2.5,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createCheckboxHTML(
                    "baseShine.colorCorrection.invert",
                    "Invert Colors"
                  )}
                  <details id="details-baseShine-cc-tint"><summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary><div style="padding-left: 5px;">
                      ${DebuggerUIBuilder._createColorPickerHTML(
                        "baseShine.colorCorrection.tint.color",
                        "Tint Color"
                      )}
                      ${DebuggerUIBuilder._createSliderHTML(
                        "baseShine.colorCorrection.tint.amount",
                        "Tint Amount",
                        0,
                        1,
                        0.01
                      )}
                  </div></details>
              </div>
          </details>
          <details id="details-baseShine-cloudOcclusion">
              <summary><span class="accordion-toggle"></span>
                  <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                    "baseShine.cloudOcclusion.enabled",
                    "Cloud Occlusion",
                    true
                  )}</div>
              </summary>
              <div style="padding-left: 5px;">
                  <p class="description-text">Reduces shine intensity based on cloud cover, making metal less reflective under overcast skies. Requires the Cloud Shadows effect to be active.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "baseShine.cloudOcclusion.intensity",
                    "Intensity",
                    0,
                    1,
                    0.01,
                    "How strongly the clouds block the shine. 1.0 means a full shadow completely removes the shine."
                  )}
              </div>
          </details>
      `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Metallic / Reflective / Specular Shine",
      content,
      badgeHTML
    );
  }

  async _draw() {
    await super._draw(); // Handles ticker, resize, and _destroyed flag
    this._needsMaskUpdate = true;
    this.time = 0;

    const renderer = canvas.app.renderer;
    const screen = renderer.screen;

    this.sourceContainer = new PIXI.Container();

    this.specularCompositeTexture = PIXI.RenderTexture.create({
      width: screen.width,
      height: screen.height,
    });

    // Create render texture to hold generated stripe pattern
    this.stripePatternTexture = PIXI.RenderTexture.create({
      width: screen.width,
      height: screen.height,
    });

    const StripeCtor = FilterAdapter.MetallicStripePatternFilter || globalThis.MetallicStripePatternFilter || null;
    const ShineCtor = FilterAdapter.MetallicShineFilter || globalThis.MetallicShineFilter || null;
    this.stripePatternFilter = safeCreateFilter(StripeCtor, {}, "MetallicShineLayer.stripe");
    this.shineFilter = safeCreateFilter(ShineCtor, {}, "MetallicShineLayer.shine");
    
    if (!this.stripePatternFilter || !this.shineFilter) {
      console.error("MapShine | Failed to create Metallic Shine filters.");
      // Clean up resources created so far and disable the layer gracefully
      this.stripePatternFilter?.destroy?.();
      this.stripePatternFilter = null;
      this.shineFilter?.destroy?.();
      this.shineFilter = null;
      this.stripeGeneratorSprite?.destroy?.();
      this.stripeGeneratorSprite = null;
      this.stripePatternTexture?.destroy?.(true);
      this.stripePatternTexture = null;
      this.specularCompositeTexture?.destroy?.(true);
      this.specularCompositeTexture = null;
      this.sourceContainer?.destroy?.({ children: true });
      this.sourceContainer = null;
      this.visible = false;
      return;
    }

    this.screen = renderer.screen;

    this.stripeGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.stripeGeneratorSprite.width = screen.width;
    this.stripeGeneratorSprite.height = screen.height;
    if (this.stripePatternFilter) {
      safeApplyFilters(this.stripeGeneratorSprite, [this.stripePatternFilter], "MetallicShineLayer.stripeSprite");
    }

    this.effectSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    if (this.shineFilter) {
      safeApplyFilters(this.effectSprite, [this.shineFilter], "MetallicShineLayer.effectSprite");
    }
    this.addChild(this.effectSprite);

    this.finalShineTexture = PIXI.RenderTexture.create({
      width: screen.width,
      height: screen.height,
    });

    this._onPanBound = () => {
      this._needsMaskUpdate = true;
    };
    Hooks.on("canvasPan", this._onPanBound);
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible || !this.shineFilter) return;
    const resourceManager = game.mapShine.resourceManager;
    if (!resourceManager) return;

    resourceManager.getAnimatedShineTexture(deltaTime);
  }

  renderEffectNow(deltaTime) {
    if (this._destroyed || !this.visible || !this.shineFilter || !this.stripePatternFilter) return;

    const resourceManager = game.mapShine.resourceManager;
    if (!resourceManager) return; // Safeguard against initialization race condition

    if (this._needsMaskUpdate) {
      this._renderSpecularCompositeTexture();
    }

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    this.time += deltaTime * timeFactor;
    if (this.stripePatternFilter?.uniforms) {
      this.stripePatternFilter.uniforms.uTime = this.time;
      Object.assign(
        this.stripePatternFilter.uniforms,
        CoordinateManager.getShaderUniforms()
      );
    }

    canvas.app.renderer.render(this.stripeGeneratorSprite, {
      renderTexture: this.stripePatternTexture,
      clear: true,
    });

    // Before:
    // const cloudTexture = resourceManager.getCloudShadowTexture(deltaTime) || PIXI.Texture.BLACK;
    // After:
    const cloudTexture =
      resourceManager.getRawCloudTexture(deltaTime) || PIXI.Texture.BLACK;
    const structuralMask =
      resourceManager.getStructuralMask() || PIXI.Texture.WHITE;
    const outdoorsMask =
      resourceManager.getOutdoorsMask() || PIXI.Texture.WHITE;

    const u = this.shineFilter.uniforms;
    u.uSpecularMap = this.specularCompositeTexture;
    u.uStripePattern = this.stripePatternTexture;
    u.uCloudOcclusionMask = cloudTexture;
    u.uStructuralMask = structuralMask;
    u.uOutdoorsMask = outdoorsMask;
    u.uDarkness = canvas.scene?.environment.darknessLevel ?? 0;

    const config = game.mapShine.profileManager.activeConfig;
    const buildingShadowsConfig = config.buildingShadows;
    const time = this.currentTime;

    if (
      buildingShadowsConfig &&
      buildingShadowsConfig.enabled &&
      time >= 6 &&
      time < 18
    ) {
      u.uBuildingShadowsEnabled = true;

      const sunPos = (time - 12) / 6.0;
      const offsetMagnitude = buildingShadowsConfig.maxOffset * sunPos;
      const sunAngleRad =
        (buildingShadowsConfig.sunAngle ?? 45) * (Math.PI / 180.0);

      u.uBuildingShadowOffset = [
        Math.cos(sunAngleRad) * offsetMagnitude,
        Math.sin(sunAngleRad) * offsetMagnitude,
      ];

      const effectiveDaylight = 1.0 - Math.abs(time - 12) / 6.0;
      const blurPixels =
        buildingShadowsConfig.maxBlur * (1.0 - effectiveDaylight);
      u.uBuildingShadowBlur = Math.max(0.1, blurPixels);

      u.uBuildingShadowIntensity = buildingShadowsConfig.intensity;

      const screen = CoordinateManager.getScreenDimensions();
      u.uBuildingTexelSize = [1.0 / screen.width, 1.0 / screen.height];

      const canvasScale = CoordinateManager.getCanvasScale();
      u.uBuildingCanvasScale = [canvasScale, canvasScale];

      u.uSceneRectNorm = CoordinateManager.getSceneRectNormalizedArray();
    } else {
      u.uBuildingShadowsEnabled = false;
    }

    const cameraOffset = CoordinateManager.getCameraOffset();
    const viewSize = CoordinateManager.getViewSize();

    this.effectSprite.position.copyFrom(cameraOffset);
    this.effectSprite.width = viewSize.width;
    this.effectSprite.height = viewSize.height;

    canvas.app.renderer.render(this.effectSprite, {
      renderTexture: this.finalShineTexture,
      transform: canvas.stage.transform.worldTransform,
      clear: true,
    });
  }

  _renderSpecularCompositeTexture() {
    if (!this.sourceContainer || !this.specularCompositeTexture) return;
    canvas.app.renderer.render(this.sourceContainer, {
      renderTexture: this.specularCompositeTexture,
      clear: true,
      transform: canvas.stage.transform.worldTransform,
    });
    this._needsMaskUpdate = false;
  }

  async updateEffectTargets(targets) {
    if (this._destroyed || !this.sourceContainer) return;

    const allTargets = new Map([
      ["background", targets.background],
      ...targets.tiles.entries(),
    ]);

    const spritesToKeep = new Set();
    for (const [id, targetData] of allTargets.entries()) {
      if (targetData?.specular) {
        let sprite = this.sourceContainer.children.find(
          (child) => child.name === id
        );
        if (!sprite) {
          sprite = new PIXI.Sprite();
          sprite.name = id;
          this.sourceContainer.addChild(sprite);
        }
        spritesToKeep.add(sprite);
        await this._updateSpriteTransform(
          sprite,
          targetData.specular,
          targetData.rect
        );
      }
    }

    this.sourceContainer.children.slice().forEach((child) => {
      if (!spritesToKeep.has(child)) {
        this.sourceContainer.removeChild(child);
        child.destroy();
      }
    });

    this._needsMaskUpdate = true;
  }

  async _updateSpriteTransform(sprite, texturePath, rect) {
    const currentPath = sprite.texture?.baseTexture?.resource?.src;
    if (texturePath !== currentPath) {
      try {
        const loadedTexture = await TextureLoader.loadTexture(texturePath);
        if (loadedTexture?.baseTexture?.valid) {
          sprite.texture = loadedTexture;
        } else {
          console.warn(`MapShine | Loaded texture has invalid baseTexture: "${texturePath}"`);
          sprite.texture = PIXI.Texture.EMPTY;
        }
      } catch (e) {
        console.warn(
          `MapShine | Failed to load texture "${texturePath}":`,
          e.message
        );
        sprite.texture = PIXI.Texture.EMPTY;
      }
    }
    if (!sprite.texture?.valid || !sprite.texture?.baseTexture?.valid || !rect) return;
    sprite.anchor.set(0.5);
    sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
    sprite.width = rect.width;
    sprite.height = rect.height;
    sprite.rotation = rect.rotation || 0;
  }

  async updateFromConfig(config) {
    const bsConfig = config.baseShine;

    if (
      !bsConfig ||
      !bsConfig.compositing ||
      !bsConfig.animation ||
      !bsConfig.pattern ||
      !bsConfig.pattern.stripes ||
      !bsConfig.cloudOcclusion ||
      !bsConfig.colorCorrection
    ) {
      this.visible = false;
      return;
    }

    this.visible = config.enabled && bsConfig.enabled;

    const timeOfDayConfig = config.timeOfDay;
    if (timeOfDayConfig && timeOfDayConfig.currentTime !== undefined) {
      this.currentTime = timeOfDayConfig.currentTime;
    }

    this.blendMode = bsConfig.compositing.layerBlendMode;

    if (this.effectSprite) {
      this.effectSprite.alpha = 1.0;
    }

    if (this.stripePatternFilter) {
      const stripes = bsConfig.pattern.stripes;
      const u = this.stripePatternFilter.uniforms;
      u.uSpeed = stripes.speed;
      u.uAngle = stripes.angle;
      u.uScale = stripes.scale;
      u.uParallax = stripes.parallax;
      u.uStripeWidth = stripes.width;
      u.uStripeSoftness = stripes.softness;
      u.uRandomWidth = stripes.randomWidth;
      u.uRandomIntensity = stripes.randomIntensity;
    }

    if (this.shineFilter) {
      const cloudOcclusion = bsConfig.cloudOcclusion;
      const colorCorrection = bsConfig.colorCorrection;
      const u = this.shineFilter.uniforms;
      u.uGlobalIntensity = bsConfig.animation.globalIntensity;
      u.uCloudOcclusionEnabled = cloudOcclusion.enabled;
      u.uCloudOcclusionIntensity = cloudOcclusion.intensity;

      if (colorCorrection) {
        u.uColorCorrectionEnabled = colorCorrection.enabled;
        u.uSaturation = colorCorrection.saturation;
        u.uBrightness = colorCorrection.brightness;
        u.uContrast = colorCorrection.contrast;
        u.uGamma = colorCorrection.gamma;
        u.uTintColor = hexToRgbArray(colorCorrection.tint.color);
        u.uTintAmount = colorCorrection.tint.amount;
        u.uInvert = colorCorrection.invert;
      }
    }
  }

  _onResize() {
    if (this._destroyed) return;
    const renderer = canvas.app.renderer;
    this.specularCompositeTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.stripePatternTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.finalShineTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );

    if (this.stripeGeneratorSprite) {
      this.stripeGeneratorSprite.width = renderer.screen.width;
      this.stripeGeneratorSprite.height = renderer.screen.height;
    }

    if (this.effectSprite) {
      const stage = canvas.stage;
      const screen = canvas.app.screen;

      const topLeft = stage.toLocal({ x: 0, y: 0 });

      this.effectSprite.position.copyFrom(topLeft);
      this.effectSprite.width = screen.width / stage.scale.x;
      this.effectSprite.height = screen.height / stage.scale.y;
    }
    this._needsMaskUpdate = true;
  }

  async _tearDown(options) {
    if (this._destroyed) return;

    Hooks.off("canvasPan", this._onPanBound);

    this.sourceContainer?.destroy({ children: true });
    this.specularCompositeTexture?.destroy(true);

    this.stripePatternFilter?.destroy();
    this.stripeGeneratorSprite?.destroy();
    this.stripePatternTexture?.destroy(true);

    this.shineFilter?.destroy();
    this.effectSprite?.destroy();
    this.finalShineTexture?.destroy(true);

    this.sourceContainer = null;
    this.specularCompositeTexture = null;
    this.stripePatternFilter = null;
    this.stripeGeneratorSprite = null;
    this.stripePatternTexture = null;
    this.shineFilter = null;
    this.effectSprite = null;
    this.finalShineTexture = null;

    await super._tearDown(options); // Handles ticker, resize unbinding and _destroyed flag
  }
}

class MetallicShineFilter extends PIXI.Filter {
  constructor() {
    const vertex = `
      attribute vec2 aVertexPosition;
      attribute vec2 aTextureCoord;
      uniform mat3 projectionMatrix;
      varying vec2 vTextureCoord;
      void main(void){
        vTextureCoord = aTextureCoord;
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
      }
    `;
    const fragment = `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      void main(void){
        gl_FragColor = texture2D(uSampler, vTextureCoord);
      }
    `;
    super(vertex, fragment, {});
  }
}

class MetallicStripePatternFilter extends PIXI.Filter {
  constructor() {
    const vertex = `
      attribute vec2 aVertexPosition;
      attribute vec2 aTextureCoord;
      uniform mat3 projectionMatrix;
      varying vec2 vTextureCoord;
      void main(void){
        vTextureCoord = aTextureCoord;
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
      }
    `;
    const fragment = `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform float uTime;
      void main(void){
        float v = step(0.5, fract(vTextureCoord.x * 50.0 + (uTime * 0.5)));
        gl_FragColor = vec4(vec3(v), 1.0);
      }
    `;
    super(vertex, fragment, { uTime: 0.0 });
  }
}

// Expose to globals for adapter resolution
globalThis.MetallicShineFilter = globalThis.MetallicShineFilter || MetallicShineFilter;
globalThis.MetallicStripePatternFilter = globalThis.MetallicStripePatternFilter || MetallicStripePatternFilter;