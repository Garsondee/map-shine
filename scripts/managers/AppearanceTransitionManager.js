import { PIXI } from "../pixi-adapter.js";
import { NativeAnimation } from "../utils/NativeAnimation.js";
import { hexToRgbArray, lerp } from "../utils/ColorUtils.js";
import { ParticleLayer } from "../effects/Particles.js";
import { BuildingShadowsLayer, TimeOfDayLayer, MaskedEffectLayer, SmellyFliesLayer } from "../effects/layers-adapter.js";

export class AppearanceTransitionManager {
  constructor(profileManager) {
    this.profileManager = profileManager;
    this.activeTransition = null;
    this.status = "idle"; // "idle", "transitioning", "previewing"
    this.statusMessage = "Idle";
    /** @type {(status: string, message: string) => void} */
    this._updateUICallback = (_status, _message) => {};
    this._configBeforePreview = null;
  }

  onStatusUpdate(callback) {
    this._updateUICallback = callback;
  }

  _setStatus(status, message) {
    this.status = status;
    this.statusMessage = message;
    if (typeof this._updateUICallback === "function") {
      this._updateUICallback(status, message);
    }
  }

  stop() {
    if (this.activeTransition) {
      this.activeTransition.kill();
      this.activeTransition = null;
    }
    game.mapShine.transitionActive = false;
  }

  _interpolateConfigs(startConfig, endConfig, progress) {
    const interpolated = foundry.utils.deepClone(startConfig);
    this._recursiveInterpolate(interpolated, startConfig, endConfig, progress);
    return interpolated;
  }

  _recursiveInterpolate(target, start, end, progress) {
    for (const key in end) {
      // Exclude buildingShadows from the interpolation process.
      if (key === "buildingShadows") continue;

      if (start?.[key] === undefined) {
        target[key] = foundry.utils.deepClone(end[key]);
        continue;
      }

      const startVal = start[key];
      const endVal = end[key];
      const endType = typeof endVal;

      if (endType === "number" && typeof startVal === "number") {
        target[key] = lerp(startVal, endVal, progress);
      } else if (
        endType === "string" &&
        endVal.startsWith("#") &&
        typeof startVal === "string" &&
        startVal.startsWith("#")
      ) {
        const startRgb = hexToRgbArray(startVal);
        const endRgb = hexToRgbArray(endVal);
        const lerpedRgb = [
          lerp(startRgb[0], endRgb[0], progress),
          lerp(startRgb[1], endRgb[1], progress),
          lerp(startRgb[2], endRgb[2], progress),
        ];
        // Use the PIXI.Color constructor instead of the deprecated fromRGB method.

        target[key] = new PIXI.Color(lerpedRgb).toHex();
      } else if (
        endType === "object" &&
        endVal !== null &&
        !Array.isArray(endVal)
      ) {
        if (
          typeof startVal === "object" &&
          startVal !== null &&
          !Array.isArray(startVal)
        ) {
          this._recursiveInterpolate(target[key], startVal, endVal, progress);
        } else {
          // Type mismatch (e.g., number to object), snap at the end
          target[key] =
            progress >= 1.0
              ? foundry.utils.deepClone(endVal)
              : foundry.utils.deepClone(startVal);
        }
      } else {
        // Snap booleans, strings, arrays, etc. at the end of the transition
        target[key] =
          progress >= 1.0
            ? foundry.utils.deepClone(endVal)
            : foundry.utils.deepClone(startVal);
      }
    }
  }

  async transition(startConfig, endConfig, duration, isPreview = false) {
    this.stop();
    this._configBeforePreview = null; // A transition always clears any preview state.

    // Handle zero-duration transitions instantly without animation.
    if (duration === 0) {
      this.profileManager.activeConfig = endConfig;
      await this.profileManager.updateAllSystemsFromConfig();
      // Also broadcast the final time for any listeners like the clock.
      // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
      Hooks.callAll("mapShine:timeChanged", endConfig.timeOfDay.currentTime);
      this._setStatus("idle", "Transition complete (instant)");
      return;
    }

    game.mapShine.transitionActive = true;

    // Instantly update particle systems to their final state.
    this.profileManager.activeConfig = endConfig;
    const particleLayers = canvas.layers.filter(
      (l) => l instanceof ParticleLayer || l instanceof SmellyFliesLayer
    );
    for (const layer of particleLayers) {
      if (typeof layer.updateFromConfig === "function") {
        await layer.updateFromConfig(endConfig, {});
      }
    }
    this.profileManager.activeConfig = startConfig;

    return new Promise((resolve) => {
      const transitionState = {
        progress: 0,
      };
      const statusType = isPreview ? "previewing" : "transitioning";
      const startMessage = isPreview
        ? "Previewing transition..."
        : "Transitioning...";
      this._setStatus(statusType, startMessage);
      this.activeTransition = NativeAnimation.to(transitionState, {
        progress: 1,
        duration: duration / 1000,
        ease: "power1.inOut",
        onUpdate: () => {
          const interpolatedConfig = this._interpolateConfigs(
            startConfig,
            endConfig,

            transitionState.progress
          );
          this.profileManager.activeConfig = interpolatedConfig;
          this.profileManager.updateAllSystemsFromConfig({
            skipParticles: true,
          });
          // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
          Hooks.callAll(
            "mapShine:timeChanged",
            interpolatedConfig.timeOfDay.currentTime
          );
          const percent = Math.round(transitionState.progress * 100);
          this._setStatus(
            statusType,
            `${isPreview ? "Previewing" : "Transitioning"}... (${percent}%)`
          );
        },
        onComplete: async () => {
          this.profileManager.activeConfig = endConfig;
          game.mapShine.transitionActive = false;

          const buildingShadowsLayer = canvas.layers.find(
            (l) => l instanceof BuildingShadowsLayer
          );
          if (buildingShadowsLayer) {
            await buildingShadowsLayer.rebuildEffect();
          }
          const timeOfDayLayer = canvas.layers.find(
            (l) => l instanceof TimeOfDayLayer
          );
          if (timeOfDayLayer) {
            await timeOfDayLayer.rebuildEffect();
          }

          for (const layer of canvas.layers) {
            if (layer instanceof MaskedEffectLayer) {
              layer._needsMaskUpdate = true;
            }
          }
          await this.profileManager.updateAllSystemsFromConfig();
          // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
          Hooks.callAll(
            "mapShine:timeChanged",
            endConfig.timeOfDay.currentTime
          );
          this._setStatus("idle", "Transition complete");
          this.activeTransition = null;
          resolve();
        },
      });
    });
  }

  async preview(config) {
    this.stop();
    this._setStatus("previewing", "Preview active");

    // Store the config that we should revert to when the preview ends.
    this._configBeforePreview = this.profileManager.getCurrentConfig();

    // Set the active config to the one being previewed.
    this.profileManager.activeConfig = config;
    await this.profileManager.updateAllSystemsFromConfig();
  }

  async endPreview() {
    if (this.status !== "previewing") return;
    this.stop();

    // Revert to the config we saved before the preview started, with a fallback.
    this.profileManager.activeConfig =
      this._configBeforePreview || this.profileManager.getCurrentConfig();
    this._configBeforePreview = null; // Clean up the stored state.

    await this.profileManager.updateAllSystemsFromConfig();
    this._setStatus("idle", "Preview ended");
  }
}