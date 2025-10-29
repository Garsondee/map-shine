import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('Map Shine Effect Validation Diagnostics', () => {
  
  test('comprehensive effect validation diagnostics', async ({ page }) => {
    console.log('🚨 Starting Comprehensive Effect Validation Test');
    
    // Navigate to Foundry VTT
    await page.goto('http://localhost:30000');
    
    // Wait for Foundry to be ready
    await page.waitForSelector('#login', { timeout: 30000 });
    console.log('✅ Foundry VTT login screen loaded');
    
    // Login as GM
    await page.fill('#password', 'GM');
    await page.click('#login');
    
    // Wait for main interface
    await page.waitForSelector('#sidebar', { timeout: 30000 });
    console.log('✅ GM login successful');
    
    // Wait for Map Shine to initialize
    await page.waitForFunction(() => window.game?.mapShine?.initialized === true, { timeout: 60000 });
    console.log('✅ Map Shine initialized');
    
    // Load and execute the validation diagnostics script
    const validationScript = `
      ${readFileSync(join(__dirname, 'effect-validation-test.spec.js'), 'utf8')}
    `;
    
    await page.evaluate(validationScript);
    console.log('✅ Validation diagnostics script loaded');
    
    // Run comprehensive validation
    const validationResults = await page.evaluate(async () => {
      return await window.runComprehensiveEffectValidation();
    });
    
    console.log('✅ Validation completed');
    
    // Log detailed results
    console.log('\\n📊 VALIDATION RESULTS:');
    console.log('========================');
    
    for (const [effectName, result] of Object.entries(validationResults.effects)) {
      console.log(`\\n🔍 ${effectName}:`);
      console.log(`   Status: ${result.overallStatus}`);
      console.log(`   Found: ${result.found}`);
      console.log(`   Has Validation: ${result.hasValidation || (result.validationResults ? 'Yes' : 'No')}`);
      
      if (result.validationResults) {
        for (const [category, categoryResult] of Object.entries(result.validationResults)) {
          if (categoryResult.errors && categoryResult.errors.length > 0) {
            console.log(`   ❌ ${category} errors:`);
            categoryResult.errors.forEach(error => console.log(`      - ${error}`));
          }
          if (categoryResult.warnings && categoryResult.warnings.length > 0) {
            console.log(`   ⚠️  ${category} warnings:`);
            categoryResult.warnings.forEach(warning => console.log(`      - ${warning}`));
          }
        }
      }
      
      if (result.error) {
        console.log(`   💥 Error: ${result.error}`);
      }
    }
    
    console.log('\\n📈 SUMMARY:');
    console.log(`   Total Effects: ${validationResults.summary.total}`);
    console.log(`   Passed: ${validationResults.summary.passed}`);
    console.log(`   Failed: ${validationResults.summary.failed}`);
    console.log(`   Development Mode: ${validationResults.developmentMode}`);
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/playwright-artifacts/effect-validation-results.png',
      fullPage: true 
    });
    
    // Test assertions
    expect(validationResults.summary.total).toBeGreaterThan(0);
    expect(validationResults.effects).toHaveProperty('MetallicShineLayer');
    
    // MetallicShineLayer should be found and have validation
    const metallicResult = validationResults.effects['MetallicShineLayer'];
    expect(metallicResult.found).toBe(true);
    expect(metallicResult.validationResults).toBeDefined();
    
    // CloudShadowsLayer should be present
    const cloudResult = validationResults.effects['CloudShadowsLayer'];
    expect(cloudResult).toBeDefined();
    
    console.log('\\n✅ All validation diagnostics completed successfully!');
    
    return validationResults;
  });
  
  test('MetallicShineLayer specific validation', async ({ page }) => {
    console.log('🔍 Testing MetallicShineLayer validation in detail');
    
    await page.goto('http://localhost:30000');
    await page.waitForSelector('#login', { timeout: 30000 });
    
    await page.fill('#password', 'GM');
    await page.click('#login');
    
    await page.waitForSelector('#sidebar', { timeout: 30000 });
    await page.waitForFunction(() => window.game?.mapShine?.initialized === true, { timeout: 60000 });
    
    // Enable metallic shine effect if not already enabled
    await page.evaluate(() => {
      if (window.game.mapShine?.profileManager) {
        const config = window.game.mapShine.profileManager.getAllConfigs();
        if (config.metallicshine?.enabled === false) {
          window.game.mapShine.profileManager.updateSingleConfig('metallicshine', 'enabled', true);
        }
      }
    });
    
    // Wait a moment for the layer to initialize
    await page.waitForTimeout(2000);
    
    // Run specific validation for MetallicShineLayer
    const metallicValidation = await page.evaluate(async () => {
      const diagnostics = new EffectValidationDiagnostics();
      return await diagnostics.validateMetallicShineLayer();
    });
    
    console.log('\\n🔍 MetallicShineLayer Validation Results:');
    console.log('===========================================');
    console.log(`Found: ${metallicValidation.found}`);
    console.log(`Initialized: ${metallicValidation.initialized}`);
    console.log(`Visible: ${metallicValidation.visible}`);
    console.log(`Overall Status: ${metallicValidation.overallStatus}`);
    
    if (metallicValidation.validationResults) {
      for (const [category, result] of Object.entries(metallicValidation.validationResults)) {
        console.log(`\\n${category}:`);
        console.log(`   Passed: ${result.passed || 0}`);
        console.log(`   Failed: ${result.failed || 0}`);
        if (result.errors?.length > 0) {
          console.log(`   Errors:`);
          result.errors.forEach(error => console.log(`     - ${error}`));
        }
        if (result.warnings?.length > 0) {
          console.log(`   Warnings:`);
          result.warnings.forEach(warning => console.log(`     - ${warning}`));
        }
      }
    }
    
    // Verify validation system is working
    expect(metallicValidation.found).toBe(true);
    expect(metallicValidation.validationResults).toBeDefined();
    
    console.log('\\n✅ MetallicShineLayer validation test completed!');
  });
  
  test('CloudShadowsLayer shader compilation verification', async ({ page }) => {
    console.log('☁️ Testing CloudShadowsLayer shader validation');
    
    await page.goto('http://localhost:30000');
    await page.waitForSelector('#login', { timeout: 30000 });
    
    await page.fill('#password', 'GM');
    await page.click('#login');
    
    await page.waitForSelector('#sidebar', { timeout: 30000 });
    await page.waitForFunction(() => window.game?.mapShine?.initialized === true, { timeout: 60000 });
    
    // Enable cloud shadows if not already enabled
    await page.evaluate(() => {
      if (window.game.mapShine?.profileManager) {
        const config = window.game.mapShine.profileManager.getAllConfigs();
        if (config.cloudshadows?.enabled === false) {
          window.game.mapShine.profileManager.updateSingleConfig('cloudshadows', 'enabled', true);
        }
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check CloudShadowsLayer shader compilation
    const cloudValidation = await page.evaluate(async () => {
      const diagnostics = new EffectValidationDiagnostics();
      return await diagnostics.validateCloudShadowsLayer();
    });
    
    console.log('\\n☁️ CloudShadowsLayer Validation Results:');
    console.log('==========================================');
    console.log(`Found: ${cloudValidation.found}`);
    console.log(`Visible: ${cloudValidation.visible}`);
    console.log(`Overall Status: ${cloudValidation.overallStatus}`);
    
    if (cloudValidation.validationResults) {
      if (cloudValidation.validationResults.textures.errors.length > 0) {
        console.log('\\n❌ Texture Errors:');
        cloudValidation.validationResults.textures.errors.forEach(error => 
          console.log(`   - ${error}`)
        );
      }
      
      if (cloudValidation.validationResults.shaders.errors.length > 0) {
        console.log('\\n❌ Shader Errors:');
        cloudValidation.validationResults.shaders.errors.forEach(error => 
          console.log(`   - ${error}`)
        );
      }
    }
    
    // Verify validation system detected the shader compilation issue
    expect(cloudValidation.found).toBe(true);
    
    // If there are shader compilation errors, they should be detected
    if (cloudValidation.overallStatus === 'failed') {
      expect(cloudValidation.validationResults.shaders.errors.length).toBeGreaterThan(0);
      console.log('\\n✅ Shader compilation error correctly detected!');
    } else {
      console.log('\\n✅ CloudShadowsLayer validation passed!');
    }
    
    return cloudValidation;
  });
});
