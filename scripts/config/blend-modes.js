/**
 * @fileoverview Blend Mode Options for Map Shine
 * 
 * Provides a comprehensive mapping of PIXI.js blend modes for visual effects.
 * These blend modes control how layers and effects combine with underlying content.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.1.52
 * @since 1.0.0
 */

/**
 * Comprehensive mapping of PIXI.js blend modes for use throughout the module.
 * 
 * Blend modes control how visual layers combine:
 * - NORMAL: Standard alpha blending
 * - ADD: Additive blending for bright/glowing effects
 * - MULTIPLY: Multiplicative blending for darkening/shadows
 * - SCREEN: Screen blending for soft lighting
 * - OVERLAY: Combines multiply and screen for contrast
 * - DARKEN: Keeps darkest values
 * - LIGHTEN: Keeps lightest values
 * - COLOR_DODGE: Brightens base color
 * - COLOR_BURN: Darkens base color
 * - HARD_LIGHT: Strong contrast effect
 * - SOFT_LIGHT: Subtle contrast effect
 * - DIFFERENCE: Subtractive blending
 * - EXCLUSION: Similar to difference but softer
 * 
 * @constant {Object}
 * @property {number} NORMAL - Standard alpha blending
 * @property {number} ADD - Additive blending for glows
 * @property {number} MULTIPLY - Multiplicative blending for shadows
 * @property {number} SCREEN - Screen blending for soft lights
 * @property {number} OVERLAY - Overlay blending for contrast
 * @property {number} DARKEN - Darken blending mode
 * @property {number} LIGHTEN - Lighten blending mode
 * @property {number} COLOR_DODGE - Color dodge for bright highlights
 * @property {number} COLOR_BURN - Color burn for deep shadows
 * @property {number} HARD_LIGHT - Hard light for strong contrast
 * @property {number} SOFT_LIGHT - Soft light for subtle contrast
 * @property {number} DIFFERENCE - Difference blending for special effects
 * @property {number} EXCLUSION - Exclusion blending for color effects
 */
export const BLEND_MODE_OPTIONS = {
  NORMAL: PIXI.BLEND_MODES.NORMAL,
  ADD: PIXI.BLEND_MODES.ADD,
  MULTIPLY: PIXI.BLEND_MODES.MULTIPLY,
  SCREEN: PIXI.BLEND_MODES.SCREEN,
  OVERLAY: PIXI.BLEND_MODES.OVERLAY,
  DARKEN: PIXI.BLEND_MODES.DARKEN,
  LIGHTEN: PIXI.BLEND_MODES.LIGHTEN,
  COLOR_DODGE: PIXI.BLEND_MODES.COLOR_DODGE,
  COLOR_BURN: PIXI.BLEND_MODES.COLOR_BURN,
  HARD_LIGHT: PIXI.BLEND_MODES.HARD_LIGHT,
  SOFT_LIGHT: PIXI.BLEND_MODES.SOFT_LIGHT,
  DIFFERENCE: PIXI.BLEND_MODES.DIFFERENCE,
  EXCLUSION: PIXI.BLEND_MODES.EXCLUSION,
};

// Make BLEND_MODE_OPTIONS available globally for extracted modules that need direct access
globalThis.BLEND_MODE_OPTIONS = BLEND_MODE_OPTIONS;

/**
 * Direct alias to PIXI.BLEND_MODES for consumers that previously imported BLEND_MODES.
 */
export const BLEND_MODES = PIXI.BLEND_MODES;
globalThis.BLEND_MODES = BLEND_MODES;
