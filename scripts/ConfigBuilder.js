import { MODULE_DEFAULTS } from "./config/MODULE_DEFAULTS.js";
import { ClientOverrides } from "./core/ClientOverrides.js";

// =================================================================================
// SECTION 3: PROFILE & CONFIGURATION MANAGEMENT
// =================================================================================
// Description: Classes for managing effect profiles, configurations, and client-side
//              settings. Includes ProfileDataManager, ConfigBuilder, AppearanceTransitionManager,
//              and client override systems.
// ---------------------------------------------------------------------------------
/***************************************************************************************
 *
 *                             COORDINATE MANAGER DOCUMENTATION
 *
 *  NOTE: CoordinateManager has been moved to scripts/managers/CoordinateManager.js
 *
 *  PURPOSE:
 *  The CoordinateManager is a static utility class that serves as the single source of truth
 *  for all coordinate system transformations within the Map Shine module. Its primary goal is
 *  to solve the problem of mixing "World Space" (canvas coordinates) and "Screen Space"
 *  (pixel coordinates) by providing a centralized, efficient, and consistent way to handle
 *  the relationship between them.
 *
 *  ARCHITECTURE:
 *  1.  Centralized Calculation: The `update()` method is called once per animation frame.
 *      It calculates all necessary data about the current camera view, such as the world-space
 *      position of the screen's top-left corner, the visible world dimensions, and the
 *      current zoom level.
 *
 *  2.  Static Access: All properties and methods are static, meaning there is only one
 *      instance of this data per frame. Any layer or filter can access it directly via
 *      `CoordinateManager.propertyName` without needing an instance.
 *
 *  3.  Standardized Shader Uniforms: The `getShaderUniforms()` method provides a consistent
 *      object that can be passed directly to any PIXI.Filter's uniform group. This ensures
 *      all world-space shaders use the exact same transformation logic.
 *
 *  REQUIRED METHOD:
 *  This class is the required method for all filters, textures, PIXI canvas layers, etc.,
 *  to obtain coordinate and transformation data. Do not perform these calculations
 *  manually within other components.
 *
 *  NOTE: The CoordinateManager has been moved to scripts/managers/CoordinateManager.js
 *
 ***************************************************************************************/









export class ConfigBuilder {
  /**
   * Removes properties from `settings` that do not exist in `template`.
   * @param {object} template - The reference object with the correct structure.
   * @param {object} settings - The object to clean.
   * @returns {object} The cleaned settings object.
   */
  static _reconcile(template, settings) {
    for (const key in settings) {
      if (!(key in template)) {
        delete settings[key];
        continue;
      }
      const templateValue = template[key];
      const settingValue = settings[key];
      const isTemplateObject = typeof templateValue === "object" &&
        templateValue !== null &&
        !Array.isArray(templateValue);
      const isSettingObject = typeof settingValue === "object" &&
        settingValue !== null &&
        !Array.isArray(settingValue);
      if (isTemplateObject && !isSettingObject) {
        delete settings[key];
        continue;
      }
      if (isTemplateObject && isSettingObject) {
        this._reconcile(templateValue, settingValue);
        if (Object.keys(settingValue).length === 0) {
          delete settings[key];
        }
      }
    }
    return settings;
  }

  /**
   * A custom merge function that handles nested objects correctly.
   * @param {object} target - The object to merge into.
   * @param {object} source - The object to merge from.
   */
  static _customMerge(target, source) {
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      if (Array.isArray(sourceValue)) {
        target[key] = foundry.utils.deepClone(sourceValue);
        continue;
      }
      if (typeof sourceValue === "object" && sourceValue !== null) {
        if (typeof targetValue !== "object" ||
          targetValue === null ||
          Array.isArray(targetValue)) {
          target[key] = {};
        }
        this._customMerge(target[key], sourceValue);
      } else {
        target[key] = sourceValue;
      }
    }
  }

  /**
   * Builds the final, live configuration by layering all data sources.
   * New layering process:
   * 1. Start with MODULE_DEFAULTS
   * 2. Layer Active Scene Appearance (if exists)
   * 3. Layer World-Based Overrides (for effects with worldBasedOnly: true)
   * 4. Layer User Overrides
   * 5. Apply Client Overrides
   *
   * @param {object} data - An object containing all the raw data.
   * @param {object} options - Options for the build process.
   * @returns {object} An object containing the final config and status information.
   */
  static buildEffectiveConfig(
    { sceneProfiles, activeProfileId, worldDefaults, rawUserOverrides },
    options = {}
  ) {
    const defaults = foundry.utils.deepClone(MODULE_DEFAULTS);
    let baseConfig;
    let profileSource;
    let finalActiveProfileId = activeProfileId;

    const sceneHasProfiles = sceneProfiles.length > 0;

    // Step 1 & 2: Start with MODULE_DEFAULTS and layer Scene Appearance
    if (sceneHasProfiles) {
      let activeProfile = sceneProfiles.find((p) => p.id === activeProfileId);
      if (!activeProfile && sceneProfiles.length > 0) {
        activeProfile = sceneProfiles[0];
        finalActiveProfileId = activeProfile.id;
      }
      if (activeProfile?.config) {
        baseConfig = foundry.utils.mergeObject(
          foundry.utils.deepClone(defaults),
          activeProfile.config
        );
        profileSource = "scene";
      } else {
        baseConfig = foundry.utils.deepClone(defaults);
        profileSource = "module";
      }
    } else {
      baseConfig = foundry.utils.deepClone(defaults);
      profileSource = "module";
    }

    baseConfig = this._reconcile(foundry.utils.deepClone(defaults), baseConfig);

    // Step 3: Layer World-Based Overrides
    // For each effect with worldBasedOnly: true, replace with world default if it exists
    if (worldDefaults && typeof worldDefaults === "object") {
      for (const effectKey in baseConfig) {
        const effectConfig = baseConfig[effectKey];
        // Check if this effect has worldBasedOnly set to true
        if (effectConfig &&
          typeof effectConfig === "object" &&
          effectConfig.worldBasedOnly === true) {
          // If a world default exists for this effect, replace the entire effect block
          if (worldDefaults[effectKey]) {
            baseConfig[effectKey] = foundry.utils.deepClone(
              worldDefaults[effectKey]
            );
            console.log(
              `MapShine | Applied world default for effect: ${effectKey}`
            );
          }
        }
      }
    }

    // Step 4: Layer User Overrides
    const userOverrides = this._reconcile(
      foundry.utils.deepClone(defaults),
      rawUserOverrides
    );
    let effectiveConfig = foundry.utils.deepClone(baseConfig);
    this._customMerge(effectiveConfig, userOverrides);

    // Step 5: Apply Client Overrides
    if (!options.excludeClientOverrides) {
      effectiveConfig = ClientOverrides.apply(effectiveConfig);
    }

    const isDirty = !foundry.utils.isEmpty(userOverrides);

    return {
      activeConfig: effectiveConfig,
      userOverrides,
      baseConfig,
      activeProfileId: finalActiveProfileId,
      status: {
        sceneHasProfiles,
        isDirty,
        profileSource,
        error: null,
      },
    };
  }
}
