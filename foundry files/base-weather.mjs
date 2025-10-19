import AbstractBaseShader from "../base-shader.mjs";

/**
 * The base shader class for weather shaders.
 */
export default class AbstractWeatherShader extends AbstractBaseShader {
  constructor(...args) {
    super(...args);
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

  /**
   * Compute the weather masking value.
   * @type {string}
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
   * Compute the weather masking value.
   * @type {string}
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
   * Common uniforms for all weather shaders.
   * @type {{
   *  useOcclusion: boolean,
   *  occlusionTexture: PIXI.Texture|null,
   *  reverseOcclusion: boolean,
   *  occlusionWeights: number[],
   *  useTerrain: boolean,
   *  terrainTexture: PIXI.Texture|null,
   *  reverseTerrain: boolean,
   *  terrainWeights: number[],
   *  alpha: number,
   *  tint: number[],
   *  screenDimensions: [number, number],
   *  effectDimensions: [number, number],
   *  depthElevation: number,
   *  time: number
   * }}
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
   * Default uniforms for a specific class
   * @abstract
   */
  static defaultUniforms;

  /* -------------------------------------------- */

  /** @override */
  static create(initialUniforms) {
    const program = this.createProgram();
    const uniforms = {...this.commonUniforms, ...this.defaultUniforms, ...initialUniforms};
    return new this(program, uniforms);
  }

  /* -------------------------------------------- */

  /**
   * Create the shader program.
   * @returns {PIXI.Program}
   */
  static createProgram() {
    return PIXI.Program.from(this.vertexShader, this.fragmentShader);
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
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
  /*  Common Management and Parameters            */
  /* -------------------------------------------- */

  /**
   * Update the scale of this effect with new values
   * @param {number|{x: number, y: number}} scale    The desired scale
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

  /* -------------------------------------------- */

  /**
   * The speed multiplier applied to animation.
   * 0 stops animation.
   * @type {number}
   */
  speed = 1;

  /* -------------------------------------------- */

  /** @override */
  _preRender(mesh, renderer) {
    this.uniforms.alpha = mesh.worldAlpha;
    this.uniforms.depthElevation = canvas.masks.depth.mapElevation(canvas.weather.elevation);
    this.uniforms.time += (canvas.app.ticker.deltaMS / 1000 * this.speed);
    this.uniforms.screenDimensions = canvas.screenDimensions;
    this.uniforms.effectDimensions[0] = this.#scale.x * mesh.scale.x / 10000;
    this.uniforms.effectDimensions[1] = this.#scale.y * mesh.scale.y / 10000;
  }
}
