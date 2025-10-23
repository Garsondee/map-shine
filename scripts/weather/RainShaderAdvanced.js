/**
 * Advanced Rain Shader - Pure Orthographic Bird's-Eye Top-Down View
 * 
 * CRITICAL PERSPECTIVE CONSTRAINT:
 * This shader is designed for a **non-perspective, orthographic, bird's-eye view**
 * looking straight down at the ground from above. The camera never tilts or rotates.
 * 
 * WIND DIRECTION:
 * - Rain falls and moves in the direction the wind is pointing
 * - Streak orientation aligned with wind direction
 * - Wind SPEED and GUSTS do not affect the rain (constant animation)
 * - Multi-layer depth parallax for volumetric atmosphere
 * 
 * PHASE 1 ENHANCEMENTS:
 * - Multi-layer depth parallax (3-5 layers simulating different heights)
 * - Dynamic streak length/width based on wind strength
 * - Temporal intensity pulsing for natural fluctuations
 * 
 * PHASE 2 ENHANCEMENTS:
 * - Turbulent density variation (pockets of heavier/lighter rain)
 * - Raindrop size variation (individual drop size differences)
 * - Per-drop random lifetime (drops spawn, fall, and impact at different times)
 * - Impact flash effect (brightness boost just before drops disappear)
 * 
 * PHASE 3 ENHANCEMENTS:
 * - Rain curtain effect (large-scale sweeping sheets)
 * - Atmospheric perspective fade (distance-based opacity)
 * - Enhanced edge variation (natural streak tips)
 * 
 * Implementation:
 * - Rotate Voronoi grid to align streaks with wind direction
 * - Scroll pattern in wind direction to simulate wind-blown movement
 * - Per-cell random lifetime with 4-stage envelope (spawn→fall→flash→impact)
 * - Layer-specific lifetimes: far layers (2.0s) fall longer than near layers (0.5s)
 * - Impact flash: subtle 20% brightness boost (0.70→0.88 of lifetime)
 * - Smooth fade-in (0-20%) and fade-out (88-100%) prevent flickering
 * - Variable density controlled by resolution uniform
 * - Layered rendering for atmospheric depth
 */
import { WeatherShaderBase } from './WeatherShaderBase.js';

export class RainShaderAdvanced extends WeatherShaderBase {
  
  // SHADER VERSION - Increment this to force recompilation
  static SHADER_VERSION = "2.1.1-DOUBLE-LIFETIME-WIND";
  
  constructor(...args) {
    super(...args);
    console.warn(`🔧 MapShine | RainShaderAdvanced ${RainShaderAdvanced.SHADER_VERSION} initialized`);
  }
  
  /**
   * Default uniform values for pure top-down rain
   */
  static defaultUniforms = {
    opacity: 1,
    intensity: 1,              // Brightness of rain streaks
    strength: 1,               // Contrast/sharpness of streaks
    windDirection: [0, -1],    // Wind direction vector (default: south in screen coords)
    windStrength: 0.5,         // 0-1 normalized wind intensity
    rainDensity: 1.0,          // Overall rain amount (controls drop spawn rate via threshold)
    baseResolution: 3200,      // Base resolution for streak density
    streakLength: 80,          // Perpendicular resolution (controls streak thinness)
    splashIntensity: 0.5,      // Ground splash particle brightness (0=none, 1=normal, 2=very bright)
    waveMaskIntensity: 0.7,    // Wavy gap cutout strength (0=uniform rain, 1=normal, 2=dramatic gaps)
    curtainIntensity: 0.5,     // Rain curtain sweep strength (0=none, 1=normal, 2=dramatic sheets)
    worleySpeed: 1.0           // Speed multiplier for Worley noise patterns (splashes/gaps) (0.5=slow, 1.0=normal, 2.0=fast)
  };

  /**
   * Fragment shader for pure top-down rain with Phase 1 & Phase 2 enhancements
   */
  static fragmentShader = `
    ${this.FRAGMENT_HEADER}
    ${this.CONSTANTS}
    ${this.PERCEIVED_BRIGHTNESS}
    ${this.ROTATION}
    ${this.PRNG}
    ${this.VORONOI}
    
    uniform float intensity;
    uniform float opacity;
    uniform float strength;
    uniform vec2 windDirection;
    uniform float windStrength;
    uniform float rainDensity;
    uniform float baseResolution;
    uniform float streakLength;
    uniform float splashIntensity;
    uniform float waveMaskIntensity;
    uniform float curtainIntensity;
    uniform float worleySpeed;

    // PHASE 2 FEATURE: Smooth noise for turbulent density variation
    float smoothNoise(in vec2 coords) {
      vec2 i = floor(coords);
      vec2 f = fract(coords);
      
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 cb = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, cb.x) + (c - a) * cb.y * (1.0 - cb.x) + (d - b) * cb.x * cb.y;
    }
    
    // PHASE 2 FEATURE: Simplified 2-octave FBM for density pockets
    float densityNoise(in vec2 uv) {
      float r = 0.0;
      // First octave (large scale features)
      r += smoothNoise(uv * 0.5 + time * 0.02) * 0.6;
      // Second octave (medium detail)
      r += smoothNoise(uv * 1.5 + time * 0.04) * 0.4;
      return r;
    }
    
    // PHASE 3 FEATURE: Rain curtain effect (large-scale Voronoi sheets)
    // Creates dramatic sweeping curtains of heavier rain
    float rainCurtain(in vec2 uv) {
      // Very large scale Voronoi for massive rain sheets
      // Scroll slowly in wind direction
      vec2 curtainUV = uv * 0.8 - windDirection * time * 0.15;
      
      // Generate large Voronoi cells
      vec3 curtainVoronoi = voronoi(curtainUV, time * 0.3, 20.0);
      
      // Use distance field to create curtain boundaries
      // Closer to cell center = heavier rain
      float curtainPattern = 1.0 - smoothstep(0.2, 0.8, curtainVoronoi.z);
      
      // Add some variation to curtain strength using cell position
      float curtainVariation = random(floor(curtainUV)) * 0.3 + 0.7;  // 0.7-1.0
      
      // Scale curtain effect by wind strength (stronger wind = more dramatic curtains)
      // Light wind: minimal curtain effect, Storm: dramatic sheets
      float curtainScale = windStrength * windStrength;  // Quadratic for dramatic scaling
      
      // Return intensity boost: curtainIntensity controls effect directly
      // 0.0 = no effect (returns 1.0), 1.0 = full effect (up to 2.0x boost), 2.0 = dramatic (up to 3.0x boost)
      // curtainPattern and curtainVariation provide the spatial pattern
      // windStrength modulates but doesn't dominate (square root for gentler scaling)
      float curtainEffect = curtainPattern * curtainVariation * sqrt(curtainScale);
      return 1.0 + (curtainEffect * curtainIntensity * 2.0);
    }
    
    // PHASE 3 FEATURE: Atmospheric perspective fade
    // Creates distance-based fadeout for enhanced depth perception
    float atmosphericFade(in vec2 uv) {
      // Calculate distance from screen center
      vec2 centered = uv - 0.5;
      float distFromCenter = length(centered);
      
      // Fade out towards edges (subtle effect)
      // Center: 1.0 (full intensity), Edges: 0.6 (40% fadeout)
      // Using smoothstep for natural falloff
      float fade = 1.0 - smoothstep(0.3, 0.7, distFromCenter) * 0.4;
      
      return fade;
    }
    
    // Vec2 random function (separate from float random to avoid name collision)
    vec2 random2(in vec2 uv) {
      vec2 uvf = fract(uv * vec2(0.1031, 0.1030));
      uvf += dot(uvf, uvf.yx + 19.19);
      return fract((uvf.x + uvf.y) * uvf);
    }
    
    // Worley/Cellular noise for splash pattern (from SheetRainShader)
    float worleyNoise(in vec2 uv, in float scale) {
      vec2 id = floor(uv * scale);
      vec2 p = fract(uv * scale);
      
      float minDist = 1.0;
      
      // Check 3x3 neighborhood
      for (float y = -1.0; y <= 1.0; y++) {
        for (float x = -1.0; x <= 1.0; x++) {
          vec2 neighbor = vec2(x, y);
          vec2 point = random2(id + neighbor);
          vec2 diff = neighbor + point - p;
          float dist = length(diff);
          minDist = min(minDist, dist);
        }
      }
      
      return minDist;
    }
    
    // NEW FEATURE: Round ground splash particles (top-down view)
    // Uses DUAL Worley noise intersection for more complex, interesting patterns
    // WIND DIRECTION: Splashes move in wind direction, ignoring speed/gusts
    float computeGroundSplashes(in vec2 uv) {
      // === FIRST WORLEY LAYER ===
      // Animate splash UV in wind direction with configurable speed
      vec2 splashUV1 = uv * 3.0 - windDirection * time * 0.3 * worleySpeed;
      
      // MAXIMUM CHAOTIC DISTORTION: Multi-scale noise for fuzzy, rough splashes
      // Large-scale chaos
      float distort1 = smoothNoise(uv * 1.5 + time * 1.2) * 0.4;
      float distort2 = smoothNoise(uv * 4.0 - time * 1.8) * 0.25;
      // Medium-scale roughness
      float distort3 = smoothNoise(uv * 8.0 + time * 2.5) * 0.15;
      // Small-scale fuzziness  
      float distort4 = smoothNoise(uv * 15.0 - time * 3.0) * 0.08;
      
      splashUV1.x += distort1 + distort2 + distort3;
      splashUV1.y += distort4 + sin(uv.x * 8.0 + time * 3.0) * 0.25;
      splashUV1 += vec2(cos(time * 1.5), sin(time * 1.7)) * 0.1;  // Organic drift
      
      // Generate first Worley noise pattern
      float worley1 = worleyNoise(splashUV1, 4.0);
      worley1 = smoothstep(0.3, 0.8, worley1);  // Wider, softer range
      
      // === SECOND WORLEY LAYER (offset seed and different animation) ===
      vec2 splashUV2 = uv * 3.2 - windDirection * time * 0.26 * worleySpeed + vec2(137.5, 249.8);  // Large offset for different seed, slightly different speed
      
      // Different distortion pattern for variety
      float distort5 = smoothNoise(uv * 2.0 - time * 1.5) * 0.35;
      float distort6 = smoothNoise(uv * 5.0 + time * 2.0) * 0.2;
      float distort7 = smoothNoise(uv * 10.0 - time * 2.8) * 0.12;
      
      splashUV2.x += distort5 + distort6;
      splashUV2.y += distort7 + cos(uv.y * 7.0 - time * 2.5) * 0.2;
      splashUV2 += vec2(sin(time * 1.8), cos(time * 1.4)) * 0.15;  // Different organic drift
      
      // Generate second Worley noise pattern at slightly different scale
      float worley2 = worleyNoise(splashUV2, 3.5);  // Slightly different scale for variation
      worley2 = smoothstep(0.25, 0.75, worley2);  // Similar range but slightly different thresholds
      
      // === INTERSECTION: Only show splashes where BOTH patterns are active ===
      // Multiply the two patterns to get intersection
      float splashNoise = worley1 * worley2;
      
      // Add noise roughness to break up uniformity
      splashNoise *= 0.7 + smoothNoise(uv * 20.0 + time * 4.0) * 0.3;
      
      // VISIBILITY MASKING: Hide ~50% of splashes using animated noise
      // Creates natural variation where splashes appear/disappear
      vec2 maskUV = uv * 2.5 - windDirection * time * 0.16 * worleySpeed + vec2(500.0, 500.0);  // Offset for different pattern, moves with wind
      float visibilityMask = smoothNoise(maskUV + time * 0.5);
      visibilityMask += smoothNoise(maskUV * 2.0 - time * 0.7) * 0.5;  // Add detail layer
      visibilityMask = smoothstep(0.3, 0.7, visibilityMask);  // Soft transitions, targets ~50% visibility
      
      // Apply visibility mask to splashes
      splashNoise *= visibilityMask;
      
      // BOOSTED: Maximum splash intensity with roughness
      // Increased multiplier since intersection reduces overall brightness
      return splashNoise * 0.8;  // Scale for blending with rain (boosted from 0.5)
    }
    
    // NEW FEATURE: Worley noise cutout mask for rainfall gaps
    // Uses same Worley noise as splashes but offset in UV space to create moving gaps
    // WIND DIRECTION: Gaps move in wind direction, ignoring speed/gusts
    float computeWavySheetMask(in vec2 uv) {
      // Large-scale UV for broad rain gaps (offset from splash UV space)
      vec2 maskUV = uv * 1.2 - windDirection * time * 0.05 * worleySpeed + vec2(100.0, 100.0);  // Offset by 100 for different pattern, moves with wind
      
      // Add organic distortion to mask edges
      float drift1 = smoothNoise(uv * 0.8 + time * 0.3) * 0.3;
      float drift2 = smoothNoise(uv * 2.0 - time * 0.5) * 0.15;
      maskUV.x += drift1;
      maskUV.y += drift2;
      
      // Generate Worley mask pattern at larger scale for broad gaps
      float maskPattern = worleyNoise(maskUV, 2.5);  // Lower scale = larger cells = broader gaps
      
      // Invert so Worley cells become gaps
      maskPattern = 1.0 - maskPattern;
      
      // Soft remapping for gradual transitions (not harsh cutouts)
      // This creates gentle fading between rain and gaps
      maskPattern = smoothstep(0.2, 0.7, maskPattern);  // Wide range = soft transitions
      
      // Remap to 0.3-1.0 range (gaps reduce rain to 30%, dense areas at 100%)
      maskPattern = 0.3 + maskPattern * 0.7;
      
      return maskPattern;
    }

    // Compute rain layer with dynamic streak properties
    // layerDepth: 0.0 = far (high altitude), 1.0 = near (ground level)
    // WIND DIRECTION: Rain moves in wind direction, ignoring speed/gusts
    float computeRainLayer(vec2 baseUV, float layerDepth, float layerOffset) {
      // DISABLED: No turbulent density variation for debugging
      float localDensity = 1.0;
      
      // Calculate wind angle from direction vector for streak rotation
      // Rain streaks align perpendicular to wind direction
      float windAngle = atan(-windDirection.y, windDirection.x);
      float streakAngle = windAngle + 1.5707963267948966;  // windAngle + π/2
      mat2 rotMatrix = rot(streakAngle);
      
      // Layer-specific speed (closer layers move faster = parallax)
      // Far layers: 0.5x speed, Near layers: 1.5x speed
      float speedMultiplier = 0.5 + layerDepth * 1.0;
      
      // Apply parallax scrolling in wind direction with layer-specific speed
      // CONSTANT speed - NOT affected by windStrength or gusts
      // DOUBLED wind influence: 0.2 → 0.4 for more visible wind drift
      vec2 uv = baseUV - windDirection * time * 0.4 * speedMultiplier;
      
      // Add layer offset for temporal variation (prevents all layers from syncing)
      uv += windDirection * layerOffset;
      
      // Rotate UV space to align with wind direction
      vec2 rotatedUV = uv * rotMatrix;
      
      // Fixed streak properties - NOT affected by wind speed/gusts
      // Consistent appearance regardless of wind variations
      float dynamicStreakWidth = 1.0;
      float windStreakExtension = 1.0;
      
      // Layer-specific size variation (closer = larger drops)
      // Far: 0.7x size, Near: 1.3x size
      float layerSizeScale = 0.7 + layerDepth * 0.6;
      
      // Apply resolution with dynamic properties
      // X-axis: Along streak direction (density controlled by baseResolution)
      // Y-axis: Perpendicular to streak (INVERTED: lower value = longer streaks)
      vec2 resolution = vec2(
        baseResolution * dynamicStreakWidth * layerSizeScale * localDensity,
        (8000.0 / streakLength) * layerSizeScale / windStreakExtension
      );
      vec2 st = rotatedUV * resolution;
      
      // Generate Voronoi cells with layer-specific time offset
      vec3 voronoiResult = voronoi(vec3(st, time * 0.5 + layerOffset), 10.0);
      
      // RAINDROP SPAWN THRESHOLD: Per-cell random check to spawn or skip this drop
      // ULTRA-AGGRESSIVE curve for extreme sparsity at low values, natural density at high values
      // rainDensity: 0.0 = 0%, 0.05 = ~0.002% (handful), 0.5 = 1.6% (light), 1.0 = 16% (normal), 2.0 = 64% (heavy), 3.0 = 95% (storm)
      
      // CRITICAL FIX: Early return if rainDensity is zero to avoid ALL raindrop generation
      if (rainDensity <= 0.0) {
        return 0.0;  // No rain at all when density is zero
      }
      
      // SIMPLIFIED: Direct linear scaling for predictable density control
      // rainDensity 0.0 = 0% spawn, 0.005 = 0.00275% per layer (~158 drops on 4K)
      // Designed for 5-layer parallax: 0.005 × 5 layers = ~790 drops total (slight drizzle)
      float densityThreshold = clamp(rainDensity * 0.00000055, 0.0, 0.95);
      
      vec2 cellID = floor(st);  // Unique ID for this Voronoi cell
      float cellRandom = random(cellID + vec2(layerOffset, layerDepth));  // 0-1 per cell
      
      // If this cell's random value is above threshold, skip raindrop generation
      if (cellRandom > densityThreshold) {
        return 0.0;  // No raindrop in this cell
      }
      
      // PHASE 2 FEATURE: Raindrop size variation
      // Use Voronoi cell position to generate per-drop size variation
      // Different drops within the same layer have different sizes
      float dropSeed = voronoiResult.x + voronoiResult.y;  // Unique per Voronoi cell
      float dropSizeVariation = 0.5 + random(vec2(dropSeed, layerDepth)) * 0.5;  // 0.5x to 1.0x
      
      // RAINDROP LIFETIME: Each drop has unique lifetime before "impact"
      // Far layers (high altitude) have longer lifetimes than near layers (low altitude)
      // DOUBLED lifetime: Far: 4.0s, Near: 1.0s (so particles reach the floor)
      float baseLifetime = 4.0 - layerDepth * 3.0;  // Far: 4.0s, Near: 1.0s
      float lifetimeVariation = 0.7 + random(cellID + vec2(dropSeed, 0.0)) * 0.6;  // 0.7-1.3x variation
      float dropLifetime = baseLifetime * lifetimeVariation;
      
      // Calculate drop age (0.0 = just spawned, 1.0 = impact)
      // Use cell-specific offset for staggered timing
      float cellTimeOffset = random(cellID) * dropLifetime;
      float dropAge = mod(time * 0.5 + layerOffset + cellTimeOffset, dropLifetime) / dropLifetime;
      
      // LIFETIME ENVELOPE: 4-stage lifecycle
      // Stage 1 (0.0-0.20): Fade in from spawn
      // Stage 2 (0.20-0.80): Fully visible (falling)
      // Stage 3 (0.80-0.90): Brighten (approaching ground) - IMPACT FLASH
      // Stage 4 (0.90-1.0): Fade out (impact)
      
      float lifetimeAlpha = 1.0;
      lifetimeAlpha *= smoothstep(0.0, 0.20, dropAge);      // Gradual fade in at spawn
      lifetimeAlpha *= 1.0 - smoothstep(0.90, 1.0, dropAge); // Gradual fade out at impact (90%+)
      
      // Impact flash: subtle brightness boost as drop approaches ground
      // Ramps up 0.80→0.85, peaks at 0.85, ramps down 0.85→0.90
      // Ends before fade-out (0.90) to prevent flickering
      float impactPhase = smoothstep(0.80, 0.85, dropAge) * smoothstep(0.90, 0.85, dropAge);
      float impactBrightness = impactPhase * 0.2;  // Subtle 20% brightness boost
      
      // Compute rain streak brightness
      float df = perceivedBrightness(voronoiResult);
      
      // Layer-specific strength (closer layers more visible)
      // Modified by per-drop size (smaller drops = fainter)
      float layerStrength = strength * (0.7 + layerDepth * 0.3) * dropSizeVariation;
      
      // PHASE 3 FEATURE: Enhanced edge variation for natural streak tips
      // Each drop gets unique edge characteristics for organic appearance
      float edgeSeed = dropSeed * 1.337;  // Different seed from size variation
      float edgeSharpness = 0.25 + random(vec2(edgeSeed, layerOffset)) * 0.10;  // 0.25-0.35 range
      float edgeFalloff = 0.85 + random(vec2(edgeSeed + 1.0, layerDepth)) * 0.30;  // 0.85-1.15 range
      
      // Two-stage smoothstep with per-drop edge variation
      // edgeSharpness controls inner threshold, edgeFalloff modulates outer threshold
      float rain = (1.0 - smoothstep(-df * layerStrength, df * layerStrength + 0.001, 
                                     1.0 - smoothstep(edgeSharpness, edgeFalloff, voronoiResult.z))) * intensity;
      
      // Layer-specific opacity (far = faded, near = bright)
      // Modified by local density, drop size, AND lifetime
      // BOOSTED: Increased base from 0.3→0.5 and range from 0.7→1.0 for more visible drops
      float layerOpacity = (0.5 + layerDepth * 1.0) * localDensity * dropSizeVariation * lifetimeAlpha;
      
      // Apply impact flash (additive brightness boost)
      rain += impactBrightness * intensity;
      
      return rain * layerOpacity;
    }

    void main() {
      ${this.COMPUTE_MASK}
      
      // === FULL RAIN SYSTEM WITH ALL EFFECTS ===
      
      // Compute base rainfall from multiple parallax layers
      float totalRain = 0.0;
      
      // 5-layer parallax system for depth
      // Layer depths: 0.0 (far), 0.25, 0.5, 0.75, 1.0 (near)
      // Layer offsets: temporal variation to prevent synchronization
      totalRain += computeRainLayer(vUvs, 0.0, 0.0);   // Far layer
      totalRain += computeRainLayer(vUvs, 0.25, 0.8);  // Mid-far layer
      totalRain += computeRainLayer(vUvs, 0.5, 1.6);   // Middle layer
      totalRain += computeRainLayer(vUvs, 0.75, 2.4);  // Mid-near layer
      totalRain += computeRainLayer(vUvs, 1.0, 3.2);   // Near layer
      
      // Normalize by layer count (5 layers)
      totalRain /= 5.0;
      
      // PHASE 3: Apply rain curtain effect (large-scale intensity modulation)
      // curtainIntensity controls strength: 0.0 = no effect, 1.0 = full effect, 2.0 = dramatic
      float curtainMultiplier = rainCurtain(vUvs);
      totalRain *= curtainMultiplier;
      
      // PHASE 3: Apply wavy sheet mask (creates moving gaps in rainfall)
      // waveMaskIntensity controls strength: 0.0 = uniform rain, 1.0 = normal gaps, 2.0 = dramatic gaps
      float waveMask = computeWavySheetMask(vUvs);  // Returns 0.3-1.0 range
      // Lerp between 1.0 (no effect) and waveMask (full effect) based on intensity
      // At intensity=0: always 1.0 (uniform), at intensity=1: use waveMask (0.3-1.0), at intensity=2: exaggerate gaps
      float waveMaskEffect = mix(1.0, waveMask, clamp(waveMaskIntensity, 0.0, 1.0));
      if (waveMaskIntensity > 1.0) {
        // For intensity > 1.0, exaggerate the gaps by reducing the minimum further
        float exaggeration = waveMaskIntensity - 1.0;  // 0.0-1.0 range for values 1.0-2.0
        waveMaskEffect = mix(waveMaskEffect, waveMaskEffect * 0.5, exaggeration);  // Reduce to 50% of normal
      }
      totalRain *= waveMaskEffect;
      
      // PHASE 3: Add ground splashes (rendered ADDITIVELY on top of rain)
      // splashIntensity controls brightness: 0.0 = none, 1.0 = normal, 2.0 = very bright
      float splashes = computeGroundSplashes(vUvs) * splashIntensity;
      totalRain += splashes;  // Additive blending
      
      // PHASE 3: Apply atmospheric perspective fade
      float atmFade = atmosphericFade(vUvs);
      totalRain *= atmFade;
      
      // Final output with all effects combined
      gl_FragColor = vec4(vec3(totalRain) * tint, 1.0) * alpha * mask * opacity;
    }
  `;
}
