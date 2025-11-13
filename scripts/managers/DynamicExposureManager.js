import { ScreenEffectsManager } from "./ScreenEffectsManager.js";
import { CoordinateManager } from "./CoordinateManager.js";
import { NativeAnimation } from "../utils/NativeAnimation.js";
import { PIXI } from "../pixi-adapter.js";

export class DynamicExposureManager {
  constructor() {
    this.tokenManager = game.mapShine.tokenManager;

    // State
    this.isInitialized = false;
    this.isIndoors = null; // null, true, or false
    this.lastTriggerTimestamp = 0;
    this.dazzleAnimation = null;
    this.activeTokenId = null;

    // Effect parameters (will be loaded from config)
    this.config = {};

    // PIXI Objects
    this.ccFilter = null;
  }

  initialize() {
    if (this.isInitialized) return;

    this.ccFilter = ScreenEffectsManager.getFilter("colorCorrection");
    if (!this.ccFilter) {
      console.error(
        "Map Shine | DynamicExposureManager: Could not find ColorCorrectionFilter."
      );
      return;
    }

    // Ensure the uniform exists on the filter
    if (this.ccFilter.uniforms.uDynamicExposureBoost === undefined) {
      this.ccFilter.uniforms.uDynamicExposureBoost = 0.0;
    }

    // Bind hooks
    this._boundOnControlToken = this._onControlToken.bind(this);
    this._boundOnUpdateToken = this._onUpdateToken.bind(this);
    Hooks.on("controlToken", this._boundOnControlToken);
    Hooks.on("updateToken", this._boundOnUpdateToken);

    this.isInitialized = true;

    // Perform an initial check on the currently controlled token, if any
    const currentToken = this.tokenManager.getActiveToken();
    if (currentToken) {
      this._onControlToken(currentToken, true);
    }
  }

  _onControlToken(token, controlled) {
    if (this.dazzleAnimation) {
      this.dazzleAnimation.kill();
      this.dazzleAnimation = null;
    }

    if (controlled && token) {
      this.activeTokenId = token.id;
      // Establish the initial state without triggering the effect
      this._updateInitialTokenState(token);
    } else if (!canvas.tokens.controlled.length) {
      this.activeTokenId = null;
      this.isIndoors = null;
    }
  }

  _onUpdateToken(tokenDoc, change) {
    this.config =
      game.mapShine.profileManager.activeConfig.postProcessing.colorCorrection.dynamicExposure;

    if (
      !this.isInitialized ||
      tokenDoc.id !== this.activeTokenId ||
      !this.config.enabled
    ) {
      return;
    }

    // Only react to movement
    if (change.x !== undefined || change.y !== undefined) {
      // We need to check the state at the destination, not the current position.
      // Create a point representing the destination center in world coordinates.
      const dest = {
        x: change.x ?? tokenDoc.x,
        y: change.y ?? tokenDoc.y,
        w: tokenDoc.width * canvas.scene.grid.size,
        h: tokenDoc.height * canvas.scene.grid.size,
      };
      const destCenter = {
        x: dest.x + dest.w / 2,
        y: dest.y + dest.h / 2,
      };
      this._checkTokenStateAtPoint(destCenter, true);
    }
  }

  _updateInitialTokenState(token) {
    if (!token || !game.mapShine.resourceManager) {
      this.isIndoors = null;
      return;
    }

    const outdoorsMask = game.mapShine.resourceManager.getOutdoorsMask();

    if (!outdoorsMask?.valid) {
      this.isIndoors = null;
      return;
    }

    // --- MODIFICATION START ---
    // Use CoordinateManager to calculate screen position.
    const worldPos = token.center;
    const cameraOffset = CoordinateManager.getCameraOffset();
    const canvasScale = CoordinateManager.getCanvasScale();
    const screen = CoordinateManager.getScreenDimensions();

    const screenX = (worldPos.x - cameraOffset.x) * canvasScale;
    const screenY = (worldPos.y - cameraOffset.y) * canvasScale;

    const x = Math.max(0, Math.min(screen.width - 1, Math.round(screenX)));
    const y = Math.max(0, Math.min(screen.height - 1, Math.round(screenY)));
    // --- MODIFICATION END ---

    try {
      const pixelData = canvas.app.renderer.extract.pixels(
        outdoorsMask,
        new PIXI.Rectangle(x, y, 1, 1)
      );
      const maskValue = pixelData[0];
      const isNowOutdoors = maskValue > 128;
      this.isIndoors = !isNowOutdoors;
    } catch {
      // It's safe to ignore extraction errors here, as this is just setting an initial state.
    }
  }

  _checkTokenStateAtPoint(worldPoint, canTriggerEffect = false) {
    if (!worldPoint || !game.mapShine.resourceManager) {
      this.isIndoors = null;
      return;
    }

    const outdoorsMask = game.mapShine.resourceManager.getOutdoorsMask();

    if (!outdoorsMask?.valid) {
      this.isIndoors = null;
      return;
    }

    // --- MODIFICATION START ---
    // Use CoordinateManager to calculate screen position.
    const cameraOffset = CoordinateManager.getCameraOffset();
    const canvasScale = CoordinateManager.getCanvasScale();
    const screen = CoordinateManager.getScreenDimensions();

    const screenX = (worldPoint.x - cameraOffset.x) * canvasScale;
    const screenY = (worldPoint.y - cameraOffset.y) * canvasScale;

    const x = Math.max(0, Math.min(screen.width - 1, Math.round(screenX)));
    const y = Math.max(0, Math.min(screen.height - 1, Math.round(screenY)));
    // --- MODIFICATION END ---

    try {
      const pixelData = canvas.app.renderer.extract.pixels(
        outdoorsMask,
        new PIXI.Rectangle(x, y, 1, 1)
      );
      const maskValue = pixelData[0];

      // Corrected Logic: "Outdoors" is where the _Outdoors mask is bright.
      const isNowOutdoors = maskValue > 128;
      const wasIndoors = this.isIndoors === true;

      // Update the state for the *next* check, based on the destination of the *current* move.
      this.isIndoors = !isNowOutdoors;

      // Check for the specific transition from indoors (dark) to outdoors (bright).
      if (canTriggerEffect && wasIndoors && isNowOutdoors) {
        this._triggerDazzleEffect();
      }
    } catch {
      // This can happen if the texture is not yet ready on the GPU.
      // It's safe to ignore and try again on the next movement.
    }
  }

  _triggerDazzleEffect() {
    this.config =
      game.mapShine.profileManager.activeConfig.postProcessing.colorCorrection.dynamicExposure;

    if (Date.now() - this.lastTriggerTimestamp < this.config.resetPeriod) {
      return; // Effect is on cooldown
    }

    this.lastTriggerTimestamp = Date.now();

    if (this.dazzleAnimation) {
      this.dazzleAnimation.kill();
    }

    // Animate the exposure boost using the native animation helper
    this.ccFilter.uniforms.uDynamicExposureBoost = this.config.intensity;
    this.dazzleAnimation = NativeAnimation.to(this.ccFilter.uniforms, {
      uDynamicExposureBoost: 0,
      duration: this.config.duration / 1000,
      ease: "power2.out",
      onComplete: () => {
        this.dazzleAnimation = null;
      },
    });
  }

  destroy() {
    if (!this.isInitialized) return;
    this.isInitialized = false;

    Hooks.off("controlToken", this._boundOnControlToken);
    Hooks.off("updateToken", this._boundOnUpdateToken);

    if (this.dazzleAnimation) {
      this.dazzleAnimation.kill();
      this.dazzleAnimation = null;
    }

    if (this.ccFilter && !this.ccFilter.destroyed) {
      this.ccFilter.uniforms.uDynamicExposureBoost = 0.0;
    }

    this.ccFilter = null;
    this.activeTokenId = null;
  }
}