import { PIXI, RenderTexture, Texture } from "../pixi-adapter.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { AnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";
import { MODULE_ID } from "../config/constants.js";

class CloudDepthRecolorFilter extends PIXI.Filter {
  constructor() {
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
      uniform vec4 uSceneRectNorm;
      uniform vec3 u_cloudColor;
      uniform float u_threshold;
      uniform float u_softness;
      uniform float u_darkness;
      
      // Full Color Correction Suite
      uniform float u_saturation;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_exposure;
      uniform float u_gamma;
      uniform float u_temperature;
      uniform float u_tint;
      uniform float u_zoomOpacity;
      
      const vec3 lum_weights = vec3(0.299, 0.587, 0.114);
      
      vec3 applyWhiteBalance(vec3 color, float temp, float tint) {
        const float STRENGTH = 0.5;
        color.r += temp * (color.r * (1.0 - color.r)) * STRENGTH;
        color.b -= temp * (color.b * (1.0 - color.b)) * STRENGTH;
        color.g += tint * (color.g * (1.0 - color.g)) * STRENGTH;
        return color;
      }

      void main() {
        // Scene bounds check - prevent rendering outside scene area
        vec2 sceneMin = uSceneRectNorm.xy;
        vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
        if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x ||
            vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }
        
        vec4 texColor = texture2D(uSampler, vTextureCoord);
        
        // Raw cloud texture has bright areas where clouds are present
        float cloudIntensity = texColor.r;
        
        // Apply threshold with soft edges to isolate clouds
        float alpha = smoothstep(u_threshold - u_softness, u_threshold + u_softness, cloudIntensity);
        
        // Early exit for fully transparent areas - don't apply color correction
        if (alpha < 0.001) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          return;
        }
        
        // === EDGE DETECTION FOR GOLDEN HOUR EFFECTS ===
        // Thin wispy cloud edges get MORE color than thick centers
        // Edge strength: 0.0 = thick center, 1.0 = thin edge
        float edgeStrength = 1.0 - smoothstep(0.3, 0.7, cloudIntensity);
        
        // Calculate darkness factor: 0.25 at full darkness (75% darker), 1.0 at no darkness
        float darknessFactor = 1.0 - (u_darkness * 0.75);
        
        // Start with base cloud color and intensity
        // IMPORTANT: Use alpha to ensure we only work with cloud areas
        vec3 workingColor = u_cloudColor * alpha * darknessFactor;
        
        // === REORDERED COLOR CORRECTION PIPELINE ===
        // First normalize to white, THEN apply time-of-day colors
        
        // 1. Brightness (normalize shadow map to white clouds FIRST)
        workingColor += u_brightness * alpha;
        
        // 2. Contrast (shape the cloud form)
        workingColor = (workingColor - alpha * 0.5) * u_contrast + alpha * 0.5;
        
        // 3. Gamma (tonal adjustments)
        if (u_gamma > 0.0) {
          workingColor = pow(max(workingColor, 0.0), vec3(1.0 / u_gamma));
        }
        
        // 4. Saturation (before color grading)
        float luminance = dot(workingColor, lum_weights);
        workingColor = mix(vec3(luminance), workingColor, u_saturation);
        
        // === NOW apply time-of-day colors to the WHITE clouds ===
        
        // 5. Exposure (time-of-day brightness)
        workingColor *= pow(2.0, u_exposure);
        
        // 6. White Balance (Temperature & Tint) with GOLDEN HOUR EDGE ENHANCEMENT
        // Detect golden hour with STRICT conditions:
        // - High temperature (warm red/orange), excludes neutral midday
        // - Low exposure (sun near horizon), excludes high midday sun
        // - Creates 0.0-1.0 strength that peaks at sunrise/sunset only
        float tempStrength = smoothstep(0.3, 1.0, max(0.0, u_temperature)); // Needs strong warmth
        float exposureGate = 1.0 - smoothstep(-0.5, 0.5, u_exposure);        // Low at horizon, zero at midday
        float goldenHourStrength = tempStrength * exposureGate;
        goldenHourStrength = clamp(goldenHourStrength * 1.5, 0.0, 1.0);
        
        // Amplify temperature/tint on edges during golden hour
        float edgeColorBoost = 1.0 + (edgeStrength * goldenHourStrength * 2.5);
        float amplifiedTemp = u_temperature * edgeColorBoost;
        float amplifiedTint = u_tint * edgeColorBoost;
        
        workingColor = applyWhiteBalance(workingColor, amplifiedTemp, amplifiedTint);
        
        // Add extra saturation + yellows/oranges to edges during golden hour
        if (goldenHourStrength > 0.1 && edgeStrength > 0.2) {
          // Variable golden colors based on edge thickness
          // Thin edges: bright yellow-orange (1.0, 0.85, 0.5)
          // Thick edges: deep red-orange (1.0, 0.5, 0.2)
          vec3 goldenTint = mix(
            vec3(1.0, 0.5, 0.2),   // Deep orange for thicker parts
            vec3(1.0, 0.85, 0.5),  // Bright yellow for thin wisps
            edgeStrength
          );
          
          // Add golden tint with edge-based variation
          float tintStrength = edgeStrength * goldenHourStrength * 0.4;
          workingColor = mix(workingColor, workingColor * goldenTint, tintStrength);
          
          // Extra saturation for fiery effect
          float edgeLuminance = dot(workingColor, lum_weights);
          float extraSaturation = 1.0 + (edgeStrength * goldenHourStrength * 0.8);
          workingColor = mix(vec3(edgeLuminance), workingColor, extraSaturation);
        }
        
        // Clamp final color
        vec3 finalColor = clamp(workingColor, 0.0, 1.0);
        
        float outA = clamp(alpha * u_zoomOpacity, 0.0, 1.0);
        vec3 outRGB = finalColor * outA; // Premultiplied alpha to avoid color bleed
        gl_FragColor = vec4(outRGB, outA);
      }
    `;

    super(vertexSrc, fragmentSrc, {
      uSceneRectNorm: [0, 0, 1, 1], // Scene bounds in normalized screen coordinates
      u_cloudColor: [1.0, 1.0, 1.0], // White by default
      u_threshold: 0.3, // Threshold for cloud detection
      u_softness: 0.2, // Soft edge falloff
      u_darkness: 0.0, // Scene darkness level (0 = day, 1 = night)

      // Color Correction defaults
      u_saturation: 1.0,
      u_brightness: 0.0,
      u_contrast: 1.0,
      u_exposure: 0.0,
      u_gamma: 1.0,
      u_temperature: 0.0,
      u_tint: 0.0,
      u_zoomOpacity: 1.0,
    });
  }
}

export class CloudDepthLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this.depthSprite = null;
    this.recolorFilter = null;

    // Masking support for per-tile visibility
    this.maskTexture = null;
    this.maskGraphics = null;
    this.maskSprite = null;
    this._needsMaskUpdate = true;

    // Zoom-based opacity properties (matching OverheadEffectLayer pattern)
    this.opacityMinZoom = 1.0;
    this.opacityMidZoom = 0.0;
    this.opacityMaxZoom = 0.0;
    this.zoomPointMin = 0.25;
    this.zoomPointMid = 0.30;
    this.zoomPointMax = 2.00;
  }

  async _draw() {
    await super._draw(); // Handles ticker binding and _destroyed flag
    this.interactiveChildren = false;

    // Create the recolor filter
    this.recolorFilter = new CloudDepthRecolorFilter();

    // Create mask texture and graphics for per-tile visibility
    const renderer = canvas.app.renderer;
    this.maskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });
    this.maskGraphics = new PIXI.Graphics();

    // Create sprite to display the raw cloud texture
    this.depthSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.depthSprite.anchor.set(0, 0);
    this.depthSprite.filters = [this.recolorFilter];
    this.depthSprite.alpha = 0;
    this.addChild(this.depthSprite);

    // Register hooks to trigger mask updates
    this._flagUpdate = () => { 
      // console.log('MapShine | CloudDepthLayer mask update triggered');
      this._needsMaskUpdate = true; 
    };
    Hooks.on("canvasPan", this._flagUpdate);
    Hooks.on("updateScene", this._flagUpdate); // Listen for scene flag changes

    this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    
    // Initial mask update
    this._needsMaskUpdate = true;
  }

  async _tearDown(options) {
    // Remove hooks
    if (this._flagUpdate) {
      Hooks.off("canvasPan", this._flagUpdate);
      Hooks.off("updateScene", this._flagUpdate);
    }

    this.recolorFilter?.destroy();
    this.depthSprite?.destroy();
    this.maskTexture?.destroy();
    this.maskGraphics?.destroy();
    this.maskSprite?.destroy();

    this.recolorFilter = null;
    this.depthSprite = null;
    this.maskTexture = null;
    this.maskGraphics = null;
    this.maskSprite = null;

    await super._tearDown(options); // Handles ticker unbinding and _destroyed flag
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible || !this.depthSprite) {
      if (this.depthSprite) this.depthSprite.visible = false;
      return;
    }

    const config = game.mapShine.profileManager.activeConfig.cloudShadows.depth;

    // Check if depth effect is enabled
    if (!config.enabled) {
      this.depthSprite.visible = false;
      return;
    }

    // Get the raw cloud texture from ResourceManager, which ensures proper rendering coordination
    const resourceManager = game.mapShine.resourceManager;
    if (!resourceManager) {
      this.depthSprite.visible = false;
      return;
    }

    const rawCloudTexture = resourceManager.getRawCloudTexture(deltaTime);
    if (!rawCloudTexture || !rawCloudTexture.valid) {
      this.depthSprite.visible = false;
      return;
    }

    // Render mask if needed
    if (this._needsMaskUpdate) {
      this._renderVisibilityMask(config);
      this._needsMaskUpdate = false;
    }

    // Update sprite texture
    this.depthSprite.texture = rawCloudTexture;
    
    // Get camera position and current zoom level
    const cameraOffset = CoordinateManager.getCameraOffset();
    const currentZoom = CoordinateManager.getCanvasScale();

    // The rawCloudTexture is a screen-space render texture.
    // To display it correctly in world space, we scale by 1/canvasScale
    // (same approach as OverheadEffectLayer)
    if (currentZoom > 0) {
      this.depthSprite.scale.set(1 / currentZoom);
    }

    // Position at camera location with user-defined parallax offset
    const offsetX = config.offsetX || 0;
    const offsetY = config.offsetY || 0;
    this.depthSprite.position.set(
      cameraOffset.x + offsetX,
      cameraOffset.y + offsetY
    );

    // Apply mask if tileVisibility settings exist (read from scene flags)
    const tileVisibility = canvas.scene?.getFlag(MODULE_ID, 'cloudTopsTileVisibility') || {};
    const hasVisibilitySettings = Object.keys(tileVisibility).length > 0;
    const hasHiddenTiles = Object.values(tileVisibility).some(v => v === false);
    
    // console.log('MapShine | Cloud Tops Masking - hasVisibilitySettings:', hasVisibilitySettings, 'hasHiddenTiles:', hasHiddenTiles);
    
    if (hasVisibilitySettings && hasHiddenTiles) {
      // Create mask sprite if it doesn't exist
      if (!this.maskSprite) {
        console.log('MapShine | Creating mask sprite for cloud tops');
        this.maskSprite = new PIXI.Sprite(this.maskTexture);
        this.maskSprite.anchor.set(0, 0);
        this.addChild(this.maskSprite);
        this.depthSprite.mask = this.maskSprite;
      } else {
        // Update mask texture in case it was regenerated
        this.maskSprite.texture = this.maskTexture;
      }
      
      // CRITICAL: Mask sprite must match depthSprite's transform
      // Both use screen-space textures positioned in world space
      this.maskSprite.position.copyFrom(this.depthSprite.position);
      this.maskSprite.scale.copyFrom(this.depthSprite.scale);
    } else {
      // No visibility restrictions, remove mask
      if (this.maskSprite) {
        console.log('MapShine | Removing mask sprite (no hidden tiles)');
        this.removeChild(this.maskSprite);
        this.maskSprite.destroy();
        this.maskSprite = null;
        this.depthSprite.mask = null;
      }
    }

    // Calculate zoom-based opacity using the same interpolation as OverheadEffectLayer
    const lerp = (a, b, t) => a * (1 - t) + b * t;
    let opacity = 1.0;

    if (currentZoom <= this.zoomPointMin) {
      opacity = this.opacityMinZoom;
    } else if (currentZoom >= this.zoomPointMax) {
      opacity = this.opacityMaxZoom;
    } else if (currentZoom > this.zoomPointMin && currentZoom <= this.zoomPointMid) {
      // Interpolate between min and mid
      const range = this.zoomPointMid - this.zoomPointMin;
      const progress = (currentZoom - this.zoomPointMin) / (range > 0 ? range : 1);
      opacity = lerp(this.opacityMinZoom, this.opacityMidZoom, progress);
    } else {
      // currentZoom > this.zoomPointMid && currentZoom < this.zoomPointMax
      // Interpolate between mid and max
      const range = this.zoomPointMax - this.zoomPointMid;
      const progress = (currentZoom - this.zoomPointMid) / (range > 0 ? range : 1);
      opacity = lerp(this.opacityMidZoom, this.opacityMaxZoom, progress);
    }

    // Apply calculated opacity
    this.depthSprite.alpha = opacity;
    this.depthSprite.visible = opacity > 0.01;

    // Update filter uniforms
    if (this.recolorFilter) {
      const u = this.recolorFilter.uniforms;

      // Parse color (assuming hex format)
      const color = config.color || "#FFFFFF";
      const rgb = this._hexToRgb(color);
      u.u_cloudColor = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
      u.u_threshold = config.threshold ?? 0.3;
      u.u_softness = config.softness ?? 0.2;

      // Update darkness level from scene
      u.u_darkness = canvas.scene?.environment?.darknessLevel ?? 0;

      // Update scene bounds from CoordinateManager
      u.uSceneRectNorm = CoordinateManager.getSceneRectNormalizedArray();

      // === TIME OF DAY INTEGRATION FOR CLOUD TOPS ===
      // Get atmospheric color from TimeOfDayLayer (same as CloudShadowsLayer)
      const timeOfDayLayer = canvas.timeOfDay;
      if (timeOfDayLayer && typeof timeOfDayLayer.getAtmosphericColor === 'function') {
        const atmosColor = timeOfDayLayer.getAtmosphericColor();
        
        // Use the raw interpolated temperature, tint, and exposure values directly
        // This ensures cloud coloration matches the ground and time-of-day filter
        u.u_temperature = atmosColor.temperature ?? 0.0;
        u.u_tint = atmosColor.tint ?? 0.0;
        
        // Apply time-of-day influenced exposure
        // FIXED: Old formula Math.log2(intensity * 0.5 + 0.5) was backwards!
        // - At intensity=1.0 it gave exposure=0.0 (neutral)
        // - At intensity=0.087 it gave exposure=-0.880 (darken!)
        // New formula: Linear mapping where intensity=0.5 → neutral
        const timeExposure = (atmosColor.intensity - 0.5) * 2.0;
        u.u_exposure = timeExposure;
      } else {
        // Fallback to config values if TimeOfDayLayer not available
        u.u_exposure = config.exposure ?? 0.0;
        u.u_temperature = config.temperature ?? 0.0;
        u.u_tint = config.tint ?? 0.0;
      }

      // Full Color Correction Suite (non-time-of-day params)
      u.u_saturation = config.saturation ?? 1.0;
      u.u_brightness = config.brightness ?? 0.0;
      u.u_contrast = config.contrast ?? 1.0;
      u.u_gamma = config.gamma ?? 1.0;
    }
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { 
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  }

  async updateFromConfig(config) {
    const depthConfig = config.cloudShadows.depth;
    this.visible =
      config.enabled && config.cloudShadows.enabled && depthConfig.enabled;

    // Update zoom-based opacity settings from config (matching OverheadEffectLayer pattern)
    this.opacityMinZoom = depthConfig.opacityMinZoom ?? 1.0;
    this.opacityMidZoom = depthConfig.opacityMidZoom ?? 0.0;
    this.opacityMaxZoom = depthConfig.opacityMaxZoom ?? 0.0;
    this.zoomPointMin = depthConfig.zoomPointMin ?? 0.25;
    this.zoomPointMid = depthConfig.zoomPointMid ?? 0.30;
    this.zoomPointMax = depthConfig.zoomPointMax ?? 2.00;
    
    // Flag mask update when config changes
    this._needsMaskUpdate = true;
  }

  _renderVisibilityMask(config) {
    if (!this.maskGraphics || !this.maskTexture) return;

    const renderer = canvas.app.renderer;
    this.maskGraphics.clear();

    // Get camera offset for proper positioning
    const cameraOffset = CoordinateManager.getCameraOffset();
    const currentZoom = CoordinateManager.getCanvasScale();

    // Get tile visibility settings from scene flags (scene-specific data)
    let tileVisibility = canvas.scene?.getFlag(MODULE_ID, 'cloudTopsTileVisibility') || {};
    
    // MIGRATION: Clean up nested structures from old bug (Foundry's setFlag created nested objects)
    // Convert { "path": { "webp": false } } to { "path::webp": false }
    const needsMigration = Object.values(tileVisibility).some(v => typeof v === 'object' && v !== null);
    if (needsMigration) {
      console.log('MapShine | Migrating old nested tile visibility data');
      const migratedData = {};
      for (const [key, value] of Object.entries(tileVisibility)) {
        if (typeof value === 'object' && value !== null) {
          // Nested structure - flatten it
          for (const [subKey, subValue] of Object.entries(value)) {
            migratedData[`${key}::${subKey}`] = subValue;
          }
        } else {
          // Already flat
          migratedData[key] = value;
        }
      }
      tileVisibility = migratedData;
      // Save the cleaned data back
      canvas.scene?.setFlag(MODULE_ID, 'cloudTopsTileVisibility', migratedData);
    }
    
    // console.log('MapShine | Cloud Tops Mask - tileVisibility:', tileVisibility);

    // INVERTED MASK LOGIC:
    // Start with a WHITE (fully visible) canvas - clouds show everywhere by default
    this.maskGraphics.beginFill(0xFFFFFF, 1);
    this.maskGraphics.drawRect(0, 0, renderer.screen.width, renderer.screen.height);
    this.maskGraphics.endFill();

    // Draw BLACK rectangles where cloud tops should be HIDDEN (unchecked tiles)
    this.maskGraphics.beginFill(0x000000, 1);

    // Check all tiles and hide clouds on unchecked ones
    if (canvas.tiles) {
      for (const tile of canvas.tiles.placeables) {
        const tilePath = tile.document.texture.src;
        // CRITICAL: Escape dots to match the escaped keys we saved
        const escapedPath = tilePath.replace(/\./g, '::');
        const isVisible = tileVisibility[escapedPath] !== false; // Default to visible

        if (!isVisible) { // INVERTED: Draw black for HIDDEN tiles
          // Convert world coordinates to screen coordinates
          const screenX = (tile.document.x - cameraOffset.x) * currentZoom;
          const screenY = (tile.document.y - cameraOffset.y) * currentZoom;
          const screenWidth = tile.document.width * currentZoom;
          const screenHeight = tile.document.height * currentZoom;

          console.log(`MapShine | Masking tile at (${screenX}, ${screenY}) size ${screenWidth}x${screenHeight}`);
          this.maskGraphics.drawRect(screenX, screenY, screenWidth, screenHeight);
        }
      }
    }

    this.maskGraphics.endFill();

    // Render the graphics to the mask texture
    renderer.render(this.maskGraphics, { renderTexture: this.maskTexture, clear: true });
  }

  _onResize() {
    // Will be handled in _onAnimate
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

/**
 * CloudShadowsFilterEnhanced - Enhanced FBM cloud filter with weather and time of day integration
 * 
 * This filter generates realistic clouds using Fractional Brownian Motion (FBM) with domain warping,
 * integrating with weather states (clear, drizzle, rain, storm, snow, blizzard, sleet) and time of day
 * for dynamic cloud appearance, movement, and coloring.
 * 
 * @module {CloudShadowsFilterEnhanced} map-shine
 * @author Garsondee
 * @version 1.8.0
 */

export class CloudShadowsFilterEnhanced extends PIXI.Filter {
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
      uniform sampler2D uOutdoorsMask;
      uniform sampler2D uLightPolygonMask;

      // World & Camera
      uniform float u_time;
      uniform vec2 u_camera_offset;
      uniform vec2 u_view_size;
      uniform vec2 u_windDirection;
      uniform vec4 uSceneRectNorm;

      // Weather Integration (NEW)
      uniform float u_weatherDensity;       // Cloud density multiplier (0-1)
      uniform float u_weatherCoverage;      // Cloud coverage threshold adjustment (0-1)
      uniform float u_weatherBrightness;    // Weather-based brightness adjustment
      uniform float u_weatherDarkness;      // Weather-based darkness/shadow intensity
      uniform float u_gustStrength;         // Wind gust strength for turbulence (0-1)

      // Time of Day Integration (NEW)
      uniform vec3 u_timeOfDayTint;         // RGB color tint from time of day
      uniform float u_timeOfDayIntensity;   // Strength of time of day coloring (0-1)

      // Noise & Shading (Base Controls)
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
      uniform bool u_outputRawCloud;

      // Light Occlusion
      uniform bool u_occlusionEnabled;
      uniform float u_occlusionIntensity;

      // Layer Configuration (6 layers + evolution)
      uniform bool u_layer1_enabled;
      uniform float u_layer1_scale;
      uniform float u_layer1_speed;
      uniform vec2 u_layer1_stretch;
      uniform int u_layer1_octaves;
      uniform float u_layer1_opacity;
      uniform float u_layer1_parallaxDepth;

      uniform bool u_layer2_enabled;
      uniform float u_layer2_scale;
      uniform float u_layer2_speed;
      uniform vec2 u_layer2_stretch;
      uniform int u_layer2_octaves;
      uniform float u_layer2_opacity;
      uniform float u_layer2_parallaxDepth;

      uniform bool u_layer3_enabled;
      uniform float u_layer3_scale;
      uniform float u_layer3_speed;
      uniform vec2 u_layer3_stretch;
      uniform int u_layer3_octaves;
      uniform float u_layer3_opacity;
      uniform float u_layer3_parallaxDepth;

      uniform bool u_layer4_enabled;
      uniform float u_layer4_scale;
      uniform float u_layer4_speed;
      uniform vec2 u_layer4_stretch;
      uniform int u_layer4_octaves;
      uniform float u_layer4_opacity;
      uniform float u_layer4_parallaxDepth;

      uniform bool u_layer5_enabled;
      uniform float u_layer5_scale;
      uniform float u_layer5_speed;
      uniform vec2 u_layer5_stretch;
      uniform int u_layer5_octaves;
      uniform float u_layer5_opacity;
      uniform float u_layer5_parallaxDepth;

      uniform bool u_layer6_enabled;
      uniform float u_layer6_scale;
      uniform float u_layer6_speed;
      uniform vec2 u_layer6_stretch;
      uniform int u_layer6_octaves;
      uniform float u_layer6_opacity;
      uniform float u_layer6_parallaxDepth;
      uniform float u_layer6_warpStrength;
      uniform float u_layer6_warpScale;
      uniform bool u_layer6_additive;

      // Evolution (shape morphing over time)
      uniform float u_evolutionSpeed;

      // === NOISE FUNCTIONS ===
      float random(vec2 st) { 
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); 
      }
      
      float random3d(vec3 st) { 
        return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123); 
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
      
      float noise3d(vec3 st) {
        vec3 i = floor(st); 
        vec3 f = fract(st);
        // 8 corners of a cube
        float a = random3d(i);
        float b = random3d(i + vec3(1.0, 0.0, 0.0));
        float c = random3d(i + vec3(0.0, 1.0, 0.0));
        float d = random3d(i + vec3(1.0, 1.0, 0.0));
        float e = random3d(i + vec3(0.0, 0.0, 1.0));
        float f2 = random3d(i + vec3(1.0, 0.0, 1.0));
        float g = random3d(i + vec3(0.0, 1.0, 1.0));
        float h = random3d(i + vec3(1.0, 1.0, 1.0));
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
          mix(mix(e, f2, u.x), mix(g, h, u.x), u.y), 
          u.z
        );
      }

      // === CORE FBM FUNCTION ===
      float fbm3d(vec3 st, int octaves, float persistence, float lacunarity) {
        float value = 0.0; 
        float amplitude = 0.5;
        for (int i = 0; i < 10; i++) {
          if (i >= octaves) break;
          value += amplitude * noise3d(st);
          st *= lacunarity;
          amplitude *= persistence;
        }
        return value;
      }

      // === DOMAIN-WARPED FBM (with gust turbulence) ===
      // This is the enhanced cloud generation function with domain warping for realistic turbulence
      float cloudFBM(vec3 position, int octaves, float persistence, float lacunarity) {
        // Apply gust-based domain warping for increased turbulence during high winds
        float warpScale = 0.5 + u_gustStrength * 1.5;  // Scale warping with gusts
        vec3 warpOffset = vec3(
          fbm3d(position * warpScale, 3, 0.5, 2.0),
          fbm3d(position * warpScale + vec3(5.2, 1.3, 0.0), 3, 0.5, 2.0),
          fbm3d(position * warpScale + vec3(0.0, 5.2, 1.3), 3, 0.5, 2.0)
        ) * 0.3 * (0.5 + u_gustStrength * 0.5);  // Warp strength increases with gusts
        
        vec3 warpedPosition = position + warpOffset;
        return fbm3d(warpedPosition, octaves, persistence, lacunarity);
      }

      // === SHADING CONTROLS (with weather modulation) ===
      float applyShadingControls(float value) {
        // Apply weather-based brightness adjustment
        value += u_shading_brightness + (u_weatherBrightness - 1.0) * 0.3;
        
        // Apply contrast
        value = (value - 0.5) * u_shading_contrast + 0.5;
        
        // Apply weather-modified threshold (coverage control)
        float adjustedThreshold = u_shading_threshold * (1.0 - u_weatherCoverage * 0.3);
        value = smoothstep(adjustedThreshold, adjustedThreshold + u_shading_softness, value);
        
        // Apply gamma correction
        if (u_shading_gamma > 0.0) { 
          value = pow(value, u_shading_gamma); 
        }
        
        // Apply weather density modulation
        value *= u_weatherDensity;
        
        return clamp(value, 0.0, 1.0);
      }

      void main() {
        // === SCENE BOUNDS CHECK ===
        vec2 sceneMin = uSceneRectNorm.xy;
        vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
        if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x ||
            vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
          return;
        }

        // === MASK SAMPLING ===
        float maskValue = texture2D(uOutdoorsMask, vTextureCoord).r;
        if (maskValue < 0.01 && !u_outputRawCloud) {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
          return;
        }

        // === CLOUD GENERATION ===
        float shadedCloudValue = 0.0;
        {
          // Calculate world position (unaffected by zoom)
          vec2 canvasScreenCoord = vScreenCoord * u_view_size;
          vec2 worldCoord = canvasScreenCoord + u_camera_offset;
          vec2 corrected_coord = worldCoord;

          // Evolution Z-coordinate for 3D morphing
          float evolutionZ = u_time * u_evolutionSpeed;

          // Multiplicative layer blending (shadow accumulation)
          float shadow = 1.0;

          // === LAYER 1: High Altitude (Fast, Large, Wispy) ===
          if (u_layer1_enabled) {
            vec2 parallax_offset1 = u_camera_offset * u_layer1_parallaxDepth * 0.001;
            vec2 layer1_coord = corrected_coord + parallax_offset1;
            vec2 layer1_uv = (layer1_coord / 100.0 * u_noise_scale) * u_layer1_scale * u_layer1_stretch;
            layer1_uv += u_time * u_windDirection * u_layer1_speed;
            
            float layer1_raw = cloudFBM(vec3(layer1_uv, evolutionZ), u_layer1_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer1_value = applyShadingControls(layer1_raw);
            shadow *= (1.0 - layer1_value * u_layer1_opacity);
          }

          // === LAYER 2: Mid Altitude (Medium Speed/Scale) ===
          if (u_layer2_enabled) {
            vec2 parallax_offset2 = u_camera_offset * u_layer2_parallaxDepth * 0.001;
            vec2 layer2_coord = corrected_coord + parallax_offset2;
            vec2 layer2_uv = (layer2_coord / 100.0 * u_noise_scale) * u_layer2_scale * u_layer2_stretch;
            layer2_uv += u_time * u_windDirection * u_layer2_speed;
            
            float layer2_raw = cloudFBM(vec3(layer2_uv, evolutionZ * 0.8), u_layer2_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer2_value = applyShadingControls(layer2_raw);
            shadow *= (1.0 - layer2_value * u_layer2_opacity);
          }

          // === LAYER 3: Low Altitude (Slow, Small, Dense) ===
          if (u_layer3_enabled) {
            vec2 parallax_offset3 = u_camera_offset * u_layer3_parallaxDepth * 0.001;
            vec2 layer3_coord = corrected_coord + parallax_offset3;
            vec2 layer3_uv = (layer3_coord / 100.0 * u_noise_scale) * u_layer3_scale * u_layer3_stretch;
            layer3_uv += u_time * u_windDirection * u_layer3_speed;
            
            float layer3_raw = cloudFBM(vec3(layer3_uv, evolutionZ * 0.6), u_layer3_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer3_value = applyShadingControls(layer3_raw);
            shadow *= (1.0 - layer3_value * u_layer3_opacity);
          }

          // === LAYER 4: Extra Altitude ===
          if (u_layer4_enabled) {
            vec2 parallax_offset4 = u_camera_offset * u_layer4_parallaxDepth * 0.001;
            vec2 layer4_coord = corrected_coord + parallax_offset4;
            vec2 layer4_uv = (layer4_coord / 100.0 * u_noise_scale) * u_layer4_scale * u_layer4_stretch;
            layer4_uv += u_time * u_windDirection * u_layer4_speed;
            
            float layer4_raw = cloudFBM(vec3(layer4_uv, evolutionZ * 0.4), u_layer4_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer4_value = applyShadingControls(layer4_raw);
            shadow *= (1.0 - layer4_value * u_layer4_opacity);
          }

          // === LAYER 5: Extra Altitude ===
          if (u_layer5_enabled) {
            vec2 parallax_offset5 = u_camera_offset * u_layer5_parallaxDepth * 0.001;
            vec2 layer5_coord = corrected_coord + parallax_offset5;
            vec2 layer5_uv = (layer5_coord / 100.0 * u_noise_scale) * u_layer5_scale * u_layer5_stretch;
            layer5_uv += u_time * u_windDirection * u_layer5_speed;
            
            float layer5_raw = cloudFBM(vec3(layer5_uv, evolutionZ * 0.2), u_layer5_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer5_value = applyShadingControls(layer5_raw);
            shadow *= (1.0 - layer5_value * u_layer5_opacity);
          }

          // Convert shadow (light transmission) to cloud value
          shadedCloudValue = 1.0 - shadow;

          // === LAYER 6: Wispy Domain-Warped Edges (Additive) ===
          if (u_layer6_enabled && !u_outputRawCloud) {
            vec2 parallax_offset6 = u_camera_offset * u_layer6_parallaxDepth * 0.001;
            vec2 layer6_coord = corrected_coord + parallax_offset6;
            vec2 layer6_base_uv = (layer6_coord / 100.0 * u_noise_scale) * u_layer6_scale * u_layer6_stretch;
            layer6_base_uv += u_time * u_windDirection * u_layer6_speed;

            // Domain warping for turbulent wispy edges
            vec2 warp_uv = layer6_base_uv * u_layer6_warpScale;
            float warp_x = fbm3d(vec3(warp_uv, evolutionZ * 1.3), 4, u_noise_persistence, u_noise_lacunarity);
            float warp_y = fbm3d(vec3(warp_uv + vec2(5.2, 1.3), evolutionZ * 1.3), 4, u_noise_persistence, u_noise_lacunarity);
            vec2 warped_uv = layer6_base_uv + vec2(warp_x, warp_y) * u_layer6_warpStrength;

            float layer6_raw = fbm3d(vec3(warped_uv, evolutionZ * 0.15), u_layer6_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer6_value = applyShadingControls(layer6_raw);

            if (u_layer6_additive) {
              shadedCloudValue = clamp(shadedCloudValue + layer6_value * u_layer6_opacity, 0.0, 1.0);
            } else {
              shadedCloudValue = clamp(shadedCloudValue * (1.0 - layer6_value * u_layer6_opacity), 0.0, 1.0);
            }
          }
        }

        // === RAW CLOUD OUTPUT (for texture generation) ===
        if (u_outputRawCloud) {
          gl_FragColor = vec4(vec3(shadedCloudValue), 1.0);
          return;
        }

        // === FINAL COMPOSITING ===
        vec4 originalColor = texture2D(uSampler, vTextureCoord);
        if (maskValue < 0.01) {
          gl_FragColor = originalColor;
          return;
        }

        // Calculate shadow amount with weather darkness modulation
        float shadowAmount = shadedCloudValue * maskValue * u_shadowIntensity * u_weatherDarkness;

        // Light occlusion (lights cut through clouds)
        if (u_occlusionEnabled) {
          float lightMaskValue = texture2D(uLightPolygonMask, vScreenCoord).r;
          shadowAmount *= (1.0 - lightMaskValue * u_occlusionIntensity);
        }

        shadowAmount = clamp(shadowAmount, 0.0, 1.0);
        
        // Apply shadow darkening
        vec3 finalColor = originalColor.rgb * (1.0 - shadowAmount);
        
        // === TIME OF DAY TINTING (Applied to cloud shadows) ===
        // Blend time of day color into the shadowed areas
        if (u_timeOfDayIntensity > 0.0) {
          vec3 tintedShadow = mix(vec3(0.0), u_timeOfDayTint, u_timeOfDayIntensity);
          finalColor = mix(finalColor, finalColor * (1.0 + tintedShadow * shadowAmount), shadowAmount);
        }
        
        gl_FragColor = vec4(finalColor, originalColor.a);
      }
    `;

    // Initialize shader with uniforms
    super(vertexSrc, fragmentSrc, {
      uOutdoorsMask: PIXI.Texture.EMPTY,
      uLightPolygonMask: PIXI.Texture.EMPTY,

      // World & Camera
      u_time: 0.0,
      u_camera_offset: [0, 0],
      u_view_size: [0, 0],
      uSceneRectNorm: [0, 0, 1, 1],
      u_windDirection: [0.01, 0.01],

      // Weather Integration (NEW)
      u_weatherDensity: 0.5,
      u_weatherCoverage: 0.5,
      u_weatherBrightness: 1.0,
      u_weatherDarkness: 0.5,
      u_gustStrength: 0.0,

      // Time of Day Integration (NEW)
      u_timeOfDayTint: [1.0, 1.0, 1.0],
      u_timeOfDayIntensity: 0.0,

      // Noise & Shading
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
      u_outputRawCloud: false,

      // Light Occlusion
      u_occlusionEnabled: true,
      u_occlusionIntensity: 1.0,

      // Layer 1: High altitude
      u_layer1_enabled: true,
      u_layer1_scale: 4.0,
      u_layer1_speed: 2.5,
      u_layer1_stretch: [1.0, 1.0],
      u_layer1_octaves: 3,
      u_layer1_opacity: 0.3,
      u_layer1_parallaxDepth: 0.1,

      // Layer 2: Mid altitude
      u_layer2_enabled: true,
      u_layer2_scale: 1.5,
      u_layer2_speed: 1.3,
      u_layer2_stretch: [1.0, 1.0],
      u_layer2_octaves: 5,
      u_layer2_opacity: 0.5,
      u_layer2_parallaxDepth: 0.3,

      // Layer 3: Low altitude
      u_layer3_enabled: true,
      u_layer3_scale: 0.7,
      u_layer3_speed: 0.7,
      u_layer3_stretch: [1.0, 1.0],
      u_layer3_octaves: 6,
      u_layer3_opacity: 0.6,
      u_layer3_parallaxDepth: 0.5,

      // Layer 4: Extra altitude
      u_layer4_enabled: true,
      u_layer4_scale: 2.5,
      u_layer4_speed: 1.8,
      u_layer4_stretch: [1.0, 1.0],
      u_layer4_octaves: 4,
      u_layer4_opacity: 0.4,
      u_layer4_parallaxDepth: 0.2,

      // Layer 5: Extra altitude
      u_layer5_enabled: true,
      u_layer5_scale: 5.0,
      u_layer5_speed: 3.0,
      u_layer5_stretch: [1.0, 1.0],
      u_layer5_octaves: 2,
      u_layer5_opacity: 0.2,
      u_layer5_parallaxDepth: 0.15,

      // Layer 6: Wispy domain-warped edges
      u_layer6_enabled: true,
      u_layer6_scale: 1.2,
      u_layer6_speed: 4.5,
      u_layer6_stretch: [1.5, 1.0],
      u_layer6_octaves: 7,
      u_layer6_opacity: 0.15,
      u_layer6_parallaxDepth: 0.0,
      u_layer6_warpStrength: 0.3,
      u_layer6_warpScale: 2.5,
      u_layer6_additive: true,

      // Evolution
      u_evolutionSpeed: 0.001,
    });
  }
}

const CloudShadowsFilter = CloudShadowsFilterEnhanced;
