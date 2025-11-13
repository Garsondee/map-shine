import { PIXI } from "../pixi-adapter.js";
import { AnimatedCanvasLayer } from "./AnimatedCanvasLayer.js";

export class BackgroundEffectTileLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this.backgroundSprites = new Map();
    this.spritesContainer = null;
    this._boundRefresh = this._refreshBackgroundTiles.bind(this);
  }

  async _draw() {
    await super._draw(); // Handles ticker binding and _destroyed flag
    this.eventMode = "none";
    this.spritesContainer = this.addChild(new PIXI.Container());

    Hooks.on("mapShine:targetsRefreshed", this._boundRefresh);

    // Initial population
    this._refreshBackgroundTiles();
  }

  async _tearDown(options) {
    if (this._destroyed) return;

    // Restore original tiles
    for (const tileId of this.backgroundSprites.keys()) {
      const tile = canvas.tiles.get(tileId);
      if (tile) {
        tile.isManagedByBgLayer = false;
        if (tile.mesh) tile.mesh.alpha = 1.0;
      }
    }

    Hooks.off("mapShine:targetsRefreshed", this._boundRefresh);

    this.spritesContainer?.destroy({ children: true });
    this.backgroundSprites.clear();

    await super._tearDown(options); // Handles ticker unbinding and _destroyed flag
  }

  _onAnimate() {
    if (this._destroyed || !this.visible || this.backgroundSprites.size === 0) {
      return;
    }

    // Sync sprite positions with their source tiles
    for (const [id, sprite] of this.backgroundSprites.entries()) {
      const tile = canvas.tiles.get(id);
      if (tile?.texture?.valid && tile.mesh) {
        sprite.position.copyFrom(tile.mesh.position);
        sprite.width = tile.document.width;
        sprite.height = tile.document.height;
        sprite.rotation = tile.mesh.rotation;
        sprite.texture = tile.texture;
        sprite.anchor.copyFrom(tile.mesh.anchor);
      }
    }
  }

  _refreshBackgroundTiles() {
    if (!this.spritesContainer || this._destroyed) return;

    const effectTargets = game.mapShine.effectTargetManager?.targets?.tiles;
    if (!effectTargets) return;

    const currentTargetIds = new Set(effectTargets.keys());

    // Add or update sprites for current targets
    for (const tileId of currentTargetIds) {
      const tile = canvas.tiles.get(tileId);
      // Ensure the tile exists and is not an overhead tile to avoid conflicts
      if (tile && !tile.document.restrictions?.weather) {
        if (!this.backgroundSprites.has(tileId)) {
          const sprite = new PIXI.Sprite(tile.texture);
          this.backgroundSprites.set(tileId, sprite);
          this.spritesContainer.addChild(sprite);
          tile.isManagedByBgLayer = true;
          if (tile.mesh) tile.mesh.alpha = 0;
        }
      }
    }

    // Remove sprites for tiles that are no longer targets
    for (const [id, sprite] of this.backgroundSprites.entries()) {
      if (!currentTargetIds.has(id)) {
        const tile = canvas.tiles.get(id);
        if (tile) {
          tile.isManagedByBgLayer = false;
          if (tile.mesh) tile.mesh.alpha = 1.0;
        }
        sprite.destroy();
        this.backgroundSprites.delete(id);
      }
    }
  }
}
