/**
 * Base class for weather shaders in Map Shine
 * Ported from Foundry VTT's AbstractWeatherShader
 */
import { PIXI, Program, Matrix } from "../pixi-adapter.js";

export class WeatherShaderBase extends PIXI.Shader {
  constructor(program, uniforms) {
    super(program, foundry.utils.deepClone(uniforms));
    this.initialUniforms = uniforms;
    
    // Create getter/setter properties for all uniforms
    Object.defineProperties(this, Object.keys(this.constructor.defaultUniforms).reduce((obj, k) => {
      obj[k] = {
        get() {
          return this.uniforms[k];
        },
        set(value) {
          this.uniforms[k] = value;
        },
        enumerable: false
      };
      return obj;
    }, {}));
  }

  /* -------------------------------------------- */
  /*  GLSL Constants and Utilities                */
  /* -------------------------------------------- */

  /**
   * Useful constant values computed at compile time
   */
  static CONSTANTS = `
    const float PI = 3.141592653589793;
    const float TWOPI = 6.283185307179586;
    const float INVPI = 0.3183098861837907;
    const float INVTWOPI = 0.15915494309189535;
    const float SQRT2 = 1.4142135623730951;
    const float SQRT1_2 = 0.7071067811865476;
    const float SQRT3 = 1.7320508075688772;
    const float SQRT1_3 = 0.5773502691896257;
    const vec3 BT709 = vec3(0.2126, 0.7152, 0.0722);
  `;

  /**
   * Fast approximate perceived brightness computation
   * Using Digital ITU BT.709 : Exact luminance factors
   */
  static PERCEIVED_BRIGHTNESS = `
    float perceivedBrightness(in vec3 color) { return sqrt(dot(BT709, color * color)); }
    float perceivedBrightness(in vec4 color) { return perceivedBrightness(color.rgb); }
    float reversePerceivedBrightness(in vec3 color) { return 1.0 - perceivedBrightness(color); }
    float reversePerceivedBrightness(in vec4 color) { return 1.0 - perceivedBrightness(color.rgb); }
  `;

  /**
   * A pseudo-random number generator based on uv position
   */
  static PRNG = `
    float random(in vec2 uv) { 
      uv = mod(uv, 1000.0);
      return fract(dot(uv, vec2(5.23, 2.89) 
                        * fract((2.41 * uv.x + 2.27 * uv.y)
                                 * 251.19)) * 551.83);
    }
  `;

  /**
   * A Vec2 pseudo-random generator
   */
  static PRNG2D = `
    vec2 random(in vec2 uv) {
      vec2 uvf = fract(uv * vec2(0.1031, 0.1030));
      uvf += dot(uvf, uvf.yx + 19.19);
      return fract((uvf.x + uvf.y) * uvf);
    }
  `;

  /**
   * Rotation matrix function
   */
  static ROTATION = `
    mat2 rot(in float a) {
      float s = sin(a);
      float c = cos(a);
      return mat2(c, -s, s, c);
    }
  `;

  /**
   * Voronoi noise function for rain streaks
   */
  static VORONOI = `
    vec3 voronoi(in vec2 uv, in float t, in float zd) {
      vec2 uvi = floor(uv);
      vec2 uvf = fract(uv);
      vec3 vor = vec3(0.0, 0.0, zd);
      float bestDist2 = zd * zd;
    
      vec2 OFFSETS[9];
      OFFSETS[0] = vec2(-1.0, -1.0);
      OFFSETS[1] = vec2( 0.0, -1.0);
      OFFSETS[2] = vec2( 1.0, -1.0);
      OFFSETS[3] = vec2(-1.0,  0.0);
      OFFSETS[4] = vec2( 0.0,  0.0);
      OFFSETS[5] = vec2( 1.0,  0.0);
      OFFSETS[6] = vec2(-1.0,  1.0);
      OFFSETS[7] = vec2( 0.0,  1.0);
      OFFSETS[8] = vec2( 1.0,  1.0);
    
      for ( int k = 0; k < 9; k++ ) {
        vec2 uvn = OFFSETS[k];
        float rnd = random(uvi + uvn);
    
        float r1 = 0.5 * sin(TWOPI * rnd + t) + 0.5;
        float r2 = 0.5 * sin(TWOPI * r1  + t) + 0.5;
        vec2 uvr = vec2(r2, r2); 
        vec2 diff = (uvn + uvr - uvf);
        float dist2 = dot(diff, diff);
        if ( dist2 < bestDist2 ) {
          float dist = sqrt(dist2);
          vor.xy   = uvr;
          vor.z    = dist;
          bestDist2 = dist2;
        }
      }
      return vor;
    }
    
    vec3 voronoi(vec2 vuv, float zd) {
      return voronoi(vuv, 0.0, zd);
    }
    
    vec3 voronoi(vec3 vuv, float zd) {
      return voronoi(vuv.xy, vuv.z, zd);
    }
  `;

  /**
   * Compute the weather masking value
   */
  static COMPUTE_MASK = `
    // Base mask value 
    float mask = 1.0;
    
    // Process the occlusion mask
    if ( useOcclusion ) {
      float oMask = step(depthElevation, (254.5 / 255.0) - dot(occlusionWeights, texture2D(occlusionTexture, vUvsOcclusion)));
      if ( reverseOcclusion ) oMask = 1.0 - oMask;
      mask *= oMask;
    }
                  
    // Process the terrain mask 
    if ( useTerrain ) {
      float tMask = dot(terrainWeights, texture2D(terrainTexture, vUvsTerrain));
      if ( reverseTerrain ) tMask = 1.0 - tMask;
      mask *= tMask;
    }
  `;

  /**
   * Fragment shader header with uniforms
   */
  static FRAGMENT_HEADER = `
    precision ${PIXI.settings.PRECISION_FRAGMENT} float;
    
    // Occlusion mask uniforms
    uniform bool useOcclusion;
    uniform sampler2D occlusionTexture;
    uniform bool reverseOcclusion;
    uniform vec4 occlusionWeights;
    
    // Terrain mask uniforms
    uniform bool useTerrain;
    uniform sampler2D terrainTexture;
    uniform bool reverseTerrain;
    uniform vec4 terrainWeights;

    // Other uniforms and varyings
    uniform vec3 tint;
    uniform float time;
    uniform float depthElevation;
    uniform float alpha;
    varying vec2 vUvsOcclusion;
    varying vec2 vUvsTerrain;
    varying vec2 vStaticUvs;
    varying vec2 vUvs;
  `;

  /**
   * Common uniforms for all weather shaders
   */
  static commonUniforms = {
    terrainUvMatrix: new PIXI.Matrix(),
    useOcclusion: false,
    occlusionTexture: null,
    reverseOcclusion: false,
    occlusionWeights: [0, 0, 1, 0],
    useTerrain: false,
    terrainTexture: null,
    reverseTerrain: false,
    terrainWeights: [1, 0, 0, 0],
    alpha: 1,
    tint: [1, 1, 1],
    screenDimensions: [1, 1],
    effectDimensions: [1, 1],
    depthElevation: 1,
    time: 0
  };

  /**
   * Vertex shader for weather effects
   */
  static vertexShader = `
    precision ${PIXI.settings.PRECISION_VERTEX} float;
    attribute vec2 aVertexPosition;
    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;
    uniform mat3 terrainUvMatrix;
    uniform vec2 screenDimensions;
    uniform vec2 effectDimensions;
    varying vec2 vUvsOcclusion;
    varying vec2 vUvsTerrain;
    varying vec2 vUvs;
    varying vec2 vStaticUvs;
  
    void main() {    
      vec3 tPos = translationMatrix * vec3(aVertexPosition, 1.0);
      vStaticUvs = aVertexPosition;
      vUvs = vStaticUvs * effectDimensions;
      vUvsOcclusion = tPos.xy / screenDimensions;
      vUvsTerrain = (terrainUvMatrix * vec3(aVertexPosition, 1.0)).xy;
      gl_Position = vec4((projectionMatrix * tPos).xy, 0.0, 1.0);
    }
  `;

  /* -------------------------------------------- */
  /*  Static Methods                              */
  /* -------------------------------------------- */

  /**
   * Create a shader instance with initial uniforms
   * @param {object} initialUniforms - Initial uniform values
   * @returns {WeatherShaderBase}
   */
  static create(initialUniforms) {
    const program = this.createProgram();
    const uniforms = {...this.commonUniforms, ...this.defaultUniforms, ...initialUniforms};
    const shader = new this(program, uniforms);
    shader._configure();
    return shader;
  }

  /**
   * Create the shader program
   * @returns {PIXI.Program}
   */
  static createProgram() {
    return Program.from(this.vertexShader, this.fragmentShader);
  }

  /* -------------------------------------------- */
  /*  Instance Methods                            */
  /* -------------------------------------------- */

  /**
   * Reset the shader uniforms back to their initial values
   */
  reset() {
    for (let [k, v] of Object.entries(this.initialUniforms)) {
      this.uniforms[k] = foundry.utils.deepClone(v);
    }
  }

  /**
   * A one time initialization performed on creation
   * @protected
   */
  _configure() {}

  /**
   * Perform operations before binding the Shader to the Renderer
   * @param {PIXI.DisplayObject} mesh - The mesh display object
   * @param {PIXI.Renderer} renderer - The renderer
   * @protected
   */
  _preRender(mesh, renderer) {
    this.uniforms.alpha = mesh.worldAlpha;
    this.uniforms.depthElevation = canvas.masks?.depth?.mapElevation?.(Infinity) ?? 1;
    this.uniforms.time += (canvas.app.ticker.deltaMS / 1000 * this.speed);
    this.uniforms.screenDimensions = canvas.screenDimensions;
    this.uniforms.effectDimensions[0] = this.#scale.x * mesh.scale.x / 10000;
    this.uniforms.effectDimensions[1] = this.#scale.y * mesh.scale.y / 10000;
  }

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * Update the scale of this effect with new values
   * @param {number|{x: number, y: number}} scale - The desired scale
   */
  set scale(scale) {
    this.#scale.x = typeof scale === "object" ? scale.x : scale;
    this.#scale.y = (typeof scale === "object" ? scale.y : scale) ?? this.#scale.x;
  }

  set scaleX(x) {
    this.#scale.x = x ?? 1;
  }

  set scaleY(y) {
    this.#scale.y = y ?? 1;
  }

  #scale = {
    x: 1,
    y: 1
  };

  /**
   * The speed multiplier applied to animation
   * 0 stops animation
   * @type {number}
   */
  speed = 1;
}
