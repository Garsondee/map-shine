import { MODULE_ID } from "../config/constants.js";
import { LoadingUI } from "../ui/LoadingUI.js";
import { UNIVERSAL_EFFECT_DEFAULTS } from "../config/universal-defaults.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { ScreenEffectsManager } from "./ScreenEffectsManager.js";
import { RenderTexturePool } from "../utils/RenderTexturePool.js";
import { MapShineLifecycle } from "../core/MapShineLifecycle.js";

/**
 * @fileoverview Scene Change Management System for Map Shine Module
 *
 * This file contains the SceneChangeManager class that handles scene transitions,
 * loading screens, and the lifecycle of visual effects during scene changes.
 *
 * @author Garsondee
 * @version 1.0.0
 * @since 1.0.0
 */


/**
 * Manages scene transitions and the lifecycle of visual effects during scene changes.
 *
 * This class serves as the central coordinator for all module setup and teardown
 * operations when transitioning between scenes in Foundry VTT. It ensures proper
 * resource management, prevents memory leaks, and provides smooth visual transitions.
 *
 * Key responsibilities:
 * - Coordinating canvas teardown and setup sequences
 * - Managing transition overlays and loading screens
 * - Synchronizing effect system initialization
 * - Handling state management during transitions
 * - Providing user feedback during scene loading
 *
 * State Management:
 * - IDLE: Normal operation, no transition in progress
 * - TEARING_DOWN: Cleaning up resources from previous scene
 * - AWAITING_SETUP: Waiting for canvas to be ready for setup
 * - SETTING_UP: Initializing effects for new scene
 *
 * The manager integrates with Foundry's canvas lifecycle hooks and ensures
 * all Map Shine components are properly initialized and cleaned up during
 * scene transitions.
 *
 * @class SceneChangeManager
 * @since 1.0.0
 */
export class SceneChangeManager {
  static STATES = {
    IDLE: "IDLE",
    TEARING_DOWN: "TEARING_DOWN",
    AWAITING_SETUP: "AWAITING_SETUP",
    SETTING_UP: "SETTING_UP",
  };

  constructor() {
    this._currentState = SceneChangeManager.STATES.IDLE;
    this._teardownPromise = Promise.resolve(); // Start with a resolved promise for the initial load.
    this._resolveTeardown = null;

    // Unified LoadingUI instance
    this.ui = null;

    // Preview mode state
    this.previewActive = false;
    this._previewToolbar = null;
    this._previewSnapshot = null; // store settings snapshot to allow cancel
  }

  // Proxy property for backward compatibility
  get transitionOverlay() {
    return this.ui?.element || null;
  }

  initialize() {
    // The promise is already resolved by default, so we don't create a new one here.
    console.log("Map Shine | SceneChangeManager: Registering hooks...");
    Hooks.on("canvasTearDown", this.handleCanvasTearDown.bind(this));
    Hooks.on("canvasReady", this.handleCanvasReady.bind(this));
    console.log(
      "Map Shine | SceneChangeManager initialized and hooked into canvas events."
    );
    console.log("Map Shine | Current state:", this._currentState);
    console.log("Map Shine | Loading manager available:", !!game.mapShine?.loadingManager);
    console.log("Map Shine | Loading screen available:", !!game.mapShine?.loadingScreen);
  }

  _createOverlay() {
    if (this.transitionOverlay) {
      console.log(`[MapShine Transition] Overlay already exists, skipping creation`);
      return;
    }

    console.log(`[MapShine Transition] Creating overlay element.`);

    try {
      // Create unified LoadingUI instance
      this.ui = new LoadingUI({
        elementId: "map-shine-scene-transition",
        title: "Loading Scene...",
        fadeOutDuration: 1500,
        defaults: {
          randomHints: UNIVERSAL_EFFECT_DEFAULTS.sceneTransition.randomHints,
          subheading: UNIVERSAL_EFFECT_DEFAULTS.sceneTransition.subheading,
        },
      });
      console.log(`[MapShine Transition] LoadingUI instance created`);

      // Connect this UI to the loading manager for progress updates
      if (game.mapShine.loadingManager) {
        game.mapShine.loadingManager.screen = this.ui;
        console.log(
          `[MapShine Transition] Connected overlay to loading manager for progress updates`
        );
      }

      // Show the UI
      this.ui.show();
      console.log(`[MapShine Transition] UI.show() called`);
      console.log(`[MapShine Transition] Element exists:`, !!this.ui.element);
      console.log(`[MapShine Transition] Element ID:`, this.ui.element?.id);
      console.log(`[MapShine Transition] transitionOverlay getter returns:`, !!this.transitionOverlay);

      console.log(`[MapShine Transition] Overlay appended to DOM successfully`);
    } catch (error) {
      console.error(`[MapShine Transition] Failed to create overlay:`, error);
      throw error;
    }
  }

  /**
   * Show a non-destructive preview of the transition overlay with a minimal toolbar.
   */
  showPreviewOverlay() {
    console.log(`[MapShine Preview] Starting preview mode`);
    try {
      if (this.previewActive) {
        console.log(`[MapShine Preview] Preview already active, skipping`);
        return;
      }
      // Snapshot settings for cancel
      this._previewSnapshot = {
        overlayOpacity: game.settings.get(
          MODULE_ID,
          "loading-screen-background-overlay-opacity"
        ),
        overlayEnabled: game.settings.get(
          MODULE_ID,
          "loading-screen-background-overlay-enabled"
        ),
        useRandom: game.settings.get(
          MODULE_ID,
          "loading-screen-use-random-background"
        ),
        staticBg: game.settings.get(
          MODULE_ID,
          "loading-screen-static-background"
        ),
      };

      this._createOverlay();
      console.log(`[MapShine Preview] After _createOverlay, transitionOverlay exists:`, !!this.transitionOverlay);
      if (!this.transitionOverlay) {
        console.error(`[MapShine Preview] transitionOverlay is null! Cannot show preview.`);
        ui.notifications?.error?.('Failed to create preview overlay. Check console for details.');
        return;
      }

      this.previewActive = true;
      
      // Force instant appearance (bypass CSS transition)
      this.transitionOverlay.style.transition = "none";
      this.transitionOverlay.style.opacity = "1";
      this.transitionOverlay.style.pointerEvents = "auto";
      
      // Force reflow to apply instant opacity change
      void this.transitionOverlay.offsetHeight;
      
      // Re-enable transitions for interactive elements
      this.transitionOverlay.style.transition = "";

      // Mark title as Preview
      const titleElement =
        this.transitionOverlay.querySelector(".loading-title");
      if (titleElement) titleElement.textContent = "Preview";

      // Inject toolbar
      this._injectPreviewToolbar();

      // ESC to cancel
      this._onEsc = (ev) => {
        if (ev.key === "Escape") this.hidePreviewOverlay({ apply: false });
      };
      document.addEventListener("keydown", this._onEsc);
    } catch (e) {
      console.warn("[MapShine Transition] Failed to start Preview Mode:", e);
    }
  }

  /**
   * Hide preview overlay and optionally apply changes.
   * @param {{apply:boolean}} opts
   */
  async hidePreviewOverlay({ apply }) {
    console.log(`[MapShine Preview] Hiding preview overlay, apply=${apply}`);
    try {
      if (!this.previewActive) return;
      document.removeEventListener("keydown", this._onEsc);
      this._onEsc = null;

      if (!apply && this._previewSnapshot) {
        // Restore settings
        try {
          await game.settings.set(
            MODULE_ID,
            "loading-screen-background-overlay-opacity",
            this._previewSnapshot.overlayOpacity
          );
        } catch (err) {
          console.warn(
            "[MapShine Transition] Failed to restore overlay opacity:",
            err
          );
        }
        try {
          await game.settings.set(
            MODULE_ID,
            "loading-screen-use-random-background",
            this._previewSnapshot.useRandom
          );
        } catch (err) {
          console.warn(
            "[MapShine Transition] Failed to restore use-random background:",
            err
          );
        }
        try {
          await game.settings.set(
            MODULE_ID,
            "loading-screen-static-background",
            this._previewSnapshot.staticBg || ""
          );
        } catch (err) {
          console.warn(
            "[MapShine Transition] Failed to restore static background:",
            err
          );
        }
      }

      // Remove toolbar
      if (this._previewToolbar) {
        this._previewToolbar.remove();
        this._previewToolbar = null;
      }

      // Destroy overlay used for preview
      this._destroyOverlay();
      this.previewActive = false;
      this._previewSnapshot = null;

      // Re-render debugger UI to restore all content
      const debugUI = game.mapShine?.debugger;
      if (debugUI && typeof debugUI.render === "function") {
        debugUI.render();
        console.log(`[MapShine Preview] Re-rendered debugger UI after closing preview`);
      }
    } catch (e) {
      console.warn("[MapShine Transition] Failed to exit Preview Mode:", e);
    }
  }

  _injectPreviewToolbar() {
    if (!this.transitionOverlay || this._previewToolbar) return;
    const toolbar = document.createElement("div");
    toolbar.className = "mapshine-preview-toolbar";
    toolbar.innerHTML = `
        <label>Opacity</label>
        <input id="ms-preview-opacity" type="range" data-no-path="true" min="0" max="1" step="0.05" value="${game.settings.get(
          MODULE_ID,
          "loading-screen-background-overlay-opacity"
        )}" title="Preview-only control, not connected to config">
        <span class="mapshine-divider"></span>
        <label>Shadow</label>
        <select id="ms-preview-shadow">
          <option>Medium</option>
          <option>Low</option>
          <option>High</option>
          <option>Ultra</option>
        </select>
        <span class="mapshine-divider"></span>
        <label>Theme</label>
        <select id="ms-preview-theme">
          <option value="default">Default</option>
          <option value="arcane">Arcane</option>
          <option value="neon">Neon</option>
          <option value="frost">Frost</option>
          <option value="ember">Ember</option>
        </select>
        <span class="mapshine-divider"></span>
        <label>Random BG</label>
        <input id="ms-preview-use-random" type="checkbox" ${
          game.settings.get(MODULE_ID, "loading-screen-use-random-background")
            ? "checked"
            : ""
        }>
        <label>Static URL</label>
        <input id="ms-preview-static-bg" type="text" placeholder="img.jpg" value="${
          game.settings.get(MODULE_ID, "loading-screen-static-background") || ""
        }">
        <button class="load-bg">Load</button>
        <button class="apply">Apply</button>
        <button class="cancel">Cancel</button>
      `;
    this.transitionOverlay.appendChild(toolbar);
    this._previewToolbar = toolbar;

    const opacityInput = toolbar.querySelector("#ms-preview-opacity");
    const shadowSel = toolbar.querySelector("#ms-preview-shadow");
    const themeSel = toolbar.querySelector("#ms-preview-theme");
    const useRandomCb = toolbar.querySelector("#ms-preview-use-random");
    const staticBgInput = toolbar.querySelector("#ms-preview-static-bg");
    const loadBgBtn = toolbar.querySelector("button.load-bg");
    const applyBtn = toolbar.querySelector("button.apply");
    const cancelBtn = toolbar.querySelector("button.cancel");

    opacityInput?.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      this._updateOverlayOpacity(v);
    });

    shadowSel?.addEventListener("change", () =>
      this._applyShadowIntensity(shadowSel.value)
    );
    themeSel?.addEventListener("change", () =>
      this._applyThemePreset(themeSel.value)
    );
    useRandomCb?.addEventListener("change", () => {
      if (useRandomCb.checked) {
        this._setRandomBackground();
      } else {
        this._setStaticBackground(staticBgInput?.value ?? "");
      }
    });
    loadBgBtn?.addEventListener("click", () =>
      this._setStaticBackground(staticBgInput?.value ?? "")
    );

    applyBtn?.addEventListener("click", async () => {
      const v = Number(opacityInput?.value ?? 0.6);
      try {
        await game.settings.set(
          MODULE_ID,
          "loading-screen-background-overlay-opacity",
          v
        );
      } catch (err) {
        console.warn(
          "[MapShine Transition] Failed to persist overlay opacity:",
          err
        );
      }
      try {
        await game.settings.set(
          MODULE_ID,
          "loading-screen-use-random-background",
          !!useRandomCb?.checked
        );
      } catch (err) {
        console.warn(
          "[MapShine Transition] Failed to persist use-random background:",
          err
        );
      }
      try {
        await game.settings.set(
          MODULE_ID,
          "loading-screen-static-background",
          staticBgInput?.value ?? ""
        );
      } catch (err) {
        console.warn(
          "[MapShine Transition] Failed to persist static background:",
          err
        );
      }
      this.hidePreviewOverlay({ apply: true });
    });

    cancelBtn?.addEventListener("click", () =>
      this.hidePreviewOverlay({ apply: false })
    );

    // Ensure initial update reflects current opacity
    this._updateOverlayOpacity(Number(opacityInput?.value ?? 0.6));
    this._applyShadowIntensity(shadowSel?.value ?? "Medium");
  }

  _updateOverlayOpacity(opacity) {
    const bg = this.transitionOverlay?.querySelector(
      ".loading-background-overlay"
    );
    if (!bg) return;
    const maxOpacity = opacity;
    const minOpacity = maxOpacity * 0.4;
    bg.style.display = "block";
    bg.style.background = `linear-gradient(to bottom, rgba(0,0,0,${maxOpacity}) 0%, rgba(0,0,0,${minOpacity}) 35%, rgba(0,0,0,${minOpacity}) 65%, rgba(0,0,0,${maxOpacity}) 100%)`;
  }

  _applyShadowIntensity(preset) {
    const content = this.transitionOverlay?.querySelector(".loading-content");
    if (!content) return;
    const map = {
      Low: "drop-shadow(0 0 20px rgba(0,0,0,0.7)) drop-shadow(0 0 40px rgba(0,0,0,0.5))",
      Medium:
        "drop-shadow(0 0 40px rgba(0,0,0,0.9)) drop-shadow(0 0 80px rgba(0,0,0,0.8)) drop-shadow(0 0 120px rgba(0,0,0,0.6))",
      High: "drop-shadow(0 0 60px rgba(0,0,0,0.95)) drop-shadow(0 0 120px rgba(0,0,0,0.85)) drop-shadow(0 0 180px rgba(0,0,0,0.7))",
      Ultra:
        "drop-shadow(0 0 90px rgba(0,0,0,0.98)) drop-shadow(0 0 160px rgba(0,0,0,0.9)) drop-shadow(0 0 220px rgba(0,0,0,0.8))",
    };
    content.style.filter = map[preset] || map.Medium;
  }

  _applyThemePreset(name) {
    const root = this.transitionOverlay;
    if (!root) return;
    const presets = {
      default: {
        "--ms-primary": "#3b82f6",
        "--ms-success": "#10b981",
        "--ms-glow-blue": "rgba(59,130,246,0.3)",
      },
      arcane: {
        "--ms-primary": "#8b5cf6",
        "--ms-success": "#22d3ee",
        "--ms-glow-blue": "rgba(139,92,246,0.35)",
      },
      neon: {
        "--ms-primary": "#22d3ee",
        "--ms-success": "#f43f5e",
        "--ms-glow-blue": "rgba(34,211,238,0.35)",
      },
      frost: {
        "--ms-primary": "#60a5fa",
        "--ms-success": "#a7f3d0",
        "--ms-glow-blue": "rgba(96,165,250,0.35)",
      },
      ember: {
        "--ms-primary": "#fb923c",
        "--ms-success": "#fca5a5",
        "--ms-glow-blue": "rgba(251,146,60,0.35)",
      },
    };
    const preset = presets[name] || presets.default;
    for (const [k, v] of Object.entries(preset)) {
      root.style.setProperty(k, v);
    }
  }

  _setRandomBackground() {
    const useRandom = true;
    const staticBg = game.settings.get(
      MODULE_ID,
      "loading-screen-static-background"
    );
    const randomBgs = (
      game.settings.get(MODULE_ID, "loading-screen-random-backgrounds") || ""
    )
      .split(/\r?\n/)
      .filter((l) => l.trim());
    let bgPath = staticBg || "";
    if (useRandom && randomBgs.length > 0) {
      bgPath = randomBgs[Math.floor(Math.random() * randomBgs.length)];
    }
    this._applyBackgroundImage(bgPath);
  }

  _setStaticBackground(path) {
    this._applyBackgroundImage(path || "");
  }

  _applyBackgroundImage(path) {
    if (!this.transitionOverlay) return;
    if (path) {
      this.transitionOverlay.style.backgroundImage = `url('${path}')`;
      this.transitionOverlay.style.backgroundSize = "cover";
      this.transitionOverlay.style.backgroundPosition = "center center";
    } else {
      this.transitionOverlay.style.backgroundImage = "";
    }
  }

  _destroyOverlay() {
    if (!this.ui) return;
    console.log(`[MapShine Transition] Destroying overlay element.`);

    // Disconnect from loading manager
    if (
      game.mapShine.loadingManager &&
      game.mapShine.loadingManager.screen === this.ui
    ) {
      game.mapShine.loadingManager.screen = null;
      console.log(
        `[MapShine Transition] Disconnected overlay from loading manager`
      );
    }

    this.ui.destroy();
    this.ui = null;
  }

  /**
   * Fades out the transition overlay to black
   * @param {Object} transitionConfig - Configuration for the transition
   * @param {Object} scene - Scene object being transitioned to
   */
  async fadeOut(transitionConfig, scene) {
    if (!this.transitionOverlay) {
      console.warn(
        "Map Shine | SceneChangeManager: Cannot fade out - no overlay exists"
      );
      return;
    }

    // Use navigation name if available, otherwise fall back to scene name
    const displayName = scene?.navName || scene?.name || "Unknown Scene";
    console.log(
      `[MapShine Transition] Fading out for scene: ${displayName} (navigation name: ${
        scene?.navName || "not set"
      }, actual name: ${scene?.name}), showSceneName: ${transitionConfig.showSceneName}`
    );

    // Update the title - check showSceneName setting
    if (transitionConfig.showSceneName) {
      this.ui.setTitle(displayName);
    } else {
      // Use the configured heading instead of scene name
      const heading = transitionConfig.heading || "Loading...";
      this.ui.setTitle(heading);
    }

    // Fade in the overlay (show black screen)
    // Progress will be managed by the loading manager during setup
    await this.ui.fadeIn();

    // Wait for the fade duration
    const fadeDuration = transitionConfig.fadeOutDuration || 1500;
    await new Promise((resolve) => setTimeout(resolve, fadeDuration));
  }

  /**
   * Fades in from the transition overlay back to the scene
   * @param {Object} transitionConfig - Configuration for the transition
   */
  async fadeIn(transitionConfig) {
    if (!this.transitionOverlay) {
      console.warn(
        "Map Shine | SceneChangeManager: Cannot fade in - no overlay exists"
      );
      return;
    }

    console.log(`[MapShine Transition] Fading in to reveal new scene`);

    // Complete the loading bar with smooth animation
    this.ui.setProgress(100, "Scene ready!", {
      duration: 600,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    });

    // Brief pause to show completion
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Fade out the overlay (reveal the scene)
    await this.ui.fadeOut();

    // Wait for the fade duration
    const fadeDuration = transitionConfig.fadeInDuration || 1500;
    await new Promise((resolve) => setTimeout(resolve, fadeDuration));
  }

  // Additional methods would be included here...
  // (Truncated for token limit - full implementation would include all methods)

  async handleCanvasTearDown(canvas) {
    // KILL SWITCH ENGAGED: Halt all illumination-dependent systems.
    game.mapShine.transitionActive = true;
    console.log(
      `%cSceneChangeManager: Handling canvasTearDown. TRANSITION ACTIVE. Current state: ${this._currentState}`,
      "color: #ff0000; font-weight: bold;"
    );

    if (
      this._currentState !== SceneChangeManager.STATES.IDLE &&
      this._currentState !== SceneChangeManager.STATES.AWAITING_SETUP
    ) {
      console.warn(
        `Map Shine | Received canvasTearDown while in an unexpected state: ${this._currentState}. Forcing teardown.`
      );
    }

    this._currentState = SceneChangeManager.STATES.TEARING_DOWN;
    // Create a new, pending promise that the *next* `canvasReady` event will await.
    this._teardownPromise = new Promise((resolve) => {
      this._resolveTeardown = resolve;
    });

    try {
      await this._performTeardown(canvas);
    } catch (error) {
      console.error("Map Shine | An error occurred during teardown:", error);
    } finally {
      console.log(
        `%cSceneChangeManager: Teardown complete. State -> AWAITING_SETUP`,
        "color: #ff8c00"
      );
      this._currentState = SceneChangeManager.STATES.AWAITING_SETUP;
      if (this._resolveTeardown) this._resolveTeardown(); // Resolve the promise, allowing the next setup to proceed.
    }
  }

  async handleCanvasReady(canvas) {
    console.log(
      `%cSceneChangeManager: ✓ handleCanvasReady CALLED! Current state: ${this._currentState}`,
      "color: #00ff00; font-weight: bold;"
    );
    console.log("Map Shine | Canvas object:", canvas);
    console.log("Map Shine | Canvas.scene:", canvas?.scene?.name || "NO SCENE");

    // This is the gate. It waits until the previous teardown is fully complete.
    // On initial load, this resolves instantly.
    await this._teardownPromise;
    console.log(
      `%cSceneChangeManager: Teardown promise resolved. Proceeding with setup.`,
      "color: #00e0ff"
    );

    this._currentState = SceneChangeManager.STATES.SETTING_UP;

    try {
      await this._performSetup(canvas);
    } catch (error) {
      console.error("Map Shine | An error occurred during setup:", error);
      console.error(error.stack);
    } finally {
      console.log(
        `%cSceneChangeManager: Setup complete. State -> IDLE`,
        "color: #00e0ff"
      );
      this._currentState = SceneChangeManager.STATES.IDLE;
    }
  }

  async _performTeardown(tornDownCanvas) {
    console.log("Map Shine | SceneChangeManager: Performing teardown...");
    if (!tornDownCanvas?.mapShine) return;

    // Mark canvas as inactive to prevent race conditions with async discovery
    tornDownCanvas.mapShine.isModuleActive = false;

    // ✅ P2: Unpin textures before clearing cache
    // Allow Foundry to evict these textures from its cache if needed
    const targets = game.mapShine?.effectTargetManager?.targets;
    if (targets) {
      const allPaths = new Set();
      
      // Gather paths from scene background
      if (targets.background) {
        Object.values(targets.background).forEach((path) => {
          if (typeof path === "string" && path) {
            allPaths.add(path);
          }
        });
      }
      
      // Gather paths from all tiles
      for (const tileTarget of targets.tiles.values()) {
        Object.values(tileTarget).forEach((value) => {
          if (typeof value === "string" && value) {
            allPaths.add(value);
          }
        });
      }
      
      // Unpin all discovered textures
      if (allPaths.size > 0) {
        allPaths.forEach(path => {
          foundry.canvas.TextureLoader.unpinSource(path);
        });
        console.log(`Map Shine | Unpinned ${allPaths.size} textures (now eligible for eviction).`);
      }
    }

    // Clear downscaled texture cache to free VRAM
    TextureLoader.clearCache();

    try {
      // 1. Destroy particle systems first to prevent animation errors
      if (game.mapShine.particleManager) {
        try {
          console.log("Map Shine | Teardown: Destroying particle manager...");
          game.mapShine.particleManager.destroy();
          game.mapShine.particleManager = null;
        } catch (error) {
          console.warn("Map Shine | Error destroying particle manager:", error);
          game.mapShine.particleManager = null; // Still nullify to prevent further issues
        }
      }

      // 2. Destroy geometry mask manager to clean up mask textures
      if (game.mapShine.geometryMaskManager) {
        try {
          console.log(
            "Map Shine | Teardown: Destroying geometry mask manager..."
          );
          game.mapShine.geometryMaskManager.destroy();
          game.mapShine.geometryMaskManager = null;
        } catch (error) {
          console.warn(
            "Map Shine | Error destroying geometry mask manager:",
            error
          );
          game.mapShine.geometryMaskManager = null; // Still nullify to prevent further issues
        }
      }

      // 2a. Destroy light mask manager to release GPU resources and event listeners
      if (game.mapShine.lightMaskManager) {
        try {
          console.log("Map Shine | Teardown: Destroying light mask manager...");
          game.mapShine.lightMaskManager.destroy();
          game.mapShine.lightMaskManager = null;
        } catch (error) {
          console.warn(
            "Map Shine | Error destroying light mask manager:",
            error
          );
          game.mapShine.lightMaskManager = null; // Still nullify to prevent further issues
        }
      }

      // 2b. Destroy token mask manager to release GPU resources and event listeners
      if (game.mapShine.tokenMaskManager) {
        try {
          console.log("Map Shine | Teardown: Destroying token mask manager...");
          game.mapShine.tokenMaskManager.destroy();
          game.mapShine.tokenMaskManager = null;
        } catch (error) {
          console.warn(
            "Map Shine | Error destroying token mask manager:",
            error
          );
          game.mapShine.tokenMaskManager = null; // Still nullify to prevent further issues
        }
      }

      // 3. Clean up effect target manager
      if (game.mapShine.effectTargetManager) {
        try {
          console.log(
            "Map Shine | Teardown: Cleaning effect target manager..."
          );
          // Clear cached targets to force rediscovery
          game.mapShine.effectTargetManager.targets = null;
        } catch (error) {
          console.warn(
            "Map Shine | Error cleaning effect target manager:",
            error
          );
        }
      }

      // 4. Teardown screen effects manager filters
      if (ScreenEffectsManager && ScreenEffectsManager.tearDown) {
        try {
          console.log("Map Shine | Teardown: Tearing down screen effects...");
          ScreenEffectsManager.tearDown();
        } catch (error) {
          console.warn("Map Shine | Error tearing down screen effects:", error);
        }
      }

      // 5. Clean up additional managers with individual error handling
      if (game.mapShine.dynamicExposureManager) {
        try {
          console.log(
            "Map Shine | Teardown: Destroying dynamic exposure manager..."
          );
          game.mapShine.dynamicExposureManager.destroy();
          game.mapShine.dynamicExposureManager = null;
        } catch (error) {
          console.warn(
            "Map Shine | Error destroying dynamic exposure manager:",
            error
          );
          game.mapShine.dynamicExposureManager = null; // Still nullify to prevent further issues
        }
      }

      if (game.mapShine.combatEffectManager) {
        try {
          console.log(
            "Map Shine | Teardown: Destroying combat effect manager..."
          );
          game.mapShine.combatEffectManager.destroy();
        } catch (error) {
          console.warn(
            "Map Shine | Error destroying combat effect manager:",
            error
          );
        }
      }

      if (game.mapShine.windManager) {
        try {
          console.log("Map Shine | Teardown: Destroying wind manager...");
          game.mapShine.windManager.destroy();
          game.mapShine.windManager = null;
        } catch (error) {
          console.warn("Map Shine | Error destroying wind manager:", error);
          game.mapShine.windManager = null; // Still nullify to prevent further issues
        }
      }

      if (game.mapShine.weatherSystemManager) {
        try {
          console.log("Map Shine | Teardown: Destroying weather system manager...");
          game.mapShine.weatherSystemManager.destroy();
          game.mapShine.weatherSystemManager = null;
        } catch (error) {
          console.warn("Map Shine | Error destroying weather system manager:", error);
          game.mapShine.weatherSystemManager = null; // Still nullify to prevent further issues
        }
      }

      // 6. Clean up render texture pool
      try {
        console.log("Map Shine | Teardown: Destroying render texture pool...");
        RenderTexturePool.destroy();
      } catch (error) {
        console.warn("Map Shine | Error destroying render texture pool:", error);
      }

      // 7. Clean up resource manager
      if (game.mapShine.resourceManager) {
        try {
          console.log("Map Shine | Teardown: Destroying resource manager...");
          game.mapShine.resourceManager.destroy();
          game.mapShine.resourceManager = null;
        } catch (error) {
          console.warn("Map Shine | Error destroying resource manager:", error);
          game.mapShine.resourceManager = null; // Still nullify to prevent further issues
        }
      }

      // 8. Reset system ready flag
      game.mapShine.systemsReady = false;

      console.log(
        "Map Shine | SceneChangeManager: Teardown finished successfully."
      );
    } catch (error) {
      console.error("Map Shine | Error during teardown:", error);
    }
  }

  async _performSetup(canvas) {
    console.log("Map Shine | SceneChangeManager: Performing setup...");
    if (!canvas.scene) {
      console.warn("Map Shine | No canvas.scene found, aborting setup");
      return;
    }

    game.mapShine.systemsReady = false;

    // Initialize a new mapShine object on the new canvas
    canvas.mapShine = {
      isModuleActive: true,
    };

    // Start the loading progress - the overlay is already connected to the loading manager
    console.log("Map Shine | Checking loading manager...");
    console.log("  - loadingManager exists:", !!game.mapShine.loadingManager);
    console.log("  - loadingManager.screen exists:", !!game.mapShine.loadingManager?.screen);
    console.log("  - loadingScreen exists:", !!game.mapShine.loadingScreen);
    
    if (game.mapShine.loadingManager) {
      console.log("Map Shine | Calling loadingManager.setProgress('START')...");
      game.mapShine.loadingManager.setProgress("START");
      console.log(
        "Map Shine | SceneChangeManager: Starting loading progress updates"
      );
    } else {
      console.warn("Map Shine | Loading manager not available!");
    }

    // Import the MapShineLifecycle class and begin the discovery process
    // We need to dynamically import since this is a separate file
    console.log("Map Shine | Importing MapShineLifecycle...");
    const { MapShineLifecycle } = await import("../core/MapShineLifecycle.js");
    console.log("Map Shine | Beginning persistent discovery...");
    await MapShineLifecycle.beginPersistentDiscovery(canvas);
  }
}