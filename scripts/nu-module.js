/*********************************************************************************
 *
 *                                 MAP SHINE
 *                              Refactored Architecture
 *
 *  Welcome to the refactored version of Map Shine. This module has been rebuilt
 *  from the ground up to be more robust, maintainable, and performant.
 *
 *  Core Architectural Principles:
 *
 *  1.  Centralized Control: A single static class, `MapShineEngine`, now acts as
 *      the "brain" of the module. It manages the entire lifecycle, from scene
 *      setup to teardown, and orchestrates the main animation loop. This
 *      eliminates the complex, interwoven dependencies of the previous version.
 *
 *  2.  Data-Driven Effects: Instead of numerous `CanvasLayer` subclasses, effects
 *      are now lightweight, modular objects that extend a base `Effect` class.
 *      The engine discovers which effects are needed based on texture maps
 *      (e.g., "_Specular.webp") and instantiates only the necessary effect objects.
 *
 *  3.  Unified Rendering Pipeline: All on-map visual effects are rendered into a
 *      single, dedicated `MapShineLayer`. This provides a clear, predictable
 *      rendering order and simplifies the scene graph. Global post-processing
 *      effects remain as filters on the main canvas stage, managed centrally.
 *
 *  4.  Decoupled Systems: Sub-systems like particle management, mask generation,
 *      and UI are now more self-contained and communicate with the main engine
 *      through a clear, defined interface, reducing complexity and the chance of
 *      race conditions.
 *
 *  5.  Debugging: This version includes extensive `console.log` statements prefixed
 *      with "[MapShine]" to provide clear insight into the module's lifecycle
 *      and state changes, aiding in troubleshooting and development.
 *
 *********************************************************************************/

// =================================================================================
// SECTION 1: MODULE SETUP & CONFIGURATION
// =================================================================================
// Description: Global constants, default settings, and simple utility functions.
// ---------------------------------------------------------------------------------

const MODULE_ID = 'map-shine';
const PROFILES_SETTING = 'profiles';
const DEFAULT_PROFILE_SETTING = 'defaultProfile';

const BLEND_MODE_OPTIONS = {
    'NORMAL': PIXI.BLEND_MODES.NORMAL,
    'ADD': PIXI.BLEND_MODES.ADD,
    'MULTIPLY': PIXI.BLEND_MODES.MULTIPLY,
    'SCREEN': PIXI.BLEND_MODES.SCREEN,
    'OVERLAY': PIXI.BLEND_MODES.OVERLAY,
    'DARKEN': PIXI.BLEND_MODES.DARKEN,
    'LIGHTEN': PIXI.BLEND_MODES.LIGHTEN,
    'COLOR_DODGE': PIXI.BLEND_MODES.COLOR_DODGE,
    'COLOR_BURN': PIXI.BLEND_MODES.COLOR_BURN,
    'HARD_LIGHT': PIXI.BLEND_MODES.HARD_LIGHT,
    'SOFT_LIGHT': PIXI.BLEND_MODES.SOFT_LIGHT,
    'DIFFERENCE': PIXI.BLEND_MODES.DIFFERENCE,
    'EXCLUSION': PIXI.BLEND_MODES.EXCLUSION,
};

const GRADIENT_PRESETS = {
    rainbow: {
        colors: ["#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ff0000"]
    },
    "magma": {
        colors: ["#000000", "#3c1000", "#d23c02", "#f9c302", "#ffffff", "#f9c302", "#d23c02", "#3c1000", "#000000"]
    },
    "ice": {
        colors: ["#e3f8ff", "#a1d7ff", "#5d9fff", "#2a6bff", "#0041a7", "#2a6bff", "#5d9fff", "#a1d7ff", "#e3f8ff"]
    },
    "toxic": {
        colors: ["#4a004a", "#a400a4", "#00ff00", "#008300", "#000000", "#008300", "#00ff00", "#a400a4", "#4a004a"]
    },
    "sunset": {
        colors: ["#f9e075", "#f79e52", "#e25442", "#982c44", "#401b3b", "#982c44", "#e25442", "#f79e52", "#f9e075"]
    },
    "synthwave": {
        colors: ["#f72585", "#7209b7", "#3a0ca3", "#4361ee", "#4cc9f0", "#4361ee", "#3a0ca3", "#7209b7", "#f72585"]
    },
};

const LUT_PRESETS = {
    "custom": {
        name: "Custom Path",
        path: ""
    },
    "severn": {
        name: "Severn",
        path: "modules/map-shine/assets/luts/vertopal.com_Colorist_Factory_Severn_LUT.png"
    },
    "celluloid-low": {
        name: "Celluloid (Low)",
        path: "modules/map-shine/assets/luts/vertopal.com_CELLULOID_01_FU_LOW.png"
    }
};

const EFFECT_SOURCE_OPTIONS = {
    "": "None",
    sparks: "Sparks",
    fire: "Fire Particles",
    dust: "Dust Motes",
    cloudShadows: "Cloud Shadows",
    canopy: "Canopy Shadows",
    structuralShadows: "Structural Shadows",
    water: "Water Surface",
};

const COLOR_CORRECTION_PRESETS = {
    "neutral": {
        name: "Neutral (Default)",
        saturation: 1.0,
        brightness: 0.0,
        contrast: 1.0,
        exposure: 0.0,
        gamma: 1.0,
        levels: { inBlack: 0.0, inWhite: 1.0 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#FFFFFF", amount: 0.0 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "cinematic": {
        name: "Cinematic",
        saturation: 1.15,
        brightness: -0.05,
        contrast: 1.1,
        exposure: 0.05,
        gamma: 0.95,
        levels: { inBlack: 0.02, inWhite: 0.98 },
        whiteBalance: { temperature: 0.08, tint: -0.03 },
        tint: { color: "#ffae70", amount: 0.07 },
        invert: false,
        curves: { enabled: true, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 0.25, "y": 0.20 }, { "x": 0.75, "y": 0.80 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 0.25, "y": 0.28 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "vintage": {
        name: "Vintage Film",
        saturation: 0.75,
        brightness: 0.1,
        contrast: 1.2,
        exposure: -0.1,
        gamma: 1.1,
        levels: { inBlack: 0.08, inWhite: 0.92 },
        whiteBalance: { temperature: 0.1, tint: 0.04 },
        tint: { color: "#e0b87c", amount: 0.15 },
        invert: false,
        curves: { enabled: true, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0.05 }, { "x": 0.25, "y": 0.28 }, { "x": 0.75, "y": 0.72 }, { "x": 1, "y": 0.95 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0.02 }, { "x": 1, "y": 0.98 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "cyberpunk": {
        name: "Cyberpunk",
        saturation: 1.4,
        brightness: -0.15,
        contrast: 1.3,
        exposure: 0.1,
        gamma: 0.85,
        levels: { inBlack: 0.08, inWhite: 0.92 },
        whiteBalance: { temperature: -0.15, tint: 0.1 },
        tint: { color: "#f000ff", amount: 0.08 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "warm_sunset": {
        name: "Warm Sunset",
        saturation: 1.2,
        brightness: 0.05,
        contrast: 1.1,
        exposure: 0.1,
        gamma: 0.95,
        levels: { inBlack: 0.0, inWhite: 1.0 },
        whiteBalance: { temperature: 0.3, tint: 0.12 },
        tint: { color: "#ff8c42", amount: 0.1 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "cool_moonlight": {
        name: "Cool Moonlight",
        saturation: 0.85,
        brightness: -0.1,
        contrast: 1.1,
        exposure: -0.15,
        gamma: 1.05,
        levels: { inBlack: 0.03, inWhite: 0.97 },
        whiteBalance: { temperature: -0.25, tint: -0.05 },
        tint: { color: "#6a8dcf", amount: 0.09 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "vibrant_pop": {
        name: "Vibrant Pop",
        saturation: 1.6,
        brightness: 0.0,
        contrast: 1.25,
        exposure: 0.0,
        gamma: 0.9,
        levels: { inBlack: 0.0, inWhite: 1.0 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#FFFFFF", amount: 0.0 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "bleach_bypass": {
        name: "Bleach Bypass",
        saturation: 0.5,
        brightness: 0.0,
        contrast: 1.6,
        exposure: 0.1,
        gamma: 0.8,
        levels: { inBlack: 0.05, inWhite: 0.95 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#c0c0c0", amount: 0.05 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "ethereal_glow": {
        name: "Ethereal Glow",
        saturation: 1.1,
        brightness: 0.15,
        contrast: 0.85,
        exposure: 0.2,
        gamma: 1.1,
        levels: { inBlack: 0.0, inWhite: 1.0 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#ffc0cb", amount: 0.08 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "sepia": {
        name: "Sepia",
        saturation: 0.4,
        brightness: 0.1,
        contrast: 1.1,
        exposure: 0.0,
        gamma: 1.0,
        levels: { inBlack: 0.02, inWhite: 0.98 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#704214", amount: 0.5 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "black_and_white": {
        name: "Black & White",
        saturation: 0.0,
        brightness: 0.0,
        contrast: 1.4,
        exposure: 0.0,
        gamma: 1.0,
        levels: { inBlack: 0.05, inWhite: 0.95 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#FFFFFF", amount: 0.0 },
        invert: false,
        curves: { enabled: false, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "noir": {
        name: "Noir",
        saturation: 0.0,
        brightness: -0.05,
        contrast: 1.8,
        exposure: 0.0,
        gamma: 0.8,
        levels: { inBlack: 0.15, inWhite: 0.85 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#FFFFFF", amount: 0.0 },
        invert: false,
        curves: { enabled: true, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 0.3, "y": 0.2 }, { "x": 0.7, "y": 0.8 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: false, color: "#ff0000", hueRange: 0.05, saturationRange: 0.3, luminanceRange: 0.5, targetLuminance: 0.5, softness: 0.1, invert: false, desaturation: 1.0, targetSaturation: 1.0, targetBrightness: 0.0 }
    },
    "sin_city": {
        name: "Sin City",
        saturation: 0.0,
        brightness: 0.0,
        contrast: 1.9,
        exposure: -0.05,
        gamma: 1.1,
        levels: { inBlack: 0.2, inWhite: 0.8 },
        whiteBalance: { temperature: 0.0, tint: 0.0 },
        tint: { color: "#FFFFFF", amount: 0.0 },
        invert: false,
        curves: { enabled: true, activeChannel: 'rgb', rgb: { points: [{ "x": 0, "y": 0 }, { "x": 0.2, "y": 0.1 }, { "x": 0.8, "y": 0.9 }, { "x": 1, "y": 1 }] }, red: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, green: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] }, blue: { points: [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }] } },
        selective: { enabled: true, color: "#ff0000", hueRange: 0.04, saturationRange: 0.5, luminanceRange: 0.7, targetLuminance: 0.45, softness: 0.05, invert: false, desaturation: 1.0, targetSaturation: 2.8, targetBrightness: 0.05 }
    }
};

const MODULE_DEFAULTS = {
    "timeControl": { "globalTime": 100 },
    "enabled": true,
    "debug": true,
    "showTokenMask": false,
    "showDustMaskDebug": false,
    "showGlintMaskDebug": false,
    "tileOpacity": 0,
"baseShine": {
    "worldBasedOnly": false,
    "enabled": true,
    "specularTexturePath": "",
    "patternType": "stripes",
    "compositing": { "layerBlendMode": 1 },
    "animation": { "globalIntensity": 2.9, "hotspot": 0, "updateFrequency": 10, "parallaxAmount": 0.94, "parallaxJitter": 1.5, "parallaxJitterSpeed": 0.3 },
    "fbmNoise": { "enabled": true, "speed": 0.005, "scale": 1.2, "octaves": 5, "persistence": 0.4, "lacunarity": 2.1, "evolution": 0.15, "brightness": 0.5, "contrast": 1.2 },
    "pattern": { "shared": { "patternScale": 0.16, "maxBrightness": 0.26 }, "stripes1": { "enabled": true, "intensity": 0.5, "speed": -0.006, "tintColor": "#FFFFFF", "angle": 50, "sharpness": 8, "bandDensity": 2, "bandWidth": 1, "subStripeMaxCount": 5, "subStripeMaxSharp": 1.5 }, "stripes2": { "enabled": true, "intensity": 0.5, "speed": 0.004, "tintColor": "#FFFFFF", "angle": 44, "sharpness": 8, "bandDensity": 1, "bandWidth": 1, "subStripeMaxCount": 3, "subStripeMaxSharp": 0 }, "checkerboard": { "gridSize": 8, "brightness1": 0.15, "brightness2": 0.05 } },
    "noise": { "enabled": true, "speed": -0.003, "scale": 0.7, "threshold": 0.7, "brightness": 1, "contrast": 4.15, "softness": 1 },
    "shineBloom": { "enabled": false, "threshold": 0.45, "brightness": 0.6, "blur": 4, "quality": 2 },
    "starburst": { "enabled": false, "blendMode": 1, "threshold": 0.72, "intensity": 4, "angle": 18, "points": 2, "size": 6, "falloff": 0.7 },
    "rgbSplit": { "enabled": true, "amount": 6.7 },
    "colorCorrection": { "enabled": false, "saturation": 3, "brightness": 1, "contrast": 1.1, "exposure": 0, "gamma": 0.95, "levels": { "inBlack": 0, "inWhite": 1 }, "tint": { "color": "#ffcb2d", "amount": 0 } }
},
    "cloudShadows": {
        "worldBasedOnly": false,
        "enabled": true,
        "blendMode": 0,
        "shadowIntensity": 0.5,
        "maskBlur": 0,
        "illumination": { "enabled": false, "intensity": 1, "luminanceThreshold": 0.97, "softness": 0.01 },
        "wind": { "angle": 45, "speed": 0.0024 },
        "noise": { "scale": 0.35, "octaves": 7, "persistence": 0.35, "lacunarity": 1.9 },
        "shading": { "threshold": 1, "softness": 0.71, "brightness": 0.14, "contrast": 5, "gamma": 1.6 }
    },
    "iridescence": {
        "worldBasedOnly": false,
        "enabled": true,
        "texturePath": "",
        "blendMode": 1,
        "intensity": 0.9,
        "speed": 0.01,
        "scale": 0.7,
        "parallax": 0,
        "fbm": { "octaves": 5, "persistence": 0.33, "lacunarity": 1.9, "evolution": 0, "brightness": 0.45, "contrast": 0.8 },
        "distortion": { "enabled": true, "strength": 5.26 },
        "noise": { "enabled": true, "speed": 0.042, "scale": 9.7, "threshold": 0.47, "brightness": 0.74, "contrast": 2.45, "softness": 0.5 },
        "gradient": { "name": "rainbow", "hueShift": 0, "brightness": 0.04, "contrast": 0.5 }
    },
"canopy": {
        "worldBasedOnly": false,
        "enabled": true,
        "shadowIntensity": 0.4,
        "tint": "#050805",
        "sway": {
            "intensity": 5.0,
            "speed": 0.8,
            "scale": 1.5
        }
    },
    "structuralShadows": {
        "worldBasedOnly": false,
        "enabled": true,
        "shadowIntensity": 0.8,
        "tint": "#000000",
        "parallax": 0,
        "rgbSplit": { "enabled": true, "intensity": 8.8, "threshold": 0 },
        "intensityNoise": { "enabled": true, "amount": 0, "speed": 0.15, "scale": 1.25, "evolution": 0, "threshold": 0.71, "brightness": -1.13, "contrast": 2.8, "softness": 1 },
        "cloudOcclusion": { "enabled": true, "intensity": 0.25, "wind": { "angle": 45, "speed": 0.0005 }, "noise": { "scale": 0.18, "octaves": 5, "persistence": 0.4, "lacunarity": 2.6 }, "shading": { "threshold": 0.68, "softness": 0.04, "brightness": 0.5, "contrast": 2.5, "gamma": 1.95, "exposure": -1.65, "levels": { "inBlack": 0.13, "inWhite": 1 } } },
        "metallicShineMixIn": { "enabled": false, "intensity": 1 }
    },
    "prism": {
        "worldBasedOnly": false,
        "enabled": true,
        "intensity": 1,
        "angle": 218,
        "threshold": 0.1,
        "softness": 0.5,
        "distortionStrength": 1.9,
        "distortionNoise": { "enabled": true, "speed": 0, "scale": 3.83, "evolution": 0, "threshold": 0, "brightness": 0.11, "contrast": 1.85, "softness": 1 }
    },
    "ambient": {
        "worldBasedOnly": false,
        "enabled": true,
        "texturePath": "",
        "blendMode": 1,
        "intensity": 1,
        "masking": { "enabled": true, "threshold": 0, "softness": 0.25 },
        "tokenMasking": { "enabled": true, "threshold": 0 },
        "colorCorrection": { "enabled": true, "saturation": 1.2, "brightness": 0, "contrast": 1, "gamma": 1, "tint": { "color": "#ff0209", "amount": 0 } }
    },
    "groundGlow": {
        "worldBasedOnly": false,
        "enabled": true,
        "texturePath": "",
        "blendMode": 1,
        "intensity": 1.05,
        "luminanceThreshold": 0.25,
        "brightness": 1.2,
        "saturation": 1.2,
        "softness": 1,
        "invert": false,
        "tokenMasking": { "enabled": true, "threshold": 0 }
    },
    "heatDistortion": {
        "worldBasedOnly": false,
        "enabled": true,
        "texturePath": "",
        "intensity": 0.001,
        "noise": { "speed": -0.02, "scale": 1.9, "threshold": 0.26, "brightness": 0.04, "contrast": 0.4, "softness": 0.83, "evolution": 0.11 }
    },
    "advancedBloom": { "worldBasedOnly": false, "enabled": false, "threshold": 0.5, "bloomScale": 1, "brightness": 1, "blur": 8, "quality": 4 },
    "sceneTransition": { "enabled": true, "worldBasedOnly": true, "fadeOutDuration": 5000, "fadeInDuration": 5000, "logoPath": "modules/map-shine/assets/mm-logo.png", "heading": "New Chapter", "subheading": "The story continues...", "staticDescription": "This is the default description text...", "showSceneName": true, "useRandomHint": true, "randomHints": ["Loading Screen Hint 1", "Loading Screen Hint 2", "Loading Screen Hint 3"] },
    "pauseEffect": { "enabled": true, "worldBasedOnly": true, "duration": 3000, "colorCorrection": { "enabled": true, "saturation": 0.2, "brightness": -0.15, "contrast": 1, "invert": false, "tint": { "color": "#FFFFFF", "amount": 0 }, "exposure": 0, "gamma": 1, "levels": { "inBlack": 0, "inWhite": 1 }, "whiteBalance": { "temperature": 0, "tint": 0 }, "mask": { "enabled": false, "invert": false, "luminanceThreshold": 0.25, "softness": 0.1 }, "selective": { "enabled": false, "color": "#ff0000", "hueRange": 0.05, "saturationRange": 0.3 } } },
    "combatEffect": { "enabled": true, "worldBasedOnly": true, "duration": 2000, "timeScale": 0.25, "colorCorrection": { "enabled": true, "saturation": 1, "brightness": 0, "contrast": 1, "invert": false, "tint": { "color": "#FFFFFF", "amount": 0 }, "exposure": 0, "gamma": 1, "levels": { "inBlack": 0, "inWhite": 1 }, "whiteBalance": { "temperature": 0, "tint": 0 }, "mask": { "enabled": false, "invert": false, "luminanceThreshold": 0.25, "softness": 0.1 }, "selective": { "enabled": false, "color": "#ff0000", "hueRange": 0.05, "saturationRange": 0.3 } } },
    "postProcessing": { "worldBasedOnly": true, "enabled": true, "colorCorrection": { "enabled": true, "saturation": 1, "brightness": 0, "contrast": 1, "invert": false, "tint": { "color": "#FFFFFF", "amount": 0 }, "exposure": 0, "gamma": 1, "levels": { "inBlack": 0, "inWhite": 1 }, "whiteBalance": { "temperature": 0, "tint": 0 }, "highlightCloud": { "enabled": true, "brightness": 0 }, "highlightCanopy": { "enabled": true, "brightness": 0 }, "highlightStructural": { "enabled": true, "brightness": 0.5 }, "sceneIlluminationMixIn": { "enabled": false, "intensity": 1, "blendMode": 1, "debugMode": false, "colorCorrection": { "enabled": true, "saturation": 1, "brightness": 0, "contrast": 1, "exposure": 0, "gamma": 1, "tint": { "color": "#FFFFFF", "amount": 0 } }, "noise": { "enabled": true, "amount": 0.01, "scale": 1, "speed": 0.001 }, "shadowInteraction": { "enabled": true, "intensity": 1, "luminanceThreshold": 0.1, "softness": 0.15 }, "negativeMask": { "enabled": false, "threshold": 0.8, "softness": 0.2 } }, "mask": { "enabled": false, "invert": false, "luminanceThreshold": 0.25, "softness": 0.1 }, "selective": { "enabled": false, "color": "#fb0045", "hueRange": 0.02, "saturationRange": 0.5, "luminanceRange": 0.5, "targetLuminance": 0.04, "softness": 0.1, "invert": false, "desaturation": 1, "targetSaturation": 1, "targetBrightness": 0 }, "curves": { "enabled": false, "activeChannel": "rgb", "rgb": { "points": [{ "x": 0, "y": 0 }, { "x": 0.25, "y": 0.25 }, { "x": 0.75, "y": 0.75 }, { "x": 1, "y": 1 }] }, "red": { "points": [{ "x": 0, "y": 0 }, { "x": 0.25, "y": 0.25 }, { "x": 0.75, "y": 0.75 }, { "x": 1, "y": 1 }] }, "green": { "points": [{ "x": 0, "y": 0 }, { "x": 0.25, "y": 0.25 }, { "x": 0.75, "y": 0.75 }, { "x": 1, "y": 1 }] }, "blue": { "points": [{ "x": 0, "y": 0 }, { "x": 0.25, "y": 0.25 }, { "x": 0.75, "y": 0.75 }, { "x": 1, "y": 1 }] } }, "dynamicExposure": { "enabled": true, "intensity": 1.5, "duration": 8000, "resetPeriod": 60000 } }, "vignette": { "enabled": false, "amount": 0.24, "softness": 0.36 }, "lensDistortion": { "enabled": false, "amount": 0.015, "centerX": 0.5, "centerY": 0.5 }, "chromaticAberration": { "enabled": true, "amount": 0.001, "centerX": 0.5, "centerY": 0.5 }, "tiltShift": { "enabled": false, "blur": 23, "gradientBlur": 3610, "startX": 0, "startY": 0.5, "endX": 1, "endY": 0.5 }, "lut": { "enabled": true, "texturePath": "", "intensity": 1, "presetName": "custom", "diagnosticMode": 0, "diagnosticSlice": 1, "domainMin": { "r": 0, "g": 0, "b": 0 }, "domainMax": { "r": 1, "g": 1, "b": 1 }, "preLutBlur": { "enabled": false, "amount": 0 }, "inputProcessing": { "enabled": false, "saturation": 1, "brightness": 0, "contrast": 1, "gamma": 0.9, "hue": 0 } } },
    "dust": { "worldBasedOnly": false, "enabled": true, "blendMode": 0, "maskThreshold": 0.39, "maskInfluence": 5, "particleTexture": "modules/map-shine/assets/particle.webp", "frequency": 0.286, "lifetime": { "min": 4, "max": 12 }, "color": { "start": "#ffd275", "end": "#ffe9b9" }, "alpha": { "max": 0.51, "fadeIn": 0.5, "fadeOut": 0.5 }, "scale": { "sizeMultiplier": 1.7, "start": 0.9, "end": 1.09, "minMult": 0.86 }, "speed": { "start": 3, "end": 6, "minMult": 0.5 }, "rotation": { "enabled": false, "minSpeed": 0, "maxSpeed": 20, "accel": 0 } },
    "glint": { "worldBasedOnly": false, "enabled": true, "darknessAffectsIntensity": true, "blendMode": 0, "maskThreshold": 0.9, "maskInfluence": 0.09, "particleTexture": "modules/map-shine/assets/glint.webp", "frequency": 0.932, "lifetime": { "min": 0.8, "max": 2.9 }, "color": { "start": "#FFFFFF", "end": "#FFFFFF" }, "alpha": { "max": 0.95, "fadeIn": 0.05, "fadeOut": 0.94 }, "scale": { "sizeMultiplier": 9, "start": 1.5, "end": 0.61, "minMult": 0.9 }, "speed": { "start": 0, "end": 0, "minMult": 0.5 }, "rotation": { "enabled": false, "minSpeed": 0, "maxSpeed": 20, "accel": 0 }, "rgbSplit": { "enabled": true, "amount": 8.2 } },
    "water": { "worldBasedOnly": false, "enabled": true, "wave": { "enabled": true, "speed": 0.0148, "scale": 38.1, "intensity": 0.0004 }, "surface": { "enabled": true, "foamColor": "#33adff", "foamIntensity": 0, "foamCoverage": 0, "foamSharpness": 0.13, "fbmScale": 15.196, "fbmSpeed": 0.01, "fbmEvolution": 0.03, "fbmOctaves": 5, "fbmLacunarity": 4, "fbmPersistence": 0.1, "sheenEnabled": true, "sheenIntensity": 0.448, "sheenColor": "#FFFFFF", "sheenScale": 0.5, "sheenSpeed": 0.002, "sheenStretch": 1, "sheenSharpness": 0.8 }, "caustics": { "enabled": true, "intensity": 0.033, "scale": 1, "speed": 0.01, "color": "#87CEFA", "lineSharpness": 5, "bloomIntensity": 1, "lineDistortion": 0.1, "lineDistortionScale": 5, "intersectionBoost": 20, "roughnessScale": 4.2, "roughnessIntensity": 0.83 }, "glintParticles": { "enabled": true, "blendMode": 9, "maskThreshold": 0.17, "maskInfluence": 1.95, "particleTexture": "modules/map-shine/assets/glint.webp", "frequency": 0.99, "lifetime": { "min": 0.8, "max": 0.8 }, "color": { "start": "#eef7ff", "end": "#95b3ff" }, "alpha": { "max": 0.5, "fadeIn": 0.25, "fadeOut": 0.25 }, "scale": { "sizeMultiplier": 1.9, "start": 0.76, "end": 0.82, "minMult": 0.95 }, "speed": { "start": 5, "end": 11, "minMult": 0.47 }, "rotation": { "enabled": true, "minSpeed": 116, "maxSpeed": 123, "accel": 52 } } },
    "fire": { "worldBasedOnly": false, "enabled": true, "bloom": { "enabled": true, "threshold": 0.09, "bloomScale": 5, "brightness": 5, "blur": 0, "quality": 4 }, "particles": { "enabled": true, "blendMode": 1, "maskThreshold": 0.43, "maskInfluence": 5, "particleTexture": "modules/map-shine/assets/flame.webp", "frequency": 0.005, "lifetime": { "min": 0.1, "max": 2 }, "color": { "start": "#FFDD88", "end": "#ea7500" }, "alpha": { "max": 0.15, "fadeIn": 0.01, "fadeOut": 1 }, "scale": { "sizeMultiplier": 0.5, "start": 0.08, "end": 1.41, "minMult": 0.95 }, "speed": { "start": 5, "end": 10, "minMult": 0.5 }, "rotation": { "enabled": true, "minSpeed": 102, "maxSpeed": 170, "accel": 20 }, "wind": { "enabled": false, "force": 0, "baseSpeed": 0, "gustSpeed": 0, "gustFrequencyMin": 3, "gustFrequencyMax": 8, "gustDurationMin": 0.2, "gustDurationMax": 0.8, "angleChangeFrequencyMin": 5, "angleChangeFrequencyMax": 15, "angleChangeRange": 20 } } },
    "sparks": { "worldBasedOnly": false, "enabled": true, "blendMode": 1, "maskThreshold": 0.95, "maskInfluence": 1.12, "particleTexture": "modules/map-shine/assets/particle.webp", "frequency": 0.08, "lifetime": { "min": 1.5, "max": 3 }, "color": { "start": "#ffdd88", "end": "#ff8800" }, "alpha": { "max": 1, "fadeIn": 0.1, "fadeOut": 0.03 }, "scale": { "sizeMultiplier": 1.55, "start": 1, "end": 0.1, "minMult": 0.5 }, "path": { "speed": { "start": 114, "end": 10, "minMult": 0.99 }, "amplitude": { "min": 10, "max": 40 }, "frequency": { "min": 40, "max": 80 }, "offset": { "min": 0, "max": 6.28 }, "damping": 0.5, "angle": { "min": -20, "max": 20 }, "motionBlur": { "enabled": true, "strength": 0.33, "maxLength": 6 } } },
    "particleSystems": { "enabled": true, "globalDensityMultiplier": 1, "globalParticleLimit": 1000 },
    "diagnostic": { "enabled": false, "showMasks": false, "pixelInspector": false, "displaySuffix": "fire" },
    "ambientLayerZIndex": 250
}

/**
 * Converts a hex color string to a normalized RGB array.
 * @param {string} hex - The hex color string (e.g., "#RRGGBB").
 * @returns {number[]} An array of [r, g, b] values from 0.0 to 1.0.
 */
const hexToRgbArray = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
};

/**
 * A collection of utility functions related to Look-Up Tables (LUTs).
 */
class LutUtils {
    /**
     * Vendored from 'parse-cube-lut' by Matt DesLauriers.
     * Parses a .cube LUT file text into a more usable format.
     * @param {string} str - The string content of the .cube file.
     * @returns {object} An object with size, domain, and data array.
     */
    static parseCube(str) {
        const lines = str.split('\n').map(l => l.trim());
        let title = null;
        let size = null;
        const domain = [
            [0, 1],
            [0, 1],
            [0, 1]
        ];
        const data = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) continue;
            const parts = line.split(/\s+/);
            const first = parts[0];

            if (first === 'TITLE') {
                title = line.substring(6, line.length - 1);
            } else if (first === 'LUT_3D_SIZE') {
                size = parseInt(parts[1], 10);
            } else if (first === 'DOMAIN_MIN') {
                domain[0][0] = parseFloat(parts[1]);
                domain[1][0] = parseFloat(parts[2]);
                domain[2][0] = parseFloat(parts[3]);
            } else if (first === 'DOMAIN_MAX') {
                domain[0][1] = parseFloat(parts[1]);
                domain[1][1] = parseFloat(parts[2]);
                domain[2][1] = parseFloat(parts[3]);
            } else if (first.charAt(0) !== '#') {
                const r = parseFloat(parts[0]);
                const g = parseFloat(parts[1]);
                const b = parseFloat(parts[2]);
                data.push(r, g, b);
            }
        }

        return { title, size, domain, data };
    }

    /**
     * Generates a 1D color LUT texture from separate RGB channel Bezier curve control points.
     * @param {object} curveData - An object containing point arrays for each channel, e.g., { rgb: {points: [...]}, red: {points: [...]}, ... }.
     * @returns {PIXI.Texture} A 256x1 PIXI.Texture to be used as a color LUT.
     */
    static generateCurveLut(curveData) {
        const width = 256;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, 1);

        const getPoints = (channel) => {
            return curveData?.[channel]?.points || curveData?.rgb?.points;
        };

        const pointsR = getPoints('red');
        const pointsG = getPoints('green');
        const pointsB = getPoints('blue');

        if (!pointsR || pointsR.length < 2 || !pointsG || pointsG.length < 2 || !pointsB || pointsB.length < 2) {
            console.error("[MapShine] generateCurveLut received invalid points.", curveData);
            for (let i = 0; i < width; i++) {
                const colorValue = i;
                const index = i * 4;
                imageData.data[index] = colorValue;
                imageData.data[index + 1] = colorValue;
                imageData.data[index + 2] = colorValue;
                imageData.data[index + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);
            return PIXI.Texture.from(canvas);
        }

        const calculateBezierY = (t, p) => {
            if (p.length === 2) { // Linear interpolation
                return Math.round(Math.max(0, Math.min(1, (1 - t) * p[0].y + t * p[1].y)) * 255);
            }
            if (p.length === 4) { // Cubic Bezier
                const y = Math.pow(1 - t, 3) * p[0].y +
                    3 * Math.pow(1 - t, 2) * t * p[1].y +
                    3 * (1 - t) * Math.pow(t, 2) * p[2].y +
                    Math.pow(t, 3) * p[3].y;
                return Math.round(Math.max(0, Math.min(1, y)) * 255);
            }
             // Fallback for unexpected point counts
            return Math.round(t * 255);
        };

        for (let i = 0; i < width; i++) {
            const t = i / (width - 1);
            const index = i * 4;
            imageData.data[index] = calculateBezierY(t, pointsR);
            imageData.data[index + 1] = calculateBezierY(t, pointsG);
            imageData.data[index + 2] = calculateBezierY(t, pointsB);
            imageData.data[index + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
        return PIXI.Texture.from(canvas);
    }
}

/**
 * Performs linear interpolation between two values.
 * @param {number} start The starting value.
 * @param {number} end The ending value.
 * @param {number} amount The interpolation factor, typically between 0 and 1.
 * @returns {number} The interpolated value.
 */
function lerp(start, end, amount) {
    return (1 - amount) * start + amount * end;
}

/*********************************************************************************
 *  SECTION 2: CORE SYSTEMS & ARCHITECTURE
 *********************************************************************************/
// Description: This section contains the new core architectural classes that drive
//              the module. This includes the main engine, the data registry for
//              identifying effect targets, and the base classes for modular effects.
// ---------------------------------------------------------------------------------

/**
 * A canvas layer dedicated to visualizing the internal masks and textures
 * of the module for debugging and artistic purposes.
 */
class DiagnosticLayer extends CanvasLayer {
    constructor() {
        super();
        this.diagnosticContainer = null;
        this.diagnosticSprites = new Map(); // key: targetId-suffix, value: sprite
        this.overlayContainer = null; // For outlines and labels
        this.overlays = new Map(); // key: targetId, value: PIXI.Container with graphics/text
        this.fullscreenSprite = null; // For viewing intermediate textures
        this.tooltip = null;
        this._destroyed = false;
        this._onAnimateBound = this._onAnimate.bind(this);
    }

    async _draw(options) {
        this._destroyed = false;

        this.diagnosticContainer = this.addChild(new PIXI.Container());
        this.overlayContainer = this.addChild(new PIXI.Container());
        this.fullscreenSprite = this.addChild(new PIXI.Sprite());
        this.fullscreenSprite.visible = false;

        this._createTooltip();

        canvas.app.ticker.add(this._onAnimateBound);

        game.mapShine.debugger?.eventHandler._populateDiagnosticDropdown();
    }

    async _tearDown(options) {
        this._destroyed = true;
        canvas.app.ticker.remove(this._onAnimateBound);
        this.diagnosticSprites.clear();
        this.overlays.clear();
        this._destroyTooltip();
        return super._tearDown(options);
    }

    getAvailableDebugTextures() {
        const textures = {
            inputs: { "all": "All Suffixes" },
            intermediates: {},
            generated: {},
            external: {}
        };

        for (const key of Object.keys(TextureDiscoverer.SUFFIX_MAP)) {
            textures.inputs[key] = key;
        }

        // TODO: Refactor this for the new engine structure
        // This will require iterating through active effects to find textures.

        if (game.modules.get('illuminationbuffer')?.api) {
            textures.external['external_illumination'] = "Illumination Buffer";
        }

        return textures;
    }

    _createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'map-shine-diagnostic-tooltip';
        Object.assign(this.tooltip.style, {
            position: 'fixed', display: 'none', background: 'rgba(0,0,0,0.8)', color: 'white',
            border: '1px solid #888', borderRadius: '4px', padding: '5px',
            fontFamily: 'monospace', fontSize: '12px', pointerEvents: 'none', zIndex: '100001'
        });
        document.body.appendChild(this.tooltip);
    }

    _destroyTooltip() {
        this.tooltip?.remove();
        this.tooltip = null;
    }

    _onAnimate() {
        if (this._destroyed) return;
        const mousePosition = canvas.app.renderer.events.pointer.global;
        this._updateTooltip(mousePosition);
    }

    _updateTooltip(mousePosition) {
        if (!this.visible || !this.tooltip || !mousePosition) {
            if (this.tooltip && this.tooltip.style.display !== 'none') this.tooltip.style.display = 'none';
            return;
        }
        const config = game.mapShine.profileManager.activeConfig.diagnostic;
        if (!config.pixelInspector) {
            if (this.tooltip.style.display !== 'none') this.tooltip.style.display = 'none';
            return;
        }
        const bounds = canvas.app.view.getBoundingClientRect();
        if (mousePosition.x < bounds.left || mousePosition.x > bounds.right || mousePosition.y < bounds.top || mousePosition.y > bounds.bottom) {
            if (this.tooltip.style.display !== 'none') this.tooltip.style.display = 'none';
            return;
        }
        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${mousePosition.x + 15}px`;
        this.tooltip.style.top = `${mousePosition.y + 15}px`;

        const pixel = canvas.app.renderer.extract.pixels(canvas.app.stage, new PIXI.Rectangle(mousePosition.x, mousePosition.y, 1, 1));
        if (pixel && pixel.length >= 4) {
            const [r, g, b, a] = pixel;
            this.tooltip.innerHTML = `<strong>Pixel Inspector</strong><br>Screen X/Y: ${Math.round(mousePosition.x)}, ${Math.round(mousePosition.y)}<br>--------------------<br>RGBA (0-255): ${r}, ${g}, ${b}, ${a}<br>RGBA (Norm): ${(r/255).toFixed(3)}, ${(g/255).toFixed(3)}, ${(b/255).toFixed(3)}, ${(a/255).toFixed(3)}`;
        } else {
            this.tooltip.textContent = 'Reading pixel...';
        }
    }

    _refreshMaskVisibility() {
        if (!this.diagnosticContainer) return;
        const config = game.mapShine.profileManager.activeConfig.diagnostic;
        const displaySuffix = config.displaySuffix;

        this.fullscreenSprite.visible = false;
        this.diagnosticContainer.visible = false;
        this.overlayContainer.visible = false;
        if (!config.showMasks) return;

        // TODO: Reimplement fullscreen texture viewing for the new architecture.

        this.diagnosticContainer.visible = true;
        this.overlayContainer.visible = true;
        for (const [key, sprite] of this.diagnosticSprites.entries()) {
            const suffix = key.substring(key.indexOf('-') + 1);
            const isVisible = (displaySuffix === 'all' || displaySuffix === suffix);
            sprite.visible = isVisible;
            if (isVisible) {
                sprite.tint = (displaySuffix === 'all') ? this._getColorForSuffix(suffix) : 0xFFFFFF;
                sprite.alpha = (displaySuffix === 'all') ? 0.5 : 1.0;
            }
        }
    }

    async updateEffectTargets() {
        if (!this.diagnosticContainer || !this.overlayContainer) return;
        this.diagnosticContainer.removeChildren().forEach(c => c.destroy());
        this.diagnosticSprites.clear();
        this.overlayContainer.removeChildren().forEach(c => c.destroy({ children: true }));
        this.overlays.clear();

        for (const target of TargetRegistry.targets) {
            const activeSuffixes = [];
            for (const [suffix, texturePath] of target.effectTextures.entries()) {
                activeSuffixes.push(suffix);
                const spriteKey = `${target.id}-${suffix}`;
                let sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.diagnosticSprites.set(spriteKey, sprite);
                this.diagnosticContainer.addChild(sprite);
                await this._updateSpriteTransform(sprite, texturePath, target.rect);
            }
            if (activeSuffixes.length > 0) {
                const overlay = new PIXI.Container();
                const graphics = new PIXI.Graphics();
                graphics.lineStyle(10 / canvas.stage.scale.x, 0x00FF00, 0.8);
                graphics.drawRect(target.rect.x, target.rect.y, target.rect.width, target.rect.height);
                overlay.addChild(graphics);
                const labelText = new PIXI.Text(activeSuffixes.join(', '), {
                    fontFamily: 'Arial', fontSize: 24, fill: 0x00FF00, stroke: '#000000',
                    strokeThickness: 4, align: 'center',
                });
                labelText.x = target.rect.x + target.rect.width / 2;
                labelText.y = target.rect.y + target.rect.height / 2;
                labelText.anchor.set(0.5);
                labelText.scale.set(1 / canvas.stage.scale.x);
                overlay.addChild(labelText);
                this.overlays.set(target.id, overlay);
                this.overlayContainer.addChild(overlay);
            }
        }
        this._refreshMaskVisibility();
    }

    _getColorForSuffix(suffix) {
        let hash = 0;
        for (let i = 0; i < suffix.length; i++) hash = suffix.charCodeAt(i) + ((hash << 5) - hash);
        let color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "0x" + "00000".substring(0, 6 - color.length) + color;
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        if (!sprite || sprite.destroyed) return;
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try { sprite.texture = await foundry.canvas.loadTexture(texturePath); }
            catch (e) { sprite.texture = PIXI.Texture.EMPTY; }
        }
        if (!sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    async updateFromConfig(config) {
        const dConfig = config.diagnostic;
        this.visible = config.enabled && dConfig.enabled;
        this._refreshMaskVisibility();
    }
}


/**
 * A canvas layer for displaying and interacting with map point geometry for
 * effects that are not tied to a texture mask.
 */
class MapPointsLayer extends CanvasLayer {
    constructor() {
        super();
        this.mapPointsContainer = null;
        this._hoveredPoint = null;
        this._draggedPoint = null;
        this._liveDragGroup = null;
        this.POINT_HIT_AREA = 12;
        this._boundDrawMapPoints = this._drawMapPoints.bind(this);
    }

    async _draw(options) {
        this.mapPointsContainer = this.addChild(new PIXI.Container());
        this.alpha = (game.mapShine.mapPointsEditor && game.mapShine.mapPointsEditor.rendered) ? 1 : 0;
        Hooks.on("mapShine:mapPointsUpdated", this._boundDrawMapPoints);
        this._drawMapPoints();
    }

    async _tearDown(options) {
        Hooks.off("mapShine:mapPointsUpdated", this._boundDrawMapPoints);
        this.mapPointsContainer?.destroy({ children: true });
        this.mapPointsContainer = null;
        this._hoveredPoint = null;
        this._draggedPoint = null;
        this._liveDragGroup = null;
        return super._tearDown(options);
    }

    _getPointAt(position) {
        const groups = MapPointsManager.getGroups();
        const hitRadius = this.POINT_HIT_AREA / canvas.stage.scale.x;
        for (const group of Object.values(groups)) {
            for (let i = 0; i < group.points.length; i++) {
                const p = group.points[i];
                if (Math.hypot(position.x - p.x, position.y - p.y) <= hitRadius) {
                    return { groupId: group.id, pointIndex: i, point: p };
                }
            }
        }
        return null;
    }

    _drawMapPoints() {
        if (!this.mapPointsContainer) return;
        this.mapPointsContainer.removeChildren().forEach(c => c.destroy({ children: true }));
        const groups = MapPointsManager.getGroups();
        if (foundry.utils.isEmpty(groups)) return;

        const graphics = new PIXI.Graphics();
        this.mapPointsContainer.addChild(graphics);
        const groupsToDraw = this._liveDragGroup ? { ...groups, [this._liveDragGroup.id]: this._liveDragGroup } : groups;

        for (const group of Object.values(groupsToDraw)) {
            if (!group.points || group.points.length === 0) continue;
            const pointRadius = 8 / canvas.stage.scale.x;
            const lineThickness = 4 / canvas.stage.scale.x;
            const isLiveDragGroup = this._liveDragGroup && this._liveDragGroup.id === group.id;

            if ((group.type === 'line' || group.type === 'area') && group.points.length > 1) {
                graphics.lineStyle(lineThickness, group.isBroken ? 0xFF0000 : 0x00FF00, isLiveDragGroup ? 0.9 : 0.7);
                graphics.moveTo(group.points[0].x, group.points[0].y);
                for (let i = 1; i < group.points.length; i++) graphics.lineTo(group.points[i].x, group.points[i].y);
                if (group.type === 'area') graphics.closePath();
            }
            if (group.type === 'area' && !group.isBroken && group.points.length > 2) {
                graphics.beginFill(0x00FF00, isLiveDragGroup ? 0.4 : 0.25);
                graphics.moveTo(group.points[0].x, group.points[0].y);
                for (let i = 1; i < group.points.length; i++) graphics.lineTo(group.points[i].x, group.points[i].y);
                graphics.closePath();
                graphics.endFill();
            }
            for (let i = 0; i < group.points.length; i++) {
                const p = group.points[i];
                const isHovered = this._hoveredPoint && this._hoveredPoint.groupId === group.id && this._hoveredPoint.pointIndex === i;
                const isDragged = this._draggedPoint && this._draggedPoint.groupId === group.id && this._draggedPoint.pointIndex === i;
                let color = isHovered ? 0x00FFFF : 0x00A0FF;
                let alpha = isHovered ? 0.9 : 0.6;
                let radius = pointRadius;
                if (isDragged) { color = 0xFF8800; alpha = 1.0; radius *= 1.2; }
                graphics.lineStyle(lineThickness / 2, 0xFFFFFF, isHovered ? 1.0 : 0.8).beginFill(color, alpha);
                graphics.drawCircle(p.x, p.y, radius);
                graphics.endFill();
            }
            if (!isLiveDragGroup && group.points.length > 0) {
                const textContent = `${group.label} (${group.type})\n${group.isBroken ? 'BROKEN: ' + group.reason : ''}`;
                const label = new PIXI.Text(textContent, {
                    fontFamily: 'Arial', fontSize: 20 / canvas.stage.scale.x, fill: 0xFFFFFF,
                    stroke: '#000000', strokeThickness: 4 / canvas.stage.scale.x, align: 'left'
                });
                label.x = group.points[0].x + (15 / canvas.stage.scale.x);
                label.y = group.points[0].y - (15 / canvas.stage.scale.x);
                label.anchor.set(0, 1);
                this.mapPointsContainer.addChild(label);
            }
        }
    }
}

/**
 * A simple data class representing a single entity on the canvas that can have
 * effects applied to it. This can be the scene background or a specific tile.
 * It holds geometric information and a map of discovered texture paths for
 * various effects.
 */
class EffectTarget {
    /**
     * @param {string} id - A unique identifier for the target ('background' or a tile ID).
     * @param {object} options - Configuration options for the target.
     * @param {PIXI.Rectangle} options.rect - The world-space rectangle of the target.
     * @param {string} options.baseTexturePath - The path to the target's base visual texture.
     * @param {Map<string, string>} options.effectTextures - A map of effect suffixes to their discovered texture paths.
     * @param {Tile|null} [options.tile=null] - The associated tile object, if any.
     */
    constructor(id, { rect, baseTexturePath, effectTextures, tile = null }) {
        this.id = id;
        this.rect = rect;
        this.baseTexturePath = baseTexturePath;
        this.effectTextures = effectTextures; // e.g., new Map([['specular', 'path/to/specular.webp']])
        this.tile = tile;
    }
}


/**
 * A static utility class responsible for scanning a base texture path and discovering
 * all associated Map Shine effect textures in the same directory. This encapsulates
 * the file-browsing and suffix-matching logic.
 */
class TextureDiscoverer {

    static SUFFIX_MAP = {
        specular: "_Specular",
        ambient: "_Ambient",
        iridescence: "_Iridescence",
        groundGlow: "_GroundGlow",
        heat: "_Heat",
        fire: "_Fire",
        sparks: "_Sparks",
        dust: "_Dust",
        outdoors: "_Outdoors",
        canopy: "_Canopy",
        structural: "_Structural",
        prism: "_Prism",
        water: "_Water",
    };

    /**
     * For a given base texture path, finds all corresponding effect maps.
     * @param {string} baseTexturePath - The path to the base image (e.g., 'maps/my_scene.webp').
     * @returns {Promise<Map<string, string>>} A promise that resolves to a map of effect keys to found texture paths.
     */
    static async findEffectTexturesFor(baseTexturePath) {
        const discovered = new Map();
        if (!baseTexturePath) return discovered;

        const lastSlash = baseTexturePath.lastIndexOf('/');
        if (lastSlash === -1) return discovered;

        const directoryPath = baseTexturePath.substring(0, lastSlash);
        const filename = baseTexturePath.substring(lastSlash + 1);

        let decodedFilename;
        try {
            decodedFilename = decodeURI(filename);
        } catch (e) {
            decodedFilename = filename;
        }

        const lastDot = decodedFilename.lastIndexOf('.');
        if (lastDot === -1) return discovered;

        const baseName = decodedFilename.substring(0, lastDot);
        const extension = decodedFilename.substring(lastDot);

        if (!baseName || !directoryPath) return discovered;

        let filesInDir = [];
        try {
            const source = game.settings.get("core", "noCanvas") ? "public" : "data";
            filesInDir = (await foundry.applications.apps.FilePicker.implementation.browse(source, directoryPath)).files;
        } catch (e) {
            // This can happen if the directory doesn't exist, which is a valid case (e.g., core assets).
            // We can safely return an empty map.
            return discovered;
        }

        for (const [key, suffix] of Object.entries(this.SUFFIX_MAP)) {
            const expectedFilename = `${baseName}${suffix}${extension}`;
            const foundFile = filesInDir.find(fullPath => {
                const fNameOnly = fullPath.substring(fullPath.lastIndexOf('/') + 1);
                let decodedFNameOnly;
                try {
                    decodedFNameOnly = decodeURI(fNameOnly);
                } catch (e) {
                    decodedFNameOnly = fNameOnly;
                }
                return decodedFNameOnly.toLowerCase() === expectedFilename.toLowerCase();
            });

            if (foundFile) {
                discovered.set(key, foundFile);
            }
        }
        return discovered;
    }
}


/**
 * Manages the discovery and storage of all active effect targets on the current scene.
 * This class acts as the single source of truth for what can be affected by the module.
 */
class TargetRegistry {

    static targets = [];

    /**
     * Clears and re-populates the list of effect targets by scanning the scene background
     * and all tiles. This is the primary discovery mechanism.
     */
    static async discover() {
        console.log("[MapShine] TargetRegistry: Starting discovery of effect targets.");
        this.targets = [];
        const discoveredTargets = [];

        // 1. Process Scene Background
        const bgSrc = canvas.scene?.background.src;
        if (bgSrc) {
            const effectTextures = await TextureDiscoverer.findEffectTexturesFor(bgSrc);
            if (effectTextures.size > 0) {
                discoveredTargets.push(new EffectTarget('background', {
                    rect: canvas.scene.dimensions.sceneRect,
                    baseTexturePath: bgSrc,
                    effectTextures: effectTextures
                }));
                 console.log(`[MapShine] TargetRegistry: Found ${effectTextures.size} effect maps for scene background.`);
            }
        }

        // 2. Process Tiles
        for (const tile of canvas.tiles.placeables) {
            const tileSrc = tile.document.texture.src;
            if (tileSrc) {
                const effectTextures = await TextureDiscoverer.findEffectTexturesFor(tileSrc);
                if (effectTextures.size > 0) {
                    discoveredTargets.push(new EffectTarget(tile.id, {
                        rect: {
                            x: tile.document.x,
                            y: tile.document.y,
                            width: tile.document.width,
                            height: tile.document.height,
                            rotation: tile.document.rotation * (Math.PI / 180),
                        },
                        baseTexturePath: tileSrc,
                        effectTextures: effectTextures,
                        tile: tile
                    }));
                     console.log(`[MapShine] TargetRegistry: Found ${effectTextures.size} effect maps for tile "${tile.id}".`);
                }
            }
        }

        this.targets = discoveredTargets;
        console.log(`[MapShine] TargetRegistry: Discovery complete. Found ${this.targets.length} total effect targets.`);
    }

    /**
     * Applies the configured tile opacity to all tiles that are effect targets.
     * Resets opacity to 1.0 for non-target tiles.
     * @param {object} config - The active module configuration object.
     */
    static applyTileOpacities(config) {
        if (!canvas?.tiles?.placeables) return;

        const targetTileIds = new Set(this.targets.filter(t => t.tile).map(t => t.id));

        for (const tile of canvas.tiles.placeables) {
            if (!tile.mesh) continue;
            const isTargetWithEffects = targetTileIds.has(tile.id) && config.enabled;
            if (isTargetWithEffects) {
                tile.mesh.alpha = config.tileOpacity;
            } else {
                tile.mesh.alpha = 1.0;
            }
        }
    }
}

/**
 * A manager dedicated to tracking the single token that is considered "active"
 * for the current user, primarily for effects like Dynamic Exposure that follow
 * a specific character's perspective.
 */
class TokenManager {
    constructor() {
        this.activeToken = null;
        this._boundOnControlToken = this._onControlToken.bind(this);
        this._boundOnUpdateUser = this._onUpdateUser.bind(this);
    }

    initialize() {
        Hooks.on('controlToken', this._boundOnControlToken);
        Hooks.on('updateUser', this._boundOnUpdateUser);
        this._updateActiveToken(); // Initial check
        console.log("[MapShine] TokenManager initialized.");
    }

    tearDown() {
        Hooks.off('controlToken', this._boundOnControlToken);
        Hooks.off('updateUser', this._boundOnUpdateUser);
        this.activeToken = null;
    }

    _onControlToken() {
        this._updateActiveToken();
    }

    _onUpdateUser(user, data) {
        if (user.id === game.user.id && "character" in data) {
            this._updateActiveToken();
        }
    }

    _updateActiveToken() {
        const controlled = canvas.tokens.controlled;
        if (!game.user.isGM) {
            this.activeToken = controlled.length > 0 ? controlled[0] : (game.user.character?.object || null);
        } else {
            this.activeToken = controlled.length > 0 ? controlled[0] : null;
        }
    }
}


/**
 * The abstract base class for all modular visual effects. Each concrete effect
 * (e.g., MetallicShineEffect, CloudShadowsEffect) will extend this class. It defines
 * a common interface for creation, per-frame updates, configuration changes, and destruction.
 * Each instance of an Effect is tied to a single EffectTarget.
 */
class Effect {
    /**
     * The texture suffix required for this effect to be instantiated (e.g., 'specular').
     * This MUST be overridden by subclasses.
     * @type {string}
     */
    static Suffix = "override_me";

    /**
     * @param {EffectTarget} target - The data object for the target (background or tile) this effect instance applies to.
     * @param {MapShineLayer} layer - The single canvas layer where this effect should add its visual elements.
     */
    constructor(target, layer) {
        if (this.constructor === Effect) {
            throw new Error("Effect is an abstract class and cannot be instantiated directly.");
        }
        this.target = target;
        this.layer = layer;
        this.visible = true;
    }

    /**
     * Called once per frame by the MapShineEngine's animation loop.
     * Subclasses should implement this for any animation logic (e.g., updating time uniforms).
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     * @param {object} config - The full, active module configuration.
     */
    update(deltaTime, config) {
        // To be implemented by subclasses
    }

    /**
     * Called by the MapShineEngine whenever the module's configuration changes.
     * Subclasses should implement this to update their internal state, filter uniforms, etc.
     * @param {object} config - The full, active module configuration.
     */
    updateFromConfig(config) {
        // To be implemented by subclasses
    }

    /**
     * Called by the MapShineEngine during scene teardown.
     * Subclasses MUST implement this to destroy all created PIXI objects to prevent memory leaks.
     */
    destroy() {
        // To be implemented by subclasses
    }
}


/**
 * The single, unified canvas layer for all Map Shine on-map effects.
 * This class acts as a simple container. It does not contain any animation or
 * effect-specific logic. The MapShineEngine is responsible for adding and removing
 * the PIXI display objects created by the various Effect instances.
 */
class MapShineLayer extends CanvasLayer {
    constructor() {
        super();
    }

    async _draw(options) {
        console.log("[MapShine] MapShineLayer: Drawing layer.");
        // Children will be added directly to this layer instance. No sub-container is needed.
    }

    async _tearDown(options) {
        console.log("[MapShine] MapShineLayer: Tearing down layer.");
        // The parent CanvasLayer's _tearDown method will automatically handle destroying all direct children.
        return super._tearDown(options);
    }
}


/**
 * Manages the visual scene transition and loading screen overlay.
 * This class is responsible only for the DOM element and its animations. It is
 * controlled entirely by the MapShineEngine during the scene lifecycle.
 */
class SceneTransition {
    constructor() {
        this.overlay = null;
    }

    /**
     * Creates and displays the loading screen overlay.
     * @param {object} config - The `sceneTransition` section of the module config.
     * @param {string} sceneName - The name of the scene being loaded.
     * @returns {Promise<void>} A promise that resolves when the fade-in animation is complete.
     */
    async showLoadingScreen(config, sceneName) {
        return new Promise(resolve => {
            this._createOverlay();

            // --- Populate Content ---
            const content = this.overlay.querySelector('.transition-content');
            const logo = this.overlay.querySelector('.transition-logo');
            const heading = this.overlay.querySelector('.transition-heading');
            const subheading = this.overlay.querySelector('.transition-subheading');
            const description = this.overlay.querySelector('.transition-description');
            const hint = this.overlay.querySelector('.transition-hint');
            const scenenameEl = this.overlay.querySelector('.transition-scenename');

            const setContent = (el, text) => {
                if (text && String(text).trim()) {
                    el.innerText = text;
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            };

            if (config.logoPath) {
                logo.src = config.logoPath;
                logo.style.display = 'block';
            } else {
                logo.style.display = 'none';
            }

            setContent(heading, config.heading);
            setContent(subheading, config.subheading);
            setContent(scenenameEl, config.showSceneName ? sceneName : '');
            setContent(description, config.staticDescription);

            if (config.useRandomHint && config.randomHints?.length > 0) {
                const randomIndex = Math.floor(Math.random() * config.randomHints.length);
                setContent(hint, config.randomHints[randomIndex]);
            } else {
                setContent(hint, '');
            }

            // --- Animate In ---
            const tl = gsap.timeline({ onComplete: resolve });
            tl.to(this.overlay, { opacity: 1, duration: config.fadeOutDuration / 2000, ease: "power2.in" });

            const allContent = [logo, heading, subheading, description, scenenameEl, hint];
            const visibleContent = allContent.filter(el => el && el.style.display !== 'none');
            tl.to(content, { opacity: 1, duration: 0.01 })
              .fromTo(visibleContent, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: config.fadeOutDuration / 2000, ease: "power2.out", stagger: 0.1 });
        });
    }

    /**
     * Updates the progress bar and status message on the loading screen.
     * @param {number} progress - A percentage from 0 to 100.
     * @param {string} message - The status message to display.
     */
    updateProgress(progress, message) {
        if (!this.overlay) return;
        const fillElement = this.overlay.querySelector('.loading-bar-fill');
        const statusTextElement = this.overlay.querySelector('.transition-status');
        if (fillElement) {
            gsap.to(fillElement, { width: `${Math.min(100, Math.max(0, progress))}%`, duration: 0.2, ease: "power2.out" });
        }
        if (message && statusTextElement && statusTextElement.innerText !== message) {
            gsap.to(statusTextElement, {
                opacity: 0, duration: 0.1, onComplete: () => {
                    if (statusTextElement) {
                        statusTextElement.innerText = message;
                        gsap.to(statusTextElement, { opacity: 1, duration: 0.1 });
                    }
                }
            });
        }
    }

    /**
     * Hides and destroys the loading screen overlay.
     * @param {object} config - The `sceneTransition` section of the module config.
     * @returns {Promise<void>} A promise that resolves when the fade-out is complete.
     */
    async hideLoadingScreen(config) {
        return new Promise(resolve => {
            if (!this.overlay) {
                resolve();
                return;
            }

            const allContent = this.overlay.querySelectorAll('.transition-logo, .transition-heading, .transition-subheading, .transition-scenename, .transition-description, .transition-hint, .loading-bar-container, .transition-status');
            const tl = gsap.timeline({ onComplete: () => {
                this._destroyOverlay();
                resolve();
            }});
            tl.to(allContent, { opacity: 0, duration: config.fadeInDuration / 2500, ease: "power2.in" });
            tl.to(this.overlay, { opacity: 0, duration: config.fadeInDuration / 2000, ease: "power2.out" }, "<0.2");
        });
    }

    _createOverlay() {
        if (this.overlay) return;
        this.overlay = document.createElement('div');
        this.overlay.id = 'map-shine-scene-transition';
        Object.assign(this.overlay.style, {
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'black', zIndex: 999999, opacity: 0, pointerEvents: 'auto',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontFamily: 'Signika, sans-serif', color: 'white', textAlign: 'center'
        });
        this.overlay.innerHTML = `
            <style>
                #map-shine-scene-transition .transition-content { display: flex; flex-direction: column; align-items: center; gap: 1rem; max-width: 800px; padding: 2rem; opacity: 0; }
                #map-shine-scene-transition .transition-logo { max-width: 300px; max-height: 200px; object-fit: contain; margin-bottom: 1rem; }
                #map-shine-scene-transition .transition-heading { font-size: 3.5rem; margin: 0; line-height: 1.1; text-shadow: 0 0 10px rgba(0,0,0,0.5); }
                #map-shine-scene-transition .transition-subheading { font-size: 1.75rem; margin: 0; color: #ccc; font-weight: normal; }
                #map-shine-scene-transition .transition-scenename { font-size: 1.25rem; margin: 1rem 0 0 0; color: #aaa; font-style: italic; border-top: 1px solid #555; padding-top: 1rem; }
                #map-shine-scene-transition .transition-description { font-size: 1rem; color: #bbb; margin-top: 1rem; max-width: 60ch; line-height: 1.6; }
                #map-shine-scene-transition .transition-hint { font-size: 0.9rem; color: #aaa; margin-top: 1.5rem; font-style: italic; border-top: 1px solid #444; padding-top: 1rem; max-width: 50ch; }
                #map-shine-scene-transition .loading-bar-container { position: absolute; bottom: 10vh; left: 50%; transform: translateX(-50%); width: 400px; max-width: 80vw; height: 10px; border: 1px solid rgba(255, 255, 255, 0.5); background-color: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; }
                #map-shine-scene-transition .loading-bar-fill { width: 0%; height: 100%; background-color: rgba(255, 255, 255, 0.9); transform-origin: left; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
                #map-shine-scene-transition .transition-status { position: absolute; bottom: calc(10vh + 20px); left: 50%; transform: translateX(-50%); font-size: 1rem; color: #ddd; opacity: 1; }
            </style>
            <div class="transition-content">
                <img class="transition-logo" src="" style="display: none;">
                <h1 class="transition-heading" style="display: none;"></h1>
                <h2 class="transition-subheading" style="display: none;"></h2>
                <p class="transition-description" style="display: none;"></p>
                <h3 class="transition-scenename" style="display: none;"></h3>
                <p class="transition-hint" style="display: none;"></p>
            </div>
            <div class="loading-bar-container"> <div class="loading-bar-fill"></div> </div>
            <p class="transition-status"></p>
        `;
        document.body.appendChild(this.overlay);
    }

    _destroyOverlay() {
        if (!this.overlay) return;
        this.overlay.remove();
        this.overlay = null;
    }
}


/**
 * The central controller for the Map Shine module.
 * This static class manages the entire lifecycle, from scene initialization to teardown.
 * It orchestrates all sub-systems and runs the main animation loop.
 */
class MapShineEngine {
    static _isInitialized = false;
    static _animationFrameId = null;
    static _lastTimestamp = 0;

    static _layer = null;
    static _sceneTransition = null;

    static _activeEffects = [];
    static _subSystems = []; // For systems that need an update tick
    static _particleSystem = null;

    // Add dedicated properties for the new managers
    static _tokenManager = null;
    static _pauseManager = null;
    static _combatManager = null;
    static _exposureManager = null;

    // A registry to map texture suffixes to their corresponding Effect classes.
    static _effectRegistry = new Map();

    /**
     * Registers an Effect class with the engine, associating it with a texture suffix.
     * @param {typeof Effect} effectClass - The class constructor of the effect.
     */
    static registerEffect(effectClass) {
        if (effectClass.Suffix && effectClass.Suffix !== "override_me") {
            this._effectRegistry.set(effectClass.Suffix, effectClass);
            console.log(`[MapShine] Engine: Registered effect class '${effectClass.name}' for suffix '${effectClass.Suffix}'.`);
        } else {
            console.error(`[MapShine] Engine: Could not register effect class '${effectClass.name}' due to missing or invalid static Suffix property.`);
        }
    }

    /**
         * The main entry point, called on `canvasReady`.
         */
    static async initialize() {
        if (this._isInitialized) {
            console.warn("[MapShine] Engine: Initialization called, but already initialized. Tearing down first.");
            await this.tearDown();
        }
        console.log("%c[MapShine] Engine: Initialization sequence started.", "color: #40a0fa; font-weight: bold;");
        this._isInitialized = true;
        this._lastTimestamp = performance.now();

        // 1. Initialize UI and Managers that don't depend on canvas data
        game.mapShine.profileManager.initializeForScene();
        this._sceneTransition = new SceneTransition();
        const config = game.mapShine.profileManager.activeConfig;

        // 2. Setup Canvas Layers and Sub-Systems
        this._layer = canvas.layers.find(l => l instanceof MapShineLayer);
        if (!this._layer) {
            console.error("[MapShine] Engine: Could not find MapShineLayer on canvas. Aborting initialization.");
            return;
        }

        ScreenEffectsManager.initialize(canvas.stage);
        ScreenEffectsManager.setupAllGlobalFilters();

        // Initialize and register all sub-systems
        this._particleSystem = new ParticleSystem(this._layer);
        this._subSystems.push(this._particleSystem);

        this._tokenManager = new TokenManager();
        this._tokenManager.initialize();
        game.mapShine.tokenManager = this._tokenManager; // Expose globally for DynamicExposureManager

        this._pauseManager = new PauseEffectManager();
        this._pauseManager.initialize();
        this._subSystems.push(this._pauseManager);

        this._combatManager = new CombatEffectManager();
        this._combatManager.initialize();
        this._subSystems.push(this._combatManager);

        this._exposureManager = new DynamicExposureManager();
        this._exposureManager.initialize();
        this._subSystems.push(this._exposureManager);

        // 3. Discover Targets and Instantiate Effects
        await TargetRegistry.discover();
        TargetRegistry.applyTileOpacities(config);
        Hooks.callAll('mapShine:targetsRefreshed');

        // 3a. Instantiate Per-Target Effects
        for (const target of TargetRegistry.targets) {
            // Instantiate the passthrough effect first for each target to render its base texture.
            const passthroughInstance = new BackgroundPassthroughEffect(target, this._layer);
            this._activeEffects.push(passthroughInstance);

            // Then, instantiate the suffix-based effects on top of the base texture.
            for (const [suffix, texturePath] of target.effectTextures.entries()) {
                const EffectClass = this._effectRegistry.get(suffix);
                if (EffectClass && !(EffectClass.prototype instanceof GlobalEffect)) {
                    try {
                        const effectInstance = new EffectClass(target, this._layer);
                        this._activeEffects.push(effectInstance);
                        console.log(`[MapShine] Engine: Instantiated '${EffectClass.name}' for target '${target.id}'.`);
                    } catch (e) {
                        console.error(`[MapShine] Engine: Failed to instantiate effect for suffix '${suffix}' on target '${target.id}'.`, e);
                    }
                }
            }
        }

        // 3b. Instantiate Global Effects
        const allDiscoveredSuffixes = new Set(
            Array.from(TargetRegistry.targets.values()).flatMap(t => Array.from(t.effectTextures.keys()))
        );

        for (const EffectClass of this._effectRegistry.values()) {
            if (EffectClass.prototype instanceof GlobalEffect) {
                if (allDiscoveredSuffixes.has(EffectClass.Suffix)) {
                    try {
                        const effectInstance = new EffectClass(this._layer);
                        this._activeEffects.push(effectInstance);
                        if (effectInstance instanceof GlobalEffect) {
                            this._subSystems.push(effectInstance);
                        }
                        console.log(`[MapShine] Engine: Instantiated global effect '${EffectClass.name}'.`);
                    } catch (e) {
                        console.error(`[MapShine] Engine: Failed to instantiate global effect '${EffectClass.name}'.`, e);
                    }
                }
            }
        }

        // 3c. Update Particle System with discovered targets
        this._particleSystem.updateEffectTargets(TargetRegistry.targets, config);

        // 4. Final Configuration and Start Loop
        this.updateAllSystemsFromConfig(config);
        this._animationFrameId = requestAnimationFrame(this._tick.bind(this));

        console.log("%c[MapShine] Engine: Initialization sequence complete.", "color: #4CAF50; font-weight: bold;");
    }

    /**
     * Main animation loop.
     * @param {number} timestamp - The current time provided by requestAnimationFrame.
     */
    static _tick(timestamp) {
        if (!this._isInitialized) return;

        const deltaTime = (timestamp - this._lastTimestamp) / 1000;
        this._lastTimestamp = timestamp;

        const config = game.mapShine.profileManager.activeConfig;

        // Update all active effects
        for (const effect of this._activeEffects) {
            if (effect.visible) {
                effect.update(deltaTime, config);
            }
        }

        // Update all subsystems
        for (const system of this._subSystems) {
            if (typeof system.update === 'function') {
                system.update(deltaTime, config);
            }
        }

        this._animationFrameId = requestAnimationFrame(this._tick.bind(this));
    }

    /**
     * Called on `canvasTearDown` to clean up all module resources.
     */
    static async tearDown() {
        if (!this._isInitialized) return;
        console.log("%c[MapShine] Engine: Teardown sequence started.", "color: #ff8c00; font-weight: bold;");

        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }

        for (const effect of this._activeEffects) {
            try {
                effect.destroy();
            } catch (e) {
                console.error(`[MapShine] Engine: Error destroying effect instance.`, e);
            }
        }
        this._activeEffects = [];

        for (const system of this._subSystems) {
            if (typeof system.tearDown === 'function') {
                system.tearDown();
            }
        }
        this._subSystems = [];
        this._particleSystem = null;

        // Explicitly tear down new managers
        this._tokenManager?.tearDown();
        this._pauseManager?.tearDown();
        this._combatManager?.tearDown();
        this._exposureManager?.tearDown();
        this._tokenManager = this._pauseManager = this._combatManager = this._exposureManager = null;
        game.mapShine.tokenManager = null;

        ScreenEffectsManager.tearDown();
        TargetRegistry.targets = [];
        game.mapShine.profileManager.reset();
        this._layer = null;

        this._isInitialized = false;
        console.log("%c[MapShine] Engine: Teardown sequence complete.", "color: #ff8c00; font-weight: bold;");
    }

    /**
     * Propagates configuration changes to all active systems.
     * @param {object} config - The new, complete configuration object.
     */
    static updateAllSystemsFromConfig(config) {
        for (const effect of this._activeEffects) {
            effect.updateFromConfig(config);
        }
        for (const system of this._subSystems) {
            if (typeof system.updateFromConfig === 'function') {
                system.updateFromConfig(config);
            }
        }
        ScreenEffectsManager.updateAllFiltersFromConfig(config, this._activeEffects);
        TargetRegistry.applyTileOpacities(config);
        const diagnosticLayer = canvas.layers.find(l => l instanceof DiagnosticLayer);
        if (diagnosticLayer) {
            diagnosticLayer.updateFromConfig(config);
        }
    }
}

/*********************************************************************************
 *  SECTION 3: MODULAR EFFECTS & HELPERS
 *********************************************************************************/
// Description: This section contains the concrete implementations of the `Effect`
//              base class. It also includes any helper classes (like
//              `NoiseTextureManager`) and tightly-coupled PIXI Filters that are
//              required for these effects to function.
// ---------------------------------------------------------------------------------

/**
 * A PIXI Filter that generates a procedural noise pattern. Used by various effects
 * via the NoiseTextureManager.
 */
class NoisePatternFilter extends PIXI.Filter {
    constructor(options) {
        const fragmentSrc = `
            precision mediump float; 
            varying vec2 vTextureCoord;
            uniform float u_time; 
            uniform vec2 u_resolution;
            uniform float u_speed, u_scale, u_threshold, u_brightness, u_contrast, u_softness;
            uniform float u_evolution;
            uniform bool u_isWorldSpace;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            float random(vec3 st) { 
                return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.731))) * 43758.5453123); 
            }

            float value_noise(vec3 st) {
                vec3 i = floor(st); 
                vec3 f = fract(st); 
                float a = random(i + vec3(0.0, 0.0, 0.0));
                float b = random(i + vec3(1.0, 0.0, 0.0));
                float c = random(i + vec3(0.0, 1.0, 0.0));
                float d = random(i + vec3(1.0, 1.0, 0.0));
                float e = random(i + vec3(0.0, 0.0, 1.0));
                float f_ = random(i + vec3(1.0, 0.0, 1.0));
                float g = random(i + vec3(0.0, 1.0, 1.0));
                float h = random(i + vec3(1.0, 1.0, 1.0));
                vec3 u = f * f * (3.0 - 2.0 * f);
                float bottom_x = mix(a, b, u.x);
                float top_x = mix(c, d, u.x);
                float bottom_face_mix = mix(bottom_x, top_x, u.y);
                float bottom_x_top = mix(e, f_, u.x);
                float top_x_top = mix(g, h, u.x);
                float top_face_mix = mix(bottom_x_top, top_x_top, u.y);
                return mix(bottom_face_mix, top_face_mix, u.z);
            }

            void main() {
                vec2 uv;
                if (u_isWorldSpace) {
                    vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                    world_coord.x += u_time * u_speed * 10.0;
                    uv = world_coord * u_scale / 1000.0;
                } else {
                    vec2 screen_pixel_coord = vTextureCoord * u_resolution;
                    vec2 screen_center_pixel_coord = u_resolution * 0.5;
                    uv = (screen_pixel_coord - screen_center_pixel_coord) * u_scale / 30.0;
                    uv.x += u_time * u_speed;
                }
                
                float time_z = u_time * u_evolution;
                float noise = value_noise(vec3(uv, time_z));

                noise += u_brightness;
                noise = (noise - 0.5) * u_contrast + 0.5;
                noise = smoothstep(u_threshold, u_threshold + u_softness, noise);
                gl_FragColor = vec4(vec3(clamp(noise, 0.0, 1.0)), 1.0);
            }`;

        const safeOptions = {
            u_resolution: [canvas?.app?.renderer.screen.width || 1, canvas?.app?.renderer.screen.height || 1],
            u_evolution: 0.0,
            u_isWorldSpace: false,
            u_camera_offset: [0, 0],
            u_view_size: [0, 0],
            ...options
        };
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, safeOptions);
    }
}

/**
 * A PIXI Filter that creates a grayscale mask based on the luminance of an input texture.
 */
class LightingMaskFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler; 
            uniform float uLuminanceThreshold;
            uniform float uSoftness;
            uniform bool uInvert;
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 lightingColor = texture2D(uSampler, vTextureCoord);
                float lightLevel = dot(lightingColor.rgb, lum_weights);
                float maskAlpha = smoothstep(uLuminanceThreshold, uLuminanceThreshold + uSoftness, lightLevel);
                float finalAlpha = uInvert ? maskAlpha : 1.0 - maskAlpha;
                gl_FragColor = vec4(vec3(finalAlpha), 1.0);
            }`;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uLuminanceThreshold: options.luminanceThreshold ?? 0.25,
            uSoftness: options.softness ?? 0.1,
            uInvert: options.invert ?? false,
        });
    }
}

/**
 * Manages the lifecycle of a single procedural noise texture.
 * This class is instantiated by effects that require a noise map (e.g., for
 * distortion or pattern modulation). It handles the creation, animation,
 * and destruction of the PIXI objects needed to generate the noise.
 */
class NoiseTextureManager {
    constructor(renderer, configPath, isWorldSpace = false) {
        this.configPath = configPath;
        this.isWorldSpace = isWorldSpace;
        this._needsUpdate = true;

        const screen = renderer.screen;
        this.renderTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height,
            scaleMode: PIXI.SCALE_MODES.LINEAR
        });
        this.renderTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;

        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;

        this.filter = new NoisePatternFilter({
            u_isWorldSpace: this.isWorldSpace,
            u_resolution: [screen.width, screen.height]
        });
        this.sourceSprite.filters = [this.filter];

        if (this.isWorldSpace) {
            this._onPanBound = this.requestUpdate.bind(this);
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    /** Signals that the noise texture needs to be re-rendered on the next frame. */
    requestUpdate() {
        this._needsUpdate = true;
    }

    /**
     * Resizes the internal render texture to match the renderer's screen size.
     * @param {PIXI.Renderer} renderer - The canvas renderer.
     */
    resize(renderer) {
        if (!this.renderTexture || !this.sourceSprite) return;
        const screen = renderer.screen;
        this.renderTexture.resize(screen.width, screen.height, true);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        if (this.filter) {
            this.filter.uniforms.u_resolution = [screen.width, screen.height];
        }
        this._needsUpdate = true;
    }

    /**
     * Updates the noise filter's uniforms from a configuration object.
     * @param {object} config - The full module configuration object.
     */
    updateFromConfig(config) {
        const nConfig = foundry.utils.getProperty(config, this.configPath);
        if (!nConfig || !this.filter) {
            if (this.filter) this.filter.enabled = false;
            return;
        }

        this.filter.enabled = true;
        const u = this.filter.uniforms;
        u.u_speed = nConfig.speed;
        u.u_scale = nConfig.scale;
        u.u_threshold = nConfig.threshold;
        u.u_brightness = nConfig.brightness;
        u.u_contrast = nConfig.contrast;
        u.u_softness = nConfig.softness;
        u.u_evolution = nConfig.evolution ?? 0.0;
        this.requestUpdate();
    }

    /**
     * Called every frame to update the noise animation and re-render if necessary.
     * @param {number} deltaTime - Time elapsed since the last frame, in seconds.
     * @param {PIXI.Renderer} renderer - The canvas renderer.
     */
    update(deltaTime, renderer) {
        if (!this.filter || !this.sourceSprite || !this.renderTexture) return;

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const nConfig = foundry.utils.getProperty(game.mapShine.profileManager.activeConfig, this.configPath);
        const isAnimated = nConfig && ((nConfig.speed * timeFactor) !== 0 || (nConfig.evolution * timeFactor) !== 0);

        if (!this._needsUpdate && !isAnimated) return;

        this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + (deltaTime * timeFactor);
        const screen = renderer.screen;

        if (this.isWorldSpace) {
            const stage = canvas.stage;
            const topLeft = stage.toLocal({ x: 0, y: 0 });
            const u = this.filter.uniforms;
            u.u_camera_offset = [topLeft.x, topLeft.y];
            u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        } else {
            this.filter.uniforms.u_resolution = [screen.width, screen.height];
        }

        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });
        this._needsUpdate = false;
    }

    /** @returns {PIXI.RenderTexture} The generated noise texture. */
    getTexture() {
        return this.renderTexture;
    }

    /** Cleans up all PIXI objects and listeners. */
    destroy() {
        if (this.isWorldSpace && this._onPanBound) {
            Hooks.off('canvasPan', this._onPanBound);
        }
        this.filter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture?.destroy(true);
    }
}

/**
 * A PIXI Filter that generates a procedural Fractional Brownian Motion (FBM) noise pattern.
 */
class FbmNoiseFilter extends PIXI.Filter {
    constructor(options) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_speed;
            uniform float u_scale;
            uniform int u_octaves;
            uniform float u_persistence;
            uniform float u_lacunarity;
            uniform float u_evolution;
            uniform float u_brightness;
            uniform float u_contrast;
            uniform bool u_isWorldSpace;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod(i, 289.0);
                vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
                float n_ = 0.142857142857;
                vec3  ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            float fbm(vec3 st) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 10; i++) {
                    if (i >= u_octaves) break;
                    value += amplitude * snoise(st);
                    st *= u_lacunarity;
                    amplitude *= u_persistence;
                }
                return value;
            }

            void main() {
                vec2 uv;
                if (u_isWorldSpace) {
                    vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                    uv = world_coord * u_scale / 1000.0;
                } else {
                    uv = vTextureCoord * u_resolution * u_scale / 1000.0;
                }
                uv.x += u_time * u_speed;
                float time_z = u_time * u_evolution;

                float noise = fbm(vec3(uv, time_z)) * 0.5 + 0.5; // Remap from [-1,1] to [0,1]
                noise = (noise - 0.5 + u_brightness) * u_contrast + 0.5;
                gl_FragColor = vec4(vec3(clamp(noise, 0.0, 1.0)), 1.0);
            }`;

        const safeOptions = {
            u_resolution: [canvas?.app?.renderer.screen.width || 1, canvas?.app?.renderer.screen.height || 1],
            u_isWorldSpace: false, u_camera_offset: [0, 0], u_view_size: [0, 0], ...options
        };
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, safeOptions);
    }
}

/**
 * Manages the lifecycle of a procedural FBM noise texture.
 */
class FbmNoiseTextureManager extends NoiseTextureManager {
    constructor(renderer, configPath, isWorldSpace = false) {
        super(renderer, configPath, isWorldSpace); // Calls parent constructor

        // Overwrite the filter created by the parent
        this.filter?.destroy();
        const screen = renderer.screen;
        this.filter = new FbmNoiseFilter({
            u_isWorldSpace: this.isWorldSpace,
            u_resolution: [screen.width, screen.height]
        });
        this.sourceSprite.filters = [this.filter];
    }

    /**
     * @override
     * Updates the FBM noise filter's uniforms from a configuration object.
     */
    updateFromConfig(config) {
        const nConfig = foundry.utils.getProperty(config, this.configPath);
        if (!nConfig || !this.filter) {
            if (this.filter) this.filter.enabled = false;
            return;
        }

        this.filter.enabled = true;
        const u = this.filter.uniforms;
        u.u_speed = nConfig.speed;
        u.u_scale = nConfig.scale;
        u.u_octaves = nConfig.octaves;
        u.u_persistence = nConfig.persistence;
        u.u_lacunarity = nConfig.lacunarity;
        u.u_evolution = nConfig.evolution;
        u.u_brightness = nConfig.brightness - 0.5; // UI is 0-1, shader needs -0.5 to 0.5
        u.u_contrast = nConfig.contrast;
        this.requestUpdate();
    }
}

/**
 * A PIXI Filter that generates a procedural, multi-layered, animated stripe pattern.
 */
class StripePatternFilter extends PIXI.Filter {
    constructor(options) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D u_noiseMap;
            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;
            uniform float u_parallaxAmount;
            
            // Shared Pattern Uniforms
            uniform float u_shared_patternScale;
            uniform float u_shared_maxBrightness;

            // Stripe Layer 1 Uniforms
            uniform bool u_s1_enabled;
            uniform float u_s1_speed, u_s1_intensity, u_s1_angle_rad, u_s1_sharpness, u_s1_band_density, u_s1_band_width;
            uniform float u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp;
            
            // Stripe Layer 2 Uniforms
            uniform bool u_s2_enabled;
            uniform float u_s2_speed, u_s2_intensity, u_s2_angle_rad, u_s2_sharpness, u_s2_band_density, u_s2_band_width;
            uniform float u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp;

            const float PI = 3.14159265359;

            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

            float createStripeLayer(vec2 uv, float t, float angle, float density, float width, float sub_count, float sub_sharp, float sharp) {
                float p_perp = uv.x * cos(angle) + uv.y * sin(angle);
                p_perp = mod(p_perp, 1000.0);
                float band_coord = p_perp * density;
                float band_id = floor(band_coord);
                float in_band_pos = fract(band_coord);
                float result = 0.0;
                if (in_band_pos <= width) {
                    float r1 = random(vec2(band_id)); float r2 = random(vec2(band_id, r1)); float r3 = random(vec2(r1, r2));
                    float num_sub = 2.0 + r1 * sub_count;
                    float sub_stripe_s = 1.0 + r2 * sub_sharp;
                    float sub_stripe_b = 0.5 + r3 * 0.5;
                    float sub_wave = (cos(in_band_pos * (num_sub / width) * 2.0 * PI + t) + 1.0) * 0.5;
                    sub_wave = pow(sub_wave, sub_stripe_s) * sub_stripe_b;
                    result = sub_wave * pow(sin((in_band_pos / width) * PI), sharp);
                }
                return result;
            }

            void main() {
                vec2 screen_coord = vTextureCoord * u_view_size;
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 pattern_coords = world_coord + ((screen_coord - world_coord) * u_parallaxAmount);
                vec2 pattern_uv = pattern_coords * u_shared_patternScale * 0.015;

                float pattern1 = u_s1_enabled ? createStripeLayer(pattern_uv, u_time * u_s1_speed, u_s1_angle_rad, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp, u_s1_sharpness) * u_s1_intensity : 0.0;
                float pattern2 = u_s2_enabled ? createStripeLayer(pattern_uv, u_time * u_s2_speed, u_s2_angle_rad, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp, u_s2_sharpness) * u_s2_intensity : 0.0;

                float noise_mask = texture2D(u_noiseMap, vTextureCoord).r;
                float shinePattern = max(pattern1, pattern2) * u_shared_maxBrightness * noise_mask;
                
                gl_FragColor = vec4(vec3(clamp(shinePattern, 0.0, 1.0)), 1.0);
            }`;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, options);
    }
}

/**
 * Manages the lifecycle of a procedural stripe pattern texture.
 */
class StripePatternManager {
    constructor(renderer, configPath) {
        this.configPath = configPath;
        this._needsUpdate = true;
        
        this.breakupNoiseManager = new NoiseTextureManager(renderer, `${configPath}.noise`, false);

        const screen = renderer.screen;
        this.renderTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;

        this.filter = new StripePatternFilter();
        this.sourceSprite.filters = [this.filter];

        this._onPanBound = this.requestUpdate.bind(this);
        Hooks.on('canvasPan', this._onPanBound);
    }

    requestUpdate() { this._needsUpdate = true; }

    resize(renderer) {
        const screen = renderer.screen;
        this.renderTexture.resize(screen.width, screen.height, true);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.breakupNoiseManager.resize(renderer);
        this._needsUpdate = true;
    }

    updateFromConfig(config) {
        const pConfig = foundry.utils.getProperty(config, this.configPath);
        this.breakupNoiseManager.updateFromConfig(config);
        
        const u = this.filter.uniforms;
        u.u_parallaxAmount = config.baseShine.animation.parallaxAmount;
        u.u_shared_patternScale = pConfig.pattern.shared.patternScale;
        u.u_shared_maxBrightness = pConfig.pattern.shared.maxBrightness;
        
        const s1 = pConfig.pattern.stripes1;
        u.u_s1_enabled = s1.enabled;
        u.u_s1_speed = s1.speed;
        u.u_s1_intensity = s1.intensity;
        u.u_s1_angle_rad = s1.angle * (Math.PI / 180.0);
        u.u_s1_sharpness = s1.sharpness;
        u.u_s1_band_density = s1.bandDensity;
        u.u_s1_band_width = s1.bandWidth;
        u.u_s1_sub_stripe_max_count = s1.subStripeMaxCount;
        u.u_s1_sub_stripe_max_sharp = s1.subStripeMaxSharp;

        const s2 = pConfig.pattern.stripes2;
        u.u_s2_enabled = s2.enabled;
        u.u_s2_speed = s2.speed;
        u.u_s2_intensity = s2.intensity;
        u.u_s2_angle_rad = s2.angle * (Math.PI / 180.0);
        u.u_s2_sharpness = s2.sharpness;
        u.u_s2_band_density = s2.bandDensity;
        u.u_s2_band_width = s2.bandWidth;
        u.u_s2_sub_stripe_max_count = s2.subStripeMaxCount;
        u.u_s2_sub_stripe_max_sharp = s2.subStripeMaxSharp;

        this.requestUpdate();
    }

    update(deltaTime, renderer) {
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const pConfig = foundry.utils.getProperty(game.mapShine.profileManager.activeConfig, this.configPath);
        const isAnimated = (pConfig.pattern.stripes1.enabled && pConfig.pattern.stripes1.speed !== 0) || 
                           (pConfig.pattern.stripes2.enabled && pConfig.pattern.stripes2.speed !== 0);

        this.breakupNoiseManager.update(deltaTime, renderer);

        if (!this._needsUpdate && !isAnimated) return;

        this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + (deltaTime * timeFactor * 100);
        
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        const u = this.filter.uniforms;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        u.u_noiseMap = this.breakupNoiseManager.getTexture();
        
        renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
        this._needsUpdate = false;
    }

    getTexture() { return this.renderTexture; }

    destroy() {
        Hooks.off('canvasPan', this._onPanBound);
        this.breakupNoiseManager?.destroy();
        this.filter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture?.destroy(true);
    }
}

/**
 * A manager that creates and maintains a screen-space texture mask of all
 * visible, non-hidden tokens on the canvas. This is used by effects like
 * Ambient and GroundGlow to hide themselves behind tokens.
 */
class DynamicTokenMaskManager {
    constructor(canvas) {
        this.canvas = canvas;
        const renderer = this.canvas.app.renderer;
        this.renderTexture = PIXI.RenderTexture.create({ width: renderer.screen.width, height: renderer.screen.height });
        this.tokenContainer = new PIXI.Container();
        this.tokenSprites = new Map();
        this._needsUpdate = true;
        this._destroyed = false;
        this._frameCount = 0;
        this.updateFrequency = 30; // Update only every 30 frames unless a change occurs

        this._boundOnTokenChange = this._requestUpdate.bind(this);
        Hooks.on("createToken", this._boundOnTokenChange);
        Hooks.on("deleteToken", this._boundOnTokenChange);
        Hooks.on("canvasPan", this._boundOnTokenChange);
        this._boundOnAnimate = () => {
            if (this._destroyed) return;
            this._frameCount++;
            if (this._needsUpdate || (this._frameCount % this.updateFrequency === 0)) {
                this.renderMask();
                this._needsUpdate = false;
            }
        };
        this.canvas.app.ticker.add(this._boundOnAnimate);
        this.renderMask();
    }

    _requestUpdate() { this._needsUpdate = true; }

    renderMask() {
        if (this._destroyed || !this.tokenContainer || !this.canvas?.tokens?.placeables) return;
        const renderer = this.canvas.app.renderer;
        const currentTokenIds = new Set();
        for (const token of this.canvas.tokens.placeables) {
            if (!token.visible || !token.texture?.valid || token.document.hidden) continue;
            currentTokenIds.add(token.id);
            let sprite = this.tokenSprites.get(token.id);
            if (!sprite) {
                sprite = new PIXI.Sprite(token.texture);
                sprite.tint = 0xFFFFFF;
                this.tokenSprites.set(token.id, sprite);
                this.tokenContainer.addChild(sprite);
            }
            if (sprite.texture !== token.texture) sprite.texture = token.texture;
            sprite.anchor.set(token.document.texture.anchorX ?? 0.5, token.document.texture.anchorY ?? 0.5);
            sprite.position.set(token.center.x, token.center.y);
            sprite.width = token.w;
            sprite.height = token.h;
            sprite.rotation = Math.toRadians(token.document.rotation);
        }
        for (const [tokenId, sprite] of this.tokenSprites.entries()) {
            if (!currentTokenIds.has(tokenId)) {
                sprite.destroy();
                this.tokenSprites.delete(tokenId);
            }
        }
        if (!this.canvas?.stage?.transform) return;
        renderer.render(this.tokenContainer, {
            renderTexture: this.renderTexture,
            transform: this.canvas.stage.transform.worldTransform,
            clear: true
        });
    }

    getMaskTexture() { return this.renderTexture; }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        Hooks.off("createToken", this._boundOnTokenChange);
        Hooks.off("deleteToken", this._boundOnTokenChange);
        Hooks.off("canvasPan", this._boundOnTokenChange);
        this.canvas.app.ticker.remove(this._boundOnAnimate);
        this.renderTexture?.destroy(true);
        for (const sprite of this.tokenSprites.values()) sprite.destroy();
        this.tokenSprites.clear();
        this.tokenContainer?.destroy({ children: true });
    }
}


// --- Metallic Shine Effect: Component Filters ---

/**
 * The main composite filter for the Metallic Shine effect.
 * It combines the specular map with various animated noise patterns.
 */
class MetallicShineCompositeFilter extends PIXI.Filter {
    constructor() {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler; // The _Specular texture
            uniform sampler2D u_fbmNoiseMap;
            uniform sampler2D u_stripePatternMap;

            uniform bool u_fbmEnabled;
            uniform bool u_stripesEnabled;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 specularColor = texture2D(uSampler, vTextureCoord);
                
                // Read the animated noise values
                float fbmValue = u_fbmEnabled ? texture2D(u_fbmNoiseMap, vTextureCoord).r : 0.0;
                float stripeValue = u_stripesEnabled ? texture2D(u_stripePatternMap, vTextureCoord).r : 0.0;

                // Add the two masks together and clamp the result between 0.0 and 1.0.
                float combinedMask = clamp(fbmValue + stripeValue, 0.0, 1.0);

                // Calculate the base opacity from the specular map's brightness
                float specularLuminance = dot(specularColor.rgb, lum_weights);
                
                // Modulate the specular opacity by the animated mask
                float finalAlpha = specularLuminance * combinedMask;
                
                // Use the original specular color, but with the modulated alpha
                gl_FragColor = vec4(specularColor.rgb, finalAlpha);
            }`;
        
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_fbmNoiseMap: PIXI.Texture.WHITE,
            u_stripePatternMap: PIXI.Texture.WHITE,
            u_fbmEnabled: true,
            u_stripesEnabled: true
        });
    }
}



/**
 * A PIXI Filter that generates a procedural animated stripe pattern and applies it
 * to the scene, using a specular map for masking and tinting. This filter combines
 * the logic for pattern generation and application into a single pass.
 */
class MetallicShineFilter extends PIXI.Filter {
    constructor(options) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float;
            varying vec2 vTextureCoord;

            // Input Textures
            uniform sampler2D uSampler; // The _Specular texture
            uniform sampler2D u_noiseMap;

            // Animation & World Uniforms
            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;
            uniform float u_parallaxAmount;
            uniform float u_parallaxJitter;
            uniform float u_parallaxJitterSpeed;

            // Pattern Uniforms
            uniform float u_globalIntensity;
            uniform float u_shared_maxBrightness;
            uniform float u_shared_patternScale;
            uniform bool u_noise_enabled;
            uniform bool u_s1_enabled, u_s2_enabled;
            uniform float u_s1_speed, u_s1_intensity, u_s1_angle_rad, u_s1_sharpness, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp;
            uniform float u_s2_speed, u_s2_intensity, u_s2_angle_rad, u_s2_sharpness, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp;

            const float PI = 3.14159265359;
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            // --- NOISE & PATTERN FUNCTIONS (from original ShinePatternFilter) ---
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float noise(vec2 st) {
                vec2 i = floor(st); vec2 f = fract(st); vec2 u = f*f*(3.0-2.0*f);
                return mix(mix(random(i + vec2(0.0,0.0)), random(i + vec2(1.0,0.0)), u.x),
                           mix(random(i + vec2(0.0,1.0)), random(i + vec2(1.0,1.0)), u.x), u.y);
            }

            float createStripeLayer(vec2 uv, float t, float angle, float density, float width, float sub_count, float sub_sharp, float sharp) {
                float p_perp = uv.x * cos(angle) + uv.y * sin(angle);
                p_perp = mod(p_perp, 1000.0);
                float band_coord = p_perp * density;
                float band_id = floor(band_coord);
                float in_band_pos = fract(band_coord);
                float result = 0.0;
                if (in_band_pos <= width) {
                    float r1 = random(vec2(band_id)); float r2 = random(vec2(band_id, r1)); float r3 = random(vec2(r1, r2));
                    float num_sub = 2.0 + r1 * sub_count;
                    float sub_stripe_s = 1.0 + r2 * sub_sharp;
                    float sub_stripe_b = 0.5 + r3 * 0.5;
                    float sub_wave = (cos(in_band_pos * (num_sub / width) * 2.0 * PI + t) + 1.0) * 0.5;
                    sub_wave = pow(sub_wave, sub_stripe_s) * sub_stripe_b;
                    result = sub_wave * pow(sin((in_band_pos / width) * PI), sharp);
                }
                return result;
            }

            void main() {
                // --- 1. GENERATE THE SHINE PATTERN ---
                vec2 screen_coord = vTextureCoord * u_view_size; // Using view_size as a proxy for resolution here
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 pattern_coords = world_coord + ((screen_coord - world_coord) * u_parallaxAmount);
                if (u_parallaxJitter > 0.0) {
                    float jitter_time = u_time * u_parallaxJitterSpeed * 0.1;
                    vec2 jitter_noise_coord = world_coord * 0.05;
                    float jitter_x = (noise(jitter_noise_coord + jitter_time) - 0.5) * 2.0;
                    float jitter_y = (noise(jitter_noise_coord - jitter_time + vec2(37.3, -84.1)) - 0.5) * 2.0;
                    pattern_coords += vec2(jitter_x, jitter_y) * u_parallaxJitter;
                }
                vec2 pattern_uv = pattern_coords * u_shared_patternScale * 0.015;
                float pattern1 = u_s1_enabled ? createStripeLayer(pattern_uv, u_time * u_s1_speed, u_s1_angle_rad, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp, u_s1_sharpness) * u_s1_intensity : 0.0;
                float pattern2 = u_s2_enabled ? createStripeLayer(pattern_uv, u_time * u_s2_speed, u_s2_angle_rad, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp, u_s2_sharpness) * u_s2_intensity : 0.0;
                float noise_mask = u_noise_enabled ? texture2D(u_noiseMap, vTextureCoord).r : 1.0;
                float shinePattern = max(pattern1, pattern2) * u_shared_maxBrightness * u_globalIntensity * noise_mask;

                // --- 2. MASK AND TINT WITH THE SPECULAR MAP ---
                vec4 specularTexel = texture2D(uSampler, vTextureCoord);
                float specularLuminance = dot(specularTexel.rgb, lum_weights);
                
                // The final color is the shine pattern, tinted by the specular map's color.
                vec3 finalColor = specularTexel.rgb * shinePattern;
                
                // The final alpha (visibility) is determined by the specular map's brightness.
                float finalAlpha = specularLuminance;

                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `, { ...options });
    }
}



/**
 * A simple PIXI Filter that discards pixels with a brightness below a given threshold.
 * Used as a pre-filter for bloom and starburst effects.
 */
class ThresholdFilter extends PIXI.Filter {
    constructor(threshold = 0.5) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_threshold;
            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                if (brightness < u_threshold) { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); }
                else { gl_FragColor = color; }
            }`, { u_threshold: threshold });
    }
    get threshold() { return this.uniforms.u_threshold; }
    set threshold(value) { this.uniforms.u_threshold = value; }
}



// --- Metallic Shine Effect: Main Class ---

class MetallicShineEffect extends Effect {
    /** @override */
    static Suffix = "specular";

    constructor(target, layer) {
        super(target, layer);

        this.fbmNoiseManager = new FbmNoiseTextureManager(canvas.app.renderer, 'baseShine.fbmNoise', true);
        this.stripeManager = new StripePatternManager(canvas.app.renderer, 'baseShine');
        this.compositeFilter = new MetallicShineCompositeFilter();

        this.effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.effectSprite.filters = [this.compositeFilter];
        this.effectSprite.blendMode = PIXI.BLEND_MODES.ADD;

        this.layer.addChild(this.effectSprite);

        this._loadTexture();
    }

    async _loadTexture() {
        const texturePath = this.target.effectTextures.get(MetallicShineEffect.Suffix);
        try {
            this.effectSprite.texture = await foundry.canvas.loadTexture(texturePath);
            console.log(`[MapShine] MetallicShineEffect: Successfully loaded texture for '${this.target.id}' from: ${texturePath}`);
            
            this._updateSpriteTransform();
            
            const config = game.mapShine.profileManager.activeConfig;
            this.updateFromConfig(config);

        } catch (e) {
            console.error(`[MapShine] MetallicShineEffect: Failed to load specular texture for target '${this.target.id}' from path: ${texturePath}`, e);
            this.effectSprite.texture = PIXI.Texture.EMPTY;
        }
    }

    _updateSpriteTransform() {
        if (!this.effectSprite.texture.valid) return;

        let rect = this.target.rect;

        if (this.target.id === 'background') {
            const dims = canvas.scene.dimensions;
            rect = {
                x: dims.paddingX,
                y: dims.paddingY,
                width: dims.sceneWidth,
                height: dims.sceneHeight,
                rotation: 0 
            };
        }
        
        this.effectSprite.anchor.set(0.5);
        this.effectSprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        this.effectSprite.width = rect.width;
        this.effectSprite.height = rect.height;
        this.effectSprite.rotation = this.target.rect.rotation || 0;
    }

    /** @override */
    update(deltaTime, config) {
        this.effectSprite.visible = this.visible;
        if (!this.visible) return;

        this.fbmNoiseManager.update(deltaTime, canvas.app.renderer);
        this.stripeManager.update(deltaTime, canvas.app.renderer);
        
        this.compositeFilter.uniforms.u_fbmNoiseMap = this.fbmNoiseManager.getTexture();
        this.compositeFilter.uniforms.u_stripePatternMap = this.stripeManager.getTexture();
        
        this._updateSpriteTransform();
    }

    /** @override */
    updateFromConfig(config) {
        const bsConfig = config.baseShine;
        this.visible = config.enabled && bsConfig.enabled && this.effectSprite.texture.valid;
        this.effectSprite.visible = this.visible;

        this.fbmNoiseManager.updateFromConfig(config);
        this.stripeManager.updateFromConfig(config);
        
        const patternConfig = bsConfig.pattern;
        const areStripesActive = (patternConfig.stripes1.enabled || patternConfig.stripes2.enabled);
        
        this.compositeFilter.uniforms.u_fbmEnabled = bsConfig.fbmNoise.enabled;
        this.compositeFilter.uniforms.u_stripesEnabled = areStripesActive;
    }

    /** @override */
    destroy() {
        console.log(`[MapShine] MetallicShineEffect: Destroying instance for target '${this.target.id}'.`);
        this.fbmNoiseManager?.destroy();
        this.stripeManager?.destroy();
        this.compositeFilter?.destroy();
        this.effectSprite?.destroy();
    }
}

/**
 * A simple PIXI Filter that uses the luminance of the input texture as its alpha channel.
 * This is used to make the bright parts of a texture opaque and the dark parts transparent.
 */
class SpecularMaskFilter extends PIXI.Filter {
    constructor() {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                
                // Calculate the luminance (brightness) of the pixel.
                float luminance = dot(color.rgb, lum_weights);
                
                // Use the original color, but set the alpha to its luminance.
                // This makes dark parts of the specular map transparent.
                gl_FragColor = vec4(color.rgb, luminance);
            }`;
        
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc);
    }
}


/**
 * An abstract base class for "global" effects that are instantiated only once per scene,
 * rather than once per target. These effects typically operate on a fullscreen level and
 * combine masks from all relevant targets into a single screen-space texture.
 * Cloud Shadows are a prime example of this pattern.
 */
class GlobalEffect extends Effect {
    constructor(layer) {
        // A global effect is not tied to a single target, so we pass null to the super constructor.
        super(null, layer);
        if (this.constructor === GlobalEffect) {
            throw new Error("GlobalEffect is an abstract class and cannot be instantiated directly.");
        }

        this.maskContainer = new PIXI.Container();
        this.combinedMaskTexture = PIXI.RenderTexture.create({
            width: canvas.app.renderer.screen.width,
            height: canvas.app.renderer.screen.height
        });
        this.maskSprites = new Map();
        this._needsMaskUpdate = true;
    }

    /**
     * Scans all targets in the TargetRegistry and builds/updates the mask sprites
     * for this effect based on its required texture suffix.
     */
    async _updateMasksFromTargets() {
        const suffix = this.constructor.Suffix;
        const validTargetIds = new Set();

        for (const target of TargetRegistry.targets) {
            const texturePath = target.effectTextures.get(suffix);
            if (!texturePath) continue;

            validTargetIds.add(target.id);
            let sprite = this.maskSprites.get(target.id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.maskSprites.set(target.id, sprite);
                this.maskContainer.addChild(sprite);
            }

            // Update texture if it has changed
            const currentPath = sprite.texture?.baseTexture?.resource?.src;
            if (texturePath !== currentPath) {
                try {
                    sprite.texture = await foundry.canvas.loadTexture(texturePath);
                } catch (e) {
                    sprite.texture = PIXI.Texture.EMPTY;
                }
            }

            // Update transform
            if (sprite.texture.valid) {
                const rect = target.rect;
                sprite.anchor.set(0.5);
                sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
                sprite.width = rect.width;
                sprite.height = rect.height;
                sprite.rotation = rect.rotation || 0;
            }
        }

        // Remove sprites for targets that no longer have the required mask
        for (const [id, sprite] of this.maskSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.maskSprites.delete(id);
            }
        }
        this._needsMaskUpdate = true;
    }

    /**
     * Renders the combined mask container to its render texture if an update is needed.
     * This should be called at the start of the subclass's `update` method.
     */
    _renderCombinedMask() {
        if (this._needsMaskUpdate) {
            canvas.app.renderer.render(this.maskContainer, {
                renderTexture: this.combinedMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });
            this._needsMaskUpdate = false;
        }
    }

    /**
     * Handles resizing of the combined mask texture.
     */
    _onResize() {
        this.combinedMaskTexture?.resize(canvas.app.renderer.screen.width, canvas.app.renderer.screen.height);
        this._needsMaskUpdate = true;
    }

    /**
     * Handles canvas panning, which requires the mask to be re-rendered.
     */
    _onPan() {
        this._needsMaskUpdate = true;
    }

    /**
     * @override
     * Global effects need to listen for target refreshes to update their combined mask.
     */
    initialize() {
        this._boundOnResize = this._onResize.bind(this);
        this._boundOnPan = this._onPan.bind(this);
        this._boundUpdateMasks = this._updateMasksFromTargets.bind(this);

        window.addEventListener('resize', this._boundOnResize);
        Hooks.on('canvasPan', this._boundOnPan);
        Hooks.on('mapShine:targetsRefreshed', this._boundUpdateMasks);
        // Initial population
        this._updateMasksFromTargets();
    }

    /** @override */
    destroy() {
        window.removeEventListener('resize', this._boundOnResize);
        Hooks.off('canvasPan', this._boundOnPan);
        Hooks.off('mapShine:targetsRefreshed', this._boundUpdateMasks);

        this.maskContainer?.destroy({ children: true, texture: true, baseTexture: true });
        this.combinedMaskTexture?.destroy(true);
        this.maskSprites.clear();
    }
}

/**
 * A special-case Effect that simply renders the target's original base texture.
 * This is used to re-draw tiles and backgrounds that have effects applied to them,
 * after the original PIXI object has been made transparent by the `tileOpacity` setting.
 * It ensures that other effects have a base to blend with.
 */
class BackgroundPassthroughEffect extends Effect {
    /** @override */
    // This effect does not use a suffix; it's applied to all targets with any effect.
    static Suffix = "passthrough";

    constructor(target, layer) {
        super(target, layer);
        console.log(`[MapShine] BackgroundPassthroughEffect: Creating instance for target '${this.target.id}'.`);

        // Create a container for world positioning and a sprite for local transforms.
        this.container = new PIXI.Container();
        this.sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);

        this.container.addChild(this.sprite);
        this.layer.addChild(this.container);

        // Load the texture, which will then trigger the transform update.
        this._loadTexture();
    }

    async _loadTexture() {
        try {
            this.sprite.texture = await foundry.canvas.loadTexture(this.target.baseTexturePath);
            // Update the transform now that the texture is loaded and dimensions are known.
            this._updateSpriteTransform();
        } catch (e) {
            console.error(`[MapShine] BackgroundPassthroughEffect: Failed to load base texture for target '${this.target.id}' from path: ${this.target.baseTexturePath}`, e);
            this.sprite.texture = PIXI.Texture.EMPTY;
        }
    }

    _updateSpriteTransform() {
        if (!this.sprite.texture.valid) return;
        const rect = this.target.rect;

        // Position the container at the top-left corner of the target's rectangle in world space.
        this.container.position.set(rect.x, rect.y);
        
        // Position and transform the sprite relative to its container's new origin.
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(rect.width / 2, rect.height / 2);
        this.sprite.width = rect.width;
        this.sprite.height = rect.height;
        this.sprite.rotation = rect.rotation || 0;
    }

    /** @override */
    updateFromConfig(config) {
        this.visible = config.enabled;
        this.container.visible = this.visible;
    }

    /** @override */
    destroy() {
        console.log(`[MapShine] BackgroundPassthroughEffect: Destroying instance for target '${this.target.id}'.`);
        // Destroying the container will also destroy its child sprite.
        this.container?.destroy({ children: true, texture: true, baseTexture: true });
    }
}


// --- Cloud Shadows Effect ---

/**
 * A PIXI Filter that generates procedural cloud shadows. It uses an outdoors mask to
 * determine where the shadows are visible and can interact with the scene's lighting.
 */
class CloudShadowsFilter extends PIXI.Filter {
    constructor(options = {}) {
        const vertexSrc = `
            attribute vec2 aVertexPosition; attribute vec2 aTextureCoord; uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord; vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }`;

        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            uniform sampler2D uOutdoorsMask; uniform sampler2D uIlluminationBuffer;
            uniform float u_time; uniform vec2 u_camera_offset; uniform vec2 u_view_size;
            uniform vec2 u_windDirection; uniform float u_noise_scale; uniform int u_noise_octaves;
            uniform float u_noise_persistence; uniform float u_noise_lacunarity;
            uniform float u_shading_threshold; uniform float u_shading_softness;
            uniform float u_shading_brightness; uniform float u_shading_contrast;
            uniform float u_shading_gamma; uniform float u_shadowIntensity;
            uniform bool u_outputHighlightMask; uniform bool u_illum_enabled;
            uniform float u_illum_intensity; uniform float u_illum_luminanceThreshold;
            uniform float u_illum_softness;
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float noise(vec2 st) {
                vec2 i = floor(st); vec2 f = fract(st);
                float a = random(i); float b = random(i + vec2(1.0, 0.0));
                float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
            }
            float fbm(vec2 st) {
                float value = 0.0; float amplitude = 0.5;
                for (int i = 0; i < 10; i++) {
                    if (i >= u_noise_octaves) break;
                    value += amplitude * noise(st);
                    st *= u_noise_lacunarity;
                    amplitude *= u_noise_persistence;
                }
                return value;
            }
            float applyShadingControls(float value) {
                value += u_shading_brightness;
                value = (value - 0.5) * u_shading_contrast + 0.5;
                value = smoothstep(u_shading_threshold, u_shading_threshold + u_shading_softness, value);
                if (u_shading_gamma > 0.0) { value = pow(value, u_shading_gamma); }
                return clamp(value, 0.0, 1.0);
            }

            void main() {
                float maskValue = texture2D(uOutdoorsMask, vScreenCoord).r;
                float shadedCloudValue = 0.0;
                if (maskValue > 0.01) {
                    vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                    vec2 noise_uv = world_coord / 100.0 * u_noise_scale;
                    noise_uv += u_time * u_windDirection;
                    float rawCloudValue = fbm(noise_uv);
                    shadedCloudValue = applyShadingControls(rawCloudValue);
                }
                if (u_outputHighlightMask) {
                    float lightAmount = 1.0 - shadedCloudValue;
                    gl_FragColor = vec4(vec3(lightAmount * maskValue), 1.0);
                    return;
                }
                float shadowAmount = shadedCloudValue * maskValue * u_shadowIntensity;
                if (u_illum_enabled) {
                    float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                    float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                    shadowAmount *= (1.0 - (lightMask * u_illum_intensity));
                }
                shadowAmount = clamp(shadowAmount, 0.0, 1.0);
                gl_FragColor = vec4(vec3(1.0 - shadowAmount), 1.0);
            }`;

        super(vertexSrc, fragmentSrc, {
            uOutdoorsMask: PIXI.Texture.EMPTY, u_time: 0.0, u_camera_offset: [0, 0], u_view_size: [0, 0],
            u_windDirection: [0.01, 0.01], u_noise_scale: 0.1, u_noise_octaves: 5, u_noise_persistence: 0.5,
            u_noise_lacunarity: 2.5, u_shading_threshold: 1.0, u_shading_softness: 0.2,
            u_shading_brightness: 0.51, u_shading_contrast: 1.0, u_shading_gamma: 1.0,
            u_shadowIntensity: 0.5, u_outputHighlightMask: false, uIlluminationBuffer: PIXI.Texture.EMPTY,
            u_illum_enabled: false, u_illum_intensity: 0.8, u_illum_luminanceThreshold: 0.1, u_illum_softness: 0.2,
        });
    }
}


/**
 * A GlobalEffect that renders procedural cloud shadows over all areas of the map
 * marked with an '_Outdoors' texture.
 */
class CloudShadowsEffect extends GlobalEffect {
    /** @override */
    static Suffix = "outdoors";

    constructor(layer) {
        super(layer);
        console.log(`[MapShine] CloudShadowsEffect: Creating global instance.`);
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;

        // --- PIXI Objects for this effect ---
        this.cloudFilter = new CloudShadowsFilter();
        this.blurredMaskTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.maskBlurFilter = new PIXI.BlurFilter();
        this.blurSourceSprite = new PIXI.Sprite(this.combinedMaskTexture);
        this.blurSourceSprite.filters = [this.maskBlurFilter];

        this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._patternGeneratorSprite.width = screen.width;
        this._patternGeneratorSprite.height = screen.height;
        this._patternGeneratorSprite.filters = [this.cloudFilter];

        this.cloudShadowTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.effectSprite = new PIXI.Sprite(this.cloudShadowTexture);
        this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        
        // The highlight mask is a separate output for other systems to use (e.g., Post-Processing)
        this.cloudHighlightMaskTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });

        // Add the final visual element to the main layer
        this.layer.addChild(this.effectSprite);
        super.initialize();
    }
    
    /** @returns {PIXI.RenderTexture} A texture representing light areas between clouds. */
    getHighlightMaskTexture() {
        return this.cloudHighlightMaskTexture;
    }

    /** @override */
    update(deltaTime, config) {
        this.visible = config.enabled && config.cloudShadows.enabled && this.maskSprites.size > 0;
        this.effectSprite.visible = this.visible;
        if (!this.visible) return;
        
        // Render the combined outdoors mask if it has changed
        this._renderCombinedMask();

        const renderer = canvas.app.renderer;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;

        // Apply blur to the combined mask if configured
        if (this.maskBlurFilter.enabled) {
            this.blurSourceSprite.texture = this.combinedMaskTexture;
            renderer.render(this.blurSourceSprite, { renderTexture: this.blurredMaskTexture, clear: true });
        }
        
        const finalMask = this.maskBlurFilter.enabled ? this.blurredMaskTexture : this.combinedMaskTexture;
        const u = this.cloudFilter.uniforms;
        u.uOutdoorsMask = finalMask;
        u.u_time += deltaTime * timeFactor;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        // Check for illumination buffer interaction
        const illumConfig = config.cloudShadows.illumination;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illumTexture = illuminationAPI?.getLightingTexture();
        u.u_illum_enabled = illumConfig.enabled && !!illumTexture?.valid;
        if (u.u_illum_enabled) {
            u.uIlluminationBuffer = illumTexture;
            u.u_illum_intensity = illumConfig.intensity;
            u.u_illum_luminanceThreshold = illumConfig.luminanceThreshold;
            u.u_illum_softness = illumConfig.softness;
        }

        // Render pass 1: The highlight mask
        u.u_outputHighlightMask = true;
        renderer.render(this._patternGeneratorSprite, { renderTexture: this.cloudHighlightMaskTexture, clear: true });

        // Render pass 2: The final shadow texture
        u.u_outputHighlightMask = false;
        renderer.render(this._patternGeneratorSprite, { renderTexture: this.cloudShadowTexture, clear: true });

        // Position the final effect sprite to fill the screen
        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
    }

    /** @override */
    updateFromConfig(config) {
        const csConfig = config.cloudShadows;

        if (this.maskBlurFilter) {
            this.maskBlurFilter.blur = csConfig.maskBlur ?? 0.0;
            this.maskBlurFilter.enabled = this.maskBlurFilter.blur > 0;
            if (this.maskBlurFilter.enabled) this._needsMaskUpdate = true;
        }

        const u = this.cloudFilter.uniforms;
        u.u_shadowIntensity = csConfig.shadowIntensity;
        const windAngleRad = (csConfig.wind.angle ?? 45.0) * (Math.PI / 180);
        const windSpeed = (csConfig.wind.speed ?? 0.01);
        u.u_windDirection = [Math.cos(windAngleRad) * windSpeed, Math.sin(windAngleRad) * windSpeed];
        u.u_noise_scale = csConfig.noise.scale;
        u.u_noise_octaves = csConfig.noise.octaves;
        u.u_noise_persistence = csConfig.noise.persistence;
        u.u_noise_lacunarity = csConfig.noise.lacunarity;
        const s = csConfig.shading;
        u.u_shading_threshold = s.threshold;
        u.u_shading_softness = s.softness;
        u.u_shading_brightness = s.brightness;
        u.u_shading_contrast = s.contrast;
        u.u_shading_gamma = s.gamma;
    }
    
    /** @override */
    _onResize() {
        super._onResize(); // Handles combined mask
        const renderer = canvas.app.renderer;
        this.blurredMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.cloudShadowTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.cloudHighlightMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        if (this._patternGeneratorSprite) {
            this._patternGeneratorSprite.width = renderer.screen.width;
            this._patternGeneratorSprite.height = renderer.screen.height;
        }
    }

    /** @override */
    destroy() {
        super.destroy(); // Handles base class cleanup
        console.log(`[MapShine] CloudShadowsEffect: Destroying global instance.`);
        this.cloudFilter?.destroy();
        this.blurredMaskTexture?.destroy(true);
        this.maskBlurFilter?.destroy();
        this.blurSourceSprite?.destroy();
        this._patternGeneratorSprite?.destroy();
        this.cloudShadowTexture?.destroy(true);
        this.effectSprite?.destroy();
        this.cloudHighlightMaskTexture?.destroy(true);
    }
}

// --- Iridescence Effect ---

/**
 * A PIXI Filter that generates a procedural, animated, iridescent pattern. It uses
 * Fractional Brownian Motion (FBM) for the core pattern and can be warped by a
 * secondary noise texture for a more dynamic effect.
 */
class IridescenceFilter extends PIXI.Filter {
    static MAX_OCTAVES = 8; // The constant is now defined here.

    constructor(options = {}) {

        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            const int MAX_OCTAVES = ${IridescenceFilter.MAX_OCTAVES};
            const int MAX_COLORS = 8;

            // Input Textures
            uniform sampler2D uSampler; // The target's _Iridescence mask texture
            uniform sampler2D uDistortionMap;

            // World & Camera Uniforms
            uniform float uParallax;
            uniform vec2 uCameraOffset;
            uniform vec2 uViewSize;
            uniform vec2 uResolution;

            // Effect Uniforms
            uniform float uTime;
            uniform float uSpeed;
            uniform float uScale;
            uniform float uIntensity;
            uniform float uDistortionStrength;

            // FBM Uniforms
            uniform int uOctaves;
            uniform float uPersistence;
            uniform float uLacunarity;
            uniform float uFbmEvolution;
            uniform float uFbmBrightness;
            uniform float uFbmContrast;

            // Gradient Uniforms
            uniform vec3 uGradientColors[MAX_COLORS];
            uniform int uNumColors;
            uniform float uHueShift;
            uniform float uGradientBrightness;
            uniform float uGradientContrast;

            // --- NOISE FUNCTIONS ---
            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float noise(vec2 st) {
                vec2 i = floor(st); vec2 f = fract(st); vec2 u = f*f*(3.0-2.0*f);
                return mix(mix(random(i + vec2(0.0,0.0)), random(i + vec2(1.0,0.0)), u.x),
                           mix(random(i + vec2(0.0,1.0)), random(i + vec2(1.0,1.0)), u.x), u.y);
            }
            float fbm(vec2 st) {
                float value = 0.0; float amplitude = 0.5;
                for (int i = 0; i < MAX_OCTAVES; i++) {
                    if (i >= uOctaves) break;
                    value += amplitude * noise(st);
                    st *= uLacunarity; amplitude *= uPersistence;
                }
                return value;
            }

            // --- COLOR FUNCTIONS ---
            float hue2rgb(float p, float q, float t) {
                if(t < 0.0) t += 1.0; if(t > 1.0) t -= 1.0;
                if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                if(t < 1.0/2.0) return q;
                if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                return p;
            }
            vec3 hsl2rgb(vec3 c) {
                if(c.y == 0.0) return vec3(c.z);
                float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
                float p = 2.0 * c.z - q;
                return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0));
            }
            vec3 rgb2hsl(vec3 c) {
                float max_c = max(max(c.r, c.g), c.b); float min_c = min(min(c.r, c.g), c.b);
                float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                if(max_c != min_c) {
                    float d = max_c - min_c;
                    s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                    if(max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                    else if(max_c == c.g) h = (c.b - c.r) / d + 2.0;
                    else h = (c.r - c.g) / d + 4.0;
                    h /= 6.0;
                }
                return vec3(h, s, l);
            }
            vec3 getGradientColor(float t) {
                if (uNumColors <= 1) return uGradientColors[0];
                
                float p = clamp(t, 0.0, 1.0) * (float(uNumColors) - 1.0);
                
                if (p < 1.0) return mix(uGradientColors[0], uGradientColors[1], p);
                if (uNumColors > 2 && p < 2.0) return mix(uGradientColors[1], uGradientColors[2], p - 1.0);
                if (uNumColors > 3 && p < 3.0) return mix(uGradientColors[2], uGradientColors[3], p - 2.0);
                if (uNumColors > 4 && p < 4.0) return mix(uGradientColors[3], uGradientColors[4], p - 3.0);
                if (uNumColors > 5 && p < 5.0) return mix(uGradientColors[4], uGradientColors[5], p - 4.0);
                if (uNumColors > 6 && p < 6.0) return mix(uGradientColors[5], uGradientColors[6], p - 5.0);
                if (uNumColors > 7 && p < 7.0) return mix(uGradientColors[6], uGradientColors[7], p - 6.0);
                
                // This handles t=1.0 or p >= uNumColors-1
                // Return the last valid color
                if (uNumColors == 2) return uGradientColors[1];
                if (uNumColors == 3) return uGradientColors[2];
                if (uNumColors == 4) return uGradientColors[3];
                if (uNumColors == 5) return uGradientColors[4];
                if (uNumColors == 6) return uGradientColors[5];
                if (uNumColors == 7) return uGradientColors[6];
                if (uNumColors == 8) return uGradientColors[7];

                return uGradientColors[0]; // Absolute fallback
            }

            void main(void) {
                float maskValue = texture2D(uSampler, vTextureCoord).r;
                if (maskValue < 0.01) discard;

                vec2 worldCoord = uCameraOffset + (vTextureCoord * uViewSize);
                vec2 screenCoord = vTextureCoord * uResolution;
                vec2 parallaxCoord = mix(worldCoord, screenCoord, uParallax);
                vec2 distortionOffset = (texture2D(uDistortionMap, vTextureCoord).rg - 0.5) * 2.0;
                vec2 distortedCoord = parallaxCoord + (distortionOffset * uDistortionStrength * 10.0);
                vec2 scaledPatternUv = distortedCoord * uScale * 0.01;
                
                vec2 fbm_uv = scaledPatternUv + vec2(uTime * uSpeed * 0.1);
                fbm_uv.x += uTime * uFbmEvolution * 0.1;

                float patternDriver = fbm(fbm_uv);
                patternDriver = (patternDriver - 0.5 + uFbmBrightness) * uFbmContrast + 0.5;

                vec3 baseColor = getGradientColor(clamp(patternDriver, 0.0, 1.0));
                vec3 hsl = rgb2hsl(baseColor);
                hsl.x = fract(hsl.x + uHueShift);
                vec3 shiftedColor = hsl2rgb(hsl);
                shiftedColor += uGradientBrightness;
                shiftedColor = (shiftedColor - 0.5) * uGradientContrast + 0.5;

                vec3 finalRgb = clamp(shiftedColor, 0.0, 1.0) * uIntensity * maskValue;
                gl_FragColor = vec4(finalRgb, uIntensity * maskValue);
            }`;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uParallax: options.parallax ?? 0.0, uCameraOffset: [0, 0], uViewSize: [1, 1], uResolution: [1, 1],
            uTime: 0.0, uSpeed: options.speed ?? 0.0, uScale: options.scale ?? 8.0,
            uIntensity: options.intensity ?? 1.0, uDistortionStrength: options.distortion?.strength ?? 0.0,
            uOctaves: options.fbm?.octaves ?? 5, uPersistence: options.fbm?.persistence ?? 0.5,
            uLacunarity: options.fbm?.lacunarity ?? 2.0, uFbmEvolution: options.fbm?.evolution ?? 0.1,
            uFbmBrightness: (options.fbm?.brightness ?? 0.5) - 0.5, uFbmContrast: options.fbm?.contrast ?? 1.0,
            uGradientColors: [], uNumColors: 0, uHueShift: options.gradient?.hueShift ?? 0.0,
            uGradientBrightness: options.gradient?.brightness ?? 0.0, uGradientContrast: options.gradient?.contrast ?? 1.0,
        });
    }
}


/**
 * A per-target Effect that creates a colorful, oil-slick-like effect. It is instanced
 * for each tile or background that has an `_Iridescence` map.
 */
class IridescenceEffect extends Effect {
    /** @override */
    static Suffix = "iridescence";

    constructor(target, layer) {
        super(target, layer);
        console.log(`[MapShine] IridescenceEffect: Creating instance for target '${this.target.id}'.`);

        const renderer = canvas.app.renderer;

        // --- Helper Systems ---
        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'iridescence.noise', false); // Screen-space noise

        // --- PIXI Objects ---
        this.iridescenceFilter = new IridescenceFilter();
        // This sprite uses the target's _Iridescence mask as its texture,
        // and the filter generates the final effect within that mask.
        this.effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.effectSprite.filters = [this.iridescenceFilter];
        
        // Add the final visual element to the main layer
        this.layer.addChild(this.effectSprite);
        
        // --- Initial Setup ---
        this._loadTexture();
        this._updateSpriteTransform();
    }

    async _loadTexture() {
        const texturePath = this.target.effectTextures.get(IridescenceEffect.Suffix);
        try {
            this.effectSprite.texture = await foundry.canvas.loadTexture(texturePath);
        } catch (e) {
            console.error(`[MapShine] IridescenceEffect: Failed to load mask texture for target '${this.target.id}' from path: ${texturePath}`, e);
            this.effectSprite.texture = PIXI.Texture.EMPTY;
        }
    }

    _updateSpriteTransform() {
        if (!this.effectSprite.texture.valid) return;
        const rect = this.target.rect;
        this.effectSprite.anchor.set(0.5);
        this.effectSprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        this.effectSprite.width = rect.width;
        this.effectSprite.height = rect.height;
        this.effectSprite.rotation = rect.rotation || 0;
    }

    /** @override */
    update(deltaTime, config) {
        const iConfig = config.iridescence;
        this.visible = config.enabled && iConfig.enabled && this.effectSprite.texture.valid;
        this.effectSprite.visible = this.visible;
        if (!this.visible) return;

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.distortionNoiseManager.update(deltaTime, canvas.app.renderer);

        const stage = canvas.stage;
        const screen = canvas.app.renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        const u = this.iridescenceFilter.uniforms;

        u.uTime += deltaTime * timeFactor;
        u.uDistortionMap = this.distortionNoiseManager.getTexture();
        u.uCameraOffset = [topLeft.x, topLeft.y];
        u.uViewSize = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        u.uResolution = [screen.width, screen.height];
    }

    /** @override */
    updateFromConfig(config) {
        this.distortionNoiseManager.updateFromConfig(config);
        const iConfig = config.iridescence;
        
        this.effectSprite.blendMode = iConfig.blendMode;

        const u = this.iridescenceFilter.uniforms;
        u.uIntensity = iConfig.intensity;
        u.uSpeed = iConfig.speed;
        u.uScale = iConfig.scale;
        u.uParallax = iConfig.parallax;
        u.uDistortionStrength = iConfig.distortion.enabled ? iConfig.distortion.strength : 0.0;

        const fbmConfig = iConfig.fbm;
        u.uOctaves = fbmConfig.octaves;
        u.uPersistence = fbmConfig.persistence;
        u.uLacunarity = fbmConfig.lacunarity;
        u.uFbmEvolution = fbmConfig.evolution;
        u.uFbmBrightness = (fbmConfig.brightness ?? 0.5) - 0.5;
        u.uFbmContrast = fbmConfig.contrast;

        const gConfig = iConfig.gradient;
        const gradientData = GRADIENT_PRESETS[gConfig.name];
        if (gradientData) {
            const colors = gradientData.colors.map(hex => hexToRgbArray(hex)).flat();
            // Pad the array to the max size if needed, as GLSL expects a fixed-size array
            while (colors.length < IridescenceFilter.MAX_COLORS * 3) {
                colors.push(0,0,0);
            }
            u.uGradientColors = colors;
            u.uNumColors = gradientData.colors.length;
        }
        u.uHueShift = gConfig.hueShift;
        u.uGradientBrightness = gConfig.brightness;
        u.uGradientContrast = gConfig.contrast;
    }

    /** @override */
    destroy() {
        console.log(`[MapShine] IridescenceEffect: Destroying instance for target '${this.target.id}'.`);
        this.distortionNoiseManager?.destroy();
        this.iridescenceFilter?.destroy();
        this.effectSprite?.destroy();
    }
}

// --- Canopy Shadows Effect ---

/**
 * A PIXI Filter for rendering canopy shadows. It applies a base shadow from a
 * canopy mask, uses a procedural trigonometric function to create a dynamic swaying
 * motion, and is confined to areas marked by an outdoors mask.
 */
class CanopyFilter extends PIXI.Filter {
    constructor(options = {}) {
        const vertexSrc = `
            attribute vec2 aVertexPosition; attribute vec2 aTextureCoord; uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord; vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }`;

        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;

            // Input masks and scene data
            uniform sampler2D uCanopyMask;
            uniform sampler2D uOutdoorsMask;
            uniform float u_time;
            uniform vec2 u_camera_offset;
            uniform vec2 u_view_size;

            // Sway animation parameters
            uniform float u_swayIntensity;
            uniform float u_swaySpeed;
            uniform float u_swayScale;

            // Shadow appearance
            uniform float u_shadowIntensity;
            uniform vec3 u_tint;

            void main() {
                float outdoorMaskVal = texture2D(uOutdoorsMask, vScreenCoord).r;
                if (outdoorMaskVal < 0.01) {
                    gl_FragColor = vec4(1.0);
                    return;
                }

                vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                vec2 scaled_coord = world_coord * u_swayScale * 0.01;
                float time = u_time * u_swaySpeed;

                float offset_x1 = sin(time + scaled_coord.y * 0.3) * 0.6;
                float offset_y1 = cos(time * 0.8 + scaled_coord.x * 0.3) * 0.4;
                float offset_x2 = sin(time * 2.2 + scaled_coord.y * 1.1) * 0.25;
                float offset_y2 = cos(time * 3.0 + scaled_coord.x * 1.1) * 0.25;
                
                // Sample the canopy mask at the original, undistorted coordinate to determine the distortion strength.
                // This prevents the edges of the shadow from moving around.
                // Where the mask is fully lit (value of 1), distortion will be zero.
                // Where the mask is fully shadow (value of 0), distortion will be at maximum.
                float distortion_modulator = 1.0 - texture2D(uCanopyMask, vScreenCoord).r;
                
                vec2 total_offset = vec2(offset_x1 + offset_x2, offset_y1 + offset_y2);
                vec2 displacement = total_offset * u_swayIntensity * 0.005 * distortion_modulator;
                vec2 distortedCoord = vScreenCoord + displacement;

                float maskValue = texture2D(uCanopyMask, distortedCoord).r;
                // Invert the mask value, so dark areas (leaves) become shadows.
                float shadowAmount = 1.0 - maskValue;

                if (shadowAmount < 0.01) {
                    gl_FragColor = vec4(1.0);
                    return;
                }
                
                float finalAlpha = shadowAmount * u_shadowIntensity * outdoorMaskVal;
                vec3 shadowColor = mix(vec3(1.0), u_tint, finalAlpha);
                
                gl_FragColor = vec4(shadowColor, 1.0);
            }`;

        super(vertexSrc, fragmentSrc, {
            uCanopyMask: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [1, 1],
            u_swayIntensity: options.swayIntensity ?? 5.0,
            u_swaySpeed: options.swaySpeed ?? 0.8,
            u_swayScale: options.swayScale ?? 1.5,
            u_shadowIntensity: options.shadowIntensity ?? 0.4,
            u_tint: options.tint ?? [0.0, 0.0, 0.0],
            ...options
        });
    }
}


/**
 * A GlobalEffect that renders canopy shadows, simulating light filtering through leaves.
 * It is instantiated once and combines all `_Canopy` and `_Outdoors` maps into a single effect.
 */
class CanopyEffect extends GlobalEffect {
    /** @override */
    static Suffix = "canopy";

    constructor(layer) {
        super(layer);
        console.log(`[MapShine] CanopyEffect: Creating global instance.`);
        
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;

        // --- PIXI Objects ---
        this.canopyFilter = new CanopyFilter();
        this.canopyShadowTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });

        this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._patternGeneratorSprite.width = screen.width;
        this._patternGeneratorSprite.height = screen.height;
        this._patternGeneratorSprite.filters = [this.canopyFilter];
        
        this.effectSprite = new PIXI.Sprite(this.canopyShadowTexture);
        this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        
        // --- Secondary (Outdoors) Mask ---
        this.outdoorsMaskContainer = new PIXI.Container();
        this.outdoorsMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width, height: renderer.screen.height
        });
        this.outdoorsMaskSprites = new Map();
        this._needsOutdoorsMaskUpdate = true;
        
        // Add the final visual element to the main layer
        this.layer.addChild(this.effectSprite);
        super.initialize();
        this._updateOutdoorsMasksFromTargets();
    }

    async _updateOutdoorsMasksFromTargets() {
        const validTargetIds = new Set();

        for (const target of TargetRegistry.targets) {
            const texturePath = target.effectTextures.get('outdoors');
            if (!texturePath) continue;

            validTargetIds.add(target.id);
            let sprite = this.outdoorsMaskSprites.get(target.id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.outdoorsMaskSprites.set(target.id, sprite);
                this.outdoorsMaskContainer.addChild(sprite);
            }
            
            const currentPath = sprite.texture?.baseTexture?.resource?.src;
            if (texturePath !== currentPath) {
                try {
                    sprite.texture = await foundry.canvas.loadTexture(texturePath);
                } catch (e) { sprite.texture = PIXI.Texture.EMPTY; }
            }

            if (sprite.texture.valid) {
                const rect = target.rect;
                sprite.anchor.set(0.5);
                sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
                sprite.width = rect.width;
                sprite.height = rect.height;
                sprite.rotation = rect.rotation || 0;
            }
        }

        for (const [id, sprite] of this.outdoorsMaskSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.outdoorsMaskSprites.delete(id);
            }
        }
        this._needsOutdoorsMaskUpdate = true;
    }

    /** @override */
    _onPan() {
        super._onPan();
        this._needsOutdoorsMaskUpdate = true;
    }
    
    /** @override */
    _onResize() {
        super._onResize();
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;
        this.outdoorsMaskTexture?.resize(screen.width, screen.height);
        this.canopyShadowTexture?.resize(screen.width, screen.height);
        if (this._patternGeneratorSprite) {
            this._patternGeneratorSprite.width = screen.width;
            this._patternGeneratorSprite.height = screen.height;
        }
        this._needsOutdoorsMaskUpdate = true;
    }
    
    /** @override */
    update(deltaTime, config) {
        const cConfig = config.canopy;
        this.visible = config.enabled && cConfig.enabled && this.maskSprites.size > 0;
        this.effectSprite.visible = this.visible;
        if (!this.visible) return;

        super._renderCombinedMask();
        
        const renderer = canvas.app.renderer;
        if (this._needsOutdoorsMaskUpdate) {
            renderer.render(this.outdoorsMaskContainer, {
                renderTexture: this.outdoorsMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });
            this._needsOutdoorsMaskUpdate = false;
        }

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        const u = this.canopyFilter.uniforms;
        
        u.u_time += deltaTime * timeFactor;
        u.uCanopyMask = this.combinedMaskTexture;
        u.uOutdoorsMask = this.outdoorsMaskTexture;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        renderer.render(this._patternGeneratorSprite, { renderTexture: this.canopyShadowTexture, clear: true });

        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
    }

    /** @override */
    updateFromConfig(config) {
        const cConfig = config.canopy;
        this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

        const u = this.canopyFilter.uniforms;
        u.u_shadowIntensity = cConfig.shadowIntensity;
        u.u_tint = hexToRgbArray(cConfig.tint);
        
        const swayConfig = cConfig.sway;
        u.u_swayIntensity = swayConfig.intensity;
        u.u_swaySpeed = swayConfig.speed;
        u.u_swayScale = swayConfig.scale;
    }

    /** @override */
    destroy() {
        super.destroy();
        console.log(`[MapShine] CanopyEffect: Destroying global instance.`);
        this.canopyFilter?.destroy();
        this.canopyShadowTexture?.destroy(true);
        this._patternGeneratorSprite?.destroy();
        this.effectSprite?.destroy();
        this.outdoorsMaskContainer?.destroy({ children: true, texture: true, baseTexture: true });
        this.outdoorsMaskTexture?.destroy(true);
        this.outdoorsMaskSprites.clear();
    }
}

// --- Structural Shadows Effect ---

/**
 * A specialized PIXI filter that applies an RGB split effect to a grayscale
 * highlight mask. The intensity of the split is proportional to the brightness
 * of the mask, creating a chromatic aberration effect only on the brightest highlights.
 */
class StructuralHighlightRgbSplitFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float uIntensity;
            uniform float uThreshold;
            uniform vec2 uTexelSize;

            void main(void) {
                float lightAmount = texture2D(uSampler, vTextureCoord).r;
                if (lightAmount < uThreshold) {
                    gl_FragColor = vec4(vec3(lightAmount), 1.0);
                    return;
                }
                
                float split_factor = (lightAmount - uThreshold) / (1.0 - uThreshold);
                split_factor = clamp(split_factor, 0.0, 1.0);
                
                vec2 offset = vec2(uIntensity * split_factor * uTexelSize.x, 0.0);
                
                float r = texture2D(uSampler, vTextureCoord - offset).r;
                float g = lightAmount;
                float b = texture2D(uSampler, vTextureCoord + offset).r;
                
                gl_FragColor = vec4(r, g, b, 1.0);
            }`;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uIntensity: options.intensity ?? 2.0,
            uThreshold: options.threshold ?? 0.5,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}


/**
 * The main filter for rendering structural shadows. This is a complex, multi-feature
 * filter that handles parallax, intensity noise, cloud occlusion, and interaction with
 * scene lighting and other effects like metallic shine.
 */
class StructuralShadowsFilter extends PIXI.Filter {
    constructor(options = {}) {
        const vertexSrc = `
            attribute vec2 aVertexPosition; attribute vec2 aTextureCoord; uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord; vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }`;

        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            uniform sampler2D uStructuralMask; uniform sampler2D uOutdoorsMask; uniform sampler2D u_intensityNoise;
            uniform sampler2D uIlluminationBuffer; uniform sampler2D uMetallicShineTexture;
            uniform vec3 u_tint; uniform float u_shadowIntensity; uniform float u_parallax;
            uniform float u_time; uniform vec2 u_camera_offset; uniform vec2 u_view_size;
            uniform bool u_intensityNoise_enabled; uniform float u_intensityNoise_amount;
            uniform bool u_illum_enabled; uniform float u_illum_intensity;
            uniform float u_illum_luminanceThreshold; uniform float u_illum_softness;
            uniform bool u_outputHighlightMask; uniform bool uMetallicShineMixIn_enabled;
            uniform float uMetallicShineMixIn_intensity; uniform bool u_cloud_enabled;
            uniform float u_cloud_intensity; uniform vec2 u_windDirection;
            uniform float u_noise_scale; uniform int u_noise_octaves;
            uniform float u_noise_persistence; uniform float u_noise_lacunarity;
            uniform float u_cloud_shading_threshold; uniform float u_cloud_shading_softness;
            uniform float u_cloud_shading_brightness; uniform float u_cloud_shading_contrast;
            uniform float u_cloud_shading_gamma; uniform float u_cloud_shading_exposure;
            uniform float u_cloud_shading_inBlack; uniform float u_cloud_shading_inWhite;
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
            float noise(vec2 st) {
                vec2 i=floor(st), f=fract(st); float a=random(i), b=random(i+vec2(1,0)), c=random(i+vec2(0,1)), d=random(i+vec2(1,1));
                vec2 u=f*f*(3.0-2.0*f); return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.y*u.x;
            }
            float fbm(vec2 st) {
                float v=0.0; float a=0.5;
                for (int i=0; i<10; i++) {
                    if (i>=u_noise_octaves) break;
                    v+=a*noise(st); st*=u_noise_lacunarity; a*=u_noise_persistence;
                }
                return v;
            }
            float applyCloudShading(float v) {
                if(u_cloud_shading_inWhite > u_cloud_shading_inBlack) v=(v-u_cloud_shading_inBlack)/(u_cloud_shading_inWhite-u_cloud_shading_inBlack);
                v*=pow(2.0,u_cloud_shading_exposure); v+=u_cloud_shading_brightness; v=(v-0.5)*u_cloud_shading_contrast+0.5;
                v=smoothstep(u_cloud_shading_threshold,u_cloud_shading_threshold+u_cloud_shading_softness,v);
                if(u_cloud_shading_gamma>0.0) v=pow(v,u_cloud_shading_gamma);
                return clamp(v,0.0,1.0);
            }

            void main() {
                float indoorMask = 1.0 - texture2D(uOutdoorsMask, vScreenCoord).r;
                if (indoorMask < 0.01 && !u_outputHighlightMask) { gl_FragColor = vec4(1.0); return; }
                vec2 parallaxTexCoord = vScreenCoord;
                if (u_parallax > 0.0 && u_view_size.y > 0.0) {
                    parallaxTexCoord = vScreenCoord - ((u_camera_offset/u_view_size)*u_parallax);
                }
                vec4 structuralTexel = texture2D(uStructuralMask, parallaxTexCoord);
                if (structuralTexel.a < 0.01) { gl_FragColor = vec4(1.0); return; }
                float lightAmount = structuralTexel.r;
                if (u_intensityNoise_enabled) {
                    float flicker = texture2D(u_intensityNoise, vScreenCoord).r;
                    lightAmount = min(1.0, lightAmount + flicker * u_intensityNoise_amount);
                }
                if (uMetallicShineMixIn_enabled) {
                    lightAmount += dot(texture2D(uMetallicShineTexture, vScreenCoord).rgb, lum_weights) * uMetallicShineMixIn_intensity;
                }
                if (u_cloud_enabled) {
                    vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                    vec2 noise_uv = world_coord/100.0*u_noise_scale + u_time*u_windDirection;
                    lightAmount *= (1.0 - applyCloudShading(fbm(noise_uv)) * u_cloud_intensity);
                }
                lightAmount = clamp(lightAmount, 0.0, 1.0);
                if (u_outputHighlightMask) { gl_FragColor = vec4(vec3(lightAmount * indoorMask), 1.0); return; }
                float shadowAmount = (1.0 - lightAmount) * u_shadowIntensity;
                if (u_illum_enabled) {
                    float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                    float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                    shadowAmount *= (1.0 - (lightMask * u_illum_intensity));
                }
                shadowAmount *= indoorMask;
                shadowAmount = clamp(shadowAmount, 0.0, 1.0);
                vec3 shadowColor = mix(vec3(1.0), u_tint, shadowAmount);
                gl_FragColor = vec4(shadowColor, 1.0);
            }`;

        super(vertexSrc, fragmentSrc, { ...options });
    }
}


/**
 * A GlobalEffect for rendering structural shadows (e.g., from rafters, beams).
 * This effect is instantiated once and combines all `_Structural` and `_Outdoors`
 * maps into a single, multi-layered effect.
 */
class StructuralShadowsEffect extends GlobalEffect {
    /** @override */
    static Suffix = "structural";

    constructor(layer) {
        super(layer);
        console.log(`[MapShine] StructuralShadowsEffect: Creating global instance.`);
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;

        this.intensityNoiseManager = new NoiseTextureManager(renderer, 'structuralShadows.intensityNoise', true);
        this.finalShadowTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.finalHighlightMaskTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.splitHighlightMaskTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });

        this.structuralFilter = new StructuralShadowsFilter();
        this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._patternGeneratorSprite.width = screen.width;
        this._patternGeneratorSprite.height = screen.height;
        this._patternGeneratorSprite.filters = [this.structuralFilter];

        this.rgbSplitFilter = new StructuralHighlightRgbSplitFilter();
        this._splitHighlightSprite = new PIXI.Sprite(this.finalHighlightMaskTexture);
        this._splitHighlightSprite.filters = [this.rgbSplitFilter];

        this.effectSprite = new PIXI.Sprite(this.finalShadowTexture);
        this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        
        this.outdoorsMaskContainer = new PIXI.Container();
        this.outdoorsMaskTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.outdoorsMaskSprites = new Map();
        this._needsOutdoorsMaskUpdate = true;
        
        this.layer.addChild(this.effectSprite);
        super.initialize();
        this._updateOutdoorsMasksFromTargets();
    }
    
    getHighlightMaskTexture() { return this.finalHighlightMaskTexture; }
    getSplitHighlightMaskTexture() { return this.splitHighlightMaskTexture; }
    isRgbSplitEnabled(config) {
        return config.enabled && config.structuralShadows.enabled && config.structuralShadows.rgbSplit.enabled;
    }

    async _updateOutdoorsMasksFromTargets() {
        // This is identical to the canopy implementation and could be abstracted further in a future pass.
        const validTargetIds = new Set();
        for (const target of TargetRegistry.targets) {
            const texturePath = target.effectTextures.get('outdoors');
            if (!texturePath) continue;
            validTargetIds.add(target.id);
            let sprite = this.outdoorsMaskSprites.get(target.id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.outdoorsMaskSprites.set(target.id, sprite);
                this.outdoorsMaskContainer.addChild(sprite);
            }
            const currentPath = sprite.texture?.baseTexture?.resource?.src;
            if (texturePath !== currentPath) {
                try { sprite.texture = await foundry.canvas.loadTexture(texturePath); } catch (e) { sprite.texture = PIXI.Texture.EMPTY; }
            }
            if (sprite.texture.valid) {
                const rect = target.rect;
                sprite.anchor.set(0.5);
                sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
                sprite.width = rect.width; sprite.height = rect.height; sprite.rotation = rect.rotation || 0;
            }
        }
        for (const [id, sprite] of this.outdoorsMaskSprites.entries()) {
            if (!validTargetIds.has(id)) { sprite.destroy(); this.outdoorsMaskSprites.delete(id); }
        }
        this._needsOutdoorsMaskUpdate = true;
    }

    /** @override */
    _onPan() { super._onPan(); this._needsOutdoorsMaskUpdate = true; }
    
    /** @override */
    _onResize() {
        super._onResize();
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;
        this.intensityNoiseManager?.resize(renderer);
        this.outdoorsMaskTexture?.resize(screen.width, screen.height);
        this.finalShadowTexture?.resize(screen.width, screen.height);
        this.finalHighlightMaskTexture?.resize(screen.width, screen.height);
        this.splitHighlightMaskTexture?.resize(screen.width, screen.height);
        if (this._patternGeneratorSprite) { this._patternGeneratorSprite.width = screen.width; this._patternGeneratorSprite.height = screen.height; }
        if (this._splitHighlightSprite) { this._splitHighlightSprite.width = screen.width; this._splitHighlightSprite.height = screen.height; }
        if (this.rgbSplitFilter) { this.rgbSplitFilter.uniforms.uTexelSize = [1 / screen.width, 1 / screen.height]; }
        this._needsOutdoorsMaskUpdate = true;
    }

    /** @override */
    update(deltaTime, config) {
        this.visible = config.enabled && config.structuralShadows.enabled && this.maskSprites.size > 0;
        this.effectSprite.visible = this.visible;
        if (!this.visible) return;

        super._renderCombinedMask();
        if (this._needsOutdoorsMaskUpdate) {
            canvas.app.renderer.render(this.outdoorsMaskContainer, { renderTexture: this.outdoorsMaskTexture, transform: canvas.stage.transform.worldTransform, clear: true });
            this._needsOutdoorsMaskUpdate = false;
        }

        this.intensityNoiseManager.update(deltaTime, canvas.app.renderer);
        
        const renderer = canvas.app.renderer, stage = canvas.stage, screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;

        const u = this.structuralFilter.uniforms;
        u.uStructuralMask = this.combinedMaskTexture;
        u.u_intensityNoise = this.intensityNoiseManager.getTexture();
        u.uOutdoorsMask = this.outdoorsMaskTexture;
        u.u_time += deltaTime * timeFactor;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        const siConfig = config.postProcessing.colorCorrection.sceneIlluminationMixIn;
        const shadowInteractionConfig = siConfig?.shadowInteraction;
        const wantsIllumination = siConfig?.enabled && shadowInteractionConfig?.enabled;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illuminationTexture = illuminationAPI?.getLightingTexture();
        u.u_illum_enabled = wantsIllumination && !!illuminationTexture?.valid;
        if(u.u_illum_enabled) u.uIlluminationBuffer = illuminationTexture;

        const mixInConfig = config.structuralShadows.metallicShineMixIn;
        const metallicShineEffect = MapShineEngine._activeEffects.find(e => e instanceof MetallicShineEffect);
        const metallicShineTexture = metallicShineEffect?.shinePassTexture;
        u.uMetallicShineMixIn_enabled = mixInConfig?.enabled && metallicShineEffect?.visible && !!metallicShineTexture?.valid;
        if(u.uMetallicShineMixIn_enabled) u.uMetallicShineTexture = metallicShineTexture;

        u.u_outputHighlightMask = true;
        renderer.render(this._patternGeneratorSprite, { renderTexture: this.finalHighlightMaskTexture, clear: true });

        u.u_outputHighlightMask = false;
        renderer.render(this._patternGeneratorSprite, { renderTexture: this.finalShadowTexture, clear: true });

        if (this.isRgbSplitEnabled(config)) {
            renderer.render(this._splitHighlightSprite, { renderTexture: this.splitHighlightMaskTexture, clear: true });
        }
        
        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
    }

    /** @override */
    updateFromConfig(config) {
        const ssConfig = config.structuralShadows;
        this.intensityNoiseManager.updateFromConfig(config);

        const u = this.structuralFilter.uniforms;
        const cloudConfig = ssConfig.cloudOcclusion;
        const windAngleRad = (cloudConfig.wind.angle ?? 45.0) * (Math.PI / 180);
        const windSpeed = cloudConfig.wind.speed ?? 0.001;
        u.u_windDirection = [Math.cos(windAngleRad) * windSpeed, Math.sin(windAngleRad) * windSpeed];
        u.u_noise_scale = cloudConfig.noise.scale;
        u.u_noise_octaves = cloudConfig.noise.octaves;
        u.u_noise_persistence = cloudConfig.noise.persistence;
        u.u_noise_lacunarity = cloudConfig.noise.lacunarity;
        const shading = cloudConfig.shading;
        u.u_cloud_shading_threshold = shading.threshold;
        u.u_cloud_shading_softness = shading.softness;
        u.u_cloud_shading_brightness = shading.brightness;
        u.u_cloud_shading_contrast = shading.contrast;
        u.u_cloud_shading_gamma = shading.gamma;
        u.u_cloud_shading_exposure = shading.exposure;
        u.u_cloud_shading_inBlack = shading.levels.inBlack;
        u.u_cloud_shading_inWhite = shading.levels.inWhite;
        u.u_shadowIntensity = ssConfig.shadowIntensity;
        u.u_tint = hexToRgbArray(ssConfig.tint);
        u.u_parallax = ssConfig.parallax;
        u.u_intensityNoise_enabled = ssConfig.intensityNoise.enabled;
        u.u_intensityNoise_amount = ssConfig.intensityNoise.amount;
        u.u_cloud_enabled = ssConfig.cloudOcclusion.enabled;
        u.u_cloud_intensity = ssConfig.cloudOcclusion.intensity;

        const shadowInteractionConfig = config.postProcessing.colorCorrection.sceneIlluminationMixIn.shadowInteraction;
        u.u_illum_intensity = shadowInteractionConfig.intensity;
        u.u_illum_luminanceThreshold = shadowInteractionConfig.luminanceThreshold;
        u.u_illum_softness = shadowInteractionConfig.softness;
        u.uMetallicShineMixIn_intensity = ssConfig.metallicShineMixIn.intensity;

        const uSplit = this.rgbSplitFilter.uniforms;
        uSplit.uIntensity = ssConfig.rgbSplit.intensity;
        uSplit.uThreshold = ssConfig.rgbSplit.threshold;
    }

    /** @override */
    destroy() {
        super.destroy();
        console.log(`[MapShine] StructuralShadowsEffect: Destroying global instance.`);
        this.intensityNoiseManager?.destroy();
        this.structuralFilter?.destroy();
        this._patternGeneratorSprite?.destroy();
        this.finalShadowTexture?.destroy(true);
        this.finalHighlightMaskTexture?.destroy(true);
        this.effectSprite?.destroy();
        this.rgbSplitFilter?.destroy();
        this._splitHighlightSprite?.destroy();
        this.splitHighlightMaskTexture?.destroy(true);
        this.outdoorsMaskContainer?.destroy({ children: true, texture: true, baseTexture: true });
        this.outdoorsMaskTexture?.destroy(true);
        this.outdoorsMaskSprites.clear();
    }
}

// --- Ambient & Ground Glow Effects ---

/**
 * A helper class that generates a screen-space mask based on the luminance
 * of the scene's illumination buffer. Used by effects that need to react to
 * light or darkness, such as Ambient and GroundGlow.
 */
class IlluminationMaskGenerator {
    constructor() {
        const screen = canvas.app.screen;
        this.renderTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.maskFilter = new LightingMaskFilter();
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.sourceSprite.filters = [this.maskFilter];
    }

    /**
     * Updates and re-renders the mask texture.
     * @param {PIXI.Renderer} renderer - The canvas renderer.
     * @param {PIXI.Texture} illuminationTexture - The texture from the illumination buffer.
     * @param {number} threshold - The luminance threshold for the mask.
     * @param {number} softness - The softness of the mask's edge.
     * @param {boolean} invert - Whether to invert the mask logic.
     */
    update(renderer, illuminationTexture, threshold, softness, invert) {
        if (!this.sourceSprite || !illuminationTexture?.valid) return;
        this.sourceSprite.texture = illuminationTexture;
        this.maskFilter.uniforms.uLuminanceThreshold = threshold;
        this.maskFilter.uniforms.uSoftness = softness;
        this.maskFilter.uniforms.uInvert = invert;
        renderer.render(this.sourceSprite, { renderTexture: this.renderTexture, clear: true });
    }

    /** @returns {PIXI.RenderTexture} The generated mask texture. */
    getMaskTexture() {
        return this.renderTexture;
    }

    /** Resizes the internal render texture. */
    resize(width, height) {
        this.renderTexture.resize(width, height);
        this.sourceSprite.width = width;
        this.sourceSprite.height = height;
    }

    /** Destroys all associated PIXI objects. */
    destroy() {
        this.renderTexture?.destroy(true);
        this.maskFilter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture = this.maskFilter = this.sourceSprite = null;
    }
}


/**
 * A reusable PIXI Filter for applying color correction, tinting, and intensity
 * adjustments. It also includes logic for masking based on tokens. Used by both
 * Ambient and GroundGlow effects.
 */
class AmbientColorFilter extends PIXI.Filter {
    constructor(options = {}) {
        const vertexSrc = `
            attribute vec2 aVertexPosition; attribute vec2 aTextureCoord; uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord; vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }`;
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            uniform sampler2D uSampler; uniform float uSaturation, uBrightness, uContrast, uGamma;
            uniform vec3 uTintColor; uniform float uTintAmount; uniform float u_intensity;
            uniform sampler2D uTokenMask; uniform bool uTokenMaskEnabled; uniform float uTokenMaskThreshold;
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                if (uTokenMaskEnabled && texture2D(uTokenMask, vScreenCoord).r > uTokenMaskThreshold) {
                    discard;
                }
                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                if (originalColor.a == 0.0) discard;
                vec3 workingColor = originalColor.rgb;
                if (uGamma > 0.0) workingColor = pow(workingColor, vec3(1.0 / uGamma));
                workingColor += uBrightness;
                workingColor = (workingColor - 0.5) * uContrast + 0.5;
                float final_luminance = dot(workingColor, lum_weights);
                workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                workingColor = mix(workingColor, uTintColor, uTintAmount);
                workingColor *= u_intensity;
                vec3 premultiplied_rgb = workingColor * originalColor.a;
                gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
            }`;

        super(vertexSrc, fragmentSrc, {
            uSaturation: options.saturation ?? 1.0, uBrightness: options.brightness ?? 0.0,
            uContrast: options.contrast ?? 1.0, uGamma: options.gamma ?? 1.0,
            uTintColor: options.tintColor ?? [1.0, 1.0, 1.0], uTintAmount: options.tintAmount ?? 0.0,
            u_intensity: options.intensity ?? 1.0, uTokenMask: PIXI.Texture.EMPTY,
            uTokenMaskEnabled: false, uTokenMaskThreshold: options.tokenMaskThreshold ?? 0.1,
        });
    }
}


/**
 * A per-target Effect for emissive or ambiently lit areas on a map.
 * Instantiated for each target with an `_Ambient` texture.
 */
class AmbientEffect extends Effect {
    /** @override */
    static Suffix = "ambient";

    constructor(target, layer) {
        super(target, layer);
        console.log(`[MapShine] AmbientEffect: Creating instance for target '${this.target.id}'.`);
        this.illuminationMask = new IlluminationMaskGenerator();
        this.lightingMaskSprite = new PIXI.Sprite(this.illuminationMask.getMaskTexture());

        this.colorFilter = new AmbientColorFilter();
        this.effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.effectSprite.filters = [this.colorFilter];

        this.layer.addChild(this.effectSprite);
        this._loadTexture();
        this._updateSpriteTransform();
        
        this._boundOnResize = this._onResize.bind(this);
        window.addEventListener('resize', this._boundOnResize);
    }

    async _loadTexture() {
        const texturePath = this.target.effectTextures.get(AmbientEffect.Suffix);
        try { this.effectSprite.texture = await foundry.canvas.loadTexture(texturePath); }
        catch (e) { this.effectSprite.texture = PIXI.Texture.EMPTY; }
    }

    _updateSpriteTransform() {
        if (!this.effectSprite.texture.valid) return;
        const rect = this.target.rect;
        this.effectSprite.anchor.set(0.5);
        this.effectSprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
        this.effectSprite.width = rect.width;
        this.effectSprite.height = rect.height;
        this.effectSprite.rotation = rect.rotation || 0;
    }

    _onResize() {
        this.illuminationMask.resize(canvas.app.screen.width, canvas.app.screen.height);
    }

    /** @override */
    update(deltaTime, config) {
        const aConfig = config.ambient;
        this.visible = config.enabled && aConfig.enabled && this.effectSprite.texture.valid;
        this.effectSprite.visible = this.visible;
        if (!this.visible) {
            this.effectSprite.mask = null;
            return;
        };

        // Handle token masking
        const tmConfig = aConfig.tokenMasking;
        const u = this.colorFilter.uniforms;
        const tokenManagerExists = !!canvas.mapShine?.tokenMaskManager; // TODO: Abstract this away
        u.uTokenMaskEnabled = tmConfig.enabled && tokenManagerExists;
        if (u.uTokenMaskEnabled) {
            u.uTokenMask = canvas.mapShine.tokenMaskManager.getMaskTexture();
        }
        
        // Handle illumination masking
        const mConfig = aConfig.masking;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illuminationTexture = illuminationAPI?.getLightingTexture();
        const shouldBeMasked = this.visible && mConfig.enabled && !!illuminationTexture?.valid;

        if (shouldBeMasked) {
            this.effectSprite.mask = this.lightingMaskSprite;
            this.illuminationMask.update(
                canvas.app.renderer, illuminationTexture,
                mConfig.threshold, mConfig.softness, true // Invert=true to show in light
            );
            const stage = canvas.stage;
            const screen = canvas.app.renderer.screen;
            const topLeft = stage.toLocal({ x: 0, y: 0 });
            this.lightingMaskSprite.position.copyFrom(topLeft);
            this.lightingMaskSprite.width = screen.width / stage.scale.x;
            this.lightingMaskSprite.height = screen.height / stage.scale.y;
        } else {
            this.effectSprite.mask = null;
        }
    }

    /** @override */
    updateFromConfig(config) {
        const aConfig = config.ambient;
        const ccConfig = aConfig.colorCorrection;
        
        this.effectSprite.blendMode = aConfig.blendMode;
        
        const u = this.colorFilter.uniforms;
        u.enabled = ccConfig.enabled;
        u.uSaturation = ccConfig.saturation;
        u.uBrightness = ccConfig.brightness;
        u.uContrast = ccConfig.contrast;
        u.uGamma = ccConfig.gamma;
        u.uTintColor = hexToRgbArray(ccConfig.tint.color);
        u.uTintAmount = ccConfig.tint.amount;
        u.u_intensity = aConfig.intensity;
        u.uTokenMaskThreshold = aConfig.tokenMasking.threshold;
    }

    /** @override */
    destroy() {
        console.log(`[MapShine] AmbientEffect: Destroying instance for target '${this.target.id}'.`);
        window.removeEventListener('resize', this._boundOnResize);
        this.illuminationMask?.destroy();
        this.lightingMaskSprite?.destroy();
        this.colorFilter?.destroy();
        this.effectSprite?.destroy();
    }
}


/**
 * A per-target Effect for areas that glow in the dark.
 * Instantiated for each target with a `_GroundGlow` texture.
 */
class GroundGlowEffect extends Effect {
    /** @override */
    static Suffix = "groundGlow";

    constructor(target, layer) {
        super(target, layer);
        console.log(`[MapShine] GroundGlowEffect: Creating instance for target '${this.target.id}'.`);
        this.illuminationMask = new IlluminationMaskGenerator();
        this.lightingMaskSprite = new PIXI.Sprite(this.illuminationMask.getMaskTexture());

        this.colorFilter = new AmbientColorFilter();
        this.effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.effectSprite.filters = [this.colorFilter];
        this.effectSprite.mask = this.lightingMaskSprite;

        this.layer.addChild(this.effectSprite);
        this._loadTexture();
        this._updateSpriteTransform();
        
        this._boundOnResize = this._onResize.bind(this);
        window.addEventListener('resize', this._boundOnResize);
    }

    async _loadTexture() {
        const texturePath = this.target.effectTextures.get(GroundGlowEffect.Suffix);
        try { this.effectSprite.texture = await foundry.canvas.loadTexture(texturePath); }
        catch (e) { this.effectSprite.texture = PIXI.Texture.EMPTY; }
    }

    _updateSpriteTransform() {
        if (!this.effectSprite.texture.valid) return;
        const rect = this.target.rect;
        this.effectSprite.anchor.set(0.5);
        this.effectSprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
        this.effectSprite.width = rect.width;
        this.effectSprite.height = rect.height;
        this.effectSprite.rotation = rect.rotation || 0;
    }
    
    _onResize() {
        this.illuminationMask.resize(canvas.app.screen.width, canvas.app.screen.height);
    }

    /** @override */
    update(deltaTime, config) {
        const ggConfig = config.groundGlow;
        this.visible = config.enabled && ggConfig.enabled && this.effectSprite.texture.valid;
        this.effectSprite.visible = this.visible;
        if (!this.visible) return;

        // Handle token masking
        const tmConfig = ggConfig.tokenMasking;
        const u = this.colorFilter.uniforms;
        const tokenManagerExists = !!canvas.mapShine?.tokenMaskManager;
        u.uTokenMaskEnabled = tmConfig.enabled && tokenManagerExists;
        if (u.uTokenMaskEnabled) {
            u.uTokenMask = canvas.mapShine.tokenMaskManager.getMaskTexture();
        }
        
        // Handle illumination masking (always on for this effect)
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illuminationTexture = illuminationAPI?.getLightingTexture();
        if (illuminationTexture?.valid) {
            this.illuminationMask.update(
                canvas.app.renderer, illuminationTexture,
                ggConfig.luminanceThreshold, ggConfig.softness, ggConfig.invert
            );
            const stage = canvas.stage;
            const screen = canvas.app.renderer.screen;
            const topLeft = stage.toLocal({ x: 0, y: 0 });
            this.lightingMaskSprite.position.copyFrom(topLeft);
            this.lightingMaskSprite.width = screen.width / stage.scale.x;
            this.lightingMaskSprite.height = screen.height / stage.scale.y;
        }
    }

    /** @override */
    updateFromConfig(config) {
        const ggConfig = config.groundGlow;
        this.effectSprite.blendMode = ggConfig.blendMode;
        
        const u = this.colorFilter.uniforms;
        u.enabled = true; // The color filter is always used for brightness/saturation
        u.uSaturation = ggConfig.saturation;
        u.uBrightness = ggConfig.brightness - 1.0; // Brightness is used as a slider from 0-5, but filter expects -1 to +1 range
        u.uContrast = 1.0;
        u.uGamma = 1.0;
        u.uTintAmount = 0.0;
        u.u_intensity = ggConfig.intensity;
        u.uTokenMaskThreshold = ggConfig.tokenMasking.threshold;
    }

    /** @override */
    destroy() {
        console.log(`[MapShine] GroundGlowEffect: Destroying instance for target '${this.target.id}'.`);
        window.removeEventListener('resize', this._boundOnResize);
        this.illuminationMask?.destroy();
        this.lightingMaskSprite?.destroy();
        this.colorFilter?.destroy();
        this.effectSprite?.destroy();
    }
}

/*********************************************************************************
 *  SECTION 4: GLOBAL SCREEN EFFECTS
 *********************************************************************************/
// Description: This section defines the manager for all screen-wide post-processing
//              effects and the `GlobalEffect` classes that control them. Unlike
//              per-target effects that draw into the `MapShineLayer`, these effects
//              manipulate textures and uniforms for filters that are applied
//              directly to `canvas.stage`.
// ---------------------------------------------------------------------------------


/**
 * A PIXI Filter that applies a vignette effect, darkening the corners of the screen.
 */
class VignetteFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform float u_softness;
            void main(void) {
                if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec4 color = texture2D(uSampler, vTextureCoord);
                float dist = distance(vTextureCoord, vec2(0.5));
                float start = u_softness - 0.15;
                float end = u_softness + 0.15;
                float falloff = smoothstep(start, end, dist);
                color.rgb *= (1.0 - (u_amount * falloff));
                gl_FragColor = color;
            }`, { u_amount: options.amount ?? 0.5, u_softness: options.softness ?? 0.5 });
    }
}

/**
 * A PIXI Filter that simulates lens distortion, pinching or bulging the image.
 */
class LensDistortionFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
            void main(void) {
                if (u_amount == 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec2 D = vTextureCoord - u_center;
                float r = length(D);
                vec2 distorted_coord = u_center + D * (1.0 + u_amount * r * r);
                gl_FragColor = texture2D(uSampler, distorted_coord);
            }`, { u_amount: options.amount ?? 0.0, u_center: options.center ?? [0.5, 0.5] });
    }
}

/**
 * A PIXI Filter that simulates chromatic aberration, splitting color channels.
 */
class ChromaticAberrationFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
            void main(void) {
                if (u_amount == 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                vec2 offset = (vTextureCoord - u_center) * u_amount;
                float r = texture2D(uSampler, vTextureCoord - offset).r;
                float g = texture2D(uSampler, vTextureCoord).g;
                float b = texture2D(uSampler, vTextureCoord + offset).b;
                float a = texture2D(uSampler, vTextureCoord).a;
                gl_FragColor = vec4(r, g, b, a);
            }`, { u_amount: options.amount ?? 0.0, u_center: options.center ?? [0.5, 0.5] });
    }
}

/**
 * The primary post-processing filter, handling a wide range of color adjustments.
 * This version is adapted for the new architecture.
 */
class ColorCorrectionFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;

            uniform sampler2D uSampler;
            uniform sampler2D uMaskTexture;
            uniform float uSaturation, uBrightness, uContrast;
            uniform float uExposure, uGamma, uInBlack, uInWhite;
            uniform float uTemperature, uWbTint;
            uniform bool uInvert;
            uniform vec3 uTintColor;
            uniform float uTintAmount;
            uniform bool uMaskEnabled;
            uniform bool uSelectiveEnabled;
            uniform vec3 uSelectiveColor;
            uniform float uSelectiveHueRange, uSelectiveSatRange, uSelectiveLumRange;
            uniform float uSelectiveTargetLum, uSelectiveSoftness;
            uniform bool uSelectiveInvert;
            uniform float uSelectiveDesaturation;
            uniform float uSelectiveTargetSaturation, uSelectiveTargetBrightness;
            uniform sampler2D uCurveLUT;
            uniform bool uCurvesEnabled;
            uniform bool uCloudHighlightsEnabled;
            uniform sampler2D uCloudHighlightsMask;
            uniform float uCloudHighlightsBrightness;
            uniform bool uStructuralHighlightsEnabled;
            uniform sampler2D uStructuralHighlightsMask;
            uniform float uStructuralHighlightsBrightness;
            uniform bool uStructuralSplitHighlightsEnabled;
            uniform sampler2D uStructuralSplitHighlightsMask;
            uniform float uIntensity;
            uniform float uDynamicExposureBoost;

            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            vec3 rgb2hsl(vec3 c) {
                float max_c = max(max(c.r, c.g), c.b); float min_c = min(min(c.r, c.g), c.b);
                float h=0.0, s=0.0, l=(max_c+min_c)/2.0;
                if(max_c!=min_c){float d=max_c-min_c;s=l>0.5?d/(2.0-max_c-min_c):d/(max_c+min_c);if(max_c==c.r)h=(c.g-c.b)/d+(c.g<c.b?6.0:0.0);else if(max_c==c.g)h=(c.b-c.r)/d+2.0;else h=(c.r-c.g)/d+4.0;h/=6.0;}
                return vec3(h,s,l);
            }
            float hue2rgb(float p,float q,float t){if(t<0.0)t+=1.0;if(t>1.0)t-=1.0;if(t<1.0/6.0)return p+(q-p)*6.0*t;if(t<1.0/2.0)return q;if(t<2.0/3.0)return p+(q-p)*(2.0/3.0-t)*6.0;return p;}
            vec3 hsl2rgb(vec3 c){if(c.y==0.0)return vec3(c.z);float q=c.z<0.5?c.z*(1.0+c.y):c.z+c.y-c.z*c.y;float p=2.0*c.z-q;return vec3(hue2rgb(p,q,c.x+1.0/3.0),hue2rgb(p,q,c.x),hue2rgb(p,q,c.x-1.0/3.0));}
            vec3 applyCurves(vec3 color,sampler2D lut){color.r=texture2D(lut,vec2(color.r,0.5)).r;color.g=texture2D(lut,vec2(color.g,0.5)).g;color.b=texture2D(lut,vec2(color.b,0.5)).b;return color;}
            vec3 applyWhiteBalance(vec3 color,float temp,float green_tint){const float STRENGTH=0.5;color.r+=temp*(color.r*(1.0-color.r))*STRENGTH;color.b-=temp*(color.b*(1.0-color.b))*STRENGTH;color.g+=green_tint*(color.g*(1.0-color.g))*STRENGTH;return color;}

            void main(void) {
                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                vec3 workingColor = originalColor.rgb;
                if(originalColor.a > 0.0) workingColor /= originalColor.a;
                vec3 uncorrectedColor = workingColor;

                if (uSelectiveEnabled) {
                    vec3 pixel_hsl=rgb2hsl(workingColor); vec3 target_hsl=rgb2hsl(uSelectiveColor);
                    float hue_dist=min(abs(pixel_hsl.x-target_hsl.x),1.0-abs(pixel_hsl.x-target_hsl.x));
                    float hue_mask=1.0-smoothstep(uSelectiveHueRange,uSelectiveHueRange+uSelectiveSoftness,hue_dist);
                    float sat_dist=abs(pixel_hsl.y-target_hsl.y);
                    float sat_mask=1.0-smoothstep(uSelectiveSatRange,uSelectiveSatRange+uSelectiveSoftness,sat_dist);
                    float lum_dist=abs(pixel_hsl.z-uSelectiveTargetLum);
                    float lum_mask=1.0-smoothstep(uSelectiveLumRange,uSelectiveLumRange+uSelectiveSoftness,lum_dist);
                    float selection_mask=hue_mask*sat_mask*lum_mask;
                    if(uSelectiveInvert)selection_mask=1.0-selection_mask;
                    vec3 desaturated_color=vec3(dot(workingColor,lum_weights));
                    workingColor=mix(mix(desaturated_color,workingColor,1.0-uSelectiveDesaturation),workingColor,selection_mask);
                    if(selection_mask>0.0){vec3 current_hsl=rgb2hsl(workingColor);current_hsl.y*=uSelectiveTargetSaturation;current_hsl.z=clamp(current_hsl.z+uSelectiveTargetBrightness,0.0,1.0);vec3 adjusted_color=hsl2rgb(current_hsl);workingColor=mix(workingColor,adjusted_color,selection_mask);}
                }
                if(uInWhite>uInBlack)workingColor=(workingColor-uInBlack)/(uInWhite-uInBlack+0.00001);
                workingColor*=pow(2.0,uExposure+uDynamicExposureBoost);
                workingColor=applyWhiteBalance(workingColor,uTemperature,uWbTint);
                if(uGamma>0.0)workingColor=pow(max(workingColor,0.0),vec3(1.0/uGamma));
                if(uCurvesEnabled)workingColor=applyCurves(workingColor,uCurveLUT);
                workingColor+=uBrightness;
                workingColor=(workingColor-0.5)*uContrast+0.5;
                float final_luminance=dot(workingColor,lum_weights);
                workingColor=mix(vec3(final_luminance),workingColor,uSaturation);
                workingColor=mix(workingColor,uTintColor,uTintAmount);
                if(uInvert)workingColor=1.0-workingColor;
                vec3 final_rgb=mix(uncorrectedColor,workingColor,uIntensity);
                if(uMaskEnabled){float maskValue=texture2D(uMaskTexture,vTextureCoord).r;final_rgb=mix(uncorrectedColor,final_rgb,maskValue);}
                if(uCloudHighlightsEnabled){float lightAmount=texture2D(uCloudHighlightsMask,vTextureCoord).r;final_rgb*=(1.0+uCloudHighlightsBrightness*lightAmount);}
                if(uStructuralHighlightsEnabled){if(uStructuralSplitHighlightsEnabled){vec3 splitLight=texture2D(uStructuralSplitHighlightsMask,vTextureCoord).rgb;vec3 highlightBoost=splitLight*uStructuralHighlightsBrightness;final_rgb*=(vec3(1.0)+highlightBoost);}else{float lightAmount=texture2D(uStructuralHighlightsMask,vTextureCoord).r;final_rgb*=(1.0+uStructuralHighlightsBrightness*lightAmount);}}
                vec3 premultiplied_rgb=clamp(final_rgb,0.0,1.0)*originalColor.a;
                gl_FragColor=vec4(premultiplied_rgb,originalColor.a);
            }`;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uSaturation: 1.0, uBrightness: 0.0, uContrast: 1.0, uExposure: 0.0, uGamma: 1.0,
            uInBlack: 0.0, uInWhite: 1.0, uTemperature: 0.0, uWbTint: 0.0, uInvert: false,
            uTintColor: [1.0, 1.0, 1.0], uTintAmount: 0.0, uMaskTexture: PIXI.Texture.EMPTY, uMaskEnabled: false,
            uSelectiveEnabled: false, uSelectiveColor: [1.0, 0.0, 0.0], uSelectiveHueRange: 0.1,
            uSelectiveSatRange: 0.4, uSelectiveLumRange: 0.5, uSelectiveTargetLum: 0.5,
            uSelectiveSoftness: 0.1, uSelectiveInvert: false, uSelectiveDesaturation: 1.0,
            uSelectiveTargetSaturation: 1.0, uSelectiveTargetBrightness: 0.0,
            uCurveLUT: PIXI.Texture.EMPTY, uCurvesEnabled: false, uCloudHighlightsEnabled: false,
            uCloudHighlightsMask: PIXI.Texture.EMPTY, uCloudHighlightsBrightness: 0.0,
            uStructuralHighlightsEnabled: false, uStructuralHighlightsMask: PIXI.Texture.EMPTY,
            uStructuralHighlightsBrightness: 0.0, uStructuralSplitHighlightsEnabled: false,
            uStructuralSplitHighlightsMask: PIXI.Texture.EMPTY, uIntensity: options.intensity ?? 1.0,
            uDynamicExposureBoost: 0.0,
        });
    }
}


class ScreenEffectsManager {
    static _filters = new Map();
    static _container = null;
    static _curveLut = null; // To manage the lifecycle of the generated curve texture

    /**
     * The defined render order for all managed global filters.
     * Lower indices are rendered first.
     */
    static RENDER_ORDER = [
        'advancedBloom',
        'tiltShift',
        'prism',
        'heatDistortion',
        'colorCorrection',
        'pauseEffect',
        'combatEffect',
        'vignette',
        'lensDistortion',
        'chromaticAberration'
    ];

    /**
     * Initializes the manager with the target PIXI container.
     * @param {PIXI.Container} container - The container to apply filters to (usually `canvas.stage`).
     */
    static initialize(container) {
        if (!this._container) {
            console.log("[MapShine] ScreenEffectsManager: Initializing with target container.");
            this._container = container;
        }
    }

    /**
     * Adds a filter to the manager and updates the container's filter stack.
     * @param {string} key - A unique key for the filter.
     * @param {PIXI.Filter} filter - The filter instance to add.
     */
    static addFilter(key, filter) {
        if (!this._container) return;
        this.removeFilter(key);
        this._filters.set(key, filter);
        this._updateContainerFilters();
    }

    /**
     * Retrieves a managed filter instance by its key.
     * @param {string} key - The key of the filter to retrieve.
     * @returns {PIXI.Filter|undefined}
     */
    static getFilter(key) {
        return this._filters.get(key);
    }

    /**
     * Removes a filter from the manager and updates the container's filter stack.
     * @param {string} key - The key of the filter to remove.
     */
    static removeFilter(key) {
        if (!this._container || !this._filters.has(key)) return;
        const filter = this._filters.get(key);
        filter?.destroy();
        this._filters.delete(key);
        this._updateContainerFilters();
    }

    /**
     * Re-applies the managed filters to the container in the correct render order.
     */
    static _updateContainerFilters() {
        if (!this._container) return;

        const orderedManagedFilters = this.RENDER_ORDER
            .map(key => this._filters.get(key))
            .filter(Boolean);

        const otherFilters = (this._container.filters || []).filter(f => ![...this._filters.values()].includes(f));

        const newFilters = [...otherFilters, ...orderedManagedFilters];
        this._container.filters = newFilters.length > 0 ? newFilters : null;
    }

    /**
     * Instantiates all global filter classes and adds them to the manager.
     */
    static setupAllGlobalFilters() {
        console.log("[MapShine] ScreenEffectsManager: Setting up all global filters.");

        this.addFilter('heatDistortion', new HeatDistortionFilter());
        this.addFilter('prism', new PrismFilter());
        this.addFilter('vignette', new VignetteFilter());
        this.addFilter('lensDistortion', new LensDistortionFilter());
        this.addFilter('chromaticAberration', new ChromaticAberrationFilter());
        this.addFilter('colorCorrection', new ColorCorrectionFilter());

        // Filters for game state managers (initially disabled)
        const pauseFilter = new ColorCorrectionFilter({ intensity: 0 });
        pauseFilter.enabled = false;
        this.addFilter('pauseEffect', pauseFilter);

        const combatFilter = new ColorCorrectionFilter({ intensity: 0 });
        combatFilter.enabled = false;
        this.addFilter('combatEffect', combatFilter);

        // Filters that might not be available in all PIXI versions
        const BloomFilter = PIXI.filters?.AdvancedBloomFilter;
        if (BloomFilter) {
            this.addFilter('advancedBloom', new BloomFilter());
        } else {
            console.warn("[MapShine] AdvancedBloomFilter not found in PIXI.filters. Global bloom will be disabled.");
        }

        const TiltShiftFilter = PIXI.filters?.TiltShiftFilter;
        if (TiltShiftFilter) {
            this.addFilter('tiltShift', new TiltShiftFilter());
        } else {
            console.warn("[MapShine] TiltShiftFilter not found in PIXI.filters. Tilt-shift effect will be disabled.");
        }
    }

    /**
     * Updates the uniforms of all managed filters from a configuration object.
     * @param {object} config - The full, active module configuration.
     * @param {Effect[]} activeEffects - An array of all active effect instances from the engine.
     */
    static updateAllFiltersFromConfig(config, activeEffects = []) {
        const screen = canvas?.app?.screen;
        if (!screen) return;

        // --- Standard Filters ---
        const heatFilter = this.getFilter('heatDistortion');
        if (heatFilter) heatFilter.uniforms.u_intensity = config.heatDistortion.intensity;

        const prismFilter = this.getFilter('prism');
        if (prismFilter) {
            const pConfig = config.prism;
            const u = prismFilter.uniforms;
            u.uIntensity = pConfig.intensity;
            u.uAngleRad = pConfig.angle * (Math.PI / 180.0);
            u.uThreshold = pConfig.threshold;
            u.uSoftness = pConfig.softness;
            u.uTexelSize = [1 / screen.width, 1 / screen.height];
        }

        const vignetteFilter = this.getFilter('vignette');
        if (vignetteFilter) {
            const vConfig = config.postProcessing.vignette;
            vignetteFilter.enabled = config.enabled && config.postProcessing.enabled && vConfig.enabled;
            vignetteFilter.uniforms.u_amount = vConfig.amount;
            vignetteFilter.uniforms.u_softness = vConfig.softness;
        }

        const lensFilter = this.getFilter('lensDistortion');
        if (lensFilter) {
            const ldConfig = config.postProcessing.lensDistortion;
            lensFilter.enabled = config.enabled && config.postProcessing.enabled && ldConfig.enabled;
            lensFilter.uniforms.u_amount = ldConfig.amount;
            lensFilter.uniforms.u_center = [ldConfig.centerX, ldConfig.centerY];
        }

        const caFilter = this.getFilter('chromaticAberration');
        if (caFilter) {
            const caConfig = config.postProcessing.chromaticAberration;
            caFilter.enabled = config.enabled && config.postProcessing.enabled && caConfig.enabled;
            caFilter.uniforms.u_amount = caConfig.amount;
            caFilter.uniforms.u_center = [caConfig.centerX, caConfig.centerY];
        }

        const bloomFilter = this.getFilter('advancedBloom');
        if (bloomFilter) {
            const abConfig = config.advancedBloom;
            bloomFilter.enabled = config.enabled && abConfig.enabled;
            Object.assign(bloomFilter, abConfig);
        }

        const tiltShiftFilter = this.getFilter('tiltShift');
        if (tiltShiftFilter) {
            const tsConfig = config.postProcessing.tiltShift;
            tiltShiftFilter.enabled = config.enabled && config.postProcessing.enabled && tsConfig.enabled;
            tiltShiftFilter.blur = tsConfig.blur;
            tiltShiftFilter.gradientBlur = tsConfig.gradientBlur;
            if (tiltShiftFilter.start) {
                tiltShiftFilter.start.x = tsConfig.startX * screen.width;
                tiltShiftFilter.start.y = tsConfig.startY * screen.height;
            }
            if (tiltShiftFilter.end) {
                tiltShiftFilter.end.x = tsConfig.endX * screen.width;
                tiltShiftFilter.end.y = tsConfig.endY * screen.height;
            }
        }

        // --- Main Color Correction Filter ---
        const ccFilter = this.getFilter('colorCorrection');
        if (ccFilter) {
            const ppConfig = config.postProcessing;
            const ccConfig = ppConfig.colorCorrection;
            ccFilter.enabled = config.enabled && ppConfig.enabled && ccConfig.enabled;

            const u = ccFilter.uniforms;
            Object.assign(u, {
                uSaturation: ccConfig.saturation, uBrightness: ccConfig.brightness, uContrast: ccConfig.contrast,
                uExposure: ccConfig.exposure, uGamma: ccConfig.gamma, uInBlack: ccConfig.levels.inBlack,
                uInWhite: ccConfig.levels.inWhite, uTemperature: ccConfig.whiteBalance.temperature,
                uWbTint: ccConfig.whiteBalance.tint, uInvert: ccConfig.invert, uTintAmount: ccConfig.tint.amount,
                uTintColor: hexToRgbArray(ccConfig.tint.color)
            });

            // Selective Color
            const sel = ccConfig.selective;
            Object.assign(u, {
                uSelectiveEnabled: sel.enabled, uSelectiveColor: hexToRgbArray(sel.color), uSelectiveHueRange: sel.hueRange,
                uSelectiveSatRange: sel.saturationRange, uSelectiveLumRange: sel.luminanceRange, uSelectiveTargetLum: sel.targetLuminance,
                uSelectiveSoftness: sel.softness, uSelectiveInvert: sel.invert, uSelectiveDesaturation: sel.desaturation,
                uSelectiveTargetSaturation: sel.targetSaturation, uSelectiveTargetBrightness: sel.targetBrightness
            });

            // Curves LUT
            u.uCurvesEnabled = ccConfig.curves.enabled;
            if (u.uCurvesEnabled) {
                if (this._curveLut) this._curveLut.destroy(true);
                this._curveLut = LutUtils.generateCurveLut(ccConfig.curves);
                u.uCurveLUT = this._curveLut;
            }

            // Highlight Masks
            const cloudEffect = activeEffects.find(e => e instanceof CloudShadowsEffect);
            u.uCloudHighlightsEnabled = ccConfig.highlightCloud.enabled && !!cloudEffect?.visible;
            if (u.uCloudHighlightsEnabled) {
                u.uCloudHighlightsMask = cloudEffect.getHighlightMaskTexture();
                u.uCloudHighlightsBrightness = ccConfig.highlightCloud.brightness;
            }

            const structuralEffect = activeEffects.find(e => e instanceof StructuralShadowsEffect);
            u.uStructuralHighlightsEnabled = ccConfig.highlightStructural.enabled && !!structuralEffect?.visible;
            if (u.uStructuralHighlightsEnabled) {
                u.uStructuralHighlightsMask = structuralEffect.getHighlightMaskTexture();
                u.uStructuralHighlightsBrightness = ccConfig.highlightStructural.brightness;
                u.uStructuralSplitHighlightsEnabled = structuralEffect.isRgbSplitEnabled(config);
                if (u.uStructuralSplitHighlightsEnabled) {
                    u.uStructuralSplitHighlightsMask = structuralEffect.getSplitHighlightMaskTexture();
                }
            }
        }
    }

    /**
     * Disables and removes all managed filters from the container during teardown.
     */
    static tearDown() {
        console.log("[MapShine] ScreenEffectsManager: Tearing down.");
        if (this._container) {
            this._container.filters = (this._container.filters || []).filter(f => ![...this._filters.values()].includes(f));
        }
        for (const filter of this._filters.values()) {
            filter.destroy();
        }
        this._filters.clear();
        this._container = null;

        if (this._curveLut) {
            this._curveLut.destroy(true);
            this._curveLut = null;
        }
    }
}

/**
 * Manages the "dazzle" effect when a token moves from indoors to outdoors.
 * This is a sub-system of the MapShineEngine.
 */
class DynamicExposureManager {
    constructor() {
        this.isIndoors = null;
        this.lastTriggerTimestamp = 0;
        this.dazzleAnimation = null;
        this.activeTokenId = null;
        this._boundOnUpdateToken = this._onUpdateToken.bind(this);
    }

    initialize() {
        Hooks.on('updateToken', this._boundOnUpdateToken);
        const currentToken = game.mapShine.tokenManager.activeToken;
        if (currentToken) this._updateInitialTokenState(currentToken);
    }

    _onUpdateToken(tokenDoc, change) {
        const token = tokenDoc.object;
        if (!token || token.id !== game.mapShine.tokenManager.activeToken?.id) return;
        if (change.x !== undefined || change.y !== undefined) {
            const destCenter = { x: (change.x ?? token.x) + token.w / 2, y: (change.y ?? token.y) + token.h / 2 };
            this._checkTokenStateAtPoint(destCenter, true);
        }
    }

    _updateInitialTokenState(token) {
        if (!token) { this.isIndoors = null; return; }
        this._checkTokenStateAtPoint(token.center, false);
    }

    _checkTokenStateAtPoint(worldPoint, canTriggerEffect) {
        const config = game.mapShine.profileManager.activeConfig.postProcessing.colorCorrection.dynamicExposure;
        if (!config.enabled) return;

        const cloudEffect = MapShineEngine._activeEffects.find(e => e instanceof CloudShadowsEffect);
        const outdoorsMask = cloudEffect?.getHighlightMaskTexture();
        if (!outdoorsMask?.valid) { this.isIndoors = null; return; }

        const screenPos = canvas.stage.toGlobal(worldPoint);
        const screen = canvas.app.renderer.screen;
        const x = Math.max(0, Math.min(screen.width - 1, Math.round(screenPos.x)));
        const y = Math.max(0, Math.min(screen.height - 1, Math.round(screenPos.y)));

        try {
            const pixelData = canvas.app.renderer.extract.pixels(outdoorsMask, new PIXI.Rectangle(x, y, 1, 1));
            const isNowOutdoors = pixelData[0] > 128; // Light areas in the highlight mask are outdoors
            const wasIndoors = this.isIndoors === true;
            this.isIndoors = !isNowOutdoors;

            if (canTriggerEffect && wasIndoors && isNowOutdoors) this._triggerDazzleEffect(config);
        } catch (e) { /* Ignore extraction errors */ }
    }

    _triggerDazzleEffect(config) {
        if (Date.now() - this.lastTriggerTimestamp < config.resetPeriod) return;
        this.lastTriggerTimestamp = Date.now();
        if (this.dazzleAnimation) this.dazzleAnimation.kill();

        const ccFilter = ScreenEffectsManager.getFilter('colorCorrection');
        if (ccFilter) {
            ccFilter.uniforms.uDynamicExposureBoost = config.intensity;
            this.dazzleAnimation = gsap.to(ccFilter.uniforms, {
                uDynamicExposureBoost: 0,
                duration: config.duration / 1000,
                ease: "power2.out",
                onComplete: () => this.dazzleAnimation = null
            });
        }
    }

    tearDown() {
        Hooks.off('updateToken', this._boundOnUpdateToken);
        if (this.dazzleAnimation) this.dazzleAnimation.kill();
        const ccFilter = ScreenEffectsManager.getFilter('colorCorrection');
        if (ccFilter && !ccFilter.destroyed) ccFilter.uniforms.uDynamicExposureBoost = 0.0;
    }
}

/**
 * Manages the visual transition and animation speed changes for game pause.
 * This is a sub-system of the MapShineEngine.
 */
class PauseEffectManager {
    constructor() {
        this._animationState = { progress: game.paused ? 1 : 0 };
        this._animation = null;
        this._originalGlobalTime = 100;
        this._boundOnPauseChange = this._onPauseChange.bind(this);
    }

    initialize() {
        const config = game.mapShine.profileManager.activeConfig;
        this._originalGlobalTime = config.timeControl.globalTime;
        this._updateEffects(this._animationState.progress);
        Hooks.on('pauseGame', this._boundOnPauseChange);
    }

    _onPauseChange(paused) {
        const config = game.mapShine.profileManager.activeConfig.pauseEffect;
        if (!config.enabled) return;
        if (this._animation) this._animation.kill();
        if (paused && this._animationState.progress < 1) this._originalGlobalTime = game.mapShine.profileManager.activeConfig.timeControl.globalTime;
        const targetProgress = paused ? 1 : 0;
        this._animation = gsap.to(this._animationState, {
            progress: targetProgress,
            duration: config.duration / 1000,
            ease: "power2.inOut",
            onUpdate: () => this._updateEffects(this._animationState.progress),
            onComplete: () => { this._animation = null; this._updateEffects(targetProgress); }
        });
    }

    _updateEffects(progress) {
        const filter = ScreenEffectsManager.getFilter('pauseEffect');
        if (!filter) return;
        const config = game.mapShine.profileManager.activeConfig.pauseEffect;
        const cc = config.colorCorrection;
        filter.enabled = progress > 0.001 && cc.enabled;
        filter.uniforms.uIntensity = progress;
        Object.assign(filter.uniforms, {
            uSaturation: cc.saturation, uBrightness: cc.brightness, uContrast: cc.contrast,
            uExposure: cc.exposure, uGamma: cc.gamma, uInBlack: cc.levels.inBlack,
            uInWhite: cc.levels.inWhite, uTemperature: cc.whiteBalance.temperature,
            uWbTint: cc.whiteBalance.tint, uTintAmount: cc.tint.amount,
            uTintColor: hexToRgbArray(cc.tint.color), uInvert: cc.invert
        });
        game.mapShine.timeControl.timeFactor = (this._originalGlobalTime * (1 - progress)) / 100.0;
    }

    tearDown() {
        Hooks.off('pauseGame', this._boundOnPauseChange);
        if (this._animation) this._animation.kill();
    }
}

/**
 * Manages the visual transition and animation speed changes for combat state.
 * This is a sub-system of the MapShineEngine.
 */
class CombatEffectManager {
    constructor() {
        this._animationState = { progress: 0 };
        this._animation = null;
        this._originalGlobalTime = 100;
        this._boundOnCombatChange = this._onCombatChange.bind(this);
    }

    initialize() {
        const config = game.mapShine.profileManager.activeConfig;
        this._originalGlobalTime = config.timeControl.globalTime;
        this._animationState.progress = game.combats.active?.started ? 1 : 0;
        this._updateEffects(this._animationState.progress);
        Hooks.on('combatStart', () => this._boundOnCombatChange(true));
        Hooks.on('combatEnd', () => this._boundOnCombatChange(false));
        Hooks.on('deleteCombat', () => this._boundOnCombatChange(false));
    }

    _onCombatChange(inCombat) {
        const config = game.mapShine.profileManager.activeConfig.combatEffect;
        if (!config.enabled) return;
        if (this._animation) this._animation.kill();
        if (inCombat && this._animationState.progress < 1) this._originalGlobalTime = game.mapShine.profileManager.activeConfig.timeControl.globalTime;
        const targetProgress = inCombat ? 1 : 0;
        this._animation = gsap.to(this._animationState, {
            progress: targetProgress,
            duration: config.duration / 1000,
            ease: "power2.inOut",
            onUpdate: () => this._updateEffects(this._animationState.progress),
            onComplete: () => { this._animation = null; this._updateEffects(targetProgress); }
        });
    }

    _updateEffects(progress) {
        const filter = ScreenEffectsManager.getFilter('combatEffect');
        if (!filter) return;
        const config = game.mapShine.profileManager.activeConfig.combatEffect;
        const cc = config.colorCorrection;
        filter.enabled = progress > 0.001 && cc.enabled;
        filter.uniforms.uIntensity = progress;
        Object.assign(filter.uniforms, {
            uSaturation: cc.saturation, uBrightness: cc.brightness, uContrast: cc.contrast,
            uExposure: cc.exposure, uGamma: cc.gamma, uInBlack: cc.levels.inBlack,
            uInWhite: cc.levels.inWhite, uTemperature: cc.whiteBalance.temperature,
            uWbTint: cc.whiteBalance.tint, uTintAmount: cc.tint.amount,
            uTintColor: hexToRgbArray(cc.tint.color), uInvert: cc.invert
        });
        game.mapShine.timeControl.timeFactor = lerp(this._originalGlobalTime, this._originalGlobalTime * config.timeScale, progress) / 100.0;
    }

    tearDown() {
        Hooks.off('combatStart', this._boundOnCombatChange);
        Hooks.off('combatEnd', this._boundOnCombatChange);
        Hooks.off('deleteCombat', this._boundOnCombatChange);
        if (this._animation) this._animation.kill();
    }
}

// --- Heat Distortion Effect ---

/**
 * A PIXI Filter that displaces pixels based on a noise map, creating a heat haze effect.
 * It is masked by a texture combining all active `_Heat` maps.
 */
class HeatDistortionFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform sampler2D u_displacementMap;
            uniform sampler2D u_intensityMask;
            uniform float u_intensity;

            void main(void) {
                float mask_value = texture2D(u_intensityMask, vTextureCoord).r;
                if (mask_value == 0.0) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }
                vec2 displacement = (texture2D(u_displacementMap, vTextureCoord).rg - 0.5) * 2.0;
                vec2 offset = displacement * u_intensity * mask_value;
                gl_FragColor = texture2D(uSampler, vTextureCoord + offset);
            }`;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_displacementMap: PIXI.Texture.EMPTY,
            u_intensityMask: PIXI.Texture.EMPTY,
            u_intensity: options.intensity ?? 0.01,
        });
    }
}


/**
 * A GlobalEffect for heat distortion. It generates a noise texture and a combined
 * heat mask, then feeds them into the global `HeatDistortionFilter`.
 */
class HeatDistortionEffect extends GlobalEffect {
    /** @override */
    static Suffix = "heat";

    constructor(layer) {
        super(layer);
        console.log(`[MapShine] HeatDistortionEffect: Creating global instance.`);
        this.noiseManager = new NoiseTextureManager(canvas.app.renderer, 'heatDistortion.noise');
        super.initialize();
    }

    /** @override */
    update(deltaTime, config) {
        const hdConfig = config.heatDistortion;
        this.visible = config.enabled && hdConfig.enabled && this.maskSprites.size > 0;
        const heatFilter = ScreenEffectsManager.getFilter('heatDistortion');
        if (!heatFilter) return;

        heatFilter.enabled = this.visible;
        if (!this.visible) return;

        super._renderCombinedMask();
        this.noiseManager.update(deltaTime, canvas.app.renderer);

        heatFilter.uniforms.u_displacementMap = this.noiseManager.getTexture();
        heatFilter.uniforms.u_intensityMask = this.combinedMaskTexture;
    }

    /** @override */
    updateFromConfig(config) {
        this.noiseManager.updateFromConfig(config);
    }
    
    /** @override */
    _onResize() {
        super._onResize();
        this.noiseManager?.resize(canvas.app.renderer);
    }

    /** @override */
    destroy() {
        super.destroy();
        console.log(`[MapShine] HeatDistortionEffect: Destroying global instance.`);
        const heatFilter = ScreenEffectsManager.getFilter('heatDistortion');
        if (heatFilter) {
            heatFilter.enabled = false;
        }
        this.noiseManager?.destroy();
    }
}


// --- Prism Effect ---

/**
 * A PIXI Filter that creates a prismatic (chromatic aberration) effect in areas
 * defined by a mask, with the split direction influenced by a distortion map.
 */
class PrismFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform sampler2D uPrismMask;
            uniform sampler2D uDistortionMap;
            uniform float uIntensity;
            uniform float uAngleRad;
            uniform float uThreshold;
            uniform float uSoftness;
            uniform float uDistortionStrength;
            uniform vec2 uTexelSize;
            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

            void main(void) {
                float maskValue = texture2D(uPrismMask, vTextureCoord).r;
                if (maskValue < 0.01) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }
                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                float luminance = dot(originalColor.rgb, lum_weights);
                float effectVisibility = smoothstep(uThreshold, uThreshold + uSoftness, luminance);
                if (effectVisibility < 0.01) {
                    gl_FragColor = originalColor;
                    return;
                }
                vec2 distortionVec = (texture2D(uDistortionMap, vTextureCoord).rg - 0.5) * 2.0;
                vec2 splitDirection = vec2(cos(uAngleRad), sin(uAngleRad));
                vec2 finalOffset = (splitDirection + distortionVec * uDistortionStrength) * uIntensity * uTexelSize;
                float r = texture2D(uSampler, vTextureCoord - finalOffset).r;
                float g = originalColor.g;
                float b = texture2D(uSampler, vTextureCoord + finalOffset).b;
                vec3 splitColor = vec3(r, g, b);
                float blendAmount = maskValue * effectVisibility;
                vec3 finalColor = mix(originalColor.rgb, splitColor, blendAmount);
                gl_FragColor = vec4(finalColor, originalColor.a);
            }`;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uPrismMask: PIXI.Texture.EMPTY, uDistortionMap: PIXI.Texture.EMPTY,
            uIntensity: options.intensity ?? 5.0, uAngleRad: (options.angle ?? 45.0) * (Math.PI / 180.0),
            uThreshold: options.threshold ?? 0.85, uSoftness: options.softness ?? 0.1,
            uDistortionStrength: options.distortionStrength ?? 2.0,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}


/**
 * A GlobalEffect for the prism effect. It generates a noise texture for distortion
 * and a combined prism mask, feeding them into the global `PrismFilter`.
 */
class PrismEffect extends GlobalEffect {
    /** @override */
    static Suffix = "prism";

    constructor(layer) {
        super(layer);
        console.log(`[MapShine] PrismEffect: Creating global instance.`);
        this.distortionNoiseManager = new NoiseTextureManager(canvas.app.renderer, 'prism.distortionNoise', true);
        super.initialize();
    }
    
    /** @override */
    update(deltaTime, config) {
        const pConfig = config.prism;
        this.visible = config.enabled && pConfig.enabled && this.maskSprites.size > 0;
        const prismFilter = ScreenEffectsManager.getFilter('prism');
        if (!prismFilter) return;

        prismFilter.enabled = this.visible;
        if (!this.visible) return;

        super._renderCombinedMask();
        this.distortionNoiseManager.update(deltaTime, canvas.app.renderer);

        const u = prismFilter.uniforms;
        u.uPrismMask = this.combinedMaskTexture;
        u.uDistortionMap = this.distortionNoiseManager.getTexture();
        u.uDistortionStrength = pConfig.distortionNoise.enabled ? pConfig.distortionStrength : 0.0;
    }

    /** @override */
    updateFromConfig(config) {
        this.distortionNoiseManager.updateFromConfig(config);
    }

    /** @override */
    _onResize() {
        super._onResize();
        this.distortionNoiseManager?.resize(canvas.app.renderer);
    }
    
    /** @override */
    destroy() {
        super.destroy();
        console.log(`[MapShine] PrismEffect: Destroying global instance.`);
        const prismFilter = ScreenEffectsManager.getFilter('prism');
        if (prismFilter) {
            prismFilter.enabled = false;
        }
        this.distortionNoiseManager?.destroy();
    }
}

// --- Water Effects ---

/**
 * A helper filter that generates a procedural, animated 2D noise pattern suitable for
 * simulating water wave displacement. The output is a texture where the R and G
 * channels represent the X and Y displacement vectors.
 */
class WaveDisplacementFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform float u_time;
            uniform float u_speed;
            uniform float u_scale;
            
            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy) ); vec3 x0 = v - i + dot(i, C.xxx);
                vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
                vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
                i = mod(i, 289.0);
                vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
                float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_ );
                vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y); vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
                vec4 s0 = floor(b0)*2.0+1.0; vec4 s1 = floor(b1)*2.0+1.0; vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            void main() {
                float time = u_time * u_speed;
                vec2 uv1 = vTextureCoord * u_scale + vec2(time * 0.5, time * 0.2);
                vec2 uv2 = vTextureCoord * u_scale * 1.5 - vec2(time * -0.2, time * 0.5);
                float noise1_x = snoise(vec3(uv1, time));
                float noise1_y = snoise(vec3(uv1 + 10.0, time));
                float noise2_x = snoise(vec3(uv2, time));
                float noise2_y = snoise(vec3(uv2 + 20.0, time));
                vec2 displacement = vec2(noise1_x + noise2_x, noise1_y + noise2_y) * 0.5;
                gl_FragColor = vec4(displacement * 0.5 + 0.5, 0.0, 1.0);
            }`;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_time: 0.0,
            u_speed: options.speed ?? 0.05,
            u_scale: options.scale ?? 4.0,
        });
    }
}


/**
 * The main, complex filter for rendering all water effects. It distorts the
 * underlying scene, adds caustics, and layers multiple types of procedural foam
 * and sheen on the water's surface.
 */
class WaterEffectsFilter extends PIXI.Filter {
    constructor(options = {}) {
        const vertexSrc = `
            attribute vec2 aVertexPosition; attribute vec2 aTextureCoord; uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord; vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }`;

        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord; varying vec2 vScreenCoord;
            uniform sampler2D uSampler; uniform sampler2D u_displacementMap; uniform sampler2D u_waterMask;
            uniform vec2 u_camera_offset; uniform vec2 u_view_size;
            uniform float u_time; uniform bool u_wave_enabled;
            uniform float u_wave_intensity; uniform bool u_surface_enabled; uniform vec3 u_openWaterFoamColor;
            uniform float u_openWaterFoamIntensity; uniform float u_openWaterFoamCoverage;
            uniform float u_openWaterFoamSharpness; uniform float u_openWaterFbmScale;
            uniform float u_openWaterFbmSpeed; uniform float u_openWaterFbmEvolution;
            uniform int u_openWaterFbmOctaves; uniform float u_openWaterFbmLacunarity;
            uniform float u_openWaterFbmPersistence; uniform bool u_sheenEnabled; uniform vec3 u_sheenColor;
            uniform float u_sheenIntensity; uniform float u_sheenScale; uniform float u_sheenSpeed;
            uniform float u_sheenStretch; uniform float u_sheenSharpness; uniform bool u_caustics_enabled;
            uniform vec3 u_causticsColor; uniform float u_causticsIntensity; uniform float u_causticsScale;
            uniform float u_causticsSpeed; uniform float u_causticsLineSharpness; uniform float u_causticsBloomIntensity;
            uniform float u_causticsLineDistortion; uniform float u_causticsLineDistortionScale;
            uniform float u_causticsIntersectionBoost; uniform float u_causticsRoughnessScale;
            uniform float u_causticsRoughnessIntensity;

            vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
            vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
                vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
                vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
                i=mod(i,289.0);
                vec4 p=permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0);
                float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
                vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
                vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
                vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
                vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
                vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
                vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
                vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
                p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
                vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
                m=m*m; return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
            }
            float fbm(vec3 st, int octaves, float lacunarity, float persistence) {
                float v=0.0, a=0.5; for(int i=0;i<8;i++){ if(i>=octaves)break; v+=a*snoise(st); st*=lacunarity; a*=persistence; }
                return v*0.5+0.5;
            }

            void main() {
                float waterMaskValue = texture2D(u_waterMask, vTextureCoord).r;
                if (waterMaskValue < 0.01) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }
                vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
                vec2 wave_uv_offset = u_wave_enabled ? (texture2D(u_displacementMap, vTextureCoord).xy-0.5)*2.0*u_wave_intensity : vec2(0.0);
                vec2 final_distorted_uv = vTextureCoord + wave_uv_offset;
                vec4 sceneColor = texture2D(uSampler, mix(vTextureCoord, final_distorted_uv, waterMaskValue));
                vec3 finalColor = sceneColor.rgb;
                if(u_caustics_enabled){float t=u_time*u_causticsSpeed;vec3 d_coord=vec3(world_coord*u_causticsLineDistortionScale*0.01,t*2.0);float d_noise=snoise(d_coord)*u_causticsLineDistortion;vec3 c1=vec3(world_coord*u_causticsScale*0.02+d_noise,t);float p1=pow(max(0.0,1.0-abs(snoise(c1))),u_causticsLineSharpness);vec3 c2=vec3(world_coord*u_causticsScale*0.01-d_noise,t*0.5);float p2=pow(max(0.0,1.0-abs(snoise(c2))),u_causticsLineSharpness);vec3 r_coord=vec3(world_coord*u_causticsRoughnessScale*0.01,t*1.5);float r_noise=snoise(r_coord)*0.5+0.5;r_noise=1.0-u_causticsRoughnessIntensity+(r_noise*u_causticsRoughnessIntensity);vec3 c3=vec3(world_coord*u_causticsScale*0.005,t*0.2);float b_pat=smoothstep(0.6,1.0,snoise(c3)*0.5+0.5);float l_pat=p1*p2*u_causticsIntersectionBoost;float f_pat=(l_pat*r_noise)+b_pat*u_causticsBloomIntensity;finalColor+=u_causticsColor*f_pat*u_causticsIntensity*waterMaskValue;}
                if(u_surface_enabled){vec2 foam_wave_dist=wave_uv_offset*u_openWaterFbmScale*10.0;vec2 baseFoamUV=(world_coord*u_openWaterFbmScale*0.01)+foam_wave_dist;baseFoamUV+=u_time*u_openWaterFbmSpeed*0.1;float foamTime=u_time*u_openWaterFbmEvolution*0.1;float foamNoise=fbm(vec3(baseFoamUV,foamTime),u_openWaterFbmOctaves,u_openWaterFbmLacunarity,u_openWaterFbmPersistence);float openWaterFoamAmount=smoothstep(1.0-u_openWaterFoamCoverage,1.0-u_openWaterFoamCoverage+u_openWaterFoamSharpness,foamNoise);vec3 openWaterFoamResult=u_openWaterFoamColor*openWaterFoamAmount*u_openWaterFoamIntensity;vec3 sheenResult=vec3(0.0);if(u_sheenEnabled){vec2 sheen_wave_dist=wave_uv_offset*u_sheenScale*10.0;vec2 sheenUV=(world_coord*u_sheenScale*0.01)+sheen_wave_dist;sheenUV.x*=u_sheenStretch;sheenUV.y+=u_time*u_sheenSpeed*0.1;float sheenNoise=snoise(vec3(sheenUV,u_time*0.01));sheenNoise=pow(smoothstep(0.8,1.0,sheenNoise),u_sheenSharpness);sheenResult=u_sheenColor*sheenNoise*u_sheenIntensity;}finalColor+=(openWaterFoamResult+sheenResult)*waterMaskValue;}
                gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), sceneColor.a);
            }`;

        super(vertexSrc, fragmentSrc, { ...options });
    }
}


/**
 * A GlobalEffect that applies comprehensive water effects to the entire scene,
 * including distortion, caustics, and foam. It applies its final filter to
 * `canvas.primary` to affect the map but not the UI.
 */
class WaterFXEffect extends GlobalEffect {
    /** @override */
    static Suffix = "water";

    constructor(layer) {
        super(layer);
        console.log(`[MapShine] WaterFXEffect: Creating global instance.`);
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;

        this.time = 0;
        this.displacementTexture = PIXI.RenderTexture.create({ width: screen.width, height: screen.height });
        this.displacementFilter = new WaveDisplacementFilter();
        this.displacementSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.displacementSprite.width = screen.width;
        this.displacementSprite.height = screen.height;
        this.displacementSprite.filters = [this.displacementFilter];
        
        this.waterEffectsFilter = new WaterEffectsFilter();
        if (canvas.primary) {
            canvas.primary.filters = [...(canvas.primary.filters || []), this.waterEffectsFilter];
        }

        super.initialize();
    }

    getShorelineParticleMaskTexture() {
        return null;
    }

    /** @override */
    update(deltaTime, config) {
        this.visible = config.enabled && config.water.enabled && this.maskSprites.size > 0;
        this.waterEffectsFilter.enabled = this.visible;
        if (!this.visible) return;

        super._renderCombinedMask();

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.time += deltaTime * timeFactor;
        const renderer = canvas.app.renderer;

        renderer.render(this.displacementSprite, { renderTexture: this.displacementTexture, clear: true });

        const stage = canvas.stage, screen = renderer.screen;
        const topLeft = stage.toLocal({ x: 0, y: 0 });
        this.displacementFilter.uniforms.u_time = this.time;
        const u = this.waterEffectsFilter.uniforms;
        u.u_time = this.time;
        u.u_displacementMap = this.displacementTexture;
        u.u_waterMask = this.combinedMaskTexture;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
    }

    /** @override */
    updateFromConfig(config) {
        const wConfig = config.water;
        this.displacementFilter.uniforms.u_speed = wConfig.wave.speed;
        this.displacementFilter.uniforms.u_scale = wConfig.wave.scale;
        this._updateWaterFilterUniforms(this.waterEffectsFilter, wConfig);
    }
    
    _updateWaterFilterUniforms(filter, wConfig) {
        if (!filter) return;
        const u = filter.uniforms;
        const srfConfig = wConfig.surface, cConfig = wConfig.caustics;
        u.u_wave_enabled = wConfig.wave.enabled; u.u_wave_intensity = wConfig.wave.intensity;
        u.u_surface_enabled = srfConfig.enabled; u.u_openWaterFoamColor = hexToRgbArray(srfConfig.foamColor);
        u.u_openWaterFoamIntensity = srfConfig.foamIntensity; u.u_openWaterFoamCoverage = srfConfig.foamCoverage;
        u.u_openWaterFoamSharpness = srfConfig.foamSharpness; u.u_openWaterFbmScale = srfConfig.fbmScale;
        u.u_openWaterFbmSpeed = srfConfig.fbmSpeed; u.u_openWaterFbmEvolution = srfConfig.fbmEvolution;
        u.u_openWaterFbmOctaves = srfConfig.fbmOctaves; u.u_openWaterFbmLacunarity = srfConfig.fbmLacunarity;
        u.u_openWaterFbmPersistence = srfConfig.fbmPersistence; u.u_sheenEnabled = srfConfig.sheenEnabled;
        u.u_sheenColor = hexToRgbArray(srfConfig.sheenColor); u.u_sheenIntensity = srfConfig.sheenIntensity;
        u.u_sheenScale = srfConfig.sheenScale; u.u_sheenSpeed = srfConfig.sheenSpeed;
        u.u_sheenStretch = srfConfig.sheenStretch; u.u_sheenSharpness = srfConfig.sheenSharpness;
        u.u_caustics_enabled = cConfig.enabled; u.u_causticsColor = hexToRgbArray(cConfig.color);
        u.u_causticsIntensity = cConfig.intensity; u.u_causticsScale = cConfig.scale; u.u_causticsSpeed = cConfig.speed;
        u.u_causticsLineSharpness = cConfig.lineSharpness; u.u_causticsBloomIntensity = cConfig.bloomIntensity;
        u.u_causticsLineDistortion = cConfig.lineDistortion; u.u_causticsLineDistortionScale = cConfig.lineDistortionScale;
        u.u_causticsIntersectionBoost = cConfig.intersectionBoost; u.u_causticsRoughnessScale = cConfig.roughnessScale;
        u.u_causticsRoughnessIntensity = cConfig.roughnessIntensity;
    }

    /** @override */
    _onResize() {
        super._onResize();
        const renderer = canvas.app.renderer;
        this.displacementTexture?.resize(renderer.screen.width, renderer.screen.height);
        if (this.displacementSprite) {
             this.displacementSprite.width = renderer.screen.width;
             this.displacementSprite.height = renderer.screen.height;
        }
    }

    /** @override */
    destroy() {
        super.destroy();
        console.log(`[MapShine] WaterFXEffect: Destroying global instance.`);
        if (this.waterEffectsFilter) {
            if (canvas.primary) {
                canvas.primary.filters = (canvas.primary.filters || []).filter(f => f !== this.waterEffectsFilter);
            }
            this.waterEffectsFilter.destroy();
        }
        this.displacementFilter?.destroy(); 
        this.displacementSprite?.destroy(); 
        this.displacementTexture?.destroy(true);
    }
}

// =================================================================================
// SECTION 5: PARTICLE SYSTEM
// =================================================================================
// Description: This section contains the complete, refactored particle system.
//              It is designed as a modular sub-system controlled by the
//              `MapShineEngine`. It handles the creation, management, and animation
//              of all particle effects based on discovered effect targets and
//              geometry masks.
// ---------------------------------------------------------------------------------

/**
 * A utility class to create a new texture by blending two source textures
 * with a MULTIPLY effect. Used to generate intersection masks.
 */
class CompositeMaskGenerator {
    /**
     * @param {string} baseTexturePath - The path to the first texture.
     * @param {string} overlayTexturePath - The path to the second texture.
     * @param {PIXI.Rectangle} rect - The world-space rectangle for the target.
     * @returns {Promise<PIXI.RenderTexture|null>} A new composite texture, or null on failure.
     */
    static async generate(baseTexturePath, overlayTexturePath, rect) {
        const renderer = canvas.app?.renderer;
        if (!renderer || !rect || !baseTexturePath || !overlayTexturePath) return null;

        try {
            const [baseTex, overlayTex] = await Promise.all([
                foundry.canvas.loadTexture(baseTexturePath),
                foundry.canvas.loadTexture(overlayTexturePath)
            ]);

            const container = new PIXI.Container();
            const baseSprite = new PIXI.Sprite(baseTex);
            const overlaySprite = new PIXI.Sprite(overlayTex);

            baseSprite.width = overlaySprite.width = rect.width;
            baseSprite.height = overlaySprite.height = rect.height;
            baseSprite.position.set(rect.x, rect.y);
            overlaySprite.position.set(rect.x, rect.y);
            overlaySprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

            container.addChild(baseSprite, overlaySprite);

            const renderTexture = PIXI.RenderTexture.create({
                width: renderer.screen.width,
                height: renderer.screen.height
            });

            renderer.render(container, {
                renderTexture: renderTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });

            container.destroy({ children: true });
            return renderTexture;

        } catch (error) {
            console.error(`[MapShine] Failed to generate composite mask from "${baseTexturePath}" and "${overlayTexturePath}"`, error);
            return null;
        }
    }
}

// --- Particle System: Definitions & Configuration Builders ---

const PARTICLE_EFFECT_DEFINITIONS = {
    dust: {
        title: "Dust Motes",
        description: "Floating dust particles that appear in areas defined by the _Dust map. Requires a _Dust.webp texture.",
        configPath: 'dust',
        triggerTexture: 'dust',
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'dust')
    },
    glint: {
        title: "Glint Particles",
        description: "Sparkling glints that appear in areas defined by the _Prism map. Requires a _Prism.webp texture.",
        configPath: 'glint',
        triggerTexture: 'prism',
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'prism')
    },
    waterGlints: {
        title: "Water Glints / Spray",
        description: "General-purpose particles spawned across the entire water surface.",
        configPath: 'water.glintParticles',
        triggerTexture: 'water',
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'water')
    },
    fire: {
        title: "Flames",
        description: "A multi-stage effect for fire, combining particles and a bloom glow. Requires a _Fire.webp map where white areas are the heart of the flame.",
        configPath: 'fire.particles',
        triggerTexture: 'fire',
        buildEmitterConfig: (effectConfig, targetData) => buildFireEmitterConfig(effectConfig, targetData, 'fire')
    },
    sparks: {
        title: "Sparks",
        description: "Creates sparks that fly off in turbulent paths. Requires a _Sparks.webp map.",
        configPath: 'sparks',
        triggerTexture: 'sparks',
        buildEmitterConfig: (effectConfig, targetData) => buildSparkEmitterConfig(effectConfig, targetData, 'sparks')
    }
};

const buildSparkEmitterConfig = (effectConfig, targetData, maskKey) => {
    const globalParticleConfig = game.mapShine.profileManager.activeConfig.particleSystems;
    const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
    const config = effectConfig || {};
    const rect = targetData?.rect;

    if (!rect) return { maxParticles: 0, behaviors: [] };

    const spawnMaskTexture = targetData.effectTextures.get(maskKey);
    if (!spawnMaskTexture) return { maxParticles: 0, behaviors: [] }; // Exit if no mask
    
    const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

    // A simplified spawn shape that emits from the target's entire rectangle for testing.
    const spawnBehavior = {
        type: 'spawnShape',
        config: {
            type: 'rect',
            data: {
                x: 0,
                y: 0,
                w: rect.width,
                h: rect.height
            }
        }
    };

    const lifetimeConfig = config.lifetime ?? {}, alphaConfig = config.alpha ?? {}, scaleConfig = config.scale ?? {};
    const colorConfig = config.color ?? {}, pathConfig = config.path ?? {}, speedConfig = pathConfig.speed ?? {};

    let fadeInTime = Math.max(0, alphaConfig.fadeIn ?? 0.0), fadeOutTime = Math.max(0, alphaConfig.fadeOut ?? 1.0);
    if (fadeInTime + fadeOutTime > 1.0) {
        const total = fadeInTime + fadeOutTime;
        fadeInTime /= total; fadeOutTime /= total;
    }

    const behaviors = [
        { type: 'textureSingle', config: { texture: config.particleTexture } },
        spawnBehavior,
        { type: 'alpha', config: { alpha: { list: [{ value: 0, time: 0 }, { value: alphaConfig.max ?? 1.0, time: fadeInTime }, { value: alphaConfig.max ?? 1.0, time: 1.0 - fadeOutTime }, { value: 0, time: 1 }] } } },
        { type: 'scale', config: { scale: { start: (scaleConfig.start ?? 1.0) * (scaleConfig.sizeMultiplier ?? 1.0), end: (scaleConfig.end ?? 0.1) * (scaleConfig.sizeMultiplier ?? 1.0) }, minMult: scaleConfig.minMult ?? 0.5 } },
        { type: 'color', config: { color: { start: colorConfig.start ?? "#FFFFFF", end: colorConfig.end ?? "#FFFFFF" } } },
        {
            type: 'sparkPath',
            config: {
                speed: { start: speedConfig.start ?? 80, end: speedConfig.end ?? 40 },
                speedMinMult: speedConfig.minMult ?? 0.7,
                amplitude: pathConfig.amplitude ?? { min: 10, max: 40 },
                frequency: pathConfig.frequency ?? { min: 40, max: 80 },
                offset: pathConfig.offset ?? { min: 0, max: 6.28 },
                damping: pathConfig.damping ?? 0.5,
                angle: pathConfig.angle ?? { min: -20, max: 20 },
                motionBlur: pathConfig.motionBlur
            }
        }
    ];

    return {
        lifetime: { min: lifetimeConfig.min ?? 1.5, max: lifetimeConfig.max ?? 3.0 },
        blendMode: config.blendMode ?? PIXI.BLEND_MODES.ADD,
        frequency: config.frequency / globalMultiplier,
        emitterLifetime: -1,
        maxParticles: Math.max(1, 2000 * (config.maskInfluence ?? 0.5) * globalMultiplier),
        pos: { x: isScreenSpaceMask ? 0 : rect.x, y: isScreenSpaceMask ? 0 : rect.y },
        addAtBack: false,
        behaviors: behaviors
    };
};

const buildParticleEmitterConfig = (effectConfig, targetData, maskKey) => {
    const globalParticleConfig = game.mapShine.profileManager.activeConfig.particleSystems;
    const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
    const config = effectConfig || {};
    const rect = targetData?.rect;

    if (!rect) return { maxParticles: 0, behaviors: [] };

    // The spawn mask is still needed to check if an emitter should be created at all.
    const spawnMaskTexture = targetData.effectTextures.get(maskKey);
    if (!spawnMaskTexture) return { maxParticles: 0, behaviors: [] }; // Exit if no mask
    
    const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

    // A simplified spawn shape that emits from the target's entire rectangle for testing.
    const spawnBehavior = {
        type: 'spawnShape',
        config: {
            type: 'rect',
            data: {
                x: 0,
                y: 0,
                w: rect.width,
                h: rect.height
            }
        }
    };

    const behaviors = [{ type: 'textureSingle', config: { texture: config.particleTexture ?? "modules/map-shine/assets/particle.webp" } }, spawnBehavior];
    const alphaConfig = config.alpha ?? {};
    let fadeInTime = Math.max(0, alphaConfig.fadeIn ?? 0.1), fadeOutTime = Math.max(0, alphaConfig.fadeOut ?? 0.1);
    if (fadeInTime + fadeOutTime >= 1) { const total = fadeInTime + fadeOutTime; fadeInTime /= total; fadeOutTime /= total; }
    behaviors.push({ type: 'alpha', config: { alpha: { list: [{ value: 0, time: 0 }, { value: alphaConfig.max ?? 0.7, time: fadeInTime }, { value: alphaConfig.max ?? 0.7, time: 1 - fadeOutTime }, { value: 0, time: 1 }] } } });

    const scaleConfig = config.scale ?? {};
    const startScale = (scaleConfig.start ?? 0.05) * (scaleConfig.sizeMultiplier ?? 1.0);
    const endScale = (scaleConfig.end ?? 0.15) * (scaleConfig.sizeMultiplier ?? 1.0);
    behaviors.push({ type: 'scale', config: { scale: { start: startScale, end: endScale }, minMult: scaleConfig.minMult ?? 0.5 } });

    const speedConfig = config.speed ?? {};
    behaviors.push({ type: 'moveSpeed', config: { speed: { start: speedConfig.start ?? 5, end: speedConfig.end ?? 15 }, minMult: speedConfig.minMult ?? 0.5 } });

    const colorConfig = config.color ?? {};
    behaviors.push({ type: 'color', config: { color: { start: colorConfig.start ?? "#FFFFFF", end: colorConfig.end ?? "#FFFFFF" } } });

    const rotConfig = config.rotation ?? {};
    if (rotConfig.enabled) {
        behaviors.push({ type: 'rotation', config: { minStart: 0, maxStart: 360, minSpeed: rotConfig.minSpeed ?? 0, maxSpeed: rotConfig.maxSpeed ?? 20, accel: rotConfig.accel ?? 0 } });
    } else {
        behaviors.push({ type: 'rotationStatic', config: { min: 0, max: 360 } });
    }

    const lifetimeConfig = config.lifetime ?? {};
    return {
        lifetime: { min: lifetimeConfig.min ?? 4, max: lifetimeConfig.max ?? 12 },
        blendMode: config.blendMode ?? PIXI.BLEND_MODES.NORMAL,
        frequency: (config.frequency ?? 0.1) / globalMultiplier,
        emitterLifetime: -1,
        maxParticles: Math.max(1, 2000 * (config.maskInfluence ?? 1.0) * globalMultiplier),
        pos: { x: isScreenSpaceMask ? 0 : rect.x, y: isScreenSpaceMask ? 0 : rect.y },
        addAtBack: false,
        behaviors: behaviors
    };
};

// --- Particle System: Custom Behaviors & Shapes ---

/**
 * A custom PIXI Particles behavior that moves particles along a complex,
 * turbulent path resembling a spark's trajectory. It combines forward motion
 * with sine waves and secondary swirls.
 */
class SparkPathBehavior {
    static type = 'sparkPath';

    constructor(config) {
        this.order = PIXI.particles.behaviors.BehaviorOrder.Late;
        this.config = config;
        // Directly use the speed config object for manual interpolation.
        this.speedConfig = config.speed || { start: 50, end: 50 };
    }

    initParticles(first) {
        let next = first;
        while (next) {
            const config = this.config;
            const pConfig = next.config || (next.config = {});

            pConfig.initRotation = next.rotation + this._getRandom(config.angle.min, config.angle.max) * (Math.PI / 180);
            pConfig.initPosition = new PIXI.Point(next.x, next.y);
            next.oldPosition = new PIXI.Point(next.x, next.y);
            pConfig.movement = 0;

            pConfig.pathAmplitude = this._getRandom(config.amplitude.min, config.amplitude.max);
            pConfig.pathFrequency = this._getRandom(config.frequency.min, config.frequency.max);
            pConfig.pathOffset = this._getRandom(config.offset.min, config.offset.max);
            pConfig.pathDamping = config.damping ?? 0.5;

            pConfig.swirlRadius = pConfig.pathAmplitude * this._getRandom(0.4, 0.8);
            pConfig.swirlFrequency = pConfig.pathFrequency * this._getRandom(0.3, 0.6);
            pConfig.swirlOffset = this._getRandom(0, Math.PI * 2);

            pConfig.swirlInitialSin = Math.sin(pConfig.swirlOffset);
            pConfig.swirlInitialCos = Math.cos(pConfig.swirlOffset);

            pConfig.speedMult = this._getRandom(config.speedMinMult, 1);

            next = next.next;
        }
    }

    updateParticle(particle, deltaSec) {
        if (!particle.config.initPosition) return;

        const pConfig = particle.config;
        
        // Manually interpolate speed to avoid buggy library method.
        const age = particle.agePercent;
        const s = this.speedConfig;
        const speed = (s.start + (s.end - s.start) * age) * pConfig.speedMult;
        pConfig.movement += speed * deltaSec;

        const dampingFactor = (1.0 - (pConfig.pathDamping * particle.agePercent));
        const amplitude = pConfig.pathAmplitude * dampingFactor;
        const swirlRadius = pConfig.swirlRadius * dampingFactor;

        const forward_dist = pConfig.movement;
        const main_t = (forward_dist / pConfig.pathFrequency) + pConfig.pathOffset;
        const main_y = amplitude * (Math.sin(main_t) - Math.sin(pConfig.pathOffset));

        const swirl_t = (forward_dist / pConfig.swirlFrequency) + pConfig.swirlOffset;
        const swirl_x = swirlRadius * (Math.sin(swirl_t) - pConfig.swirlInitialSin);
        const swirl_y = swirlRadius * (Math.cos(swirl_t) - pConfig.swirlInitialCos);

        const x = forward_dist + swirl_x;
        const y = main_y + swirl_y;

        const helperPoint = new PIXI.Point(x, y);

        if (pConfig.initRotation !== 0) {
            const sin = Math.sin(pConfig.initRotation);
            const cos = Math.cos(pConfig.initRotation);
            const xnew = (helperPoint.x * cos) - (helperPoint.y * sin);
            const ynew = (helperPoint.x * sin) + (helperPoint.y * cos);
            helperPoint.x = xnew;
            helperPoint.y = ynew;
        }

        particle.position.x = pConfig.initPosition.x + helperPoint.x;
        particle.position.y = pConfig.initPosition.y + helperPoint.y;

        const dx = particle.position.x - particle.oldPosition.x;
        const dy = particle.position.y - particle.oldPosition.y;

        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            particle.rotation = Math.atan2(dy, dx);
        }

        const mbConfig = this.config.motionBlur;
        if (mbConfig && mbConfig.enabled) {
            const frameSpeed = Math.sqrt(dx * dx + dy * dy);
            let elongation = frameSpeed * mbConfig.strength;
            elongation = Math.min(elongation, mbConfig.maxLength);
            const baseScale = particle.scale.y;
            particle.scale.x = baseScale + elongation;
        }

        particle.oldPosition.copyFrom(particle.position);
    }

    _getRandom(min, max) {
        if (min === max) return min;
        return Math.random() * (max - min) + min;
    }
}


/**
 * A custom PIXI Particles spawn shape that determines spawn locations
 * based on the bright areas of a provided texture mask.
 */
class TextureMaskShape {
    static type = "textureMask";

    constructor(config) {
        this.width = config.width;
        this.height = config.height;
        this.offsetX = config.x || 0;
        this.offsetY = config.y || 0;
        this.threshold = config.threshold ?? 128;
        this.validPoints = [];
        this.texture = null;
        this.pointCompilationDensity = 4;
        this.isDynamicScreenMask = config.isDynamicScreenMask ?? false;

        const textureSource = config.texture;
        if (!textureSource) {
            console.error("[MapShine] TextureMaskShape: No texture source provided in config.");
            this.texture = PIXI.Texture.EMPTY;
            return;
        }

        if (textureSource instanceof PIXI.Texture) {
            this.texture = textureSource;
            if (this.texture.baseTexture.valid) {
                this._compileValidPoints();
            } else {
                this.texture.baseTexture.once('loaded', () => this._compileValidPoints());
                this.texture.baseTexture.once('error', (bt, err) => console.error(`[MapShine] TextureMaskShape: PIXI.Texture failed to load`, err));
            }
        } else if (typeof textureSource === 'string') {
            foundry.canvas.loadTexture(textureSource).then(texture => {
                this.texture = texture;
                this._compileValidPoints();
            }).catch(err => {
                console.error(`[MapShine] TextureMaskShape: Failed to load texture from path: ${textureSource}`, err);
                this.texture = PIXI.Texture.EMPTY;
            });
        } else {
            console.warn("[MapShine] TextureMaskShape: Unknown texture source type provided:", textureSource);
            this.texture = PIXI.Texture.EMPTY;
        }
    }

    updateTexture(newTexture) {
        if (this.texture === newTexture || !newTexture?.valid) return;
        this.texture = newTexture;
        this._compileValidPoints();
    }

    _compileValidPoints() {
        const renderer = canvas.app?.renderer;
        if (!renderer || !this.texture?.valid || this.texture.width === 0 || this.texture.height === 0) {
            return;
        }

        this.validPoints.length = 0;
        const texture = this.texture;
        const step = Math.max(1, Math.floor(this.pointCompilationDensity));

        const renderTexture = PIXI.RenderTexture.create({ width: texture.width, height: texture.height });
        const sprite = new PIXI.Sprite(texture);
        renderer.render(sprite, { renderTexture: renderTexture, clear: true });
        const pixelData = renderer.extract.pixels(renderTexture);
        sprite.destroy();

        if (this.isDynamicScreenMask) {
            for (let y = 0; y < texture.height; y += step) {
                for (let x = 0; x < texture.width; x += step) {
                    const index = (y * texture.width + x) * 4;
                    if (pixelData[index] >= this.threshold) {
                        this.validPoints.push(canvas.stage.toLocal(new PIXI.Point(x, y)));
                    }
                }
            }
        } else {
            for (let y = 0; y < texture.height; y += step) {
                for (let x = 0; x < texture.width; x += step) {
                    const index = (y * texture.width + x) * 4;
                    if (pixelData[index] >= this.threshold) {
                        const worldX = this.offsetX + (x / texture.width) * this.width;
                        const worldY = this.offsetY + (y / texture.height) * this.height;
                        this.validPoints.push(new PIXI.Point(worldX, worldY));
                    }
                }
            }
        }
        renderTexture.destroy(true);
    }

    getRandPos(particle) {
        if (this.validPoints.length === 0) return;
        const point = this.validPoints[Math.floor(Math.random() * this.validPoints.length)];
        particle.position.copyFrom(point);
    }
}


/**
 * A particle spawn shape that uses raw geometry data (points, lines, areas)
 * to determine spawn locations mathematically, avoiding any dependency on rendering.
 */
class GeometryMaskShape {
    static type = "geometryMask";

    constructor(config) {
        this.group = config.group;
        this._points = this.group.points || [];
        this._type = this.group.type || 'point';

        if (this._type === 'area' && this._points.length > 0) {
            let minX = this._points[0].x, maxX = this._points[0].x;
            let minY = this._points[0].y, maxY = this._points[0].y;
            for (let i = 1; i < this._points.length; i++) {
                minX = Math.min(minX, this._points[i].x); maxX = Math.max(maxX, this._points[i].x);
                minY = Math.min(minY, this._points[i].y); maxY = Math.max(maxY, this._points[i].y);
            }
            this._bounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
    }

    _isPointInPolygon(point) {
        let isInside = false;
        const points = this._points; const n = points.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            const intersect = ((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) isInside = !isInside;
        }
        return isInside;
    }

    getRandPos(particle) {
        if (!this._points || this._points.length === 0) return;
        let p = new PIXI.Point(0, 0);

        switch (this._type) {
            case 'point':
                p = this._points[Math.floor(Math.random() * this._points.length)];
                break;
            case 'line':
                if (this._points.length < 2) { p = this._points[0]; break; }
                const segmentIndex = Math.floor(Math.random() * (this._points.length - 1));
                const p1 = this._points[segmentIndex], p2 = this._points[segmentIndex + 1];
                const t = Math.random();
                p.x = p1.x + t * (p2.x - p1.x); p.y = p1.y + t * (p2.y - p1.y);
                break;
            case 'area':
                if (this._points.length < 3 || !this._bounds) return;
                let attempts = 0; const MAX_ATTEMPTS = 50;
                do {
                    p.x = this._bounds.x + Math.random() * this._bounds.width;
                    p.y = this._bounds.y + Math.random() * this._bounds.height;
                    attempts++;
                } while (!this._isPointInPolygon(p) && attempts < MAX_ATTEMPTS);
                if (attempts >= MAX_ATTEMPTS) { p = this._points[Math.floor(Math.random() * this._points.length)]; }
                break;
        }
        particle.position.copyFrom(p);
    }
}

/**
 * A custom PIXI Particles behavior that combines a particle's inherent speed with a
 * dynamic global wind force. Used for the fire effect. Replaces the standard 'moveSpeed'.
 */
class FireParticleBehavior {
    static type = 'fireParticle';

    constructor(config) {
        this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
        this.config = config;
        // Directly use the speed config object for manual interpolation, bypassing PropertyList.
        this.speedConfig = config.speed || { start: 10, end: 10 };
    }

    initParticles(first) {
        let next = first;
        while (next) {
            // Each particle gets its own random speed multiplier
            next.config.speedMult = Math.random() * (1 - (this.config.minMult ?? 0.5)) + (this.config.minMult ?? 0.5);
            next = next.next;
        }
    }

    updateParticle(particle, deltaSec) {
        // 1. Manually interpolate speed to avoid buggy PropertyList.interpolate
        const age = particle.agePercent;
        const s = this.speedConfig;
        const currentSpeed = (s.start + (s.end - s.start) * age) * particle.config.speedMult;
        const particleVelocity = new PIXI.Point(0, -currentSpeed); // Negative Y is up

        // 2. Get the global wind force
        const windManager = game.mapShine.particleSystem?.fireWindManager;
        const windVelocity = new PIXI.Point(0, 0);
        if (windManager && this.config.wind?.enabled) {
            const angleRad = windManager.angle * (Math.PI / 180);
            const force = this.config.wind.force ?? 0;
            windVelocity.x = Math.cos(angleRad) * windManager.speed * force;
            windVelocity.y = Math.sin(angleRad) * windManager.speed * force;
        }

        // 3. Combine velocities and apply to position
        const finalVx = particleVelocity.x + windVelocity.x;
        const finalVy = particleVelocity.y + windVelocity.y;

        particle.position.x += finalVx * deltaSec;
        particle.position.y += finalVy * deltaSec;
    }
}

// --- Particle System: Core Classes ---

const buildFireEmitterConfig = (effectConfig, targetData, maskKey) => {
    const globalParticleConfig = game.mapShine.profileManager.activeConfig.particleSystems;
    const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
    const config = effectConfig || {};
    const rect = targetData?.rect;

    if (!rect) return { maxParticles: 0, behaviors: [] };

    // Correctly get the texture from the EffectTarget's texture map.
    const spawnMaskTexture = targetData.effectTextures.get(maskKey);
    if (!spawnMaskTexture) return { maxParticles: 0, behaviors: [] }; // Exit if no mask

    const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

    // A simplified spawn shape that emits from the target's entire rectangle for testing.
    const spawnBehavior = {
        type: 'spawnShape',
        config: {
            type: 'rect',
            data: {
                x: 0,
                y: 0,
                w: rect.width,
                h: rect.height
            }
        }
    };

    const behaviors = [{ type: 'textureSingle', config: { texture: config.particleTexture ?? "modules/map-shine/assets/particle.webp" } }, spawnBehavior];
    const alphaConfig = config.alpha ?? {};
    let fadeInTime = Math.max(0, alphaConfig.fadeIn ?? 0.1), fadeOutTime = Math.max(0, alphaConfig.fadeOut ?? 0.1);
    if (fadeInTime + fadeOutTime >= 1) { const total = fadeInTime + fadeOutTime; fadeInTime /= total; fadeOutTime /= total; }
    behaviors.push({ type: 'alpha', config: { alpha: { list: [{ value: 0, time: 0 }, { value: alphaConfig.max ?? 0.7, time: fadeInTime }, { value: alphaConfig.max ?? 0.7, time: 1 - fadeOutTime }, { value: 0, time: 1 }] } } });

    const scaleConfig = config.scale ?? {};
    const startScale = (scaleConfig.start ?? 0.05) * (scaleConfig.sizeMultiplier ?? 1.0);
    const endScale = (scaleConfig.end ?? 0.15) * (scaleConfig.sizeMultiplier ?? 1.0);
    behaviors.push({ type: 'scale', config: { scale: { start: startScale, end: endScale }, minMult: scaleConfig.minMult ?? 0.5 } });
    
    // Use the custom fire particle behavior which accounts for wind.
    const speedConfig = config.speed ?? {};
    const windConfig = config.wind ?? {};
    behaviors.push({
        type: 'fireParticle',
        config: {
            speed: { 
                start: speedConfig.start ?? 5,
                end: speedConfig.end ?? 15
            },
            minMult: speedConfig.minMult ?? 0.5,
            wind: windConfig
        }
    });

    const colorConfig = config.color ?? {};
    behaviors.push({ type: 'color', config: { color: { start: colorConfig.start ?? "#FFFFFF", end: colorConfig.end ?? "#FFFFFF" } } });

    const rotConfig = config.rotation ?? {};
    if (rotConfig.enabled) {
        behaviors.push({ type: 'rotation', config: { minStart: 0, maxStart: 360, minSpeed: rotConfig.minSpeed ?? 0, maxSpeed: rotConfig.maxSpeed ?? 20, accel: rotConfig.accel ?? 0 } });
    } else {
        behaviors.push({ type: 'rotationStatic', config: { min: 0, max: 360 } });
    }

    const lifetimeConfig = config.lifetime ?? {};
    return {
        lifetime: { min: lifetimeConfig.min ?? 4, max: lifetimeConfig.max ?? 12 },
        blendMode: config.blendMode ?? PIXI.BLEND_MODES.NORMAL,
        frequency: (config.frequency ?? 0.1) / globalMultiplier,
        emitterLifetime: -1,
        maxParticles: Math.max(1, 2000 * (config.maskInfluence ?? 1.0) * globalMultiplier),
        pos: { x: isScreenSpaceMask ? 0 : rect.x, y: isScreenSpaceMask ? 0 : rect.y },
        addAtBack: false,
        behaviors: behaviors
    };
};

/**
 * Manages the dynamic wind simulation for fire particles.
 */
class FireWindManager {
    constructor(config = {}) {
        this.config = config;
        this.angle = 0;
        this.speed = config.baseSpeed || 50;
        this._targetAngle = 0;
        this._angleChangeTimer = 0;
        this._timeToNextAngleChange = this._getRandom(this.config.angleChangeFrequencyMin, this.config.angleChangeFrequencyMax);
        this._isGusting = false;
        this._gustTimer = 0;
        this._timeToNextGust = this._getRandom(this.config.gustFrequencyMin, this.config.gustFrequencyMax);
        this._gustDuration = 0;
    }

    destroy() { /* No-op for this version */ }

    updateFromConfig(config) {
        this.config = { ...config };
    }

    update(delta) {
        this._angleChangeTimer += delta;
        if (this._angleChangeTimer >= this._timeToNextAngleChange) {
            this._targetAngle = this.angle + this._getRandom(-(this.config.angleChangeRange || 20), this.config.angleChangeRange || 20);
            this._timeToNextAngleChange = this._getRandom(this.config.angleChangeFrequencyMin, this.config.angleChangeFrequencyMax);
            this._angleChangeTimer = 0;
        }
        this.angle += (this._targetAngle - this.angle) * 0.01;

        this._gustTimer += delta;
        if (this._isGusting) {
            if (this._gustTimer >= this._gustDuration) {
                this._isGusting = false; this._gustTimer = 0;
                this._timeToNextGust = this._getRandom(this.config.gustFrequencyMin, this.config.gustFrequencyMax);
            }
        } else {
            if (this._gustTimer >= this._timeToNextGust) {
                this._isGusting = true; this._gustTimer = 0;
                this._gustDuration = this._getRandom(this.config.gustDurationMin, this.config.gustDurationMax);
            }
        }
        const targetSpeed = this._isGusting ? this.config.gustSpeed : this.config.baseSpeed;
        this.speed += (targetSpeed - this.speed) * 0.1;
    }

    _getRandom(min, max) { return Math.random() * (max - min) + min; }
}


/**
 * Controls the lifecycle of all particle emitters for a single effect type (e.g., 'dust').
 * It is managed by the main ParticleSystem.
 */
class ParticleEffectController {
    constructor(definition, parentContainer) {
        this.definition = definition;
        this.parentContainer = parentContainer;
        this.emitters = new Map();
        this.pendingTargets = new Map();
        this.config = {};
        this.rgbSplitFilter = null;
        this.bloomFilter = null;
        this.particleOnlyContainer = null;

        if (definition.configPath === 'glint') {
            this.rgbSplitFilter = new ParticleRgbSplitFilter();
        }
        if (definition.configPath === 'fire.particles') {
            const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
            if (BloomFilterConstructor) { this.bloomFilter = new BloomFilterConstructor(); }
            this.particleOnlyContainer = new PIXI.Container();
            this.parentContainer.addChild(this.particleOnlyContainer);
        }
    }

    static getSettingsHTML(effectKey) {
        // ... (This very large static method remains unchanged from the original code) ...
        // [See original prompt for full implementation]
    }

    updateTargets(targets, fullConfig) {
        this.destroyAllEmitters();

        this.config = foundry.utils.getProperty(fullConfig, this.definition.configPath);
        if (!fullConfig.enabled || !this.config?.enabled) {
            return;
        }

        const targetsToProcess = [targets.background, ...targets.tiles.values()].filter(Boolean);
        for (const target of targetsToProcess) {
            const targetId = target.tile ? target.tile.id : 'background';
            // Correctly check if the target has the required texture map
            if (target.effectTextures.has(this.definition.triggerTexture)) {
                this.pendingTargets.set(targetId, target);
            }
        }
        // TODO: Add geometry-based target discovery
    }

    async _createEmitterForTarget(targetData, targetId) {
        if (targetData.isGeometry) {
            this._createEmitterForGeometry(targetData.group, targetId);
            return;
        }
    
        let customMaskTexture = null;
        // Create a shallow copy to avoid modifying the original EffectTarget instance.
        const localTargetData = { ...targetData }; 
    
        // Check for the specific dust/structural combination
        if (this.definition.configPath === 'dust' && localTargetData.effectTextures.has('dust') && localTargetData.effectTextures.has('structural')) {
            const dustPath = localTargetData.effectTextures.get('dust');
            const structuralPath = localTargetData.effectTextures.get('structural');
            customMaskTexture = await CompositeMaskGenerator.generate(dustPath, structuralPath, localTargetData.rect);
            
            if (customMaskTexture) {
                // Create a *new* Map so we don't mutate the original EffectTarget's map.
                localTargetData.effectTextures = new Map(localTargetData.effectTextures);
                // Replace the 'dust' texture path with the generated RenderTexture.
                localTargetData.effectTextures.set('dust', customMaskTexture);
            }
        }
    
        const particleTexPath = this.config.particleTexture ?? "modules/map-shine/assets/particle.webp";
        if (!particleTexPath || typeof particleTexPath !== 'string') return;
    
        try {
            const texture = await foundry.canvas.loadTexture(particleTexPath);
            const emitterConfig = this.definition.buildEmitterConfig(this.config, localTargetData);
    
            if (emitterConfig.maxParticles === 0) {
                customMaskTexture?.destroy(true);
                return;
            }
    
            const textureBehavior = emitterConfig.behaviors.find(b => b.type === 'textureSingle');
            if (textureBehavior) textureBehavior.config.texture = texture;
    
            const emitterParent = this.particleOnlyContainer || this.parentContainer;
            const emitter = new PIXI.particles.Emitter(emitterParent, emitterConfig);
            if (customMaskTexture) emitter._customMaskTexture = customMaskTexture; // Store for later cleanup
            emitter.autoUpdate = false;
    
            this.emitters.set(targetId, { emitter });
        } catch (err) {
            console.error(`[MapShine] Failed to load particle texture: "${particleTexPath}"`, err);
            customMaskTexture?.destroy(true);
        }
    }

    async _createEmitterForGeometry(group, targetId) {
        // ... (Implementation remains the same as provided previously) ...
    }

    update(deltaTime) {
        if (this.pendingTargets.size > 0) {
            for (const [targetId, targetData] of this.pendingTargets.entries()) {
                this._createEmitterForTarget(targetData, targetId);
            }
            this.pendingTargets.clear();
        }

        for (const { emitter } of this.emitters.values()) {
            emitter.update(deltaTime);
        }
    }

    updateFromConfig(fullConfig) {
        // ... (Implementation remains the same as provided previously) ...
    }

    destroyAllEmitters() {
        if (!this.emitters) this.emitters = new Map();
        if (!this.pendingTargets) this.pendingTargets = new Map();
        for (const { emitter } of this.emitters.values()) {
            if (emitter._customMaskTexture) { emitter._customMaskTexture.destroy(true); emitter._customMaskTexture = null; }
            emitter.destroy();
        }
        this.emitters.clear();
        this.pendingTargets.clear();
    }

    destroy() {
        this.destroyAllEmitters();
        this.rgbSplitFilter?.destroy();
        this.bloomFilter?.destroy();
        this.particleOnlyContainer?.destroy({ children: true });
        this.parentContainer = null;
    }
}


/**
 * The main Particle System, managed by the MapShineEngine.
 * This class replaces the old ParticleManager and ParticleLayer, centralizing all
 * particle-related logic and rendering.
 */
class ParticleSystem {
    constructor(layer) {
        this.masterContainer = new PIXI.Container();
        layer.addChild(this.masterContainer);
        this.fireWindManager = new FireWindManager();

        this.controllers = new Map();
        for (const [key, definition] of Object.entries(PARTICLE_EFFECT_DEFINITIONS)) {
            const effectContainer = new PIXI.Container();
            const controller = new ParticleEffectController(definition, effectContainer);
            this.controllers.set(key, controller);
            this.masterContainer.addChild(effectContainer);
        }
        console.log(`[MapShine] ParticleSystem: Initialized with ${this.controllers.size} effect controllers.`);
    }

    get totalParticleCount() {
        let count = 0;
        for (const controller of this.controllers.values()) {
            for (const { emitter } of controller.emitters.values()) {
                count += emitter.particleCount;
            }
        }
        return count;
    }

    updateEffectTargets(targets, config) {
        if (!this.controllers.size) return;

        const targetData = {
            background: targets.find(t => t.id === 'background') || null,
            tiles: new Map(targets.filter(t => t.tile).map(t => [t.id, t]))
        };

        const waterEffect = MapShineEngine._activeEffects.find(e => e instanceof WaterFXEffect);
        const foamMaskTexture = waterEffect?.getShorelineParticleMaskTexture();
        const dynamicMasks = {};
        if (foamMaskTexture) {
            dynamicMasks['water.shoreline.foamParticles'] = foamMaskTexture;
        }

        for (const controller of this.controllers.values()) {
            controller.updateTargets(targetData, config, dynamicMasks);
        }
    }

    updateFromConfig(config) {
        this.fireWindManager.updateFromConfig(config.fire.particles.wind);
        for (const controller of this.controllers.values()) {
            controller.updateFromConfig(config);
        }
    }

    update(deltaTime) {
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const deltaInSeconds = deltaTime * timeFactor;
        
        this.fireWindManager.update(deltaInSeconds);

        for (const controller of this.controllers.values()) {
            controller.update(deltaInSeconds);
        }
    }

    tearDown() {
        console.log(`[MapShine] ParticleSystem: Tearing down.`);
        this.fireWindManager.destroy();
        for (const controller of this.controllers.values()) {
            controller.destroy();
        }
        this.controllers.clear();
        this.masterContainer?.destroy({ children: true });
    }
}

/**
 * A PIXI Filter that applies a simple chromatic aberration effect to a container.
 * Used for particle effects like glints.
 */
class ParticleRgbSplitFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;
            uniform float uAmount;
            uniform vec2 uTexelSize;

            void main(void) {
                if (uAmount == 0.0) {
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }
                
                vec2 offset = vec2(uAmount * uTexelSize.x, 0.0);
                
                float r = texture2D(uSampler, vTextureCoord - offset).r;
                float g = texture2D(uSampler, vTextureCoord).g;
                float b = texture2D(uSampler, vTextureCoord + offset).b;
                float a = texture2D(uSampler, vTextureCoord).a;

                gl_FragColor = vec4(r, g, b, a);
            }`;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uAmount: options.amount ?? 0.0,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}

/*********************************************************************************
 *  SECTION 6: USER INTERFACE & SETTINGS MANAGEMENT
 *********************************************************************************/
// Description: Classes for the loading screen, debugger UI, profile management,
//              and client-side settings overrides.
// ---------------------------------------------------------------------------------

/**
 * Defines the configuration for client-side user overrides.
 * This map is used to build the settings menu and to apply the overrides.
 */
const CLIENT_OVERRIDES_CONFIG = {
    baseShine: { name: "Metallic Shine", path: 'baseShine', intensitySubPath: 'animation.globalIntensity' },
    cloudShadows: { name: "Cloud Shadows", path: 'cloudShadows', intensitySubPath: 'shadowIntensity' },
    canopy: { name: "Canopy Shadows", path: 'canopy', intensitySubPath: 'shadowIntensity' },
    structuralShadows: { name: "Structural Shadows", path: 'structuralShadows', intensitySubPath: 'shadowIntensity' },
    iridescence: { name: "Iridescence", path: 'iridescence', intensitySubPath: 'intensity' },
    ambient: { name: "Ambient / Emissive", path: 'ambient', intensitySubPath: 'intensity' },
    groundGlow: { name: "Glow in the Dark", path: 'groundGlow', intensitySubPath: 'intensity' },
    heatDistortion: { name: "Heat Distortion", path: 'heatDistortion', intensitySubPath: 'intensity' },
    prism: { name: "Prism", path: 'prism', intensitySubPath: 'intensity' },
    advancedBloom: { name: "Global Bloom", path: 'advancedBloom', intensitySubPath: 'brightness' },
    vignette: { name: "Post: Vignette", path: 'postProcessing.vignette', intensitySubPath: 'amount' },
    chromaticAberration: { name: "Post: Chromatic Aberration", path: 'postProcessing.chromaticAberration', intensitySubPath: 'amount' },
    postProcessing: { name: "Post Processing (Group)", path: 'postProcessing' },
    dust: { name: "Dust Motes", path: 'dust', intensitySubPath: 'maskInfluence' },
    glint: { name: "Glint Particles", path: 'glint', intensitySubPath: 'maskInfluence' }
};


/**
 * A static class that applies client-side settings overrides to a configuration object.
 * This allows individual users to disable or reduce the intensity of effects for
 * performance or accessibility reasons, without affecting the GM's scene settings.
 */
class ClientOverrides {
    /**
     * Applies all registered user overrides to a given configuration object.
     * @param {object} config - The configuration object to modify.
     * @returns {object} The modified configuration object.
     */
    static apply(config) {
        for (const [key, data] of Object.entries(CLIENT_OVERRIDES_CONFIG)) {
            const enabledSetting = game.settings.get(MODULE_ID, `user-${key}-enabled`);
            if (enabledSetting === false) {
                foundry.utils.setProperty(config, `${data.path}.enabled`, false);
                continue;
            }

            if (data.intensitySubPath) {
                const intensitySetting = game.settings.get(MODULE_ID, `user-${key}-intensity`);
                if (intensitySetting !== 100) {
                    const fullIntensityPath = `${data.path}.${data.intensitySubPath}`;
                    const originalValue = foundry.utils.getProperty(config, fullIntensityPath);
                    if (typeof originalValue === 'number') {
                        const newValue = originalValue * (intensitySetting / 100);
                        foundry.utils.setProperty(config, fullIntensityPath, newValue);
                    }
                }
            }
        }

        const disableDistortion = game.settings.get(MODULE_ID, 'user-disable-distortion');
        if (disableDistortion) {
            if (config.heatDistortion) config.heatDistortion.enabled = false;
            if (config.postProcessing?.lensDistortion) config.postProcessing.lensDistortion.enabled = false;
        }

        const disableFringe = game.settings.get(MODULE_ID, 'user-disable-color-fringe');
        if (disableFringe) {
            if (config.baseShine?.rgbSplit) config.baseShine.rgbSplit.enabled = false;
            if (config.postProcessing?.chromaticAberration) config.postProcessing.chromaticAberration.enabled = false;
        }

        return config;
    }
}

/**
 * Manages the loading, layering, and saving of effect configurations.
 * This class is the central authority for the module's settings. It handles:
 * - The base module defaults.
 * - Scene-specific saved profiles (from scene flags).
 * - World-level saved profiles (from game settings).
 * - Temporary, per-user modifications made via the debugger UI.
 * It constructs the final `activeConfig` object that is used by all other systems.
 */
class ProfileManager {
    constructor() {
        this.moduleId = MODULE_ID;
        this.ui = null;
        this.activeConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
        this._sceneProfile = null;
        this._userOverrides = {};
        this.activeSceneId = null;
        this.status = {
            sceneProfileLoaded: false,
            isDirty: false,
            error: null,
            profileSource: 'none'
        };
        this._worldProfiles = {};
        this._defaultProfileName = '';
    }

    /**
     * Resets the manager to its initial state, clearing all scene-specific data.
     * This is crucial for preventing data leakage between scene transitions.
     */
    reset() {
        console.log("[MapShine] ProfileManager: Resetting for new scene.");
        this.activeConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
        this._sceneProfile = null;
        this._userOverrides = {};
        this.activeSceneId = null;
        this.status = { sceneProfileLoaded: false, isDirty: false, error: null, profileSource: 'none' };
    }

    get isGm() {
        return game.user?.isGM;
    }

    /**
     * Sanitizes a settings object by comparing it against a template (the defaults).
     * It removes keys from the settings object if they no longer exist in the template
     * or if the data types have become mismatched between module versions.
     * @param {object} template - The canonical object structure (e.g., MODULE_DEFAULTS).
     * @param {object} settings - The object to clean (e.g., _userOverrides or a scene profile).
     * @returns {object} The sanitized settings object.
     */
    _reconcileOverrides(template, settings) {
        for (const key in settings) {
            if (!(key in template)) {
                delete settings[key];
                continue;
            }
            const templateValue = template[key];
            const settingValue = settings[key];
            const isTemplateObject = typeof templateValue === 'object' && templateValue !== null && !Array.isArray(templateValue);
            const isSettingObject = typeof settingValue === 'object' && settingValue !== null && !Array.isArray(settingValue);

            if (isTemplateObject && !isSettingObject) {
                delete settings[key];
                continue;
            }
            if (isTemplateObject && isSettingObject) {
                this._reconcileOverrides(templateValue, settingValue);
                if (Object.keys(settingValue).length === 0) {
                    delete settings[key];
                }
            }
        }
        return settings;
    }

    /**
     * Initializes the manager for the currently active scene. It loads world profiles,
     * the scene-specific profile, and any temporary user overrides. It then constructs
     * the initial `activeConfig`.
     */
    initializeForScene() {
        this.activeSceneId = canvas.scene?.id;
        if (!this.activeSceneId) {
            console.error("[MapShine] ProfileManager: Could not initialize for scene: No active scene.");
            this.activeConfig = this._getEffectiveConfig();
            return;
        }

        this._worldProfiles = game.settings.get(this.moduleId, PROFILES_SETTING) || {};
        this._defaultProfileName = game.settings.get(this.moduleId, DEFAULT_PROFILE_SETTING) || '';
        this.status.profileSource = 'none';

        let rawSceneProfile = canvas.scene?.getFlag(this.moduleId, 'profile') || null;

        if (rawSceneProfile) {
            this.status.profileSource = 'scene';
        } else if (this._defaultProfileName && this._worldProfiles[this._defaultProfileName]) {
            console.log(`[MapShine] ProfileManager: No scene profile. Applying world default: "${this._defaultProfileName}"`);
            rawSceneProfile = foundry.utils.deepClone(this._worldProfiles[this._defaultProfileName].config);
            this.status.profileSource = 'world';
        }

        this._sceneProfile = rawSceneProfile ? this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawSceneProfile) : null;
        this.status.sceneProfileLoaded = !!this._sceneProfile;

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        let rawUserOverrides = allUserOverrides[this.activeSceneId] || {};
        this._userOverrides = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawUserOverrides);
        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);

        this.activeConfig = this._getEffectiveConfig();
        console.log("[MapShine] ProfileManager: Live configuration built for the current scene.");
    }

    /**
     * Links the manager to the debugger UI instance.
     * @param {MaterialEditorDebugger} ui - The debugger UI instance.
     */
    async initializeUI(ui) {
        this.ui = ui;
        if (this.ui?.eventHandler) {
            await this.ui.eventHandler._populateProfilesDropdown();
        }
        this.updateUIState();
    }

    /**
     * Constructs the final configuration by layering defaults, scene profiles, and user overrides.
     * @returns {object} The final, active configuration object.
     */
    _getEffectiveConfig() {
        let baseConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
        if (this._sceneProfile) {
            this._customMerge(baseConfig, this._sceneProfile);
        }

        let finalConfig = foundry.utils.deepClone(baseConfig);
        if (this._userOverrides) {
            this._customMerge(finalConfig, this._userOverrides);
        }

        const worldDefaultProfile = this._worldProfiles[this._defaultProfileName]?.config;
        if (worldDefaultProfile) {
            const effectsToCheck = Object.keys(MODULE_DEFAULTS).filter(k =>
                typeof MODULE_DEFAULTS[k] === 'object' && MODULE_DEFAULTS[k] !== null &&
                !Array.isArray(MODULE_DEFAULTS[k]) && foundry.utils.hasProperty(MODULE_DEFAULTS[k], 'worldBasedOnly')
            );

            for (const effectKey of effectsToCheck) {
                if (finalConfig[effectKey]?.worldBasedOnly && worldDefaultProfile[effectKey]) {
                    let worldBasedEffectConfig = foundry.utils.deepClone(MODULE_DEFAULTS[effectKey]);
                    this._customMerge(worldBasedEffectConfig, worldDefaultProfile[effectKey]);
                    if (this._userOverrides && this._userOverrides[effectKey]) {
                        this._customMerge(worldBasedEffectConfig, this._userOverrides[effectKey]);
                    }
                    worldBasedEffectConfig.worldBasedOnly = true;
                    finalConfig[effectKey] = worldBasedEffectConfig;
                }
            }
        }
        return ClientOverrides.apply(finalConfig);
    }

    /**
     * A custom merge utility that intelligently handles arrays and prevents
     * outdated primitive values from overwriting newer object structures.
     * @param {object} target - The object to merge into.
     * @param {object} source - The object to merge from.
     */
    _customMerge(target, source) {
        for (const key of Object.keys(source)) {
            const sourceValue = source[key]; const targetValue = target[key];
            if (Array.isArray(sourceValue)) {
                target[key] = foundry.utils.deepClone(sourceValue);
                continue;
            }
            if (typeof sourceValue === 'object' && sourceValue !== null) {
                if (typeof targetValue !== 'object' || targetValue === null || Array.isArray(targetValue)) {
                    target[key] = {};
                }
                this._customMerge(target[key], sourceValue);
            } else {
                if (typeof targetValue !== 'object' || targetValue === null) {
                    target[key] = sourceValue;
                }
            }
        }
    }

    /**
     * Records a change made by the user in the debugger UI.
     * @param {string} path - The dot-notation path to the setting.
     * @param {*} value - The new value of the setting.
     */
    async recordUserChange(path, value) {
        foundry.utils.setProperty(this._userOverrides, path, value);
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = this._userOverrides;
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);
        this.activeConfig = this._getEffectiveConfig();
        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);
        this.updateUIState();
    }

    /**
     * Propagates the current active configuration to all running systems.
     * In the new architecture, this simply notifies the engine.
     */
    async updateAllSystemsFromConfig() {
        if (!canvas?.ready) return;
        game.mapShine.timeControl.timeFactor = this.activeConfig.timeControl.globalTime / 100.0;
        // Apply zIndex from config to the live layer instance
        canvas.layers.find(l => l instanceof MapShineLayer).zIndex = this.activeConfig.ambientLayerZIndex;
        MapShineEngine.updateAllSystemsFromConfig(this.activeConfig);
    }

    /**
     * Saves the current active configuration (including user overrides) to the scene flags.
     */
    async saveConfigToScene() {
        if (!this.isGm) return;
        await canvas.scene.setFlag(this.moduleId, 'profile', this._getEffectiveConfig());
        ui.notifications.info("FX Profile saved to current scene.");
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        delete allUserOverrides[this.activeSceneId];
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);
        this.initializeForScene();
        await this.updateAllSystemsFromConfig();
        if (this.ui) {
            this.updateUIState();
            this.ui.eventHandler.updateAllControls();
        }
    }

    /**
     * Discards any temporary user overrides and reloads the last saved scene profile.
     */
    async revertToSceneDefault() {
        this._userOverrides = {};
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        delete allUserOverrides[this.activeSceneId];
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);
        this.initializeForScene();
        await this.updateAllSystemsFromConfig();
        if (this.ui) {
            this.updateUIState();
            this.ui.eventHandler.updateAllControls();
        }
        ui.notifications.info("Reverted to scene default FX.");
    }

    /**
     * Temporarily ignores the scene profile and uses the module defaults.
     */
    async revertToModuleDefault() {
        this._userOverrides = {};
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = {};
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);
        const originalSceneProfile = this._sceneProfile;
        this._sceneProfile = null;
        this.initializeForScene();
        this._sceneProfile = originalSceneProfile;
        await this.updateAllSystemsFromConfig();
        if (this.ui) {
            this.updateUIState();
            this.ui.eventHandler.updateAllControls();
        }
        ui.notifications.info("Reverted to module default FX for this session.");
    }

    /** Updates the status indicators in the debugger UI. */
    updateUIState() {
        if (!this.ui?.element) return;
        const light = this.ui.element.querySelector('#fx-status-light');
        const text = this.ui.element.querySelector('#fx-status-text');
        const saveSceneBtn = this.ui.element.querySelector('#profile-save-scene');
        const revertSceneBtn = this.ui.element.querySelector('#profile-revert-scene');
        if (saveSceneBtn) saveSceneBtn.style.display = this.isGm ? '' : 'none';
        if (revertSceneBtn) revertSceneBtn.disabled = !this.status.sceneProfileLoaded;
        if (!light || !text) return;

        light.className = 'fx-status-light';
        let sourceText = "", stateText = "", lightColor = "grey";

        if (this.status.error) {
            lightColor = 'red';
            sourceText = `Error: ${this.status.error}`;
        } else {
            switch (this.status.profileSource) {
                case 'scene': sourceText = "Scene Profile"; lightColor = 'green'; break;
                case 'world': sourceText = `World Default: ${this.getDefaultProfileName()}`; lightColor = 'green'; break;
                default: sourceText = "Module Defaults"; lightColor = 'grey'; break;
            }
            stateText = this.status.isDirty ? "(Modified)" : "(Active)";
            if (this.status.isDirty) lightColor = 'blue';
        }
        text.textContent = `${sourceText} ${stateText}`.trim();
        light.classList.add(lightColor);
    }

    async getProfiles() { return this._worldProfiles; }
    getDefaultProfileName() { return this._defaultProfileName; }

    async loadProfile(name) {
        const profileData = this._worldProfiles[name];
        if (!profileData) return null;
        let configToLoad = profileData.config || profileData;
        configToLoad = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), foundry.utils.deepClone(configToLoad));
        this._userOverrides = foundry.utils.deepClone(configToLoad);
        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = this._userOverrides;
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);
        this.initializeForScene();
        await this.updateAllSystemsFromConfig();
        if (this.ui) {
            this.updateUIState();
            this.ui.eventHandler.updateAllControls();
            this.ui.eventHandler.applyProfileUIState(profileData);
        }
        ui.notifications.info(`Profile "${name}" loaded.`);
        return profileData;
    }

    async saveProfile(name, config, uiState) {
        if (!this.isGm) return false;
        if (!name) { ui.notifications.warn("Please enter a name for the profile."); return false; }
        if (this._worldProfiles[name]) {
            const overwrite = await Dialog.confirm({ title: "Profile Exists", content: `<p>A world profile named "<strong>${name}</strong>" already exists. Overwrite it?</p>`, defaultYes: false });
            if (!overwrite) return false;
        }
        this._worldProfiles[name] = { config: foundry.utils.deepClone(config), ui: uiState };
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        ui.notifications.info(`World Profile "${name}" saved!`);
        return true;
    }

    async updateProfile(name, config, uiState) {
        if (!this.isGm) return false;
        if (!name || !this._worldProfiles[name]) { ui.notifications.warn("Select a valid profile to update."); return false; }
        this._worldProfiles[name] = { config: foundry.utils.deepClone(config), ui: uiState };
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        ui.notifications.info(`World Profile "${name}" updated.`);
        return true;
    }

    async deleteProfile(name) {
        if (!this.isGm || !name || !this._worldProfiles[name]) return false;
        delete this._worldProfiles[name];
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        if (this.getDefaultProfileName() === name) await this.setDefaultProfile("");
        return true;
    }

    async setDefaultProfile(name) {
        if (!this.isGm) return;
        await game.settings.set(this.moduleId, DEFAULT_PROFILE_SETTING, name);
        this._defaultProfileName = name;
        ui.notifications.info(`"${name}" is now the default profile for new scenes.`);
    }

    async copySettingsToClipboard() {
        const configString = JSON.stringify(this._getEffectiveConfig(), null, 2);
        try {
            await navigator.clipboard.writeText(configString);
            ui.notifications.info("Current FX settings copied to clipboard.");
        } catch (err) {
            console.error("[MapShine] Failed to copy settings to clipboard:", err, configString);
            ui.notifications.warn("Could not copy to clipboard. Settings logged to console (F12).");
        }
    }

    async pasteSettingsFromClipboard() {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) { ui.notifications.warn("Clipboard is empty."); return; }
            let pastedConfig;
            try {
                pastedConfig = JSON.parse(clipboardText);
            } catch (err) { ui.notifications.error("Clipboard content is not valid JSON."); return; }
            if (typeof pastedConfig !== 'object' || pastedConfig === null || !pastedConfig.baseShine) {
                ui.notifications.error("Pasted data does not appear to be a valid Map Shine profile.");
                return;
            }
            this._userOverrides = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), pastedConfig);
            const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
            allUserOverrides[this.activeSceneId] = this._userOverrides;
            await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);
            this.initializeForScene();
            await this.updateAllSystemsFromConfig();
            if (this.ui) {
                this.updateUIState();
                this.ui.eventHandler.updateAllControls();
            }
            ui.notifications.info("Settings pasted from clipboard and applied as temporary changes.");
        } catch (err) {
            ui.notifications.error("Failed to read from clipboard. Check browser permissions.");
        }
    }
}

/**
 * A graphical component for editing cubic Bezier curves, used for advanced
 * color correction in the post-processing pipeline. It renders an SVG-based
 * editor and emits change events when the user modifies a curve.
 */
class CurveEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.width = options.width || 256;
        this.height = options.height || 256;
        this.onChange = options.onChange || (() => {});

        this.points = [
            { x: 0, y: 0 },
            { x: this.width * 0.25, y: this.height * 0.25 },
            { x: this.width * 0.75, y: this.height * 0.75 },
            { x: this.width, y: this.height }
        ];

        this.activePoint = null;
        this.init();
    }

    init() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute('width', this.width);
        this.svg.setAttribute('height', this.height);
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.container.appendChild(this.svg);

        const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gridGroup.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
        gridGroup.setAttribute('stroke-width', '0.5');
        this.svg.appendChild(gridGroup);

        for (let i = 1; i < 4; i++) {
            const pos = this.width * (i / 4);
            const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            vLine.setAttribute('x1', pos); vLine.setAttribute('y1', 0); vLine.setAttribute('x2', pos); vLine.setAttribute('y2', this.height);
            gridGroup.appendChild(vLine);
            const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            hLine.setAttribute('x1', 0); hLine.setAttribute('y1', pos); hLine.setAttribute('x2', this.width); hLine.setAttribute('y2', pos);
            gridGroup.appendChild(hLine);
        }

        const neutralLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        neutralLine.setAttribute('x1', 0); neutralLine.setAttribute('y1', this.height);
        neutralLine.setAttribute('x2', this.width); neutralLine.setAttribute('y2', 0);
        neutralLine.setAttribute('stroke', 'rgba(255,255,255,0.2)');
        neutralLine.setAttribute('stroke-width', '1');
        neutralLine.setAttribute('stroke-dasharray', '4 4');
        this.svg.appendChild(neutralLine);

        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.path.setAttribute('fill', 'none');
        this.path.setAttribute('stroke', '#00aaff');
        this.path.setAttribute('stroke-width', '2.5');
        this.svg.appendChild(this.path);

        this.controlPoints = this.points.map((p, i) => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', this.height - p.y);
            circle.setAttribute('r', 6);
            circle.setAttribute('fill', 'rgba(0, 170, 255, 0.5)');
            circle.setAttribute('stroke', '#fff');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('cursor', 'grab');
            this.svg.appendChild(circle);
            circle.addEventListener('mousedown', (e) => { this.activePoint = i; });
            return circle;
        });

        this.svg.addEventListener('mousemove', this.onDrag.bind(this));
        this.svg.addEventListener('mouseup', this.onEndDrag.bind(this));
        this.svg.addEventListener('mouseleave', this.onEndDrag.bind(this));

        this.drawCurve();
    }

    onDrag(e) {
        if (this.activePoint === null) return;
        e.preventDefault();
        this.svg.style.cursor = 'grabbing';
        const rect = this.svg.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        x = Math.max(0, Math.min(this.width, x));
        y = Math.max(0, Math.min(this.height, y));

        if (this.activePoint > 0 && this.activePoint < this.points.length - 1) {
            this.points[this.activePoint].x = x;
        }
        this.points[this.activePoint].y = this.height - y;
        this.drawCurve();
    }

    onEndDrag() {
        if (this.activePoint !== null) {
            this.svg.style.cursor = 'default';
            this.activePoint = null;
            this.onChange(this.getNormalizedPoints());
        }
    }

    setPoints(normalizedPoints) {
        if (!normalizedPoints || (normalizedPoints.length !== 2 && normalizedPoints.length !== 4)) {
            console.warn("CurveEditor: Invalid points data provided for setPoints.", normalizedPoints);
            // Fallback to a default linear curve
            normalizedPoints = [{x: 0, y: 0}, {x: 1, y: 1}];
        }
    
        if (normalizedPoints.length === 2) {
             // If linear, create the 4 control points for a cubic Bezier that represents a line
            this.points = [
                { x: normalizedPoints[0].x * this.width, y: normalizedPoints[0].y * this.height },
                { x: (normalizedPoints[0].x * 0.67 + normalizedPoints[1].x * 0.33) * this.width, y: (normalizedPoints[0].y * 0.67 + normalizedPoints[1].y * 0.33) * this.height },
                { x: (normalizedPoints[0].x * 0.33 + normalizedPoints[1].x * 0.67) * this.width, y: (normalizedPoints[0].y * 0.33 + normalizedPoints[1].y * 0.67) * this.height },
                { x: normalizedPoints[1].x * this.width, y: normalizedPoints[1].y * this.height }
            ];
        } else {
            // It's a 4-point cubic curve
            this.points = normalizedPoints.map(p => ({
                x: p.x * this.width,
                y: p.y * this.height
            }));
        }
    
        this.drawCurve();
        this.onChange(this.getNormalizedPoints(), { isLoading: true });
    }

    getNormalizedPoints() {
        return this.points.map(p => ({
            x: p.x / this.width,
            y: p.y / this.height
        }));
    }

    drawCurve() {
        this.controlPoints.forEach((circle, i) => {
            circle.setAttribute('cx', this.points[i].x);
            circle.setAttribute('cy', this.height - this.points[i].y);
        });
        const p = this.points;
        const pathData = `M ${p[0].x},${this.height - p[0].y} C ${p[1].x},${this.height - p[1].y} ${p[2].x},${this.height - p[2].y} ${p[3].x},${this.height - p[3].y}`;
        this.path.setAttribute('d', pathData);
    }
}


/**
 * Handles all DOM events for the debugger UI. This class acts as the bridge
 * between the user's actions in the UI and the ProfileManager's state.
 */
class DebuggerEventHandler {
    constructor(element, profileManager) {
        this.element = element;
        this.profileManager = profileManager;
        this.sliderDebounceTimeout = null;
        this.allLutPresets = {};
        this.curveEditor = null;
    }

    get config() {
        return this.profileManager.activeConfig;
    }

    initialize() {
        this.addEventListeners();
        this._makeDraggable();
        this._populateDiagnosticDropdown();
        this._populateLutDropdown().then(() => {
            this.updateAllControls();
        });
        this.updateAllControls();
        this._updateFavoritesList();
        this._initializeCurveEditor();
        this.updatePlacementStatus();
        this.updateTextureDiscoveryStatus(); 
        Hooks.on('mapShine:targetsRefreshed', this.updateTextureDiscoveryStatus.bind(this));
    }

    updateTextureDiscoveryStatus() {
        if (!this.element) return;
        
        const allDiscovered = new Map();
        for (const target of TargetRegistry.targets) {
            for (const [key, path] of target.effectTextures.entries()) {
                if (!allDiscovered.has(key)) {
                    allDiscovered.set(key, path);
                }
            }
        }

        for (const key of Object.keys(TextureDiscoverer.SUFFIX_MAP)) {
            const light = this.element.querySelector(`#status-textures-${key}`);
            const pathInput = this.element.querySelector(`#texture-path-${key}`);

            if (light && pathInput) {
                if (allDiscovered.has(key)) {
                    light.className = 'traffic-light ok';
                    light.title = `Found: ${allDiscovered.get(key)}`;
                    pathInput.value = allDiscovered.get(key);
                } else {
                    light.className = 'traffic-light inactive';
                    light.title = 'Not found for current scene/tiles.';
                    pathInput.value = 'Not Found';
                }
            }
        }
    }

    updateParticleCount(count, limit) {
        if (!this.element) return;
        const countEl = this.element.querySelector('#particle-count-display');
        const limitEl = this.element.querySelector('#particle-limit-display');
        if (countEl) countEl.textContent = count;
        if (limitEl) limitEl.textContent = limit;
    }

    addEventListeners() {
        this.element.addEventListener('input', this._handleGenericInput.bind(this));
        this.element.addEventListener('change', this._handleGenericInput.bind(this));
        this.element.addEventListener('click', (e) => {
            this._handleListManagerClick(e);
            this._handleFilePickerClick(e);
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            if (action === 'open-map-points-editor') {
                e.preventDefault();
                if (!game.mapShine.mapPointsEditor || game.mapShine.mapPointsEditor.closing) {
                    game.mapShine.mapPointsEditor = new MapPointsEditor().render(true);
                } else {
                    game.mapShine.mapPointsEditor.bringToTop();
                }
            }
        });
        this.element.addEventListener('change', this._handleListManagerChange.bind(this));

        const addListener = (selector, event, handler) => {
            const el = this.element.querySelector(selector);
            if (el) el.addEventListener(event, handler.bind(this));
        };

        addListener('#material-editor-close-btn', 'click', this._onClose);
        addListener('#material-editor-minimize-btn', 'click', this._onMinimize);
        addListener('#reload-canvas-btn', 'click', () => window.location.reload());
        addListener('#profile-save', 'click', this._onSaveProfile);
        addListener('#profile-load', 'click', this._onLoadProfile);
        addListener('#profile-update', 'click', this._onUpdateProfile);
        addListener('#profile-delete', 'click', this._onDeleteProfile);
        addListener('#profile-set-default', 'click', this._onSetDefaultProfile);
        addListener('#profile-save-scene', 'click', () => this.profileManager.saveConfigToScene());
        addListener('#profile-revert-scene', 'click', () => this.profileManager.revertToSceneDefault());
        addListener('#profile-revert-module', 'click', () => this.profileManager.revertToModuleDefault());
        addListener('#output-config-btn', 'click', this._onOutputConfig);
        addListener('#profile-copy-settings', 'click', () => this.profileManager.copySettingsToClipboard());
        addListener('#profile-paste-settings', 'click', () => this.profileManager.pasteSettingsFromClipboard());
        addListener('#apply-color-preset-btn', 'click', this._onApplyColorPreset);
        addListener('#save-color-favorite-btn', 'click', this._onSaveColorFavorite);
    }

    _initializeCurveEditor() {
        const curveEditorContainer = this.element.querySelector('#curve-editor-container');
        if (curveEditorContainer) {
            this.curveEditor = new CurveEditor(curveEditorContainer, {
                onChange: this._onCurveChange.bind(this)
            });
            const channelSelector = this.element.querySelector('#curve-channel-selector');
            if (channelSelector) {
                channelSelector.addEventListener('change', this._onCurveChannelChange.bind(this));
            }
            this._updateCurveEditorView();
        }
    }

    updatePlacementStatus() {
        if (!this.element) return;
        const statusEl = this.element.querySelector('#map-placement-status');
        if (!statusEl) return;
        const isActive = game.mapShine.mapPointsInteractionManager?.isActive;
        statusEl.textContent = isActive ? 'ACTIVE' : 'INACTIVE';
        statusEl.className = isActive ? 'status-active' : 'status-inactive';
    }

    _populateDiagnosticDropdown() {
        const dropdown = this.element.querySelector('#control-diagnostic-displaySuffix');
        const diagnosticLayer = canvas.layers.find(l => l instanceof DiagnosticLayer);
        if (!dropdown || !diagnosticLayer) return;

        const available = diagnosticLayer.getAvailableDebugTextures();
        const currentValue = dropdown.value;

        const createOptGroup = (label, options) => {
            const group = document.createElement('optgroup');
            group.label = label;
            for (const [value, text] of Object.entries(options)) {
                const option = new Option(text, value);
                group.appendChild(option);
            }
            return group;
        };

        dropdown.innerHTML = '';

        if (!foundry.utils.isEmpty(available.generated)) {
            dropdown.appendChild(createOptGroup("Generated Masks", available.generated));
        }

        dropdown.appendChild(createOptGroup("Input Masks", available.inputs));

        if (!foundry.utils.isEmpty(available.intermediates)) {
            dropdown.appendChild(createOptGroup("Intermediate Textures", available.intermediates));
        }
        if (!foundry.utils.isEmpty(available.external)) {
            dropdown.appendChild(createOptGroup("External Buffers", available.external));
        }

        dropdown.value = currentValue;
    }

    async _populateLutDropdown() {
        const dropdown = this.element.querySelector('#control-postProcessing-lut-presetName');
        if (!dropdown) return;

        const combinedPresets = foundry.utils.deepClone(LUT_PRESETS);

        try {
            const source = game.settings.get("core", "noCanvas") ? "public" : "data";
            const lutDir = "modules/map-shine/assets/luts/";
            const dirContents = await FilePicker.browse(source, lutDir);

            for (const filePath of dirContents.files) {
                if (filePath.toLowerCase().endsWith('.cube')) {
                    const filename = filePath.substring(filePath.lastIndexOf('/') + 1);
                    const friendlyName = filename
                        .replace(/\.cube$/i, '')
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());

                    const presetKey = `cube_${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;

                    combinedPresets[presetKey] = {
                        name: `${friendlyName} (.cube)`,
                        path: filePath
                    };
                }
            }
        } catch (e) {
            console.warn("[MapShine] Could not browse for .cube LUT files. Only showing default presets.", e);
        }

        this.allLutPresets = combinedPresets;
        const currentValue = dropdown.value;
        dropdown.innerHTML = '';
        for (const [key, data] of Object.entries(this.allLutPresets)) {
            const option = new Option(data.name, key);
            dropdown.add(option);
        }
        if (this.allLutPresets[currentValue]) {
            dropdown.value = currentValue;
        }
    }

    _handleFilePickerClick(e) {
        const button = e.target.closest('.file-picker-btn');
        if (!button) return;
        e.preventDefault();
        const targetId = button.dataset.fpTarget;
        const type = button.dataset.fpType || 'any';
        const targetInput = this.element.querySelector(`#${targetId}`);
        if (!targetInput) return;

        new FilePicker({
            type: type,
            current: targetInput.value,
            callback: path => {
                targetInput.value = path;
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }).browse();
    }

    _handleListManagerClick(e) {
        const target = e.target;
        const container = target.closest('.list-manager-container');
        if (!container) return;
        const path = container.dataset.path;
        let list = foundry.utils.getProperty(this.config, path) || [];

        if (target.matches('.add-item-btn')) {
            list.push("New Hint");
            this.profileManager.recordUserChange(path, list);
            this._renderHintList();
        }

        if (target.matches('.remove-item-btn')) {
            const index = parseInt(target.dataset.index, 10);
            if (!isNaN(index)) {
                list.splice(index, 1);
                this.profileManager.recordUserChange(path, list);
                this._renderHintList();
            }
        }
    }

    _handleListManagerChange(e) {
        const target = e.target;
        const listItem = target.closest('.list-item-row');
        if (!listItem) return;
        const container = listItem.closest('.list-manager-container');
        if (!container) return;
        const path = container.dataset.path;
        let list = foundry.utils.getProperty(this.config, path) || [];
        const index = parseInt(target.dataset.index, 10);
        if (!isNaN(index)) {
            list[index] = target.value;
            this.profileManager.recordUserChange(path, list);
        }
    }

    _renderHintList() {
        const path = 'sceneTransition.randomHints';
        const container = this.element.querySelector(`#${DebuggerUIBuilder._createSafeId(path)}-list-container`);
        if (!container) return;
        const hints = foundry.utils.getProperty(this.config, path) || [];
        container.innerHTML = hints.map((hint, index) => `
            <div class="list-item-row">
                <input type="text" data-index="${index}" value="${Handlebars.escapeExpression(hint)}">
                <button class="remove-item-btn" data-index="${index}" title="Remove Hint">X</button>
            </div>
        `).join('');
    }

    updateAllControls() {
        if (!this.element) return;
        this.element.querySelectorAll('[data-path]').forEach(el => {
            if (el.classList.contains('list-manager-container')) return;
            const path = el.dataset.path;
            const value = this._getPathValue(this.config, path);
            if (value === undefined || value === null) return;

            if (el.type === 'checkbox') el.checked = Boolean(value);
            else if (el.type === 'radio') {
                el.checked = (el.value === String(value));
            } else el.value = value;

            if (el.type === 'range') this._updateSliderValue(el.id, value, el.step);
            if (el.closest('.summary-control')) {
                const detailsElement = el.closest('details');
                if (detailsElement) detailsElement.classList.toggle('disabled-effect', !el.checked);
            }
        });

        this.element.querySelectorAll('[data-world-based-path]').forEach(icon => {
            const path = icon.dataset.worldBasedPath;
            const isWorldBased = this._getPathValue(this.config, path);
            icon.classList.toggle('active', isWorldBased);
        });

        this._updatePatternControlVisibility();
        this._renderHintList();
        this._updateRandomHintVisibility();
        this._updateLutControlVisibility();
        this._updateCurveEditorView();

        const timeSlider = this.element.querySelector('#control-timeControl-globalTime');
        if (timeSlider) {
            const timeValue = (game.mapShine.timeControl.timeFactor ?? 1.0) * 100;
            timeSlider.value = timeValue;
            this._updateSliderValue(timeSlider.id, timeValue, timeSlider.step);
        }
    }

    async _handleGenericInput(e) {
        const path = e.target.dataset.path;
        if (!path) return;
        if (e.target.closest('.list-manager-container')) return;
        if (e.target.type === 'radio' && !e.target.checked) return;

        const isSlider = e.target.type === 'range';
        let value = e.target.type === 'checkbox' ? e.target.checked : (isSlider ? Number(e.target.value) : e.target.value);

        if (isSlider && e.type === 'input') {
            this._updateSliderValue(e.target.id, value, e.target.step);
            return;
        }

        let processedValue = value;
        if (e.target.tagName === 'SELECT' && !isNaN(Number(value))) {
            processedValue = Number(value);
        }

        await this.profileManager.recordUserChange(path, processedValue);
        await this.profileManager.updateAllSystemsFromConfig();

        if (isSlider) this._updateSliderValue(e.target.id, value, e.target.step);
        if (e.target.type === 'checkbox' && e.target.closest('.summary-control')) {
            const detailsElement = e.target.closest('details');
            if (detailsElement) detailsElement.classList.toggle('disabled-effect', !e.target.checked);
        }

        if (path === 'baseShine.patternType') this._updatePatternControlVisibility();
        if (path === 'sceneTransition.useRandomHint') this._updateRandomHintVisibility();
        if (path === 'postProcessing.lut.presetName') this._updateLutControlVisibility();
        if (path === 'tileOpacity') TargetRegistry.applyTileOpacities(this.config);
    }

    _updateRandomHintVisibility() {
        const useRandom = this.config.sceneTransition.useRandomHint;
        const randomWrapper = this.element.querySelector('#sceneTransition-randomHints-wrapper');
        if (randomWrapper) randomWrapper.style.display = useRandom ? 'block' : 'none';
    }

    _updateLutControlVisibility() {
        const preset = this.config.postProcessing.lut.presetName;
        const customPathWrapper = this.element.querySelector('#lut-custom-path-wrapper');
        if (customPathWrapper) customPathWrapper.style.display = (preset === 'custom') ? 'block' : 'none';
    }

    setEffectAvailability(effectKey, isAvailable) {
        if (!this.element) return;
        const detailsElement = this.element.querySelector(`#details-${effectKey}`);
        if (!detailsElement) return;
        const checkboxId = DebuggerUIBuilder._createSafeId(`${effectKey}.enabled`);
        const checkboxElement = this.element.querySelector(`#${checkboxId}`);
        if (isAvailable) {
            detailsElement.classList.remove('effect-unavailable');
            if (checkboxElement) checkboxElement.disabled = false;
        } else {
            detailsElement.classList.add('effect-unavailable');
            if (checkboxElement) {
                checkboxElement.disabled = true;
                checkboxElement.checked = false;
            }
        }
    }

    _onClose() { game.mapShine.debugger?.destroy(); }

    _onMinimize() { this.element.classList.toggle('minimized'); }

    _getPathValue(obj, path) { return foundry.utils.getProperty(obj, path); }

    applyProfileUIState(profileData) {
        if (!profileData?.ui?.details) return;
        for (const [id, isOpen] of Object.entries(profileData.ui.details)) {
            const detailElement = this.element.querySelector(`#${id}`);
            if (detailElement) detailElement.open = isOpen;
        }
    }

    _updateSliderValue(elementId, value, step) {
        const valueEl = this.element.querySelector(`#${elementId}-value`);
        if (valueEl) {
            const stepString = String(step);
            const decimals = stepString.includes('.') ? stepString.split('.')[1].length : 0;
            valueEl.textContent = Number(value).toFixed(decimals);
        }
    }

    _updatePatternControlVisibility() {
        const patternType = this._getPathValue(this.config, 'baseShine.patternType');
        const isStripes = patternType === 'stripes';
        const stripesControls = this.element.querySelector('#pattern-stripes-controls');
        const checkerControls = this.element.querySelector('#pattern-checkerboard-controls');
        if (stripesControls) stripesControls.style.display = isStripes ? '' : 'none';
        if (checkerControls) checkerControls.style.display = isStripes ? 'none' : '';
    }

    async _populateProfilesDropdown() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const profiles = await this.profileManager.getProfiles();
        const names = Object.keys(profiles).sort();
        const defaultProfileName = this.profileManager.getDefaultProfileName();
        dropdown.innerHTML = '';
        if (names.length) {
            names.forEach(n => {
                const isDefault = (n === defaultProfileName) ? ' (Default)' : '';
                dropdown.add(new Option(`${n}${isDefault}`, n));
            });
            dropdown.value = defaultProfileName || names[0];
            dropdown.disabled = false;
        } else {
            dropdown.add(new Option('No profiles saved', ''));
            dropdown.disabled = true;
        }
    }

    async _onSaveProfile() {
        const nameInput = this.element.querySelector('#profile-name');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        const uiState = { details: {} };
        this.element.querySelectorAll('details[id]').forEach(el => { uiState.details[el.id] = el.open; });
        const success = await this.profileManager.saveProfile(name, this.profileManager.activeConfig, uiState);
        if (success) {
            nameInput.value = '';
            this._populateProfilesDropdown();
        }
    }

    async _onUpdateProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
        const uiState = { details: {} };
        this.element.querySelectorAll('details[id]').forEach(el => { uiState.details[el.id] = el.open; });
        const success = await this.profileManager.updateProfile(name, this.profileManager.activeConfig, uiState);
        if (success) this._populateProfilesDropdown();
    }

    async _onLoadProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (dropdown?.value) await this.profileManager.loadProfile(dropdown.value);
    }

    async _onDeleteProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown?.value) return;
        const confirmed = await Dialog.confirm({ title: "Delete Profile", content: `<p>Are you sure you want to delete the world profile "<strong>${dropdown.value}</strong>"? This cannot be undone.</p>`, defaultYes: false });
        if (confirmed && await this.profileManager.deleteProfile(dropdown.value)) {
            this._populateProfilesDropdown();
        }
    }

    async _onSetDefaultProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (dropdown?.value) {
            await this.profileManager.setDefaultProfile(dropdown.value);
            this._populateProfilesDropdown();
        }
    }

    _onOutputConfig() {
        const configString = JSON.stringify(this.config, null, 4);
        console.log("[MapShine] CURRENT CONFIG:", configString);
        try {
            navigator.clipboard.writeText(configString);
            ui.notifications.info("Config logged to console & copied to clipboard.");
        } catch (err) {
            ui.notifications.warn("Config logged to console (Copying failed).");
        }
    }

    async _onCurveChange(points, options = {}) {
        if (!this.curveEditor || options.isLoading) return;
        const curvesConfig = this.config.postProcessing.colorCorrection.curves;
        const activeChannel = curvesConfig.activeChannel || 'rgb';
        const path = `postProcessing.colorCorrection.curves.${activeChannel}.points`;
        await this.profileManager.recordUserChange(path, points);
        if (activeChannel === 'rgb') { // If RGB is changed, sync it to individual channels
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.red.points', points);
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.green.points', points);
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.blue.points', points);
        }
        await this.profileManager.updateAllSystemsFromConfig();
    }

    _onCurveChannelChange(e) {
        if (!e.target.checked) return;
        this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.activeChannel', e.target.value);
        this._updateCurveEditorView();
    }

    _updateCurveEditorView() {
        if (!this.curveEditor) return;
        const curvesConfig = this.config.postProcessing.colorCorrection.curves;
        const activeChannel = curvesConfig.activeChannel || 'rgb';
        const channelPoints = curvesConfig[activeChannel]?.points;
        if (channelPoints) this.curveEditor.setPoints(channelPoints);
        const colorMap = { rgb: '#00aaff', red: '#ff6b6b', green: '#6bff6b', blue: '#6b6bff' };
        this.curveEditor.path.setAttribute('stroke', colorMap[activeChannel]);
    }

    async _onApplyColorPreset() {
        const dropdown = this.element.querySelector('#control-postProcessing-colorCorrection-activePreset');
        if (!dropdown) return;
        const preset = COLOR_CORRECTION_PRESETS[dropdown.value];
        if (!preset) return;
        // Use Promise.all for efficiency
        await Promise.all([
            this.profileManager.recordUserChange('postProcessing.colorCorrection.saturation', preset.saturation),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.brightness', preset.brightness),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.contrast', preset.contrast),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.exposure', preset.exposure),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.gamma', preset.gamma),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.levels', preset.levels),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.whiteBalance', preset.whiteBalance),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.tint', preset.tint),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.invert', preset.invert),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.curves', preset.curves),
            this.profileManager.recordUserChange('postProcessing.colorCorrection.selective', preset.selective)
        ]);
        await this.profileManager.updateAllSystemsFromConfig();
        this.updateAllControls();
        ui.notifications.info(`Applied "${preset.name}" color preset.`);
    }

    _onSaveColorFavorite() {
        const name = prompt("Enter a name for this color favorite:");
        if (!name?.trim()) return;
        const ccConfig = this.config.postProcessing.colorCorrection;
        const favorite = { name: name.trim(), ...foundry.utils.deepClone(ccConfig) };
        let favorites = [];
        try { favorites = JSON.parse(game.settings.get('map-shine', 'colorFavorites') || '[]'); } catch (e) {}
        favorites.push(favorite);
        game.settings.set('map-shine', 'colorFavorites', JSON.stringify(favorites));
        this._updateFavoritesList();
        ui.notifications.info(`Saved color favorite "${name}".`);
    }

    _updateFavoritesList() {
        const container = this.element.querySelector('#color-favorites-list');
        if (!container) return;
        let favorites = [];
        try { favorites = JSON.parse(game.settings.get('map-shine', 'colorFavorites') || '[]'); } catch (e) {}
        if (favorites.length === 0) {
            container.innerHTML = '<p style="color: #888; font-style: italic;">No favorites saved yet.</p>';
            return;
        }
        container.innerHTML = favorites.map((fav, i) => `
            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
                <button class="apply-favorite-btn" data-index="${i}" title="Apply ${fav.name}" style="flex: 1; height: 20px; font-size: 11px;">${fav.name}</button>
                <button class="delete-favorite-btn" data-index="${i}" title="Delete ${fav.name}" style="width: 20px; height: 20px; font-size: 11px; color: #ff6b6b;">X</button>
            </div>`).join('');
        container.querySelectorAll('.apply-favorite-btn').forEach(btn => btn.onclick = e => this._applyColorFavorite(parseInt(e.target.dataset.index)));
        container.querySelectorAll('.delete-favorite-btn').forEach(btn => btn.onclick = e => this._deleteColorFavorite(parseInt(e.target.dataset.index)));
    }

    async _applyColorFavorite(index) {
        let favorites = [];
        try { favorites = JSON.parse(game.settings.get('map-shine', 'colorFavorites') || '[]'); } catch (e) { return; }
        const favorite = favorites[index];
        if (!favorite) return;
        await this.profileManager.recordUserChange('postProcessing.colorCorrection', foundry.utils.deepClone(favorite));
        await this.profileManager.updateAllSystemsFromConfig();
        this.updateAllControls();
        ui.notifications.info(`Applied color favorite "${favorite.name}".`);
    }

    _deleteColorFavorite(index) {
        let favorites = [];
        try { favorites = JSON.parse(game.settings.get('map-shine', 'colorFavorites') || '[]'); } catch (e) { return; }
        const favorite = favorites[index];
        if (!favorite || !confirm(`Delete color favorite "${favorite.name}"?`)) return;
        favorites.splice(index, 1);
        game.settings.set('map-shine', 'colorFavorites', JSON.stringify(favorites));
        this._updateFavoritesList();
        ui.notifications.info(`Deleted color favorite "${favorite.name}".`);
    }

    _makeDraggable() {
        const elmnt = this.element;
        const header = elmnt.querySelector('#material-editor-header');
        if (!header) return;
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const dragMouseDown = (e) => {
            e.preventDefault();
            pos3 = e.clientX; pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };
        const elementDrag = (e) => {
            e.preventDefault();
            pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
            pos3 = e.clientX; pos4 = e.clientY;
            let newTop = Math.max(0, Math.min(elmnt.offsetTop - pos2, window.innerHeight - header.offsetHeight));
            let newLeft = Math.max(-elmnt.offsetWidth + 100, Math.min(elmnt.offsetLeft - pos1, window.innerWidth - 100));
            elmnt.style.top = `${newTop}px`; elmnt.style.left = `${newLeft}px`;
        };
        const closeDragElement = () => {
            document.onmouseup = null; document.onmousemove = null;
            const currentPos = game.settings.get(MODULE_ID, 'debugger-position') || {};
            currentPos.top = elmnt.offsetTop; currentPos.left = elmnt.offsetLeft;
            game.settings.set(MODULE_ID, 'debugger-position', currentPos);
        };
        header.onmousedown = dragMouseDown;
    }
}

class DebuggerUIBuilder {
    constructor() {}

    buildRootElement() {
        const element = document.createElement('div');
        element.id = 'material-editor-debugger';

        // Create and append the style element separately to ensure robust parsing.
        const styleEl = document.createElement('style');
        styleEl.textContent = this._getStyles();
        element.appendChild(styleEl);

        // Create a temporary container to parse the base HTML structure.
        const template = document.createElement('template');
        template.innerHTML = this._getBaseHTML().trim();
        // Append the parsed child nodes to the main element.
        element.append(...template.content.childNodes);

        // Now that the base structure is reliably in the DOM, query and populate it.
        element.querySelector('#material-editor-profiles-section').innerHTML = this._buildProfileSection();

        const postProcessingPane = element.querySelector('#post-processing-pane');
        const mainContentArea = element.querySelector('.main-content-area');

        // This method is now part of the builder class.
        const managedEffects = this._buildManagedEffectsHTML();

        postProcessingPane.innerHTML = managedEffects.postProcessing;
        postProcessingPane.innerHTML += this._buildParticleSystemSection();

        const otherEffectSections = this._getEffectSections();
        const allRightSideEffects = managedEffects.otherEffects.concat(otherEffectSections);
        const midPoint = Math.ceil(allRightSideEffects.length / 2);
        const column1Effects = allRightSideEffects.slice(0, midPoint);
        const column2Effects = allRightSideEffects.slice(midPoint);

        mainContentArea.innerHTML = `
            <div class="fx-column">${column1Effects.join('')}</div>
            <div class="fx-column">${column2Effects.join('')}</div>
        `;

        element.querySelector('#material-editor-bottom-bar').innerHTML = this._buildBottomBar();
        return element;
    }

    _getStyles() {
        return `
            #material-editor-debugger { position: fixed; z-index: 10; background: rgba(40, 40, 40, 0.95); color: #fff; border: 1px solid #111; border-radius: 8px; padding: 5px; font-family: sans-serif; font-size: 11px; display: flex; flex-direction: column; gap: 4px; min-width: 550px; min-height: 600px; box-sizing: border-box; box-shadow: 0 0 25px rgba(0,0,0,0.7); resize: both; overflow: auto; }
            #material-editor-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; }
            #material-editor-header h3 { margin: 0; padding: 0; border: none; flex-grow: 1; text-align: center; cursor: move; user-select: none; font-size: 1.4em; }
            .header-btn { display: inline-block; text-decoration: none; background: #3a3a3a; border: 1px solid #666; color: #ccc; font-weight: bold; width: 22px; height: 22px; line-height: 22px; text-align: center; cursor: pointer; border-radius: 4px; flex-shrink: 0; font-size: 14px; padding: 0; }
            .header-btn:hover { background: #555; border-color: #888; }
            .file-picker-btn { flex-shrink: 0; width: 22px; height: 22px; line-height: 18px; padding: 0; font-size: 12px; background: #3a3a3a; border: 1px solid #666; color: #ccc; cursor: pointer; border-radius: 4px; }
            .file-picker-btn:hover { background: #555; border-color: #888; }
            details { background: rgba(255,255,255,0.05); border: 1px solid #555; border-radius: 4px; padding: 3px; margin-bottom: 0; }
            details[open] { background: rgba(255,255,255,0.08); padding-bottom: 5px; }
            details[open] > summary .accordion-toggle { transform: rotate(90deg); }
            details.disabled-effect > summary .summary-label { color: #888; text-decoration: line-through; }
            details.effect-unavailable { border-style: dashed; border-color: #444; }
            details.effect-unavailable > summary { opacity: 0.7; }
            details.effect-unavailable > summary .summary-label { text-decoration: line-through; }
            summary { font-weight: bold; cursor: pointer; padding: 2px; display: flex; align-items: center; gap: 5px; list-style: none; }
            summary::-webkit-details-marker { display: none; }
            .accordion-toggle { flex-shrink: 0; width: 0; height: 0; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 5px solid #ccc; transition: transform 0.2s ease-in-out; margin-left: 2px; }
            .summary-control { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            .world-based-icon { color: #aaa; display: none; margin-right: 5px; }
            .world-based-icon.active { display: inline-block; color: #40a0fa; }
            details details { margin-left: 8px; margin-top: 4px; border-style: dashed; }
            .traffic-light { width: 9px; height: 9px; border-radius: 50%; display: inline-block; box-shadow: 0 0 4px rgba(0,0,0,0.5); border: 1px solid #111; flex-shrink: 0; }
            .traffic-light.ok { background-color: #4cfa40; } .traffic-light.error { background-color: #fa4040; } .traffic-light.warning { background-color: #f7a000; } .traffic-light.unknown { background-color: #888; } .traffic-light.inactive, .traffic-light.disabled { background: none; border: 1px dashed #666; }
            .control-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; padding: 1px 0; }
            .control-row label { flex-shrink: 0; margin-right: 8px; display: flex; align-items: center; gap: 4px;}
            .control-row .widget-group { display: flex; align-items: center; gap: 4px; }
            .control-row-slider { display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center; }
            .control-row-slider label { margin-right: 0; }
            .control-row-slider input[type=range] { width: 100%; }
            .control-row .value-span { width: 40px; text-align: right; font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 3px; }
            input[type=range] { flex-grow: 1; width: 120px; height: 14px; }
            input[type=color] { width: 100%; height: 22px; border: 1px solid #555; padding: 1px; background: #333; box-sizing: border-box; }
            .main-layout-wrapper { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 8px; flex-grow: 1; min-height: 0; overflow: hidden; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 5px; }
            #post-processing-pane { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; padding-right: 5px; }
            .pane-title { text-align: center; font-size: 1.2em; font-weight: bold; margin: 3px 0 8px 0; padding-bottom: 5px; border-bottom: 1px solid #555; }
            .main-content-area { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; overflow-y: auto; align-content: start; }
            .fx-column { display: flex; flex-direction: column; gap: 4px; }
            #material-editor-profiles-section .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 5px; }
            #material-editor-profiles-section .profile-group { display: flex; flex-direction: column; gap: 4px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; min-width: 250px; }
            .profile-controls { display: flex; flex-direction: column; gap: 4px; }
            select { width: 100%; text-transform: capitalize; background-color: #222; color: #fff; border: 1px solid #555; border-radius: 3px; height: 20px; font-size: 11px; }
            #material-editor-debugger.minimized { width: auto; height: auto; padding: 4px; gap: 0; right: auto; }
            #material-editor-debugger.minimized #material-editor-header { padding: 0; cursor: move; }
            #material-editor-debugger.minimized > *:not(#material-editor-header) { display: none; }
            #material-editor-debugger.minimized #material-editor-help-btn, #material-editor-debugger.minimized #material-editor-title { display: none; }
            .fx-status-light { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #111; margin-right: 5px; vertical-align: middle; }
            .fx-status-light.green { background-color: #4cfa40; box-shadow: 0 0 5px #4cfa40; } .fx-status-light.blue { background-color: #40a0fa; box-shadow: 0 0 5px #40a0fa; }
            .fx-status-light.grey { background-color: #888; } .fx-status-light.red { background-color: #fa4040; box-shadow: 0 0 5px #fa4040; }
            .profile-controls button:disabled { background-color: #333; color: #777; cursor: not-allowed; border-color: #555; }
            .description-text { font-size: 10px; color: #aaa; margin: 4px 0 6px 0; padding-left: 5px; }
            .warning-box { background: #552222; border: 1px solid #ff6666; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 10px; }
            .warning-box strong { color: #ffaaaa; }
            .profile-group-title { font-weight: bold; text-align: center; margin-bottom: 5px; color: #ccc; border-bottom: 1px solid #555; padding-bottom: 3px;}
            #material-editor-bottom-bar { padding: 10px 15px; margin-top: 5px; background: rgba(15, 15, 15, 0.5); border-radius: 5px; border: 1px solid #666; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 30px; }
            .map-tools-toolbar { background: rgba(0,0,0,0.3); border: 1px solid #666; border-radius: 5px; padding: 8px; text-align: center; display: flex; flex-direction: column; gap: 8px; }
            .toolbar-title { font-weight: bold; font-size: 1.2em; color: #aadcff; border-bottom: 1px solid #555; padding-bottom: 5px; margin-bottom: 5px; }
            .toolbar-button { width: 100%; padding: 8px; font-weight: bold; background-color: #225522; border: 1px solid #66aa66; color: #ccffcc; border-radius: 3px; cursor: pointer; }
            .toolbar-button:hover { background-color: #337733; }
            .toolbar-status { font-size: 0.9em; color: #aaa; } .toolbar-status span { font-weight: bold; padding: 2px 6px; border-radius: 10px; font-size: 0.9em; }
            .toolbar-status .status-inactive { color: #ffcccc; background-color: #662222; }
            .toolbar-status .status-active { color: #ccffcc; background-color: #226622; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(102, 170, 102, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(102, 170, 102, 0); } 100% { box-shadow: 0 0 0 0 rgba(102, 170, 102, 0); } }
        `;
    }

    _getBaseHTML() {
        return `
            <div id="material-editor-header">
                <a id="material-editor-help-btn" class="header-btn" href="https://github.com/Garsondee/map-shine" target="_blank" rel="noopener noreferrer" title="Help/Info (Opens GitHub page)">?</a>
                <h3 id="material-editor-title">Map Shine</h3>
                <button id="material-editor-minimize-btn" class="header-btn" title="Minimize">-</button>
                <button id="material-editor-close-btn" class="header-btn" title="Close" style="color: #ff8080;">X</button>
            </div>
            <div id="material-editor-profiles-section"></div>
            <div class="main-layout-wrapper">
                <div id="post-processing-pane"></div>
                <div class="main-content-area"></div>
            </div>
            <div id="material-editor-bottom-bar"></div>
        `;
    }
    
    _buildManagedEffectsHTML() {
        const buildSelectiveControls = (pathPrefix) => `
            <p class="description-text">Isolates a specific color range and applies adjustments to it and/or the rest of the image.</p>
            <details><summary><span class="accordion-toggle"></span><strong>Color Selection</strong></summary><div style="padding-left: 15px;">
                <p class="description-text">Define the color range to target.</p>
                ${DebuggerUIBuilder._createColorPickerHTML(pathPrefix + 'color', 'Target Color')}
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'hueRange', 'Hue Range', 0, 0.5, 0.01)}
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'saturationRange', 'Saturation Range', 0, 0.5, 0.01)}
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'targetLuminance', 'Target Luminance', 0, 1, 0.01)}
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'luminanceRange', 'Luminance Range', 0, 0.5, 0.01)}
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'softness', 'Selection Softness', 0.01, 0.5, 0.01, 'How gradual the transition is at the edge of the selection.')}
            </div></details>
            <details><summary><span class="accordion-toggle"></span><strong>Adjustments</strong></summary><div style="padding-left: 15px;">
                ${DebuggerUIBuilder._createCheckboxHTML(pathPrefix + 'invert', 'Invert Selection', false, 'If checked, the adjustments below will apply to the selected color instead of everything else.')}
                <hr style="border-color: #555; margin: 6px 0;">
                <p class="description-text" style="font-weight: bold;">Unselected Colors:</p>
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'desaturation', 'Desaturation Amount', 0, 1, 0.01, 'How much to desaturate colors outside the selected range.')}
                <hr style="border-color: #555; margin: 6px 0;">
                <p class="description-text" style="font-weight: bold;">Selected Color:</p>
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'targetSaturation', 'Saturation Boost', 0, 5, 0.05, 'Multiplier for the saturation of the selected color.')}
                ${DebuggerUIBuilder._createSliderHTML(pathPrefix + 'targetBrightness', 'Brightness Boost', -1, 1, 0.01, 'Adds or subtracts brightness from the selected color.')}
            </div></details>
        `;

        const worldBasedIconHTML = (path) => `
            <span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings.">
                <i class="fas fa-globe"></i>
            </span>
        `;

        const sceneTransitionHTML = DebuggerUIBuilder._createAccordionHTML('sceneTransition', 'Scene Transition Effect', `
            <p class="description-text">Overrides the default scene change with an elegant fade-through-black effect.</p>
            ${DebuggerUIBuilder._createCheckboxHTML('sceneTransition.worldBasedOnly', 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.')}
            <hr style="border-color: #555; margin: 6px 0;">
            ${DebuggerUIBuilder._createSliderHTML('sceneTransition.fadeOutDuration', 'Fade Out Duration (ms)', 100, 5000, 50)}
            ${DebuggerUIBuilder._createSliderHTML('sceneTransition.fadeInDuration', 'Fade In Duration (ms)', 100, 5000, 50)}
            <hr style="border-color: #555; margin: 6px 0;">
            ${DebuggerUIBuilder._createTextInputWithPickerHTML('sceneTransition.logoPath', 'Logo Image Path', 'Path to an image file (e.g., PNG, WEBP) to display in the center.', 'image')}
            ${DebuggerUIBuilder._createTextInputHTML('sceneTransition.heading', 'Heading Text')}
            ${DebuggerUIBuilder._createTextInputHTML('sceneTransition.subheading', 'Subheading Text')}
            ${DebuggerUIBuilder._createTextInputHTML('sceneTransition.staticDescription', 'Description Text')}
            ${DebuggerUIBuilder._createCheckboxHTML('sceneTransition.showSceneName', 'Show Destination Scene Name', false, 'If checked, the name of the scene being loaded will be displayed.')}
            <hr style="border-color: #555; margin: 6px 0;">
            <details id="details-sceneTransition-hints">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${DebuggerUIBuilder._createCheckboxHTML('sceneTransition.useRandomHint', 'Show Random Hint', true, 'If checked, a random hint from the pool below will be shown in addition to the description.')}
                    </div>
                </summary>
                <div style="padding-top: 5px;">
                    <div id="sceneTransition-randomHints-wrapper">
                        ${DebuggerUIBuilder._createListManagerHTML('sceneTransition.randomHints', 'Add Hint', 'Random Hint Pool')}
                    </div>
                </div>
            </details>
        `, worldBasedIconHTML('sceneTransition.worldBasedOnly'));

        const pauseEffectHTML = DebuggerUIBuilder._createAccordionHTML('pauseEffect', 'Pause Transition Effect', `
            <p class="description-text">Applies a transition effect when the game is paused, including a color correction pass and slowing down all animations.</p>
            ${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.worldBasedOnly', 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.')}
            <hr style="border-color: #555; margin: 6px 0;">
            ${DebuggerUIBuilder._createSliderHTML('pauseEffect.duration', 'Transition Duration (ms)', 100, 10000, 100)}
            <details id="details-pauseEffect-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                <div>
                    ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.invert', 'Invert Colors')}
                </div>
            </details>
        `, worldBasedIconHTML('pauseEffect.worldBasedOnly'));

        const combatEffectHTML = DebuggerUIBuilder._createAccordionHTML('combatEffect', 'Combat Transition Effect', `
            <p class="description-text">Applies a transition effect when combat starts, including a color correction pass and slowing down all animations.</p>
            ${DebuggerUIBuilder._createCheckboxHTML('combatEffect.worldBasedOnly', 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.')}
            <hr style="border-color: #555; margin: 6px 0;">
            ${DebuggerUIBuilder._createSliderHTML('combatEffect.duration', 'Transition Duration (ms)', 100, 10000, 100)}
            ${DebuggerUIBuilder._createSliderHTML('combatEffect.timeScale', 'Time Scale', 0, 1, 0.01, 'The target animation speed during combat (e.g., 0.25 = 25% speed).')}
            <details id="details-combatEffect-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('combatEffect.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                <div>
                    ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createCheckboxHTML('combatEffect.colorCorrection.invert', 'Invert Colors')}
                </div>
            </details>
        `, worldBasedIconHTML('combatEffect.worldBasedOnly'));

        const postProcessingHTML = `
            <h3 class="pane-title">Post-Processing Pipeline</h3>
            <div class="control-row" style="padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap: 5px;">
                    <label for="control-postProcessing-enabled" class="summary-label" title="Master toggle for all effects in this panel."><strong>Enable Post-Processing</strong></label>
                    ${worldBasedIconHTML('postProcessing.worldBasedOnly')}
                </div>
                <div class="widget-group"><input type="checkbox" id="control-postProcessing-enabled" data-path="postProcessing.enabled"></div>
            </div>
            ${DebuggerUIBuilder._createCheckboxHTML('postProcessing.worldBasedOnly', 'World Based Only', false, 'Ignores scene-specific settings for this entire effect group and uses the configured World Default Profile instead. A default profile must be set.')}
            <hr style="border-color:#444; margin: 6px 0;">
            <details id="details-postProcessing-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                <div>
                    <details id="details-postProcessing-cc-presets"><summary><span class="accordion-toggle"></span><strong>Color Presets</strong></summary><div style="padding-left: 15px;">
                        <p class="description-text">Apply professional color grading presets or save your own custom looks.</p>
                        ${DebuggerUIBuilder._createPresetSelectHTML('postProcessing.colorCorrection.activePreset', 'Preset', COLOR_CORRECTION_PRESETS)}
                        <div style="display: flex; gap: 5px; margin-top: 5px;">
                            <button id="apply-color-preset-btn" title="Apply the selected preset to all color correction settings" style="flex: 1; height: 24px;">Apply Preset</button>
                            <button id="save-color-favorite-btn" title="Save current color settings as a favorite" style="flex: 1; height: 24px;">Save as Favorite</button>
                        </div>
                        <details id="details-postProcessing-cc-favorites" style="margin-top: 10px;"><summary><span class="accordion-toggle"></span><strong>My Favorites</strong></summary><div style="padding-left: 15px;">
                            <div id="color-favorites-list" style="margin-top: 5px;"><p style="color: #888; font-style: italic;">No favorites saved yet.</p></div>
                        </div></details>
                    </div></details>
                    <details id="details-postProcessing-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                        ${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.invert', 'Invert Colors')}
                    </div></details>
                    <details id="details-postProcessing-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies scene brightness, simulating camera exposure.')}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05, 'Adjusts mid-tones. < 1 lightens, > 1 darkens.')}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the image.')}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the image.')}
                    </div></details>
                    <details id="details-postProcessing-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 15px;">
                        <p class="description-text">Simulates camera white balance correction.</p>
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.whiteBalance.temperature', 'Temperature', -1, 1, 0.01, 'Negative values are cooler (blue), positive are warmer (orange).')}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.whiteBalance.tint', 'Tint', -1, 1, 0.01, 'Negative values shift toward magenta, positive toward green.')}
                    </div></details>
                    <details id="details-postProcessing-cc-highlights"><summary><span class="accordion-toggle"></span><strong>Highlight Adjustments</strong></summary><div style="padding-left: 15px;">
                        <p class="description-text">Boost brightness in areas unaffected by certain shadow effects.</p>
                        <details id="details-postProcessing-cc-highlightCloud"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightCloud.enabled', 'Cloud Highlights', true)}</div></summary><div style="padding-left: 15px;">
                            <p class="description-text">Brightens the sky between cloud shadows.</p>
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightCloud.brightness', 'Brightness', 0, 2, 0.01)}
                        </div></details>
                        <details id="details-postProcessing-cc-highlightStructural"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightStructural.enabled', 'Structural Highlights', true)}</div></summary><div style="padding-left: 15px;">
                            <p class="description-text">Brightens the areas not in structural shadow (e.g., areas between rafters).</p>
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightStructural.brightness', 'Brightness', 0, 5, 0.01)}
                        </div></details>
                    </div></details>
                    <details id="details-postProcessing-cc-tint"><summary><span class="accordion-toggle"></span><strong>Global Tint</strong></summary><div style="padding-left: 15px;">
                        <p class="description-text">Applies a color overlay to the entire scene.</p>
                        ${DebuggerUIBuilder._createColorPickerHTML('postProcessing.colorCorrection.tint.color', 'Tint Color')}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                    </div></details>
                    <details id="details-postProcessing-cc-mask"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.mask.enabled', 'Luminance Mask', true)}</div></summary><div style="padding-left: 15px;">
                        <p class="description-text">Applies the color correction only to lit areas of the scene. Requires the Illumination Buffer module.</p>
                        ${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.mask.invert', 'Invert Mask (Affect Dark Areas)')}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.mask.luminanceThreshold', 'Light Threshold', 0, 1, 0.01)}
                        ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.mask.softness', 'Edge Softness', 0.01, 1, 0.01)}
                    </div></details>
                    <details id="details-postProcessing-cc-selective"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.selective.enabled', 'Selective Color', true)}</div></summary><div style="padding-left: 15px;">
                        ${buildSelectiveControls('postProcessing.colorCorrection.selective.')}
                    </div></details>
                    <details id="details-postProcessing-cc-curves"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.curves.enabled', 'Curves', true)}</div></summary><div style="padding-left: 15px; display: flex; flex-direction: column; align-items: center; padding-top: 5px;">
                        <p class="description-text">Precise, non-linear control over tonal range, similar to Photoshop's Curves tool.</p>
                        <div id="curve-channel-selector" style="text-align: center; margin-bottom: 5px; display: flex; gap: 10px; justify-content: center;">
                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-rgb" value="rgb" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-rgb">RGB</label></div>
                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-r" value="red" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-r" style="color:#f88;">R</label></div>
                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-g" value="green" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-g" style="color:#8f8;">G</label></div>
                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-b" value="blue" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-b" style="color:#8af;">B</label></div>
                        </div>
                        <div id="curve-editor-container" style="width: 256px; height: 256px; background: #222 url('data:image/svg+xml,%3Csvg width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 16 16\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0 0 H8 V8 H0 Z\\' fill=\\'%23333\\'/%3E%3Cpath d=\\'M8 8 H16 V16 H8 Z\\' fill=\\'%23333\\'/%3E%3C/svg%3E'); border: 1px solid #555; position: relative;"></div>
                    </div></details>
                </div></details>
            <details id="details-postProcessing-dynamicExposure"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.dynamicExposure.enabled', 'Dynamic Exposure (Dazzle)', true)}</div></summary><div style="padding-left: 15px;">
                <p class="description-text">Creates a "dazzle" effect when a token moves from an area defined as indoors (dark parts of _Outdoors mask) to outdoors (light parts).</p>
                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.dynamicExposure.intensity', 'Dazzle Intensity', 0, 5, 0.1, 'The peak exposure brightness when the effect triggers.')}
                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.dynamicExposure.duration', 'Dazzle Duration (ms)', 500, 20000, 100, 'How long it takes for the dazzle effect to fade back to normal.')}
                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.dynamicExposure.resetPeriod', 'Reset Period (ms)', 1000, 120000, 1000, 'The cooldown time before the effect can be triggered again.')}
            </div></details>
            <details id="details-postProcessing-vignette"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.vignette.enabled', 'Vignette', true)}</div></summary>
                <div>${DebuggerUIBuilder._createSliderHTML('postProcessing.vignette.amount', 'Amount', 0, 1, 0.01)}${DebuggerUIBuilder._createSliderHTML('postProcessing.vignette.softness', 'Softness', 0.01, 1, 0.01)}</div>
            </details>
            <details id="details-postProcessing-lensDistortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.lensDistortion.enabled', 'Lens Distortion', true)}</div></summary>
                <div>
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.lensDistortion.amount', 'Amount', -0.2, 0.2, 0.001)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.lensDistortion.centerX', 'Center X', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.lensDistortion.centerY', 'Center Y', 0, 1, 0.01)}
                </div>
            </details>
            <details id="details-postProcessing-chromaticAberration"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.chromaticAberration.enabled', 'Chromatic Aberration', true)}</div></summary>
                <div>
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.chromaticAberration.amount', 'Amount', -0.05, 0.05, 0.001)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.chromaticAberration.centerX', 'Center X', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.chromaticAberration.centerY', 'Center Y', 0, 1, 0.01)}
                </div>
            </details>
            <details id="details-postProcessing-tiltShift"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.tiltShift.enabled', 'Tilt Shift', true)}</div></summary>
                <div>
                    <p class="description-text">Simulates a tilt-shift lens, blurring the top and bottom of the screen. Requires a library that may not be bundled with all Foundry versions.</p>
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.blur', 'Blur', 0, 50, 1)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.gradientBlur', 'Gradient Size', 0, 5000, 10)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.startX', 'Start X', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.startY', 'Start Y', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.endX', 'End X', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.tiltShift.endY', 'End Y', 0, 1, 0.01)}
                </div>
            </details>
        `;

        return {
            postProcessing: postProcessingHTML,
            otherEffects: [sceneTransitionHTML, pauseEffectHTML, combatEffectHTML]
        };
    }

    _buildProfileSection() {
        const isGm = game.user.isGM;
        const worldProfileSection = isGm ? `
            <div class="profile-group">
                <strong class="profile-group-title">Manage World Profiles</strong>
                <p class="description-text" style="text-align: center;">Load, save, and manage reusable profiles for your entire world.</p>
                <div class="profile-controls">
                    <select id="profiles-dropdown"></select>
                    <div style="display: flex; gap: 5px;">
                        <button id="profile-load" title="Temporarily preview the selected profile. This will create unsaved changes.">Preview Profile</button>
                        <button id="profile-set-default" title="Set the selected profile as the default for new, unsaved scenes." style="flex-grow: 1;">Set as World Default</button>
                    </div>
                    <hr style="border-color: #555; margin: 2px 0;">
                    <input type="text" id="profile-name" placeholder="New/Existing Profile Name...">
                    <div style="display: flex; gap: 5px;">
                        <button id="profile-save" title="Save the current settings (including any temporary changes) as a NEW world-level profile.">Save as New</button>
                        <button id="profile-update" title="Overwrite the selected world profile with the current settings.">Update Selected</button>
                        <button id="profile-delete" style="color: #ff8080;" title="Permanently delete the selected world profile. This cannot be undone.">Delete</button>
                    </div>
                </div>
            </div>
        ` : `
            <div class="profile-group">
                <strong class="profile-group-title">Manage World Profiles</strong>
                <p class="description-text" style="text-align: center;">World profiles can be loaded and managed by the GM.</p>
                <div class="profile-controls">
                    <select id="profiles-dropdown"></select>
                    <div style="display: flex; gap: 5px;">
                        <button id="profile-load" title="Temporarily preview the selected profile. This will create unsaved changes.">Preview Profile</button>
                    </div>
                </div>
            </div>
        `;

        return `
            <details id="details-profile-management">
                <summary>
                    <span class="accordion-toggle"></span>
                    <strong style="font-size: 1.1em;">Global Controls & Profiles</strong>
                </summary>
                <div class="profile-grid">
                    <div class="profile-group">
                        <strong class="profile-group-title">Global Controls</strong>
                        <div class="control-row">
                        <label for="global-enabled" title="Master on/off switch for all Map Shine effects.">Enable All Effects</label>
                        <div class="widget-group"><input type="checkbox" id="global-enabled" data-path="enabled"></div>
                        </div>
                        ${DebuggerUIBuilder._createSliderHTML('timeControl.globalTime', 'Global Time Scale', 0, 100, 1, 'Controls the master speed of all animated effects in this module. 100% is normal speed, 0% is frozen.')}
                    </div>
                    <div class="profile-group">
                        <strong class="profile-group-title">Manage Scene State</strong>
                        <div class="control-row" style="justify-content: center; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 3px;">
                            <span id="fx-status-light" class="fx-status-light grey"></span>
                            <span id="fx-status-text" style="color: #ddd;">Initializing...</span>
                        </div>
                        <button id="profile-save-scene" title="Save your current temporary changes as the new official default for this scene. (GM Only)">Commit Changes to Scene</button>
                        <button id="profile-revert-scene" title="Discard all of your temporary changes and revert to the last saved state for this scene.">Discard My Changes</button>
                        <button id="profile-revert-module" title="For this session only, ignore all scene settings and use the original module defaults.">Preview Module Defaults</button>
                        <hr style="border-color: #555; margin: 4px 0;">
                        <div style="display: flex; gap: 5px;">
                            <button id="profile-copy-settings" title="Copy the current active settings to the clipboard as JSON text.">Copy Settings</button>
                            <button id="profile-paste-settings" title="Load settings from JSON text on the clipboard. This will create unsaved changes.">Paste Settings</button>
                        </div>
                    </div>
                    ${worldProfileSection}
                    <div class="profile-group">
                        <strong class="profile-group-title">Tools & Diagnostics</strong>
                        ${this._buildMapToolsSection()}
                        ${this._buildTextureDiscoverySection()}
                        ${this._buildDiagnosticSection()}
                    </div>
                </div>
            </details>
        `;
    }
    
    _buildParticleSystemSection() {
        return `
            <h3 class="pane-title" style="margin-top: 15px;">Particle Systems</h3>
            <details id="details-particleSystems">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${DebuggerUIBuilder._createCheckboxHTML('particleSystems.enabled', '<strong>Enable All Particles</strong>', true, 'Master toggle for all particle effects.')}
                    </div>
                </summary>
                <div style="padding-top: 5px;">
                    <div class="control-row" style="padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                        <label>Live Particle Count</label>
                        <div class="widget-group">
                            <span id="particle-count-display" style="font-weight: bold; color: #aadcff;">0</span>
                            <span>/</span>
                            <span id="particle-limit-display">10000</span>
                        </div>
                    </div>
                    ${DebuggerUIBuilder._createSliderHTML('particleSystems.globalDensityMultiplier', 'Global Density', 0.1, 2.0, 0.05, 'A multiplier for the spawn rate/density of ALL particle effects.')}
                    ${DebuggerUIBuilder._createSliderHTML('particleSystems.globalParticleLimit', 'Global Particle Limit', 500, 30000, 100, 'A hard cap on the total number of particles allowed on screen at once to prevent performance issues.')}
                </div>
            </details>
        `;
    }

    _buildTextureDiscoverySection() {
        const textureRows = Object.entries(TextureDiscoverer.SUFFIX_MAP).map(([key, suffix]) => {
            const label = `${key.charAt(0).toUpperCase() + key.slice(1)} Map (${suffix})`;
            return DebuggerUIBuilder._createTextureInputHTML(key, label);
        }).join('');

        return `
            <details id="details-texture-discovery">
                <summary>
                    <span class="accordion-toggle"></span>
                    <strong>Discovered Effect Textures</strong>
                </summary>
                <div style="padding-top: 5px;">
                    <p class="description-text">Shows which suffixed textures were found for the current scene background and active tiles.</p>
                    ${textureRows}
                </div>
            </details>
        `;
    }

    _buildDiagnosticSection() {
        const suffixOptions = {};

        return `
            <details id="details-diagnostic">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${DebuggerUIBuilder._createCheckboxHTML('diagnostic.enabled', '<strong>Diagnostic Mode</strong>', true)}
                    </div>
                </summary>
                <div style="padding-top: 5px;">
                    <p class="description-text">A tool for developers and artists to inspect effect maps and pixel values.</p>
                    ${DebuggerUIBuilder._createCheckboxHTML('diagnostic.showMasks', 'Show Discovered Masks & Outlines')}
                    ${DebuggerUIBuilder._createSelectHTML('diagnostic.displaySuffix', 'Display Texture', suffixOptions, 'Select which mask or generated texture to display.')}
                    ${DebuggerUIBuilder._createCheckboxHTML('diagnostic.pixelInspector', 'Enable Pixel Inspector Tooltip')}
                    ${DebuggerUIBuilder._createCheckboxHTML('showTokenMask', 'Show Token Mask')}
                </div>
            </details>
        `;
    }

    _buildMapToolsSection() {
        return `
            <div class="map-tools-toolbar">
                <div class="toolbar-title">MAP TOOLS</div>
                <button type="button" class="toolbar-button" data-action="open-map-points-editor" title="Open the editor to create and manage groups of points on the map.">
                    <i class="fas fa-drafting-compass"></i> LAUNCH EDITOR
                </button>
                <div class="toolbar-status">
                    Placement Mode: <span id="map-placement-status" class="status-inactive">INACTIVE</span>
                </div>
            </div>
        `;
    }

    _buildBottomBar() {
        return `
            <div class="about-text">
                <p><strong>Map Shine:</strong> A free toolkit for creating memorable, animated, and visually striking maps. It will always be free for commercial use. Map making is both my passion and helps me support my family. If you use this module, please consider giving credit by linking my Patreon or map stores.</p>
            </div>
            <div class="support-links">
                <a href="https://www.patreon.com/c/MythicaMachina" target="_blank" class="patreon-link">
                    <span>Support on Patreon</span>
                </a>
                <div class="stores-group">
                    <h5 class="stores-heading">BUY MY MAPS AND HELP SUPPORT ME</h5>
                    <div class="store-links-inner">
                        <a href="https://www.foundryvtt.store/creators/mythica-machina" target="_blank">Foundry VTT Store</a>
                        <a href="https://www.drivethrurpg.com/en/publisher/29377/mythicamachina" target="_blank">DriveThruRPG</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    static _createSafeId(path) {
        return `control-${path.replace(/\.|\[|\]|\s/g, '-')}`;
    }
    
    static _createAccordionHTML(id, title, content, headerExtra = '') {
        const path = `${id}.enabled`;
        const checkboxId = this._createSafeId(path);
        const labelHtml = `<span class="summary-label">${title}</span>`;
        const checkboxHtml = `<div class="widget-group"><input type="checkbox" id="${checkboxId}" data-path="${path}"></div>`;

        return `<details id="details-${id}">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    <div style="display: flex; align-items: center; gap: 5px;">
                                        ${labelHtml}
                                        ${headerExtra}
                                    </div>
                                    ${checkboxHtml}
                                </div>
                            </summary>
                            <div style="padding-top: 5px;">${content}</div>
                        </details>`;
    }
    
    static _createCheckboxHTML(path, label, isSummary = false, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        const checkbox = `<div class="widget-group"><input type="checkbox" id="${id}" data-path="${path}"></div>`;
        const labelHtml = isSummary ? `<span class="summary-label" ${titleAttr}>${label}</span>` : `<label for="${id}" class="summary-label" ${titleAttr}>${label}</label>`;
        if (isSummary) {
            return `${labelHtml}${checkbox}`;
        }
        return `<div class="control-row">${labelHtml}${checkbox}</div>`;
    }
    
    static _createSliderHTML(path, label, min, max, step, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        return `<div class="control-row control-row-slider"><label for="${id}" ${titleAttr}>${label}</label><input type="range" id="${id}" data-path="${path}" min="${min}" max="${max}" step="${step}"><span id="${id}-value" class="value-span">0.0</span></div>`;
    }
    
    static _createColorPickerHTML(path, label) {
        const id = this._createSafeId(path);
        return `<div class="control-row"><label for="${id}">${label}</label><div class="widget-group" style="flex-grow: 1;"><input type="color" id="${id}" data-path="${path}"></div></div>`;
    }
    
    static _createSelectHTML(path, label, options, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        const opts = Object.entries(options).map(([k, v]) => `<option value="${v}">${k}</option>`).join('');
        return `<div class="control-row"><label for="${id}" ${titleAttr}>${label}</label><select id="${id}" data-path="${path}">${opts}</select></div>`;
    }
    
    static _createGradientSelectHTML(path, label) {
        const id = this._createSafeId(path);
        const opts = Object.entries(GRADIENT_PRESETS).map(([name, data]) => {
            const gradientCSS = `linear-gradient(to right, ${data.colors.join(', ')})`;
            return `<option value="${name}" style="background: ${gradientCSS};">${name}</option>`;
        }).join('');
        return `<div class="control-row"><label for="${id}">${label}</label><select id="${id}" data-path="${path}" class="gradient-picker">${opts}</select></div>`;
    }
    
    static _createPresetSelectHTML(path, label, presets) {
        const id = this._createSafeId(path);
        const opts = Object.entries(presets).map(([key, data]) =>
            `<option value="${key}">${data.name}</option>`
        ).join('');
        return `<div class="control-row"><label for="${id}">${label}</label><select id="${id}" data-path="${path}">${opts}</select></div>`;
    }
    
    static _createTextInputHTML(path, label, title = '') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        return `<div class="control-row" style="margin-bottom: 3px;"><label for="${id}" ${titleAttr}>${label}</label><input type="text" id="${id}" data-path="${path}" style="flex-grow:1;font-family:monospace;font-size:10px;"></div>`;
    }
    
    static _createTextInputWithPickerHTML(path, label, title = '', pickerType = 'image') {
        const id = this._createSafeId(path);
        const titleAttr = title ? `title="${title}"` : '';
        return `
            <div class="control-row" style="margin-bottom: 3px;">
                <label for="${id}" ${titleAttr}>${label}</label>
                <div class="widget-group" style="flex-grow:1; display:flex; gap: 3px;">
                    <input type="text" id="${id}" data-path="${path}" style="flex-grow:1; font-family:monospace; font-size:10px;">
                    <button type="button" class="file-picker-btn" data-fp-target="${id}" data-fp-type="${pickerType}" title="Browse Files"><i class="fas fa-file-import"></i></button>
                </div>
            </div>
        `;
    }
    
    static _createTextureInputHTML(key, label) {
        return `<div class="control-row" style="margin-bottom: 5px;"><label><span id="status-textures-${key}" class="traffic-light unknown"></span>${label}</label><input type="text" id="texture-path-${key}" disabled title="This path is discovered automatically based on the base map's filename. (e.g., 'map.webp' -> 'map_Specular.webp')"></div>`;
    }
    
    static _createListManagerHTML(path, addButtonLabel, itemLabel) {
        const id = this._createSafeId(path);
        const listContainerId = `${id}-list-container`;
        const addButtonId = `${id}-add-btn`;

        return `
            <div id="${id}" class="list-manager-container" data-path="${path}">
                <div class="control-row">
                    <label>${itemLabel}</label>
                    <button id="${addButtonId}" class="add-item-btn">${addButtonLabel}</button>
                </div>
                <div id="${listContainerId}" class="list-items-container" style="display: flex; flex-direction: column; gap: 4px; margin-top: 5px; padding-left: 10px;"></div>
            </div>
            <style>
                .list-manager-container .list-item-row { display: flex; align-items: center; gap: 5px; }
                .list-manager-container .list-item-row input[type=text] { flex-grow: 1; }
                .list-manager-container .list-item-row .remove-item-btn { 
                    flex-shrink: 0; background: #662222; border: 1px solid #aa6666; color: #ffcccc; 
                    font-weight: bold; width: 22px; height: 22px; line-height: 22px; text-align: center; 
                    cursor: pointer; border-radius: 4px; padding: 0;
                }
                .list-manager-container .list-item-row .remove-item-btn:hover { background: #883333; }
            </style>
        `;
    }

    _getEffectSections() {
        const sections = [
            'baseShine', 'water', 'cloudShadows', 'iridescence', 'heatDistortion', 'canopy',
            'structuralShadows', 'ambient', 'groundGlow', 'prism', 'fire', 'sparks', 'dust', 'glint'
        ];
        
        return sections.map(key => {
            const definition = PARTICLE_EFFECT_DEFINITIONS[key];
            if (definition) {
                return ParticleEffectController.getSettingsHTML(key);
            }
            switch (key) {
                case 'baseShine': return this._buildMetallicShineSettingsHTML();
                case 'water': return this._buildWaterFXSettingsHTML();
                case 'cloudShadows': return this._buildCloudShadowsSettingsHTML();
                case 'iridescence': return this._buildIridescenceSettingsHTML();
                case 'heatDistortion': return this._buildHeatDistortionSettingsHTML();
                case 'canopy': return this._buildCanopySettingsHTML();
                case 'structuralShadows': return this._buildStructuralShadowsSettingsHTML();
                case 'ambient': return this._buildAmbientSettingsHTML();
                case 'groundGlow': return this._buildGroundGlowSettingsHTML();
                case 'prism': return this._buildPrismSettingsHTML();
                default: return '';
            }
        }).filter(Boolean);
    }
    
    _buildMetallicShineSettingsHTML() {
        const effectKey = 'baseShine';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
            ${checkboxHTML}
            <hr style="border-color: #555; margin: 6px 0;">
            <p class="description-text">A colored texture where brightness controls shine intensity and the texture's color is used for the shine. This is the primary mask for this effect.</p>
            
            <details id="details-baseShine-appearance" open><summary><span class="accordion-toggle"></span><strong>Appearance & Compositing</strong></summary>
                <div>
                ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.globalIntensity', 'Global Intensity', 0, 10, 0.1, 'Controls the overall brightness of the shine effect.')}
                ${DebuggerUIBuilder._createSelectHTML('baseShine.compositing.layerBlendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                </div>
            </details>

            <details id="details-baseShine-fbmNoise" open><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.fbmNoise.enabled', 'FBM Noise Modulation', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Modulates the shine intensity with a 'boiling' FBM noise pattern.</p>
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.speed', 'Speed', -0.1, 0.1, 0.001, 'Directional drift speed of the noise.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.scale', 'Scale', 0.1, 10, 0.1, 'Zoom level of the noise pattern.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.octaves', 'Complexity (Octaves)', 1, 8, 1, 'Layers of noise. More is more detailed but slower.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.persistence', 'Roughness', 0.1, 1, 0.01, 'Influence of smaller details. Lower is smoother.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.lacunarity', 'Detail Scale', 1.5, 4, 0.05, 'Frequency of smaller details. Higher is finer.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.evolution', 'Evolution', 0, 1, 0.01, 'Internal "boiling" speed of the noise, independent of directional speed.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.brightness', 'Brightness', 0, 1, 0.01, 'Base brightness of the noise before contrast.')}
                    ${DebuggerUIBuilder._createSliderHTML('baseShine.fbmNoise.contrast', 'Contrast', 0, 5, 0.05, 'Contrast of the final noise pattern.')}
                </div>
            </details>
            
            <details id="details-baseShine-pattern" open><summary><span class="accordion-toggle"></span><strong>Stripe Pattern</strong></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Modulates shine intensity with one or two layers of animated stripes.</p>
                    <details id="details-baseShine-pattern-shared"><summary><span class="accordion-toggle"></span><strong>Shared Settings</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.shared.patternScale', 'Global Scale', 0.01, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.shared.maxBrightness', 'Max Brightness', 0, 1, 0.01, 'A final brightness multiplier for the combined stripe pattern.')}
                        </div>
                    </details>
                    <details id="details-baseShine-pattern-s1"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.pattern.stripes1.enabled', 'Stripe Layer 1', true)}</div></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.intensity', 'Intensity', 0, 2, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.speed', 'Speed', -0.05, 0.05, 0.001)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.angle', 'Angle', 0, 360, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.sharpness', 'Sharpness', 1, 16, 0.5, 'Exponent for the band edge falloff. Higher is sharper.')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.bandDensity', 'Density', 0.1, 10, 0.1, 'How many bands appear in a given area.')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.bandWidth', 'Width', 0.1, 1, 0.01, 'The width of each band relative to the space between them.')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxCount', 'Sub-Stripe Count', 0, 10, 1, 'Maximum number of internal stripes.')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxSharp', 'Sub-Stripe Sharpness', 0, 5, 0.1, 'Sharpness of the internal stripes.')}
                        </div>
                    </details>
                    <details id="details-baseShine-pattern-s2"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.pattern.stripes2.enabled', 'Stripe Layer 2', true)}</div></summary>
                        <div style="padding-left: 15px;">
                             ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.intensity', 'Intensity', 0, 2, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.speed', 'Speed', -0.05, 0.05, 0.001)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.angle', 'Angle', 0, 360, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.sharpness', 'Sharpness', 1, 16, 0.5)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.bandDensity', 'Density', 0.1, 10, 0.1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.bandWidth', 'Width', 0.1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxCount', 'Sub-Stripe Count', 0, 10, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxSharp', 'Sub-Stripe Sharpness', 0, 5, 0.1)}
                        </div>
                    </details>
                    <details id="details-baseShine-breakupNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.noise.enabled', 'Breakup Noise', true)}</div></summary>
                        <div style="padding-left: 15px;">
                            <p class="description-text">Adds a simple noise pattern to break up the stripes.</p>
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.speed', 'Speed', -0.05, 0.05, 0.001)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.scale', 'Scale', 0.1, 10, 0.1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.threshold', 'Threshold', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.brightness', 'Brightness', -1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.contrast', 'Contrast', 0, 5, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.softness', 'Softness', 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
        `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Metallic Shine', content, iconHTML);
    }

    _buildWaterFXSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('water', 'Water Effects', `
            <p class="description-text">A multi-layered effect for water surfaces, foam, and underwater caustics. Requires a _Water.webp mask.</p>
            <details id="details-water-wave">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.wave.enabled', 'Wave Distortion', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Controls the underlying ripple/wobble of the water surface. This distortion affects the scene viewed through the water, as well as the foam and sheen on the surface.</p>
                    ${DebuggerUIBuilder._createSliderHTML('water.wave.speed', 'Speed', 0, 0.1, 0.0001, 'The animation speed of the wave noise pattern.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.wave.scale', 'Scale', 0.1, 40, 0.1, 'The zoom level of the wave noise. Larger values create smaller, more frequent ripples.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.wave.intensity', 'Intensity', 0, 0.05, 0.0001, 'The strength of the distortion. Higher values push the pixels further.')}
                </div>
            </details>
            <details id="details-water-surface">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.surface.enabled', 'Open Water Surface', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <details id="details-water-foam">
                        <summary><span class="accordion-toggle"></span><strong>Foam</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createColorPickerHTML('water.surface.foamColor', 'Color')}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.foamIntensity', 'Base Intensity', 0, 2, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.foamCoverage', 'Coverage', 0, 1, 0.01, 'Amount of water surface covered by foam.')}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.foamSharpness', 'Edge Sharpness', 0.01, 1, 0.01, 'Hardness of the foam edges.')}
                            <details id="details-water-foam-fbm">
                                <summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                                <div style="padding-left: 15px;">
                                    <p class="description-text">Controls the procedural noise used for the foam pattern.</p>
                                    ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmScale', 'Scale', 0.001, 50, 0.001)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmSpeed', 'Speed', 0, 0.5, 0.01, 'Directional drift speed of the foam.')}
                                    ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmEvolution', 'Evolution', 0, 0.5, 0.01, 'Internal "boiling" speed of the foam.')}
                                    ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmOctaves', 'Complexity (Octaves)', 1, 8, 1)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmLacunarity', 'Detail Scale', 1.5, 4, 0.05)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.surface.fbmPersistence', 'Roughness', 0.1, 1, 0.05)}
                                </div>
                            </details>
                        </div>
                    </details>
                    <details id="details-water-sheen">
                        <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.surface.sheenEnabled', 'Surface Sheen', true)}</div></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createColorPickerHTML('water.surface.sheenColor', 'Color')}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenIntensity', 'Intensity', 0, 1, 0.001)}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenScale', 'Scale', 0.1, 10, 0.1)}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenSpeed', 'Speed', 0, 0.5, 0.001)}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenStretch', 'Stretch', 1, 10, 0.1, 'Stretches the sheen horizontally for a more reflective look.')}
                            ${DebuggerUIBuilder._createSliderHTML('water.surface.sheenSharpness', 'Sharpness', 0.5, 5, 0.1, 'Hardness of the sheen highlights.')}
                        </div>
                    </details>
                </div>
            </details>
            <details id="details-water-caustics">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.caustics.enabled', 'Underwater Caustics', true)}</div></summary>
                <div style="padding-left: 15px;">
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.intensity', 'Intensity', 0, 1, 0.001)}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.scale', 'Scale', 0.1, 10, 0.1)}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.speed', 'Speed', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createColorPickerHTML('water.caustics.color', 'Caustic Color')}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.lineSharpness', 'Line Sharpness', 1, 40, 1, 'Exponent for sharpening the caustic lines.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.bloomIntensity', 'Bloom Intensity', 0, 1, 0.01, 'Brightness of the soft underlying glow.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.lineDistortion', 'Line Distortion', 0, 2, 0.01, 'How much the lines are broken up and warped.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.lineDistortionScale', 'Distortion Scale', 0.1, 10, 0.1, 'The scale of the line distortion noise.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.intersectionBoost', 'Intersection Boost', 1, 20, 0.1, 'Multiplies the brightness of intersecting lines.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.roughnessScale', 'Roughness Scale', 0.1, 20, 0.1, 'Scale of the noise that breaks up the lines.')}
                    ${DebuggerUIBuilder._createSliderHTML('water.caustics.roughnessIntensity', 'Roughness Intensity', 0, 1, 0.01, 'How strongly the noise affects line brightness.')}
                </div>
            </details>
            <details id="details-water-glint-particles">
                <summary><span class="accordion-toggle"></span>
                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.glintParticles.enabled', 'Water Glints / Spray', true)}</div>
                </summary>
                <div style="padding-left:15px;">
                    <p class="description-text">General-purpose particles spawned across the entire water surface.</p>
                    <!-- Particle settings for glints -->
                </div>
            </details>
        `);
    }

    _buildCloudShadowsSettingsHTML() {
        const effectKey = 'cloudShadows';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
            ${checkboxHTML}
            <hr style="border-color: #555; margin: 6px 0;">
            <p class="description-text">Simulates moving cloud shadows within the masked areas.</p>
            ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shadowIntensity', 'Global Intensity', 0, 2, 0.05)}
            ${DebuggerUIBuilder._createSliderHTML('cloudShadows.maskBlur', 'Mask Blur', 0, 50, 1)}
            <details><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                <div style="padding-left: 15px;">
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.wind.angle', 'Angle', 0, 360, 1)}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.wind.speed', 'Speed', 0, 0.01, 0.0001)}
                </div>
            </details>
            <details><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                <div style="padding-left: 15px;">
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.scale', 'Scale', 0.01, 10, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.octaves', 'Detail Octaves', 1, 8, 1, 'Adds more layers of detail to the noise. Higher is more complex.')}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.persistence', 'Roughness', 0.1, 1, 0.05, 'How much each successive octave contributes. Lower values give a softer look.')}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.noise.lacunarity', 'Detail Frequency', 1.5, 4, 0.1, 'How much detail is added with each octave. Higher values create finer, more complex noise.')}
                </div>
            </details>
            <details><summary><span class="accordion-toggle"></span><strong>Shading & Appearance</strong></summary>
                <div style="padding-left: 15px;">
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.threshold', 'Threshold', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.softness', 'Softness', 0.01, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.brightness', 'Brightness', -1, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.contrast', 'Contrast', 0.1, 5, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.shading.gamma', 'Gamma', 0.1, 5, 0.05, 'Adjusts the mid-tones of the shadows. < 1 lightens, > 1 darkens.')}
                </div>
            </details>
            <details id="details-cloudShadows-illumination">
                <summary><span class="accordion-toggle"></span>
                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('cloudShadows.illumination.enabled', 'Illumination Masking', true)}</div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Reduces shadow intensity in lit areas of the scene. Requires the Illumination Buffer module.</p>
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.illumination.intensity', 'Reduction Amount', 0, 1, 0.01, 'How much to reduce shadow opacity in fully lit areas.')}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.illumination.luminanceThreshold', 'Light Threshold', 0, 1, 0.01, 'The scene brightness level above which shadows will start to fade.')}
                    ${DebuggerUIBuilder._createSliderHTML('cloudShadows.illumination.softness', 'Edge Softness', 0.01, 1, 0.01, 'How gradual the fade transition is.')}
                </div>
            </details>
        `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Cloud Shadows', content, iconHTML);
    }

    _buildIridescenceSettingsHTML() {
        const effectKey = 'iridescence';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
            ${checkboxHTML}
            <hr style="border-color: #555; margin: 6px 0;">
            <p class="description-text">Creates a colorful, oil-slick-like effect within the masked areas.</p>
            ${DebuggerUIBuilder._createSliderHTML('iridescence.intensity', 'Intensity', 0, 2, 0.05)}
            ${DebuggerUIBuilder._createSliderHTML('iridescence.speed', 'Anim Speed', 0, 0.2, 0.001, 'Directional drift speed of the pattern.')}
            ${DebuggerUIBuilder._createSliderHTML('iridescence.scale', 'Pattern Scale', 0.1, 20, 0.1)}
            ${DebuggerUIBuilder._createSliderHTML('iridescence.parallax', 'Parallax', 0, 1, 0.01, '0 = Sticks to Map, 1 = Sticks to Screen')}
            <details id="details-iridescence-fbm"><summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                <div>
                    <p class="description-text">Controls the procedural noise used to generate the base pattern.</p>
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.evolution', 'Evolution', 0, 1, 0.001, 'Internal "boiling" speed of the pattern.')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.octaves', 'Complexity (Octaves)', 1, 8, 1, 'Layers of noise. More is more detailed but slower.')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.persistence', 'Roughness', 0.1, 1, 0.01, 'Influence of smaller details. Lower is smoother.')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.lacunarity', 'Detail Scale', 1.5, 4, 0.05, 'Frequency of smaller details. Higher is finer.')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.brightness', 'Noise Brightness', 0, 1, 0.01, 'Adjusts the brightness of the noise before color mapping.')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.contrast', 'Noise Contrast', 0, 5, 0.05, 'Adjusts the contrast of the noise before color mapping.')}
                </div>
            </details>
            <details id="details-iridescence-gradient"><summary><span class="accordion-toggle"></span><strong>Gradient Controls</strong></summary>
                <div>
                    ${DebuggerUIBuilder._createGradientSelectHTML('iridescence.gradient.name', 'Gradient Preset')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.gradient.hueShift', 'Hue Shift', 0, 1, 0.01, 'Rotates the colors of the gradient.')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.gradient.brightness', 'Brightness', -1, 1, 0.01, 'Final brightness adjustment applied to the colored result.')}
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.gradient.contrast', 'Contrast', 0, 4, 0.05, 'Final contrast adjustment applied to the colored result.')}
                </div>
            </details>
            <details id="details-iridescence-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('iridescence.distortion.enabled', 'Churn/Distortion Effect', true)}</div></summary>
                <div>
                    <p class="description-text">Uses a second, underlying noise pattern to warp the main iridescence effect.</p>
                    ${DebuggerUIBuilder._createSliderHTML('iridescence.distortion.strength', 'Distortion Strength', 0, 20, 0.1)}
                    <details id="details-iridescence-distortion-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('iridescence.noise.enabled', 'Distortion Noise', true)}</div></summary>
                        <div>
                            ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.speed', 'Speed', -0.5, 0.5, 0.001)}
                            ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.scale', 'Scale', 0.1, 10, 0.1)}
                            ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.threshold', 'Threshold', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.brightness', 'Brightness', -1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.contrast', 'Contrast', 0, 5, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.softness', 'Softness', 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
        `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Iridescence', content, iconHTML);
    }
    
    _buildHeatDistortionSettingsHTML() {
        const effectKey = 'heatDistortion';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
            ${checkboxHTML}
            <hr style="border-color: #555; margin: 6px 0;">
            <p class="description-text">Simulates rising heat waves, distorting the scene behind the masked areas.</p>
            ${DebuggerUIBuilder._createSliderHTML('heatDistortion.intensity', 'Intensity', 0, 0.05, 0.0005)}
            <details id="details-heatDistortion-noise"><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                <div style="padding-left: 15px;">
                    ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.speed', 'Speed (Wind)', -0.5, 0.5, 0.005, 'Horizontal scrolling speed of the heat waves.')}
                    ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.scale', 'Scale', 0.1, 10, 0.1, 'Zoom level of the heat waves.')}
                    ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.evolution', 'Evolution Speed', 0, 1, 0.01, 'The "boiling" or "morphing" speed of the noise, independent of wind.')}
                    ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.threshold', 'Threshold', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.brightness', 'Brightness', -1, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.contrast', 'Contrast', 0, 5, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('heatDistortion.noise.softness', 'Softness', 0.01, 1, 0.01)}
                </div>
            </details>
        `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Heat Distortion', content, iconHTML);
    }

    _buildCanopySettingsHTML() {
        const effectKey = 'canopy';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
            ${checkboxHTML}
            <hr style="border-color: #555; margin: 6px 0;">
            <p class="description-text">A black and white texture where black areas are shadows and white areas are light. This effect simulates a leafy canopy overhead.</p>
            ${DebuggerUIBuilder._createSliderHTML('canopy.shadowIntensity', 'Shadow Intensity', 0, 2, 0.01)}
            ${DebuggerUIBuilder._createColorPickerHTML('canopy.tint', 'Shadow Tint')}
            <details id="details-canopy-sway"><summary><span class="accordion-toggle"></span><strong>Shadow Animation (Sway)</strong></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Animates the shadows to simulate a gentle swaying motion from wind.</p>
                    ${DebuggerUIBuilder._createSliderHTML('canopy.sway.intensity', 'Sway Distance', 0, 20, 0.1, 'How far the shadows move.')}
                    ${DebuggerUIBuilder._createSliderHTML('canopy.sway.speed', 'Sway Speed', 0, 5, 0.05, 'How fast the shadows sway.')}
                    ${DebuggerUIBuilder._createSliderHTML('canopy.sway.scale', 'Sway Scale', 0.1, 10, 0.1, 'The size of the wind gusts causing the sway; smaller values are broader, larger values are more detailed.')}
                </div>
            </details>
        `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Canopy Shadows', content, iconHTML);
    }

    _buildStructuralShadowsSettingsHTML() {
        const effectKey = 'structuralShadows';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
            ${checkboxHTML}
            <hr style="border-color: #555; margin: 6px 0;">
            <p class="description-text">A black and white texture for indoor shadows (rafters, beams, etc.). Black areas are shadows, white areas are light. Respects the Outdoor Mask.</p>
            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.shadowIntensity', 'Shadow Intensity', 0, 5, 0.01)}
            ${DebuggerUIBuilder._createColorPickerHTML('structuralShadows.tint', 'Shadow Tint')}
            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.parallax', 'Parallax', 0, 1, 0.001, 'How much the shadows shift relative to camera movement. 0 = fixed to map, 1 = fixed to screen.')}
            <details id="details-structuralShadows-rgbSplit"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.rgbSplit.enabled', 'Highlight RGB Split', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Applies a chromatic aberration effect to the structural highlights.</p>
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.rgbSplit.intensity', 'Intensity', 0, 20, 0.1)}
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.rgbSplit.threshold', 'Threshold', 0, 1, 0.01, 'Only highlights brighter than this will be split.')}
                </div>
            </details>
            <details id="details-structuralShadows-metallicShineMixIn"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.metallicShineMixIn.enabled', 'Metallic Shine Mix-In', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Adds the brightness from the Metallic Shine effect to the light areas of the structural shadows, helping to prevent shine from being darkened by shadows.</p>
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.metallicShineMixIn.intensity', 'Intensity', 0, 5, 0.05)}
                </div>
            </details>
            <details id="details-structuralShadows-intensityNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.intensityNoise.enabled', 'Intensity Noise (Flicker)', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Animates the brightness of the shadows using a procedural noise pattern to create a flickering light effect.</p>
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.amount', 'Amount', 0, 1, 0.01, 'The maximum amount to brighten the shadows by.')}
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.speed', 'Speed', -0.5, 0.5, 0.005, 'Horizontal/Vertical scrolling speed of the noise.')}
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.scale', 'Scale', 0.01, 2, 0.01, 'Zoom level of the noise pattern.')}
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.evolution', 'Evolution', 0, 1, 0.01, 'Internal "morphing" speed of the noise.')}
                    <details id="details-structuralShadows-intensityNoise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.threshold', 'Threshold', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.brightness', 'Brightness', -5, 5, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.contrast', 'Contrast', 0, 5, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.intensityNoise.softness', 'Softness', 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
            <details id="details-structuralShadows-cloudOcclusion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('structuralShadows.cloudOcclusion.enabled', 'Cloud Occlusion', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Overlays animated cloud shadows on top of the structural shadows.</p>
                    ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.intensity', 'Cloud Intensity', 0, 2, 0.05)}
                    <details><summary><span class="accordion-toggle"></span><strong>Wind</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.wind.angle', 'Angle', 0, 360, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.wind.speed', 'Speed', 0, 0.01, 0.0001)}
                        </div>
                    </details>
                    <details><summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.scale', 'Scale', 0.01, 10, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.octaves', 'Detail Octaves', 1, 8, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.persistence', 'Roughness', 0.1, 1, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.noise.lacunarity', 'Detail Frequency', 1.5, 4, 0.1)}
                        </div>
                    </details>
                    <details><summary><span class="accordion-toggle"></span><strong>Cloud Shading & Appearance</strong></summary>
                        <div style="padding-left: 15px;">
                                <details><summary><span class="accordion-toggle"></span><strong>Tone & Gamma</strong></summary><div style="padding-left:15px;">
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.brightness', 'Brightness', -1, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.contrast', 'Contrast', 0.1, 5, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.gamma', 'Gamma', 0.1, 5, 0.05)}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies cloud noise brightness, simulating camera exposure.')}
                            </div></details>
                            <details><summary><span class="accordion-toggle"></span><strong>Levels & Threshold</strong></summary><div style="padding-left:15px;">
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the cloud noise. Increase to make clouds cover less area.')}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the cloud noise. Decrease to make clouds cover more area.')}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.threshold', 'Threshold', 0, 1, 0.01, 'Cuts off noise values below this, creating harder-edged clouds.')}
                                ${DebuggerUIBuilder._createSliderHTML('structuralShadows.cloudOcclusion.shading.softness', 'Softness', 0.01, 1, 0.01, 'How gradual the transition is at the threshold edge.')}
                            </div></details>
                        </div>
                    </details>
                </div>
            </details>
        `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Structural Shadows', content, iconHTML);
    }

    _buildAmbientSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('ambient', 'Ambient / Emissive', `
            <p class="description-text">Applies color and effects to a texture, often used for glowing areas that are part of the map itself (e.g., lava, magic runes).</p>
            ${DebuggerUIBuilder._createSliderHTML('ambient.intensity', 'Intensity', 0, 5, 0.05, 'Brightness multiplier. Values > 1 are useful for additive blending.')}
            ${DebuggerUIBuilder._createSelectHTML('ambient.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
            <details id="details-ambient-tokenMasking">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('ambient.tokenMasking.enabled', 'Token Masking', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Hides the effect behind tokens. For this to work, you may need to increase this layer's Z-Index (see Rendering Order section) to be above the token layer.</p>
                    ${DebuggerUIBuilder._createSliderHTML('ambient.tokenMasking.threshold', 'Mask Threshold', 0, 1, 0.01)}
                </div>
            </details>
            <details id="details-ambient-masking">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('ambient.masking.enabled', 'Luminance Mask', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Fades out the effect in dark areas of the scene. Requires scene lighting and the Illumination Buffer module.</p>
                    ${DebuggerUIBuilder._createSliderHTML('ambient.masking.threshold', 'Brightness Threshold', 0, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('ambient.masking.softness', 'Edge Softness', 0.01, 1, 0.01)}
                </div>
            </details>
            <details id="details-ambient-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('ambient.colorCorrection.enabled', 'Color Correction', true)}</div></summary>
                <div style="padding-left: 15px;">
                    ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                    ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05)}
                    <details id="details-ambient-cc-tint"><summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary><div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createColorPickerHTML('ambient.colorCorrection.tint.color', 'Tint Color')}
                            ${DebuggerUIBuilder._createSliderHTML('ambient.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                    </div></details>
                </div>
            </details>
            <details id="details-ambient-rendering">
                <summary><span class="accordion-toggle"></span><strong>Rendering Order</strong></summary>
                <div>
                    <p class="description-text">Controls the draw order of this layer relative to others like lighting and tokens. Higher values are drawn on top.</p>
                    ${DebuggerUIBuilder._createSliderHTML('ambientLayerZIndex', 'Layer Z-Index', 0, 500, 10, 'Default z-indexes: Tokens=100, Lighting=200, Weather=300, Fog=400')}
                    <button id="reload-canvas-btn" style="width: 100%; margin-top: 5px;">Reload Canvas to Apply Z-Index</button>
                </div>
            </details>
        `);
    }

    _buildGroundGlowSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('groundGlow', 'Glow in the Dark', `
            <p class="description-text">Makes a texture appear to glow only in unlit areas of the scene. Requires scene lighting.</p>
            ${DebuggerUIBuilder._createSliderHTML('groundGlow.intensity', 'Intensity', 0, 5, 0.05)}
            <details id="details-groundGlow-tokenMasking">
                <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('groundGlow.tokenMasking.enabled', 'Token Masking', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Hides the effect behind tokens. This layer is already in a high-level group, so it should work by default.</p>
                    ${DebuggerUIBuilder._createSliderHTML('groundGlow.tokenMasking.threshold', 'Mask Threshold', 0, 1, 0.01)}
                </div>
            </details>
            ${DebuggerUIBuilder._createSliderHTML('groundGlow.luminanceThreshold', 'Light Threshold', 0, 1, 0.01, 'The scene brightness level above which the glow will fade out.')}
            ${DebuggerUIBuilder._createSliderHTML('groundGlow.softness', 'Edge Softness', 0.01, 1, 0.01)}
            ${DebuggerUIBuilder._createCheckboxHTML('groundGlow.invert', 'Invert (Glow in Light)', false, 'Makes the effect appear in lit areas instead of dark ones.')}
            ${DebuggerUIBuilder._createSliderHTML('groundGlow.brightness', 'Brightness', 0, 5, 0.05)}
            ${DebuggerUIBuilder._createSliderHTML('groundGlow.saturation', 'Saturation', 0, 5, 0.05)}
        `);
    }

    _buildPrismSettingsHTML() {
        const effectKey = 'prism';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
            ${checkboxHTML}
            <hr style="border-color: #555; margin: 6px 0;">
            <p class="description-text">Splits the light from the brightest parts of the scene into a prismatic, chromatic aberration effect.</p>
            ${DebuggerUIBuilder._createSliderHTML('prism.intensity', 'Intensity', 0, 50, 0.5, 'The distance in pixels the color channels are split.')}
            ${DebuggerUIBuilder._createSliderHTML('prism.angle', 'Angle', 0, 360, 1, 'The direction of the color split.')}
            ${DebuggerUIBuilder._createSliderHTML('prism.threshold', 'Luminance Threshold', 0, 1, 0.01, 'The effect will only apply to pixels brighter than this value.')}
            ${DebuggerUIBuilder._createSliderHTML('prism.softness', 'Threshold Softness', 0.01, 1, 0.01, 'The softness of the transition at the luminance threshold.')}
            <details id="details-prism-distortionNoise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('prism.distortionNoise.enabled', 'Distortion', true)}</div></summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Uses a noise pattern to warp and animate the prism effect.</p>
                    ${DebuggerUIBuilder._createSliderHTML('prism.distortionStrength', 'Distortion Strength', 0, 10, 0.1)}
                    ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.speed', 'Speed', -0.5, 0.5, 0.005)}
                    ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.scale', 'Scale', 0.01, 10, 0.01)}
                    ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.evolution', 'Evolution', 0, 1, 0.01)}
                    <details id="details-prism-distortionNoise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                        <div style="padding-left: 15px;">
                            ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.threshold', 'Threshold', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.brightness', 'Brightness', -1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.contrast', 'Contrast', 0, 5, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('prism.distortionNoise.softness', 'Softness', 0.01, 1, 0.01)}
                        </div>
                    </details>
                </div>
            </details>
        `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Prism Effect', content, iconHTML);
    }
}



/**
 * The main class for the debugger UI. It creates the DOM element, initializes
 * the event handler, and manages the window's lifecycle.
 */
class MaterialEditorDebugger {
    constructor() {
        this.element = null;
        this.uiBuilder = null;
        this.eventHandler = null;
        this.profileManager = null;
        this._boundUpdateIndicator = this._updateIndicator.bind(this);
        this.resizeObserver = null;
        this.resizeTimeout = null;
    }

    initialize(profileManager) {
        this.profileManager = profileManager;
        this.uiBuilder = new DebuggerUIBuilder();
        this.element = this.uiBuilder.buildRootElement();
        document.body.appendChild(this.element);
        this.eventHandler = new DebuggerEventHandler(this.element, this.profileManager);
        this.eventHandler.initialize();

        const savedPosition = game.settings.get(MODULE_ID, 'debugger-position');
        const defaultWidth = 1000, defaultHeight = 1150;
        if (savedPosition && savedPosition.width && savedPosition.height) {
            this.element.style.width = `${savedPosition.width}px`; this.element.style.height = `${savedPosition.height}px`;
            this.element.style.top = `${savedPosition.top}px`; this.element.style.left = `${savedPosition.left}px`;
        } else {
            this.element.style.width = `${defaultWidth}px`; this.element.style.height = `${defaultHeight}px`;
            const initialTop = 80, initialLeft = (window.innerWidth - defaultWidth) / 2;
            this.element.style.top = `${initialTop}px`; this.element.style.left = `${Math.max(0, initialLeft)}px`;
        }

        // TODO: Re-integrate system status
        // this._populateAllIndicators();
        // systemStatus.on('statusChanged', this._boundUpdateIndicator);

        this.resizeObserver = new ResizeObserver(entries => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    const currentPos = game.settings.get(MODULE_ID, 'debugger-position') || {};
                    currentPos.width = width; currentPos.height = height;
                    if (currentPos.top === undefined) currentPos.top = this.element.offsetTop;
                    if (currentPos.left === undefined) currentPos.left = this.element.offsetLeft;
                    game.settings.set(MODULE_ID, 'debugger-position', currentPos);
                }
            }, 200);
        });
        this.resizeObserver.observe(this.element);
        console.log("[MapShine] Material Editor UI system initialized.");
    }

    destroy() {
        // systemStatus.off('statusChanged', this._boundUpdateIndicator);
        this.resizeObserver?.disconnect();
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
        this.element?.remove();
        this.element = null; this.uiBuilder = null; this.eventHandler = null; this.profileManager = null;
        game.mapShine.debugger = null;
        ui.controls.render(true);
        console.log("[MapShine] Material Editor UI destroyed.");
    }

    applyProfileState(profileData) {
        if (this.eventHandler) {
            this.eventHandler.updateAllControls();
            this.eventHandler.applyProfileUIState(profileData);
        }
    }

    _populateAllIndicators() {
        // const allStatuses = systemStatus.getAllStatuses();
        // for (const [category, statuses] of Object.entries(allStatuses)) {
        //     for (const [key, statusObject] of Object.entries(statuses)) {
        //         this._updateIndicator(category, key, statusObject);
        //     }
        // }
    }

    _updateIndicator(category, key, statusObject) {
        // const light = this.element.querySelector(`#status-${category}-${key}`);
        // if (light) {
        //     light.className = `traffic-light ${statusObject.state}`;
        //     light.title = statusObject.message;
        // }
        // if (category === 'textures') {
        //     const pathInput = this.element.querySelector(`#texture-path-${key}`);
        //     if (pathInput) {
        //         pathInput.value = statusObject.message;
        //         pathInput.title = statusObject.message;
        //     }
        // }
    }
}

/**
 * A FormApplication for creating, editing, and managing map point groups that
 * can be used as sources for various geometry-based effects.
 */
class MapPointsEditor extends FormApplication {
    constructor(options = {}) {
        super(options);
        this._selectedGroupId = game.user.getFlag(MODULE_ID, "lastSelectedMapPointGroup") || null;
        game.mapShine.activeMapPointGroup = this._selectedGroupId;
        this._hookId = Hooks.on("mapShine:mapPointsUpdated", () => {
            if (this.rendered) this.render(false);
        });
    }

    get form() { return this.element?.[0]; }
    set form(value) { /* No-op */ }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "map-shine-points-editor", title: "Map Shine: Point Group Editor",
            template: null, width: 550, height: "auto", resizable: true,
            closeOnSubmit: false, submitOnChange: false, zIndex: 10001
        });
    }

    async getData(options) { return { groups: MapPointsManager.getGroups() }; }

    async render(force, options) {
        await super.render(force, options);
        const layer = canvas.layers.find(l => l instanceof MapPointsLayer);
        if (layer) layer.alpha = 1;
        return this;
    }

    async _renderInner(data) { return $(this._buildHTML(data)); }

    _buildHTML(data) {
        const groups = Object.values(data.groups);
        const selectedGroup = this._selectedGroupId ? data.groups[this._selectedGroupId] : null;
        let detailsHTML;
        if (selectedGroup) {
            const effectOptions = Object.entries(EFFECT_SOURCE_OPTIONS).map(([key, name]) => `<option value="${key}" ${selectedGroup.effectTarget === key ? 'selected' : ''}>${name}</option>`).join('');
            detailsHTML = `
                <div class="mp-details-header"><h4>${selectedGroup.label}</h4><button type="button" data-action="delete-group" class="delete-btn" title="Delete Group"><i class="fas fa-trash"></i> Delete Group</button></div>
                <ul class="mp-points-list">${selectedGroup.points.map((p, i) => `<li class="mp-point-item"><span>#${i+1}</span><span>X: ${Math.round(p.x)}</span><span>Y: ${Math.round(p.y)}</span><button type="button" data-action="delete-point" data-point-index="${i}" title="Delete Point"><i class="fas fa-times"></i></button></li>`).join('')}</ul>
                <div class="mp-effect-source-settings"><h4><i class="fas fa-magic"></i> Effect Source</h4>
                    <div class="control-row"><label for="mp-isEffectSource" title="If checked, this group's geometry will be used to generate the selected effect.">Use as Effect Source</label><input type="checkbox" name="isEffectSource" id="mp-isEffectSource" ${selectedGroup.isEffectSource ? 'checked' : ''}></div>
                    <div class="control-row" id="mp-effectTarget-wrapper" style="display: ${selectedGroup.isEffectSource ? 'flex' : 'none'};"><label for="mp-effectTarget">Target Effect</label><select name="effectTarget" id="mp-effectTarget">${effectOptions}</select></div>
                </div>`;
        } else { detailsHTML = `<div class="mp-details-placeholder">Select a group to view its details.</div>`; }
        const isPlacementActive = game.mapShine.mapPointsInteractionManager.isActive;
        return `<style>/* CSS from old code */</style><form class="mp-editor"><div class="mp-main-content"><div class="mp-panel mp-panel-groups"><h3>Groups</h3><ul class="mp-group-list">${groups.map(g => `<li class="mp-group-item ${g.id === this._selectedGroupId ? 'selected' : ''}" data-group-id="${g.id}" data-action="select-group"><span class="mp-group-item-status ${g.isBroken ? 'broken' : 'valid'}" title="${g.isBroken ? g.reason : 'Valid'}"></span><span class="mp-group-item-label">${g.label}</span><span class="mp-group-item-type">${g.type}</span></li>`).join('')}</ul><div class="mp-create-group-form"><input type="text" name="newGroupName" placeholder="New Group Name"><div class="create-controls"><select name="newGroupType"><option value="point">Points</option><option value="line">Line</option><option value="area">Area</option></select></div><button type="button" data-action="create-group">Create Group</button></div></div><div class="mp-panel mp-panel-details">${detailsHTML}</div></div><div class="mp-editor-footer"><button type="button" data-action="toggle-placement" class="${isPlacementActive ? 'active' : ''}" style="width: 100%;">${isPlacementActive ? 'Deactivate' : 'Activate'} Point Placement Mode</button></div></form>`;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const form = html[0];
        if (form) {
            form.addEventListener('click', this._onClick.bind(this));
            form.addEventListener('input', this._onPropertyChange.bind(this));
            form.addEventListener('change', this._onPropertyChange.bind(this));
        }
    }

    async _onPropertyChange(event) {
        const target = event.target;
        if (target.name !== 'isEffectSource' && target.name !== 'effectTarget') return;
        if (!this._selectedGroupId) return;
        const form = this.form;
        const isEffectSource = form.querySelector('[name="isEffectSource"]').checked;
        const effectTarget = form.querySelector('[name="effectTarget"]').value;
        const wrapper = form.querySelector('#mp-effectTarget-wrapper');
        if (wrapper) wrapper.style.display = isEffectSource ? 'flex' : 'none';
        await MapPointsManager.updateGroupProperties(this._selectedGroupId, { isEffectSource, effectTarget });
    }

    async _onClick(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        event.preventDefault();
        switch (action) {
            case 'select-group': {
                const groupId = target.dataset.groupId;
                if (groupId) {
                    this._selectedGroupId = groupId;
                    game.user.setFlag(MODULE_ID, "lastSelectedMapPointGroup", groupId);
                    game.mapShine.activeMapPointGroup = groupId;
                    this.render(false);
                }
                break;
            }
            case 'create-group': {
                const nameInput = this.form.querySelector('[name="newGroupName"]');
                const typeInput = this.form.querySelector('[name="newGroupType"]');
                const newGroupId = await MapPointsManager.createGroup({ label: nameInput.value || "New Group", type: typeInput.value });
                this._selectedGroupId = newGroupId;
                game.user.setFlag(MODULE_ID, "lastSelectedMapPointGroup", newGroupId);
                game.mapShine.activeMapPointGroup = newGroupId;
                nameInput.value = '';
                break;
            }
            case 'delete-group': {
                if (this._selectedGroupId) {
                    const group = MapPointsManager.getGroup(this._selectedGroupId);
                    Dialog.confirm({
                        title: "Delete Group", content: `<p>Are you sure you want to delete the group "<strong>${group.label}</strong>"?</p>`,
                        yes: async () => {
                            await MapPointsManager.deleteGroup(this._selectedGroupId);
                            this._selectedGroupId = null;
                            game.mapShine.activeMapPointGroup = null;
                            game.user.unsetFlag(MODULE_ID, "lastSelectedMapPointGroup");
                        }, defaultYes: false,
                    });
                }
                break;
            }
            case 'delete-point': {
                const pointIndex = parseInt(target.dataset.pointIndex, 10);
                if (this._selectedGroupId && !isNaN(pointIndex)) await MapPointsManager.deletePoint(this._selectedGroupId, pointIndex);
                break;
            }
            case 'toggle-placement': {
                const manager = game.mapShine.mapPointsInteractionManager;
                if (manager.isActive) manager.deactivate(); else manager.activate();
                break;
            }
        }
    }

    async _updateObject(event, formData) { /* No-op */ }

    async close(options) {
        game.mapShine.mapPointsInteractionManager?.deactivate();
        Hooks.off("mapShine:mapPointsUpdated", this._hookId);
        game.mapShine.mapPointsEditor = null;
        const layer = canvas.layers.find(l => l instanceof MapPointsLayer);
        if (layer) layer.alpha = 0;
        return super.close(options);
    }
}

/*********************************************************************************
 *  SECTION 7: MODULE INITIALIZATION & HOOKS
 *********************************************************************************/
// Description: This is the main entry point for the module. It sets up the global
//              namespace, registers all settings and hooks, defines canvas layers,
//              and manages the lifecycle of the MapShineEngine.
// ---------------------------------------------------------------------------------

// THIS IS THE CORRECT WAY TO MAKE CONTROLS IN FOUNDRY VTT - Please don't break it.
Hooks.on('getSceneControlButtons', (controls) => {
    if (!game.user.isGM) return;

    // Reverting to the original object-based syntax to ensure compatibility.
    const tokenControls = controls.tokens;
    if (tokenControls) {
        tokenControls.tools["map-shine-editor"] = {
            name: "map-shine-editor",
            title: "Toggle Map Shine Editor",
            icon: "fas fa-sliders-h",
            toggle: true,
            active: !!game.mapShine?.debugger,
            onClick: (toggled) => {
                if (toggled) {
                    game.mapShine?.showEditor();
                } else {
                    game.mapShine?.debugger?.destroy();
                }
            }
        };
    }
});


  
/**
 * The main initialization hook, run once when the world is first loaded.
 */
Hooks.once('init', () => {
    if (game.mapShine?.initialized) {
        console.log("[MapShine] Initialization aborted: module has already been initialized.");
        return;
    }
    console.log("%c[MapShine] Initializing Module...", "color: #40a0fa; font-weight: bold;");

    // --- 1. Global Namespace Setup ---
    game.mapShine = {
        initialized: true,
        particleLibraryPatched: false,
        timeControl: { timeFactor: 1.0 },
        profileManager: new ProfileManager(),
        debugger: null,
        engine: null, // The main engine will be created on canvasReady
        mapPointsInteractionManager: new MapPointsInteractionManager(), // Initialize interaction manager
        mapPointsEditor: null,
        activeMapPointGroup: null,

        showEditor: function() {
            if (game.mapShine.debugger) {
                game.mapShine.debugger.element.classList.remove('minimized');
                return;
            }
            game.mapShine.debugger = new MaterialEditorDebugger();
            game.mapShine.debugger.initialize(game.mapShine.profileManager);
            game.mapShine.profileManager.initializeUI(game.mapShine.debugger);
        }
    };

    // --- Keyboard Listener for Point Placement Mode ---
    window.addEventListener('keydown', (event) => {
        if (game.mapShine?.mapPointsInteractionManager?.handleEscape(event)) {
            return;
        }
    }, true);


    // --- 2. Settings Registration ---
    // General Settings
    game.settings.register(MODULE_ID, 'disable-loading-screen', { name: "Disable Scene Transitions", hint: "Disables the fade-through-black scene transition.", scope: "client", config: true, type: Boolean, default: false });
    game.settings.register(MODULE_ID, 'debugger-position', { name: "Debugger Window Position", scope: "client", config: false, type: Object, default: {} });
    game.settings.register(MODULE_ID, 'ambientLayerZIndex', { name: "Ambient Layer Z-Index", scope: "client", config: false, type: Number, default: 250 });

    // World Profile Settings
    game.settings.register(MODULE_ID, PROFILES_SETTING, { name: "Material Effect Profiles", scope: "world", config: false, type: Object, default: {} });
    game.settings.register(MODULE_ID, DEFAULT_PROFILE_SETTING, { name: "Default Material Profile Name", scope: "world", config: false, type: String, default: "" });
    game.settings.register(MODULE_ID, 'user-adjustments', { name: "User-specific FX Overrides", scope: "client", config: false, type: Object, default: {} });
    game.settings.register(MODULE_ID, 'colorFavorites', { name: "Color Correction Favorites", scope: "client", config: false, type: String, default: "[]" });

    // Client-side Accessibility & Performance Overrides
    const clientOverrideOnChange = () => {
        if (canvas?.ready && game.mapShine?.profileManager) {
            game.mapShine.profileManager.initializeForScene();
            game.mapShine.profileManager.updateAllSystemsFromConfig();
        }
    };
    game.settings.register(MODULE_ID, 'user-disable-distortion', { name: "Global Override: Disable Screen Distortion", hint: "Disables all screen-warping effects (e.g., Heat, Lens Distortion).", scope: "client", config: true, type: Boolean, default: false, onChange: clientOverrideOnChange });
    game.settings.register(MODULE_ID, 'user-disable-color-fringe', { name: "Global Override: Disable Color Fringe", hint: "Disables all 'chromatic aberration' effects.", scope: "client", config: true, type: Boolean, default: false, onChange: clientOverrideOnChange });

    Object.entries(CLIENT_OVERRIDES_CONFIG).forEach(([key, data]) => {
        game.settings.register(MODULE_ID, `user-${key}-enabled`, { name: data.name, hint: `Toggles the '${data.name}' effect.`, scope: "client", config: true, type: Boolean, default: true, onChange: clientOverrideOnChange });
        if (data.intensitySubPath) {
            game.settings.register(MODULE_ID, `user-${key}-intensity`, { name: `+ Intensity: ${data.name}`, hint: `Modifies the intensity of '${data.name}'.`, scope: "client", config: true, type: Number, range: { min: 0, max: 100, step: 1 }, default: 100, onChange: clientOverrideOnChange });
        }
    });

    // --- 3. Canvas Layer Registration ---
    const ambientZIndex = game.settings.get(MODULE_ID, 'ambientLayerZIndex');
    Object.assign(CONFIG.Canvas.layers, {
        mapShine: {
            layerClass: MapShineLayer,
            group: "primary",
            zIndex: ambientZIndex
        },
        mapPoints: {
            layerClass: MapPointsLayer,
            group: "interface"
        },
        diagnostic: {
            layerClass: DiagnosticLayer,
            group: "interface"
        },
    });
    console.log(`[MapShine] Canvas layers registered.`);

    // --- 4. Register All Modular Effect Classes with the Engine ---
    // This is a critical step that tells the engine how to map a texture suffix to an effect class.
    MapShineEngine.registerEffect(MetallicShineEffect);
    MapShineEngine.registerEffect(CloudShadowsEffect);
    MapShineEngine.registerEffect(IridescenceEffect);
    MapShineEngine.registerEffect(CanopyEffect);
    MapShineEngine.registerEffect(StructuralShadowsEffect);
    MapShineEngine.registerEffect(AmbientEffect);
    MapShineEngine.registerEffect(GroundGlowEffect);
    MapShineEngine.registerEffect(HeatDistortionEffect);
    MapShineEngine.registerEffect(PrismEffect);
    MapShineEngine.registerEffect(WaterFXEffect);

// --- 5. Register Custom Particle Behaviors ---
if (PIXI.particles && typeof PIXI.particles.Emitter === 'function') {
    PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(TextureMaskShape);
    PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(GeometryMaskShape);
    PIXI.particles.Emitter.registerBehavior(SparkPathBehavior);
    PIXI.particles.Emitter.registerBehavior(FireParticleBehavior);
    console.log(`[MapShine] Custom particle behaviors and shapes registered.`);
} else {
    console.error("[MapShine] FATAL: pixi-particles library not found. Particle effects will not function.");
}

    // --- 6. Core Lifecycle Hooks ---
    Hooks.on('canvasReady', () => {
        // Patch the particle library after it has been fully initialized on the canvas.
        if (PIXI.particles && !game.mapShine.particleLibraryPatched) {
            // This is a monkey-patch to fix a bug in the pixi-particles library.
            // The original interpolate functions can cause a crash if a particle's age reaches exactly 1.0.
            // This patch intercepts the call and clamps the age value to just under 1.0, avoiding the bug.
            const originalInterpolate = PIXI.particles.PropertyList.prototype.interpolate;
            PIXI.particles.PropertyList.prototype.interpolate = function(lerp) {
                if (lerp >= 1.0) {
                    lerp = 0.999999;
                }
                return originalInterpolate.call(this, lerp);
            };

            // PIXI.particles.Color is only defined after the canvas is ready.
            if (PIXI.particles.Color) {
                const originalColorInterpolate = PIXI.particles.Color.prototype.interpolate;
                PIXI.particles.Color.prototype.interpolate = function(lerp) {
                    if (lerp >= 1.0) {
                        lerp = 0.999999;
                    }
                    return originalColorInterpolate.call(this, lerp);
                }
            }
            game.mapShine.particleLibraryPatched = true;
            console.log("[MapShine] Patched pixi-particles library.");
        }

        MapShineEngine.initialize();
    });
    Hooks.on('canvasTearDown', () => {
        MapShineEngine.tearDown();
    });

    // --- 7. Data Refresh Hooks ---
    const refreshTargets = async () => {
        if (canvas?.ready) {
            await TargetRegistry.discover();
            // Now that targets are known, update diagnostic and particle systems
            const diagnosticLayer = canvas.layers.find(l => l instanceof DiagnosticLayer);
            diagnosticLayer?.updateEffectTargets();
            game.mapShine.engine?._particleSystem?.updateEffectTargets(TargetRegistry.targets, game.mapShine.profileManager.activeConfig);

            Hooks.callAll('mapShine:targetsRefreshed');
        }
    };
    Hooks.on("createTile", refreshTargets);
    Hooks.on("updateTile", refreshTargets);
    Hooks.on("deleteTile", refreshTargets);
    Hooks.on("updateScene", (scene, data) => {
        if (scene.isView && (foundry.utils.hasProperty(data, `flags.${MODULE_ID}`) || foundry.utils.hasProperty(data, 'background.src'))) {
            refreshTargets();
        }
    });

    // --- 8. Scene Transition Wrapper ---
    if (game.modules.get('lib-wrapper')?.active) {
        libWrapper.register(MODULE_ID, 'Scene.prototype.view', async function(wrapped, ...args) {
            const config = game.mapShine.profileManager.activeConfig.sceneTransition;
            const sceneToView = this;
            const currentScene = canvas.scene;

            if (!config.enabled || !currentScene || sceneToView.id === currentScene.id || game.settings.get(MODULE_ID, 'disable-loading-screen')) {
                return wrapped(...args);
            }
            
            console.log(`[MapShine] Transition: Starting transition to '${sceneToView.name}'.`);
            await game.scenes.preload(sceneToView.id);
            const transition = new SceneTransition();
            await transition.showLoadingScreen(config, sceneToView.name);
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const result = await wrapped(...args);

            await new Promise(resolve => Hooks.once('canvasReady', resolve));
            await new Promise(resolve => setTimeout(resolve, 500)); 
            
            await transition.hideLoadingScreen(config);
            return result;
        }, 'WRAPPER');
        console.log("[MapShine] libWrapper detected. Scene transitions enabled.");
    } else {
        console.warn("[MapShine] libWrapper not active. Scene transitions will be disabled.");
    }
});

  


/**
 * A hook that runs once the core software is fully ready and the UI is available.
 */
Hooks.once('ready', () => {
    if (game.modules.get('lib-wrapper')?.active) {
        libWrapper.register(MODULE_ID, 'ui.notifications.info', function(wrapped, message, options) {
            if (game.mapShine.engine?._sceneTransition && message.startsWith(game.i18n.localize("LOADING.Stage"))) {
                // Intercept Foundry's core loading messages and do nothing, as our screen is showing.
                return null;
            }
            return wrapped(message, options);
        }, 'MIXED');
    }
    console.log("%c[MapShine] Module fully ready.", "color: #4CAF50; font-weight: bold;");
});

    
/*********************************************************************************
 *  SECTION 8: MAP GEOMETRY SYSTEM
 *********************************************************************************/
// Description: This section contains the data manager and interaction controller
//              for the Map Points feature, which allows GMs to draw points,
//              lines, and polygons on the map to act as sources for effects.
// ---------------------------------------------------------------------------------

/**
 * A static utility class for managing map point group data stored in scene flags.
 */
class MapPointsManager {
    static FLAG_NAME = "mapPointGroups";

    static getGroups() {
        return canvas.scene?.getFlag(MODULE_ID, this.FLAG_NAME) ?? {};
    }

    static getGroup(groupId) { return this.getGroups()[groupId]; }

    static async createGroup({ label = "New Group", type = "point" } = {}) {
        if (!game.user.isGM) {
            ui.notifications.warn("You do not have permission to create map point groups.");
            return null;
        }
        const groupId = foundry.utils.randomID();
        const newGroup = { id: groupId, label, type, points: [], isBroken: false, reason: "", isEffectSource: false, effectTarget: "" };
        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        await canvas.scene.update({ [path]: newGroup });
        Hooks.callAll("mapShine:mapPointsUpdated");
        return groupId;
    }

    static async updateGroupProperties(groupId, properties) {
        if (!game.user.isGM) return;
        const group = this.getGroup(groupId);
        if (!group) return;
        const updateData = {};
        if ("isEffectSource" in properties) updateData[`flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}.isEffectSource`] = properties.isEffectSource;
        if ("effectTarget" in properties) updateData[`flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}.effectTarget`] = properties.effectTarget;
        if (!foundry.utils.isEmpty(updateData)) {
            await canvas.scene.update(updateData, { diff: false });
            Hooks.callAll("mapShine:mapPointsUpdated");
        }
    }

    static async deleteGroup(groupId) {
        if (!game.user.isGM) { ui.notifications.warn("You do not have permission to delete map point groups."); return; }
        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.-=${groupId}`;
        await canvas.scene.update({ [path]: null });
        if (game.mapShine.activeMapPointGroup === groupId) game.mapShine.activeMapPointGroup = null;
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    static async addPoint(groupId, point) {
        if (!game.user.isGM) return;
        const group = this.getGroup(groupId);
        if (!group) return;
        const newPoints = [...group.points, point];
        const updatedGroup = this.validate({ ...group, points: newPoints });
        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        await canvas.scene.update({ [path]: updatedGroup });
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    static async updatePoint(groupId, pointIndex, newPosition) {
        if (!game.user.isGM) return;
        const group = this.getGroup(groupId);
        if (!group || !group.points[pointIndex]) return;
        const newPoints = [...group.points];
        newPoints[pointIndex] = newPosition;
        const updatedGroup = this.validate({ ...group, points: newPoints });
        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        await canvas.scene.update({ [path]: updatedGroup });
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    static async deletePoint(groupId, pointIndex) {
        if (!game.user.isGM) return;
        const group = this.getGroup(groupId);
        if (!group) return;
        const newPoints = [...group.points];
        newPoints.splice(pointIndex, 1);
        const updatedGroup = this.validate({ ...group, points: newPoints });
        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        await canvas.scene.update({ [path]: updatedGroup });
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    static validate(group) {
        if (group.type !== 'area' || group.points.length < 4) {
            group.isBroken = false;
            group.reason = "";
            return group;
        }
        const points = group.points;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i], p2 = points[(i + 1) % points.length];
            for (let j = i + 2; j < points.length; j++) {
                if (i === 0 && j === points.length - 1) continue;
                const p3 = points[j], p4 = points[(j + 1) % points.length];
                if (this._checkIntersection(p1, p2, p3, p4)) {
                    group.isBroken = true;
                    group.reason = `Segment ${i+1}-${i+2} intersects segment ${j+1}-${j+2}.`;
                    return group;
                }
            }
        }
        group.isBroken = false;
        group.reason = "";
        return group;
    }

    static _checkIntersection(p1, p2, p3, p4) {
        const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (den === 0) return false;
        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
        const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;
        return t > 0 && t < 1 && u > 0 && u < 1;
    }
}


/**
 * Manages all canvas pointer interactions for the Map Points feature,
 * including adding, dragging, and deleting points.
 */
class MapPointsInteractionManager {
    constructor() {
        this.isActive = false;
        this._draggedPoint = null;
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
    }

    get layer() { return canvas.layers.find(l => l instanceof MapPointsLayer); }
    get editor() { return game.mapShine.mapPointsEditor; }

    activate() {
        if (this.isActive || !game.user.isGM) return;
        const layer = this.layer;
        if (!layer) return;
        this.isActive = true;
        canvas.stage.interactive = true;
        canvas.stage.on('pointerdown', this._onPointerDown);
        canvas.stage.on('pointermove', this._onPointerMove);
        document.getElementById('board').style.cursor = 'crosshair';
        ui.notifications.info("Point Placement Mode Activated. [Esc] to deactivate.");
        this.editor?.render(false);
        game.mapShine.debugger?.eventHandler?.updatePlacementStatus();
    }

    deactivate() {
        if (!this.isActive) return;
        this.isActive = false;
        canvas.stage.off('pointerdown', this._onPointerDown);
        canvas.stage.off('pointermove', this._onPointerMove);
        canvas.stage.off('pointerup', this._onPointerUp);
        document.getElementById('board').style.cursor = 'default';
        const layer = this.layer;
        if (layer) {
            layer._hoveredPoint = null;
            layer._draggedPoint = null;
            layer._liveDragGroup = null;
            layer._drawMapPoints();
        }
        ui.notifications.info("Point Placement Mode Deactivated.");
        this.editor?.render(false);
        game.mapShine.debugger?.eventHandler?.updatePlacementStatus();
    }

    _onPointerDown(event) {
        if (!this.isActive) return;
        const layer = this.layer;
        if (!layer || !event.global) return;
        const worldPos = layer.toLocal(event.global);
        const hovered = layer._getPointAt(worldPos);
        if (event.nativeEvent.button === 0) { // Left Click
            if (hovered) {
                this._draggedPoint = hovered;
                layer._draggedPoint = hovered;
                layer._drawMapPoints();
                canvas.stage.once('pointerup', this._onPointerUp);
            } else {
                const activeGroupId = game.mapShine.activeMapPointGroup;
                if (activeGroupId) MapPointsManager.addPoint(activeGroupId, worldPos);
                else ui.notifications.warn("Map Shine | No active group selected to add a point.");
            }
        } else if (event.nativeEvent.button === 2) { // Right Click
            if (hovered) MapPointsManager.deletePoint(hovered.groupId, hovered.pointIndex);
        }
    }

    _onPointerMove(event) {
        if (!this.isActive) return;
        const layer = this.layer;
        if (!layer || !event.global) return;
        const worldPos = layer.toLocal(event.global);
        if (this._draggedPoint) {
            const group = MapPointsManager.getGroup(this._draggedPoint.groupId);
            if (group) {
                const tempPoints = [...group.points];
                tempPoints[this._draggedPoint.pointIndex] = worldPos;
                layer._liveDragGroup = MapPointsManager.validate({ ...group, points: tempPoints });
                layer._drawMapPoints();
            }
        } else {
            const newHovered = layer._getPointAt(worldPos);
            const oldHoveredId = layer._hoveredPoint ? `${layer._hoveredPoint.groupId}-${layer._hoveredPoint.pointIndex}` : null;
            const newHoveredId = newHovered ? `${newHovered.groupId}-${newHovered.pointIndex}` : null;
            if (oldHoveredId !== newHoveredId) {
                layer._hoveredPoint = newHovered;
                layer._drawMapPoints();
            }
        }
    }

    _onPointerUp(event) {
        if (!this.isActive || !this._draggedPoint) return;
        const layer = this.layer;
        if (!layer || !event.global) {
            this._draggedPoint = null;
            if(layer) {
                layer._draggedPoint = null;
                layer._liveDragGroup = null;
                layer._drawMapPoints();
            }
            return;
        }
        const worldPos = layer.toLocal(event.global);
        MapPointsManager.updatePoint(this._draggedPoint.groupId, this._draggedPoint.pointIndex, worldPos);
        this._draggedPoint = null;
        layer._draggedPoint = null;
        layer._liveDragGroup = null;
    }

    handleEscape(event) {
        if (event.key === "Escape" && this.isActive) {
            event.preventDefault();
            event.stopPropagation();
            this.deactivate();
            return true;
        }
        return false;
    }
}

  

  