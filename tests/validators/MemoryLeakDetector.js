/**
 * @fileoverview Memory Leak Detector - Critical Stability Testing
 * 
 * Detects memory leaks by monitoring:
 * - PIXI texture cache growth
 * - Particle emitter cleanup
 * - Layer destruction flags
 * - RenderTexturePool active textures
 * - BatchRenderer buffer accumulation
 * 
 * Critical for preventing:
 * - VRAM exhaustion
 * - Frame rate degradation
 * - Browser crashes
 * - Scene transition failures
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class MemoryLeakDetector {
  static errors = [];
  static warnings = [];
  static snapshots = [];
  
  /**
   * Take a memory snapshot for later comparison
   * 
   * @param {string} label - Label for this snapshot (e.g., "before_transition")
   * @returns {Object} Memory snapshot
   */
  static takeSnapshot(label = 'snapshot') {
    const snapshot = {
      timestamp: Date.now(),
      label,
      
      // PIXI Texture Caches
      pixiTextureCache: Object.keys(PIXI.utils.TextureCache).length,
      pixiBaseTextureCache: Object.keys(PIXI.utils.BaseTextureCache).length,
      
      // Particle System
      particleEmitters: this._countParticleEmitters(),
      activeParticles: this._countActiveParticles(),
      
      // Canvas Layers
      destroyedLayers: this._countDestroyedLayers(),
      activeLayers: this._countActiveLayers(),
      
      // RenderTexturePool
      poolActiveTextures: this._getPoolActiveCount(),
      poolCacheSize: this._getPoolCacheSize(),
      
      // BatchRenderer
      batchBufferCount: this._getBatchBufferCount(),
      
      // Geometry Masks
      geometryMaskCount: this._getGeometryMaskCount(),
      
      // Memory Stats (if available)
      jsHeapSize: performance.memory?.usedJSHeapSize,
      jsHeapLimit: performance.memory?.jsHeapSizeLimit,
      
      // Map Shine Managers
      managers: this._getManagerStates()
    };
    
    this.snapshots.push(snapshot);
    return snapshot;
  }
  
  /**
   * Compare two snapshots and detect leaks
   * 
   * @param {Object} before - Snapshot before operation
   * @param {Object} after - Snapshot after operation
   * @param {Object} thresholds - Acceptable growth thresholds
   * @returns {Object} Leak detection results
   */
  static compareSnapshots(before, after, thresholds = {}) {
    const defaults = {
      maxTextureCacheGrowth: 10,
      maxEmitterGrowth: 0,
      maxParticleGrowth: 100,
      maxPoolActiveGrowth: 0,
      maxBatchBufferGrowth: 5,
      maxMaskGrowth: 2,
      maxHeapGrowthMB: 50
    };
    
    const limits = { ...defaults, ...thresholds };
    const results = {
      leaksDetected: false,
      warnings: [],
      errors: [],
      changes: {}
    };
    
    // Compare texture caches
    const textureDiff = after.pixiTextureCache - before.pixiTextureCache;
    results.changes.textureCache = textureDiff;
    if (textureDiff > limits.maxTextureCacheGrowth) {
      results.leaksDetected = true;
      this.errors.push({
        type: 'TEXTURE_CACHE_LEAK',
        before: before.pixiTextureCache,
        after: after.pixiTextureCache,
        growth: textureDiff,
        message: `Texture cache grew by ${textureDiff} (limit: ${limits.maxTextureCacheGrowth})`
      });
      results.errors.push(`Texture cache leaked ${textureDiff} textures`);
    }
    
    // Compare base texture caches
    const baseTextureDiff = after.pixiBaseTextureCache - before.pixiBaseTextureCache;
    results.changes.baseTextureCache = baseTextureDiff;
    if (baseTextureDiff > limits.maxTextureCacheGrowth) {
      results.leaksDetected = true;
      this.errors.push({
        type: 'BASE_TEXTURE_CACHE_LEAK',
        before: before.pixiBaseTextureCache,
        after: after.pixiBaseTextureCache,
        growth: baseTextureDiff,
        message: `Base texture cache grew by ${baseTextureDiff} (limit: ${limits.maxTextureCacheGrowth})`
      });
      results.errors.push(`Base texture cache leaked ${baseTextureDiff} textures`);
    }
    
    // Compare particle emitters
    const emitterDiff = after.particleEmitters - before.particleEmitters;
    results.changes.emitters = emitterDiff;
    if (emitterDiff > limits.maxEmitterGrowth) {
      results.leaksDetected = true;
      this.errors.push({
        type: 'EMITTER_LEAK',
        before: before.particleEmitters,
        after: after.particleEmitters,
        growth: emitterDiff,
        message: `Particle emitters grew by ${emitterDiff} (should be 0 after cleanup)`
      });
      results.errors.push(`${emitterDiff} emitters not destroyed`);
    }
    
    // Compare pool active textures
    const poolDiff = after.poolActiveTextures - before.poolActiveTextures;
    results.changes.poolActive = poolDiff;
    if (poolDiff > limits.maxPoolActiveGrowth) {
      results.leaksDetected = true;
      this.errors.push({
        type: 'POOL_TEXTURE_LEAK',
        before: before.poolActiveTextures,
        after: after.poolActiveTextures,
        growth: poolDiff,
        message: `Pool active textures grew by ${poolDiff} (textures not released)`
      });
      results.errors.push(`${poolDiff} pooled textures not released`);
    }
    
    // Compare batch buffers
    const batchDiff = after.batchBufferCount - before.batchBufferCount;
    results.changes.batchBuffers = batchDiff;
    if (batchDiff > limits.maxBatchBufferGrowth) {
      this.warnings.push({
        type: 'BATCH_BUFFER_GROWTH',
        before: before.batchBufferCount,
        after: after.batchBufferCount,
        growth: batchDiff,
        message: `Batch buffers grew by ${batchDiff}`
      });
      results.warnings.push(`Batch buffers grew by ${batchDiff}`);
    }
    
    // Compare geometry masks
    const maskDiff = after.geometryMaskCount - before.geometryMaskCount;
    results.changes.geometryMasks = maskDiff;
    if (maskDiff > limits.maxMaskGrowth) {
      results.leaksDetected = true;
      this.errors.push({
        type: 'GEOMETRY_MASK_LEAK',
        before: before.geometryMaskCount,
        after: after.geometryMaskCount,
        growth: maskDiff,
        message: `Geometry masks grew by ${maskDiff} (masks not destroyed)`
      });
      results.errors.push(`${maskDiff} geometry masks not destroyed`);
    }
    
    // Compare heap size
    if (before.jsHeapSize && after.jsHeapSize) {
      const heapGrowthMB = (after.jsHeapSize - before.jsHeapSize) / (1024 * 1024);
      results.changes.heapGrowthMB = heapGrowthMB.toFixed(2);
      if (heapGrowthMB > limits.maxHeapGrowthMB) {
        this.warnings.push({
          type: 'HEAP_GROWTH',
          before: (before.jsHeapSize / (1024 * 1024)).toFixed(2),
          after: (after.jsHeapSize / (1024 * 1024)).toFixed(2),
          growth: heapGrowthMB.toFixed(2),
          message: `JS heap grew by ${heapGrowthMB.toFixed(2)} MB`
        });
        results.warnings.push(`Heap grew ${heapGrowthMB.toFixed(2)} MB`);
      }
    }
    
    return results;
  }
  
  /**
   * Run scene transition leak test
   * 
   * @returns {Promise<Object>} Test results
   */
  static async testSceneTransition() {
    if (!canvas.ready || !game.mapShine) {
      throw new Error('Canvas or Map Shine not ready');
    }
    
    console.log('🔍 Memory Leak Test: Scene Transition');
    
    // Take initial snapshot
    const before = this.takeSnapshot('before_transition');
    console.log('📸 Snapshot taken before transition');
    
    // Store current scene
    const originalSceneId = canvas.scene.id;
    
    // Find another scene to transition to
    const scenes = game.scenes.filter(s => s.id !== originalSceneId);
    if (scenes.length === 0) {
      throw new Error('Need at least 2 scenes to test transitions');
    }
    
    const targetScene = scenes[0];
    
    // Transition to new scene
    console.log(`🔄 Transitioning to scene: ${targetScene.name}`);
    await targetScene.view();
    
    // Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Transition back
    console.log(`🔄 Transitioning back to original scene`);
    const originalScene = game.scenes.get(originalSceneId);
    await originalScene.view();
    
    // Wait for transition to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Take final snapshot
    const after = this.takeSnapshot('after_transition');
    console.log('📸 Snapshot taken after transition');
    
    // Compare snapshots
    const results = this.compareSnapshots(before, after, {
      maxTextureCacheGrowth: 5,
      maxEmitterGrowth: 0,
      maxPoolActiveGrowth: 0,
      maxBatchBufferGrowth: 3,
      maxMaskGrowth: 1,
      maxHeapGrowthMB: 30
    });
    
    return {
      testType: 'scene_transition',
      before,
      after,
      ...results
    };
  }
  
  /**
   * Run rapid effect toggle leak test
   * 
   * @param {string} effectKey - Config key for effect (e.g., 'cloudShadows')
   * @param {number} iterations - Number of toggle cycles
   * @returns {Promise<Object>} Test results
   */
  static async testEffectToggle(effectKey, iterations = 10) {
    if (!game.mapShine?.profileManager) {
      throw new Error('ProfileManager not available');
    }
    
    console.log(`🔍 Memory Leak Test: Effect Toggle (${effectKey}, ${iterations}x)`);
    
    const before = this.takeSnapshot('before_toggle');
    console.log('📸 Snapshot taken before toggles');
    
    const config = game.mapShine.profileManager.activeConfig;
    const originalEnabled = foundry.utils.getProperty(config, `${effectKey}.enabled`);
    
    // Rapid enable/disable cycles
    for (let i = 0; i < iterations; i++) {
      foundry.utils.setProperty(config, `${effectKey}.enabled`, false);
      await game.mapShine.profileManager.updateAllSystemsFromConfig();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      foundry.utils.setProperty(config, `${effectKey}.enabled`, true);
      await game.mapShine.profileManager.updateAllSystemsFromConfig();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Restore original state
    foundry.utils.setProperty(config, `${effectKey}.enabled`, originalEnabled);
    await game.mapShine.profileManager.updateAllSystemsFromConfig();
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const after = this.takeSnapshot('after_toggle');
    console.log('📸 Snapshot taken after toggles');
    
    const results = this.compareSnapshots(before, after, {
      maxTextureCacheGrowth: 2,
      maxEmitterGrowth: 0,
      maxPoolActiveGrowth: 0,
      maxBatchBufferGrowth: 2,
      maxHeapGrowthMB: 20
    });
    
    return {
      testType: 'effect_toggle',
      effectKey,
      iterations,
      before,
      after,
      ...results
    };
  }
  
  /**
   * Test for layer destruction flags
   * 
   * @returns {Object} Results with any layers that weren't properly destroyed
   */
  static validateLayerDestruction() {
    const results = {
      total: 0,
      properlyDestroyed: 0,
      notDestroyed: []
    };
    
    if (!canvas.layers) return results;
    
    for (const layer of canvas.layers) {
      // Check if this is a Map Shine layer
      const isMapShineLayer = layer.constructor.name.includes('Layer') && 
        (layer._onAnimateBound || layer._onResizeBound);
      
      if (!isMapShineLayer) continue;
      
      results.total++;
      
      // Check if _destroyed flag exists and is set correctly
      if ('_destroyed' in layer) {
        if (layer._destroyed === false) {
          results.properlyDestroyed++;
        } else {
          results.notDestroyed.push({
            name: layer.constructor.name,
            destroyed: layer._destroyed
          });
        }
      }
    }
    
    if (results.notDestroyed.length > 0) {
      this.errors.push({
        type: 'LAYER_NOT_DESTROYED',
        count: results.notDestroyed.length,
        layers: results.notDestroyed,
        message: `${results.notDestroyed.length} layers have incorrect _destroyed flags`
      });
    }
    
    return results;
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  static _countParticleEmitters() {
    if (!game.mapShine?.particleManager) return 0;
    
    let count = 0;
    const pm = game.mapShine.particleManager;
    
    // Count controllers and their emitters
    if (pm.controllers) {
      count += Object.keys(pm.controllers).length;
    }
    
    return count;
  }
  
  static _countActiveParticles() {
    if (!game.mapShine?.particleManager) return 0;
    
    // This would need to be implemented in ParticleManager
    // For now, return 0
    return 0;
  }
  
  static _countDestroyedLayers() {
    if (!canvas.layers) return 0;
    
    return canvas.layers.filter(l => l._destroyed === true).length;
  }
  
  static _countActiveLayers() {
    if (!canvas.layers) return 0;
    
    return canvas.layers.filter(l => l._destroyed === false || !('_destroyed' in l)).length;
  }
  
  static _getPoolActiveCount() {
    if (typeof RenderTexturePool === 'undefined') return 0;
    
    try {
      const stats = RenderTexturePool.getStats();
      return stats.activeTextures || 0;
    } catch (e) {
      return 0;
    }
  }
  
  static _getPoolCacheSize() {
    if (typeof RenderTexturePool === 'undefined') return 0;
    
    try {
      const stats = RenderTexturePool.getStats();
      return (stats.floatPoolSize || 0) + (stats.bytePoolSize || 0);
    } catch (e) {
      return 0;
    }
  }
  
  static _getBatchBufferCount() {
    try {
      const renderer = canvas.app?.renderer;
      if (!renderer?.plugins?.batch) return 0;
      
      const batch = renderer.plugins.batch;
      return batch._bufferedElements?.length || 0;
    } catch (e) {
      return 0;
    }
  }
  
  static _getGeometryMaskCount() {
    if (!game.mapShine?.geometryMaskManager) return 0;
    
    try {
      const gmm = game.mapShine.geometryMaskManager;
      return Object.keys(gmm.masks || {}).length;
    } catch (e) {
      return 0;
    }
  }
  
  static _getManagerStates() {
    if (!game.mapShine) return {};
    
    return {
      profileManager: !!game.mapShine.profileManager,
      resourceManager: !!game.mapShine.resourceManager,
      particleManager: !!game.mapShine.particleManager,
      weatherSystemManager: !!game.mapShine.weatherSystemManager,
      geometryMaskManager: !!game.mapShine.geometryMaskManager,
      transitionManager: !!game.mapShine.transitionManager
    };
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
   * Get all snapshots
   */
  static getSnapshots() {
    return [...this.snapshots];
  }
  
  /**
   * Clear all recorded data
   */
  static clearErrors() {
    this.errors = [];
    this.warnings = [];
    this.snapshots = [];
  }
  
  /**
   * Generate detailed report
   */
  static generateReport() {
    let report = '\n═══════════════════════════════════════════════\n';
    report += '    MEMORY LEAK DETECTION REPORT\n';
    report += '═══════════════════════════════════════════════\n\n';
    
    report += `Errors: ${this.errors.length}\n`;
    report += `Warnings: ${this.warnings.length}\n`;
    report += `Snapshots: ${this.snapshots.length}\n\n`;
    
    if (this.errors.length > 0) {
      report += '─── MEMORY LEAKS DETECTED ───\n';
      this.errors.forEach((err, idx) => {
        report += `\n${idx + 1}. ${err.type}\n`;
        report += `   ${err.message}\n`;
        if (err.before !== undefined) {
          report += `   Before: ${err.before}, After: ${err.after}, Growth: ${err.growth}\n`;
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
    
    if (this.snapshots.length >= 2) {
      const latest = this.snapshots[this.snapshots.length - 1];
      const earliest = this.snapshots[0];
      
      report += '─── MEMORY TRENDS ───\n';
      report += `Time span: ${((latest.timestamp - earliest.timestamp) / 1000).toFixed(1)}s\n`;
      report += `Texture cache: ${earliest.pixiTextureCache} → ${latest.pixiTextureCache}\n`;
      report += `Emitters: ${earliest.particleEmitters} → ${latest.particleEmitters}\n`;
      report += `Pool active: ${earliest.poolActiveTextures} → ${latest.poolActiveTextures}\n`;
      
      if (earliest.jsHeapSize && latest.jsHeapSize) {
        const heapGrowth = (latest.jsHeapSize - earliest.jsHeapSize) / (1024 * 1024);
        report += `Heap size: ${(earliest.jsHeapSize / (1024 * 1024)).toFixed(1)}MB → ${(latest.jsHeapSize / (1024 * 1024)).toFixed(1)}MB (${heapGrowth >= 0 ? '+' : ''}${heapGrowth.toFixed(1)}MB)\n`;
      }
      report += '\n';
    }
    
    report += '═══════════════════════════════════════════════\n';
    return report;
  }
}
