import { MODULE_ID } from "../config/constants.js";
import { ScreenEffectsManager } from "./ScreenEffectsManager.js";
import { ColorCorrectionFilter } from "../postfx/filters-adapter.js";
import { NativeAnimation } from "../utils/NativeAnimation.js";
import { UNIVERSAL_EFFECT_DEFAULTS } from "../config/universal-defaults-adapter.js";
import { FontLoader } from "../utils/FontLoader.js";

/**
 * A unified manager for handling all pause-related effects, including the canvas
 * filter and the HTML overlay. This system is designed to be robust and avoid
 * conflicts with other modules by using libWrapper and an isolated DOM element.
 */
class PauseManager {
  static _isInitialized = false;
  static _animation = null;
  static _animationState = { progress: 0 };
  static _pauseFilter = null;
  static _overlayElement = null;
  static _originalTimeFactor = 1.0;

  /**
   * The single entry point to initialize the pause system.
   * It registers the libWrapper hook. This should be called once.
   */
  static initialize() {
    if (this._isInitialized) return;

    // The new system requires libWrapper. If it's not active, do not proceed.
    if (!game.modules.get("lib-wrapper")?.active) {
      console.warn(
        "Map Shine | libWrapper is not active. The custom pause effect will be disabled."
      );
      return;
    }

    libWrapper.register(
      MODULE_ID,
      "Game.prototype.togglePause",
      this._onTogglePause,
      "WRAPPER"
    );

    // On first load, if the game is already paused, apply the effects immediately without animation.
    Hooks.once("canvasReady", () => {
      if (game.paused) {
        // Check settings before applying on ready
        const pauseScreenEnabled = game.settings.get(
          MODULE_ID,
          "enable-pause-screen"
        );
        const pauseEffectEnabled = game.settings.get(
          MODULE_ID,
          "universal.pauseEffect.enabled"
        );
        if (pauseScreenEnabled && pauseEffectEnabled) {
          this._animationState.progress = 1;
          this._updateEffects(1);
          this._applyCustomPauseScreen();
        }
      }
    });

    this._isInitialized = true;
    console.log("Map Shine | Unified Pause Manager Initialized.");
  }

  /**
   * The libWrapper function for Game.prototype.togglePause.
   * @param {Function} wrapped The original function.
   * @param {boolean} pause The desired pause state.
   * @param {boolean} push A flag to push the pause state to other clients.
   */
  static _onTogglePause(wrapped, pause, push) {
    const wasPaused = game.paused;
    const isChanging = wasPaused !== pause;

    if (isChanging) {
      PauseManager._triggerStateChange(pause); // ✅ Use class name directly
    }

    // Call the original togglePause function to maintain core functionality
    // and allow other modules' wrappers/hooks to run.
    return wrapped(pause, push);
  }

  /**
   * Triggers the animations and DOM changes for a pause state change.
   * @param {boolean} isPausing The new pause state.
   * @private
   */
  static _triggerStateChange(isPausing) {
    const pauseScreenEnabled = game.settings.get(
      MODULE_ID,
      "enable-pause-screen"
    );
    const pauseEffectEnabled = game.settings.get(
      MODULE_ID,
      "universal.pauseEffect.enabled"
    );

    if (!pauseScreenEnabled || !pauseEffectEnabled) {
      this._updateEffects(0);
      this._revertCustomPauseScreen();
      return;
    }

    if (isPausing) {
      this._applyCustomPauseScreen();
    } else {
      this._revertCustomPauseScreen();
    }

    if (this._animation) {
      this._animation.kill();
    }

    if (!this._pauseFilter) {
      this._pauseFilter = ScreenEffectsManager.getFilter("pauseEffect");
      if (!this._pauseFilter) {
        console.warn(
          "Map Shine | PauseManager could not find its dedicated filter. Creating on-demand."
        );
        // Fallback: Create the filter on-demand
        try {
          this._pauseFilter = new ColorCorrectionFilter();
          this._pauseFilter.enabled = false;
          ScreenEffectsManager.addFilter("pauseEffect", this._pauseFilter);
          console.log("Map Shine | PauseEffect filter created successfully as fallback.");
        } catch (e) {
          console.error(
            "Map Shine | PauseManager failed to create fallback filter.",
            e
          );
          return;
        }
      }
    }

    if (isPausing && this._animationState.progress < 1) {
      this._originalTimeFactor = game.mapShine.timeControl.timeFactor;
    }

    const duration = game.settings.get(
      MODULE_ID,
      "universal.pauseEffect.duration"
    );
    const targetProgress = isPausing ? 1 : 0;

    this._animation = NativeAnimation.to(this._animationState, {
      progress: targetProgress,
      duration: duration / 1000,
      ease: "power2.inOut",
      onUpdate: () => this._updateEffects(this._animationState.progress),
      onComplete: () => {
        this._animation = null;
        this._updateEffects(targetProgress);
        // If unpausing is complete, restore the original time factor.
        if (!isPausing) {
          game.mapShine.timeControl.timeFactor = this._originalTimeFactor;
        }
      },
    });
  }

  /**
   * Linearly interpolates between two numbers.
   * @param {number} start The start value.
   * @param {number} end The end value.
   * @param {number} amount The interpolation factor (0 to 1).
   * @returns {number} The interpolated value.
   * @private
   */
  static _lerp(start, end, amount) {
    return (1 - amount) * start + amount * end;
  }

  /**
   * Updates the canvas filter and time factor based on the animation progress.
   * @param {number} progress The animation progress (0 to 1).
   * @private
   */
  static _updateEffects(progress) {
    if (!this._pauseFilter) return;

    const peConfig = {
      colorCorrection: {
        ...UNIVERSAL_EFFECT_DEFAULTS.pauseEffect.colorCorrection,
        enabled: game.settings.get(
          MODULE_ID,
          "universal.pauseEffect.colorCorrection.enabled"
        ),
        saturation: game.settings.get(
          MODULE_ID,
          "universal.pauseEffect.colorCorrection.saturation"
        ),
        brightness: game.settings.get(
          MODULE_ID,
          "universal.pauseEffect.colorCorrection.brightness"
        ),
        contrast: game.settings.get(
          MODULE_ID,
          "universal.pauseEffect.colorCorrection.contrast"
        ),
      },
    };

    // Directly control the global time factor for animations without altering saved config.
    game.mapShine.timeControl.timeFactor = this._lerp(
      this._originalTimeFactor,
      0.0,
      progress
    );

    // Update the debugger UI if it's open
    if (game.mapShine.debugger) {
      const timeValue = game.mapShine.timeControl.timeFactor * 100;
      const slider = game.mapShine.debugger.element.querySelector(
        "#control-timeControl-globalTime"
      );
      if (slider) {
        slider.value = timeValue;
        game.mapShine.debugger.eventHandler._updateSliderValue(
          slider.id,
          timeValue,
          slider.step
        );
      }
    }

    const u = this._pauseFilter.uniforms;
    const cc = peConfig.colorCorrection;
    this._pauseFilter.enabled = progress > 0.001 && cc.enabled;
    u.uIntensity = progress;
    u.uSaturation = cc.saturation;
    u.uBrightness = cc.brightness;
    u.uContrast = cc.contrast;
  }

  /**
   * Creates and displays the custom HTML pause overlay.
   * @private
   */
  static _applyCustomPauseScreen() {
    if (document.getElementById("map-shine-pause-overlay")) return;

    const settings = this._getPauseScreenSettings();
    FontLoader.load([
      settings.headingFont,
      settings.subheadingFont,
      settings.hintFont,
    ]);

    this._overlayElement = document.createElement("div");
    this._overlayElement.id = "map-shine-pause-overlay";

    let hintHTML = "";
    if (settings.useRandomHint && settings.randomHints.length > 0) {
      const hint =
        settings.randomHints[
          Math.floor(Math.random() * settings.randomHints.length)
        ];
      hintHTML = `<p class="map-shine-pause-hint">${hint}</p>`;
    }

    const logoHTML = settings.logoPath
      ? `<div class="map-shine-pause-logo"></div>`
      : "";

    this._overlayElement.innerHTML = `
            <style>
                #map-shine-pause-overlay {
                    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                    z-index: 10000;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.5s ease-in-out;
                    background: ${settings.backgroundColor};
                    backdrop-filter: blur(12px) saturate(0.8);
                    -webkit-backdrop-filter: blur(12px) saturate(0.8);
                    display: flex; justify-content: center; align-items: center;
                }
                #map-shine-pause-overlay.visible { opacity: 1; }
                .map-shine-pause-wrapper {
                    position: relative; padding: 3.5rem 4rem;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(59, 130, 246, 0.15);
                    border-radius: 1.5rem;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 1.25rem; animation: fadeInContent 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    text-align: center; max-width: 85vw; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
                    box-shadow: 0 0 60px rgba(0,0,0,0.6), 0 0 120px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
                }
                .map-shine-pause-title {
                    font-family: "${settings.headingFont}", sans-serif;
                    font-size: 4.5rem; font-weight: 700; margin: 0; letter-spacing: -0.025em; text-transform: uppercase;
                    background: linear-gradient(135deg, ${
                      settings.headingColor
                    } 0%, #3b82f6 100%);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                    filter: drop-shadow(0 0 30px rgba(0,0,0,0.9)) drop-shadow(0 0 60px rgba(0,0,0,0.7));
                    line-height: 1.1;
                }
                .map-shine-pause-subtitle {
                    font-family: "${settings.subheadingFont}", sans-serif;
                    font-size: 1.5rem; font-weight: 400; margin: 0; color: ${
                      settings.subheadingColor
                    };
                    font-style: italic; letter-spacing: 0.025em;
                    text-shadow: 0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.7);
                }
                .map-shine-pause-logo {
                    width: 100px; height: 100px; background-image: url('${
                      settings.logoPath
                    }');
                    background-size: contain; background-repeat: no-repeat; background-position: center;
                    margin: 0.5rem auto; opacity: ${settings.logoOpacity};
                    animation: pulseLogo 4s ease-in-out infinite;
                    filter: drop-shadow(0 0 30px rgba(59,130,246,0.3));
                }
                .map-shine-pause-hint {
                    font-family: "${settings.hintFont}", serif;
                    margin-top: 1.5rem; padding-top: 1.5rem;
                    border-top: 1px solid rgba(59, 130, 246, 0.2);
                    font-size: 1rem; font-style: italic; color: ${
                      settings.hintColor
                    }; max-width: 50ch;
                    margin-left: auto; margin-right: auto; letter-spacing: 0.025em;
                    text-shadow: 0 0 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7);
                }
                @keyframes fadeInContent { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes fadeOutContent { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-20px) scale(0.98); } }
                @keyframes pulseLogo { 0%, 100% { transform: scale(1); opacity: ${
                  settings.logoOpacity
                }; } 50% { transform: scale(1.08); opacity: ${Math.min(
      1,
      settings.logoOpacity + 0.2
    )}; } }
            </style>
            <div class="map-shine-pause-wrapper">
                <h1 class="map-shine-pause-title">${settings.heading}</h1>
                <p class="map-shine-pause-subtitle">${settings.subheading}</p>
                ${logoHTML}
                ${hintHTML}
            </div>
        `;

    document.body.appendChild(this._overlayElement);

    requestAnimationFrame(() => {
      if (this._overlayElement) {
        this._overlayElement.classList.add("visible");
      }
    });
  }

  /**
   * Hides and removes the custom HTML pause overlay.
   * @private
   */
  static _revertCustomPauseScreen() {
    if (!this._overlayElement) return;

    const wrapper = this._overlayElement.querySelector(
      ".map-shine-pause-wrapper"
    );
    if (wrapper) {
      wrapper.style.animation =
        "fadeOutContent 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards";
    }

    this._overlayElement.classList.remove("visible");

    setTimeout(() => {
      if (this._overlayElement) {
        this._overlayElement.remove();
        this._overlayElement = null;
      }
    }, 800);
  }

  /**
   * Retrieves all settings for the pause screen overlay.
   * @private
   */
  static _getPauseScreenSettings() {
    const getSetting = (key) =>
      game.settings.get(MODULE_ID, `universal.pauseEffect.${key}`);
    const getFont = (style) =>
      game.settings.get(
        MODULE_ID,
        `universal.fontManager.styles.${style}.fontFamily`
      );
    return {
      heading: getSetting("heading"),
      subheading: getSetting("subheading"),
      logoPath: getSetting("logoPath"),
      logoOpacity: getSetting("logoOpacity"),
      backgroundColor: getSetting("backgroundColor"),
      headingColor: getSetting("headingColor"),
      subheadingColor: getSetting("subheadingColor"),
      hintColor: getSetting("hintColor"),
      useRandomHint: getSetting("useRandomHint"),
      randomHints: (getSetting("randomHints") || "")
        .split(/\r?\n/)
        .filter((h) => h.trim() !== ""),
      headingFont: getFont("heading1"),
      subheadingFont: getFont("heading2"),
      hintFont: getFont("hint"),
    };
  }
}

export { PauseManager };
