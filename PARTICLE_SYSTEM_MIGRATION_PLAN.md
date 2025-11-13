# Particle System Migration Plan

## Objective
Move all particle-related code from `module.js` to `scripts/effects/ParticleSystem.js`

## Items to Move

### Constants (1 item)
- `PARTICLE_EFFECT_DEFINITIONS` (line 11708-11808)

### Classes - Managers (2 items)  
- `ParticleManager` (line 15022-15112)
- `ParticleEffectController` (line 11810-14303)

### Classes - Behaviors (12 items)
- `SparkPathBehavior` (line 19164-19328)
- `CandleFlameBehavior` (line 19330-19377)
- `WindBehavior` (line 19565-19670)
- `ZDepthBehavior` (line 19674-19745)
- `VelocityStreakBehavior` (line 19752-19814)
- `GroundCollisionBehavior` (line 19820-19842)
- `DropletStreakBehavior` (line 19848-19907)
- `EdgePointsSpawnBehavior` (line 19913-19952)
- `PressurisedSteamBehavior` (line 19954-20069)
- `ColorFromSpawnBehavior` (line 20076-20105)
- `SmellyFliesBehavior` (line 20107-20701)
- `MapShineLightingBehavior` (line 19379-19563)

### Functions - Config Builders (5 items)
- `buildParticleEmitterConfig` (line 14334-14585)
- `buildSparkEmitterConfig` (line 14587-14769)
- `buildCandleFlameEmitterConfig` (line 14771-14864)
- `buildPressurisedSteamEmitterConfig` (line 14866-15020)
- `buildSmellyFliesEmitterConfig` (line 20703-20771)

### Functions - Helpers (2 items)
- `addBlendModeBehavior` (line 14307-14332)
- `_generateBehaviorListsFromGradient` (line 36594-36749)

## Required Imports for ParticleSystem.js
From module.js or globals:
- `hexToRgbArray` from utils/ColorUtils.js
- `CoordinateManager` (global via game.mapShine)
- `GeometryMaskShape` (from module.js)
- `ParticleRgbSplitFilter` (from module.js)
- `CloudSuppressorFilter` (from module.js)
- `BiofilmMaskFilter` (from module.js)
- `FireToneCurveFilter` (from module.js)
- `ColorCorrectionFilter` (from module.js)
- `BLEND_MODE_OPTIONS` (from config)
- `DebuggerUIBuilder` (from module.js)

## Files That Import From module.js (Need Updates)
1. `scripts/ui/UI.js` - imports `ParticleEffectController`, `PARTICLE_EFFECT_DEFINITIONS`
2. `scripts/managers/ProfileManager.js` - imports `ParticleLayer`

## Implementation Strategy
Given the size (~6000+ lines), I'll use a phased approach:

### Phase 1: Create ParticleSystem.js with core functionality
- File header and imports
- Helper functions
- PARTICLE_EFFECT_DEFINITIONS
- Export statement

### Phase 2: Add builder functions (via multi_edit)
- All 5 buildXXXEmitterConfig functions

### Phase 3: Add behavior classes (via multi_edit)
- All 12 behavior classes

### Phase 4: Add manager classes (via multi_edit)  
- ParticleEffectController
- ParticleManager

### Phase 5: Update imports
- Update module.js exports
- Update UI.js imports
- Update ProfileManager.js imports

## Estimated Time
2-3 hours for careful extraction and testing
