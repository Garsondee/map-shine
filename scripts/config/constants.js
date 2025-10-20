/**
 * @fileoverview Core Constants for Map Shine Module
 * 
 * Contains essential module identifiers and global constants that are used
 * throughout the codebase. Extracted for better modularity and maintainability.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.1.52
 * @since 1.0.0
 */

/**
 * The unique identifier for this Foundry VTT module.
 * Used for settings registration, localization, and module identification.
 * @constant {string}
 */
export const MODULE_ID = "map-shine";

/**
 * The maximum delta time in seconds allowed for a single simulation step.
 * This prevents physics "explosions" or extreme jumps during moments of low frame rate.
 * The value 1/30 corresponds to a minimum of 30 frames per second.
 * @constant {number}
 */
export const MAX_DELTA_TIME = 1 / 30;

/**
 * Temporary storage for copy/paste operations within the module.
 * Replaces clipboard usage to avoid browser compatibility issues.
 * @type {Object}
 */
export const TEMP_CLIPBOARD_STORAGE = {
  accordion: null,  // For individual accordion copy/paste
  settings: null    // For whole scene copy/paste
};
