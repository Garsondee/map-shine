/**
 * @fileoverview LoadingUI - Reusable loading screen component for Map Shine
 * 
 * This class provides a unified implementation of the loading screen UI that can be
 * used by both the initial world load (LoadingScreen) and scene transitions (SceneChangeManager).
 * 
 * It handles:
 * - HTML and CSS generation
 * - Progress bar management
 * - Status text updates
 * - Hint cycling with Fisher-Yates shuffle
 * - Fade animations
 * - Background image selection (random/static)
 * - Font loading and CSS variable injection
 * 
 * @author Mythica Machina - Ingram Blakelock
 */

import { MODULE_ID } from "../config/constants.js";
import { FontLoader } from "../managers/FontManager.js";

/**
 * Unified loading screen UI component
 * Provides reusable HTML/CSS generation and state management for loading overlays
 */
export class LoadingUI {
  /**
   * Creates a new LoadingUI instance
   * @param {Object} options - Configuration options
   * @param {string} options.elementId - The DOM element ID for the overlay
   * @param {string} options.title - The title text to display
   * @param {number} [options.fadeOutDuration=1500] - Duration of fade out animation in ms
   * @param {Object} [options.defaults] - Default values for settings (used when settings unavailable)
   */
  constructor(options) {
    this.elementId = options.elementId;
    this.title = options.title;
    this.fadeOutDuration = options.fadeOutDuration || 1500;
    this.defaults = options.defaults || {};
    
    // DOM references
    this.element = null;
    this.fillElement = null;
    this.statusTextElement = null;
    this.hintElement = null;
    
    // Hint cycling state
    this._hintInterval = null;
    this._shuffledHints = [];
    this._currentHintIndex = 0;
    this._hintAnimation = null;
  }

  /**
   * Creates and returns the loading overlay element
   * @returns {HTMLElement} The created overlay element
   */
  createElement() {
    if (this.element) {
      console.warn(`[LoadingUI] Element already exists for ${this.elementId}`);
      return this.element;
    }

    // Get font settings
    const getFont = (style) => {
      try {
        return game.settings.get(
          MODULE_ID,
          `universal.fontManager.styles.${style}.fontFamily`
        );
      } catch (error) {
        console.warn(
          `[LoadingUI] Could not get font for ${style}, using fallback:`,
          error
        );
        return "Signika";
      }
    };

    const headingFont = getFont("heading1");
    const subheadingFont = getFont("heading2");
    const hintFont = getFont("hint");

    // Load fonts using FontLoader from FontManager
    try {
      FontLoader.load([headingFont, subheadingFont, hintFont].filter(Boolean));
    } catch (error) {
      console.warn("[LoadingUI] Failed to load fonts:", error);
    }

    // Create element
    this.element = document.createElement("div");
    this.element.id = this.elementId;
    this.element.style.opacity = "0";

    // Set CSS variables
    try {
      if (headingFont)
        this.element.style.setProperty(
          "--ms-heading-font",
          `"${headingFont}", sans-serif`
        );
      if (subheadingFont)
        this.element.style.setProperty(
          "--ms-subheading-font",
          `"${subheadingFont}", sans-serif`
        );
      if (hintFont)
        this.element.style.setProperty("--ms-hint-font", `"${hintFont}", serif`);
      if (this.fadeOutDuration)
        this.element.style.setProperty(
          "--ms-fade-duration",
          `${this.fadeOutDuration / 1000}s`
        );
    } catch (e) {
      console.warn("[LoadingUI] Failed to set CSS variables", e);
    }

    // Get background settings
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

    // Select background image
    let bgPath = "";
    if (useRandom && randomBgs.length > 0) {
      bgPath = randomBgs[Math.floor(Math.random() * randomBgs.length)];
    } else if (staticBg) {
      bgPath = staticBg;
    }

    if (bgPath) {
      this.element.style.backgroundImage = `url('${bgPath}')`;
      this.element.style.backgroundSize = "cover";
      this.element.style.backgroundPosition = "center center";
    }

    // Get subheading (priority: defaults > sceneTransition setting > loading-screen setting)
    const subheading = this.defaults.subheading ||
      game.settings.get(MODULE_ID, "universal.sceneTransition.subheading") ||
      game.settings.get(MODULE_ID, "loading-screen-subheading") ||
      "";

    // Calculate gradient opacity
    const maxOpacity = overlayOpacity;
    const minOpacity = maxOpacity * 0.4;
    const backgroundStyle =
      overlayEnabled && bgPath
        ? `display: block; background: linear-gradient(to bottom, rgba(0,0,0,${maxOpacity}) 0%, rgba(0,0,0,${minOpacity}) 35%, rgba(0,0,0,${minOpacity}) 65%, rgba(0,0,0,${maxOpacity}) 100%);`
        : "display: none;";

    // Generate inline CSS
    const inlineCSS = this._generateCSS(
      headingFont,
      subheadingFont,
      hintFont,
      this.fadeOutDuration
    );

    // Get logo path from settings (explicitly check for empty string)
    const logoPathSetting = game.settings.get(MODULE_ID, "universal.sceneTransition.logoPath");
    const logoPath = (logoPathSetting && logoPathSetting.trim() !== "") 
      ? logoPathSetting 
      : "modules/map-shine/assets/fvtt.png";

    // Generate HTML
    this.element.innerHTML = `
      ${inlineCSS}
      <div class="loading-background-overlay"></div>
      <div class="loading-content">
        <img src="${logoPath}" class="loading-logo slide-from-above" alt="Logo">
        <h2 class="loading-subhead slide-from-above">${subheading}</h2>
        <h1 class="loading-title slide-from-above">${this.title}</h1>
        <div class="loading-bar-container slide-from-below">
          <div class="loading-bar-fill"></div>
        </div>
        <div id="loading-status-text" class="loading-status slide-from-below">Initializing...</div>
        <p id="loading-hint-text" class="loading-hint slide-from-below"></p>
      </div>
    `;

    // Apply background overlay style
    try {
      const bgEl = this.element.querySelector(".loading-background-overlay");
      if (bgEl && backgroundStyle) bgEl.setAttribute("style", backgroundStyle);
    } catch (e) {
      console.warn("[LoadingUI] Failed to apply background style", e);
    }

    // Cache DOM references
    this.fillElement = this.element.querySelector(".loading-bar-fill");
    this.statusTextElement = this.element.querySelector("#loading-status-text");
    this.hintElement = this.element.querySelector("#loading-hint-text");

    return this.element;
  }

  /**
   * Generates the inline CSS for the loading screen
   * @private
   */
  _generateCSS(headingFont, subheadingFont, hintFont, fadeOutDuration) {
    return `
      <style>
      #${this.elementId} {
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
        z-index: 100000; display: flex; justify-content: center; align-items: center;
        color: #f8fafc; font-family: ${JSON.stringify(
          subheadingFont || "Inter, system-ui, sans-serif"
        )};
        transition: opacity ${
          fadeOutDuration / 1000
        }s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
      }
      #${this.elementId}::before {
        content: '';
        position: absolute; inset: 0;
        background:
          radial-gradient(circle at 30% 20%, rgba(59,130,246,0.3) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(16,185,129,0.1) 0%, transparent 50%);
        pointer-events: none;
      }
      #${this.elementId} .loading-background-overlay {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; display: none;
      }
      #${this.elementId} .loading-content {
        text-align: center; position: relative; z-index: 2; background: transparent;
        padding: 4rem 5rem; width: 80vw; max-width: 80vw; aspect-ratio: 16 / 9;
        display: flex; flex-direction: column; justify-content: center;
        filter: drop-shadow(0 0 40px rgba(0,0,0,0.9)) drop-shadow(0 0 80px rgba(0,0,0,0.8)) drop-shadow(0 0 120px rgba(0,0,0,0.6));
      }
      #${this.elementId} .loading-logo { 
        width: 160px; height: auto; margin: 0 auto 1.25rem auto; display: block; 
        filter: drop-shadow(0 0 30px rgba(59,130,246,0.3)); transition: transform 0.3s ease; 
      }
      #${this.elementId} .loading-subhead { 
        font-family: ${JSON.stringify(
          subheadingFont || "Inter, system-ui, sans-serif"
        )}; 
        font-size: 1.5rem; font-weight: 400; color: #cbd5e1; margin: 0 0 0.75rem 0; 
        text-shadow: 0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.7); 
        letter-spacing: 0.025em; 
      }
      #${this.elementId} .loading-title {
        font-family: ${JSON.stringify(
          headingFont || "Inter, system-ui, sans-serif"
        )};
        font-size: 4.5rem; font-weight: 700; margin: 0 0 2rem 0;
        background: linear-gradient(135deg, #f8fafc 0%, #3b82f6 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        filter: drop-shadow(0 0 30px rgba(0,0,0,0.9)) drop-shadow(0 0 60px rgba(0,0,0,0.7)); 
        letter-spacing: -0.025em; line-height: 1.1;
      }
      #${this.elementId} .loading-bar-container { 
        width: 60%; max-width: 550px; height: 0.75rem; margin: 0 auto; 
        background: rgba(15,23,42,0.8); border-radius: 9999px; overflow: hidden; 
        position: relative; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); 
      }
      #${this.elementId} .loading-bar-fill { 
        width: 0%; height: 100%; background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%); 
        transform-origin: left; transition: width 0.4s cubic-bezier(0.4,0,0.2,1); 
        box-shadow: 0 0 20px rgba(59,130,246,0.3); border-radius: 9999px; position: relative; 
      }
      #${this.elementId} .loading-bar-fill::after { 
        content: ''; position: absolute; inset: 0; 
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%); 
        border-radius: inherit; 
      }
      #${this.elementId} .loading-status { 
        margin-top: 1.5rem; font-size: 1rem; color: #cbd5e1; height: 1.25rem; line-height: 1.25rem; 
        opacity: 1; transition: opacity 0.3s cubic-bezier(0.4,0,0.2,1); 
        text-shadow: 0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.7); 
        font-weight: 500; letter-spacing: 0.025em; 
      }
      #${this.elementId} .loading-hint { 
        font-family: ${JSON.stringify(hintFont || "serif")}; 
        margin-top: 2rem; font-size: 1rem; color: #94a3b8; font-style: italic; 
        max-width: 55ch; margin-left: auto; margin-right: auto; min-height: 3rem; opacity: 0; 
        text-shadow: 0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.7); 
        line-height: 1.6; font-weight: 400; 
      }
      /* Slide animations and delays */
      #${this.elementId} .slide-from-above { 
        transform: translateY(-3rem); opacity: 0; 
        animation: slideInFromAbove-${this.elementId} 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; 
      }
      #${this.elementId} .slide-from-below { 
        transform: translateY(3rem); opacity: 0; 
        animation: slideInFromBelow-${this.elementId} 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; 
      }
      #${this.elementId} .loading-logo { animation-delay: 0.1s; }
      #${this.elementId} .loading-subhead { animation-delay: 0.2s; }
      #${this.elementId} .loading-title { animation-delay: 0.35s; }
      #${this.elementId} .loading-bar-container { animation-delay: 0.5s; }
      #${this.elementId} .loading-status { animation-delay: 0.65s; }
      #${this.elementId} .loading-hint { animation-delay: 0.8s; }
      @keyframes slideInFromAbove-${this.elementId} { 
        to { transform: translateY(0); opacity: 1; } 
      }
      @keyframes slideInFromBelow-${this.elementId} { 
        to { transform: translateY(0); opacity: 1; } 
      }
      @media (max-width: 768px) {
        #${this.elementId} .loading-content { padding: 2.5rem 2rem; margin: 1rem; }
        #${this.elementId} .loading-title { font-size: 3rem; }
        #${this.elementId} .loading-logo { width: 120px; }
        #${this.elementId} .loading-bar-container { width: 300px; }
      }
      </style>
    `;
  }

  /**
   * Appends the element to the DOM and starts hint cycling
   * @param {HTMLElement} [parent=document.body] - Parent element to append to
   */
  show(parent = document.body) {
    if (!this.element) {
      this.createElement();
    }

    parent.appendChild(this.element);

    // Force a reflow to ensure animations start properly
    void this.element.offsetHeight;

    // Start hint cycling
    this.startHintCycle();
  }

  /**
   * Sets the title text
   * @param {string} title - The new title text
   */
  setTitle(title) {
    this.title = title;
    if (this.element) {
      const titleElement = this.element.querySelector(".loading-title");
      if (titleElement) {
        titleElement.textContent = title;
      }
    }
  }

  /**
   * Updates the progress bar and status message with smooth animation
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} [message] - Optional status message
   * @param {Object} [options] - Animation options
   * @param {number} [options.duration=300] - Animation duration in milliseconds
   * @param {string} [options.easing='cubic-bezier(0.4, 0, 0.2, 1)'] - CSS easing function
   */
  setProgress(progress, message, options = {}) {
    if (!this.fillElement) {
      console.warn("[LoadingUI] setProgress called but fillElement is null!", {
        hasElement: !!this.element,
        progress,
        message
      });
      return;
    }
    
    const p = Math.min(100, Math.max(0, progress));
    const duration = options.duration ?? 300;
    const easing = options.easing ?? 'cubic-bezier(0.4, 0, 0.2, 1)';
    
    console.log(`[LoadingUI] setProgress: ${p}% - ${message || '(no message)'}`);
    
    // Apply smooth transition for progress bar animation
    this.fillElement.style.transition = `width ${duration}ms ${easing}`;
    this.fillElement.style.width = `${p}%`;

    // Animate status message change with fade effect
    if (message && this.statusTextElement && this.statusTextElement.innerText !== message) {
      this.statusTextElement.style.opacity = "0";
      setTimeout(() => {
        if (this.statusTextElement) {
          this.statusTextElement.innerText = message;
          this.statusTextElement.style.opacity = "1";
        }
      }, 200);
    }
  }

  /**
   * Sets the status message without changing progress
   * @param {string} message - Status message
   */
  setStatus(message) {
    if (this.statusTextElement) {
      this.statusTextElement.innerText = message;
      if (this.statusTextElement.style.opacity !== "1") {
        this.statusTextElement.style.opacity = "1";
      }
    }
  }

  /**
   * Starts the hint cycling animation
   */
  startHintCycle() {
    if (!this.element || !this.hintElement) {
      console.warn("[LoadingUI] Cannot start hint cycle - missing elements");
      return;
    }

    const rawHints = game.settings.get(
      MODULE_ID,
      "universal.sceneTransition.randomHints"
    );

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
    if (config.randomHints.length === 0 && this.defaults.randomHints) {
      config.randomHints = this.defaults.randomHints;
    }

    if (!config.useRandomHint || config.randomHints.length === 0) {
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

    // If only one hint, just show it
    if (this._shuffledHints.length <= 1) {
      if (this._shuffledHints.length === 1) {
        this.hintElement.innerText = this._shuffledHints[0];
        this.hintElement.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 1000,
          fill: "forwards",
        });
      }
      return;
    }

    const HINT_FADE_DURATION = 1000;
    const HINT_PAUSE_DURATION = 5000;

    const showNextHint = () => {
      if (!this.element || !this.hintElement || this._hintInterval === null) {
        this.stopHintCycle();
        return;
      }

      this._hintAnimation = this.hintElement.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        {
          duration: HINT_FADE_DURATION,
          easing: "ease-in",
        }
      );

      this._hintAnimation.finished
        .then(() => {
          if (!this.element) return;
          this._currentHintIndex =
            (this._currentHintIndex + 1) % this._shuffledHints.length;
          this.hintElement.innerText = this._shuffledHints[this._currentHintIndex];

          this.hintElement.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: HINT_FADE_DURATION,
            easing: "ease-out",
            fill: "forwards",
          });

          this._hintInterval = setTimeout(showNextHint, HINT_PAUSE_DURATION);
        })
        .catch(() => {});
    };

    // Show first hint
    this.hintElement.innerText = this._shuffledHints[this._currentHintIndex];
    const initialAnimation = this.hintElement.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 1000, fill: "forwards" }
    );
    initialAnimation.finished.then(() => {
      if (!this.element) return;
      this._hintInterval = setTimeout(showNextHint, HINT_PAUSE_DURATION);
    });
  }

  /**
   * Stops the hint cycling animation
   */
  stopHintCycle() {
    if (this._hintInterval) {
      clearTimeout(this._hintInterval);
      this._hintInterval = null;
    }

    if (this._hintAnimation) {
      this._hintAnimation.cancel?.();
      this._hintAnimation = null;
    }
  }

  /**
   * Fades in the overlay (shows it)
   * @param {number} [duration] - Optional override for fade duration
   * @returns {Promise<void>}
   */
  async fadeIn(duration) {
    if (!this.element) return;

    this.element.style.opacity = "0";
    this.element.style.pointerEvents = "auto";

    // Force reflow
    void this.element.offsetHeight;

    this.element.style.opacity = "1";

    const fadeDuration = duration || this.fadeOutDuration;
    await new Promise((resolve) => setTimeout(resolve, fadeDuration));
  }

  /**
   * Fades out the overlay (hides it)
   * @param {number} [duration] - Optional override for fade duration
   * @returns {Promise<void>}
   */
  async fadeOut(duration) {
    if (!this.element) return;

    this.element.style.opacity = "0";
    this.element.style.pointerEvents = "none";

    const fadeDuration = duration || this.fadeOutDuration;
    await new Promise((resolve) => setTimeout(resolve, fadeDuration));
  }

  /**
   * Removes the element from the DOM and cleans up
   */
  destroy() {
    this.stopHintCycle();
    
    if (this.element) {
      this.element.remove();
      this.element = null;
    }

    this.fillElement = null;
    this.statusTextElement = null;
    this.hintElement = null;
  }
}
