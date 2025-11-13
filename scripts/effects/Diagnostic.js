import { MapPointsManager } from "../module.js";
import { PIXI, Texture } from "../pixi-adapter.js";
import { AnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { TextureAutoLoader } from "../utils/TextureAutoLoader.js";

export class DiagnosticLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this.diagnosticContainer = null;
    this.diagnosticSprites = new Map(); // key: targetId-suffix, value: sprite
    this.overlayContainer = null; // For outlines and labels
    this.overlays = new Map(); // key: targetId, value: PIXI.Container with graphics/text
    this.fullscreenSprite = null; // For viewing intermediate textures
    this.backgroundGfx = null; // For the black background
    this.tooltip = null;
    this._needsRefresh = true;
    this._onPanBound = null;
    this.tempRenderTexture = null; // To hold transient render textures for inspection
  }

  async _draw() {
    await super._draw(); // Handles ticker binding and _destroyed flag
    this._needsRefresh = true;

    this.diagnosticContainer = this.addChild(new PIXI.Container());
    this.overlayContainer = this.addChild(new PIXI.Container());

    // Add a graphics object for the background, before the sprite.
    this.backgroundGfx = this.addChild(new PIXI.Graphics());
    this.backgroundGfx.visible = false;

    this.fullscreenSprite = this.addChild(new PIXI.Sprite());
    this.fullscreenSprite.visible = false;

    this._createTooltip();

    // Add a hook to flag for a refresh when the canvas is panned.
    this._onPanBound = () => {
      this._needsRefresh = true;
    };
    Hooks.on("canvasPan", this._onPanBound);

    // The dropdown is now populated by the DebuggerEventHandler when it initializes.
  }

  async _tearDown(options) {
    if (this._onPanBound) {
      Hooks.off("canvasPan", this._onPanBound);
    }

    if (this.tempRenderTexture) {
      this.tempRenderTexture.destroy(true);
      this.tempRenderTexture = null;
    }

    this.diagnosticSprites.clear();
    this.overlays.clear();
    this._destroyTooltip();

    await super._tearDown(options); // Handles ticker unbinding and _destroyed flag
  }

  _createTooltip() {
    this.tooltip = document.createElement("div");
    this.tooltip.id = "map-shine-diagnostic-tooltip";
    Object.assign(this.tooltip.style, {
      position: "fixed",
      display: "none",
      background: "rgba(0,0,0,0.8)",
      color: "white",
      border: "1px solid #888",
      borderRadius: "4px",
      padding: "5px",
      fontFamily: "monospace",
      fontSize: "12px",
      pointerEvents: "none",
      zIndex: "100001",
    });
    document.body.appendChild(this.tooltip);
  }

  _destroyTooltip() {
    this.tooltip?.remove();
    this.tooltip = null;
  }

  _onAnimate() {
    if (this._destroyed) return;

    if (this._needsRefresh) {
      this._refreshMaskVisibility();
      this._needsRefresh = false;
    }

    const mousePosition = canvas.app.renderer.events.pointer.global;
    this._updateTooltip(mousePosition);
  }

  _updateTooltip(mousePosition) {
    if (!this.visible || !this.tooltip || !mousePosition) {
      if (this.tooltip && this.tooltip.style.display !== "none") {
        this.tooltip.style.display = "none";
      }
      return;
    }

    const config = game.mapShine.profileManager.activeConfig.diagnostic;
    if (!config.pixelInspector) {
      if (this.tooltip.style.display !== "none") {
        this.tooltip.style.display = "none";
      }
      return;
    }

    const clientX = mousePosition.x;
    const clientY = mousePosition.y;

    const bounds = canvas.app.view.getBoundingClientRect();
    if (
      clientX < bounds.left ||
      clientX > bounds.right ||
      clientY < bounds.top ||
      clientY > bounds.bottom
    ) {
      if (this.tooltip.style.display !== "none") {
        this.tooltip.style.display = "none";
      }
      return;
    }

    this.tooltip.style.display = "block";

    this.tooltip.style.left = `${clientX + 15}px`;
    this.tooltip.style.top = `${clientY + 15}px`;

    const renderer = canvas.app.renderer;
    const pixel = renderer.extract.pixels(
      canvas.app.stage,
      new PIXI.Rectangle(clientX, clientY, 1, 1)
    );

    if (pixel && pixel.length >= 4) {
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      const a = pixel[3];

      const r_norm = (r / 255).toFixed(3);
      const g_norm = (g / 255).toFixed(3);
      const b_norm = (b / 255).toFixed(3);
      const a_norm = (a / 255).toFixed(3);

      this.tooltip.innerHTML = `
                            <strong>Pixel Inspector</strong><br>
                            Screen X/Y: ${Math.round(clientX)}, ${Math.round(
        clientY
      )}<br>
                            --------------------<br>
                            RGBA (0-255): ${r}, ${g}, ${b}, ${a}<br>
                            RGBA (Norm): ${r_norm}, ${g_norm}, ${b_norm}, ${a_norm}
                        `;
    } else {
      this.tooltip.textContent = "Reading pixel...";
    }
  }

  _refreshMaskVisibility() {
    if (!this.diagnosticContainer) return;

    const config = game.mapShine.profileManager.activeConfig.diagnostic;
    const displaySuffix = config.displaySuffix;

    if (this.tempRenderTexture) {
      this.tempRenderTexture.destroy(true);
      this.tempRenderTexture = null;
    }

    // Ensure all components are hidden by default before we decide what to show.
    this.fullscreenSprite.visible = false;
    this.diagnosticContainer.visible = false;
    this.overlayContainer.visible = false;
    if (this.backgroundGfx) {
      this.backgroundGfx.visible = false;
    }

    if (!config.showMasks) {
      return;
    }

    let isFullscreenView = false;
    let fullscreenTexture = null;

    if (displaySuffix.startsWith("generated_")) {
      const key = displaySuffix.replace("generated_", "");
      if (key === "lightMask") {
        fullscreenTexture = game.mapShine.lightMaskManager?.getTexture();
      } else {
        fullscreenTexture = game.mapShine.geometryMaskManager?.getMask(key);
      }
      isFullscreenView = true;
    } else if (displaySuffix === "external_illumination") {
      fullscreenTexture = game.modules
        .get("illuminationbuffer")

        ?.api?.getLightingTexture();
      isFullscreenView = true;
    } else if (displaySuffix === "external_lightingLayer") {
      // Correctly access the final rendered texture from the core illumination effects layer.

      fullscreenTexture = canvas.effects.illumination?.texture;
      isFullscreenView = true;
    } else if (displaySuffix === "external_darknessLayer") {
      // Correctly access the final rendered texture from the core darkness effects layer.

      fullscreenTexture = canvas.effects.darkness?.texture;
      isFullscreenView = true;
    } else if (displaySuffix.startsWith("intermediate_")) {
      const key = displaySuffix.replace("intermediate_", "");
      const layerMap = {
        metallicShinePattern: {
          class: MetallicShineLayer,
          method: "getPatternTexture",
        },
        waterDisplacement: {
          class: WaterFXLayer,
          property: "displacementTexture",
        },
        heatNoise: {
          class: HeatDistortionLayer,
          property: "noiseTexture",
        },
        iridescenceNoise: {
          class: IridescenceLayer,
          property: "distortionNoiseManager",
        },
        prismNoise: {
          class: PrismLayer,
          property: "distortionNoiseManager",
        },
      };
      if (layerMap[key]) {
        const info = layerMap[key];
        const layer = canvas.layers.find((l) => l instanceof info.class);
        if (layer) {
          if (info.method) fullscreenTexture = layer[info.method]();
          else if (info.property && layer[info.property]?.getTexture)
            fullscreenTexture = layer[info.property].getTexture();
          else if (info.property) fullscreenTexture = layer[info.property];
        }
      }
      isFullscreenView = true;
    }

    if (isFullscreenView) {
      this.fullscreenSprite.texture = fullscreenTexture || PIXI.Texture.EMPTY;
      this.fullscreenSprite.visible = true;
      const stage = canvas.stage;
      const screen = canvas.app.screen;

      const topLeft = stage.toLocal({
        x: 0,
        y: 0,
      });

      this.fullscreenSprite.position.copyFrom(topLeft);
      this.fullscreenSprite.width = screen.width / stage.scale.x;
      this.fullscreenSprite.height = screen.height / stage.scale.y;

      // If the light mask is selected, draw a black background behind it for contrast.
      if (displaySuffix === "generated_lightMask" && this.backgroundGfx) {
        this.backgroundGfx.visible = true;
        this.backgroundGfx.clear();
        this.backgroundGfx.beginFill(0x000000);
        this.backgroundGfx.drawRect(
          topLeft.x,
          topLeft.y,
          this.fullscreenSprite.width,
          this.fullscreenSprite.height
        );
        this.backgroundGfx.endFill();
      }
    } else {
      this.diagnosticContainer.visible = true;
      this.overlayContainer.visible = true;

      for (const [key, sprite] of this.diagnosticSprites.entries()) {
        const suffix = key.substring(key.indexOf("-") + 1);
        const isVisible = displaySuffix === "all" || displaySuffix === suffix;
        sprite.visible = isVisible;

        if (isVisible) {
          if (displaySuffix === "all") {
            sprite.tint = this._getColorForSuffix(suffix);
            sprite.alpha = 0.5;
          } else {
            sprite.tint = 0xffffff;
            sprite.alpha = 1.0;
          }
        }
      }
    }
  }

  async updateEffectTargets(targets) {
    if (!this.diagnosticContainer || !this.overlayContainer) return;

    this.diagnosticContainer.removeChildren().forEach((c) => c.destroy());
    this.diagnosticSprites.clear();
    this.overlayContainer.removeChildren().forEach((c) =>
      c.destroy({
        children: true,
      })
    );
    this.overlays.clear();

    const allTargets = new Map([
      ["background", targets.background],
      ...targets.tiles.entries(),
    ]);

    for (const [targetId, targetData] of allTargets.entries()) {
      if (!targetData) continue;

      const activeSuffixes = [];

      for (const suffix of Object.keys(TextureAutoLoader.SUFFIX_MAP)) {
        const texturePath = targetData[suffix];
        const spriteKey = `${targetId}-${suffix}`;

        if (texturePath) {
          activeSuffixes.push(suffix);
          let sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
          this.diagnosticSprites.set(spriteKey, sprite);
          this.diagnosticContainer.addChild(sprite);
          await this._updateSpriteTransform(
            sprite,
            texturePath,
            targetData.rect
          );
        }
      }

      if (activeSuffixes.length > 0) {
        const overlay = new PIXI.Container();
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(10 / canvas.stage.scale.x, 0x00ff00, 0.8);
        graphics.drawRect(
          targetData.rect.x,
          targetData.rect.y,
          targetData.rect.width,
          targetData.rect.height
        );
        overlay.addChild(graphics);

        const labelText = new PIXI.Text(activeSuffixes.join(", "), {
          fontFamily: "Arial",
          fontSize: 24,
          fill: 0x00ff00,
          stroke: "#000000",
          strokeThickness: 4,
          align: "center",
        });
        labelText.x = targetData.rect.x + targetData.rect.width / 2;
        labelText.y = targetData.rect.y + targetData.rect.height / 2;
        labelText.anchor.set(0.5);
        labelText.scale.set(1 / canvas.stage.scale.x);
        overlay.addChild(labelText);

        this.overlays.set(targetId, overlay);
        this.overlayContainer.addChild(overlay);
      }
    }

    this._needsRefresh = true;
  }

  _getColorForSuffix(suffix) {
    let hash = 0;
    for (let i = 0; i < suffix.length; i++) {
      hash = suffix.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = (hash & 0x00ffffff).toString(16).toUpperCase();
    return "0x" + "00000".substring(0, 6 - color.length) + color;
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

  async updateFromConfig(config) {
    const dConfig = config.diagnostic;
    this.visible = config.enabled && dConfig.enabled;
    this._needsRefresh = true;
  }
}