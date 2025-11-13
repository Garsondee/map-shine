/**
 * Manages the registration and configuration of all hooks, event listeners, and libWrapper patches.
 *
 * This class serves as the central integration point between the Map Shine module and
 * Foundry VTT's event system. It handles:
 * - Third-party library integration (PIXI particles)
 * - Custom behavior registration for particle systems
 * - Global event listeners (keyboard, mouse)
 * - libWrapper patches for core Foundry functionality
 * - Foundry VTT hook registrations for lifecycle events
 *
 * The integration system ensures proper module interoperability and extends
 * Foundry's core functionality without breaking existing behavior.
 *
 * @class HooksManager
 * @static
 * @since 1.0.0
 */
import { MODULE_ID, MAX_DELTA_TIME } from "../config/constants.js";
import { CoordinateManager } from "./CoordinateManager.js";
import { ScreenEffectsManager } from "./ScreenEffectsManager.js";
import { MapShineLifecycle } from "../core/MapShineLifecycle.js";
import { MapShineClock } from "../core/Clock.js";
import { PauseManager } from "./PauseManager.js";
import { UPDATE_PRIORITY } from "../pixi-adapter.js";
import { Emitter, ShapeSpawnBehavior } from "../particles/particle-adapter.js";
import { MapShineInitialiser } from "../core/MapShineInitialiser.js";
import { MapShineTestRunner } from "../tests/test-runner-adapter.js";
import { TextureMaskShape } from "../shapes-adapter.js";

export class HooksManager {
  /**
   * Tracks pending particle behavior and shape registrations that need retry attempts
   */
  static _pendingBehaviors = [];
  static _pendingShapes = [];
  static _retryAttempts = 0;
  static _maxRetries = 10;
  static _retryDelays = [100, 200, 500, 1000, 2000, 3000, 5000, 8000, 10000, 15000]; // Progressive delays

  /**
   * Registers libWrapper patches, hooks, and other event listeners.
   */
  static registerIntegrationsAndHooks() {
    // --- Particle Library Integration ---
    console.log("Map Shine | Library Test: Verifying PIXI.particles global.");
    if (PIXI.particles && typeof PIXI.particles.Emitter === "function") {
      console.log(
        "%cSUCCESS:",
        "color: #4CAF50; font-weight: bold;",
        "pixi-particles library loaded correctly onto PIXI object."
      );

      // Reset pending lists
      this._pendingBehaviors = [];
      this._pendingShapes = [];

      // Try to register shapes
      if (TextureMaskShape) {
        PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(TextureMaskShape);
      } else {
        this._pendingShapes.push("TextureMaskShape");
      }

      if (typeof GeometryMaskShape !== "undefined" && GeometryMaskShape) {
        PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(GeometryMaskShape);
      } else {
        this._pendingShapes.push("GeometryMaskShape");
      }

      // Try to register behaviors
      const tryRegister = (name, behavior) => {
        if (typeof behavior !== "undefined" && behavior) {
          PIXI.particles.Emitter.registerBehavior(behavior);
        } else {
          this._pendingBehaviors.push(name);
        }
      };

      tryRegister("SparkPathBehavior", typeof SparkPathBehavior !== "undefined" && SparkPathBehavior ? SparkPathBehavior : null);
      tryRegister("CandleFlameBehavior", typeof CandleFlameBehavior !== "undefined" && CandleFlameBehavior ? CandleFlameBehavior : null);
      tryRegister("WindBehavior", typeof WindBehavior !== "undefined" && WindBehavior ? WindBehavior : null);
      tryRegister("ZDepthBehavior", typeof ZDepthBehavior !== "undefined" && ZDepthBehavior ? ZDepthBehavior : null);
      tryRegister("VelocityStreakBehavior", typeof VelocityStreakBehavior !== "undefined" && VelocityStreakBehavior ? VelocityStreakBehavior : null);
      tryRegister("GroundCollisionBehavior", typeof GroundCollisionBehavior !== "undefined" && GroundCollisionBehavior ? GroundCollisionBehavior : null);
      tryRegister("PressurisedSteamBehavior", typeof PressurisedSteamBehavior !== "undefined" && PressurisedSteamBehavior ? PressurisedSteamBehavior : null);
      tryRegister("SmellyFliesBehavior", typeof SmellyFliesBehavior !== "undefined" && SmellyFliesBehavior ? SmellyFliesBehavior : null);
      tryRegister("ColorFromSpawnBehavior", typeof ColorFromSpawnBehavior !== "undefined" && ColorFromSpawnBehavior ? ColorFromSpawnBehavior : null);
      tryRegister("MapShineLightingBehavior", typeof MapShineLightingBehavior !== "undefined" && MapShineLightingBehavior ? MapShineLightingBehavior : null);
      tryRegister("DropletStreakBehavior", typeof DropletStreakBehavior !== "undefined" && DropletStreakBehavior ? DropletStreakBehavior : null);
      tryRegister("EdgePointsSpawnBehavior", typeof EdgePointsSpawnBehavior !== "undefined" && EdgePointsSpawnBehavior ? EdgePointsSpawnBehavior : null);

      // Schedule retry if needed
      const totalPending = this._pendingBehaviors.length + this._pendingShapes.length;
      if (totalPending > 0) {
        console.log(
          `MapShine | ${this._pendingBehaviors.length} particle behaviors and ${this._pendingShapes.length} shapes pending (classes not loaded yet). Will retry...`
        );
        this._scheduleRetry();
      }
    } else {
      console.error(
        "FAILURE: pixi-particles library did not attach to the global PIXI object."
      );
    }

    // --- Keyboard Listener ---
    window.addEventListener(
      "keydown",
      (event) => {
        if (game.mapShine?.mapPointsInteractionManager?.handleEscape(event)) {
          return;
        }
      },
      true
    );

    // --- libWrapper Patches ---
    if (game.modules.get("lib-wrapper")?.active) {
      // Check if scene transitions are enabled
      const sceneTransitionsEnabled = game.settings.get(
        MODULE_ID,
        "enable-scene-transitions"
      );

      if (sceneTransitionsEnabled) {
        console.log(
          "Map Shine | Scene transitions enabled - registering Scene.prototype.view wrapper"
        );

        /**
         * Scene Transition Wrapper - Event-Driven Lifecycle Coordination
         *
         * ARCHITECTURE:
         * This wrapper uses a Hook-based coordination system to synchronize the
         * scene transition overlay with the MapShine lifecycle. Instead of relying
         * on global promise resolvers (fragile) or hardcoded delays (unreliable),
         * it listens for the 'mapShine:setupComplete' Hook event.
         *
         * FLOW:
         * 1. Create and fade in the transition overlay
         * 2. Execute the scene change (calls wrapped function)
         * 3. Wait for 'mapShine:setupComplete' Hook OR timeout
         * 4. Fade out the overlay to reveal the new scene
         * 5. Clean up (always happens via finally block)
         *
         * ERROR HANDLING:
         * - Comprehensive try-catch blocks at each phase
         * - Overlay cleanup guaranteed via finally block
         * - Hook cleanup in both success and error paths
         * - Graceful fallback to default behavior on critical errors
         */
        try {
          if (game.mapShine?._sceneViewWrapperRegistered) {
            console.warn("Map Shine | Scene.prototype.view wrapper already registered; skipping duplicate registration");
            return;
          }
          libWrapper.register(
            MODULE_ID,
            "Scene.prototype.view",
            async function (wrapped, ...args) {
              try {
                // === PHASE 1: VALIDATION ===
                // Validate critical dependencies before proceeding
                if (!game?.mapShine?.sceneChangeManager) {
                  // Use info instead of warn during initial load
                  const logLevel = game.ready ? console.warn : console.log;
                  logLevel.call(console,
                    "[MapShine Transition] sceneChangeManager not available, using default scene transition"
                  );
                  return wrapped(...args);
                }

                if (!canvas?.scene) {
                  // This is expected during initial world load before canvas is ready
                  // Use info instead of warn to avoid alarming users
                  const logLevel = game.ready ? console.warn : console.log;
                  logLevel.call(console,
                    "[MapShine Transition] Canvas not initialized yet, using default scene transition (this is normal during initial load)"
                  );
                  return wrapped(...args);
                }

                const sceneManager = game.mapShine.sceneChangeManager;
                const sceneToView = this;
                const currentScene = canvas.scene;

                // Validate scene objects
                if (!sceneToView?.id || !currentScene?.id) {
                  console.warn(
                    "[MapShine Transition] Invalid scene data, using default scene transition"
                  );
                  return wrapped(...args);
                }

                // Skip if same scene
                if (sceneToView.id === currentScene.id) {
                  return wrapped(...args);
                }

                // === PHASE 2: CONFIGURATION ===
                // Build transition config with defensive fallbacks
                let transitionConfig;
                try {
                  transitionConfig = {
                    enabled:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.enabled"
                      ) ?? true,
                    fadeOutDuration:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.fadeOutDuration"
                      ) ?? 1500,
                    fadeInDuration:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.fadeInDuration"
                      ) ?? 1500,
                    logoPath:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.logoPath"
                      ) ?? "",
                    heading:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.heading"
                      ) ?? "Loading...",
                    subheading:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.subheading"
                      ) ?? "",
                    staticDescription:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.staticDescription"
                      ) ?? "",
                    showSceneName:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.showSceneName"
                      ) ?? true,
                    useRandomHint:
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.useRandomHint"
                      ) ?? false,
                    randomHints: (
                      game.settings.get(
                        MODULE_ID,
                        "universal.sceneTransition.randomHints"
                      ) || ""
                    )
                      .split(/\r?\n/)
                      .filter((h) => h.trim() !== ""),
                    staticBackgroundImage:
                      game.settings.get(
                        MODULE_ID,
                        "loading-screen-static-background"
                      ) ?? "",
                    useRandomBackgroundImage:
                      game.settings.get(
                        MODULE_ID,
                        "loading-screen-use-random-background"
                      ) ?? false,
                    backgroundImages: (
                      game.settings.get(
                        MODULE_ID,
                        "loading-screen-random-backgrounds"
                      ) || ""
                    )
                      .split(/\r?\n/)
                      .filter((h) => h.trim() !== ""),
                    backgroundOverlayEnabled:
                      game.settings.get(
                        MODULE_ID,
                        "loading-screen-background-overlay-enabled"
                      ) ?? true,
                    backgroundOverlayOpacity:
                      game.settings.get(
                        MODULE_ID,
                        "loading-screen-background-overlay-opacity"
                      ) ?? 0.7,
                  };
                } catch (configError) {
                  console.error(
                    "[MapShine Transition] Failed to load settings, using default scene transition:",
                    configError
                  );
                  return wrapped(...args);
                }

                // Skip if disabled
                if (!transitionConfig.enabled) {
                  return wrapped(...args);
                }

                // === PHASE 3: TRANSITION EXECUTION ===
                console.log(
                  `%c[MapShine Transition] Starting transition: ${currentScene.name} → ${sceneToView.name}`,
                  "font-weight: bold; color: #40a0fa;"
                );

                // Preload scene assets
                try {
                  await game.scenes.preload(sceneToView.id);
                } catch (preloadError) {
                  console.warn(
                    "[MapShine Transition] Scene preload failed, continuing anyway:",
                    preloadError
                  );
                }

                // Create and fade out overlay
                try {
                  sceneManager._createOverlay();
                  await sceneManager.fadeOut(transitionConfig, sceneToView);
                } catch (overlayError) {
                  console.error(
                    "[MapShine Transition] Overlay creation/fadeOut failed:",
                    overlayError
                  );
                  // Continue with transition even if overlay fails
                }

                // Create a promise that resolves when the mapShine:setupComplete Hook fires
                const setupCompletePromise = new Promise((resolve) => {
                  const hookId = Hooks.once(
                    "mapShine:setupComplete",
                    (data) => {
                      console.log(
                        `[MapShine Transition] Setup complete (${data.type}), proceeding with fade-in`
                      );
                      resolve();
                    }
                  );
                  // Store hookId for cleanup if needed
                  game.mapShine._transitionHookId = hookId;
                });

                // Execute the actual scene transition
                const result = await wrapped(...args);

                // Wait for setup with timeout
                const timeoutDuration =
                  game.settings.get(MODULE_ID, "scene-transition-timeout") ??
                  10000;
                const timeoutPromise = new Promise((resolve) =>
                  setTimeout(() => {
                    console.warn(
                      `[MapShine Transition] Setup timeout after ${timeoutDuration}ms, proceeding with fade-in`
                    );
                    // Clean up the hook if timeout occurs
                    if (game.mapShine._transitionHookId !== undefined) {
                      Hooks.off(
                        "mapShine:setupComplete",
                        game.mapShine._transitionHookId
                      );
                      game.mapShine._transitionHookId = undefined;
                    }
                    resolve();
                  }, timeoutDuration)
                );

                await Promise.race([setupCompletePromise, timeoutPromise]);

                // Clean up hook reference
                game.mapShine._transitionHookId = undefined;

                // Fade in new scene
                try {
                  await sceneManager.fadeIn(transitionConfig);
                } catch (fadeInError) {
                  console.error(
                    "[MapShine Transition] Fade-in failed:",
                    fadeInError
                  );
                } finally {
                  // Always destroy overlay
                  try {
                    sceneManager._destroyOverlay();
                  } catch (destroyError) {
                    console.error(
                      "[MapShine Transition] Overlay destruction failed:",
                      destroyError
                    );
                  }
                }

                console.log(
                  `%c[MapShine Transition] Transition complete: ${sceneToView.name}`,
                  "font-weight: bold; color: #10b981;"
                );
                return result;
              } catch (error) {
                console.error(
                  "[MapShine Transition] CRITICAL ERROR in wrapper:",
                  error
                );
                console.error(
                  "[MapShine Transition] Stack trace:",
                  error.stack
                );

                // Emergency cleanup
                try {
                  game.mapShine?.sceneChangeManager?._destroyOverlay();
                  // Clean up hook if it exists
                  if (game.mapShine?._transitionHookId !== undefined) {
                    Hooks.off(
                      "mapShine:setupComplete",
                      game.mapShine._transitionHookId
                    );
                    game.mapShine._transitionHookId = undefined;
                  }
                } catch (cleanupError) {
                  // Ignore cleanup errors
                }

                // Fall back to default behavior
                return wrapped(...args);
              }
            },
            "WRAPPER"
          );

          console.log(
            "Map Shine | Scene.prototype.view wrapper registered successfully"
          );
          if (game.mapShine) game.mapShine._sceneViewWrapperRegistered = true;
        } catch (registrationError) {
          console.error(
            "Map Shine | FAILED to register Scene.prototype.view wrapper:",
            registrationError
          );
          console.error(
            "Map Shine | Scene transitions will be disabled. Stack:",
            registrationError.stack
          );
        }
      } else {
        console.log("Map Shine | Scene transitions disabled by setting");
      }
    } else {
      console.warn(
        "Map Shine | libWrapper is not active. Elegant scene transitions will be disabled."
      );
    }

    // --- Edge Case: Worlds with No Scenes ---
    // If a world has no scenes, the canvasReady hook will never fire, causing the
    // loading screen to hang indefinitely. This ready hook detects that condition
    // and manually hides the loading screen so the GM can create a scene.
    Hooks.once("ready", () => {
      if (game.scenes.size === 0 && game.mapShine?.loadingScreen) {
        console.log(
          "Map Shine | No scenes detected in world - hiding loading screen to allow scene creation"
        );
        game.mapShine.loadingScreen.hide();
      }
    });

    // This hook ensures settings that should be textareas are rendered as such.

    Hooks.on("renderSettingsConfig", (_app, html) => {
      const settingsToConvert = [
        `${MODULE_ID}.universal.sceneTransition.randomHints`,
        `${MODULE_ID}.loading-screen-random-backgrounds`,
        `${MODULE_ID}.universal.pauseEffect.randomHints`,
      ];

      settingsToConvert.forEach((settingKey) => {
        // Use the standard querySelector method, as 'html' is a raw HTMLElement.
        const input = html.querySelector(`[name="${settingKey}"]`);

        if (input) {
          // The key for game.settings.get is the part *after* the module ID.
          const gameSettingKey = settingKey.replace(`${MODULE_ID}.`, "");
          let value = game.settings.get(MODULE_ID, gameSettingKey);

          // If the setting was somehow saved as an array, join it back into a newline-separated string.
          if (Array.isArray(value)) {
            value = value.join("\n");
          }

          const textarea = document.createElement("textarea");

          textarea.name = input.name;
          textarea.id = input.id;
          textarea.value = value; // Use the raw value.
          textarea.rows = 5; // Set a reasonable default height.

          // Replace the original input element with the new textarea element.
          input.replaceWith(textarea);
        }
      });
    });

    // --- Standard Hooks ---

    // Initialize the new unified and robust pause manager.
    PauseManager.initialize();

    Hooks.on("createTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("updateTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("deleteTile", () => game.mapShine?.effectTargetManager.refresh());
    Hooks.on("updateScene", (scene, data) => {
      if (!scene.isView) return;

      const flagPath = `flags.${MODULE_ID}`;
      const backgroundPath = "background.src";
      // Corrected path for the active profile ID.
      const profileIdPath = `flags.${MODULE_ID}.activeProfileId`;
      // Corrected path for the scene profiles array.
      const sceneProfilesPath = `flags.${MODULE_ID}.profiles`;

      // Check for texture discovery updates from the GM.
      if (
        foundry.utils.hasProperty(data, `${flagPath}.mapShineTargets`) ||
        foundry.utils.hasProperty(data, backgroundPath)
      ) {
        game.mapShine?.effectTargetManager.refresh();
      }

      // Check for changes to the list of profiles (add, remove, rename).
      // This requires a full UI re-render for the debugger.
      if (foundry.utils.hasProperty(data, sceneProfilesPath)) {
        game.mapShine?.profileManager.initializeForScene();
        game.mapShine?.profileManager.updateAllSystemsFromConfig();
        // If the debugger is open, it must be re-rendered to reflect structural changes
        // like creating/deleting/renaming profiles.
        if (game.mapShine.debugger) {
          game.mapShine.debugger.render();
        }
      }

      // Check for a change in the active profile ID to trigger transitions for non-GM clients.
      if (foundry.utils.hasProperty(data, profileIdPath)) {
        // GMs initiate the change, so they don't need to react to their own update.
        // Other clients will see the flag change and trigger a smooth transition.
        if (!game.user.isGM) {
          game.mapShine?.profileManager.handleRemoteProfileChange();
        }
      }
    });

    Hooks.on("canvasInit", (canvas) => {
      // This is the earliest point where the renderer screen is available. We perform
      // an initial update here to ensure CoordinateManager has valid data before any
      // layer's _draw() method is called, preventing framebuffer errors.
      CoordinateManager.update();

      // Create the worldContainer ONCE - this is the single authoritative creation point
      const worldContainer = new PIXI.Container();
      worldContainer.name = "mapShineWorldContainer";
      worldContainer.addChild(...canvas.stage.children);
      canvas.stage.addChild(worldContainer);
      game.mapShine.worldContainer = worldContainer;
      
      console.log("Map Shine | worldContainer created in canvasInit");
    });
    Hooks.on("canvasReady", (canvas) => {
      // This ticker takes over after the initial draw, ensuring that the CoordinateManager
      // and ResourceManager are kept up-to-date on every subsequent animation frame.
      const mainTicker = () => {
        if (canvas?.stage) {
          // Performance optimization: skip all updates for empty scenes
          if (!game.mapShine?.hasContent) return;
          
          CoordinateManager.update();
          game.mapShine.resourceManager?.onFrameStart();
          game.mapShine.lightMaskManager?.update();
          const deltaTime = Math.min(
            canvas.app.ticker.elapsedMS / 1000,
            MAX_DELTA_TIME
          );
          // Update weather system (transitions, particle counts, etc.)
          game.mapShine.weatherSystemManager?.update(deltaTime);
          ScreenEffectsManager.updateFrame(deltaTime);
        }
      };
      canvas.app.ticker.add(mainTicker, null, UPDATE_PRIORITY.HIGH);

      // It's crucial to clean up the ticker when the canvas is torn down to prevent errors.
      Hooks.once("canvasTearDown", () => {
        canvas.app.ticker.remove(mainTicker);
      });

      // Start the main setup and discovery process.
      MapShineLifecycle.beginPersistentDiscovery(canvas);

      if (canvas.roofs) {
        // Set a high z-index to render above most custom effect layers.
        // Ambient is 250, Prism 251, etc. This places roofs above them.

        canvas.roofs.zIndex = 260;
        // The stage's children need to be re-sorted for the new z-index to take effect.

        canvas.stage.sortChildren();
        console.log(
          "Map Shine | Elevated RoofsLayer z-index to 260 to ensure overhead tiles render on top of effects."
        );
      }
    });
  }

  /**
   * Schedule a retry attempt for pending particle behavior and shape registrations
   */
  static _scheduleRetry() {
    if (this._retryAttempts >= this._maxRetries) {
      const pendingCount = this._pendingBehaviors.length + this._pendingShapes.length;
      console.error(
        `MapShine | FAILED to register ${pendingCount} items after ${this._maxRetries} attempts. ` +
        `Behaviors: [${this._pendingBehaviors.join(", ")}], Shapes: [${this._pendingShapes.join(", ")}]`
      );
      return;
    }

    const delay = this._retryDelays[this._retryAttempts] || 15000;
    this._retryAttempts++;

    setTimeout(() => this._retryPendingRegistrations(), delay);
  }

  /**
   * Attempt to register previously failed particle behaviors and shapes
   */
  static _retryPendingRegistrations() {
    if (!PIXI.particles || typeof PIXI.particles.Emitter !== "function") {
      console.warn("MapShine | PIXI.particles not available during retry, skipping");
      this._scheduleRetry();
      return;
    }

    let shapesRegistered = 0;
    let behaviorsRegistered = 0;
    const stillPendingShapes = [];
    const stillPendingBehaviors = [];

    // Try to register shapes
    for (const shapeName of this._pendingShapes) {
      let shapeClass = null;

      try {
        switch (shapeName) {
          case "TextureMaskShape":
            shapeClass = typeof TextureMaskShape !== "undefined" ? TextureMaskShape : null;
            break;
          case "GeometryMaskShape":
            shapeClass = typeof GeometryMaskShape !== "undefined" ? GeometryMaskShape : null;
            break;
        }
      } catch (error) {
        console.warn(`MapShine | Error checking for ${shapeName}:`, error);
      }

      if (shapeClass) {
        try {
          PIXI.particles.behaviors.ShapeSpawnBehavior.registerShape(shapeClass);
          shapesRegistered++;
          console.log(`MapShine | ✓ Successfully registered shape '${shapeName}' on retry attempt ${this._retryAttempts}`);
        } catch (error) {
          console.warn(`MapShine | Failed to register shape '${shapeName}':`, error);
          stillPendingShapes.push(shapeName);
        }
      } else {
        stillPendingShapes.push(shapeName);
      }
    }

    // Try to register behaviors
    for (const behaviorName of this._pendingBehaviors) {
      let behaviorClass = null;

      try {
        switch (behaviorName) {
          case "SparkPathBehavior":
            behaviorClass = typeof SparkPathBehavior !== "undefined" ? SparkPathBehavior : null;
            break;
          case "CandleFlameBehavior":
            behaviorClass = typeof CandleFlameBehavior !== "undefined" ? CandleFlameBehavior : null;
            break;
          case "WindBehavior":
            behaviorClass = typeof WindBehavior !== "undefined" ? WindBehavior : null;
            break;
          case "ZDepthBehavior":
            behaviorClass = typeof ZDepthBehavior !== "undefined" ? ZDepthBehavior : null;
            break;
          case "VelocityStreakBehavior":
            behaviorClass = typeof VelocityStreakBehavior !== "undefined" ? VelocityStreakBehavior : null;
            break;
          case "GroundCollisionBehavior":
            behaviorClass = typeof GroundCollisionBehavior !== "undefined" ? GroundCollisionBehavior : null;
            break;
          case "PressurisedSteamBehavior":
            behaviorClass = typeof PressurisedSteamBehavior !== "undefined" ? PressurisedSteamBehavior : null;
            break;
          case "SmellyFliesBehavior":
            behaviorClass = typeof SmellyFliesBehavior !== "undefined" ? SmellyFliesBehavior : null;
            break;
          case "ColorFromSpawnBehavior":
            behaviorClass = typeof ColorFromSpawnBehavior !== "undefined" ? ColorFromSpawnBehavior : null;
            break;
          case "MapShineLightingBehavior":
            behaviorClass = typeof MapShineLightingBehavior !== "undefined" ? MapShineLightingBehavior : null;
            break;
          case "DropletStreakBehavior":
            behaviorClass = typeof DropletStreakBehavior !== "undefined" ? DropletStreakBehavior : null;
            break;
          case "EdgePointsSpawnBehavior":
            behaviorClass = typeof EdgePointsSpawnBehavior !== "undefined" ? EdgePointsSpawnBehavior : null;
            break;
        }
      } catch (error) {
        console.warn(`MapShine | Error checking for ${behaviorName}:`, error);
      }

      if (behaviorClass) {
        try {
          PIXI.particles.Emitter.registerBehavior(behaviorClass);
          behaviorsRegistered++;
          console.log(`MapShine | ✓ Successfully registered behavior '${behaviorName}' on retry attempt ${this._retryAttempts}`);
        } catch (error) {
          console.warn(`MapShine | Failed to register behavior '${behaviorName}':`, error);
          stillPendingBehaviors.push(behaviorName);
        }
      } else {
        stillPendingBehaviors.push(behaviorName);
      }
    }

    // Update pending lists
    this._pendingShapes = stillPendingShapes;
    this._pendingBehaviors = stillPendingBehaviors;

    const totalPending = this._pendingShapes.length + this._pendingBehaviors.length;
    const totalRegistered = shapesRegistered + behaviorsRegistered;

    // Continue retrying if needed
    if (totalPending > 0) {
      console.log(
        `MapShine | Retry attempt ${this._retryAttempts}/${this._maxRetries}: ${totalRegistered} registered, ${totalPending} still pending`
      );
      this._scheduleRetry();
    } else {
      console.log(
        `MapShine | ✓ All particle behaviors and shapes successfully registered after ${this._retryAttempts} retry attempts!`
      );
    }
  }
}


// =================================================================================
// SECTION 13: GLOBAL HOOKS REGISTRATION
// =================================================================================
// Description: Foundry VTT hook registrations for module initialization,
//              scene updates, canvas drawing, and UI rendering.
// ---------------------------------------------------------------------------------

// THIS IS THE CORRECT WAY TO MAKE CONTROLS IN FOUNDRY VTT - Please don't break it.
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;

  // Reverting to the original object-based syntax to ensure compatibility.
  const tokenControls = controls.tokens;
  if (tokenControls) {
    tokenControls.tools["map-shine-editor"] = {
      name: "map-shine-editor",
      title: "Toggle Map Shine Editor",
      icon: "fas fa-sliders-h",
      toggle: true,
      active: !!game.mapShine?.activeEditor,
      onChange: (toggled) => {
        if (toggled) {
          game.mapShine?.showEditor();
        } else {
          // This now correctly closes whichever editor is active.
          game.mapShine?.activeEditor?.close();
        }
      },
    };

    tokenControls.tools["day-night-clock"] = {
      name: "day-night-clock",
      title: "Toggle Day/Night Clock",
      icon: "fas fa-clock",
      toggle: true,
      active: !!game.mapShine?.dayNightClock,

      onChange: (_toggled) => {
        game.mapShine?.showDayNightClock();
      },
    };
  }
});

Hooks.once("init", async () => {
  // Dynamically import the initialiser to break circular dependencies
  const { MapShineInitialiser } = await import("../core/MapShineInitialiser.js");

  // Initialize the module
  MapShineInitialiser.initialize();

  // Register memory profiling console commands
  console.log(
    "%c MapShine Memory Profiler available!",
    "color: #4CAF50; font-weight: bold;"
  );
  console.log("%cCommands:", "font-weight: bold;");
  console.log(
    "  • MapShineMemoryProfiler.printStats() - Show current memory usage"
  );
  console.log(
    "  • MapShineMemoryProfiler.startMonitoring(intervalMs) - Start continuous monitoring"
  );
  console.log("  • MapShineMemoryProfiler.stopMonitoring() - Stop monitoring");
  console.log(
    "  • MapShineMemoryProfiler.collectStats() - Get raw stats object"
  );
});

Hooks.once("ready", () => {
  // This hook runs after 'init' and 'setup', and is the first time the `ui` object is guaranteed to be available.
  if (game.modules.get("lib-wrapper")?.active) {
    libWrapper.register(
      MODULE_ID,
      "ui.notifications.info",
      function (wrapped, message, options) {
        // Intercept Foundry's core loading messages and display them on our custom screen.
        if (
          game.mapShine.loadingScreen &&
          message.startsWith(game.i18n.localize("LOADING.Stage"))
        ) {
          game.mapShine.loadingScreen.setStatus(message);
          // Prevent the original notification from appearing.
          return null;
        }
        // For all other notifications, call the original function.
        return wrapped(message, options);
      },
      "MIXED"
    );
    console.log(
      "Map Shine | Registered libWrapper intercept for loading messages in 'ready' hook."
    );
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// HEADLESS TESTING SYSTEM INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════
//
// This hook activates the automated testing system when running in headless mode.
// Tests run after full module initialization and output results to the terminal.
//
// To activate:
//   1. Set environment variable: MAP_SHINE_TEST_MODE=true
//   2. Optionally set test suite: MAP_SHINE_TEST_SUITE=ui (or config, managers, textures, all)
//   3. Run: node "C:\Program Files\Foundry Virtual Tabletop\resources\app\main.js" --headless --world=map-development-world
//
// The system will:
//   - Wait for mapShine:setupComplete hook
//   - Run requested test suites
//   - Output results to console
//   - Exit with appropriate code (0=success, 1=failure)
//
Hooks.once("ready", async () => {
  // Check if we're in test mode via environment variable or module flag
  const isTestMode = typeof process !== 'undefined' && process.env.MAP_SHINE_TEST_MODE === 'true';
  const testSuite = typeof process !== 'undefined' && process.env.MAP_SHINE_TEST_SUITE || 'all';
  
  if (isTestMode) {
    console.log('\n🧪 Map Shine Test Mode Active');
    console.log(`📦 Test Suite: ${testSuite}`);
    console.log('⏳ Waiting for full module initialization...\n');
    
    // Wait for full initialization to complete
    await new Promise(resolve => {
      Hooks.once('mapShine:setupComplete', resolve);
    });
    
    console.log('✅ Module initialization complete. Starting tests...\n');
    
    // Import and run tests
    try {
      const { MapShineTestRunner } = await import('./tests/headless-runner.js');
      await MapShineTestRunner.runTests(testSuite);
    } catch (error) {
      console.error('❌ FATAL: Failed to load or run test system:', error);
      console.error(error.stack);
      
      // Exit with error code
      setTimeout(() => {
        if (typeof process !== 'undefined' && process.exit) {
          process.exit(1);
        }
      }, 1000);
    }
  }
});

Hooks.on("updateScene", (scene, data, options) => {
  if (!scene.isView) return;

  const flagPath = `flags.${MODULE_ID}`;
  const backgroundPath = "background.src";
  const profileIdPath = `flags.${MODULE_ID}.activeProfileId`;
  const sceneProfilesPath = `flags.${MODULE_ID}.profiles`;

  // Check for texture discovery updates from the GM.
  if (
    foundry.utils.hasProperty(data, `${flagPath}.mapShineTargets`) ||
    foundry.utils.hasProperty(data, backgroundPath)
  ) {
    game.mapShine?.effectTargetManager.refresh();
  }

  // This is the main synchronization logic for profile changes.
  if (foundry.utils.hasProperty(data, sceneProfilesPath)) {
    // Check if the current user initiated this update. If so, they have already cleared their
    // own overrides, and their UI will be updated by their original action.
    // This prevents the race condition. Other clients will proceed.

    if (options.userId === game.user.id) return;

    game.mapShine?.profileManager.initializeForScene();
    game.mapShine?.profileManager.updateAllSystemsFromConfig();
    if (game.mapShine.debugger) {
      game.mapShine.debugger.render();
    }
  }

  // Check for a change in the active profile ID to trigger transitions for non-GM clients.
  if (foundry.utils.hasProperty(data, profileIdPath)) {
    if (!game.user.isGM) {
      game.mapShine?.profileManager.handleRemoteProfileChange();
    }
  }
});

// REMOVED: Duplicate worldContainer creation (Issue #1 fix)
// worldContainer is now created ONLY in canvasInit hook for consistency
// Previous canvasDraw implementation was redundant and could cause race conditions

Hooks.on("renderSceneControls", (app, html, _data) => {
  if (!game.user.isGM) return;

  const tokenControls = html.querySelector(
    'ol.main-controls[data-control="token"]'
  );
  if (!tokenControls) return;

  // Clock: add if missing
  if (!html.querySelector("#map-shine-main-ui-clock")) {
    const clockContainer = document.createElement("li");
    clockContainer.id = "map-shine-main-ui-clock"; // ID for idempotency check
    clockContainer.classList.add("scene-control-clock-wrapper");
    clockContainer.title = "Map Shine Day/Night Cycle";
    tokenControls.appendChild(clockContainer);

    // Instantiate the clock component, passing null for the application instance.
    game.mapShine.mainUIClock = new MapShineClock(clockContainer, null, {
      showDragHandle: false,
      showDisclaimer: false,
    });
  }

  // Preview Button: add if missing
  if (!html.querySelector("#map-shine-preview-button")) {
    const previewLi = document.createElement("li");
    previewLi.id = "map-shine-preview-button";
    previewLi.classList.add("scene-control-preview-wrapper");
    previewLi.title = "Map Shine Preview Loading Screen";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-shine-preview-toggle";
    btn.style.cssText =
      "padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:#1f2937;color:#e5e7eb;cursor:pointer;";
    btn.textContent = "Preview Loading Screen";

    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const mgr = game.mapShine?.sceneChangeManager;
      if (!mgr) {
        ui.notifications?.warn?.("Map Shine: SceneChangeManager not ready.");
        return;
      }

      // Check if methods exist (cache issue protection)
      if (typeof mgr.showPreviewOverlay !== "function") {
        ui.notifications?.error?.(
          "Map Shine: Preview feature not available. Please reload Foundry (Ctrl+F5 to clear cache)."
        );
        return;
      }

      if (mgr.previewActive) {
        mgr.hidePreviewOverlay({ apply: false });
        btn.textContent = "Preview Loading Screen";
      } else {
        mgr.showPreviewOverlay();
        btn.textContent = "Exit Preview";
      }
    });

    previewLi.appendChild(btn);
    tokenControls.appendChild(previewLi);
  }
});