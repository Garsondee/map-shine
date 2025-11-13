import { PIXI, RenderTexture, Texture, Filter } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { ScreenEffectsManager } from "../managers/ScreenEffectsManager.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { ResizableAnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";

class HeatDistortionNoiseFilter extends PIXI.Filter {
  constructor(options = {}) {
    const vertexSrc = `
                attribute vec2 aVertexPosition;
                attribute vec2 aTextureCoord;
                uniform mat3 projectionMatrix;
                varying vec2 vTextureCoord;
                varying vec2 vScreenCoord;

                void main(void) {
                    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                    vTextureCoord = aTextureCoord;
                    // Calculate normalized screen coordinates from the vertex's final position.
                    // This is the robust way to get screen-space UVs for a post-processing filter.
                    vScreenCoord = gl_Position.xy * 0.5 + 0.5;
                }
            `;
    const fragmentSrc = `
                precision mediump float;
                varying vec2 vScreenCoord; // Use the reliable screen coordinate varying

                uniform float u_time;

                // World-space uniforms
                uniform vec2 u_camera_offset;
                uniform vec2 u_view_size;

                // Primary Noise Layer
                uniform float u_primarySpeed;
                uniform float u_primaryScale;
                uniform int u_primaryOctaves;
                uniform float u_primaryLacunarity;
                uniform float u_primaryPersistence;

                // Secondary Noise Layer
                uniform float u_secondarySpeed;
                uniform float u_secondaryScale;
                uniform int u_secondaryOctaves;
                uniform float u_secondaryLacunarity;
                uniform float u_secondaryPersistence;

                // Rising Motion
                uniform float u_risingSpeed;

                // 2D Simplex Noise functions by Ashima Arts.
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                vec3 taylorInvSqrt(vec3 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec2 x1 = x0.xy + C.xx - i1;
                    vec2 x2 = x0.xy + C.zz;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
                    m = m*m; m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= taylorInvSqrt(a0*a0 + h*h);
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
                    return 130.0 * dot(m, g);
                }

                // 2D FBM function
                float fbm(vec2 st, int octaves, float lacunarity, float persistence) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 8; i++) {
                        if (i >= octaves) break;
                        value += amplitude * snoise(st);
                        st *= lacunarity;
                        amplitude *= persistence;
                    }
                    return value; // Returns range approx -1 to 1
                }

                void main() {
                    // Convert screen-space vScreenCoord to world-space coordinates.
                    vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);

                    // --- ANIMATION ---
                    // Calculate all animation offsets consistently in world-space first.
                    // A multiplier is used to keep UI speed values in a sensible range.
                    vec2 primary_anim_offset = vec2(u_time * u_primarySpeed, -u_time * u_risingSpeed) * 20.0;
                    vec2 secondary_anim_offset = vec2(u_time * u_secondarySpeed, -u_time * u_risingSpeed) * 20.0;

                    // --- NOISE CALCULATION ---
                    // Apply animation offsets to world coordinates, THEN scale for noise sampling.
                    vec2 primary_uv = (world_coord + primary_anim_offset) * u_primaryScale * 0.01;
                    vec2 secondary_uv = (world_coord + secondary_anim_offset) * u_secondaryScale * 0.01;

                    // Primary, slower, larger waves for X and Y displacement
                    float primary_noise_x = fbm(primary_uv, u_primaryOctaves, u_primaryLacunarity, u_primaryPersistence);
                    float primary_noise_y = fbm(primary_uv + vec2(13.7, 5.9), u_primaryOctaves, u_primaryLacunarity, u_primaryPersistence);

                    // Secondary, faster, smaller waves for detail
                    float secondary_noise_x = fbm(secondary_uv, u_secondaryOctaves, u_secondaryLacunarity, u_secondaryPersistence);
                    float secondary_noise_y = fbm(secondary_uv + vec2(-8.2, -19.1), u_secondaryOctaves, u_secondaryLacunarity, u_secondaryPersistence);

                    // Combine noises
                    float final_x = (primary_noise_x * 0.7) + (secondary_noise_x * 0.3);
                    float final_y = (primary_noise_y * 0.7) + (secondary_noise_y * 0.3);

                    // Normalize to 0-1 range for the displacement map
                    gl_FragColor = vec4(final_x * 0.5 + 0.5, final_y * 0.5 + 0.5, 0.0, 1.0);
                }
            `;
    super(vertexSrc, fragmentSrc, {
      u_time: 0.0,

      u_camera_offset: [0, 0],

      u_view_size: [1, 1],

      u_primarySpeed: 0.01,

      u_primaryScale: 1.5,

      u_primaryOctaves: 3,

      u_primaryLacunarity: 2.0,

      u_primaryPersistence: 0.5,

      u_secondarySpeed: 0.08,

      u_secondaryScale: 6.0,

      u_secondaryOctaves: 2,

      u_secondaryLacunarity: 2.5,

      u_secondaryPersistence: 0.4,

      u_risingSpeed: 0.02,
      // u_risingIntensity is no longer used by the shader but is kept for config compatibility

      u_risingIntensity: 0.5,
      ...options,
    });
  }
}

export class HeatDistortionLayer extends ResizableAnimatedCanvasLayer {
  constructor() {
    super();
    this.heatSourceContainer = null;
    this.combinedMaskTexture = null;
    this.heatSprites = new Map();

    // New properties for dedicated noise generation
    this.noiseFilter = null;
    this.noiseSprite = null;
    this.noiseTexture = null;
    this.time = 0;

    this._needsMaskUpdate = true;
    this._destroyed = false;
    this._framesSinceLoad = 0;
  }

  static getSettingsHTML() {
    const effectKey = "heatDistortion";
    const path = `${effectKey}.worldBasedOnly`;
    const checkboxHTML = DebuggerUIBuilder._createCheckboxHTML(
      path,
      "World Based Only",
      false,
      "Ignores scene-specific settings for this effect and uses the configured World Default Profile instead. A default profile must be set."
    );
    const iconHTML = `<button type="button" class="world-based-badge" data-world-based-path="${path}" title="World Based: This effect uses the world-level default profile, ignoring scene-specific settings." style="width: 24px; height: 24px; min-width: 24px; min-height: 24px; box-sizing: border-box; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(76, 175, 80, 0.5); background: rgba(76, 175, 80, 0.15); border-radius: 3px; cursor: default; pointer-events: none;"><i class="fas fa-globe" style="font-size: 12px; color: #90ee90;"></i></button>`;

    const content = `
                            ${checkboxHTML}
                            <hr style="border-color: #555; margin: 4px 0;">
                            ${DebuggerUIBuilder._createTextureInputHTML(
                              "heat",
                              "Intensity Mask (_Heat)"
                            )}
                            <p class="description-text">Simulates rising heat waves, distorting the scene behind the masked areas.</p>
                            ${DebuggerUIBuilder._createSliderHTML(
                              "heatDistortion.intensity",
                              "Intensity",
                              0,
                              0.05,
                              0.0005
                            )}
                            <details id="details-heatDistortion-noise">
                                <summary><span class="accordion-toggle"></span><strong>Noise Pattern</strong></summary>
                                <div style="padding-left: 5px;">
                                    <details id="details-heatDistortion-noise-primary">
                                        <summary><span class="accordion-toggle"></span><strong>Primary Waves (Large)</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.primary.speed",
                                              "Speed",
                                              0,
                                              100,
                                              0.5
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.primary.scale",
                                              "Scale",
                                              0.1,
                                              10,
                                              0.1
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.primary.octaves",
                                              "Complexity",
                                              1,
                                              8,
                                              1
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.primary.lacunarity",
                                              "Detail Freq",
                                              1.5,
                                              4,
                                              0.05
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.primary.persistence",
                                              "Roughness",
                                              0.1,
                                              1,
                                              0.05
                                            )}
                                        </div>
                                    </details>
                                    <details id="details-heatDistortion-noise-secondary">
                                        <summary><span class="accordion-toggle"></span><strong>Secondary Waves (Fine Detail)</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.secondary.speed",
                                              "Speed",
                                              0,
                                              100,
                                              0.5
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.secondary.scale",
                                              "Scale",
                                              1,
                                              20,
                                              0.5
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.secondary.octaves",
                                              "Complexity",
                                              1,
                                              8,
                                              1
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.secondary.lacunarity",
                                              "Detail Freq",
                                              1.5,
                                              4,
                                              0.05
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.secondary.persistence",
                                              "Roughness",
                                              0.1,
                                              1,
                                              0.05
                                            )}
                                        </div>
                                    </details>
                                    <details id="details-heatDistortion-noise-rising">
                                        <summary><span class="accordion-toggle"></span><strong>Rising Motion</strong></summary>
                                        <div style="padding-left: 5px;">
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.rising.speed",
                                              "Speed",
                                              0,
                                              0.1,
                                              0.001
                                            )}
                                            ${DebuggerUIBuilder._createSliderHTML(
                                              "heatDistortion.noise.rising.intensity",
                                              "Intensity",
                                              0,
                                              2,
                                              0.05,
                                              'The strength of the vertical "rising" motion.'
                                            )}
                                        </div>
                                    </details>
                                </div>
                            </details>
                        `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Heat Distortion",
      content,
      iconHTML
    );
  }

  async _draw() {
    await super._draw(); // Handles ticker, resize, and _destroyed flag
    
    this.visible = false;
    this.eventMode = "none";
    this._onPanBound = this._onPan.bind(this);

    this._framesSinceLoad = 0;
    this._needsMaskUpdate = true;
    this.time = 0;

    this.heatSourceContainer = new PIXI.Container();
    this.addChild(this.heatSourceContainer);

    const renderer = canvas.app.renderer;

    this.combinedMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });

    // Setup for the new dedicated noise filter
    try {
      this.noiseFilter = new HeatDistortionNoiseFilter();

      this.noiseTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height,
      });
      this.noiseSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
      this.noiseSprite.width = renderer.screen.width;
      this.noiseSprite.height = renderer.screen.height;
      this.noiseSprite.filters = [this.noiseFilter];
    } catch (e) {
      console.error(
        "MapShine | Failed to create HeatDistortionNoiseFilter.",
        e
      );
    }

    if (!game.modules.get("libwrapper")?.active) {
      Hooks.on("canvasPan", this._onPanBound);
    }
  }

  _onPan() {
    this._needsMaskUpdate = true;
  }

  async updateEffectTargets(targets) {
    if (!this.heatSourceContainer) return;

    const validTargetIds = new Set();
    const allTargets = new Map([
      ["background", targets.background],
      ...targets.tiles.entries(),
    ]);
    for (const [id, targetData] of allTargets.entries()) {
      if (!targetData?.heat) continue;
      validTargetIds.add(id);
      let sprite = this.heatSprites.get(id);
      if (!sprite) {
        sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.heatSprites.set(id, sprite);
        this.heatSourceContainer.addChild(sprite);
      }
      await this._updateSpriteTransform(
        sprite,
        targetData.heat,
        targetData.rect
      );
    }
    for (const [id, sprite] of this.heatSprites.entries()) {
      if (!validTargetIds.has(id)) {
        sprite.destroy();
        this.heatSprites.delete(id);
      }
    }
    this._needsMaskUpdate = true;
  }

  async _updateSpriteTransform(sprite, texturePath, rect) {
    if (!sprite || sprite.destroyed) return;

    const currentPath = sprite.texture?.baseTexture?.resource?.src;
    if (texturePath !== currentPath) {
      try {
        const loadedTexture = await TextureLoader.loadTexture(texturePath);
        if (loadedTexture?.baseTexture?.valid) {
          sprite.texture = loadedTexture;
        } else {
          console.warn(`MapShine | Loaded texture has invalid baseTexture: "${texturePath}"`);
          sprite.texture = PIXI.Texture.EMPTY;
        }
      } catch (_e) {
        sprite.texture = PIXI.Texture.EMPTY;
      }
    }

    if (
      !sprite ||
      sprite.destroyed ||
      !sprite.anchor ||
      !sprite.texture?.valid ||
      !sprite.texture?.baseTexture?.valid ||
      !rect
    )
      return;

    sprite.anchor.set(0.5);
    sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
    sprite.width = rect.width;
    sprite.height = rect.height;
    sprite.rotation = rect.rotation || 0;
  }

  _onAnimate(deltaTime) {
    if (this._destroyed) return;

    this._framesSinceLoad++;
    const heatFilter = ScreenEffectsManager.getFilter("heatDistortion");
    if (heatFilter) heatFilter.enabled = false;

    const mainConfig = game.mapShine.profileManager.activeConfig;
    const config = mainConfig.heatDistortion;
    if (
      !mainConfig.enabled ||
      !config.enabled ||
      !heatFilter ||
      !this.noiseFilter
    ) {
      return;
    }

    const hasActiveHeatSources =
      this.heatSprites.size > 0 &&
      Array.from(this.heatSprites.values()).some((s) => s.texture.valid);
    if (!hasActiveHeatSources) {
      return;
    }

    if (this._framesSinceLoad < 5) return;

    heatFilter.enabled = true;

    if (this._needsMaskUpdate) {
      canvas.app.renderer.render(this.heatSourceContainer, {
        renderTexture: this.combinedMaskTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: true,
      });
      this._needsMaskUpdate = false;
    }

    // Update and render the noise displacement map
    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    this.time += deltaTime * timeFactor;
    this.noiseFilter.uniforms.u_time = this.time;
    // Pass world-space uniforms to the noise filter
    Object.assign(
      this.noiseFilter.uniforms,
      CoordinateManager.getShaderUniforms()
    );

    canvas.app.renderer.render(this.noiseSprite, {
      renderTexture: this.noiseTexture,
      clear: true,
    });

    // Update the main distortion filter with the results
    const u = heatFilter.uniforms;
    u.u_intensity = config.intensity;
    u.u_displacementMap = this.noiseTexture;
    u.u_intensityMask = this.combinedMaskTexture;
  }

  async updateFromConfig(config) {
    if (!this.noiseFilter) return;

    const nConfig = config.heatDistortion.noise;
    const p1 = nConfig.primary;
    const p2 = nConfig.secondary;
    const r = nConfig.rising;
    const u = this.noiseFilter.uniforms;

    // Apply scaling factors
    u.u_primarySpeed = (p1.speed ?? 1.0) * 0.01;
    u.u_primaryScale = p1.scale;
    u.u_primaryOctaves = p1.octaves;
    u.u_primaryLacunarity = p1.lacunarity;
    u.u_primaryPersistence = p1.persistence;

    u.u_secondarySpeed = (p2.speed ?? 8.0) * 0.01;
    u.u_secondaryScale = p2.scale;
    u.u_secondaryOctaves = p2.octaves;
    u.u_secondaryLacunarity = p2.lacunarity;
    u.u_secondaryPersistence = p2.persistence;

    u.u_risingSpeed = (r.speed ?? 2.0) * 0.01;
    u.u_risingIntensity = r.intensity;

    this._needsMaskUpdate = true;
  }

  _onResize() {
    const renderer = canvas.app.renderer;
    this.combinedMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );

    if (this.noiseTexture) {
      this.noiseTexture.resize(renderer.screen.width, renderer.screen.height);
      this.noiseSprite.width = renderer.screen.width;
      this.noiseSprite.height = renderer.screen.height;
    }

    if (game.mapShine?.effectTargetManager?.targets) {
      this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
    }
    this._needsMaskUpdate = true;
  }

  async _tearDown(options) {
    if (this._destroyed) return;

    if (this._onPanBound) Hooks.off("canvasPan", this._onPanBound);

    this.noiseFilter?.destroy();
    this.noiseSprite?.destroy();
    this.noiseTexture?.destroy(true);
    this.combinedMaskTexture?.destroy(true);
    // Don't destroy baseTextures - they're shared with TextureLoader cache
    this.heatSourceContainer?.destroy({
      children: true,
      texture: false,
      baseTexture: false,
    });
    this.heatSprites.clear();

    this.heatSourceContainer = null;
    this.combinedMaskTexture = null;
    this.noiseFilter = this.noiseSprite = this.noiseTexture = null;

    await super._tearDown(options); // Handles ticker, resize unbinding and _destroyed flag
  }
}

class HeatDistortionFilter extends PIXI.Filter {
  constructor(options = {}) {
    const fragmentSrc = `
                            precision mediump float;
                            varying vec2 vTextureCoord;

                            uniform sampler2D uSampler;
                            uniform sampler2D u_displacementMap;
                            uniform sampler2D u_intensityMask;

                            uniform float u_intensity;

                            void main(void) {

                                float mask_value = texture2D(u_intensityMask, vTextureCoord).r;

                                if (mask_value == 0.0) {
                                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                                    return;
                                }

                                vec2 displacement = (texture2D(u_displacementMap, vTextureCoord).rg - 0.5) * 2.0;

                                vec2 offset = displacement * u_intensity * mask_value;

                                gl_FragColor = texture2D(uSampler, vTextureCoord + offset);
                            }
                        `;

    super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
      u_displacementMap: PIXI.Texture.EMPTY,

      u_intensityMask: PIXI.Texture.EMPTY,
      u_intensity: options.intensity ?? 0.01,
    });
  }
}