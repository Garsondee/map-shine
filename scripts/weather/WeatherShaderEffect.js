/**
 * An interface for defining shader-based weather effects
 * Wraps a QuadMesh with a weather shader
 * Ported from Foundry VTT's WeatherShaderEffect
 */
import { QuadMesh } from './QuadMesh.js';

export class WeatherShaderEffect extends QuadMesh {
  /**
   * @param {object} config - Configuration object for the shader effect
   * @param {typeof WeatherShaderBase} shaderClass - The shader class to use
   */
  constructor(config, shaderClass) {
    super(shaderClass);
    this.stop();
    this._initialize(config);
  }

  /**
   * Set shader parameters
   * @param {object} config - Configuration object with shader parameters
   */
  configure(config = {}) {
    for (const [k, v] of Object.entries(config)) {
      if (k in this.shader) {
        this.shader[k] = v;
      } else if (k in this.shader.uniforms) {
        this.shader.uniforms[k] = v;
      }
    }
  }

  /**
   * Begin animation
   */
  play() {
    this.visible = true;
  }

  /**
   * Stop animation
   */
  stop() {
    this.visible = false;
  }

  /**
   * Initialize the weather effect
   * @param {object} config - Configuration object
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
