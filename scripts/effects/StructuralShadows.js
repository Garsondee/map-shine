import { PIXI, Texture } from "../pixi-adapter.js";

/**
 * Structural Filter - Shader that renders natural window light with cloud occlusion.
 *
 * This filter generates clouds internally using the same noise functions and parameters
 * as CloudShadowsFilter, reading from the cloudShadows config as a single source of truth.
 * This avoids texture sharing issues and ensures consistent cloud patterns.
 *
 * @extends PIXI.Filter
 */
class StructuralFilter extends PIXI.Filter {
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
            uniform sampler2D uStructuralMask;
            uniform sampler2D uOutdoorsMask;
            uniform sampler2D uLightMask;
            uniform sampler2D uMetallicMask;

            uniform vec4 uSceneRectNorm;
            uniform vec2 uTexelSize;

            // Effect Controls
            uniform int uBlendMode;
            uniform float uIntensity;

            // Color Correction
            uniform bool uCcEnabled;
            uniform float uExposure;
            uniform float uSaturation;
            uniform float uBrightness;
            uniform float uContrast;
            uniform float uGamma;
            uniform vec3 uTintColor;
            uniform float uTintAmount;
            
            // RGB Split (Chromatic Aberration)
            uniform bool uRgbSplitEnabled;
            uniform float uRgbSplitAmount;
            uniform float uRgbSplitThreshold;
            uniform float uRgbSplitSoftness;
            
            // Metallic Preservation
            uniform bool uMetallicPreservationEnabled;
            uniform float uMetallicPreservationThreshold;
            uniform int uMetallicPreservationBlendMode;

            // Cloud Occlusion
            uniform bool uCloudOcclusionEnabled;
            uniform float uCloudOcclusionIntensity;
            uniform float uCloudOcclusionThreshold;
            uniform float uCloudOcclusionSoftness;
            uniform bool uDebugShowClouds;

            // Cloud Generation (from cloudShadows config)
            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;
            uniform vec2 u_windDirection;
            uniform float u_noise_scale;
            uniform int u_noise_octaves;
            uniform float u_noise_persistence;
            uniform float u_noise_lacunarity;
            uniform float u_shading_threshold;
            uniform float u_shading_softness;
            uniform float u_shading_brightness;
            uniform float u_shading_contrast;
            uniform float u_shading_gamma;
            uniform float u_evolutionSpeed;
            
            // 5 Cloud Layers
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

            // Light Occlusion
            uniform bool uLightOcclusionEnabled;
            uniform float uLightOcclusionIntensity;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            // Cloud noise functions (copied from CloudShadowsFilter)
            float random3d(vec3 st) { return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453123); }
            
            float noise3d(vec3 st) {
                vec3 i = floor(st); vec3 f = fract(st);
                float a = random3d(i);
                float b = random3d(i + vec3(1.0, 0.0, 0.0));
                float c = random3d(i + vec3(0.0, 1.0, 0.0));
                float d = random3d(i + vec3(1.0, 1.0, 0.0));
                float e = random3d(i + vec3(0.0, 0.0, 1.0));
                float f2 = random3d(i + vec3(1.0, 0.0, 1.0));
                float g = random3d(i + vec3(0.0, 1.0, 1.0));
                float h = random3d(i + vec3(1.0, 1.0, 1.0));
                vec3 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
                           mix(mix(e, f2, u.x), mix(g, h, u.x), u.y), u.z);
            }
            
            float fbm3d(vec3 st, int octaves, float persistence, float lacunarity) {
                float value = 0.0; float amplitude = 0.5;
                for (int i = 0; i < 10; i++) {
                    if (i >= octaves) break;
                    value += amplitude * noise3d(st);
                    st *= lacunarity;
                    amplitude *= persistence;
                }
                return value;
            }
            
            float applyShadingControls(float value) {
                value += u_shading_brightness;
                value = (value - 0.5) * u_shading_contrast + 0.5;
                value = smoothstep(u_shading_threshold, u_shading_threshold + u_shading_softness, value);
                if (u_shading_gamma > 0.0) { value = pow(value, u_shading_gamma); }
                return clamp(value, 0.0, 1.0);
            }
            
            float generateCloudValue() {
                vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                float aspect = u_view_size.x / u_view_size.y;
                vec2 corrected_coord = world_coord;
                corrected_coord.x /= aspect;
                vec2 base_uv = corrected_coord / 100.0 * u_noise_scale;
                float evolutionZ = u_time * u_evolutionSpeed;
                float shadow = 1.0;
                
                if (u_layer1_enabled) {
                    // Apply zoom-independent parallax offset in world space
                    vec2 parallax_offset1 = u_camera_offset * u_layer1_parallaxDepth * 0.001;
                    vec2 layer1_coord = corrected_coord + parallax_offset1;
                    vec2 layer1_uv = (layer1_coord / 100.0 * u_noise_scale) * u_layer1_scale * u_layer1_stretch;
                    layer1_uv += u_time * u_windDirection * u_layer1_speed;
                    float layer1_raw = fbm3d(vec3(layer1_uv, evolutionZ), u_layer1_octaves, u_noise_persistence, u_noise_lacunarity);
                    float layer1_value = applyShadingControls(layer1_raw);
                    shadow *= (1.0 - layer1_value * u_layer1_opacity);
                }
                
                if (u_layer2_enabled) {
                    // Apply zoom-independent parallax offset in world space
                    vec2 parallax_offset2 = u_camera_offset * u_layer2_parallaxDepth * 0.001;
                    vec2 layer2_coord = corrected_coord + parallax_offset2;
                    vec2 layer2_uv = (layer2_coord / 100.0 * u_noise_scale) * u_layer2_scale * u_layer2_stretch;
                    layer2_uv += u_time * u_windDirection * u_layer2_speed;
                    float layer2_raw = fbm3d(vec3(layer2_uv, evolutionZ * 0.8), u_layer2_octaves, u_noise_persistence, u_noise_lacunarity);
                    float layer2_value = applyShadingControls(layer2_raw);
                    shadow *= (1.0 - layer2_value * u_layer2_opacity);
                }
                
                if (u_layer3_enabled) {
                    // Apply zoom-independent parallax offset in world space
                    vec2 parallax_offset3 = u_camera_offset * u_layer3_parallaxDepth * 0.001;
                    vec2 layer3_coord = corrected_coord + parallax_offset3;
                    vec2 layer3_uv = (layer3_coord / 100.0 * u_noise_scale) * u_layer3_scale * u_layer3_stretch;
                    layer3_uv += u_time * u_windDirection * u_layer3_speed;
                    float layer3_raw = fbm3d(vec3(layer3_uv, evolutionZ * 0.6), u_layer3_octaves, u_noise_persistence, u_noise_lacunarity);
                    float layer3_value = applyShadingControls(layer3_raw);
                    shadow *= (1.0 - layer3_value * u_layer3_opacity);
                }
                
                if (u_layer4_enabled) {
                    // Apply zoom-independent parallax offset in world space
                    vec2 parallax_offset4 = u_camera_offset * u_layer4_parallaxDepth * 0.001;
                    vec2 layer4_coord = corrected_coord + parallax_offset4;
                    vec2 layer4_uv = (layer4_coord / 100.0 * u_noise_scale) * u_layer4_scale * u_layer4_stretch;
                    layer4_uv += u_time * u_windDirection * u_layer4_speed;
                    float layer4_raw = fbm3d(vec3(layer4_uv, evolutionZ * 0.4), u_layer4_octaves, u_noise_persistence, u_noise_lacunarity);
                    float layer4_value = applyShadingControls(layer4_raw);
                    shadow *= (1.0 - layer4_value * u_layer4_opacity);
                }
                
                if (u_layer5_enabled) {
                    // Apply zoom-independent parallax offset in world space
                    vec2 parallax_offset5 = u_camera_offset * u_layer5_parallaxDepth * 0.001;
                    vec2 layer5_coord = corrected_coord + parallax_offset5;
                    vec2 layer5_uv = (layer5_coord / 100.0 * u_noise_scale) * u_layer5_scale * u_layer5_stretch;
                    layer5_uv += u_time * u_windDirection * u_layer5_speed;
                    float layer5_raw = fbm3d(vec3(layer5_uv, evolutionZ * 0.2), u_layer5_octaves, u_noise_persistence, u_noise_lacunarity);
                    float layer5_value = applyShadingControls(layer5_raw);
                    shadow *= (1.0 - layer5_value * u_layer5_opacity);
                }
                
                return 1.0 - shadow;
            }

            vec3 blendOverlay(vec3 base, vec3 blend) {
                float r = base.r < 0.5 ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r));
                float g = base.g < 0.5 ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g));
                float b = base.b < 0.5 ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b));
                return vec3(r, g, b);
            }

            vec3 blendAdd(vec3 base, vec3 blend) {
                return base + blend;
            }

            vec3 blendMultiply(vec3 base, vec3 blend) {
                return base * blend;
            }

            vec3 blendScreen(vec3 base, vec3 blend) {
                return 1.0 - (1.0 - base) * (1.0 - blend);
            }

            void main() {
                vec4 originalColor = texture2D(uSampler, vTextureCoord);

                vec2 sceneMin = uSceneRectNorm.xy;
                vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
                if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x || vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
                    gl_FragColor = originalColor;
                    return;
                }

                float indoorMask = 1.0 - texture2D(uOutdoorsMask, vScreenCoord).r;
                if (indoorMask < 0.01) {
                    gl_FragColor = originalColor;
                    return;
                }

                vec3 structuralColor = texture2D(uStructuralMask, vScreenCoord).rgb;
                
                // RGB Split (Chromatic Aberration) - Apply BEFORE cloud occlusion
                if (uRgbSplitEnabled) {
                    float structuralLuminance = dot(structuralColor, lum_weights);
                    float splitMask = smoothstep(
                        uRgbSplitThreshold - uRgbSplitSoftness,
                        uRgbSplitThreshold + uRgbSplitSoftness,
                        structuralLuminance
                    );
                    
                    if (splitMask > 0.01) {
                        // Horizontal chromatic aberration (like light through glass)
                        vec2 offset = vec2(uRgbSplitAmount * uTexelSize.x, 0.0) * splitMask;
                        vec3 r = texture2D(uStructuralMask, vScreenCoord - offset).rgb;
                        vec3 g = structuralColor; // center sample
                        vec3 b = texture2D(uStructuralMask, vScreenCoord + offset).rgb;
                        structuralColor = vec3(r.r, g.g, b.b);
                    }
                }

                if (uCloudOcclusionEnabled) {
                    float cloudValue = generateCloudValue();
                    
                    // Debug: Show raw cloud values
                    if (uDebugShowClouds) {
                        gl_FragColor = vec4(vec3(cloudValue), 1.0);
                        return;
                    }
                    
                    float structuralLuminance = dot(structuralColor, lum_weights);
                    float brightnessMask = smoothstep(
                        uCloudOcclusionThreshold - uCloudOcclusionSoftness,
                        uCloudOcclusionThreshold + uCloudOcclusionSoftness,
                        structuralLuminance
                    );
                    // Apply 2.5x multiplier to make cloud darkening more visible on window light
                    // Clamp to prevent negative values (which cause hard black pixels at high intensity)
                    float darkeningFactor = clamp(1.0 - (cloudValue * uCloudOcclusionIntensity * brightnessMask * 2.5), 0.0, 1.0);
                    structuralColor *= darkeningFactor;
                }

                if (uCcEnabled) {
                    // Apply exposure first (HDR-style boost)
                    if (abs(uExposure) > 0.001) {
                        structuralColor *= pow(2.0, uExposure);
                    }
                    
                    // Then gamma
                    if (uGamma > 0.0) structuralColor = pow(structuralColor, vec3(1.0 / uGamma));
                    
                    // Brightness, contrast, saturation, tint
                    structuralColor += uBrightness;
                    structuralColor = (structuralColor - 0.5) * uContrast + 0.5;
                    float luminance = dot(structuralColor, lum_weights);
                    structuralColor = mix(vec3(luminance), structuralColor, uSaturation);
                    structuralColor = mix(structuralColor, uTintColor, uTintAmount);
                }

                vec3 effectLayer = structuralColor;

                if (uLightOcclusionEnabled) {
                    float lightValue = texture2D(uLightMask, vScreenCoord).r;
                    float occlusionFactor = lightValue * uLightOcclusionIntensity;
                    vec3 lightenedColor = mix(effectLayer, vec3(1.0), occlusionFactor);
                    effectLayer = max(effectLayer, lightenedColor);
                }

                // Metallic Preservation: Use additive/screen blend where metallic and structural overlap
                vec3 effectColor = originalColor.rgb;
                bool useMetallicPreservation = false;
                
                if (uMetallicPreservationEnabled) {
                    vec3 metallicColor = texture2D(uMetallicMask, vScreenCoord).rgb;
                    float metallicLuminance = dot(metallicColor, lum_weights);
                    float effectLuminance = dot(effectLayer, lum_weights);
                    
                    // If both metallic shine and structural light are bright, preserve the shine
                    if (metallicLuminance > uMetallicPreservationThreshold && effectLuminance > uMetallicPreservationThreshold) {
                        useMetallicPreservation = true;
                        if (uMetallicPreservationBlendMode == 1) {
                            // Additive blend
                            effectColor = blendAdd(originalColor.rgb, effectLayer);
                        } else {
                            // Screen blend (default)
                            effectColor = blendScreen(originalColor.rgb, effectLayer);
                        }
                    }
                }
                
                if (!useMetallicPreservation) {
                    // Normal blending
                    if (uBlendMode == 5) {
                        effectColor = blendOverlay(originalColor.rgb, effectLayer);
                    } else if (uBlendMode == 1) {
                        effectColor = blendAdd(originalColor.rgb, effectLayer);
                    } else if (uBlendMode == 2) {
                        effectColor = blendMultiply(originalColor.rgb, effectLayer);
                    } else if (uBlendMode == 3) {
                        effectColor = blendScreen(originalColor.rgb, effectLayer);
                    } else {
                        effectColor = blendOverlay(originalColor.rgb, effectLayer);
                    }
                }

                vec3 intensityAdjustedColor = mix(originalColor.rgb, effectColor, uIntensity);
                vec3 blendedResult = mix(originalColor.rgb, intensityAdjustedColor, indoorMask);

                gl_FragColor = vec4(clamp(blendedResult, 0.0, 1.0), originalColor.a);
            }
        `;

    super(vertexSrc, fragmentSrc, {
      uStructuralMask: PIXI.Texture.EMPTY,
      uOutdoorsMask: PIXI.Texture.EMPTY,
      uLightMask: PIXI.Texture.EMPTY,
      uMetallicMask: PIXI.Texture.EMPTY,
      uSceneRectNorm: [0, 0, 1, 1],
      uTexelSize: [1.0 / 1920, 1.0 / 1080],
      
      uBlendMode: 5,
      uIntensity: 1.0,
      
      uCcEnabled: true,
      uExposure: 0.0,
      uSaturation: 1.0,
      uBrightness: 0.0,
      uContrast: 1.0,
      uGamma: 1.0,
      uTintColor: [1.0, 1.0, 1.0],
      uTintAmount: 0.0,
      
      uRgbSplitEnabled: false,
      uRgbSplitAmount: 2.0,
      uRgbSplitThreshold: 0.7,
      uRgbSplitSoftness: 0.2,
      
      uMetallicPreservationEnabled: true,
      uMetallicPreservationThreshold: 0.5,
      uMetallicPreservationBlendMode: 1,
      
      uCloudOcclusionEnabled: true,
      uCloudOcclusionIntensity: 0.8,
      uCloudOcclusionThreshold: 0.5,
      uCloudOcclusionSoftness: 0.1,
      uDebugShowClouds: false,
      
      // Cloud generation uniforms
      u_time: 0,
      u_camera_offset: [0, 0],
      u_view_size: [1920, 1080],
      u_windDirection: [0, 0],
      u_noise_scale: 1.0,
      u_noise_octaves: 5,
      u_noise_persistence: 0.5,
      u_noise_lacunarity: 2.0,
      u_shading_threshold: 0.5,
      u_shading_softness: 0.1,
      u_shading_brightness: 0.0,
      u_shading_contrast: 1.0,
      u_shading_gamma: 1.0,
      u_evolutionSpeed: 0.001,
      
      u_layer1_enabled: true,
      u_layer1_scale: 4.0,
      u_layer1_speed: 2.5,
      u_layer1_stretch: [1.0, 1.0],
      u_layer1_octaves: 3,
      u_layer1_opacity: 0.3,
      u_layer1_parallaxDepth: 0.1,
      
      u_layer2_enabled: true,
      u_layer2_scale: 1.5,
      u_layer2_speed: 1.3,
      u_layer2_stretch: [1.0, 1.0],
      u_layer2_octaves: 5,
      u_layer2_opacity: 0.5,
      u_layer2_parallaxDepth: 0.3,
      
      u_layer3_enabled: true,
      u_layer3_scale: 0.7,
      u_layer3_speed: 0.7,
      u_layer3_stretch: [1.0, 1.0],
      u_layer3_octaves: 6,
      u_layer3_opacity: 0.6,
      u_layer3_parallaxDepth: 0.5,
      
      u_layer4_enabled: true,
      u_layer4_scale: 2.5,
      u_layer4_speed: 1.8,
      u_layer4_stretch: [1.0, 1.0],
      u_layer4_octaves: 4,
      u_layer4_opacity: 0.4,
      u_layer4_parallaxDepth: 0.2,
      
      u_layer5_enabled: true,
      u_layer5_scale: 5.0,
      u_layer5_speed: 3.0,
      u_layer5_stretch: [1.0, 1.0],
      u_layer5_octaves: 2,
      u_layer5_opacity: 0.2,
      u_layer5_parallaxDepth: 0.15,
      
      uLightOcclusionEnabled: true,
      uLightOcclusionIntensity: 1.0,
    });
  }
}
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { CloudShadowsLayer } from "./CloudShadows.js";
import { BLEND_MODE_OPTIONS } from "../config/blend-modes.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import { hexToRgbArray } from "../utils/ColorUtils.js";
import { MaskedEffectLayer } from "./MaskedEffectLayer.js";

export class StructuralShadowsLayer extends MaskedEffectLayer {
  constructor() {
    super({
      maskSuffix: "structural",
      effectKey: "structuralShadows",
    });
    this.filter = null;
    this.time = 0; // For animations if needed in the future
  }

  static getSettingsHTML() {
    const effectKey = "structuralShadows";
    const content = `
            <p class="description-text">Adds light and shadow from structural elements (e.g., windows) to indoor areas. Uses _Structural and _Outdoors masks.</p>
            ${DebuggerUIBuilder._createSelectHTML(
              "structuralShadows.blendMode",
              "Blend Mode",
              BLEND_MODE_OPTIONS
            )}
            ${DebuggerUIBuilder._createSliderHTML(
              "structuralShadows.intensity",
              "Intensity",
              0,
              2,
              0.05
            )}
            <details id="details-structuralShadows-colorCorrection">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                  "structuralShadows.colorCorrection.enabled",
                  "Color Correction",
                  true
                )}</div></summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Adjusts the color of the structural light/shadow before blending.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.colorCorrection.exposure",
                      "Exposure (HDR Boost)",
                      -3,
                      3,
                      0.1,
                      "Boosts the brightness of window light for HDR-style highlights. Positive values make it pop."
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.colorCorrection.saturation",
                      "Saturation",
                      0,
                      4,
                      0.05
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.colorCorrection.brightness",
                      "Brightness",
                      -1,
                      1,
                      0.01
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.colorCorrection.contrast",
                      "Contrast",
                      0,
                      4,
                      0.05
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.colorCorrection.gamma",
                      "Gamma",
                      0.2,
                      2.5,
                      0.05
                    )}
                    <details id="details-structuralShadows-cc-tint"><summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary><div style="padding-left: 5px;">
                        ${DebuggerUIBuilder._createColorPickerHTML(
                          "structuralShadows.colorCorrection.tint.color",
                          "Tint Color"
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          "structuralShadows.colorCorrection.tint.amount",
                          "Tint Amount",
                          0,
                          1,
                          0.01
                        )}
                    </div></details>
                </div>
            </details>
            
            <details id="details-structuralShadows-rgbSplit">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                  "structuralShadows.rgbSplit.enabled",
                  "RGB Split (Glass Diffraction)",
                  false
                )}</div></summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Simulates chromatic aberration from light diffracting through thick window glass on the brightest areas.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.rgbSplit.amount",
                      "Split Amount",
                      0,
                      10,
                      0.1,
                      "The strength of the RGB separation effect in pixels."
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.rgbSplit.threshold",
                      "Brightness Threshold",
                      0,
                      1,
                      0.01,
                      "Only affects areas brighter than this threshold."
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.rgbSplit.softness",
                      "Threshold Softness",
                      0,
                      0.5,
                      0.01,
                      "Smoothness of the transition at the brightness threshold."
                    )}
                </div>
            </details>
            
            <details id="details-structuralShadows-metallicPreservation">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                  "structuralShadows.metallicPreservation.enabled",
                  "Preserve Metallic Shine",
                  true
                )}</div></summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Prevents structural effect from darkening bright metallic/reflective surfaces. Uses additive blending where bright window light overlaps with bright metallic shine.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.metallicPreservation.threshold",
                      "Brightness Threshold",
                      0,
                      1,
                      0.01,
                      "Minimum brightness for both structural and metallic to trigger preservation."
                    )}
                    ${DebuggerUIBuilder._createSelectHTML(
                      "structuralShadows.metallicPreservation.blendMode",
                      "Preservation Blend Mode",
                      [{value: 1, label: "Add (Brightest)"}, {value: 3, label: "Screen (Softer)"}]
                    )}
                </div>
            </details>

    <details id="details-structuralShadows-cloudOcclusion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
      "structuralShadows.cloudOcclusion.enabled",
      "Cloud Occlusion",
      true
    )}</div></summary>
                                <div style="padding-left: 5px;">
                                    <p class="description-text">Allows clouds to darken the light cast by the structural effect. <strong>Cloud patterns are generated using settings from the Cloud Shadows effect.</strong></p>
                                    <p class="description-text" style="background: rgba(255,200,100,0.1); padding: 5px; border-left: 3px solid rgba(255,200,100,0.5); margin: 5px 0;"><i class="fas fa-info-circle"></i> To adjust cloud appearance (speed, scale, layers, etc.), configure the <strong>Cloud Shadows</strong> effect above.</p>
                                    ${DebuggerUIBuilder._createCheckboxHTML(
                                      "structuralShadows.cloudOcclusion.debugShowClouds",
                                      "🐛 DEBUG: Show Cloud Mask",
                                      false,
                                      "Visualize the cloud pattern being generated for occlusion (white = clouds, black = clear sky)"
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "structuralShadows.cloudOcclusion.intensity",
                                      "Darkening Intensity",
                                      0,
                                      1,
                                      0.01,
                                      "How much clouds darken the window light."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "structuralShadows.cloudOcclusion.threshold",
                                      "Highlight Threshold",
                                      0,
                                      1,
                                      0.01,
                                      "The brightness level above which clouds will cast shadows on the structural light."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "structuralShadows.cloudOcclusion.softness",
                                      "Threshold Softness",
                                      0.01,
                                      1,
                                      0.01,
                                      "The softness of the transition at the highlight threshold."
                                    )}
                                </div>
                            </details>
            <details id="details-structuralShadows-lightOcclusion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
              "structuralShadows.lightOcclusion.enabled",
              "Light Occlusion",
              true
            )}</div></summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Allows scene lights to \"cut out\" the dark parts of the structural shadows.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "structuralShadows.lightOcclusion.intensity",
                      "Intensity",
                      0,
                      1,
                      0.01,
                      "How strongly lights remove the shadows. 1.0 is a full cutout."
                    )}
                </div>
            </details>


        `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Structural Effect",
      content
    );
  }

  async _draw(options) {
    await super._draw(options); // Handles mask container and texture

    try {
      this.filter = safeCreateFilter(StructuralFilter, {}, "StructuralShadowsLayer");
      // Apply the filter to the primary canvas container. This ensures it renders after tiles but before lighting.
      if (this.filter) {
        safeApplyFilters(
          canvas.primary,
          [...(canvas.primary.filters || []), this.filter],
          "canvas.primary (Structural)"
        );
      }
    } catch (e) {
      console.error("MapShine | Failed to create StructuralFilter", e);
    }

    // An initial update to set parameters.
    this.updateFromConfig(game.mapShine.profileManager.activeConfig);
  }

  _onAnimate(deltaTime) {
    super._onAnimate(deltaTime); // This renders the combined mask if needed
    if (this._destroyed || !this.filter) return;

    const config = game.mapShine.profileManager.activeConfig;
    
    // Check master enabled flag first
    if (!config || config.enabled === false) {
      if (this.filter) this.filter.enabled = false;
      return;
    }
    
    const ssConfig = config.structuralShadows;
    const hasActiveMasks = this.maskSprites.size > 0;
    this.filter.enabled = ssConfig.enabled && hasActiveMasks;

    if (!this.filter.enabled) return;

    const resourceManager = game.mapShine.resourceManager;
    if (!resourceManager) return;

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    this.time += deltaTime * timeFactor;

    const u = this.filter.uniforms;
    u.uStructuralMask = this.getMaskTexture();
    u.uOutdoorsMask = resourceManager.getOutdoorsMask() || PIXI.Texture.WHITE;
    u.uLightMask = resourceManager.getLightMask() || PIXI.Texture.WHITE;
    u.uMetallicMask = resourceManager.getMetallicSpecularMask() || PIXI.Texture.EMPTY;
    
    // Update texelSize for RGB split
    const screen = canvas.app.renderer.screen;
    u.uTexelSize = [1.0 / screen.width, 1.0 / screen.height];

    // Update cloud generation uniforms from cloudShadows config (single source of truth)
    const csConfig = config.cloudShadows;
    if (csConfig && u.uCloudOcclusionEnabled) {
      // Time and camera
      u.u_time += deltaTime * timeFactor;
      Object.assign(u, CoordinateManager.getShaderUniforms());
      
      // Wind direction (from CloudShadowsLayer logic)
      // Negate because shader uses UV scrolling (pattern moves opposite to scroll direction)
      const cloudLayer = canvas.layers.find(l => l instanceof CloudShadowsLayer);
      if (cloudLayer && cloudLayer._cloudVelocity) {
        u.u_windDirection = [-cloudLayer._cloudVelocity.x, -cloudLayer._cloudVelocity.y];
      }
      
      // Noise parameters
      u.u_noise_scale = (csConfig.noise.scale ?? 8) * 0.01;  // UI value scaled down
      u.u_noise_octaves = csConfig.noise.octaves;
      u.u_noise_persistence = csConfig.noise.persistence;
      u.u_noise_lacunarity = csConfig.noise.lacunarity;
      u.u_evolutionSpeed = (csConfig.evolutionSpeed ?? 5) * 0.0001;  // UI value scaled down
      
      // Shading controls
      const s = csConfig.shading;
      u.u_shading_threshold = s.threshold;
      u.u_shading_softness = s.softness;
      u.u_shading_brightness = s.brightness;
      u.u_shading_contrast = s.contrast;
      u.u_shading_gamma = s.gamma;
      
      // Layer configuration (referencing CloudShadows config)
      const layers = csConfig.layers;
      if (layers) {
        u.u_layer1_enabled = layers.layer1?.enabled ?? true;
        u.u_layer1_scale = layers.layer1?.scale ?? 4.0;
        u.u_layer1_speed = layers.layer1?.speed ?? 2.5;
        u.u_layer1_stretch = [layers.layer1?.stretchX ?? 1.0, layers.layer1?.stretchY ?? 1.0];
        u.u_layer1_octaves = layers.layer1?.octaves ?? 3;
        u.u_layer1_opacity = layers.layer1?.opacity ?? 0.3;
        u.u_layer1_parallaxDepth = layers.layer1?.parallaxDepth ?? 0.1;

        u.u_layer2_enabled = layers.layer2?.enabled ?? true;
        u.u_layer2_scale = layers.layer2?.scale ?? 1.5;
        u.u_layer2_speed = layers.layer2?.speed ?? 1.3;
        u.u_layer2_stretch = [layers.layer2?.stretchX ?? 1.0, layers.layer2?.stretchY ?? 1.0];
        u.u_layer2_octaves = layers.layer2?.octaves ?? 5;
        u.u_layer2_opacity = layers.layer2?.opacity ?? 0.5;
        u.u_layer2_parallaxDepth = layers.layer2?.parallaxDepth ?? 0.3;

        u.u_layer3_enabled = layers.layer3?.enabled ?? true;
        u.u_layer3_scale = layers.layer3?.scale ?? 0.7;
        u.u_layer3_speed = layers.layer3?.speed ?? 0.7;
        u.u_layer3_stretch = [layers.layer3?.stretchX ?? 1.0, layers.layer3?.stretchY ?? 1.0];
        u.u_layer3_octaves = layers.layer3?.octaves ?? 6;
        u.u_layer3_opacity = layers.layer3?.opacity ?? 0.6;
        u.u_layer3_parallaxDepth = layers.layer3?.parallaxDepth ?? 0.5;

        u.u_layer4_enabled = layers.layer4?.enabled ?? true;
        u.u_layer4_scale = layers.layer4?.scale ?? 2.5;
        u.u_layer4_speed = layers.layer4?.speed ?? 1.8;
        u.u_layer4_stretch = [layers.layer4?.stretchX ?? 1.0, layers.layer4?.stretchY ?? 1.0];
        u.u_layer4_octaves = layers.layer4?.octaves ?? 4;
        u.u_layer4_opacity = layers.layer4?.opacity ?? 0.4;
        u.u_layer4_parallaxDepth = layers.layer4?.parallaxDepth ?? 0.2;

        u.u_layer5_enabled = layers.layer5?.enabled ?? true;
        u.u_layer5_scale = layers.layer5?.scale ?? 5.0;
        u.u_layer5_speed = layers.layer5?.speed ?? 3.0;
        u.u_layer5_stretch = [layers.layer5?.stretchX ?? 1.0, layers.layer5?.stretchY ?? 1.0];
        u.u_layer5_octaves = layers.layer5?.octaves ?? 2;
        u.u_layer5_opacity = layers.layer5?.opacity ?? 0.2;
        u.u_layer5_parallaxDepth = layers.layer5?.parallaxDepth ?? 0.15;
      }
    }

    // Pass the normalized scene rectangle from the CoordinateManager to the filter.
    u.uSceneRectNorm = CoordinateManager.getSceneRectNormalizedArray();
  }

  async updateFromConfig(config) {
    const ssConfig = config.structuralShadows;
    if (!this.filter) return;

    const u = this.filter.uniforms;
    u.uBlendMode = ssConfig.blendMode;
    u.uIntensity = ssConfig.intensity;

    const cc = ssConfig.colorCorrection;
    u.uCcEnabled = cc.enabled;
    u.uExposure = cc.exposure ?? 0.0;
    u.uSaturation = cc.saturation;
    u.uBrightness = cc.brightness;
    u.uContrast = cc.contrast;
    u.uGamma = cc.gamma;
    u.uTintColor = hexToRgbArray(cc.tint.color);
    u.uTintAmount = cc.tint.amount;
    
    const rgb = ssConfig.rgbSplit;
    if (rgb) {
      u.uRgbSplitEnabled = rgb.enabled;
      u.uRgbSplitAmount = rgb.amount;
      u.uRgbSplitThreshold = rgb.threshold;
      u.uRgbSplitSoftness = rgb.softness;
    }
    
    const metallic = ssConfig.metallicPreservation;
    if (metallic) {
      u.uMetallicPreservationEnabled = metallic.enabled;
      u.uMetallicPreservationThreshold = metallic.threshold;
      u.uMetallicPreservationBlendMode = metallic.blendMode;
    }

    const cloud = ssConfig.cloudOcclusion;
    u.uCloudOcclusionEnabled = cloud.enabled;
    u.uCloudOcclusionIntensity = cloud.intensity;
    u.uCloudOcclusionThreshold = cloud.threshold;
    u.uCloudOcclusionSoftness = cloud.softness;
    u.uDebugShowClouds = cloud.debugShowClouds ?? false;

    const light = ssConfig.lightOcclusion;
    if (light) {
      u.uLightOcclusionEnabled = light.enabled;
      u.uLightOcclusionIntensity = light.intensity;
    }
  }

  async _tearDown(options) {
    if (this.filter) {
      const cleanedFilters = (canvas.primary.filters || []).filter(
        (f) => f !== this.filter
      );
      safeApplyFilters(canvas.primary, cleanedFilters, "canvas.primary (Structural teardown)");

      this.filter.destroy();
      this.filter = null;
    }
    await super._tearDown(options);
  }

  // Compatibility no-op for ResourceManager
  renderEffectNow(_deltaTime) {}
}
