# Map Shine Module.js Refactoring Progress

**Goal:** Break down the monolithic `module.js` (46,735 lines) into a modular, maintainable file structure.

**Started:** 2025-01-04  
**Status:** In Progress

---

## Phase 1: Configuration, Constants, and Utilities ✅ COMPLETE

Self-contained code with minimal dependencies. Easy extraction with primarily import statement updates.

### 1.1 Filter Corruption Protection Utilities ✅ COMPLETE
- **Target:** `scripts/utils/filter-utils.js`
- **Extracted:** `validateFilter()`, `safeCreateFilter()`, `cleanFilterArray()`, `safeApplyFilters()`
- **Status:** Complete

### 1.2 NativeAnimation Utility ✅ COMPLETE
- **Target:** `scripts/utils/NativeAnimation.js`
- **Extracted:** `NativeAnimation` class with GSAP-like animation functionality
- **Status:** Complete

### 1.3 FontLoader Utility ✅ COMPLETE
- **Target:** `scripts/utils/FontLoader.js`
- **Extracted:** `FontLoader` class for Google Fonts loading
- **Status:** Complete

### 1.4 MODULE_DEFAULTS Object ✅ COMPLETE
- **Target:** `scripts/config/module-defaults.js`
- **Lines:** ~343-2450 (estimated)
- **Dependencies:** None (pure configuration object)
- **Imports needed:** Will be imported by ProfileManager and other config consumers
- **Status:** Complete

---

## Phase 2: Core Systems and Managers ⏳ PENDING

Classes managing lifecycle, settings, and shared resources.

### 2.1 Module Initialization & Lifecycle Classes

#### 2.1.1 MapShineInitialiser ⏳ PENDING
- **Target:** `scripts/core/MapShineInitialiser.js`
- **Lines:** 2694-2843 (+ global namespace init)
- **Dependencies:** SettingsManager, LayerManager, HooksManager, all managers
- **Status:** Not started

#### 2.1.2 SettingsManager ⏳ PENDING
- **Target:** `scripts/core/SettingsManager.js`
- **Lines:** TBD (search needed)
- **Dependencies:** MODULE_DEFAULTS, MODULE_ID
- **Status:** Not started

#### 2.1.3 LayerManager ⏳ PENDING
- **Target:** `scripts/core/LayerManager.js`
- **Lines:** TBD (search needed)
- **Dependencies:** All layer classes
- **Status:** Not started

#### 2.1.4 HooksManager ⏳ PENDING
- **Target:** `scripts/core/HooksManager.js`
- **Lines:** TBD (search needed)
- **Dependencies:** Various managers and systems
- **Status:** Not started

### 2.2 Major Manager Classes

Each manager gets its own file in `scripts/managers/`:

- [ ] SceneChangeManager.js
- [ ] ProfileDataManager.js (may already exist - verify)
- [ ] ConfigBuilder.js
- [ ] ResourceManager.js
- [ ] LightMaskManager.js
- [ ] GeometryMaskManager.js
- [ ] DynamicTokenMaskManager.js
- [ ] TokenManager.js
- [ ] PauseEffectManager.js
- [ ] CombatEffectManager.js
- [ ] DynamicExposureManager.js
- [ ] ScreenEffectsManager.js
- [ ] WeatherSystemManager.js
- [ ] WindManager.js
- [ ] CoordinateManager.js
- [ ] EffectTargetManager.js
- [ ] MapPointsManager.js
- [ ] MapPointsInteractionManager.js

**Status:** Not started - requires detailed mapping

---

## Phase 3: Canvas Layers and PIXI Filters ⏳ PENDING

Largest group - will provide most significant file size reduction.

### 3.1 Base Layer Classes (Priority)

These must be extracted first as other layers depend on them:

- [ ] `scripts/layers/base/MaskedEffectLayer.js` (Already have AnimatedCanvasLayer)

### 3.2 Canvas Layer Classes

Move to `scripts/layers/`:

**MaskedEffectLayer Extensions:**
- [ ] CloudShadowsLayer.js
- [ ] CanopyLayer.js
- [ ] StructuralShadowsLayer.js
- [ ] IridescenceLayer.js
- [ ] PrismLayer.js
- [ ] WaterEffectLayer.js (WaterFXLayer)
- [ ] BuildingShadowsLayer.js
- [ ] TimeOfDayLayer.js

**Direct Layer Extensions:**
- [ ] MetallicShineLayer.js
- [ ] GroundGlowLayer.js
- [ ] OverheadEffectLayer.js
- [ ] FoamLayer.js
- [ ] HeatDistortionLayer.js
- [ ] ParticleLayer.js
- [ ] SmellyFliesLayer.js
- [ ] LightningLayer.js
- [ ] CloudDepthLayer.js
- [ ] DiagnosticLayer.js
- [ ] BackgroundEffectTileLayer.js
- [ ] PhysicsRopeLayer.js
- [ ] MapPointsLayer.js
- [ ] AmbientLayer.js

**Weather Layers:**
- [ ] WeatherEffectLayer.js (may already exist - verify)

**Status:** Not started - requires comprehensive mapping

### 3.3 PIXI Filter Classes

Move to `scripts/filters/`:

**Identified Filters:**
- [ ] CloudShadowsFilter.js
- [ ] CanopyFilter.js
- [ ] StructuralFilter.js
- [ ] IridescenceFilter.js
- [ ] PrismFilter.js
- [ ] WaveDisplacementFilter.js
- [ ] MetallicShineFilter.js
- [ ] ColorCorrectionFilter.js
- [ ] GroundGlowFilter.js
- [ ] HeatDistortionFilter.js
- [ ] GrainFilter.js
- [ ] MotionBlurFilter.js
- [ ] RGBSplitFilter.js
- [ ] (And many more - requires full inventory)

**Status:** Not started - requires comprehensive mapping

---

## Migration Strategy

### Step-by-Step Process

1. **Create new file** with proper JSDoc header
2. **Copy code** from module.js
3. **Add necessary imports** at top of new file
4. **Export** the class/function/constant
5. **Update module.js** to import from new location
6. **Test** to ensure no breakage
7. **Remove old code** from module.js
8. **Update this progress doc**

### Import Pattern

```javascript
// New file structure
import { MODULE_ID } from '../config/constants.js';
import { validateFilter } from '../utils/filter-utils.js';
import { NativeAnimation } from '../utils/NativeAnimation.js';

export class MyClass {
  // ...
}
```

### Testing Checklist

After each extraction:
- [ ] Module loads without errors
- [ ] No missing import errors in console
- [ ] Visual effects still work
- [ ] UI still renders
- [ ] Scene transitions work

---

## Files Already Extracted ✅

These files already exist and don't need extraction:

- ✅ `scripts/config/constants.js` (MODULE_ID, MAX_DELTA_TIME, TEMP_CLIPBOARD_STORAGE)
- ✅ `scripts/layers/AnimatedCanvasLayer.js` (AnimatedCanvasLayer, ResizableAnimatedCanvasLayer)
- ✅ `scripts/managers/ProfileManager.js` (ProfileManager - but imports from module.js)
- ✅ `scripts/utils/RenderTexturePool.js`
- ✅ `scripts/utils/TextureLoader.js`
- ✅ `scripts/weather/` (Complete weather shader system)

---

## Estimated Impact

**Current:** `module.js` = 46,735 lines

**After Phase 1:** ~44,000 lines (5.8% reduction)  
**After Phase 2:** ~35,000 lines (25% reduction)  
**After Phase 3:** ~5,000-8,000 lines (80-85% reduction)

**Final module.js should contain:**
- Main initialization entry point
- Foundry hooks registration
- Minimal glue code

---

## Notes & Decisions

### Import Path Conventions
- Use relative imports (e.g., `../config/constants.js`)
- Maintain existing directory structure where present
- Create new directories as needed (core/, filters/)

### File Naming
- Classes: PascalCase matching class name (e.g., `NativeAnimation.js`)
- Utilities: kebab-case for multi-function files (e.g., `filter-utils.js`)
- Config: kebab-case (e.g., `module-defaults.js`)

### Breaking Changes
- None expected - this is pure refactoring
- All exports maintain same API
- Imports updated but functionality unchanged

---

## Current Session Goals

**Session 1 (2025-01-04):**
- [x] Create this tracking document
- [ ] Complete Phase 1.2: Extract filter utilities
- [ ] Complete Phase 1.3: Extract NativeAnimation
- [ ] Complete Phase 1.4: Extract FontLoader
- [ ] Test all Phase 1 extractions
- [ ] Begin Phase 1.1: Map MODULE_DEFAULTS structure

---

## Questions & Blockers

None currently.

---

**Last Updated:** 2025-01-04 13:58 UTC
