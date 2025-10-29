/**
 * @fileoverview Performance Validator - FPS & VRAM Regression Detection
 * 
 * Monitors performance metrics to detect regressions:
 * - Average FPS over time windows
 * - Frame time variance (stuttering)
 * - GPU memory usage trends
 * - RenderTexturePool cache hit rates
 * - Frame budget analysis
 * 
 * Critical for catching:
 * - Performance regressions after changes
 * - Frame rate drops
 * - Stuttering/hitching
 * - Memory pressure
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class PerformanceValidator {
  static errors = [];
  static warnings = [];
  static measurements = [];
  
  // Performance thresholds
  static THRESHOLDS = {
    minAverageFPS: 30,
    maxFrameTimeMs: 33.33,  // 30 FPS
    maxFrameTimeVarianceMs: 10,
    maxVRAMGrowthMB: 50,
    minPoolCacheHitRate: 0.90,
    maxFrameBudgetMs: 16.67  // 60 FPS target
  };
  
  /**
   * Start a performance monitoring session
   * 
   * @param {number} durationMs - How long to monitor (default 30 seconds)
   * @param {string} label - Label for this session
   * @param {Function} progressCallback - Optional callback for progress updates (elapsed, currentFPS)
   * @returns {Promise<Object>} Performance metrics
   */
  static async monitorPerformance(durationMs = 30000, label = 'performance_test', progressCallback = null) {
    console.log(`📊 Starting performance monitoring (${durationMs}ms)...`);
    
    const metrics = {
      label,
      startTime: Date.now(),
      endTime: null,
      durationMs,
      
      // FPS tracking
      frameTimes: [],
      avgFPS: 0,
      minFPS: Infinity,
      maxFPS: 0,
      
      // Frame time analysis
      avgFrameTime: 0,
      frameTimeVariance: 0,
      stutterEvents: 0,  // Frames > 100ms
      
      // Memory tracking
      startVRAM: this._getVRAMUsage(),
      endVRAM: null,
      vramGrowthMB: 0,
      
      // Pool statistics
      poolStats: null,
      
      // Renderer stats
      drawCalls: [],
      avgDrawCalls: 0
    };
    
    let lastFrameTime = performance.now();
    let frameCount = 0;
    
    // Frame time callback
    const measureFrame = () => {
      const now = performance.now();
      const frameDelta = now - lastFrameTime;
      lastFrameTime = now;
      
      metrics.frameTimes.push(frameDelta);
      frameCount++;
      
      // Track stutters (frames > 100ms = major hitch)
      if (frameDelta > 100) {
        metrics.stutterEvents++;
      }
      
      // Track draw calls if renderer available
      const renderer = canvas.app?.renderer;
      if (renderer?.plugins?.batch) {
        const drawCalls = renderer.plugins.batch._drawCalls || 0;
        metrics.drawCalls.push(drawCalls);
      }
    };
    
    // Add ticker callback
    canvas.app.ticker.add(measureFrame);
    
    // Wait for monitoring duration with progress callbacks
    if (progressCallback) {
      const progressInterval = 5000; // Report every 5 seconds
      const startTime = Date.now();
      const endTime = startTime + durationMs;
      
      while (Date.now() < endTime) {
        const elapsed = Date.now() - startTime;
        
        // Calculate current FPS from recent frames
        const recentFrames = metrics.frameTimes.slice(-60); // Last ~1 second at 60fps
        const currentFPS = recentFrames.length > 0 
          ? 1000 / (recentFrames.reduce((a,b) => a+b, 0) / recentFrames.length)
          : 0;
        
        progressCallback(elapsed, currentFPS);
        
        // Wait for interval or remaining time, whichever is shorter
        const remaining = endTime - Date.now();
        const waitTime = Math.min(progressInterval, remaining);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } else {
      // No progress callback, simple wait
      await new Promise(resolve => setTimeout(resolve, durationMs));
    }
    
    // Remove ticker callback
    canvas.app.ticker.remove(measureFrame);
    
    // Calculate final metrics
    metrics.endTime = Date.now();
    metrics.endVRAM = this._getVRAMUsage();
    
    // FPS calculations
    if (metrics.frameTimes.length > 0) {
      // Calculate average (mean)
      metrics.avgFrameTime = metrics.frameTimes.reduce((a, b) => a + b, 0) / metrics.frameTimes.length;
      metrics.avgFPS = 1000 / metrics.avgFrameTime;
      
      // Min/Max FPS
      metrics.minFPS = 1000 / Math.max(...metrics.frameTimes);
      metrics.maxFPS = 1000 / Math.min(...metrics.frameTimes);
      
      // Calculate MEDIAN (more stable with high variance)
      const sortedFrameTimes = metrics.frameTimes.slice().sort((a, b) => a - b);
      const midIndex = Math.floor(sortedFrameTimes.length / 2);
      metrics.medianFrameTime = sortedFrameTimes.length % 2 === 0 
        ? (sortedFrameTimes[midIndex - 1] + sortedFrameTimes[midIndex]) / 2
        : sortedFrameTimes[midIndex];
      metrics.medianFPS = 1000 / metrics.medianFrameTime;
      
      // Calculate TRIMMED MEAN (remove top/bottom 5% outliers)
      const trimStart = Math.floor(sortedFrameTimes.length * 0.05);
      const trimEnd = Math.floor(sortedFrameTimes.length * 0.95);
      const trimmedFrameTimes = sortedFrameTimes.slice(trimStart, trimEnd);
      metrics.trimmedAvgFrameTime = trimmedFrameTimes.reduce((a, b) => a + b, 0) / trimmedFrameTimes.length;
      metrics.trimmedAvgFPS = 1000 / metrics.trimmedAvgFrameTime;
      
      // Calculate 95th percentile FPS (5% of frames are faster than this)
      const p95Index = Math.floor(sortedFrameTimes.length * 0.95);
      metrics.p95FrameTime = sortedFrameTimes[p95Index];
      metrics.p95FPS = 1000 / metrics.p95FrameTime;
      
      // Frame time variance (standard deviation)
      const variance = metrics.frameTimes.reduce((sum, ft) => {
        return sum + Math.pow(ft - metrics.avgFrameTime, 2);
      }, 0) / metrics.frameTimes.length;
      metrics.frameTimeVariance = Math.sqrt(variance);
    }
    
    // VRAM growth
    if (metrics.startVRAM && metrics.endVRAM) {
      metrics.vramGrowthMB = (metrics.endVRAM - metrics.startVRAM) / (1024 * 1024);
    }
    
    // Draw calls
    if (metrics.drawCalls.length > 0) {
      metrics.avgDrawCalls = metrics.drawCalls.reduce((a, b) => a + b, 0) / metrics.drawCalls.length;
    }
    
    // Pool statistics
    metrics.poolStats = this._getPoolStatistics();
    
    // Store measurement
    this.measurements.push(metrics);
    
    console.log(`✅ Performance monitoring complete`);
    console.log(`   Average FPS: ${metrics.avgFPS.toFixed(2)} (mean)`);
    console.log(`   Median FPS: ${metrics.medianFPS.toFixed(2)} (more stable)`);
    console.log(`   Trimmed Avg FPS: ${metrics.trimmedAvgFPS.toFixed(2)} (outliers removed)`);
    console.log(`   FPS Range: ${metrics.minFPS.toFixed(2)} - ${metrics.maxFPS.toFixed(2)}`);
    console.log(`   Frame Time: ${metrics.avgFrameTime.toFixed(2)}ms (σ=${metrics.frameTimeVariance.toFixed(2)}ms)`);
    console.log(`   Stutter Events: ${metrics.stutterEvents}`);
    console.log(`   VRAM Growth: ${metrics.vramGrowthMB.toFixed(2)}MB`);
    
    return metrics;
  }
  
  /**
   * Validate performance metrics against thresholds
   * 
   * @param {Object} metrics - Metrics from monitorPerformance()
   * @returns {Object} Validation results
   */
  static validateMetrics(metrics) {
    const results = {
      passed: true,
      warnings: [],
      errors: []
    };
    
    // Check average FPS
    if (metrics.avgFPS < this.THRESHOLDS.minAverageFPS) {
      results.passed = false;
      const error = {
        type: 'LOW_FPS',
        value: metrics.avgFPS.toFixed(2),
        threshold: this.THRESHOLDS.minAverageFPS,
        message: `Average FPS ${metrics.avgFPS.toFixed(2)} below threshold ${this.THRESHOLDS.minAverageFPS}`
      };
      this.errors.push(error);
      results.errors.push(error.message);
    }
    
    // Check frame time
    if (metrics.avgFrameTime > this.THRESHOLDS.maxFrameTimeMs) {
      results.passed = false;
      const error = {
        type: 'HIGH_FRAME_TIME',
        value: metrics.avgFrameTime.toFixed(2),
        threshold: this.THRESHOLDS.maxFrameTimeMs,
        message: `Average frame time ${metrics.avgFrameTime.toFixed(2)}ms exceeds ${this.THRESHOLDS.maxFrameTimeMs}ms`
      };
      this.errors.push(error);
      results.errors.push(error.message);
    }
    
    // Check frame time variance (stuttering)
    if (metrics.frameTimeVariance > this.THRESHOLDS.maxFrameTimeVarianceMs) {
      const warning = {
        type: 'HIGH_VARIANCE',
        value: metrics.frameTimeVariance.toFixed(2),
        threshold: this.THRESHOLDS.maxFrameTimeVarianceMs,
        message: `Frame time variance ${metrics.frameTimeVariance.toFixed(2)}ms indicates stuttering`
      };
      this.warnings.push(warning);
      results.warnings.push(warning.message);
    }
    
    // Check stutter events
    if (metrics.stutterEvents > 5) {
      const warning = {
        type: 'STUTTER_EVENTS',
        value: metrics.stutterEvents,
        message: `Detected ${metrics.stutterEvents} major frame hitches (>100ms)`
      };
      this.warnings.push(warning);
      results.warnings.push(warning.message);
    }
    
    // Check VRAM growth
    if (metrics.vramGrowthMB > this.THRESHOLDS.maxVRAMGrowthMB) {
      results.passed = false;
      const error = {
        type: 'VRAM_GROWTH',
        value: metrics.vramGrowthMB.toFixed(2),
        threshold: this.THRESHOLDS.maxVRAMGrowthMB,
        message: `VRAM grew by ${metrics.vramGrowthMB.toFixed(2)}MB (limit: ${this.THRESHOLDS.maxVRAMGrowthMB}MB)`
      };
      this.errors.push(error);
      results.errors.push(error.message);
    }
    
    // Check pool cache hit rate
    if (metrics.poolStats && metrics.poolStats.cacheHitRate < this.THRESHOLDS.minPoolCacheHitRate) {
      const warning = {
        type: 'LOW_CACHE_HIT_RATE',
        value: (metrics.poolStats.cacheHitRate * 100).toFixed(1),
        threshold: (this.THRESHOLDS.minPoolCacheHitRate * 100).toFixed(1),
        message: `Pool cache hit rate ${(metrics.poolStats.cacheHitRate * 100).toFixed(1)}% below ${(this.THRESHOLDS.minPoolCacheHitRate * 100).toFixed(1)}%`
      };
      this.warnings.push(warning);
      results.warnings.push(warning.message);
    }
    
    return results;
  }
  
  /**
   * Compare two performance measurements to detect regressions
   * 
   * @param {Object} baseline - Baseline performance metrics
   * @param {Object} current - Current performance metrics
   * @returns {Object} Regression analysis
   */
  static comparePerformance(baseline, current) {
    const results = {
      regressionDetected: false,
      improvements: [],
      regressions: [],
      changes: {}
    };
    
    // FPS comparison
    const fpsDelta = current.avgFPS - baseline.avgFPS;
    results.changes.fps = fpsDelta.toFixed(2);
    
    if (fpsDelta < -5) {
      results.regressionDetected = true;
      results.regressions.push({
        metric: 'Average FPS',
        baseline: baseline.avgFPS.toFixed(2),
        current: current.avgFPS.toFixed(2),
        change: fpsDelta.toFixed(2)
      });
      this.errors.push({
        type: 'FPS_REGRESSION',
        baseline: baseline.avgFPS,
        current: current.avgFPS,
        delta: fpsDelta,
        message: `FPS dropped by ${Math.abs(fpsDelta).toFixed(2)} (${baseline.avgFPS.toFixed(2)} → ${current.avgFPS.toFixed(2)})`
      });
    } else if (fpsDelta > 5) {
      results.improvements.push({
        metric: 'Average FPS',
        baseline: baseline.avgFPS.toFixed(2),
        current: current.avgFPS.toFixed(2),
        change: `+${fpsDelta.toFixed(2)}`
      });
    }
    
    // Frame time comparison
    const frameTimeDelta = current.avgFrameTime - baseline.avgFrameTime;
    results.changes.frameTime = frameTimeDelta.toFixed(2);
    
    if (frameTimeDelta > 2) {
      results.regressionDetected = true;
      results.regressions.push({
        metric: 'Frame Time',
        baseline: `${baseline.avgFrameTime.toFixed(2)}ms`,
        current: `${current.avgFrameTime.toFixed(2)}ms`,
        change: `+${frameTimeDelta.toFixed(2)}ms`
      });
    }
    
    // VRAM comparison
    const vramDelta = current.vramGrowthMB - baseline.vramGrowthMB;
    results.changes.vramGrowth = vramDelta.toFixed(2);
    
    if (vramDelta > 10) {
      results.regressionDetected = true;
      results.regressions.push({
        metric: 'VRAM Growth',
        baseline: `${baseline.vramGrowthMB.toFixed(2)}MB`,
        current: `${current.vramGrowthMB.toFixed(2)}MB`,
        change: `+${vramDelta.toFixed(2)}MB`
      });
    }
    
    // Stutter events comparison
    const stutterDelta = current.stutterEvents - baseline.stutterEvents;
    results.changes.stutterEvents = stutterDelta;
    
    if (stutterDelta > 3) {
      results.regressionDetected = true;
      results.regressions.push({
        metric: 'Stutter Events',
        baseline: baseline.stutterEvents,
        current: current.stutterEvents,
        change: `+${stutterDelta}`
      });
    }
    
    return results;
  }
  
  /**
   * Quick frame budget check - are we hitting 60 FPS?
   * 
   * @param {number} sampleFrames - Number of frames to sample
   * @returns {Object} Frame budget analysis
   */
  static checkFrameBudget(sampleFrames = 300) {
    const results = {
      samples: sampleFrames,
      framesOver16ms: 0,
      framesOver33ms: 0,
      avgFrameTime: 0,
      withinBudget: false
    };
    
    const frameTimes = [];
    let frameCount = 0;
    let lastTime = performance.now();
    
    return new Promise((resolve) => {
      const measure = () => {
        const now = performance.now();
        const delta = now - lastTime;
        lastTime = now;
        
        frameTimes.push(delta);
        
        if (delta > 16.67) results.framesOver16ms++;
        if (delta > 33.33) results.framesOver33ms++;
        
        frameCount++;
        
        if (frameCount >= sampleFrames) {
          canvas.app.ticker.remove(measure);
          
          results.avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
          results.withinBudget = results.avgFrameTime <= 16.67;
          
          resolve(results);
        }
      };
      
      canvas.app.ticker.add(measure);
    });
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  static _getVRAMUsage() {
    if (!performance.memory) return null;
    return performance.memory.usedJSHeapSize;
  }
  
  static _getPoolStatistics() {
    if (typeof RenderTexturePool === 'undefined') return null;
    
    try {
      const stats = RenderTexturePool.getStats();
      return {
        activeTextures: stats.activeTextures || 0,
        cacheHitRate: stats.cacheHitRate || 0,
        totalAcquires: stats.totalAcquires || 0,
        totalReleases: stats.totalReleases || 0
      };
    } catch (e) {
      return null;
    }
  }
  
  /**
   * Get all recorded errors
   */
  static getErrors() {
    return [...this.errors];
  }
  
  /**
   * Get all recorded warnings
   */
  static getWarnings() {
    return [...this.warnings];
  }
  
  /**
   * Get all measurements
   */
  static getMeasurements() {
    return [...this.measurements];
  }
  
  /**
   * Clear all recorded data
   */
  static clearErrors() {
    this.errors = [];
    this.warnings = [];
    this.measurements = [];
  }
  
  /**
   * Generate detailed report
   */
  static generateReport() {
    let report = '\n═══════════════════════════════════════════════\n';
    report += '    PERFORMANCE VALIDATION REPORT\n';
    report += '═══════════════════════════════════════════════\n\n';
    
    report += `Errors: ${this.errors.length}\n`;
    report += `Warnings: ${this.warnings.length}\n`;
    report += `Measurements: ${this.measurements.length}\n\n`;
    
    if (this.errors.length > 0) {
      report += '─── PERFORMANCE REGRESSIONS ───\n';
      this.errors.forEach((err, idx) => {
        report += `\n${idx + 1}. ${err.type}\n`;
        report += `   ${err.message}\n`;
        if (err.value !== undefined) {
          report += `   Value: ${err.value}, Threshold: ${err.threshold}\n`;
        }
      });
      report += '\n';
    }
    
    if (this.warnings.length > 0) {
      report += '─── WARNINGS ───\n';
      this.warnings.forEach((warn, idx) => {
        report += `\n${idx + 1}. ${warn.type}\n`;
        report += `   ${warn.message}\n`;
      });
      report += '\n';
    }
    
    if (this.measurements.length > 0) {
      report += '─── RECENT MEASUREMENTS ───\n';
      const recent = this.measurements.slice(-3);
      recent.forEach((m, idx) => {
        report += `\n${idx + 1}. ${m.label} (${new Date(m.startTime).toLocaleTimeString()})\n`;
        report += `   FPS: ${m.avgFPS.toFixed(2)} (${m.minFPS.toFixed(2)}-${m.maxFPS.toFixed(2)})\n`;
        report += `   Frame Time: ${m.avgFrameTime.toFixed(2)}ms ±${m.frameTimeVariance.toFixed(2)}ms\n`;
        report += `   Stutters: ${m.stutterEvents}\n`;
        report += `   VRAM Growth: ${m.vramGrowthMB.toFixed(2)}MB\n`;
        if (m.poolStats) {
          report += `   Pool Hit Rate: ${(m.poolStats.cacheHitRate * 100).toFixed(1)}%\n`;
        }
      });
      report += '\n';
    }
    
    report += '═══════════════════════════════════════════════\n';
    return report;
  }
}

// Make globally available for Playwright tests
if (typeof window !== 'undefined') {
  window.PerformanceValidator = PerformanceValidator;
}
