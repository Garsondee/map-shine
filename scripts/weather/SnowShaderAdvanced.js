/**
 * Advanced Snow Shader - Pure Orthographic Bird's-Eye Top-Down View
 * 
 * CRITICAL PERSPECTIVE CONSTRAINT:
 * This shader is designed for a **non-perspective, orthographic, bird's-eye view**
 * looking straight down at the ground from above. The camera never tilts or rotates.
 * 
 * In this viewpoint:
 * - Snow falling vertically creates NO visible motion (you're looking down the fall axis)
 * - What you SEE: Snowflakes drifting horizontally across the ground due to wind
 * - Drift direction: Aligned with wind direction
 * - Drift motion: Translates across the map in wind direction
 * - Multi-layer depth for parallax effect (closer layers drift faster)
 * 
 * Implementation:
 * - 20 layers of procedural snowflakes with depth-based drift
 * - Wind direction vector controls ALL movement (no separate "falling")
 * - Turbulent wobble for realistic snowflake movement
 * - Wind strength scales drift intensity
 * - Like rain: movement is ONLY in the wind direction
 */
import { WeatherShaderBase } from './WeatherShaderBase.js';

export class SnowShaderAdvanced extends WeatherShaderBase {
  
  /**
   * Default uniform values for pure top-down snow
   */
  static defaultUniforms = {
    opacity: 1,
    windDirection: [0, -1],    // Wind direction vector (default: south in screen coords)
    windStrength: 0.5,         // 0-1 normalized wind intensity (for wobble only)
    snowDensity: 1.0,          // Overall snow amount
    driftAmount: 1.0           // Wind drift intensity (constant base rate)
  };

  /**
   * Fragment shader for pure top-down snow
   */
  static fragmentShader = `
    ${this.FRAGMENT_HEADER}
    ${this.CONSTANTS}
    
    uniform float opacity;
    uniform vec2 windDirection;
    uniform float windStrength;
    uniform float snowDensity;
    uniform float driftAmount;

    // Contribute to snow PRNG (same as original)
    const mat3 prng = mat3(
      13.323122, 23.5112,  21.71123,
      21.1212,   28.7312,  11.9312,
      21.8112,   14.7212,  61.3934
    );

    // Compute snow density according to uv and layer (same as original)
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
      
      // Calculate normalized depth factor (closer layers = higher depth value)
      // This will be used to make closer snowflakes drift more than distant ones
      
      // Snow accumulation
      float accumulation = 0.0;
      
      // Compute 20 layers of snow (i=5 to i=25)
      for(int i=5; i<25; i++) {
        float f = float(i);
        
        // Layer scaling (closer = larger snowflakes)
        float layerScale = 1.0 + f * 1.5;
        
        // Depth factor for this layer (0.0 = far, 1.0 = near)
        // Closer layers (higher i) get more drift (parallax)
        float depthFactor = (f - 5.0) / 20.0;  // Maps i=5→0.0, i=25→1.0
        
        // Start with base UV
        vec2 snowuv = vUvs * layerScale;
        
        // WIND-BASED DRIFT: Constant drift rate (speed modulated via shader.speed)
        // Closer layers drift faster (depth-based parallax)
        // Wind direction is already in screen coordinates
        // Drift speed controlled by JavaScript to prevent position jumps during gusts
        float driftIntensity = driftAmount * (0.5 + depthFactor * 0.5);
        snowuv += windDirection * time * driftIntensity * 0.8;
        
        // TURBULENT WOBBLE: Subtle chaotic motion (uses windStrength for intensity)
        // Creates realistic snowflake dancing - strength changes are OK here (not cumulative)
        float wobbleX = sin(time * 1.5 + f * 0.5 + snowuv.y * 3.0) * windStrength * 0.02;
        float wobbleY = cos(time * 1.2 + f * 0.7 + snowuv.x * 2.5) * windStrength * 0.015;
        snowuv += vec2(wobbleX, wobbleY);
        
        // Perform accumulation layer after layer
        accumulation += computeSnowDensity(snowuv, f) * snowDensity;
      }
      
      // Output the accumulated snow pixel
      gl_FragColor = vec4(vec3(accumulation) * tint, 1.0) * mask * alpha * opacity;
    }
  `;
}
