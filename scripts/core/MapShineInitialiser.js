import { MODULE_DEFAULTS } from "../config/MODULE_DEFAULTS.js";
import { MODULE_ID } from "../config/constants.js";
import { SettingsManager } from "../managers/SettingsManager.js";
import { LayerManager } from "../managers/LayerManager.js";
import { HooksManager } from "../managers/HooksManager.js";
import { SceneChangeManager } from "../managers/SceneChangeManager.js";
import { ProfileManager } from "../managers/ProfileManager.js";
import { AppearanceTransitionManager } from "../managers/AppearanceTransitionManager.js";
import { UnifiedTransitionManager } from "../managers/UnifiedTransitionManager.js";
import { DayNightClock } from "./Clock.js";
import { MaterialEditorDebugger } from "../ui/MaterialEditorDebugger.js";
import { UserGuide } from "../ui/UserGuide.js";
import { LoadingUI } from "../ui/LoadingUI.js";
import { CombatEffectManager } from "../managers/CombatEffectManager.js";
import { TextureAutoLoader } from "../utils/TextureAutoLoader.js";
import { MapPointsManager } from "../managers/map-points-adapter.js";
import { MapPointsInteractionManager } from "../managers/map-points-interaction-adapter.js";

// hexToRgbArray has been moved to scripts/utils/ColorUtils.js
// NativeAnimation has been moved to scripts/utils/NativeAnimation.js
// FontLoader has been moved to scripts/utils/FontLoader.js
// =================================================================================
// SECTION 2: MODULE INITIALIZATION & LIFECYCLE
// =================================================================================
// Description: Handles module initialization, settings registration, layer setup,
//              hooks management, and lifecycle events.
// ---------------------------------------------------------------------------------
/**
 * Orchestrates the entire module initialization sequence for the Map Shine module.
 *
 * This class serves as the central coordinator for module startup, ensuring that
 * all components are initialized in the correct order and dependencies are properly
 * established. It handles:
 * - Settings registration through SettingsManager
 * - Canvas layer registration through LayerManager
 * - Global namespace initialization with core managers
 * - Hook and integration setup through HooksManager
 * - Scene change manager initialization
 *
 * The initialization process is designed to be idempotent and safe to call multiple times.
 *
 * @class MapShineInitialiser
 * @static
 * @since 1.0.0
 */
export class MapShineInitialiser {
  /**
   * Main initialization function for the module, called during the 'init' hook.
   * Orchestrates the setup of settings, layers, hooks, and the global namespace.
   */
  static initialize() {
    if (game.mapShine?.initialized) {
      return;
    }
    console.log("Map Shine | Initializing.");
    SettingsManager.registerSettings();
    this._initializeGlobalNamespace();

    // Initialize the SceneChangeManager to register its hooks
    game.mapShine.sceneChangeManager.initialize();

    LayerManager.registerLayers();
    HooksManager.registerIntegrationsAndHooks();
    console.log("Map Shine | Initialization complete.");
  }

  /**
   * Creates the global `game.mapShine` object and initializes its core managers and state.
   */
  static _initializeGlobalNamespace() {
    game.mapShine = {
      initialized: true,
      isCustomPaused: false,
      transitionActive: false,
      combatEffectManager: new CombatEffectManager(),
      timeControl: {
        timeFactor: 1.0,
      },
      systemsReady: false,
      MODULE_DEFAULTS: MODULE_DEFAULTS, // Expose for UI generation
      loadingScreen: null,
      loadingManager: {
        screen: null,
        waypoints: {
          START: 0,
          DEPENDENCIES_START: 5,
          DEPENDENCIES_END: 15,
          DISCOVERY_START: 20,
          DISCOVERY_END: 40,
          TEXTURE_PRELOAD_START: 41,
          TEXTURE_PRELOAD_END: 44,
          TEXTURE_OPTIMIZATION_START: 44.2,
          TEXTURE_OPTIMIZATION_END: 44.8,
          SHADER_PREWARM_START: 44.85,
          SHADER_PREWARM_END: 44.95,
          WATER_PREWARM_START: 44.96,
          WATER_PREWARM_END: 44.99,
          SETUP_START: 45,
          RESOURCE_MANAGER_INIT: 48,
          PROFILES_INIT: 50,
          FIRE_WIND_INIT: 52,
          WIND_INIT: 52.5,
          WEATHER_SYSTEM_INIT: 53,
          WEATHER_ORCHESTRATOR_INIT: 54,
          CONFIG_FINALIZE: 55,
          LAYERS_UPDATE_START: 60,
          LAYERS_UPDATE_END: 70,
          MASKED_LAYERS_PREWARM_START: 70.1,
          MASKED_LAYERS_PREWARM_END: 70.5,
          GEOMETRY_MASKS_PREWARM_START: 70.6,
          GEOMETRY_MASKS_PREWARM_END: 70.9,
          PARTICLES_SETUP_START: 71,
          PARTICLES_SETUP_END: 74,
          SCREEN_FX_INIT: 75,
          TOKEN_MANAGER_INIT: 78,
          DYNAMIC_EXPOSURE_INIT: 80,
          PAUSE_COMBAT_INIT: 82,
          GEOMETRY_MANAGER_INIT: 85,
          CANVAS_MANAGERS_INIT: 90,
          STRUCTURAL_HIGHLIGHTS: 95,
          SETUP_COMPLETE: 100,
        },
        messages: {
          START: "Initializing...",
          DEPENDENCIES_START: "Waiting for dependencies...",
          DEPENDENCIES_END: "Dependencies ready.",
          DISCOVERY_START: "Discovering effect maps...",
          DISCOVERY_END: "Effect maps found.",
          TEXTURE_PRELOAD_START: "Pre-loading textures...",
          TEXTURE_PRELOAD_END: "Textures ready.",
          TEXTURE_OPTIMIZATION_START: "Optimizing textures...",
          TEXTURE_OPTIMIZATION_END: "Textures optimized.",
          SHADER_PREWARM_START: "Pre-warming shaders...",
          SHADER_PREWARM_END: "Shaders ready.",
          SETUP_START: "Configuring effects...",
          RESOURCE_MANAGER_INIT: "Initializing resource manager...",
          PROFILES_INIT: "Loading profiles...",
          FIRE_WIND_INIT: "Initializing fire & wind effects...",
          WIND_INIT: "Initializing wind system...",
          WEATHER_SYSTEM_INIT: "Initializing weather system...",
          WEATHER_ORCHESTRATOR_INIT: "Initializing weather orchestrator...",
          CONFIG_FINALIZE: "Finalizing configuration...",
          LAYERS_UPDATE_START: "Updating effect layers...",
          LAYERS_UPDATE_END: "Effect layers updated.",
          MASKED_LAYERS_PREWARM_START: "Pre-warming layer masks...",
          MASKED_LAYERS_PREWARM_END: "Layer masks ready.",
          GEOMETRY_MASKS_PREWARM_START: "Pre-warming geometry masks...",
          GEOMETRY_MASKS_PREWARM_END: "Geometry masks ready.",
          PARTICLES_SETUP_START: "Initializing particle systems...",
          PARTICLES_SETUP_END: "Particle systems ready.",
          SCREEN_FX_INIT: "Initializing screen effects...",
          TOKEN_MANAGER_INIT: "Initializing token manager...",
          DYNAMIC_EXPOSURE_INIT: "Initializing dynamic exposure...",
          PAUSE_COMBAT_INIT: "Initializing pause & combat effects...",
          GEOMETRY_MANAGER_INIT: "Initializing geometry manager...",
          CANVAS_MANAGERS_INIT: "Initializing canvas managers...",
          STRUCTURAL_HIGHLIGHTS: "Rendering structural highlights...",
          SETUP_COMPLETE: "Finalizing scene...",
        },
        setProgress(waypoint) {
          console.log(`[LoadingManager] setProgress called: ${waypoint}`);
          console.log(`  - screen exists:`, !!this.screen);
          console.log(`  - waypoint value:`, this.waypoints[waypoint]);
          console.log(`  - message:`, this.messages[waypoint]);
          if (this.screen) {
            this.screen.setProgress(
              this.waypoints[waypoint],
              this.messages[waypoint]
            );
          } else {
            console.warn("[LoadingManager] No screen reference! Cannot update progress.");
          }
        },
        async tick(waypoint) {
          console.log(`[LoadingManager] tick called: ${waypoint}`);
          if (this.screen) {
            this.screen.setProgress(
              this.waypoints[waypoint],
              this.messages[waypoint]
            );
            // Yield to the event loop, allowing the browser to repaint.
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        },
      },
      profileManager: new ProfileManager(),
      transitionManager: null, // Initialized below (AppearanceTransitionManager)
      unifiedTransitionManager: null, // Initialized below
      sceneChangeManager: new SceneChangeManager(),
      resourceManager: null, // The new resource manager
      lightMaskManager: null,
      mapPointsManager: (globalThis.MapPointsManager || MapPointsManager || null),
      mapPointsInteractionManager: (globalThis.MapPointsInteractionManager ? new globalThis.MapPointsInteractionManager() : null),
      geometryMaskManager: null,
      activeMapPointGroup: null,
      mapPointsInitialized: false,
      userGuide: null,
    };

    // This is the core function that gets called repeatedly when the clock is dragged.
    const doUpdateTimeOfDay = async function (time) {
      if (game.mapShine.profileManager) {
        console.log(`MapShine | Updating time of day to: ${time}`);

        // Record the change. This updates the activeConfig immediately.
        await game.mapShine.profileManager.recordUserChange(
          "timeOfDay.currentTime",
          time
        );

        // If the user is a GM, and the setting is enabled, update the scene darkness.
        if (game.user.isGM) {
          const todConfig = game.mapShine.profileManager.activeConfig.timeOfDay;
          if (todConfig.syncToSceneDarkness) {
            // Calculate darkness level based on a cosine curve for a natural day/night cycle.
            // Midnight (0/24) = 1, Midday (12) = 0.
            const darkness = 0.5 * (Math.cos((Math.PI * time) / 12) + 1);
            if (canvas.scene) {
              // Clamp the value to prevent any floating point errors going outside the 0-1 range.
              const clampedDarkness = Math.max(0, Math.min(1, darkness));

              await canvas.scene.update({ darkness: clampedDarkness });
            }
          }
        }

        // Trigger the expensive update for all visual systems.
        console.log(
          `MapShine | Updating all systems with time: ${game.mapShine.profileManager.activeConfig.timeOfDay.currentTime}`
        );
        await game.mapShine.profileManager.updateAllSystemsFromConfig();
        // Notify other components (like the clock UI itself) that the time has officially changed.
        // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
        Hooks.callAll("mapShine:timeChanged", time);
      }
    };
    // Create the throttled (debounced) version of the function and assign it to the global namespace.
    // This will wait for a 100ms pause in calls before executing, preventing overload.
    game.mapShine.updateTimeOfDay = foundry.utils.throttle(
      doUpdateTimeOfDay,
      100
    );

    game.mapShine.effectTargetManager = {
      targets: {
        background: null,
        tiles: new Map(),
      },
      async refresh() {
        // console.log("MapShine | Refreshing effect targets...");
        const FLAG_NAME = "mapShineTargets";

        if (game.user.isGM) {
          const loader = new TextureAutoLoader();
          const discoveredTargets = await loader.discoverAllTargets();

          const serializableTiles = Array.from(
            discoveredTargets.tiles.entries()
          ).map(([tileId, targetData]) => {
            const { tile: _tile, ...rest } = targetData;
            return [tileId, rest];
          });

          const serializableTargets = {
            background: discoveredTargets.background,
            tiles: serializableTiles,
          };

          const oldFlagData = canvas.scene.getFlag(MODULE_ID, FLAG_NAME);

          if (JSON.stringify(serializableTargets) === JSON.stringify(oldFlagData)) {
            // console.log(
            //   "MapShine | Discovered targets are unchanged. No flag update needed."
            // );
            this.targets = discoveredTargets;
          } else {
            // console.log(
            //   "MapShine | New effect targets discovered. Updating scene flag."
            // );
            // Update the local state immediately to resolve the race condition for the GM.
            this.targets = discoveredTargets;
            await canvas.scene.setFlag(
              MODULE_ID,
              FLAG_NAME,
              serializableTargets
            );
            // The early return is removed. The rest of the function will now execute for the GM,
            // ensuring the loading process can continue without waiting for the updateScene hook.
          }
        } else {
          const flagData = /** @type {any} */ (
            canvas.scene.getFlag(MODULE_ID, FLAG_NAME)
          );
          if (flagData) {
            const rehydratedTiles = new Map();

            if (flagData.tiles) {
              for (const [tileId, targetData] of flagData.tiles) {
                const tile = canvas.tiles.get(tileId);
                if (tile) {
                  rehydratedTiles.set(tileId, {
                    ...targetData,
                    tile: tile,
                  });
                }
              }
            }
            this.targets = {
              background: flagData.background,
              tiles: rehydratedTiles,
            };
          } else {
            this.targets = {
              background: null,
              tiles: new Map(),
            };
          }
        }

        const allTargets = [
          this.targets.background,
          ...this.targets.tiles.values(),
        ].filter((t) => t);
        for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
          const foundPath = allTargets.map((t) => t[key]).find((p) => p);
          if (foundPath) {
            systemStatus.update("textures", key, {
              state: "ok",
              message: foundPath,
            });
          } else {
            systemStatus.update("textures", key, {
              state: "inactive",
              message: "Auto-discovery found no matching file.",
            });
          }
        }

        this.applyTileOpacities();
        await this.broadcastUpdate();
        // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
        Hooks.callAll("mapShine:targetsRefreshed");
      },
      async broadcastUpdate() {
        const updatePromises = [];
        for (const layer of canvas.layers) {
          if (typeof layer.updateEffectTargets === "function") {
            updatePromises.push(layer.updateEffectTargets(this.targets));
          }
        }
        await Promise.all(updatePromises);
      },
      applyTileOpacities() {
        const config = game.mapShine.profileManager.activeConfig;
        for (const tile of canvas.tiles.placeables) {
          if (!tile.mesh ||
            tile.isManagedByOverheadLayer ||
            tile.isManagedByBgLayer)
            continue;

          const isTargetWithEffects = this.targets.tiles.has(tile.id) && config.enabled;
          if (isTargetWithEffects && !tile.document.restrictions?.weather) {
            tile.mesh.alpha = config.tileOpacity;
          } else if (!isTargetWithEffects) {
            tile.mesh.alpha = 1.0;
          }
        }
      },
    };

    game.mapShine.debugger = null;
    game.mapShine.activeEditor = null;
    game.mapShine.showEditor = async function () {
      if (game.mapShine.activeEditor) {
        await game.mapShine.activeEditor.close();
      }
      // Only GMs can access advanced mode; non-GMs always get Simple UI
      const isGM = game.user.isGM;
      const isAdvancedMode = isGM && game.settings.get(MODULE_ID, "advanced-ui-mode");
      const editor = isAdvancedMode
        ? new MaterialEditorDebugger()
        : new SimpleUIPanel();
      game.mapShine.activeEditor = editor;
      if (isAdvancedMode) {
        game.mapShine.debugger = editor;
        // This type guard ensures the checker knows `editor` is a MaterialEditorDebugger.
        if (editor instanceof MaterialEditorDebugger) {
          editor.initialize(game.mapShine.profileManager);
        }
      } else {
        game.mapShine.debugger = null;
        editor.render(true);
      }
    };

    game.mapShine.dayNightClock = null;
    game.mapShine.showDayNightClock = function () {
      if (game.mapShine.dayNightClock) {
        game.mapShine.dayNightClock.close();
      } else {
        game.mapShine.dayNightClock = new DayNightClock().render(true);
      }
    };

    game.mapShine.userGuide = null;
    game.mapShine.showUserGuide = function () {
      if (game.mapShine.userGuide) {
        game.mapShine.userGuide.bringToTop();
      } else {
        game.mapShine.userGuide = new UserGuide().render(true);
      }
    };

    // Initialize the transition manager, providing it with the profile manager instance.
    game.mapShine.transitionManager = new AppearanceTransitionManager(
      game.mapShine.profileManager
    );

    // Initialize the unified transition manager for time & weather transitions
    game.mapShine.unifiedTransitionManager = new UnifiedTransitionManager();

    // Show the loading screen now that the global namespace exists.
    if (!game.settings.get(MODULE_ID, "disable-loading-screen")) {
      game.mapShine.loadingScreen = new LoadingUI({
        elementId: "map-shine-loading-screen",
        title: game.world?.title || "Loading...",
        fadeOutDuration: 1500,
      });
      game.mapShine.loadingScreen.show();
      // Connect the loading screen to the loading manager
      game.mapShine.loadingManager.screen = game.mapShine.loadingScreen;
    }
  }
}
