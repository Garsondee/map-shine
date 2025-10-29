/**
 * Enhanced Cloud Shadows Filter with FBM Domain Warping
 * 
 * This shader implements an improved cloud generation system inspired by the fog shader's
 * FBM approach, featuring:
 * - Domain-warped FBM for natural billowing turbulence
 * - Reduced complexity (3 layers vs 6, 12 octaves vs 28)
 * - Weather state integration (density, coverage, type)
 * - Wind manager integration with inertia-based movement
 * - Time of day color integration
 * - Hybrid blending for volumetric appearance
 * 
 * @version 1.2.5
 */

export class CloudShadowsFilterEnhanced extends PIXI.Filter {
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

        // Core Noise Settings
        uniform float u_noise_scale;
        uniform float u_noise_persistence;
        uniform float u_noise_lacunarity;

        // Shading & Appearance
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

        // Weather Integration
        uniform float u_weatherDensity;       // 0.2 (clear) to 0.9 (storm)
        uniform float u_weatherCoverage;      // 0.1 (clear) to 1.0 (storm)
        uniform float u_weatherBrightness;    // Top illumination (0.4-1.0)
        uniform float u_weatherDarkness;      // Bottom shadow (0.1-0.8)

        // Time of Day Integration
        uniform vec3 u_timeOfDayTint;         // RGB color from TimeOfDayLayer
        uniform float u_timeOfDayIntensity;   // 0-1, modulated by weather
        
        // Layer 1 (High Altitude - Fast, Large, Wispy)
        uniform bool u_layer1_enabled;
        uniform float u_layer1_scale;
        uniform float u_layer1_speed;
        uniform vec2 u_layer1_stretch;
        uniform int u_layer1_octaves;
        uniform float u_layer1_opacity;
        uniform float u_layer1_parallaxDepth;

        // Layer 2 (Mid Altitude - Medium Speed, Medium Scale)
        uniform bool u_layer2_enabled;
        uniform float u_layer2_scale;
        uniform float u_layer2_speed;
        uniform vec2 u_layer2_stretch;
        uniform int u_layer2_octaves;
        uniform float u_layer2_opacity;
        uniform float u_layer2_parallaxDepth;

        // Layer 3 (Low Altitude - Slow, Small, Dense)
        uniform bool u_layer3_enabled;
        uniform float u_layer3_scale;
        uniform float u_layer3_speed;
        uniform vec2 u_layer3_stretch;
        uniform int u_layer3_octaves;
        uniform float u_layer3_opacity;
        uniform float u_layer3_parallaxDepth;

        // Domain Warping Controls
        uniform float u_warpStrength;         // Strength of domain displacement (0.2-0.8)
        uniform float u_warpScale;            // Scale of warping noise (1.5-3.5)
        uniform float u_gustStrength;         // 0-1 from windManager for turbulence modulation

        // Evolution (shape morphing over time)
        uniform float u_evolutionSpeed;

        // === NOISE FUNCTIONS (2D for better performance) ===
        
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
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
        
        // === FBM WITH DOMAIN WARPING (Inspired by Fog Shader) ===
        
        float fbm(vec2 uv, int octaves) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for (int i = 0; i < 8; i++) {
                if (i >= octaves) break;
                value += amplitude * noise(uv * frequency);
                frequency *= u_noise_lacunarity;
                amplitude *= u_noise_persistence;
            }
            return value;
        }
        
        /**
         * Domain-warped FBM for natural cloud turbulence
         * This creates billowing, organic cloud shapes with curling edges
         */
        float cloudFBM(vec2 uv, float time, int octaves) {
            // Adjust warp strength based on gust intensity
            float dynamicWarpStrength = u_warpStrength * (1.0 + u_gustStrength * 0.3);
            
            // First displacement pass (large-scale turbulence)
            vec2 warp1 = vec2(
                fbm(uv * u_warpScale + time * 0.08, 4),
                fbm(uv * u_warpScale + time * 0.08 + vec2(5.2, 1.3), 4)
            ) * dynamicWarpStrength;
            
            // Second displacement pass (fine-scale turbulence)
            vec2 warp2 = vec2(
                fbm((uv + warp1) * u_warpScale * 2.0 + time * 0.04, 3),
                fbm((uv + warp1) * u_warpScale * 2.0 + time * 0.04 + vec2(2.8, 9.3), 3)
            ) * (dynamicWarpStrength * 0.5);
            
            // Final cloud noise at warped position
            return fbm((uv + warp1 + warp2) * 4.5, octaves);
        }
        
        /**
         * Apply shading controls with fog-style edge softening
         */
        float applyShadingControls(float value) {
            // Apply brightness and contrast adjustments
            value += u_shading_brightness;
            value = (value - 0.5) * u_shading_contrast + 0.5;
            
            // Fog-style perceived brightness smoothing for natural edges
            float brightness = value;
            float softEdge = smoothstep(
                u_shading_threshold - u_shading_softness,
                u_shading_threshold + u_shading_softness,
                brightness
            );
            value *= softEdge;
            
            // Apply gamma
            if (u_shading_gamma > 0.0) {
                value = pow(clamp(value, 0.0, 1.0), u_shading_gamma);
            }
            
            return clamp(value, 0.0, 1.0);
        }

        /**
         * Remap value from old range to new range
         */
        float remap(float value, float oldMin, float oldMax, float newMin, float newMax) {
            return newMin + (value - oldMin) * (newMax - newMin) / (oldMax - oldMin);
        }

        void main() {
            // Scene bounds check
            vec2 sceneMin = uSceneRectNorm.xy;
            vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
            if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x ||
                vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
                if (u_outputRawCloud) {
                    gl_FragColor = vec4(0.0);
                } else {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                }
                return;
            }

            float maskValue = texture2D(uOutdoorsMask, vScreenCoord).r;
            float shadedCloudValue = 0.0;
            
            if (maskValue > 0.01 || u_outputRawCloud) {
                vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                
                // Correct for aspect ratio so noise appears square
                // For widescreen (aspect > 1), compress Y to match X scale
                // This prevents clouds from appearing horizontally squashed
                float aspect = u_view_size.x / u_view_size.y;
                vec2 corrected_coord = world_coord;
                corrected_coord.y /= aspect;  // Divide Y instead of X
                
                vec2 base_uv = corrected_coord / 100.0 * u_noise_scale;
                
                // Evolution time for shape morphing
                float evolutionTime = u_time * u_evolutionSpeed;
                
                // Initialize cloud value (will be used for both tops and shadows)
                float cloudValue = 0.0;
                
                // === LAYER 1: HIGH ALTITUDE (Wispy, bright, backlit) ===
                if (u_layer1_enabled) {
                    vec2 parallax_offset1 = u_camera_offset * u_layer1_parallaxDepth * 0.001;
                    vec2 layer1_coord = corrected_coord + parallax_offset1;
                    vec2 layer1_uv = (layer1_coord / 100.0 * u_noise_scale) * u_layer1_scale * u_layer1_stretch;
                    layer1_uv += u_time * u_windDirection * u_layer1_speed;
                    
                    float layer1_raw = cloudFBM(layer1_uv, evolutionTime, u_layer1_octaves);
                    
                    // Additive blend for bright wispy tops
                    cloudValue += layer1_raw * u_layer1_opacity;
                }
                
                // === LAYER 2: MID ALTITUDE (Main cumulus body) ===
                if (u_layer2_enabled) {
                    vec2 parallax_offset2 = u_camera_offset * u_layer2_parallaxDepth * 0.001;
                    vec2 layer2_coord = corrected_coord + parallax_offset2;
                    vec2 layer2_uv = (layer2_coord / 100.0 * u_noise_scale) * u_layer2_scale * u_layer2_stretch;
                    layer2_uv += u_time * u_windDirection * u_layer2_speed;
                    
                    float layer2_raw = cloudFBM(layer2_uv, evolutionTime * 0.8, u_layer2_octaves);
                    
                    // Hybrid blend: mix additive and multiplicative for volumetric depth
                    cloudValue = mix(cloudValue, cloudValue + layer2_raw * u_layer2_opacity, layer2_raw);
                }
                
                // === LAYER 3: LOW ALTITUDE (Dense stratus base) ===
                if (u_layer3_enabled) {
                    vec2 parallax_offset3 = u_camera_offset * u_layer3_parallaxDepth * 0.001;
                    vec2 layer3_coord = corrected_coord + parallax_offset3;
                    vec2 layer3_uv = (layer3_coord / 100.0 * u_noise_scale) * u_layer3_scale * u_layer3_stretch;
                    layer3_uv += u_time * u_windDirection * u_layer3_speed;
                    
                    float layer3_raw = cloudFBM(layer3_uv, evolutionTime * 0.6, u_layer3_octaves);
                    
                    // Create flat base with hard threshold
                    layer3_raw = smoothstep(0.4, 0.5, layer3_raw);
                    
                    // Multiplicative blend for shadow density
                    cloudValue *= (1.0 + layer3_raw * u_layer3_opacity);
                }
                
                // === WEATHER STATE MODULATION ===
                // Apply weather-based coverage threshold (clear has sparse clouds, storm has full coverage)
                cloudValue = remap(cloudValue, 1.0 - u_weatherCoverage, 1.0, 0.0, 1.0);
                cloudValue = clamp(cloudValue, 0.0, 1.0);
                
                // Apply weather density multiplier
                cloudValue *= u_weatherDensity;
                
                // === RAW CLOUD OUTPUT (for CloudDepthLayer) ===
                // Output UNPROCESSED cloud noise before shadow shading
                // CloudDepthLayer will apply its own brightness/contrast to make clouds white
                if (u_outputRawCloud) {
                    gl_FragColor = vec4(vec3(cloudValue), 1.0);
                    return;
                }
                
                // === SHADOW PROCESSING (for scene darkening) ===
                // Apply shading controls to darken for shadow casting
                shadedCloudValue = applyShadingControls(cloudValue);
                
                // === TIME OF DAY COLOR INTEGRATION (for shadows only) ===
                // Apply time of day tint to shadow appearance using multiplicative approach
                // (matches the ground's TimeOfDayColorFilter for visual coherence)
                vec3 cloudColor = vec3(shadedCloudValue);
                
                // MULTIPLICATIVE RGB tint (same as ground) - creates vibrant dawn/dusk colors
                vec3 tintedCloud = cloudColor * u_timeOfDayTint;
                
                // Blend based on intensity and weather brightness
                cloudColor = mix(
                    cloudColor,
                    tintedCloud,
                    u_timeOfDayIntensity * u_weatherBrightness
                );
                
                // Golden hour effect - detect warm sunrise/sunset colors
                float goldenHour = smoothstep(0.6, 0.9, u_timeOfDayTint.r) * 
                                 smoothstep(0.3, 0.5, u_timeOfDayTint.b);
                
                // Enhance cloud edge brightness during golden hour (additive for rim light)
                float edgeMask = 1.0 - smoothstep(0.3, 0.6, shadedCloudValue);
                cloudColor += vec3(1.0, 0.8, 0.6) * edgeMask * goldenHour * 0.4 * u_timeOfDayIntensity;
                
                // Night darkening - make clouds much darker at night
                float nightDarkness = smoothstep(0.8, 0.3, u_timeOfDayTint.r + u_timeOfDayTint.g + u_timeOfDayTint.b);
                cloudColor *= mix(1.0, 0.15, nightDarkness);
                
                // Add subtle blue moonlight tint at night
                vec3 moonlightTint = vec3(0.6, 0.7, 1.0);
                cloudColor = mix(cloudColor, cloudColor * moonlightTint, nightDarkness * 0.3);
                
                // Convert back to shadow value (luminance)
                shadedCloudValue = dot(cloudColor, vec3(0.299, 0.587, 0.114));
            }

            // Apply cloud shadows to scene
            vec4 originalColor = texture2D(uSampler, vTextureCoord);
            if (maskValue < 0.01) {
                gl_FragColor = originalColor;
                return;
            }

            float shadowAmount = shadedCloudValue * maskValue * u_shadowIntensity;

            // Light occlusion - lights cut through cloud shadows
            if (u_occlusionEnabled) {
                float lightMaskValue = texture2D(uLightPolygonMask, vScreenCoord).r;
                shadowAmount *= (1.0 - lightMaskValue * u_occlusionIntensity);
            }

            // Apply shadow with weather-based darkness
            shadowAmount *= u_weatherDarkness;
            shadowAmount = clamp(shadowAmount, 0.0, 1.0);
            
            vec3 finalColor = originalColor.rgb * (1.0 - shadowAmount);
            gl_FragColor = vec4(finalColor, originalColor.a);
        }
    `;

    super(vertexSrc, fragmentSrc, {
      uOutdoorsMask: PIXI.Texture.EMPTY,
      uLightPolygonMask: PIXI.Texture.EMPTY,
      u_time: 0.0,
      u_camera_offset: [0, 0],
      u_view_size: [0, 0],
      uSceneRectNorm: [0, 0, 1, 1],
      u_windDirection: [0.01, 0.01],
      
      // Core noise settings
      u_noise_scale: 0.1,
      u_noise_persistence: 0.5,
      u_noise_lacunarity: 2.5,
      
      // Shading
      u_shading_threshold: 1.0,
      u_shading_softness: 0.2,
      u_shading_brightness: 0.51,
      u_shading_contrast: 1.0,
      u_shading_gamma: 1.0,
      u_shadowIntensity: 0.5,
      u_outputRawCloud: false,
      
      // Light occlusion
      u_occlusionEnabled: true,
      u_occlusionIntensity: 1.0,
      
      // Weather integration (defaults to moderate conditions)
      u_weatherDensity: 0.5,
      u_weatherCoverage: 0.5,
      u_weatherBrightness: 0.8,
      u_weatherDarkness: 0.4,
      
      // Time of day integration (defaults to neutral midday)
      u_timeOfDayTint: [1.0, 1.0, 1.0],
      u_timeOfDayIntensity: 0.5,
      
      // Domain warping
      u_warpStrength: 0.4,
      u_warpScale: 2.5,
      u_gustStrength: 0.0,
      
      // Evolution
      u_evolutionSpeed: 0.0005,
      
      // Layer 1: High altitude (fast, large, wispy) - 3 octaves
      u_layer1_enabled: true,
      u_layer1_scale: 6.0,
      u_layer1_speed: 3.0,
      u_layer1_stretch: [1.0, 1.0],
      u_layer1_octaves: 3,
      u_layer1_opacity: 0.2,
      u_layer1_parallaxDepth: 0.1,
      
      // Layer 2: Mid altitude (main cumulus) - 5 octaves
      u_layer2_enabled: true,
      u_layer2_scale: 2.0,
      u_layer2_speed: 1.5,
      u_layer2_stretch: [1.0, 1.0],
      u_layer2_octaves: 5,
      u_layer2_opacity: 0.6,
      u_layer2_parallaxDepth: 0.3,
      
      // Layer 3: Low altitude (dense stratus) - 4 octaves
      u_layer3_enabled: true,
      u_layer3_scale: 0.8,
      u_layer3_speed: 0.7,
      u_layer3_stretch: [1.0, 1.0],
      u_layer3_octaves: 4,
      u_layer3_opacity: 0.4,
      u_layer3_parallaxDepth: 0.5,
    });
  }

  /**
   * Clean up texture references to prevent memory leaks and scene teardown errors
   */
  destroy() {
    // Clean up texture uniforms to prevent null reference errors during scene teardown
    if (this.uniforms) {
      this.uniforms.uOutdoorsMask = null;
      this.uniforms.uLightPolygonMask = null;
    }
    super.destroy();
  }
}
