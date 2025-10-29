/**
 * 🚨 Quick Validation Test - Run Directly in Browser Console
 * 
 * This script can be run directly in the browser console after Map Shine has loaded
 * to test the validation system without requiring Playwright automation.
 * 
 * Usage: 
 * 1. Start Foundry VTT with Map Shine
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter to run validation
 */

(async function quickValidationTest() {
  console.log('%c🚨 Quick Effect Validation Test', 'color: #FF5722; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  // Check if we're in the right environment
  if (!window.game || !game.mapShine) {
    console.error('❌ Map Shine not found. Make sure you are in a Foundry VTT world with Map Shine loaded.');
    return;
  }

  console.log(`✅ Foundry VTT detected`);
  console.log(`✅ Map Shine detected (initialized: ${game.mapShine.initialized})`);
  console.log(`🔧 Development Mode: ${game.mapShine?.isDevelopmentMode ?? 'unknown'}`);

  const results = {
    timestamp: new Date().toISOString(),
    developmentMode: game.mapShine?.isDevelopmentMode ?? 'unknown',
    effects: {},
    summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
  };

  // Function to validate an effect layer
  async function validateEffect(effectName, effectClass) {
    const effect = canvas.layers?.find(l => l instanceof effectClass);
    const result = {
      name: effectName,
      found: !!effect,
      initialized: effect?.initialized ?? false,
      visible: effect?.visible ?? false,
      hasValidation: false,
      overallStatus: 'not_found',
      validationOutput: { errors: [], warnings: [], info: [] }
    };

    if (effect) {
      result.hasValidation = typeof effect._validateStartupState === 'function' ||
                           typeof effect._validateTextures === 'function' ||
                           typeof effect._validateShaders === 'function';
      
      if (result.hasValidation && typeof effect._validateStartupState === 'function') {
        try {
          console.log(`🔍 Running validation for ${effectName}...`);
          
          // Capture console output during validation
          const originalConsole = { log: console.log, warn: console.warn, error: console.error };
          
          console.log = (...args) => {
            const message = args.join(' ');
            if (message.includes('❌')) result.validationOutput.errors.push(message);
            else if (message.includes('⚠️')) result.validationOutput.warnings.push(message);
            else if (message.includes('✅')) result.validationOutput.info.push(message);
            originalConsole.log(...args);
          };
          
          console.warn = (...args) => {
            result.validationOutput.warnings.push(args.join(' '));
            originalConsole.warn(...args);
          };
          
          console.error = (...args) => {
            result.validationOutput.errors.push(args.join(' '));
            originalConsole.error(...args);
          };

          await effect._validateStartupState();
          
          // Restore console
          Object.assign(console, originalConsole);
          
          result.overallStatus = result.validationOutput.errors.length === 0 ? 'passed' : 'failed';
          result.errorCount = result.validationOutput.errors.length;
          result.warningCount = result.validationOutput.warnings.length;
          
        } catch (error) {
          result.overallStatus = 'error';
          result.error = error.message;
          console.error(`❌ ${effectName} validation failed:`, error);
        }
      } else {
        result.overallStatus = result.hasValidation ? 'validation_available' : 'no_validation';
      }
    }

    results.effects[effectName] = result;
    results.summary.total++;
    
    if (result.overallStatus === 'passed') {
      results.summary.passed++;
    } else if (result.overallStatus === 'failed' || result.overallStatus === 'error') {
      results.summary.failed++;
    }
    
    return result;
  }

  // Test the main effects
  console.log('\\n🔍 Validating Key Effects...');
  
  // 1. MetallicShineLayer (comprehensive validation)
  const metallicResult = await validateEffect('MetallicShineLayer', MetallicShineLayer);
  
  // 2. CloudShadowsLayer (basic validation + shader check)
  console.log(`\\n🔍 Validating CloudShadowsLayer...`);
  const cloudResult = {
    name: 'CloudShadowsLayer',
    found: false,
    visible: false,
    validationResults: { textures: { errors: [] }, shaders: { errors: [] } },
    overallStatus: 'unknown'
  };

  try {
    const cloudLayer = canvas.layers?.find(l => l instanceof CloudShadowsLayer);
    if (!cloudLayer) {
      cloudResult.overallStatus = 'not_found';
      console.log(`❌ CloudShadowsLayer: Layer not found`);
    } else {
      cloudResult.found = true;
      cloudResult.visible = cloudLayer.visible ?? false;

      // Test basic texture validation
      if (typeof cloudLayer._validateCloudTexture === 'function') {
        const textureValid = cloudLayer._validateCloudTexture();
        if (!textureValid) {
          cloudResult.validationResults.textures.errors.push('Cloud texture validation failed');
          console.log(`❌ CloudShadowsLayer: Cloud texture validation failed`);
        } else {
          console.log(`✅ CloudShadowsLayer: Cloud texture validation passed`);
        }
      }

      // Check shader compilation
      if (cloudLayer.cloudShadowsFilter) {
        const filter = cloudLayer.cloudShadowsFilter;
        if (filter.glProgram?.fragmentShader?.glShader === null) {
          cloudResult.validationResults.shaders.errors.push('Fragment shader failed to compile');
          console.log(`❌ CloudShadowsLayer: Fragment shader compilation failed`);
        }
        if (filter.glProgram?.vertexShader?.glShader === null) {
          cloudResult.validationResults.shaders.errors.push('Vertex shader failed to compile');
          console.log(`❌ CloudShadowsLayer: Vertex shader compilation failed`);
        }
        
        const totalErrors = cloudResult.validationResults.textures.errors.length + cloudResult.validationResults.shaders.errors.length;
        cloudResult.overallStatus = totalErrors === 0 ? 'passed' : 'failed';
      } else {
        cloudResult.validationResults.shaders.errors.push('CloudShadowsFilter not found');
        cloudResult.overallStatus = 'failed';
      }
    }
  } catch (error) {
    console.error(`❌ CloudShadowsLayer validation failed:`, error);
    cloudResult.overallStatus = 'error';
    cloudResult.error = error.message;
  }

  results.effects['CloudShadowsLayer'] = cloudResult;
  results.summary.total++;
  if (cloudResult.overallStatus === 'passed') results.summary.passed++;
  else if (cloudResult.overallStatus === 'failed' || cloudResult.overallStatus === 'error') results.summary.failed++;

  // 3. Scan for other effects
  const otherEffects = [
    ['GodRaysLayer', GodRaysLayer],
    ['FlowMapRipplesLayer', FlowMapRipplesLayer],
    ['WaterSurfaceLayer', WaterSurfaceLayer],
    ['RainDropRipplesLayer', RainDropRipplesLayer],
    ['StarfieldLayer', StarfieldLayer],
    ['BiofilmLayer', BiofilmLayer]
  ];

  console.log(`\\n🔍 Scanning for other effects...`);
  for (const [name, cls] of otherEffects) {
    const result = {
      name: name,
      found: false,
      hasValidation: false,
      overallStatus: 'not_available'
    };

    try {
      const layer = canvas.layers?.find(l => l.constructor.name === name);
      if (layer) {
        result.found = true;
        result.visible = layer.visible ?? false;
        
        result.hasValidation = typeof layer._validateStartupState === 'function' ||
                               typeof layer._validateTextures === 'function' ||
                               typeof layer._validateShaders === 'function';
        
        result.overallStatus = result.hasValidation ? 'validation_available' : 'no_validation';
      }
    } catch (error) {
      result.overallStatus = 'error';
      result.error = error.message;
    }

    results.effects[name] = result;
    results.summary.total++;
  }

  // Calculate final summary
  const duration = Date.now() - startTime;
  
  // Print comprehensive results
  console.log('\\n' + '='.repeat(60));
  console.log('%c🚨 VALIDATION RESULTS', 'color: #FF5722; font-size: 14px; font-weight: bold;');
  console.log('='.repeat(60));
  
  console.log(`\\n📊 Overall Results:`);
  console.log(`   Total Effects: ${results.summary.total}`);
  console.log(`   ✅ Passed: ${results.summary.passed}`);
  console.log(`   ❌ Failed: ${results.summary.failed}`);
  console.log(`   ⚠️  Warnings: ${results.summary.warnings}`);
  console.log(`   ⏱️  Duration: ${duration}ms`);
  console.log(`   🔧 Development Mode: ${results.developmentMode}`);
  
  console.log(`\\n📋 Effect Status:`);
  for (const [effectName, result] of Object.entries(results.effects)) {
    const status = result.overallStatus === 'passed' ? '✅' : 
                   result.overallStatus === 'failed' ? '❌' : 
                   result.overallStatus === 'error' ? '💥' : 
                   result.overallStatus === 'not_found' ? '👻' : 
                   result.overallStatus === 'no_validation' ? '⭕' : 
                   result.overallStatus === 'validation_available' ? '🔍' : '❓';
    const found = result.found ? '👁️' : '👻';
    console.log(`   ${status} ${found} ${effectName}: ${result.overallStatus}`);
    
    if (result.validationOutput?.errors?.length > 0) {
      result.validationOutput.errors.forEach(error => 
        console.log(`      ❌ ${error}`)
      );
    }
    
    if (result.validationResults?.textures?.errors?.length > 0) {
      result.validationResults.textures.errors.forEach(error => 
        console.log(`      ❌ ${error}`)
      );
    }
    
    if (result.validationResults?.shaders?.errors?.length > 0) {
      result.validationResults.shaders.errors.forEach(error => 
        console.log(`      ❌ ${error}`)
      );
    }
  }
  
  console.log('\\n' + '='.repeat(60));
  console.log('%c🚨 QUICK VALIDATION COMPLETE', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
  console.log('='.repeat(60));
  console.log('🔗 Results available in: window.quickValidationResults');
  
  // Make results globally available
  window.quickValidationResults = results;
  
  return results;
})();
