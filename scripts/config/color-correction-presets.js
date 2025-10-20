/**
 * @fileoverview Color Correction Presets for Map Shine
 * 
 * Comprehensive collection of cinematic color grading presets for post-processing.
 * Each preset includes saturation, brightness, contrast, exposure, gamma, levels,
 * white balance, tint, curves, and selective color adjustments.
 * 
 * These presets provide ready-to-use color grading configurations for various
 * visual styles and moods.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.1.52
 * @since 1.0.0
 */

/**
 * Color correction presets for cinematic post-processing effects.
 * 
 * Each preset contains:
 * - **Basic Adjustments**: saturation, brightness, contrast, exposure, gamma
 * - **Levels**: Input black/white points
 * - **White Balance**: Temperature and tint adjustments
 * - **Tint**: Color tint overlay
 * - **Curves**: RGB and per-channel tone curves
 * - **Selective Color**: HSL-based selective color adjustments
 * 
 * Available Presets:
 * - **neutral**: Default/no corrections
 * - **cinematic**: Professional film look with warm tones
 * - **vintage**: Aged film aesthetic with reduced saturation
 * - **cyberpunk**: High contrast neon look with cool tones
 * - **warm_sunset**: Golden hour warmth
 * - **cool_moonlight**: Cold blue moonlight ambience
 * - **vibrant_pop**: Saturated pop-art style
 * - **bleach_bypass**: Desaturated high-contrast film look
 * - **ethereal_glow**: Soft dreamy glow
 * - **sepia**: Classic sepia tone
 * - **black_and_white**: High contrast B&W
 * - **noir**: Dramatic film noir
 * - **sin_city**: High contrast B&W with selective red color
 * 
 * @constant {Object}
 */
export const COLOR_CORRECTION_PRESETS = {
  neutral: {
    name: "Neutral (Default)",
    saturation: 1.0,
    brightness: 0.0,
    contrast: 1.0,
    exposure: 0.0,
    gamma: 1.0,
    levels: {
      inBlack: 0.0,
      inWhite: 1.0,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#FFFFFF",
      amount: 0.0,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  cinematic: {
    name: "Cinematic",
    saturation: 1.15,
    brightness: -0.05,
    contrast: 1.1,
    exposure: 0.05,
    gamma: 0.95,
    levels: {
      inBlack: 0.02,
      inWhite: 0.98,
    },
    whiteBalance: {
      temperature: 0.08,
      tint: -0.03,
    },
    tint: {
      color: "#ffae70",
      amount: 0.07,
    },
    invert: false,
    curves: {
      enabled: true,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 0.25,
            y: 0.2,
          },
          {
            x: 0.75,
            y: 0.8,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 0.25,
            y: 0.28,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  vintage: {
    name: "Vintage Film",
    saturation: 0.75,
    brightness: 0.1,
    contrast: 1.2,
    exposure: -0.1,
    gamma: 1.1,
    levels: {
      inBlack: 0.08,
      inWhite: 0.92,
    },
    whiteBalance: {
      temperature: 0.1,
      tint: 0.04,
    },
    tint: {
      color: "#e0b87c",
      amount: 0.15,
    },
    invert: false,
    curves: {
      enabled: true,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0.05,
          },
          {
            x: 0.25,
            y: 0.28,
          },
          {
            x: 0.75,
            y: 0.72,
          },
          {
            x: 1,
            y: 0.95,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0.02,
          },
          {
            x: 1,
            y: 0.98,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  cyberpunk: {
    name: "Cyberpunk",
    saturation: 1.4,
    brightness: -0.15,
    contrast: 1.3,
    exposure: 0.1,
    gamma: 0.85,
    levels: {
      inBlack: 0.08,
      inWhite: 0.92,
    },
    whiteBalance: {
      temperature: -0.15,
      tint: 0.1,
    },
    tint: {
      color: "#f000ff",
      amount: 0.08,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  warm_sunset: {
    name: "Warm Sunset",
    saturation: 1.2,
    brightness: 0.05,
    contrast: 1.1,
    exposure: 0.1,
    gamma: 0.95,
    levels: {
      inBlack: 0.0,
      inWhite: 1.0,
    },
    whiteBalance: {
      temperature: 0.3,
      tint: 0.12,
    },
    tint: {
      color: "#ff8c42",
      amount: 0.1,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  cool_moonlight: {
    name: "Cool Moonlight",
    saturation: 0.85,
    brightness: -0.1,
    contrast: 1.1,
    exposure: -0.15,
    gamma: 1.05,
    levels: {
      inBlack: 0.03,
      inWhite: 0.97,
    },
    whiteBalance: {
      temperature: -0.25,
      tint: -0.05,
    },
    tint: {
      color: "#6a8dcf",
      amount: 0.09,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  vibrant_pop: {
    name: "Vibrant Pop",
    saturation: 1.6,
    brightness: 0.0,
    contrast: 1.25,
    exposure: 0.0,
    gamma: 0.9,
    levels: {
      inBlack: 0.0,
      inWhite: 1.0,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#FFFFFF",
      amount: 0.0,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  bleach_bypass: {
    name: "Bleach Bypass",
    saturation: 0.5,
    brightness: 0.0,
    contrast: 1.6,
    exposure: 0.1,
    gamma: 0.8,
    levels: {
      inBlack: 0.05,
      inWhite: 0.95,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#c0c0c0",
      amount: 0.05,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  ethereal_glow: {
    name: "Ethereal Glow",
    saturation: 1.1,
    brightness: 0.15,
    contrast: 0.85,
    exposure: 0.2,
    gamma: 1.1,
    levels: {
      inBlack: 0.0,
      inWhite: 1.0,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#ffc0cb",
      amount: 0.08,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  sepia: {
    name: "Sepia",
    saturation: 0.4,
    brightness: 0.1,
    contrast: 1.1,
    exposure: 0.0,
    gamma: 1.0,
    levels: {
      inBlack: 0.02,
      inWhite: 0.98,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#704214",
      amount: 0.5,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  black_and_white: {
    name: "Black & White",
    saturation: 0.0,
    brightness: 0.0,
    contrast: 1.4,
    exposure: 0.0,
    gamma: 1.0,
    levels: {
      inBlack: 0.05,
      inWhite: 0.95,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#FFFFFF",
      amount: 0.0,
    },
    invert: false,
    curves: {
      enabled: false,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  noir: {
    name: "Noir",
    saturation: 0.0,
    brightness: -0.05,
    contrast: 1.8,
    exposure: 0.0,
    gamma: 0.8,
    levels: {
      inBlack: 0.15,
      inWhite: 0.85,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#FFFFFF",
      amount: 0.0,
    },
    invert: false,
    curves: {
      enabled: true,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 0.3,
            y: 0.2,
          },
          {
            x: 0.7,
            y: 0.8,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: false,
      color: "#ff0000",
      hueRange: 0.05,
      saturationRange: 0.3,
      luminanceRange: 0.5,
      targetLuminance: 0.5,
      softness: 0.1,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 1.0,
      targetBrightness: 0.0,
    },
  },
  sin_city: {
    name: "Sin City",
    saturation: 0.0,
    brightness: 0.0,
    contrast: 1.9,
    exposure: -0.05,
    gamma: 1.1,
    levels: {
      inBlack: 0.2,
      inWhite: 0.8,
    },
    whiteBalance: {
      temperature: 0.0,
      tint: 0.0,
    },
    tint: {
      color: "#FFFFFF",
      amount: 0.0,
    },
    invert: false,
    curves: {
      enabled: true,
      activeChannel: "rgb",
      rgb: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 0.2,
            y: 0.1,
          },
          {
            x: 0.8,
            y: 0.9,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      red: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      green: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
      blue: {
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 1,
            y: 1,
          },
        ],
      },
    },
    selective: {
      enabled: true,
      color: "#ff0000",
      hueRange: 0.04,
      saturationRange: 0.5,
      luminanceRange: 0.7,
      targetLuminance: 0.45,
      softness: 0.05,
      invert: false,
      desaturation: 1.0,
      targetSaturation: 2.8,
      targetBrightness: 0.05,
    },
  },
};
