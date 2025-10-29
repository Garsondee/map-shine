/**
 * 🚨 Effect Validation Diagnostic Script
 * 
 * This script runs comprehensive validation on all Map Shine effects
 * and outputs detailed diagnostic information to the console.
 * 
 * Usage: await runComprehensiveEffectValidation()
 */

class EffectValidationDiagnostics {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      developmentMode: game.mapShine?.isDevelopmentMode ?? 'unknown',
      effects: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Run validation on all available Map Shine effects
   */
  async runComprehensiveValidation() {
    console.log('%c🚨 Map Shine Effect Validation Diagnostics', 'color: #FF5722; font-size: 16px; font-weight: bold;');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log(`Development Mode: ${this.results.developmentMode}`);
    console.log('='.repeat(60));

    await this.validateMetallicShineLayer();
    await this.validateCloudShadowsLayer();
    await this.validateOtherEffects();

    this.printSummary();
    return this.results;
  }

  /**
   * Validate MetallicShineLayer with comprehensive diagnostics
   */
  async validateMetallicShineLayer() {
    const effectName = 'MetallicShineLayer';
    console.log(`\n🔍 Validating ${effectName}...`);
    
    const result = {
      name: effectName,
      found: false,
      initialized: false,
      visible: false,
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
        this.results.effects[effectName] = result;
        this.results.summary.total++;
        this.results.summary.failed++;
        return result;
      }

      result.found = true;
      result.initialized = metallicLayer.initialized ?? false;
      result.visible = metallicLayer.visible ?? false;

      console.log(`✅ ${effectName}: Found (initialized: ${result.initialized}, visible: ${result.visible})`);

      // Run validation if available
      if (typeof metallicLayer._validateStartupState === 'function') {
        // Clear console and capture validation output
        const originalConsole = console;
        const validationOutput = [];
        
        const captureConsole = {
          log: (...args) => validationOutput.push(['log', ...args]),
          warn: (...args) => validationOutput.push(['warn', ...args]),
          error: (...args) => validationOutput.push(['error', ...args]),
          clear: () => {}
        };

        // Temporarily replace console to capture validation output
        console.log = captureConsole.log;
        console.warn = captureConsole.warn;
        console.error = captureConsole.error;

        try {
          await metallicLayer._validateStartupState();
        } finally {
          // Restore original console
          console.log = originalConsole.log;
          console.warn = originalConsole.warn;
          console.error = originalConsole.error;
        }

        // Parse validation output
        this.parseValidationOutput(effectName, validationOutput, result.validationResults);

      } else {
        console.log(`⚠️  ${effectName}: Validation methods not implemented`);
        result.overallStatus = 'no_validation';
      }

    } catch (error) {
      console.error(`❌ ${effectName}: Validation failed with exception:`, error);
      result.overallStatus = 'error';
      result.error = error.message;
    }

    this.results.effects[effectName] = result;
    this.results.summary.total++;
    
    if (result.overallStatus === 'passed') {
      this.results.summary.passed++;
    } else if (result.overallStatus === 'failed' || result.overallStatus === 'error') {
      this.results.summary.failed++;
    }

    return result;
  }

  /**
   * Validate CloudShadowsLayer
   */
  async validateCloudShadowsLayer() {
    const effectName = 'CloudShadowsLayer';
    console.log(`\n🔍 Validating ${effectName}...`);
    
    const result = {
      name: effectName,
      found: false,
      visible: false,
      validationResults: {
        textures: { errors: [], warnings: [] },
        shaders: { errors: [], warnings: [] }
      },
      overallStatus: 'unknown'
    };

    try {
      const cloudLayer = canvas.layers?.find(l => l instanceof CloudShadowsLayer);
      if (!cloudLayer) {
        console.log(`❌ ${effectName}: Layer not found`);
        result.overallStatus = 'not_found';
        this.results.effects[effectName] = result;
        this.results.summary.total++;
        this.results.summary.failed++;
        return result;
      }

      result.found = true;
      result.visible = cloudLayer.visible ?? false;

      // Test basic texture validation
      if (typeof cloudLayer._validateCloudTexture === 'function') {
        const textureValid = cloudLayer._validateCloudTexture();
        if (!textureValid) {
          result.validationResults.textures.errors.push('Cloud texture validation failed');
          console.log(`❌ ${effectName}: Cloud texture validation failed`);
        } else {
          console.log(`✅ ${effectName}: Cloud texture validation passed`);
        }
      }

      // Check shader compilation
      if (cloudLayer.cloudShadowsFilter) {
        const filter = cloudLayer.cloudShadowsFilter;
        if (filter.glProgram?.fragmentShader?.glShader === null) {
          result.validationResults.shaders.errors.push('Fragment shader failed to compile');
          console.log(`❌ ${effectName}: Fragment shader compilation failed`);
        }
        if (filter.glProgram?.vertexShader?.glShader === null) {
          result.validationResults.shaders.errors.push('Vertex shader failed to compile');
          console.log(`❌ ${effectName}: Vertex shader compilation failed`);
        }
      }

      const totalErrors = result.validationResults.textures.errors.length + result.validationResults.shaders.errors.length;
      result.overallStatus = totalErrors === 0 ? 'passed' : 'failed';

    } catch (error) {
      console.error(`❌ ${effectName}: Validation failed with exception:`, error);
      result.overallStatus = 'error';
      result.error = error.message;
    }

    this.results.effects[effectName] = result;
    this.results.summary.total++;
    
    if (result.overallStatus === 'passed') {
      this.results.summary.passed++;
    } else if (result.overallStatus === 'failed' || result.overallStatus === 'error') {
      this.results.summary.failed++;
    }

    return result;
  }

  /**
   * Scan for other Map Shine effect layers
   */
  async validateOtherEffects() {
    const otherEffectClasses = [
      'LightningLayer',
      'CanopyLayer',
      'GroundGlowLayer',
      'StructuralShadowsLayer',
      'IridescenceLayer',
      'GodRaysLayer',
      'FlowMapRipplesLayer',
      'WaterSurfaceLayer',
      'RainDropRipplesLayer',
      'StarfieldLayer',
      'BiofilmLayer'
    ];

    for (const className of otherEffectClasses) {
      const effectName = className;
      console.log(`\n🔍 Validating ${effectName}...`);
      
      const result = {
        name: effectName,
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
            console.log(`✅ ${effectName}: Found with validation available`);
          } else {
            result.overallStatus = 'no_validation';
            console.log(`⚠️  ${effectName}: Found but no validation implemented`);
          }
        } else {
          console.log(`ℹ️  ${effectName}: Not active on current scene`);
        }
      } catch (error) {
        console.error(`❌ ${effectName}: Error checking layer:`, error);
        result.overallStatus = 'error';
        result.error = error.message;
      }

      this.results.effects[effectName] = result;
      this.results.summary.total++;
    }
  }

  /**
   * Parse validation output from captured console messages
   */
  parseValidationOutput(effectName, validationOutput, validationResults) {
    for (const [type, ...args] of validationOutput) {
      const message = args.join(' ');
      
      if (message.includes(effectName)) {
        // Texture validation
        if (message.includes('texture')) {
          if (type === 'error') {
            validationResults.textures.errors.push(message);
            validationResults.textures.failed++;
          } else if (type === 'warn') {
            validationResults.textures.warnings.push(message);
          } else if (type === 'log' && message.includes('passed')) {
            validationResults.textures.passed++;
          }
        }
        
        // Shader validation
        else if (message.includes('shader') || message.includes('uniform')) {
          if (type === 'error') {
            validationResults.shaders.errors.push(message);
            validationResults.shaders.failed++;
          } else if (type === 'warn') {
            validationResults.shaders.warnings.push(message);
          } else if (type === 'log' && message.includes('passed')) {
            validationResults.shaders.passed++;
          }
        }
        
        // Configuration validation
        else if (message.includes('config') || message.includes('setting')) {
          if (type === 'error') {
            validationResults.configuration.errors.push(message);
            validationResults.configuration.failed++;
          } else if (type === 'warn') {
            validationResults.configuration.warnings.push(message);
          } else if (type === 'log' && message.includes('passed')) {
            validationResults.configuration.passed++;
          }
        }
        
        // Dependency validation
        else if (message.includes('manager') || message.includes('system')) {
          if (type === 'error') {
            validationResults.dependencies.errors.push(message);
            validationResults.dependencies.failed++;
          } else if (type === 'warn') {
            validationResults.dependencies.warnings.push(message);
          } else if (type === 'log' && message.includes('passed')) {
            validationResults.dependencies.passed++;
          }
        }
        
        // Rendering validation
        else if (message.includes('render') || message.includes('container') || message.includes('sprite')) {
          if (type === 'error') {
            validationResults.rendering.errors.push(message);
            validationResults.rendering.failed++;
          } else if (type === 'warn') {
            validationResults.rendering.warnings.push(message);
          } else if (type === 'log' && message.includes('passed')) {
            validationResults.rendering.passed++;
          }
        }
      }
    }
  }

  /**
   * Print comprehensive summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('%c🚨 VALIDATION SUMMARY', 'color: #FF5722; font-size: 14px; font-weight: bold;');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Effects: ${this.results.summary.total}`);
    console.log(`   ✅ Passed: ${this.results.summary.passed}`);
    console.log(`   ❌ Failed: ${this.results.summary.failed}`);
    console.log(`   ⚠️  Warnings: ${this.results.summary.warnings}`);
    
    console.log(`\n📋 Effect Status:`);
    for (const [effectName, result] of Object.entries(this.results.effects)) {
      const status = result.overallStatus === 'passed' ? '✅' : 
                     result.overallStatus === 'failed' ? '❌' : 
                     result.overallStatus === 'error' ? '💥' : '❓';
      const validation = result.hasValidation || result.validationResults ? '🔍' : '⭕';
      console.log(`   ${status} ${validation} ${effectName}: ${result.overallStatus}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('%c🚨 DIAGNOSTIC COMPLETE', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
    console.log('='.repeat(60));
  }

  /**
   * Export results as structured data
   */
  exportResults() {
    return {
      ...this.results,
      exportTime: new Date().toISOString()
    };
  }
}

/**
 * Main function to run comprehensive effect validation
 * Usage: await runComprehensiveEffectValidation()
 */
async function runComprehensiveEffectValidation() {
  const diagnostics = new EffectValidationDiagnostics();
  const results = await diagnostics.runComprehensiveValidation();
  
  // Make results globally available for debugging
  window.mapShineValidationResults = results;
  
  console.log('\n🔗 Results available in: window.mapShineValidationResults');
  return results;
}

/**
 * Quick validation function for individual effects
 * Usage: await validateSingleEffect('MetallicShineLayer')
 */
async function validateSingleEffect(effectClassName) {
  const diagnostics = new EffectValidationDiagnostics();
  
  if (effectClassName === 'MetallicShineLayer') {
    return await diagnostics.validateMetallicShineLayer();
  } else if (effectClassName === 'CloudShadowsLayer') {
    return await diagnostics.validateCloudShadowsLayer();
  } else {
    console.warn(`Single effect validation not implemented for: ${effectClassName}`);
    return null;
  }
}

// Export functions for global access
window.runComprehensiveEffectValidation = runComprehensiveEffectValidation;
window.validateSingleEffect = validateSingleEffect;

console.log('%c🚨 Effect Validation Diagnostics Loaded', 'color: #2196F3; font-weight: bold;');
console.log('Usage: await runComprehensiveEffectValidation()');
