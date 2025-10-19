# Performance Mode Integration & Effect Management

## Overview
Comprehensive system to respect Foundry VTT's performance modes and provide progressive effect enablement based on system capabilities, scene requirements, and user preferences.

---

## Part 1: Foundry VTT Performance Mode Integration

### Understanding Foundry's Performance Modes

From `canvas/board.mjs` analysis:

```javascript
CONST.CANVAS_PERFORMANCE_MODES = {
  LOW: 0,    // Disables token animation, light animation
  MED: 1,    // Enables light soft edges, SMAA
  HIGH: 2,   // Standard quality (default)
  MAX: 3     // Uncapped FPS, maximum quality
}
```

**Access:** `game.settings.get("core", "performanceMode")` or `canvas.performance.mode`

**Foundry's Behavior by Mode:**
- **LOW**: No token animation, no light animation, basic rendering
- **MED**: Light soft edges enabled, SMAA anti-aliasing enabled
- **HIGH**: Full features, 60 FPS cap
- **MAX**: No FPS cap, all features at maximum quality

---

## Part 2: MapShine Effect Tiers

### Effect Classification by Performance Cost

#### 🟢 **Tier 0: Minimal Cost (Always Safe)**
*Single-pass shaders, minimal texture sampling*
- Time of Day Layer (color overlay)
- Vignette Filter (simple radial gradient)
- Basic Color Correction (no complex operations)
- Map Points UI Layer (DOM-based)

#### 🟡 **Tier 1: Low Cost (MED+)**
*Multi-pass shaders, moderate texture sampling*
- Iridescence (UV distortion + color shift)
- Ambient Layer (texture overlay + color filter)
- Ground Glow (simple light emission)
- Prism (RGB split, no blur)
- Heat Distortion (basic UV displacement)

#### 🟠 **Tier 2: Medium Cost (HIGH+)**
*Complex shaders, multiple render passes, particle systems*
- Metallic Shine (light mask + fresnel + environment sampling)
- Structural Shadows (ray marching + blur)
- Cloud Shadows (procedural noise + blur + occlusion)
- Canopy Layer (depth blending + light filtering)
- Dust Particles (500-1000 particles)
- Fire Particles (with basic masking)
- Biofilm Particles (geometry masking)

#### 🔴 **Tier 3: High Cost (MAX only)**
*Heavy post-processing, extensive render-to-texture, large particle counts*
- Bloom (kawase blur multi-pass)
- Screen Effects with Bloom enabled
- Water FX (reflection + refraction + caustics)
- Foam Layer (procedural generation + physics)
- Weather System (1000+ particles + shader effects)
- Physics Rope (physics simulation + mesh rendering)
- Building Shadows (large-scale ray casting + multi-pass blur)
- Cloud Depth Layer (parallax + multi-layer rendering)

---

## Part 3: Four-Tier Effect Management System

### Tier 1: Performance Mode Gate
**Priority:** HIGHEST  
**When:** Module initialization (`MapShineInitialiser.initialize()`)

```javascript
class PerformanceModeGate {
  static shouldInitializeMapShine() {
    const mode = game.settings.get("core", "performanceMode");
    
    // LOW mode: Complete graceful abort
    if (mode === CONST.CANVAS_PERFORMANCE_MODES.LOW) {
      console.log("Map Shine | LOW performance mode detected. Module will not initialize.");
      ui.notifications.info("Map Shine disabled due to LOW performance mode setting.");
      return false;
    }
    
    return true;
  }
  
  static getEnabledEffectTiers() {
    const mode = game.settings.get("core", "performanceMode");
    
    switch(mode) {
      case CONST.CANVAS_PERFORMANCE_MODES.LOW:
        return []; // No effects
      case CONST.CANVAS_PERFORMANCE_MODES.MED:
        return [0, 1]; // Minimal + Low cost
      case CONST.CANVAS_PERFORMANCE_MODES.HIGH:
        return [0, 1, 2]; // Up to Medium cost
      case CONST.CANVAS_PERFORMANCE_MODES.MAX:
        return [0, 1, 2, 3]; // All effects
      default:
        return [0, 1, 2]; // Default to HIGH behavior
    }
  }
}
```

**Implementation:**
- Check in `Hooks.once("init")` BEFORE any initialization
- If LOW mode: Skip all initialization, show notification, exit gracefully
- Store enabled tiers in `game.mapShine.enabledTiers`

---

### Tier 2: Scene Resource Gate
**Priority:** HIGH  
**When:** Effect target discovery (`beginPersistentDiscovery`)

```javascript
class SceneResourceGate {
  static checkEffectRequirements(effectName, config) {
    const targets = game.mapShine.effectTargetManager.targets;
    const requirements = EFFECT_REQUIREMENTS[effectName];
    
    if (!requirements) return true; // No requirements = always allowed
    
    // Check for required textures
    if (requirements.textures) {
      const hasRequiredTextures = requirements.textures.some(suffix => {
        return targets.background?.[suffix] || 
               Array.from(targets.tiles.values()).some(t => t[suffix]);
      });
      
      if (!hasRequiredTextures && !requirements.optional) {
        console.log(`Map Shine | ${effectName} disabled: No ${requirements.textures.join('/')} textures found`);
        return false;
      }
    }
    
    // Check for map points
    if (requirements.mapPoints) {
      const hasMapPoints = game.mapShine.mapPointsManager.hasPointsOfType(requirements.mapPoints);
      
      if (!hasMapPoints && !requirements.optional) {
        console.log(`Map Shine | ${effectName} disabled: No ${requirements.mapPoints} map points found`);
        return false;
      }
    }
    
    return true;
  }
}

const EFFECT_REQUIREMENTS = {
  baseShine: {
    textures: ['_Shine', '_NormalMap'],
    optional: false // MUST have these to enable
  },
  structuralShadows: {
    textures: ['_Structural'],
    optional: false
  },
  canopy: {
    textures: ['_Canopy'],
    optional: false
  },
  iridescence: {
    textures: ['_Iridescence'],
    optional: false
  },
  fire: {
    mapPoints: 'Fire',
    optional: false
  },
  physicsRope: {
    mapPoints: ['Rope', 'Chain'],
    optional: false
  },
  waterFX: {
    textures: ['_Water'],
    optional: false
  },
  foam: {
    textures: ['_Foam'],
    optional: false
  },
  // Effects with no requirements (always allowed if performance permits)
  cloudShadows: {},
  ambient: {},
  groundGlow: {},
  timeOfDay: {},
  prism: {},
  heatDistortion: {}
};
```

**Implementation:**
- Run after texture discovery completes
- For each effect, check if scene has required resources
- Force-disable effects that lack required resources
- Update `ProfileManager.activeConfig` to reflect forced disables
- Store forced-disable state separately from user preferences

---

### Tier 3: User Preference Override
**Priority:** MEDIUM  
**When:** User changes settings via Simple UI

```javascript
class UserPreferenceManager {
  /**
   * Get the effective enabled state for an effect
   * Respects performance mode, scene resources, and user overrides
   */
  static isEffectEnabled(effectName, config) {
    // Tier 1: Performance mode check
    const effectTier = EFFECT_PERFORMANCE_TIERS[effectName];
    const enabledTiers = PerformanceModeGate.getEnabledEffectTiers();
    if (!enabledTiers.includes(effectTier)) {
      return false; // Performance mode blocks this effect
    }
    
    // Tier 2: Scene resource check
    if (!SceneResourceGate.checkEffectRequirements(effectName, config)) {
      return false; // Scene lacks required resources
    }
    
    // Tier 3: User preference
    const userOverride = this.getUserOverride(effectName);
    if (userOverride !== null) {
      return userOverride; // User explicitly set preference
    }
    
    // Tier 4: Profile default
    return config[effectName]?.enabled ?? true;
  }
  
  /**
   * Get user's client-side override for an effect
   */
  static getUserOverride(effectName) {
    const overrides = game.settings.get(MODULE_ID, "client-effect-overrides");
    return overrides[effectName] ?? null;
  }
  
  /**
   * Set user's client-side override
   */
  static async setUserOverride(effectName, enabled) {
    const overrides = game.settings.get(MODULE_ID, "client-effect-overrides");
    overrides[effectName] = enabled;
    await game.settings.set(MODULE_ID, "client-effect-overrides", overrides);
    
    // Trigger system update
    await game.mapShine.profileManager.updateAllSystemsFromConfig();
  }
  
  /**
   * Get user's intensity override for an effect
   */
  static getIntensityOverride(effectName, defaultValue) {
    const overrides = game.settings.get(MODULE_ID, "client-intensity-overrides");
    return overrides[effectName] ?? defaultValue;
  }
  
  /**
   * Set user's intensity override
   */
  static async setIntensityOverride(effectName, intensity) {
    const overrides = game.settings.get(MODULE_ID, "client-intensity-overrides");
    overrides[effectName] = intensity;
    await game.settings.set(MODULE_ID, "client-intensity-overrides", overrides);
    
    // Trigger system update
    await game.mapShine.profileManager.updateAllSystemsFromConfig();
  }
}

// Register client-side settings for overrides
game.settings.register(MODULE_ID, "client-effect-overrides", {
  scope: "client",
  config: false, // Hidden setting, managed via UI
  type: Object,
  default: {}
});

game.settings.register(MODULE_ID, "client-intensity-overrides", {
  scope: "client",
  config: false,
  type: Object,
  default: {}
});
```

**Implementation:**
- Players see Simple UI with effect toggles and intensity sliders
- Toggles show: ✅ Enabled, ⏸️ Disabled by User, 🚫 Blocked (with reason)
- Intensity sliders only active when effect is enabled
- Changes saved to client-side Foundry settings
- Persists across sessions for that user

---

### Tier 4: Profile Default
**Priority:** LOWEST  
**When:** No overrides present

Standard behavior - use the profile's configured enable/disable state.

---

## Part 4: Effect Performance Tier Mapping

```javascript
const EFFECT_PERFORMANCE_TIERS = {
  // Tier 0: Minimal Cost (Always Safe)
  timeOfDay: 0,
  'postProcessing.vignette': 0,
  'postProcessing.colorCorrection': 0, // Basic only, no bloom
  mapPoints: 0,
  
  // Tier 1: Low Cost (MED+)
  iridescence: 1,
  ambient: 1,
  groundGlow: 1,
  prism: 1,
  heatDistortion: 1,
  
  // Tier 2: Medium Cost (HIGH+)
  baseShine: 2,
  structuralShadows: 2,
  cloudShadows: 2,
  canopy: 2,
  dust: 2,
  fire: 2,
  biofilm: 2,
  metallicGlints: 2,
  smellyFlies: 2,
  
  // Tier 3: High Cost (MAX only)
  'postProcessing.bloom': 3,
  waterFX: 3,
  foam: 3,
  weather: 3,
  physicsRope: 3,
  buildingShadows: 3,
  cloudDepth: 3
};
```

---

## Part 5: Simple UI Enhancements

### Performance Mode Selector

Add dropdown to Simple UI panel:

```javascript
<div class="mapshine-simple-control-group">
  <label>
    <strong>Performance Mode</strong>
    <select id="mapshine-performance-mode" ${game.user.isGM ? '' : 'disabled'}>
      <option value="0">LOW - Effects Disabled</option>
      <option value="1">MEDIUM - Essential Effects</option>
      <option value="2">HIGH - Full Effects</option>
      <option value="3">MAX - Maximum Quality</option>
    </select>
  </label>
  <p class="mapshine-simple-hint">
    Changing performance mode requires a page reload. Current: <strong>${modeName}</strong>
  </p>
</div>
```

**Event Handler:**
```javascript
html.find('#mapshine-performance-mode').on('change', async (event) => {
  const newMode = parseInt(event.target.value);
  const currentMode = game.settings.get("core", "performanceMode");
  
  if (newMode === currentMode) return;
  
  const modeNames = ['LOW', 'MEDIUM', 'HIGH', 'MAX'];
  const confirmed = await Dialog.confirm({
    title: "Change Performance Mode",
    content: `
      <p>Changing to <strong>${modeNames[newMode]}</strong> performance mode requires reloading Foundry VTT.</p>
      <p>Any unsaved changes will be lost. Continue?</p>
    `,
    yes: () => true,
    no: () => false
  });
  
  if (confirmed) {
    await game.settings.set("core", "performanceMode", newMode);
    window.location.reload();
  } else {
    // Revert dropdown to current value
    event.target.value = currentMode;
  }
});
```

### Effect Status Indicators

Enhance effect toggles to show WHY an effect is disabled:

```javascript
function renderEffectToggle(effectName, config) {
  const tier = EFFECT_PERFORMANCE_TIERS[effectName];
  const enabledTiers = PerformanceModeGate.getEnabledEffectTiers();
  const hasResources = SceneResourceGate.checkEffectRequirements(effectName, config);
  const userOverride = UserPreferenceManager.getUserOverride(effectName);
  const effectiveState = UserPreferenceManager.isEffectEnabled(effectName, config);
  
  let status, icon, tooltip, disabled;
  
  if (!enabledTiers.includes(tier)) {
    status = 'blocked-performance';
    icon = '⚙️';
    tooltip = `Blocked: Requires ${getTierName(tier)} performance mode or higher`;
    disabled = true;
  } else if (!hasResources) {
    status = 'blocked-resources';
    icon = '🗺️';
    tooltip = `Blocked: Scene missing required ${getRequirementDescription(effectName)}`;
    disabled = true;
  } else if (userOverride === false) {
    status = 'disabled-user';
    icon = '⏸️';
    tooltip = 'Disabled by you';
    disabled = false;
  } else if (effectiveState) {
    status = 'enabled';
    icon = '✅';
    tooltip = 'Enabled';
    disabled = false;
  } else {
    status = 'disabled';
    icon = '⏸️';
    tooltip = 'Disabled in profile';
    disabled = false;
  }
  
  return `
    <div class="mapshine-simple-effect-control ${status}">
      <label>
        <input type="checkbox" 
               data-effect="${effectName}" 
               ${effectiveState ? 'checked' : ''}
               ${disabled ? 'disabled' : ''}
               title="${tooltip}">
        <span class="effect-icon">${icon}</span>
        <span class="effect-name">${getEffectDisplayName(effectName)}</span>
      </label>
      ${disabled ? `<span class="block-reason">${tooltip}</span>` : ''}
    </div>
  `;
}
```

---

## Part 6: Implementation Checklist

### Phase 1: Core Infrastructure ✅
- [ ] Create `PerformanceModeGate` class
- [ ] Create `SceneResourceGate` class with `EFFECT_REQUIREMENTS` mapping
- [ ] Create `UserPreferenceManager` class
- [ ] Define `EFFECT_PERFORMANCE_TIERS` mapping
- [ ] Register client-side settings for overrides

### Phase 2: Integration Points
- [ ] Add performance mode check to `MapShineInitialiser.initialize()`
- [ ] Add LOW mode graceful abort with notification
- [ ] Add resource gate to `MapShineLifecycle.finalizeConfigurationAndUI()`
- [ ] Modify `ProfileManager.isEffectEnabled()` to use four-tier system
- [ ] Update `ProfileManager.updateAllSystemsFromConfig()` to respect gates

### Phase 3: Simple UI Enhancements
- [ ] Add performance mode dropdown (GM only)
- [ ] Add reload confirmation dialog
- [ ] Enhance effect toggles with status indicators
- [ ] Add intensity sliders for enabled effects
- [ ] Add "Reset to Defaults" button for user overrides
- [ ] Add "Why is this blocked?" tooltips

### Phase 4: System Manager Updates
- [ ] Update each layer/manager `updateFromConfig()` to check `isEffectEnabled()`
- [ ] Add early exit if effect is blocked/disabled
- [ ] Add console logging for blocked effects (once per scene load)
- [ ] Update particle managers to respect tier gates
- [ ] Update filter managers to respect tier gates

### Phase 5: User Documentation
- [ ] Add performance mode explanation to User Guide
- [ ] Document effect tier system
- [ ] Explain why effects might be blocked
- [ ] Provide optimization recommendations
- [ ] Add troubleshooting section

---

## Part 7: Issue #8 Integration (No-Canvas Mode)

Foundry VTT has a no-canvas mode for performance. Add this check:

```javascript
class PerformanceModeGate {
  static shouldInitializeMapShine() {
    // Check if canvas is disabled entirely
    if (game.settings.get("core", "noCanvas")) {
      console.log("Map Shine | No-canvas mode detected. Module will not initialize.");
      return false;
    }
    
    // Check performance mode
    const mode = game.settings.get("core", "performanceMode");
    if (mode === CONST.CANVAS_PERFORMANCE_MODES.LOW) {
      console.log("Map Shine | LOW performance mode detected. Module will not initialize.");
      ui.notifications.info("Map Shine disabled due to LOW performance mode setting.");
      return false;
    }
    
    return true;
  }
}
```

---

## Part 8: Diagnostic Logging

Add comprehensive logging for troubleshooting:

```javascript
class PerformanceDiagnostics {
  static logInitialization() {
    const mode = game.settings.get("core", "performanceMode");
    const modeNames = ['LOW', 'MED', 'HIGH', 'MAX'];
    const enabledTiers = PerformanceModeGate.getEnabledEffectTiers();
    
    console.group("Map Shine | Performance Mode Diagnostics");
    console.log(`Performance Mode: ${modeNames[mode]} (${mode})`);
    console.log(`Enabled Tiers: ${enabledTiers.join(', ')}`);
    console.log(`WebGL Max Texture Size: ${canvas.app.renderer.context.gl.getParameter(
      canvas.app.renderer.context.gl.MAX_TEXTURE_SIZE
    )}`);
    console.groupEnd();
  }
  
  static logEffectStatus(effectName, status) {
    const reasons = [];
    if (status.blockedByPerformance) reasons.push('Performance mode too low');
    if (status.blockedByResources) reasons.push('Missing required textures/map points');
    if (status.disabledByUser) reasons.push('User preference');
    if (status.disabledByProfile) reasons.push('Profile setting');
    
    if (reasons.length > 0) {
      console.log(`Map Shine | ${effectName}: DISABLED (${reasons.join(', ')})`);
    } else {
      console.log(`Map Shine | ${effectName}: ENABLED`);
    }
  }
}
```

---

## Success Criteria

### Core Functionality
- ✅ MapShine never initializes on LOW performance mode
- ✅ Effects are automatically gated by performance tier
- ✅ Effects are automatically disabled when scene lacks required resources
- ✅ Players can override effect enablement (saved per-client)
- ✅ Players can adjust effect intensity (saved per-client)
- ✅ Performance mode can be changed via Simple UI
- ✅ Changing performance mode prompts for reload

### User Experience
- ✅ Clear visual indicators for why effects are disabled
- ✅ No confusing "this toggle doesn't work" situations
- ✅ Helpful tooltips explain requirements
- ✅ GM sees full control, players see appropriate subset
- ✅ Settings persist across sessions
- ✅ No unexpected performance hits

### Technical Quality
- ✅ Zero performance overhead for disabled effects
- ✅ Graceful degradation at all tiers
- ✅ Clear diagnostic logging for troubleshooting
- ✅ Proper cleanup of disabled effects
- ✅ No memory leaks from unused systems

---

## Future Enhancements

### Advanced Features
- Dynamic tier adjustment based on measured FPS
- Per-effect performance profiling
- Automatic quality reduction when FPS drops
- Scene-specific performance profiles
- "Optimize this scene" wizard

### Quality of Life
- Performance mode presets (Potato, Balanced, Quality, Ultra)
- One-click "Optimize for my system" button
- Visual performance meter in Simple UI
- Effect preview before enabling expensive effects
- Bulk enable/disable by category
