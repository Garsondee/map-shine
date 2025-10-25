# Map Shine - Technical Feature Map

**Version:** 1.2.1  
**Last Updated:** 2025-01-25

> **Purpose:** Comprehensive technical reference for all module systems, layers, managers, and features.  
> **Location Reference:** Add `docs/TECHNICAL_FEATURE_MAP.md` to your AI instructions for quick feature lookup.

---

## Quick Reference Index

- [Core Architecture](#core-architecture) - Global namespace, lifecycle
- [Managers (16)](#manager-systems) - Profile, Resource, Particle, Wind, Weather, etc.
- [Canvas Layers (19)](#canvas-layers) - Effect layers, particle layers, utility layers
- [Visual Effects](#visual-effects) - Post-processing, shaders, filters
- [Particle Systems](#particle-systems) - Emitters, behaviors, types
- [Weather Systems](#weather-systems) - States, shaders, orchestration
- [UI Components](#ui-components) - Debugger, panels, clocks
- [Utilities](#utility-systems) - Texture loading, pooling, profiling
- [Configuration](#configuration-systems) - Defaults, profiles, settings
- [Performance](#performance-systems) - Optimizations and pooling

---

## Core Architecture

### Global Namespace: `game.mapShine`
**Init Hook:** `canvasInit` | **Location:** `scripts/module.js` lines 2438-2805

```javascript
game.mapShine = {
  // State
  initialized, systemsReady, transitionActive, isCustomPaused,
  timeControl: { timeFactor },
  
  // Managers
  profileManager, resourceManager, particleManager, windManager,
  weatherSystemManager, tokenManager, lightMaskManager, geometryMaskManager,
  dynamicExposureManager, combatEffectManager, transitionManager,
  sceneChangeManager, effectTargetManager,
  
  // UI
  debugger, activeEditor, dayNightClock, userGuide,
  
  // Utilities
  loadingScreen, loadingManager, coordinateManager
}
```

### Lifecycle: `MapShineLifecycle`
**Location:** `scripts/module.js` lines 8000-9000

**Key Methods:**
- `runFullSetup()` - Full initialization with 20+ waypoints
- `_performTeardown()` - Scene transition cleanup
- `safeInitializeManager()` - Error-handling wrapper with criticality levels
- `_prewarmMaskedLayers()` / `_prewarmGeometryMasks()` - Prevent first-frame stalls

---

## Manager Systems (16 Total)

### 1. ProfileManager 🎨
**File:** `scripts/managers/ProfileManager.js` | **Lines:** 1-629

**Purpose:** Central configuration orchestration

**Features:**
- Scene-specific visual profiles
- World defaults + user overrides hierarchy
- Real-time config updates (optimized path-based routing)
- Profile transitions with animations
- Config merging (scene → world → module defaults)

**Key Methods:**
```javascript
initializeForScene()              // Load merged config
applyProfile(id)                  // Switch profiles with transition
updateSystemFromPath(path, value) // Optimized targeted updates
updateAllSystemsFromConfig()      // Broadcast to all systems
recordUserChange(path, value)     // Client-side overrides
```

### 2. ResourceManager 📦
**Location:** `scripts/module.js` lines 10400-11500

**Purpose:** Centralized texture/resource caching

**Features:**
- Frame-based cache (cleared each tick)
- Outdoor mask management
- Water displacement map generation
- Raw cloud texture sharing (for occlusion)
- Light mask coordination

**Key Getters:**
```javascript
getOutdoorsMask()           // _Outdoors texture
getRawCloudTexture()        // Shared cloud mask
getWaterDisplacementMap()   // Animated distortion
clearFrameCache()           // Per-frame cleanup
```

### 3. GeometryMaskManager 🎭
**Location:** `scripts/module.js` lines 10000-10400

**Purpose:** GPU-accelerated geometry masking

**Features:**
- Custom mask support (_Surface, _Rooftops, _Outdoors)
- Shape-based masking (circles, rects, polygons)
- Particle spawn masking
- Render texture compilation

### 4. LightMaskManager 💡
**Location:** `scripts/module.js` lines 6900-7300

**Purpose:** Unified light masking system (2-phase rendering)

**Pipeline:**
1. Hard mask - Binary light polygons
2. Blur pass 1 - Intermediate texture (FLOAT)
3. Blur pass 2 - Final soft gradient (FLOAT)

**Features:**
- Wall-clipped light shapes
- Kawase blur (band-free gradients)
- Event-driven updates (only when lights/walls change)

### 5. ParticleManager ✨
**Location:** `scripts/module.js` lines 13500-13650

**Features:**
- Multiple effect controllers (dust, fire, biofilm, glints)
- Emitter lifecycle management
- Behavior system (wind, alpha, rotation, scale)
- TextureMaskShape spawning (cloud-based)
- Viewport culling

### 6. WindManager 🌬️
**Location:** `scripts/module.js` lines 13666-13783

**Features:**
- Smooth angle/speed interpolation
- Gust system (periodic spikes)
- Directional vectors (Math.cos/sin)
- Affects: particles, clouds, weather, ropes

**Properties:** `angle`, `speed`, `smoothedAngle`, `smoothedSpeed`

### 7. WeatherSystemManager 🌦️
**Location:** `scripts/module.js` lines 13800-15500

**Features:**
- 7 states (clear, drizzle, rain, storm, sleet, snow, blizzard)
- Smooth transitions with property interpolation
- Shader-based precipitation (GPU)
- WeatherEffectLayer integration
- Real-time diagnostics API

### 8. TokenManager | 9. DynamicExposureManager
### 10. CombatEffectManager | 11. PauseEffectManager
### 12. SceneChangeManager | 13. ScreenEffectsManager
### 14. DynamicTokenMaskManager | 15. CoordinateManager
### 16. EffectTargetManager

**See full details in sections below**

---

## Canvas Layers (19 Total)

### Base Classes

**AnimatedCanvasLayer** (`scripts/layers/AnimatedCanvasLayer.js`)
- Auto ticker binding/unbinding
- Memory leak prevention
- `_onAnimate(dt)` implementation required

**ResizableAnimatedCanvasLayer**
- Extends AnimatedCanvasLayer
- Adds window resize handling
- `_onResize()` implementation required

**MaskedEffectLayer** (`scripts/module.js` lines 23200-24200)
- Base for texture-masked effects
- Auto texture discovery
- Shared rendering pipeline

### Effect Layers with Texture Maps

| Layer | Extends | Texture Maps | Features | Lines |
|-------|---------|--------------|----------|-------|
| **MetallicShineLayer** | Resizable | _Specular, _Metallic, _RoughnessSpec, _Glint | PBR shader, anisotropic highlights, animated glints | 26400-27800 |
| **CloudShadowsLayer** | Masked | _CloudShadows | 5-layer FBM clouds, wind animation, rawCloudTexture generation | 23800-24700 |
| **StructuralShadowsLayer** | Masked | _StructuralShadows | Directional lighting, time-of-day rotation, cloud occlusion | 25400-26100 |
| **WaterEffectLayer** | Masked | _Water | Animated caustics, refraction, cloud occlusion | 27800-28800 |
| **IridescenceLayer** | Masked | _Iridescence | Rainbow shimmer, color shifting | 24700-25400 |
| **CanopyLayer** | Masked | _Canopy | Leaf distortion, wind movement | 28800-29400 |
| **PrismLayer** | Masked | _Prism | Spectral dispersion, rainbow patterns | 29400-30000 |
| **BuildingShadowsLayer** | Masked | _Outdoors | Time-based shadows, 2-pass Kawase blur, erosion filtering, edge safety | 32061-32394 |
| **TimeOfDayLayer** | Masked | _TimeOfDay | 24hr cycle, darkness sync, sunrise/sunset | 31200-32000 |
| **GroundGlowLayer** | Resizable | _Glow | Glow-in-dark, light-activated, persistent/fade modes | 18500-19200 |
| **HeatDistortionLayer** | Resizable | _HeatDistortion | Displacement distortion, heat waves | 19200-19700 |
| **FoamLayer** | Resizable | _Foam | Water foam simulation, wave animation | 20400-21000 |
| **SmellyFliesLayer** | Resizable | _SmellyFlies | Swarm particles, spawn points, flocking | 17000-17800 |

### Utility Layers

| Layer | Purpose | Lines |
|-------|---------|-------|
| **OverheadEffectLayer** | Tile-based overhead effects, cloud shadows | 8600-9600 |
| **ParticleLayer** | Unified particle rendering, viewport culling | 15100-17000 |
| **PhysicsRopeLayer** | Physics-based ropes, wind integration, Verlet | 17800-19000 |
| **BackgroundEffectTileLayer** | Background tile management | 21000-21500 |
| **DiagnosticLayer** | Visual debugging overlays | 32000-32400 |
| **CloudDepthLayer** | Cloud depth visualization | 32400-32800 |
| **AmbientLayer** | Ambient audio management | `scripts/layers/AmbientLayer.js` |

### Special Layer: WeatherEffectLayer
**File:** `scripts/weather/WeatherEffectLayer.js`

**Purpose:** GPU weather shader rendering

**Shaders:** Rain (Voronoi), Snow (20-layer), Fog (FBM)  
**Render:** QuadMesh full-screen  
**Blend:** PIXI.BLEND_MODES.SCREEN (additive)

---

## Visual Effects

### Post-Processing Filters (ScreenEffectsManager)
**Location:** `scripts/module.js` lines 21500-23000

| Filter | Features |
|--------|----------|
| **ColorCorrectionFilter** | Saturation, brightness, contrast, tint, exposure, gamma, levels, white balance, selective color, illumination mix-in |
| **BloomFilter** | Glow effect, threshold, intensity, multi-pass |
| **VignetteFilter** | Edge darkening, falloff control |
| **GrainFilter** | Film grain, animated noise |
| **RGBSplitFilter** | Chromatic aberration, channel offsets |

### Shader-Based Effect Filters

| Shader | Purpose | Key Features |
|--------|---------|--------------|
| **MetallicShineFilter** | PBR metals | Fresnel, anisotropic highlights, roughness |
| **CloudShadowsFilter** | Procedural clouds | 5-layer FBM, turbulence, wind, shading controls |
| **StructuralFilter** | Directional lighting | Time-of-day rotation, cloud occlusion |
| **WaterCausticsFilter** | Caustics | Refractive patterns, animation |
| **IridescenceFilter** | Color shifting | Spectrum animation, hue rotation |
| **CanopyDistortionFilter** | Foliage sway | Displacement, wind integration |
| **FireToneCurveFilter** | Fire grading | Custom tone curves |

---

## Particle Systems

### Architecture
- **ParticleEmitter** - Spawns/manages lifecycle
- **ParticlePool** - Object pooling
- **Particle** - Data structure

### Behaviors
**Location:** `scripts/module.js` lines 16000-16700

| Behavior | Features |
|----------|----------|
| **MovementBehavior** | Velocity, acceleration, constraints |
| **WindBehavior** | Wind force, turbulence, no buoyancy (top-down fix) |
| **AlphaBehavior** | Fade-in/out, keyframes, lifetime-based |
| **RotationBehavior** | Angular velocity |
| **ScaleBehavior** | Size interpolation, fake Z-axis depth |
| **ColorBehavior** | Tinting, lifetime color shifts |

### Effect Types

| Type | Features | Mask |
|------|----------|------|
| **Dust** | Floating motes, slow drift, lit areas | Light mask |
| **Fire** | Upward, wind-affected, color-coded | None |
| **Biofilm** | Water surface, wave motion | _Outdoors |
| **Metallic Glints** | Sparkle, light-based, quick fade | Light mask |
| **Precipitation** | Legacy system (replaced by shaders) | Cloud mask |

### Spawning: TextureMaskShape
**Location:** `scripts/module.js` lines 14500-14800

- Sample texture for spawn probability
- Threshold-based masking
- Used for: precipitation, glints, cloud-based spawning

---

## Weather Systems

### States (7 Total)
**Manager:** WeatherSystemManager

| State | Effects | Config |
|-------|---------|--------|
| **CLEAR** | None | - |
| **DRIZZLE** | Light rain | opacity 0.15, intensity 0.6 |
| **RAIN** | Moderate rain | opacity 0.25, intensity 1.0 |
| **STORM** | Heavy rain + fog | opacity 0.45, intensity 1.5, fog |
| **SNOW** | Snowfall | direction 0.5, speed 2 |
| **BLIZZARD** | Heavy snow + fog | direction 0.80, speed 8, fog |
| **SLEET** | Mixed rain/snow | Blended properties |

### Shaders

#### RainShaderAdvanced ✅ ACTIVE
**File:** `scripts/weather/RainShaderAdvanced.js`

**Features:**
- 5-layer parallax (depths 0.0 → 1.0)
- Voronoi cell raindrops (45 samples)
- Rain curtains, wave gaps, ground splashes
- Atmospheric fade

**Uniforms:** time, alpha, opacity, rainDensity, gridSize, streakLength, intensity, splashIntensity, waveMaskIntensity, curtainIntensity, windDirection, tint

#### SheetRainShader ⚠️ PAUSED
**File:** `scripts/weather/SheetRainShader.js`  
**Blocker:** UV coordinate bug (`effectDimensions` = 0.885 instead of 8850)

#### SnowShader ✅
**File:** `scripts/weather/SnowShader.js`

- 20-layer procedural flakes
- Custom PRNG for variation
- Wind drift, rotation, turbulence

#### FogShader ✅
**File:** `scripts/weather/FogShader.js`

- FBM fog (2/4/4-dual octaves by performance mode)
- Wind displacement

### Rendering

**QuadMesh** (`scripts/weather/QuadMesh.js`) - Full-screen quad (4 vertices)  
**WeatherShaderEffect** (`scripts/weather/WeatherShaderEffect.js`) - Shader wrapper

### Orchestration

**WeatherOrchestrator** (`scripts/weather/WeatherOrchestrator.js`)
- Automated state scheduling
- Probability-based transitions
- Duration-based changes

---

## UI Components

### MaterialEditorDebugger (GM)
**Location:** `scripts/module.js` lines 33000-42000

**Layout:** 3 columns (Effect Selection | Config | Preview)

**Features:**
- 20+ accordion effect sections
- Real-time sliders/controls
- Color picker with favorites
- Profile management
- Export/import
- Diagnostics panels (particles, weather)
- Clipboard color copy

### SimpleUIPanel (Players)
**Location:** `scripts/module.js` lines 42200-42400

- Basic toggles/sliders
- Profile switching
- No advanced controls

### Other UI

| Component | Purpose | Location |
|-----------|---------|----------|
| **DayNightClock** | 24hr time control, Foundry time sync, draggable | lines 32795-32983 |
| **UserGuide** | In-module documentation | lines 42400-42681 |
| **LoadingScreen** | World/scene loading UI | `scripts/ui/LoadingUI.js` |

---

## Utility Systems

### TextureLoader 📥
**File:** `scripts/utils/TextureLoader.js`

**Features:**
- **P1 Complete:** Foundry integration (setCache, TTL tracking)
- **P2 Complete:** Texture pinning (pinSource/unpinSource)
- Automatic downsampling (25% default)
- Immediate full-size destruction
- Spritesheet support

**Memory Savings:** Prevents eviction of critical textures

### RenderTexturePool 🎱
**File:** `scripts/utils/RenderTexturePool.js`

**Phase 1 Complete - Production Ready**

**Features:**
- Separate pools: FLOAT vs UNSIGNED_BYTE
- Acquire/release semantics
- Try-finally pattern enforcement
- Pool warmup, statistics, leak detection
- CLAMP wrap mode for Kawase blur

**Integrated:**
- LightMaskManager (2 FLOAT, ~4.14MB saved)
- BuildingShadowsLayer (1 UNSIGNED_BYTE, ~2.07MB saved)

**Impact:** 6.21MB saved @ 1080p, 99.8% hit rate

### TextureAutoLoader 🔍
**Location:** `scripts/module.js` lines 1800-2400

**Suffix Map (20+ textures):**
```
_Specular, _Metallic, _RoughnessSpec, _Glint,
_CloudShadows, _StructuralShadows, _Iridescence,
_Canopy, _Prism, _Water, _BuildingShadows,
_TimeOfDay, _Glow, _HeatDistortion, _Foam,
_Outdoors, _Surface, _Rooftops, _SmellyFlies
```

**Process:**
1. Check background image variants
2. Check tile variants
3. Store in scene flag (GM → players)

### Other Utilities

| Utility | Purpose | File |
|---------|---------|------|
| **MemoryProfiler** | Memory tracking, leak detection | `scripts/utils/MemoryProfiler.js` |
| **ColorUtils** | Color conversion, lerp | `scripts/utils/ColorUtils.js` |

---

## Configuration Systems

### MODULE_DEFAULTS
**Location:** `scripts/module.js` lines 600-1800

**Scene-specific configuration:**
- Effect settings (enabled, intensity, parameters)
- Particle system configs
- Shader parameters
- Layer-specific settings

### UNIVERSAL_EFFECT_DEFAULTS
**File:** `scripts/config/universal-defaults.js`

**World-wide defaults:**
- `sceneTransition` - Overlay settings, hints, logo
- `pauseEffect` - Pause screen, color correction
- `combatEffect` - Combat start effects
- `fontManager` - Font families

### Settings Registration
**Class:** SettingsManager  
**Location:** `scripts/module.js` lines 2808-3272

**Categories:**
- Compatibility (scene transitions, pause screen)
- Loading screen (backgrounds, hints, overlay)
- Universal effects (40+ settings)
- Pause effect (20+ settings)
- Combat effect (15+ settings)
- Client overrides (intensity adjustments per effect)
- Advanced UI mode (GM only)

---

## Performance Systems

### Optimizations Implemented

#### Phase 1: RenderTexture Pooling ✅ Complete
- **VRAM Saved:** 6.21MB @ 1080p (83% for intermediate textures)
- **Systems:** LightMaskManager, BuildingShadowsLayer
- **Hit Rate:** 99.8%
- **Status:** Production ready, zero visual regressions

#### Texture Pinning ✅ Complete
- Prevents Foundry from evicting critical textures
- Pins after load, unpins before teardown
- No mid-scene texture reloads

#### Pre-warming
- Masked layers pre-rendered before loading screen hide
- Geometry masks pre-compiled
- Prevents first-frame stalls

#### Viewport Culling
- Particle culling outside viewport
- Coordinate-based optimization
- LOD system for weather particles

#### Frame-Based Caching
- ResourceManager clears cache each frame
- Prevents stale texture references
- Lightweight operation

### Planned Optimizations

#### Phase 2: Fog of War Culling (Planned)
- **Expected:** 30-60% GPU boost for players
- **Savings:** 50-80MB VRAM
- **Strategy:** Shader-level + layer-level + particle culling
- **Timeline:** 3-4 weeks

#### Phase 3: GeometryMaskManager Consolidation
- **Potential:** ~80MB VRAM savings
- **Strategy:** Texture atlas for masks
- **Status:** Requires architectural planning

---

## Texture Discovery Suffix Reference

Quick lookup for texture naming conventions:

```
Background_Image.jpg          → Base map
Background_Image_Specular.jpg → Metallic shine highlights
Background_Image_Metallic.jpg → Metallic regions
Background_Image_CloudShadows.jpg → Cloud shadow mask
Background_Image_Outdoors.jpg → Indoor/outdoor mask
Background_Image_Water.jpg    → Water caustics mask
Background_Image_Glow.jpg     → Glow-in-dark regions
```

**Full list:** See TextureAutoLoader.SUFFIX_MAP (20+ suffixes)

---

## Manager Initialization Order

**Lifecycle:** `MapShineLifecycle.runFullSetup()` lines 8264-8618

1. **CRITICAL** - RenderTexturePool
2. **CRITICAL** - ResourceManager
3. **CRITICAL** - CoordinateManager (static exposure)
4. **IMPORTANT** - LightMaskManager
5. **CRITICAL** - ProfileManager
6. **IMPORTANT** - WindManager
7. **OPTIONAL** - WeatherSystemManager
8. **OPTIONAL** - WeatherOrchestrator
9. Config finalization + layer updates
10. Pre-warming (masked layers, geometry masks)
11. Weather auto-start
12. Particle setup
13. **IMPORTANT** - ScreenEffectsManager
14. **OPTIONAL** - TokenManager
15. **OPTIONAL** - DynamicExposureManager
16. **OPTIONAL** - CombatEffectManager
17. **IMPORTANT** - GeometryMaskManager
18. **OPTIONAL** - DynamicTokenMaskManager
19. Structural shadows pre-warm
20. systemsReady = true
21. Emit `mapShine:setupComplete` hook

**Criticality Levels:**
- **CRITICAL** - Module fails without it
- **IMPORTANT** - Visual quality degrades without it
- **OPTIONAL** - Bonus features, graceful degradation

---

## Key Hooks

### Custom Hooks Emitted

```javascript
Hooks.callAll("mapShine:setupComplete", { type: "full" });
Hooks.callAll("mapShine:targetsRefreshed");
Hooks.callAll("mapShine:timeChanged", time);
```

### Hooks Listened To

```javascript
Hooks.on("canvasInit", ...)       // Global namespace init
Hooks.on("canvasReady", ...)      // Full setup trigger
Hooks.on("canvasPan", ...)        // Light mask update flag
Hooks.on("createLight", ...)      // Light mask update flag
Hooks.on("updateLight", ...)      // Light mask update flag
Hooks.on("deleteLight", ...)      // Light mask update flag
Hooks.on("createWall", ...)       // Light mask update flag
Hooks.on("updateWall", ...)       // Light mask update flag
Hooks.on("deleteWall", ...)       // Light mask update flag
Hooks.on("updateScene", ...)      // Profile change handling
```

---

## Memory Management

### Texture Lifecycle

1. **Discovery** - TextureAutoLoader finds suffixed variants
2. **Load** - TextureLoader with downsampling (25%)
3. **Pin** - Prevent Foundry eviction via pinSource()
4. **Cache** - ResourceManager frame-based caching
5. **Pool** - RenderTexturePool for intermediate textures
6. **Teardown** - Unpin via unpinSource(), clear caches
7. **Destroy** - PIXI cleanup

### Leak Prevention

- Try-finally for pooled textures
- Proper `await super._tearDown()` in all layers
- `_destroyed` flag checks in animation loops
- Ticker unbinding in lifecycle
- Filter cleanup in ScreenEffectsManager

---

## Debug Console Commands

```javascript
// RenderTexturePool statistics
RenderTexturePool.printReport()
RenderTexturePool.getStats()
RenderTexturePool.checkLeaks()

// Profile management
game.mapShine.profileManager.getCurrentConfig()
game.mapShine.profileManager.getSceneProfiles()

// Weather diagnostics
game.mapShine.weatherSystemManager.getDiagnostics()

// Show editor
game.mapShine.showEditor()

// Show clock
game.mapShine.showDayNightClock()

// Show guide
game.mapShine.showUserGuide()
```

---

## File Structure Quick Reference

```
map-shine/
├── scripts/
│   ├── module.js                    # Main module (42,681 lines!)
│   ├── config/
│   │   ├── constants.js
│   │   ├── blend-modes.js
│   │   ├── presets.js
│   │   ├── fonts.js
│   │   ├── color-correction-presets.js
│   │   └── universal-defaults.js
│   ├── filters/
│   │   └── FireToneCurveFilter.js
│   ├── layers/
│   │   ├── AnimatedCanvasLayer.js   # Base classes
│   │   └── AmbientLayer.js
│   ├── managers/
│   │   ├── ProfileManager.js
│   │   ├── CoordinateManager.js
│   │   └── TokenManager.js
│   ├── utils/
│   │   ├── TextureLoader.js         # P1+P2 complete
│   │   ├── RenderTexturePool.js     # Phase 1 complete
│   │   ├── MemoryProfiler.js
│   │   └── ColorUtils.js
│   ├── ui/
│   │   └── LoadingUI.js
│   ├── weather/
│   │   ├── WeatherShaderBase.js
│   │   ├── RainShaderAdvanced.js    # Active
│   │   ├── SheetRainShader.js       # Paused (bug)
│   │   ├── SnowShader.js
│   │   ├── FogShader.js
│   │   ├── QuadMesh.js
│   │   ├── WeatherShaderEffect.js
│   │   ├── WeatherEffectLayer.js
│   │   └── WeatherOrchestrator.js
│   └── diagnostics/
│       ├── batchrenderer-debug.js
│       └── scene-data-checker.js
├── styles/
│   └── styles.css
├── languages/
│   └── en.json
├── docs/
│   └── TECHNICAL_FEATURE_MAP.md     # This file
└── module.json
```

---

## Shadow System Architecture

### Building Shadows (Current Implementation)

**Components:**
- `BuildingShadowsFilter` (lines 31928-32059) - PIXI fragment shader
- `BuildingShadowsLayer` (lines 32061-32394) - Extends MaskedEffectLayer
- Z-index: 28 (ground layer, below tiles)

**Shadow Pipeline:**
1. Discover `_Outdoors` masks via MaskedEffectLayer
2. Render to `combinedMaskTexture` (full-resolution)
3. 2-pass Kawase blur (full→half→half res)
   - Pass 1: Pooled intermediate texture
   - Pass 2: Persistent `blurredMaskTexture`
4. Apply `BuildingShadowsFilter` to `canvas.primary`
5. Sample blurred mask at offset position for shadow

**Temporal Behavior:**
- Active: 6am-6pm in-game time only
- Shadow length: Varies with sun position (`sunPos = (time - 12) / 6.0`)
- Shadow softness: Increases at dawn/dusk (`blur = maxBlur * (1.0 - daylight)`)
- Direction: User-configured sun angle (0°=East, 90°=South)

**Artifact Prevention:**
- **Edge Safety:** 8-pixel margin from scene bounds
- **Erosion Filter:** 4-neighbor sampling prevents thin lines
- **Threshold Culling:** Discard shadows < 0.15 strength
- **Bounds Checking:** Skip if sample coordinate outside scene

**Performance:**
- VRAM: ~2.07MB @ 1080p (half-res blur)
- CPU: ~1-2ms blur passes (RenderTexturePool optimized)
- GPU: Minimal shader cost (4 texture samples + erosion)

### Shadow Extension Possibilities

#### 1. Overhead Shadows ✅ IMPLEMENTED (v1.1.96)

**Goal:** Cast building shadows onto overhead tiles (roofs, tree canopies)

**Implementation:**
- Extended `OverheadRecolorFilter` shader (lines 32396-32574)
- Added shadow sampling uniforms: `uBuildingShadowsEnabled`, `uBuildingShadowMask`, `uShadowOffset`, `uShadowIntensity`, `uTexelSize`, `uCanvasScale`
- Reads from `BuildingShadowsLayer.getBlurredOutdoorsMask()`
- Applies shadow darkening in outdoor overhead regions
- Animation loop passes shadow data from BuildingShadowsLayer (lines 7716-7739)

**Configuration:**
- Toggle: `overheadEffect.buildingShadows.enabled` (default: true)
- Intensity slider: `overheadEffect.buildingShadows.intensity` (default: 0.6)
- UI controls in debugger panel under "Recoloration" accordion

**Benefits:**
- Reuses existing shadow calculation (zero VRAM cost)
- Consistent shadow behavior across layers
- High visual impact for outdoor scenes
- Complements Time of Day strength feature

#### 2. Foliage Shadows (MODERATE-TO-HARD - 12-20 hours)

**Goal:** _Bush and _Tree tiles cast shadows on primary canvas

**Implementation:**
- Create `FoliageShadowsLayer` (new layer, z-index 29)
- Create `FoliageShadowsFilter` (new PIXI filter)
- Discover tiles with `_Bush` or `_Tree` in texture path
- Render foliage alpha to mask texture
- Apply same blur pipeline as building shadows
- Sample foliage mask at offset position

**Architecture:**
```
Foliage Tiles → Alpha Threshold → Mask Texture
                                        ↓
                                  2-Pass Blur
                                        ↓
                            FoliageShadowsFilter
                                        ↓
                              canvas.primary
```

**Benefits:**
- Separate intensity control (lighter, filtered shadows)
- Works with animated/distorted foliage
- Independent from building shadows

**Challenges:**
- Must render foliage to separate texture (CPU cost)
- Handle overhead foliage (sample from overhead sprites)
- Update when tiles change (hook management)

**VRAM Cost:** ~2.07MB additional (half-res mask)

#### 3. Unified Shadow System (HARD - 20+ hours)

**Goal:** Composite building + foliage shadows into single system

**Benefits:**
- Better performance (one blur, one filter)
- Shadows interact correctly (foliage shadows on walls)

**Cons:**
- Much more complex implementation
- Harder to tune separate intensities
- Higher risk of artifacts

### Shadow System Reference

**Core Files:**
- `BuildingShadowsFilter`: Lines 31928-32059
- `BuildingShadowsLayer`: Lines 32061-32394
- `OverheadRecolorFilter`: Lines 32396-32574
- `BushLayer`: Lines 27609-27766
- `TreeLayer`: Lines 27776-27933

**Related Documentation:**
- `docs/Building_Shadows_Audit_Report.md` - Complete audit and extension analysis

---

## Version History Highlights

- **1.2.0** - Foundry World Time synchronization for Day/Night Clock
- **1.1.99** - Critical scene transition error fix (baseTexture destruction)
- **1.1.98** - Low-hanging fruit code cleanup (weather gating, comment removal)
- **1.1.97** - Bush & Tree slider connection fix
- **1.1.96** - Overhead building shadows implementation
- **1.1.95** - Critical scene transition crash fix (BatchRenderer)
- **1.1.94** - Scene transition logo/showSceneName fix
- **1.1.80s** - Weather shader system (rain/snow/fog)
- **1.1.70s** - Weather state machine, orchestrator
- **1.1.60s** - RenderTexturePool Phase 1 complete
- **1.1.50s** - Texture pinning (P2) complete
- **1.1.40s** - Foundry memory integration (P1)
- **1.1.30s** - AnimatedCanvasLayer migration
- **1.1.20s** - Layer lifecycle audit
- **1.1.10s** - Scene transition system overhaul
- **1.1.0s** - Profile system, unified configuration

---

## Known Issues

### Active Bugs
- **SheetRainShader UV bug** - effectDimensions 10,000x compression causing invisible rain

### Limitations
- GeometryMaskManager not yet pooled (~80MB potential)
- Fog of War culling not implemented (Phase 2)
- Some particle systems not yet cloud-masked

---

## Future Enhancements

### Planned Features
- Fog of War performance optimization (Phase 2) # USER ALERT - BEWARE, THIS FEATURE HAS BEEN ATTEMPTED TWICE AND RESULTED IN FAILURE AND REVERTING
- GeometryMaskManager texture atlas (Phase 3)
- Additional weather shaders (hail, sandstorm, aurora)
- Enhanced particle masking
- More texture-based effects

### Low-Hanging Fruit
- See `user_global` memory for opportunities
- Check `Version History Main Document.md` for recent additions

---

**End of Technical Feature Map**

> 💡 **Tip:** When making changes, update this document and the Version History.  
> 🔍 **Search:** Use Ctrl+F to quickly find systems, files, or line numbers.
