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
    console.log(`MapShine | WeatherEffectLayer: Playing ${effectType}`, config);
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
    console.log(`MapShine | WeatherEffectLayer: Stopped ${effectType}`);
  }

  /**
   * Stop all weather effects
   */
  stopAllEffects() {
    for (const [type, effect] of this.effects.entries()) {
      effect.stop();
    }
    console.log('MapShine | WeatherEffectLayer: Stopped all effects');
  }

  /**
   * Update _Outdoors masking for all weather effects
   * This ensures weather only renders in outdoor areas
   * @private
   */
  _updateOutdoorMasking() {
    // Get the _Outdoors mask from ResourceManager
    const resourceManager = game.mapShine?.resourceManager;
    if (!resourceManager) {
      console.warn('MapShine | WeatherEffectLayer: ResourceManager not available for outdoor masking');
      return;
    }

    const outdoorsMask = resourceManager.getOutdoorsMask();
    if (!outdoorsMask || !outdoorsMask.valid) {
      console.log('MapShine | WeatherEffectLayer: _Outdoors mask not available, weather will render everywhere');
      
      // Disable terrain masking for all effects
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

    console.log('MapShine | WeatherEffectLayer: Configured _Outdoors masking for all effects');
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

    console.log(`MapShine | WeatherEffectLayer: Configured masking for ${effectType}`, maskConfig);
  }

  /**
   * Update the layer each frame
   * Called by the animation ticker
   */
  update() {
    // Update outdoor masking each frame to handle camera movement
    this._updateOutdoorMasking();
  }

  /**
   * Update from configuration object
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

    // Determine which effect(s) to play based on weather state
    const state = config.weather.currentState;
    
    switch (state) {
      case 'clear':
        // No weather effects
        break;
      
      case 'drizzle':
        this.playEffect('rain', {
          opacity: 0.15,
          intensity: 0.6,
          strength: 0.8
        });
        break;
      
      case 'rain':
        this.playEffect('rain', {
          opacity: 0.25,
          intensity: 1.0,
          strength: 1.0
        });
        break;
      
      case 'storm':
        this.playEffect('rain', {
          opacity: 0.45,
          intensity: 1.5,
          strength: 1.5,
          rotation: 0.5236
        });
        this.playEffect('fog', {
          slope: 1.5,
          intensity: 0.05,
          speed: -55.0
        });
        break;
      
      case 'snow':
        this.playEffect('snow', {
          direction: 0.5,
          speed: 2,
          scale: 2.5
        });
        break;
      
      case 'blizzard':
        this.playEffect('snow', {
          direction: 0.80,
          speed: 8,
          scale: 2.5
        });
        this.playEffect('fog', {
          slope: 1.0,
          intensity: 0.15,
          speed: -4.0
        });
        break;
      
      case 'sleet':
        // Mix of rain and snow
        this.playEffect('rain', {
          opacity: 0.15,
          intensity: 0.8
        });
        this.playEffect('snow', {
          direction: 0.7,
          speed: 3,
          scale: 2.0
        });
        break;
    }

    console.log(`MapShine | WeatherEffectLayer: Updated for state '${state}'`);
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
