import { PIXI, Texture, RenderTexture, Filter, WRAP_MODES } from "../pixi-adapter.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { hexToRgbArray } from "../utils/ColorUtils.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import { MaskedEffectLayer } from "./MaskedEffectLayer.js";

export class WaterEffectsFilter extends PIXI.Filter {
  constructor(options = {}) {
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

                            // Input textures & masks
                            uniform sampler2D uSampler;
                            uniform sampler2D u_displacementMap;
                            uniform sampler2D u_waterMask;
                            uniform sampler2D u_shorelineMask;
                            uniform sampler2D u_blurredWaterMask;
                            uniform sampler2D u_cloudShadows;
                            uniform sampler2D u_outdoorsMask;
                            uniform sampler2D u_puddleMask;
                            uniform sampler2D u_noWaterMask;

                            // Uniforms for toggles and parameters
                            uniform bool u_useShorelineMask;
                            uniform bool u_usePuddleMask;
                            uniform bool u_useNoWaterMask;
                            uniform vec2 u_camera_offset;
                            uniform vec2 u_view_size;
                            uniform float u_canvas_scale;
                            uniform float u_time;
                            uniform vec4 uSceneRectNorm;

                            // Wave & Distortion
                            uniform bool u_wave_enabled;
                            uniform float u_wave_intensity;

                            // Depth Displacement
                            uniform bool u_depthDisplacementEnabled;
                            uniform float u_depthDisplacementStrength;
                            uniform float u_depthDisplacementDarken;
                            uniform vec3 u_depthWallColor;
                            uniform float u_depthWallIntensity;
                            uniform float u_depthWallSmearBlend;

                            // Surface (Open Water Foam & Specularity)
                            uniform bool u_surface_enabled;
                            uniform vec3 u_openWaterFoamColor;
                            uniform float u_openWaterFoamIntensity;
                            uniform float u_openWaterFoamCoverage;
                            uniform float u_openWaterFoamSharpness;
                            uniform float u_openWaterFbmScale;
                            uniform float u_openWaterFbmSpeed;
                            uniform float u_openWaterFbmEvolution;
                            uniform int u_openWaterFbmOctaves;
                            uniform float u_openWaterFbmLacunarity;
                            uniform float u_openWaterFbmPersistence;

                            // Specularity
                            uniform bool u_specularity_enabled;
                            uniform vec3 u_specularity_color;
                            uniform float u_specularity_intensity;
                            uniform float u_specularity_shininess;
                            uniform vec3 u_specularity_light_direction;
                            uniform bool u_specularityCloudOcclusionEnabled;
                            uniform float u_specularityCloudOcclusionIntensity;

                            // Caustics
                            uniform bool u_caustics_enabled;
                            uniform sampler2D u_causticsMask;
                            uniform bool u_hasCausticsMask;
                            uniform vec3 u_causticsColor;
                            uniform float u_causticsIntensity;
                            uniform float u_causticsScale;
                            uniform float u_causticsSpeed;
                            uniform float u_causticsLineSharpness;
                            uniform float u_causticsBloomIntensity;
                            uniform float u_causticsLineDistortion;
                            uniform float u_causticsLineDistortionScale;
                            uniform float u_causticsIntersectionBoost;
                            uniform float u_causticsRoughnessScale;
                            uniform float u_causticsRoughnessIntensity;
                            uniform bool u_causticsCloudOcclusionEnabled;
                            uniform float u_causticsCloudOcclusionIntensity;

                            // Shoreline
                            uniform bool u_shoreline_enabled;
                            uniform vec3 u_shorelineFoamColor;
                            uniform float u_shorelineFoamIntensity;

                            // Shoreline Foam Pattern
                            uniform float u_shorelinePatternScale;
                            uniform float u_shorelinePatternSpeed;
                            uniform float u_shorelinePatternEvolution;
                            uniform int u_shorelinePatternOctaves;
                            uniform float u_shorelinePatternLacunarity;
                            uniform float u_shorelinePatternPersistence;
                            uniform float u_shorelinePatternBrightness;
                            uniform float u_shorelinePatternContrast;

                            // Shoreline Displacement Swirl
                            uniform bool u_shorelineDisplacementEnabled;
                            uniform float u_shorelineDisplacementScale;
                            uniform float u_shorelineDisplacementSpeed;
                            uniform float u_shorelineDisplacementStrength;

                            // Water Flow
                            uniform bool u_flow_enabled;
                            uniform vec2 u_flow_direction;
                            uniform float u_flow_speed;

                            // Murkiness & Occlusion
                            uniform bool u_murkiness_enabled;
                            uniform vec3 u_murkiness_color;
                            uniform float u_wavy_strength;
                            uniform float u_wavy_scale;
                            uniform float u_wavy_speed;
                            uniform float u_sandy_strength;
                            uniform float u_sandy_scale;
                            uniform float u_sandy_speed;
                            uniform float u_sandy_modulation_scale;
                            uniform float u_sandy_modulation_speed;
                            uniform float u_sandy_modulation_strength;

                            // Puddles
                            uniform bool u_puddles_enabled;
                            uniform float u_puddleIntensity;
                            uniform float u_puddleDarkening;

                            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
                            float snoise(vec3 v) {
                                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                                vec3 i  = floor(v + dot(v, C.yyy) );
                                vec3 x0 =   v - i + dot(i, C.xxx) ;
                                vec3 g = step(x0.yzx, x0.xyz);
                                vec3 l = 1.0 - g;
                                vec3 i1 = min( g.xyz, l.zxy );
                                vec3 i2 = max( g.xyz, l.zxy );
                                vec3 x1 = x0 - i1 + C.xxx;
                                vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
                                vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
                                i = mod(i, 289.0);
                                vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
                                float n_ = 0.142857142857; // 1.0/7.0
                                vec3  ns = n_ * D.wyz - D.xzx;
                                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
                                vec4 x_ = floor(j * ns.z);
                                vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
                                vec4 x = x_ *ns.x + ns.yyyy;
                                vec4 y = y_ *ns.x + ns.yyyy;
                                vec4 h = 1.0 - abs(x) - abs(y);
                                vec4 b0 = vec4( x.xy, y.xy );
                                vec4 b1 = vec4( x.zw, y.zw );
                                vec4 s0 = floor(b0)*2.0 + 1.0;
                                vec4 s1 = floor(b1)*2.0 + 1.0;
                                vec4 sh = -step(h, vec4(0.0));
                                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                                vec3 p0 = vec3(a0.xy,h.x);
                                vec3 p1 = vec3(a0.zw,h.y);
                                vec3 p2 = vec3(a1.xy,h.z);
                                vec3 p3 = vec3(a1.zw,h.w);
                                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                                p0 *= norm.x;
                                p1 *= norm.y;
                                p2 *= norm.z;
                                p3 *= norm.w;
                                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                                m = m * m;
                                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                            }

                            float fbm(vec3 st, int octaves, float lacunarity, float persistence) {
                                float value = 0.0;
                                float amplitude = 0.5;
                                for (int i = 0; i < 8; i++) {
                                    if (i >= octaves) break;
                                    value += amplitude * snoise(st);
                                    st *= lacunarity;
                                    amplitude *= persistence;
                                }
                                return value * 0.5 + 0.5;
                            }

                            void main() {
                                vec2 sceneMin = uSceneRectNorm.xy;
                                vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
                                if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x || vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
                                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                                    return;
                                }

                                // Sample noWater mask if enabled to check for exclusions
                                float noWaterMaskValue = u_useNoWaterMask ? texture2D(u_noWaterMask, vTextureCoord).r : 0.0;
                                
                                // If noWater mask is present, exit early without any water effects
                                if (noWaterMaskValue > 0.01) {
                                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                                    return;
                                }

                                float waterMaskValue = texture2D(u_waterMask, vTextureCoord).r;
                                float causticsMaskValue = u_hasCausticsMask ? texture2D(u_causticsMask, vTextureCoord).r : 0.0;
                                float combinedWaterAndCausticsMask = max(waterMaskValue, causticsMaskValue);
                                
                                // Check for puddles to prevent early exit when only puddles are present
                                float puddleCheckValue = (u_puddles_enabled && u_puddleIntensity > 0.0 && u_usePuddleMask) 
                                    ? texture2D(u_puddleMask, vTextureCoord).r 
                                    : 0.0;
                                float combinedMask = max(combinedWaterAndCausticsMask, puddleCheckValue);

                                if (combinedMask < 0.01) {
                                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                                    return;
                                }

                                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                                vec2 flow_offset = u_flow_enabled ? u_flow_direction * u_time * u_flow_speed * 100.0 : vec2(0.0);
                                vec2 flowed_world_coord = world_coord + flow_offset;

                                // --- UNIFIED DISTORTION CALCULATION ---
                                vec2 wave_uv_offset = vec2(0.0);
                                if (u_wave_enabled) {
                                    // Sample outdoor mask to modulate wave intensity
                                    float outdoorsMaskValue = texture2D(u_outdoorsMask, vTextureCoord).r;
                                    // Apply wave distortion, modulated by outdoor mask
                                    // Indoor water (mask=0) gets no wave distortion, outdoor water (mask=1) gets full intensity
                                    wave_uv_offset = (texture2D(u_displacementMap, vTextureCoord).xy - 0.5) * 2.0 * u_wave_intensity * outdoorsMaskValue;
                                }

                                vec2 swirl_world_offset = vec2(0.0);
                                if (u_shoreline_enabled && u_shorelineDisplacementEnabled) {
                                    float currentShorelineMask = u_useShorelineMask ? texture2D(u_shorelineMask, vTextureCoord).r : clamp((texture2D(u_blurredWaterMask, vTextureCoord).r - waterMaskValue) * 5.0, 0.0, 1.0);
                                    if (currentShorelineMask > 0.0) {
                                        vec2 swirl_noise_coord = flowed_world_coord * u_shorelineDisplacementScale * 0.01;
                                        float displacement_time = u_time * u_shorelineDisplacementSpeed;
                                        float dx = snoise(vec3(swirl_noise_coord, displacement_time));
                                        float dy = snoise(vec3(swirl_noise_coord + vec2(17.8, 93.4), displacement_time));
                                        swirl_world_offset = vec2(dx, dy) * u_shorelineDisplacementStrength * currentShorelineMask;
                                    }
                                }

                                vec2 swirl_uv_offset = swirl_world_offset / u_view_size;
                                
                                vec2 depth_uv_offset = vec2(0.0);
                                if (u_depthDisplacementEnabled) {
                                    // The displacement is proportional to depth (maskValue) and the distance
                                    // from the center of the screen, creating a parallax effect.
                                    depth_uv_offset.x = waterMaskValue * u_depthDisplacementStrength * (vScreenCoord.x - 0.5) * 2.0;
                                    depth_uv_offset.y = waterMaskValue * u_depthDisplacementStrength * (vScreenCoord.y - 0.5) * 2.0;
                                }
                                
                                vec2 total_uv_offset = wave_uv_offset + swirl_uv_offset + depth_uv_offset;

                                vec2 final_distorted_uv = vTextureCoord + total_uv_offset;
                                vec2 final_distorted_world_coord = flowed_world_coord + (total_uv_offset * u_view_size);
                                // --- END UNIFIED DISTORTION ---

                                // Detect wall/gap areas and create smearing effect
                                float wallMask = 0.0;
                                vec3 smearedColor = vec3(0.0);
                                bool needsSmearing = false;
                                
                                if (u_depthDisplacementEnabled && length(depth_uv_offset) > 0.0001) {
                                    // Sample the water mask at the displaced position
                                    float displacedWaterMask = texture2D(u_waterMask, final_distorted_uv).r;
                                    // If we're in a water area but the displaced position is NOT water, this is a gap/wall
                                    wallMask = waterMaskValue * (1.0 - displacedWaterMask);
                                    
                                    // Create smearing effect by sampling along the displacement path
                                    if (wallMask > 0.01) {
                                        needsSmearing = true;
                                        const int smearSamples = 8;
                                        vec3 smearAccum = vec3(0.0);
                                        float smearWeightTotal = 0.0;
                                        
                                        // March backwards from displaced position to find valid pixels
                                        for (int i = 0; i < smearSamples; i++) {
                                            float t = float(i) / float(smearSamples - 1);
                                            vec2 sampleUV = mix(vTextureCoord, final_distorted_uv, t);
                                            float sampleWaterMask = texture2D(u_waterMask, sampleUV).r;
                                            
                                            // Weight samples more heavily if they're in water areas
                                            float weight = sampleWaterMask * (1.0 - t) + 0.1;
                                            vec3 sampleColor = texture2D(uSampler, sampleUV).rgb;
                                            smearAccum += sampleColor * weight;
                                            smearWeightTotal += weight;
                                        }
                                        
                                        smearedColor = smearWeightTotal > 0.0 ? smearAccum / smearWeightTotal : u_depthWallColor;
                                    }
                                }

                                vec4 sceneColor = texture2D(uSampler, mix(vTextureCoord, final_distorted_uv, waterMaskValue));
                                
                                // Apply smeared color if needed
                                if (needsSmearing && wallMask > 0.01) {
                                    // Blend between smeared pixels and wall color
                                    vec3 blendedWallColor = mix(smearedColor, u_depthWallColor, u_depthWallSmearBlend);
                                    sceneColor.rgb = mix(sceneColor.rgb, blendedWallColor, wallMask * u_depthWallIntensity);
                                }

                                vec3 finalColor = sceneColor.rgb;

                                if (u_caustics_enabled) {
                                    float time = u_time * u_causticsSpeed;
                                    vec3 dist_coord = vec3(flowed_world_coord * u_causticsLineDistortionScale * 0.01, time * 2.0);
                                    float distortion_noise = snoise(dist_coord) * u_causticsLineDistortion;
                                    vec3 coord1 = vec3(flowed_world_coord * u_causticsScale * 0.02 + distortion_noise, time);
                                    float pattern1 = pow(max(0.0, 1.0 - abs(snoise(coord1))), u_causticsLineSharpness);
                                    vec3 coord2 = vec3(flowed_world_coord * u_causticsScale * 0.01 - distortion_noise, time * 0.5);
                                    float pattern2 = pow(max(0.0, 1.0 - abs(snoise(coord2))), u_causticsLineSharpness);
                                    vec3 rough_coord = vec3(flowed_world_coord * u_causticsRoughnessScale * 0.01, time * 1.5);
                                    float roughness_noise = snoise(rough_coord) * 0.5 + 0.5;
                                    roughness_noise = 1.0 - u_causticsRoughnessIntensity + (roughness_noise * u_causticsRoughnessIntensity);
                                    vec3 coord3 = vec3(flowed_world_coord * u_causticsScale * 0.005, time * 0.2);
                                    float bloom_pattern = smoothstep(0.6, 1.0, snoise(coord3) * 0.5 + 0.5);
                                    float line_pattern = pattern1 * pattern2 * u_causticsIntersectionBoost;
                                    float final_pattern = (line_pattern * roughness_noise) + bloom_pattern * u_causticsBloomIntensity;
                                    vec3 caustics = u_causticsColor * final_pattern * u_causticsIntensity;

                                    if (u_causticsCloudOcclusionEnabled) {
                                        float cloudValue = texture2D(u_cloudShadows, vScreenCoord).r;
                                        float occlusionFactor = 1.0 - (cloudValue * u_causticsCloudOcclusionIntensity);
                                        caustics *= occlusionFactor;
                                    }

                                    // Exclude caustics from puddle areas
                                    float causticsArea = max(waterMaskValue, causticsMaskValue);
                                    if (u_puddles_enabled && u_usePuddleMask) {
                                        float puddleMaskValue = texture2D(u_puddleMask, vTextureCoord).r;
                                        causticsArea *= (1.0 - puddleMaskValue * u_puddleIntensity);
                                    }
                                    finalColor += caustics * causticsArea;
                                }

                                if (u_surface_enabled) {
                                    vec2 baseFoamUV = final_distorted_world_coord * u_openWaterFbmScale * 0.01;
                                    baseFoamUV += u_time * u_openWaterFbmSpeed;
                                    float foamTime = u_time * u_openWaterFbmEvolution;
                                    float foamNoise = fbm(vec3(baseFoamUV, foamTime), u_openWaterFbmOctaves, u_openWaterFbmLacunarity, u_openWaterFbmPersistence);
                                    float openWaterFoamAmount = smoothstep(1.0 - u_openWaterFoamCoverage, 1.0 - u_openWaterFoamCoverage + u_openWaterFoamSharpness, foamNoise);
                                    vec3 openWaterFoamResult = u_openWaterFoamColor * openWaterFoamAmount * u_openWaterFoamIntensity;

                                    vec3 specularityResult = vec3(0.0);
                                    if (u_specularity_enabled) {
                                        vec2 normal_xy = texture2D(u_displacementMap, final_distorted_uv).rg * 2.0 - 1.0;
                                        vec3 normal = normalize(vec3(normal_xy, sqrt(1.0 - clamp(dot(normal_xy, normal_xy), 0.0, 1.0))));
                                        vec3 viewDir = vec3(0.0, 0.0, 1.0);
                                        vec3 lightDir = normalize(u_specularity_light_direction);
                                        vec3 halfwayDir = normalize(lightDir + viewDir);
                                        float specAngle = max(dot(normal, halfwayDir), 0.0);
                                        float specularity = pow(specAngle, u_specularity_shininess);
                                        float outdoorsMaskValue = texture2D(u_outdoorsMask, vTextureCoord).r;
                                        specularityResult = u_specularity_color * specularity * u_specularity_intensity * outdoorsMaskValue;

                                        if (u_specularityCloudOcclusionEnabled) {
                                            float cloudValue = texture2D(u_cloudShadows, vScreenCoord).r;
                                            float occlusionFactor = 1.0 - (cloudValue * u_specularityCloudOcclusionIntensity);
                                            specularityResult *= occlusionFactor;
                                        }
                                    }

                                    finalColor += (openWaterFoamResult + specularityResult) * waterMaskValue;
                                }

                                if (u_shoreline_enabled) {
                                    float shorelineMaskValue = u_useShorelineMask ? texture2D(u_shorelineMask, vTextureCoord).r : clamp((texture2D(u_blurredWaterMask, vTextureCoord).r - waterMaskValue) * 5.0, 0.0, 1.0);

                                    vec2 final_foam_uv = final_distorted_world_coord * u_shorelinePatternScale * 0.01;
                                    final_foam_uv.x += u_time * u_shorelinePatternSpeed;
                                    float foam_time = u_time * u_shorelinePatternEvolution;
                                    float foam_noise = fbm(vec3(final_foam_uv, foam_time), u_shorelinePatternOctaves, u_shorelinePatternLacunarity, u_shorelinePatternPersistence);
                                    foam_noise = (foam_noise - 0.5 + u_shorelinePatternBrightness) * u_shorelinePatternContrast + 0.5;
                                    float final_foam_amount = clamp(foam_noise, 0.0, 1.0) * shorelineMaskValue;

                                    vec3 shoreline_foam_result = u_shorelineFoamColor * final_foam_amount * u_shorelineFoamIntensity;
                                    finalColor += shoreline_foam_result;
                                }

                                if (u_murkiness_enabled) {
                                    vec2 wavy_uv = flowed_world_coord * u_wavy_scale * 0.01;
                                    float wavy_noise = snoise(vec3(wavy_uv, u_time * u_wavy_speed)) * 0.5 + 0.5;
                                    float wavy_occlusion = wavy_noise * u_wavy_strength;

                                    vec2 sandy_uv = flowed_world_coord * u_sandy_scale * 0.01;
                                    float sandy_noise = fbm(vec3(sandy_uv, u_time * u_sandy_speed), 4, 2.5, 0.4);
                                    
                                    // Add larger scale modulation noise to vary sandy texture opacity
                                    vec2 modulation_uv = flowed_world_coord * u_sandy_modulation_scale * 0.01;
                                    float modulation_noise = snoise(vec3(modulation_uv, u_time * u_sandy_modulation_speed)) * 0.5 + 0.5;
                                    float modulation_factor = mix(1.0 - u_sandy_modulation_strength, 1.0, modulation_noise);
                                    
                                    float sandy_occlusion = sandy_noise * u_sandy_strength * modulation_factor;

                                    float total_occlusion = (wavy_occlusion + sandy_occlusion) * waterMaskValue;
                                    total_occlusion = clamp(total_occlusion, 0.0, 1.0);

                                    finalColor = mix(finalColor, u_murkiness_color, total_occlusion);
                                }
                                
                                if (u_depthDisplacementEnabled) {
                                    finalColor *= (1.0 - (waterMaskValue * u_depthDisplacementDarken));
                                }

                                // --- PUDDLES ---
                                if (u_puddles_enabled && u_puddleIntensity > 0.0) {
                                    float puddleMaskValue = u_usePuddleMask ? texture2D(u_puddleMask, vTextureCoord).r : 0.0;
                                    if (puddleMaskValue > 0.01) {
                                        float effectivePuddleIntensity = puddleMaskValue * u_puddleIntensity;
                                        
                                        // Apply water distortion to puddles (like real water)
                                        // Mix between undistorted and distorted based on puddle intensity
                                        vec2 puddleDistortedUV = mix(vTextureCoord, final_distorted_uv, effectivePuddleIntensity * 0.5);
                                        vec4 distortedScene = texture2D(uSampler, puddleDistortedUV);
                                        
                                        // Apply darkening beneath puddles
                                        vec3 puddleColor = distortedScene.rgb * (1.0 - (effectivePuddleIntensity * u_puddleDarkening));
                                        
                                        // Apply smooth water specular highlights on puddles (same as main water, not metallic stripes!)
                                        if (u_specularity_enabled) {
                                            vec2 normal_xy = texture2D(u_displacementMap, final_distorted_uv).rg * 2.0 - 1.0;
                                            vec3 normal = normalize(vec3(normal_xy, sqrt(1.0 - clamp(dot(normal_xy, normal_xy), 0.0, 1.0))));
                                            vec3 viewDir = vec3(0.0, 0.0, 1.0);
                                            vec3 lightDir = normalize(u_specularity_light_direction);
                                            vec3 halfwayDir = normalize(lightDir + viewDir);
                                            float specAngle = max(dot(normal, halfwayDir), 0.0);
                                            float specularity = pow(specAngle, u_specularity_shininess);
                                            
                                            // Apply outdoor mask modulation (puddles in shaded areas should have less shine)
                                            float outdoorsMaskValue = texture2D(u_outdoorsMask, vTextureCoord).r;
                                            
                                            // Use same specular calculation as main water (no stripes)
                                            vec3 puddleSpecular = u_specularity_color * specularity * u_specularity_intensity * effectivePuddleIntensity * outdoorsMaskValue;
                                            
                                            // Apply cloud occlusion to puddle specularity
                                            if (u_specularityCloudOcclusionEnabled) {
                                                float cloudValue = texture2D(u_cloudShadows, vScreenCoord).r;
                                                float occlusionFactor = 1.0 - (cloudValue * u_specularityCloudOcclusionIntensity);
                                                puddleSpecular *= occlusionFactor;
                                            }
                                            
                                            puddleColor += puddleSpecular;
                                        }
                                        
                                        // Blend puddle effect with original scene
                                        finalColor = mix(finalColor, puddleColor, effectivePuddleIntensity);
                                    }
                                }

                                gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), sceneColor.a);
                            }
                        `;

    super(vertexSrc, fragmentSrc, {
      ...options,
      u_displacementMap: options.u_displacementMap ?? PIXI.Texture.EMPTY,
      u_waterMask: options.u_waterMask ?? PIXI.Texture.EMPTY,
      u_causticsMask: options.u_causticsMask ?? PIXI.Texture.EMPTY,
      u_hasCausticsMask: options.u_hasCausticsMask ?? false,
      u_shorelineMask: options.u_shorelineMask ?? PIXI.Texture.EMPTY,
      u_blurredWaterMask: options.u_blurredWaterMask ?? PIXI.Texture.EMPTY,
      u_cloudShadows: options.u_cloudShadows ?? PIXI.Texture.EMPTY,
      u_outdoorsMask: options.u_outdoorsMask ?? PIXI.Texture.WHITE,
      u_puddleMask: options.u_puddleMask ?? PIXI.Texture.EMPTY,
      u_usePuddleMask: options.u_usePuddleMask ?? false,
      u_noWaterMask: options.u_noWaterMask ?? PIXI.Texture.EMPTY,
      u_useNoWaterMask: options.u_useNoWaterMask ?? false,

      uSceneRectNorm: [0, 0, 1, 1],
      u_canvas_scale: 1.0,
      
      u_puddles_enabled: false,
      u_puddleIntensity: 0.0,
      u_puddleDarkening: 0.2,

      u_depthDisplacementEnabled: true,

      u_depthDisplacementStrength: 0.005,

      u_depthDisplacementDarken: 0.15,

      u_depthWallColor: [0.05, 0.1, 0.15],

      u_depthWallIntensity: 0.8,

      u_depthWallSmearBlend: 0.3,

      u_specularityCloudOcclusionEnabled: true,

      u_specularityCloudOcclusionIntensity: 1.0,

      u_causticsLineSharpness: 20.0,

      u_causticsBloomIntensity: 0.3,

      u_causticsLineDistortion: 0.3,

      u_causticsLineDistortionScale: 1.5,

      u_causticsIntersectionBoost: 4.0,

      u_causticsRoughnessScale: 5.0,

      u_causticsRoughnessIntensity: 0.4,

      u_causticsCloudOcclusionEnabled: true,

      u_causticsCloudOcclusionIntensity: 0.8,

      u_shorelinePatternScale: 5.0,

      u_shorelinePatternSpeed: 0.1,

      u_shorelinePatternEvolution: 0.2,

      u_shorelinePatternOctaves: 3,

      u_shorelinePatternLacunarity: 2.0,

      u_shorelinePatternPersistence: 0.5,

      u_shorelinePatternBrightness: 0.5,

      u_shorelinePatternContrast: 1.5,

      u_shorelineDisplacementEnabled: true,

      u_shorelineDisplacementScale: 2.0,

      u_shorelineDisplacementSpeed: 0.05,

      u_shorelineDisplacementStrength: 10.0,

      u_flow_enabled: false,

      u_flow_direction: [1, 0],

      u_flow_speed: 0.0,

      u_murkiness_enabled: false,

      u_murkiness_color: [0, 0, 0],

      u_wavy_strength: 0.0,

      u_wavy_scale: 0.0,

      u_wavy_speed: 0.0,

      u_sandy_strength: 0.0,

      u_sandy_scale: 0.0,

      u_sandy_speed: 0.0,

      u_sandy_modulation_scale: 3.0,

      u_sandy_modulation_speed: 0.01,

      u_sandy_modulation_strength: 0.5,
    });
  }
}



class BiofilmMaskFilter extends PIXI.Filter {
  constructor(options = {}) {
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

                uniform sampler2D uSampler; // The input texture (the rendered particles)
                uniform sampler2D uOutdoorsMask; // The outdoors mask
                uniform sampler2D uWaterMask; // The water mask

                void main() {
                    // Get the color of the particle at this pixel
                    vec4 particleColor = texture2D(uSampler, vTextureCoord);

                    // Get the value of both masks at the same screen position
                    float outdoorsMaskValue = texture2D(uOutdoorsMask, vScreenCoord).r;
                    float waterMaskValue = texture2D(uWaterMask, vScreenCoord).r;

                    // Multiply the particle's color by both mask values.
                    // This ensures particles are only visible where both masks are bright.
                    particleColor *= outdoorsMaskValue * waterMaskValue;

                    gl_FragColor = particleColor;
                }
            `;

    super(vertexSrc, fragmentSrc, {
      uOutdoorsMask: options.uOutdoorsMask ?? PIXI.Texture.EMPTY,
      uWaterMask: options.uWaterMask ?? PIXI.Texture.EMPTY,
    });
  }
}

export class WaterFXLayer extends MaskedEffectLayer {
  constructor() {
    super({
      maskSuffix: "water",
      effectKey: "water",
    });

    // Water effect properties
    this.waterEffectsFilter = null;
    this.displacementFilter = null;
    this.displacementSprite = null;
    this.displacementTexture = null;
    this.blurFilter = null;
    this.blurSourceSprite = null;
    this.blurredWaterMaskTexture = null;
    this.shorelineMaskContainer = null;
    this.shorelineMaskTexture = null;
    this.shorelineMaskSprites = new Map();
    this.causticsMaskContainer = null;
    this.combinedCausticsMaskTexture = null;
    this.causticsMaskSprites = new Map();
    this.puddleMaskContainer = null;
    this.puddleMaskTexture = null;
    this.puddleMaskSprites = new Map();
    this.noWaterMaskContainer = null;
    this.noWaterMaskTexture = null;
    this.noWaterMaskSprites = new Map();
    this._needsShorelineMaskUpdate = true;
    this._needsCausticsMaskUpdate = true;
    this._needsPuddleMaskUpdate = true;
    this._needsNoWaterMaskUpdate = true;
    this.time = 0;
    this._puddleIntensity = 0; // Weather-driven puddle intensity (0-1)
    this._smoothedSpeed = 1.0; // Smoothed displacement speed to prevent specular jitter during transitions
  }

  static getSettingsHTML() {
    return DebuggerUIBuilder._createAccordionHTML(
      "water",
      "Water Effects",
      `
                            ${DebuggerUIBuilder._createTextureInputHTML(
                              "water",
                              "Water Mask (_Water)"
                            )}
                            <p class="description-text">A multi-layered effect for water surfaces, foam, and underwater caustics. Requires a _Water.webp mask.</p>

                            <details id="details-water-flow">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.flow.enabled",
                                  "Water Flow",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    <p class="description-text">Applies a directional current to all animated water effects.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.flow.angle",
                                      "Angle",
                                      0,
                                      360,
                                      1,
                                      "The direction of the water flow in degrees."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.flow.speed",
                                      "Speed",
                                      0,
                                      50,
                                      0.5,
                                      "The speed of the current."
                                    )}
                                </div>
                            </details>

                            <details id="details-water-murkiness">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.murkiness.enabled",
                                  "Murkiness & Occlusion",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    <p class="description-text">Makes the water opaque, hiding what is underneath. Occlusion is stronger in deeper water.</p>
                                    ${DebuggerUIBuilder._createColorPickerHTML(
                                      "water.murkiness.color",
                                      "Murky Color"
                                    )}
                                    <details id="details-water-murkiness-wavy">
                                        <summary><span class="accordion-toggle"></span><strong>Large Wavy Occlusion</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.murkiness.wavyNoise.strength",
                                              "Strength",
                                              0,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.murkiness.wavyNoise.scale",
                                              "Scale",
                                              0.01,
                                              5,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.murkiness.wavyNoise.speed",
                                              "Speed",
                                              0,
                                              5,
                                              0.01
                                            )}
                                        </div>
                                    </details>
                                    <details id="details-water-murkiness-sandy">
                                        <summary><span class="accordion-toggle"></span><strong>Fine Sandy Occlusion</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.murkiness.sandyNoise.strength",
                                              "Strength",
                                              0,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.murkiness.sandyNoise.scale",
                                              "Scale",
                                              1,
                                              50,
                                              0.5
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.murkiness.sandyNoise.speed",
                                              "Speed",
                                              0,
                                              25,
                                              0.5
                                            )}
                                            <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                                                <strong style="display: block; margin-bottom: 4px;">Opacity Modulation</strong>
                                                ${DebuggerUIBuilder._createSliderHTML(
                                                  "water.murkiness.sandyNoise.modulationScale",
                                                  "Modulation Scale",
                                                  0.1,
                                                  100,
                                                  0.1
                                                )}
                                                ${DebuggerUIBuilder._createSliderHTML(
                                                  "water.murkiness.sandyNoise.modulationSpeed",
                                                  "Modulation Speed",
                                                  0,
                                                  5,
                                                  0.01
                                                )}
                                                ${DebuggerUIBuilder._createSliderHTML(
                                                  "water.murkiness.sandyNoise.modulationStrength",
                                                  "Modulation Strength",
                                                  0,
                                                  1,
                                                  0.01
                                                )}
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </details>

                            <details id="details-water-wave">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.wave.enabled",
                                  "Wave Distortion",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    <p class="description-text">Controls the underlying ripple/wobble of the water surface. This distortion affects the scene viewed through the water, as well as the foam and sheen on the surface.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.wave.speed",
                                      "Speed",
                                      0,
                                      25,
                                      0.5,
                                      "The animation speed of the wave noise pattern."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.wave.scale",
                                      "Scale",
                                      0.1,
                                      40,
                                      0.1,
                                      "The zoom level of the wave noise. Larger values create smaller, more frequent ripples."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.wave.intensity",
                                      "Intensity",
                                      0,
                                      0.05,
                                      0.0001,
                                      "The strength of the distortion. Higher values push the pixels further."
                                    )}
                                    <details id="details-water-rain-ripple">
                                        <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                          "water.wave.rainRipple.enabled",
                                          "Rain Ripples (Weather)",
                                          true
                                        )}</div></summary>
                                        <div style="padding-left: 5px;">
                                            <p class="description-text">Automatically adjust wave parameters during rain/storm weather. Only affects outdoor water areas (uses _Outdoors mask).</p>
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.wave.rainRipple.speed",
                                              "Rain Speed",
                                              0,
                                              25,
                                              0.1,
                                              "Wave animation speed during rain. Higher values create faster, more chaotic ripples."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.wave.rainRipple.scale",
                                              "Rain Scale",
                                              0.1,
                                              40,
                                              0.1,
                                              "Wave noise scale during rain. Higher values create smaller, more frequent rain ripples."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.wave.rainRipple.intensity",
                                              "Rain Intensity",
                                              0,
                                              0.05,
                                              0.0001,
                                              "Wave distortion strength during rain. This will be blended based on weather state intensity (drizzle/rain/storm)."
                                            )}
                                        </div>
                                    </details>
                                </div>
                            </details>
                            <details id="details-water-depth-displacement">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.depthDisplacement.enabled",
                                  "Depth Parallax",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    <p class="description-text">Creates a "faux-3D" parallax effect by displacing the map under the water based on the water mask's brightness, simulating depth.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.depthDisplacement.strength",
                                      "Strength",
                                      0,
                                      0.05,
                                      0.0005,
                                      "How much the underlying map is shifted downwards. Higher values make the water appear deeper."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.depthDisplacement.darken",
                                      "Darkening",
                                      0,
                                      1,
                                      0.01,
                                      "How much to darken the displaced image. This is applied in addition to any Murkiness."
                                    )}
                                    ${DebuggerUIBuilder._createColorPickerHTML(
                                      "water.depthDisplacement.wallColor",
                                      "Wall Color",
                                      "The color used to fill the gaps/walls created by the parallax displacement at water edges."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.depthDisplacement.wallIntensity",
                                      "Wall Intensity",
                                      0,
                                      1,
                                      0.01,
                                      "Controls how strongly the wall color is applied to gap areas. 0 = no wall color, 1 = full wall color."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.depthDisplacement.wallSmearBlend",
                                      "Smear/Wall Blend",
                                      0,
                                      1,
                                      0.01,
                                      "Controls the blend between smeared pixels and wall color. 0 = pure pixel smearing, 1 = pure wall color."
                                    )}
                                </div>
                            </details>
                            <details id="details-water-surface">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.surface.enabled",
                                  "Open Water Surface",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    <details id="details-water-foam">
                                        <summary><span class="accordion-toggle"></span><strong>Foam</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createColorPickerHTML(
                                              "water.surface.foamColor",
                                              "Color"
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.surface.foamIntensity",
                                              "Base Intensity",
                                              0,
                                              2,
                                              0.05
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.surface.foamCoverage",
                                              "Coverage",
                                              0,
                                              1,
                                              0.01,
                                              "Amount of water surface covered by foam."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.surface.foamSharpness",
                                              "Edge Sharpness",
                                              0.01,
                                              1,
                                              0.01,
                                              "Hardness of the foam edges."
                                            )}
                                            <details id="details-water-foam-fbm">
                                                <summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                                                <div style="padding-left: 5px;">
                                                    <p class="description-text">Controls the procedural noise used for the foam pattern.</p>
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.surface.fbmScale",
                                                      "Scale",
                                                      0.001,
                                                      50,
                                                      0.001
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.surface.fbmSpeed",
                                                      "Speed",
                                                      0,
                                                      25,
                                                      0.5,
                                                      "Directional drift speed of the foam."
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.surface.fbmEvolution",
                                                      "Evolution",
                                                      0,
                                                      25,
                                                      0.5,
                                                      'Internal "boiling" speed of the foam.'
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.surface.fbmOctaves",
                                                      "Complexity (Octaves)",
                                                      1,
                                                      8,
                                                      1
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.surface.fbmLacunarity",
                                                      "Detail Scale",
                                                      1.5,
                                                      4,
                                                      0.05
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.surface.fbmPersistence",
                                                      "Roughness",
                                                      0.1,
                                                      1,
                                                      0.05
                                                    )}
                                                </div>
                                            </details>
                                        </div>
                                    </details>
                                    <details id="details-water-specularity">
                                        <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                          "water.surface.specularity.enabled",
                                          "Specular Highlights",
                                          true
                                        )}</div></summary>
                                        <div style="padding-left: 5px;">
                                            <p class="description-text">Simulates physically-based light reflections (shine) off the water surface.</p>
                                            ${DebuggerUIBuilder._createColorPickerHTML(
                                              "water.surface.specularity.color",
                                              "Color"
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.surface.specularity.intensity",
                                              "Intensity",
                                              0,
                                              5,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.surface.specularity.shininess",
                                              "Shininess",
                                              2,
                                              1024,
                                              2,
                                              "Controls the size and sharpness of the highlights. Higher values are smaller and sharper."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.surface.specularity.lightAngle",
                                              "Light Angle",
                                              0,
                                              360,
                                              1,
                                              "The direction the light is coming from, in degrees."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.surface.specularity.lightElevation",
                                              "Light Elevation",
                                              0,
                                              90,
                                              1,
                                              "The height of the light source in the sky. 90 is directly overhead."
                                            )}
                                            <details id="details-water-specularity-cloudOcclusion" style="margin-top: 5px;">
                                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                                  "water.surface.specularity.cloudOcclusion.enabled",
                                                  "Cloud Occlusion",
                                                  true
                                                )}</div></summary>
                                                <div style="padding-left: 5px;">
                                                    <p class="description-text">Uses the Cloud Shadows texture to darken the highlights, simulating them being obscured by clouds.</p>
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.surface.specularity.cloudOcclusion.intensity",
                                                      "Intensity",
                                                      0,
                                                      1,
                                                      0.01
                                                    )}
                                                </div>
                                            </details>
                                        </div>
                                    </details>
                                </div>
                            </details>
                            <details id="details-water-caustics">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.caustics.enabled",
                                  "Underwater Caustics",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.intensity",
                                      "Intensity",
                                      0,
                                      1,
                                      0.001
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.scale",
                                      "Scale",
                                      0.1,
                                      10,
                                      0.1
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.speed",
                                      "Speed",
                                      0,
                                      15,
                                      0.1
                                    )}
                                    ${DebuggerUIBuilder._createColorPickerHTML(
                                      "water.caustics.color",
                                      "Caustic Color"
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.lineSharpness",
                                      "Line Sharpness",
                                      1,
                                      40,
                                      1,
                                      "Exponent for sharpening the caustic lines."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.bloomIntensity",
                                      "Bloom Intensity",
                                      0,
                                      1,
                                      0.01,
                                      "Brightness of the soft underlying glow."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.lineDistortion",
                                      "Line Distortion",
                                      0,
                                      2,
                                      0.01,
                                      "How much the lines are broken up and warped."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.lineDistortionScale",
                                      "Distortion Scale",
                                      0.1,
                                      10,
                                      0.1,
                                      "The scale of the line distortion noise."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.intersectionBoost",
                                      "Intersection Boost",
                                      1,
                                      20,
                                      0.1,
                                      "Multiplies the brightness of intersecting lines."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.roughnessScale",
                                      "Roughness Scale",
                                      0.1,
                                      20,
                                      0.1,
                                      "Scale of the noise that breaks up the lines."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.caustics.roughnessIntensity",
                                      "Roughness Intensity",
                                      0,
                                      1,
                                      0.01,
                                      "How strongly the noise affects line brightness."
                                    )}
                                    <details id="details-water-caustics-cloudOcclusion" style="margin-top: 5px;">
                                        <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                          "water.caustics.cloudOcclusion.enabled",
                                          "Cloud Occlusion",
                                          true
                                        )}</div></summary>
                                        <div style="padding-left: 5px;">
                                            <p class="description-text">Uses the Cloud Shadows texture to darken the caustics, simulating them being obscured by clouds.</p>
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.caustics.cloudOcclusion.intensity",
                                              "Intensity",
                                              0,
                                              1,
                                              0.01
                                            )}
                                        </div>
                                    </details>
                                </div>
                            </details>
                            <details id="details-water-shoreline">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.shoreline.enabled",
                                  "Shoreline Foam",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    ${DebuggerUIBuilder._createTextureInputHTML(
                                      "shoreline",
                                      "Shoreline Override (_Shoreline)"
                                    )}
                                    <p class="description-text">Controls foam near land. Best results with a soft-edged, grayscale _Shoreline map.</p>

                                    <details><summary><span class="accordion-toggle"></span><strong>Foam Appearance</strong></summary><div style="padding-left: 8px;">
                                        ${DebuggerUIBuilder._createColorPickerHTML(
                                          "water.shoreline.foamColor",
                                          "Foam Color"
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamIntensity",
                                          "Intensity",
                                          0,
                                          5,
                                          0.1
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.detectionBlur",
                                          "Auto-Detection Blur",
                                          1,
                                          32,
                                          1,
                                          "Thickness of the shoreline when auto-detected (no _Shoreline file)."
                                        )}
                                    </div></details>

                                    <details id="details-water-shoreline-displacement">
                                        <summary><span class="accordion-toggle"></span>
                                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                              "water.shoreline.displacement.enabled",
                                              "Displacement Swirl",
                                              true
                                            )}</div>
                                        </summary>
                                        <div style="padding-left: 8px;">
                                            <p class="description-text">Adds a swirling distortion to the shoreline foam pattern, simulating churning water.</p>
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.shoreline.displacement.scale",
                                              "Swirl Scale",
                                              0.1,
                                              10,
                                              0.1,
                                              "The size of the swirling patterns."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.shoreline.displacement.speed",
                                              "Swirl Speed",
                                              0,
                                              15,
                                              0.1,
                                              "How fast the swirls animate."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.shoreline.displacement.strength",
                                              "Swirl Strength",
                                              0,
                                              0.05,
                                              0.0005,
                                              "How much the foam pattern is distorted by the swirl."
                                            )}
                                        </div>
                                    </details>

                                    <details><summary><span class="accordion-toggle"></span><strong>Foam Pattern (FBM)</strong></summary><div style="padding-left: 8px;">
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.scale",
                                          "Scale",
                                          1,
                                          50,
                                          0.5
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.speed",
                                          "Speed",
                                          0,
                                          25,
                                          0.1,
                                          "Directional drift speed of the foam."
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.evolution",
                                          "Evolution",
                                          0,
                                          25,
                                          0.5,
                                          'Internal "boiling" speed of the foam.'
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.octaves",
                                          "Complexity (Octaves)",
                                          1,
                                          8,
                                          1
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.lacunarity",
                                          "Detail Scale",
                                          1.5,
                                          4,
                                          0.05
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.persistence",
                                          "Roughness",
                                          0.1,
                                          1,
                                          0.05
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.brightness",
                                          "Brightness",
                                          0,
                                          1,
                                          0.01
                                        )}
                                        ${DebuggerUIBuilder._createSliderHTML(
                                          "water.shoreline.foamPattern.contrast",
                                          "Contrast",
                                          0,
                                          5,
                                          0.05
                                        )}
                                    </div></details>

                                </div>
                            </details>
                            <details id="details-water-puddles">
                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                  "water.puddles.enabled",
                                  "Rain Puddles",
                                  true
                                )}</div></summary>
                                <div style="padding-left: 5px;">
                                    ${DebuggerUIBuilder._createTextureInputHTML(
                                      "puddle",
                                      "Puddle Locations (_Puddle)"
                                    )}
                                    <p class="description-text">Dynamic puddles that appear during rain/storms. Requires a _Puddle.webp mask. Intensity is automatically controlled by weather.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.puddles.darkening",
                                      "Darkening",
                                      0,
                                      1,
                                      0.01,
                                      "How much puddles darken the underlying surface."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "water.puddles.dryingTimeMinutes",
                                      "Drying Time (Minutes)",
                                      0,
                                      30,
                                      0.5,
                                      "How long puddles take to completely dry after rain stops. Set to 0 for instant removal."
                                    )}
                                </div>
                            </details>
                            <details id="details-water-glint-particles">
                                <summary><span class="accordion-toggle"></span>
                                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                      "water.glintParticles.enabled",
                                      "Water Glints / Spray",
                                      true
                                    )}</div>
                                </summary>
                                <div style="padding-left: 8px;">
                                    <p class="description-text">General-purpose particles spawned across the entire water surface.</p>
                                    ${DebuggerUIBuilder._createSelectHTML(
                                      "water.glintParticles.blendMode",
                                      "Blend Mode",
                                      BLEND_MODE_OPTIONS
                                    )}
                                    <details>
                                        <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.glintParticles.maskInfluence",
                                              "Particle Density",
                                              0.01,
                                              5,
                                              0.01,
                                              "Controls the maximum number of particles."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.glintParticles.frequency",
                                              "Spawn Rate (s)",
                                              0.001,
                                              1,
                                              0.001,
                                              "Time in seconds between particle spawns. Lower is faster."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "water.glintParticles.maskThreshold",
                                              "Spawn Threshold",
                                              0,
                                              1,
                                              0.01,
                                              "Water mask brightness required to spawn particles."
                                            )}
                                        </div>
                                    </details>
                                    <details>
                                        <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createTextInputHTML(
                                              "water.glintParticles.particleTexture",
                                              "Particle Texture",
                                              "Path to the particle image."
                                            )}
                                            <details>
                                                <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                                                <div style="padding-left: 5px;">
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.lifetime.min",
                                                      "Min Lifetime (s)",
                                                      0.1,
                                                      20,
                                                      0.1
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.lifetime.max",
                                                      "Max Lifetime (s)",
                                                      0.1,
                                                      20,
                                                      0.1
                                                    )}
                                                </div>
                                            </details>
                                            ${DebuggerUIBuilder._createGradientEditorHTML(
                                              "water.glintParticles.colorAlphaGradient",
                                              "Color & Alpha Over Life"
                                            )}
                                            ${DebuggerUIBuilder._createGradientEditorHTML(
                                              "water.glintParticles.emissiveGradient",
                                              "Emissive (Brightness) Over Life"
                                            )}
                                            <details>
                                                <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                                                <div style="padding-left: 5px;">
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.scale.sizeMultiplier",
                                                      "Global Size",
                                                      0.1,
                                                      10,
                                                      0.1,
                                                      "A global multiplier for particle size."
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.scale.start",
                                                      "Start Scale Mult",
                                                      0,
                                                      2,
                                                      0.01,
                                                      "Particle size at birth (multiplied by Global Size)."
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.scale.end",
                                                      "End Scale Mult",
                                                      0,
                                                      2,
                                                      0.01,
                                                      "Particle size at death (multiplied by Global Size)."
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.scale.minMult",
                                                      "Random Size Min",
                                                      0.1,
                                                      1,
                                                      0.01,
                                                      "Minimum random scale multiplier for each particle (from this value to 1.0)."
                                                    )}
                                                </div>
                                            </details>
                                        </div>
                                    </details>
                                    <details>
                                        <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                                        <div style="padding-left: 5px;">
                                            <details>
                                                <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                                                <div style="padding-left: 5px;">
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.speed.start",
                                                      "Start Speed",
                                                      -50,
                                                      50,
                                                      1
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.speed.end",
                                                      "End Speed",
                                                      -50,
                                                      50,
                                                      1
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.speed.minMult",
                                                      "Random Speed Min",
                                                      0.1,
                                                      1,
                                                      0.01,
                                                      "Minimum random speed multiplier for each particle (from this value to 1.0)."
                                                    )}
                                                </div>
                                            </details>
                                            <details>
                                                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                                  "water.glintParticles.rotation.enabled",
                                                  "Tumbling / Rotation",
                                                  true
                                                )}</div></summary>
                                                <div style="padding-left: 5px;">
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.rotation.minSpeed",
                                                      "Min Rot. Speed",
                                                      -180,
                                                      180,
                                                      1,
                                                      "Degrees per second."
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.rotation.maxSpeed",
                                                      "Max Rot. Speed",
                                                      -180,
                                                      180,
                                                      1,
                                                      "Degrees per second."
                                                    )}
                                                    ${DebuggerUIBuilder._createSliderHTML(
                                                      "water.glintParticles.rotation.accel",
                                                      "Rot. Accel.",
                                                      -90,
                                                      90,
                                                      1,
                                                      "Degrees per second squared."
                                                    )}
                                                </div>
                                            </details>
                                        </div>
                                    </details>
                                </div>
                            </details>
                        `
    );
  }

  async _draw(options) {
    await super._draw(options);
    this.time = 0;
    this._needsShorelineMaskUpdate = true;
    this._needsCausticsMaskUpdate = true;
    const renderer = canvas.app.renderer;

    // --- Main Water Filter ---
    try {
      this.waterEffectsFilter = safeCreateFilter(WaterEffectsFilter, {}, "WaterEffectLayer");
      if (this.waterEffectsFilter) {
        safeApplyFilters(
          canvas.primary,
          [...(canvas.primary.filters || []), this.waterEffectsFilter],
          "canvas.primary (Water)"
        );
      }
      systemStatus.update("shaders", "water", {
        state: "ok",
        message: "Compiled successfully.",
      });
    } catch (e) {
      console.error("MapShine | Failed to compile WaterEffectsFilter", e);
      systemStatus.update("shaders", "water", {
        state: "error",
        message: `Compilation failed: ${e.message}`,
      });
    }

    // --- Shared Resources ---
    // PERFORMANCE OPTIMIZATION: Use half-resolution for displacement and blur textures
    const halfWidth = Math.floor(renderer.screen.width / 2);
    const halfHeight = Math.floor(renderer.screen.height / 2);

    this.displacementFilter = new WaveDisplacementFilter();
    this.displacementSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    this.displacementSprite.width = halfWidth;
    this.displacementSprite.height = halfHeight;
    this.displacementSprite.filters = [this.displacementFilter];

    // Displacement texture at half resolution - distortion is imperceptible at lower res
    this.displacementTexture = PIXI.RenderTexture.create({
      width: halfWidth,
      height: halfHeight,
    });

    const initialBlur =
      game.mapShine.profileManager.activeConfig.water.shoreline.detectionBlur;

    this.blurFilter = new PIXI.BlurFilter(initialBlur, 4);

    // Blurred water mask at half resolution - blur is faster on smaller textures
    this.blurredWaterMaskTexture = PIXI.RenderTexture.create({
      width: halfWidth,
      height: halfHeight,
    });

    // Set texture wrap mode to CLAMP to prevent edge artifacts from blur operations
    this.blurredWaterMaskTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;

    this.blurSourceSprite = new PIXI.Sprite(this.getMaskTexture());
    this.blurSourceSprite.filters = [this.blurFilter];
    this.shorelineMaskContainer = new PIXI.Container();

    this.shorelineMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });

    this.causticsMaskContainer = new PIXI.Container();

    this.combinedCausticsMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });

    this.puddleMaskContainer = new PIXI.Container();

    this.puddleMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });

    this.noWaterMaskContainer = new PIXI.Container();

    this.noWaterMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });

    await this.updateFromConfig(game.mapShine.profileManager.activeConfig);
  }

  _updateWaterFilterUniforms(filter, wConfig) {
    if (!filter) return;
    const u = filter.uniforms;

    // Depth Displacement
    const depthConfig = wConfig.depthDisplacement;
    if (depthConfig) {
      u.u_depthDisplacementEnabled = depthConfig.enabled;
      u.u_depthDisplacementStrength = depthConfig.strength;
      u.u_depthDisplacementDarken = depthConfig.darken;
      u.u_depthWallColor = hexToRgbArray(depthConfig.wallColor);
      u.u_depthWallIntensity = depthConfig.wallIntensity;
      u.u_depthWallSmearBlend = depthConfig.wallSmearBlend;
    }

    // Flow
    if (wConfig.flow) {
      u.u_flow_enabled = wConfig.flow.enabled;
      const flowAngleRad = wConfig.flow.angle * (Math.PI / 180.0);
      u.u_flow_direction = [Math.cos(flowAngleRad), Math.sin(flowAngleRad)];
      u.u_flow_speed = (wConfig.flow.speed ?? 0.0) * 0.001;
    }

    // Murkiness
    if (wConfig.murkiness) {
      u.u_murkiness_enabled = wConfig.murkiness.enabled;
      u.u_murkiness_color = hexToRgbArray(wConfig.murkiness.color);
      u.u_wavy_strength = wConfig.murkiness.wavyNoise.strength;
      u.u_wavy_scale = wConfig.murkiness.wavyNoise.scale;
      u.u_wavy_speed = wConfig.murkiness.wavyNoise.speed;
      u.u_sandy_strength = wConfig.murkiness.sandyNoise.strength;
      u.u_sandy_scale = wConfig.murkiness.sandyNoise.scale;
      u.u_sandy_speed = wConfig.murkiness.sandyNoise.speed;
      u.u_sandy_modulation_scale = wConfig.murkiness.sandyNoise.modulationScale;
      u.u_sandy_modulation_speed = wConfig.murkiness.sandyNoise.modulationSpeed;
      u.u_sandy_modulation_strength =
        wConfig.murkiness.sandyNoise.modulationStrength;
    }

    u.u_wave_enabled = wConfig.wave.enabled;
    u.u_wave_intensity = wConfig.wave.intensity;
    const srfConfig = wConfig.surface;
    u.u_surface_enabled = srfConfig.enabled;
    u.u_openWaterFoamColor = hexToRgbArray(srfConfig.foamColor);
    u.u_openWaterFoamIntensity = srfConfig.foamIntensity;
    u.u_openWaterFoamCoverage = srfConfig.foamCoverage;
    u.u_openWaterFoamSharpness = srfConfig.foamSharpness;
    u.u_openWaterFbmScale = srfConfig.fbmScale;
    u.u_openWaterFbmSpeed = (srfConfig.fbmSpeed ?? 1.0) * 0.1;
    u.u_openWaterFbmEvolution = (srfConfig.fbmEvolution ?? 3.0) * 0.1;
    u.u_openWaterFbmOctaves = srfConfig.fbmOctaves;
    u.u_openWaterFbmLacunarity = srfConfig.fbmLacunarity;
    u.u_openWaterFbmPersistence = srfConfig.fbmPersistence;

    // Specularity
    if (srfConfig.specularity) {
      u.u_specularity_enabled = srfConfig.specularity.enabled;
      u.u_specularity_color = hexToRgbArray(srfConfig.specularity.color);
      u.u_specularity_intensity = srfConfig.specularity.intensity;
      u.u_specularity_shininess = srfConfig.specularity.shininess;

      // Convert angle and elevation to a 3D direction vector
      const angle = srfConfig.specularity.lightAngle * (Math.PI / 180.0); // to radians
      const elevation =
        srfConfig.specularity.lightElevation * (Math.PI / 180.0); // to radians

      const x = Math.cos(angle) * Math.cos(elevation);
      const y = Math.sin(angle) * Math.cos(elevation);
      const z = Math.sin(elevation);

      u.u_specularity_light_direction = [x, y, z];
      if (srfConfig.specularity.cloudOcclusion) {
        u.u_specularityCloudOcclusionEnabled =
          srfConfig.specularity.cloudOcclusion.enabled;
        u.u_specularityCloudOcclusionIntensity =
          srfConfig.specularity.cloudOcclusion.intensity;
      }
    } else {
      u.u_specularity_enabled = false;
    }

    const cConfig = wConfig.caustics;
    u.u_caustics_enabled = cConfig.enabled;
    u.u_causticsColor = hexToRgbArray(cConfig.color);
    u.u_causticsIntensity = cConfig.intensity;
    u.u_causticsScale = cConfig.scale;
    u.u_causticsSpeed = (cConfig.speed ?? 1.0) * 0.1;
    u.u_causticsLineSharpness = cConfig.lineSharpness;
    u.u_causticsBloomIntensity = cConfig.bloomIntensity;
    u.u_causticsLineDistortion = cConfig.lineDistortion;
    u.u_causticsLineDistortionScale = cConfig.lineDistortionScale;
    u.u_causticsIntersectionBoost = cConfig.intersectionBoost;
    u.u_causticsRoughnessScale = cConfig.roughnessScale;
    u.u_causticsRoughnessIntensity = cConfig.roughnessIntensity;
    if (cConfig.cloudOcclusion) {
      u.u_causticsCloudOcclusionEnabled = cConfig.cloudOcclusion.enabled;
      u.u_causticsCloudOcclusionIntensity = cConfig.cloudOcclusion.intensity;
    }
    const shConfig = wConfig.shoreline;
    u.u_shoreline_enabled = shConfig.enabled;
    u.u_shorelineFoamColor = hexToRgbArray(shConfig.foamColor);
    u.u_shorelineFoamIntensity = shConfig.foamIntensity;
    const dispConfig = shConfig.displacement;
    if (dispConfig) {
      u.u_shorelineDisplacementEnabled = dispConfig.enabled;
      u.u_shorelineDisplacementScale = dispConfig.scale;
      u.u_shorelineDisplacementSpeed = (dispConfig.speed ?? 1.1) * 0.1;
      u.u_shorelineDisplacementStrength = dispConfig.strength;
    }
    const foamPatternConfig = shConfig.foamPattern;
    u.u_shorelinePatternScale = foamPatternConfig.scale;
    u.u_shorelinePatternSpeed = (foamPatternConfig.speed ?? 0.0) * 0.1;
    u.u_shorelinePatternEvolution = (foamPatternConfig.evolution ?? 1.0) * 0.1;
    u.u_shorelinePatternOctaves = foamPatternConfig.octaves;
    u.u_shorelinePatternLacunarity = foamPatternConfig.lacunarity;
    u.u_shorelinePatternPersistence = foamPatternConfig.persistence;
    u.u_shorelinePatternBrightness = foamPatternConfig.brightness;
    u.u_shorelinePatternContrast = foamPatternConfig.contrast;

    // Puddles
    if (wConfig.puddles) {
      u.u_puddles_enabled = wConfig.puddles.enabled;
      u.u_puddleIntensity = this._puddleIntensity ?? 0.0;
      u.u_puddleDarkening = wConfig.puddles.darkening ?? 0.2;
    }
  }

  _onAnimate(deltaTime) {
    super._onAnimate(deltaTime);
    const waterEffectsFilter = this.waterEffectsFilter;
    if (this._destroyed || !waterEffectsFilter) return;

    const hasActiveMasks =
      this.maskSprites.size > 0 &&
      Array.from(this.maskSprites.values()).some((s) => s.texture.valid);
    waterEffectsFilter.enabled = this.visible && hasActiveMasks;

    if (!waterEffectsFilter.enabled) return;

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    // Use elapsedMS for a more reliable time delta from the ticker
    const deltaInSeconds = (canvas.app.ticker.elapsedMS / 1000) * timeFactor;
    
    // Apply speed scaling during time accumulation (not in shader)
    // Smooth the speed changes to prevent specular highlights from sliding rapidly during transitions
    const targetSpeed = this.displacementFilter?.uniforms?.u_speed ?? 1.0;
    const speedLerpRate = 0.02; // Slow interpolation (3-4 seconds at 60fps) prevents jitter
    this._smoothedSpeed += (targetSpeed - this._smoothedSpeed) * speedLerpRate;
    this.time += deltaInSeconds * this._smoothedSpeed;

    const renderer = canvas.app.renderer;
    const stage = canvas.stage;
    const screen = renderer.screen;

    // Use CoordinateManager for consistent coordinate handling across all effects
    const coordUniforms = CoordinateManager.getShaderUniforms();

    // The uniforms for the displacement filter must be updated BEFORE it is rendered.
    this.displacementFilter.uniforms.u_time = this.time;
    Object.assign(
      this.displacementFilter.uniforms,
      coordUniforms
    );

    const resourceManager = game.mapShine.resourceManager;

    renderer.render(this.displacementSprite, {
      renderTexture: this.displacementTexture,
      clear: true,
    });
    if (this._needsShorelineMaskUpdate) {
      renderer.render(this.shorelineMaskContainer, {
        renderTexture: this.shorelineMaskTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: true,
      });
      this._needsShorelineMaskUpdate = false;
    }

    if (this._needsCausticsMaskUpdate) {
      renderer.render(this.causticsMaskContainer, {
        renderTexture: this.combinedCausticsMaskTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: true,
      });
      this._needsCausticsMaskUpdate = false;
    }

    if (this._needsPuddleMaskUpdate) {
      renderer.render(this.puddleMaskContainer, {
        renderTexture: this.puddleMaskTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: true,
      });
      this._needsPuddleMaskUpdate = false;
    }

    if (this._needsNoWaterMaskUpdate) {
      renderer.render(this.noWaterMaskContainer, {
        renderTexture: this.noWaterMaskTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: true,
      });
      this._needsNoWaterMaskUpdate = false;
    }

    this.blurSourceSprite.texture = this.getMaskTexture();
    renderer.render(this.blurSourceSprite, {
      renderTexture: this.blurredWaterMaskTexture,
      clear: true,
    });

    const useShorelineMask = this.shorelineMaskSprites.size > 0;
    const useCausticsMask = this.causticsMaskSprites.size > 0;
    const usePuddleMask = this.puddleMaskSprites.size > 0;
    const useNoWaterMask = this.noWaterMaskSprites.size > 0;

    const u = waterEffectsFilter.uniforms;
    const wConfig = game.mapShine.profileManager.activeConfig.water;
    const canvasScale = CoordinateManager.getCanvasScale();
    
    if (wConfig?.wave) {
      // Use rain ripple intensity if set by WeatherSystemManager, otherwise use base config
      const baseIntensity = wConfig.wave.intensity;
      const effectiveIntensity = this._rainRippleIntensity !== undefined 
        ? this._rainRippleIntensity 
        : baseIntensity;
      u.u_wave_intensity = effectiveIntensity * canvasScale;
    }

    // Update puddle intensity every frame (set by WeatherSystemManager during rain/storm)
    if (wConfig?.puddles?.enabled) {
      u.u_puddleIntensity = this._puddleIntensity ?? 0.0;
    }

    const rect = canvas.scene.dimensions.sceneRect;
    if (rect && screen.width > 0 && screen.height > 0) {
      const topLeftScreen = canvas.stage.toGlobal({
        x: rect.x,
        y: rect.y,
      });
      const sceneWidthPixels = rect.width * canvas.stage.scale.x;
      const sceneHeightPixels = rect.height * canvas.stage.scale.y;
      u.uSceneRectNorm = [
        topLeftScreen.x / screen.width,
        topLeftScreen.y / screen.height,
        sceneWidthPixels / screen.width,
        sceneHeightPixels / screen.height,
      ];
    } else {
      u.uSceneRectNorm = [0, 0, 1, 1];
    }

    if (resourceManager) {
      u.u_cloudShadows =
        resourceManager.getRawCloudTexture(deltaInSeconds) ??
        PIXI.Texture.WHITE;
    }

    u.u_time = this.time;
    u.u_displacementMap = this.displacementTexture;
    u.u_waterMask = this.getMaskTexture();
    u.u_shorelineMask = this.shorelineMaskTexture;
    u.u_blurredWaterMask = this.blurredWaterMaskTexture;
    u.u_useShorelineMask = useShorelineMask;
    u.u_causticsMask = this.combinedCausticsMaskTexture;
    u.u_hasCausticsMask = useCausticsMask;
    u.u_puddleMask = this.puddleMaskTexture;
    u.u_usePuddleMask = usePuddleMask;
    u.u_noWaterMask = this.noWaterMaskTexture;
    u.u_useNoWaterMask = useNoWaterMask;
    
    // Use CoordinateManager uniforms for consistency
    u.u_camera_offset = coordUniforms.u_camera_offset;
    u.u_view_size = coordUniforms.u_view_size;
    u.u_canvas_scale = canvasScale;

    // Set the _Outdoors mask texture for specular highlight modulation
    if (resourceManager) {
      u.u_outdoorsMask =
        resourceManager.getOutdoorsMask() ?? PIXI.Texture.WHITE;
    }
  }

  async updateFromConfig(config) {
    const wConfig = config.water;
    this.visible = config.enabled && wConfig.enabled;

    if (this.displacementFilter) {
      const waveConfig = wConfig.wave;
      // Apply scaling factor
      this.displacementFilter.uniforms.u_speed =
        (waveConfig.speed ?? 1.48) * 0.4;
      this.displacementFilter.uniforms.u_scale = waveConfig.scale;
      // Update new biofilm uniforms
      if (waveConfig.biofilmDistortion) {
        this.displacementFilter.uniforms.u_useBiofilm =
          waveConfig.biofilmDistortion.enabled;
        this.displacementFilter.uniforms.u_biofilmIntensity =
          waveConfig.biofilmDistortion.intensity;
      }
    }
    if (this.blurFilter) {
      this.blurFilter.blur = wConfig.shoreline.detectionBlur;
    }

    this._updateWaterFilterUniforms(this.waterEffectsFilter, wConfig);
  }

  _onPan() {
    super._onPan();
    this._needsShorelineMaskUpdate = true;
    this._needsCausticsMaskUpdate = true;
    this._needsPuddleMaskUpdate = true;
    this._needsNoWaterMaskUpdate = true;
  }

  _onResize() {
    super._onResize();
    const renderer = canvas.app.renderer;
    const halfWidth = Math.floor(renderer.screen.width / 2);
    const halfHeight = Math.floor(renderer.screen.height / 2);

    // Resize half-resolution textures
    this.displacementTexture?.resize(halfWidth, halfHeight);
    this.blurredWaterMaskTexture?.resize(halfWidth, halfHeight);

    // Full-resolution textures
    this.shorelineMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.combinedCausticsMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.puddleMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this.noWaterMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );

    if (this.displacementSprite) {
      this.displacementSprite.width = halfWidth;
      this.displacementSprite.height = halfHeight;
    }

    this._needsShorelineMaskUpdate = true;
    this._needsCausticsMaskUpdate = true;
    this._needsPuddleMaskUpdate = true;
    this._needsNoWaterMaskUpdate = true;
  }

  async updateEffectTargets(targets) {
    await super.updateEffectTargets(targets);
    if (!this.shorelineMaskContainer || !this.causticsMaskContainer || !this.puddleMaskContainer || !this.noWaterMaskContainer) return;

    const validShorelineIds = new Set();
    const validCausticIds = new Set();
    const validPuddleIds = new Set();
    const validNoWaterIds = new Set();
    const allTargets = new Map([
      ["background", targets.background],
      ...targets.tiles.entries(),
    ]);

    for (const [id, targetData] of allTargets.entries()) {
      if (targetData?.shoreline) {
        validShorelineIds.add(id);
        let sprite = this.shorelineMaskSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.shorelineMaskSprites.set(id, sprite);
          this.shorelineMaskContainer.addChild(sprite);
        }
        await this._updateSpriteTransform(
          sprite,
          targetData.shoreline,
          targetData.rect
        );
      }

      if (targetData?.caustics) {
        validCausticIds.add(id);
        let sprite = this.causticsMaskSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.causticsMaskSprites.set(id, sprite);
          this.causticsMaskContainer.addChild(sprite);
        }
        await this._updateSpriteTransform(
          sprite,
          targetData.caustics,
          targetData.rect
        );
      }

      if (targetData?.puddle) {
        validPuddleIds.add(id);
        let sprite = this.puddleMaskSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.puddleMaskSprites.set(id, sprite);
          this.puddleMaskContainer.addChild(sprite);
        }
        await this._updateSpriteTransform(
          sprite,
          targetData.puddle,
          targetData.rect
        );
      }

      if (targetData?.noWater) {
        validNoWaterIds.add(id);
        let sprite = this.noWaterMaskSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.noWaterMaskSprites.set(id, sprite);
          this.noWaterMaskContainer.addChild(sprite);
        }
        await this._updateSpriteTransform(
          sprite,
          targetData.noWater,
          targetData.rect
        );
      }
    }

    for (const [id, sprite] of this.shorelineMaskSprites.entries()) {
      if (!validShorelineIds.has(id)) {
        sprite.destroy();
        this.shorelineMaskSprites.delete(id);
      }
    }

    for (const [id, sprite] of this.causticsMaskSprites.entries()) {
      if (!validCausticIds.has(id)) {
        sprite.destroy();
        this.causticsMaskSprites.delete(id);
      }
    }

    for (const [id, sprite] of this.puddleMaskSprites.entries()) {
      if (!validPuddleIds.has(id)) {
        sprite.destroy();
        this.puddleMaskSprites.delete(id);
      }
    }

    for (const [id, sprite] of this.noWaterMaskSprites.entries()) {
      if (!validNoWaterIds.has(id)) {
        sprite.destroy();
        this.noWaterMaskSprites.delete(id);
      }
    }

    this._needsShorelineMaskUpdate = true;
    this._needsCausticsMaskUpdate = true;
    this._needsPuddleMaskUpdate = true;
    this._needsNoWaterMaskUpdate = true;
  }

  async _tearDown(options) {
    if (this.waterEffectsFilter) {
      const cleanedFilters = (canvas.primary.filters || []).filter(
        (f) => f !== this.waterEffectsFilter
      );
      safeApplyFilters(canvas.primary, cleanedFilters, "canvas.primary (Water teardown)");

      this.waterEffectsFilter.destroy();
      this.waterEffectsFilter = null;
    }

    this.displacementFilter?.destroy();
    this.displacementSprite?.destroy();
    this.displacementTexture?.destroy(true);
    this.blurFilter?.destroy();
    this.blurSourceSprite?.destroy();
    this.blurredWaterMaskTexture?.destroy(true);
    // Don't destroy baseTextures - they're shared with TextureLoader cache
    this.shorelineMaskContainer?.destroy({
      children: true,
      texture: false,
      baseTexture: false,
    });
    this.shorelineMaskTexture?.destroy(true);
    this.shorelineMaskSprites.clear();

    this.causticsMaskContainer?.destroy({
      children: true,
      texture: false,
      baseTexture: false,
    });
    this.combinedCausticsMaskTexture?.destroy(true);
    this.causticsMaskSprites.clear();

    this.puddleMaskContainer?.destroy({
      children: true,
      texture: false,
      baseTexture: false,
    });
    this.puddleMaskTexture?.destroy(true);
    this.puddleMaskSprites.clear();

    this.noWaterMaskContainer?.destroy({
      children: true,
      texture: false,
      baseTexture: false,
    });
    this.noWaterMaskTexture?.destroy(true);
    this.noWaterMaskSprites.clear();

    this.displacementFilter = null;
    this.displacementSprite = null;
    this.displacementTexture = null;
    this.blurFilter = null;
    this.blurSourceSprite = null;
    this.blurredWaterMaskTexture = null;
    this.shorelineMaskContainer = null;
    this.shorelineMaskTexture = null;
    this.puddleMaskContainer = null;
    this.puddleMaskTexture = null;
    this.noWaterMaskContainer = null;
    this.noWaterMaskTexture = null;
    this.causticsMaskContainer = null;
    this.combinedCausticsMaskTexture = null;

    await super._tearDown(options);
  }
}

class WaveDisplacementFilter extends PIXI.Filter {
  constructor(options = {}) {
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
                            varying vec2 vScreenCoord; // Use the reliable screen coordinate varying

                            uniform float u_time;
                            uniform float u_speed;
                            uniform float u_scale;

                            // World-space uniforms
                            uniform vec2 u_camera_offset;
                            uniform vec2 u_view_size;

                            //
                            // Description : Array and textureless GLSL 3D simplex noise function.
                            //      Author : Ian McEwan, Ashima Arts.
                            //  Maintainer : ijm
                            //     Lastmod : 20110822 (ijm)
                            //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
                            //               Distributed under the MIT License. See LICENSE file.
                            //               https://github.com/ashima/webgl-noise
                            //
                            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

                            float snoise(vec3 v) {
                                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

                                // First corner
                                vec3 i  = floor(v + dot(v, C.yyy) );
                                vec3 x0 =   v - i + dot(i, C.xxx) ;

                                // Other corners
                                vec3 g = step(x0.yzx, x0.xyz);
                                vec3 l = 1.0 - g;
                                vec3 i1 = min( g.xyz, l.zxy );
                                vec3 i2 = max( g.xyz, l.zxy );

                                vec3 x1 = x0 - i1 + C.xxx;
                                vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
                                vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

                                // Permutations
                                i = mod(i, 289.0);
                                vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 );

                                // Gradients: 7x7 points over a square, mapped onto an octahedron.
                                // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
                                float n_ = 0.142857142857; // 1.0/7.0
                                vec3  ns = n_ * D.wyz - D.xzx;

                                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

                                vec4 x_ = floor(j * ns.z);
                                vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

                                vec4 x = x_ *ns.x + ns.yyyy;
                                vec4 y = y_ *ns.x + ns.yyyy;
                                vec4 h = 1.0 - abs(x) - abs(y);

                                vec4 b0 = vec4( x.xy, y.xy );
                                vec4 b1 = vec4( x.zw, y.zw );

                                vec4 s0 = floor(b0)*2.0 + 1.0;
                                vec4 s1 = floor(b1)*2.0 + 1.0;
                                vec4 sh = -step(h, vec4(0.0));

                                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

                                vec3 p0 = vec3(a0.xy,h.x);
                                vec3 p1 = vec3(a0.zw,h.y);
                                vec3 p2 = vec3(a1.xy,h.z);
                                vec3 p3 = vec3(a1.zw,h.w);

                                // Normalise gradients
                                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                                p0 *= norm.x;
                                p1 *= norm.y;
                                p2 *= norm.z;
                                p3 *= norm.w;

                                // Mix final noise value
                                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                                m = m * m;
                                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                            }

                            void main() {
                                // Calculate world coordinates from the reliable screen coordinates
                                vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);

                                // Use u_time directly (speed is already baked into time accumulation)
                                // This prevents visual jumps when u_speed changes
                                float time = u_time;
                                vec2 uv1 = world_coord * u_scale * 0.01 + vec2(time * 0.5, time * 0.2);
                                vec2 uv2 = world_coord * u_scale * 0.015 - vec2(time * -0.2, time * 0.5);

                                float noise1_x = snoise(vec3(uv1, time));
                                float noise1_y = snoise(vec3(uv1 + 10.0, time));

                                float noise2_x = snoise(vec3(uv2, time));
                                float noise2_y = snoise(vec3(uv2 + 20.0, time));

                                // Combine noises for a more complex pattern
                                vec2 displacement = vec2(noise1_x + noise2_x, noise1_y + noise2_y) * 0.5;

                                // Output the displacement vector in the R and G channels, normalized to 0-1 range
                                gl_FragColor = vec4(displacement * 0.5 + 0.5, 0.0, 1.0);
                            }
                        `;
    super(vertexSrc, fragmentSrc, {
      u_time: 0.0,
      u_speed: options.speed ?? 0.05,
      u_scale: options.scale ?? 4.0,

      u_camera_offset: [0, 0],

      u_view_size: [1, 1],
    });
  }
}