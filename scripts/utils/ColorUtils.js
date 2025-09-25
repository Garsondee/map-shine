/**
 * @fileoverview Color utility functions for Map Shine Module
 * 
 * This file contains utility functions for color manipulation and conversion
 * used throughout the Map Shine module.
 * 
 * @author Garsondee
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Converts a hex color string to an RGB array with values from 0.0 to 1.0.
 * 
 * This utility function is used extensively throughout the module for converting
 * hex color values from settings and configurations into RGB arrays suitable
 * for use in PIXI filters and shaders.
 * 
 * @param {string} hex - The hex color string (e.g., "#FF5733").
 * @returns {number[]} A three-element array with RGB values from 0.0 to 1.0.
 * 
 * @example
 * const rgbArray = hexToRgbArray("#FF5733");
 * // Returns: [1.0, 0.34, 0.2]
 * 
 * @since 1.0.0
 */
const hexToRgbArray = (hex) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? [
				parseInt(result[1], 16) / 255,
				parseInt(result[2], 16) / 255,
				parseInt(result[3], 16) / 255,
		  ]
		: [0, 0, 0];
};

/**
 * Lerp (linear interpolation) function for smooth transitions between values.
 * 
 * @param {number} start - The starting value
 * @param {number} end - The ending value  
 * @param {number} t - The interpolation factor (0.0 to 1.0)
 * @returns {number} The interpolated value
 * 
 * @since 1.0.0
 */
const lerp = (start, end, t) => {
	return start + (end - start) * t;
};

// Export the utility functions
export { hexToRgbArray, lerp };
