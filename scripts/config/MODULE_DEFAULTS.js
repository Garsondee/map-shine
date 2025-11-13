// BLEND_MODE_OPTIONS has been moved to scripts/config/blend-modes.js
// FONT_CHOICES has been moved to scripts/config/fonts.js
// GRADIENT_PRESETS, LUT_PRESETS, EFFECT_SOURCE_OPTIONS, and ROPE_TYPE_PRESETS have been moved to scripts/config/presets.js
// COLOR_CORRECTION_PRESETS has been moved to scripts/config/color-correction-presets.js

export const MODULE_DEFAULTS = {
  "timeControl": {
    "globalTime": 100
  },
  "enabled": true,
  "debug": true,
  "showTokenMask": false,
  "tileOpacity": 0,
  "lightMask": {
    "blur": 96,
    "noise": 0.05
  },
  "baseShine": {
    "enabled": true,
    "compositing": {
      "layerBlendMode": 1
    },
    "animation": {
      "globalIntensity": 1.5
    },
    "pattern": {
      "stripes": {
        "enabled": true,
        "speed": 0,
        "angle": 140,
        "scale": 0.077,
        "parallax": 1,
        "width": 0.86,
        "softness": 0.5,
        "randomWidth": 0.49,
        "randomIntensity": 1
      }
    },
    "colorCorrection": {
      "enabled": true,
      "saturation": 1.5,
      "brightness": 0,
      "contrast": 1,
      "gamma": 1,
      "tint": {
        "color": "#FFFFFF",
        "amount": 0
      },
      "invert": false
    },
    "cloudOcclusion": {
      "enabled": true,
      "intensity": 0.81
    }
  },
  "cloudShadows": {
    "enabled": true,
    "blendMode": 0,
    "shadowIntensity": 2,
    "maskBlur": 1,
    "lightOcclusion": {
      "enabled": true,
      "intensity": 1
    },
    "wind": {
      "angle": 0,
      "speed": 0,
      "linkToWind": true,
      "linkedWindForce": 0.29286,
      "linkedMaxSpeed": 12.5,
      "linkedDrag": 0.96
    },
    "noise": {
      "scale": 1.9,
      "octaves": 8,
      "persistence": 0.5,
      "lacunarity": 2.3
    },
    "shading": {
      "threshold": 0.32,
      "softness": 1,
      "brightness": 0.15,
      "contrast": 1.5,
      "gamma": 1
    },
    "evolutionSpeed": 0,
    "layers": {
      "layer1": {
        "enabled": true,
        "scale": 4,
        "speed": 2.5,
        "stretchX": 3,
        "stretchY": 1,
        "octaves": 3,
        "opacity": 0.3
      },
      "layer2": {
        "enabled": true,
        "scale": 1.5,
        "speed": 1.3,
        "stretchX": 1.5,
        "stretchY": 1,
        "octaves": 5,
        "opacity": 0.5
      },
      "layer3": {
        "enabled": true,
        "scale": 0.7,
        "speed": 0.7,
        "stretchX": 1,
        "stretchY": 1,
        "octaves": 6,
        "opacity": 0.6
      },
      "layer4": {
        "enabled": true,
        "scale": 2.5,
        "speed": 1.8,
        "stretchX": 1,
        "stretchY": 1,
        "octaves": 4,
        "opacity": 0.4
      },
      "layer5": {
        "enabled": true,
        "scale": 5,
        "speed": 3,
        "stretchX": 1,
        "stretchY": 1,
        "octaves": 2,
        "opacity": 0.2
      },
      "layer6": {
        "enabled": true,
        "scale": 1.2,
        "speed": 4.5,
        "stretchX": 1.5,
        "stretchY": 1,
        "octaves": 7,
        "opacity": 0.15,
        "warpStrength": 0.3,
        "warpScale": 2.5,
        "additive": true
      }
    },
    "depth": {
      "enabled": true,
      "color": "#f6f6f6",
      "threshold": 0.3,
      "softness": 0.2,
      "offsetX": 0,
      "offsetY": 0,
      "zoomThresholdMin": 1.57,
      "zoomThresholdMax": 1.9,
      "saturation": 1,
      "brightness": 0,
      "contrast": 1.2,
      "exposure": 0.03,
      "gamma": 1,
      "temperature": 0,
      "tint": 0,
      "zoomPointMin": 0.3,
      "zoomPointMid": 0.5,
      "zoomPointMax": 0.6,
      "opacityMinZoom": 1,
      "opacityMidZoom": 0,
      "opacityMaxZoom": 0
    }
  },
  "iridescence": {
    "enabled": true,
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
    "enabled": true,
    "shadowIntensity": 0.3,
    "tint": "#050805",
    "distortion": {
      "enabled": true,
      "strength": 0.004,
      "speed": 0.005,
      "scale": 0.01,
      "evolution": 0.01,
      "threshold": 0,
      "brightness": -0.37,
      "contrast": 1,
      "softness": 1
    }
  },
  "bush": {
    "enabled": true,
    "rustleScale": 0.05,
    "rustleSpeed": 33.4,
    "rustleFrequency": 13.7,
    "rustleIntensity": 1.65,
    "swayScale": 12.1,
    "swaySpeed": 22.5,
    "swayFrequency": 0.16,
    "swayIntensity": 1.3,
    "swayWindMultiplier": 3,
    "perpendicularMix": 0.65
  },
  "tree": {
    "enabled": true,
    "rustleScale": 3.7,
    "rustleSpeed": 45,
    "rustleFrequency": 5.8,
    "rustleIntensity": 1,
    "swayScale": 20,
    "swaySpeed": 15,
    "swayFrequency": 0.24,
    "swayIntensity": 2,
    "swayWindMultiplier": 1.5,
    "perpendicularMix": 1
  },
  "structuralShadows": {
    "enabled": true,
    "intensity": 0.5,
    "blendMode": 4,
    "colorCorrection": {
      "enabled": true,
      "exposure": 3,
      "saturation": 1,
      "brightness": 0,
      "contrast": 0.25,
      "gamma": 1,
      "tint": {
        "color": "#FFFFFF",
        "amount": 0
      }
    },
    "rgbSplit": {
      "enabled": false,
      "amount": 5,
      "threshold": 0.2,
      "softness": 0.5
    },
    "metallicPreservation": {
      "enabled": true,
      "threshold": 0.5,
      "blendMode": 1
    },
    "cloudOcclusion": {
      "enabled": true,
      "intensity": 0.4,
      "threshold": 0,
      "softness": 0.5
    },
    "lightOcclusion": {
      "enabled": true,
      "intensity": 0.2
    }
  },
  "prism": {
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
    "enabled": false,
    "texturePath": "",
    "blendMode": 1,
    "intensity": 2,
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
    "enabled": true,
    "texturePath": "",
    "blendMode": 1,
    "intensity": 1.05,
    "brightness": 1.2,
    "saturation": 1.2,
    "invert": false
  },
  "heatDistortion": {
    "enabled": true,
    "texturePath": "",
    "intensity": 0.0005,
    "noise": {
      "primary": {
        "speed": 97,
        "scale": 0.5,
        "octaves": 2,
        "lacunarity": 2.2,
        "persistence": 0.45
      },
      "secondary": {
        "speed": 79,
        "scale": 3.5,
        "octaves": 3,
        "lacunarity": 3.8,
        "persistence": 0.3
      },
      "rising": {
        "speed": 0.077,
        "intensity": 0.4
      }
    }
  },
  "sceneAppearance": {
    "transitionDuration": 3500
  },
  "postProcessing": {
    "enabled": true,
    "colorCorrection": {
      "enabled": true,
      "saturation": 0.7,
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
        "color": "#fb0045",
        "hueRange": 0.09,
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
          "points": [
            {
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
          "points": [
            {
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
          "points": [
            {
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
          "points": [
            {
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
        "enabled": false,
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
      "enabled": false,
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
    "grain": {
      "enabled": false,
      "intensity": 0.1,
      "size": 1.5,
      "monochromatic": true,
      "luminanceResponse": {
        "shadows": 0.8,
        "highlights": 0.2
      }
    },
    "lut": {
      "enabled": true,
      "texturePath": "",
      "intensity": 1,
      "presetName": "custom"
    }
  },
  "dust": {
    "enabled": true,
    "blendMode": 0,
    "maskThreshold": 0.39,
    "maskInfluence": 1.48,
    "particleTexture": "modules/map-shine/assets/particle.webp",
    "frequency": 0.234,
    "lifetime": {
      "min": 4,
      "max": 12
    },
    "colorAlphaGradient": [
      {
        "time": 0,
        "color": "#ffbc40",
        "alpha": 0
      },
      {
        "time": 0.1,
        "color": "#ffc242",
        "alpha": 0.15
      },
      {
        "time": 0.97,
        "color": "#fff955",
        "alpha": 0.69
      },
      {
        "time": 1,
        "color": "#fffb55",
        "alpha": 0
      }
    ],
    "emissiveGradient": [
      {
        "time": 0,
        "color": "#ffbc40",
        "alpha": 0.51
      },
      {
        "time": 1,
        "color": "#fffb55",
        "alpha": 0.48
      }
    ],
    "scale": {
      "sizeMultiplier": 0.6,
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
    "colorAlphaGradient": [
      {
        "time": 0,
        "color": "#FFFFFF",
        "alpha": 0
      },
      {
        "time": 0.055,
        "color": "#FFFFFF",
        "alpha": 0.95
      },
      {
        "time": 1,
        "color": "#FFFFFF",
        "alpha": 0
      }
    ],
    "emissiveGradient": [
      {
        "time": 0,
        "color": "#000000",
        "alpha": 1
      },
      {
        "time": 1,
        "color": "#000000",
        "alpha": 1
      }
    ],
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
  "metallicGlints": {
    "enabled": true,
    "blendMode": 1,
    "maskThreshold": 0.93,
    "maskInfluence": 3.92,
    "particleTexture": "modules/map-shine/assets/glint.webp",
    "frequency": 0.33,
    "lifetime": {
      "min": 4.7,
      "max": 8.9
    },
    "colorAlphaGradient": [
      {
        "time": 0,
        "color": "#FFFFFF",
        "alpha": 0
      },
      {
        "time": 0.2066580908571582,
        "color": "#FFFFFF",
        "alpha": 1
      },
      {
        "time": 1,
        "color": "#FFFFFF",
        "alpha": 0
      }
    ],
    "emissiveGradient": [
      {
        "time": 0,
        "color": "#000000",
        "alpha": 1
      },
      {
        "time": 0.24097173100375402,
        "color": "#393939",
        "alpha": 1
      },
      {
        "time": 1,
        "color": "#000000",
        "alpha": 1
      }
    ],
    "scale": {
      "sizeMultiplier": 4.1,
      "start": 0.11,
      "end": 1.15,
      "minMult": 0.78
    },
    "speed": {
      "start": 0,
      "end": 0,
      "minMult": 0.1
    },
    "rotation": {
      "enabled": true,
      "minSpeed": -2,
      "maxSpeed": 2,
      "accel": 0
    }
  },
  "biofilm": {
    "enabled": true,
    "blendMode": 1,
    "maskThreshold": 0.2,
    "maskUpperThreshold": 0.6,
    "maskInfluence": 5,
    "particleTexture": "modules/map-shine/assets/foam.webp",
    "frequency": 0.097,
    "lifetime": {
      "min": 4,
      "max": 12
    },
    "colorAlphaGradient": [
      {
        "time": 0,
        "color": "#d1d1d1",
        "alpha": 0
      },
      {
        "time": 0.18567455586416937,
        "color": "#53e3fd",
        "alpha": 0.12
      },
      {
        "time": 1,
        "color": "#232e1f",
        "alpha": 0
      }
    ],
    "emissiveGradient": [
      {
        "time": 0,
        "color": "#ffffff",
        "alpha": 1
      },
      {
        "time": 0.1919332487584672,
        "color": "#ffffff",
        "alpha": 0.02
      },
      {
        "time": 1,
        "color": "#ffffff",
        "alpha": 1
      }
    ],
    "scale": {
      "sizeMultiplier": 3.1,
      "start": 0.2,
      "end": 2,
      "minMult": 1
    },
    "speed": {
      "start": 1,
      "end": 3,
      "minMult": 0.5
    },
    "rotation": {
      "enabled": false,
      "minSpeed": 0,
      "maxSpeed": 20,
      "accel": 0
    }
  },
  "water": {
    "enabled": true,
    "depthDisplacement": {
      "enabled": false,
      "strength": 0,
      "darken": 0.05,
      "wallColor": "#0a2914",
      "wallIntensity": 1,
      "wallSmearBlend": 0
    },
    "flow": {
      "enabled": false,
      "angle": 0,
      "speed": 50
    },
    "wave": {
      "enabled": true,
      "speed": 0.5,
      "scale": 1.5,
      "intensity": 0.0035,
      "biofilmDistortion": {
        "enabled": false,
        "intensity": 0.5
      },
      "rainRipple": {
        "enabled": true,
        "speed": 3.6,
        "scale": 2.1,
        "intensity": 0.0016
      }
    },
    "murkiness": {
      "enabled": true,
      "color": "#24442c",
      "wavyNoise": {
        "strength": 0.28,
        "scale": 0.28,
        "speed": 0.04
      },
      "sandyNoise": {
        "strength": 0.28,
        "scale": 1,
        "speed": 0.5,
        "modulationScale": 3,
        "modulationSpeed": 0.01,
        "modulationStrength": 0.5
      }
    },
    "surface": {
      "enabled": true,
      "foamColor": "#eff1f0",
      "foamIntensity": 2,
      "foamCoverage": 0.33,
      "foamSharpness": 0.34,
      "fbmScale": 15.196,
      "fbmSpeed": 0.01,
      "fbmEvolution": 0.03,
      "fbmOctaves": 5,
      "fbmLacunarity": 4,
      "fbmPersistence": 0.1,
      "specularity": {
        "enabled": true,
        "color": "#FFFFFF",
        "intensity": 0.53,
        "shininess": 278,
        "lightAngle": 90,
        "lightElevation": 45,
        "cloudOcclusion": {
          "enabled": true,
          "intensity": 1
        }
      }
    },
    "caustics": {
      "enabled": true,
      "intensity": 0.033,
      "scale": 0.3,
      "speed": 2,
      "color": "#bbffbe",
      "lineSharpness": 1,
      "bloomIntensity": 1,
      "lineDistortion": 0.49,
      "lineDistortionScale": 0.1,
      "intersectionBoost": 20,
      "roughnessScale": 1.6,
      "roughnessIntensity": 0.83,
      "cloudOcclusion": {
        "enabled": true,
        "intensity": 1
      }
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
      }
    },
    "puddles": {
      "enabled": true,
      "darkening": 0.2,
      "dryingTimeMinutes": 10
    },
    "glintParticles": {
      "enabled": false,
      "blendMode": 9,
      "maskThreshold": 0.17,
      "maskInfluence": 1.95,
      "particleTexture": "modules/map-shine/assets/glint.webp",
      "frequency": 0.99,
      "lifetime": {
        "min": 0.8,
        "max": 0.8
      },
      "colorAlphaGradient": [
        {
          "time": 0,
          "color": "#FFFFFF",
          "alpha": 0
        },
        {
          "time": 0.1,
          "color": "#FFFFFF",
          "alpha": 0.8
        },
        {
          "time": 1,
          "color": "#FFFFFF",
          "alpha": 0
        }
      ],
      "emissiveGradient": [
        {
          "time": 0,
          "color": "#000000",
          "alpha": 1
        },
        {
          "time": 1,
          "color": "#000000",
          "alpha": 1
        }
      ],
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
  "foam": {
    "enabled": false,
    "blendMode": 1,
    "smallBlur": 9,
    "largeBlur": 75,
    "intensity": 4.15,
    "threshold": 0.07,
    "softness": 0.26,
    "color": "#FFFFFF",
    "noise": {
      "scale": 15,
      "speed": 0.02,
      "evolution": 0.076,
      "octaves": 4,
      "lacunarity": 2.2,
      "persistence": 0.45
    },
    "breakupNoise": {
      "enabled": true,
      "scale": 2.5,
      "evolution": 0.01,
      "octaves": 5,
      "lacunarity": 2.8,
      "persistence": 0.35,
      "brightness": 0.4,
      "contrast": 1.2
    },
    "suppressionNoise": {
      "enabled": true,
      "scale": 2.5,
      "speed": 0.005,
      "evolution": 0.01,
      "octaves": 4,
      "lacunarity": 2,
      "persistence": 0.5,
      "brightness": 0.5,
      "contrast": 1
    },
    "blurTurbulence": {
      "strength": 8,
      "scale": 0.5,
      "speed": 0.029
    },
    "crestFoam": {
      "enabled": false,
      "intensity": 1.8,
      "frequency": 35,
      "speed": 0.03,
      "angle": 15,
      "sharpness": 12,
      "perturbStrength": 35,
      "perturbScale": 0.04,
      "perturbSpeed": 0.01,
      "perturbOctaves": 4,
      "crestBreakup": {
        "scale": 0.35,
        "speed": 0.08,
        "octaves": 3,
        "brightness": 0.45,
        "contrast": 1.8
      }
    }
  },
  "fire": {
    "enabled": true,
    "particles": {
      "enabled": true,
      "blendMode": 9,
      "maskThreshold": 0.86,
      "maskInfluence": 0.31,
      "particleTexture": "modules/map-shine/assets/flame.webp",
      "frequency": 0.01,
      "lifetime": {
        "min": 1.5,
        "max": 1.6
      },
      "toneCurve": {
        "enabled": true,
        "contrast": 2.11,
        "gamma": 1.66,
        "knee": 1,
        "coreClamp": 1.5
      },
      "colorAlphaGradient": [
        {
          "time": 0,
          "color": "#ff4b17",
          "alpha": 0.86
        },
        {
          "time": 0.15959805298756874,
          "color": "#ff381c",
          "alpha": 0.52
        },
        {
          "time": 0.36506020529686556,
          "color": "#ff731e",
          "alpha": 0.35
        },
        {
          "time": 0.6193617216796837,
          "color": "#9e4712",
          "alpha": 0.06
        },
        {
          "time": 0.8046144819585578,
          "color": "#000000",
          "alpha": 0
        },
        {
          "time": 0.9511325741791219,
          "color": "#000000",
          "alpha": 0
        },
        {
          "time": 1,
          "color": "#000000",
          "alpha": 0
        }
      ],
      "emissiveGradient": [
        {
          "time": 0,
          "color": "#ffffff",
          "alpha": 0
        },
        {
          "time": 0.16296628499263918,
          "color": "#ff430d",
          "alpha": 0.939726181956534
        },
        {
          "time": 0.32901698049752587,
          "color": "#ff6a11",
          "alpha": 0.78
        },
        {
          "time": 0.7404077104527316,
          "color": "#622806",
          "alpha": 0.01
        },
        {
          "time": 0.999,
          "color": "#000000",
          "alpha": 0
        },
        {
          "time": 1,
          "color": "#000000",
          "alpha": 0
        }
      ],
      "scale": {
        "sizeMultiplier": 0.87,
        "start": 0.63,
        "end": 1.31,
        "minMult": 0.84
      },
      "speed": {
        "start": 0.5,
        "end": 1,
        "minMult": 0.24
      },
      "rotation": {
        "enabled": true,
        "minSpeed": -11,
        "maxSpeed": 11,
        "accel": -2
      },
      "wind": {
        "enabled": true,
        "force": 3,
        "baseSpeed": 34,
        "gustSpeed": 99,
        "gustFrequencyMin": 1,
        "gustFrequencyMax": 1.8,
        "gustDurationMin": 0.4,
        "gustDurationMax": 1.6,
        "angleChangeFrequencyMin": 3,
        "angleChangeFrequencyMax": 57,
        "angleChangeRange": 5
      },
      "colorCorrection": {
        "enabled": true,
        "saturation": 2,
        "brightness": 0,
        "contrast": 2.6,
        "exposure": -1.35,
        "gamma": 2.6
      }
    }
  },
  "candleFlame": {
    "enabled": false,
    "blendMode": 1,
    "particleTexture": "modules/map-shine/assets/particle.webp",
    "frequency": 0.002,
    "lifetime": {
      "min": 0.8,
      "max": 1.2
    },
    "colorAlphaGradient": [
      {
        "time": 0,
        "color": "#FFEFD5",
        "alpha": 0
      },
      {
        "time": 0.08516129702946203,
        "color": "#FFD700",
        "alpha": 0.49
      },
      {
        "time": 0.16321849401205915,
        "color": "#ff6000",
        "alpha": 0.4481915080797534
      },
      {
        "time": 1,
        "color": "#FFA500",
        "alpha": 0
      }
    ],
    "emissiveGradient": [
      {
        "time": 0,
        "color": "#FFFFFF",
        "alpha": 0
      },
      {
        "time": 0.08903226507625575,
        "color": "#ffa94a",
        "alpha": 0.82
      },
      {
        "time": 1,
        "color": "#FFD700",
        "alpha": 0
      }
    ],
    "scale": {
      "sizeMultiplier": 2,
      "start": 2,
      "end": 0.92,
      "minMult": 0.8
    },
    "jiggle": {
      "upwardVelocity": -20,
      "amplitude": 51,
      "frequency": 0.6,
      "risingFactor": 4.2
    }
  },
  "pressurisedSteam": {
    "enabled": false,
    "blendMode": 1,
    "maskThreshold": 0.5,
    "maskInfluence": 0.24,
    "particleTexture": "modules/map-shine/assets/steam.webp",
    "lifetime": {
      "min": 0.5,
      "max": 2
    },
    "colorAlphaGradient": [
      {
        "time": 0,
        "color": "#ffffff",
        "alpha": 0
      },
      {
        "time": 0.1,
        "color": "#eeeeee",
        "alpha": 0.8
      },
      {
        "time": 0.7,
        "color": "#dddddd",
        "alpha": 0.4
      },
      {
        "time": 1,
        "color": "#cccccc",
        "alpha": 0
      }
    ],
    "emissiveGradient": [
      {
        "time": 0,
        "color": "#000000",
        "alpha": 1
      },
      {
        "time": 1,
        "color": "#000000",
        "alpha": 1
      }
    ],
    "scale": {
      "sizeMultiplier": 1.8,
      "start": 0.2,
      "end": 1.5,
      "minMult": 0.7
    },
    "speed": {
      "start": 250,
      "end": 20,
      "minMult": 0.8
    },
    "rotation": {
      "enabled": true,
      "minSpeed": -60,
      "maxSpeed": 60,
      "accel": 0
    },
    "path": {
      "angle": {
        "min": -100,
        "max": -80
      }
    },
    "burst": {
      "onDuration": 10,
      "offDuration": 10,
      "frequency": 0.005
    }
  },
  "sparks": {
    "enabled": false,
    "blendMode": 1,
    "maskThreshold": 0.95,
    "maskInfluence": 1.12,
    "particleTexture": "modules/map-shine/assets/particle.webp",
    "frequency": 0.08,
    "lifetime": {
      "min": 1.5,
      "max": 3
    },
    "colorAlphaGradient": [
      {
        "time": 0,
        "color": "#ffbc40",
        "alpha": 0
      },
      {
        "time": 0.10273972817490937,
        "color": "#b9e4ff",
        "alpha": 0.94
      },
      {
        "time": 0.5219178191285396,
        "color": "#aeda49",
        "alpha": 0.69
      },
      {
        "time": 0.97,
        "color": "#fff955",
        "alpha": 0.69
      },
      {
        "time": 1,
        "color": "#fffb55",
        "alpha": 0
      }
    ],
    "emissiveGradient": [
      {
        "time": 0,
        "color": "#000000",
        "alpha": 1
      },
      {
        "time": 0.11095890642890212,
        "color": "#ffffff",
        "alpha": 1
      },
      {
        "time": 1,
        "color": "#000000",
        "alpha": 1
      }
    ],
    "scale": {
      "sizeMultiplier": 1.55,
      "start": 1,
      "end": 0.1,
      "minMult": 0.5
    },
    "path": {
      "speed": {
        "start": 114,
        "end": 27,
        "minMult": 0.99
      },
      "amplitude": {
        "min": 10,
        "max": 100
      },
      "frequency": {
        "min": 40,
        "max": 189
      },
      "offset": {
        "min": 0,
        "max": 6.28
      },
      "damping": 0.05,
      "angle": {
        "min": -90,
        "max": 90
      },
      "motionBlur": {
        "enabled": true,
        "strength": 0.15,
        "maxLength": 2.4
      }
    }
  },
  "lightning": {
    "enabled": true,
    "minDelay": 100,
    "maxDelay": 5000,
    "flickerChance": 0.55,
    "burstMinStrikes": 1,
    "burstMaxStrikes": 10,
    "burstStrikeDuration": 150,
    "burstStrikeDelay": 300,
    "endPointVariationX": 200,
    "endPointVariationY": 200,
    "offPeriodMin": 1,
    "offPeriodMax": 1761,
    "strikeDuration": 1500,
    "flickerInterval": 96,
    "flickerIntensity": 0.51,
    "fadeEasePower": 2,
    "color": "#99DDFF",
    "coreColor": "#FFFFFF",
    "brightness": 2.9,
    "sheathOpacity": 1,
    "coreOpacity": 1,
    "width": {
      "start": 47.5,
      "end": 16.1,
      "variationEnabled": true,
      "variationAmount": 0.5,
      "variationScale": 0.1,
      "variationSpeed": 0.1
    },
    "coreWidth": {
      "start": 14.1,
      "end": 4.8
    },
    "path": {
      "segments": 100,
      "endPointRandomness": 15
    },
    "curve": {
      "startAngleMin": -45,
      "startAngleMax": 45,
      "endAngleMin": 135,
      "endAngleMax": 225,
      "controlPointDistanceMin": 100,
      "controlPointDistanceMax": 160
    },
    "fork": {
      "maxDepth": 4,
      "chance": 1,
      "angleRange": 168,
      "lengthFalloff": 0.7,
      "widthFalloff": 0.86
    },
    "displacement": {
      "enabled": true,
      "magnitude": 15,
      "speed": 0.2,
      "scale": 0.05
    },
    "displacementFine": {
      "enabled": true,
      "magnitude": 5,
      "speed": 0.1,
      "scale": 0.005
    }
  },
  "smellyFlies": {
    "enabled": true,
    "blendMode": 0,
    "particleTexture": "modules/map-shine/assets/fly.webp",
    "maxParticles": 10,
    "flying": {
      "takeoffDuration": 0.5,
      "takeoffSpeedMin": 100,
      "takeoffSpeedMax": 200,
      "noiseStrength": 2000,
      "noiseFrequency": 25,
      "tetherStrength": 15.8,
      "maxSpeed": 1000,
      "drag": 0.8,
      "landChance": 0.05,
      "landingDuration": 1
    },
    "walking": {
      "walkSpeed": 60,
      "minIdleTime": 0.5,
      "maxIdleTime": 2.5,
      "minRotateTime": 0.2,
      "maxRotateTime": 0.7,
      "minMoveTime": 0.3,
      "maxMoveTime": 5.3,
      "minMoveDistance": 5,
      "maxMoveDistance": 95,
      "takeoffChance": 0.05
    },
    "motionBlur": {
      "enabled": true,
      "strength": 0.03,
      "maxLength": 1.6
    }
  },
  "particleSystems": {
    "enabled": true,
    "globalDensityMultiplier": 0.95,
    "globalParticleLimit": 3500
  },
  "buildingShadows": {
    "enabled": false,
    "intensity": 0.67,
    "maxOffset": 93,
    "maxBlur": 50,
    "sunAngle": 3
  },
  "timeOfDay": {
    "enabled": true,
    "syncToSceneDarkness": true,
    "syncFromFoundryTime": false,
    "intensity": 2,
    "currentTime": 12.666666666666664,
    "keyframes": {
      "midnight": {
        "time": 0,
        "temperature": -0.22,
        "tint": 0.02,
        "saturation": 0.5,
        "brightness": -0.01,
        "contrast": 0.99,
        "exposure": 0,
        "gamma": 1
      },
      "dawn": {
        "time": 6,
        "temperature": 1,
        "tint": 0,
        "saturation": 1.33,
        "brightness": 0,
        "contrast": 1,
        "exposure": 0,
        "gamma": 1
      },
      "midday": {
        "time": 12,
        "temperature": 0,
        "tint": 0,
        "saturation": 1.1,
        "brightness": 0,
        "contrast": 1,
        "exposure": 0.25,
        "gamma": 1
      },
      "dusk": {
        "time": 18,
        "temperature": 1,
        "tint": -0.25,
        "saturation": 1,
        "brightness": 0,
        "contrast": 1,
        "exposure": 0,
        "gamma": 1
      },
      "twilight": {
        "time": 21,
        "temperature": -0.44,
        "tint": -0.42,
        "saturation": 0.55,
        "brightness": 0,
        "contrast": 1,
        "exposure": -0.55,
        "gamma": 1
      }
    }
  },
  "diagnostic": {
    "enabled": false,
    "showMasks": true,
    "pixelInspector": false,
    "displaySuffix": "structural"
  },
  "physicsRope": {
    "enabled": true,
    "rope": {
      "texturePath": "modules/map-shine/assets/rope.webp",
      "segmentLength": 10,
      "animationSpeed": 1,
      "damping": 0.99,
      "windForce": 1,
      "springConstant": 0.8,
      "tapering": 0.5,
      "ropeEndTexturePath": null,
      "ropeEndScale": 1,
      "indoorWindShielding": 0.9,
      "endpointFade": 0,
      "fadeStartDistance": 0.2,
      "fadeEndDistance": 0.2
    },
    "chain": {
      "texturePath": "modules/map-shine/assets/rope.webp",
      "segmentLength": 15,
      "animationSpeed": 0.8,
      "damping": 0.95,
      "windForce": 0.3,
      "springConstant": 0.8,
      "tapering": 0.2,
      "ropeEndTexturePath": null,
      "ropeEndScale": 1,
      "indoorWindShielding": 0.7,
      "endpointFade": 0,
      "fadeStartDistance": 0.2,
      "fadeEndDistance": 0.2
    },
    "elastic": {
      "texturePath": "modules/map-shine/assets/rope.webp",
      "segmentLength": 8,
      "animationSpeed": 1.2,
      "damping": 0.98,
      "windForce": 1.5,
      "springConstant": 0.8,
      "tapering": 0.7,
      "ropeEndTexturePath": null,
      "ropeEndScale": 1,
      "indoorWindShielding": 0.95,
      "endpointFade": 0,
      "fadeStartDistance": 0.2,
      "fadeEndDistance": 0.2
    }
  },
  "overheadEffect": {
    "enabled": true,
    "blurMinZoom": 0,
    "blurMidZoom": 0,
    "blurMaxZoom": 0,
    "opacityMinZoom": 1,
    "opacityMidZoom": 0,
    "opacityMaxZoom": 0,
    "zoomPointMin": 0.2,
    "zoomPointMid": 0.3,
    "zoomPointMax": 1.5,
    "timeOfDayStrength": 0,
    "recolor": {
      "enabled": true,
      "intensity": 1,
      "blendMode": 1,
      "cloudShadowDarken": {
        "enabled": true,
        "intensity": 1
      }
    },
    "hoverFadeDuration": 500,
    "tokenMasking": {
      "enabled": true,
      "blurAmount": 10
    },
    "buildingShadows": {
      "enabled": true,
      "intensity": 1
    }
  },
  "ambientLayerZIndex": 250,
  "weather": {
    "enabled": true,
    "currentState": "storm",
    "transitionDuration": 30000,
    "windIntensityMultiplier": 0.5,
    "statePresets": {
      "clear": {
        "name": "Clear",
        "cloudDensity": 0.2,
        "cloudThreshold": 0.7,
        "cloudSoftness": 0.3,
        "precipitationIntensity": 0,
        "precipitationType": "none",
        "particleCount": 0,
        "atmosphericTint": {
          "r": 1,
          "g": 1,
          "b": 1
        },
        "colorCorrection": {
          "saturation": 1,
          "contrast": 1,
          "brightness": 1
        },
        "windMultipliers": {
          "baseSpeed": 0.6,
          "gustSpeed": 0.7,
          "gustFrequency": 1.2,
          "gustDuration": 1,
          "angleChangeFrequency": 1.2,
          "angleChangeRange": 0.8
        },
        "foliageMultipliers": {
          "rustleSpeed": 0.7,
          "swaySpeed": 0.6
        },
        "description": "Sunny day with minimal cloud coverage",
        "cloudWind": {
          "maxSpeed": 3,
          "force": 0.4,
          "drag": 0.85
        }
      },
      "partly-cloudy": {
        "name": "Partly Cloudy",
        "cloudDensity": 0.4,
        "cloudThreshold": 0.6,
        "cloudSoftness": 0.4,
        "precipitationIntensity": 0,
        "precipitationType": "none",
        "particleCount": 0,
        "atmosphericTint": {
          "r": 0.98,
          "g": 0.98,
          "b": 1
        },
        "colorCorrection": {
          "saturation": 1.05,
          "contrast": 1.02,
          "brightness": 1.03
        },
        "windMultipliers": {
          "baseSpeed": 0.7,
          "gustSpeed": 0.8,
          "gustFrequency": 1.1,
          "gustDuration": 1,
          "angleChangeFrequency": 1.1,
          "angleChangeRange": 0.9
        },
        "foliageMultipliers": {
          "rustleSpeed": 0.8,
          "swaySpeed": 0.7
        },
        "description": "Bright sunny day with scattered white clouds",
        "cloudWind": {
          "maxSpeed": 4,
          "force": 0.45,
          "drag": 0.8
        }
      },
      "drizzle": {
        "name": "Drizzle",
        "cloudDensity": 0.4,
        "cloudThreshold": 0.5,
        "cloudSoftness": 0.4,
        "precipitationIntensity": 0.3,
        "precipitationType": "rain",
        "particleCount": 200,
        "atmosphericTint": {
          "r": 0.95,
          "g": 0.95,
          "b": 1
        },
        "colorCorrection": {
          "saturation": 0.95,
          "contrast": 0.98,
          "brightness": 1
        },
        "windMultipliers": {
          "baseSpeed": 0.8,
          "gustSpeed": 0.85,
          "gustFrequency": 1.1,
          "gustDuration": 1,
          "angleChangeFrequency": 1,
          "angleChangeRange": 1
        },
        "foliageMultipliers": {
          "rustleSpeed": 0.9,
          "swaySpeed": 0.85
        },
        "description": "Light rain with moderate cloud coverage",
        "cloudWind": {
          "maxSpeed": 5,
          "force": 0.5,
          "drag": 0.75
        }
      },
      "rain": {
        "name": "Rain",
        "cloudDensity": 0.6,
        "cloudThreshold": 0.4,
        "cloudSoftness": 0.5,
        "precipitationIntensity": 0.6,
        "precipitationType": "rain",
        "particleCount": 500,
        "atmosphericTint": {
          "r": 0.9,
          "g": 0.9,
          "b": 0.95
        },
        "colorCorrection": {
          "saturation": 0.85,
          "contrast": 0.95,
          "brightness": 0.98
        },
        "windMultipliers": {
          "baseSpeed": 1,
          "gustSpeed": 1,
          "gustFrequency": 1,
          "gustDuration": 1,
          "angleChangeFrequency": 1,
          "angleChangeRange": 1
        },
        "foliageMultipliers": {
          "rustleSpeed": 1,
          "swaySpeed": 1
        },
        "description": "Steady rainfall with heavy clouds",
        "cloudWind": {
          "maxSpeed": 8,
          "force": 0.65,
          "drag": 0.7
        }
      },
      "storm": {
        "name": "Storm",
        "cloudDensity": 0.8,
        "cloudThreshold": 0.3,
        "cloudSoftness": 0.6,
        "precipitationIntensity": 0.9,
        "precipitationType": "rain",
        "particleCount": 800,
        "atmosphericTint": {
          "r": 0.7,
          "g": 0.75,
          "b": 0.8
        },
        "colorCorrection": {
          "saturation": 0.6,
          "contrast": 0.85,
          "brightness": 0.92
        },
        "windMultipliers": {
          "baseSpeed": 1.4,
          "gustSpeed": 1.6,
          "gustFrequency": 0.4,
          "gustDuration": 1.3,
          "angleChangeFrequency": 0.7,
          "angleChangeRange": 1.8
        },
        "foliageMultipliers": {
          "rustleSpeed": 2,
          "swaySpeed": 2.2
        },
        "description": "Heavy rain with strong wind and dark storm clouds",
        "cloudWind": {
          "maxSpeed": 15,
          "force": 0.9,
          "drag": 0.5
        }
      },
      "sleet": {
        "name": "Sleet",
        "cloudDensity": 0.7,
        "cloudThreshold": 0.35,
        "cloudSoftness": 0.5,
        "precipitationIntensity": 0.7,
        "precipitationType": "sleet",
        "particleCount": 600,
        "atmosphericTint": {
          "r": 0.85,
          "g": 0.9,
          "b": 1
        },
        "colorCorrection": {
          "saturation": 0.75,
          "contrast": 0.92,
          "brightness": 0.96
        },
        "windMultipliers": {
          "baseSpeed": 1.1,
          "gustSpeed": 1.2,
          "gustFrequency": 0.9,
          "gustDuration": 1.1,
          "angleChangeFrequency": 0.9,
          "angleChangeRange": 1.2
        },
        "foliageMultipliers": {
          "rustleSpeed": 1.3,
          "swaySpeed": 1.4
        },
        "description": "Mixed rain and snow with cold atmosphere",
        "cloudWind": {
          "maxSpeed": 10,
          "force": 0.7,
          "drag": 0.65
        }
      },
      "snow": {
        "name": "Snow",
        "cloudDensity": 0.6,
        "cloudThreshold": 0.4,
        "cloudSoftness": 0.6,
        "precipitationIntensity": 0.5,
        "precipitationType": "snow",
        "particleCount": 400,
        "atmosphericTint": {
          "r": 0.95,
          "g": 0.97,
          "b": 1
        },
        "colorCorrection": {
          "saturation": 0.8,
          "contrast": 0.95,
          "brightness": 1.02
        },
        "windMultipliers": {
          "baseSpeed": 0.9,
          "gustSpeed": 0.9,
          "gustFrequency": 1.2,
          "gustDuration": 1,
          "angleChangeFrequency": 1.1,
          "angleChangeRange": 0.9
        },
        "foliageMultipliers": {
          "rustleSpeed": 0.8,
          "swaySpeed": 0.75
        },
        "description": "Snowfall with dense white clouds",
        "cloudWind": {
          "maxSpeed": 6,
          "force": 0.55,
          "drag": 0.8
        }
      },
      "blizzard": {
        "name": "Blizzard",
        "cloudDensity": 0.9,
        "cloudThreshold": 0.25,
        "cloudSoftness": 0.7,
        "precipitationIntensity": 1,
        "precipitationType": "snow",
        "particleCount": 1000,
        "atmosphericTint": {
          "r": 0.9,
          "g": 0.92,
          "b": 1
        },
        "colorCorrection": {
          "saturation": 0.65,
          "contrast": 0.88,
          "brightness": 0.95
        },
        "windMultipliers": {
          "baseSpeed": 1.5,
          "gustSpeed": 1.7,
          "gustFrequency": 0.35,
          "gustDuration": 1.4,
          "angleChangeFrequency": 0.6,
          "angleChangeRange": 2
        },
        "foliageMultipliers": {
          "rustleSpeed": 2.3,
          "swaySpeed": 2.5
        },
        "description": "Heavy snow with strong wind and thick cloud coverage",
        "cloudWind": {
          "maxSpeed": 20,
          "force": 1,
          "drag": 0.3
        }
      }
    },
    "rain": {
      "opacity": 1,
      "intensity": 2.95,
      "strength": 0.55,
      "speed": 0.15,
      "rainDensity": 100,
      "gridSize": 165,
      "streakLength": 90,
      "splashIntensity": 0.1,
      "waveMaskIntensity": 1,
      "curtainIntensity": 1,
      "worleySpeed": 1,
      "tint": {
        "r": 0.7,
        "g": 0.9,
        "b": 0.99
      }
    },
    "snow": {
      "direction": 0.5,
      "speed": 2,
      "scale": 2,
      "animationSpeed": 0.9,
      "tint": {
        "r": 1,
        "g": 1,
        "b": 1
      }
    },
    "fog": {
      "intensity": 0.75,
      "rotation": 0,
      "slope": 2,
      "speed": -4,
      "animationSpeed": 0.4,
      "tint": {
        "r": 1,
        "g": 1,
        "b": 1
      }
    },
    "edgeDroplets": {
      "enabled": true,
      "maxParticles": 500,
      "spawnRate": 200,
      "edgeDetectionMethod": "grid",
      "gridSize": 8,
      "edgeThreshold": 1,
      "outdoorThreshold": 1,
      "spreadRadius": 16,
      "edgeUpdateFrequency": 10,
      "updateFrequency": 0.85,
      "frequency": 0.019,
      "emitDuration": 0.2,
      "autoUpdate": false,
      "opacity": 0.4,
      "fadeInDuration": 0.2,
      "fadeOutStart": 0.94,
      "splashOpacity": 0.3,
      "lifetime": {
        "min": 0.7,
        "max": 1.8
      },
      "size": {
        "min": 0.12,
        "max": 0.48
      },
      "sizeVariation": 4.25,
      "color": {
        "r": 0.81,
        "g": 0.91,
        "b": 1
      },
      "matchRainTint": true,
      "matchRainOpacity": true,
      "windForce": 3.81,
      "windAccelerationTime": 0.3,
      "turbulence": 2,
      "groundCollisionAge": 0.95,
      "enableGroundCollision": true,
      "velocityStopAge": 0.9,
      "windInfluence": 2,
      "initialVelocity": 0,
      "motionBlur": {
        "strength": 1.1,
        "maxLength": 30
      },
      "splashSizeMultiplier": 26,
      "splashTransitionTime": 0.001
    },
    "orchestrator": {
      "enabled": false,
      "temperatureMin": 10,
      "temperatureMax": 25,
      "humidityMin": 40,
      "humidityMax": 80,
      "temperatureCurrent": 18,
      "humidityCurrent": 60,
      "tempMomentum": 0,
      "humidityMomentum": 0,
      "tickInterval": 60,
      "tempStepSize": 0.5,
      "humidityStepSize": 2,
      "momentum": 0.7,
      "transitionDuration": 10000,
      "seasonalBias": false,
      "diceType": "2d6",
      "narrativeOverride": {
        "enabled": false,
        "targetState": "storm",
        "forceStrength": 0.3,
        "onReached": "resume"
      }
    },
    "performance": {
      "cullOutsideViewport": false,
      "lodEnabled": false,
      "lodDistanceThreshold": 2000,
      "lodReductionFactor": 0.5,
      "maxParticles": 2000
    }
  }
};
