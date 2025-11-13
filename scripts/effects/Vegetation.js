import { PIXI, Filter } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { AnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";
import { cleanFilterArray, safeApplyFilters } from "../utils/filter-utils.js";

class FoliageDistortionFilter extends PIXI.Filter {
  constructor(options = {}) {
    const fragmentSrc = `
      precision mediump float;
      varying vec2 vTextureCoord;
      
      uniform sampler2D uSampler;
      uniform float u_time;
      uniform vec2 u_windDirection;
      uniform float u_windStrength;
      
      // World-space coordinate uniforms - tile position
      uniform vec2 u_tileWorldPos;
      uniform vec2 u_tileWorldSize;
      
      // Rustle layer (small-scale, constant)
      uniform float u_rustleScale;
      uniform float u_rustleSpeed;
      uniform float u_rustleFrequency;
      uniform float u_rustleIntensity;
      
      // Sway layer (large-scale, wind-driven)
      uniform float u_swayScale;
      uniform float u_swaySpeed;
      uniform float u_swayFrequency;
      uniform float u_swayIntensity;
      uniform float u_swayWindMultiplier;
      
      // Mixing
      uniform float u_perpendicularMix;
      
      // Fast value noise
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      float value_noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f); // Smoothstep
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      
      // Asymmetric easing for spring-like motion
      // Creates fast push (wind force) and slower spring-back (recovery)
      float applySpringMotion(float noise) {
        // Convert noise [0,1] to phase [-1,1] centered at 0
        float phase = (noise - 0.5) * 2.0;
        
        // Asymmetric smoothstep: fast push (positive), gentle return (negative)
        if (phase > 0.0) {
          // Wind push: steep curve (aggressive acceleration)
          float t = phase;
          return smoothstep(0.0, 1.0, t) * 0.7; // 70% max displacement
        } else {
          // Spring return: gentle curve with overshoot damping
          float t = -phase;
          float overshoot = 1.0 + (0.15 * (1.0 - t)); // 15% overshoot that fades
          return -smoothstep(0.0, 1.0, t) * 0.5 * overshoot; // 50% return strength
        }
      }
      
      void main() {
        // Calculate world-space position directly from tile position and UV coordinates
        // This is zoom-stable since tile world position doesn't change with zoom
        vec2 worldPos = u_tileWorldPos + (vTextureCoord * u_tileWorldSize);
        
        // Use world-space coordinates for noise sampling
        vec2 noisePos = worldPos * 0.01; // Scale down world coords for reasonable noise frequency
        vec2 perpWind = vec2(-u_windDirection.y, u_windDirection.x);
        vec2 totalDisplacement = vec2(0.0);
        
        // === RUSTLE LAYER (small-scale, always active) ===
        // Primary rustle noise
        // NOTE: u_rustleSpeed is NOT multiplied here - speed is baked into u_time accumulation
        vec2 rustleCoord1 = noisePos * u_rustleFrequency;
        rustleCoord1 += u_windDirection * u_time;
        float rustleNoise1 = value_noise(rustleCoord1);
        
        // Perpendicular rustle turbulence
        vec2 rustleCoord2 = noisePos * u_rustleFrequency * 1.3;
        rustleCoord2 += perpWind * u_time * 0.8;
        float rustleNoise2 = value_noise(rustleCoord2);
        
        // Apply spring motion for natural push/pull
        float rustleSpring1 = applySpringMotion(rustleNoise1);
        float rustleSpring2 = applySpringMotion(rustleNoise2);
        
        // Combine rustle noises with spring behavior
        vec2 rustleDisplacement = u_windDirection * rustleSpring1;
        rustleDisplacement += perpWind * rustleSpring2 * u_perpendicularMix;
        rustleDisplacement *= u_rustleScale * u_rustleIntensity;
        
        totalDisplacement += rustleDisplacement;
        
        // === SWAY LAYER (large-scale, wind-driven) ===
        // Primary sway noise (follows wind)
        // NOTE: u_swaySpeed is NOT multiplied here - speed is baked into u_time accumulation
        vec2 swayCoord1 = noisePos * u_swayFrequency;
        swayCoord1 += u_windDirection * u_time;
        float swayNoise1 = value_noise(swayCoord1);
        
        // Perpendicular sway turbulence
        vec2 swayCoord2 = noisePos * u_swayFrequency * 1.5;
        swayCoord2 += perpWind * u_time * 0.6;
        float swayNoise2 = value_noise(swayCoord2);
        
        // Apply spring motion with momentum for large-scale movement
        float swaySpring1 = applySpringMotion(swayNoise1);
        float swaySpring2 = applySpringMotion(swayNoise2);
        
        // Add subtle secondary motion for more organic feel
        vec2 swayCoord3 = noisePos * u_swayFrequency * 0.5; // Slower frequency
        swayCoord3 += u_windDirection * u_time * 0.3;
        float swayNoise3 = value_noise(swayCoord3);
        float swaySpring3 = applySpringMotion(swayNoise3) * 0.3; // 30% contribution
        
        // Combine sway with spring behavior and secondary motion
        vec2 swayDisplacement = u_windDirection * (swaySpring1 + swaySpring3);
        swayDisplacement += perpWind * swaySpring2 * u_perpendicularMix;
        
        // Scale sway by wind strength and intensity
        float windEffect = u_windStrength * u_swayWindMultiplier;
        swayDisplacement *= u_swayScale * u_swayIntensity * windEffect;
        
        totalDisplacement += swayDisplacement;
        
        // Convert world-space displacement to UV-space displacement
        // In UV space, 1.0 = full texture width/height
        // Divide by tile size to convert from world units to UV units
        vec2 displacementUV = totalDisplacement / u_tileWorldSize;
        
        // Sample displaced texture
        vec2 distortedUV = vTextureCoord + displacementUV;
        vec4 color = texture2D(uSampler, distortedUV);
        
        gl_FragColor = color;
      }
    `;

    super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
      u_time: 0,
      u_windDirection: [1, 0],
      u_windStrength: 0,
      
      // World-space uniforms (tile position and size)
      u_tileWorldPos: [0, 0],
      u_tileWorldSize: [1, 1],
      
      // Rustle defaults
      u_rustleScale: options.u_rustleScale || 3.0,
      u_rustleSpeed: options.u_rustleSpeed || 1.5,
      u_rustleFrequency: options.u_rustleFrequency || 8.0,
      u_rustleIntensity: options.u_rustleIntensity || 1.0,
      
      // Sway defaults
      u_swayScale: options.u_swayScale || 15.0,
      u_swaySpeed: options.u_swaySpeed || 0.4,
      u_swayFrequency: options.u_swayFrequency || 1.5,
      u_swayIntensity: options.u_swayIntensity || 1.0,
      u_swayWindMultiplier: options.u_swayWindMultiplier || 1.0,
      
      // Mixing
      u_perpendicularMix: options.u_perpendicularMix || 0.3
    });
  }
}

export class TreeLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this.affectedTiles = new Map(); // Map of tile ID -> { filter, tile, sprite } object
    this._smoothedWindStrength = 0; // Inertia for wind gusts (prevents instant on/off)
  }

  static getSettingsHTML() {
    const effectKey = "tree";
    const content = `
      <p class="description-text">Wind-driven distortion for trees with rustle and sway layers.</p>
      
      ${DebuggerUIBuilder._createSliderHTML("tree.rustleScale", "Rustle Distance", 0, 10, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("tree.rustleSpeed", "Rustle Speed", 0, 45, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("tree.rustleFrequency", "Rustle Frequency", 0.1, 15, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("tree.rustleIntensity", "Rustle Intensity", 0, 2, 0.05)}
      ${DebuggerUIBuilder._createSliderHTML("tree.swayScale", "Sway Distance", 0, 30, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("tree.swaySpeed", "Sway Speed", 0, 22.5, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("tree.swayFrequency", "Sway Frequency", 0.01, 5, 0.05)}
      ${DebuggerUIBuilder._createSliderHTML("tree.swayIntensity", "Sway Intensity", 0, 2, 0.05)}
      ${DebuggerUIBuilder._createSliderHTML("tree.swayWindMultiplier", "Wind Response", 0, 3, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("tree.perpendicularMix", "Turbulence Mix", 0, 1, 0.05)}
    `;
    return DebuggerUIBuilder._createAccordionHTML(effectKey, "🌲 Tree Distortion", content);
  }

  async _draw(options) {
    await super._draw(options);
    this._findAndApplyFilters();
  }

  _findAndApplyFilters() {
    if (!canvas.tiles?.placeables) return;
    
    console.log(`MapShine | TreeLayer._findAndApplyFilters: Scanning ${canvas.tiles.placeables.length} tiles`);
    
    // Find tiles with _Tree in their texture path
    for (const tile of canvas.tiles.placeables) {
      const texturePath = tile.document.texture.src;
      if (texturePath && texturePath.includes('_Tree')) {
        console.log(`MapShine | Found _Tree tile: ${texturePath}`);
        if (!this.affectedTiles.has(tile.id)) {
          const config = game.mapShine.profileManager?.activeConfig?.tree || {};
          const filter = new FoliageDistortionFilter({
            u_rustleScale: config.rustleScale || 3.0,
            u_rustleSpeed: config.rustleSpeed || 3.0,
            u_rustleFrequency: config.rustleFrequency || 8.0,
            u_rustleIntensity: config.rustleIntensity || 1.0,
            u_swayScale: config.swayScale || 12.0,
            u_swaySpeed: config.swaySpeed || 1.0,
            u_swayFrequency: config.swayFrequency || 1.5,
            u_swayIntensity: config.swayIntensity || 1.0,
            u_swayWindMultiplier: config.swayWindMultiplier || 1.0,
            u_perpendicularMix: config.perpendicularMix || 0.3
          });
          
          // Set tile world position and size for world-space noise calculation
          filter.uniforms.u_tileWorldPos = [tile.document.x, tile.document.y];
          filter.uniforms.u_tileWorldSize = [tile.document.width, tile.document.height];
          
          // Check if tile is managed by overhead layer
          const overheadLayer = canvas.overheadEffect;
          const overheadSprite = overheadLayer?.overheadSprites?.get(tile.id);
          
          if (tile.isManagedByOverheadLayer && overheadSprite) {
            // Apply filter to overhead sprite instead
            const existingFilters = cleanFilterArray(overheadSprite.filters || [], `TreeLayer.overheadSprite.${tile.id}`);
            const filtersToApply = existingFilters ? [...existingFilters, filter] : [filter];
            safeApplyFilters(overheadSprite, filtersToApply, `TreeLayer.overheadSprite.${tile.id}`);
            console.log(`MapShine | Applied tree distortion to overhead sprite: ${tile.id}, filter count: ${overheadSprite.filters?.length || 0}`);
          } else if (tile.mesh) {
            // Apply filter to regular tile mesh
            const existingFilters = cleanFilterArray(tile.mesh.filters || [], `TreeLayer.mesh.${tile.id}`);
            const filtersToApply = existingFilters ? [...existingFilters, filter] : [filter];
            safeApplyFilters(tile.mesh, filtersToApply, `TreeLayer.mesh.${tile.id}`);
            console.log(`MapShine | Applied tree distortion to tile mesh: ${tile.id}, filter count: ${tile.mesh.filters?.length || 0}`);
          } else {
            console.warn(`MapShine | Could not apply tree filter to tile ${tile.id} - no mesh or overhead sprite found`);
          }
          
          // Store references to both the filter and the objects we applied it to
          this.affectedTiles.set(tile.id, {
            filter: filter,
            tile: overheadSprite ? null : tile,
            sprite: overheadSprite || null
          });
        }
      }
    }
  }

  _onAnimate(deltaTime) {
    if (this._destroyed) return;
    if (game.mapShine?.transitionActive) return;
    
    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config) return;

    const treeConfig = config.tree;
    const windManager = game.mapShine?.windManager;
    
    // Update all tree filters
    for (const entry of this.affectedTiles.values()) {
      const filter = entry.filter;
      filter.enabled = true;
      
      // Update wind
      if (windManager) {
        const windAngleRad = windManager.angle * (Math.PI / 180);
        // Calculate wind velocity in world coordinates
        const velocityX = Math.cos(windAngleRad);
        const velocityY = -Math.sin(windAngleRad);  // Screen Y increases downward
        // NEGATE for shaders that ADD to UV (shader scrolls opposite to wind vector)
        filter.uniforms.u_windDirection = [-velocityX, -velocityY];
        
        // Apply wind strength with heavy inertia (trees are slow to respond)
        // Lerp rate: 0.02 = ~2-3 second ramp up/down (much slower than instant)
        const targetWindStrength = windManager.getNormalizedStrength();
        this._smoothedWindStrength += (targetWindStrength - this._smoothedWindStrength) * 0.02;
        filter.uniforms.u_windStrength = this._smoothedWindStrength;
      }
      
      // Get weather multipliers for foliage (applied by WeatherSystemManager)
      const weatherMult = this.weatherMultipliers || { rustleSpeed: 1.0, swaySpeed: 1.0 };
      
      // Calculate combined speed for time accumulation (prevents jumps during weather transitions)
      // Average rustle and sway speeds weighted by their typical contribution
      const rustleSpeedScaled = treeConfig.rustleSpeed * weatherMult.rustleSpeed;
      const swaySpeedScaled = treeConfig.swaySpeed * weatherMult.swaySpeed;
      const combinedSpeed = (rustleSpeedScaled + swaySpeedScaled) * 0.5;
      
      // Update time with combined speed baked in
      filter.uniforms.u_time += (deltaTime / 1000) * combinedSpeed;
      
      // Update rustle layer (speeds no longer used in shader)
      filter.uniforms.u_rustleScale = treeConfig.rustleScale;
      filter.uniforms.u_rustleSpeed = rustleSpeedScaled;  // Keep for reference but not used in shader
      filter.uniforms.u_rustleFrequency = treeConfig.rustleFrequency;
      filter.uniforms.u_rustleIntensity = treeConfig.rustleIntensity;
      
      // Update sway layer (speeds no longer used in shader)
      filter.uniforms.u_swayScale = treeConfig.swayScale;
      filter.uniforms.u_swaySpeed = treeConfig.swaySpeed;  // Keep for reference but not used in shader
      filter.uniforms.u_swayFrequency = treeConfig.swayFrequency;
      filter.uniforms.u_swayIntensity = treeConfig.swayIntensity;
      filter.uniforms.u_swayWindMultiplier = treeConfig.swayWindMultiplier;
      
      // Update mixing
      filter.uniforms.u_perpendicularMix = treeConfig.perpendicularMix;
    }
  }

  async updateFromConfig(config) {
    // Re-scan for tiles in case new ones were added
    this._findAndApplyFilters();
    
    // Update existing filter uniforms with new config values
    const treeConfig = config.tree;
    if (!treeConfig) return;
    
    for (const entry of this.affectedTiles.values()) {
      const filter = entry.filter;
      // Update rustle layer
      filter.uniforms.u_rustleScale = treeConfig.rustleScale;
      filter.uniforms.u_rustleSpeed = treeConfig.rustleSpeed;
      filter.uniforms.u_rustleFrequency = treeConfig.rustleFrequency;
      filter.uniforms.u_rustleIntensity = treeConfig.rustleIntensity;
      
      // Update sway layer
      filter.uniforms.u_swayScale = treeConfig.swayScale;
      filter.uniforms.u_swaySpeed = treeConfig.swaySpeed;
      filter.uniforms.u_swayFrequency = treeConfig.swayFrequency;
      filter.uniforms.u_swayIntensity = treeConfig.swayIntensity;
      filter.uniforms.u_swayWindMultiplier = treeConfig.swayWindMultiplier;
      
      // Update mixing
      filter.uniforms.u_perpendicularMix = treeConfig.perpendicularMix;
    }
  }

  async _tearDown(options) {
    console.log(`MapShine | TreeLayer._tearDown: Cleaning up ${this.affectedTiles.size} tree filters`);
    
    // Remove filters using stored references (not canvas lookups)
    for (const [tileId, entry] of this.affectedTiles.entries()) {
      try {
        // Use our stored references instead of looking up via canvas
        if (entry.sprite?.filters) {
          entry.sprite.filters = entry.sprite.filters.filter(f => f !== entry.filter);
        }
        if (entry.tile?.mesh?.filters) {
          entry.tile.mesh.filters = entry.tile.mesh.filters.filter(f => f !== entry.filter);
        }
        
        // Destroy the filter
        if (entry.filter) {
          entry.filter.destroy();
        }
      } catch (error) {
        console.warn(`MapShine | Error cleaning up tree filter for tile ${tileId}:`, error);
      }
    }
    
    this.affectedTiles.clear();
    console.log(`MapShine | TreeLayer._tearDown: Complete`);
    await super._tearDown(options);
  }
}

export class BushLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this.affectedTiles = new Map(); // Map of tile ID -> { filter, tile, sprite } object
    this._smoothedWindStrength = 0; // Inertia for wind gusts (prevents instant on/off)
  }

  static getSettingsHTML() {
    const effectKey = "bush";
    const content = `
      <p class="description-text">Wind-driven distortion for bushes with rustle and sway layers.</p>
      
      ${DebuggerUIBuilder._createSliderHTML("bush.rustleScale", "Rustle Distance", 0, 1, 0.01)}
      ${DebuggerUIBuilder._createSliderHTML("bush.rustleSpeed", "Rustle Speed", 0, 45, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("bush.rustleFrequency", "Rustle Frequency", 0.1, 15, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("bush.rustleIntensity", "Rustle Intensity", 0, 2, 0.05)}
      ${DebuggerUIBuilder._createSliderHTML("bush.swayScale", "Sway Distance", 0, 20, 0.01)}
      ${DebuggerUIBuilder._createSliderHTML("bush.swaySpeed", "Sway Speed", 0, 22.5, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("bush.swayFrequency", "Sway Frequency", 0.01, 5, 0.05)}
      ${DebuggerUIBuilder._createSliderHTML("bush.swayIntensity", "Sway Intensity", 0, 2, 0.05)}
      ${DebuggerUIBuilder._createSliderHTML("bush.swayWindMultiplier", "Wind Response", 0, 3, 0.1)}
      ${DebuggerUIBuilder._createSliderHTML("bush.perpendicularMix", "Turbulence Mix", 0, 1, 0.05)}
    `;
    return DebuggerUIBuilder._createAccordionHTML(effectKey, "🌿 Bush Distortion", content);
  }

  async _draw(options) {
    await super._draw(options);
    this._findAndApplyFilters();
  }

  _findAndApplyFilters() {
    if (!canvas.tiles?.placeables) return;
    
    console.log(`MapShine | BushLayer._findAndApplyFilters: Scanning ${canvas.tiles.placeables.length} tiles`);
    
    // Find tiles with _Bush in their texture path
    for (const tile of canvas.tiles.placeables) {
      const texturePath = tile.document.texture.src;
      if (texturePath && texturePath.includes('_Bush')) {
        console.log(`MapShine | Found _Bush tile: ${texturePath}`);
        if (!this.affectedTiles.has(tile.id)) {
          const config = game.mapShine.profileManager?.activeConfig?.bush || {};
          const filter = new FoliageDistortionFilter({
            u_rustleScale: config.rustleScale || 3.0,
            u_rustleSpeed: config.rustleSpeed || 3.0,
            u_rustleFrequency: config.rustleFrequency || 8.0,
            u_rustleIntensity: config.rustleIntensity || 1.0,
            u_swayScale: config.swayScale || 12.0,
            u_swaySpeed: config.swaySpeed || 1.0,
            u_swayFrequency: config.swayFrequency || 1.5,
            u_swayIntensity: config.swayIntensity || 1.0,
            u_swayWindMultiplier: config.swayWindMultiplier || 1.0,
            u_perpendicularMix: config.perpendicularMix || 0.3
          });
          
          // Set tile world position and size for world-space noise calculation
          filter.uniforms.u_tileWorldPos = [tile.document.x, tile.document.y];
          filter.uniforms.u_tileWorldSize = [tile.document.width, tile.document.height];
          
          // Check if tile is managed by overhead layer
          const overheadLayer = canvas.overheadEffect;
          const overheadSprite = overheadLayer?.overheadSprites?.get(tile.id);
          
          if (tile.isManagedByOverheadLayer && overheadSprite) {
            // Apply filter to overhead sprite instead
            const existingFilters = cleanFilterArray(overheadSprite.filters || [], `BushLayer.overheadSprite.${tile.id}`);
            const filtersToApply = existingFilters ? [...existingFilters, filter] : [filter];
            safeApplyFilters(overheadSprite, filtersToApply, `BushLayer.overheadSprite.${tile.id}`);
            console.log(`MapShine | Applied bush distortion to overhead sprite: ${tile.id}, filter count: ${overheadSprite.filters?.length || 0}`);
          } else if (tile.mesh) {
            // Apply filter to regular tile mesh
            const existingFilters = cleanFilterArray(tile.mesh.filters || [], `BushLayer.mesh.${tile.id}`);
            const filtersToApply = existingFilters ? [...existingFilters, filter] : [filter];
            safeApplyFilters(tile.mesh, filtersToApply, `BushLayer.mesh.${tile.id}`);
            console.log(`MapShine | Applied bush distortion to tile mesh: ${tile.id}, filter count: ${tile.mesh.filters?.length || 0}`);
          } else {
            console.warn(`MapShine | Could not apply bush filter to tile ${tile.id} - no mesh or overhead sprite found`);
          }
          
          // Store references to both the filter and the objects we applied it to
          this.affectedTiles.set(tile.id, {
            filter: filter,
            tile: overheadSprite ? null : tile,
            sprite: overheadSprite || null
          });
        }
      }
    }
  }

  _onAnimate(deltaTime) {
    if (this._destroyed) return;
    if (game.mapShine?.transitionActive) return;
    
    // ✅ FIX: Check master enabled flag
    const config = game.mapShine.profileManager?.activeConfig;
    if (!config || config.enabled === false) {
      // Disable all filters
      for (const filter of this.affectedTiles.values()) {
        filter.enabled = false;
      }
      return;
    }
    
    if (!config?.bush?.enabled) {
      // Disable all filters
      for (const filter of this.affectedTiles.values()) {
        filter.enabled = false;
      }
      return;
    }
    
    const bushConfig = config.bush;
    const windManager = game.mapShine?.windManager;
    
    // Update all bush filters
    for (const entry of this.affectedTiles.values()) {
      const filter = entry.filter;
      filter.enabled = true;
      
      // Update wind
      if (windManager) {
        const windAngleRad = windManager.angle * (Math.PI / 180);
        // Calculate wind velocity in world coordinates
        const velocityX = Math.cos(windAngleRad);
        const velocityY = -Math.sin(windAngleRad);  // Screen Y increases downward
        // NEGATE for shaders that ADD to UV (shader scrolls opposite to wind vector)
        filter.uniforms.u_windDirection = [-velocityX, -velocityY];
        
        // Apply wind strength with moderate inertia (bushes respond faster than trees)
        // Lerp rate: 0.05 = ~1 second ramp up/down
        const targetWindStrength = windManager.getNormalizedStrength();
        this._smoothedWindStrength += (targetWindStrength - this._smoothedWindStrength) * 0.05;
        filter.uniforms.u_windStrength = this._smoothedWindStrength;
      }
      
      // Get weather multipliers for foliage (applied by WeatherSystemManager)
      const weatherMult = this.weatherMultipliers || { rustleSpeed: 1.0, swaySpeed: 1.0 };
      
      // Calculate combined speed for time accumulation (prevents jumps during weather transitions)
      // Average rustle and sway speeds weighted by their typical contribution
      const rustleSpeedScaled = bushConfig.rustleSpeed * weatherMult.rustleSpeed;
      const swaySpeedScaled = bushConfig.swaySpeed * weatherMult.swaySpeed;
      const combinedSpeed = (rustleSpeedScaled + swaySpeedScaled) * 0.5;
      
      // Update time with combined speed baked in
      filter.uniforms.u_time += (deltaTime / 1000) * combinedSpeed;
      
      // Update rustle layer (speeds no longer used in shader)
      filter.uniforms.u_rustleScale = bushConfig.rustleScale;
      filter.uniforms.u_rustleSpeed = rustleSpeedScaled;  // Keep for reference but not used in shader
      filter.uniforms.u_rustleFrequency = bushConfig.rustleFrequency;
      filter.uniforms.u_rustleIntensity = bushConfig.rustleIntensity;
      
      // Update sway layer (speeds no longer used in shader)
      filter.uniforms.u_swayScale = bushConfig.swayScale;
      filter.uniforms.u_swaySpeed = swaySpeedScaled;  // Keep for reference but not used in shader
      filter.uniforms.u_swayFrequency = bushConfig.swayFrequency;
      filter.uniforms.u_swayIntensity = bushConfig.swayIntensity;
      filter.uniforms.u_swayWindMultiplier = bushConfig.swayWindMultiplier;
      
      // Update mixing
      filter.uniforms.u_perpendicularMix = bushConfig.perpendicularMix;
    }
  }

  async updateFromConfig(config) {
    // Re-scan for tiles in case new ones were added
    this._findAndApplyFilters();
    
    // Update existing filter uniforms with new config values
    const bushConfig = config.bush;
    if (!bushConfig) return;
    
    for (const entry of this.affectedTiles.values()) {
      const filter = entry.filter;
      // Update rustle layer
      filter.uniforms.u_rustleScale = bushConfig.rustleScale;
      filter.uniforms.u_rustleSpeed = bushConfig.rustleSpeed;
      filter.uniforms.u_rustleFrequency = bushConfig.rustleFrequency;
      filter.uniforms.u_rustleIntensity = bushConfig.rustleIntensity;
      
      // Update sway layer
      filter.uniforms.u_swayScale = bushConfig.swayScale;
      filter.uniforms.u_swaySpeed = bushConfig.swaySpeed;
      filter.uniforms.u_swayFrequency = bushConfig.swayFrequency;
      filter.uniforms.u_swayIntensity = bushConfig.swayIntensity;
      filter.uniforms.u_swayWindMultiplier = bushConfig.swayWindMultiplier;
      
      // Update mixing
      filter.uniforms.u_perpendicularMix = bushConfig.perpendicularMix;
    }
  }

  async _tearDown(options) {
    console.log(`MapShine | BushLayer._tearDown: Cleaning up ${this.affectedTiles.size} bush filters`);
    
    // Remove filters using stored references (not canvas lookups)
    for (const [tileId, entry] of this.affectedTiles.entries()) {
      try {
        // Use our stored references instead of looking up via canvas
        if (entry.sprite?.filters) {
          entry.sprite.filters = entry.sprite.filters.filter(f => f !== entry.filter);
        }
        if (entry.tile?.mesh?.filters) {
          entry.tile.mesh.filters = entry.tile.mesh.filters.filter(f => f !== entry.filter);
        }
        
        // Destroy the filter
        if (entry.filter) {
          entry.filter.destroy();
        }
      } catch (error) {
        console.warn(`MapShine | Error cleaning up bush filter for tile ${tileId}:`, error);
      }
    }
    
    this.affectedTiles.clear();
    console.log(`MapShine | BushLayer._tearDown: Complete`);
    await super._tearDown(options);
  }
}
