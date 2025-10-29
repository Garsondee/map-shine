/**
 * @fileoverview Configuration Validator - Settings & Data Integrity Testing
 * 
 * Validates that the configuration system is working correctly:
 * - Settings are registered properly
 * - Default values are correct
 * - Config merging doesn't lose data
 * - ProfileManager has valid data
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class ConfigValidator {
  static errors = [];
  static warnings = [];
  
  /**
   * Validates that all expected settings are registered
   * 
   * @param {Array<string>} expectedSettings - List of setting keys to check
   * @returns {Object} Results with missing settings
   */
  static validateSettingsRegistration(expectedSettings) {
    const results = {
      total: expectedSettings.length,
      registered: 0,
      missing: []
    };
    
    for (const settingKey of expectedSettings) {
      const setting = game.settings.settings.get(`map-shine.${settingKey}`);
      if (setting) {
        results.registered++;
      } else {
        results.missing.push(settingKey);
        this.errors.push({
          type: 'SETTING_NOT_REGISTERED',
          key: settingKey,
          message: `Setting '${settingKey}' is not registered`
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validates that MODULE_DEFAULTS has expected structure
   * 
   * @param {Object} defaults - MODULE_DEFAULTS object
   * @param {Array<string>} requiredKeys - Keys that must exist
   * @returns {Object} Validation results
   */
  static validateDefaultsStructure(defaults, requiredKeys) {
    const results = {
      total: requiredKeys.length,
      valid: 0,
      missing: []
    };
    
    for (const key of requiredKeys) {
      if (foundry.utils.hasProperty(defaults, key)) {
        results.valid++;
      } else {
        results.missing.push(key);
        this.errors.push({
          type: 'MISSING_DEFAULT_KEY',
          key,
          message: `MODULE_DEFAULTS missing required key '${key}'`
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validates that ProfileManager.activeConfig has all expected properties
   * 
   * @param {Object} config - ProfileManager.activeConfig
   * @param {Object} defaults - MODULE_DEFAULTS for comparison
   * @returns {Object} Validation results
   */
  static validateActiveConfig(config, defaults) {
    const results = {
      missingKeys: [],
      typeMismatches: [],
      extraKeys: []
    };
    
    // Check for missing keys
    const checkKeys = (defaultObj, configObj, path = '') => {
      for (const key in defaultObj) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (!(key in configObj)) {
          results.missingKeys.push(fullPath);
          this.errors.push({
            type: 'CONFIG_MISSING_KEY',
            path: fullPath,
            message: `activeConfig missing key '${fullPath}' from defaults`
          });
          continue;
        }
        
        const defaultValue = defaultObj[key];
        const configValue = configObj[key];
        const defaultType = typeof defaultValue;
        const configType = typeof configValue;
        
        // Type check
        if (defaultType !== configType && defaultValue !== null && configValue !== null) {
          results.typeMismatches.push({
            path: fullPath,
            expected: defaultType,
            actual: configType
          });
          this.warnings.push({
            type: 'CONFIG_TYPE_MISMATCH',
            path: fullPath,
            expectedType: defaultType,
            actualType: configType,
            message: `Type mismatch at '${fullPath}': expected ${defaultType}, got ${configType}`
          });
        }
        
        // Recurse into nested objects
        if (defaultType === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
          if (configType === 'object' && configValue !== null && !Array.isArray(configValue)) {
            checkKeys(defaultValue, configValue, fullPath);
          }
        }
      }
    };
    
    checkKeys(defaults, config);
    
    return results;
  }
  
  /**
   * Validates that config values are within valid ranges
   * 
   * @param {Object} config - Configuration object
   * @param {Object} validationRules - Rules for each path
   * @returns {Object} Validation results
   */
  static validateConfigRanges(config, validationRules) {
    const results = {
      total: Object.keys(validationRules).length,
      valid: 0,
      invalid: []
    };
    
    for (const [path, rules] of Object.entries(validationRules)) {
      const value = foundry.utils.getProperty(config, path);
      
      if (value === undefined) {
        results.invalid.push({
          path,
          reason: 'Path does not exist'
        });
        continue;
      }
      
      let isValid = true;
      let reason = '';
      
      if (rules.min !== undefined && value < rules.min) {
        isValid = false;
        reason = `Value ${value} is below minimum ${rules.min}`;
      }
      
      if (rules.max !== undefined && value > rules.max) {
        isValid = false;
        reason = `Value ${value} is above maximum ${rules.max}`;
      }
      
      if (rules.type && typeof value !== rules.type) {
        isValid = false;
        reason = `Expected type ${rules.type}, got ${typeof value}`;
      }
      
      if (isValid) {
        results.valid++;
      } else {
        results.invalid.push({ path, reason });
        this.warnings.push({
          type: 'CONFIG_VALUE_OUT_OF_RANGE',
          path,
          value,
          message: `Config value validation failed: ${reason}`
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validates that ProfileManager is in a valid state
   * 
   * @param {Object} profileManager - game.mapShine.profileManager
   * @returns {Object} Validation results
   */
  static validateProfileManager(profileManager) {
    const results = {
      checks: [],
      allPassed: true
    };
    
    const addCheck = (name, passed, message) => {
      results.checks.push({ name, passed, message });
      if (!passed) {
        results.allPassed = false;
        this.errors.push({
          type: 'PROFILE_MANAGER_INVALID',
          check: name,
          message
        });
      }
    };
    
    // Check 1: ProfileManager exists
    addCheck(
      'ProfileManager exists',
      !!profileManager,
      profileManager ? 'OK' : 'ProfileManager is null/undefined'
    );
    
    if (!profileManager) return results;
    
    // Check 2: activeConfig exists
    addCheck(
      'activeConfig exists',
      !!profileManager.activeConfig,
      profileManager.activeConfig ? 'OK' : 'activeConfig is null/undefined'
    );
    
    // Check 3: activeConfig is an object
    addCheck(
      'activeConfig is object',
      typeof profileManager.activeConfig === 'object',
      `activeConfig type: ${typeof profileManager.activeConfig}`
    );
    
    // Check 4: activeSceneId is set
    addCheck(
      'activeSceneId is set',
      !!profileManager.activeSceneId,
      profileManager.activeSceneId || 'activeSceneId is null/undefined'
    );
    
    // Check 5: status object exists
    addCheck(
      'status object exists',
      !!profileManager.status,
      profileManager.status ? 'OK' : 'status is null/undefined'
    );
    
    // Check 6: dataManager exists
    addCheck(
      'dataManager exists',
      !!profileManager.dataManager,
      profileManager.dataManager ? 'OK' : 'dataManager is null/undefined'
    );
    
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
    report += '    CONFIG VALIDATION REPORT\n';
    report += '═══════════════════════════════════════════════\n\n';
    
    report += `Errors: ${this.errors.length}\n`;
    report += `Warnings: ${this.warnings.length}\n\n`;
    
    if (this.errors.length > 0) {
      report += '─── ERRORS ───\n';
      this.errors.forEach((err, idx) => {
        report += `\n${idx + 1}. ${err.type}\n`;
        report += `   ${err.message}\n`;
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
