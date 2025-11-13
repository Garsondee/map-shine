//
// The purpose behind this class is to provide a light weight options menu to allow users to quickly access the most common settings. It is designed primarily for players rather than dungeon masters and map makers,
// and the secondary purpose of this is to allow users to quickly turn off effects which might be causing unacceptable performance problems. If you add a new bloom or similar expensive layer you should consider
// adding an option here to disable that effect.
//
export class SimpleUIPanel extends Application {
  constructor(options = {}) {
    super(options);
    this.profileManager = game.mapShine.profileManager;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "map-shine-simple-ui",
      title: "Map Shine: Quick Settings",
      template: null, // We build the HTML in code.
      width: 420,
      height: "auto",
      resizable: true,
      classes: ["map-shine-simple-panel"],
    });
  }

  async render(force, options) {
    await super.render(force, options);

    this.element.find('input[type="range"]').each((i, el) => {
      this._updateSliderValue(el.id, el.value, el.step);
    });
    return this;
  }

  async _renderInner(_data) {
    const html = this._buildHTML();
    return $(html);
  }

  _buildHTML() {
    let controlsHTML = "";
    for (const [key, data] of Object.entries(CLIENT_OVERRIDES_CONFIG)) {
      const isEnabled = game.settings.get(MODULE_ID, `user-${key}-enabled`);
      const intensity = data.intensitySubPath
        ? game.settings.get(MODULE_ID, `user-${key}-intensity`)
        : null;

      let intensitySlider = "";
      if (intensity !== null) {
        intensitySlider = `
                                    <div class="simple-slider-wrapper">
                                        <input type="range" id="simple-intensity-${key}" data-no-path="true" data-key="${key}" data-type="intensity" min="0" max="100" step="1" value="${intensity}" title="Client-side override control, uses game.settings">
                                        <span class="value-span" id="simple-intensity-${key}-value">${intensity}</span>
                                    </div>
                                `;
      }

      controlsHTML += `
                                <div class="simple-control-row" title="${
                                  data.tooltip
                                }">
                                    <label for="simple-enabled-${key}">${
        data.name
      }</label>
                                    <div class="simple-widgets">
                                        ${intensitySlider}
                                        <input type="checkbox" id="simple-enabled-${key}" data-key="${key}" data-type="enabled" ${
        isEnabled ? "checked" : ""
      }>
                                        <button type="button" class="simple-reset-btn" data-action="reset-setting" data-key="${key}" title="Reset to Default">R</button>
                                    </div>
                                </div>
                            `;
    }

    const gammaValue =
      this.profileManager.activeConfig.postProcessing.colorCorrection.gamma;

    // Only show the "Switch to Advanced Mode" button for GMs
    const advancedModeButton = game.user.isGM
      ? '<button class="advanced-btn" data-action="switch-to-advanced">Switch to Advanced Mode</button>'
      : "";

    return `
                        <style>
                            .map-shine-simple-panel .window-content { background: rgba(30, 30, 30, 0.9); padding: 10px; color: #eee; font-family: "Signika", sans-serif; }
                            .simple-ui-wrapper { display: flex; flex-direction: column; gap: 8px; }
                            .simple-control-row { display: grid; grid-template-columns: 1fr auto; align-items: center; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; border: 1px solid #444; }
                            .simple-control-row label { font-weight: bold; }
                            .simple-widgets { display: flex; align-items: center; gap: 8px; }
                            .simple-slider-wrapper { display: flex; align-items: center; gap: 5px; }
                            .simple-slider-wrapper input[type="range"] { width: 100px; }
                            .simple-slider-wrapper .value-span { width: 30px; text-align: right; font-family: monospace; background: rgba(0,0,0,0.4); padding: 2px 4px; border-radius: 3px; }
                            .simple-ui-footer { margin-top: 5px; padding-top: 10px; border-top: 1px solid #555; text-align: center; }
                            .simple-ui-footer button { padding: 8px 12px; font-weight: bold; cursor: pointer; background: #3a3a3a; border: 1px solid #666; color: #ccc; border-radius: 3px; }
                            .simple-ui-footer button:hover { background: #555; border-color: #888; }
                            .simple-ui-footer button.advanced-btn { background-color: #224466; border-color: #6688aa; color: #cceeff; }
                            .simple-ui-footer button.advanced-btn:hover { background-color: #336699; }
                            .simple-reset-btn { width: 22px; height: 22px; font-size: 10px; font-weight: bold; padding: 0; line-height: 20px; border-radius: 50%; background: #4a4a4a; border: 1px solid #777; color: #ddd; flex-shrink: 0; }
                            .simple-reset-btn:hover { background: #803030; color: #fff; border-color: #c06060; }
                        </style>
                        <div class="simple-ui-wrapper">
                            <div class="simple-control-row" title="Adjust the overall brightness of the scene. Higher values are brighter.">
                                <label for="simple-gamma-slider">Brightness (Gamma)</label>
                                <div class="simple-widgets">
                                    <div class="simple-slider-wrapper">
                                        <input type="range" id="simple-gamma-slider" data-path="postProcessing.colorCorrection.gamma" min="0.5" max="1.5" step="0.01" value="${gammaValue}">
                                        <span class="value-span" id="simple-gamma-slider-value">${gammaValue.toFixed(
                                          2
                                        )}</span>
                                    </div>
                                    <button type="button" class="simple-reset-btn" data-action="reset-setting" data-path="postProcessing.colorCorrection.gamma" title="Reset to Default">R</button>
                                </div>
                            </div>
                            <hr style="border-color: #555;">
                            ${controlsHTML}
                            <div class="simple-ui-footer">
                                ${advancedModeButton}
                            </div>
                        </div>
                    `;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on("input", 'input[type="range"]', this._onSliderInput.bind(this));
    html.on("change", "input", this._onInputChange.bind(this));
    html.on("click", "button[data-action]", this._onButtonClick.bind(this));
    html.on("click", "#weather-test-mode-btn", this._onWeatherTestMode.bind(this));
  }

  _updateSliderValue(elementId, value, step) {
    const valueEl = this.element.find(`#${elementId}-value`);
    if (valueEl) {
      const stepString = String(step);
      const decimals = stepString.includes(".")
        ? stepString.split(".")[1].length
        : 0;
      valueEl.text(Number(value).toFixed(decimals));
    }
  }

  _onSliderInput(event) {
    const el = event.currentTarget;
    this._updateSliderValue(el.id, el.value, el.step);
  }

  async _onInputChange(event) {
    const el = event.currentTarget;
    const path = el.dataset.path;
    const key = el.dataset.key;
    const type = el.dataset.type;

    if (path) {
      // Handle different input types appropriately
      let value;
      if (el.type === "checkbox") {
        value = el.checked;
      } else if (el.type === "radio") {
        value = el.value;
      } else if (el.type === "color" || el.type === "text") {
        value = el.value;
      } else if (el.type === "number" || el.type === "range") {
        value = parseFloat(el.value);
      } else if (el.tagName === "SELECT") {
        value = el.value;
      } else {
        // Fallback: try to parse as number, otherwise use string
        const parsed = parseFloat(el.value);
        value = isNaN(parsed) ? el.value : parsed;
      }
      
      await this.profileManager.recordUserChange(path, value);
    } else if (key && type) {
      // Client override controls
      const settingName = `user-${key}-${type}`;
      const value =
        el.type === "checkbox" ? el.checked : parseInt(el.value, 10);
      await game.settings.set(MODULE_ID, settingName, value);
    }

    this.profileManager.activeConfig =
      this.profileManager._getEffectiveConfig();
    await this.profileManager.updateAllSystemsFromConfig();
  }

  async _onButtonClick(event) {
    const action = event.currentTarget.dataset.action;
    if (action === "switch-to-advanced") {
      await game.settings.set(MODULE_ID, "advanced-ui-mode", true);
      await this.close();
      game.mapShine.showEditor();
    } else if (action === "reset-setting") {
      const el = event.currentTarget;
      const path = el.dataset.path;
      const key = el.dataset.key;

      if (path) {
        // It's a profile setting like Gamma
        const defaultValue = foundry.utils.getProperty(MODULE_DEFAULTS, path);
        if (defaultValue !== undefined) {
          await this.profileManager.recordUserChange(path, defaultValue);
          await this.profileManager.updateAllSystemsFromConfig();
          this.render(); // Re-render this panel to show the updated value
        }
      } else if (key) {
        // It's a client override setting
        // We need to reset both the enabled and intensity settings for this key
        const enabledSettingName = `user-${key}-enabled`;
        const defaultEnabled = game.settings.settings.get(
          `${MODULE_ID}.${enabledSettingName}`
        ).default;
        await game.settings.set(MODULE_ID, enabledSettingName, defaultEnabled);

        const configData = CLIENT_OVERRIDES_CONFIG[key];
        if (configData.intensitySubPath) {
          const intensitySettingName = `user-${key}-intensity`;
          const defaultIntensity = game.settings.settings.get(
            `${MODULE_ID}.${intensitySettingName}`
          ).default;
          await game.settings.set(
            MODULE_ID,
            intensitySettingName,
            defaultIntensity
          );
        }
        // The onChange hooks for these settings handle refreshing the canvas.
        // We just need to re-render this panel to show the new values.
        this.render();
      }
    }
  }

  /**
   * Handle weather test mode button click
   * Runs automated sequence through all weather states
   */
  async _onWeatherTestMode(event) {
    event.preventDefault();
    
    const weatherManager = game.mapShine?.weatherSystemManager;
    if (!weatherManager) {
      ui.notifications.warn("Weather System Manager not available!");
      return;
    }
    
    // Disable button during test
    const button = this.element.find("#weather-test-mode-btn");
    button.prop("disabled", true);
    button.text("🧪 Test Running...");
    button.css("opacity", "0.6");
    
    try {
      ui.notifications.info("Starting Weather Test Sequence...");
      await weatherManager.runTestSequence(5000, 3000);
      ui.notifications.info("Weather Test Sequence Complete!");
    } catch (error) {
      console.error("MapShine | Weather test sequence failed:", error);
      ui.notifications.error("Weather test sequence failed. Check console for details.");
    } finally {
      // Re-enable button
      button.prop("disabled", false);
      button.text("🧪 Run Test Sequence");
      button.css("opacity", "1");
    }
  }

  async close(options) {
    game.mapShine.activeEditor = null;
    game.mapShine.debugger = null;
    // Deactivate the control button when this application is closed by re-rendering the controls.
    // The button's `active` property depends on `game.mapShine.activeEditor`, which is now null.
    ui.controls.render();
    return super.close(options);
  }
}