/**
 * FireToneCurveFilter: A lightweight mask-only tone curve for fire particles
 * This file is JS-checked; JSDoc annotations are provided for type safety.
 */

/**
 * @typedef {Object} FireToneCurveOptions
 * @property {number} [contrast]
 * @property {number} [gamma]
 * @property {number} [knee]
 * @property {number} [coreClamp]
 */
 
/** @type {string} */
const vertex = `
precision mediump float;
 
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void){
  vTextureCoord = aTextureCoord;
  gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}
`;

/** @type {string} */
const fragment = `
precision mediump float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

uniform float u_contrast;   // 0.5 - 3.0
uniform float u_gamma;      // 0.5 - 3.0 (applied as pow(i, 1.0/u_gamma))
uniform float u_knee;       // 0.0 - 1.0 (soft knee strength)
uniform float u_coreClamp;  // 0.5 - 1.5 (max output scaling)

// Simple soft knee function around 0.5
float softKnee(float x, float k){
  // Blend towards a smooth curve near mid-tones; k is knee strength
  if (k <= 0.0001) return x;
  float t = clamp((x - 0.5) / max(k, 1e-4) + 0.5, 0.0, 1.0);
  // Hermite smoothstep for pleasant roll-off
  return t * t * (3.0 - 2.0 * t);
}

void main(){
  vec4 c = texture2D(uSampler, vTextureCoord);

  // Intensity proxy: max channel, preserves hot core
  float i = max(max(c.r, c.g), c.b);

  // Gamma/power remap
  float ig = pow(i, 1.0 / max(u_gamma, 0.0001));

  // Contrast around 0.5
  float centered = ig - 0.5;
  float ic = centered * u_contrast + 0.5;

  // Soft knee near mid-tones
  float isk = softKnee(ic, u_knee);

  // Core clamp to keep highlights controlled
  float outI = min(isk, u_coreClamp);

  // Scale original color by ratio; avoid divide-by-zero
  float denom = max(i, 1e-4);
  vec3 outColor = c.rgb * (outI / denom);

  gl_FragColor = vec4(outColor, c.a);
}
`;

export class FireToneCurveFilter extends PIXI.Filter {
  /**
   * @param {FireToneCurveOptions} [options]
   */
  constructor(options = {}){
    const uniforms = {
      u_contrast: options.contrast ?? 1.4,
      u_gamma: options.gamma ?? 0.9,
      u_knee: options.knee ?? 0.2,
      u_coreClamp: options.coreClamp ?? 1.2,
    };
    super(vertex, fragment, uniforms);
  }

  /**
   * Clean up texture references to prevent memory leaks and scene teardown errors
   */
  destroy() {
    // This filter doesn't hold custom texture references,
    // but we still call super.destroy() for proper cleanup
    super.destroy();
  }
}
