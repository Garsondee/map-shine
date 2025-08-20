/******************************************************************************
 *
 *                            MAP SHINE 
 *
 *  The major objective of this module is to provide map makers with a range
 *  of new tools for producing highly specific visual effects.
 *
 *  Ultimately, all effects are designed to activate automatically when a
 *  correctly named texture is found. This means map makers only need to
 *  create the specific maps they want to enable the corresponding features.
 *
 *  I plan to continuously add new effects, filters, and texture overlays,
 *  with the goal of making this a powerful and flexible toolkit that can
 *  bring life and animation to scenes in new and unusual ways.
 *
 ******************************************************************************/

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
    // More effects can be added here as they become compatible.
};

const COLOR_CORRECTION_PRESETS = {
    "neutral": {
        name: "Neutral (Default)",
        saturation: 1.0,
        brightness: 0.0,
        contrast: 1.0,
        exposure: 0.0,
        gamma: 1.0,
        levels: {
            inBlack: 0.0,
            inWhite: 1.0
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#FFFFFF",
            amount: 0.0
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "cinematic": {
        name: "Cinematic",
        saturation: 1.15,
        brightness: -0.05,
        contrast: 1.1,
        exposure: 0.05,
        gamma: 0.95,
        levels: {
            inBlack: 0.02,
            inWhite: 0.98
        },
        whiteBalance: {
            temperature: 0.08,
            tint: -0.03
        },
        tint: {
            color: "#ffae70",
            amount: 0.07
        },
        invert: false,
        curves: {
            enabled: true,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 0.25,
                    "y": 0.20
                }, {
                    "x": 0.75,
                    "y": 0.80
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 0.25,
                    "y": 0.28
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "vintage": {
        name: "Vintage Film",
        saturation: 0.75,
        brightness: 0.1,
        contrast: 1.2,
        exposure: -0.1,
        gamma: 1.1,
        levels: {
            inBlack: 0.08,
            inWhite: 0.92
        },
        whiteBalance: {
            temperature: 0.1,
            tint: 0.04
        },
        tint: {
            color: "#e0b87c",
            amount: 0.15
        },
        invert: false,
        curves: {
            enabled: true,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0.05
                }, {
                    "x": 0.25,
                    "y": 0.28
                }, {
                    "x": 0.75,
                    "y": 0.72
                }, {
                    "x": 1,
                    "y": 0.95
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0.02
                }, {
                    "x": 1,
                    "y": 0.98
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "cyberpunk": {
        name: "Cyberpunk",
        saturation: 1.4,
        brightness: -0.15,
        contrast: 1.3,
        exposure: 0.1,
        gamma: 0.85,
        levels: {
            inBlack: 0.08,
            inWhite: 0.92
        },
        whiteBalance: {
            temperature: -0.15,
            tint: 0.1
        },
        tint: {
            color: "#f000ff",
            amount: 0.08
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "warm_sunset": {
        name: "Warm Sunset",
        saturation: 1.2,
        brightness: 0.05,
        contrast: 1.1,
        exposure: 0.1,
        gamma: 0.95,
        levels: {
            inBlack: 0.0,
            inWhite: 1.0
        },
        whiteBalance: {
            temperature: 0.3,
            tint: 0.12
        },
        tint: {
            color: "#ff8c42",
            amount: 0.1
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "cool_moonlight": {
        name: "Cool Moonlight",
        saturation: 0.85,
        brightness: -0.1,
        contrast: 1.1,
        exposure: -0.15,
        gamma: 1.05,
        levels: {
            inBlack: 0.03,
            inWhite: 0.97
        },
        whiteBalance: {
            temperature: -0.25,
            tint: -0.05
        },
        tint: {
            color: "#6a8dcf",
            amount: 0.09
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "vibrant_pop": {
        name: "Vibrant Pop",
        saturation: 1.6,
        brightness: 0.0,
        contrast: 1.25,
        exposure: 0.0,
        gamma: 0.9,
        levels: {
            inBlack: 0.0,
            inWhite: 1.0
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#FFFFFF",
            amount: 0.0
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "bleach_bypass": {
        name: "Bleach Bypass",
        saturation: 0.5,
        brightness: 0.0,
        contrast: 1.6,
        exposure: 0.1,
        gamma: 0.8,
        levels: {
            inBlack: 0.05,
            inWhite: 0.95
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#c0c0c0",
            amount: 0.05
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "ethereal_glow": {
        name: "Ethereal Glow",
        saturation: 1.1,
        brightness: 0.15,
        contrast: 0.85,
        exposure: 0.2,
        gamma: 1.1,
        levels: {
            inBlack: 0.0,
            inWhite: 1.0
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#ffc0cb",
            amount: 0.08
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "sepia": {
        name: "Sepia",
        saturation: 0.4,
        brightness: 0.1,
        contrast: 1.1,
        exposure: 0.0,
        gamma: 1.0,
        levels: {
            inBlack: 0.02,
            inWhite: 0.98
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#704214",
            amount: 0.5
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "black_and_white": {
        name: "Black & White",
        saturation: 0.0,
        brightness: 0.0,
        contrast: 1.4,
        exposure: 0.0,
        gamma: 1.0,
        levels: {
            inBlack: 0.05,
            inWhite: 0.95
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#FFFFFF",
            amount: 0.0
        },
        invert: false,
        curves: {
            enabled: false,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "noir": {
        name: "Noir",
        saturation: 0.0,
        brightness: -0.05,
        contrast: 1.8,
        exposure: 0.0,
        gamma: 0.8,
        levels: {
            inBlack: 0.15,
            inWhite: 0.85
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#FFFFFF",
            amount: 0.0
        },
        invert: false,
        curves: {
            enabled: true,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 0.3,
                    "y": 0.2
                }, {
                    "x": 0.7,
                    "y": 0.8
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.0
        }
    },
    "sin_city": {
        name: "Sin City",
        saturation: 0.0,
        brightness: 0.0,
        contrast: 1.9,
        exposure: -0.05,
        gamma: 1.1,
        levels: {
            inBlack: 0.2,
            inWhite: 0.8
        },
        whiteBalance: {
            temperature: 0.0,
            tint: 0.0
        },
        tint: {
            color: "#FFFFFF",
            amount: 0.0
        },
        invert: false,
        curves: {
            enabled: true,
            activeChannel: 'rgb',
            rgb: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 0.2,
                    "y": 0.1
                }, {
                    "x": 0.8,
                    "y": 0.9
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            red: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            green: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            },
            blue: {
                points: [{
                    "x": 0,
                    "y": 0
                }, {
                    "x": 1,
                    "y": 1
                }]
            }
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
            targetBrightness: 0.05
        }
    }
};

const MODULE_DEFAULTS = {
    "timeControl": {
        "globalTime": 100
    },
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
        "compositing": {
            "layerBlendMode": 1
        },
        "animation": {
            "globalIntensity": 2.9,
            "hotspot": 0,
            "updateFrequency": 10,
            "parallaxAmount": 0.94,
            "parallaxJitter": 1.5,
            "parallaxJitterSpeed": 0.3
        },
        "pattern": {
            "shared": {
                "patternScale": 0.16,
                "maxBrightness": 0.26
            },
            "stripes1": {
                "enabled": true,
                "intensity": 0.5,
                "speed": -0.006,
                "tintColor": "#FFFFFF",
                "angle": 50,
                "sharpness": 8,
                "bandDensity": 2,
                "bandWidth": 1,
                "subStripeMaxCount": 5,
                "subStripeMaxSharp": 1.5
            },
            "stripes2": {
                "enabled": true,
                "intensity": 0.5,
                "speed": 0.004,
                "tintColor": "#FFFFFF",
                "angle": 44,
                "sharpness": 8,
                "bandDensity": 1,
                "bandWidth": 1,
                "subStripeMaxCount": 3,
                "subStripeMaxSharp": 0
            },
            "checkerboard": {
                "gridSize": 8,
                "brightness1": 0.15,
                "brightness2": 0.05
            }
        },
        "noise": {
            "enabled": true,
            "speed": -0.003,
            "scale": 0.7,
            "threshold": 0.7,
            "brightness": 1,
            "contrast": 4.15,
            "softness": 1
        },
        "shineBloom": {
            "enabled": false,
            "threshold": 0.45,
            "brightness": 0.6,
            "blur": 4,
            "quality": 2
        },
        "starburst": {
            "enabled": false,
            "blendMode": 1,
            "threshold": 0.72,
            "intensity": 4,
            "angle": 18,
            "points": 2,
            "size": 6,
            "falloff": 0.7
        },
        "rgbSplit": {
            "enabled": true,
            "amount": 6.7
        },
        "colorCorrection": {
            "enabled": false,
            "saturation": 3,
            "brightness": 1,
            "contrast": 1.1,
            "exposure": 0,
            "gamma": 0.95,
            "levels": {
                "inBlack": 0,
                "inWhite": 1
            },
            "tint": {
                "color": "#ffcb2d",
                "amount": 0
            }
        }
    },
    "cloudShadows": {
        "worldBasedOnly": false,
        "enabled": true,
        "blendMode": 0,
        "shadowIntensity": 0.5,
        "maskBlur": 0,
        "illumination": {
            "enabled": false,
            "intensity": 1,
            "luminanceThreshold": 0.97,
            "softness": 0.01
        },
        "wind": {
            "angle": 45,
            "speed": 0.0024
        },
        "noise": {
            "scale": 0.35,
            "octaves": 7,
            "persistence": 0.35,
            "lacunarity": 1.9
        },
        "shading": {
            "threshold": 1,
            "softness": 0.71,
            "brightness": 0.14,
            "contrast": 5,
            "gamma": 1.6
        }
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
        "fbm": {
            "octaves": 5,
            "persistence": 0.33,
            "lacunarity": 1.9,
            "evolution": 0,
            "brightness": 0.45,
            "contrast": 0.8
        },
        "distortion": {
            "enabled": true,
            "strength": 5.26
        },
        "noise": {
            "enabled": true,
            "speed": 0.042,
            "scale": 9.7,
            "threshold": 0.47,
            "brightness": 0.74,
            "contrast": 2.45,
            "softness": 0.5
        },
        "gradient": {
            "name": "rainbow",
            "hueShift": 0,
            "brightness": 0.04,
            "contrast": 0.5
        }
    },
    "canopy": {
        "worldBasedOnly": false,
        "enabled": true,
        "shadowIntensity": 0.3,
        "tint": "#050805",
        "distortion": {
            "enabled": true,
            "intensity": 1.2,
            "speed": 0.005,
            "scale": 0.01,
            "evolution": 0.01,
            "threshold": 0,
            "brightness": -0.37,
            "contrast": 1,
            "softness": 1
        }
    },
    "structuralShadows": {
        "worldBasedOnly": false,
        "enabled": true,
        "shadowIntensity": 0.8,
        "tint": "#000000",
        "parallax": 0,
        "rgbSplit": {
            "enabled": true,
            "intensity": 8.8,
            "threshold": 0
        },
        "intensityNoise": {
            "enabled": true,
            "amount": 0,
            "speed": 0.15,
            "scale": 1.25,
            "evolution": 0,
            "threshold": 0.71,
            "brightness": -1.13,
            "contrast": 2.8,
            "softness": 1
        },
        "cloudOcclusion": {
            "enabled": true,
            "intensity": 0.25,
            "wind": {
                "angle": 45,
                "speed": 0.0005
            },
            "noise": {
                "scale": 0.18,
                "octaves": 5,
                "persistence": 0.4,
                "lacunarity": 2.6
            },
            "shading": {
                "threshold": 0.68,
                "softness": 0.04,
                "brightness": 0.5,
                "contrast": 2.5,
                "gamma": 1.95,
                "exposure": -1.65,
                "levels": {
                    "inBlack": 0.13,
                    "inWhite": 1
                }
            }
        }
    },
    "prism": {
        "worldBasedOnly": false,
        "enabled": true,
        "intensity": 1,
        "angle": 218,
        "threshold": 0.1,
        "softness": 0.5,
        "distortionStrength": 1.9,
        "distortionNoise": {
            "enabled": true,
            "speed": 0,
            "scale": 3.83,
            "evolution": 0,
            "threshold": 0,
            "brightness": 0.11,
            "contrast": 1.85,
            "softness": 1
        }
    },
    "ambient": {
        "worldBasedOnly": false,
        "enabled": true,
        "texturePath": "",
        "blendMode": 1,
        "intensity": 1,
        "masking": {
            "enabled": true,
            "threshold": 0,
            "softness": 0.25
        },
        "tokenMasking": {
            "enabled": true,
            "threshold": 0
        },
        "colorCorrection": {
            "enabled": true,
            "saturation": 1.2,
            "brightness": 0,
            "contrast": 1,
            "gamma": 1,
            "tint": {
                "color": "#ff0209",
                "amount": 0
            }
        }
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
        "tokenMasking": {
            "enabled": true,
            "threshold": 0
        }
    },
    "heatDistortion": {
        "worldBasedOnly": false,
        "enabled": true,
        "texturePath": "",
        "intensity": 0.001,
        "noise": {
            "speed": -0.02,
            "scale": 1.9,
            "threshold": 0.26,
            "brightness": 0.04,
            "contrast": 0.4,
            "softness": 0.83,
            "evolution": 0.11
        }
    },
    "advancedBloom": {
        "worldBasedOnly": false,
        "enabled": false,
        "threshold": 0.5,
        "bloomScale": 1,
        "brightness": 1,
        "blur": 8,
        "quality": 4
    },
    "sceneTransition": {
        "enabled": true,
        "worldBasedOnly": true,
        "fadeOutDuration": 5000,
        "fadeInDuration": 5000,
        "logoPath": "modules/map-shine/assets/mm-logo.png",
        "heading": "New Chapter",
        "subheading": "The story continues...",
        "staticDescription": "This is the default description text...",
        "showSceneName": true,
        "useRandomHint": true,
        "randomHints": [
            "Loading Screen Hint 1",
            "Loading Screen Hint 2",
            "Loading Screen Hint 3"
        ]
    },
    "pauseEffect": {
        "enabled": true,
        "worldBasedOnly": true,
        "duration": 3000,
        "colorCorrection": {
            "enabled": true,
            "saturation": 0.2,
            "brightness": -0.15,
            "contrast": 1,
            "invert": false,
            "tint": {
                "color": "#FFFFFF",
                "amount": 0
            },
            "exposure": 0,
            "gamma": 1,
            "levels": {
                "inBlack": 0,
                "inWhite": 1
            },
            "whiteBalance": {
                "temperature": 0,
                "tint": 0
            },
            "mask": {
                "enabled": false,
                "invert": false,
                "luminanceThreshold": 0.25,
                "softness": 0.1
            },
            "selective": {
                "enabled": false,
                "color": "#ff0000",
                "hueRange": 0.05,
                "saturationRange": 0.3
            }
        }
    },
    "combatEffect": {
        "enabled": true,
        "worldBasedOnly": true,
        "duration": 2000,
        "timeScale": 0.25,
        "colorCorrection": {
            "enabled": true,
            "saturation": 1,
            "brightness": 0,
            "contrast": 1,
            "invert": false,
            "tint": {
                "color": "#FFFFFF",
                "amount": 0
            },
            "exposure": 0,
            "gamma": 1,
            "levels": {
                "inBlack": 0,
                "inWhite": 1
            },
            "whiteBalance": {
                "temperature": 0,
                "tint": 0
            },
            "mask": {
                "enabled": false,
                "invert": false,
                "luminanceThreshold": 0.25,
                "softness": 0.1
            },
            "selective": {
                "enabled": false,
                "color": "#ff0000",
                "hueRange": 0.05,
                "saturationRange": 0.3
            }
        }
    },
    "postProcessing": {
        "worldBasedOnly": true,
        "enabled": true,
        "colorCorrection": {
            "enabled": true,
            "saturation": 1,
            "brightness": 0,
            "contrast": 1,
            "invert": false,
            "tint": {
                "color": "#FFFFFF",
                "amount": 0
            },
            "exposure": 0,
            "gamma": 1,
            "levels": {
                "inBlack": 0,
                "inWhite": 1
            },
            "whiteBalance": {
                "temperature": 0,
                "tint": 0
            },
            "highlightCloud": {
                "enabled": true,
                "brightness": 0
            },
            "highlightCanopy": {
                "enabled": true,
                "brightness": 0
            },
            "highlightStructural": {
                "enabled": true,
                "brightness": 0.5
            },
            "sceneIlluminationMixIn": {
                "enabled": false,
                "intensity": 1,
                "blendMode": 1,
                "debugMode": false,
                "colorCorrection": {
                    "enabled": true,
                    "saturation": 1,
                    "brightness": 0,
                    "contrast": 1,
                    "exposure": 0,
                    "gamma": 1,
                    "tint": {
                        "color": "#FFFFFF",
                        "amount": 0
                    }
                },
                "noise": {
                    "enabled": true,
                    "amount": 0.01,
                    "scale": 1,
                    "speed": 0.001
                },
                "shadowInteraction": {
                    "enabled": true,
                    "intensity": 1,
                    "luminanceThreshold": 0.1,
                    "softness": 0.15
                },
                "negativeMask": {
                    "enabled": false,
                    "threshold": 0.8,
                    "softness": 0.2
                }
            },
            "mask": {
                "enabled": false,
                "invert": false,
                "luminanceThreshold": 0.25,
                "softness": 0.1
            },
            "selective": {
                "enabled": false,
                "color": "#fb0045",
                "hueRange": 0.02,
                "saturationRange": 0.5,
                "luminanceRange": 0.5,
                "targetLuminance": 0.04,
                "softness": 0.1,
                "invert": false,
                "desaturation": 1,
                "targetSaturation": 1,
                "targetBrightness": 0
            },
            "curves": {
                "enabled": false,
                "activeChannel": "rgb",
                "rgb": {
                    "points": [{
                            "x": 0,
                            "y": 0
                        },
                        {
                            "x": 0.25,
                            "y": 0.25
                        },
                        {
                            "x": 0.75,
                            "y": 0.75
                        },
                        {
                            "x": 1,
                            "y": 1
                        }
                    ]
                },
                "red": {
                    "points": [{
                            "x": 0,
                            "y": 0
                        },
                        {
                            "x": 0.25,
                            "y": 0.25
                        },
                        {
                            "x": 0.75,
                            "y": 0.75
                        },
                        {
                            "x": 1,
                            "y": 1
                        }
                    ]
                },
                "green": {
                    "points": [{
                            "x": 0,
                            "y": 0
                        },
                        {
                            "x": 0.25,
                            "y": 0.25
                        },
                        {
                            "x": 0.75,
                            "y": 0.75
                        },
                        {
                            "x": 1,
                            "y": 1
                        }
                    ]
                },
                "blue": {
                    "points": [{
                            "x": 0,
                            "y": 0
                        },
                        {
                            "x": 0.25,
                            "y": 0.25
                        },
                        {
                            "x": 0.75,
                            "y": 0.75
                        },
                        {
                            "x": 1,
                            "y": 1
                        }
                    ]
                }
            },
            "dynamicExposure": {
                "enabled": true,
                "intensity": 1.5,
                "duration": 8000,
                "resetPeriod": 60000
            }
        },
        "vignette": {
            "enabled": false,
            "amount": 0.24,
            "softness": 0.36
        },
        "lensDistortion": {
            "enabled": false,
            "amount": 0.015,
            "centerX": 0.5,
            "centerY": 0.5
        },
        "chromaticAberration": {
            "enabled": true,
            "amount": 0.001,
            "centerX": 0.5,
            "centerY": 0.5
        },
        "tiltShift": {
            "enabled": false,
            "blur": 23,
            "gradientBlur": 3610,
            "startX": 0,
            "startY": 0.5,
            "endX": 1,
            "endY": 0.5
        },
        "lut": {
            "enabled": true,
            "texturePath": "",
            "intensity": 1,
            "presetName": "custom",
            "diagnosticMode": 0,
            "diagnosticSlice": 1,
            "domainMin": {
                "r": 0,
                "g": 0,
                "b": 0
            },
            "domainMax": {
                "r": 1,
                "g": 1,
                "b": 1
            },
            "preLutBlur": {
                "enabled": false,
                "amount": 0
            },
            "inputProcessing": {
                "enabled": false,
                "saturation": 1,
                "brightness": 0,
                "contrast": 1,
                "gamma": 0.9,
                "hue": 0
            }
        }
    },
    "dust": {
        "worldBasedOnly": false,
        "enabled": true,
        "blendMode": 0,
        "maskThreshold": 0.39,
        "maskInfluence": 5,
        "particleTexture": "modules/map-shine/assets/particle.webp",
        "frequency": 0.286,
        "lifetime": {
            "min": 4,
            "max": 12
        },
        "color": {
            "start": "#ffd275",
            "end": "#ffe9b9"
        },
        "alpha": {
            "max": 0.51,
            "fadeIn": 0.5,
            "fadeOut": 0.5
        },
        "scale": {
            "sizeMultiplier": 1.7,
            "start": 0.9,
            "end": 1.09,
            "minMult": 0.86
        },
        "speed": {
            "start": 3,
            "end": 6,
            "minMult": 0.5
        },
        "rotation": {
            "enabled": false,
            "minSpeed": 0,
            "maxSpeed": 20,
            "accel": 0
        }
    },
    "glint": {
        "worldBasedOnly": false,
        "enabled": true,
        "darknessAffectsIntensity": true,
        "blendMode": 0,
        "maskThreshold": 0.9,
        "maskInfluence": 0.09,
        "particleTexture": "modules/map-shine/assets/glint.webp",
        "frequency": 0.932,
        "lifetime": {
            "min": 0.8,
            "max": 2.9
        },
        "color": {
            "start": "#FFFFFF",
            "end": "#FFFFFF"
        },
        "alpha": {
            "max": 0.95,
            "fadeIn": 0.05,
            "fadeOut": 0.94
        },
        "scale": {
            "sizeMultiplier": 9,
            "start": 1.5,
            "end": 0.61,
            "minMult": 0.9
        },
        "speed": {
            "start": 0,
            "end": 0,
            "minMult": 0.5
        },
        "rotation": {
            "enabled": false,
            "minSpeed": 0,
            "maxSpeed": 20,
            "accel": 0
        },
        "rgbSplit": {
            "enabled": true,
            "amount": 8.2
        }
    },
    "water": {
        "worldBasedOnly": false,
        "enabled": true,
        "wave": {
            "enabled": true,
            "speed": 0.0148,
            "scale": 38.1,
            "intensity": 0.0004
        },
        "surface": {
            "enabled": true,
            "foamColor": "#33adff",
            "foamIntensity": 0,
            "foamCoverage": 0,
            "foamSharpness": 0.13,
            "fbmScale": 15.196,
            "fbmSpeed": 0.01,
            "fbmEvolution": 0.03,
            "fbmOctaves": 5,
            "fbmLacunarity": 4,
            "fbmPersistence": 0.1,
            "sheenEnabled": true,
            "sheenIntensity": 0.448,
            "sheenColor": "#FFFFFF",
            "sheenScale": 0.5,
            "sheenSpeed": 0.002,
            "sheenStretch": 1,
            "sheenSharpness": 0.8
        },
        "caustics": {
            "enabled": true,
            "intensity": 0.033,
            "scale": 1,
            "speed": 0.01,
            "color": "#87CEFA",
            "lineSharpness": 5,
            "bloomIntensity": 1,
            "lineDistortion": 0.1,
            "lineDistortionScale": 5,
            "intersectionBoost": 20,
            "roughnessScale": 4.2,
            "roughnessIntensity": 0.83
        },
        "shoreline": {
            "enabled": false,
            "detectionBlur": 1,
            "foamColor": "#FFFFFF",
            "foamIntensity": 0.5,
            "foamPattern": {
                "scale": 1,
                "speed": 0,
                "evolution": 0.01,
                "octaves": 4,
                "lacunarity": 2.05,
                "persistence": 0.15,
                "brightness": 0.5,
                "contrast": 1
            },
            "displacement": {
                "enabled": false,
                "scale": 0.4,
                "speed": 0.011,
                "strength": 0.0025
            },
            "particleMaskBrightness": 0,
            "particleMaskContrast": 1,
            "foamParticles": {
                "enabled": false,
                "blendMode": 1,
                "maskThreshold": 0.8,
                "maskInfluence": 5,
                "particleTexture": "modules/map-shine/assets/tight.webp",
                "frequency": 0.006,
                "lifetime": {
                    "min": 3.9,
                    "max": 3.7
                },
                "color": {
                    "start": "#9fcdff",
                    "end": "#d0faff"
                },
                "alpha": {
                    "max": 1,
                    "fadeIn": 0.02,
                    "fadeOut": 0.08
                },
                "scale": {
                    "sizeMultiplier": 0.6,
                    "start": 1.04,
                    "end": 0.26,
                    "minMult": 0.5
                },
                "speed": {
                    "start": 2,
                    "end": 6,
                    "minMult": 0.78
                },
                "rotation": {
                    "enabled": false,
                    "minSpeed": 0,
                    "maxSpeed": 0,
                    "accel": 0
                }
            }
        },
        "glintParticles": {
            "enabled": true,
            "blendMode": 9,
            "maskThreshold": 0.17,
            "maskInfluence": 1.95,
            "particleTexture": "modules/map-shine/assets/glint.webp",
            "frequency": 0.99,
            "lifetime": {
                "min": 0.8,
                "max": 0.8
            },
            "color": {
                "start": "#eef7ff",
                "end": "#95b3ff"
            },
            "alpha": {
                "max": 0.5,
                "fadeIn": 0.25,
                "fadeOut": 0.25
            },
            "scale": {
                "sizeMultiplier": 1.9,
                "start": 0.76,
                "end": 0.82,
                "minMult": 0.95
            },
            "speed": {
                "start": 5,
                "end": 11,
                "minMult": 0.47
            },
            "rotation": {
                "enabled": true,
                "minSpeed": 116,
                "maxSpeed": 123,
                "accel": 52
            }
        }
    },
    "fire": {
        "worldBasedOnly": false,
        "enabled": true,
        "bloom": {
            "enabled": true,
            "threshold": 0.09,
            "bloomScale": 5,
            "brightness": 5,
            "blur": 0,
            "quality": 4
        },
        "particles": {
            "enabled": true,
            "blendMode": 1,
            "maskThreshold": 0.43,
            "maskInfluence": 5,
            "particleTexture": "modules/map-shine/assets/flame.webp",
            "frequency": 0.005,
            "lifetime": {
                "min": 0.1,
                "max": 2
            },
            "color": {
                "start": "#FFDD88",
                "end": "#ea7500"
            },
            "alpha": {
                "max": 0.15,
                "fadeIn": 0.01,
                "fadeOut": 1
            },
            "scale": {
                "sizeMultiplier": 0.5,
                "start": 0.08,
                "end": 1.41,
                "minMult": 0.95
            },
            "speed": {
                "start": 5,
                "end": 10,
                "minMult": 0.5
            },
            "rotation": {
                "enabled": true,
                "minSpeed": 102,
                "maxSpeed": 170,
                "accel": 20
            },
            "wind": {
                "enabled": false,
                "force": 0,
                "baseSpeed": 0,
                "gustSpeed": 0,
                "gustFrequencyMin": 3,
                "gustFrequencyMax": 8,
                "gustDurationMin": 0.2,
                "gustDurationMax": 0.8,
                "angleChangeFrequencyMin": 5,
                "angleChangeFrequencyMax": 15,
                "angleChangeRange": 20
            }
        }
    },
    "sparks": {
        "worldBasedOnly": false,
        "enabled": true,
        "blendMode": 1,
        "maskThreshold": 0.95,
        "maskInfluence": 1.12,
        "particleTexture": "modules/map-shine/assets/particle.webp",
        "frequency": 0.08,
        "lifetime": {
            "min": 1.5,
            "max": 3
        },
        "color": {
            "start": "#ffdd88",
            "end": "#ff8800"
        },
        "alpha": {
            "max": 1,
            "fadeIn": 0.1,
            "fadeOut": 0.03
        },
        "scale": {
            "sizeMultiplier": 1.55,
            "start": 1,
            "end": 0.1,
            "minMult": 0.5
        },
        "path": {
            "speed": {
                "start": 114,
                "end": 10,
                "minMult": 0.99
            },
            "amplitude": {
                "min": 10,
                "max": 40
            },
            "frequency": {
                "min": 40,
                "max": 80
            },
            "offset": {
                "min": 0,
                "max": 6.28
            },
            "damping": 0.5,
            "angle": {
                "min": -20,
                "max": 20
            },
            "motionBlur": {
                "enabled": true,
                "strength": 0.33,
                "maxLength": 6
            }
        }
    },
    "particleSystems": {
        "enabled": true,
        "globalDensityMultiplier": 1,
        "globalParticleLimit": 1000
    },
    "diagnostic": {
        "enabled": false,
        "showMasks": false,
        "pixelInspector": false,
        "displaySuffix": "fire"
    },
    "ambientLayerZIndex": 250
}

const hexToRgbArray = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [1, 1, 1];
};

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

        return {
            title,
            size,
            domain,
            data
        };
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

        if (!pointsR || pointsR.length !== 4 || !pointsG || pointsG.length !== 4 || !pointsB || pointsB.length !== 4) {
            console.error("MapShine | generateCurveLut received invalid points.", curveData);
            // Return a neutral LUT
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
            const y = Math.pow(1 - t, 3) * p[0].y +
                3 * Math.pow(1 - t, 2) * t * p[1].y +
                3 * (1 - t) * Math.pow(t, 2) * p[2].y +
                Math.pow(t, 3) * p[3].y;
            return Math.round(Math.max(0, Math.min(1, y)) * 255);
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

// =================================================================================
// SECTION 2: CORE SYSTEMS & MANAGERS
// =================================================================================
// Description: The "brains" of the module. These classes manage state, data,
//              and the overall lifecycle of effects.
// ---------------------------------------------------------------------------------

// =================================================================================
// SCENE CHANGE MANAGEMENT
// =================================================================================
// Description: Manages the transition between scenes, including setup and teardown.
// All new functionality needs to consider whether or not it should register itself here
// and this must be the single source of truth for loading and tearing down the effects of this module.
// ---------------------------------------------------------------------------------

class SceneChangeManager {
    static STATES = {
        IDLE: 'IDLE',
        TEARING_DOWN: 'TEARING_DOWN',
        AWAITING_SETUP: 'AWAITING_SETUP',
        SETTING_UP: 'SETTING_UP'
    };

    constructor() {
        this._currentState = SceneChangeManager.STATES.IDLE;
        this._teardownPromise = Promise.resolve(); // Start with a resolved promise for the initial load.
        this._resolveTeardown = null;
        this.transitionOverlay = null;
    }

    initialize() {
        // The promise is already resolved by default, so we don't create a new one here.
        Hooks.on('canvasTearDown', this.handleCanvasTearDown.bind(this));
        Hooks.on('canvasReady', this.handleCanvasReady.bind(this));
        console.log("Map Shine | SceneChangeManager initialized and hooked into canvas events.");
    }

    _createOverlay() {
        if (this.transitionOverlay) return;

        console.log(`[MapShine Transition] Creating overlay element.`);
        this.transitionOverlay = document.createElement('div');
        this.transitionOverlay.id = 'map-shine-scene-transition';

        // Set initial styles for the main container
        Object.assign(this.transitionOverlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'black',
            zIndex: 999999,
            opacity: 0,
            pointerEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Signika, sans-serif',
            color: 'white',
            textAlign: 'center'
        });

        // Inject the HTML structure and CSS
        this.transitionOverlay.innerHTML = `
                        <style>
                            #map-shine-scene-transition .transition-content {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 1rem;
                                max-width: 800px;
                                padding: 2rem;
                                opacity: 0; /* Content starts invisible */
                            }
                            #map-shine-scene-transition .transition-logo {
                                max-width: 300px;
                                max-height: 200px;
                                object-fit: contain;
                                margin-bottom: 1rem;
                            }
                            #map-shine-scene-transition .transition-heading {
                                font-size: 3.5rem;
                                margin: 0;
                                line-height: 1.1;
                                text-shadow: 0 0 10px rgba(0,0,0,0.5);
                            }
                            #map-shine-scene-transition .transition-subheading {
                                font-size: 1.75rem;
                                margin: 0;
                                color: #ccc;
                                font-weight: normal;
                            }
                            #map-shine-scene-transition .transition-scenename {
                                font-size: 1.25rem;
                                margin: 1rem 0 0 0;
                                color: #aaa;
                                font-style: italic;
                                border-top: 1px solid #555;
                                padding-top: 1rem;
                            }
                            #map-shine-scene-transition .transition-description {
                                font-size: 1rem;
                                color: #bbb;
                                margin-top: 1rem;
                                max-width: 60ch; /* Limit line length for readability */
                                line-height: 1.6;
                            }
                            #map-shine-scene-transition .transition-hint {
                                font-size: 0.9rem;
                                color: #aaa;
                                margin-top: 1.5rem;
                                font-style: italic;
                                border-top: 1px solid #444;
                                padding-top: 1rem;
                                max-width: 50ch;
                            }
                            /* NEW STYLES for loading bar */
                            #map-shine-scene-transition .loading-bar-container {
                                position: absolute;
                                bottom: 10vh;
                                left: 50%;
                                transform: translateX(-50%);
                                width: 400px;
                                max-width: 80vw;
                                height: 10px;
                                border: 1px solid rgba(255, 255, 255, 0.5);
                                background-color: rgba(0,0,0,0.5);
                                border-radius: 5px;
                                overflow: hidden;
                                display: none; /* Hidden by default */
                            }
                            #map-shine-scene-transition .loading-bar-fill {
                                width: 0%;
                                height: 100%;
                                background-color: rgba(255, 255, 255, 0.9);
                                transform-origin: left;
                                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                            }
                            #map-shine-scene-transition .transition-status {
                                position: absolute;
                                bottom: calc(10vh + 20px);
                                left: 50%;
                                transform: translateX(-50%);
                                font-size: 1rem;
                                color: #ddd;
                                opacity: 1;
                                display: none; /* Hidden by default */
                            }
                        </style>
                        <div class="transition-content">
                            <img class="transition-logo" src="" style="display: none;">
                            <h1 class="transition-heading" style="display: none;"></h1>
                            <h2 class="transition-subheading" style="display: none;"></h2>
                            <p class="transition-description" style="display: none;"></p>
                            <h3 class="transition-scenename" style="display: none;"></h3>
                            <p class="transition-hint" style="display: none;"></p>
                        </div>
                        <!-- NEW HTML for loading bar -->
                        <div class="loading-bar-container">
                            <div class="loading-bar-fill"></div>
                        </div>
                        <p class="transition-status"></p>
                    `;

        document.body.appendChild(this.transitionOverlay);
    }

    _destroyOverlay() {
        if (!this.transitionOverlay) return;
        console.log(`[MapShine Transition] Destroying overlay element.`);
        this.transitionOverlay.remove();
        this.transitionOverlay = null;
    }

    async fadeOut(config, sceneName) {
        return new Promise(resolve => {
            if (!this.transitionOverlay) {
                console.warn(`[MapShine Transition] FadeOut called but overlay does not exist.`);
                resolve();
                return;
            }

            // --- 1. Populate Content ---
            const content = this.transitionOverlay.querySelector('.transition-content');
            const logo = this.transitionOverlay.querySelector('.transition-logo');
            const heading = this.transitionOverlay.querySelector('.transition-heading');
            const subheading = this.transitionOverlay.querySelector('.transition-subheading');
            const description = this.transitionOverlay.querySelector('.transition-description');
            const hint = this.transitionOverlay.querySelector('.transition-hint');
            const scenenameEl = this.transitionOverlay.querySelector('.transition-scenename');

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

            // --- New Description & Hint Logic ---
            // The main description is always shown if it exists.
            setContent(description, config.staticDescription);

            // The hint is shown optionally.
            if (config.useRandomHint && config.randomHints?.length > 0) {
                const randomIndex = Math.floor(Math.random() * config.randomHints.length);
                const hintText = config.randomHints[randomIndex];
                setContent(hint, hintText);
            } else {
                setContent(hint, ''); // Hide if not used
            }
            // ---------------------

            // --- 2. Animate ---
            const tl = gsap.timeline({
                onComplete: resolve
            });

            tl.to(this.transitionOverlay, {
                opacity: 1,
                duration: config.fadeOutDuration / 2000,
                ease: "power2.in",
                onStart: () => {
                    this.transitionOverlay.style.pointerEvents = 'auto';
                }
            });

            const allContent = [logo, heading, subheading, description, scenenameEl, hint];
            const visibleContent = allContent.filter(el => el && el.style.display !== 'none');

            tl.to(content, {
                    opacity: 1,
                    duration: 0.01
                }) // Make content container visible
                .fromTo(visibleContent, {
                        opacity: 0,
                        y: -20
                    }, // from state
                    {
                        opacity: 1,
                        y: 0,
                        duration: config.fadeOutDuration / 2000,
                        ease: "power2.out",
                        stagger: 0.1
                    } // to state
                );
        });
    }

    async fadeIn(config) {
        return new Promise(resolve => {
            if (!this.transitionOverlay) {
                console.warn(`[MapShine Transition] FadeIn called but overlay does not exist.`);
                resolve();
                return;
            }

            // Combine all content elements into a single query.
            const allContent = this.transitionOverlay.querySelectorAll('.transition-logo, .transition-heading, .transition-subheading, .transition-scenename, .transition-description, .transition-hint');

            const tl = gsap.timeline({
                onComplete: resolve
            });

            // Fade out all content elements together in a single animation.
            tl.to(allContent, {
                opacity: 0,
                duration: config.fadeInDuration / 2500,
                ease: "power2.in"
            });

            // Then fade out the black background.
            tl.to(this.transitionOverlay, {
                opacity: 0,
                duration: config.fadeInDuration / 2000,
                ease: "power2.out",
                onComplete: () => {
                    if (this.transitionOverlay) this.transitionOverlay.style.pointerEvents = 'none';
                }
            }, "<0.2");
        });
    }

    setProgress(progress, message) {
        if (!this.transitionOverlay) return;

        const fillElement = this.transitionOverlay.querySelector('.loading-bar-fill');
        const statusTextElement = this.transitionOverlay.querySelector('.transition-status');
        const statusFadeDuration = 200;

        if (fillElement) {
            const p = Math.min(100, Math.max(0, progress));
            // Animate the progress bar fill for a smoother look
            gsap.to(fillElement, {
                width: `${p}%`,
                duration: 0.2,
                ease: "power2.out"
            });
        }

        if (message && statusTextElement && statusTextElement.innerText !== message) {
            // Fade out, change text, then fade in for a smooth transition.
            gsap.to(statusTextElement, {
                opacity: 0,
                duration: statusFadeDuration / 2000,
                onComplete: () => {
                    if (statusTextElement) {
                        statusTextElement.innerText = message;
                        gsap.to(statusTextElement, {
                            opacity: 1,
                            duration: statusFadeDuration / 2000
                        });
                    }
                }
            });
        }
    }

    async hide() {
        // This isn't a real hide, it just hides the progress bar elements
        // before the main fadeIn animation starts.
        if (this.transitionOverlay) {
            const bar = this.transitionOverlay.querySelector('.loading-bar-container');
            const status = this.transitionOverlay.querySelector('.transition-status');

            // We can do a quick fade out of these elements
            const tl = gsap.timeline();
            tl.to([bar, status], {
                opacity: 0,
                duration: 0.2,
                onComplete: () => {
                    if (bar) bar.style.display = 'none';
                    if (status) status.style.display = 'none';
                }
            });
            await tl;
        }
    }

    async handleCanvasTearDown(canvas) {
        // KILL SWITCH ENGAGED: Halt all illumination-dependent systems.
        game.mapShine.transitionActive = true;
        console.log(`%cSceneChangeManager: Handling canvasTearDown. TRANSITION ACTIVE. Current state: ${this._currentState}`, 'color: #ff0000; font-weight: bold;');

        if (this._currentState !== SceneChangeManager.STATES.IDLE && this._currentState !== SceneChangeManager.STATES.AWAITING_SETUP) {
            console.warn(`Map Shine | Received canvasTearDown while in an unexpected state: ${this._currentState}. Forcing teardown.`);
        }

        this._currentState = SceneChangeManager.STATES.TEARING_DOWN;
        // Create a new, pending promise that the *next* `canvasReady` event will await.
        this._teardownPromise = new Promise(resolve => {
            this._resolveTeardown = resolve;
        });

        try {
            await this._performTeardown(canvas);
        } catch (error) {
            console.error("Map Shine | An error occurred during teardown:", error);
        } finally {
            console.log(`%cSceneChangeManager: Teardown complete. State -> AWAITING_SETUP`, 'color: #ff8c00');
            this._currentState = SceneChangeManager.STATES.AWAITING_SETUP;
            if (this._resolveTeardown) this._resolveTeardown(); // Resolve the promise, allowing the next setup to proceed.
        }
    }

    async handleCanvasReady(canvas) {
        console.log(`%cSceneChangeManager: Handling canvasReady. Current state: ${this._currentState}`, 'color: #00e0ff');

        // This is the gate. It waits until the previous teardown is fully complete.
        // On initial load, this resolves instantly.
        await this._teardownPromise;
        console.log(`%cSceneChangeManager: Teardown promise resolved. Proceeding with setup.`, 'color: #00e0ff');

        this._currentState = SceneChangeManager.STATES.SETTING_UP;

        try {
            await this._performSetup(canvas);
        } catch (error) {
            console.error("Map Shine | An error occurred during setup:", error);
        } finally {
            console.log(`%cSceneChangeManager: Setup complete. State -> IDLE`, 'color: #00e0ff');
            this._currentState = SceneChangeManager.STATES.IDLE;
        }
    }

    async _performTeardown(tornDownCanvas) {
        console.log("Map Shine | SceneChangeManager: Performing teardown...");
        if (!tornDownCanvas?.mapShine) return;

        // Mark canvas as inactive to prevent race conditions with async discovery
        tornDownCanvas.mapShine.isModuleActive = false;

        // Destroy managers that depend on global filters first.
        if (game.mapShine.dynamicExposureManager) {
            game.mapShine.dynamicExposureManager.destroy();
            game.mapShine.dynamicExposureManager = null;
        }
        // Destroy canvas-specific managers that produce textures for other systems.
        if (tornDownCanvas.mapShine.correctedIlluminationManager) {
            tornDownCanvas.mapShine.correctedIlluminationManager.destroy();
            tornDownCanvas.mapShine.correctedIlluminationManager = null;
        }
        // Destroy the canvas-specific lighting manager now, as it also affects global filters.
        if (tornDownCanvas.mapShine.lightingEffectManager) {
            tornDownCanvas.mapShine.lightingEffectManager.destroy();
            tornDownCanvas.mapShine.lightingEffectManager = null;
        }

        // Destroy other global managers.
        if (game.mapShine.pauseEffectManager) {
            game.mapShine.pauseEffectManager.destroy();
            game.mapShine.pauseEffectManager = null;
        }
        if (game.mapShine.combatEffectManager) {
            game.mapShine.combatEffectManager.destroy();
            game.mapShine.combatEffectManager = null;
        }
        if (game.mapShine.fireWindManager) {
            game.mapShine.fireWindManager.destroy();
            game.mapShine.fireWindManager = null;
        }

        // Now, it's safe to tear down the manager that owns the global filters.
        ScreenEffectsManager.tearDown();

        // Reset remaining global managers to a clean state
        game.mapShine.profileManager.reset();
        if (game.mapShine.tokenManager) {
            game.mapShine.tokenManager.destroy();
            game.mapShine.tokenManager = null;
        }
        if (game.mapShine.particleManager) {
            game.mapShine.particleManager.destroy();
            game.mapShine.particleManager = null; // Important to nullify
        }
        if (game.mapShine.geometryMaskManager) {
            game.mapShine.geometryMaskManager.destroy();
            game.mapShine.geometryMaskManager = null;
        }

        // Destroy remaining canvas-specific managers
        tornDownCanvas.mapShine.ambientMaskManager?.destroy();
        tornDownCanvas.mapShine.tokenMaskManager?.destroy();

        // Clean up any remaining canvas-specific data
        if (tornDownCanvas.mapShine._debugTicker) {
            tornDownCanvas.app.ticker.remove(tornDownCanvas.mapShine._debugTicker);
        }
        if (tornDownCanvas.mapShine.tokenMaskDebugSprite) {
            tornDownCanvas.mapShine.tokenMaskDebugSprite.destroy();
        }
        tornDownCanvas.mapShine = null;

        console.log("Map Shine | SceneChangeManager: Teardown finished.");
    }

    /**
     * Waits for the Illumination Buffer module to be ready and its texture to match the current canvas size.
     * @param {Canvas} canvas - The current canvas object.
     * @returns {Promise<boolean>} A promise that resolves to true if dependencies are ready, false otherwise.
     */
    async _waitForDependencies(canvas) {
        const MAX_ATTEMPTS = 50; // 50 * 100ms = 5 seconds timeout
        const CHECK_INTERVAL = 100; // 100ms

        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
            if (!illuminationAPI) {
                // If the module isn't active, we can proceed without it immediately.
                console.log("Map Shine | Illumination Buffer module not active. Proceeding without light-aware features.");
                return false;
            }

            const illuminationTexture = illuminationAPI.getLightingTexture();
            const screen = canvas.app.renderer.screen;

            if (illuminationTexture && illuminationTexture.valid &&
                illuminationTexture.width === Math.round(screen.width) &&
                illuminationTexture.height === Math.round(screen.height)) {
                console.log(`%cMap Shine | Dependency Check PASSED on attempt #${i + 1}: Illumination Buffer is ready.`, 'color: #4CAF50;');
                return true;
            }

            if (i === 0) {
                console.log("Map Shine | Dependency Check: Waiting for Illumination Buffer to stabilize...");
            }

            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        }

        console.warn("Map Shine | Dependency Check FAILED: Illumination Buffer did not become ready in time. Proceeding with a minimal setup.");
        return false;
    }

    async _performSetup(canvas) {
        console.log("Map Shine | SceneChangeManager: Performing setup...");
        if (!canvas.scene) return;

        game.mapShine.systemsReady = false;

        // Initialize a new mapShine object on the new canvas
        canvas.mapShine = {
            isModuleActive: true
        };

        // Define a manager to orchestrate the loading screen progress and messages.
        game.mapShine.loadingManager = {
            screen: null,
            waypoints: {
                START: 0,
                DEPENDENCIES_START: 5,
                DEPENDENCIES_END: 15,
                DISCOVERY_START: 20,
                DISCOVERY_END: 40,
                SETUP_START: 45,
                PROFILES_INIT: 50,
                CONFIG_FINALIZE: 55,
                LAYERS_UPDATE: 65,
                SCREEN_FX_INIT: 75,
                MANAGERS_INIT: 85,
                CANVAS_MANAGERS_INIT: 95,
                SETUP_COMPLETE: 100
            },
            messages: {
                START: "Initializing...",
                DEPENDENCIES_START: "Waiting for dependencies...",
                DEPENDENCIES_END: "Dependencies ready.",
                DISCOVERY_START: "Discovering effect maps...",
                DISCOVERY_END: "Effect maps found.",
                SETUP_START: "Configuring effects...",
                PROFILES_INIT: "Loading profiles...",
                CONFIG_FINALIZE: "Finalizing configuration...",
                LAYERS_UPDATE: "Updating effect layers...",
                SCREEN_FX_INIT: "Initializing screen effects...",
                MANAGERS_INIT: "Initializing system managers...",
                CANVAS_MANAGERS_INIT: "Initializing canvas managers...",
                SETUP_COMPLETE: "Finalizing scene..."
            },
            setProgress(waypoint) {
                if (this.screen) {
                    this.screen.setProgress(this.waypoints[waypoint], this.messages[waypoint]);
                }
            },
            async tick(waypoint) {
                if (this.screen) {
                    this.screen.setProgress(this.waypoints[waypoint], this.messages[waypoint]);
                    // Yield to the event loop, allowing the browser to repaint.
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        };

        // If a transition overlay is active from a scene change, use IT as the loading screen.
        // Otherwise, fall back to the standalone LoadingScreen class.
        if (this.transitionOverlay) {
            game.mapShine.loadingScreen = this; // The SceneChangeManager instance now acts as the loading screen.
            game.mapShine.loadingManager.screen = this;
            // Explicitly show the progress bar elements on the transition overlay
            const bar = this.transitionOverlay.querySelector('.loading-bar-container');
            const status = this.transitionOverlay.querySelector('.transition-status');
            if (bar) bar.style.display = 'block';
            if (status) status.style.display = 'block';
        } else {
            const disableLoadingScreen = game.settings.get(MODULE_ID, 'disable-loading-screen');
            if (!disableLoadingScreen && !game.mapShine.loadingScreen) {
                try {
                    game.mapShine.loadingScreen = new LoadingScreen();
                    game.mapShine.loadingScreen.show();
                    game.mapShine.loadingManager.screen = game.mapShine.loadingScreen;
                } catch (err) {
                    console.error("Map Shine | Failed to show loading screen:", err);
                    game.mapShine.loadingScreen = null;
                }
            }
        }

        game.mapShine.loadingManager.setProgress('START');

        // Wait for dependencies like the Illumination Buffer to be ready before proceeding.
        await game.mapShine.loadingManager.tick('DEPENDENCIES_START');
        const dependenciesReady = await this._waitForDependencies(canvas);
        await game.mapShine.loadingManager.tick('DEPENDENCIES_END');

        // --- DEFERRED SETUP ---
        // We wrap the entire discovery and setup process in a requestAnimationFrame.
        // This ensures the canvas has completed its initial render cycle and all transforms are stable
        // before we attempt to initialize geometry-dependent systems like the particle masks.
        await new Promise(resolve => {
            requestAnimationFrame(async () => {
                if (!canvas.mapShine?.isModuleActive) {
                    resolve(); // Abort if canvas was torn down during the frame delay
                    return;
                }

                if (dependenciesReady) {
                    await MapShineLifecycle.beginPersistentDiscovery(canvas);
                } else {
                    console.log("Map Shine | Running setup without light-aware features due to dependency check failure.");
                    await MapShineLifecycle.beginPersistentDiscovery(canvas);
                }

                resolve(); // Signal that the deferred setup is complete.
            });
        });
    }

}

class MapShineLifecycle {
    // onCanvasReady and onCanvasTearDown are removed as their roles are now taken by SceneChangeManager.

    static async beginPersistentDiscovery(canvas, attempt = 1, maxAttempts = 5) {
        if (!canvas?.scene || !canvas.mapShine?.isModuleActive) {
            console.log("Map Shine | Discovery aborted, canvas is no longer active.");
            return;
        }

        if (attempt > maxAttempts) {
            console.warn(`Map Shine | Texture discovery failed after ${maxAttempts} attempts. No effect maps found.`);
            if (game.mapShine.loadingScreen) {
                await game.mapShine.loadingScreen.hide();
                game.mapShine.loadingScreen = null;
                if (game.mapShine.loadingManager) game.mapShine.loadingManager.screen = null;
            }
            this.runMinimalSetup(canvas);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, attempt === 1 ? 100 : 250));

        if (game.mapShine.loadingManager) {
            const message = attempt > 1 ? `Discovering effect maps (Attempt ${attempt})...` : game.mapShine.loadingManager.messages.DISCOVERY_START;
            game.mapShine.loadingManager.screen?.setProgress(game.mapShine.loadingManager.waypoints.DISCOVERY_START, message);
        }

        await game.mapShine.effectTargetManager.refresh();
        const targets = game.mapShine.effectTargetManager.targets;
        const hasBackgroundTarget = targets.background && Object.values(targets.background).some(v => v && typeof v === 'string');
        const hasTileTargets = Array.from(targets.tiles.values()).length > 0;

        if (hasBackgroundTarget || hasTileTargets) {
            console.log(`Map Shine | Texture discovery successful on attempt #${attempt}. Initializing all systems.`);
            game.mapShine.loadingManager?.setProgress('DISCOVERY_END');
            this.runFullSetup(canvas);
        } else {
            console.log(`Map Shine | Texture discovery attempt #${attempt} found no targets. Retrying...`);
            MapShineLifecycle.beginPersistentDiscovery(canvas, attempt + 1, maxAttempts);
        }
    }

    static async runFullSetup(canvas) {
        const loadingScreen = game.mapShine.loadingScreen;
        const loadingManager = game.mapShine.loadingManager;

        await loadingManager?.tick('SETUP_START');

        // 1. Initialize the profile manager with whatever is saved for the scene.
        game.mapShine.profileManager.initializeForScene();
        await loadingManager?.tick('PROFILES_INIT');

        if (!game.mapShine.fireWindManager) {
            game.mapShine.fireWindManager = new FireWindManager();
        }
        // Update the wind manager with the finalized, time-scaled configuration
        game.mapShine.fireWindManager.updateFromConfig(game.mapShine.profileManager.activeConfig.fire.particles.wind);

        // 3. (NEW) Finalize the configuration based on discovered textures.
        this.finalizeConfigurationAndUI();
        await loadingManager?.tick('CONFIG_FINALIZE');

        // 5. NOW we broadcast the finalized configuration to all systems.
        const config = game.mapShine.profileManager.activeConfig;
        for (const layer of canvas.layers) {
            if (layer instanceof ParticleLayer) continue; // Skip the particle layer
            if (typeof layer.updateFromConfig === 'function') {
                try {
                    await layer.updateFromConfig(config);
                } catch (e) {
                    console.error(`MapShine | Error updating layer ${layer.constructor.name}`, e);
                }
            }
        }
        ScreenEffectsManager.updateAllFiltersFromConfig(config);
        await loadingManager?.tick('LAYERS_UPDATE');

        // 6. Initialize the global screen filters.
        ScreenEffectsManager.initialize(canvas.stage);
        ScreenEffectsManager.setupAllGlobalFilters();
        ScreenEffectsManager.updateAllFiltersFromConfig(game.mapShine.profileManager.activeConfig);
        await loadingManager?.tick('SCREEN_FX_INIT');

        if (!game.mapShine.tokenManager) game.mapShine.tokenManager = new TokenManager();
        game.mapShine.tokenManager.initialize();

        if (!game.mapShine.dynamicExposureManager) game.mapShine.dynamicExposureManager = new DynamicExposureManager();
        game.mapShine.dynamicExposureManager.initialize();

        if (game.mapShine.pauseEffectManager) {
            game.mapShine.pauseEffectManager.initialize();
        }

        if (game.mapShine.combatEffectManager) {
            game.mapShine.combatEffectManager.initialize();
        }

        if (!game.mapShine.geometryMaskManager) {
            game.mapShine.geometryMaskManager = new GeometryMaskManager();
        }
        game.mapShine.geometryMaskManager.initialize();
        await loadingManager?.tick('MANAGERS_INIT');

        // 6. (NEW) Update the UI controls to reflect the finalized configuration.
        if (game.mapShine.debugger) {
            game.mapShine.debugger.eventHandler.updateAllControls();
        }

        // 7. Initialize canvas-specific managers.
        canvas.mapShine.correctedIlluminationManager = new CorrectedIlluminationManager(canvas);
        canvas.mapShine.lightingEffectManager = new LightingEffectManager(canvas);
        canvas.mapShine.ambientMaskManager = new AmbientMaskManager(canvas);
        canvas.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas);
        await loadingManager?.tick('CANVAS_MANAGERS_INIT');

        // 8. Hide the loading screen.
        if (loadingScreen) {
            await loadingManager?.tick('SETUP_COMPLETE');
            await loadingScreen.hide();
            game.mapShine.loadingScreen = null;
            if (game.mapShine.loadingManager) game.mapShine.loadingManager.screen = null;
        }

        game.mapShine.systemsReady = true;

        // Signal to the scene transition manager that the main setup is complete.
        if (game.mapShine.resolveSetupCompletion) {
            console.log("Map Shine | Signaling full setup completion to scene transition.");
            game.mapShine.resolveSetupCompletion();
        }

        // After everything is set up, wait a short period before activating the lighting manager
        // to ensure the illumination buffer has stabilized for the new scene.
        setTimeout(() => {
            // Check if the canvas and its managers still exist, as a teardown could have occurred during the timeout.
            if (canvas.mapShine?.lightingEffectManager && !canvas.mapShine.lightingEffectManager._destroyed) {
                console.log("%cMap Shine | Activating LightingEffectManager after delay.", 'color: #4CAF50;');
                canvas.mapShine.lightingEffectManager.isReady = true;
            }
        }, 200);

        // KILL SWITCH DISENGAGED: Re-enable illumination-dependent systems.
        game.mapShine.transitionActive = false;
        console.log(`%cMap Shine | Setup complete. TRANSITION INACTIVE.`, 'color: #4CAF50; font-weight: bold;');
    }

    static async runMinimalSetup(canvas) {
        game.mapShine.profileManager.initializeForScene();
        await game.mapShine.profileManager.updateAllSystemsFromConfig();
        ScreenEffectsManager.initialize(canvas.stage);
        ScreenEffectsManager.setupAllGlobalFilters();
        ScreenEffectsManager.updateAllFiltersFromConfig(game.mapShine.profileManager.activeConfig);

        // Signal to the scene transition manager that setup is complete.
        if (game.mapShine.resolveSetupCompletion) {
            console.log("Map Shine | Signaling minimal setup completion to scene transition.");
            game.mapShine.resolveSetupCompletion();
        }

        // KILL SWITCH DISENGAGED (also for minimal setup)
        game.mapShine.transitionActive = false;
        console.log(`%cMap Shine | Minimal setup complete. TRANSITION INACTIVE.`, 'color: #4CAF50; font-weight: bold;');
    }

    static finalizeConfigurationAndUI() {
        console.log("Map Shine | Finalizing configuration based on available textures.");

        const EFFECT_TEXTURE_MAP = {
            baseShine: 'specular',
            cloudShadows: 'outdoors',
            canopy: 'canopy',
            structuralShadows: 'structural',
            iridescence: 'iridescence',
            ambient: 'ambient',
            groundGlow: 'groundGlow',
            heatDistortion: 'heat',
            prism: 'prism',
            dust: 'dust',
            glint: 'prism',
            fire: 'fire',
            sparks: 'sparks',
        };

        const targets = game.mapShine.effectTargetManager.targets;
        const allTargets = [
            targets.background,
            ...targets.tiles.values()
        ].filter(Boolean);
        const config = game.mapShine.profileManager.activeConfig;
        const handler = game.mapShine.debugger?.eventHandler;

        // --- Adjust effect enablement based on texture availability ---
        for (const [effectKey, textureKey] of Object.entries(EFFECT_TEXTURE_MAP)) {
            const hasTexture = allTargets.some(target => target[textureKey]);
            const path = `${effectKey}.enabled`;
            const currentSetting = foundry.utils.getProperty(config, path);
            const defaultSetting = foundry.utils.getProperty(MODULE_DEFAULTS, path); // Get original default from MODULE_DEFAULTS

            let newSetting = currentSetting; // Start with the current state

            if (hasTexture && defaultSetting === false && currentSetting === false) {
                // Scenario: Texture found, default is OFF, and it's currently OFF.
                // Action: Automatically ENABLE the effect.
                newSetting = true;
                console.log(`Map Shine | Effect '${effectKey}' auto-enabled: '${textureKey}' texture found.`);
            } else if (!hasTexture && currentSetting === true) {
                // Scenario: Texture is missing AND the effect is currently enabled.
                // Action: Automatically DISABLE the effect.
                newSetting = false;
                console.log(`Map Shine | Effect '${effectKey}' auto-disabled: No '${textureKey}' texture found.`);
            }
            // Other scenarios:
            // - hasTexture && defaultSetting === true && currentSetting === true (no change, already enabled)
            // - hasTexture && defaultSetting === false && currentSetting === true (user enabled it, keep it enabled)
            // - !hasTexture && defaultSetting === false && currentSetting === false (no change, already disabled)

            // Only update the config if the setting has actually changed
            if (newSetting !== currentSetting) {
                foundry.utils.setProperty(config, path, newSetting);
            }

            // Update the UI availability regardless of the config setting.
            // This ensures the UI accurately reflects whether a texture exists to power the effect.
            handler?.setEffectAvailability(effectKey, hasTexture);
        }
    }
}

class SystemStatusManager {
    constructor() {
        if (SystemStatusManager._instance) {
            return SystemStatusManager._instance;
        }
        SystemStatusManager._instance = this;

        this._callbacks = {};
        this._state = {
            shaders: {
                baseShine: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                noise: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                bloom: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                iridescence: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                prism: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                heat: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                cloudShadows: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                structuralShadows: {
                    state: 'unknown',
                    message: 'Not yet compiled.'
                },
                postProcessing: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                },
                internal: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                },
                debug: {
                    state: 'unknown',
                    message: 'Not yet initialized.'
                }
            },
            textures: {
                specular: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                ambient: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                iridescence: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                groundGlow: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                heat: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                fire: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                sparks: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                dust: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                outdoors: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                canopy: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                structural: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                prism: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                water: {
                    state: 'inactive',
                    message: 'No path specified.'
                },
                shoreline: {
                    state: 'inactive',
                    message: 'No path specified.'
                }
            },
            pipelines: {
                noiseToShine: {
                    state: 'inactive',
                    message: 'Pipeline inactive.'
                },
            },
        };
    }

    static get instance() {
        if (!SystemStatusManager._instance) {
            new SystemStatusManager();
        }
        return SystemStatusManager._instance;
    }

    on(event, callback) {
        if (!this._callbacks[event]) {
            this._callbacks[event] = [];
        }
        this._callbacks[event].push(callback);
    }

    off(event, callback) {

        if (!this._callbacks[event]) {
            return;
        }

        this._callbacks[event] = this._callbacks[event].filter(cb => cb !== callback);
    }

    emit(event, ...args) {
        if (this._callbacks[event]) {
            this._callbacks[event].forEach(callback => callback(...args));
        }
    }

    update(category, key, statusObject) {
        if (this._state[category] && this._state[category][key]) {
            this._state[category][key] = statusObject;
            this.emit('statusChanged', category, key, statusObject);
        } else {
            console.warn(`SystemStatusManager | Attempted to update non-existent status: ${category}.${key}`);
        }
    }

    getStatus(category, key) {
        return this._state[category]?.[key] || {
            state: 'error',
            message: 'Status key not found.'
        };
    }

    getAllStatuses() {
        return this._state;
    }

    evaluatePipelines() {
        if (!OVERLAY_CONFIG.baseShine.noise.enabled) {
            this.update('pipelines', 'noiseToShine', {
                state: 'disabled',
                message: 'Noise mask is disabled by user.'
            });
        } else if (this.getStatus('shaders', 'noise').state !== 'ok') {
            this.update('pipelines', 'noiseToShine', {
                state: 'error',
                message: 'Pipeline broken: Noise shader failed to compile.'
            });
        } else {
            this.update('pipelines', 'noiseToShine', {
                state: 'ok',
                message: 'Pipeline active: Noise mask is modulating the shine pattern.'
            });
        }
    }
}

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
        console.log("Map Shine | TokenManager initialized.");
    }

    destroy() {
        Hooks.off('controlToken', this._boundOnControlToken);
        Hooks.off('updateUser', this._boundOnUpdateUser);
        this.activeToken = null;
    }

    _onControlToken(token, controlled) {
        // This hook is sufficient for both GM and player cases where they select/deselect tokens.
        this._updateActiveToken();
    }

    _onUpdateUser(user, data) {
        // If the current user's character changes, re-evaluate.
        if (user.id === game.user.id && "character" in data) {
            this._updateActiveToken();
        }
    }

    _updateActiveToken() {
        // For players, prioritize controlled tokens. If none, fall back to their assigned character if it's on the scene.
        if (!game.user.isGM) {
            const controlled = canvas.tokens.controlled;
            if (controlled.length > 0) {
                this.activeToken = controlled[0]; // Use the first controlled token
            } else if (game.user.character && game.user.character.rendered) {
                this.activeToken = game.user.character.object;
            } else {
                this.activeToken = null;
            }
        } else {
            // For GMs, it's simply the first token in the controlled set.
            const controlled = canvas.tokens.controlled;
            this.activeToken = controlled.length > 0 ? controlled[0] : null;
        }

        Hooks.callAll('mapShine:activeTokenChanged', this.activeToken);
    }

    getActiveToken() {
        // Ensure the token is still valid on the canvas
        if (this.activeToken && this.activeToken.object?.destroyed === false) {
            return this.activeToken;
        }
        // If the stored token is no longer valid, try to find a new one.
        this._updateActiveToken();
        return this.activeToken;
    }
}

class MapPointsManager {

    static FLAG_NAME = "mapPointGroups";

    /**
     * Retrieves all map point groups from the current scene.
     * @returns {object} The object containing all point groups, or an empty object if none exist.
     */
    static getGroups() {
        if (!canvas.scene?.id) {
            // This is a genuine error state we should still check for.
            console.error("MapShine | FATAL: MapPointsManager.getGroups() was called but canvas.scene is not fully available.");
            return {};
        }

        // This call might return 'undefined' on initial load before flags are ready.
        const groupsData = canvas.scene.getFlag(MODULE_ID, this.FLAG_NAME);

        // Return the data if it exists, otherwise return an empty object.
        // This prevents the system from crashing if the data isn't ready yet.
        return groupsData ?? {};
    }

    /**
     * Retrieves a single map point group by its ID.
     * @param {string} groupId The ID of the group to retrieve.
     * @returns {object|undefined} The group object, or undefined if not found.
     */
    static getGroup(groupId) {
        const groups = this.getGroups();
        return groups[groupId];
    }

    /**
     * Creates a new, empty group for map points.
     * @param {object} [options={}] Options for the new group.
     * @param {string} [options.label="New Group"] A user-friendly label for the group.
     * @param {string} [options.type="point"] The type of group ('point', 'line', 'area').
     * @returns {Promise<string>} The ID of the newly created group.
     */
    static async createGroup({
        label = "New Group",
        type = "point"
    } = {}) {
        if (!game.user.isGM) {
            ui.notifications.warn("You do not have permission to create map point groups.");
            return null;
        }
        const groupId = foundry.utils.randomID();
        const newGroup = {
            id: groupId,
            label: label,
            type: type,
            points: [],
            isBroken: false,
            reason: "",
            isEffectSource: false,
            effectTarget: ""
        };

        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        await canvas.scene.update({
            [path]: newGroup
        });
        Hooks.callAll("mapShine:mapPointsUpdated");
        return groupId;
    }

    static async updateGroupProperties(groupId, properties) {
        if (!game.user.isGM) return; // No warning needed for rapid changes.

        const group = this.getGroup(groupId);
        if (!group) {
            console.warn(`MapPointsManager | Cannot update properties for non-existent group "${groupId}".`);
            return;
        }

        const updateData = {};
        if ("isEffectSource" in properties) {
            updateData[`flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}.isEffectSource`] = properties.isEffectSource;
        }
        if ("effectTarget" in properties) {
            updateData[`flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}.effectTarget`] = properties.effectTarget;
        }

        if (!foundry.utils.isEmpty(updateData)) {
            await canvas.scene.update(updateData, {
                diff: false
            });
            Hooks.callAll("mapShine:mapPointsUpdated");
        }
    }

    static async deleteGroup(groupId) {
        if (!game.user.isGM) {
            ui.notifications.warn("You do not have permission to delete map point groups.");
            return;
        }
        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.-=${groupId}`;
        await canvas.scene.update({
            [path]: null
        });

        // If the deleted group was the active one, clear it
        if (game.mapShine.activeMapPointGroup === groupId) {
            game.mapShine.activeMapPointGroup = null;
        }
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    static async addPoint(groupId, point) {
        if (!game.user.isGM) return; // No warning needed for rapid changes like adding points.

        console.log(`MapShine | MapPointsManager: Attempting to add point to group "${groupId}".`, point);
        const group = this.getGroup(groupId);
        if (!group) {
            console.warn(`MapPointsManager | Cannot add point to non-existent group "${groupId}".`);
            return;
        }

        const newPoints = [...group.points, point];
        const updatedGroup = this.validate({
            ...group,
            points: newPoints
        });

        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        console.log(`MapShine | MapPointsManager: Updating scene with path "${path}".`);
        await canvas.scene.update({
            [path]: updatedGroup
        });
        console.log(`MapShine | MapPointsManager: Scene update complete. Calling hook.`);
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    static async updatePoint(groupId, pointIndex, newPosition) {
        if (!game.user.isGM) return; // No warning needed for rapid changes.

        const group = this.getGroup(groupId);
        if (!group || !group.points[pointIndex]) {
            console.warn(`MapPointsManager | Cannot update point at index ${pointIndex} in non-existent group "${groupId}".`);
            return;
        }

        const newPoints = [...group.points];
        newPoints[pointIndex] = newPosition;
        const updatedGroup = this.validate({
            ...group,
            points: newPoints
        });

        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        await canvas.scene.update({
            [path]: updatedGroup
        });
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    static async deletePoint(groupId, pointIndex) {
        if (!game.user.isGM) return; // No warning.

        const group = this.getGroup(groupId);
        if (!group) return;

        const newPoints = [...group.points];
        newPoints.splice(pointIndex, 1);
        const updatedGroup = this.validate({
            ...group,
            points: newPoints
        });

        const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
        await canvas.scene.update({
            [path]: updatedGroup
        });
        Hooks.callAll("mapShine:mapPointsUpdated");
    }

    /**
     * Validates a group, primarily checking for self-intersections in polygons.
     * @param {object} group The group object to validate.
     * @returns {object} The group object with updated 'isBroken' and 'reason' fields.
     */
    static validate(group) {
        if (group.type !== 'area' || group.points.length < 4) {
            group.isBroken = false;
            group.reason = "";
            return group;
        }

        const points = group.points;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length]; // Next point, wraps around

            // Check against all non-adjacent segments
            for (let j = i + 2; j < points.length; j++) {
                // Skip the segment that connects back to the start
                if (i === 0 && j === points.length - 1) continue;

                const p3 = points[j];
                const p4 = points[(j + 1) % points.length];

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

    /**
     * Checks if two line segments intersect.
     * @param {{x,y}} p1 - Start of line 1
     * @param {{x,y}} p2 - End of line 1
     * @param {{x,y}} p3 - Start of line 2
     * @param {{x,y}} p4 - End of line 2
     * @returns {boolean} True if they intersect, false otherwise.
     */
    static _checkIntersection(p1, p2, p3, p4) {
        const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
        if (den === 0) return false; // Parallel or collinear

        const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
        const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;

        return t > 0 && t < 1 && u > 0 && u < 1;
    }
}

class GeometryMaskManager {
    constructor() {
        this.renderer = canvas.app?.renderer;
        this.masks = new Map(); // Key: effectTarget, Value: { texture: PIXI.RenderTexture, graphics: PIXI.Graphics }
        this._needsUpdate = true;
        this._destroyed = false;
        this._mapPointsInitialized = false; // Flag to ensure the initial point discovery runs only once.

        this._boundOnMapPointsUpdated = this.requestUpdate.bind(this);
        this._boundOnPan = this.requestUpdate.bind(this);
        this._boundOnResize = this._onResize.bind(this);
    }

    initialize() {
        if (!this.renderer) {
            console.error("GeometryMaskManager | Cannot initialize without a renderer.");
            return;
        }

        // Reset the flag for each new scene to allow the initialization poll to run again.
        this._mapPointsInitialized = false;

        const screen = this.renderer.screen;

        for (const effectKey of Object.keys(EFFECT_SOURCE_OPTIONS)) {
            if (!effectKey) continue; // Skip the "None" option

            const renderTexture = PIXI.RenderTexture.create({
                width: screen.width,
                height: screen.height,
            });
            const graphics = new PIXI.Graphics();

            this.masks.set(effectKey, {
                texture: renderTexture,
                graphics
            });
        }

        Hooks.on("mapShine:mapPointsUpdated", this._boundOnMapPointsUpdated);
        Hooks.on("canvasPan", this._boundOnPan);
        window.addEventListener('resize', this._boundOnResize);

        this.requestUpdate();
        console.log(`Map Shine | GeometryMaskManager initialized with ${this.masks.size} mask targets.`);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;

        Hooks.off("mapShine:mapPointsUpdated", this._boundOnMapPointsUpdated);
        Hooks.off("canvasPan", this._boundOnPan);
        window.removeEventListener('resize', this._boundOnResize);

        for (const {
                texture,
                graphics
            }
            of this.masks.values()) {
            texture.destroy(true);
            graphics.destroy();
        }
        this.masks.clear();
        console.log("Map Shine | GeometryMaskManager destroyed.");
    }

    requestUpdate() {
        this._needsUpdate = true;
    }

    _onResize() {
        if (!this.renderer) return;
        const screen = this.renderer.screen;
        for (const {
                texture
            }
            of this.masks.values()) {
            texture.resize(screen.width, screen.height);
        }
        this.requestUpdate();
    }

    update() {
        // --- ROBUST INITIALIZATION POLLING ---
        // This block runs on every frame until it can confirm that the scene's flag data for map points has been loaded.
        if (!this._mapPointsInitialized) {
            const groupsData = canvas.scene.getFlag(MODULE_ID, MapPointsManager.FLAG_NAME);

            // The condition to proceed is that the flag data is no longer `undefined`.
            // `undefined` means the data hasn't been loaded from the DB yet.
            // An empty object `{}` means it has loaded, and there are no points.
            if (groupsData !== undefined) {
                // We have a definitive answer from the database, so we can stop polling.
                this._mapPointsInitialized = true;

                // Now, check if there are actually any points to render.
                if (!foundry.utils.isEmpty(groupsData)) {
                    console.log(`Map Shine | GeometryMaskManager has detected Map Points data. Scheduling initial render and particle notification.`);

                    // 1. Render the masks with the new data.
                    this._renderAllMasks();
                    this._needsUpdate = false; // We just updated.

                    // 2. Defer the notification to the next animation frame to ensure the GPU has processed the render.
                    requestAnimationFrame(() => {
                        if (this._destroyed) return; // Don't notify if the manager was torn down during the frame.

                        console.log(`Map Shine | Post-render frame: Notifying particle systems that masks are ready.`);
                        // Notify the particle system so it can create the emitters.
                        Hooks.callAll("mapShine:mapPointsUpdated");
                    });
                }
            }
        }
        // --- END POLLING ---

        // This is the standard update path for subsequent changes (e.g., panning, resizing, editing points).
        if (!this._needsUpdate || this._destroyed) return;

        this._renderAllMasks();
        this._needsUpdate = false;
    }

    _renderAllMasks() {
        // Clear all graphics objects first
        for (const {
                graphics
            }
            of this.masks.values()) {
            graphics.clear();
        }

        const groups = MapPointsManager.getGroups();
        if (foundry.utils.isEmpty(groups)) return;

        // Populate graphics objects based on point groups
        for (const group of Object.values(groups)) {
            if (!group.isEffectSource || !group.effectTarget || !this.masks.has(group.effectTarget)) {
                continue;
            }

            const {
                graphics
            } = this.masks.get(group.effectTarget);
            const pointRadius = 16; // World-space radius for point sources
            const lineThickness = 24; // World-space thickness for line sources

            switch (group.type) {
                case 'point':
                    graphics.beginFill(0xFFFFFF);
                    for (const p of group.points) {
                        graphics.drawCircle(p.x, p.y, pointRadius);
                    }
                    graphics.endFill();
                    break;
                case 'line':
                    graphics.lineStyle({
                        width: lineThickness,
                        color: 0xFFFFFF,
                        cap: PIXI.LINE_CAP.ROUND
                    });
                    if (group.points.length > 0) {
                        graphics.moveTo(group.points[0].x, group.points[0].y);
                        for (let i = 1; i < group.points.length; i++) {
                            graphics.lineTo(group.points[i].x, group.points[i].y);
                        }
                    }
                    graphics.lineStyle({
                        width: 0
                    }); // Reset line style
                    break;
                case 'area':
                    if (group.points.length > 2 && !group.isBroken) {
                        graphics.beginFill(0xFFFFFF);
                        graphics.drawPolygon(group.points);
                        graphics.endFill();
                    }
                    break;
            }
        }

        // Render each graphics object to its texture
        for (const {
                graphics,
                texture
            }
            of this.masks.values()) {
            const renderContainer = new PIXI.Container();
            renderContainer.addChild(graphics);

            // Apply the world-to-screen transformation directly to the container.
            // This pre-transforms our world-space geometry for the renderer.
            renderContainer.transform.setFromMatrix(canvas.stage.transform.worldTransform);

            // Render the pre-transformed container without a separate transform option.
            this.renderer.render(renderContainer, {
                renderTexture: texture,
                clear: true,
            });

            // Clean up the temporary container.
            renderContainer.removeChild(graphics);
            renderContainer.destroy();
        }
    }

    /**
     * Retrieves a generated mask for a specific effect.
     * @param {string} effectKey The key of the effect (e.g., 'sparks').
     * @returns {PIXI.RenderTexture | null} The mask texture, or null if not found.
     */
    getMask(effectKey) {
        return this.masks.get(effectKey)?.texture || null;
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

class CorrectedIlluminationManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = canvas.app.renderer;
        const screen = this.renderer.screen;

        this.renderTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height,
        });

        this.filter = new CorrectedIlluminationFilter();
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.sourceSprite.filters = [this.filter];

        this._destroyed = false;

        // No ticker needed; this manager will be updated manually by LightingEffectManager
        // to ensure correct render order.
    }

    update() {
        if (this._destroyed) return;

        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        if (!illuminationAPI) return;

        const illuminationTexture = illuminationAPI.getLightingTexture();
        if (!illuminationTexture?.valid) return;

        const cloudLayer = this.canvas.layers.find(l => l instanceof CloudShadowsLayer);
        // An outdoors mask is considered valid if the layer has discovered any source textures for it.
        const hasOutdoorsMask = cloudLayer?.maskSprites.size > 0;

        // If an outdoors mask exists and the scene has global light, perform the correction.
        if (hasOutdoorsMask && this.canvas.scene.globalLight) {
            const outdoorsMask = cloudLayer.getMaskTexture();
            if (!outdoorsMask?.valid) return;

            this.filter.enabled = true;
            const u = this.filter.uniforms;
            u.uIlluminationBuffer = illuminationTexture;
            u.uOutdoorsMask = outdoorsMask;
            u.uHasGlobalIllumination = this.canvas.scene.globalLight;
            u.uSunlightColor = this.canvas.scene.environment.sunlightColor;

            this.renderer.render(this.sourceSprite, {
                renderTexture: this.renderTexture,
                clear: true,
            });
        } else {
            // Otherwise, just copy the original illumination buffer directly.
            // This is more efficient than running a disabled filter and handles the "no mask" case.
            this.renderer.render(illuminationTexture, {
                renderTexture: this.renderTexture,
                clear: true,
            });
        }
    }

    getCorrectedTexture() {
        return this.renderTexture;
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;

        this.renderTexture?.destroy(true);
        this.filter?.destroy();
        this.sourceSprite?.destroy();
    }
}

class DynamicExposureManager {
    constructor() {
        this.tokenManager = game.mapShine.tokenManager;

        // State
        this.isInitialized = false;
        this.isIndoors = null; // null, true, or false
        this.lastTriggerTimestamp = 0;
        this.dazzleAnimation = null;
        this.activeTokenId = null;

        // Effect parameters (will be loaded from config)
        this.config = {};

        // PIXI Objects
        this.ccFilter = null;
    }

    initialize() {
        if (this.isInitialized) return;

        this.ccFilter = ScreenEffectsManager.getFilter('colorCorrection');
        if (!this.ccFilter) {
            console.error("Map Shine | DynamicExposureManager: Could not find ColorCorrectionFilter.");
            return;
        }

        // Ensure the uniform exists on the filter
        if (this.ccFilter.uniforms.uDynamicExposureBoost === undefined) {
            this.ccFilter.uniforms.uDynamicExposureBoost = 0.0;
        }

        // Bind hooks
        this._boundOnControlToken = this._onControlToken.bind(this);
        this._boundOnUpdateToken = this._onUpdateToken.bind(this);
        Hooks.on('controlToken', this._boundOnControlToken);
        Hooks.on('updateToken', this._boundOnUpdateToken);

        this.isInitialized = true;

        // Perform an initial check on the currently controlled token, if any
        const currentToken = this.tokenManager.getActiveToken();
        if (currentToken) {
            this._onControlToken(currentToken, true);
        }
    }

    _onControlToken(token, controlled) {
        if (this.dazzleAnimation) {
            this.dazzleAnimation.kill();
            this.dazzleAnimation = null;
        }

        if (controlled && token) {
            this.activeTokenId = token.id;
            // Establish the initial state without triggering the effect
            this._updateInitialTokenState(token);
        } else if (!canvas.tokens.controlled.length) {
            this.activeTokenId = null;
            this.isIndoors = null;
        }
    }

    _onUpdateToken(tokenDoc, change) {
        this.config = game.mapShine.profileManager.activeConfig.postProcessing.colorCorrection.dynamicExposure;

        if (!this.isInitialized || tokenDoc.id !== this.activeTokenId || !this.config.enabled) {
            return;
        }

        // Only react to movement
        if (change.x !== undefined || change.y !== undefined) {
            // We need to check the state at the destination, not the current position.
            // Create a point representing the destination center in world coordinates.
            const dest = {
                x: change.x ?? tokenDoc.x,
                y: change.y ?? tokenDoc.y,
                w: tokenDoc.width * canvas.scene.grid.size,
                h: tokenDoc.height * canvas.scene.grid.size
            };
            const destCenter = {
                x: dest.x + dest.w / 2,
                y: dest.y + dest.h / 2
            };
            this._checkTokenStateAtPoint(destCenter, true);
        }
    }

    _updateInitialTokenState(token) {
        if (!token) {
            this.isIndoors = null;
            return;
        }

        const cloudLayer = canvas.layers.find(l => l instanceof CloudShadowsLayer);
        const outdoorsMask = cloudLayer?.getMaskTexture();

        if (!outdoorsMask?.valid) {
            this.isIndoors = null;
            return;
        }

        const screenPos = canvas.stage.toGlobal(token.center);
        const screen = canvas.app.renderer.screen;
        const x = Math.max(0, Math.min(screen.width - 1, Math.round(screenPos.x)));
        const y = Math.max(0, Math.min(screen.height - 1, Math.round(screenPos.y)));

        try {
            const pixelData = canvas.app.renderer.extract.pixels(outdoorsMask, new PIXI.Rectangle(x, y, 1, 1));
            const maskValue = pixelData[0];
            const isNowOutdoors = maskValue > 128;
            this.isIndoors = !isNowOutdoors;
        } catch (e) {
            // It's safe to ignore extraction errors here, as this is just setting an initial state.
        }
    }

    _checkTokenStateAtPoint(worldPoint, canTriggerEffect = false) {
        if (!worldPoint) {
            this.isIndoors = null;
            return;
        }

        const cloudLayer = canvas.layers.find(l => l instanceof CloudShadowsLayer);
        const outdoorsMask = cloudLayer?.getMaskTexture();

        if (!outdoorsMask?.valid) {
            this.isIndoors = null;
            return;
        }

        const screenPos = canvas.stage.toGlobal(worldPoint);
        const screen = canvas.app.renderer.screen;
        const x = Math.max(0, Math.min(screen.width - 1, Math.round(screenPos.x)));
        const y = Math.max(0, Math.min(screen.height - 1, Math.round(screenPos.y)));

        try {
            const pixelData = canvas.app.renderer.extract.pixels(outdoorsMask, new PIXI.Rectangle(x, y, 1, 1));
            const maskValue = pixelData[0];

            // Corrected Logic: "Outdoors" is where the _Outdoors mask is bright.
            const isNowOutdoors = maskValue > 128;
            const wasIndoors = this.isIndoors === true;

            // Update the state for the *next* check, based on the destination of the *current* move.
            this.isIndoors = !isNowOutdoors;

            // Check for the specific transition from indoors (dark) to outdoors (bright).
            if (canTriggerEffect && wasIndoors && isNowOutdoors) {
                this._triggerDazzleEffect();
            }
        } catch (e) {
            // This can happen if the texture is not yet ready on the GPU.
            // It's safe to ignore and try again on the next movement.
        }
    }

    _triggerDazzleEffect() {
        this.config = game.mapShine.profileManager.activeConfig.postProcessing.colorCorrection.dynamicExposure;

        if (Date.now() - this.lastTriggerTimestamp < this.config.resetPeriod) {
            return; // Effect is on cooldown
        }

        this.lastTriggerTimestamp = Date.now();

        if (this.dazzleAnimation) {
            this.dazzleAnimation.kill();
        }

        // Animate the exposure boost using GSAP
        this.ccFilter.uniforms.uDynamicExposureBoost = this.config.intensity;
        this.dazzleAnimation = gsap.to(this.ccFilter.uniforms, {
            uDynamicExposureBoost: 0,
            duration: this.config.duration / 1000, // GSAP uses seconds
            ease: "power2.out",
            onComplete: () => {
                this.dazzleAnimation = null;
            }
        });
    }

    destroy() {
        if (!this.isInitialized) return;
        this.isInitialized = false;

        Hooks.off('controlToken', this._boundOnControlToken);
        Hooks.off('updateToken', this._boundOnUpdateToken);

        if (this.dazzleAnimation) {
            this.dazzleAnimation.kill();
            this.dazzleAnimation = null;
        }

        if (this.ccFilter && !this.ccFilter.destroyed) {
            this.ccFilter.uniforms.uDynamicExposureBoost = 0.0;
        }

        this.ccFilter = null;
        this.activeTokenId = null;
    }
}

class PauseEffectManager {
    constructor() {
        this._animationState = {
            progress: game.paused ? 1 : 0
        };
        this._animation = null;
        this._pauseFilter = null;
        this._originalGlobalTime = 100;
        this._isInitialized = false;
        // Bind the handler once to ensure Hooks.off can find it
        this._boundOnPauseChange = this._onPauseChange.bind(this);
    }

    initialize() {
        if (this._isInitialized) return;
        this._pauseFilter = ScreenEffectsManager.getFilter('pauseEffect');
        if (!this._pauseFilter) {
            console.error("Map Shine | PauseEffectManager could not find its dedicated filter.");
            return;
        }

        const config = game.mapShine.profileManager.activeConfig;
        this._originalGlobalTime = config.timeControl.globalTime;

        // Set initial state without animation, in case the game loads while paused.
        this._updateEffects(this._animationState.progress);

        Hooks.on('pauseGame', this._boundOnPauseChange);
        this._isInitialized = true;
        console.log("Map Shine | Pause Effect Manager Initialized.");
    }

    destroy() {
        if (!this._isInitialized) return;

        Hooks.off('pauseGame', this._boundOnPauseChange);
        if (this._animation) {
            this._animation.kill();
        }
        this._animation = null;
        this._pauseFilter = null; // Don't destroy the filter itself, just release the reference
        this._isInitialized = false;
        console.log("Map Shine | Pause Effect Manager Destroyed.");
    }

    _onPauseChange(paused) {
        if (!this._pauseFilter) return;

        const config = game.mapShine.profileManager.activeConfig;
        const peConfig = config.pauseEffect;

        if (!peConfig.enabled) {
            // If the effect is disabled, ensure time is restored and the filter is off.
            this._updateEffects(0);
            if (config.timeControl.globalTime < this._originalGlobalTime) {
                foundry.utils.setProperty(config, 'timeControl.globalTime', this._originalGlobalTime);
                game.mapShine.profileManager.updateAllSystemsFromConfig();
                if (game.mapShine.debugger) {
                    game.mapShine.debugger.eventHandler.updateAllControls();
                }
            }
            return;
        }

        if (this._animation) {
            this._animation.kill();
        }

        const targetProgress = paused ? 1 : 0;

        // Before starting a "pausing" animation, store the current time.
        // But only if we aren't already paused (e.g. from a previous animation)
        if (paused && this._animationState.progress < 1) {
            this._originalGlobalTime = game.mapShine.profileManager.activeConfig.timeControl.globalTime;
        }

        this._animation = gsap.to(this._animationState, {
            progress: targetProgress,
            duration: peConfig.duration / 1000, // GSAP uses seconds
            ease: "power2.inOut",
            onUpdate: () => this._updateEffects(this._animationState.progress),
            onComplete: () => {
                this._animation = null;
                this._updateEffects(targetProgress); // Final snap to value
            }
        });
    }

    _updateEffects(progress) {
        if (!this._pauseFilter) return;

        const config = game.mapShine.profileManager.activeConfig;
        const peConfig = config.pauseEffect;
        const timeControlPath = 'timeControl.globalTime';

        // --- 1. Update Time Control ---
        const newTime = this._originalGlobalTime * (1 - progress);

        // Directly update the live timeFactor and the config object for consistency
        game.mapShine.timeControl.timeFactor = newTime / 100.0;
        foundry.utils.setProperty(config, timeControlPath, newTime);

        // We only need to call updateAllSystemsFromConfig for the time change.
        // The color correction is handled directly on the filter below.
        // Pass a flag to indicate this is a time-only update to prevent particle resets.
        game.mapShine.profileManager.updateAllSystemsFromConfig({
            timeOnly: true
        });

        // Update the debugger UI to reflect the change without treating it as a user override
        if (game.mapShine.debugger) {
            const slider = game.mapShine.debugger.element.querySelector('#control-timeControl-globalTime');
            if (slider) {
                slider.value = newTime;
                game.mapShine.debugger.eventHandler._updateSliderValue(slider.id, newTime, slider.step);
            }
        }

        // --- 2. Update Color Correction Filter ---
        const u = this._pauseFilter.uniforms;
        const cc = peConfig.colorCorrection;

        // This filter is only active during a transition or when fully paused.
        this._pauseFilter.enabled = progress > 0.001 && cc.enabled;

        // Animate the overall intensity of the color correction effect.
        u.uIntensity = progress;

        // Interpolate each value from its neutral state to the target "paused" state.
        // Note: these are now effectively pre-multiplied by the uIntensity uniform in the shader.
        u.uSaturation = cc.saturation;
        u.uBrightness = cc.brightness;
        u.uContrast = cc.contrast;
        u.uExposure = cc.exposure;
        u.uGamma = cc.gamma;
        u.uInBlack = cc.levels.inBlack;
        u.uInWhite = cc.levels.inWhite;
        u.uTemperature = cc.whiteBalance.temperature;
        u.uWbTint = cc.whiteBalance.tint;
        u.uTintAmount = cc.tint.amount;
        u.uTintColor = hexToRgbArray(cc.tint.color);

        // Boolean values are not interpolated.
        u.uInvert = cc.invert;

        // Selective Color
        u.uSelectiveEnabled = cc.selective.enabled;
        u.uSelectiveColor = hexToRgbArray(cc.selective.color);
        u.uSelectiveHueRange = cc.selective.hueRange;
        u.uSelectiveSatRange = cc.selective.saturationRange;
        u.uSelectiveLumRange = cc.selective.luminanceRange;
        u.uSelectiveTargetLum = cc.selective.targetLuminance;
        u.uSelectiveSoftness = cc.selective.softness;
        u.uSelectiveInvert = cc.selective.invert;
        u.uSelectiveDesaturation = cc.selective.desaturation;
        u.uSelectiveTargetSaturation = cc.selective.targetSaturation;
        u.uSelectiveTargetBrightness = cc.selective.targetBrightness;
    }
}

class CombatEffectManager {
    constructor() {
        this._animationState = {
            progress: 0 // Initialize to a safe default.
        };
        this._animation = null;
        this._combatFilter = null;
        this._originalGlobalTime = 100;
        this._isInitialized = false;
        this._boundOnCombatChange = this._onCombatChange.bind(this);
    }

    initialize() {
        if (this._isInitialized) return;
        this._combatFilter = ScreenEffectsManager.getFilter('combatEffect');
        if (!this._combatFilter) {
            console.error("Map Shine | CombatEffectManager could not find its dedicated filter.");
            return;
        }

        const config = game.mapShine.profileManager.activeConfig;
        this._originalGlobalTime = config.timeControl.globalTime;

        // Check the combat state now that game.combats is available.
        this._animationState.progress = game.combats.active?.started ? 1 : 0;

        // Set initial state without animation, in case the game loads during combat.
        this._updateEffects(this._animationState.progress);

        Hooks.on('combatStart', () => this._boundOnCombatChange(true));
        Hooks.on('combatEnd', () => this._boundOnCombatChange(false));
        Hooks.on('deleteCombat', () => this._boundOnCombatChange(false));

        this._isInitialized = true;
        console.log("Map Shine | Combat Effect Manager Initialized.");
    }

    destroy() {
        if (!this._isInitialized) return;

        Hooks.off('combatStart', this._boundOnCombatChange);
        Hooks.off('combatEnd', this._boundOnCombatChange);
        Hooks.off('deleteCombat', this._boundOnCombatChange);

        if (this._animation) {
            this._animation.kill();
        }
        this._animation = null;
        this._combatFilter = null;
        this._isInitialized = false;
        console.log("Map Shine | Combat Effect Manager Destroyed.");
    }

    _onCombatChange(inCombat) {
        if (!this._combatFilter) return;

        const config = game.mapShine.profileManager.activeConfig;
        const ceConfig = config.combatEffect;

        if (!ceConfig.enabled) {
            this._updateEffects(0);
            if (config.timeControl.globalTime < this._originalGlobalTime) {
                foundry.utils.setProperty(config, 'timeControl.globalTime', this._originalGlobalTime);
                game.mapShine.profileManager.updateAllSystemsFromConfig();
                if (game.mapShine.debugger) {
                    game.mapShine.debugger.eventHandler.updateAllControls();
                }
            }
            return;
        }

        if (this._animation) {
            this._animation.kill();
        }

        const targetProgress = inCombat ? 1 : 0;

        if (inCombat && this._animationState.progress < 1) {
            this._originalGlobalTime = game.mapShine.profileManager.activeConfig.timeControl.globalTime;
        }

        this._animation = gsap.to(this._animationState, {
            progress: targetProgress,
            duration: ceConfig.duration / 1000,
            ease: "power2.inOut",
            onUpdate: () => this._updateEffects(this._animationState.progress),
            onComplete: () => {
                this._animation = null;
                this._updateEffects(targetProgress);
            }
        });
    }

    _updateEffects(progress) {
        if (!this._combatFilter) return;

        const config = game.mapShine.profileManager.activeConfig;
        const ceConfig = config.combatEffect;
        const timeControlPath = 'timeControl.globalTime';

        // --- 1. Update Time Control ---
        const newTime = lerp(this._originalGlobalTime, this._originalGlobalTime * ceConfig.timeScale, progress);

        game.mapShine.timeControl.timeFactor = newTime / 100.0;
        foundry.utils.setProperty(config, timeControlPath, newTime);

        game.mapShine.profileManager.updateAllSystemsFromConfig({
            timeOnly: true
        });

        if (game.mapShine.debugger) {
            const slider = game.mapShine.debugger.element.querySelector('#control-timeControl-globalTime');
            if (slider) {
                slider.value = newTime;
                game.mapShine.debugger.eventHandler._updateSliderValue(slider.id, newTime, slider.step);
            }
        }

        // --- 2. Update Color Correction Filter ---
        const u = this._combatFilter.uniforms;
        const cc = ceConfig.colorCorrection;

        this._combatFilter.enabled = progress > 0.001 && cc.enabled;
        u.uIntensity = progress;

        u.uSaturation = cc.saturation;
        u.uBrightness = cc.brightness;
        u.uContrast = cc.contrast;
        u.uExposure = cc.exposure;
        u.uGamma = cc.gamma;
        u.uInBlack = cc.levels.inBlack;
        u.uInWhite = cc.levels.inWhite;
        u.uTemperature = cc.whiteBalance.temperature;
        u.uWbTint = cc.whiteBalance.tint;
        u.uTintAmount = cc.tint.amount;
        u.uTintColor = hexToRgbArray(cc.tint.color);
        u.uInvert = cc.invert;

        // Selective Color
        u.uSelectiveEnabled = cc.selective.enabled;
        u.uSelectiveColor = hexToRgbArray(cc.selective.color);
        u.uSelectiveHueRange = cc.selective.hueRange;
        u.uSelectiveSatRange = cc.selective.saturationRange;
        u.uSelectiveLumRange = cc.selective.luminanceRange;
        u.uSelectiveTargetLum = cc.selective.targetLuminance;
        u.uSelectiveSoftness = cc.selective.softness;
        u.uSelectiveInvert = cc.selective.invert;
        u.uSelectiveDesaturation = cc.desaturation;
        u.uSelectiveTargetSaturation = cc.targetSaturation;
        u.uSelectiveTargetBrightness = cc.targetBrightness;
    }
}

const systemStatus = new SystemStatusManager();

class TextureAutoLoader {
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
        shoreline: "_Shoreline"
    };

    async discoverAllTargets() {
        const results = {
            background: null,
            tiles: new Map()
        };
        const backgroundTarget = await this._processSceneBackground();
        if (backgroundTarget) {
            results.background = backgroundTarget;
        }
        for (const tile of canvas.tiles.placeables) {
            const tileTarget = await this._processTile(tile);
            if (tileTarget) {
                results.tiles.set(tile.id, tileTarget);
            }
        }
        console.log("MapShine | Full Texture Discovery Results:", results);
        return results;
    }

    async _processSceneBackground() {
        const bgSrc = canvas.scene?.background.src;
        if (!bgSrc) {
            console.info("MapShine | No scene background texture found.");
            return null;
        }
        const targetData = await this._findSuffixesForBaseTexture(bgSrc);

        targetData.baseTexturePath = bgSrc;
        targetData.rect = canvas.scene.dimensions.sceneRect;
        return targetData;
    }

    async _processTile(tile) {
        const tileSrc = tile.document.texture.src;
        if (!tileSrc) return null;

        const suffixData = await this._findSuffixesForBaseTexture(tileSrc);
        const hasEffectMap = Object.values(suffixData).some(path => path && typeof path === 'string');

        if (hasEffectMap) {

            return {
                tile,
                baseTexturePath: tileSrc,
                rect: {
                    x: tile.document.x,
                    y: tile.document.y,
                    width: tile.document.width,
                    height: tile.document.height,
                    rotation: tile.document.rotation * (Math.PI / 180),
                },
                ...suffixData
            };
        }
        return null;
    }

    async _findSuffixesForBaseTexture(baseTexturePath) {
        const discoveredPaths = {};
        Object.keys(TextureAutoLoader.SUFFIX_MAP).forEach(key => discoveredPaths[key] = null);

        // --- DIAGNOSTIC LOGGING ---
        const isWaterTile = baseTexturePath.toLowerCase().includes("water");
        if (isWaterTile) {
            console.log(`--- Map Shine | DIAGNOSTIC: Auto-discovery for water-related tile ---`);
            console.log(`Base Texture Path: ${baseTexturePath}`);
        }

        const lastSlash = baseTexturePath.lastIndexOf('/');
        if (lastSlash === -1) return discoveredPaths;

        const directoryPath = baseTexturePath.substring(0, lastSlash);
        const filename = baseTexturePath.substring(lastSlash + 1);

        let decodedFilename;
        try {
            decodedFilename = decodeURI(filename);
        } catch (e) {
            decodedFilename = filename;
        }

        const lastDot = decodedFilename.lastIndexOf('.');
        if (lastDot === -1) return discoveredPaths;

        const baseName = decodedFilename.substring(0, lastDot);
        const extension = decodedFilename.substring(lastDot);

        if (isWaterTile) {
            console.log(`Parsed Directory: ${directoryPath}`);
            console.log(`Parsed Base Name: ${baseName}`);
            console.log(`Parsed Extension: ${extension}`);
        }

        if (!baseName || !directoryPath) return discoveredPaths;

        let filesInDir = [];
        try {
            const source = game.settings.get("core", "noCanvas") ? "public" : "data";
            filesInDir = (await foundry.applications.apps.FilePicker.implementation.browse(source, directoryPath)).files;
            if (isWaterTile) {
                console.log(`Files found in directory:`, filesInDir);
            }
        } catch (e) {
            // This part is unchanged
            return discoveredPaths;
        }

        for (const [key, suffix] of Object.entries(TextureAutoLoader.SUFFIX_MAP)) {
            const expectedFilename = `${baseName}${suffix}${extension}`;

            // --- DIAGNOSTIC LOGGING for the shoreline ---
            if (isWaterTile && key === 'shoreline') {
                console.log(`Searching for key '${key}' with suffix '${suffix}'`);
                console.log(`Constructed Expected Filename: ${expectedFilename}`);
            }

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
                if (isWaterTile && key === 'shoreline') {
                    console.log(`SUCCESS: Found matching file path: ${foundFile}`);
                }
                discoveredPaths[key] = foundFile;
            } else {
                if (isWaterTile && key === 'shoreline') {
                    console.log(`FAILURE: No match found for '${expectedFilename}'.`);
                }
            }
        }
        if (isWaterTile) console.log(`--- END DIAGNOSTIC ---`);
        return discoveredPaths;
    }
}

class NoiseTextureManager {
    constructor(renderer, configPath, isWorldSpace = false) {
        this.configPath = configPath;
        this.isWorldSpace = isWorldSpace;
        this._needsUpdate = true; // A flag to force an update after config changes or pans.

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
        // START OF MODIFICATION
        this.filter = new NoisePatternFilter({
            u_isWorldSpace: this.isWorldSpace,
            u_resolution: [screen.width, screen.height] // Pass initial screen resolution here
        });
        this.sourceSprite.filters = [this.filter];
        // END OF MODIFICATION

        // If this is a world-space noise, it must re-render on pan.
        if (this.isWorldSpace) {
            this._onPanBound = this.requestUpdate.bind(this);
            if (!game.modules.get('libwrapper')?.active) {
                Hooks.on('canvasPan', this._onPanBound);
            }
        }
    }

    requestUpdate() {
        this._needsUpdate = true;
    }

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

    updateFromConfig(config) {
        const nConfig = foundry.utils.getProperty(config, this.configPath);
        // If the noise config for this path doesn't exist (e.g., parent effect is disabled),
        // then disable this internal filter and return.
        if (!nConfig) {
            if (this.filter) this.filter.enabled = false;
            return;
        }

        // Ensure the filter object has been instantiated.
        if (!this.filter) return;

        // The internal noise filter should always be enabled if its configuration is present.
        // Its output is consumed by other filters/layers, which handle the overall effect's enablement.
        this.filter.enabled = true;

        // Now, safely update all the uniform parameters.
        const u = this.filter.uniforms;
        u.u_speed = nConfig.speed;
        u.u_scale = nConfig.scale;
        u.u_threshold = nConfig.threshold;
        u.u_brightness = nConfig.brightness;
        u.u_contrast = nConfig.contrast;
        u.u_softness = nConfig.softness;
        u.u_evolution = nConfig.evolution ?? 0.0;

        // Request an update to the noise texture after parameters have changed.
        this.requestUpdate();
    }

    update(deltaTime, renderer) {
        if (!this.filter || !this.sourceSprite || !this.renderTexture) return;

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const nConfig = foundry.utils.getProperty(game.mapShine.profileManager.activeConfig, this.configPath);
        const isAnimated = nConfig && ((nConfig.speed * timeFactor) !== 0 || (nConfig.evolution * timeFactor) !== 0);

        if (!this._needsUpdate && !isAnimated) return;

        this.filter.uniforms.u_time = (this.filter.uniforms.u_time || 0) + (deltaTime * timeFactor);

        if (this.isWorldSpace) {
            const stage = canvas.stage;
            const screen = renderer.screen;
            const topLeft = stage.toLocal({
                x: 0,
                y: 0
            });
            const u = this.filter.uniforms;
            u.u_camera_offset = [topLeft.x, topLeft.y];
            u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        }

        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });

        this._needsUpdate = false;
    }

    getTexture() {
        return this.renderTexture;
    }

    destroy() {
        if (this.isWorldSpace && this._onPanBound) {
            Hooks.off('canvasPan', this._onPanBound);
        }
        this.filter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture?.destroy(true);
    }
}

class LightingMaskGenerator {
    constructor() {
        const screen = canvas.app.screen;
        this.renderTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.maskFilter = new LightingMaskFilter();
        this.sourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.sourceSprite.width = screen.width;
        this.sourceSprite.height = screen.height;
        this.sourceSprite.filters = [this.maskFilter];
    }

    update(renderer, illuminationTexture, threshold, softness, invert) {
        if (!this.sourceSprite || !illuminationTexture) return;
        this.sourceSprite.texture = illuminationTexture;
        this.maskFilter.uniforms.uLuminanceThreshold = threshold;
        this.maskFilter.uniforms.uSoftness = softness;
        this.maskFilter.uniforms.uInvert = invert;
        renderer.render(this.sourceSprite, {
            renderTexture: this.renderTexture,
            clear: true
        });
    }

    getMaskTexture() {
        return this.renderTexture;
    }

    resize(width, height) {
        this.renderTexture.resize(width, height);
        this.sourceSprite.width = width;
        this.sourceSprite.height = height;
    }

    destroy() {
        this.renderTexture?.destroy(true);
        this.maskFilter?.destroy();
        this.sourceSprite?.destroy();
        this.renderTexture = this.maskFilter = this.sourceSprite = null;
    }
}

class DynamicTokenMaskManager {
    constructor(canvas) {
        this.canvas = canvas;
        if (!this.canvas?.app?.renderer) {
            console.error("DynamicTokenMaskManager | Cannot initialize without a canvas renderer.");
            return;
        }
        console.log("DynamicTokenMaskManager | Initializing with sprite pooling.");

        const renderer = this.canvas.app.renderer;
        this.renderTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.tokenContainer = new PIXI.Container();
        this.tokenSprites = new Map();
        this._needsUpdate = true;
        this._destroyed = false;

        this._frameCount = 0;
        this.updateFrequency = 30;

        this._boundOnTokenChange = this._requestUpdate.bind(this);

        Hooks.on("createToken", this._boundOnTokenChange);
        Hooks.on("deleteToken", this._boundOnTokenChange);
        Hooks.on("canvasPan", this._boundOnTokenChange);

        this._boundOnAnimate = () => {
            if (this._destroyed || !this.canvas?.stage?.transform) return;

            this._frameCount++;
            const isNthFrame = (this._frameCount % this.updateFrequency === 0);

            if (this._needsUpdate || isNthFrame) {
                this.renderMask();
                this._needsUpdate = false;
            }
        };
        this.canvas.app.ticker.add(this._boundOnAnimate);

        this.renderMask();
    }

    _requestUpdate() {
        this._needsUpdate = true;
    }

    renderMask() {
        if (this._destroyed || !this.tokenContainer || !this.canvas?.tokens?.placeables) return;
        const renderer = this.canvas.app.renderer;

        const currentTokenIds = new Set();

        for (const token of this.canvas.tokens.placeables) {
            if (!token.visible || !token.texture?.valid || token.document.hidden) {
                continue;
            }
            currentTokenIds.add(token.id);

            let sprite = this.tokenSprites.get(token.id);

            if (!sprite) {
                sprite = new PIXI.Sprite(token.texture);
                sprite.tint = 0xFFFFFF;
                this.tokenSprites.set(token.id, sprite);
                this.tokenContainer.addChild(sprite);
            }

            if (sprite.texture !== token.texture) {
                sprite.texture = token.texture;
            }

            const anchorX = token.document.texture.anchorX ?? 0.5;
            const anchorY = token.document.texture.anchorY ?? 0.5;
            sprite.anchor.set(anchorX, anchorY);
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

    getMaskTexture() {
        return this.renderTexture;
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        console.log("DynamicTokenMaskManager | Destroying.");
        Hooks.off("createToken", this._boundOnTokenChange);
        Hooks.off("deleteToken", this._boundOnTokenChange);
        Hooks.off("canvasPan", this._boundOnTokenChange);
        this.canvas.app.ticker.remove(this._boundOnAnimate);

        this.renderTexture?.destroy(true);
        for (const sprite of this.tokenSprites.values()) {
            sprite.destroy();
        }
        this.tokenSprites.clear();
        this.tokenContainer?.destroy({
            children: true
        });
        this.renderTexture = null;
        this.tokenContainer = null;
    }
}

class AmbientMaskManager {
    constructor(canvas) {
        console.log("AmbientMaskManager | Initializing.");
        this.canvas = canvas;
        this.maskGenerator = new LightingMaskGenerator();
        this.maskSprite = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
        this._destroyed = false;

        this._tickerFunction = this.update.bind(this);
        this.canvas.app.ticker.add(this._tickerFunction);

        this._onResizeBound = this._onResize.bind(this);
        window.addEventListener('resize', this._onResizeBound);
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        console.log("AmbientMaskManager | Destroying.");
        this.canvas.app.ticker.remove(this._tickerFunction);
        window.removeEventListener('resize', this._onResizeBound);

        const ambientLayer = this.canvas.layers.find(l => l instanceof AmbientLayer);
        if (ambientLayer) {
            ambientLayer.mask = null;
        }

        this.maskGenerator?.destroy();
        this.maskSprite?.destroy();
    }

    _onResize() {
        if (this.maskGenerator) {
            const screen = this.canvas.app.screen;
            this.maskGenerator.resize(screen.width, screen.height);
        }
    }

    update() {
        // KILL SWITCH: Abort if destroyed or if a scene transition is active.
        if (this._destroyed || game.mapShine.transitionActive) return;

        const ambientLayer = this.canvas.layers.find(l => l instanceof AmbientLayer);
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const mConfig = game.mapShine.profileManager.activeConfig.ambient.masking;
        const screen = this.canvas.app.renderer.screen;

        const illuminationTexture = illuminationAPI?.getLightingTexture();
        const isIlluminationReady = illuminationAPI && illuminationTexture?.valid &&
            illuminationTexture.width === Math.round(screen.width) &&
            illuminationTexture.height === Math.round(screen.height);

        const shouldBeEnabled = mConfig.enabled && ambientLayer?.visible && isIlluminationReady;

        if (!shouldBeEnabled) {
            if (ambientLayer && ambientLayer.mask) {
                ambientLayer.mask = null;
            }
            if (mConfig.enabled && ambientLayer?.visible && !isIlluminationReady && game.mapShine.profileManager.activeConfig.debug) {
                console.log("AmbientMaskManager DEBUG | Stale or invalid illumination texture detected. Deferring mask update.");
            }
            return;
        }

        this.maskGenerator.update(
            this.canvas.app.renderer,
            illuminationTexture,
            mConfig.threshold,
            mConfig.softness,
            true
        );

        if (ambientLayer.mask !== this.maskSprite) {
            ambientLayer.mask = this.maskSprite;
        }

        const stage = this.canvas.stage;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        this.maskSprite.position.copyFrom(topLeft);
        this.maskSprite.width = screen.width / stage.scale.x;
        this.maskSprite.height = screen.height / stage.scale.y;
    }
}

class LightingEffectManager {
    constructor(canvas) {
        console.log("LightingEffectManager | Initializing.");
        this.canvas = canvas;
        this.maskGenerator = new LightingMaskGenerator();
        this.pauseMaskGenerator = new LightingMaskGenerator();
        this._tickerFunction = this.update.bind(this);
        this.canvas.app.ticker.add(this._tickerFunction);
        this._destroyed = false;
        this.isReady = false; // This will be activated by the lifecycle manager after a delay
    }

    destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        console.log("LightingEffectManager | Destroying and resetting uniforms.");
        this.canvas.app.ticker.remove(this._tickerFunction);

        const ccFilter = ScreenEffectsManager.getFilter('colorCorrection');
        if (ccFilter && !ccFilter.destroyed) {
            const u = ccFilter.uniforms;

            // --- Exhaustive Reset of Illumination Mix-in ---
            // This ensures all visual aspects of the effect are returned to a neutral state,
            // acting as a safeguard against race conditions with the illumination buffer.
            u.uIllumEnabled = false;
            u.uIllumTexture = PIXI.Texture.EMPTY;
            u.uIllumIntensity = 0.0;
            u.uIllumBlendMode = 1;
            u.uIllumDebugMode = false;

            // Color Correction Sub-group
            u.uIllumCCEnabled = true;
            u.uIllumSaturation = 1.0;
            u.uIllumBrightness = 0.0;
            u.uIllumContrast = 1.0;
            u.uIllumExposure = 0.0;
            u.uIllumGamma = 1.0;
            u.uIllumTintColor = [1.0, 1.0, 1.0];
            u.uIllumTintAmount = 0.0;

            // Noise Sub-group
            u.uIllumNoiseEnabled = true;
            u.uIllumNoiseAmount = 0.0;
            u.uIllumNoiseScale = 1.0;
            u.uIllumTime = 0.0;

            // Negative Mask Sub-group
            u.uIllumNegativeMaskEnabled = false;
            u.uIllumNegativeMaskThreshold = 0.8;
            u.uIllumNegativeMaskSoftness = 0.2;

            // Reset Post-processing masks
            u.uMaskEnabled = false;
            u.uMaskTexture = PIXI.Texture.EMPTY;
            u.uCloudHighlightsEnabled = false;
            u.uCanopyHighlightsEnabled = false;
            u.uCanopyOutdoorsMaskEnabled = false;
            u.uStructuralHighlightsEnabled = false;
            u.uStructuralSplitHighlightsEnabled = false;
            u.uStructuralOutdoorsMaskEnabled = false;
        }

        const pauseFilter = ScreenEffectsManager.getFilter('pauseEffect');
        if (pauseFilter && !pauseFilter.destroyed) {
            const u = pauseFilter.uniforms;
            u.uMaskEnabled = false;
            u.uMaskTexture = PIXI.Texture.EMPTY;
        }

        this.maskGenerator?.destroy();
        this.pauseMaskGenerator?.destroy();
    }

    _updatePostProcessingMasks(ccFilter, fullConfig, isIlluminationReady, illuminationTexture) {
        const config = fullConfig.postProcessing.colorCorrection;
        const u = ccFilter.uniforms;
        const screen = this.canvas.app.renderer.screen;
        const rect = this.canvas.scene.dimensions.sceneRect;

        if (rect && screen.width > 0 && screen.height > 0) {
            const topLeftScreen = this.canvas.stage.toGlobal({
                x: rect.x,
                y: rect.y
            });
            const sceneWidthPixels = rect.width * this.canvas.stage.scale.x;
            const sceneHeightPixels = rect.height * this.canvas.stage.scale.y;

            u.uSceneRectNorm = [
                topLeftScreen.x / screen.width,
                topLeftScreen.y / screen.height,
                sceneWidthPixels / screen.width,
                sceneHeightPixels / screen.height
            ];
        }

        const useIllumMask = config.mask.enabled && isIlluminationReady;
        u.uMaskEnabled = useIllumMask;
        if (useIllumMask) {
            this.maskGenerator.update(
                this.canvas.app.renderer,
                illuminationTexture,
                config.mask.luminanceThreshold,
                config.mask.softness,
                config.mask.invert
            );
            u.uMaskTexture = this.maskGenerator.getMaskTexture();
        }

        const cloudLayer = this.canvas.layers.find(l => l instanceof CloudShadowsLayer);
        u.uCloudHighlightsEnabled = config.highlightCloud.enabled && !!cloudLayer?.visible;
        if (u.uCloudHighlightsEnabled) {
            u.uCloudHighlightsMask = cloudLayer.getHighlightMaskTexture();
            u.uCloudHighlightsBrightness = config.highlightCloud.brightness;
        }

        const canopyLayer = this.canvas.layers.find(l => l instanceof CanopyLayer);
        const canopyMask = canopyLayer?.getMaskTexture();
        u.uCanopyHighlightsEnabled = config.highlightCanopy.enabled && !!canopyLayer?.visible && !!canopyMask?.valid;
        if (u.uCanopyHighlightsEnabled) {
            u.uCanopyHighlightsMask = canopyMask;
            u.uCanopyHighlightsBrightness = config.highlightCanopy.brightness;
            const outdoorsMask = canopyLayer.outdoorsMaskTexture;
            u.uCanopyOutdoorsMaskEnabled = !!outdoorsMask?.valid;
            if (u.uCanopyOutdoorsMaskEnabled) {
                u.uCanopyOutdoorsMask = outdoorsMask;
            }
        } else {
            u.uCanopyOutdoorsMaskEnabled = false;
        }

        const structuralLayer = this.canvas.layers.find(l => l instanceof StructuralShadowsLayer);
        const structuralHighlightMask = structuralLayer?.getHighlightMaskTexture();
        u.uStructuralHighlightsEnabled = config.highlightStructural.enabled && !!structuralHighlightMask?.valid;
        if (u.uStructuralHighlightsEnabled) {
            u.uStructuralHighlightsMask = structuralHighlightMask;
            u.uStructuralHighlightsBrightness = config.highlightStructural.brightness;
            const isSplitEnabled = structuralLayer.isRgbSplitEnabled();
            u.uStructuralSplitHighlightsEnabled = isSplitEnabled;
            if (isSplitEnabled) {
                u.uStructuralSplitHighlightsMask = structuralLayer.getSplitHighlightMaskTexture();
            }
            const outdoorsMask = structuralLayer.outdoorsMaskTexture;
            u.uStructuralOutdoorsMaskEnabled = !!outdoorsMask?.valid;
            if (u.uStructuralOutdoorsMaskEnabled) {
                u.uStructuralOutdoorsMask = outdoorsMask;
            }
        } else {
            u.uStructuralOutdoorsMaskEnabled = false;
            u.uStructuralSplitHighlightsEnabled = false;
        }
    }

    _updatePauseEffectMask(pauseFilter, fullConfig, isIlluminationReady, illuminationTexture) {
        const config = fullConfig.pauseEffect.colorCorrection;
        const u = pauseFilter.uniforms;

        const useIllumMask = config.mask.enabled && isIlluminationReady;
        u.uMaskEnabled = useIllumMask;
        if (useIllumMask) {
            this.pauseMaskGenerator.update(
                this.canvas.app.renderer,
                illuminationTexture,
                config.mask.luminanceThreshold,
                config.mask.softness,
                config.mask.invert
            );
            u.uMaskTexture = this.pauseMaskGenerator.getMaskTexture();
        }
    }

    _updateIlluminationMixIn(ccFilter, fullConfig, isIlluminationReady, illuminationTexture) {
        if (!ccFilter) return;

        const ppConfig = fullConfig.postProcessing;
        const siConfig = ppConfig.colorCorrection.sceneIlluminationMixIn;
        const u = ccFilter.uniforms;

        const isEnabledThisFrame = ppConfig.enabled &&
            ppConfig.colorCorrection.enabled &&
            siConfig &&
            siConfig.enabled &&
            isIlluminationReady;

        u.uIllumEnabled = isEnabledThisFrame;

        if (isEnabledThisFrame) {
            if (siConfig.debugMode) {
                console.log(`[Map Shine Debug] Updating Illum Mix-In. Intensity: ${siConfig.intensity}`);
            }

            u.uIllumTexture = illuminationTexture;
            u.uIllumIntensity = siConfig.intensity;
            u.uIllumBlendMode = siConfig.blendMode;
            u.uIllumDebugMode = siConfig.debugMode ?? false;

            const si_cc = siConfig.colorCorrection || {};
            u.uIllumCCEnabled = si_cc.enabled ?? true;
            u.uIllumSaturation = si_cc.saturation ?? 1.0;
            u.uIllumBrightness = si_cc.brightness ?? 0.0;
            u.uIllumContrast = si_cc.contrast ?? 1.0;
            u.uIllumExposure = si_cc.exposure ?? 0.0;
            u.uIllumGamma = si_cc.gamma ?? 1.0;
            u.uIllumTintColor = hexToRgbArray(si_cc.tint?.color ?? "#FFFFFF");
            u.uIllumTintAmount = si_cc.tint?.amount ?? 0.0;

            const noise = siConfig.noise || {};
            u.uIllumNoiseEnabled = noise.enabled ?? true;
            u.uIllumNoiseAmount = noise.amount ?? 0.01;
            u.uIllumNoiseScale = noise.scale ?? 1.0;

            const negativeMask = siConfig.negativeMask || {};
            u.uIllumNegativeMaskEnabled = negativeMask.enabled ?? false;
            u.uIllumNegativeMaskThreshold = negativeMask.threshold ?? 0.8;
            u.uIllumNegativeMaskSoftness = negativeMask.softness ?? 0.2;

            if (noise.enabled && noise.speed !== 0) {
                const deltaInSeconds = (this.canvas.app.ticker.deltaTime / this.canvas.app.ticker.FPS);
                const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
                u.uIllumTime = (u.uIllumTime || 0) + (deltaInSeconds * timeFactor * noise.speed);
            }
        } else {
            // When the effect is disabled, explicitly reset its uniforms to prevent stale data from persisting.
            u.uIllumTexture = PIXI.Texture.EMPTY;
            u.uIllumIntensity = 0.0;
        }
    }

    update() {
        // KILL SWITCH: Do not run any logic if the manager is not ready or a scene transition is active.
        if (this._destroyed || !this.isReady || game.mapShine.transitionActive) return;

        const fullConfig = game.mapShine.profileManager.activeConfig;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const screen = this.canvas.app.renderer.screen;

        const illuminationTexture = illuminationAPI?.getLightingTexture();
        const isIlluminationReady = illuminationAPI && illuminationTexture?.valid &&
            illuminationTexture.width === Math.round(screen.width) &&
            illuminationTexture.height === Math.round(screen.height);

        const ccFilter = ScreenEffectsManager.getFilter('colorCorrection');
        if (ccFilter) {
            this._updatePostProcessingMasks(ccFilter, fullConfig, isIlluminationReady, illuminationTexture);
            this._updateIlluminationMixIn(ccFilter, fullConfig, isIlluminationReady, illuminationTexture);
        }

        const pauseFilter = ScreenEffectsManager.getFilter('pauseEffect');
        if (pauseFilter) {
            this._updatePauseEffectMask(pauseFilter, fullConfig, isIlluminationReady, illuminationTexture);
        }
    }
}

class CompositeMaskGenerator {
    /**
     * Creates a new texture by blending two source textures with a MULTIPLY effect.
     * @param {string} baseTexturePath - The path to the first texture (e.g., _Dust).
     * @param {string} overlayTexturePath - The path to the second texture (e.g., _Structural).
     * @param {PIXI.Rectangle} rect - The world-space rectangle defining the target area.
     * @returns {Promise<PIXI.RenderTexture|null>} A promise that resolves to the new composite texture, or null on failure.
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

            // Set sprite properties to match the target tile/background
            baseSprite.width = overlaySprite.width = rect.width;
            baseSprite.height = overlaySprite.height = rect.height;
            baseSprite.position.set(rect.x, rect.y);
            overlaySprite.position.set(rect.x, rect.y);

            // Set the blend mode to MULTIPLY to get the intersection
            overlaySprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

            container.addChild(baseSprite, overlaySprite);

            // Create a render texture to capture the result
            const renderTexture = PIXI.RenderTexture.create({
                width: renderer.screen.width,
                height: renderer.screen.height
            });

            // Render the container with the world transform to the screen-sized texture
            renderer.render(container, {
                renderTexture: renderTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });

            // Clean up the temporary PIXI objects
            container.destroy({
                children: true
            });

            return renderTexture;

        } catch (error) {
            console.error(`Map Shine | Failed to generate composite mask from "${baseTexturePath}" and "${overlayTexturePath}"`, error);
            return null;
        }
    }
}

// =================================================================================
// SECTION 3: PARTICLE SYSTEMS
// =================================================================================
// Description: This section contains the management system for all particle effects.
// ---------------------------------------------------------------------------------

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
        spawnOn: "tiles",
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'water')
    },
    foam: {
        title: "Shoreline Foam Particles",
        description: "Spawns particles on the brightest parts of the animated shoreline foam.",
        configPath: 'water.shoreline.foamParticles',
        triggerTexture: 'shoreline', // Triggered by the presence of a _Shoreline texture
        spawnOn: "tiles",
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'shoreline') // Use the shoreline texture as the mask
    },
    fire: {
        title: "Flames",
        description: "A multi-stage effect for fire, combining particles and a bloom glow. Requires a _Fire.webp map where white areas are the heart of the flame.",
        configPath: 'fire.particles',
        triggerTexture: 'fire',
        buildEmitterConfig: (effectConfig, targetData) => buildParticleEmitterConfig(effectConfig, targetData, 'fire')
    },
    sparks: {
        title: "Sparks",
        description: "Creates sparks that fly off in turbulent paths. Requires a _Sparks.webp map.",
        configPath: 'sparks',
        triggerTexture: 'sparks',
        buildEmitterConfig: (effectConfig, targetData) => buildSparkEmitterConfig(effectConfig, targetData, 'sparks')
    }
};

class ParticleEffectController {
    constructor(definition, parentContainer) {
        this.definition = definition;
        this.parentContainer = parentContainer; // This is the main container from ParticleManager
        this.emitters = new Map();
        this.pendingTargets = new Map();
        this.config = {};
        this.rgbSplitFilter = null;
        this.bloomFilter = null;

        // This will be the container that holds only the particles for effects needing pre-filtering blending.
        this.particleOnlyContainer = null;

        // Special handling for effects with filters that need to operate on blended particles
        if (definition.configPath === 'glint') {
            this.rgbSplitFilter = new ParticleRgbSplitFilter();
        }
        if (definition.configPath === 'fire.particles') {
            const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
            if (BloomFilterConstructor) {
                this.bloomFilter = new BloomFilterConstructor();
            }
            // For fire, we need a wrapper so blending happens before bloom.
            this.particleOnlyContainer = new PIXI.Container();
            this.parentContainer.addChild(this.particleOnlyContainer);
        }
    }

    static getSettingsHTML(effectKey) {
        const definition = PARTICLE_EFFECT_DEFINITIONS[effectKey];
        if (!definition) return '';

        const path = definition.configPath;
        let content = `<p class="description-text">${definition.description}</p>`;
        content += DebuggerUIBuilder._createSelectHTML(`${path}.blendMode`, 'Blend Mode', BLEND_MODE_OPTIONS);

        // Special case for Fire Bloom
        if (effectKey === 'fire') {
            content += `
                            <details id="details-fire-bloom">
                                <summary><span class="accordion-toggle"></span>
                                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('fire.bloom.enabled', 'Bloom Effect', true)}</div>
                                </summary>
                                <div style="padding-left: 15px;">
                                    <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;"><strong style="color: #ffddaa;">PERFORMANCE WARNING:</strong> This can be demanding. Lowering 'Quality' can improve performance.</div>
                                    <p class="description-text">Adds a soft glow to the fire particles.</p>
                                    ${DebuggerUIBuilder._createSliderHTML('fire.bloom.threshold', 'Threshold', 0, 1, 0.01)}
                                    ${DebuggerUIBuilder._createSliderHTML('fire.bloom.brightness', 'Brightness', 0, 5, 0.05)}
                                    ${DebuggerUIBuilder._createSliderHTML('fire.bloom.bloomScale', 'Scale', 0.1, 5, 0.1, 'The size of the bloom effect.')}
                                    ${DebuggerUIBuilder._createSliderHTML('fire.bloom.blur', 'Blur Amount', 0, 20, 0.5)}
                                    ${DebuggerUIBuilder._createSliderHTML('fire.bloom.quality', 'Quality', 1, 15, 1, 'Number of blur samples. Higher is smoother but much slower.')}
                                </div>
                            </details>
                        `;
        }

        if (effectKey === 'sparks') {
            const sparksPath = 'sparks';
            let sparksContent = `
                        <p class="description-text">${definition.description}</p>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createTextureInputHTML(definition.triggerTexture, `Effect Mask (_${definition.triggerTexture.charAt(0).toUpperCase() + definition.triggerTexture.slice(1)})`)}
                                ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.maskInfluence`, 'Particle Density', 0.01, 5, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.frequency`, 'Spawn Rate (s)', 0.01, 2, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.maskThreshold`, 'Mask Threshold', 0, 1, 0.01, 'Luminance from the _Sparks map required to spawn sparks.')}
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSelectHTML(`${sparksPath}.blendMode`, 'Blend Mode', BLEND_MODE_OPTIONS)}
                                ${DebuggerUIBuilder._createTextInputHTML(`${sparksPath}.particleTexture`, 'Particle Texture')}
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.lifetime.min`, 'Min Lifetime (s)', 0.5, 5, 0.1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.lifetime.max`, 'Max Lifetime (s)', 0.5, 5, 0.1)}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Color Over Life</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createColorPickerHTML(`${sparksPath}.color.start`, 'Start Color')}
                                        ${DebuggerUIBuilder._createColorPickerHTML(`${sparksPath}.color.end`, 'End Color')}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Alpha / Opacity</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.alpha.max`, 'Max Alpha', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.alpha.fadeIn`, 'FadeIn Time (%)', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.alpha.fadeOut`, 'FadeOut Time (%)', 0, 1, 0.01)}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.scale.sizeMultiplier`, 'Global Size', 0.1, 2, 0.05)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.scale.start`, 'Start Scale', 0.1, 2, 0.05)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.scale.end`, 'End Scale', 0, 2, 0.05)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.scale.minMult`, 'Random Size Min', 0.1, 1, 0.01)}
                                    </div>
                                </details>
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Movement (Spark Path)</strong></summary>
                            <div style="padding-left:15px;">
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Speed Along Path</strong></summary>
                                    <div style="padding-left:15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.speed.start`, 'Start Speed', 10, 200, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.speed.end`, 'End Speed', 10, 200, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.speed.minMult`, 'Random Speed Min', 0.1, 1, 0.01)}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Path Shape</strong></summary>
                                    <div style="padding-left:15px;">
                                        <p class="description-text">Controls the random sine wave path for each spark.</p>
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.amplitude.min`, 'Min Wave Width', 0, 100, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.amplitude.max`, 'Max Wave Width', 0, 100, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.frequency.min`, 'Min Wave Freq', 10, 200, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.frequency.max`, 'Max Wave Freq', 10, 200, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.damping`, 'Damping', 0, 1, 0.05, 'How quickly the path straightens out over the spark\\s life.')}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.angle.min`, 'Min Start Angle', -90, 90, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.angle.max`, 'Max Start Angle', -90, 90, 1)}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(`${sparksPath}.path.motionBlur.enabled`, 'Motion Blur', true)}</div></summary>
                                    <div style="padding-left:15px;">
                                        <p class="description-text">Stretches particles based on their speed to simulate motion blur.</p>
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.motionBlur.strength`, 'Strength', 0, 1, 0.01, 'Multiplier for how much speed affects particle length.')}
                                        ${DebuggerUIBuilder._createSliderHTML(`${sparksPath}.path.motionBlur.maxLength`, 'Max Length', 0, 10, 0.1, 'The maximum amount to stretch the particle scale.')}
                                    </div>
                                </details>
                            </div>
                        </details>
                    `;
            return DebuggerUIBuilder._createAccordionHTML(effectKey, definition.title, sparksContent);
        }

        // Common particle sections
        content += `
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createTextureInputHTML(definition.triggerTexture, `Effect Mask (_${definition.triggerTexture.charAt(0).toUpperCase() + definition.triggerTexture.slice(1)})`)}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.maskInfluence`, 'Particle Density', 0.01, 5, 0.01, 'Controls the maximum number of particles.')}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.frequency`, 'Spawn Rate (s)', 0.001, 1, 0.001, 'Time in seconds between particle spawns. Lower is faster.')}
                                ${DebuggerUIBuilder._createSliderHTML(`${path}.maskThreshold`, 'Mask Threshold', 0, 1, 0.01, 'Luminance from the mask required to spawn particles.')}
                                ${effectKey === 'glint' ? DebuggerUIBuilder._createCheckboxHTML(`${path}.darknessAffectsIntensity`, 'Darkness Reduces Intensity', false, 'If checked, the scene darkness level will reduce the particle spawn rate.') : ''}
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createTextInputHTML(`${path}.particleTexture`, 'Particle Texture', 'Path to the particle image.')}
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.lifetime.min`, 'Min Lifetime (s)', 0.1, 20, 0.1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.lifetime.max`, 'Max Lifetime (s)', 0.1, 20, 0.1)}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Color Over Life</strong></summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Sets particle color at birth and death. If colors are the same, a static color is used.</p>
                                        ${DebuggerUIBuilder._createColorPickerHTML(`${path}.color.start`, 'Start Color')}
                                        ${DebuggerUIBuilder._createColorPickerHTML(`${path}.color.end`, 'End Color')}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Alpha / Opacity</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.alpha.max`, 'Max Alpha', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.alpha.fadeIn`, 'FadeIn Time (%)', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.alpha.fadeOut`, 'FadeOut Time (%)', 0, 1, 0.01)}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.sizeMultiplier`, 'Global Size', 0.1, 10, 0.1, 'A global multiplier for particle size.')}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.start`, 'Start Scale Mult', 0, 2, 0.01, 'Particle size at birth (multiplied by Global Size).')}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.end`, 'End Scale Mult', 0, 2, 0.01, 'Particle size at death (multiplied by Global Size).')}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.scale.minMult`, 'Random Size Min', 0.1, 1, 0.01, 'Minimum random scale multiplier for each particle (from this value to 1.0).')}
                                    </div>
                                </details>
                                ${effectKey === 'glint' ? `
                                <details>
                                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(`${path}.rgbSplit.enabled`, 'RGB Split Effect', true)}</div></summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Applies a chromatic aberration effect to the particles.</p>
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.rgbSplit.amount`, 'Amount', 0, 10, 0.1)}
                                    </div>
                                </details>` : ''}
                            </div>
                        </details>
                        <details>
                            <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                            <div style="padding-left: 15px;">
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.speed.start`, 'Start Speed', -50, 50, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.speed.end`, 'End Speed', -50, 50, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.speed.minMult`, 'Random Speed Min', 0.1, 1, 0.01, 'Minimum random speed multiplier for each particle (from this value to 1.0).')}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(`${path}.rotation.enabled`, 'Tumbling / Rotation', true)}</div></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.rotation.minSpeed`, 'Min Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.rotation.maxSpeed`, 'Max Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                        ${DebuggerUIBuilder._createSliderHTML(`${path}.rotation.accel`, 'Rot. Accel.', -90, 90, 1, 'Degrees per second squared.')}
                                    </div>
                                </details>
                            </div>
                        </details>
                    `;

        // Special case for Fire Wind
        if (effectKey === 'fire') {
            content += `
                            <details id="details-fire-wind">
                                <summary><span class="accordion-toggle"></span>
                                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(`${path}.wind.enabled`, 'Complex Wind', true)}</div>
                                </summary>
                                <div style="padding-left: 15px;">
                                    <p class="description-text">Applies a dynamic wind force to all fire particles.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.force`, 'Wind Force', 0, 500, 5, 'How strongly the wind pushes the particles.')}
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.baseSpeed`, 'Base Speed', 0, 200, 1, 'The normal speed of the wind.')}
                                    ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustSpeed`, 'Gust Speed', 0, 500, 5, 'The peak speed during a gust.')}
                                    <details>
                                        <summary><span class="accordion-toggle"></span><strong>Gust Timing</strong></summary>
                                        <div style="padding-left: 15px;">
                                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustFrequencyMin`, 'Min Time Between Gusts (s)', 0.1, 20, 0.1)}
                                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustFrequencyMax`, 'Max Time Between Gusts (s)', 0.1, 20, 0.1)}
                                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustDurationMin`, 'Min Gust Duration (s)', 0.1, 5, 0.1)}
                                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.gustDurationMax`, 'Max Gust Duration (s)', 0.1, 5, 0.1)}
                                        </div>
                                    </details>
                                    <details>
                                        <summary><span class="accordion-toggle"></span><strong>Angle Change</strong></summary>
                                        <div style="padding-left: 15px;">
                                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.angleChangeFrequencyMin`, 'Min Time Between Changes (s)', 0.1, 30, 0.1)}
                                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.angleChangeFrequencyMax`, 'Max Time Between Changes (s)', 0.1, 30, 0.1)}
                                            ${DebuggerUIBuilder._createSliderHTML(`${path}.wind.angleChangeRange`, 'Max Angle Change ( )', 0, 90, 1, 'Max degrees the angle can shift each time.')}
                                        </div>
                                    </details>
                                </div>
                            </details>
                        `;
        }

        const mainAccordionPath = effectKey === 'fire' ? 'fire.particles.enabled' : `${path}.enabled`;
        const mainAccordionId = effectKey === 'fire' ? 'details-fire-particles' : `details-${effectKey}`;

        return DebuggerUIBuilder._createAccordionHTML(effectKey, definition.title, content).replace(`details-${effectKey}`, mainAccordionId).replace(`${path}.enabled`, mainAccordionPath);
    }

    updateTargets(targets, fullConfig) {
        this.destroyAllEmitters();

        this.config = foundry.utils.getProperty(fullConfig, this.definition.configPath);
        if (!fullConfig.enabled || !this.config?.enabled) {
            return;
        }

        // --- 1. Process File-Based Texture Targets ---
        let targetsToProcess = [];
        const spawnOn = this.definition.spawnOn;
        if (spawnOn === "tiles") {
            targetsToProcess = [...targets.tiles.values()];
        } else if (spawnOn === "background") {
            if (targets.background) {
                targetsToProcess = [targets.background];
            }
        } else {
            targetsToProcess = [targets.background, ...targets.tiles.values()].filter(Boolean);
        }

        for (const target of targetsToProcess) {
            const targetId = target.tile ? target.tile.id : 'background';
            if (target[this.definition.triggerTexture]) {
                this.pendingTargets.set(targetId, target);
            }
        }

        // --- 2. Process Geometry-Based Mask Targets ---
        const effectKey = this.definition.triggerTexture;
        const groups = MapPointsManager.getGroups();

        for (const group of Object.values(groups)) {
            if (group.isEffectSource && group.effectTarget === effectKey && group.points.length > 0 && !group.isBroken) {
                console.log(`Map Shine | Found active geometry group '${group.label}' for effect '${effectKey}'.`);
                // Create a "virtual target" that contains the group data itself.
                const virtualTarget = {
                    isGeometry: true,
                    group: group
                };
                const targetId = `geometry-${group.id}`;
                this.pendingTargets.set(targetId, virtualTarget);
            }
        }
    }

    async _createEmitterForTarget(targetData, targetId) {
        // --- NEW: Check if this is a geometry target ---
        if (targetData.isGeometry) {
            this._createEmitterForGeometry(targetData.group, targetId);
            return;
        }

        // --- Existing logic for texture-based targets ---
        let customMaskTexture = null;
        const localTargetData = {
            ...targetData
        };

        if (this.definition.configPath === 'dust' && localTargetData.dust && localTargetData.structural) {
            customMaskTexture = await CompositeMaskGenerator.generate(localTargetData.dust, localTargetData.structural, localTargetData.rect);
            if (customMaskTexture) {
                localTargetData.dust = customMaskTexture;
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
            if (customMaskTexture) emitter._customMaskTexture = customMaskTexture;
            emitter.autoUpdate = false;

            this.emitters.set(targetId, {
                emitter
            });
        } catch (err) {
            console.error(`Map Shine | Failed to load particle texture: "${particleTexPath}"`, err);
            customMaskTexture?.destroy(true);
        }
    }

    async _createEmitterForGeometry(group, targetId) {
        const particleTexPath = this.config.particleTexture ?? "modules/map-shine/assets/particle.webp";
        if (!particleTexPath || typeof particleTexPath !== 'string') return;

        try {
            const texture = await foundry.canvas.loadTexture(particleTexPath);
            const currentFullConfig = game.mapShine.profileManager.activeConfig;
            const currentEffectConfig = foundry.utils.getProperty(currentFullConfig, this.definition.configPath);

            if (!this.parentContainer || !currentFullConfig.enabled || !currentEffectConfig?.enabled) return;
            if (this.emitters.has(targetId)) return;

            // Build a simplified config, as we're not using a texture mask
            const emitterConfig = buildParticleEmitterConfig(currentEffectConfig, {
                // We provide a dummy rect, but the key is using the new shape type
                rect: {
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1
                }
            });

            // Find and replace the spawn shape behavior
            const spawnBehaviorIndex = emitterConfig.behaviors.findIndex(b => b.type === 'spawnShape');
            if (spawnBehaviorIndex !== -1) {
                emitterConfig.behaviors[spawnBehaviorIndex] = {
                    type: 'spawnShape',
                    config: {
                        type: 'geometryMask', // Use our new shape type
                        data: {
                            group: group // Pass the entire group object
                        }
                    }
                };
            }

            if (emitterConfig.maxParticles === 0) return;

            const textureBehavior = emitterConfig.behaviors.find(b => b.type === 'textureSingle');
            if (textureBehavior) textureBehavior.config.texture = texture;

            const emitterParent = this.particleOnlyContainer || this.parentContainer;
            const emitter = new PIXI.particles.Emitter(emitterParent, emitterConfig);
            emitter.autoUpdate = false;

            this.emitters.set(targetId, {
                emitter
            });
            console.log(`Map Shine | Created GEOMETRY-BASED '${this.definition.configPath}' emitter for group '${group.label}'.`);
        } catch (err) {
            console.error(`Map Shine | Failed to load particle texture for geometry emitter: "${particleTexPath}"`, err);
        }
    }

    update(deltaTime) {
        if (!this.pendingTargets || !this.emitters) return;

        if (this.pendingTargets.size > 0) {
            for (const [targetId, targetData] of this.pendingTargets.entries()) {
                this._createEmitterForTarget(targetData, targetId);
            }
            this.pendingTargets.clear();
        }

        for (const {
                emitter
            }
            of this.emitters.values()) {
            emitter.update(deltaTime);
        }
    }

    updateFromConfig(fullConfig) {
        this.config = foundry.utils.getProperty(fullConfig, this.definition.configPath);

        const controllerConfig = foundry.utils.getProperty(fullConfig, this.definition.configPath);
        const particleSystemConfig = fullConfig.particleSystems;
        this.parentContainer.visible = fullConfig.enabled && particleSystemConfig.enabled && controllerConfig?.enabled;

        if (this.particleOnlyContainer) {
            this.particleOnlyContainer.blendMode = this.config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
            this.parentContainer.blendMode = this.config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
        } else {
            this.parentContainer.blendMode = this.config?.blendMode ?? PIXI.BLEND_MODES.NORMAL;
        }

        let containerAlpha = 1.0;
        if (this.definition.configPath === 'glint' && this.config.darknessAffectsIntensity) {
            const darkness = canvas.scene?.environment.darknessLevel ?? 0;
            containerAlpha = 1.0 - darkness;
        }
        this.parentContainer.alpha = containerAlpha;

        if (this.rgbSplitFilter) {
            const rgbConfig = this.config?.rgbSplit;
            const shouldUseRgb = this.parentContainer.visible && rgbConfig?.enabled;
            if (shouldUseRgb) {
                this.rgbSplitFilter.enabled = true;
                this.rgbSplitFilter.uniforms.uAmount = rgbConfig.amount;
                const screen = canvas?.app?.screen;
                if (screen) {
                    this.rgbSplitFilter.uniforms.uTexelSize = [1 / screen.width, 1 / screen.height];
                }
                if (!this.parentContainer.filters?.includes(this.rgbSplitFilter)) {
                    this.parentContainer.filters = [...(this.parentContainer.filters || []), this.rgbSplitFilter];
                }
            } else {
                if (this.parentContainer.filters?.includes(this.rgbSplitFilter)) {
                    this.parentContainer.filters = this.parentContainer.filters.filter(f => f !== this.rgbSplitFilter);
                }
            }
        }

        if (this.bloomFilter) {
            const fireConfig = foundry.utils.getProperty(fullConfig, 'fire');
            const bloomConfig = fireConfig?.bloom;
            const shouldUseBloom = this.parentContainer.visible && bloomConfig?.enabled;

            if (shouldUseBloom) {
                this.bloomFilter.enabled = true;
                foundry.utils.mergeObject(this.bloomFilter, bloomConfig);
                if (!this.parentContainer.filters?.includes(this.bloomFilter)) {
                    this.parentContainer.filters = [...(this.parentContainer.filters || []), this.bloomFilter];
                }
                if (canvas?.app?.screen) {
                    this.parentContainer.filterArea = canvas.app.screen;
                }
            } else {
                if (this.parentContainer.filters?.includes(this.bloomFilter)) {
                    this.parentContainer.filters = this.parentContainer.filters.filter(f => f !== this.bloomFilter);
                }
                this.parentContainer.filterArea = null;
            }
        }
    }

    destroyAllEmitters() {
        if (!this.emitters) this.emitters = new Map();
        if (!this.pendingTargets) this.pendingTargets = new Map();

        for (const {
                emitter
            }
            of this.emitters.values()) {
            if (emitter._customMaskTexture) {
                emitter._customMaskTexture.destroy(true);
                emitter._customMaskTexture = null;
            }
            emitter.destroy();
        }
        this.emitters.clear();
        this.pendingTargets.clear();
    }

    destroy() {
        this.destroyAllEmitters();
        this.rgbSplitFilter?.destroy();
        this.bloomFilter?.destroy();

        this.particleOnlyContainer?.destroy({
            children: true
        });

        this.parentContainer = null;
    }
}

const buildSparkEmitterConfig = (effectConfig, targetData, maskKey) => {
    const globalParticleConfig = game.mapShine.profileManager.activeConfig.particleSystems;
    const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
    const config = effectConfig || {};
    const rect = targetData?.rect;

    if (!rect) {
        return {
            maxParticles: 0,
            behaviors: []
        };
    }

    const spawnMaskTexture = targetData[maskKey];
    if (!spawnMaskTexture) {
        return {
            maxParticles: 0,
            behaviors: []
        };
    }

    const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

    const spawnBehavior = {
        type: 'spawnShape',
        config: {
            type: 'textureMask',
            data: {
                texture: spawnMaskTexture,
                width: rect.width,
                height: rect.height,
                x: 0,
                y: 0,
                threshold: (config.maskThreshold ?? 0.95) * 255,
                isDynamicScreenMask: isScreenSpaceMask
            }
        }
    };

    const lifetimeConfig = config.lifetime ?? {};
    const alphaConfig = config.alpha ?? {};
    const scaleConfig = config.scale ?? {};
    const colorConfig = config.color ?? {};
    const pathConfig = config.path ?? {};
    const speedConfig = pathConfig.speed ?? {};

    let fadeInTime = Math.max(0, alphaConfig.fadeIn ?? 0.0);
    let fadeOutTime = Math.max(0, alphaConfig.fadeOut ?? 1.0);
    if (fadeInTime + fadeOutTime > 1.0) {
        const total = fadeInTime + fadeOutTime;
        fadeInTime /= total;
        fadeOutTime /= total;
    }

    const behaviors = [{
            type: 'textureSingle',
            config: {
                texture: config.particleTexture
            }
        },
        spawnBehavior,
        {
            type: 'alpha',
            config: {
                alpha: {
                    list: [{
                            value: 0,
                            time: 0
                        },
                        {
                            value: alphaConfig.max ?? 1.0,
                            time: fadeInTime
                        },
                        {
                            value: alphaConfig.max ?? 1.0,
                            time: 1.0 - fadeOutTime
                        },
                        {
                            value: 0,
                            time: 1
                        }
                    ]
                }
            }
        },
        {
            type: 'scale',
            config: {
                scale: {
                    list: [{
                            value: (scaleConfig.start ?? 1.0) * (scaleConfig.sizeMultiplier ?? 1.0),
                            time: 0
                        },
                        {
                            value: (scaleConfig.end ?? 0.1) * (scaleConfig.sizeMultiplier ?? 1.0),
                            time: 1
                        }
                    ]
                },
                minMult: scaleConfig.minMult ?? 0.5
            }
        },
        {
            type: 'color',
            config: {
                color: {
                    list: [{
                            value: colorConfig.start ?? "#FFFFFF",
                            time: 0
                        },
                        {
                            value: colorConfig.end ?? "#FFFFFF",
                            time: 1
                        }
                    ]
                }
            }
        },
        {
            type: 'sparkPath',
            config: {
                // This is now structured as an object with a 'list' property, matching other behaviors.
                speed: {
                    list: [{
                            value: speedConfig.start ?? 80,
                            time: 0
                        },
                        {
                            value: speedConfig.end ?? 40,
                            time: 1
                        }
                    ]
                },
                speedMinMult: speedConfig.minMult ?? 0.7,
                amplitude: pathConfig.amplitude ?? {
                    min: 10,
                    max: 40
                },
                frequency: pathConfig.frequency ?? {
                    min: 40,
                    max: 80
                },
                offset: pathConfig.offset ?? {
                    min: 0,
                    max: 6.28
                },
                damping: pathConfig.damping ?? 0.5,
                angle: pathConfig.angle ?? {
                    min: -20,
                    max: 20
                },
                motionBlur: pathConfig.motionBlur
            }
        }
    ];

    return {
        lifetime: {
            min: lifetimeConfig.min ?? 1.5,
            max: lifetimeConfig.max ?? 3.0
        },
        blendMode: config.blendMode ?? PIXI.BLEND_MODES.ADD,
        frequency: config.frequency / globalMultiplier,
        emitterLifetime: -1,
        maxParticles: Math.max(1, 2000 * (config.maskInfluence ?? 0.5) * globalMultiplier),
        pos: {
            x: isScreenSpaceMask ? 0 : rect.x,
            y: isScreenSpaceMask ? 0 : rect.y
        },
        addAtBack: false,
        behaviors: behaviors
    };
};

const buildParticleEmitterConfig = (effectConfig, targetData, maskKey) => {
    const globalParticleConfig = game.mapShine.profileManager.activeConfig.particleSystems;
    const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
    const config = effectConfig || {};
    const rect = targetData?.rect;

    if (!rect) {
        return {
            lifetime: {
                min: 1,
                max: 1
            },
            frequency: 9999,
            maxParticles: 0,
            behaviors: []
        };
    }

    const spawnMaskTexture = targetData[maskKey];
    // This check is now less strict. It's okay if a texture is missing,
    // as it might be a geometry-based emitter which doesn't have one.
    // The check for a valid rect is now the primary guard.

    // Determine if the mask is a pre-rendered screen-space texture.
    const isScreenSpaceMask = spawnMaskTexture instanceof PIXI.RenderTexture;

    const spawnBehavior = {
        type: 'spawnShape',
        config: {
            type: 'textureMask',
            data: {
                texture: spawnMaskTexture,
                width: rect.width,
                height: rect.height,
                x: 0,
                y: 0,
                threshold: (config.maskThreshold ?? 0.5) * 255,
                // Set the flag based on whether the mask is a screen-space RenderTexture.
                isDynamicScreenMask: isScreenSpaceMask
            }
        }
    };

    const behaviors = [{
            type: 'textureSingle',
            config: {
                texture: config.particleTexture ?? "modules/map-shine/assets/particle.webp"
            }
        },
        spawnBehavior
    ];

    const alphaConfig = config.alpha ?? {};
    let fadeInTime = Math.max(0, alphaConfig.fadeIn ?? 0.1);
    let fadeOutTime = Math.max(0, alphaConfig.fadeOut ?? 0.1);
    if (fadeInTime + fadeOutTime >= 1) {
        const total = fadeInTime + fadeOutTime;
        fadeInTime /= total;
        fadeOutTime /= total;
    }
    behaviors.push({
        type: 'alpha',
        config: {
            alpha: {
                list: [{
                        value: 0,
                        time: 0
                    },
                    {
                        value: alphaConfig.max ?? 0.7,
                        time: fadeInTime
                    },
                    {
                        value: alphaConfig.max ?? 0.7,
                        time: 1 - fadeOutTime
                    },
                    {
                        value: 0,
                        time: 1
                    }
                ]
            }
        }
    });

    const scaleConfig = config.scale ?? {};
    const startScale = (scaleConfig.start ?? 0.05) * (scaleConfig.sizeMultiplier ?? 1.0);
    const endScale = (scaleConfig.end ?? 0.15) * (scaleConfig.sizeMultiplier ?? 1.0);
    if (startScale === endScale) {
        behaviors.push({
            type: 'scaleStatic',
            config: {
                min: startScale,
                max: startScale
            }
        });
    } else {
        behaviors.push({
            type: 'scale',
            config: {
                scale: {
                    start: startScale,
                    end: endScale
                },
                minMult: scaleConfig.minMult ?? 0.5
            }
        });
    }

    const speedConfig = config.speed ?? {};
    const startSpeed = speedConfig.start ?? 5;
    const endSpeed = speedConfig.end ?? 15;
    if (startSpeed === endSpeed) {
        behaviors.push({
            type: 'moveSpeedStatic',
            config: {
                min: startSpeed,
                max: startSpeed
            }
        });
    } else {
        behaviors.push({
            type: 'moveSpeed',
            config: {
                speed: {
                    start: startSpeed,
                    end: endSpeed
                },
                minMult: speedConfig.minMult ?? 0.5
            }
        });
    }

    const colorConfig = config.color ?? {};
    const startColor = colorConfig.start ?? "#FFFFFF";
    const endColor = colorConfig.end ?? "#FFFFFF";
    if (startColor === endColor) {
        behaviors.push({
            type: 'colorStatic',
            config: {
                color: startColor
            }
        });
    } else {
        behaviors.push({
            type: 'color',
            config: {
                color: {
                    start: startColor,
                    end: endColor
                }
            }
        });
    }

    const rotConfig = config.rotation ?? {};
    if (rotConfig.enabled) {
        behaviors.push({
            type: 'rotation',
            config: {
                minStart: 0,
                maxStart: 360,
                minSpeed: rotConfig.minSpeed ?? 0,
                maxSpeed: rotConfig.maxSpeed ?? 20,
                accel: rotConfig.accel ?? 0
            }
        });
    } else {
        behaviors.push({
            type: 'rotationStatic',
            config: {
                min: 0,
                max: 360
            }
        });
    }

    const lifetimeConfig = config.lifetime ?? {};
    return {
        lifetime: {
            min: lifetimeConfig.min ?? 4,
            max: lifetimeConfig.max ?? 12
        },
        blendMode: config.blendMode ?? PIXI.BLEND_MODES.NORMAL, // This is the corrected line
        frequency: (config.frequency ?? 0.1) / globalMultiplier,
        emitterLifetime: -1,
        maxParticles: Math.max(1, 2000 * (config.maskInfluence ?? 1.0) * globalMultiplier),
        pos: {
            // If the mask is screen-space, the shape provides absolute world coordinates,
            // so the emitter's own position must be at the origin. Otherwise, use the
            // world position of the tile/background.
            x: isScreenSpaceMask ? 0 : rect.x,
            y: isScreenSpaceMask ? 0 : rect.y
        },
        addAtBack: false,
        behaviors: behaviors
    };
};

class ParticleManager {
    constructor() {
        this.masterContainer = new PIXI.Container();
        this.controllers = new Map();
    }

    get totalParticleCount() {
        let count = 0;
        for (const controller of this.controllers.values()) {
            for (const {
                    emitter
                }
                of controller.emitters.values()) {
                count += emitter.particleCount;
            }
        }
        return count;
    }

    initialize() {
        for (const [key, definition] of Object.entries(PARTICLE_EFFECT_DEFINITIONS)) {
            const effectContainer = new PIXI.Container();
            const controller = new ParticleEffectController(definition, effectContainer);
            this.controllers.set(key, controller);

            this.masterContainer.addChild(effectContainer);
        }
        console.log(`Map Shine | ParticleManager initialized with ${this.controllers.size} effect controllers.`);
    }

    updateEffectTargets(targets) {
        if (!this.controllers.size) return;
        const config = game.mapShine.profileManager.activeConfig;
        for (const controller of this.controllers.values()) {
            controller.updateTargets(targets, config);
        }
    }

    updateFromConfig(config) {
        for (const controller of this.controllers.values()) {
            controller.updateFromConfig(config);
        }
    }

    update(deltaTime) {
        for (const controller of this.controllers.values()) {
            controller.update(deltaTime);
        }
    }

    destroy() {
        for (const controller of this.controllers.values()) {
            controller.destroy();
        }
        this.controllers.clear();
        this.masterContainer?.destroy({
            children: true
        });
        console.log("Map Shine | ParticleManager destroyed.");
    }
}

class FireWindManager {
    constructor(config = {}) {
        this.config = config;

        this.angle = 0; // Current wind angle in degrees
        this.speed = config.baseSpeed || 50;

        this._targetAngle = 0;
        this._angleChangeTimer = 0;
        this._timeToNextAngleChange = this._getRandom(this.config.angleChangeFrequencyMin, this.config.angleChangeFrequencyMax);

        this._isGusting = false;
        this._gustTimer = 0;
        this._timeToNextGust = this._getRandom(this.config.gustFrequencyMin, this.config.gustFrequencyMax);
        this._gustDuration = 0;
    }

    destroy() {
        // No active listeners to remove, but this provides a consistent teardown point.
        // Future versions might add tickers or hooks that would be cleaned up here.
    }

    updateFromConfig(config) {
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        // This now correctly applies the timeFactor to the base config values each time it's called.
        // The time delta passed to update() is also scaled, so we no longer double-apply the time scaling.
        this.config = {
            ...config,
            baseSpeed: config.baseSpeed,
            gustSpeed: config.gustSpeed,
            // Frequencies are time between events, so they get longer as time slows down.
            gustFrequencyMin: config.gustFrequencyMin,
            gustFrequencyMax: config.gustFrequencyMax,
            gustDurationMin: config.gustDurationMin,
            gustDurationMax: config.gustDurationMax,
            angleChangeFrequencyMin: config.angleChangeFrequencyMin,
            angleChangeFrequencyMax: config.angleChangeFrequencyMax
        };
    }

    update(delta) {
        // --- Angle Update Logic ---
        this._angleChangeTimer += delta;
        if (this._angleChangeTimer >= this._timeToNextAngleChange) {
            const range = this.config.angleChangeRange || 20;
            this._targetAngle = this.angle + this._getRandom(-range, range);
            this._timeToNextAngleChange = this._getRandom(this.config.angleChangeFrequencyMin, this.config.angleChangeFrequencyMax);
            this._angleChangeTimer = 0;
        }
        // Lerp angle towards target
        this.angle += (this._targetAngle - this.angle) * 0.01;

        // --- Gust Update Logic ---
        this._gustTimer += delta;
        if (this._isGusting) {
            if (this._gustTimer >= this._gustDuration) {
                this._isGusting = false;
                this._gustTimer = 0;
                this._timeToNextGust = this._getRandom(this.config.gustFrequencyMin, this.config.gustFrequencyMax);
            }
        } else {
            if (this._gustTimer >= this._timeToNextGust) {
                this._isGusting = true;
                this._gustTimer = 0;
                this._gustDuration = this._getRandom(this.config.gustDurationMin, this.config.gustDurationMax);
            }
        }

        // Lerp speed towards base or gust speed
        const targetSpeed = this._isGusting ? this.config.gustSpeed : this.config.baseSpeed;
        this.speed += (targetSpeed - this.speed) * 0.1;
    }

    _getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }
}

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
            console.error("TextureMaskShape | No texture source provided in config.");
            this.texture = PIXI.Texture.EMPTY;
            return;
        }

        if (textureSource instanceof PIXI.Texture) {
            this.texture = textureSource;
            if (this.texture.baseTexture.valid) {
                this._compileValidPoints();
            } else {
                this.texture.baseTexture.once('loaded', () => this._compileValidPoints());
                this.texture.baseTexture.once('error', (bt, err) => console.error(`TextureMaskShape | PIXI.Texture failed to load`, err));
            }
        } else if (typeof textureSource === 'string') {
            foundry.canvas.loadTexture(textureSource).then(texture => {
                this.texture = texture;
                this._compileValidPoints();
            }).catch(err => {
                console.error(`TextureMaskShape | Failed to load texture from path: ${textureSource}`, err);
                this.texture = PIXI.Texture.EMPTY;
            });
        } else {
            console.warn("TextureMaskShape | Unknown texture source type provided:", textureSource);
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

        const renderTexture = PIXI.RenderTexture.create({
            width: texture.width,
            height: texture.height
        });
        const sprite = new PIXI.Sprite(texture);
        renderer.render(sprite, {
            renderTexture: renderTexture,
            clear: true
        });
        const pixelData = renderer.extract.pixels(renderTexture);
        sprite.destroy();

        if (this.isDynamicScreenMask) {
            // Path for dynamic, screen-sized masks (like animated foam).
            // Iterates through the screen-space texture and converts valid pixel locations
            // back to world-space for particle spawning.
            for (let y = 0; y < texture.height; y += step) {
                for (let x = 0; x < texture.width; x += step) {
                    const index = (y * texture.width + x) * 4;
                    const pixelValue = pixelData[index]; // Use red channel for grayscale
                    if (pixelValue >= this.threshold) {
                        const screenPoint = new PIXI.Point(x, y);
                        const worldPoint = canvas.stage.toLocal(screenPoint);
                        this.validPoints.push(worldPoint);
                    }
                }
            }
        } else {
            // Path for static, world-aligned masks (like a _Dust.webp on a tile).
            // Iterates through the mask texture and maps its local coordinates to the
            // world-space rectangle defined by the tile's position and dimensions.
            for (let y = 0; y < texture.height; y += step) {
                for (let x = 0; x < texture.width; x += step) {
                    const index = (y * texture.width + x) * 4;
                    const pixelValue = pixelData[index]; // Use red channel for grayscale
                    if (pixelValue >= this.threshold) {
                        const relativeX = (x / texture.width) * this.width;
                        const relativeY = (y / texture.height) * this.height;
                        const worldX = this.offsetX + relativeX;
                        const worldY = this.offsetY + relativeY;
                        this.validPoints.push(new PIXI.Point(worldX, worldY));
                    }
                }
            }
        }
        renderTexture.destroy(true); // Clean up the temporary texture
    }

    getRandPos(particle) {
        if (this.validPoints.length === 0) {
            return;
        }
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
        this.group = config.group; // Expects a full map point group object
        this._points = this.group.points || [];
        this._type = this.group.type || 'point';

        // Pre-calculate bounding box for area sampling to improve performance.
        if (this._type === 'area' && this._points.length > 0) {
            let minX = this._points[0].x,
                maxX = this._points[0].x;
            let minY = this._points[0].y,
                maxY = this._points[0].y;
            for (let i = 1; i < this._points.length; i++) {
                minX = Math.min(minX, this._points[i].x);
                maxX = Math.max(maxX, this._points[i].x);
                minY = Math.min(minY, this._points[i].y);
                maxY = Math.max(maxY, this._points[i].y);
            }
            this._bounds = {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        }
    }

    /**
     * Checks if a point is inside a polygon using the ray-casting algorithm.
     * @param {PIXI.Point} point The point to check.
     * @returns {boolean} True if the point is inside, false otherwise.
     */
    _isPointInPolygon(point) {
        let isInside = false;
        const points = this._points;
        const n = points.length;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = points[i].x,
                yi = points[i].y;
            const xj = points[j].x,
                yj = points[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y)) &&
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) isInside = !isInside;
        }
        return isInside;
    }

    /**
     * Called by the particle emitter to get a random position for a new particle.
     * @param {PIXI.particles.Particle} particle - The particle to position.
     */
    getRandPos(particle) {
        if (!this._points || this._points.length === 0) return;

        let p = new PIXI.Point(0, 0);

        switch (this._type) {
            case 'point': {
                p = this._points[Math.floor(Math.random() * this._points.length)];
                break;
            }
            case 'line': {
                if (this._points.length < 2) {
                    p = this._points[0];
                    break;
                }
                const segmentIndex = Math.floor(Math.random() * (this._points.length - 1));
                const p1 = this._points[segmentIndex];
                const p2 = this._points[segmentIndex + 1];
                const t = Math.random();
                p.x = p1.x + t * (p2.x - p1.x);
                p.y = p1.y + t * (p2.y - p1.y);
                break;
            }
            case 'area': {
                if (this._points.length < 3 || !this._bounds) return;

                // Use rejection sampling within the bounding box. It's fast enough for this purpose.
                let attempts = 0;
                const MAX_ATTEMPTS = 50;
                do {
                    p.x = this._bounds.x + Math.random() * this._bounds.width;
                    p.y = this._bounds.y + Math.random() * this._bounds.height;
                    attempts++;
                } while (!this._isPointInPolygon(p) && attempts < MAX_ATTEMPTS);

                // If we fail after many attempts (e.g., for a very complex, spiky polygon),
                // just fall back to picking a vertex to ensure a particle still spawns.
                if (attempts >= MAX_ATTEMPTS) {
                    p = this._points[Math.floor(Math.random() * this._points.length)];
                }
                break;
            }
        }
        particle.position.copyFrom(p);
    }
}

class ParticleLayer extends CanvasLayer {
    constructor() {
        super();
        this._onAnimateBound = null;
        this._destroyed = false;
        this._onMapPointsUpdatedBound = null;
        this._initialized = false; // Flag to ensure one-time setup
    }

    async _draw(options) {
        this._destroyed = false;
        this._initialized = false; // Reset flag for new scene

        game.mapShine.particleManager = new ParticleManager();
        this.addChild(game.mapShine.particleManager.masterContainer);
        game.mapShine.particleManager.initialize();

        this._onAnimateBound = this._onAnimate.bind(this);
        canvas.app.ticker.add(this._onAnimateBound);

        // Bind and register the listener for map point updates.
        this._onMapPointsUpdatedBound = this._onMapPointsUpdated.bind(this);
        Hooks.on("mapShine:mapPointsUpdated", this._onMapPointsUpdatedBound);
    }

    async _tearDown(options) {
        if (this._destroyed) return;
        this._destroyed = true;

        if (this._onAnimateBound) {
            canvas.app.ticker.remove(this._onAnimateBound);
        }

        // Unregister the listener for map point updates to prevent memory leaks.
        if (this._onMapPointsUpdatedBound) {
            Hooks.off("mapShine:mapPointsUpdated", this._onMapPointsUpdatedBound);
        }

        if (game.mapShine.particleManager) {
            game.mapShine.particleManager.destroy();
            game.mapShine.particleManager = null;
        }

        return super._tearDown(options);
    }

    /**
     * Handler for when map point geometry is changed. This triggers a full refresh
     * of all particle emitters to ensure they use the latest mask data.
     */
    _onMapPointsUpdated() {
        console.log("Map Shine | ParticleLayer detected map point update. Refreshing particle targets.");
        if (game.mapShine.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }

    _onAnimate(deltaTime) {
        if (this._destroyed || !game.mapShine.particleManager) return;

        // --- ONE-TIME INITIALIZATION ---
        // This block ensures that the initial creation of all particle emitters happens only
        // after all other systems have finished their setup and a short delay has passed
        // to allow for GPU and data loading to stabilize.
        if (!this._initialized && game.mapShine.systemsReady) {
            this._initialized = true; // Set flag immediately to prevent this from running again.

            console.log("Map Shine | ParticleLayer is ready. Delaying initial particle setup for system stability.");

            setTimeout(() => {
                if (this._destroyed) return; // Abort if the layer was torn down during the delay.

                console.log("Map Shine | Performing delayed initial effect target update.");
                if (game.mapShine.effectTargetManager?.targets) {
                    this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
                }
            }, 4500); // 4.5 second delay which is proven to be stable.
        }
        // --- END INITIALIZATION ---

        // Update the geometry mask system first. This is where the polling for map point data occurs.
        // If it finds new data, it will fire the `mapShine:mapPointsUpdated` hook, which
        // will trigger another call to `updateEffectTargets` to correctly rebuild the emitters.
        game.mapShine.geometryMaskManager?.update();

        // Tick the particle simulation forward.
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const deltaInSeconds = (deltaTime / canvas.app.ticker.FPS) * timeFactor;

        if (game.mapShine.fireWindManager) {
            game.mapShine.fireWindManager.update(deltaInSeconds);
        }

        game.mapShine.particleManager.update(deltaInSeconds);
    }

    async updateEffectTargets(targets) {
        if (game.mapShine.particleManager) {
            // This method internally fetches the latest config to decide what to create.
            game.mapShine.particleManager.updateEffectTargets(targets);
        }
    }

    async updateFromConfig(config, options = {}) {
        if (game.mapShine.particleManager) {
            // Always update the live properties (like blend mode, visibility, etc.)
            // of any emitters that already exist. This is non-destructive.
            game.mapShine.particleManager.updateFromConfig(config);

            // ONLY if this is a full update (not just a time or lighting change),
            // re-evaluate which emitters should exist. This is the destructive part.
            if (!options?.timeOnly && !options?.lightingOnly) {
                const targets = game.mapShine.effectTargetManager.targets;
                if (targets) {
                    this.updateEffectTargets(targets);
                }
            }
        }
    }
}

class SparkPathBehavior {
    static type = 'sparkPath';

    constructor(config) {
        this.order = PIXI.particles.behaviors.BehaviorOrder.Late;
        this.config = config;
        this.speed = new PIXI.particles.PropertyList(false);
        // Check for a 'speed' property in the config, which should be an object
        // suitable for PropertyNode.createList (e.g., { list: [...] } or { start, end }).
        if (this.config.speed) {
            this.speed.reset(PIXI.particles.PropertyNode.createList(this.config.speed));
        } else {
            console.warn("MapShine | SparkPathBehavior received no speed config, using fallback.");
            // Create a default list for the fallback, wrapped in an object.
            this.speed.reset(PIXI.particles.PropertyNode.createList({
                list: [{
                    value: 50,
                    time: 0
                }, {
                    value: 50,
                    time: 1
                }]
            }));
        }
    }

    initParticles(first) {
        let next = first;
        while (next) {
            const config = this.config;
            const pConfig = next.config || (next.config = {});

            pConfig.initRotation = next.rotation + this._getRandom(config.angle.min, config.angle.max) * (Math.PI / 180);
            pConfig.initPosition = new PIXI.Point(next.x, next.y);
            // Store the initial position to calculate the first frame's direction.
            next.oldPosition = new PIXI.Point(next.x, next.y);
            pConfig.movement = 0;

            pConfig.pathAmplitude = this._getRandom(config.amplitude.min, config.amplitude.max);
            pConfig.pathFrequency = this._getRandom(config.frequency.min, config.frequency.max);
            pConfig.pathOffset = this._getRandom(config.offset.min, config.offset.max);
            pConfig.pathDamping = config.damping ?? 0.5;

            // Add swirl parameters. These are derived from the main path parameters to create
            // a secondary, faster, smaller circular motion that generates loops.
            pConfig.swirlRadius = pConfig.pathAmplitude * this._getRandom(0.4, 0.8);
            pConfig.swirlFrequency = pConfig.pathFrequency * this._getRandom(0.3, 0.6);
            pConfig.swirlOffset = this._getRandom(0, Math.PI * 2);

            // Pre-calculate the initial state of the swirl to ensure the path starts at a zero offset.
            pConfig.swirlInitialSin = Math.sin(pConfig.swirlOffset);
            pConfig.swirlInitialCos = Math.cos(pConfig.swirlOffset);

            // Use the separate speed multiplier property.
            pConfig.speedMult = this._getRandom(config.speedMinMult, 1);

            next = next.next;
        }
    }

    updateParticle(particle, deltaSec) {
        if (!particle.config.initPosition) {
            return;
        }

        const pConfig = particle.config;

        const speed = this.speed.interpolate(particle.agePercent) * pConfig.speedMult;
        pConfig.movement += speed * deltaSec;

        // Damping affects both the main wave and the swirl, making the path straighten out over time.
        const dampingFactor = (1.0 - (pConfig.pathDamping * particle.agePercent));
        const amplitude = pConfig.pathAmplitude * dampingFactor;
        const swirlRadius = pConfig.swirlRadius * dampingFactor;

        const forward_dist = pConfig.movement;

        // Primary sideways oscillation (the original sine wave)
        const main_t = (forward_dist / pConfig.pathFrequency) + pConfig.pathOffset;
        const main_y = amplitude * (Math.sin(main_t) - Math.sin(pConfig.pathOffset));

        // Secondary circular "swirl" motion to create loops and turbulence
        const swirl_t = (forward_dist / pConfig.swirlFrequency) + pConfig.swirlOffset;
        // Subtract the initial sin/cos values to make the swirl relative to the start point.
        const swirl_x = swirlRadius * (Math.sin(swirl_t) - pConfig.swirlInitialSin);
        const swirl_y = swirlRadius * (Math.cos(swirl_t) - pConfig.swirlInitialCos);

        // Combine the motions: forward motion is now perturbed by the swirl's x-component.
        // The final y is a combination of the main wave and the swirl's y-component.
        const x = forward_dist + swirl_x;
        const y = main_y + swirl_y;

        const helperPoint = new PIXI.Point(x, y);

        if (pConfig.initRotation !== 0) {
            const s = Math.sin(pConfig.initRotation);
            const c = Math.cos(pConfig.initRotation);
            const xnew = (helperPoint.x * c) - (helperPoint.y * s);
            const ynew = (helperPoint.x * s) + (helperPoint.y * c);
            helperPoint.x = xnew;
            helperPoint.y = ynew;
        }

        particle.position.x = pConfig.initPosition.x + helperPoint.x;
        particle.position.y = pConfig.initPosition.y + helperPoint.y;

        // Calculate direction and apply rotation
        const dx = particle.position.x - particle.oldPosition.x;
        const dy = particle.position.y - particle.oldPosition.y;

        // Only update rotation if the particle has moved a meaningful amount
        // to prevent jerky rotation at low speeds.
        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            particle.rotation = Math.atan2(dy, dx);
        }

        const mbConfig = this.config.motionBlur;
        if (mbConfig && mbConfig.enabled) {
            // The actual distance moved in this frame.
            const frameSpeed = Math.sqrt(dx * dx + dy * dy);
            let elongation = frameSpeed * mbConfig.strength;

            elongation = Math.min(elongation, mbConfig.maxLength);

            // The 'scale' behavior runs before this one and sets both scale.x and scale.y.
            // We'll use scale.y as the base width and elongate scale.x.
            const baseScale = particle.scale.y;
            particle.scale.x = baseScale + elongation;
        }

        // Update oldPosition for the next frame
        particle.oldPosition.copyFrom(particle.position);
    }

    _getRandom(min, max) {
        if (min === max) return min;
        return Math.random() * (max - min) + min;
    }
}

// =================================================================================
// SECTION 4: GENERIC FILTERS
// =================================================================================
// Description: Reusable PIXI.Filter classes used by various layers or as
//              global post-processing effects.
// ---------------------------------------------------------------------------------

class NoisePatternFilter extends PIXI.Filter {
    constructor(options) {
        const fragmentSrc = `
                        precision mediump float; 
                        varying vec2 vTextureCoord;

                        uniform float u_time; 
                        uniform vec2 u_resolution;
                        uniform float u_speed, u_scale, u_threshold, u_brightness, u_contrast, u_softness;
                        uniform float u_evolution;
                        
                        // New uniforms for world-space mode
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
                                // Apply animation directly to the world coordinates to ensure stability.
                                // A multiplier is used to make the UI speed value more intuitive.
                                world_coord.x += u_time * u_speed * 10.0;

                                // Use a large divisor to keep the user-facing scale value in a reasonable range (e.g., 0.1-10)
                                uv = world_coord * u_scale / 1000.0;
                            } else {
                                // Original screen-space calculation
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
                        }
                    `;

        const newOptions = {
            ...options,
            u_evolution: options.u_evolution ?? 0.0,
            u_isWorldSpace: options.u_isWorldSpace ?? false,
            u_camera_offset: options.u_camera_offset ?? [0, 0],
            u_view_size: options.u_view_size ?? [0, 0],
        };
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, newOptions);
    }
}

class ParallaxMaskFilter extends PIXI.Filter {
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

                    uniform sampler2D uMask;
                    uniform float uParallax;
                    uniform vec2 uCameraOffset;
                    uniform vec2 uViewSize;

                    void main() {
                        vec2 parallaxTexCoord = vScreenCoord;
                        if (uParallax > 0.0 && uViewSize.y > 0.0) {
                            vec2 normalized_camera_offset_pixels = uCameraOffset / uViewSize;
                            parallaxTexCoord = vScreenCoord - (normalized_camera_offset_pixels * uParallax);
                        }
                        gl_FragColor = texture2D(uMask, parallaxTexCoord);
                    }
                `;
        super(vertexSrc, fragmentSrc, {
            uMask: PIXI.Texture.EMPTY,
            uParallax: options.parallax ?? 0.0,
            uCameraOffset: [0, 0],
            uViewSize: [1, 1]
        });
    }
}

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
                        }
                    `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uLuminanceThreshold: options.luminanceThreshold ?? 0.25,
            uSoftness: options.softness ?? 0.1,
            uInvert: options.invert ?? false,
        });
    }
}

class CorrectedIlluminationFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
                    precision mediump float;
                    varying vec2 vTextureCoord;

                    uniform sampler2D uIlluminationBuffer;
                    uniform sampler2D uOutdoorsMask;

                    uniform bool uHasGlobalIllumination;
                    uniform vec3 uSunlightColor;
                    
                    void main(void) {
                        // Get the total light from the original buffer.
                        vec3 totalLight = texture2D(uIlluminationBuffer, vTextureCoord).rgb;
                        
                        // If there's no sunlight in the scene, there's nothing to correct.
                        if ( !uHasGlobalIllumination ) {
                            gl_FragColor = vec4(totalLight, 1.0);
                            return;
                        }
                        
                        // Get the outdoors mask value. 1.0 means fully outdoors, 0.0 means indoors.
                        float outdoorsAmount = texture2D(uOutdoorsMask, vTextureCoord).r;

                        // Calculate how much sunlight to subtract.
                        // We subtract the full sunlight color in indoor areas (outdoorsAmount = 0)
                        // and zero sunlight in outdoor areas (outdoorsAmount = 1).
                        vec3 sunlightToSubtract = uSunlightColor * (1.0 - outdoorsAmount);

                        // Subtract the sunlight from the total light, ensuring we don't go below zero.
                        vec3 correctedLight = max(vec3(0.0), totalLight - sunlightToSubtract);
                        
                        gl_FragColor = vec4(correctedLight, 1.0);
                    }
                `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uIlluminationBuffer: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            uHasGlobalIllumination: false,
            uSunlightColor: [1.0, 1.0, 1.0],
            ...options
        });
    }
}

class ColorCorrectionFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
                        precision mediump float;
                        varying vec2 vTextureCoord;

                        uniform sampler2D uSampler;
                        uniform sampler2D uMaskTexture;

                        uniform sampler2D uAmbientCompositeTexture;
                        uniform bool uAmbientCompositeEnabled;
                        uniform int uAmbientCompositeBlendMode;

                        uniform sampler2D uAmbientIlluminationMask;
                        uniform bool uAmbientIlluminationMaskEnabled;

                        uniform float uSaturation, uBrightness, uContrast;
                        uniform float uExposure, uGamma, uInBlack, uInWhite;
                        uniform float uTemperature, uWbTint;
                        uniform bool uInvert;
                        uniform vec3 uTintColor;
                        uniform float uTintAmount;
                        uniform bool uMaskEnabled;
                        
                        // Selective Color Uniforms
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

                        uniform bool uCanopyHighlightsEnabled;
                        uniform sampler2D uCanopyHighlightsMask;
                        uniform float uCanopyHighlightsBrightness;
                        uniform sampler2D uCanopyOutdoorsMask;
                        uniform bool uCanopyOutdoorsMaskEnabled;

                        uniform bool uStructuralHighlightsEnabled;
                        uniform sampler2D uStructuralHighlightsMask;
                        uniform float uStructuralHighlightsBrightness;
                        uniform sampler2D uStructuralOutdoorsMask;
                        uniform bool uStructuralOutdoorsMaskEnabled;

                        uniform bool uStructuralSplitHighlightsEnabled;
                        uniform sampler2D uStructuralSplitHighlightsMask;

                        uniform float uIntensity;
                        uniform vec4 uSceneRectNorm;

                        uniform float uDynamicExposureBoost;
                        uniform float uDynamicContrastBoost;

                        // --- NEW: Illumination Mix-In Uniforms ---
                        uniform sampler2D uIllumTexture;
                        uniform bool uIllumEnabled;
                        uniform float uIllumIntensity;
                        uniform int uIllumBlendMode;
                        uniform bool uIllumCCEnabled;
                        uniform float uIllumSaturation, uIllumBrightness, uIllumContrast;
                        uniform float uIllumExposure, uIllumGamma;
                        uniform vec3 uIllumTintColor;
                        uniform float uIllumTintAmount;
                        uniform bool uIllumNoiseEnabled;
                        uniform float uIllumNoiseAmount;
                        uniform float uIllumNoiseScale;
                        uniform float uIllumTime;
                        uniform bool uIllumDebugMode;
                        uniform bool uIllumNegativeMaskEnabled;
                        uniform float uIllumNegativeMaskThreshold;
                        uniform float uIllumNegativeMaskSoftness;


                        const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                        vec3 rgb2hsl(vec3 c) {
                            float max_c = max(max(c.r, c.g), c.b);
                            float min_c = min(min(c.r, c.g), c.b);
                            float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                            if (max_c != min_c) {
                                float d = max_c - min_c;
                                s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                                if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                                else if (max_c == c.g) h = (c.b - c.r) / d + 2.0;
                                else h = (c.r - c.g) / d + 4.0;
                                h /= 6.0;
                            }
                            return vec3(h, s, l);
                        }

                        float hue2rgb(float p, float q, float t) {
                            if (t < 0.0) t += 1.0;
                            if (t > 1.0) t -= 1.0;
                            if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                            if (t < 1.0/2.0) return q;
                            if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                            return p;
                        }

                        vec3 hsl2rgb(vec3 c) {
                            if (c.y == 0.0) return vec3(c.z);
                            float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
                            float p = 2.0 * c.z - q;
                            return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0));
                        }

                        vec3 applyCurves(vec3 color, sampler2D lut) {
                            color.r = texture2D(lut, vec2(color.r, 0.5)).r;
                            color.g = texture2D(lut, vec2(color.g, 0.5)).g;
                            color.b = texture2D(lut, vec2(color.b, 0.5)).b;
                            return color;
                        }

                        vec3 applyWhiteBalance(vec3 color, float temp, float green_tint) {
                            const float STRENGTH = 0.5;
                            color.r += temp * (color.r * (1.0 - color.r)) * STRENGTH;
                            color.b -= temp * (color.b * (1.0 - color.b)) * STRENGTH;
                            color.g += green_tint * (color.g * (1.0 - color.g)) * STRENGTH;
                            return color;
                        }

                        // --- NEW: Noise functions for Illumination ---
                        float random(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                        }
                        float noise(vec2 st) {
                            vec2 i = floor(st);
                            vec2 f = fract(st);
                            vec2 u = f * f * (3.0 - 2.0 * f);
                            return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                                    mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
                        }

                        void main(void) {
                            // --- 1. Base Color Correction Pass ---
                            vec4 originalColor = texture2D(uSampler, vTextureCoord);

                            vec3 workingColor = originalColor.rgb;
                            if (originalColor.a > 0.0) {
                                workingColor /= originalColor.a;
                            }

                            vec3 uncorrectedColor = workingColor; 

                            if (uSelectiveEnabled) {
                                vec3 pixel_hsl = rgb2hsl(workingColor);
                                vec3 target_hsl = rgb2hsl(uSelectiveColor);

                                float hue_dist = min(abs(pixel_hsl.x - target_hsl.x), 1.0 - abs(pixel_hsl.x - target_hsl.x));
                                float hue_mask = 1.0 - smoothstep(uSelectiveHueRange, uSelectiveHueRange + uSelectiveSoftness, hue_dist);

                                float sat_dist = abs(pixel_hsl.y - target_hsl.y);
                                float sat_mask = 1.0 - smoothstep(uSelectiveSatRange, uSelectiveSatRange + uSelectiveSoftness, sat_dist);
                                
                                float lum_dist = abs(pixel_hsl.z - uSelectiveTargetLum);
                                float lum_mask = 1.0 - smoothstep(uSelectiveLumRange, uSelectiveLumRange + uSelectiveSoftness, lum_dist);
                                
                                float selection_mask = hue_mask * sat_mask * lum_mask;
                                
                                if (uSelectiveInvert) {
                                    selection_mask = 1.0 - selection_mask;
                                }

                                vec3 desaturated_color = vec3(dot(workingColor, lum_weights));
                                workingColor = mix(mix(desaturated_color, workingColor, 1.0 - uSelectiveDesaturation), workingColor, selection_mask);
                                
                                if (selection_mask > 0.0) {
                                    vec3 current_hsl = rgb2hsl(workingColor);
                                    current_hsl.y *= uSelectiveTargetSaturation;
                                    current_hsl.z = clamp(current_hsl.z + uSelectiveTargetBrightness, 0.0, 1.0);
                                    vec3 adjusted_color = hsl2rgb(current_hsl);
                                    workingColor = mix(workingColor, adjusted_color, selection_mask);
                                }
                            }

                            if (uInWhite > uInBlack) workingColor = (workingColor - uInBlack) / (uInWhite - uInBlack + 0.00001);
                            
                            // The highlight preservation logic has been removed as it was based on an incorrect luminance source.
                            // The dynamic exposure boost is now applied directly as calculated by the manager.
                            workingColor *= pow(2.0, uExposure + uDynamicExposureBoost);

                            workingColor = applyWhiteBalance(workingColor, uTemperature, uWbTint);
                            
                            if (uGamma > 0.0) workingColor = pow(max(workingColor, 0.0), vec3(1.0 / uGamma));

                            if (uCurvesEnabled) {
                                workingColor = applyCurves(workingColor, uCurveLUT);
                            }
                            
                            workingColor += uBrightness;
                            workingColor = (workingColor - 0.5) * (uContrast * uDynamicContrastBoost) + 0.5;
                            float final_luminance = dot(workingColor, lum_weights);
                            workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                            workingColor = mix(workingColor, uTintColor, uTintAmount);
                            if (uInvert) workingColor = 1.0 - workingColor;

                            vec3 final_rgb = mix(uncorrectedColor, workingColor, uIntensity);

                            if (uMaskEnabled) {
                                float maskValue = texture2D(uMaskTexture, vTextureCoord).r;
                                final_rgb = mix(uncorrectedColor, final_rgb, maskValue);
                            }
                            
                            vec2 sceneMin = uSceneRectNorm.xy;
                            vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
                            bool isInsideScene = vTextureCoord.x >= sceneMin.x && vTextureCoord.x < sceneMax.x &&
                                                vTextureCoord.y >= sceneMin.y && vTextureCoord.y < sceneMax.y;

                            if (isInsideScene) {
                                if (uCloudHighlightsEnabled) {
                                    float lightAmount = texture2D(uCloudHighlightsMask, vTextureCoord).r;
                                    final_rgb *= (1.0 + uCloudHighlightsBrightness * lightAmount);
                                }
                                if (uCanopyHighlightsEnabled) {
                                    float lightAmount = texture2D(uCanopyHighlightsMask, vTextureCoord).r;
                                    if (uCanopyOutdoorsMaskEnabled) {
                                        lightAmount *= texture2D(uCanopyOutdoorsMask, vTextureCoord).r;
                                    }
                                    final_rgb *= (1.0 + uCanopyHighlightsBrightness * lightAmount);
                                }
                                
                                if (uStructuralHighlightsEnabled) {
                                    if (uStructuralSplitHighlightsEnabled) {
                                        vec3 splitLight = texture2D(uStructuralSplitHighlightsMask, vTextureCoord).rgb;
                                        if (uStructuralOutdoorsMaskEnabled) {
                                            splitLight *= (1.0 - texture2D(uStructuralOutdoorsMask, vTextureCoord).r);
                                        }
                                        vec3 highlightBoost = splitLight * uStructuralHighlightsBrightness;
                                        final_rgb *= (vec3(1.0) + highlightBoost);
                                    } else {
                                        float lightAmount = texture2D(uStructuralHighlightsMask, vTextureCoord).r;
                                        if (uStructuralOutdoorsMaskEnabled) {
                                            lightAmount *= (1.0 - texture2D(uStructuralOutdoorsMask, vTextureCoord).r);
                                        }
                                        final_rgb *= (1.0 + uStructuralHighlightsBrightness * lightAmount);
                                    }
                                }
                            }

                            if (uAmbientCompositeEnabled) {
                                vec4 ambient = texture2D(uAmbientCompositeTexture, vTextureCoord);
                                if (ambient.a > 0.0) {
                                    float lightMask = 1.0;
                                    if (uAmbientIlluminationMaskEnabled) {
                                        lightMask = dot(texture2D(uAmbientIlluminationMask, vTextureCoord).rgb, lum_weights);
                                    }
                                    vec3 ambientRGB = (ambient.rgb / ambient.a) * lightMask;
                                    if (uAmbientCompositeBlendMode == 1) { 
                                        final_rgb += ambientRGB;
                                    } else if (uAmbientCompositeBlendMode == 2) { 
                                        final_rgb *= ambientRGB;
                                    } else if (uAmbientCompositeBlendMode == 3) { 
                                        final_rgb = 1.0 - (1.0 - final_rgb) * (1.0 - ambientRGB);
                                    } else { 
                                        final_rgb = mix(final_rgb, ambientRGB, ambient.a);
                                    }
                                }
                            }

                            // --- 2. Illumination Mix-in Pass ---
                            if (uIllumEnabled) {
                                vec2 illumUV = vTextureCoord;
                                vec3 illumSample = texture2D(uIllumTexture, illumUV).rgb;
                                
                                if (uIllumDebugMode) {
                                    final_rgb = illumSample;
                                } else {
                                    if (uIllumCCEnabled) {
                                        illumSample *= pow(2.0, uIllumExposure);
                                        if (uIllumGamma > 0.0) illumSample = pow(max(illumSample, 0.0), vec3(1.0 / uIllumGamma));
                                        illumSample += uIllumBrightness;
                                        illumSample = (illumSample - 0.5) * uIllumContrast + 0.5;
                                        float illumLuminance = dot(illumSample, lum_weights);
                                        illumSample = mix(vec3(illumLuminance), illumSample, uIllumSaturation);
                                        illumSample = mix(illumSample, uIllumTintColor, uIllumTintAmount);
                                    }

                                    if (uIllumNegativeMaskEnabled) {
                                        float sceneLuminance = dot(final_rgb, lum_weights);
                                        float negativeMask = 1.0 - smoothstep(uIllumNegativeMaskThreshold, uIllumNegativeMaskThreshold + uIllumNegativeMaskSoftness, sceneLuminance);
                                        illumSample *= negativeMask;
                                    }
                                    
                                    if (uIllumNoiseEnabled && uIllumNoiseAmount > 0.0) {
                                        vec2 noiseCoord = illumUV * uIllumNoiseScale + uIllumTime;
                                        float noiseValue = (noise(noiseCoord) - 0.5) * uIllumNoiseAmount;
                                        illumSample += noiseValue;
                                    }
                                    
                                    illumSample *= uIllumIntensity;
                                    float illumLuminance = dot(illumSample, lum_weights);
                                    
                                    if (uIllumBlendMode == 1) final_rgb += illumSample;
                                    else if (uIllumBlendMode == 2) final_rgb *= (1.0 + illumLuminance);
                                    else if (uIllumBlendMode == 3) final_rgb = 1.0 - (1.0 - final_rgb) * (1.0 - illumSample);
                                    else if (uIllumBlendMode == 4) {
                                        vec3 overlayResult;
                                        overlayResult.r = final_rgb.r < 0.5 ? 2.0 * final_rgb.r * illumSample.r : 1.0 - 2.0 * (1.0 - final_rgb.r) * (1.0 - illumSample.r);
                                        overlayResult.g = final_rgb.g < 0.5 ? 2.0 * final_rgb.g * illumSample.g : 1.0 - 2.0 * (1.0 - final_rgb.g) * (1.0 - illumSample.g);
                                        overlayResult.b = final_rgb.b < 0.5 ? 2.0 * final_rgb.b * illumSample.b : 1.0 - 2.0 * (1.0 - final_rgb.b) * (1.0 - illumSample.b);
                                        final_rgb = overlayResult;
                                    } else if (uIllumBlendMode == 5) final_rgb = min(vec3(1.0), final_rgb / (1.0 - min(illumSample, 0.999)));
                                    else {
                                        float lightStrength = illumLuminance;
                                        vec3 litColor = final_rgb * (1.0 + lightStrength * 2.0);
                                        final_rgb = mix(final_rgb, litColor, lightStrength);
                                    }
                                }
                            }

                            vec3 premultiplied_rgb = clamp(final_rgb, 0.0, 1.0) * originalColor.a;
                            gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
                        }
                    `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uSaturation: 1.0,
            uBrightness: 0.0,
            uContrast: 1.0,
            uExposure: 0.0,
            uGamma: 1.0,
            uInBlack: 0.0,
            uInWhite: 1.0,
            uTemperature: 0.0,
            uWbTint: 0.0,
            uInvert: false,
            uTintColor: [1.0, 1.0, 1.0],
            uTintAmount: 0.0,
            uMaskTexture: PIXI.Texture.EMPTY,
            uMaskEnabled: false,
            uSelectiveEnabled: false,
            uSelectiveColor: [1.0, 0.0, 0.0],
            uSelectiveHueRange: 0.1,
            uSelectiveSatRange: 0.4,
            uSelectiveLumRange: 0.5,
            uSelectiveTargetLum: 0.5,
            uSelectiveSoftness: 0.1,
            uSelectiveInvert: false,
            uSelectiveDesaturation: 1.0,
            uSelectiveTargetSaturation: 1.0,
            uSelectiveTargetBrightness: 0.0,
            uCurveLUT: PIXI.Texture.EMPTY,
            uCurvesEnabled: false,
            uAmbientCompositeTexture: PIXI.Texture.EMPTY,
            uAmbientCompositeEnabled: false,
            uAmbientCompositeBlendMode: PIXI.BLEND_MODES.NORMAL,
            uAmbientIlluminationMask: PIXI.Texture.EMPTY,
            uAmbientIlluminationMaskEnabled: false,
            uCloudHighlightsEnabled: false,
            uCloudHighlightsMask: PIXI.Texture.EMPTY,
            uCloudHighlightsBrightness: 0.0,
            uCanopyHighlightsEnabled: false,
            uCanopyHighlightsMask: PIXI.Texture.EMPTY,
            uCanopyHighlightsBrightness: 0.0,
            uCanopyOutdoorsMask: PIXI.Texture.EMPTY,
            uCanopyOutdoorsMaskEnabled: false,
            uStructuralHighlightsEnabled: false,
            uStructuralHighlightsMask: PIXI.Texture.EMPTY,
            uStructuralHighlightsBrightness: 0.0,
            uStructuralOutdoorsMask: PIXI.Texture.EMPTY,
            uStructuralOutdoorsMaskEnabled: false,
            uStructuralSplitHighlightsEnabled: false,
            uStructuralSplitHighlightsMask: PIXI.Texture.EMPTY,
            uSceneRectNorm: [0, 0, 1, 1],
            uIntensity: options.intensity ?? 1.0,
            uDynamicExposureBoost: 0.0,
            uDynamicHighlightPreservation: 0.8,
            uDynamicContrastBoost: 1.0,
            // New Illumination Uniforms
            uIllumTexture: PIXI.Texture.EMPTY,
            uIllumEnabled: false,
            uIllumIntensity: 1.0,
            uIllumBlendMode: 1,
            uIllumCCEnabled: true,
            uIllumSaturation: 1.0,
            uIllumBrightness: 0.0,
            uIllumContrast: 1.0,
            uIllumExposure: 0.0,
            uIllumGamma: 1.0,
            uIllumTintColor: [1.0, 1.0, 1.0],
            uIllumTintAmount: 0.0,
            uIllumNoiseEnabled: true,
            uIllumNoiseAmount: 0.01,
            uIllumNoiseScale: 1.0,
            uIllumTime: 0.0,
            uIllumDebugMode: false,
            uIllumNegativeMaskEnabled: false,
            uIllumNegativeMaskThreshold: 0.8,
            uIllumNegativeMaskSoftness: 0.2
        });
    }
}

class ScreenEffectsManager {
    static _filters = new Map();
    static _container = null;
    static _curveLut = null;

    static getManagedEffectsHTML() {
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
                                <details id="details-pauseEffect-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                                        ${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.invert', 'Invert Colors')}
                                </div></details>
                                <details id="details-pauseEffect-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies scene brightness, simulating camera exposure.')}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05, 'Adjusts mid-tones. < 1 lightens, > 1 darkens.')}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the image.')}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the image.')}
                                </div></details>
                                <details id="details-pauseEffect-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 15px;">
                                        <p class="description-text">Simulates camera white balance correction.</p>
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.whiteBalance.temperature', 'Temperature', -1, 1, 0.01, 'Negative values are cooler (blue), positive are warmer (orange).')}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.whiteBalance.tint', 'Tint', -1, 1, 0.01, 'Negative values shift toward magenta, positive toward green.')}
                                </div></details>
                                <details id="details-pauseEffect-cc-tint"><summary><span class="accordion-toggle"></span><strong>Global Tint</strong></summary><div style="padding-left: 15px;">
                                        <p class="description-text">Applies a color overlay to the entire scene.</p>
                                        ${DebuggerUIBuilder._createColorPickerHTML('pauseEffect.colorCorrection.tint.color', 'Tint Color')}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                                </div></details>
                                <details id="details-pauseEffect-cc-mask"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.mask.enabled', 'Luminance Mask', true)}</div></summary><div style="padding-left: 15px;">
                                        <p class="description-text">Applies the color correction only to lit areas of the scene. Requires the Illumination Buffer module.</p>
                                        ${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.mask.invert', 'Invert Mask (Affect Dark Areas)')}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.mask.luminanceThreshold', 'Light Threshold', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('pauseEffect.colorCorrection.mask.softness', 'Edge Softness', 0.01, 1, 0.01)}
                                </div></details>
                                <details id="details-pauseEffect-cc-selective"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('pauseEffect.colorCorrection.selective.enabled', 'Selective Color', true)}</div></summary><div style="padding-left: 15px;">
                                    ${buildSelectiveControls('pauseEffect.colorCorrection.selective.')}
                                </div></details>
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
                                <details id="details-combatEffect-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                                        ${DebuggerUIBuilder._createCheckboxHTML('combatEffect.colorCorrection.invert', 'Invert Colors')}
                                </div></details>
                                <details id="details-combatEffect-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.exposure', 'Exposure', -2, 2, 0.05, 'Multiplies scene brightness, simulating camera exposure.')}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05, 'Adjusts mid-tones. < 1 lightens, > 1 darkens.')}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01, 'Sets the darkest point of the image.')}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01, 'Sets the brightest point of the image.')}
                                </div></details>
                                <details id="details-combatEffect-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 15px;">
                                        <p class="description-text">Simulates camera white balance correction.</p>
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.whiteBalance.temperature', 'Temperature', -1, 1, 0.01, 'Negative values are cooler (blue), positive are warmer (orange).')}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.whiteBalance.tint', 'Tint', -1, 1, 0.01, 'Negative values shift toward magenta, positive toward green.')}
                                </div></details>
                                <details id="details-combatEffect-cc-tint"><summary><span class="accordion-toggle"></span><strong>Global Tint</strong></summary><div style="padding-left: 15px;">
                                        <p class="description-text">Applies a color overlay to the entire scene.</p>
                                        ${DebuggerUIBuilder._createColorPickerHTML('combatEffect.colorCorrection.tint.color', 'Tint Color')}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                                </div></details>
                                <details id="details-combatEffect-cc-mask"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('combatEffect.colorCorrection.mask.enabled', 'Luminance Mask', true)}</div></summary><div style="padding-left: 15px;">
                                        <p class="description-text">Applies the color correction only to lit areas of the scene. Requires the Illumination Buffer module.</p>
                                        ${DebuggerUIBuilder._createCheckboxHTML('combatEffect.colorCorrection.mask.invert', 'Invert Mask (Affect Dark Areas)')}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.mask.luminanceThreshold', 'Light Threshold', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('combatEffect.colorCorrection.mask.softness', 'Edge Softness', 0.01, 1, 0.01)}
                                </div></details>
                                <details id="details-combatEffect-cc-selective"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('combatEffect.colorCorrection.selective.enabled', 'Selective Color', true)}</div></summary><div style="padding-left: 15px;">
                                    ${buildSelectiveControls('combatEffect.colorCorrection.selective.')}
                                </div></details>
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
                                        <div id="color-favorites-list" style="margin-top: 5px;">
                                            <p style="color: #888; font-style: italic;">No favorites saved yet.</p>
                                        </div>
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
                                <details id="details-postProcessing-cc-highlights">
                                    <summary><span class="accordion-toggle"></span><strong>Highlight Adjustments</strong></summary>
                                    <div style="padding-left: 15px;">
                                        <p class="description-text">Boost brightness in areas unaffected by certain shadow effects.</p>
                                        <details id="details-postProcessing-cc-highlightCloud">
                                            <summary><span class="accordion-toggle"></span>
                                                <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightCloud.enabled', 'Cloud Highlights', true)}</div>
                                            </summary>
                                            <div style="padding-left: 15px;">
                                                <p class="description-text">Brightens the sky between cloud shadows.</p>
                                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightCloud.brightness', 'Brightness', 0, 2, 0.01)}
                                            </div>
                                        </details>
                                        <details id="details-postProcessing-cc-highlightCanopy">
                                            <summary><span class="accordion-toggle"></span>
                                                <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightCanopy.enabled', 'Canopy Highlights', true)}</div>
                                            </summary>
                                            <div style="padding-left: 15px;">
                                                <p class="description-text">Brightens the light filtering through the canopy.</p>
                                                ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightCanopy.brightness', 'Brightness', 0, 5, 0.01)}
                                                </div>
                                            </details>
                                            <details id="details-postProcessing-cc-highlightStructural">
                                                <summary><span class="accordion-toggle"></span>
                                                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.highlightStructural.enabled', 'Structural Highlights', true)}</div>
                                                </summary>
                                                <div style="padding-left: 15px;">
                                                    <p class="description-text">Brightens the areas not in structural shadow (e.g., areas between rafters).</p>
                                                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.highlightStructural.brightness', 'Brightness', 0, 5, 0.01)}
                                                </div>
                                            </details>
                                        </div>
                                    </details>
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
                                    <details id="details-postProcessing-cc-curves">
                                    <summary>
                                        <span class="accordion-toggle"></span>
                                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.curves.enabled', 'Curves', true)}</div>
                                    </summary>
                                    <div style="padding-left: 15px; display: flex; flex-direction: column; align-items: center; padding-top: 5px;">
                                        <p class="description-text">Precise, non-linear control over tonal range, similar to Photoshop's Curves tool.</p>
                                        <div id="curve-channel-selector" style="text-align: center; margin-bottom: 5px; display: flex; gap: 10px; justify-content: center;">
                                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-rgb" value="rgb" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-rgb">RGB</label></div>
                                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-r" value="red" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-r" style="color:#f88;">R</label></div>
                                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-g" value="green" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-g" style="color:#8f8;">G</label></div>
                                            <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-b" value="blue" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-b" style="color:#8af;">B</label></div>
                                        </div>
                                        <div id="curve-editor-container" style="width: 256px; height: 256px; background: #222 url('data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0 H8 V8 H0 Z\' fill=\'%23333\'/%3E%3Cpath d=\'M8 8 H16 V16 H8 Z\' fill=\'%23333\'/%3E%3C/svg%3E'); border: 1px solid #555; position: relative;">
                                            <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0; pointer-events: none;">
                                                <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4 4"/>
                                            </svg>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </details>
                            
            <details id="details-postProcessing-dynamicExposure">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.dynamicExposure.enabled', 'Dynamic Exposure (Dazzle)', true)}</div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Creates a "dazzle" effect when a token moves from an area defined as indoors (dark parts of _Outdoors mask) to outdoors (light parts).</p>
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.dynamicExposure.intensity', 'Dazzle Intensity', 0, 5, 0.1, 'The peak exposure brightness when the effect triggers.')}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.dynamicExposure.duration', 'Dazzle Duration (ms)', 500, 20000, 100, 'How long it takes for the dazzle effect to fade back to normal.')}
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.dynamicExposure.resetPeriod', 'Reset Period (ms)', 1000, 120000, 1000, 'The cooldown time before the effect can be triggered again.')}
                </div>
            </details>
        
                
            <details id="details-postProcessing-sceneIlluminationMixIn">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.enabled', 'Scene Illumination Mix-in', true)}</div>
                </summary>
                <div style="padding-left: 15px;">
                    <p class="description-text">Mixes the raw illumination buffer texture back into the scene after all other color correction. Requires the Illumination Buffer module.</p>
                    <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;">
                        <strong style="color: #ffddaa;">PERFORMANCE NOTE:</strong> This effect samples the illumination buffer directly and may impact performance on lower-end systems.
                    </div>
                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.intensity', 'Mix Intensity', 0, 2, 0.01, 'Overall strength of the illumination mix-in effect.')}
                    ${DebuggerUIBuilder._createSelectHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.blendMode', 'Blend Mode', {'Normal': 0, 'Add': 1, 'Multiply Light': 2, 'Screen': 3, 'Overlay': 4, 'Color Dodge': 5})}
                    ${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.debugMode', 'Debug Mode', false, 'Show raw illumination texture for debugging.')}
                    
                    <details id="details-sceneIlluminationMixIn-shadowInteraction">
                        <summary><span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.shadowInteraction.enabled', 'Erase Shadows with Light', true)}</div>
                        </summary>
                        <div style="padding-left: 15px;">
                            <p class="description-text">Uses the illumination buffer to reduce the intensity of structural and canopy shadows, simulating light overpowering darkness.</p>
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.shadowInteraction.intensity', 'Reduction Amount', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.shadowInteraction.luminanceThreshold', 'Light Threshold', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.shadowInteraction.softness', 'Edge Softness', 0.01, 1, 0.01)}
                        </div>
                    </details>
        
                    <details id="details-sceneIlluminationMixIn-negativeMask">
                        <summary><span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.negativeMask.enabled', 'Negative Mask (Anti-Overexposure)', true)}</div>
                        </summary>
                        <div style="padding-left: 15px;">
                            <p class="description-text">Prevents the mix-in from adding light to areas of the scene that are already bright, helping to avoid blown-out highlights.</p>
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.negativeMask.threshold', 'Scene Brightness Threshold', 0, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.negativeMask.softness', 'Mask Softness', 0.01, 1, 0.01)}
                        </div>
                    </details>
        
                    <details id="details-sceneIlluminationMixIn-colorCorrection">
                        <summary><span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.enabled', 'Illumination Color Correction', true)}</div>
                        </summary>
                        <div style="padding-left: 15px;">
                            <p class="description-text">Applies color correction to the illumination buffer before mixing it into the scene.</p>
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.exposure', 'Exposure', -2, 2, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05)}
                            <details id="details-sceneIlluminationMixIn-cc-tint">
                                <summary><span class="accordion-toggle"></span><strong>Illumination Tint</strong></summary>
                                <div style="padding-left: 15px;">
                                    ${DebuggerUIBuilder._createColorPickerHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.tint.color', 'Tint Color')}
                                    ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                                </div>
                            </details>
                        </div>
                    </details>
                    
                    <details id="details-sceneIlluminationMixIn-noise">
                        <summary><span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.noise.enabled', 'Anti-Banding Noise', true)}</div>
                        </summary>
                        <div style="padding-left: 15px;">
                            <p class="description-text">Adds subtle noise to prevent color banding artifacts in gradients.</p>
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.noise.amount', 'Noise Amount', 0, 0.1, 0.001, 'Strength of the dithering noise.')}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.noise.scale', 'Noise Scale', 0.1, 10, 0.1, 'Size of the noise pattern.')}
                            ${DebuggerUIBuilder._createSliderHTML('postProcessing.colorCorrection.sceneIlluminationMixIn.noise.speed', 'Noise Speed', -0.01, 0.01, 0.0001, 'Animation speed of the noise pattern.')}
                        </div>
                    </details>
                </div>
            </details>
        
            
        
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
                        <button id="output-config-btn" title="Log the current full config object to the console for copy/pasting." style="width: 100%; margin-top: 5px;">Log Full Config to Console</button>
                    `;

        return {
            postProcessing: postProcessingHTML,
            otherEffects: [sceneTransitionHTML, pauseEffectHTML, combatEffectHTML]
        };
    }

    static initialize(container) {
        if (!this._container) {
            this._container = container;
        }
    }

    static addFilter(key, filter) {
        if (!this._container) return;
        this.removeFilter(key);
        this._filters.set(key, filter);
        this._updateContainerFilters();
    }

    static getFilter(key) {
        return this._filters.get(key);
    }

    static removeFilter(key) {
        if (!this._container || !this._filters.has(key)) return;
        const filter = this._filters.get(key);
        filter?.destroy();
        this._filters.delete(key);
        this._updateContainerFilters();
    }

    static _updateContainerFilters() {
        if (!this._container) return;

        const RENDER_ORDER = [
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

        const managedFilterClasses = [
            PrismFilter, HeatDistortionFilter, VignetteFilter, LensDistortionFilter,
            ChromaticAberrationFilter, ColorCorrectionFilter
        ];

        const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
        if (BloomFilterConstructor) managedFilterClasses.push(BloomFilterConstructor);

        const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
        if (TiltShiftFilterConstructor) managedFilterClasses.push(TiltShiftFilterConstructor);

        const otherFilters = (this._container.filters || []).filter(f => !managedFilterClasses.some(cls => f instanceof cls));

        const orderedManagedFilters = RENDER_ORDER
            .map(key => this._filters.get(key))
            .filter(Boolean);

        const newFilters = [
            ...otherFilters,
            ...orderedManagedFilters
        ];

        this._container.filters = newFilters.length > 0 ? newFilters : null;
    }

    static setupAllGlobalFilters() {
        const ppErrors = [];
        const heatErrors = [];

        try {
            this.addFilter('prism', new PrismFilter());
            systemStatus.update('shaders', 'prism', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to compile PrismFilter", e);
            systemStatus.update('shaders', 'prism', {
                state: 'error',
                message: `Compilation failed: ${e.message}`
            });
        }

        try {
            this.addFilter('heatDistortion', new HeatDistortionFilter());
        } catch (e) {
            heatErrors.push('HeatDistortion');
            console.error("MapShine | Failed to compile HeatDistortionFilter", e);
        }

        systemStatus.update('shaders', 'heat', {
            state: heatErrors.length === 0 ? 'ok' : 'error',
            message: heatErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${heatErrors.join(', ')}`
        });

        try {
            this.addFilter('vignette', new VignetteFilter());
        } catch (e) {
            ppErrors.push('Vignette');
        }
        try {
            this.addFilter('lensDistortion', new LensDistortionFilter());
        } catch (e) {
            ppErrors.push('LensDistortion');
        }
        try {
            this.addFilter('chromaticAberration', new ChromaticAberrationFilter());
        } catch (e) {
            ppErrors.push('ChromaticAberration (Post)');
        }
        try {
            this.addFilter('colorCorrection', new ColorCorrectionFilter());
            const pauseFilter = new ColorCorrectionFilter();
            pauseFilter.enabled = false;
            this.addFilter('pauseEffect', pauseFilter);
            const combatFilter = new ColorCorrectionFilter();
            combatFilter.enabled = false;
            this.addFilter('combatEffect', combatFilter);
        } catch (e) {
            ppErrors.push('ColorCorrection');
        }

        try {
            const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
            if (BloomFilterConstructor) {
                const bloomFilter = new BloomFilterConstructor(game.mapShine.profileManager.activeConfig.advancedBloom);
                this.addFilter('advancedBloom', bloomFilter);
            } else {
                ppErrors.push('AdvancedBloom (Bundling Failed)');
            }
        } catch (e) {
            ppErrors.push('AdvancedBloom (Creation Failed)');
        }

        try {
            const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
            if (TiltShiftFilterConstructor) {
                const tiltShiftFilter = new TiltShiftFilterConstructor();
                this.addFilter('tiltShift', tiltShiftFilter);
            } else {
                ppErrors.push('TiltShift (Bundling Failed)');
            }
        } catch (e) {
            ppErrors.push('TiltShift (Creation Failed)');
        }

        systemStatus.update('shaders', 'postProcessing', {
            state: ppErrors.length === 0 ? 'ok' : 'error',
            message: ppErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${ppErrors.join(', ')}`
        });
    }

    static updateAllFiltersFromConfig(config) {
        const pp = config.postProcessing;
        const ab = config.advancedBloom;

        const prismFilter = this.getFilter('prism');
        if (prismFilter instanceof PrismFilter) {
            const pConfig = config.prism;
            prismFilter.enabled = config.enabled && pConfig.enabled;

            const u = prismFilter.uniforms;
            u.uIntensity = pConfig.intensity;
            u.uAngleRad = pConfig.angle * (Math.PI / 180.0);
            u.uThreshold = pConfig.threshold;
            u.uSoftness = pConfig.softness;
            u.uDistortionStrength = pConfig.distortionStrength;

            const screen = canvas?.app?.screen;
            if (screen) {
                u.uTexelSize = [1 / screen.width, 1 / screen.height];
            }
        }

        const advancedBloomFilter = this.getFilter('advancedBloom');
        const BloomFilterConstructor = PIXI.filters.AdvancedBloomFilter || (PIXI.filters.filters && PIXI.filters.filters.AdvancedBloomFilter);
        if (advancedBloomFilter && BloomFilterConstructor && advancedBloomFilter instanceof BloomFilterConstructor) {
            advancedBloomFilter.enabled = config.enabled && pp.enabled && ab.enabled;
            advancedBloomFilter.threshold = ab.threshold;
            advancedBloomFilter.bloomScale = ab.bloomScale;
            advancedBloomFilter.brightness = ab.brightness;
            advancedBloomFilter.blur = ab.blur;
            advancedBloomFilter.quality = ab.quality;
        }

        const tiltShiftFilter = this.getFilter('tiltShift');
        const TiltShiftFilterConstructor = PIXI.filters.TiltShiftFilter || (PIXI.filters.filters && PIXI.filters.filters.TiltShiftFilter);
        if (tiltShiftFilter && TiltShiftFilterConstructor && tiltShiftFilter instanceof TiltShiftFilterConstructor) {
            const tsConfig = pp.tiltShift;
            tiltShiftFilter.enabled = config.enabled && pp.enabled && tsConfig.enabled;
            tiltShiftFilter.blur = tsConfig.blur;
            tiltShiftFilter.gradientBlur = tsConfig.gradientBlur;

            const screen = canvas.app.screen;
            if (tiltShiftFilter.start) {
                tiltShiftFilter.start.x = tsConfig.startX * screen.width;
                tiltShiftFilter.start.y = tsConfig.startY * screen.height;
            }
            if (tiltShiftFilter.end) {
                tiltShiftFilter.end.x = tsConfig.endX * screen.width;
                tiltShiftFilter.end.y = tsConfig.endY * screen.height;
            }
        }

        const vignetteFilter = this.getFilter('vignette');
        if (vignetteFilter instanceof VignetteFilter) {
            vignetteFilter.enabled = config.enabled && pp.enabled && pp.vignette.enabled;
            vignetteFilter.amount = pp.vignette.amount;
            vignetteFilter.softness = pp.vignette.softness;
        }

        const lensDistortionFilter = this.getFilter('lensDistortion');
        if (lensDistortionFilter instanceof LensDistortionFilter) {
            lensDistortionFilter.enabled = config.enabled && pp.enabled && pp.lensDistortion.enabled;
            lensDistortionFilter.amount = pp.lensDistortion.amount;
            lensDistortionFilter.center = [pp.lensDistortion.centerX, pp.lensDistortion.centerY];
        }

        const caFilter = this.getFilter('chromaticAberration');
        if (caFilter instanceof ChromaticAberrationFilter) {
            caFilter.enabled = config.enabled && pp.enabled && pp.chromaticAberration.enabled;
            caFilter.amount = pp.chromaticAberration.amount;
            caFilter.center = [pp.chromaticAberration.centerX, pp.chromaticAberration.centerY];
        }

        const ccFilter = this.getFilter('colorCorrection');
        if (ccFilter instanceof ColorCorrectionFilter) {
            const ccConfig = pp.colorCorrection;
            ccFilter.enabled = config.enabled && pp.enabled && ccConfig.enabled;

            const u = ccFilter.uniforms;
            if (ccConfig.dynamicExposure) {
                // The uDynamicHighlightPreservation uniform has been removed from the filter.
            }
            u.uSaturation = ccConfig.saturation;
            u.uBrightness = ccConfig.brightness;
            u.uContrast = ccConfig.contrast;
            u.uInvert = ccConfig.invert;
            u.uExposure = ccConfig.exposure;
            u.uGamma = ccConfig.gamma;
            u.uInBlack = ccConfig.levels.inBlack;
            u.uInWhite = ccConfig.levels.inWhite;
            u.uTemperature = ccConfig.whiteBalance.temperature;
            u.uWbTint = ccConfig.whiteBalance.tint;
            u.uTintColor = hexToRgbArray(ccConfig.tint.color);
            u.uTintAmount = ccConfig.tint.amount;

            const sel = ccConfig.selective;
            u.uSelectiveEnabled = sel.enabled;
            u.uSelectiveColor = hexToRgbArray(sel.color);
            u.uSelectiveHueRange = sel.hueRange;
            u.uSelectiveSatRange = sel.saturationRange;
            u.uSelectiveLumRange = sel.luminanceRange;
            u.uSelectiveTargetLum = sel.targetLuminance;
            u.uSelectiveSoftness = sel.softness;
            u.uSelectiveInvert = sel.invert;
            u.uSelectiveDesaturation = sel.desaturation;
            u.uSelectiveTargetSaturation = sel.targetSaturation;
            u.uSelectiveTargetBrightness = sel.targetBrightness;

            const curvesConfig = ccConfig.curves;
            if (curvesConfig) {
                u.uCurvesEnabled = curvesConfig.enabled;
                if (curvesConfig.enabled) {
                    if (this._curveLut) this._curveLut.destroy(true);
                    this._curveLut = LutUtils.generateCurveLut(curvesConfig);
                    u.uCurveLUT = this._curveLut;
                }
            } else {
                u.uCurvesEnabled = false;
            }
        }

        const pauseFilter = this.getFilter('pauseEffect');
        if (pauseFilter instanceof ColorCorrectionFilter) {
            const pauseConfig = config.pauseEffect.colorCorrection;
            const u = pauseFilter.uniforms;
            u.uSaturation = pauseConfig.saturation;
            u.uBrightness = pauseConfig.brightness;
            u.uContrast = pauseConfig.contrast;
            u.uInvert = pauseConfig.invert;
            u.uExposure = pauseConfig.exposure;
            u.uGamma = pauseConfig.gamma;
            u.uInBlack = pauseConfig.levels.inBlack;
            u.uInWhite = pauseConfig.levels.inWhite;
            u.uTemperature = pauseConfig.whiteBalance.temperature;
            u.uWbTint = pauseConfig.whiteBalance.tint;
            u.uTintColor = hexToRgbArray(pauseConfig.tint.color);
            u.uTintAmount = pauseConfig.tint.amount;

            const sel = pauseConfig.selective;
            u.uSelectiveEnabled = sel.enabled;
            u.uSelectiveColor = hexToRgbArray(sel.color);
            u.uSelectiveHueRange = sel.hueRange;
            u.uSelectiveSatRange = sel.saturationRange;
            u.uSelectiveLumRange = sel.luminanceRange;
            u.uSelectiveTargetLum = sel.targetLuminance;
            u.uSelectiveSoftness = sel.softness;
            u.uSelectiveInvert = sel.invert;
            u.uSelectiveDesaturation = sel.desaturation;
            u.uSelectiveTargetSaturation = sel.targetSaturation;
            u.uSelectiveTargetBrightness = sel.targetBrightness;
        }

        const combatFilter = this.getFilter('combatEffect');
        if (combatFilter instanceof ColorCorrectionFilter) {
            const combatConfig = config.combatEffect.colorCorrection;
            const u = combatFilter.uniforms;
            u.uSaturation = combatConfig.saturation;
            u.uBrightness = combatConfig.brightness;
            u.uContrast = combatConfig.contrast;
            u.uInvert = combatConfig.invert;
            u.uExposure = combatConfig.exposure;
            u.uGamma = combatConfig.gamma;
            u.uInBlack = combatConfig.levels.inBlack;
            u.uInWhite = combatConfig.levels.inWhite;
            u.uTemperature = combatConfig.whiteBalance.temperature;
            u.uWbTint = combatConfig.whiteBalance.tint;
            u.uTintColor = hexToRgbArray(combatConfig.tint.color);
            u.uTintAmount = combatConfig.tint.amount;

            const sel = combatConfig.selective;
            u.uSelectiveEnabled = sel.enabled;
            u.uSelectiveColor = hexToRgbArray(sel.color);
            u.uSelectiveHueRange = sel.hueRange;
            u.uSelectiveSatRange = sel.saturationRange;
            u.uSelectiveLumRange = sel.luminanceRange;
            u.uSelectiveTargetLum = sel.targetLuminance;
            u.uSelectiveSoftness = sel.softness;
            u.uSelectiveInvert = sel.invert;
            u.uSelectiveDesaturation = sel.desaturation;
            u.uSelectiveTargetSaturation = sel.targetSaturation;
            u.uSelectiveTargetBrightness = sel.targetBrightness;
        }
    }

    static tearDown() {
        if (!this._container) return;

        // Instead of destroying the filters, we iterate through them and disable them.
        // This keeps the filter instances alive for the next scene but ensures they have no effect.
        for (const filter of this._filters.values()) {
            if (filter) {
                filter.enabled = false;
            }
        }

        // We also no longer nullify the container, as it's a persistent reference to canvas.stage.
        // The container and its filter array will be managed by the next scene's setup.

        console.log("Map Shine | ScreenEffectsManager reset for scene transition.");
    }
}

class AmbientColorFilter extends PIXI.Filter {
    constructor(options = {}) {
        const vertexSrc = `
                        attribute vec2 aVertexPosition;
                        attribute vec2 aTextureCoord;

                        uniform mat3 projectionMatrix;

                        varying vec2 vTextureCoord; 
                        varying vec2 vScreenCoord;  

                        void main(void)
                        {
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

                        uniform float uSaturation, uBrightness, uContrast, uGamma;
                        uniform vec3 uTintColor;
                        uniform float uTintAmount;
                        uniform float u_intensity;

                        uniform sampler2D uTokenMask;
                        uniform bool uTokenMaskEnabled;
                        uniform float uTokenMaskThreshold;

                        const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                        void main(void) {

                            if (uTokenMaskEnabled) {

                                float maskValue = texture2D(uTokenMask, vScreenCoord).r;
                                if (maskValue > uTokenMaskThreshold) {
                                    discard;
                                }
                            }

                            vec4 originalColor = texture2D(uSampler, vTextureCoord);
                            if (originalColor.a == 0.0) {
                                discard;
                            }

                            vec3 workingColor = originalColor.rgb;

                            if (uGamma > 0.0) {
                                workingColor = pow(workingColor, vec3(1.0 / uGamma));
                            }
                            workingColor += uBrightness;
                            workingColor = (workingColor - 0.5) * uContrast + 0.5;
                            float final_luminance = dot(workingColor, lum_weights);
                            workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                            workingColor = mix(workingColor, uTintColor, uTintAmount);

                            workingColor *= u_intensity;

                            vec3 premultiplied_rgb = workingColor * originalColor.a;
                            gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
                        }
                    `;

        super(vertexSrc, fragmentSrc, {
            uSaturation: options.saturation ?? 1.0,
            uBrightness: options.brightness ?? 0.0,
            uContrast: options.contrast ?? 1.0,
            uGamma: options.gamma ?? 1.0,
            uTintColor: options.tintColor ?? [1.0, 1.0, 1.0],
            uTintAmount: options.tintAmount ?? 0.0,

            u_intensity: options.intensity ?? 1.0,

            uTokenMask: PIXI.Texture.EMPTY,
            uTokenMaskEnabled: false,
            uTokenMaskThreshold: options.tokenMaskThreshold ?? 0.1,
        });
    }
}

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
                        }
                    `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_displacementMap: PIXI.Texture.EMPTY,
            u_intensityMask: PIXI.Texture.EMPTY,
            u_intensity: options.intensity ?? 0.01,
        });
    }
}

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
                        }
                    `, {
            u_amount: options.amount ?? 0.5,
            u_softness: options.softness ?? 0.5,
        });
    }
    get amount() {
        return this.uniforms.u_amount;
    }
    set amount(v) {
        this.uniforms.u_amount = v;
    }
    get softness() {
        return this.uniforms.u_softness;
    }
    set softness(v) {
        this.uniforms.u_softness = v;
    }
}

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
                        }
                    `, {
            u_amount: options.amount ?? 0.0,
            u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5]
        });
    }
    get amount() {
        return this.uniforms.u_amount;
    }
    set amount(v) {
        this.uniforms.u_amount = v;
    }
    get center() {
        return this.uniforms.u_center;
    }
    set center(v) {
        this.uniforms.u_center = v;
    }
}

class ChromaticAberrationFilter extends PIXI.Filter {
    constructor(options = {}) {
        super(PIXI.Filter.defaultVertexSrc, `
                        precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
                        void main(void) {
                            if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                            vec2 offset = (vTextureCoord - u_center) * u_amount;
                            float r = texture2D(uSampler, vTextureCoord - offset).r;
                            float g = texture2D(uSampler, vTextureCoord).g;
                            float b = texture2D(uSampler, vTextureCoord + offset).b;
                            float a = texture2D(uSampler, vTextureCoord).a;
                            gl_FragColor = vec4(r, g, b, a);
                        }
                    `, {
            u_amount: options.amount ?? 0.0,
            u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5]
        });
    }
    get amount() {
        return this.uniforms.u_amount;
    }
    set amount(v) {
        this.uniforms.u_amount = v;
    }
    get center() {
        return this.uniforms.u_center;
    }
    set center(v) {
        this.uniforms.u_center = v;
    }
}

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
                        }
                    `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uAmount: options.amount ?? 0.0,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}

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
                        }
                    `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uPrismMask: PIXI.Texture.EMPTY,
            uDistortionMap: PIXI.Texture.EMPTY,
            uIntensity: options.intensity ?? 5.0,
            uAngleRad: (options.angle ?? 45.0) * (Math.PI / 180.0),
            uThreshold: options.threshold ?? 0.85,
            uSoftness: options.softness ?? 0.1,
            uDistortionStrength: options.distortionStrength ?? 2.0,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}

// =================================================================================
// SECTION 5: EFFECT LAYERS & THEIR DEDICATED COMPONENTS
// =================================================================================
// Description: The main CanvasLayer implementations and any PIXI.Filters
//              that are tightly coupled to a single layer.
// ---------------------------------------------------------------------------------

class MaskedEffectLayer extends CanvasLayer {
    constructor(options) {
        super();
        this.options = options;

        // Properties managed by this base class
        this.maskContainer = null;
        this.combinedMaskTexture = null;
        this.maskSprites = new Map();

        this._needsMaskUpdate = true;
        this._destroyed = false;

        // Initialize bounds safely - will be updated in _draw if needed
        this.bounds = this._getBounds();

        // Bound listeners, defined in _draw
        this._onAnimateBound = null;
        this._onResizeBound = null;
        this._onPanBound = null;
    }

    _getBounds() {
        if (canvas?.scene?.dimensions?.sceneRect) {
            return canvas.scene.dimensions.sceneRect;
        }
        return new PIXI.Rectangle(0, 0, 1, 1);
    }

    getMaskTexture() {
        return this.combinedMaskTexture;
    }

    computeUnionBounds() {
        const activeMaskSprites = Array.from(this.maskSprites.values()).filter(s => s.texture?.valid);
        if (activeMaskSprites.length === 0) return null;

        // Get bounds in world/canvas space
        let union = activeMaskSprites[0].getBounds().clone();
        for (let i = 1; i < activeMaskSprites.length; i++) {
            union.enlarge(activeMaskSprites[i].getBounds());
        }
        return union;
    }

    async _draw(options) {
        this._destroyed = false;
        this._needsMaskUpdate = true;

        // Update bounds now that canvas is ready
        this.bounds = this._getBounds();

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        this._onPanBound = this._onPan.bind(this);

        const renderer = canvas.app.renderer;
        this.maskContainer = new PIXI.Container();
        this.combinedMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height,
        });

        // Add listeners
        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);
        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    /**
     * @override
     */
    async _tearDown(options) {
        if (this._destroyed) return;
        this._destroyed = true;

        // Remove listeners
        if (this._onAnimateBound) canvas.app.ticker.remove(this._onAnimateBound);
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);
        if (this._onPanBound) Hooks.off('canvasPan', this._onPanBound);

        // Destroy PIXI objects
        this.combinedMaskTexture?.destroy(true);
        this.maskContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.maskSprites.clear();

        this.combinedMaskTexture = null;
        this.maskContainer = null;

        return super._tearDown(options);
    }

    /**
     * Base animation loop. Handles re-rendering the mask when needed.
     * Subclasses should call `super._onAnimate(deltaTime)` at the start of their own loop.
     */
    _onAnimate(deltaTime) {
        if (this._destroyed) return;

        if (this._needsMaskUpdate) {
            this.renderMask();
            this._needsMaskUpdate = false;
        }
    }

    /**
     * Handles pan events, flagging that the mask needs to be redrawn.
     */
    _onPan() {
        this._needsMaskUpdate = true;
    }

    /**
     * Handles resize events, resizing the mask texture and flagging a redraw.
     */
    _onResize() {
        const renderer = canvas.app.renderer;
        this.combinedMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this._needsMaskUpdate = true;
    }

    /**
     * Renders the maskContainer to the combinedMaskTexture.
     */
    renderMask() {
        if (!this.maskContainer || !this.combinedMaskTexture) return;
        // This is the correct way to bake world-space objects into a screen-aligned texture.
        // We provide the stage's transform matrix to map the world-space sprites
        // into the coordinate system of the screen-sized render texture.
        canvas.app.renderer.render(this.maskContainer, {
            renderTexture: this.combinedMaskTexture,
            transform: canvas.stage.transform.worldTransform,
            clear: true
        });
    }

    /**
     * @override
     * Updates the sprites in the mask container based on discovered effect targets.
     */
    async updateEffectTargets(targets) {
        if (!this.maskContainer) return;

        const maskSuffix = this.options.maskSuffix;
        if (!maskSuffix) {
            console.warn("MaskedEffectLayer | No 'maskSuffix' provided in options.");
            return;
        }

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            const texturePath = targetData?.[maskSuffix];
            if (!texturePath) continue;

            validTargetIds.add(id);
            let sprite = this.maskSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.maskSprites.set(id, sprite);
                this.maskContainer.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, texturePath, targetData.rect);
        }

        for (const [id, sprite] of this.maskSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.maskSprites.delete(id);
            }
        }
        this._needsMaskUpdate = true;
    }

    /**
     * Helper to update a sprite's texture and transform.
     */
    async _updateSpriteTransform(sprite, texturePath, rect) {
        if (!sprite || sprite.destroyed) return;

        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }

        if (!sprite || sprite.destroyed || !sprite.anchor || !sprite.texture.valid || !rect) return;

        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }
}

// --- 5.0. Diagnostic Layer ---
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

        // Trigger the initial population of the dropdown in the UI
        game.mapShine.debugger?.eventHandler._populateDiagnosticDropdown();
    }

    async _tearDown(options) {
        this._destroyed = true;

        canvas.app.ticker.remove(this._onAnimateBound);

        // Let the superclass handle destroying all children (containers, sprites, etc.)
        this.diagnosticSprites.clear();
        this.overlays.clear();
        this._destroyTooltip();

        return super._tearDown(options);
    }

    /**
     * Gathers all available textures for debugging purposes.
     * @returns {object} An object containing categorized texture information.
     */
    getAvailableDebugTextures() {
        const textures = {
            inputs: {
                "all": "All Suffixes"
            },
            intermediates: {},
            generated: {}, // New category for geometry masks
            external: {}
        };

        // Input Suffixes
        for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
            textures.inputs[key] = key;
        }

        // Generated Geometry Masks
        if (game.mapShine.geometryMaskManager) {
            for (const [key, name] of Object.entries(EFFECT_SOURCE_OPTIONS)) {
                if (key) { // Ensure we skip the "None" option which has an empty key
                    const prefixedKey = `generated_${key}`;
                    textures.generated[prefixedKey] = `${name} (Geometry)`;
                }
            }
        }

        // Intermediate Textures
        const layerChecks = {
            'metallicShinePattern': {
                class: MetallicShineLayer,
                method: 'getPatternTexture',
                name: 'Metallic Shine Pattern'
            },
            'waterDisplacement': {
                class: WaterFXLayer,
                name: 'Water Displacement'
            }, // Special handling needed
            'heatNoise': {
                class: HeatDistortionLayer,
                name: 'Heat Noise'
            }, // Special handling needed
            'iridescenceNoise': {
                class: IridescenceLayer,
                name: 'Iridescence Noise'
            }, // Special handling needed
            'canopyNoise': {
                class: CanopyLayer,
                name: 'Canopy Noise'
            }, // Special handling needed
            'structuralNoise': {
                class: StructuralShadowsLayer,
                name: 'Structural Noise'
            } // Special handling needed
        };

        for (const [key, check] of Object.entries(layerChecks)) {
            const layer = canvas.layers.find(l => l instanceof check.class);
            if (layer) {
                const intermediateKey = `intermediate_${key}`;
                if (key === 'waterDisplacement' && layer.displacementTexture) textures.intermediates[intermediateKey] = check.name;
                else if (key === 'heatNoise' && layer.noiseManager) textures.intermediates[intermediateKey] = check.name;
                else if (key === 'iridescenceNoise' && layer.distortionNoiseManager) textures.intermediates[intermediateKey] = check.name;
                else if (key === 'canopyNoise' && layer.distortionNoiseManager) textures.intermediates[intermediateKey] = check.name;
                else if (key === 'structuralNoise' && layer.intensityNoiseManager) textures.intermediates[intermediateKey] = check.name;
                else if (check.method && typeof layer[check.method] === 'function' && layer[check.method]()) {
                    textures.intermediates[intermediateKey] = check.name;
                }
            }
        }

        // External Textures
        if (game.modules.get('illuminationbuffer')?.api) {
            textures.external['external_illumination'] = "Illumination Buffer";
        }

        return textures;
    }

    _createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'map-shine-diagnostic-tooltip';
        Object.assign(this.tooltip.style, {
            position: 'fixed',
            display: 'none',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            border: '1px solid #888',
            borderRadius: '4px',
            padding: '5px',
            fontFamily: 'monospace',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: '100001'
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
            if (this.tooltip && this.tooltip.style.display !== 'none') {
                this.tooltip.style.display = 'none';
            }
            return;
        }

        const config = game.mapShine.profileManager.activeConfig.diagnostic;
        if (!config.pixelInspector) {
            if (this.tooltip.style.display !== 'none') {
                this.tooltip.style.display = 'none';
            }
            return;
        }

        const clientX = mousePosition.x;
        const clientY = mousePosition.y;

        const bounds = canvas.app.view.getBoundingClientRect();
        if (clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom) {
            if (this.tooltip.style.display !== 'none') {
                this.tooltip.style.display = 'none';
            }
            return;
        }

        this.tooltip.style.display = 'block';

        this.tooltip.style.left = `${clientX + 15}px`;
        this.tooltip.style.top = `${clientY + 15}px`;

        const renderer = canvas.app.renderer;
        const pixel = renderer.extract.pixels(canvas.app.stage, new PIXI.Rectangle(clientX, clientY, 1, 1));

        if (pixel && pixel.length >= 4) {
            const r = pixel[0];
            const g = pixel[1];
            const b = pixel[2];
            const a = pixel[3];

            const r_norm = (r / 255).toFixed(3);
            const g_norm = (g / 255).toFixed(3);
            const b_norm = (b / 255).toFixed(3);
            const a_norm = (a / 255).toFixed(3);

            this.tooltip.innerHTML = `
                        <strong>Pixel Inspector</strong><br>
                        Screen X/Y: ${Math.round(clientX)}, ${Math.round(clientY)}<br>
                        --------------------<br>
                        RGBA (0-255): ${r}, ${g}, ${b}, ${a}<br>
                        RGBA (Norm): ${r_norm}, ${g_norm}, ${b_norm}, ${a_norm}
                    `;
        } else {
            this.tooltip.textContent = 'Reading pixel...';
        }
    }

    _refreshMaskVisibility() {
        if (!this.diagnosticContainer) return;

        const config = game.mapShine.profileManager.activeConfig.diagnostic;
        const displaySuffix = config.displaySuffix;

        // Hide everything by default
        this.fullscreenSprite.visible = false;
        this.diagnosticContainer.visible = false;
        this.overlayContainer.visible = false;

        if (!config.showMasks) {
            return; // If masks are hidden, nothing else to do.
        }

        let isFullscreenView = false;
        let fullscreenTexture = null;

        if (displaySuffix.startsWith('generated_')) {
            const key = displaySuffix.replace('generated_', '');
            fullscreenTexture = game.mapShine.geometryMaskManager?.getMask(key);
            isFullscreenView = true;
        } else if (displaySuffix === 'external_illumination') {
            fullscreenTexture = game.modules.get('illuminationbuffer')?.api?.getLightingTexture();
            isFullscreenView = true;
        } else if (displaySuffix.startsWith('intermediate_')) {
            const key = displaySuffix.replace('intermediate_', '');
            const layerMap = {
                'metallicShinePattern': {
                    class: MetallicShineLayer,
                    method: 'getPatternTexture'
                },
                'waterDisplacement': {
                    class: WaterFXLayer,
                    property: 'displacementTexture'
                },
                'heatNoise': {
                    class: HeatDistortionLayer,
                    property: 'noiseManager'
                },
                'iridescenceNoise': {
                    class: IridescenceLayer,
                    property: 'distortionNoiseManager'
                },
                'canopyNoise': {
                    class: CanopyLayer,
                    property: 'distortionNoiseManager'
                },
                'structuralNoise': {
                    class: StructuralShadowsLayer,
                    property: 'intensityNoiseManager'
                }
            };
            if (layerMap[key]) {
                const info = layerMap[key];
                const layer = canvas.layers.find(l => l instanceof info.class);
                if (layer) {
                    if (info.method) fullscreenTexture = layer[info.method]();
                    else if (info.property && layer[info.property]?.getTexture) fullscreenTexture = layer[info.property].getTexture();
                }
            }
            isFullscreenView = true;
        }

        if (isFullscreenView) {
            this.fullscreenSprite.texture = fullscreenTexture || PIXI.Texture.EMPTY;
            this.fullscreenSprite.visible = true;
            const stage = canvas.stage;
            const screen = canvas.app.screen;
            const topLeft = stage.toLocal({
                x: 0,
                y: 0
            });
            this.fullscreenSprite.position.copyFrom(topLeft);
            this.fullscreenSprite.width = screen.width / stage.scale.x;
            this.fullscreenSprite.height = screen.height / stage.scale.y;
        } else {
            // This is the standard input mask view
            this.diagnosticContainer.visible = true;
            this.overlayContainer.visible = true;

            for (const [key, sprite] of this.diagnosticSprites.entries()) {
                const suffix = key.substring(key.indexOf('-') + 1);
                const isVisible = (displaySuffix === 'all' || displaySuffix === suffix);
                sprite.visible = isVisible;

                if (isVisible) {
                    if (displaySuffix === 'all') {
                        sprite.tint = this._getColorForSuffix(suffix);
                        sprite.alpha = 0.5;
                    } else {
                        sprite.tint = 0xFFFFFF;
                        sprite.alpha = 1.0;
                    }
                }
            }
        }
    }

    async updateEffectTargets(targets) {
        if (!this.diagnosticContainer || !this.overlayContainer) return;

        // Clear existing sprites and overlays
        this.diagnosticContainer.removeChildren().forEach(c => c.destroy());
        this.diagnosticSprites.clear();
        this.overlayContainer.removeChildren().forEach(c => c.destroy({
            children: true
        }));
        this.overlays.clear();

        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [targetId, targetData] of allTargets.entries()) {
            if (!targetData) continue;

            const activeSuffixes = [];

            // Process mask sprites
            for (const suffix of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
                const texturePath = targetData[suffix];
                const spriteKey = `${targetId}-${suffix}`;

                if (texturePath) {
                    activeSuffixes.push(suffix);
                    let sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                    this.diagnosticSprites.set(spriteKey, sprite);
                    this.diagnosticContainer.addChild(sprite);
                    await this._updateSpriteTransform(sprite, texturePath, targetData.rect);
                }
            }

            // Process outlines and labels if any effect is active on this target
            if (activeSuffixes.length > 0) {
                const overlay = new PIXI.Container();

                // Outline
                const graphics = new PIXI.Graphics();
                graphics.lineStyle(10 / canvas.stage.scale.x, 0x00FF00, 0.8);
                graphics.drawRect(targetData.rect.x, targetData.rect.y, targetData.rect.width, targetData.rect.height);
                overlay.addChild(graphics);

                // Label
                const labelText = new PIXI.Text(activeSuffixes.join(', '), {
                    fontFamily: 'Arial',
                    fontSize: 24,
                    fill: 0x00FF00,
                    stroke: '#000000',
                    strokeThickness: 4,
                    align: 'center',
                });
                labelText.x = targetData.rect.x + targetData.rect.width / 2;
                labelText.y = targetData.rect.y + targetData.rect.height / 2;
                labelText.anchor.set(0.5);
                labelText.scale.set(1 / canvas.stage.scale.x);
                overlay.addChild(labelText);

                this.overlays.set(targetId, overlay);
                this.overlayContainer.addChild(overlay);
            }
        }

        this._refreshMaskVisibility();
    }

    _getColorForSuffix(suffix) {
        let hash = 0;
        for (let i = 0; i < suffix.length; i++) {
            hash = suffix.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "0x" + "00000".substring(0, 6 - color.length) + color;
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        if (!sprite || sprite.destroyed) return;

        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }

        if (!sprite || sprite.destroyed || !sprite.anchor || !sprite.texture.valid || !rect) return;

        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
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

// --- 5.0a. Map Points Layer ---
class MapPointsLayer extends CanvasLayer {
    constructor() {
        super();
        this.mapPointsContainer = null;

        // These properties are now public and will be controlled by the Interaction Manager
        this._hoveredPoint = null;
        this._draggedPoint = null;
        this._liveDragGroup = null; // A temporary group object for live drag visuals

        this.POINT_HIT_AREA = 12; // Radius in screen pixels for clicking a point

        this._boundDrawMapPoints = this._drawMapPoints.bind(this);
    }

    /**
     * @override
     */
    async _draw(options) {
        this.mapPointsContainer = this.addChild(new PIXI.Container());
        this.alpha = (game.mapShine.mapPointsEditor && game.mapShine.mapPointsEditor.rendered) ? 1 : 0;
        Hooks.on("mapShine:mapPointsUpdated", this._boundDrawMapPoints);
        this._drawMapPoints();
    }

    /**
     * @override
     */
    async _tearDown(options) {
        Hooks.off("mapShine:mapPointsUpdated", this._boundDrawMapPoints);
        this.mapPointsContainer?.destroy({
            children: true
        });
        this.mapPointsContainer = null;
        this._hoveredPoint = null;
        this._draggedPoint = null;
        this._liveDragGroup = null;
        return super._tearDown(options);
    }

    /**
     * Public method to find which point is under the cursor.
     * The Interaction Manager will use this.
     */
    _getPointAt(position) {
        const groups = MapPointsManager.getGroups();
        const hitRadius = this.POINT_HIT_AREA / canvas.stage.scale.x;
        for (const group of Object.values(groups)) {
            for (let i = 0; i < group.points.length; i++) {
                const p = group.points[i];
                if (Math.hypot(position.x - p.x, position.y - p.y) <= hitRadius) {
                    return {
                        groupId: group.id,
                        pointIndex: i,
                        point: p
                    };
                }
            }
        }
        return null;
    }

    /**
     * Renders all points, lines, and areas from the stored data.
     * Also handles hover effects based on the public _hoveredPoint property.
     */
    _drawMapPoints() {
        if (!this.mapPointsContainer) return;
        this.mapPointsContainer.removeChildren().forEach(c => c.destroy({
            children: true
        }));

        const groups = MapPointsManager.getGroups();
        if (foundry.utils.isEmpty(groups)) return;

        const graphics = new PIXI.Graphics();
        this.mapPointsContainer.addChild(graphics);

        const groupsToDraw = this._liveDragGroup ? {
            ...groups,
            [this._liveDragGroup.id]: this._liveDragGroup
        } : groups;

        for (const group of Object.values(groupsToDraw)) {
            if (!group.points || group.points.length === 0) continue;

            const pointRadius = 8 / canvas.stage.scale.x;
            const lineThickness = 4 / canvas.stage.scale.x;
            const isLiveDragGroup = this._liveDragGroup && this._liveDragGroup.id === group.id;

            // Draw lines and area fills only for 'line' or 'area' types.
            if ((group.type === 'line' || group.type === 'area') && group.points.length > 1) {
                graphics.lineStyle(lineThickness, group.isBroken ? 0xFF0000 : 0x00FF00, isLiveDragGroup ? 0.9 : 0.7);
                graphics.moveTo(group.points[0].x, group.points[0].y);
                for (let i = 1; i < group.points.length; i++) {
                    graphics.lineTo(group.points[i].x, group.points[i].y);
                }
                if (group.type === 'area') graphics.closePath();
            }

            if (group.type === 'area' && !group.isBroken && group.points.length > 2) {
                graphics.beginFill(0x00FF00, isLiveDragGroup ? 0.4 : 0.25);
                graphics.moveTo(group.points[0].x, group.points[0].y);
                for (let i = 1; i < group.points.length; i++) {
                    graphics.lineTo(group.points[i].x, group.points[i].y);
                }
                graphics.closePath();
                graphics.endFill();
            }

            // Draw points for all group types
            for (let i = 0; i < group.points.length; i++) {
                const p = group.points[i];
                const isHovered = this._hoveredPoint && this._hoveredPoint.groupId === group.id && this._hoveredPoint.pointIndex === i;
                const isDragged = this._draggedPoint && this._draggedPoint.groupId === group.id && this._draggedPoint.pointIndex === i;

                let color = isHovered ? 0x00FFFF : 0x00A0FF;
                let alpha = isHovered ? 0.9 : 0.6;
                let radius = pointRadius;
                if (isDragged) {
                    color = 0xFF8800;
                    alpha = 1.0;
                    radius *= 1.2;
                }

                graphics.lineStyle(lineThickness / 2, 0xFFFFFF, isHovered ? 1.0 : 0.8).beginFill(color, alpha);
                graphics.drawCircle(p.x, p.y, radius);
                graphics.endFill();
            }

            // Draw labels (only for non-dragged groups)
            if (!isLiveDragGroup && group.points.length > 0) {
                const textContent = `${group.label} (${group.type})\n${group.isBroken ? 'BROKEN: ' + group.reason : ''}`;
                const label = new PIXI.Text(textContent, {
                    fontFamily: 'Arial',
                    fontSize: 20 / canvas.stage.scale.x,
                    fill: 0xFFFFFF,
                    stroke: '#000000',
                    strokeThickness: 4 / canvas.stage.scale.x,
                    align: 'left'
                });
                label.x = group.points[0].x + (15 / canvas.stage.scale.x);
                label.y = group.points[0].y - (15 / canvas.stage.scale.x);
                label.anchor.set(0, 1);
                this.mapPointsContainer.addChild(label);
            }
        }
    }
}

class MapPointsEditor extends FormApplication {
    constructor(options = {}) {
        super(options);
        this._selectedGroupId = game.user.getFlag(MODULE_ID, "lastSelectedMapPointGroup") || null;
        game.mapShine.activeMapPointGroup = this._selectedGroupId;

        // Hook to re-render this UI if the underlying data changes elsewhere.
        this._hookId = Hooks.on("mapShine:mapPointsUpdated", () => {
            if (this.rendered) this.render(false);
        });
    }

    /**
     * @override
     * The form element is the root of this application's template. We override the
     * default `form` property to ensure it correctly references our root element.
     * The base `FormApplication` constructor attempts to set this property to `null`,
     * so we must provide both a getter and a setter.
     */
    get form() {
        // The `element` is a jQuery object; `[0]` gets the raw DOM element.
        return this.element?.[0];
    }

    set form(value) {
        // This setter intentionally does nothing. The base class's constructor
        // will attempt to set `this.form = null`, which would throw an error if this
        // setter did not exist. By providing an empty setter, we allow the
        // constructor to complete without error, while our getter continues to
        // provide the correct, dynamically-retrieved form element.
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "map-shine-points-editor",
            title: "Map Shine: Point Group Editor",
            template: null, // We build the HTML in code.
            width: 550,
            height: "auto",
            resizable: true,
            closeOnSubmit: false,
            submitOnChange: false,
            zIndex: 10001
        });
    }

    async getData(options) {
        return {
            groups: MapPointsManager.getGroups()
        };
    }

    async render(force, options) {
        await super.render(force, options);
        const layer = canvas.layers.find(l => l instanceof MapPointsLayer);
        if (layer) {
            layer.alpha = 1;
        }
        return this;
    }

    /**
     * @override
     * This method is responsible for building and returning the HTML content of the application.
     */
    async _renderInner(data) {
        const html = this._buildHTML(data);
        // We are building the HTML content programmatically, so we do not call super._renderInner,
        // which would attempt to load a template file. Instead, we wrap our generated HTML string
        // in a jQuery object, which is what the render workflow expects.
        return $(html);
    }

    /**
     * Generates the complete inner HTML for the form.
     * @param {object} data - The data from the getData method.
     * @returns {string} The HTML string for the form.
     */
    _buildHTML(data) {
        const groups = Object.values(data.groups);
        const selectedGroup = this._selectedGroupId ? data.groups[this._selectedGroupId] : null;

        // Details Panel HTML
        let detailsHTML;
        if (selectedGroup) {
            const effectOptions = Object.entries(EFFECT_SOURCE_OPTIONS)
                .map(([key, name]) => `<option value="${key}" ${selectedGroup.effectTarget === key ? 'selected' : ''}>${name}</option>`)
                .join('');

            detailsHTML = `
                            <div class="mp-details-header">
                                <h4>${selectedGroup.label}</h4>
                                <button type="button" data-action="delete-group" class="delete-btn" title="Delete Group"><i class="fas fa-trash"></i> Delete Group</button>
                            </div>
                            <ul class="mp-points-list">
                                ${selectedGroup.points.map((p, i) => `
                                    <li class="mp-point-item">
                                        <span>#${i+1}</span>
                                        <span>X: ${Math.round(p.x)}</span>
                                        <span>Y: ${Math.round(p.y)}</span>
                                        <button type="button" data-action="delete-point" data-point-index="${i}" title="Delete Point"><i class="fas fa-times"></i></button>
                                    </li>
                                `).join('')}
                            </ul>
                            <div class="mp-effect-source-settings">
                                <h4><i class="fas fa-magic"></i> Effect Source</h4>
                                <div class="control-row">
                                    <label for="mp-isEffectSource" title="If checked, this group's geometry will be used to generate the selected effect.">Use as Effect Source</label>
                                    <input type="checkbox" name="isEffectSource" id="mp-isEffectSource" ${selectedGroup.isEffectSource ? 'checked' : ''}>
                                </div>
                                <div class="control-row" id="mp-effectTarget-wrapper" style="display: ${selectedGroup.isEffectSource ? 'flex' : 'none'};">
                                    <label for="mp-effectTarget">Target Effect</label>
                                    <select name="effectTarget" id="mp-effectTarget">
                                        ${effectOptions}
                                    </select>
                                </div>
                            </div>
                        `;
        } else {
            detailsHTML = `<div class="mp-details-placeholder">Select a group to view its details.</div>`;
        }

        // Determine button state and text for the placement tool
        const isPlacementActive = game.mapShine.mapPointsInteractionManager.isActive;
        const placementButtonText = isPlacementActive ? 'Deactivate Point Placement Mode' : 'Activate Point Placement Mode';
        const placementButtonClass = isPlacementActive ? 'active' : '';

        // Main Template
        return `
                        <style>
                            /* General Layout & Theme */
                            #map-shine-points-editor .window-content { background: none; padding: 0; }
                            .mp-editor { display: flex; flex-direction: column; background: rgba(40, 40, 40, 0.95); color: #fff; padding: 8px; gap: 8px; height: 100%; box-sizing: border-box; }
                            .mp-main-content { display: flex; gap: 8px; flex-grow: 1; min-height: 300px; }
                            .mp-panel { display: flex; flex-direction: column; background: rgba(0,0,0,0.2); border-radius: 3px; padding: 8px; gap: 8px; }
                            .mp-panel-groups { flex: 1; min-width: 200px; }
                            .mp-panel-details { flex: 2; min-width: 200px; }
                            .mp-panel h3, .mp-panel h4 { margin: 0 0 8px 0; text-align: center; border-bottom: 1px solid #555; padding-bottom: 8px; font-weight: bold; }

                            /* Forms & Inputs */
                            .mp-editor input[type="text"], .mp-editor select {
                                background: #2a2a2a;
                                border: 1px solid #666;
                                color: #eee;
                                border-radius: 3px;
                                padding: 6px;
                                width: 100%;
                                box-sizing: border-box;
                            }
                            .mp-editor select option {
                                background-color: #3a3a3a;
                                color: #eee;
                            }
                            .mp-editor input[type="text"]::placeholder { color: #888; }
                            .mp-editor button {
                                background: #3a3a3a; border: 1px solid #666; color: #ccc; border-radius: 3px; padding: 6px 10px; cursor: pointer;
                                display: flex; align-items: center; justify-content: center; gap: 5px;
                            }
                            .mp-editor button:hover { background: #555; border-color: #888; }
                            .mp-editor select:focus, .mp-editor input:focus { outline: 1px solid #40a0fa; }

                            /* Left Panel: Group List */
                            .mp-group-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; flex-grow: 1; }
                            .mp-group-item { display: flex; align-items: center; padding: 5px; margin-bottom: 2px; border-radius: 3px; cursor: pointer; border: 1px solid transparent; transition: background-color 0.2s; }
                            .mp-group-item:hover { background: rgba(255,255,255,0.1); }
                            .mp-group-item.selected { background: #005a9e; border-color: #40a0fa; }
                            .mp-group-item-status { width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; flex-shrink: 0; }
                            .mp-group-item-status.valid { background: #4cfa40; }
                            .mp-group-item-status.broken { background: #fa4040; }
                            .mp-group-item-label { flex-grow: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                            .mp-group-item-type { color: #aaa; margin-left: 8px; font-size: 0.9em; }

                            /* Left Panel: Create Group Form */
                            .mp-create-group-form { 
                                margin-top: auto; padding-top: 8px; border-top: 1px solid #555;
                                display: grid; grid-template-columns: 1fr; gap: 5px;
                            }
                            .mp-create-group-form .create-controls { display: grid; grid-template-columns: 1fr auto; gap: 5px; }
                            .mp-create-group-form button {
                                background-color: #2a552a; border-color: #6aaa6a; color: #ccffcc; font-weight: bold;
                            }
                            .mp-create-group-form button:hover { background-color: #3a753a; }

                            /* Right Panel: Details */
                            .mp-details-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; text-align: center; color: #888; }
                            .mp-details-header { display: flex; justify-content: space-between; align-items: center; }
                            .mp-details-header h4 { border-bottom: none; text-align: left; flex-grow: 1; margin: 0; padding: 0; }
                            .mp-details-header .delete-btn { background: #662222; border-color: #aa6666; color: #ffcccc; }
                            .mp-details-header .delete-btn:hover { background: #883333; }
                            .mp-points-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; max-height: 280px; }
                            .mp-point-item { display: grid; grid-template-columns: 25px 1fr 1fr auto; align-items: center; gap: 8px; padding: 4px; border-radius: 2px; font-family: monospace; }
                            .mp-point-item:nth-child(odd) { background: rgba(0,0,0,0.15); }
                            .mp-point-item button { background: none; border: none; width: 22px; height: 22px; line-height: 20px; padding: 0; font-size: 14px; color: #ff8080; }
                            .mp-point-item button:hover { color: #fff; background: rgba(255,0,0,0.3); }
                            
                            /* Right Panel: Effect Source */
                            .mp-effect-source-settings { margin-top: auto; padding-top: 10px; border-top: 1px solid #555; }
                            .mp-effect-source-settings h4 { text-align: left; border-bottom: none; font-size: 1.1em; margin-bottom: 8px; }
                            .mp-effect-source-settings .control-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; gap: 10px; }
                            .mp-effect-source-settings .control-row label { flex-shrink: 0; }
                            .mp-effect-source-settings select { flex-grow: 1; }
                            
                            /* Footer */
                            .mp-editor-footer button { 
                                width: 100%; padding: 8px; font-weight: bold; font-size: 1.1em; 
                                background-color: #225522; border-color: #66aa66; color: #ccffcc; 
                            }
                            .mp-editor-footer button:hover { background-color: #337733; }
                            .mp-editor-footer button.active { background-color: #aa4444; border-color: #ff8888; color: #ffeeee; }
                            .mp-editor-footer button.active:hover { background-color: #c86464; }
                        </style>
                        <form class="mp-editor">
                            <div class="mp-main-content">
                                <div class="mp-panel mp-panel-groups">
                                    <h3>Groups</h3>
                                    <ul class="mp-group-list">
                                        ${groups.map(g => `
                                            <li class="mp-group-item ${g.id === this._selectedGroupId ? 'selected' : ''}" data-group-id="${g.id}" data-action="select-group">
                                                <span class="mp-group-item-status ${g.isBroken ? 'broken' : 'valid'}" title="${g.isBroken ? g.reason : 'Valid'}"></span>
                                                <span class="mp-group-item-label">${g.label}</span>
                                                <span class="mp-group-item-type">${g.type}</span>
                                            </li>
                                        `).join('')}
                                    </ul>
                                    <div class="mp-create-group-form">
                                        <input type="text" name="newGroupName" placeholder="New Group Name">
                                        <div class="create-controls">
                                            <select name="newGroupType">
                                                <option value="point">Points</option>
                                                <option value="line">Line</option>
                                                <option value="area">Area</option>
                                            </select>
                                        </div>
                                        <button type="button" data-action="create-group">Create Group</button>
                                    </div>
                                </div>
                                <div class="mp-panel mp-panel-details">
                                    ${detailsHTML}
                                </div>
                            </div>
                            <div class="mp-editor-footer">
                                <button type="button" data-action="toggle-placement" class="${placementButtonClass}" style="width: 100%;">${placementButtonText}</button>
                            </div>
                        </form>
                    `;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const form = html.filter('form')[0]; // Reliably find the form element
        if (form) {
            form.addEventListener('click', this._onClick.bind(this));
            // Add the 'input' event listener to capture dropdown changes instantly.
            form.addEventListener('input', this._onPropertyChange.bind(this));
            form.addEventListener('change', this._onPropertyChange.bind(this));
        }
    }

    async _onPropertyChange(event) {
        const target = event.target;
        // Check if the changed element is one we care about.
        if (target.name !== 'isEffectSource' && target.name !== 'effectTarget') return;
        if (!this._selectedGroupId) return;

        const form = this.form;
        const isEffectSource = form.querySelector('[name="isEffectSource"]').checked;
        const effectTarget = form.querySelector('[name="effectTarget"]').value;

        // Toggle visibility of the dropdown
        const wrapper = form.querySelector('#mp-effectTarget-wrapper');
        if (wrapper) {
            wrapper.style.display = isEffectSource ? 'flex' : 'none';
        }

        await MapPointsManager.updateGroupProperties(this._selectedGroupId, {
            isEffectSource,
            effectTarget
        });
    }

    async _onClick(event) {
        // Find the closest element with a data-action attribute
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
                const newGroupId = await MapPointsManager.createGroup({
                    label: nameInput.value || "New Group",
                    type: typeInput.value
                });
                this._selectedGroupId = newGroupId;
                game.user.setFlag(MODULE_ID, "lastSelectedMapPointGroup", newGroupId);
                game.mapShine.activeMapPointGroup = newGroupId;
                nameInput.value = '';
                // The hook will trigger a re-render automatically.
                break;
            }
            case 'delete-group': {
                if (this._selectedGroupId) {
                    const group = MapPointsManager.getGroup(this._selectedGroupId);
                    Dialog.confirm({
                        title: "Delete Group",
                        content: `<p>Are you sure you want to delete the group "<strong>${group.label}</strong>"?</p>`,
                        yes: async () => {
                            await MapPointsManager.deleteGroup(this._selectedGroupId);
                            this._selectedGroupId = null;
                            game.mapShine.activeMapPointGroup = null;
                            game.user.unsetFlag(MODULE_ID, "lastSelectedMapPointGroup");
                        },
                        defaultYes: false,
                    });
                }
                break;
            }
            case 'delete-point': {
                const pointIndex = parseInt(target.dataset.pointIndex, 10);
                if (this._selectedGroupId && !isNaN(pointIndex)) {
                    await MapPointsManager.deletePoint(this._selectedGroupId, pointIndex);
                }
                break;
            }
            case 'toggle-placement': {
                const manager = game.mapShine.mapPointsInteractionManager;
                if (manager.isActive) {
                    manager.deactivate();
                } else {
                    manager.activate();
                }
                break;
            }
        }
    }

    async _updateObject(event, formData) {
        // This form doesn't have a single "submit" action, so this method can be left empty.
    }

    async close(options) {
        // Deactivate placement mode when the editor is closed.
        game.mapShine.mapPointsInteractionManager?.deactivate();

        Hooks.off("mapShine:mapPointsUpdated", this._hookId);
        game.mapShine.mapPointsEditor = null;

        const layer = canvas.layers.find(l => l instanceof MapPointsLayer);
        if (layer) {
            layer.alpha = 0;
        }

        return super.close(options);
    }
}

class MapPointsInteractionManager {
    constructor() {
        this.isActive = false;
        this._draggedPoint = null;

        // Bind event handlers once
        this._onPointerDown = this._onPointerDown.bind(this);
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
    }

    get layer() {
        return canvas.layers.find(l => l instanceof MapPointsLayer);
    }

    get editor() {
        return game.mapShine.mapPointsEditor;
    }

    activate() {
        if (this.isActive || !game.user.isGM) return; // Added GM check
        const layer = this.layer;
        if (!layer) return;

        this.isActive = true;
        canvas.stage.interactive = true; // Ensure the main stage is listening
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
        // In case a drag was interrupted, remove the 'up' listener too
        canvas.stage.off('pointerup', this._onPointerUp);

        document.getElementById('board').style.cursor = 'default';

        // Clear any lingering visual state
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
                // Start a drag operation
                this._draggedPoint = hovered;
                layer._draggedPoint = hovered; // Set visual state
                layer._drawMapPoints();
                // Add listener to the stage to catch pointer up everywhere
                canvas.stage.once('pointerup', this._onPointerUp);
            } else {
                // Add a new point
                const activeGroupId = game.mapShine.activeMapPointGroup;
                if (activeGroupId) {
                    MapPointsManager.addPoint(activeGroupId, worldPos);
                } else {
                    ui.notifications.warn("Map Shine | No active group selected to add a point.");
                }
            }
        } else if (event.nativeEvent.button === 2) { // Right Click
            if (hovered) {
                MapPointsManager.deletePoint(hovered.groupId, hovered.pointIndex);
            }
        }
    }

    _onPointerMove(event) {
        if (!this.isActive) return;

        const layer = this.layer;
        if (!layer || !event.global) return;

        const worldPos = layer.toLocal(event.global);

        if (this._draggedPoint) {
            // Live drag update
            const group = MapPointsManager.getGroup(this._draggedPoint.groupId);
            if (group) {
                const tempPoints = [...group.points];
                tempPoints[this._draggedPoint.pointIndex] = worldPos;
                const tempGroup = {
                    ...group,
                    points: tempPoints
                };
                layer._liveDragGroup = MapPointsManager.validate(tempGroup);
                layer._drawMapPoints(); // Redraw with the temporary group state
            }
        } else {
            // Hover effect update
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
            // If the event somehow doesn't have global coords, reset state and exit.
            this._draggedPoint = null;
            layer._draggedPoint = null;
            layer._liveDragGroup = null;
            layer._drawMapPoints(); // Redraw to clear drag visuals
            return;
        }

        const worldPos = layer.toLocal(event.global);

        // Finalize the drag
        MapPointsManager.updatePoint(
            this._draggedPoint.groupId,
            this._draggedPoint.pointIndex,
            worldPos
        );

        // Reset drag state
        this._draggedPoint = null;
        layer._draggedPoint = null;
        layer._liveDragGroup = null;
        // The mapPointsUpdated hook will trigger the final redraw.
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

// --- 5.1. Background Layer (Simple passthrough for base textures) ---
class BackgroundLayer extends CanvasLayer {
    constructor() {
        super();

        this.effectSprites = new Map();
        this._onResizeBound = this._onResize.bind(this);
    }

    async _draw(options) {
        console.log("BackgroundLayer | Drawing layer.");

        this.container = new PIXI.Container();
        this.addChild(this.container);

        window.addEventListener('resize', this._onResizeBound);
    }

    async updateEffectTargets(targets) {
        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {

            if (!targetData?.baseTexturePath) continue;

            validTargetIds.add(id);
            let sprite = this.effectSprites.get(id);

            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.effectSprites.set(id, sprite);
                this.container.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.baseTexturePath, targetData.rect);
        }

        for (const [id, sprite] of this.effectSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.effectSprites.delete(id);
            }
        }
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }

        if (!sprite.texture.valid || !rect) return;

        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _onResize() {
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }

    _tearDown(options) {
        console.log("BackgroundLayer | Tearing down layer.");
        window.removeEventListener('resize', this._onResizeBound);

        // The container holds all the effect sprites. Destroying it will destroy them.
        this.container?.destroy({
            children: true
        });

        // Clear the map and nullify references
        this.effectSprites.clear();
        this.container = null;
    }
}

// --- 5.2. Metallic Shine ---
class ShinePatternFilter extends PIXI.Filter {
    constructor(options) {
        super(PIXI.Filter.defaultVertexSrc, `
                    precision mediump float;
                    varying vec2 vTextureCoord;

                    uniform sampler2D uSampler;
                    uniform sampler2D u_noiseMap;

                    uniform float u_time;
                    uniform vec2 u_resolution; 

                    // Parallax & Transform Uniforms
                    uniform float u_parallaxAmount; 
                    uniform float u_parallaxJitter;
                    uniform float u_parallaxJitterSpeed;
                    uniform vec2 u_camera_offset;
                    uniform vec2 u_view_size;

                    uniform float u_globalIntensity;
                    uniform float u_shared_maxBrightness;
                    uniform float u_shared_patternScale;

                    uniform bool u_noise_enabled;
                    uniform bool u_s1_enabled, u_s2_enabled;
                    uniform float u_s1_speed, u_s1_intensity, u_s1_angle_rad, u_s1_sharpness, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp;
                    uniform float u_s2_speed, u_s2_intensity, u_s2_angle_rad, u_s2_sharpness, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp;

                    const float PI = 3.14159265359;
                    float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }

                    float noise(vec2 st) {
                        vec2 i = floor(st);
                        vec2 f = fract(st);
                        vec2 u = f * f * (3.0 - 2.0 * f);
                        return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                                mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
                    }

                    float createStripeLayer(vec2 uv, float t, float angle, float density, float width, float sub_count, float sub_sharp, float sharp) {
                        float p_perp = uv.x * cos(angle) + uv.y * sin(angle); 
                        float band_coord = p_perp * density;
                        float band_id = floor(band_coord); 
                        float in_band_pos = fract(band_coord);

                        float result = 0.0;
                        if (in_band_pos <= width) {
                            float r1 = random(vec2(band_id)); 
                            float r2 = random(vec2(band_id, r1)); 
                            float r3 = random(vec2(r1, r2));
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
                        // Calculate world-space coordinates (fixed to the map)
                        vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);

                        // Calculate screen-space coordinates (fixed to the camera/screen)
                        vec2 screen_coord = vTextureCoord * u_resolution - (u_resolution * 0.5);

                        // Blend between world and screen space based on the parallax amount
                        vec2 mixed_coords = mix(world_coord, screen_coord, u_parallaxAmount);
                        
                        // Add parallax jitter if enabled
                        if (u_parallaxJitter > 0.0) {
                            float jitter_time = u_time * u_parallaxJitterSpeed * 0.1;
                            vec2 jitter_noise_coord = world_coord * 0.05; // Use world coordinates for stable noise
                            float jitter_x = (noise(jitter_noise_coord + jitter_time) - 0.5) * 2.0;
                            float jitter_y = (noise(jitter_noise_coord - jitter_time + vec2(37.3, -84.1)) - 0.5) * 2.0;
                            mixed_coords += vec2(jitter_x, jitter_y) * u_parallaxJitter;
                        }

                        // Apply the user-controlled pattern scale to the final mixed coordinates
                        vec2 pattern_uv = mixed_coords * u_shared_patternScale / 80.0;
                        
                        float pattern1 = u_s1_enabled ? createStripeLayer(pattern_uv, u_time * u_s1_speed, u_s1_angle_rad, u_s1_band_density, u_s1_band_width, u_s1_sub_stripe_max_count, u_s1_sub_stripe_max_sharp, u_s1_sharpness) * u_s1_intensity : 0.0;
                        float pattern2 = u_s2_enabled ? createStripeLayer(pattern_uv, u_time * u_s2_speed, u_s2_angle_rad, u_s2_band_density, u_s2_band_width, u_s2_sub_stripe_max_count, u_s2_sub_stripe_max_sharp, u_s2_sharpness) * u_s2_intensity : 0.0;

                        float noise_mask = u_noise_enabled ? texture2D(u_noiseMap, vTextureCoord).r : 1.0; 
                        float shineIntensity = max(pattern1, pattern2) * u_shared_maxBrightness * u_globalIntensity * noise_mask;

                        vec3 final_rgb = vec3(1.0) * shineIntensity;
                        gl_FragColor = vec4(final_rgb, 1.0);
                    }
                `, {
            ...options
        });
    }
}

class MetallicShineFilter extends PIXI.Filter {
    constructor(options) {
        const vertexSrc = `
                    attribute vec2 aVertexPosition;
                    attribute vec2 aTextureCoord;

                    uniform mat3 projectionMatrix;

                    varying vec2 vTextureCoord; 
                    varying vec2 vScreenCoord;  

                    void main(void)
                    {
                        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                        vTextureCoord = aTextureCoord;
                        vScreenCoord = gl_Position.xy * 0.5 + 0.5;
                    }
                `;

        const fragmentSrc = `
                    precision mediump float;

                    varying vec2 vTextureCoord;
                    varying vec2 vScreenCoord;

                    // Samplers
                    uniform sampler2D uSampler;
                    uniform sampler2D uShinePatternMap;
                    uniform sampler2D uStructuralMask;
                    uniform sampler2D uOutdoorsMask;

                    // Toggles
                    uniform bool uUseStructuralMask;
                    uniform bool uUseOutdoorsMask;

                    // Base Shine Uniforms
                    uniform float uBoost;

                    // Color Correction Uniforms
                    uniform bool uCCEnabled;
                    uniform float uSaturation, uBrightness, uContrast;
                    uniform float uExposure, uGamma, uInBlack, uInWhite;
                    uniform vec3 uTintColor;
                    uniform float uTintAmount;

                    const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                    void main(void) {
                        vec4 specularColor = texture2D(uSampler, vTextureCoord);
                        float baseSpecularLuminance = dot(specularColor.rgb, lum_weights);
                        float finalSpecularLuminance = baseSpecularLuminance;

                        // Conditionally apply structural shadows.
                        if (uUseStructuralMask) {
                            float structuralLight = texture2D(uStructuralMask, vScreenCoord).r;
                            
                            if (uUseOutdoorsMask) {
                                float outdoorsAmount = texture2D(uOutdoorsMask, vScreenCoord).r;
                                // When outdoors (outdoorsAmount=1), use the original specular.
                                // When indoors (outdoorsAmount=0), use the specular multiplied by the structural light.
                                finalSpecularLuminance = mix(baseSpecularLuminance * structuralLight, baseSpecularLuminance, outdoorsAmount);
                            } else {
                                // If no outdoors mask is present, apply shadows everywhere.
                                finalSpecularLuminance = baseSpecularLuminance * structuralLight;
                            }
                        }

                        if (specularColor.a < 0.1 || finalSpecularLuminance < 0.01) {
                            gl_FragColor = vec4(0.0);
                            return;
                        }

                        float shinePatternIntensity = texture2D(uShinePatternMap, vScreenCoord).r;
                        vec3 workingColor = vec3(shinePatternIntensity * uBoost);

                        if (uCCEnabled) {
                            if (uInWhite > uInBlack) workingColor = (workingColor - uInBlack) / (uInWhite - uInBlack);
                            workingColor *= pow(2.0, uExposure);
                            if (uGamma > 0.0) workingColor = pow(workingColor, vec3(1.0 / uGamma));
                            workingColor += uBrightness;
                            workingColor = (workingColor - 0.5) * uContrast + 0.5;
                            float luminance = dot(workingColor, lum_weights);
                            workingColor = mix(vec3(luminance), workingColor, uSaturation);
                            workingColor = mix(workingColor, uTintColor, uTintAmount);
                        }

                        vec3 finalColor = workingColor * finalSpecularLuminance;
                        finalColor = clamp(finalColor, 0.0, 1.0);
                        gl_FragColor = vec4(finalColor, shinePatternIntensity * specularColor.a);
                    }
                `;

        super(vertexSrc, fragmentSrc, {
            uShinePatternMap: options.shinePatternTexture,
            uStructuralMask: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            uUseStructuralMask: false,
            uUseOutdoorsMask: false,
            uBoost: options.boost ?? 1.0,

            uCCEnabled: options.uCCEnabled ?? true,
            uSaturation: options.uSaturation ?? 1.0,
            uBrightness: options.uBrightness ?? 0.0,
            uContrast: options.uContrast ?? 1.0,
            uExposure: options.uExposure ?? 0.0,
            uGamma: options.uGamma ?? 1.0,
            uInBlack: options.uInBlack ?? 0.0,
            uInWhite: options.uInWhite ?? 1.0,
            uTintColor: options.uTintColor ?? [1.0, 1.0, 1.0],
            uTintAmount: options.uTintAmount ?? 0.0,
        });
    }
}

class ThresholdFilter extends PIXI.Filter {
    constructor(threshold = 0.5) {
        super(PIXI.Filter.defaultVertexSrc, `
                    precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_threshold;
                    void main(void) {
                        vec4 color = texture2D(uSampler, vTextureCoord);
                        float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                        if (brightness < u_threshold) { gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); }
                        else { gl_FragColor = color; }
                    }
                `, {
            u_threshold: threshold
        });
    }
    get threshold() {
        return this.uniforms.u_threshold;
    }
    set threshold(value) {
        this.uniforms.u_threshold = value;
    }
}

class StarburstFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
                    precision mediump float;
                    varying vec2 vTextureCoord;
                    uniform sampler2D uSampler;

                    uniform float u_threshold;
                    uniform float u_intensity;
                    uniform float u_angle_rad;
                    uniform int u_points;
                    uniform float u_size;
                    uniform float u_falloff;
                    uniform vec2 u_texel_size;

                    const float PI = 3.14159265359;
                    const int MAX_SAMPLES_PER_RAY = 256; 

                    const int MAX_POINTS = 16;

                    const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                    void main(void) {
                        vec4 originalColor = texture2D(uSampler, vTextureCoord);
                        float brightness = dot(originalColor.rgb, lum_weights);

                        if (brightness < u_threshold) {
                            gl_FragColor = vec4(0.0);
                            return;
                        }

                        vec3 starColor = vec3(0.0);
                        float angle_step = 2.0 * PI / float(u_points);

                        for (int i = 0; i < MAX_POINTS; i++) {

                            if (i < u_points) {
                                float current_angle = u_angle_rad + float(i) * angle_step;
                                vec2 direction = vec2(cos(current_angle), sin(current_angle));

                                for (int j = 1; j < MAX_SAMPLES_PER_RAY; j++) {
                                    if (float(j) <= u_size) {
                                        float distance = float(j);
                                        vec2 sampleCoord = vTextureCoord + direction * distance * u_texel_size;

                                        vec3 sample_color = texture2D(uSampler, sampleCoord).rgb;
                                        float sample_brightness = dot(sample_color, lum_weights);
                                        float dist_falloff = pow(1.0 - (distance / u_size), u_falloff);

                                        starColor += sample_color * sample_brightness * dist_falloff;
                                    }
                                }
                            }
                        }

                        float star_brightness = dot(starColor * u_intensity, lum_weights);
                        gl_FragColor = vec4(starColor * u_intensity, clamp(star_brightness, 0.0, 1.0));
                    }
                `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_threshold: options.threshold ?? 0.85,
            u_intensity: options.intensity ?? 0.5,
            u_angle_rad: (options.angle ?? 0.0) * (Math.PI / 180.0),
            u_points: options.points ?? 5,
            u_size: options.size ?? 80.0,
            u_falloff: options.falloff ?? 4.0,
            u_texel_size: [1.0 / (window.innerWidth * window.devicePixelRatio), 1.0 / (window.innerHeight * window.devicePixelRatio)]
        });
    }
}

class MetallicShineLayer extends CanvasLayer {
    constructor() {
        super();
        // --- Self-Contained Pipeline Objects ---
        this.patternTexture = null;
        this.patternSourceSprite = null;
        this.shinePatternFilter = null;
        this.noiseTextureManager = null;

        this.sourceContainer = null;
        this.effectSprites = new Map();
        this.shinePassTexture = null;

        this.shineSprite = null;
        this.bloomSprite = null;
        this.starburstSprite = null;

        this.shineFilter = null;
        this.bloomFilters = [];
        this.starburstFilter = null;

        this._destroyed = false;
        this._framesSinceLoad = 0;
    }

    static getSettingsHTML() {
        const effectKey = 'baseShine';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
                    ${checkboxHTML}
                    <hr style="border-color: #555; margin: 6px 0;">
                    ${DebuggerUIBuilder._createTextureInputHTML('specular', 'Specular/Reflect Map')}
                    <p class="description-text">A grayscale texture where white areas reflect the animated pattern and black areas reflect nothing. This is the primary mask for this effect.</p>
                    <details id="details-baseShine-animation"><summary><span class="accordion-toggle"></span><strong>Animation & Compositing</strong></summary>
                        <div>
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.globalIntensity', 'Global Intensity', 0, 10, 0.1, 'Controls the overall brightness of the shine effect.')}
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.parallaxAmount', 'Parallax Amount', 0, 1, 0.01, "Controls shine movement with the camera. A value of 1 pins the effect to the camera, a low value means higher level of animation/movement.")}
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.parallaxJitter', 'Parallax Jitter', 0, 2.0, 0.01, 'Adds a high-frequency shimmer to the parallax effect based on camera position.')}
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.parallaxJitterSpeed', 'Jitter Speed', 0, 20, 0.1, 'The animation speed of the parallax jitter noise.')}
                        ${DebuggerUIBuilder._createSliderHTML('baseShine.animation.updateFrequency', 'Update Frequency (Frames)', 0, 60, 1, 'How often the pattern updates. Higher values improve performance but make animation less smooth. 0 = every frame.')}
                        </div>
                    </details>
                    <details id="details-baseShine-pattern"><summary><span class="accordion-toggle"></span><strong>Pattern Generator</strong></summary>
                        <div>
                            ${DebuggerUIBuilder._createSelectHTML('baseShine.patternType', 'Type', {'Stripes': 'stripes', 'Checkerboard': 'checkerboard'}, 'The base procedural shape of the shine.')}
                            <div id="pattern-stripes-controls">
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.shared.patternScale', 'Pattern Scale', 0.01, 4, 0.01, 'Overall zoom level of the stripe patterns.')}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.shared.maxBrightness', 'Max Brightness', 0, 2, 0.01, 'A cap on the brightness of the generated pattern.')}
                                <details id="details-baseShine-pattern-s1"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.pattern.stripes1.enabled', 'Stripe Layer A', true)}</div></summary>
                                    <div>
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.intensity', 'Intensity', 0, 2, 0.05, 'Brightness of this individual stripe layer.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.speed', 'Speed', -0.1, 0.1, 0.001, 'How fast the sub-stripes animate within the bands.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.angle', 'Angle', 0, 360, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.sharpness', 'Edge Falloff', 0.1, 8, 0.1, 'How soft or hard the edges of the main bands are.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.bandDensity', 'Band Density', 1, 64, 0.5, 'How many main bands appear on screen.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.bandWidth', 'Band Width', 0.1, 1, 0.01, 'The width of the main bands, as a fraction of the space between them.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1, 'The maximum number of smaller stripes that can appear inside a main band.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes1.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5, 'The sharpness of the smaller, internal stripes.')}
                                    </div>
                                </details>     
                                <details id="details-baseShine-pattern-s2"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.pattern.stripes2.enabled', 'Stripe Layer B', true)}</div></summary>
                                    <div>
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.intensity', 'Intensity', 0, 2, 0.05, 'Brightness of this individual stripe layer.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.speed', 'Speed', -0.1, 0.1, 0.001, 'How fast the sub-stripes animate within the bands.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.angle', 'Angle', 0, 360, 1)}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.sharpness', 'Edge Falloff', 0.1, 8, 0.1, 'How soft or hard the edges of the main bands are.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.bandDensity', 'Band Density', 1, 64, 0.5, 'How many main bands appear on screen.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.bandWidth', 'Band Width', 0.1, 1, 0.01, 'The width of the main bands, as a fraction of the space between them.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxCount', 'Sub-Stripe Count', 1, 20, 1, 'The maximum number of smaller stripes that can appear inside a main band.')}
                                        ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.stripes2.subStripeMaxSharp', 'Sub-Stripe Sharp', 1, 32, 0.5, 'The sharpness of the smaller, internal stripes.')}
                                    </div>
                                </details>
                            </div>
                            <div id="pattern-checkerboard-controls" style="display: none;">
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.checkerboard.gridSize', 'Grid Size', 2, 64, 2)}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.checkerboard.brightness1', 'Brightness 1', 0, 1, 0.01)}
                                ${DebuggerUIBuilder._createSliderHTML('baseShine.pattern.checkerboard.brightness2', 'Brightness 2', 0, 1, 0.01)}
                            </div>
                        </div>
                    </details>
                    <details id="details-baseShine-noise"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.noise.enabled', 'Pattern Noise Mask', true)}</div></summary>
                        <div>
                            <p class="description-text">Applies a noise pattern over the stripes to add texture and break up the uniformity.</p>
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.speed', 'Speed', -0.5, 0.5, 0.001)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.scale', 'Scale', 0.1, 10, 0.1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.threshold', 'Threshold', 0, 1, 0.01, 'Cuts off noise values below this, creating harder-edged noise.')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.brightness', 'Brightness', -1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.contrast', 'Contrast', 0, 5, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.noise.softness', 'Softness', 0.01, 1, 0.01, 'How gradual the transition is at the threshold edge.')}
                        </div>
                    </details>
                    <details id="details-baseShine-colorCorrection">
                        <summary>
                            <span class="accordion-toggle"></span>
                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.colorCorrection.enabled', 'Shine Color Correction', true)}</div>
                        </summary>
                        <div>
                            <p class="description-text">Fine-tunes the color and intensity of the metallic reflection itself, allowing for deep blacks and brilliant highlights.</p>
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.saturation', 'Saturation', 0, 4, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.brightness', 'Brightness', -1, 1, 0.01)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.contrast', 'Contrast', 0, 4, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.exposure', 'Exposure', -2, 2, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.gamma', 'Gamma', 0.2, 2.5, 0.05)}
                            <details id="details-baseShine-cc-levels">
                                <summary><span class="accordion-toggle"></span><strong>Levels</strong></summary>
                                <div style="padding-left: 15px;">
                                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.levels.inBlack', 'Black Point', 0, 1, 0.01)}
                                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.levels.inWhite', 'White Point', 0, 1, 0.01)}
                                </div>
                            </details>
                            <details id="details-baseShine-cc-tint">
                                <summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary>
                                <div style="padding-left: 15px;">
                                    ${DebuggerUIBuilder._createColorPickerHTML('baseShine.colorCorrection.tint.color', 'Tint Color')}
                                    ${DebuggerUIBuilder._createSliderHTML('baseShine.colorCorrection.tint.amount', 'Tint Amount', 0, 1, 0.01)}
                                </div>
                            </details>
                        </div>
                    </details>
                    <details id="details-baseShine-bloom"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.shineBloom.enabled', 'Shine Bloom Effect', true)}</div></summary>
                        <div>
                            <div class="warning-box" style="background-color: #554422; border-color: #ffaa66;">
                                <strong style="color: #ffddaa;">PERFORMANCE WARNING:</strong> This effect can be demanding. Lowering 'Quality' can improve performance significantly.
                            </div>
                            <p class="description-text">Adds a soft glow to the brightest parts of the shine effect.</p>
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.threshold', 'Threshold', 0, 1, 0.01, 'Only areas brighter than this will bloom.')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.brightness', 'Brightness', 0, 5, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.blur', 'Blur Amount', 0, 20, 0.5)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.shineBloom.quality', 'Quality', 1, 15, 1, 'Number of blur samples. Higher is smoother but much slower.')}
                            <details id="details-baseShine-rgbSplit"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.rgbSplit.enabled', 'RGB Split', true)}</div></summary>
                                <div>${DebuggerUIBuilder._createSliderHTML('baseShine.rgbSplit.amount', 'Amount', 0, 10, 0.1, 'Adds a chromatic aberration effect to the bloom.')}</div>
                            </details>
                        </div>
                    </details>
                    <details id="details-baseShine-starburst"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('baseShine.starburst.enabled', 'Shine Starburst Effect', true)}</div></summary>
                        <div>
                            <div class="warning-box">
                                <strong style="color: #ffaaaa;">EXTREME PERFORMANCE WARNING:</strong> This effect is VERY performance-heavy, especially with a high 'Ray Length' or many 'Points'. Use with caution!
                            </div>
                            <p class="description-text">Adds star-like rays that emanate from the brightest parts of the shine.</p>
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.threshold', 'Threshold', 0, 1, 0.01, 'Only areas brighter than this will generate rays.')}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.intensity', 'Intensity', 0, 4, 0.05)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.points', 'Points', 2, 16, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.angle', 'Angle', 0, 360, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.size', 'Ray Length', 1, 200, 1)}
                            ${DebuggerUIBuilder._createSliderHTML('baseShine.starburst.falloff', 'Ray Falloff', 0.5, 8, 0.1, 'How quickly the rays fade out with distance. Higher values mean a shorter, faster fade.')}
                            ${DebuggerUIBuilder._createSelectHTML('baseShine.starburst.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                        </div>
                    </details>
                `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Metallic Shine', content, iconHTML);
    }

    getPatternTexture() {
        return this.patternTexture;
    }

    async _draw(options) {
        console.log("MetallicShineLayer | Drawing FINAL, self-contained production version.");

        this._onResizeBound = this._onResize.bind(this);
        this._onAnimateBound = this._onAnimate.bind(this);

        this._framesSinceLoad = 0;
        this._destroyed = false;

        const renderer = canvas.app.renderer;
        const baseErrors = [];

        // --- Setup for Pass 1: Internal Pattern Generation ---
        this.patternTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.patternSourceSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.patternSourceSprite.width = renderer.screen.width;
        this.patternSourceSprite.height = renderer.screen.height;
        this.noiseTextureManager = new NoiseTextureManager(renderer, 'baseShine.noise');

        try {
            this.shinePatternFilter = new ShinePatternFilter({});
            this.patternSourceSprite.filters = [this.shinePatternFilter];
        } catch (e) {
            console.error("MapShine | Failed to create ShinePatternFilter.", e);
            baseErrors.push('ShinePatternFilter');
        }

        // --- Setup for Pass 2: Shine Rendering ---
        this.sourceContainer = new PIXI.Container();
        this.shinePassTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        try {
            this.shineFilter = new MetallicShineFilter({
                shinePatternTexture: this.patternTexture
            });
            this.sourceContainer.filters = [this.shineFilter];
        } catch (e) {
            console.error("MapShine | Failed to create MetallicShineFilter.", e);
            baseErrors.push('MetallicShineFilter');
        }

        systemStatus.update('shaders', 'baseShine', {
            state: baseErrors.length === 0 ? 'ok' : 'error',
            message: baseErrors.length === 0 ? `Compiled successfully.` : `Failed to compile: ${baseErrors.join(', ')}`
        });

        // --- Setup for Bloom & Starburst Filters ---
        try {
            const bloomThreshold = new ThresholdFilter();
            const bloomBlur = new PIXI.BlurFilter();
            const bloomBrightness = new PIXI.ColorMatrixFilter();
            const bloomAberration = new ChromaticAberrationFilter();
            this.bloomFilters = [bloomThreshold, bloomBlur, bloomBrightness, bloomAberration];
            this.starburstFilter = new StarburstFilter();
        } catch (e) {
            console.error("MapShine | Failed to create bloom/starburst filters.", e);
        }

        // Final output sprites
        this.shineSprite = new PIXI.Sprite(this.shinePassTexture);
        this.bloomSprite = new PIXI.Sprite(this.shinePassTexture);
        this.starburstSprite = new PIXI.Sprite(this.shinePassTexture);

        this.bloomSprite.filters = this.bloomFilters;
        this.starburstSprite.filters = [this.starburstFilter];

        this.addChild(this.shineSprite, this.bloomSprite, this.starburstSprite);

        // Immediately configure this layer from the scene settings.
        this.updateFromConfig(game.mapShine.profileManager.activeConfig);

        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
    }

    _onAnimate(deltaTime) {
        if (this._destroyed) return;
        this._framesSinceLoad++;

        this.visible = false;

        const config = game.mapShine.profileManager.activeConfig;
        if (!config.enabled || !config.baseShine.enabled || !this.shineFilter || !this.shinePatternFilter) return;

        const hasActiveTargets = this.effectSprites.size > 0 && Array.from(this.effectSprites.values()).some(s => s.texture.valid);
        if (!hasActiveTargets) return;

        if (this._framesSinceLoad < 5) return;

        this.visible = true;

        // --- Pass 1: Generate the Shine Pattern ---
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.noiseTextureManager.update(deltaTime, canvas.app.renderer);
        const uPattern = this.shinePatternFilter.uniforms;
        uPattern.u_time = (uPattern.u_time || 0) + (deltaTime * timeFactor);
        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        uPattern.u_camera_offset = [topLeft.x, topLeft.y];
        uPattern.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        canvas.app.renderer.render(this.patternSourceSprite, {
            renderTexture: this.patternTexture,
            clear: true
        });

        const structuralLayer = canvas.layers.find(l => l instanceof StructuralShadowsLayer);
        const cleanStructuralMask = structuralLayer?.getCleanStructuralLightMask();
        const outdoorsMask = structuralLayer?.outdoorsMaskTexture;

        // Check if all required components are available and active.
        if (this.shineFilter && structuralLayer?.visible && cleanStructuralMask?.valid) {
            this.shineFilter.uniforms.uStructuralMask = cleanStructuralMask;
            this.shineFilter.uniforms.uUseStructuralMask = true;

            // Also pass the outdoors mask if it's available.
            if (outdoorsMask?.valid) {
                this.shineFilter.uniforms.uOutdoorsMask = outdoorsMask;
                this.shineFilter.uniforms.uUseOutdoorsMask = true;
            } else {
                this.shineFilter.uniforms.uUseOutdoorsMask = false;
            }

        } else if (this.shineFilter) {
            this.shineFilter.uniforms.uUseStructuralMask = false;
            this.shineFilter.uniforms.uUseOutdoorsMask = false;
        }

        // --- Pass 2: Render the Final Shine using the generated pattern ---
        canvas.app.renderer.render(this.sourceContainer, {
            renderTexture: this.shinePassTexture,
            clear: true,
            transform: canvas.stage.transform.worldTransform,
        });

        // Position the final output sprites
        [this.shineSprite, this.bloomSprite, this.starburstSprite].forEach(sprite => {
            sprite.position.copyFrom(topLeft);
            sprite.width = screen.width / stage.scale.x;
            sprite.height = screen.height / stage.scale.y;
        });
    }

    async updateEffectTargets(targets) {
        if (!this.sourceContainer) return;

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.specular) continue;
            validTargetIds.add(id);

            let sprite = this.effectSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.effectSprites.set(id, sprite);
                this.sourceContainer.addChild(sprite);
            }
            await this._updateSpriteTexture(sprite, targetData.specular);
            this._updateSpriteTransform(sprite, targetData.rect);
        }

        for (const [id, sprite] of this.effectSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.effectSprites.delete(id);
            }
        }
    }

    async updateFromConfig(config) {
        if (!this.shineFilter || !this.shinePatternFilter || !this.noiseTextureManager) return;

        this.noiseTextureManager.updateFromConfig(config);

        const bs = config.baseShine;
        const anim = bs.animation;
        const p = bs.pattern;
        const s1 = p.stripes1;
        const s2 = p.stripes2;

        const uPattern = this.shinePatternFilter.uniforms;
        uPattern.u_resolution = [canvas.app.screen.width, canvas.app.screen.height];
        uPattern.u_noiseMap = this.noiseTextureManager.getTexture();
        uPattern.u_parallaxAmount = anim.parallaxAmount;
        uPattern.u_parallaxJitter = anim.parallaxJitter;
        // The timeFactor is applied to the time accumulator in the animate loop, so we don't apply it here.
        uPattern.u_parallaxJitterSpeed = anim.parallaxJitterSpeed;
        uPattern.u_globalIntensity = anim.globalIntensity;
        uPattern.u_shared_maxBrightness = p.shared.maxBrightness;
        uPattern.u_shared_patternScale = p.shared.patternScale;
        uPattern.u_noise_enabled = bs.noise.enabled;
        uPattern.u_s1_enabled = s1.enabled;
        uPattern.u_s1_speed = s1.speed;
        uPattern.u_s1_intensity = s1.intensity;
        uPattern.u_s1_angle_rad = s1.angle * (Math.PI / 180);
        uPattern.u_s1_sharpness = s1.sharpness;
        uPattern.u_s1_band_density = s1.bandDensity;
        uPattern.u_s1_band_width = s1.bandWidth;
        uPattern.u_s1_sub_stripe_max_count = s1.subStripeMaxCount;
        uPattern.u_s1_sub_stripe_max_sharp = s1.subStripeMaxSharp;
        uPattern.u_s2_enabled = s2.enabled;
        uPattern.u_s2_speed = s2.speed;
        uPattern.u_s2_intensity = s2.intensity;
        uPattern.u_s2_angle_rad = s2.angle * (Math.PI / 180);
        uPattern.u_s2_sharpness = s2.sharpness;
        uPattern.u_s2_band_density = s2.bandDensity;
        uPattern.u_s2_band_width = s2.bandWidth;
        uPattern.u_s2_sub_stripe_max_count = s2.subStripeMaxCount;
        uPattern.u_s2_sub_stripe_max_sharp = s2.subStripeMaxSharp;

        const uShine = this.shineFilter.uniforms;
        uShine.uBoost = anim.globalIntensity;
        const cc = bs.colorCorrection;
        uShine.uCCEnabled = cc.enabled;
        uShine.uSaturation = cc.saturation;
        uShine.uBrightness = cc.brightness;
        uShine.uContrast = cc.contrast;
        uShine.uExposure = cc.exposure;
        uShine.uGamma = cc.gamma;
        uShine.uInBlack = cc.levels.inBlack;
        uShine.uInWhite = cc.levels.inWhite;
        uShine.uTintColor = hexToRgbArray(cc.tint.color);
        uShine.uTintAmount = cc.tint.amount;
        this.shineSprite.blendMode = PIXI.BLEND_MODES.ADD;

        const bloomConfig = bs.shineBloom;
        const [threshold, blur, brightness, aberration] = this.bloomFilters;
        threshold.enabled = bloomConfig.enabled;
        threshold.threshold = bloomConfig.threshold;
        blur.enabled = bloomConfig.enabled;
        blur.strength = bloomConfig.blur;
        blur.quality = bloomConfig.quality;
        brightness.enabled = bloomConfig.enabled;
        brightness.brightness(bloomConfig.brightness, false);
        const rgbConfig = bs.rgbSplit;
        aberration.enabled = bloomConfig.enabled && rgbConfig.enabled;
        aberration.amount = rgbConfig.amount / 400;
        this.bloomSprite.visible = bloomConfig.enabled;
        this.bloomSprite.blendMode = bs.compositing.layerBlendMode;

        const starburstConfig = bs.starburst;
        this.starburstSprite.visible = starburstConfig.enabled;
        this.starburstSprite.blendMode = starburstConfig.blendMode;
        if (this.starburstFilter) {
            this.starburstFilter.enabled = starburstConfig.enabled;
            const uStarburst = this.starburstFilter.uniforms;
            uStarburst.u_threshold = starburstConfig.threshold;
            uStarburst.u_intensity = starburstConfig.intensity;
            uStarburst.u_angle_rad = starburstConfig.angle * (Math.PI / 180.0);
            uStarburst.u_points = Math.round(starburstConfig.points);
            uStarburst.u_size = starburstConfig.size;
            uStarburst.u_falloff = starburstConfig.falloff;
        }
    }

    async _updateSpriteTexture(sprite, texturePath) {
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }
    }

    _updateSpriteTransform(sprite, rect) {
        if (!sprite || sprite.destroyed || !sprite.anchor || !sprite.texture.valid || !rect) return;
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _onResize() {
        const renderer = canvas.app.renderer;
        this.patternTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.shinePassTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.noiseTextureManager?.resize(renderer);

        if (this.patternSourceSprite) {
            this.patternSourceSprite.width = renderer.screen.width;
            this.patternSourceSprite.height = renderer.screen.height;
        }

        if (this.starburstFilter) {
            this.starburstFilter.uniforms.u_texel_size = [1.0 / renderer.screen.width, 1.0 / renderer.screen.height];
        }

        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }

    async _tearDown(options) {
        console.log(`MetallicShineLayer | Tearing down FINAL production version.`);
        if (this._destroyed) return;
        this._destroyed = true;

        if (this._onAnimateBound) canvas.app.ticker.remove(this._onAnimateBound);
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);

        this.patternTexture?.destroy(true);
        this.patternSourceSprite?.destroy();
        this.shinePatternFilter?.destroy();
        this.noiseTextureManager?.destroy();
        this.sourceContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.effectSprites.clear();
        this.shinePassTexture?.destroy(true);
        this.shineFilter?.destroy();
        this.starburstFilter?.destroy();
        this.bloomFilters.forEach(f => f.destroy());
        this.bloomFilters = [];

        this.patternTexture = null;
        this.patternSourceSprite = null;
        this.shinePatternFilter = null;
        this.noiseTextureManager = null;
        this.sourceContainer = null;
        this.shinePassTexture = null;
        this.shineFilter = null;
        this.shineSprite = null;
        this.bloomSprite = null;
        this.starburstSprite = null;

        return super._tearDown(options);
    }
}

// --- 5.4. Cloud Shadows ---
class CloudShadowsFilter extends PIXI.Filter {
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

                        uniform sampler2D uOutdoorsMask;
                        uniform sampler2D uIlluminationBuffer;

                        uniform float u_time;
                        uniform vec2 u_camera_offset;
                        uniform vec2 u_view_size;
                        uniform vec2 u_windDirection;

                        uniform float u_noise_scale;
                        uniform int u_noise_octaves;
                        uniform float u_noise_persistence;
                        uniform float u_noise_lacunarity;

                        uniform float u_shading_threshold;
                        uniform float u_shading_softness;
                        uniform float u_shading_brightness;
                        uniform float u_shading_contrast;
                        uniform float u_shading_gamma;
                        uniform float u_shadowIntensity;

                        uniform bool u_outputHighlightMask;

                        // Illumination Masking Uniforms
                        uniform bool u_illum_enabled;
                        uniform float u_illum_intensity;
                        uniform float u_illum_luminanceThreshold;
                        uniform float u_illum_softness;
                        
                        const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                        float random(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                        }

                        float noise(vec2 st) {
                            vec2 i = floor(st);
                            vec2 f = fract(st);
                            float a = random(i);
                            float b = random(i + vec2(1.0, 0.0));
                            float c = random(i + vec2(0.0, 1.0));
                            float d = random(i + vec2(1.0, 1.0));
                            vec2 u = f * f * (3.0 - 2.0 * f);
                            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
                        }

                        float fbm(vec2 st) {
                            float value = 0.0;
                            float amplitude = 0.5;
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
                            if (u_shading_gamma > 0.0) {
                                value = pow(value, u_shading_gamma);
                            }
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
                                float reduction = lightMask * u_illum_intensity;
                                shadowAmount *= (1.0 - reduction);
                            }
                            
                            shadowAmount = clamp(shadowAmount, 0.0, 1.0);
                            
                            gl_FragColor = vec4(vec3(1.0 - shadowAmount), 1.0);
                        }
                    `;

        super(vertexSrc, fragmentSrc, {
            uOutdoorsMask: PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_camera_offset: [0, 0],
            u_view_size: [0, 0],
            u_windDirection: [0.01, 0.01],
            u_noise_scale: 0.1,
            u_noise_octaves: 5,
            u_noise_persistence: 0.5,
            u_noise_lacunarity: 2.5,
            u_shading_threshold: 1.0,
            u_shading_softness: 0.2,
            u_shading_brightness: 0.51,
            u_shading_contrast: 1.0,
            u_shading_gamma: 1.0,
            u_shadowIntensity: 0.5,
            u_outputHighlightMask: false,
            uIlluminationBuffer: PIXI.Texture.EMPTY,
            u_illum_enabled: false,
            u_illum_intensity: 0.8,
            u_illum_luminanceThreshold: 0.1,
            u_illum_softness: 0.2,
        });
    }
}

class CloudShadowsLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'outdoors'
        });

        this.cloudFilter = null;
        this.blurredMaskTexture = null;
        this.maskBlurFilter = null;
        this.blurSourceSprite = null;

        this._patternGeneratorSprite = null;
        this.cloudShadowTexture = null;
        this.cloudHighlightMaskTexture = null;
        this.effectSprite = null;
    }

    static getSettingsHTML() {
        const effectKey = 'cloudShadows';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
                        ${checkboxHTML}
                        <hr style="border-color: #555; margin: 6px 0;">
                        ${DebuggerUIBuilder._createTextureInputHTML('outdoors', 'Outdoor Mask (_Outdoors)')}
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

    getHighlightMaskTexture() {
        return this.cloudHighlightMaskTexture;
    }

    async _draw(options) {
        await super._draw(options); // Sets up the outdoors mask

        const renderer = canvas.app.renderer;

        try {
            this.cloudFilter = new CloudShadowsFilter();
            systemStatus.update('shaders', 'cloudShadows', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to create final CloudShadowsFilter.", e);
            systemStatus.update('shaders', 'cloudShadows', {
                state: 'error',
                message: `Compilation Failed: ${e.message}`
            });
            return;
        }

        this.maskBlurFilter = new PIXI.BlurFilter();
        this.blurredMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.blurSourceSprite = new PIXI.Sprite(this.combinedMaskTexture);
        this.blurSourceSprite.filters = [this.maskBlurFilter];

        this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._patternGeneratorSprite.width = renderer.screen.width;
        this._patternGeneratorSprite.height = renderer.screen.height;
        this._patternGeneratorSprite.filters = [this.cloudFilter];

        this.cloudShadowTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.cloudHighlightMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.effectSprite = new PIXI.Sprite(this.cloudShadowTexture);
        this.addChild(this.effectSprite);

        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    _onPan() {
        super._onPan();
        this._updateSpriteAndUniformPositions();
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime);
        if (this._destroyed || !this.visible || !this.cloudFilter) return;

        const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);
        if (!hasActiveMasks) {
            this.effectSprite.visible = false;
            return;
        }

        this.effectSprite.visible = true;
        if (!this.effectSprite.filterArea) {
            this.effectSprite.filterArea = canvas.app.screen;
        }

        if (this._needsMaskUpdate && this.maskBlurFilter?.enabled) {
            this.blurSourceSprite.texture = this.combinedMaskTexture;
            canvas.app.renderer.render(this.blurSourceSprite, {
                renderTexture: this.blurredMaskTexture,
                clear: true
            });
        }

        const finalMask = this.maskBlurFilter?.enabled ? this.blurredMaskTexture : this.getMaskTexture();
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        const u = this.cloudFilter.uniforms;
        u.uOutdoorsMask = finalMask;
        u.u_time += deltaTime * timeFactor;
        this._updateSpriteAndUniformPositions();

        const illumConfig = game.mapShine.profileManager.activeConfig.cloudShadows.illumination;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illumTexture = illuminationAPI?.getLightingTexture();

        u.u_illum_enabled = illumConfig.enabled && !!illumTexture?.valid;
        if (u.u_illum_enabled) {
            u.uIlluminationBuffer = illumTexture;
            u.u_illum_intensity = illumConfig.intensity;
            u.u_illum_luminanceThreshold = illumConfig.luminanceThreshold;
            u.u_illum_softness = illumConfig.softness;
        }

        this.cloudFilter.uniforms.u_outputHighlightMask = true;
        canvas.app.renderer.render(this._patternGeneratorSprite, {
            renderTexture: this.cloudHighlightMaskTexture,
            clear: true
        });

        this.cloudFilter.uniforms.u_outputHighlightMask = false;
        canvas.app.renderer.render(this._patternGeneratorSprite, {
            renderTexture: this.cloudShadowTexture,
            clear: true
        });
    }

    _updateSpriteAndUniformPositions() {
        if (!this.cloudFilter || !this.effectSprite) return;
        const stage = canvas.stage,
            screen = canvas.app.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });

        this.cloudFilter.uniforms.u_camera_offset = [topLeft.x, topLeft.y];
        this.cloudFilter.uniforms.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;

        this._patternGeneratorSprite.position.set(0, 0);
        this._patternGeneratorSprite.width = screen.width;
        this._patternGeneratorSprite.height = screen.height;
    }

    async updateFromConfig(config) {
        const csConfig = config.cloudShadows;
        this.visible = config.enabled && csConfig.enabled;
        if (!this.cloudFilter) return;

        if (this.maskBlurFilter) {
            this.maskBlurFilter.blur = csConfig.maskBlur ?? 0.0;
            this.maskBlurFilter.enabled = this.maskBlurFilter.blur > 0;
            if (this.maskBlurFilter.enabled) this._needsMaskUpdate = true;
        }

        const u = this.cloudFilter.uniforms;
        u.u_shadowIntensity = csConfig.shadowIntensity;

        // The timeFactor is applied to the time accumulator in the animate loop, so we use the raw speed here.
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

        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        if (this.effectSprite) {
            this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        }
    }

    _onResize() {
        super._onResize(); // Handles the main outdoors mask texture
        const renderer = canvas.app.renderer;

        this.blurredMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.cloudShadowTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.cloudHighlightMaskTexture?.resize(renderer.screen.width, renderer.screen.height);

        if (this.effectSprite) this._updateSpriteAndUniformPositions();
    }

    async _tearDown(options) {
        this.cloudFilter?.destroy();
        this._patternGeneratorSprite?.destroy();
        this.cloudShadowTexture?.destroy(true);
        this.cloudHighlightMaskTexture?.destroy(true);
        this.effectSprite?.destroy();
        this.maskBlurFilter?.destroy();
        this.blurSourceSprite?.destroy();
        this.blurredMaskTexture?.destroy(true);

        this.cloudFilter = null;
        this.effectSprite = null;
        this.maskBlurFilter = null;
        this.blurSourceSprite = null;
        this.blurredMaskTexture = null;
        this._patternGeneratorSprite = null;
        this.cloudShadowTexture = null;
        this.cloudHighlightMaskTexture = null;

        await super._tearDown(options);
    }
}

// --- 5.5. Canopy Shadows ---
class CanopyFilter extends PIXI.Filter {
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

                        // Samplers
                        uniform sampler2D uSampler;
                        uniform sampler2D u_distortionNoise;
                        uniform sampler2D uOutdoorsMask;
                        uniform sampler2D uIlluminationBuffer;

                        // Uniforms
                        uniform float u_shadowIntensity;
                        uniform vec3 u_tint;
                        uniform bool u_distortion_enabled;
                        uniform float u_distortion_intensity;

                        // Illumination Masking Uniforms
                        uniform bool u_illum_enabled;
                        uniform float u_illum_intensity;
                        uniform float u_illum_luminanceThreshold;
                        uniform float u_illum_softness;

                        // New uniforms for world-space calculations
                        uniform vec4 u_scene_rect; // (x, y, width, height) of the entire scene
                        uniform vec2 u_camera_offset; // World coordinate of the screen's top-left
                        uniform vec2 u_view_size; // World dimensions of the screen
                        
                        const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                        void main() {
                            float outdoorMaskVal = texture2D(uOutdoorsMask, vScreenCoord).r;
                            if (outdoorMaskVal < 0.01) {
                                discard;
                            }

                            vec2 distortedCoord = vTextureCoord;
                            if (u_distortion_enabled && u_distortion_intensity > 0.0) {
                                
                                // --- World-Space Gradient Falloff ---
                                // 1. Calculate the true world coordinate of this pixel.
                                vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);

                                // 2. Normalize the world coordinate to a 0-1 range based on the scene dimensions.
                                vec2 world_uv = (world_coord - u_scene_rect.xy) / u_scene_rect.zw;

                                // 3. Calculate falloff based on distance from the center of the WORLD.
                                vec2 distFromCenter = abs(world_uv - 0.5) * 2.0;
                                float maxDist = max(distFromCenter.x, distFromCenter.y);
                                float falloff = 1.0 - smoothstep(0.8, 1.0, maxDist); // Fade out over the last 20% of the map edge

                                // --- Distortion Calculation ---
                                vec2 displacement = (texture2D(u_distortionNoise, vScreenCoord).rg - 0.5) * 2.0;
                                vec2 offset = displacement * u_distortion_intensity * 0.01 * falloff;
                                distortedCoord += offset;
                            }

                            float maskValue = texture2D(uSampler, distortedCoord).r;
                            float maskAlpha = texture2D(uSampler, distortedCoord).a;
                            float shadowAmount = 1.0 - maskValue;
                            
                            if (shadowAmount < 0.01 || maskAlpha < 0.01) {
                                discard;
                            }
                            
                            float finalAlpha = shadowAmount * u_shadowIntensity * outdoorMaskVal;

                            if (u_illum_enabled) {
                                float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                                float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                                float reduction = lightMask * u_illum_intensity;
                                finalAlpha *= (1.0 - reduction);
                            }

                            gl_FragColor = vec4(u_tint * finalAlpha, finalAlpha);
                        }
                    `;

        super(vertexSrc, fragmentSrc, {
            u_distortionNoise: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            u_shadowIntensity: 0.7,
            u_tint: [0.0, 0.0, 0.0],
            u_distortion_enabled: true,
            u_distortion_intensity: 5.0,
            u_scene_rect: [0, 0, 1, 1],
            u_camera_offset: [0, 0],
            u_view_size: [1, 1],
            uIlluminationBuffer: PIXI.Texture.EMPTY,
            u_illum_enabled: false,
            u_illum_intensity: 0.8,
            u_illum_luminanceThreshold: 0.1,
            u_illum_softness: 0.2,
            ...options
        });
    }
}

class CanopyLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'canopy'
        });

        this.canopyFilter = null;
        this.effectSprite = null;
        this.distortionNoiseManager = null;

        // Properties for the second (outdoors) mask
        this.outdoorsMaskContainer = null;
        this.outdoorsMaskTexture = null;
        this.outdoorsMaskSprites = new Map();
        this._needsOutdoorsMaskUpdate = true;
    }

    static getSettingsHTML() {
        const effectKey = 'canopy';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
                        ${checkboxHTML}
                        <hr style="border-color: #555; margin: 6px 0;">
                        ${DebuggerUIBuilder._createTextureInputHTML('canopy', 'Canopy Mask (_Canopy)')}
                        <p class="description-text">A black and white texture where black areas are shadows and white areas are light. This effect simulates a leafy canopy overhead.</p>
                        ${DebuggerUIBuilder._createSliderHTML('canopy.shadowIntensity', 'Shadow Intensity', 0, 2, 0.01)}
                        ${DebuggerUIBuilder._createColorPickerHTML('canopy.tint', 'Shadow Tint')}
                        <details id="details-canopy-distortion"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('canopy.distortion.enabled', 'Shadow Animation', true)}</div></summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Animates the shadows using a procedural noise pattern to create a distortion effect.</p>
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.intensity', 'Intensity', 0, 20, 0.1, 'The overall strength of the distortion effect.')}
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.speed', 'Speed', -0.5, 0.5, 0.005, 'Horizontal/Vertical scrolling speed of the distortion.')}
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.scale', 'Scale', 0.01, 2, 0.01, 'Zoom level of the distortion pattern.')}
                                ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.evolution', 'Evolution', 0, 1, 0.01, 'Internal "morphing" speed of the distortion.')}
                                <details id="details-canopy-distortion-noise-adv"><summary><span class="accordion-toggle"></span><strong>Advanced Noise Controls</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.threshold', 'Threshold', 0, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.brightness', 'Brightness', -1, 1, 0.01)}
                                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.contrast', 'Contrast', 0, 5, 0.05)}
                                        ${DebuggerUIBuilder._createSliderHTML('canopy.distortion.softness', 'Softness', 0.01, 1, 0.01)}
                                    </div>
                                </details>
                            </div>
                        </details>
                    `;
        return DebuggerUIBuilder._createAccordionHTML(effectKey, 'Canopy Shadows', content, iconHTML);
    }

    async _draw(options) {
        await super._draw(options); // Sets up the PRIMARY (_Canopy) mask

        this._needsOutdoorsMaskUpdate = true;
        this.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        const renderer = canvas.app.renderer;

        // Setup for the SECONDARY (_Outdoors) mask
        this.outdoorsMaskContainer = new PIXI.Container();
        this.outdoorsMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'canopy.distortion', true);

        try {
            this.canopyFilter = new CanopyFilter();
        } catch (e) {
            console.error("MapShine | Failed to create CanopyFilter", e);
        }

        // The effect sprite now uses the primary mask texture from the base class
        this.effectSprite = new PIXI.Sprite(this.getMaskTexture());
        this.effectSprite.filters = this.canopyFilter ? [this.canopyFilter] : [];
        this.addChild(this.effectSprite);

        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    _onPan() {
        super._onPan(); // Flags primary mask for update
        this._needsOutdoorsMaskUpdate = true;
    }

    _onResize() {
        super._onResize(); // Resizes primary mask texture
        const renderer = canvas.app.renderer;
        this.distortionNoiseManager?.resize(renderer);
        this.outdoorsMaskTexture?.resize(renderer.screen.width, renderer.screen.height);

        if (this.effectSprite) {
            const stage = canvas.stage;
            const screen = canvas.app.screen;
            const topLeft = stage.toLocal({
                x: 0,
                y: 0
            });
            this.effectSprite.position.copyFrom(topLeft);
            this.effectSprite.width = screen.width / stage.scale.x;
            this.effectSprite.height = screen.height / stage.scale.y;
        }
        this._needsOutdoorsMaskUpdate = true;
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime); // Renders primary mask if needed
        if (this._destroyed || !this.visible || !this.canopyFilter) return;

        if (this.effectSprite && !this.effectSprite.filterArea) {
            this.effectSprite.filterArea = canvas.app.screen;
        }

        this.distortionNoiseManager.update(deltaTime, canvas.app.renderer);

        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        const u = this.canopyFilter.uniforms;

        u.u_distortionNoise = this.distortionNoiseManager.getTexture();
        u.uOutdoorsMask = this.outdoorsMaskTexture;

        const dims = canvas.scene.dimensions;
        u.u_scene_rect = [dims.sceneX, dims.sceneY, dims.sceneWidth, dims.sceneHeight];
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        // Read from the new centralized location for shadow interaction settings
        const siConfig = foundry.utils.getProperty(game.mapShine.profileManager.activeConfig, "postProcessing.colorCorrection.sceneIlluminationMixIn");
        const shadowInteractionConfig = siConfig?.shadowInteraction;

        const wantsIllumination = siConfig?.enabled && shadowInteractionConfig?.enabled;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illumTexture = illuminationAPI?.getLightingTexture();
        const isIlluminationReady = wantsIllumination && illuminationAPI && illumTexture?.valid;

        u.u_illum_enabled = isIlluminationReady;
        if (isIlluminationReady) {
            u.uIlluminationBuffer = illumTexture;
            u.u_illum_intensity = shadowInteractionConfig.intensity;
            u.u_illum_luminanceThreshold = shadowInteractionConfig.luminanceThreshold;
            u.u_illum_softness = shadowInteractionConfig.softness;
        }

        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
    }

    async updateEffectTargets(targets) {
        await super.updateEffectTargets(targets); // Handles the primary (_Canopy) mask

        if (!this.outdoorsMaskContainer) return;

        this.outdoorsMaskContainer.removeChildren().forEach(c => c.destroy({
            texture: true,
            baseTexture: true
        }));
        this.outdoorsMaskSprites.clear();

        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);
        for (const [id, targetData] of allTargets.entries()) {
            if (targetData?.outdoors) {
                const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.outdoorsMaskSprites.set(id, sprite);
                this.outdoorsMaskContainer.addChild(sprite);
                await this._updateSpriteTransform(sprite, targetData.outdoors, targetData.rect);
            }
        }
        this._needsOutdoorsMaskUpdate = true;
    }

    async updateFromConfig(config) {
        const cConfig = config.canopy;
        this.visible = config.enabled && cConfig.enabled;

        this.distortionNoiseManager?.updateFromConfig(config);

        if (this.canopyFilter) {
            const u = this.canopyFilter.uniforms;
            u.u_shadowIntensity = cConfig.shadowIntensity;
            u.u_tint = hexToRgbArray(cConfig.tint);

            const distConfig = cConfig.distortion;
            u.u_distortion_enabled = distConfig.enabled;
            u.u_distortion_intensity = distConfig.intensity;
        }
    }

    async _tearDown(options) {
        this.distortionNoiseManager?.destroy();
        this.canopyFilter?.destroy();
        this.effectSprite?.destroy();

        this.outdoorsMaskContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.outdoorsMaskTexture?.destroy(true);
        this.outdoorsMaskSprites.clear();

        this.distortionNoiseManager = null;
        this.canopyFilter = null;
        this.effectSprite = null;
        this.outdoorsMaskContainer = null;
        this.outdoorsMaskTexture = null;

        await super._tearDown(options);
    }
}

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
                        }
                    `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            uIntensity: options.intensity ?? 2.0,
            uThreshold: options.threshold ?? 0.5,
            uTexelSize: options.texelSize ?? [1.0 / (window.innerWidth || 1), 1.0 / (window.innerHeight || 1)]
        });
    }
}

class StructuralShadowsFilter extends PIXI.Filter {
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
            
                        // Samplers
                        uniform sampler2D uStructuralMask;
                        uniform sampler2D uOutdoorsMask;
                        uniform sampler2D u_intensityNoise;
                        uniform sampler2D uIlluminationBuffer;
            
                        // Main Uniforms
                        uniform vec3 u_tint;
                        uniform float u_shadowIntensity;
                        uniform float u_parallax;
                        uniform float u_time;
            
                        // World & Camera Uniforms
                        uniform vec2 u_camera_offset;
                        uniform vec2 u_view_size;
            
                        // Feature Toggles & Parameters
                        uniform bool u_intensityNoise_enabled;
                        uniform float u_intensityNoise_amount;
                        uniform bool u_illum_enabled;
                        uniform float u_illum_intensity;
                        uniform float u_illum_luminanceThreshold;
                        uniform float u_illum_softness;
                        uniform bool u_outputHighlightMask;

                        // Cloud Occlusion Toggles & Parameters
                        uniform bool u_cloud_enabled;
                        uniform float u_cloud_intensity;
                        uniform vec2 u_windDirection;
                        // Cloud Noise
                        uniform float u_noise_scale;
                        uniform int u_noise_octaves;
                        uniform float u_noise_persistence;
                        uniform float u_noise_lacunarity;
                        // Cloud Shading
                        uniform float u_cloud_shading_threshold;
                        uniform float u_cloud_shading_softness;
                        uniform float u_cloud_shading_brightness;
                        uniform float u_cloud_shading_contrast;
                        uniform float u_cloud_shading_gamma;
                        uniform float u_cloud_shading_exposure;
                        uniform float u_cloud_shading_inBlack;
                        uniform float u_cloud_shading_inWhite;
            
                        const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                        // --- CLOUD NOISE GENERATION FUNCTIONS ---
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
                        float applyCloudShading(float value) {
                            if (u_cloud_shading_inWhite > u_cloud_shading_inBlack) {
                                value = (value - u_cloud_shading_inBlack) / (u_cloud_shading_inWhite - u_cloud_shading_inBlack);
                            }
                            value *= pow(2.0, u_cloud_shading_exposure);
                            value += u_cloud_shading_brightness;
                            value = (value - 0.5) * u_cloud_shading_contrast + 0.5;
                            value = smoothstep(u_cloud_shading_threshold, u_cloud_shading_threshold + u_cloud_shading_softness, value);
                            if (u_cloud_shading_gamma > 0.0) {
                                value = pow(value, u_cloud_shading_gamma);
                            }
                            return clamp(value, 0.0, 1.0);
                        }
            
                        void main() {
                            float indoorMask = 1.0 - texture2D(uOutdoorsMask, vScreenCoord).r;
                            if (indoorMask < 0.01 && !u_outputHighlightMask) {
                                gl_FragColor = vec4(1.0); 
                                return;
                            }
            
                            vec2 parallaxTexCoord = vScreenCoord;
                            if (u_parallax > 0.0 && u_view_size.y > 0.0) {
                                vec2 normalized_camera_offset = u_camera_offset / u_view_size;
                                parallaxTexCoord = vScreenCoord - (normalized_camera_offset * u_parallax);
                            }
                            
                            vec4 structuralTexel = texture2D(uStructuralMask, parallaxTexCoord);
                            
                            if (structuralTexel.a < 0.01) {
                                gl_FragColor = vec4(1.0);
                                return;
                            }

                            float lightAmount = structuralTexel.r;
            
                            if (u_intensityNoise_enabled) {
                                float flicker = texture2D(u_intensityNoise, vScreenCoord).r;
                                lightAmount = min(1.0, lightAmount + flicker * u_intensityNoise_amount);
                            }
                            
                            if (u_cloud_enabled) {
                                vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                                vec2 noise_uv = world_coord / 100.0 * u_noise_scale;
                                noise_uv += u_time * u_windDirection;
                                float rawCloudValue = fbm(noise_uv);
                                float shadedCloudValue = applyCloudShading(rawCloudValue);
                                
                                lightAmount *= (1.0 - shadedCloudValue * u_cloud_intensity);
                            }
                            
                            lightAmount = clamp(lightAmount, 0.0, 1.0);
            
                            if (u_outputHighlightMask) {
                                gl_FragColor = vec4(vec3(lightAmount * indoorMask), 1.0);
                                return;
                            }
            
                            float shadowAmount = 1.0 - lightAmount;
                            shadowAmount *= u_shadowIntensity;
                            
                            if (u_illum_enabled) {
                                float lightLevel = dot(texture2D(uIlluminationBuffer, vScreenCoord).rgb, lum_weights);
                                float lightMask = smoothstep(u_illum_luminanceThreshold, u_illum_luminanceThreshold + u_illum_softness, lightLevel);
                                float reduction = lightMask * u_illum_intensity;
                                shadowAmount *= (1.0 - reduction);
                            }
                            
                            shadowAmount *= indoorMask;
                            shadowAmount = clamp(shadowAmount, 0.0, 1.0);
            
                            vec3 shadowColor = mix(vec3(1.0), u_tint, shadowAmount);
                            gl_FragColor = vec4(shadowColor, 1.0);
                        }
                    `;

        super(vertexSrc, fragmentSrc, {
            uStructuralMask: PIXI.Texture.EMPTY,
            uOutdoorsMask: PIXI.Texture.EMPTY,
            u_intensityNoise: PIXI.Texture.EMPTY,
            uIlluminationBuffer: PIXI.Texture.EMPTY,
            u_time: 0.0,
            u_tint: [0.0, 0.0, 0.0],
            u_shadowIntensity: 0.6,
            u_parallax: 0.15,
            u_camera_offset: [0, 0],
            u_view_size: [1, 1],
            u_intensityNoise_enabled: true,
            u_cloud_enabled: false,
            u_illum_enabled: false,
            u_outputHighlightMask: false,
            u_intensityNoise_amount: 0.4,
            u_illum_intensity: 0.8,
            u_illum_luminanceThreshold: 0.1,
            u_illum_softness: 0.2,

            // Cloud Uniforms
            u_cloud_intensity: 1.0,
            u_windDirection: [0.01, 0.01],
            u_noise_scale: 0.1,
            u_noise_octaves: 5,
            u_noise_persistence: 0.5,
            u_noise_lacunarity: 2.5,
            u_cloud_shading_threshold: 1.0,
            u_cloud_shading_softness: 0.2,
            u_cloud_shading_brightness: 0.51,
            u_cloud_shading_contrast: 1.0,
            u_cloud_shading_gamma: 1.0,
            u_cloud_shading_exposure: 0.0,
            u_cloud_shading_inBlack: 0.0,
            u_cloud_shading_inWhite: 1.0,
            ...options
        });
    }
}

class StructuralShadowsLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'structural'
        });

        this.LOG_PREFIX = "MapShine | StructuralShadows | Illumination |";
        console.log(this.LOG_PREFIX, "Constructor called. Initializing for new scene.");

        this.structuralFilter = null;
        this.effectSprite = null;
        this._patternGeneratorSprite = null;
        this.finalShadowTexture = null;
        this.finalHighlightMaskTexture = null;
        this.intensityNoiseManager = null;
        this.rgbSplitFilter = null;
        this.splitHighlightMaskTexture = null;
        this._splitHighlightSprite = null;
        this.outdoorsMaskContainer = null;
        this.outdoorsMaskTexture = null;
        this.outdoorsMaskSprites = new Map();
        this._needsOutdoorsMaskUpdate = true;

        this.cleanStructuralLightMask = null;
        this.parallaxMaskFilter = null;
        this._parallaxMaskSprite = null;

        this._framesSinceLoad = 0;
        // The _illuminationBufferReady flag and its associated hook are removed.
    }

    static getSettingsHTML() {
        const effectKey = 'structuralShadows';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
                        ${checkboxHTML}
                        <hr style="border-color: #555; margin: 6px 0;">
                        ${DebuggerUIBuilder._createTextureInputHTML('structural', 'Structural Mask (_Structural)')}
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

    getHighlightMaskTexture() {
        return this.finalHighlightMaskTexture;
    }

    getCleanStructuralLightMask() {
        return this.cleanStructuralLightMask;
    }

    getSplitHighlightMaskTexture() {
        return this.splitHighlightMaskTexture;
    }

    isRgbSplitEnabled() {
        const config = game.mapShine.profileManager.activeConfig;
        if (!config) return false;
        return config.enabled && config.structuralShadows.enabled && config.structuralShadows.rgbSplit.enabled;
    }

    async _draw(options) {
        console.log(this.LOG_PREFIX, "_draw called. Creating PIXI objects and setting up for rendering.");
        await super._draw(options);

        this._framesSinceLoad = 0;
        this._illuminationBufferReady = false; // Reset the readiness flag for the new scene

        this._needsOutdoorsMaskUpdate = true;
        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;

        this.outdoorsMaskContainer = new PIXI.Container();
        this.outdoorsMaskTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.intensityNoiseManager = new NoiseTextureManager(renderer, 'structuralShadows.intensityNoise', true);
        this.finalShadowTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.finalHighlightMaskTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.splitHighlightMaskTexture = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.rgbSplitFilter = new StructuralHighlightRgbSplitFilter();
        this._splitHighlightSprite = new PIXI.Sprite(this.finalHighlightMaskTexture);
        this._splitHighlightSprite.filters = [this.rgbSplitFilter];

        this.cleanStructuralLightMask = PIXI.RenderTexture.create({
            width: screen.width,
            height: screen.height
        });
        this.parallaxMaskFilter = new ParallaxMaskFilter();
        this._parallaxMaskSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._parallaxMaskSprite.width = screen.width;
        this._parallaxMaskSprite.height = screen.height;
        this._parallaxMaskSprite.filters = [this.parallaxMaskFilter];

        try {
            this.structuralFilter = new StructuralShadowsFilter();
        } catch (e) {
            console.error("MapShine | Failed to create StructuralShadowsFilter", e);
        }

        this._patternGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this._patternGeneratorSprite.width = screen.width;
        this._patternGeneratorSprite.height = screen.height;
        this._patternGeneratorSprite.filters = this.structuralFilter ? [this.structuralFilter] : [];

        this.effectSprite = new PIXI.Sprite(this.finalShadowTexture);
        this.effectSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this.effectSprite.visible = false; // Start invisible
        this.addChild(this.effectSprite);
    }

    _onPan() {
        super._onPan();
        this._needsOutdoorsMaskUpdate = true;
    }

    _onResize() {
        super._onResize();
        const renderer = canvas.app.renderer;
        const screen = renderer.screen;
        this.intensityNoiseManager?.resize(renderer);
        this.outdoorsMaskTexture?.resize(screen.width, screen.height);
        this.finalShadowTexture?.resize(screen.width, screen.height);
        this.finalHighlightMaskTexture?.resize(screen.width, screen.height);
        this.splitHighlightMaskTexture?.resize(screen.width, screen.height);
        this.cleanStructuralLightMask?.resize(screen.width, screen.height);
        if (this._patternGeneratorSprite) {
            this._patternGeneratorSprite.width = screen.width;
            this._patternGeneratorSprite.height = screen.height;
        }
        if (this._splitHighlightSprite) {
            this._splitHighlightSprite.width = screen.width;
            this._splitHighlightSprite.height = screen.height;
        }
        if (this._parallaxMaskSprite) {
            this._parallaxMaskSprite.width = screen.width;
            this._parallaxMaskSprite.height = screen.height;
        }
        if (this.rgbSplitFilter) {
            this.rgbSplitFilter.uniforms.uTexelSize = [1 / screen.width, 1 / screen.height];
        }
        if (this.effectSprite) {
            const stage = canvas.stage;
            const topLeft = stage.toLocal({
                x: 0,
                y: 0
            });
            this.effectSprite.position.copyFrom(topLeft);
            this.effectSprite.width = screen.width / stage.scale.x;
            this.effectSprite.height = screen.height / stage.scale.y;
        }
        this._needsOutdoorsMaskUpdate = true;
    }

    _onAnimate(deltaTime) {
        if (this._destroyed) return;
        this._framesSinceLoad++;

        const transform = canvas.stage.transform.localTransform;
        const isDefaultTransform = (transform.a === 1 && transform.d === 1 && transform.tx === 0 && transform.ty === 0);

        if (isDefaultTransform) {
            if (this.effectSprite) this.effectSprite.visible = false;
            return;
        }

        super._onAnimate(deltaTime);

        const hasActiveTargets = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);
        if (!this.visible || !this.structuralFilter || !hasActiveTargets) {
            this.effectSprite.visible = false;
            return;
        }

        this.effectSprite.visible = true;
        if (!this.effectSprite.filterArea) {
            this.effectSprite.filterArea = canvas.app.screen;
        }

        const renderer = canvas.app.renderer;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        const viewSize = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;

        this.intensityNoiseManager.update(deltaTime, renderer);

        if (this._needsOutdoorsMaskUpdate) {
            renderer.render(this.outdoorsMaskContainer, {
                renderTexture: this.outdoorsMaskTexture,
                transform: stage.transform.worldTransform,
                clear: true
            });
            this._needsOutdoorsMaskUpdate = false;
        }

        if (this.parallaxMaskFilter) {
            const p_u = this.parallaxMaskFilter.uniforms;
            p_u.uMask = this.getMaskTexture();
            p_u.uCameraOffset = [topLeft.x, topLeft.y];
            p_u.uViewSize = viewSize;
            renderer.render(this._parallaxMaskSprite, {
                renderTexture: this.cleanStructuralLightMask,
                clear: true
            });
        }

        const u = this.structuralFilter.uniforms;
        u.uStructuralMask = this.getMaskTexture();
        u.u_intensityNoise = this.intensityNoiseManager.getTexture();
        u.uOutdoorsMask = this.outdoorsMaskTexture;
        u.u_time += deltaTime * timeFactor;

        // Read from the new centralized location for shadow interaction settings
        const siConfig = foundry.utils.getProperty(game.mapShine.profileManager.activeConfig, "postProcessing.colorCorrection.sceneIlluminationMixIn");
        const shadowInteractionConfig = siConfig?.shadowInteraction;

        const wantsIllumination = siConfig?.enabled && shadowInteractionConfig?.enabled;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illuminationTexture = illuminationAPI?.getLightingTexture();
        const isIlluminationReady = wantsIllumination && illuminationAPI && illuminationTexture?.valid &&
            illuminationTexture.width === Math.round(screen.width) &&
            illuminationTexture.height === Math.round(screen.height);

        u.u_illum_enabled = isIlluminationReady;
        if (isIlluminationReady) {
            u.uIlluminationBuffer = illuminationTexture;
            // The intensity, threshold, and softness are already set by updateFromConfig,
            // so we don't need to set them again here. This just toggles the feature.
        }

        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = viewSize;

        u.u_outputHighlightMask = true;
        renderer.render(this._patternGeneratorSprite, {
            renderTexture: this.finalHighlightMaskTexture,
            clear: true
        });

        u.u_outputHighlightMask = false;
        renderer.render(this._patternGeneratorSprite, {
            renderTexture: this.finalShadowTexture,
            clear: true
        });

        if (this.isRgbSplitEnabled()) {
            renderer.render(this._splitHighlightSprite, {
                renderTexture: this.splitHighlightMaskTexture,
                clear: true
            });
        }

        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
    }

    async updateEffectTargets(targets) {
        await super.updateEffectTargets(targets);
        if (!this.outdoorsMaskContainer) {
            return;
        }

        this.outdoorsMaskContainer.removeChildren().forEach(c => c.destroy({
            texture: true,
            baseTexture: true
        }));
        this.outdoorsMaskSprites.clear();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);
        for (const [id, targetData] of allTargets.entries()) {
            if (targetData?.outdoors) {
                const sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.outdoorsMaskSprites.set(id, sprite);
                this.outdoorsMaskContainer.addChild(sprite);
                await this._updateSpriteTransform(sprite, targetData.outdoors, targetData.rect);
            }
        }
        this._needsOutdoorsMaskUpdate = true;
    }

    async updateFromConfig(config) {
        const ssConfig = config.structuralShadows;
        this.visible = config.enabled && ssConfig.enabled;
        this.intensityNoiseManager?.updateFromConfig(config);
        if (this.structuralFilter) {
            const u = this.structuralFilter.uniforms;
            const cloudConfig = ssConfig.cloudOcclusion;
            const windAngleRad = (cloudConfig.wind.angle ?? 45.0) * (Math.PI / 180);
            const windSpeed = (cloudConfig.wind.speed ?? 0.001);
            u.u_windDirection = [Math.cos(windAngleRad) * windSpeed, Math.sin(windAngleRad) * windSpeed];
            const noise = cloudConfig.noise;
            u.u_noise_scale = noise.scale;
            u.u_noise_octaves = noise.octaves;
            u.u_noise_persistence = noise.persistence;
            u.u_noise_lacunarity = noise.lacunarity;
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

            // Read from the new centralized location for shadow interaction settings
            const shadowInteractionConfig = foundry.utils.getProperty(config, "postProcessing.colorCorrection.sceneIlluminationMixIn.shadowInteraction");

            if (shadowInteractionConfig) {
                u.u_illum_intensity = shadowInteractionConfig.intensity;
                u.u_illum_luminanceThreshold = shadowInteractionConfig.luminanceThreshold;
                u.u_illum_softness = shadowInteractionConfig.softness;
            }
        }
        if (this.rgbSplitFilter) {
            const u = this.rgbSplitFilter.uniforms;
            const rgbConfig = ssConfig.rgbSplit;
            u.uIntensity = rgbConfig.intensity;
            u.uThreshold = rgbConfig.threshold;
        }
        if (this.parallaxMaskFilter) {
            this.parallaxMaskFilter.uniforms.uParallax = ssConfig.parallax;
        }
    }

    async _tearDown(options) {
        console.log(this.LOG_PREFIX, "Tear Down called. This is the end of a scene's lifecycle. Destroying all resources.");

        const destroyAndLog = (obj, name) => {
            if (obj && typeof obj.destroy === 'function') {
                if (obj instanceof PIXI.Container) {
                    obj.destroy({
                        children: true,
                        texture: true,
                        baseTexture: true
                    });
                } else {
                    obj.destroy();
                }
            }
        };

        destroyAndLog(this.intensityNoiseManager, 'intensityNoiseManager');
        destroyAndLog(this.structuralFilter, 'structuralFilter');
        destroyAndLog(this._patternGeneratorSprite, '_patternGeneratorSprite');
        destroyAndLog(this.finalShadowTexture, 'finalShadowTexture');
        destroyAndLog(this.finalHighlightMaskTexture, 'finalHighlightMaskTexture');
        destroyAndLog(this.effectSprite, 'effectSprite');
        destroyAndLog(this.rgbSplitFilter, 'rgbSplitFilter');
        destroyAndLog(this._splitHighlightSprite, '_splitHighlightSprite');
        destroyAndLog(this.splitHighlightMaskTexture, 'splitHighlightMaskTexture');
        destroyAndLog(this.outdoorsMaskContainer, 'outdoorsMaskContainer');
        destroyAndLog(this.outdoorsMaskTexture, 'outdoorsMaskTexture');
        this.outdoorsMaskSprites.clear();
        destroyAndLog(this.cleanStructuralLightMask, 'cleanStructuralLightMask');
        destroyAndLog(this.parallaxMaskFilter, 'parallaxMaskFilter');
        destroyAndLog(this._parallaxMaskSprite, '_parallaxMaskSprite');

        this.intensityNoiseManager = null;
        this.structuralFilter = null;
        this._patternGeneratorSprite = null;
        this.finalShadowTexture = null;
        this.finalHighlightMaskTexture = null;
        this.effectSprite = null;
        this.outdoorsMaskContainer = null;
        this.outdoorsMaskTexture = null;
        this.rgbSplitFilter = null;
        this._splitHighlightSprite = null;
        this.splitHighlightMaskTexture = null;
        this.cleanStructuralLightMask = null;
        this.parallaxMaskFilter = null;
        this._parallaxMaskSprite = null;

        console.log(this.LOG_PREFIX, "All resources have been destroyed.");
        await super._tearDown(options);
    }
}

// --- 5.7. Iridescence ---
class IridescenceFilter extends PIXI.Filter {
    static MAX_OCTAVES = 8; // The constant is now defined here.

    constructor(options = {}) {

        const fragmentSrc = `
                        precision mediump float;
                        varying vec2 vTextureCoord;

                        const int MAX_OCTAVES = ${IridescenceFilter.MAX_OCTAVES}; // Injected from JS
                        const int MAX_COLORS = 8;

                        // Input Textures
                        uniform sampler2D uSampler;
                        uniform sampler2D uMaskTexture;
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
                        float random(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                        }

                        float noise(vec2 st) {
                            vec2 i = floor(st);
                            vec2 f = fract(st);
                            vec2 u = f * f * (3.0 - 2.0 * f);
                            return mix(mix(random(i + vec2(0.0, 0.0)), random(i + vec2(1.0, 0.0)), u.x),
                                    mix(random(i + vec2(0.0, 1.0)), random(i + vec2(1.0, 1.0)), u.x), u.y);
                        }

                        float fbm(vec2 st) {
                            float value = 0.0;
                            float amplitude = 0.5;
                            float frequency = 1.0;
                            for (int i = 0; i < MAX_OCTAVES; i++) {
                                if (i >= uOctaves) break;
                                value += amplitude * noise(st * frequency);
                                st *= uLacunarity;
                                amplitude *= uPersistence;
                            }
                            return value;
                        }

                        // --- COLOR FUNCTIONS ---
                        float hue2rgb(float p, float q, float t) {
                            if (t < 0.0) t += 1.0;
                            if (t > 1.0) t -= 1.0;
                            if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                            if (t < 1.0/2.0) return q;
                            if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                            return p;
                        }

                        vec3 hsl2rgb(vec3 c) {
                            if (c.y == 0.0) return vec3(c.z);
                            float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
                            float p = 2.0 * c.z - q;
                            return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0));
                        }

                        vec3 rgb2hsl(vec3 c) {
                            float max_c = max(max(c.r, c.g), c.b);
                            float min_c = min(min(c.r, c.g), c.b);
                            float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                            if (max_c != min_c) {
                                float d = max_c - min_c;
                                s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                                if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                                else if (max_c == c.g) h = (c.b - c.r) / d + 2.0;
                                else h = (c.r - c.g) / d + 4.0;
                                h /= 6.0;
                            }
                            return vec3(h, s, l);
                        }

                        vec3 getGradientColor(float t) {
                            if (uNumColors <= 1) { return uGradientColors[0]; }
                            float pos = t * float(uNumColors - 1);
                            float mix_factor = fract(pos);
                            if (pos < 1.0) { return mix(uGradientColors[0], uGradientColors[1], mix_factor); }
                            else if (pos < 2.0) { return mix(uGradientColors[1], uGradientColors[2], mix_factor); }
                            else if (pos < 3.0) { return mix(uGradientColors[2], uGradientColors[3], mix_factor); }
                            else if (pos < 4.0) { return mix(uGradientColors[3], uGradientColors[4], mix_factor); }
                            else if (pos < 5.0) { return mix(uGradientColors[4], uGradientColors[5], mix_factor); }
                            else if (pos < 6.0) { return mix(uGradientColors[5], uGradientColors[6], mix_factor); }
                            else if (pos < 7.0) { return mix(uGradientColors[6], uGradientColors[7], mix_factor); }
                            else { return uGradientColors[7]; }
                        }

                        void main(void) {
                            float maskValue = texture2D(uMaskTexture, vTextureCoord).r;
                            if (maskValue < 0.01) {
                                discard;
                            }

                            vec2 worldCoord = uCameraOffset + (vTextureCoord * uViewSize);
                            vec2 screenCoord = vTextureCoord * uResolution;
                            vec2 parallaxCoord = mix(worldCoord, screenCoord, uParallax);

                            vec2 distortionOffset = (texture2D(uDistortionMap, vTextureCoord).rg - 0.5) * 2.0;
                            vec2 distortedCoord = parallaxCoord + (distortionOffset * uDistortionStrength * 10.0);

                            vec2 scaledPatternUv = distortedCoord * uScale * 0.01;
                            
                            // Animate both directional drift and internal evolution
                            vec2 fbm_uv = scaledPatternUv;
                            fbm_uv += vec2(uTime * uSpeed * 0.1); // Scaled down directional drift
                            fbm_uv.x += uTime * uFbmEvolution * 0.1; // Slower time evolution

                            float patternDriver = fbm(fbm_uv);

                            // Apply brightness and contrast to the raw noise value
                            patternDriver = (patternDriver - 0.5 + uFbmBrightness) * uFbmContrast + 0.5;

                            vec3 baseColor = getGradientColor(clamp(patternDriver, 0.0, 1.0));
                            vec3 hsl = rgb2hsl(baseColor);
                            hsl.x = fract(hsl.x + uHueShift);
                            vec3 shiftedColor = hsl2rgb(hsl);
                            shiftedColor += uGradientBrightness;
                            shiftedColor = (shiftedColor - 0.5) * uGradientContrast + 0.5;

                            vec3 finalRgb = clamp(shiftedColor, 0.0, 1.0) * uIntensity * maskValue;
                            gl_FragColor = vec4(finalRgb, uIntensity * maskValue);
                        }
                    `;

        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            // Textures
            uMaskTexture: PIXI.Texture.EMPTY,
            uDistortionMap: PIXI.Texture.EMPTY,
            // World
            uParallax: options.parallax ?? 0.0,
            uCameraOffset: [0, 0],
            uViewSize: [1, 1],
            uResolution: [1, 1],
            // Effect
            uTime: 0.0,
            uSpeed: options.speed ?? 0.0,
            uScale: options.scale ?? 8.0,
            uIntensity: options.intensity ?? 1.0,
            uDistortionStrength: options.distortion?.strength ?? 0.0,
            // FBM
            uOctaves: options.fbm?.octaves ?? 5,
            uPersistence: options.fbm?.persistence ?? 0.5,
            uLacunarity: options.fbm?.lacunarity ?? 2.0,
            uFbmEvolution: options.fbm?.evolution ?? 0.1,
            uFbmBrightness: (options.fbm?.brightness ?? 0.5) - 0.5,
            uFbmContrast: options.fbm?.contrast ?? 1.0,
            // Gradient
            uGradientColors: [],
            uNumColors: 0,
            uHueShift: options.gradient?.hueShift ?? 0.0,
            uGradientBrightness: options.gradient?.brightness ?? 0.0,
            uGradientContrast: options.gradient?.contrast ?? 1.0,
        });
    }
}

class IridescenceLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'iridescence'
        });

        this.iridescenceFilter = null;
        this.effectSprite = null;
        this.distortionNoiseManager = null;
        this._framesSinceLoad = 0;
    }

    static getSettingsHTML() {
        const effectKey = 'iridescence';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
                        ${checkboxHTML}
                        <hr style="border-color: #555; margin: 6px 0;">
                        ${DebuggerUIBuilder._createTextureInputHTML('iridescence', 'Iridescence Mask')}
                        <p class="description-text">Creates a colorful, oil-slick-like effect within the masked areas.</p>
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.intensity', 'Intensity', 0, 2, 0.05)}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.speed', 'Anim Speed', 0, 0.2, 0.001, 'Directional drift speed of the pattern.')}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.scale', 'Pattern Scale', 0.1, 20, 0.1)}
                        ${DebuggerUIBuilder._createSliderHTML('iridescence.parallax', 'Parallax', 0, 1, 0.01, '0 = Sticks to Map, 1 = Sticks to Screen')}
                        <details id="details-iridescence-fbm"><summary><span class="accordion-toggle"></span><strong>FBM Pattern</strong></summary>
                            <div>
                                <p class="description-text">Controls the procedural noise used to generate the base pattern.</p>
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.evolution', 'Evolution', 0, 1, 0.001, 'Internal "boiling" speed of the pattern.')}
                                ${DebuggerUIBuilder._createSliderHTML('iridescence.fbm.octaves', 'Complexity (Octaves)', 1, IridescenceFilter.MAX_OCTAVES, 1, 'Layers of noise. More is more detailed but slower.')}
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
                                        ${DebuggerUIBuilder._createSliderHTML('iridescence.noise.speed', -0.5, 0.5, 0.001)}
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

    async _draw(options) {
        await super._draw(options);

        this._framesSinceLoad = 0;
        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        const renderer = canvas.app.renderer;

        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'iridescence.noise', true);

        try {
            this.iridescenceFilter = new IridescenceFilter();
            systemStatus.update('shaders', 'iridescence', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to create IridescenceFilter", e);
            systemStatus.update('shaders', 'iridescence', {
                state: 'error',
                message: `Compilation Failed: ${e.message}`
            });
        }

        this.effectSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.effectSprite.filters = this.iridescenceFilter ? [this.iridescenceFilter] : [];
        this.addChild(this.effectSprite);

        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime);
        if (this._destroyed || !this.visible || !this.iridescenceFilter) return;
        this._framesSinceLoad++;

        const hasActiveTargets = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);
        if (!hasActiveTargets || this._framesSinceLoad < 5) {
            this.effectSprite.visible = false;
            return;
        }
        this.effectSprite.visible = true;

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.distortionNoiseManager.update(deltaTime, canvas.app.renderer);

        const stage = canvas.stage;
        const screen = canvas.app.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        const u = this.iridescenceFilter.uniforms;

        u.uTime += deltaTime * timeFactor;
        u.uDistortionMap = this.distortionNoiseManager.getTexture();
        u.uMaskTexture = this.getMaskTexture(); // Use the getter from the base class

        u.uCameraOffset = [topLeft.x, topLeft.y];
        u.uViewSize = [screen.width / stage.scale.x, screen.height / stage.scale.y];
        u.uResolution = [screen.width, screen.height];

        this.effectSprite.position.copyFrom(topLeft);
        this.effectSprite.width = screen.width / stage.scale.x;
        this.effectSprite.height = screen.height / stage.scale.y;
    }

    async updateFromConfig(config) {
        const iConfig = config.iridescence;
        this.visible = config.enabled && iConfig.enabled;

        if (this.effectSprite) {
            this.effectSprite.blendMode = iConfig.blendMode;
        }

        this.distortionNoiseManager?.updateFromConfig(config);

        if (this.iridescenceFilter) {
            const u = this.iridescenceFilter.uniforms;
            u.uIntensity = iConfig.intensity;
            // The timeFactor is applied to the time accumulator in the animate loop, so we use raw speed values here.
            u.uSpeed = iConfig.speed;
            u.uScale = iConfig.scale;
            u.uParallax = iConfig.parallax;
            u.uDistortionStrength = iConfig.distortion.enabled ? iConfig.distortion.strength : 0.0;

            const fbmConfig = iConfig.fbm;
            if (fbmConfig) {
                u.uOctaves = fbmConfig.octaves;
                u.uPersistence = fbmConfig.persistence;
                u.uLacunarity = fbmConfig.lacunarity;
                u.uFbmEvolution = fbmConfig.evolution;
                u.uFbmBrightness = (fbmConfig.brightness ?? 0.5) - 0.5;
                u.uFbmContrast = fbmConfig.contrast;
            }

            const gConfig = iConfig.gradient;
            const gradientData = GRADIENT_PRESETS[gConfig.name];
            if (gradientData) {
                u.uGradientColors = gradientData.colors.flatMap(hex => hexToRgbArray(hex));
                u.uNumColors = gradientData.colors.length;
            }
            u.uHueShift = gConfig.hueShift;
            u.uGradientBrightness = gConfig.brightness;
            u.uGradientContrast = gConfig.contrast;
        }
        this._needsMaskUpdate = true;
    }

    _onResize() {
        super._onResize();
        const renderer = canvas.app.renderer;
        this.distortionNoiseManager?.resize(renderer);

        if (this.effectSprite) {
            const stage = canvas.stage;
            const screen = canvas.app.screen;
            const topLeft = stage.toLocal({
                x: 0,
                y: 0
            });
            this.effectSprite.position.copyFrom(topLeft);
            this.effectSprite.width = screen.width / stage.scale.x;
            this.effectSprite.height = screen.height / stage.scale.y;
        }
    }

    async _tearDown(options) {
        this.distortionNoiseManager?.destroy();
        this.iridescenceFilter?.destroy();
        this.effectSprite?.destroy();

        this.distortionNoiseManager = null;
        this.iridescenceFilter = null;
        this.effectSprite = null;

        await super._tearDown(options);
    }
}

// --- 5.8. Ambient & Ground Glow ---
class AmbientLayer extends CanvasLayer {
    constructor() {
        super();
        this.effectSprites = new Map();
        this.colorFilter = null;
        this._destroyed = false;

        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        console.log("AmbientLayer DEBUG | constructor: New layer instance created. Destroyed state:", this._destroyed);
    }

    async _draw(options) {
        console.log("AmbientLayer DEBUG | _draw: Called. Layer is being drawn to the canvas.", {
            options
        });
        this._destroyed = false;
        console.log("AmbientLayer DEBUG | _draw: _destroyed flag set to false.");

        try {
            this.colorFilter = new AmbientColorFilter();
            console.log("AmbientLayer DEBUG | _draw: AmbientColorFilter created successfully.");
        } catch (e) {
            console.error("AmbientLayer DEBUG | _draw: FAILED to create AmbientColorFilter.", e);
        }

        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        console.log("AmbientLayer DEBUG | _draw: Blend mode set to NORMAL.");

        // The premature call to _onResize() has been removed.
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound);
        console.log("AmbientLayer DEBUG | _draw: Listeners added.");
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('ambient', 'Ambient / Emissive', `
                        ${DebuggerUIBuilder._createTextureInputHTML('ambient', 'Emissive Map (_Ambient)')}
                        <p class="description-text">Applies color and effects to a texture, often used for glowing areas that are part of the map itself (e.g., lava, magic runes).</p>
                        ${DebuggerUIBuilder._createSliderHTML('ambient.intensity', 'Intensity', 0, 5, 0.05, 'Brightness multiplier. Values > 1 are useful for additive blending.')}
                        ${DebuggerUIBuilder._createSelectHTML('ambient.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                
                        <details id="details-ambient-tokenMasking">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    ${DebuggerUIBuilder._createCheckboxHTML('ambient.tokenMasking.enabled', 'Token Masking', true)}
                                </div>
                            </summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Hides the effect behind tokens. For this to work, you may need to increase this layer's Z-Index (see Rendering Order section) to be above the token layer.</p>
                                ${DebuggerUIBuilder._createSliderHTML('ambient.tokenMasking.threshold', 'Mask Threshold', 0, 1, 0.01)}
                            </div>
                        </details>
                
                        <details id="details-ambient-masking">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    ${DebuggerUIBuilder._createCheckboxHTML('ambient.masking.enabled', 'Luminance Mask', true)}
                                </div>
                            </summary>
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

    async _tearDown(options) {
        this._destroyed = true;
        console.log("AmbientLayer DEBUG | _tearDown: Called. Tearing down layer.", {
            options
        });
        canvas.app.ticker.remove(this._onAnimateBound);
        window.removeEventListener('resize', this._onResizeBound);
        console.log("AmbientLayer DEBUG | _tearDown: Listeners removed.");

        this.colorFilter?.destroy();
        console.log("AmbientLayer DEBUG | _tearDown: colorFilter destroyed.");

        // Explicitly destroy children to be sure.
        this.removeChildren().forEach(c => c.destroy({
            children: true,
            texture: true,
            baseTexture: true
        }));
        this.effectSprites.clear();
        console.log("AmbientLayer DEBUG | _tearDown: All children destroyed and effectSprites map cleared.");

        super._tearDown(options);
    }

    _onAnimate() {
        if (this._destroyed || !this.visible) return;

        if (this.colorFilter) {
            const aConfig = game.mapShine.profileManager.activeConfig.ambient;
            const tmConfig = aConfig.tokenMasking;
            const u = this.colorFilter.uniforms;
            const tokenManagerExists = !!canvas.mapShine?.tokenMaskManager;

            const shouldEnableTokenMask = tmConfig.enabled && tokenManagerExists;
            if (u.uTokenMaskEnabled !== shouldEnableTokenMask) {
                // console.log(`AmbientLayer DEBUG | _onAnimate: Token mask state changed to ${shouldEnableTokenMask}.`);
                u.uTokenMaskEnabled = shouldEnableTokenMask;
            }

            if (u.uTokenMaskEnabled) {
                u.uTokenMask = canvas.mapShine.tokenMaskManager.getMaskTexture();
            }
        }
    }

    _onResize() {
        console.log("AmbientLayer DEBUG | _onResize: Called. Triggering updateEffectTargets.");
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        } else {
            console.log("AmbientLayer DEBUG | _onResize: Skipped update, no targets available yet.");
        }
    }

    async updateEffectTargets(targets) {
        console.log("AmbientLayer DEBUG | updateEffectTargets: Called. (Visibility check removed)");

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);
        console.log(`AmbientLayer DEBUG | updateEffectTargets: Processing ${allTargets.size} potential targets.`);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.ambient) continue;
            validTargetIds.add(id);
            let effectSprite = this.effectSprites.get(id);
            if (!effectSprite) {
                console.log(`AmbientLayer DEBUG | updateEffectTargets: Creating NEW sprite for target ID: ${id}`);
                effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                if (this.colorFilter) {
                    effectSprite.filters = [this.colorFilter];
                    // console.log(`AmbientLayer DEBUG | updateEffectTargets: Assigned colorFilter to new sprite for ${id}.`);
                }
                this.effectSprites.set(id, effectSprite);
                this.addChild(effectSprite);
            }
            await this._updateSpriteTransform(effectSprite, targetData.ambient, targetData.rect);
        }

        const idsToDestroy = [];
        for (const id of this.effectSprites.keys()) {
            if (!validTargetIds.has(id)) {
                idsToDestroy.push(id);
            }
        }

        if (idsToDestroy.length > 0) {
            console.log(`AmbientLayer DEBUG | updateEffectTargets: Destroying ${idsToDestroy.length} stale sprites for IDs:`, idsToDestroy);
            for (const id of idsToDestroy) {
                const sprite = this.effectSprites.get(id);
                sprite?.destroy();
                this.effectSprites.delete(id);
            }
        }

        console.log(`AmbientLayer DEBUG | updateEffectTargets: Finished. Active sprites: ${this.effectSprites.size}. Triggering updateFromConfig.`);
        await this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        if (!sprite || sprite.destroyed) return;

        // console.log(`AmbientLayer DEBUG | _updateSpriteTransform: Updating sprite for texture: ${texturePath}`);
        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            // console.log(`AmbientLayer DEBUG | _updateSpriteTransform: Loading new texture. Old: ${currentPath}, New: ${texturePath}`);
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                console.error(`AmbientLayer DEBUG | _updateSpriteTransform: FAILED to load texture: ${texturePath}`, e);
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }
        if (!sprite || sprite.destroyed || !sprite.anchor || !sprite.texture.valid || !rect) {
            // console.warn(`AmbientLayer DEBUG | _updateSpriteTransform: Skipping transform update due to invalid texture or rect.`);
            return;
        }
        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    async updateFromConfig(config) {
        // console.log("AmbientLayer DEBUG | updateFromConfig: Called.");
        const aConfig = config.ambient;
        const ccConfig = aConfig.colorCorrection;

        this.visible = config.enabled && aConfig.enabled;
        // console.log("AmbientLayer DEBUG | updateFromConfig: Layer visibility set to:", this.visible);

        this.blendMode = PIXI.BLEND_MODES.NORMAL;
        this.alpha = 1.0;

        for (const sprite of this.effectSprites.values()) {
            sprite.blendMode = aConfig.blendMode;
            sprite.alpha = 1.0;
        }

        if (this.colorFilter) {
            this.colorFilter.enabled = ccConfig.enabled;
            const u = this.colorFilter.uniforms;
            u.uSaturation = ccConfig.saturation;
            u.uBrightness = ccConfig.brightness;
            u.uContrast = ccConfig.contrast;
            u.uGamma = ccConfig.gamma;
            u.uTintColor = hexToRgbArray(ccConfig.tint.color);
            u.uTintAmount = ccConfig.tint.amount;
            u.u_intensity = aConfig.intensity;
            u.uTokenMaskThreshold = aConfig.tokenMasking.threshold;
        }

        const mConfig = aConfig.masking;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const shouldBeMasked = this.visible && mConfig.enabled && !!illuminationAPI;
        if (!shouldBeMasked && this.mask) {
            // console.log("AmbientLayer DEBUG | updateFromConfig: Removing luminance mask.");
            this.mask = null;
        }
    }
}

class GroundGlowLayer extends CanvasLayer {
    constructor() {
        super();
        this.effectSprites = new Map();
        this.maskGenerator = null;
        this.lightingMask = null;
        this.colorFilter = null;
        this._destroyed = false;
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('groundGlow', 'Glow in the Dark', `
                        ${DebuggerUIBuilder._createTextureInputHTML('groundGlow', 'Glow Texture')}
                        <p class="description-text">Makes a texture appear to glow only in unlit areas of the scene. Requires scene lighting.</p>
                        ${DebuggerUIBuilder._createSliderHTML('groundGlow.intensity', 'Intensity', 0, 5, 0.05)}
                
                        <details id="details-groundGlow-tokenMasking">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    ${DebuggerUIBuilder._createCheckboxHTML('groundGlow.tokenMasking.enabled', 'Token Masking', true)}
                                </div>
                            </summary>
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

    async _draw(options) {
        console.log("GroundGlowLayer | Drawing layer with improved dependency handling.");
        this.maskGenerator = new LightingMaskGenerator();
        this.colorFilter = new AmbientColorFilter();
        this.container = new PIXI.Container();
        this.addChild(this.container);
        this.lightingMask = new PIXI.Sprite(this.maskGenerator.getMaskTexture());
        // The mask is now applied conditionally in the animate loop, not on draw.
        this.container.mask = null;
        window.addEventListener('resize', this._onResizeBound);
        canvas.app.ticker.add(this._onAnimateBound, this);
    }

    async _tearDown(options) {
        this._destroyed = true;
        console.log("GroundGlowLayer | Tearing down layer.");

        if (this.container) {
            this.container.mask = null;
        }

        canvas.app.ticker.remove(this._onAnimateBound, this);
        window.removeEventListener('resize', this._onResizeBound);
        this.maskGenerator?.destroy();
        this.lightingMask?.destroy();
        this.container?.destroy({
            children: true,
            texture: true
        });
        this.effectSprites.clear();
        this.colorFilter?.destroy();
        this.maskGenerator = this.container = this.lightingMask = this.colorFilter = null;
        return super._tearDown(options);
    }

    async updateEffectTargets(targets) {
        if (!this.container) return;

        const config = game.mapShine.profileManager.activeConfig;
        const ggConfig = config.groundGlow;
        // Check only if the effect is enabled in the configuration.
        // The dependency on the illumination API will be handled in the animation loop.
        const isConfigEnabled = config.enabled && ggConfig.enabled;

        this.visible = isConfigEnabled;
        this.container.visible = isConfigEnabled;

        if (!isConfigEnabled) {
            if (this.effectSprites.size > 0) {
                for (const sprite of this.effectSprites.values()) {
                    sprite.destroy();
                }
                this.effectSprites.clear();
            }
            return;
        }

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.groundGlow) continue;
            validTargetIds.add(id);
            let sprite = this.effectSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                sprite.filters = [this.colorFilter];
                this.effectSprites.set(id, sprite);
                this.container.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.groundGlow, targetData.rect);
        }

        for (const [id, sprite] of this.effectSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.effectSprites.delete(id);
            }
        }

        await this.updateFromConfig(config);
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        if (!sprite || sprite.destroyed) return;

        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }

        if (!sprite || sprite.destroyed || !sprite.anchor || !sprite.texture.valid || !rect) return;

        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _updateMaskTransform() {
        if (!this.lightingMask || !canvas?.stage) return;
        const stage = canvas.stage;
        const screen = canvas.app.renderer.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        this.lightingMask.position.copyFrom(topLeft);
        this.lightingMask.width = screen.width / stage.scale.x;
        this.lightingMask.height = screen.height / stage.scale.y;
    }

    _onAnimate() {
        if (this._destroyed || !this.visible || !this.container) return;

        const ggConfig = game.mapShine.profileManager.activeConfig.groundGlow;
        const illuminationAPI = game.modules.get('illuminationbuffer')?.api;
        const illuminationTexture = illuminationAPI?.getLightingTexture();

        // If the API or its texture is not ready, disable the mask and wait for the next frame.
        if (!illuminationAPI || !illuminationTexture?.valid) {
            if (this.container.mask) {
                this.container.mask = null;
            }
            return;
        }

        // If we reach here, the API and texture are available. Ensure the mask is active.
        if (!this.container.mask) {
            this.container.mask = this.lightingMask;
        }

        if (this.colorFilter) {
            const tmConfig = ggConfig.tokenMasking;
            const u = this.colorFilter.uniforms;
            u.uTokenMaskEnabled = tmConfig.enabled && !!canvas.mapShine?.tokenMaskManager;
            if (u.uTokenMaskEnabled) {
                u.uTokenMask = canvas.mapShine.tokenMaskManager.getMaskTexture();
            }
        }

        this.maskGenerator.update(
            canvas.app.renderer,
            illuminationTexture,
            ggConfig.luminanceThreshold,
            ggConfig.softness,
            ggConfig.invert
        );
        this._updateMaskTransform();
    }

    async updateFromConfig(config) {
        if (!this.container || !this.colorFilter) return;
        const ggConfig = config.groundGlow;

        // Visibility is now determined only by config, not API availability.
        this.visible = config.enabled && ggConfig.enabled;
        this.container.visible = this.visible;

        if (!this.visible) return;

        this.container.blendMode = ggConfig.blendMode;
        const u = this.colorFilter.uniforms;
        u.u_intensity = ggConfig.intensity;
        u.uBrightness = ggConfig.brightness - 1.0;
        u.uSaturation = ggConfig.saturation;
        u.uContrast = 1.0;
        u.uGamma = 1.0;
        u.uTintAmount = 0.0;
        u.uTokenMaskThreshold = ggConfig.tokenMasking.threshold;
        for (const sprite of this.effectSprites.values()) {
            sprite.alpha = 1.0;
        }
    }

    _onResize() {
        this.maskGenerator?.resize(canvas.app.screen.width, canvas.app.screen.height);
        this._updateMaskTransform();
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
    }
}

// --- 5.9. Heat Distortion ---
class HeatDistortionLayer extends CanvasLayer {
    constructor() {
        super();
        // All properties are initialized to null. No bindings happen here.
        this.heatSourceContainer = null;
        this.combinedMaskTexture = null;
        this.noiseManager = null;
        this.heatSprites = new Map();

        this._needsMaskUpdate = true;
        this._destroyed = false;
        this._framesSinceLoad = 0;
    }

    static getSettingsHTML() {
        const effectKey = 'heatDistortion';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
                        ${checkboxHTML}
                        <hr style="border-color: #555; margin: 6px 0;">
                        ${DebuggerUIBuilder._createTextureInputHTML('heat', 'Intensity Mask (_Heat)')}
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

    async _draw(options) {
        console.log("HeatDistortionLayer | Drawing layer with robust state management.");
        this.visible = false; // Start as invisible until ready.

        // Bind event handlers here, in _draw, for stability.
        this._onAnimateBound = this._onAnimate.bind(this);
        this._onResizeBound = this._onResize.bind(this);
        this._onPanBound = this._onPan.bind(this);

        // Reset state for the new scene.
        this._framesSinceLoad = 0;
        this._needsMaskUpdate = true;
        this._destroyed = false;

        this.heatSourceContainer = new PIXI.Container();
        this.addChild(this.heatSourceContainer);

        const renderer = canvas.app.renderer;
        this.combinedMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.noiseManager = new NoiseTextureManager(renderer, 'heatDistortion.noise');

        canvas.app.ticker.add(this._onAnimateBound);
        window.addEventListener('resize', this._onResizeBound);
        if (!game.modules.get('libwrapper')?.active) {
            Hooks.on('canvasPan', this._onPanBound);
        }
    }

    _onPan() {
        this._needsMaskUpdate = true;
    }

    async updateEffectTargets(targets) {
        if (!this.heatSourceContainer) return;

        const validTargetIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);
        for (const [id, targetData] of allTargets.entries()) {
            if (!targetData?.heat) continue;
            validTargetIds.add(id);
            let sprite = this.heatSprites.get(id);
            if (!sprite) {
                sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                this.heatSprites.set(id, sprite);
                this.heatSourceContainer.addChild(sprite);
            }
            await this._updateSpriteTransform(sprite, targetData.heat, targetData.rect);
        }
        for (const [id, sprite] of this.heatSprites.entries()) {
            if (!validTargetIds.has(id)) {
                sprite.destroy();
                this.heatSprites.delete(id);
            }
        }
        this._needsMaskUpdate = true;
    }

    async _updateSpriteTransform(sprite, texturePath, rect) {
        if (!sprite || sprite.destroyed) return;

        const currentPath = sprite.texture?.baseTexture?.resource?.src;
        if (texturePath !== currentPath) {
            try {
                sprite.texture = await foundry.canvas.loadTexture(texturePath);
            } catch (e) {
                sprite.texture = PIXI.Texture.EMPTY;
            }
        }

        if (!sprite || sprite.destroyed || !sprite.anchor || !sprite.texture.valid || !rect) return;

        sprite.anchor.set(0.5);
        sprite.position.set(rect.x + (rect.width / 2), rect.y + (rect.height / 2));
        sprite.width = rect.width;
        sprite.height = rect.height;
        sprite.rotation = rect.rotation || 0;
    }

    _onAnimate(deltaTime) {
        if (this._destroyed) return;

        this._framesSinceLoad++;
        const heatFilter = ScreenEffectsManager.getFilter('heatDistortion');

        // Default to disabled. It must pass all checks to become active.
        if (heatFilter) {
            heatFilter.enabled = false;
        }

        // --- Dependency Checks ---
        const mainConfig = game.mapShine.profileManager.activeConfig;
        const config = mainConfig.heatDistortion;
        if (!mainConfig.enabled || !config.enabled || !heatFilter) {
            return;
        }

        const hasActiveHeatSources = this.heatSprites.size > 0 && Array.from(this.heatSprites.values()).some(s => s.texture.valid);
        if (!hasActiveHeatSources) {
            return;
        }

        const noiseTexture = this.noiseManager?.getTexture();
        if (!noiseTexture?.valid) {
            return;
        }

        if (this._framesSinceLoad < 5) {
            return;
        }
        // --- All checks passed, make the effect active ---
        heatFilter.enabled = true;

        if (this._needsMaskUpdate) {
            canvas.app.renderer.render(this.heatSourceContainer, {
                renderTexture: this.combinedMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });
            this._needsMaskUpdate = false;
        }

        // Pass the unscaled deltaTime; the noiseManager will handle the timeFactor internally.
        this.noiseManager.update(deltaTime, canvas.app.renderer);

        const u = heatFilter.uniforms;
        u.u_intensity = config.intensity;
        u.u_displacementMap = noiseTexture;
        u.u_intensityMask = this.combinedMaskTexture;
    }

    async updateFromConfig(config) {
        this.noiseManager?.updateFromConfig(config);
        this._needsMaskUpdate = true;
    }

    _onResize() {
        const renderer = canvas.app.renderer;
        this.combinedMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.noiseManager?.resize(renderer);
        if (game.mapShine?.effectTargetManager?.targets) {
            this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
        }
        this._needsMaskUpdate = true;
    }

    async _tearDown(options) {
        console.log("HeatDistortionLayer | Tearing down layer completely.");
        if (this._destroyed) return;
        this._destroyed = true;

        if (this._onAnimateBound) canvas.app.ticker.remove(this._onAnimateBound);
        if (this._onResizeBound) window.removeEventListener('resize', this._onResizeBound);
        if (this._onPanBound) Hooks.off('canvasPan', this._onPanBound);

        // Meticulously destroy all created PIXI objects
        this.noiseManager?.destroy();
        this.combinedMaskTexture?.destroy(true);
        this.heatSourceContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.heatSprites.clear();

        // Nullify all properties
        this.heatSourceContainer = null;
        this.combinedMaskTexture = null;
        this.noiseManager = null;

        return super._tearDown(options);
    }
}

// --- 5.10. Prism Effect ---
class PrismLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'prism'
        });

        this.distortionNoiseManager = null;
        this._framesSinceLoad = 0;
        this._destroyed = false;
    }

    static getSettingsHTML() {
        const effectKey = 'prism';
        const path = `${effectKey}.worldBasedOnly`;
        const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(path, 'World Based Only', false, 'Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set.');
        const iconHTML = `<span class="world-based-icon" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings."><i class="fas fa-globe"></i></span>`;

        const content = `
                        ${checkboxHTML}
                        <hr style="border-color: #555; margin: 6px 0;">
                        ${DebuggerUIBuilder._createTextureInputHTML('prism', 'Effect Mask (_Prism)')}
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

    async _draw(options) {
        await super._draw(options);

        this._framesSinceLoad = 0;
        this._destroyed = false;

        const renderer = canvas.app.renderer;
        this.distortionNoiseManager = new NoiseTextureManager(renderer, 'prism.distortionNoise', true);

        // This layer has no visible children. It only manages textures for a global filter.

        // Initial config update
        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime); // This renders the combined mask if needed
        if (this._destroyed) return;
        this._framesSinceLoad++;

        const prismFilter = ScreenEffectsManager.getFilter('prism');
        if (!prismFilter) return;

        // Check if the layer has any active mask textures.
        const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);

        const config = game.mapShine.profileManager.activeConfig;
        const pConfig = config.prism;

        // Enable the global filter only if the module is on, the effect is on, AND there's a _Prism texture.
        prismFilter.enabled = config.enabled && pConfig.enabled && hasActiveMasks;

        // Don't do any processing if the filter is disabled or if we're in the first few stabilization frames.
        if (!prismFilter.enabled || this._framesSinceLoad < 5) {
            return;
        }

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        // Update the noise manager for the distortion effect.
        this.distortionNoiseManager.update(deltaTime * timeFactor, canvas.app.renderer);

        // Feed the generated textures into the global filter's uniforms.
        const u = prismFilter.uniforms;
        u.uPrismMask = this.getMaskTexture();
        u.uDistortionMap = this.distortionNoiseManager.getTexture();
        u.uDistortionStrength = pConfig.distortionNoise.enabled ? pConfig.distortionStrength : 0.0;
    }

    async updateFromConfig(config) {
        // We only need to tell the distortion noise manager about the new config.
        // The other uniforms for PrismFilter are handled by ScreenEffectsManager or _onAnimate.
        this.distortionNoiseManager?.updateFromConfig(config);
    }

    _onResize() {
        super._onResize(); // Handles resizing the main _Prism mask texture.
        const renderer = canvas.app.renderer;
        this.distortionNoiseManager?.resize(renderer);
    }

    async _tearDown(options) {
        if (this._destroyed) return;
        this._destroyed = true;

        // On teardown, clear the textures from the global filter to prevent artifacts on the next scene.
        const prismFilter = ScreenEffectsManager.getFilter('prism');
        if (prismFilter) {
            prismFilter.uniforms.uPrismMask = PIXI.Texture.EMPTY;
            prismFilter.uniforms.uDistortionMap = PIXI.Texture.EMPTY;
            prismFilter.enabled = false;
        }

        this.distortionNoiseManager?.destroy();
        this.distortionNoiseManager = null;

        await super._tearDown(options);
    }
}

// --- 5.11 Water Effects ---
class WaterEffectsFilter extends PIXI.Filter {
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
            
                        // Input textures & masks
                        uniform sampler2D uSampler;
                        uniform sampler2D u_displacementMap;
                        uniform sampler2D u_waterMask;
                        uniform sampler2D u_shorelineMask;
                        uniform sampler2D u_blurredWaterMask;
            
                        // Uniforms for toggles and parameters
                        uniform bool u_useShorelineMask;
                        uniform vec2 u_camera_offset;
                        uniform vec2 u_view_size;
                        uniform float u_time;
                        uniform bool u_outputShorelineFoamMask;
            
                        // Wave & Distortion
                        uniform bool u_wave_enabled;
                        uniform float u_wave_intensity;
            
                        // Surface (Open Water Foam & Sheen)
                        uniform bool u_surface_enabled;
                        uniform vec3 u_openWaterFoamColor;
                        uniform float u_openWaterFoamIntensity;
                        uniform float u_openWaterFoamCoverage;
                        uniform float u_openWaterFoamSharpness;
                        uniform float u_openWaterFbmScale;
                        uniform float u_openWaterFbmSpeed;
                        uniform float u_openWaterFbmEvolution;
                        uniform int u_openWaterFbmOctaves;
                        uniform float u_openWaterFbmLacunarity;
                        uniform float u_openWaterFbmPersistence;
                        
                        // Sheen (Now calculated directly in this shader)
                        uniform bool u_sheenEnabled;
                        uniform vec3 u_sheenColor;
                        uniform float u_sheenIntensity;
                        uniform float u_sheenScale;
                        uniform float u_sheenSpeed;
                        uniform float u_sheenStretch;
                        uniform float u_sheenSharpness;
            
                        // Caustics
                        uniform bool u_caustics_enabled;
                        uniform vec3 u_causticsColor;
                        uniform float u_causticsIntensity;
                        uniform float u_causticsScale;
                        uniform float u_causticsSpeed;
                        uniform float u_causticsLineSharpness;
                        uniform float u_causticsBloomIntensity;
                        uniform float u_causticsLineDistortion;
                        uniform float u_causticsLineDistortionScale;
                        uniform float u_causticsIntersectionBoost;
                        uniform float u_causticsRoughnessScale;
                        uniform float u_causticsRoughnessIntensity;
                        
                        // Shoreline
                        uniform bool u_shoreline_enabled;
                        uniform vec3 u_shorelineFoamColor;
                        uniform float u_shorelineFoamIntensity;
            
                        // Shoreline Foam Pattern
                        uniform float u_shorelinePatternScale;
                        uniform float u_shorelinePatternSpeed;
                        uniform float u_shorelinePatternEvolution;
                        uniform int u_shorelinePatternOctaves;
                        uniform float u_shorelinePatternLacunarity;
                        uniform float u_shorelinePatternPersistence;
                        uniform float u_shorelinePatternBrightness;
                        uniform float u_shorelinePatternContrast;
                        
                        // Shoreline Displacement Swirl
                        uniform bool u_shorelineDisplacementEnabled;
                        uniform float u_shorelineDisplacementScale;
                        uniform float u_shorelineDisplacementSpeed;
                        uniform float u_shorelineDisplacementStrength;
            
                        // Shoreline Particle Mask Processing
                        uniform float u_particleMaskBrightness;
                        uniform float u_particleMaskContrast;
            
                        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
                        float snoise(vec3 v) {
                            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                            vec3 i  = floor(v + dot(v, C.yyy) );
                            vec3 x0 =   v - i + dot(i, C.xxx) ;
                            vec3 g = step(x0.yzx, x0.xyz);
                            vec3 l = 1.0 - g;
                            vec3 i1 = min( g.xyz, l.zxy );
                            vec3 i2 = max( g.xyz, l.zxy );
                            vec3 x1 = x0 - i1 + C.xxx;
                            vec3 x2 = x0 - i2 + C.yyy;
                            vec3 x3 = x0 - D.yyy;
                            i = mod(i, 289.0);
                            vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                                + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
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
                            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                            vec3 p0 = vec3(a0.xy,h.x);
                            vec3 p1 = vec3(a0.zw,h.y);
                            vec3 p2 = vec3(a1.xy,h.z);
                            vec3 p3 = vec3(a1.zw,h.w);
                            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                            p0 *= norm.x;
                            p1 *= norm.y;
                            p2 *= norm.z;
                            p3 *= norm.w;
                            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                            m = m * m;
                            return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
                        }
                        
                        float fbm(vec3 st, int octaves, float lacunarity, float persistence) {
                            float value = 0.0;
                            float amplitude = 0.5;
                            for (int i = 0; i < 8; i++) {
                                if (i >= octaves) break;
                                value += amplitude * snoise(st);
                                st *= lacunarity;
                                amplitude *= persistence;
                            }
                            return value * 0.5 + 0.5;
                        }
            
                        void main() {
                            float waterMaskValue = texture2D(u_waterMask, vTextureCoord).r;

                            if (waterMaskValue < 0.01 && !u_outputShorelineFoamMask) {
                                gl_FragColor = texture2D(uSampler, vTextureCoord);
                                return;
                            }

                            vec2 world_coord = u_camera_offset + (vTextureCoord * u_view_size);
            
                            vec2 wave_uv_offset = vec2(0.0);
                            if (u_wave_enabled) {
                                wave_uv_offset = (texture2D(u_displacementMap, vTextureCoord).xy - 0.5) * 2.0 * u_wave_intensity;
                            }
            
                            vec2 swirl_world_offset = vec2(0.0);
                            if (u_shoreline_enabled && u_shorelineDisplacementEnabled) {
                                float currentShorelineMask = u_useShorelineMask ? texture2D(u_shorelineMask, vTextureCoord).r : clamp((texture2D(u_blurredWaterMask, vTextureCoord).r - waterMaskValue) * 5.0, 0.0, 1.0);
                                if (currentShorelineMask > 0.0) {
                                    vec2 swirl_noise_coord = world_coord * u_shorelineDisplacementScale * 0.01;
                                    float displacement_time = u_time * u_shorelineDisplacementSpeed;
                                    float dx = snoise(vec3(swirl_noise_coord, displacement_time));
                                    float dy = snoise(vec3(swirl_noise_coord + vec2(17.8, 93.4), displacement_time));
                                    swirl_world_offset = vec2(dx, dy) * u_shorelineDisplacementStrength * currentShorelineMask;
                                }
                            }
            
                            vec2 final_distorted_uv = vTextureCoord + wave_uv_offset;
                            vec2 final_distorted_world_coord = world_coord + swirl_world_offset;
                            
                            vec4 sceneColor = texture2D(uSampler, mix(vTextureCoord, final_distorted_uv, waterMaskValue));
                            
                            vec3 finalColor = sceneColor.rgb;
            
                            if (u_caustics_enabled) {
                                float time = u_time * u_causticsSpeed;
                                vec3 dist_coord = vec3(world_coord * u_causticsLineDistortionScale * 0.01, time * 2.0);
                                float distortion_noise = snoise(dist_coord) * u_causticsLineDistortion;
                                vec3 coord1 = vec3(world_coord * u_causticsScale * 0.02 + distortion_noise, time);
                                float pattern1 = pow(max(0.0, 1.0 - abs(snoise(coord1))), u_causticsLineSharpness);
                                vec3 coord2 = vec3(world_coord * u_causticsScale * 0.01 - distortion_noise, time * 0.5);
                                float pattern2 = pow(max(0.0, 1.0 - abs(snoise(coord2))), u_causticsLineSharpness);
                                vec3 rough_coord = vec3(world_coord * u_causticsRoughnessScale * 0.01, time * 1.5);
                                float roughness_noise = snoise(rough_coord) * 0.5 + 0.5;
                                roughness_noise = 1.0 - u_causticsRoughnessIntensity + (roughness_noise * u_causticsRoughnessIntensity);
                                vec3 coord3 = vec3(world_coord * u_causticsScale * 0.005, time * 0.2);
                                float bloom_pattern = smoothstep(0.6, 1.0, snoise(coord3) * 0.5 + 0.5);
                                float line_pattern = pattern1 * pattern2 * u_causticsIntersectionBoost;
                                float final_pattern = (line_pattern * roughness_noise) + bloom_pattern * u_causticsBloomIntensity;
                                vec3 caustics = u_causticsColor * final_pattern * u_causticsIntensity;
                                finalColor += caustics * waterMaskValue;
                            }
            
                            if (u_surface_enabled) {
                                vec2 foam_wave_distortion = wave_uv_offset * u_openWaterFbmScale * 10.0;
                                vec2 baseFoamUV = (final_distorted_world_coord * u_openWaterFbmScale * 0.01) + foam_wave_distortion;

                                baseFoamUV += u_time * u_openWaterFbmSpeed * 0.1;
                                float foamTime = u_time * u_openWaterFbmEvolution * 0.1;
                                float foamNoise = fbm(vec3(baseFoamUV, foamTime), u_openWaterFbmOctaves, u_openWaterFbmLacunarity, u_openWaterFbmPersistence);
                                float openWaterFoamAmount = smoothstep(1.0 - u_openWaterFoamCoverage, 1.0 - u_openWaterFoamCoverage + u_openWaterFoamSharpness, foamNoise);
                                vec3 openWaterFoamResult = u_openWaterFoamColor * openWaterFoamAmount * u_openWaterFoamIntensity;
                                
                                vec3 sheenResult = vec3(0.0);
                                if (u_sheenEnabled) {
                                    vec2 sheen_wave_distortion = wave_uv_offset * u_sheenScale * 10.0;
                                    vec2 sheenUV = (final_distorted_world_coord * u_sheenScale * 0.01) + sheen_wave_distortion;
                                    sheenUV.x *= u_sheenStretch;
                                    sheenUV.y += u_time * u_sheenSpeed * 0.1;
                                    float sheenNoise = snoise(vec3(sheenUV, u_time * 0.01));
                                    sheenNoise = pow(smoothstep(0.8, 1.0, sheenNoise), u_sheenSharpness);
                                    sheenResult = u_sheenColor * sheenNoise * u_sheenIntensity;
                                }
                                finalColor += (openWaterFoamResult + sheenResult) * waterMaskValue;
                            }
            
                            if (u_shoreline_enabled) {
                                float shorelineMaskValue = u_useShorelineMask ? texture2D(u_shorelineMask, vTextureCoord).r : clamp((texture2D(u_blurredWaterMask, vTextureCoord).r - waterMaskValue) * 5.0, 0.0, 1.0);
                                
                                vec2 shore_foam_wave_distortion = wave_uv_offset * u_shorelinePatternScale * 10.0;
                                vec2 final_foam_uv = (final_distorted_world_coord * u_shorelinePatternScale * 0.01) + shore_foam_wave_distortion;

                                final_foam_uv.x += u_time * u_shorelinePatternSpeed;
                                float foam_time = u_time * u_shorelinePatternEvolution;
                                float foam_noise = fbm(vec3(final_foam_uv, foam_time), u_shorelinePatternOctaves, u_shorelinePatternLacunarity, u_shorelinePatternPersistence);
                                foam_noise = (foam_noise - 0.5 + u_shorelinePatternBrightness) * u_shorelinePatternContrast + 0.5;
                                float final_foam_amount = clamp(foam_noise, 0.0, 1.0) * shorelineMaskValue;
            
                                if (u_outputShorelineFoamMask) {
                                    float particle_mask_value = (final_foam_amount + u_particleMaskBrightness - 0.5) * u_particleMaskContrast + 0.5;
                                    gl_FragColor = vec4(vec3(clamp(particle_mask_value, 0.0, 1.0)), 1.0);
                                    return;
                                }
                                
                                vec3 shoreline_foam_result = u_shorelineFoamColor * final_foam_amount * u_shorelineFoamIntensity;
                                finalColor += shoreline_foam_result;
                            }
            
                            if (u_outputShorelineFoamMask) {
                                gl_FragColor = vec4(0.0);
                                return;
                            }
            
                            gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), sceneColor.a);
                        }
                    `;

        super(vertexSrc, fragmentSrc, {
            ...options,
            u_displacementMap: options.u_displacementMap ?? PIXI.Texture.EMPTY,
            u_waterMask: options.u_waterMask ?? PIXI.Texture.EMPTY,
            u_shorelineMask: options.u_shorelineMask ?? PIXI.Texture.EMPTY,
            u_blurredWaterMask: options.u_blurredWaterMask ?? PIXI.Texture.EMPTY,
            u_outputShorelineFoamMask: false,

            u_causticsLineSharpness: 20.0,
            u_causticsBloomIntensity: 0.3,
            u_causticsLineDistortion: 0.3,
            u_causticsLineDistortionScale: 1.5,
            u_causticsIntersectionBoost: 4.0,
            u_causticsRoughnessScale: 5.0,
            u_causticsRoughnessIntensity: 0.4,

            u_shorelinePatternScale: 5.0,
            u_shorelinePatternSpeed: 0.1,
            u_shorelinePatternEvolution: 0.2,
            u_shorelinePatternOctaves: 3,
            u_shorelinePatternLacunarity: 2.0,
            u_shorelinePatternPersistence: 0.5,
            u_shorelinePatternBrightness: 0.5,
            u_shorelinePatternContrast: 1.5,

            u_shorelineDisplacementEnabled: true,
            u_shorelineDisplacementScale: 2.0,
            u_shorelineDisplacementSpeed: 0.05,
            u_shorelineDisplacementStrength: 10.0,

            u_particleMaskBrightness: 0.0,
            u_particleMaskContrast: 5.0,
        });
    }
}

class WaterFXLayer extends MaskedEffectLayer {
    constructor() {
        super({
            maskSuffix: 'water'
        });

        // Water effect properties
        this.waterEffectsFilter = null;
        this.displacementFilter = null;
        this.displacementSprite = null;
        this.displacementTexture = null;
        this.blurFilter = null;
        this.blurSourceSprite = null;
        this.blurredWaterMaskTexture = null;
        this.shorelineMaskContainer = null;
        this.shorelineMaskTexture = null;
        this.shorelineMaskSprites = new Map();
        this._needsShorelineMaskUpdate = true;
        this.time = 0;

        // Particle mask generation properties
        this.particleMaskGeneratorSprite = null;
        this.shorelineParticleMaskTexture = null;
    }

    static getSettingsHTML() {
        return DebuggerUIBuilder._createAccordionHTML('water', 'Water Effects', `
                        ${DebuggerUIBuilder._createTextureInputHTML('water', 'Water Mask (_Water)')}
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
                        <details id="details-water-shoreline">
                            <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.enabled', 'Shoreline Foam', true)}</div></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createTextureInputHTML('shoreline', 'Shoreline Override (_Shoreline)')}
                                <p class="description-text">Controls foam near land. Best results with a soft-edged, grayscale _Shoreline map.</p>
                                
                                <details><summary><span class="accordion-toggle"></span><strong>Foam Appearance</strong></summary><div style="padding-left:15px;">
                                    ${DebuggerUIBuilder._createColorPickerHTML('water.shoreline.foamColor', 'Foam Color')}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamIntensity', 'Intensity', 0, 5, 0.1)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.detectionBlur', 'Auto-Detection Blur', 1, 32, 1, 'Thickness of the shoreline when auto-detected (no _Shoreline file).')}
                                </div></details>

                                <details id="details-water-shoreline-displacement">
                                    <summary><span class="accordion-toggle"></span>
                                        <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.displacement.enabled', 'Displacement Swirl', true)}</div>
                                    </summary>
                                    <div style="padding-left:15px;">
                                        <p class="description-text">Adds a swirling distortion to the shoreline foam pattern, simulating churning water.</p>
                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.displacement.scale', 'Swirl Scale', 0.1, 10, 0.1, 'The size of the swirling patterns.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.displacement.speed', 'Swirl Speed', 0, 0.2, 0.001, 'How fast the swirls animate.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.displacement.strength', 'Swirl Strength', 0, 0.05, 0.0005, 'How much the foam pattern is distorted by the swirl.')}
                                    </div>
                                </details>
                                
                                <details><summary><span class="accordion-toggle"></span><strong>Foam Pattern (FBM)</strong></summary><div style="padding-left:15px;">
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.scale', 'Scale', 1, 50, 0.5)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.speed', 'Speed', 0, 0.5, 0.01, 'Directional drift speed of the foam.')}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.evolution', 'Evolution', 0, 0.5, 0.01, 'Internal "boiling" speed of the foam.')}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.octaves', 'Complexity (Octaves)', 1, 8, 1)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.lacunarity', 'Detail Scale', 1.5, 4, 0.05)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.persistence', 'Roughness', 0.1, 1, 0.05)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.brightness', 'Brightness', 0, 1, 0.01)}
                                    ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamPattern.contrast', 'Contrast', 0, 5, 0.05)}
                                </div></details>
                                
                                <details id="details-water-shoreline-foam-particles">
                                <summary><span class="accordion-toggle"></span>
                                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.foamParticles.enabled', 'Shoreline Foam Particles', true)}</div>
                                </summary>
                                <div style="padding-left:15px;">
                                    <p class="description-text">Spawns particles on the brightest parts of the animated shoreline foam.</p>
                                    ${DebuggerUIBuilder._createSelectHTML('water.shoreline.foamParticles.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                                    <details>
                                        <summary><span class="accordion-toggle"></span><strong>Particle Mask Processing</strong></summary>
                                        <div style="padding-left: 15px;">
                                            <p class="description-text">Boosts the brightness/contrast of the underlying foam mask to make it suitable for particle spawning.</p>
                                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.particleMaskBrightness', 'Brightness', -1, 1, 0.05)}
                                            ${DebuggerUIBuilder._createSliderHTML('water.shoreline.particleMaskContrast', 'Contrast', 1, 20, 0.1)}
                                        </div>
                                    </details>
                                    <details>
                    <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                    <div style="padding-left: 15px;">
                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.maskInfluence', 'Particle Density', 0.01, 5, 0.01, 'Controls the maximum number of particles.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.frequency', 'Spawn Rate (s)', 0.001, 1, 0.001, 'Time in seconds between particle spawns. Lower is faster.')}
                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.maskThreshold', 'Spawn Threshold', 0, 1, 0.01, 'Foam brightness required to spawn particles.')}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createTextInputHTML('water.shoreline.foamParticles.particleTexture', 'Particle Texture', 'Path to the particle image.')}
                                                <details>
                                                    <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                                                    <div style="padding-left: 15px;">
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.lifetime.min', 'Min Lifetime (s)', 0.1, 20, 0.1)}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.lifetime.max', 'Max Lifetime (s)', 0.1, 20, 0.1)}
                                                    </div>
                                                </details>
                                                <details>
                                                    <summary><span class="accordion-toggle"></span><strong>Color Over Life</strong></summary>
                                                    <div style="padding-left: 15px;">
                                                        <p class="description-text">Sets particle color at birth and death. If colors are the same, a static color is used.</p>
                                                        ${DebuggerUIBuilder._createColorPickerHTML('water.shoreline.foamParticles.color.start', 'Start Color')}
                                                        ${DebuggerUIBuilder._createColorPickerHTML('water.shoreline.foamParticles.color.end', 'End Color')}
                                                    </div>
                                                </details>
                                                <details>
                                                    <summary><span class="accordion-toggle"></span><strong>Alpha / Opacity</strong></summary>
                                                    <div style="padding-left: 15px;">
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.alpha.max', 'Max Alpha', 0, 1, 0.01)}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.alpha.fadeIn', 'FadeIn Time (%)', 0, 0.5, 0.01)}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.alpha.fadeOut', 'FadeOut Time (%)', 0, 0.5, 0.01)}
                                                    </div>
                                                </details>
                                                <details>
                                                    <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                                                    <div style="padding-left: 15px;">
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.sizeMultiplier', 'Global Size', 0.1, 10, 0.1, 'A global multiplier for particle size.')}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.start', 'Start Scale Mult', 0, 2, 0.01, 'Particle size at birth (multiplied by Global Size).')}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.end', 'End Scale Mult', 0, 2, 0.01, 'Particle size at death (multiplied by Global Size).')}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.scale.minMult', 'Random Size Min', 0.1, 1, 0.01, 'Minimum random scale multiplier for each particle (from this value to 1.0).')}
                                                    </div>
                                                </details>
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                                            <div style="padding-left: 15px;">
                                                <details>
                                                    <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                                                    <div style="padding-left: 15px;">
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.speed.start', 'Start Speed', -50, 50, 1)}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.speed.end', 'End Speed', -50, 50, 1)}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.speed.minMult', 'Random Speed Min', 0.1, 1, 0.01, 'Minimum random speed multiplier for each particle (from this value to 1.0).')}
                                                    </div>
                                                </details>
                                                <details>
                                                    <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.shoreline.foamParticles.rotation.enabled', 'Tumbling / Rotation', true)}</div></summary>
                                                    <div style="padding-left: 15px;">
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.rotation.minSpeed', 'Min Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.rotation.maxSpeed', 'Max Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                                        ${DebuggerUIBuilder._createSliderHTML('water.shoreline.foamParticles.rotation.accel', 'Rot. Accel.', -90, 90, 1, 'Degrees per second squared.')}
                                                    </div>
                                                </details>
                                            </div>
                                        </details>
                                    </div>
                                </details>
                            </div>
                        </details>
                        <details id="details-water-glint-particles">
                            <summary><span class="accordion-toggle"></span>
                                <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.glintParticles.enabled', 'Water Glints / Spray', true)}</div>
                            </summary>
                            <div style="padding-left:15px;">
                                <p class="description-text">General-purpose particles spawned across the entire water surface.</p>
                                ${DebuggerUIBuilder._createSelectHTML('water.glintParticles.blendMode', 'Blend Mode', BLEND_MODE_OPTIONS)}
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Spawning & Density</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.maskInfluence', 'Particle Density', 0.01, 5, 0.01, 'Controls the maximum number of particles.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.frequency', 'Spawn Rate (s)', 0.001, 1, 0.001, 'Time in seconds between particle spawns. Lower is faster.')}
                                        ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.maskThreshold', 'Spawn Threshold', 0, 1, 0.01, 'Water mask brightness required to spawn particles.')}
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Particle Appearance</strong></summary>
                                    <div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createTextInputHTML('water.glintParticles.particleTexture', 'Particle Texture', 'Path to the particle image.')}
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Lifetime</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.lifetime.min', 'Min Lifetime (s)', 0.1, 20, 0.1)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.lifetime.max', 'Max Lifetime (s)', 0.1, 20, 0.1)}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Color Over Life</strong></summary>
                                            <div style="padding-left: 15px;">
                                                <p class="description-text">Sets particle color at birth and death. If colors are the same, a static color is used.</p>
                                                ${DebuggerUIBuilder._createColorPickerHTML('water.glintParticles.color.start', 'Start Color')}
                                                ${DebuggerUIBuilder._createColorPickerHTML('water.glintParticles.color.end', 'End Color')}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Alpha / Opacity</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.alpha.max', 'Max Alpha', 0, 1, 0.01)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.alpha.fadeIn', 'FadeIn Time (%)', 0, 0.5, 0.01)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.alpha.fadeOut', 'FadeOut Time (%)', 0, 0.5, 0.01)}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Scale / Size</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.sizeMultiplier', 'Global Size', 0.1, 10, 0.1, 'A global multiplier for particle size.')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.start', 'Start Scale Mult', 0, 2, 0.01, 'Particle size at birth (multiplied by Global Size).')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.end', 'End Scale Mult', 0, 2, 0.01, 'Particle size at death (multiplied by Global Size).')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.scale.minMult', 'Random Size Min', 0.1, 1, 0.01, 'Minimum random scale multiplier for each particle (from this value to 1.0).')}
                                            </div>
                                        </details>
                                    </div>
                                </details>
                                <details>
                                    <summary><span class="accordion-toggle"></span><strong>Movement</strong></summary>
                                    <div style="padding-left: 15px;">
                                        <details>
                                            <summary><span class="accordion-toggle"></span><strong>Speed</strong></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.speed.start', 'Start Speed', -50, 50, 1)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.speed.end', 'End Speed', -50, 50, 1)}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.speed.minMult', 'Random Speed Min', 0.1, 1, 0.01, 'Minimum random speed multiplier for each particle (from this value to 1.0).')}
                                            </div>
                                        </details>
                                        <details>
                                            <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML('water.glintParticles.rotation.enabled', 'Tumbling / Rotation', true)}</div></summary>
                                            <div style="padding-left: 15px;">
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.rotation.minSpeed', 'Min Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.rotation.maxSpeed', 'Max Rot. Speed', -180, 180, 1, 'Degrees per second.')}
                                                ${DebuggerUIBuilder._createSliderHTML('water.glintParticles.rotation.accel', 'Rot. Accel.', -90, 90, 1, 'Degrees per second squared.')}
                                            </div>
                                        </details>
                                    </div>
                                </details>
                            </div>
                        </details>
                    `);
    }

    async _draw(options) {
        await super._draw(options);
        this.time = 0;
        this._needsShorelineMaskUpdate = true;
        const renderer = canvas.app.renderer;

        // --- Main Water Filter ---
        try {
            this.waterEffectsFilter = new WaterEffectsFilter();
            canvas.primary.filters = [...(canvas.primary.filters || []), this.waterEffectsFilter];
            systemStatus.update('shaders', 'water', {
                state: 'ok',
                message: 'Compiled successfully.'
            });
        } catch (e) {
            console.error("MapShine | Failed to compile WaterEffectsFilter", e);
            systemStatus.update('shaders', 'water', {
                state: 'error',
                message: `Compilation failed: ${e.message}`
            });
        }

        // --- Shared Resources ---
        this.displacementFilter = new WaveDisplacementFilter();
        this.displacementSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.displacementSprite.width = renderer.screen.width;
        this.displacementSprite.height = renderer.screen.height;
        this.displacementSprite.filters = [this.displacementFilter];
        this.displacementTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        const initialBlur = game.mapShine.profileManager.activeConfig.water.shoreline.detectionBlur;
        this.blurFilter = new PIXI.BlurFilter(initialBlur, 4);
        this.blurredWaterMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });
        this.blurSourceSprite = new PIXI.Sprite(this.getMaskTexture());
        this.blurSourceSprite.filters = [this.blurFilter];
        this.shorelineMaskContainer = new PIXI.Container();
        this.shorelineMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        // --- Particle Mask Generation System ---
        const particleMaskFilter = new WaterEffectsFilter();
        this.particleMaskGeneratorSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.particleMaskGeneratorSprite.width = renderer.screen.width;
        this.particleMaskGeneratorSprite.height = renderer.screen.height;
        this.particleMaskGeneratorSprite.filters = [particleMaskFilter];
        this.shorelineParticleMaskTexture = PIXI.RenderTexture.create({
            width: renderer.screen.width,
            height: renderer.screen.height
        });

        this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }

    _updateWaterFilterUniforms(filter, wConfig) {
        if (!filter) return;
        const u = filter.uniforms;

        u.u_wave_enabled = wConfig.wave.enabled;
        u.u_wave_intensity = wConfig.wave.intensity;
        const srfConfig = wConfig.surface;
        u.u_surface_enabled = srfConfig.enabled;
        u.u_openWaterFoamColor = hexToRgbArray(srfConfig.foamColor);
        u.u_openWaterFoamIntensity = srfConfig.foamIntensity;
        u.u_openWaterFoamCoverage = srfConfig.foamCoverage;
        u.u_openWaterFoamSharpness = srfConfig.foamSharpness;
        u.u_openWaterFbmScale = srfConfig.fbmScale;
        u.u_openWaterFbmSpeed = srfConfig.fbmSpeed;
        u.u_openWaterFbmEvolution = srfConfig.fbmEvolution;
        u.u_openWaterFbmOctaves = srfConfig.fbmOctaves;
        u.u_openWaterFbmLacunarity = srfConfig.fbmLacunarity;
        u.u_openWaterFbmPersistence = srfConfig.fbmPersistence;
        u.u_sheenEnabled = srfConfig.sheenEnabled;
        u.u_sheenColor = hexToRgbArray(srfConfig.sheenColor);
        u.u_sheenIntensity = srfConfig.sheenIntensity;
        u.u_sheenScale = srfConfig.sheenScale;
        u.u_sheenSpeed = srfConfig.sheenSpeed;
        u.u_sheenStretch = srfConfig.sheenStretch;
        u.u_sheenSharpness = srfConfig.sheenSharpness;
        const cConfig = wConfig.caustics;
        u.u_caustics_enabled = cConfig.enabled;
        u.u_causticsColor = hexToRgbArray(cConfig.color);
        u.u_causticsIntensity = cConfig.intensity;
        u.u_causticsScale = cConfig.scale;
        u.u_causticsSpeed = cConfig.speed;
        u.u_causticsLineSharpness = cConfig.lineSharpness;
        u.u_causticsBloomIntensity = cConfig.bloomIntensity;
        u.u_causticsLineDistortion = cConfig.lineDistortion;
        u.u_causticsLineDistortionScale = cConfig.lineDistortionScale;
        u.u_causticsIntersectionBoost = cConfig.intersectionBoost;
        u.u_causticsRoughnessScale = cConfig.roughnessScale;
        u.u_causticsRoughnessIntensity = cConfig.roughnessIntensity;
        const shConfig = wConfig.shoreline;
        u.u_shoreline_enabled = shConfig.enabled;
        u.u_shorelineFoamColor = hexToRgbArray(shConfig.foamColor);
        u.u_shorelineFoamIntensity = shConfig.foamIntensity;
        const dispConfig = shConfig.displacement;
        if (dispConfig) {
            u.u_shorelineDisplacementEnabled = dispConfig.enabled;
            u.u_shorelineDisplacementScale = dispConfig.scale;
            u.u_shorelineDisplacementSpeed = dispConfig.speed;
            u.u_shorelineDisplacementStrength = dispConfig.strength;
        }
        const foamPatternConfig = shConfig.foamPattern;
        u.u_shorelinePatternScale = foamPatternConfig.scale;
        u.u_shorelinePatternSpeed = foamPatternConfig.speed;
        u.u_shorelinePatternEvolution = foamPatternConfig.evolution;
        u.u_shorelinePatternOctaves = foamPatternConfig.octaves;
        u.u_shorelinePatternLacunarity = foamPatternConfig.lacunarity;
        u.u_shorelinePatternPersistence = foamPatternConfig.persistence;
        u.u_shorelinePatternBrightness = foamPatternConfig.brightness;
        u.u_shorelinePatternContrast = foamPatternConfig.contrast;
        u.u_particleMaskBrightness = shConfig.particleMaskBrightness;
        u.u_particleMaskContrast = shConfig.particleMaskContrast;
    }

    updateFromConfig(config) {
        const wConfig = config.water;
        this.visible = config.enabled && wConfig.enabled;

        // Update own filters
        if (this.displacementFilter) {
            this.displacementFilter.uniforms.u_speed = wConfig.wave.speed;
            this.displacementFilter.uniforms.u_scale = wConfig.wave.scale;
        }
        if (this.blurFilter) {
            this.blurFilter.blur = wConfig.shoreline.detectionBlur;
        }

        // Update the main WaterEffectsFilter and the particle mask generator filter
        this._updateWaterFilterUniforms(this.waterEffectsFilter, wConfig);
        this._updateWaterFilterUniforms(this.particleMaskGeneratorSprite?.filters[0], wConfig);
    }

    _onPan() {
        super._onPan();
        this._needsShorelineMaskUpdate = true;
    }

    _onResize() {
        super._onResize();
        const renderer = canvas.app.renderer;
        this.displacementTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.blurredWaterMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.shorelineMaskTexture?.resize(renderer.screen.width, renderer.screen.height);
        this.shorelineParticleMaskTexture?.resize(renderer.screen.width, renderer.screen.height);

        if (this.displacementSprite) this.displacementSprite.width = renderer.screen.width;
        if (this.particleMaskGeneratorSprite) this.particleMaskGeneratorSprite.width = renderer.screen.height;

        this._needsShorelineMaskUpdate = true;
    }

    _onAnimate(deltaTime) {
        super._onAnimate(deltaTime);
        const waterEffectsFilter = this.waterEffectsFilter;
        if (this._destroyed || !waterEffectsFilter) return;

        const hasActiveMasks = this.maskSprites.size > 0 && Array.from(this.maskSprites.values()).some(s => s.texture.valid);
        waterEffectsFilter.enabled = this.visible && hasActiveMasks;

        if (!waterEffectsFilter.enabled) return;

        const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
        this.time += deltaTime * timeFactor;
        const renderer = canvas.app.renderer;
        const stage = canvas.stage;
        const screen = renderer.screen;
        const topLeft = stage.toLocal({
            x: 0,
            y: 0
        });
        const viewSize = [screen.width / stage.scale.x, screen.height / stage.scale.y];

        renderer.render(this.displacementSprite, {
            renderTexture: this.displacementTexture,
            clear: true
        });
        if (this._needsShorelineMaskUpdate) {
            renderer.render(this.shorelineMaskContainer, {
                renderTexture: this.shorelineMaskTexture,
                transform: canvas.stage.transform.worldTransform,
                clear: true
            });
            this._needsShorelineMaskUpdate = false;
        }
        this.blurSourceSprite.texture = this.getMaskTexture();
        renderer.render(this.blurSourceSprite, {
            renderTexture: this.blurredWaterMaskTexture,
            clear: true
        });

        const useShorelineMask = this.shorelineMaskSprites.size > 0;
        this.displacementFilter.uniforms.u_time = this.time;

        const u = waterEffectsFilter.uniforms;
        u.u_time = this.time;
        u.u_displacementMap = this.displacementTexture;
        u.u_waterMask = this.getMaskTexture();
        u.u_shorelineMask = this.shorelineMaskTexture;
        u.u_blurredWaterMask = this.blurredWaterMaskTexture;
        u.u_useShorelineMask = useShorelineMask;
        u.u_camera_offset = [topLeft.x, topLeft.y];
        u.u_view_size = viewSize;

        const foamController = game.mapShine.particleManager?.controllers.get('foam');
        const foamParticlesEnabled = game.mapShine.profileManager.activeConfig.water.shoreline.foamParticles.enabled;

        if (foamController && foamParticlesEnabled) {
            const particleMaskFilter = this.particleMaskGeneratorSprite.filters[0];

            // We need to sync the live textures to the particle mask generator as well.
            const p_u = particleMaskFilter.uniforms;
            p_u.u_time = this.time;
            p_u.u_displacementMap = this.displacementTexture;
            p_u.u_waterMask = this.getMaskTexture();
            p_u.u_shorelineMask = this.shorelineMaskTexture;
            p_u.u_blurredWaterMask = this.blurredWaterMaskTexture;
            p_u.u_useShorelineMask = useShorelineMask;
            p_u.u_camera_offset = [topLeft.x, topLeft.y];
            p_u.u_view_size = viewSize;

            // Now generate the mask
            p_u.u_outputShorelineFoamMask = true;
            renderer.render(this.particleMaskGeneratorSprite, {
                renderTexture: this.shorelineParticleMaskTexture,
                clear: true
            });
            p_u.u_outputShorelineFoamMask = false;

            // Find the foam particle controller and update its dynamic texture mask
            const foamEmitter = game.mapShine.particleManager?.controllers?.get('foam')?.emitters?.values()?.next()?.value;
            if (foamEmitter) {
                const shape = foamEmitter.behaviors.find(b => b.type === 'spawnShape')?.shape;
                if (shape instanceof TextureMaskShape) {
                    shape.updateTexture(this.shorelineParticleMaskTexture);
                }
            }
        }
    }

    async updateEffectTargets(targets) {
        await super.updateEffectTargets(targets);
        if (!this.shorelineMaskContainer) return;

        const validShorelineIds = new Set();
        const allTargets = new Map([
            ['background', targets.background], ...targets.tiles.entries()
        ]);

        for (const [id, targetData] of allTargets.entries()) {
            if (targetData?.shoreline) {
                validShorelineIds.add(id);
                let sprite = this.shorelineMaskSprites.get(id);
                if (!sprite) {
                    sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
                    this.shorelineMaskSprites.set(id, sprite);
                    this.shorelineMaskContainer.addChild(sprite);
                }
                await this._updateSpriteTransform(sprite, targetData.shoreline, targetData.rect);
            }
        }

        for (const [id, sprite] of this.shorelineMaskSprites.entries()) {
            if (!validShorelineIds.has(id)) {
                sprite.destroy();
                this.shorelineMaskSprites.delete(id);
            }
        }
        this._needsShorelineMaskUpdate = true;
    }

    async _tearDown(options) {
        if (this.waterEffectsFilter) {
            canvas.primary.filters = (canvas.primary.filters || []).filter(f => f !== this.waterEffectsFilter);
            this.waterEffectsFilter.destroy();
            this.waterEffectsFilter = null;
        }

        this.displacementFilter?.destroy();
        this.displacementSprite?.destroy();
        this.displacementTexture?.destroy(true);
        this.blurFilter?.destroy();
        this.blurSourceSprite?.destroy();
        this.blurredWaterMaskTexture?.destroy(true);
        this.shorelineMaskContainer?.destroy({
            children: true,
            texture: true,
            baseTexture: true
        });
        this.shorelineMaskTexture?.destroy(true);
        this.shorelineMaskSprites.clear();

        this.particleMaskGeneratorSprite?.filters[0]?.destroy();
        this.particleMaskGeneratorSprite?.destroy();
        this.shorelineParticleMaskTexture?.destroy(true);

        this.displacementFilter = null;
        this.displacementSprite = null;
        this.displacementTexture = null;
        this.blurFilter = null;
        this.blurSourceSprite = null;
        this.blurredWaterMaskTexture = null;
        this.shorelineMaskContainer = null;
        this.shorelineMaskTexture = null;
        this.particleMaskGeneratorSprite = null;
        this.shorelineParticleMaskTexture = null;

        await super._tearDown(options);
    }
}

class WaveDisplacementFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentSrc = `
                        precision mediump float;
                        varying vec2 vTextureCoord;
            
                        uniform float u_time;
                        uniform float u_speed;
                        uniform float u_scale;
            
                        //
                        // Description : Array and textureless GLSL 3D simplex noise function.
                        //      Author : Ian McEwan, Ashima Arts.
                        //  Maintainer : ijm
                        //     Lastmod : 20110822 (ijm)
                        //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
                        //               Distributed under the MIT License. See LICENSE file.
                        //               https://github.com/ashima/webgl-noise
                        //
                        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
                        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
            
                        float snoise(vec3 v) {
                            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            
                            // First corner
                            vec3 i  = floor(v + dot(v, C.yyy) );
                            vec3 x0 =   v - i + dot(i, C.xxx) ;
            
                            // Other corners
                            vec3 g = step(x0.yzx, x0.xyz);
                            vec3 l = 1.0 - g;
                            vec3 i1 = min( g.xyz, l.zxy );
                            vec3 i2 = max( g.xyz, l.zxy );
            
                            vec3 x1 = x0 - i1 + C.xxx;
                            vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
                            vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
            
                            // Permutations
                            i = mod(i, 289.0);
                            vec4 p = permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                                + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                                + i.x + vec4(0.0, i1.x, i2.x, 1.0 );
            
                            // Gradients: 7x7 points over a square, mapped onto an octahedron.
                            // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
                            float n_ = 0.142857142857; // 1.0/7.0
                            vec3  ns = n_ * D.wyz - D.xzx;
            
                            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
            
                            vec4 x_ = floor(j * ns.z);
                            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
            
                            vec4 x = x_ *ns.x + ns.yyyy;
                            vec4 y = y_ *ns.x + ns.yyyy;
                            vec4 h = 1.0 - abs(x) - abs(y);
            
                            vec4 b0 = vec4( x.xy, y.xy );
                            vec4 b1 = vec4( x.zw, y.zw );
            
                            vec4 s0 = floor(b0)*2.0 + 1.0;
                            vec4 s1 = floor(b1)*2.0 + 1.0;
                            vec4 sh = -step(h, vec4(0.0));
            
                            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
            
                            vec3 p0 = vec3(a0.xy,h.x);
                            vec3 p1 = vec3(a0.zw,h.y);
                            vec3 p2 = vec3(a1.xy,h.z);
                            vec3 p3 = vec3(a1.zw,h.w);
            
                            // Normalise gradients
                            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                            p0 *= norm.x;
                            p1 *= norm.y;
                            p2 *= norm.z;
                            p3 *= norm.w;
            
                            // Mix final noise value
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
            
                            // Combine noises for a more complex pattern
                            vec2 displacement = vec2(noise1_x + noise2_x, noise1_y + noise2_y) * 0.5;
            
                            // Output the displacement vector in the R and G channels, normalized to 0-1 range
                            gl_FragColor = vec4(displacement * 0.5 + 0.5, 0.0, 1.0);
                        }
                    `;
        super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
            u_time: 0.0,
            u_speed: options.speed ?? 0.05,
            u_scale: options.scale ?? 4.0,
        });
    }
}

// =================================================================================
// SECTION 6: USER INTERFACE & SETTINGS MANAGEMENT
// =================================================================================
// Description: Classes for the loading screen, debugger UI, profile management,
//              and client-side settings overrides.
// ---------------------------------------------------------------------------------

class LoadingScreen {
    constructor() {
        this.element = null;
        this.fadeOutDuration = 500;
        this.minDisplayTime = 1500;
        this.startTime = 0;
        this.fillElement = null;
        this.statusTextElement = null;
        this.statusFadeDuration = 200; // Faster text fade
    }

    show() {
        if (this.element) return;
        this.startTime = Date.now();

        this.element = document.createElement('div');
        this.element.id = 'map-shine-loading-screen';
        this.element.style.opacity = '0';

        this.element.innerHTML = `
                        <div class="loading-content">
                            <img src="modules/map-shine/assets/fvtt.png" class="loading-logo" alt="Foundry VTT Logo">
                            <h2 class="loading-subhead">Mythica Machina Presents...</h2>
                            <h1 class="loading-title">Map Shine</h1>
                            <div class="loading-bar-container">
                                <div class="loading-bar-fill"></div>
                            </div>
                            <div id="loading-status-text" class="loading-status"></div>
                        </div>
                        <style>
                            #map-shine-loading-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 1); z-index: 100000; display: flex; justify-content: center; align-items: center; color: white; font-family: Signika, sans-serif; transition: opacity ${this.fadeOutDuration / 1000}s ease-in-out; }
                            .loading-content { text-align: center; }
                            .loading-logo { width: 150px; height: auto; margin: 0 auto 10px auto; display: block; filter: drop-shadow(0 0 10px rgba(0,0,0,0.6)); }
                            .loading-subhead { font-size: 24px; font-weight: normal; color: #bbb; margin: 0 0 10px 0; text-shadow: 0 0 5px #111; }
                            .loading-title { font-size: 72px; margin: 0 0 30px 0; text-shadow: 0 0 10px #222; }
                            .loading-bar-container { width: 400px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.5); margin: 0 auto; background-color: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; }
                            .loading-bar-fill { width: 0%; height: 100%; background-color: rgba(255, 255, 255, 0.9); transform-origin: left; transition: width 0.2s ease-out; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
                            .loading-status { margin-top: 15px; font-size: 16px; color: #ddd; height: 20px; line-height: 20px; opacity: 0; transition: opacity ${this.statusFadeDuration / 1000}s ease-in-out; }
                        </style>
                    `;

        document.body.appendChild(this.element);
        this.fillElement = this.element.querySelector('.loading-bar-fill');
        this.statusTextElement = this.element.querySelector('#loading-status-text');

        this.statusTextElement.innerText = "Initializing...";
        this.statusTextElement.style.opacity = '1';

        // Force a reflow before applying the final opacity to ensure the transition plays.
        void this.element.offsetHeight;
        this.element.style.opacity = '1';
    }

    setProgress(progress, message) {
        if (!this.fillElement) return;
        const p = Math.min(100, Math.max(0, progress));
        this.fillElement.style.width = `${p}%`;

        if (message && this.statusTextElement && this.statusTextElement.innerText !== message) {
            // Fade out, change text, then fade in for a smooth transition.
            this.statusTextElement.style.opacity = '0';
            setTimeout(() => {
                if (this.statusTextElement) {
                    this.statusTextElement.innerText = message;
                    this.statusTextElement.style.opacity = '1';
                }
            }, this.statusFadeDuration);
        }
    }

    async hide() {
        if (!this.element) return;

        // Ensure we wait for the minimum display time before starting the fade out.
        const elapsed = Date.now() - this.startTime;
        const remainingTime = Math.max(0, this.minDisplayTime - elapsed);
        await new Promise(resolve => setTimeout(resolve, remainingTime));

        if (this.element) {
            this.element.style.opacity = '0';
            // Wait for the fade-out transition to complete before removing the element.
            await new Promise(resolve => setTimeout(resolve, this.fadeOutDuration + 50));
        }

        this.element?.remove();
        this.element = null;
        this.fillElement = null;
        this.statusTextElement = null;
    }
}

const CLIENT_OVERRIDES_CONFIG = {
    baseShine: {
        name: "Metallic Shine",
        path: 'baseShine',
        intensitySubPath: 'animation.globalIntensity'
    },

    cloudShadows: {
        name: "Cloud Shadows",
        path: 'cloudShadows',
        intensitySubPath: 'shadowIntensity'
    },
    canopy: {
        name: "Canopy Shadows",
        path: 'canopy',
        intensitySubPath: 'shadowIntensity'
    },
    structuralShadows: {
        name: "Structural Shadows",
        path: 'structuralShadows',
        intensitySubPath: 'shadowIntensity'
    },
    iridescence: {
        name: "Iridescence",
        path: 'iridescence',
        intensitySubPath: 'intensity'
    },
    ambient: {
        name: "Ambient / Emissive",
        path: 'ambient',
        intensitySubPath: 'intensity'
    },
    groundGlow: {
        name: "Glow in the Dark",
        path: 'groundGlow',
        intensitySubPath: 'intensity'
    },
    heatDistortion: {
        name: "Heat Distortion",
        path: 'heatDistortion',
        intensitySubPath: 'intensity'
    },
    prism: {
        name: "Prism",
        path: 'prism',
        intensitySubPath: 'intensity'
    },
    advancedBloom: {
        name: "Global Bloom",
        path: 'advancedBloom',
        intensitySubPath: 'brightness'
    },
    vignette: {
        name: "Post: Vignette",
        path: 'postProcessing.vignette',
        intensitySubPath: 'amount'
    },
    chromaticAberration: {
        name: "Post: Chromatic Aberration",
        path: 'postProcessing.chromaticAberration',
        intensitySubPath: 'amount'
    },
    postProcessing: {
        name: "Post Processing (Group)",
        path: 'postProcessing'
    },
    dust: {
        name: "Dust Motes",
        path: 'dust',
        intensitySubPath: 'maskInfluence'
    },
    glint: {
        name: "Glint Particles",
        path: 'glint',
        intensitySubPath: 'maskInfluence'
    }
};

class ClientOverrides {
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

        // New global accessibility overrides
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
            profileSource: 'none' // To track if the profile is from the scene, world, or module defaults
        };
        this._worldProfiles = {};
        this._defaultProfileName = '';
    }

    /**
     * Resets the manager to its initial state, clearing all scene-specific data.
     * This is crucial for preventing data leakage between scene transitions.
     */
    reset() {
        console.log("Map Shine | ProfileManager reset.");
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
    }

    get isGm() {
        return game.user?.isGM;
    }

    /**
     * Sanitizes a settings object by comparing it against a template (the defaults).
     * It removes keys from the settings object if:
     * 1. The key no longer exists in the template.
     * 2. The type is mismatched (e.g., template has an object, but setting has a primitive).
     * This prevents errors when new versions of the module change setting structures.
     * @param {object} template - The canonical object structure (e.g., MODULE_DEFAULTS).
     * @param {object} settings - The object to clean (e.g., _userOverrides or a scene profile).
     */
    _reconcileOverrides(template, settings) {
        for (const key in settings) {
            // If the key doesn't even exist in the new defaults, it's from a removed feature. Delete it.
            if (!(key in template)) {
                delete settings[key];
                continue;
            }

            const templateValue = template[key];
            const settingValue = settings[key];

            const isTemplateObject = typeof templateValue === 'object' && templateValue !== null && !Array.isArray(templateValue);
            const isSettingObject = typeof settingValue === 'object' && settingValue !== null && !Array.isArray(settingValue);

            // If the default is an object (e.g., size: {start, end}) but the saved setting
            // is a primitive (e.g., size: 1.0), we must delete the primitive.
            if (isTemplateObject && !isSettingObject) {
                delete settings[key];
                continue;
            }

            // If both are objects, we need to check their children recursively.
            if (isTemplateObject && isSettingObject) {
                this._reconcileOverrides(templateValue, settingValue);
                // After reconciling, if the override object has become empty, remove it too.
                if (Object.keys(settingValue).length === 0) {
                    delete settings[key];
                }
            }
        }
        return settings;
    }

    initializeForScene() {
        this.activeSceneId = canvas.scene?.id;
        if (!this.activeSceneId) {
            console.error("MapShine | Could not initialize ProfileManager for scene: No active scene.");
            this.activeConfig = this._getEffectiveConfig();
            return;
        }

        this._worldProfiles = game.settings.get(this.moduleId, PROFILES_SETTING) || {};
        this._defaultProfileName = game.settings.get(this.moduleId, DEFAULT_PROFILE_SETTING) || '';

        this.status.profileSource = 'none'; // Reset the source for the new scene

        let rawSceneProfile = canvas.scene?.getFlag(this.moduleId, 'profile') || null;

        // Determine the source of the profile data
        if (rawSceneProfile) {
            this.status.profileSource = 'scene';
        } else if (this._defaultProfileName && this._worldProfiles[this._defaultProfileName]) {
            console.log(`Map Shine | No scene profile found. Applying world default profile: "${this._defaultProfileName}"`);
            const defaultConfigData = this._worldProfiles[this._defaultProfileName].config;
            if (defaultConfigData) {
                rawSceneProfile = foundry.utils.deepClone(defaultConfigData);
                this.status.profileSource = 'world'; // Mark that we're using the world default
            }
        }

        if (rawSceneProfile) {
            // Sanitize the loaded scene profile against the latest defaults to remove outdated settings.
            this._sceneProfile = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawSceneProfile);
        } else {
            this._sceneProfile = null;
        }

        this.status.sceneProfileLoaded = !!this._sceneProfile;

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        let rawUserOverrides = allUserOverrides[this.activeSceneId] || {};

        // Sanitize the loaded user overrides against the latest defaults.
        this._userOverrides = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), rawUserOverrides);

        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);

        this.activeConfig = this._getEffectiveConfig();
        console.log("Map Shine | Live configuration has been built and set for the current scene.");
    }

    async initializeUI(ui) {
        this.ui = ui;
        if (this.ui?.eventHandler) {
            await this.ui.eventHandler._populateProfilesDropdown();
        }
        this.updateUIState();
    }

    /**
     * Constructs the final configuration by layering defaults, scene profiles, and user overrides.
     */
    _getEffectiveConfig() {
        // Start with a clean copy of the module's hardcoded defaults.
        let baseConfig = foundry.utils.deepClone(MODULE_DEFAULTS);

        // Layer 1: The scene's saved profile.
        if (this._sceneProfile) {
            this._customMerge(baseConfig, this._sceneProfile);
        }

        // Create a config that includes user overrides to determine the 'worldBasedOnly' flag
        let finalConfig = foundry.utils.deepClone(baseConfig);
        if (this._userOverrides) {
            this._customMerge(finalConfig, this._userOverrides);
        }

        // --- NEW LOGIC for World-Based Overrides ---
        const worldDefaultProfileName = this._defaultProfileName;
        const worldDefaultProfile = this._worldProfiles[worldDefaultProfileName]?.config;

        if (worldDefaultProfile) {
            const effectsToCheck = Object.keys(MODULE_DEFAULTS).filter(k =>
                typeof MODULE_DEFAULTS[k] === 'object' &&
                MODULE_DEFAULTS[k] !== null &&
                !Array.isArray(MODULE_DEFAULTS[k]) &&
                foundry.utils.hasProperty(MODULE_DEFAULTS[k], 'worldBasedOnly')
            );

            for (const effectKey of effectsToCheck) {
                if (finalConfig[effectKey]?.worldBasedOnly && worldDefaultProfile[effectKey]) {
                    console.log(`Map Shine | Applying world-based settings for '${effectKey}'.`);
                    // 1. Start with fresh defaults for this effect section
                    let worldBasedEffectConfig = foundry.utils.deepClone(MODULE_DEFAULTS[effectKey]);
                    // 2. Merge the world profile settings onto the defaults
                    this._customMerge(worldBasedEffectConfig, worldDefaultProfile[effectKey]);
                    // 3. Re-apply any user overrides on top of the world settings
                    if (this._userOverrides && this._userOverrides[effectKey]) {
                        this._customMerge(worldBasedEffectConfig, this._userOverrides[effectKey]);
                    }
                    // 4. Ensure the worldBasedOnly flag remains true
                    worldBasedEffectConfig.worldBasedOnly = true;
                    // 5. Replace the entire effect section in the final config
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
            const sourceValue = source[key];
            const targetValue = target[key];

            // If the source value is an array, we replace the target array completely.
            // This is crucial for lists like randomHints to handle removals correctly.
            if (Array.isArray(sourceValue)) {
                target[key] = foundry.utils.deepClone(sourceValue);
                continue;
            }

            // If the source has an object, recurse into it.
            if (typeof sourceValue === 'object' && sourceValue !== null) {
                if (typeof targetValue !== 'object' || targetValue === null || Array.isArray(targetValue)) {
                    target[key] = {};
                }
                this._customMerge(target[key], sourceValue);
            }
            // Handle primitives.
            else {
                // Only assign if the target is not an object, preventing outdated primitives
                // from overwriting newer object structures.
                if (typeof targetValue !== 'object' || targetValue === null) {
                    target[key] = sourceValue;
                }
            }
        }
    }

    async recordUserChange(path, value) {
        foundry.utils.setProperty(this._userOverrides, path, value);

        const allUserOverrides = game.settings.get(this.moduleId, 'user-adjustments') || {};
        allUserOverrides[this.activeSceneId] = this._userOverrides;
        await game.settings.set(this.moduleId, 'user-adjustments', allUserOverrides);

        this.activeConfig = this._getEffectiveConfig();

        this.status.isDirty = !foundry.utils.isEmpty(this._userOverrides);
        this.updateUIState();
    }

    async updateAllSystemsFromConfig(options = {}) {
        if (!canvas?.ready) return;

        const config = this.activeConfig;

        // Synchronize the live time factor with the current configuration.
        game.mapShine.timeControl.timeFactor = config.timeControl.globalTime / 100.0;

        // Update all canvas layers that have the update method
        for (const layer of canvas.layers) {
            if (typeof layer.updateFromConfig === 'function') {
                try {
                    await layer.updateFromConfig(config, options);
                } catch (e) {
                    console.error(`MapShine | Error updating layer ${layer.constructor.name}`, e);
                }
            }
        }

        // Update global screen-space filters
        ScreenEffectsManager.updateAllFiltersFromConfig(config);

        // Update tile opacities which also depend on the config
        if (game.mapShine.effectTargetManager) {
            game.mapShine.effectTargetManager.applyTileOpacities();
        }
    }

    async saveConfigToScene() {
        if (!this.isGm) return;

        const configToSave = this._getEffectiveConfig();
        await canvas.scene.setFlag(this.moduleId, 'profile', configToSave);
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
        let sourceText = "";
        let stateText = "";
        let lightColor = "grey";

        if (this.status.error) {
            lightColor = 'red';
            sourceText = `Error: ${this.status.error}`;
        } else {
            switch (this.status.profileSource) {
                case 'scene':
                    sourceText = "Scene Profile";
                    lightColor = 'green';
                    break;
                case 'world':
                    const defaultName = this.getDefaultProfileName();
                    sourceText = `World Default: ${defaultName}`;
                    lightColor = 'green';
                    break;
                default:
                    sourceText = "Module Defaults";
                    lightColor = 'grey';
                    break;
            }

            if (this.status.isDirty) {
                stateText = "(Modified)";
                lightColor = 'blue';
            } else {
                stateText = "(Active)";
            }
        }

        text.textContent = `${sourceText} ${stateText}`.trim();
        light.classList.add(lightColor);
    }

    async getProfiles() {
        return this._worldProfiles;
    }
    getDefaultProfileName() {
        return this._defaultProfileName;
    }

    async loadProfile(name) {
        const profileData = this._worldProfiles[name];
        if (!profileData) return null;
        let configToLoad = profileData.config || profileData;

        // Sanitize the profile being loaded
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
        if (!this.isGm) return false; // Guard
        if (!name) {
            ui.notifications.warn("Please enter a name for the profile.");
            return false;
        }
        if (this._worldProfiles[name]) {
            const overwrite = await Dialog.confirm({
                title: "Profile Exists",
                content: `<p>A world profile named "<strong>${name}</strong>" already exists. Overwrite it?</p>`,
                defaultYes: false
            });
            if (!overwrite) return false;
        }

        this._worldProfiles[name] = {
            config: foundry.utils.deepClone(config),
            ui: uiState
        };
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        ui.notifications.info(`World Profile "${name}" saved!`);
        return true;
    }

    async updateProfile(name, config, uiState) {
        if (!this.isGm) return false; // Guard
        if (!name || !this._worldProfiles[name]) {
            ui.notifications.warn("Select a valid profile to update.");
            return false;
        }
        this._worldProfiles[name] = {
            config: foundry.utils.deepClone(config),
            ui: uiState
        };
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        ui.notifications.info(`World Profile "${name}" updated.`);
        return true;
    }

    async deleteProfile(name) {
        if (!this.isGm) return false; // Guard
        if (!name || !this._worldProfiles[name]) return false;
        delete this._worldProfiles[name];
        await game.settings.set(this.moduleId, PROFILES_SETTING, this._worldProfiles);
        if (this.getDefaultProfileName() === name) await this.setDefaultProfile("");
        return true;
    }

    async setDefaultProfile(name) {
        if (!this.isGm) return; // Guard
        await game.settings.set(this.moduleId, DEFAULT_PROFILE_SETTING, name);
        this._defaultProfileName = name;
        ui.notifications.info(`"${name}" is now the default profile for new scenes.`);
    }

    _cleanObject(obj) {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            if (value === null || value === undefined) return undefined;
            if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return undefined;
            return value;
        }));
    }

    async copySettingsToClipboard() {
        const configToCopy = this._getEffectiveConfig();
        const configString = JSON.stringify(configToCopy, null, 2);

        try {
            await navigator.clipboard.writeText(configString);
            ui.notifications.info("Current FX settings copied to clipboard.");
        } catch (err) {
            console.error("Map Shine | Failed to copy settings to clipboard:", err);
            console.log("--- MAP SHINE: Current Settings Fallback ---");
            console.log(configString);
            console.log("--- END ---");
            ui.notifications.warn("Could not copy to clipboard. Settings logged to console (F12).");
        }
    }

    async pasteSettingsFromClipboard() {
        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText) {
                ui.notifications.warn("Clipboard is empty.");
                return;
            }

            let pastedConfig;
            try {
                pastedConfig = JSON.parse(clipboardText);
            } catch (err) {
                ui.notifications.error("Clipboard content is not valid JSON.");
                console.error("Map Shine | Clipboard parse error:", err);
                return;
            }

            // A simple validation check to see if it looks like one of our configs.
            if (typeof pastedConfig !== 'object' || pastedConfig === null || !pastedConfig.baseShine) {
                ui.notifications.error("Pasted data does not appear to be a valid Map Shine profile.");
                return;
            }

            const sanitizedConfig = this._reconcileOverrides(foundry.utils.deepClone(MODULE_DEFAULTS), pastedConfig);

            this._userOverrides = sanitizedConfig;

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
            console.error("Map Shine | Clipboard read error:", err);
        }
    }
}

class CurveEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.width = options.width || 256;
        this.height = options.height || 256;
        this.onChange = options.onChange || (() => {});

        // Use a standard "Y-up" coordinate system internally, where y=0 is the bottom.
        this.points = [{
                x: 0,
                y: 0
            },
            {
                x: this.width * 0.25,
                y: this.height * 0.25
            },
            {
                x: this.width * 0.75,
                y: this.height * 0.75
            },
            {
                x: this.width,
                y: this.height
            }
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

        // Create a group for the grid
        const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gridGroup.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
        gridGroup.setAttribute('stroke-width', '0.5');
        this.svg.appendChild(gridGroup);

        // Add grid lines (e.g., every 25%)
        for (let i = 1; i < 4; i++) {
            const pos = this.width * (i / 4);
            // Vertical line
            const vLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            vLine.setAttribute('x1', pos);
            vLine.setAttribute('y1', 0);
            vLine.setAttribute('x2', pos);
            vLine.setAttribute('y2', this.height);
            gridGroup.appendChild(vLine);
            // Horizontal line
            const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            hLine.setAttribute('x1', 0);
            hLine.setAttribute('y1', pos);
            hLine.setAttribute('x2', this.width);
            hLine.setAttribute('y2', pos);
            gridGroup.appendChild(hLine);
        }

        // Add the neutral 1:1 diagonal line
        const neutralLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        neutralLine.setAttribute('x1', 0);
        neutralLine.setAttribute('y1', this.height);
        neutralLine.setAttribute('x2', this.width);
        neutralLine.setAttribute('y2', 0);
        neutralLine.setAttribute('stroke', 'rgba(255,255,255,0.2)');
        neutralLine.setAttribute('stroke-width', '1');
        neutralLine.setAttribute('stroke-dasharray', '4 4');
        this.svg.appendChild(neutralLine);

        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.path.setAttribute('fill', 'none');
        this.path.setAttribute('stroke', '#00aaff');
        this.path.setAttribute('stroke-width', '2.5'); // Thicker path
        this.svg.appendChild(this.path);

        this.controlPoints = this.points.map((p, i) => {
            // When drawing, we flip the y-coordinate to match SVG's "y-down" system.
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute('cx', p.x);
            circle.setAttribute('cy', this.height - p.y);
            circle.setAttribute('r', 6);
            circle.setAttribute('fill', 'rgba(0, 170, 255, 0.5)'); // Semi-transparent fill
            circle.setAttribute('stroke', '#fff'); // White stroke
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('cursor', 'grab');
            this.svg.appendChild(circle);

            circle.addEventListener('mousedown', (e) => {
                this.activePoint = i;
            });
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

        // Clamp screen coordinates
        x = Math.max(0, Math.min(this.width, x));
        y = Math.max(0, Math.min(this.height, y));

        // First and last points are fixed horizontally
        if (this.activePoint > 0 && this.activePoint < this.points.length - 1) {
            this.points[this.activePoint].x = x;
        }
        // Convert the SVG's "y-down" coordinate back to our internal "y-up" system for storage.
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
        if (!normalizedPoints || normalizedPoints.length !== 4) {
            console.warn("CurveEditor: Invalid points data provided for setPoints.");
            return;
        }

        // Directly map normalized "y-up" data to internal "y-up" system.
        this.points = normalizedPoints.map(p => ({
            x: p.x * this.width,
            y: p.y * this.height
        }));

        this.drawCurve();
        // Trigger the LUT update by calling the onChange callback
        this.onChange(this.getNormalizedPoints(), {
            isLoading: true
        });
    }

    getNormalizedPoints() {
        // Directly normalize the internal "y-up" points.
        return this.points.map(p => ({
            x: p.x / this.width,
            y: p.y / this.height
        }));
    }

    drawCurve() {
        this.controlPoints.forEach((circle, i) => {
            // When drawing, flip the internal "y-up" coordinate to SVG's "y-down" screen coordinate.
            circle.setAttribute('cx', this.points[i].x);
            circle.setAttribute('cy', this.height - this.points[i].y);
        });

        const p = this.points;
        // The path data must also be flipped for rendering in the y-down SVG canvas.
        const pathData = `M ${p[0].x},${this.height - p[0].y} C ${p[1].x},${this.height - p[1].y} ${p[2].x},${this.height - p[2].y} ${p[3].x},${this.height - p[3].y}`;
        this.path.setAttribute('d', pathData);
    }
}

class DebuggerEventHandler {
    constructor(element, profileManager) {
        this.element = element;
        this.profileManager = profileManager;
        this.sliderDebounceTimeout = null;
        this.allLutPresets = {};
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
            // Handle specific component clicks
            this._handleListManagerClick(e);
            this._handleFilePickerClick(e);

            // Handle generic data-action clicks
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
            if (el) {
                el.addEventListener(event, handler.bind(this));
            } else {
                console.warn(`MapShine Debugger: Could not find element with selector '${selector}' to attach event listener.`);
            }
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
        addListener('#generate-neutral-lut-btn', 'click', this._onGenerateNeutralLut);
        addListener('#apply-neutral-lut-btn', 'click', this._onApplyNeutralLut);
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
        if (isActive) {
            statusEl.textContent = 'ACTIVE';
            statusEl.className = 'status-active';
        } else {
            statusEl.textContent = 'INACTIVE';
            statusEl.className = 'status-inactive';
        }
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
            console.warn("Map Shine | Could not browse for .cube LUT files. Only showing default presets.", e);
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

        if (!targetInput) {
            console.warn(`Map Shine | FilePicker button could not find its target input: #${targetId}`);
            return;
        }

        new FilePicker({
            type: type,
            current: targetInput.value,
            callback: path => {
                targetInput.value = path;
                targetInput.dispatchEvent(new Event('change', {
                    bubbles: true
                }));
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
                el.checked = (el.value === value);
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

        const isSlider = e.target.type === 'range';
        let value = e.target.type === 'checkbox' ? e.target.checked : (isSlider ? Number(e.target.value) : e.target.value);

        if (e.target.type === 'radio') {
            if (!e.target.checked) return;
        }

        if (isSlider && e.type === 'input') {
            this._updateSliderValue(e.target.id, value, e.target.step);
            return;
        }

        let processedValue = value;
        if (e.target.tagName === 'SELECT' && !isNaN(Number(value))) {
            processedValue = Number(value);
        }

        await this.profileManager.recordUserChange(path, processedValue);

        if (path === 'postProcessing.lut.presetName') {
            const presetKey = processedValue;
            const preset = this.allLutPresets[presetKey];

            if (preset) {
                const newPath = preset.path;
                await this.profileManager.recordUserChange('postProcessing.lut.texturePath', newPath);

                const pathInput = this.element.querySelector('#control-postProcessing-lut-texturePath');
                if (pathInput) pathInput.value = newPath;

                if (newPath && newPath.toLowerCase().endsWith('.cube')) {
                    const lutData = await LutUtils.getLutData(newPath);
                    if (lutData && lutData.domain) {
                        await Promise.all([
                            this.profileManager.recordUserChange('postProcessing.lut.domainMin', {
                                r: lutData.domain[0][0],
                                g: lutData.domain[1][0],
                                b: lutData.domain[2][0]
                            }),
                            this.profileManager.recordUserChange('postProcessing.lut.domainMax', {
                                r: lutData.domain[0][1],
                                g: lutData.domain[1][1],
                                b: lutData.domain[2][1]
                            })
                        ]);
                    }
                }
            }
            this.updateAllControls();
            this._updateLutControlVisibility();
        }

        const updateOptions = {
            timeOnly: path === 'timeControl.globalTime'
        };

        await this.profileManager.updateAllSystemsFromConfig(updateOptions);

        const isParticleSetting = Object.values(PARTICLE_EFFECT_DEFINITIONS).some(def => path.startsWith(def.configPath)) || path.startsWith('particleSystems');
        if (isParticleSetting && !updateOptions.timeOnly) {
            const particleLayer = canvas.layers.find(l => l instanceof ParticleLayer);
            if (particleLayer && game.mapShine.effectTargetManager.targets) {
                await particleLayer.updateEffectTargets(game.mapShine.effectTargetManager.targets);
            }
        }

        if (isSlider) {
            this._updateSliderValue(e.target.id, value, e.target.step);
        }
        if (e.target.type === 'checkbox' && e.target.closest('.summary-control')) {
            const detailsElement = e.target.closest('details');
            if (detailsElement) detailsElement.classList.toggle('disabled-effect', !e.target.checked);
        }

        if (path === 'baseShine.patternType') this._updatePatternControlVisibility();
        if (path === 'sceneTransition.useRandomHint') this._updateRandomHintVisibility();
        if (path === 'tileOpacity') game.mapShine.effectTargetManager.applyTileOpacities();
    }

    _updateRandomHintVisibility() {
        const useRandom = this.config.sceneTransition.useRandomHint;
        const randomWrapper = this.element.querySelector('#sceneTransition-randomHints-wrapper');
        if (randomWrapper) {
            randomWrapper.style.display = useRandom ? 'block' : 'none';
        }
    }

    _updateLutControlVisibility() {
        const preset = this.config.postProcessing.lut.presetName;
        const customPathWrapper = this.element.querySelector('#lut-custom-path-wrapper');
        if (customPathWrapper) {
            customPathWrapper.style.display = (preset === 'custom') ? 'block' : 'none';
        }
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

    _onClose() {
        game.mapShine.debugger?.destroy();
    }

    _onMinimize() {
        this.element.classList.toggle('minimized');
    }

    _getPathValue(obj, path) {
        return foundry.utils.getProperty(obj, path);
    }

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
        const uiState = {
            details: {}
        };
        this.element.querySelectorAll('details[id]').forEach(el => {
            uiState.details[el.id] = el.open;
        });
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
        const uiState = {
            details: {}
        };
        this.element.querySelectorAll('details[id]').forEach(el => {
            uiState.details[el.id] = el.open;
        });
        const success = await this.profileManager.updateProfile(name, this.profileManager.activeConfig, uiState);
        if (success) {
            this._populateProfilesDropdown();
        }
    }

    async _onLoadProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
        if (name) await this.profileManager.loadProfile(name);
    }

    async _onDeleteProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
        if (!name) return;
        const confirmed = await Dialog.confirm({
            title: "Delete Profile",
            content: `<p>Are you sure you want to delete the world profile "<strong>${name}</strong>"? This cannot be undone.</p>`,
            defaultYes: false
        });
        if (confirmed && await this.profileManager.deleteProfile(name)) {
            this._populateProfilesDropdown();
        }
    }

    async _onSetDefaultProfile() {
        const dropdown = this.element.querySelector('#profiles-dropdown');
        if (!dropdown) return;
        const name = dropdown.value;
        if (name) {
            await this.profileManager.setDefaultProfile(name);
            this._populateProfilesDropdown();
        }
    }

    _onOutputConfig() {
        const configString = JSON.stringify(this.config, null, 4);
        console.log("--- MAP SHINE: CURRENT CONFIG VALUES ---");
        console.log(configString);
        console.log("--- END CONFIG ---");
        try {
            navigator.clipboard.writeText(configString);
            ui.notifications.info("Config logged to console & copied to clipboard.");
        } catch (err) {
            ui.notifications.warn("Config logged to console. (Copying failed).");
        }
    }

    async _onCurveChange(points, options = {}) {
        if (!this.curveEditor || options.isLoading) return;

        const curvesConfig = this.config.postProcessing.colorCorrection.curves;
        const activeChannel = curvesConfig.activeChannel || 'rgb';

        if (activeChannel === 'rgb') {
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.rgb.points', points);
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.red.points', points);
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.green.points', points);
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves.blue.points', points);
        } else {
            const path = `postProcessing.colorCorrection.curves.${activeChannel}.points`;
            await this.profileManager.recordUserChange(path, points);
        }

        await this.profileManager.updateAllSystemsFromConfig();
    }

    _onCurveChannelChange(e) {
        if (!e.target.checked) return;
        this._updateCurveEditorView();
    }

    _updateCurveEditorView() {
        if (!this.curveEditor) return;

        const curvesConfig = this.config.postProcessing.colorCorrection.curves;
        const activeChannel = curvesConfig.activeChannel || 'rgb';

        const channelPoints = curvesConfig[activeChannel]?.points;
        if (channelPoints) {
            this.curveEditor.setPoints(channelPoints);
        }

        const colorMap = {
            rgb: '#00aaff',
            red: '#ff6b6b',
            green: '#6bff6b',
            blue: '#6b6bff'
        };
        this.curveEditor.path.setAttribute('stroke', colorMap[activeChannel]);
    }

    async _onApplyColorPreset() {
        const dropdown = this.element.querySelector('#control-postProcessing-colorCorrection-activePreset');
        if (!dropdown) return;

        const presetKey = dropdown.value;
        const preset = COLOR_CORRECTION_PRESETS[presetKey];
        if (!preset) {
            ui.notifications.warn("Invalid color preset selected.");
            return;
        }

        await this.profileManager.recordUserChange('postProcessing.colorCorrection.saturation', preset.saturation);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.brightness', preset.brightness);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.contrast', preset.contrast);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.exposure', preset.exposure);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.gamma', preset.gamma);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.levels.inBlack', preset.levels.inBlack);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.levels.inWhite', preset.levels.inWhite);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.whiteBalance.temperature', preset.whiteBalance.temperature);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.whiteBalance.tint', preset.whiteBalance.tint);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.tint.color', preset.tint.color);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.tint.amount', preset.tint.amount);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.invert', preset.invert);

        if (preset.curves) {
            await this.profileManager.recordUserChange('postProcessing.colorCorrection.curves', preset.curves);
            this._updateCurveEditorView();
        }

        await this.profileManager.updateAllSystemsFromConfig();

        this.updateAllControls();

        ui.notifications.info(`Applied "${preset.name}" color preset.`);
    }

    _onSaveColorFavorite() {
        const name = prompt("Enter a name for this color favorite:");
        if (!name || name.trim() === "") return;

        const ccConfig = this.config.postProcessing.colorCorrection;
        const favorite = {
            name: name.trim(),
            saturation: ccConfig.saturation,
            brightness: ccConfig.brightness,
            contrast: ccConfig.contrast,
            exposure: ccConfig.exposure,
            gamma: ccConfig.gamma,
            levels: {
                ...ccConfig.levels
            },
            whiteBalance: {
                ...ccConfig.whiteBalance
            },
            tint: {
                ...ccConfig.tint
            },
            invert: ccConfig.invert
        };

        let favorites = [];
        try {
            const stored = game.settings.get('map-shine', 'colorFavorites');
            favorites = JSON.parse(stored || '[]');
        } catch (e) {
            console.warn("MapShine | Failed to load color favorites:", e);
        }

        favorites.push(favorite);

        try {
            game.settings.set('map-shine', 'colorFavorites', JSON.stringify(favorites));
            this._updateFavoritesList();
            ui.notifications.info(`Saved color favorite "${name}".`);
        } catch (e) {
            console.error("MapShine | Failed to save color favorite:", e);
            ui.notifications.error("Failed to save color favorite.");
        }
    }

    _updateFavoritesList() {
        const container = this.element.querySelector('#color-favorites-list');
        if (!container) return;

        let favorites = [];
        try {
            const stored = game.settings.get('map-shine', 'colorFavorites');
            favorites = JSON.parse(stored || '[]');
        } catch (e) {
            console.warn("MapShine | Failed to load color favorites:", e);
        }

        if (favorites.length === 0) {
            container.innerHTML = '<p style="color: #888; font-style: italic;">No favorites saved yet.</p>';
            return;
        }

        let html = '';
        favorites.forEach((favorite, index) => {
            html += `
                        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
                            <button class="apply-favorite-btn" data-index="${index}" title="Apply this favorite" style="flex: 1; height: 20px; font-size: 11px;">${favorite.name}</button>
                            <button class="delete-favorite-btn" data-index="${index}" title="Delete this favorite" style="width: 20px; height: 20px; font-size: 11px; color: #ff6b6b;"> </button>
                        </div>
                    `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.apply-favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this._applyColorFavorite(index);
            });
        });

        container.querySelectorAll('.delete-favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this._deleteColorFavorite(index);
            });
        });
    }

    async _applyColorFavorite(index) {
        let favorites = [];
        try {
            const stored = game.settings.get('map-shine', 'colorFavorites');
            favorites = JSON.parse(stored || '[]');
        } catch (e) {
            console.warn("MapShine | Failed to load color favorites:", e);
            return;
        }

        const favorite = favorites[index];
        if (!favorite) return;

        const ccConfig = this.config.postProcessing.colorCorrection;
        ccConfig.saturation = favorite.saturation;
        ccConfig.brightness = favorite.brightness;
        ccConfig.contrast = favorite.contrast;
        ccConfig.exposure = favorite.exposure;
        ccConfig.gamma = favorite.gamma;
        ccConfig.levels.inBlack = favorite.levels.inBlack;
        ccConfig.levels.inWhite = favorite.levels.inWhite;
        ccConfig.whiteBalance.temperature = favorite.whiteBalance.temperature;
        ccConfig.whiteBalance.tint = favorite.whiteBalance.tint;
        ccConfig.tint.color = favorite.tint.color;
        ccConfig.tint.amount = favorite.tint.amount;
        ccConfig.invert = favorite.invert;

        await this.profileManager.recordUserChange('postProcessing.colorCorrection.saturation', favorite.saturation);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.brightness', favorite.brightness);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.contrast', favorite.contrast);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.exposure', favorite.exposure);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.gamma', favorite.gamma);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.levels.inBlack', favorite.levels.inBlack);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.levels.inWhite', favorite.levels.inWhite);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.whiteBalance.temperature', favorite.whiteBalance.temperature);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.whiteBalance.tint', favorite.whiteBalance.tint);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.tint.color', favorite.tint.color);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.tint.amount', favorite.tint.amount);
        await this.profileManager.recordUserChange('postProcessing.colorCorrection.invert', favorite.invert);

        this.updateAllControls();

        ui.notifications.info(`Applied color favorite "${favorite.name}".`);
    }

    _deleteColorFavorite(index) {
        let favorites = [];
        try {
            const stored = game.settings.get('map-shine', 'colorFavorites');
            favorites = JSON.parse(stored || '[]');
        } catch (e) {
            console.warn("MapShine | Failed to load color favorites:", e);
            return;
        }

        const favorite = favorites[index];
        if (!favorite) return;

        if (!confirm(`Delete color favorite "${favorite.name}"?`)) return;

        favorites.splice(index, 1);

        try {
            game.settings.set('map-shine', 'colorFavorites', JSON.stringify(favorites));
            this._updateFavoritesList();
            ui.notifications.info(`Deleted color favorite "${favorite.name}".`);
        } catch (e) {
            console.error("MapShine | Failed to delete color favorite:", e);
            ui.notifications.error("Failed to delete color favorite.");
        }
    }

    _makeDraggable() {
        const elmnt = this.element;
        const header = elmnt.querySelector('#material-editor-header');
        if (!header) return;
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;

        const dragMouseDown = (e) => {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        const elementDrag = (e) => {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            let newTop = elmnt.offsetTop - pos2;
            let newLeft = elmnt.offsetLeft - pos1;

            const winWidth = window.innerWidth;
            const winHeight = window.innerHeight;
            const elmntWidth = elmnt.offsetWidth;
            const headerHeight = header.offsetHeight;
            const minVisibleWidth = 100;

            newTop = Math.max(0, newTop);
            newTop = Math.min(newTop, winHeight - headerHeight);

            newLeft = Math.max(newLeft, -elmntWidth + minVisibleWidth);
            newLeft = Math.min(newLeft, winWidth - minVisibleWidth);

            elmnt.style.top = `${newTop}px`;
            elmnt.style.left = `${newLeft}px`;
        };

        const closeDragElement = () => {
            document.onmouseup = null;
            document.onmousemove = null;

            // Save the new position
            const currentPos = game.settings.get(MODULE_ID, 'debugger-position') || {};
            currentPos.top = elmnt.offsetTop;
            currentPos.left = elmnt.offsetLeft;
            game.settings.set(MODULE_ID, 'debugger-position', currentPos);
        };
        header.onmousedown = dragMouseDown;
    }
}

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

        // Restore saved position and size, or apply defaults.
        const savedPosition = game.settings.get(MODULE_ID, 'debugger-position');
        const defaultWidth = 1000;
        const defaultHeight = 1150;

        if (savedPosition && savedPosition.width && savedPosition.height) {
            this.element.style.width = `${savedPosition.width}px`;
            this.element.style.height = `${savedPosition.height}px`;
            this.element.style.top = `${savedPosition.top}px`;
            this.element.style.left = `${savedPosition.left}px`;
        } else {
            // Set default size and position
            this.element.style.width = `${defaultWidth}px`;
            this.element.style.height = `${defaultHeight}px`;

            const initialTop = 80;
            const initialLeft = (window.innerWidth - defaultWidth) / 2;
            this.element.style.top = `${initialTop}px`;
            this.element.style.left = `${Math.max(0, initialLeft)}px`;
        }

        // When the UI is created, immediately populate all indicators from the current system status.
        this._populateAllIndicators();
        // Then, subscribe to any future changes.
        systemStatus.on('statusChanged', this._boundUpdateIndicator);

        // Observe for user resizing.
        this.resizeObserver = new ResizeObserver(entries => {
            if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                for (let entry of entries) {
                    const {
                        width,
                        height
                    } = entry.contentRect;
                    const currentPos = game.settings.get(MODULE_ID, 'debugger-position') || {};
                    currentPos.width = width;
                    currentPos.height = height;
                    // Also save top/left in case they are not set yet
                    if (currentPos.top === undefined) currentPos.top = this.element.offsetTop;
                    if (currentPos.left === undefined) currentPos.left = this.element.offsetLeft;
                    game.settings.set(MODULE_ID, 'debugger-position', currentPos);
                }
            }, 200);
        });
        this.resizeObserver.observe(this.element);

        console.log("Material Editor | UI system initialized and subscribed to status updates.");
    }

    destroy() {
        systemStatus.off('statusChanged', this._boundUpdateIndicator);

        this.resizeObserver?.disconnect();
        if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

        this.element?.remove();
        this.element = null;
        this.uiBuilder = null;
        this.eventHandler = null;
        this.profileManager = null;
        game.mapShine.debugger = null;

        ui.controls.render(true);

        console.log("Material Editor | UI destroyed.");
    }

    applyProfileState(profileData) {
        if (this.eventHandler) {
            this.eventHandler.updateAllControls();
            this.eventHandler.applyProfileUIState(profileData);
        }
    }

    _populateAllIndicators() {
        const allStatuses = systemStatus.getAllStatuses();
        for (const [category, statuses] of Object.entries(allStatuses)) {
            for (const [key, statusObject] of Object.entries(statuses)) {
                this._updateIndicator(category, key, statusObject);
            }
        }
    }

    _updateIndicator(category, key, statusObject) {
        const light = this.element.querySelector(`#status-${category}-${key}`);
        if (light) {
            light.className = `traffic-light ${statusObject.state}`;
            light.title = statusObject.message;
        }
        if (category === 'textures') {
            const pathInput = this.element.querySelector(`#texture-path-${key}`);
            if (pathInput) {
                pathInput.value = statusObject.message;
                pathInput.title = statusObject.message;
            }
        }
    }
}

class DebuggerUIBuilder {
    constructor() {}

    buildRootElement() {
        const element = document.createElement('div');
        element.id = 'material-editor-debugger';
        element.innerHTML = this._getStyles() + this._getBaseHTML();

        element.querySelector('#material-editor-profiles-section').innerHTML = this._buildProfileSection();

        const postProcessingPane = element.querySelector('#post-processing-pane');
        const mainContentArea = element.querySelector('.main-content-area');

        const managedEffects = ScreenEffectsManager.getManagedEffectsHTML();

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

        element.querySelector('#material-editor-bottom-bar').innerHTML = DebuggerUIBuilder._buildBottomBar();

        return element;
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

    _getStyles() {
        return `<style>
                            #material-editor-debugger { 
                                position: fixed; 
                                z-index: 10; 
                                background: rgba(40, 40, 40, 0.95); 
                                color: #fff; 
                                border: 1px solid #111; 
                                border-radius: 8px; 
                                padding: 5px; 
                                font-family: sans-serif; 
                                font-size: 11px; 
                                display: flex; 
                                flex-direction: column; 
                                gap: 4px; 
                                min-width: 550px;
                                min-height: 600px;
                                box-sizing: border-box;
                                box-shadow: 0 0 25px rgba(0,0,0,0.7); 
                                resize: both;
                                overflow: auto;
                            }
                            #material-editor-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; }
                            #material-editor-header h3 { margin: 0; padding: 0; border: none; flex-grow: 1; text-align: center; cursor: move; user-select: none; font-size: 1.4em; }
                            .header-btn { display: inline-block; text-decoration: none; background: #3a3a3a; border: 1px solid #666; color: #ccc; font-weight: bold; width: 22px; height: 22px; line-height: 22px; text-align: center; cursor: pointer; border-radius: 4px; flex-shrink: 0; font-size: 14px; padding: 0; }
                            .header-btn:hover { background: #555; border-color: #888; }
                            #material-editor-debugger .file-picker-btn {
                                flex-shrink: 0;
                                width: 22px;
                                height: 22px;
                                line-height: 18px;
                                padding: 0;
                                font-size: 12px;
                                background: #3a3a3a;
                                border: 1px solid #666;
                                color: #ccc;
                                cursor: pointer;
                                border-radius: 4px;
                            }
                            #material-editor-debugger .file-picker-btn:hover { background: #555; border-color: #888; }
                            #material-editor-debugger details { background: rgba(255,255,255,0.05); border: 1px solid #555; border-radius: 4px; padding: 3px; margin-bottom: 0; }
                            #material-editor-debugger details[open] { background: rgba(255,255,255,0.08); padding-bottom: 5px; }
                            #material-editor-debugger details[open] > summary .accordion-toggle { transform: rotate(90deg); }
                            #material-editor-debugger details.disabled-effect > summary .summary-label { color: #888; }
                            #material-editor-debugger summary { font-weight: bold; cursor: pointer; padding: 2px; display: flex; align-items: center; gap: 5px; list-style: none; }
                            #material-editor-debugger summary::-webkit-details-marker { display: none; }
                            #material-editor-debugger .accordion-toggle { flex-shrink: 0; width: 0; height: 0; border-top: 4px solid transparent; border-bottom: 4px solid transparent; border-left: 5px solid #ccc; transition: transform 0.2s ease-in-out; margin-left: 2px; }
                            #material-editor-debugger .summary-control { display: flex; justify-content: space-between; align-items: center; width: 100%; }
                            .world-based-icon { color: #aaa; display: none; margin-right: 5px; }
                            .world-based-icon.active { display: inline-block; color: #40a0fa; }
                            #material-editor-debugger details details { margin-left: 8px; margin-top: 4px; border-style: dashed; }
                            #material-editor-debugger .traffic-light { width: 9px; height: 9px; border-radius: 50%; display: inline-block; box-shadow: 0 0 4px rgba(0,0,0,0.5); border: 1px solid #111; flex-shrink: 0; }
                            #material-editor-debugger .traffic-light.ok { background-color: #4cfa40; }
                            #material-editor-debugger .traffic-light.error { background-color: #fa4040; }
                            #material-editor-debugger .traffic-light.warning { background-color: #f7a000; }
                            #material-editor-debugger .traffic-light.unknown { background-color: #888; }
                            #material-editor-debugger .traffic-light.inactive, #material-editor-debugger .traffic-light.disabled { background: none; border: 1px dashed #666; }
                            #material-editor-debugger .control-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; padding: 1px 0; }
                            #material-editor-debugger .control-row label { flex-shrink: 0; margin-right: 8px; display: flex; align-items: center; gap: 4px;}
                            #material-editor-debugger .control-row .widget-group { display: flex; align-items: center; gap: 4px; }
                            #material-editor-debugger .control-row-slider { display: grid; grid-template-columns: auto 1fr auto; gap: 5px; align-items: center; }
                            #material-editor-debugger .control-row-slider label { margin-right: 0; }
                            #material-editor-debugger .control-row-slider input[type=range] { width: 100%; }
                            #material-editor-debugger .control-row .value-span { width: 40px; height: 18px; line-height: 18px; text-align: right; font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.4); padding: 0 4px; border-radius: 3px; box-sizing: border-box; }
                            #material-editor-debugger input[type=range] { flex-grow: 1; width: 120px; height: 14px; }
                            #material-editor-debugger input[type=color] { width: 100%; height: 22px; border: 1px solid #555; padding: 1px; background: #333; box-sizing: border-box; }
                            .main-layout-wrapper { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 8px; flex-grow: 1; min-height: 0; overflow: hidden; padding: 4px; background: rgba(0,0,0,0.2); border-radius: 5px; }
                            #post-processing-pane { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; padding-right: 5px; }
                            .pane-title { text-align: center; font-size: 1.2em; font-weight: bold; color: #efefef; margin: 3px 0 8px 0; padding-bottom: 5px; border-bottom: 1px solid #555; }
                            .main-content-area { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; overflow-y: auto; align-content: start; }
                            .fx-column { display: flex; flex-direction: column; gap: 4px; }
                            #material-editor-debugger #material-editor-profiles-section > details { margin-bottom: 0; }
                            #material-editor-debugger #material-editor-profiles-section .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 5px; }
                            #material-editor-debugger #material-editor-profiles-section .profile-group { display: flex; flex-direction: column; gap: 4px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; min-width: 250px; }
                            .profile-controls { display: flex; flex-direction: column; gap: 4px; }
                            #material-editor-debugger select { width: 100%; text-transform: capitalize; background-color: #222; color: #fff; border: 1px solid #555; border-radius: 3px; height: 20px; font-size: 11px; }
                            .star-icon { font-size: 0 !important; background-color: #ccc; width: 12px; height: 12px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); margin: auto; }
                            #material-editor-debugger.minimized { width: auto; height: auto; padding: 4px; gap: 0; box-shadow: 0 0 10px rgba(0,0,0,0.5); right: auto; }
                            #material-editor-debugger.minimized #material-editor-header { padding: 0; cursor: move; }
                            #material-editor-debugger.minimized > *:not(#material-editor-header) { display: none; }
                            #material-editor-debugger.minimized #material-editor-help-btn, #material-editor-debugger.minimized #material-editor-title { display: none; }
                            .fx-status-light { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #111; margin-right: 5px; vertical-align: middle; }
                            .fx-status-light.green { background-color: #4cfa40; box-shadow: 0 0 5px #4cfa40; }
                            .fx-status-light.blue { background-color: #40a0fa; box-shadow: 0 0 5px #40a0fa; }
                            .fx-status-light.grey { background-color: #888; }
                            .fx-status-light.red { background-color: #fa4040; box-shadow: 0 0 5px #fa4040; }
                            .profile-controls button:disabled { background-color: #333; color: #777; cursor: not-allowed; border-color: #555; }
                            .description-text { font-size: 10px; color: #aaa; margin: 4px 0 6px 0; padding-left: 5px; }
                            .warning-box { background: #552222; border: 1px solid #ff6666; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 10px; }
                            .warning-box strong { color: #ffaaaa; }
                            .profile-group-title { font-weight: bold; text-align: center; display: block; margin-bottom: 5px; color: #ccc; border-bottom: 1px solid #555; padding-bottom: 3px;}
                            #material-editor-bottom-bar { padding: 10px 15px; margin-top: 5px; background: rgba(15, 15, 15, 0.5); border-radius: 5px; border: 1px solid #666; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 30px; }
                            #material-editor-bottom-bar .about-text { font-size: 11px; line-height: 1.5; color: #ccc; }
                            #material-editor-bottom-bar .about-text p { margin: 0; }
                            #material-editor-bottom-bar .about-text p:first-child { margin-bottom: 5px; }
                            #material-editor-bottom-bar .support-links { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
                            #material-editor-bottom-bar .support-links a.patreon-link { color: #f96854; text-decoration: none; font-weight: bold; font-size: 13px; white-space: nowrap; display: flex; align-items: center; gap: 8px; transition: all 0.2s; padding: 6px 12px; border-radius: 4px; background: rgba(40, 40, 40, 0.9); border: 1px solid #777; }
                            #material-editor-bottom-bar .support-links a.patreon-link:hover { color: #fff; background: #f96854; border-color: #f96854; }
                            #material-editor-bottom-bar .support-links .patreon-logo { height: 20px; width: 20px; }
                            #material-editor-bottom-bar .stores-group { display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
                            #material-editor-bottom-bar .stores-heading { margin: 0; padding: 0; font-size: 10px; font-weight: bold; color: #bbb; text-transform: uppercase; letter-spacing: 0.5px; }
                            #material-editor-bottom-bar .store-links-inner { display: flex; gap: 15px; font-size: 11px; }
                            #material-editor-bottom-bar .store-links-inner a { color: #8fb1ff; text-decoration: none; font-weight: bold; }
                            #material-editor-bottom-bar .store-links-inner a:hover { color: #b3ceff; text-decoration: underline; }
                            details.effect-unavailable { border-style: dashed; border-color: #444; }
                            details.effect-unavailable > summary { opacity: 0.7; }
                            details.effect-unavailable > summary .summary-label { text-decoration: line-through; }
                            #new-controls-column-0 { border: 2px dashed #40a0fa; padding: 5px; border-radius: 5px; }
                            #new-controls-column-0 > details > summary { background-color: rgba(64, 160, 250, 0.2); }
                            .map-tools-toolbar { background: rgba(0,0,0,0.3); border: 1px solid #666; border-radius: 5px; padding: 8px; text-align: center; display: flex; flex-direction: column; gap: 8px; }
                            .toolbar-title { font-weight: bold; font-size: 1.2em; color: #aadcff; border-bottom: 1px solid #555; padding-bottom: 5px; margin-bottom: 5px; letter-spacing: 1px;}
                            .toolbar-button { width: 100%; padding: 8px; font-weight: bold; font-size: 1.1em; background-color: #225522; border: 1px solid #66aa66; color: #ccffcc; border-radius: 3px; cursor: pointer; transition: background-color 0.2s; }
                            .toolbar-button:hover { background-color: #337733; }
                            .toolbar-status { font-size: 0.9em; color: #aaa; }
                            .toolbar-status span { font-weight: bold; padding: 2px 6px; border-radius: 10px; font-size: 0.9em; }
                            .toolbar-status .status-inactive { color: #ffcccc; background-color: #662222; }
                            .toolbar-status .status-active { color: #ccffcc; background-color: #226622; animation: pulse 2s infinite; }
                            @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(102, 170, 102, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(102, 170, 102, 0); } 100% { box-shadow: 0 0 0 0 rgba(102, 170, 102, 0); } }
                        </style>`;
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

    static _buildBottomBar() {
        return `
                    <div class="about-text">
                        <p><strong>Map Shine:</strong> A free toolkit for creating memorable, animated, and visually striking maps.<br>
                         It will always be free for commercial use. Map making is both my passion and helps me support my family.<br>
                        If you use this module, please consider giving credit by linking my Patreon or map stores.</p>
                    </div>
                    <div class="support-links">
                        <a href="https://www.patreon.com/c/MythicaMachina" target="_blank" class="patreon-link">
                            <span>Support on Patreon</span>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/9/94/Patreon_logo.svg" class="patreon-logo" alt="Patreon Logo">
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

    _buildProfileSection() {
        const isGm = game.user.isGM;
        // Only build the world profile management section if the user is a GM
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
                                ${this._buildDiagnosticSection()}
                            </div>
                        </div>
                    </details>
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
                        <div id="${listContainerId}" class="list-items-container" style="display: flex; flex-direction: column; gap: 4px; margin-top: 5px; padding-left: 10px;">
                        </div>
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
        return [
            MetallicShineLayer.getSettingsHTML(),
            WaterFXLayer.getSettingsHTML(),
            CloudShadowsLayer.getSettingsHTML(),
            IridescenceLayer.getSettingsHTML(),
            HeatDistortionLayer.getSettingsHTML(),
            CanopyLayer.getSettingsHTML(),
            StructuralShadowsLayer.getSettingsHTML(),
            AmbientLayer.getSettingsHTML(),
            GroundGlowLayer.getSettingsHTML(),
            PrismLayer.getSettingsHTML(),
            ParticleEffectController.getSettingsHTML('fire'),
            ParticleEffectController.getSettingsHTML('sparks'),
            ParticleEffectController.getSettingsHTML('dust'),
            ParticleEffectController.getSettingsHTML('glint'),
        ];
    }

    _getColumnCounts(totalItems, maxColumns) {
        let numColumns = Math.min(maxColumns, totalItems);
        if (numColumns === 0) return [];

        let counts = Array(numColumns).fill(0);
        let baseItemsPerColumn = Math.floor(totalItems / numColumns);
        let remainder = totalItems % numColumns;

        for (let i = 0; i < numColumns; i++) {
            counts[i] = baseItemsPerColumn + (i < remainder ? 1 : 0);
        }
        return counts;
    }
}

// =================================================================================
// SECTION 7: HOOKS
// =================================================================================
// Description: The main init hook that registers all layers, settings, and hooks.
//              Also contains template/example code.
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

Hooks.once('init', () => {
    if (game.mapShine?.initialized) {
        console.log("Map Shine | Initialization aborted: module has already been initialized.");
        return;
    }

    // --- Keyboard Listener for Point Placement Mode ---
    // We add this listener to the window to reliably catch the Escape key press.
    window.addEventListener('keydown', (event) => {
        // If the point placement tool is active, let it handle the Escape key.
        if (game.mapShine?.mapPointsInteractionManager?.handleEscape(event)) {
            // If the event was handled, stop it from propagating further.
            return;
        }
    }, true); // Use capture phase to catch event early.

    game.mapShine = {
        initialized: true,
        isCustomPaused: false,
        pauseEffectManager: new PauseEffectManager(),
        combatEffectManager: new CombatEffectManager(),
        timeControl: {
            timeFactor: 1.0
        },
        systemsReady: false,
        loadingScreen: null,
        profileManager: new ProfileManager(),
        sceneChangeManager: new SceneChangeManager(),
        setupCompletionPromise: null, // Promise to await for scene transition
        resolveSetupCompletion: null, // Resolver for the above promise
        debugger: null,
        particleManager: null,
        fireWindManager: null,
        tokenManager: null,
        dynamicExposureManager: null,
        mapPointsManager: MapPointsManager,
        mapPointsInteractionManager: new MapPointsInteractionManager(),
        mapPointsEditor: null,
        geometryMaskManager: null,
        activeMapPointGroup: null,
        mapPointsInitialized: false,

        effectTargetManager: {
            targets: {
                background: null,
                tiles: new Map()
            },
            async refresh() {
                console.log("MapShine | Refreshing effect targets...");
                const FLAG_NAME = 'mapShineTargets';

                if (game.user.isGM) {
                    // GM client: Discover textures, create a serializable version, and write to a flag.
                    const loader = new TextureAutoLoader();
                    const discoveredTargets = await loader.discoverAllTargets(); // This contains full tile objects.

                    // Create a version of the targets that is safe to serialize for the flag.
                    // It removes the circular 'tile' object reference.
                    const serializableTiles = Array.from(discoveredTargets.tiles.entries()).map(([tileId, targetData]) => {
                        const {
                            tile,
                            ...rest
                        } = targetData; // Destructure to remove the 'tile' property.
                        return [tileId, rest];
                    });

                    const serializableTargets = {
                        background: discoveredTargets.background,
                        tiles: serializableTiles // This is now an array of [id, data] without circular refs.
                    };

                    const oldFlagData = canvas.scene.getFlag(MODULE_ID, FLAG_NAME);

                    // Compare the clean, serializable versions. This prevents the recursive loop.
                    if (JSON.stringify(serializableTargets) === JSON.stringify(oldFlagData)) {
                        console.log("MapShine | Discovered targets are unchanged. No flag update needed.");
                        // Use the original data with full tile objects for the local GM client.
                        this.targets = discoveredTargets;
                    } else {
                        console.log("MapShine | New effect targets discovered. Updating scene flag.");
                        // Set the flag with the clean data. This will trigger the "updateScene" hook for all clients.
                        await canvas.scene.setFlag(MODULE_ID, FLAG_NAME, serializableTargets);
                        return; // Exit here; the hook will handle processing for all clients, including this GM.
                    }

                } else {
                    // Player client: Read from the flag set by the GM.
                    const flagData = canvas.scene.getFlag(MODULE_ID, FLAG_NAME);
                    if (flagData) {
                        // "Re-hydrate" the tile objects from the ID stored in the flag.
                        const rehydratedTiles = new Map();
                        if (flagData.tiles) {
                            for (const [tileId, targetData] of flagData.tiles) {
                                const tile = canvas.tiles.get(tileId);
                                if (tile) {
                                    rehydratedTiles.set(tileId, {
                                        ...targetData,
                                        tile: tile // Add the full tile object back in for local use.
                                    });
                                }
                            }
                        }
                        this.targets = {
                            background: flagData.background,
                            tiles: rehydratedTiles
                        };
                    } else {
                        // Fallback for if the GM hasn't set the flag yet.
                        this.targets = {
                            background: null,
                            tiles: new Map()
                        };
                    }
                }

                // The following logic now runs for all clients, using the correctly populated targets.
                const allTargets = [this.targets.background, ...this.targets.tiles.values()].filter(t => t);
                for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
                    const foundPath = allTargets.map(t => t[key]).find(p => p);
                    if (foundPath) {
                        systemStatus.update('textures', key, {
                            state: 'ok',
                            message: foundPath
                        });
                    } else {
                        systemStatus.update('textures', key, {
                            state: 'inactive',
                            message: 'Auto-discovery found no matching file.'
                        });
                    }
                }

                this.applyTileOpacities();
                await this.broadcastUpdate();
                Hooks.callAll('mapShine:targetsRefreshed');
            },
            async broadcastUpdate() {
                const updatePromises = [];
                for (const layer of canvas.layers) {
                    if (typeof layer.updateEffectTargets === 'function') {
                        updatePromises.push(layer.updateEffectTargets(this.targets));
                    }
                }
                await Promise.all(updatePromises);
            },
            applyTileOpacities() {
                const config = game.mapShine.profileManager.activeConfig;
                for (const tile of canvas.tiles.placeables) {
                    if (!tile.mesh) continue;
                    const isTargetWithEffects = this.targets.tiles.has(tile.id) && config.enabled;
                    if (isTargetWithEffects) {
                        tile.mesh.alpha = config.tileOpacity;
                    } else {
                        tile.mesh.alpha = 1.0;
                    }
                }
            }
        },

        showEditor: async function() {
            if (game.mapShine.debugger) {
                game.mapShine.debugger.element.classList.remove('minimized');
                return;
            }
            game.mapShine.debugger = new MaterialEditorDebugger();
            game.mapShine.debugger.initialize(game.mapShine.profileManager);
            await game.mapShine.profileManager.initializeUI(game.mapShine.debugger);
        }
    };

    // Initialize the manager which registers its own hooks
    game.mapShine.sceneChangeManager.initialize();

    console.log("Map Shine | Library Test: Verifying PIXI.particles global.");
    if (PIXI.particles && typeof PIXI.particles.Emitter === 'function') {
        console.log("%cSUCCESS:", "color: #4CAF50; font-weight: bold;", "pixi-particles library loaded correctly onto PIXI object.");
        PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(TextureMaskShape);
        PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(GeometryMaskShape); // Register the new shape
        PIXI.particles.Emitter.registerBehavior(SparkPathBehavior);
    } else {
        console.error("FAILURE: pixi-particles library did not attach to the global PIXI object.");
    }

    game.settings.register(MODULE_ID, 'disable-loading-screen', {
        name: "Disable Loading Screen",
        hint: "Completely disables the loading screen feature. Disabling this may cause some effects and layers to pop into existence a moment after the scene has finished loading, which can be jarring. Recommended to keep enabled unless it causes issues.",

        scope: "client",
        config: true,
        type: Boolean,
        default: false,
    });

    // --- Global Accessibility Settings ---
    game.settings.register(MODULE_ID, 'user-disable-distortion', {
        name: "Global Override: Disable Screen Distortion",
        hint: "Disables all screen-warping effects (e.g., Heat, Lens Distortion) to prevent motion sickness. This overrides all other settings.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => {
            if (canvas?.ready && game.mapShine?.profileManager) {
                game.mapShine.profileManager.initializeForScene();
                game.mapShine.profileManager.updateAllSystemsFromConfig();
            }
        },
    });

    game.settings.register(MODULE_ID, 'user-disable-color-fringe', {
        name: "Global Override: Disable Color Fringe",
        hint: "Disables all 'chromatic aberration' effects to improve visual clarity. This overrides all other settings.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => {
            if (canvas?.ready && game.mapShine?.profileManager) {
                game.mapShine.profileManager.initializeForScene();
                game.mapShine.profileManager.updateAllSystemsFromConfig();
            }
        },
    });

    // --- Per-Effect Override Settings ---
    Object.entries(CLIENT_OVERRIDES_CONFIG).forEach(([key, data]) => {
        game.settings.register(MODULE_ID, `user-${key}-enabled`, {
            name: data.name,
            hint: `Toggles the '${data.name}' effect. If off, this overrides the scene's setting.`,
            scope: "client",
            config: true,
            type: Boolean,
            default: true,
            onChange: () => {
                if (canvas?.ready && game.mapShine?.profileManager) {
                    game.mapShine.profileManager.initializeForScene();
                    game.mapShine.profileManager.updateAllSystemsFromConfig();
                }
            },
        });

        if (data.intensitySubPath) {
            game.settings.register(MODULE_ID, `user-${key}-intensity`, {
                name: `+- Intensity`,
                hint: `Modifies the intensity of '${data.name}' as a percentage of the scene's setting.`,
                scope: "client",
                config: true,
                type: Number,
                range: {
                    min: 0,
                    max: 100,
                    step: 1
                },
                default: 100,
                onChange: () => {
                    if (canvas?.ready && game.mapShine?.profileManager) {
                        game.mapShine.profileManager.initializeForScene();
                        game.mapShine.profileManager.updateAllSystemsFromConfig();
                    }
                },
            });
        }
    });

    game.settings.register(MODULE_ID, PROFILES_SETTING, {
        name: "Material Effect Profiles",
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });

    game.settings.register(MODULE_ID, DEFAULT_PROFILE_SETTING, {
        name: "Default Material Profile Name",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    game.settings.register(MODULE_ID, 'user-adjustments', {
        name: "User-specific FX Overrides",
        scope: "client",
        config: false,
        type: Object,
        default: {}
    });

    game.settings.register(MODULE_ID, 'colorFavorites', {
        name: "Color Correction Favorites",
        scope: "client",
        config: false,
        type: String,
        default: "[]"
    });

    game.settings.register(MODULE_ID, 'debugger-position', {
        name: "Debugger Window Position",
        scope: "client",
        config: false,
        type: Object,
        default: {}
    });

    game.settings.register(MODULE_ID, 'ambientLayerZIndex', {
        name: "Ambient Layer Z-Index (Requires Reload)",
        hint: "Controls the rendering order of the Ambient/Emissive layer. Changes require a canvas reload.",
        scope: "client",
        config: false,
        type: Number,
        default: 250
    });

    game.settings.register(MODULE_ID, 'showDustMaskDebug', {
        name: "Show Dust Mask (Debug)",
        hint: "The new particle system does not have a single combined mask, so this debug view is no longer applicable.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    Hooks.on('lightingRefresh', () => {
        if (canvas?.ready && game.mapShine?.profileManager?.activeConfig) {
            game.mapShine.profileManager.updateAllSystemsFromConfig({
                lightingOnly: true
            });
        }
    });

    // --- LAYER REGISTRATION ---
    const ambientZIndex = game.settings.get(MODULE_ID, 'ambientLayerZIndex');

    Object.assign(CONFIG.Canvas.layers, {
        mapShineBackground: {
            layerClass: BackgroundLayer,
            group: "primary"
        },
        groundGlow: {
            layerClass: GroundGlowLayer,
            group: "environment"
        },
        prism: {
            layerClass: PrismLayer,
            group: "primary"
        },
        iridescence: {
            layerClass: IridescenceLayer,
            group: "primary"
        },
        canopy: {
            layerClass: CanopyLayer,
            group: "environment"
        },
        structuralShadows: {
            layerClass: StructuralShadowsLayer,
            group: "environment"
        },
        metallicShine: {
            layerClass: MetallicShineLayer,
            group: "primary"
        },
        cloudShadows: {
            layerClass: CloudShadowsLayer,
            group: "environment"
        },
        ambient: {
            layerClass: AmbientLayer,
            group: "environment",
            zIndex: ambientZIndex
        },
        particleLayer: {
            layerClass: ParticleLayer,
            group: "environment"
        },
        waterFX: {
            layerClass: WaterFXLayer,
            group: "primary"
        },
        heatDistortion: {
            layerClass: HeatDistortionLayer,
            group: "primary"
        },
        diagnostic: {
            layerClass: DiagnosticLayer,
            group: "interface"
        },
        mapPoints: { // <-- ADD THIS
            layerClass: MapPointsLayer,
            group: "interface"
        },

    });

    // END OF REGISTRATION

    console.log(`MaterialToolkit | Registered all settings and layers. AmbientLayer zIndex set to: ${ambientZIndex}.`);

    // GNU Terry Pratchett
    console.log(`GNU Terry Pratchett: For as long as his name is still passed along the clacks, Death can't have him.`);

    // --- Scene Transition Wrapper ---
    if (game.modules.get('lib-wrapper')?.active) {
        libWrapper.register(MODULE_ID, 'Scene.prototype.view', async function(wrapped, ...args) {
            // Re-fetch the manager and config inside the wrapper to ensure we have the latest.
            const sceneManager = game.mapShine.sceneChangeManager;
            const config = game.mapShine.profileManager.activeConfig.sceneTransition;

            const sceneToView = this;
            const currentScene = canvas.scene;

            if (!config.enabled || !currentScene || sceneToView.id === currentScene.id) {
                return wrapped(...args);
            }

            console.log(`%c[MapShine Transition] Beginning transition to '${sceneToView.name}'.`, 'font-weight: bold; color: #40a0fa;');

            console.log(`[MapShine Transition] Preloading scene...`);
            await game.scenes.preload(sceneToView.id);
            console.log(`[MapShine Transition] Preload complete.`);

            sceneManager._createOverlay();

            console.log(`[MapShine Transition] Fading out...`);
            await sceneManager.fadeOut(config, sceneToView.name); // Pass config and scene name
            console.log(`[MapShine Transition] Fade out complete.`);

            // Create a promise that will be resolved by the setup process.
            let resolveSetup;
            game.mapShine.setupCompletionPromise = new Promise(resolve => {
                resolveSetup = resolve;
            });
            game.mapShine.resolveSetupCompletion = resolveSetup;

            console.log(`[MapShine Transition] Executing core scene change.`);
            const result = await wrapped(...args);
            console.log(`[MapShine Transition] Core scene change finished.`);

            // Wait for the module's setup to signal completion, with a timeout.
            console.log('[MapShine Transition] Waiting for Map Shine systems to be ready...');
            const timeoutPromise = new Promise(resolve => setTimeout(() => {
                console.warn('[MapShine Transition] Timed out waiting for systems ready signal. Fading in anyway.');
                resolve();
            }, 1000)); // 1 second timeout

            await Promise.race([game.mapShine.setupCompletionPromise, timeoutPromise]);
            console.log('[MapShine Transition] Map Shine systems are ready or timeout was reached.');

            // Clean up the promise hooks.
            game.mapShine.setupCompletionPromise = null;
            game.mapShine.resolveSetupCompletion = null;

            // Add the requested 2-second pause.
            console.log(`[MapShine Transition] Pausing for 2 seconds before fade-in.`);
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log(`[MapShine Transition] Fading in...`);
            await sceneManager.fadeIn(config); // Pass config
            console.log(`[MapShine Transition] Fade in complete.`);

            sceneManager._destroyOverlay();
            console.log(`%c[MapShine Transition] Transition finished.`, 'font-weight: bold; color: #40a0fa;');

            return result;
        }, 'WRAPPER');
        console.log("Map Shine | Successfully registered Scene.prototype.view wrapper for transitions.");
    } else {
        console.warn("Map Shine | libWrapper is not active. Elegant scene transitions will be disabled.");
    }

    Hooks.on("createTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("updateTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("deleteTile", () => game.mapShine?.effectTargetManager.refresh());

});

Hooks.on("updateScene", (scene, data) => {
    // Only react to updates on the currently viewed scene.
    if (!scene.isView) return;

    // Check if our specific flag was changed, or if the background image was changed.
    const flagPath = `flags.${MODULE_ID}`;
    const backgroundPath = 'background.src';
    if (foundry.utils.hasProperty(data, flagPath) || foundry.utils.hasProperty(data, backgroundPath)) {
        console.log("Map Shine | Detected relevant scene update. Refreshing targets for all clients.");
        game.mapShine?.effectTargetManager.refresh();
    }
});