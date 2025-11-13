import { MODULE_DEFAULTS } from "../config/MODULE_DEFAULTS.js";

export class MapShineClock {
  constructor(element, application = null, options = {}) {
    this.element = $(element);
    this.application = application;
    this.options = foundry.utils.mergeObject(
      {
        showDragHandle: true,
        showDisclaimer: true,
      },
      options
    );

    this.currentTime =
      game.mapShine?.profileManager?.activeConfig?.timeOfDay?.currentTime ??
      12.0;
    
    // Mode tracking: 'manual' or 'foundry'
    this.timeMode = 
      game.mapShine?.profileManager?.activeConfig?.timeOfDay?.syncFromFoundryTime
      ? 'foundry' : 'manual';
    
    this._isDragging = false;
    this._dragData = {};

    // Track last weather state to avoid unnecessary DOM updates
    this._lastWeatherState = null;
    this._lastWeatherTarget = null;
    this._lastWeatherProgress = -1;

    // Time transition state
    this.transitionActive = false;
    this.transitionStartTime = 0;
    this.transitionDuration = 3000; // Default 3 seconds
    this.transitionStartValue = 0;
    this.transitionTargetValue = 0;

    this._onExternalTimeChangeBound = this._onExternalTimeChange.bind(this);
    this._onFoundryTimeUpdateBound = this._onFoundryTimeUpdate.bind(this);

    Hooks.on("mapShine:timeChanged", this._onExternalTimeChangeBound);
    Hooks.on("updateWorldTime", this._onFoundryTimeUpdateBound);

    this.render();

    this._animationFrameId = null;
    this._onAnimateBound = this._onAnimate.bind(this);
    this._onAnimate(); // Start the animation loop
  }

  render() {
    this.element.html(this._getHTML());
    this.activateListeners();
    this._updateTime(this.currentTime, { fromHook: true });
    
    // Initialize duration display
    const seconds = this.transitionDuration / 1000;
    this._updateDurationDisplay(seconds);
    
    // Sync with any ongoing UnifiedTransitionManager transition
    this._syncWithActiveTransition();
  }
  
  /**
   * Sync clock UI with any active UnifiedTransitionManager transition
   * Called when clock is rendered/reopened to resume visual transition
   */
  _syncWithActiveTransition() {
    const utm = game.mapShine?.unifiedTransitionManager;
    if (!utm) {
      this._updateTransitionIndicator(false);
      this._updateGhostHand(false);
      return;
    }
    
    // Find active time transition
    const activeTimeTransition = utm.activeTransitions.find(t => t.type === 'time' && t.active);
    
    if (activeTimeTransition) {
      // Resume the transition visually in the clock
      const now = performance.now();
      const elapsed = now - activeTimeTransition.startTime;
      const remainingDuration = activeTimeTransition.duration - elapsed;
      
      if (remainingDuration > 0) {
        // Transition still active - sync clock state
        this.transitionActive = true;
        this.transitionStartTime = activeTimeTransition.startTime;
        this.transitionDuration = activeTimeTransition.duration;
        this.transitionStartValue = activeTimeTransition.startValue;
        this.transitionTargetValue = activeTimeTransition.originalTarget || activeTimeTransition.targetValue;
        
        // Show visual indicators
        this._updateTransitionIndicator(true);
        this._updateGhostHand(true, this.transitionTargetValue);
        
        console.log(`MapShine | Clock synced with ongoing transition: ${remainingDuration.toFixed(0)}ms remaining`);
      } else {
        // Transition completed while UI was closed
        this.transitionActive = false;
        this._updateTransitionIndicator(false);
        this._updateGhostHand(false);
      }
    } else {
      // No active transition
      this.transitionActive = false;
      this._updateTransitionIndicator(false);
      this._updateGhostHand(false);
    }
  }

  _onAnimate() {
    if (!this.element || !this.element.closest("body").length) {
      // Element has been removed, stop the loop
      this._animationFrameId = null;
      return;
    }

    const windManager = game.mapShine?.windManager;
    const arrow = this.element.find(".clock-wind-arrow")[0];

    if (windManager && arrow) {
      const windConfig =
        game.mapShine.profileManager.activeConfig.fire.particles.wind;
      if (windConfig.enabled) {
        arrow.style.display = "block";
        const angle = windManager.angle;
        const strength = windManager.getNormalizedStrength();

        // The arrow points from the center outwards.
        // A length of 0.5 means it reaches the edge.
        // We scale strength so that max gust is full length.
        const scale = strength * 0.45; // 0.45 instead of 0.5 to keep it inside the clock face

        // Wind angle 0° = East (right), 90° = North (up)
        // CSS rotation 0° = up, 90° = right
        // Formula: 90 - angle aligns wind direction with CSS rotation
        arrow.style.transform = `rotate(${90 - angle}deg) scaleY(${scale})`;
      } else {
        arrow.style.display = "none";
      }
    } else if (arrow) {
      arrow.style.display = "none";
    }

    // Update weather indicator
    const weatherManager = game.mapShine?.weatherSystemManager;
    const weatherIndicator = this.element.find(".clock-weather-indicator")[0];
    
    if (weatherManager && weatherIndicator) {
      const weatherConfig = game.mapShine.profileManager.activeConfig.weather;
      if (weatherConfig?.enabled) {
        const currentState = weatherManager.currentState || 'clear';
        const targetState = weatherManager.targetState || currentState;
        const progress = weatherManager.transitionProgress || 0;
        
        // Show weather icon based on current state
        const icons = {
          clear: '☀️',
          drizzle: '🌦️',
          rain: '🌧️',
          storm: '⛈️',
          sleet: '🌨️',
          snow: '❄️',
          blizzard: '🌨️💨'
        };
        
        const icon = icons[currentState] || '☀️';
        
        // Only update DOM if weather state actually changed OR dropdown is not open
        const hasDropdown = weatherIndicator.querySelector('.weather-dropdown');
        const stateChanged = this._lastWeatherState !== currentState ||
                             this._lastWeatherTarget !== targetState ||
                             Math.abs(this._lastWeatherProgress - progress) > 0.01;
        
        if (!hasDropdown && stateChanged) {
          // Display state name and transition info
          let displayText = currentState.charAt(0).toUpperCase() + currentState.slice(1);
          if (weatherManager.isTransitioning && targetState !== currentState) {
            displayText += ` → ${targetState.charAt(0).toUpperCase() + targetState.slice(1)} (${Math.round(progress * 100)}%)`;
          }
          
          weatherIndicator.innerHTML = `<div class="weather-icon">${icon}</div><div class="weather-text">${displayText}</div>`;
          
          // Update tracking
          this._lastWeatherState = currentState;
          this._lastWeatherTarget = targetState;
          this._lastWeatherProgress = progress;
        }
        weatherIndicator.style.display = "flex";
      } else {
        weatherIndicator.style.display = "none";
      }
    } else if (weatherIndicator) {
      weatherIndicator.style.display = "none";
    }

    // Handle time transitions
    if (this.transitionActive) {
      const now = performance.now();
      const elapsed = now - this.transitionStartTime;
      const progress = Math.min(1, elapsed / this.transitionDuration);
      
      if (progress >= 1) {
        // Transition complete
        this.transitionActive = false;
        this.currentTime = this.transitionTargetValue;
        this._updateTransitionIndicator(false);
        this._updateGhostHand(false);
        this._updateTimeDisplay(this.currentTime);
        
        // Emit hook for completion
        Hooks.callAll("mapShine:timeTransitionComplete", {
          time: this.currentTime
        });
        
        console.log(`MapShine | Clock transition complete: ${this.constructor._formatTime(this.currentTime)}`);
      } else {
        // Apply easing and interpolate for UI display only
        const easedProgress = this._easeInOutCubic(progress);
        const interpolatedTime = this._lerp(
          this.transitionStartValue,
          this.transitionTargetValue,
          easedProgress
        );
        this.currentTime = interpolatedTime;
        this._updateTimeDisplay(this.currentTime);
        // Note: UnifiedTransitionManager handles actual system updates
      }
    }

    this._animationFrameId = requestAnimationFrame(this._onAnimateBound);
  }

  _getHTML() {
    const initialAngle = MapShineClock._getAngleForTime(this.currentTime);
    const isNight = this.currentTime < 6 || this.currentTime >= 18;
    const initialIcon = isNight
      ? "modules/map-shine/assets/moon.webp"
      : "modules/map-shine/assets/sun.webp";
    const initialGradient = MapShineClock._getClockGradientForTime(this.currentTime);

    const dragHandleHTML = this.options.showDragHandle
      ? '<div class="clock-drag-handle"></div>'
      : "";
    
    // Mode toggle button
    const modeToggleHTML = `
      <div class="time-mode-toggle">
        <button data-action="toggle-time-mode" title="${this.timeMode === 'foundry' ? 'Switch to Manual Time Control' : 'Sync to Foundry World Time'}">
          ${this.timeMode === 'foundry' ? '🔗 Foundry Time' : '✋ Manual'}
        </button>
      </div>
    `;
    
    const disclaimerHTML = this.options.showDisclaimer
      ? '<p class="clock-disclaimer">Controls scene visuals only. Does not change Foundry\'s world time.</p>'
      : "";

    // Adjustments for embedded version (smaller size)
    const containerWidth = this.options.showDragHandle ? "128px" : "100px";
    const bodyPadding = this.options.showDragHandle ? "10px" : "5px";

    return `
                <style>
                  /* Inline-scoped styles to ensure clock renders without external stylesheet */
                  .day-night-clock-component { padding: ${bodyPadding}; display: flex; flex-direction: column; align-items: center; gap: 6px; }
                  .clock-drag-handle { width: 100%; height: 20px; cursor: move; display: flex; align-items: center; justify-content: center; opacity: 0.5; transition: opacity 0.2s; }
                  .clock-drag-handle:hover { opacity: 1; }
                  .clock-drag-handle::before { content: '...'; font-size: 24px; color: #aaa; line-height: 10px; letter-spacing: 2px; }
                  .clock-container { position: relative; width: ${containerWidth}; height: ${containerWidth}; margin: 0 auto; border-radius: 50%; cursor: grab; user-select: none; }
                  .clock-container:active { cursor: grabbing; }
                  .clock-face {
                      width: 100%; height: 100%; border-radius: 50%;
                      background: var(--clock-gradient, radial-gradient(circle, #888, #444));
                      border: 4px solid #222;
                      box-shadow: 0 0 15px rgba(0,0,0,0.6) inset, 0 0 10px rgba(255,255,255,0.1);
                      position: relative;
                      overflow: hidden;
                      transition: background 0.5s ease;
                  }
                  .clock-face::after {
                      content: '';
                      position: absolute;
                      top: 0; left: 0; right: 0; bottom: 0;
                      background: radial-gradient(circle at 40% 40%, rgba(255,255,255,0.15), transparent 60%);
                      pointer-events: none;
                  }
                  .clock-hand {
                      position: absolute;
                      width: 24px;
                      height: 50%;
                      top: 0; left: 50%;
                      transform-origin: bottom center;
                      margin-left: -12px;
                      pointer-events: none;
                      z-index: 2;
                  }
                  .clock-hand-ghost {
                      position: absolute;
                      width: 24px;
                      height: 50%;
                      top: 0;
                      left: 50%;
                      transform-origin: bottom center;
                      margin-left: -12px;
                      pointer-events: none;
                      z-index: 1;
                      opacity: 0;
                      transition: opacity 0.3s ease;
                  }
                  .clock-hand-ghost.visible {
                      opacity: 0.5;
                  }
                  .clock-wind-arrow {
                      position: absolute;
                      top: 0;
                      left: 50%;
                      width: 6px;
                      height: 50%;
                      margin-left: -3px;
                      background-color: #ff4444;
                      transform-origin: bottom center;
                      clip-path: polygon(50% 0, 100% 100%, 0 100%);
                      box-shadow: 0 0 5px rgba(255,0,0,0.7);
                      transition: transform 0.2s linear;
                      z-index: 3;
                      pointer-events: none;
                      display: none;
                  }
                  .clock-icon { width: 100%; height: auto; filter: drop-shadow(0 0 3px black); border-radius: 50%; }
                  .time-marker { position: absolute; color: white; font-weight: bold; text-shadow: 0 0 3px black; font-size: 12px; z-index: 1; }
                  .time-marker.m-12 { top: 2px; left: 50%; transform: translateX(-50%); }
                  .time-marker.m-6 { top: 50%; left: 5px; transform: translateY(-50%); }
                  .time-marker.m-18 { top: 50%; right: 5px; transform: translateY(-50%); }
                  .time-marker.m-0 { bottom: 2px; left: 50%; transform: translateX(-50%); }
                  .clock-controls { display: flex; align-items: center; justify-content: center; gap: 5px; width: 100%; margin-top: 5px; }
                  .clock-controls button { width: 30px; height: 30px; font-size: 1.2em; font-weight: bold; background: #3a3a3a; border: 1px solid #666; color: #ccc; border-radius: 4px; cursor: pointer; }
                  .clock-controls button:hover { background: #555; }
                  .clock-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
                  .clock-controls .time-display-input { width: 60px; height: 30px; text-align: center; font-size: 1.1em; background: #2a2a2a; color: white; border: 1px solid #666; border-radius: 4px; }
                  .clock-controls .time-display-input:disabled { opacity: 0.5; cursor: not-allowed; }
                  .clock-mode-toggle { width: auto !important; padding: 4px 8px; font-size: 0.9em; margin-top: 4px; background: #2a4a2a; border: 1px solid #4a8a4a; color: #aaffaa; }
                  .clock-mode-toggle:hover { background: #3a5a3a; }
                  .clock-disclaimer { font-size: 11px; color: #aaa; text-align: center; margin: 8px 0 0 0; max-width: 160px; line-height: 1.3; }
                  .clock-weather-indicator { display: none; flex-direction: row; align-items: center; justify-content: center; gap: 6px; padding: 4px 8px; margin-top: 4px; background: rgba(33, 150, 243, 0.15); border: 1px solid rgba(33, 150, 243, 0.3); border-radius: 4px; font-size: 11px; color: #87ceeb; max-width: 160px; cursor: pointer; transition: background 0.2s; position: relative; }
                  .clock-weather-indicator:hover { background: rgba(33, 150, 243, 0.25); }
                  .clock-weather-indicator .weather-icon { font-size: 14px; line-height: 1; }
                  .clock-weather-indicator .weather-text { font-weight: 600; text-align: center; line-height: 1.2; }
                  .clock-timeofday-indicator { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 6px; padding: 4px 8px; margin-top: 4px; background: rgba(255, 193, 7, 0.15); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: 4px; font-size: 11px; color: #ffc107; max-width: 160px; cursor: pointer; transition: background 0.2s; position: relative; }
                  .clock-timeofday-indicator:hover { background: rgba(255, 193, 7, 0.25); }
                  .clock-timeofday-indicator .timeofday-icon { font-size: 14px; line-height: 1; }
                  .clock-timeofday-indicator .timeofday-text { font-weight: 600; text-align: center; line-height: 1.2; }
                  .weather-dropdown { position: absolute; top: 100%; left: 0; min-width: 140px; margin-top: 4px; background: #2a2a2a; border: 1px solid rgba(33, 150, 243, 0.5); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 1000; overflow: hidden; }
                  .weather-dropdown-item { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ccc; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.05); }
                  .weather-dropdown-item:last-child { border-bottom: none; }
                  .weather-dropdown-item:hover { background: rgba(33, 150, 243, 0.2); color: #fff; }
                  .weather-dropdown-item.active { background: rgba(33, 150, 243, 0.3); color: #87ceeb; font-weight: bold; }
                  .weather-dropdown-item .item-icon { font-size: 16px; }
                  .weather-dropdown-item .item-name { flex: 1; }
                  .timeofday-dropdown { position: absolute; top: 100%; left: 0; min-width: 140px; margin-top: 4px; background: #2a2a2a; border: 1px solid rgba(255, 193, 7, 0.5); border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 1000; overflow: hidden; max-height: 300px; overflow-y: auto; }
                  .timeofday-dropdown-item { padding: 8px 12px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ccc; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.05); }
                  .timeofday-dropdown-item:last-child { border-bottom: none; }
                  .timeofday-dropdown-item:hover { background: rgba(255, 193, 7, 0.2); color: #fff; }
                  .timeofday-dropdown-item.active { background: rgba(255, 193, 7, 0.3); color: #ffc107; font-weight: bold; }
                  .timeofday-dropdown-item .item-icon { font-size: 16px; }
                  .timeofday-dropdown-item .item-name { flex: 1; }
                  .timeofday-dropdown-item .item-time { font-size: 10px; color: #888; }
                  .transition-controls { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 4px; padding: 6px; background: rgba(128, 90, 213, 0.15); border: 1px solid rgba(128, 90, 213, 0.3); border-radius: 4px; max-width: 160px; }
                  .transition-controls-header { font-size: 9px; color: #b19cd9; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; text-align: center; line-height: 1.3; }
                  .transition-controls-row { display: flex; align-items: center; gap: 6px; width: 100%; }
                  .transition-duration-slider { flex: 1; height: 4px; -webkit-appearance: none; appearance: none; background: rgba(128, 90, 213, 0.3); outline: none; border-radius: 2px; }
                  .transition-duration-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; background: #b19cd9; cursor: pointer; border-radius: 50%; }
                  .transition-duration-slider::-moz-range-thumb { width: 12px; height: 12px; background: #b19cd9; cursor: pointer; border-radius: 50%; border: none; }
                  .transition-duration-display { font-size: 11px; color: #b19cd9; font-weight: 600; min-width: 32px; text-align: right; }
                  .transition-preset-select { flex: 1; padding: 2px 4px; font-size: 10px; background: #2a2a2a; color: #b19cd9; border: 1px solid rgba(128, 90, 213, 0.3); border-radius: 3px; cursor: pointer; }
                  .transition-indicator { display: none; flex-direction: row; align-items: center; justify-content: center; gap: 6px; padding: 4px 8px; margin-top: 4px; background: rgba(128, 90, 213, 0.2); border: 1px solid rgba(128, 90, 213, 0.4); border-radius: 4px; font-size: 11px; color: #b19cd9; max-width: 160px; font-weight: 600; }
                </style>
                <div class="day-night-clock-component">
                    ${dragHandleHTML}
                    <div class="clock-container">
                        <div class="clock-face" style="--clock-gradient: ${initialGradient};">
                            <div class="time-marker m-12">12</div> <div class="time-marker m-6">6</div>
                            <div class="time-marker m-18">18</div> <div class="time-marker m-0">0</div>
                            <div class="clock-hand-ghost"><img class="clock-icon" src="${initialIcon}"></div>
                            <div class="clock-hand" style="transform: rotate(${initialAngle}deg);"><img class="clock-icon" src="${initialIcon}"></div>
                            <div class="clock-wind-arrow"></div>
                        </div>
                    </div>
                    <div class="clock-controls">
                        <button data-action="adjust-time" data-amount="-0.25" title="Subtract 15 Minutes" ${this.timeMode === 'foundry' ? 'disabled' : ''}>-</button>
                        <input type="text" class="time-display-input" value="${MapShineClock._formatTime(
                          this.currentTime
                        )}" ${this.timeMode === 'foundry' ? 'disabled' : ''}>
                        <button data-action="adjust-time" data-amount="0.25" title="Add 15 Minutes" ${this.timeMode === 'foundry' ? 'disabled' : ''}>+</button>
                    </div>
                    ${modeToggleHTML}
                    <div class="clock-timeofday-indicator">
                        <div class="timeofday-icon">☀️</div>
                        <div class="timeofday-text">Midday</div>
                    </div>
                    <div class="clock-weather-indicator"></div>
                    <div class="transition-controls">
                        <div class="transition-controls-header">Transition Duration<br>(Time & Weather)</div>
                        <div class="transition-controls-row">
                            <input type="range" class="transition-duration-slider" min="15" max="1800" step="15" value="180" title="Transition Duration">
                            <span class="transition-duration-display">3m 0s</span>
                        </div>
                        <div class="transition-controls-row">
                            <select class="transition-preset-select" title="Quick Presets">
                                <option value="15">Instant (15s)</option>
                                <option value="60">Fast (1m)</option>
                                <option value="180">Normal (3m)</option>
                                <option value="300">Slow (5m)</option>
                                <option value="600">Cinematic (10m)</option>
                                <option value="1800">Epic (30m)</option>
                            </select>
                        </div>
                    </div>
                    <div class="transition-indicator">⏳ Transitioning...</div>
                    ${disclaimerHTML}
                </div>
            `;
  }

  activateListeners() {
    console.log('MapShine | MapShineClock.activateListeners() called');
    const clockContainer = this.element.find(".clock-container");

    this._onDragBound = this._onDrag.bind(this);
    this._onDragEndBound = this._onDragEnd.bind(this);

    clockContainer.on("mousedown", (event) => {
      // Only allow dragging in manual mode
      if (this.timeMode === 'manual') {
        this._isDragging = true;
        this._onDrag(event);
        $(window).on("mousemove.daynightclock", this._onDragBound);
        $(window).on("mouseup.daynightclock", this._onDragEndBound);
      }
    });

    if (this.options.showDragHandle && this.application) {
      const handle = this.element.find(".clock-drag-handle");
      handle.on("mousedown", (e) => {
        // Correctly call the application's drag handler
        this.application._onDragMouseDown(e);
      });
    }

    // Time adjustment buttons
    this.element.on("click", "[data-action='adjust-time']", (event) => {
      // Only allow in manual mode
      if (this.timeMode === 'manual') {
        const amountStr = event.currentTarget.dataset.amount;
        const amount = parseFloat(amountStr);
        if (!isNaN(amount)) {
          this.adjustTime(amount);
        }
      }
    });

    // Mode toggle button
    this.element.on("click", "[data-action='toggle-time-mode']", (event) => {
      event.preventDefault();
      this.toggleTimeMode();
    });

    // Weather indicator click - toggle dropdown
    const weatherIndicator = this.element.find(".clock-weather-indicator");
    console.log('MapShine | Weather indicator element found:', weatherIndicator.length > 0);
    console.log('MapShine | Attaching click handler to .clock-weather-indicator');
    
    this.element.on("click", ".clock-weather-indicator", (event) => {
      console.log('MapShine | Weather indicator CLICKED!');
      event.stopPropagation();
      this.toggleWeatherDropdown();
    });

    // Weather dropdown item click
    this.element.on("click", ".weather-dropdown-item", (event) => {
      event.stopPropagation();
      const newState = $(event.currentTarget).data("state");
      if (newState) {
        this.changeWeatherState(newState);
      }
    });

    // Close dropdown when clicking outside
    $(document).on("click.weatherDropdown", () => {
      this.closeWeatherDropdown();
    });

    // Time of day indicator click - toggle dropdown
    this.element.on("click", ".clock-timeofday-indicator", (event) => {
      event.stopPropagation();
      this.toggleTimeOfDayDropdown();
    });

    // Time of day dropdown item click
    this.element.on("click", ".timeofday-dropdown-item", (event) => {
      event.stopPropagation();
      const timeValue = parseFloat($(event.currentTarget).data("time"));
      if (!isNaN(timeValue)) {
        this.changeTimeOfDay(timeValue);
      }
    });

    // Close time of day dropdown when clicking outside
    $(document).on("click.timeOfDayDropdown", () => {
      this.closeTimeOfDayDropdown();
    });

    // Time display input
    this.element.find(".time-display-input").on("change", (event) => {
      // Only allow in manual mode
      if (this.timeMode === 'manual') {
        const inputVal = event.currentTarget.value;
        const parts = inputVal.split(":");
        if (parts.length === 2) {
          const hour = parseInt(parts[0], 10);
          const minute = parseInt(parts[1], 10);
          if (!isNaN(hour) && !isNaN(minute)) {
            const newTime = hour + minute / 60;
            this._updateTime(newTime);
          }
        }
      }
    });

    // Transition duration slider
    this.element.find(".transition-duration-slider").on("input", (event) => {
      const seconds = parseFloat(event.currentTarget.value);
      this.transitionDuration = seconds * 1000;
      this._updateDurationDisplay(seconds);
    });

    // Transition preset select
    this.element.find(".transition-preset-select").on("change", (event) => {
      const seconds = parseFloat(event.currentTarget.value);
      this.transitionDuration = seconds * 1000;
      this._updateDurationDisplay(seconds);
      this.element.find(".transition-duration-slider").val(seconds);
    });

    // Initialize UI state based on current mode
    this.updateUIState();
  }

  destroy() {
    Hooks.off("mapShine:timeChanged", this._onExternalTimeChangeBound);
    Hooks.off("updateWorldTime", this._onFoundryTimeUpdateBound);
    $(window).off(".daynightclock");
    $(document).off(".weatherDropdown");
    $(document).off(".timeOfDayDropdown");

    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  adjustTime(amount) {
    const newTime = (this.currentTime + amount + 24) % 24;
    this._updateTime(newTime);
  }

  async toggleTimeMode() {
    this.timeMode = this.timeMode === 'manual' ? 'foundry' : 'manual';
    
    // Update the profile config
    const syncFromFoundry = this.timeMode === 'foundry';
    await game.mapShine.profileManager.recordUserChange(
      'timeOfDay.syncFromFoundryTime',
      syncFromFoundry
    );
    
    // If switching to foundry mode, sync immediately from current Foundry time
    if (syncFromFoundry) {
      const secondsPerDay = 86400;
      const hours = (game.time.worldTime % secondsPerDay) / 3600;
      this._updateTime(hours, { fromHook: true });
    }
    
    this.updateUIState();
  }

  updateUIState() {
    if (!this.element) return;
    
    const isManual = this.timeMode === 'manual';
    
    // Update button disabled states
    const buttons = this.element.find('[data-action="adjust-time"]');
    buttons.prop('disabled', !isManual);
    
    // Update input disabled state
    const input = this.element.find('.time-display-input');
    input.prop('disabled', !isManual);
    
    // Update toggle button text
    const toggleButton = this.element.find('[data-action="toggle-time-mode"]');
    const buttonText = isManual ? '✋ Manual' : '🔗 Foundry Time';
    toggleButton.text(buttonText);
    toggleButton.attr('title', isManual ? 'Sync to Foundry World Time' : 'Switch to Manual Time Control');
    
    // Update clock container cursor
    const clockContainer = this.element.find('.clock-container');
    clockContainer.css('cursor', isManual ? 'grab' : 'default');
  }

  toggleWeatherDropdown() {
    console.log('MapShine | toggleWeatherDropdown() called');
    const indicator = this.element.find('.clock-weather-indicator');
    console.log('MapShine | Indicator element:', indicator.length);
    let dropdown = this.element.find('.weather-dropdown');
    console.log('MapShine | Existing dropdown:', dropdown.length);
    
    if (dropdown.length > 0) {
      // Dropdown exists, remove it
      dropdown.remove();
      return;
    }
    
    // Create dropdown
    const weatherManager = game.mapShine?.weatherSystemManager;
    console.log('MapShine | game.mapShine exists:', !!game.mapShine);
    console.log('MapShine | weatherSystemManager exists:', !!weatherManager);
    if (!weatherManager) {
      console.warn('MapShine | Cannot create dropdown - weatherSystemManager not found!');
      return;
    }
    
    const currentState = weatherManager.currentState || 'clear';
    
    const states = [
      { key: 'clear', icon: '☀️', name: 'Clear' },
      { key: 'partly-cloudy', icon: '⛅', name: 'Partly Cloudy' },
      { key: 'drizzle', icon: '🌦️', name: 'Drizzle' },
      { key: 'rain', icon: '🌧️', name: 'Rain' },
      { key: 'storm', icon: '⛈️', name: 'Storm' },
      { key: 'sleet', icon: '🌨️', name: 'Sleet' },
      { key: 'snow', icon: '❄️', name: 'Snow' },
      { key: 'blizzard', icon: '🌨️💨', name: 'Blizzard' }
    ];
    
    const dropdownHTML = `
      <div class="weather-dropdown">
        ${states.map(state => `
          <div class="weather-dropdown-item ${state.key === currentState ? 'active' : ''}" data-state="${state.key}">
            <span class="item-icon">${state.icon}</span>
            <span class="item-name">${state.name}</span>
          </div>
        `).join('')}
      </div>
    `;
    
    indicator.append(dropdownHTML);
    console.log('MapShine | Dropdown HTML appended to indicator');
    
    // Verify it was added
    setTimeout(() => {
      const checkDropdown = this.element.find('.weather-dropdown');
      console.log('MapShine | Dropdown exists after append:', checkDropdown.length);
    }, 10);
  }

  closeWeatherDropdown() {
    console.log('MapShine | closeWeatherDropdown() called');
    this.element.find('.weather-dropdown').remove();
  }

  changeWeatherState(newState) {
    console.log('MapShine | changeWeatherState() called with:', newState);
    const weatherManager = game.mapShine?.weatherSystemManager;
    if (!weatherManager) {
      console.warn('MapShine | Weather system not available');
      return;
    }
    
    console.log('MapShine | Weather manager available, current state:', weatherManager.currentState);
    console.log('MapShine | Weather manager isReady:', weatherManager.isReady);
    console.log('MapShine | Weather manager isTransitioning:', weatherManager.isTransitioning);
    
    // Use the transition duration from the slider
    const duration = this.transitionDuration || 3000;
    console.log('MapShine | Using transition duration:', duration);
    
    // Transition to new state
    console.log('MapShine | Calling transitionToState...');
    const result = weatherManager.transitionToState(newState, duration);
    console.log('MapShine | transitionToState returned:', result);
    
    if (result === false) {
      console.error('MapShine | Transition failed! Last error:', weatherManager.lastError);
    }
    
    // Update config to persist the change
    game.mapShine.profileManager.recordUserChange('weather.currentState', newState);
    
    // Close dropdown
    this.closeWeatherDropdown();
    
    console.log(`MapShine | Weather changed to: ${newState} (duration: ${duration}ms)`);
  }

  toggleTimeOfDayDropdown() {
    const indicator = this.element.find('.clock-timeofday-indicator');
    let dropdown = this.element.find('.timeofday-dropdown');
    
    if (dropdown.length > 0) {
      dropdown.remove();
      return;
    }
    
    // Time of day presets
    const timePresets = [
      { time: 0, icon: '🌙', name: 'Midnight', display: '00:00' },
      { time: 3, icon: '🌃', name: 'Late Night', display: '03:00' },
      { time: 5, icon: '🌅', name: 'Pre-Dawn', display: '05:00' },
      { time: 6, icon: '🌄', name: 'Dawn', display: '06:00' },
      { time: 7, icon: '🌤️', name: 'Early Morning', display: '07:00' },
      { time: 9, icon: '☀️', name: 'Morning', display: '09:00' },
      { time: 12, icon: '🌞', name: 'Midday', display: '12:00' },
      { time: 15, icon: '☀️', name: 'Afternoon', display: '15:00' },
      { time: 17, icon: '🌤️', name: 'Late Afternoon', display: '17:00' },
      { time: 18, icon: '🌇', name: 'Dusk', display: '18:00' },
      { time: 19, icon: '🌆', name: 'Sunset', display: '19:00' },
      { time: 20, icon: '🌃', name: 'Evening', display: '20:00' },
      { time: 22, icon: '🌙', name: 'Night', display: '22:00' }
    ];
    
    const currentTime = this.currentTime;
    
    const dropdownHTML = `
      <div class="timeofday-dropdown">
        ${timePresets.map(preset => {
          const isActive = Math.abs(preset.time - currentTime) < 0.5;
          return `
            <div class="timeofday-dropdown-item ${isActive ? 'active' : ''}" data-time="${preset.time}">
              <span class="item-icon">${preset.icon}</span>
              <span class="item-name">${preset.name}</span>
              <span class="item-time">${preset.display}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    indicator.append(dropdownHTML);
  }

  closeTimeOfDayDropdown() {
    this.element.find('.timeofday-dropdown').remove();
  }

  changeTimeOfDay(newTime) {
    if (this.timeMode !== 'manual') {
      console.warn('MapShine | Cannot change time in Foundry Time mode');
      ui.notifications.warn('Switch to Manual mode to change time of day');
      this.closeTimeOfDayDropdown();
      return;
    }
    
    console.log(`MapShine | Transitioning to time: ${newTime} (duration: ${this.transitionDuration}ms)`);
    
    // Close dropdown
    this.closeTimeOfDayDropdown();
    
    // Use the standard _updateTime method which handles the transition properly
    this._updateTime(newTime);
    
    // Update the time of day indicator text
    this._updateTimeOfDayIndicator(newTime);
  }

  _updateTimeOfDayIndicator(time) {
    const indicator = this.element.find('.clock-timeofday-indicator');
    if (!indicator.length) return;
    
    // Determine time of day label
    let label = 'Midday';
    let icon = '🌞';
    
    if (time >= 0 && time < 3) { label = 'Midnight'; icon = '🌙'; }
    else if (time >= 3 && time < 5) { label = 'Late Night'; icon = '🌃'; }
    else if (time >= 5 && time < 6) { label = 'Pre-Dawn'; icon = '🌅'; }
    else if (time >= 6 && time < 7) { label = 'Dawn'; icon = '🌄'; }
    else if (time >= 7 && time < 9) { label = 'Early Morning'; icon = '🌤️'; }
    else if (time >= 9 && time < 12) { label = 'Morning'; icon = '☀️'; }
    else if (time >= 12 && time < 15) { label = 'Midday'; icon = '🌞'; }
    else if (time >= 15 && time < 17) { label = 'Afternoon'; icon = '☀️'; }
    else if (time >= 17 && time < 18) { label = 'Late Afternoon'; icon = '🌤️'; }
    else if (time >= 18 && time < 19) { label = 'Dusk'; icon = '🌇'; }
    else if (time >= 19 && time < 20) { label = 'Sunset'; icon = '🌆'; }
    else if (time >= 20 && time < 22) { label = 'Evening'; icon = '🌃'; }
    else if (time >= 22) { label = 'Night'; icon = '🌙'; }
    
    indicator.find('.timeofday-icon').text(icon);
    indicator.find('.timeofday-text').text(label);
  }

  /**
   * Cubic ease-in-out function for smooth transitions
   */
  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Linear interpolation between two values
   */
  _lerp(start, end, t) {
    // Handle wraparound for time (e.g., 23:00 → 1:00 should go forward, not backward)
    let diff = end - start;
    if (diff > 12) {
      diff -= 24;
      end = start + diff;
    } else if (diff < -12) {
      diff += 24;
      end = start + diff;
    }
    return start + (end - start) * t;
  }

  /**
   * Update the transition duration display
   */
  _updateDurationDisplay(seconds) {
    if (!this.element) return;
    const display = this.element.find(".transition-duration-display");
    
    // Format as minutes and seconds
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (secs === 0) {
        display.text(`${minutes}m 0s`);
      } else {
        display.text(`${minutes}m ${secs}s`);
      }
    } else {
      display.text(`${seconds}s`);
    }
  }

  /**
   * Show or hide the transition indicator
   */
  _updateTransitionIndicator(show) {
    if (!this.element) return;
    const indicator = this.element.find(".transition-indicator");
    indicator.css("display", show ? "flex" : "none");
  }

  /**
   * Update the ghost clock hand to show transition target position
   */
  _updateGhostHand(show, targetTime = null) {
    if (!this.element) return;
    
    const ghostHand = this.element.find(".clock-hand-ghost");
    const ghostIcon = ghostHand.find(".clock-icon");
    
    if (show && targetTime !== null) {
      // Position ghost hand at target time
      const targetAngle = this.constructor._getAngleForTime(targetTime);
      const isNight = targetTime < 6 || targetTime >= 18;
      const iconSrc = isNight
        ? "modules/map-shine/assets/moon.webp"
        : "modules/map-shine/assets/sun.webp";
      
      ghostHand.css("transform", `rotate(${targetAngle}deg)`);
      ghostIcon.attr("src", iconSrc);
      ghostHand.addClass("visible");
    } else {
      // Hide ghost hand
      ghostHand.removeClass("visible");
    }
  }

  /**
   * Update the visual time display without triggering system updates
   */
  _updateTimeDisplay(time) {
    if (!this.element) return;
    
    const gradient = this.constructor._getClockGradientForTime(time);
    this.element.find(".clock-face").css("--clock-gradient", gradient);

    const angle = this.constructor._getAngleForTime(time);
    const formattedTime = this.constructor._formatTime(time);
    const isNight = time < 6 || time >= 18;
    
    this.element.find(".clock-hand").css("transform", `rotate(${angle}deg)`);
    this.element.find(".time-display-input").val(formattedTime);
    
    const icon = this.element.find(".clock-icon");
    const newIconSrc = isNight
      ? "modules/map-shine/assets/moon.webp"
      : "modules/map-shine/assets/sun.webp";
    if (icon.attr("src") !== newIconSrc) {
      icon.attr("src", newIconSrc);
    }
    
    // Update time of day indicator text
    this._updateTimeOfDayIndicator(time);
  }

  static _formatTime(time) {
    const hour = Math.floor(time);
    const minutes = Math.round((time - hour) * 60);
    return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  static _getAngleForTime(time) {
    let hour = time;
    if (hour < 12) {
      hour += 24;
    }
    const degrees = (hour - 12) * 15;
    return degrees;
  }

  static _getTimeForAngle(angleDegrees) {
    let hour = angleDegrees / 15 + 12;
    if (hour >= 24) {
      hour -= 24;
    }
    return hour;
  }

  static _getClockGradientForTime(time) {
    // Generate a vibrant gradient based on time of day
    // Teenage Engineering-inspired color palette
    const hour = time % 24;
    
    let color1, color2, color3;
    
    if (hour >= 0 && hour < 6) {
      // Deep Night: Dark blue → Purple
      const t = hour / 6;
      color1 = `rgb(${Math.round(15 + t * 20)}, ${Math.round(10 + t * 15)}, ${Math.round(45 + t * 30)})`;
      color2 = `rgb(${Math.round(25 + t * 30)}, ${Math.round(15 + t * 20)}, ${Math.round(60 + t * 40)})`;
      color3 = `rgb(${Math.round(10 + t * 15)}, ${Math.round(5 + t * 10)}, ${Math.round(35 + t * 25)})`;
    } else if (hour >= 6 && hour < 8) {
      // Dawn: Purple → Pink → Orange
      const t = (hour - 6) / 2;
      color1 = `rgb(${Math.round(255 * (0.4 + t * 0.6))}, ${Math.round(255 * (0.2 + t * 0.4))}, ${Math.round(255 * (0.5 - t * 0.3))})`;
      color2 = `rgb(${Math.round(255 * (0.9 + t * 0.1))}, ${Math.round(255 * (0.3 + t * 0.5))}, ${Math.round(255 * (0.4 - t * 0.2))})`;
      color3 = `rgb(${Math.round(255 * (0.3 + t * 0.4))}, ${Math.round(255 * (0.15 + t * 0.35))}, ${Math.round(255 * (0.6 - t * 0.4))})`;
    } else if (hour >= 8 && hour < 16) {
      // Day: Bright cyan → Sky blue
      const t = (hour - 8) / 8;
      color1 = `rgb(${Math.round(255 * (0.3 - t * 0.1))}, ${Math.round(255 * (0.8 + t * 0.1))}, ${Math.round(255)})`;
      color2 = `rgb(${Math.round(255 * (0.4 + t * 0.1))}, ${Math.round(255 * (0.85 + t * 0.1))}, ${Math.round(255)})`;
      color3 = `rgb(${Math.round(255 * (0.2 - t * 0.1))}, ${Math.round(255 * (0.75 + t * 0.1))}, ${Math.round(255 * (0.95 + t * 0.05))})`;
    } else if (hour >= 16 && hour < 18) {
      // Dusk: Orange → Pink → Purple
      const t = (hour - 16) / 2;
      color1 = `rgb(${Math.round(255)}, ${Math.round(255 * (0.5 - t * 0.3))}, ${Math.round(255 * (0.2 + t * 0.3))})`;
      color2 = `rgb(${Math.round(255 * (0.9 - t * 0.2))}, ${Math.round(255 * (0.4 - t * 0.2))}, ${Math.round(255 * (0.3 + t * 0.3))})`;
      color3 = `rgb(${Math.round(255 * (0.95 - t * 0.3))}, ${Math.round(255 * (0.3 - t * 0.15))}, ${Math.round(255 * (0.25 + t * 0.35))})`;
    } else {
      // Evening/Night: Purple → Deep blue
      const t = (hour - 18) / 6;
      color1 = `rgb(${Math.round(255 * (0.4 - t * 0.3))}, ${Math.round(255 * (0.2 - t * 0.15))}, ${Math.round(255 * (0.6 - t * 0.4))})`;
      color2 = `rgb(${Math.round(255 * (0.3 - t * 0.2))}, ${Math.round(255 * (0.15 - t * 0.1))}, ${Math.round(255 * (0.5 - t * 0.3))})`;
      color3 = `rgb(${Math.round(255 * (0.15 - t * 0.1))}, ${Math.round(255 * (0.08 - t * 0.05))}, ${Math.round(255 * (0.4 - t * 0.25))})`;
    }
    
    return `radial-gradient(circle at 30% 30%, ${color1}, ${color2} 50%, ${color3})`;
  }

  static _getColorForTime(time) {
    const config = game.mapShine.profileManager.activeConfig.timeOfDay;
    const defaults = MODULE_DEFAULTS.timeOfDay.keyframes.midday;
    if (!config || !config.enabled) {
      return "rgb(128, 128, 128)";
    }
    const keyframesSource = config.keyframes;
    if (!keyframesSource) return "rgb(128, 128, 128)";
    const keyframes = Object.values(keyframesSource).sort(
      (a, b) => a.time - b.time
    );
    if (keyframes.length < 2) {
      return "rgb(128, 128, 128)";
    }
    const extendedKeyframes = [
      ...keyframes,
      { ...keyframes[0], time: keyframes[0].time + 24 },
    ];
    let fromFrame, toFrame;
    let currentTime = time;
    if (currentTime < extendedKeyframes[0].time) {
      currentTime += 24;
    }
    for (let i = 0; i < extendedKeyframes.length - 1; i++) {
      const current = extendedKeyframes[i];
      const next = extendedKeyframes[i + 1];
      if (currentTime >= current.time && currentTime < next.time) {
        fromFrame = current;
        toFrame = next;
        break;
      }
    }
    if (!fromFrame) {
      fromFrame = keyframes[keyframes.length - 1];
      toFrame = extendedKeyframes[extendedKeyframes.length - 1];
    }
    const frameDuration = toFrame.time - fromFrame.time;
    let timeIntoFrame = time - fromFrame.time;
    if (timeIntoFrame < 0) timeIntoFrame += 24;
    const blendFactor =
      frameDuration > 0
        ? Math.max(0, Math.min(1, timeIntoFrame / frameDuration))
        : 0;
    const lerp = (start, end, amount) => (1 - amount) * start + amount * end;
    const saturation = lerp(
      fromFrame.saturation ?? defaults.saturation,
      toFrame.saturation ?? defaults.saturation,
      blendFactor
    );
    const brightness = lerp(
      fromFrame.brightness ?? defaults.brightness,
      toFrame.brightness ?? defaults.brightness,
      blendFactor
    );
    const contrast = lerp(
      fromFrame.contrast ?? defaults.contrast,
      toFrame.contrast ?? defaults.contrast,
      blendFactor
    );
    const exposure = lerp(
      fromFrame.exposure ?? defaults.exposure,
      toFrame.exposure ?? defaults.exposure,
      blendFactor
    );
    const gamma = lerp(
      fromFrame.gamma ?? defaults.gamma,
      toFrame.gamma ?? defaults.gamma,
      blendFactor
    );
    const temperature = lerp(
      fromFrame.temperature ?? defaults.temperature,
      toFrame.temperature ?? defaults.temperature,
      blendFactor
    );
    const tint = lerp(
      fromFrame.tint ?? defaults.tint,
      toFrame.tint ?? defaults.tint,
      blendFactor
    );
    let color = { r: 0.5, g: 0.5, b: 0.5 };
    color.r *= Math.pow(2.0, exposure);
    color.g *= Math.pow(2.0, exposure);
    color.b *= Math.pow(2.0, exposure);
    if (gamma > 0.0) {
      color.r = Math.pow(Math.max(color.r, 0.0), 1.0 / gamma);
      color.g = Math.pow(Math.max(color.g, 0.0), 1.0 / gamma);
      color.b = Math.pow(Math.max(color.b, 0.0), 1.0 / gamma);
    }
    color.r += brightness;
    color.g += brightness;
    color.b += brightness;
    color.r = (color.r - 0.5) * contrast + 0.5;
    color.g = (color.g - 0.5) * contrast + 0.5;
    color.b = (color.b - 0.5) * contrast + 0.5;
    const luminance = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    color.r = luminance + saturation * (color.r - luminance);
    color.g = luminance + saturation * (color.g - luminance);
    color.b = luminance + saturation * (color.b - luminance);
    color.r += temperature * 0.15;
    color.g += temperature * 0.075;
    color.b -= temperature * 0.15;
    color.g += tint * 0.15;
    color.r -= tint * 0.075;
    color.b -= tint * 0.075;
    const finalR = Math.round(Math.max(0, Math.min(1, color.r)) * 255);
    const finalG = Math.round(Math.max(0, Math.min(1, color.g)) * 255);
    const finalB = Math.round(Math.max(0, Math.min(1, color.b)) * 255);
    return `rgb(${finalR}, ${finalG}, ${finalB})`;
  }

  _updateTime(newTime, { fromHook = false } = {}) {
    const normalizedTime = (newTime + 24) % 24;
    
    // If this is from a hook (external change), update instantly without transition
    if (fromHook) {
      this.currentTime = normalizedTime;
      if (this.element) {
        this._updateTimeDisplay(this.currentTime);
      }
      
      // Notify the system based on mode
      const shouldUpdate = (this.timeMode === 'manual' && !fromHook) || 
                           (this.timeMode === 'foundry' && fromHook);
      if (shouldUpdate) {
        game.mapShine.updateTimeOfDay(this.currentTime);
      }
      return;
    }
    
    // User-initiated change: start a transition
    this.transitionActive = true;
    this.transitionStartTime = performance.now();
    this.transitionStartValue = this.currentTime;
    this.transitionTargetValue = normalizedTime;
    
    // Show transition indicator and ghost hand
    this._updateTransitionIndicator(true);
    this._updateGhostHand(true, normalizedTime);
    
    // Start the system transition using UnifiedTransitionManager
    if (this.timeMode === 'manual' && game.mapShine?.unifiedTransitionManager) {
      game.mapShine.unifiedTransitionManager.transitionTime(normalizedTime, this.transitionDuration);
    }
    
    // Emit hook for transition start
    Hooks.callAll("mapShine:timeTransitionStart", {
      from: this.transitionStartValue,
      to: this.transitionTargetValue,
      duration: this.transitionDuration
    });
    
    // Note: The animation loop (_onAnimate) handles the clock UI interpolation
    // UnifiedTransitionManager handles the actual visual system updates
  }

  _onExternalTimeChange(time) {
    if (Math.abs(this.currentTime - time) > 0.01) {
      this._updateTime(time, { fromHook: true });
    }
  }

  _onFoundryTimeUpdate(worldTime, dt) {
    // Only sync from Foundry time when in 'foundry' mode
    if (this.timeMode !== 'foundry') return;
    
    // Convert Foundry world time (seconds) to 0-24 hour format
    const secondsPerDay = 86400; // 24 hours * 60 minutes * 60 seconds
    const hours = (worldTime % secondsPerDay) / 3600;
    
    // Only update if there's a meaningful difference
    if (Math.abs(this.currentTime - hours) > 0.01) {
      this._updateTime(hours, { fromHook: true });
    }
  }

  _onDrag(event) {
    if (!this._isDragging) return;
    const clockContainer = this.element.find(".clock-container");
    const rect = clockContainer[0].getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    let angleRad = Math.atan2(deltaY, deltaX) + Math.PI / 2;
    if (angleRad < 0) angleRad += 2 * Math.PI;
    const angleDeg = angleRad * (180 / Math.PI);

    const newTime = this.constructor._getTimeForAngle(angleDeg);
    this._updateTime(newTime);
  }

  _onDragEnd(_event) {
    this._isDragging = false;
    $(window).off("mousemove.daynightclock", this._onDragBound);
    $(window).off("mouseup.daynightclock", this._onDragEndBound);
  }
}

/**
 * Day/Night Clock Application
 * 
 * Displays a draggable clock interface for controlling time of day and weather.
 * 
 * @class DayNightClock
 * @extends Application
 * 
 * @todo FUTURE UI ENHANCEMENT: Model this as a "remote control" interface.
 * Design should resemble a sleek, thin black rectangle with rounded edges containing
 * buttons and displays - similar to a TV/media remote. This would provide a quick,
 * intuitive way for GMs/DMs to change scene aspects (time, weather, etc.) without
 * opening the main UI panel. Current implementation handles time and weather;
 * future versions should expand with additional scene control buttons.
 */
export class DayNightClock extends Application {
  constructor(options = {}) {
    super(options);
    this.clockComponent = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "day-night-clock",
      title: "Day/Night Cycle",
      template: null,
      width: 180,
      height: "auto",
      resizable: false,
      classes: ["day-night-clock-app"],
      header: false,
    });
  }

  async _renderInner(_data) {
    // The application just needs to provide a container for the component.
    const container = document.createElement("div");
    container.style.backgroundColor = "#1e1e1e";
    container.style.borderRadius = "8px";
    container.style.border = "1px solid #111";
    return $(container);
  }

  activateListeners(html) {
    super.activateListeners(html);
    // Instantiate the component, passing `this` (the Application instance) for drag handling.
    this.clockComponent = new MapShineClock(html[0], this);
  }

  async close(options) {
    // Cancel any ongoing animation and transition
    if (this.clockComponent) {
      if (this.clockComponent._animationFrameId) {
        cancelAnimationFrame(this.clockComponent._animationFrameId);
        this.clockComponent._animationFrameId = null;
      }
      this.clockComponent.transitionActive = false;
      this.clockComponent.destroy();
    }
    
    game.mapShine.dayNightClock = null;
    ui.controls.render(true);
    return super.close(options);
  }
}