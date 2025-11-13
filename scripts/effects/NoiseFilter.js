import { PIXI } from "../pixi-adapter.js";

/**
 * A simple filter that adds random noise to an image.
 * This is used to dither the light mask, preventing color banding and adding texture.
 */
export class NoiseFilter extends PIXI.Filter {
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

              uniform sampler2D uSampler;
              uniform float uNoiseAmount;
              uniform float uTime;

              // A simple pseudo-random function
              float random(vec2 st) {
                  return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453123);
              }

              void main() {
                  vec4 color = texture2D(uSampler, vTextureCoord);
                  
                  // Only apply noise if there is some color to begin with
                  if (color.a > 0.0) {
                      // Generate noise based on screen coordinates to avoid stretching
                      float noise = (random(vScreenCoord) - 0.5) * uNoiseAmount;
                      color.rgb += noise;
                  }

                  gl_FragColor = color;
              }
          `;

    super(vertexSrc, fragmentSrc, {
      uNoiseAmount: options.noiseAmount ?? 0.05,

      uTime: 0.0,
    });
  }

  /**
   * The amount of noise to apply, from 0 to 1.
   * @type {number}
   */
  get noiseAmount() {
    return this.uniforms.uNoiseAmount;
  }
  set noiseAmount(value) {
    this.uniforms.uNoiseAmount = value;
  }
}
