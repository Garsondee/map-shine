/**
 * @fileoverview Visual Effect Presets for Map Shine
 * 
 * Contains predefined configurations for gradients, LUTs, and other visual presets.
 * These presets provide ready-to-use configurations for common visual effects.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.1.52
 * @since 1.0.0
 */

/**
 * Predefined color gradient presets for various visual effects.
 * Each preset contains an array of hex color values that define a gradient
 * suitable for different themes and moods.
 * 
 * Used by iridescence effects, particle systems, and other color-based effects.
 *
 * @constant {Object}
 * @property {Object} rainbow - Vibrant rainbow gradient with full spectrum colors
 * @property {Object} magma - Hot magma gradient from black through red to white
 * @property {Object} ice - Cool ice gradient with blue and white tones
 * @property {Object} toxic - Toxic/radioactive gradient with green tones
 * @property {Object} sunset - Warm sunset gradient with orange and purple tones
 * @property {Object} synthwave - Retro synthwave gradient with neon colors
 * @property {string[]} [presetName.colors] - Array of hex color strings defining the gradient
 */
export const GRADIENT_PRESETS = {
  rainbow: {
    colors: [
      "#ff0000",
      "#ffff00",
      "#00ff00",
      "#00ffff",
      "#0000ff",
      "#ff00ff",
      "#ff0000",
    ],
  },
  magma: {
    colors: [
      "#000000",
      "#3c1000",
      "#d23c02",
      "#f9c302",
      "#ffffff",
      "#f9c302",
      "#d23c02",
      "#3c1000",
      "#000000",
    ],
  },
  ice: {
    colors: [
      "#e3f8ff",
      "#a1d7ff",
      "#5d9fff",
      "#2a6bff",
      "#0041a7",
      "#2a6bff",
      "#5d9fff",
      "#a1d7ff",
      "#e3f8ff",
    ],
  },
  toxic: {
    colors: [
      "#4a004a",
      "#a400a4",
      "#00ff00",
      "#008300",
      "#000000",
      "#008300",
      "#00ff00",
      "#a400a4",
      "#4a004a",
    ],
  },
  sunset: {
    colors: [
      "#f9e075",
      "#f79e52",
      "#e25442",
      "#982c44",
      "#401b3b",
      "#982c44",
      "#e25442",
      "#f79e52",
      "#f9e075",
    ],
  },
  synthwave: {
    colors: [
      "#f72585",
      "#7209b7",
      "#3a0ca3",
      "#4361ee",
      "#4cc9f0",
      "#4361ee",
      "#3a0ca3",
      "#7209b7",
      "#f72585",
    ],
  },
};

/**
 * LUT (Lookup Table) presets for color grading and post-processing effects.
 * LUTs are used to apply cinematic color grades to the entire scene.
 * 
 * @constant {Object}
 * @property {Object} custom - Custom LUT with user-specified path
 * @property {Object} severn - Severn color grade preset
 * @property {Object} celluloid-low - Low-intensity celluloid film look
 * @property {string} [presetName.name] - Display name for the preset
 * @property {string} [presetName.path] - Path to the LUT texture file
 */
export const LUT_PRESETS = {
  custom: {
    name: "Custom Path",
    path: "",
  },
  severn: {
    name: "Severn",
    path: "modules/map-shine/assets/luts/vertopal.com_Colorist_Factory_Severn_LUT.png",
  },
  "celluloid-low": {
    name: "Celluloid (Low)",
    path: "modules/map-shine/assets/luts/vertopal.com_CELLULOID_01_FU_LOW.png",
  },
};

/**
 * Available effect source options for various visual effects.
 * Maps effect identifiers to display names for UI selection.
 * 
 * Used by effect selection dropdowns to choose which effects can be used as sources.
 * 
 * @constant {Object}
 * @property {string} [effectId] - Display name for the effect
 */
export const EFFECT_SOURCE_OPTIONS = {
  "": "None",
  sparks: "Sparks",
  fire: "Fire Particles",
  candleFlame: "Candle Flame",
  dust: "Dust Motes",
  smellyFlies: "Smelly Flies",
  lightning: "Lightning",
  cloudShadows: "Cloud Shadows",
  canopy: "Canopy Shadows",
  structuralShadows: "Structural Shadows",
  water: "Water Surface",
  pressurisedSteam: "Pressurised Steam",
  // More effects can be added here as they become compatible.
};

/**
 * Physics-based rope type presets for the rope simulation system.
 * Each preset defines physical properties like damping, spring constants, and wind response.
 * 
 * Used by the physics rope layer to configure rope behavior and appearance.
 * 
 * @constant {Object}
 * @property {Object} rope - Standard rope with medium flexibility
 * @property {Object} chain - Heavy chain with minimal wind response
 * @property {Object} elastic - Elastic/rubber with high flexibility
 * @property {string} [presetName.label] - Display name for the preset
 * @property {string} [presetName.texturePath] - Path to the rope texture
 * @property {number} [presetName.segmentLength] - Length of each rope segment in pixels
 * @property {number} [presetName.animationSpeed] - Animation speed multiplier
 * @property {number} [presetName.damping] - Damping factor (0-1) for motion decay
 * @property {number} [presetName.windForce] - Wind force multiplier
 * @property {number} [presetName.springConstant] - Spring stiffness (0-1)
 * @property {number} [presetName.tapering] - Rope thickness tapering (0-1)
 * @property {string|null} [presetName.ropeEndTexturePath] - Optional end cap texture
 * @property {number} [presetName.ropeEndScale] - Scale of end cap
 * @property {number} [presetName.ropeEndStiffness] - Stiffness of end segment
 * @property {number} [presetName.indoorWindShielding] - Indoor wind reduction (0-1)
 * @property {number} [presetName.endpointFade] - Fade amount at endpoints (0-1)
 * @property {number} [presetName.fadeStartDistance] - Start distance for fade (0-1)
 * @property {number} [presetName.fadeEndDistance] - End distance for fade (0-1)
 */
export const ROPE_TYPE_PRESETS = {
  rope: {
    label: "Rope",
    texturePath: "modules/map-shine/assets/rope.webp",
    segmentLength: 10,
    animationSpeed: 1,
    damping: 0.99,
    windForce: 1.0,
    springConstant: 0.8,
    tapering: 0.5,
    ropeEndTexturePath: null,
    ropeEndScale: 1.0,
    ropeEndStiffness: 0.3,
    indoorWindShielding: 0.9,
    endpointFade: 0.0,
    fadeStartDistance: 0.2,
    fadeEndDistance: 0.2,
  },
  chain: {
    label: "Chain",
    texturePath: "modules/map-shine/assets/rope.webp",
    segmentLength: 15,
    animationSpeed: 0.8,
    damping: 0.95,
    windForce: 0.3,
    springConstant: 0.8,
    tapering: 0.2,
    ropeEndTexturePath: null,
    ropeEndScale: 1.0,
    ropeEndStiffness: 0.5,
    indoorWindShielding: 0.7,
    endpointFade: 0.0,
    fadeStartDistance: 0.2,
    fadeEndDistance: 0.2,
  },
  elastic: {
    label: "Elastic/Rubber",
    texturePath: "modules/map-shine/assets/rope.webp",
    segmentLength: 8,
    animationSpeed: 1.2,
    damping: 0.98,
    windForce: 1.5,
    springConstant: 0.8,
    tapering: 0.7,
    ropeEndTexturePath: null,
    ropeEndScale: 1.0,
    ropeEndStiffness: 0.2,
    indoorWindShielding: 0.95,
    endpointFade: 0.0,
    fadeStartDistance: 0.2,
    fadeEndDistance: 0.2,
  },
};
