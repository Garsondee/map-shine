import { PIXI, RenderTexture, WRAP_MODES, Texture } from "../pixi-adapter.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { ResizableAnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";

export class MaskedEffectLayer extends ResizableAnimatedCanvasLayer {
  constructor(options) {
    super();
    this.options = options;

    // Properties managed by this base class
    this.maskContainer = null;
    this.combinedMaskTexture = null;
    this.maskSprites = new Map();

    this._needsMaskUpdate = true;

    // Initialize bounds safely - will be updated in _draw if needed
    this.bounds = this._getBounds();

    // Bound listeners, defined in _draw
    this._onPanBound = null;
  }

  _getBounds() {
    if (canvas?.scene?.dimensions?.sceneRect) {
      return canvas.scene.dimensions.sceneRect;
    }
    return new PIXI.Rectangle(0, 0, 1, 1);
  }

  getMaskTexture() {
    return this.combinedMaskTexture;
  }

  computeUnionBounds() {
    const activeMaskSprites = Array.from(this.maskSprites.values()).filter(
      (s) => s.texture?.valid
    );
    if (activeMaskSprites.length === 0) return null;

    // Get bounds in world/canvas space
    let union = activeMaskSprites[0].getBounds().clone();
    for (let i = 1; i < activeMaskSprites.length; i++) {
      union.enlarge(activeMaskSprites[i].getBounds());
    }
    return union;
  }

  async _draw() {
    await super._draw(); // Handles ticker and resize binding, _destroyed flag
    this._needsMaskUpdate = true;
    this.eventMode = "none";

    // Update bounds now that canvas is ready
    this.bounds = this._getBounds();

    this._onPanBound = this._onPan.bind(this);

    const renderer = canvas.app.renderer;
    this.maskContainer = new PIXI.Container();

    this.combinedMaskTexture = PIXI.RenderTexture.create({
      width: renderer.screen.width,
      height: renderer.screen.height,
    });

    // Set CLAMP wrap mode to prevent edge artifacts when sampling
    this.combinedMaskTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;

    // Add pan listener (ticker and resize handled by base class)
    if (!game.modules.get("libwrapper")?.active) {
      Hooks.on("canvasPan", this._onPanBound);
    }
  }

  /**
   * @override
   */
  async _tearDown(options) {
    if (this._destroyed) return;

    // Remove pan listener (ticker and resize handled by base class)
    if (this._onPanBound) Hooks.off("canvasPan", this._onPanBound);

    // Destroy PIXI objects
    this.combinedMaskTexture?.destroy(true);
    
    // CRITICAL FIX: Do NOT destroy baseTextures - they are shared with TextureLoader cache
    // and potentially with Foundry's tile textures. Destroying them causes Foundry's tile
    // teardown to fail when checking isVideo (which accesses texture.baseTexture.resource.source)
    this.maskContainer?.destroy({
      children: true,
      texture: false,  // Don't destroy texture instances (they reference shared baseTextures)
      baseTexture: false,  // NEVER destroy baseTextures - they're shared/cached
    });
    this.maskSprites.clear();

    this.combinedMaskTexture = null;
    this.maskContainer = null;

    await super._tearDown(options); // Handles ticker, resize unbinding and _destroyed flag
  }

  /**
   * Base animation loop. Handles re-rendering the mask when needed.
   * Subclasses should call `super._onAnimate(deltaTime)` at the start of their own loop.
   */

  _onAnimate(_deltaTime) {
    if (this._destroyed) return;
    
    // CRITICAL: Skip all updates during scene transitions
    if (game.mapShine?.transitionActive) return;

    // ✅ FIX: Check master enabled flag FIRST
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) return;

    // ✅ FIX: Check individual effect enabled flag
    const effectKey = this.options?.effectKey || this._effectKey;
    if (effectKey && config) {
      const effectConfig = config[effectKey];
      if (effectConfig && effectConfig.enabled === false) return;
    }

    if (this._needsMaskUpdate) {
      this.renderMask();
      this._needsMaskUpdate = false;
    }
  }

  /**
   * Handles pan events, flagging that the mask needs to be redrawn.
   */
  _onPan() {
    this._needsMaskUpdate = true;
  }

  /**
   * Handles resize events, resizing the mask texture and flagging a redraw.
   */
  _onResize() {
    const renderer = canvas.app.renderer;
    this.combinedMaskTexture?.resize(
      renderer.screen.width,
      renderer.screen.height
    );
    this._needsMaskUpdate = true;
  }

  /**
   * Renders the maskContainer to the combinedMaskTexture.
   */
  renderMask() {
    if (!this.maskContainer || !this.combinedMaskTexture) return;
    
    // CRITICAL: Skip rendering during scene transitions to prevent accessing destroyed objects
    if (game.mapShine?.transitionActive) return;
    
    const renderer = canvas.app.renderer;

    // CRITICAL: Check if BatchRenderer is ready before rendering
    const batchRenderer = renderer.plugins?.batch;
    if (!batchRenderer || !batchRenderer._bufferedElements) {
      return; // Defer rendering until BatchRenderer is initialized
    }

    // Bind the render texture system to our target texture
    renderer.renderTexture.bind(this.combinedMaskTexture);

    // Manually clear the texture to transparent black. This is the correct default
    // state for a mask, where no effect should occur unless explicitly defined by a mask sprite.
    renderer.renderTexture.clear([0.0, 0.0, 0.0, 0.0]);

    // Render the container of mask sprites onto the now-cleared texture.
    // The `clear` option is set to false to prevent overwriting our manual clear.
    // Validate container before rendering
    if (this.maskContainer && !this.maskContainer.destroyed && this.combinedMaskTexture?.valid) {
      renderer.render(this.maskContainer, {
        renderTexture: this.combinedMaskTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: false,
      });
    }

    // It's good practice to unbind the render texture when done.
    renderer.renderTexture.bind(null);
  }

  /**
   * Updates the sprites in the mask container based on discovered effect targets.
   */
  async updateEffectTargets(targets) {
    if (!this.maskContainer) return;

    const maskSuffix = this.options.maskSuffix;
    if (!maskSuffix) {
      console.warn("MaskedEffectLayer | No 'maskSuffix' provided in options.");
      return;
    }

    const validTargetIds = new Set();
    const allTargets = new Map([
      ["background", targets.background],
      ...targets.tiles.entries(),
    ]);

    for (const [id, targetData] of allTargets.entries()) {
      const texturePath = targetData?.[maskSuffix];
      if (!texturePath) continue;

      validTargetIds.add(id);
      let sprite = this.maskSprites.get(id);
      if (!sprite) {
        sprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
        this.maskSprites.set(id, sprite);
        this.maskContainer.addChild(sprite);
      }
      await this._updateSpriteTransform(sprite, texturePath, targetData.rect);
    }

    for (const [id, sprite] of this.maskSprites.entries()) {
      if (!validTargetIds.has(id)) {
        sprite.destroy();
        this.maskSprites.delete(id);
      }
    }
    this._needsMaskUpdate = true;
  }

  /**
   * Helper to update a sprite's texture and transform.
   */
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
}
