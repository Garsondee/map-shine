/**
 * Fog shader effect using Fractional Brownian Motion
 * Ported from Foundry VTT's FogShader with performance modes
 */
import { WeatherShaderBase } from './WeatherShaderBase.js';

export class FogShader extends WeatherShaderBase {
  
  /**
   * Default uniform values for fog
   */
  static defaultUniforms = {
    intensity: 1,
    rotation: 0,
    slope: 0.25
  };

  /**
   * Configure the number of octaves based on performance mode
   * @param {number} mode - Performance mode (0=Low, 1=Medium, 2=High)
   * @returns {string}
   */
  static OCTAVES(mode) {
    return `${mode + 2}`;
  }

  /**
   * Configure fog complexity based on performance mode
   * @param {number} mode - Performance mode (0=Low, 1=Medium, 2=High)
   * @returns {string}
   */
  static FOG(mode) {
    if (mode === 0) {
      // Low performance: single layer
      return `vec2 mv = vec2(fbm(uv * 4.5 + time * 0.115)) * (1.0 + r * 0.25);
        mist += fbm(uv * 4.5 + mv - time * 0.0275) * (1.0 + r * 0.25);`;
    }
    // Medium/High performance: dual layers with offset
    return `for ( int i=0; i<2; i++ ) {
        vec2 mv = vec2(fbm(uv * 4.5 + time * 0.115 + vec2(float(i) * 250.0))) * (0.50 + r * 0.25);
        mist += fbm(uv * 4.5 + mv - time * 0.0275) * (0.50 + r * 0.25);
    }`;
  }

  /**
   * Override createProgram to inject performance mode
   */
  static createProgram() {
    const mode = canvas?.performance?.mode ?? 2;
    return PIXI.Program.from(this.vertexShader, this.fragmentShader(mode));
  }

  /**
   * Fragment shader for fog effect
   * @param {number} mode - Performance mode (0=Low, 1=Medium, 2=High)
   */
  static fragmentShader(mode = 2) {
    return `
    ${this.FRAGMENT_HEADER}
    uniform float intensity;
    uniform float slope;
    uniform float rotation;
    
    ${this.CONSTANTS}
    ${this.PERCEIVED_BRIGHTNESS}
    ${this.PRNG}
    ${this.ROTATION}
     
    // ********************************************************* //

    float fnoise(in vec2 coords) {
      vec2 i = floor(coords);
      vec2 f = fract(coords);
    
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 cb = f * f * (3.0 - 2.0 * f);
    
      return mix(a, b, cb.x) + (c - a) * cb.y * (1.0 - cb.x) + (d - b) * cb.x * cb.y;
    }
     
    // ********************************************************* //

    float fbm(in vec2 uv) {
      float r = 0.0;
      float scale = 1.0;  
      uv += time * 0.03;
      uv *= 2.0;
        
      for (int i = 0; i < ${this.OCTAVES(mode)}; i++) {
        r += fnoise(uv + time * 0.03) * scale;
        uv *= 3.0;
        scale *= 0.3;
      }
      return r;
    }
    
    // ********************************************************* //
    
    vec3 mist(in vec2 uv, in float r) {
      float mist = 0.0;
      ${this.FOG(mode)}
      return vec3(0.9, 0.85, 1.0) * mist;
    }
    
    // ********************************************************* //
    
    void main() {
      ${this.COMPUTE_MASK}
      
      vec2 ruv;
      if ( rotation != 0.0 ) {
        ruv = vUvs - 0.5;
        ruv *= rot(rotation);
        ruv += 0.5;
      }
      else {
        ruv = vUvs;
      }
      
      vec3 col = mist(ruv * 2.0 - 1.0, 0.0) * 1.33;
      float pb = perceivedBrightness(col);
      pb = smoothstep(slope * 0.5, slope + 0.001, pb);
      
      gl_FragColor = vec4( mix(vec3(0.05, 0.05, 0.08), col * clamp(slope, 1.0, 2.0), pb), 1.0) 
                     * vec4(tint, 1.0) * intensity * mask * alpha;
    }
    `;
  }
}
