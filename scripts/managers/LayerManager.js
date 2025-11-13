/**
 * Manages the registration and configuration of all custom canvas layers for the Map Shine module.
 *
 * This class handles the integration of custom visual effect layers into Foundry VTT's
 * canvas rendering system. It defines layer hierarchies, z-index ordering, and grouping
 * to ensure proper rendering order and visual composition.
 *
 * Layer categories managed:
 * - Background effects (below tiles): backgroundEffectTile, iridescence, structuralShadows
 * - Surface effects (above tiles, below tokens): metallicShine, groundGlow
 * - Environment effects (above tokens): canopy, cloudShadows, ambient
 * - Overhead effects (top layer): overheadEffect
 *
 * Z-index reference:
 * - Background: 20, Tiles: 30, Drawings: 40, Tokens: 100, Lighting: 200, Weather: 300, Fog: 400
 *
 * @class LayerManager
 * @static
 * @since 1.0.0
 */
import { CloudShadowsLayer } from "../effects/CloudShadows.js";
import { CONFIG, Canvas } from "../foundry-adapter.js";
import { MODULE_ID } from "../config/constants.js";
import { BackgroundEffectTileLayer } from "../effects/BackgroundEffectTile.js";
import { IridescenceLayer } from "../effects/Iridescence.js";
import { StructuralShadowsLayer } from "../effects/StructuralShadows.js";
import { GroundGlowLayer } from "../effects/GroundGlow.js";
import { CanopyLayer } from "../effects/Canopy.js";
import { BushLayer, TreeLayer } from "../effects/Vegetation.js";
import { ParticleLayer } from "../effects/Particles.js";
import { LightningLayer } from "../effects/Lightning.js";
import { AmbientLayer } from "../effects/AmbientLayer.js";
import { PrismLayer } from "../effects/Prism.js";
import { BuildingShadowsLayer } from "../effects/BuildingShadows.js";
import { WaterFXLayer } from "../effects/Water.js";
import { FoamLayer } from "../effects/Foam.js";
import { PhysicsRopeLayer } from "../effects/PhysicsRope.js";
import { MetallicShineLayer } from "../effects/MetallicShine.js";
import { HeatDistortionLayer } from "../effects/HeatDistortion.js";
import { OverheadEffectLayer } from "../effects/OverheadEffect.js";
import { CloudDepthLayer } from "../effects/CloudDepth.js";
import { TimeOfDayLayer } from "../effects/TimeOfDay.js";
import { MapPointsLayer } from "../effects/layers-adapter.js";
import { DiagnosticLayer } from "../effects/Diagnostic.js";

export class LayerManager {
  /**
   * Tracks pending layer registrations that need retry attempts
   */
  static _pendingLayers = [];
  static _retryAttempts = 0;
  static _maxRetries = 10;
  static _retryDelays = [100, 200, 500, 1000, 2000, 3000, 5000, 8000, 10000, 15000]; // Progressive delays

  /**
   * Registers all custom canvas layers with Foundry's configuration.
   * Will retry failed registrations with progressive delays.
   */
  static registerLayers() {
    const ambientZIndex = game.settings.get(MODULE_ID, "ambientLayerZIndex");

    // Define z-indices for core Foundry layers for reference.
    // Background: 20, Tiles: 30, Drawings: 40, Tokens: 100, Lighting: 200, Weather: 300, Fog: 400.
    const layers = {};
    this._pendingLayers = [];
    
    const tryAdd = (key, layerClass, group, zIndex) => {
      if (layerClass) {
        layers[key] = { layerClass, group, zIndex };
      } else {
        // Store for retry instead of skipping
        this._pendingLayers.push({ key, group, zIndex });
      }
    };

    // --- Layers Below Tiles (zIndex < 30) ---
    tryAdd("backgroundEffectTile", BackgroundEffectTileLayer, "primary", 23);
    tryAdd("iridescence", IridescenceLayer, "primary", 24);
    tryAdd("structuralShadows", StructuralShadowsLayer, "primary", 26);

    // --- Layers Above Tiles but Below Tokens (30 < zIndex < 100) ---
    tryAdd("groundGlow", GroundGlowLayer, "environment", 210);

    // --- Layers Above Tokens (zIndex > 100) ---
    tryAdd("canopy", CanopyLayer, "environment", 110);
    tryAdd("bush", BushLayer, "environment", 115);
    tryAdd("tree", TreeLayer, "environment", 116);
    tryAdd("cloudShadows", CloudShadowsLayer, "environment", 120);

    // Note: weatherParticleLayer removed - weather system now uses WeatherEffectLayer (PIXI.Container, not CanvasLayer)
    tryAdd("particleLayer", ParticleLayer, "environment", 180);
    tryAdd("lightningLayer", LightningLayer, "environment", 185);

    // --- High-Level Layers & Filters (zIndex > 200) ---
    tryAdd("ambient", AmbientLayer, "environment", ambientZIndex);
    tryAdd("prism", PrismLayer, "primary", 251);
    tryAdd("buildingShadows", BuildingShadowsLayer, "primary", 28);
    tryAdd("waterFX", WaterFXLayer, "primary", 252);
    tryAdd("foam", FoamLayer, "primary", 253);
    tryAdd("physicsRope", PhysicsRopeLayer, "environment", 690);
    tryAdd("metallicShine", MetallicShineLayer, "primary", 35);
    tryAdd("heatDistortion", HeatDistortionLayer, "primary", 253);

    tryAdd("overheadEffect", OverheadEffectLayer, "environment", 700);
    tryAdd("cloudDepth", CloudDepthLayer, "environment", 720);
    tryAdd("timeOfDay", TimeOfDayLayer, "primary", 730);

    // --- UI & Debugging Layers (Highest zIndex) ---
    tryAdd("mapPoints", MapPointsLayer, "interface", 800);
    tryAdd("diagnostic", DiagnosticLayer, "interface", 900);

    Object.assign(CONFIG.Canvas.layers, layers);

    const registeredCount = Object.keys(layers).length;
    const pendingCount = this._pendingLayers.length;

    if (pendingCount > 0) {
      console.log(
        `MapShine | Registered ${registeredCount} layers immediately. ${pendingCount} layers pending (classes not loaded yet). Will retry...`
      );
      this._scheduleRetry();
    } else {
      console.log(
        `MapShine | Successfully registered all ${registeredCount} layers with explicit z-indices. AmbientLayer zIndex set to: ${ambientZIndex}.`
      );
    }
  }

  /**
   * Schedule a retry attempt for pending layer registrations
   */
  static _scheduleRetry() {
    if (this._retryAttempts >= this._maxRetries) {
      console.error(
        `MapShine | FAILED to register ${this._pendingLayers.length} layers after ${this._maxRetries} attempts. Missing classes: ${this._pendingLayers.map(l => l.key).join(", ")}`
      );
      return;
    }

    const delay = this._retryDelays[this._retryAttempts] || 15000;
    this._retryAttempts++;

    setTimeout(() => this._retryPendingLayers(), delay);
  }

  /**
   * Attempt to register previously failed layers
   */
  static _retryPendingLayers() {
    const ambientZIndex = game.settings.get(MODULE_ID, "ambientLayerZIndex");
    const stillPending = [];
    const newlyRegistered = {};

    // Try to resolve each pending layer
    for (const pending of this._pendingLayers) {
      let layerClass = null;

      // Try to resolve the class from global scope
      try {
        switch (pending.key) {
          case "groundGlow":
            layerClass = typeof GroundGlowLayer !== "undefined" ? GroundGlowLayer : null;
            break;
          case "canopy":
            layerClass = typeof CanopyLayer !== "undefined" ? CanopyLayer : null;
            break;
          case "bush":
            layerClass = typeof BushLayer !== "undefined" ? BushLayer : null;
            break;
          case "tree":
            layerClass = typeof TreeLayer !== "undefined" ? TreeLayer : null;
            break;
          case "particleLayer":
            layerClass = typeof ParticleLayer !== "undefined" ? ParticleLayer : null;
            break;
          case "lightningLayer":
            layerClass = typeof LightningLayer !== "undefined" ? LightningLayer : null;
            break;
          case "ambient":
            layerClass = typeof AmbientLayer !== "undefined" ? AmbientLayer : null;
            break;
          case "prism":
            layerClass = typeof PrismLayer !== "undefined" ? PrismLayer : null;
            break;
          case "buildingShadows":
            layerClass = typeof BuildingShadowsLayer !== "undefined" ? BuildingShadowsLayer : null;
            break;
          case "waterFX":
            layerClass = typeof WaterFXLayer !== "undefined" ? WaterFXLayer : null;
            break;
          case "foam":
            layerClass = typeof FoamLayer !== "undefined" ? FoamLayer : null;
            break;
          case "physicsRope":
            layerClass = typeof PhysicsRopeLayer !== "undefined" ? PhysicsRopeLayer : null;
            break;
          case "metallicShine":
            layerClass = typeof MetallicShineLayer !== "undefined" ? MetallicShineLayer : null;
            break;
          case "heatDistortion":
            layerClass = typeof HeatDistortionLayer !== "undefined" ? HeatDistortionLayer : null;
            break;
          case "overheadEffect":
            layerClass = typeof OverheadEffectLayer !== "undefined" ? OverheadEffectLayer : null;
            break;
          case "cloudDepth":
            layerClass = typeof CloudDepthLayer !== "undefined" ? CloudDepthLayer : null;
            break;
          case "timeOfDay":
            layerClass = typeof TimeOfDayLayer !== "undefined" ? TimeOfDayLayer : null;
            break;
          case "mapPoints":
            layerClass = typeof MapPointsLayer !== "undefined" ? MapPointsLayer : null;
            break;
          case "diagnostic":
            layerClass = typeof DiagnosticLayer !== "undefined" ? DiagnosticLayer : null;
            break;
        }
      } catch (error) {
        console.warn(`MapShine | Error checking for ${pending.key}:`, error);
      }

      if (layerClass) {
        // Successfully resolved - add to CONFIG
        newlyRegistered[pending.key] = {
          layerClass,
          group: pending.group,
          zIndex: pending.key === "ambient" ? ambientZIndex : pending.zIndex
        };
        console.log(`MapShine | ✓ Successfully registered layer '${pending.key}' on retry attempt ${this._retryAttempts}`);
      } else {
        // Still not available
        stillPending.push(pending);
      }
    }

    // Apply newly registered layers to CONFIG
    if (Object.keys(newlyRegistered).length > 0) {
      Object.assign(CONFIG.Canvas.layers, newlyRegistered);
    }

    // Update pending list
    this._pendingLayers = stillPending;

    // Continue retrying if needed
    if (this._pendingLayers.length > 0) {
      console.log(
        `MapShine | Retry attempt ${this._retryAttempts}/${this._maxRetries}: ${Object.keys(newlyRegistered).length} registered, ${this._pendingLayers.length} still pending`
      );
      this._scheduleRetry();
    } else {
      console.log(
        `MapShine | ✓ All layers successfully registered after ${this._retryAttempts} retry attempts!`
      );
    }
  }
}