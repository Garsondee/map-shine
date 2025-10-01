# Detailed Reorganization Plan for module.js

## Current Problems

1. **Section 2 is bloated** - Contains ProfileDataManager, ConfigBuilder, ResourceManager, LightMaskManager, NoiseFilter, AppearanceTransitionManager, DynamicExposureManager, PauseEffectManager, CombatEffectManager, OverheadEffectLayer, LoadingScreen, MapShineLifecycle, SystemStatusManager, MapPointsManager, GeometryMaskManager, PauseScreenManager, TextureAutoLoader, NoiseTextureManager, DynamicTokenMaskManager, CompositeMaskGenerator, and LightningManager - all in one section!

2. **Lightning is split** - LightningEffect, LightningManager, LightningOcclusionFilter are in Section 2, but LightningLayer is in Section 3 (Particles)

3. **Foam is in wrong place** - FoamFilter and FoamLayer are in Section 4 (Generic Filters) but should be with other effect layers

4. **Masking systems are scattered** - LightMaskManager, GeometryMaskManager, DynamicTokenMaskManager, BiofilmMaskFilter, TextureMaskShape, GeometryMaskShape are all in different sections

5. **Time-based effects awkwardly placed** - Section 5b feels like an afterthought

## Proposed New Structure

### **SECTION 0: MODULE SETUP & CONFIGURATION** _(Current: Lines 167-3382)_
✅ **Keep as-is** - Well organized
- Imports
- Constants (MODULE_ID, MAX_DELTA_TIME)
- Default configurations
- Presets
- Utility functions
- Global namespace

### **SECTION 1: CORE UTILITY CLASSES** _(Current: Lines 3382-4822 mixed with init)_
**MOVE HERE:**
- NativeAnimation (currently ~3187)
- FontLoader (currently ~3310)
- hexToNumber function (if exists as standalone)

### **SECTION 2: MODULE INITIALIZATION & LIFECYCLE** _(Current: Section 1, lines 3382-4822)_
**REORGANIZE FROM:**
- MapShineInitialiser ✅ (currently in Section 1)
- SettingsManager ✅ (currently in Section 1)
- LayerManager ✅ (currently in Section 1)
- HooksManager ✅ (currently in Section 1)
- MapShineLifecycle (currently in Section 2)
- SystemStatusManager (currently in Section 2)
- systemStatus instance
- LoadingScreen (currently in Section 2)

### **SECTION 3: PROFILE & CONFIGURATION MANAGEMENT** _(NEW)_
**MOVE HERE FROM Section 2 & Section 6:**
- ProfileDataManager (currently Section 2, ~4861)
- ConfigBuilder (currently Section 2, ~4975)
- CLIENT_OVERRIDES_CONFIG (currently Section 6, ~27003)
- ClientOverrides (currently Section 6, ~27135)
- AppearanceTransitionManager (currently Section 2, ~6047)

### **SECTION 4: RESOURCE & TEXTURE MANAGEMENT** _(NEW)_
**MOVE HERE FROM Section 2:**
- ResourceManager (currently Section 2, ~5156)
- TextureAutoLoader (currently Section 2, ~8936)
- NoiseTextureManager (currently Section 2, ~9111)
- CompositeMaskGenerator (currently Section 2, ~9381)

### **SECTION 5: MASKING SYSTEMS** _(NEW)_
**CONSOLIDATE FROM Sections 2, 3, 4:**
- LightMaskManager (currently Section 2, ~5694)
- NoiseFilter for light mask (currently Section 2, ~5988)
- GeometryMaskManager (currently Section 2, ~8441)
- DynamicTokenMaskManager (currently Section 2, ~9248)
- BiofilmMaskFilter (currently Section 4, ~17360)
- TextureMaskShape (currently Section 3, ~13348)
- GeometryMaskShape (currently Section 3, ~13567)

###  **SECTION 6: SCENE & GAMEPLAY EFFECT MANAGERS** _(NEW, from Section 2)_
**MOVE HERE FROM Section 2:**
- DynamicExposureManager (currently Section 2, ~6270)
- PauseEffectManager (currently Section 2, ~6502)
- CombatEffectManager (currently Section 2, ~6696)
- PauseScreenManager (currently Section 2, ~8663)

### **SECTION 7: LIGHTNING SYSTEM** _(NEW, consolidate from Section 2 & 3)_
**CONSOLIDATE:**
- LightningEffect (currently Section 2, ~9447)
- LightningManager (currently Section 2, ~9981)
- LightningOcclusionFilter (currently Section 2, ~10687)
- LightningLayer (currently Section 3, ~13904)

### **SECTION 8: PARTICLE SYSTEMS** _(Current Section 3, lines 10740-15131)_
**REORGANIZE:**
- PARTICLE_EFFECT_DEFINITIONS
- ParticleEffectController
- buildParticleEmitterConfig
- buildSparkEmitterConfig
- buildPressurisedSteamEmitterConfig
- buildSmellyFliesEmitterConfig
- ParticleManager
- FireWindManager
- ParticleLayer [export]
- SmellyFliesLayer [export]
- **Particle Behaviors:**
  - SparkPathBehavior
  - MapShineLightingBehavior
  - FireWindBehavior
  - PressurisedSteamBehavior
  - ColorFromSpawnBehavior
  - SmellyFliesBehavior

### **SECTION 9: GENERIC FILTERS & POST-PROCESSING** _(Current Section 4, lines 15131-18309)_
**REORGANIZE & REMOVE:**
- NoisePatternFilter ✅
- FilmGrainFilter ✅
- HeatDistortionNoiseFilter ✅
- ColorCorrectionFilter ✅
- LutUtils ✅
- ScreenEffectsManager ✅ [export]
- AmbientColorFilter ✅
- HeatDistortionFilter ✅
- VignetteFilter ✅
- LensDistortionFilter ✅
- ChromaticAberrationFilter ✅
- ParticleRgbSplitFilter ✅
- CloudSuppressorFilter ✅
- PrismFilter ✅
- WaveDisplacementFilter ✅
- **REMOVE:** FoamFilter (move to Section 10)
- **REMOVE:** FoamLayer (move to Section 10)
- **REMOVE:** BiofilmMaskFilter (move to Section 5 - Masking)

### **SECTION 10: EFFECT LAYERS & THEIR FILTERS** _(Current Section 5, lines 18309-25702)_
**ADD SUB-SECTIONS:**

#### 10.0 Base Layer Infrastructure
- BackgroundEffectTileLayer
- MaskedEffectLayer
- OverheadEffectLayer (move from Section 2, ~6919)

#### 10.1 Metallic Shine
- MetallicShineFilter
- MetallicStripePatternFilter
- MetallicShineLayer

#### 10.2 Cloud Shadows
- CloudShadowsFilter
- CloudShadowsLayer

#### 10.3 Canopy
- CanopyFilter
- CanopyLayer

#### 10.4 Structural Shadows
- StructuralFilter
- StructuralShadowsLayer

#### 10.5 Iridescence
- IridescenceFilter
- IridescenceLayer

#### 10.6 Ground Glow
- GroundGlowFilter
- GroundGlowLayer

#### 10.7 Heat Distortion
- HeatDistortionLayer

#### 10.8 Prism
- PrismLayer

#### 10.9 Water Effects
- WaterEffectsFilter
- WaterFXLayer

#### 10.10 Foam Effects
- FoamFilter (move from Section 4)
- FoamLayer (move from Section 4)

### **SECTION 11: TIME-BASED EFFECTS** _(Reorganize Section 5b, lines 25702-27003)_
**REORGANIZE WITH SUB-SECTIONS:**

#### 11.1 Building Shadows
- BuildingShadowsFilter
- BuildingShadowsLayer

#### 11.2 Time of Day System
- OverheadRecolorFilter
- TimeOfDayColorFilter
- TimeOfDayLayer
- MapShineClock
- DayNightClock

### **SECTION 12: MAP POINTS & DIAGNOSTICS** _(NEW, from Section 2 & 5)_
**CONSOLIDATE:**
- MapPointsManager (currently Section 2, ~8167)
- MapPointsLayer (currently Section 5, ~19082)
- MapPointsEditor (currently Section 5, ~19260)
- MapPointsInteractionManager (currently Section 5, ~19838)
- DiagnosticLayer (currently Section 5, ~18654)

### **SECTION 13: USER INTERFACE & EDITORS** _(Current Section 6, lines 26996-31750)_
**REORGANIZE WITH SUB-SECTIONS:**

#### 13.1 Curve Editor
- CurveEditor

#### 13.2 Material Editor & Debugger
- DebuggerUIBuilder
- _generateBehaviorListsFromGradient
- _generateEmissiveListFromGradient
- DebuggerEventHandler
- MaterialEditorDebugger
- globalThis.DebuggerUIBuilder

#### 13.3 Simple UI Panel
- SimpleUIPanel

#### 13.4 User Guide
- _MapShineGuideContent
- UserGuide

### **SECTION 14: GLOBAL HOOKS REGISTRATION** _(Current: End of file, lines 31750-31895)_
✅ **Keep as-is** - Well organized
- Hooks.on("getSceneControlButtons")
- Hooks.once("init")
- Hooks.once("ready")
- Hooks.on("updateScene")
- Hooks.on("canvasDraw")
- Hooks.on("renderSceneControls")

---

## Summary of Major Changes

1. **Split Section 2** into 6 focused sections (2, 3, 4, 5, 6, 7)
2. **Consolidate Lightning** - All lightning code together in Section 7
3. **Consolidate Masking** - All masking systems together in Section 5
4. **Move Foam** - From generic filters to effect layers (Section 10.10)
5. **Move BiofilmMaskFilter** - From filters to masking (Section 5)
6. **Consolidate Map Points** - All map points code together in Section 12
7. **Move OverheadEffectLayer** - From Section 2 to Section 10.0
8. **Improve Section 5b** - Rename to "Time-Based Effects" with better sub-sections
9. **Add sub-sections** - Throughout for better navigation
10. **Rename Section 1** - To "Core Utility Classes" and move init to Section 2

## Benefits

- **Clearer organization** - Related functionality grouped together
- **Easier navigation** - Logical progression through the codebase
- **Better maintainability** - Know exactly where to find/add code
- **Reduced cognitive load** - Each section has a clear, focused purpose
- **Future-proof** - Structure supports growth without confusion
