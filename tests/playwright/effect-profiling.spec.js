/**
 * @fileoverview Effect Performance Profiling Test
 * 
 * Automated end-to-end test that profiles Map Shine effects to identify
 * performance bottlenecks. Runs systematic FPS testing with effects
 * disabled one-by-one to measure individual performance impact.
 * 
 * Features:
 * - Automatic effect discovery
 * - Baseline FPS measurement
 * - Individual effect isolation testing
 * - Multi-scene comparative analysis
 * - Automated optimization recommendations
 * 
 * Usage:
 *   npx playwright test effect-profiling.spec.js --config=playwright-headed.config.js
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

import { test, expect } from '@playwright/test';
import { MapShineTestHelper } from './map-shine-utils.js';
import { FoundryLauncher } from './foundry-launcher.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Foundry once before all tests
let foundry;

test.describe('Effect Performance Profiling', () => {
  let helper;
  
  test.beforeAll(async () => {
    console.log('🚀 Starting Foundry VTT server for profiling...');
    console.log('⏰ Start time: ' + new Date().toLocaleTimeString());
    foundry = new FoundryLauncher({
      worldName: 'map-development-world',
      sceneId: null, // Will activate scene dynamically
      logOutput: true // Enable full Foundry server logging
    });
    await foundry.start();
    
    // Give server a moment to fully initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
  
  test.afterAll(async () => {
    if (foundry) {
      console.log('🧹 Cleaning up Foundry server...');
      await foundry.stop();
      
      // Wait for lock file to be released
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Cleanup complete');
    }
  });
  
  test.beforeEach(async ({ page, context }) => {
    helper = new MapShineTestHelper(page);
    
    // CRITICAL: Capture ALL browser console logs
    const consoleLogs = helper.setupConsoleCapture();
    console.log('📡 Browser console capture enabled - all Foundry logs will be shown');
    
    // Enable performance monitoring
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Navigate to Foundry
    console.log('🌐 Navigating to Foundry VTT...');
    await page.goto('http://localhost:30000/', { waitUntil: 'networkidle' });
    
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
    console.log(`\n🗺️  Using current scene: ${currentScene.name}`);
    
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
    
    // Extra wait after unpause to ensure everything settles
    console.log('⏳ Waiting for game to settle after unpause...');
    await page.waitForTimeout(5000);
    
    console.log('✅ Map Shine initialized and ready for profiling');
  });
  
  test('Baseline - Module completely disabled', async ({ page }) => {
    test.setTimeout(60000); // 1 minute timeout
    
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
  
  test('Profile effects on current scene (DISABLED mode)', async ({ page }) => {
    test.setTimeout(1200000); // 20 minute timeout for thorough profiling
    
    console.log('\n' + '='.repeat(80));
    console.log('  SINGLE SCENE EFFECT PROFILING (DISABLED MODE)');
    console.log('  (Measures improvement when DISABLING each effect)');
    console.log('  Test started: ' + new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    // Load profiling utilities into browser context
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
    
    // Run profiling (classes are now available via window globals)
    const profile = await page.evaluate(async () => {
      return await window.EffectProfiler.profileCurrentScene();
    });
    
    // Validate results
    expect(profile).toBeDefined();
    expect(profile.baseline).toBeDefined();
    expect(profile.effectResults).toBeDefined();
    
    console.log('\n✅ Profiling complete!');
    console.log(`   Scene: ${profile.scene.name}`);
    console.log(`   Effects tested: ${profile.effectResults.length}`);
    console.log(`   Baseline FPS: ${profile.baseline.avgFPS.toFixed(2)}`);
    
    // Save detailed results
    const reportPath = await saveProfilingReport(profile, 'single-scene');
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Print top offenders
    const topOffenders = profile.effectResults.slice(0, 5);
    console.log('\n🎯 TOP 5 PERFORMANCE BOTTLENECKS:');
    topOffenders.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.effect}`);
      console.log(`      FPS Delta: ${result.fpsDelta >= 0 ? '+' : ''}${result.fpsDelta.toFixed(2)}`);
      console.log(`      Improvement: ${result.fpsImpactPercent >= 0 ? '+' : ''}${result.fpsImpactPercent.toFixed(1)}%`);
      console.log(`      Impact: ${result.impact}`);
    });
  });
  
  test('Profile effects in SOLO MODE (isolated impact)', async ({ page }) => {
    test.setTimeout(600000); // 10 minute timeout for solo mode profiling
    
    console.log('\n' + '='.repeat(80));
    console.log('  SOLO MODE EFFECT PROFILING');
    console.log('  (Measures impact of EACH effect individually)');
    console.log('='.repeat(80));
    
    // Load profiling utilities into browser context
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
    
    // Run profiling in solo mode
    const profile = await page.evaluate(async () => {
      return await window.EffectProfiler.profileCurrentScene({ soloMode: true });
    });
    
    // Validate results
    expect(profile).toBeDefined();
    expect(profile.baseline).toBeDefined();
    expect(profile.effectResults).toBeDefined();
    expect(profile.mode).toBe('solo');
    
    console.log('\n✅ Solo mode profiling complete!');
    console.log(`   Scene: ${profile.scene.name}`);
    console.log(`   Effects tested: ${profile.effectResults.length}`);
    console.log(`   Baseline FPS (no effects): ${profile.baseline.avgFPS.toFixed(2)}`);
    
    // Save detailed results
    const reportPath = await saveProfilingReport(profile, 'solo-mode');
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Print most expensive effects
    const mostExpensive = profile.effectResults.slice(0, 5);
    console.log('\n💰 TOP 5 MOST EXPENSIVE EFFECTS (Solo):');
    mostExpensive.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.effect}`);
      console.log(`      FPS Cost: ${Math.abs(result.fpsDelta).toFixed(2)} FPS`);
      console.log(`      % Impact: ${Math.abs(result.fpsImpactPercent).toFixed(1)}%`);
      console.log(`      Frame Time: ${result.frameTimeDeltaMs.toFixed(2)}ms`);
    });
  });
  
  test('Profile effects across multiple scenes', async ({ page }) => {
    test.setTimeout(1800000); // 30 minute timeout for multi-scene profiling
    
    console.log('\n' + '='.repeat(80));
    console.log('  MULTI-SCENE EFFECT PROFILING');
    console.log('='.repeat(80));
    
    // Get available scenes
    const scenes = await page.evaluate(() => {
      return game.scenes.contents
        .filter(s => s.active || true) // Get all scenes
        .slice(0, 3) // Limit to 3 scenes for reasonable test time
        .map(s => ({ id: s.id, name: s.name }));
    });
    
    console.log(`\n📋 Found ${scenes.length} scenes to profile:`);
    scenes.forEach((scene, idx) => {
      console.log(`   ${idx + 1}. ${scene.name}`);
    });
    
    if (scenes.length < 2) {
      console.warn('⚠️  Less than 2 scenes available, skipping multi-scene test');
      test.skip();
      return;
    }
    
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
    
    // Run multi-scene profiling
    const sceneIds = scenes.map(s => s.id);
    
    const multiSceneResults = await page.evaluate(async (ids) => {
      return await window.EffectProfiler.profileMultipleScenes(ids);
    }, sceneIds);
    
    // Validate results
    expect(multiSceneResults).toBeDefined();
    expect(multiSceneResults.sceneProfiles).toBeDefined();
    expect(multiSceneResults.analysis).toBeDefined();
    
    console.log('\n✅ Multi-scene profiling complete!');
    console.log(`   Scenes profiled: ${multiSceneResults.sceneProfiles.length}`);
    console.log(`   Effects analyzed: ${multiSceneResults.analysis.effectsAnalyzed}`);
    
    // Save comprehensive report
    const reportPath = await saveProfilingReport(multiSceneResults, 'multi-scene');
    console.log(`\n📄 Comprehensive report saved to: ${reportPath}`);
    
    // Print cross-scene top offenders
    const topOffenders = multiSceneResults.analysis.aggregateResults.slice(0, 5);
    console.log('\n🎯 TOP 5 CROSS-SCENE PERFORMANCE BOTTLENECKS:');
    topOffenders.forEach((result, idx) => {
      console.log(`   ${idx + 1}. ${result.name}`);
      console.log(`      Avg FPS Delta: ${result.avgFPSDelta >= 0 ? '+' : ''}${result.avgFPSDelta.toFixed(2)}`);
      console.log(`      Avg Improvement: ${result.avgImprovementPercent >= 0 ? '+' : ''}${result.avgImprovementPercent.toFixed(1)}%`);
      console.log(`      Consistency: ${result.consistency}`);
    });
    
    // Generate optimization recommendations
    const recommendations = generateOptimizationRecommendations(multiSceneResults);
    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS:');
    recommendations.forEach((rec, idx) => {
      console.log(`\n   ${idx + 1}. ${rec.priority}: ${rec.effect}`);
      console.log(`      ${rec.recommendation}`);
      console.log(`      Expected Gain: ${rec.expectedGain}`);
    });
  });
  
  test('Quick performance snapshot (baseline only)', async ({ page }) => {
    test.setTimeout(120000); // 2 minute timeout
    
    console.log('\n📸 Taking quick performance snapshot...');
    
    // Discover effects
    const discovery = await page.evaluate(() => {
      return game.mapShine.effectDiscovery?.discoverEnabledEffects() || {
        enabledEffects: [],
        sceneInfo: { name: canvas.scene?.name || 'Unknown' }
      };
    });
    
    console.log(`\nScene: ${discovery.sceneInfo.name}`);
    console.log(`Enabled effects: ${discovery.enabledEffects?.length || 0}`);
    
    // Wait for settle
    console.log('⏱️  Waiting 30s for scene to settle...');
    await page.waitForTimeout(30000);
    
    // Quick FPS measurement
    console.log('📊 Measuring baseline FPS (15s)...');
    
    const snapshot = await page.evaluate(async () => {
      const metrics = {
        frameTimes: [],
        startTime: performance.now()
      };
      
      let lastTime = performance.now();
      
      const measure = () => {
        const now = performance.now();
        const delta = now - lastTime;
        lastTime = now;
        metrics.frameTimes.push(delta);
      };
      
      canvas.app.ticker.add(measure);
      
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      canvas.app.ticker.remove(measure);
      
      const avgFrameTime = metrics.frameTimes.reduce((a, b) => a + b, 0) / metrics.frameTimes.length;
      const avgFPS = 1000 / avgFrameTime;
      const minFPS = 1000 / Math.max(...metrics.frameTimes);
      const maxFPS = 1000 / Math.min(...metrics.frameTimes);
      
      return {
        avgFPS,
        minFPS,
        maxFPS,
        avgFrameTime,
        sampleCount: metrics.frameTimes.length
      };
    });
    
    console.log('\n✅ Snapshot complete:');
    console.log(`   Average FPS: ${snapshot.avgFPS.toFixed(2)}`);
    console.log(`   Min/Max: ${snapshot.minFPS.toFixed(2)} / ${snapshot.maxFPS.toFixed(2)}`);
    console.log(`   Frame Time: ${snapshot.avgFrameTime.toFixed(2)}ms`);
    console.log(`   Samples: ${snapshot.sampleCount}`);
    
    expect(snapshot.avgFPS).toBeGreaterThan(10); // Basic sanity check
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Save profiling report to markdown file
 */
async function saveProfilingReport(data, type) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `PROFILING_REPORT_${type}_${timestamp}.md`;
  const reportPath = path.join(__dirname, '../../docs', filename);
  
  let markdown = `# Effect Performance Profiling Report\n\n`;
  markdown += `**Type:** ${type}\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;
  
  if (type === 'single-scene') {
    markdown += generateSingleSceneReport(data);
  } else if (type === 'multi-scene') {
    markdown += generateMultiSceneReport(data);
  }
  
  await fs.promises.writeFile(reportPath, markdown, 'utf8');
  return reportPath;
}

/**
 * Generate single scene report
 */
function generateSingleSceneReport(profile) {
  let md = `## Scene: ${profile.scene.name}\n\n`;
  md += `**Scene ID:** ${profile.scene.id}\n`;
  md += `**Dimensions:** ${profile.scene.width}x${profile.scene.height}\n`;
  md += `**Effects Tested:** ${profile.effectResults.length}\n\n`;
  
  md += `### Baseline Performance\n\n`;
  md += `- **Average FPS:** ${profile.baseline.avgFPS.toFixed(2)}\n`;
  md += `- **Frame Time:** ${profile.baseline.avgFrameTime.toFixed(2)}ms\n`;
  md += `- **Min/Max FPS:** ${profile.baseline.minFPS.toFixed(2)} / ${profile.baseline.maxFPS.toFixed(2)}\n`;
  md += `- **Stutter Events:** ${profile.baseline.stutterEvents}\n\n`;
  
  md += `### Effect Performance Impact Rankings\n\n`;
  md += `| Rank | Effect | FPS Delta | Improvement % | Frame Time Saved | Impact |\n`;
  md += `|------|--------|-----------|---------------|------------------|--------|\n`;
  
  profile.effectResults.forEach((result, idx) => {
    md += `| ${idx + 1} | ${result.effect} | `;
    md += `${result.fpsDelta >= 0 ? '+' : ''}${result.fpsDelta.toFixed(2)} | `;
    md += `${result.fpsImprovementPercent >= 0 ? '+' : ''}${result.fpsImprovementPercent.toFixed(1)}% | `;
    md += `${result.frameTimeSavedMs.toFixed(2)}ms | `;
    md += `${result.impact} |\n`;
  });
  
  md += `\n### Summary\n\n`;
  md += `- **Top 3 Offenders:**\n`;
  profile.summary.topOffenders.forEach((offender, idx) => {
    md += `  ${idx + 1}. **${offender.name}** - ${offender.fpsDelta >= 0 ? '+' : ''}${offender.fpsDelta.toFixed(2)} FPS (${offender.improvement >= 0 ? '+' : ''}${offender.improvement.toFixed(1)}%)\n`;
  });
  
  return md;
}

/**
 * Generate multi-scene report
 */
function generateMultiSceneReport(results) {
  let md = `## Multi-Scene Analysis\n\n`;
  md += `**Scenes Profiled:** ${results.sceneProfiles.length}\n`;
  md += `**Effects Analyzed:** ${results.analysis.effectsAnalyzed}\n\n`;
  
  md += `### Cross-Scene Performance Rankings\n\n`;
  md += `| Rank | Effect | Avg FPS Delta | Avg Improvement | Consistency | Std Dev |\n`;
  md += `|------|--------|---------------|-----------------|-------------|----------|\n`;
  
  results.analysis.aggregateResults.forEach((result, idx) => {
    md += `| ${idx + 1} | ${result.name} | `;
    md += `${result.avgFPSDelta >= 0 ? '+' : ''}${result.avgFPSDelta.toFixed(2)} | `;
    md += `${result.avgImprovementPercent >= 0 ? '+' : ''}${result.avgImprovementPercent.toFixed(1)}% | `;
    md += `${result.consistency} | `;
    md += `${result.stdDev.toFixed(2)} |\n`;
  });
  
  md += `\n### Per-Scene Breakdown\n\n`;
  
  results.sceneProfiles.forEach((profile, idx) => {
    md += `#### Scene ${idx + 1}: ${profile.scene.name}\n\n`;
    md += `- **Baseline FPS:** ${profile.baseline.avgFPS.toFixed(2)}\n`;
    md += `- **Effects Tested:** ${profile.effectResults.length}\n`;
    md += `- **Top 3 Offenders:**\n`;
    
    profile.effectResults.slice(0, 3).forEach((result, i) => {
      md += `  ${i + 1}. **${result.effect}** - ${result.fpsDelta >= 0 ? '+' : ''}${result.fpsDelta.toFixed(2)} FPS\n`;
    });
    
    md += `\n`;
  });
  
  return md;
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(results) {
  const recommendations = [];
  const topEffects = results.analysis.aggregateResults.slice(0, 5);
  
  topEffects.forEach(effect => {
    let priority = 'LOW';
    let recommendation = '';
    let expectedGain = '';
    
    if (effect.avgFPSDelta > 15) {
      priority = 'CRITICAL';
      recommendation = `This effect causes severe performance degradation (${effect.avgFPSDelta.toFixed(1)} FPS average). Immediate optimization required.`;
      expectedGain = `Optimizing this could improve FPS by ${effect.avgImprovementPercent.toFixed(1)}% on average`;
    } else if (effect.avgFPSDelta > 8) {
      priority = 'HIGH';
      recommendation = `Significant performance impact detected. Consider shader optimization or LOD implementation.`;
      expectedGain = `Potential FPS gain: ${effect.avgFPSDelta.toFixed(1)} FPS (${effect.avgImprovementPercent.toFixed(1)}%)`;
    } else if (effect.avgFPSDelta > 3) {
      priority = 'MEDIUM';
      recommendation = `Moderate impact. Review for optimization opportunities when refactoring.`;
      expectedGain = `Estimated improvement: ${effect.avgFPSDelta.toFixed(1)} FPS`;
    } else {
      priority = 'LOW';
      recommendation = `Low impact effect. Optimization not urgent.`;
      expectedGain = `Minor gain of ${effect.avgFPSDelta.toFixed(1)} FPS`;
    }
    
    recommendations.push({
      priority,
      effect: effect.name,
      recommendation,
      expectedGain,
      consistency: effect.consistency
    });
  });
  
  return recommendations;
}
