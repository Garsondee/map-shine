# Effect Validation Framework - Development Diagnostic System

## Purpose

Transform silent effect failures into clear, actionable error messages during development. This framework validates every effect during startup and runtime, providing immediate feedback when something breaks.

## Core Architecture

### Validation Engine: `EffectValidator`

**Location:** `scripts/diagnostics/EffectValidator.js` (new file)

**Purpose:** Centralized validation system for all Map Shine effects

```javascript
class EffectValidator {
  constructor(effectName, effectInstance) {
    this.effectName = effectName;
    this.effectInstance = effectInstance;
    this.errors = [];
    this.warnings = [];
    this.validationPassed = false;
  }
  
  async runFullValidation() {
    this.errors = [];
    this.warnings = [];
    
    // Core validation categories
    await this.validateTextures();
    await this.validateShaders();
    await this.validateConfiguration();
    await this.validateRenderingPipeline();
    await this.validateDependencies();
    
    this.validationPassed = this.errors.length === 0;
    this.reportResults();
    
    return this.validationPassed;
  }
}
```

---

## Validation Categories

### 1. Texture Validation

**Purpose:** Ensure all required textures are present and valid

```javascript
async validateTextures() {
  const textureMap = this.effectInstance.textureMap || {};
  const requiredTextures = this.getRequiredTextures();
  
  for (const [suffix, texturePath] of Object.entries(textureMap)) {
    try {
      // Check texture exists
      if (!texturePath) {
        this.addError(`Missing texture path for ${suffix}`);
        continue;
      }
      
      // Check texture loaded
      const texture = await this.loadTexture(texturePath);
      if (!texture) {
        this.addError(`Failed to load texture: ${suffix} (${texturePath})`);
        continue;
      }
      
      // Check texture validity
      if (!texture.baseTexture?.valid) {
        this.addError(`Invalid baseTexture for ${suffix}`);
        continue;
      }
      
      // Check texture dimensions
      if (texture.width === 0 || texture.height === 0) {
        this.addError(`Zero-dimension texture: ${suffix}`);
        continue;
      }
      
      // Check for texture corruption
      if (texture.baseTexture.width > 8192 || texture.baseTexture.height > 8192) {
        this.addWarning(`Very large texture detected: ${suffix} (${texture.width}x${texture.height})`);
      }
      
    } catch (error) {
      this.addError(`Exception loading ${suffix}: ${error.message}`);
    }
  }
  
  // Check for missing required textures
  for (const required of requiredTextures) {
    if (!textureMap[required]) {
      this.addError(`Required texture missing: ${required}`);
    }
  }
}
```

### 2. Shader Validation

**Purpose:** Ensure shaders compile and have required uniforms

```javascript
async validateShaders() {
  const filter = this.effectInstance.filter;
  if (!filter) {
    this.addWarning('No filter found on effect');
    return;
  }
  
  try {
    // Check shader compilation
    if (filter.glProgram?.fragmentShader?.glShader === null) {
      this.addError('Fragment shader failed to compile');
    }
    
    if (filter.glProgram?.vertexShader?.glShader === null) {
      this.addError('Vertex shader failed to compile');
    }
    
    // Check required uniforms
    const requiredUniforms = this.getRequiredUniforms();
    const availableUniforms = filter.uniforms || {};
    
    for (const uniform of requiredUniforms) {
      if (!(uniform in availableUniforms)) {
        this.addError(`Missing required uniform: ${uniform}`);
      }
    }
    
    // Check uniform types and ranges
    for (const [name, uniform] of Object.entries(availableUniforms)) {
      if (uniform === undefined || uniform === null) {
        this.addError(`Uniform has null/undefined value: ${name}`);
      }
      
      // Check for NaN values
      if (typeof uniform === 'number' && isNaN(uniform)) {
        this.addError(`Uniform has NaN value: ${name}`);
      }
      
      // Check for infinite values
      if (typeof uniform === 'number' && !isFinite(uniform)) {
        this.addError(`Uniform has infinite value: ${name}`);
      }
    }
    
  } catch (error) {
    this.addError(`Shader validation exception: ${error.message}`);
  }
}
```

### 3. Configuration Validation

**Purpose:** Validate effect configuration parameters

```javascript
async validateConfiguration() {
  const config = this.effectInstance.config;
  if (!config) {
    this.addError('No configuration found');
    return;
  }
  
  // Check enabled flag
  if (typeof config.enabled !== 'boolean') {
    this.addWarning('Enabled flag is not boolean');
  }
  
  // Validate intensity ranges
  if (config.intensity !== undefined) {
    if (typeof config.intensity !== 'number') {
      this.addError('Intensity must be number');
    } else if (config.intensity < 0 || config.intensity > 10) {
      this.addWarning(`Intensity outside recommended range (0-10): ${config.intensity}`);
    }
  }
  
  // Validate opacity
  if (config.opacity !== undefined) {
    if (typeof config.opacity !== 'number') {
      this.addError('Opacity must be number');
    } else if (config.opacity < 0 || config.opacity > 1) {
      this.addError(`Opacity must be between 0-1: ${config.opacity}`);
    }
  }
  
  // Check for invalid color values
  const colorFields = ['color', 'tint', 'backgroundColor'];
  for (const field of colorFields) {
    if (config[field] && typeof config[field] === 'string') {
      if (!config[field].match(/^#[0-9A-Fa-f]{6}$/)) {
        this.addError(`Invalid color format for ${field}: ${config[field]}`);
      }
    }
  }
}
```

### 4. Rendering Pipeline Validation

**Purpose:** Ensure the rendering pipeline is functional

```javascript
async validateRenderingPipeline() {
  const layer = this.effectInstance;
  
  // Check if layer is properly attached to canvas
  if (!canvas) {
    this.addError('Canvas not available');
    return;
  }
  
  if (!layer.container) {
    this.addError('Layer has no container');
    return;
  }
  
  if (layer.container.parent !== canvas.primary) {
    this.addWarning('Layer not attached to primary canvas');
  }
  
  // Check filter application
  if (layer.filter && layer.container.filters) {
    if (!layer.container.filters.includes(layer.filter)) {
      this.addError('Filter not applied to container');
    }
  }
  
  // Check for render target issues
  if (layer.renderTexture) {
    if (!layer.renderTexture.baseTexture?.valid) {
      this.addError('Invalid render texture');
    }
  }
  
  // Check blend mode
  if (layer.container.blendMode === undefined) {
    this.addWarning('No blend mode set on container');
  }
}
```

### 5. Dependency Validation

**Purpose:** Check that required dependencies are available

```javascript
async validateDependencies() {
  // Check for required managers
  const requiredManagers = this.getRequiredManagers();
  
  for (const managerName of requiredManagers) {
    const manager = game.mapShine[managerName];
    if (!manager) {
      this.addError(`Required manager missing: ${managerName}`);
    } else if (!manager.initialized) {
      this.addWarning(`Manager not initialized: ${managerName}`);
    }
  }
  
  // Check for required canvas objects
  if (!canvas?.app?.renderer) {
    this.addError('PIXI renderer not available');
  }
  
  if (!canvas?.dimensions) {
    this.addError('Canvas dimensions not available');
  }
}
```

---

## Integration Points

### 1. MaskedEffectLayer Base Class

Add validation to startup:

```javascript
// In MaskedEffectLayer._draw()
async _draw(options) {
  await super._draw(options);
  
  // Run validation during development
  if (game.mapShine?.isDevelopmentMode) {
    const validator = new EffectValidator(this.constructor.name, this);
    const passed = await validator.runFullValidation();
    
    if (!passed) {
      console.error(`🚨 ${this.constructor.name} validation failed:`, validator.errors);
    }
    
    // Store validator for later access
    this._validator = validator;
  }
  
  // ... existing initialization code
}
```

### 2. Individual Layer Validation

Each layer can extend validation with specific requirements:

```javascript
// In MetallicShineLayer
getRequiredTextures() {
  return ['_Specular', '_Metallic', '_RoughnessSpec'];
}

getRequiredUniforms() {
  return ['time', 'alpha', 'intensity', 'metallicStrength', 'roughnessStrength'];
}

getRequiredManagers() {
  return ['resourceManager', 'coordinateManager'];
}
```

### 3. Runtime Validation

Add validation to animation loops:

```javascript
// In layer._onAnimate()
_onAnimate(deltaTime) {
  if (this._destroyed) return;
  
  // Runtime validation during development
  if (game.mapShine?.isDevelopmentMode && Math.random() < 0.001) { // 0.1% chance per frame
    this.validateRuntimeState();
  }
  
  // ... existing animation code
}

validateRuntimeState() {
  // Check for common runtime issues
  if (this.filter && this.filter.uniforms?.time === undefined) {
    console.warn(`${this.constructor.name}: Time uniform lost`);
  }
  
  if (this.textureMap && Object.keys(this.textureMap).length === 0) {
    console.warn(`${this.constructor.name}: No textures loaded`);
  }
}
```

---

## Error Reporting System

### Console Output Format

```javascript
reportResults() {
  const prefix = `Map Shine Validation [${this.effectName}]`;
  
  if (this.errors.length > 0) {
    console.group(`🚨 ${prefix} - ERRORS`);
    this.errors.forEach(error => console.error(error));
    console.groupEnd();
  }
  
  if (this.warnings.length > 0) {
    console.group(`⚠️ ${prefix} - WARNINGS`);
    this.warnings.forEach(warning => console.warn(warning));
    console.groupEnd();
  }
  
  if (this.validationPassed) {
    console.log(`✅ ${prefix} - Validation passed`);
  }
  
  // Store results for diagnostic system
  this.validationResults = {
    timestamp: new Date().toISOString(),
    effectName: this.effectName,
    passed: this.validationPassed,
    errors: this.errors,
    warnings: this.warnings
  };
}
```

### Validation Summary

Add a validation summary method to gather all effect results:

```javascript
// In DiagnosticsCollector
async getValidationSummary() {
  const allLayers = canvas.layers.filter(layer => layer._validator);
  
  return allLayers.map(layer => ({
    effectName: layer.constructor.name,
    enabled: layer.options?.config?.enabled,
    validationResults: layer._validator?.validationResults,
    runtimeErrors: layer._runtimeErrors || []
  }));
}
```

---

## Development Mode Detection

```javascript
// Add to MapShineLifecycle
isDevelopmentMode: true, // Set to false for production

// Or detect automatically
isDevelopmentMode: window.location.hostname === 'localhost' || 
                   game.settings.get('map-shine', 'developmentMode')
```

---

## Implementation Priority

### Phase 1: Core Validation (Day 1-2)
1. Create `EffectValidator` class
2. Add texture and shader validation
3. Integrate with `MaskedEffectLayer` base class
4. Add console error reporting

### Phase 2: Enhanced Validation (Day 3-4)
1. Add configuration and rendering pipeline validation
2. Implement dependency checking
3. Add runtime validation
4. Create validation summary system

### Phase 3: UI Integration (Day 5)
1. Add validation results to diagnostic report
2. Create validation status indicators
3. Add validation to "Report Problem" feature

---

## Expected Benefits

### Immediate Development Impact
- **Silent Failures Eliminated**: Every failure produces clear error messages
- **Faster Debugging**: Exact location and nature of problems identified
- **Better Code Quality**: Issues caught early during development
- **Documentation**: Validation serves as living documentation of requirements

### Long-term Benefits
- **User Support**: Clear error messages help users self-diagnose
- **Regression Prevention**: New features must pass validation
- **Quality Assurance**: Systematic checking reduces bugs in releases
- **Developer Onboarding**: New contributors understand requirements faster

---

## Configuration

### Enable/Disable Validation

```javascript
// In module settings
developmentMode: {
  name: "Development Mode",
  hint: "Enable comprehensive validation and error reporting",
  type: Boolean,
  default: true,
  scope: "client"
},

validationLevel: {
  name: "Validation Level",
  hint: "How thorough should validation be?",
  type: Select,
  choices: {
    basic: "Basic (Critical errors only)",
    standard: "Standard (Errors + warnings)",
    comprehensive: "Comprehensive (All checks)"
  },
  default: "standard",
  scope: "client"
}
```

---

This validation framework will transform your development experience by catching silent failures immediately and providing actionable error messages. It's the perfect foundation for the larger diagnostic system and will dramatically speed up your development workflow.
