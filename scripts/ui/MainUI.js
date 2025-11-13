import { PIXI, WRAP_MODES } from "../pixi-adapter.js";
import { Event, ResizeObserver, URL, Node } from "../dom-adapter.js";
import { Canvas, CONST, TILE_OCCLUSION_MODES } from "../foundry-adapter.js";
import { LazyAccordionManager, MapShineClock, CurveEditor, Option, ConfigBuilder, TEMP_CLIPBOARD_STORAGE, check } from "./ui-adapter.js";
import { MetallicShineLayer, TimeOfDayLayer, BuildingShadowsLayer, WaterFXLayer, FoamLayer, CloudShadowsLayer, IridescenceLayer, HeatDistortionLayer, CanopyLayer, BushLayer, TreeLayer, StructuralShadowsLayer, AmbientLayer, GroundGlowLayer, PrismLayer, LightningLayer, ParticleLayer, WeatherParticleLayer, CloudDepthLayer, OverheadEffectLayer, PhysicsRopeLayer, MapPointsLayer, DiagnosticLayer } from "./layers-ui-adapter.js";
import { ScreenEffectsManager } from "../managers/ScreenEffectsManager.js";
import { MapPointsManager } from "../managers/map-points-adapter.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { TextureAutoLoader } from "../utils/TextureAutoLoader.js";
import { FontLoader } from "../utils/FontLoader.js";
import { ParticleEffectController } from "../effects/Particles.js";
import { MODULE_DEFAULTS } from "../config/MODULE_DEFAULTS.js";
import { UNIVERSAL_EFFECT_DEFAULTS } from "../config/universal-defaults.js";
import { MODULE_ID } from "../config/constants.js";
import { FONT_CHOICES } from "../config/fonts.js";
import { EFFECT_SOURCE_OPTIONS } from "../config/presets.js";
import { ROPE_TYPE_PRESETS } from "../config/presets.js";

export class DebuggerUIBuilder {
  constructor() {
    // Performance tracking
    this._perfStats = {
      buildRootElement: { calls: 0, totalTime: 0, maxTime: 0 },
      _buildMainControlsSection: { calls: 0, totalTime: 0, maxTime: 0 },
      _getEffectSections: { calls: 0, totalTime: 0, maxTime: 0 },
      _buildProfileSection: { calls: 0, totalTime: 0, maxTime: 0 },
      _createSliderHTML: { calls: 0, totalTime: 0, maxTime: 0 },
      _createAccordionHTML: { calls: 0, totalTime: 0, maxTime: 0 }
    };
    this._perfThresholds = {
      buildRootElement: 50,  // Warn if > 50ms
      _buildMainControlsSection: 30,
      _getEffectSections: 20,
      _buildProfileSection: 20,
      _createSliderHTML: 5,
      _createAccordionHTML: 10
    };
  }

  /**
   * Get performance report for UI Builder
   */
  getPerformanceReport() {
    console.group('🔧 DebuggerUIBuilder Performance Report');
    for (const [method, stats] of Object.entries(this._perfStats)) {
      if (stats.calls > 0) {
        const avg = stats.totalTime / stats.calls;
        const threshold = this._perfThresholds[method] || 10;
        const status = avg > threshold ? '🔴' : stats.maxTime > threshold ? '🟡' : '🟢';
        console.log(`${status} ${method}:`);
        console.log(`   Calls: ${stats.calls}, Avg: ${avg.toFixed(2)}ms, Max: ${stats.maxTime.toFixed(2)}ms, Total: ${stats.totalTime.toFixed(2)}ms`);
      }
    }
    console.groupEnd();
  }

  /**
   * Wrap a method with performance timing
   */
  _wrapWithTiming(methodName, fn) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    const stats = this._perfStats[methodName];
    if (stats) {
      stats.calls++;
      stats.totalTime += duration;
      stats.maxTime = Math.max(stats.maxTime, duration);
      
      const threshold = this._perfThresholds[methodName] || 10;
      if (duration > threshold) {
        console.error(`🔴 UI Builder | ${methodName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      }
    }
    
    return result;
  }

  buildRootElement() {
    return this._wrapWithTiming('buildRootElement', () => {
      // Load only the fonts currently in use by the module's settings.
      const getFont = (style) =>
        game.settings.get(
          MODULE_ID,
          `universal.fontManager.styles.${style}.fontFamily`
        );
      const fontsInUse = [
        getFont("heading1"),
        getFont("heading2"),
        getFont("body"),
        getFont("hint"),
      ];
      FontLoader.load(fontsInUse);

      const element = document.createElement("div");
      element.id = "material-editor-debugger";
      element.innerHTML = this._getStyles() + this._getBaseHTML();

      // These sections are now built dynamically and will be populated by the MaterialEditorDebugger
      element.querySelector("#main-controls-section").innerHTML = "";
      element.querySelector("#material-editor-profiles-section").innerHTML = "";

      const column1 = element.querySelector("#fx-column-1");
      const column2 = element.querySelector("#fx-column-2");
      const column3 = element.querySelector("#fx-column-3");

      const managedEffects = ScreenEffectsManager.getManagedEffectsHTML();
      const loadingScreenHTML = this._wrapWithTiming('_buildLoadingScreenSection', () => this._buildLoadingScreenSection());
      const pauseEffectHTML = this._wrapWithTiming('_buildPauseEffectSection', () => this._buildPauseEffectSection());

      // Column 1: Post-processing effects
      column1.innerHTML = managedEffects.postProcessing;
      column1.innerHTML += this._wrapWithTiming('_buildParticleSystemSection', () => this._buildParticleSystemSection());
      column1.innerHTML += this._wrapWithTiming('_buildWeatherSystemSection', () => this._buildWeatherSystemSection());
      column1.innerHTML += this._wrapWithTiming('_buildFontManagerSection', () => this._buildFontManagerSection());
      column1.innerHTML += loadingScreenHTML;
      column1.innerHTML += pauseEffectHTML;

      // Columns 2 & 3: Split other effects
      const otherEffectSections = this._wrapWithTiming('_getEffectSections', () => this._getEffectSections());
      const midPoint = Math.ceil(otherEffectSections.length / 2);
      const column2Effects = otherEffectSections.slice(0, midPoint);
      const column3Effects = otherEffectSections.slice(midPoint);

      column2.innerHTML = column2Effects.join("");
      column3.innerHTML = column3Effects.join("");

      // Collapse all accordions by default for a more compact initial view
      element.querySelectorAll('details').forEach(d => d.open = false);

      return element;
    });
  }

  _buildFontManagerSection() {
    const content = `
          <p class="description-text">Define the default fonts for different text styles used throughout the module.</p>
          
          <details id="details-fontManager-preview">
            <summary><span class="accordion-toggle"></span><strong>Font Preview</strong></summary>
            <div style="padding-left: 5px;">
              <div class="control-row">
                <label for="font-preview-selector">Preview Font</label>
                ${DebuggerUIBuilder._createSelectHTML(
                  "fontManager.previewFont",
                  "",
                  FONT_CHOICES,
                  "Select a font to preview it below.",
                  "font-selector-dropdown"
                )}
              </div>
              <div id="font-preview-text" style="font-size: 24px; margin-top: 4px; padding: 12px; background: rgba(0,0,0,0.3); border-radius: 3px; text-align: center; font-family: 'Signika';">
                The quick brown fox jumps over the lazy dog.
              </div>
            </div>
          </details>
          
          <details id="details-fontManager-styles" open>
            <summary><span class="accordion-toggle"></span><strong>Style Assignments</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createSelectHTML(
                "universal.fontManager.styles.heading1.fontFamily",
                "Heading 1",
                FONT_CHOICES,
                "Font for primary headings (e.g., Pause Screen title).",
                "font-selector-dropdown"
              )}
              ${DebuggerUIBuilder._createSelectHTML(
                "universal.fontManager.styles.heading2.fontFamily",
                "Heading 2",
                FONT_CHOICES,
                "Font for secondary headings (e.g., Pause Screen subtitle).",
                "font-selector-dropdown"
              )}
              ${DebuggerUIBuilder._createSelectHTML(
                "universal.fontManager.styles.body.fontFamily",
                "Body Text",
                FONT_CHOICES,
                "Font for general body or description text.",
                "font-selector-dropdown"
              )}
              ${DebuggerUIBuilder._createSelectHTML(
                "universal.fontManager.styles.hint.fontFamily",
                "Hint Text",
                FONT_CHOICES,
                "Font for hint text on loading and pause screens.",
                "font-selector-dropdown"
              )}
            </div>
          </details>
        `;
    return DebuggerUIBuilder._createAccordionHTML(
      "fontManager",
      "Font Manager",
      content
    );
  }

  _buildLoadingScreenSection() {
    // Check preview state to determine button text
    const mgr = game.mapShine?.sceneChangeManager;
    const isPreviewActive = mgr?.previewActive || false;
    const buttonText = isPreviewActive 
      ? `<i class="fas fa-eye-slash"></i> End Transition Preview`
      : `<i class="fas fa-film"></i> Preview Transition`;
    
    const content = `
          <p class="description-text">Configure the initial world loading screen and scene-to-scene transitions.</p>
          <div class="control-row" style="display:flex; justify-content:flex-end; gap:8px; margin: 6px 0 8px 0;">
            <button data-action="preview-transition" id="preview-transition-btn" class="ms-preview-transition-btn">
              ${buttonText}
            </button>
          </div>
          
          <details id="details-loadingScreen-initial">
            <summary><span class="accordion-toggle"></span><strong>Initial Loading Screen</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Content displayed on the initial world loading screen.</p>
              ${DebuggerUIBuilder._createTextInputHTML(
                "loading-screen-subheading",
                "Subheading Text",
                "Text displayed above the world title"
              )}
            </div>
          </details>
          
          <details id="details-loadingScreen-backgrounds">
            <summary><span class="accordion-toggle"></span><strong>Backgrounds &amp; Overlays</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Background images and overlays for both the initial loading screen and scene transitions.</p>
              ${DebuggerUIBuilder._createTextInputWithPickerHTML(
                "loading-screen-static-background",
                "Static Background"
              )}
              ${DebuggerUIBuilder._createCheckboxHTML(
                "loading-screen-use-random-background",
                "Use Random Background"
              )}
              <div id="loading-screen-random-backgrounds-wrapper">
                ${DebuggerUIBuilder._createListManagerHTML(
                  "loading-screen-random-backgrounds",
                  "Background Image",
                  "image"
                )}
              </div>
              <details id="details-initial-loading-bgOverlay">
                <summary><span class="accordion-toggle"></span>
                    <div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                      "loading-screen-background-overlay-enabled",
                      "Enable Background Overlay",
                      true
                    )}</div>
                </summary>
                <div style="padding-left: 5px;">
                    ${DebuggerUIBuilder._createSliderHTML(
                      "loading-screen-background-overlay-opacity",
                      "Overlay Opacity",
                      0,
                      1,
                      0.05
                    )}
                </div>
              </details>
            </div>
          </details>
          
          <details id="details-loadingScreen-transition">
            <summary><span class="accordion-toggle"></span><strong>Scene Transition Content</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Text, logo, and timing for animated transitions between scenes.</p>
              ${DebuggerUIBuilder._createCheckboxHTML(
                "universal.sceneTransition.enabled",
                "Enable Scene Transitions"
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "universal.sceneTransition.fadeOutDuration",
                "Fade Out (ms)",
                0,
                10000,
                100
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "universal.sceneTransition.fadeInDuration",
                "Fade In (ms)",
                0,
                10000,
                100
              )}
              <hr style="border-color: #555; margin: 4px 0;">
              ${DebuggerUIBuilder._createTextInputWithPickerHTML(
                "universal.sceneTransition.logoPath",
                "Logo Path"
              )}
              ${DebuggerUIBuilder._createTextInputHTML(
                "universal.sceneTransition.heading",
                "Heading"
              )}
              ${DebuggerUIBuilder._createTextInputHTML(
                "universal.sceneTransition.subheading",
                "Subheading"
              )}
              ${DebuggerUIBuilder._createTextInputHTML(
                "universal.sceneTransition.staticDescription",
                "Description"
              )}
              ${DebuggerUIBuilder._createCheckboxHTML(
                "universal.sceneTransition.showSceneName",
                "Show Scene Name"
              )}
              <hr style="border-color: #555; margin: 4px 0;">
              ${DebuggerUIBuilder._createCheckboxHTML(
                "universal.sceneTransition.useRandomHint",
                "Use Random Hint"
              )}
              <div id="sceneTransition-randomHints-wrapper">
                ${DebuggerUIBuilder._createListManagerHTML(
                  "universal.sceneTransition.randomHints",
                  "Hint",
                  "text"
                )}
              </div>
            </div>
          </details>
          
          <details id="details-loadingScreen-fonts">
            <summary><span class="accordion-toggle"></span><strong>Typography</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Font assignments for loading screen elements. These settings are shared with the Pause Screen in the Font Manager section.</p>
              ${DebuggerUIBuilder._createSelectHTML(
                "universal.fontManager.styles.heading1.fontFamily",
                "Title Font",
                FONT_CHOICES,
                "Font for the main title (world name or scene name).",
                "font-selector-dropdown"
              )}
              ${DebuggerUIBuilder._createSelectHTML(
                "universal.fontManager.styles.heading2.fontFamily",
                "Subheading Font",
                FONT_CHOICES,
                "Font for subheadings and secondary text.",
                "font-selector-dropdown"
              )}
              ${DebuggerUIBuilder._createSelectHTML(
                "universal.fontManager.styles.hint.fontFamily",
                "Hint Font",
                FONT_CHOICES,
                "Font for hint text at the bottom of the screen.",
                "font-selector-dropdown"
              )}
            </div>
          </details>
        `;
    return DebuggerUIBuilder._createAccordionHTML(
      "loadingScreen",
      "Loading Screen & Transitions",
      content
    );
  }

  _buildParticleSystemSection() {
    return `
                        <h3 class="pane-title" style="margin-top: 15px;">Particle Systems</h3>
                        <details id="details-particleSystems">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    ${DebuggerUIBuilder._createCheckboxHTML(
                                      "particleSystems.enabled",
                                      "<strong>Enable All Particles</strong>",
                                      true,
                                      "Master toggle for all particle effects."
                                    )}
                                </div>
                            </summary>
                            <div style="padding-top: 5px;">
                                <div class="control-row" style="padding: 4px; background: rgba(0,0,0,0.2); border-radius: 4px;">
                                    <label>Live Particle Count</label>
                                    <div class="widget-group">
                                        <span id="particle-count-display" style="font-weight: bold; color: #aadcff;">0</span>
                                        <span>/</span>
                                        <span id="particle-limit-display">10000</span>
                                    </div>
                                </div>
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "particleSystems.globalDensityMultiplier",
                                  "Global Density",
                                  0.1,
                                  2.0,
                                  0.05,
                                  "A multiplier for the spawn rate/density of ALL particle effects."
                                )}
                                ${DebuggerUIBuilder._createSliderHTML(
                                  "particleSystems.globalParticleLimit",
                                  "Global Particle Limit",
                                  500,
                                  30000,
                                  100,
                                  "A hard cap on the total number of particles allowed on screen at once to prevent performance issues."
                                )}
                            </div>
                        </details>
                    `;
  }

  _buildWeatherSystemSection() {
    const content = `
          <p class="description-text">GPU-accelerated weather system with dynamic rain, snow, fog, and particle effects.</p>
          
          <!-- Diagnostic Panel -->
          <div class="weather-diagnostics" style="padding: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; margin-bottom: 10px;">
            <div style="font-weight: bold; margin-bottom: 6px;">System Diagnostics</div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Current State:</span>
              <span id="weather-diag-state" style="font-weight: bold; color: #fff;">clear</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Transition Progress:</span>
              <span id="weather-diag-transition" style="color: #fff;">N/A</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Precipitation Type:</span>
              <span id="weather-diag-precip-type" style="color: #fff;">none</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Shader Layer:</span>
              <span id="weather-diag-shader-layer" style="color: #10b981;">✓ Active</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Active Effects:</span>
              <span id="weather-diag-effects-count" style="color: #fff;">0</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">System Ready:</span>
              <span id="weather-diag-ready" style="color: #10b981;">✓ Yes</span>
            </div>
            
            <!-- Wind System -->
            <div style="font-weight: bold; margin-top: 10px; margin-bottom: 4px; padding-top: 8px; border-top: 1px solid rgba(148,163,184,0.2); color: #94a3b8;">Wind System</div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Current Speed:</span>
              <span id="weather-diag-wind-speed" style="color: #fff;">N/A</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Gusting:</span>
              <span id="weather-diag-wind-gusting" style="color: #fff;">No</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Base Speed Config:</span>
              <span id="weather-diag-wind-base-cfg" style="color: #94a3b8; font-size: 10px;">N/A</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Gust Speed Config:</span>
              <span id="weather-diag-wind-gust-cfg" style="color: #94a3b8; font-size: 10px;">N/A</span>
            </div>
            
            <div class="diagnostic-row" style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px;">
              <span style="color: #94a3b8;">Weather Multiplier:</span>
              <span id="weather-diag-wind-mult" style="color: #fbbf24; font-size: 10px;">1.00x</span>
            </div>
            
            <div id="weather-diag-error" style="display: none; margin-top: 6px; padding: 6px; background: rgba(239,68,68,0.2); border-radius: 3px; border-left: 2px solid #ef4444;">
              <div style="font-size: 10px; color: #fca5a5; font-weight: bold;">⚠ ERROR</div>
              <div id="weather-diag-error-msg" style="font-size: 10px; color: #fecaca; margin-top: 2px;"></div>
              <div id="weather-diag-error-time" style="font-size: 9px; color: #9ca3af; margin-top: 2px;"></div>
            </div>
          </div>

          <!-- Test Mode Button -->
          <button id="weather-test-mode-btn" class="config-button" style="width: 100%; margin-bottom: 10px; padding: 8px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">
            🧪 Run Test Sequence
          </button>
          <p class="description-text" style="font-size: 10px; margin-top: -8px; margin-bottom: 10px; color: #94a3b8; font-style: italic;">
            Cycles through all weather states: Clear→Storm→Clear→Blizzard (5s each)
          </p>

          <!-- State Control -->
          <div class="control-row">
            <label>Current Weather</label>
            ${DebuggerUIBuilder._createSelectHTML(
              "weather.currentState",
              "",
              {
                clear: "Clear",
                "partly-cloudy": "Partly Cloudy",
                drizzle: "Drizzle",
                rain: "Rain",
                storm: "Storm",
                sleet: "Sleet",
                snow: "Snow",
                blizzard: "Blizzard"
              },
              "Select the current weather state"
            )}
          </div>

          ${DebuggerUIBuilder._createSliderHTML(
            "weather.transitionDuration",
            "Transition Duration (ms)",
            1000,
            30000,
            1000,
            "Time for smooth transitions between weather states"
          )}

          <!-- Rain Shader Sub-Accordion -->
          <details>
            <summary><span class="accordion-toggle"></span><strong>Rain Shader</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Cinematic GPU-accelerated rain with multi-layer parallax, dynamic streaks, round ground splashes, wavy sheet masking, and rain curtains.</p>
                
                ${DebuggerUIBuilder._createSliderHTML(
                  "weather.rain.opacity",
                  "Opacity",
                  0,
                  1,
                  0.01,
                  "Master visibility (0=invisible, 1=full)"
                )}

                ${DebuggerUIBuilder._createSliderHTML(
                  "weather.rain.intensity",
                  "Intensity",
                  0,
                  3,
                  0.05,
                  "Brightness multiplier (1=normal, 3=very bright)"
                )}

                ${DebuggerUIBuilder._createSliderHTML(
                  "weather.rain.strength",
                  "Contrast/Sharpness",
                  0.1,
                  3,
                  0.05,
                  "Edge definition (0.5=soft, 1.5=crisp, 3=extreme)"
                )}

                ${DebuggerUIBuilder._createSliderHTML(
                  "weather.rain.speed",
                  "Animation Speed",
                  0,
                  3,
                  0.05,
                  "Scroll rate (0=frozen, 1=normal, 3=very fast)"
                )}
              </div>

              <!-- Streak & Particle Properties -->
              <details>
                <summary><span class="accordion-toggle"></span><strong>Streak & Particle Properties</strong></summary>
                <div style="padding-left: 5px;">
                  <p class="description-text">Control rain pattern density, streak appearance, and particle effects.</p>
                  
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.rain.rainDensity",
                    "Rain Density (%)",
                    0,
                    100,
                    0.001,
                    "Percentage of grid cells that spawn raindrops (0.001=ultra sparse, 10=light, 50=heavy, 100=full)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.rain.gridSize",
                    "Grid Size (Streak Scale)",
                    50,
                    300,
                    5,
                    "Cell count per screen width. Lower = larger raindrops/streaks, Higher = smaller drops"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.rain.streakLength",
                    "Streak Length",
                    20,
                    300,
                    5,
                    "Perpendicular resolution (lower=longer streaks, higher=rounder drops)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.rain.splashIntensity",
                    "Ground Splash Intensity",
                    0,
                    2,
                    0.05,
                    "Visibility of round splash particles on ground (0=none, 1=normal, 2=very bright)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.rain.waveMaskIntensity",
                    "Wave Gap Intensity",
                    0,
                    2,
                    0.05,
                    "Strength of wavy gaps in rainfall (0=uniform, 1=normal, 2=dramatic)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.rain.curtainIntensity",
                    "Rain Curtain Intensity",
                    0,
                    2,
                    0.05,
                    "Large-scale sweeping sheets of rain (0=none, 1=normal, 2=dramatic)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.rain.worleySpeed",
                    "Worley Noise Speed",
                    0.1,
                    3.0,
                    0.1,
                    "Animation speed of ground splashes and wave gaps (0.5=slow, 1.0=normal, 2.0=fast)"
                  )}

                </div>
              </details>

              <!-- Visual Appearance -->
              <details>
                <summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary>
                <div style="padding-left: 5px;">
                    ${DebuggerUIBuilder._createSliderHTML(
                      "weather.rain.tint.r",
                      "Red Channel",
                      0,
                      1,
                      0.01,
                      "Red tint (default: 0.7)"
                    )}

                    ${DebuggerUIBuilder._createSliderHTML(
                      "weather.rain.tint.g",
                      "Green Channel",
                      0,
                      1,
                      0.01,
                      "Green tint (default: 0.9)"
                    )}

                    ${DebuggerUIBuilder._createSliderHTML(
                      "weather.rain.tint.b",
                      "Blue Channel",
                      0,
                      1,
                      0.01,
                      "Blue tint (default: 1.0 for cool rain)"
                    )}

                  <div style="display: flex; gap: 4px; margin-top: 6px;">
                    <button class="tint-preset" data-action="apply-tint-preset" data-tint="cool" style="flex: 1; padding: 4px; font-size: 10px;">Cool (Blue)</button>
                    <button class="tint-preset" data-action="apply-tint-preset" data-tint="neutral" style="flex: 1; padding: 4px; font-size: 10px;">Neutral</button>
                    <button class="tint-preset" data-action="apply-tint-preset" data-tint="warm" style="flex: 1; padding: 4px; font-size: 10px;">Warm</button>
                  </div>
                </div>
              </details>
            </div>
          </details>

          <!-- Snow Shader Sub-Accordion -->
          <details>
            <summary><span class="accordion-toggle"></span><strong>Snow Shader</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Control GPU-accelerated snow shader with 20 layers of procedural snowflakes.</p>
              
              ${DebuggerUIBuilder._createSliderHTML(
                "weather.snow.direction",
                "Direction",
                0,
                2,
                0.1,
                "Horizontal drift direction (0.5=slight, 1.2=strong)"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.snow.speed",
                "Speed",
                0,
                20,
                0.5,
                "Fall speed of snowflakes"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.snow.scale",
                "Scale",
                0.5,
                10,
                0.5,
                "Size of snowflakes"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.snow.animationSpeed",
                "Animation Speed",
                0,
                5,
                0.1,
                "Speed multiplier for snow animation"
              )}

              <details style="margin-top: 5px;">
                <summary><span class="accordion-toggle"></span><strong>Advanced</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.snow.tint.r",
                    "Tint Red",
                    0,
                    1,
                    0.01,
                    "Red channel tint (1.0 = white snow)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.snow.tint.g",
                    "Tint Green",
                    0,
                    1,
                    0.01,
                    "Green channel tint"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.snow.tint.b",
                    "Tint Blue",
                    0,
                    1,
                    0.01,
                    "Blue channel tint"
                  )}
                </div>
              </details>
            </div>
          </details>

          <!-- Fog Shader Sub-Accordion -->
          <details>
            <summary><span class="accordion-toggle"></span><strong>Fog Shader</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Control GPU-accelerated fog shader using Fractional Brownian Motion.</p>
              
              ${DebuggerUIBuilder._createSliderHTML(
                "weather.fog.intensity",
                "Intensity",
                0,
                1,
                0.01,
                "Overall visibility of fog effect"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.fog.slope",
                "Slope",
                0,
                3,
                0.05,
                "Density threshold (higher = thicker fog)"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.fog.rotation",
                "Rotation (radians)",
                0,
                6.28,
                0.01,
                "Rotation of fog pattern"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.fog.speed",
                "Speed",
                -100,
                100,
                1,
                "Drift speed of fog (negative = reverse)"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.fog.animationSpeed",
                "Animation Speed",
                0,
                2,
                0.05,
                "Speed multiplier for fog animation"
              )}

              <details style="margin-top: 5px;">
                <summary><span class="accordion-toggle"></span><strong>Advanced</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.fog.tint.r",
                    "Tint Red",
                    0,
                    1,
                    0.01,
                    "Red channel tint (0.9/0.85/1.0 = default bluish)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.fog.tint.g",
                    "Tint Green",
                    0,
                    1,
                    0.01,
                    "Green channel tint"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.fog.tint.b",
                    "Tint Blue",
                    0,
                    1,
                    0.01,
                    "Blue channel tint"
                  )}
                </div>
              </details>
            </div>
          </details>

          <!-- Edge Droplet Particles Sub-Accordion -->
          <details>
            <summary><span class="accordion-toggle"></span><strong>Edge Droplets (Wind-Blown Particles)</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Particle system that spawns water droplets from building edges during rain. Uses edge detection on the _Outdoors mask. Requires _Outdoors mask texture and wind speed above 10. Works only during drizzle, rain, or storm states.</p>
              
              ${DebuggerUIBuilder._createCheckboxHTML(
                "weather.edgeDroplets.enabled",
                "Enable Edge Droplets",
                true,
                "Enable wind-blown water droplet particles from building edges"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.edgeDroplets.maxParticles",
                "Max Particles",
                50,
                500,
                10,
                "Maximum number of edge droplet particles"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.edgeDroplets.spawnRate",
                "Spawn Rate",
                10,
                200,
                5,
                "Particles spawned per second"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.edgeDroplets.gridSize",
                "Edge Detection Grid Size",
                16,
                64,
                4,
                "Grid resolution for edge detection (lower = more precise but slower)"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.edgeDroplets.updateFrequency",
                "Edge Cache Update (seconds)",
                0.1,
                1.0,
                0.05,
                "How often to recalculate edge positions"
              )}

              <!-- Edge Detection & Thresholding -->
              <details>
                <summary><span class="accordion-toggle"></span><strong>Edge Detection & Thresholding</strong></summary>
                <div style="padding-left: 5px;">
                  <p class="description-text">Fine-tune where particles spawn by adjusting edge detection sensitivity and mask thresholds.</p>
                  
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.edgeThreshold",
                    "Indoor Threshold",
                    0.0,
                    1.0,
                    0.01,
                    "Mask value below which pixel is considered 'indoor' (default: 0.5)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.outdoorThreshold",
                    "Outdoor Threshold",
                    0.0,
                    1.0,
                    0.01,
                    "Mask value above which pixel is considered 'outdoor' (default: 0.5)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.spreadRadius",
                    "Spawn Spread Radius",
                    0,
                    100,
                    1,
                    "Random offset from exact edge point (pixels)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.edgeUpdateFrequency",
                    "Edge Recalculation Rate (s)",
                    0.5,
                    10.0,
                    0.5,
                    "How often to redetect edges based on wind changes"
                  )}
                </div>
              </details>

              <!-- Spawn & Performance -->
              <details>
                <summary><span class="accordion-toggle"></span><strong>Spawn & Performance</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.frequency",
                    "Spawn Frequency",
                    0.001,
                    0.02,
                    0.001,
                    "Particles spawned per frame (0.002=sparse, 0.003=normal, 0.01=heavy)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.emitDuration",
                    "Emit Burst Duration (s)",
                    0.1,
                    2.0,
                    0.1,
                    "How long particles continue spawning at each edge point"
                  )}

                  ${DebuggerUIBuilder._createCheckboxHTML(
                    "weather.edgeDroplets.autoUpdate",
                    "Auto Update Emitter",
                    false,
                    "Automatically update particle positions (disable for manual control)"
                  )}
                </div>
              </details>

              <!-- Particle Appearance -->
              <details>
                <summary><span class="accordion-toggle"></span><strong>Visual Appearance</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.opacity",
                    "Base Opacity",
                    0.0,
                    1.0,
                    0.05,
                    "Overall particle opacity (0=invisible, 1=fully opaque)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.fadeInDuration",
                    "Fade In Duration",
                    0.0,
                    0.2,
                    0.01,
                    "Time ratio for fade-in at particle birth (0.05 = 5% of lifetime)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.fadeOutStart",
                    "Fade Out Start",
                    0.7,
                    0.95,
                    0.01,
                    "When to start fading out (0.9 = at 90% of lifetime)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.splashOpacity",
                    "Splash Opacity",
                    0.0,
                    1.0,
                    0.01,
                    "Opacity when particles 'splat' on ground (0.3=subtle, 0.8=visible)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.size.min",
                    "Min Size (scale)",
                    0.05,
                    1.0,
                    0.01,
                    "Minimum particle scale multiplier"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.size.max",
                    "Max Size (scale)",
                    0.1,
                    2.0,
                    0.01,
                    "Maximum particle scale multiplier"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.sizeVariation",
                    "Size Variation",
                    0.0,
                    5.0,
                    0.05,
                    "Random size variation (0.7 = 70-100% of scale values)"
                  )}

                  <!-- Color Controls -->
                  <div style="margin-top: 8px;">
                    <div style="font-size: 10px; font-weight: bold; color: #60a5fa; margin-bottom: 4px;">Particle Color</div>
                    
                    ${DebuggerUIBuilder._createCheckboxHTML(
                      "weather.edgeDroplets.matchRainTint",
                      "Match Rain Tint",
                      false,
                      "Use rain shader tint color for particles"
                    )}

                    <div style="margin-top: 6px; padding: 4px; background: rgba(100,100,100,0.2); border-radius: 3px;">
                      <p style="font-size: 9px; margin: 0 0 4px 0; color: #94a3b8;">Custom Color (used when Match Rain Tint is OFF):</p>
                      
                      ${DebuggerUIBuilder._createSliderHTML(
                        "weather.edgeDroplets.color.r",
                        "Red",
                        0,
                        1,
                        0.01,
                        "Red channel (default: 0.82 for blue-white)"
                      )}

                      ${DebuggerUIBuilder._createSliderHTML(
                        "weather.edgeDroplets.color.g",
                        "Green",
                        0,
                        1,
                        0.01,
                        "Green channel (default: 0.91)"
                      )}

                      ${DebuggerUIBuilder._createSliderHTML(
                        "weather.edgeDroplets.color.b",
                        "Blue",
                        0,
                        1,
                        0.01,
                        "Blue channel (default: 1.0)"
                      )}
                    </div>
                  </div>
                </div>
              </details>

              <!-- Particle Behavior -->
              <details>
                <summary><span class="accordion-toggle"></span><strong>Movement & Physics</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.lifetime.min",
                    "Min Lifetime (seconds)",
                    0.5,
                    5.0,
                    0.1,
                    "Minimum particle lifetime"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.lifetime.max",
                    "Max Lifetime (seconds)",
                    1.0,
                    10.0,
                    0.1,
                    "Maximum particle lifetime"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.windForce",
                    "Wind Force",
                    0.0,
                    5.0,
                    0.01,
                    "Wind acceleration force multiplier (0.15=gentle, 0.5=strong)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.windAccelerationTime",
                    "Wind Accel Time (s)",
                    0.0,
                    25.0,
                    0.1,
                    "Time to reach full wind speed (0=instant, 2.0=gradual)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.turbulence",
                    "Turbulence",
                    0.0,
                    2.0,
                    0.05,
                    "Random chaotic motion intensity"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.groundCollisionAge",
                    "Ground Hit Age",
                    0.7,
                    0.99,
                    0.01,
                    "When particles 'hit ground' and stop moving (0.9 = 90% lifetime)"
                  )}

                  ${DebuggerUIBuilder._createCheckboxHTML(
                    "weather.edgeDroplets.enableGroundCollision",
                    "Enable Ground Collision",
                    true,
                    "Stop particle movement when hitting ground"
                  )}
                </div>
              </details>

              <!-- Motion Blur & Splash -->
              <details>
                <summary><span class="accordion-toggle"></span><strong>Motion Blur & Ground Splash</strong></summary>
                <div style="padding-left: 5px;">
                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.motionBlur.strength",
                    "Motion Blur Strength",
                    0.0,
                    5.0,
                    0.1,
                    "Speed-to-length multiplier (2.0=aggressive, 0.5=subtle)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.motionBlur.maxLength",
                    "Max Streak Length",
                    0.0,
                    30.0,
                    0.5,
                    "Maximum elongation scale (8.0=dramatic streaks, 20=extreme)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.splashSizeMultiplier",
                    "Splash Size Multiplier",
                    1.0,
                    50.0,
                    0.5,
                    "How much particles expand at ground impact (26=instant balloon)"
                  )}

                  ${DebuggerUIBuilder._createSliderHTML(
                    "weather.edgeDroplets.splashTransitionTime",
                    "Splash Transition Speed",
                    0.0,
                    0.1,
                    0.001,
                    "Time delta before splash (0.001=instant, 0.05=gradual)"
                  )}
                </div>
              </details>

          <!-- Impact Effects Sub-Accordion (Bonus) - UNIMPLEMENTED -->
          <!-- <details>
            <summary><span class="accordion-toggle"></span><strong>Rain/Snow Impact Effects (Bonus)</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Spawn splash particles when precipitation hits surfaces.</p>
              
              ${DebuggerUIBuilder._createCheckboxHTML(
                "weather.impacts.enabled",
                "Enable Impact Effects",
                false,
                "Spawn splash particles on _Surface masks"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.impacts.particlesPerImpact.min",
                "Min Particles/Impact",
                1,
                20,
                1
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.impacts.particlesPerImpact.max",
                "Max Particles/Impact",
                1,
                20,
                1
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.impacts.splashHeight.min",
                "Min Splash Height (px)",
                2,
                50,
                1
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.impacts.splashHeight.max",
                "Max Splash Height (px)",
                2,
                50,
                1
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.impacts.splashDuration",
                "Splash Duration (s)",
                0.1,
                2,
                0.1
              )}

              ${DebuggerUIBuilder._createTextInputHTML(
                "weather.impacts.surfaceMaskPath",
                "Surface Mask Path (_Surface)"
              )}
            </div>
          </details> -->

          <!-- Accumulation Sub-Accordion (Bonus) - UNIMPLEMENTED -->
          <!-- <details>
            <summary><span class="accordion-toggle"></span><strong>Snow Accumulation (Bonus)</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Gradual snow buildup on rooftops and surfaces.</p>
              
              ${DebuggerUIBuilder._createCheckboxHTML(
                "weather.accumulation.enabled",
                "Enable Snow Accumulation",
                false,
                "Render snow buildup on _Rooftops masks"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.accumulation.rate",
                "Accumulation Rate",
                0.1,
                2,
                0.1,
                "Speed multiplier for snow buildup"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.accumulation.maxDepth",
                "Max Depth (px)",
                5,
                50,
                1,
                "Maximum snow depth in pixels"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.accumulation.meltRate",
                "Melt Rate",
                0,
                1,
                0.05,
                "How fast snow melts when transitioning away"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.accumulation.visualOpacity",
                "Visual Opacity",
                0,
                1,
                0.05,
                "Opacity of accumulated snow"
              )}

              ${DebuggerUIBuilder._createTextInputHTML(
                "weather.accumulation.rooftopMaskPath",
                "Rooftop Mask Path (_Rooftops)"
              )}
            </div>
          </details> -->

          <!-- Lightning Sub-Accordion (Bonus) - UNIMPLEMENTED -->
          <!-- <details>
            <summary><span class="accordion-toggle"></span><strong>Lightning & Thunder (Bonus)</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Screen flash effects with optional thunder sounds.</p>
              
              ${DebuggerUIBuilder._createCheckboxHTML(
                "weather.lightning.enabled",
                "Enable Lightning",
                false,
                "Random lightning flash effects during storms"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.lightning.frequency.min",
                "Min Frequency (ms)",
                1000,
                30000,
                1000,
                "Minimum time between lightning strikes"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.lightning.frequency.max",
                "Max Frequency (ms)",
                1000,
                30000,
                1000,
                "Maximum time between lightning strikes"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.lightning.flashDuration",
                "Flash Duration (ms)",
                50,
                500,
                10
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.lightning.flashIntensity",
                "Flash Intensity",
                0,
                1,
                0.05,
                "Brightness of the lightning flash (0-1)"
              )}

              ${DebuggerUIBuilder._createTextInputHTML(
                "weather.lightning.flashColor",
                "Flash Color"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.lightning.thunderDelay.min",
                "Min Thunder Delay (ms)",
                0,
                5000,
                100,
                "Minimum delay between flash and thunder"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.lightning.thunderDelay.max",
                "Max Thunder Delay (ms)",
                0,
                5000,
                100,
                "Maximum delay between flash and thunder"
              )}

              ${DebuggerUIBuilder._createCheckboxHTML(
                "weather.lightning.playThunderSound",
                "Play Thunder Sound",
                false,
                "Play thunder sound effect (requires audio file integration)"
              )}
            </div>
          </details> -->

          <!-- Performance Sub-Accordion -->
          <details>
            <summary><span class="accordion-toggle"></span><strong>Performance</strong></summary>
            <div style="padding-left: 5px;">
              <p class="description-text">Optimize weather particle rendering.</p>
              
              ${DebuggerUIBuilder._createSliderHTML(
                "weather.performance.maxParticles",
                "Max Particles",
                100,
                5000,
                100,
                "Hard limit on total weather particles"
              )}

              ${DebuggerUIBuilder._createCheckboxHTML(
                "weather.performance.cullOutsideViewport",
                "Viewport Culling",
                true,
                "Don't render particles outside the visible area"
              )}

              ${DebuggerUIBuilder._createCheckboxHTML(
                "weather.performance.lodEnabled",
                "Level of Detail (LOD)",
                true,
                "Reduce particle count when zoomed out"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.performance.lodDistanceThreshold",
                "LOD Distance (px)",
                500,
                5000,
                100,
                "Zoom distance to trigger LOD reduction"
              )}

              ${DebuggerUIBuilder._createSliderHTML(
                "weather.performance.lodReductionFactor",
                "LOD Reduction Factor",
                0.1,
                1,
                0.05,
                "Multiply particle count by this when LOD active"
              )}
            </div>
          </details>

        </div>
      </details>
    `;
    return DebuggerUIBuilder._createAccordionHTML(
      "weatherSystem",
      "Weather System",
      content
    );
  }

  _getStyles() {
    return `<style>
    /* --- Gradient Editor --- */
    .gradient-editor-wrapper { padding: 5px; background: rgba(0,0,0,0.2); border-radius: 3px; margin-top: 5px; }
    .gradient-editor-wrapper .control-row { margin-bottom: 6px; justify-content: space-between; }
    .reset-gradient-btn { padding: 2px 6px; font-size: 10px; background: #4a4a4a; border: 1px solid #777; color: #ddd; flex-shrink: 0; }
    .reset-gradient-btn:hover { background: #803030; color: #fff; border-color: #c06060; }
    .gradient-bar-container { position: relative; width: 100%; height: 25px; cursor: crosshair; }
    .gradient-bar-bg {
        width: 100%; height: 100%; border-radius: 4px; border: 1px solid #777;
        background-image: linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%);
        background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    }
    .gradient-bar-preview { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 4px; }
    .gradient-stops-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .gradient-stop {
        position: absolute;
        top: 50%;
        width: 14px; height: 14px;
        border: 2px solid #fff;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        cursor: grab;
        box-shadow: 0 0 5px rgba(0,0,0,0.8);
        background-color: #888; /* Fallback */
    }
    .gradient-stop.active {
        border-color: #40a0fa;
        transform: translate(-50%, -50%) scale(1.2);
        z-index: 10;
    }
    .gradient-stop.endpoint { border-radius: 4px; } /* Square endpoints */
    .gradient-stop-preview {
        position: absolute; top: -20px; left: 50%;
        transform: translateX(-50%);
        width: 16px; height: 16px;
        border-radius: 3px; border: 1px solid #ccc;
        pointer-events: none;
        background-image: linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%);
        background-size: 8px 8px; background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    }
    .gradient-stop-preview-color { width: 100%; height: 100%; }
    .gradient-editor-controls {
        display: none; /* Hidden by default, shown on stop selection */
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid #555;
        background: rgba(0,0,0,0.2);
        padding: 6px;
        border-radius: 3px;
    }
    .gradient-editor-controls.visible { display: block; }
    /* --- End Gradient Editor --- */

    /* --- Reset Button --- */
    #material-editor-debugger .reset-accordion-btn {
        width: 20px;
        height: 20px;
        font-size: 10px;
        font-weight: bold;
        padding: 0;
        line-height: 18px;
        border-radius: 3px; /* Square button */
        background: #4a4a4a;
        border: 1px solid #777;
        color: #ddd;
        flex-shrink: 0;
    }
    #material-editor-debugger .reset-accordion-btn:hover {
        background: #803030;
        color: #fff;
        border-color: #c06060;
    }
    
    /* --- Plus/Create Button --- */
    .create-effect-from-ui {
        width: 20px;
        height: 20px;
        font-size: 11px;
        padding: 0;
        line-height: 18px;
        border-radius: 3px;
        border: 1px solid rgba(76, 250, 64, 0.5);
        background: rgba(76, 250, 64, 0.15);
        color: rgba(76, 250, 64, 0.9);
        transition: all 0.2s;
        flex-shrink: 0;
    }
    .create-effect-from-ui:hover {
        background: rgba(76, 250, 64, 0.3);
        border-color: #6fdd73;
        color: #fff;
    }
    
    /* --- World Based & Clock Based Badges --- */
    .world-based-badge, .clock-based-badge {
        display: inline-block;
        padding: 2px 6px;
        font-size: 9px;
        font-weight: bold;
        text-transform: uppercase;
        border-radius: 3px;
        flex-shrink: 0;
    }
    .world-based-badge {
        background: rgba(76, 175, 80, 0.2);
        border: 1px solid rgba(76, 175, 80, 0.5);
        color: #90ee90;
    }
    .clock-based-badge {
        background: rgba(33, 150, 243, 0.2);
        border: 1px solid rgba(33, 150, 243, 0.5);
        color: #87ceeb;
    }
    .world-based-badge.hidden, .clock-based-badge.hidden {
        display: none;
    }
    /* --- Main Controls Styles --- */

    #main-controls-section {
        padding: 6px;
        background: rgba(10, 10, 10, 0.4);
        border-radius: 4px;
        margin-bottom: 6px;
        border: 1px solid #111;
    }
    .main-controls-wrapper .pane-title { margin-top: 0; }
    .main-controls-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .main-controls-col { display: flex; flex-direction: column; gap: 6px; }
    .main-controls-col label { font-weight: bold; color: #ccc; }
    .profile-select-wrapper { display: flex; gap: 5px; }
    .profile-select-wrapper select { flex-grow: 1; }
    .profile-management-buttons { display: flex; gap: 5px; }
    .profile-management-buttons button { width: 30px; padding: 0; font-size: 14px; }
    .profile-management-buttons button[data-action="delete-scene-profile"] { color: #ff8080; }
    .main-controls-buttons { display: flex; gap: 6px; }
    .main-controls-buttons button { flex: 1; font-weight: bold; padding: 6px; font-size: 1.1em; }
    .main-controls-buttons button.activate-btn { background-color: #2a552a; border-color: #6aaa6a; color: #ccffcc; }
    .main-controls-buttons button.activate-btn:hover { background-color: #3a753a; }
    .transition-status-wrapper {
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.3); padding: 5px; border-radius: 3px;
        min-height: 24px;
    }
    .main-controls-init { text-align: center; padding: 8px; }
    .main-controls-init p { color: #ccc; margin: 0 0 8px 0; }
    .main-controls-init button { font-size: 1.2em; padding: 8px; font-weight: bold; background-color: #2a552a; border-color: #6aaa6a; color: #ccffcc; }
    .main-controls-init button:hover { background-color: #3a753a; }
    .new-profile-controls { display: flex; gap: 6px; }
    .new-profile-controls input { flex-grow: 1; }
    .new-profile-controls button { white-space: nowrap; }




                                #material-editor-debugger { 
                                    position: fixed; 
                                    z-index: 10; 
                                    background: rgba(40, 40, 40, 0.95); 
                                    color: #fff; 
                                    border: 1px solid #111; 
                                    border-radius: 8px; 
                                    padding: 5px; 
                                    font-family: sans-serif; 
                                    font-size: 11px; 
                                    display: flex; 
                                    flex-direction: column; 
                                    gap: 4px; 
                                    min-width: 550px;
                                    min-height: 600px;
                                    box-sizing: border-box;
                                    box-shadow: 0 0 25px rgba(0,0,0,0.7); 
                                    resize: both;
                                    overflow: auto;
                                }
                                #material-editor-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 4px; }
                                .header-buttons-left, .header-buttons-right { display: flex; gap: 4px; flex-shrink: 0; }
                                #material-editor-header h3 { margin: 0; padding: 0; border: none; flex-grow: 1; text-align: center; cursor: move; user-select: none; font-size: 1.4em; }
                                .header-btn { display: inline-block; text-decoration: none; background: #3a3a3a; border: 1px solid #666; color: #ccc; font-weight: bold; width: 22px; height: 22px; line-height: 22px; text-align: center; cursor: pointer; border-radius: 4px; flex-shrink: 0; font-size: 14px; padding: 0; transition: all 0.2s ease; }
                                .header-btn:hover { background: #555; border-color: #FF6B35; color: #fff; transform: scale(1.05); }
                                                            #material-editor-debugger .summary-control .header-btn { width: 22px; height: 22px; font-size: 11px; padding: 0; }
                                #material-editor-debugger .file-picker-btn {
                                    flex-shrink: 0;
                                    width: 22px;
                                    height: 22px;
                                    line-height: 18px;
                                    padding: 0;
                                    font-size: 12px;
                                    background: #3a3a3a;
                                    border: 1px solid #666;
                                    color: #ccc;
                                    cursor: pointer;
                                    border-radius: 4px;
                                }
                                #material-editor-debugger .file-picker-btn:hover { background: #555; border-color: #FF6B35; color: #fff; transform: scale(1.05); }
                                #material-editor-debugger details { background: rgba(255,255,255,0.05); border: 1px solid #555; border-radius: 2px; padding: 1px; margin-bottom: 0; transition: background 0.2s ease-in-out; }
                                #material-editor-debugger details[open] { background: rgba(255,255,255,0.08); padding-bottom: 1px; }
                                
                                /* Type-specific subtle tints */
                                #material-editor-debugger details.accordion-type-particle { background: rgba(255, 180, 100, 0.04); border-color: rgba(255, 180, 100, 0.2); }
                                #material-editor-debugger details.accordion-type-particle[open] { background: rgba(255, 180, 100, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-shadow { background: rgba(100, 150, 255, 0.04); border-color: rgba(100, 150, 255, 0.2); }
                                #material-editor-debugger details.accordion-type-shadow[open] { background: rgba(100, 150, 255, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-shader { background: rgba(200, 100, 255, 0.04); border-color: rgba(200, 100, 255, 0.2); }
                                #material-editor-debugger details.accordion-type-shader[open] { background: rgba(200, 100, 255, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-water { background: rgba(100, 200, 255, 0.04); border-color: rgba(100, 200, 255, 0.2); }
                                #material-editor-debugger details.accordion-type-water[open] { background: rgba(100, 200, 255, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-color { background: rgba(255, 200, 150, 0.04); border-color: rgba(255, 200, 150, 0.2); }
                                #material-editor-debugger details.accordion-type-color[open] { background: rgba(255, 200, 150, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-system { background: rgba(150, 150, 150, 0.04); border-color: rgba(150, 150, 150, 0.2); }
                                #material-editor-debugger details.accordion-type-system[open] { background: rgba(150, 150, 150, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-structural { background: rgba(100, 255, 200, 0.04); border-color: rgba(100, 255, 200, 0.2); }
                                #material-editor-debugger details.accordion-type-structural[open] { background: rgba(100, 255, 200, 0.08); }
                                
                                /* Post-Processing Effect Types */
                                #material-editor-debugger details.accordion-type-pp-color { background: rgba(255, 200, 150, 0.04); border-color: rgba(255, 200, 150, 0.2); }
                                #material-editor-debugger details.accordion-type-pp-color[open] { background: rgba(255, 200, 150, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-pp-exposure { background: rgba(255, 220, 100, 0.04); border-color: rgba(255, 220, 100, 0.2); }
                                #material-editor-debugger details.accordion-type-pp-exposure[open] { background: rgba(255, 220, 100, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-pp-lens { background: rgba(150, 180, 255, 0.04); border-color: rgba(150, 180, 255, 0.2); }
                                #material-editor-debugger details.accordion-type-pp-lens[open] { background: rgba(150, 180, 255, 0.08); }
                                
                                #material-editor-debugger details.accordion-type-pp-texture { background: rgba(180, 180, 180, 0.04); border-color: rgba(180, 180, 180, 0.2); }
                                #material-editor-debugger details.accordion-type-pp-texture[open] { background: rgba(180, 180, 180, 0.08); }
                                
                                #material-editor-debugger details.disabled-effect > summary .summary-label { color: #888; }
                                #material-editor-debugger summary { font-weight: bold; cursor: pointer; padding: 0px; display: flex; align-items: center; gap: 5px; list-style: none; }
                                #material-editor-debugger summary::-webkit-details-marker { display: none; }
                                
                                /* Icon-based accordion toggle */
                                #material-editor-debugger .accordion-icon { 
                                    flex-shrink: 0; 
                                    width: 16px; 
                                    height: 16px;
                                    font-size: 12px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: #ccc; 
                                    transition: transform 0.2s ease-in-out, color 0.2s ease-in-out; 
                                    margin-left: 2px; 
                                }
                                #material-editor-debugger details[open] > summary .accordion-icon { transform: rotate(90deg); }
                                
                                /* Type-specific icon colors */
                                #material-editor-debugger .accordion-icon[data-accordion-type="particle"] { color: #ffb464; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="shadow"] { color: #6496ff; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="shader"] { color: #c864ff; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="water"] { color: #64c8ff; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="color"] { color: #ffc896; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="system"] { color: #969696; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="structural"] { color: #64ffc8; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="default"] { color: #c896ff; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="pp-color"] { color: #ffc896; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="pp-exposure"] { color: #ffdc64; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="pp-lens"] { color: #96b4ff; }
                                #material-editor-debugger .accordion-icon[data-accordion-type="pp-texture"] { color: #b4b4b4; }
                                
                                #material-editor-debugger .summary-control { display: flex; justify-content: space-between; align-items: center; width: 100%; }

                                #material-editor-debugger details details { margin-left: 4px; margin-top: 2px; border-style: dashed; }
                                #material-editor-debugger .traffic-light { width: 9px; height: 9px; border-radius: 50%; display: inline-block; box-shadow: 0 0 4px rgba(0,0,0,0.5); border: 1px solid #111; flex-shrink: 0; }
                                #material-editor-debugger .traffic-light.ok { background-color: #FF6B35; box-shadow: 0 0 6px rgba(255, 107, 53, 0.5); }
                                #material-editor-debugger .traffic-light.error { background-color: #EE4266; box-shadow: 0 0 6px rgba(238, 66, 102, 0.5); }
                                #material-editor-debugger .traffic-light.warning { background-color: #FFD23F; box-shadow: 0 0 6px rgba(255, 210, 63, 0.5); }
                                #material-editor-debugger .traffic-light.unknown { background-color: #888; }
                                #material-editor-debugger .traffic-light.inactive, #material-editor-debugger .traffic-light.disabled { background: none; border: 1px dashed #666; }
                                #material-editor-debugger .control-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1px; padding: 0; }
                                #material-editor-debugger .control-row label { flex-shrink: 0; margin-right: 3px; display: flex; align-items: center; gap: 3px;}
                                #material-editor-debugger .control-row .widget-group { display: flex; align-items: center; gap: 3px; }
                                #material-editor-debugger .control-row-slider { display: grid; grid-template-columns: auto 1fr auto; gap: 4px; align-items: center; }
                                #material-editor-debugger .control-row-slider label { margin-right: 0; }
                                #material-editor-debugger .control-row-slider input[type=range] { width: 100%; }
                                #material-editor-debugger .control-row .value-span { width: 40px; height: 18px; line-height: 18px; text-align: right; font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.4); padding: 0 4px; border-radius: 3px; box-sizing: border-box; }
                                #material-editor-debugger input[type=range] { flex-grow: 1; width: 120px; height: 14px; }
                                #material-editor-debugger input[type=color] { width: 100%; height: 22px; border: 1px solid #555; padding: 1px; background: #333; box-sizing: border-box; }
                                .main-layout-wrapper { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); gap: 6px; flex-grow: 1; min-height: 0; overflow: hidden; padding: 3px; background: rgba(0,0,0,0.2); border-radius: 2px; transition: grid-template-columns 0.3s ease; }
                                .fx-column { display: flex; flex-direction: column; gap: 3px; overflow-y: auto; padding-right: 5px; }
                                .pane-title { text-align: center; font-size: 1.2em; font-weight: bold; color: #efefef; margin: 2px 0 4px 0; padding-bottom: 3px; border-bottom: 1px solid #555; }
                                
                                /* Dynamic column width states */
                                .main-layout-wrapper.col-1-active { grid-template-columns: minmax(0, 2fr) minmax(0, 0.5fr) minmax(0, 0.5fr); }
                                .main-layout-wrapper.col-2-active { grid-template-columns: minmax(0, 0.5fr) minmax(0, 2fr) minmax(0, 0.5fr); }
                                .main-layout-wrapper.col-3-active { grid-template-columns: minmax(0, 0.5fr) minmax(0, 0.5fr) minmax(0, 2fr); }
                                .main-layout-wrapper.multiple-active { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr); }
                                #material-editor-debugger #material-editor-profiles-section > details { margin-bottom: 0; }
                                #material-editor-debugger #material-editor-profiles-section .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding-top: 3px; }
                                #material-editor-debugger #material-editor-profiles-section .profile-group { display: flex; flex-direction: column; gap: 4px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 2px; min-width: 250px; }
                                .profile-controls { display: flex; flex-direction: column; gap: 4px; }
                                #material-editor-debugger select { width: 100%; text-transform: capitalize; background-color: #222; color: #fff; border: 1px solid #555; border-radius: 2px; height: 20px; font-size: 11px; }
                                .star-icon { font-size: 0 !important; background-color: #ccc; width: 12px; height: 12px; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); margin: auto; }
                                #material-editor-debugger.minimized { 
                                    width: auto; 
                                    height: auto; 
                                    padding: 4px; 
                                    gap: 0; 
                                    box-shadow: 0 0 10px rgba(0,0,0,0.5); 
                                    right: auto; 
                                    min-width: 0;
                                    min-height: 0;
                                    resize: none;
                                    overflow: hidden;
                                }
                                #material-editor-debugger.minimized #material-editor-header { padding: 0; cursor: move; }
                                #material-editor-debugger.minimized > *:not(#material-editor-header) { display: none; }
                                #material-editor-debugger.minimized #material-editor-help-btn, #material-editor-debugger.minimized #material-editor-user-guide-btn, #material-editor-debugger.minimized #material-editor-title { display: none; }
                                #material-editor-debugger .font-selector-dropdown { height: 24px; padding-left: 8px; }
                                
                                /* --- Clock Styles --- */
                                #debugger-clock-container { position: relative; width: 100px; height: 100px; margin: 0 auto; border-radius: 50%; cursor: grab; user-select: none; }
                                #debugger-clock-container:active { cursor: grabbing; }
                                #debugger-clock-container .clock-face {
                                    width: 100%; height: 100%; border-radius: 50%;
                                    background: var(--clock-gradient, radial-gradient(circle, #888, #444));
                                    border: 3px solid #222;
                                    box-shadow: 0 0 15px rgba(0,0,0,0.6) inset, 0 0 10px rgba(255,255,255,0.1);
                                    position: relative;
                                    overflow: hidden;
                                    transition: background 0.5s ease;
                                }
                                #debugger-clock-container .clock-face::after {
                                    content: '';
                                    position: absolute;
                                    top: 0; left: 0; right: 0; bottom: 0;
                                    background: radial-gradient(circle at 40% 40%, rgba(255,255,255,0.15), transparent 60%);
                                    pointer-events: none;
                                }
                                #debugger-clock-hand {
                                    position: absolute;
                                    width: 24px;
                                    height: 50%;
                                    top: 0; left: 50%;
                                    transform-origin: bottom center;
                                    margin-left: -12px;
                                    pointer-events: none;
                                    z-index: 2;
                                }
                                #debugger-clock-icon { 
                                    width: 100%; 
                                    height: auto; 
                                    filter: drop-shadow(0 0 2px black); 
                                    border-radius: 50%; 
                                }
                                #debugger-clock-container .time-marker { position: absolute; color: white; font-weight: bold; text-shadow: 0 0 2px black; font-size: 10px; z-index: 1; }
                                #debugger-clock-container .time-marker.m-12 { top: 1px; left: 50%; transform: translateX(-50%); }
                                #debugger-clock-container .time-marker.m-6 { top: 50%; left: 3px; transform: translateY(-50%); }
                                #debugger-clock-container .time-marker.m-18 { top: 50%; right: 3px; transform: translateY(-50%); }
                                #debugger-clock-container .time-marker.m-0 { bottom: 1px; left: 50%; transform: translateX(-50%); }
                                #debugger-clock-controls { display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; }
                                #debugger-clock-controls button { width: 25px; height: 25px; font-size: 1em; font-weight: bold; background: #3a3a3a; border: 1px solid #666; color: #ccc; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; }
                                #debugger-clock-controls button:hover { background: #555; border-color: #FF6B35; color: #fff; transform: scale(1.05); }
                                #debugger-clock-controls input { width: 50px; height: 25px; text-align: center; font-size: 1em; background: #2a2a2a; color: white; border: 1px solid #666; border-radius: 4px; }
                                #debugger-clock-wrapper .clock-disclaimer {
                                    font-size: 10px;
                                    color: #888;
                                    text-align: center;
                                    margin: 4px 0 0 0;
                                    max-width: 150px;
                                    line-height: 1.2;
                                }
                  
                  /* --- End Clock Styles --- */

                                .fx-status-light { display: inline-block; width: 12px; height: 12px; border-radius: 50%; border: 1px solid #111; margin-right: 5px; vertical-align: middle; }
                                .fx-status-light.green { background-color: #FF6B35; box-shadow: 0 0 8px rgba(255, 107, 53, 0.6); }
                                .fx-status-light.blue { background-color: #FFD23F; box-shadow: 0 0 8px rgba(255, 210, 63, 0.6); }
                                .fx-status-light.grey { background-color: #888; }
                                .fx-status-light.red { background-color: #EE4266; box-shadow: 0 0 8px rgba(238, 66, 102, 0.6); }
                                .profile-controls button:disabled { background-color: #333; color: #777; cursor: not-allowed; border-color: #555; }
                                .description-text { font-size: 10px; color: #aaa; margin: 2px 0 4px 0; padding-left: 3px; }
                                .warning-box { background: #552222; border: 1px solid #ff6666; padding: 5px; margin: 5px 0; border-radius: 3px; font-size: 10px; }
                                .warning-box strong { color: #ffaaaa; }
                                .profile-group-title { font-weight: bold; text-align: center; display: block; margin-bottom: 5px; color: #ccc; border-bottom: 1px solid #555; padding-bottom: 3px;}
                                    
    /* Main Controls - 3-Column Layout with Clock */
    .main-controls-three-column-layout {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: start;
    }

    .main-controls-column {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .main-controls-clock {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      border: 1px solid rgba(100, 120, 150, 0.2);
      min-width: 150px;
    }

    #debugger-ui-clock-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
                                details.effect-unavailable { border-style: dashed; border-color: #444; }
                                details.effect-unavailable > summary { opacity: 0.7; }
                                details.effect-unavailable > summary .summary-label { text-decoration: line-through; }
                                #new-controls-column-0 { border: 2px dashed #40a0fa; padding: 5px; border-radius: 5px; }
                                #new-controls-column-0 > details > summary { background-color: rgba(64, 160, 250, 0.2); }
                                .map-tools-toolbar { background: rgba(0,0,0,0.3); border: 1px solid #666; border-radius: 5px; padding: 6px; text-align: center; display: flex; flex-direction: column; gap: 6px; }
                                .toolbar-title { font-weight: bold; font-size: 1.2em; color: #aadcff; border-bottom: 1px solid #555; padding-bottom: 5px; margin-bottom: 5px; letter-spacing: 1px;}
                                .toolbar-button { width: 100%; padding: 8px; font-weight: bold; font-size: 1.1em; background-color: #225522; border: 1px solid #66aa66; color: #ccffcc; border-radius: 3px; cursor: pointer; transition: background-color 0.2s; }
                                .toolbar-button:hover { background-color: #337733; }
                                .toolbar-status { font-size: 0.9em; color: #aaa; }
                                .toolbar-status span { font-weight: bold; padding: 2px 6px; border-radius: 10px; font-size: 0.9em; }
                                .toolbar-status .status-inactive { color: #ffcccc; background-color: #662222; }
                                .toolbar-status .status-active { color: #ccffcc; background-color: #226622; animation: pulse 2s infinite; }
                                @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(102, 170, 102, 0.7); } 70% { box-shadow: 0 0 0 8px rgba(102, 170, 102, 0); } 100% { box-shadow: 0 0 0 0 rgba(102, 170, 102, 0); } }
                            </style>`;
  }

  _getBaseHTML() {
    return `
                        <div id="material-editor-header">
                            <div class="header-buttons-left">
                              <a id="material-editor-help-btn" class="header-btn" href="https://github.com/Garsondee/map-shine" target="_blank" rel="noopener noreferrer" title="Help/Info (Opens GitHub page)">?</a>
                              <button data-action="open-user-guide" id="material-editor-user-guide-btn" class="header-btn" title="Open User Guide" style="background-color: #2a552a; border-color: #6aaa6a; color: #ccffcc; width: auto; padding: 0 8px;"><i class="fas fa-book-open"></i> User Guide</button>
                              <label style="display: flex; align-items: center; gap: 6px; margin-left: 12px; padding: 4px 8px; background: rgba(255, 59, 48, 0.1); border: 1px solid rgba(255, 59, 48, 0.3); border-radius: 4px; cursor: pointer;" title="Master switch to disable ALL Map Shine effects instantly. Uncheck to put the module in standby mode and stop all rendering/animation.">
                                <input type="checkbox" id="control-enabled" data-path="enabled" style="margin: 0; cursor: pointer;">
                                <span style="color: #ffaaaa; font-size: 13px; font-weight: 600; white-space: nowrap;">⚠️ Module Enabled</span>
                              </label>
                            </div>
                            <h3 id="material-editor-title">Map Shine</h3>
                            <div class="header-buttons-right">
                              <a href="https://www.patreon.com/c/MythicaMachina" target="_blank" class="header-btn header-patreon-btn" title="Support on Patreon" style="background: linear-gradient(135deg, #f96854 0%, #ff5c4d 100%); border-color: rgba(255, 255, 255, 0.3); color: #fff; width: auto; padding: 0 8px; font-weight: 600; transition: all 0.2s ease;"><i class="fab fa-patreon"></i> Patreon</a>
                              <a href="https://www.foundryvtt.store/creators/mythica-machina" target="_blank" class="header-btn header-store-btn" title="Foundry Store" style="transition: all 0.2s ease;"><i class="fas fa-dice-d20"></i></a>
                              <a href="https://www.drivethrurpg.com/en/publisher/29377/mythicamachina" target="_blank" class="header-btn header-store-btn" title="DriveThruRPG" style="transition: all 0.2s ease;"><i class="fas fa-book"></i></a>
                              <button data-action="minimize" id="material-editor-minimize-btn" class="header-btn" title="Minimize">-</button>
                              <button data-action="close" id="material-editor-close-btn" class="header-btn" title="Close" style="color: #ff8080;">X</button>
                            </div>
                        </div>
                        <div id="main-controls-section"></div>
                        <div id="material-editor-profiles-section"></div>
                        <div id="effects-search-wrapper" style="padding: 6px; margin-bottom: 6px; background: rgba(10, 10, 10, 0.4); border-radius: 4px;">
                            <input type="text" id="effects-search-input" placeholder="Search effects..." style="width: 100%; padding: 6px 10px; background: rgba(0,0,0,0.4); border: 1px solid #444; border-radius: 3px; color: #fff; font-family: 'Inter', system-ui, sans-serif; font-size: 12px;">
                        </div>
                        <div class="main-layout-wrapper">
                            <div id="fx-column-1" class="fx-column"></div>
                            <div id="fx-column-2" class="fx-column"></div>
                            <div id="fx-column-3" class="fx-column"></div>
                        </div>
                    `;
  }

  _buildMainControlsSection() {
    const profileManager = game.mapShine.profileManager;
    const hasSceneProfiles = profileManager.status.sceneHasProfiles;
    const isGm = game.user.isGM;

    let contentHTML;

    if (hasSceneProfiles) {
      const transitionDuration =
        profileManager.activeConfig.sceneAppearance?.transitionDuration ??
        MODULE_DEFAULTS.sceneAppearance.transitionDuration;
      const transitionSeconds = Math.round(transitionDuration / 1000);

      contentHTML = `
                    <div class="main-controls-grid">
                        <div class="main-controls-col">
                            <label for="scene-profile-select">Scene Appearance</label>
                            <div class="profile-select-wrapper">
                                <select id="scene-profile-select"></select>
                                <div class="profile-management-buttons">
                                    <button data-action="rename-scene-profile" title="Rename Selected Profile" ${
                                      !isGm ? "disabled" : ""
                                    }><i class="fas fa-edit"></i></button>
                                    <button data-action="delete-scene-profile" title="Delete Selected Profile" ${
                                      !isGm ? "disabled" : ""
                                    }><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <div class="new-profile-controls">
                              <input type="text" id="new-scene-profile-name" placeholder="New Appearance Name..." ${
                                !isGm ? "disabled" : ""
                              }>
                              <button data-action="save-scene-profile" id="save-scene-profile-btn" title="Save the current settings as a new scene appearance profile. (GM Only)" ${
                                !isGm ? "disabled" : ""
                              }><i class="fas fa-save"></i> Save As New</button>
                            </div>
                        </div>
                        <div class="main-controls-col">
                            <div class="control-row control-row-slider">
                                <label for="scene-transition-duration" title="How long the transition between appearances should take.">Transition Time</label>
                                <input type="range" id="scene-transition-duration" data-path="sceneAppearance.transitionDuration" min="0" max="30000" step="500" value="${transitionDuration}">
                                <span id="scene-transition-duration-value" class="value-span">${transitionSeconds}s</span>
                            </div>
                            <div class="main-controls-buttons">
                              <button data-action="preview-profile" id="preview-profile-btn"><i class="fas fa-eye"></i> Preview</button>
                              <button data-action="activate-profile" id="activate-profile-btn" class="activate-btn" ${
                                !isGm ? "disabled" : ""
                              }><i class="fas fa-broadcast-tower"></i> Activate for All</button>
                            </div>
                            <div class="transition-status-wrapper">
                                <span id="transition-status-light" class="fx-status-light grey"></span>
                                <span id="transition-status-text">Idle</span>
                            </div>
                        </div>
                    </div>
                    <hr style="border-color: #555; margin: 6px 0;">
                    <div class="main-controls-buttons" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                      <button data-action="update-active-appearance" id="update-active-appearance-btn" title="Update the active scene appearance with your current temporary changes. (GM Only)">
                          <i class="fas fa-save"></i> Update Active
                      </button>
                      <button data-action="revert-changes" id="revert-changes-btn" title="Discard all of your temporary changes and revert to the last saved state for the active profile.">
                          <i class="fas fa-undo"></i> Revert Changes
                      </button>
                      <button data-action="new-clean-profile" id="new-clean-profile-btn" title="Create a new appearance profile based on the module's default settings. (GM Only)" ${
                        !isGm ? "disabled" : ""
                      }>
                          <i class="fas fa-plus-square"></i> New Clean Profile
                      </button>
                      <button data-action="copy-settings" id="copy-active-settings-btn" title="Copy the current active settings to the clipboard, which can then be used to create a new hard-coded profile. (GM Only)" ${
                        !isGm ? "disabled" : ""
                      }>
                          <i class="fas fa-clipboard"></i> DEBUG: Copy Settings to Clipboard
                      </button>
                    </div>
                `;
    } else {
      contentHTML = `
                    <div class="main-controls-init">
                        <p>This scene is using the world default profile. Create scene-specific profiles to enable advanced visual controls.</p>
                        <button data-action="create-scene-profiles" ${
                          !isGm ? "disabled" : ""
                        }><i class="fas fa-unlock-alt"></i> Create First Profile</button>
                        <button data-action="new-clean-profile" style="margin-top: 5px;" ${
                          !isGm ? "disabled" : ""
                        }><i class="fas fa-plus-square"></i> Create First (Clean)</button>
                    </div>
                    <hr style="border-color: #555; margin: 6px 0;">
                    <div class="main-controls-buttons" style="display: grid; grid-template-columns: 1fr; gap: 6px;">
                      <button data-action="revert-changes" id="revert-changes-btn" title="Discard all of your temporary changes and revert to the last saved state for the active profile.">
                          <i class="fas fa-undo"></i> Revert Changes
                      </button>
                    </div>
                `;
    }

    return `
                <div class="main-controls-wrapper">
                    <h3 class="pane-title">Main Controls</h3>
                    <div class="main-controls-three-column-layout">
                        <div class="main-controls-column main-controls-left">
                            ${DebuggerUIBuilder._createSliderHTML(
                              "timeControl.globalTime",
                              "Global Time Speed",
                              0,
                              200,
                              1,
                              "Controls the speed at which all time-based effects animate (0% = paused, 100% = normal, 200% = double speed)"
                            )}
                            ${contentHTML}
                        </div>
                        <div class="main-controls-column main-controls-clock">
                            <div id="debugger-ui-clock-container">
                                <!-- Clock will be rendered here by JS -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
  }

  _buildProfileSection() {
    const isGm = game.user.isGM;
    const clipboardSection = isGm
      ? `
                
                <div class="profile-group">
                    <strong class="profile-group-title">Quick Copy/Paste</strong>
                    <div style="display: flex; gap: 5px; margin-top: 5px;">
                        <button id="profile-copy-settings" data-action="copy-settings" style="flex: 1;" title="Copy the current active settings to temporary storage for pasting.">Copy Settings</button>
                        <button id="profile-paste-settings" data-action="paste-settings" style="flex: 1;" title="Load previously copied settings as temporary changes.">Paste Settings</button>
                    </div>
                </div>
                    `
      : ``;

    return `
                        <details id="details-profile-management">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <strong style="font-size: 1.1em;">Map Point Tools and Debug Options</strong>
                            </summary>
                            <div class="profile-grid">
                                ${clipboardSection}
                                <div class="profile-group">
                                    <strong class="profile-group-title">Tools & Diagnostics</strong>
                                    ${this._buildDiagnosticSection()}
                                </div>
                            </div>
                        </details>
                    `;
  }

  _buildDiagnosticSection() {
    const suffixOptions = {};

    return `
                        <details id="details-diagnostic">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    ${DebuggerUIBuilder._createCheckboxHTML(
                                      "diagnostic.enabled",
                                      "<strong>Diagnostic Mode</strong>",
                                      true
                                    )}
                                </div>
                            </summary>
                            <div style="padding-top: 5px;">
                                <p class="description-text">A tool for developers and artists to inspect effect maps and pixel values.</p>
                                ${DebuggerUIBuilder._createCheckboxHTML(
                                  "diagnostic.showMasks",
                                  "Show Discovered Masks & Outlines"
                                )}
                                ${DebuggerUIBuilder._createSelectHTML(
                                  "diagnostic.displaySuffix",
                                  "Display Texture",
                                  suffixOptions,
                                  "Select which mask or generated texture to display."
                                )}
                                ${DebuggerUIBuilder._createCheckboxHTML(
                                  "diagnostic.pixelInspector",
                                  "Enable Pixel Inspector Tooltip"
                                )}
                                ${DebuggerUIBuilder._createCheckboxHTML(
                                  "diagnostic.showIlluminationPreview",
                                  "Show Illumination Preview"
                                )}
                                ${DebuggerUIBuilder._createCheckboxHTML(
                                  "showTokenMask",
                                  "Show Token Mask"
                                )}
                                <button id="output-config-btn" title="Log the current full config object to the console for copy/pasting." style="width: 100%; margin-top: 4px;">Log Full Config to Console</button>
                            </div>
                        </details>
                    `;
  }

  static _createGradientEditorHTML(path, label, type = "color") {
    const id = this._createSafeId(path);
    let valueControlHTML;

    if (type === "brightness") {
      valueControlHTML = `
                    <div class="control-row control-row-slider">
                        <label for="${id}-brightness-slider">Brightness</label>
                        <input type="range" id="${id}-brightness-slider" data-no-path="true" min="0" max="1" step="0.01" value="1" title="Gradient stop control, not a config slider">
                        <span class="value-span" id="${id}-brightness-value">1.00</span>
                    </div>
                `;
    } else {
      // type === 'color'
      valueControlHTML = `
                    <div class="control-row">
                        <label for="${id}-color-picker">Color</label>
                        <input type="color" id="${id}-color-picker" value="#ffffff">
                    </div>
                `;
    }

    return `
                <div class="gradient-editor-wrapper" id="${id}" data-path="${path}" data-editor-type="${type}">
                    <div class="control-row">
                        <label>${label}</label>
                        <button type="button" class="reset-gradient-btn" data-action="reset-gradient" title="Reset to Start/End points">Reset</button>
                    </div>
                    <div class="gradient-bar-container">
                        <div class="gradient-bar-bg">
                            <div class="gradient-bar-preview"></div>
                        </div>
                        <div class="gradient-stops-container"></div>
                    </div>
                    <div class="gradient-editor-controls">
                        <div class="control-row control-row-slider">
                            <label for="${id}-alpha-slider">Alpha</label>
                            <input type="range" id="${id}-alpha-slider" data-no-path="true" min="0" max="1" step="0.01" value="1" title="Gradient stop control, not a config slider">
                            <span class="value-span" id="${id}-alpha-value">1.00</span>
                        </div>
                        ${valueControlHTML}
                    </div>
                </div>
            `;
  }

  static _createSafeId(path) {
    return `control-${path.replace(/\.|\[|\]|\s/g, "-")}`;
  }

  /**
   * Determines the type and icon for an accordion based on its effect ID.
   * @param {string} id - The effect key/ID
   * @returns {{type: string, icon: string}} Object containing type and FontAwesome icon class
   */
  static _getAccordionTypeInfo(id) {
    // Lighting Settings
    if (id === "lighting") {
      return { type: "lighting", icon: "fa-lightbulb" };
    }

    // Particle Effects
    const particleEffects = [
      "sparks",
      "fire",
      "candle",
      "pressurisedSteam",
      "flies",
      "lightning",
      "smellyFlies",
    ];
    if (particleEffects.includes(id)) {
      return { type: "particle", icon: "fa-sparkles" };
    }

    // Shadow/Layer Effects
    const shadowEffects = ["cloudShadows", "canopyShadows", "buildingShadows"];
    if (shadowEffects.includes(id)) {
      return { type: "shadow", icon: "fa-cloud-sun" };
    }

    // Shader/Material Effects
    const shaderEffects = [
      "metallicShine",
      "iridescence",
      "heatDistortion",
      "prismEffect",
    ];
    if (shaderEffects.includes(id)) {
      return { type: "shader", icon: "fa-gem" };
    }

    // Water Effects
    const waterEffects = ["water", "waterEdgeFoam", "underwaterCaustics"];
    if (waterEffects.includes(id)) {
      return { type: "water", icon: "fa-water" };
    }

    // Color Correction/Grading
    const colorEffects = ["timeOfDayColorGrade", "groundGlow"];
    if (colorEffects.includes(id)) {
      return { type: "color", icon: "fa-palette" };
    }

    // UI/System Settings
    const systemEffects = [
      "fontManager",
      "loadingScreen",
      "pauseEffectOverlay",
    ];
    if (systemEffects.includes(id)) {
      return { type: "system", icon: "fa-cog" };
    }

    // Structural/Scene Effects
    const structuralEffects = ["structuralEffect", "overheadEffect"];
    if (structuralEffects.includes(id)) {
      return { type: "structural", icon: "fa-layer-group" };
    }

    // Post-Processing Effects
    if (id === "postProcessing-colorCorrection") {
      return { type: "pp-color", icon: "fa-palette" };
    }
    if (id === "postProcessing-dynamicExposure") {
      return { type: "pp-exposure", icon: "fa-sun" };
    }
    if (id === "postProcessing-vignette") {
      return { type: "pp-lens", icon: "fa-circle" };
    }
    if (id === "postProcessing-lensDistortion") {
      return { type: "pp-lens", icon: "fa-camera" };
    }
    if (id === "postProcessing-chromaticAberration") {
      return { type: "pp-lens", icon: "fa-eye-dropper" };
    }
    if (id === "postProcessing-grain") {
      return { type: "pp-texture", icon: "fa-droplet" };
    }
    if (id === "postProcessing-tiltShift") {
      return { type: "pp-lens", icon: "fa-video" };
    }

    // Default fallback
    return { type: "default", icon: "fa-wand-magic-sparkles" };
  }

  /**
   * Helper to generate icon HTML for inline post-processing effects
   */
  static _getPostProcessingIconHTML(id) {
    const typeInfo = this._getAccordionTypeInfo(id);
    return `<i class="fas ${typeInfo.icon} accordion-icon" data-accordion-type="${typeInfo.type}"></i>`;
  }

  static _createAccordionHTML(id, title, content, headerExtra = "") {
    let path = `${id}.enabled`;
    const typeInfo = this._getAccordionTypeInfo(id);

    // Unified button and element styles - explicit box-sizing for consistency
    const UNIFIED_STYLES = {
      icon: "width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px;",
      button:
        "width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.3); background: rgba(0,0,0,0.2); border-radius: 3px; cursor: pointer; transition: all 0.2s;",
      buttonIcon: "font-size: 12px; pointer-events: none;",
      checkbox:
        "width: 24px; height: 24px; min-width: 24px; min-height: 24px; max-width: 24px; max-height: 24px; box-sizing: border-box; margin: 0; padding: 0; flex-shrink: 0; cursor: pointer; vertical-align: middle;",
      label:
        "font-weight: 600; font-size: 14px; flex-shrink: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",
      badge:
        "display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; flex-shrink: 0;",
      plusButton:
        "width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 250, 64, 0.5); background: rgba(76, 250, 64, 0.15); border-radius: 3px; cursor: pointer; transition: all 0.2s;",
    };

    // Unified hover styles and size overrides
    const accordionStyles = ``;

    const iconHtml = `<i class="fas ${typeInfo.icon} accordion-icon" data-accordion-type="${typeInfo.type}" style="${UNIFIED_STYLES.icon}"></i>`;

    // Separate badges from buttons in headerExtra
    const isBadge =
      headerExtra.includes("world-based-badge") ||
      headerExtra.includes("clock-based-badge");
    const badgeHtml = isBadge
      ? `<span style="${UNIFIED_STYLES.badge}">${headerExtra}</span>`
      : "";
    const plusButtonHtml = isBadge ? "" : headerExtra;

    // Special cases for accordions tied to game settings, not a single profile path.
    if (
      id === "loadingScreen" ||
      id === "fontManager" ||
      id === "pauseEffectOverlay"
    ) {
      path = "loadingScreen.accordion"; // Dummy path
      const labelHtml = `<span class="summary-label" style="${UNIFIED_STYLES.label}">${title}</span>`;
      const resetButtonHtml = `<button type="button" class="reset-accordion-btn" data-action="reset-accordion" data-effect-key="${id}" title="Reset this section to defaults">R</button>`;
      const copyButtonHtml = `<button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="${id}" title="Copy this section's settings to temporary storage" style="${UNIFIED_STYLES.button}"><i class="fas fa-copy" style="${UNIFIED_STYLES.buttonIcon}"></i></button>`;
      const pasteButtonHtml = `<button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="${id}" title="Paste previously copied settings to this section" style="${UNIFIED_STYLES.button}"><i class="fas fa-paste" style="${UNIFIED_STYLES.buttonIcon}"></i></button>`;

      return `${accordionStyles}<details id="details-${id}" class="accordion-type-${typeInfo.type}">
          <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
            <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
              ${iconHtml}
              ${labelHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
              ${badgeHtml}
              ${plusButtonHtml}
              ${resetButtonHtml}
              ${copyButtonHtml}
              ${pasteButtonHtml}
            </div>
          </summary>
          <div style="padding-top: 2px;">${content}</div>
        </details>`;
    }

    const checkboxId = this._createSafeId(path);
    const labelHtml = `<span class="summary-label" style="${UNIFIED_STYLES.label}">${title}</span>`;
    const resetButtonHtml = `<button type="button" class="reset-accordion-btn" data-action="reset-accordion" data-effect-key="${id}" title="Reset this section to defaults">R</button>`;
    const copyButtonHtml = `<button type="button" class="header-btn" data-action="copy-accordion" data-effect-key="${id}" title="Copy this section's settings to temporary storage" style="${UNIFIED_STYLES.button}"><i class="fas fa-copy" style="${UNIFIED_STYLES.buttonIcon}"></i></button>`;
    const pasteButtonHtml = `<button type="button" class="header-btn" data-action="paste-accordion" data-effect-key="${id}" title="Paste previously copied settings to this section" style="${UNIFIED_STYLES.button}"><i class="fas fa-paste" style="${UNIFIED_STYLES.buttonIcon}"></i></button>`;
    const checkboxHtml = `<input type="checkbox" name="${path}" id="${checkboxId}" data-path="${path}" style="${UNIFIED_STYLES.checkbox}">`;

    return `${accordionStyles}<details id="details-${id}" class="accordion-type-${typeInfo.type}">
        <summary style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 4px 8px;">
          <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 1; min-width: 0;">
            ${iconHtml}
            ${labelHtml}
          </div>
          <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; padding-left: 8px;">
            ${badgeHtml}
            ${plusButtonHtml}
            ${resetButtonHtml}
            ${copyButtonHtml}
            ${pasteButtonHtml}
            ${checkboxHtml}
          </div>
        </summary>
        <div style="padding-top: 2px;">${content}</div>
      </details>`;
  }

  static _createCheckboxHTML(path, label, isSummary = false, title = "") {
    const id = this._createSafeId(path);
    const titleAttr = title ? `title="${title}"` : "";
    const checkbox = `<div class="widget-group"><input type="checkbox" name="${path}" id="${id}" data-path="${path}"></div>`;
    const labelHtml = isSummary
      ? `<span class="summary-label" ${titleAttr}>${label}</span>`
      : `<label for="${id}" class="summary-label" ${titleAttr}>${label}</label>`;
    if (isSummary) {
      return `${labelHtml}${checkbox}`;
    }
    return `<div class="control-row">${labelHtml}${checkbox}</div>`;
  }

  static _createSliderHTML(
    path,
    label,
    min,
    max,
    step,
    title = "",
    initialValue = null
  ) {
    const id = this._createSafeId(path);
    const titleAttr = title ? `title="${title}"` : "";
    const valueAttr = initialValue !== null ? `value="${initialValue}"` : "";
    return `<div class="control-row control-row-slider"><label for="${id}" ${titleAttr}>${label}</label><input type="range" name="${path}" id="${id}" data-path="${path}" min="${min}" max="${max}" step="${step}" ${valueAttr}><input type="number" id="${id}-value" class="value-span" data-slider-id="${id}" min="${min}" max="${max}" step="${step}" ${valueAttr}></div>`;
  }

  static _createReadOnlyDisplayHTML(path, label, title = "") {
    const id = this._createSafeId(path);
    const titleAttr = title ? `title="${title}"` : "";
    return `<div class="control-row"><label ${titleAttr}>${label}</label><span class="read-only-value" id="${id}-readonly" data-readonly-path="${path}">-</span></div>`;
  }

  static _createColorPickerHTML(path, label) {
    const id = this._createSafeId(path);
    return `<div class="control-row"><label for="${id}">${label}</label><div class="widget-group" style="flex-grow: 1;"><input type="color" name="${path}" id="${id}" data-path="${path}"></div></div>`;
  }
  static _createSelectHTML(path, label, options, title = "", className = "") {
    const id = this._createSafeId(path);
    const titleAttr = title ? `title="${title}"` : "";
    const classAttr = className ? `class="${className}"` : "";

    // This new logic handles both flat lists and lists with disabled headers.
    const opts = Object.entries(options)
      .map(([name, value]) => {
        // Check for the special disabled header format
        if (typeof value === "object" && value !== null && value.disabled) {
          return `<option disabled>${name}</option>`;
        }
        // Otherwise, create a normal option
        return `<option value="${value}">${name}</option>`;
      })
      .join("");

    return `<div class="control-row"><label for="${id}" ${titleAttr}>${label}</label><select name="${path}" id="${id}" data-path="${path}" ${classAttr}>${opts}</select></div>`;
  }
  static _createGradientSelectHTML(path, label) {
    const id = this._createSafeId(path);
    const opts = Object.entries(GRADIENT_PRESETS)
      .map(([name, data]) => {
        const gradientCSS = `linear-gradient(to right, ${data.colors.join(
          ", "
        )})`;
        return `<option value="${name}" style="background: ${gradientCSS};">${name}</option>`;
      })
      .join("");
    return `<div class="control-row"><label for="${id}">${label}</label><select name="${path}" id="${id}" data-path="${path}" class="gradient-picker">${opts}</select></div>`;
  }

  static _createPresetSelectHTML(path, label, presets) {
    const id = this._createSafeId(path);
    const opts = Object.entries(presets)
      .map(([key, data]) => `<option value="${key}">${data.name}</option>`)
      .join("");
    return `<div class="control-row"><label for="${id}">${label}</label><select name="${path}" id="${id}" data-path="${path}">${opts}</select></div>`;
  }

  static _createTextInputHTML(path, label, title = "") {
    const id = this._createSafeId(path);
    const titleAttr = title ? `title="${title}"` : "";
    return `<div class="control-row" style="margin-bottom: 3px;"><label for="${id}" ${titleAttr}>${label}</label><input type="text" name="${path}" id="${id}" data-path="${path}" style="flex-grow:1;font-family:monospace;font-size:10px;"></div>`;
  }

  static _createTextInputWithPickerHTML(
    path,
    label,
    title = "",
    pickerType = "image"
  ) {
    const id = this._createSafeId(path);
    const titleAttr = title ? `title="${title}"` : "";
    return `
                        <div class="control-row" style="margin-bottom: 3px;">
                            <label for="${id}" ${titleAttr}>${label}</label>
                            <div class="widget-group" style="flex-grow:1; display:flex; gap: 3px;">
                                <input type="text" name="${path}" id="${id}" data-path="${path}" style="flex-grow:1; font-family:monospace; font-size:10px;">
                                <button type="button" class="file-picker-btn" data-fp-target="${id}" data-fp-type="${pickerType}" title="Browse Files"><i class="fas fa-file-import"></i></button>
                            </div>
                        </div>
                    `;
  }

  static _createTextureInputHTML(key, label) {
    return `<div class="control-row" style="margin-bottom: 5px;"><label><span id="status-textures-${key}" class="traffic-light unknown"></span>${label}</label><input type="text" id="texture-path-${key}" disabled placeholder="Not found..." title="This path is discovered automatically based on the base map's filename. (e.g., 'map.webp' -> 'map_Specular.webp')"></div>`;
  }

  static _createListManagerHTML(path, itemLabel, itemType = "text") {
    const id = this._createSafeId(path);
    const listContainerId = `${id}-list-container`;
    const addButtonId = `${id}-add-btn`;
    const addButtonLabel = `Add ${itemLabel}`;

    return `
          <div id="${id}" class="list-manager-container" data-path="${path}" data-item-type="${itemType}">
            <div class="control-row">
              <label>${itemLabel}s</label>
              <button type="button" id="${addButtonId}" data-action="add-list-item" class="add-item-btn">${addButtonLabel}</button>
            </div>
            <div id="${listContainerId}" class="list-items-container" style="display: flex; flex-direction: column; gap: 4px; margin-top: 5px; padding-left: 5px;">
              <!-- Items will be populated by JS -->
            </div>
          </div>
        `;
  }

  static _createTileVisibilityHTML(pathPrefix) {
    if (!canvas.scene) {
      return '<p class="description-text" style="color: #ffcc00;">No active scene. Load a scene to configure tile visibility.</p>';
    }

    // Note: Data is stored in scene flags, not in profile config
    let html = '<div class="tile-visibility-container">';
    
    // Scene tiles (no background - clouds show everywhere by default)
    const tiles = canvas.tiles?.placeables || [];
    if (tiles.length === 0) {
      html += '<p class="description-text" style="color: #888;">No tiles in this scene.</p>';
    } else {
      html += '<p class="description-text" style="margin-bottom: 4px;">Uncheck tiles where cloud tops should NOT appear:</p>';
      for (const tile of tiles) {
        const tilePath = tile.document.texture.src;
        const tileFilename = tilePath.split('/').pop();
        const checkboxId = this._createSafeId('cloudTops.' + tilePath);
        html += `
          <div class="control-row">
            <label for="${checkboxId}" title="${tilePath}" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <i class="fas fa-layer-group" style="margin-right: 5px; color: #aaa;"></i>${tileFilename}
            </label>
            <div class="widget-group">
              <input type="checkbox" id="${checkboxId}" data-tile-path="${tilePath}" checked>
            </div>
          </div>`;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Creates point/line/area group controls for a specific effect.
   * @param {string} effectKey - The effect identifier (e.g., 'candleFlame', 'fire', 'lightning')
   * @param {object} options - Configuration options
   * @param {string} options.effectName - Display name for the effect
   * @param {string} options.defaultGroupType - Default type for new groups ('point', 'line', 'area')
   * @param {string} options.description - Description text for the section
   * @returns {string} HTML string for the point group controls
   */
  static _createEffectPointGroupsHTML(effectKey, options = {}) {
    const {
      effectName = EFFECT_SOURCE_OPTIONS[effectKey] || effectKey,
      defaultGroupType = "area",
      description = `Create and manage point groups for ${effectName} effects. These points are placed directly on the canvas.`,
    } = options;

    // Get all groups from the current scene that target this effect
    const allGroups = MapPointsManager.getGroups();
    const effectGroups = Object.values(allGroups).filter(
      (g) => g.isEffectSource && g.effectTarget === effectKey
    );

    // Helper to create group list items
    const createGroupItemHTML = (group) => `
      <details class="group-list-item">
        <summary>
          <span class="accordion-toggle"></span>
          <span class="mp-group-item-status ${
            group.isBroken ? "broken" : "valid"
          }" 
                title="${group.isBroken ? group.reason : "Valid"}"></span>
          <span class="group-item-label">${Handlebars.escapeExpression(
            group.label
          )}</span>
          <span class="group-item-meta">${group.type} • ${
      group.points.length
    } pts</span>
          <button type="button" class="group-delete-btn" data-action="delete-group" data-group-id="${
            group.id
          }" 
                  title="Delete this group">
            <i class="fas fa-trash"></i>
          </button>
        </summary>
        <div class="group-item-content">
          
          <!-- Group Properties -->
          <div class="control-row">
            <label>Label:</label>
            <input type="text" data-path="group.${
              group.id
            }.label" value="${Handlebars.escapeExpression(
      group.label
    )}" style="flex: 1;">
          </div>
          
          <div class="control-row">
            <label>Type:</label>
            <select data-path="group.${group.id}.type" style="flex: 1;">
              <option value="point" ${
                group.type === "point" ? "selected" : ""
              }>Points</option>
              <option value="line" ${
                group.type === "line" ? "selected" : ""
              }>Line</option>
              <option value="area" ${
                group.type === "area" ? "selected" : ""
              }>Area</option>
            </select>
          </div>
          
          <!-- Point List -->
          <details class="point-list-accordion">
            <summary>
              <span class="accordion-toggle"></span>
              Points (${group.points.length})
            </summary>
            <div class="point-list-content">
              ${group.points
                .map(
                  (p, i) => `
                <div class="point-item">
                  <span class="point-index">#${i + 1}</span>
                  <span class="point-coord">X: ${Math.round(p.x)}</span>
                  <span class="point-coord">Y: ${Math.round(p.y)}</span>
                  <button type="button" class="point-delete-btn" data-action="delete-point" data-group-id="${
                    group.id
                  }" data-point-index="${i}" 
                          title="Delete point">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `
                )
                .join("")}
            </div>
          </details>
          
          <!-- Emission Settings -->
          <details class="emission-settings-accordion" open>
            <summary>
              <span class="accordion-toggle"></span>
              Emission Settings
            </summary>
            <div class="emission-settings-content">
              ${DebuggerUIBuilder._createSliderHTML(
                `group.${group.id}.emission.intensity`,
                "Intensity",
                0.1,
                15,
                0.1,
                "Multiplier for particle density and spawn rate",
                group.emission?.intensity ?? 1.0
              )}
              
              <div class="control-row" style="display: ${
                group.type === "point" ? "none" : "flex"
              };">
                <label>Emission Falloff:</label>
                <input type="checkbox" data-path="group.${
                  group.id
                }.emission.falloff.enabled" ${
      group.emission?.falloff?.enabled ? "checked" : ""
    }>
              </div>
              
              <div style="display: ${
                group.emission?.falloff?.enabled ? "block" : "none"
              };" data-visibility-target="group.${
      group.id
    }.emission.falloff.enabled">
                ${DebuggerUIBuilder._createSliderHTML(
                  `group.${group.id}.emission.falloff.strength`,
                  "Falloff Strength",
                  0,
                  0.99,
                  0.01,
                  "Bias towards center - 0=uniform, 1=max bias",
                  group.emission?.falloff?.strength ?? 0.5
                )}
              </div>
            </div>
          </details>
          
          <!-- Point Placement Actions -->
          <div class="edit-points-section">
            <button type="button" class="edit-points-btn" data-action="select-and-activate-placement" data-group-id="${
              group.id
            }">
              <i class="fas fa-crosshairs"></i> Edit Points on Canvas
            </button>
          </div>
          
        </div>
      </details>
    `;

    const groupsListHTML =
      effectGroups.length > 0
        ? effectGroups.map(createGroupItemHTML).join("")
        : '<p class="no-groups-placeholder">No point groups for this effect yet.</p>';

    return `
      <details class="point-groups-main-accordion">
        <summary>
          <span class="accordion-toggle"></span>
          Point Groups (${effectGroups.length})
        </summary>
        <div class="point-groups-content">
          
          <!-- Header with Description and Create Button -->
          <div class="point-groups-header">
            <div class="point-groups-description">${description}</div>
            <button type="button" class="quick-create-effect-btn create-effect-from-ui" data-action="create-particle-effect-area" data-effect-key="${effectKey}" title="Create new ${effectName} group">
              <i class="fas fa-plus-square"></i>
            </button>
          </div>
          
          <!-- Existing Groups -->
          <div class="groups-list-container">
            ${groupsListHTML}
          </div>
          
          <!-- Placement Mode Info -->
          <div class="placement-mode-tip">
            <strong>Tip:</strong> Use the "Edit Points on Canvas" button to add/move/delete points visually.<br>
            <strong>Left-Click:</strong> Add point • <strong>Left-Drag:</strong> Move • <strong>Right-Click:</strong> Delete
          </div>
        </div>
      </details>
    `;
  }

  _getLightingHTML() {
    const effectKey = "lighting";
    const content = `
      <p class="description-text">Global settings that affect how light interacts with Map Shine effects.</p>
      <details>
          <summary><span class="accordion-toggle"></span><strong>Light Masking</strong></summary>
          <div style="padding-left: 5px;">
              <p class="description-text">Controls the shared, screen-space mask of all light sources.</p>
              ${DebuggerUIBuilder._createSliderHTML(
                "lightMask.blur",
                "Edge Softness (Blur)",
                0,
                250,
                1,
                "The pixel radius of the blur used to soften light edges across all effects. Higher is softer."
              )}
          </div>
      </details>
    `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Lighting",
      content
    );
  }

  _getPointGroupsHTML() {
    // Get all groups from the current scene
    const allGroups = MapPointsManager.getGroups();
    const groupsArray = Object.values(allGroups);

    // Separate groups by type
    const groupsByType = {
      point: groupsArray.filter((g) => g.type === "point"),
      line: groupsArray.filter((g) => g.type === "line"),
      area: groupsArray.filter((g) => g.type === "area"),
      rope: groupsArray.filter((g) => g.type === "rope"),
    };

    // Helper to create group list items
    const createGroupListHTML = (groups, typeName) => {
      if (groups.length === 0) {
        return '<p class="no-groups-placeholder">No groups of this type</p>';
      }
      return groups
        .map(
          (group) => `
        <details class="group-list-item">
          <summary>
            <span class="accordion-toggle"></span>
            <span class="mp-group-item-status ${
              group.isBroken ? "broken" : "valid"
            }" 
                  title="${group.isBroken ? group.reason : "Valid"}"></span>
            <span class="group-item-label">${Handlebars.escapeExpression(
              group.label
            )}</span>
            <span class="group-item-meta">${group.points.length} pts</span>
            <button type="button" class="group-delete-btn" data-action="delete-group" data-group-id="${
              group.id
            }" 
                    title="Delete this group">
              <i class="fas fa-trash"></i>
            </button>
          </summary>
          <div class="group-item-content">
            
            <!-- Group Properties -->
            <div class="control-row">
              <label>Label:</label>
              <input type="text" data-path="group.${
                group.id
              }.label" value="${Handlebars.escapeExpression(
            group.label
          )}" style="flex: 1;">
            </div>
            
            <div class="control-row">
              <label>Type:</label>
              <select data-path="group.${group.id}.type" style="flex: 1;">
                <option value="point" ${
                  group.type === "point" ? "selected" : ""
                }>Points</option>
                <option value="line" ${
                  group.type === "line" ? "selected" : ""
                }>Line</option>
                <option value="area" ${
                  group.type === "area" ? "selected" : ""
                }>Area</option>
                <option value="rope" ${
                  group.type === "rope" ? "selected" : ""
                }>Physics Rope</option>
              </select>
            </div>
            
            <!-- Point List -->
            <details class="point-list-accordion">
              <summary>
                <span class="accordion-toggle"></span>
                Points (${group.points.length})
              </summary>
              <div class="point-list-content">
                ${group.points
                  .map(
                    (p, i) => `
                  <div class="point-item">
                    <span class="point-index">#${i + 1}</span>
                    <span class="point-coord">X: ${Math.round(p.x)}</span>
                    <span class="point-coord">Y: ${Math.round(p.y)}</span>
                    <button type="button" class="point-delete-btn" data-action="delete-point" data-group-id="${
                      group.id
                    }" data-point-index="${i}" 
                            title="Delete point">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </details>
            
            <!-- Effect Source Configuration -->
            <details class="effect-source-accordion">
              <summary>
                <span class="accordion-toggle"></span>
                Effect Source
              </summary>
              <div class="effect-source-content">
                <div class="control-row">
                  <label>Use as Effect Source:</label>
                  <input type="checkbox" data-path="group.${
                    group.id
                  }.isEffectSource" ${group.isEffectSource ? "checked" : ""}>
                </div>
                
                <div class="control-row" style="display: ${
                  group.isEffectSource ? "flex" : "none"
                };" data-visibility-target="group.${group.id}.isEffectSource">
                  <label>Target Effect:</label>
                  <select data-path="group.${
                    group.id
                  }.effectTarget" style="flex: 1;">
                    ${Object.entries(EFFECT_SOURCE_OPTIONS)
                      .map(
                        ([key, name]) =>
                          `<option value="${key}" ${
                            group.effectTarget === key ? "selected" : ""
                          }>${name}</option>`
                      )
                      .join("")}
                  </select>
                </div>
                
                <div style="margin-top: 4px; display: ${
                  group.isEffectSource ? "block" : "none"
                };" data-visibility-target="group.${group.id}.isEffectSource">
                  <p class="description-text" style="font-size: 0.9em; margin-bottom: 4px;">Emission Settings</p>
                  
                  ${DebuggerUIBuilder._createSliderHTML(
                    `group.${group.id}.emission.intensity`,
                    "Intensity",
                    0.1,
                    15,
                    0.1,
                    "Multiplier for particle density and spawn rate",
                    group.emission?.intensity ?? 1.0
                  )}
                  
                  <div class="control-row" style="display: ${
                    group.type === "point" ? "none" : "flex"
                  };">
                    <label>Emission Falloff:</label>
                    <input type="checkbox" data-path="group.${
                      group.id
                    }.emission.falloff.enabled" ${
            group.emission?.falloff?.enabled ? "checked" : ""
          }>
                  </div>
                  
                  <div style="display: ${
                    group.emission?.falloff?.enabled ? "block" : "none"
                  };" data-visibility-target="group.${
            group.id
          }.emission.falloff.enabled">
                    ${DebuggerUIBuilder._createSliderHTML(
                      `group.${group.id}.emission.falloff.strength`,
                      "Falloff Strength",
                      0,
                      0.99,
                      0.01,
                      "Bias towards center - 0=uniform, 1=max bias",
                      group.emission?.falloff?.strength ?? 0.5
                    )}
                  </div>
                </div>
              </div>
            </details>
            
            <!-- Point Placement Actions -->
            <div class="edit-points-section">
              <button type="button" class="edit-points-btn" data-action="select-and-activate-placement" data-group-id="${
                group.id
              }">
                <i class="fas fa-crosshairs"></i> Edit Points on Canvas
              </button>
            </div>
            
          </div>
        </details>
      `
        )
        .join("");
    };

    const content = `
      <p class="description-text">Manage point groups for particle effects, lightning, and physics ropes. Points are placed directly on the canvas.</p>
      
      <!-- Point Placement Mode Toggle -->
      <div class="point-placement-mode-section">
        <button type="button" class="placement-mode-btn" data-action="toggle-placement-mode" id="placement-mode-toggle-btn">
          <i class="fas fa-crosshairs"></i> <span id="placement-mode-label">Activate Point Placement Mode</span>
        </button>
        <p class="placement-mode-instructions">
          <strong>Left-Click:</strong> Add point • <strong>Left-Drag:</strong> Move point • <strong>Right-Click:</strong> Delete point<br>
          Use delete buttons below for precise point/group removal
        </p>
      </div>
      
      <!-- Create New Group -->
      <details open class="create-group-accordion">
        <summary>
          <span class="accordion-toggle"></span>
          Create New Group
        </summary>
        <div class="create-group-content">
          <div class="control-row">
            <label>Name:</label>
            <input type="text" id="new-group-name-input" placeholder="New Group Name" style="flex: 1;">
          </div>
          <div class="control-row">
            <label>Type:</label>
            <select id="new-group-type-select" style="flex: 1;">
              <option value="point">Points</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
              <option value="rope">Physics Rope</option>
            </select>
          </div>
          <button type="button" class="create-group-btn" data-action="create-group-from-ui">
            <i class="fas fa-plus-square"></i> Create Group
          </button>
        </div>
      </details>
      
      <!-- Groups by Type -->
      <details open class="group-type-accordion">
        <summary><span class="accordion-toggle"></span><strong>Point Groups</strong></summary>
        <div class="group-type-content">
          ${createGroupListHTML(groupsByType.point, "Point")}
        </div>
      </details>
      
      <details class="group-type-accordion">
        <summary><span class="accordion-toggle"></span><strong>Line Groups</strong></summary>
        <div class="group-type-content">
          ${createGroupListHTML(groupsByType.line, "Line")}
        </div>
      </details>
      
      <details class="group-type-accordion">
        <summary><span class="accordion-toggle"></span><strong>Area Groups</strong></summary>
        <div class="group-type-content">
          ${createGroupListHTML(groupsByType.area, "Area")}
        </div>
      </details>
      
      <details class="group-type-accordion">
        <summary><span class="accordion-toggle"></span><strong>Rope Groups</strong></summary>
        <div class="group-type-content">
          <p class="description-text" style="font-size: 0.9em; color: #999;">For detailed rope physics settings, see the "Physics Rope" accordion below.</p>
          ${createGroupListHTML(groupsByType.rope, "Rope")}
        </div>
      </details>
    `;

    return DebuggerUIBuilder._createAccordionHTML(
      "pointGroups",
      "Point Groups",
      content
    );
  }

  _getPhysicsRopeHTML() {
    const windPath = "fire.particles.wind";

    // Get all rope groups from the current scene
    const allGroups = MapPointsManager.getGroups();
    const ropeGroups = Object.values(allGroups).filter(
      (g) => g.type === "rope"
    );

    // Separate ropes by type
    const ropesByType = {
      rope: ropeGroups.filter((g) => (g.ropeType || "rope") === "rope"),
      chain: ropeGroups.filter((g) => g.ropeType === "chain"),
      elastic: ropeGroups.filter((g) => g.ropeType === "elastic"),
    };

    // Helper function to create rope list items with expandable properties
    const createRopeListHTML = (ropes) => {
      if (ropes.length === 0) {
        return '<p class="description-text" style="font-style: italic; color: #999; margin: 5px 0;">No ropes of this type</p>';
      }
      return ropes
        .map(
          (rope) => `
          <details class="rope-list-item" style="background: rgba(0,0,0,0.2); border-radius: 3px; margin-bottom: 4px;">
            <summary style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; cursor: pointer;">
              <span class="accordion-toggle" style="font-size: 0.8em;"></span>
              <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${Handlebars.escapeExpression(
                rope.label
              )}</span>
              <span style="color: #999; font-size: 0.9em;">${
                rope.points.length
              } pts</span>
              <button type="button" class="rope-reset-btn" data-action="reset-rope-defaults" data-group-id="${
                rope.id
              }" title="Reset to default settings" style="padding: 2px 6px; background: #4a9eff; border: none; border-radius: 3px; cursor: pointer;" onclick="event.stopPropagation();">
                <i class="fas fa-undo"></i>
              </button>
              <button type="button" class="rope-delete-btn" data-action="delete-rope-group" data-group-id="${
                rope.id
              }" title="Delete this rope" style="padding: 2px 6px; background: #c44; border: none; border-radius: 3px; cursor: pointer;" onclick="event.stopPropagation();">
                <i class="fas fa-trash"></i>
              </button>
            </summary>
            <div style="padding: 8px 12px; border-top: 1px solid rgba(255,255,255,0.1);">
              <p class="description-text" style="margin-bottom: 4px; font-size: 0.9em;">Current Runtime Properties:</p>
              
              <div class="control-row">
                <label>Texture:</label>
                <input type="text" id="rope-instance-texture-${
                  rope.id
                }" data-path="rope-instance.${
            rope.id
          }.texturePath" value="${Handlebars.escapeExpression(
            rope.texturePath || "modules/map-shine/assets/rope.webp"
          )}" style="flex: 1; font-family: monospace; font-size: 10px;">
                <button type="button" class="file-picker-btn" data-fp-target="rope-instance-texture-${
                  rope.id
                }" data-fp-type="image" title="Browse for texture">
                  <i class="fas fa-file-image"></i>
                </button>
              </div>
              
              <details style="margin: 8px 0;">
                <summary style="cursor: pointer; padding: 4px 0; font-weight: bold; color: #aaa;">
                  <span class="accordion-toggle" style="font-size: 0.8em;"></span>
                  Rope Ends
                </summary>
                <div style="padding: 8px 0 8px 12px; border-left: 2px solid rgba(255,255,255,0.1);">
                  <p class="description-text" style="margin-bottom: 4px; font-size: 0.85em; color: #999;">Add decorative sprites at rope anchor points</p>
                  
                  <div class="control-row">
                    <label>End Texture:</label>
                    <input type="text" id="rope-instance-end-texture-${
                      rope.id
                    }" data-path="rope-instance.${
            rope.id
          }.ropeEndTexturePath" value="${Handlebars.escapeExpression(
            rope.ropeEndTexturePath || ""
          )}" placeholder="Leave empty to disable" style="flex: 1; font-family: monospace; font-size: 10px;">
                    <button type="button" class="file-picker-btn" data-fp-target="rope-instance-end-texture-${
                      rope.id
                    }" data-fp-type="image" title="Browse for rope end texture">
                      <i class="fas fa-file-image"></i>
                    </button>
                  </div>
                  
                  ${DebuggerUIBuilder._createSliderHTML(
                    `rope-instance.${rope.id}.ropeEndScale`,
                    "End Scale",
                    0.1,
                    5.0,
                    0.1,
                    "Scale of rope end sprites - 1.0 = original size",
                    rope.ropeEndScale ?? 1.0
                  )}
                </div>
              </details>
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.tapering`,
                "Tapering (Visual Sag)",
                0,
                1,
                0.05,
                "Controls visual sag/droop - 0 = straight, 1 = maximum sag",
                rope.tapering ?? 0.5
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.segmentLength`,
                "Segment Length",
                5,
                50,
                1,
                "Distance between rope segments - lower = smoother but more expensive",
                rope.segmentLength ?? 10
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.springConstant`,
                "Spring Constant",
                0.1,
                2.0,
                0.1,
                "Restoring force strength - higher = stiffer rope that resists wind more",
                rope.springConstant ?? 0.8
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.ropeEndStiffness`,
                "End Stiffness",
                0,
                1,
                0.05,
                "Prevents crushing at anchor points - 0 = flexible ends, 1 = rigid ends",
                rope.ropeEndStiffness ?? 0.3
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.damping`,
                "Damping",
                0.001,
                0.999,
                0.001,
                "Physics damping - higher = less movement",
                rope.damping ?? 0.99
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.windForce`,
                "Wind Force",
                0,
                3,
                0.1,
                "Wind force multiplier - 0 = no wind, 1 = normal, >1 = stronger",
                rope.windForce ?? 1.0
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.animationSpeed`,
                "Animation Speed",
                0.1,
                3,
                0.1,
                "Wind animation speed multiplier",
                rope.animationSpeed ?? 1.0
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.indoorWindShielding`,
                "Indoor Wind Shielding",
                0,
                1,
                0.05,
                "Current wind shielding",
                rope.indoorWindShielding ?? 0.9
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.endpointFade`,
                "Endpoint Fade Strength",
                0,
                1,
                0.05,
                "Fade strength at endpoints - 0 = no fade, 1 = maximum fade",
                rope.endpointFade ?? 0.0
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.fadeStartDistance`,
                "Fade Start Distance",
                0.01,
                0.5,
                0.01,
                "Distance from rope start where fade begins (0.01-0.5, where 1.0 = full rope length)",
                rope.fadeStartDistance ?? 0.2
              )}
              
              ${DebuggerUIBuilder._createSliderHTML(
                `rope-instance.${rope.id}.fadeEndDistance`,
                "Fade End Distance",
                0.01,
                0.5,
                0.01,
                "Distance from rope end where fade begins (0.01-0.5, where 1.0 = full rope length)",
                rope.fadeEndDistance ?? 0.2
              )}
              
              <div class="control-row" style="margin-top: 4px;">
                <label>Is Indoors:</label>
                <input type="checkbox" data-path="rope-instance.${
                  rope.id
                }.isIndoors" ${rope.isIndoors ? "checked" : ""}>
              </div>
            </div>
          </details>
        `
        )
        .join("");
    };

    // Helper to create settings for a rope type
    const createRopeTypeSettings = (type, label, isOpen = false) => {
      const config = this.config?.physicsRope?.[type] || {};
      const preset = ROPE_TYPE_PRESETS[type];

      return `
        <details ${isOpen ? "open" : ""}>
          <summary><span class="accordion-toggle"></span><strong>${label}</strong></summary>
          <div style="padding-left: 5px; margin-top: 4px;">
            <div style="display: flex; gap: 4px; align-items: center; margin-bottom: 10px;">
              <button type="button" class="create-effect-from-ui" data-action="create-physics-rope" data-rope-type="${type}" title="Create new ${label.toLowerCase()}">
                <i class="fas fa-plus-square"></i>
              </button>
              <span style="font-weight: bold; margin-left: 4px;">Create New</span>
            </div>
            
            <details>
              <summary><span class="accordion-toggle"></span><strong>Default Settings</strong></summary>
              <div style="padding-left: 5px; margin-top: 4px;">
                <p class="description-text">These settings apply to newly created ${label.toLowerCase()}s.</p>
                
                <div class="control-row">
                  <label>Texture:</label>
                  <input type="text" id="rope-texture-${type}" data-path="physicsRope.${type}.texturePath" value="${
        config.texturePath || preset.texturePath
      }" style="flex: 1;">
                  <button type="button" class="file-picker-btn" data-fp-target="rope-texture-${type}" data-fp-type="image" title="Browse for texture">
                    <i class="fas fa-file-image"></i>
                  </button>
                </div>
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.tapering`,
                  "Tapering (Visual Sag)",
                  0,
                  1,
                  0.05,
                  "Visual sag/droop - 0 = straight, 1 = maximum sag"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.ropeEndStiffness`,
                  "End Stiffness",
                  0,
                  1,
                  0.05,
                  "Prevents crushing at anchor points - 0 = flexible ends, 1 = rigid ends"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.segmentLength`,
                  "Segment Length",
                  5,
                  50,
                  1,
                  "Distance between rope segments - lower = smoother but more expensive"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.damping`,
                  "Damping",
                  0.001,
                  0.999,
                  0.001,
                  "Physics damping - higher = less movement/bouncing"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.windForce`,
                  "Wind Force",
                  0,
                  3,
                  0.1,
                  "Wind force multiplier - 0 = no wind, 1 = normal, >1 = stronger"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.springConstant`,
                  "Spring Constant",
                  0.1,
                  2.0,
                  0.1,
                  "Restoring force strength - higher = stiffer rope that resists wind more"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.animationSpeed`,
                  "Animation Speed",
                  0.1,
                  3,
                  0.1,
                  "Wind animation speed multiplier"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.indoorWindShielding`,
                  "Indoor Wind Shielding",
                  0,
                  1,
                  0.05,
                  "How much wind is blocked indoors (0 = full wind, 1 = no wind)"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.endpointFade`,
                  "Endpoint Fade Strength",
                  0,
                  1,
                  0.05,
                  "Fade strength at endpoints - 0 = no fade, 1 = maximum fade"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.fadeStartDistance`,
                  "Fade Start Distance",
                  0.01,
                  0.5,
                  0.01,
                  "Distance from rope start where fade begins (0.01-0.5, where 1.0 = full rope length)"
                )}
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.fadeEndDistance`,
                  "Fade End Distance",
                  0.01,
                  0.5,
                  0.01,
                  "Distance from rope end where fade begins (0.01-0.5, where 1.0 = full rope length)"
                )}
              </div>
            </details>
            
            <details>
              <summary><span class="accordion-toggle"></span><strong>Rope Ends</strong></summary>
              <div style="padding-left: 5px; margin-top: 4px;">
                <p class="description-text">Add decorative sprites at rope anchor points to cover ugly ends.</p>
                
                <div class="control-row">
                  <label>Rope End Texture:</label>
                  <input type="text" id="rope-end-texture-${type}" data-path="physicsRope.${type}.ropeEndTexturePath" value="${
        config.ropeEndTexturePath || ""
      }" placeholder="Leave empty to disable" style="flex: 1;">
                  <button type="button" class="file-picker-btn" data-fp-target="rope-end-texture-${type}" data-fp-type="image" title="Browse for rope end texture">
                    <i class="fas fa-file-image"></i>
                  </button>
                </div>
                
                ${DebuggerUIBuilder._createSliderHTML(
                  `physicsRope.${type}.ropeEndScale`,
                  "Rope End Scale",
                  0.1,
                  5,
                  0.1,
                  "Scale multiplier for rope end sprites"
                )}
              </div>
            </details>
            
            <div class="rope-list" style="margin-top: 5px;">
              <strong>Existing ${label}s:</strong>
              ${createRopeListHTML(ropesByType[type])}
            </div>
          </div>
        </details>
        `;
    };

    const content = `
        <p class="description-text">Create and manage physics ropes. Each type has its own physics properties that update in real-time.</p>
        
        ${createRopeTypeSettings("rope", "Rope", true)}
        ${createRopeTypeSettings("chain", "Chain", false)}
        ${createRopeTypeSettings("elastic", "Elastic/Rubber", false)}
        
        <!-- Wind Influence -->
        <details>
          <summary><span class="accordion-toggle"></span><strong>Wind Influence</strong></summary>
          <div style="padding-left: 5px;">
            <p class="description-text" style="font-style: italic; color: #999;">Wind is controlled globally in the "Wind" section. Values shown below are read-only.</p>
            ${DebuggerUIBuilder._createReadOnlyDisplayHTML(
              `${windPath}.enabled`,
              "Wind Enabled"
            )}
            ${DebuggerUIBuilder._createReadOnlyDisplayHTML(
              `${windPath}.force`,
              "Wind Force"
            )}
            ${DebuggerUIBuilder._createReadOnlyDisplayHTML(
              `${windPath}.baseSpeed`,
              "Base Wind Speed"
            )}
          </div>
        </details>
      `;

    return DebuggerUIBuilder._createAccordionHTML(
      "physicsRope",
      "Physics Rope",
      content
    );
  }

  _getWindHTML() {
    const windPath = "fire.particles.wind";
    const content = `
        <p class="description-text">Configure the global wind conditions that affect various particle systems like fire and physics ropes.</p>
        <details>
          <summary><span class="accordion-toggle"></span><strong>Global Wind Simulation</strong></summary>
          <div style="padding-left: 5px;">
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.baseSpeed`,
            "Base Wind Speed",
            0,
            200,
            1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.gustSpeed`,
            "Gust Speed",
            0,
            500,
            1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.gustFrequencyMin`,
            "Min Gust Frequency (s)",
            0.1,
            30,
            0.1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.gustFrequencyMax`,
            "Max Gust Frequency (s)",
            0.1,
            30,
            0.1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.gustDurationMin`,
            "Min Gust Duration (s)",
            0.1,
            5,
            0.1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.gustDurationMax`,
            "Max Gust Duration (s)",
            0.1,
            5,
            0.1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.angleChangeFrequencyMin`,
            "Min Angle Change Frequency (s)",
            1,
            60,
            1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.angleChangeFrequencyMax`,
            "Max Angle Change Frequency (s)",
            1,
            60,
            1
          )}
          ${DebuggerUIBuilder._createSliderHTML(
            `${windPath}.angleChangeRange`,
            "Angle Change Range (degrees)",
            0,
            180,
            1
          )}
          </div>
        </details>
      `;

    return DebuggerUIBuilder._createAccordionHTML("wind", "Wind", content);
  }

  _getEffectSections() {
    return [
      this._getLightingHTML(),
      this._getWindHTML(),
      this._getPointGroupsHTML(),
      this._getPhysicsRopeHTML(),
      (MetallicShineLayer?.getSettingsHTML?.() ?? ""),
      (TimeOfDayLayer?.getSettingsHTML?.() ?? ""),
      (BuildingShadowsLayer?.getSettingsHTML?.() ?? ""),
      (WaterFXLayer?.getSettingsHTML?.() ?? ""),
      (FoamLayer?.getSettingsHTML?.() ?? ""),
      (CloudShadowsLayer?.getSettingsHTML?.() ?? ""),
      (IridescenceLayer?.getSettingsHTML?.() ?? ""),
      (HeatDistortionLayer?.getSettingsHTML?.() ?? ""),
      (CanopyLayer?.getSettingsHTML?.() ?? ""),
      (BushLayer?.getSettingsHTML?.() ?? ""),
      (TreeLayer?.getSettingsHTML?.() ?? ""),
      (StructuralShadowsLayer?.getSettingsHTML?.() ?? ""),
      (AmbientLayer?.getSettingsHTML?.() ?? ""),
      (GroundGlowLayer?.getSettingsHTML?.() ?? ""),
      (PrismLayer?.getSettingsHTML?.() ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("fire") ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("sparks") ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("candleFlame") ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("pressurisedSteam") ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("dust") ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("glint") ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("metallicGlints") ?? ""),
      (ParticleEffectController?.getSettingsHTML?.("biofilm") ?? ""),
      (ParticleEffectController?.getSmellyFliesSettingsHTML?.() ?? ""),
      (LightningLayer?.getSettingsHTML?.() ?? ""),
      this._getOverheadEffectHTML(),
    ];
  }

  _getOverheadEffectHTML() {
    const effectKey = "overheadEffect";
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Overhead Effect",
      `
            <p class="description-text">Controls for tiles flagged as 'Overhead'. This layer re-renders them to be above all other effects.</p>
            <div id="overhead-zoom-display" style="text-align: center; padding: 4px; background: rgba(0,0,0,0.3); border-radius: 3px; margin-bottom: 5px; font-family: monospace;">
                Loading zoom data...
            </div>
            <details>
                <summary><span class="accordion-toggle"></span><strong>Zoom Point Configuration</strong></summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Define the zoom levels used for interpolation.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.zoomPointMin",
                      "Min Zoom Point",
                      0.1,
                      5,
                      0.05,
                      "The zoom level for the 'Min' settings below."
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.zoomPointMid",
                      "Mid Zoom Point",
                      0.1,
                      5,
                      0.05,
                      "The zoom level for the 'Mid' settings below."
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.zoomPointMax",
                      "Max Zoom Point",
                      0.1,
                      5,
                      0.05,
                      "The zoom level for the 'Max' settings below."
                    )}
                </div>
            </details>
            <details>
                <summary><span class="accordion-toggle"></span><strong>Zoom-Based Blurring</strong></summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Define the world-space blur amount at the configured zoom points.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.blurMinZoom",
                      "Blur (Min Zoom)",
                      0,
                      50,
                      0.5
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.blurMidZoom",
                      "Blur (Mid Zoom)",
                      0,
                      50,
                      0.5
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.blurMaxZoom",
                      "Blur (Max Zoom)",
                      0,
                      50,
                      0.5
                    )}
                </div>
            </details>
            <details>
                <summary><span class="accordion-toggle"></span><strong>Zoom-Based Opacity</strong></summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Define the layer opacity at the configured zoom points.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.opacityMinZoom",
                      "Opacity (Min Zoom)",
                      0,
                      1,
                      0.01
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.opacityMidZoom",
                      "Opacity (Mid Zoom)",
                      0,
                      1,
                      0.01
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "overheadEffect.opacityMaxZoom",
                      "Opacity (Max Zoom)",
                      0,
                      1,
                      0.01
                    )}
                </div>
            </details>
            ${DebuggerUIBuilder._createSliderHTML(
              "overheadEffect.hoverFadeDuration",
              "Hover Fade Duration (ms)",
              0,
              2000,
              50,
              "How long it takes for the overhead tile to fade in/out on hover."
            )}
            ${DebuggerUIBuilder._createSliderHTML(
              "overheadEffect.timeOfDayStrength",
              "Time of Day Strength",
              0,
              1,
              0.01,
              "Controls how strongly Time of Day color corrections affect overhead tiles in outdoor areas. Requires Time of Day effect and Building Shadows (for outdoors mask) to be active."
            )}
            <details id="details-overheadEffect-recolor">
                <summary><span class="accordion-toggle"></span><strong>Recoloration</strong></summary>
                <div style="padding-left: 5px;">
                    <details id="details-overheadEffect-recolor-overlay">
                        <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                          "overheadEffect.recolor.enabled",
                          "Blend Structural Mask",
                          true
                        )}</div></summary>
                        <div style="padding-left: 5px;">
                            <p class="description-text">Blends the _Structural texture onto overhead tiles. Dark areas in the _Structural texture (like beams) create <strong>bright</strong> effects on tiles, while bright areas create dark effects. Works everywhere by default, or can be limited to <strong>indoor areas only</strong> when Building Shadows effect is enabled.</p>
                            ${DebuggerUIBuilder._createSelectHTML(
                              "overheadEffect.recolor.blendMode",
                              "Blend Mode",
                              {
                                "Overlay": 1,
                                "Hard Light": 2
                              },
                              "Choose between Overlay (default) or Hard Light blend modes"
                            )}
                            ${DebuggerUIBuilder._createSliderHTML(
                              "overheadEffect.recolor.intensity",
                              "Blend Intensity",
                              0,
                              1,
                              0.05,
                              "Controls how strongly the blend mode affects the tiles"
                            )}
                        </div>
                    </details>
                    <details id="details-overheadEffect-recolor-cloudShadowDarken">
                        <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                          "overheadEffect.recolor.cloudShadowDarken.enabled",
                          "Darken with Cloud Shadows",
                          true
                        )}</div></summary>
                        <div style="padding-left: 5px;">
                            <p class="description-text">Darkens overhead tiles using the cloud shadow pattern. Requires Cloud Shadows effect to be active.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              "overheadEffect.recolor.cloudShadowDarken.intensity",
                              "Intensity",
                              0,
                              3,
                              0.1
                            )}
                        </div>
                    </details>
                    <details id="details-overheadEffect-buildingShadows">
                        <summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
                          "overheadEffect.buildingShadows.enabled",
                          "Apply Building Shadows",
                          true
                        )}</div></summary>
                        <div style="padding-left: 5px;">
                            <p class="description-text">Casts building shadows onto outdoor overhead tiles (roofs, tree canopies). Reuses the shadow calculation from the Building Shadows effect. Requires Building Shadows effect to be active.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              "overheadEffect.buildingShadows.intensity",
                              "Shadow Intensity",
                              0,
                              1,
                              0.05,
                              "Controls how dark the shadows appear on overhead tiles"
                            )}
                        </div>
                    </details>
                </div>
            </details>
            `
    );
  }

  _buildPauseEffectSection() {
    const content = `
          <p class="description-text">Configure the visual appearance of the screen that appears when the game is paused.</p>
          
          <details id="details-pauseEffect-content">
            <summary><span class="accordion-toggle"></span><strong>Content &amp; Text</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createTextInputHTML(
                "universal.pauseEffect.heading",
                "Heading"
              )}
              <hr style="border-color: #555; margin: 4px 0;">
              ${DebuggerUIBuilder._createTextInputHTML(
                "universal.pauseEffect.subheading",
                "Subheading"
              )}
            </div>
          </details>
          
          <details id="details-pauseEffect-styling">
            <summary><span class="accordion-toggle"></span><strong>Styling &amp; Colors</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createTextInputWithPickerHTML(
                "universal.pauseEffect.logoPath",
                "Logo Path"
              )}
              ${DebuggerUIBuilder._createSliderHTML(
                "universal.pauseEffect.logoOpacity",
                "Logo Opacity",
                0,
                1,
                0.05
              )}
              <hr style="border-color: #555; margin: 4px 0;">
              ${DebuggerUIBuilder._createTextInputHTML(
                "universal.pauseEffect.backgroundColor",
                "Background"
              )}
              ${DebuggerUIBuilder._createColorPickerHTML(
                "universal.pauseEffect.gradientColor1",
                "Gradient Color 1"
              )}
              ${DebuggerUIBuilder._createTextInputHTML(
                "universal.pauseEffect.gradientColor2",
                "Gradient Color 2"
              )}
              <hr style="border-color: #555; margin: 4px 0;">
              ${DebuggerUIBuilder._createColorPickerHTML(
                "universal.pauseEffect.headingColor",
                "Heading Color"
              )}
              ${DebuggerUIBuilder._createColorPickerHTML(
                "universal.pauseEffect.subheadingColor",
                "Subheading Color"
              )}
              ${DebuggerUIBuilder._createColorPickerHTML(
                "universal.pauseEffect.hintColor",
                "Hint Color"
              )}
            </div>
          </details>
          
          <details id="details-pauseEffect-hints">
            <summary><span class="accordion-toggle"></span><strong>Random Hints</strong></summary>
            <div style="padding-left: 5px;">
              ${DebuggerUIBuilder._createCheckboxHTML(
                "universal.pauseEffect.useRandomHint",
                "Show Random Hint"
              )}
              <div id="pauseEffect-randomHints-wrapper">
                ${DebuggerUIBuilder._createListManagerHTML(
                  "universal.pauseEffect.randomHints",
                  "Hint",
                  "text"
                )}
              </div>
            </div>
          </details>
        `;
    return DebuggerUIBuilder._createAccordionHTML(
      "pauseEffectOverlay",
      "Pause Effect Overlay",
      content
    );
  }
}

export class DebuggerEventHandler {
  constructor(element, profileManager, uiBuilder) {
    this.element = element;
    this.profileManager = profileManager;
    this.uiBuilder = uiBuilder;
    this.sliderDebounceTimeout = null;
    this.allLutPresets = {};
    this._isDebuggerClockDragging = false;
    this._lastTimeChangedUpdate = 0; // Throttle time-based UI updates
    this.uiClock = null;

    // --- NEW: State for Gradient Editor ---
    this.activeGradientEditor = {
      path: null,
      stopIndex: null,
      isDragging: false,
    };
    // Bindings are now moved to initialize
    // --- End New State ---

    // Store bound listeners for reliable add/remove
    this._onDebuggerClockDragBound = this._onDebuggerClockDrag.bind(this);
    this._onDebuggerClockDragEndBound = this._onDebuggerClockDragEnd.bind(this);

    // PERFORMANCE TRACKING SYSTEM
    this._perfStats = {
      updateAllControls: { calls: 0, totalTime: 0, maxTime: 0, lastCallTime: 0 },
      _updateSingleControl: { calls: 0, totalTime: 0, maxTime: 0 },
      _handleGenericInput: { calls: 0, totalTime: 0, maxTime: 0 },
      _saveSetting: { calls: 0, totalTime: 0, maxTime: 0 },
      rebindDynamicControls: { calls: 0, totalTime: 0, maxTime: 0 },
      _updateColumnWidths: { calls: 0, totalTime: 0, maxTime: 0 },
      updateParticleCount: { calls: 0, totalTime: 0, maxTime: 0 },
      updateWeatherDiagnostics: { calls: 0, totalTime: 0, maxTime: 0 },
      updateZoomDisplay: { calls: 0, totalTime: 0, maxTime: 0 },
      _getPathValue: { calls: 0, totalTime: 0, maxTime: 0 },
      _setInputValue: { calls: 0, totalTime: 0, maxTime: 0 },
      _updateActionButtonsState: { calls: 0, totalTime: 0, maxTime: 0 }
    };
    this._perfThresholds = {
      updateAllControls: 10,      // Warn if > 10ms (called frequently)
      _updateSingleControl: 2,     // Warn if > 2ms (called many times)
      _handleGenericInput: 5,      // Warn if > 5ms
      _saveSetting: 15,            // Warn if > 15ms
      rebindDynamicControls: 30,   // Warn if > 30ms
      _updateColumnWidths: 5,      // Warn if > 5ms
      updateParticleCount: 1,      // Warn if > 1ms (called every frame)
      updateWeatherDiagnostics: 2, // Warn if > 2ms (called every frame)
      updateZoomDisplay: 2,        // Warn if > 2ms
      _getPathValue: 1,            // Warn if > 1ms (called frequently)
      _setInputValue: 1,           // Warn if > 1ms (called frequently)
      _updateActionButtonsState: 3 // Warn if > 3ms
    };
  }

  /**
   * Wrap a method with performance timing
   */
  _wrapWithTiming(methodName, fn) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    const stats = this._perfStats[methodName];
    if (stats) {
      const now = Date.now();
      stats.calls++;
      stats.totalTime += duration;
      stats.maxTime = Math.max(stats.maxTime, duration);
      
      // For updateAllControls, track call frequency
      if (methodName === 'updateAllControls' && stats.lastCallTime) {
        const timeSinceLastCall = now - stats.lastCallTime;
        if (timeSinceLastCall < 100) {
          console.error(`🔴 Event Handler | ${methodName} called too frequently! ${timeSinceLastCall}ms since last call`);
        }
      }
      if (methodName === 'updateAllControls') {
        stats.lastCallTime = now;
      }
      
      const threshold = this._perfThresholds[methodName] || 10;
      if (duration > threshold) {
        console.error(`🔴 Event Handler | ${methodName} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
        // Log stack trace for slow operations to identify caller
        if (duration > threshold * 2) {
          console.trace('Stack trace for slow operation:');
        }
      }
    }
    
    return result;
  }

  /**
   * Get performance report for Event Handler
   */
  getPerformanceReport() {
    console.group('⚡ DebuggerEventHandler Performance Report');
    console.log('Call counts and timing for UI update methods:');
    
    // Sort by total time to show biggest offenders first
    const sorted = Object.entries(this._perfStats)
      .filter(([_, stats]) => stats.calls > 0)
      .sort((a, b) => b[1].totalTime - a[1].totalTime);
    
    for (const [method, stats] of sorted) {
      const avg = stats.totalTime / stats.calls;
      const threshold = this._perfThresholds[method] || 10;
      const status = avg > threshold ? '🔴' : stats.maxTime > threshold ? '🟡' : '🟢';
      console.log(`${status} ${method}:`);
      console.log(`   Calls: ${stats.calls}, Avg: ${avg.toFixed(2)}ms, Max: ${stats.maxTime.toFixed(2)}ms, Total: ${stats.totalTime.toFixed(2)}ms`);
      
      if (method === 'updateAllControls' && stats.lastCallTime) {
        const timeSinceLastCall = Date.now() - stats.lastCallTime;
        console.log(`   Last call: ${timeSinceLastCall}ms ago`);
      }
    }
    console.groupEnd();
  }

  /**
   * Reset performance statistics
   */
  resetPerformanceStats() {
    for (const stats of Object.values(this._perfStats)) {
      stats.calls = 0;
      stats.totalTime = 0;
      stats.maxTime = 0;
      stats.lastCallTime = 0;
    }
    console.log('✅ Event Handler | Performance stats reset');
  }

  get config() {
    return this.profileManager.activeConfig;
  }

  updateZoomDisplay() {
    return this._wrapWithTiming('updateZoomDisplay', () => {
      if (!this.element) return;
    
    // Update Overhead Effect zoom display
    const displayEl = this.element.querySelector("#overhead-zoom-display");
    if (displayEl) {
      const transform = canvas.stage.transform;

      const current = transform.scale.x.toFixed(2);
      const min = (
        typeof transform.minScale === "number" ? transform.minScale : 0.1
      ).toFixed(2);
      const max = (
        typeof transform.maxScale === "number" ? transform.maxScale : 3.0
      ).toFixed(2);

      const config = this.profileManager.activeConfig.overheadEffect;
      const pointMin = (config.zoomPointMin || 0).toFixed(2);
      const pointMid = (config.zoomPointMid || 0).toFixed(2);
      const pointMax = (config.zoomPointMax || 0).toFixed(2);

      displayEl.innerHTML = `
            Current: <strong>${current}x</strong> (Canvas Min/Max: ${min}x / ${max}x)<br>
            Effect Points: <strong>${pointMin}x</strong> | <strong>${pointMid}x</strong> | <strong>${pointMax}x</strong>
          `;
    }

    // Update Cloud Shadows zoom display
    const cloudDisplayEl = this.element.querySelector("#cloudshadow-zoom-display");
    if (cloudDisplayEl) {
      const transform = canvas.stage.transform;

      const current = transform.scale.x.toFixed(2);
      const min = (
        typeof transform.minScale === "number" ? transform.minScale : 0.1
      ).toFixed(2);
      const max = (
        typeof transform.maxScale === "number" ? transform.maxScale : 3.0
      ).toFixed(2);

      const config = this.profileManager.activeConfig.cloudShadows.depth;
      const pointMin = (config.zoomPointMin || 0).toFixed(2);
      const pointMid = (config.zoomPointMid || 0).toFixed(2);
      const pointMax = (config.zoomPointMax || 0).toFixed(2);

      cloudDisplayEl.innerHTML = `
            Current: <strong>${current}x</strong> (Canvas Min/Max: ${min}x / ${max}x)<br>
            Effect Points: <strong>${pointMin}x</strong> | <strong>${pointMid}x</strong> | <strong>${pointMax}x</strong>
          `;
    }
    });
  }

  initialize() {
    // Create the debounced update function. It will wait 300ms after user stops interacting before executing.
    this.debouncedSystemUpdate = foundry.utils.debounce(
      this._performSystemUpdate.bind(this),
      300
    );

    // Bind all gradient-related methods here for consistency.
    this._boundGradientMouseMove = this._onGradientMouseMove.bind(this);
    this._boundGradientMouseUp = this._onGradientMouseUp.bind(this);
    this._boundGradientBarDoubleClick = this._onGradientBarDoubleClick.bind(this);
    this._boundGradientStopMouseDown = this._onGradientStopMouseDown.bind(this);
    this._boundGradientStopContextMenu = this._onGradientStopContextMenu.bind(this);
    // Initialize zoom displays immediately
    this.updateZoomDisplay();
    
    // Initialize LazyAccordionManager for performance optimization (guard if adapter isn't ready)
    try {
      const LamCtor = (typeof LazyAccordionManager !== 'undefined' && LazyAccordionManager)
        || (globalThis && globalThis.LazyAccordionManager)
        || null;
      this.lazyAccordionManager = LamCtor ? new LamCtor(this.element, this) : null;
      if (!this.lazyAccordionManager) {
        console.warn('LazyAccordionManager not available yet; skipping lazy accordion init for now.');
      }
    } catch (e) {
      console.warn('Failed to initialize LazyAccordionManager, continuing without it.', e);
      this.lazyAccordionManager = null;
    }

    // NOTE: Lazy accordions will be registered after initial render
    // This happens in MaterialEditorDebugger.initialize() after render() is called
  }

  /**
   * Set up event delegation for UI interactions
   */
  addEventListeners() {
    if (!this.element) return;

    // Delegate input events for sliders (live updates)
    this.element.addEventListener('input', (e) => {
      if (e.target.matches('input[type="range"]')) {
        this._handleGenericInput(e);
      }
    });

    // Delegate change events for all inputs (checkbox, select, text, etc.)
    this.element.addEventListener('change', (e) => {
      if (e.target.matches('input, select, textarea')) {
        this._handleGenericInput(e);
      }
    });

    // Delegate click events for buttons and interactive elements
    this.element.addEventListener('click', (e) => {
      this._handleDelegatedClick(e);
    });

    // Lazy accordion toggle handler (performance optimization)
    this.element.addEventListener('toggle', (e) => {
      if (e.target.matches('details[data-lazy="true"]')) {
        const accordionId = e.target.dataset.contentId;
        const isOpen = e.target.open;
        
        if (accordionId && this.lazyAccordionManager) {
          this.lazyAccordionManager.onAccordionToggle(accordionId, isOpen);
        }
      }
    }, true); // Use capture to ensure we catch all toggle events

    // Gradient editor event handlers - CRITICAL for particle appearance controls
    this.element.addEventListener('mousedown', (e) => {
      if (e.target.closest('.gradient-stop')) {
        this._boundGradientStopMouseDown(e);
      }
    });

    this.element.addEventListener('contextmenu', (e) => {
      if (e.target.closest('.gradient-stop')) {
        this._boundGradientStopContextMenu(e);
      }
    });

    this.element.addEventListener('dblclick', (e) => {
      if (e.target.closest('.gradient-bar-container')) {
        this._boundGradientBarDoubleClick(e);
      }
    });

    // Search effects input handler
    const searchInput = this.element.querySelector('#fx-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        this._filterEffects(query);
      });
    }

    // Set up dynamic column resizing
    this._setupDynamicColumnResizing();
  }

  /**
   * Convert existing accordions to lazy mode (performance optimization)
   * Extracts content from rendered accordions, caches it, and removes from DOM
   * Content will be re-injected when accordion is opened
   */
  setupLazyAccordions() {
    if (!this.lazyAccordionManager) {
      console.warn('LazyAccordionManager not initialized');
      return;
    }

    console.log('LazyAccordionManager | Starting accordion conversion...');
    let converted = 0;
    let skipped = 0;
    let reprocessed = 0;
    
    // Find all accordion elements
    const accordions = this.element.querySelectorAll('details[id^="details-"]');
    
    accordions.forEach(accordion => {
      // Extract accordion ID from details element
      const accordionId = accordion.id.replace('details-', '');
      const wasOpen = accordion.open;
      const wasLazy = accordion.dataset.lazy === 'true';
      
      // Find the content div (everything after summary)
      const summary = accordion.querySelector('summary');
      if (!summary) {
        skipped++;
        return;
      }
      
      // Collect all content nodes after summary
      const contentNodes = [];
      let node = summary.nextSibling;
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE || 
            (node.nodeType === Node.TEXT_NODE && node.textContent.trim())) {
          contentNodes.push(node.cloneNode(true));
        }
        node = node.nextSibling;
      }
      
      if (contentNodes.length === 0) {
        // No content found - might already be stripped or genuinely empty
        if (!wasLazy) {
          skipped++;
        }
        return;
      }
      
      // Create content generator that returns the cached HTML
      const contentGenerator = () => {
        const wrapper = document.createElement('div');
        contentNodes.forEach(node => wrapper.appendChild(node.cloneNode(true)));
        return wrapper.innerHTML;
      };
      
      // Register/re-register with lazy accordion manager
      this.lazyAccordionManager.registerAccordion(accordionId, contentGenerator);
      
      // Mark as lazy and add content ID
      accordion.dataset.lazy = 'true';
      accordion.dataset.contentId = accordionId;
      
      // If accordion was open, keep it open and let the manager re-inject content
      if (wasOpen) {
        // Remove old content first
        node = summary.nextSibling;
        while (node) {
          const nextNode = node.nextSibling;
          node.remove();
          node = nextNode;
        }
        // Trigger re-injection via manager
        accordion.open = false; // Close first
        setTimeout(() => {
          accordion.open = true; // Re-open to trigger injection
        }, 0);
        reprocessed++;
      } else {
        // Accordion is closed - remove content from DOM
        node = summary.nextSibling;
        while (node) {
          const nextNode = node.nextSibling;
          node.remove();
          node = nextNode;
        }
        accordion.open = false;
      }
      
      if (wasLazy) {
        reprocessed++;
      } else {
        converted++;
      }
    });
    
    console.log(`LazyAccordionManager | Converted ${converted} new, reprocessed ${reprocessed}, skipped ${skipped}`);
    console.log(`LazyAccordionManager | Total accordions managed: ${this.lazyAccordionManager.contentCache.size}`);
  }

  async _onCopyAccordion(effectKey) {
    console.log(
      "MapShine | _onCopyAccordion called with effectKey:",
      effectKey
    );
    let settingsToCopy;
    const isGameSettingAccordion = [
      "loadingScreen",
      "fontManager",
      "pauseEffectOverlay",
    ].includes(effectKey);

    if (isGameSettingAccordion) {
      settingsToCopy = {};
      const allSettings = game.settings.settings;
      const prefixes = {
        loadingScreen: ["loading-screen-", "universal.sceneTransition."],
        fontManager: ["universal.fontManager."],
        pauseEffectOverlay: ["universal.pauseEffect."],
      }[effectKey];

      for (const [key, _setting] of allSettings.entries()) {
        if (key.startsWith(MODULE_ID)) {
          const settingKey = key.replace(`${MODULE_ID}.`, "");
          if (prefixes.some((p) => settingKey.startsWith(p))) {
            settingsToCopy[settingKey] = game.settings.get(
              MODULE_ID,
              settingKey
            );
          }
        }
      }
    } else {
      settingsToCopy = foundry.utils.getProperty(
        this.profileManager.getCurrentConfig({
          excludeClientOverrides: true,
        }),
        effectKey
      );
    }

    if (settingsToCopy === undefined) {
      ui.notifications.error(`Could not find settings for "${effectKey}".`);
      return;
    }

    const accordionData = {
      type: "map-shine-accordion",
      key: effectKey,
      data: settingsToCopy,
    };

    // Store in temporary storage instead of clipboard
    TEMP_CLIPBOARD_STORAGE.accordion = accordionData;
    ui.notifications.info(`"${effectKey}" settings copied to temporary storage.`);
  }

  async _onPasteAccordion(effectKey) {
    console.log(
      "MapShine | _onPasteAccordion called with effectKey:",
      effectKey
    );
    try {
      // Read from temporary storage instead of clipboard
      const accordionData = TEMP_CLIPBOARD_STORAGE.accordion;

      if (!accordionData) {
        ui.notifications.warn("No accordion settings have been copied yet. Use the copy button first.");
        return;
      }

      if (
        accordionData.type !== "map-shine-accordion" ||
        accordionData.key !== effectKey
      ) {
        ui.notifications.error(
          `Copied settings are for "${accordionData.key}", not "${effectKey}".`
        );
        return;
      }

      const settingsToPaste = accordionData.data;
      const isGameSettingAccordion = [
        "loadingScreen",
        "fontManager",
        "pauseEffectOverlay",
      ].includes(effectKey);

      if (isGameSettingAccordion) {
        for (const key in settingsToPaste) {
          if (game.settings.settings.has(`${MODULE_ID}.${key}`)) {
            await game.settings.set(MODULE_ID, key, settingsToPaste[key]);
          }
        }
        await this.profileManager.initializeForScene();
        await this.profileManager.updateAllSystemsFromConfig();
      } else {
        await this.profileManager.recordUserChange(effectKey, settingsToPaste);
        await this.profileManager.updateAllSystemsFromConfig();
      }

      this.updateAllControls();
      ui.notifications.info(`Pasted settings for "${effectKey}".`);
    } catch (err) {
      console.error("Map Shine | Failed to paste settings:", err);
      ui.notifications.error(
        "Could not paste settings. See console for details."
      );
    }
  }

  async _onSaveSceneProfileClick() {
    const nameInput = this.element.querySelector("#new-scene-profile-name");
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) {
      ui.notifications.warn("Please enter a name for the new appearance.");
      return;
    }
    await this.profileManager.createSceneProfile(name);
    nameInput.value = ""; // Clear the input after saving
  }

  async _onResetGradientClick(button) {
    const wrapper = button.closest(".gradient-editor-wrapper");
    if (!wrapper) return;

    const path = wrapper.dataset.path;
    const gradientData = foundry.utils.deepClone(
      this._getPathValue(this.config, path)
    );

    if (!gradientData || gradientData.length <= 2) {
      return; // Nothing to reset
    }

    const startPoint = gradientData[0];

    const endPoint = gradientData[gradientData.length - 1];
    startPoint.time = 0;
    endPoint.time = 1;
    const newGradient = [startPoint, endPoint];

    // Use the central update function to save and refresh everything
    await this._performSystemUpdate(path, newGradient);
  }

  /**
   * The core logic for saving a change and refreshing visual systems.
   * Now uses targeted updates to only refresh the affected component.
   * @param {string} path - The object path to the setting (e.g., "baseShine.intensity").
   * @param {*} value - The new value for the setting.
   */
  async _performSystemUpdate(path, value) {
    // Debug logging for rope texture changes
    if (path?.includes("physicsRope") && path?.includes("texturePath")) {
      console.log("MapShine | _performSystemUpdate for rope texture:", {
        path,
        value,
        currentConfig: this.config?.physicsRope,
      });
    }

    // Handle rope-instance runtime properties (not profile settings)
    if (path.startsWith("rope-instance.")) {
      const parts = path.split(".");
      const ropeId = parts[1];
      const property = parts[2];

      // Update the runtime PhysicsRope instance
      const ropeLayer = canvas.layers.find(
        (l) => l.constructor.name === "PhysicsRopeLayer"
      );
      if (ropeLayer && ropeLayer.ropes) {
        const rope = ropeLayer.ropes.find((r) => r.id === ropeId);
        if (rope) {
          if (property === "isIndoors") {
            rope.isIndoors = value;
          } else if (property === "texturePath") {
            // Special handling for texture changes - need to reload texture
            try {
              const newTexture = await TextureLoader.loadTexture(value);
              newTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

              // Update the mesh texture
              rope.mesh.texture = newTexture;
              rope.textureWidth = newTexture.width;
              rope.textureHeight = newTexture.height;

              console.log(
                `MapShine | Updated rope ${ropeId} texture to: ${value}`
              );
              ui.notifications.info(`Rope texture updated successfully`);
            } catch (err) {
              console.error(
                `MapShine | Failed to load rope texture: ${value}`,
                err
              );
              ui.notifications.error(`Failed to load texture: ${value}`);
              return; // Don't save if texture failed to load
            }
          } else if (property === "ropeEndTexturePath") {
            // Handle rope end texture changes
            rope.ropeEndTexturePath = value;
            await rope.updateRopeEndSprites();
            console.log(
              `MapShine | Updated rope ${ropeId} end texture to: ${value}`
            );
          } else if (property === "ropeEndScale") {
            // Handle rope end scale changes
            rope.ropeEndScale = value;
            if (rope.ropeEndSprites) {
              rope.ropeEndSprites.forEach((sprite) => {
                if (sprite) sprite.scale.set(value);
              });
            }
            console.log(
              `MapShine | Updated rope ${ropeId} end scale to: ${value}`
            );
          } else if (rope.config) {
            rope.config[property] = value;
          }
          console.log(
            `MapShine | Updated rope ${ropeId}.${property} = ${value}`
          );
        }
      }

      // Also save the change to the MapPointsManager group data
      await MapPointsManager.updateGroupProperties(ropeId, {
        [property]: value,
      });

      return; // Don't save rope-instance changes to profile
    }

    // Handle group property changes (for the new unified group manager)
    if (path.startsWith("group.")) {
      const parts = path.split(".");
      const groupId = parts[1];
      const property = parts.slice(2).join("."); // Support nested properties like "emission.intensity"

      // Update the group data via MapPointsManager
      const updateData = {};
      // Handle nested property paths
      if (property.includes(".")) {
        const propParts = property.split(".");
        let current = updateData;
        for (let i = 0; i < propParts.length - 1; i++) {
          current[propParts[i]] = {};
          current = current[propParts[i]];
        }
        current[propParts[propParts.length - 1]] = value;
      } else {
        updateData[property] = value;
      }

      await MapPointsManager.updateGroupProperties(groupId, updateData);

      // Handle visibility toggles for effect source UI
      if (property === "isEffectSource") {
        const visibilityTargets = this.element.querySelectorAll(
          `[data-visibility-target="group.${groupId}.isEffectSource"]`
        );
        visibilityTargets.forEach((el) => {
          el.style.display = value
            ? el.classList.contains("control-row")
              ? "flex"
              : "block"
            : "none";
        });
      }

      if (property === "emission.falloff.enabled") {
        const visibilityTargets = this.element.querySelectorAll(
          `[data-visibility-target="group.${groupId}.emission.falloff.enabled"]`
        );
        visibilityTargets.forEach((el) => {
          el.style.display = value ? "block" : "none";
        });
      }

      // If type changed, trigger a re-render to show/hide type-specific controls
      if (property === "type") {
        if (game.mapShine.debugger) {
          game.mapShine.debugger.render(false);
        }
      }

      console.log(
        `MapShine | Updated group ${groupId}.${property} = ${JSON.stringify(
          value
        )}`
      );
      return; // Don't save group changes to profile
    }

    const isGameSetting =
      path.startsWith("universal.") || path.startsWith("loading-screen-");

    // Special handling for weather state changes - use profile system
    if (path === "weather.currentState") {
      const weatherManager = game.mapShine?.weatherSystemManager;
      if (weatherManager) {
        const config = this.profileManager.activeConfig.weather;
        
        // Transition to the new state (convert to lowercase and replace spaces with hyphens to match STATES)
        const stateNormalized = value.toLowerCase().replace(/\s+/g, '-');
        weatherManager.transitionToState(stateNormalized, config.transitionDuration || 10000);
        console.log(`MapShine | Transitioning to weather state: ${stateNormalized}`);
      }
      
      // Continue with normal profile system save
      await this.profileManager.recordUserChange(path, value);
      await this.profileManager.updateAllSystemsFromConfig();
      this.updateAllControls();
      return;
    }

    // Handle edge droplet parameter changes - restart particle system immediately
    if (path.startsWith("weather.edgeDroplets.")) {
      // Save to profile
      await this.profileManager.recordUserChange(path, value);
      
      // Restart the edge droplet particle system with new settings
      const weatherManager = game.mapShine?.weatherSystemManager;
      if (weatherManager?.edgeDropletController) {
        console.log(`MapShine | Edge droplet setting changed: ${path} = ${value}`);
        console.log('MapShine | Restarting edge droplet particle system...');
        
        // Destroy existing emitter
        if (weatherManager.edgeDropletController.emitter) {
          weatherManager.edgeDropletController.emitter.destroy();
          weatherManager.edgeDropletController.emitter = null;
        }
        
        // Clear edge cache to force redetection
        if (weatherManager.edgeDropletController.edgeDetector) {
          weatherManager.edgeDropletController.edgeDetector.clearCache();
        }
        
        // Reset initialization flag
        weatherManager.edgeDropletController.isInitialized = false;
        weatherManager.edgeDropletController.initializationFailed = false;
        
        // Get fresh config from profile
        const freshConfig = this.profileManager.activeConfig;
        
        // Update controller config reference
        weatherManager.edgeDropletController.config = freshConfig.weather.edgeDroplets;
        
        // Reinitialize with new settings
        weatherManager.edgeDropletController.initialize();
        
        console.log('MapShine | Edge droplet particle system restarted with new settings');
      }
      
      // Update UI controls and skip the full system refresh
      this.updateAllControls();
      return; // Exit early - don't run the normal setting save/refresh flow
    }

    // Handle weather shader parameter changes - update immediately via profile system
    if (path.startsWith("weather.rain.") || 
        path.startsWith("weather.snow.") || 
        path.startsWith("weather.fog.")) {
      
      // Save to profile
      await this.profileManager.recordUserChange(path, value);
      
      // Then update the active shader immediately
      const weatherManager = game.mapShine?.weatherSystemManager;
      if (weatherManager?.weatherEffectLayer) {
        const pathParts = path.replace("weather.", "").split(".");
        const shaderType = pathParts[0]; // rain, snow, or fog
        const paramPath = pathParts.slice(1); // e.g., ['tint', 'r'] or ['opacity']
        
        const effect = weatherManager.weatherEffectLayer.effects.get(shaderType);
        if (effect?.shader) {
          // Navigate to the correct property
          if (paramPath.length === 1) {
            // Simple property like opacity, intensity, etc.
            const param = paramPath[0];
            if (param === 'speed' || param === 'animationSpeed') {
              // Map 'speed' or 'animationSpeed' to shader.speed
              effect.shader.speed = value;
            } else if (param in effect.shader.uniforms) {
              effect.shader.uniforms[param] = value;
            } else if (param in effect.shader) {
              effect.shader[param] = value;
            }
            console.log(`MapShine | Updated ${shaderType} shader ${param} = ${value}`);
          } else if (paramPath.length === 2) {
            // Nested property like tint.r, resolution.x
            const parent = paramPath[0];
            const child = paramPath[1];
            
            if (parent === 'tint' && effect.shader.uniforms.tint) {
              // Tint is an array [r, g, b]
              const tintIndex = child === 'r' ? 0 : child === 'g' ? 1 : 2;
              effect.shader.uniforms.tint[tintIndex] = value;
              console.log(`MapShine | Updated ${shaderType} shader tint[${tintIndex}] = ${value}`);
            } else if (parent === 'resolution' && effect.shader.uniforms.resolution) {
              // Resolution is an array [x, y]
              const resIndex = child === 'x' ? 0 : 1;
              effect.shader.uniforms.resolution[resIndex] = value;
              console.log(`MapShine | Updated ${shaderType} shader resolution[${resIndex}] = ${value}`);
            }
          }
        }
      }
      
      // Update UI controls and skip the full system refresh
      this.updateAllControls();
      return; // Exit early - don't run the normal setting save/refresh flow
    }
    
    if (isGameSetting) {
      await game.settings.set(MODULE_ID, path, value);
      // A full refresh ensures any managers reading these settings are updated.
      await this.profileManager.initializeForScene();
      await this.profileManager.updateAllSystemsFromConfig();
    } else {
      // Record the change in user overrides
      await this.profileManager.recordUserChange(path, value);

      // USE TARGETED UPDATE - only refresh the affected system
      await this.profileManager.updateSystemFromPath(path, value);
    }

    // Debug logging after save
    if (path?.includes("physicsRope") && path?.includes("texturePath")) {
      console.log("MapShine | After save, config is now:", {
        path,
        configValue: this.config?.physicsRope,
      });
    }

    // After the update, re-render all UI controls to ensure they are in sync with the new state.
    this.updateAllControls();

    // Special case: particle effects may need target updates
    const isParticleSetting =
      Object.values(PARTICLE_EFFECT_DEFINITIONS).some((def) =>
        path.startsWith(def.configPath)
      ) || path.startsWith("particleSystems");
    if (isParticleSetting) {
      const particleLayer = canvas.layers.find(
        (l) => l instanceof ParticleLayer
      );
      if (particleLayer && game.mapShine.effectTargetManager.targets) {
        // Find which particle effect this path belongs to
        const affectedDefinition = Object.entries(PARTICLE_EFFECT_DEFINITIONS).find(
          ([key, def]) => path.startsWith(def.configPath)
        );
        
        if (affectedDefinition && game.mapShine.particleManager) {
          const [effectKey, definition] = affectedDefinition;
          const controller = game.mapShine.particleManager.controllers.get(effectKey);
          
          if (controller) {
            console.log(`MapShine | Rebuilding ${effectKey} particle emitters due to config change: ${path}`);
            
            // Use rate-limited rebuild to prevent rapid slider changes from causing orphans
            // This adds 500ms debounce + 5s cooldown between rebuilds
            const config = game.mapShine.profileManager.activeConfig;
            controller.requestRebuild(
              game.mapShine.effectTargetManager.targets,
              config
            );
            
            // NOTE: requestRebuild() handles:
            // 1. Debounce: waits 500ms for user to stop changing sliders
            // 2. Cooldown: enforces 5s minimum between rebuilds
            // 3. Queueing: if in cooldown, queues rebuild for later
            // 4. Proper cleanup: destroyAllEmitters() + updateTargets()
          }
        } else {
          // For global particle settings, update all effects
          await particleLayer.updateEffectTargets(
            game.mapShine.effectTargetManager.targets
          );
        }
      }
    }
  }

  _updateActionButtonsState() {
    if (!this.element) return;
    const isDirty = this.profileManager.status.isDirty;
    const isGm = this.profileManager.isGm;

    const updateBtn = this.element.querySelector(
      "#update-active-appearance-btn"
    );
    if (updateBtn) {
      updateBtn.disabled = !isDirty || !isGm;
    }

    const revertBtn = this.element.querySelector("#revert-changes-btn");
    if (revertBtn) {
      revertBtn.disabled = !isDirty;
    }

    // Bind live preview updates for Loading Screen & Transitions when preview is active
    this._wireLoadingPreviewLiveUpdates();
  }

  _wireLoadingPreviewLiveUpdates() {
    if (!this.element) return;
    const mgr = game.mapShine?.sceneChangeManager;
    if (!mgr || !mgr.previewActive) return;

    const bindIfNeeded = (el, type, handler) => {
      if (!el) return;
      const key = `msBound_${type}`;
      if (el.dataset && el.dataset[key]) return;
      el.addEventListener(type, handler);
      if (el.dataset) el.dataset[key] = "1";
    };

    // Elements within Loading Screen (initial) section
    const overlayEnabledEl = this.element.querySelector(
      '[data-path="loading-screen-background-overlay-enabled"]'
    );
    const overlayOpacityEl = this.element.querySelector(
      '[data-path="loading-screen-background-overlay-opacity"]'
    );
    const useRandomBgEl = this.element.querySelector(
      '[data-path="loading-screen-use-random-background"]'
    );
    const staticBgEl = this.element.querySelector(
      '[data-path="loading-screen-static-background"]'
    );

    // Elements within Scene Transition section
    const logoPathEl = this.element.querySelector(
      '[data-path="universal.sceneTransition.logoPath"]'
    );
    const headingEl = this.element.querySelector(
      '[data-path="universal.sceneTransition.heading"]'
    );
    const subheadingEl = this.element.querySelector(
      '[data-path="universal.sceneTransition.subheading"]'
    );
    const useRandomHintEl = this.element.querySelector(
      '[data-path="universal.sceneTransition.useRandomHint"]'
    );
    const hintsWrapper = this.element.querySelector(
      "#sceneTransition-randomHints-wrapper"
    );

    // Overlay enabled toggle
    bindIfNeeded(overlayEnabledEl, "change", () => {
      const bg = mgr.transitionOverlay?.querySelector(
        ".loading-background-overlay"
      );
      if (!bg) return;
      if (overlayEnabledEl.checked) {
        const v = Number(overlayOpacityEl?.value ?? 0.6);
        mgr._updateOverlayOpacity?.(v);
      } else {
        bg.style.display = "none";
      }
    });

    // Opacity live update
    bindIfNeeded(overlayOpacityEl, "input", () => {
      if (overlayEnabledEl && !overlayEnabledEl.checked) return;
      const v = Number(overlayOpacityEl.value);
      mgr._updateOverlayOpacity?.(v);
    });

    // Random/static background controls
    bindIfNeeded(useRandomBgEl, "change", () => {
      if (useRandomBgEl.checked) {
        mgr._setRandomBackground?.();
      } else {
        mgr._setStaticBackground?.(staticBgEl?.value ?? "");
      }
    });
    bindIfNeeded(staticBgEl, "change", () => {
      if (useRandomBgEl && useRandomBgEl.checked) return;
      mgr._setStaticBackground?.(staticBgEl.value ?? "");
    });

    // Logo and text content bindings (update DOM directly on the overlay)
    bindIfNeeded(logoPathEl, "input", () => {
      const img = mgr.transitionOverlay?.querySelector(".loading-logo");
      if (img) {
        // Use fallback if value is empty
        const logoPath = (logoPathEl.value && logoPathEl.value.trim() !== "")
          ? logoPathEl.value
          : "modules/map-shine/assets/fvtt.png";
        img.setAttribute("src", logoPath);
      }
    });
    bindIfNeeded(headingEl, "input", () => {
      const title = mgr.transitionOverlay?.querySelector(".loading-title");
      if (title) title.textContent = headingEl.value || title.textContent;
    });
    bindIfNeeded(subheadingEl, "input", () => {
      const sub = mgr.transitionOverlay?.querySelector(".loading-subhead");
      if (sub) sub.textContent = subheadingEl.value;
    });

    // Hints: re-cycle when toggle or list content changes
    bindIfNeeded(useRandomHintEl, "change", () => {
      mgr._stopHintCycle?.();
      mgr._cycleHints?.();
    });
    if (hintsWrapper && !hintsWrapper.dataset.msBound_input) {
      const refreshHints = () => {
        mgr._stopHintCycle?.();
        mgr._cycleHints?.();
      };
      hintsWrapper.addEventListener("input", refreshHints);
      hintsWrapper.addEventListener("change", refreshHints);
      hintsWrapper.dataset.msBound_input = "1";
    }

    // Font changes: update overlay styles when fonts are changed
    const heading1FontEl = this.element.querySelector(
      '[data-path="universal.fontManager.styles.heading1.fontFamily"]'
    );
    const heading2FontEl = this.element.querySelector(
      '[data-path="universal.fontManager.styles.heading2.fontFamily"]'
    );
    const hintFontEl = this.element.querySelector(
      '[data-path="universal.fontManager.styles.hint.fontFamily"]'
    );

    bindIfNeeded(heading1FontEl, "change", () => {
      const title = mgr.transitionOverlay?.querySelector(".loading-title");
      if (title && heading1FontEl.value) {
        title.style.fontFamily = `"${heading1FontEl.value}", sans-serif`;
      }
    });
    bindIfNeeded(heading2FontEl, "change", () => {
      const subhead = mgr.transitionOverlay?.querySelector(".loading-subhead");
      if (subhead && heading2FontEl.value) {
        subhead.style.fontFamily = `"${heading2FontEl.value}", sans-serif`;
      }
    });
    bindIfNeeded(hintFontEl, "change", () => {
      const hint = mgr.transitionOverlay?.querySelector(".loading-hint");
      if (hint && hintFontEl.value) {
        hint.style.fontFamily = `"${hintFontEl.value}", serif`;
      }
    });

    // Initial loading screen subheading
    const initialSubheadingEl = this.element.querySelector(
      '[data-path="loading-screen-subheading"]'
    );
    bindIfNeeded(initialSubheadingEl, "input", () => {
      const sub = mgr.transitionOverlay?.querySelector(".loading-subhead");
      if (sub) sub.textContent = initialSubheadingEl.value;
    });
  }

  async _createParticleEffectArea(effectKey) {
    // 1. Create a new group.
    // Use the comprehensive EFFECT_SOURCE_OPTIONS for names
    const effectName = EFFECT_SOURCE_OPTIONS[effectKey] || "New Effect";

    let groupType = "area"; // Default for most particle effects
    if (effectKey === "lightning") {
      groupType = "line";
    }

    const newGroupId = await MapPointsManager.createGroup({
      label: `New ${effectName} Area`,
      type: groupType,
    });

    if (!newGroupId) {
      ui.notifications.error("Failed to create a new map point group.");
      return;
    }

    // 2. Configure the new group for the effect.
    await MapPointsManager.updateGroupProperties(newGroupId, {
      isEffectSource: true,
      effectTarget: effectKey,
    });

    // 3. Set as active group and activate placement mode.
    game.mapShine.activeMapPointGroup = newGroupId;
    const manager = game.mapShine.mapPointsInteractionManager;
    if (!manager.isActive) {
      manager.activate();
    }

    ui.notifications.info(
      `Ready to draw the new ${groupType} for "${effectName}". Click on the map to add points.`
    );
  }

  async _createPhysicsRope(ropeType = "rope") {
    // 1. Create a new rope group
    const preset = ROPE_TYPE_PRESETS[ropeType];

    // Get all settings from config for this rope type, falling back to preset
    const config = this.config;
    const typeConfig = config?.physicsRope?.[ropeType] || {};

    const ropeSettings = {
      texturePath: typeConfig.texturePath || preset.texturePath,
      segmentLength: typeConfig.segmentLength ?? preset.segmentLength,
      animationSpeed: typeConfig.animationSpeed ?? preset.animationSpeed,
      damping: typeConfig.damping ?? preset.damping,
      windForce: typeConfig.windForce ?? preset.windForce,
      springConstant: typeConfig.springConstant ?? preset.springConstant,
      tapering: typeConfig.tapering ?? preset.tapering,
      ropeEndTexturePath:
        typeConfig.ropeEndTexturePath ?? preset.ropeEndTexturePath,
      ropeEndScale: typeConfig.ropeEndScale ?? preset.ropeEndScale,
      indoorWindShielding:
        typeConfig.indoorWindShielding ?? preset.indoorWindShielding,
      endpointFade: typeConfig.endpointFade ?? preset.endpointFade,
      fadeStartDistance:
        typeConfig.fadeStartDistance ?? preset.fadeStartDistance,
      fadeEndDistance: typeConfig.fadeEndDistance ?? preset.fadeEndDistance,
    };

    console.log("MapShine | Creating rope:", {
      ropeType,
      configValues: typeConfig,
      presetValues: preset,
      finalSettings: ropeSettings,
    });

    const newGroupId = await MapPointsManager.createGroup({
      label: `New ${preset.label}`,
      type: "rope",
      ropeSettings: {
        ropeType: ropeType,
        texturePath: ropeSettings.texturePath,
        segmentLength: ropeSettings.segmentLength,
        animationSpeed: ropeSettings.animationSpeed,
        damping: ropeSettings.damping,
        windForce: ropeSettings.windForce,
        springConstant: ropeSettings.springConstant,
        tapering: ropeSettings.tapering,
        ropeEndTexturePath: ropeSettings.ropeEndTexturePath,
        ropeEndScale: ropeSettings.ropeEndScale,
        indoorWindShielding: ropeSettings.indoorWindShielding,
        endpointFade: ropeSettings.endpointFade,
        fadeStartDistance: ropeSettings.fadeStartDistance,
        fadeEndDistance: ropeSettings.fadeEndDistance,
      },
    });

    if (!newGroupId) {
      ui.notifications.error("Failed to create a new rope group.");
      return;
    }

    // 2. Set as active group and activate placement mode.
    game.mapShine.activeMapPointGroup = newGroupId;
    const manager = game.mapShine.mapPointsInteractionManager;
    if (!manager.isActive) {
      manager.activate();
    }

    ui.notifications.info(
      `Ready to draw the new ${preset.label}. Click on the map to add anchor points.`
    );
  }

  _initializeGradientEditors() {
    this.element
      .querySelectorAll(".gradient-editor-wrapper")
      .forEach((wrapper) => {
        const path = wrapper.dataset.path;
        const gradientData = this._getPathValue(this.config, path);
        if (gradientData) {
          this._renderGradientEditor(wrapper, path, gradientData);
        }
      });
  }

  _renderGradientEditor(wrapper, path, gradientData) {
    if (!wrapper || !gradientData) return;

    // Sort stops by time just in case
    gradientData.sort((a, b) => a.time - b.time);

    const previewBar = wrapper.querySelector(".gradient-bar-preview");
    const stopsContainer = wrapper.querySelector(".gradient-stops-container");
    const controlsContainer = wrapper.querySelector(
      ".gradient-editor-controls"
    );

    // Create CSS gradient string, now with position information for each stop.
    const gradientCss = `linear-gradient(to right, ${gradientData
      .map(
        (stop) =>
          `rgba(${hexToRgbArray(stop.color)
            .map((c) => c * 255)
            .join(",")}, ${stop.alpha}) ${stop.time * 100}%`
      )
      .join(", ")})`;
    previewBar.style.background = gradientCss;

    // Re-create stops
    stopsContainer.innerHTML = "";
    gradientData.forEach((stop, index) => {
      const stopEl = document.createElement("div");
      stopEl.className = "gradient-stop";
      stopEl.dataset.index = index;
      stopEl.style.left = `${stop.time * 100}%`;
      stopEl.style.backgroundColor = stop.color;
      if (index === 0 || index === gradientData.length - 1) {
        stopEl.classList.add("endpoint");
      }
      if (
        this.activeGradientEditor.path === path &&
        this.activeGradientEditor.stopIndex === index
      ) {
        stopEl.classList.add("active");
      }
      stopsContainer.appendChild(stopEl);
    });

    // Update controls if a stop is active
    const activeIndex = this.activeGradientEditor.stopIndex;
    if (
      this.activeGradientEditor.path === path &&
      activeIndex !== null &&
      gradientData[activeIndex]
    ) {
      controlsContainer.classList.add("visible");
      const activeStop = gradientData[activeIndex];
      const editorType = wrapper.dataset.editorType || "color";

      const alphaSlider = wrapper.querySelector(
        `#${DebuggerUIBuilder._createSafeId(path)}-alpha-slider`
      );
      const alphaValue = wrapper.querySelector(
        `#${DebuggerUIBuilder._createSafeId(path)}-alpha-value`
      );

      alphaSlider.value = activeStop.alpha;
      alphaValue.textContent = activeStop.alpha.toFixed(2);

      if (editorType === "brightness") {
        const brightnessSlider = wrapper.querySelector(
          `#${DebuggerUIBuilder._createSafeId(path)}-brightness-slider`
        );
        const brightnessValue = wrapper.querySelector(
          `#${DebuggerUIBuilder._createSafeId(path)}-brightness-value`
        );
        const rgb = hexToRgbArray(activeStop.color);
        const luminance = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114;
        brightnessSlider.value = luminance;
        brightnessValue.textContent = luminance.toFixed(2);
      } else {
        // 'color'
        const colorPicker = wrapper.querySelector(
          `#${DebuggerUIBuilder._createSafeId(path)}-color-picker`
        );
        colorPicker.value = activeStop.color;
      }
    } else {
      controlsContainer.classList.remove("visible");
    }
  }

  rebindDynamicControls() {
    return this._wrapWithTiming('rebindDynamicControls', () => {
      this._populateDiagnosticDropdown();
      this._populateLutDropdown();
      this._populateProfilesDropdown(); // For world profiles
      this._populateSceneProfileDropdown(); // For scene appearances
      this.updateAllControls();
      this._updateFavoritesList();
      this._initializeCurveEditor();
      this._initializeGradientEditors();

      // Instantiate the clock in the bottom bar
      if (this.uiClock) {
        this.uiClock.destroy();
        this.uiClock = null;
      }
      const clockContainer = this.element.querySelector(
        "#debugger-ui-clock-container"
      );
      if (clockContainer) {
        this.uiClock = new MapShineClock(clockContainer, null, {
          showDragHandle: false,
          showDisclaimer: false,
        });
      }

      // Link the transition manager to the UI update function
      if (game.mapShine.transitionManager) {
        game.mapShine.transitionManager.onStatusUpdate(
          this.updateTransitionStatus.bind(this)
        );
      }
      
      // Update zoom displays after rebind
      this.updateZoomDisplay();
    });
  }

  updateParticleCount(count, limit) {
    return this._wrapWithTiming('updateParticleCount', () => {
      if (!this.element) return;
      const countEl = this.element.querySelector("#particle-count-display");
      const limitEl = this.element.querySelector("#particle-limit-display");

      if (countEl) countEl.textContent = count;
      if (limitEl) limitEl.textContent = limit;
    });
  }

  /**
   * Update weather system diagnostic panel with real-time data
   */
  updateWeatherDiagnostics() {
    return this._wrapWithTiming('updateWeatherDiagnostics', () => {
      if (!this.element) return;
      
      const weatherManager = game.mapShine?.weatherSystemManager;
      if (!weatherManager) return;

      const diag = weatherManager.getDiagnostics();
      
      // Update state display
      const stateEl = this.element.querySelector("#weather-diag-state");
      if (stateEl) {
        stateEl.textContent = diag.weatherName || diag.currentState;
        stateEl.style.color = diag.isTransitioning ? "#fbbf24" : "#fff";
      }

      // Update transition progress
      const transitionEl = this.element.querySelector("#weather-diag-transition");
      if (transitionEl) {
        transitionEl.textContent = diag.transitionProgress;
        transitionEl.style.color = diag.isTransitioning ? "#fbbf24" : "#94a3b8";
      }

      // Update precipitation type
      const precipTypeEl = this.element.querySelector("#weather-diag-precip-type");
      if (precipTypeEl) {
        precipTypeEl.textContent = diag.precipitationType;
      }

      // Update shader layer status
      const shaderLayerEl = this.element.querySelector("#weather-diag-shader-layer");
      if (shaderLayerEl) {
        if (diag.shaderLayerActive) {
          shaderLayerEl.textContent = "✓ Active";
          shaderLayerEl.style.color = "#10b981";
        } else {
          shaderLayerEl.textContent = "✗ Inactive";
          shaderLayerEl.style.color = "#ef4444";
        }
      }

      // Update active effects count
      const effectsCountEl = this.element.querySelector("#weather-diag-effects-count");
      if (effectsCountEl) {
        effectsCountEl.textContent = diag.effectsCount || 0;
        effectsCountEl.style.color = diag.effectsCount > 0 ? "#10b981" : "#94a3b8";
      }

      // Update system ready status
      const readyEl = this.element.querySelector("#weather-diag-ready");
      if (readyEl) {
        if (diag.isReady) {
          readyEl.textContent = "✓ Yes";
          readyEl.style.color = "#10b981";
        } else {
          readyEl.textContent = "✗ No";
          readyEl.style.color = "#ef4444";
        }
      }

      // Update wind system display
      const windSpeedEl = this.element.querySelector("#weather-diag-wind-speed");
      if (windSpeedEl) {
        windSpeedEl.textContent = diag.windManagerSpeed;
        // Highlight if speed is high
        const speed = parseFloat(diag.windManagerSpeed);
        if (!isNaN(speed) && speed > 30) {
          windSpeedEl.style.color = "#fbbf24";
        } else {
          windSpeedEl.style.color = "#fff";
        }
      }
      
      const windGustingEl = this.element.querySelector("#weather-diag-wind-gusting");
      if (windGustingEl) {
        windGustingEl.textContent = diag.windManagerIsGusting;
        windGustingEl.style.color = diag.windManagerIsGusting === 'Yes' ? "#fbbf24" : "#94a3b8";
      }
      
      const windBaseCfgEl = this.element.querySelector("#weather-diag-wind-base-cfg");
      if (windBaseCfgEl) {
        windBaseCfgEl.textContent = diag.windManagerBaseSpeed;
      }
      
      const windGustCfgEl = this.element.querySelector("#weather-diag-wind-gust-cfg");
      if (windGustCfgEl) {
        windGustCfgEl.textContent = diag.windManagerGustSpeed;
      }
      
      const windMultEl = this.element.querySelector("#weather-diag-wind-mult");
      if (windMultEl) {
        const multText = `${diag.windBase}x base / ${diag.windGust}x gust / ${diag.windGustFreq}x freq`;
        windMultEl.textContent = multText;
      }
      
      // Update error display
      const errorContainer = this.element.querySelector("#weather-diag-error");
      const errorMsgEl = this.element.querySelector("#weather-diag-error-msg");
      const errorTimeEl = this.element.querySelector("#weather-diag-error-time");
      
      if (errorContainer && errorMsgEl && errorTimeEl) {
        if (diag.lastError) {
          errorContainer.style.display = "block";
          errorMsgEl.textContent = diag.lastError;
          errorTimeEl.textContent = `at ${diag.lastErrorTime}`;
        } else {
          errorContainer.style.display = "none";
        }
      }
    });
  }

  /**
   * Sets up event listeners to dynamically resize columns based on accordion open state
   */
  _setupDynamicColumnResizing() {
    const wrapper = this.element.querySelector(".main-layout-wrapper");
    if (!wrapper) return;

    // Listen for toggle events only on main effect accordions (not nested details)
    this.element.addEventListener(
      "toggle",
      (e) => {
        if (
          e.target.tagName === "DETAILS" &&
          e.target.id &&
          e.target.id.startsWith("details-")
        ) {
          this._updateColumnWidths();
        }
      },
      true
    ); // Use capture phase to catch all toggle events
  }

  /**
   * Updates column widths based on which accordions are open
   */
  _updateColumnWidths() {
    return this._wrapWithTiming('_updateColumnWidths', () => {
      const wrapper = this.element.querySelector(".main-layout-wrapper");
      if (!wrapper) return;

      const column1 = this.element.querySelector("#fx-column-1");
      const column2 = this.element.querySelector("#fx-column-2");
      const column3 = this.element.querySelector("#fx-column-3");

      if (!column1 || !column2 || !column3) return;

      // Count open accordions in each column (only top-level effect accordions, not nested details)
      // Main effect accordions are direct children with IDs starting with "details-"
      const openInColumn1 = column1.querySelectorAll(
        ':scope > details[id^="details-"][open]'
      ).length;
      const openInColumn2 = column2.querySelectorAll(
        ':scope > details[id^="details-"][open]'
      ).length;
      const openInColumn3 = column3.querySelectorAll(
        ':scope > details[id^="details-"][open]'
      ).length;

      const totalOpen = openInColumn1 + openInColumn2 + openInColumn3;

      // Remove all state classes
      wrapper.classList.remove(
        "col-1-active",
        "col-2-active",
        "col-3-active",
        "multiple-active"
      );

      // If only one column has open accordions, expand it
      if (totalOpen > 0) {
        if (openInColumn1 > 0 && openInColumn2 === 0 && openInColumn3 === 0) {
          wrapper.classList.add("col-1-active");
        } else if (
          openInColumn2 > 0 &&
          openInColumn1 === 0 &&
          openInColumn3 === 0
        ) {
          wrapper.classList.add("col-2-active");
        } else if (
          openInColumn3 > 0 &&
          openInColumn1 === 0 &&
          openInColumn2 === 0
        ) {
          wrapper.classList.add("col-3-active");
        } else {
          // Multiple columns have open accordions - balance them
          wrapper.classList.add("multiple-active");
        }
      }
      // If no accordions are open, default balanced state (no class needed)
    });
  }

  /**
   * Filters effect sections based on search query
   * Searches through ALL accordions (including nested sub-accordions) and shows parent accordions when children match
   * @param {string} query - The search query
   */
  _filterEffects(query) {
    // Get ALL details elements (top-level and nested) plus h3 headings
    const allTopLevel = this.element.querySelectorAll('.fx-column > details, .fx-column > h3');
    const allDetails = this.element.querySelectorAll('.fx-column details');
    
    if (!query) {
      // Show all effects when search is empty
      allDetails.forEach(el => {
        el.style.display = '';
      });
      allTopLevel.forEach(el => {
        el.style.display = '';
      });
      return;
    }
    
    // First pass: Mark which elements match the search
    const matchingElements = new Set();
    
    allDetails.forEach(el => {
      // Get the text content of the summary
      const summaryText = el.querySelector('summary')?.textContent || '';
      
      // Check if text matches the query
      if (summaryText.toLowerCase().includes(query)) {
        matchingElements.add(el);
        
        // Also mark all parent accordions as matching
        let parent = el.parentElement?.closest('details');
        while (parent) {
          matchingElements.add(parent);
          parent = parent.parentElement?.closest('details');
        }
      }
    });
    
    // Also check h3 headings
    const h3Elements = this.element.querySelectorAll('.fx-column > h3');
    h3Elements.forEach(el => {
      if (el.textContent.toLowerCase().includes(query)) {
        matchingElements.add(el);
      }
    });
    
    // Second pass: Show/hide based on matches
    allDetails.forEach(el => {
      if (matchingElements.has(el)) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
    
    h3Elements.forEach(el => {
      el.style.display = matchingElements.has(el) ? '' : 'none';
    });
  }

  _onTimeControlChanged(time) {
    const now = Date.now();
    const timeSinceLastUpdate = now - this._lastTimeChangedUpdate;
    
    if (timeSinceLastUpdate < 150) {
      return; // Skip this update
    }
    
    this._lastTimeChangedUpdate = now;
    this.updateAllControls(time);
  }

  async _onNewCleanProfileClick() {
    const name = await Dialog.prompt({
      title: "New Clean Profile",
      content: `<p>Enter a name for the new, clean appearance profile:</p><input type="text" name="profileName" placeholder="e.g., Night Time">`,

      callback: (html) => html.find('input[name="profileName"]').val(),
      rejectClose: false,
    });

    if (name) {
      await this.profileManager.createCleanSceneProfile(name);
    }
  }

  /**
   * Apply rain preset
   * @param {string} preset - Preset name: 'light-drizzle', 'steady-rain', 'heavy-storm', 'cinematic'
   */
  async _onApplyRainPreset(preset) {
    const presets = {
      'light-drizzle': {
        // Ultra sparse: Just a few visible drops (1 layer only)
        opacity: 0.40,
        intensity: 1.40,
        strength: 0.35,
        speed: 0.12,
        rainDensity: 0.01,        // 0.01% = ~2 drops at 4K
        gridSize: 45,
        streakLength: 40,
        splashIntensity: 0.03,
        waveMaskIntensity: 1.50,
        curtainIntensity: 1.70
      },
      'steady-rain': {
        // Moderate rain: 2-3 layers active, visible rain
        opacity: 0.50,
        intensity: 1.70,
        strength: 0.50,
        speed: 0.20,
        rainDensity: 8.0,          // 8% = activates layer 2
        gridSize: 80,
        streakLength: 50,
        splashIntensity: 0.15,
        waveMaskIntensity: 1.20,
        curtainIntensity: 1.40
      },
      'heavy-storm': {
        // Heavy rain: 4 layers active, dramatic effect
        opacity: 0.65,
        intensity: 2.20,
        strength: 0.75,
        speed: 0.35,
        rainDensity: 45.0,         // 45% = activates layer 4
        gridSize: 150,
        streakLength: 65,
        splashIntensity: 0.40,
        waveMaskIntensity: 0.80,
        curtainIntensity: 1.00
      },
      'cinematic': {
        // Storm: All 5 layers maxed, full screen coverage
        opacity: 0.80,
        intensity: 2.80,
        strength: 1.00,
        speed: 0.50,
        rainDensity: 85.0,         // 85% = all 5 layers active
        gridSize: 220,
        streakLength: 80,
        splashIntensity: 0.70,
        waveMaskIntensity: 0.50,
        curtainIntensity: 0.60
      }
    };

    const settings = presets[preset];
    if (!settings) {
      console.warn(`MapShine | Unknown rain preset: ${preset}`);
      return;
    }

    // Apply all preset values
    for (const [key, value] of Object.entries(settings)) {
      await this.profileManager.recordUserChange(`weather.rain.${key}`, value);
    }

    await this.profileManager.updateAllSystemsFromConfig();
    this.updateAllControls();
    
    // Show friendly notification
    const presetNames = {
      'light-drizzle': 'Light Drizzle',
      'steady-rain': 'Steady Rain',
      'heavy-storm': 'Heavy Storm',
      'cinematic': 'Cinematic'
    };
    ui.notifications.info(`Applied "${presetNames[preset]}" rain preset`);
  }

  /**
   * Apply color tint preset
   * @param {string} tint - Tint name: 'cool', 'neutral', 'warm'
   */
  async _onApplyTintPreset(tint) {
    const presets = {
      'cool': { r: 0.7, g: 0.9, b: 1.0 },
      'neutral': { r: 0.9, g: 0.9, b: 0.9 },
      'warm': { r: 1.0, g: 0.85, b: 0.7 }
    };

    const colors = presets[tint];
    if (!colors) {
      console.warn(`MapShine | Unknown tint preset: ${tint}`);
      return;
    }

    // Apply RGB values
    await this.profileManager.recordUserChange('weather.rain.tint.r', colors.r);
    await this.profileManager.recordUserChange('weather.rain.tint.g', colors.g);
    await this.profileManager.recordUserChange('weather.rain.tint.b', colors.b);

    await this.profileManager.updateAllSystemsFromConfig();
    this.updateAllControls();

    const tintNames = {
      'cool': 'Cool (Blue)',
      'neutral': 'Neutral',
      'warm': 'Warm'
    };
    ui.notifications.info(`Applied "${tintNames[tint]}" tint`);
  }

  /**
   * Apply performance/quality preset
   * @param {string} quality - Quality level: 'low', 'medium', 'ultra'
   */
  async _onApplyQualityPreset(quality) {
    const presets = {
      'low': {
        gridSize: 100,
        rainDensity: 10.0
      },
      'medium': {
        gridSize: 150,
        rainDensity: 15.0
      },
      'ultra': {
        gridSize: 200,
        rainDensity: 20.0
      }
    };

    const settings = presets[quality];
    if (!settings) {
      console.warn(`MapShine | Unknown quality preset: ${quality}`);
      return;
    }

    // Apply quality settings
    await this.profileManager.recordUserChange('weather.rain.gridSize', settings.gridSize);
    await this.profileManager.recordUserChange('weather.rain.rainDensity', settings.rainDensity);

    await this.profileManager.updateAllSystemsFromConfig();
    this.updateAllControls();

    const qualityNames = {
      'low': 'Low (Larger drops)',
      'medium': 'Medium (Balanced)',
      'ultra': 'Ultra (Fine detail)'
    };
    ui.notifications.info(`Applied "${qualityNames[quality]}" quality preset`);
  }

  async _onRenameSceneProfileClick() {
    const dropdown = this.element.querySelector("#scene-profile-select");
    if (!dropdown || !dropdown.value) {
      ui.notifications.warn("No scene appearance selected to rename.");
      return;
    }
    const profileId = dropdown.value;
    const profile = this.profileManager
      .getSceneProfiles()
      .find((p) => p.id === profileId);
    if (!profile) return;

    const newName = await Dialog.prompt({
      title: "Rename Appearance",
      content: `<p>Enter a new name for "<strong>${Handlebars.escapeExpression(
        profile.name
      )}</strong>":</p><input type="text" name="newName" value="${Handlebars.escapeExpression(
        profile.name
      )}">`,

      callback: (html) => html.find('input[name="newName"]').val(),
      rejectClose: false,
    });

    if (newName && newName.trim() !== profile.name) {
      await this.profileManager.renameSceneProfile(profileId, newName.trim());
    }
  }

  async _onDeleteSceneProfileClick() {
    const dropdown = this.element.querySelector("#scene-profile-select");
    if (!dropdown || !dropdown.value) {
      ui.notifications.warn("No scene appearance selected to delete.");
      return;
    }
    const profileId = dropdown.value;
    const profile = this.profileManager
      .getSceneProfiles()
      .find((p) => p.id === profileId);
    if (!profile) return;

    Dialog.confirm({
      title: "Delete Appearance",
      content: `<p>Are you sure you want to delete the scene appearance "<strong>${Handlebars.escapeExpression(
        profile.name
      )}</strong>"? This cannot be undone.</p>`,
      yes: async () => {
        await this.profileManager.deleteSceneProfile(profileId);
      },
      defaultYes: false,
    });
  }

  async _onCreateSceneProfilesClick() {
    await this.profileManager.createInitialSceneProfiles();
  }

  async _onImportWorldProfile() {
    const dropdown = this.element.querySelector("#profiles-dropdown");
    if (!dropdown || !dropdown.value) {
      ui.notifications.warn("No world profile selected to import.");
      return;
    }
    const profileName = dropdown.value;
    await this.profileManager.importWorldProfile(profileName);
  }

  _onGradientMouseMove(event) {
    if (!this.activeGradientEditor.isDragging) return;

    const { path, stopIndex } = this.activeGradientEditor;
    if (path === null || stopIndex === null) return;

    const gradientData = this._getPathValue(this.config, path);
    if (!gradientData) return;

    // Cannot move start or end stops horizontally

    if (stopIndex === 0 || stopIndex === gradientData.length - 1) return;

    const wrapper = this.element.querySelector(
      `.gradient-editor-wrapper[data-path="${path}"]`
    );
    if (!wrapper) return;

    const bar = wrapper.querySelector(".gradient-bar-container");
    const rect = bar.getBoundingClientRect();

    const x = event.clientX - rect.left;
    let time = x / rect.width;

    // Clamp time between neighbors
    const prevTime = gradientData[stopIndex - 1].time;
    const nextTime = gradientData[stopIndex + 1].time;
    time = Math.max(prevTime + 0.001, Math.min(nextTime - 0.001, time));

    gradientData[stopIndex].time = time;

    this._renderGradientEditor(wrapper, path, gradientData);
    this.debouncedSystemUpdate(path, gradientData);
  }

  _onGradientMouseUp(_event) {
    if (!this.activeGradientEditor.isDragging) return;

    const { path } = this.activeGradientEditor;
    const gradientData = this._getPathValue(this.config, path);

    // A final update to persist the change.
    this.profileManager.recordUserChange(path, gradientData);
    this.profileManager.updateAllSystemsFromConfig();

    // Reset dragging state
    this.activeGradientEditor.isDragging = false;
    // The active stop remains selected, which is good UX.

    window.removeEventListener("mousemove", this._boundGradientMouseMove);
    // The mouseup is {once: true}, but removing it is safer
    window.removeEventListener("mouseup", this._boundGradientMouseUp);
  }

  _onGradientBarDoubleClick(event) {
    const bar = event.target.closest(".gradient-bar-container");
    if (!bar) return;

    const wrapper = bar.closest(".gradient-editor-wrapper");
    const path = wrapper.dataset.path;
    const gradientData = this._getPathValue(this.config, path);
    if (!gradientData) return;

    const rect = bar.getBoundingClientRect();
    const time = (event.clientX - rect.left) / rect.width;

    let insertIndex = 1;

    for (let i = 0; i < gradientData.length - 1; i++) {
      if (time > gradientData[i].time && time < gradientData[i + 1].time) {
        insertIndex = i + 1;
        break;
      }
    }

    const prev = gradientData[insertIndex - 1];
    const next = gradientData[insertIndex];
    const blend = (time - prev.time) / (next.time - prev.time);

    const lerp = (a, b, t) => a * (1 - t) + b * t;
    const newAlpha = lerp(prev.alpha, next.alpha, blend);

    const startColor = hexToRgbArray(prev.color);
    const endColor = hexToRgbArray(next.color);
    const newColorRgb = [
      lerp(startColor[0], endColor[0], blend),
      lerp(startColor[1], endColor[1], blend),
      lerp(startColor[2], endColor[2], blend),
    ];

    const newColorHex = new PIXI.Color(newColorRgb).toHex();

    const newStop = { time, color: newColorHex, alpha: newAlpha };

    gradientData.splice(insertIndex, 0, newStop);

    this.activeGradientEditor.path = path;
    this.activeGradientEditor.stopIndex = insertIndex;

    this.profileManager.recordUserChange(path, gradientData);
    this.profileManager.updateAllSystemsFromConfig();
    this._renderGradientEditor(wrapper, path, gradientData);
  }

  _onGradientStopMouseDown(event) {
    const stop = event.target.closest(".gradient-stop");
    if (!stop) return;

    const wrapper = stop.closest(".gradient-editor-wrapper");
    const path = wrapper.dataset.path;
    const index = parseInt(stop.dataset.index, 10);

    this.activeGradientEditor.path = path;
    this.activeGradientEditor.stopIndex = index;

    this._renderGradientEditor(
      wrapper,
      path,
      this._getPathValue(this.config, path)
    );

    this.activeGradientEditor.isDragging = true;
    window.addEventListener("mousemove", this._boundGradientMouseMove);
    window.addEventListener("mouseup", this._boundGradientMouseUp, {
      once: true,
    });
  }

  _onGradientStopContextMenu(event) {
    const stop = event.target.closest(".gradient-stop");
    if (!stop) return;
    event.preventDefault();

    const wrapper = stop.closest(".gradient-editor-wrapper");
    const path = wrapper.dataset.path;
    const index = parseInt(stop.dataset.index, 10);

    const gradientData = this._getPathValue(this.config, path);

    if (!gradientData || gradientData.length <= 2) {
      ui.notifications.warn(
        "Cannot remove the start or end stops of a gradient."
      );
      return;
    }

    // Cannot remove first or last stop

    if (index > 0 && index < gradientData.length - 1) {
      gradientData.splice(index, 1);

      this.activeGradientEditor.path = null;
      this.activeGradientEditor.stopIndex = null;

      this.profileManager.recordUserChange(path, gradientData);
      this.profileManager.updateAllSystemsFromConfig();
      this._renderGradientEditor(wrapper, path, gradientData);
    }
  }

  // A single, robust click handler for all data-actions
  async _handleDelegatedClick(e) {
    this._handleFilePickerClick(e);

    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.dataset.action;
    console.log("MapShine | Delegated click detected, action:", action);

    // Stop propagation for button actions inside accordions to prevent toggling
    if (
      action === "delete-group" ||
      action === "delete-rope-group" ||
      action === "delete-point" ||
      action === "copy-accordion" ||
      action === "paste-accordion" ||
      action === "reset-accordion"
    ) {
      e.stopPropagation();
    }

    if (action === "add-list-item" || action === "remove-list-item") {
      console.log("MapShine | Routing to list manager handler");
      this._handleListManagerClick(e);
      return;
    }

    if (action === "reset-gradient") {
      this._onResetGradientClick(target);
      return;
    }

    // All other actions
    switch (action) {
      case "copy-accordion": {
        console.log("MapShine | copy-accordion case triggered");
        const effectKey = target.dataset.effectKey;
        console.log("MapShine | effectKey from dataset:", effectKey);
        if (effectKey) {
          await this._onCopyAccordion(effectKey);
        } else {
          console.warn("MapShine | No effectKey found on copy button");
        }
        break;
      }
      case "paste-accordion": {
        console.log("MapShine | paste-accordion case triggered");
        const effectKey = target.dataset.effectKey;
        console.log("MapShine | effectKey from dataset:", effectKey);
        if (effectKey) {
          await this._onPasteAccordion(effectKey);
        } else {
          console.warn("MapShine | No effectKey found on paste button");
        }
        break;
      }
      case "create-particle-effect-area": {
        const effectKey = target.dataset.effectKey;
        if (effectKey) {
          this._createParticleEffectArea(effectKey);
        }
        break;
      }
      case "create-physics-rope": {
        const ropeType = target.dataset.ropeType || "rope";
        this._createPhysicsRope(ropeType);
        break;
      }
      case "reset-rope-defaults": {
        const groupId = target.dataset.groupId;
        if (groupId) {
          const group = MapPointsManager.getGroup(groupId);
          if (!group) {
            ui.notifications.warn("Rope group not found.");
            break;
          }

          // Default values from PhysicsRope constructor
          const defaults = {
            damping: 0.95,
            windForce: 2.0,
            tapering: 0.5,
            animationSpeed: 1.0,
            indoorWindShielding: 0.9,
            endpointFade: 0.0,
            fadeStartDistance: 0.2,
            fadeEndDistance: 0.2,
          };

          // Update the group with default values
          await MapPointsManager.updateGroupProperties(groupId, defaults);
          // UI will auto-refresh via mapShine:mapPointsUpdated hook

          ui.notifications.info(`Reset "${group.label}" to default settings.`);
        }
        break;
      }
      case "delete-rope-group": {
        const groupId = target.dataset.groupId;
        if (groupId) {
          const group = MapPointsManager.getGroup(groupId);
          if (!group) {
            ui.notifications.warn("Rope group not found.");
            break;
          }
          Dialog.confirm({
            title: "Delete Rope",
            content: `<p>Are you sure you want to delete the rope "<strong>${Handlebars.escapeExpression(
              group.label
            )}</strong>"?</p>`,
            yes: async () => {
              await MapPointsManager.deleteGroup(groupId);
              // UI will auto-refresh via mapShine:mapPointsUpdated hook
            },
            defaultYes: false,
          });
        }
        break;
      }
      case "create-group-from-ui": {
        const nameInput = document.getElementById("new-group-name-input");
        const typeSelect = document.getElementById("new-group-type-select");
        if (!nameInput || !typeSelect) break;

        const groupName = nameInput.value.trim() || "New Group";
        const groupType = typeSelect.value;

        const newGroupId = await MapPointsManager.createGroup({
          label: groupName,
          type: groupType,
        });

        if (newGroupId) {
          nameInput.value = "";
          // UI will auto-refresh via mapShine:mapPointsUpdated hook
          // Open the Point Groups section after render completes
          setTimeout(() => {
            const pointGroupsDetails =
              game.mapShine.debugger?.element?.[0]?.querySelector(
                "#details-pointGroups"
              );
            if (pointGroupsDetails) {
              pointGroupsDetails.open = true;
            }
          }, 50);
          ui.notifications.info(
            `Created group "${groupName}". Click "Edit Points on Canvas" to place points.`
          );
        }
        break;
      }
      case "delete-group": {
        const groupId = target.dataset.groupId;
        if (groupId) {
          const group = MapPointsManager.getGroup(groupId);
          if (!group) {
            ui.notifications.warn("Group not found.");
            break;
          }
          Dialog.confirm({
            title: "Delete Group",
            content: `<p>Are you sure you want to delete the group "<strong>${Handlebars.escapeExpression(
              group.label
            )}</strong>"?</p>`,
            yes: async () => {
              await MapPointsManager.deleteGroup(groupId);
              // If this was the active group, deactivate placement mode
              if (game.mapShine.activeMapPointGroup === groupId) {
                game.mapShine.activeMapPointGroup = null;
                game.mapShine.mapPointsInteractionManager?.deactivate();
              }
              // UI will auto-refresh via mapShine:mapPointsUpdated hook
            },
            defaultYes: false,
          });
        }
        break;
      }
      case "delete-point": {
        const groupId = target.dataset.groupId;
        const pointIndex = parseInt(target.dataset.pointIndex, 10);
        if (groupId && !isNaN(pointIndex)) {
          await MapPointsManager.removePoint(groupId, pointIndex);
          // UI will auto-refresh via mapShine:mapPointsUpdated hook
        }
        break;
      }
      case "select-and-activate-placement": {
        const groupId = target.dataset.groupId;
        if (groupId) {
          game.mapShine.activeMapPointGroup = groupId;
          const mgr = game.mapShine.mapPointsInteractionManager;
          if (mgr && !mgr.isActive) {
            mgr.activate();
            // Update the toggle button state
            this._updatePlacementModeUI(true);
            const group = MapPointsManager.getGroup(groupId);
            ui.notifications.info(
              `Editing "${
                group?.label || "Unknown"
              }". Click on the canvas to add/move points.`
            );
          }
        }
        break;
      }
      case "toggle-placement-mode": {
        const mgr = game.mapShine.mapPointsInteractionManager;
        if (!mgr) break;

        if (mgr.isActive) {
          mgr.deactivate();
          game.mapShine.activeMapPointGroup = null;
          this._updatePlacementModeUI(false);
          ui.notifications.info("Point placement mode deactivated.");
        } else {
          if (!game.mapShine.activeMapPointGroup) {
            ui.notifications.warn(
              "Select a group first by clicking 'Edit Points on Canvas' on any group."
            );
          } else {
            mgr.activate();
            this._updatePlacementModeUI(true);
            const group = MapPointsManager.getGroup(
              game.mapShine.activeMapPointGroup
            );
            ui.notifications.info(
              `Editing "${
                group?.label || "Unknown"
              }". Click on the canvas to add/move points.`
            );
          }
        }
        break;
      }
    }

    // All other actions
    switch (action) {
      case "reset-accordion": {
        const effectKey = target.dataset.effectKey;
        if (!effectKey) return;

        let defaultsToUse = MODULE_DEFAULTS[effectKey];
        if (effectKey === "loadingScreen") {
          // Special handling for the combined accordion
          defaultsToUse = UNIVERSAL_EFFECT_DEFAULTS.sceneTransition;
        }

        if (!defaultsToUse) {
          console.warn(
            `Map Shine | Invalid effect key for reset: ${effectKey}`
          );
          return;
        }

        Dialog.confirm({
          title: `Reset ${effectKey} Settings`,
          content: `<p>Are you sure you want to reset all settings in the "<strong>${effectKey}</strong>" section to their default values? This will create unsaved changes.</p>`,
          yes: async () => {
            if (effectKey === "loadingScreen") {
              for (const key in defaultsToUse) {
                const _path = `universal.sceneTransition.${key}`;
                const settingKey = `universal.sceneTransition.${key}`;
                const defaultValue = defaultsToUse[key];
                if (Array.isArray(defaultValue)) {
                  await game.settings.set(
                    MODULE_ID,
                    settingKey,
                    defaultValue.join("\n")
                  );
                } else {
                  await game.settings.set(MODULE_ID, settingKey, defaultValue);
                }
              }
            } else {
              const defaultSection = foundry.utils.deepClone(defaultsToUse);
              await this.profileManager.recordUserChange(
                effectKey,
                defaultSection
              );
            }
            await this.profileManager.updateAllSystemsFromConfig();
            this.updateAllControls();
            ui.notifications.info(
              `"${effectKey}" section has been reset to defaults.`
            );
          },
          defaultYes: false,
        });
        break;
      }
      case "debugger-adjust-time":
        this._onDebuggerClockButtonClick(e);
        break;
      case "close":
        this._onClose();
        break;
      case "minimize":
        this._onMinimize();
        break;
      case "open-user-guide":
        this._onOpenUserGuide();
        break;
      case "reload-canvas":
        window.location.reload();
        break;
      case "save-profile":
        this._onSaveProfile();
        break;
      case "load-profile":
        this._onLoadProfile();
        break;
      case "update-profile":
        this._onUpdateProfile();
        break;
      case "delete-profile":
        this._onDeleteProfile();
        break;
      case "set-default-profile":
        this._onSetDefaultProfile();
        break;
      case "copy-settings":
        this._onCopySettings(target);
        break;
      case "paste-settings":
        this._onPasteSettings(target);
        break;
      case "revert-scene":
        this.profileManager.revertToSceneDefault();
        break;
      case "save-scene":
        this.profileManager.updateActiveSceneProfile();
        break;
      case "apply-color-preset":
        this._onApplyColorPreset();
        break;
      case "save-color-favorite":
        this._onSaveColorFavorite();
        break;
      case "switch-to-simple-mode":
        this._onSwitchToSimpleMode();
        break;
      case "save-scene-profile":
        this._onSaveSceneProfileClick();
        break;
      case "rename-scene-profile":
        this._onRenameSceneProfileClick();
        break;
      case "delete-scene-profile":
        this._onDeleteSceneProfileClick();
        break;
      case "create-scene-profiles":
        this._onCreateSceneProfilesClick();
        break;
      case "preview-transition":
        this._onPreviewTransitionClick(e);
        break;
      case "preview-profile":
        this._onPreviewClick(e);
        break;
      case "activate-profile":
        this._onActivateClick();
        break;
      case "import-world-profile":
        this._onImportWorldProfile();
        break;
      case "update-active-appearance":
        this.profileManager.updateActiveSceneProfile();
        break;
      case "revert-changes":
        this.profileManager.revertToSceneDefault();
        break;
      case "new-clean-profile":
        this._onNewCleanProfileClick();
        break;
      case "apply-rain-preset": {
        const preset = target.dataset.preset;
        if (preset) {
          this._onApplyRainPreset(preset);
        }
        break;
      }
      case "apply-tint-preset": {
        const tint = target.dataset.tint;
        if (tint) {
          this._onApplyTintPreset(tint);
        }
        break;
      }
      case "apply-quality-preset": {
        const quality = target.dataset.quality;
        if (quality) {
          this._onApplyQualityPreset(quality);
        }
        break;
      }
    }
  }

  _onDebuggerClockMouseDown(event) {
    this._isDebuggerClockDragging = true;
    this._onDebuggerClockDrag(event); // Handle the initial click
    window.addEventListener("mousemove", this._onDebuggerClockDragBound);
    window.addEventListener("mouseup", this._onDebuggerClockDragEndBound, {
      once: true,
    });
  }

  _onDebuggerClockDrag(event) {
    if (!this._isDebuggerClockDragging) return;
    const clockContainer = this.element.querySelector(
      "#debugger-clock-container"
    );
    const rect = clockContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;
    let angleRad = Math.atan2(deltaY, deltaX) + Math.PI / 2;
    if (angleRad < 0) angleRad += 2 * Math.PI;
    const angleDeg = angleRad * (180 / Math.PI);
    const newTime = MapShineClock._getTimeForAngle(angleDeg);
    this._updateDebuggerTime(newTime);
  }

  _onDebuggerClockDragEnd(_event) {
    this._isDebuggerClockDragging = false;
    window.removeEventListener("mousemove", this._onDebuggerClockDragBound);
    // The "mouseup" listener is {once: true}, so it removes itself automatically.
  }

  _onDebuggerClockButtonClick(event) {
    const button = event.target.closest("button");
    const amount = parseFloat(button.dataset.amount);
    const currentTime = game.mapShine.dayNightClock?.currentTime ?? 12.0;
    this._updateDebuggerTime(currentTime + amount);
  }

  _onDebuggerTimeInputChange(event) {
    const inputVal = event.currentTarget.value;
    const parts = inputVal.split(":");
    if (parts.length === 2) {
      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      if (!isNaN(hour) && !isNaN(minute)) {
        this._updateDebuggerTime(hour + minute / 60);
      }
    }
  }

  async _updateDebuggerTime(newTime) {
    const currentTime = (newTime + 24) % 24;
    game.mapShine.updateTimeOfDay(currentTime);
  }

  _updateFontSelectorStyle(selectElement) {
    if (!selectElement) return;
    const fontName = selectElement.value;
    if (FONT_CHOICES[fontName]) {
      selectElement.style.fontFamily = fontName;
    } else {
      selectElement.style.fontFamily = ""; // Revert to default if font is invalid
    }
  }

  updateAllControls(time) {
    return this._wrapWithTiming('updateAllControls', () => {
      if (!this.element || !this.uiBuilder) return;

      const clockTime =
        time ?? this.profileManager.activeConfig.timeOfDay.currentTime ?? 12.0;

      this.element.querySelectorAll("[data-path]").forEach((el) => {
        if (el.closest(".list-manager-container")) return;
        if (el.closest(".gradient-editor-wrapper")) return; // Don't auto-update gradient controls
        const path = el.dataset.path;

        const isGameSetting =
        path.startsWith("universal.") || path.startsWith("loading-screen-");
      const isRopeInstance = path.startsWith("rope-instance.");
      const isGroupProperty = path.startsWith("group.");
      let value;

      if (isGameSetting) {
        value = game.settings.get(MODULE_ID, path);
      } else if (isRopeInstance) {
        // Handle rope instance properties from MapPointsManager
        const parts = path.split(".");
        const ropeId = parts[1];
        const property = parts[2];
        const allGroups = MapPointsManager.getGroups();
        const ropeGroup = allGroups[ropeId];
        if (ropeGroup) {
          value = ropeGroup[property];
        }
      } else if (isGroupProperty) {
        // Handle group properties from MapPointsManager (e.g., "group.{id}.emission.intensity")
        const parts = path.split(".");
        const groupId = parts[1];
        const property = parts.slice(2).join("."); // Support nested properties
        const group = MapPointsManager.getGroup(groupId);
        if (group) {
          value = this._getPathValue(group, property);
        }
      } else {
        value = this._getPathValue(this.config, path);
      }

      if (value === undefined || value === null) return;

      if (el.type === "checkbox") el.checked = Boolean(value);
      else if (el.type === "radio") el.checked = el.value === String(value);
      else el.value = value;

      if (el.id === "control-sceneAppearance-transitionDuration") {
        const seconds = Math.round(Number(value) / 1000);
        this._updateSliderValue(el.id, `${seconds}s`);
      } else if (el.type === "range") {
        this._updateSliderValue(el.id, value, el.step);
      }

      if (el.closest(".summary-control")) {
        const detailsElement = el.closest("details");
        if (detailsElement)
          detailsElement.classList.toggle("disabled-effect", !el.checked);
      }
    });

    console.log("MapShine | Updating list managers...");
    this.element
      .querySelectorAll(".list-manager-container")
      .forEach((container) => {
        const path = container.dataset.path;
        console.log("MapShine | Found list manager for path:", path);
        this._renderListManagerItems(path);
      });

    // Update tile visibility checkboxes (read from scene flags)
    this.element
      .querySelectorAll(".tile-visibility-container")
      .forEach((container) => {
        // Read from scene flags instead of profile config
        const tileVisibility = canvas.scene?.getFlag(MODULE_ID, 'cloudTopsTileVisibility') || {};
        console.log('MapShine | Loading tile visibility from scene flags:', tileVisibility);
        
        container.querySelectorAll('input[type="checkbox"][data-tile-path]').forEach((checkbox) => {
          const tilePath = checkbox.dataset.tilePath;
          // CRITICAL: Escape dots to match the escaped keys we saved
          const escapedPath = tilePath.replace(/\./g, '::');
          // Default to checked (visible) if not explicitly set to false
          const isChecked = tileVisibility[escapedPath] !== false;
          checkbox.checked = isChecked;
          console.log('MapShine | Setting checkbox for', escapedPath, 'to', isChecked);
        });
      });

    // Update read-only display fields
    this.element.querySelectorAll("[data-readonly-path]").forEach((el) => {
      const path = el.dataset.readonlyPath;
      const isGameSetting =
        path.startsWith("universal.") || path.startsWith("loading-screen-");
      let value;

      if (isGameSetting) {
        value = game.settings.get(MODULE_ID, path);
      } else {
        value = this._getPathValue(this.config, path);
      }

      if (value === undefined || value === null) {
        el.textContent = "-";
        return;
      }

      // Format the value for display
      if (typeof value === "boolean") {
        el.textContent = value ? "Yes" : "No";
      } else if (typeof value === "number") {
        // Format numbers with appropriate precision
        el.textContent = Number.isInteger(value)
          ? value.toString()
          : value.toFixed(2);
      } else {
        el.textContent = String(value);
      }
    });

    this._updateRandomHintVisibility();
    this._updatePauseHintVisibility();
    this._updateInitialRandomBackgroundVisibility();
    this._updateBackgroundOverlayVisibility();
    this._updateLutControlVisibility();
    this._updateCurveEditorView();
    this._initializeGradientEditors();

    // Ensure font selectors are styled correctly on load/update.
    this.element
      .querySelectorAll(".font-selector-dropdown")
      .forEach((el) => this._updateFontSelectorStyle(el));

    const timeSlider = this.element.querySelector(
      "#control-timeControl-globalTime"
    );
    if (timeSlider) {
      const timeValue = (game.mapShine.timeControl.timeFactor ?? 1.0) * 100;
      timeSlider.value = timeValue;
      this._updateSliderValue(timeSlider.id, timeValue, timeSlider.step);
    }

    const angle = MapShineClock._getAngleForTime(clockTime);
    const formattedTime = MapShineClock._formatTime(clockTime);
    const isNight = clockTime < 6 || clockTime >= 18;
    const iconSrc = isNight
      ? "modules/map-shine/assets/moon.webp"
      : "modules/map-shine/assets/sun.webp";

    const gradient = MapShineClock._getClockGradientForTime(clockTime);
    const clockFace = this.element.querySelector(
      "#debugger-clock-container .clock-face"
    );
    if (clockFace) {
      clockFace.style.setProperty("--clock-gradient", gradient);
    }

    this.element
      .querySelector("#debugger-clock-hand")
      ?.setAttribute("style", `transform: rotate(${angle}deg)`);
    const timeInput = this.element.querySelector("#debugger-time-input");
    if (timeInput) timeInput.value = formattedTime;
    this.element
      .querySelector("#debugger-clock-icon")
      ?.setAttribute("src", iconSrc);

    // Manage button states
    const isDirty = this.profileManager.status.isDirty;
    const isGm = this.profileManager.isGm;
    const updateBtn = this.element.querySelector(
      "#update-active-appearance-btn"
    );
    if (updateBtn) {
      updateBtn.disabled = !isDirty || !isGm;
    }
    const revertBtn = this.element.querySelector("#revert-changes-btn");
    if (revertBtn) {
      revertBtn.disabled = !isDirty;
    }

    this._updateActionButtonsState();
    });
  }

  _populateSceneProfileDropdown() {
    const dropdown = this.element.querySelector("#scene-profile-select");
    if (!dropdown) return;
    const profiles = this.profileManager.getSceneProfiles();
    const activeId = this.profileManager.getActiveProfileId();

    dropdown.innerHTML = "";
    if (profiles.length > 0) {
      profiles.forEach((p) => {
        const label = p.id === activeId ? `(Active) ${p.name}` : p.name;
        const option = new Option(label, p.id);
        if (p.id === activeId) {
          // Add a class for potential future styling and to mark it clearly
          option.classList.add("active-profile-option");
        }
        dropdown.add(option);
      });
      dropdown.value = activeId;
      dropdown.disabled = false;
    } else {
      dropdown.add(new Option("No scene profiles", "-1"));
      dropdown.disabled = true;
    }
  }

  async _onPreviewClick(event) {
    const _btn = event.currentTarget;
    const transitionManager = game.mapShine.transitionManager;

    if (transitionManager.status === "previewing") {
      await this.profileManager.endPreview();
    } else {
      const dropdown = this.element.querySelector("#scene-profile-select");
      if (dropdown && dropdown.value !== "-1") {
        await this.profileManager.previewProfile(dropdown.value);
      }
    }
  }

  async _onPreviewTransitionClick(event) {
    const btn = event.currentTarget;
    const mgr = game.mapShine?.sceneChangeManager;
    if (!mgr) {
      ui.notifications?.warn?.("Map Shine: SceneChangeManager not ready.");
      return;
    }

    // Debug: Check if methods exist
    if (typeof mgr.showPreviewOverlay !== "function") {
      console.error(
        "MapShine | SceneChangeManager missing showPreviewOverlay method. Available methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(mgr))
      );
      ui.notifications?.error?.(
        "Map Shine: Preview feature not available. Please reload Foundry (Ctrl+F5 to clear cache)."
      );
      return;
    }

    try {
      if (mgr.previewActive) {
        // Hide preview overlay without applying settings changes.
        await mgr.hidePreviewOverlay({ apply: false });
        // Button text updates automatically via render()
      } else {
        // Show non-destructive preview overlay.
        mgr.showPreviewOverlay();
        // Update UI to reflect new state
        if (game.mapShine?.debugger) {
          game.mapShine.debugger.render();
        }
      }
    } catch (err) {
      console.error("MapShine | Preview Transition toggle failed:", err);
      ui.notifications?.error?.(
        "Map Shine: Failed to toggle transition preview. See console for details."
      );
    }
  }

  async _onActivateClick() {
    const dropdown = this.element.querySelector("#scene-profile-select");
    if (dropdown && dropdown.value !== "-1") {
      await this.profileManager.activateSceneProfile(dropdown.value);
    }
  }

  updateTransitionStatus(status, message) {
    if (!this.element) return;
    const light = this.element.querySelector("#transition-status-light");
    const text = this.element.querySelector("#transition-status-text");
    const previewBtn = this.element.querySelector("#preview-profile-btn");
    const activateBtn = this.element.querySelector("#activate-profile-btn");
    const durationSlider = this.element.querySelector(
      "#scene-transition-duration"
    );

    if (!light || !text || !previewBtn || !activateBtn || !durationSlider)
      return;

    light.className = "fx-status-light";
    text.textContent = message;

    switch (status) {
      case "transitioning":
        light.classList.add("blue");
        previewBtn.disabled = true;
        activateBtn.disabled = true;
        durationSlider.disabled = true;
        previewBtn.innerHTML = `<i class="fas fa-eye"></i> Preview`;
        break;
      case "previewing":
        light.classList.add("blue");
        previewBtn.disabled = false;
        activateBtn.disabled = true;
        durationSlider.disabled = false;
        previewBtn.innerHTML = `<i class="fas fa-eye-slash"></i> End Preview`;
        break;
      case "idle":
      default:
        light.classList.add("grey");
        previewBtn.disabled = false;
        activateBtn.disabled = !game.user.isGM;
        durationSlider.disabled = false;
        previewBtn.innerHTML = `<i class="fas fa-eye"></i> Preview`;
        break;
    }
  }

  _initializeCurveEditor() {
    const curveEditorContainer = this.element.querySelector(
      "#curve-editor-container"
    );
    if (curveEditorContainer) {
      this.curveEditor = new CurveEditor(curveEditorContainer, {
        onChange: this._onCurveChange.bind(this),
      });

      const channelSelector = this.element.querySelector(
        "#curve-channel-selector"
      );
      if (channelSelector) {
        channelSelector.addEventListener(
          "change",
          this._onCurveChannelChange.bind(this)
        );
      }

      this._updateCurveEditorView();
    }
  }

  _populateDiagnosticDropdown() {
    const dropdown = this.element.querySelector(
      "#control-diagnostic-displaySuffix"
    );
    if (!dropdown) return;

    const textures = {
      inputs: {
        all: "All Suffixes",
      },
      intermediates: {},
      generated: {},
      external: {},
    };

    // Input Suffixes
    for (const key of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
      textures.inputs[key] = key;
    }

    // Generated Geometry Masks
    if (game.mapShine.geometryMaskManager) {
      for (const [key, name] of Object.entries(EFFECT_SOURCE_OPTIONS)) {
        if (key) {
          const prefixedKey = `generated_${key}`;
          textures.generated[prefixedKey] = `${name} (Geometry)`;
        }
      }
    }

    // Add the unified light mask.
    if (game.mapShine.lightMaskManager) {
      textures.generated["generated_lightMask"] = "Light Mask";
    }

    // Intermediate Textures
    const layerChecks = {
      metallicShinePattern: {
        class: MetallicShineLayer,
        method: "getPatternTexture",
        name: "Metallic Shine Pattern",
      },
      waterDisplacement: {
        class: WaterFXLayer,
        property: "displacementTexture",
        name: "Water Displacement",
      },
      heatNoise: {
        class: HeatDistortionLayer,
        property: "noiseTexture",
        name: "Heat Distortion Noise",
      },
      iridescenceNoise: {
        class: IridescenceLayer,
        property: "distortionNoiseManager",
        name: "Iridescence Noise",
      },
      prismNoise: {
        class: PrismLayer,
        property: "distortionNoiseManager",
        name: "Prism Distortion Noise",
      },
    };

    for (const [key, check] of Object.entries(layerChecks)) {
      const cls = check.class;
      if (typeof cls !== "function") continue;
      const layer = canvas.layers.find((l) => l instanceof cls);
      if (layer) {
        const intermediateKey = `intermediate_${key}`;
        if (
          check.method &&
          typeof layer[check.method] === "function" &&
          layer[check.method]()
        ) {
          textures.intermediates[intermediateKey] = check.name;
        } else if (check.property) {
          const prop = foundry.utils.getProperty(layer, check.property);
          if (
            prop &&
            (prop instanceof PIXI.RenderTexture ||
              typeof prop.getTexture === "function")
          ) {
            textures.intermediates[intermediateKey] = check.name;
          }
        }
      }
    }

    // Add external/core layers that the DiagnosticLayer can handle.

    if (game.modules.get("illuminationbuffer")?.api?.getLightingTexture) {
      textures.external["external_illumination"] =
        "External: Illumination Buffer";
    }

    if (canvas.effects?.illumination?.texture) {
      textures.external["external_lightingLayer"] = "Core: Illumination Layer";
    }

    const available = textures;
    const currentValue = dropdown.value;

    const createOptGroup = (label, options) => {
      const group = document.createElement("optgroup");
      group.label = label;
      for (const [value, text] of Object.entries(options)) {
        const option = new Option(text, value);
        group.appendChild(option);
      }
      return group;
    };

    dropdown.innerHTML = "";

    if (!foundry.utils.isEmpty(available.generated)) {
      dropdown.appendChild(
        createOptGroup("Generated Masks", available.generated)
      );
    }

    dropdown.appendChild(createOptGroup("Input Masks", available.inputs));

    if (!foundry.utils.isEmpty(available.intermediates)) {
      dropdown.appendChild(
        createOptGroup("Intermediate Textures", available.intermediates)
      );
    }
    if (!foundry.utils.isEmpty(available.external)) {
      dropdown.appendChild(
        createOptGroup("External Buffers & Core Layers", available.external)
      );
    }

    dropdown.value = currentValue;
  }

  async _populateLutDropdown() {
    const dropdown = this.element.querySelector(
      "#control-postProcessing-lut-presetName"
    );
    if (!dropdown) return;

    const combinedPresets = foundry.utils.deepClone(LUT_PRESETS);

    try {
      const source = game.settings.get("core", "noCanvas") ? "public" : "data";
      const lutDir = "modules/map-shine/assets/luts/";
      const dirContents = await FilePicker.browse(source, lutDir);

      for (const filePath of dirContents.files) {
        if (filePath.toLowerCase().endsWith(".cube")) {
          const filename = filePath.substring(filePath.lastIndexOf("/") + 1);
          const friendlyName = filename
            .replace(/\.cube$/i, "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

          const presetKey = `cube_${filename.replace(/[^a-zA-Z0-9]/g, "_")}`;

          combinedPresets[presetKey] = {
            name: `${friendlyName} (.cube)`,
            path: filePath,
          };
        }
      }
    } catch (e) {
      console.warn(
        "Map Shine | Could not browse for .cube LUT files. Only showing default presets.",
        e
      );
    }

    this.allLutPresets = combinedPresets;

    const currentValue = dropdown.value;

    dropdown.innerHTML = "";

    for (const [key, data] of Object.entries(this.allLutPresets)) {
      const option = new Option(data.name, key);
      dropdown.add(option);
    }

    if (this.allLutPresets[currentValue]) {
      dropdown.value = currentValue;
    }
  }

  _handleFilePickerClick(e) {
    const button = e.target.closest(".file-picker-btn");
    if (!button) return;

    e.preventDefault();

    const targetId = button.dataset.fpTarget;
    const type = button.dataset.fpType || "any";
    const targetInput = this.element.querySelector(`#${targetId}`);

    if (!targetInput) {
      console.warn(
        `Map Shine | FilePicker button could not find its target input: #${targetId}`
      );
      return;
    }

    new FilePicker({
      type: type,
      current: targetInput.value,
      callback: (path) => {
        targetInput.value = path;
        targetInput.dispatchEvent(
          new Event("change", {
            bubbles: true,
          })
        );
      },
    }).browse(targetInput.value);
  }

  async _handleListManagerClick(event) {
    console.log("MapShine | List manager click detected", event);
    const button = event.target.closest("button[data-action]");
    if (!button) {
      console.error("MapShine | No button found with data-action");
      return;
    }

    const action = button.dataset.action;
    console.log("MapShine | Action:", action);

    const container = button.closest(".list-manager-container");
    if (!container) {
      console.error("MapShine | No list-manager-container found");
      return;
    }

    const path = container.dataset.path;
    if (!path) {
      console.error("MapShine | No path found on container");
      return;
    }

    console.log("MapShine | Path:", path);

    const currentString = game.settings.get(MODULE_ID, path) || "";
    let list = currentString ? currentString.split(/\r?\n/) : [];

    console.log("MapShine | Current list:", list);

    if (action === "add-list-item") {
      list.push(""); // Add a new empty item to be filled
      console.log("MapShine | Added empty item, new list:", list);
    } else if (action === "remove-list-item") {
      const index = parseInt(button.dataset.index, 10);
      if (!isNaN(index)) {
        list.splice(index, 1);
        console.log(
          "MapShine | Removed item at index",
          index,
          "new list:",
          list
        );
      }
    }

    await game.settings.set(MODULE_ID, path, list.join("\n"));
    console.log("MapShine | Settings updated, re-rendering list");
    this._renderListManagerItems(path); // Re-render the list in the UI
  }

  async _handleListManagerInputChange(input) {
    const container = input.closest(".list-manager-container");
    if (!container) return;

    const path = container.dataset.path;
    if (!path) return;

    const itemInputs = container.querySelectorAll(
      '.list-item-row input[type="text"]'
    );
    const newList = Array.from(itemInputs).map((el) => el.value);
    const finalValue = newList.join("\n");

    // We can just call game.settings.set directly like the click handler,
    // since these are all game settings.
    await game.settings.set(MODULE_ID, path, finalValue);
    // No need to call _performSystemUpdate which does a lot more than necessary here.
    // We do need to refresh the canvas state though.
    await this.profileManager.initializeForScene();
    await this.profileManager.updateAllSystemsFromConfig();
  }

  _renderListManagerItems(path) {
    const container = this.element.querySelector(`[data-path="${path}"]`);
    if (!container) return;
    const listContainer = container.querySelector(".list-items-container");
    const itemType = container.dataset.itemType;
    if (!listContainer) return;

    let valueString = game.settings.get(MODULE_ID, path);

    // If no value is set or it's empty, fall back to the registered default
    if (!valueString || valueString.trim() === "") {
      const setting = game.settings.settings.get(`${MODULE_ID}.${path}`);
      if (setting && setting.default) {
        valueString = setting.default;
        console.log(`MapShine | Using default value for ${path}:`, valueString);
      }
    }

    let items = valueString ? valueString.split(/\r?\n/) : [];
    if (items.length === 1 && items[0] === "") {
      items.length = 0;
    }

    console.log(
      `MapShine | Rendering ${items.length} items for ${path}:`,
      items
    );

    listContainer.innerHTML = items
      .map((item, index) => {
        const inputId = `${DebuggerUIBuilder._createSafeId(
          path
        )}-item-${index}`;
        const filePickerButton =
          itemType === "image"
            ? `<button type="button" class="file-picker-btn" data-fp-target="${inputId}" data-fp-type="image" title="Browse Files"><i class="fas fa-file-import"></i></button>`
            : "";

        return `
            <div class="list-item-row">
                <input type="text" id="${inputId}" data-index="${index}" value="${Handlebars.escapeExpression(
          item
        )}">
                ${filePickerButton}
                <button type="button" class="remove-item-btn" data-action="remove-list-item" data-index="${index}" title="Remove Item">X</button>
            </div>
          `;
      })
      .join("");
  }

  async _handleGenericInput(e) {
    // Debug logging for rope texture changes
    if (
      e.target.dataset.path?.includes("physicsRope") &&
      e.target.dataset.path?.includes("texturePath")
    ) {
      console.log("MapShine | Rope texture input detected:", {
        eventType: e.type,
        path: e.target.dataset.path,
        value: e.target.value,
        targetId: e.target.id,
      });
    }

    // New logic for number inputs linked to sliders
    if (e.target.type === "number" && e.target.dataset.sliderId) {
      const sliderId = e.target.dataset.sliderId;
      const slider = this.element.querySelector(`#${sliderId}`);
      if (slider) {
        let value = Number(e.target.value);

        // Clamp value to min/max of slider to prevent invalid input
        const min = Number(slider.min);
        const max = Number(slider.max);
        const step = Number(slider.step);

        if (value < min) value = min;
        if (value > max) value = max;

        // Also snap to the nearest step on the 'change' event (e.g., blur or enter)
        if (e.type === "change") {
          value = Math.round(value / step) * step;
        }

        // Only update the input field's text if the clamped/snapped value is different
        // This prevents the cursor from jumping while typing. We reformat on 'change'.
        if (Number(e.target.value) !== value && e.type === "change") {
          const stepString = slider.step;
          const decimals = stepString.includes(".")
            ? stepString.split(".")[1].length
            : 0;
          e.target.value = value.toFixed(decimals);
        }

        slider.value = value;
        // Dispatch the same event type on the slider to trigger its existing handling logic
        const eventType = e.type === "input" ? "input" : "change";
        slider.dispatchEvent(new Event(eventType, { bubbles: true }));
      }
      return; // We've handled this, don't process further.
    }

    const target = e.target;

    if (target.closest(".gradient-editor-wrapper")) {
      const wrapper = target.closest(".gradient-editor-wrapper");
      const path = wrapper.dataset.path;
      const { stopIndex } = this.activeGradientEditor;
      const editorType = wrapper.dataset.editorType || "color";

      if (path === null || stopIndex === null) return;

      // It's safer to get a fresh reference to the data
      const gradientData = this._getPathValue(this.config, path);
      if (!gradientData || !gradientData[stopIndex]) return;

      if (target.id.endsWith("-alpha-slider")) {
        gradientData[stopIndex].alpha = parseFloat(target.value);
      } else if (
        editorType === "brightness" &&
        target.id.endsWith("-brightness-slider")
      ) {
        const brightness = parseFloat(target.value);
        const intVal = Math.round(brightness * 255);
        const hexVal = intVal.toString(16).padStart(2, "0");
        gradientData[stopIndex].color = `#${hexVal}${hexVal}${hexVal}`;
      } else if (
        editorType === "color" &&
        target.id.endsWith("-color-picker")
      ) {
        gradientData[stopIndex].color = target.value;
      }

      this._renderGradientEditor(wrapper, path, gradientData);

      if (e.type === "input") {
        this.debouncedSystemUpdate(path, gradientData);
      } else {
        // 'change' event
        this._performSystemUpdate(path, gradientData);
      }

      return;
    }

    // First, handle the special case of list managers
    if (target.closest(".list-manager-container")) {
      // We only want to save on 'change' to avoid saving on every keystroke,
      // which can be laggy. 'change' fires on blur or when a file picker closes.
      if (e.type === "change") {
        await this._handleListManagerInputChange(target);
      }
      return; // Stop further processing for list items
    }

    // Handle tile visibility checkboxes (stored in scene flags, not profile)
    if (target.closest(".tile-visibility-container")) {
      const tilePath = target.dataset.tilePath;
      
      if (tilePath) {
        // Get current visibility settings from scene flags
        const currentVisibility = canvas.scene?.getFlag(MODULE_ID, 'cloudTopsTileVisibility') || {};
        
        // CRITICAL: Escape dots in tile path to prevent Foundry from creating nested objects
        // Foundry's setFlag treats dots as property separators, so "path.webp" becomes nested
        const escapedPath = tilePath.replace(/\./g, '::');
        currentVisibility[escapedPath] = target.checked;
        
        console.log('MapShine | Saving tile visibility:', escapedPath, '=', target.checked);
        console.log('MapShine | Full visibility object:', currentVisibility);
        
        // Save directly to scene flags (scene-specific, not part of profile)
        await canvas.scene.setFlag(MODULE_ID, 'cloudTopsTileVisibility', currentVisibility);
        
        // Trigger mask update on CloudDepthLayer
        if (game.mapShine.cloudDepthLayer) {
          game.mapShine.cloudDepthLayer._needsMaskUpdate = true;
          console.log('MapShine | Triggered mask update on CloudDepthLayer');
        }
        return;
      }
    }

    // Now, handle all other standard controls
    const path = target.dataset.path;
    if (!path) return;

    // Instant UI feedback for font selectors
    if (
      target.tagName === "SELECT" &&
      target.classList.contains("font-selector-dropdown")
    ) {
      this._updateFontSelectorStyle(target);
    }

    // Instant UI feedback for the font previewer
    if (path === "fontManager.previewFont") {
      const previewText = this.element.querySelector("#font-preview-text");
      if (previewText) {
        const fontName = target.value;
        // Load the selected font on demand for the preview.
        FontLoader.load([fontName]);
        previewText.style.fontFamily = fontName;
      }
      return; // This is a UI-only control, no need to save or refresh systems
    }

    const isSlider = target.type === "range";
    let value =
      target.type === "checkbox"
        ? target.checked
        : isSlider
        ? Number(target.value)
        : target.value;

    if (target.type === "radio") {
      if (!target.checked) return;
    }

    let processedValue = value;
    if (target.tagName === "SELECT" && !isNaN(Number(value))) {
      processedValue = Number(value);
    }

    if (isSlider && e.type === "input") {
      if (target.id === "control-sceneAppearance-transitionDuration") {
        this._updateSliderValue(target.id, `${Math.round(value / 1000)}s`);
      } else {
        this._updateSliderValue(target.id, value, target.step);
      }
      this.debouncedSystemUpdate(path, processedValue);
    } else {
      await this._performSystemUpdate(path, processedValue);

      if (isSlider) {
        this._updateSliderValue(target.id, value, target.step);
      }
      if (target.type === "checkbox" && target.closest(".summary-control")) {
        const detailsElement = target.closest("details");
        if (detailsElement)
          detailsElement.classList.toggle("disabled-effect", !target.checked);
      }

      if (path === "universal.sceneTransition.useRandomHint")
        this._updateRandomHintVisibility();
      if (path === "universal.pauseEffect.useRandomHint")
        this._updatePauseHintVisibility();
      if (path === "loading-screen-use-random-background")
        this._updateInitialRandomBackgroundVisibility();
      if (path === "loading-screen-background-overlay-enabled") {
        this._updateBackgroundOverlayVisibility();
      }
      if (path === "tileOpacity")
        game.mapShine.effectTargetManager.applyTileOpacities();

      // Load font when font settings change
      if (
        path.startsWith("universal.fontManager.styles.") &&
        path.endsWith(".fontFamily")
      ) {
        FontLoader.load([processedValue]);
      }
    }
  }

  _updatePauseHintVisibility() {
    const useRandom = game.settings.get(
      MODULE_ID,
      "universal.pauseEffect.useRandomHint"
    );
    const wrapper = this.element.querySelector(
      "#pauseEffect-randomHints-wrapper"
    );
    if (wrapper) {
      wrapper.style.display = useRandom ? "block" : "none";
    }
  }

  _updateRandomHintVisibility() {
    const useRandom = game.settings.get(
      MODULE_ID,
      "universal.sceneTransition.useRandomHint"
    );
    const wrapper = this.element.querySelector(
      "#sceneTransition-randomHints-wrapper"
    );
    if (wrapper) {
      wrapper.style.display = useRandom ? "block" : "none";
    }
  }

  _updateInitialRandomBackgroundVisibility() {
    const useRandom = game.settings.get(
      MODULE_ID,
      "loading-screen-use-random-background"
    );
    const wrapper = this.element.querySelector(
      "#loading-screen-random-backgrounds-wrapper"
    );
    if (wrapper) {
      wrapper.style.display = useRandom ? "block" : "none";
    }
  }

  _updateBackgroundOverlayVisibility() {
    const isEnabled = game.settings.get(
      MODULE_ID,
      "loading-screen-background-overlay-enabled"
    );
    const details = this.element.querySelector(
      "#details-initial-loading-bgOverlay"
    );
    if (details) {
      const sliderContainer = details.querySelector("div");
      if (sliderContainer) {
        sliderContainer.style.display = isEnabled ? "block" : "none";
      }
    }
  }

  _updateLutControlVisibility() {
    const preset = this.config.postProcessing.lut.presetName;
    const customPathWrapper = this.element.querySelector(
      "#lut-custom-path-wrapper"
    );
    if (customPathWrapper) {
      customPathWrapper.style.display = preset === "custom" ? "block" : "none";
    }
  }

  _updatePlacementModeUI(isActive) {
    const toggleBtn = this.element.querySelector("#placement-mode-toggle-btn");
    const label = this.element.querySelector("#placement-mode-label");

    if (toggleBtn) {
      if (isActive) {
        toggleBtn.style.background = "#c44";
        toggleBtn.style.borderColor = "#c44";
      } else {
        toggleBtn.style.background = "#4a9eff";
        toggleBtn.style.borderColor = "#4a9eff";
      }
    }

    if (label) {
      label.textContent = isActive
        ? "Deactivate Point Placement Mode"
        : "Activate Point Placement Mode";
    }
  }

  setEffectAvailability(effectKey, isAvailable) {
    if (!this.element) return;
    const detailsElement = this.element.querySelector(`#details-${effectKey}`);
    if (!detailsElement) return;

    const checkboxId = DebuggerUIBuilder._createSafeId(`${effectKey}.enabled`);
    const checkboxElement = this.element.querySelector(`#${checkboxId}`);

    if (isAvailable) {
      detailsElement.classList.remove("effect-unavailable");
      if (checkboxElement) checkboxElement.disabled = false;
    } else {
      detailsElement.classList.add("effect-unavailable");
      if (checkboxElement) {
        checkboxElement.disabled = true;
        checkboxElement.checked = false;
      }
    }
  }

  _onClose() {
    game.mapShine.debugger?.destroy();
  }

  _onMinimize() {
    const debuggerInstance = game.mapShine.debugger;
    if (!debuggerInstance) return;

    const isMinimized = this.element.classList.toggle("minimized");

    if (isMinimized) {
      // Store current size before minimizing
      debuggerInstance.preMinimizeSize = {
        width: this.element.style.width,
        height: this.element.style.height,
      };
      // Remove inline styles to allow CSS to take over
      this.element.style.width = "";
      this.element.style.height = "";
    } else {
      // Restore size if it was stored
      if (debuggerInstance.preMinimizeSize) {
        this.element.style.width = debuggerInstance.preMinimizeSize.width;
        this.element.style.height = debuggerInstance.preMinimizeSize.height;
      } else {
        // Fallback if no size was stored (e.g., if minimized on first load)
        const defaultWidth = 1000;
        const defaultHeight = 1150;
        this.element.style.width = `${defaultWidth}px`;
        const calculatedHeight = Math.min(
          defaultHeight,
          window.innerHeight - 120
        );
        this.element.style.height = `${calculatedHeight}px`;
      }
    }
  }

  _getPathValue(obj, path) {
    return foundry.utils.getProperty(obj, path);
  }

  _onOpenUserGuide() {
    game.mapShine.showUserGuide();
  }

  applyProfileUIState(profileData) {
    if (!profileData?.ui?.details) return;
    for (const [id, isOpen] of Object.entries(profileData.ui.details)) {
      const detailElement = this.element.querySelector(`#${id}`);
      if (detailElement) detailElement.open = isOpen;
    }
  }

  _updateSliderValue(elementId, value, step) {
    const valueEl = this.element.querySelector(`#${elementId}-value`);
    if (valueEl) {
      if (typeof value === "string") {
        valueEl.value = value;
        return;
      }
      const stepString = String(step);
      const decimals = stepString.includes(".")
        ? stepString.split(".")[1].length
        : 0;
      valueEl.value = Number(value).toFixed(decimals);
    }
  }

  _populateProfilesDropdown() {
    const dropdown = this.element.querySelector("#profiles-dropdown");
    if (!dropdown) return;
    const profiles = this.profileManager.getWorldProfiles();
    const names = Object.keys(profiles).sort();
    const defaultProfileName = this.profileManager.getWorldDefaultProfileName();

    dropdown.innerHTML = "";
    if (names.length) {
      names.forEach((n) => {
        const isDefault = n === defaultProfileName ? " (Default)" : "";
        dropdown.add(new Option(`${n}${isDefault}`, n));
      });
      dropdown.value = defaultProfileName || names[0];
      dropdown.disabled = false;
    } else {
      dropdown.add(new Option("No profiles saved", ""));
      dropdown.disabled = true;
    }
  }

  async _onSaveProfile() {
    const nameInput = this.element.querySelector("#profile-name");
    if (!nameInput) return;
    const name = nameInput.value.trim();
    const uiState = {
      details: {},
    };
    this.element.querySelectorAll("details[id]").forEach((el) => {
      uiState.details[el.id] = el.open;
    });
    const success = await this.profileManager.saveAsWorldProfile(name, uiState);
    if (success) {
      nameInput.value = "";
      this._populateProfilesDropdown();
    }
  }

  async _onUpdateProfile() {
    const dropdown = this.element.querySelector("#profiles-dropdown");
    if (!dropdown) return;
    const name = dropdown.value;
    const uiState = {
      details: {},
    };
    this.element.querySelectorAll("details[id]").forEach((el) => {
      uiState.details[el.id] = el.open;
    });
    const success = await this.profileManager.saveAsWorldProfile(name, uiState);
    if (success) {
      this._populateProfilesDropdown();
    }
  }

  async _onLoadProfile() {
    const dropdown = this.element.querySelector("#profiles-dropdown");
    if (!dropdown) return;
    const name = dropdown.value;
    if (name) await this.profileManager.applyWorldProfileAsOverrides(name);
  }

  async _onDeleteProfile() {
    const dropdown = this.element.querySelector("#profiles-dropdown");
    if (!dropdown) return;
    const name = dropdown.value;
    if (!name) return;
    const confirmed = await Dialog.confirm({
      title: "Delete Profile",
      content: `<p>Are you sure you want to delete the world profile "<strong>${name}</strong>"? This cannot be undone.</p>`,
      defaultYes: false,
    });
    if (confirmed && (await this.profileManager.deleteWorldProfile(name))) {
      this._populateProfilesDropdown();
    }
  }

  async _onSetDefaultProfile() {
    const dropdown = this.element.querySelector("#profiles-dropdown");
    if (!dropdown) return;
    const name = dropdown.value;
    if (name) {
      await this.profileManager.setWorldDefaultProfile(name);
      this._populateProfilesDropdown();
    }
  }

  async _onCopySettings(target) {
    try {
      const configToCopy = this.profileManager.getCurrentConfig({
        excludeClientOverrides: true,
      });
      
      // Check if this is the DEBUG button (uses clipboard for exporting MODULE_DEFAULTS)
      // This button is specifically designed to allow easy outputting of the MODULE_DEFAULTS 
      // value to aid with changing the hard coded settings.
      const isDebugButton = target?.id === "copy-active-settings-btn";
      
      if (isDebugButton) {
        // DEBUG button: Use clipboard for exporting settings
        const jsonString = JSON.stringify(configToCopy, null, 2);
        await navigator.clipboard.writeText(jsonString);
        ui.notifications.info("Map Shine settings copied to clipboard for export.");
      } else {
        // Profile copy button: Use temporary storage
        TEMP_CLIPBOARD_STORAGE.settings = configToCopy;
        ui.notifications.info("Map Shine settings copied to temporary storage.");
      }
    } catch (err) {
      console.error("Map Shine | Failed to copy settings:", err);
      ui.notifications.error(
        "Could not copy settings. See console for details."
      );
    }
  }

  async _onPasteSettings(target) {
    try {
      // Read from temporary storage instead of clipboard
      const pastedConfig = TEMP_CLIPBOARD_STORAGE.settings;
      
      if (!pastedConfig) {
        ui.notifications.warn("No settings have been copied yet. Use 'Copy Settings' first.");
        return;
      }

      // Reconcile the pasted config to ensure it matches the current data structure.
      const reconciledConfig = ConfigBuilder._reconcile(
        foundry.utils.deepClone(MODULE_DEFAULTS),
        pastedConfig
      );

      // Get all current user overrides from settings.
      const allUserOverrides =
        game.settings.get(MODULE_ID, "user-adjustments") || {};

      // Overwrite the overrides for the current scene with the loaded profile's config.
      allUserOverrides[this.profileManager.activeSceneId] = reconciledConfig;

      // Save this new "dirty" state back to settings.
      await game.settings.set(MODULE_ID, "user-adjustments", allUserOverrides);

      // Re-initialize the entire configuration from the new state.
      this.profileManager.initializeForScene();

      // Push the changes to all active systems.
      await this.profileManager.updateAllSystemsFromConfig();

      // Re-render the UI to show the new values.
      if (this.profileManager.ui) {
        this.profileManager.ui.render();
      }

      ui.notifications.info(
        "Pasted settings have been applied as temporary changes."
      );
    } catch (err) {
      console.error(
        "Map Shine | Failed to paste settings:",
        err
      );
      ui.notifications.error(
        "Could not paste settings. See console for details."
      );
    }
  }

  async _onCurveChange(points, options = {}) {
    if (!this.curveEditor || options.isLoading) return;

    const curvesConfig = this.config.postProcessing.colorCorrection.curves;
    const activeChannel = curvesConfig.activeChannel || "rgb";

    if (activeChannel === "rgb") {
      await this.profileManager.recordUserChange(
        "postProcessing.colorCorrection.curves.rgb.points",
        points
      );
      await this.profileManager.recordUserChange(
        "postProcessing.colorCorrection.curves.red.points",
        points
      );
      await this.profileManager.recordUserChange(
        "postProcessing.colorCorrection.curves.green.points",
        points
      );
      await this.profileManager.recordUserChange(
        "postProcessing.colorCorrection.curves.blue.points",
        points
      );
    } else {
      const path = `postProcessing.colorCorrection.curves.${activeChannel}.points`;
      await this.profileManager.recordUserChange(path, points);
    }

    await this.profileManager.updateAllSystemsFromConfig();
  }

  _onCurveChannelChange(e) {
    if (!e.target.checked) return;
    this._updateCurveEditorView();
  }

  _updateCurveEditorView() {
    if (!this.curveEditor) return;

    const curvesConfig = this.config.postProcessing.colorCorrection.curves;
    const activeChannel = curvesConfig.activeChannel || "rgb";

    const channelPoints = curvesConfig[activeChannel]?.points;
    if (channelPoints) {
      this.curveEditor.setPoints(channelPoints);
    }

    const colorMap = {
      rgb: "#00aaff",
      red: "#ff6b6b",
      green: "#6bff6b",
      blue: "#6b6bff",
    };
    this.curveEditor.path.setAttribute("stroke", colorMap[activeChannel]);
  }

  async _onApplyColorPreset() {
    const dropdown = this.element.querySelector(
      "#control-postProcessing-colorCorrection-activePreset"
    );
    if (!dropdown) return;

    const presetKey = dropdown.value;
    const preset = COLOR_CORRECTION_PRESETS[presetKey];
    if (!preset) {
      ui.notifications.warn("Invalid color preset selected.");
      return;
    }

    this.profileManager.recordUserChange(
      "postProcessing.colorCorrection",
      foundry.utils.deepClone(preset)
    );

    this.profileManager.updateAllSystemsFromConfig();
    this.updateAllControls();

    ui.notifications.info(`Applied "${preset.name}" color preset.`);
  }

  _onSaveColorFavorite() {
    const name = prompt("Enter a name for this color favorite:");
    if (!name || name.trim() === "") return;

    const ccConfig = this.config.postProcessing.colorCorrection;
    const favorite = {
      name: name.trim(),
      ...foundry.utils.deepClone(ccConfig),
    };

    let favorites = [];
    try {
      const stored = game.settings.get("map-shine", "colorFavorites");
      favorites = JSON.parse(stored || "[]");
    } catch (e) {
      console.warn("MapShine | Failed to load color favorites:", e);
    }

    favorites.push(favorite);

    try {
      game.settings.set(
        "map-shine",
        "colorFavorites",
        JSON.stringify(favorites)
      );
      this._updateFavoritesList();
      ui.notifications.info(`Saved color favorite "${name}".`);
    } catch (e) {
      console.error("MapShine | Failed to save color favorite:", e);
      ui.notifications.error("Failed to save color favorite.");
    }
  }

  async _onSwitchToSimpleMode() {
    await game.settings.set(MODULE_ID, "advanced-ui-mode", false);
    game.mapShine.debugger?.destroy();
    setTimeout(() => game.mapShine.showEditor(), 0);
  }

  _updateFavoritesList() {
    const container = this.element.querySelector("#color-favorites-list");
    if (!container) return;

    let favorites = [];
    try {
      const stored = game.settings.get("map-shine", "colorFavorites");
      favorites = JSON.parse(stored || "[]");
    } catch (e) {
      console.warn("MapShine | Failed to load color favorites:", e);
    }

    if (favorites.length === 0) {
      container.innerHTML =
        '<p style="color: #888; font-style: italic;">No favorites saved yet.</p>';
      return;
    }

    let html = "";
    favorites.forEach((favorite, index) => {
      html += `
                            <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 3px;">
                                <button class="apply-favorite-btn" data-index="${index}" title="Apply this favorite" style="flex: 1; height: 20px; font-size: 11px;">${favorite.name}</button>
                                <button class="delete-favorite-btn" data-index="${index}" title="Delete this favorite" style="width: 20px; height: 20px; font-size: 11px; color: #ff6b6b;"><i class="fas fa-trash"></i></button>
                            </div>
                        `;
    });
    container.innerHTML = html;

    container.querySelectorAll(".apply-favorite-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        this._applyColorFavorite(index);
      });
    });

    container.querySelectorAll(".delete-favorite-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        this._deleteColorFavorite(index);
      });
    });
  }

  async _applyColorFavorite(index) {
    let favorites = [];
    try {
      const stored = game.settings.get("map-shine", "colorFavorites");
      favorites = JSON.parse(stored || "[]");
    } catch (e) {
      console.warn("MapShine | Failed to load color favorites:", e);
      return;
    }

    const favorite = favorites[index];
    if (!favorite) return;

    const newConfig = foundry.utils.deepClone(favorite);
    delete newConfig.name;

    await this.profileManager.recordUserChange(
      "postProcessing.colorCorrection",
      newConfig
    );

    await this.profileManager.updateAllSystemsFromConfig();
    this.updateAllControls();
    ui.notifications.info(`Applied color favorite "${favorite.name}".`);
  }

  _deleteColorFavorite(index) {
    let favorites = [];
    try {
      const stored = game.settings.get("map-shine", "colorFavorites");
      favorites = JSON.parse(stored || "[]");
    } catch (e) {
      console.warn("MapShine | Failed to load color favorites:", e);
      return;
    }

    const favorite = favorites[index];
    if (!favorite) return;

    Dialog.confirm({
      title: "Delete Favorite",
      content: `<p>Are you sure you want to delete the color favorite "<strong>${favorite.name}</strong>"?</p>`,
      yes: () => {
        favorites.splice(index, 1);
        try {
          game.settings.set(
            "map-shine",
            "colorFavorites",
            JSON.stringify(favorites)
          );
          this._updateFavoritesList();
          ui.notifications.info(`Deleted color favorite "${favorite.name}".`);
        } catch (e) {
          console.error("MapShine | Failed to delete color favorite:", e);
          ui.notifications.error("Failed to delete color favorite.");
        }
      },
      defaultYes: false,
    });
  }

  _makeDraggable() {
    const elmnt = this.element;
    const header = elmnt.querySelector("#material-editor-header");
    if (!header) return;
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

    const dragMouseDown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      let newTop = elmnt.offsetTop - pos2;
      let newLeft = elmnt.offsetLeft - pos1;

      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      const elmntWidth = elmnt.offsetWidth;
      const headerHeight = header.offsetHeight;
      const minVisibleWidth = 100;

      newTop = Math.max(0, newTop);
      newTop = Math.min(newTop, winHeight - headerHeight);

      newLeft = Math.max(newLeft, -elmntWidth + minVisibleWidth);
      newLeft = Math.min(newLeft, winWidth - minVisibleWidth);

      elmnt.style.top = `${newTop}px`;
      elmnt.style.left = `${newLeft}px`;
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;

      const currentPos =
        game.settings.get(MODULE_ID, "debugger-position") || {};
      currentPos.top = elmnt.offsetTop;
      currentPos.left = elmnt.offsetLeft;
      game.settings.set(MODULE_ID, "debugger-position", currentPos);
    };
    header.onmousedown = dragMouseDown;
  }

  destroy() {
    // Destroy the UI clock component if it exists
    if (this.uiClock) {
      this.uiClock.destroy();
      this.uiClock = null;
    }

    // Clean up window listeners just in case a drag was interrupted
    window.removeEventListener("mousemove", this._onDebuggerClockDragBound);
    window.removeEventListener("mouseup", this._onDebuggerClockDragEndBound);
    window.removeEventListener("mousemove", this._boundGradientMouseMove);
    window.removeEventListener("mouseup", this._boundGradientMouseUp);
  }
}