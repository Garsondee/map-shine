import { PIXI, RenderTexture } from "../pixi-adapter.js";
import { CoordinateManager } from "./CoordinateManager.js";

export class DynamicTokenMaskManager {
  constructor(canvas) {
    this.canvas = canvas;
    if (!this.canvas?.app?.renderer) {
      console.error(
        "DynamicTokenMaskManager | Cannot initialize without a canvas renderer."
      );
      return;
    }
    console.log("DynamicTokenMaskManager | Initializing with sprite pooling.");

    const screen = CoordinateManager.getScreenDimensions();

    // PERFORMANCE OPTIMIZATION: Use half-resolution for token mask
    // Soft-edged effects don't need full resolution
    const halfWidth = Math.floor(screen.width / 2);
    const halfHeight = Math.floor(screen.height / 2);

    this.renderTexture = PIXI.RenderTexture.create({
      width: halfWidth,
      height: halfHeight,
    });

    this.tokenContainer = new PIXI.Container();
    this.tokenSprites = new Map();
    this._needsUpdate = true;
    this._destroyed = false;

    this._frameCount = 0;
    this.updateFrequency = 30;

    this._boundOnTokenChange = this._requestUpdate.bind(this);

    Hooks.on("createToken", this._boundOnTokenChange);
    Hooks.on("deleteToken", this._boundOnTokenChange);
    Hooks.on("canvasPan", this._boundOnTokenChange);

    this._boundOnAnimate = () => {
      if (this._destroyed || !this.canvas?.stage?.transform) return;

      this._frameCount++;
      const isNthFrame = this._frameCount % this.updateFrequency === 0;

      if (this._needsUpdate || isNthFrame) {
        this.renderMask();
        this._needsUpdate = false;
      }
    };
    
    try {
      this.canvas.app.ticker.add(this._boundOnAnimate);
    } catch (error) {
      console.error('DynamicTokenMaskManager | Failed to add ticker:', error);
      // Don't add the ticker if there's an error
    }

    // Register resize handler
    this._boundOnResize = this._onResize.bind(this);
    window.addEventListener("resize", this._boundOnResize);

    this.renderMask();
  }

  _requestUpdate() {
    this._needsUpdate = true;
  }

  renderMask() {
    if (
      this._destroyed ||
      !this.tokenContainer ||
      !this.canvas?.tokens?.placeables
    )
      return;
    
    // CRITICAL: Skip rendering during scene transitions to prevent accessing destroyed tokens
    if (game.mapShine.transitionActive) return;
    
    const renderer = this.canvas.app.renderer;
    
    // Skip rendering if renderer context isn't ready
    if (!renderer?.gl && !renderer?.context) return;
    
    // Skip if BatchRenderer isn't initialized yet
    const batchRenderer = renderer.plugins?.batch;
    if (!batchRenderer || !batchRenderer._aIndex) return;

    const currentTokenIds = new Set();

    for (const token of this.canvas.tokens.placeables) {
      // Validate token texture and baseTexture before creating sprite
      if (!token.visible || !token.texture?.valid || !token.texture?.baseTexture?.valid || token.document.hidden) {
        continue;
      }
      currentTokenIds.add(token.id);

      let sprite = this.tokenSprites.get(token.id);

      if (!sprite) {
        sprite = new PIXI.Sprite(token.texture);
        sprite.tint = 0xffffff;
        this.tokenSprites.set(token.id, sprite);
        this.tokenContainer.addChild(sprite);
      }

      if (sprite.texture !== token.texture && token.texture?.baseTexture?.valid) {
        sprite.texture = token.texture;
      }

      const anchorX = token.document.texture.anchorX ?? 0.5;
      const anchorY = token.document.texture.anchorY ?? 0.5;
      sprite.anchor.set(anchorX, anchorY);
      sprite.position.set(token.center.x, token.center.y);
      sprite.width = token.w;
      sprite.height = token.h;
      sprite.rotation = Math.toRadians(token.document.rotation);
    }

    for (const [tokenId, sprite] of this.tokenSprites.entries()) {
      if (!currentTokenIds.has(tokenId)) {
        sprite.destroy();
        this.tokenSprites.delete(tokenId);
      }
    }

    if (!this.canvas?.stage?.transform) return;

    // Validate container, its children's textures, and render texture before rendering
    const hasValidChildren = this.tokenContainer?.children?.every(
      child => !child.texture || (child.texture.baseTexture && child.texture.baseTexture.valid)
    ) ?? false;
    
    if (this.tokenContainer && !this.tokenContainer.destroyed && this.renderTexture?.valid && hasValidChildren) {
      renderer.render(this.tokenContainer, {
        renderTexture: this.renderTexture,
        transform: this.canvas.stage.transform.worldTransform,
        clear: true,
      });
    } else if (!hasValidChildren) {
      console.warn("DynamicTokenMaskManager | Container has children with invalid textures, skipping render");
    }
  }

  getMaskTexture() {
    return this.renderTexture;
  }

  _onResize() {
    if (this._destroyed) return;
    const screen = CoordinateManager.getScreenDimensions();
    const halfWidth = Math.floor(screen.width / 2);
    const halfHeight = Math.floor(screen.height / 2);

    this.renderTexture?.resize(halfWidth, halfHeight);
    this._needsUpdate = true;
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    console.log("DynamicTokenMaskManager | Destroying.");
    Hooks.off("createToken", this._boundOnTokenChange);
    Hooks.off("deleteToken", this._boundOnTokenChange);
    Hooks.off("canvasPan", this._boundOnTokenChange);
    this.canvas.app.ticker.remove(this._boundOnAnimate);
    window.removeEventListener("resize", this._boundOnResize);

    this.renderTexture?.destroy(true);
    for (const sprite of this.tokenSprites.values()) {
      sprite.destroy();
    }
    this.tokenSprites.clear();
    this.tokenContainer?.destroy({
      children: true,
    });
    this.renderTexture = null;
    this.tokenContainer = null;
  }
}