import { MODULE_ID, ProfileDataManager, MODULE_DEFAULTS, ConfigBuilder, ParticleLayer, SmellyFliesLayer } from "../module.js";

/**
 * Maps configuration paths to their corresponding system update functions.
 * This enables targeted updates instead of refreshing all systems.
 * 
 * @constant {Object} CONFIG_SYSTEM_MAP
 */
const CONFIG_SYSTEM_MAP = {
  // Layer-based effects
  baseShine: { type: 'layer', layerClass: 'MetallicShineLayer' },
  cloudShadows: { type: 'layer', layerClass: 'CloudShadowsLayer' },
  iridescence: { type: 'layer', layerClass: 'IridescenceLayer' },
  canopy: { type: 'layer', layerClass: 'CanopyLayer' },
  structuralShadows: { type: 'layer', layerClass: 'StructuralShadowsLayer' },
  prism: { type: 'filter', filterName: 'prism' },
  ambient: { type: 'layer', layerClass: 'AmbientLayer' },
  groundGlow: { type: 'layer', layerClass: 'GroundGlowLayer' },
  heatDistortion: { type: 'layer', layerClass: 'HeatDistortionLayer' },
  physicsRope: { type: 'layer', layerClass: 'PhysicsRopeLayer' },
  
  // Post-processing filters
  postProcessing: { type: 'filter', filterName: 'postProcessing' },
  
  // Particle effects
  dust: { type: 'particle', effectKey: 'dust' },
  fire: { type: 'particle', effectKey: 'fire' },
  biofilm: { type: 'particle', effectKey: 'biofilm' },
  metallicGlints: { type: 'particle', effectKey: 'metallicGlints' },
  smellyFlies: { type: 'particle', effectKey: 'smellyFlies' },
  
  // Time control affects multiple systems
  timeControl: { type: 'cross-cutting', updateFn: 'updateTimeControl' },
  
  // Time of day affects lighting
  timeOfDay: { type: 'layer', layerClass: 'TimeOfDayLayer' },
  
  // Universal settings don't go through profile system
  universal: { type: 'universal' },
  
  // Scene appearance transitions
  sceneAppearance: { type: 'none' } // Only used during profile switches
};

/**
 * Central management system for visual effect profiles and configuration.
 *
 * The ProfileManager is the core orchestrator for all Map Shine visual effects,
 * handling profile storage, loading, merging, and application across different
 * scopes (scene, world, user overrides). It manages the complex hierarchy of
 * configuration sources and ensures consistent effect application.
 *
 * Configuration Hierarchy (highest to lowest priority):
 * 1. User overrides (client-side temporary changes)
 * 2. Scene-specific profiles (stored on scene documents)
 * 3. World default profiles (world-level settings)
 * 4. Module defaults (fallback configuration)
 *
 * Key responsibilities:
 * - Profile data persistence and retrieval
 * - Configuration merging and validation
 * - Real-time effect system updates
 * - User interface integration
 * - Scene transition handling
 * - Permission and access control
 *
 * @class ProfileManager
 * @since 1.0.0
 * @example
 * // Initialize for current scene
 * profileManager.initializeForScene();
 *
 * // Apply a profile
 * await profileManager.applyProfile(profileId);
 *
 * // Update all visual systems
 * profileManager.updateAllSystemsFromConfig();
 */
export class ProfileManager {
  constructor() {
    this.moduleId = MODULE_ID;
    this.ui = null;
    this.dataManager = new ProfileDataManager(this.moduleId);

    // Live state
    this.activeConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
    this.activeSceneId = null;
    this.status = {
      sceneHasProfiles: false,
      isDirty: false,
      error: null,
      profileSource: "none",
    };

    // Raw data stores
    this._sceneProfiles = [];
    this._activeProfileId = null;
    this._userOverrides = {};
    this._worldDefaults = {};
  }

  reset() {
    this.activeConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
    this.activeSceneId = null;
    this._sceneProfiles = [];
    this._activeProfileId = null;
    this._userOverrides = {};
    this.status = {
      sceneHasProfiles: false,
      isDirty: false,
      error: null,
      profileSource: "none",
    };
  }

  get isGm() {
    return game.user?.isGM;
  }

  async initializeForScene() {
    this.activeSceneId = canvas.scene?.id;
    if (!this.activeSceneId) {
      console.error("MapShine | ProfileManager: No active scene.");
      return;
    }
  
    // 1. Load all raw data
    this._worldDefaults = this.dataManager.loadWorldDefaults();
  
    let sceneData = this.dataManager.loadSceneData();
  
    // If no profiles exist, create a blank one automatically
    if (sceneData.profiles.length === 0) {
      await this.createBlankProfile();
      // Reload scene data after creation
      sceneData = this.dataManager.loadSceneData();
    }
  
    this._sceneProfiles = sceneData.profiles;
    this._activeProfileId = sceneData.activeProfileId;
  
    const rawUserOverrides = this.dataManager.loadUserOverrides(
      this.activeSceneId
    );
  
    // 2. Build the effective configuration
    const result = ConfigBuilder.buildEffectiveConfig({
      sceneProfiles: this._sceneProfiles,
      activeProfileId: this._activeProfileId,
      worldDefaults: this._worldDefaults,
      rawUserOverrides: rawUserOverrides,
    });
  
    // 3. Update the manager's state with the result
    this.activeConfig = result.activeConfig;
    this._userOverrides = result.userOverrides;
    this._activeProfileId = result.activeProfileId;
    this.status = result.status;
  
    console.log(
      `Map Shine | Live configuration built. Source: ${this.status.profileSource}.`
    );
  }

  // =========================================================================
  // SECTION: Scene Profile Management (GM Actions)
  // =========================================================================
  async createBlankProfile() {
    if (!this.isGm) return;
  
    // Create a blank config with everything disabled
    const blankConfig = foundry.utils.deepClone(MODULE_DEFAULTS);
    for (const key in blankConfig) {
      if (typeof blankConfig[key] === 'object' && 'enabled' in blankConfig[key]) {
        // Respect world-based settings that should always be on
        if (!blankConfig[key].worldBasedOnly) {
          blankConfig[key].enabled = false;
        }
      }
    }
  
    const newProfile = {
      id: foundry.utils.randomID(),
      name: "Blank Profile",
      config: blankConfig,
    };
  
    await this.dataManager.saveSceneData({
      profiles: [newProfile],
      activeProfileId: newProfile.id,
    });
    console.log(`Map Shine | Created blank profile for scene ${this.activeSceneId}`);
  }

  async createInitialSceneProfiles() {
    if (!this.isGm || this.status.sceneHasProfiles) return;

    const { baseConfig } = ConfigBuilder.buildEffectiveConfig({
      sceneProfiles: [],
      activeProfileId: null,
      worldDefaults: this._worldDefaults,
      rawUserOverrides: {},
    });

    const newProfile = {
      id: foundry.utils.randomID(),
      name: "Default Look",
      config: baseConfig,
    };

    await this.dataManager.saveSceneData({
      profiles: [newProfile],
      activeProfileId: newProfile.id,
    });
    ui.notifications.info("Scene-specific appearances created.");
  }

  async createSceneProfile(name) {
    if (!this.isGm) return;
    if (!name || !name.trim()) {
      ui.notifications.warn("Please provide a name for the new profile.");
      return;
    }

    const configToSave = this.getCurrentConfig({
      excludeClientOverrides: true,
    });
    const newProfile = {
      id: foundry.utils.randomID(),
      name: name.trim(),
      config: configToSave,
    };

    await this.dataManager.saveSceneData({
      profiles: [...this._sceneProfiles, newProfile],
    });
    ui.notifications.info(`Scene appearance "${name.trim()}" created.`);
  }

  async createCleanSceneProfile(name) {
    if (!this.isGm) return;
    if (!name || !name.trim()) {
      ui.notifications.warn("Please provide a name for the new profile.");
      return;
    }

    const newProfile = {
      id: foundry.utils.randomID(),
      name: name.trim(),
      config: foundry.utils.deepClone(MODULE_DEFAULTS),
    };

    const newProfiles = [...this._sceneProfiles, newProfile];
    const updates = { profiles: newProfiles };
    if (!this._activeProfileId && newProfiles.length === 1) {
      updates.activeProfileId = newProfile.id;
    }

    await this.dataManager.saveSceneData(updates);
    ui.notifications.info(`Clean scene appearance "${name.trim()}" created.`);
  }

  async updateActiveSceneProfile() {
    if (!this.isGm || !this.status.sceneHasProfiles || !this._activeProfileId)
      return;

    const configToSave = this.getCurrentConfig({
      excludeClientOverrides: true,
    });
    const profileIndex = this._sceneProfiles.findIndex(
      (p) => p.id === this._activeProfileId
    );
    if (profileIndex === -1) {
      ui.notifications.error("Could not find the active profile to update.");
      return;
    }

    const profileName = this._sceneProfiles[profileIndex].name;
    const updatedProfiles = foundry.utils.deepClone(this._sceneProfiles);
    updatedProfiles[profileIndex].config = configToSave;

    await this.dataManager.saveSceneData({ profiles: updatedProfiles });
    await this.dataManager.clearUserOverrides(this.activeSceneId);
    ui.notifications.info(`Saved changes to appearance: "${profileName}"`);
  }

  async renameSceneProfile(profileId, newName) {
    if (!this.isGm || !newName?.trim()) return;
    const profileIndex = this._sceneProfiles.findIndex(
      (p) => p.id === profileId
    );
    if (profileIndex === -1) return;

    const updatedProfiles = foundry.utils.deepClone(this._sceneProfiles);
    updatedProfiles[profileIndex].name = newName.trim();

    await this.dataManager.saveSceneData({ profiles: updatedProfiles });
    ui.notifications.info(`Renamed appearance to "${newName.trim()}".`);
  }

  async deleteSceneProfile(profileId) {
    if (!this.isGm) return;
    if (this._sceneProfiles.length <= 1) {
      ui.notifications.warn("Cannot delete the last scene appearance.");
      return;
    }

    const updatedProfiles = this._sceneProfiles.filter(
      (p) => p.id !== profileId
    );
    const updates = { profiles: updatedProfiles };
    if (this._activeProfileId === profileId) {
      updates.activeProfileId = updatedProfiles[0]?.id || null;
    }

    await this.dataManager.saveSceneData(updates);
    ui.notifications.info(`Deleted scene appearance.`);
  }

  async activateSceneProfile(profileId) {
    if (!this.isGm || profileId === this._activeProfileId) return;

    const endProfile = this._sceneProfiles.find((p) => p.id === profileId);
    if (!endProfile) return;

    const startConfig = this.getCurrentConfig({
      excludeClientOverrides: true,
    });
    const endConfig = ConfigBuilder._reconcile(
      foundry.utils.deepClone(MODULE_DEFAULTS),
      foundry.utils.deepClone(endProfile.config)
    );
    const duration = this.activeConfig.sceneAppearance.transitionDuration ?? 5000;

    const transitionPromise = game.mapShine.transitionManager.transition(
      startConfig,
      endConfig,
      duration
    );
    await this.dataManager.saveSceneData({ activeProfileId: profileId });
    await transitionPromise;
    await this.dataManager.clearUserOverrides(this.activeSceneId);

    this.initializeForScene();
    await this.updateAllSystemsFromConfig();
    if (this.ui) this.ui.render();
  }

  async handleRemoteProfileChange() {
    const { activeProfileId: newActiveId, profiles: sceneProfiles } = this.dataManager.loadSceneData();
    if (this._activeProfileId === newActiveId) return;

    const startConfig = this.activeConfig;
    const endProfile = sceneProfiles.find((p) => p.id === newActiveId);
    if (!endProfile) return;

    const endConfigResult = ConfigBuilder.buildEffectiveConfig({
      sceneProfiles: sceneProfiles,
      activeProfileId: newActiveId,
      worldDefaults: this._worldDefaults,
      rawUserOverrides: this._userOverrides, // Client's own overrides
    });
    const endConfig = endConfigResult.activeConfig;
    const duration = endConfig.sceneAppearance.transitionDuration ?? 5000;

    await game.mapShine.transitionManager.transition(
      startConfig,
      endConfig,
      duration
    );
    this.initializeForScene();
    await this.updateAllSystemsFromConfig();
    if (this.ui) this.ui.render();
  }

  // =========================================================================
  // SECTION: Previewing & World Defaults
  // =========================================================================
  async previewProfile(profileId) {
    const profile = this._sceneProfiles.find((p) => p.id === profileId);
    if (profile?.config) {
      const configToPreview = ConfigBuilder.buildEffectiveConfig(
        {
          sceneProfiles: this._sceneProfiles,
          activeProfileId: profileId,
          worldDefaults: this._worldDefaults,
          rawUserOverrides: {}, // Previews ignore user overrides
        },
        { excludeClientOverrides: false }
      ).activeConfig;
      await game.mapShine.transitionManager.preview(configToPreview);
    }
  }

  async endPreview() {
    await game.mapShine.transitionManager.endPreview();
  }

  /**
   * Saves a specific effect's current configuration as the world default for that effect.
   * Only works for effects with worldBasedOnly: true
   * @param {string} effectKey - The effect key (e.g., "fire", "baseShine")
   */
  async saveEffectAsWorldDefault(effectKey) {
    if (!this.isGm) return;
    
    const currentConfig = this.getCurrentConfig({ excludeClientOverrides: true });
    const effectConfig = currentConfig[effectKey];
    
    if (!effectConfig) {
      ui.notifications.warn(`Effect "${effectKey}" not found in configuration.`);
      return;
    }
    
    if (!effectConfig.worldBasedOnly) {
      ui.notifications.warn(`Effect "${effectKey}" is not a world-based effect.`);
      return;
    }
    
    await this.dataManager.saveEffectAsWorldDefault(effectKey, effectConfig);
    this._worldDefaults = this.dataManager.loadWorldDefaults();
    
    // Refresh the configuration to apply the new world default
    this.initializeForScene();
    await this.updateAllSystemsFromConfig();
    if (this.ui) this.ui.render();
    
    ui.notifications.info(`Saved "${effectKey}" as world default.`);
  }

  // =========================================================================
  // SECTION: User Overrides & State Management
  // =========================================================================
  async recordUserChange(path, value) {
    foundry.utils.setProperty(this._userOverrides, path, value);
    await this.dataManager.saveUserOverrides(
      this.activeSceneId,
      this._userOverrides
    );
    // Must reload after save completes to ensure we get the updated config
    this.initializeForScene();
    
    // Directly update activeConfig to ensure immediate responsiveness
    // This prevents race conditions where the reload might not pick up the change
    foundry.utils.setProperty(this.activeConfig, path, value);
  }

  async revertToSceneDefault() {
    await this.dataManager.clearUserOverrides(this.activeSceneId);
    this.initializeForScene();
    await this.updateAllSystemsFromConfig();
    if (this.ui) this.ui.render();
    ui.notifications.info("Reverted to saved profile state.");
  }

  // =========================================================================
  // SECTION: Getters & Utilities
  // =========================================================================
  getSceneProfiles() {
    return this._sceneProfiles;
  }

  getActiveProfileId() {
    return this._activeProfileId;
  }

  getWorldDefaults() {
    return this._worldDefaults;
  }

  getCurrentConfig(options = {}) {
    const buildData = {
      sceneProfiles: this._sceneProfiles,
      activeProfileId: this._activeProfileId,
      worldDefaults: this._worldDefaults,
      rawUserOverrides: this._userOverrides,
    };
    const { activeConfig } = ConfigBuilder.buildEffectiveConfig(
      buildData,
      options
    );
    return activeConfig;
  }

  /**
   * Updates only the specific system(s) affected by a configuration change.
   * This is the optimized version that routes updates to specific components.
   * 
   * @param {string} path - The configuration path that changed (e.g., "cloudShadows.wind.speed")
   * @param {*} value - The new value
   * @returns {Promise<void>}
   */
  async updateSystemFromPath(path, value) {
    if (!canvas?.ready) return;
    
    // Update the active config with the new value
    foundry.utils.setProperty(this.activeConfig, path, value);
    
    // Parse the top-level effect key from the path
    const topLevelKey = path.split('.')[0];
    const systemConfig = CONFIG_SYSTEM_MAP[topLevelKey];
    
    if (!systemConfig) {
      console.warn(`MapShine | No system mapping found for: ${topLevelKey}, falling back to full update`);
      return this.updateAllSystemsFromConfig();
    }
    
    console.log(`MapShine | Targeted update for: ${topLevelKey} (${systemConfig.type})`);
    
    switch (systemConfig.type) {
      case 'layer': {
        // Find and update only the specific layer
        const layer = canvas.layers.find(l => l.constructor.name === systemConfig.layerClass);
        if (layer && typeof layer.updateFromConfig === 'function') {
          try {
            await layer.updateFromConfig(this.activeConfig);
          } catch (e) {
            console.error(`MapShine | Error updating ${systemConfig.layerClass}:`, e);
          }
        }
        break;
      }
      
      case 'filter': {
        // Update only the specific filter(s)
        const { ScreenEffectsManager } = await import("../module.js");
        if (systemConfig.filterName === 'postProcessing') {
          // Update all post-processing filters
          ScreenEffectsManager.updateAllFiltersFromConfig(this.activeConfig);
        } else {
          // Update specific filter
          ScreenEffectsManager.updateFilterFromPath(path, this.activeConfig);
        }
        break;
      }
      
      case 'particle': {
        // Update specific particle effect
        if (systemConfig.effectKey === 'smellyFlies') {
          const fliesLayer = canvas.layers.find(l => l instanceof SmellyFliesLayer);
          if (fliesLayer && typeof fliesLayer.updateFromConfig === 'function') {
            await fliesLayer.updateFromConfig(this.activeConfig);
          }
        } else if (game.mapShine.particleManager) {
          // Update specific particle controller via the global particle manager
          const controller = game.mapShine.particleManager.controllers.get(systemConfig.effectKey);
          if (controller && typeof controller.updateFromConfig === 'function') {
            controller.updateFromConfig(this.activeConfig);
          }
        }
        break;
      }
      
      case 'cross-cutting': {
        // Handle effects that span multiple systems
        if (systemConfig.updateFn === 'updateTimeControl') {
          game.mapShine.timeControl.timeFactor = value / 100.0;
          // Time affects multiple layers - need targeted list
          const timeAffectedLayers = ['TimeOfDayLayer', 'CloudShadowsLayer', 'IridescenceLayer'];
          for (const layerName of timeAffectedLayers) {
            const layer = canvas.layers.find(l => l.constructor.name === layerName);
            if (layer && typeof layer.updateFromConfig === 'function') {
              await layer.updateFromConfig(this.activeConfig, { timeOnly: true });
            }
          }
        }
        break;
      }
      
      case 'universal': {
        // Universal settings are handled differently - they affect game settings
        // These typically require a full refresh
        return this.updateAllSystemsFromConfig();
      }
      
      case 'none': {
        // These settings don't require real-time updates
        break;
      }
      
      default:
        console.warn(`MapShine | Unknown system type: ${systemConfig.type}`);
        break;
    }
    
    // Apply tile opacities if needed (lightweight operation)
    if (game.mapShine.effectTargetManager && topLevelKey !== 'timeControl') {
      game.mapShine.effectTargetManager.applyTileOpacities();
    }
  }

  async updateAllSystemsFromConfig(options = {}) {
    if (!canvas?.ready) return;
    const config = this.activeConfig;
    game.mapShine.timeControl.timeFactor =
      config.timeControl.globalTime / 100.0;

    // Update the wind manager with the latest configuration.
    if (game.mapShine.windManager) {
      game.mapShine.windManager.updateFromConfig(
        config.fire.particles.wind
      );
    }

    for (const layer of canvas.layers) {
      if (options.skipParticles &&
        (layer instanceof ParticleLayer || layer instanceof SmellyFliesLayer)) {
        continue;
      }
      if (typeof layer.updateFromConfig === "function") {
        try {
          await layer.updateFromConfig(config, options);
        } catch (e) {
          console.error(
            `MapShine | Error updating layer ${layer.constructor.name}`,
            e
          );
        }
      }
    }
    // Dynamically import ScreenEffectsManager to avoid circular dependency
    const { ScreenEffectsManager } = await import("../module.js");
    ScreenEffectsManager.updateAllFiltersFromConfig(config);
    if (game.mapShine.effectTargetManager) {
      game.mapShine.effectTargetManager.applyTileOpacities();
    }
  }
}
