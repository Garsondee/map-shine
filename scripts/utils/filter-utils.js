/**
 * @fileoverview Filter Corruption Protection Utilities
 * 
 * Provides robust validation and safe handling for PIXI filters to prevent
 * corruption-related crashes and ensure stable rendering.
 * 
 * Background:
 * PIXI filters can become corrupted during scene transitions, especially when:
 * - Filters are destroyed but still referenced
 * - uniformGroup becomes null
 * - Texture references become invalid
 * - BatchRenderer isn't ready
 * 
 * These utilities provide defensive programming patterns to catch and handle
 * these edge cases gracefully.
 * 
 * @author Mythica Machina - Ingram Blakelock
 * @version 1.2.0
 * @since 1.0.0
 */

/**
 * Validates that a PIXI filter is in a valid state for rendering.
 * 
 * Checks performed:
 * - Filter exists (not null/undefined)
 * - Filter hasn't been destroyed
 * - uniformGroup exists (critical for rendering)
 * - Uniforms are accessible
 * 
 * @param {PIXI.Filter} filter - The filter to validate
 * @param {string} [context="Unknown"] - Context string for error logging
 * @returns {boolean} True if filter is valid and safe to use
 * 
 * @example
 * if (validateFilter(myFilter, "CloudShadowsLayer")) {
 *   // Safe to use filter
 * }
 */
export function validateFilter(filter, context = "Unknown") {
  if (!filter) {
    console.warn(`Map Shine | Filter validation (${context}): Filter is null or undefined`);
    return false;
  }

  // Check if filter has been destroyed
  if (filter._destroyed || filter.destroyed) {
    console.warn(`Map Shine | Filter validation (${context}): Filter has been destroyed`);
    return false;
  }

  // Critical check: uniformGroup must exist for rendering
  if (!filter.uniformGroup) {
    console.error(
      `Map Shine | Filter validation (${context}): Filter has null uniformGroup (CORRUPTION DETECTED)`,
      { filterType: filter.constructor?.name, filter }
    );
    return false;
  }

  // Verify uniforms object exists
  if (!filter.uniforms && !filter.uniformGroup.uniforms) {
    console.warn(`Map Shine | Filter validation (${context}): Filter uniforms not accessible`);
    return false;
  }

  return true;
}

/**
 * Safely creates a filter with error handling to prevent corruption crashes.
 * 
 * This function wraps filter construction in try-catch and validates the result
 * immediately after creation. If validation fails, the filter is destroyed and
 * null is returned rather than allowing a corrupted filter into the system.
 * 
 * @param {Function} filterConstructor - The filter class constructor
 * @param {object|Array} [options={}] - Options object or array of positional arguments to pass to constructor
 * @param {string} [context="Unknown"] - Context string for error logging
 * @returns {PIXI.Filter|null} The created filter or null if creation failed
 * 
 * @example
 * // Object options
 * const filter = safeCreateFilter(MyFilter, { intensity: 0.5 }, "MyLayer");
 * 
 * // Positional arguments
 * const filter = safeCreateFilter(MyFilter, [0.5, 0.8], "MyLayer");
 */
export function safeCreateFilter(filterConstructor, options = {}, context = "Unknown") {
  try {
    // Validate constructor before attempting instantiation
    if (!filterConstructor || typeof filterConstructor !== 'function') {
      console.warn(`Map Shine | safeCreateFilter(${context}): filter constructor unavailable or invalid`, {
        type: typeof filterConstructor,
        value: filterConstructor
      });
      return null;
    }

    // Support both object options and positional arguments (as array)
    const filter = Array.isArray(options) 
      ? new filterConstructor(...options)
      : new filterConstructor(options);
    
    // Validate immediately after creation
    if (!validateFilter(filter, `${context} (creation)`)) {
      console.error(`Map Shine | Failed to create valid filter: ${context}`);
      try {
        filter?.destroy?.();
      } catch (e) {
        // Ignore destruction errors
      }
      return null;
    }
    
    return filter;
  } catch (error) {
    console.error(`Map Shine | Exception creating filter: ${context}`, error);
    return null;
  }
}

/**
 * Cleans an array of filters, removing any that are invalid or corrupted.
 * 
 * Iterates through a filter array, validating each filter and removing any that
 * fail validation. Destroyed filters are removed gracefully. Returns null if no
 * valid filters remain.
 * 
 * @param {Array<PIXI.Filter>} filters - Array of filters to clean
 * @param {string} [context="Unknown"] - Context string for error logging
 * @returns {Array<PIXI.Filter>|null} Cleaned array with only valid filters, or null if empty
 * 
 * @example
 * const cleaned = cleanFilterArray([filter1, filter2, filter3], "canvas.primary");
 * if (cleaned) {
 *   container.filters = cleaned;
 * }
 */
export function cleanFilterArray(filters, context = "Unknown") {
  if (!Array.isArray(filters)) {
    return null;
  }

  const validFilters = filters.filter((filter, index) => {
    const isValid = validateFilter(filter, `${context}[${index}]`);
    if (!isValid) {
      console.warn(`Map Shine | Removed invalid filter from ${context} at index ${index}`);
      try {
        filter?.destroy?.();
      } catch (e) {
        // Ignore destruction errors for corrupt filters
      }
    }
    return isValid;
  });

  return validFilters.length > 0 ? validFilters : null;
}

/**
 * Safely applies filters to a PIXI container with validation.
 * 
 * This function provides a safe wrapper around setting container.filters.
 * It validates the container, cleans the filter array, and handles errors
 * gracefully. If all filters are invalid, the container's filters are set to null.
 * 
 * @param {PIXI.Container} container - The container to apply filters to
 * @param {Array<PIXI.Filter>} filters - Filters to apply
 * @param {string} [context="Unknown"] - Context string for error logging
 * @returns {boolean} True if filters were successfully applied
 * 
 * @example
 * const success = safeApplyFilters(
 *   canvas.primary,
 *   [cloudFilter, shadowFilter],
 *   "canvas.primary (CloudShadows)"
 * );
 */
export function safeApplyFilters(container, filters, context = "Unknown") {
  if (!container) {
    console.warn(`Map Shine | safeApplyFilters (${context}): Container is null`);
    return false;
  }

  if (!filters || filters.length === 0) {
    container.filters = null;
    return true;
  }

  // Clean the filter array
  const cleanedFilters = cleanFilterArray(filters, context);
  
  if (!cleanedFilters || cleanedFilters.length === 0) {
    console.warn(`Map Shine | safeApplyFilters (${context}): All filters were invalid, removing filter array`);
    container.filters = null;
    return false;
  }

  try {
    container.filters = cleanedFilters;
    return true;
  } catch (error) {
    console.error(`Map Shine | safeApplyFilters (${context}): Exception applying filters`, error);
    container.filters = null;
    return false;
  }
}
