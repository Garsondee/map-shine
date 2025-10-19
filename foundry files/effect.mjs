import QuadMesh from "../../../containers/elements/quad-mesh.mjs";

/**
 * An interface for defining shader-based weather effects
 * @param {object} config   The config object to create the shader effect
 */
export default class WeatherShaderEffect extends QuadMesh {
  constructor(config, shaderClass) {
    super(shaderClass);
    this.stop();
    this._initialize(config);
  }

  /* -------------------------------------------- */

  /**
   * Set shader parameters.
   * @param {object} [config={}]
   */
  configure(config={}) {
    for ( const [k, v] of Object.entries(config) ) {
      if ( k in this.shader ) this.shader[k] = v;
      else if ( k in this.shader.uniforms ) this.shader.uniforms[k] = v;
    }
  }

  /* -------------------------------------------- */

  /**
   * Begin animation
   */
  play() {
    this.visible = true;
  }

  /* -------------------------------------------- */

  /**
   * Stop animation
   */
  stop() {
    this.visible = false;
  }

  /* -------------------------------------------- */

  /**
   * Initialize the weather effect.
   * @param {object} config        Config object.
   * @protected
   */
  _initialize(config) {
    this.configure(config);
    const sr = canvas.dimensions.sceneRect;
    this.position.set(sr.x, sr.y);
    this.width = sr.width;
    this.height = sr.height;
  }
}

