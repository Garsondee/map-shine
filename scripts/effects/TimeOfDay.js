import { PIXI } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { MODULE_DEFAULTS } from "../config/MODULE_DEFAULTS.js";
import { MaskedEffectLayer } from "./MaskedEffectLayer.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import * as FilterAdapter from "../postfx/filters-adapter.js";

export class TimeOfDayLayer extends MaskedEffectLayer {
  constructor() {
    super({
      maskSuffix: "outdoors",
      effectKey: "timeOfDay",
    });
    this.currentTime = 12.0; // Keep track of the current 24-hour time
    this._sortedKeyframes = [];
    this.filter = null; // The layer will now own its filter instance.
  }

  static getSettingsHTML() {
    const effectKey = "timeOfDay";
    const iconHTML = `<button type="button" class="clock-based-badge" title="This effect is linked to the Day/Night Clock" style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(33, 150, 243, 0.5); background: rgba(33, 150, 243, 0.15); border-radius: 3px; cursor: default; pointer-events: none;"><i class="fas fa-clock" style="font-size: 12px; color: #87ceeb;"></i></button>`;

    const createKeyframeControls = (keyframeName, label) => `
                <details id="details-timeOfDay-${keyframeName}">
                    <summary><span class="accordion-toggle"></span><strong>${label} Settings</strong></summary>
                    <div style="padding-left: 5px;">
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.time`,
                          "Time (Hour)",
                          0,
                          23.99,
                          0.01,
                          "The 24-hour time when this color grade is at its peak."
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.temperature`,
                          "Temperature",
                          -1,
                          1,
                          0.01,
                          "Adjusts color balance between cool (blue) and warm (orange)."
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.tint`,
                          "Tint",
                          -1,
                          1,
                          0.01,
                          "Adjusts color balance between magenta and green."
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.saturation`,
                          "Saturation",
                          0,
                          2,
                          0.01
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.brightness`,
                          "Brightness",
                          -1,
                          1,
                          0.01
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.contrast`,
                          "Contrast",
                          0,
                          3,
                          0.01
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.exposure`,
                          "Exposure",
                          -2,
                          2,
                          0.01
                        )}
                        ${DebuggerUIBuilder._createSliderHTML(
                          `timeOfDay.keyframes.${keyframeName}.gamma`,
                          "Gamma",
                          0.2,
                          2.5,
                          0.01
                        )}
                    </div>
                </details>
            `;

    const content = `
                <p class="description-text">Applies a color grade to outdoor areas of the map based on the time of day set by the Day/Night Clock.</p>
                ${DebuggerUIBuilder._createCheckboxHTML(
                  "timeOfDay.syncToSceneDarkness",
                  "Sync to Scene Darkness",
                  false,
                  "When enabled, the Day/Night clock will control Foundry's global scene darkness level. (GM only)"
                )}
                ${DebuggerUIBuilder._createSliderHTML(
                  "timeOfDay.intensity",
                  "Overall Intensity",
                  0,
                  2,
                  0.05
                )}
                <details id="details-timeOfDay-keyframes">
                    <summary><span class="accordion-toggle"></span><strong>Time Keyframes</strong></summary>
                    <div style="padding-left: 5px;">
                        <p class="description-text">Define the color palettes for different times of day. The system will blend between these keyframes.</p>
                        ${createKeyframeControls("midnight", "Midnight")}
                        ${createKeyframeControls("dawn", "Dawn")}
                        ${createKeyframeControls("midday", "Midday")}
                        ${createKeyframeControls("dusk", "Dusk")}
                        ${createKeyframeControls("twilight", "Twilight")}
                    </div>
                </details>
            `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Time of Day Color Grade",
      content,
      iconHTML
    );
  }

  async rebuildEffect() {
    await this._tearDown({});
    await this._draw({});
    if (game.mapShine.effectTargetManager?.targets) {
      await this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
    }
    if (game.mapShine.profileManager?.activeConfig) {
      await this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    }
  }

  async _draw(options) {
    await super._draw(options);

    try {
      const ToDCtor = FilterAdapter.TimeOfDayColorFilter || globalThis.TimeOfDayColorFilter || null;
      this.filter = safeCreateFilter(ToDCtor, {}, "TimeOfDayLayer");
      // Apply the filter to the primary canvas container, which contains tiles and drawings.
      if (this.filter) {
        safeApplyFilters(
          canvas.primary,
          [...(canvas.primary.filters || []), this.filter],
          "canvas.primary (TimeOfDay)"
        );
      }
    } catch (e) {
      console.error(
        "MapShine | Failed to create TimeOfDayColorFilter for its layer.",
        e
      );
      this.filter = null;
    }

    this.updateFromConfig(game.mapShine.profileManager.activeConfig);
  }

  _sortKeyframes(keyframes) {
    this._sortedKeyframes = Object.values(
      foundry.utils.deepClone(keyframes)
    ).sort((a, b) => a.time - b.time);
  }

  _updateFilterUniforms() {
    if (!this.filter) {
      return;
    }

    const config = game.mapShine.profileManager.activeConfig;
    const todConfig = config.timeOfDay;
    const hasActiveMasks = this.maskSprites.size > 0;

    this.filter.enabled = config.enabled && todConfig.enabled && hasActiveMasks;
    if (!this.filter.enabled) {
      return;
    }

    const u = this.filter.uniforms;
    u.uIntensity = todConfig.intensity ?? 1.0;
    u.uOutdoorsMask = this.getMaskTexture();

    if (this._sortedKeyframes.length < 2) return;

    const extendedKeyframes = [
      ...this._sortedKeyframes,
      {
        ...this._sortedKeyframes[0],
        time: this._sortedKeyframes[0].time + 24,
      },
    ];

    let fromFrame, toFrame;
    let currentTime = this.currentTime;
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
      fromFrame = this._sortedKeyframes[this._sortedKeyframes.length - 1];
      toFrame = extendedKeyframes[extendedKeyframes.length - 1];
    }

    const frameDuration = toFrame.time - fromFrame.time;
    let timeIntoFrame = this.currentTime - fromFrame.time;
    if (timeIntoFrame < 0) timeIntoFrame += 24;

    u.uBlendFactor =
      frameDuration > 0
        ? Math.max(0, Math.min(1, timeIntoFrame / frameDuration))
        : 0;

    const defaults = MODULE_DEFAULTS.timeOfDay.keyframes.midday;
    u.uFromSaturation = fromFrame.saturation ?? defaults.saturation;
    u.uFromBrightness = fromFrame.brightness ?? defaults.brightness;
    u.uFromContrast = fromFrame.contrast ?? defaults.contrast;
    u.uFromExposure = fromFrame.exposure ?? defaults.exposure;
    u.uFromGamma = fromFrame.gamma ?? defaults.gamma;
    u.uFromTemperature = fromFrame.temperature ?? defaults.temperature;
    u.uFromTint = fromFrame.tint ?? defaults.tint;

    u.uToSaturation = toFrame.saturation ?? defaults.saturation;
    u.uToBrightness = toFrame.brightness ?? defaults.brightness;
    u.uToContrast = toFrame.contrast ?? defaults.contrast;
    u.uToExposure = toFrame.exposure ?? defaults.exposure;
    u.uToGamma = toFrame.gamma ?? defaults.gamma;
    u.uToTemperature = toFrame.temperature ?? defaults.temperature;
    u.uToTint = toFrame.tint ?? defaults.tint;
  }

  /**
   * Get atmospheric color tint for clouds and other effects
   * Converts temperature and tint values to RGB color
   * @returns {Object} { r, g, b, intensity, temperature, tint, exposure } - RGB values, intensity, and raw color grading params
   */
  getAtmosphericColor() {
    if (!this.filter || !this.filter.enabled || this._sortedKeyframes.length < 2) {
      return { r: 1.0, g: 1.0, b: 1.0, intensity: 0.0, temperature: 0.0, tint: 0.0, exposure: 0.0 };
    }
    
    const u = this.filter.uniforms;
    const blendFactor = u.uBlendFactor ?? 0;
    
    // Interpolate temperature and tint
    const temperature = u.uFromTemperature + (u.uToTemperature - u.uFromTemperature) * blendFactor;
    const tint = u.uFromTint + (u.uToTint - u.uFromTint) * blendFactor;
    const exposure = u.uFromExposure + (u.uToExposure - u.uFromExposure) * blendFactor;
    
    // Convert temperature to RGB (warm = orange, cool = blue)
    let r = 1.0, g = 1.0, b = 1.0;
    
    // Temperature: >0 = warm (orange/yellow), <0 = cool (blue)
    r += temperature * 0.3;
    g += temperature * 0.15;
    b -= temperature * 0.3;
    
    // Tint: >0 = green, <0 = magenta
    g += tint * 0.2;
    r -= tint * 0.1;
    b -= tint * 0.1;
    
    // Exposure affects overall intensity
    const intensityFromExposure = Math.pow(2.0, exposure);
    r *= intensityFromExposure;
    g *= intensityFromExposure;
    b *= intensityFromExposure;
    
    // Clamp to valid range
    r = Math.max(0.1, Math.min(2.0, r));
    g = Math.max(0.1, Math.min(2.0, g));
    b = Math.max(0.1, Math.min(2.0, b));
    
    // Calculate overall intensity based on exposure (sky brightness)
    // exposure = 0 → intensity = 0.5 (neutral)
    // exposure = +1 → intensity = 1.0 (bright midday)
    // exposure = -1 → intensity = 0.0 (dark night)
    const intensity = Math.max(0.0, Math.min(1.0, exposure * 0.5 + 0.5));
    
    return { r, g, b, intensity, temperature, tint, exposure };
  }

  _onAnimate(deltaTime) {
    super._onAnimate(deltaTime);
    if (this._destroyed) return;
    this._updateFilterUniforms();
  }

  updateTimeUniforms(config) {
    const todConfig = config.timeOfDay;
    if (!todConfig) return;
    
    if (todConfig.currentTime !== undefined) {
      this.currentTime = todConfig.currentTime;
      this._updateFilterUniforms();
    }
  }

  async updateFromConfig(config) {
    const todConfig = config.timeOfDay;
    if (!todConfig) return;

    this.visible = config.enabled && todConfig.enabled;

    if (todConfig.currentTime !== undefined) {
      console.log(
        `MapShine | TimeOfDayLayer updating time to: ${todConfig.currentTime}`
      );
      this.currentTime = todConfig.currentTime;
    }

    if (todConfig.keyframes) {
      this._sortKeyframes(todConfig.keyframes);
    }
  }

  async _tearDown(options) {
    if (this.filter) {
      // Remove the filter from the correct container.
      const cleanedFilters = (canvas.primary.filters || []).filter(
        (f) => f !== this.filter
      );
      safeApplyFilters(canvas.primary, cleanedFilters, "canvas.primary (TimeOfDay teardown)");

      this.filter.destroy();
      this.filter = null;
    }
    await super._tearDown(options);
  }
}


class TimeOfDayColorFilter extends PIXI.Filter {
  constructor() {
    const vertex = `
      attribute vec2 aVertexPosition;
      attribute vec2 aTextureCoord;
      uniform mat3 projectionMatrix;
      varying vec2 vTextureCoord;
      void main(void){
        vTextureCoord = aTextureCoord;
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
      }
    `;
    const fragment = `
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      void main(void){
        gl_FragColor = texture2D(uSampler, vTextureCoord);
      }
    `;
    super(vertex, fragment, {});
  }
}

// Expose to globals for adapter resolution
globalThis.TimeOfDayColorFilter = globalThis.TimeOfDayColorFilter || TimeOfDayColorFilter;