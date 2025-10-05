// --- 5.12. Building Shadows ---

class BuildingShadowsFilter extends PIXI.Filter {
  constructor(_options = {}) {
    const vertexSrc = `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;

                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                }
            `;

    const fragmentSrc = `
                precision mediump float;
                varying vec2 vTextureCoord;

                uniform sampler2D uSampler;
                uniform sampler2D uOutdoorsMask;
                uniform vec2 uShadowOffset; // The shadow offset in WORLD PIXELS
                uniform float uBlur;        // The blur radius in WORLD PIXELS
                uniform float uIntensity;
                uniform vec2 uTexelSize;    // The size of one pixel in UV space (1.0 / screen_resolution)
                uniform vec2 uCanvasScale;  // The current canvas zoom/scale factor
                uniform vec4 uSceneRectNorm; // The scene boundaries in normalized screen coordinates [x, y, width, height]

                float sampleCaster(vec2 uv) {
                    vec2 sceneMin = uSceneRectNorm.xy;
                    vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;

                    if (uv.x < sceneMin.x || uv.x > sceneMax.x || uv.y < sceneMin.y || uv.y > sceneMax.y) {
                        return 1.0; // Treat as outdoors (no shadow)
                    }
                    return texture2D(uOutdoorsMask, uv).r;
                }

                void main(void) {
                    vec4 originalColor = texture2D(uSampler, vTextureCoord);

                    float groundMask = texture2D(uOutdoorsMask, vTextureCoord).r;
                    if (groundMask < 0.5) {
                        gl_FragColor = originalColor;
                        return;
                    }

                    // Convert world-pixel offset to screen-pixel offset, then to UV offset.
                    vec2 baseSampleCoord = vTextureCoord - (uShadowOffset * uCanvasScale) * uTexelSize;

                    // --- PERFORMANT BLUR ---
                    float shadowFactor = 0.0;
                    float blurPixels = uBlur * uCanvasScale.x; // Blur radius in screen pixels
                    vec2 blurUv = blurPixels * uTexelSize;     // Blur radius in UV space

                    // 9-tap box blur for an efficient soft shadow
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(-blurUv.x, -blurUv.y));
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(0.0, -blurUv.y));
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(blurUv.x, -blurUv.y));
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(-blurUv.x, 0.0));
                    shadowFactor += sampleCaster(baseSampleCoord);
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(blurUv.x, 0.0));
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(-blurUv.x, blurUv.y));
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(0.0, blurUv.y));
                    shadowFactor += sampleCaster(baseSampleCoord + vec2(blurUv.x, blurUv.y));
                    shadowFactor /= 9.0;

                    float shadowMultiplier = mix(1.0 - uIntensity, 1.0, shadowFactor);

                    vec3 finalColor = originalColor.rgb * shadowMultiplier;

                    gl_FragColor = vec4(finalColor, originalColor.a);
                }
            `;

    super(vertexSrc, fragmentSrc, {
      uOutdoorsMask: PIXI.Texture.EMPTY,

      uShadowOffset: [0, 0],

      uBlur: 1.0,

      uIntensity: 0.6,

      uTexelSize: [
        1.0 / (window.innerWidth || 1),
        1.0 / (window.innerHeight || 1),
      ],

      uCanvasScale: [1.0, 1.0],

      uSceneRectNorm: [0, 0, 1, 1],
    });
  }
}

class BuildingShadowsLayer extends MaskedEffectLayer {
  constructor() {
    // This layer uses the _Outdoors mask as its source.
    super({
      maskSuffix: "outdoors",
    });

    this.currentTime = 12.0; // Default to midday
    this.filter = null;
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

    try {
      this.filter = new BuildingShadowsFilter();
      // This line is critical and has been restored. It applies the shadow filter to the primary container.
      canvas.primary.filters = [...(canvas.primary.filters || []), this.filter];
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
    if (this.filter) {
      const screen = canvas.app.renderer.screen;
      this.filter.uniforms.uTexelSize = [
        1.0 / screen.width,
        1.0 / screen.height,
      ];
    }
  }

  _onAnimate(deltaTime) {
    // If a transition is active, skip all animation calculations for this layer.
    if (game.mapShine.transitionActive) return;

    // This calls the base class _onAnimate, which re-renders the mask if needed.
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

    // If the canvas is in a transitional state or required textures are not ready,
    // temporarily disable the filter to prevent rendering with invalid data.
    if (isDefaultTransform || !outdoorsMask?.valid || scale === 0) {
      if (this.filter) this.filter.enabled = false;
      return;
    }
    // --- End Robustness Checks ---

    const config = game.mapShine.profileManager.activeConfig;
    const shadowConfig = config.buildingShadows;
    const hasActiveSources = this.maskSprites.size > 0;

    // The filter's enabled state controls the effect's visibility.
    this.filter.enabled =
      config.enabled && shadowConfig.enabled && hasActiveSources;

    if (!this.filter.enabled) return;

    // --- Calculate Shadow Parameters based on Time ---
    const time = this.currentTime; // 0-23.99

    // Don't show shadows at night
    if (time < 6 || time >= 18) {
      this.filter.enabled = false;
      return;
    }

    // This creates a curve from 0 (at 6 & 18) to 1 (at 12)
    const effectiveDaylight = 1.0 - Math.abs(time - 12) / 6.0;

    // Represents sun position for magnitude: -1.0 (east at 6am) to +1.0 (west at 6pm)
    const sunPos = (time - 12) / 6.0;

    // Calculate the raw pixel offset magnitude in world space.
    const offsetMagnitude = shadowConfig.maxOffset * sunPos;

    // Get the direction from the sun angle
    const sunAngleRad = (shadowConfig.sunAngle ?? 45) * (Math.PI / 180.0);

    // Calculate the final offset vector
    const shadowOffset = [
      Math.cos(sunAngleRad) * offsetMagnitude,
      Math.sin(sunAngleRad) * offsetMagnitude,
    ];

    // Blur is max at sunrise/sunset, min at midday
    const blurPixels = shadowConfig.maxBlur * (1.0 - effectiveDaylight);

    // --- Update Filter Uniforms ---
    const u = this.filter.uniforms;

    // Get all coordinate data from the centralized manager.
    u.uSceneRectNorm = CoordinateManager.getSceneRectNormalizedArray();
    const canvasScale = CoordinateManager.getCanvasScale();
    u.uCanvasScale = [canvasScale, canvasScale];

    // Update all uniforms
    u.uOutdoorsMask = outdoorsMask; // Use the checked texture from the start of the function
    u.uShadowOffset = shadowOffset;
    u.uBlur = Math.max(0.1, blurPixels);
    // Intensity is now constant throughout the day.
    u.uIntensity = shadowConfig.intensity;
  }

  async _tearDown(options) {
    // Remove the filter from the canvas container
    if (this.filter) {
      canvas.primary.filters = (canvas.primary.filters || []).filter(
        (f) => f !== this.filter
      );

      this.filter.destroy();
      this.filter = null;
    }

    // The base class teardown will handle destroying the mask textures and containers.
    await super._tearDown(options);
  }
}
