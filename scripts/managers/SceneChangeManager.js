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

// Module ID constant (avoiding circular import)
const MODULE_ID = "map-shine";

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
class SceneChangeManager {
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
		this.transitionOverlay = null;

		// State for the hint cycling system
		this._hintInterval = null;
		this._shuffledHints = [];
		this._currentHintIndex = 0;
		this._hintAnimation = null; // To hold the animation controller
	}

	initialize() {
		// The promise is already resolved by default, so we don't create a new one here.
		Hooks.on("canvasTearDown", this.handleCanvasTearDown.bind(this));
		Hooks.on("canvasReady", this.handleCanvasReady.bind(this));
		console.log(
			"Map Shine | SceneChangeManager initialized and hooked into canvas events."
		);
	}

	_createOverlay() {
		if (this.transitionOverlay) return;

		const getFont = (style) =>
			game.settings.get(
				MODULE_ID,
				`universal.fontManager.styles.${style}.fontFamily`
			);
		const headingFont = getFont("heading1");
		const subheadingFont = getFont("heading2");
		const bodyFont = getFont("body");
		const hintFont = getFont("hint");

		console.log(`[MapShine Transition] Creating overlay element.`);
		this.transitionOverlay = document.createElement("div");
		this.transitionOverlay.id = "map-shine-scene-transition";

		// Set initial styles for the main container
		Object.assign(this.transitionOverlay.style, {
			position: "fixed",
			top: 0,
			left: 0,
			width: "100vw",
			height: "100vh",
			backgroundColor: "black",
			zIndex: 999999,
			opacity: 0,
			pointerEvents: "none",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			fontFamily: `${bodyFont}, Signika, sans-serif`,
			color: "white",
			textAlign: "center",
		});

		// Create overlay HTML structure (truncated for brevity)
		this.transitionOverlay.innerHTML = `
			<div class="background-overlay"></div>
			<div class="transition-content">
				<img class="transition-logo" src="" style="display: none;">
				<h1 class="transition-heading" style="display: none;"></h1>
				<h2 class="transition-subheading" style="display: none;"></h2>
				<p class="transition-description" style="display: none;"></p>
				<h3 class="transition-scenename" style="display: none;"></h3>
				<p class="transition-hint" style="display: none;"></p>
			</div>
			<div class="loading-bar-container">
				<div class="loading-bar-fill"></div>
			</div>
			<p class="transition-status"></p>
		`;

		document.body.appendChild(this.transitionOverlay);
	}

	_stopHintCycle() {
		// Clear the hint cycling interval if it exists
		if (this._hintInterval) {
			clearInterval(this._hintInterval);
			this._hintInterval = null;
		}

		// Cancel any ongoing hint animation
		if (this._hintAnimation) {
			this._hintAnimation.cancel?.();
			this._hintAnimation = null;
		}
	}

	_destroyOverlay() {
		this._stopHintCycle(); // Stop the hint animation when the overlay is removed.
		if (!this.transitionOverlay) return;
		console.log(`[MapShine Transition] Destroying overlay element.`);
		this.transitionOverlay.remove();
		this.transitionOverlay = null;
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
			`%cSceneChangeManager: Handling canvasReady. Current state: ${this._currentState}`,
			"color: #00e0ff"
		);

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

		// Teardown logic would continue here...
		// (Implementation details truncated for brevity)

		console.log("Map Shine | SceneChangeManager: Teardown finished.");
	}

	async _performSetup(canvas) {
		console.log("Map Shine | SceneChangeManager: Performing setup...");
		if (!canvas.scene) return;

		game.mapShine.systemsReady = false;

		// Initialize a new mapShine object on the new canvas
		canvas.mapShine = {
			isModuleActive: true,
		};

		// Start the loading progress
		if (game.mapShine.loadingManager) {
			game.mapShine.loadingManager.setProgress("START");
		}

		// Import the MapShineLifecycle class and begin the discovery process
		// We need to dynamically import since this is a separate file
		const { MapShineLifecycle } = await import("../module.js");
		await MapShineLifecycle.beginPersistentDiscovery(canvas);
	}
}

// Export the class for use in other modules
export { SceneChangeManager };
