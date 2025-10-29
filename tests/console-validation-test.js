/**
 * 🚨 Quick Console Validation Test
 * 
 * This is a standalone validation script that can be run directly in the browser console
 * to test the effect validation system without requiring a full Playwright test suite.
 * 
 * Usage: Copy and paste this entire script into the browser console after Map Shine has loaded
 */

(async function quickConsoleValidation() {
  console.log('%c🚨 Map Shine Quick Validation Test', 'color: #FF5722; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(60));
  
  const results = {
    timestamp: new Date().toISOString(),
    developmentMode: game.mapShine?.isDevelopmentMode ?? 'unknown',
    effects: {},
    summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
  };

  // Check if we're in the right environment
  if (!window.game || !game.mapShine) {
    console.error('❌ Map Shine not found. Make sure you are in a Foundry VTT world with Map Shine loaded.');
    return;
  }

  console.log(`✅ Foundry VTT detected`);
  console.log(`✅ Map Shine detected (initialized: ${game.mapShine.initialized})`);
  console.log(`🔧 Development Mode: ${results.developmentMode}`);

  // Function to validate an effect layer
  async function validateEffect(effectName, effectClass) {
    const effect = canvas.layers?.find(l => l instanceof effectClass);
    const result = {
      name: effectName,
      found: !!effect,
      initialized: effect?.initialized ?? false,
      visible: effect?.visible ?? false,
      hasValidation: false,
      overallStatus: 'not_found'
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

          await effect._validateStartupState();
          
          // Restore console
          Object.assign(console, originalConsole);
          
          result.validationOutput = validationOutput;
          result.overallStatus = validationOutput.errors.length === 0 ? 'passed' : 'failed';
          result.errorCount = validationOutput.errors.length;
          result.warningCount = validationOutput.warnings.length;
          
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

  // Test MetallicShineLayer (has comprehensive validation)
  const metallicResult = await validateEffect('MetallicShineLayer', MetallicShineLayer);
  
  // Test CloudShadowsLayer (has basic validation)
  const cloudResult = await validateEffect('CloudShadowsLayer', CloudShadowsLayer);
  
  // Test other effect layers (mostly without validation)
  const otherEffects = [
    ['GodRaysLayer', GodRaysLayer],
    ['FlowMapRipplesLayer', FlowMapRipplesLayer],
    ['WaterSurfaceLayer', WaterSurfaceLayer],
    ['RainDropRipplesLayer', RainDropRipplesLayer],
    ['StarfieldLayer', StarfieldLayer],
    ['BiofilmLayer', BiofilmLayer]
  ];

  for (const [name, cls] of otherEffects) {
    await validateEffect(name, cls);
  }

  // Print summary
  console.log('\\n' + '='.repeat(60));
  console.log('%c🚨 VALIDATION SUMMARY', 'color: #FF5722; font-size: 14px; font-weight: bold;');
  console.log('='.repeat(60));
  
  console.log(`\\n📊 Overall Results:`);
  console.log(`   Total Effects: ${results.summary.total}`);
  console.log(`   ✅ Passed: ${results.summary.passed}`);
  console.log(`   ❌ Failed: ${results.summary.failed}`);
  
  console.log(`\\n📋 Effect Status:`);
  for (const [effectName, result] of Object.entries(results.effects)) {
    const status = result.overallStatus === 'passed' ? '✅' : 
                   result.overallStatus === 'failed' ? '❌' : 
                   result.overallStatus === 'error' ? '💥' : 
                   result.overallStatus === 'validation_available' ? '🔍' : 
                   result.overallStatus === 'no_validation' ? '⭕' : '❓';
    const found = result.found ? '👁️' : '👻';
    console.log(`   ${status} ${found} ${effectName}: ${result.overallStatus}`);
    
    if (result.validationOutput) {
      if (result.validationOutput.errors.length > 0) {
        result.validationOutput.errors.forEach(error => 
          console.log(`      ❌ ${error}`)
        );
      }
      if (result.validationOutput.warnings.length > 0) {
        result.validationOutput.warnings.forEach(warning => 
          console.log(`      ⚠️  ${warning}`)
        );
      }
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
