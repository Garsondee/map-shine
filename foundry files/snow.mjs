import AbstractWeatherShader from "./base-weather.mjs";

/**
 * Snow shader effect.
 */
export default class SnowShader extends AbstractWeatherShader {

  /** @inheritdoc */
  static defaultUniforms = {
    direction: 1.2
  };

  /* -------------------------------------------- */

  /** @inheritdoc */
  static fragmentShader = `
    ${this.FRAGMENT_HEADER}
    uniform float direction;

    // Contribute to snow PRNG
    const mat3 prng = mat3(
      13.323122, 23.5112,  21.71123,
      21.1212,   28.7312,  11.9312,
      21.8112,   14.7212,  61.3934
    );

    // Compute snow density according to uv and layer                       
    float computeSnowDensity(in vec2 uv, in float layer) {
      vec3 sb = vec3(floor(uv), 31.189 + layer);
      vec3 m = floor(sb) / 10000.0 + fract(sb);
      vec3 mp = (31415.9 + m) / fract(prng * m);
      vec3 r = fract(mp);
      vec2 s = abs(fract(uv) + 0.9 * r.xy - 0.95) + 0.01 * abs(2.0 * fract(10.0 * uv.yx) - 1.0);
      float d = 0.6 * (s.x + s.y) + max(s.x, s.y) - 0.01;
      float e = 0.005 + 0.05 * min(0.5 * abs(layer - 5.0 - sin(time * 0.1)), 1.0);
      return smoothstep(e * 2.0, -e * 2.0, d) * r.x / (0.5 + layer * 0.015);
    }              
 
    void main() {
      ${this.COMPUTE_MASK}
      
      // Snow accumulation
      float accumulation = 0.0;
      
      // Compute layers  
      for( int i=5; i<25; i++ ) {
        // Compute uv layerization
        float f = float(i);
        float f1 = 1.0 + f * 1.5;
        float f2 = fract(f * 6.258817) - direction;
        float f3 = 1.0 + f * 0.045;
        vec2 snowuv = vUvs * f1;
        snowuv += vec2(snowuv.y * 1.2 * f2, -time / f3);
        
        // Perform accumulation layer after layer    
        accumulation += computeSnowDensity(snowuv, f);
      }
      
      // Output the accumulated snow pixel
      gl_FragColor = vec4(vec3(accumulation) * tint, 1.0) * mask * alpha;
    }
  `;
}


