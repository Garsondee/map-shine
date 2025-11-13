import { PIXI, RenderTexture, LINE_CAP } from "../pixi-adapter.js";
import { CoordinateManager } from "./CoordinateManager.js";
import { MapPointsManager } from "./map-points-adapter.js";
import { MODULE_ID } from "../config/constants.js";

export class GeometryMaskManager {
  constructor() {
    this.renderer = canvas.app?.renderer;
    this.masks = new Map(); // Key: effectTarget, Value: { texture: PIXI.RenderTexture, graphics: PIXI.Graphics }
    this._needsUpdate = true;
    this._destroyed = false;
    this._mapPointsInitialized = false; // Flag to ensure the initial point discovery runs only once.
    this._changedGroupId = null; // Track which group changed to enable targeted emitter rebuild

    this._boundOnMapPointsUpdated = this._onMapPointsUpdated.bind(this);
    this._boundOnPan = this.requestUpdate.bind(this);
    this._boundOnResize = this._onResize.bind(this);
  }

  initialize() {
    if (!this.renderer) {
      console.error(
        "GeometryMaskManager | Cannot initialize without a renderer."
      );
      return;
    }

    // Reset the flag for each new scene to allow the initialization poll to run again.
    this._mapPointsInitialized = false;

    // Do NOT create any textures here. They will be created on-demand.

    Hooks.on("mapShine:mapPointsUpdated", this._boundOnMapPointsUpdated);
    Hooks.on("canvasPan", this._boundOnPan);
    window.addEventListener("resize", this._boundOnResize);

    this.requestUpdate();
    console.log(
      `Map Shine | GeometryMaskManager initialized (Lazy Texture Allocation).`
    );
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    Hooks.off("mapShine:mapPointsUpdated", this._boundOnMapPointsUpdated);
    Hooks.off("canvasPan", this._boundOnPan);
    window.removeEventListener("resize", this._boundOnResize);

    for (const { texture, graphics } of this.masks.values()) {
      texture.destroy(true);
      graphics.destroy();
    }
    this.masks.clear();
    console.log("Map Shine | GeometryMaskManager destroyed.");
  }

  /**
   * Ensures a mask texture and graphics object exist for a given effect key.
   * Creates them on-demand if they do not.
   * @param {string} effectKey The effect identifier (e.g., 'sparks').
   * @private
   */
  _ensureMaskExists(effectKey) {
    if (!this.masks.has(effectKey)) {
      const screen = CoordinateManager.getScreenDimensions();
      const renderTexture = RenderTexture.create({
        width: screen.width,
        height: screen.height,
      });
      const graphics = new PIXI.Graphics();

      this.masks.set(effectKey, {
        texture: renderTexture,
        graphics,
      });
    }
  }

  /**
   * Handler for map points updated hook. Captures which group changed for targeted emitter rebuild.
   */
  _onMapPointsUpdated(data) {
    // Store which group changed (created, updated, or deleted)
    this._changedGroupId =
      data?.created || data?.updated || data?.deleted || null;
    this.requestUpdate();
  }

  /**
   * Flags that the masks need to be re-rendered on the next animation frame.
   * This is the single, consolidated entry point for requesting an update.
   */
  requestUpdate() {
    this._needsUpdate = true;
  }

  _onResize() {
    if (!this.renderer) return;
    const screen = CoordinateManager.getScreenDimensions();
    // Only resize textures that have already been created.
    for (const { texture } of this.masks.values()) {
      texture.resize(screen.width, screen.height);
    }
    this.requestUpdate();
  }

  /**
   * This method is called by the main animation loop (ParticleLayer._onAnimate).
   * It is the single source of truth for deciding when to render masks and notify other systems.
   */
  update() {
    // --- ROBUST INITIALIZATION POLLING ---
    // This block handles the initial discovery of map points when a scene loads.
    if (!this._mapPointsInitialized) {
      const flagName = MapPointsManager?.FLAG_NAME;
      if (flagName) {
        const groupsData = canvas.scene.getFlag(MODULE_ID, flagName);
        if (groupsData !== undefined) {
          this._mapPointsInitialized = true;
          // If groups exist on first load, flag an update to render them.
          if (!foundry.utils.isEmpty(groupsData)) {
            this._needsUpdate = true;
          }
        }
      }
    }
    // --- END POLLING ---

    // If no update has been requested and the manager is not destroyed, do nothing.
    if (!this._needsUpdate || this._destroyed) return;

    // Perform the render.
    this._renderAllMasks();
    // Reset the flag so we don't re-render unnecessarily on the next frame.
    this._needsUpdate = false;

    // Defer the notification to the next animation frame.
    // This ensures the GPU has processed the render command before other systems try to use the texture.
    const changedGroupId = this._changedGroupId;
    this._changedGroupId = null; // Clear after capturing
    requestAnimationFrame(() => {
      if (this._destroyed) return;
      // console.log(
      //   "Map Shine | GeometryMaskManager: Masks rendered, notifying particle systems.",
      //   changedGroupId ? `Changed group: ${changedGroupId}` : "(no specific group)"
      // );
      // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
      Hooks.callAll("mapShine:masksRendered", { changedGroupId });
    });
  }

  _renderAllMasks() {
    // console.log("Map Shine | GeometryMaskManager: Rendering all masks...");
    // Clear all existing graphics objects first
    for (const { graphics } of this.masks.values()) {
      graphics.clear();
    }

    const groups = (MapPointsManager && typeof MapPointsManager.getGroups === "function")
      ? MapPointsManager.getGroups()
      : null;
    if (foundry.utils.isEmpty(groups)) {
      // console.log(
      //   "Map Shine | GeometryMaskManager: No groups found, skipping render."
      // );
      return;
    }

    // Populate graphics objects based on point groups
    let renderedCount = 0;
    for (const group of Object.values(groups)) {
      if (!group.isEffectSource || !group.effectTarget) continue;

      // LAZY INSTANTIATION: Ensure mask exists for this effect before drawing
      this._ensureMaskExists(group.effectTarget);

      const { graphics } = this.masks.get(group.effectTarget);
      const pointRadius = 16; // World-space radius for point sources
      const lineThickness = 24; // World-space thickness for line sources

      switch (group.type) {
        case "point":
          graphics.beginFill(0xffffff);
          for (const p of group.points) {
            graphics.drawCircle(p.x, p.y, pointRadius);
          }
          graphics.endFill();
          break;

        case "line":
          graphics.lineStyle({ width: lineThickness, color: 0xffffff, cap: LINE_CAP.ROUND });
          if (group.points.length > 0) {
            graphics.moveTo(group.points[0].x, group.points[0].y);
            for (let i = 1; i < group.points.length; i++) {
              graphics.lineTo(group.points[i].x, group.points[i].y);
            }
          }
          graphics.lineStyle({ width: 0 }); // Reset line style
          break;

        case "area":
          if (group.points.length > 2 && !group.isBroken) {
            graphics.beginFill(0xffffff);
            graphics.drawPolygon(group.points);
            graphics.endFill();
            renderedCount++;
          }
          break;
      }
    }

    // CRITICAL: Check if BatchRenderer is ready before rendering
    const batchRenderer = this.renderer.plugins?.batch;
    if (!batchRenderer || !batchRenderer._bufferedElements) {
      return; // Defer rendering until BatchRenderer is initialized
    }

    // Render each graphics object to its texture
    for (const { graphics, texture } of this.masks.values()) {
      const renderContainer = new PIXI.Container();
      renderContainer.addChild(graphics);

      // Apply the world-to-screen transformation directly to the container.
      renderContainer.transform.setFromMatrix(canvas.stage.transform.worldTransform);

      // Render the pre-transformed container.
      this.renderer.render(renderContainer, { renderTexture: texture, clear: true });

      // Clean up the temporary container.
      renderContainer.removeChild(graphics);
      renderContainer.destroy();
    }
    // console.log(`Map Shine | GeometryMaskManager: Rendered ${renderedCount} effect groups to masks.`);
  }

  /**
   * Retrieves a generated mask for a specific effect.
   * Creates the texture on-demand if it doesn't exist.
   * @param {string} effectKey The key of the effect (e.g., 'sparks').
   * @returns {PIXI.RenderTexture | null} The mask texture, or null if not found.
   */
  getMask(effectKey) {
    this._ensureMaskExists(effectKey);
    return this.masks.get(effectKey)?.texture || null;
  }
}