import { MODULE_ID } from "../config/constants.js";
import { ScreenEffectsManager } from "./ScreenEffectsManager.js";
import { NativeAnimation } from "../utils/NativeAnimation.js";
import { UNIVERSAL_EFFECT_DEFAULTS } from "../config/universal-defaults-adapter.js";

export class CombatEffectManager {
  constructor() {
    this._animationState = {
      progress: 0,
    };
    this._animation = null;
    this._combatFilter = null;
    this._originalGlobalTime = 100;
    this._isInitialized = false;
    this._boundOnCombatChange = this._onCombatChange.bind(this);
  }

  initialize() {
    if (this._isInitialized) return;
    this._combatFilter = ScreenEffectsManager.getFilter("combatEffect");
    if (!this._combatFilter) {
      console.error(
        "Map Shine | CombatEffectManager could not find its dedicated filter."
      );
      return;
    }

    const config = game.mapShine.profileManager.activeConfig;
    this._originalGlobalTime = config.timeControl.globalTime;

    this._animationState.progress = game.combats.active?.started ? 1 : 0;

    this._updateEffects(this._animationState.progress);

    Hooks.on("combatStart", () => this._boundOnCombatChange(true));

    Hooks.on("combatEnd", () => this._boundOnCombatChange(false));
    Hooks.on("deleteCombat", () => this._boundOnCombatChange(false));

    this._isInitialized = true;
    console.log("Map Shine | Combat Effect Manager Initialized.");
  }

  destroy() {
    if (!this._isInitialized) return;

    Hooks.off("combatStart", this._boundOnCombatChange);

    Hooks.off("combatEnd", this._boundOnCombatChange);
    Hooks.off("deleteCombat", this._boundOnCombatChange);

    if (this._animation) {
      this._animation.kill();
    }
    this._animation = null;
    this._combatFilter = null;
    this._isInitialized = false;
    console.log("Map Shine | Combat Effect Manager Destroyed.");
  }

  _onCombatChange(inCombat) {
    if (!this._combatFilter) return;

    const ceConfig = {
      enabled: game.settings.get(MODULE_ID, "universal.combatEffect.enabled"),
      duration: game.settings.get(MODULE_ID, "universal.combatEffect.duration"),
      timeScale: game.settings.get(
        MODULE_ID,
        "universal.combatEffect.timeScale"
      ),
      colorCorrection: {
        enabled: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.enabled"
        ),
        saturation: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.saturation"
        ),
        brightness: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.brightness"
        ),
        contrast: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.contrast"
        ),
      },
    };

    if (!ceConfig.enabled) {
      this._updateEffects(0);
      const activeConfig = game.mapShine.profileManager.activeConfig;
      if (activeConfig.timeControl.globalTime < this._originalGlobalTime) {
        foundry.utils.setProperty(
          activeConfig,
          "timeControl.globalTime",
          this._originalGlobalTime
        );
        game.mapShine.profileManager.updateAllSystemsFromConfig();
        if (game.mapShine.debugger) {
          game.mapShine.debugger.eventHandler.updateAllControls();
        }
      }
      return;
    }

    if (this._animation) {
      this._animation.kill();
    }

    const targetProgress = inCombat ? 1 : 0;

    if (inCombat && this._animationState.progress < 1) {
      this._originalGlobalTime =
        game.mapShine.profileManager.activeConfig.timeControl.globalTime;
    }

    // @ts-expect-error - progress property not in type definitions but is valid
    this._animation = NativeAnimation.to(this._animationState, {
      progress: targetProgress,
      duration: ceConfig.duration / 1000,
      ease: "power2.inOut",
      onUpdate: () => this._updateEffects(this._animationState.progress),
      onComplete: () => {
        this._animation = null;
        this._updateEffects(targetProgress);
      },
    });
  }

  _updateEffects(progress) {
    if (!this._combatFilter) return;

    // Construct the config object from individual game settings
    const ceConfig = {
      enabled: game.settings.get(MODULE_ID, "universal.combatEffect.enabled"),
      timeScale: game.settings.get(
        MODULE_ID,
        "universal.combatEffect.timeScale"
      ),
      colorCorrection: {
        ...UNIVERSAL_EFFECT_DEFAULTS.combatEffect.colorCorrection, // Start with defaults
        enabled: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.enabled"
        ),
        saturation: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.saturation"
        ),
        brightness: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.brightness"
        ),
        contrast: game.settings.get(
          MODULE_ID,
          "universal.combatEffect.colorCorrection.contrast"
        ),
      },
    };

    const activeConfig = game.mapShine.profileManager.activeConfig;
    const timeControlPath = "timeControl.globalTime";

    const newTime = lerp(
      this._originalGlobalTime,
      this._originalGlobalTime * ceConfig.timeScale,
      progress
    );

    game.mapShine.timeControl.timeFactor = newTime / 100.0;
    foundry.utils.setProperty(activeConfig, timeControlPath, newTime);

    game.mapShine.profileManager.updateAllSystemsFromConfig({
      timeOnly: true,
    });

    if (game.mapShine.debugger) {
      const slider = game.mapShine.debugger.element.querySelector(
        "#control-timeControl-globalTime"
      );
      if (slider) {
        slider.value = newTime;
        game.mapShine.debugger.eventHandler._updateSliderValue(
          slider.id,
          newTime,
          slider.step
        );
      }
    }

    const u = this._combatFilter.uniforms;
    const cc = ceConfig.colorCorrection;

    this._combatFilter.enabled = progress > 0.001 && cc.enabled;
    u.uIntensity = progress;

    u.uSaturation = cc.saturation;
    u.uBrightness = cc.brightness;
    u.uContrast = cc.contrast;
    u.uExposure = cc.exposure;
    u.uGamma = cc.gamma;
    u.uInBlack = cc.levels.inBlack;
    u.uInWhite = cc.levels.inWhite;
    u.uTemperature = cc.whiteBalance.temperature;
    u.uWbTint = cc.whiteBalance.tint;
    u.uTintAmount = cc.tint.amount;
    u.uTintColor = hexToRgbArray(cc.tint.color);
    u.uInvert = cc.invert;

    u.uSelectiveEnabled = cc.selective.enabled;
    u.uSelectiveColor = hexToRgbArray(cc.selective.color);
    u.uSelectiveHueRange = cc.selective.hueRange;
    u.uSelectiveSatRange = cc.selective.saturationRange;
    u.uSelectiveLumRange = cc.selective.luminanceRange;
    u.uSelectiveTargetLum = cc.selective.targetLuminance;
    u.uSelectiveSoftness = cc.selective.softness;
    u.uSelectiveInvert = cc.selective.invert;
    // @ts-expect-error - Extended properties from defaults
    u.uSelectiveDesaturation = cc.selective.desaturation;
    // @ts-expect-error - Extended properties from defaults
    u.uSelectiveTargetSaturation = cc.selective.targetSaturation;
    // @ts-expect-error - Extended properties from defaults
    u.uSelectiveTargetBrightness = cc.selective.targetBrightness;
  }
}