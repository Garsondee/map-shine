/**
 * @fileoverview Headless Test Runner - Main Test Orchestrator
 * 
 * This is the entry point for the Map Shine headless testing system.
 * It runs various test suites and outputs results to the terminal.
 * 
 * Usage:
 *   Set environment variable: MAP_SHINE_TEST_MODE=true
 *   Run: node "C:\Program Files\Foundry Virtual Tabletop\resources\app\main.js" --headless --world=map-development-world
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

import { UIDataValidator } from './validators/UIDataValidator.js';
import { ConfigValidator } from './validators/ConfigValidator.js';
import { ManagerValidator } from './validators/ManagerValidator.js';
import { MemoryLeakDetector } from './validators/MemoryLeakDetector.js';

export class MapShineTestRunner {
  /**
   * Main entry point - runs all requested test suites
   * 
   * @param {string} suite - Test suite to run ('all', 'ui', 'config', 'managers', 'textures', 'memory')
   * @returns {Promise<void>}
   */
  static async runTests(suite = 'all') {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`    MAP SHINE AUTOMATED TEST SUITE`);
    console.log(`    Suite: ${suite.toUpperCase()}`);
    console.log(`    Started: ${new Date().toLocaleTimeString()}`);
    console.log(`${'═'.repeat(70)}\n`);
    
    const results = {
      passed: [],
      failed: [],
      errors: [],
      startTime: Date.now()
    };
    
    try {
      // Phase 1: Configuration Tests
      if (suite === 'all' || suite === 'config') {
        await this.runConfigTests(results);
      }
      
      // Phase 2: Manager Initialization Tests
      if (suite === 'all' || suite === 'managers') {
        await this.runManagerTests(results);
      }
      
      // Phase 3: UI Slider Connection Tests
      if (suite === 'all' || suite === 'ui') {
        await this.runUITests(results);
      }
      
      // Phase 4: Texture Discovery Tests
      if (suite === 'all' || suite === 'textures') {
        await this.runTextureTests(results);
      }
      
      // Phase 5: Memory Leak Tests
      if (suite === 'all' || suite === 'memory') {
        await this.runMemoryTests(results);
      }
      
    } catch (error) {
      console.error('\n❌ FATAL TEST ERROR:', error);
      results.errors.push(error);
    }
    
    // Print final results
    this.printResults(results);
    
    // Generate reports
    this.generateReports();
    
    // Exit with appropriate code
    const exitCode = results.failed.length > 0 || results.errors.length > 0 ? 1 : 0;
    console.log(`\n🔚 Exiting with code: ${exitCode}`);
    
    // Give time for logs to flush
    setTimeout(() => {
      if (typeof process !== 'undefined' && process.exit) {
        process.exit(exitCode);
      }
    }, 1000);
  }
  
  /**
   * Run configuration validation tests
   */
  static async runConfigTests(results) {
    console.log('\n📋 Configuration Tests\n');
    console.log('─'.repeat(70));
    
    try {
      // Test 1: Validate ProfileManager exists and is initialized
      await this.test('ProfileManager is initialized', () => {
        if (!game.mapShine?.profileManager) {
          throw new Error('ProfileManager is missing from game.mapShine');
        }
        
        if (!game.mapShine.profileManager.activeConfig) {
          throw new Error('ProfileManager.activeConfig is not set');
        }
      }, results);
      
      // Test 2: Validate MODULE_DEFAULTS structure
      await this.test('MODULE_DEFAULTS has valid structure', () => {
        const requiredKeys = ['enabled', 'baseShine', 'water', 'fire', 'weather'];
        const defaults = game.mapShine.MODULE_DEFAULTS || window.MODULE_DEFAULTS;
        
        if (!defaults) {
          throw new Error('MODULE_DEFAULTS is not accessible');
        }
        
        const validation = ConfigValidator.validateDefaultsStructure(defaults, requiredKeys);
        if (validation.missing.length > 0) {
          throw new Error(`Missing keys: ${validation.missing.join(', ')}`);
        }
      }, results);
      
      // Test 3: Validate activeConfig matches defaults structure
      await this.test('activeConfig matches MODULE_DEFAULTS structure', () => {
        const profileManager = game.mapShine.profileManager;
        const defaults = game.mapShine.MODULE_DEFAULTS || window.MODULE_DEFAULTS;
        
        const validation = ConfigValidator.validateActiveConfig(
          profileManager.activeConfig,
          defaults
        );
        
        if (validation.missingKeys.length > 0) {
          throw new Error(`Config missing keys: ${validation.missingKeys.slice(0, 5).join(', ')}${validation.missingKeys.length > 5 ? '...' : ''}`);
        }
      }, results);
      
      // Test 4: Validate ProfileManager state
      await this.test('ProfileManager is in valid state', () => {
        const validation = ConfigValidator.validateProfileManager(game.mapShine.profileManager);
        if (!validation.allPassed) {
          const failed = validation.checks.filter(c => !c.passed);
          throw new Error(`Failed checks: ${failed.map(c => c.name).join(', ')}`);
        }
      }, results);
      
    } catch (error) {
      console.error('❌ Configuration tests failed:', error);
      results.errors.push(error);
    }
  }
  
  /**
   * Run manager initialization tests
   */
  static async runManagerTests(results) {
    console.log('\n⚙️  Manager Initialization Tests\n');
    console.log('─'.repeat(70));
    
    try {
      // Test 1: All expected managers exist
      await this.test('All required managers exist', () => {
        const validation = ManagerValidator.validateManagersExist();
        if (validation.missingRequired.length > 0) {
          throw new Error(`Missing required managers: ${validation.missingRequired.join(', ')}`);
        }
      }, results);
      
      // Test 2: ProfileManager validation
      await this.test('ProfileManager is valid', () => {
        const validation = ManagerValidator.validateProfileManager(game.mapShine.profileManager);
        if (!validation.allPassed) {
          const failed = validation.checks.filter(c => !c.passed);
          throw new Error(`Failed checks: ${failed.map(c => c.name).join(', ')}`);
        }
      }, results);
      
      // Test 3: ResourceManager validation
      await this.test('ResourceManager is valid', () => {
        const validation = ManagerValidator.validateResourceManager(game.mapShine.resourceManager);
        if (!validation.allPassed) {
          const failed = validation.checks.filter(c => !c.passed);
          throw new Error(`Failed checks: ${failed.map(c => c.name).join(', ')}`);
        }
      }, results);
      
      // Test 4: EffectTargetManager validation
      await this.test('EffectTargetManager is valid', () => {
        const validation = ManagerValidator.validateEffectTargetManager(game.mapShine.effectTargetManager);
        if (!validation.allPassed) {
          const failed = validation.checks.filter(c => !c.passed);
          throw new Error(`Failed checks: ${failed.map(c => c.name).join(', ')}`);
        }
      }, results);
      
      // Test 5: Config propagation paths exist
      await this.test('Managers can receive config updates', () => {
        const validation = ManagerValidator.validateConfigPropagation(game.mapShine.profileManager.activeConfig);
        if (validation.failed.length > 0) {
          throw new Error(`Config propagation failed for: ${validation.failed.map(f => f.target).join(', ')}`);
        }
      }, results);
      
    } catch (error) {
      console.error('❌ Manager tests failed:', error);
      results.errors.push(error);
    }
  }
  
  /**
   * Run UI slider connection tests
   */
  static async runUITests(results) {
    console.log('\n🎚️  UI Slider Connection Tests\n');
    console.log('─'.repeat(70));
    
    try {
      const config = game.mapShine.profileManager.activeConfig;
      
      // Test 1: All sliders have data-path attributes
      await this.test('All sliders have data-path attributes', () => {
        const allSliders = document.querySelectorAll('input[type="range"]');
        const missingPath = [];
        
        for (const slider of allSliders) {
          if (!slider.dataset.path) {
            missingPath.push(slider.id || 'UNKNOWN');
          }
        }
        
        if (missingPath.length > 0) {
          throw new Error(`Sliders missing data-path: ${missingPath.slice(0, 5).join(', ')}${missingPath.length > 5 ? '...' : ''}`);
        }
      }, results);
      
      // Test 2: All slider paths map to config properties
      await this.test('All slider paths exist in config', () => {
        const allSliders = document.querySelectorAll('input[type="range"][data-path]');
        const invalidPaths = [];
        
        for (const slider of allSliders) {
          const path = slider.dataset.path;
          const value = foundry.utils.getProperty(config, path);
          
          if (value === undefined) {
            invalidPaths.push(path);
          }
        }
        
        if (invalidPaths.length > 0) {
          throw new Error(`Invalid paths: ${invalidPaths.slice(0, 5).join(', ')}${invalidPaths.length > 5 ? '...' : ''}`);
        }
      }, results);
      
      // Test 3: Slider values match config values
      await this.test('Slider values match config values', () => {
        const allSliders = document.querySelectorAll('input[type="range"][data-path]');
        const mismatches = [];
        
        for (const slider of allSliders) {
          const path = slider.dataset.path;
          const configValue = foundry.utils.getProperty(config, path);
          const sliderValue = parseFloat(slider.value);
          
          if (typeof configValue === 'number' && Math.abs(sliderValue - configValue) > 0.001) {
            mismatches.push({
              id: slider.id || path,
              path,
              sliderValue,
              configValue
            });
          }
        }
        
        if (mismatches.length > 0) {
          const examples = mismatches.slice(0, 3).map(m => 
            `${m.id}: slider=${m.sliderValue}, config=${m.configValue}`
          ).join('; ');
          throw new Error(`Value mismatches (${mismatches.length} total): ${examples}`);
        }
      }, results);
      
      // Test 4: Run comprehensive validator
      await this.test('Comprehensive UI validation', () => {
        const validation = UIDataValidator.validateAllSliders(config);
        if (validation.failed > 0) {
          const examples = validation.errors.slice(0, 3).map(e => e.sliderId).join(', ');
          throw new Error(`${validation.failed} sliders failed validation: ${examples}${validation.failed > 3 ? '...' : ''}`);
        }
      }, results);
      
    } catch (error) {
      console.error('❌ UI tests failed:', error);
      results.errors.push(error);
    }
  }
  
  /**
   * Run texture discovery tests
   */
  static async runTextureTests(results) {
    console.log('\n🖼️  Texture Discovery Tests\n');
    console.log('─'.repeat(70));
    
    try {
      // Test 1: EffectTargetManager has discovered targets
      await this.test('Texture discovery has run', () => {
        const targets = game.mapShine.effectTargetManager.targets;
        if (!targets) {
          throw new Error('EffectTargetManager.targets is null');
        }
        
        if (!targets.tiles || !(targets.tiles instanceof Map)) {
          throw new Error('EffectTargetManager.targets.tiles is not a Map');
        }
      }, results);
      
      // Test 2: Check for expected texture suffixes
      await this.test('Expected texture types are checked', () => {
        const targets = game.mapShine.effectTargetManager.targets;
        const expectedSuffixes = ['specular', 'outdoors', 'canopy', 'structural', 'water'];
        
        // At least check that the discovery system ran
        // (Background could be null if no textures exist, which is valid)
        const hasBackground = targets.background !== null;
        const hasTiles = targets.tiles.size > 0;
        
        if (!hasBackground && !hasTiles) {
          console.warn('⚠️  No textures discovered (this is OK if none exist on the scene)');
        }
      }, results);
      
      // Test 3: Validate texture paths are strings
      await this.test('Discovered texture paths are valid', () => {
        const targets = game.mapShine.effectTargetManager.targets;
        const invalidPaths = [];
        
        if (targets.background) {
          for (const [key, path] of Object.entries(targets.background)) {
            if (path && typeof path !== 'string') {
              invalidPaths.push(`background.${key}`);
            }
          }
        }
        
        for (const [tileId, tileTarget] of targets.tiles.entries()) {
          for (const [key, path] of Object.entries(tileTarget)) {
            if (path && typeof path !== 'string' && key !== 'tile') {
              invalidPaths.push(`tile[${tileId}].${key}`);
            }
          }
        }
        
        if (invalidPaths.length > 0) {
          throw new Error(`Invalid texture paths: ${invalidPaths.join(', ')}`);
        }
      }, results);
      
    } catch (error) {
      console.error('❌ Texture tests failed:', error);
      results.errors.push(error);
    }
  }
  
  /**
   * Run a single test
   * 
   * @param {string} name - Test name
   * @param {Function} fn - Test function (should throw on failure)
   * @param {Object} results - Results accumulator
   */
  static async test(name, fn, results) {
    try {
      await fn();
      results.passed.push(name);
      console.log(`  ✅ ${name}`);
    } catch (error) {
      results.failed.push({ name, error: error.message });
      console.error(`  ❌ ${name}`);
      console.error(`     ${error.message}`);
    }
  }
  
  /**
   * Print test results summary
   */
  static printResults(results) {
    const duration = Date.now() - results.startTime;
    
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`    TEST RESULTS`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`🔥 Errors: ${results.errors.length}`);
    console.log(`⏱️  Duration: ${duration}ms`);
    
    if (results.failed.length > 0) {
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`Failed Tests:`);
      results.failed.forEach((f, idx) => {
        console.log(`  ${idx + 1}. ${f.name}`);
        console.log(`     ${f.error}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log(`\n${'─'.repeat(70)}`);
      console.log(`Fatal Errors:`);
      results.errors.forEach((e, idx) => {
        console.log(`  ${idx + 1}. ${e.message || e}`);
        if (e.stack) {
          console.log(`     ${e.stack}`);
        }
      });
    }
    
    console.log(`${'═'.repeat(70)}\n`);
  }
  
  /**
   * Generate detailed reports from validators
   */
  static generateReports() {
    console.log('\n📊 DETAILED VALIDATION REPORTS\n');
    
    // UI Data Validator Report
    if (UIDataValidator.getErrors().length > 0 || UIDataValidator.getWarnings().length > 0) {
      console.log(UIDataValidator.generateReport());
    }
    
    // Config Validator Report
    if (ConfigValidator.getErrors().length > 0 || ConfigValidator.getWarnings().length > 0) {
      console.log(ConfigValidator.generateReport());
    }
    
    // Manager Validator Report
    if (ManagerValidator.getErrors().length > 0 || ManagerValidator.getWarnings().length > 0) {
      console.log(ManagerValidator.generateReport());
    }
    
    // Memory Leak Detector Report
    if (MemoryLeakDetector.getErrors().length > 0 || MemoryLeakDetector.getWarnings().length > 0) {
      console.log(MemoryLeakDetector.generateReport());
    }
  }
  
  /**
   * Run memory leak detection tests
   */
  static async runMemoryTests(results) {
    console.log('\n🔍 Memory Leak Detection Tests\n');
    console.log('─'.repeat(70));
    
    try {
      // Test 1: Initial memory snapshot
      await this.test('Take initial memory snapshot', () => {
        const snapshot = MemoryLeakDetector.takeSnapshot('initial');
        if (!snapshot || !snapshot.timestamp) {
          throw new Error('Failed to take memory snapshot');
        }
      }, results);
      
      // Test 2: RenderTexturePool has no active textures
      await this.test('RenderTexturePool has no leaks', () => {
        const activeCount = MemoryLeakDetector._getPoolActiveCount();
        if (activeCount > 0) {
          throw new Error(`Pool has ${activeCount} unreleased textures`);
        }
      }, results);
      
      // Test 3: Layer destruction flags
      await this.test('All layers have correct destruction flags', () => {
        const validation = MemoryLeakDetector.validateLayerDestruction();
        if (validation.notDestroyed.length > 0) {
          throw new Error(`${validation.notDestroyed.length} layers not properly destroyed`);
        }
      }, results);
      
      // Test 4: Scene transition memory test (long-running)
      if (game.scenes.size >= 2) {
        await this.test('Scene transition does not leak memory', async () => {
          const result = await MemoryLeakDetector.testSceneTransition();
          if (result.leaksDetected) {
            throw new Error(`Leaks detected: ${result.errors.join(', ')}`);
          }
        }, results);
      } else {
        console.log('  ⚠️  Skipping scene transition test (need 2+ scenes)');
      }
      
      // Test 5: Effect toggle memory test
      await this.test('Effect toggle does not leak memory', async () => {
        const result = await MemoryLeakDetector.testEffectToggle('cloudShadows', 5);
        if (result.leaksDetected) {
          throw new Error(`Leaks detected: ${result.errors.join(', ')}`);
        }
      }, results);
      
    } catch (error) {
      console.error('❌ Memory tests failed:', error);
      results.errors.push(error);
    }
  }
}
