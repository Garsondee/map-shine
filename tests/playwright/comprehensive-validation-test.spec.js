/**
 * 🚨 Comprehensive Effect Validation Test - Automated Diagnostic System
 * 
 * This test systematically validates all Map Shine effects using the same
 * robust architecture as the performance testing system.
 * 
 * Features:
 * - Connects to existing Foundry VTT server
 * - Comprehensive effect validation with detailed reporting
 * - Structured error detection and categorization
 * - Markdown report generation
 * - Screenshot and video capture for debugging
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import { MapShineTestHelper } from './map-shine-utils.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Save validation report to markdown file
 */
async function saveValidationReport(results, testType) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `VALIDATION_REPORT_${testType}_${timestamp}.md`;
  const filepath = path.join(process.cwd(), 'docs', filename);
  
  let report = `# 🚨 Effect Validation Report\n\n`;
  report += `**Type:** ${testType}\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Development Mode:** ${results.developmentMode}\n`;
  report += `**Total Effects:** ${results.summary.total}\n`;
  report += `\n---\n\n`;
  
  report += `## 📊 Overall Summary\n\n`;
  report += `- **✅ Passed:** ${results.summary.passed}\n`;
  report += `- **❌ Failed:** ${results.summary.failed}\n`;
  report += `- **⚠️  Warnings:** ${results.summary.warnings}\n`;
  report += `- **🔧 Success Rate:** ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%\n`;
  
  report += `\n## 🎯 Detailed Results\n\n`;
  report += `| Effect | Status | Found | Validation | Errors | Warnings |\n`;
  report += `|--------|--------|-------|------------|--------|----------|\n`;
  
  for (const [effectName, result] of Object.entries(results.effects)) {
    const status = result.overallStatus === 'passed' ? '✅ Passed' : 
                   result.overallStatus === 'failed' ? '❌ Failed' : 
                   result.overallStatus === 'error' ? '💥 Error' : 
                   result.overallStatus === 'not_found' ? '👻 Not Found' : 
                   result.overallStatus === 'no_validation' ? '⭕ No Validation' : '❓ Unknown';
    
    const found = result.found ? '✅' : '❌';
    const validation = result.hasValidation || result.validationResults ? '🔍' : '⭕';
    const errors = result.validationOutput?.errors?.length || 0;
    const warnings = result.validationOutput?.warnings?.length || 0;
    
    report += `| ${effectName} | ${status} | ${found} | ${validation} | ${errors} | ${warnings} |\n`;
  }
  
  report += `\n## 🔍 Critical Issues Found\n\n`;
  let criticalCount = 0;
  
  for (const [effectName, result] of Object.entries(results.effects)) {
    if (result.validationOutput?.errors?.length > 0 || result.error) {
      criticalCount++;
      report += `### ${effectName}\n\n`;
      
      if (result.error) {
        report += `**💥 Critical Error:** ${result.error}\n\n`;
      }
      
      if (result.validationOutput?.errors?.length > 0) {
        report += `**Errors detected:**\n`;
        result.validationOutput.errors.forEach(error => {
          report += `- ❌ ${error}\n`;
        });
        report += `\n`;
      }
    }
  }
  
  if (criticalCount === 0) {
    report += `✅ **No critical issues found!** All effects are functioning properly.\n\n`;
  }
  
  report += `## ⚠️  Warnings & Recommendations\n\n`;
  let warningCount = 0;
  
  for (const [effectName, result] of Object.entries(results.effects)) {
    if (result.validationOutput?.warnings?.length > 0) {
      warningCount++;
      report += `### ${effectName}\n\n`;
      report += `**Warnings:**\n`;
      result.validationOutput.warnings.forEach(warning => {
        report += `- ⚠️  ${warning}\n`;
      });
      report += `\n`;
    }
  }
  
  if (warningCount === 0) {
    report += `✅ **No warnings!** System is operating optimally.\n\n`;
  }
  
  report += `## 📋 Implementation Status\n\n`;
  report += `### Effects with Full Validation (1/13)\n`;
  report += `- ✅ **MetallicShineLayer** - Comprehensive validation implemented\n\n`;
  
  report += `### Effects with Basic Validation (1/13)\n`;
  report += `- ⚠️  **CloudShadowsLayer** - Basic texture validation only\n\n`;
  
  report += `### Effects Needing Validation Implementation (11/13)\n`;
  const noValidationEffects = Object.entries(results.effects)
    .filter(([_, result]) => !result.hasValidation)
    .map(([name, _]) => `- ❌ **${name}**`);
  
  if (noValidationEffects.length > 0) {
    report += noValidationEffects.join('\n') + '\n\n';
  } else {
    report += `✅ All effects have validation implemented!\n\n`;
  }
  
  report += `## 🎯 Next Steps\n\n`;
  if (criticalCount > 0) {
    report += `1. **URGENT:** Fix ${criticalCount} critical issues above\n`;
    report += `2. Re-run validation to confirm fixes\n`;
  } else {
    report += `1. ✅ Critical issues resolved\n`;
  }
  
  if (warningCount > 0) {
    report += `2. Address ${warningCount} warnings for better stability\n`;
  }
  
  const remainingEffects = Object.entries(results.effects)
    .filter(([_, result]) => !result.hasValidation).length;
  if (remainingEffects > 0) {
    report += `3. Implement validation for ${remainingEffects} remaining effects\n`;
  } else {
    report += `3. ✅ All effects have validation coverage\n`;
  }
  
  report += `\n---\n\n`;
  report += `*Report generated by Map Shine Automated Validation System*\n`;
  
  fs.writeFileSync(filepath, report);
  return filepath;
}

test.describe('🚨 Comprehensive Effect Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    const helper = new MapShineTestHelper(page);
    
    console.log('🌐 Connecting to existing Foundry VTT server...');
    await page.goto('http://localhost:30000');
    
    // Authenticate if needed
    console.log('🔐 Checking authentication...');
    try {
      await helper.authenticate('Gamemaster');
    } catch (error) {
      console.log('ℹ️ Already authenticated or no login required');
    }
    
    // Wait for canvas and Map Shine
    console.log('⏳ Waiting for canvas and Map Shine...');
    await helper.waitForCanvas(90000);
    await helper.waitForMapShine(30000);
    
    // Get current scene info
    const currentScene = await page.evaluate(() => {
      return {
        name: canvas.scene?.name || 'Unknown',
        id: canvas.scene?.id || 'unknown'
      };
    });
    console.log(`\n🗺️  Using scene: ${currentScene.name}`);
    
    // Wait for scene to fully load
    console.log('⏳ Waiting for scene to fully load...');
    await page.waitForTimeout(10000);
    
    // Enable development mode for validation
    console.log('🔧 Enabling development mode...');
    await page.evaluate(() => {
      if (game.mapShine) {
        game.mapShine.isDevelopmentMode = true;
        console.log('✅ Development mode enabled');
      }
    });
    
    // Enable all effects for comprehensive testing
    console.log('🎯 Enabling all effects for validation...');
    await page.evaluate(() => {
      if (game.mapShine?.profileManager) {
        const config = game.mapShine.profileManager.activeConfig;
        
        // Enable all effects that have config
        Object.keys(config).forEach(effectKey => {
          if (config[effectKey].hasOwnProperty('enabled')) {
            game.mapShine.profileManager.updateSingleConfig(effectKey, 'enabled', true);
          }
        });
        
        console.log('✅ All effects enabled for validation');
      }
    });
    
    // Wait for effects to initialize
    console.log('⏳ Waiting for effects to initialize...');
    await page.waitForTimeout(5000);
    
    console.log('✅ Ready for comprehensive validation');
  });
  
  test('🚨 Comprehensive Effect Validation - All Effects', async ({ page }) => {
    test.setTimeout(300000); // 5 minute timeout for comprehensive validation
    
    console.log('\n' + '='.repeat(80));
    console.log('  COMPREHENSIVE EFFECT VALIDATION');
    console.log('  Validating all Map Shine effects for errors and warnings');
    console.log('  Test started: ' + new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Load validation diagnostics script
    await page.addScriptTag({
      path: path.join(__dirname, '../validators/EffectValidator.js'),
      type: 'module'
    });
    
    // Run comprehensive validation
    console.log('\n🔍 Running comprehensive effect validation...');
    const validationResults = await page.evaluate(async () => {
      return await window.EffectValidator.validateAllEffects({
        detailedOutput: true,
        includeWarnings: true,
        checkRuntime: true
      });
    });
    
    console.log('\n✅ Validation completed!');
    console.log(`   Total Effects: ${validationResults.summary.total}`);
    console.log(`   Passed: ${validationResults.summary.passed}`);
    console.log(`   Failed: ${validationResults.summary.failed}`);
    console.log(`   Warnings: ${validationResults.summary.warnings}`);
    
    // Validate results structure
    expect(validationResults).toBeDefined();
    expect(validationResults.summary).toBeDefined();
    expect(validationResults.effects).toBeDefined();
    expect(validationResults.summary.total).toBeGreaterThan(0);
    
    // Log detailed results
    console.log('\n🎯 EFFECT VALIDATION RESULTS:');
    console.log('===============================');
    
    for (const [effectName, result] of Object.entries(validationResults.effects)) {
      const status = result.overallStatus === 'passed' ? '✅' : 
                     result.overallStatus === 'failed' ? '❌' : 
                     result.overallStatus === 'error' ? '💥' : 
                     result.overallStatus === 'not_found' ? '👻' : 
                     result.overallStatus === 'no_validation' ? '⭕' : '❓';
      
      console.log(`\n${status} ${effectName}:`);
      console.log(`   Status: ${result.overallStatus}`);
      console.log(`   Found: ${result.found}`);
      console.log(`   Has Validation: ${result.hasValidation || (result.validationResults ? 'Yes' : 'No')}`);
      
      if (result.validationOutput) {
        if (result.validationOutput.errors.length > 0) {
          console.log('   ❌ Errors:');
          result.validationOutput.errors.forEach(error => 
            console.log(`      - ${error}`)
          );
        }
        if (result.validationOutput.warnings.length > 0) {
          console.log('   ⚠️  Warnings:');
          result.validationOutput.warnings.forEach(warning => 
            console.log(`      - ${warning}`)
          );
        }
      }
      
      if (result.error) {
        console.log(`   💥 Error: ${result.error}`);
      }
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/playwright-artifacts/validation-results.png',
      fullPage: true 
    });
    
    // Save detailed markdown report
    const reportPath = await saveValidationReport(validationResults, 'comprehensive');
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Critical assertions
    expect(validationResults.effects['MetallicShineLayer']).toBeDefined();
    expect(validationResults.effects['MetallicShineLayer'].found).toBe(true);
    expect(validationResults.effects['MetallicShineLayer'].hasValidation).toBe(true);
    
    expect(validationResults.effects['CloudShadowsLayer']).toBeDefined();
    
    // Success criteria (at least 50% of found effects should pass)
    const foundEffects = Object.values(validationResults.effects).filter(r => r.found);
    const passingEffects = foundEffects.filter(r => r.overallStatus === 'passed');
    const successRate = foundEffects.length > 0 ? passingEffects.length / foundEffects.length : 0;
    
    expect(successRate).toBeGreaterThanOrEqual(0.5); // At least 50% should pass
    
    console.log('\n✅ Comprehensive validation test completed successfully!');
    console.log(`   Success Rate: ${(successRate * 100).toFixed(1)}%`);
    
    return validationResults;
  });
  
  test('🔍 MetallicShineLayer Deep Validation', async ({ page }) => {
    test.setTimeout(120000); // 2 minute timeout
    
    console.log('\n' + '='.repeat(80));
    console.log('  METALLIC SHINE LAYER DEEP VALIDATION');
    console.log('  Testing comprehensive validation framework');
    console.log('  Test started: ' + new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Load validation script
    await page.addScriptTag({
      path: path.join(__dirname, '../validators/EffectValidator.js'),
      type: 'module'
    });
    
    // Run deep validation on MetallicShineLayer specifically
    const deepValidation = await page.evaluate(async () => {
      return await window.EffectValidator.validateSingleEffect('MetallicShineLayer', {
        deepAnalysis: true,
        checkTextures: true,
        checkShaders: true,
        checkConfiguration: true,
        checkDependencies: true,
        checkRenderingPipeline: true,
        checkRuntime: true
      });
    });
    
    console.log('\n🔍 MetallicShineLayer Deep Validation Results:');
    console.log('==============================================');
    console.log(`Found: ${deepValidation.found}`);
    console.log(`Initialized: ${deepValidation.initialized}`);
    console.log(`Visible: ${deepValidation.visible}`);
    console.log(`Overall Status: ${deepValidation.overallStatus}`);
    
    if (deepValidation.validationResults) {
      const categories = ['textures', 'shaders', 'configuration', 'dependencies', 'rendering'];
      
      categories.forEach(category => {
        const result = deepValidation.validationResults[category];
        if (result) {
          console.log(`\n${category.toUpperCase()}:`);
          console.log(`   Passed: ${result.passed || 0}`);
          console.log(`   Failed: ${result.failed || 0}`);
          
          if (result.errors?.length > 0) {
            console.log('   Errors:');
            result.errors.forEach(error => console.log(`     - ${error}`));
          }
          
          if (result.warnings?.length > 0) {
            console.log('   Warnings:');
            result.warnings.forEach(warning => console.log(`     - ${warning}`));
          }
        }
      });
    }
    
    // Verify validation system is working properly
    expect(deepValidation.found).toBe(true);
    expect(deepValidation.validationResults).toBeDefined();
    expect(deepValidation.hasValidation).toBe(true);
    
    console.log('\n✅ MetallicShineLayer deep validation completed!');
    
    return deepValidation;
  });
  
  test('☁️ CloudShadowsLayer Shader Validation', async ({ page }) => {
    test.setTimeout(120000); // 2 minute timeout
    
    console.log('\n' + '='.repeat(80));
    console.log('  CLOUD SHADOWS LAYER SHADER VALIDATION');
    console.log('  Testing shader compilation and texture validation');
    console.log('  Test started: ' + new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Run specific CloudShadowsLayer validation
    const cloudValidation = await page.evaluate(async () => {
      const effect = canvas.layers?.find(l => l instanceof CloudShadowsLayer);
      const result = {
        name: 'CloudShadowsLayer',
        found: !!effect,
        visible: false,
        validationResults: {
          textures: { errors: [], warnings: [] },
          shaders: { errors: [], warnings: [] }
        },
        overallStatus: 'unknown'
      };

      if (effect) {
        result.visible = effect.visible ?? false;
        
        // Test basic texture validation
        if (typeof effect._validateCloudTexture === 'function') {
          const textureValid = effect._validateCloudTexture();
          if (!textureValid) {
            result.validationResults.textures.errors.push('Cloud texture validation failed');
            console.log('❌ CloudShadowsLayer: Cloud texture validation failed');
          } else {
            console.log('✅ CloudShadowsLayer: Cloud texture validation passed');
          }
        }

        // Check shader compilation
        if (effect.cloudShadowsFilter) {
          const filter = effect.cloudShadowsFilter;
          if (filter.glProgram?.fragmentShader?.glShader === null) {
            result.validationResults.shaders.errors.push('Fragment shader failed to compile');
            console.log('❌ CloudShadowsLayer: Fragment shader compilation failed');
          }
          if (filter.glProgram?.vertexShader?.glShader === null) {
            result.validationResults.shaders.errors.push('Vertex shader failed to compile');
            console.log('❌ CloudShadowsLayer: Vertex shader compilation failed');
          }
          
          // Check uniforms
          if (filter.uniforms) {
            const requiredUniforms = ['uCloudTexture', 'uCloudTextureSize', 'uCloudThreshold'];
            for (const uniform of requiredUniforms) {
              if (!(uniform in filter.uniforms)) {
                result.validationResults.shaders.errors.push(`Missing uniform: ${uniform}`);
                console.log(`❌ CloudShadowsLayer: Missing uniform ${uniform}`);
              }
            }
          }
        }

        const totalErrors = result.validationResults.textures.errors.length + result.validationResults.shaders.errors.length;
        result.overallStatus = totalErrors === 0 ? 'passed' : 'failed';
      } else {
        result.overallStatus = 'not_found';
        console.log('ℹ️ CloudShadowsLayer: Not active on current scene');
      }
      
      return result;
    });
    
    console.log('\n☁️ CloudShadowsLayer Validation Results:');
    console.log('==========================================');
    console.log(`Found: ${cloudValidation.found}`);
    console.log(`Visible: ${cloudValidation.visible}`);
    console.log(`Overall Status: ${cloudValidation.overallStatus}`);
    
    if (cloudValidation.validationResults) {
      if (cloudValidation.validationResults.textures.errors.length > 0) {
        console.log('\n❌ Texture Errors:');
        cloudValidation.validationResults.textures.errors.forEach(error => 
          console.log(`   - ${error}`)
        );
      }
      
      if (cloudValidation.validationResults.shaders.errors.length > 0) {
        console.log('\n❌ Shader Errors:');
        cloudValidation.validationResults.shaders.errors.forEach(error => 
          console.log(`   - ${error}`)
        );
      }
    }
    
    // Verify validation system detected any issues
    expect(cloudValidation.found).toBe(true);
    
    if (cloudValidation.overallStatus === 'failed') {
      expect(cloudValidation.validationResults.shaders.errors.length).toBeGreaterThan(0);
      console.log('\n✅ Shader compilation error correctly detected by validation system!');
    } else {
      console.log('\n✅ CloudShadowsLayer validation passed!');
    }
    
    console.log('\n✅ CloudShadowsLayer shader validation completed!');
    
    return cloudValidation;
  });
});
