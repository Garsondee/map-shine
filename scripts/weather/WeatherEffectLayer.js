/**
 * Canvas layer for displaying shader-based weather effects
 * Manages multiple weather shader effects simultaneously
 * Based on Foundry VTT's WeatherEffects layer architecture
 */
import { WeatherShaderEffect } from './WeatherShaderEffect.js';
import { RainShader } from './RainShader.js';
import { SnowShader } from './SnowShader.js';
import { FogShader } from './FogShader.js';

export class WeatherEffectLayer extends PIXI.Container {
  constructor() {
    super();
    
    // Container for weather effects
    this.weatherEffects = new PIXI.Container();
    this.addChild(this.weatherEffects);
    
    // Active weather effects map
    this.effects = new Map();
    
    // Layer properties
    this.sortableChildren = true;
    this.eventMode = "none";
    
    // State tracking to prevent log spam
    this._lastLoggedState = null;
    this._outdoorMaskingWarned = false;
    
    console.log('MapShine | WeatherEffectLayer initialized');
  }

  /**
   * Initialize the layer
   */
  async initialize() {
    console.log('MapShine | WeatherEffectLayer: Initializing...');
    
    // Create effect instances but don't play them yet
    this._createEffectInstances();
    
    // Configure outdoor masking for all effects
    this._updateOutdoorMasking();
    
    return this;
  }

  /**
   * Create instances of weather effects
   * @private
   */
  _createEffectInstances() {
    // Create rain effect
    const rainEffect = new WeatherShaderEffect({
      opacity: 0.25,
      tint: [0.7, 0.9, 1.0],
      intensity: 1,
      strength: 1,
      rotation: 0.2618,
      speed: 0.2
    }, RainShader);
    rainEffect.blendMode = PIXI.BLEND_MODES.SCREEN;
    rainEffect.zIndex = 0;
    this.weatherEffects.addChild(rainEffect);
    this.effects.set('rain', rainEffect);

    // Create snow effect
    const snowEffect = new WeatherShaderEffect({
      tint: [0.85, 0.95, 1],
      direction: 0.5,
      speed: 2,
      scale: 2.5
    }, SnowShader);
    snowEffect.blendMode = PIXI.BLEND_MODES.SCREEN;
    snowEffect.zIndex = 1;
    this.weatherEffects.addChild(snowEffect);
    this.effects.set('snow', snowEffect);

    // Create fog effect
    const fogEffect = new WeatherShaderEffect({
      slope: 0.45,
      intensity: 0.4,
      speed: 0.4
    }, FogShader);
    fogEffect.blendMode = PIXI.BLEND_MODES.SCREEN;
    fogEffect.zIndex = 2;
    this.weatherEffects.addChild(fogEffect);
    this.effects.set('fog', fogEffect);

    console.log('MapShine | WeatherEffectLayer: Created effect instances', {
      rain: rainEffect,
      snow: snowEffect,
      fog: fogEffect
    });
  }

  /**
   * Configure and play a weather effect
   * @param {string} effectType - Type of effect ('rain', 'snow', 'fog')
   * @param {object} config - Configuration for the effect
   */
  playEffect(effectType, config = {}) {
    const effect = this.effects.get(effectType);
    if (!effect) {
      console.warn(`MapShine | WeatherEffectLayer: Unknown effect type '${effectType}'`);
      return;
    }

    // Update outdoor masking before playing
    this._updateOutdoorMasking();

    effect.configure(config);
    effect.play();
    // ⚠️ Logging removed - called too frequently during transitions
  }

  /**
   * Stop a weather effect
   * @param {string} effectType - Type of effect to stop
   */
  stopEffect(effectType) {
    const effect = this.effects.get(effectType);
    if (!effect) {
      console.warn(`MapShine | WeatherEffectLayer: Unknown effect type '${effectType}'`);
      return;
    }

    effect.stop();
    // ⚠️ Logging removed - called too frequently during transitions
  }

  /**
   * Stop all weather effects
   * 
   * ⚠️ WARNING: Can be called frequently during transitions - minimize logging!
   */
  stopAllEffects() {
    for (const [type, effect] of this.effects.entries()) {
      effect.stop();
    }
    // ⚠️ Logging removed - called too frequently during state changes
  }

  /**
   * Update _Outdoors masking for all weather effects
   * This ensures weather only renders in outdoor areas
   * 
   * ⚠️ WARNING: DO NOT ADD CONSOLE.LOG HERE - THIS RUNS EVERY FRAME!
   * 
   * @private
   */
  _updateOutdoorMasking() {
    // Get the _Outdoors mask from ResourceManager
    const resourceManager = game.mapShine?.resourceManager;
    if (!resourceManager) {
      // Only warn once, not every frame
      if (!this._outdoorMaskingWarned) {
        console.warn('MapShine | WeatherEffectLayer: ResourceManager not available for outdoor masking');
        this._outdoorMaskingWarned = true;
      }
      return;
    }

    const outdoorsMask = resourceManager.getOutdoorsMask();
    if (!outdoorsMask || !outdoorsMask.valid) {
      // Disable terrain masking for all effects (silently)
      for (const [type, effect] of this.effects.entries()) {
        effect.shader.uniforms.useTerrain = false;
      }
      return;
    }

    // Compute the terrain UV matrix to align the _Outdoors mask with world space
    const terrainUvMatrix = this._computeTerrainUvMatrix(outdoorsMask);

    // Configure all effects with the _Outdoors mask
    for (const [type, effect] of this.effects.entries()) {
      const shader = effect.shader;
      shader.uniforms.useTerrain = true;
      shader.uniforms.terrainTexture = outdoorsMask;
      shader.uniforms.terrainUvMatrix = terrainUvMatrix;
      shader.uniforms.reverseTerrain = false; // White = outdoors = show weather
      shader.uniforms.terrainWeights = [1, 0, 0, 0]; // Sample red channel
    }

    // ⚠️ DO NOT LOG HERE - THIS RUNS EVERY FRAME!
  }

  /**
   * Compute the terrain UV matrix to map vertex coordinates to the _Outdoors mask texture
   * The mask texture is in screen space, so we need to transform from normalized scene
   * coordinates (0-1 within the scene) to normalized screen coordinates (0-1 within the screen).
   * @param {PIXI.RenderTexture} maskTexture - The _Outdoors mask texture (screen-space)
   * @returns {PIXI.Matrix} The terrain UV transformation matrix
   * @private
   */
  _computeTerrainUvMatrix(maskTexture) {
    const matrix = new PIXI.Matrix();
    
    const sceneRect = canvas.scene?.dimensions?.sceneRect;
    const stage = canvas.stage;
    const screen = canvas.app?.renderer?.screen;
    
    if (!sceneRect || !stage || !screen) {
      console.warn('MapShine | WeatherEffectLayer: Scene or stage not available for terrain UV matrix');
      return matrix;
    }

    if (maskTexture.width === 0 || maskTexture.height === 0 || screen.width === 0 || screen.height === 0) {
      console.warn('MapShine | WeatherEffectLayer: Invalid dimensions for terrain UV matrix');
      return matrix;
    }

    // The vertex positions (aVertexPosition) are normalized 0-1 within the quad
    // The quad is positioned at (sceneRect.x, sceneRect.y) with size (sceneRect.width, sceneRect.height)
    // We need to transform from normalized scene coords to normalized screen coords
    
    // Step 1: Scale from normalized (0-1) to scene pixel dimensions
    matrix.scale(sceneRect.width, sceneRect.height);
    
    // Step 2: Translate to scene position in world space
    matrix.translate(sceneRect.x, sceneRect.y);
    
    // Step 3: Apply stage transform to get screen pixel coordinates
    matrix.prepend(stage.transform.worldTransform);
    
    // Step 4: Normalize to 0-1 screen UVs
    matrix.scale(1.0 / screen.width, 1.0 / screen.height);
    
    return matrix;
  }

  /**
   * Configure terrain/occlusion masking for an effect
   * @param {string} effectType - Type of effect
   * @param {object} maskConfig - Masking configuration
   */
  configureMasking(effectType, maskConfig = {}) {
    const effect = this.effects.get(effectType);
    if (!effect) return;

    const shader = effect.shader;
    
    // Configure occlusion mask
    if (maskConfig.useOcclusion !== undefined) {
      shader.uniforms.useOcclusion = maskConfig.useOcclusion;
      if (maskConfig.useOcclusion && canvas.masks?.depth) {
        shader.uniforms.occlusionTexture = canvas.masks.depth.renderTexture;
        shader.uniforms.depthElevation = canvas.masks.depth.mapElevation(Infinity);
      }
    }

    // Configure terrain mask (e.g., _Outdoors mask)
    if (maskConfig.useTerrain !== undefined) {
      shader.uniforms.useTerrain = maskConfig.useTerrain;
      if (maskConfig.terrainTexture) {
        shader.uniforms.terrainTexture = maskConfig.terrainTexture;
      }
    }

    // Logging kept for manual masking configuration (rarely called)
    console.log(`MapShine | WeatherEffectLayer: Configured masking for ${effectType}`, maskConfig);
  }

  /**
   * Update the layer each frame
   * Called by the animation ticker
   * 
   * ⚠️ WARNING: THIS RUNS EVERY FRAME - DO NOT ADD CONSOLE.LOG HERE!
   */
  update() {
    // Update outdoor masking each frame to handle camera movement
    this._updateOutdoorMasking();
  }

  /**
   * Update from configuration object
   * 
   * ⚠️ WARNING: Can be called multiple times during transitions - minimize logging!
   * 
   * @param {object} config - Weather configuration from profile
   */
  updateFromConfig(config) {
    if (!config?.weather?.enabled) {
      this.stopAllEffects();
      return;
    }

    // Update outdoor masking
    this._updateOutdoorMasking();

    // Stop all effects first
    this.stopAllEffects();

    // Get shader configurations from profile config
    const weatherConfig = config.weather;
    const rainConfig = {
      opacity: weatherConfig.rain.opacity,
      intensity: weatherConfig.rain.intensity,
      strength: weatherConfig.rain.strength,
      rotation: weatherConfig.rain.rotation,
      resolution: [
        weatherConfig.rain.resolution.x,
        weatherConfig.rain.resolution.y
      ],
      speed: weatherConfig.rain.speed,
      tint: [
        weatherConfig.rain.tint.r,
        weatherConfig.rain.tint.g,
        weatherConfig.rain.tint.b
      ]
    };
    
    const snowConfig = {
      direction: weatherConfig.snow.direction,
      speed: weatherConfig.snow.speed,
      scale: weatherConfig.snow.scale,
      tint: [
        weatherConfig.snow.tint.r,
        weatherConfig.snow.tint.g,
        weatherConfig.snow.tint.b
      ]
    };
    
    const fogConfig = {
      intensity: weatherConfig.fog.intensity,
      rotation: weatherConfig.fog.rotation,
      slope: weatherConfig.fog.slope,
      speed: weatherConfig.fog.speed,
      tint: [
        weatherConfig.fog.tint.r,
        weatherConfig.fog.tint.g,
        weatherConfig.fog.tint.b
      ]
    };

    // Determine which effect(s) to play based on weather state
    const state = config.weather.currentState;
    
    switch (state) {
      case 'clear':
        // No weather effects
        break;
      
      case 'drizzle':
        this.playEffect('rain', {
          ...rainConfig,
          opacity: rainConfig.opacity * 0.6, // Reduced opacity for drizzle
          intensity: rainConfig.intensity * 0.6,
          strength: rainConfig.strength * 0.8
        });
        break;
      
      case 'rain':
        this.playEffect('rain', rainConfig);
        break;
      
      case 'storm':
        this.playEffect('rain', {
          ...rainConfig,
          opacity: rainConfig.opacity * 1.8,
          intensity: rainConfig.intensity * 1.5,
          strength: rainConfig.strength * 1.5
          // Note: rotation is now controlled by WindManager
        });
        this.playEffect('fog', {
          ...fogConfig,
          slope: fogConfig.slope * 3.3,
          intensity: fogConfig.intensity * 0.33,
          speed: fogConfig.speed * 13.75
        });
        break;
      
      case 'snow':
        this.playEffect('snow', snowConfig);
        break;
      
      case 'blizzard':
        this.playEffect('snow', {
          ...snowConfig,
          direction: snowConfig.direction * 1.6,
          speed: snowConfig.speed * 4
        });
        this.playEffect('fog', {
          ...fogConfig,
          slope: fogConfig.slope * 2.2,
          intensity: fogConfig.intensity,
          speed: fogConfig.speed
        });
        break;
      
      case 'sleet':
        // Mix of rain and snow
        this.playEffect('rain', {
          ...rainConfig,
          opacity: rainConfig.opacity * 0.6,
          intensity: rainConfig.intensity * 0.8
        });
        this.playEffect('snow', {
          ...snowConfig,
          direction: snowConfig.direction * 1.4,
          speed: snowConfig.speed * 1.5,
          scale: snowConfig.scale * 0.8
        });
        break;
    }

    // ⚠️ Logging removed - called too frequently during transitions and frame updates
    // Only log on actual state changes if needed
    if (this._lastLoggedState !== state) {
      console.log(`MapShine | WeatherEffectLayer: Weather state changed to '${state}'`);
      this._lastLoggedState = state;
    }
  }

  /**
   * Destroy the layer and all effects
   */
  destroy(options) {
    // Destroy all effects
    for (const [type, effect] of this.effects.entries()) {
      effect.destroy();
    }
    this.effects.clear();
    
    super.destroy(options);
    console.log('MapShine | WeatherEffectLayer: Destroyed');
  }
}
