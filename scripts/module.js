/******************************************************************************
 *
 *                            MAP SHINE TOOLKIT
 *
 *  The major objective of this module is to provide map makers with a range
 *  of new tools for producing highly specific visual effects.
 *
 *  Ultimately, all effects are designed to activate automatically when a
 *  correctly named texture is found. This means map makers only need to
 *  create the specific maps they want to enable the corresponding features.
 *
 *  I plan to continuously add new effects, filters, and texture overlays,
 *  with the goal of making this a powerful and flexible toolkit that can
 *  bring life and animation to scenes in new and unusual ways.
 *
 ******************************************************************************/

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

const CLIENT_OVERRIDES_CONFIG = {
    baseShine: {
        name: "Metallic Shine",
        path: 'baseShine',
        intensitySubPath: 'animation.globalIntensity'
    },
    dustMotes: {
        name: "Dust Motes",
        path: 'dustMotes',
        intensitySubPath: 'intensity'
    },
    cloudShadows: {
        name: "Cloud Shadows",
        path: 'cloudShadows',
        intensitySubPath: 'shadowIntensity'
    },
    iridescence: {
        name: "Iridescence",
        path: 'iridescence',
        intensitySubPath: 'intensity'
    },
    ambient: {
        name: "Ambient / Emissive",
        path: 'ambient',
        intensitySubPath: 'intensity'
    },
    groundGlow: {
        name: "Glow in the Dark",
        path: 'groundGlow',
        intensitySubPath: 'intensity'
    },
    heatDistortion: {
        name: "Heat Distortion",
        path: 'heatDistortion',
        intensitySubPath: 'intensity'
    },
    advancedBloom: {
        name: "Global Bloom",
        path: 'advancedBloom',
        intensitySubPath: 'brightness'
    },
    vignette: {
        name: "Post: Vignette",
        path: 'postProcessing.vignette',
        intensitySubPath: 'amount'
    },
    chromaticAberration: {
        name: "Post: Chromatic Aberration",
        path: 'postProcessing.chromaticAberration',
        intensitySubPath: 'amount'
    },
    postProcessing: {
        name: "Post Processing (Group)",
        path: 'postProcessing'
    }
};

class ClientOverrides {
    static apply(config) {
        for (const [key, data] of Object.entries(CLIENT_OVERRIDES_CONFIG)) {
            const enabledSetting = game.settings.get(MODULE_ID, `user-${key}-enabled`);
            if (enabledSetting === false) {
                foundry.utils.setProperty(config, `${data.path}.enabled`, false);
                continue;
            }

            if (data.intensitySubPath) {
                const intensitySetting = game.settings.get(MODULE_ID, `user-${key}-intensity`);
                if (intensitySetting !== 100) {
                    const fullIntensityPath = `${data.path}.${data.intensitySubPath}`;
                    const originalValue = foundry.utils.getProperty(config, fullIntensityPath);
                    if (typeof originalValue === 'number') {
                        const newValue = originalValue * (intensitySetting / 100);
                        foundry.utils.setProperty(config, fullIntensityPath, newValue);
                    }
                }
            }
        }

        // New global accessibility overrides
        const disableDistortion = game.settings.get(MODULE_ID, 'user-disable-distortion');
        if (disableDistortion) {
            if (config.heatDistortion) config.heatDistortion.enabled = false;
            if (config.postProcessing?.lensDistortion) config.postProcessing.lensDistortion.enabled = false;
        }

        const disableFringe = game.settings.get(MODULE_ID, 'user-disable-color-fringe');
        if (disableFringe) {
            if (config.baseShine?.rgbSplit) config.baseShine.rgbSplit.enabled = false;
            if (config.postProcessing?.chromaticAberration) config.postProcessing.chromaticAberration.enabled = false;
        }

        return config;
    }
}

const GRADIENT_PRESETS = {
    rainbow: {
        colors: ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000"]
    },
    "magma": {

        colors: ["#000000", "#3c1000", "#d23c02", "#f9c302", "#ffffff", "#f9c302", "#d23c02", "#3c1000", "#000000"]
    },
    "ice": {

        colors: ["#e3f8ff", "#a1d7ff", "#5d9fff", "#2a6bff", "#0041a7", "#2a6bff", "#5d9fff", "#a1d7ff", "#e3f8ff"]
    },
    "toxic": {

        colors: ["#4a004a", "#a400a4", "#00ff00", "#008300", "#000000", "#008300", "#00ff00", "#a400a4", "#4a004a"]
    },
    "sunset": {

        colors: ["#f9e075", "#f79e52", "#e25442", "#982c44", "#401b3b", "#982c44", "#e25442", "#f79e52", "#f9e075"]
    },
    "synthwave": {

        colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0", "#4361ee", "#3a0ca3", "#7209b7", "#f72585"]
    },
};

const OVERLAY_CONFIG = {

    enabled: true,
    debug: true,
    showTokenMask: false,
    tileOpacity: 0.0,

    baseShine: {
        enabled: true,
        specularTexturePath: "",
        patternType: 'stripes',

        compositing: {
            layerBlendMode: 1
        },
        animation: {
            globalIntensity: 2.0,
            hotspot: 0,
            updateFrequency: 2,
        },
        pattern: {
            shared: {
                patternScale: 0.22,
                maxBrightness: 0.5,
            },
            stripes1: {
                enabled: true,
                intensity: 2.0,
                speed: 0,
                tintColor: "#FFFFFF",
                angle: 50,
                sharpness: 8.0,
                bandDensity: 1.0,
                bandWidth: 1.0,
                subStripeMaxCount: 5.0,
                subStripeMaxSharp: 0.0
            },
            stripes2: {
                enabled: true,
                intensity: 2.0,
                speed: 0,
                tintColor: "#FFFFFF",
                angle: 44,
                sharpness: 8.0,
                bandDensity: 1.0,
                bandWidth: 1.0,
                subStripeMaxCount: 5.0,
                subStripeMaxSharp: 0.0
            },
            checkerboard: {
                gridSize: 8,
                brightness1: 0.15,
                brightness2: 0.05
            },
        },
        noise: {
            enabled: true,
            speed: -0.002,
            scale: 0.2,
            threshold: 0.2,
            brightness: -0.4,
            contrast: 0.15,
            softness: 1.0
        },
        shineBloom: {
            enabled: false,
            threshold: 0.41,
            brightness: 1.5,
            blur: 0,
            quality: 6
        },
        starburst: {
            enabled: false,
            blendMode: 1,
            threshold: 0.85,
            intensity: 0.5,
            angle: 18.0,
            points: 5,
            size: 80.0,
            falloff: 4.0
        },
        rgbSplit: {
            enabled: true,
            amount: 3.1
        },
    },

    dustMotes: {
        enabled: true,
        intensity: 2.0,
        shineInfluence: 2.5,
        maskBlur: 0,
        postBlur: {
            enabled: false,
            blurAmount: 1.0,
            quality: 2,
        },
        numLayers: 3,
        layers: [

            {
                tintColor: "#ffe89f",
                scale: 10.0,
                density: 0.2,
                size: 1.32,
                sizeRandomness: 1.0,
                twinkleSpeed: 0,
                drift: {
                    angle: 45.0,
                    speed: 0.004
                },
                turbulence: {
                    enabled: true,
                    speed: 0.006,
                    scale: 96.01,
                    magnitude: 0.78
                },
                visibility: {
                    cycleDuration: 0.0,
                    visibleFraction: 1.0,
                },
                aspect: {
                    width: 1.0,
                    height: 1.0,
                }
            },

            {
                tintColor: "#ffe077",
                scale: 4.9,
                density: 0.2,
                size: 1.05,
                sizeRandomness: 1.0,
                twinkleSpeed: 0.1,
                drift: {
                    angle: 227.0,
                    speed: 0.002
                },
                turbulence: {
                    enabled: false,
                    speed: 0.003,
                    scale: 101.01,
                    magnitude: 0.09
                },
                visibility: {
                    cycleDuration: 0.0,
                    visibleFraction: 1.0,
                },
                aspect: {
                    width: 1.0,
                    height: 1.0,
                }
            },

            {
                tintColor: "#ffd973",
                scale: 4.5,
                density: 0.5,
                size: 0.96,
                sizeRandomness: 1.0,
                twinkleSpeed: 0.15,
                drift: {
                    angle: 130.0,
                    speed: 0.005
                },
                turbulence: {
                    enabled: false,
                    speed: 0.008,
                    scale: 183.51,
                    magnitude: 0.26
                },
                visibility: {
                    cycleDuration: 0.0,
                    visibleFraction: 1.0
                },
                aspect: {
                    width: 1.01,
                    height: 1.01
                }
            },

            {
                tintColor: "#FFFFFF",
                scale: 4.3,
                density: 0.5,
                size: 0.69,
                sizeRandomness: 1.0,
                twinkleSpeed: 0.2,
                drift: {
                    angle: 76.0,
                    speed: 0.032
                },
                turbulence: {
                    enabled: false,
                    speed: 0.05,
                    scale: 0.1,
                    magnitude: 0.3
                },
                visibility: {
                    cycleDuration: 30.0,
                    visibleFraction: 0.7
                },
                aspect: {
                    width: 1.01,
                    height: 1.0
                }
            },
        ]
    },

    cloudShadows: {
        enabled: true,
        blendMode: 0,
        shadowIntensity: 0.5,
        maskBlur: 0,
        wind: {
            angle: 45.0,
            speed: 0.001
        },
        noise: {
            scale: 0.07,
            octaves: 5,
            persistence: 0.4,
            lacunarity: 2.6,
        },
        shading: {
            threshold: 1.0,
            softness: 0.2,
            brightness: 0.51,
            contrast: 1.0,
            gamma: 1.0
        }
    },

    iridescence: {
        enabled: true,
        texturePath: "",
        blendMode: 1,
        intensity: 0.85,
        speed: 0,
        scale: 0.1,
        noiseAmount: 0.05,
        distortion: {
            enabled: true,
            strength: 0.03
        },
        noise: {
            enabled: true,
            speed: 0,
            scale: 7.7,
            threshold: 0.18,
            brightness: 0.04,
            contrast: 1.0,
            softness: 1.0
        },
        gradient: {
            name: 'toxic',
            hueShift: 0.65,
            brightness: -0.01,
            contrast: 0.6
        }
    },

    ambient: {
        enabled: true,
        texturePath: "",
        blendMode: 1,
        intensity: 1.7,
        masking: {
            enabled: true,
            threshold: 0,
            softness: 0.25
        },
        tokenMasking: {
            enabled: true,
            threshold: 0
        },
        colorCorrection: {
            enabled: true,
            saturation: 1.2,
            brightness: 0.11,
            contrast: 1.05,
            gamma: 0.45,
            tint: {
                color: "#ff0209",
                amount: 0.0
            }
        }
    },

    groundGlow: {
        enabled: false,
        texturePath: "",
        blendMode: 1,
        intensity: 1.05,
        luminanceThreshold: 0.25,
        brightness: 1.2,
        saturation: 1.2,
        softness: 1.0,

        invert: false,

        tokenMasking: {
            enabled: true,
            threshold: 0.1
        }
    },

    heatDistortion: {
        enabled: true,
        texturePath: "",
        intensity: 0.0005,
        noise: {
            speed: 0.095,
            scale: 2.9,
            threshold: 0,
            brightness: 0.09,
            contrast: 0.45,
            softness: 1.0,
            evolution: 0.1
        }
    },

    advancedBloom: {
        enabled: false,
        threshold: 0.5,
        bloomScale: 1.0,
        brightness: 1.0,
        blur: 8,
        quality: 4
    },

    postProcessing: {
        enabled: true,
        colorCorrection: {
            enabled: true,
            saturation: 1.15,
            brightness: 0.0,
            contrast: 1.05,
            invert: false,
            tint: {
                color: "#FFFFFF",
                amount: 0.0
            },
            exposure: 0.0,
            gamma: 0.9,
            levels: {
                inBlack: 0.0,
                inWhite: 1.0
            },
            whiteBalance: {
                temperature: 0.06,
                tint: -0.06
            },
            mask: {
                enabled: false,
                invert: false,
                luminanceThreshold: 0.25,
                softness: 0.1
            },
            selective: {
                enabled: false,
                color: "#ff0000",
                hueRange: 0.05,
                saturationRange: 0.3
            }
        },
        vignette: {
            enabled: true,
            amount: 0.25,
            softness: 0.45
        },
        lensDistortion: {
            enabled: false,
            amount: 0.02,
            centerX: 0.5,
            centerY: 0.5
        },
        chromaticAberration: {
            enabled: false,
            amount: 0.0,
            centerX: 0.5,
            centerY: 0.5,
        },
        tiltShift: {
            enabled: false,
            blur: 15,
            gradientBlur: 15,
            startX: 0,
            startY: 0.5,
            endX: 1,
            endY: 0.5,
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

class LoadingScreen {
    constructor() {
        this.element = null;
        this.fadeOutDuration = 500; 
        this.minDisplayTime = 1500; 
        this.startTime = 0;
        this.fillElement = null;
        this.statusTextElement = null;

        this._textLoopActive = false;
        this.statusFadeDuration = 400; 
        this.minStatusDisplayTime = 2000; 

        this.imaginativeMessages = [
            "Polishing the Specular...",
            "Herding Pixels into Place...",
            "Reticulating Splines...",
            "Discovering Hidden Textures...",
            "Calibrating Color Tones...",
            "Waking the Sprites...",
            "Configuring Effect Layers...",
            "Initializing Scene Managers...",
            "Conjuring Procedural Noise...",
            "Unfolding Dimensions...",
            "Aligning Ley Lines...",
            "Consulting the Oracles...",
            "Buffing the Bloom...",
            "Sharpening Shaders...",
            "Generating Dust Motes...",
            "Simulating Cloud Shadows...",
            "Applying Chromatic Aberration..."
        ];
    }

    show() {
        if (this.element) return;
        this.startTime = Date.now();

        this.element = document.createElement('div');
        this.element.id = 'map-shine-loading-screen';
        this.element.style.opacity = '0';

        this.element.innerHTML = `
            <div class="loading-content">
                <img src="modules/map-shine/assets/fvtt.png" class="loading-logo" alt="Foundry VTT Logo">
                <h2 class="loading-subhead">Mythica Machina Presents...</h2>
                <h1 class="loading-title">Map Shine</h1>
                <div class="loading-bar-container">
                    <div class="loading-bar-fill"></div>
                </div>
                <div id="loading-status-text" class="loading-status"></div>
            </div>
            <style>

                #map-shine-loading-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 1); z-index: 100000; display: flex; justify-content: center; align-items: center; color: white; font-family: Signika, sans-serif; transition: opacity ${this.fadeOutDuration / 1000}s ease-in-out; }
                .loading-content { text-align: center; }
                .loading-logo { width: 150px; height: auto; margin: 0 auto 10px auto; display: block; filter: drop-shadow(0 0 10px rgba(0,0,0,0.6)); }
                .loading-subhead { font-size: 24px; font-weight: normal; color: #bbb; margin: 0 0 10px 0; text-shadow: 0 0 5px #111; }
                .loading-title { font-size: 72px; margin: 0 0 30px 0; text-shadow: 0 0 10px #222; }
                .loading-bar-container { width: 400px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.5); margin: 0 auto; background-color: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; }
                .loading-bar-fill { width: 0%; height: 100%; background-color: rgba(255, 255, 255, 0.9); transform-origin: left; transition: width 0.2s ease-out; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
                .loading-status { margin-top: 15px; font-size: 16px; color: #ddd; height: 20px; line-height: 20px; opacity: 0; transition: opacity ${this.statusFadeDuration / 1000}s ease-in-out; }
            </style>
        `;

        document.body.appendChild(this.element);
        this.fillElement = this.element.querySelector('.loading-bar-fill');
        this.statusTextElement = this.element.querySelector('#loading-status-text');

        this.statusTextElement.innerText = "Loading...";
        this.statusTextElement.style.opacity = '1';
        this._textLoopActive = true;
        this._runTextLoop(); 

        void this.element.offsetHeight;
        this.element.style.opacity = '1';
    }

    setProgress(progress) {
        if (!this.fillElement) return;
        const p = Math.min(100, Math.max(0, progress));
        this.fillElement.style.width = `${p}%`;
    }

    async _runTextLoop() {
        while (this._textLoopActive) {

            await new Promise(resolve => setTimeout(resolve, this.minStatusDisplayTime));

            if (!this._textLoopActive) break;

            this.statusTextElement.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, this.statusFadeDuration));
             if (!this._textLoopActive) break;

            const newText = this.imaginativeMessages[Math.floor(Math.random() * this.imaginativeMessages.length)];
            this.statusTextElement.innerText = newText;

            this.statusTextElement.style.opacity = '1';
        }
    }

    async hide() {
        if (!this.element || !this.fillElement) return;

        this._textLoopActive = false;

        this.statusTextElement.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, this.statusFadeDuration));
        this.statusTextElement.innerText = "Almost ready...";
        this.statusTextElement.style.opacity = '1';
        await new Promise(resolve => setTimeout(resolve, this.statusFadeDuration));

        const fakeLoadDuration = 3000;
        this.fillElement.style.transition = `width ${fakeLoadDuration / 1000}s ease-in-out`;
        this.setProgress(100);
        await new Promise(resolve => setTimeout(resolve, fakeLoadDuration));

        if (this.element) {
            this.element.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, this.fadeOutDuration + 100));
        }

        this.element?.remove();
        this.element = null;
        this.fillElement = null;
        this.statusTextElement = null;
    }
}

class LightingEffectManager {
    constructor() {
        console.log("LightingEffectManager | Initializing.");
        this.maskGenerator = new LightingMaskGenerator();
        this._tickerFunction = this.update.bind(this);
        canvas.app.ticker.add(this._tickerFunction);
    }

    destroy() {
        console.log("LightingEffectManager | Destroying.");
        canvas.app.ticker.remove(this._tickerFunction);
        this.maskGenerator?.destroy();
    }

    update() {
        const config = OVERLAY_CONFIG.postProcessing.colorCorrection;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const ccFilter = ScreenEffectsManager.getFilter('colorCorrection');

        if (!config.mask.enabled || !illuminationAPI || !ccFilter) {
            if (ccFilter) ccFilter.uniforms.uMaskEnabled = false;
            return;
        }

        this.maskGenerator.update(
            canvas.app.renderer,
            illuminationAPI.getLightingTexture(),
            config.mask.luminanceThreshold,
            config.mask.softness,
            config.mask.invert 
        );

        const u = ccFilter.uniforms;
        u.uMaskEnabled = true;
        u.uMaskTexture = this.maskGenerator.getMaskTexture();
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

    get hotspot() {
        return this.uniforms.u_hotspot;
    }
    set hotspot(value) {
        this.uniforms.u_hotspot = value;
    }
}

class ShinePatternFilter extends PIXI.Filter {
    constructor(options) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D u_noiseMap;

            uniform float u_time;
            uniform vec2 u_camera_offset, u_view_size;

            uniform float u_canvas_scale;

            uniform float u_globalIntensity;
            uniform float u_shared_maxBrightness;
            uniform float u_shared_patternScale;

            uniform bool u_noise_enabled;
            uniform bool u_s1_enabled, u_s2_enabled;
            uniform float u_s1_speed, u_s1_intensity, u_s1_angle_rad, u_s1_sharpness, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp;
            uniform float u_s2_speed, u_s2_intensity, u_s2_angle_rad, u_s2_sharpness, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp;

            const float PI = 3.14159265359;
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

            float createStripeLayer(vec2 uv, float t, float angle, float density, float width, float sub_count, float sub_sharp, float sharp) {
                float p_perp = uv.x * cos(angle) + uv.y * sin(angle); 
                float band_coord = p_perp * density;
                float band_id = floor(band_coord); 
                float in_band_pos = fract(band_coord);

                float result = 0.0;
                if (in_band_pos <= width) {
                    float r1 = random(vec2(band_id)); 
                    float r2 = random(vec2(band_id, r1)); 
                    float r3 = random(vec2(r1, r2));
                    float num_sub = 2.0 + r1 * sub_count; 
                    float sub_stripe_s = 1.0 + r2 * sub_sharp; 
                    float sub_stripe_b = 0.5 + r3 * 0.5;
                    float sub_wave = (cos(in_band_pos * (num_sub / width) * 2.0 * PI + t) + 1.0) * 0.5;
                    sub_wave = pow(sub_wave, sub_stripe_s) * sub_stripe_b;
                    result = sub_wave * pow(sin((in_band_pos / width) * PI), sharp);
                }
                return result;
            }

            void main() {
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);

                vec2 pattern_uv = (world_coord / (80.0 / u_canvas_scale)) * u_shared_patternScale;

                float pattern1 = u_s1_enabled ? createStripeLayer(pattern_uv, u_time * u_s1_speed, u_s1_angle_rad, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp, u_s1_sharpness) * u_s1_intensity : 0.0;
                float pattern2 = u_s2_enabled ? createStripeLayer(pattern_uv, u_time * u_s2_speed, u_s2_angle_rad, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp, u_s2_sharpness) * u_s2_intensity : 0.0;

                float noise_mask = u_noise_enabled ? texture2D(u_noiseMap, vTextureCoord).r : 1.0; 
                float shineIntensity = max(pattern1, pattern2) * u_shared_maxBrightness * u_globalIntensity * noise_mask;

                vec3 final_rgb = vec3(1.0) * shineIntensity;
                gl_FragColor = vec4(final_rgb, 1.0);
            }
        `, { ...options, u_canvas_scale: 1.0 }); 
    }
}

class ProceduralPatternLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.renderTexture = null;
        this.sourceSprite = null;
        this.shinePatternFilter = null;
        this.noiseTextureManager = null; 

        this._frameCount = 0; 
        this._needsUpdate = true; 
        this._lastViewTransform = { x: null, y: null, scale: null }; 
        this.updateFrequency = 1; 

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onPanBound = this._onPan.bind(this);
    }

    getPatternTexture() {
        return this.renderTexture;
    }

    async _draw(options) {

        this.visible = false;
        this.interactive = false;

        const renderer = canvas.app.renderer;
        this.renderTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.noiseTextureManager = new NoiseTextureManager(renderer, 'baseShine.noise');

        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = renderer.screen.width;
        this.sourceSprite.height = renderer.screen.height;

        this._setupFilters();
        this.sourceSprite.filters = this.shinePatternFilter ? [this.shinePatternFilter] : [];

        canvas.app.ticker.add(this._onAnimateBound);

        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
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
            u_canvas_scale: canvas.stage?.scale.x || 1.0, 
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
            this.shinePatternFilter = new ShinePatternFilter(initialUniforms);
            systemStatus.update('shaders', 'baseShine', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (err) {

            this.shinePatternFilter = null;
            systemStatus.update('shaders', 'baseShine', { state: 'error', message: `Compilation failed: ${err.message}` });
        }
    }

    async _tearDown(options) {
        canvas.app.ticker.remove(this._onAnimateBound);
        Hooks.off('canvasPan', this._onPanBound);
        this.renderTexture?.destroy(true);
        this.sourceSprite?.destroy();
        this.shinePatternFilter?.destroy();
        this.noiseTextureManager?.destroy();
    }

    async updateFromConfig(config) {
        if (!this.shinePatternFilter) return;
        this.noiseTextureManager?.updateFromConfig(config);

        const bs = config.baseShine;
        const p = bs.pattern;
        const s1 = p.stripes1;
        const s2 = p.stripes2;

        const newFrequency = bs.animation.updateFrequency;
        if (this.updateFrequency !== newFrequency) {
            this.updateFrequency = Math.max(0, newFrequency); 
            this._needsUpdate = true;
        }

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

        this._needsUpdate = true;
    }

    _onPan() {
        this._needsUpdate = true;
    }

    _onAnimate(deltaTime) {
        if (!this.shinePatternFilter) return;

        this._frameCount++;

        const uPattern = this.shinePatternFilter.uniforms;
        uPattern.u_time = (uPattern.u_time || 0) + deltaTime;

        const isNthFrame = this.updateFrequency > 0 && (this._frameCount % this.updateFrequency === 0);
        const shouldUpdate = this._needsUpdate || isNthFrame;

        if (!shouldUpdate) {
            return;
        }

        const renderer = canvas.app.renderer;
        this.noiseTextureManager.update(deltaTime, renderer);

        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        uPattern.u_camera_offset = [topLeft.x, topLeft.y];
        uPattern.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        uPattern.u_noiseMap = this.noiseTextureManager.getTexture();

        uPattern.u_canvas_scale = stage.scale.x;

        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });

        this._needsUpdate = false;
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
        `, {
            u_threshold: threshold
        });
    }
    get threshold() {
        return this.uniforms.u_threshold;
    }
    set threshold(value) {
        this.uniforms.u_threshold = value;
    }
}

class ColorCorrectionFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D uMaskTexture;

            uniform sampler2D uAmbientCompositeTexture;
            uniform bool uAmbientCompositeEnabled;
            uniform int uAmbientCompositeBlendMode;

            uniform sampler2D uAmbientIlluminationMask;
            uniform bool uAmbientIlluminationMaskEnabled;

            uniform float uSaturation, uBrightness, uContrast;
            uniform float uExposure, uGamma, uInBlack, uInWhite;
            uniform float uTemperature, uWbTint;
            uniform bool uInvert;
            uniform vec3 uTintColor;
            uniform float uTintAmount;
            uniform bool uMaskEnabled;
            uniform bool uSelectiveEnabled;
            uniform vec3 uSelectiveColor;
            uniform float uSelectiveHueRange, uSelectiveSatRange;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            vec3 rgb2hsl(vec3 c) {
                float max_c = max(max(c.r, c.g), c.b);
                float min_c = min(min(c.r, c.g), c.b);
                float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                if (max_c != min_c) {
                    float d = max_c - min_c;
                    s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                    if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                    else if (max_c == c.g) h = (c.b - c.r) / d + 2.0;
                    else h = (c.r - c.g) / d + 4.0;
                    h /= 6.0;
                }
                return vec3(h, s, l);
            }

            vec3 applyWhiteBalance(vec3 color, float temp, float green_tint) {
                color.r += temp * 0.15;
                color.b -= temp * 0.15;
                color.g += green_tint * 0.15;
                return color;
            }

            void main(void) {
                vec4 originalColor = texture2D(uSampler, vTextureCoord);

                vec3 workingColor = originalColor.rgb;
                if (originalColor.a > 0.0) {
                    workingColor /= originalColor.a;
                }

                vec3 uncorrectedColor = workingColor; 

                if (uSelectiveEnabled) {
                    vec3 pixel_hsl = rgb2hsl(workingColor);
                    vec3 target_hsl = rgb2hsl(uSelectiveColor);
                    float hue_dist = min(abs(pixel_hsl.x - target_hsl.x), 1.0 - abs(pixel_hsl.x - target_hsl.x));
                    if (hue_dist > uSelectiveHueRange || abs(pixel_hsl.y - target_hsl.y) > uSelectiveSatRange) {
                        workingColor = vec3(dot(workingColor, lum_weights));
                    }
                }

                if (uInWhite > uInBlack) workingColor = (workingColor - uInBlack) / (uInWhite - uInBlack);
                workingColor *= pow(2.0, uExposure);
                workingColor = applyWhiteBalance(workingColor, uTemperature, uWbTint);
                if (uGamma > 0.0) workingColor = pow(workingColor, vec3(1.0 / uGamma));
                workingColor += uBrightness;
                workingColor = (workingColor - 0.5) * uContrast + 0.5;
                float final_luminance = dot(workingColor, lum_weights);
                workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                workingColor = mix(workingColor, uTintColor, uTintAmount);
                if (uInvert) workingColor = 1.0 - workingColor;

                vec3 final_rgb = workingColor;

                if (uMaskEnabled) {
                    float maskValue = texture2D(uMaskTexture, vTextureCoord).r;
                    final_rgb = mix(uncorrectedColor, workingColor, maskValue);
                }

                if (uAmbientCompositeEnabled) {
                    vec4 ambient = texture2D(uAmbientCompositeTexture, vTextureCoord);
                    if (ambient.a > 0.0) {

                        float lightMask = 1.0;
                        if (uAmbientIlluminationMaskEnabled) {
                            lightMask = dot(texture2D(uAmbientIlluminationMask, vTextureCoord).rgb, lum_weights);
                        }

                        vec3 ambientRGB = (ambient.rgb / ambient.a) * lightMask;

                        if (uAmbientCompositeBlendMode == 1) { 
                            final_rgb += ambientRGB;
                        } else if (uAmbientCompositeBlendMode == 2) { 
                            final_rgb *= ambientRGB;
                        } else if (uAmbientCompositeBlendMode == 3) { 
                             final_rgb = 1.0 - (1.0 - final_rgb) * (1.0 - ambientRGB);
                        } else { 
                            final_rgb = mix(final_rgb, ambientRGB, ambient.a);
                        }
                    }
                }

                vec3 premultiplied_rgb = clamp(final_rgb, 0.0, 1.0) * originalColor.a;
                gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
            }
        `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uSaturation: 1.0,
            uBrightness: 0.0,
            uContrast: 1.0,
            uExposure: 0.0,
            uGamma: 1.0,
            uInBlack: 0.0,
            uInWhite: 1.0,
            uTemperature: 0.0,
            uWbTint: 0.0,
            uInvert: false,
            uTintColor: [1.0, 1.0, 1.0],
            uTintAmount: 0.0,
            uMaskTexture: PIXI.Texture.EMPTY,
            uMaskEnabled: false,
            uSelectiveEnabled: false,
            uSelectiveColor: [1.0, 0.0, 0.0],
            uSelectiveHueRange: 0.1,
            uSelectiveSatRange: 0.4,
            uAmbientCompositeTexture: PIXI.Texture.EMPTY,
            uAmbientCompositeEnabled: false,
            uAmbientCompositeBlendMode: PIXI.BLEND_MODES.NORMAL,

            uAmbientIlluminationMask: PIXI.Texture.EMPTY,
            uAmbientIlluminationMaskEnabled: false,
        });
    }

    get saturation() {
        return this.uniforms.uSaturation;
    }
    set saturation(v) {
        this.uniforms.uSaturation = v;
    }
    get brightness() {
        return this.uniforms.uBrightness;
    }
    set brightness(v) {
        this.uniforms.uBrightness = v;
    }
    get contrast() {
        return this.uniforms.uContrast;
    }
    set contrast(v) {
        this.uniforms.uContrast = v;
    }
}

class AmbientColorFilter extends PIXI.Filter {
    constructor(options = {}) {
        const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat3 projectionMatrix;

            varying vec2 vTextureCoord; 
            varying vec2 vScreenCoord;  

            void main(void)
            {
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

            uniform float uSaturation, uBrightness, uContrast, uGamma;
            uniform vec3 uTintColor;
            uniform float uTintAmount;
            uniform float u_intensity;

            uniform sampler2D uTokenMask;
            uniform bool uTokenMaskEnabled;
            uniform float uTokenMaskThreshold;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {

                if (uTokenMaskEnabled) {

                    float maskValue = texture2D(uTokenMask, vScreenCoord).r;
                    if (maskValue > uTokenMaskThreshold) {
                        discard;
                    }
                }

                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                if (originalColor.a == 0.0) {
                    discard;
                }

                vec3 workingColor = originalColor.rgb;

                if (uGamma > 0.0) {
                    workingColor = pow(workingColor, vec3(1.0 / uGamma));
                }
                workingColor += uBrightness;
                workingColor = (workingColor - 0.5) * uContrast + 0.5;
                float final_luminance = dot(workingColor, lum_weights);
                workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                workingColor = mix(workingColor, uTintColor, uTintAmount);

                workingColor *= u_intensity;

                vec3 premultiplied_rgb = workingColor * originalColor.a;
                gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
            }
        `;

        super(vertexSrc, fragmentSrc, {
            uSaturation: options.saturation ?? 1.0,
            uBrightness: options.brightness ?? 0.0,
            uContrast: options.contrast ?? 1.0,
            uGamma: options.gamma ?? 1.0,
            uTintColor: options.tintColor ?? [1.0, 1.0, 1.0],
            uTintAmount: options.tintAmount ?? 0.0,

            u_intensity: options.intensity ?? 1.0,

            uTokenMask: PIXI.Texture.EMPTY,
            uTokenMaskEnabled: false,
            uTokenMaskThreshold: options.tokenMaskThreshold ?? 0.1,
        });
    }
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
    get amount() {
        return this.uniforms.u_amount;
    }
    set amount(v) {
        this.uniforms.u_amount = v;
    }
    get center() {
        return this.uniforms.u_center;
    }
    set center(v) {
        this.uniforms.u_center = v;
    }
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
    get amount() {
        return this.uniforms.u_amount;
    }
    set amount(v) {
        this.uniforms.u_amount = v;
    }
    get softness() {
        return this.uniforms.u_softness;
    }
    set softness(v) {
        this.uniforms.u_softness = v;
    }
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
    get amount() {
        return this.uniforms.u_amount;
    }
    set amount(v) {
        this.uniforms.u_amount = v;
    }
    get center() {
        return this.uniforms.u_center;
    }
    set center(v) {
        this.uniforms.u_center = v;
    }
}

class IridescenceFilter extends PIXI.Filter {
    constructor(options = {}) {

        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            const int MAX_COLORS = 8;

            uniform sampler2D uSampler;
            uniform sampler2D u_distortionMap;
            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;
            uniform float u_speed;
            uniform float u_scale;
            uniform float u_intensity;
            uniform float u_noise_amount;
            uniform float u_distortionStrength;
            uniform vec3 u_gradientColors[MAX_COLORS];
            uniform int u_numColors;
            uniform float u_hueShift;
            uniform float u_brightness;
            uniform float u_contrast;

            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

            float hue2rgb(float p, float q, float t) {
                if (t < 0.0) t += 1.0;
                if (t > 1.0) t -= 1.0;
                if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                if (t < 1.0/2.0) return q;
                if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                return p;
            }

            vec3 hsl2rgb(vec3 c) {
                if (c.y == 0.0) return vec3(c.z);
                float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
                float p = 2.0 * c.z - q;
                return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0));
            }

            vec3 rgb2hsl(vec3 c) {
                float max_c = max(max(c.r, c.g), c.b);
                float min_c = min(min(c.r, c.g), c.b);
                float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                if (max_c != min_c) {
                    float d = max_c - min_c;
                    s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                    if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                    else if (max_c == c.g) h = (c.b - c.r) / d + 2.0;
                    else h = (c.r - c.g) / d + 4.0;
                    h /= 6.0;
                }
                return vec3(h, s, l);
            }

            vec3 getGradientColor(float t) {
                if (u_numColors <= 1) { return u_gradientColors[0]; }
                float pos = t * float(u_numColors - 1);
                float mix_factor = fract(pos);
                if (pos < 1.0) { return mix(u_gradientColors[0], u_gradientColors[1], mix_factor); }
                else if (pos < 2.0) { return mix(u_gradientColors[1], u_gradientColors[2], mix_factor); }
                else if (pos < 3.0) { return mix(u_gradientColors[2], u_gradientColors[3], mix_factor); }
                else if (pos < 4.0) { return mix(u_gradientColors[3], u_gradientColors[4], mix_factor); }
                else if (pos < 5.0) { return mix(u_gradientColors[4], u_gradientColors[5], mix_factor); }
                else if (pos < 6.0) { return mix(u_gradientColors[5], u_gradientColors[6], mix_factor); }
                else if (pos < 7.0) { return mix(u_gradientColors[6], u_gradientColors[7], mix_factor); } 
                else { return u_gradientColors[7]; }
            }

            void main(void) {
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 distortion_offset = (texture2D(u_distortionMap, vTextureCoord).rg - 0.5) * 2.0;
                vec2 normalized_uv = world_coord / 100.0;
                vec2 distorted_normalized_uv = normalized_uv + (distortion_offset * u_distortionStrength * 5.0);
                vec2 scaled_pattern_uv = distorted_normalized_uv * u_scale;
                float breakup_noise = (random(scaled_pattern_uv) - 0.5) * u_noise_amount;
                float pattern_driver = scaled_pattern_uv.x + scaled_pattern_uv.y + breakup_noise + (u_time * u_speed);
                float final_pos = fract(pattern_driver);

                vec3 base_color = getGradientColor(final_pos);

                vec3 hsl = rgb2hsl(base_color);
                hsl.x = fract(hsl.x + u_hueShift);
                vec3 shifted_color = hsl2rgb(hsl);
                shifted_color += u_brightness;
                shifted_color = (shifted_color - 0.5) * u_contrast + 0.5;

                gl_FragColor = vec4(clamp(shifted_color, 0.0, 1.0) * u_intensity, u_intensity);
            }
        `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [0, 0],
            u_speed: options.speed ?? 0.0,
            u_scale: options.scale ?? 8.0,
            u_intensity: options.intensity ?? 1.0,
            u_noise_amount: options.noiseAmount ?? 0.3,
            u_distortionMap: PIXI.Texture.EMPTY,
            u_distortionStrength: options.distortion?.strength ?? 0.0,
            u_gradientColors: [],
            u_numColors: 0,
            u_hueShift: options.gradient?.hueShift ?? 0.0,
            u_brightness: options.gradient?.brightness ?? 0.0,
            u_contrast: options.gradient?.contrast ?? 1.0,
        });
    }
}

class NoisePatternFilter extends PIXI.Filter {
    constructor(options) {
        const fragmentSrc = `
            precision mediump float; 
            varying vec2 vTextureCoord;

            uniform float u_time; 
            uniform vec2 u_camera_offset; 
            uniform vec2 u_view_size;
            uniform float u_speed, u_scale, u_threshold, u_brightness, u_contrast, u_softness;
            uniform float u_canvas_scale;

            uniform float u_evolution;

            float random(vec3 st) { 
                return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.731))) * 43758.5453123); 
            }

            float value_noise(vec3 st) {
                vec3 i = floor(st); 
                vec3 f = fract(st); 

                float a = random(i + vec3(0.0, 0.0, 0.0));
                float b = random(i + vec3(1.0, 0.0, 0.0));
                float c = random(i + vec3(0.0, 1.0, 0.0));
                float d = random(i + vec3(1.0, 1.0, 0.0));
                float e = random(i + vec3(0.0, 0.0, 1.0));
                float f_ = random(i + vec3(1.0, 0.0, 1.0));
                float g = random(i + vec3(0.0, 1.0, 1.0));
                float h = random(i + vec3(1.0, 1.0, 1.0));

                vec3 u = f * f * (3.0 - 2.0 * f);

                float bottom_x = mix(a, b, u.x);
                float top_x = mix(c, d, u.x);

                float bottom_face_mix = mix(bottom_x, top_x, u.y);

                float bottom_x_top = mix(e, f_, u.x);
                float top_x_top = mix(g, h, u.x);

                float top_face_mix = mix(bottom_x_top, top_x_top, u.y);

                return mix(bottom_face_mix, top_face_mix, u.z);
            }

            void main() {
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 uv = (world_coord / (30.0 / u_canvas_scale)) * u_scale;

                uv.x += u_time * u_speed;

                float time_z = u_time * u_evolution;

                float noise = value_noise(vec3(uv, time_z));

                noise += u_brightness;
                noise = (noise - 0.5) * u_contrast + 0.5;
                noise = smoothstep(u_threshold, u_threshold + u_softness, noise);
                gl_FragColor = vec4(vec3(clamp(noise, 0.0, 1.0)), 1.0);
            }
        `;

        const newOptions = {
            ...options,
            u_canvas_scale: 1.0,
            u_evolution: 0.0
        };
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, newOptions);
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

    get hotspot() {
        return this.uniforms.u_hotspot;
    }
    set hotspot(value) {
        this.uniforms.u_hotspot = value;
    }
}

class LuminanceMaskFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler; 
            uniform float uLuminanceThreshold;
            uniform float uSoftness;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 lightingColor = texture2D(uSampler, vTextureCoord);
                float lightLevel = dot(lightingColor.rgb, lum_weights);

float maskAlpha = 1.0 - smoothstep(uLuminanceThreshold, uLuminanceThreshold + uSoftness, lightLevel);

                gl_FragColor = vec4(maskAlpha, maskAlpha, maskAlpha, maskAlpha);
            }
        `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uLuminanceThreshold: options.luminanceThreshold ?? 0.25,
            uSoftness: options.softness ?? 0.1,
        });
    }
}

class MetallicShineFilter extends PIXI.Filter {
    constructor(options) {
        const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;

            uniform mat3 projectionMatrix;

            varying vec2 vTextureCoord; 
            varying vec2 vScreenCoord;  

            void main(void)
            {
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
            uniform sampler2D uShinePatternMap;
            uniform float uBoost;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 specularColor = texture2D(uSampler, vTextureCoord);
                float specularLuminance = dot(specularColor.rgb, lum_weights);

                if (specularColor.a < 0.1 || specularLuminance < 0.01) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                float shineIntensity = texture2D(uShinePatternMap, vScreenCoord).r;
                vec3 finalColor = specularColor.rgb * shineIntensity * uBoost;
                gl_FragColor = vec4(finalColor, shineIntensity);
            }
        `;

        super(vertexSrc, fragmentSrc, {
            uShinePatternMap: options.shinePatternTexture,
            uBoost: options.boost ?? 1.0,
        });
    }
}

class LightingMaskFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler; 
            uniform float uLuminanceThreshold;
            uniform float uSoftness;
            uniform bool uInvert;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 lightingColor = texture2D(uSampler, vTextureCoord);
                float lightLevel = dot(lightingColor.rgb, lum_weights);

                float maskAlpha = smoothstep(uLuminanceThreshold, uLuminanceThreshold + uSoftness, lightLevel);

                float finalAlpha = uInvert ? maskAlpha : 1.0 - maskAlpha;

                gl_FragColor = vec4(vec3(finalAlpha), 1.0);
            }
        `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uLuminanceThreshold: options.luminanceThreshold ?? 0.25,
            uSoftness: options.softness ?? 0.1,
            uInvert: options.invert ?? false,
        });
    }
}

class StarburstFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;

            uniform float u_threshold;
            uniform float u_intensity;
            uniform float u_angle_rad;
            uniform int u_points;
            uniform float u_size;
            uniform float u_falloff;
            uniform vec2 u_texel_size;

            const float PI = 3.14159265359;
            const int MAX_SAMPLES_PER_RAY = 256; 

            const int MAX_POINTS = 16;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                float brightness = dot(originalColor.rgb, lum_weights);

                if (brightness < u_threshold) {
                    gl_FragColor = vec4(0.0);
                    return;
                }

                vec3 starColor = vec3(0.0);
                float angle_step = 2.0 * PI / float(u_points);

                for (int i = 0; i < MAX_POINTS; i++) {

                    if (i < u_points) {
                        float current_angle = u_angle_rad + float(i) * angle_step;
                        vec2 direction = vec2(cos(current_angle), sin(current_angle));

                        for (int j = 1; j < MAX_SAMPLES_PER_RAY; j++) {
                            if (float(j) <= u_size) {
                                float distance = float(j);
                                vec2 sampleCoord = vTextureCoord + direction * distance * u_texel_size;

                                vec3 sample_color = texture2D(uSampler, sampleCoord).rgb;
                                float sample_brightness = dot(sample_color, lum_weights);
                                float dist_falloff = pow(1.0 - (distance / u_size), u_falloff);

                                starColor += sample_color * sample_brightness * dist_falloff;
                            }
                        }
                    }
                }

                float star_brightness = dot(starColor * u_intensity, lum_weights);
                gl_FragColor = vec4(starColor * u_intensity, clamp(star_brightness, 0.0, 1.0));
            }
        `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_threshold: options.threshold ?? 0.85,
            u_intensity: options.intensity ?? 0.5,
            u_angle_rad: (options.angle ?? 0.0) * (Math.PI / 180.0),
            u_points: options.points ?? 5,
            u_size: options.size ?? 80.0,
            u_falloff: options.falloff ?? 4.0,
            u_texel_size: [1.0 / (window.innerWidth * window.devicePixelRatio), 1.0 / (window.innerHeight * window.devicePixelRatio)]
        });
    }
}

class HeatDistortionFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord; 

            uniform sampler2D uSampler;          
            uniform sampler2D u_displacementMap; 
            uniform sampler2D u_intensityMask;   

            uniform float u_intensity;

            void main(void) {

                float mask_value = texture2D(u_intensityMask, vTextureCoord).r;

                if (mask_value == 0.0) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }

                vec2 displacement = (texture2D(u_displacementMap, vTextureCoord).rg - 0.5) * 2.0;

                vec2 offset = displacement * u_intensity * mask_value;

                gl_FragColor = texture2D(uSampler, vTextureCoord + offset);
            }
        `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_displacementMap: PIXI.Texture.EMPTY,
            u_intensityMask: PIXI.Texture.EMPTY,
            u_intensity: options.intensity ?? 0.01,
        });
    }
}

class CloudShadowsFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uOutdoorsMask;

            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;
            uniform float u_shadowIntensity;
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

            float fbm(vec2 st) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 10; i++) {
                    if (i >= u_noise_octaves) break;
                    value += amplitude * noise(st);
                    st *= u_noise_lacunarity;
                    amplitude *= u_noise_persistence;
                }
                return value;
            }

            float applyShadingControls(float value) {

                value += u_shading_brightness;

                value = (value - 0.5) * u_shading_contrast + 0.5;

                value = smoothstep(u_shading_threshold, u_shading_threshold + u_shading_softness, value);

                if (u_shading_gamma > 0.0) {
                    value = pow(value, u_shading_gamma);
                }

                return clamp(value, 0.0, 1.0);
            }

            void main() {
                float maskValue = texture2D(uOutdoorsMask, vTextureCoord).r;

                if (maskValue < 0.01) {
                    discard;
                    return;
                }

                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 noise_uv = world_coord / 100.0 * u_noise_scale;
                noise_uv += u_time * u_windDirection;

                float rawCloudValue = fbm(noise_uv);

                float shadedCloudValue = applyShadingControls(rawCloudValue);

                float shadowAlpha = shadedCloudValue * maskValue * u_shadowIntensity;

                gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(shadowAlpha, 0.0, 1.0));
            }
        `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uOutdoorsMask: PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [0, 0],
            ...options
        });
    }
}

class DustMotesFilter extends PIXI.Filter {

    static MAX_DUST_LAYERS = 4;

    constructor(options = {}) {
        const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;

            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
            }
        `;

        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uDustMask;         
            uniform sampler2D uShinePatternMap;  
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_global_intensity;
            uniform float u_shine_influence;
            uniform int u_num_active_layers;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            float random(vec3 st) { 
                return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.731))) * 43758.5453123); 
            }

            float value_noise(vec3 st) {
                vec3 i = floor(st);
                vec3 f = fract(st);
                float a = random(i + vec3(0.0, 0.0, 0.0));
                float b = random(i + vec3(1.0, 0.0, 0.0));
                float c = random(i + vec3(0.0, 1.0, 0.0));
                float d = random(i + vec3(1.0, 1.0, 0.0));
                float e = random(i + vec3(0.0, 0.0, 1.0));
                float f_ = random(i + vec3(1.0, 0.0, 1.0));
                float g = random(i + vec3(0.0, 1.0, 1.0));
                float h = random(i + vec3(1.0, 1.0, 1.0));
                vec3 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(mix(a, b, u.x), mix(c, d, u.x), u.y), mix(mix(e, f_, u.x), mix(g, h, u.x), u.y), u.z);
            }

            uniform float u_layer0_scale, u_layer0_density, u_layer0_size, u_layer0_twinkleSpeed;
            uniform vec2 u_layer0_drift_dir, u_layer0_aspect;
            uniform float u_layer0_drift_speed, u_layer0_visibility_duration, u_layer0_visibility_fraction;
            uniform bool u_layer0_turbulence_enabled;
            uniform float u_layer0_turbulence_speed, u_layer0_turbulence_scale, u_layer0_turbulence_magnitude;
            uniform float u_layer0_size_randomness;
            uniform vec3 u_layer0_tintColor;

            uniform float u_layer1_scale, u_layer1_density, u_layer1_size, u_layer1_twinkleSpeed;
            uniform vec2 u_layer1_drift_dir, u_layer1_aspect;
            uniform float u_layer1_drift_speed, u_layer1_visibility_duration, u_layer1_visibility_fraction;
            uniform bool u_layer1_turbulence_enabled;
            uniform float u_layer1_turbulence_speed, u_layer1_turbulence_scale, u_layer1_turbulence_magnitude;
            uniform float u_layer1_size_randomness;
            uniform vec3 u_layer1_tintColor;

            uniform float u_layer2_scale, u_layer2_density, u_layer2_size, u_layer2_twinkleSpeed;
            uniform vec2 u_layer2_drift_dir, u_layer2_aspect;
            uniform float u_layer2_drift_speed, u_layer2_visibility_duration, u_layer2_visibility_fraction;
            uniform bool u_layer2_turbulence_enabled;
            uniform float u_layer2_turbulence_speed, u_layer2_turbulence_scale, u_layer2_turbulence_magnitude;
            uniform float u_layer2_size_randomness;
            uniform vec3 u_layer2_tintColor;

            uniform float u_layer3_scale, u_layer3_density, u_layer3_size, u_layer3_twinkleSpeed;
            uniform vec2 u_layer3_drift_dir, u_layer3_aspect;
            uniform float u_layer3_drift_speed, u_layer3_visibility_duration, u_layer3_visibility_fraction;
            uniform bool u_layer3_turbulence_enabled;
            uniform float u_layer3_turbulence_speed, u_layer3_turbulence_scale, u_layer3_turbulence_magnitude;
            uniform float u_layer3_size_randomness;
            uniform vec3 u_layer3_tintColor;

            vec3 process_mote_layer(
                float scale, float density, float size, float twinkleSpeed,
                vec2 drift_dir, float drift_speed,
                bool turbulence_enabled, float turbulence_speed, float turbulence_scale, float turbulence_magnitude,
                vec2 aspect,
                float size_randomness
            ) {
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 mote_uv = (world_coord * aspect) / scale + drift_dir * u_time * drift_speed;
                vec2 grid_uv = floor(mote_uv);

                const float DENSITY_BASELINE = 100.0;
                float corrected_ratio = scale / DENSITY_BASELINE;
                float density_correction = corrected_ratio * corrected_ratio;
                float corrected_density = density * density_correction;

                if (random(vec3(grid_uv, 0.0)) > corrected_density) {
                    return vec3(0.0);
                }

                vec2 turbulence_offset = vec2(0.0);
                if (turbulence_enabled) {
                    vec3 noise_coord = vec3(grid_uv * turbulence_scale, u_time * turbulence_speed);
                    turbulence_offset.x = value_noise(noise_coord);
                    turbulence_offset.y = value_noise(noise_coord + vec3(15.7, 12.1, 0.0));
                    turbulence_offset = (turbulence_offset - 0.5) * 2.0 * turbulence_magnitude;
                }
                float size_rand_mod = 1.0 - (random(vec3(grid_uv, 1.23)) * size_randomness);
                float final_size = size * size_rand_mod;
                float twinkle = 0.5 + value_noise(vec3(grid_uv * 5.0, u_time * twinkleSpeed * 0.2)) * 0.5;
                vec2 particle_center = vec2(0.5) + turbulence_offset;

                vec2 d = fract(mote_uv) - particle_center;
                d -= floor(d + 0.5); 
                float dist = length(d);

                float mote_val = smoothstep(0.5 * final_size, 0.0, dist); 
                return vec3(mote_val * twinkle);
            }

            void main(void) {

                float maskValue = texture2D(uDustMask, vTextureCoord).r;
                if (maskValue < 0.01) {
                    discard;
                }

                float shineIntensity = texture2D(uShinePatternMap, vTextureCoord).r;

                vec3 totalMoteColor = vec3(0.0);
                if (0 < u_num_active_layers) {
                    if (u_layer0_visibility_duration <= 0.0 || mod(u_time, u_layer0_visibility_duration) <= u_layer0_visibility_duration * u_layer0_visibility_fraction) {
                        totalMoteColor += process_mote_layer(u_layer0_scale, u_layer0_density, u_layer0_size, u_layer0_twinkleSpeed, u_layer0_drift_dir, u_layer0_drift_speed, u_layer0_turbulence_enabled, u_layer0_turbulence_speed, u_layer0_turbulence_scale, u_layer0_turbulence_magnitude, u_layer0_aspect, u_layer0_size_randomness) * u_layer0_tintColor;
                    }
                }
                if (1 < u_num_active_layers) {
                     if (u_layer1_visibility_duration <= 0.0 || mod(u_time, u_layer1_visibility_duration) <= u_layer1_visibility_duration * u_layer1_visibility_fraction) {
                        totalMoteColor += process_mote_layer(u_layer1_scale, u_layer1_density, u_layer1_size, u_layer1_twinkleSpeed, u_layer1_drift_dir, u_layer1_drift_speed, u_layer1_turbulence_enabled, u_layer1_turbulence_speed, u_layer1_turbulence_scale, u_layer1_turbulence_magnitude, u_layer1_aspect, u_layer1_size_randomness) * u_layer1_tintColor;
                    }
                }
                if (2 < u_num_active_layers) {
                     if (u_layer2_visibility_duration <= 0.0 || mod(u_time, u_layer2_visibility_duration) <= u_layer2_visibility_duration * u_layer2_visibility_fraction) {
                        totalMoteColor += process_mote_layer(u_layer2_scale, u_layer2_density, u_layer2_size, u_layer2_twinkleSpeed, u_layer2_drift_dir, u_layer2_drift_speed, u_layer2_turbulence_enabled, u_layer2_turbulence_speed, u_layer2_turbulence_scale, u_layer2_turbulence_magnitude, u_layer2_aspect, u_layer2_size_randomness) * u_layer2_tintColor;
                    }
                }
                if (3 < u_num_active_layers) {
                     if (u_layer3_visibility_duration <= 0.0 || mod(u_time, u_layer3_visibility_duration) <= u_layer3_visibility_duration * u_layer3_visibility_fraction) {
                        totalMoteColor += process_mote_layer(u_layer3_scale, u_layer3_density, u_layer3_size, u_layer3_twinkleSpeed, u_layer3_drift_dir, u_layer3_drift_speed, u_layer3_turbulence_enabled, u_layer3_turbulence_speed, u_layer3_turbulence_scale, u_layer3_turbulence_magnitude, u_layer3_aspect, u_layer3_size_randomness) * u_layer3_tintColor;
                    }
                }

                if (dot(totalMoteColor, totalMoteColor) < 0.0001) {
                    discard;
                }

                float finalBrightness = u_global_intensity * (1.0 + (shineIntensity * u_shine_influence));
                vec3 finalColor = totalMoteColor * finalBrightness;

                float moteAlpha = clamp(dot(finalColor, vec3(0.333)), 0.0, 1.0);
                float finalAlpha = moteAlpha * maskValue;

                gl_FragColor = vec4(finalColor * finalAlpha, finalAlpha);
            }
        `;

        const defaultUniforms = {
            uDustMask: options.dustMaskTexture ?? PIXI.Texture.EMPTY,
            uShinePatternMap: options.shinePatternTexture ?? PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_resolution: [window.innerWidth, window.innerHeight],
            u_camera_offset: [0.0, 0.0],
            u_view_size: [window.innerWidth, window.innerHeight],
            u_global_intensity: 1.0,
            u_shine_influence: 0.5,
            u_num_active_layers: 0,
        };

        for (let i = 0; i < DustMotesFilter.MAX_DUST_LAYERS; i++) {
            defaultUniforms[`u_layer${i}_scale`] = 0.0;
            defaultUniforms[`u_layer${i}_density`] = 0.0;
            defaultUniforms[`u_layer${i}_size`] = 0.0;
            defaultUniforms[`u_layer${i}_size_randomness`] = 0.0;
            defaultUniforms[`u_layer${i}_twinkleSpeed`] = 0.0;
            defaultUniforms[`u_layer${i}_aspect`] = [1.0, 1.0];
            defaultUniforms[`u_layer${i}_drift_dir`] = [0.0, 0.0];
            defaultUniforms[`u_layer${i}_drift_speed`] = 0.0;
            defaultUniforms[`u_layer${i}_turbulence_enabled`] = false;
            defaultUniforms[`u_layer${i}_turbulence_speed`] = 0.0;
            defaultUniforms[`u_layer${i}_turbulence_scale`] = 0.0;
            defaultUniforms[`u_layer${i}_turbulence_magnitude`] = 0.0;
            defaultUniforms[`u_layer${i}_visibility_duration`] = 0.0;
            defaultUniforms[`u_layer${i}_visibility_fraction`] = 0.0;
            defaultUniforms[`u_layer${i}_tintColor`] = [1.0, 1.0, 1.0];
        }

        super(vertexSrc, fragmentSrc, {
            ...defaultUniforms,
            ...options.uniforms
        });
        this.autoFit = false;
    }
}

class LightingMaskGenerator {
    constructor() {
        const screen = canvas.app.screen;
        this.renderTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.maskFilter = new LightingMaskFilter();
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.sourceSprite.filters = [this.maskFilter];
    }

    update(renderer, illuminationTexture, threshold, softness, invert) {
        if (!this.sourceSprite || !illuminationTexture) return;
        this.sourceSprite.texture = illuminationTexture;
        this.maskFilter.uniforms.uLuminanceThreshold = threshold;
        this.maskFilter.uniforms.uSoftness = softness;
        this.maskFilter.uniforms.uInvert = invert;
        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });
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

class DynamicTokenMaskManager {
    constructor() {
        if (!canvas?.app?.renderer) {
            console.error("DynamicTokenMaskManager | Cannot initialize without a canvas renderer.");
            return;
        }
        console.log("DynamicTokenMaskManager | Initializing with sprite pooling.");

        const renderer = canvas.app.renderer;
        this.renderTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.tokenContainer = new PIXI.Container();
        this.tokenSprites = new Map(); 
        this._needsUpdate = true;

        this._frameCount = 0;
        this.updateFrequency = 3; 

        this._boundOnTokenChange = this._requestUpdate.bind(this);

        Hooks.on("createToken", this._boundOnTokenChange);
        Hooks.on("deleteToken", this._boundOnTokenChange);
        Hooks.on("canvasPan", this._boundOnTokenChange);

        this._boundOnAnimate = () => {
            this._frameCount++;
            const isNthFrame = (this._frameCount % this.updateFrequency === 0);

            if (this._needsUpdate || isNthFrame) {
                this.renderMask();
                this._needsUpdate = false; 
            }
        };
        canvas.app.ticker.add(this._boundOnAnimate);

        this.renderMask();
    }

    _requestUpdate() {
        this._needsUpdate = true;
    }

    renderMask() {
        if (!this.tokenContainer || !canvas?.tokens?.placeables) return;
        const renderer = canvas.app.renderer;

        const currentTokenIds = new Set();

        for (const token of canvas.tokens.placeables) {
            if (!token.visible || !token.texture?.valid || token.document.hidden) {
                continue;
            }
            currentTokenIds.add(token.id);

            let sprite = this.tokenSprites.get(token.id);

            if (!sprite) {

                sprite = new PIXI.Sprite(token.texture);
                sprite.tint = 0xFFFFFF;
                this.tokenSprites.set(token.id, sprite);
                this.tokenContainer.addChild(sprite);
            }

            if (sprite.texture !== token.texture) {
                sprite.texture = token.texture;
            }

            const anchorX = token.document.texture.anchorX ?? 0.5;
            const anchorY = token.document.texture.anchorY ?? 0.5;
            sprite.anchor.set(anchorX, anchorY);
            sprite.position.set(token.center.x, token.center.y);
            sprite.width = token.w;
            sprite.height = token.h;
            sprite.rotation = Math.toRadians(token.document.rotation);
        }

        for (const [tokenId, sprite] of this.tokenSprites.entries()) {
            if (!currentTokenIds.has(tokenId)) {
                sprite.destroy();
                this.tokenSprites.delete(tokenId);
            }
        }

        renderer.render(this.tokenContainer, {
            renderTexture: this.renderTexture,
            transform: canvas.stage.transform.worldTransform,
            clear: true
        });
    }

    getMaskTexture() {
        return this.renderTexture;
    }

    destroy() {
        console.log("DynamicTokenMaskManager | Destroying.");
        Hooks.off("createToken", this._boundOnTokenChange);
        Hooks.off("deleteToken", this._boundOnTokenChange);
        Hooks.off("canvasPan", this._boundOnTokenChange);
        canvas.app.ticker.remove(this._boundOnAnimate);

        this.renderTexture?.destroy(true);
        for (const sprite of this.tokenSprites.values()) {
            sprite.destroy();
        }
        this.tokenSprites.clear();
        this.tokenContainer?.destroy({ children: true });
        this.renderTexture = null;
        this.tokenContainer = null;
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
                baseShine: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                noise: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                bloom: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                iridescence: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                heat: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                cloudShadows: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                postProcessing: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                },
                internal: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                },
                debug: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                }
            },
            textures: {
                specular: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                ambient: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                iridescence: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                groundGlow: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                heat: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                dust: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                outdoors: {
                    state: 'inactive',
                    message: 'No path specified.'
                }
            },
            pipelines: {
                noiseToShine: {
                    state: 'inactive',
                    message: 'Pipeline inactive.'
                },
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

    off(event, callback) {

        if (!this._callbacks[event]) {
            return;
        }

        this._callbacks[event] = this._callbacks[event].filter(cb => cb !== callback);
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
        return this._state[category]?.[key] || {
            state: 'error',
            message: 'Status key not found.'
        };
    }

    getAllStatuses() {
        return this._state;
    }

    evaluatePipelines() {
        if (!OVERLAY_CONFIG.baseShine.noise.enabled) {
            this.update('pipelines', 'noiseToShine', {
                state: 'disabled',
                message: 'Noise mask is disabled by user.'
            });
        } else if (this.getStatus('shaders', 'noise').state !== 'ok') {
            this.update('pipelines', 'noiseToShine', {
                state: 'error',
                message: 'Pipeline broken: Noise shader failed to compile.'
            });
        } else {
            this.update('pipelines', 'noiseToShine', {
                state: 'ok',
                message: 'Pipeline active: Noise mask is modulating the shine pattern.'
            });
        }
    }
}

const systemStatus = new SystemStatusManager();

class TextureAutoLoader {
    static SUFFIX_MAP = {
        specular: "_Specular",
        ambient: "_Ambient",
        iridescence: "_Iridescence",
        groundGlow: "_GroundGlow",
        heat: "_Heat",
        dust: "_Dust",
        outdoors: "_Outdoors"
    };

    async discoverAllTargets() {
        const results = {
            background: null,
            tiles: new Map()
        };
        const backgroundTarget = await this._processSceneBackground();
        if (backgroundTarget) {
            results.background = backgroundTarget;
        }
        for (const tile of canvas.tiles.placeables) {
            const tileTarget = await this._processTile(tile);
            if (tileTarget) {
                results.tiles.set(tile.id, tileTarget);
            }
        }
        console.log("MapShine | Full Texture Discovery Results:", results);
        return results;
    }

    async _processSceneBackground() {
        const bgSrc = canvas.scene?.background.src;
        if (!bgSrc) {
            console.info("MapShine | No scene background texture found.");
            return null;
        }
        const targetData = await this._findSuffixesForBaseTexture(bgSrc);

        targetData.baseTexturePath = bgSrc;
        targetData.rect = canvas.scene.dimensions.sceneRect;
        return targetData;
    }

    async _processTile(tile) {
        const tileSrc = tile.document.texture.src;
        if (!tileSrc) return null;

        const suffixData = await this._findSuffixesForBaseTexture(tileSrc);
        const hasEffectMap = Object.values(suffixData).some(path => path && typeof path === 'string');

        if (hasEffectMap) {

            return {
                tile,
                baseTexturePath: tileSrc,
                rect: {
                    x: tile.document.x,
                    y: tile.document.y,
                    width: tile.document.width,
                    height: tile.document.height,
                    rotation: tile.document.rotation * (Math.PI / 180),
                },
                ...suffixData
            };
        }
        return null;
    }

    async _findSuffixesForBaseTexture(baseTexturePath) {
        const discoveredPaths = {};
        Object.keys(TextureAutoLoader.SUFFIX_MAP).forEach(key => discoveredPaths[key] = null);
        const cleanPath = decodeURIComponent(baseTexturePath);
        const lastSlash = cleanPath.lastIndexOf('/');
        const directory = cleanPath.substring(0, lastSlash);
        const filename = cleanPath.substring(lastSlash + 1);
        const lastDot = filename.lastIndexOf('.');
        const baseName = filename.substring(0, lastDot);
        const extension = filename.substring(lastDot);

        if (!baseName || !directory) return discoveredPaths;

        let filesInDir = [];
        try {
            const source = game.settings.get("core", "noCanvas") ? "public" : "data";
            filesInDir = (await foundry.applications.apps.FilePicker.implementation.browse(source, directory)).files;
        } catch (e) {
            console.warn(`MapShine | Could not browse directory "${directory}" for base texture "${baseName}".`, e);
            return discoveredPaths;
        }

        for (const [key, suffix] of Object.entries(TextureAutoLoader.SUFFIX_MAP)) {
            const expectedFilename = `${baseName}${suffix}${extension}`;
            const foundFile = filesInDir.find(fullPath => {
                const fNameOnly = decodeURIComponent(fullPath).substring(fullPath.lastIndexOf('/') + 1);
                return fNameOnly.toLowerCase() === expectedFilename.toLowerCase();
            });
            if (foundFile) discoveredPaths[key] = foundFile;
        }
        return discoveredPaths;
    }
}

class ScreenEffectsManager {
    static _filters = new Map();
    static _container = null;

    static initialize(container) {
        if (!this._container) {
            this._container = container;
        }
    }

    static addFilter(key, filter) {
        if (!this._container) return;
        this.removeFilter(key);
        this._filters.set(key, filter);
        this._updateContainerFilters();
    }

    static getFilter(key) {
        return this._filters.get(key);
    }

    static removeFilter(key) {
        if (!this._container || !this._filters.has(key)) return;
        const filter = this._filters.get(key);
        filter?.destroy();
        this._filters.delete(key);
        this._updateContainerFilters();
    }

    static _updateContainerFilters() {
        if (!this._container) return;

        const filterClasses = [HeatDistortionFilter, VignetteFilter, LensDistortionFilter, ChromaticAberrationFilter, ColorCorrectionFilter];

        const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
        if (BloomFilterConstructor) {
            filterClasses.push(BloomFilterConstructor);
        }

        const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
        if (TiltShiftFilterConstructor) {
            filterClasses.push(TiltShiftFilterConstructor);
        }

        const otherFilters = (this._container.filters || []).filter(f => !filterClasses.some(cls => f instanceof cls));

        const newFilters = [
            ...otherFilters,
            ...Array.from(this._filters.values())
        ];
        this._container.filters = newFilters.length > 0 ? newFilters : null;
    }

    static setupAllGlobalFilters() {
        const ppErrors = [];
        const heatErrors = [];

        try {
            this.addFilter('heatDistortion', new HeatDistortionFilter());
        } catch (e) {
            heatErrors.push('HeatDistortion');
            console.error("MapShine | Failed to compile HeatDistortionFilter", e);
        }

        systemStatus.update('shaders', 'heat', {
            state: heatErrors.length === 0 ? 'ok' : 'error',
            message: heatErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${heatErrors.join(', ')}`
        });

        try {
            this.addFilter('vignette', new VignetteFilter());
        } catch (e) {
            ppErrors.push('Vignette');
        }
        try {
            this.addFilter('lensDistortion', new LensDistortionFilter());
        } catch (e) {
            ppErrors.push('LensDistortion');
        }
        try {
            this.addFilter('chromaticAberration', new ChromaticAberrationFilter());
        } catch (e) {
            ppErrors.push('ChromaticAberration (Post)');
        }
        try {
            this.addFilter('colorCorrection', new ColorCorrectionFilter());
        } catch (e) {
            ppErrors.push('ColorCorrection');
        }

        try {
            const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);

            if (BloomFilterConstructor) {
                const bloomFilter = new BloomFilterConstructor(OVERLAY_CONFIG.advancedBloom);
                this.addFilter('advancedBloom', bloomFilter);
                console.log("MapShine | AdvancedBloomFilter created successfully from bundled library.");
            } else {
                const errorMsg = "Could not find PIXI.filters.AdvancedBloomFilter. The bundled script may have failed to load.";
                console.error(`MapShine | ${errorMsg}`);
                ppErrors.push('AdvancedBloom (Bundling Failed)');
            }
        } catch (e) {
            console.error("MapShine | Failed to create AdvancedBloomFilter instance:", e);
            ppErrors.push('AdvancedBloom (Creation Failed)');
        }

        try {
            const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
            if (TiltShiftFilterConstructor) {
                const tiltShiftFilter = new TiltShiftFilterConstructor();
                this.addFilter('tiltShift', tiltShiftFilter);
                console.log("MapShine | TiltShiftFilter created successfully from bundled library.");
            } else {
                const errorMsg = "Could not find PIXI.filters.TiltShiftFilter. The bundled script may have failed to load.";
                console.error(`MapShine | ${errorMsg}`);
                ppErrors.push('TiltShift (Bundling Failed)');
            }
        } catch (e) {
            console.error("MapShine | Failed to create TiltShiftFilter instance:", e);
            ppErrors.push('TiltShift (Creation Failed)');
        }

        systemStatus.update('shaders', 'postProcessing', {
            state: ppErrors.length === 0 ? 'ok' : 'error',
            message: ppErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${ppErrors.join(', ')}`
        });
    }

    static updateAllFiltersFromConfig(config) {
        const pp = config.postProcessing;
        const ab = config.advancedBloom;

        const advancedBloomFilter = this.getFilter('advancedBloom');
        const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
        if (advancedBloomFilter && BloomFilterConstructor && advancedBloomFilter instanceof BloomFilterConstructor) {
            advancedBloomFilter.enabled = config.enabled && pp.enabled && ab.enabled;
            advancedBloomFilter.threshold = ab.threshold;
            advancedBloomFilter.bloomScale = ab.bloomScale;
            advancedBloomFilter.brightness = ab.brightness;
            advancedBloomFilter.blur = ab.blur;
            advancedBloomFilter.quality = ab.quality;
        }

        const tiltShiftFilter = this.getFilter('tiltShift');
        const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
        if (tiltShiftFilter && TiltShiftFilterConstructor && tiltShiftFilter instanceof TiltShiftFilterConstructor) {
            const tsConfig = pp.tiltShift;
            tiltShiftFilter.enabled = config.enabled && pp.enabled && tsConfig.enabled;
            tiltShiftFilter.blur = tsConfig.blur;
            tiltShiftFilter.gradientBlur = tsConfig.gradientBlur;

            const screen = canvas.app.screen;
            if (tiltShiftFilter.start) {
                tiltShiftFilter.start.x = tsConfig.startX * screen.width;
                tiltShiftFilter.start.y = tsConfig.startY * screen.height;
            }
            if (tiltShiftFilter.end) {
                tiltShiftFilter.end.x = tsConfig.endX * screen.width;
                tiltShiftFilter.end.y = tsConfig.endY * screen.height;
            }
        }

        const vignetteFilter = this.getFilter('vignette');
        if (vignetteFilter instanceof VignetteFilter) {
            vignetteFilter.enabled = config.enabled && pp.enabled && pp.vignette.enabled;
            vignetteFilter.amount = pp.vignette.amount;
            vignetteFilter.softness = pp.vignette.softness;
        }

        const lensDistortionFilter = this.getFilter('lensDistortion');
        if (lensDistortionFilter instanceof LensDistortionFilter) {
            lensDistortionFilter.enabled = config.enabled && pp.enabled && pp.lensDistortion.enabled;
            lensDistortionFilter.amount = pp.lensDistortion.amount;
            lensDistortionFilter.center = [pp.lensDistortion.centerX, pp.lensDistortion.centerY];
        }

        const caFilter = this.getFilter('chromaticAberration');
        if (caFilter instanceof ChromaticAberrationFilter) {
            caFilter.enabled = config.enabled && pp.enabled && pp.chromaticAberration.enabled;
            caFilter.amount = pp.chromaticAberration.amount;
            caFilter.center = [pp.chromaticAberration.centerX, pp.chromaticAberration.centerY];
        }

        const ccFilter = this.getFilter('colorCorrection');
        if (ccFilter instanceof ColorCorrectionFilter) {
            const ccConfig = pp.colorCorrection;
            ccFilter.enabled = config.enabled && pp.enabled && ccConfig.enabled;

            const u = ccFilter.uniforms;
            u.uSaturation = ccConfig.saturation;
            u.uBrightness = ccConfig.brightness;
            u.uContrast = ccConfig.contrast;
            u.uInvert = ccConfig.invert;
            u.uExposure = ccConfig.exposure;
            u.uGamma = ccConfig.gamma;
            u.uInBlack = ccConfig.levels.inBlack;
            u.uInWhite = ccConfig.levels.inWhite;
            u.uTemperature = ccConfig.whiteBalance.temperature;
            u.uWbTint = ccConfig.whiteBalance.tint;
            u.uTintColor = hexToRgbArray(ccConfig.tint.color);
            u.uTintAmount = ccConfig.tint.amount;
            u.uSelectiveEnabled = ccConfig.selective.enabled;
            u.uSelectiveColor = hexToRgbArray(ccConfig.selective.color);
            u.uSelectiveHueRange = ccConfig.selective.hueRange;
            u.uSelectiveSatRange = ccConfig.selective.saturationRange;
        }
    }

    static tearDown() {
        if (!this._container) return;
        this._filters.forEach(filter => filter.destroy());
        this._filters.clear();
        this._updateContainerFilters();
        this._container = null;
    }
}

class NoiseTextureManager {
    constructor(renderer, configPath) { 
        this.configPath = configPath; 

        const screen = renderer.screen;
        this.renderTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height,
            scaleMode: PIXI.SCALE_MODES.LINEAR
        });
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.filter = null;
    }

    resize(renderer) {
        if (!this.renderTexture || !this.sourceSprite) return;
        const screen = renderer.screen;
        this.renderTexture.resize(screen.width, screen.height, true);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
    }

    updateFromConfig(config) {
        const n = foundry.utils.getProperty(config, this.configPath);
        if (!n) return;

        if (!this.filter) {
            try {
                this.filter = new NoisePatternFilter({
                    u_time: 0.0,
                    u_camera_offset: [0, 0],
                    u_view_size: [0, 0]
                });
                systemStatus.update('shaders', 'noise', {
                    state: 'ok',
                    message: 'Compiled successfully.'
                });
            } catch (err) {
                console.error("MaterialToolkit | Failed to compile NoisePatternFilter!", err);
                systemStatus.update('shaders', 'noise', {
                    state: 'error',
                    message: `Compilation failed: ${err.message}`
                });
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

        u.u_evolution = n.evolution ?? 0.0; 

        this.sourceSprite.filters = this.filter ? [this.filter] : [];
    }

    update(deltaTime, renderer) {
        if (!this.filter || !this.sourceSprite || !this.renderTexture || !canvas?.stage) return;
        this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + deltaTime;

        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });

        this.filter.uniforms.u_camera_offset = [topLeft.x, topLeft.y];
        this.filter.uniforms.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        this.filter.uniforms.u_canvas_scale = stage.scale.x;

        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });
    }

    getTexture() {
        return this.renderTexture;
    }

    destroy() {
        this.filter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture?.destroy(true);
    }
}

class MaskGenerator {
    constructor() {
        const screen = canvas.app.screen;

        this.renderTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });

        this.maskFilter = new LuminanceMaskFilter();

        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.sourceSprite.filters = [this.maskFilter];
    }

    update(renderer, illuminationTexture, threshold, softness) {
        if (!this.sourceSprite || !illuminationTexture) return;

        this.sourceSprite.texture = illuminationTexture;

        this.maskFilter.uniforms.uLuminanceThreshold = threshold;
        this.maskFilter.uniforms.uSoftness = softness;

        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });
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

class AmbientMaskManager {
    constructor() {
        console.log("AmbientMaskManager | Initializing.");
        this.maskGenerator = new LightingMaskGenerator();
        this.maskSprite = new PIXI.Sprite(this.maskGenerator.getMaskTexture());

        this._tickerFunction = this.update.bind(this);
        canvas.app.ticker.add(this._tickerFunction);

        this._onResizeBound = this._onResize.bind(this);
        window.addEventListener('resize', this._onResizeBound);
    }

    destroy() {
        console.log("AmbientMaskManager | Destroying.");
        canvas.app.ticker.remove(this._tickerFunction);
        window.removeEventListener('resize', this._onResizeBound);

        this.maskGenerator?.destroy();
        this.maskSprite?.destroy();
    }

    _onResize() {
        if (this.maskGenerator) {
            const screen = canvas.app.screen;
            this.maskGenerator.resize(screen.width, screen.height);
        }
        this.update();
    }

    update() {
        const ambientLayer = canvas.layers.find(l => l instanceof AmbientLayer);
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;

        const mConfig = OVERLAY_CONFIG.ambient.masking;
        const shouldBeEnabled = mConfig.enabled && ambientLayer?.visible && !!illuminationAPI;

        if (!shouldBeEnabled) {
            if (ambientLayer && ambientLayer.mask) {

                ambientLayer.mask = null;
            }
            return;
        }

        const illuminationTexture = illuminationAPI.getLightingTexture();
        if (!illuminationTexture?.valid) {
            if (ambientLayer.mask) ambientLayer.mask = null;
            return;
        }

        this.maskGenerator.update(
            canvas.app.renderer,
            illuminationTexture,
            mConfig.threshold,
            mConfig.softness,
            true 
        );

        if (ambientLayer.mask !== this.maskSprite) {
            ambientLayer.mask = this.maskSprite;
        }

        const stage = canvas.stage;
        const screen = canvas.app.renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        this.maskSprite.position.copyFrom(topLeft);
        this.maskSprite.width = screen.width / stage.scale.x;
        this.maskSprite.height = screen.height / stage.scale.y;
    }
}

class BackgroundLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();

        this.effectSprites = new Map();
        this._onResizeBound = this._onResize.bind(this);
    }

    async _draw(options) {
        console.log("BackgroundLayer | Drawing layer.");

        this.container = new PIXI.Container();
        this.addChild(this.container);

        window.addEventListener('resize', this._onResizeBound);
    }

    async updateEffectTargets(targets) {
        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {

            if (!targetData?.baseTexturePath) continue;

            validTargetIds.add(id);
            let sprite = this.effectSprites.get(id);

            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.effectSprites.set(id, sprite);
                this.container.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.baseTexturePath, targetData.rect);
        }

        for (const [id, sprite] of this.effectSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.effectSprites.delete(id);
            }
        }
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }

        if (!sprite.texture.valid || !rect) return;

        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _onResize() {
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }

    async _tearDown(options) {
        console.log("BackgroundLayer | Tearing down layer.");
        Hooks.off('canvasPan', this._onResizeBound);
        window.removeEventListener('resize', this._onResizeBound);
        super._tearDown(options);
        this.effectSprites.clear();
    }
}

class IridescenceLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.targetContainers = new Map();
        this.patternLayer = null; 

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
    }

    async _draw(options) {
        console.log("IridescenceLayer | Drawing with pre-rendered pattern texture.");

        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);
    }

    async updateEffectTargets(targets) {
        if (!this.visible || !this.patternLayer) {

            for (const container of this.targetContainers.values()) {
                container.destroy({ children: true });
            }
            this.targetContainers.clear();
            return;
        }

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.iridescence) continue;

            validTargetIds.add(id);
            let container = this.targetContainers.get(id);

            if (!container) {
                container = new PIXI.Container();

                container.effectSprite = new PIXI.Sprite(this.patternLayer.getPatternTexture());

                container.maskSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                container.addChild(container.effectSprite);
                container.addChild(container.maskSprite);
                container.mask = container.maskSprite;

                container.targetRect = targetData.rect;

                this.targetContainers.set(id, container);
                this.addChild(container);
            } else {

                 container.targetRect = targetData.rect;
            }

            await this._updateSpriteTexture(container.maskSprite, targetData.iridescence);

        }

        for (const [id, container] of this.targetContainers.entries()) {
            if (!validTargetIds.has(id)) {
                container.destroy({ children: true });
                this.targetContainers.delete(id);
            }
        }
    }

    async _updateSpriteTexture(sprite, texturePath) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath, { fallback: "icons/svg/hazard.svg" });
            } catch (e) { console.error(`IridescenceLayer | Failed to load mask texture: ${texturePath}`, e); }
        }
    }

    _updateContainerAndSpriteTransforms(container, rect) {
        if (!rect) return;
        container.position.set(0, 0);

        const mask = container.maskSprite;
        if (mask.texture.valid) {
            mask.anchor.set(0.5);
            mask.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
            mask.width = rect.width;
            mask.height = rect.height;
            mask.rotation = rect.rotation || 0;
        }

        const effect = container.effectSprite;
        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        effect.position.copyFrom(topLeft);
        effect.width = screen.width / stage.scale.x;
        effect.height = screen.height / stage.scale.y;
    }

    async updateFromConfig(config) {
        const iConfig = config.iridescence;
        this.visible = config.enabled && iConfig.enabled;

        for (const container of this.targetContainers.values()) {
            container.visible = this.visible;
        }

        if (!this.visible) return;
        this.blendMode = iConfig.blendMode;
    }

    _onAnimate(deltaTime) {
        if (!this.visible) return;

        for (const container of this.targetContainers.values()) {
             this._updateContainerAndSpriteTransforms(container, container.targetRect);
        }
    }

    _onResize() {
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }

    async _tearDown(options) {
        console.log("IridescenceLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);
        super._tearDown(options);
        this.targetContainers.clear();
    }
}

class IridescencePatternLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.renderTexture = null;
        this.sourceSprite = null;
        this.iridescenceFilter = null;
        this.distortionNoiseManager = null;

        this._needsUpdate = true;

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onPanBound = this._onPan.bind(this);
    }

    getPatternTexture() {
        return this.renderTexture;
    }

    async _draw(options) {
        this.visible = false;
        this.interactive = false;

        const renderer = canvas.app.renderer;
        this.renderTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'iridescence.noise');
        this.distortionNoiseManager.updateFromConfig(OVERLAY_CONFIG);

        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = renderer.screen.width;
        this.sourceSprite.height = renderer.screen.height;

        this._setupFilters();
        this.sourceSprite.filters = this.iridescenceFilter ? [this.iridescenceFilter] : [];

        canvas.app.ticker.add(this._onAnimateBound);
        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    _setupFilters() {
        const iConfig = OVERLAY_CONFIG.iridescence;
        const gConfig = iConfig.gradient;
        const gradientData = GRADIENT_PRESETS[gConfig.name];

        let initialGradientColors = [];
        let initialNumColors = 0;

        if (gradientData) {
            initialGradientColors = gradientData.colors.flatMap(hex => hexToRgbArray(hex));
            initialNumColors = gradientData.colors.length;
        }

        const initialUniforms = {
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [canvas.app.screen.width, canvas.app.screen.height],
            u_speed: iConfig.speed,
            u_scale: iConfig.scale,
            u_intensity: iConfig.intensity,
            u_noise_amount: iConfig.noiseAmount,
            u_distortionMap: PIXI.Texture.EMPTY,
            u_distortionStrength: iConfig.distortion.enabled ? iConfig.distortion.strength : 0.0,
            u_gradientColors: initialGradientColors,
            u_numColors: initialNumColors,
            u_hueShift: gConfig.hueShift,
            u_brightness: gConfig.brightness,
            u_contrast: gConfig.contrast,
        };

        try {

            this.iridescenceFilter = new IridescenceFilter();
            Object.assign(this.iridescenceFilter.uniforms, initialUniforms);

            systemStatus.update('shaders', 'iridescence', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("IridescencePatternLayer | Failed to create IridescenceFilter", e);
            systemStatus.update('shaders', 'iridescence', {
                state: 'error',
                message: `Compilation failed: ${e.message}`
            });
            this.iridescenceFilter = null;
        }
    }

    async _tearDown(options) {
        canvas.app.ticker.remove(this._onAnimateBound);
        Hooks.off('canvasPan', this._onPanBound);
        this.renderTexture?.destroy(true);
        this.sourceSprite?.destroy();
        this.iridescenceFilter?.destroy();
        this.distortionNoiseManager?.destroy();
    }

    async updateFromConfig(config) {
        this.distortionNoiseManager?.updateFromConfig(config);

        const iConfig = config.iridescence;
        if (!this.iridescenceFilter) return;

        const u = this.iridescenceFilter.uniforms;
        u.u_intensity = iConfig.intensity;
        u.u_speed = iConfig.speed;
        u.u_noise_amount = iConfig.noiseAmount;
        u.u_scale = iConfig.scale;
        u.u_distortionStrength = iConfig.distortion.enabled ? iConfig.distortion.strength : 0.0;

        const gConfig = iConfig.gradient;
        const gradientData = GRADIENT_PRESETS[gConfig.name];
        if (gradientData) {
            u.u_gradientColors = gradientData.colors.flatMap(hex => hexToRgbArray(hex));
            u.u_numColors = gradientData.colors.length;
        }
        u.u_hueShift = gConfig.hueShift;
        u.u_brightness = gConfig.brightness;
        u.u_contrast = gConfig.contrast;

        this._needsUpdate = true;
    }

    _onPan() {
        this._needsUpdate = true;
    }

    _onAnimate(deltaTime) {
        if (!this.iridescenceFilter) return;

        const renderer = canvas.app.renderer;

        this.iridescenceFilter.uniforms.u_time = (this.iridescenceFilter.uniforms.u_time || 0) + deltaTime;

        const iConfig = OVERLAY_CONFIG.iridescence;
        const noiseConfig = iConfig.noise || {};
        const shouldAnimate = iConfig.enabled && (iConfig.speed !== 0 || noiseConfig.speed !== 0);

        if (!this._needsUpdate && !shouldAnimate) return;

        this.distortionNoiseManager.update(deltaTime, renderer);
        this.iridescenceFilter.uniforms.u_distortionMap = this.distortionNoiseManager.getTexture() || PIXI.Texture.EMPTY;

        if (this._needsUpdate) {
            const stage = canvas.stage;
            const screen = renderer.screen;
            const topLeft = stage.toLocal({ x: 0, y: 0 });
            const u = this.iridescenceFilter.uniforms;
            u.u_camera_offset = [topLeft.x, topLeft.y];
            u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        }

        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });

        this._needsUpdate = false;
    }
}

class GroundGlowLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.effectSprites = new Map();
        this.maskGenerator = null;
        this.lightingMask = null;
        this.colorFilter = null;
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
    }

    async _draw(options) {
        console.log("GroundGlowLayer | Drawing layer with corrected per-tile support.");
        this.maskGenerator = new LightingMaskGenerator();
        this.colorFilter = new AmbientColorFilter();
        this.container = new PIXI.Container();
        this.addChild(this.container);
        this.lightingMask = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
        this.container.mask = this.lightingMask;
        this._onResize();
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound, this);
    }

    async _tearDown(options) {
        console.log("GroundGlowLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound, this);
        window.removeEventListener('resize', this._onResizeBound);
        this.maskGenerator?.destroy();
        this.lightingMask?.destroy();
        this.container?.destroy({
            children: true,
            texture: true
        });
        this.effectSprites.clear();
        this.colorFilter?.destroy();
        this.maskGenerator = this.container = this.lightingMask = this.colorFilter = null;
        return super._tearDown(options);
    }

    async updateEffectTargets(targets) {
        if (!this.container) return;

        const ggConfig = OVERLAY_CONFIG.groundGlow;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const isEffectivelyEnabled = OVERLAY_CONFIG.enabled && ggConfig.enabled && !!illuminationAPI;

        if (!isEffectivelyEnabled) {
            if (this.effectSprites.size > 0) {
                for (const sprite of this.effectSprites.values()) {
                    sprite.destroy();
                }
                this.effectSprites.clear();
            }
            this.container.visible = false;
            this.visible = false;
            return;
        }

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.groundGlow) continue;
            validTargetIds.add(id);
            let sprite = this.effectSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                sprite.filters = [this.colorFilter];
                this.effectSprites.set(id, sprite);
                this.container.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.groundGlow, targetData.rect);
        }

        for (const [id, sprite] of this.effectSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.effectSprites.delete(id);
            }
        }

        await this.updateFromConfig(OVERLAY_CONFIG);
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _updateMaskTransform() {
        if (!this.lightingMask || !canvas?.stage) return;
        const stage = canvas.stage;
        const screen = canvas.app.renderer.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        this.lightingMask.position.copyFrom(topLeft);
        this.lightingMask.width = screen.width / stage.scale.x;
        this.lightingMask.height = screen.height / stage.scale.y;
    }

    _onAnimate() {
        const ggConfig = OVERLAY_CONFIG.groundGlow;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        if (!this.visible || !this.maskGenerator || !illuminationAPI) return;
        if (this.colorFilter) {
            const tmConfig = ggConfig.tokenMasking;
            const u = this.colorFilter.uniforms;
            u.uTokenMaskEnabled = tmConfig.enabled && !!game.mapShine.tokenMaskManager;
            if (u.uTokenMaskEnabled) {
                u.uTokenMask = game.mapShine.tokenMaskManager.getMaskTexture();
            }
        }
        this.maskGenerator.update(
            canvas.app.renderer,
            illuminationAPI.getLightingTexture(),
            ggConfig.luminanceThreshold,
            ggConfig.softness,
            ggConfig.invert
        );
        this._updateMaskTransform();
    }

    async updateFromConfig(config) {
        if (!this.container || !this.colorFilter) return;
        const ggConfig = config.groundGlow;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        this.visible = config.enabled && ggConfig.enabled && !!illuminationAPI;
        this.container.visible = this.visible;
        if (!this.visible) return;
        this.container.blendMode = ggConfig.blendMode;
        const u = this.colorFilter.uniforms;
        u.u_intensity = ggConfig.intensity;
        u.uBrightness = ggConfig.brightness - 1.0;
        u.uSaturation = ggConfig.saturation;
        u.uContrast = 1.0;
        u.uGamma = 1.0;
        u.uTintAmount = 0.0;
        u.uTokenMaskThreshold = ggConfig.tokenMasking.threshold;
        for (const sprite of this.effectSprites.values()) {
            sprite.alpha = 1.0;
        }
    }

    _onResize() {
        this.maskGenerator?.resize(canvas.app.screen.width, canvas.app.screen.height);
        this._updateMaskTransform();
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }
}

class MetallicShineLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.shineContainer = null;
        this.bloomContainer = null;
        this.starburstContainer = null;

        this.shineSprites = new Map();
        this.bloomSprites = new Map();
        this.starburstSprites = new Map();

        this.shineFilter = null;
        this.thresholdFilter = null;
        this.blurFilter = null;
        this.bloomBrightnessFilter = null;
        this.chromaticAberrationFilter = null;
        this.starburstFilter = null;

        this._onResizeBound = this._onResize.bind(this);
        this._onAnimateBound = this._onAnimate.bind(this);
    }

    async _draw(options) {
        console.log("MetallicShineLayer | Drawing layer with OPTIMIZED container-level starburst pass.");
        this.container = new PIXI.Container();
        this.addChild(this.container);

        this.shineContainer = new PIXI.Container();
        this.container.addChild(this.shineContainer);

        this.bloomContainer = new PIXI.Container();
        this.container.addChild(this.bloomContainer);

        this.starburstContainer = new PIXI.Container();
        this.container.addChild(this.starburstContainer);

        const patternLayer = canvas.layers.find(l => l instanceof ProceduralPatternLayer);
        if (!patternLayer) {
            console.error("MapShine | ProceduralPatternLayer not found. Metallic shine cannot function.");
            return;
        }
        const patternTexture = patternLayer.getPatternTexture();

        try {
            this.shineFilter = new MetallicShineFilter({
                shinePatternTexture: patternTexture,
                boost: OVERLAY_CONFIG.baseShine.animation.globalIntensity,
            });
            this.thresholdFilter = new ThresholdFilter();
            this.blurFilter = new PIXI.BlurFilter();
            this.bloomBrightnessFilter = new PIXI.ColorMatrixFilter();
            this.chromaticAberrationFilter = new ChromaticAberrationFilter();
            this.starburstFilter = new StarburstFilter();
        } catch (e) {
            console.error("MapShine | Failed to create shine/bloom/starburst filters.", e);
        }

        this.bloomContainer.filters = [this.bloomBrightnessFilter, this.chromaticAberrationFilter].filter(f => f);
        this.starburstContainer.filters = [this.starburstFilter].filter(f => f);

        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
    }

    _onAnimate() {
        if (!this.visible || !this.shineFilter) return;
        const patternLayer = canvas.layers.find(l => l instanceof ProceduralPatternLayer);
        if (patternLayer) {
            const patternTexture = patternLayer.getPatternTexture();
            this.shineFilter.uniforms.uShinePatternMap = patternTexture;
        }
    }

    async updateEffectTargets(targets) {
        if (!this.visible) return;
        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.specular) continue;
            validTargetIds.add(id);

            let shineSprite = this.shineSprites.get(id);
            if (!shineSprite) {
                shineSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                shineSprite.filters = [this.shineFilter];
                this.shineSprites.set(id, shineSprite);
                this.shineContainer.addChild(shineSprite);
            }
            await this._updateSpriteTexture(shineSprite, targetData.specular);
            this._updateSpriteTransform(shineSprite, targetData.rect);

            let bloomSprite = this.bloomSprites.get(id);
            if (!bloomSprite) {
                bloomSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                bloomSprite.filters = [this.shineFilter, this.thresholdFilter, this.blurFilter];
                this.bloomSprites.set(id, bloomSprite);
                this.bloomContainer.addChild(bloomSprite);
            }
            await this._updateSpriteTexture(bloomSprite, targetData.specular);
            this._updateSpriteTransform(bloomSprite, targetData.rect);

            let starburstSprite = this.starburstSprites.get(id);
            if (!starburstSprite) {
                starburstSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                starburstSprite.filters = [this.shineFilter];
                this.starburstSprites.set(id, starburstSprite);
                this.starburstContainer.addChild(starburstSprite);
            }
            await this._updateSpriteTexture(starburstSprite, targetData.specular);
            this._updateSpriteTransform(starburstSprite, targetData.rect);
        }

        for (const [id, sprite] of this.shineSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy({
                    children: true,
                    texture: true
                });
                this.shineSprites.delete(id);
            }
        }
        for (const [id, sprite] of this.bloomSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy({
                    children: true,
                    texture: true
                });
                this.bloomSprites.delete(id);
            }
        }
        for (const [id, sprite] of this.starburstSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy({
                    children: true,
                    texture: true
                });
                this.starburstSprites.delete(id);
            }
        }
    }

    async _updateSpriteTexture(sprite, texturePath) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }
    }

    _updateSpriteTransform(sprite, rect) {
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    async updateFromConfig(config) {
        const bs = config.baseShine;
        this.visible = config.enabled && bs.enabled;
        if (this.container) this.container.visible = this.visible;
        if (!this.visible) return;

        if (this.shineContainer) this.shineContainer.blendMode = PIXI.BLEND_MODES.ADD;
        if (this.bloomContainer) this.bloomContainer.blendMode = bs.compositing.layerBlendMode;
        if (this.shineFilter) this.shineFilter.uniforms.uBoost = bs.animation.globalIntensity;

        const bloomConfig = bs.shineBloom;
        if (this.thresholdFilter) {
            this.thresholdFilter.enabled = bloomConfig.enabled;
            this.thresholdFilter.threshold = bloomConfig.threshold;
        }
        if (this.blurFilter) {
            this.blurFilter.enabled = bloomConfig.enabled;
            this.blurFilter.strength = bloomConfig.blur;
            this.blurFilter.quality = bloomConfig.quality;
        }
        if (this.bloomBrightnessFilter) {
            this.bloomBrightnessFilter.brightness(bloomConfig.brightness, false);
        }
        if (this.chromaticAberrationFilter) {
            const rgbConfig = bs.rgbSplit;
            this.chromaticAberrationFilter.enabled = bloomConfig.enabled && rgbConfig.enabled;
            this.chromaticAberrationFilter.amount = rgbConfig.amount / 400;
        }
        if (this.bloomContainer) {
            this.bloomContainer.visible = bloomConfig.enabled;
        }

        const starburstConfig = bs.starburst;
        if (this.starburstContainer) {
            this.starburstContainer.visible = starburstConfig.enabled;
            this.starburstContainer.blendMode = starburstConfig.blendMode;
        }
        if (this.starburstFilter) {
            this.starburstFilter.enabled = starburstConfig.enabled;
            const u = this.starburstFilter.uniforms;
            u.u_threshold = starburstConfig.threshold;
            u.u_intensity = starburstConfig.intensity;
            u.u_angle_rad = starburstConfig.angle * (Math.PI / 180.0);
            u.u_points = Math.round(starburstConfig.points);
            u.u_size = starburstConfig.size;
            u.u_falloff = starburstConfig.falloff;
        }

        ScreenEffectsManager.updateAllFiltersFromConfig(config);
    }

    _onResize() {
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
        if (this.starburstFilter) {
            const renderer = canvas.app.renderer;
            this.starburstFilter.uniforms.u_texel_size = [1.0 / renderer.screen.width, 1.0 / renderer.screen.height];
        }
    }

    async _tearDown(options) {
        console.log("MetallicShineLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        ScreenEffectsManager.tearDown();
        window.removeEventListener('resize', this._onResizeBound);

        this.container?.destroy({
            children: true,
            texture: true
        });
        super._tearDown(options);
        this.shineSprites.clear();
        this.bloomSprites.clear();
        this.starburstSprites.clear();
    }
}

class CloudShadowsLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.cloudFilter = null;
        this.effectSprite = null;
        this.sourceContainer = null;
        this.combinedMaskTexture = null;
        this.maskSprites = new Map();
        this.maskBlurFilter = null;
        this.blurredMaskTexture = null;
        this.blurSourceSprite = null;

        this._needsMaskUpdate = true;

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);

        this._onPanBound = this._onPan.bind(this);
    }

    async _draw(options) {
        console.log("CloudShadowsLayer | Drawing layer.");

        const renderer = canvas.app.renderer;
        try {
            this.cloudFilter = new CloudShadowsFilter();
            systemStatus.update('shaders', 'cloudShadows', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to create CloudShadowsFilter.", e);
            systemStatus.update('shaders', 'cloudShadows', {
                state: 'error',
                message: `Compilation failed: ${e.message}`
            });
        }

        this.sourceContainer = new PIXI.Container();
        this.combinedMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.maskBlurFilter = new PIXI.BlurFilter();
        this.blurredMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.blurSourceSprite = new PIXI.Sprite(this.combinedMaskTexture);
        this.blurSourceSprite.filters = [this.maskBlurFilter];

        this.effectSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.effectSprite.width = renderer.screen.width;
        this.effectSprite.height = renderer.screen.height;
        this.effectSprite.filters = [this.cloudFilter].filter(f => f);
        this.addChild(this.effectSprite);

        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);

        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    _onPan() {
        this._needsMaskUpdate = true;
    }

    _onAnimate(deltaTime) {
        const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);

        if (!this.visible || !this.cloudFilter || !hasActiveMasks) {
            if (this.cloudFilter) this.cloudFilter.uniforms.uOutdoorsMask = PIXI.Texture.EMPTY;
            return;
        }

        if (this._needsMaskUpdate) {
            canvas.app.renderer.render(this.sourceContainer, {
                renderTexture: this.combinedMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });

            canvas.app.renderer.prepare.upload(this.combinedMaskTexture);

            if (this.maskBlurFilter?.enabled) {
                this.blurSourceSprite.texture = this.combinedMaskTexture;
                canvas.app.renderer.render(this.blurSourceSprite, {
                    renderTexture: this.blurredMaskTexture,
                    clear: true
                });
            }
            this._needsMaskUpdate = false; 
        }

        let finalMask = this.maskBlurFilter?.enabled ? this.blurredMaskTexture : this.combinedMaskTexture;

        const u = this.cloudFilter.uniforms;
        u.uOutdoorsMask = finalMask;
        u.u_time = (u.u_time || 0) + deltaTime;

        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });

        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
    }

    async updateEffectTargets(targets) {
        if (!this.sourceContainer) return;

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.outdoors) continue;
            validTargetIds.add(id);
            let sprite = this.maskSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.maskSprites.set(id, sprite);
                this.sourceContainer.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.outdoors, targetData.rect);
        }

        for (const [id, sprite] of this.maskSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy({
                    children: true,
                    texture: true
                });
                this.maskSprites.delete(id);
            }
        }

        this._needsMaskUpdate = true;
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    async updateFromConfig(config) {
        const csConfig = config.cloudShadows;
        this.visible = config.enabled && csConfig.enabled;
        if (!this.cloudFilter) return;

        this.blendMode = csConfig.blendMode;

        if (this.maskBlurFilter) {
            this.maskBlurFilter.blur = csConfig.maskBlur ?? 0.0;
            this.maskBlurFilter.enabled = this.maskBlurFilter.blur > 0;
        }

        const u = this.cloudFilter.uniforms;
        u.u_shadowIntensity = csConfig.shadowIntensity;

        const windAngleRad = (csConfig.wind.angle ?? 45.0) * (Math.PI / 180);
        const windSpeed = csConfig.wind.speed ?? 0.01;
        u.u_windDirection = [Math.cos(windAngleRad) * windSpeed, Math.sin(windAngleRad) * windSpeed];

        u.u_noise_scale = csConfig.noise.scale;
        u.u_noise_octaves = csConfig.noise.octaves;
        u.u_noise_persistence = csConfig.noise.persistence;
        u.u_noise_lacunarity = csConfig.noise.lacunarity;

        const s = csConfig.shading;
        u.u_shading_threshold = s.threshold;
        u.u_shading_softness = s.softness;
        u.u_shading_brightness = s.brightness;
        u.u_shading_contrast = s.contrast;
        u.u_shading_gamma = s.gamma;

        this._needsMaskUpdate = true;
    }

    _onResize() {
        const renderer = canvas.app.renderer;
        if (this.effectSprite) {
            const stage = canvas.stage;
            const screen = canvas.app.screen;
            const topLeft = stage.toLocal({
                x: 0,
                y: 0
            });
            this.effectSprite.position.copyFrom(topLeft);
            this.effectSprite.width = screen.width / stage.scale.x;
            this.effectSprite.height = screen.height / stage.scale.y;
        }
        this.combinedMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.blurredMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }

        this._needsMaskUpdate = true;
    }

    async _tearDown(options) {
        console.log("CloudShadowsLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);
        Hooks.off('canvasPan', this._onPanBound);

        this.cloudFilter?.destroy();
        this.effectSprite?.destroy();
        this.sourceContainer?.destroy({
            children: true,
            texture: true
        });
        this.combinedMaskTexture?.destroy(true);
        this.maskSprites.clear();
        this.maskBlurFilter?.destroy();
        this.blurSourceSprite?.destroy();
        this.blurredMaskTexture?.destroy(true);
        super._tearDown(options);
    }
}

class DustMotesLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.moteFilter = null;
        this.moteEffectSprite = null;
        this.dustSourceContainer = null;
        this.combinedDustMaskTexture = null;
        this.dustSprites = new Map();
        this.maskBlurFilter = null;
        this.blurredMaskTexture = null;
        this.maskSprite = null;
        this.postBlurFilter = null;

        this._needsMaskUpdate = true;

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        this._onPanBound = this._onPan.bind(this);
    }

    async _draw(options) {
        console.log("DustMotesLayer | Drawing layer with texture mask support.");

        const renderer = canvas.app.renderer;
        try {
            this.moteFilter = new DustMotesFilter();
        } catch (e) {
            console.error("MapShine | Failed to create DustMotesFilter.", e);
        }

        this.dustSourceContainer = new PIXI.Container();

        this.combinedDustMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height,
        });

        this.maskBlurFilter = new PIXI.BlurFilter();
        this.blurredMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height,
        });
        this.maskSprite = new PIXI.Sprite(this.combinedDustMaskTexture);
        this.maskSprite.filters = [this.maskBlurFilter];

        this.postBlurFilter = new PIXI.BlurFilter();

        this.moteEffectSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.moteEffectSprite.width = renderer.screen.width;
        this.moteEffectSprite.height = renderer.screen.height;
        this.moteEffectSprite.filters = [this.moteFilter, this.postBlurFilter].filter(f => f);
        this.addChild(this.moteEffectSprite);

        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);
        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    _onPan() {
        this._needsMaskUpdate = true;
    }

    _onAnimate(deltaTime) {
        const hasActiveDustSources = this.dustSprites.size > 0 && Array.from(this.dustSprites.values()).some(s => s.texture.valid);

        if (!this.visible || !this.moteFilter || !hasActiveDustSources) {
            if (this.moteFilter) this.moteFilter.uniforms.uDustMask = PIXI.Texture.EMPTY;
            return;
        }

        if (this._needsMaskUpdate) {
            canvas.app.renderer.render(this.dustSourceContainer, {
                renderTexture: this.combinedDustMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });

            canvas.app.renderer.prepare.upload(this.combinedDustMaskTexture);

            if (this.maskBlurFilter?.enabled) {
                this.maskSprite.texture = this.combinedDustMaskTexture;
                canvas.app.renderer.render(this.maskSprite, {
                    renderTexture: this.blurredMaskTexture,
                    clear: true
                });
            }
            this._needsMaskUpdate = false;
        }

        let finalDustMask = this.maskBlurFilter?.enabled ? this.blurredMaskTexture : this.combinedDustMaskTexture;

        const patternLayer = canvas.layers.find(l => l instanceof ProceduralPatternLayer);
        const shineTexture = patternLayer ? patternLayer.getPatternTexture() : PIXI.Texture.EMPTY;

        this.moteFilter.uniforms.uDustMask = finalDustMask;
        this.moteFilter.uniforms.uShinePatternMap = shineTexture;
        this.moteFilter.uniforms.u_time += deltaTime;

        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });

        const u = this.moteFilter.uniforms;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        this.moteEffectSprite.position.copyFrom(topLeft);
        this.moteEffectSprite.width = screen.width / stage.scale.x;
        this.moteEffectSprite.height = screen.height / stage.scale.y;
    }

    async updateEffectTargets(targets) {
        if (!this.dustSourceContainer) return;

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.dust) continue;
            validTargetIds.add(id);
            let sprite = this.dustSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.dustSprites.set(id, sprite);
                this.dustSourceContainer.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.dust, targetData.rect);
        }

        for (const [id, sprite] of this.dustSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy({ children: true, texture: true });
                this.dustSprites.delete(id);
            }
        }
        this._needsMaskUpdate = true;
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }

        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    async updateFromConfig(config) {
        const dmConfig = config.dustMotes;
        this.visible = config.enabled && dmConfig.enabled;

        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this.alpha = 1.0;

        if (this.moteEffectSprite) {
            this.moteEffectSprite.blendMode = PIXI.BLEND_MODES.ADD; 
            this.moteEffectSprite.alpha = 1.0; 
        }

        if (this.maskBlurFilter) {
            this.maskBlurFilter.blur = dmConfig.maskBlur ?? 4.0;
            this.maskBlurFilter.enabled = this.maskBlurFilter.blur > 0;
        }

        if (this.postBlurFilter) {
            const pbConfig = dmConfig.postBlur || {};
            this.postBlurFilter.enabled = this.visible && pbConfig.enabled;
            this.postBlurFilter.blur = pbConfig.blurAmount ?? 2.0;
            this.postBlurFilter.quality = pbConfig.quality ?? 4;
        }

        if (!this.moteFilter) return;

        const u = this.moteFilter.uniforms;
        u.u_global_intensity = dmConfig.intensity;
        u.u_shine_influence = dmConfig.shineInfluence;

        const numLayersToShow = Math.min(dmConfig.numLayers, dmConfig.layers.length, DustMotesFilter.MAX_DUST_LAYERS);
        u.u_num_active_layers = numLayersToShow;

        const degToRad = Math.PI / 180;

        for (let i = 0; i < DustMotesFilter.MAX_DUST_LAYERS; i++) {
            if (i < numLayersToShow) {
                const layerConfig = dmConfig.layers[i];
                if (!layerConfig) continue;
                u[`u_layer${i}_tintColor`] = hexToRgbArray(layerConfig.tintColor ?? "#FFFFFF");
                u[`u_layer${i}_scale`] = layerConfig.scale;
                u[`u_layer${i}_density`] = layerConfig.density;
                u[`u_layer${i}_size`] = layerConfig.size;
                u[`u_layer${i}_size_randomness`] = layerConfig.sizeRandomness ?? 0.0;
                u[`u_layer${i}_twinkleSpeed`] = layerConfig.twinkleSpeed;
                u[`u_layer${i}_aspect`] = [layerConfig.aspect.width, layerConfig.aspect.height];

                const driftConfig = layerConfig.drift ?? {};
                const driftAngleRad = (driftConfig.angle ?? 0) * degToRad;
                u[`u_layer${i}_drift_dir`] = [Math.cos(driftAngleRad), Math.sin(driftAngleRad)];
                u[`u_layer${i}_drift_speed`] = driftConfig.speed ?? 0;

                const turbConfig = layerConfig.turbulence ?? {};
                u[`u_layer${i}_turbulence_enabled`] = turbConfig.enabled ?? false;
                u[`u_layer${i}_turbulence_speed`] = turbConfig.speed ?? 0;
                u[`u_layer${i}_turbulence_scale`] = turbConfig.scale ?? 0;
                u[`u_layer${i}_turbulence_magnitude`] = turbConfig.magnitude ?? 0;

                const visConfig = layerConfig.visibility ?? {};
                u[`u_layer${i}_visibility_duration`] = visConfig.cycleDuration ?? 0.0;
                u[`u_layer${i}_visibility_fraction`] = visConfig.visibleFraction ?? 1.0;
            } else {
                u[`u_layer${i}_density`] = 0.0;
            }
        }
        this._needsMaskUpdate = true;
    }

    _onResize() {
        const renderer = canvas.app.renderer;
        if (this.moteEffectSprite) {
            const stage = canvas.stage;
            const screen = canvas.app.screen;
            const topLeft = stage.toLocal({ x: 0, y: 0 });
            this.moteEffectSprite.position.copyFrom(topLeft);
            this.moteEffectSprite.width = screen.width / stage.scale.x;
            this.moteEffectSprite.height = screen.height / stage.scale.y;
        }

        if (this.moteFilter) {
            this.moteFilter.uniforms.u_resolution = [renderer.screen.width, renderer.screen.height];
        }

        this.combinedDustMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.blurredMaskTexture?.resize(renderer.screen.width, renderer.screen.height);

        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
        this._needsMaskUpdate = true;
    }

    async _tearDown(options) {
        console.log("DustMotesLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);
        Hooks.off('canvasPan', this._onPanBound);

        this.moteFilter?.destroy();
        this.moteEffectSprite?.destroy();
        this.dustSourceContainer?.destroy({ children: true, texture: true, baseTexture: true });
        this.combinedDustMaskTexture?.destroy(true);
        this.dustSprites.clear();
        this.maskBlurFilter?.destroy();
        this.maskSprite?.destroy();
        this.blurredMaskTexture?.destroy(true);
        this.postBlurFilter?.destroy();

        super._tearDown(options);
    }
}

class AmbientLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.effectSprites = new Map();
        this.colorFilter = null;

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
    }

    async _draw(options) {
        console.log("AmbientLayer | Drawing layer.");

        this.colorFilter = new AmbientColorFilter();

        this.blendMode = PIXI.BLEND_MODES.NORMAL;

        this._onResize(); 
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
    }

    async _tearDown(options) {
        console.log("AmbientLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);

        this.colorFilter?.destroy();

        super._tearDown(options); 
        this.effectSprites.clear();
    }

    _onAnimate() {
        if (!this.visible) return;

        if (this.colorFilter) {
            const aConfig = OVERLAY_CONFIG.ambient;
            const tmConfig = aConfig.tokenMasking;
            const u = this.colorFilter.uniforms;
            u.uTokenMaskEnabled = tmConfig.enabled && !!game.mapShine.tokenMaskManager;
            if (u.uTokenMaskEnabled) {
                u.uTokenMask = game.mapShine.tokenMaskManager.getMaskTexture();
            }
        }
    }

    _onResize() {

        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }

    async updateEffectTargets(targets) {
        if (!this.visible) {

            if (this.children.length > 0) {
                 this.removeChildren().forEach(c => c.destroy());
                 this.effectSprites.clear();
            }
            return;
        }

        const validTargetIds = new Set();
        const allTargets = new Map([['background', targets.background], ...targets.tiles.entries()]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.ambient) continue;
            validTargetIds.add(id);
            let effectSprite = this.effectSprites.get(id);
            if (!effectSprite) {
                effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                if (this.colorFilter) {
                    effectSprite.filters = [this.colorFilter];
                }
                this.effectSprites.set(id, effectSprite);
                this.addChild(effectSprite);
            }
            await this._updateSpriteTransform(effectSprite, targetData.ambient, targetData.rect);
        }

        for (const [id, sprite] of this.effectSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.effectSprites.delete(id);
            }
        }
        await this.updateFromConfig(OVERLAY_CONFIG);
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    async updateFromConfig(config) {
        const aConfig = config.ambient;
        const ccConfig = aConfig.colorCorrection;

        this.visible = config.enabled && aConfig.enabled;

        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this.alpha = 1.0;

        for (const sprite of this.effectSprites.values()) {
            sprite.blendMode = aConfig.blendMode;
            sprite.alpha = 1.0;
        }

        if (this.colorFilter) {
            this.colorFilter.enabled = ccConfig.enabled;
            const u = this.colorFilter.uniforms;
            u.uSaturation = ccConfig.saturation;
            u.uBrightness = ccConfig.brightness;
            u.uContrast = ccConfig.contrast;
            u.uGamma = ccConfig.gamma;
            u.uTintColor = hexToRgbArray(ccConfig.tint.color);
            u.uTintAmount = ccConfig.tint.amount;
            u.u_intensity = aConfig.intensity;
            u.uTokenMaskThreshold = aConfig.tokenMasking.threshold;
        }

        const mConfig = aConfig.masking;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const shouldBeMasked = this.visible && mConfig.enabled && !!illuminationAPI;
        if (!shouldBeMasked && this.mask) {
            this.mask = null;
        } else if (shouldBeMasked && !this.mask) {

        }
    }
}

class HeatDistortionLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.heatSourceContainer = new PIXI.Container();
        this.addChild(this.heatSourceContainer);
        this.combinedMaskTexture = null;
        this.noiseManager = null;
        this.heatSprites = new Map();

        this._needsMaskUpdate = true;

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        this._onPanBound = this._onPan.bind(this);
    }

    async _draw(options) {
        console.log("HeatDistortionLayer | Drawing layer.");
        this.visible = false;

        const renderer = canvas.app.renderer;
        this.combinedMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.noiseManager = new NoiseTextureManager(renderer, 'heatDistortion.noise');

        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);
        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    _onPan() {
        this._needsMaskUpdate = true;
    }

    async updateEffectTargets(targets) {
        if (!this.heatSourceContainer) return;
        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);
        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.heat) continue;
            validTargetIds.add(id);
            let sprite = this.heatSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.heatSprites.set(id, sprite);
                this.heatSourceContainer.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.heat, targetData.rect);
        }
        for (const [id, sprite] of this.heatSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.heatSprites.delete(id);
            }
        }
        this._needsMaskUpdate = true;
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _onAnimate(deltaTime) {
        const config = OVERLAY_CONFIG.heatDistortion;
        const mainConfig = OVERLAY_CONFIG;
        const heatFilter = ScreenEffectsManager.getFilter('heatDistortion');

        if (!mainConfig.enabled || !config.enabled || !heatFilter) {
            if (heatFilter) heatFilter.enabled = false;
            return;
        }

        const hasActiveHeatSources = this.heatSprites.size > 0 && Array.from(this.heatSprites.values()).some(s => s.texture.valid);
        if (!hasActiveHeatSources) {
            heatFilter.enabled = false;
            return;
        }

        if (this._needsMaskUpdate) {
            canvas.app.renderer.render(this.heatSourceContainer, {
                renderTexture: this.combinedMaskTexture,
                transform: canvas.stage.transform.worldTransform, 
                clear: true
            });
            this._needsMaskUpdate = false;
        }

        heatFilter.enabled = true;
        this.noiseManager.update(deltaTime, canvas.app.renderer);

        const u = heatFilter.uniforms;
        u.u_intensity = config.intensity;
        u.u_displacementMap = this.noiseManager.getTexture();
        u.u_intensityMask = this.combinedMaskTexture;
    }

    async updateFromConfig(config) {
        this.noiseManager?.updateFromConfig(config);
        this._needsMaskUpdate = true;
    }

    _onResize() {
        const renderer = canvas.app.renderer;
        this.combinedMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.noiseManager?.resize(renderer);
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
        this._needsMaskUpdate = true;
    }

    async _tearDown(options) {
        console.log("HeatDistortionLayer | Tearing down layer.");
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);
        Hooks.off('canvasPan', this._onPanBound);

        this.noiseManager?.destroy();
        this.combinedMaskTexture?.destroy(true);
        this.heatSprites.clear();
        super._tearDown(options);
    }
}

class ProfileManager {
    constructor() {
        this.moduleId = MODULE_ID;
        this.ui = null; 

        this._moduleDefaults = foundry.utils.deepClone(OVERLAY_CONFIG);
        this._sceneProfile = null;
        this._userOverrides = {};

        this.activeSceneId = null;
        this.isGm = game.user.isGM;
        this.status = {
            sceneProfileLoaded: false,
            isDirty: false,
            error: null
        };

        this._worldProfiles = {};
        this._defaultProfileName = '';
    }

    async initialize(ui) {
        this.ui = ui;
        this.activeSceneId = canvas.scene?.id;
        if (!this.activeSceneId) {
            console.error("MapShine | Could not initialize ProfileManager: No active scene.");
            return;
        }

        this._worldProfiles = game.settings.get(this.moduleId, PROFILES_SETTING) || {};
        this._defaultProfileName = game.settings.get(this.moduleId, DEFAULT_PROFILE_SETTING) || '';

        this._worldProfiles = game.settings.get(this.moduleId, PROFILES_SETTING) || {};
        this._defaultProfileName = game.settings.get(this.moduleId, DEFAULT_PROFILE_SETTING) || '';

        if (this.ui?.eventHandler) {
            await this.ui.eventHandler._populateProfilesDropdown();
        }

        this._sceneProfile = canvas.scene?.getFlag(this.moduleId, 'profile') || null;
        this.status.sceneProfileLoaded = !!this._sceneProfile;

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        this._userOverrides = allUserOverrides[this.activeSceneId] || {};
        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);

        await this.applyEffectiveConfig();

        this.updateUIState();
    }

    getEffectiveConfig() {
        let effectiveConfig = foundry.utils.deepClone(this._moduleDefaults);

        if (this._sceneProfile) {
            foundry.utils.mergeObject(effectiveConfig, this._sceneProfile);
        }

        if (this._userOverrides) {
            foundry.utils.mergeObject(effectiveConfig, this._userOverrides);
        }
        
        ClientOverrides.apply(effectiveConfig);

        return effectiveConfig;
    }

    async applyEffectiveConfig() {
        const config = this.getEffectiveConfig();
        foundry.utils.mergeObject(OVERLAY_CONFIG, config, {
            inplace: true,
            overwrite: true,
            recursive: true,
            insertKeys: true,
            insertValues: true
        });
    
        // Unconditionally trigger a refresh of all visual components.
        // This was previously inside an if-statement checking for the UI.
        for (const layer of canvas.layers) {
            if (typeof layer.updateFromConfig === 'function') {
                await layer.updateFromConfig(OVERLAY_CONFIG);
            }
        }
        ScreenEffectsManager.updateAllFiltersFromConfig(OVERLAY_CONFIG);
    
        // If the debugger UI is open, also update its control values to stay in sync.
        if (this.ui?.eventHandler) {
            this.ui.eventHandler.updateAllControls();
        }
    }

    async recordUserChange(path, value) {

        const baseConfig = this._sceneProfile ?
            foundry.utils.mergeObject(foundry.utils.deepClone(this._moduleDefaults), this._sceneProfile, {
                inplace: false
            }) :
            foundry.utils.deepClone(this._moduleDefaults);

            const baseValue = foundry.utils.getProperty(baseConfig, path);

            if (JSON.stringify(value) === JSON.stringify(baseValue)) {
                foundry.utils.setProperty(this._userOverrides, path, undefined);
            } else {
                foundry.utils.setProperty(this._userOverrides, path, value);
            }

        this._userOverrides = this._cleanObject(this._userOverrides);

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = this._userOverrides;
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);
        this.updateUIState();
    }

    async saveConfigToScene() {
        if (!this.isGm) return;
        const currentConfig = foundry.utils.deepClone(OVERLAY_CONFIG);
        await canvas.scene.setFlag(this.moduleId, 'profile', currentConfig);
        ui.notifications.info("FX Profile saved to current scene.");

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        delete allUserOverrides[this.activeSceneId];
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        await this.initialize(this.ui);
    }

    async revertToSceneDefault() {
        if (!this.status.sceneProfileLoaded) return;
        this._userOverrides = {};
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        delete allUserOverrides[this.activeSceneId];
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        this.status.isDirty = false;
        await this.applyEffectiveConfig();
        this.updateUIState();
        ui.notifications.info("Reverted to scene default FX.");
    }

    async revertToModuleDefault() {

        this._userOverrides = {};
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = {};
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        const originalSceneProfile = this._sceneProfile;
        this._sceneProfile = null;
        await this.applyEffectiveConfig();
        this._sceneProfile = originalSceneProfile; 

        this.status.isDirty = this.status.sceneProfileLoaded;
        this.updateUIState();
        ui.notifications.info("Reverted to module default FX for this session.");
    }

    updateUIState() {
        if (!this.ui?.element) return;

        const light = this.ui.element.querySelector('#fx-status-light');
        const saveSceneBtn = this.ui.element.querySelector('#profile-save-scene');
        const revertSceneBtn = this.ui.element.querySelector('#profile-revert-scene');

        if (saveSceneBtn) saveSceneBtn.style.display = this.isGm ? '' : 'none';
        if (revertSceneBtn) revertSceneBtn.disabled = !this.status.sceneProfileLoaded;

        if (light) {
            light.className = 'fx-status-light'; 
            if (this.status.error) {
                light.classList.add('red');
                light.title = `Error: ${this.status.error}`;
            } else if (this.status.sceneProfileLoaded) {
                const title = this.status.isDirty ? "Scene profile loaded with user adjustments." : "Scene profile loaded.";
                light.classList.add(this.status.isDirty ? 'blue' : 'green');
                light.title = title;
            } else {
                light.classList.add('grey');
                light.title = "No scene profile. Using module/user defaults.";
            }
        }
    }

    async getProfiles() {
        return this._worldProfiles;
    }
    getDefaultProfileName() {
        return this._defaultProfileName;
    }
    async loadProfile(name) {
        const profileData = this._worldProfiles[name];
        if (!profileData) return null;

        const configToLoad = profileData.config || profileData;
        foundry.utils.mergeObject(OVERLAY_CONFIG, configToLoad, {
            inplace: true,
            overwrite: true,
            recursive: true
        });

        this._userOverrides = foundry.utils.deepClone(configToLoad);
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = this._userOverrides;
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        this.status.isDirty = true;
        this.updateUIState();
        this.ui.eventHandler.updateAllControls();
        this.ui.eventHandler.applyProfileUIState(profileData);
        ui.notifications.info(`Profile "${name}" loaded.`);

        return profileData;
    }
    async saveProfile(name, config, uiState) {
        if (!name) {
            ui.notifications.warn("Please enter a name for the profile.");
            return false;
        }
        if (this._worldProfiles[name]) {
            const overwrite = await Dialog.confirm({
                title: "Profile Exists",
                content: `<p>A world profile named "<strong>${name}</strong>" already exists. Overwrite it?</p>`,
                defaultYes: false
            });
            if (!overwrite) return false;
        }
        this._worldProfiles[name] = {
            config: foundry.utils.deepClone(config),
            ui: uiState
        };
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        ui.notifications.info(`World Profile "${name}" saved!`);
        return true;
    }
    async updateProfile(name, config, uiState) {
        if (!name || !this._worldProfiles[name]) {
            return false;
        }
        this._worldProfiles[name] = {
            config: foundry.utils.deepClone(config),
            ui: uiState
        };
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        return true;
    }
    async deleteProfile(name) {
        if (!name || !this._worldProfiles[name]) return false;
        delete this._worldProfiles[name];
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        if (this.getDefaultProfileName() === name) {
            await this.setDefaultProfile("");
        }
        return true;
    }
    async setDefaultProfile(name) {
        await game.settings.set(this.moduleId, DEFAULT_PROFILE_SETTING, name);
        this._defaultProfileName = name;
    }

    _cleanObject(obj) {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            if (value === null || value === undefined) {
                return undefined;
            }
            if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
                return undefined;
            }
            return value;
        }));
    }
}

class DebuggerUIBuilder {
    constructor() {}

    buildRootElement() {
        const element = document.createElement('div');
        element.id = 'material-editor-debugger';
        element.innerHTML = this._getStyles() + this._getBaseHTML();

        element.querySelector('#material-editor-top-bar').innerHTML = this._buildTopBar();
        element.querySelector('#material-editor-col-1').innerHTML = this._buildColumn1();
        element.querySelector('#material-editor-col-2').innerHTML = this._buildColumn2();
        element.querySelector('#material-editor-col-3').innerHTML = this._buildColumn3();
        element.querySelector('#material-editor-bottom-bar').innerHTML = this._buildBottomBar();

        const contentArea = element.querySelector('.main-content-area');
        const columns = [
            element.querySelector('#material-editor-col-1'),
            element.querySelector('#material-editor-col-2'),
            element.querySelector('#material-editor-col-3')
        ];

        const updateLayout = () => {
            let allColumnsCompact = true;
            const columnSizes = columns.map(col => {
                const isCompact = ![...col.querySelectorAll(':scope > details')].some(d => d.open);
                if (!isCompact) allColumnsCompact = false;
                return isCompact ? '220px' : '1fr';
            });

            contentArea.style.gridTemplateColumns = columnSizes.join(' ');

            if (allColumnsCompact) {
                element.style.width = 'auto';
            } else {
                element.style.width = '950px';
            }
        };

        element.querySelectorAll('details').forEach(detail => {
            detail.addEventListener('toggle', updateLayout);
        });

        updateLayout();

        return element;
    }

    _getStyles() {
        return `<style>
            #material-editor-debugger { 
                position: fixed; 
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000; 
                background: rgba(40, 40, 40, 0.95); 
                color: #fff; 
                border: 1px solid #111; 
                border-radius: 8px; 
                padding: 5px; 
                font-family: sans-serif; 
                font-size: 11px; 
                display: flex; 
                flex-direction: column; 
                gap: 4px; 
                width: 950px; 
                max-width: calc(100vw - 30px);
                box-sizing: border-box;
                box-shadow: 0 0 25px rgba(0,0,0,0.7); 
                max-height: calc(100vh - 100px); 
                transition: width 0.3s ease-in-out; 
            }
            #material-editor-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; }
            #material-editor-header h3 { margin: 0; padding: 0; border: none; flex-grow: 1; text-align: center; cursor: move; user-select: none; font-size: 1.4em; }
            .header-btn { display: inline-block; text-decoration: none; background: #3a3a3a; border: 1px solid #666; color: #ccc; font-weight: bold; width: 22px; height: 22px; line-height: 22px; text-align: center; cursor: pointer; border-radius: 4px; flex-shrink: 0; font-size: 14px; padding: 0; }
            .header-btn:hover { background: #555; border-color: #888; }
            #material-editor-debugger details { background: rgba(255,255,255,0.05); border: 1px solid #555; border-radius: 4px; padding: 3px; margin-bottom: 4px; }
            #material-editor-debugger details[open] { background: rgba(255,255,255,0.08); padding-bottom: 5px; }
            #material-editor-debugger details[open] > summary .accordion-toggle { transform: rotate(90deg); }
            #material-editor-debugger details.disabled-effect > summary .summary-label { color: #888; }
            #material-editor-debugger summary { font-weight: bold; cursor: pointer; padding: 2px; display: flex; align-items: center; gap: 5px; list-style: none; }
            #material-editor-debugger summary::-webkit-details-marker { display: none; }
            #material-editor-debugger .accordion-toggle { flex-shrink: 0; width: 0; height: 0; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 5px solid #ccc; transition: transform 0.2s ease-in-out; margin-left: 2px; }
            #material-editor-debugger .summary-control { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            #material-editor-debugger details details { margin-left: 8px; margin-top: 4px; border-style: dashed; }
            #material-editor-debugger .traffic-light { width: 9px; height: 9px; border-radius: 50%; display: inline-block; box-shadow: 0 0 4px rgba(0,0,0,0.5); border: 1px solid #111; flex-shrink: 0; }
            #material-editor-debugger .traffic-light.ok { background-color: #4cfa40; }
            #material-editor-debugger .traffic-light.error { background-color: #fa4040; }
            #material-editor-debugger .traffic-light.warning { background-color: #f7a000; }
            #material-editor-debugger .traffic-light.unknown { background-color: #888; }
            #material-editor-debugger .traffic-light.inactive, #material-editor-debugger .traffic-light.disabled { background: none; border: 1px dashed #666; }
            #material-editor-debugger .control-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; padding: 1px 0; }
            #material-editor-debugger .control-row label { flex-shrink: 0; margin-right: 8px; display: flex; align-items: center; gap: 4px;}
            #material-editor-debugger .control-row .widget-group { display: flex; align-items: center; gap: 4px; }
            #material-editor-debugger .control-row-slider { display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center; }
            #material-editor-debugger .control-row-slider label { margin-right: 0; white-space: nowrap; }
            #material-editor-debugger .control-row-slider input[type=range] { width: 100%; }
            #material-editor-debugger .control-row .value-span { width: 40px; height: 18px; line-height: 18px; text-align: right; font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.4); padding: 0 4px; border-radius: 3px; box-sizing: border-box; }
            #material-editor-debugger input[type=range] { flex-grow: 1; width: 120px; height: 14px; }
            #material-editor-debugger input[type=color] { width: 100%; height: 22px; border: 1px solid #555; padding: 1px; background: #333; box-sizing: border-box; }
            #material-editor-debugger input[type=checkbox] { height: 13px; width: 13px; margin: 0; }
            #material-editor-debugger .main-content-area { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; flex-grow: 1; min-height: 0; transition: grid-template-columns 0.3s ease-in-out; }
            #material-editor-debugger .main-column { overflow-y: auto; padding: 4px; background: rgba(0,0,0,0.2); border: 1px solid #555; border-radius: 5px; display: flex; flex-direction: column; gap: 3px; }
            #material-editor-debugger .top-bar { flex-shrink: 0; display: flex; flex-direction: column; gap: 5px; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 5px; }
            #material-editor-debugger .top-bar-row { display: flex; gap: 10px; align-items: center; justify-content: space-between; }
            #material-editor-debugger .status-group { display: flex; flex-wrap: wrap; gap: 4px 10px; border-left: 2px solid #555; padding-left: 8px; }
            #material-editor-debugger .status-group-title { font-weight: bold; color: #aaa; }
            #material-editor-debugger .profile-controls { display: flex; flex-direction: column; gap: 4px; }
            #material-editor-debugger select { width: 100%; text-transform: capitalize; background-color: #222; color: #fff; border: 1px solid #555; border-radius: 3px; height: 20px; font-size: 11px; }
            .star-icon { font-size: 0 !important; background-color: #ccc; width: 12px; height: 12px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); margin: auto; }
            #material-editor-debugger.minimized { width: auto; height: auto; padding: 4px; gap: 0; box-shadow: 0 0 10px rgba(0,0,0,0.5); right: auto; }
            #material-editor-debugger.minimized #material-editor-header { padding: 0; cursor: move; }
            #material-editor-debugger.minimized > *:not(#material-editor-header) { display: none; }
            #material-editor-debugger.minimized #material-editor-help-btn, #material-editor-debugger.minimized #material-editor-title { display: none; }
            .fx-status-light { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #111; margin-right: 5px; vertical-align: middle; }
            .fx-status-light.green { background-color: #4cfa40; box-shadow: 0 0 5px #4cfa40; }
            .fx-status-light.blue { background-color: #40a0fa; box-shadow: 0 0 5px #40a0fa; }
            .fx-status-light.grey { background-color: #888; }
            .fx-status-light.red { background-color: #fa4040; box-shadow: 0 0 5px #fa4040; }
            .profile-controls button:disabled { background-color: #333; color: #777; cursor: not-allowed; border-color: #555; }
            .description-text { font-size: 10px; color: #aaa; margin: 4px 0 6px 0; padding-left: 5px; }
            .warning-box { background: #552222; border: 1px solid #ff6666; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 10px; }
            .warning-box strong { color: #ffaaaa; }

            #material-editor-bottom-bar {
                padding: 10px 15px;
                margin-top: 5px;
                background: rgba(15, 15, 15, 0.5);
                border-radius: 5px;
                border: 1px solid #666;
                display: grid; 
                grid-template-columns: 1fr auto; 
                align-items: center;
                gap: 30px;
            }

            #material-editor-bottom-bar .about-text {

                font-size: 11px;
                line-height: 1.5;
                color: #ccc;
            }

            #material-editor-bottom-bar .about-text p {
                margin: 0;
            }

            #material-editor-bottom-bar .about-text p:first-child {
                margin-bottom: 5px;
            }

            #material-editor-bottom-bar .support-links {

                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 8px;
            }

            #material-editor-bottom-bar .support-links a.patreon-link {
                color: #f96854;
                text-decoration: none;
                font-weight: bold;
                font-size: 13px;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
                padding: 6px 12px;
                border-radius: 4px;
                background: rgba(40, 40, 40, 0.9);
                border: 1px solid #777;
            }

            #material-editor-bottom-bar .support-links a.patreon-link:hover {
                color: #fff;
                background: #f96854;
                border-color: #f96854;
            }

            #material-editor-bottom-bar .support-links .patreon-logo {
                height: 20px;
                width: 20px;
            }

            #material-editor-bottom-bar .stores-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
                align-items: flex-end;
            }

            #material-editor-bottom-bar .stores-heading {
                margin: 0;
                padding: 0;
                font-size: 10px;
                font-weight: bold;
                color: #bbb;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            #material-editor-bottom-bar .store-links-inner {
                display: flex;
                gap: 15px;
                font-size: 11px;
            }

            #material-editor-bottom-bar .store-links-inner a {
                color: #8fb1ff;
                text-decoration: none;
                font-weight: bold;
            }

            #material-editor-bottom-bar .store-links-inner a:hover {
                color: #b3ceff;
                text-decoration: underline;
            }
</style>`;
    }

    _getBaseHTML() {
        return `
            <div id="material-editor-header">
                <a id="material-editor-help-btn" class="header-btn" href="https://github.com/Garsondee/map-shine" target="_blank" rel="noopener noreferrer" title="Help/Info (Opens GitHub page)">?</a>
                <h3 id="material-editor-title">Map Shine</h3>
                <button id="material-editor-minimize-btn" class="header-btn" title="Minimize">-</button>
                <button id="material-editor-close-btn" class="header-btn" title="Close" style="color: #ff8080;">X</button>
            </div>

            <div id="material-editor-top-bar" class="top-bar"></div>
            <div class="main-content-area">
                <div id="material-editor-col-1" class="main-column"></div>
                <div id="material-editor-col-2" class="main-column"></div>
                <div id="material-editor-col-3" class="main-column"></div>
            </div>
            <div id="material-editor-bottom-bar"></div>
        `;
    }

    _buildBottomBar() {
        return `
            <div class="about-text">
                <p><strong>Map Shine:</strong> A free toolkit for creating memorable, animated, and visually striking maps. It will <br>
                always be free for commercial use. Map making is both my passion and helps me support my family.<br>
                If you use this module, please consider giving credit by linking my Patreon or map stores.</p>
            </div>
            <div class="support-links">
                <a href="https://www.patreon.com/c/MythicaMachina" target="_blank" class="patreon-link">
                    <span>Support on Patreon</span>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/9/94/Patreon_logo.svg" class="patreon-logo" alt="Patreon Logo">
                </a>
                <div class="stores-group">
                    <h5 class="stores-heading">BUY MY MAPS AND HELP SUPPORT ME</h5>
                    <div class="store-links-inner">
                        <a href="https://www.foundryvtt.store/creators/mythica-machina" target="_blank">Foundry VTT Store</a>
                        <a href="https://www.drivethrurpg.com/en/publisher/29377/mythicamachina" target="_blank">DriveThruRPG</a>
                    </div>
                </div>
            </div>
        `;
    }

    _buildTopBar() {
        return `
        <div class="top-bar-row">
            <div class="widget-group">
                <div id="fx-status-light" class="fx-status-light grey" title="Initializing..."></div>
                <input type="checkbox" id="global-enabled" data-path="enabled">
                <label for="global-enabled">Enable All Effects</label>
            </div>

            <div class="status-group">
                <span class="status-group-title">Shaders:</span>
                <div class="widget-group"><span id="status-shaders-baseShine" class="traffic-light unknown"></span>Base</div>
                <div class="widget-group"><span id="status-shaders-noise" class="traffic-light unknown"></span>Noise</div>
                <div class="widget-group"><span id="status-shaders-iridescence" class="traffic-light unknown"></span>Iridescence</div>
                <div class="widget-group"><span id="status-shaders-heat" class="traffic-light unknown"></span>Heat</div>
                <div class="widget-group"><span id="status-shaders-cloudShadows" class="traffic-light unknown"></span>Clouds</div>
                <div class="widget-group"><span id="status-shaders-postProcessing" class="traffic-light unknown"></span>PostFX</div>
            </div>
        </div>
        `;
    }

    _buildColumn1() {
        let content = this._createAccordionHTML('baseShine', 'Metallic Shine', `
            ${this._createTextureInputHTML('specular', 'Specular/Reflect Map')}
            <p class="description-text">A grayscale texture where white areas reflect the animated pattern and black areas reflect nothing. This is the primary mask for this effect.</p>
            <details id="details-baseShine-animation"><summary><span class="accordion-toggle"></span><strong>Animation & Compositing</strong></summary>
                <div>
                    ${this._createSliderHTML('baseShine.animation.globalIntensity', 'Global Intensity', 0, 10, 0.1, 'Controls the overall brightness of the shine effect.')}
                    ${this._createSliderHTML('baseShine.animation.updateFrequency', 'Update Frequency (Frames)', 0, 60, 1, 'How often the pattern updates. Higher values improve performance but make animation less smooth. 0 = every frame.')}
                </div>
            </details>
            <details id="details-baseShine-pattern"><summary><span class="accordion-toggle"></span><strong>Pattern Generator</strong></summary>
                <div>
                    ${this._createSelectHTML('baseShine.patternType', 'Type', {'Stripes': 'stripes', 'Checkerboard': 'checkerboard'}, 'The base procedural shape of the shine.')}
                    <div id="pattern-stripes-controls">
                        ${this._createSliderHTML('baseShine.pattern.shared.patternScale', 'Pattern Scale', 0.01, 4, 0.01, 'Overall zoom level of the stripe patterns.')}
                        ${this._createSliderHTML('baseShine.pattern.shared.maxBrightness', 'Max Brightness', 0, 2, 0.01, 'A cap on the brightness of the generated pattern.')}
                        <details id="details-baseShine-pattern-s1"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('baseShine.pattern.stripes1.enabled', 'Stripe Layer A', true)}</div></summary>
                            <div>
                                ${this._createSliderHTML('baseShine.pattern.stripes1.intensity', 'Intensity', 0, 2, 0.05, 'Brightness of this individual stripe layer.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes1.speed', 'Speed', -0.1, 0.1, 0.001, 'How fast the sub-stripes animate within the bands.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes1.angle', 'Angle', 0, 360, 1)}
                                ${this._createSliderHTML('baseShine.pattern.stripes1.sharpness', 'Edge Falloff', 0.1, 8, 0.1, 'How soft or hard the edges of the main bands are.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes1.bandDensity', 'Band Density', 1, 64, 0.5, 'How many main bands appear on screen.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes1.bandWidth', 'Band Width', 0.1, 1, 0.01, 'The width of the main bands, as a fraction of the space between them.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1, 'The maximum number of smaller stripes that can appear inside a main band.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5, 'The sharpness of the smaller, internal stripes.')}
                            </div>
                        </details>     
                        <details id="details-baseShine-pattern-s2"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('baseShine.pattern.stripes2.enabled', 'Stripe Layer B', true)}</div></summary>
                            <div>
                                ${this._createSliderHTML('baseShine.pattern.stripes2.intensity', 'Intensity', 0, 2, 0.05, 'Brightness of this individual stripe layer.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes2.speed', 'Speed', -0.1, 0.1, 0.001, 'How fast the sub-stripes animate within the bands.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes2.angle', 'Angle', 0, 360, 1)}
                                ${this._createSliderHTML('baseShine.pattern.stripes2.sharpness', 'Edge Falloff', 0.1, 8, 0.1, 'How soft or hard the edges of the main bands are.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes2.bandDensity', 'Band Density', 1, 64, 0.5, 'How many main bands appear on screen.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes2.bandWidth', 'Band Width', 0.1, 1, 0.01, 'The width of the main bands, as a fraction of the space between them.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1, 'The maximum number of smaller stripes that can appear inside a main band.')}
                                ${this._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5, 'The sharpness of the smaller, internal stripes.')}
                            </div>
                        </details>
                    </div>
                    <div id="pattern-checkerboard-controls" style="display: none;">
                        ${this._createSliderHTML('baseShine.pattern.checkerboard.gridSize', 'Grid Size', 2, 64, 2)}
                        ${this._createSliderHTML('baseShine.pattern.checkerboard.brightness1', 'Brightness 1', 0, 1, 0.01)}
                        ${this._createSliderHTML('baseShine.pattern.checkerboard.brightness2', 'Brightness 2', 0, 1, 0.01)}
                    </div>
                </div>
            </details>
            <details id="details-baseShine-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('baseShine.noise.enabled', 'Pattern Noise Mask', true)}</div></summary>
                <div>
                    <p class="description-text">Applies a noise pattern over the stripes to add texture and break up the uniformity.</p>
                    ${this._createSliderHTML('baseShine.noise.speed', 'Speed', -0.5, 0.5, 0.001)}
                    ${this._createSliderHTML('baseShine.noise.scale', 'Scale', 0.1, 10, 0.1)}
                    ${this._createSliderHTML('baseShine.noise.threshold', 'Threshold', 0, 1, 0.01, 'Cuts off noise values below this, creating harder-edged noise.')}
                    ${this._createSliderHTML('baseShine.noise.brightness', 'Brightness', -1, 1, 0.01)}
                    ${this._createSliderHTML('baseShine.noise.contrast', 'Contrast', 0, 5, 0.05)}
                    ${this._createSliderHTML('baseShine.noise.softness', 'Softness', 0.01, 1, 0.01, 'How gradual the transition is at the threshold edge.')}
                </div>
            </details>
            <details id="details-baseShine-bloom"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('baseShine.shineBloom.enabled', 'Shine Bloom Effect', true)}</div></summary>
                <div>
                    <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;">
                        <strong style="color: #ffddaa;">PERFORMANCE WARNING:</strong> This effect can be demanding. Lowering 'Quality' can improve performance significantly.
                    </div>
                    <p class="description-text">Adds a soft glow to the brightest parts of the shine effect.</p>
                    ${this._createSliderHTML('baseShine.shineBloom.threshold', 'Threshold', 0, 1, 0.01, 'Only areas brighter than this will bloom.')}
                    ${this._createSliderHTML('baseShine.shineBloom.brightness', 'Brightness', 0, 5, 0.05)}
                    ${this._createSliderHTML('baseShine.shineBloom.blur', 'Blur Amount', 0, 20, 0.5)}
                    ${this._createSliderHTML('baseShine.shineBloom.quality', 'Quality', 1, 15, 1, 'Number of blur samples. Higher is smoother but much slower.')}
                    <details id="details-baseShine-rgbSplit"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('baseShine.rgbSplit.enabled', 'RGB Split', true)}</div></summary>
                        <div>${this._createSliderHTML('baseShine.rgbSplit.amount', 'Amount', 0, 10, 0.1, 'Adds a chromatic aberration effect to the bloom.')}</div>
                    </details>
                </div>
            </details>
            <details id="details-baseShine-starburst"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('baseShine.starburst.enabled', 'Shine Starburst Effect', true)}</div></summary>
                <div>
                    <div class="warning-box">
                        <strong style="color: #ffaaaa;">EXTREME PERFORMANCE WARNING:</strong> This effect is VERY performance-heavy, especially with a high 'Ray Length' or many 'Points'. Use with caution!
                    </div>
                    <p class="description-text">Adds star-like rays that emanate from the brightest parts of the shine.</p>
                    ${this._createSliderHTML('baseShine.starburst.threshold', 'Threshold', 0, 1, 0.01, 'Only areas brighter than this will generate rays.')}
                    ${this._createSliderHTML('baseShine.starburst.intensity', 'Intensity', 0, 4, 0.05)}
                    ${this._createSliderHTML('baseShine.starburst.points', 'Points', 2, 16, 1)}
                    ${this._createSliderHTML('baseShine.starburst.angle', 'Angle', 0, 360, 1)}
                    ${this._createSliderHTML('baseShine.starburst.size', 'Ray Length', 1, 200, 1)}
                    ${this._createSliderHTML('baseShine.starburst.falloff', 'Ray Falloff', 0.5, 8, 0.1, 'How quickly the rays fade out with distance. Higher values mean a shorter, faster fade.')}
                    ${this._createSelectHTML('baseShine.starburst.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                </div>
            </details>
        `);

        let dustMotesHTML = `
            ${this._createTextureInputHTML('dust', 'Dust Area Mask (_Dust)')}
            <p class="description-text">A texture defining where dust motes can appear. White allows motes, black prevents them.</p>
            ${this._createSliderHTML('dustMotes.intensity', 'Global Intensity', 0, 50, 1)}
            ${this._createSliderHTML('dustMotes.shineInfluence', 'Shine Influence', 0, 5, 0.05, 'How much the Metallic Shine pattern brightens the dust motes.')}
            ${this._createSliderHTML('dustMotes.maskBlur', 'Dust Mask Blur', 0, 500, 1, 'Blurs the edges of the dust mask for a softer transition.')}
            ${this._createSliderHTML('dustMotes.numLayers', 'Active Layers', 0, 8, 1, 'Controls how many of the below layers are rendered.')}
            <details id="details-dustMotes-postBlur"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('dustMotes.postBlur.enabled', 'Post-Effect Blur', true)}</div></summary>
                <div>
                    <p class="description-text">Applies a blur to the final dust mote effect, making them appear less sharp.</p>
                    ${this._createSliderHTML('dustMotes.postBlur.blurAmount', 'Blur Amount', 0, 5, 0.1)}
                    ${this._createSliderHTML('dustMotes.postBlur.quality', 'Quality', 1, 20, 1)}
                </div>
            </details>
        `;

        for (let i = 0; i < 4; i++) {
            const pathPrefix = `dustMotes.layers[${i}]`;
            dustMotesHTML += `
                <details id="details-dustMotes-layer${i}"><summary><span class="accordion-toggle"></span><strong>Layer ${i+1}</strong></summary>
                    <div style="padding-left: 15px;">
                    ${this._createColorPickerHTML(`${pathPrefix}.tintColor`, 'Tint Color')}
                        ${this._createSliderHTML(`${pathPrefix}.scale`, 'Scale', 0.1, 10, 0.1, 'Zoom level of the particle grid. Smaller values = larger, slower particles.')}
                        ${this._createSliderHTML(`${pathPrefix}.density`, 'Density', 0.0, 0.5, 0.005, 'The chance for a particle to appear at any given grid point.')}
                        ${this._createSliderHTML(`${pathPrefix}.size`, 'Size', 0.1, 20.0, 0.01)}
                        ${this._createSliderHTML(`${pathPrefix}.sizeRandomness`, 'Size Randomness', 0, 1, 0.01)}
                        ${this._createSliderHTML(`${pathPrefix}.twinkleSpeed`, 'Twinkle Speed', 0, 5, 0.05)}
                        <details><summary><span class="accordion-toggle"></span>Drift (Wind)</summary><div style="padding-left: 15px;">
                                ${this._createSliderHTML(`${pathPrefix}.drift.angle`, 'Angle', 0, 360, 1)}
                                ${this._createSliderHTML(`${pathPrefix}.drift.speed`, 'Speed', 0, 0.1, 0.001)}
                        </div></details>
                        <details><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML(`${pathPrefix}.turbulence.enabled`, 'Turbulence', true)}</div></summary><div style="padding-left: 15px;">
                                <p class="description-text">Adds a random, swirling motion to particles.</p>
                                ${this._createSliderHTML(`${pathPrefix}.turbulence.speed`, 'Speed', 0, 0.05, 0.001)}
                                ${this._createSliderHTML(`${pathPrefix}.turbulence.scale`, 'Scale', 0.01, 250, 0.5)}
                                ${this._createSliderHTML(`${pathPrefix}.turbulence.magnitude`, 'Magnitude', 0, 20, 0.01, 'How far the particles are pushed by the turbulence.')}
                        </div></details>
                        <details><summary><span class="accordion-toggle"></span>Aspect Ratio</summary><div style="padding-left: 15px;">
                                <p class="description-text">Stretches the particles, e.g., for rain-like effects.</p>
                                ${this._createSliderHTML(`${pathPrefix}.aspect.width`, 'Width', 0.1, 5, 0.01)}
                                ${this._createSliderHTML(`${pathPrefix}.aspect.height`, 'Height', 0.1, 5, 0.01)}
                        </div></details>
                         <details><summary><span class="accordion-toggle"></span>Visibility Cycle</summary><div style="padding-left: 15px;">
                                <p class="description-text">Makes the layer fade in and out over a set time, like gusts of wind.</p>
                                ${this._createSliderHTML(`${pathPrefix}.visibility.cycleDuration`, 'Duration (sec)', 0, 60, 0.5, 'Total length of one on/off cycle. 0 to disable.')}
                                ${this._createSliderHTML(`${pathPrefix}.visibility.visibleFraction`, 'Visible Fraction', 0, 1, 0.01, 'The fraction of the cycle this layer is visible for.')}
                        </div></details>
                    </div>
                </details>
            `;
        }
        content += this._createAccordionHTML('dustMotes', 'Dust Motes', dustMotesHTML);
        return content;
    }

    _buildColumn2() {
        let content = this._createAccordionHTML('iridescence', 'Iridescence', `
            ${this._createTextureInputHTML('iridescence', 'Iridescence Mask')}
            <p class="description-text">Creates a colorful, oil-slick-like effect within the masked areas.</p>
            ${this._createSliderHTML('iridescence.intensity', 'Intensity', 0, 2, 0.05)}
            ${this._createSliderHTML('iridescence.speed', 'Anim Speed', 0, 0.2, 0.001)}
            ${this._createSliderHTML('iridescence.scale', 'Pattern Scale', 0.1, 20, 0.1)}
            ${this._createSliderHTML('iridescence.noiseAmount', 'Pattern Noise', 0, 1, 0.01, 'Adds random noise to break up the pattern.')}
            <details id="details-iridescence-gradient"><summary><span class="accordion-toggle"></span><strong>Gradient Controls</strong></summary>
                <div>
                    ${this._createGradientSelectHTML('iridescence.gradient.name', 'Gradient Preset')}
                    ${this._createSliderHTML('iridescence.gradient.hueShift', 'Hue Shift', 0, 1, 0.01, 'Rotates the colors of the gradient.')}
                    ${this._createSliderHTML('iridescence.gradient.brightness', 'Brightness', -1, 1, 0.01)}
                    ${this._createSliderHTML('iridescence.gradient.contrast', 'Contrast', 0, 4, 0.05)}
                </div>
            </details>
            <details id="details-iridescence-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('iridescence.distortion.enabled', 'Churn/Distortion Effect', true)}</div></summary>
                <div>
                    <p class="description-text">Uses a second, underlying noise pattern to warp the main iridescence effect.</p>
                    ${this._createSliderHTML('iridescence.distortion.strength', 'Distortion Strength', 0, 0.1, 0.001)}
                    <details id="details-iridescence-distortion-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('iridescence.noise.enabled', 'Distortion Noise', true)}</div></summary>
                        <div>
                            ${this._createSliderHTML('iridescence.noise.speed', 'Speed', -0.5, 0.5, 0.01)}
                            ${this._createSliderHTML('iridescence.noise.scale', 'Scale', 0.1, 10, 0.1)}
                            ${this._createSliderHTML('iridescence.noise.threshold', 'Threshold', 0, 1, 0.01)}
                            ${this._createSliderHTML('iridescence.noise.brightness', 'Brightness', -1, 1, 0.01)}
                            ${this._createSliderHTML('iridescence.noise.contrast', 'Contrast', 0, 5, 0.05)}
                            ${this._createSliderHTML('iridescence.noise.softness', 'Softness', 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
        `);

        content += this._createAccordionHTML('heatDistortion', 'Heat Distortion', `
            ${this._createTextureInputHTML('heat', 'Intensity Mask (_Heat)')}
            <p class="description-text">Simulates rising heat waves, distorting the scene behind the masked areas.</p>
            ${this._createSliderHTML('heatDistortion.intensity', 'Intensity', 0, 0.05, 0.0005)}
            <details id="details-heatDistortion-noise" open><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML('heatDistortion.noise.speed', 'Speed (Wind)', -0.5, 0.5, 0.005, 'Horizontal scrolling speed of the heat waves.')}
                    ${this._createSliderHTML('heatDistortion.noise.scale', 'Scale', 0.1, 10, 0.1, 'Zoom level of the heat waves.')}
                    ${this._createSliderHTML('heatDistortion.noise.evolution', 'Evolution Speed', 0, 1, 0.01, 'The "boiling" or "morphing" speed of the noise, independent of wind.')}
                    ${this._createSliderHTML('heatDistortion.noise.threshold', 'Threshold', 0, 1, 0.01)}
                    ${this._createSliderHTML('heatDistortion.noise.brightness', 'Brightness', -1, 1, 0.01)}
                    ${this._createSliderHTML('heatDistortion.noise.contrast', 'Contrast', 0, 5, 0.05)}
                    ${this._createSliderHTML('heatDistortion.noise.softness', 'Softness', 0.01, 1, 0.01)}
                </div>
            </details>
        `);

        content += this._createAccordionHTML('cloudShadows', 'Cloud Shadows', `
            ${this._createTextureInputHTML('outdoors', 'Outdoor Mask (_Outdoors)')}
            <p class="description-text">Simulates moving cloud shadows within the masked areas.</p>
            ${this._createSliderHTML('cloudShadows.shadowIntensity', 'Global Intensity', 0, 2, 0.05)}
            ${this._createSliderHTML('cloudShadows.maskBlur', 'Mask Blur', 0, 50, 1)}
            <details open><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML('cloudShadows.wind.angle', 'Angle', 0, 360, 1)}
                    ${this._createSliderHTML('cloudShadows.wind.speed', 'Speed', 0, 0.01, 0.0001)}
                </div>
            </details>
            <details open><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML('cloudShadows.noise.scale', 'Scale', 0.01, 10, 0.01)}
                    ${this._createSliderHTML('cloudShadows.noise.octaves', 'Detail Octaves', 1, 8, 1, 'Adds more layers of detail to the noise. Higher is more complex.')}
                    ${this._createSliderHTML('cloudShadows.noise.persistence', 'Roughness', 0.1, 1, 0.05, 'How much each successive octave contributes. Lower values give a softer look.')}
                    ${this._createSliderHTML('cloudShadows.noise.lacunarity', 'Detail Frequency', 1.5, 4, 0.1, 'How much detail is added with each octave. Higher values create finer, more complex noise.')}
                </div>
            </details>
            <details open><summary><span class="accordion-toggle"></span><strong>Shading & Appearance</strong></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML('cloudShadows.shading.threshold', 'Threshold', 0, 1, 0.01)}
                    ${this._createSliderHTML('cloudShadows.shading.softness', 'Softness', 0.01, 1, 0.01)}
                    ${this._createSliderHTML('cloudShadows.shading.brightness', 'Brightness', -1, 1, 0.01)}
                    ${this._createSliderHTML('cloudShadows.shading.contrast', 'Contrast', 0.1, 5, 0.05)}
                    ${this._createSliderHTML('cloudShadows.shading.gamma', 'Gamma', 0.1, 5, 0.05, 'Adjusts the mid-tones of the shadows. < 1 lightens, > 1 darkens.')}
                </div>
            </details>
        `);
        return content;
    }

    _buildColumn3() {
        let content = this._createAccordionHTML('ambient', 'Ambient / Emissive', `
            ${this._createTextureInputHTML('ambient', 'Emissive Map (_Ambient)')}
            <p class="description-text">Applies color and effects to a texture, often used for glowing areas that are part of the map itself (e.g., lava, magic runes).</p>
            ${this._createSliderHTML('ambient.intensity', 'Intensity', 0, 5, 0.05, 'Brightness multiplier. Values > 1 are useful for additive blending.')}
            ${this._createSelectHTML('ambient.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}

            <details id="details-ambient-tokenMasking" open>
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${this._createCheckboxHTML('ambient.tokenMasking.enabled', 'Token Masking', true)}
                    </div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Hides the effect behind tokens. For this to work, you may need to increase this layer's Z-Index (see Rendering Order section) to be above the token layer.</p>
                    ${this._createSliderHTML('ambient.tokenMasking.threshold', 'Mask Threshold', 0, 1, 0.01)}
                </div>
            </details>

            <details id="details-ambient-masking" open>
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${this._createCheckboxHTML('ambient.masking.enabled', 'Luminance Mask', true)}
                    </div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Fades out the effect in dark areas of the scene. Requires scene lighting and the Illumination Buffer module.</p>
                    ${this._createSliderHTML('ambient.masking.threshold', 'Brightness Threshold', 0, 1, 0.01)}
                    ${this._createSliderHTML('ambient.masking.softness', 'Edge Softness', 0.01, 1, 0.01)}
                </div>
            </details>

            <details id="details-ambient-colorCorrection" open><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('ambient.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                <div style="padding-left: 15px;">
                    ${this._createSliderHTML('ambient.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                    ${this._createSliderHTML('ambient.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                    ${this._createSliderHTML('ambient.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                    ${this._createSliderHTML('ambient.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05)}
                    <details id="details-ambient-cc-tint" open><summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary><div style="padding-left: 15px;">
                            ${this._createColorPickerHTML('ambient.colorCorrection.tint.color', 'Tint Color')}
                            ${this._createSliderHTML('ambient.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                    </div></details>
                </div>
            </details>
            <details id="details-ambient-rendering">
                <summary><span class="accordion-toggle"></span><strong>Rendering Order</strong></summary>
                <div>
                    <p class="description-text">Controls the draw order of this layer relative to others like lighting and tokens. Higher values are drawn on top.</p>
                    ${this._createSliderHTML('ambientLayerZIndex', 'Layer Z-Index', 0, 500, 10, 'Default z-indexes: Tokens=100, Lighting=200, Weather=300, Fog=400')}
                    <button id="reload-canvas-btn" style="width: 100%; margin-top: 5px;">Reload Canvas to Apply Z-Index</button>
                </div>
            </details>
        `);

        content += this._createAccordionHTML('groundGlow', 'Glow in the Dark', `
            ${this._createTextureInputHTML('groundGlow', 'Glow Texture')}
            <p class="description-text">Makes a texture appear to glow only in unlit areas of the scene. Requires scene lighting.</p>
            ${this._createSliderHTML('groundGlow.intensity', 'Intensity', 0, 5, 0.05)}

            <details id="details-groundGlow-tokenMasking" open>
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${this._createCheckboxHTML('groundGlow.tokenMasking.enabled', 'Token Masking', true)}
                    </div>
                </summary>
                <div style="padding-left: 15px;">
                     <p class="description-text">Hides the effect behind tokens. This layer is already in a high-level group, so it should work by default.</p>
                    ${this._createSliderHTML('groundGlow.tokenMasking.threshold', 'Mask Threshold', 0, 1, 0.01)}
                </div>
            </details>

            ${this._createSliderHTML('groundGlow.luminanceThreshold', 'Light Threshold', 0, 1, 0.01, 'The scene brightness level above which the glow will fade out.')}
            ${this._createSliderHTML('groundGlow.softness', 'Edge Softness', 0.01, 1, 0.01)}
            ${this._createCheckboxHTML('groundGlow.invert', 'Invert (Glow in Light)', false, 'Makes the effect appear in lit areas instead of dark ones.')}
            ${this._createSliderHTML('groundGlow.brightness', 'Brightness', 0, 5, 0.05)}
            ${this._createSliderHTML('groundGlow.saturation', 'Saturation', 0, 5, 0.05)}
        `);

        content += this._createAccordionHTML('advancedBloom', 'Global Bloom Effect', `
            <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;">
                <strong style="color: #ffddaa;">EXPERIMENTAL:</strong> This is a global post-processing effect that applies bloom to the entire scene. It is currently unsupported and may not work as expected or may conflict with other modules.
            </div>
            ${this._createSliderHTML('advancedBloom.threshold', 'Threshold', 0, 1, 0.01)}
            ${this._createSliderHTML('advancedBloom.bloomScale', 'Bloom Scale', 0, 4, 0.05)}
            ${this._createSliderHTML('advancedBloom.brightness', 'Brightness', 0, 2, 0.05)}
            ${this._createSliderHTML('advancedBloom.blur', 'Blur Amount', 0, 20, 0.5)}
            ${this._createSliderHTML('advancedBloom.quality', 'Quality', 1, 15, 1)}
        `);

        content += this._createAccordionHTML('postProcessing', 'Post Processing', `
            <p class="description-text">Applies global screen-space effects to the entire canvas, like a Photoshop filter.</p>
            <details id="details-postProcessing-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('postProcessing.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                <div>
                    <details id="details-postProcessing-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 15px;">
                            ${this._createSliderHTML('postProcessing.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                            ${this._createSliderHTML('postProcessing.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                            ${this._createSliderHTML('postProcessing.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                            ${this._createCheckboxHTML('postProcessing.colorCorrection.invert', 'Invert Colors')}
                    </div></details>
                    <details id="details-postProcessing-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 15px;">
                            ${this._createSliderHTML('postProcessing.colorCorrection.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies scene brightness, simulating camera exposure.')}
                            ${this._createSliderHTML('postProcessing.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05, 'Adjusts mid-tones. < 1 lightens, > 1 darkens.')}
                            ${this._createSliderHTML('postProcessing.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the image.')}
                            ${this._createSliderHTML('postProcessing.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the image.')}
                    </div></details>
                    <details id="details-postProcessing-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 15px;">
                            <p class="description-text">Simulates camera white balance correction.</p>
                            ${this._createSliderHTML('postProcessing.colorCorrection.whiteBalance.temperature', 'Temperature', -1, 1, 0.01, 'Negative values are cooler (blue), positive are warmer (orange).')}
                            ${this._createSliderHTML('postProcessing.colorCorrection.whiteBalance.tint', 'Tint', -1, 1, 0.01, 'Negative values shift toward magenta, positive toward green.')}
                    </div></details>
                </div>
            </details>
            <details id="details-postProcessing-vignette"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('postProcessing.vignette.enabled', 'Vignette', true)}</div></summary>
                <div>
                    <p class="description-text">Darkens the corners of the screen.</p>
                    ${this._createSliderHTML('postProcessing.vignette.amount', 'Amount', 0, 2, 0.05)}
                    ${this._createSliderHTML('postProcessing.vignette.softness', 'Softness', 0, 1, 0.05)}
                </div>
            </details>
            <details id="details-postProcessing-lensDistortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('postProcessing.lensDistortion.enabled', 'Lens Distortion', true)}</div></summary>
                <div>
                    ${this._createSliderHTML('postProcessing.lensDistortion.amount', 'Amount', -1, 1, 0.01, 'Positive values create barrel distortion, negative create pincushion.')}
                    ${this._createSliderHTML('postProcessing.lensDistortion.centerX', 'Center X', 0, 1, 0.01)}
                    ${this._createSliderHTML('postProcessing.lensDistortion.centerY', 'Center Y', 0, 1, 0.01)}
                </div>
            </details>
            <details id="details-postProcessing-chromaticAberration"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('postProcessing.chromaticAberration.enabled', 'Chromatic Aberration', true)}</div></summary>
                <div>
                    <p class="description-text">Splits the color channels, creating a fringe effect common in camera lenses.</p>
                    ${this._createSliderHTML('postProcessing.chromaticAberration.amount', 'Amount', -0.05, 0.05, 0.001)}
                    ${this._createSliderHTML('postProcessing.chromaticAberration.centerX', 'Center X', 0, 1, 0.01)}
                    ${this._createSliderHTML('postProcessing.chromaticAberration.centerY', 'Center Y', 0, 1, 0.01)}
                </div>
            </details>
            <details id="details-postProcessing-tiltShift"><summary><span class="accordion-toggle"></span><div class="summary-control">${this._createCheckboxHTML('postProcessing.tiltShift.enabled', 'Tilt Shift', true)}</div></summary>
                <div>
                    <p class="description-text">Simulates a shallow depth-of-field, blurring the top and bottom of the screen.</p>
                    ${this._createSliderHTML('postProcessing.tiltShift.blur', 'Blur', 0, 500, 1)}
                    ${this._createSliderHTML('postProcessing.tiltShift.gradientBlur', 'Gradient Blur', 0, 5000, 10)}
                    ${this._createSliderHTML('postProcessing.tiltShift.startX', 'Start X', 0, 1, 0.01)}
                    ${this._createSliderHTML('postProcessing.tiltShift.startY', 'Start Y', 0, 1, 0.01)}
                    ${this._createSliderHTML('postProcessing.tiltShift.endX', 'End X', 0, 1, 0.01)}
                    ${this._createSliderHTML('postProcessing.tiltShift.endY', 'End Y', 0, 1, 0.01)}
                </div>
            </details>
        `);

        content += `
            <details id="details-profile-management"><summary><span class="accordion-toggle"></span><strong>Profile Management</strong></summary>
                <div class="profile-controls">
                    <button id="profile-save-scene" title="Save current settings directly to this scene. This becomes the new baseline for this map. (GM Only)">Save to Scene</button>
                    <button id="profile-revert-scene" title="Clear your temporary changes and revert to the settings saved in the scene.">Revert to Scene Default</button>
                    <button id="profile-revert-module" title="Temporarily ignore scene settings and use the module's hardcoded defaults.">Revert to Module Default</button>
                    <hr style="border-color: #555; margin: 8px 0;">

                    <strong style="text-align: center; display: block; margin-bottom: 5px;">World Profiles</strong>
                    <div style="display: grid; grid-template-columns: 1fr auto; gap: 5px;">
                        <input type="text" id="profile-name" placeholder="New World Profile Name...">
                        <button id="profile-save" title="Save current settings as a new world-level profile, available across all scenes.">Save</button>
                        <select id="profiles-dropdown" style="grid-column: 1 / 3;"></select>
                        <div style="display: flex; gap: 5px; grid-column: 1 / 3;">
                            <button id="profile-load" title="Load selected world profile, overwriting current settings.">Load</button>
                            <button id="profile-update" title="Overwrite the selected world profile with current settings.">Update</button>
                            <button id="profile-delete" style="color: #ff8080;" title="Delete selected world profile. This cannot be undone.">Del</button>
                            <button id="profile-set-default" title="Set the selected profile as the default for new, unsaved scenes." style="flex-grow: 1;">Set Default</button>
                        </div>
                    </div>

                    <hr style="border-color: #555; margin: 8px 0;">
                    <button id="output-config-btn" title="Log the current full config object to the console for copy/pasting.">Log Full Config to Console</button>

                    <div class="control-row" style="background: #551111; padding: 4px; border-radius: 3px; margin-top: 8px;">
                        <label for="control-showTokenMask">Show Token Mask</label>
                        <div class="widget-group"><input type="checkbox" id="control-showTokenMask" data-path="showTokenMask"></div>
                    </div>
                </div>
            </details>
        `;
        return content;
    }

    _createSafeId(path) {
        return `control-${path.replace(/\.|\[|\]|\s/g, '-')}`;
    }
    _createAccordionHTML(id, title, content) {
        const path = `${id}.enabled`;
        return `<details id="details-${id}">
                    <summary>
                         <span class="accordion-toggle"></span>
                         <div class="summary-control">
                            ${this._createCheckboxHTML(path, title, true)}
                         </div>
                    </summary>
                    <div style="padding-top: 5px;">${content}</div>
                </details>`;
    }
    _createCheckboxHTML(path, label, isSummary = false, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        const checkbox = `<div class="widget-group"><input type="checkbox" id="${id}" data-path="${path}"></div>`;
        const labelHtml = isSummary ? `<span class="summary-label" ${titleAttr}>${label}</span>` : `<label for="${id}" class="summary-label" ${titleAttr}>${label}</label>`;
        if (isSummary) {
            return `${labelHtml}${checkbox}`;
        }
        return `<div class="control-row">${labelHtml}${checkbox}</div>`;
    }
    _createSliderHTML(path, label, min, max, step, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        return `<div class="control-row control-row-slider"><label for="${id}" ${titleAttr}>${label}</label><input type="range" id="${id}" data-path="${path}" min="${min}" max="${max}" step="${step}"><span id="${id}-value" class="value-span">0.0</span></div>`;
    }
    _createColorPickerHTML(path, label) {
        const id = this._createSafeId(path);
        return `<div class="control-row"><label for="${id}">${label}</label><div class="widget-group" style="flex-grow: 1;"><input type="color" id="${id}" data-path="${path}"></div></div>`;
    }
    _createSelectHTML(path, label, options, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        const opts = Object.entries(options).map(([k, v]) => `<option value="${v}">${k}</option>`).join('');
        return `<div class="control-row"><label for="${id}" ${titleAttr}>${label}</label><select id="${id}" data-path="${path}">${opts}</select></div>`;
    }
    _createGradientSelectHTML(path, label) {
        const id = this._createSafeId(path);
        const opts = Object.entries(GRADIENT_PRESETS).map(([name, data]) => {
            const gradientCSS = `linear-gradient(to right, ${data.colors.join(', ')})`;
            return `<option value="${name}" style="background: ${gradientCSS};">${name}</option>`;
        }).join('');
        return `<div class="control-row"><label for="${id}">${label}</label><select id="${id}" data-path="${path}" class="gradient-picker">${opts}</select></div>`;
    }
    _createTextureInputHTML(key, label) {
        return `<div class="control-row" style="margin-bottom: 5px;"><label><span id="status-textures-${key}" class="traffic-light unknown"></span>${label}</label><input type="text" id="texture-path-${key}" disabled title="This path is discovered automatically based on the base map's filename. (e.g., 'map.webp' -> 'map_Specular.webp')"></div>`;
    }
}

class DebuggerEventHandler {
    constructor(element, config, profileManager) {
        this.element = element;
        this.config = config;
        this.profileManager = profileManager;
    }

    initialize() {
        this.addEventListeners();
        this._makeDraggable();
        this.updateAllControls();
    }

    addEventListeners() {
        this.element.addEventListener('click', (e) => {
            if (e.target.closest('[data-stop-propagation="true"]')) {
                e.stopPropagation();
            }
        }, true);
        this.element.addEventListener('input', this._handleGenericInput.bind(this));
        this.element.querySelector('#material-editor-help-btn').addEventListener('click', () => {
            console.log("MapShine | Help button clicked. (Functionality to be implemented)");
        });
        this.element.querySelector('#material-editor-minimize-btn').addEventListener('click', this._toggleMinimized.bind(this));

        this.element.querySelector('#material-editor-close-btn').addEventListener('click', this._onClose.bind(this));

        this.element.querySelector('#profile-save').addEventListener('click', this._onSaveProfile.bind(this));
        this.element.querySelector('#profile-load').addEventListener('click', this._onLoadProfile.bind(this));
        this.element.querySelector('#profile-update').addEventListener('click', this._onUpdateProfile.bind(this));
        this.element.querySelector('#profile-set-default').addEventListener('click', this._onSetDefaultProfile.bind(this));
        this.element.querySelector('#profile-delete').addEventListener('click', this._onDeleteProfile.bind(this));
        this.element.querySelector('#profile-save-scene').addEventListener('click', () => this.profileManager.saveConfigToScene());
        this.element.querySelector('#profile-revert-scene').addEventListener('click', () => this.profileManager.revertToSceneDefault());
        this.element.querySelector('#profile-revert-module').addEventListener('click', () => this.profileManager.revertToModuleDefault());
        this.element.querySelector('#output-config-btn').addEventListener('click', this._onOutputConfig.bind(this));
    }

    _onClose() {
        if (game.mapShine.debugger) {
            game.mapShine.debugger.destroy();
        }
    }

    _getPathValue(obj, path) {
        return path.split('.').reduce((acc, part) => {
            if (!acc) return undefined;
            const match = part.match(/(\w+)\[(\d+)\]/);
            if (match) {
                const arr = acc[match[1]];
                return arr ? arr[parseInt(match[2])] : undefined;
            }
            return acc[part];
        }, obj);
    }

    _handleGenericInput(e) {
        const path = e.target.dataset.path;
        if (!path) return;

        let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        if (e.target.type === 'range' || (e.target.tagName === 'SELECT' && !isNaN(Number(value)))) {
            value = Number(value);
        }

        this.profileManager.recordUserChange(path, value);

        try {
            foundry.utils.setProperty(this.config, path, value);
        } catch (err) {
            console.error(`MapShine Debugger | Failed to set property for path: ${path}`, err);
            return;
        }

        if (e.target.type === 'range') {
            this._updateSliderValue(e.target.id, value, e.target.step);
        }
        if (e.target.type === 'checkbox' && e.target.closest('.summary-control')) {
            const detailsElement = e.target.closest('details');
            if (detailsElement) {
                detailsElement.classList.toggle('disabled-effect', !e.target.checked);
            }
        }
        if (path === 'baseShine.patternType') {
            this._updatePatternControlVisibility();
        }

        if (path === 'tileOpacity') {
            game.mapShine.effectTargetManager.applyTileOpacities();
        } else {
            this._triggerGlobalRefresh();
        }
    }

    async _triggerGlobalRefresh() {

        await game.mapShine.effectTargetManager.refresh();

        for (const layer of canvas.layers) {
            if (typeof layer.updateFromConfig === 'function') {
                await layer.updateFromConfig(this.config);
            }
        }
        ScreenEffectsManager.updateAllFiltersFromConfig(this.config);
    }

    updateAllControls() {
        this.element.querySelectorAll('[data-path]').forEach(el => {
            const path = el.dataset.path;
            const value = this._getPathValue(this.config, path);
            if (value === undefined) return;

            if (el.type === 'checkbox') {
                el.checked = value;
                if (el.closest('.summary-control')) {
                    const detailsElement = el.closest('details');
                    if (detailsElement) detailsElement.classList.toggle('disabled-effect', !el.checked);
                }
            } else {
                el.value = value;
            }
            if (el.type === 'range') {
                this._updateSliderValue(el.id, value, el.step);
            }
        });
        this._updatePatternControlVisibility();
    }

    applyProfileUIState(profileData) {
        if (!profileData || !profileData.ui || !profileData.ui.details) return;
        for (const [id, isOpen] of Object.entries(profileData.ui.details)) {
            const detailElement = this.element.querySelector(`#${id}`);
            if (detailElement) detailElement.open = isOpen;
        }
    }

    _updateSliderValue(elementId, value, step) {
        const valueEl = this.element.querySelector(`#${elementId}-value`);
        if (valueEl) {
            const stepString = String(step);
            const decimals = stepString.includes('.') ? stepString.split('.')[1].length : 0;
            valueEl.textContent = Number(value).toFixed(decimals);
        }
    }

    _updatePatternControlVisibility() {
        const isStripes = this.config.baseShine.patternType === 'stripes';
        this.element.querySelector('#pattern-stripes-controls').style.display = isStripes ? '' : 'none';
        this.element.querySelector('#pattern-checkerboard-controls').style.display = isStripes ? 'none' : '';
    }

    async _populateProfilesDropdown() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        const profiles = await this.profileManager.getProfiles();
        const names = Object.keys(profiles).sort();
        const defaultProfileName = this.profileManager.getDefaultProfileName();

        dropdown.innerHTML = '';
        if (names.length) {
            names.forEach(n => {
                const isDefault = (n === defaultProfileName) ? ' (Default)' : '';
                dropdown.add(new Option(`${n}${isDefault}`, n));
            });
            dropdown.value = defaultProfileName || names[0];
            dropdown.disabled = false;
        } else {
            dropdown.add(new Option('No profiles saved', ''));
            dropdown.disabled = true;
        }
    }

    async _onSaveProfile() {
        const nameInput = this.element.querySelector('#profile-name');
        const name = nameInput.value.trim();
        const uiState = { details: {} };
        this.element.querySelectorAll('details[id]').forEach(el => { uiState.details[el.id] = el.open; });

        const success = await this.profileManager.saveProfile(name, this.config, uiState);
        if (success) {
            nameInput.value = '';
            this._populateProfilesDropdown();
        }
    }

    async _onUpdateProfile() {
        const name = this.element.querySelector('#profiles-dropdown').value;
        const uiState = {
            details: {}
        };
        this.element.querySelectorAll('details[id]').forEach(el => {
            uiState.details[el.id] = el.open;
        });
        await this.profileManager.updateProfile(name, this.config, uiState);
    }

    async _onLoadProfile() {
        const name = this.element.querySelector('#profiles-dropdown').value;
        if (!name) return ui.notifications.warn("No profile selected to load.");

        await this.profileManager.loadProfile(name);
    }

    async _onSetDefaultProfile() {
        const name = this.element.querySelector('#profiles-dropdown').value;
        if (!name) return ui.notifications.warn("No profile selected to set as default.");
        await this.profileManager.setDefaultProfile(name);
        this._populateProfilesDropdown();
    }

    async _onDeleteProfile() {
        const name = this.element.querySelector('#profiles-dropdown').value;
        const success = await this.profileManager.deleteProfile(name);
        if (success) {
            this._populateProfilesDropdown();
        }
    }

    _onOutputConfig() {

        const currentConfig = foundry.utils.deepClone(this.config);

        const configString = JSON.stringify(currentConfig, null, 4);

        console.log("--- MAP SHINE: CURRENT CONFIG VALUES (for copy/paste) ---");
        console.log(configString);
        console.log("--- END CONFIG ---");

        try {
            navigator.clipboard.writeText(configString);
            ui.notifications.info("Config object logged to console & copied to clipboard.");
        } catch (err) {
            ui.notifications.warn("Config object logged to console. (Copying failed).");
            console.error("MapShine | Failed to copy config to clipboard:", err);
        }
    }

    _toggleMinimized() {
        const isMinimized = this.element.classList.toggle('minimized');
        const btn = this.element.querySelector('#material-editor-minimize-btn');
        if (!btn) return;
        const iconContainer = btn.querySelector('div') || document.createElement('div');
        if (isMinimized) {
            iconContainer.className = 'star-icon';
            btn.innerHTML = '';
            btn.appendChild(iconContainer);
            btn.title = 'Restore';
        } else {
            iconContainer.className = '';
            btn.innerHTML = '-';
            btn.title = 'Minimize';
        }
    }

    _makeDraggable() {
        const elmnt = this.element;
        const header = elmnt.querySelector('#material-editor-header');
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        const dragMouseDown = (e) => {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
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
        if (header) header.onmousedown = dragMouseDown;
    }
}

class MaterialEditorDebugger {
    constructor() {
        this.element = null;
        this.uiBuilder = null;
        this.eventHandler = null;
        this.profileManager = null;
        this._boundUpdateIndicator = this._updateIndicator.bind(this);
    }

    initialize(profileManager) {
        this.profileManager = profileManager;
        this.uiBuilder = new DebuggerUIBuilder();

        this.element = this.uiBuilder.buildRootElement();
        document.body.appendChild(this.element);

        this.eventHandler = new DebuggerEventHandler(this.element, OVERLAY_CONFIG, this.profileManager);
        this.eventHandler.initialize();

        this._populateAllIndicators();
        systemStatus.on('statusChanged', this._boundUpdateIndicator);

        console.log("Material Editor | UI system initialized and subscribed to status updates.");
    }

    destroy() {
        systemStatus.off('statusChanged', this._boundUpdateIndicator);
        this.element?.remove();
        this.element = null;
        this.uiBuilder = null;
        this.eventHandler = null;
        this.profileManager = null;
        game.mapShine.debugger = null; 
        
        // Re-render the controls to show the button as inactive
        ui.controls.render(true);

        console.log("Material Editor | UI destroyed.");
    }

    applyProfileState(profileData) {
        if (this.eventHandler) {
            this.eventHandler.updateAllControls();
            this.eventHandler.applyProfileUIState(profileData);
        }
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
                pathInput.value = statusObject.message;
                pathInput.title = statusObject.message;
            }
        }
    }
}

Hooks.once('init', () => {

    if (game.mapShine?.initialized) {
        console.log("Map Shine | Initialization aborted: module has already been initialized.");
        return;
    }

    game.mapShine = {
        initialized: true,
        loadingScreen: null,
        profileManager: null,
        debugger: null,
        tokenMaskManager: null,
        tokenMaskDebugSprite: null,
        showEditor: async function() {

            if (game.mapShine.debugger) {

                game.mapShine.debugger.element.classList.remove('minimized');

                return;
            }

            game.mapShine.debugger = new MaterialEditorDebugger();

            game.mapShine.debugger.initialize(game.mapShine.profileManager);

            await game.mapShine.profileManager.initialize(game.mapShine.debugger);
        },
        effectTargetManager: {
            targets: {
                background: null,
                tiles: new Map()
            },
            async refresh() {
                console.log("MapShine | Refreshing effect targets...");
                const loader = new TextureAutoLoader();
                this.targets = await loader.discoverAllTargets();

                this.applyTileOpacities();

                await this.broadcastUpdate();

                Hooks.callAll('mapShine:targetsRefreshed');
            },
            async broadcastUpdate() {
                const updatePromises = [];
                for (const layer of canvas.layers) {
                    if (typeof layer.updateEffectTargets === 'function') {

                        updatePromises.push(layer.updateEffectTargets(this.targets));
                    }
                }

                await Promise.all(updatePromises);
            },
            applyTileOpacities() {

                for (const tile of canvas.tiles.placeables) {
                    if (!tile.mesh) continue;

                    const isTargetWithEffects = this.targets.tiles.has(tile.id) && OVERLAY_CONFIG.enabled;

                    if (isTargetWithEffects) {

                        tile.mesh.alpha = OVERLAY_CONFIG.tileOpacity;
                    } else {

                        tile.mesh.alpha = 1.0;
                    }
                }
            }
        }
    };

    // --- Global Accessibility Settings ---
    game.settings.register(MODULE_ID, 'user-disable-distortion', {
        name: "Global Override: Disable Screen Distortion",
        hint: "Disables all screen-warping effects (e.g., Heat, Lens Distortion) to prevent motion sickness. This overrides all other settings.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => game.mapShine?.profileManager?.applyEffectiveConfig(),
    });

    game.settings.register(MODULE_ID, 'user-disable-color-fringe', {
        name: "Global Override: Disable Color Fringe",
        hint: "Disables all 'chromatic aberration' effects to improve visual clarity. This overrides all other settings.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => game.mapShine?.profileManager?.applyEffectiveConfig(),
    });

    // --- Per-Effect Override Settings ---
    Object.entries(CLIENT_OVERRIDES_CONFIG).forEach(([key, data]) => {
        game.settings.register(MODULE_ID, `user-${key}-enabled`, {
            name: data.name,
            hint: `Toggles the '${data.name}' effect. If off, this overrides the scene's setting.`,
            scope: "client",
            config: true,
            type: Boolean,
            default: true,
            onChange: () => game.mapShine?.profileManager?.applyEffectiveConfig(),
        });

        if (data.intensitySubPath) {
            game.settings.register(MODULE_ID, `user-${key}-intensity`, {
                name: `+- Intensity`,
                hint: `Modifies the intensity of '${data.name}' as a percentage of the scene's setting.`,
                scope: "client",
                config: true,
                type: Number,
                range: {
                    min: 0,
                    max: 100,
                    step: 1
                },
                default: 100,
                onChange: () => game.mapShine?.profileManager?.applyEffectiveConfig(),
            });
        }
    });

    game.settings.register(MODULE_ID, PROFILES_SETTING, {
        name: "Material Effect Profiles",
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });

    game.settings.register(MODULE_ID, DEFAULT_PROFILE_SETTING, {
        name: "Default Material Profile Name",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    game.settings.register(MODULE_ID, 'user-adjustments', {
        name: "User-specific FX Overrides",
        scope: "client",
        config: false,
        type: Object,
        default: {}
    });

    game.settings.register(MODULE_ID, 'ambientLayerZIndex', {
        name: "Ambient Layer Z-Index (Requires Reload)",
        hint: "Controls the rendering order of the Ambient/Emissive layer. Changes require a canvas reload.",
        scope: "client",
        config: false,
        type: Number,
        default: 250
    });

    if (game.modules.get('libwrapper')?.active) {

        libwrapper.register(MODULE_ID, 'Token.prototype.refresh', function(wrapped, ...args) {
            wrapped(...args);
            if (game.mapShine?.tokenMaskManager) {
                game.mapShine.tokenMaskManager._requestUpdate();
            }
        }, 'WRAPPER');

        libwrapper.register(MODULE_ID, 'Canvas.prototype.pan', function(wrapped, ...args) {
            const result = wrapped(...args);

            for (const layer of canvas.layers) {
                if (typeof layer?._onPan === 'function') {
                    layer._onPan();
                }
                if (typeof layer?._onResize === 'function') {
                    layer._onResize();
                }
            }

            if (game.mapShine?.ambientMaskManager?._onResize) {
                game.mapShine.ambientMaskManager._onResize();
            }

            return result;
        }, 'WRAPPER');

        console.log("MapShine | libWrapper hooks for Token Refresh and Canvas Pan have been registered.");
    } else {
        console.warn("MapShine | libWrapper is not active. Some performance optimizations will not be available.");
    }

    Hooks.on('getSceneControlButtons', (controls) => {
        if (!game.user.isGM) return;

        const mapShineButton = {
            name: 'map-shine',
            title: 'Map Shine Toolkit',
            icon: 'fas fa-star',
            layer: 'mapShineControls',
            tools: {
                'open-editor': {
                    name: 'open-editor',
                    title: 'Open Editor',
                    icon: 'fas fa-star',
                    toggle: true,
                    active: !!game.mapShine?.debugger,
                    onClick: (toggled) => {
                        if (toggled) {
                            if (game.mapShine?.showEditor) {
                                game.mapShine.showEditor();
                            }
                        } else {
                            game.mapShine.debugger?.destroy();
                        }
                    }
                }
            },
            activeTool: 'open-editor'
        };

        controls['map-shine'] = mapShineButton;
    });

    const ambientZIndex = game.settings.get(MODULE_ID, 'ambientLayerZIndex');

    Object.assign(CONFIG.Canvas.layers, {
        mapShineBackground: {
            layerClass: BackgroundLayer,
            group: "primary"
        },
        groundGlow: {
            layerClass: GroundGlowLayer,
            group: "environment"
        },
        heatDistortion: {
            layerClass: HeatDistortionLayer,
            group: "primary"
        },
        proceduralPattern: {
            layerClass: ProceduralPatternLayer,
            group: "primary"
        },
        iridescencePattern: {
            layerClass: IridescencePatternLayer,
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
        dustMotes: {
            layerClass: DustMotesLayer,
            group: "environment"
        },
        cloudShadows: {
            layerClass: CloudShadowsLayer,
            group: "environment"
        },
        ambient: {
            layerClass: AmbientLayer,
            group: "environment",
            zIndex: ambientZIndex
        }
    });

    console.log(`MaterialToolkit | Registered all settings and layers. AmbientLayer zIndex set to: ${ambientZIndex}.`);

    Hooks.on('canvasInit', () => {
        console.log("Map Shine | Hooks.on('canvasInit'): Fired.");

        if (!game.mapShine.loadingScreen) {
            try {
                game.mapShine.loadingScreen = new LoadingScreen();
                game.mapShine.loadingScreen.show();
                console.log("Map Shine | Loading screen shown via canvasInit.");
            } catch (err) {
                console.error("Map Shine | Failed to show loading screen:", err);
                game.mapShine.loadingScreen = null;
            }
        }

        game.mapShine.profileManager = new ProfileManager();
    });

    Hooks.on('canvasReady', async () => {
        console.log("Map Shine | Hooks.on('canvasReady'): Fired.");

        const iridescenceLayer = canvas.layers.find(l => l instanceof IridescenceLayer);
        const iridescencePatternLayer = canvas.layers.find(l => l instanceof IridescencePatternLayer);
        if (iridescenceLayer) {
            iridescenceLayer.patternLayer = iridescencePatternLayer;
        }

        const loadingScreen = game.mapShine.loadingScreen;

        const mapShineLayerClasses = Object.values(CONFIG.Canvas.layers)
            .filter(l => l.group === "primary" || l.group === "environment")
            .map(l => l.layerClass);

        const layersToUpdate = canvas.layers.filter(l =>
            mapShineLayerClasses.includes(l.constructor) && typeof l.updateFromConfig === 'function'
        );

        const totalSteps = 7;
        let currentStep = 0;
        const updateProgress = (stepName) => {
            currentStep++;
            console.log(`Map Shine | Loading Step ${currentStep}/${totalSteps}: ${stepName}`);
            if (loadingScreen) {

                const progressPercentage = (currentStep / totalSteps) * 90;
                loadingScreen.setProgress(progressPercentage);
            }
        };

        await game.mapShine.profileManager.initialize();
        updateProgress("Profile Manager Initialized");

        ScreenEffectsManager.initialize(canvas.stage);
        ScreenEffectsManager.setupAllGlobalFilters();
        updateProgress("Screen Effects Manager Initialized");

        for (const layer of layersToUpdate) {
            await layer.updateFromConfig(OVERLAY_CONFIG);
        }
        updateProgress("All Effect Layers Configured");

        const deltaTime = 1 / 60.0;

        const proceduralPatternLayer = canvas.layers.find(l => l instanceof ProceduralPatternLayer);
        if (proceduralPatternLayer?._onAnimate) {
            proceduralPatternLayer._onAnimate(deltaTime);
        }

        if (iridescencePatternLayer?._onAnimate) {
            iridescencePatternLayer._onAnimate(deltaTime);
        }

        updateProgress("Pattern Layers Pre-rendered");

        await game.mapShine.effectTargetManager.refresh();
        const targets = game.mapShine.effectTargetManager.targets;
        for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
            let status = { state: 'inactive', message: 'Not in use by any target.' };
            const backgroundHasMap = !!(targets.background?.[key]);
            const tileHasMap = Array.from(targets.tiles.values()).some(tileData => !!tileData[key]);
            if (backgroundHasMap || tileHasMap) {
                status = { state: 'ok', message: 'Active.' };
            } else {
                status = { state: 'warning', message: 'Not found for any active target.' };
            }
            systemStatus.update('textures', key, status);
        }
        updateProgress("Texture Targets Discovered");

        new LightingEffectManager();
        new AmbientMaskManager();
        game.mapShine.tokenMaskManager = new DynamicTokenMaskManager();
        updateProgress("Scene-level Managers Initialized");

        updateProgress("Pre-rendering final frame");
        if (game.mapShine.tokenMaskManager?.renderMask) {
            game.mapShine.tokenMaskManager.renderMask();
        }
        for (const layer of layersToUpdate) {
            if (typeof layer._onAnimate === 'function') {
                layer._onAnimate(deltaTime);
            }
        }

        if (OVERLAY_CONFIG.debug) {
            const debugSprite = new PIXI.Sprite(game.mapShine.tokenMaskManager.getMaskTexture());
            canvas.stage.addChild(debugSprite);
            game.mapShine.tokenMaskDebugSprite = debugSprite;
            debugSprite.visible = OVERLAY_CONFIG.showTokenMask;
            const debugTicker = () => {
                if (game.mapShine.tokenMaskDebugSprite) {
                    const sprite = game.mapShine.tokenMaskDebugSprite;
                    sprite.visible = OVERLAY_CONFIG.showTokenMask;
                    if (sprite.visible) {
                        const stage = canvas.stage;
                        const screen = canvas.app.screen;
                        const topLeft = stage.toLocal({ x: 0, y: 0 });
                        sprite.position.copyFrom(topLeft);
                        sprite.width = screen.width / stage.scale.x;
                        sprite.height = screen.height / stage.scale.y;
                    }
                }
            };
            canvas.app.ticker.add(debugTicker);
        }

        if (loadingScreen) {
            await loadingScreen.hide();
            game.mapShine.loadingScreen = null;
        }
    });

    Hooks.on("createTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("updateTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("deleteTile", () => game.mapShine?.effectTargetManager.refresh());

    Hooks.on("canvasTearDown", () => {
        if (game.mapShine?.tokenMaskDebugSprite) {
            game.mapShine.tokenMaskDebugSprite.destroy();
            game.mapShine.tokenMaskDebugSprite = null;
        }
    });
});