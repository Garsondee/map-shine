/**
 * CloudShadowsFilterEnhanced - Enhanced FBM cloud filter with weather and time of day integration
 * 
 * This filter generates realistic clouds using Fractional Brownian Motion (FBM) with domain warping,
 * integrating with weather states (clear, drizzle, rain, storm, snow, blizzard, sleet) and time of day
 * for dynamic cloud appearance, movement, and coloring.
 * 
 * @module {CloudShadowsFilterEnhanced} map-shine
 * @author Garsondee
 * @version 1.8.0
 */

class CloudShadowsFilterEnhanced extends PIXI.Filter {
  constructor(_options = {}) {
    const vertexSrc = `
      attribute vec2 aVertexPosition;
      attribute vec2 aTextureCoord;
      uniform mat3 projectionMatrix;
      varying vec2 vTextureCoord;
      varying vec2 vScreenCoord;

      void main(void) {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
        vScreenCoord = gl_Position.xy * 0.5 + 0.5;
      }
    `;

    const fragmentSrc = `
      precision mediump float;
      varying vec2 vTextureCoord;
      varying vec2 vScreenCoord;

      uniform sampler2D uSampler;
      uniform sampler2D uOutdoorsMask;
      uniform sampler2D uLightPolygonMask;

      // World & Camera
      uniform float u_time;
      uniform vec2 u_camera_offset;
      uniform vec2 u_view_size;
      uniform vec2 u_windDirection;
      uniform vec4 uSceneRectNorm;

      // Weather Integration (NEW)
      uniform float u_weatherDensity;       // Cloud density multiplier (0-1)
      uniform float u_weatherCoverage;      // Cloud coverage threshold adjustment (0-1)
      uniform float u_weatherBrightness;    // Weather-based brightness adjustment
      uniform float u_weatherDarkness;      // Weather-based darkness/shadow intensity
      uniform float u_gustStrength;         // Wind gust strength for turbulence (0-1)

      // Time of Day Integration (NEW)
      uniform vec3 u_timeOfDayTint;         // RGB color tint from time of day
      uniform float u_timeOfDayIntensity;   // Strength of time of day coloring (0-1)

      // Noise & Shading (Base Controls)
      uniform float u_noise_scale;
      uniform int u_noise_octaves;
      uniform float u_noise_persistence;
      uniform float u_noise_lacunarity;
      uniform float u_shading_threshold;
      uniform float u_shading_softness;
      uniform float u_shading_brightness;
      uniform float u_shading_contrast;
      uniform float u_shading_gamma;
      uniform float u_shadowIntensity;
      uniform bool u_outputRawCloud;

      // Light Occlusion
      uniform bool u_occlusionEnabled;
      uniform float u_occlusionIntensity;

      // Layer Configuration (6 layers + evolution)
      uniform bool u_layer1_enabled;
      uniform float u_layer1_scale;
      uniform float u_layer1_speed;
      uniform vec2 u_layer1_stretch;
      uniform int u_layer1_octaves;
      uniform float u_layer1_opacity;
      uniform float u_layer1_parallaxDepth;

      uniform bool u_layer2_enabled;
      uniform float u_layer2_scale;
      uniform float u_layer2_speed;
      uniform vec2 u_layer2_stretch;
      uniform int u_layer2_octaves;
      uniform float u_layer2_opacity;
      uniform float u_layer2_parallaxDepth;

      uniform bool u_layer3_enabled;
      uniform float u_layer3_scale;
      uniform float u_layer3_speed;
      uniform vec2 u_layer3_stretch;
      uniform int u_layer3_octaves;
      uniform float u_layer3_opacity;
      uniform float u_layer3_parallaxDepth;

      uniform bool u_layer4_enabled;
      uniform float u_layer4_scale;
      uniform float u_layer4_speed;
      uniform vec2 u_layer4_stretch;
      uniform int u_layer4_octaves;
      uniform float u_layer4_opacity;
      uniform float u_layer4_parallaxDepth;

      uniform bool u_layer5_enabled;
      uniform float u_layer5_scale;
      uniform float u_layer5_speed;
      uniform vec2 u_layer5_stretch;
      uniform int u_layer5_octaves;
      uniform float u_layer5_opacity;
      uniform float u_layer5_parallaxDepth;

      uniform bool u_layer6_enabled;
      uniform float u_layer6_scale;
      uniform float u_layer6_speed;
      uniform vec2 u_layer6_stretch;
      uniform int u_layer6_octaves;
      uniform float u_layer6_opacity;
      uniform float u_layer6_parallaxDepth;
      uniform float u_layer6_warpStrength;
      uniform float u_layer6_warpScale;
      uniform bool u_layer6_additive;

      // Evolution (shape morphing over time)
      uniform float u_evolutionSpeed;

      // === NOISE FUNCTIONS ===
      float random(vec2 st) { 
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); 
      }
      
      float random3d(vec3 st) { 
        return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123); 
      }
      
      float noise(vec2 st) {
        vec2 i = floor(st); 
        vec2 f = fract(st);
        float a = random(i); 
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0)); 
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
      }
      
      float noise3d(vec3 st) {
        vec3 i = floor(st); 
        vec3 f = fract(st);
        // 8 corners of a cube
        float a = random3d(i);
        float b = random3d(i + vec3(1.0, 0.0, 0.0));
        float c = random3d(i + vec3(0.0, 1.0, 0.0));
        float d = random3d(i + vec3(1.0, 1.0, 0.0));
        float e = random3d(i + vec3(0.0, 0.0, 1.0));
        float f2 = random3d(i + vec3(1.0, 0.0, 1.0));
        float g = random3d(i + vec3(0.0, 1.0, 1.0));
        float h = random3d(i + vec3(1.0, 1.0, 1.0));
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
          mix(mix(e, f2, u.x), mix(g, h, u.x), u.y), 
          u.z
        );
      }

      // === CORE FBM FUNCTION ===
      float fbm3d(vec3 st, int octaves, float persistence, float lacunarity) {
        float value = 0.0; 
        float amplitude = 0.5;
        for (int i = 0; i < 10; i++) {
          if (i >= octaves) break;
          value += amplitude * noise3d(st);
          st *= lacunarity;
          amplitude *= persistence;
        }
        return value;
      }

      // === DOMAIN-WARPED FBM (with gust turbulence) ===
      // This is the enhanced cloud generation function with domain warping for realistic turbulence
      float cloudFBM(vec3 position, int octaves, float persistence, float lacunarity) {
        // Apply gust-based domain warping for increased turbulence during high winds
        float warpScale = 0.5 + u_gustStrength * 1.5;  // Scale warping with gusts
        vec3 warpOffset = vec3(
          fbm3d(position * warpScale, 3, 0.5, 2.0),
          fbm3d(position * warpScale + vec3(5.2, 1.3, 0.0), 3, 0.5, 2.0),
          fbm3d(position * warpScale + vec3(0.0, 5.2, 1.3), 3, 0.5, 2.0)
        ) * 0.3 * (0.5 + u_gustStrength * 0.5);  // Warp strength increases with gusts
        
        vec3 warpedPosition = position + warpOffset;
        return fbm3d(warpedPosition, octaves, persistence, lacunarity);
      }

      // === SHADING CONTROLS (with weather modulation) ===
      float applyShadingControls(float value) {
        // Apply weather-based brightness adjustment
        value += u_shading_brightness + (u_weatherBrightness - 1.0) * 0.3;
        
        // Apply contrast
        value = (value - 0.5) * u_shading_contrast + 0.5;
        
        // Apply weather-modified threshold (coverage control)
        float adjustedThreshold = u_shading_threshold * (1.0 - u_weatherCoverage * 0.3);
        value = smoothstep(adjustedThreshold, adjustedThreshold + u_shading_softness, value);
        
        // Apply gamma correction
        if (u_shading_gamma > 0.0) { 
          value = pow(value, u_shading_gamma); 
        }
        
        // Apply weather density modulation
        value *= u_weatherDensity;
        
        return clamp(value, 0.0, 1.0);
      }

      void main() {
        // === SCENE BOUNDS CHECK ===
        vec2 sceneMin = uSceneRectNorm.xy;
        vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
        if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x ||
            vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
          return;
        }

        // === MASK SAMPLING ===
        float maskValue = texture2D(uOutdoorsMask, vTextureCoord).r;
        if (maskValue < 0.01 && !u_outputRawCloud) {
          gl_FragColor = texture2D(uSampler, vTextureCoord);
          return;
        }

        // === CLOUD GENERATION ===
        float shadedCloudValue = 0.0;
        {
          // Calculate world position (unaffected by zoom)
          vec2 canvasScreenCoord = vScreenCoord * u_view_size;
          vec2 worldCoord = canvasScreenCoord + u_camera_offset;
          vec2 corrected_coord = worldCoord;

          // Evolution Z-coordinate for 3D morphing
          float evolutionZ = u_time * u_evolutionSpeed;

          // Multiplicative layer blending (shadow accumulation)
          float shadow = 1.0;

          // === LAYER 1: High Altitude (Fast, Large, Wispy) ===
          if (u_layer1_enabled) {
            vec2 parallax_offset1 = u_camera_offset * u_layer1_parallaxDepth * 0.001;
            vec2 layer1_coord = corrected_coord + parallax_offset1;
            vec2 layer1_uv = (layer1_coord / 100.0 * u_noise_scale) * u_layer1_scale * u_layer1_stretch;
            layer1_uv += u_time * u_windDirection * u_layer1_speed;
            
            float layer1_raw = cloudFBM(vec3(layer1_uv, evolutionZ), u_layer1_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer1_value = applyShadingControls(layer1_raw);
            shadow *= (1.0 - layer1_value * u_layer1_opacity);
          }

          // === LAYER 2: Mid Altitude (Medium Speed/Scale) ===
          if (u_layer2_enabled) {
            vec2 parallax_offset2 = u_camera_offset * u_layer2_parallaxDepth * 0.001;
            vec2 layer2_coord = corrected_coord + parallax_offset2;
            vec2 layer2_uv = (layer2_coord / 100.0 * u_noise_scale) * u_layer2_scale * u_layer2_stretch;
            layer2_uv += u_time * u_windDirection * u_layer2_speed;
            
            float layer2_raw = cloudFBM(vec3(layer2_uv, evolutionZ * 0.8), u_layer2_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer2_value = applyShadingControls(layer2_raw);
            shadow *= (1.0 - layer2_value * u_layer2_opacity);
          }

          // === LAYER 3: Low Altitude (Slow, Small, Dense) ===
          if (u_layer3_enabled) {
            vec2 parallax_offset3 = u_camera_offset * u_layer3_parallaxDepth * 0.001;
            vec2 layer3_coord = corrected_coord + parallax_offset3;
            vec2 layer3_uv = (layer3_coord / 100.0 * u_noise_scale) * u_layer3_scale * u_layer3_stretch;
            layer3_uv += u_time * u_windDirection * u_layer3_speed;
            
            float layer3_raw = cloudFBM(vec3(layer3_uv, evolutionZ * 0.6), u_layer3_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer3_value = applyShadingControls(layer3_raw);
            shadow *= (1.0 - layer3_value * u_layer3_opacity);
          }

          // === LAYER 4: Extra Altitude ===
          if (u_layer4_enabled) {
            vec2 parallax_offset4 = u_camera_offset * u_layer4_parallaxDepth * 0.001;
            vec2 layer4_coord = corrected_coord + parallax_offset4;
            vec2 layer4_uv = (layer4_coord / 100.0 * u_noise_scale) * u_layer4_scale * u_layer4_stretch;
            layer4_uv += u_time * u_windDirection * u_layer4_speed;
            
            float layer4_raw = cloudFBM(vec3(layer4_uv, evolutionZ * 0.4), u_layer4_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer4_value = applyShadingControls(layer4_raw);
            shadow *= (1.0 - layer4_value * u_layer4_opacity);
          }

          // === LAYER 5: Extra Altitude ===
          if (u_layer5_enabled) {
            vec2 parallax_offset5 = u_camera_offset * u_layer5_parallaxDepth * 0.001;
            vec2 layer5_coord = corrected_coord + parallax_offset5;
            vec2 layer5_uv = (layer5_coord / 100.0 * u_noise_scale) * u_layer5_scale * u_layer5_stretch;
            layer5_uv += u_time * u_windDirection * u_layer5_speed;
            
            float layer5_raw = cloudFBM(vec3(layer5_uv, evolutionZ * 0.2), u_layer5_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer5_value = applyShadingControls(layer5_raw);
            shadow *= (1.0 - layer5_value * u_layer5_opacity);
          }

          // Convert shadow (light transmission) to cloud value
          shadedCloudValue = 1.0 - shadow;

          // === LAYER 6: Wispy Domain-Warped Edges (Additive) ===
          if (u_layer6_enabled && !u_outputRawCloud) {
            vec2 parallax_offset6 = u_camera_offset * u_layer6_parallaxDepth * 0.001;
            vec2 layer6_coord = corrected_coord + parallax_offset6;
            vec2 layer6_base_uv = (layer6_coord / 100.0 * u_noise_scale) * u_layer6_scale * u_layer6_stretch;
            layer6_base_uv += u_time * u_windDirection * u_layer6_speed;

            // Domain warping for turbulent wispy edges
            vec2 warp_uv = layer6_base_uv * u_layer6_warpScale;
            float warp_x = fbm3d(vec3(warp_uv, evolutionZ * 1.3), 4, u_noise_persistence, u_noise_lacunarity);
            float warp_y = fbm3d(vec3(warp_uv + vec2(5.2, 1.3), evolutionZ * 1.3), 4, u_noise_persistence, u_noise_lacunarity);
            vec2 warped_uv = layer6_base_uv + vec2(warp_x, warp_y) * u_layer6_warpStrength;

            float layer6_raw = fbm3d(vec3(warped_uv, evolutionZ * 0.15), u_layer6_octaves, u_noise_persistence, u_noise_lacunarity);
            float layer6_value = applyShadingControls(layer6_raw);

            if (u_layer6_additive) {
              shadedCloudValue = clamp(shadedCloudValue + layer6_value * u_layer6_opacity, 0.0, 1.0);
            } else {
              shadedCloudValue = clamp(shadedCloudValue * (1.0 - layer6_value * u_layer6_opacity), 0.0, 1.0);
            }
          }
        }

        // === RAW CLOUD OUTPUT (for texture generation) ===
        if (u_outputRawCloud) {
          gl_FragColor = vec4(vec3(shadedCloudValue), 1.0);
          return;
        }

        // === FINAL COMPOSITING ===
        vec4 originalColor = texture2D(uSampler, vTextureCoord);
        if (maskValue < 0.01) {
          gl_FragColor = originalColor;
          return;
        }

        // Calculate shadow amount with weather darkness modulation
        float shadowAmount = shadedCloudValue * maskValue * u_shadowIntensity * u_weatherDarkness;

        // Light occlusion (lights cut through clouds)
        if (u_occlusionEnabled) {
          float lightMaskValue = texture2D(uLightPolygonMask, vScreenCoord).r;
          shadowAmount *= (1.0 - lightMaskValue * u_occlusionIntensity);
        }

        shadowAmount = clamp(shadowAmount, 0.0, 1.0);
        
        // Apply shadow darkening
        vec3 finalColor = originalColor.rgb * (1.0 - shadowAmount);
        
        // === TIME OF DAY TINTING (Applied to cloud shadows) ===
        // Blend time of day color into the shadowed areas
        if (u_timeOfDayIntensity > 0.0) {
          vec3 tintedShadow = mix(vec3(0.0), u_timeOfDayTint, u_timeOfDayIntensity);
          finalColor = mix(finalColor, finalColor * (1.0 + tintedShadow * shadowAmount), shadowAmount);
        }
        
        gl_FragColor = vec4(finalColor, originalColor.a);
      }
    `;

    // Initialize shader with uniforms
    super(vertexSrc, fragmentSrc, {
      uOutdoorsMask: PIXI.Texture.EMPTY,
      uLightPolygonMask: PIXI.Texture.EMPTY,

      // World & Camera
      u_time: 0.0,
      u_camera_offset: [0, 0],
      u_view_size: [0, 0],
      uSceneRectNorm: [0, 0, 1, 1],
      u_windDirection: [0.01, 0.01],

      // Weather Integration (NEW)
      u_weatherDensity: 0.5,
      u_weatherCoverage: 0.5,
      u_weatherBrightness: 1.0,
      u_weatherDarkness: 0.5,
      u_gustStrength: 0.0,

      // Time of Day Integration (NEW)
      u_timeOfDayTint: [1.0, 1.0, 1.0],
      u_timeOfDayIntensity: 0.0,

      // Noise & Shading
      u_noise_scale: 0.1,
      u_noise_octaves: 5,
      u_noise_persistence: 0.5,
      u_noise_lacunarity: 2.5,
      u_shading_threshold: 1.0,
      u_shading_softness: 0.2,
      u_shading_brightness: 0.51,
      u_shading_contrast: 1.0,
      u_shading_gamma: 1.0,
      u_shadowIntensity: 0.5,
      u_outputRawCloud: false,

      // Light Occlusion
      u_occlusionEnabled: true,
      u_occlusionIntensity: 1.0,

      // Layer 1: High altitude
      u_layer1_enabled: true,
      u_layer1_scale: 4.0,
      u_layer1_speed: 2.5,
      u_layer1_stretch: [1.0, 1.0],
      u_layer1_octaves: 3,
      u_layer1_opacity: 0.3,
      u_layer1_parallaxDepth: 0.1,

      // Layer 2: Mid altitude
      u_layer2_enabled: true,
      u_layer2_scale: 1.5,
      u_layer2_speed: 1.3,
      u_layer2_stretch: [1.0, 1.0],
      u_layer2_octaves: 5,
      u_layer2_opacity: 0.5,
      u_layer2_parallaxDepth: 0.3,

      // Layer 3: Low altitude
      u_layer3_enabled: true,
      u_layer3_scale: 0.7,
      u_layer3_speed: 0.7,
      u_layer3_stretch: [1.0, 1.0],
      u_layer3_octaves: 6,
      u_layer3_opacity: 0.6,
      u_layer3_parallaxDepth: 0.5,

      // Layer 4: Extra altitude
      u_layer4_enabled: true,
      u_layer4_scale: 2.5,
      u_layer4_speed: 1.8,
      u_layer4_stretch: [1.0, 1.0],
      u_layer4_octaves: 4,
      u_layer4_opacity: 0.4,
      u_layer4_parallaxDepth: 0.2,

      // Layer 5: Extra altitude
      u_layer5_enabled: true,
      u_layer5_scale: 5.0,
      u_layer5_speed: 3.0,
      u_layer5_stretch: [1.0, 1.0],
      u_layer5_octaves: 2,
      u_layer5_opacity: 0.2,
      u_layer5_parallaxDepth: 0.15,

      // Layer 6: Wispy domain-warped edges
      u_layer6_enabled: true,
      u_layer6_scale: 1.2,
      u_layer6_speed: 4.5,
      u_layer6_stretch: [1.5, 1.0],
      u_layer6_octaves: 7,
      u_layer6_opacity: 0.15,
      u_layer6_parallaxDepth: 0.0,
      u_layer6_warpStrength: 0.3,
      u_layer6_warpScale: 2.5,
      u_layer6_additive: true,

      // Evolution
      u_evolutionSpeed: 0.001,
    });
  }
}
