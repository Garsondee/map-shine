/**
 * @fileoverview Manager Validator - Manager Initialization Testing
 * 
 * Validates that all module managers initialize correctly and are in valid states.
 * This catches initialization errors, missing dependencies, and broken manager references.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class ManagerValidator {
  static errors = [];
  static warnings = [];
  
  /**
   * List of expected managers in game.mapShine
   */
  static EXPECTED_MANAGERS = [
    { name: 'profileManager', required: true },
    { name: 'resourceManager', required: true },
    { name: 'windManager', required: true },
    { name: 'weatherSystemManager', required: false },
    { name: 'particleManager', required: false },
    { name: 'tokenManager', required: false },
    { name: 'dynamicExposureManager', required: false },
    { name: 'geometryMaskManager', required: false },
    { name: 'lightMaskManager', required: false },
    { name: 'transitionManager', required: true },
    { name: 'sceneChangeManager', required: true },
    { name: 'effectTargetManager', required: true },
    { name: 'combatEffectManager', required: false },
    { name: 'coordinateManager', required: true }
  ];
  
  /**
   * Validates that all expected managers exist
   * 
   * @returns {Object} Validation results
   */
  static validateManagersExist() {
    const results = {
      total: this.EXPECTED_MANAGERS.length,
      present: 0,
      missing: [],
      missingRequired: []
    };
    
    if (!game.mapShine) {
      this.errors.push({
        type: 'MAPSHINE_NAMESPACE_MISSING',
        message: 'game.mapShine namespace does not exist'
      });
      return results;
    }
    
    for (const { name, required } of this.EXPECTED_MANAGERS) {
      if (game.mapShine[name]) {
        results.present++;
      } else {
        results.missing.push(name);
        
        if (required) {
          results.missingRequired.push(name);
          this.errors.push({
            type: 'REQUIRED_MANAGER_MISSING',
            manager: name,
            message: `Required manager '${name}' is missing from game.mapShine`
          });
        } else {
          this.warnings.push({
            type: 'OPTIONAL_MANAGER_MISSING',
            manager: name,
            message: `Optional manager '${name}' is missing from game.mapShine`
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Validates ProfileManager initialization and state
   * 
   * @param {Object} profileManager - game.mapShine.profileManager
   * @returns {Object} Validation results
   */
  static validateProfileManager(profileManager) {
    const results = {
      checks: [],
      allPassed: true
    };
    
    const addCheck = (name, passed, details = '') => {
      results.checks.push({ name, passed, details });
      if (!passed) {
        results.allPassed = false;
        this.errors.push({
          type: 'PROFILE_MANAGER_CHECK_FAILED',
          check: name,
          details,
          message: `ProfileManager check failed: ${name}`
        });
      }
    };
    
    if (!profileManager) {
      addCheck('Manager exists', false, 'ProfileManager is null/undefined');
      return results;
    }
    
    addCheck('Manager exists', true);
    addCheck('activeConfig exists', !!profileManager.activeConfig);
    addCheck('activeConfig is object', typeof profileManager.activeConfig === 'object');
    addCheck('dataManager exists', !!profileManager.dataManager);
    addCheck('status object exists', !!profileManager.status);
    addCheck('Has initializeForScene method', typeof profileManager.initializeForScene === 'function');
    addCheck('Has updateAllSystemsFromConfig method', typeof profileManager.updateAllSystemsFromConfig === 'function');
    
    return results;
  }
  
  /**
   * Validates ResourceManager initialization
   * 
   * @param {Object} resourceManager - game.mapShine.resourceManager
   * @returns {Object} Validation results
   */
  static validateResourceManager(resourceManager) {
    const results = {
      checks: [],
      allPassed: true
    };
    
    const addCheck = (name, passed, details = '') => {
      results.checks.push({ name, passed, details });
      if (!passed) {
        results.allPassed = false;
        this.errors.push({
          type: 'RESOURCE_MANAGER_CHECK_FAILED',
          check: name,
          details,
          message: `ResourceManager check failed: ${name}`
        });
      }
    };
    
    if (!resourceManager) {
      addCheck('Manager exists', false, 'ResourceManager is null/undefined');
      return results;
    }
    
    addCheck('Manager exists', true);
    addCheck('Has initialize method', typeof resourceManager.initialize === 'function');
    addCheck('Has getOutdoorsMask method', typeof resourceManager.getOutdoorsMask === 'function');
    
    return results;
  }
  
  /**
   * Validates WeatherSystemManager if present
   * 
   * @param {Object} weatherManager - game.mapShine.weatherSystemManager
   * @returns {Object} Validation results
   */
  static validateWeatherSystemManager(weatherManager) {
    const results = {
      checks: [],
      allPassed: true
    };
    
    const addCheck = (name, passed, details = '') => {
      results.checks.push({ name, passed, details });
      if (!passed) {
        results.allPassed = false;
        this.warnings.push({
          type: 'WEATHER_MANAGER_CHECK_FAILED',
          check: name,
          details,
          message: `WeatherSystemManager check failed: ${name}`
        });
      }
    };
    
    if (!weatherManager) {
      // Optional manager - just note it's missing
      results.checks.push({ name: 'Manager exists', passed: false, details: 'Not initialized' });
      return results;
    }
    
    addCheck('Manager exists', true);
    addCheck('Has initialize method', typeof weatherManager.initialize === 'function');
    addCheck('Has setState method', typeof weatherManager.setState === 'function');
    addCheck('Has getCurrentWeatherState method', typeof weatherManager.getCurrentWeatherState === 'function');
    addCheck('isReady property exists', 'isReady' in weatherManager);
    
    return results;
  }
  
  /**
   * Validates that managers can receive config updates
   * 
   * @param {Object} config - Configuration object to test with
   * @returns {Object} Validation results
   */
  static validateConfigPropagation(config) {
    const results = {
      total: 0,
      successful: 0,
      failed: []
    };
    
    // Test canvas layers
    if (canvas && canvas.layers) {
      for (const layer of canvas.layers) {
        if (typeof layer.updateFromConfig === 'function') {
          results.total++;
          try {
            // We don't actually call it in tests, just verify the method exists
            results.successful++;
          } catch (error) {
            results.failed.push({
              target: layer.constructor.name,
              error: error.message
            });
            this.errors.push({
              type: 'CONFIG_PROPAGATION_FAILED',
              target: layer.constructor.name,
              error: error.message,
              message: `Layer ${layer.constructor.name}.updateFromConfig validation failed`
            });
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Validates effect target manager
   * 
   * @param {Object} effectTargetManager - game.mapShine.effectTargetManager
   * @returns {Object} Validation results
   */
  static validateEffectTargetManager(effectTargetManager) {
    const results = {
      checks: [],
      allPassed: true
    };
    
    const addCheck = (name, passed, details = '') => {
      results.checks.push({ name, passed, details });
      if (!passed) {
        results.allPassed = false;
        this.errors.push({
          type: 'EFFECT_TARGET_MANAGER_CHECK_FAILED',
          check: name,
          details,
          message: `EffectTargetManager check failed: ${name}`
        });
      }
    };
    
    if (!effectTargetManager) {
      addCheck('Manager exists', false, 'EffectTargetManager is null/undefined');
      return results;
    }
    
    addCheck('Manager exists', true);
    addCheck('Has targets property', 'targets' in effectTargetManager);
    addCheck('Has refresh method', typeof effectTargetManager.refresh === 'function');
    addCheck('Has broadcastUpdate method', typeof effectTargetManager.broadcastUpdate === 'function');
    
    if (effectTargetManager.targets) {
      addCheck('targets has background property', 'background' in effectTargetManager.targets);
      addCheck('targets has tiles property', 'tiles' in effectTargetManager.targets);
      addCheck('tiles is Map', effectTargetManager.targets.tiles instanceof Map);
    }
    
    return results;
  }
  
  /**
   * Runs all manager validation tests
   * 
   * @returns {Object} Complete validation results
   */
  static validateAll() {
    const results = {
      timestamp: new Date().toISOString(),
      managers: this.validateManagersExist(),
      profileManager: null,
      resourceManager: null,
      weatherManager: null,
      effectTargetManager: null,
      configPropagation: null
    };
    
    if (game.mapShine) {
      results.profileManager = this.validateProfileManager(game.mapShine.profileManager);
      results.resourceManager = this.validateResourceManager(game.mapShine.resourceManager);
      results.weatherManager = this.validateWeatherSystemManager(game.mapShine.weatherSystemManager);
      results.effectTargetManager = this.validateEffectTargetManager(game.mapShine.effectTargetManager);
      
      if (game.mapShine.profileManager?.activeConfig) {
        results.configPropagation = this.validateConfigPropagation(game.mapShine.profileManager.activeConfig);
      }
    }
    
    return results;
  }
  
  /**
   * Gets all recorded errors
   * @returns {Array} Array of error objects
   */
  static getErrors() {
    return [...this.errors];
  }
  
  /**
   * Gets all recorded warnings
   * @returns {Array} Array of warning objects
   */
  static getWarnings() {
    return [...this.warnings];
  }
  
  /**
   * Clears all recorded errors and warnings
   */
  static clearErrors() {
    this.errors = [];
    this.warnings = [];
  }
  
  /**
   * Generates a detailed report
   * @returns {string} Formatted report
   */
  static generateReport() {
    let report = '\n═══════════════════════════════════════════════\n';
    report += '    MANAGER VALIDATION REPORT\n';
    report += '═══════════════════════════════════════════════\n\n';
    
    report += `Errors: ${this.errors.length}\n`;
    report += `Warnings: ${this.warnings.length}\n\n`;
    
    if (this.errors.length > 0) {
      report += '─── ERRORS ───\n';
      this.errors.forEach((err, idx) => {
        report += `\n${idx + 1}. ${err.type}\n`;
        report += `   ${err.message}\n`;
        if (err.details) {
          report += `   Details: ${err.details}\n`;
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
    
    report += '═══════════════════════════════════════════════\n';
    return report;
  }
}
