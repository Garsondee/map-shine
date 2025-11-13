import { PIXI, RenderTexture, Texture, Filter, SCALE_MODES, WRAP_MODES } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { BLEND_MODE_OPTIONS } from "../config/blend-modes.js";
import { ResizableAnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import { hexToRgbArray } from "../utils/ColorUtils.js";

class FoamFilter extends PIXI.Filter {
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

                // Input Textures
                uniform sampler2D uWaterMask;

                // World & Camera
                uniform vec2 u_camera_offset;
                uniform vec2 u_view_size;
                uniform float u_time;
                uniform vec2 uTexelSize;
                uniform vec2 uCanvasScale;

                // Foam Parameters
                uniform float uIntensity;
                uniform float uThreshold;
                uniform float uSoftness;
                uniform vec3 uColor;
                uniform float uSmallBlurSize;
                uniform float uLargeBlurSize;

                // Blur Turbulence
                uniform float uBlurNoiseStrength;
                uniform float uBlurNoiseScale;
                uniform float uBlurNoiseSpeed;

                // Main Foam Pattern Noise
                uniform float uNoiseScale;
                uniform float uNoiseSpeed;
                uniform float uNoiseEvolution;
                uniform int uNoiseOctaves;
                uniform float uNoiseLacunarity;
                uniform float uNoisePersistence;

                // Foam Breakup Noise
                uniform bool uBreakupNoiseEnabled;
                uniform float uBreakupNoiseScale;
                uniform float uBreakupNoiseEvolution;
                uniform int uBreakupNoiseOctaves;
                uniform float uBreakupNoiseLacunarity;
                uniform float uBreakupNoisePersistence;
                uniform float uBreakupNoiseBrightness;
                uniform float uBreakupNoiseContrast;

                // Foam Suppression Noise
                uniform bool uSuppressionNoiseEnabled;
                uniform float uSuppressionNoiseScale;
                uniform float uSuppressionNoiseSpeed;
                uniform float uSuppressionNoiseEvolution;
                uniform int uSuppressionNoiseOctaves;
                uniform float uSuppressionNoiseLacunarity;
                uniform float uSuppressionNoisePersistence;
                uniform float uSuppressionNoiseBrightness;
                uniform float uSuppressionNoiseContrast;

                // Crest Foam (Wave Shape)
                uniform bool uCrestFoamEnabled;
                uniform float uCrestFoamIntensity;
                uniform float uCrestFoamFrequency;
                uniform float uCrestFoamSpeed;
                uniform float uCrestFoamAngle;
                uniform float uCrestFoamSharpness;
                uniform float uCrestFoamPerturbStrength;
                uniform float uCrestFoamPerturbScale;
                uniform float uCrestFoamPerturbSpeed;
                uniform int uCrestFoamPerturbOctaves;

                // Crest Foam (Breakup Texture)
                uniform float uCrestBreakupScale;
                uniform float uCrestBreakupSpeed;
                uniform int uCrestBreakupOctaves;
                uniform float uCrestBreakupBrightness;
                uniform float uCrestBreakupContrast;


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
                    vec3 x2 = x0 - i2 + C.yyy;
                    vec3 x3 = x0 - D.yyy;
                    i = mod(i, 289.0);
                    vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
                    float n_ = 0.142857142857;
                    vec3  ns = n_ * D.wyz - D.xzx;
                    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                    vec4 x_ = floor(j * ns.z);
                    vec4 y_ = floor(j - 7.0 * x_ );
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
                    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                    m = m * m;
                    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                }

                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }

                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                            mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
                }

                float fbm_parameterized(vec2 st, int octaves, float lacunarity, float persistence) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 8; i++) {
                        if (i >= octaves) break;
                        value += amplitude * noise(st);
                        st *= lacunarity;
                        amplitude *= persistence;
                    }
                    return value;
                }

                float fbm_snoise(vec3 st, int octaves, float lacunarity, float persistence) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 8; i++) {
                        if (i >= octaves) break;
                        value += amplitude * snoise(st);
                        st *= lacunarity;
                        amplitude *= persistence;
                    }
                    return value;
                }

                float turbulentGaussianBlur(sampler2D tex, vec2 uv, float radius) {
                    vec2 worldCoord = u_camera_offset + (uv * u_view_size);
                    vec2 noise_uv = worldCoord * uBlurNoiseScale * 0.01 + u_time * uBlurNoiseSpeed;
                    vec2 noise_offset = vec2(noise(noise_uv), noise(noise_uv + vec2(17.3, -41.1))) - 0.5;
                    noise_offset *= uBlurNoiseStrength * uTexelSize * uCanvasScale.x;
                    float angle = random(vScreenCoord) * 6.2831853;
                    float s = sin(angle);
                    float c = cos(angle);
                    mat2 rotationMatrix = mat2(c, -s, s, c);
                    vec2 step = uTexelSize * uCanvasScale.x * radius;
                    float sum = 0.0;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.14383161, -0.14100790 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.19984126, 0.78641367 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.24188840, 0.99706507 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.81409955, 0.91437590 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.26496911, -0.41893023 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.79197514, 0.19090188 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.53742981, -0.47373420 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.44323325, -0.97511554 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.97484398, 0.75648379 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.38277543, 0.27676845 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.91588581, 0.45771432 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.81544232, -0.87912464 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.094184101, -0.92938870 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.94558609, -0.76890725 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( -0.94201624, -0.39906216 ) * step + noise_offset).r;
                    sum += texture2D(tex, uv + rotationMatrix * vec2( 0.34495938, 0.29387760 ) * step + noise_offset).r;
                    return sum / 16.0;
                }

                void main() {
                    float waterValue = texture2D(uWaterMask, vScreenCoord).r;
                    if (waterValue < 0.01) {
                        discard;
                    }

                    float smallBlur = turbulentGaussianBlur(uWaterMask, vScreenCoord, uSmallBlurSize);
                    float largeBlur = turbulentGaussianBlur(uWaterMask, vScreenCoord, uLargeBlurSize);
                    float edge = max(0.0, smallBlur - largeBlur);
                    float foamMask = smoothstep(uThreshold, uThreshold + uSoftness, edge);

                    if (uBreakupNoiseEnabled) {
                        vec2 worldCoord = u_camera_offset + (vScreenCoord * u_view_size);
                        vec2 breakupNoiseUV = worldCoord * uBreakupNoiseScale * 0.01;
                        breakupNoiseUV.x += u_time * uBreakupNoiseEvolution;
                        float breakupNoise = fbm_parameterized(breakupNoiseUV, uBreakupNoiseOctaves, uBreakupNoiseLacunarity, uBreakupNoisePersistence);
                        breakupNoise = (breakupNoise - 0.5 + uBreakupNoiseBrightness) * uBreakupNoiseContrast + 0.5;
                        breakupNoise = clamp(breakupNoise, 0.0, 1.0);
                        foamMask *= breakupNoise;
                    }

                    if (uSuppressionNoiseEnabled) {
                        vec2 worldCoord = u_camera_offset + (vScreenCoord * u_view_size);
                        vec3 suppressionCoord = vec3(worldCoord * uSuppressionNoiseScale, u_time * uSuppressionNoiseEvolution);
                        suppressionCoord.x += u_time * uSuppressionNoiseSpeed;
                        float suppressionNoise = fbm_snoise(suppressionCoord, uSuppressionNoiseOctaves, uSuppressionNoiseLacunarity, uSuppressionNoisePersistence);
                        suppressionNoise = (suppressionNoise - 0.5 + uSuppressionNoiseBrightness) * uSuppressionNoiseContrast + 0.5;
                        foamMask *= clamp(suppressionNoise, 0.0, 1.0);
                    }

                    if (foamMask < 0.01 && !uCrestFoamEnabled) {
                        discard;
                    }

                    vec2 worldCoord = u_camera_offset + (vScreenCoord * u_view_size);
                    vec2 noiseUV = worldCoord * uNoiseScale * 0.01;
                    vec2 timeOffset = vec2(u_time * uNoiseSpeed, u_time * uNoiseEvolution);
                    float patternNoise = fbm_parameterized(noiseUV + timeOffset, uNoiseOctaves, uNoiseLacunarity, uNoisePersistence) + 0.5;

                    float finalFoam = foamMask * patternNoise;

                    // --- CREST FOAM LOGIC ---
                    if (uCrestFoamEnabled) {
                        // 1. Rotate coordinates based on wave angle
                        mat2 rotationMatrix = mat2(cos(uCrestFoamAngle), -sin(uCrestFoamAngle), sin(uCrestFoamAngle), cos(uCrestFoamAngle));
                        vec2 rotatedWorldCoord = rotationMatrix * worldCoord;

                        // 2. Calculate perturbation noise to warp the wave shape
                        vec3 perturbCoord = vec3(rotatedWorldCoord * uCrestFoamPerturbScale, u_time * uCrestFoamPerturbSpeed);
                        float perturbValue = fbm_snoise(perturbCoord, uCrestFoamPerturbOctaves, 2.2, 0.45);

                        // 3. Calculate the sine wave input, perturbed by noise
                        float waveInput = rotatedWorldCoord.y * uCrestFoamFrequency * 0.01 + u_time * uCrestFoamSpeed + perturbValue * uCrestFoamPerturbStrength;

                        // 4. Create the wave crest shape from the sine wave
                        float sineWave = sin(waveInput);
                        float crest = pow(sineWave * 0.5 + 0.5, uCrestFoamSharpness);

                        // 5. Create the fine-grained breakup texture
                        vec3 breakupCoord = vec3(worldCoord * uCrestBreakupScale, u_time * uCrestBreakupSpeed);
                        float breakupNoise = fbm_snoise(breakupCoord, uCrestBreakupOctaves, 2.8, 0.4);
                        breakupNoise = (breakupNoise - 0.5 + uCrestBreakupBrightness) * uCrestBreakupContrast + 0.5;

                        // 6. Modulate the crest shape with the breakup texture
                        crest *= clamp(breakupNoise, 0.0, 1.0);

                        // 7. Add to final foam result
                        finalFoam += crest * uCrestFoamIntensity;
                    }

                    float finalAlpha = finalFoam * uIntensity * waterValue;
                    gl_FragColor = vec4(uColor * finalAlpha, finalAlpha);
                }
            `;

    super(vertexSrc, fragmentSrc, {
      uWaterMask: PIXI.Texture.EMPTY,

      u_camera_offset: [0, 0],

      u_view_size: [1, 1],

      u_time: 0.0,

      uTexelSize: [1 / (window.innerWidth || 1), 1 / (window.innerHeight || 1)],

      uCanvasScale: [1.0, 1.0],
      uIntensity: options.intensity ?? 1.5,
      uThreshold: options.threshold ?? 0.2,
      uSoftness: options.softness ?? 0.1,
      uColor: options.color ?? [1.0, 1.0, 1.0],
      uSmallBlurSize: options.smallBlur ?? 2.0,
      uLargeBlurSize: options.largeBlur ?? 10.0,
      uBlurNoiseStrength: options.blurTurbulence?.strength ?? 8.0,
      uBlurNoiseScale: options.blurTurbulence?.scale ?? 0.5,
      uBlurNoiseSpeed: options.blurTurbulence?.speed ?? 0.01,
      uNoiseScale: options.noise?.scale ?? 15.0,
      uNoiseSpeed: options.noise?.speed ?? 0.02,
      uNoiseEvolution: options.noise?.evolution ?? 0.05,
      uNoiseOctaves: options.noise?.octaves ?? 4,
      uNoiseLacunarity: options.noise?.lacunarity ?? 2.2,
      uNoisePersistence: options.noise?.persistence ?? 0.45,
      uBreakupNoiseEnabled: options.breakupNoise?.enabled ?? true,
      uBreakupNoiseScale: options.breakupNoise?.scale ?? 2.5,
      uBreakupNoiseEvolution: options.breakupNoise?.evolution ?? 0.01,
      uBreakupNoiseOctaves: options.breakupNoise?.octaves ?? 5,
      uBreakupNoiseLacunarity: options.breakupNoise?.lacunarity ?? 2.8,
      uBreakupNoisePersistence: options.breakupNoise?.persistence ?? 0.35,

      uBreakupNoiseBrightness: (options.breakupNoise?.brightness ?? 0.4) - 0.5,
      uBreakupNoiseContrast: options.breakupNoise?.contrast ?? 1.2,
      uSuppressionNoiseEnabled: options.suppressionNoise?.enabled ?? true,
      uSuppressionNoiseScale: options.suppressionNoise?.scale ?? 2.5,
      uSuppressionNoiseSpeed: options.suppressionNoise?.speed ?? 0.005,
      uSuppressionNoiseEvolution: options.suppressionNoise?.evolution ?? 0.01,
      uSuppressionNoiseOctaves: options.suppressionNoise?.octaves ?? 4,
      uSuppressionNoiseLacunarity: options.suppressionNoise?.lacunarity ?? 2.0,
      uSuppressionNoisePersistence:
        options.suppressionNoise?.persistence ?? 0.5,

      uSuppressionNoiseBrightness:
        (options.suppressionNoise?.brightness ?? 0.5) - 0.5,
      uSuppressionNoiseContrast: options.suppressionNoise?.contrast ?? 1.0,
      // Crest Foam (Wave Shape)
      uCrestFoamEnabled: options.crestFoam?.enabled ?? true,
      uCrestFoamIntensity: options.crestFoam?.intensity ?? 1.8,
      uCrestFoamFrequency: options.crestFoam?.frequency ?? 35.0,
      uCrestFoamSpeed: options.crestFoam?.speed ?? 0.03,

      uCrestFoamAngle: (options.crestFoam?.angle ?? 15.0) * (Math.PI / 180.0),
      uCrestFoamSharpness: options.crestFoam?.sharpness ?? 12.0,
      uCrestFoamPerturbStrength: options.crestFoam?.perturbStrength ?? 35.0,
      uCrestFoamPerturbScale: options.crestFoam?.perturbScale ?? 0.04,
      uCrestFoamPerturbSpeed: options.crestFoam?.perturbSpeed ?? 0.01,
      uCrestFoamPerturbOctaves: options.crestFoam?.perturbOctaves ?? 4,
      // Crest Foam (Breakup Texture)
      uCrestBreakupScale: options.crestFoam?.crestBreakup?.scale ?? 0.35,
      uCrestBreakupSpeed: options.crestFoam?.crestBreakup?.speed ?? 0.08,
      uCrestBreakupOctaves: options.crestFoam?.crestBreakup?.octaves ?? 3,

      uCrestBreakupBrightness:
        (options.crestFoam?.crestBreakup?.brightness ?? 0.45) - 0.5,
      uCrestBreakupContrast: options.crestFoam?.crestBreakup?.contrast ?? 1.8,
    });
  }
}

export class FoamLayer extends ResizableAnimatedCanvasLayer {
  constructor() {
    super();

    this.foamFilter = null;
    this.effectSprite = null;

    this.time = 0;
  }

  static getSettingsHTML() {
    const effectKey = "foam";
    const content = `
          <p class="description-text">Renders a noisy foam effect along the edges of water bodies, especially on sharp coastlines. Requires a _Water mask.</p>
          ${DebuggerUIBuilder._createSelectHTML(
            "foam.blendMode",
            "Blend Mode",
            BLEND_MODE_OPTIONS
          )}
          ${DebuggerUIBuilder._createColorPickerHTML(
            "foam.color",
            "Foam Color"
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            "foam.intensity",
            "Intensity",
            0,
            5,
            0.05
          )}
          <details>
            <summary><span class="accordion-toggle"></span><strong>Edge Detection</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Controls how the foam detects and clings to the shoreline.</p>
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.smallBlur",
                "Small Blur",
                1,
                20,
                0.5,
                "The world-pixel radius of the inner blur. Should be smaller than the large blur."
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.largeBlur",
                "Large Blur",
                2,
                100,
                1,
                "The world-pixel radius of the outer blur. The difference between blurs creates the edge."
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.threshold",
                "Threshold",
                0.01,
                1,
                0.01,
                "The minimum edge difference required to start showing foam."
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.softness",
                "Softness",
                0.01,
                1,
                0.01,
                "The softness of the transition at the edge threshold."
              )}
            </div>
          </details>
          <details>
            <summary><span class="accordion-toggle"></span><strong>Blur Turbulence</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Introduces noise into the blur calculation to create more organic, irregular foam shapes.</p>
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.blurTurbulence.strength",
                "Strength",
                0,
                20,
                0.5,
                "How much the noise distorts the blur pattern."
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.blurTurbulence.scale",
                "Scale",
                0.1,
                5,
                0.05,
                "The zoom level of the turbulence noise."
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.blurTurbulence.speed",
                "Speed",
                0,
                0.05,
                0.001,
                "The animation speed of the turbulence."
              )}
            </div>
          </details>
          <details>
            <summary><span class="accordion-toggle"></span><strong>Foam Pattern Noise</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Controls the procedural noise used to create the foam's visual texture.</p>
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.noise.scale",
                "Scale",
                1,
                50,
                0.5
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.noise.speed",
                "Speed",
                0,
                0.1,
                0.001,
                "Directional drift speed of the foam pattern."
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.noise.evolution",
                "Evolution",
                0,
                0.2,
                0.001,
                'Internal "boiling" speed of the foam pattern.'
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.noise.octaves",
                "Complexity (Octaves)",
                1,
                8,
                1
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.noise.lacunarity",
                "Detail Scale",
                1.5,
                4,
                0.05
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "foam.noise.persistence",
                "Roughness",
                0.1,
                1,
                0.05
              )}
            </div>
          </details>
          <details id="details-foam-breakupNoise">
              <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                "foam.breakupNoise.enabled",
                "Foam Breakup",
                true
              )}</div></summary>
              <div style="padding-left: 5px;">
                  <p class="description-text">Uses a second noise pattern to break up the foam, creating a more patchy appearance.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.breakupNoise.scale",
                    "Scale",
                    0.1,
                    20,
                    0.1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.breakupNoise.evolution",
                    "Evolution",
                    0,
                    0.1,
                    0.001
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.breakupNoise.octaves",
                    "Complexity (Octaves)",
                    1,
                    8,
                    1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.breakupNoise.lacunarity",
                    "Detail Scale",
                    1.5,
                    4,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.breakupNoise.persistence",
                    "Roughness",
                    0.1,
                    1,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.breakupNoise.brightness",
                    "Coverage",
                    0,
                    1,
                    0.01,
                    "Controls the overall amount of foam that gets broken up. Higher = less foam."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.breakupNoise.contrast",
                    "Sharpness",
                    0.1,
                    5,
                    0.05,
                    "Controls the sharpness of the broken-up edges."
                  )}
              </div>
          </details>
          <details id="details-foam-suppressionNoise">
              <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                "foam.suppressionNoise.enabled",
                "Foam Suppression",
                true
              )}</div></summary>
              <div style="padding-left: 5px;">
                  <p class="description-text">Uses a large, slow noise pattern to mask out the foam, preventing it from appearing everywhere at once.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.scale",
                    "Scale",
                    0.001,
                    1,
                    0.001
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.speed",
                    "Speed",
                    0,
                    0.05,
                    0.001
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.evolution",
                    "Evolution",
                    0,
                    0.1,
                    0.001
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.octaves",
                    "Complexity (Octaves)",
                    1,
                    8,
                    1
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.lacunarity",
                    "Detail Scale",
                    1.5,
                    4,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.persistence",
                    "Roughness",
                    0.1,
                    1,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.brightness",
                    "Coverage",
                    0,
                    1,
                    0.01
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.suppressionNoise.contrast",
                    "Sharpness",
                    0.1,
                    5,
                    0.05
                  )}
              </div>
          </details>
          <details id="details-foam-crestFoam">
              <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                "foam.crestFoam.enabled",
                "Wave Crest Foam",
                true
              )}</div></summary>
              <div style="padding-left: 5px;">
                  <p class="description-text">Generates long, flowing wave crests using perturbed sine waves.</p>
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.crestFoam.intensity",
                    "Intensity",
                    0,
                    5,
                    0.05
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.crestFoam.frequency",
                    "Frequency",
                    1,
                    100,
                    1,
                    "How many wave crests appear. Higher is more waves."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.crestFoam.speed",
                    "Speed",
                    0,
                    0.2,
                    0.001,
                    "The travel speed of the waves."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.crestFoam.angle",
                    "Angle",
                    0,
                    360,
                    1,
                    "The direction of the waves."
                  )}
                  ${DebuggerUIBuilder._createSliderHTML(
                    "foam.crestFoam.sharpness",
                    "Sharpness",
                    1,
                    40,
                    1,
                    "How sharp and defined the crests are."
                  )}
                  <details>
                      <summary><span class="accordion-toggle"></span><strong>Perturbation (Wave Breakup)</strong></summary>
                      <div style="padding-left: 8px;">
                          <p class="description-text">Controls the noise that makes the waves look organic and turbulent.</p>
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.perturbStrength",
                            "Strength",
                            0,
                            100,
                            1,
                            "How much the noise distorts the wave lines."
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.perturbScale",
                            "Scale",
                            0.01,
                            0.5,
                            0.001,
                            "The size of the turbulence patterns."
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.perturbSpeed",
                            "Speed",
                            0,
                            0.1,
                            0.001,
                            "The animation speed of the turbulence."
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.perturbOctaves",
                            "Complexity",
                            1,
                            8,
                            1,
                            "The level of detail in the turbulence."
                          )}
                      </div>
                  </details>
                  <details>
                      <summary><span class="accordion-toggle"></span><strong>Crest Breakup (Texture)</strong></summary>
                      <div style="padding-left: 8px;">
                          <p class="description-text">Controls the fine-grained noise that breaks the wave crests into a dot-like pattern.</p>
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.crestBreakup.scale",
                            "Scale",
                            0.1,
                            2,
                            0.01
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.crestBreakup.speed",
                            "Speed",
                            0,
                            0.2,
                            0.001
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.crestBreakup.octaves",
                            "Complexity",
                            1,
                            8,
                            1
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.crestBreakup.brightness",
                            "Coverage",
                            0,
                            1,
                            0.01
                          )}
                          ${DebuggerUIBuilder._createSliderHTML(
                            "foam.crestFoam.crestBreakup.contrast",
                            "Sharpness",
                            0.1,
                            5,
                            0.05
                          )}
                      </div>
                  </details>
              </div>
          </details>
        `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Water Edge Foam",
      content
    );
  }

  async _draw() {
    await super._draw(); // Handles ticker, resize, and _destroyed flag
    this.time = 0;

    this.foamFilter = safeCreateFilter(FoamFilter, {}, "FoamEffectLayer");
    if (!this.foamFilter) {
      console.error("MapShine | Failed to create FoamFilter.");
    }

    this.effectSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    if (this.foamFilter) {
      safeApplyFilters(this.effectSprite, [this.foamFilter], "FoamEffectLayer.effectSprite");
    }
    this.addChild(this.effectSprite);

    await this.updateFromConfig(game.mapShine.profileManager.activeConfig);
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.visible || !this.foamFilter) return;

    // ✅ FIX: Check master enabled flag
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) return;

    // ✅ FIX: Check foam enabled flag
    if (config?.foam && config.foam.enabled === false) return;

    const resourceManager = game.mapShine.resourceManager;
    const waterMask = resourceManager?.getWaterMask();

    if (!waterMask?.valid) {
      this.effectSprite.visible = false;
      return;
    }
    this.effectSprite.visible = true;

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    this.time += (deltaTime / 60) * timeFactor;

    const u = this.foamFilter.uniforms;
    u.uWaterMask = waterMask;
    u.u_time = this.time;
    Object.assign(u, CoordinateManager.getShaderUniforms());

    const screen = CoordinateManager.getScreenDimensions();
    u.uTexelSize = [1.0 / screen.width, 1.0 / screen.height];
    const scale = CoordinateManager.getCanvasScale();
    u.uCanvasScale = [scale, scale];

    this.effectSprite.position.copyFrom(CoordinateManager.getCameraOffset());
    this.effectSprite.width = CoordinateManager.getViewSize().width;
    this.effectSprite.height = CoordinateManager.getViewSize().height;
  }

  async updateFromConfig(config) {
    const fConfig = config.foam;
    this.visible = config.enabled && fConfig.enabled;
    this.blendMode = fConfig.blendMode;

    if (this.foamFilter) {
      const u = this.foamFilter.uniforms;
      u.uIntensity = fConfig.intensity;
      u.uThreshold = fConfig.threshold;
      u.uSoftness = fConfig.softness;
      u.uColor = hexToRgbArray(fConfig.color);
      u.uSmallBlurSize = fConfig.smallBlur;
      u.uLargeBlurSize = fConfig.largeBlur;

      const bt = fConfig.blurTurbulence;
      u.uBlurNoiseStrength = bt.strength;
      u.uBlurNoiseScale = bt.scale;
      u.uBlurNoiseSpeed = bt.speed;

      const n = fConfig.noise;
      u.uNoiseScale = n.scale;
      u.uNoiseSpeed = n.speed;
      u.uNoiseEvolution = n.evolution;
      u.uNoiseOctaves = n.octaves;
      u.uNoiseLacunarity = n.lacunarity;
      u.uNoisePersistence = n.persistence;

      const bn = fConfig.breakupNoise;
      u.uBreakupNoiseEnabled = bn.enabled;
      u.uBreakupNoiseScale = bn.scale;
      u.uBreakupNoiseEvolution = bn.evolution;
      u.uBreakupNoiseOctaves = bn.octaves;
      u.uBreakupNoiseLacunarity = bn.lacunarity;
      u.uBreakupNoisePersistence = bn.persistence;
      u.uBreakupNoiseBrightness = bn.brightness - 0.5;
      u.uBreakupNoiseContrast = bn.contrast;

      const sn = fConfig.suppressionNoise;
      u.uSuppressionNoiseEnabled = sn.enabled;
      u.uSuppressionNoiseScale = sn.scale;
      u.uSuppressionNoiseSpeed = sn.speed;
      u.uSuppressionNoiseEvolution = sn.evolution;
      u.uSuppressionNoiseOctaves = sn.octaves;
      u.uSuppressionNoiseLacunarity = sn.lacunarity;
      u.uSuppressionNoisePersistence = sn.persistence;
      u.uSuppressionNoiseBrightness = sn.brightness - 0.5;
      u.uSuppressionNoiseContrast = sn.contrast;

      const cf = fConfig.crestFoam;
      u.uCrestFoamEnabled = cf.enabled;
      u.uCrestFoamIntensity = cf.intensity;
      u.uCrestFoamFrequency = cf.frequency;
      u.uCrestFoamSpeed = cf.speed;
      u.uCrestFoamAngle = cf.angle * (Math.PI / 180.0);
      u.uCrestFoamSharpness = cf.sharpness;
      u.uCrestFoamPerturbStrength = cf.perturbStrength;
      u.uCrestFoamPerturbScale = cf.perturbScale;
      u.uCrestFoamPerturbSpeed = cf.perturbSpeed;
      u.uCrestFoamPerturbOctaves = cf.perturbOctaves;

      const cb = cf.crestBreakup;
      u.uCrestBreakupScale = cb.scale;
      u.uCrestBreakupSpeed = cb.speed;
      u.uCrestBreakupOctaves = cb.octaves;
      u.uCrestBreakupBrightness = cb.brightness - 0.5;
      u.uCrestBreakupContrast = cb.contrast;
    }
  }

  _onResize() {
    if (this._destroyed || !this.foamFilter) return;
    const screen = canvas.app.renderer.screen;
    this.foamFilter.uniforms.uTexelSize = [
      1.0 / screen.width,
      1.0 / screen.height,
    ];
  }

  async _tearDown(options) {

    this.foamFilter?.destroy();
    this.effectSprite?.destroy();
    await super._tearDown(options); // Handles ticker, resize unbinding and _destroyed flag
  }
}
