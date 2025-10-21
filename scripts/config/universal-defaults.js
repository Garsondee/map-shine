/**
 * @fileoverview Universal Effect Defaults for Map Shine
 * 
 * Contains default configurations for universal effects that apply globally
 * across all scenes, including scene transitions, pause effects, combat effects,
 * font management, and weather system.
 * 
 * These settings provide the baseline configuration for system-wide visual effects
 * and can be customized by users through the module settings.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.1.53
 * @since 1.0.0
 */

/**
 * Default configuration values for universal visual effects and systems.
 * 
 * This object contains configurations for:
 * - **sceneTransition**: Scene change overlay effects with customizable text and hints
 * - **pauseEffect**: Visual effects and overlay when the game is paused
 * - **combatEffect**: Visual feedback when combat encounters start
 * - **fontManager**: Font family configurations for UI text elements
 * - **weather**: Weather system initialization settings
 * 
 * Each section provides sensible defaults that create a cohesive visual experience
 * while remaining fully customizable by the end user.
 * 
 * @constant {Object}
 * @property {Object} sceneTransition - Scene transition overlay configuration
 * @property {Object} pauseEffect - Pause screen overlay and effects configuration
 * @property {Object} combatEffect - Combat encounter visual feedback configuration
 * @property {Object} fontManager - Font family configurations for UI elements
 * @property {Object} weather - Weather system default settings
 */
export const UNIVERSAL_EFFECT_DEFAULTS = {
  sceneTransition: {
    enabled: true,
    fadeOutDuration: 5000,
    fadeInDuration: 5000,
    logoPath: "modules/map-shine/assets/mm-logo.png",
    heading: "New Chapter",
    subheading: "The story continues...",
    staticDescription: "This is the default description text...",
    showSceneName: true,
    useRandomHint: true,
    randomHints: [
      "Press 'C' to quickly open your character sheet.",
      "Hold the Shift key while using the arrow keys to rotate tokens.",
      "You can assign a keyboard shortcut to toggle a token's visibility, saving you right-clicks.",
      'To manage a group of player characters more easily, place them all in a "Party" folder and drag the folder onto the canvas to create a single party token.',
      "Double-click the right mouse button to quickly end a measurement template.",
      "You can lock the position of tokens and tiles to prevent them from being accidentally moved.",
      "Use the search bar in the sidebars to quickly find actors, items, and journal entries.",
      "The 'Tab' key can be used to target the next token on the canvas.",
      "Remember that many actions have consequences in the game world.",
      "Running away is a valid and often wise alternative to a character's death.",
      "You can pop out character sheets and journal entries into their own windows.",
      'The "Ping" tool (left-click and hold) can be used to draw your players\' attention to a specific location.',
      "Don't forget that your action can be used for more than just attacking; consider options like Dash, Dodge, and Help.",
      "If you're unsure about a rule, it's often best to make a quick ruling and look it up later to keep the game moving.",
      "Communication is key; keep your fellow players and the Game Master informed of your character's intentions.",
    ],
  },
  pauseEffect: {
    enabled: true,
    duration: 3000,
    // --- New properties for the overlay ---
    heading: "SESSION PAUSED",
    subheading: "Please stand by...",
    logoPath: "modules/map-shine/assets/mm-logo.png",
    logoOpacity: 0.8,
    backgroundColor: "rgba(10, 0, 0, 0.75)",
    gradientColor1: "#ff4444",
    gradientColor2: "rgba(255, 0, 0, 0.5)",
    gradientShadowColor: "#ff0000",
    headingColor: "#ffcccc",
    subheadingColor: "#ff8888",
    hintColor: "#dddddd",
    useRandomHint: true,
    randomHints: [
      "Hint: Check your inventory for useful items.",
      "Hint: Remember to save frequently!",
      "Hint: Resting can restore health and spells.",
    ],
    // --- Existing color correction ---
    colorCorrection: {
      enabled: true,
      saturation: 0.2,
      brightness: -0.15,
      contrast: 1,
      invert: false,
      tint: {
        color: "#FFFFFF",
        amount: 0,
      },
      exposure: 0,
      gamma: 1,
      levels: {
        inBlack: 0,
        inWhite: 1,
      },
      whiteBalance: {
        temperature: 0,
        tint: 0,
      },
      selective: {
        enabled: false,
        color: "#ff0000",
        hueRange: 0.05,
        saturationRange: 0.3,
      },
    },
  },
  combatEffect: {
    enabled: true,
    duration: 10000,
    timeScale: 0.25,
    colorCorrection: {
      enabled: true,
      saturation: 1,
      brightness: 0,
      contrast: 1,
      invert: false,
      tint: {
        color: "#ff0000",
        amount: 0,
      },
      exposure: 0,
      gamma: 1,
      levels: {
        inBlack: 0,
        inWhite: 1,
      },
      whiteBalance: {
        temperature: 0,
        tint: 0,
      },
      selective: {
        enabled: false,
        color: "#ff0000",
        hueRange: 0.05,
        saturationRange: 0.3,
      },
    },
  },
  fontManager: {
    styles: {
      heading1: {
        fontFamily: "Lexend",
      },
      heading2: {
        fontFamily: "Lexend",
      },
      body: {
        fontFamily: "Roboto",
      },
      hint: {
        fontFamily: "Special Elite",
      },
    },
  },
  // NOTE: Weather configuration has been moved to MODULE_DEFAULTS in module.js
  // to make it scene-specific rather than universal
};
