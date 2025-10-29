/**
 * @fileoverview Effect Profiler - Systematic performance impact analysis
 * 
 * Orchestrates comprehensive effect profiling:
 * 1. Discovers all enabled effects in scene
 * 2. Establishes baseline FPS with all effects
 * 3. Systematically disables effects one-by-one and measures FPS delta
 * 4. Ranks effects by performance impact
 * 5. Repeats across multiple scenes
 * 6. Generates optimization recommendations
 * 
 * Goal: Identify which effects are the most demanding to target for optimization.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

// Access dependencies via window globals (loaded by Playwright)
const PerformanceValidator = typeof window !== 'undefined' ? window.PerformanceValidator : null;
const EffectDiscovery = typeof window !== 'undefined' ? window.EffectDiscovery : null;

export class EffectProfiler {
  static results = [];
  static currentProfile = null;
  
  /**
   * Profiling configuration
   */
  static CONFIG = {
    settleTimeMs: 30000,        // 30s initial settle time
    effectSettleTimeMs: 5000,   // 5s settle after toggling effect
    measurementDurationMs: 15000, // 15s FPS measurement per effect
    baselineDurationMs: 20000   // 20s baseline measurement
  };
  
  /**
   * Profile the current scene by systematically disabling effects
   * 
   * @param {Object} options - Profiling options
   * @param {boolean} options.soloMode - If true, tests each effect alone (all others disabled)
   * @returns {Promise<Object>} Profile results
   */
  static async profileCurrentScene(options = {}) {
    const testStartTime = Date.now();
    const soloMode = options.soloMode || false;
    console.log('\n' + '='.repeat(80));
    console.log('  EFFECT PERFORMANCE PROFILING - STARTING');
    console.log('  Start Time: ' + new Date().toLocaleTimeString());
    console.log('='.repeat(80));
    
    const config = {
      ...this.CONFIG,
      ...options
    };
    
    // Step 1: Discover enabled effects
    console.log('\n📋 Step 1: Discovering enabled effects...');
    const discovery = EffectDiscovery.discoverEnabledEffects();
    console.log(EffectDiscovery.formatDiscoverySummary(discovery));
    
    if (discovery.enabledEffects.length === 0) {
      console.warn('⚠️  No effects enabled - nothing to profile!');
      return {
        scene: discovery.sceneInfo,
        enabledEffects: 0,
        results: []
      };
    }
    
    // Step 2: Initial settle time
    console.log(`\n⏱️  Step 2: Waiting ${config.settleTimeMs/1000}s for scene to settle...`);
    await this._wait(config.settleTimeMs);
    console.log('✅ Scene settled');
    
    console.log('\n' + '='.repeat(60));
    if (soloMode) {
      console.log('  BASELINE MEASUREMENT (All Effects Disabled - Solo Mode)');
    } else {
      console.log('  BASELINE MEASUREMENT (All Effects Enabled)');
    }
    console.log('='.repeat(60));
    
    // In solo mode, disable all effects for baseline
    if (soloMode) {
      console.log('\n' + '🔄'.repeat(30));
      console.log('DISABLING ALL EFFECTS FOR SOLO MODE BASELINE');
      console.log('🔄'.repeat(30));
      
      for (let i = 0; i < discovery.enabledEffects.length; i++) {
        const effect = discovery.enabledEffects[i];
        console.log(`\n[${i+1}/${discovery.enabledEffects.length}] Disabling: ${effect.name}`);
        await this._toggleEffect(effect.path, false);
        await this._wait(1000); // Wait 1s between each disable
      }
      
      console.log('\n' + '✅'.repeat(30));
      console.log('ALL EFFECTS SHOULD NOW BE DISABLED');
      console.log('✅'.repeat(30));
    }
    
    // Settle first
    console.log(`Waiting ${config.settleTimeMs/1000}s for initial settle...`);
    await this._wait(config.settleTimeMs);
    
    // Measure baseline
    console.log(`Measuring baseline FPS (${config.measurementDurationMs/1000}s)...`);
    const baseline = await PerformanceValidator.monitorPerformance(
      config.measurementDurationMs,
      soloMode ? 'baseline_all_disabled' : 'baseline_all_enabled'
    );
    
    console.log(`\n   ✅ Baseline: ${baseline.avgFPS.toFixed(2)} FPS`);
    console.log(`      Frame Time: ${baseline.avgFrameTime.toFixed(2)}ms`);
    console.log(`      Min/Max: ${baseline.minFPS.toFixed(2)} / ${baseline.maxFPS.toFixed(2)} FPS`);
    
    // Step 4: Systematic effect isolation testing
    console.log('\n🔍 Step 4: Testing individual effect performance impact...');
    console.log('─'.repeat(80));
    
    console.log('\n' + '='.repeat(60));
    if (soloMode) {
      console.log('  SOLO MODE: Testing Each Effect Individually');
    } else {
      console.log('  INDIVIDUAL EFFECT TESTING');
    }
    console.log('='.repeat(60));
    
    const effectResults = [];
    
    for (let i = 0; i < discovery.enabledEffects.length; i++) {
      const effect = discovery.enabledEffects[i];
      
      const progressPercent = ((i / discovery.enabledEffects.length) * 100).toFixed(1);
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 PROGRESS: ${progressPercent}% (${i}/${discovery.enabledEffects.length} effects tested)`);
      console.log(`${'='.repeat(60)}`);
      console.log(`\n[${i+1}/${discovery.enabledEffects.length}] Testing: ${effect.name}`);
      console.log(`   Category: ${effect.category} | Path: ${effect.path}`);
      
      if (soloMode) {
        // Solo mode: Enable ONLY this effect
        console.log('   Enabling effect solo...');
        await this._toggleEffect(effect.path, true);
      } else {
        // Normal mode: Disable this effect
        console.log('   Disabling effect...');
        await this._toggleEffect(effect.path, false);
      }
      
      // Wait for settle with progress updates
      console.log(`   Waiting ${config.effectSettleTimeMs/1000}s for settle...`);
      await this._waitWithProgress(config.effectSettleTimeMs, 1000, (elapsed, remaining) => {
        console.log(`      ⏳ Settling: ${elapsed/1000}s / ${config.effectSettleTimeMs/1000}s (${remaining/1000}s remaining)`);
      });
      console.log(`   ✅ Settle complete`);
      
      // Measure performance with progress updates
      console.log(`   Measuring FPS (${config.measurementDurationMs/1000}s)...`);
      const measurementStartTime = Date.now();
      const measurement = await PerformanceValidator.monitorPerformance(
        config.measurementDurationMs,
        soloMode ? `solo_${effect.key}` : `without_${effect.key}`,
        // Progress callback every 5 seconds
        (elapsed, fps) => {
          const remaining = config.measurementDurationMs - elapsed;
          console.log(`      📊 Measuring: ${elapsed/1000}s / ${config.measurementDurationMs/1000}s | Current FPS: ${fps.toFixed(1)} | ${remaining/1000}s remaining`);
        }
      );
      const measurementDuration = Date.now() - measurementStartTime;
      console.log(`   ✅ Measurement complete (actual duration: ${(measurementDuration/1000).toFixed(1)}s)`);
      
      // Calculate delta
      let fpsDelta, frameTimeDelta, fpsImpact;
      if (soloMode) {
        // Solo mode: Compare enabled effect vs empty baseline
        fpsDelta = baseline.avgFPS - measurement.avgFPS; // Cost of this effect
        frameTimeDelta = measurement.avgFrameTime - baseline.avgFrameTime;
        fpsImpact = (fpsDelta / baseline.avgFPS) * 100;
        
        console.log(`   With effect solo: ${measurement.avgFPS.toFixed(2)} FPS`);
        console.log(`   Cost: ${fpsDelta >= 0 ? '' : '+'}${(-fpsDelta).toFixed(2)} FPS (${fpsImpact >= 0 ? '' : '+'}${(-fpsImpact).toFixed(1)}%)`);
        console.log(`   Frame Time Cost: ${frameTimeDelta.toFixed(2)}ms`);
      } else {
        // Normal mode: Compare without effect vs all enabled
        fpsDelta = measurement.avgFPS - baseline.avgFPS;
        frameTimeDelta = baseline.avgFrameTime - measurement.avgFrameTime;
        fpsImpact = (fpsDelta / baseline.avgFPS) * 100;
        
        console.log(`   Without effect: ${measurement.avgFPS.toFixed(2)} FPS`);
        console.log(`   Delta: ${fpsDelta >= 0 ? '+' : ''}${fpsDelta.toFixed(2)} FPS (${fpsImpact >= 0 ? '+' : ''}${fpsImpact.toFixed(1)}%)`);
        console.log(`   Frame Time Saved: ${frameTimeDelta.toFixed(2)}ms`);
      }
      
      effectResults.push({
        effect: effect.name,
        effectKey: effect.key,
        category: effect.category,
        path: effect.path,
        baselineFPS: baseline.avgFPS,
        testFPS: measurement.avgFPS,
        fpsDelta: soloMode ? -fpsDelta : fpsDelta, // Negative in solo mode = cost
        fpsImpactPercent: soloMode ? -fpsImpact : fpsImpact,
        frameTimeDeltaMs: frameTimeDelta,
        baselineFrameTime: baseline.avgFrameTime,
        testFrameTime: measurement.avgFrameTime,
        impact: this._categorizeImpact(soloMode ? -fpsImpact : fpsImpact),
        mode: soloMode ? 'solo' : 'disabled'
      });
      
      if (soloMode) {
        // Solo mode: Disable effect before next test
        console.log('   Disabling effect...');
        await this._toggleEffect(effect.path, false);
      } else {
        // Normal mode: Re-enable effect for next test
        console.log('   Re-enabling effect...');
        await this._toggleEffect(effect.path, true);
      }
      
      // Brief settle before next effect
      await this._wait(2000);
    }
    
    // Restore all effects to original state
    if (soloMode) {
      console.log('\nRestoring all effects to enabled state...');
      for (const effect of discovery.enabledEffects) {
        await this._toggleEffect(effect.path, true);
      }
      await this._wait(2000);
    }
    
    // Sort by impact (biggest impact first)
    effectResults.sort((a, b) => Math.abs(b.fpsImpactPercent) - Math.abs(a.fpsImpactPercent));
    
    // Step 6: Generate report
    const testEndTime = Date.now();
    const totalDurationMinutes = ((testEndTime - testStartTime) / 1000 / 60).toFixed(1);
    
    const profile = {
      timestamp: Date.now(),
      scene: discovery.sceneInfo,
      config: config,
      discovery: discovery,
      baseline: baseline,
      effectResults,
      recommendations: this._generateRecommendations(effectResults),
      mode: soloMode ? 'solo' : 'disabled',
      testDurationMs: testEndTime - testStartTime,
      testDurationMinutes: totalDurationMinutes
    };
    
    this.currentProfile = profile;
    this.results.push(profile);
    
    console.log('\n' + '='.repeat(80));
    console.log('  PROFILING COMPLETE');
    console.log('  End Time: ' + new Date().toLocaleTimeString());
    console.log(`  Total Duration: ${totalDurationMinutes} minutes`);
    console.log('='.repeat(80));
    console.log(`\n✅ Tested ${effectResults.length} effects`);
    console.log(`   Baseline FPS: ${baseline.avgFPS.toFixed(2)}`);
    console.log(`   Baseline Frame Time: ${baseline.avgFrameTime.toFixed(2)}ms`);
    
    this._printRankings(effectResults);
    
    return profile;
  }
  
  /**
   * Run profiling across multiple scenes
   * 
   * @param {Array<string>} sceneIds - Scene IDs to profile
   * @param {Object} options - Profiling options
   * @returns {Promise<Object>} Multi-scene profiling results
   */
  static async profileMultipleScenes(sceneIds, options = {}) {
    console.log('\n' + '='.repeat(80));
    console.log(`  MULTI-SCENE PROFILING (${sceneIds.length} scenes)`);
    console.log('='.repeat(80));
    
    const sceneProfiles = [];
    
    for (let i = 0; i < sceneIds.length; i++) {
      const sceneId = sceneIds[i];
      const scene = game.scenes.get(sceneId);
      
      if (!scene) {
        console.warn(`⚠️  Scene ${sceneId} not found, skipping...`);
        continue;
      }
      
      console.log(`\n\n${'█'.repeat(80)}`);
      console.log(`  SCENE ${i+1}/${sceneIds.length}: ${scene.name}`);
      console.log('█'.repeat(80));
      
      // Navigate to scene
      console.log('\n🔄 Switching to scene...');
      await scene.view();
      
      // Wait for transition to complete
      console.log('⏱️  Waiting for scene transition to complete (10s)...');
      await this._wait(10000);
      
      // Run profiling
      const profile = await this.profileCurrentScene(options);
      profile.sceneIndex = i;
      sceneProfiles.push(profile);
    }
    
    // Generate cross-scene analysis
    const multiSceneAnalysis = this._analyzeMultiSceneResults(sceneProfiles);
    
    console.log('\n\n' + '='.repeat(80));
    console.log('  MULTI-SCENE ANALYSIS COMPLETE');
    console.log('='.repeat(80));
    
    this._printMultiSceneAnalysis(multiSceneAnalysis);
    
    return {
      sceneProfiles,
      analysis: multiSceneAnalysis
    };
  }
  
  // ============================================================================
  // HELPER METHODS
  // ============================================================================
  
  /**
   * Toggle effect enabled state
   */
  static async _toggleEffect(path, enabled) {
    const config = game.mapShine.profileManager.activeConfig;
    
    // Log BEFORE state
    const beforeValue = foundry.utils.getProperty(config, path);
    console.log(`\n🔧 TOGGLING EFFECT: ${path}`);
    console.log(`   BEFORE: ${beforeValue}`);
    console.log(`   TARGET: ${enabled}`);
    
    // Set the config value
    foundry.utils.setProperty(config, path, enabled);
    
    // Verify it was set
    const afterValue = foundry.utils.getProperty(config, path);
    console.log(`   AFTER:  ${afterValue}`);
    
    if (afterValue !== enabled) {
      console.error(`   ❌ FAILED TO SET! Expected ${enabled}, got ${afterValue}`);
    } else {
      console.log(`   ✅ Config value updated successfully`);
    }
    
    // ⚠️ SPECIAL HANDLING: Weather system requires AGGRESSIVE shutdown
    if (path === 'weather.enabled') {
      const manager = game.mapShine.weatherSystemManager;
      if (manager) {
        if (!enabled) {
          console.log(`   🌧️ FORCE STOPPING WEATHER SYSTEM...`);
          
          // 1. Stop all weather shader effects (rain/snow/fog)
          if (manager.weatherEffectLayer) {
            manager.weatherEffectLayer.stopAllEffects();
            manager.weatherEffectLayer.visible = false;
            manager.weatherEffectLayer.renderable = false;
            console.log(`      ✅ Weather shaders stopped and hidden`);
          }
          
          // 2. Stop edge droplet particle emitter
          if (manager.edgeDropletController) {
            manager.edgeDropletController.stop();
            if (manager.edgeDropletController.emitter) {
              manager.edgeDropletController.emitter.emit = false;
              manager.edgeDropletController.emitter.frequency = 0;
            }
            if (manager.edgeDropletController.container) {
              manager.edgeDropletController.container.visible = false;
              manager.edgeDropletController.container.renderable = false;
            }
            console.log(`      ✅ Edge droplets stopped and hidden`);
          }
          
          // 3. Force state to 'clear' (no transition)
          manager.currentState = 'clear';
          manager.targetState = 'clear';
          manager.isTransitioning = false;
          console.log(`      ✅ State forced to 'clear'`);
          
        } else {
          console.log(`   🌧️ ENABLING WEATHER SYSTEM...`);
          
          // Re-enable weather layer
          if (manager.weatherEffectLayer) {
            manager.weatherEffectLayer.visible = true;
            manager.weatherEffectLayer.renderable = true;
          }
          
          // Re-enable edge droplets container (emitter controlled by state)
          if (manager.edgeDropletController?.container) {
            manager.edgeDropletController.container.visible = true;
            manager.edgeDropletController.container.renderable = true;
          }
          
          console.log(`      ✅ Weather system re-enabled`);
        }
      }
    }
    
    // Update all systems
    console.log(`   📡 Broadcasting config update to all layers...`);
    await game.mapShine.profileManager.updateAllSystemsFromConfig();
    
    // Wait for one render frame to ensure changes take effect
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Verify the effect is actually disabled/enabled by checking layer state
    this._verifyEffectState(path, enabled);
  }
  
  /**
   * Verify that an effect has actually been disabled/enabled
   * by checking the layer's internal state
   */
  static _verifyEffectState(path, expectedEnabled) {
    const effectKey = path.split('.')[0];
    console.log(`\n🔍 VERIFYING EFFECT STATE: ${effectKey}`);
    
    // Find the relevant layer
    const layerMap = {
      'cloudShadows': 'CloudShadowsLayer',
      'canopy': 'CanopyLayer',
      'structuralShadows': 'StructuralShadowsLayer',
      'iridescence': 'IridescenceLayer',
      'prism': 'PrismLayer',
      'waterFX': 'WaterFXLayer',
      'buildingShadows': 'BuildingShadowsLayer',
      'timeOfDay': 'TimeOfDayLayer',
      'heatDistortion': 'HeatDistortionLayer',
      'weather': 'WeatherSystemManager'
    };
    
    const layerClassName = layerMap[effectKey];
    if (!layerClassName) {
      console.log(`   ⚠️  No layer mapping for ${effectKey}`);
      return;
    }
    
    if (effectKey === 'weather') {
      const manager = game.mapShine.weatherSystemManager;
      if (manager) {
        console.log(`   Layer: WeatherSystemManager`);
        console.log(`   Visible: ${manager.weatherEffectLayer?.visible}`);
        console.log(`   Current State: ${manager.currentState}`);
      }
    } else {
      const layer = canvas.layers.find(l => l.constructor.name === layerClassName);
      if (layer) {
        console.log(`   Layer: ${layerClassName}`);
        console.log(`   Visible: ${layer.visible}`);
        console.log(`   Has effectKey: ${!!layer.options?.effectKey}`);
        console.log(`   effectKey value: ${layer.options?.effectKey}`);
        
        // Check if layer has a filter/shader that we can inspect
        if (layer.filter) {
          console.log(`   Filter enabled: ${layer.filter.enabled}`);
        }
        if (layer.cloudFilter) {
          console.log(`   Cloud filter enabled: ${layer.cloudFilter.enabled}`);
        }
      } else {
        console.log(`   ❌ Layer ${layerClassName} not found!`);
      }
    }
    
    console.log(`   Expected state: ${expectedEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`${'─'.repeat(60)}`);
  }
  
  /**
   * Wait helper
   */
  static async _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Wait helper with progress callbacks
   * @param {number} totalMs - Total wait time
   * @param {number} intervalMs - Progress update interval
   * @param {Function} callback - Called with (elapsed, remaining)
   */
  static async _waitWithProgress(totalMs, intervalMs, callback) {
    const startTime = Date.now();
    const endTime = startTime + totalMs;
    
    while (Date.now() < endTime) {
      const elapsed = Date.now() - startTime;
      const remaining = endTime - Date.now();
      
      if (callback) {
        callback(elapsed, remaining);
      }
      
      // Wait for interval or remaining time, whichever is shorter
      const waitTime = Math.min(intervalMs, remaining);
      await this._wait(waitTime);
    }
  }
  
  /**
   * Categorize performance impact
   */
  static _categorizeImpact(fpsImprovementPercent) {
    const abs = Math.abs(fpsImprovementPercent);
    
    if (abs < 2) return 'NEGLIGIBLE';
    if (abs < 5) return 'LOW';
    if (abs < 10) return 'MODERATE';
    if (abs < 20) return 'HIGH';
    return 'CRITICAL';
  }
  
  /**
   * Generate summary statistics
   */
  static _generateSummary(baseline, effectResults) {
    const totalFPSImprovement = effectResults.reduce((sum, r) => sum + r.fpsDelta, 0);
    const avgImprovementPercent = effectResults.reduce((sum, r) => sum + r.fpsImprovementPercent, 0) / effectResults.length;
    
    const byImpact = {
      CRITICAL: effectResults.filter(r => r.impact === 'CRITICAL'),
      HIGH: effectResults.filter(r => r.impact === 'HIGH'),
      MODERATE: effectResults.filter(r => r.impact === 'MODERATE'),
      LOW: effectResults.filter(r => r.impact === 'LOW'),
      NEGLIGIBLE: effectResults.filter(r => r.impact === 'NEGLIGIBLE')
    };
    
    return {
      baselineFPS: baseline.avgFPS,
      effectsTested: effectResults.length,
      totalFPSImprovement: totalFPSImprovement,
      avgImprovementPercent: avgImprovementPercent,
      byImpact: {
        CRITICAL: byImpact.CRITICAL.length,
        HIGH: byImpact.HIGH.length,
        MODERATE: byImpact.MODERATE.length,
        LOW: byImpact.LOW.length,
        NEGLIGIBLE: byImpact.NEGLIGIBLE.length
      },
      topOffenders: effectResults.slice(0, 3).map(r => ({
        name: r.effect,
        fpsDelta: r.fpsDelta,
        improvement: r.fpsImprovementPercent
      }))
    };
  }
  
  /**
   * Generate optimization recommendations
   */
  static _generateRecommendations(effectResults) {
    const recommendations = [];
    
    // Find high-impact effects
    const highImpact = effectResults.filter(r => r.impact === 'HIGH' || r.impact === 'CRITICAL');
    if (highImpact.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        type: 'OPTIMIZATION',
        effects: highImpact.map(r => r.effect),
        message: `${highImpact.length} effect(s) have HIGH or CRITICAL performance impact. Prioritize optimization.`
      });
    }
    
    // Find effects with negligible impact
    const negligible = effectResults.filter(r => r.impact === 'NEGLIGIBLE');
    if (negligible.length > 3) {
      recommendations.push({
        priority: 'INFO',
        type: 'WELL_OPTIMIZED',
        effects: negligible.map(r => r.effect),
        message: `${negligible.length} effects have negligible impact. These are well-optimized.`
      });
    }
    
    return recommendations;
  }
  
  /**
   * Print ranked results
   */
  static _printRankings(effectResults) {
    console.log('\n📊 PERFORMANCE IMPACT RANKINGS:');
    console.log('─'.repeat(80));
    console.log('Rank | Effect Name              | FPS Delta | Improvement | Impact');
    console.log('─'.repeat(80));
    
    effectResults.forEach((result, idx) => {
      const rank = (idx + 1).toString().padStart(4);
      const name = result.effect.padEnd(24);
      const delta = (result.fpsDelta >= 0 ? '+' : '') + result.fpsDelta.toFixed(2).padStart(7);
      const improvement = (result.fpsImpactPercent >= 0 ? '+' : '') + result.fpsImpactPercent.toFixed(1).padStart(6) + '%';
      const impact = result.impact.padEnd(10);
      
      console.log(`${rank} | ${name} | ${delta} | ${improvement} | ${impact}`);
    });
    
    console.log('─'.repeat(80));
  }
  
  /**
   * Analyze results across multiple scenes
   */
  static _analyzeMultiSceneResults(sceneProfiles) {
    const effectAggregates = {};
    
    // Aggregate effect data across scenes
    for (const profile of sceneProfiles) {
      for (const result of profile.effectResults) {
        if (!effectAggregates[result.effectKey]) {
          effectAggregates[result.effectKey] = {
            name: result.effect,
            category: result.category,
            scenes: [],
            avgFPSDelta: 0,
            avgImprovementPercent: 0,
            consistency: 0
          };
        }
        
        effectAggregates[result.effectKey].scenes.push({
          sceneName: profile.scene.name,
          fpsDelta: result.fpsDelta,
          improvementPercent: result.fpsImprovementPercent,
          impact: result.impact
        });
      }
    }
    
    // Calculate aggregate statistics
    const aggregateResults = [];
    
    for (const [key, data] of Object.entries(effectAggregates)) {
      const avgFPSDelta = data.scenes.reduce((sum, s) => sum + s.fpsDelta, 0) / data.scenes.length;
      const avgImprovementPercent = data.scenes.reduce((sum, s) => sum + s.improvementPercent, 0) / data.scenes.length;
      
      // Calculate consistency (standard deviation of improvement percentages)
      const variance = data.scenes.reduce((sum, s) => {
        return sum + Math.pow(s.improvementPercent - avgImprovementPercent, 2);
      }, 0) / data.scenes.length;
      const stdDev = Math.sqrt(variance);
      const consistency = stdDev < 5 ? 'HIGH' : stdDev < 10 ? 'MODERATE' : 'LOW';
      
      aggregateResults.push({
        effectKey: key,
        name: data.name,
        category: data.category,
        avgFPSDelta,
        avgImprovementPercent,
        consistency,
        stdDev,
        sceneData: data.scenes
      });
    }
    
    // Sort by average FPS delta
    aggregateResults.sort((a, b) => b.avgFPSDelta - a.avgFPSDelta);
    
    return {
      sceneCount: sceneProfiles.length,
      effectsAnalyzed: aggregateResults.length,
      aggregateResults
    };
  }
  
  /**
   * Print multi-scene analysis
   */
  static _printMultiSceneAnalysis(analysis) {
    console.log('\n📊 CROSS-SCENE PERFORMANCE ANALYSIS:');
    console.log('─'.repeat(80));
    console.log('Rank | Effect Name              | Avg FPS Δ | Avg Impact | Consistency');
    console.log('─'.repeat(80));
    
    analysis.aggregateResults.forEach((result, idx) => {
      const rank = (idx + 1).toString().padStart(4);
      const name = result.name.padEnd(24);
      const delta = (result.avgFPSDelta >= 0 ? '+' : '') + result.avgFPSDelta.toFixed(2).padStart(9);
      const improvement = (result.avgImprovementPercent >= 0 ? '+' : '') + result.avgImprovementPercent.toFixed(1).padStart(7) + '%';
      const consistency = result.consistency.padEnd(11);
      
      console.log(`${rank} | ${name} | ${delta} | ${improvement} | ${consistency}`);
    });
    
    console.log('─'.repeat(80));
    console.log(`\nAnalyzed ${analysis.effectsAnalyzed} effects across ${analysis.sceneCount} scenes`);
  }
  
  /**
   * Export results to JSON for further analysis
   */
  static exportResults() {
    return {
      timestamp: Date.now(),
      allProfiles: this.results,
      currentProfile: this.currentProfile
    };
  }
  
  /**
   * Clear all profiling results
   */
  static clearResults() {
    this.results = [];
    this.currentProfile = null;
  }
}

// Make globally available for Playwright tests
if (typeof window !== 'undefined') {
  window.EffectProfiler = EffectProfiler;
}
