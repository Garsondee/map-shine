import { PIXI, RenderTexture, SCALE_MODES, WRAP_MODES, Texture } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { RenderTexturePool } from "../utils/RenderTexturePool.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import { MaskedEffectLayer } from "./MaskedEffectLayer.js";
import { BuildingShadowsFilter } from "../postfx/filters-adapter.js";

export class BuildingShadowsLayer extends MaskedEffectLayer {
  constructor() {
    // This layer uses the _Outdoors mask as its source.
    super({
      maskSuffix: "outdoors",
      effectKey: "buildingShadows",
    });

    this.currentTime = 12.0; // Default to midday
    this.filter = null;

    // Properties for Kawase Blur
    this.blurredMaskTexture = null; // PERSISTENT - not pooled
    // Store dimensions for pool acquisition (intermediate texture is pooled)
    this._blurWidth = 0;
    this._blurHeight = 0;
    this.kawaseBlurFilter1 = null;
    this.kawaseBlurFilter2 = null;
    this.blurSourceSprite = null;
  }

  static getSettingsHTML() {
    const effectKey = "buildingShadows";
    const iconHTML = `<button type="button" class="clock-based-badge" title="This effect is linked to the Day/Night Clock" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(33, 150, 243, 0.5); background: rgba(33, 150, 243, 0.15); border-radius: 3px; cursor: default; pointer-events: none;"><i class="fas fa-clock" style="font-size: 12px; color: #87ceeb;"></i></button>`;
    const content = `
                <p class="description-text">Simulates building shadows based on sun position. Uses the _Outdoors map as both the shadow source and the mask.</p>
                ${DebuggerUIBuilder._createSliderHTML(
                  "buildingShadows.intensity",
                  "Shadow Intensity",
                  0,
                  1,
                  0.01
                )}
                ${DebuggerUIBuilder._createSliderHTML(
                  "buildingShadows.maxOffset",
                  "Max Offset (px)",
                  0,
                  2000,
                  1,
                  "The maximum distance the shadow will be offset at dawn/dusk."
                )}
                ${DebuggerUIBuilder._createSliderHTML(
                  "buildingShadows.sunAngle",
                  "Sun Angle",
                  0,
                  360,
                  1,
                  "The direction from which the sun is shining, in degrees. 0 is from the East (right), 90 is from the South (bottom)."
                )}
                ${DebuggerUIBuilder._createSliderHTML(
                  "buildingShadows.maxBlur",
                  "Max Blur (px)",
                  0,
                  50,
                  1,
                  "The maximum blur applied to the shadow at dawn/dusk."
                )}
            `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Building Shadows",
      content,
      iconHTML
    );
  }

  /**
   * Provides the final blurred mask texture to other systems via the ResourceManager.
   * @returns {PIXI.RenderTexture} The blurred texture.
   */
  getBlurredOutdoorsMask() {
    return this.blurredMaskTexture;
  }

  /**
   * Performs a full teardown and setup of the entire layer, including its base class components.
   * This is used to recover the effect after a scene appearance transition by mimicking a fresh load.
   */
  async rebuildEffect() {
    console.log(
      "BuildingShadowsLayer | Rebuilding effect by cycling through full layer teardown and draw."
    );

    // 1. Perform a complete teardown of the layer, including its masks and listeners.
    await this._tearDown({});

    // 2. Perform a complete setup of the layer, re-creating all PIXI objects and listeners.
    await this._draw({});

    // 3. Re-inject the data that is normally provided by the SceneChangeManager during initial load.
    if (game.mapShine.effectTargetManager?.targets) {
      await this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
    }
    if (game.mapShine.profileManager?.activeConfig) {
      await this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    console.log(
      "BuildingShadowsLayer | Rebuild complete. Layer has been fully re-initialized."
    );
  }

  async _draw(options) {
    // This calls the base class _draw, which sets up the mask container and texture discovery.
    await super._draw(options);

    const renderer = canvas.app.renderer;
    const screen = renderer.screen;
    // PERFORMANCE OPTIMIZATION: Use half-resolution textures for blur passes
    const halfWidth = Math.floor(screen.width / 2);
    const halfHeight = Math.floor(screen.height / 2);

    // Store dimensions for pooled texture acquisition
    this._blurWidth = halfWidth;
    this._blurHeight = halfHeight;

    // Initialize PERSISTENT blur output texture (not pooled)
    const halfResTextureOptions = {
      width: halfWidth,
      height: halfHeight,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    };
    this.blurredMaskTexture = PIXI.RenderTexture.create(halfResTextureOptions);

    // CRITICAL: Set texture wrap mode to CLAMP to prevent edge artifacts from Kawase blur
    // Kawase blur samples outside texture bounds at screen edges, causing visible lines
    // Note: Pooled textures have CLAMP set by default in RenderTexturePool
    this.blurredMaskTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
    
    // CRITICAL FIX: Set CLAMP mode on the source texture as well
    // This prevents Kawase blur from sampling invalid data at edges
    if (this.combinedMaskTexture) {
      this.combinedMaskTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
    }

    this.kawaseBlurFilter1 = new PIXI.filters.KawaseBlurFilter(15, 2, true);
    this.kawaseBlurFilter2 = new PIXI.filters.KawaseBlurFilter(15, 2, true);

    // Sprite sized for half-resolution rendering
    // Use EMPTY texture to prevent resize errors before first render
    this.blurSourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.blurSourceSprite.width = halfWidth;
    this.blurSourceSprite.height = halfHeight;

    try {
      this.filter = safeCreateFilter(BuildingShadowsFilter, {}, "BuildingShadowsLayer");
      // This line is critical and has been restored. It applies the shadow filter to the primary container.
      if (this.filter) {
        safeApplyFilters(
          canvas.primary,
          [...(canvas.primary.filters || []), this.filter],
          "canvas.primary (BuildingShadows)"
        );
      }
    } catch (e) {
      console.error("MapShine | Failed to create BuildingShadowsFilter", e);
      this.filter = null;
    }

    // Set initial time from the active configuration
    this.currentTime =
      game.mapShine.profileManager.activeConfig.timeOfDay.currentTime ?? 12.0;

    // Initial resize call to set texel size
    this._onResize();
  }

  async updateFromConfig(config) {
    // If a transition is active, do not apply any interpolated config changes.
    if (game.mapShine.transitionActive) return;

    const shadowConfig = config.buildingShadows;
    this.visible = config.enabled && shadowConfig.enabled;

    const timeOfDayConfig = config.timeOfDay;
    if (timeOfDayConfig && timeOfDayConfig.currentTime !== undefined) {
      this.currentTime = timeOfDayConfig.currentTime;
    }
  }

  _onResize() {
    // This is the MaskedEffectLayer's resize, which handles the mask texture
    super._onResize();

    const screen = canvas.app.renderer.screen;
    const halfWidth = Math.floor(screen.width / 2);
    const halfHeight = Math.floor(screen.height / 2);

    // Update dimensions for pooled texture acquisition
    this._blurWidth = halfWidth;
    this._blurHeight = halfHeight;
    // Resize PERSISTENT blur output texture
    this.blurredMaskTexture?.resize(halfWidth, halfHeight);
    
    // Resize sprite (only if it has valid texture)
    if (this.blurSourceSprite && this.blurSourceSprite.texture?.valid) {
      this.blurSourceSprite.width = halfWidth;
      this.blurSourceSprite.height = halfHeight;
    }

    if (this.filter) {
      this.filter.uniforms.uTexelSize = [
        1.0 / screen.width,
        1.0 / screen.height,
      ];
    }
  }

  _onAnimate(deltaTime) {
    // If a transition is active, skip all animation calculations for this layer.
    if (game.mapShine.transitionActive) return;
    this.renderEffectNow(deltaTime);
  }

  renderEffectNow(deltaTime) {
    // This calls the base class _onAnimate, which re-renders the combinedMaskTexture if needed.
    super._onAnimate(deltaTime);

    if (this._destroyed || !this.filter) return;

    // --- Robustness Checks ---
    const transform = canvas.stage.transform.localTransform;
    const isDefaultTransform =
      transform.a === 1 &&
      transform.d === 1 &&
      transform.tx === 0 &&
      transform.ty === 0;
    const outdoorsMask = this.getMaskTexture();
    const scale = CoordinateManager.getCanvasScale();

    if (isDefaultTransform || !outdoorsMask?.valid || scale === 0) {
      if (this.filter) this.filter.enabled = false;
      return;
    }

    const config = game.mapShine.profileManager.activeConfig;
    const shadowConfig = config.buildingShadows;
    const hasActiveSources = this.maskSprites.size > 0;

    this.filter.enabled =
      config.enabled && shadowConfig.enabled && hasActiveSources;

    if (!this.filter.enabled) return;

    const time = this.currentTime; // 0-23.99
    if (time < 6 || time >= 18) {
      this.filter.enabled = false;
      return;
    }

    const effectiveDaylight = 1.0 - Math.abs(time - 12) / 6.0;
    const blurPixels = shadowConfig.maxBlur * (1.0 - effectiveDaylight);
    const sunPos = (time - 12) / 6.0;
    const offsetMagnitude = shadowConfig.maxOffset * sunPos;
    const sunAngleRad = (shadowConfig.sunAngle ?? 45) * (Math.PI / 180.0);
    const shadowOffset = [
      Math.cos(sunAngleRad) * offsetMagnitude,
      Math.sin(sunAngleRad) * offsetMagnitude,
    ];

    if (
      this.kawaseBlurFilter1 &&
      this.kawaseBlurFilter2 &&
      this.combinedMaskTexture?.valid
    ) {
      // Adjust blur amount for half-resolution rendering
      const blurAmount = Math.max(0.1, blurPixels) / 4.0 / 2.0;
      this.kawaseBlurFilter1.blur = blurAmount;
      this.kawaseBlurFilter2.blur = blurAmount;
      
      // CRITICAL FIX: Ensure CLAMP wrap mode on source texture before blur
      // This prevents Kawase blur from creating edge artifacts
      if (this.combinedMaskTexture.baseTexture.wrapMode !== PIXI.WRAP_MODES.CLAMP) {
        this.combinedMaskTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
      }

      const renderer = canvas.app.renderer;

      // Acquire temporary texture from pool for intermediate blur pass
      const temp = RenderTexturePool.acquire(this._blurWidth, this._blurHeight, {
        scaleMode: PIXI.SCALE_MODES.LINEAR,
      });

      try {
        // First pass (Full-res -> Half-res)
        this.blurSourceSprite.texture = this.combinedMaskTexture;
        this.blurSourceSprite.filters = [this.kawaseBlurFilter1];
        renderer.render(this.blurSourceSprite, {
          renderTexture: temp,
          clear: true,
        });

        // Second pass (Half-res -> Half-res)
        this.blurSourceSprite.texture = temp;
        this.blurSourceSprite.filters = [this.kawaseBlurFilter2];
        renderer.render(this.blurSourceSprite, {
          renderTexture: this.blurredMaskTexture,
          clear: true,
        });
      } finally {
        // CRITICAL: Always return texture to pool
        RenderTexturePool.release(temp);
      }
    }

    const u = this.filter.uniforms;
    u.uSceneRectNorm = CoordinateManager.getSceneRectNormalizedArray();
    const canvasScale = CoordinateManager.getCanvasScale();
    u.uCanvasScale = [canvasScale, canvasScale];

    u.uGroundMask = this.combinedMaskTexture;
    u.uOutdoorsMask = this.blurredMaskTexture;
    u.uShadowOffset = shadowOffset;
    u.uIntensity = shadowConfig.intensity;
  }

  async _tearDown(options) {
    // Remove the filter from the canvas container
    if (this.filter) {
      const cleanedFilters = (canvas.primary.filters || []).filter(
        (f) => f !== this.filter
      );
      safeApplyFilters(canvas.primary, cleanedFilters, "canvas.primary (BuildingShadows teardown)");

      this.filter.destroy();
      this.filter = null;
    }

    // Destroy blur resources
    // Intermediate blur texture is pooled - not owned by this layer
    this.blurredMaskTexture?.destroy(true);
    this.kawaseBlurFilter1?.destroy();
    this.kawaseBlurFilter2?.destroy();
    this.blurSourceSprite?.destroy();
    this.blurredMaskTexture = null;
    this.kawaseBlurFilter1 = null;
    this.kawaseBlurFilter2 = null;
    this.blurSourceSprite = null;

    await super._tearDown(options);
  }
}
