/**
 * Quick Effect Profiling Test - Fast Iteration
 * 
 * Tests only 2-3 effects for rapid testing and validation.
 * Uses Maximum performance mode with unlocked FPS.
 * 
 * @author Mythica Machina - Ingram Blakelock
 */

import { test, expect } from '@playwright/test';
import { FoundryLauncher } from './foundry-launcher.js';
import { MapShineTestHelper } from './map-shine-utils.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Foundry once before all tests
let foundry;

test.beforeAll(async () => {
  foundry = new FoundryLauncher({
    worldName: 'map-development-world',
    sceneId: 'WndznGLSc1U7iMVN', // Japanese Horror House
    logOutput: false
  });
  
  await foundry.start();
});

test.afterAll(async () => {
  if (foundry) {
    await foundry.stop();
    
    // CRITICAL: Wait for Foundry to fully release its lock file
    // Without this, subsequent tests fail with "directory is already locked"
    console.log('⏳ Waiting for lock file to be released...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Lock file cleanup complete');
  }
});

/**
 * Save profiling report to file
 */
async function saveProfilingReport(profile, testType) {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const filename = `PROFILING_REPORT_${testType}_${timestamp}.md`;
  const filepath = path.join(process.cwd(), 'docs', filename);
  
  let report = `# Effect Performance Profiling Report\n\n`;
  report += `**Type:** ${testType}\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Performance Mode:** ${profile.performanceMode || 'Unknown'}\n`;
  report += `\n---\n\n`;
  
  report += `## Scene: ${profile.scene.name}\n\n`;
  report += `**Scene ID:** ${profile.scene.id}\n`;
  report += `**Dimensions:** ${profile.scene.width}x${profile.scene.height}\n`;
  report += `**Effects Tested:** ${profile.effectResults.length}\n`;
  report += `\n### Baseline Performance\n\n`;
  report += `- **Average FPS:** ${profile.baseline.avgFPS.toFixed(2)}\n`;
  report += `- **Frame Time:** ${profile.baseline.avgFrameTime.toFixed(2)}ms\n`;
  report += `- **Min/Max FPS:** ${profile.baseline.minFPS.toFixed(2)} / ${profile.baseline.maxFPS.toFixed(2)}\n`;
  report += `- **Stutter Events:** ${profile.baseline.stutterEvents}\n`;
  
  report += `\n### Effect Performance Impact Rankings\n\n`;
  report += `| Rank | Effect | FPS Delta | Improvement % | Frame Time Saved | Impact |\n`;
  report += `|------|--------|-----------|---------------|------------------|--------|\n`;
  
  profile.effectResults.forEach((result, idx) => {
    report += `| ${idx + 1} | ${result.effect} | `;
    report += `${result.fpsDelta >= 0 ? '+' : ''}${result.fpsDelta.toFixed(2)} | `;
    report += `${result.fpsImpactPercent >= 0 ? '+' : ''}${result.fpsImpactPercent.toFixed(1)}% | `;
    report += `${result.frameTimeDeltaMs.toFixed(2)}ms | `;
    report += `${result.impact} |\n`;
  });
  
  report += `\n### Summary\n\n`;
  report += `- **Top 3 Offenders:**\n`;
  profile.effectResults.slice(0, 3).forEach((result, idx) => {
    report += `  ${idx + 1}. **${result.effect}** - `;
    report += `${result.fpsDelta >= 0 ? '+' : ''}${result.fpsDelta.toFixed(2)} FPS `;
    report += `(${result.fpsImpactPercent >= 0 ? '+' : ''}${result.fpsImpactPercent.toFixed(1)}%)\n`;
  });
  
  fs.writeFileSync(filepath, report);
  return filepath;
}

test.describe('Quick Effect Profiling - Fast Iteration', () => {
  
  test.beforeEach(async ({ page }) => {
    const helper = new MapShineTestHelper(page);
    
    console.log('🌐 Navigating to Foundry VTT...');
    await page.goto('/');
    
    // Authenticate
    console.log('🔐 Authenticating...');
    await helper.authenticate('Gamemaster');
    
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
    
    // SET MAXIMUM PERFORMANCE MODE AND FPS SETTINGS
    console.log('🚀 Setting canvas to MAXIMUM performance mode...');
    await page.evaluate(() => {
      // Set canvas performance mode to maximum (3)
      if (canvas.performance) {
        canvas.performance.mode = 3;
        console.log('✅ Canvas performance mode set to MAXIMUM (3)');
      }
      
      // CRITICAL: Match user's working setup (unlimited FPS)
      if (canvas.app?.ticker) {
        canvas.app.ticker.maxFPS = 0;   // 0 = unlimited (matches user setup)
        canvas.app.ticker.minFPS = 10;  // Min 10 FPS (matches user setup)
        console.log('✅ FPS settings configured:');
        console.log(`   Max FPS: ${canvas.app.ticker.maxFPS} (unlimited)`);
        console.log(`   Min FPS: ${canvas.app.ticker.minFPS}`);
        console.log(`   Target FPS: ${canvas.app.ticker.targetFPS}`);
      }
    });
    
    // Unpause game
    console.log('▶️  Unpausing game...');
    await helper.unpauseGame();
    
    // Extra wait after unpause
    console.log('⏳ Waiting for game to settle after unpause...');
    await page.waitForTimeout(5000);
    
    console.log('✅ Ready for quick profiling test');
  });
  
  test('Baseline - Module completely disabled', async ({ page }) => {
    test.setTimeout(120000); // 2 minute timeout (20s measurement + 100s overhead)
    
    console.log('\n' + '='.repeat(80));
    console.log('  BASELINE TEST - MODULE DISABLED');
    console.log('  Performance Mode: MAXIMUM (FPS Unlocked)');
    console.log('  Test started: ' + new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Load performance validator
    await page.addScriptTag({
      path: path.join(__dirname, '../validators/PerformanceValidator.js'),
      type: 'module'
    });
    
    // Disable the module completely
    console.log('\n🔴 DISABLING MODULE...');
    await page.evaluate(() => {
      game.mapShine.profileManager.activeConfig.enabled = false;
      // Force update to apply disabled state
      game.mapShine.profileManager.updateAllSystemsFromConfig();
      
      // ✅ CRITICAL: Hide the entire weather layer container
      // The high-priority ticker keeps calling update() which re-enables effects
      // So we must hide the entire container to prevent visual effects
      if (game.mapShine.weatherSystemManager?.weatherEffectLayer) {
        game.mapShine.weatherSystemManager.weatherEffectLayer.visible = false;
        game.mapShine.weatherSystemManager.weatherEffectLayer.renderable = false;
        console.log('  ✅ Weather layer hidden');
      }
      
      // Stop and hide edge droplets
      if (game.mapShine.weatherSystemManager?.edgeDropletController) {
        game.mapShine.weatherSystemManager.edgeDropletController.stop();
        game.mapShine.weatherSystemManager.edgeDropletController.container.visible = false;
        game.mapShine.weatherSystemManager.edgeDropletController.container.renderable = false;
        console.log('  ✅ Edge droplets stopped and hidden');
      }
    });
    
    // Wait for effects to shut down
    await page.waitForTimeout(2000);
    
    // Verify module is disabled
    const isDisabled = await page.evaluate(() => {
      return game.mapShine.profileManager.activeConfig.enabled === false;
    });
    
    expect(isDisabled).toBe(true);
    console.log('✅ Module disabled successfully');
    
    // Measure baseline performance with module OFF
    console.log('\n📊 Measuring baseline FPS (module OFF) for 20 seconds...');
    const baselineMetrics = await page.evaluate(async () => {
      return await window.PerformanceValidator.monitorPerformance(20000, 'baseline-module-off');
    });
    
    console.log('\n✅ Baseline measurement complete!');
    console.log(`   Average FPS: ${baselineMetrics.avgFPS.toFixed(2)}`);
    console.log(`   Min/Max FPS: ${baselineMetrics.minFPS.toFixed(2)} / ${baselineMetrics.maxFPS.toFixed(2)}`);
    console.log(`   Frame Time: ${baselineMetrics.avgFrameTime.toFixed(2)}ms`);
    console.log(`   Stutter Events: ${baselineMetrics.stutterEvents}`);
    
    // Re-enable module for subsequent tests
    console.log('\n🟢 RE-ENABLING MODULE...');
    await page.evaluate(() => {
      game.mapShine.profileManager.activeConfig.enabled = true;
      game.mapShine.profileManager.updateAllSystemsFromConfig();
    });
    
    await page.waitForTimeout(2000);
    console.log('✅ Module re-enabled');
    
    // Save baseline report
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `BASELINE_MODULE_OFF_${timestamp}.md`;
    const filepath = path.join(process.cwd(), 'docs', filename);
    
    let report = `# Baseline Performance - Module Disabled\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Scene:** ${await page.evaluate(() => canvas.scene?.name || 'Unknown')}\n`;
    report += `**Performance Mode:** MAXIMUM (FPS Unlocked)\n\n`;
    report += `## Metrics\n\n`;
    report += `- **Average FPS:** ${baselineMetrics.avgFPS.toFixed(2)}\n`;
    report += `- **Min/Max FPS:** ${baselineMetrics.minFPS.toFixed(2)} / ${baselineMetrics.maxFPS.toFixed(2)}\n`;
    report += `- **Frame Time:** ${baselineMetrics.avgFrameTime.toFixed(2)}ms\n`;
    report += `- **Frame Time Variance:** ${baselineMetrics.frameTimeVariance.toFixed(2)}ms\n`;
    report += `- **Stutter Events:** ${baselineMetrics.stutterEvents}\n`;
    report += `- **VRAM Growth:** ${baselineMetrics.vramGrowthMB.toFixed(2)}MB\n\n`;
    report += `This baseline represents the raw Foundry VTT performance without Map Shine.\n`;
    report += `Compare against module-enabled tests to calculate the true performance cost.\n`;
    
    fs.writeFileSync(filepath, report);
    console.log(`\n📄 Baseline report saved to: ${filepath}`);
  });
  
  test('Quick profile - SOLO MODE (all enabled effects)', async ({ page }) => {
    test.setTimeout(600000); // 10 minute timeout for comprehensive testing
    
    console.log('\n' + '='.repeat(80));
    console.log('  QUICK PROFILE TEST - SOLO MODE');
    console.log('  Tests each effect individually to measure true cost');
    console.log('  Performance Mode: MAXIMUM (Unlimited FPS)');
    console.log('  Test started: ' + new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Load profiling utilities
    await page.addScriptTag({
      path: path.join(__dirname, '../validators/PerformanceValidator.js'),
      type: 'module'
    });
    
    await page.addScriptTag({
      path: path.join(__dirname, '../validators/EffectDiscovery.js'),
      type: 'module'
    });
    
    await page.addScriptTag({
      path: path.join(__dirname, '../validators/EffectProfiler.js'),
      type: 'module'
    });
    
    // Run profiling in SOLO MODE (tests ALL enabled effects individually)
    const profile = await page.evaluate(async () => {
      // Run profiling in SOLO mode with optimized timings
      const result = await window.EffectProfiler.profileCurrentScene({
        soloMode: true,              // ✅ SOLO MODE: Test each effect individually
        settleTimeMs: 15000,         // 15s initial settle
        effectSettleTimeMs: 5000,    // 5s settle after toggle
        measurementDurationMs: 30000, // 30s measurement for stability (longer = more accurate)
        baselineDurationMs: 30000    // 30s baseline measurement
      });
      
      // Add performance mode info
      result.performanceMode = canvas.performance?.mode || 'Unknown';
      
      return result;
    });
    
    // Validate results
    expect(profile).toBeDefined();
    expect(profile.baseline).toBeDefined();
    expect(profile.effectResults).toBeDefined();
    expect(profile.effectResults.length).toBeGreaterThan(0); // At least 1 effect tested
    
    console.log(`\n✅ Profiling completed with ${profile.effectResults.length} effects`);
    
    console.log('\n✅ Quick profiling complete!');
    console.log(`   Scene: ${profile.scene.name}`);
    console.log(`   Effects tested: ${profile.effectResults.length}`);
    console.log(`   Performance Mode: ${profile.performanceMode}`);
    console.log(`   Baseline FPS: ${profile.baseline.avgFPS.toFixed(2)}`);
    console.log(`   Min/Max FPS: ${profile.baseline.minFPS.toFixed(2)} / ${profile.baseline.maxFPS.toFixed(2)}`);
    
    // Save detailed results
    const reportPath = await saveProfilingReport(profile, 'quick-test');
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Print results
    console.log('\n🎯 EFFECT PERFORMANCE RESULTS:');
    profile.effectResults.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.effect}`);
      console.log(`      FPS Delta: ${result.fpsDelta >= 0 ? '+' : ''}${result.fpsDelta.toFixed(2)}`);
      console.log(`      Improvement: ${result.fpsImpactPercent >= 0 ? '+' : ''}${result.fpsImpactPercent.toFixed(1)}%`);
      console.log(`      Frame Time: ${result.frameTimeDeltaMs.toFixed(2)}ms`);
      console.log(`      Impact: ${result.impact}`);
    });
    
    // Check if we're seeing better deltas now
    const maxDelta = Math.max(...profile.effectResults.map(r => Math.abs(r.fpsDelta)));
    console.log(`\n📊 Maximum FPS delta: ${maxDelta.toFixed(2)} FPS`);
    
    if (maxDelta < 2) {
      console.warn('⚠️  FPS deltas still very small - may still be capped or GPU-bound');
    } else if (maxDelta > 5) {
      console.log('✅ Good FPS deltas - uncapping appears to be working!');
    }
  });
});
