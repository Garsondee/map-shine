export class ProfileDataManager {
  constructor(moduleId) {
    this.moduleId = moduleId;
  }

  /**
   * Loads world-level default configurations for individual effects.
   * @returns {object} The worldDefaults object { effectKey: effectConfig, ... }
   */
  loadWorldDefaults() {
    const WORLD_DEFAULTS_SETTING = "worldDefaults";
    try {
      const rawData = game.settings.get(this.moduleId, WORLD_DEFAULTS_SETTING);
      
      // DEFENSIVE: Validate type
      if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
        console.warn('Map Shine | World defaults corrupted (invalid type), using empty object');
        return {};
      }
      
      // DEFENSIVE: Validate each effect config
      const validated = {};
      let corruptedCount = 0;
      
      for (const [effectKey, effectConfig] of Object.entries(rawData)) {
        if (this._isValidEffectConfig(effectConfig)) {
          validated[effectKey] = effectConfig;
        } else {
          corruptedCount++;
          console.warn(`Map Shine | Removed corrupted world default for effect: ${effectKey}`);
        }
      }
      
      if (corruptedCount > 0) {
        console.warn(`Map Shine | Cleaned ${corruptedCount} corrupted world defaults`);
      }
      
      return validated;
      
    } catch (error) {
      console.error('Map Shine | Error loading world defaults:', error);
      return {};
    }
  }

  /**
   * Saves world-level default configurations for individual effects.
   * @param {object} worldDefaults - The entire worldDefaults object to save.
   */
  async saveWorldDefaults(worldDefaults) {
    await game.settings.set(
      this.moduleId,
      WORLD_DEFAULTS_SETTING,
      worldDefaults
    );
  }

  /**
   * Saves a specific effect's configuration as the world default for that effect.
   * @param {string} effectKey - The effect key (e.g., "fire", "baseShine")
   * @param {object} effectConfig - The configuration object for that effect
   */
  async saveEffectAsWorldDefault(effectKey, effectConfig) {
    const worldDefaults = this.loadWorldDefaults();
    worldDefaults[effectKey] = foundry.utils.deepClone(effectConfig);
    await this.saveWorldDefaults(worldDefaults);
  }

  /**
   * Loads scene-specific profile data from flags.
   * DEFENSIVE: Validates all data before trusting it.
   * @returns {{profiles: Array<object>, activeProfileId: string|null}}
   */
  loadSceneData() {
    if (!canvas.scene) return { profiles: [], activeProfileId: null };
    
    try {
      const rawProfiles = canvas.scene.getFlag(this.moduleId, "profiles");
      const rawActiveId = canvas.scene.getFlag(this.moduleId, "activeProfileId");
      
      // DEFENSIVE: Validate profiles array
      let validProfiles = [];
      if (Array.isArray(rawProfiles)) {
        validProfiles = rawProfiles.filter(profile => this._isValidProfile(profile));
        
        const removedCount = rawProfiles.length - validProfiles.length;
        if (removedCount > 0) {
          console.warn(
            `Map Shine | Removed ${removedCount} corrupted profile(s) from scene "${canvas.scene.name}"`
          );
        }
      } else if (rawProfiles !== null && rawProfiles !== undefined) {
        console.warn(
          `Map Shine | Scene profiles corrupted (not an array) in "${canvas.scene.name}", resetting to empty`
        );
      }
      
      // DEFENSIVE: Validate active profile ID
      let activeProfileId = null;
      if (rawActiveId && typeof rawActiveId === 'string') {
        // Check if the active ID actually exists in the profiles
        const profileExists = validProfiles.some(p => p.id === rawActiveId);
        if (profileExists) {
          activeProfileId = rawActiveId;
        } else if (rawActiveId) {
          console.warn(
            `Map Shine | Active profile ID "${rawActiveId}" not found in scene profiles, clearing`
          );
        }
      }
      
      return {
        profiles: validProfiles,
        activeProfileId
      };
      
    } catch (error) {
      console.error('Map Shine | Error loading scene data:', error);
      return { profiles: [], activeProfileId: null };
    }
  }

  /**
   * Saves scene-specific profile data to flags.
   * @param {object} saveData - The data to save.
   * @param {Array<object>} [saveData.profiles] - The array of scene profiles.
   * @param {string|null} [saveData.activeProfileId] - The ID of the active profile.
   */
  async saveSceneData({ profiles, activeProfileId }) {
    if (!canvas.scene) return;
    const updates = {};
    if (profiles !== undefined) {
      updates[`flags.${this.moduleId}.profiles`] = profiles;
    }
    if (activeProfileId !== undefined) {
      updates[`flags.${this.moduleId}.activeProfileId`] = activeProfileId;
    }

    if (!foundry.utils.isEmpty(updates)) {
      await canvas.scene.update(updates, { diff: false });
    }
  }

  /**
   * Loads user-specific temporary overrides for a given scene.
   * DEFENSIVE: Validates data structure before returning.
   * @param {string} sceneId - The ID of the scene.
   * @returns {object} The user overrides object for that scene.
   */
  loadUserOverrides(sceneId) {
    if (!sceneId) return {};
    
    try {
      const allUserOverrides = game.settings.get(this.moduleId, "user-adjustments");
      
      // DEFENSIVE: Validate top-level structure
      if (!allUserOverrides || typeof allUserOverrides !== 'object' || Array.isArray(allUserOverrides)) {
        console.warn('Map Shine | User overrides corrupted (invalid type), using empty object');
        return {};
      }
      
      const sceneOverrides = allUserOverrides[sceneId];
      
      // DEFENSIVE: Validate scene-specific overrides
      if (!sceneOverrides) {
        return {};
      }
      
      if (typeof sceneOverrides !== 'object' || Array.isArray(sceneOverrides)) {
        console.warn(`Map Shine | User overrides for scene ${sceneId} corrupted, using empty object`);
        return {};
      }
      
      return sceneOverrides;
      
    } catch (error) {
      console.error('Map Shine | Error loading user overrides:', error);
      return {};
    }
  }

  /**
   * Saves user-specific temporary overrides for a given scene.
   * @param {string} sceneId - The ID of the scene.
   * @param {object} overrides - The user overrides object to save.
   */
  async saveUserOverrides(sceneId, overrides) {
    if (!sceneId) return;
    const allUserOverrides =
      game.settings.get(this.moduleId, "user-adjustments") || {};
    allUserOverrides[sceneId] = overrides;
    await game.settings.set(
      this.moduleId,
      "user-adjustments",
      allUserOverrides
    );
  }

  /**
   * Clears user-specific temporary overrides for a given scene.
   * @param {string} sceneId - The ID of the scene.
   */
  async clearUserOverrides(sceneId) {
    if (!sceneId) return;
    const allUserOverrides =
      game.settings.get(this.moduleId, "user-adjustments") || {};
    delete allUserOverrides[sceneId];
    await game.settings.set(
      this.moduleId,
      "user-adjustments",
      allUserOverrides
    );
  }

  /**
   * PHASE 1 VALIDATION: Validates a profile object structure.
   * @param {*} profile - Profile to validate
   * @returns {boolean} True if profile is valid
   * @private
   */
  _isValidProfile(profile) {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      return false;
    }
    
    // Check required properties
    if (!profile.id || typeof profile.id !== 'string') {
      return false;
    }
    
    if (!profile.name || typeof profile.name !== 'string') {
      return false;
    }
    
    if (!profile.config || typeof profile.config !== 'object' || Array.isArray(profile.config)) {
      return false;
    }
    
    return true;
  }

  /**
   * PHASE 1 VALIDATION: Validates an effect config object.
   * @param {*} config - Config to validate
   * @returns {boolean} True if config is valid
   * @private
   */
  _isValidEffectConfig(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return false;
    }
    
    // Basic structure check - should have at least some properties
    if (Object.keys(config).length === 0) {
      return false;
    }
    
    return true;
  }
}