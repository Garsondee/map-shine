/**
 * FPS Settings Diagnostic
 * 
 * Run this in the browser console (F12) when Foundry VTT is loaded
 * to capture all FPS-related settings that are working correctly.
 * 
 * Copy the output and we'll use it to fix the test settings.
 */

(function() {
  console.log('\n' + '='.repeat(80));
  console.log('FPS SETTINGS DIAGNOSTIC - FOUNDRY VTT');
  console.log('='.repeat(80) + '\n');

  const diagnosticData = {};

  // ============================================================================
  // SECTION 1: PIXI Ticker Settings
  // ============================================================================
  console.log('📊 PIXI TICKER SETTINGS');
  console.log('-'.repeat(80));
  
  if (canvas?.app?.ticker) {
    const ticker = canvas.app.ticker;
    
    diagnosticData.ticker = {
      maxFPS: ticker.maxFPS,
      minFPS: ticker.minFPS,
      targetFPS: ticker.targetFPS,
      FPS: ticker.FPS,
      speed: ticker.speed,
      started: ticker.started,
      deltaTime: ticker.deltaTime,
      deltaMS: ticker.deltaMS,
      elapsedMS: ticker.elapsedMS,
      lastTime: ticker.lastTime,
      autoStart: ticker.autoStart
    };
    
    console.table(diagnosticData.ticker);
    
    console.log('\n📌 Key Settings:');
    console.log(`   maxFPS: ${ticker.maxFPS} ${ticker.maxFPS === 120 ? '✅ (CORRECT!)' : ticker.maxFPS === 0 ? '❌ (UNLIMITED)' : '⚠️'}`);
    console.log(`   minFPS: ${ticker.minFPS}`);
    console.log(`   targetFPS: ${ticker.targetFPS.toFixed(2)}`);
    console.log(`   Current FPS: ${ticker.FPS.toFixed(2)}`);
  } else {
    console.error('❌ canvas.app.ticker not available!');
    diagnosticData.ticker = null;
  }

  // ============================================================================
  // SECTION 2: Canvas Performance Settings
  // ============================================================================
  console.log('\n\n🎨 CANVAS PERFORMANCE SETTINGS');
  console.log('-'.repeat(80));
  
  if (canvas?.performance) {
    diagnosticData.performance = {
      mode: canvas.performance.mode,
      modeLabel: ['LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'][canvas.performance.mode] || 'UNKNOWN'
    };
    
    console.table(diagnosticData.performance);
    console.log(`   Performance Mode: ${diagnosticData.performance.mode} (${diagnosticData.performance.modeLabel})`);
  } else {
    console.error('❌ canvas.performance not available!');
    diagnosticData.performance = null;
  }

  // ============================================================================
  // SECTION 3: PIXI Renderer Settings
  // ============================================================================
  console.log('\n\n🖼️  PIXI RENDERER SETTINGS');
  console.log('-'.repeat(80));
  
  if (canvas?.app?.renderer) {
    const renderer = canvas.app.renderer;
    
    diagnosticData.renderer = {
      type: renderer.type,
      resolution: renderer.resolution,
      autoDensity: renderer.autoDensity,
      powerPreference: renderer.options?.powerPreference,
      antialias: renderer.options?.antialias,
      preserveDrawingBuffer: renderer.options?.preserveDrawingBuffer,
      clearBeforeRender: renderer.options?.clearBeforeRender
    };
    
    console.table(diagnosticData.renderer);
  } else {
    console.error('❌ canvas.app.renderer not available!');
    diagnosticData.renderer = null;
  }

  // ============================================================================
  // SECTION 4: Application Settings
  // ============================================================================
  console.log('\n\n⚙️  APPLICATION SETTINGS');
  console.log('-'.repeat(80));
  
  if (canvas?.app) {
    diagnosticData.app = {
      stage: canvas.app.stage ? 'Present' : 'Missing',
      renderer: canvas.app.renderer ? 'Present' : 'Missing',
      ticker: canvas.app.ticker ? 'Present' : 'Missing',
      screen_width: canvas.app.screen?.width,
      screen_height: canvas.app.screen?.height,
      view_width: canvas.app.view?.width,
      view_height: canvas.app.view?.height
    };
    
    console.table(diagnosticData.app);
  } else {
    console.error('❌ canvas.app not available!');
    diagnosticData.app = null;
  }

  // ============================================================================
  // SECTION 5: Browser/Window Settings
  // ============================================================================
  console.log('\n\n🌐 BROWSER/WINDOW SETTINGS');
  console.log('-'.repeat(80));
  
  diagnosticData.browser = {
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenAvailWidth: window.screen.availWidth,
    screenAvailHeight: window.screen.availHeight
  };
  
  console.log(`   User Agent: ${diagnosticData.browser.userAgent}`);
  console.log(`   Device Pixel Ratio: ${diagnosticData.browser.devicePixelRatio}`);
  console.log(`   Window Size: ${diagnosticData.browser.innerWidth} x ${diagnosticData.browser.innerHeight}`);
  console.log(`   Screen Size: ${diagnosticData.browser.screenWidth} x ${diagnosticData.browser.screenHeight}`);

  // ============================================================================
  // SECTION 6: FPS Measurement (5 second sample)
  // ============================================================================
  console.log('\n\n⏱️  FPS MEASUREMENT (5 second sample)');
  console.log('-'.repeat(80));
  console.log('⏳ Measuring FPS for 5 seconds...');
  
  const fpsData = {
    samples: [],
    startTime: performance.now()
  };
  
  let lastTime = performance.now();
  let frameCount = 0;
  
  const measureFPS = () => {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    
    const instantFPS = 1000 / delta;
    fpsData.samples.push(instantFPS);
    frameCount++;
    
    // Measure for 5 seconds
    if (now - fpsData.startTime < 5000) {
      requestAnimationFrame(measureFPS);
    } else {
      // Calculate statistics
      fpsData.samples.sort((a, b) => a - b);
      const avg = fpsData.samples.reduce((a, b) => a + b, 0) / fpsData.samples.length;
      const min = fpsData.samples[0];
      const max = fpsData.samples[fpsData.samples.length - 1];
      const median = fpsData.samples[Math.floor(fpsData.samples.length / 2)];
      const p95 = fpsData.samples[Math.floor(fpsData.samples.length * 0.95)];
      
      console.log('\n✅ FPS Measurement Complete!');
      console.log(`   Frame Count: ${frameCount}`);
      console.log(`   Average FPS: ${avg.toFixed(2)}`);
      console.log(`   Median FPS: ${median.toFixed(2)}`);
      console.log(`   Min FPS: ${min.toFixed(2)}`);
      console.log(`   Max FPS: ${max.toFixed(2)}`);
      console.log(`   95th Percentile: ${p95.toFixed(2)}`);
      
      diagnosticData.fpsStats = {
        frameCount,
        avgFPS: parseFloat(avg.toFixed(2)),
        medianFPS: parseFloat(median.toFixed(2)),
        minFPS: parseFloat(min.toFixed(2)),
        maxFPS: parseFloat(max.toFixed(2)),
        p95FPS: parseFloat(p95.toFixed(2)),
        sampleDuration: 5000
      };
      
      // ============================================================================
      // FINAL OUTPUT
      // ============================================================================
      console.log('\n\n' + '='.repeat(80));
      console.log('📋 DIAGNOSTIC SUMMARY');
      console.log('='.repeat(80));
      
      console.log('\n🎯 CRITICAL SETTINGS FOR 120 FPS CAP:');
      console.log('-'.repeat(80));
      
      if (diagnosticData.ticker) {
        console.log(`✓ canvas.app.ticker.maxFPS = ${diagnosticData.ticker.maxFPS}`);
        console.log(`✓ canvas.app.ticker.minFPS = ${diagnosticData.ticker.minFPS}`);
        console.log(`✓ canvas.app.ticker.targetFPS = ${diagnosticData.ticker.targetFPS.toFixed(2)}`);
      }
      
      if (diagnosticData.performance) {
        console.log(`✓ canvas.performance.mode = ${diagnosticData.performance.mode} (${diagnosticData.performance.modeLabel})`);
      }
      
      console.log('\n📊 MEASURED FPS RESULTS:');
      console.log('-'.repeat(80));
      console.log(`   Average: ${diagnosticData.fpsStats.avgFPS} FPS`);
      console.log(`   Median: ${diagnosticData.fpsStats.medianFPS} FPS`);
      console.log(`   Range: ${diagnosticData.fpsStats.minFPS} - ${diagnosticData.fpsStats.maxFPS} FPS`);
      console.log(`   95th Percentile: ${diagnosticData.fpsStats.p95FPS} FPS`);
      
      console.log('\n\n🔧 RECOMMENDED TEST SETTINGS:');
      console.log('-'.repeat(80));
      console.log('await page.evaluate(() => {');
      if (diagnosticData.performance) {
        console.log(`  canvas.performance.mode = ${diagnosticData.performance.mode};`);
      }
      if (diagnosticData.ticker) {
        console.log(`  canvas.app.ticker.maxFPS = ${diagnosticData.ticker.maxFPS};`);
        console.log(`  canvas.app.ticker.minFPS = ${diagnosticData.ticker.minFPS};`);
      }
      console.log('});');
      
      console.log('\n\n💾 FULL DIAGNOSTIC DATA (Copy this):');
      console.log('-'.repeat(80));
      console.log(JSON.stringify(diagnosticData, null, 2));
      
      console.log('\n' + '='.repeat(80));
      console.log('✅ DIAGNOSTIC COMPLETE - Copy the JSON data above!');
      console.log('='.repeat(80) + '\n');
    }
  };
  
  // Start FPS measurement
  requestAnimationFrame(measureFPS);
  
})();
