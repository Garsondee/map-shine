/**
 * Manages the registration and configuration of all module settings with Foundry VTT's settings system.
 *
 * This class centralizes all setting definitions for the Map Shine module, including:
 * - User interface preferences (loading screen, debug mode)
 * - Effect configuration settings
 * - Profile management settings
 * - Performance and compatibility options
 *
 * Settings are registered with appropriate scopes (client/world), data types,
 * default values, and user-friendly names and descriptions.
 *
 * @class SettingsManager
 * @static
 * @since 1.0.0
 */
import { MODULE_ID } from "../config/constants.js";
import { UNIVERSAL_EFFECT_DEFAULTS } from "../config/universal-defaults.js";
import { ST_DEFAULTS, PE, PE_CC, CE_CC, FM } from "../config/universal-defaults-adapter.js";
import { CLIENT_OVERRIDES_CONFIG } from "../core/ClientOverrides.js";

// Local setting key used to store world-level default effect configurations
const WORLD_DEFAULTS_SETTING = "worldDefaults";

// Analyzer-visible imports above provide these default groups.

export class SettingsManager {
  /**
   * Registers all module settings with Foundry's settings system.
   */
  static registerSettings() {
    // ========================================================
    // COMPATIBILITY SETTINGS - At the top for easy access
    // ========================================================

    game.settings.register(MODULE_ID, "enable-scene-transitions", {
      name: "⚙️ Enable Scene Transitions",
      hint: "Shows animated loading screens when changing between scenes. DISABLE THIS if you experience black / grey screens, freezing, or conflicts with other modules or hosting platforms like The Forge.",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      requiresReload: true,
    });

    game.settings.register(MODULE_ID, "enable-pause-screen", {
      name: "⚙️ Enable Custom Pause Screen",
      hint: "Shows a custom visual overlay when the game is paused. DISABLE THIS if you experience conflicts with other modules or game systems that modify the pause screen.",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      requiresReload: true,
    });

    // ========================================================
    // LOADING SCREEN SETTINGS
    // ========================================================

    game.settings.register(MODULE_ID, "disable-loading-screen", {
      name: "Disable Loading Screen",
      hint: "Completely disables the loading screen feature. Disabling this may cause some effects and layers to pop into existence a moment after the scene has finished loading, which can be jarring. Recommended to keep enabled unless it causes issues.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
    });

    game.settings.register(MODULE_ID, "loading-screen-subheading", {
      name: "Loading Screen Subheading",
      hint: "The text displayed above the world name on the initial loading screen.",
      scope: "world",
      config: true,
      type: String,
      default: "Loading the world...",
    });

    game.settings.register(MODULE_ID, "loading-screen-static-background", {
      name: "Loading & Transitions: Static Background Image",
      hint: "A single image to display on the initial world loading screen and during scene transitions. Overridden if 'Use Random Background' is checked.",
      scope: "world",
      config: true,
      type: String,
      default: "",
      filePicker: "image",
    });

    game.settings.register(MODULE_ID, "loading-screen-use-random-background", {
      name: "Loading & Transitions: Use Random Background",
      hint: "If checked, a random image from the list below will be used for the initial world loading screen and scene transitions.",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
    });

    game.settings.register(MODULE_ID, "loading-screen-random-backgrounds", {
      name: "Loading & Transitions: Backgrounds (one per line)",
      hint: "A list of image paths. One will be chosen randomly if 'Use Random Background' is checked. One path per line.",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });

    game.settings.register(
      MODULE_ID,
      "loading-screen-background-overlay-enabled",
      {
        name: "Loading & Transitions: Enable Background Overlay",
        hint: "Shows a semi-transparent black overlay on top of the background image to improve text readability.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      }
    );

    game.settings.register(
      MODULE_ID,
      "loading-screen-background-overlay-opacity",
      {
        name: "Loading & Transitions: Background Overlay Opacity",
        hint: "How opaque the black overlay is. 0 is transparent, 1 is fully black.",
        scope: "world",
        config: true,
        type: Number,
        range: { min: 0, max: 1, step: 0.05 },
        default: 0.75,
      }
    );

    // Helper to register a universal setting
    const registerUniversalSetting = (key, data) => {
      game.settings.register(MODULE_ID, `universal.${key}`, {
        ...data,
        scope: "world",
        config: true,
      });
    };
    registerUniversalSetting("sceneTransition.enabled", {
      name: "[Universal] Scene Transition: Enabled",
      type: Boolean,
      default: ST_DEFAULTS.enabled,
    });
    registerUniversalSetting("sceneTransition.fadeOutDuration", {
      name: "[Universal] Scene Transition: Fade Out (ms)",
      type: Number,
      default: ST_DEFAULTS.fadeOutDuration,
    });
    registerUniversalSetting("sceneTransition.fadeInDuration", {
      name: "[Universal] Scene Transition: Fade In (ms)",
      type: Number,
      default: ST_DEFAULTS.fadeInDuration,
    });
    registerUniversalSetting("sceneTransition.logoPath", {
      name: "[Universal] Scene Transition: Logo Path",
      type: String,
      default: ST_DEFAULTS.logoPath,
      filePicker: "image",
    });
    registerUniversalSetting("sceneTransition.heading", {
      name: "[Universal] Scene Transition: Heading",
      type: String,
      default: ST_DEFAULTS.heading,
    });
    registerUniversalSetting("sceneTransition.subheading", {
      name: "[Universal] Scene Transition: Subheading",
      type: String,
      default: ST_DEFAULTS.subheading,
    });
    registerUniversalSetting("sceneTransition.staticDescription", {
      name: "[Universal] Scene Transition: Description",
      type: String,
      default: ST_DEFAULTS.staticDescription,
    });
    registerUniversalSetting("sceneTransition.showSceneName", {
      name: "[Universal] Scene Transition: Show Scene Name",
      type: Boolean,
      default: ST_DEFAULTS.showSceneName,
    });
    registerUniversalSetting("sceneTransition.useRandomHint", {
      name: "[Universal] Scene Transition: Use Random Hint",
      type: Boolean,
      default: ST_DEFAULTS.useRandomHint,
    });
    registerUniversalSetting("sceneTransition.randomHints", {
      name: "[Universal] Scene Transition: Hints (one per line)",
      type: String,
      default: ST_DEFAULTS.randomHints.join("\n"),
    });

    // --- Pause Effect Settings ---
    registerUniversalSetting("pauseEffect.enabled", {
      name: "[Universal] Pause Effect: Enabled",
      type: Boolean,
      default: PE.enabled,
    });
    registerUniversalSetting("pauseEffect.duration", {
      name: "[Universal] Pause Effect: Duration (ms)",
      type: Number,
      default: PE.duration,
    });
    // Pause Overlay
    registerUniversalSetting("pauseEffect.heading", {
      name: "[Universal] Pause Overlay: Heading",
      type: String,
      default: PE.heading,
    });
    registerUniversalSetting("pauseEffect.subheading", {
      name: "[Universal] Pause Overlay: Subheading",
      type: String,
      default: PE.subheading,
    });
    registerUniversalSetting("pauseEffect.logoPath", {
      name: "[Universal] Pause Overlay: Logo Path",
      type: String,
      default: PE.logoPath,
      filePicker: "image",
    });
    registerUniversalSetting("pauseEffect.logoOpacity", {
      name: "[Universal] Pause Overlay: Logo Opacity",
      type: Number,
      range: { min: 0, max: 1, step: 0.05 },
      default: PE.logoOpacity,
    });
    registerUniversalSetting("pauseEffect.backgroundColor", {
      name: "[Universal] Pause Overlay: Background Color",
      type: String,
      default: PE.backgroundColor,
    });
    registerUniversalSetting("pauseEffect.gradientColor1", {
      name: "[Universal] Pause Overlay: Gradient Color 1",
      type: String,
      default: PE.gradientColor1,
    });
    registerUniversalSetting("pauseEffect.gradientColor2", {
      name: "[Universal] Pause Overlay: Gradient Color 2",
      type: String,
      default: PE.gradientColor2,
    });
    registerUniversalSetting("pauseEffect.gradientShadowColor", {
      name: "[Universal] Pause Overlay: Gradient Shadow Color",
      type: String,
      default: PE.gradientShadowColor,
    });
    registerUniversalSetting("pauseEffect.headingColor", {
      name: "[Universal] Pause Overlay: Heading Color",
      type: String,
      default: PE.headingColor,
    });
    registerUniversalSetting("pauseEffect.subheadingColor", {
      name: "[Universal] Pause Overlay: Subheading Color",
      type: String,
      default: PE.subheadingColor,
    });
    registerUniversalSetting("pauseEffect.hintColor", {
      name: "[Universal] Pause Overlay: Hint Color",
      type: String,
      default: PE.hintColor,
    });
    registerUniversalSetting("pauseEffect.useRandomHint", {
      name: "[Universal] Pause Overlay: Use Random Hint",
      type: Boolean,
      default: PE.useRandomHint,
    });
    registerUniversalSetting("pauseEffect.randomHints", {
      name: "[Universal] Pause Overlay: Hints (one per line)",
      type: String,
      default: PE.randomHints.join("\n"),
    });

    // Pause Color Correction
    registerUniversalSetting("pauseEffect.colorCorrection.enabled", {
      name: "[Universal] Pause Effect: Color Correction Enabled",
      type: Boolean,
      default: PE_CC.enabled,
    });
    registerUniversalSetting("pauseEffect.colorCorrection.saturation", {
      name: "[Universal] Pause Effect: Saturation",
      type: Number,
      range: { min: 0, max: 2, step: 0.05 },
      default: PE_CC.saturation,
    });
    registerUniversalSetting("pauseEffect.colorCorrection.brightness", {
      name: "[Universal] Pause Effect: Brightness",
      type: Number,
      range: { min: -1, max: 1, step: 0.01 },
      default: PE_CC.brightness,
    });
    registerUniversalSetting("pauseEffect.colorCorrection.contrast", {
      name: "[Universal] Pause Effect: Contrast",
      type: Number,
      range: { min: 0, max: 3, step: 0.05 },
      default: PE_CC.contrast,
    });

    // --- Combat Effect Settings ---
    registerUniversalSetting("combatEffect.enabled", {
      name: "[Universal] Combat Effect: Enabled",
      type: Boolean,
      default: UNIVERSAL_EFFECT_DEFAULTS.combatEffect.enabled,
    });
    registerUniversalSetting("combatEffect.duration", {
      name: "[Universal] Combat Effect: Duration (ms)",
      type: Number,
      default: UNIVERSAL_EFFECT_DEFAULTS.combatEffect.duration,
    });
    registerUniversalSetting("combatEffect.timeScale", {
      name: "[Universal] Combat Effect: Time Scale",
      type: Number,
      range: { min: 0.1, max: 1, step: 0.05 },
      default: UNIVERSAL_EFFECT_DEFAULTS.combatEffect.timeScale,
    });
    registerUniversalSetting("combatEffect.colorCorrection.enabled", {
      name: "[Universal] Combat Effect: Color Correction Enabled",
      type: Boolean,
      default: CE_CC.enabled,
    });
    registerUniversalSetting("combatEffect.colorCorrection.saturation", {
      name: "[Universal] Combat Effect: Saturation",
      type: Number,
      range: { min: 0, max: 2, step: 0.05 },
      default: CE_CC.saturation,
    });
    registerUniversalSetting("combatEffect.colorCorrection.brightness", {
      name: "[Universal] Combat Effect: Brightness",
      type: Number,
      range: { min: -1, max: 1, step: 0.01 },
      default: CE_CC.brightness,
    });
    registerUniversalSetting("combatEffect.colorCorrection.contrast", {
      name: "[Universal] Combat Effect: Contrast",
      type: Number,
      range: { min: 0, max: 3, step: 0.05 },
      default: CE_CC.contrast,
    });

    // --- Font Manager Settings ---
    registerUniversalSetting("fontManager.styles.heading1.fontFamily", {
      name: "[Universal] Font Manager: Heading 1",
      type: String,
      default: UNIVERSAL_EFFECT_DEFAULTS.fontManager.styles.heading1.fontFamily,
    });
    registerUniversalSetting("fontManager.styles.heading2.fontFamily", {
      name: "[Universal] Font Manager: Heading 2",
      type: String,
      default: FM.heading2.fontFamily,
    });
    registerUniversalSetting("fontManager.styles.body.fontFamily", {
      name: "[Universal] Font Manager: Body Text",
      type: String,
      default: FM.body.fontFamily,
    });
    registerUniversalSetting("fontManager.styles.hint.fontFamily", {
      name: "[Universal] Font Manager: Hint Text",
      type: String,
      default: FM.hint.fontFamily,
    });

    // NOTE: Weather settings have been moved to MODULE_DEFAULTS and are now
    // part of the scene-specific profile system instead of universal settings
    game.settings.register(MODULE_ID, "advanced-ui-mode", {
      name: "Advanced UI Mode",
      hint: "Toggles the advanced, detailed UI for Map Shine. When off, a simplified control panel is shown.",
      scope: "client",
      config: false, // Not user-facing in the settings menu
      type: Boolean,
      default: false,
    });

    // Register client-side accessibility overrides
    game.settings.register(MODULE_ID, "user-disable-distortion", {
      name: "Global Override: Disable Screen Distortion",
      hint: "Disables all screen-warping effects (e.g., Heat, Lens Distortion) to prevent motion sickness. This overrides all other settings.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
      onChange: SettingsManager.requestRefresh,
    });

    game.settings.register(MODULE_ID, "user-disable-color-fringe", {
      name: "Global Override: Disable Color Fringe",
      hint: "Disables all 'chromatic aberration' effects to improve visual clarity. This overrides all other settings.",
      scope: "client",
      config: true,
      type: Boolean,
      default: false,
      onChange: SettingsManager.requestRefresh,
    });

    game.settings.register(MODULE_ID, "scene-transition-timeout", {
      name: "Scene Transition Timeout (ms)",
      hint: "The maximum time to wait for effects to finish loading before forcing the scene to fade in. Increase this if you see timeout warnings in the console on slow-loading scenes.",
      scope: "client",
      config: true,
      type: Number,
      default: 90000,
      range: {
        min: 5000,
        max: 90000,
        step: 1000,
      },
    });

    // Register all individual effect overrides
    Object.entries(CLIENT_OVERRIDES_CONFIG).forEach(([key, data]) => {
      game.settings.register(MODULE_ID, `user-${key}-enabled`, {
        name: data.name,
        hint: `Toggles the '${data.name}' effect. If off, this overrides the scene's setting.`,
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: SettingsManager.requestRefresh,
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
            step: 1,
          },
          default: 100,
          onChange: SettingsManager.requestRefresh,
        });
      }
    });

    // Register world-level and client-side data stores
    game.settings.register(MODULE_ID, WORLD_DEFAULTS_SETTING, {
      scope: "world",
      config: false,
      type: Object,
      default: {},
    });
    game.settings.register(MODULE_ID, "user-adjustments", {
      scope: "client",
      config: false,
      type: Object,
      default: {},
    });
    game.settings.register(MODULE_ID, "colorFavorites", {
      scope: "client",
      config: false,
      type: String,
      default: "[]",
    });
    game.settings.register(MODULE_ID, "debugger-position", {
      scope: "client",
      config: false,
      type: Object,
      default: {},
    });
    game.settings.register(MODULE_ID, "ambientLayerZIndex", {
      scope: "client",
      config: false,
      type: Number,
      default: 250,
    });
  }

  /**
   * A helper function to trigger a full refresh when a client setting changes.
   */
  static requestRefresh() {
    if (canvas?.ready && game.mapShine?.profileManager) {
      game.mapShine.profileManager.initializeForScene();
      game.mapShine.profileManager.updateAllSystemsFromConfig();
    }
  }
}