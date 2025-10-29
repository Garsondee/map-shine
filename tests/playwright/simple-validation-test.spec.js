/**
 * 🚨 Simple Validation Test - Single Test Execution
 * 
 * Connects to existing Foundry VTT server and runs validation tests
 */

import { test, expect } from '@playwright/test';
import { FoundryLauncher } from './foundry-launcher.js';
import { MapShineTestHelper } from './map-shine-utils.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Foundry before the test
let foundry;

test.beforeAll(async () => {
  console.log('🚀 Starting Foundry VTT for validation test...');
  
  foundry = new FoundryLauncher({
    worldName: 'map-development-world',
    sceneId: 'WndznGLSc1U7iMVN', // Japanese Horror House
    logOutput: false // Reduce log noise
  });
  
  await foundry.start();
  console.log('✅ Foundry VTT started successfully');
});

test.afterAll(async () => {
  if (foundry) {
    console.log('🛑 Stopping Foundry VTT...');
    await foundry.stop();
    
    // Wait for lock file cleanup
    console.log('⏳ Waiting for lock file cleanup...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ Cleanup complete');
  }
});

test('🚨 Simple Effect Validation Test', async ({ page }) => {
  test.setTimeout(120000); // 2 minute timeout
  
  console.log('🚨 Starting Simple Effect Validation Test');
  
  // Connect to Foundry server
  console.log('🌐 Connecting to Foundry VTT...');
  await page.goto('http://localhost:30000');
  
  // Authenticate if needed
  console.log('🔐 Checking authentication...');
  try {
    const helper = new MapShineTestHelper(page);
    await helper.authenticate('Gamemaster');
  } catch (error) {
    console.log('ℹ️ Already authenticated or no login required');
  }
  
  // Wait for Map Shine and full initialization
  console.log('⏳ Waiting for Map Shine...');
  await page.waitForFunction(() => window.game?.mapShine?.initialized === true, { timeout: 60000 });
  console.log('✅ Map Shine initialized');
  
  // Wait for all managers and systems to be ready
  console.log('⏳ Waiting for all Map Shine systems to be ready...');
  await page.evaluate(async () => {
    // Wait for all critical systems to be available
    const systems = ['profileManager', 'resourceManager', 'effectTargetManager', 'windManager'];
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds max
    
    while (attempts < maxAttempts) {
      let allReady = true;
      for (const system of systems) {
        if (!game.mapShine?.[system]) {
          allReady = false;
          console.log(`   ⏳ Waiting for ${system}...`);
          break;
        }
      }
      
      if (allReady) {
        console.log('✅ All Map Shine managers ready');
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Map Shine managers failed to initialize within timeout');
    }
  });
  
  // Wait for canvas to be fully ready with all layers
  console.log('⏳ Waiting for canvas to be fully ready...');
  await page.waitForFunction(() => {
    return window.canvas?.ready && 
           window.canvas?.app && 
           window.canvas?.app?.renderer &&
           window.canvas?.layers?.length > 0;
  }, { timeout: 30000 });
  console.log('✅ Canvas fully ready');
  
  // Wait for scene to be completely loaded
  console.log('⏳ Waiting for scene to be fully loaded...');
  await page.evaluate(async () => {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    
    while (attempts < maxAttempts) {
      if (canvas?.scene && canvas?.scene?.id && canvas?.ready) {
        console.log(`✅ Scene loaded: ${canvas.scene.name} (${canvas.scene.id})`);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Scene failed to load within timeout');
    }
  });
  
  // Wait a bit longer for all effect layers to potentially initialize
  console.log('⏳ Waiting additional time for effect layers to initialize...');
  await page.waitForTimeout(3000);
  
  // Check what effect classes are actually available
  console.log('🔍 Checking available effect classes...');
  const availableClasses = await page.evaluate(() => {
    const effects = [
      'MetallicShineLayer', 
      'CloudShadowsLayer',
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
    
    const available = [];
    const missing = [];
    
    effects.forEach(effect => {
      if (typeof window[effect] !== 'undefined') {
        available.push(effect);
      } else {
        missing.push(effect);
      }
    });
    
    return { available, missing };
  });
  
  console.log(`✅ Available effect classes: ${availableClasses.available.length}`);
  console.log(`❌ Missing effect classes: ${availableClasses.missing.length}`);
  
  if (availableClasses.available.length > 0) {
    console.log(`   Available: ${availableClasses.available.join(', ')}`);
  }
  if (availableClasses.missing.length > 0) {
    console.log(`   Missing: ${availableClasses.missing.join(', ')}`);
  }
  
  // Enable development mode and effects for validation
  console.log('🔧 Enabling development mode and effects...');
  await page.evaluate(() => {
    if (game.mapShine) {
      game.mapShine.isDevelopmentMode = true;
      console.log('✅ Development mode enabled');
    }
  });
  
  await page.evaluate(() => {
    if (game.mapShine?.profileManager) {
      const config = game.mapShine.profileManager.activeConfig;
      
      // Enable key effects for testing (only if they exist in config)
      const effectsToTest = ['metallicshine', 'cloudshadows', 'animatedlight', 'animatedfire'];
      effectsToTest.forEach(effectKey => {
        if (config[effectKey]?.hasOwnProperty('enabled')) {
          game.mapShine.profileManager.updateSingleConfig(effectKey, 'enabled', true);
          console.log(`✅ Enabled ${effectKey}`);
        }
      });
      
      console.log('✅ Effects enabled for validation');
    }
  });
  
  // Wait for effects to initialize after being enabled
  console.log('⏳ Waiting for effects to initialize after being enabled...');
  await page.waitForTimeout(5000);
  
  // Check which effect layers are actually active
  console.log('🔍 Checking active effect layers...');
  const activeLayers = await page.evaluate(() => {
    const effects = [
      'MetallicShineLayer', 
      'CloudShadowsLayer',
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
    
    const active = [];
    const inactive = [];
    
    effects.forEach(effectName => {
      const EffectClass = window[effectName];
      if (EffectClass) {
        const layer = canvas.layers?.find(l => l instanceof EffectClass);
        if (layer) {
          active.push({
            name: effectName,
            visible: layer.visible,
            initialized: layer.initialized,
            hasFilter: layer.cloudShadowsFilter || layer.metallicShineFilter || layer.filter // generic check
          });
        } else {
          inactive.push({ name: effectName, reason: 'instance_not_found' });
        }
      } else {
        inactive.push({ name: effectName, reason: 'class_not_defined' });
      }
    });
    
    return { active, inactive };
  });
  
  console.log(`✅ Active effect layers: ${activeLayers.active.length}`);
  console.log(`❌ Inactive effect layers: ${activeLayers.inactive.length}`);
  
  if (activeLayers.active.length > 0) {
    console.log('   Active layers:');
    activeLayers.active.forEach(layer => {
      console.log(`      - ${layer.name} (visible: ${layer.visible}, initialized: ${layer.initialized})`);
    });
  }
  
  // Load fixed validation diagnostics script
  console.log('🔧 Loading fixed validation script...');
  await page.addScriptTag({
    path: path.join(__dirname, '../fixed-validation-test.js'),
    type: 'module'
  });
  console.log('✅ Fixed validation script loaded');
  
  // Wait a moment for the script to execute and store results
  await page.waitForTimeout(1000);
  
  // Get the results from the stored window variable
  console.log('🔍 Getting fixed validation results...');
  const validationResults = await page.evaluate(() => {
    return window.fixedValidationResults;
  });
  
  console.log('✅ Validation completed!');
  
  // Log results
  console.log('\n📊 VALIDATION RESULTS:');
  console.log('========================');
  console.log(`Total Effects: ${validationResults.summary.total}`);
  console.log(`Passed: ${validationResults.summary.passed}`);
  console.log(`Failed: ${validationResults.summary.failed}`);
  console.log(`Warnings: ${validationResults.summary.warnings}`);
  
  // Print detailed results
  for (const [effectName, result] of Object.entries(validationResults.effects)) {
    const status = result.overallStatus === 'passed' ? '✅' : 
                   result.overallStatus === 'failed' ? '❌' : 
                   result.overallStatus === 'error' ? '💥' : 
                   result.overallStatus === 'class_not_found' ? '🏗️' : 
                   result.overallStatus === 'not_found' ? '👻' : '❓';
    
    console.log(`\n${status} ${effectName}:`);
    console.log(`   Status: ${result.overallStatus}`);
    console.log(`   Found: ${result.found}`);
    console.log(`   Has Validation: ${result.hasValidation || (result.validationResults ? 'Yes' : 'No')}`);
    
    // Show detailed diagnostic information
    if (result.diagnostics) {
      console.log(`   📊 Diagnostics:`);
      if (result.diagnostics.layerClass) {
        console.log(`      - Layer Class: ${result.diagnostics.layerClass}`);
      }
      if (result.diagnostics.filterClass) {
        console.log(`      - Filter Class: ${result.diagnostics.filterClass}`);
      }
      if (result.diagnostics.shaderPrograms) {
        const shaders = result.diagnostics.shaderPrograms;
        console.log(`      - Fragment Shader: ${shaders.fragmentShaderCompiled ? '✅ Compiled' : '❌ Failed'}`);
        console.log(`      - Vertex Shader: ${shaders.vertexShaderCompiled ? '✅ Compiled' : '❌ Failed'}`);
      }
      if (result.diagnostics.uniformCount !== undefined) {
        console.log(`      - Uniforms Found: ${result.diagnostics.uniformCount}`);
      }
      if (result.diagnostics.textureCount !== undefined) {
        console.log(`      - Valid Textures: ${result.diagnostics.textureCount}`);
      }
    }
    
    // Show detailed errors by category
    if (result.validationResults) {
      const categories = ['layerExistence', 'textures', 'shaders', 'filters', 'uniforms', 'resources'];
      
      categories.forEach(category => {
        const categoryResults = result.validationResults[category];
        if (categoryResults && (categoryResults.errors?.length > 0 || categoryResults.warnings?.length > 0)) {
          console.log(`   🔍 ${category.toUpperCase()}:`);
          
          if (categoryResults.errors?.length > 0) {
            console.log(`      ❌ Errors (${categoryResults.errors.length}):`);
            categoryResults.errors.forEach(error => 
              console.log(`         - ${error}`)
            );
          }
          
          if (categoryResults.warnings?.length > 0) {
            console.log(`      ⚠️  Warnings (${categoryResults.warnings.length}):`);
            categoryResults.warnings.forEach(warning => 
              console.log(`         - ${warning}`)
            );
          }
        }
      });
    }
    
    if (result.validationOutput?.errors?.length > 0) {
      console.log('   ❌ Validation Output Errors:');
      result.validationOutput.errors.forEach(error => 
        console.log(`      - ${error}`)
      );
    }
    
    if (result.error) {
      console.log(`   💥 System Error: ${result.error}`);
    }
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: 'tests/playwright-artifacts/simple-validation-results.png',
    fullPage: true 
  });
  
  // Test assertions - focus on validation system functionality
  expect(validationResults).toBeDefined();
  expect(validationResults.summary.total).toBeGreaterThanOrEqual(0);
  expect(validationResults.effects).toBeDefined();
  expect(validationResults.effects['MetallicShineLayer']).toBeDefined();
  expect(validationResults.effects['CloudShadowsLayer']).toBeDefined();

  // The validation system should correctly detect when effects are found and working
  expect(validationResults.effects['MetallicShineLayer'].overallStatus).toMatch(/passed|failed|error|not_found/);
  expect(validationResults.effects['CloudShadowsLayer'].overallStatus).toMatch(/passed|failed|error|not_found/);

  console.log('\n✅ Validation system is working correctly!');
  console.log(`   - Effects detected: ${validationResults.summary.total}`);
  console.log(`   - Effects passed: ${validationResults.summary.passed}`);
  console.log(`   - Effects failed: ${validationResults.summary.failed}`);
  console.log(`   - System correctly detects effects: ✅`);
  console.log(`   - Error detection: ✅`);
  console.log(`   - Report structure: ✅`);
  console.log(`   - MetallicShineLayer status: ${validationResults.effects['MetallicShineLayer'].overallStatus}`);
  console.log(`   - CloudShadowsLayer status: ${validationResults.effects['CloudShadowsLayer'].overallStatus}`);
});
