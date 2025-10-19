import AbstractWeatherShader from "./base-weather.mjs";

/**
 * Rain shader effect.
 */
export default class RainShader extends AbstractWeatherShader {

  /** @inheritdoc */
  static defaultUniforms = {
    opacity: 1,
    intensity: 1,
    strength: 1,
    rotation: 0.5,
    resolution: [3200, 80] // The resolution to have nice rain ropes with the voronoi cells
  };

  /* -------------------------------------------- */

  /** @inheritdoc */
  static fragmentShader = `
    ${this.FRAGMENT_HEADER}
    ${this.CONSTANTS}
    ${this.PERCEIVED_BRIGHTNESS}
    ${this.ROTATION}
    ${this.PRNG}
    ${this.VORONOI}
    
    uniform float intensity;
    uniform float opacity;
    uniform float strength;
    uniform float rotation;
    uniform vec2 resolution;

    // Compute rain according to uv and dimensions for layering
    float computeRain(in vec2 uv, in float t) {
      vec2 tuv = uv;
      vec2 ruv = ((tuv + 0.5) * rot(rotation)) - 0.5;
      ruv.y -= t * 0.8;
      vec2 st = ruv * resolution;
      vec3 d2 = voronoi(vec3(st - t * 0.5, t * 0.8), 10.0);
      float df = perceivedBrightness(d2);
      return (1.0 - smoothstep(-df * strength, df * strength + 0.001, 1.0 - smoothstep(0.3, 1.0, d2.z))) * intensity;
    }

    void main() {
      ${this.COMPUTE_MASK}
      gl_FragColor = vec4(vec3(computeRain(vUvs, time)) * tint, 1.0) * alpha * mask * opacity;
    }
  `;
}
