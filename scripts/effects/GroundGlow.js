import { PIXI, RenderTexture, Texture, Filter } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { BLEND_MODE_OPTIONS } from "../config/blend-modes.js";
import { ResizableAnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";

export class GroundGlowLayer extends ResizableAnimatedCanvasLayer {
  constructor() {
    super();
    this.glowSpritesContainer = null;
    this.glowCompositeTexture = null;
    this.effectSprite = null;
    this.glowFilter = null;
    this.glowSprites = new Map();
    this._needsMaskUpdate = true;
  }

  static getSettingsHTML() {
    return DebuggerUIBuilder._createAccordionHTML(
      "groundGlow",
      "Glow in the Dark",
      `
            ${DebuggerUIBuilder._createTextureInputHTML(
              "groundGlow",
              "Glow Texture"
            )}
            <p class="description-text">Makes a texture appear to glow only in unlit areas of the scene. Requires scene lighting.</p>
            ${DebuggerUIBuilder._createSliderHTML(
              "groundGlow.intensity",
              "Intensity",
              0,
              5,
              0.05
            )}
            ${DebuggerUIBuilder._createSelectHTML(
              "groundGlow.blendMode",
              "Blend Mode",
              BLEND_MODE_OPTIONS
            )}
            <hr style="border-color: #555; margin: 4px 0;">
            ${DebuggerUIBuilder._createSliderHTML(
              "groundGlow.brightness",
              "Brightness",
              0,
              5,
              0.05
            )}
            ${DebuggerUIBuilder._createSliderHTML(
              "groundGlow.saturation",
              "Saturation",
              0,
              5,
              0.05
            )}
            ${DebuggerUIBuilder._createCheckboxHTML(
              "groundGlow.invert",
              "Invert (Glow in Light)",
              false,
              "Makes the effect appear in lit areas instead of dark ones."
            )}
            <details id="details-groundGlow-tokenMasking">
                <summary>
                    <span class="accordion-toggle"></span>
                    <div class="summary-control">
                        ${DebuggerUIBuilder._createCheckboxHTML(
                          "groundGlow.tokenMasking.enabled",
                          "Token Masking",
                          true
                        )}
                    </div>
                </summary>
                <div style="padding-left: 5px;">
                    <p class="description-text">Hides the effect behind tokens.</p>
                    ${DebuggerUIBuilder._createSliderHTML(
                      "groundGlow.tokenMasking.threshold",
                      "Mask Threshold",
                      0,
                      1,
                      0.01
                    )}
                </div>
            </details>
        `
    );
  }

  async _draw() {
    await super._draw(); // Handles ticker, resize, and _destroyed flag
    this._needsMaskUpdate = true;

    const renderer = canvas.app.renderer;

    // Container for all raw _GroundGlow sprites
    this.glowSpritesContainer = new PIXI.Container();

    // Texture to render the combined glow sprites into

    this.glowCompositeTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });

    // The single filter that applies the lighting logic
    try {
      this.glowFilter = new GroundGlowFilter();
    } catch (e) {
      console.error("MapShine | Failed to create GroundGlowFilter.", e);
    }

    // The final sprite that displays the result
    this.effectSprite = new PIXI.Sprite(this.glowCompositeTexture);
    this.effectSprite.filters = this.glowFilter ? [this.glowFilter] : [];
    this.addChild(this.effectSprite);

    this._onPanBound = () => (this._needsMaskUpdate = true);
    Hooks.on("canvasPan", this._onPanBound);
  }

  async _tearDown(options) {
    Hooks.off("canvasPan", this._onPanBound);

    this.glowFilter?.destroy();
    this.effectSprite?.destroy();
    this.glowCompositeTexture?.destroy(true);
    this.glowSpritesContainer?.destroy({ children: true });

    this.glowFilter = null;
    this.effectSprite = null;
    this.glowCompositeTexture = null;
    this.glowSpritesContainer = null;
    this.glowSprites.clear();

    await super._tearDown(options); // Handles ticker, resize unbinding and _destroyed flag
  }

  _onAnimate() {
    if (this._destroyed || !this.visible || !this.glowFilter) return;

    // ✅ FIX: Check master enabled flag
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) return;

    // ✅ FIX: Check groundGlow enabled flag
    if (config?.groundGlow && config.groundGlow.enabled === false) return;

    if (this._needsMaskUpdate) {
      this._renderCompositeMask();
      this._needsMaskUpdate = false;
    }

    const resourceManager = game.mapShine.resourceManager;
    if (!resourceManager) return;

    // Update light mask and token mask uniforms
    const u = this.glowFilter.uniforms;
    u.uLightMask = resourceManager.getLightMask() || PIXI.Texture.WHITE;
    u.uTokenMask = resourceManager.getTokenMask() || PIXI.Texture.BLACK;

    // Position and scale the final sprite to cover the screen
    this.effectSprite.position.copyFrom(CoordinateManager.getCameraOffset());
    this.effectSprite.width = CoordinateManager.getViewSize().width;
    this.effectSprite.height = CoordinateManager.getViewSize().height;
  }

  _renderCompositeMask() {
    if (!this.glowSpritesContainer || !this.glowCompositeTexture) return;
    canvas.app.renderer.render(this.glowSpritesContainer, {
      renderTexture: this.glowCompositeTexture,
      transform: canvas.stage.transform.worldTransform,
      clear: true,
    });
  }

  async updateEffectTargets(targets) {
    if (!this.glowSpritesContainer) return;
    const validTargetIds = new Set();
    const allTargets = new Map([
      ["background", targets.background],
      ...targets.tiles.entries(),
    ]);

    for (const [id, targetData] of allTargets.entries()) {
      if (targetData?.groundGlow) {
        validTargetIds.add(id);
        let sprite = this.glowSprites.get(id);
        if (!sprite) {
          sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.glowSprites.set(id, sprite);
          this.glowSpritesContainer.addChild(sprite);
        }
        await this._updateSpriteTransform(
          sprite,
          targetData.groundGlow,
          targetData.rect
        );
      }
    }

    for (const [id, sprite] of this.glowSprites.entries()) {
      if (!validTargetIds.has(id)) {
        sprite.destroy();
        this.glowSprites.delete(id);
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
      } catch (e) {
        console.warn(
          `MapShine | Failed to load texture "${texturePath}":`,
          e.message
        );
        sprite.texture = PIXI.Texture.EMPTY;
      }
    }
    if (!sprite.texture?.valid || !sprite.texture?.baseTexture?.valid || !rect) return;
    sprite.anchor.set(0.5);
    sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
    sprite.width = rect.width;
    sprite.height = rect.height;
    sprite.rotation = rect.rotation || 0;
  }

  async updateFromConfig(config) {
    if (!this.glowFilter) return;
    const ggConfig = config.groundGlow;
    this.visible = config.enabled && ggConfig.enabled;

    if (this.effectSprite) {
      this.effectSprite.blendMode = ggConfig.blendMode;
    }

    const u = this.glowFilter.uniforms;
    u.uIntensity = ggConfig.intensity;
    u.uBrightness = ggConfig.brightness;
    u.uSaturation = ggConfig.saturation;
    u.uInvert = ggConfig.invert;
  }

  _onResize() {
    const renderer = canvas.app.renderer;
    this.glowCompositeTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this._needsMaskUpdate = true;
  }
}

class GroundGlowFilter extends PIXI.Filter {
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
                vScreenCoord = gl_Position.xy * 0.5 + 0.5;
            }
        `;

    const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            uniform sampler2D uSampler;
            uniform sampler2D uLightMask;
            uniform sampler2D uTokenMask;
            uniform float uIntensity;
            uniform float uBrightness;
            uniform float uSaturation;
            uniform bool uInvert;
            uniform bool uTokenMaskEnabled;
            uniform float uTokenMaskThreshold;

            void main() {
                // Sample the glow texture
                vec4 glowColor = texture2D(uSampler, vTextureCoord);
                
                // Sample the light mask (white = light exists, black = no light)
                float lightValue = texture2D(uLightMask, vScreenCoord).r;
                
                // Calculate glow visibility based on lighting
                float glowVisibility = uInvert ? lightValue : (1.0 - lightValue);
                
                // Apply token masking
                if (uTokenMaskEnabled) {
                    float tokenMask = texture2D(uTokenMask, vScreenCoord).r;
                    // Hide glow where tokens are (tokenMask > threshold)
                    glowVisibility *= (1.0 - step(uTokenMaskThreshold, tokenMask));
                }
                
                // Calculate visibility factor
                float visibility = glowVisibility * uIntensity;
                
                // Apply brightness and saturation to the glow texture
                // Brightness is applied AFTER visibility to allow it to brighten dark areas
                vec3 baseColor = glowColor.rgb * visibility;
                vec3 brightenedColor = baseColor * uBrightness;
                
                // Apply saturation
                float luminance = dot(brightenedColor, vec3(0.299, 0.587, 0.114));
                vec3 finalColor = mix(vec3(luminance), brightenedColor, uSaturation);
                
                // Alpha is modulated by visibility and original alpha
                float finalAlpha = glowColor.a * visibility;
                
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `;

    super(vertexSrc, fragmentSrc, {
      uLightMask: PIXI.Texture.WHITE,
      uTokenMask: PIXI.Texture.BLACK,
      uIntensity: 1.0,
      uBrightness: 1.0,
      uSaturation: 1.0,
      uInvert: false,
      uTokenMaskEnabled: true,
      uTokenMaskThreshold: 0.5,
      ...options,
    });
  }
}
