/**
 * EffectValidator - Development Diagnostic System
 * 
 * Validates Map Shine effects during startup and runtime to catch silent failures.
 * This transforms vague "it's not working" reports into actionable error messages.
 */

class EffectValidator {
  constructor(effectName, effectInstance) {
    this.effectName = effectName;
    this.effectInstance = effectInstance;
    this.errors = [];
    this.warnings = [];
    this.validationPassed = false;
    this.lastValidationTime = null;
  }

  /**
   * Run comprehensive validation of the effect
   * @returns {Promise<boolean>} True if validation passed (no errors)
   */
  async runFullValidation() {
    this.errors = [];
    this.warnings = [];
    this.lastValidationTime = new Date().toISOString();
    
    console.log(`🔍 Map Shine Validation: Starting validation for ${this.effectName}`);
    
    // Core validation categories
    await this.validateTextures();
    await this.validateShaders();
    await this.validateConfiguration();
    await this.validateRenderingPipeline();
    await this.validateDependencies();
    await this.validateEffectSpecific();
    
    this.validationPassed = this.errors.length === 0;
    this.reportResults();
    
    // Store results for diagnostic system
    this.validationResults = {
      timestamp: this.lastValidationTime,
      effectName: this.effectName,
      passed: this.validationPassed,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
    
    return this.validationPassed;
  }

  /**
   * Validate texture loading and validity
   */
  async validateTextures() {
    const effect = this.effectInstance;
    
    try {
      // Check for texture discovery system
      if (!effect.sourceContainer) {
        this.addError('Effect has no sourceContainer for texture sprites');
        return;
      }
      
      // Check if any specular targets were found
      const specularSprites = effect.sourceContainer.children.filter(child => 
        child.texture && child.texture !== PIXI.Texture.EMPTY
      );
      
      if (specularSprites.length === 0) {
        this.addWarning('No specular textures found - effect may appear invisible');
        this.addWarning('Check that scene tiles/background have _Specular texture paths configured');
      } else {
        console.log(`✅ Found ${specularSprites.length} specular texture sprites`);
      }
      
      // Validate each sprite's texture
      for (const sprite of effect.sourceContainer.children) {
        if (!sprite.texture) {
          this.addError(`Sprite '${sprite.name}' has no texture assigned`);
          continue;
        }
        
        // Check texture validity
        if (!sprite.texture.baseTexture?.valid) {
          this.addError(`Sprite '${sprite.name}' has invalid baseTexture`);
          continue;
        }
        
        // Check texture dimensions
        if (sprite.texture.width === 0 || sprite.texture.height === 0) {
          this.addError(`Sprite '${sprite.name}' has zero-dimension texture`);
          continue;
        }
        
        // Check for texture corruption (extremely large dimensions)
        if (sprite.texture.width > 8192 || sprite.texture.height > 8192) {
          this.addWarning(`Sprite '${sprite.name}' has very large texture (${sprite.texture.width}x${sprite.texture.height}) - may cause performance issues`);
        }
        
        // Check texture source path
        const texturePath = sprite.texture.baseTexture?.resource?.src;
        if (!texturePath || texturePath.includes('data:')) {
          this.addWarning(`Sprite '${sprite.name}' is using fallback texture (no valid source path)`);
        }
      }
      
      // Check composite textures
      if (!effect.specularCompositeTexture?.baseTexture?.valid) {
        this.addError('Specular composite texture is invalid');
      }
      
      if (!effect.stripePatternTexture?.baseTexture?.valid) {
        this.addError('Stripe pattern texture is invalid');
      }
      
      if (!effect.finalShineTexture?.baseTexture?.valid) {
        this.addError('Final shine texture is invalid');
      }
      
    } catch (error) {
      this.addError(`Exception during texture validation: ${error.message}`);
    }
  }

  /**
   * Validate shader compilation and uniforms
   */
  async validateShaders() {
    const effect = this.effectInstance;
    
    try {
      // Check filters
      if (!effect.stripePatternFilter) {
        this.addError('Stripe pattern filter is missing');
      } else {
        await this.validateFilter(effect.stripePatternFilter, 'stripe pattern');
      }
      
      if (!effect.shineFilter) {
        this.addError('Shine filter is missing');
      } else {
        await this.validateFilter(effect.shineFilter, 'metallic shine');
      }
      
    } catch (error) {
      this.addError(`Exception during shader validation: ${error.message}`);
    }
  }

  /**
   * Validate individual filter
   */
  async validateFilter(filter, filterName) {
    try {
      // Check shader compilation
      if (filter.glProgram) {
        if (filter.glProgram.fragmentShader?.glShader === null) {
          this.addError(`${filterName} filter: Fragment shader failed to compile`);
        }
        
        if (filter.glProgram.vertexShader?.glShader === null) {
          this.addError(`${filterName} filter: Vertex shader failed to compile`);
        }
      }
      
      // Check required uniforms
      const requiredUniforms = this.getRequiredUniforms();
      const availableUniforms = filter.uniforms || {};
      
      for (const uniform of requiredUniforms) {
        if (!(uniform in availableUniforms)) {
          this.addError(`${filterName} filter: Missing required uniform '${uniform}'`);
        }
      }
      
      // Check uniform values for common issues
      for (const [name, uniform] of Object.entries(availableUniforms)) {
        if (uniform === undefined || uniform === null) {
          this.addError(`${filterName} filter: Uniform '${name}' has null/undefined value`);
          continue;
        }
        
        // Check for NaN values
        if (typeof uniform === 'number' && isNaN(uniform)) {
          this.addError(`${filterName} filter: Uniform '${name}' has NaN value`);
        }
        
        // Check for infinite values
        if (typeof uniform === 'number' && !isFinite(uniform)) {
          this.addError(`${filterName} filter: Uniform '${name}' has infinite value`);
        }
        
        // Check texture uniforms
        if (uniform && typeof uniform === 'object' && uniform.baseTexture) {
          if (!uniform.baseTexture.valid) {
            this.addError(`${filterName} filter: Texture uniform '${name}' has invalid baseTexture`);
          }
        }
      }
      
    } catch (error) {
      this.addError(`${filterName} filter: Exception during validation: ${error.message}`);
    }
  }

  /**
   * Validate effect configuration
   */
  async validateConfiguration() {
    try {
      // Check if profile manager is available
      if (!game.mapShine?.profileManager) {
        this.addError('Profile manager not available');
        return;
      }
      
      const config = game.mapShine.profileManager.activeConfig;
      if (!config) {
        this.addError('No active configuration found');
        return;
      }
      
      const baseShineConfig = config.baseShine;
      if (!baseShineConfig) {
        this.addError('No baseShine configuration found');
        return;
      }
      
      // Check enabled flag
      if (typeof baseShineConfig.enabled !== 'boolean') {
        this.addWarning('Base shine enabled flag is not boolean');
      }
      
      // Validate intensity ranges
      if (baseShineConfig.globalIntensity !== undefined) {
        if (typeof baseShineConfig.globalIntensity !== 'number') {
          this.addError('Global intensity must be number');
        } else if (baseShineConfig.globalIntensity < 0 || baseShineConfig.globalIntensity > 5) {
          this.addWarning(`Global intensity outside recommended range (0-5): ${baseShineConfig.globalIntensity}`);
        }
      }
      
    } catch (error) {
      this.addError(`Exception during configuration validation: ${error.message}`);
    }
  }

  /**
   * Validate rendering pipeline setup
   */
  async validateRenderingPipeline() {
    const effect = this.effectInstance;
    
    try {
      // Check canvas availability
      if (!canvas) {
        this.addError('Canvas not available');
        return;
      }
      
      if (!canvas.app?.renderer) {
        this.addError('PIXI renderer not available');
        return;
      }
      
      // Check if layer is properly attached
      if (!effect.effectSprite) {
        this.addError('Effect sprite is missing');
        return;
      }
      
      if (effect.effectSprite.parent !== effect) {
        this.addError('Effect sprite is not properly attached to layer');
      }
      
      // Check filter application
      if (effect.effectSprite.filters && effect.effectSprite.filters.length > 0) {
        if (!effect.shineFilter || !effect.effectSprite.filters.includes(effect.shineFilter)) {
          this.addError('Shine filter not applied to effect sprite');
        }
      } else {
        this.addWarning('No filters applied to effect sprite');
      }
      
      // Check render textures
      const screen = canvas.app.renderer.screen;
      if (screen.width === 0 || screen.height === 0) {
        this.addError('Renderer screen has zero dimensions');
      }
      
      // Check container setup
      if (!effect.sourceContainer) {
        this.addError('Source container is missing');
      } else if (effect.sourceContainer.parent !== effect) {
        this.addError('Source container is not properly attached to layer');
      }
      
    } catch (error) {
      this.addError(`Exception during rendering pipeline validation: ${error.message}`);
    }
  }

  /**
   * Validate system dependencies
   */
  async validateDependencies() {
    try {
      // Check for required managers
      const requiredManagers = this.getRequiredManagers();
      
      for (const managerName of requiredManagers) {
        const manager = game.mapShine[managerName];
        if (!manager) {
          this.addError(`Required manager missing: ${managerName}`);
        } else if (!manager.initialized && manager.initialized !== undefined) {
          this.addWarning(`Manager not initialized: ${managerName}`);
        }
      }
      
      // Check for required canvas objects
      if (!canvas?.scene) {
        this.addError('Canvas scene not available');
      }
      
      if (!canvas?.dimensions) {
        this.addError('Canvas dimensions not available');
      }
      
      // Check texture loader
      if (!TextureLoader) {
        this.addError('TextureLoader utility not available');
      }
      
      // Check coordinate manager
      if (!CoordinateManager) {
        this.addError('CoordinateManager not available');
      }
      
    } catch (error) {
      this.addError(`Exception during dependency validation: ${error.message}`);
    }
  }

  /**
   * Validate effect-specific requirements
   */
  async validateEffectSpecific() {
    const effect = this.effectInstance;
    
    try {
      // Check for stripe pattern generator setup
      if (!effect.stripeGeneratorSprite) {
        this.addError('Stripe generator sprite is missing');
      } else {
        if (effect.stripeGeneratorSprite.width <= 0 || effect.stripeGeneratorSprite.height <= 0) {
          this.addError('Stripe generator sprite has invalid dimensions');
        }
      }
      
      // Check time tracking
      if (typeof effect.time !== 'number') {
        this.addError('Time tracking is not a number');
      }
      
      if (typeof effect.currentTime !== 'number') {
        this.addWarning('Current time is not a number');
      }
      
      // Check mask update flag
      if (typeof effect._needsMaskUpdate !== 'boolean') {
        this.addWarning('_needsMaskUpdate flag is not boolean');
      }
      
    } catch (error) {
      this.addError(`Exception during effect-specific validation: ${error.message}`);
    }
  }

  /**
   * Get required uniforms for this effect
   */
  getRequiredUniforms() {
    // Common uniforms for MetallicShineFilter
    return [
      'uSpecularMap',
      'uStripePattern', 
      'uCloudOcclusionMask',
      'uStructuralMask',
      'uOutdoorsMask',
      'uDarkness',
      'uTime'
    ];
  }

  /**
   * Get required managers for this effect
   */
  getRequiredManagers() {
    return [
      'resourceManager',
      'profileManager', 
      'coordinateManager'
    ];
  }

  /**
   * Add an error to the validation results
   */
  addError(message) {
    this.errors.push(message);
  }

  /**
   * Add a warning to the validation results
   */
  addWarning(message) {
    this.warnings.push(message);
  }

  /**
   * Report validation results to console
   */
  reportResults() {
    const prefix = `Map Shine Validation [${this.effectName}]`;
    
    if (this.errors.length > 0) {
      console.group(`🚨 ${prefix} - ERRORS (${this.errors.length})`);
      this.errors.forEach((error, index) => {
        console.error(`${index + 1}. ${error}`);
      });
      console.groupEnd();
    }
    
    if (this.warnings.length > 0) {
      console.group(`⚠️ ${prefix} - WARNINGS (${this.warnings.length})`);
      this.warnings.forEach((warning, index) => {
        console.warn(`${index + 1}. ${warning}`);
      });
      console.groupEnd();
    }
    
    if (this.validationPassed) {
      console.log(`✅ ${prefix} - Validation passed successfully`);
    } else {
      console.error(`❌ ${prefix} - Validation FAILED with ${this.errors.length} errors and ${this.warnings.length} warnings`);
    }
    
    // Summary
    console.log(`📊 ${prefix} - Summary: ${this.errors.length} errors, ${this.warnings.length} warnings, Status: ${this.validationPassed ? 'PASS' : 'FAIL'}`);
  }

  /**
   * Get validation results for diagnostic reporting
   */
  getValidationResults() {
    return this.validationResults || null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EffectValidator;
}
