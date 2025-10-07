# Memory Optimization Task List

**Created:** 2025-10-07  
**Status:** In Progress  
**Goal:** Reduce MapShine module memory footprint through aggressive resource management, texture optimization, and RenderTexture improvements.

---

## 1. Aggressive Resource Management and Lifecycle

### 1.1 Audit destroy() Calls
- [ ] **Audit MetallicShineLayer** - Review all PIXI object creation and verify destroy() calls
  - [ ] Check sprite destruction in _tearDown
  - [ ] Verify filter cleanup
  - [ ] Review RenderTexture disposal
  
- [ ] **Audit AmbientLayer** - Review particle and graphics object lifecycle
  - [ ] Verify emitter destruction
  - [ ] Check custom mask texture cleanup
  - [ ] Review displacement map disposal
  
- [ ] **Audit ScreenEffectsManager** - Review filter and sprite lifecycle
  - [ ] Verify bloom sprite destruction
  - [ ] Check filter disposal
  - [ ] Review render texture cleanup
  
- [ ] **Audit ParticleManager** - Review particle emitter lifecycle
  - [ ] Verify all emitters are destroyed in teardown
  - [ ] Check particle texture disposal
  - [ ] Review controller cleanup
  
- [ ] **Audit GeometryMaskManager** - Review mask texture lifecycle
  - [ ] Verify mask texture destruction
  - [ ] Check graphics object cleanup
  
- [ ] **Audit LightMaskManager** - Review render texture lifecycle
  - [ ] Verify blur pass texture destruction
  - [ ] Check intermediate texture cleanup
  
- [ ] **Audit ResourceManager** - Review shared resource lifecycle
  - [ ] Verify texture disposal when no longer referenced
  - [ ] Check render texture cleanup

### 1.2 Destroy Textures Properly
- [ ] Search codebase for all `.destroy()` calls on sprites/textures
- [ ] Replace with `.destroy(true)` where BaseTexture should be freed
- [ ] Document exceptions where `.destroy(false)` is intentional
- [ ] Add code comments explaining texture destruction decisions

### 1.3 Nullify References
- [ ] Review all manager classes for reference nullification after destroy
- [ ] Add `= null` assignments after destroy() calls
- [ ] Update _tearDown methods to nullify all object references
- [ ] Add null checks before accessing potentially destroyed objects

---

## 2. Texture Loading and Format Optimization

### 2.1 Create Texture Atlases (Sprite Sheets)
- [ ] **Identify atlas candidates** - List all small textures that can be combined
  - [ ] particle.webp
  - [ ] glint.webp
  - [ ] fly.webp
  - [ ] flame.webp
  - [ ] dust mote textures
  - [ ] Other particle textures
  
- [ ] **Generate texture atlas**
  - [ ] Choose atlas tool (TexturePacker, ShoeBox, or custom)
  - [ ] Create atlas with power-of-two dimensions
  - [ ] Export atlas JSON and image file
  - [ ] Add atlas files to assets directory
  
- [ ] **Update particle configuration**
  - [ ] Modify ParticleManager to load atlas
  - [ ] Update emitter configs to use atlas frames
  - [ ] Test particle rendering with atlas
  - [ ] Verify memory reduction
  
- [ ] **Remove individual texture files**
  - [ ] Archive old texture files
  - [ ] Update asset references
  - [ ] Test all particle effects still work

### 2.2 Automatic Half-Resolution Loading (PRIORITY - COMPLETED)
- [x] **Create TextureLoader utility class**
  - [x] Detect all _Suffixed textures (Specular, Ambient, etc.)
  - [x] Apply 0.5x resolution scaling automatically
  - [x] Keep background textures at full resolution
  - [x] Add console logging for verification
  
- [x] **Replace all foundry.canvas.loadTexture calls**
  - [x] Updated module.js (all instances)
  - [x] Updated AmbientLayer.js
  - [x] Import TextureLoader utility
  
- [ ] **Test and verify implementation** (IN PROGRESS)
  - [ ] Reload Foundry and check console logs
  - [ ] Verify _Suffixed textures load at half resolution
  - [ ] Test visual quality of effects
  - [ ] Run MapShineMemoryProfiler.printStats() for before/after comparison
  
- [ ] **Measure memory impact**
  - [ ] Document texture memory reduction
  - [ ] Calculate percentage savings
  - [ ] Verify expected 75% reduction per texture

### 2.3 Enforce Asset Optimization Guidelines
- [ ] **Audit all texture assets**
  - [ ] List all texture files in assets directory
  - [ ] Document current format, dimensions, file size
  - [ ] Identify optimization candidates
  
- [ ] **Convert to .webp format**
  - [ ] Convert PNG textures to webp
  - [ ] Convert JPG textures to webp
  - [ ] Verify visual quality acceptable
  - [ ] Update all texture references in code
  
- [ ] **Ensure power-of-two dimensions**
  - [ ] Identify non-power-of-two textures
  - [ ] Resize to nearest power-of-two
  - [ ] Test rendering quality
  
- [ ] **Compress textures**
  - [ ] Apply aggressive compression to effect textures
  - [ ] Test visual quality (especially for blurred/noisy effects)
  - [ ] Document compression settings used
  - [ ] Measure file size reduction
  
- [ ] **Document optimization standards**
  - [ ] Create ASSET_GUIDELINES.md
  - [ ] Define format requirements
  - [ ] Define dimension requirements
  - [ ] Define compression standards

### 2.3 Measure Texture Memory Impact
- [ ] Add texture memory profiling
- [ ] Log total texture memory before/after optimization
- [ ] Create comparison report
- [ ] Update documentation with findings

---

## 3. RenderTexture Optimization

### 3.1 Re-evaluate Floating-Point Textures
- [ ] **Audit FLOAT texture usage**
  - [ ] Identify all PIXI.TYPES.FLOAT RenderTextures
  - [ ] Document why FLOAT was chosen for each
  - [ ] Measure memory cost per FLOAT texture
  
- [ ] **Experiment with UNSIGNED_BYTE**
  - [ ] Create test scene with both FLOAT and UNSIGNED_BYTE
  - [ ] Compare visual quality
  - [ ] Test with dithering/noise to reduce banding
  - [ ] Measure memory savings
  
- [ ] **Update LightMaskManager if viable**
  - [ ] Replace FLOAT with UNSIGNED_BYTE in blur passes
  - [ ] Add dithering if needed for quality
  - [ ] Test lighting quality across scenes
  - [ ] Verify 4x memory reduction achieved

### 3.2 Downscaling RenderTextures
- [ ] **Audit current downscaling**
  - [ ] Document which textures use half-resolution
  - [ ] Verify quality is acceptable
  - [ ] Measure memory savings
  
- [ ] **Identify additional downscaling opportunities**
  - [ ] Review blur operations (can often be quarter-res)
  - [ ] Review glow effects (half-res usually sufficient)
  - [ ] Review other post-processing effects
  
- [ ] **Implement additional downscaling**
  - [ ] Apply to identified targets
  - [ ] Test visual quality
  - [ ] Measure memory impact
  - [ ] Document scale factors used

### 3.3 Resource Sharing via ResourceManager
- [ ] **Audit RenderTexture creation**
  - [ ] List all RenderTexture.create() calls
  - [ ] Identify duplicate/similar textures
  - [ ] Document which could be shared
  
- [ ] **Expand ResourceManager**
  - [ ] Add shared blur texture support
  - [ ] Add shared mask texture support
  - [ ] Implement reference counting
  - [ ] Add proper disposal when refs = 0
  
- [ ] **Refactor layers to use shared resources**
  - [ ] Update MetallicShineLayer
  - [ ] Update AmbientLayer
  - [ ] Update ScreenEffectsManager
  - [ ] Test all effects still render correctly
  
- [ ] **Measure resource sharing impact**
  - [ ] Log RenderTexture count before/after
  - [ ] Measure memory reduction
  - [ ] Document findings

---

## 4. Testing and Validation

- [x] **Create memory profiling utility**
  - [x] Add PIXI memory stats logging
  - [x] Add texture count/size reporting
  - [x] Add RenderTexture tracking
  - [x] Create profiling console command
  
- [ ] **Establish baseline metrics** (IN PROGRESS)
  - [ ] Test scene memory usage (before optimizations)
  - [ ] Document texture count
  - [ ] Document RenderTexture count
  - [ ] Document total VRAM usage
  
- [ ] **Test each optimization**
  - [ ] Verify visual quality maintained
  - [ ] Measure memory impact
  - [ ] Check for regressions
  - [ ] Document results
  
- [ ] **Full regression testing**
  - [ ] Test all particle effects
  - [ ] Test all screen effects
  - [ ] Test scene transitions
  - [ ] Test loading screens
  - [ ] Verify no memory leaks during transitions

---

## 5. Documentation

- [ ] **Update technical documentation**
  - [ ] Document memory optimization strategies used
  - [ ] Add asset creation guidelines
  - [ ] Document RenderTexture best practices
  - [ ] Add troubleshooting section
  
- [ ] **Create performance report**
  - [ ] Before/after memory comparison
  - [ ] Texture count reduction
  - [ ] File size reduction
  - [ ] Visual quality assessment
  
- [ ] **Update README**
  - [ ] Add performance characteristics
  - [ ] Document memory requirements
  - [ ] Add optimization notes for contributors

---

## Progress Summary

**Completed:** 0 / TBD tasks  
**In Progress:** 0  
**Blocked:** 0  

### Memory Impact Target
- **Current VRAM Usage:** TBD (measure baseline)
- **Target Reduction:** 50-75%
- **Achieved Reduction:** TBD

### Key Milestones
- [ ] Baseline metrics established
- [ ] Resource lifecycle audit complete
- [ ] Texture atlas implementation complete
- [ ] RenderTexture optimization complete
- [ ] Final validation and testing complete
