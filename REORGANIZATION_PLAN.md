# Module.js Reorganization Plan

## Overview
This document maps the reorganization of module.js into logical sections.
Each class/component is listed with its current approximate line number and its target section.

---

## NEW STRUCTURE

### SECTION 0: MODULE PREAMBLE & CONFIGURATION
**Lines: 1-3400 (approx)**
- File header & documentation (1-31)
- Imports (33-38)
- UNIFIED LIGHT MASKING SYSTEM documentation (40-165)
- MODULE_ID constant (178)
- MAX_DELTA_TIME constant (186)
- UNIVERSAL_EFFECT_DEFAULTS (199-332)
- PROFILES_SETTING, DEFAULT_PROFILE_SETTING (339, 346)
- BLEND_MODE_OPTIONS (367-381)
- globalThis.BLEND_MODE_OPTIONS (384)
- FONT_CHOICES (399-484)
- GRADIENT_PRESETS (498-575)
- LUT_PRESETS (577-590)
- EFFECT_SOURCE_OPTIONS (592-605)
- COLOR_CORRECTION_PRESETS (607-1762)
- MODULE_DEFAULTS (1764-3182)
- game.mapShine = game.mapShine || {} (before NativeAnimation)
- hexToNumber function (before NativeAnimation)

### SECTION 1: CORE UTILITY CLASSES
**Lines: 3200-3400**
- NativeAnimation class (3187-3308)
- FontLoader class (3310-3401)

### SECTION 2: MODULE INITIALIZATION & LIFECYCLE  
**Lines: 3400-8950**
- MapShineInitialiser class (3406-3767)
- SettingsManager class (3772-4224)
- LayerManager class (4229-4371)
- HooksManager class (4376-4856)
- MapShineLifecycle class (7631-7984)
- SystemStatusManager class (7986-8162)
- const systemStatus = new SystemStatusManager() (8934)
- LoadingScreen class (7224-7628)

### SECTION 3: PROFILE & CONFIGURATION MANAGEMENT
**Lines: 8950-5100**
- CLIENT_OVERRIDES_CONFIG const (27040-27132)
- ClientOverrides class (27135-27189)
- ProfileDataManager class (4861-4972) [export]
- ConfigBuilder class (4975-5153) [export]

### SECTION 4: RESOURCE & TEXTURE MANAGEMENT
**Lines: 5100-9450**
- ResourceManager class (5156-5691)
- TextureAutoLoader class (8936-9109)
- NoiseTextureManager class (9111-9246)
- CompositeMaskGenerator class (9381-9445)

### SECTION 5: MASKING SYSTEMS
**Lines: 9450-13570**
- LightMaskManager class (5694-5985)
- NoiseFilter class (for light mask) (5988-6045)
- GeometryMaskManager class (8441-8660)
- DynamicTokenMaskManager class (9248-9379)
- BiofilmMaskFilter class (17360-17406)
- TextureMaskShape class (13348-13565)
- GeometryMaskShape class (13567-13901)

### SECTION 6: SCENE & APPEARANCE MANAGEMENT
**Lines: 13570-8950**
- AppearanceTransitionManager class (6047-6268)
- PauseEffectManager class (6502-6694)
- CombatEffectManager class (6696-6917)
- PauseScreenManager class (8663-8933)
- DynamicExposureManager class (6270-6500)

### SECTION 7: LIGHTNING SYSTEM
**Lines: 13570-13905**
- LightningEffect class (9447-9979)
- LightningManager class (9981-10685)
- LightningOcclusionFilter class (10687-10840)
- LightningLayer class (13904-13939)

### SECTION 8: PARTICLE SYSTEMS
**Lines: 13905-15140**
- PARTICLE_EFFECT_DEFINITIONS const (10845-10935)
- ParticleEffectController class (10938-13163)
- buildParticleEmitterConfig function (around 13165)
- buildSparkEmitterConfig function (around 13200)
- buildPressurisedSteamEmitterConfig function (around 13220)
- buildSmellyFliesEmitterConfig function (14643-15034)
- ParticleManager class (13165-13240)
- FireWindManager class (13242-13346)
- ParticleLayer class (13735-13903) [export]
- SmellyFliesLayer class (15037-15130) [export]
- FoamFilter class (17408-17756)
- FoamLayer class (17758-18313)
- **Particle Behaviors:**
  - SparkPathBehavior class (13941-14105)
  - MapShineLightingBehavior class (14107-14163)
  - FireWindBehavior class (14165-14223)
  - PressurisedSteamBehavior class (14225-14344)
  - ColorFromSpawnBehavior class (14347-14376)
  - SmellyFliesBehavior class (14378-14641)

### SECTION 9: GENERIC FILTERS (POST-PROCESSING)
**Lines: 15140-17800**
- NoisePatternFilter class (15138-15239)
- FilmGrainFilter class (15242-15360)
- HeatDistortionNoiseFilter class (15362-15509)
- ColorCorrectionFilter class (15511-16950)
- LutUtils class (15748-15857)
- ScreenEffectsManager class (15860-16950) [export]
- AmbientColorFilter class (16952-17041)
- HeatDistortionFilter class (17043-17079)
- VignetteFilter class (17081-17116)
- LensDistortionFilter class (17118-17151)
- ChromaticAberrationFilter class (17153-17188)
- ParticleRgbSplitFilter class (17190-17224)
- CloudSuppressorFilter class (17226-17279)
- PrismFilter class (17281-17358)
- WaveDisplacementFilter class (25564-25707)

### SECTION 10: EFFECT LAYERS & THEIR FILTERS

#### 10.1 Base Layer Infrastructure
**Lines: 18300-18920**
- BackgroundEffectTileLayer class (18316-18413)
- MaskedEffectLayer class (18415-18652)
- OverheadEffectLayer class (6919-7222)

#### 10.2 Metallic Shine
**Lines: 18920-20900**
- MetallicShineFilter class (20015-20200)
- MetallicStripePatternFilter class (20202-20315)
- MetallicShineLayer class (20317-20898)

#### 10.3 Cloud Shadows
**Lines: 20900-21460**
- CloudShadowsFilter class (20900-21060)
- CloudShadowsLayer class (21062-21456)

#### 10.4 Canopy
**Lines: 21460-21860**
- CanopyFilter class (21558-21638)
- CanopyLayer class (21458-21556)

#### 10.5 Structural Shadows
**Lines: 21860-22320**
- StructuralFilter class (21641-21854)
- StructuralShadowsLayer class (21857-22103)

#### 10.6 Iridescence
**Lines: 22320-22740**
- IridescenceFilter class (22105-22322)
- IridescenceLayer class (22324-22738)

#### 10.7 Ground Glow
**Lines: 22740-23140**
- GroundGlowFilter class (23011-23137)
- GroundGlowLayer class (22741-23009)

#### 10.8 Heat Distortion
**Lines: 23140-23545**
- HeatDistortionLayer class (23139-23543)

#### 10.9 Prism
**Lines: 23545-23782**
- PrismLayer class (23545-23780)

#### 10.10 Water Effects
**Lines: 23782-25710**
- WaterEffectsFilter class (23782-24270)
- WaterFXLayer class (24272-25562)

#### 10.11 Building Shadows (Time-Based)
**Lines: 25710-26035**
- BuildingShadowsFilter class (25710-25803)
- BuildingShadowsLayer class (25805-26032)

#### 10.12 Time of Day (Time-Based)
**Lines: 26035-27040**
- OverheadRecolorFilter class (26034-26124)
- TimeOfDayColorFilter class (26595-26736)
- TimeOfDayLayer class (26738-27038)
- MapShineClock class (26126-26551)
- DayNightClock class (26553-26593)

### SECTION 11: MAP POINTS & DIAGNOSTICS
**Lines: 27040-20015**
- MapPointsManager class (8167-8439)
- MapPointsLayer class (19082-19257)
- MapPointsEditor class (19260-19836)
- MapPointsInteractionManager class (19838-20012)
- DiagnosticLayer class (18654-19080)

### SECTION 12: USER INTERFACE & EDITORS
**Lines: 20015-31750**
- CurveEditor class (27191-27394)
- DebuggerUIBuilder class (27396-28898)
- _generateBehaviorListsFromGradient function (28898)
- _generateEmissiveListFromGradient function (28898)
- DebuggerEventHandler class (28901-31288)
- MaterialEditorDebugger class (31290-31489)
- SimpleUIPanel class (31492-31713)
- _MapShineGuideContent class (31715)
- UserGuide class (31715-31748)
- globalThis.DebuggerUIBuilder assignment

### SECTION 13: GLOBAL HOOKS REGISTRATION
**Lines: 31750-31895**
- Hooks.on("getSceneControlButtons")
- Hooks.once("init")
- Hooks.once("ready")
- Hooks.on("updateScene")
- Hooks.on("canvasDraw")
- Hooks.on("renderSceneControls")

---

## NOTES
- All imports remain at the top
- Exports remain on their respective classes
- No functionality changes
- Only reorganization for logical grouping
- Section comment blocks will be updated/created
