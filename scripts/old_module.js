/**
 * ===================================================================================
 *  Map Shine - Advanced Material & Effects Toolkit for Foundry VTT
 * ===================================================================================
 *
 * @file This script is the core of the 'Map Shine' module. It provides a comprehensive
 * toolkit for map makers to add a wide range of advanced, real-time visual effects
 * to their scenes with minimal setup.
 *
 * @description
 * The module injects several custom canvas layers and a suite of PIXI.js filters
 * (shaders) to create dynamic and visually rich map experiences. Effects are
 * controlled through a powerful, real-time "Material Editor" UI, which includes
 * a robust diagnostic status system to help users identify and resolve issues
 * with textures, shaders, and effect pipelines. Configurations can be saved and
 * loaded as profiles, enabling easy reuse of complex looks across different scenes.
 *
 * Key Features:
 * - Procedural Reflections: Animated metallic shine with configurable stripes, colors,
 *   and movement.
 * - PBR-style Lighting: Utilizes specular and normal maps for realistic surface
 *   reflections that react to a dynamic light source (the user's cursor).
 * - Automatic Texture Discovery: Scans the scene's directory for appropriately named
 *   texture maps (_Normal, _Specular, etc.) to automate setup.
 * - Advanced Post-Processing: A full suite of camera and lens effects, including:
 *   - Bloom & Glare with fine-tuned quality and response controls.
 *   - Chromatic Aberration (both global and bloom-specific).
 *   - Vignette and Lens Distortion.
 *   - Full-screen Color Correction (Saturation, Brightness, Contrast).
 * - Additional Material Layers:
 *   - Iridescence: Creates a shimmering, rainbow-like effect.
 *   - Ambient/Emissive: Allows parts of the map to glow independently.
 * - Real-time Material Editor: An in-game UI for live manipulation of all effect
 *   parameters, complete with debug views and a comprehensive status panel to
 *   isolate and inspect individual components of the rendering pipeline.
 * - Profile System: Save, load, and delete entire effect configurations, making it
 *   easy to apply consistent styles or share presets.
 *
 * File Structure:
 *   I.   CONSTANTS & CONFIGURATION: Defines the module ID and the central config object.
 *   II.  PIXI FILTER DEFINITIONS: Contains all the custom GLSL shader logic.
 *   III. EFFECT & TEXTURE MANAGERS: Classes that handle procedural generation,
 *        input, texture loading, and the new central status system.
 *   IV.  CUSTOM CANVAS LAYERS: Defines the `MetallicShineLayer`, `IridescenceLayer`,
 *        and `AmbientLayer` that render the effects onto the canvas.
 *   V.   MATERIAL EDITOR UI: The class responsible for building and managing the
 *        debugger and live editor interface.
 *   VI.  FOUNDRY VTT HOOKS: Integration logic for initializing the module within
 *        the Foundry VTT lifecycle.
 *
 */



/**
 * ===================================================================================
 *  I. CONSTANTS & CONFIGURATION
 * ===================================================================================
 * This file contains the foundational settings and constants for the Material Toolkit.
 *
 * The OVERLAY_CONFIG object serves as the single source of truth for all UI controls
 * and shader uniforms. Its structure is intentionally designed to mirror the logical
 * grouping of effects presented in the Material Editor UI.
 *
 * Each major effect or layer has an "enabled" property, allowing for individual
 * components of the material to be toggled on or off.
 */

const MODULE_ID = 'map-shine';
const PROFILES_SETTING = 'profiles';

const BLEND_MODE_OPTIONS = {
    'NORMAL': PIXI.BLEND_MODES.NORMAL,
    'ADD': PIXI.BLEND_MODES.ADD,
    'MULTIPLY': PIXI.BLEND_MODES.MULTIPLY,
    'SCREEN': PIXI.BLEND_MODES.SCREEN,
    'OVERLAY': PIXI.BLEND_MODES.OVERLAY,
    'DARKEN': PIXI.BLEND_MODES.DARKEN,
    'LIGHTEN': PIXI.BLEND_MODES.LIGHTEN,
    'COLOR_DODGE': PIXI.BLEND_MODES.COLOR_DODGE,
    'COLOR_BURN': PIXI.BLEND_MODES.COLOR_BURN,
    'HARD_LIGHT': PIXI.BLEND_MODES.HARD_LIGHT,
    'SOFT_LIGHT': PIXI.BLEND_MODES.SOFT_LIGHT,
    'DIFFERENCE': PIXI.BLEND_MODES.DIFFERENCE,
    'EXCLUSION': PIXI.BLEND_MODES.EXCLUSION,
};

const OVERLAY_CONFIG = {
    // Master switch for all effects
    enabled: true,
    debug: true,

    // Corresponds to the "Base Shine & Reflection" box
    baseShine: {
        enabled: true,
        specularTexturePath: "", // Populated by TextureAutoLoader
        patternType: 'stripes',
        compositing: {
            layerBlendMode: PIXI.BLEND_MODES.ADD,
        },
        animation: {
            // This is the old patternIntensity, renamed for clarity as a global fade control
            globalIntensity: 3.0,
        },
        pattern: {
            // Shared properties for the Stripe generator
            shared: {
                patternScale: 0.2,
                maxBrightness: 0.9,
            },
            // Stripe Layer 1
            stripes1: {
                enabled: true,
                intensity: 1.0,
                speed: 0.01,
                tintColor: "#FFFFFF",
                angle: 135,
                sharpness: 8.0,
                bandDensity: 4.0,
                bandWidth: 1.0,
                subStripeMaxCount: 4.0,
                subStripeMaxSharp: 0.0,
            },
            // Stripe Layer 2
            stripes2: {
                enabled: true,
                intensity: 0.4,
                speed: -0.015,
                tintColor: "#FFFFFF",
                angle: 309,
                sharpness: 8.0,
                bandDensity: 2.0,
                bandWidth: 1.0,
                subStripeMaxCount: 4.0,
                subStripeMaxSharp: 0.0,
            },
            // Checkerboard pattern settings
            checkerboard: {
                gridSize: 8,
                brightness1: 0.15,
                brightness2: 0.05,
            },
        },
        // Corresponds to the "Noise Mask" sub-section
        noise: {
            enabled: true,
            speed: 0.005,
            scale: 2.5,
            threshold: 0.3,
            brightness: 0.15,
            contrast: 0.50,
            softness: 1.0
        },
        // Corresponds to the "Color Adjustments" sub-section
        // MOVED to postProcessing to act as a global effect
        /*
        colorCorrection: {
            enabled: true,
            saturation: 6.00,
            brightness: 0.25,
            contrast: 2.0,
        },
        */
    },

    // Corresponds to the "Iridescence" box
    iridescence: {
        enabled: true,
        texturePath: "", // Populated by TextureAutoLoader
        blendMode: PIXI.BLEND_MODES.ADD,
        intensity: 0.5,
        speed: 0.0,
        scale: 1.0,
        noiseAmount: 0.1,
        parallax: {
            enabled: true,
            multiplier: 1.0
        }
    },

    // Corresponds to the "Ambient / Emissive" box
    ambient: {
        enabled: true,
        texturePath: "", // Populated by TextureAutoLoader
        blendMode: PIXI.BLEND_MODES.ADD,
        intensity: 1.0
    },

    // Corresponds to the "Normal Map" box (formerly Surface Lighting)
    lighting: {
        enabled: true,
        normalTexturePath: "", // Populated by TextureAutoLoader
        strength: 1.0,
        shininess: 32.0,
        height: 150.0,
        displacement: {
            enabled: true,
            strength: 0.2,
        },
    },

    // Corresponds to the "Bloom & Glare" box
    bloom: {
        enabled: true,
        intensity: 3.00,
        threshold: 0.10,
        blur: 13.0,
        hotspot: 0.80,
        roughness: 0.45, // Kept for logic, but UI may link this to a master roughness
        compositing: {
            bloomBlendMode: PIXI.BLEND_MODES.ADD,
            bloomSourceBlendMode: PIXI.BLEND_MODES.ADD,
        },
        illuminationResponse: {
            darknessThreshold: 0.95,
            suppressionFactor: 0.5,
        },
        quality: {
            samples: 20,
            resolution: 4.0,
        },
        // New: Bloom-specific Chromatic Aberration
        chromaticAberration: {
            enabled: false,
            amount: 0.005,
            centerX: 0.5,
            centerY: 0.5,
        },
    },

    // Corresponds to the "Camera & Lens Effects" box
    postProcessing: {
        enabled: true,
        // ADDED Color Correction here for global application
        colorCorrection: {
            enabled: true,
            saturation: 1.00,
            brightness: 0.00,
            contrast: 1.0,
        },
        vignette: {
            enabled: true,
            amount: 0.6,
            softness: 0.8
        },
        lensDistortion: {
            enabled: true,
            amount: 0.0,
            centerX: 0.5,
            centerY: 0.5
        },
        chromaticAberration: {
            enabled: true,
            amount: 0.000,
            centerX: 0.5,
            centerY: 0.5,
        },
    },
};

/**
 * ===================================================================================
 *  II. PIXI FILTER DEFINITIONS & HELPERS
 * ===================================================================================
 */

/**
 * Converts a hex color string to an RGB array [R, G, B] with values from 0.0 to 1.0.
 * @param {string} hex The hex color string (e.g., "#RRGGBB").
 * @returns {number[]} An array [R, G, B].
 */
const hexToRgbArray = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
};

class SceneIlluminationDebugFilter extends PIXI.Filter {
    constructor() {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform sampler2D u_illuminationDebugTexture;

            void main(void) {
                gl_FragColor = texture2D(u_illuminationDebugTexture, vTextureCoord);
            }
        `, {
            u_illuminationDebugTexture: PIXI.Texture.EMPTY
        });
    }
}

class AlphaMaskFilter extends PIXI.Filter {
    constructor() {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform int u_debugMode; // Kept for potential future use

            void main(void) {
                vec4 textureColor = texture2D(uSampler, vTextureCoord);
                if (u_debugMode == 1) {
                    gl_FragColor = textureColor;
                    return;
                }
                float intensity = textureColor.r;
                gl_FragColor = vec4(intensity, intensity, intensity, intensity);
            }
        `, {
            u_debugMode: 0
        });
    }
}

class ForceAlphaFilter extends PIXI.Filter {
    constructor() {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;

            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                if (color.a > 0.0) {
                    color.rgb /= color.a;
                }
                color.a = 1.0;
                gl_FragColor = color;
            }
        `);
    }
}

class BloomHotspotFilter extends PIXI.Filter {
    constructor(hotspot = 0.5) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float u_hotspot;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);
            const vec3 white = vec3(1.0);

            void main(void) {
                if (u_hotspot <= 0.0) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }
                vec4 color = texture2D(uSampler, vTextureCoord);
                float brightness = dot(color.rgb, lum_weights);
                float hotspot_threshold = 1.0 - u_hotspot;
                float mix_factor = smoothstep(hotspot_threshold, 1.0, brightness);
                vec3 final_rgb = mix(color.rgb, white, mix_factor);
                gl_FragColor = vec4(final_rgb, color.a);
            }
        `, {
            u_hotspot: hotspot
        });
    }

    get hotspot() { return this.uniforms.u_hotspot; }
    set hotspot(value) { this.uniforms.u_hotspot = value; }
}

// NOTE: This filter is currently unused in the new structure but kept for posterity.
class LightnessBlendFilter extends PIXI.Filter {
    constructor() {
        const vertexSrc = PIXI.Filter.defaultVertexSrc;
        const fragmentSrc = `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform sampler2D u_background; uniform int u_debugMode;
            vec3 rgb2hsl(vec3 c) { float max_c = max(c.r, max(c.g, c.b)); float min_c = min(c.r, min(c.g, c.b)); float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0; if (max_c != min_c) { float d = max_c - min_c; s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c); if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0); else if (max_c == c.g) h = (c.b - c.r) / d + 2.0; else h = (c.r - c.g) / d + 4.0; h /= 6.0; } return vec3(h, s, l); }
            float hue2rgb(float p, float q, float t) { if (t < 0.0) t += 1.0; if (t > 1.0) t -= 1.0; if (t < 1.0/6.0) return p + (q - p) * 6.0 * t; if (t < 1.0/2.0) return q; if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0; return p; }
            vec3 hsl2rgb(vec3 c) { if (c.y == 0.0) return vec3(c.z); float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y; float p = 2.0 * c.z - q; return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0)); }
            void main(void) { vec4 foreground = texture2D(uSampler, vTextureCoord); float brightnessToAdd = foreground.r; vec4 background = texture2D(u_background, vTextureCoord); if (u_debugMode == 1) { gl_FragColor = foreground; return; } if (u_debugMode == 2) { gl_FragColor = background; return; } if (u_debugMode == 3) { gl_FragColor = vec4(vec3(brightnessToAdd), 1.0); return; } if (brightnessToAdd <= 0.0) { gl_FragColor = background; return; } vec3 backgroundHSL = rgb2hsl(background.rgb); backgroundHSL.z = min(backgroundHSL.z + brightnessToAdd, 1.0); gl_FragColor = vec4(hsl2rgb(backgroundHSL), background.a); }
        `;
        super(vertexSrc, fragmentSrc, { u_background: PIXI.Texture.EMPTY, u_debugMode: 0 });
    }
}

class ShinePatternFilter extends PIXI.Filter {
    constructor(options) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord;

            // --- Global Uniforms ---
            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;
            uniform int u_debugMode;

            // --- Pattern Generation Uniforms ---
            uniform float u_globalIntensity;
            uniform float u_shared_maxBrightness;
            uniform float u_shared_patternScale;

            // --- Noise Modulation ---
            uniform sampler2D u_noiseMap;
            uniform bool u_noise_enabled;

            // --- Normal Map Lighting ---
            uniform sampler2D u_normalMap;
            uniform bool u_lighting_enabled;
            uniform vec2 u_lightPosition;
            uniform float u_lighting_strength;
            uniform float u_lighting_shininess;
            uniform float u_lighting_height;

            // --- Normal Map Displacement ---
            uniform bool u_displacement_enabled;
            uniform float u_displacement_strength;

            // --- Stripe Layer 1 ---
            uniform bool u_s1_enabled;
            uniform float u_s1_speed, u_s1_intensity, u_s1_angle_rad, u_s1_sharpness, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp;
            uniform vec3 u_s1_tint_color;

            // --- Stripe Layer 2 ---
            uniform bool u_s2_enabled;
            uniform float u_s2_speed, u_s2_intensity, u_s2_angle_rad, u_s2_sharpness, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp;
            uniform vec3 u_s2_tint_color;

            const float PI = 3.14159265359;
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float createStripeLayer(vec2 uv, float t, float angle, float density, float width, float sub_count, float sub_sharp, float sharp) {
                float p_perp = uv.x * cos(angle) + uv.y * sin(angle);
                float band_coord = p_perp * density;
                float band_id = floor(band_coord);
                float in_band_pos = fract(band_coord);
                if (in_band_pos > width) return 0.0;
                float r1 = random(vec2(band_id)); float r2 = random(vec2(band_id, r1)); float r3 = random(vec2(r1, r2));
                float num_sub = 2.0 + r1 * sub_count;
                float sub_stripe_s = 1.0 + r2 * sub_sharp;
                float sub_stripe_b = 0.5 + r3 * 0.5;
                float sub_wave = (cos(in_band_pos * (num_sub / width) * 2.0 * PI + t) + 1.0) * 0.5;
                sub_wave = pow(sub_wave, sub_stripe_s) * sub_stripe_b;
                return sub_wave * pow(sin((in_band_pos / width) * PI), sharp);
            }

            void main() {
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 pattern_uv = (world_coord / 80.0) * u_shared_patternScale;

                if (u_lighting_enabled && u_displacement_enabled) {
                    vec2 surface_tilt = (texture2D(u_normalMap, vTextureCoord).xy * 2.0) - 1.0;
                    pattern_uv += surface_tilt * u_displacement_strength;
                }

                float pattern1 = 0.0;
                if (u_s1_enabled) {
                    pattern1 = createStripeLayer(pattern_uv, u_time * u_s1_speed, u_s1_angle_rad, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp, u_s1_sharpness) * u_s1_intensity;
                }
                float pattern2 = 0.0;
                if (u_s2_enabled) {
                    pattern2 = createStripeLayer(pattern_uv, u_time * u_s2_speed, u_s2_angle_rad, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp, u_s2_sharpness) * u_s2_intensity;
                }

                float final_alpha_pattern = max(pattern1, pattern2);
                vec3 final_rgb_pattern = (pattern1 > pattern2) ? (u_s1_tint_color * pattern1) : (u_s2_tint_color * pattern2);

                float noise_mask = 1.0;
                if (u_noise_enabled) {
                    noise_mask = texture2D(u_noiseMap, vTextureCoord).r;
                }

                float specular_influence = 1.0;
                if (u_lighting_enabled) {
                    vec3 surface_normal_rgb = texture2D(u_normalMap, vTextureCoord).rgb;
                    vec3 unpacked_normal = (surface_normal_rgb * 2.0) - 1.0;
                    vec3 flat_normal = vec3(0.0, 0.0, 1.0);
                    vec3 surface_normal = normalize(mix(flat_normal, unpacked_normal, u_lighting_strength));
                    vec3 view_dir = vec3(0.0, 0.0, 1.0);
                    vec3 light_dir = normalize(vec3(u_lightPosition - world_coord, u_lighting_height));
                    vec3 halfway_dir = normalize(light_dir + view_dir);
                    float spec_dot = max(0.0, dot(surface_normal, halfway_dir));
                    specular_influence = pow(spec_dot, u_lighting_shininess);

                    if (u_debugMode > 0) {
                        if (u_debugMode == 1) { gl_FragColor = vec4(surface_normal * 0.5 + 0.5, 1.0); return; }
                        if (u_debugMode == 2) { gl_FragColor = vec4(light_dir * 0.5 + 0.5, 1.0); return; }
                        if (u_debugMode == 3) { gl_FragColor = vec4(view_dir, 1.0); return; }
                        if (u_debugMode == 4) { gl_FragColor = vec4(halfway_dir * 0.5 + 0.5, 1.0); return; }
                        if (u_debugMode == 5) { gl_FragColor = vec4(vec3(spec_dot), 1.0); return; }
                        if (u_debugMode == 6) { gl_FragColor = vec4(vec3(specular_influence), 1.0); return; }
                    }
                }
                
                float final_brightness = final_alpha_pattern * u_shared_maxBrightness * u_globalIntensity * noise_mask * specular_influence;
                vec3 tinted_brightness = final_rgb_pattern * u_shared_maxBrightness * u_globalIntensity * noise_mask * specular_influence;
                gl_FragColor = vec4(tinted_brightness, final_brightness);
            }
        `, options);
    }
}

class ThresholdFilter extends PIXI.Filter {
    constructor(threshold = 0.5) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_threshold;
            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                if (brightness < u_threshold) { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); }
                else { gl_FragColor = color; }
            }
        `, { u_threshold: threshold });
    }
    get threshold() { return this.uniforms.u_threshold; }
    set threshold(value) { this.uniforms.u_threshold = value; }
}

class ColorCorrectionFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_saturation; uniform float u_brightness; uniform float u_contrast;
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);
            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                color.rgb += u_brightness;
                color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
                float luminance = dot(color.rgb, lum_weights);
                color.rgb = mix(vec3(luminance), color.rgb, u_saturation);
                gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0), color.a);
            }
        `, {
            u_saturation: options.saturation ?? 1.0,
            u_brightness: options.brightness ?? 0.0,
            u_contrast: options.contrast ?? 1.0
        });
    }
    get saturation() { return this.uniforms.u_saturation; } set saturation(v) { this.uniforms.u_saturation = v; }
    get brightness() { return this.uniforms.u_brightness; } set brightness(v) { this.uniforms.u_brightness = v; }
    get contrast() { return this.uniforms.u_contrast; } set contrast(v) { this.uniforms.u_contrast = v; }
}

class ChromaticAberrationFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
            void main(void) {
                if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec2 offset = (vTextureCoord - u_center) * u_amount;
                float r = texture2D(uSampler, vTextureCoord - offset).r;
                float g = texture2D(uSampler, vTextureCoord).g;
                float b = texture2D(uSampler, vTextureCoord + offset).b;
                float a = texture2D(uSampler, vTextureCoord).a;
                gl_FragColor = vec4(r, g, b, a);
            }
        `, {
            u_amount: options.amount ?? 0.0,
            u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5]
        });
    }
    get amount() { return this.uniforms.u_amount; } set amount(v) { this.uniforms.u_amount = v; }
    get center() { return this.uniforms.u_center; } set center(v) { this.uniforms.u_center = v; }
}

class VignetteFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform float u_softness;
            void main(void) {
                if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec4 color = texture2D(uSampler, vTextureCoord);
                float dist = distance(vTextureCoord, vec2(0.5));
                float start = u_softness - 0.15;
                float end = u_softness + 0.15;
                float falloff = smoothstep(start, end, dist);
                color.rgb *= (1.0 - (u_amount * falloff));
                gl_FragColor = color;
            }
        `, {
            u_amount: options.amount ?? 0.5,
            u_softness: options.softness ?? 0.5,
        });
    }
    get amount() { return this.uniforms.u_amount; } set amount(v) { this.uniforms.u_amount = v; }
    get softness() { return this.uniforms.u_softness; } set softness(v) { this.uniforms.u_softness = v; }
}

class LensDistortionFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
            void main(void) {
                if (u_amount == 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec2 D = vTextureCoord - u_center;
                float r = length(D);
                vec2 distorted_coord = u_center + D * (1.0 + u_amount * r * r);
                gl_FragColor = texture2D(uSampler, distorted_coord);
            }
        `, {
            u_amount: options.amount ?? 0.0,
            u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5]
        });
    }
    get amount() { return this.uniforms.u_amount; } set amount(v) { this.uniforms.u_amount = v; }
    get center() { return this.uniforms.u_center; } set center(v) { this.uniforms.u_center = v; }
}

class BloomIlluminationMaskFilter extends PIXI.Filter {
    constructor(darknessThreshold = 0.2, suppressionFactor = 0.05) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform sampler2D u_illuminationTexture; uniform float u_darknessThreshold; uniform float u_suppressionFactor;
            void main(void) {
                vec4 shine_color = texture2D(uSampler, vTextureCoord);
                vec4 ill_color = texture2D(u_illuminationTexture, vTextureCoord);
                float ill_lum = ill_color.r;
                float lerp_factor = smoothstep(0.0, u_darknessThreshold, ill_lum);
                float mult = mix(u_suppressionFactor, 1.0, lerp_factor);
                gl_FragColor = vec4(shine_color.rgb * mult, shine_color.a * mult);
            }
        `, {
            u_illuminationTexture: PIXI.Texture.EMPTY,
            u_darknessThreshold: darknessThreshold,
            u_suppressionFactor: suppressionFactor
        });
    }
    get illuminationTexture() { return this.uniforms.u_illuminationTexture; } set illuminationTexture(v) { this.uniforms.u_illuminationTexture = v; }
    get darknessThreshold() { return this.uniforms.u_darknessThreshold; } set darknessThreshold(v) { this.uniforms.u_darknessThreshold = v; }
    get suppressionFactor() { return this.uniforms.u_suppressionFactor; } set suppressionFactor(v) { this.uniforms.u_suppressionFactor = v; }
}

class ShineColorationTintFilter extends PIXI.Filter {
    constructor() {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform sampler2D u_colorationTexture;
            void main(void) {
                vec4 shine_pattern_color = texture2D(uSampler, vTextureCoord);
                vec4 coloration_map_color = texture2D(u_colorationTexture, vTextureCoord);
                gl_FragColor = vec4(shine_pattern_color.rgb * coloration_map_color.rgb, shine_pattern_color.a);
            }
        `, { u_colorationTexture: PIXI.Texture.EMPTY });
    }
    get colorationTexture() { return this.uniforms.u_colorationTexture; }
    set colorationTexture(value) { this.uniforms.u_colorationTexture = value; }
}

class IridescenceFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float; varying vec2 vTextureCoord;
            uniform float u_time, u_speed, u_scale, u_intensity, u_noise_amount;
            float hue2rgb(float p, float q, float t) { if (t < 0.0) t += 1.0; if (t > 1.0) t -= 1.0; if (t < 1.0/6.0) return p + (q - p) * 6.0 * t; if (t < 1.0/2.0) return q; if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0; return p; }
            vec3 hsl2rgb(vec3 c) { if (c.y == 0.0) return vec3(c.z); float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y; float p = 2.0 * c.z - q; return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0)); }
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            void main(void) {
                vec2 scaled_coord = vTextureCoord * u_scale;
                float noise = (random(scaled_coord) - 0.5) * u_noise_amount;
                float hue_driver = scaled_coord.x + scaled_coord.y + noise + (u_time * u_speed);
                float final_hue = fract(hue_driver);
                vec3 iridescent_color = hsl2rgb(vec3(final_hue, 1.0, 0.5));
                gl_FragColor = vec4(iridescent_color * u_intensity, u_intensity);
            }
        `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_time: 0.0,
            u_speed: options.speed ?? 0.0,
            u_scale: options.scale ?? 8.0,
            u_intensity: options.intensity ?? 1.0,
            u_noise_amount: options.noiseAmount ?? 0.3
        });
    }
}

class NoisePatternFilter extends PIXI.Filter {
    constructor(options) {
        const fragmentSrc = `
            precision mediump float; varying vec2 vTextureCoord;
            uniform float u_time; uniform vec2 u_camera_offset; uniform vec2 u_view_size;
            uniform float u_speed, u_scale, u_threshold, u_brightness, u_contrast, u_softness;
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float value_noise(vec2 st) { vec2 i=floor(st), f=fract(st); float a=random(i), b=random(i+vec2(1,0)), c=random(i+vec2(0,1)), d=random(i+vec2(1,1)); vec2 u=f*f*(3.0-2.0*f); return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.y*u.x; }
            void main() {
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 uv = (world_coord / 80.0) * u_scale;
                uv.x += u_time * u_speed;
                float noise = value_noise(uv);
                noise += u_brightness;
                noise = (noise - 0.5) * u_contrast + 0.5;
                noise = smoothstep(u_threshold, u_threshold + u_softness, noise);
                gl_FragColor = vec4(vec3(clamp(noise, 0.0, 1.0)), 1.0);
            }
        `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, options);
    }
}

/**
 * ===================================================================================
 *  III. EFFECT & TEXTURE MANAGERS
 * ===================================================================================
 */

/**
 * The central, authoritative manager for all module statuses.
 * This class follows a singleton pattern, accessible via `SystemStatusManager.instance`.
 * It provides a reactive, event-driven way to track the health of shaders,
 * textures, pipelines, and other dependencies.
 */
class SystemStatusManager {
    constructor() {
        if (SystemStatusManager._instance) {
            return SystemStatusManager._instance;
        }
        SystemStatusManager._instance = this;

        this._callbacks = {};
        this._state = {
            shaders: {
                baseShine: { state: 'unknown', message: 'Not yet compiled.' },
                noise: { state: 'unknown', message: 'Not yet compiled.' },
                bloom: { state: 'unknown', message: 'Not yet compiled.' },
                iridescence: { state: 'unknown', message: 'Not yet compiled.' },
                postProcessing: { state: 'unknown', message: 'Not yet initialized.' },
                internal: { state: 'unknown', message: 'Not yet initialized.' },
                debug: { state: 'unknown', message: 'Not yet initialized.' }
            },
            textures: {
                specular: { state: 'inactive', message: 'No path specified.' },
                normal: { state: 'inactive', message: 'No path specified.' },
                ambient: { state: 'inactive', message: 'No path specified.' },
                iridescence: { state: 'inactive', message: 'No path specified.' }
            },
            pipelines: {
                noiseToShine: { state: 'inactive', message: 'Pipeline inactive.' },
                normalToShine: { state: 'inactive', message: 'Pipeline inactive.' },
                illuminationToBloom: { state: 'inactive', message: 'Pipeline inactive.' },
                colorationToShine: { state: 'inactive', message: 'Pipeline inactive.' }
            },
            dependencies: {
                foundryLighting: { state: 'pending', message: 'Checking for Foundry lighting system...' }
            }
        };
    }

    static get instance() {
        if (!SystemStatusManager._instance) {
            new SystemStatusManager();
        }
        return SystemStatusManager._instance;
    }

    /**
     * Subscribes to a status change event.
     * @param {string} event - The event name (e.g., 'statusChanged').
     * @param {function} callback - The function to call when the event is emitted.
     */
    on(event, callback) {
        if (!this._callbacks[event]) {
            this._callbacks[event] = [];
        }
        this._callbacks[event].push(callback);
    }

    /**
     * Emits an event to all subscribers.
     * @param {string} event - The event name.
     * @param  {...any} args - Arguments to pass to the callback functions.
     */
    emit(event, ...args) {
        if (this._callbacks[event]) {
            this._callbacks[event].forEach(callback => callback(...args));
        }
    }

    /**
     * Updates the status of a specific component and notifies subscribers.
     * @param {string} category - The top-level category (e.g., 'shaders', 'textures').
     * @param {string} key - The specific component key (e.g., 'baseShine', 'specular').
     * @param {{state: string, message: string}} statusObject - The new status object.
     */
    update(category, key, statusObject) {
        if (this._state[category] && this._state[category][key]) {
            this._state[category][key] = statusObject;
            this.emit('statusChanged', category, key, statusObject);
        } else {
            console.warn(`SystemStatusManager | Attempted to update non-existent status: ${category}.${key}`);
        }
    }

    /**
     * Retrieves the status object for a specific component.
     * @param {string} category - The top-level category.
     * @param {string} key - The specific component key.
     * @returns {{state: string, message: string}} The status object.
     */
    getStatus(category, key) {
        return this._state[category]?.[key] || { state: 'error', message: 'Status key not found.' };
    }

    /**
     * Retrieves the entire current state object.
     * @returns {object} The complete status state.
     */
    getAllStatuses() {
        return this._state;
    }

    /**
     * Evaluates the state of all inter-dependent pipelines based on the current
     * config and the status of their components (shaders, textures).
     */
    evaluatePipelines() {
        // --- Foundry Lighting Dependency ---
        const hasLighting = !!(canvas.lighting?.channels?.illumination && canvas.lighting?.channels?.coloration);
        this.update('dependencies', 'foundryLighting', {
            state: hasLighting ? 'ok' : 'error',
            message: hasLighting ? "Foundry lighting system detected and available." : "Foundry lighting system not found. Coloration and illumination effects will not work."
        });

        // --- Noise to Shine Pipeline ---
        if (!OVERLAY_CONFIG.baseShine.noise.enabled) {
            this.update('pipelines', 'noiseToShine', { state: 'disabled', message: 'Noise mask is disabled by user.' });
        } else if (this.getStatus('shaders', 'noise').state !== 'ok') {
            this.update('pipelines', 'noiseToShine', { state: 'error', message: 'Pipeline broken: Noise shader failed to compile.' });
        } else {
            this.update('pipelines', 'noiseToShine', { state: 'ok', message: 'Pipeline active: Noise mask is modulating the shine pattern.' });
        }

        // --- Normal Map to Shine Pipeline ---
        if (!OVERLAY_CONFIG.lighting.enabled) {
            this.update('pipelines', 'normalToShine', { state: 'disabled', message: 'Normal map lighting is disabled by user.' });
        } else if (this.getStatus('textures', 'normal').state !== 'ok') {
            this.update('pipelines', 'normalToShine', { state: 'error', message: 'Pipeline broken: Normal map texture is missing or invalid.' });
        } else {
            this.update('pipelines', 'normalToShine', { state: 'ok', message: 'Pipeline active: Normal map is influencing shine reflections.' });
        }
        
        // --- Illumination to Bloom Pipeline ---
        const bloomSuppressionEnabled = OVERLAY_CONFIG.bloom.illuminationResponse.suppressionFactor < 1.0;
        if (!OVERLAY_CONFIG.bloom.enabled || !bloomSuppressionEnabled) {
             this.update('pipelines', 'illuminationToBloom', { state: 'disabled', message: 'Bloom suppression by scene lighting is disabled.' });
        } else if (!hasLighting) {
             this.update('pipelines', 'illuminationToBloom', { state: 'error', message: 'Pipeline broken: Foundry lighting system not available.' });
        } else {
             this.update('pipelines', 'illuminationToBloom', { state: 'ok', message: 'Pipeline active: Scene lighting is correctly suppressing bloom in dark areas.' });
        }

        // --- Coloration to Shine Pipeline ---
        if (!hasLighting) {
             this.update('pipelines', 'colorationToShine', { state: 'error', message: 'Pipeline broken: Foundry lighting system not available.' });
        } else {
             this.update('pipelines', 'colorationToShine', { state: 'ok', message: 'Pipeline active: Scene light colors are tinting the shine effect.' });
        }
    }
}

// Initialize the singleton instance.
const systemStatus = new SystemStatusManager();


/**
 * Automatically discovers PBR-style textures in the same directory as the scene
 * background, based on a filename suffix convention.
 */
class TextureAutoLoader {
    static SUFFIX_MAP = {
        specular: "_Specular",
        ambient: "_Ambient",
        iridescence: "_Iridescence",
        normal: "_Normal",
        roughness: "_Roughness", // Kept for future PBR workflows
        metallic: "_Metallic" // Kept for future PBR workflows
    };

    constructor() {
        this.basePath = null;
        this.baseName = null;
    }

    async run() {
        const textureMap = {};
        Object.keys(TextureAutoLoader.SUFFIX_MAP).forEach(key => textureMap[key] = '');

        if (!this._getSceneBackgroundInfo()) {
            console.warn("MaterialToolkit | Could not find scene background. Texture auto-discovery aborted.");
            return textureMap;
        }

        await this._scanAndMatchTextures(textureMap);
        console.log("MaterialToolkit | Texture Auto-Discovery Results:", textureMap);
        return textureMap;
    }

    _getSceneBackgroundInfo() {
        const bgSrc = canvas.scene?.background.src;
        if (!bgSrc) return false;
        const cleanPath = decodeURIComponent(bgSrc);
        const lastSlash = cleanPath.lastIndexOf('/');
        const lastDot = cleanPath.lastIndexOf('.');
        this.basePath = cleanPath.substring(0, lastSlash + 1);
        this.baseName = cleanPath.substring(lastSlash + 1, lastDot);
        return true;
    }

    async _scanAndMatchTextures(textureMap) {
        let filesInDir = [];
        try {
            console.log(`MaterialToolkit | Scanning for textures in: "${this.basePath}"`);
            const source = game.settings.get("core", "noCanvas") ? "public" : "data";
            const browseResult = await FilePicker.browse(source, this.basePath);
            filesInDir = browseResult.files;
        } catch (e) {
            console.warn(`MaterialToolkit | Could not browse directory "${this.basePath}". It may not exist or permissions may be wrong.`, e);
            return;
        }

        for (const [key, suffix] of Object.entries(TextureAutoLoader.SUFFIX_MAP)) {
            const expectedPrefix = decodeURIComponent(this.baseName + suffix).toLowerCase();
            const foundFile = filesInDir.find(fullPath => {
                const decodedPath = decodeURIComponent(fullPath);
                const filename = decodedPath.substring(decodedPath.lastIndexOf('/') + 1);
                return filename.toLowerCase().startsWith(expectedPrefix);
            });
            if (foundFile) {
                textureMap[key] = foundFile;
            }
        }
    }
}

/**
 * Manages filters applied to the global canvas stage (e.g., Vignette, Lens Distortion).
 */
class ScreenEffectsManager {
    static _filters = new Map();
    static _stage = null;

    static initialize(stage) {
        if (!this._stage) {
            this._stage = stage;
        }
    }

    static addFilter(key, filter) {
        if (!this._stage) return;
        this.removeFilter(key);
        this._filters.set(key, filter);
        this._updateStageFilters();
    }

    static getFilter(key) {
        return this._filters.get(key);
    }



    static removeFilter(key) {
        if (!this._stage || !this._filters.has(key)) return;
        const filter = this._filters.get(key);
        filter?.destroy();
        this._filters.delete(key);
        this._updateStageFilters();
    }

    static _updateStageFilters() {
        if (!this._stage) return;
        const myFilterClasses = [VignetteFilter, LensDistortionFilter, ChromaticAberrationFilter, ColorCorrectionFilter];
        const otherFilters = (this._stage.filters || []).filter(f => !myFilterClasses.some(cls => f instanceof cls));
        const newFilters = [...otherFilters, ...Array.from(this._filters.values())];
        this._stage.filters = newFilters.length > 0 ? newFilters : null;
    }

    /**
     * Updates the uniforms and enabled state of all managed filters based on the config.
     * @param {object} config - The global configuration object.
     */
    static updateAllFiltersFromConfig(config) {
        const pp = config.postProcessing;

        const vignetteFilter = this.getFilter('vignette');
        if (vignetteFilter instanceof VignetteFilter) {
            vignetteFilter.enabled = pp.enabled && pp.vignette.enabled;
            vignetteFilter.amount = pp.vignette.amount;
            vignetteFilter.softness = pp.vignette.softness;
        }

        const lensDistortionFilter = this.getFilter('lensDistortion');
        if (lensDistortionFilter instanceof LensDistortionFilter) {
            lensDistortionFilter.enabled = pp.enabled && pp.lensDistortion.enabled;
            lensDistortionFilter.amount = pp.lensDistortion.amount;
            lensDistortionFilter.center = [pp.lensDistortion.centerX, pp.lensDistortion.centerY];
        }
        
        const caFilter = this.getFilter('chromaticAberration');
        if(caFilter instanceof ChromaticAberrationFilter) {
            caFilter.enabled = pp.enabled && pp.chromaticAberration.enabled;
            caFilter.amount = pp.chromaticAberration.amount;
            caFilter.center = [pp.chromaticAberration.centerX, pp.chromaticAberration.centerY];
        }

        const ccFilter = this.getFilter('colorCorrection');
        if (ccFilter instanceof ColorCorrectionFilter) {
            ccFilter.enabled = pp.enabled && pp.colorCorrection.enabled;
            ccFilter.saturation = pp.colorCorrection.saturation;
            ccFilter.brightness = pp.colorCorrection.brightness;
            ccFilter.contrast = pp.colorCorrection.contrast;
        }
    }

    static tearDown() {
        if (!this._stage) return;
        this._filters.forEach(filter => filter.destroy());
        this._filters.clear();
        this._updateStageFilters();
        this._stage = null;
    }
}

/**
 * Manages user input for effects like right-click-drag to fade.
 */
class InputManager {
    constructor(targetElement, patternFilter, config) {
        this.element = targetElement;
        this.patternFilter = patternFilter;
        this.config = config;
        this._isRightButtonDown = false;
        this._isDraggingRightButton = false;
        this._lastPanPosition = { x: 0, y: 0 };
        this._panFadeState = { active: false, startTime: 0, duration: 0, startValue: 0, targetValue: 0 };
        this._onPointerDownBound = this._onPointerDown.bind(this);
        this._onPointerUpBound = this._onPointerUp.bind(this);
        this._onContextMenuPreventBound = (e) => { if (this._isRightButtonDown) e.preventDefault(); };
        this._onCanvasPanBound = this._onCanvasPan.bind(this);
    }

    attachListeners() {
        this.element.addEventListener('pointerdown', this._onPointerDownBound);
        this.element.addEventListener('pointerup', this._onPointerUpBound);
        this.element.addEventListener('contextmenu', this._onContextMenuPreventBound);
        Hooks.on('canvasPan', this._onCanvasPanBound);
        this._lastPanPosition = { x: canvas.stage.position.x, y: canvas.stage.position.y };
    }

    detachListeners() {
        this.element.removeEventListener('pointerdown', this._onPointerDownBound);
        this.element.removeEventListener('pointerup', this._onPointerUpBound);
        this.element.removeEventListener('contextmenu', this._onContextMenuPreventBound);
        Hooks.off('canvasPan', this._onCanvasPanBound);
    }

    update(deltaTime) {
        if (!this._panFadeState.active || !this.patternFilter) return;
        const elapsed = performance.now() - this._panFadeState.startTime;
        let progress = Math.min(elapsed / this._panFadeState.duration, 1.0);
        progress = progress * progress * (3.0 - 2.0 * progress);
        const currentValue = this._panFadeState.startValue + (this._panFadeState.targetValue - this._panFadeState.startValue) * progress;
        this.patternFilter.uniforms.u_globalIntensity = currentValue;
        if (progress >= 1.0) {
            this._panFadeState.active = false;
        }
    }

    _startFade(targetValue, duration) {
        if (!this.patternFilter) return;
        this._panFadeState = {
            active: true,
            startTime: performance.now(),
            duration: duration,
            startValue: this.patternFilter.uniforms.u_globalIntensity,
            targetValue: targetValue
        };
    }

    _onPointerDown(event) {
        if (event.button === 2) {
            this._isRightButtonDown = true;
            this._lastPanPosition = { x: canvas.stage.position.x, y: canvas.stage.position.y };
        }
    }

    _onPointerUp(event) {
        if (event.button === 2) {
            this._isRightButtonDown = false;
            if (this._isDraggingRightButton) {
                this._startFade(this.config.baseShine.animation.globalIntensity, 2000);
                this._isDraggingRightButton = false;
            } else {
                this._panFadeState.active = false;
                if (this.patternFilter) {
                    this.patternFilter.uniforms.u_globalIntensity = this.config.baseShine.animation.globalIntensity;
                }
            }
        }
    }

    _onCanvasPan(view) {
        if (this._isRightButtonDown) {
            const currentPos = canvas.stage.position;
            const dist = Math.hypot(currentPos.x - this._lastPanPosition.x, currentPos.y - this._lastPanPosition.y);
            if (dist > 5 && !this._isDraggingRightButton) {
                this._isDraggingRightButton = true;
                this._startFade(0, 1000);
            }
            this._lastPanPosition = { x: currentPos.x, y: currentPos.y };
        }
    }

    destroy() {
        this.detachListeners();
        this.patternFilter = null;
        this.element = null;
    }
}

/**
 * Manages the procedural texture generation for the main shine effect pattern.
 */
class ProceduralTextureManager {
    constructor(renderer) {
        this.renderTexture = null;
        this.sourceSprite = null;
        this.filter = null;
        this._setup(renderer);
    }

    _setup(renderer) {
        const screen = renderer.screen;
        this.renderTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height, scaleMode: PIXI.SCALE_MODES.LINEAR });
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
    }

    resize(renderer) {
        if (!this.renderTexture || !this.sourceSprite) return;
        const screen = renderer.screen;
        this.renderTexture.resize(screen.width, screen.height, true);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
    }

    updateFromConfig(config) {
        const bs = config.baseShine;
        const p = bs.pattern;
        const s1 = p.stripes1;
        const s2 = p.stripes2;
        const light = config.lighting;

        if (!this.filter) {
            try {
                this.filter = new ShinePatternFilter({
                    u_time: 0.0,
                    u_camera_offset: [0, 0],
                    u_view_size: [0, 0],
                    u_debugMode: 0,
                    u_noiseMap: PIXI.Texture.EMPTY,
                    u_normalMap: PIXI.Texture.EMPTY,
                    u_lightPosition: [0, 0]
                });
                systemStatus.update('shaders', 'baseShine', { state: 'ok', message: 'Compiled successfully.' });
            } catch (err) {
                console.error("MaterialToolkit | Failed to compile ShinePatternFilter!", err);
                ui.notifications.error("Shine Pattern GLSL failed to compile. See console (F12).");
                systemStatus.update('shaders', 'baseShine', { state: 'error', message: `Compilation failed: ${err.message}` });
                this.filter = null;
                return;
            }
        }

        const u = this.filter.uniforms;
        u.u_globalIntensity = bs.animation.globalIntensity;
        u.u_shared_maxBrightness = p.shared.maxBrightness;
        u.u_shared_patternScale = p.shared.patternScale;
        u.u_noise_enabled = bs.noise.enabled;
        u.u_lighting_enabled = light.enabled;
        u.u_lighting_strength = light.strength;
        u.u_lighting_shininess = light.shininess;
        u.u_lighting_height = light.height;
        u.u_displacement_enabled = light.displacement.enabled;
        u.u_displacement_strength = light.displacement.strength;
        u.u_s1_enabled = s1.enabled;
        u.u_s1_speed = s1.speed;
        u.u_s1_intensity = s1.intensity;
        u.u_s1_tint_color = hexToRgbArray(s1.tintColor);
        u.u_s1_angle_rad = s1.angle * (Math.PI / 180);
        u.u_s1_sharpness = s1.sharpness;
        u.u_s1_band_density = s1.bandDensity;
        u.u_s1_band_width = s1.bandWidth;
        u.u_s1_sub_stripe_max_count = s1.subStripeMaxCount;
        u.u_s1_sub_stripe_max_sharp = s1.subStripeMaxSharp;
        u.u_s2_enabled = s2.enabled;
        u.u_s2_speed = s2.speed;
        u.u_s2_intensity = s2.intensity;
        u.u_s2_tint_color = hexToRgbArray(s2.tintColor);
        u.u_s2_angle_rad = s2.angle * (Math.PI / 180);
        u.u_s2_sharpness = s2.sharpness;
        u.u_s2_band_density = s2.bandDensity;
        u.u_s2_band_width = s2.bandWidth;
        u.u_s2_sub_stripe_max_count = s2.subStripeMaxCount;
        u.u_s2_sub_stripe_max_sharp = s2.subStripeMaxSharp;

        this.sourceSprite.filters = this.filter ? [this.filter] : [];
    }

    update(deltaTime, renderer) {
        if (!this.filter || !this.sourceSprite || !this.renderTexture || !canvas?.stage) return;
        this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + deltaTime;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        this.filter.uniforms.u_camera_offset = [topLeft.x, topLeft.y];
        this.filter.uniforms.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
    }

    getTexture() { return this.renderTexture; }
    getFilter() { return this.filter; }
    destroy() {
        this.filter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture?.destroy(true);
        this.filter = this.sourceSprite = this.renderTexture = null;
    }
}

/**
 * Manages the procedural texture generation for the noise mask effect.
 */
class NoiseTextureManager {
    constructor(renderer) {
        this.renderTexture = null;
        this.sourceSprite = null;
        this.filter = null;
        this._setup(renderer);
    }

    _setup(renderer) {
        const screen = renderer.screen;
        this.renderTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height, scaleMode: PIXI.SCALE_MODES.LINEAR });
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
    }

    resize(renderer) {
        if (!this.renderTexture || !this.sourceSprite) return;
        const screen = renderer.screen;
        this.renderTexture.resize(screen.width, screen.height, true);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
    }

    updateFromConfig(config) {
        const n = config.baseShine.noise;
        if (!this.filter) {
            try {
                this.filter = new NoisePatternFilter({ u_time: 0.0, u_camera_offset: [0, 0], u_view_size: [0, 0] });
                systemStatus.update('shaders', 'noise', { state: 'ok', message: 'Compiled successfully.' });
            } catch (err) {
                console.error("MaterialToolkit | Failed to compile NoisePatternFilter!", err);
                systemStatus.update('shaders', 'noise', { state: 'error', message: `Compilation failed: ${err.message}` });
                this.filter = null;
                return;
            }
        }
        const u = this.filter.uniforms;
        u.u_speed = n.speed;
        u.u_scale = n.scale;
        u.u_threshold = n.threshold;
        u.u_brightness = n.brightness;
        u.u_contrast = n.contrast;
        u.u_softness = n.softness;
        this.sourceSprite.filters = this.filter ? [this.filter] : [];
    }

    update(deltaTime, renderer) {
        if (!this.filter || !this.sourceSprite || !this.renderTexture || !canvas?.stage) return;
        this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + deltaTime;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        this.filter.uniforms.u_camera_offset = [topLeft.x, topLeft.y];
        this.filter.uniforms.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
    }

    getTexture() { return this.renderTexture; }
    destroy() {
        this.filter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture?.destroy(true);
        this.filter = this.sourceSprite = this.renderTexture = null;
    }
}

/**
 * Manages the bloom post-processing effect.
 */
class BloomEffect {
    constructor(effectTexture, specularTexture) {
        this.container = new PIXI.Container();
        this.stableContentSprite = new PIXI.Sprite(effectTexture);
        this.worldMaskSprite = new PIXI.Sprite(specularTexture);
        this.thresholdFilter = null;
        this.blurFilter = null;
        this.bloomHotspotFilter = null;
        this.bloomIlluminationMaskFilter = null;
        this.chromaticAberrationFilter = null;
        this._setupFilters();
        this._setupContainer();
    }

    _setupFilters() {
        let allOk = true;
        const errors = [];

        try { this.thresholdFilter = new ThresholdFilter(); } catch (e) { console.error("Failed to create ThresholdFilter", e); errors.push('Threshold'); allOk = false; }
        this.blurFilter = new PIXI.filters.BlurFilter(); // This one doesn't have custom GLSL, so it's safe.
        try { this.bloomHotspotFilter = new BloomHotspotFilter(); } catch (e) { console.error("Failed to create BloomHotspotFilter", e); errors.push('BloomHotspot'); allOk = false; }
        try { this.bloomIlluminationMaskFilter = new BloomIlluminationMaskFilter(); } catch (e) { console.error("Failed to create BloomIlluminationMaskFilter", e); errors.push('BloomIlluminationMask'); allOk = false; }
        try { this.chromaticAberrationFilter = new ChromaticAberrationFilter(); } catch (e) { console.error("Failed to create Bloom ChromaticAberrationFilter", e); errors.push('ChromaticAberration(Bloom)'); allOk = false; }
        
        systemStatus.update('shaders', 'bloom', {
            state: allOk ? 'ok' : 'error',
            message: allOk ? 'Compiled successfully.' : `One or more bloom shaders failed to compile: ${errors.join(', ')}`
        });
    }

    _setupContainer() {
        this.container.addChild(this.stableContentSprite);
        this.container.mask = this.worldMaskSprite;
        this.container.addChild(this.worldMaskSprite); // The mask sprite must also be a child of the container

        // --- CORRECTED FILTER ORDER ---
        // Chromatic Aberration must be applied FIRST to act on the colored source texture
        // before the Threshold filter converts it to grayscale.
        this.container.filters = [
            this.chromaticAberrationFilter,
            this.bloomIlluminationMaskFilter, 
            this.thresholdFilter, 
            this.blurFilter, 
            this.bloomHotspotFilter
        ].filter(f => f);
    }

    updateFromConfig(config) {
        const b = config.bloom;
        const actualBlur = b.blur;
        const actualThreshold = b.threshold;

        this.container.visible = config.enabled && b.enabled;
        this.container.alpha = b.intensity;
        this.container.blendMode = b.compositing.bloomBlendMode;
        this.stableContentSprite.blendMode = b.compositing.bloomSourceBlendMode;

        if (this.thresholdFilter) this.thresholdFilter.threshold = actualThreshold;
        if (this.blurFilter) {
            this.blurFilter.strength = actualBlur;
            this.blurFilter.quality = b.quality.samples;
            this.blurFilter.resolution = b.quality.resolution;
        }
        if (this.bloomHotspotFilter) this.bloomHotspotFilter.hotspot = b.hotspot;
        if (this.bloomIlluminationMaskFilter) {
            this.bloomIlluminationMaskFilter.darknessThreshold = b.illuminationResponse.darknessThreshold;
            this.bloomIlluminationMaskFilter.suppressionFactor = b.illuminationResponse.suppressionFactor;
        }
        if (this.chromaticAberrationFilter) {
            const caConfig = b.chromaticAberration;
            this.chromaticAberrationFilter.enabled = b.enabled && caConfig.enabled;
            this.chromaticAberrationFilter.amount = caConfig.amount;
            this.chromaticAberrationFilter.center = [caConfig.centerX, caConfig.centerY];
        }
    }

    updateWorldSpriteTransform() {
        if (!this.worldMaskSprite?.texture.valid) return;
        const sceneRect = canvas.scene.dimensions.sceneRect;
        if (isNaN(sceneRect.width) || sceneRect.width <= 0) return;
        this.worldMaskSprite.position.set(sceneRect.x, sceneRect.y);
        this.worldMaskSprite.scale.set(sceneRect.width / this.worldMaskSprite.texture.baseTexture.width, sceneRect.height / this.worldMaskSprite.texture.baseTexture.height);
    }

    updateStableSpriteTransform() {
        if (!this.stableContentSprite || !canvas.stage) return;
        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        const width = screen.width / stage.scale.x;
        const height = screen.height / stage.scale.y;
        this.stableContentSprite.position.copyFrom(topLeft);
        this.stableContentSprite.width = width;
        this.stableContentSprite.height = height;
    }

    destroy() {
        this.container.destroy({ children: true, texture: true, baseTexture: true });
        this.container = this.stableContentSprite = this.worldMaskSprite = null;
    }
}

/**
 * ===================================================================================
 *  IV. CUSTOM CANVAS LAYERS
 * ===================================================================================
 */

class IridescenceLayer extends CanvasLayer {
    constructor() {
        super();
        this.effectContainer = null;
        this.effectSprite = null;
        this.maskSprite = null;
        this.iridescenceFilter = null;
        this.animationState = {};
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        this._onCanvasPanBound = this._onCanvasPan.bind(this);
    }

    _setupProceduralTexture(config) {
        const textureSize = 256;
        const sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sourceSprite.width = textureSize;
        sourceSprite.height = textureSize;

        try {
            this.iridescenceFilter = new IridescenceFilter(config.iridescence);
            systemStatus.update('shaders', 'iridescence', { state: 'ok', message: 'Compiled successfully.' });
        } catch (e) {
            console.error("MaterialToolkit | Failed to create IridescenceFilter", e);
            systemStatus.update('shaders', 'iridescence', { state: 'error', message: `Compilation failed: ${e.message}` });
            this.iridescenceFilter = null;
        }

        sourceSprite.filters = this.iridescenceFilter ? [this.iridescenceFilter] : [];

        const renderTexture = PIXI.RenderTexture.create({ width: textureSize, height: textureSize, scaleMode: PIXI.SCALE_MODES.LINEAR });
        renderTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

        this.animationState = { sourceSprite, renderTexture, filter: this.iridescenceFilter };
        return renderTexture;
    }

    async _draw(options) {
        console.log("IridescenceLayer | Drawing layer.");
        const proceduralTexture = this._setupProceduralTexture(OVERLAY_CONFIG);
        this.maskSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.maskSprite.filters = [new AlphaMaskFilter()];
        this.effectSprite = new PIXI.TilingSprite(proceduralTexture);
        this.effectContainer = new PIXI.Container();
        this.effectContainer.addChild(this.effectSprite);
        this.effectContainer.mask = this.maskSprite;
        this.effectContainer.addChild(this.maskSprite);
        this.addChild(this.effectContainer);

        await this.updateFromConfig(OVERLAY_CONFIG);
        this._onResize();
        canvas.app.ticker.add(this._onAnimateBound);
        Hooks.on('canvasPan', this._onCanvasPanBound);
        window.addEventListener('resize', this._onResizeBound);
    }

    async _tearDown(options) {
        console.log("IridescenceLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        Hooks.off('canvasPan', this._onCanvasPanBound);
        window.removeEventListener('resize', this._onResizeBound);
        this.iridescenceFilter?.destroy();
        this.effectContainer?.destroy({ children: true, texture: true, baseTexture: true });
        this.animationState.sourceSprite?.destroy();
        this.animationState.renderTexture?.destroy(true);
        this.iridescenceFilter = this.effectContainer = this.effectSprite = this.maskSprite = null;
        this.animationState = {};
        return super._tearDown(options);
    }

    async updateFromConfig(config) {
        const iConfig = config.iridescence;
        this.visible = config.enabled && iConfig.enabled;
        if (!this.visible) return;

        this.blendMode = iConfig.blendMode;
        this.effectContainer.alpha = iConfig.intensity;

        if (this.iridescenceFilter) {
            const u = this.iridescenceFilter.uniforms;
            u.u_intensity = iConfig.intensity;
            u.u_speed = iConfig.speed;
            u.u_scale = iConfig.scale;
            u.u_noise_amount = iConfig.noiseAmount;
        }

        if (this.maskSprite) {
            let texture = PIXI.Texture.EMPTY;
            const path = iConfig.texturePath;
            
            if (!path) {
                systemStatus.update('textures', 'iridescence', { state: 'inactive', message: 'No path specified for iridescence mask.' });
            } else {
                systemStatus.update('textures', 'iridescence', { state: 'pending', message: `Loading: ${path}` });
                try {
                    texture = await loadTexture(path, { fallback: "icons/svg/hazard.svg" });
                    if (texture?.valid) {
                        systemStatus.update('textures', 'iridescence', { state: 'ok', message: 'Loaded successfully.' });
                        texture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
                    } else {
                        systemStatus.update('textures', 'iridescence', { state: 'error', message: 'Texture is invalid or could not be decoded.' });
                    }
                } catch (e) {
                    console.error(`IridescenceLayer | Failed to load mask texture: ${path}`, e);
                    systemStatus.update('textures', 'iridescence', { state: 'error', message: `File not found at path: ${path}` });
                }
            }
            this.maskSprite.texture = texture;
            this.updateWorldSpriteTransform();
        }
        this.updateScreenSpriteTransform();
        systemStatus.evaluatePipelines();
    }

    _onAnimate(deltaTime) {
        if (!this.animationState.sourceSprite || !this.animationState.renderTexture || !this.iridescenceFilter) return;
        this.animationState.filter.uniforms.u_time += deltaTime;
        canvas.app.renderer.render(this.animationState.sourceSprite, { renderTexture: this.animationState.renderTexture, clear: true });
    }

    _onResize() { this.updateWorldSpriteTransform(); this.updateScreenSpriteTransform(); }
    _onCanvasPan() { this.updateScreenSpriteTransform(); }
    updateWorldSpriteTransform() {
        if (!this.maskSprite?.texture.valid) return;
        const sceneRect = canvas.scene.dimensions.sceneRect;
        if (isNaN(sceneRect.width) || sceneRect.width <= 0) return;
        this.maskSprite.position.set(sceneRect.x, sceneRect.y);
        this.maskSprite.scale.set(sceneRect.width / this.maskSprite.texture.baseTexture.width, sceneRect.height / this.maskSprite.texture.baseTexture.height);
    }
    updateScreenSpriteTransform() {
        if (!this.effectSprite || !canvas.stage) return;
        const stage = canvas.stage, screen = canvas.app.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
        if (this.effectSprite.tilePosition) {
            const pConfig = OVERLAY_CONFIG.iridescence.parallax;
            if (pConfig.enabled) {
                this.effectSprite.tilePosition.set(topLeft.x * pConfig.multiplier, topLeft.y * pConfig.multiplier);
            } else {
                this.effectSprite.tilePosition.set(0, 0);
            }
        }
    }
}

class AmbientLayer extends CanvasLayer {
    constructor() {
        super();
        this.ambientSprite = null;
        this._onResizeBound = this._onResize.bind(this);
        this._onCanvasPanBound = this._onResize.bind(this); // Ambient doesn't parallax
    }

    async _draw(options) {
        console.log("AmbientLayer | Drawing layer.");
        this.ambientSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.addChild(this.ambientSprite);
        await this.updateFromConfig(OVERLAY_CONFIG);
        this._onResize();
        Hooks.on('canvasPan', this._onCanvasPanBound);
        window.addEventListener('resize', this._onResizeBound);
    }

    async _tearDown(options) {
        console.log("AmbientLayer | Tearing down layer.");
        Hooks.off('canvasPan', this._onCanvasPanBound);
        window.removeEventListener('resize', this._onResizeBound);
        this.ambientSprite?.destroy({ children: true, texture: true, baseTexture: true });
        this.ambientSprite = null;
        return super._tearDown(options);
    }

    async updateFromConfig(config) {
        if (!this.ambientSprite) return;
        const aConfig = config.ambient;
        this.visible = config.enabled && aConfig.enabled;
        if (!this.visible) return;

        this.ambientSprite.blendMode = aConfig.blendMode;
        this.ambientSprite.alpha = aConfig.intensity;

        let texture = PIXI.Texture.EMPTY;
        const path = aConfig.texturePath;
        
        if (!path) {
            systemStatus.update('textures', 'ambient', { state: 'inactive', message: 'No path specified for ambient/emissive map.' });
        } else {
            systemStatus.update('textures', 'ambient', { state: 'pending', message: `Loading: ${path}` });
            try {
                texture = await loadTexture(path, { fallback: "icons/svg/hazard.svg" });
                if (texture?.valid) {
                    systemStatus.update('textures', 'ambient', { state: 'ok', message: 'Loaded successfully.' });
                    texture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;
                } else {
                    systemStatus.update('textures', 'ambient', { state: 'error', message: 'Texture is invalid or could not be decoded.' });
                }
            } catch (e) {
                console.error(`AmbientLayer | Failed to load texture: ${path}`, e);
                systemStatus.update('textures', 'ambient', { state: 'error', message: `File not found at path: ${path}` });
            }
        }
        this.ambientSprite.texture = texture;
        this.updateWorldSpriteTransform();
        systemStatus.evaluatePipelines();
    }

    _onResize() { this.updateWorldSpriteTransform(); }
    updateWorldSpriteTransform() {
        if (!this.ambientSprite?.texture.valid) return;
        const sceneRect = canvas.scene.dimensions.sceneRect;
        if (isNaN(sceneRect.width) || sceneRect.width <= 0) return;
        this.ambientSprite.position.set(sceneRect.x, sceneRect.y);
        this.ambientSprite.scale.set(sceneRect.width / this.ambientSprite.texture.baseTexture.width, sceneRect.height / this.ambientSprite.texture.baseTexture.height);
    }
}

class MetallicShineLayer extends CanvasLayer {
    constructor() {
        super();
        this.debugger = null;
        this.proceduralTextureManager = null;
        this.noiseTextureManager = null;
        this.bloomEffect = null;
        this.inputManager = null;
        this.effectContainer = null;
        this.stableContentSprite = null;
        this.worldMaskSprite = null;
        this.normalMapWorldSprite = null;
        this.normalMapRenderTexture = null;
        this.shineColorationTintFilter = null;
        this.illuminationDebugTexture = null;
        this.illuminationDebugGraphics = null;
        this.illuminationDebugFilter = null;
        this.illuminationDebugSprite = null;
        this.debugBackground = null;
        this.debugViewMode = 'composite';
        this.mousePosition = { x: 0, y: 0 };
        this._onResizeBound = this._onResize.bind(this);
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onMouseMoveBound = this._onMouseMove.bind(this);
    }

    async _draw(options) {
        console.log("MetallicShineLayer | Drawing layer.");
        
        // Init Managers
        ScreenEffectsManager.initialize(canvas.app.stage);
        this.proceduralTextureManager = new ProceduralTextureManager(canvas.app.renderer);
        this.noiseTextureManager = new NoiseTextureManager(canvas.app.renderer);
        this.inputManager = new InputManager(canvas.app.view, this.proceduralTextureManager.getFilter(), OVERLAY_CONFIG);

        // Setup Normal Map rendering pipeline
        this.normalMapWorldSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.normalMapWorldSprite.visible = false; // Rendered to texture, not displayed directly
        this.addChild(this.normalMapWorldSprite);
        this.normalMapRenderTexture = PIXI.RenderTexture.create({ width: canvas.app.screen.width, height: canvas.app.screen.height, scaleMode: PIXI.SCALE_MODES.LINEAR });

        // Setup Screen-level Filters and report status
        const ppErrors = [];
        try { ScreenEffectsManager.addFilter('vignette', new VignetteFilter()); } catch (e) { ppErrors.push('Vignette'); }
        try { ScreenEffectsManager.addFilter('lensDistortion', new LensDistortionFilter()); } catch (e) { ppErrors.push('LensDistortion'); }
        try { ScreenEffectsManager.addFilter('chromaticAberration', new ChromaticAberrationFilter()); } catch(e) { ppErrors.push('ChromaticAberration'); }
        try { ScreenEffectsManager.addFilter('colorCorrection', new ColorCorrectionFilter()); } catch (e) { ppErrors.push('ColorCorrection'); }
        systemStatus.update('shaders', 'postProcessing', {
            state: ppErrors.length === 0 ? 'ok' : 'error',
            message: ppErrors.length === 0 ? 'Compiled successfully.' : `Failed to compile: ${ppErrors.join(', ')}`
        });
        
        // Setup internal filters and report status
        const internalErrors = [];
        try { this.shineColorationTintFilter = new ShineColorationTintFilter(); } catch (e) { internalErrors.push('ShineColoration'); }
        systemStatus.update('shaders', 'internal', {
             state: internalErrors.length === 0 ? 'ok' : 'error',
             message: internalErrors.length === 0 ? 'Compiled successfully.' : `Failed to compile: ${internalErrors.join(', ')}`
        });

        // Combine procedural filters
        if (this.proceduralTextureManager.sourceSprite) {
            this.proceduralTextureManager.sourceSprite.filters = [this.proceduralTextureManager.getFilter(), this.shineColorationTintFilter].filter(f => f);
        }

        const effectTexture = this._getEffectTexture(OVERLAY_CONFIG);
        const specularTexture = PIXI.Texture.EMPTY;

        this.bloomEffect = new BloomEffect(effectTexture, specularTexture);

        this.stableContentSprite = new PIXI.Sprite(effectTexture);
        this.worldMaskSprite = new PIXI.Sprite(specularTexture);
        this.effectContainer = new PIXI.Container();
        this.effectContainer.addChild(this.stableContentSprite);
        this.effectContainer.mask = this.worldMaskSprite;
        this.effectContainer.addChild(this.worldMaskSprite);
        this.effectContainer.filters = [].filter(f => f); 

        this._setupIlluminationDebug();
        this.debugBackground = new PIXI.Graphics();
        this.debugBackground.visible = false;
        this.addChildAt(this.debugBackground, 0);

        this.addChild(this.effectContainer, this.bloomEffect.container, this.illuminationDebugSprite);

        await this.updateFromConfig(OVERLAY_CONFIG);

        if (OVERLAY_CONFIG.debug) { this.debugger = new MaterialEditorDebugger(this); }
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
        Hooks.on('canvasPan', this._onResizeBound);
        canvas.stage.on('pointermove', this._onMouseMoveBound);
        this.inputManager.attachListeners();
    }

    async updateFromConfig(config) {
        const bs = config.baseShine;
        this.visible = config.enabled && bs.enabled;
        if (!this.visible) return;

        this.blendMode = bs.compositing.layerBlendMode;
        
        // --- Load Specular Texture & Report Status ---
        let specTexture = PIXI.Texture.EMPTY;
        const specPath = bs.specularTexturePath;
        if (!specPath) {
            systemStatus.update('textures', 'specular', { state: 'inactive', message: 'No path specified for specular map.' });
        } else {
            systemStatus.update('textures', 'specular', { state: 'pending', message: `Loading: ${specPath}` });
            try { 
                specTexture = await loadTexture(specPath, { fallback: "icons/svg/hazard.svg" });
                if (specTexture?.valid) {
                     systemStatus.update('textures', 'specular', { state: 'ok', message: 'Loaded successfully.' });
                } else {
                     systemStatus.update('textures', 'specular', { state: 'error', message: 'Texture is invalid or could not be decoded.' });
                }
            } catch (e) { 
                console.error(`MetallicShineLayer | Failed to load specular texture`, e);
                systemStatus.update('textures', 'specular', { state: 'error', message: `File not found at path: ${specPath}` });
            }
        }
        this.worldMaskSprite.texture = specTexture;
        if (this.bloomEffect?.worldMaskSprite) this.bloomEffect.worldMaskSprite.texture = specTexture;

        // --- Load Normal Texture & Report Status ---
        let normTexture = PIXI.Texture.EMPTY;
        const normPath = config.lighting.normalTexturePath;
        if (!normPath) {
             systemStatus.update('textures', 'normal', { state: 'inactive', message: 'No path specified for normal map.' });
        } else {
            systemStatus.update('textures', 'normal', { state: 'pending', message: `Loading: ${normPath}` });
            try { 
                normTexture = await loadTexture(normPath, { fallback: "icons/svg/hazard.svg" });
                if (normTexture?.valid) {
                    systemStatus.update('textures', 'normal', { state: 'ok', message: 'Loaded successfully.' });
                } else {
                    systemStatus.update('textures', 'normal', { state: 'error', message: 'Texture is invalid or could not be decoded.' });
                }
            } catch (e) { 
                console.error(`MetallicShineLayer | Failed to load normal texture`, e);
                systemStatus.update('textures', 'normal', { state: 'error', message: `File not found at path: ${normPath}` });
            }
        }
        this.normalMapWorldSprite.texture = normTexture;

        // --- Update child managers and global effects ---
        this.proceduralTextureManager?.updateFromConfig(config);
        this.noiseTextureManager?.updateFromConfig(config);
        this.bloomEffect?.updateFromConfig(config);
        ScreenEffectsManager.updateAllFiltersFromConfig(config);

        const effectTexture = this._getEffectTexture(config);
        if (this.stableContentSprite) this.stableContentSprite.texture = effectTexture;
        if (this.bloomEffect?.stableContentSprite) this.bloomEffect.stableContentSprite.texture = effectTexture;

        // --- Finalize updates ---
        this.updateWorldSpriteTransform();
        this.updateStableSpriteTransform();
        systemStatus.evaluatePipelines(); // This is the crucial call that updates dependent statuses
    }

    _getEffectTexture(config) {
        if (config.baseShine.patternType === 'stripes') {
            return this.proceduralTextureManager.getTexture();
        } else {
            const c = config.baseShine.pattern.checkerboard;
            const gfx = new PIXI.Graphics();
            const texSize = 256;
            const cellSize = texSize / c.gridSize;
            for (let y = 0; y < c.gridSize; y++) {
                for (let x = 0; x < c.gridSize; x++) {
                    const bright = (x + y) % 2 === 0 ? c.brightness1 : c.brightness2;
                    const gray = Math.floor(bright * 255);
                    gfx.beginFill((gray << 16) + (gray << 8) + gray).drawRect(x * cellSize, y * cellSize, cellSize, cellSize).endFill();
                }
            }
            const proceduralTexture = canvas.app.renderer.generateTexture(gfx);
            proceduralTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
            gfx.destroy();
            return proceduralTexture;
        }
    }

    _setupIlluminationDebug() {
        const screen = canvas.app.screen;
        let isOk = true;
        this.illuminationDebugTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height, scaleMode: PIXI.SCALE_MODES.LINEAR });
        this.illuminationDebugGraphics = new PIXI.Graphics();
        try { 
            this.illuminationDebugFilter = new SceneIlluminationDebugFilter(); 
        } catch (e) { 
            isOk = false;
            systemStatus.update('shaders', 'debug', { state: 'error', message: `Failed to compile SceneIlluminationDebugFilter: ${e.message}` });
        }
        if (isOk) {
            systemStatus.update('shaders', 'debug', { state: 'ok', message: 'Compiled successfully.' });
        }
        
        this.illuminationDebugSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.illuminationDebugSprite.filter = this.illuminationDebugFilter;
        this.illuminationDebugSprite.visible = false;
    }

    async _tearDown(options) {
        console.log("MetallicShineLayer | Tearing down layer.");
        ScreenEffectsManager.tearDown();
        this.inputManager?.destroy();
        this.proceduralTextureManager?.destroy();
        this.noiseTextureManager?.destroy();
        this.normalMapRenderTexture?.destroy(true);
        this.bloomEffect?.destroy();
        this.debugger?.destroy();

        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);
        Hooks.off('canvasPan', this._onResizeBound);
        canvas.stage.off('pointermove', this._onMouseMoveBound);
        
        this.removeChildren().forEach(c => c.destroy({ children: true, texture: false, baseTexture: false }));
        this.shineColorationTintFilter?.destroy();
        this.illuminationDebugTexture?.destroy(true);
        this.illuminationDebugGraphics?.destroy();
        this.illuminationDebugFilter?.destroy();

        for (const key in this) { if (key !== '_destroyed') this[key] = null; }

        return super._tearDown(options);
    }

    _onAnimate(deltaTime) {
        if (!this.visible) return;

        const renderer = canvas.app.renderer;

        if (this.debugger) this.debugger.updateLiveValues();

        this.inputManager?.update(deltaTime);
        this.noiseTextureManager?.update(deltaTime, renderer);

        if (this.normalMapWorldSprite?.texture.valid) {
            renderer.render(this.normalMapWorldSprite, { renderTexture: this.normalMapRenderTexture, clear: true });
        }

        const shineFilter = this.proceduralTextureManager?.getFilter();
        if (shineFilter) {
            shineFilter.uniforms.u_noiseMap = this.noiseTextureManager.getTexture();
            shineFilter.uniforms.u_normalMap = this.normalMapRenderTexture;
            shineFilter.uniforms.u_lightPosition = [this.mousePosition.x, this.mousePosition.y];
        }
        if (OVERLAY_CONFIG.baseShine.patternType === 'stripes') {
            this.proceduralTextureManager?.update(deltaTime, renderer);
        }

        const bloomIllumFilter = this.bloomEffect?.bloomIlluminationMaskFilter;
        if (bloomIllumFilter && canvas.lighting?.channels?.illumination?.renderTexture) {
            bloomIllumFilter.illuminationTexture = canvas.lighting.channels.illumination.renderTexture;
        }
        if (this.shineColorationTintFilter && canvas.lighting?.channels?.coloration?.renderTexture) {
            this.shineColorationTintFilter.colorationTexture = canvas.lighting.channels.coloration.renderTexture;
        }

        if (this.debugViewMode === 'illumination_map_live') {
            this._updateIlluminationDebugTexture();
        }
    }

    _onResize() {
        const renderer = canvas.app.renderer;
        this.proceduralTextureManager?.resize(renderer);
        this.noiseTextureManager?.resize(renderer);
        this.normalMapRenderTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.illuminationDebugTexture?.resize(renderer.screen.width, renderer.screen.height);

        if (this.debugBackground) {
            this.debugBackground.clear().beginFill(0x000000).drawRect(0, 0, renderer.screen.width, renderer.screen.height).endFill();
        }
        this.updateWorldSpriteTransform();
        this.updateStableSpriteTransform();
    }

    _onMouseMove(event) {
        const pos = canvas.stage.toLocal(event.data.global);
        this.mousePosition.x = pos.x; this.mousePosition.y = pos.y;
    }

    updateDebugView(mode) {
        this.debugViewMode = mode;
        if (!this.effectContainer || !this.bloomEffect || !this.debugBackground) return;

        const shineFilter = this.proceduralTextureManager?.getFilter();
        if (shineFilter) shineFilter.uniforms.u_debugMode = 0;
        
        this.visible = (mode !== 'background_only');
        this.debugBackground.visible = false;
        if(this.illuminationDebugSprite) this.illuminationDebugSprite.visible = false;
        this.effectContainer.visible = true;
        this.bloomEffect.container.visible = true;
        this.stableContentSprite.visible = true;
        this.worldMaskSprite.visible = true;
        this.effectContainer.mask = this.worldMaskSprite;
        this.blendMode = OVERLAY_CONFIG.baseShine.compositing.layerBlendMode;
        this.bloomEffect.container.blendMode = OVERLAY_CONFIG.bloom.compositing.bloomBlendMode;
        this.bloomEffect.container.alpha = OVERLAY_CONFIG.bloom.intensity;
        if (this.filters) this.filters.forEach(f => f.enabled = true); 
        Object.values(ScreenEffectsManager._filters).forEach(f => f.enabled = true);
        if (this.bloomEffect.container.filters) this.bloomEffect.container.filters.forEach(f => f.enabled = true);

        const disableAllPostFx = () => { 
            if (this.filters) this.filters.forEach(f => f.enabled = false); 
            Object.values(ScreenEffectsManager._filters).forEach(f => f.enabled = false); 
        };
        const showDebugTexture = (texture) => { 
            this.effectContainer.visible = false; 
            this.bloomEffect.container.visible = false; 
            this.debugBackground.visible = true; 
            disableAllPostFx(); 
            if (this.illuminationDebugSprite && this.illuminationDebugFilter) { 
                this.illuminationDebugFilter.uniforms.u_illuminationDebugTexture = texture; 
                this.illuminationDebugSprite.visible = true; 
            } 
        };

        const normalDebugModes = { 'normal_vectors': 1, 'light_vector': 2, 'view_vector': 3, 'halfway_vector': 4, 'specular_dot': 5, 'specular_influence': 6 };
        if (mode in normalDebugModes) {
            this.bloomEffect.container.visible = false; this.effectContainer.mask = null; this.blendMode = PIXI.BLEND_MODES.NORMAL; this.debugBackground.visible = true; disableAllPostFx();
            if (shineFilter) shineFilter.uniforms.u_debugMode = normalDebugModes[mode];
            return;
        }

        switch (mode) {
            case 'composite': break;
            case 'composite_no_bloom': this.bloomEffect.container.visible = false; break;
            case 'pattern_masked': this.bloomEffect.container.visible = false; this.blendMode = PIXI.BLEND_MODES.NORMAL; disableAllPostFx(); break;
            case 'pattern_pre_mask': this.effectContainer.mask = null; this.bloomEffect.container.visible = false; this.blendMode = PIXI.BLEND_MODES.NORMAL; this.debugBackground.visible = true; disableAllPostFx(); break;
            case 'specular_output': this.stableContentSprite.visible = false; this.effectContainer.mask = null; this.bloomEffect.container.visible = false; this.blendMode = PIXI.BLEND_MODES.NORMAL; disableAllPostFx(); break;
            case 'noise_map_output': showDebugTexture(this.noiseTextureManager.getTexture()); break;
            case 'normal_map_output': showDebugTexture(this.normalMapRenderTexture); break;
            case 'bloom_output': this.effectContainer.visible = false; this.bloomEffect.container.blendMode = PIXI.BLEND_MODES.NORMAL; this.bloomEffect.container.alpha = 1.0; disableAllPostFx(); break;
            case 'bloom_illumination_mask': case 'bloom_pre_blur': case 'bloom_pre_hotspot':
                this.effectContainer.visible = false;
                this.bloomEffect.container.blendMode = PIXI.BLEND_MODES.NORMAL;
                this.bloomEffect.container.alpha = 1.0;
                disableAllPostFx();
                if (this.bloomEffect.container.filters) {
                    this.bloomEffect.container.filters[1].enabled = (mode !== 'bloom_illumination_mask'); // thresholdFilter
                    this.bloomEffect.container.filters[2].enabled = false; // blurFilter
                    this.bloomEffect.container.filters[3].enabled = false; // bloomHotspotFilter
                }
                break;
            case 'illumination_map_live': showDebugTexture(this.illuminationDebugTexture); break;
        }
    }

    _updateIlluminationDebugTexture() {
        if (!this.illuminationDebugGraphics || !this.illuminationDebugTexture || !canvas.effects) return;
        const gfx = this.illuminationDebugGraphics, screen = canvas.app.screen, stage = canvas.stage, step = 20;
        gfx.clear();
        for (let y = 0; y < screen.height; y += step) {
            for (let x = 0; x < screen.width; x += step) {
                const worldPoint = stage.toLocal({ x: x + step / 2, y: y + step / 2 });
                const darkness = canvas.effects.getDarknessLevel({ x: worldPoint.x, y: worldPoint.y, elevation: 0 });
                const lightLevel = 1.0 - darkness;
                gfx.beginFill(PIXI.utils.rgb2hex([lightLevel, lightLevel, lightLevel])).drawRect(x, y, step, step);
            }
        }
        gfx.endFill();
        canvas.app.renderer.render(gfx, { renderTexture: this.illuminationDebugTexture, clear: true });
    }

    updateWorldSpriteTransform() {
        const sceneRect = canvas.scene.dimensions.sceneRect;
        if (isNaN(sceneRect.width) || sceneRect.width <= 0) return;
        if (this.worldMaskSprite?.texture.valid) {
            this.worldMaskSprite.position.set(sceneRect.x, sceneRect.y);
            this.worldMaskSprite.scale.set(sceneRect.width / this.worldMaskSprite.texture.baseTexture.width, sceneRect.height / this.worldMaskSprite.texture.baseTexture.height);
        }
        if (this.normalMapWorldSprite?.texture.valid) {
            this.normalMapWorldSprite.position.set(sceneRect.x, sceneRect.y);
            this.normalMapWorldSprite.scale.set(sceneRect.width / this.normalMapWorldSprite.texture.baseTexture.width, sceneRect.height / this.normalMapWorldSprite.texture.baseTexture.height);
        }
        this.bloomEffect?.updateWorldSpriteTransform();
    }

    updateStableSpriteTransform() {
        if (!canvas.stage) return;
        const stage = canvas.stage, screen = canvas.app.screen, topLeft = stage.toLocal({ x: 0, y: 0 }), width = screen.width / stage.scale.x, height = screen.height / stage.scale.y;
        if (this.stableContentSprite) { this.stableContentSprite.position.copyFrom(topLeft); this.stableContentSprite.width = width; this.stableContentSprite.height = height; }
        if (this.debugBackground) { this.debugBackground.position.copyFrom(topLeft); this.debugBackground.scale.set(1 / stage.scale.x, 1 / stage.scale.y); }
        if (this.illuminationDebugSprite) { this.illuminationDebugSprite.position.copyFrom(topLeft); this.illuminationDebugSprite.width = width; this.illuminationDebugSprite.height = height; }
        this.bloomEffect?.updateStableSpriteTransform();
    }
}

/**
 * ===================================================================================
 *  V. MATERIAL EDITOR UI (MaterialEditorDebugger)
 * ===================================================================================
 */

class MaterialEditorDebugger {
    constructor(layer) {
        this.layer = layer;
        this.element = null;
        this._boundUpdateIndicator = this._updateIndicator.bind(this);
        this._init();
    }

    destroy() {
        systemStatus.off('statusChanged', this._boundUpdateIndicator);
        this.element?.remove();
        this.element = null;
        console.log("Material Editor | UI destroyed.");
    }

    _init() {
        this.element = document.createElement('div');
        this.element.id = 'material-editor-debugger';
        document.body.appendChild(this.element);

        this.element.innerHTML = `
            <style>
                /* ================================================================== */
                /* CSS Custom Properties (Theme Variables)                            */
                /* ================================================================== */
                #material-editor-debugger {
                    /* Colors */
                    --panel-bg: #282c34;
                    --panel-bg-translucent: rgba(40, 44, 52, 0.97);
                    --column-bg: rgba(0, 0, 0, 0.2);
                    --control-bg: #21252b;
                    --border-dark: #1c1e22;
                    --border-light: #444851;
                    --text-primary: #abb2bf;
                    --text-secondary: #868e9c;
                    --text-value: #98c379; /* Green for values */
                    --accent-primary: #61afef; /* Blue for focus/selection */
                    --accent-danger: #e06c75; /* Red for delete button */

                    /* Status Colors */
                    --status-ok: #98c379;
                    --status-error: #e06c75;
                    --status-warning: #e5c07b;
                    --status-pending: #61afef;
                    --status-inactive: #5c6370;
                    --status-unknown: #5c6370;
                    
                    /* Sizing & Spacing */
                    --font-size-base: 12px;
                    --font-size-small: 11px;
                    --spacing-xs: 4px;
                    --spacing-s: 8px;
                    --spacing-m: 10px;
                    --spacing-l: 15px;
                    --border-radius: 6px;
                    --control-height: 28px;
                    
                    /* Transitions */
                    --transition-fast: 150ms ease-in-out;
                }
                
                /* ================================================================== */
                /* Main Panel & Layout                                                */
                /* ================================================================== */
                #material-editor-debugger {
                    position: fixed;
                    bottom: 50px;
                    right: 15px;
                    z-index: 10000;
                    background: var(--panel-bg-translucent);
                    color: var(--text-primary);
                    border: 1px solid var(--border-dark);
                    border-radius: var(--border-radius);
                    padding: var(--spacing-m);
                    font-family: 'Signika', sans-serif;
                    font-size: var(--font-size-base);
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-s);
                    width: 850px;
                    min-width: 600px;
                    max-width: 90vw;
                    height: 60vh;
                    min-height: 400px;
                    box-shadow: 0 5px 30px rgba(0,0,0,0.5);
                    backdrop-filter: blur(8px);
                    resize: both;
                    overflow: hidden;
                }
                
                #material-editor-debugger h3 {
                    margin: 0;
                    padding-bottom: var(--spacing-s);
                    text-align: center;
                    font-weight: bold;
                    letter-spacing: 1px;
                    color: var(--text-primary);
                    border-bottom: 1px solid var(--border-light);
                    cursor: move; /* Hint for dragging */
                    user-select: none;
                }
                
                #material-editor-debugger .top-bar,
                #material-editor-debugger .bottom-bar {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-s);
                    padding: var(--spacing-s);
                    background: var(--column-bg);
                    border-radius: var(--border-radius);
                }

                #material-editor-debugger .main-content-area {
                    display: flex;
                    gap: var(--spacing-m);
                    flex-grow: 1;
                    min-height: 0;
                }

                #material-editor-debugger .main-column {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--spacing-m);
                    background: var(--column-bg);
                    border: 1px solid var(--border-dark);
                    border-radius: var(--border-radius);
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-m);
                }
                
                /* ================================================================== */
                /* Custom Scrollbars                                                  */
                /* ================================================================== */
                #material-editor-debugger .main-column::-webkit-scrollbar {
                    width: 8px;
                }
                #material-editor-debugger .main-column::-webkit-scrollbar-track {
                    background: transparent;
                }
                #material-editor-debugger .main-column::-webkit-scrollbar-thumb {
                    background-color: var(--border-light);
                    border-radius: 4px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                #material-editor-debugger .main-column::-webkit-scrollbar-thumb:hover {
                    background-color: var(--status-inactive);
                }
                
                /* ================================================================== */
                /* Accordion (Details & Summary)                                      */
                /* ================================================================== */
                #material-editor-debugger details {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius);
                    transition: background-color var(--transition-fast);
                }
                #material-editor-debugger details[open] {
                    background: rgba(255,255,255,0.04);
                }
                #material-editor-debugger summary {
                    font-weight: bold;
                    cursor: pointer;
                    padding: var(--spacing-s);
                    list-style: none; /* Hide default marker */
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: var(--spacing-s);
                    user-select: none;
                }
                summary::-webkit-details-marker { display: none; }
                summary::before {
                    content: '?';
                    font-size: 9px;
                    margin-right: var(--spacing-s);
                    transform: rotate(0deg);
                    transition: transform var(--transition-fast);
                }
                details[open] > summary::before {
                    transform: rotate(90deg);
                }
                
                #material-editor-debugger details > div {
                    padding: var(--spacing-m);
                    padding-top: 0;
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-m);
                    border-top: 1px solid var(--border-light);
                }
                
                #material-editor-debugger .sub-header {
                    font-weight: bold;
                    background: rgba(0,0,0,0.2);
                    padding: var(--spacing-xs) var(--spacing-s);
                    margin: var(--spacing-s) calc(-1 * var(--spacing-s)) 0;
                    border-radius: var(--border-radius);
                    border-top: 1px solid var(--border-light);
                    border-bottom: 1px solid var(--border-light);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                /* ================================================================== */
                /* Controls (Inputs, Selects, Sliders, etc.)                        */
                /* ================================================================== */
                #material-editor-debugger .control-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: var(--spacing-m);
                }
                #material-editor-debugger .control-row label {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                    color: var(--text-secondary);
                }
                #material-editor-debugger .control-row .widget-group {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-xs);
                }

                /* General Input Styling */
                #material-editor-debugger input[type=text],
                #material-editor-debugger select,
                #material-editor-debugger button {
                    background: var(--control-bg);
                    color: var(--text-primary);
                    border: 1px solid var(--border-light);
                    border-radius: var(--border-radius);
                    padding: 0 var(--spacing-s);
                    height: var(--control-height);
                    font-family: inherit;
                    font-size: inherit;
                    transition: all var(--transition-fast);
                }
                #material-editor-debugger input:focus-visible,
                #material-editor-debugger select:focus-visible {
                    outline: none;
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 0 2px rgba(var(--accent-primary-rgb), 0.3);
                }

                /* Buttons */
                #material-editor-debugger button { cursor: pointer; }
                #material-editor-debugger button:hover { background: #3a3f49; }
                #material-editor-debugger button:active { background: #1c1e22; }
                #material-editor-debugger #profile-delete { color: var(--accent-danger); border-color: var(--accent-danger); }
                #material-editor-debugger #profile-delete:hover { background: rgba(224, 108, 117, 0.1); }
                
                /* Checkbox */
                #material-editor-debugger input[type=checkbox] {
                    height: 16px; width: 16px; margin: 0;
                    accent-color: var(--accent-primary);
                }
                
                /* Color Picker */
                #material-editor-debugger input[type=color] {
                    -webkit-appearance: none;
                    padding: 0;
                    border: 1px solid var(--border-light);
                    width: 100%; height: var(--control-height);
                    border-radius: var(--border-radius);
                    overflow: hidden;
                }
                #material-editor-debugger input[type=color]::-webkit-color-swatch-wrapper { padding: 0; }
                #material-editor-debugger input[type=color]::-webkit-color-swatch { border: none; }
                
                /* Select (Dropdown) */
                #material-editor-debugger select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='rgba(171, 178, 191, 0.7)' class='bi bi-chevron-down' viewBox='0 0 16 16'%3E%3Cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0.5rem center;
                    background-size: 1em;
                    padding-right: 2rem;
                }

                /* Range Slider */
                #material-editor-debugger input[type=range] {
                    -webkit-appearance: none; appearance: none;
                    width: 120px; background: transparent;
                }
                #material-editor-debugger input[type=range]::-webkit-slider-runnable-track {
                    height: 4px; background: var(--control-bg);
                    border-radius: 2px;
                }
                #material-editor-debugger input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 14px; width: 14px;
                    border-radius: 50%;
                    background: var(--text-secondary);
                    border: 2px solid var(--panel-bg);
                    margin-top: -5px;
                    transition: background-color var(--transition-fast);
                }
                #material-editor-debugger input[type=range]:hover::-webkit-slider-thumb { background: var(--accent-primary); }
                #material-editor-debugger input[type=range]:active::-webkit-slider-thumb { background: #fff; }

                #material-editor-debugger .control-row .live-value { width: 50px; text-align: left; color: var(--text-value); font-style: italic; font-size: var(--font-size-small); }
                #material-editor-debugger .control-row .value-span { width: 35px; text-align: right; color: var(--text-value); }

                /* ================================================================== */
                /* Status Indicators & Groups                                         */
                /* ================================================================== */
                #material-editor-debugger .top-bar-row { display: flex; gap: var(--spacing-l); align-items: center; }
                #material-editor-debugger .bottom-bar { display: flex; gap: var(--spacing-m); align-items: center; }
                #material-editor-debugger .bottom-bar input[type=text] { flex-grow: 1; }
                
                #material-editor-debugger .status-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-xs) var(--spacing-m);
                    border-left: 2px solid var(--border-light);
                    padding-left: var(--spacing-m);
                    align-items: center;
                }
                #material-editor-debugger .status-group-title { font-weight: bold; color: var(--text-secondary); }
                
                #material-editor-debugger .traffic-light {
                    width: 10px; height: 10px; border-radius: 50%; display: inline-block;
                    box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
                    border: 1px solid var(--border-dark);
                    flex-shrink: 0;
                    transition: all var(--transition-fast);
                }
                #material-editor-debugger .traffic-light.ok { background-color: var(--status-ok); }
                #material-editor-debugger .traffic-light.error { background-color: var(--status-error); }
                #material-editor-debugger .traffic-light.warning { background-color: var(--status-warning); }
                #material-editor-debugger .traffic-light.unknown { background-color: var(--status-unknown); }
                #material-editor-debugger .traffic-light.inactive, #material-editor-debugger .traffic-light.disabled { background: none; border: 1px dashed var(--status-inactive); box-shadow: none; }
                #material-editor-debugger .traffic-light.pending { background-color: var(--status-pending); animation: pulse 1.5s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 3px var(--status-pending); } 50% { opacity: 0.5; box-shadow: none; } }
            </style>
            <h3>Material Editor</h3>
            <div id="material-editor-top-bar" class="top-bar"></div>
            <div class="main-content-area">
                <div id="material-editor-col-1" class="main-column"></div>
                <div id="material-editor-col-2" class="main-column"></div>
            </div>
            <div id="material-editor-bottom-bar" class="bottom-bar"></div>
        `;
        this._buildTopBar();
        this._buildColumn1();
        this._buildColumn2();
        this._buildBottomBar();

        this.addEventListeners();
        this.updateAllControls();
        this._populateAllIndicators(); // Populate for the first time
        
        // Subscribe to future changes
        systemStatus.on('statusChanged', this._boundUpdateIndicator);
        
        console.log("Material Editor | UI initialized and subscribed to status updates.");
    }

    // --- UI Building Methods ---
    _buildTopBar() {
        const c = this.element.querySelector('#material-editor-top-bar');
        c.innerHTML = `
            <div class="top-bar-row">
                <div class="widget-group">
                    <input type="checkbox" id="global-enabled" data-path="enabled">
                    <label for="global-enabled">Enable All Effects</label>
                </div>
                <div class="control-row" style="flex-grow: 1;">
                    <label for="debug-view">Debug View</label>
                    <select name="debug-view" id="debug-view" style="width: 100%;">
                        <optgroup label="--- Composite & Layer Views ---"><option value="composite">1. Final Composite</option><option value="composite_no_bloom">2. Composite (No Bloom)</option><option value="background_only">3. Scene Background Only</option></optgroup>
                        <optgroup label="--- Base Shine Layer ---"><option value="pattern_masked">4. Masked Shine (Pre-Blend)</option><option value="pattern_pre_mask">5. Raw Shine Pattern (Pre-Mask)</option><option value="specular_output">6. Specular Map (as Mask)</option></optgroup>
                        <optgroup label="--- Normal Map Lighting ---"><option value="normal_map_output">7.0 Normal Map Texture</option><option value="normal_vectors">7.1 Normal Vectors (World)</option><option value="light_vector">7.2 Light Direction Vector</option><option value="view_vector">7.3 View Direction Vector</option><option value="halfway_vector">7.4 Blinn-Phong Halfway Vector</option><option value="specular_dot">7.5 N•H Dot Product (Raw)</option><option value="specular_influence">7.6 N•H^shininess (Final Influence)</option></optgroup>
                        <optgroup label="--- Other Maps & Buffers ---"><option value="noise_map_output">8. Noise Mask Output</option><option value="illumination_map_live">9. Live Illumination Map</option></optgroup>
                        <optgroup label="--- Bloom Analysis ---"><option value="bloom_output">10. Bloom Layer Only</option><option value="bloom_illumination_mask">11. Bloom (Illumination Mask)</option><option value="bloom_pre_blur">12. Bloom (Pre-Blur)</option><option value="bloom_pre_hotspot">13. Bloom (Pre-Hotspot)</option></optgroup>
                    </select>
                </div>
            </div>
            <div class="top-bar-row">
                <div class="status-group">
                    <span class="status-group-title">Deps:</span>
                    <div class="widget-group"><span id="status-dependencies-foundryLighting" class="traffic-light unknown"></span> Core</div>
                </div>
                <div class="status-group">
                    <span class="status-group-title">Shaders:</span>
                    <div class="widget-group"><span id="status-shaders-baseShine" class="traffic-light unknown"></span>Base</div>
                    <div class="widget-group"><span id="status-shaders-noise" class="traffic-light unknown"></span>Noise</div>
                    <div class="widget-group"><span id="status-shaders-bloom" class="traffic-light unknown"></span>Bloom</div>
                    <div class="widget-group"><span id="status-shaders-iridescence" class="traffic-light unknown"></span>Iridescence</div>
                    <div class="widget-group"><span id="status-shaders-postProcessing" class="traffic-light unknown"></span>PostFX</div>
                </div>
            </div>
        `;
    }

    _buildColumn1() {
        const c = this.element.querySelector('#material-editor-col-1');
        c.innerHTML += this._createAccordionHTML('baseShine', 'Base Shine & Reflection', `
            ${this._createTextureInputHTML('specular', 'Specular/Reflect Map')}
            <div class="sub-header">Pattern Generator</div>
            ${this._createSelectHTML('baseShine.patternType', 'Type', {'Procedural Stripes': 'stripes', 'Static Checkerboard': 'checkerboard'})}
            <div id="pattern-stripes-controls">
                ${this._createSliderHTML('baseShine.pattern.shared.patternScale', 'Pattern Scale', 0.1, 8, 0.1)}
                ${this._createSliderHTML('baseShine.pattern.shared.maxBrightness', 'Max Brightness', 0, 2, 0.01)}
                <details><summary>${this._createCheckboxHTML('baseShine.pattern.stripes1.enabled', 'Stripe Layer 1')}</summary><div>
                    ${this._createColorPickerHTML('baseShine.pattern.stripes1.tintColor', 'Tint')}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.intensity', 'Intensity', 0, 2, 0.05)}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.speed', 'Speed', -0.1, 0.1, 0.001)}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.angle', 'Angle', 0, 360, 1)}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.sharpness', 'Edge Falloff', 0.1, 8, 0.1)}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.bandDensity', 'Band Density', 1, 64, 0.5)}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.bandWidth', 'Band Width', 0.1, 1, 0.01)}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1)}
                    ${this._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5)}
                </div></details>
                <details><summary>${this._createCheckboxHTML('baseShine.pattern.stripes2.enabled', 'Stripe Layer 2')}</summary><div>
                    ${this._createColorPickerHTML('baseShine.pattern.stripes2.tintColor', 'Tint')}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.intensity', 'Intensity', 0, 2, 0.05)}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.speed', 'Speed', -0.1, 0.1, 0.001)}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.angle', 'Angle', 0, 360, 1)}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.sharpness', 'Edge Falloff', 0.1, 8, 0.1)}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.bandDensity', 'Band Density', 1, 64, 0.5)}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.bandWidth', 'Band Width', 0.1, 1, 0.01)}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1)}
                    ${this._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5)}
                </div></details>
            </div>
            <div id="pattern-checkerboard-controls">
                ${this._createSliderHTML('baseShine.pattern.checkerboard.gridSize', 'Grid Size', 2, 64, 1)}
                ${this._createSliderHTML('baseShine.pattern.checkerboard.brightness1', 'Brightness 1', 0, 1, 0.01)}
                ${this._createSliderHTML('baseShine.pattern.checkerboard.brightness2', 'Brightness 2', 0, 1, 0.01)}
            </div>
            ${this._createSubHeaderHTML('baseShine.noise.enabled', 'Noise Mask', 'pipelines-noiseToShine')}
            ${this._createSliderHTML('baseShine.noise.speed', 'Speed', -0.5, 0.5, 0.01)}
            ${this._createSliderHTML('baseShine.noise.scale', 'Scale', 0.1, 10, 0.1)}
            ${this._createSliderHTML('baseShine.noise.threshold', 'Threshold', 0, 1, 0.01)}
            ${this._createSliderHTML('baseShine.noise.brightness', 'Brightness', -1, 1, 0.01)}
            ${this._createSliderHTML('baseShine.noise.contrast', 'Contrast', 0, 5, 0.05)}
            ${this._createSliderHTML('baseShine.noise.softness', 'Softness', 0.01, 1, 0.01)}
        `);
        c.innerHTML += this._createAccordionHTML('iridescence', 'Iridescence', `
            ${this._createTextureInputHTML('iridescence', 'Iridescence Mask')}
            ${this._createSelectHTML('iridescence.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
            ${this._createSliderHTML('iridescence.intensity', 'Intensity', 0, 2, 0.05)}
            ${this._createSliderHTML('iridescence.speed', 'Anim Speed', 0, 0.2, 0.001)}
            ${this._createSliderHTML('iridescence.scale', 'Pattern Scale', 1, 32, 0.5)}
            ${this._createSliderHTML('iridescence.noiseAmount', 'Pattern Noise', 0, 1, 0.01)}
            ${this._createSubHeaderHTML('iridescence.parallax.enabled', 'Parallax')}
            ${this._createSliderHTML('iridescence.parallax.multiplier', 'Parallax Multiplier', 0, 2, 0.05)}
        `);
        c.innerHTML += this._createAccordionHTML('ambient', 'Ambient / Emissive', `
            ${this._createTextureInputHTML('ambient', 'Emissive Map')}
            ${this._createSelectHTML('ambient.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
            ${this._createSliderHTML('ambient.intensity', 'Intensity', 0, 5, 0.05)}
        `);
    }

    _buildColumn2() {
        const c = this.element.querySelector('#material-editor-col-2');
        c.innerHTML += this._createAccordionHTML('lighting', 'Normal Map', `
            ${this._createTextureInputHTML('normal', 'Normal Map')}
            ${this._createSliderHTML('lighting.strength', 'Normal Strength', 0, 4, 0.05, 'pipelines-normalToShine')}
            ${this._createSliderHTML('lighting.shininess', 'Shininess (Gloss)', 1, 256, 1)}
            ${this._createSliderHTML('lighting.height', 'Light Height', 10, 1000, 5)}
            ${this._createSubHeaderHTML('lighting.displacement.enabled', 'Displacement/Refraction')}
            ${this._createSliderHTML('lighting.displacement.strength', 'Displacement Strength', -2, 2, 0.01)}
        `);
        c.innerHTML += this._createAccordionHTML('bloom', 'Bloom & Glare', `
            ${this._createSliderHTML('bloom.intensity', 'Intensity', 0, 5, 0.05)}
            ${this._createSliderHTML('bloom.threshold', 'Threshold', 0, 1, 0.01)}
            ${this._createSliderHTML('bloom.blur', 'Blur', 0, 40, 0.5)}
            ${this._createSliderHTML('bloom.hotspot', 'Hotspot', 0, 1, 0.01)}
            ${this._createSubHeaderHTML('bloom.chromaticAberration.enabled', 'Chromatic Aberration (Bloom Only)')}
            ${this._createSliderHTML('bloom.chromaticAberration.amount', 'Amount', 0, 0.05, 0.001)}
            ${this._createSliderHTML('bloom.chromaticAberration.centerX', 'Center X', 0, 1, 0.01)}
            ${this._createSliderHTML('bloom.chromaticAberration.centerY', 'Center Y', 0, 1, 0.01)}
            <div class="sub-header">Scene Light Response</div>
            ${this._createSliderHTML('bloom.illuminationResponse.darknessThreshold', 'Lightness Threshold', 0, 1, 0.01, 'pipelines-illuminationToBloom')}
            ${this._createSliderHTML('bloom.illuminationResponse.suppressionFactor', 'Dark Area Suppression', 0, 1, 0.01)}
            <div class="sub-header">Compositing</div>
            ${this._createSelectHTML('baseShine.compositing.layerBlendMode', 'Shine Layer Blend', BLEND_MODE_OPTIONS, 'pipelines-colorationToShine')}
            ${this._createSelectHTML('bloom.compositing.bloomBlendMode', 'Bloom Layer Blend', BLEND_MODE_OPTIONS)}
            ${this._createSelectHTML('bloom.compositing.bloomSourceBlendMode', 'Bloom Source Blend', BLEND_MODE_OPTIONS)}
            <div class="sub-header">Quality</div>
            ${this._createSliderHTML('bloom.quality.samples', 'Quality Samples', 1, 20, 1)}
            ${this._createSliderHTML('bloom.quality.resolution', 'Resolution', 0.5, 4, 0.25)}
        `);
        c.innerHTML += this._createAccordionHTML('postProcessing', 'Camera & Lens Effects', `
            ${this._createSubHeaderHTML('postProcessing.colorCorrection.enabled', 'Color Correction')}
            ${this._createSliderHTML('postProcessing.colorCorrection.saturation', 'Saturation', 0, 10, 0.1)}
            ${this._createSliderHTML('postProcessing.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
            ${this._createSliderHTML('postProcessing.colorCorrection.contrast', 'Contrast', 0, 3, 0.05)}
            ${this._createSubHeaderHTML('postProcessing.vignette.enabled', 'Vignette')}
            ${this._createSliderHTML('postProcessing.vignette.amount', 'Amount', 0, 1, 0.01)}
            ${this._createSliderHTML('postProcessing.vignette.softness', 'Softness', 0.1, 1, 0.01)}
            ${this._createSubHeaderHTML('postProcessing.lensDistortion.enabled', 'Lens Distortion')}
            ${this._createSliderHTML('postProcessing.lensDistortion.amount', 'Amount', -1, 1, 0.01)}
            ${this._createSliderHTML('postProcessing.lensDistortion.centerX', 'Center X', 0, 1, 0.01)}
            ${this._createSliderHTML('postProcessing.lensDistortion.centerY', 'Center Y', 0, 1, 0.01)}
            ${this._createSubHeaderHTML('postProcessing.chromaticAberration.enabled', 'Chromatic Aberration (Global)')}
            ${this._createSliderHTML('postProcessing.chromaticAberration.amount', 'Amount', 0, 0.05, 0.001)}
            ${this._createSliderHTML('postProcessing.chromaticAberration.centerX', 'Center X', 0, 1, 0.01)}
            ${this._createSliderHTML('postProcessing.chromaticAberration.centerY', 'Center Y', 0, 1, 0.01)}
        `);
    }

    _buildBottomBar() {
        const c = this.element.querySelector('#material-editor-bottom-bar');
        c.innerHTML = `
            <input type="text" id="profile-name" placeholder="New Profile Name...">
            <button id="profile-save">Save</button>
            <select id="profiles-dropdown"></select>
            <button id="profile-load">Load</button>
            <button id="profile-delete">Delete</button>
        `;
    }

    // --- HTML Generation Helpers ---
    _createAccordionHTML(id, title, content) {
        const path = `${id}.enabled`;
        const checkboxId = `control-${id}-enabled`;
        const checkboxHTML = `<input type="checkbox" id="${checkboxId}" data-path="${path}">`;
        return `<details id="details-${id}" open>
                    <summary>
                        <label for="${checkboxId}">${title}</label>
                        ${checkboxHTML}
                    </summary>
                    <div>${content}</div>
                </details>`;
    }
    _createCheckboxHTML(path, label) { const id = `control-${path}`; return `<div class="control-row"><label for="${id}">${label}</label><div class="widget-group"><input type="checkbox" id="${id}" data-path="${path}"></div></div>`; }
    _createSubHeaderHTML(path, label, statusKey = null) { const id = `control-${path}`; const pipeHTML = statusKey ? `<span id="status-${statusKey.replace(/-/g,'.')}" class="traffic-light unknown"></span>` : ''; return `<div class="sub-header"><label for="${id}">${label}</label><div class="widget-group">${pipeHTML}<input type="checkbox" id="${id}" data-path="${path}"></div></div>`; }
    _createSliderHTML(path, label, min, max, step, statusKey = null) { const id = `control-${path}`; const pipeHTML = statusKey ? `<span id="status-${statusKey.replace(/-/g,'.')}" class="traffic-light unknown"></span>` : ''; return `<div class="control-row"><label for="${id}">${pipeHTML}${label}</label><div class="widget-group"><input type="range" id="${id}" data-path="${path}" min="${min}" max="${max}" step="${step}"><span id="${id}-value" class="value-span"></span><span id="${id}-live" class="live-value"></span></div></div>`; }
    _createSelectHTML(path, label, options, statusKey = null) { const id = `control-${path}`; const pipeHTML = statusKey ? `<span id="status-${statusKey.replace(/-/g,'.')}" class="traffic-light unknown"></span>` : ''; const opts = Object.entries(options).map(([k,v]) => `<option value="${v}">${k}</option>`).join(''); return `<div class="control-row"><label for="${id}">${pipeHTML}${label}</label><select id="${id}" data-path="${path}">${opts}</select></div>`; }
    _createColorPickerHTML(path, label) { const id = `control-${path}`; return `<div class="control-row"><label for="${id}">${label}</label><input type="color" id="${id}" data-path="${path}"></div>`; }
    _createTextureInputHTML(key, label) { return `<div class="control-row"><label><span id="status-textures-${key}" class="traffic-light unknown"></span>${label}</label><input type="text" id="texture-path-${key}" disabled></div>`; }

    // --- Event Handling ---
    addEventListeners() {
        this.element.addEventListener('input', this._handleGenericInput.bind(this));
        this.element.querySelector('#debug-view').addEventListener('change', e => this.layer.updateDebugView(e.target.value));
        this.element.querySelector('#profile-save').addEventListener('click', this._onSaveProfile.bind(this));
        this.element.querySelector('#profile-load').addEventListener('click', this._onLoadProfile.bind(this));
        this.element.querySelector('#profile-delete').addEventListener('click', this._onDeleteProfile.bind(this));
    }

    _handleGenericInput(e) {
        const path = e.target.dataset.path;
        if (!path) return;
        let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (e.target.type === 'range' || (e.target.tagName === 'SELECT' && !isNaN(Number(value)))) {
            value = Number(value);
        }
        foundry.utils.setProperty(OVERLAY_CONFIG, path, value);
        if (e.target.type === 'range') {
            const valueEl = this.element.querySelector(`#${e.target.id}-value`);
            if(valueEl) valueEl.textContent = Number(value).toFixed(e.target.step.split('.')[1]?.length || 0);
        }
        if (path === 'baseShine.patternType') {
            this._updatePatternControlVisibility();
        }
        this._triggerGlobalRefresh();
    }

    async _triggerGlobalRefresh() {
        for (const layer of canvas.layers) {
            if (typeof layer.updateFromConfig === 'function') {
                await layer.updateFromConfig(OVERLAY_CONFIG);
            }
        }
        this.updateAllControls();
    }

    // --- Control & UI State Update ---
    updateAllControls() {
        this.element.querySelectorAll('[data-path]').forEach(el => {
            const path = el.dataset.path;
            const value = foundry.utils.getProperty(OVERLAY_CONFIG, path);
            if (el.type === 'checkbox') el.checked = value;
            else el.value = value;
            if (el.type === 'range') {
                 const valueEl = this.element.querySelector(`#${el.id}-value`);
                 if(valueEl) valueEl.textContent = Number(value).toFixed(el.step.split('.')[1]?.length || 0);
            }
        });

        this.element.querySelector('#debug-view').value = this.layer.debugViewMode;
        this._updatePatternControlVisibility();

        this.element.querySelectorAll('details[id^="details-"]').forEach(details => {
            const key = details.id.replace('details-', '');
            const checkbox = details.querySelector(`input[id="control-${key}-enabled"]`);
            if (checkbox) details.classList.toggle('disabled-effect', !checkbox.checked);
        });
    }

    _updatePatternControlVisibility() {
        const isStripes = OVERLAY_CONFIG.baseShine.patternType === 'stripes';
        this.element.querySelector('#pattern-stripes-controls').style.display = isStripes ? '' : 'none';
        this.element.querySelector('#pattern-checkerboard-controls').style.display = isStripes ? 'none' : '';
    }

    _populateAllIndicators() {
        const allStatuses = systemStatus.getAllStatuses();
        for (const [category, statuses] of Object.entries(allStatuses)) {
            for (const [key, statusObject] of Object.entries(statuses)) {
                this._updateIndicator(category, key, statusObject);
            }
        }
    }

    _updateIndicator(category, key, statusObject) {
        const light = this.element.querySelector(`#status-${category}-${key}`);
        if (light) {
            light.className = `traffic-light ${statusObject.state}`;
            light.title = statusObject.message;
        }

        // Special handling for texture path inputs
        if (category === 'textures') {
            const pathInput = this.element.querySelector(`#texture-path-${key}`);
            if (pathInput) {
                // --- FIX START ---
                // The logic here now correctly maps the texture key ('specular', 'normal', etc.)
                // to the specific, and sometimes inconsistent, path within OVERLAY_CONFIG.
                let configPath;
                switch(key) {
                    case 'specular':
                        configPath = 'baseShine.specularTexturePath';
                        break;
                    case 'normal':
                        configPath = 'lighting.normalTexturePath';
                        break;
                    default:
                        // This handles 'ambient' and 'iridescence' which use a consistent naming scheme.
                        configPath = `${key}.texturePath`;
                }
                const path = foundry.utils.getProperty(OVERLAY_CONFIG, configPath) || "";
                pathInput.value = path || 'No map specified';
                // --- FIX END ---
            }
        }
    }
    
    updateLiveValues() {
        if (!this.element || !this.layer?.proceduralTextureManager?.getFilter()) return;
        const update = (path, val, f = 2) => {
            const el = this.element.querySelector(`#control-${path}-live`);
            if (el && val !== undefined) el.textContent = `(${val.toFixed(f)})`;
        };
        // Live value updates can be added here if needed in the future.
    }
    
    // --- Profile Management ---
    async _populateProfilesDropdown() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        const profiles = game.settings.get(MODULE_ID, PROFILES_SETTING) || {};
        const names = Object.keys(profiles).sort();
        dropdown.innerHTML = names.length ? names.map(n => `<option value="${n}">${n}</option>`).join('') : `<option disabled>No profiles saved</option>`;
    }

    async _onSaveProfile() {
        const name = this.element.querySelector('#profile-name').value.trim();
        if (!name) return ui.notifications.warn("Please enter a name for the profile.");
        const profiles = game.settings.get(MODULE_ID, PROFILES_SETTING) || {};
        profiles[name] = JSON.parse(JSON.stringify(OVERLAY_CONFIG));
        await game.settings.set(MODULE_ID, PROFILES_SETTING, profiles);
        ui.notifications.info(`Profile "${name}" saved!`);
        this.element.querySelector('#profile-name').value = '';
        this._populateProfilesDropdown();
    }

    async _onLoadProfile() {
        const name = this.element.querySelector('#profiles-dropdown').value;
        if (!name) return ui.notifications.warn("No profile selected to load.");
        const profiles = game.settings.get(MODULE_ID, PROFILES_SETTING);
        const loadedConfig = profiles[name];
        if (!loadedConfig) return ui.notifications.error(`Could not find profile data for "${name}".`);
        foundry.utils.mergeObject(OVERLAY_CONFIG, loadedConfig, { inplace: true, overwrite: true, recursive: true });
        await this._triggerGlobalRefresh();
        ui.notifications.info(`Profile "${name}" loaded.`);
    }

    async _onDeleteProfile() {
        const name = this.element.querySelector('#profiles-dropdown').value;
        if (!name) return ui.notifications.warn("No profile selected to delete.");
        const confirmed = await Dialog.confirm({ title: "Delete Profile", content: `<p>Are you sure you want to delete the profile "<strong>${name}</strong>"?</p>`, defaultYes: false });
        if (!confirmed) return;
        const profiles = game.settings.get(MODULE_ID, PROFILES_SETTING);
        if (profiles[name]) {
            delete profiles[name];
            await game.settings.set(MODULE_ID, PROFILES_SETTING, profiles);
            ui.notifications.info(`Profile "${name}" deleted.`);
            this._populateProfilesDropdown();
        }
    }
}

/**
 * ===================================================================================
 *  VI. FOUNDRY VTT HOOKS & INITIALIZATION
 * ===================================================================================
 */

Hooks.once('init', () => {
    // Register the custom canvas layers in their intended drawing order
    Object.assign(CONFIG.Canvas.layers, {
        iridescence: {
            layerClass: IridescenceLayer,
            group: "primary"
        },
        metallicShine: {
            layerClass: MetallicShineLayer,
            group: "primary"
        },
        ambient: {
            layerClass: AmbientLayer,
            group: "interface"
        }
    });
    console.log("MaterialToolkit | Registered custom canvas layers: Iridescence, MetallicShine, Ambient.");

    // Register the world setting for storing profiles
    game.settings.register(MODULE_ID, PROFILES_SETTING, {
        name: "Material Effect Profiles",
        hint: "Stores saved configurations for the material editor. Managed via the editor UI.",
        scope: "world",
        config: false, // Don't show in the main settings menu
        type: Object,
        default: {}
    });
    console.log(`MaterialToolkit | Registered world setting: ${MODULE_ID}.${PROFILES_SETTING}`);
});

Hooks.once('canvasReady', async () => {
    console.log("MaterialToolkit | Canvas is ready. Starting initialization sequence.");

    // Step 1: Discover textures and populate config
    const loader = new TextureAutoLoader();
    const textureMap = await loader.run();

    OVERLAY_CONFIG.baseShine.specularTexturePath = textureMap.specular || "";
    OVERLAY_CONFIG.ambient.texturePath = textureMap.ambient || "";
    OVERLAY_CONFIG.iridescence.texturePath = textureMap.iridescence || "";
    OVERLAY_CONFIG.lighting.normalTexturePath = textureMap.normal || "";
    
    // Step 2: Trigger a full refresh via the debugger UI
    const metallicShineLayer = canvas.layers.find(l => l instanceof MetallicShineLayer);
    if (metallicShineLayer?.debugger) {
        console.log("MaterialToolkit | Performing full state synchronization via debugger.");
        
        // This single call will now cascade through the entire system:
        // 1. Layers will call `updateFromConfig`.
        // 2. `updateFromConfig` will load textures and report status to SystemStatusManager.
        // 3. `SystemStatusManager` will evaluate pipelines based on the new statuses.
        // 4. Events emitted by the manager will be caught by the UI to update indicators.
        await metallicShineLayer.debugger._triggerGlobalRefresh();
        
        // Also populate the profiles dropdown for the first time
        metallicShineLayer.debugger._populateProfilesDropdown();
    } else {
        console.warn("MaterialToolkit | Could not find MetallicShineLayer or its debugger to perform final synchronization.");
    }
});
