import { PIXI, State, DRAW_MODES } from "../pixi-adapter.js";
/**
 * A basic rectangular mesh with a shader
 * Simplified rendering for full-screen effects
 * Ported from Foundry VTT's QuadMesh
 */
export class QuadMesh extends PIXI.Container {
  /**
   * @param {typeof WeatherShaderBase} shaderClass - The shader class to use
   */
  constructor(shaderClass) {
    super();
    
    // Validate shader class
    if (!shaderClass || typeof shaderClass.create !== 'function') {
      throw new Error("QuadMesh shader class must have a create() method.");
    }
    
    this.#shader = shaderClass.create();
  }

  /**
   * Geometry bound to this QuadMesh
   * @type {PIXI.Geometry}
   */
  #geometry = new PIXI.Geometry()
    .addAttribute("aVertexPosition", [0, 0, 1, 0, 1, 1, 0, 1], 2)
    .addIndex([0, 1, 2, 0, 2, 3]);

  /**
   * The shader bound to this mesh
   * @type {PIXI.Shader}
   */
  get shader() {
    return this.#shader;
  }

  #shader;

  /**
   * Assigned blend mode to this mesh
   * @type {PIXI.BLEND_MODES}
   */
  get blendMode() {
    return this.#state.blendMode;
  }

  set blendMode(value) {
    this.#state.blendMode = value;
  }

  /**
   * State bound to this QuadMesh
   * @type {PIXI.State}
   */
  #state = State.for2d();

  /**
   * Initialize shader based on the shader class type
   * @param {typeof WeatherShaderBase} shaderClass - Shader class to use
   */
  setShaderClass(shaderClass) {
    if (!shaderClass || typeof shaderClass.create !== 'function') {
      throw new Error("QuadMesh shader class must have a create() method.");
    }
    if (this.#shader.constructor === shaderClass) return;

    // Create new shader program
    this.#shader = shaderClass.create();
  }

  /**
   * Render the mesh
   * @override
   */
  _render(renderer) {
    // Pre-render hook for shader updates
    this.#shader._preRender(this, renderer);
    this.#shader.uniforms.translationMatrix = this.transform.worldTransform.toArray(true);

    // Flush batch renderer
    renderer.batch.flush();

    // Set state
    renderer.state.set(this.#state);

    // Bind shader and geometry
    renderer.shader.bind(this.#shader);
    renderer.geometry.bind(this.#geometry, this.#shader);

    // Draw the geometry
    renderer.geometry.draw(DRAW_MODES.TRIANGLES);
  }

  /**
   * Calculate bounds for the mesh
   * @override
   */
  _calculateBounds() {
    this._bounds.addFrame(this.transform, 0, 0, 1, 1);
  }

  /**
   * Tests if a point is inside this QuadMesh
   * @param {PIXI.IPointData} point - Point to test
   * @returns {boolean}
   */
  containsPoint(point) {
    return this.getBounds().contains(point.x, point.y);
  }

  /**
   * Destroy the mesh
   * @override
   */
  destroy(options) {
    super.destroy(options);
    if (this.#geometry) {
      this.#geometry.dispose();
      this.#geometry = null;
    }
    this.#shader = null;
    this.#state = null;
  }
}
