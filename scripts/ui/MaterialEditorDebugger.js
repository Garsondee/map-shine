import { DebuggerUIBuilder, DebuggerEventHandler } from "./MainUI.js";
import { ScreenEffectsManager } from "../managers/ScreenEffectsManager.js";

export class MaterialEditorDebugger {
  constructor() {
    this.element = null;
    this.uiBuilder = null;
    this.eventHandler = null;
    this.profileManager = null;
    this._boundUpdateIndicator = this._updateIndicator.bind(this);
    this.resizeObserver = null;
    this.resizeTimeout = null;
    this._updateSceneHookId = null; // To store the hook ID for cleanup
    this._mapPointsHookId = null; // To store the map points hook ID for cleanup
    this.preMinimizeSize = null;
  }

  /**
   * Re-renders the dynamic parts of the UI, such as the main controls and profile sections.
   * This is crucial for updating the UI when the scene profile structure changes.
   */
  render() {
    if (!this.element || !this.eventHandler || !this.uiBuilder) return;

    // Save the state of all <details> elements (accordion open/closed state)
    const accordionStates = new Map();
    this.element.querySelectorAll("details").forEach((details) => {
      if (details.id) {
        accordionStates.set(details.id, details.open);
      }
    });

    // Rebuild and inject the HTML for the main controls and profile sections
    const mainControlsHTML = this.uiBuilder._buildMainControlsSection();
    this.element.querySelector("#main-controls-section").innerHTML =
      mainControlsHTML;

    const profileSectionHTML = this.uiBuilder._buildProfileSection();
    this.element.querySelector("#material-editor-profiles-section").innerHTML =
      profileSectionHTML;

    // Rebuild ALL effect columns (1, 2, 3) to ensure button states update
    const managedEffects = ScreenEffectsManager.getManagedEffectsHTML();
    const loadingScreenHTML = this.uiBuilder._buildLoadingScreenSection();
    const pauseEffectHTML = this.uiBuilder._buildPauseEffectSection();
    
    const column1 = this.element.querySelector("#fx-column-1");
    if (column1) {
      column1.innerHTML = managedEffects.postProcessing;
      column1.innerHTML += this.uiBuilder._buildParticleSystemSection();
      column1.innerHTML += this.uiBuilder._buildWeatherSystemSection();
      column1.innerHTML += this.uiBuilder._buildFontManagerSection();
      column1.innerHTML += loadingScreenHTML;
      column1.innerHTML += pauseEffectHTML;
    }

    const otherEffectSections = this.uiBuilder._getEffectSections();
    const midPoint = Math.ceil(otherEffectSections.length / 2);
    const column2Effects = otherEffectSections.slice(0, midPoint);
    const column3Effects = otherEffectSections.slice(midPoint);

    const column2 = this.element.querySelector("#fx-column-2");
    const column3 = this.element.querySelector("#fx-column-3");

    if (column2) column2.innerHTML = column2Effects.join("");
    if (column3) column3.innerHTML = column3Effects.join("");

    // Restore accordion states
    this.element.querySelectorAll("details").forEach((details) => {
      if (details.id && accordionStates.has(details.id)) {
        details.open = accordionStates.get(details.id);
      }
    });

    // Re-attach listeners and update all control values for the newly created elements
    this.eventHandler.rebindDynamicControls();
    
    // Repopulate texture indicators and values after re-render
    this._populateAllIndicators();
    
    // Re-apply lazy accordion optimization after re-render
    // This strips out accordion content from DOM for performance
    if (this.eventHandler.lazyAccordionManager) {
      requestAnimationFrame(() => {
        this.eventHandler.setupLazyAccordions();
      });
    }

    // TEMP DIAGNOSTIC: Disable column width calculation to test if it's causing FPS drop
    if (false) { // Set to true to re-enable
      // Update column widths after re-render
      requestAnimationFrame(() => {
        if (this.eventHandler) {
          this.eventHandler._updateColumnWidths();
        }
      });
    }
  }

  initialize(profileManager) {
    this.profileManager = profileManager;
    this.profileManager.ui = this;
    this.uiBuilder = new DebuggerUIBuilder();
    this.element = this.uiBuilder.buildRootElement();
    document.body.appendChild(this.element);

    this.eventHandler = new DebuggerEventHandler(
      this.element,
      this.profileManager,
      this.uiBuilder
    );
    this.eventHandler.initialize();

    this.render();

    // Convert all rendered accordions to lazy mode (performance optimization)
    // This reduces DOM from 6,862 elements to ~500 elements
    requestAnimationFrame(() => {
      if (this.eventHandler) {
        this.eventHandler.setupLazyAccordions();
        
        // TEMP DIAGNOSTIC: Column width calculation disabled
        // this.eventHandler._updateColumnWidths();
      }
    });

    const savedPosition = game.settings.get(MODULE_ID, "debugger-position");
    const defaultWidth = 1000;
    const defaultHeight = 1150;
    if (savedPosition && savedPosition.width && savedPosition.height) {
      this.element.style.width = `${savedPosition.width}px`;
      this.element.style.height = `${savedPosition.height}px`;
      this.element.style.top = `${savedPosition.top}px`;
      this.element.style.left = `${savedPosition.left}px`;
    } else {
      this.element.style.width = `${defaultWidth}px`;
      const calculatedHeight = Math.min(
        defaultHeight,
        window.innerHeight - 120
      );
      this.element.style.height = `${calculatedHeight}px`;
      const initialTop = 80;
      const initialLeft = (window.innerWidth - defaultWidth) / 2;
      this.element.style.top = `${initialTop}px`;
      this.element.style.left = `${Math.max(0, initialLeft)}px`;
    }
    this._populateAllIndicators();
    systemStatus.on("statusChanged", this._boundUpdateIndicator);

    // The hook now triggers a full re-render of the dynamic UI parts
    this._updateSceneHookId = Hooks.on(
      "updateScene",

      (scene, data, _options) => {
        const flagPath = `flags.${MODULE_ID}`;
        if (
          !scene.isView ||
          (!foundry.utils.hasProperty(data, `${flagPath}.profiles`) &&
            !foundry.utils.hasProperty(data, `${flagPath}.activeProfileId`))
        ) {
          return;
        }
        if (this.element && this.eventHandler) {
          this.render();
        }
      }
    );

    // Listen for map points updates to refresh point group displays
    this._mapPointsHookId = Hooks.on("mapShine:mapPointsUpdated", () => {
      if (this.element && this.eventHandler) {
        this.render();
      }
    });

    this.resizeObserver = new ResizeObserver((entries) => {
      if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          const currentPos =
            game.settings.get(MODULE_ID, "debugger-position") || {};
          currentPos.width = width;
          currentPos.height = height;
          if (currentPos.top === undefined)
            currentPos.top = this.element.offsetTop;
          if (currentPos.left === undefined)
            currentPos.left = this.element.offsetLeft;
          game.settings.set(MODULE_ID, "debugger-position", currentPos);
        }
      }, 200);
    });
    this.resizeObserver.observe(this.element);
  }

  close() {
    this.destroy();
  }

  _populateAllIndicators() {
    if (!this.element) return;
    const allStatuses = systemStatus.getAllStatuses();
    for (const [category, keys] of Object.entries(allStatuses)) {
      for (const [key, statusObject] of Object.entries(keys)) {
        this._updateIndicator(category, key, statusObject);
      }
    }
  }

  _updateIndicator(category, key, statusObject) {
    if (!this.element) return;
    const indicator = this.element.querySelector(`#status-${category}-${key}`);
    if (indicator) {
      indicator.className = `traffic-light ${statusObject.state}`;

      indicator.title = statusObject.message;
    }

    if (category === "textures") {
      const input = this.element.querySelector(`#texture-path-${key}`);
      if (input) {
        // Only display the path if it was successfully found.
        // The message for other states is not a path.

        input.value = statusObject.state === "ok" ? statusObject.message : "";
      }
    }
  }

  destroy() {
    if (!this.element) return;

    // Unsubscribe from system status updates
    systemStatus.off("statusChanged", this._boundUpdateIndicator);

    // Disconnect the resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Unregister the scene update hook
    if (this._updateSceneHookId) {
      Hooks.off("updateScene", this._updateSceneHookId);
      this._updateSceneHookId = null;
    }

    // Unregister the map points update hook
    if (this._mapPointsHookId) {
      Hooks.off("mapShine:mapPointsUpdated", this._mapPointsHookId);
      this._mapPointsHookId = null;
    }

    // Destroy the event handler and its components
    this.eventHandler?.destroy();

    // Remove the UI element from the DOM
    this.element.remove();
    this.element = null;

    // Clear references
    if (this.profileManager) {
      this.profileManager.ui = null;
    }
    this.profileManager = null;
    this.eventHandler = null;
    this.uiBuilder = null;

    // Clear global reference
    if (game.mapShine.debugger === this) {
      game.mapShine.debugger = null;
    }

    // Nullify activeEditor and re-render controls to sync the toolbar button
    if (game.mapShine.activeEditor === this) {
      game.mapShine.activeEditor = null;
    }
    ui.controls.render();

    console.log("Material Editor | UI system destroyed.");
  }
}