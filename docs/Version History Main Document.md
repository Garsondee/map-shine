Version: 1.2.1

**FEATURE - Rain Ripple Water Effects System**

Implemented automatic rain ripple effects for water surfaces during rain/storm weather events. Rain ripples are now additive to base wave distortion and automatically transition smoothly when weather state changes.

**Implementation:**
1. **WeatherSystemManager Integration** (Lines 15177-15247)
   - Added `_applyRainRipples()` method called every frame during weather updates
   - Calculates rain intensity based on weather state (drizzle: 0.3×, rain: 1.0×, storm: 1.8×, sleet: 0.6×)
   - Smooth interpolation during weather transitions using `transitionProgress`
   - Stores original wave parameters for baseline calculations

2. **Additive Wave Distortion**
   - Rain ripples ADD to base wave intensity instead of replacing it
   - Speed: Blends between base and rain speed (faster during rain)
   - Scale: Blends between base and rain scale (smaller, more chaotic ripples)
   - Intensity: `baseWaveIntensity + (rainRippleIntensity × rainIntensity)` - always additive!

3. **Outdoor-Only Masking** (Shader Lines 30393-30401)
   - Samples `_Outdoors` mask texture in fragment shader
   - Multiplies wave distortion by outdoor mask value
   - Indoor water (mask=0) remains calm
   - Outdoor water (mask=1) receives full rain ripple effects

4. **UI Controls** (Lines 30862-30895)
   - New "Rain Ripples (Weather)" accordion under Wave Distortion section
   - Speed slider (0-25): Animation speed during rain
   - Scale slider (0.1-40): Ripple frequency/size
   - Intensity slider (0-0.05): Distortion strength
   - Enable toggle: Turn system on/off

**Technical Details:**
- Transition logic: `_getTargetRainIntensity()` provides smooth state changes
- WaterFXLayer integration: Uses `_rainRippleIntensity` property (lines 31800-31806)
- Parameter storage: `waterLayer._originalWaveParams` preserves base config
- Linear interpolation: `_lerp()` utility for smooth blending

**Benefits:**
- ✅ Automatic weather integration - no manual control needed
- ✅ Smooth transitions - rain ripples fade in/out naturally
- ✅ Additive approach - base wave always present
- ✅ Outdoor-only - indoor water unaffected by weather
- ✅ Configurable - UI controls for customization
- ✅ State-aware - different intensities for drizzle/rain/storm

**Files Modified:**
- `scripts/module.js` (WeatherSystemManager, WaterEffectsFilter shader, WaterFXLayer, UI builder)
- `docs/RAIN_RIPPLE_SYSTEM.md` (comprehensive documentation)

---

**BUG FIX - Particle Appearance Gradient Editors Non-Functional**

Fixed critical bug where all gradient editor controls ("Color & Alpha Over Life" and "Emissive Colour Over Life") in Particle Appearance sections were completely non-functional.

**Root Cause:**
Gradient editor event listeners were created and bound but never attached to the DOM. The `addEventListeners()` method only set up delegation for input, change, click, and toggle events, completely omitting the mousedown, contextmenu, and dblclick events required for gradient interaction.

**Fix Applied:**
Added three missing event listeners to `addEventListeners()` method (lines 38452-38469):
1. **mousedown** on `.gradient-stop` - Allows users to select gradient stops and display color/alpha controls
2. **contextmenu** on `.gradient-stop` - Allows users to right-click to delete gradient stops  
3. **dblclick** on `.gradient-bar-container` - Allows users to double-click to add new gradient stops

**Affected Systems:**
- Sparks particles (Color & Alpha, Emissive Brightness)
- Fire particles (Color & Alpha, Emissive)
- Candle particles (Color & Alpha, Emissive)
- Steam particles (Color & Alpha, Emissive Brightness)
- All other particle effects using gradient editors

**Result:**
Users can now properly interact with gradient editors to customize particle appearance over their lifetime. Controls become visible when clicking on gradient stops, colors/brightness can be edited, and new stops can be added or removed.

**File Modified:**
- `scripts/module.js` (DebuggerEventHandler.addEventListeners method)

---

Version: 1.2.0

**FEATURE - Foundry World Time Synchronization for Day/Night Clock**

Implemented automatic synchronization between Foundry VTT's world time and Map Shine's Day/Night Clock component.

**Implementation:**
1. Added `syncFromFoundryTime` boolean configuration to `timeOfDay` profile settings
   - Defaults to false (manual mode)
   - Persists per profile via ProfileManager

2. Clock Component Enhancements:
   - Registered `updateWorldTime` hook listener for automatic time sync
   - Converts Foundry's `game.time.worldTime` (seconds) to 0-24 hour format
   - One-way sync: Foundry → MapShine (prevents feedback loops)
   - Hook properly unregistered in `destroy()` to prevent memory leaks

3. UI Mode Toggle:
   - Button displays current mode: "✋ Manual" or "🔗 Foundry Time"
   - Automatically syncs time when switching to Foundry mode
   - Disables manual controls (+/- buttons, time input) when in Foundry mode
   - Mode preference saved to profile configuration

4. Time Conversion Logic:
   - Formula: `(worldTime % 86400) / 3600` = hours (0-24)
   - Handles day rollover automatically via modulo operation
   - Updates immediately when Foundry time advances

**Technical Details:**
- Hook listener bound method: `_onFoundryTimeUpdateBound`
- Sync flag `fromHook: true` prevents circular updates
- Proper lifecycle management in `activateListeners()` and `destroy()`
- UI state updates handled by `updateUIState()` method

**Benefits:**
- Seamless integration with Foundry's time management systems
- GMs can use Foundry's native time controls to drive lighting effects
- Compatible with Simple Calendar and other time modules
- No performance overhead when in manual mode
- Profile-based persistence ensures consistent behavior per scene

**Files Modified:**
- `scripts/config/default-profile-config.js` (added syncFromFoundryTime setting)
- `scripts/module.js` (MapShineClock class, lines 32795-32983)

---

Version: 1.1.99

**BUG FIX - Scene Transition Texture Error**

Fixed critical error occurring during scene transitions: `TypeError: can't access property "source", this.texture.baseTexture.resource is null`

**Root Cause:**
TextureLoader was destroying original baseTextures loaded by Foundry after downsampling them. However, Foundry's PlaceableObjects (Tiles, Tokens, etc.) still held direct references to these baseTextures. When Foundry tried to teardown these objects during scene transitions, it attempted to check if textures were videos by accessing `baseTexture.resource.source`, but the resource had been nullified by our premature destruction.

**Solution:**
- TextureLoader now only destroys the Texture wrapper, NOT the underlying baseTexture
- Original baseTextures loaded by Foundry are left intact for Foundry to manage
- Only Map Shine-created RenderTextures (downsampled versions) are destroyed during cache clearing
- Added defensive error handling in ScreenEffectsManager.tearDown() for filter cleanup

**Files Modified:**
- `scripts/utils/TextureLoader.js` (lines 118-128: removed baseTexture destruction)
- `scripts/module.js` (lines 21000-21017: added error handling in ScreenEffectsManager.tearDown)

**Impact:**
- Eliminates scene transition crashes when using downsampled effect textures
- Proper resource ownership: Foundry manages its textures, Map Shine manages its RenderTextures
- No VRAM leak - Foundry's own TTL system will evict unused baseTextures

---

Version: 1.1.98

**CODE CLEANUP - Low-Hanging Fruit Optimization**

Completed "Operation Low Hanging Fruit" - targeted cleanup of testing code, outdated comments, and performance optimizations.

**Changes Implemented:**
1. **Weather Gating Re-enabled** (Performance Optimization)
   - Edge droplet controller now properly gates execution to rain states only
   - Previously ran continuously during testing with bypass flag
   - Now only updates during drizzle, rain, and storm weather states
   - Added `_updateEdgeDroplets()` method with state checking logic
   - Performance benefit: Eliminates unnecessary particle updates during clear/snow/blizzard

2. **Outdated Comment Cleanup**
   - Removed TODO comment about re-enabling AmbientLayer import
   - Dependencies were already resolved, comment was misleading

**Files Modified:**
- scripts/module.js (lines 15609-15621: added _updateEdgeDroplets method)

**Impact:**
- Better performance during non-rain weather states
- Cleaner codebase with no misleading comments
- Follows established pattern of weather-gated particle systems

---

Version: 1.1.97

**BUG FIX - Bush & Tree Slider Disconnection**

Fixed critical issue where all UI sliders for _Bush and _Tree foliage distortion effects were completely non-functional. Users could adjust sliders but the visual effects on tiles remained unchanged.

**Root Causes Identified:**
1. BushLayer and TreeLayer missing from ProfileManager's CONFIG_SYSTEM_MAP
2. updateFromConfig() methods only rescanned for tiles but didn't update existing filter uniforms
3. Existing filters retained their initial values indefinitely

**Implementation:**
1. Added bush and tree to CONFIG_SYSTEM_MAP in ProfileManager.js (lines 22-23)
   - Enables proper routing of configuration updates to layer systems
2. Enhanced BushLayer.updateFromConfig() (lines 27772-27797)
   - Now updates all 10 shader uniforms on existing filters
   - Rustle layer: scale, speed, frequency, intensity
   - Sway layer: scale, speed, frequency, intensity, wind multiplier
   - Mixing: perpendicular mix
3. Enhanced TreeLayer.updateFromConfig() (lines 27961-27986)
   - Same uniform update pattern for tree-specific parameters

**Result:**
- ✅ All 10 bush sliders now immediately responsive
- ✅ All 10 tree sliders now immediately responsive  
- ✅ No scene reload required for changes to take effect
- ✅ Matches expected behavior of all other Map Shine UI controls

**Documentation:**
Created BUSH_TREE_SLIDER_FIX.md with detailed analysis and testing instructions.

---

Version: 1.1.96

**FEATURE - Overhead Building Shadows**

Implemented building shadow casting onto overhead tiles (roofs, tree canopies) by extending the OverheadRecolorFilter shader to sample shadow data from BuildingShadowsLayer.

**Implementation:**
1. Extended OverheadRecolorFilter shader with shadow sampling uniforms:
   - `uBuildingShadowsEnabled`: Toggle for shadow feature
   - `uBuildingShadowMask`: Blurred outdoors mask from BuildingShadowsLayer
   - `uShadowOffset`: Shadow direction vector from sun position
   - `uShadowIntensity`: Configurable shadow darkness (default: 0.6)
   - `uTexelSize` & `uCanvasScale`: For coordinate transformation

2. Shader Logic:
   - Transforms screen coordinates to world space
   - Applies shadow offset to sample shadow mask at displaced position
   - Multiplies final color by (1.0 - shadow_value * intensity) for darkening
   - Only applies to outdoor overhead tiles (via outdoors mask)

3. Animation Loop Integration:
   - OverheadEffectLayer._onAnimate() passes shadow data from BuildingShadowsLayer
   - Reuses existing blurred shadow mask - no additional render passes
   - Checks `oeConfig.buildingShadows.enabled` flag for conditional activation

4. Configuration & UI:
   - Added `buildingShadows` section to MODULE_DEFAULTS.overheadEffect
   - New debugger panel controls under "Recoloration" accordion:
     * Toggle checkbox: "Apply Building Shadows"
     * Intensity slider: 0.0 - 1.0 (controls shadow darkness)
   - Descriptive tooltip explaining outdoor-only behavior

**Benefits:**
- Visually unifies building shadows across all scene layers
- Zero performance cost when disabled
- Minimal overhead when enabled (reuses existing shadow mask)
- Complements Time of Day strength feature for cohesive outdoor lighting

**Technical Notes:**
- Shadows only render when BuildingShadowsLayer is active and has valid filter
- Uses getBlurredOutdoorsMask() method for smooth shadow edges
- Coordinate transformation accounts for canvas scale and camera offset
- Shadow offset automatically syncs with sun angle from BuildingShadowsLayer

---

**DOCUMENTATION - Building Shadows Audit & Shadow Extension Analysis**

Created comprehensive audit report for the Building Shadows effect system. Analyzed feasibility of extending shadow functionality to overhead layers and foliage elements.

**Key Findings:**
- Building Shadows is a sophisticated time-of-day based system using _Outdoors masks
- Uses 2-pass Kawase blur with half-resolution optimization (RenderTexture pooling)
- Extensive artifact prevention: edge safety margins, erosion filters, threshold culling
- Applied to canvas.primary via PIXI filter, only active 6am-6pm in-game time

**Extension Analysis:**
1. **Overhead Shadows (6-10 hours effort):** MODERATE difficulty
   - Add shadow sampling to OverheadRecolorFilter
   - Reuse existing blurred shadow mask from BuildingShadowsLayer
   - High visual impact, minimal architectural changes

2. **Foliage Shadows (12-20 hours effort):** MODERATE-TO-HARD difficulty
   - Requires new FoliageShadowsLayer to render _Bush/_Tree tiles to mask
   - Separate blur pipeline for foliage mask generation
   - Can have lighter intensity (filtered light effect)
   - ~2.07MB additional VRAM for foliage mask texture

**Documentation Created:**
- `docs/Building_Shadows_Audit_Report.md` - Complete technical audit with implementation roadmaps

---

Version: 1.1.95

**CRITICAL BUG FIX - Scene Transition Crashes**

Fixed fatal BatchRenderer crashes during scene transitions caused by weather system attempting to render destroyed sprites.

**Root Cause:**
- WeatherEffectLayer.update() was missing the critical `transitionActive` guard
- During scene teardown, the weather layer continued calling `_updateOutdoorMasking()` → `getOutdoorsMask()` → `renderMask()`
- GeometryMaskManager attempted to render destroyed sprites, causing BatchRenderer crashes with null baseTexture/sprite errors

**Fixes Applied:**
1. Added `transitionActive` guard to WeatherEffectLayer.update() (line 274)
2. Added `transitionActive` guard to ResourceManager.getOutdoorsMask() (line 5323)  
3. Added `transitionActive` guard to MaskedEffectLayer.renderMask() (line 22579)
4. Improved optional chaining safety throughout guard checks

**Error Stack Resolved:**
- `TypeError: can't access property "source", this.texture.baseTexture.resource is null`
- `TypeError: can't access property "length", e is undefined` (StateSystem.ts:246)
- `TypeError: can't access property "_batchEnabled", d is null` (BatchRenderer.ts:452)

**Pattern Applied:**
All animated layers now consistently check `game.mapShine?.transitionActive` before any rendering operations during their animation loops, matching the defensive pattern already used in:
- ParticleLayer (line 16445)
- IridescenceLayer (line 28846)  
- BuildingShadowsLayer (line 32257)
- CloudDepthLayer, CanopyLayer, StructuralShadowsLayer, etc.

**Result:** Scene transitions now complete cleanly without crashes. Weather system properly pauses all rendering during teardown/setup sequences.

---

Version: 1.1.93 : This is the start of this document which is meant to track the work done on the module as we progress. This will help with creating changelogs and keeping a topdown view of the overall module's development. At some point I'd like you to write a detailed summary of the module's features so that they can be placed in the prehistory of the module's 1.1.93