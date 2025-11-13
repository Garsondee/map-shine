import { RenderTexturePool } from "../utils/RenderTexturePool.js";
import { ResourceManager } from "../managers/ResourceManager.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { LightMaskManager } from "../managers/LightMaskManager.js";
import { ScreenEffectsManager } from "../managers/ScreenEffectsManager.js";
import { TokenManager } from "../managers/TokenManager.js";
import { DynamicExposureManager } from "../managers/DynamicExposureManager.js";
import { GeometryMaskManager } from "../managers/GeometryMaskManager.js";
import { DynamicTokenMaskManager } from "../managers/DynamicTokenMaskManager.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { StructuralShadowsLayer } from "../effects/StructuralShadows.js";
import { ParticleLayer } from "../effects/Particles.js";
import { WindManager } from "../managers/WindManager.js";
import { CloudShadowsFilterEnhanced as CloudShadowsFilter } from "../effects/CloudDepth.js";
import { EFFECT_SOURCE_OPTIONS } from "../config/presets.js";
import { MODULE_DEFAULTS } from "../config/MODULE_DEFAULTS.js";

// Safe global fallbacks for classes not yet extracted into separate files
// These are provided at runtime by the main module.js (global namespace)
const WeatherSystemManager = globalThis.WeatherSystemManager;
const WeatherOrchestrator = globalThis.WeatherOrchestrator;

export class MapShineLifecycle {
  // onCanvasReady and onCanvasTearDown are removed as their roles are now taken by SceneChangeManager.

  /**
   * Manager criticality levels for graceful degradation
   * @enum {string}
   */
  static CRITICALITY = {
    CRITICAL: 'critical',    // Failure aborts entire setup
    IMPORTANT: 'important',  // Failure logs error but continues
    OPTIONAL: 'optional'     // Failure logs warning and continues
  };

  /**
   * Track initialization failures for diagnostics
   */
  static initializationStatus = {
    succeeded: [],
    failed: [],
    skipped: []
  };

  /**
   * Safely initialize a manager with proper error handling based on criticality
   * @param {string} managerName - Name of the manager for logging
   * @param {Function} initFn - Async initialization function
   * @param {string} criticality - Criticality level from CRITICALITY enum
   * @returns {Promise<boolean>} True if successful, false if failed
   */
  static async safeInitializeManager(managerName, initFn, criticality) {
    try {
      await initFn();
      this.initializationStatus.succeeded.push(managerName);
      return true;
    } catch (error) {
      // Handle based on criticality
      if (criticality === this.CRITICALITY.CRITICAL) {
        console.error(`Map Shine | CRITICAL FAILURE: ${managerName} initialization failed. Aborting setup.`, error);
        this.initializationStatus.failed.push({ manager: managerName, error: error.message, critical: true });
        throw error; // Re-throw to abort setup
      } else if (criticality === this.CRITICALITY.IMPORTANT) {
        console.error(`Map Shine | ${managerName} initialization failed. Continuing with reduced functionality.`, error);
        this.initializationStatus.failed.push({ manager: managerName, error: error.message, critical: false });
        ui.notifications?.warn(`Map Shine: ${managerName} failed to initialize. Some features may not work.`);
        return false;
      } else { // OPTIONAL
        console.warn(`Map Shine | ${managerName} initialization failed. Feature will be unavailable.`, error);
        this.initializationStatus.failed.push({ manager: managerName, error: error.message, critical: false });
        return false;
      }
    }
  }

  /**
   * Wraps a promise with a timeout to prevent infinite hangs
   * @param {Promise} promise - The promise to wrap
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} operationName - Name for error messages
   * @returns {Promise} Promise that rejects on timeout
   */
  static async withTimeout(promise, timeoutMs, operationName = "Operation") {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Wait for render stabilization using requestAnimationFrame instead of fixed delays.
   * This adapts to the actual rendering speed of the system rather than using arbitrary timeouts.
   * 
   * @param {number} frameCount - Number of frames to wait (default: 2)
   * @param {number} maxMs - Maximum time to wait in milliseconds (default: 1000)
   * @returns {Promise<void>} Resolves when frames complete or timeout reached
   */
  static async waitForRenderStabilization(frameCount = 2, maxMs = 1000) {
    return Promise.race([
      // Wait for specified number of frames
      new Promise(resolve => {
        let frames = 0;
        const check = () => {
          if (++frames >= frameCount) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        requestAnimationFrame(check);
      }),
      // Timeout fallback for safety
      new Promise(resolve => setTimeout(resolve, maxMs))
    ]);
  }

  static async beginPersistentDiscovery(canvas, maxAttempts = 10) {
    // Exponential backoff delays: faster initial attempts, longer waits for slow systems
    const delays = [100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500]; // ms
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (!canvas?.scene || !game.mapShine?.initialized) {
        console.log(
          "Map Shine | Discovery aborted, canvas is no longer active."
        );
        // If discovery is aborted, we must still resolve the setup promise to prevent a hang.
        await this.runMinimalSetup(canvas);
        return;
      }

      // Wait between attempts with exponential backoff
      const delay = delays[attempt - 1] || 4000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (game.mapShine.loadingManager) {
        const message =
          attempt > 1
            ? `Discovering effect maps (Attempt ${attempt})...`
            : game.mapShine.loadingManager.messages.DISCOVERY_START;
        game.mapShine.loadingManager.screen?.setProgress(
          game.mapShine.loadingManager.waypoints.DISCOVERY_START,
          message
        );
      }

      // Wrap refresh with timeout to prevent indefinite hangs
      try {
        await this.withTimeout(
          game.mapShine.effectTargetManager.refresh(),
          5000,
          "Effect Target Refresh"
        );
      } catch (error) {
        console.warn(`Map Shine | Effect target refresh timed out on attempt ${attempt}:`, error);
        continue; // Try next attempt
      }
      
      const targets = game.mapShine.effectTargetManager.targets;
      const hasBackgroundTarget =
        targets.background &&
        Object.values(targets.background).some(
          (v) => v && typeof v === "string"
        );
      const hasTileTargets = Array.from(targets.tiles.values()).length > 0;

      // Detailed diagnostics for discovery attempts
      const diagnostics = {
        backgroundExists: !!canvas.scene?.background?.src,
        tilesCount: canvas.tiles?.placeables?.length || 0,
        tilesWithTextures: 0,
        texturesLoaded: 0,
        texturesLoading: 0,
        texturesFailed: 0,
        hasBackgroundTarget,
        hasTileTargets
      };

      // Check each tile's texture status
      for (const tile of canvas.tiles?.placeables || []) {
        if (tile.texture) {
          diagnostics.tilesWithTextures++;
          if (tile.texture.valid && tile.texture.baseTexture?.valid) {
            diagnostics.texturesLoaded++;
          } else if (tile.texture.baseTexture?.isLoading) {
            diagnostics.texturesLoading++;
          } else {
            diagnostics.texturesFailed++;
          }
        }
      }

      console.log(`Map Shine | Discovery attempt ${attempt}/${maxAttempts}:`, diagnostics);

      if (hasBackgroundTarget || hasTileTargets) {
        // Set flag for performance optimizations
        game.mapShine.hasContent = true;
        
        console.log(
          `Map Shine | Texture discovery successful on attempt #${attempt}. Initializing all systems.`
        );
        game.mapShine.loadingManager?.setProgress("DISCOVERY_END");

        // Pre-load all discovered textures before proceeding to setup.
        try {
          await this.withTimeout(
            this._preloadDiscoveredTextures(),
            15000,
            "Texture Preloading"
          );
        } catch (error) {
          console.warn("Map Shine | Texture preloading timed out, continuing anyway:", error);
        }

        // Pre-warm shaders to eliminate compilation stutter on first frame
        try {
          await this.withTimeout(
            this._prewarmShaders(),
            10000,
            "Shader Prewarming"
          );
        } catch (error) {
          console.warn("Map Shine | Shader prewarming timed out, continuing anyway:", error);
        }

        // Pre-warm water system render textures to eliminate first-frame stalls
        try {
          await this.withTimeout(
            this._prewarmWaterSystem(),
            8000,
            "Water System Prewarming"
          );
        } catch (error) {
          console.warn("Map Shine | Water system prewarming timed out, continuing anyway:", error);
        }

        // Wrap full setup with timeout
        try {
          await this.withTimeout(
            this.runFullSetup(canvas),
            60000,
            "Full Setup"
          );
        } catch (error) {
          console.error("Map Shine | Full setup timed out, falling back to minimal setup:", error);
          await this.runMinimalSetup(canvas);
        }
        return; // Success, exit the loop and the function.
      } else {
        const reason = diagnostics.texturesLoading > 0 
          ? `${diagnostics.texturesLoading} textures still loading`
          : diagnostics.texturesFailed > 0
          ? `${diagnostics.texturesFailed} textures failed to load`
          : "no effect map textures found";
        console.log(
          `Map Shine | Discovery attempt ${attempt}/${maxAttempts} found no targets (${reason}). Next attempt in ${delays[attempt] || 4000}ms...`
        );
      }
    }

    // If the loop finishes without returning, all attempts have failed.
    console.warn(
      `Map Shine | Texture discovery failed after ${maxAttempts} attempts. No effect maps found.`
    );
    
    // Set flag for performance optimizations - empty scene
    game.mapShine.hasContent = false;
    
    // Wrap minimal setup with timeout as final fallback
    try {
      await this.withTimeout(
        this.runMinimalSetup(canvas),
        30000,
        "Minimal Setup (Fallback)"
      );
    } catch (error) {
      console.error("Map Shine | Even minimal setup timed out. Manual intervention may be required:", error);
      // Hide loading screen to prevent permanent hang
      if (game.mapShine.loadingScreen) {
        await game.mapShine.loadingScreen.hide();
        game.mapShine.loadingScreen = null;
      }
    }
  }

  /**
   * Performs a full setup of all MapShine systems for the current scene.
   *
   * LIFECYCLE ARCHITECTURE:
   * This method is designed to be self-contained and event-driven. It performs
   * all initialization tasks and emits a 'mapShine:setupComplete' Hook when done.
   *
   * The Scene.prototype.view wrapper listens for this Hook to know when it's safe
   * to proceed with the fade-in animation. This eliminates the need for:
   * - Global promise resolvers (fragile, error-prone)
   * - Hardcoded delays (unreliable across different performance profiles)
   * - Manual coordination between lifecycle and transition systems
   *
   * If any layer or manager requires additional time to stabilize, it should
   * be awaited within this method before the Hook is emitted. This ensures
   * a deterministic and reliable setup sequence.
   *
   * @param {Canvas} canvas - The Foundry VTT canvas instance
   * @returns {Promise<void>} Resolves when all systems are initialized and ready
   */
  static async runFullSetup(canvas) {
    const loadingScreen = game.mapShine.loadingScreen;
    const loadingManager = game.mapShine.loadingManager;

    // Reset initialization status
    this.initializationStatus = { succeeded: [], failed: [], skipped: [] };

    await loadingManager?.tick("SETUP_START");

    // CRITICAL: RenderTexturePool (required for memory-efficient texture operations)
    await this.safeInitializeManager(
      'RenderTexturePool',
      async () => {
        RenderTexturePool.initialize();
      },
      this.CRITICALITY.CRITICAL
    );

    // CRITICAL: ResourceManager (required for texture loading)
    await this.safeInitializeManager(
      'ResourceManager',
      async () => {
        game.mapShine.resourceManager = new ResourceManager();
        game.mapShine.resourceManager.initialize();
      },
      this.CRITICALITY.CRITICAL
    );

    // CRITICAL: Expose CoordinateManager (static class for viewport calculations)
    // This is needed by ParticleEffectController for viewport culling
    game.mapShine.coordinateManager = CoordinateManager;

    // IMPORTANT: LightMaskManager (affects visual quality but not core functionality)
    await this.safeInitializeManager(
      'LightMaskManager',
      async () => {
        game.mapShine.lightMaskManager = new LightMaskManager();
        game.mapShine.lightMaskManager.initialize();
      },
      this.CRITICALITY.IMPORTANT
    );
    
    await loadingManager?.tick("RESOURCE_MANAGER_INIT");

    // CRITICAL: ProfileManager (required for all configuration)
    await this.safeInitializeManager(
      'ProfileManager',
      async () => {
        game.mapShine.profileManager.initializeForScene();
      },
      this.CRITICALITY.CRITICAL
    );
    await loadingManager?.tick("PROFILES_INIT");

    // IMPORTANT: WindManager (affects particles and weather but not essential)
    await this.safeInitializeManager(
      'WindManager',
      async () => {
        if (!game.mapShine.windManager) {
          game.mapShine.windManager = new WindManager();
        }
        game.mapShine.windManager.updateFromConfig(
          game.mapShine.profileManager.activeConfig.fire.particles.wind
        );
      },
      this.CRITICALITY.IMPORTANT
    );
    await loadingManager?.tick("WIND_INIT");

    // OPTIONAL: WeatherSystemManager (bonus feature, not essential)
    await this.safeInitializeManager(
      'WeatherSystemManager',
      async () => {
        // Check if class is available (may not be loaded yet)
        if (typeof WeatherSystemManager === 'undefined' || typeof WeatherSystemManager !== 'function') {
          console.log('MapShine | WeatherSystemManager class not loaded yet, skipping initialization (will retry on next scene load)');
          return;
        }
        
        if (!game.mapShine.weatherSystemManager) {
          game.mapShine.weatherSystemManager = new WeatherSystemManager();
        }
        await game.mapShine.weatherSystemManager.initialize();
        console.log('MapShine | Weather system initialized with GPU-accelerated shaders');
      },
      this.CRITICALITY.OPTIONAL
    );
    await loadingManager?.tick("WEATHER_SYSTEM_INIT");

    // OPTIONAL: WeatherOrchestrator (dynamic weather control)
    await this.safeInitializeManager(
      'WeatherOrchestrator',
      async () => {
        const orchestratorConfig = game.mapShine.profileManager.activeConfig.weather?.orchestrator;
        if (orchestratorConfig?.enabled && game.mapShine.weatherSystemManager) {
          const { WeatherOrchestrator } = await import('./weather/WeatherOrchestrator.js');
          game.mapShine.weatherOrchestrator = new WeatherOrchestrator(
            orchestratorConfig,
            game.mapShine.weatherSystemManager
          );
          await game.mapShine.weatherOrchestrator.initialize();
          console.log('MapShine | Weather Orchestrator initialized and active');
        } else {
          console.log('MapShine | Weather Orchestrator disabled or WeatherSystemManager unavailable');
        }
      },
      this.CRITICALITY.OPTIONAL
    );
    await loadingManager?.tick("WEATHER_ORCHESTRATOR_INIT");

    // 3. (NEW) Finalize the configuration based on discovered textures.
    this.finalizeConfigurationAndUI();
    await loadingManager?.tick("CONFIG_FINALIZE");

    // 5. NOW we broadcast the finalized configuration to all systems.
    await loadingManager?.tick("LAYERS_UPDATE_START");
    const config = game.mapShine.profileManager.activeConfig;
    game.mapShine.lightMaskManager.updateFromConfig(config);
    for (const layer of canvas.layers) {
      if (typeof layer.updateFromConfig === "function") {
        try {
          await layer.updateFromConfig(config);
        } catch (e) {
          console.error(
            `MapShine | Error updating layer ${layer.constructor.name}`,
            e
          );
        }
      }
    }
    ScreenEffectsManager.updateAllFiltersFromConfig(config);
    await loadingManager?.tick("LAYERS_UPDATE_END");

    // Pre-warm masked effect layers to eliminate first-frame mask rendering stalls
    console.log("Map Shine | Starting masked layers prewarm...");
    try {
      await this.withTimeout(
        this._prewarmMaskedLayers(),
        5000,
        "Masked Layers Prewarming"
      );
      console.log("Map Shine | Masked layers prewarm completed");
    } catch (error) {
      console.warn("Map Shine | Masked layers prewarming timed out, continuing anyway:", error);
    }

    // Prewarm geometry masks to prevent first-frame render stalls
    await loadingManager?.tick("GEOMETRY_MASKS_PREWARM_START");
    console.log("Map Shine | Starting geometry masks prewarm...");
    try {
      await this.withTimeout(
        this._prewarmGeometryMasks(),
        3000,
        "Geometry Masks Prewarming"
      );
      console.log("Map Shine | Geometry masks prewarm completed");
    } catch (error) {
      console.warn("Map Shine | Geometry masks prewarming timed out, continuing anyway:", error);
    }
    await loadingManager?.tick("GEOMETRY_MASKS_PREWARM_END");

    // Force weather system to apply initial state after all systems are ready
    // WeatherEffectLayer is not in canvas.layers so needs explicit update
    console.warn('MapShine | 🌦️ WEATHER AUTO-START DEBUG:');
    console.warn('  - WeatherSystemManager exists:', !!game.mapShine.weatherSystemManager);
    console.warn('  - Manager isReady:', game.mapShine.weatherSystemManager?.isReady);
    console.warn('  - Config weather enabled:', config.weather?.enabled);
    console.warn('  - Initial state:', config.weather?.currentState);
    
    if (game.mapShine.weatherSystemManager?.isReady && config.weather?.enabled) {
      const weatherManager = game.mapShine.weatherSystemManager;
      const initialState = config.weather.currentState || 'clear';
      
      console.warn('  - Conditions met, applying initial state...');
      
      // Apply the state immediately without transition
      weatherManager.setInitialState(initialState);
      
      // Force shader update to ensure visibility
      if (weatherManager.weatherEffectLayer) {
        console.warn('  - WeatherEffectLayer exists, updating...');
        weatherManager.weatherEffectLayer.updateFromConfig(config);
        
        // Check effect visibility after update
        const effects = weatherManager.weatherEffectLayer.effects;
        console.warn('  - Effect status:');
        for (const [type, effect] of effects.entries()) {
          console.warn(`    - ${type}: visible=${effect.visible}, alpha=${effect.shader?.uniforms?.alpha}, opacity=${effect.shader?.uniforms?.opacity}`);
        }
        
        // CRITICAL: Apply all weather multipliers (wind, foliage, color correction)
        // This ensures storm/weather states apply their effects on initial load
        const currentWeather = weatherManager.getCurrentWeatherState();
        weatherManager._updateWeatherShaders(currentWeather);
        
        // Apply wind settings to shaders (critical for rain rotation/speed)
        weatherManager._updateWindOnShaders();
      } else {
        console.warn('  - WeatherEffectLayer is NULL!');
      }
      
      console.log(`MapShine | Weather system activated with initial state: ${initialState}`);
    } else {
      console.log('  - Conditions NOT met for weather auto-start:');
      if (!game.mapShine.weatherSystemManager) {
        console.log('    - WeatherSystemManager not initialized yet (class may still be loading)');
      } else if (!game.mapShine.weatherSystemManager.isReady) {
        console.log('    - WeatherSystemManager not ready yet');
      }
      if (!config.weather?.enabled) {
        console.log('    - Weather not enabled in config');
      }
    }

    // Await particle systems readiness
    // Check if ParticleLayer class is available first
    let particleLayer = null;
    if (typeof ParticleLayer !== "undefined") {
      particleLayer = canvas.layers.find((l) => l instanceof ParticleLayer);
    }
    
    console.log("Map Shine | Particle setup check:", {
      classAvailable: typeof ParticleLayer !== "undefined",
      hasLayer: !!particleLayer,
      hasMethod: particleLayer && typeof particleLayer.awaitParticleSetup === "function"
    });
    
    if (particleLayer && typeof particleLayer.awaitParticleSetup === "function") {
      await loadingManager?.tick("PARTICLES_SETUP_START");
      await particleLayer.awaitParticleSetup();
      await loadingManager?.tick("PARTICLES_SETUP_END");
    } else {
      if (typeof ParticleLayer === "undefined") {
        console.log("Map Shine | ParticleLayer class not loaded yet, skipping particle setup");
      } else {
        console.log("Map Shine | Particle setup skipped - layer or method not available");
      }
    }

    // 6. Initialize the global screen filters.
    // Defensive check: Ensure worldContainer exists before initializing screen effects
    if (!game.mapShine.worldContainer) {
      console.warn("Map Shine | worldContainer not ready, deferring ScreenEffectsManager initialization");
    } else {
      ScreenEffectsManager.initialize(game.mapShine.worldContainer);
      ScreenEffectsManager.setupAllGlobalFilters();
      ScreenEffectsManager.updateAllFiltersFromConfig(
        game.mapShine.profileManager.activeConfig
      );
    }
    await loadingManager?.tick("SCREEN_FX_INIT");

    // OPTIONAL: TokenManager (visual enhancements only)
    await this.safeInitializeManager(
      'TokenManager',
      async () => {
        if (!game.mapShine.tokenManager)
          game.mapShine.tokenManager = new TokenManager();
        game.mapShine.tokenManager.initialize();
      },
      this.CRITICALITY.OPTIONAL
    );
    await loadingManager?.tick("TOKEN_MANAGER_INIT");

    // OPTIONAL: DynamicExposureManager (visual enhancement)
    // Only initialize if ColorCorrection filter exists
    await this.safeInitializeManager(
      'DynamicExposureManager',
      async () => {
        const cc = ScreenEffectsManager.getFilter?.('colorCorrection');
        if (!cc) {
          console.info('Map Shine | Skipping DynamicExposureManager (no ColorCorrection filter)');
          return;
        }
        if (!game.mapShine.dynamicExposureManager)
          game.mapShine.dynamicExposureManager = new DynamicExposureManager();
        game.mapShine.dynamicExposureManager.initialize();
      },
      this.CRITICALITY.OPTIONAL
    );

    await loadingManager?.tick("DYNAMIC_EXPOSURE_INIT");

    // OPTIONAL: CombatEffectManager (visual enhancement)
    // Only initialize if dedicated combatEffect filter exists
    await this.safeInitializeManager(
      'CombatEffectManager',
      async () => {
        const combat = ScreenEffectsManager.getFilter?.('combatEffect');
        if (!combat) {
          console.info('Map Shine | Skipping CombatEffectManager (no combatEffect filter)');
          return;
        }
        if (game.mapShine.combatEffectManager) {
          game.mapShine.combatEffectManager.initialize();
        }
      },
      this.CRITICALITY.OPTIONAL
    );

    await loadingManager?.tick("PAUSE_COMBAT_INIT");

    // IMPORTANT: GeometryMaskManager (affects particles and effects)
    await this.safeInitializeManager(
      'GeometryMaskManager',
      async () => {
        if (!game.mapShine.geometryMaskManager) {
          game.mapShine.geometryMaskManager = new GeometryMaskManager();
        }
        game.mapShine.geometryMaskManager.initialize();
      },
      this.CRITICALITY.IMPORTANT
    );
    await loadingManager?.tick("GEOMETRY_MANAGER_INIT");

    // 6. (NEW) Update the UI controls to reflect the finalized configuration.
    if (game.mapShine.debugger) {
      game.mapShine.debugger.eventHandler.updateAllControls();
    }

    // 7. Initialize canvas-specific managers.
    // OPTIONAL: DynamicTokenMaskManager (visual enhancement)
    await this.safeInitializeManager(
      'DynamicTokenMaskManager',
      async () => {
        game.mapShine.tokenMaskManager = new DynamicTokenMaskManager(canvas);
      },
      this.CRITICALITY.OPTIONAL
    );
    await loadingManager?.tick("CANVAS_MANAGERS_INIT");

    // Pre-warm the structural shadows layer to prevent pop-in after loading.
    await loadingManager?.tick("STRUCTURAL_HIGHLIGHTS");
    const structuralLayer = canvas.layers.find(
      (l) => l instanceof StructuralShadowsLayer
    );
    if (structuralLayer?.visible) {
      // Pass a delta time of 0 for a single-frame, non-animated render.
      structuralLayer.renderEffectNow(0);
    }

    // Mark systems as ready BEFORE hiding the loading screen
    game.mapShine.systemsReady = true;

    // KILL SWITCH DISENGAGED: Re-enable illumination-dependent systems.
    game.mapShine.transitionActive = false;
    
    // Log initialization summary
    const failedCount = this.initializationStatus.failed.length;
    if (failedCount === 0) {
      console.log(
        `%cMap Shine | Setup complete. All ${this.initializationStatus.succeeded.length} managers initialized successfully.`,
        "color: #4CAF50; font-weight: bold;"
      );
    } else {
      const criticalFailures = this.initializationStatus.failed.filter(f => f.critical);
      if (criticalFailures.length > 0) {
        console.error(
          `%cMap Shine | Setup completed with CRITICAL failures: ${criticalFailures.map(f => f.manager).join(', ')}`,
          "color: #ff6b6b; font-weight: bold;"
        );
      } else {
        console.warn(
          `%cMap Shine | Setup complete with ${failedCount} non-critical failures. Running in degraded mode.`,
          "color: #ffa500; font-weight: bold;",
          this.initializationStatus.failed
        );
      }
    }

    // Wait for effects to stabilize using RAF instead of fixed delay
    // This adapts to system rendering speed and ensures filters render first frame
    await this.waitForRenderStabilization(3, 500);

    // Emit custom Hook event AFTER effects are stable
    // This ensures scene transition overlays don't fade in prematurely
    Hooks.callAll("mapShine:setupComplete", { type: "full" });
    console.log("Map Shine | Emitted mapShine:setupComplete hook (full setup)");

    // 8. Hide the loading screen AFTER all effects are enabled and stable
    if (loadingScreen) {
      await loadingManager?.tick("SETUP_COMPLETE");
      await loadingScreen.hide();
      game.mapShine.loadingScreen = null;
      if (game.mapShine.loadingManager)
        game.mapShine.loadingManager.screen = null;
    }
  }

  static async runMinimalSetup(_canvas) {
    const loadingScreen = game.mapShine.loadingScreen;
    const loadingManager = game.mapShine.loadingManager;

    game.mapShine.profileManager.initializeForScene();
    await game.mapShine.profileManager.updateAllSystemsFromConfig();

    // Minimal setup for screen effects, now correctly targeting the worldContainer
    if (game.mapShine.worldContainer) {
      ScreenEffectsManager.initialize(game.mapShine.worldContainer);
      ScreenEffectsManager.setupAllGlobalFilters();
      ScreenEffectsManager.updateAllFiltersFromConfig(
        game.mapShine.profileManager.activeConfig
      );
    }

    // KILL SWITCH DISENGAGED (also for minimal setup)
    game.mapShine.transitionActive = false;
    console.log(
      `%cMap Shine | Minimal setup complete. TRANSITION INACTIVE.`,
      "color: #4CAF50; font-weight: bold;"
    );

    // Wait for effects to stabilize using RAF instead of fixed delay
    // Adapts to system rendering speed for smooth scene transitions
    await this.waitForRenderStabilization(2, 500);

    // Emit custom Hook event AFTER effects are stable
    Hooks.callAll("mapShine:setupComplete", { type: "minimal" });
    console.log(
      "Map Shine | Emitted mapShine:setupComplete hook (minimal setup)"
    );

    // Hide the loading screen AFTER effects are enabled and stable
    if (loadingScreen) {
      // Visually complete the loading bar for user feedback before hiding.
      await loadingManager?.tick("SETUP_COMPLETE");
      await loadingScreen.hide();
      game.mapShine.loadingScreen = null;
      if (game.mapShine.loadingManager)
        game.mapShine.loadingManager.screen = null;
    }
  }

  static finalizeConfigurationAndUI() {
    console.log(
      "Map Shine | Finalizing configuration based on available textures."
    );

    const EFFECT_TEXTURE_MAP = {
      baseShine: "specular",
      cloudShadows: "outdoors",
      canopy: "canopy",
      structuralShadows: "structural",
      iridescence: "iridescence",
      ambient: "ambient",
      groundGlow: "groundGlow",
      heatDistortion: "heat",
      prism: "prism",
      dust: "dust",
      glint: "prism",
      metallicGlints: "specular",
      fire: "fire",
      sparks: "sparks",
      water: "water", // Maps to _Water texture
      pressurisedSteam: "steam", // Maps to _Steam texture
      // Note: candleFlame, smellyFlies, lightning are map-point-only (no textures)
    };

    const targets = game.mapShine.effectTargetManager.targets;
    const allTargets = [targets.background, ...targets.tiles.values()].filter(
      Boolean
    );
    const config = game.mapShine.profileManager.activeConfig;
    const handler = game.mapShine.debugger?.eventHandler;

    // --- Adjust effect enablement based on texture AND map point availability ---
    const groups = MapPointsManager.getGroups();

    // Build a comprehensive set of all effects that can have sources (texture or map point)
    const allEffectKeys = new Set([
      ...Object.keys(EFFECT_TEXTURE_MAP),
      ...Object.keys(EFFECT_SOURCE_OPTIONS).filter((key) => key !== ""), // Exclude empty "None" option
    ]);

    for (const effectKey of allEffectKeys) {
      // Check for texture source
      const textureKey = EFFECT_TEXTURE_MAP[effectKey];
      const hasTexture = textureKey
        ? allTargets.some((target) => target[textureKey])
        : false;

      // Check if any map point groups are configured for this effect
      const hasMapPoint = Object.values(groups).some(
        (group) =>
          group.isEffectSource &&
          group.effectTarget === effectKey &&
          group.points?.length > 0 &&
          !group.isBroken
      );

      // Effect is available if either texture OR map point exists
      const hasEffectSource = hasTexture || hasMapPoint;

      const path = `${effectKey}.enabled`;
      const currentSetting = foundry.utils.getProperty(config, path);
      const defaultSetting = foundry.utils.getProperty(MODULE_DEFAULTS, path); // Get original default from MODULE_DEFAULTS

      let newSetting = currentSetting; // Start with the current state

      if (
        hasEffectSource &&
        defaultSetting === false &&
        currentSetting === false
      ) {
        // Scenario: Effect source found (texture or map point), default is OFF, and it's currently OFF.
        // Action: Automatically ENABLE the effect.
        newSetting = true;
        const sourceType =
          hasTexture && hasMapPoint
            ? "texture and map point"
            : hasTexture
            ? "texture"
            : "map point";
        console.log(
          `Map Shine | Effect '${effectKey}' auto-enabled: ${sourceType} found.`
        );
      } else if (!hasEffectSource && currentSetting === true) {
        // Scenario: No effect source (texture or map point) AND the effect is currently enabled.
        // Action: Automatically DISABLE the effect.
        newSetting = false;
        console.log(
          `Map Shine | Effect '${effectKey}' auto-disabled: No texture or map point found.`
        );
      }
      // Other scenarios:
      // - hasEffectSource && defaultSetting === true && currentSetting === true (no change, already enabled)
      // - hasEffectSource && defaultSetting === false && currentSetting === true (user enabled it, keep it enabled)
      // - !hasEffectSource && defaultSetting === false && currentSetting === false (no change, already disabled)

      // Only update the config if the setting has actually changed
      if (newSetting !== currentSetting) {
        foundry.utils.setProperty(config, path, newSetting);
      }

      // Update the UI availability regardless of the config setting.
      // This ensures the UI accurately reflects whether an effect source exists to power the effect.
      handler?.setEffectAvailability(effectKey, hasEffectSource);
    }
  }
  /**
   * Iterates through all discovered effect targets and pre-loads their associated textures into GPU memory.
   * This is done during the loading screen to prevent stuttering on the first frame of scene interaction.
   */
  static async _preloadDiscoveredTextures() {
    const loadingManager = game.mapShine.loadingManager;
    await loadingManager?.tick("TEXTURE_PRELOAD_START");

    const targets = game.mapShine.effectTargetManager.targets;
    const allPaths = new Set();

    // Gather paths from the scene background target
    if (targets.background) {
      Object.values(targets.background).forEach((path) => {
        if (typeof path === "string" && path) {
          allPaths.add(path);
        }
      });
    }

    // Gather paths from all tile targets
    for (const tileTarget of targets.tiles.values()) {
      Object.values(tileTarget).forEach((value) => {
        if (typeof value === "string" && value) {
          allPaths.add(value);
        }
      });
    }

    if (allPaths.size > 0) {
      console.log(
        `Map Shine | Pre-loading ${allPaths.size} discovered textures...`
      );

      // Count textures that will be optimized (downsampled)
      const pathsArray = Array.from(allPaths);
      const optimizableTextures = pathsArray.filter((path) =>
        TextureLoader.shouldDownscale(path)
      ).length;

      // Initialize optimization tracking
      if (optimizableTextures > 0) {
        TextureLoader.startOptimizationTracking(optimizableTextures);
        console.log(
          `Map Shine | ${optimizableTextures} textures will be optimized for memory savings.`
        );
      }

      const promises = pathsArray.map((path) =>
        TextureLoader.loadTexture(path)
      );
      try {
        await Promise.all(promises);
        console.log(
          "Map Shine | All discovered textures pre-loaded successfully."
        );
        
        // ✅ P2: Pin all loaded textures to prevent eviction
        // These textures are used every frame for effects, so they should never be evicted
        pathsArray.forEach(path => {
          foundry.canvas.TextureLoader.pinSource(path);
        });
        console.log(
          `Map Shine | Pinned ${pathsArray.length} textures to prevent eviction.`
        );
      } catch (error) {
        console.warn("Map Shine | Error during texture pre-loading:", error);
        // We don't halt the process, as some textures might be invalid paths.
      }
    }

    await loadingManager?.tick("TEXTURE_PRELOAD_END");

    // Texture optimization happens during loading, mark completion
    await loadingManager?.tick("TEXTURE_OPTIMIZATION_END");
  }

  /**
   * Pre-warms GPU shader compilation by creating temporary sprites with all complex filters.
   * This eliminates "compilation stutter" on the first frame when effects are actually used.
   *
   * TECHNIQUE:
   * - Creates tiny (1x1 pixel) temporary sprites/containers
   * - Applies each complex filter to force GPU driver compilation
   * - Performs a minimal render operation
   * - Cleans up temporary objects immediately
   *
   * This runs during the loading screen to ensure smooth first-frame performance.
   */
  static async _prewarmShaders() {
    const loadingManager = game.mapShine.loadingManager;
    await loadingManager?.tick("SHADER_PREWARM_START");

    console.log(
      "Map Shine | Pre-warming shaders for smooth first-frame performance..."
    );

    try {
      // Create a temporary container to hold our test sprites
      const tempContainer = new PIXI.Container();
      canvas.app.stage.addChild(tempContainer);

      // Create a tiny 1x1 white texture for testing
      const tinyTexture = PIXI.Texture.WHITE;

      // Resolve constructors safely from adapters or globals to avoid ReferenceError
      const {
        ColorCorrectionFilter,
        ChromaticAberrationFilter,
        LensDistortionFilter,
        VignetteFilter,
        FilmGrainFilter,
        PrismFilter,
        ParticleRgbSplitFilter,
        CloudSuppressorFilter,
        BiofilmMaskFilter,
        NoisePatternFilter,
        AmbientColorFilter,
        HeatDistortionFilter
      } = await import("../postfx/filters-adapter.js");

      const safeCtors = {
        // Water effects (locals or globals)
        WaterEffectsFilter: globalThis.WaterEffectsFilter || null,
        WaveDisplacementFilter: globalThis.WaveDisplacementFilter || null,
        FoamFilter: globalThis.FoamFilter || null,
        BiofilmMaskFilter,
        // Metallic and shine
        MetallicShineFilter: globalThis.MetallicShineFilter || null,
        MetallicStripePatternFilter: globalThis.MetallicStripePatternFilter || null,
        IridescenceFilter: globalThis.IridescenceFilter || null,
        GroundGlowFilter: globalThis.GroundGlowFilter || null,
        // Shadows / lighting
        CloudShadowsFilter: globalThis.CloudShadowsFilter || null,
        CanopyFilter: globalThis.CanopyFilter || null,
        StructuralFilter: globalThis.StructuralFilter || null,
        BuildingShadowsFilter: globalThis.BuildingShadowsFilter || null,
        // Distortion / atmospheric
        HeatDistortionFilter,
        HeatDistortionNoiseFilter: globalThis.HeatDistortionNoiseFilter || null,
        LensDistortionFilter,
        ChromaticAberrationFilter,
        // Color / post
        ColorCorrectionFilter,
        AmbientColorFilter,
        TimeOfDayColorFilter: globalThis.TimeOfDayColorFilter || null,
        OverheadRecolorFilter: globalThis.OverheadRecolorFilter || null,
        // Noise / grain
        NoisePatternFilter,
        FilmGrainFilter,
        NoiseFilter: globalThis.NoiseFilter || null,
        // Particle / special
        ParticleRgbSplitFilter,
        CloudSuppressorFilter,
        PrismFilter,
        VignetteFilter
      };

      // Build list using resolved ctors and skip those that are missing
      const filtersToPrewarm = Object.entries(safeCtors)
        .filter(([_, ctor]) => typeof ctor === "function")
        .map(([name, ctor]) => ({ name, ctor }));

      // Utilities for validation and safe application
      const { validateFilter, safeApplyFilters, safeCreateFilter } = await import("../utils/filter-utils.js");

      // Pre-warm each filter
      for (const filterDef of filtersToPrewarm) {
        try {
          // Create a tiny sprite for this filter
          const sprite = new PIXI.Sprite(tinyTexture);
          sprite.width = 1;
          sprite.height = 1;
          sprite.visible = true;

          // Create and apply the filter using safe methods
          const filter = safeCreateFilter(filterDef.ctor, {}, `Prewarm.${filterDef.name}`);

          // Validate filter before applying
          if (!validateFilter(filter, `Prewarm.${filterDef.name}`)) {
            console.warn(`Map Shine | Skipping prewarm for invalid filter: ${filterDef.name}`);
            continue;
          }

          safeApplyFilters(sprite, [filter], `Prewarm.${filterDef.name}`);

          // Add to container
          tempContainer.addChild(sprite);

          // Force a render by accessing the transform (this triggers the filter pipeline)
          tempContainer.updateTransform();

          // Clean up immediately
          sprite.destroy();
        } catch (error) {
          console.warn(
            `Map Shine | Failed to pre-warm ${filterDef.name}:`,
            error
          );
          // Continue with other filters even if one fails
        }
      }

      // Force a final render to ensure all shaders are compiled
      canvas.app.renderer.render(tempContainer);

      // Clean up the temporary container
      tempContainer.destroy({ children: true });

      console.log(
        `Map Shine | Successfully pre-warmed ${filtersToPrewarm.length} shaders.`
      );
    } catch (error) {
      console.warn("Map Shine | Error during shader pre-warming:", error);
      // Don't halt the loading process if pre-warming fails
    }

    await loadingManager?.tick("SHADER_PREWARM_END");
  }

  /**
   * Pre-warms water system render textures to eliminate first-frame stalls.
   * 
   * CRITICAL: Water effects require 4 expensive render passes that were previously
   * deferred until the first animation frame, causing 45-65ms stalls:
   * - Displacement texture (10-15ms)
   * - Blurred water mask (15-20ms)  
   * - Shoreline mask (10-15ms)
   * - Caustics mask (10-15ms)
   * 
   * By performing these renders during the loading screen, we achieve smooth scene start.
   */
  static async _prewarmWaterSystem() {
    const loadingManager = game.mapShine.loadingManager;
    await loadingManager?.tick("WATER_PREWARM_START");

    console.log("Map Shine | Pre-warming water system render textures...");

    try {
      // Check if WaterFXLayer class is available
      if (typeof WaterFXLayer === "undefined") {
        console.log("Map Shine | WaterFXLayer class not loaded yet, skipping water prewarm");
        await loadingManager?.tick("WATER_PREWARM_END");
        return;
      }

      const layer = canvas.layers.find(l => l instanceof WaterFXLayer);
      if (!layer) {
        console.log("Map Shine | No WaterFXLayer found, skipping water prewarm");
        await loadingManager?.tick("WATER_PREWARM_END");
        return;
      }

      // Validate that render textures were created
      if (!layer.displacementTexture?.valid || !layer.blurredWaterMaskTexture?.valid) {
        console.warn("Map Shine | Water render textures not valid, skipping prewarm");
        await loadingManager?.tick("WATER_PREWARM_END");
        return;
      }

      let prewarmedCount = 0;

      // 1. Render shoreline mask if needed
      if (layer._needsShorelineMaskUpdate && layer.shorelineMaskTexture?.valid && layer.shorelineMaskContainer) {
        canvas.app.renderer.render(layer.shorelineMaskContainer, {
          renderTexture: layer.shorelineMaskTexture,
          transform: canvas.stage.transform.worldTransform,
          clear: true
        });
        layer._needsShorelineMaskUpdate = false;
        prewarmedCount++;
      }

      // 2. Render caustics mask if needed
      if (layer._needsCausticsMaskUpdate && layer.combinedCausticsMaskTexture?.valid && layer.causticsMaskContainer) {
        canvas.app.renderer.render(layer.causticsMaskContainer, {
          renderTexture: layer.combinedCausticsMaskTexture,
          transform: canvas.stage.transform.worldTransform,
          clear: true
        });
        layer._needsCausticsMaskUpdate = false;
        prewarmedCount++;
      }

      // 3. Render displacement texture
      if (layer.displacementFilter && layer.displacementSprite) {
        // Set initial time
        layer.displacementFilter.uniforms.u_time = 0;
        
        // Apply coordinate uniforms
        if (game.mapShine.coordinateManager) {
          const coordUniforms = CoordinateManager.getShaderUniforms();
          Object.assign(layer.displacementFilter.uniforms, coordUniforms);
        }
        
        canvas.app.renderer.render(layer.displacementSprite, {
          renderTexture: layer.displacementTexture,
          clear: true
        });
        prewarmedCount++;
      }

      // 4. Render blurred water mask
      if (layer.blurSourceSprite && layer.blurredWaterMaskTexture?.valid) {
        // Get base water mask texture
        const baseMask = layer.getMaskTexture?.() || layer.effectMaskTexture;
        if (baseMask?.valid) {
          layer.blurSourceSprite.texture = baseMask;
          canvas.app.renderer.render(layer.blurSourceSprite, {
            renderTexture: layer.blurredWaterMaskTexture,
            clear: true
          });
          prewarmedCount++;
        }
      }

      console.log(`Map Shine | Water system prewarmed successfully (${prewarmedCount} render passes)`);

    } catch (error) {
      console.warn("Map Shine | Error during water system prewarm:", error);
      // Don't halt loading if prewarm fails
    }

    await loadingManager?.tick("WATER_PREWARM_END");
  }

  /**
   * Pre-warms masked effect layer render textures to eliminate first-frame stalls.
   * 
   * CRITICAL: MaskedEffectLayer subclasses defer their initial mask rendering until
   * the first animation frame via the _needsMaskUpdate flag. This causes 14-35ms stalls
   * across 7 affected layers:
   * - CloudShadowsLayer (2-5ms)
   * - CanopyLayer (2-5ms)
   * - IridescenceLayer (2-5ms)
   * - PrismLayer (2-5ms)
   * - WaterFXLayer (2-5ms)
   * - BuildingShadowsLayer (2-5ms)
   * - TimeOfDayLayer (2-5ms)
   * 
   * Note: StructuralShadowsLayer is already prewarmed separately in runFullSetup().
   * 
   * By calling renderMask() during loading, we eliminate the first-frame rendering cost.
   */
  static async _prewarmMaskedLayers() {
    const loadingManager = game.mapShine.loadingManager;
    await loadingManager?.tick("MASKED_LAYERS_PREWARM_START");

    console.log("Map Shine | Pre-warming masked effect layers...");

    try {
      // Define layer types to prewarm (excluding StructuralShadowsLayer - already done)
      // Only include types that are actually defined
      const layerTypes = [];
      
      if (typeof CloudShadowsLayer !== "undefined") {
        layerTypes.push({ type: CloudShadowsLayer, name: "CloudShadowsLayer" });
      }
      if (typeof CanopyLayer !== "undefined") {
        layerTypes.push({ type: CanopyLayer, name: "CanopyLayer" });
      }
      if (typeof IridescenceLayer !== "undefined") {
        layerTypes.push({ type: IridescenceLayer, name: "IridescenceLayer" });
      }
      if (typeof PrismLayer !== "undefined") {
        layerTypes.push({ type: PrismLayer, name: "PrismLayer" });
      }
      if (typeof WaterFXLayer !== "undefined") {
        layerTypes.push({ type: WaterFXLayer, name: "WaterFXLayer" });
      }
      if (typeof BuildingShadowsLayer !== "undefined") {
        layerTypes.push({ type: BuildingShadowsLayer, name: "BuildingShadowsLayer" });
      }
      if (typeof TimeOfDayLayer !== "undefined") {
        layerTypes.push({ type: TimeOfDayLayer, name: "TimeOfDayLayer" });
      }

      if (layerTypes.length === 0) {
        console.log("Map Shine | No masked layer classes loaded yet, skipping prewarm");
        await loadingManager?.tick("MASKED_LAYERS_PREWARM_END");
        return;
      }

      let prewarmedCount = 0;

      for (const { type, name } of layerTypes) {
        const layer = canvas.layers.find(l => l instanceof type);
        
        if (!layer) {
          continue; // Layer doesn't exist on this scene
        }

        // Validate that the layer has the required mask rendering infrastructure
        if (!layer.maskContainer || !layer.combinedMaskTexture?.valid) {
          console.warn(`Map Shine | ${name} missing mask infrastructure, skipping prewarm`);
          continue;
        }

        // Check if mask update is actually needed
        if (!layer._needsMaskUpdate) {
          continue; // Already rendered, no need to prewarm
        }

        // Pre-render the mask
        try {
          layer.renderMask();
          layer._needsMaskUpdate = false;
          prewarmedCount++;
        } catch (error) {
          console.warn(`Map Shine | Failed to prewarm ${name}:`, error);
        }
      }

      console.log(`Map Shine | Masked effect layers prewarmed successfully (${prewarmedCount} layers)`);

    } catch (error) {
      console.warn("Map Shine | Error during masked layers prewarm:", error);
      // Don't halt loading if prewarm fails
    }

    await loadingManager?.tick("MASKED_LAYERS_PREWARM_END");
  }

  /**
   * Pre-warms GeometryMaskManager render textures to eliminate first-frame stalls.
   * 
   * CRITICAL: GeometryMaskManager creates 10+ render textures during initialization
   * but defers all mask rendering until the first update() call. This causes a
   * 20-30ms stall on first frame as it renders all geometry masks at once.
   * 
   * Affected textures (created on-demand):
   */
  static async _prewarmGeometryMasks() {
  console.log("Map Shine | Pre-warming geometry masks...");

  try {
    const geometryManager = game.mapShine?.geometryMaskManager;

    if (!geometryManager) {
      console.warn("Map Shine | GeometryMaskManager not available, skipping prewarm");
      return;
    }

    // Check if there are any map points to render
    const groups = MapPointsManager.getGroups();
    if (foundry.utils.isEmpty(groups)) {
      console.log("Map Shine | No map points found, skipping geometry masks prewarm");
      return;
    }

    // Force the initial render of all geometry masks
    // This normally happens on first update() call, causing a first-frame stall
    geometryManager._renderAllMasks();
    geometryManager._needsUpdate = false; // Clear flag since we just rendered

    console.log("Map Shine | Geometry masks prewarmed successfully");

  } catch (error) {
    console.warn("Map Shine | Error during geometry masks prewarm:", error);
    // Don't halt loading if prewarm fails
  }
}
}