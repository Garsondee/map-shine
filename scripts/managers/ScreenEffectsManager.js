import { UNIVERSAL_EFFECT_DEFAULTS } from "../config/universal-defaults.js";
import { COLOR_CORRECTION_PRESETS } from "../config/color-correction-presets.js";
import { MODULE_ID } from "../config/constants.js";
import { RENDER_ORDER } from "../postfx/constants-adapter.js";
import { LutUtils, cls } from "../postfx/utils-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import {
  ColorCorrectionFilter,
  ChromaticAberrationFilter,
  LensDistortionFilter,
  VignetteFilter,
  FilmGrainFilter,
  PrismFilter,
  TiltShiftFilterConstructor,
  HeatDistortionFilter
} from "../postfx/filters-adapter.js";
import { safeCreateFilter, cleanFilterArray, validateFilter, safeApplyFilters } from "../utils/filter-utils.js";

export class ScreenEffectsManager {
  static _filters = new Map();
  static _container = null;
  static _curveLut = null;

  static getManagedEffectsHTML() {
    const buildSelectiveControls = (pathPrefix) => `
                            <p class="description-text">Isolates a specific color range and applies adjustments to it and/or the rest of the image.</p>
                            <details><summary><span class="accordion-toggle"></span><strong>Color Selection</strong></summary><div style="padding-left: 5px;">
                                <p class="description-text">Define the color range to target.</p>
                                ${DebuggerUIBuilder._createColorPickerHTML(
                                  pathPrefix + "color",
                                  "Target Color"
                                )}
                                
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "hueRange",
                                  "Hue Range",
                                  0,
                                  0.5,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "saturationRange",
                                  "Saturation Range",
                                  0,
                                  0.5,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "targetLuminance",
                                  "Target Luminance",
                                  0,
                                  1,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "luminanceRange",
                                  "Luminance Range",
                                  0,
                                  0.5,
                                  0.01
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "softness",
                                  "Selection Softness",
                                  0.01,
                                  0.5,
                                  0.01,
                                  "How gradual the transition is at the edge of the selection."
                                )}
                            </div></details>
                            <details><summary><span class="accordion-toggle"></span><strong>Adjustments</strong></summary><div style="padding-left: 5px;">
                                ${DebuggerUIBuilder._createCheckboxHTML(
                                  pathPrefix + "invert",
                                  "Invert Selection",
                                  false,
                                  "If checked, the adjustments below will apply to the selected color instead of everything else."
                                )}
                                <hr style="border-color: #555; margin: 4px 0;">
                                <p class="description-text" style="font-weight: bold;">Unselected Colors:</p>
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "desaturation",
                                  "Desaturation Amount",
                                  0,
                                  1,
                                  0.01,
                                  "How much to desaturate colors outside the selected range."
                                )}
                                <hr style="border-color: #555; margin: 4px 0;">
                                <p class="description-text" style="font-weight: bold;">Selected Color:</p>
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "targetSaturation",
                                  "Saturation Boost",
                                  0,
                                  5,
                                  0.05,
                                  "Multiplier for the saturation of the selected color."
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  pathPrefix + "targetBrightness",
                                  "Brightness Boost",
                                  -1,
                                  1,
                                  0.01,
                                  "Adds or subtracts brightness from the selected color."
                                )}
                            </div></details>
                        `;

    const postProcessingHTML = `
                            <h3 class="pane-title">Post-Processing Pipeline</h3>
                            <div class="control-row" style="padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px; display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap: 5px;">
                                    <label for="control-postProcessing-enabled" class="summary-label" title="Master toggle for all effects in this panel."><strong>Enable Post-Processing</strong></label>
                                    <button type="button" class="reset-accordion-btn" data-action="reset-accordion" data-effect-key="postProcessing" title="Reset this section to defaults">R</button>
                                </div>
                                <div class="widget-group"><input type="checkbox" id="control-postProcessing-enabled" data-path="postProcessing.enabled"></div>
                            </div>
                            <hr style="border-color:#444; margin: 6px 0;">
                            <details id="details-postProcessing-colorCorrection" class="accordion-type-pp-color">
                              <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
                                  ${DebuggerUIBuilder._getPostProcessingIconHTML(
                                    "postProcessing-colorCorrection"
                                  )}
                                  <span class="summary-label" style="flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Color Correction</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
                                  <button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="postProcessing-colorCorrection" title="Copy Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-copy" style="font-size: 10px; pointer-events: none;"></i></button>
                                  <button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="postProcessing-colorCorrection" title="Paste Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-paste" style="font-size: 10px; pointer-events: none;"></i></button>
                                  ${DebuggerUIBuilder._createCheckboxHTML(
                                    "postProcessing.colorCorrection.enabled",
                                    "",
                                    true
                                  )}
                                </div>
                              </summary>
                                <div>
                                    <details id="details-postProcessing-cc-presets"><summary><span class="accordion-toggle"></span><strong>Color Presets</strong></summary><div style="padding-left: 5px;">
                                        <p class="description-text">Apply professional color grading presets or save your own custom looks.</p>
                                        ${DebuggerUIBuilder._createPresetSelectHTML(
                                          "postProcessing.colorCorrection.activePreset",
                                          "Preset",
                                          COLOR_CORRECTION_PRESETS
                                        )}
                                        <div style="display: flex; gap: 5px; margin-top: 5px;">
                                            <button id="apply-color-preset-btn" title="Apply the selected preset to all color correction settings" style="flex: 1; height: 24px;">Apply Preset</button>
                                            <button id="save-color-favorite-btn" title="Save current color settings as a favorite" style="flex: 1; height: 24px;">Save as Favorite</button>
                                        </div>
                                        <details id="details-postProcessing-cc-favorites" style="margin-top: 4px;"><summary><span class="accordion-toggle"></span><strong>My Favorites</strong></summary><div style="padding-left: 5px;">
                                            <div id="color-favorites-list" style="margin-top: 5px;">
                                                <p style="color: #888; font-style: italic;">No favorites saved yet.</p>
                                            </div>
                                        </div></details>
                                    </div></details>
                                    <details id="details-postProcessing-cc-basic"><summary><span class="accordion-toggle"></span><strong>Basic Adjustments</strong></summary><div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.saturation",
                                              "Saturation",
                                              0,
                                              4,
                                              0.05
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.brightness",
                                              "Brightness",
                                              -1,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.contrast",
                                              "Contrast",
                                              0,
                                              4,
                                              0.05
                                            )}
                                            ${DebuggerUIBuilder._createCheckboxHTML(
                                              "postProcessing.colorCorrection.invert",
                                              "Invert Colors"
                                            )}
                                    </div></details>
                                    <details id="details-postProcessing-cc-advanced"><summary><span class="accordion-toggle"></span><strong>Advanced Adjustments</strong></summary><div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.exposure",
                                              "Exposure",
                                              -2,
                                              2,
                                              0.05,
                                              "Multiplies scene brightness, simulating camera exposure."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.gamma",
                                              "Gamma",
                                              0.2,
                                              2.5,
                                              0.05,
                                              "Adjusts mid-tones. < 1 lightens, > 1 darkens."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.levels.inBlack",
                                              "Black Point",
                                              0,
                                              1,
                                              0.01,
                                              "Sets the darkest point of the image."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.levels.inWhite",
                                              "White Point",
                                              0,
                                              1,
                                              0.01,
                                              "Sets the brightest point of the image."
                                            )}
                                    </div></details>
                                    <details id="details-postProcessing-cc-whiteBalance"><summary><span class="accordion-toggle"></span><strong>White Balance</strong></summary><div style="padding-left: 5px;">
                                            <p class="description-text">Simulates camera white balance correction.</p>
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.whiteBalance.temperature",
                                              "Temperature",
                                              -1,
                                              1,
                                              0.01,
                                              "Negative values are cooler (blue), positive are warmer (orange)."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.whiteBalance.tint",
                                              "Tint",
                                              -1,
                                              1,
                                              0.01,
                                              "Negative values shift toward magenta, positive toward green."
                                            )}
                                    </div></details>
                                    <details id="details-postProcessing-cc-tint"><summary><span class="accordion-toggle"></span><strong>Global Tint</strong></summary><div style="padding-left: 5px;">
                                            <p class="description-text">Applies a color overlay to the entire scene.</p>
                                            ${DebuggerUIBuilder._createColorPickerHTML(
                                              "postProcessing.colorCorrection.tint.color",
                                              "Tint Color"
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.tint.amount",
                                              "Tint Amount",
                                              0,
                                              1,
                                              0.01
                                            )}
                                    </div></details>
                                    <details id="details-postProcessing-cc-mask"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                      "postProcessing.colorCorrection.mask.enabled",
                                      "Luminance Mask",
                                      true
                                    )}</div></summary><div style="padding-left: 5px;">
                                            <p class="description-text">Applies the color correction only to lit areas of the scene. Requires the Illumination Buffer module.</p>
                                            ${DebuggerUIBuilder._createCheckboxHTML(
                                              "postProcessing.colorCorrection.mask.invert",
                                              "Invert Mask (Affect Dark Areas)"
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.mask.luminanceThreshold",
                                              "Light Threshold",
                                              0,
                                              1,
                                              0.01
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.colorCorrection.mask.softness",
                                              "Edge Softness",
                                              0.01,
                                              1,
                                              0.01
                                            )}
                                    </div></details>
                                    <details id="details-postProcessing-cc-selective"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                      "postProcessing.colorCorrection.selective.enabled",
                                      "Selective Color",
                                      true
                                    )}</div></summary><div style="padding-left: 5px;">
                                        ${buildSelectiveControls(
                                          "postProcessing.colorCorrection.selective."
                                        )}
                                    </div></details>
                                        <details id="details-postProcessing-cc-curves">
                                        <summary>
                                            <span class="accordion-toggle"></span>
                                            <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                                              "postProcessing.colorCorrection.curves.enabled",
                                              "Curves",
                                              true
                                            )}</div>
                                        </summary>
                                        <div style="padding-left: 5px; display: flex; flex-direction: column; align-items: center; padding-top: 5px;">
                                            <p class="description-text">Precise, non-linear control over tonal range, similar to Photoshop's Curves tool.</p>
                                            <div id="curve-channel-selector" style="text-align: center; margin-bottom: 5px; display: flex; gap: 8px; justify-content: center;">
                                                <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-rgb" value="rgb" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-rgb">RGB</label></div>
                                                <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-r" value="red" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-r" style="color:#f88;">R</label></div>
                                                <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-g" value="green" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-g" style="color:#8f8;">G</label></div>
                                                <div class="widget-group"><input type="radio" name="curve-channel" id="curve-channel-b" value="blue" data-path="postProcessing.colorCorrection.curves.activeChannel"><label for="curve-channel-b" style="color:#8af;">B</label></div>
                                            </div>
                                            <div id="curve-editor-container" style="width: 256px; height: 256px; background: #222 url('data:image/svg+xml,%3Csvg width='16' height='16' viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0 H8 V8 H0 Z' fill='%23333'/%3E%3Cpath d='M8 8 H16 V16 H8 Z' fill='%23333'/%3E%3C/svg%3E'); border: 1px solid #555; position: relative;">
                                                <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0; pointer-events: none;">
                                                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="4 4"/>
                                                </svg>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </details>


                            <details id="details-postProcessing-dynamicExposure" class="accordion-type-pp-exposure">
                              <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
                                  ${DebuggerUIBuilder._getPostProcessingIconHTML(
                                    "postProcessing-dynamicExposure"
                                  )}
                                  <span class="summary-label" style="flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Dynamic Exposure (Dazzle)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
                                  <button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="postProcessing-dynamicExposure" title="Copy Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-copy" style="font-size: 10px; pointer-events: none;"></i></button>
                                  <button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="postProcessing-dynamicExposure" title="Paste Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-paste" style="font-size: 10px; pointer-events: none;"></i></button>
                                  ${DebuggerUIBuilder._createCheckboxHTML(
                                    "postProcessing.colorCorrection.dynamicExposure.enabled",
                                    "",
                                    true
                                  )}
                                </div>
                              </summary>
                                <div style="padding-left: 5px;">
                                    <p class="description-text">Creates a "dazzle" effect when a token moves from an area defined as indoors (dark parts of _Outdoors mask) to outdoors (light parts).</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.colorCorrection.dynamicExposure.intensity",
                                      "Dazzle Intensity",
                                      0,
                                      5,
                                      0.1,
                                      "The peak exposure brightness when the effect triggers."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.colorCorrection.dynamicExposure.duration",
                                      "Dazzle Duration (ms)",
                                      500,
                                      20000,
                                      100,
                                      "How long it takes for the dazzle effect to fade back to normal."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.colorCorrection.dynamicExposure.resetPeriod",
                                      "Reset Period (ms)",
                                      1000,
                                      120000,
                                      1000,
                                      "The cooldown time before the effect can be triggered again."
                                    )}
                                </div>
                            </details>

                            <details id="details-postProcessing-vignette" class="accordion-type-pp-lens">
                              <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
                                  ${DebuggerUIBuilder._getPostProcessingIconHTML(
                                    "postProcessing-vignette"
                                  )}
                                  <span class="summary-label" style="flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Vignette</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
                                  <button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="postProcessing-vignette" title="Copy Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-copy" style="font-size: 10px; pointer-events: none;"></i></button>
                                  <button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="postProcessing-vignette" title="Paste Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-paste" style="font-size: 10px; pointer-events: none;"></i></button>
                                  ${DebuggerUIBuilder._createCheckboxHTML(
                                    "postProcessing.vignette.enabled",
                                    "",
                                    true
                                  )}
                                </div>
                              </summary>
                                <div>${DebuggerUIBuilder._createSliderHTML(
                                  "postProcessing.vignette.amount",
                                  "Amount",
                                  0,
                                  1,
                                  0.01
                                )}${DebuggerUIBuilder._createSliderHTML(
      "postProcessing.vignette.softness",
      "Softness",
      0.01,
      1,
      0.01
    )}</div>
                            </details>
                            <details id="details-postProcessing-lensDistortion" class="accordion-type-pp-lens">
                              <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
                                  ${DebuggerUIBuilder._getPostProcessingIconHTML(
                                    "postProcessing-lensDistortion"
                                  )}
                                  <span class="summary-label" style="flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Lens Distortion</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
                                  <button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="postProcessing-lensDistortion" title="Copy Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-copy" style="font-size: 10px; pointer-events: none;"></i></button>
                                  <button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="postProcessing-lensDistortion" title="Paste Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-paste" style="font-size: 10px; pointer-events: none;"></i></button>
                                  ${DebuggerUIBuilder._createCheckboxHTML(
                                    "postProcessing.lensDistortion.enabled",
                                    "",
                                    true
                                  )}
                                </div>
                              </summary>
                                <div>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.lensDistortion.amount",
                                      "Amount",
                                      -0.2,
                                      0.2,
                                      0.001
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.lensDistortion.centerX",
                                      "Center X",
                                      0,
                                      1,
                                      0.01
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.lensDistortion.centerY",
                                      "Center Y",
                                      0,
                                      1,
                                      0.01
                                    )}
                                </div>
                            </details>
                            <details id="details-postProcessing-chromaticAberration" class="accordion-type-pp-lens">
                              <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
                                  ${DebuggerUIBuilder._getPostProcessingIconHTML(
                                    "postProcessing-chromaticAberration"
                                  )}
                                  <span class="summary-label" style="flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Chromatic Aberration</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
                                  <button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="postProcessing-chromaticAberration" title="Copy Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-copy" style="font-size: 10px; pointer-events: none;"></i></button>
                                  <button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="postProcessing-chromaticAberration" title="Paste Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-paste" style="font-size: 10px; pointer-events: none;"></i></button>
                                  ${DebuggerUIBuilder._createCheckboxHTML(
                                    "postProcessing.chromaticAberration.enabled",
                                    "",
                                    true
                                  )}
                                </div>
                              </summary>
                                <div>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.chromaticAberration.amount",
                                      "Amount",
                                      -0.05,
                                      0.05,
                                      0.001
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.chromaticAberration.centerX",
                                      "Center X",
                                      0,
                                      1,
                                      0.01
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.chromaticAberration.centerY",
                                      "Center Y",
                                      0,
                                      1,
                                      0.01
                                    )}
                                </div>
                            </details>
                            <details id="details-postProcessing-grain" class="accordion-type-pp-texture">
                              <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
                                  ${DebuggerUIBuilder._getPostProcessingIconHTML(
                                    "postProcessing-grain"
                                  )}
                                  <span class="summary-label" style="flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Grain / Digital Noise</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
                                  <button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="postProcessing-grain" title="Copy Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-copy" style="font-size: 10px; pointer-events: none;"></i></button>
                                  <button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="postProcessing-grain" title="Paste Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-paste" style="font-size: 10px; pointer-events: none;"></i></button>
                                  ${DebuggerUIBuilder._createCheckboxHTML(
                                    "postProcessing.grain.enabled",
                                    "",
                                    true
                                  )}
                                </div>
                              </summary>
                                <div>
                                    <p class="description-text">Adds a procedural film grain or digital noise effect over the final image.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.grain.intensity",
                                      "Intensity",
                                      0,
                                      1,
                                      0.01,
                                      "Overall strength of the grain."
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.grain.size",
                                      "Size",
                                      0.1,
                                      15,
                                      0.05,
                                      "Scale of the grain pattern. Smaller values = larger grain."
                                    )}
                                    ${DebuggerUIBuilder._createCheckboxHTML(
                                      "postProcessing.grain.monochromatic",
                                      "Monochromatic",
                                      false,
                                      "If checked, the grain will be black and white. If unchecked, it will be colored."
                                    )}
                                    <details>
                                        <summary><span class="accordion-toggle"></span><strong>Luminance Response</strong></summary>
                                        <div style="padding-left: 8px;">
                                            <p class="description-text">Controls how much grain appears in dark vs. bright areas of the scene.</p>
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.grain.luminanceResponse.shadows",
                                              "Shadows",
                                              0,
                                              1,
                                              0.01,
                                              "Grain intensity in the darkest parts of the image."
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "postProcessing.grain.luminanceResponse.highlights",
                                              "Highlights",
                                              0,
                                              1,
                                              0.01,
                                              "Grain intensity in the brightest parts of the image."
                                            )}
                                        </div>
                                    </details>
                                </div>
                            </details>
                            <details id="details-postProcessing-tiltShift" class="accordion-type-pp-lens">
                              <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
                                  ${DebuggerUIBuilder._getPostProcessingIconHTML(
                                    "postProcessing-tiltShift"
                                  )}
                                  <span class="summary-label" style="flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Tilt Shift</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
                                  <button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="postProcessing-tiltShift" title="Copy Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-copy" style="font-size: 10px; pointer-events: none;"></i></button>
                                  <button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="postProcessing-tiltShift" title="Paste Settings" style="width: 20px; height: 20px; padding: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #555; background: rgba(255, 255, 255, 0.05); border-radius: 3px; cursor: pointer; transition: all 0.2s;"><i class="fas fa-paste" style="font-size: 10px; pointer-events: none;"></i></button>
                                  ${DebuggerUIBuilder._createCheckboxHTML(
                                    "postProcessing.tiltShift.enabled",
                                    "",
                                    true
                                  )}
                                </div>
                              </summary>
                                <div>
                                    <p class="description-text">Simulates a tilt-shift lens, blurring the top and bottom of the screen. Requires a library that may not be bundled with all Foundry versions.</p>
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.tiltShift.blur",
                                      "Blur",
                                      0,
                                      50,
                                      1
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.tiltShift.gradientBlur",
                                      "Gradient Size",
                                      0,
                                      5000,
                                      10
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.tiltShift.startX",
                                      "Start X",
                                      0,
                                      1,
                                      0.01
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.tiltShift.startY",
                                      "Start Y",
                                      0,
                                      1,
                                      0.01
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.tiltShift.endX",
                                      "End X",
                                      0,
                                      1,
                                      0.01
                                    )}
                                    ${DebuggerUIBuilder._createSliderHTML(
                                      "postProcessing.tiltShift.endY",
                                      "End Y",
                                      0,
                                      1,
                                      0.01
                                    )}
                                </div>
                            </details>
                        `;

    return {
      postProcessing: postProcessingHTML,
      otherEffects: [],
    };
  }

  static initialize(container) {
    if (!this._container) {
      this._container = container;
    }
  }

  static addFilter(key, filter) {
    if (!this._container) return;
    this.removeFilter(key);
    
    // Validate filter before adding
    if (!validateFilter(filter, `ScreenEffectsManager.${key}`)) {
      console.error(`Map Shine | Cannot add invalid filter: ${key}`);
      return;
    }
    
    this._filters.set(key, filter);
    this._updateContainerFilters();
  }

  static getFilter(key) {
    return this._filters.get(key);
  }

  static removeFilter(key) {
    if (!this._container || !this._filters.has(key)) return;
    const filter = this._filters.get(key);
    filter?.destroy();
    this._filters.delete(key);
    this._updateContainerFilters();
  }

  static _updateContainerFilters() {
    if (!this._container) return;

    const RENDER_ORDER = [
      "tiltShift",
      "prism",
      "heatDistortion",
      "colorCorrection",
      "pauseEffect",
      "combatEffect",
      "filmGrain",
      "vignette",
      "lensDistortion",
      "chromaticAberration",
    ];

    let managedFilterClasses = [
      PrismFilter,
      HeatDistortionFilter,
      VignetteFilter,
      LensDistortionFilter,
      ChromaticAberrationFilter,
      ColorCorrectionFilter,
      FilmGrainFilter,
    ].filter((ctor) => typeof ctor === "function");

    const TiltShiftFilterConstructor =
      PIXI.filters?.TiltShiftFilter ||
      (globalThis.filters && globalThis.filters.TiltShiftFilter);
    if (typeof TiltShiftFilterConstructor === "function")
      managedFilterClasses.push(TiltShiftFilterConstructor);

    // Clean other filters to remove any corrupt ones
    const otherFilters =
      cleanFilterArray(
        (this._container.filters || []).filter(
          (f) => !managedFilterClasses.some((ctor) => typeof ctor === "function" && f instanceof ctor)
        ),
        "ScreenEffectsManager.otherFilters"
      ) || [];

    // Validate and collect managed filters
    const orderedManagedFilters = RENDER_ORDER.map((key) => ({
      key,
      filter: this._filters.get(key)
    })).filter(({ key, filter }) => {
      if (!filter) return false;
      if (!validateFilter(filter, `ScreenEffectsManager.${key}`)) {
        console.warn(`Map Shine | Removing corrupt filter from ScreenEffectsManager: ${key}`);
        this._filters.delete(key);
        return false;
      }
      return true;
    }).map(({ filter }) => filter);

    const newFilters = [...otherFilters, ...orderedManagedFilters];

    // Use safe filter application
    safeApplyFilters(this._container, newFilters, "ScreenEffectsManager.worldContainer");
  }

  static setupAllGlobalFilters() {
    const ppErrors = [];
    const heatErrors = [];

    if (typeof PrismFilter === "function") {
      const prismFilter = safeCreateFilter(PrismFilter, {}, "ScreenEffects.prism");
      if (prismFilter) {
        this.addFilter("prism", prismFilter);
        systemStatus.update("shaders", "prism", {
          state: "ok",
          message: "Compiled successfully.",
        });
      } else {
        console.warn("MapShine | PrismFilter creation returned null (skipping)");
      }
    } else {
      // Not available in this environment
    }

    if (typeof HeatDistortionFilter === "function") {
      const heatFilter = safeCreateFilter(HeatDistortionFilter, {}, "ScreenEffects.heatDistortion");
      if (heatFilter) {
        this.addFilter("heatDistortion", heatFilter);
      } else {
        heatErrors.push("HeatDistortion");
      }
    }

    /* DIAGNOSTIC: TimeOfDayColorFilter is now managed by its own layer, not globally.
        try {
          this.addFilter("timeOfDay", new TimeOfDayColorFilter());
        } catch (e) {
          ppErrors.push("TimeOfDay");
        }
        */

    systemStatus.update("shaders", "heat", {
      state: heatErrors.length === 0 ? "ok" : "error",
      message:
        heatErrors.length === 0
          ? `Compiled successfully.`
          : `Failed to compile: ${heatErrors.join(", ")}`,
    });

    if (typeof VignetteFilter === "function") {
      const vignetteFilter = safeCreateFilter(VignetteFilter, {}, "ScreenEffects.vignette");
      if (vignetteFilter) this.addFilter("vignette", vignetteFilter);
    }
    
    if (typeof LensDistortionFilter === "function") {
      const lensFilter = safeCreateFilter(LensDistortionFilter, {}, "ScreenEffects.lensDistortion");
      if (lensFilter) this.addFilter("lensDistortion", lensFilter);
    }
    
    if (typeof ChromaticAberrationFilter === "function") {
      const chromFilter = safeCreateFilter(ChromaticAberrationFilter, {}, "ScreenEffects.chromaticAberration");
      if (chromFilter) this.addFilter("chromaticAberration", chromFilter);
    }
    
    // Initialize each filter separately to prevent cascade failures
    if (typeof ColorCorrectionFilter === "function") {
      const ccFilter = safeCreateFilter(ColorCorrectionFilter, {}, "ScreenEffects.colorCorrection");
      if (ccFilter) this.addFilter("colorCorrection", ccFilter);
    }
    
    if (typeof ColorCorrectionFilter === "function") {
      const pauseFilter = safeCreateFilter(ColorCorrectionFilter, {}, "ScreenEffects.pauseEffect");
      if (pauseFilter) {
        pauseFilter.enabled = false;
        this.addFilter("pauseEffect", pauseFilter);
      }
    }
    
    if (typeof ColorCorrectionFilter === "function") {
      const combatFilter = safeCreateFilter(ColorCorrectionFilter, {}, "ScreenEffects.combatEffect");
      if (combatFilter) {
        combatFilter.enabled = false;
        this.addFilter("combatEffect", combatFilter);
      }
    }
    
    if (typeof FilmGrainFilter === "function") {
      const filmGrainFilter = safeCreateFilter(FilmGrainFilter, {}, "ScreenEffects.filmGrain");
      if (filmGrainFilter) this.addFilter("filmGrain", filmGrainFilter);
    }

    const TiltShiftFilterConstructor =
      PIXI.filters?.TiltShiftFilter ||
      (globalThis.filters && globalThis.filters.TiltShiftFilter);
    if (TiltShiftFilterConstructor) {
      const tiltShiftFilter = safeCreateFilter(TiltShiftFilterConstructor, {}, "ScreenEffects.tiltShift");
      if (tiltShiftFilter) {
        this.addFilter("tiltShift", tiltShiftFilter);
      } else {
        ppErrors.push("TiltShift (Creation Failed)");
      }
    } else {
      ppErrors.push("TiltShift (Bundling Failed)");
    }

    systemStatus.update("shaders", "postProcessing", {
      state: ppErrors.length === 0 ? "ok" : "error",
      message:
        ppErrors.length === 0
          ? `Compiled successfully.`
          : `Failed to compile: ${ppErrors.join(", ")}`,
    });
  }

  static updateAllFiltersFromConfig(config) {
    const pp = config.postProcessing;

    const universalSettings = {
      pauseEffect: {
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
      },
      combatEffect: {
        colorCorrection: {
          ...UNIVERSAL_EFFECT_DEFAULTS.combatEffect.colorCorrection,
          enabled: game.settings.get(
            MODULE_ID,
            "universal.combatEffect.colorCorrection.enabled"
          ),
          saturation: game.settings.get(
            MODULE_ID,
            "universal.combatEffect.colorCorrection.saturation"
          ),
          brightness: game.settings.get(
            MODULE_ID,
            "universal.combatEffect.colorCorrection.brightness"
          ),
          contrast: game.settings.get(
            MODULE_ID,
            "universal.combatEffect.colorCorrection.contrast"
          ),
        },
      },
    };

    const prismFilter = this.getFilter("prism");
    if (PrismFilter && prismFilter instanceof PrismFilter) {
      const pConfig = config.prism;
      prismFilter.enabled = config.enabled && pConfig.enabled;
      const u = prismFilter.uniforms;
      u.uIntensity = pConfig.intensity;
      u.uAngleRad = pConfig.angle * (Math.PI / 180.0);
      u.uThreshold = pConfig.threshold;
      u.uSoftness = pConfig.softness;
      u.uDistortionStrength = pConfig.distortionStrength;
      const screen = canvas?.app?.screen;
      if (screen) {
        u.uTexelSize = [1 / screen.width, 1 / screen.height];
      }
    }
    const tiltShiftFilter = this.getFilter("tiltShift");

    const TiltShiftFilterConstructor = PIXI.filters?.TiltShiftFilter;
    if (
      tiltShiftFilter &&
      TiltShiftFilterConstructor &&
      tiltShiftFilter instanceof TiltShiftFilterConstructor
    ) {
      const tsConfig = pp.tiltShift;
      tiltShiftFilter.enabled =
        config.enabled && pp.enabled && tsConfig.enabled;
      tiltShiftFilter.blur = tsConfig.blur;
      tiltShiftFilter.gradientBlur = tsConfig.gradientBlur;
      const screen = canvas.app.screen;
      if (tiltShiftFilter.start) {
        tiltShiftFilter.start.x = tsConfig.startX * screen.width;
        tiltShiftFilter.start.y = tsConfig.startY * screen.height;
      }
      if (tiltShiftFilter.end) {
        tiltShiftFilter.end.x = tsConfig.endX * screen.width;
        tiltShiftFilter.end.y = tsConfig.endY * screen.height;
      }
    }

    const grainFilter = this.getFilter("filmGrain");
    if (FilmGrainFilter && grainFilter instanceof FilmGrainFilter) {
      const gConfig = pp.grain;
      grainFilter.enabled = config.enabled && pp.enabled && gConfig.enabled;
      grainFilter.intensity = gConfig.intensity;
      grainFilter.size = gConfig.size;
      grainFilter.monochromatic = gConfig.monochromatic;
      grainFilter.luminanceResponse = [
        gConfig.luminanceResponse.shadows,
        gConfig.luminanceResponse.highlights,
      ];
    }

    const vignetteFilter = this.getFilter("vignette");
    if (VignetteFilter && vignetteFilter instanceof VignetteFilter) {
      vignetteFilter.enabled =
        config.enabled && pp.enabled && pp.vignette.enabled;
      vignetteFilter.amount = pp.vignette.amount;
      vignetteFilter.softness = pp.vignette.softness;
    }

    const lensDistortionFilter = this.getFilter("lensDistortion");
    if (LensDistortionFilter && lensDistortionFilter instanceof LensDistortionFilter) {
      lensDistortionFilter.enabled =
        config.enabled && pp.enabled && pp.lensDistortion.enabled;
      lensDistortionFilter.amount = pp.lensDistortion.amount;
      lensDistortionFilter.center = [
        pp.lensDistortion.centerX,
        pp.lensDistortion.centerY,
      ];
    }

    const caFilter = this.getFilter("chromaticAberration");
    if (ChromaticAberrationFilter && caFilter instanceof ChromaticAberrationFilter) {
      caFilter.enabled =
        config.enabled && pp.enabled && pp.chromaticAberration.enabled;
      caFilter.amount = pp.chromaticAberration.amount;
      caFilter.center = [
        pp.chromaticAberration.centerX,
        pp.chromaticAberration.centerY,
      ];
    }

    const ccFilter = this.getFilter("colorCorrection");
    if (ColorCorrectionFilter && ccFilter instanceof ColorCorrectionFilter) {
      const ccConfig = pp.colorCorrection;
      ccFilter.enabled = config.enabled && pp.enabled && ccConfig.enabled;
      const u = ccFilter.uniforms;
      u.uDynamicExposure = ccConfig.dynamicExposure;
      u.uSaturation = ccConfig.saturation;
      u.uBrightness = ccConfig.brightness;
      u.uContrast = ccConfig.contrast;
      u.uInvert = ccConfig.invert;
      u.uExposure = ccConfig.exposure;
      u.uGamma = ccConfig.gamma;
      u.uInBlack = ccConfig.levels.inBlack;
      u.uInWhite = ccConfig.levels.inWhite;
      u.uTemperature = ccConfig.whiteBalance.temperature;
      u.uWbTint = ccConfig.whiteBalance.tint;
      u.uTintColor = hexToRgbArray(ccConfig.tint.color);
      u.uTintAmount = ccConfig.tint.amount;
      const sel = ccConfig.selective;
      u.uSelectiveEnabled = sel.enabled;
      u.uSelectiveColor = hexToRgbArray(sel.color);
      u.uSelectiveHueRange = sel.hueRange;
      u.uSelectiveSatRange = sel.saturationRange;
      u.uSelectiveLumRange = sel.luminanceRange;
      u.uSelectiveTargetLum = sel.targetLuminance;
      u.uSelectiveSoftness = sel.softness;
      u.uSelectiveInvert = sel.invert;
      u.uSelectiveDesaturation = sel.desaturation;
      u.uSelectiveTargetSaturation = sel.targetSaturation;
      u.uSelectiveTargetBrightness = sel.targetBrightness;
      const curvesConfig = ccConfig.curves;
      if (curvesConfig) {
        u.uCurvesEnabled = curvesConfig.enabled;
        if (curvesConfig.enabled) {
          if (this._curveLut) this._curveLut.destroy(true);
          this._curveLut = LutUtils.generateCurveLut(curvesConfig);
          u.uCurveLUT = this._curveLut;
        }
      } else {
        u.uCurvesEnabled = false;
      }
    }

    const pauseFilter = this.getFilter("pauseEffect");
    if (ColorCorrectionFilter && pauseFilter instanceof ColorCorrectionFilter) {
      const pauseConfig = universalSettings.pauseEffect.colorCorrection;
      const u = pauseFilter.uniforms;
      u.uSaturation = pauseConfig.saturation;
      u.uBrightness = pauseConfig.brightness;
      u.uContrast = pauseConfig.contrast;
      u.uInvert = pauseConfig.invert;
      u.uExposure = pauseConfig.exposure;
      u.uGamma = pauseConfig.gamma;
      u.uInBlack = pauseConfig.levels.inBlack;
      u.uInWhite = pauseConfig.levels.inWhite;
      u.uTemperature = pauseConfig.whiteBalance.temperature;
      u.uWbTint = pauseConfig.whiteBalance.tint;
      u.uTintColor = hexToRgbArray(pauseConfig.tint.color);
      u.uTintAmount = pauseConfig.tint.amount;
      const sel = pauseConfig.selective;
      u.uSelectiveEnabled = sel.enabled;
      u.uSelectiveColor = hexToRgbArray(sel.color);
      u.uSelectiveHueRange = sel.hueRange;
      u.uSelectiveSatRange = sel.saturationRange;
      u.uSelectiveLumRange = sel.luminanceRange;
      u.uSelectiveTargetLum = sel.targetLuminance;
      u.uSelectiveSoftness = sel.softness;
      u.uSelectiveInvert = sel.invert;
      u.uSelectiveDesaturation = sel.desaturation;
      u.uSelectiveTargetSaturation = sel.targetSaturation;
      u.uSelectiveTargetBrightness = sel.targetBrightness;
    }

    const combatFilter = this.getFilter("combatEffect");
    if (ColorCorrectionFilter && combatFilter instanceof ColorCorrectionFilter) {
      const combatConfig = universalSettings.combatEffect.colorCorrection;
      const u = combatFilter.uniforms;
      u.uSaturation = combatConfig.saturation;
      u.uBrightness = combatConfig.brightness;
      u.uContrast = combatConfig.contrast;
      u.uInvert = combatConfig.invert;
      u.uExposure = combatConfig.exposure;
      u.uGamma = combatConfig.gamma;
      u.uInBlack = combatConfig.levels.inBlack;
      u.uInWhite = combatConfig.levels.inWhite;
      u.uTemperature = combatConfig.whiteBalance.temperature;
      u.uWbTint = combatConfig.whiteBalance.tint;
      u.uTintColor = hexToRgbArray(combatConfig.tint.color);
      u.uTintAmount = combatConfig.tint.amount;
      const sel = combatConfig.selective;
      u.uSelectiveEnabled = sel.enabled;
      u.uSelectiveColor = hexToRgbArray(sel.color);
      u.uSelectiveHueRange = sel.hueRange;
      u.uSelectiveSatRange = sel.saturationRange;
      u.uSelectiveLumRange = sel.luminanceRange;
      u.uSelectiveTargetLum = sel.targetLuminance;
      u.uSelectiveSoftness = sel.softness;
      u.uSelectiveInvert = sel.invert;
      u.uSelectiveDesaturation = sel.desaturation;
      u.uSelectiveTargetSaturation = sel.targetSaturation;
      u.uSelectiveTargetBrightness = sel.targetBrightness;
    }
  }

  /**
   * Updates only a specific filter based on the configuration path.
   * This is the targeted update version that avoids updating all filters.
   * @param {string} path - The configuration path (e.g., "postProcessing.vignette.amount")
   * @param {Object} config - The full configuration object
   */
  static updateFilterFromPath(path, config) {
    const pp = config.postProcessing;
    const pathParts = path.split(".");

    // Handle prism filter (top-level, not in postProcessing)
    if (pathParts[0] === "prism") {
      const prismFilter = this.getFilter("prism");
      if (prismFilter instanceof PrismFilter) {
        const pConfig = config.prism;
        prismFilter.enabled = config.enabled && pConfig.enabled;
        const u = prismFilter.uniforms;
        u.uIntensity = pConfig.intensity;
        u.uAngleRad = pConfig.angle * (Math.PI / 180.0);
        u.uThreshold = pConfig.threshold;
        u.uSoftness = pConfig.softness;
        u.uDistortionStrength = pConfig.distortionStrength;
        const screen = canvas?.app?.screen;
        if (screen) {
          u.uTexelSize = [1 / screen.width, 1 / screen.height];
        }
      }
      return;
    }

    // All other filters are in postProcessing
    if (pathParts[0] !== "postProcessing" || pathParts.length < 2) {
      return;
    }

    const filterKey = pathParts[1]; // e.g., "vignette", "colorCorrection", etc.

    switch (filterKey) {
      case "vignette": {
        const vignetteFilter = this.getFilter("vignette");
        if (vignetteFilter instanceof VignetteFilter) {
          vignetteFilter.enabled =
            config.enabled && pp.enabled && pp.vignette.enabled;
          vignetteFilter.amount = pp.vignette.amount;
          vignetteFilter.softness = pp.vignette.softness;
        }
        break;
      }

      case "lensDistortion": {
        const lensDistortionFilter = this.getFilter("lensDistortion");
        if (lensDistortionFilter instanceof LensDistortionFilter) {
          lensDistortionFilter.enabled =
            config.enabled && pp.enabled && pp.lensDistortion.enabled;
          lensDistortionFilter.amount = pp.lensDistortion.amount;
          lensDistortionFilter.center = [
            pp.lensDistortion.centerX,
            pp.lensDistortion.centerY,
          ];
        }
        break;
      }

      case "chromaticAberration": {
        const caFilter = this.getFilter("chromaticAberration");
        if (caFilter instanceof ChromaticAberrationFilter) {
          caFilter.enabled =
            config.enabled && pp.enabled && pp.chromaticAberration.enabled;
          caFilter.amount = pp.chromaticAberration.amount;
          caFilter.center = [
            pp.chromaticAberration.centerX,
            pp.chromaticAberration.centerY,
          ];
        }
        break;
      }

      case "tiltShift": {
        const tiltShiftFilter = this.getFilter("tiltShift");
        const TiltShiftFilterConstructor = PIXI.filters?.TiltShiftFilter;
        if (
          tiltShiftFilter &&
          TiltShiftFilterConstructor &&
          tiltShiftFilter instanceof TiltShiftFilterConstructor
        ) {
          const tsConfig = pp.tiltShift;
          tiltShiftFilter.enabled =
            config.enabled && pp.enabled && tsConfig.enabled;
          tiltShiftFilter.blur = tsConfig.blur;
          tiltShiftFilter.gradientBlur = tsConfig.gradientBlur;
          const screen = canvas.app.screen;
          if (tiltShiftFilter.start) {
            tiltShiftFilter.start.x = tsConfig.startX * screen.width;
            tiltShiftFilter.start.y = tsConfig.startY * screen.height;
          }
          if (tiltShiftFilter.end) {
            tiltShiftFilter.end.x = tsConfig.endX * screen.width;
            tiltShiftFilter.end.y = tsConfig.endY * screen.height;
          }
        }
        break;
      }

      case "grain": {
        const grainFilter = this.getFilter("filmGrain");
        if (grainFilter instanceof FilmGrainFilter) {
          const gConfig = pp.grain;
          grainFilter.enabled = config.enabled && pp.enabled && gConfig.enabled;
          grainFilter.intensity = gConfig.intensity;
          grainFilter.size = gConfig.size;
          grainFilter.monochromatic = gConfig.monochromatic;
          grainFilter.luminanceResponse = [
            gConfig.luminanceResponse.shadows,
            gConfig.luminanceResponse.highlights,
          ];
        }
        break;
      }

      case "colorCorrection": {
        const ccFilter = this.getFilter("colorCorrection");
        if (ccFilter instanceof ColorCorrectionFilter) {
          const ccConfig = pp.colorCorrection;
          ccFilter.enabled = config.enabled && pp.enabled && ccConfig.enabled;
          const u = ccFilter.uniforms;
          u.uDynamicExposure = ccConfig.dynamicExposure;
          u.uSaturation = ccConfig.saturation;
          u.uBrightness = ccConfig.brightness;
          u.uContrast = ccConfig.contrast;
          u.uInvert = ccConfig.invert;
          u.uExposure = ccConfig.exposure;
          u.uGamma = ccConfig.gamma;
          u.uInBlack = ccConfig.levels.inBlack;
          u.uInWhite = ccConfig.levels.inWhite;
          u.uTemperature = ccConfig.whiteBalance.temperature;
          u.uWbTint = ccConfig.whiteBalance.tint;
          u.uTintColor = hexToRgbArray(ccConfig.tint.color);
          u.uTintAmount = ccConfig.tint.amount;
          const sel = ccConfig.selective;
          u.uSelectiveEnabled = sel.enabled;
          u.uSelectiveColor = hexToRgbArray(sel.color);
          u.uSelectiveHueRange = sel.hueRange;
          u.uSelectiveSatRange = sel.saturationRange;
          u.uSelectiveLumRange = sel.luminanceRange;
          u.uSelectiveTargetLum = sel.targetLuminance;
          u.uSelectiveSoftness = sel.softness;
          u.uSelectiveInvert = sel.invert;
          u.uSelectiveDesaturation = sel.desaturation;
          u.uSelectiveTargetSaturation = sel.targetSaturation;
          u.uSelectiveTargetBrightness = sel.targetBrightness;
          const curvesConfig = ccConfig.curves;
          if (curvesConfig) {
            u.uCurvesEnabled = curvesConfig.enabled;
            if (curvesConfig.enabled) {
              if (this._curveLut) this._curveLut.destroy(true);
              this._curveLut = LutUtils.generateCurveLut(curvesConfig);
              u.uCurveLUT = this._curveLut;
            }
          } else {
            u.uCurvesEnabled = false;
          }
        }
        break;
      }

      default:
        // Unknown filter - fall back to updating all filters
        console.warn(
          `MapShine | Unknown filter key: ${filterKey}, updating all filters`
        );
        this.updateAllFiltersFromConfig(config);
        break;
    }
  }

  static updateFrame(deltaTimeInSeconds) {
    if (!this._container || this._filters.size === 0) return;

    // Update time-sensitive filters like Film Grain
    for (const filter of this._filters.values()) {
      if (typeof filter.update === "function") {
        filter.update(deltaTimeInSeconds);
      }
    }
  }

  static tearDown() {
    if (!this._container) return;
    
    // Clean up curve LUT texture if it exists
    try {
      if (this._curveLut) {
        this._curveLut.destroy(true);
        this._curveLut = null;
      }
    } catch (err) {
      console.warn("Map Shine | Error destroying curve LUT:", err);
    }
    
    // Destroy filters with defensive error handling
    for (const filter of this._filters.values()) {
      try {
        // Clean up any texture uniforms before destroying the filter
        if (filter.uniforms) {
          for (const uniformKey in filter.uniforms) {
            const uniform = filter.uniforms[uniformKey];
            // Check if uniform is a texture and nullify it to prevent reference errors
            if (uniform && typeof uniform === 'object' && uniform.baseTexture) {
              filter.uniforms[uniformKey] = null;
            }
          }
        }
        filter?.destroy();
      } catch (err) {
        console.warn("Map Shine | Error destroying filter:", err);
      }
    }
    this._filters.clear();

    if (this._container.filters) {
      this._container.filters = null;
    }
    this._container = null;
    console.log(
      "Map Shine | ScreenEffectsManager fully torn down for scene transition."
    );
  }
}