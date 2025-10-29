/**
 * @fileoverview Comprehensive Test Sequence Runner
 * 
 * Runs all validators and generates detailed report
 * Run this in browser console after Map Shine is loaded
 * 
 * Usage:
 *   Copy this entire file and paste into browser console (F12)
 *   OR
 *   Run: await runComprehensiveTests()
 */

async function runComprehensiveTests() {
  console.clear();
  console.log('═'.repeat(80));
  console.log('    MAP SHINE COMPREHENSIVE TEST SEQUENCE');
  console.log('    Starting:', new Date().toLocaleString());
  console.log('═'.repeat(80));
  
  const report = {
    timestamp: Date.now(),
    dateTime: new Date().toLocaleString(),
    version: game.modules.get('map-shine')?.version || 'Unknown',
    foundryVersion: game.version,
    
    // Test results
    memoryLeaks: null,
    performance: null,
    shaders: null,
    quickHealth: null,
    
    // Summary
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    duration: 0,
    
    // Overall status
    allPassed: false
  };
  
  const startTime = Date.now();
  
  try {
    // Import validators
    const { MemoryLeakDetector } = await import('./validators/MemoryLeakDetector.js');
    const { PerformanceValidator } = await import('./validators/PerformanceValidator.js');
    const { ShaderValidator } = await import('./validators/ShaderValidator.js');
    
    console.log('\n');
    console.log('─'.repeat(80));
    console.log('PHASE 1: QUICK HEALTH CHECK');
    console.log('─'.repeat(80));
    
    // Quick health check
    report.quickHealth = {
      mapShineExists: !!game.mapShine,
      canvasReady: !!canvas.ready,
      managers: {}
    };
    
    if (game.mapShine) {
      report.quickHealth.managers = {
        profileManager: !!game.mapShine.profileManager,
        resourceManager: !!game.mapShine.resourceManager,
        weatherSystemManager: !!game.mapShine.weatherSystemManager,
        particleManager: !!game.mapShine.particleManager,
        geometryMaskManager: !!game.mapShine.geometryMaskManager
      };
    }
    
    console.log('✅ Map Shine loaded:', report.quickHealth.mapShineExists);
    console.log('✅ Canvas ready:', report.quickHealth.canvasReady);
    console.log('✅ Managers:', Object.entries(report.quickHealth.managers)
      .map(([k, v]) => `${k}=${v}`).join(', '));
    
    // Phase 2: Memory Leak Detection
    console.log('\n');
    console.log('─'.repeat(80));
    console.log('PHASE 2: MEMORY LEAK DETECTION (~ 30 seconds)');
    console.log('─'.repeat(80));
    
    // Initial snapshot
    console.log('📸 Taking initial memory snapshot...');
    const initialSnapshot = MemoryLeakDetector.takeSnapshot('test_initial');
    report.totalTests++;
    report.passed++;
    
    console.log(`   PIXI Texture Cache: ${initialSnapshot.pixiTextureCache}`);
    console.log(`   Base Texture Cache: ${initialSnapshot.pixiBaseTextureCache}`);
    console.log(`   Particle Emitters: ${initialSnapshot.particleEmitters}`);
    console.log(`   Pool Active Textures: ${initialSnapshot.poolActiveTextures}`);
    
    // Check pool
    console.log('\n🔍 Checking RenderTexturePool...');
    const poolActive = MemoryLeakDetector._getPoolActiveCount();
    report.totalTests++;
    if (poolActive === 0) {
      console.log('   ✅ Pool has no active textures (GOOD)');
      report.passed++;
    } else {
      console.error(`   ❌ Pool has ${poolActive} unreleased textures (LEAK!)`);
      report.failed++;
    }
    
    // Check layer destruction
    console.log('\n🔍 Checking layer destruction flags...');
    const layerValidation = MemoryLeakDetector.validateLayerDestruction();
    report.totalTests++;
    if (layerValidation.notDestroyed.length === 0) {
      console.log(`   ✅ All ${layerValidation.total} layers properly initialized`);
      report.passed++;
    } else {
      console.error(`   ❌ ${layerValidation.notDestroyed.length} layers have incorrect flags`);
      layerValidation.notDestroyed.forEach(l => {
        console.error(`      - ${l.name}: _destroyed=${l.destroyed}`);
      });
      report.failed++;
    }
    
    // Scene transition test (if multiple scenes)
    if (game.scenes.size >= 2) {
      console.log('\n🔄 Running scene transition leak test...');
      console.log('   (This will take ~15 seconds)');
      
      report.totalTests++;
      try {
        const transitionResult = await MemoryLeakDetector.testSceneTransition();
        
        if (transitionResult.leaksDetected) {
          console.error('   ❌ Scene transition leaked memory!');
          transitionResult.errors.forEach(err => console.error(`      - ${err}`));
          report.failed++;
        } else {
          console.log('   ✅ Scene transition: No leaks detected');
          report.passed++;
        }
        
        report.memoryLeaks = {
          sceneTransition: transitionResult
        };
      } catch (error) {
        console.error('   ❌ Scene transition test failed:', error.message);
        report.failed++;
      }
    } else {
      console.log('\n⚠️  Skipping scene transition test (need 2+ scenes)');
      report.warnings++;
    }
    
    // Effect toggle test
    console.log('\n🔄 Running effect toggle leak test (5 cycles)...');
    report.totalTests++;
    try {
      const toggleResult = await MemoryLeakDetector.testEffectToggle('cloudShadows', 5);
      
      if (toggleResult.leaksDetected) {
        console.error('   ❌ Effect toggle leaked memory!');
        toggleResult.errors.forEach(err => console.error(`      - ${err}`));
        report.failed++;
      } else {
        console.log('   ✅ Effect toggle: No leaks detected');
        report.passed++;
      }
      
      if (!report.memoryLeaks) report.memoryLeaks = {};
      report.memoryLeaks.effectToggle = toggleResult;
    } catch (error) {
      console.error('   ❌ Effect toggle test failed:', error.message);
      report.failed++;
    }
    
    // Phase 3: Performance Monitoring
    console.log('\n');
    console.log('─'.repeat(80));
    console.log('PHASE 3: PERFORMANCE MONITORING (30 seconds)');
    console.log('─'.repeat(80));
    
    console.log('📊 Monitoring FPS, frame times, and VRAM...');
    report.totalTests++;
    try {
      const perfMetrics = await PerformanceValidator.monitorPerformance(30000, 'test_run');
      
      console.log(`\n   Average FPS: ${perfMetrics.avgFPS.toFixed(2)}`);
      console.log(`   Min/Max FPS: ${perfMetrics.minFPS.toFixed(2)} / ${perfMetrics.maxFPS.toFixed(2)}`);
      console.log(`   Frame Time: ${perfMetrics.avgFrameTime.toFixed(2)}ms (σ=${perfMetrics.frameTimeVariance.toFixed(2)}ms)`);
      console.log(`   Stutter Events: ${perfMetrics.stutterEvents}`);
      console.log(`   VRAM Growth: ${perfMetrics.vramGrowthMB.toFixed(2)}MB`);
      
      if (perfMetrics.poolStats) {
        console.log(`   Pool Hit Rate: ${(perfMetrics.poolStats.cacheHitRate * 100).toFixed(1)}%`);
      }
      
      // Validate metrics
      const validation = PerformanceValidator.validateMetrics(perfMetrics);
      
      if (validation.passed) {
        console.log('\n   ✅ All performance metrics within thresholds');
        report.passed++;
      } else {
        console.error('\n   ❌ Performance issues detected:');
        validation.errors.forEach(err => console.error(`      - ${err}`));
        report.failed++;
      }
      
      if (validation.warnings.length > 0) {
        console.warn('\n   ⚠️  Performance warnings:');
        validation.warnings.forEach(warn => console.warn(`      - ${warn}`));
        report.warnings += validation.warnings.length;
      }
      
      report.performance = {
        metrics: perfMetrics,
        validation
      };
    } catch (error) {
      console.error('   ❌ Performance monitoring failed:', error.message);
      report.failed++;
    }
    
    // Phase 4: Shader Validation
    console.log('\n');
    console.log('─'.repeat(80));
    console.log('PHASE 4: SHADER VALIDATION');
    console.log('─'.repeat(80));
    
    console.log('🎨 Validating shader compilation and uniforms...');
    report.totalTests++;
    try {
      const shaderResults = ShaderValidator.validateAllShaders();
      
      console.log(`\n   Total Shaders: ${shaderResults.total}`);
      console.log(`   ✅ Passed: ${shaderResults.passed}`);
      console.log(`   ❌ Failed: ${shaderResults.failed}`);
      console.log(`   ⏭️  Skipped: ${shaderResults.skipped}`);
      
      // Show details for failed shaders
      if (shaderResults.failed > 0) {
        console.error('\n   Failed Shaders:');
        shaderResults.details.filter(d => !d.passed && !d.skipped).forEach(d => {
          console.error(`      - ${d.name}:`);
          d.errors.forEach(err => console.error(`         ❌ ${err}`));
        });
        report.failed++;
      } else {
        report.passed++;
      }
      
      // Show warnings
      const totalWarnings = shaderResults.details.reduce((sum, d) => sum + d.warnings.length, 0);
      if (totalWarnings > 0) {
        console.warn(`\n   ⚠️  ${totalWarnings} shader warnings`);
        report.warnings += totalWarnings;
      }
      
      report.shaders = shaderResults;
      
      // Runtime error check
      console.log('\n🔍 Checking for shader runtime errors...');
      const runtimeErrors = ShaderValidator.checkRuntimeErrors();
      
      if (runtimeErrors.nullBaseTextureAccess.length > 0) {
        console.error(`   ❌ Found ${runtimeErrors.nullBaseTextureAccess.length} null baseTexture issues`);
        runtimeErrors.nullBaseTextureAccess.slice(0, 3).forEach(err => {
          console.error(`      - ${err.layer} → ${err.filter}.${err.uniform}`);
        });
      } else {
        console.log('   ✅ No runtime shader errors detected');
      }
      
    } catch (error) {
      console.error('   ❌ Shader validation failed:', error.message);
      report.failed++;
    }
    
  } catch (error) {
    console.error('\n❌ FATAL TEST ERROR:', error);
    report.failed++;
  }
  
  // Calculate duration
  report.duration = Date.now() - startTime;
  report.allPassed = report.failed === 0;
  
  // Print final summary
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('    TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Tests:  ${report.totalTests}`);
  console.log(`✅ Passed:    ${report.passed}`);
  console.log(`❌ Failed:    ${report.failed}`);
  console.log(`⚠️  Warnings:  ${report.warnings}`);
  console.log(`⏱️  Duration:  ${(report.duration / 1000).toFixed(1)}s`);
  console.log(`📊 Status:    ${report.allPassed ? '✅ ALL PASSED' : '❌ FAILURES DETECTED'}`);
  console.log('═'.repeat(80));
  
  // Generate detailed reports
  if (report.failed > 0 || report.warnings > 0) {
    console.log('\n📋 DETAILED REPORTS:\n');
    
    const { MemoryLeakDetector } = await import('./validators/MemoryLeakDetector.js');
    const { PerformanceValidator } = await import('./validators/PerformanceValidator.js');
    const { ShaderValidator } = await import('./validators/ShaderValidator.js');
    
    if (MemoryLeakDetector.getErrors().length > 0) {
      console.log(MemoryLeakDetector.generateReport());
    }
    
    if (PerformanceValidator.getErrors().length > 0) {
      console.log(PerformanceValidator.generateReport());
    }
    
    if (ShaderValidator.getErrors().length > 0) {
      console.log(ShaderValidator.generateReport());
    }
  }
  
  // Store report for export
  window.mapShineTestReport = report;
  
  console.log('\n💾 Report saved to: window.mapShineTestReport');
  console.log('💾 To export: copy(JSON.stringify(window.mapShineTestReport, null, 2))');
  
  return report;
}

// Auto-run if this script is executed
if (typeof game !== 'undefined' && game.ready) {
  console.log('🚀 Auto-running comprehensive tests...');
  runComprehensiveTests().then(report => {
    console.log('\n✅ Test sequence complete!');
  }).catch(error => {
    console.error('\n❌ Test sequence failed:', error);
  });
} else {
  console.log('⚠️  Game not ready. Run manually: await runComprehensiveTests()');
}
