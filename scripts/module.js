const MODULE_ID = 'map-shine';
const PROFILES_SETTING = 'profiles';
const DEFAULT_PROFILE_SETTING = 'defaultProfile';

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

    enabled: true,
    debug: true,

    baseShine: {
        enabled: true,
        specularTexturePath: "",
        patternType: 'stripes',

        compositing: {
            layerBlendMode: PIXI.BLEND_MODES.ADD,
        },
        animation: {
            globalIntensity: 3.0,

            hotspot: 0.75,
        },
        pattern: {
            shared: {
                patternScale: 0.2,
                maxBrightness: 0.9,
            },

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

            checkerboard: {
                gridSize: 8,
                brightness1: 0.15,
                brightness2: 0.05,
            },
        },

        noise: {
            enabled: true,
            speed: 0.005,
            scale: 2.5,
            threshold: 0.3,
            brightness: 0.15,
            contrast: 0.50,
            softness: 1.0
        },
    },

    iridescence: {
        enabled: true,
        texturePath: "",
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

    ambient: {
        enabled: true,
        texturePath: "",
        blendMode: PIXI.BLEND_MODES.ADD,
        intensity: 1.0
    },

    groundGlow: {
        enabled: false, // Disabled by default
        texturePath: "",
        blendMode: PIXI.BLEND_MODES.ADD,
        intensity: 1.0,
        luminanceThreshold: 0.25, // At what luminance value does the glow start?
        brightness: 1,
        saturation: 1,
        softness: 0.1 // How soft the transition from dark to light is
    },

    bloom: {
        enabled: true,
        intensity: 3.00,
        threshold: 0.10,
        blur: 13.0,
        hotspot: 0.80,
        compositing: {
            bloomBlendMode: PIXI.BLEND_MODES.ADD,
            bloomSourceBlendMode: PIXI.BLEND_MODES.ADD,
        },

        quality: {
            samples: 20,
            resolution: 4.0,
        },

        chromaticAberration: {
            enabled: false,
            amount: 0.005,
            centerX: 0.5,
            centerY: 0.5,
        },
    },

    postProcessing: {
        enabled: true,

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
            uniform int u_debugMode;

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

const SHINE_VERTEX_SHADER = `
    attribute vec2 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat3 projectionMatrix;
    uniform mat3 filterMatrix;

    varying vec2 vTextureCoord; // For sampling the world-space specular map
    varying vec2 vScreenCoord;  // For calculating the screen-space procedural pattern

    void main(void)
    {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
        // filterMatrix maps from screen space to the source sprite's space.
        // We use it here to get the coordinate on the final render target (the screen).
        vScreenCoord = (filterMatrix * vec3(aVertexPosition, 1.0)).xy;
    }
`;



class ShinePatternFilter extends PIXI.Filter {
    constructor(options) {
        // We go back to the default vertex shader.
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord; // This is now simply the screen/quad coordinate.

            // --- UNIFORMS (Simplified) ---
            // The uSampler is no longer the specular map, but a dummy texture (like PIXI.Texture.WHITE).
            // We've removed u_backgroundSampler as it was unused.
            uniform sampler2D uSampler;
            uniform sampler2D u_noiseMap;

            uniform float u_time;
            uniform vec2 u_camera_offset, u_view_size;

            // Primary controls
            uniform float u_globalIntensity;
            uniform float u_shared_maxBrightness;
            uniform float u_shared_patternScale;

            // Pattern specifics
            uniform bool u_noise_enabled;
            uniform bool u_s1_enabled, u_s2_enabled;
            uniform float u_s1_speed, u_s1_intensity, u_s1_angle_rad, u_s1_sharpness, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp;
            uniform float u_s2_speed, u_s2_intensity, u_s2_angle_rad, u_s2_sharpness, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp;
            
            // --- HELPERS (Unchanged) ---
            const float PI = 3.14159265359;
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float createStripeLayer(vec2 uv, float t, float angle, float density, float width, float sub_count, float sub_sharp, float sharp) {
                float p_perp=uv.x*cos(angle)+uv.y*sin(angle); float band_coord=p_perp*density;
                float band_id=floor(band_coord); float in_band_pos=fract(band_coord);
                if(in_band_pos>width)return 0.0;
                float r1=random(vec2(band_id)); float r2=random(vec2(band_id,r1)); float r3=random(vec2(r1,r2));
                float num_sub=2.0+r1*sub_count; float sub_stripe_s=1.0+r2*sub_sharp; float sub_stripe_b=0.5+r3*0.5;
                float sub_wave=(cos(in_band_pos*(num_sub/width)*2.0*PI+t)+1.0)*0.5;
                sub_wave=pow(sub_wave,sub_stripe_s)*sub_stripe_b;
                return sub_wave*pow(sin((in_band_pos/width)*PI),sharp);
            }

            // --- MAIN SHADER LOGIC (Simplified: Pattern Generation Only) ---
            void main() {
                // 1. Calculate the procedural shine pattern using screen coordinates.
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 pattern_uv = (world_coord / 80.0) * u_shared_patternScale;
                float pattern1 = u_s1_enabled ? createStripeLayer(pattern_uv, u_time*u_s1_speed, u_s1_angle_rad, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp, u_s1_sharpness) * u_s1_intensity : 0.0;
                float pattern2 = u_s2_enabled ? createStripeLayer(pattern_uv, u_time*u_s2_speed, u_s2_angle_rad, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp, u_s2_sharpness) * u_s2_intensity : 0.0;
                
                // Noise is also sampled using screen coordinates.
                float noise_mask = u_noise_enabled ? texture2D(u_noiseMap, vTextureCoord).r : 1.0; 
                float shineIntensity = max(pattern1, pattern2) * u_shared_maxBrightness * u_globalIntensity * noise_mask;

                // 2. Output the raw shine color. We use a fixed color (e.g., white) modulated by intensity.
                // The specular map's color will be applied later via the blend mode.
                vec3 final_rgb = vec3(1.0) * shineIntensity;
                
                // 3. The alpha is always 1.0. The mask will handle transparency.
                gl_FragColor = vec4(final_rgb, 1.0);
            }
        `, options);
    }
}

class ProceduralPatternLayer extends CanvasLayer {
    constructor() {
        super();
        this.renderTexture = null;
        this.sourceSprite = null;
        this.shinePatternFilter = null;
        this.noiseTextureManager = null; // Noise generation is part of this pass
        this._onAnimateBound = this._onAnimate.bind(this);
    }

    // This is the public texture other layers can use
    getPatternTexture() {
        return this.renderTexture;
    }

    async _draw(options) {
        // Make this layer invisible and non-interactive. It's just a compute layer.
        this.visible = false;
        this.interactive = false;
        
        const renderer = canvas.app.renderer;
        this.renderTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        
        this.noiseTextureManager = new NoiseTextureManager(renderer);

        // This sprite will cover the screen and have the filter applied.
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = renderer.screen.width;
        this.sourceSprite.height = renderer.screen.height;

        this._setupFilters();
        this.sourceSprite.filters = this.shinePatternFilter ? [this.shinePatternFilter] : [];

        await this.updateFromConfig(OVERLAY_CONFIG);
        canvas.app.ticker.add(this._onAnimateBound);
    }
    
    _setupFilters() {
        const renderer = canvas.app.renderer;
        const bs = OVERLAY_CONFIG.baseShine;
        const p = bs.pattern;
        const s1 = p.stripes1;
        const s2 = p.stripes2;

        const initialUniforms = {
            u_noiseMap: PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [renderer.screen.width, renderer.screen.height],
            u_globalIntensity: bs.animation.globalIntensity,
            // ... (all the other uniforms from the previous fix)
            u_shared_maxBrightness: p.shared.maxBrightness,
            u_shared_patternScale: p.shared.patternScale,
            u_noise_enabled: bs.noise.enabled,
            u_s1_enabled: s1.enabled,
            u_s1_speed: s1.speed,
            u_s1_intensity: s1.intensity,
            u_s1_angle_rad: s1.angle * (Math.PI / 180),
            u_s1_sharpness: s1.sharpness,
            u_s1_band_density: s1.bandDensity,
            u_s1_band_width: s1.bandWidth,
            u_s1_sub_stripe_max_count: s1.subStripeMaxCount,
            u_s1_sub_stripe_max_sharp: s1.subStripeMaxSharp,
            u_s2_enabled: s2.enabled,
            u_s2_speed: s2.speed,
            u_s2_intensity: s2.intensity,
            u_s2_angle_rad: s2.angle * (Math.PI / 180),
            u_s2_sharpness: s2.sharpness,
            u_s2_band_density: s2.bandDensity,
            u_s2_band_width: s2.bandWidth,
            u_s2_sub_stripe_max_count: s2.subStripeMaxCount,
            u_s2_sub_stripe_max_sharp: s2.subStripeMaxSharp,
        };
        
        try {
            this.shinePatternFilter = new ShinePatternFilter(initialUniforms);
            systemStatus.update('shaders', 'baseShine', { state: 'ok', message: 'Compiled successfully.' });
        } catch(err) {
            // ... error handling
        }
    }

    async _tearDown(options) {
        canvas.app.ticker.remove(this._onAnimateBound);
        this.renderTexture?.destroy(true);
        this.sourceSprite?.destroy();
        this.shinePatternFilter?.destroy();
        this.noiseTextureManager?.destroy();
    }

    async updateFromConfig(config) {
        if (!this.shinePatternFilter) return;
        this.noiseTextureManager?.updateFromConfig(config);
        
        // This is the same logic as the old ProceduralTextureManager's updateFromConfig
        const bs = config.baseShine;
        const p = bs.pattern;
        const s1 = p.stripes1;
        const s2 = p.stripes2;

        const uPattern = this.shinePatternFilter.uniforms;
        uPattern.u_globalIntensity = bs.animation.globalIntensity;
        // ... update all other uniforms ...
        uPattern.u_shared_maxBrightness = p.shared.maxBrightness;
        uPattern.u_shared_patternScale = p.shared.patternScale;
        uPattern.u_noise_enabled = bs.noise.enabled;
        uPattern.u_s1_enabled = s1.enabled;
        uPattern.u_s1_speed = s1.speed;
        uPattern.u_s1_intensity = s1.intensity;
        uPattern.u_s1_angle_rad = s1.angle * (Math.PI / 180);
        uPattern.u_s1_sharpness = s1.sharpness;
        uPattern.u_s1_band_density = s1.bandDensity;
        uPattern.u_s1_band_width = s1.bandWidth;
        uPattern.u_s1_sub_stripe_max_count = s1.subStripeMaxCount;
        uPattern.u_s1_sub_stripe_max_sharp = s1.subStripeMaxSharp;
        uPattern.u_s2_enabled = s2.enabled;
        uPattern.u_s2_speed = s2.speed;
        uPattern.u_s2_intensity = s2.intensity;
        uPattern.u_s2_angle_rad = s2.angle * (Math.PI / 180);
        uPattern.u_s2_sharpness = s2.sharpness;
        uPattern.u_s2_band_density = s2.bandDensity;
        uPattern.u_s2_band_width = s2.bandWidth;
        uPattern.u_s2_sub_stripe_max_count = s2.subStripeMaxCount;
        uPattern.u_s2_sub_stripe_max_sharp = s2.subStripeMaxSharp;
    }

    _onAnimate(deltaTime) {
        if (!this.shinePatternFilter) return;
        
        const renderer = canvas.app.renderer;
        this.noiseTextureManager.update(deltaTime, renderer);

        const uPattern = this.shinePatternFilter.uniforms;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });

        uPattern.u_time = (uPattern.u_time || 0) + deltaTime;
        uPattern.u_camera_offset = [topLeft.x, topLeft.y];
        uPattern.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        uPattern.u_noiseMap = this.noiseTextureManager.getTexture();
        
        // THE RENDER PASS
        renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
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
                ambient: { state: 'inactive', message: 'No path specified.' },
                iridescence: { state: 'inactive', message: 'No path specified.' },
                groundGlow: { state: 'inactive', message: 'No path specified.' }
            },
            pipelines: {
                noiseToShine: { state: 'inactive', message: 'Pipeline inactive.' },
            },
        };
    }

    static get instance() {
        if (!SystemStatusManager._instance) {
            new SystemStatusManager();
        }
        return SystemStatusManager._instance;
    }

    on(event, callback) {
        if (!this._callbacks[event]) {
            this._callbacks[event] = [];
        }
        this._callbacks[event].push(callback);
    }

    emit(event, ...args) {
        if (this._callbacks[event]) {
            this._callbacks[event].forEach(callback => callback(...args));
        }
    }

    update(category, key, statusObject) {
        if (this._state[category] && this._state[category][key]) {
            this._state[category][key] = statusObject;
            this.emit('statusChanged', category, key, statusObject);
        } else {
            console.warn(`SystemStatusManager | Attempted to update non-existent status: ${category}.${key}`);
        }
    }

    getStatus(category, key) {
        return this._state[category]?.[key] || { state: 'error', message: 'Status key not found.' };
    }

    getAllStatuses() {
        return this._state;
    }

    evaluatePipelines() {
        if (!OVERLAY_CONFIG.baseShine.noise.enabled) {
            this.update('pipelines', 'noiseToShine', { state: 'disabled', message: 'Noise mask is disabled by user.' });
        } else if (this.getStatus('shaders', 'noise').state !== 'ok') {
            this.update('pipelines', 'noiseToShine', { state: 'error', message: 'Pipeline broken: Noise shader failed to compile.' });
        } else {
            this.update('pipelines', 'noiseToShine', { state: 'ok', message: 'Pipeline active: Noise mask is modulating the shine pattern.' });
        }
    }
}

const systemStatus = new SystemStatusManager();

class TextureAutoLoader {
    static SUFFIX_MAP = {
        specular: "_Specular",
        ambient: "_Ambient",
        iridescence: "_Iridescence",
        groundGlow: "_GroundGlow"
    };

    constructor() {
        this.sceneDirectory = null;
        this.sceneFilename = null;
        this.sceneBaseName = null;
    }

    async run() {
        const textureMap = {};
        Object.keys(TextureAutoLoader.SUFFIX_MAP).forEach(key => textureMap[key] = '');

        if (!this._getSceneBackgroundInfo()) {
            console.warn("MapShine | Could not find scene background. Texture auto-discovery aborted.");
            return textureMap;
        }

        await this._scanAndMatchTextures(textureMap);
        console.log("MapShine | Texture Auto-Discovery Results:", textureMap);
        return textureMap;
    }

    _getSceneBackgroundInfo() {
        const bgSrc = canvas.scene?.background.src;
        if (!bgSrc) return false;
        const cleanPath = decodeURIComponent(bgSrc);
        const lastSlash = cleanPath.lastIndexOf('/');
        this.sceneDirectory = cleanPath.substring(0, lastSlash);
        this.sceneFilename = cleanPath.substring(lastSlash + 1);
        const lastDot = this.sceneFilename.lastIndexOf('.');
        this.sceneBaseName = this.sceneFilename.substring(0, lastDot);
        return true;
    }

    async _scanAndMatchTextures(textureMap) {
        let filesInDir = [];
        try {
            console.log(`MapShine | Scanning for textures in: "${this.sceneDirectory}"`);
            const source = game.settings.get("core", "noCanvas") ? "public" : "data";
            const browseResult = await FilePicker.browse(source, this.sceneDirectory);
            filesInDir = browseResult.files;
        } catch (e) {
            console.warn(`MapShine | Could not browse directory "${this.sceneDirectory}". It may not exist or permissions may be wrong.`, e);
            return;
        }

        for (const [key, suffix] of Object.entries(TextureAutoLoader.SUFFIX_MAP)) {
            const expectedPrefix = decodeURIComponent(this.sceneBaseName + suffix).toLowerCase();
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


class ProceduralTextureManager {
    constructor(renderer) {
        // --- THIS IS THE FIX ---
        // We now gather all necessary uniforms from the global config
        // and pass them to the filter's constructor. This ensures the filter
        // is created in a complete and valid state from the start.

        const bs = OVERLAY_CONFIG.baseShine;
        const p = bs.pattern;
        const s1 = p.stripes1;
        const s2 = p.stripes2;

        const initialUniforms = {
            u_noiseMap: PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [renderer.screen.width, renderer.screen.height],
            u_globalIntensity: bs.animation.globalIntensity,
            u_shared_maxBrightness: p.shared.maxBrightness,
            u_shared_patternScale: p.shared.patternScale,
            u_noise_enabled: bs.noise.enabled,
            u_s1_enabled: s1.enabled,
            u_s1_speed: s1.speed,
            u_s1_intensity: s1.intensity,
            u_s1_angle_rad: s1.angle * (Math.PI / 180),
            u_s1_sharpness: s1.sharpness,
            u_s1_band_density: s1.bandDensity,
            u_s1_band_width: s1.bandWidth,
            u_s1_sub_stripe_max_count: s1.subStripeMaxCount,
            u_s1_sub_stripe_max_sharp: s1.subStripeMaxSharp,
            u_s2_enabled: s2.enabled,
            u_s2_speed: s2.speed,
            u_s2_intensity: s2.intensity,
            u_s2_angle_rad: s2.angle * (Math.PI / 180),
            u_s2_sharpness: s2.sharpness,
            u_s2_band_density: s2.bandDensity,
            u_s2_band_width: s2.bandWidth,
            u_s2_sub_stripe_max_count: s2.subStripeMaxCount,
            u_s2_sub_stripe_max_sharp: s2.subStripeMaxSharp,
        };

        try {
            // Pass the complete uniform object to the constructor.
            this.shinePatternFilter = new ShinePatternFilter(initialUniforms);
            systemStatus.update('shaders', 'baseShine', { state: 'ok', message: 'Compiled successfully.' });
        } catch (err) {
            console.error("MapShine | Failed to compile ShinePatternFilter!", err);
            systemStatus.update('shaders', 'baseShine', { state: 'error', message: `Compilation failed: ${err.message}` });
            this.shinePatternFilter = null; // Ensure it's null on failure
        }
        
        // The rest of the PIXI object creation can proceed.
        // We use the already-created filter.
        this.renderTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.sourceSprite = new PIXI.Sprite();
        this.shineHotspotFilter = new ShineHotspotFilter({ hotspot: bs.animation.hotspot });

        // Apply filters if shinePatternFilter was created successfully
        this.sourceSprite.filters = this.shinePatternFilter ? [this.shinePatternFilter, this.shineHotspotFilter] : [this.shineHotspotFilter];
    }

    setSourceTexture(texture) {
        if (this.sourceSprite) {
            this.sourceSprite.texture = texture;
        }
    }

    resize(renderer) {
        if (this.renderTexture) {
            this.renderTexture.resize(renderer.screen.width, renderer.screen.height);
        }
    }

    updateFromConfig(config) {
        const bs = config.baseShine;
        const p = bs.pattern;
        const s1 = p.stripes1;
        const s2 = p.stripes2;

        const uPattern = this.shinePatternFilter.uniforms;
        uPattern.u_globalIntensity = bs.animation.globalIntensity;
        uPattern.u_shared_maxBrightness = p.shared.maxBrightness;
        uPattern.u_shared_patternScale = p.shared.patternScale;
        uPattern.u_noise_enabled = bs.noise.enabled;
        uPattern.u_s1_enabled = s1.enabled;
        uPattern.u_s1_speed = s1.speed;
        uPattern.u_s1_intensity = s1.intensity;
        uPattern.u_s1_angle_rad = s1.angle * (Math.PI / 180);
        uPattern.u_s1_sharpness = s1.sharpness;
        uPattern.u_s1_band_density = s1.bandDensity;
        uPattern.u_s1_band_width = s1.bandWidth;
        uPattern.u_s1_sub_stripe_max_count = s1.subStripeMaxCount;
        uPattern.u_s1_sub_stripe_max_sharp = s1.subStripeMaxSharp;
        uPattern.u_s2_enabled = s2.enabled;
        uPattern.u_s2_speed = s2.speed;
        uPattern.u_s2_intensity = s2.intensity;
        uPattern.u_s2_angle_rad = s2.angle * (Math.PI / 180);
        uPattern.u_s2_sharpness = s2.sharpness;
        uPattern.u_s2_band_density = s2.bandDensity;
        uPattern.u_s2_band_width = s2.bandWidth;
        uPattern.u_s2_sub_stripe_max_count = s2.subStripeMaxCount;
        uPattern.u_s2_sub_stripe_max_sharp = s2.subStripeMaxSharp;

        this.shineHotspotFilter.uniforms.u_hotspot = bs.animation.hotspot;
    }

    update(deltaTime, renderer, filterData) {
        if (!this.sourceSprite.texture?.valid || !filterData) {
            renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
            return;
        }

        const uPattern = this.shinePatternFilter.uniforms;
        uPattern.u_time = (uPattern.u_time || 0) + deltaTime;
        uPattern.u_camera_offset = filterData.camera_offset;
        uPattern.u_view_size = filterData.view_size;
        uPattern.u_noiseMap = filterData.noiseMap;

        // The internal sprite must always match the world transform to sample the specular map correctly.
        this.sourceSprite.transform.setFromMatrix(canvas.stage.worldTransform);
        
        renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
    }

    getTexture() {
        return this.renderTexture;
    }

    destroy() {
        this.renderTexture?.destroy(true);
        this.sourceSprite?.destroy();
        this.shinePatternFilter?.destroy();
        this.shineHotspotFilter?.destroy();
    }
}

class LuminanceKeyFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler; // The input texture (our colored shine)
            uniform float uThreshold;   // The brightness threshold to "punch out"

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                
                // Calculate the luminance of the incoming pixel.
                float brightness = dot(color.rgb, lum_weights);

                // If the brightness is below our threshold, make the pixel fully transparent.
                // We use smoothstep for a slightly softer edge than a hard "if".
                float final_alpha = smoothstep(uThreshold, uThreshold + 0.01, brightness);

                // Use the original color, but with the new calculated alpha.
                // This correctly produces a premultiplied alpha output for NORMAL blending.
                gl_FragColor = vec4(color.rgb * final_alpha, final_alpha);
            }
        `, {
            uThreshold: options.threshold ?? 0.01,
        });
    }
}

class ShineHotspotFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float u_hotspot;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);
            const vec3 white = vec3(1.0);

            void main(void) {
                if (u_hotspot >= 1.0) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }
                vec4 color = texture2D(uSampler, vTextureCoord);
                float brightness = dot(color.rgb, lum_weights);
                
                float mix_factor = smoothstep(u_hotspot, 1.0, brightness);
                vec3 final_rgb = mix(color.rgb, white, mix_factor);

                gl_FragColor = vec4(final_rgb, color.a);
            }
        `, {
            u_hotspot: options.hotspot ?? 0.75
        });
    }

    get hotspot() { return this.uniforms.u_hotspot; }
    set hotspot(value) { this.uniforms.u_hotspot = value; }
}

class NoiseTextureManager {
    constructor(renderer) {
        const screen = renderer.screen;
        this.renderTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height, scaleMode: PIXI.SCALE_MODES.LINEAR });
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.filter = null; // Filter is created in updateFromConfig
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
    }
}

class BloomEffect {
    constructor(effectTexture, specularTexture) {
        this.container = new PIXI.Container();
        this.stableContentSprite = new PIXI.Sprite(effectTexture);
        this.worldMaskSprite = new PIXI.Sprite(specularTexture);
        this.thresholdFilter = null;
        this.blurFilter = null;
        this.bloomHotspotFilter = null;
        this.chromaticAberrationFilter = null;
        this._setupFilters();
        this._setupContainer();
    }

    _setupFilters() {
        let allOk = true;
        const errors = [];

        try { this.thresholdFilter = new ThresholdFilter(); } catch (e) { console.error("Failed to create ThresholdFilter", e); errors.push('Threshold'); allOk = false; }
        this.blurFilter = new PIXI.BlurFilter();
        try { this.bloomHotspotFilter = new BloomHotspotFilter(); } catch (e) { console.error("Failed to create BloomHotspotFilter", e); errors.push('BloomHotspot'); allOk = false; }
        try { this.chromaticAberrationFilter = new ChromaticAberrationFilter(); } catch (e) { console.error("Failed to create Bloom ChromaticAberrationFilter", e); errors.push('ChromaticAberration(Bloom)'); allOk = false; }

        systemStatus.update('shaders', 'bloom', {
            state: allOk ? 'ok' : 'error',
            message: allOk ? 'Compiled successfully.' : `One or more bloom shaders failed to compile: ${errors.join(', ')}`
        });
    }

    _setupContainer() {
        this.container.addChild(this.stableContentSprite);
        this.container.mask = this.worldMaskSprite;
        this.container.addChild(this.worldMaskSprite);

        this.container.filters = [
            this.chromaticAberrationFilter,
            this.thresholdFilter,
            this.blurFilter,
            this.bloomHotspotFilter
        ].filter(f => f);
    }

    async updateFromConfig(config) {
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
        this._onCanvasPanBound = this._onResize.bind(this);
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

class LuminanceMaskFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler; // This will be the illumination buffer
            uniform float uLuminanceThreshold;
            uniform float uSoftness;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 lightingColor = texture2D(uSampler, vTextureCoord);
                float lightLevel = dot(lightingColor.rgb, lum_weights);
                
                // --- THE FIX ---
                // We REMOVE the "1.0 -" from the original line.
                // This creates a mask that is WHITE in the LIGHT and BLACK in the DARK.
                // The PIXI mask system will then correctly reveal the glow only where this mask is white.
                // Wait, that's backwards. Let's re-invert it.
                float maskAlpha = 1.0 - smoothstep(uLuminanceThreshold, uLuminanceThreshold + uSoftness, lightLevel);

                // Output the final correct mask value.
                gl_FragColor = vec4(maskAlpha, maskAlpha, maskAlpha, maskAlpha);
            }
        `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uLuminanceThreshold: options.luminanceThreshold ?? 0.25,
            uSoftness: options.softness ?? 0.1,
        });
    }
}

class MaskGenerator {
    constructor() {
        const screen = canvas.app.screen;
        // The texture we will draw our stable mask into.
        this.renderTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });

        // The filter that converts the illumination buffer to a B&W mask.
        this.maskFilter = new LuminanceMaskFilter();
        
        // A simple sprite to draw the illumination buffer onto our render texture.
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.sourceSprite.filters = [this.maskFilter];
    }

    update(renderer, illuminationTexture, threshold, softness) {
        if (!this.sourceSprite || !illuminationTexture) return;

        // Point our sprite to the latest illumination texture.
        this.sourceSprite.texture = illuminationTexture;

        // Update the filter's settings.
        this.maskFilter.uniforms.uLuminanceThreshold = threshold;
        this.maskFilter.uniforms.uSoftness = softness;

        // PASS 1: Render the filtered illumination buffer to our internal texture.
        renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
    }
    
    getMaskTexture() {
        return this.renderTexture;
    }

    resize(width, height) {
        this.renderTexture.resize(width, height);
        this.sourceSprite.width = width;
        this.sourceSprite.height = height;
    }

    destroy() {
        this.renderTexture?.destroy(true);
        this.maskFilter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture = this.maskFilter = this.sourceSprite = null;
    }
}



class GroundGlowLayer extends CanvasLayer {
    constructor() {
        super();
        this.glowSprite = null;
        this.maskSprite = null;
        this.maskGenerator = null;
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
    }

    async _draw(options) {
        console.log("GroundGlowLayer | Drawing layer using two-pass technique.");

        this.maskGenerator = new MaskGenerator();

        this.glowSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.glowSprite.filters = [new PIXI.ColorMatrixFilter()];
        this.addChild(this.glowSprite);

        // The maskSprite does NOT need to be added to the stage to work as a mask.
        // It just needs to exist and have its transform updated.
        this.maskSprite = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
        
        // This is the correct way to apply the mask.
        this.glowSprite.mask = this.maskSprite;
        
        await this.updateFromConfig(OVERLAY_CONFIG);

        this._onResize();
        Hooks.on('canvasPan', this._onResizeBound);
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound, this);
    }

    async _tearDown(options) {
        console.log("GroundGlowLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound, this);
        Hooks.off('canvasPan', this._onResizeBound);
        window.removeEventListener('resize', this._onResizeBound);
        
        this.maskGenerator?.destroy();
        // The glowSprite is the only child, so destroying it is sufficient.
        this.glowSprite?.destroy({ children: true, texture: true });
        // The maskSprite is not a child, so we must destroy it manually.
        this.maskSprite?.destroy();

        this.maskGenerator = this.glowSprite = this.maskSprite = null;
        return super._tearDown(options);
    }
    
    _onAnimate() {
        const ggConfig = OVERLAY_CONFIG.groundGlow;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        
        if (!this.visible || !this.maskGenerator || !illuminationAPI) return;

        this.maskGenerator.update(
            canvas.app.renderer,
            illuminationAPI.getLightingTexture(),
            ggConfig.luminanceThreshold,
            ggConfig.softness
        );
    }

    async updateFromConfig(config) {
        if (!this.glowSprite) return;

        const ggConfig = config.groundGlow;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        
        this.visible = config.enabled && ggConfig.enabled && !!illuminationAPI;
        if (!this.visible) return;

        this.glowSprite.blendMode = ggConfig.blendMode;
        this.glowSprite.alpha = ggConfig.intensity;

        // Update color matrix filter for brightness and saturation
        const colorMatrix = this.glowSprite.filters?.find(f => f instanceof PIXI.ColorMatrixFilter);
        if (colorMatrix) {
            colorMatrix.brightness(ggConfig.brightness, false);
            colorMatrix.saturate(ggConfig.saturation - 1, false); // Saturate is additive from -1 to 1
        }

        const path = ggConfig.texturePath;
        const currentPath = this.glowSprite.texture?.baseTexture?.resource?.src;
        if (path && path !== currentPath) {
            try {
                const texture = await loadTexture(path);
                this.glowSprite.texture = texture;
                this.updateSpriteTransforms(); 
            } catch (e) {
                console.error(`GroundGlowLayer | Failed to load texture: ${path}`, e);
                this.glowSprite.texture = PIXI.Texture.EMPTY;
            }
        } else if (!path) {
            this.glowSprite.texture = PIXI.Texture.EMPTY;
        }
    }

    _onResize() {
        this.maskGenerator?.resize(canvas.app.screen.width, canvas.app.screen.height);
        this.updateSpriteTransforms();
    }
    
    updateSpriteTransforms() {
        // --- Glow Sprite Transform (World Space) ---
        if (this.glowSprite?.texture.valid) {
            const sceneRect = canvas.scene.dimensions.sceneRect;
            if (!isNaN(sceneRect.width) && sceneRect.width > 0) {
                this.glowSprite.position.set(sceneRect.x, sceneRect.y);
                this.glowSprite.scale.set(
                    sceneRect.width / this.glowSprite.texture.baseTexture.width,
                    sceneRect.height / this.glowSprite.texture.baseTexture.height
                );
            }
        }

        // --- Mask Sprite Transform (THE FINAL FIX) ---
        // We need to sync the mask's transform with the canvas stage itself.
        if (this.maskSprite) {
            // The maskSprite's transform should be identical to the main canvas stage transform.
            this.maskSprite.transform.setFromMatrix(canvas.stage.worldTransform);
        }
    }
}


class MetallicShineFilter extends PIXI.Filter {
    constructor(options) {
        // --- NEW CUSTOM VERTEX SHADER ---
        const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat3 projectionMatrix;

            varying vec2 vTextureCoord; // For sampling the world-space specular map
            varying vec2 vScreenCoord;  // For sampling the screen-space shine pattern

            void main(void)
            {
                // Standard PIXI vertex position calculation
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

                // Pass the specular map's UV coordinate to the fragment shader
                vTextureCoord = aTextureCoord;

                // --- THE FIX ---
                // Calculate screen-space UVs from the clip-space gl_Position.
                // Clip space goes from -1.0 to 1.0. We need to map it to 0.0 to 1.0 for texture sampling.
                // (gl_Position.xy * 0.5) + 0.5 maps [-1, 1] to [0, 1].
                // We do NOT flip the Y here because PIXI's projection matrix and render-to-texture
                // system already align everything correctly when using this method.
                vScreenCoord = (gl_Position.xy * 0.5) + 0.5;
            }
        `;

        // --- UPDATED FRAGMENT SHADER ---
        const fragmentSrc = `
            precision mediump float;
            
            // These are now passed from our custom vertex shader
            varying vec2 vTextureCoord; // UV for the specular map
            varying vec2 vScreenCoord;  // UV for the screen-space shine pattern

            // Uniforms (uScreenSize is no longer needed)
            uniform sampler2D uSampler;
            uniform sampler2D uShinePatternMap;
            uniform float uBoost;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                // 1. Sample the specular map.
                vec4 specularColor = texture2D(uSampler, vTextureCoord);

                // 2. Mask based on specular map luminance.
                float specularLuminance = dot(specularColor.rgb, lum_weights);
                if (specularColor.a < 0.1 || specularLuminance < 0.01) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                // 3. --- THE FIX ---
                // Sample the procedural shine intensity using the varying passed from the vertex shader.
                // This is more reliable than using gl_FragCoord.
                float shineIntensity = texture2D(uShinePatternMap, vScreenCoord).r;

                // 4. Calculate the final boosted and masked color.
                vec3 finalColor = specularColor.rgb * shineIntensity * uBoost;

                // 5. Output the final color with correct alpha for transparency.
                gl_FragColor = vec4(finalColor, shineIntensity);
            }
        `;

        super(vertexSrc, fragmentSrc, {
            uShinePatternMap: options.shinePatternTexture,
            uBoost: options.boost ?? 1.0,
        });
    }
}



class MetallicShineLayer extends CanvasLayer {
    constructor() {
        super();
        
        // This layer now contains a single sprite for the shine effect.
        this.shineSprite = null;
        this.shineFilter = null;
        
        // Other effects can be re-integrated later.
        this.bloomEffect = null; 
        this.debugger = null;

        // Bindings
        this._onResizeBound = this._onResize.bind(this);
        this._onAnimateBound = this._onAnimate.bind(this);
    }

    async _draw(options) {
        console.log("MetallicShineLayer | Drawing with new simplified sprite-based method.");

        // Find the layer that generates our shine pattern.
        const patternLayer = canvas.layers.find(l => l instanceof ProceduralPatternLayer);
        if (!patternLayer) {
            console.error("MapShine | CRITICAL: ProceduralPatternLayer not found! Metallic shine cannot function.");
            return;
        }
        const patternTexture = patternLayer.getPatternTexture();

        // Create the sprite that will display our effect. It starts with an empty texture.
        this.shineSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.addChild(this.shineSprite);

        // Create and apply our new, simple filter.
        try {
            const renderer = canvas.app.renderer;
            this.shineFilter = new MetallicShineFilter({
                shinePatternTexture: patternTexture,
                boost: OVERLAY_CONFIG.baseShine.animation.globalIntensity,
                screenSize: [renderer.screen.width, renderer.screen.height],
            });
            this.shineSprite.filters = [this.shineFilter];
            systemStatus.update('shaders', 'baseShine', { state: 'ok', message: 'Compiled successfully.' });
        } catch(e) {
            console.error("MapShine | Failed to create MetallicShineFilter", e);
            systemStatus.update('shaders', 'baseShine', { state: 'error', message: `Compilation failed: ${e.message}` });
        }

        // We will re-add bloom later. For now, it's disabled to keep things simple.
        // this.bloomEffect = new BloomEffect(...)

        // --- PostFX and Debugger setup can remain for future steps ---
        ScreenEffectsManager.initialize(canvas.app.stage);
        this._setupPostProcessingFilters();

        if (OVERLAY_CONFIG.debug) {
            this.debugger = new MaterialEditorDebugger(this);
            // ... (debugger setup)
        }
        
        // Initial update from config to load textures etc.
        await this.updateFromConfig(OVERLAY_CONFIG);

        // Add hooks
        window.addEventListener('resize', this._onResizeBound);
        Hooks.on('canvasPan', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
    }
    
    _setupPostProcessingFilters() {
        // This method remains the same for now.
        const ppErrors = [];
        try { ScreenEffectsManager.addFilter('vignette', new VignetteFilter()); } catch (e) { ppErrors.push('Vignette'); }
        try { ScreenEffectsManager.addFilter('lensDistortion', new LensDistortionFilter()); } catch (e) { ppErrors.push('LensDistortion'); }
        try { ScreenEffectsManager.addFilter('chromaticAberration', new ChromaticAberrationFilter()); } catch (e) { ppErrors.push('ChromaticAberration'); }
        try { ScreenEffectsManager.addFilter('colorCorrection', new ColorCorrectionFilter()); } catch (e) { ppErrors.push('ColorCorrection'); }
        systemStatus.update('shaders', 'postProcessing', { state: ppErrors.length === 0 ? 'ok' : 'error', message: ppErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${ppErrors.join(', ')}` });
    }

    async updateFromConfig(config) {
        const bs = config.baseShine;
        this.visible = config.enabled && bs.enabled;
        if (!this.visible) return;

        // Set the layer's blend mode from the config.
        this.blendMode = bs.compositing.layerBlendMode;

        // Update the filter's uniforms
        if (this.shineFilter) {
            this.shineFilter.uniforms.uBoost = bs.animation.globalIntensity;
        }

        // Load the specular texture for our sprite
        const path = bs.specularTexturePath;
        const currentPath = this.shineSprite.texture?.baseTexture?.resource?.src;

        if (path && path !== currentPath) {
            try {
                systemStatus.update('textures', 'specular', { state: 'pending', message: `Loading: ${path}` });
                const texture = await loadTexture(path);
                if (texture?.valid) {
                    this.shineSprite.texture = texture;
                    this.updateWorldSpriteTransform();
                    systemStatus.update('textures', 'specular', { state: 'ok', message: 'Loaded successfully.' });
                } else { throw new Error("Texture invalid or could not be decoded."); }
            } catch (e) {
                console.error(`MetallicShineLayer | Failed to load specular texture: ${path}`, e);
                this.shineSprite.texture = PIXI.Texture.EMPTY;
                systemStatus.update('textures', 'specular', { state: 'error', message: `File not found or invalid: ${path}` });
            }
        } else if (!path) {
            this.shineSprite.texture = PIXI.Texture.EMPTY;
            systemStatus.update('textures', 'specular', { state: 'inactive', message: 'No path specified.' });
        }
        
        ScreenEffectsManager.updateAllFiltersFromConfig(config);
    }
    
    _onAnimate(deltaTime) {
        if (!this.visible || !this.shineFilter) return;
        
        // We need to update the screen size uniform in case of resize.
        // A better place is _onResize, but this is a safe fallback.
        const renderer = canvas.app.renderer;
        this.shineFilter.uniforms.uScreenSize = [renderer.screen.width, renderer.screen.height];
    }
    
    // This is a new helper method, similar to what AmbientLayer uses.
    updateWorldSpriteTransform() {
        if (!this.shineSprite?.texture.valid) return;
        const sceneRect = canvas.scene.dimensions.sceneRect;
        if (isNaN(sceneRect.width) || sceneRect.width <= 0) return;

        this.shineSprite.position.set(sceneRect.x, sceneRect.y);
        this.shineSprite.scale.set(
            sceneRect.width / this.shineSprite.texture.baseTexture.width,
            sceneRect.height / this.shineSprite.texture.baseTexture.height
        );
    }

    _onResize() {
        this.updateWorldSpriteTransform();
    }
    
    async _tearDown(options) {
        console.log("MetallicShineLayer | Tearing down layer.");
        ScreenEffectsManager.tearDown();
        
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);
        Hooks.off('canvasPan', this._onResizeBound);
        
        this.debugger?.destroy();
        
        // The layer automatically destroys its children (the sprite),
        // which in turn destroys the texture and filter.
        super._tearDown(options);

        // Clear references
        this.shineSprite = null;
        this.shineFilter = null;
        this.debugger = null;
    }

    updateDebugView(mode) {
        // This will need to be updated later to support the new, simpler pipeline.
        console.log(`Debug view set to: ${mode}.`);
    }
}



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
                #material-editor-debugger { position: fixed; bottom: 50px; right: 15px; z-index: 10000; background: rgba(40, 40, 40, 0.95); color: #fff; border: 1px solid #111; border-radius: 8px; padding: 10px; font-family: sans-serif; font-size: 12px; display: flex; flex-direction: column; gap: 8px; width: 850px; box-shadow: 0 0 25px rgba(0,0,0,0.7); max-height: calc(100vh - 100px); }
                #material-editor-debugger h3 { margin: 0 0 10px 0; text-align: center; border-bottom: 1px solid #555; padding-bottom: 8px; letter-spacing: 1px; font-weight: bold; cursor: move; }
                #material-editor-debugger details { background: rgba(255,255,255,0.05); border: 1px solid #555; border-radius: 4px; padding: 5px; margin-bottom: 8px; }
                #material-editor-debugger details[open] { background: rgba(255,255,255,0.08); }
                #material-editor-debugger summary { font-weight: bold; cursor: pointer; padding: 3px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
                #material-editor-debugger .traffic-light { width: 10px; height: 10px; border-radius: 50%; display: inline-block; box-shadow: 0 0 5px rgba(0,0,0,0.5); border: 1px solid #111; flex-shrink: 0; }
                #material-editor-debugger .traffic-light.ok { background-color: #4cfa40; }
                #material-editor-debugger .traffic-light.error { background-color: #fa4040; }
                #material-editor-debugger .traffic-light.warning { background-color: #f7a000; }
                #material-editor-debugger .traffic-light.unknown { background-color: #888; }
                #material-editor-debugger .traffic-light.inactive, #material-editor-debugger .traffic-light.disabled { background: none; border: 1px dashed #666; }
                #material-editor-debugger .traffic-light.pending { background-color: #40c4fa; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                #material-editor-debugger .control-row { display: flex; justify-content: space-between; align-items: center; }
                #material-editor-debugger .control-row label { flex-shrink: 0; margin-right: 10px; display: flex; align-items: center; gap: 5px;}
                #material-editor-debugger .control-row .widget-group { display: flex; align-items: center; gap: 5px; }
                #material-editor-debugger .control-row .value-span { width: 35px; text-align: right; }
                #material-editor-debugger input[type=range] { width: 150px; }
                #material-editor-debugger input[type=color] { width: 160px; height: 24px; border: 1px solid #555; padding: 2px; background: #333; }
                #material-editor-debugger input[type=checkbox] { height: 16px; width: 16px; margin: 0; }
                #material-editor-debugger .sub-header { font-weight: bold; background: rgba(0,0,0,0.2); padding: 4px; margin: 8px 0 4px -5px; border-radius: 3px; border-bottom: 1px solid #444; display: flex; align-items: center; justify-content: space-between; }
                #material-editor-debugger .main-content-area { display: flex; gap: 10px; flex-grow: 1; min-height: 0; }
                #material-editor-debugger .main-column { flex: 1; overflow-y: auto; padding: 5px; background: rgba(0,0,0,0.2); border: 1px solid #555; border-radius: 5px; }
                #material-editor-debugger .top-bar { flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; padding: 5px; background: rgba(0,0,0,0.2); border-radius: 5px; }
                #material-editor-debugger .top-bar-row { display: flex; gap: 15px; align-items: center; }
                #material-editor-debugger .status-group { display: flex; flex-wrap: wrap; gap: 5px 15px; border-left: 2px solid #555; padding-left: 10px; }
                #material-editor-debugger .status-group-title { font-weight: bold; color: #aaa; }
                /* Styles for Bottom Bar Layout */
                #material-editor-debugger .bottom-bar { flex-shrink: 0; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 5px; margin-top: 8px; border-top: 1px solid #555; }
                #material-editor-debugger .material-editor-bottom-bar-flex { display: flex; gap: 10px; align-items: flex-start; }
                #material-editor-debugger .bottom-bar-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
                #material-editor-debugger .bottom-bar-col3 { flex-basis: 250px; flex-grow: 0; flex-shrink: 0; }
                #material-editor-debugger .profile-controls { display: flex; flex-direction: column; gap: 5px; }
                #material-editor-debugger .profile-controls > * { box-sizing: border-box; }
                #material-editor-debugger .bottom-bar input[type=text] { flex-grow: 1; }
                #material-editor-debugger .bottom-bar button { padding: 4px 8px; }
            </style>
            <h3 id="material-editor-title">Material Editor</h3>
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
        this._makeDraggable();
        this._populateAllIndicators();

        systemStatus.on('statusChanged', this._boundUpdateIndicator);

        console.log("Material Editor | UI initialized and subscribed to status updates.");
    }

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
                    <optgroup label="--- Composite & Layer Views ---">
                        <option value="composite">1. Final Composite</option>
                        <option value="composite_no_bloom">2. Composite (No Bloom)</option>
                        <option value="background_only">3. Scene Background Only</option>
                    </optgroup>
                    <optgroup label="--- Base Shine Layer ---">
                        <option value="pattern_masked">4. Masked Shine (Pre-Blend)</option>
                        <option value="pattern_pre_mask">5. Raw Shine Pattern (Pre-Mask)</option>
                        <option value="specular_output">6. Specular Map (as Mask)</option>
                    </optgroup>
                    <optgroup label="--- Other Maps & Buffers ---">
                        <option value="noise_map_output">7. Noise Mask Output</option>
                        <!-- *** NEW DEBUG OPTION ADDED HERE *** -->
                        <option value="illumination_buffer_output">8. Illumination Buffer Output</option> 
                    </optgroup>
                    <optgroup label="--- Bloom Analysis ---">
                        <option value="bloom_output">9. Bloom Layer Only</option>
                        <option value="bloom_pre_blur">10. Bloom (Pre-Blur)</option>
                        <option value="bloom_pre_hotspot">11. Bloom (Pre-Hotspot)</option>
                    </optgroup>
                </select>
            </div>
        </div>            <div class="top-bar-row">
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
        c.innerHTML += this._createAccordionHTML('baseShine', 'Metallic Shine', `
            ${this._createTextureInputHTML('specular', 'Specular/Reflect Map')}
            <div class="sub-header">Pattern Generator</div>
            ${this._createSelectHTML('baseShine.patternType', 'Type', {'Procedural Stripes': 'stripes', 'Static Checkerboard': 'checkerboard'})}
            <div id="pattern-stripes-controls">
                ${this._createSliderHTML('baseShine.pattern.shared.patternScale', 'Pattern Scale', 0.1, 8, 0.1)}
                ${this._createSliderHTML('baseShine.pattern.shared.maxBrightness', 'Max Brightness', 0, 2, 0.01)}
                ${this._createSliderHTML('baseShine.animation.hotspot', 'Hotspot', 0, 1, 0.01)}
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
            <div id="pattern-noise-controls">
            ${this._createSubHeaderHTML('baseShine.noise.enabled', 'Noise Mask')}
            ${this._createSliderHTML('baseShine.noise.speed', 'Speed', -0.5, 0.5, 0.01)}
            ${this._createSliderHTML('baseShine.noise.scale', 'Scale', 0.1, 10, 0.1)}
            ${this._createSliderHTML('baseShine.noise.threshold', 'Threshold', 0, 1, 0.01)}
            ${this._createSliderHTML('baseShine.noise.brightness', 'Brightness', -1, 1, 0.01)}
            ${this._createSliderHTML('baseShine.noise.contrast', 'Contrast', 0, 5, 0.05)}
            ${this._createSliderHTML('baseShine.noise.softness', 'Softness', 0.01, 1, 0.01)}
            </div>
            <div id="bloom-controls">
            ${this._createSubHeaderHTML('baseShine.noise.enabled', 'Metallic Specific Bloom')}
            ${this._createSliderHTML('bloom.intensity', 'Intensity', 0, 5, 0.05)}
            ${this._createSliderHTML('bloom.threshold', 'Threshold', 0, 1, 0.01)}
            ${this._createSliderHTML('bloom.blur', 'Blur', 0, 40, 0.5)}
            ${this._createSliderHTML('bloom.hotspot', 'Hotspot', 0, 1, 0.01)}

            ${this._createSubHeaderHTML('bloom.chromaticAberration.enabled', 'Chromatic Aberration (Bloom Only)')}
            ${this._createSliderHTML('bloom.chromaticAberration.amount', 'Amount', 0, 0.05, 0.001)}
            ${this._createSliderHTML('bloom.chromaticAberration.centerX', 'Center X', 0, 1, 0.01)}
            ${this._createSliderHTML('bloom.chromaticAberration.centerY', 'Center Y', 0, 1, 0.01)}

            <div class="sub-header">Quality</div>
            ${this._createSliderHTML('bloom.quality.samples', 'Quality Samples', 1, 20, 1)}
            ${this._createSliderHTML('bloom.quality.resolution', 'Resolution', 0.5, 4, 0.25)}
            </div>
        `);
    }

    _buildColumn2() {
        const c = this.element.querySelector('#material-editor-col-2');


        c.innerHTML += this._createAccordionHTML('ambient', 'Ambient / Emissive', `
            ${this._createTextureInputHTML('ambient', 'Emissive Map')}
            ${this._createSelectHTML('ambient.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
            ${this._createSliderHTML('ambient.intensity', 'Intensity', 0, 5, 0.05)}
        `);

        c.innerHTML += this._createAccordionHTML('groundGlow', 'Glow in the Dark Effect (Requires Illumination Buffer)', `
            ${this._createTextureInputHTML('groundGlow', 'Glow in the Dark Texture')}
            ${this._createSelectHTML('groundGlow.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
            ${this._createSliderHTML('groundGlow.intensity', 'Intensity', 0, 5, 0.05)}
            ${this._createSliderHTML('groundGlow.luminanceThreshold', 'Luminance Threshold', 0, 1, 0.01)}
            ${this._createSliderHTML('groundGlow.softness', 'Edge Softness', 0.01, 1, 0.01)}
            ${this._createSliderHTML('groundGlow.saturation', 'Saturation', 0, 5, 0.05)}
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
    }

    _buildBottomBar() {
        const c = this.element.querySelector('#material-editor-bottom-bar');
        c.innerHTML = `
            <div class="material-editor-bottom-bar-flex">
                <div class="bottom-bar-col bottom-bar-col1">
                    ${this._createAccordionHTML('postProcessing', 'Post Processing', `
                        ${this._createSubHeaderHTML('postProcessing.colorCorrection.enabled', 'Color Correction')}
                        ${this._createSliderHTML('postProcessing.colorCorrection.saturation', 'Saturation', 0, 2, 0.01)}
                        ${this._createSliderHTML('postProcessing.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                        ${this._createSliderHTML('postProcessing.colorCorrection.contrast', 'Contrast', 0, 2, 0.01)}
                        ${this._createSubHeaderHTML('postProcessing.vignette.enabled', 'Vignette')}
                        ${this._createSliderHTML('postProcessing.vignette.amount', 'Amount', 0, 1, 0.01)}
                        ${this._createSliderHTML('postProcessing.vignette.softness', 'Softness', 0, 1, 0.01)}
                    `)}
                </div>
                <div class="bottom-bar-col bottom-bar-col2">
                    ${this._createAccordionHTML('lensDistortion', 'Lens Distortion', `
                        ${this._createSubHeaderHTML('postProcessing.lensDistortion.enabled', 'Enable')}
                        ${this._createSliderHTML('postProcessing.lensDistortion.amount', 'Amount', -0.5, 0.5, 0.01)}
                        ${this._createSliderHTML('postProcessing.lensDistortion.centerX', 'Center X', 0, 1, 0.01)}
                        ${this._createSliderHTML('postProcessing.lensDistortion.centerY', 'Center Y', 0, 1, 0.01)}
                    `)}
                    ${this._createAccordionHTML('chromaticAberration', 'Chromatic Aberration', `
                        ${this._createSubHeaderHTML('postProcessing.chromaticAberration.enabled', 'Enable')}
                        ${this._createSliderHTML('postProcessing.chromaticAberration.amount', 'Amount', 0, 0.05, 0.001)}
                        ${this._createSliderHTML('postProcessing.chromaticAberration.centerX', 'Center X', 0, 1, 0.01)}
                        ${this._createSliderHTML('postProcessing.chromaticAberration.centerY', 'Center Y', 0, 1, 0.01)}
                    `)}
                </div>
                <div class="bottom-bar-col bottom-bar-col3">
                    <details open>
                        <summary>Profile Management</summary>
                        <div class="profile-controls">
                            <input type="text" id="profile-name" placeholder="New Profile Name...">
                            <button id="profile-save">Save</button>
                            <select id="profiles-dropdown"></select>
                            <button id="profile-load">Load</button>
                            <button id="profile-set-default">Set as Default</button>
                            <button id="profile-delete" style="color: #ff8080;">Delete</button>
                        </div>
                    </details>
                </div>
            </div>
        `;
    }

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
    _createSliderHTML(path, label, min, max, step) { const id = `control-${path}`; return `<div class="control-row"><label for="${id}">${label}</label><div class="widget-group"><input type="range" id="${id}" data-path="${path}" min="${min}" max="${max}" step="${step}"><span id="${id}-value" class="value-span"></span></div></div>`; }
    _createSelectHTML(path, label, options) { const id = `control-${path}`; const opts = Object.entries(options).map(([k,v]) => `<option value="${v}">${k}</option>`).join(''); return `<div class="control-row"><label for="${id}">${label}</label><select id="${id}" data-path="${path}">${opts}</select></div>`; }
    _createColorPickerHTML(path, label) { const id = `control-${path}`; return `<div class="control-row"><label for="${id}">${label}</label><input type="color" id="${id}" data-path="${path}"></div>`; }
    _createTextureInputHTML(key, label) { return `<div class="control-row"><label><span id="status-textures-${key}" class="traffic-light unknown"></span>${label}</label><input type="text" id="texture-path-${key}" disabled></div>`; }

    addEventListeners() {
        this.element.addEventListener('input', this._handleGenericInput.bind(this));
        this.element.querySelector('#debug-view').addEventListener('change', e => this.layer.updateDebugView(e.target.value));
        this.element.querySelector('#profile-save').addEventListener('click', this._onSaveProfile.bind(this));
        this.element.querySelector('#profile-load').addEventListener('click', this._onLoadProfile.bind(this));
        this.element.querySelector('#profile-set-default').addEventListener('click', this._onSetDefaultProfile.bind(this));
        this.element.querySelector('#profile-delete').addEventListener('click', this._onDeleteProfile.bind(this));
    }

    _makeDraggable() {
        const elmnt = this.element;
        const title = elmnt.querySelector('#material-editor-title');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        const dragMouseDown = (e) => {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;

            const rect = elmnt.getBoundingClientRect();
            elmnt.style.right = 'auto';
            elmnt.style.bottom = 'auto';
            elmnt.style.top = rect.top + 'px';
            elmnt.style.left = rect.left + 'px';
        };

        const elementDrag = (e) => {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        };

        const closeDragElement = () => {
            document.onmouseup = null;
            document.onmousemove = null;
        };

        if (title) {
            title.onmousedown = dragMouseDown;
        }
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

        if (category === 'textures') {
            const pathInput = this.element.querySelector(`#texture-path-${key}`);
            if (pathInput) {
                let configPath;
                switch(key) {
                    case 'specular':
                        configPath = 'baseShine.specularTexturePath';
                        break;
case 'groundGlow':
                        configPath = 'groundGlow.texturePath';
                        break;
                    default:
                        configPath = `${key}.texturePath`;
                }
                const path = foundry.utils.getProperty(OVERLAY_CONFIG, configPath) || "";
                pathInput.value = path || 'No map specified';
            }
        }
    }

    async _populateProfilesDropdown() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        const profiles = game.settings.get(MODULE_ID, PROFILES_SETTING) || {};
        const names = Object.keys(profiles).sort();
        
        const defaultProfileName = game.settings.get(MODULE_ID, 'defaultProfile');

        if (names.length) {
            dropdown.innerHTML = names.map(n => {
                const isDefault = (n === defaultProfileName) ? ' (Default)' : '';
                return `<option value="${n}">${n}${isDefault}</option>`;
            }).join('');
            dropdown.value = defaultProfileName || names[0]; // Select the default if it exists
        } else {
            dropdown.innerHTML = `<option disabled>No profiles saved</option>`;
        }
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

    async _onSetDefaultProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        const name = dropdown.value;
        if (!name || dropdown.disabled) return ui.notifications.warn("No profile selected to set as default.");
        
        const DEFAULT_PROFILE_SETTING = 'defaultProfile'; // Consider making this a class or module constant
        await game.settings.set(MODULE_ID, DEFAULT_PROFILE_SETTING, name);
        ui.notifications.info(`Profile "${name}" has been set as the default.`);
        
        // Repopulate the dropdown to show the new (Default) marker
        this._populateProfilesDropdown();
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


Hooks.once('init', () => {
    // --- THE FIX ---
    // We must provide the class and group for Foundry to know how to draw the layers.
    Object.assign(CONFIG.Canvas.layers, {


        groundGlow: { // Add our new layer here
            layerClass: GroundGlowLayer,
            group: "interface"
        },

        proceduralPattern: {
            layerClass: ProceduralPatternLayer,
            group: "primary"
       },


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
    console.log("MaterialToolkit | Correctly registered custom canvas layers with their classes and groups.");

    game.settings.register(MODULE_ID, PROFILES_SETTING, {
        name: "Material Effect Profiles",
        hint: "Stores saved configurations for the material editor. Managed via the editor UI.",
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });

    game.settings.register(MODULE_ID, DEFAULT_PROFILE_SETTING, {
        name: "Default Material Profile Name",
        hint: "The name of the profile to automatically load on startup.",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });



    console.log(`MaterialToolkit | Registered world setting: ${MODULE_ID}.${PROFILES_SETTING}`);
});

Hooks.once('canvasReady', async () => {

    const DEFAULT_PROFILE_SETTING = 'defaultProfile';
    const defaultProfileName = game.settings.get(MODULE_ID, DEFAULT_PROFILE_SETTING);
    
    if (defaultProfileName) {
        console.log(`MaterialToolkit | Found default profile: "${defaultProfileName}". Attempting to load.`);
        const allProfiles = game.settings.get(MODULE_ID, PROFILES_SETTING);
        const profileData = allProfiles?.[defaultProfileName];

        if (profileData) {
            // Deeply merge the default profile into the running configuration
            foundry.utils.mergeObject(OVERLAY_CONFIG, profileData, {inplace: true, overwrite: true, recursive: true});
            console.log(`MaterialToolkit | Successfully loaded default profile "${defaultProfileName}".`);
        } else {
            console.warn(`MaterialToolkit | Default profile "${defaultProfileName}" not found in saved profiles. Reverting to standard defaults.`);
        }
    }


    console.log("MaterialToolkit | Canvas is ready. Auto-detecting textures.");
    const loader = new TextureAutoLoader();
    const discoveredTextures = await loader.run();

    // --- NEW: Patch the discovered textures into the config and update status ---
    for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
        const config = OVERLAY_CONFIG[key];
        if (config) {
            const foundPath = discoveredTextures[key];
            if (foundPath) {
                config.texturePath = foundPath;
                console.log(`MapShine | Patched ${key} texture to: ${foundPath}`);
                systemStatus.update('textures', key, { state: 'ok', message: `Found: ${foundPath.split('/').pop()}` });
            } else {
                systemStatus.update('textures', key, { state: 'warning', message: 'No matching texture file found.' });
            }
        }
    }

    console.log("MaterialToolkit | Texture auto-detection complete. Forcing layer and UI refresh.");

    // --- ADD THIS LOOP TO FIX THE TIMING ISSUE ---
    // This forces all layers to update with the new texture paths from the config.
    // The layers will then fire status updates, which the UI will catch and display.
    for (const layer of canvas.layers) {
        if (typeof layer.updateFromConfig === 'function') {
            await layer.updateFromConfig(OVERLAY_CONFIG);
        }
    }
    // --- END OF FIX ---
});
