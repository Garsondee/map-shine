/**
 * @fileoverview Effect Discovery - Automatic detection of enabled Map Shine effects
 * 
 * Scans the active configuration to identify all enabled effects and their
 * configuration paths. Used by the profiling system to systematically test
 * individual effect performance impact.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class EffectDiscovery {
  /**
   * Effect category definitions with their config paths
   * ✅ COMPREHENSIVE LIST - Includes ALL Map Shine effects
   */
  static EFFECT_CATEGORIES = {
    // ========================================================================
    // LAYER-BASED EFFECTS
    // ========================================================================
    CLOUD_SHADOWS: {
      path: 'cloudShadows.enabled',
      name: 'Cloud Shadows',
      category: 'layer'
    },
    CANOPY: {
      path: 'canopy.enabled',
      name: 'Canopy Shadows',
      category: 'layer'
    },
    STRUCTURAL_SHADOWS: {
      path: 'structuralShadows.enabled',
      name: 'Structural Shadows',
      category: 'layer'
    },
    PRISM: {
      path: 'prism.enabled',
      name: 'Prism Effect',
      category: 'layer'
    },
    IRIDESCENCE: {
      path: 'iridescence.enabled',
      name: 'Iridescence',
      category: 'layer'
    },
    AMBIENT: {
      path: 'ambient.enabled',
      name: 'Ambient / Emissive',
      category: 'layer'
    },
    GROUND_GLOW: {
      path: 'groundGlow.enabled',
      name: 'Glow in the Dark',
      category: 'layer'
    },
    FOAM: {
      path: 'foam.enabled',
      name: 'Water Edge Foam',
      category: 'layer'
    },
    BUILDING_SHADOWS: {
      path: 'buildingShadows.enabled',
      name: 'Building Shadows',
      category: 'layer'
    },
    TIME_OF_DAY: {
      path: 'timeOfDay.enabled',
      name: 'Time of Day Color Grade',
      category: 'layer'
    },
    BASE_SHINE: {
      path: 'baseShine.enabled',
      name: 'Metallic / Reflective / Sparkle',
      category: 'layer'
    },
    
    // ========================================================================
    // WATER EFFECTS (WaterFXLayer)
    // ========================================================================
    WATER: {
      path: 'water.enabled',
      name: 'Water Effects',
      category: 'water'
    },
    
    // ========================================================================
    // PARTICLE EFFECTS
    // ========================================================================
    DUST_MOTES: {
      path: 'dust.enabled',
      name: 'Dust Motes',
      category: 'particle'
    },
    GLINT: {
      path: 'glint.enabled',
      name: 'Glint Particles',
      category: 'particle'
    },
    METALLIC_GLINTS: {
      path: 'metallicGlints.enabled',
      name: 'Metallic Glints',
      category: 'particle'
    },
    BIOFILM: {
      path: 'biofilm.enabled',
      name: 'Biofilm',
      category: 'particle'
    },
    FLAMES: {
      path: 'fire.particles.enabled',
      name: 'Flames',
      category: 'particle'
    },
    CANDLE_FLAME: {
      path: 'candleFlame.enabled',
      name: 'Candle Flame',
      category: 'particle'
    },
    PRESSURISED_STEAM: {
      path: 'pressurisedSteam.enabled',
      name: 'Pressurised Steam',
      category: 'particle'
    },
    SPARKS: {
      path: 'sparks.enabled',
      name: 'Sparks',
      category: 'particle'
    },
    LIGHTNING: {
      path: 'lightning.enabled',
      name: 'Lightning',
      category: 'particle'
    },
    SMELLY_FLIES: {
      path: 'smellyFlies.enabled',
      name: 'Smelly Flies',
      category: 'particle'
    },
    HEAT_DISTORTION: {
      path: 'heatDistortion.enabled',
      name: 'Heat Distortion',
      category: 'particle'
    },
    WATER_SPLASHES: {
      path: 'water.glintParticles.enabled',
      name: 'Water Splashes',
      category: 'particle'
    },
    
    // ========================================================================
    // POST-PROCESSING EFFECTS
    // ========================================================================
    COLOR_CORRECTION: {
      path: 'postProcessing.colorCorrection.enabled',
      name: 'Color Correction',
      category: 'screen'
    },
    DYNAMIC_EXPOSURE: {
      path: 'postProcessing.colorCorrection.dynamicExposure.enabled',
      name: 'Dynamic Exposure (Dazzle)',
      category: 'screen'
    },
    VIGNETTE: {
      path: 'postProcessing.vignette.enabled',
      name: 'Vignette',
      category: 'screen'
    },
    LENS_DISTORTION: {
      path: 'postProcessing.lensDistortion.enabled',
      name: 'Lens Distortion',
      category: 'screen'
    },
    CHROMATIC_ABERRATION: {
      path: 'postProcessing.chromaticAberration.enabled',
      name: 'Chromatic Aberration',
      category: 'screen'
    },
    TILT_SHIFT: {
      path: 'postProcessing.tiltShift.enabled',
      name: 'Tilt Shift',
      category: 'screen'
    },
    GRAIN: {
      path: 'postProcessing.grain.enabled',
      name: 'Grain / Digital Noise',
      category: 'screen'
    },
    
    // ========================================================================
    // SYSTEM EFFECTS
    // ========================================================================
    WEATHER: {
      path: 'weather.enabled',
      name: 'Weather System',
      category: 'weather'
    },
    PHYSICS_ROPE: {
      path: 'physicsRope.enabled',
      name: 'Physics Rope',
      category: 'system'
    },
    BUSH_DISTORTION: {
      path: 'bush.enabled',
      name: 'Bush Distortion',
      category: 'system'
    },
    TREE_DISTORTION: {
      path: 'tree.enabled',
      name: 'Tree Distortion',
      category: 'system'
    }
  };
  
  /**
   * Scan active configuration and discover all enabled effects
   * 
   * @returns {Object} Discovery results
   */
  static discoverEnabledEffects() {
    if (!game.mapShine?.profileManager?.activeConfig) {
      throw new Error('Map Shine not initialized or no active config');
    }
    
    const config = game.mapShine.profileManager.activeConfig;
    const results = {
      totalEffects: 0,
      enabledEffects: [],
      disabledEffects: [],
      byCategory: {
        layer: [],
        water: [],
        particle: [],
        screen: [],
        weather: [],
        system: []
      },
      sceneInfo: this._getSceneInfo()
    };
    
    // Scan each effect definition
    for (const [key, effectDef] of Object.entries(this.EFFECT_CATEGORIES)) {
      const enabled = foundry.utils.getProperty(config, effectDef.path);
      
      // ⚠️ KNOWN BUG: Weather checkbox (weather.enabled) doesn't match actual state
      // Weather may be running even if config says disabled - check WeatherSystemManager
      let actuallyEnabled = !!enabled;
      if (key === 'WEATHER' && game.mapShine?.weatherSystemManager) {
        const manager = game.mapShine.weatherSystemManager;
        const hasActiveWeather = manager.currentState !== 'clear' && manager.weatherEffectLayer?.visible;
        if (hasActiveWeather && !enabled) {
          console.warn('⚠️  Weather checkbox bug detected: config disabled but weather is ACTIVE');
          actuallyEnabled = true; // Override - weather is actually running
        }
      }
      
      const effectInfo = {
        key,
        ...effectDef,
        enabled: actuallyEnabled,
        configValue: !!enabled // Store original config value
      };
      
      results.totalEffects++;
      
      if (actuallyEnabled) {
        results.enabledEffects.push(effectInfo);
        results.byCategory[effectDef.category].push(effectInfo);
      } else {
        results.disabledEffects.push(effectInfo);
      }
    }
    
    return results;
  }
  
  /**
   * Get information about the current scene
   */
  static _getSceneInfo() {
    if (!canvas.scene) return null;
    
    return {
      id: canvas.scene.id,
      name: canvas.scene.name,
      width: canvas.scene.width,
      height: canvas.scene.height,
      grid: canvas.scene.grid.size,
      background: canvas.scene.background.src || null
    };
  }
  
  /**
   * Get all available scenes for multi-scene testing
   * 
   * @param {number} maxScenes - Maximum number of scenes to return
   * @returns {Array} Scene information
   */
  static getAvailableScenes(maxScenes = 5) {
    const scenes = game.scenes?.contents || [];
    
    return scenes.slice(0, maxScenes).map(scene => ({
      id: scene.id,
      name: scene.name,
      active: scene.active,
      width: scene.width,
      height: scene.height
    }));
  }
  
  /**
   * Validate that an effect can be toggled safely
   * 
   * @param {string} effectKey - Effect key to check
   * @returns {Object} Validation results
   */
  static validateEffectToggle(effectKey) {
    const effectDef = this.EFFECT_CATEGORIES[effectKey];
    
    if (!effectDef) {
      return {
        valid: false,
        error: `Unknown effect key: ${effectKey}`
      };
    }
    
    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config) {
      return {
        valid: false,
        error: 'Map Shine not initialized'
      };
    }
    
    // Check if config path exists
    const value = foundry.utils.getProperty(config, effectDef.path);
    if (value === undefined) {
      return {
        valid: false,
        error: `Config path not found: ${effectDef.path}`
      };
    }
    
    return {
      valid: true,
      effectDef,
      currentState: !!value
    };
  }
  
  /**
   * Generate a human-readable summary of enabled effects
   * 
   * @param {Object} discovery - Results from discoverEnabledEffects()
   * @returns {string} Formatted summary
   */
  static formatDiscoverySummary(discovery) {
    let summary = `\n${'='.repeat(60)}\n`;
    summary += `  EFFECT DISCOVERY SUMMARY\n`;
    summary += `${'='.repeat(60)}\n\n`;
    
    if (discovery.sceneInfo) {
      summary += `Scene: ${discovery.sceneInfo.name}\n`;
      summary += `Size: ${discovery.sceneInfo.width}x${discovery.sceneInfo.height}\n\n`;
    }
    
    summary += `Total Effects: ${discovery.totalEffects}\n`;
    summary += `Enabled: ${discovery.enabledEffects.length}\n`;
    summary += `Disabled: ${discovery.disabledEffects.length}\n\n`;
    
    if (discovery.enabledEffects.length > 0) {
      summary += `${'─'.repeat(60)}\n`;
      summary += `ENABLED EFFECTS (${discovery.enabledEffects.length}):\n`;
      summary += `${'─'.repeat(60)}\n\n`;
      
      for (const category of ['layer', 'water', 'particle', 'screen', 'weather', 'system']) {
        const effects = discovery.byCategory[category];
        if (effects.length > 0) {
          summary += `${category.toUpperCase()}:\n`;
          effects.forEach(effect => {
            summary += `  ✓ ${effect.name}\n`;
          });
          summary += '\n';
        }
      }
    }
    
    summary += `${'='.repeat(60)}\n`;
    return summary;
  }
}

// Make globally available for Playwright tests
if (typeof window !== 'undefined') {
  window.EffectDiscovery = EffectDiscovery;
}
