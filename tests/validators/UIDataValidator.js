/**
 * @fileoverview UI Data Validator - Formal Error Detection for Slider Detachment
 * 
 * This validator addresses the critical issue of UI sliders becoming detached from
 * their underlying configuration data. When a slider loses its connection to the
 * config object, it becomes non-functional - users can move it but nothing happens.
 * 
 * This system throws FORMAL ERRORS when detachment is detected, making debugging
 * trivial instead of spending hours hunting for broken connections.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class UIDataValidator {
  static errors = [];
  static warnings = [];
  
  /**
   * CRITICAL: Validates that a UI slider is properly connected to config data
   * 
   * This performs three critical checks:
   * 1. Slider has a data-path attribute
   * 2. The data-path maps to an actual config property
   * 3. The slider's value matches the config value
   * 
   * @param {HTMLElement} sliderElement - The slider input element
   * @param {Object} config - The configuration object (game.mapShine.profileManager.activeConfig)
   * @throws {Error} Throws formal error if detachment is detected
   */
  static validateSliderConnection(sliderElement, config) {
    const sliderId = sliderElement.id || sliderElement.dataset.path || 'UNKNOWN';
    
    // CHECK 1: Slider must have data-path attribute
    const path = sliderElement.dataset.path;
    if (!path) {
      this.throwDetachmentError('MISSING_PATH', sliderId, 'Slider has no data-path attribute');
      return;
    }
    
    // CHECK 2: data-path must map to actual config property
    const value = foundry.utils.getProperty(config, path);
    if (value === undefined) {
      this.throwDetachmentError(
        'PATH_NOT_FOUND', 
        sliderId, 
        path,
        'Config path does not exist'
      );
      return;
    }
    
    // CHECK 3: Slider value must match config value
    const sliderValue = parseFloat(sliderElement.value);
    const configValue = parseFloat(value);
    
    if (isNaN(sliderValue) || isNaN(configValue)) {
      this.throwDetachmentError(
        'VALUE_TYPE_MISMATCH',
        sliderId,
        path,
        `Slider value: ${sliderValue}, Config value: ${configValue}`
      );
      return;
    }
    
    // Allow small floating-point tolerance
    if (Math.abs(sliderValue - configValue) > 0.001) {
      this.throwDetachmentError(
        'VALUE_MISMATCH',
        sliderId,
        path,
        `Slider: ${sliderValue}, Config: ${configValue}`
      );
      return;
    }
  }
  
  /**
   * Validates all sliders in the document
   * 
   * @param {Object} config - The configuration object
   * @returns {Object} Results with passed/failed counts and error list
   */
  static validateAllSliders(config) {
    const allSliders = document.querySelectorAll('input[type="range"]');
    const results = {
      total: allSliders.length,
      passed: 0,
      failed: 0,
      errors: []
    };
    
    for (const slider of allSliders) {
      try {
        this.validateSliderConnection(slider, config);
        results.passed++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          sliderId: slider.id || slider.dataset.path,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Validates that a config path exists and has the expected type
   * 
   * @param {Object} config - Configuration object
   * @param {string} path - Dot-notation path to validate
   * @param {string} expectedType - Expected type (number, boolean, string, object)
   * @returns {boolean} True if valid
   */
  static validateConfigPath(config, path, expectedType) {
    const value = foundry.utils.getProperty(config, path);
    
    if (value === undefined) {
      this.warnings.push({
        type: 'MISSING_CONFIG_PATH',
        path,
        message: `Config path '${path}' does not exist`
      });
      return false;
    }
    
    const actualType = typeof value;
    if (actualType !== expectedType) {
      this.warnings.push({
        type: 'CONFIG_TYPE_MISMATCH',
        path,
        expected: expectedType,
        actual: actualType,
        message: `Config path '${path}' expected ${expectedType}, got ${actualType}`
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * Validates that all paths in MODULE_DEFAULTS have corresponding UI controls
   * 
   * @param {Object} defaults - MODULE_DEFAULTS object
   * @param {Array<string>} exceptions - Paths that don't need UI controls
   * @returns {Array} List of paths without UI controls
   */
  static validateUICompleteness(defaults, exceptions = []) {
    const missingControls = [];
    
    const checkPath = (obj, currentPath = '') => {
      for (const key in obj) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        const value = obj[key];
        
        if (exceptions.includes(fullPath)) continue;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recurse into nested objects
          checkPath(value, fullPath);
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          // Check if UI control exists for this path
          const control = document.querySelector(`[data-path="${fullPath}"]`);
          if (!control) {
            missingControls.push({
              path: fullPath,
              type: typeof value,
              value
            });
          }
        }
      }
    };
    
    checkPath(defaults);
    return missingControls;
  }
  
  /**
   * Throws a formal, structured error for UI slider detachment
   * 
   * This creates a highly visible error that includes:
   * - Error type classification
   * - Slider identification
   * - Path information
   * - Diagnostic details
   * 
   * @param {string} type - Error type code
   * @param {string} sliderId - ID of the problematic slider
   * @param {...any} details - Additional diagnostic information
   * @throws {Error} Always throws
   */
  static throwDetachmentError(type, sliderId, ...details) {
    const error = {
      type: 'UI_SLIDER_DETACHMENT',
      code: type,
      sliderId,
      details,
      timestamp: Date.now(),
      stack: new Error().stack
    };
    
    this.errors.push(error);
    
    // Highly visible console output
    console.error(
      `%c[CRITICAL] UI SLIDER DETACHED!`,
      'color: #ff0000; font-weight: bold; font-size: 16px; background: #ffe0e0; padding: 4px;'
    );
    console.error(
      `%cSlider ID: ${sliderId}`,
      'color: #cc0000; font-weight: bold;'
    );
    console.error(
      `%cError Code: ${type}`,
      'color: #cc0000; font-weight: bold;'
    );
    
    if (details.length > 0) {
      console.error(
        `%cDetails:`,
        'color: #990000; font-weight: bold;'
      );
      details.forEach(detail => {
        console.error(`  ${detail}`);
      });
    }
    
    console.error(error.stack);
    
    throw new Error(`UI_SLIDER_DETACHMENT: ${type} - ${sliderId} - ${details.join(', ')}`);
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
   * Generates a detailed report of all validation issues
   * @returns {string} Formatted report
   */
  static generateReport() {
    let report = '\n═══════════════════════════════════════════════\n';
    report += '    UI DATA VALIDATION REPORT\n';
    report += '═══════════════════════════════════════════════\n\n';
    
    report += `Errors: ${this.errors.length}\n`;
    report += `Warnings: ${this.warnings.length}\n\n`;
    
    if (this.errors.length > 0) {
      report += '─── ERRORS ───\n';
      this.errors.forEach((err, idx) => {
        report += `\n${idx + 1}. ${err.code}\n`;
        report += `   Slider: ${err.sliderId}\n`;
        report += `   Details: ${err.details.join(', ')}\n`;
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
