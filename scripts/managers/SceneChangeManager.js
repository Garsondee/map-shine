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

// Import ScreenEffectsManager for teardown operations
import { ScreenEffectsManager } from "../module.js";

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

		// Add error handling for font settings
		const getFont = (style) => {
			try {
				return game.settings.get(
					MODULE_ID,
					`universal.fontManager.styles.${style}.fontFamily`
				);
			} catch (error) {
				console.warn(`[MapShine Transition] Could not get font for ${style}, using fallback:`, error);
				return "Signika"; // Fallback font
			}
		};

		const headingFont = getFont("heading1");
		const subheadingFont = getFont("heading2");
		// @ts-ignore
		const bodyFont = getFont("body");
		const hintFont = getFont("hint");

		console.log(`[MapShine Transition] Creating overlay element.`);
		this.transitionOverlay = document.createElement("div");
		this.transitionOverlay.id = "map-shine-scene-transition";
		this.transitionOverlay.style.opacity = "0";

		// Background Image Logic (same as LoadingScreen)
		const useRandom = game.settings.get(
			MODULE_ID,
			"loading-screen-use-random-background"
		);
		const staticBg = game.settings.get(
			MODULE_ID,
			"loading-screen-static-background"
		);
		const randomBgs = (
			game.settings.get(MODULE_ID, "loading-screen-random-backgrounds") || ""
		)
			.split(/\r?\n/)
			.filter((l) => l.trim());
		const overlayEnabled = game.settings.get(
			MODULE_ID,
			"loading-screen-background-overlay-enabled"
		);
		const overlayOpacity = game.settings.get(
			MODULE_ID,
			"loading-screen-background-overlay-opacity"
		);

		let bgPath = "";
		if (useRandom && randomBgs.length > 0) {
			bgPath = randomBgs[Math.floor(Math.random() * randomBgs.length)];
		} else if (staticBg) {
			bgPath = staticBg;
		}

		if (bgPath) {
			this.transitionOverlay.style.backgroundImage = `url('${bgPath}')`;
			this.transitionOverlay.style.backgroundSize = "cover";
			this.transitionOverlay.style.backgroundPosition = "center center";
		}

		const subheading = game.settings.get(
			MODULE_ID,
			"loading-screen-subheading"
		);

		const maxOpacity = overlayOpacity;
		const minOpacity = maxOpacity * 0.4;
		const backgroundStyle =
			overlayEnabled && bgPath
				? `display: block; background: linear-gradient(to bottom, rgba(0,0,0,${maxOpacity}) 0%, rgba(0,0,0,${minOpacity}) 35%, rgba(0,0,0,${minOpacity}) 65%, rgba(0,0,0,${maxOpacity}) 100%);`
				: "display: none;";

		// Create the same HTML structure as LoadingScreen with animation classes
		this.transitionOverlay.innerHTML = `
			<div class="loading-background-overlay"></div>
			<div class="loading-content">
				<img src="modules/map-shine/assets/fvtt.png" class="loading-logo slide-from-above" alt="Foundry VTT Logo">
				<h2 class="loading-subhead slide-from-above">${subheading}</h2>
				<h1 class="loading-title slide-from-above">Loading Scene...</h1>
				<div class="loading-bar-container slide-from-below">
					<div class="loading-bar-fill"></div>
				</div>
				<div id="loading-status-text" class="loading-status slide-from-below">Preparing scene...</div>
				<p id="loading-hint-text" class="loading-hint slide-from-below"></p>
			</div>
			<style>
				#map-shine-scene-transition { 
					position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
					background-color: rgba(0, 0, 0, 1); 
					z-index: 999999; display: flex; 
					justify-content: center; align-items: center; 
					color: white; font-family: ${subheadingFont}, Lexend, sans-serif; 
					transition: opacity 1.5s ease-in-out; 
				}
				.loading-background-overlay {
					${backgroundStyle}
					position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
					z-index: 1; /* Behind content */
				}
				.loading-content { text-align: center; position: relative; z-index: 2; }
				.loading-logo { width: 150px; height: auto; margin: 0 auto 10px auto; display: block; filter: drop-shadow(0 0 10px rgba(0,0,0,0.6)); }
				.loading-subhead { font-family: "${subheadingFont}", sans-serif; font-size: 24px; font-weight: normal; color: #bbb; margin: 0 0 10px 0; text-shadow: 0 2px 5px rgba(0,0,0,0.7); }
				.loading-title { font-family: "${headingFont}", sans-serif; font-size: 72px; margin: 0 0 30px 0; text-shadow: 0 2px 5px rgba(0,0,0,0.7); color: #fff; }
				.loading-bar-container { width: 400px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.5); margin: 0 auto; background-color: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; }
				.loading-bar-fill { width: 0%; height: 100%; background-color: rgba(255, 255, 255, 0.9); transform-origin: left; transition: width 0.2s ease-out; box-shadow: 0 0 10px rgba(255, 255, 255, 0.5); }
				.loading-status { margin-top: 15px; font-size: 16px; color: #ddd; height: 20px; line-height: 20px; opacity: 1; transition: opacity 0.2s ease-in-out; text-shadow: 0 2px 5px rgba(0,0,0,0.7); }
				.loading-hint {
					font-family: "${hintFont}", sans-serif;
					margin-top: 25px;
					font-size: 16px;
					color: #aaa;
					font-style: italic;
					max-width: 50ch;
					margin-left: auto;
					margin-right: auto;
					min-height: 3em; /* Reserve space to prevent layout shifts */
					opacity: 0; /* Initially hidden */
					text-shadow: 0 2px 5px rgba(0,0,0,0.7);
				}
				
				/* Slide-in animations */
				.slide-from-above {
					transform: translateY(-50px);
					opacity: 0;
					animation: slideInFromAbove 0.8s ease-out forwards;
				}
				
				.slide-from-below {
					transform: translateY(50px);
					opacity: 0;
					animation: slideInFromBelow 0.8s ease-out forwards;
				}
				
				@keyframes slideInFromAbove {
					0% {
						transform: translateY(-50px);
						opacity: 0;
					}
					100% {
						transform: translateY(0);
						opacity: 1;
					}
				}
				
				@keyframes slideInFromBelow {
					0% {
						transform: translateY(50px);
						opacity: 0;
					}
					100% {
						transform: translateY(0);
						opacity: 1;
					}
				}
				
				/* Staggered animation delays */
				.loading-logo { animation-delay: 0.1s; }
				.loading-subhead { animation-delay: 0.2s; }
				.loading-title { animation-delay: 0.3s; }
				.loading-bar-container { animation-delay: 0.4s; }
				.loading-status { animation-delay: 0.5s; }
				.loading-hint { animation-delay: 0.6s; }
			</style>
		`;

		document.body.appendChild(this.transitionOverlay);
		console.log(`[MapShine Transition] Overlay appended to DOM successfully`);

		// Start hint cycling (same as LoadingScreen)
		this._cycleHints();
	}

	/**
	 * Manages the hint cycling animation (adapted from LoadingScreen).
	 * @private
	 */
	_cycleHints() {
		console.log("[MapShine SceneChangeManager] _cycleHints called");
		if (!this.transitionOverlay) {
			console.warn("[MapShine SceneChangeManager] No transition overlay found, cannot cycle hints");
			return;
		}

		const hintElement = this.transitionOverlay.querySelector(".loading-hint");
		console.log("[MapShine SceneChangeManager] Hint element found:", hintElement);
		
		const rawHints = game.settings.get(MODULE_ID, "universal.sceneTransition.randomHints");
		console.log("[MapShine SceneChangeManager] Raw hints from settings:", rawHints);
		
		const config = {
			useRandomHint: game.settings.get(
				MODULE_ID,
				"universal.sceneTransition.useRandomHint"
			),
			randomHints: (rawHints || "")
				.split(/\r?\n/)
				.filter((h) => h.trim() !== ""),
		};
		
		// If no hints are configured, fall back to defaults
		if (config.randomHints.length === 0) {
			console.log("[MapShine SceneChangeManager] No hints found in settings, using defaults");
			// Use hardcoded defaults since we can't import in a non-async function
			config.randomHints = [
				"Press 'C' to quickly open your character sheet.",
				"Hold the Shift key while using the arrow keys to rotate tokens.",
				"You can assign a keyboard shortcut to toggle a token's visibility, saving you right-clicks.",
				"To manage a group of player characters more easily, place them all in a \"Party\" folder and drag the folder onto the canvas to create a single party token.",
				"Double-click the right mouse button to quickly end a measurement template.",
				"You can lock the position of tokens and tiles to prevent them from being accidentally moved.",
				"Use the search bar in the sidebars to quickly find actors, items, and journal entries.",
				"The 'Tab' key can be used to target the next token on the canvas.",
				"Remember that many actions have consequences in the game world.",
				"Running away is a valid and often wise alternative to a character's death.",
				"You can pop out character sheets and journal entries into their own windows.",
				"The \"Ping\" tool (left-click and hold) can be used to draw your players' attention to a specific location.",
				"Don't forget that your action can be used for more than just attacking; consider options like Dash, Dodge, and Help.",
				"If you're unsure about a rule, it's often best to make a quick ruling and look it up later to keep the game moving.",
				"Communication is key; keep your fellow players and the Game Master informed of your character's intentions."
			];
		}

		console.log("[MapShine SceneChangeManager] Hint config:", {
			useRandomHint: config.useRandomHint,
			hintCount: config.randomHints.length,
			firstHint: config.randomHints[0]
		});

		if (!hintElement || !config.useRandomHint || !config.randomHints.length) {
			console.warn("[MapShine SceneChangeManager] Hint cycling aborted:", {
				hintElement: !!hintElement,
				useRandomHint: config.useRandomHint,
				hintCount: config.randomHints.length
			});
			return;
		}

		// Fisher-Yates shuffle algorithm
		this._shuffledHints = [...config.randomHints];
		for (let i = this._shuffledHints.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this._shuffledHints[i], this._shuffledHints[j]] = [
				this._shuffledHints[j],
				this._shuffledHints[i],
			];
		}

		this._currentHintIndex = 0;

		if (this._shuffledHints.length <= 1) {
			if (this._shuffledHints.length === 1) {
				// @ts-ignore
				hintElement.innerText = this._shuffledHints[0];
				console.log("[MapShine SceneChangeManager] Single hint displayed:", this._shuffledHints[0]);
				hintElement.animate([{ opacity: 0 }, { opacity: 1 }], {
					duration: 1000,
					fill: "forwards",
				});
			}
			return;
		}

		const HINT_FADE_DURATION = 1000;
		const HINT_PAUSE_DURATION = 5000;

		const showNextHint = () => {
			if (!this.transitionOverlay || !hintElement || this._hintInterval === null) {
				this._stopHintCycle();
				return;
			}

			this._hintAnimation = hintElement.animate(
				[{ opacity: 1 }, { opacity: 0 }],
				{
					duration: HINT_FADE_DURATION,
					easing: "ease-in",
				}
			);

			this._hintAnimation.finished
				.then(() => {
					if (!this.transitionOverlay) return; // Guard against element being removed during animation
					this._currentHintIndex =
						(this._currentHintIndex + 1) % this._shuffledHints.length;
					// @ts-ignore
					hintElement.innerText = this._shuffledHints[this._currentHintIndex];

					hintElement.animate([{ opacity: 0 }, { opacity: 1 }], {
						duration: HINT_FADE_DURATION,
						easing: "ease-out",
						fill: "forwards",
					});

					this._hintInterval = setTimeout(showNextHint, HINT_PAUSE_DURATION);
				})
				.catch(() => { }); // Catch the expected cancellation error
		};

		// @ts-ignore
		hintElement.innerText = this._shuffledHints[this._currentHintIndex];
		console.log("[MapShine SceneChangeManager] First hint displayed:", this._shuffledHints[this._currentHintIndex]);
		const initialAnimation = hintElement.animate(
			[{ opacity: 0 }, { opacity: 1 }],
			{ duration: 1000, fill: "forwards" }
		);
		initialAnimation.finished.then(() => {
			if (!this.transitionOverlay) return;
			this._hintInterval = setTimeout(showNextHint, HINT_PAUSE_DURATION);
		});
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

	/**
	 * Fades out the transition overlay to black
	 * @param {Object} transitionConfig - Configuration for the transition
	 * @param {Object} scene - Scene object being transitioned to
	 */
	async fadeOut(transitionConfig, scene) {
		if (!this.transitionOverlay) {
			console.warn("Map Shine | SceneChangeManager: Cannot fade out - no overlay exists");
			return;
		}

		// Use navigation name if available, otherwise fall back to scene name
		const displayName = scene?.navName || scene?.name || "Unknown Scene";
		console.log(`[MapShine Transition] Fading out for scene: ${displayName} (navigation name: ${scene?.navName || 'not set'}, actual name: ${scene?.name})`);

		// Set the scene name in the overlay if it exists
		const titleElement = this.transitionOverlay.querySelector('.loading-title');
		if (titleElement) {
			titleElement.textContent = displayName;
		}

		// Start from completely black (opacity 0 means invisible overlay, showing scene)
		// We want to start with overlay visible (black screen)
		this.transitionOverlay.style.opacity = "0";
		this.transitionOverlay.style.pointerEvents = "auto";

		// Force a reflow to ensure the initial state is applied
		this.transitionOverlay.offsetHeight;

		// Now fade in the overlay (fade to black)
		this.transitionOverlay.style.opacity = "1";

		// Animate the loading bar
		const loadingBar = this.transitionOverlay.querySelector('.loading-bar-fill');
		if (loadingBar) {
			// @ts-ignore
			loadingBar.style.width = "30%"; // Show some initial progress
		}

		// Wait for the fade duration
		const fadeDuration = transitionConfig.fadeOutDuration || 1500;
		await new Promise(resolve => setTimeout(resolve, fadeDuration));
	}

	/**
	 * Fades in from the transition overlay back to the scene
	 * @param {Object} transitionConfig - Configuration for the transition
	 */
	async fadeIn(transitionConfig) {
		if (!this.transitionOverlay) {
			console.warn("Map Shine | SceneChangeManager: Cannot fade in - no overlay exists");
			return;
		}

		console.log(`[MapShine Transition] Fading in to reveal new scene`);

		// Complete the loading bar animation with smooth transition
		const loadingBar = this.transitionOverlay.querySelector('.loading-bar-fill');
		const statusText = this.transitionOverlay.querySelector('.loading-status');

		if (loadingBar) {
			// @ts-ignore
			loadingBar.style.transition = "width 0.5s ease-out";
			// @ts-ignore
			loadingBar.style.width = "100%"; // Complete the loading
		}
		if (statusText) {
			// @ts-ignore
			statusText.style.transition = "opacity 0.3s ease-in-out";
			statusText.textContent = "Scene ready!";
		}

		// Brief pause to show completion and let animations finish
		await new Promise(resolve => setTimeout(resolve, 800));

		// Fade out the overlay (fade in the scene from black)
		this.transitionOverlay.style.opacity = "0";
		this.transitionOverlay.style.pointerEvents = "none";

		// Wait for the fade duration
		const fadeDuration = transitionConfig.fadeInDuration || 1500;
		await new Promise(resolve => setTimeout(resolve, fadeDuration));
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
					console.log("Map Shine | Teardown: Destroying geometry mask manager...");
					game.mapShine.geometryMaskManager.destroy();
					game.mapShine.geometryMaskManager = null;
				} catch (error) {
					console.warn("Map Shine | Error destroying geometry mask manager:", error);
					game.mapShine.geometryMaskManager = null; // Still nullify to prevent further issues
				}
			}

			// 3. Clean up effect target manager
			if (game.mapShine.effectTargetManager) {
				try {
					console.log("Map Shine | Teardown: Cleaning effect target manager...");
					// Clear cached targets to force rediscovery
					game.mapShine.effectTargetManager.targets = null;
				} catch (error) {
					console.warn("Map Shine | Error cleaning effect target manager:", error);
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
					console.log("Map Shine | Teardown: Destroying dynamic exposure manager...");
					game.mapShine.dynamicExposureManager.destroy();
					game.mapShine.dynamicExposureManager = null;
				} catch (error) {
					console.warn("Map Shine | Error destroying dynamic exposure manager:", error);
					game.mapShine.dynamicExposureManager = null; // Still nullify to prevent further issues
				}
			}

			if (game.mapShine.pauseEffectManager) {
				try {
					console.log("Map Shine | Teardown: Destroying pause effect manager...");
					game.mapShine.pauseEffectManager.destroy();
				} catch (error) {
					console.warn("Map Shine | Error destroying pause effect manager:", error);
				}
			}

			if (game.mapShine.combatEffectManager) {
				try {
					console.log("Map Shine | Teardown: Destroying combat effect manager...");
					game.mapShine.combatEffectManager.destroy();
				} catch (error) {
					console.warn("Map Shine | Error destroying combat effect manager:", error);
				}
			}

			if (game.mapShine.fireWindManager) {
				try {
					console.log("Map Shine | Teardown: Destroying fire wind manager...");
					game.mapShine.fireWindManager.destroy();
					game.mapShine.fireWindManager = null;
				} catch (error) {
					console.warn("Map Shine | Error destroying fire wind manager:", error);
					game.mapShine.fireWindManager = null; // Still nullify to prevent further issues
				}
			}

			// 6. Clean up resource manager
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

			// 7. Reset system ready flag
			game.mapShine.systemsReady = false;

			console.log("Map Shine | SceneChangeManager: Teardown finished successfully.");
		} catch (error) {
			console.error("Map Shine | Error during teardown:", error);
		}
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
