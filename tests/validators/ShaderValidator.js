/**
 * @fileoverview Shader Validator - Compilation & Runtime Error Detection
 * 
 * Validates all Map Shine shaders for:
 * - Successful compilation
 * - Uniform availability
 * - Texture binding errors
 * - Runtime errors in fragment/vertex shaders
 * 
 * Critical for catching:
 * - Undeclared uniform errors
 * - Missing texture bindings
 * - Null baseTexture access
 * - GLSL syntax errors
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.0.0
 */

export class ShaderValidator {
  static errors = [];
  static warnings = [];
  
  /**
   * List of all Map Shine shader filters to validate
   */
  static SHADER_FILTERS = [
    { name: 'CloudShadowsFilter', layer: 'CloudShadowsLayer' },
    { name: 'StructuralFilter', layer: 'StructuralShadowsLayer' },
    { name: 'MetallicShineFilter', layer: 'MetallicShineLayer' },
    { name: 'ColorCorrectionFilter', manager: 'ScreenEffectsManager' },
    { name: 'GrainFilter', manager: 'ScreenEffectsManager' },
    { name: 'RainShaderAdvanced', layer: 'WeatherEffectLayer' },
    { name: 'SnowShader', layer: 'WeatherEffectLayer' },
    { name: 'FogShader', layer: 'WeatherEffectLayer' },
    { name: 'CanopyFilter', layer: 'CanopyLayer' },
    { name: 'IridescenceFilter', layer: 'IridescenceLayer' },
    { name: 'PrismFilter', layer: 'PrismLayer' },
    { name: 'WaterFXFilter', layer: 'WaterEffectLayer' },
    { name: 'HeatDistortionFilter', layer: 'HeatDistortionLayer' },
    { name: 'FireToneCurveFilter', effectKey: 'fire' }
  ];
  
  /**
   * Validate all shaders in Map Shine
   * 
   * @returns {Object} Validation results
   */
  static validateAllShaders() {
    const results = {
      total: this.SHADER_FILTERS.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    
    console.log(`🔍 Validating ${results.total} shader filters...`);
    
    for (const shaderInfo of this.SHADER_FILTERS) {
      const validation = this.validateShader(shaderInfo);
      results.details.push(validation);
      
      if (validation.skipped) {
        results.skipped++;
      } else if (validation.passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
    
    return results;
  }
  
  /**
   * Validate a single shader filter
   * 
   * @param {Object} shaderInfo - Shader information
   * @returns {Object} Validation result
   */
  static validateShader(shaderInfo) {
    const result = {
      name: shaderInfo.name,
      passed: false,
      skipped: false,
      errors: [],
      warnings: []
    };
    
    try {
      // Find the filter instance
      const filter = this._findFilterInstance(shaderInfo);
      
      if (!filter) {
        result.skipped = true;
        result.warnings.push(`Filter not found (layer/manager may be disabled)`);
        return result;
      }
      
      // Check if filter has a program (compiled shader)
      if (!filter.program) {
        result.errors.push('Shader not compiled (no program)');
        this.errors.push({
          type: 'SHADER_NOT_COMPILED',
          filter: shaderInfo.name,
          message: `${shaderInfo.name} has no compiled program`
        });
        return result;
      }
      
      // Check for GL errors
      const glErrors = this._checkGLErrors(filter);
      if (glErrors.length > 0) {
        result.errors.push(...glErrors);
        glErrors.forEach(err => {
          this.errors.push({
            type: 'GL_ERROR',
            filter: shaderInfo.name,
            message: err
          });
        });
        return result;
      }
      
      // Check uniforms
      const uniformCheck = this._checkUniforms(filter, shaderInfo.name);
      result.warnings.push(...uniformCheck.warnings);
      result.errors.push(...uniformCheck.errors);
      
      // Check texture bindings
      const textureCheck = this._checkTextureBindings(filter, shaderInfo.name);
      result.warnings.push(...textureCheck.warnings);
      result.errors.push(...textureCheck.errors);
      
      // If no errors, shader is valid
      if (result.errors.length === 0) {
        result.passed = true;
      }
      
    } catch (error) {
      result.errors.push(`Validation exception: ${error.message}`);
      this.errors.push({
        type: 'VALIDATION_EXCEPTION',
        filter: shaderInfo.name,
        message: error.message
      });
    }
    
    return result;
  }
  
  /**
   * Test shader compilation with a simple geometry
   * 
   * @param {PIXI.Filter} filter - Filter to test
   * @returns {Object} Test results
   */
  static testShaderCompilation(filter) {
    const results = {
      compiled: false,
      rendered: false,
      errors: []
    };
    
    try {
      // Create a simple test sprite
      const graphics = new PIXI.Graphics();
      graphics.beginFill(0xffffff);
      graphics.drawRect(0, 0, 100, 100);
      graphics.endFill();
      
      const testTexture = canvas.app.renderer.generateTexture(graphics);
      const testSprite = new PIXI.Sprite(testTexture);
      testSprite.filters = [filter];
      
      // Try to render it
      const renderTexture = PIXI.RenderTexture.create({ width: 100, height: 100 });
      
      try {
        canvas.app.renderer.render(testSprite, { renderTexture });
        results.compiled = true;
        results.rendered = true;
      } catch (error) {
        results.errors.push(`Render failed: ${error.message}`);
        this.errors.push({
          type: 'SHADER_RENDER_FAILED',
          filter: filter.constructor.name,
          message: error.message
        });
      }
      
      // Cleanup
      testSprite.destroy({ children: true, texture: true, baseTexture: true });
      renderTexture.destroy(true);
      
    } catch (error) {
      results.errors.push(`Compilation test failed: ${error.message}`);
    }
    
    return results;
  }
  
  /**
   * Check for common shader runtime errors
   * 
   * @returns {Object} Runtime error check results
   */
  static checkRuntimeErrors() {
    const results = {
      nullBaseTextureAccess: [],
      invalidUniformAccess: [],
      missingTextures: []
    };
    
    // Check for layers trying to access destroyed textures
    if (canvas.layers) {
      for (const layer of canvas.layers) {
        if (layer._destroyed) continue;
        
        // Check if layer has filters with textures
        if (layer.filters) {
          for (const filter of layer.filters) {
            if (!filter.uniforms) continue;
            
            for (const [key, value] of Object.entries(filter.uniforms)) {
              if (value && typeof value === 'object' && 'baseTexture' in value) {
                if (!value.baseTexture || !value.baseTexture.valid) {
                  results.nullBaseTextureAccess.push({
                    layer: layer.constructor.name,
                    filter: filter.constructor.name,
                    uniform: key
                  });
                  
                  this.errors.push({
                    type: 'NULL_BASE_TEXTURE',
                    layer: layer.constructor.name,
                    filter: filter.constructor.name,
                    uniform: key,
                    message: `${layer.constructor.name} → ${filter.constructor.name}.${key} has null/invalid baseTexture`
                  });
                }
              }
            }
          }
        }
      }
    }
    
    return results;
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  static _findFilterInstance(shaderInfo) {
    // Try to find the filter instance based on layer or manager
    
    if (shaderInfo.layer) {
      const layer = canvas.layers?.find(l => l.constructor.name === shaderInfo.layer);
      if (!layer) return null;
      
      // Check if layer has the filter
      if (layer.filter && layer.filter.constructor.name === shaderInfo.name) {
        return layer.filter;
      }
      
      // Check filters array
      if (layer.filters) {
        return layer.filters.find(f => f.constructor.name === shaderInfo.name);
      }
    }
    
    if (shaderInfo.manager) {
      const manager = game.mapShine?.[shaderInfo.manager.charAt(0).toLowerCase() + shaderInfo.manager.slice(1)];
      if (!manager) return null;
      
      // Check for filter property
      if (manager.filters) {
        return manager.filters.find(f => f.constructor.name === shaderInfo.name);
      }
      
      // Check for specific filter name
      const filterKey = shaderInfo.name.charAt(0).toLowerCase() + shaderInfo.name.slice(1);
      if (manager[filterKey]) {
        return manager[filterKey];
      }
    }
    
    if (shaderInfo.effectKey) {
      // Special handling for effect-specific filters
      const config = game.mapShine?.profileManager?.activeConfig;
      if (config?.[shaderInfo.effectKey]) {
        // Would need to find the actual filter instance
        // This is more complex and may need per-effect logic
      }
    }
    
    return null;
  }
  
  static _checkGLErrors(filter) {
    const errors = [];
    
    try {
      const gl = canvas.app.renderer.gl;
      if (!gl) return errors;
      
      let error = gl.getError();
      while (error !== gl.NO_ERROR) {
        let errorName = 'UNKNOWN_ERROR';
        switch (error) {
          case gl.INVALID_ENUM: errorName = 'INVALID_ENUM'; break;
          case gl.INVALID_VALUE: errorName = 'INVALID_VALUE'; break;
          case gl.INVALID_OPERATION: errorName = 'INVALID_OPERATION'; break;
          case gl.OUT_OF_MEMORY: errorName = 'OUT_OF_MEMORY'; break;
          case gl.INVALID_FRAMEBUFFER_OPERATION: errorName = 'INVALID_FRAMEBUFFER_OPERATION'; break;
        }
        errors.push(`GL Error: ${errorName} (0x${error.toString(16)})`);
        error = gl.getError();
      }
    } catch (e) {
      // Can't check GL errors
    }
    
    return errors;
  }
  
  static _checkUniforms(filter, filterName) {
    const result = {
      errors: [],
      warnings: []
    };
    
    if (!filter.uniforms) {
      result.warnings.push('No uniforms object');
      return result;
    }
    
    // Check for undefined uniform values
    for (const [key, value] of Object.entries(filter.uniforms)) {
      if (value === undefined) {
        result.warnings.push(`Uniform "${key}" is undefined`);
        this.warnings.push({
          type: 'UNDEFINED_UNIFORM',
          filter: filterName,
          uniform: key,
          message: `${filterName}.${key} is undefined`
        });
      }
    }
    
    return result;
  }
  
  static _checkTextureBindings(filter, filterName) {
    const result = {
      errors: [],
      warnings: []
    };
    
    if (!filter.uniforms) return result;
    
    // Check for texture uniforms
    for (const [key, value] of Object.entries(filter.uniforms)) {
      if (value && typeof value === 'object' && 'baseTexture' in value) {
        // This is a texture
        if (!value.baseTexture) {
          result.errors.push(`Texture "${key}" has null baseTexture`);
          this.errors.push({
            type: 'NULL_BASE_TEXTURE',
            filter: filterName,
            uniform: key,
            message: `${filterName}.${key} has null baseTexture`
          });
        } else if (!value.baseTexture.valid) {
          result.errors.push(`Texture "${key}" has invalid baseTexture`);
          this.errors.push({
            type: 'INVALID_BASE_TEXTURE',
            filter: filterName,
            uniform: key,
            message: `${filterName}.${key} has invalid baseTexture`
          });
        }
      }
    }
    
    return result;
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
   * Clear all recorded data
   */
  static clearErrors() {
    this.errors = [];
    this.warnings = [];
  }
  
  /**
   * Generate detailed report
   */
  static generateReport() {
    let report = '\n═══════════════════════════════════════════════\n';
    report += '    SHADER VALIDATION REPORT\n';
    report += '═══════════════════════════════════════════════\n\n';
    
    report += `Errors: ${this.errors.length}\n`;
    report += `Warnings: ${this.warnings.length}\n\n`;
    
    if (this.errors.length > 0) {
      report += '─── SHADER ERRORS ───\n';
      this.errors.forEach((err, idx) => {
        report += `\n${idx + 1}. ${err.type}\n`;
        report += `   Filter: ${err.filter}\n`;
        report += `   ${err.message}\n`;
        if (err.uniform) {
          report += `   Uniform: ${err.uniform}\n`;
        }
      });
      report += '\n';
    }
    
    if (this.warnings.length > 0) {
      report += '─── WARNINGS ───\n';
      this.warnings.forEach((warn, idx) => {
        report += `\n${idx + 1}. ${warn.type}\n`;
        report += `   Filter: ${warn.filter}\n`;
        report += `   ${warn.message}\n`;
      });
      report += '\n';
    }
    
    report += '═══════════════════════════════════════════════\n';
    return report;
  }
}
