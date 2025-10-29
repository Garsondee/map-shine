/**
 * @fileoverview Effect Validator - Comprehensive Effect Diagnostic System
 * 
 * Systematically validates all Map Shine effects to detect:
 * - Texture loading and corruption issues
 * - Shader compilation failures
 * - Configuration problems
 * - Dependency availability
 * - Rendering pipeline issues
 * - Runtime state corruption
 * 
 * Critical for catching:
 * - Silent effect failures during development
 * - Missing resources and broken assets
 * - Shader compilation errors
 * - Configuration regressions
 * - Memory and state corruption
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class EffectValidator {
  static errors = [];
  static warnings = [];
  static measurements = [];
  
  // Validation categories
  static VALIDATION_CATEGORIES = {
    TEXTURES: 'textures',
    SHADERS: 'shaders', 
    CONFIGURATION: 'configuration',
    DEPENDENCIES: 'dependencies',
    RENDERING: 'rendering',
    RUNTIME: 'runtime'
  };
  
  /**
   * Run comprehensive validation on all Map Shine effects
   * 
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  static async validateAllEffects(options = {}) {
    const {
      detailedOutput = true,
      includeWarnings = true,
      checkRuntime = false
    } = options || {};
    
    const results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      effects: {}
    };

    console.log('🚨 Starting comprehensive effect validation...');
    console.log('📊 This will validate all Map Shine effects found in canvas.layers');
    
    // First, get all available canvas layers and identify Map Shine effects
    const allLayers = canvas.layers || [];
    console.log(`📋 Found ${allLayers.length} total canvas layers`);
    
    // Look for actual Map Shine layers in canvas.layers
    const mapShineLayers = allLayers.filter(layer => {
      const name = layer.constructor.name;
      return name.includes('Shine') || 
             name.includes('Cloud') ||
             name.includes('Animated') ||
             layer.cloudShadowsFilter ||
             layer.metallicShineFilter ||
             layer.weatherEffectLayer;
    });
    
    console.log(`🎯 Found ${mapShineLayers.length} Map Shine layers in canvas.layers`);
    
    if (mapShineLayers.length === 0) {
      console.log('❌ No Map Shine layers found in canvas.layers - effects may not be enabled');
    }
    
    // Validate each found layer
    for (const layer of mapShineLayers) {
      const layerName = layer.constructor.name;
      console.log(`\n🔍 Validating ${layerName}...`);
      
      const result = {
        name: layerName,
        found: true,
        visible: layer.visible ?? false,
        hasValidation: false,
        validationResults: {
          layerExistence: { passed: 0, failed: 0, errors: [], warnings: [] },
          textures: { errors: [], warnings: [] },
          shaders: { errors: [], warnings: [] },
          filters: { errors: [], warnings: [] },
          uniforms: { errors: [], warnings: [] },
          resources: { errors: [], warnings: [] }
        },
        overallStatus: 'unknown',
        diagnostics: {
          layerClass: layerName,
          filterClass: null,
          shaderPrograms: null,
          textureCount: 0,
          uniformCount: 0
        }
      };
      
      try {
        // Add basic layer properties check
        if (!layer.container) {
          result.validationResults.layerExistence.errors.push('Layer container is null or undefined');
        }
        
        // CloudShadowsLayer specific validation
        if (layer.constructor.name === 'CloudShadowsLayer') {
          const cloudValidation = await this.validateCloudShadowsLayerInstance(layer, layerName);
          Object.assign(result, cloudValidation);
        } 
        // MetallicShineLayer specific validation
        else if (layer.constructor.name === 'MetallicShineLayer') {
          const metallicValidation = await this.validateMetallicShineLayerInstance(layer, layerName);
          Object.assign(result, metallicValidation);
        }
        // Generic validation for other layers
        else {
          result.validationResults.layerExistence.warnings.push(`${layerName}: No specific validation implemented yet`);
          result.overallStatus = 'passed'; // Assume OK if no issues
        }
        
      } catch (error) {
        console.error(`❌ ${layerName}: Validation failed with exception:`, error);
        result.overallStatus = 'error';
        result.error = error.message;
        result.validationResults.layerExistence.errors.push(`Validation exception: ${error.message}`);
      }
      
      results.effects[layerName] = result;
    }
    
    // Add missing known effects for completeness
    const knownEffects = ['MetallicShineLayer', 'CloudShadowsLayer', 'LightningLayer', 'CanopyLayer', 'GroundGlowLayer', 'StructuralShadowsLayer', 'IridescenceLayer'];
    for (const effectName of knownEffects) {
      if (!results.effects[effectName]) {
        results.effects[effectName] = {
          name: effectName,
          found: false,
          hasValidation: false,
          overallStatus: 'not_found',
          validationResults: {
            layerExistence: { errors: [`${effectName} not found in canvas.layers - may be disabled`], warnings: [] }
          }
        };
      }
    }
    
    // Calculate summary
    const allEffects = Object.values(results.effects);
    results.summary.total = allEffects.length;
    results.summary.passed = allEffects.filter(r => r.overallStatus === 'passed').length;
    results.summary.failed = allEffects.filter(r => r.overallStatus === 'failed' || r.overallStatus === 'error').length;
    results.summary.warnings = allEffects.filter(r => r.validationResults && 
      Object.values(r.validationResults).some(cat => cat.warnings && cat.warnings.length > 0)).length;

    return results;
  }
  
  /**
   * Validate a single effect by name
   * 
   * @param {string} effectName - Name of the effect to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation result for the effect
   */
  static async validateSingleEffect(effectName, options = {}) {
    console.log(`🔍 Validating single effect: ${effectName}`);
    
    const result = {
      timestamp: new Date().toISOString(),
      effectName,
      options,
      validationResults: null,
      overallStatus: 'unknown'
    };
    
    try {
      switch (effectName) {
        case 'MetallicShineLayer':
          return await this.validateMetallicShineLayer({ effects: {} }, options);
        case 'CloudShadowsLayer':
          return await this.validateCloudShadowsLayer({ effects: {} }, options);
        default:
          console.warn(`⚠️ Unknown effect: ${effectName}`);
          result.overallStatus = 'unknown_effect';
          return result;
      }
    } catch (error) {
      console.error(`❌ Error validating ${effectName}:`, error);
      result.error = error.message;
      result.overallStatus = 'error';
      return result;
    }
  }
  
  /**
   * Validate MetallicShineLayer with comprehensive diagnostics
   */
  static async validateMetallicShineLayer(results, options = {}) {
    const effectName = 'MetallicShineLayer';
    console.log(`🔍 Validating ${effectName}...`);
    
    const result = {
      name: effectName,
      found: false,
      initialized: false,
      visible: false,
      hasValidation: false,
      validationResults: {
        textures: { passed: 0, failed: 0, errors: [], warnings: [] },
        shaders: { passed: 0, failed: 0, errors: [], warnings: [] },
        configuration: { passed: 0, failed: 0, errors: [], warnings: [] },
        dependencies: { passed: 0, failed: 0, errors: [], warnings: [] },
        rendering: { passed: 0, failed: 0, errors: [], warnings: [] }
      },
      overallStatus: 'unknown'
    };

    try {
      // Find the MetallicShineLayer instance
      const metallicLayer = canvas.layers?.find(l => l instanceof MetallicShineLayer);
      if (!metallicLayer) {
        console.log(`❌ ${effectName}: Layer not found`);
        result.overallStatus = 'not_found';
        results.effects[effectName] = result;
        return result;
      }

      result.found = true;
      result.initialized = metallicLayer.initialized ?? false;
      result.visible = metallicLayer.visible ?? false;

      // Check for validation methods
      result.hasValidation = typeof metallicLayer._validateStartupState === 'function';

      if (result.hasValidation) {
        // Capture console output during validation
        const originalConsole = { log: console.log, warn: console.warn, error: console.error };
        const validationOutput = { errors: [], warnings: [], info: [] };
        
        console.log = (...args) => {
          const message = args.join(' ');
          if (message.includes('❌')) validationOutput.errors.push(message);
          else if (message.includes('⚠️')) validationOutput.warnings.push(message);
          else if (message.includes('✅')) validationOutput.info.push(message);
          originalConsole.log(...args);
        };
        
        console.warn = (...args) => {
          validationOutput.warnings.push(args.join(' '));
          originalConsole.warn(...args);
        };
        
        console.error = (...args) => {
          validationOutput.errors.push(args.join(' '));
          originalConsole.error(...args);
        };

        try {
          await metallicLayer._validateStartupState();
        } catch (error) {
          validationOutput.errors.push(`Validation exception: ${error.message}`);
        } finally {
          // Restore console
          Object.assign(console, originalConsole);
        }

        result.validationOutput = validationOutput;
        
        // Parse validation output into structured results
        this.parseValidationOutput(effectName, validationOutput, result.validationResults);
        
        // Determine overall status
        const totalErrors = Object.values(result.validationResults)
          .reduce((sum, category) => sum + (category.errors?.length || 0), 0);
        
        result.overallStatus = totalErrors === 0 ? 'passed' : 'failed';
        result.errorCount = totalErrors;
        result.warningCount = validationOutput.warnings.length;
        
      } else {
        console.log(`⚠️ ${effectName}: Validation methods not implemented`);
        result.overallStatus = 'no_validation';
      }

    } catch (error) {
      console.error(`❌ ${effectName}: Validation failed with exception:`, error);
      result.overallStatus = 'error';
      result.error = error.message;
    }

    results.effects[effectName] = result;
    return result;
  }
  
  /**
   * Validate CloudShadowsLayer with detailed diagnostics
   */
  static async validateCloudShadowsLayer(results, options = {}) {
    const effectName = 'CloudShadowsLayer';
    console.log(`🔍 Validating ${effectName}...`);
    
    const result = {
      name: effectName,
      found: false,
      visible: false,
      hasValidation: false,
      validationResults: {
        layerExistence: { passed: 0, failed: 0, errors: [], warnings: [] },
        textures: { errors: [], warnings: [] },
        shaders: { errors: [], warnings: [] },
        filters: { errors: [], warnings: [] },
        uniforms: { errors: [], warnings: [] },
        resources: { errors: [], warnings: [] }
      },
      overallStatus: 'unknown',
      diagnostics: {
        layerClass: null,
        filterClass: null,
        shaderPrograms: null,
        textureCount: 0,
        uniformCount: 0
      }
    };

    try {
      // Check if CloudShadowsLayer class exists
      if (typeof CloudShadowsLayer === 'undefined') {
        result.validationResults.layerExistence.errors.push('CloudShadowsLayer class not defined - module may not be loaded');
        console.log(`❌ ${effectName}: CloudShadowsLayer class not found`);
        result.overallStatus = 'class_not_found';
        results.effects[effectName] = result;
        return result;
      }
      result.diagnostics.layerClass = 'CloudShadowsLayer';

      const cloudLayer = canvas.layers?.find(l => l instanceof CloudShadowsLayer);
      if (!cloudLayer) {
        result.validationResults.layerExistence.errors.push('CloudShadowsLayer instance not found in canvas.layers - may be disabled or not yet initialized');
        console.log(`❌ ${effectName}: Layer instance not found`);
        result.overallStatus = 'not_found';
        results.effects[effectName] = result;
        return result;
      }

      // Test actual validation methods that exist
      result.hasValidation = false;
      const existingValidationMethods = [];
      
      if (typeof cloudLayer._validateCloudTexture === 'function') {
        existingValidationMethods.push('_validateCloudTexture');
        result.hasValidation = true;
        
        try {
          const textureValid = cloudLayer._validateCloudTexture();
          if (!textureValid) {
            result.validationResults.textures.errors.push('Cloud texture validation failed - texture may not be loaded or valid');
            console.log(`❌ ${effectName}: Cloud texture validation failed`);
          } else {
            result.validationResults.textures.warnings.push('Cloud texture validation passed');
            console.log(`✅ ${effectName}: Cloud texture validation passed`);
          }
        } catch (error) {
          result.validationResults.textures.errors.push(`Cloud texture validation threw exception: ${error.message}`);
        }
      }
      
      // Check for other validation methods that might exist
      const otherValidationMethods = ['_validateTextures', '_validateShaders', '_validateRuntimeState'];
      otherValidationMethods.forEach(method => {
        if (typeof cloudLayer[method] === 'function') {
          existingValidationMethods.push(method);
          result.hasValidation = true;
          result.validationResults.layerExistence.warnings.push(`Additional validation method available: ${method}`);
        }
      });
      
      if (!result.hasValidation) {
        result.validationResults.layerExistence.warnings.push('No validation methods implemented on CloudShadowsLayer - consider adding _validateCloudTexture()');
      }
      
      console.log(`🔍 ${effectName}: Validation methods found: ${existingValidationMethods.join(', ') || 'None'}`);

      // Check filter existence and type
      if (cloudLayer.cloudShadowsFilter) {
        result.diagnostics.filterClass = cloudLayer.cloudShadowsFilter.constructor?.name || 'Unknown';
        console.log(`🔍 ${effectName}: Filter found (${result.diagnostics.filterClass})`);
      } else {
        result.validationResults.filters.errors.push('CloudShadowsFilter not found on layer - filter may not be initialized');
        console.log(`❌ ${effectName}: CloudShadowsFilter missing`);
      }

      // Detailed shader compilation checks
      if (cloudLayer.cloudShadowsFilter) {
        const filter = cloudLayer.cloudShadowsFilter;
        
        // Check shader program
        if (filter.glProgram) {
          result.diagnostics.shaderPrograms = {
            fragmentShaderCompiled: filter.glProgram.fragmentShader?.glShader !== null,
            vertexShaderCompiled: filter.glProgram.vertexShader?.glShader !== null,
            fragmentShaderSource: filter.glProgram.fragmentShader?.glProgram ? 'Available' : 'Missing',
            vertexShaderSource: filter.glProgram.vertexShader?.glProgram ? 'Available' : 'Missing'
          };

          if (filter.glProgram.fragmentShader?.glShader === null) {
            result.validationResults.shaders.errors.push('Fragment shader failed to compile - check shader syntax and uniforms');
            console.log(`❌ ${effectName}: Fragment shader compilation failed`);
          }
          if (filter.glProgram.vertexShader?.glShader === null) {
            result.validationResults.shaders.errors.push('Vertex shader failed to compile - check attribute declarations and varying variables');
            console.log(`❌ ${effectName}: Vertex shader compilation failed`);
          }
        } else {
          result.validationResults.shaders.errors.push('GL program not available - shaders may not have been compiled');
        }
        
        // Check uniforms in detail
        if (filter.uniforms) {
          result.diagnostics.uniformCount = Object.keys(filter.uniforms).length;
          const requiredUniforms = ['uCloudTexture', 'uCloudTextureSize', 'uCloudThreshold', 'uTime', 'uResolution'];
          const foundUniforms = [];
          const missingUniforms = [];
          const invalidUniforms = [];
          
          for (const uniform of requiredUniforms) {
            if (uniform in filter.uniforms) {
              foundUniforms.push(uniform);
              if (filter.uniforms[uniform] === null || filter.uniforms[uniform] === undefined) {
                invalidUniforms.push(uniform);
                result.validationResults.uniforms.errors.push(`Uniform '${uniform}' exists but has null/undefined value`);
              }
            } else {
              missingUniforms.push(uniform);
              result.validationResults.uniforms.errors.push(`Missing required uniform: ${uniform}`);
            }
          }
          
          // Check for texture uniforms specifically
          const textureUniforms = ['uCloudTexture'];
          for (const uniform of textureUniforms) {
            if (uniform in filter.uniforms) {
              const texture = filter.uniforms[uniform];
              if (texture && texture.baseTexture) {
                if (!texture.baseTexture.valid) {
                  result.validationResults.textures.errors.push(`Texture uniform '${uniform}' references invalid texture`);
                } else {
                  result.validationResults.textures.warnings.push(`Texture uniform '${uniform}' is valid`);
                }
              } else {
                result.validationResults.textures.errors.push(`Texture uniform '${uniform}' references null or invalid texture`);
              }
            }
          }
          
          console.log(`🔍 ${effectName}: Found ${foundUniforms.length}/${requiredUniforms.length} required uniforms`);
          if (missingUniforms.length > 0) {
            console.log(`   Missing: ${missingUniforms.join(', ')}`);
          }
          if (invalidUniforms.length > 0) {
            console.log(`   Invalid: ${invalidUniforms.join(', ')}`);
          }
        } else {
          result.validationResults.uniforms.errors.push('No uniforms found on filter - filter may not be properly initialized');
        }
      } else {
        result.validationResults.filters.errors.push('Cannot check shaders/uniforms - CloudShadowsFilter not available');
      }

      // Resource manager checks
      if (game.mapShine?.resourceManager) {
        try {
          const cloudTexture = game.mapShine.resourceManager.getRawCloudTexture(0);
          if (!cloudTexture) {
            result.validationResults.resources.errors.push('Resource manager cannot provide cloud texture');
          } else if (!cloudTexture.valid) {
            result.validationResults.resources.errors.push('Cloud texture from resource manager is invalid');
          } else {
            result.validationResults.resources.warnings.push('Resource manager cloud texture is valid');
            result.diagnostics.textureCount = 1;
          }
        } catch (error) {
          result.validationResults.resources.errors.push(`Resource manager error: ${error.message}`);
        }
      } else {
        result.validationResults.resources.errors.push('Map Shine resource manager not available');
      }

      // Calculate overall status
      const allErrors = [
        ...result.validationResults.layerExistence.errors,
        ...result.validationResults.textures.errors,
        ...result.validationResults.shaders.errors,
        ...result.validationResults.filters.errors,
        ...result.validationResults.uniforms.errors,
        ...result.validationResults.resources.errors
      ];
      
      const allWarnings = [
        ...result.validationResults.textures.warnings,
        ...result.validationResults.shaders.warnings,
        ...result.validationResults.filters.warnings,
        ...result.validationResults.uniforms.warnings,
        ...result.validationResults.resources.warnings
      ];

      result.overallStatus = allErrors.length === 0 ? 'passed' : 'failed';
      result.errorCount = allErrors.length;
      result.warningCount = allWarnings.length;

      // Log detailed summary
      console.log(`\n📊 ${effectName} Validation Summary:`);
      console.log(`   Layer: ${result.found ? '✅ Found' : '❌ Missing'} (Visible: ${result.visible})`);
      console.log(`   Filter: ${cloudLayer.cloudShadowsFilter ? '✅ Available' : '❌ Missing'}`);
      console.log(`   Shader Program: ${result.diagnostics.shaderPrograms ? '✅ Available' : '❌ Missing'}`);
      console.log(`   Uniforms: ${result.diagnostics.uniformCount} found`);
      console.log(`   Textures: ${result.diagnostics.textureCount} valid`);
      console.log(`   Errors: ${result.errorCount}, Warnings: ${result.warningCount}`);

    } catch (error) {
      console.error(`❌ ${effectName}: Validation failed with exception:`, error);
      result.overallStatus = 'error';
      result.error = error.message;
      result.validationResults.layerExistence.errors.push(`Validation exception: ${error.message}`);
    }

    results.effects[effectName] = result;
    return result;
  }
  
  /**
   * Scan for other Map Shine effect layers
   */
  static async validateOtherEffects(results) {
    const otherEffectClasses = [
      ['AnimatedFogLayer', AnimatedFogLayer],
      ['AnimatedLightLayer', AnimatedLightLayer], 
      ['AnimatedLightningLayer', AnimatedLightningLayer],
      ['AnimatedFireLayer', AnimatedFireLayer],
      ['AnimatedCausticsLayer', AnimatedCausticsLayer],
      ['GodRaysLayer', GodRaysLayer],
      ['FlowMapRipplesLayer', FlowMapRipplesLayer],
      ['WaterSurfaceLayer', WaterSurfaceLayer],
      ['RainDropRipplesLayer', RainDropRipplesLayer],
      ['AnimatedAtmosphereLayer', AnimatedAtmosphereLayer],
      ['StarfieldLayer', StarfieldLayer],
      ['BiofilmLayer', BiofilmLayer]
    ];

    for (const [className, effectClass] of otherEffectClasses) {
      const result = {
        name: className,
        found: false,
        hasValidation: false,
        overallStatus: 'not_available'
      };

      try {
        // Find layer instance
        const layer = canvas.layers?.find(l => l.constructor.name === className);
        if (layer) {
          result.found = true;
          result.visible = layer.visible ?? false;
          
          // Check for validation methods
          result.hasValidation = typeof layer._validateStartupState === 'function' ||
                                 typeof layer._validateTextures === 'function' ||
                                 typeof layer._validateShaders === 'function';
          
          if (result.hasValidation) {
            result.overallStatus = 'validation_available';
            console.log(`✅ ${className}: Found with validation available`);
          } else {
            result.overallStatus = 'no_validation';
            console.log(`⚠️ ${className}: Found but no validation implemented`);
          }
        } else {
          console.log(`ℹ️ ${className}: Not active on current scene`);
        }
      } catch (error) {
        console.error(`❌ ${className}: Error checking layer:`, error);
        result.overallStatus = 'error';
        result.error = error.message;
      }

      results.effects[className] = result;
    }
  }
  
  /**
   * Parse validation output from captured console messages
   */
  static parseValidationOutput(effectName, validationOutput, validationResults) {
    for (const message of [...validationOutput.errors, ...validationOutput.warnings, ...validationOutput.info]) {
      if (!message.includes(effectName)) continue;
      
      // Texture validation
      if (message.includes('texture')) {
        if (message.includes('❌')) {
          validationResults.textures.errors.push(message);
          validationResults.textures.failed++;
        } else if (message.includes('⚠️')) {
          validationResults.textures.warnings.push(message);
        } else if (message.includes('✅') && message.includes('passed')) {
          validationResults.textures.passed++;
        }
      }
      
      // Shader validation
      else if (message.includes('shader') || message.includes('uniform')) {
        if (message.includes('❌')) {
          validationResults.shaders.errors.push(message);
          validationResults.shaders.failed++;
        } else if (message.includes('⚠️')) {
          validationResults.shaders.warnings.push(message);
        } else if (message.includes('✅') && message.includes('passed')) {
          validationResults.shaders.passed++;
        }
      }
      
      // Configuration validation
      else if (message.includes('config') || message.includes('setting')) {
        if (message.includes('❌')) {
          validationResults.configuration.errors.push(message);
          validationResults.configuration.failed++;
        } else if (message.includes('⚠️')) {
          validationResults.configuration.warnings.push(message);
        } else if (message.includes('✅') && message.includes('passed')) {
          validationResults.configuration.passed++;
        }
      }
      
      // Dependency validation
      else if (message.includes('manager') || message.includes('system')) {
        if (message.includes('❌')) {
          validationResults.dependencies.errors.push(message);
          validationResults.dependencies.failed++;
        } else if (message.includes('⚠️')) {
          validationResults.dependencies.warnings.push(message);
        } else if (message.includes('✅') && message.includes('passed')) {
          validationResults.dependencies.passed++;
        }
      }
      
      // Rendering validation
      else if (message.includes('render') || message.includes('container') || message.includes('sprite')) {
        if (message.includes('❌')) {
          validationResults.rendering.errors.push(message);
          validationResults.rendering.failed++;
        } else if (message.includes('⚠️')) {
          validationResults.rendering.warnings.push(message);
        } else if (message.includes('✅') && message.includes('passed')) {
          validationResults.rendering.passed++;
        }
      }
    }
  }
  
  /**
   * Calculate summary statistics
   */
  static calculateSummary(results) {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const result of Object.values(results.effects)) {
      total++;
      
      if (result.overallStatus === 'passed') {
        passed++;
      } else if (result.overallStatus === 'failed' || result.overallStatus === 'error') {
        failed++;
      }
      
      if (result.validationOutput) {
        warnings += result.validationOutput.warnings?.length || 0;
      }
    }

    results.summary = { total, passed, failed, warnings };
  }
  
  /**
   * Generate validation summary for console output
   */
  static generateSummary(results) {
    console.log('\n🚨 VALIDATION SUMMARY');
    console.log('=======================');
    console.log(`Total Effects: ${results.summary.total}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⚠️  Warnings: ${results.summary.warnings}`);
    console.log(`🔧 Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Effect Status:');
    for (const [effectName, result] of Object.entries(results.effects)) {
      const status = result.overallStatus === 'passed' ? '✅' : 
                     result.overallStatus === 'failed' ? '❌' : 
                     result.overallStatus === 'error' ? '💥' : 
                     result.overallStatus === 'not_found' ? '👻' : 
                     result.overallStatus === 'no_validation' ? '⭕' : '❓';
      const validation = result.hasValidation || result.validationResults ? '🔍' : '⭕';
      console.log(`   ${status} ${validation} ${effectName}: ${result.overallStatus}`);
    }
  }
}

// Make available globally for browser console access
window.EffectValidator = EffectValidator;

console.log('🚨 Effect Validator loaded and available as window.EffectValidator');
