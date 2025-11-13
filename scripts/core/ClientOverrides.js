import { MODULE_ID } from "../config/constants.js";

export const CLIENT_OVERRIDES_CONFIG = {
  baseShine: {
    name: "Metallic Shine",
    path: "baseShine",
    intensitySubPath: "animation.globalIntensity",
    tooltip:
      "Creates an animated, reflective sheen on surfaces, like polished metal or wet stone.",
  },
  cloudShadows: {
    name: "Cloud Shadows",
    path: "cloudShadows",
    intensitySubPath: "shadowIntensity",
    tooltip:
      "Simulates the shadows of moving clouds passing over outdoor areas of the map.",
  },
  canopy: {
    name: "Canopy Shadows",
    path: "canopy",
    intensitySubPath: "shadowIntensity",
    tooltip:
      "Creates dappled, animated shadows, as if light is filtering through a forest canopy.",
  },
  structuralShadows: {
    name: "Structural Shadows",
    path: "structuralShadows",
    intensitySubPath: "intensity",
    tooltip:
      "Creates indoor shadows from structural elements like rafters, beams, and pillars.",
  },
  iridescence: {
    name: "Iridescence",
    path: "iridescence",
    intensitySubPath: "intensity",
    tooltip: "Creates a colorful, shimmering oil-slick or soap-bubble effect.",
  },
  ambient: {
    name: "Ambient / Emissive",
    path: "ambient",
    intensitySubPath: "intensity",
    tooltip:
      "Makes parts of the map glow, such as lava, magic runes, or glowing crystals.",
  },
  groundGlow: {
    name: "Glow in the Dark",
    path: "groundGlow",
    intensitySubPath: "intensity",
    tooltip:
      "Makes a texture appear to glow only in the dark areas of the scene.",
  },
  heatDistortion: {
    name: "Heat Distortion",
    path: "heatDistortion",
    intensitySubPath: "intensity",
    tooltip:
      "Creates a rising heat-haze effect that distorts the view, ideal for fire or deserts.",
  },
  prism: {
    name: "Prism Effect",
    path: "prism",
    intensitySubPath: "intensity",
    tooltip:
      "Splits the light in bright areas of the scene, creating a rainbow-like fringe effect.",
  },
  postProcessing: {
    name: "Post-Processing Effects",
    path: "postProcessing",
    tooltip:
      "A group of cinematic effects like color grading, vignettes, and lens effects that are applied to the entire screen.",
  },
  dust: {
    name: "Dust Motes",
    path: "dust",
    intensitySubPath: "maskInfluence",
    tooltip:
      "Adds gently floating dust particles that are visible in well-lit areas.",
  },
  glint: {
    name: "Glint Particles",
    path: "glint",
    intensitySubPath: "maskInfluence",
    tooltip:
      "Adds tiny, bright sparkles to highly reflective or magical surfaces.",
  },
  metallicGlints: {
    name: "Metallic Glints",
    path: "metallicGlints",
    intensitySubPath: "maskInfluence",
    tooltip:
      "Adds colored sparkles to the brightest highlights on metallic surfaces.",
  },
  fire: {
    name: "Fire Particles",
    path: "fire.particles",
    intensitySubPath: "maskInfluence",
    tooltip:
      "Generates animated flame particles for campfires, torches, and other fire sources.",
  },
  sparks: {
    name: "Sparks",
    path: "sparks",
    intensitySubPath: "maskInfluence",
    tooltip:
      "Emits energetic sparks that fly off in turbulent paths, suitable for forges or electrical effects.",
  },
  biofilm: {
    name: "Biofilm",
    path: "biofilm",
    intensitySubPath: "maskInfluence",
    tooltip: "Adds scummy biofilm particles to water surfaces.",
  },
  lightning: {
    name: "Lightning",
    path: "lightning",
    intensitySubPath: "brightness",
    tooltip:
      "Generates procedural bolts of lightning between two points defined on the map.",
  },
  timeOfDay: {
    name: "Time of Day Color Grade",
    path: "timeOfDay",
    intensitySubPath: "intensity",
    tooltip:
      "Applies a color grade to outdoor areas based on the time set by the Day/Night clock.",
  },
  buildingShadows: {
    name: "Building Shadows",
    path: "buildingShadows",
    intensitySubPath: "intensity",
    tooltip: "Simulates building shadows based on sun position.",
  },
  water: {
    name: "Water Surface",
    path: "water",
    intensitySubPath: "depthDisplacement.strength",
    tooltip:
      "A comprehensive water effect with depth displacement, waves, caustics, and surface specularity.",
  },
  foam: {
    name: "Foam",
    path: "foam",
    intensitySubPath: "intensity",
    tooltip:
      "Creates foam effects on water surfaces, including shoreline foam and wave crests.",
  },
  candleFlame: {
    name: "Candle Flame",
    path: "candleFlame",
    intensitySubPath: "frequency",
    tooltip:
      "A jiggling flame particle effect suitable for candles, torches, and small fires.",
  },
  pressurisedSteam: {
    name: "Pressurised Steam",
    path: "pressurisedSteam",
    intensitySubPath: "maskInfluence",
    tooltip:
      "Creates intermittent bursts of steam particles from defined areas on the map.",
  },
  smellyFlies: {
    name: "Smelly Flies",
    path: "smellyFlies",
    tooltip:
      "Simulates a swarm of flies that orbit a point, land, and walk around. Toggle-only control.",
  },
  physicsRope: {
    name: "Physics Rope",
    path: "physicsRope",
    intensitySubPath: "animationSpeed",
    tooltip:
      "Renders physics-enabled ropes and chains that respond to wind and movement.",
  },
  overheadEffect: {
    name: "Overhead Effect",
    path: "overheadEffect",
    tooltip:
      "Controls overhead tile rendering with zoom-based blur and opacity adjustments. Toggle-only control.",
  },
};

export class ClientOverrides {
  static apply(config) {
    for (const [key, data] of Object.entries(CLIENT_OVERRIDES_CONFIG)) {
      const enabledSetting = game.settings.get(
        MODULE_ID,
        `user-${key}-enabled`
      );
      if (enabledSetting === false) {
        foundry.utils.setProperty(config, `${data.path}.enabled`, false);
        continue;
      }

      if (data.intensitySubPath) {
        const intensitySetting = game.settings.get(
          MODULE_ID,
          `user-${key}-intensity`
        );
        if (intensitySetting !== 100) {
          const fullIntensityPath = `${data.path}.${data.intensitySubPath}`;
          const originalValue = foundry.utils.getProperty(
            config,
            fullIntensityPath
          );
          if (typeof originalValue === "number") {
            const newValue = originalValue * (intensitySetting / 100);
            foundry.utils.setProperty(config, fullIntensityPath, newValue);
          }
        }
      }
    }

    // New global accessibility overrides
    const disableDistortion = game.settings.get(
      MODULE_ID,
      "user-disable-distortion"
    );
    if (disableDistortion) {
      if (config.heatDistortion) config.heatDistortion.enabled = false;
      if (config.postProcessing?.lensDistortion)
        config.postProcessing.lensDistortion.enabled = false;
    }

    const disableFringe = game.settings.get(
      MODULE_ID,
      "user-disable-color-fringe"
    );
    if (disableFringe) {
      if (config.baseShine?.rgbSplit) config.baseShine.rgbSplit.enabled = false;
      if (config.postProcessing?.chromaticAberration)
        config.postProcessing.chromaticAberration.enabled = false;
    }

    return config;
  }
}