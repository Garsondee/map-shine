# Phase 3 Implementation: Two-Filter Architecture

## Summary
Eliminated the duplicate FBM render pass by splitting cloud rendering into two specialized filters:
1. **CloudShadowsFilterEnhanced** (pattern filter) - Generates raw cloud pattern texture
2. **CloudShadowApplyFilter** (shadow filter) - Applies shadows using pre-generated texture

## Performance Gain
**Expected: ~3-4ms per frame** by eliminating redundant FBM calculations.

## Changes Made

### 1. New CloudShadowApplyFilter Class (lines 27482-27589)
- Lightweight filter that samples `uCloudTexture` (pre-generated) instead of calculating FBM
- Applies shadow darkening, light occlusion, and time-of-day tinting
- ~10x faster than running full FBM shader
- Applied to `canvas.primary` for final shadow rendering

### 2. CloudShadowsFilterEnhanced Simplification
- Removed `u_outputRawCloud` uniform (no longer needed)
- Shader now ALWAYS outputs raw grayscale cloud pattern
- Used ONLY on `_patternGeneratorSprite` for texture generation

### 3. CloudShadowsLayer Updates

#### Constructor (line ~27927)
```javascript
this.cloudPatternFilter = new CloudShadowsFilterEnhanced(...);
this.cloudShadowFilter = new CloudShadowApplyFilter();
```

#### _draw() Method (lines 28002-28048)
- Pattern filter applied to `_patternGeneratorSprite`
- Shadow filter applied to `canvas.primary`
- Masks set up for both filters

#### _onAnimate() Method (lines 28094-28298)
- Separate uniform updates for both filters
- Pattern filter: time, weather, coordinates
- Shadow filter: weather darkness, time-of-day tint, texture reference
- Render `_patternGeneratorSprite` to `rawCloudTexture` at half-resolution
- Pass texture to shadow filter via `uCloudTexture` uniform

#### _updateUniformPositions() Method (lines 28301-28320)
- Updates coordinate uniforms for BOTH filters

#### updateFromConfig() Method (lines 28322-28441)
- Pattern filter: FBM settings, noise params, layer configs, evolution speed
- Shadow filter: shadow intensity, occlusion settings

#### _tearDown() Method (lines 28459-28483)
- Properly destroys both filters

## Architecture Flow

```
Frame N:
1. Update pattern filter uniforms (time, weather, coords)
2. Render _patternGeneratorSprite → rawCloudTexture (half-res)
   └─ CloudShadowsFilterEnhanced calculates FBM ONCE
3. Update shadow filter uniforms (weather, tint, texture)
4. Render canvas.primary with CloudShadowApplyFilter
   └─ Samples rawCloudTexture, applies shadows (no FBM!)
```

## Verification Checklist
- [ ] Cloud shadows appear identical to before
- [ ] Weather integration works (density, coverage fade)
- [ ] Time-of-day tinting applies correctly
- [ ] Light occlusion functions (lights cut through clouds)
- [ ] Zoom masking threshold works
- [ ] CloudDepthLayer receives correct texture
- [ ] Performance improvement confirmed (~3-4ms gain)

## Next Steps
- Test implementation in Foundry VTT
- Verify all features work correctly
- Measure performance improvement
- Proceed to Phase 4 (lazy rendering) if successful
