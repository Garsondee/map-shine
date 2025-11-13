import { PIXI, Texture, RenderTexture } from "../pixi-adapter.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { NativeAnimation } from "../utils/NativeAnimation.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import { CONST, TILE_OCCLUSION_MODES } from "../foundry-adapter.js";
import { ResizableAnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";

class OverheadRecolorFilter extends PIXI.Filter {
  constructor(_options = {}) {
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

                uniform sampler2D uSampler;

                // Cloud darkening uniforms
                uniform sampler2D uCloudShadows;
                uniform float uCloudShadowDarkenIntensity;
                uniform bool uCloudShadowDarkenEnabled;

                // Outdoors mask uniform
                uniform sampler2D uOutdoorsMask;

                // Building shadows uniforms
                uniform sampler2D uBuildingShadowMask;
                uniform vec2 uShadowOffset;
                uniform float uShadowIntensity;
                uniform bool uBuildingShadowsEnabled;
                uniform vec2 uTexelSize;
                uniform vec2 uCanvasScale;

                // Scene darkness uniform
                uniform float uDarkness;

                // Time of Day uniforms
                uniform float uToDIntensity;
                uniform float uToDBlendFactor;
                uniform float uToDFromSaturation;
                uniform float uToDFromBrightness;
                uniform float uToDFromContrast;
                uniform float uToDFromExposure;
                uniform float uToDFromGamma;
                uniform float uToDFromTemperature;
                uniform float uToDFromTint;
                uniform float uToDToSaturation;
                uniform float uToDToBrightness;
                uniform float uToDToContrast;
                uniform float uToDToExposure;
                uniform float uToDToGamma;
                uniform float uToDToTemperature;
                uniform float uToDToTint;
                uniform float uToDOverheadStrength;

                const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                vec3 applyWhiteBalance(vec3 color, float temperature, float tint) {
                    color.r += temperature * 0.15;
                    color.g += temperature * 0.075;
                    color.b -= temperature * 0.15;
                    color.g += tint * 0.15;
                    color.r -= tint * 0.075;
                    color.b -= tint * 0.075;
                    return color;
                }

                void main() {
                    vec4 originalColor = texture2D(uSampler, vTextureCoord);
                    if (originalColor.a == 0.0) {
                        discard;
                    }

                    // Unpremultiply if needed (PIXI uses premultiplied alpha)
                    vec3 workingColor = originalColor.a > 0.0 ? originalColor.rgb / originalColor.a : originalColor.rgb;

                    if (uCloudShadowDarkenEnabled) {
                        // uCloudShadows texture has high values (near 1.0) for clouds and low values (near 0.0) for clear sky.
                        float cloudValue = texture2D(uCloudShadows, vTextureCoord).r;

                        // We want to darken the color where cloudValue is high.
                        // A darkeningFactor of 1.0 means no change. A factor of 0.0 is fully black.
                        // This formula creates the correct factor based on cloud presence and intensity.
                        float darkeningFactor = 1.0 - (cloudValue * uCloudShadowDarkenIntensity);

                        // Apply the darkening factor.
                        workingColor *= darkeningFactor;
                    }

                    // Apply scene darkness. A darkness of 1.0 will make the color black.
                    workingColor *= (1.0 - uDarkness * 0.875);

                    // Sample the _Outdoors mask to determine if this pixel is outdoors
                    float outdoorsMask = texture2D(uOutdoorsMask, vTextureCoord).r;

                    // Apply building shadows to outdoor overhead pixels
                    if (uBuildingShadowsEnabled && outdoorsMask > 0.5) {
                        // Calculate shadow sample coordinate with offset
                        vec2 uvOffset = (uShadowOffset * uCanvasScale) * uTexelSize;
                        vec2 shadowCoord = vTextureCoord - uvOffset;
                        
                        // Sample the pre-blurred building shadow mask
                        float shadowFactor = texture2D(uBuildingShadowMask, shadowCoord).r;
                        
                        // Apply shadow darkening (shadowFactor = 1.0 means no shadow, 0.0 means full shadow)
                        float shadowMultiplier = mix(1.0 - uShadowIntensity, 1.0, shadowFactor);
                        workingColor *= shadowMultiplier;
                    }

                    // Apply Time of Day color correction only to outdoor areas (where mask is white)
                    if (uToDIntensity > 0.0 && uToDOverheadStrength > 0.0 && outdoorsMask > 0.1) {
                        // Store original color for blending
                        vec3 colorBeforeToD = workingColor;
                        
                        // Interpolate all ToD parameters
                        float saturation = mix(uToDFromSaturation, uToDToSaturation, uToDBlendFactor);
                        float brightness = mix(uToDFromBrightness, uToDToBrightness, uToDBlendFactor);
                        float contrast = mix(uToDFromContrast, uToDToContrast, uToDBlendFactor);
                        float exposure = mix(uToDFromExposure, uToDToExposure, uToDBlendFactor);
                        float gamma = mix(uToDFromGamma, uToDToGamma, uToDBlendFactor);
                        float temperature = mix(uToDFromTemperature, uToDToTemperature, uToDBlendFactor);
                        float tint = mix(uToDFromTint, uToDToTint, uToDBlendFactor);

                        // Apply tonal corrections
                        workingColor *= pow(2.0, exposure);
                        if (gamma > 0.0) workingColor = pow(max(workingColor, 0.0), vec3(1.0 / gamma));
                        workingColor += brightness;
                        workingColor = (workingColor - 0.5) * contrast + 0.5;

                        // Apply saturation
                        float luminance = dot(workingColor, lum_weights);
                        workingColor = mix(vec3(luminance), workingColor, saturation);

                        // Apply white balance
                        workingColor = applyWhiteBalance(workingColor, temperature, tint);
                        
                        // Blend with original color based on strength
                        workingColor = mix(colorBeforeToD, workingColor, uToDOverheadStrength);
                    }

                    // Repremultiply alpha for output
                    vec3 finalColor = clamp(workingColor, 0.0, 1.0) * originalColor.a;
                    gl_FragColor = vec4(finalColor, originalColor.a);
                }
            `;

    super(vertexSrc, fragmentSrc, {
      uCloudShadows: PIXI.Texture.EMPTY,

      uCloudShadowDarkenIntensity: 0.5,

      uCloudShadowDarkenEnabled: false,

      uOutdoorsMask: PIXI.Texture.WHITE,

      // Building shadows uniforms
      uBuildingShadowMask: PIXI.Texture.EMPTY,
      uShadowOffset: [0, 0],
      uShadowIntensity: 0.6,
      uBuildingShadowsEnabled: false,
      uTexelSize: [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)],
      uCanvasScale: [1.0, 1.0],

      // Darkness uniform
      uDarkness: 0.0,
      // Time of Day uniforms

      uToDIntensity: 0.0,

      uToDBlendFactor: 0.0,

      uToDFromSaturation: 1.0,

      uToDFromBrightness: 0.0,

      uToDFromContrast: 1.0,

      uToDFromExposure: 0.0,

      uToDFromGamma: 1.0,

      uToDFromTemperature: 0.0,

      uToDFromTint: 0.0,

      uToDToSaturation: 1.0,

      uToDToBrightness: 0.0,

      uToDToContrast: 1.0,

      uToDToExposure: 0.0,

      uToDToGamma: 1.0,

      uToDToTemperature: 0.0,

      uToDToTint: 0.0,

      uToDOverheadStrength: 0.5,
    });
  }
}

export class OverheadEffectLayer extends ResizableAnimatedCanvasLayer {
  constructor() {
    super();
    this.overheadSprites = new Map();
    this.spritesContainer = null;
    this.blurFilter = null;
    this.recolorFilter = null;
    this.compositeTexture = null;
    this.compositeSprite = null;
    this.activeAnimations = new Map();
    
    // Blur properties
    this.blurMinZoom = 0;
    this.blurMidZoom = 2;
    this.blurMaxZoom = 8;
    // Opacity properties
    this.opacityMinZoom = 1.0;
    this.opacityMidZoom = 1.0;
    this.opacityMaxZoom = 0.25;
    // Zoom Point properties
    this.zoomPointMin = 0.2;
    this.zoomPointMid = 0.65;
    this.zoomPointMax = 1.5;

    // Bound listeners for robust add/remove
    this._boundRefresh = this._refreshOverheadTiles.bind(this);
    this._boundOnCanvasReady = this._refreshOverheadTiles.bind(this);
  }

  async _draw() {
    await super._draw(); // Handles ticker, resize, and _destroyed flag
    
    // Defer setting eventMode to "auto" until after EventSystem is fully initialized
    setTimeout(() => {
      if (!this._destroyed) {
        this.eventMode = "auto";
      }
    }, 100);

    const screen = canvas.app.renderer.screen;

    this.spritesContainer = new PIXI.Container();

    this.compositeTexture = PIXI.RenderTexture.create({
      width: screen.width,
      height: screen.height,
    });

    this.blurFilter = safeCreateFilter(PIXI.BlurFilter, {}, "OverheadEffectLayer.BlurFilter");
    this.recolorFilter = safeCreateFilter(OverheadRecolorFilter, {}, "OverheadEffectLayer.RecolorFilter");

    this.compositeSprite = new PIXI.Sprite(this.compositeTexture);
    const filters = [];
    if (this.blurFilter) filters.push(this.blurFilter);
    if (this.recolorFilter) filters.push(this.recolorFilter);
    safeApplyFilters(this.compositeSprite, filters, "OverheadEffectLayer.compositeSprite");
    this.compositeSprite.filterArea = new PIXI.Rectangle(
      0,
      0,
      screen.width,
      screen.height
    );
    // CRITICAL: Make composite sprite non-interactive
    // Only the individual sprites in the quadtree should respond to hover
    this.compositeSprite.eventMode = "none";
    this.compositeSprite.interactiveChildren = false;
    this.addChild(this.compositeSprite);

    Hooks.on("createTile", this._boundRefresh);
    Hooks.on("updateTile", this._boundRefresh);
    Hooks.on("deleteTile", this._boundRefresh);
    Hooks.on("canvasReady", this._boundOnCanvasReady);

    // The calls to updateFromConfig and _refreshOverheadTiles have been removed from here.
    // They are now correctly handled by the main lifecycle manager and the canvasReady hook respectively.
  }

  async _tearDown(options) {
    for (const anim of this.activeAnimations.values()) {
      anim.kill();
    }
    this.activeAnimations.clear();

    // Clean up sprites
    for (const [tileId, sprite] of this.overheadSprites.entries()) {
      // Restore original tile mesh visibility
      const tile = canvas.tiles.get(tileId);
      if (tile && tile.isManagedByOverheadLayer) {
        tile.isManagedByOverheadLayer = false;
        tile.mesh.alpha = 1.0;
      }
    }

    Hooks.off("createTile", this._boundRefresh);
    Hooks.off("updateTile", this._boundRefresh);
    Hooks.off("deleteTile", this._boundRefresh);
    Hooks.off("canvasReady", this._boundOnCanvasReady);

    this.spritesContainer?.destroy({ children: true });
    this.blurFilter?.destroy();

    this.recolorFilter?.destroy();
    this.compositeTexture?.destroy(true);
    this.compositeSprite?.destroy();
    this.overheadSprites.clear();

    await super._tearDown(options); // Handles ticker, resize unbinding and _destroyed flag
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible) {
      if (this.compositeSprite) this.compositeSprite.visible = false;
      // Restore original tile visibility
      for (const [tileId] of this.overheadSprites.entries()) {
        const tile = canvas.tiles.get(tileId);
        if (tile && tile.isManagedByOverheadLayer) {
          tile.mesh.alpha = 1.0;
        }
      }
      return;
    }

    // ✅ FIX: Check master enabled flag
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) {
      if (this.compositeSprite) this.compositeSprite.visible = false;
      // Restore original tile visibility when master disabled
      for (const [tileId] of this.overheadSprites.entries()) {
        const tile = canvas.tiles.get(tileId);
        if (tile && tile.isManagedByOverheadLayer) {
          tile.mesh.alpha = 1.0;
        }
      }
      return;
    }

    // ✅ FIX: Check overheadEffect enabled flag - revert to Foundry default when disabled
    if (config?.overheadEffect && config.overheadEffect.enabled === false) {
      if (this.compositeSprite) this.compositeSprite.visible = false;
      // Restore original tile visibility when overheadEffect disabled
      for (const [tileId] of this.overheadSprites.entries()) {
        const tile = canvas.tiles.get(tileId);
        if (tile && tile.isManagedByOverheadLayer) {
          tile.mesh.alpha = 1.0;
        }
      }
      return;
    }

    if (this.overheadSprites.size === 0) {
      if (this.compositeSprite) this.compositeSprite.visible = false;
      return;
    }

    this.compositeSprite.visible = true;

    // Update sprite transforms
    for (const [id, sprite] of this.overheadSprites.entries()) {
      const tile = canvas.tiles.get(id);
      if (tile?.texture?.valid) {
        sprite.position.copyFrom(tile.mesh.position);
        sprite.width = tile.document.width;
        sprite.height = tile.document.height;
        sprite.rotation = tile.mesh.rotation;
        sprite.texture = tile.texture;
        sprite.anchor.copyFrom(tile.mesh.anchor);
        
        // CRITICAL: Continuously enforce hidden state
        // Foundry's tile refresh system can reset mesh.alpha, so we enforce it every frame
        if (tile.mesh.alpha !== 0) {
          tile.mesh.alpha = 0;
        }
      }
    }

    const currentZoom = CoordinateManager.getCanvasScale();
    const lerp = (a, b, t) => a * (1 - t) + b * t;

    let blur = 0;
    let opacity = 1.0;

    if (currentZoom <= this.zoomPointMin) {
      blur = this.blurMinZoom;
      opacity = this.opacityMinZoom;
    } else if (currentZoom >= this.zoomPointMax) {
      blur = this.blurMaxZoom;
      opacity = this.opacityMaxZoom;
    } else if (
      currentZoom > this.zoomPointMin &&
      currentZoom <= this.zoomPointMid
    ) {
      // Interpolate between min and mid
      const range = this.zoomPointMid - this.zoomPointMin;
      const progress =
        (currentZoom - this.zoomPointMin) / (range > 0 ? range : 1);
      blur = lerp(this.blurMinZoom, this.blurMidZoom, progress);
      opacity = lerp(this.opacityMinZoom, this.opacityMidZoom, progress);
    } else {
      // currentZoom > this.zoomPointMid && currentZoom < this.zoomPointMax
      // Interpolate between mid and max
      const range = this.zoomPointMax - this.zoomPointMid;
      const progress =
        (currentZoom - this.zoomPointMid) / (range > 0 ? range : 1);
      blur = lerp(this.blurMidZoom, this.blurMaxZoom, progress);
      opacity = lerp(this.opacityMidZoom, this.opacityMaxZoom, progress);
    }

    if (this.blurFilter) {
      const screenBlur = blur * currentZoom;
      this.blurFilter.blur = screenBlur;
      this.blurFilter.enabled = this.visible && screenBlur > 0.01;
    }

    // Apply zoom-based opacity to the final composite sprite
    // This is separate from per-sprite hover fade and multiplies with it
    if (this.compositeSprite) {
      this.compositeSprite.alpha = opacity;
    }

    if (this.recolorFilter) {
      const resourceManager = game.mapShine.resourceManager;
      if (resourceManager) {
        this.recolorFilter.uniforms.uCloudShadows =
          resourceManager.getRawCloudTexture(deltaTime) ?? PIXI.Texture.EMPTY;
        this.recolorFilter.uniforms.uOutdoorsMask =
          resourceManager.getOutdoorsMask() ?? PIXI.Texture.WHITE;
      }
      // Pass the scene  level to the filter
      this.recolorFilter.uniforms.uDarkness =
        canvas.scene?.environment.darknessLevel ?? 0;

      // Copy Time of Day color correction uniforms from TimeOfDayLayer
      const todLayer = canvas.timeOfDay;
      if (todLayer?.filter?.uniforms) {
        const todUniforms = todLayer.filter.uniforms;
        this.recolorFilter.uniforms.uToDIntensity =
          todUniforms.uIntensity ?? 0.0;
        this.recolorFilter.uniforms.uToDBlendFactor =
          todUniforms.uBlendFactor ?? 0.0;
        this.recolorFilter.uniforms.uToDFromSaturation =
          todUniforms.uFromSaturation ?? 1.0;
        this.recolorFilter.uniforms.uToDFromBrightness =
          todUniforms.uFromBrightness ?? 0.0;
        this.recolorFilter.uniforms.uToDFromContrast =
          todUniforms.uFromContrast ?? 1.0;
        this.recolorFilter.uniforms.uToDFromExposure =
          todUniforms.uFromExposure ?? 0.0;
        this.recolorFilter.uniforms.uToDFromGamma =
          todUniforms.uFromGamma ?? 1.0;
        this.recolorFilter.uniforms.uToDFromTemperature =
          todUniforms.uFromTemperature ?? 0.0;
        this.recolorFilter.uniforms.uToDFromTint = todUniforms.uFromTint ?? 0.0;
        this.recolorFilter.uniforms.uToDToSaturation =
          todUniforms.uToSaturation ?? 1.0;
        this.recolorFilter.uniforms.uToDToBrightness =
          todUniforms.uToBrightness ?? 0.0;
        this.recolorFilter.uniforms.uToDToContrast =
          todUniforms.uToContrast ?? 1.0;
        this.recolorFilter.uniforms.uToDToExposure =
          todUniforms.uToExposure ?? 0.0;
        this.recolorFilter.uniforms.uToDToGamma = todUniforms.uToGamma ?? 1.0;
        this.recolorFilter.uniforms.uToDToTemperature =
          todUniforms.uToTemperature ?? 0.0;
        this.recolorFilter.uniforms.uToDToTint = todUniforms.uToTint ?? 0.0;
      }

      // Set ToD strength
      const config = game.mapShine.profileManager.activeConfig;
      const oeConfig = config.overheadEffect;
      this.recolorFilter.uniforms.uToDOverheadStrength =
        oeConfig.timeOfDayStrength ?? 0.5;
      
      // Pass building shadow data from BuildingShadowsLayer
      const buildingShadowsLayer = canvas.buildingShadows;
      if (buildingShadowsLayer && oeConfig.buildingShadows?.enabled) {
        const shadowFilter = buildingShadowsLayer.filter;
        this.recolorFilter.uniforms.uBuildingShadowsEnabled = 
          shadowFilter?.enabled ?? false;
        this.recolorFilter.uniforms.uBuildingShadowMask = 
          buildingShadowsLayer.getBlurredOutdoorsMask() ?? PIXI.Texture.EMPTY;
        this.recolorFilter.uniforms.uShadowOffset = 
          shadowFilter?.uniforms?.uShadowOffset ?? [0, 0];
        this.recolorFilter.uniforms.uShadowIntensity = 
          oeConfig.buildingShadows?.intensity ?? 0.6;
        
        // Update texel size and canvas scale
        const screen = canvas.app.renderer.screen;
        this.recolorFilter.uniforms.uTexelSize = [
          1.0 / screen.width,
          1.0 / screen.height
        ];
        const canvasScale = CoordinateManager.getCanvasScale();
        this.recolorFilter.uniforms.uCanvasScale = [canvasScale, canvasScale];
      } else {
        this.recolorFilter.uniforms.uBuildingShadowsEnabled = false;
      }
    }

    const renderer = canvas.app.renderer;
    // CRITICAL: Check if BatchRenderer is ready before rendering
    const batchRenderer = renderer.plugins?.batch;
    if (!batchRenderer || !batchRenderer._bufferedElements) {
      return; // Defer rendering until BatchRenderer is initialized
    }
    
    // Render the composite
    renderer.render(this.spritesContainer, {
      renderTexture: this.compositeTexture,
      clear: true,
      transform: canvas.stage.transform.worldTransform,
    });

    // Make our final composite sprite visible
    this.compositeSprite.visible = true;
    // Instead of setting width/height, we set the scale directly. This is more robust.
    // The texture of compositeSprite is screen-sized. To make the sprite have a world-size
    // that perfectly matches the viewport, we need to scale it by 1 / canvasScale.
    const scale = CoordinateManager.getCanvasScale();

    this.compositeSprite.position.copyFrom(CoordinateManager.getCameraOffset());
    if (scale > 0) {
      this.compositeSprite.scale.set(1 / scale);
    }
  }

  _onResize() {
    if (this._destroyed) return;
    const screen = CoordinateManager.getScreenDimensions();
    
    // Log texture size mismatch for debugging
    if (this.compositeTexture && 
        (this.compositeTexture.width !== screen.width || this.compositeTexture.height !== screen.height)) {
      console.warn(
        `Map Shine | Overhead composite texture size mismatch detected before resize: ` +
        `texture=${this.compositeTexture.width}x${this.compositeTexture.height}, ` +
        `screen=${screen.width}x${screen.height}`
      );
    }
    
    this.compositeTexture?.resize(screen.width, screen.height);
    
    if (this.compositeSprite) {
      this.compositeSprite.filterArea = new PIXI.Rectangle(
        0,
        0,
        screen.width,
        screen.height
      );
    }
  }

  async updateFromConfig(config) {
    const oeConfig = config.overheadEffect;
    this.visible = config.enabled && oeConfig.enabled;

    this.blurMinZoom = oeConfig.blurMinZoom ?? 0;
    this.blurMidZoom = oeConfig.blurMidZoom ?? 2;
    this.blurMaxZoom = oeConfig.blurMaxZoom ?? 8;
    this.opacityMinZoom = oeConfig.opacityMinZoom ?? 1.0;
    this.opacityMidZoom = oeConfig.opacityMidZoom ?? 1.0;
    this.opacityMaxZoom = oeConfig.opacityMaxZoom ?? 0.25;
    this.zoomPointMin = oeConfig.zoomPointMin ?? 0.2;
    this.zoomPointMid = oeConfig.zoomPointMid ?? 0.65;
    this.zoomPointMax = oeConfig.zoomPointMax ?? 1.5;

    if (this.recolorFilter && oeConfig.recolor) {
      const rConfig = oeConfig.recolor;
      this.recolorFilter.uniforms.uRecolorEnabled = rConfig.enabled ?? false;

      const csdConfig = rConfig.cloudShadowDarken;
      if (csdConfig) {
        this.recolorFilter.uniforms.uCloudShadowDarkenEnabled =
          csdConfig.enabled ?? false;
        this.recolorFilter.uniforms.uCloudShadowDarkenIntensity =
          csdConfig.intensity ?? 0.5;
      }
    }
    
    // Refresh overhead tiles to ensure sprites are created/updated
    this._refreshOverheadTiles();
  }

  _refreshOverheadTiles() {
    if (!this.spritesContainer) return;
    
    // Guard: Ensure tiles collection exists before attempting refresh
    if (!canvas.tiles?.placeables) {
      console.warn('MapShine | OverheadEffectLayer: Tiles not ready yet, deferring refresh');
      return;
    }

    const currentOverheadIds = new Set();
    for (const tile of canvas.tiles.placeables) {
      // Check if tile is overhead/roof using occlusion mode
      const isOverhead =
        tile.document.overhead ||
        tile.document.roof ||
        tile.document.occlusion?.mode === CONST.TILE_OCCLUSION_MODES.ROOF;

      if (isOverhead) {
        currentOverheadIds.add(tile.id);
        if (!this.overheadSprites.has(tile.id)) {
          const sprite = new PIXI.Sprite(tile.texture);
          
          // Setup PIXI pointer events for hover detection
          sprite.eventMode = "static";
          sprite.cursor = "pointer";
          
          // Get hover fade duration from config
          const config = game.mapShine.profileManager.activeConfig;
          const duration = (config.overheadEffect.hoverFadeDuration || 500) / 1000; // Convert ms to seconds
          
          sprite.on("pointerover", () => {
            const anim = NativeAnimation.to(sprite, {
              key: `overhead-${tile.id}`,
              alpha: 0,
              duration: duration,
              ease: "power2.out",
            });
            this.activeAnimations.set(tile.id, anim);
          });
          
          sprite.on("pointerout", () => {
            const anim = NativeAnimation.to(sprite, {
              key: `overhead-${tile.id}`,
              alpha: 1,
              duration: duration,
              ease: "power2.inOut",
            });
            this.activeAnimations.set(tile.id, anim);
          });

          // Add to sprite container
          this.overheadSprites.set(tile.id, sprite);
          this.spritesContainer.addChild(sprite);
          
          // Hide original mesh since we're rendering the duplicate
          tile.isManagedByOverheadLayer = true;
          tile.mesh.alpha = 0;
        }
      }
    }

    // Clean up sprites for tiles that are no longer overhead
    for (const [id, sprite] of this.overheadSprites.entries()) {
      if (!currentOverheadIds.has(id)) {
        // Remove any active animations
        if (this.activeAnimations.has(id)) {
          this.activeAnimations.get(id).kill();
          this.activeAnimations.delete(id);
        }
        
        // Restore original tile mesh visibility
        const tile = canvas.tiles.get(id);
        if (tile) {
          tile.isManagedByOverheadLayer = false;
          tile.mesh.alpha = 1.0;
        }
        
        // Destroy sprite
        sprite.destroy();
        this.overheadSprites.delete(id);
      }
    }
    
  }

  /**
   * Implements containsCanvasPoint for sprite bounds checking
   * @param {PIXI.Sprite} sprite - The sprite to check
   * @param {PIXI.Point} point - Canvas point to test
   * @returns {boolean} Whether the sprite contains the point
   */
  _spriteContainsCanvasPoint(sprite, point) {
    if (!sprite.visible || !sprite.renderable) return false;
    
    // Get sprite bounds in world space
    const bounds = sprite.getBounds();
    if (!bounds.contains(point.x, point.y)) return false;

    // For more precise collision, check if the sprite's texture has alpha at this point
    // For now, use simple bounds check (can be enhanced later with alpha threshold)
    return true;
  }
}