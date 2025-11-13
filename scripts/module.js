/**
 * @fileoverview Map Shine - Advanced Visual Effects Module for Foundry VTT
 *
 * The major objective of this module is to provide map makers with a range
 * of new tools for producing highly specific visual effects.
 *
 * Ultimately, all effects are designed to activate automatically when a
 * correctly named texture is found. This means map makers only need to
 * create the specific maps they want to enable the corresponding features.
 *
 * Features include:
 * - Metallic shine effects with customizable materials
 * - Advanced color correction and post-processing filters
 * - Scene transition effects with customizable overlays
 * - Combat and pause effects with visual feedback
 * - Particle systems and atmospheric effects
 * - Real-time shader-based visual enhancements
 *
 * @author Mythica Machina - Ingram Blakelock
 * 
 * Remember that you will need to update the module.json file in the root too when changing version.
 * @version 1.3.00 - The great division is finished. The module.js file has had it's contents scattered to the winds. Will the module ever work again? Who knows.
 *
 * @requires foundry ^13+
 * @requires pixi.js ^7.4.3
 *
 * 
 * @TODO: FUN IDEA - Horror world vision. Basically the ability to quickly swap the appearance of the background with a different background for a horror vibe.
 * @TODO: Screen Overlay effects, should be able to happen on only one player or something like that.
 *
 * @TODO: IMPORTANT. Make a video showing off your maps and get on the artist commision websites. You could make a mint.
 *
 */

import { CoordinateManager } from "./managers/CoordinateManager.js";
import { TokenManager } from "./managers/TokenManager.js";
import { AmbientLayer } from "./effects/AmbientLayer.js";
import { FireToneCurveFilter } from "./effects/FireToneCurveFilter.js";
import { hexToRgbArray, lerp } from "./utils/ColorUtils.js";
import { LoadingUI } from "./ui/LoadingUI.js";
import { MemoryProfiler } from "./utils/MemoryProfiler.js";
import { TextureLoader } from "./utils/TextureLoader.js";
import { RenderTexturePool } from "./utils/RenderTexturePool.js";
import { AnimatedCanvasLayer, ResizableAnimatedCanvasLayer } from "./effects/AnimatedCanvasLayer.js";
import { MODULE_ID, MAX_DELTA_TIME, TEMP_CLIPBOARD_STORAGE } from "./config/constants.js";
import { BLEND_MODE_OPTIONS } from "./config/blend-modes.js";
import { GRADIENT_PRESETS, LUT_PRESETS, EFFECT_SOURCE_OPTIONS, ROPE_TYPE_PRESETS } from "./config/presets.js";
import { FONT_CHOICES } from "./config/fonts.js";
import { COLOR_CORRECTION_PRESETS } from "./config/color-correction-presets.js";
import { UNIVERSAL_EFFECT_DEFAULTS } from "./config/universal-defaults.js";
import { DebuggerUIBuilder } from "./ui/MainUI.js";
import { validateFilter, safeCreateFilter, cleanFilterArray, safeApplyFilters } from "./utils/filter-utils.js";
import { NativeAnimation } from "./utils/NativeAnimation.js";
import { FontLoader } from "./utils/FontLoader.js";
import {
  generateBehaviorListsFromGradient,
  generateEmissiveColorListFromGradient
} from "./utils/ParticleUtils.js";
import { MODULE_DEFAULTS } from "./config/MODULE_DEFAULTS.js";
import { SettingsManager } from "./managers/SettingsManager.js";
import { SystemStatusManager } from "./managers/SystemStatusManager.js";
import { TextureAutoLoader } from "./utils/TextureAutoLoader.js";
import "./managers/LazyAccordionManager.js"; // Expose LazyAccordionManager to globalThis
import { WeatherStateManager } from "./weather/WeatherStateManager.js";
import { STATES } from "./weather/states-adapter.js";
import { TransitionRegistry } from "./weather/TransitionRegistry.js";
import { EffectRegistry } from "./weather/EffectRegistry.js";
import { WeatherEffectLayer } from "./weather/WeatherEffectLayer.js";
import { ScreenEffectsManager } from "./managers/ScreenEffectsManager.js";
import { ParticleEffectController } from "./effects/Particles.js";
import { WaterFXLayer } from "./effects/Water.js";
import { TreeLayer, BushLayer } from "./effects/Vegetation.js";
import { CloudShadowsLayer } from "./effects/CloudShadows.js";
import { PARTICLE_EFFECT_DEFINITIONS } from "./config/particle-definitions.js";
import { Texture, RenderTexture, Filter, MIPMAP_MODES, SCALE_MODES, BLEND_MODES, Uint8Array, Float32Array } from "./pixi-adapter.js";
import { MapShineInitialiser } from "./core/MapShineInitialiser.js";


// PIXI and typed array aliases provided by pixi-adapter imports above for analyzer visibility.
import { PropertyNode, BehaviorOrder } from "./particles/particle-adapter.js";

// Console log to announce the module and module version
console.log("Map Shine Module Loading", "color: #00b3ff; font-size: 32px; font-weight: bold;");
// Console log to announce the module and module version
console.log("GNU: Terry Pratchett. You are missed.", "color: #00b3ff; font-size: 12px; font-weight: bold;");



 /**
 * Default configuration settings for all universal effects in the Map Shine module.
 * These settings define the initial state and behavior of various visual effects
 * including scene transitions, pause effects, combat effects, and font management.
 *
 * @constant {Object}
 * @property {Object} sceneTransition - Configuration for scene transition effects
 * @property {Object} pauseEffect - Configuration for pause overlay effects
 * @property {Object} combatEffect - Configuration for combat visual effects
 * @property {Object} fontManager - Font family configurations for UI elements
 */
// UNIVERSAL_EFFECT_DEFAULTS has been moved to scripts/config/universal-defaults.js

/**
 * Setting key for storing world-level default configurations for individual effects.
 * Used with Foundry VTT's game settings to persist world-level defaults.
 * Structure: { effectKey: effectConfig, ... } (e.g., { fire: {...}, baseShine: {...} }
 * @constant {string}
 */
const WORLD_DEFAULTS_SETTING = "worldDefaults";











/**
 * LoadingScreen wrapper class that uses the unified LoadingUI component
 * Maintains the same API as the original LoadingScreen for compatibility
 */
export class LoadingScreen {
  constructor() {
    this.fadeOutDuration = 500;
    this.minDisplayTime = 1500;
    this.startTime = 0;

    // Create the unified LoadingUI instance
    this.ui = new LoadingUI({
      elementId: "map-shine-loading-screen",
      title: game.world?.title || "Loading...",
      fadeOutDuration: this.fadeOutDuration,
      defaults: {
        randomHints: UNIVERSAL_EFFECT_DEFAULTS.sceneTransition.randomHints,
        // Note: subheading will fall back to loading-screen-subheading setting
        // This is intentional - initial loading uses different setting than transitions
      },
    });
  }

  // Proxy property for backward compatibility
  get element() {
    return this.ui.element;
  }

  get fillElement() {
    return this.ui.fillElement;
  }

  get statusTextElement() {
    return this.ui.statusTextElement;
  }

  show() {
    if (this.element) return;
    this.startTime = Date.now();

    // Use the unified LoadingUI to show the screen
    this.ui.show();

    // Set initial opacity to 1 (visible immediately)
    if (this.element) {
      this.element.style.opacity = "1";
    }

    // Hide the default Foundry VTT loading element
    const foundryLoading = document.getElementById("loading");
    if (foundryLoading) {
      foundryLoading.style.display = "none";
    }
  }

  setProgress(progress, message) {
    this.ui.setProgress(progress, message);
  }

  setStatus(message) {
    this.ui.setStatus(message);
  }

  async hide() {
    if (!this.element) return;

    const elapsed = Date.now() - this.startTime;
    const remainingTime = Math.max(0, this.minDisplayTime - elapsed);
    await new Promise((resolve) => setTimeout(resolve, remainingTime));

    // Fade out the UI
    await this.ui.fadeOut();

    // Destroy the UI
    this.ui.destroy();

    // Restore Foundry loading element
    const foundryLoading = document.getElementById("loading");
    if (foundryLoading) {
      foundryLoading.style.display = "";
    }
  }
}





// TokenManager has been moved to scripts/managers/TokenManager.js

export class MapPointsManager {
  static FLAG_NAME = "mapPointGroups";

  /**
   * Retrieves all map point groups from the current scene.
   * @returns {object} The object containing all point groups, or an empty object if none exist.
   */
  static getGroups() {
    if (!canvas.scene?.id) {
      // This is a genuine error state we should still check for.
      console.error(
        "MapShine | FATAL: MapPointsManager.getGroups() was called but canvas.scene is not fully available."
      );
      return {};
    }

    // This call might return 'undefined' on initial load before flags are ready.
    const groupsData = canvas.scene.getFlag(MODULE_ID, this.FLAG_NAME);

    // Debug: Log the raw groups data to detect duplicates or corruption
    if (groupsData) {
      const groupIds = Object.keys(groupsData);
      // console.log(`MapShine | getGroups() returning ${groupIds.length} groups:`, groupIds.map(id => {
      //   const g = groupsData[id];
      //   return `[${id}] ${g.label} (${g.points?.length ?? 0} pts)`;
      // }).join(', '));
    }

    // Return the data if it exists, otherwise return an empty object.
    // This prevents the system from crashing if the data isn't ready yet.
    return groupsData ?? {};
  }

  /**
   * Retrieves a single map point group by its ID.
   * @param {string} groupId The ID of the group to retrieve.
   * @returns {object|undefined} The group object, or undefined if not found.
   */
  static getGroup(groupId) {
    const groups = this.getGroups();
    return groups[groupId];
  }

  /**
   * Creates a new group and stores it in the scene's flags.
   * @param {Object} options
   * @param {string} [options.label="New Group"] The label for the group.
   * @param {string} [options.type="point"] The type of group ('point', 'line', 'area').
   * @param {Object} [options.ropeSettings] Optional rope-specific settings to apply immediately
   * @returns {Promise<string>} The ID of the newly created group.
   */
  static async createGroup({
    label = "New Group",
    type = "point",
    ropeSettings = null,
  } = {}) {
    if (!game.user.isGM) {
      ui.notifications.warn(
        "You do not have permission to create map point groups."
      );
      return null;
    }
    const groupId = foundry.utils.randomID();
    const newGroup = {
      id: groupId,
      label: label,
      type: type,
      points: [],
      isBroken: false,
      reason: "",
      isEffectSource: false,
      effectTarget: "",
      emission: {
        intensity: 1.0,
        falloff: {
          enabled: false,
          strength: 0.5,
        },
      },
    };

    if (type === "rope") {
      // If rope settings are provided, use them; otherwise, construct defaults for the 'rope' type.
      if (ropeSettings) {
        Object.assign(newGroup, ropeSettings);
      } else {
        // Fallback to the 'rope' type defaults, as this is the generic option in the Map Points Editor.
        const ropeType = "rope";
        const preset = ROPE_TYPE_PRESETS[ropeType];
        const profileConfig =
          game.mapShine.profileManager.activeConfig.physicsRope[ropeType] || {};

        newGroup.ropeType = ropeType;
        newGroup.texturePath = profileConfig.texturePath || preset.texturePath;
        newGroup.segmentLength =
          profileConfig.segmentLength ?? preset.segmentLength;
        newGroup.animationSpeed =
          profileConfig.animationSpeed ?? preset.animationSpeed;
        newGroup.damping = profileConfig.damping ?? preset.damping;
        newGroup.windForce = profileConfig.windForce ?? preset.windForce;
        newGroup.tapering = profileConfig.tapering ?? preset.tapering;
        newGroup.indoorWindShielding =
          profileConfig.indoorWindShielding ?? preset.indoorWindShielding;
        newGroup.endpointFade =
          profileConfig.endpointFade ?? preset.endpointFade;
        newGroup.fadeStartDistance =
          profileConfig.fadeStartDistance ?? preset.fadeStartDistance;
        newGroup.fadeEndDistance =
          profileConfig.fadeEndDistance ?? preset.fadeEndDistance;
      }
      newGroup.isIndoors = newGroup.isIndoors ?? false; // Default to outdoor (full wind)
    }

    const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
    await canvas.scene.update({
      [path]: newGroup,
    });
    // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
    Hooks.callAll("mapShine:mapPointsUpdated", {
      created: groupId,
    });
    return groupId;
  }

  static async updateGroupProperties(groupId, properties) {
    if (!game.user.isGM) return; // No warning needed for rapid changes.

    const group = this.getGroup(groupId);
    if (!group) {
      console.warn(
        `MapPointsManager | Cannot update properties for non-existent group "${groupId}".`
      );
      return;
    }

    const updateData = {};
    for (const [key, value] of Object.entries(properties)) {
      updateData[`flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}.${key}`] =
        value;
    }

    if (!foundry.utils.isEmpty(updateData)) {
      await canvas.scene.update(updateData, {
        diff: false,
      });
      // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
      Hooks.callAll("mapShine:mapPointsUpdated", {
        updated: groupId,
      });
    }
  }

  static async deleteGroup(groupId) {
    if (!game.user.isGM) {
      ui.notifications.warn(
        "You do not have permission to delete map point groups."
      );
      return;
    }

    console.log(
      `MapShine | MapPointsManager: Attempting to delete group "${groupId}"`
    );
    const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.-=${groupId}`;
    console.log(
      `MapShine | MapPointsManager: Deleting group with path "${path}"`
    );
    await canvas.scene.update({
      [path]: null,
    });
    console.log(
      `MapShine | MapPointsManager: Group "${groupId}" deleted successfully.`
    );

    // If the deleted group was the active one, clear it
    if (game.mapShine.activeMapPointGroup === groupId) {
      game.mapShine.activeMapPointGroup = null;
    }
    // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
    Hooks.callAll("mapShine:mapPointsUpdated", {
      deleted: groupId,
    });
  }

  static async addPoint(groupId, point) {
    if (!game.user.isGM) return; // No warning needed for rapid changes like adding points.

    console.log(
      `MapShine | MapPointsManager: Attempting to add point to group "${groupId}".`,
      point
    );
    const group = this.getGroup(groupId);
    if (!group) {
      console.warn(
        `MapPointsManager | Cannot add point to non-existent group "${groupId}".`
      );
      return;
    }

    const newPoints = [...group.points, point];
    const updatedGroup = this.validate({
      ...group,
      points: newPoints,
    });

    const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
    console.log(
      `MapShine | MapPointsManager: Updating scene with path "${path}".`
    );
    await canvas.scene.update({
      [path]: updatedGroup,
    });
    console.log(
      `MapShine | MapPointsManager: Scene update complete. Calling hook.`
    );
    // @ts-expect-error - Custom hook type augmentation not working with foundry-vtt-types package
    Hooks.callAll("mapShine:mapPointsUpdated", {
      updated: groupId,
    });
  }

  static async updatePoint(groupId, pointIndex, newPosition) {
    if (!game.user.isGM) return; // No warning needed for rapid changes.

    const group = this.getGroup(groupId);
    if (!group || !group.points[pointIndex]) {
      console.warn(
        `MapPointsManager | Cannot update point at index ${pointIndex} in non-existent group "${groupId}".`
      );
      return;
    }

    const newPoints = [...group.points];
    newPoints[pointIndex] = newPosition;
    const updatedGroup = this.validate({
      ...group,
      points: newPoints,
    });

    const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
    await canvas.scene.update({
      [path]: updatedGroup,
    });
    Hooks.callAll("mapShine:mapPointsUpdated", {
      updated: groupId,
    });
  }

  static async removePoint(groupId, pointIndex) {
    if (!game.user.isGM) return; // No warning.

    const group = this.getGroup(groupId);
    if (!group) return;
    const newPoints = [...group.points];
    newPoints.splice(pointIndex, 1);
    const updatedGroup = this.validate({
      ...group,
      points: newPoints,
    });

    const path = `flags.${MODULE_ID}.${this.FLAG_NAME}.${groupId}`;
    await canvas.scene.update({
      [path]: updatedGroup,
    });
    Hooks.callAll("mapShine:mapPointsUpdated", {
      updated: groupId,
    });
  }

  /**
   * Validates a group, primarily checking for self-intersections in polygons.
   * @param {object} group The group object to validate.
   * @returns {object} The group object with updated 'isBroken' and 'reason' fields.
   */
  static validate(group) {
    if (group.type !== "area" || group.points.length < 4) {
      group.isBroken = false;
      group.reason = "";
      console.log(
        `MapShine | Validate: Group "${group.label}" (${group.type}, ${group.points.length} pts) → isBroken = false (< 4 points)`
      );
      return group;
    }

    const points = group.points;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length]; // Next point, wraps around

      // Check against all non-adjacent segments
      for (let j = i + 2; j < points.length; j++) {
        // Skip the segment that connects back to the start
        if (i === 0 && j === points.length - 1) continue;

        const p3 = points[j];
        const p4 = points[(j + 1) % points.length];

        if (this._checkIntersection(p1, p2, p3, p4)) {
          group.isBroken = true;
          group.reason = `Segment ${i + 1}-${i + 2} intersects segment ${
            j + 1
          }-${j + 2}.`;
          console.log(
            `MapShine | Validate: Group "${group.label}" (${group.type}, ${group.points.length} pts) → isBroken = true (${group.reason})`
          );
          return group;
        }
      }
    }

    group.isBroken = false;
    group.reason = "";
    console.log(
      `MapShine | Validate: Group "${group.label}" (${group.type}, ${group.points.length} pts) → isBroken = false (no intersections)`
    );
    return group;
  }

  /**
   * Checks if two line segments intersect.
   * @param {{x,y}} p1 - Start of line 1
   * @param {{x,y}} p2 - End of line 1
   * @param {{x,y}} p3 - Start of line 2
   * @param {{x,y}} p4 - End of line 2
   * @returns {boolean} True if they intersect, false otherwise.
   */
  static _checkIntersection(p1, p2, p3, p4) {
    const den = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (den === 0) return false; // Parallel or collinear

    const t =
      ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / den;
    const u =
      -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / den;

    return t > 0 && t < 1 && u > 0 && u < 1;
  }
}



// lerp function moved to utils/ColorUtils.js

export const systemStatus = new SystemStatusManager();
// Expose globally to avoid circular import issues for early consumers
globalThis.systemStatus = globalThis.systemStatus || systemStatus;





class CompositeMaskGenerator {
  /**
   * Creates a new texture by blending two source textures with a MULTIPLY effect.
   * @param {string} baseTexturePath - The path to the first texture (e.g., _Dust).
   * @param {string} overlayTexturePath - The path to the second texture (e.g., _Structural).
   * @param {PIXI.Rectangle} rect - The world-space rectangle defining the target area.
   * @returns {Promise<PIXI.RenderTexture|null>} A promise that resolves to the new composite texture, or null on failure.
   */
  static async generate(baseTexturePath, overlayTexturePath, rect) {
    const renderer = canvas.app?.renderer;
    if (!renderer || !rect || !baseTexturePath || !overlayTexturePath)
      return null;
    
    // Check if BatchRenderer is ready
    const batchRenderer = renderer.plugins?.batch;
    if (!batchRenderer || !batchRenderer._aIndex) {
      console.warn("CompositeMaskGenerator | BatchRenderer not ready, deferring mask generation");
      return null;
    }

    try {
      const [baseTex, overlayTex] = await Promise.all([
        TextureLoader.loadTexture(baseTexturePath),
        TextureLoader.loadTexture(overlayTexturePath),
      ]);

      const container = new PIXI.Container();

      const baseSprite = new PIXI.Sprite(baseTex);

      const overlaySprite = new PIXI.Sprite(overlayTex);

      // Set sprite properties to match the target tile/background
      baseSprite.width = overlaySprite.width = rect.width;
      baseSprite.height = overlaySprite.height = rect.height;
      baseSprite.position.set(rect.x, rect.y);
      overlaySprite.position.set(rect.x, rect.y);

      // Set the blend mode to MULTIPLY to get the intersection
      overlaySprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

      container.addChild(baseSprite, overlaySprite);

      // Create a render texture to capture the result

      const renderTexture = PIXI.RenderTexture.create({
        width: renderer.screen.width,
        height: renderer.screen.height,
      });

      // Render the container with the world transform to the screen-sized texture
      renderer.render(container, {
        renderTexture: renderTexture,
        transform: canvas.stage.transform.worldTransform,
        clear: true,
      });

      // Clean up the temporary PIXI objects
      container.destroy({
        children: true,
      });

      return renderTexture;
    } catch (error) {
      console.error(
        `Map Shine | Failed to generate composite mask from "${baseTexturePath}" and "${overlayTexturePath}"`,
        error
      );
      return null;
    }
  }
}






/**
 * Manages dynamic wind direction and speed for weather effects.
 * 
 * ## Wind Direction Convention
 * This system uses standard compass/meteorological convention:
 * - **0°** = East (wind blowing toward the right, +X direction)
 * - **90°** = North (wind blowing upward, -Y in screen coordinates)
 * - **180°** = West (wind blowing toward the left, -X direction)
 * - **270°** = South (wind blowing downward, +Y in screen coordinates)
 * 
 * ## Screen Coordinate System
 * Canvas/screen coordinates have Y-axis inverted from mathematical convention:
 * - X-axis: increases to the right (positive = East)
 * - Y-axis: increases downward (positive = South, opposite of math convention)
 * 
 * ## How to Apply Wind Direction
 * 
 * ### For PIXI.particles Systems (WindBehavior):
 * ```javascript
 * // PIXI.particles applies a 90° CCW rotation, so we must apply inverse transform
 * const windAngleRad = windManager.angle * (Math.PI / 180);
 * const velocityX = -Math.sin(windAngleRad) * windManager.speed;  // Use -sin for X
 * const velocityY = -Math.cos(windAngleRad) * windManager.speed;  // Use -cos for Y
 * ```
 * The PIXI.particles system rotates velocity vectors by 90° counter-clockwise,
 * so we swap X/Y components and apply signs to compensate.
 * 
 * ### For Shader UV Scrolling (cloud patterns, etc.):
 * ```javascript
 * const windAngleRad = windManager.smoothedAngle * (Math.PI / 180);
 * const velocityX = Math.cos(windAngleRad) * speed;
 * const velocityY = -Math.sin(windAngleRad) * speed;  // Screen coords
 * // IMPORTANT: Negate when passing to shader!
 * uniforms.u_windDirection = [-velocityX, -velocityY];
 * ```
 * Shaders that ADD to UV coordinates (`uv += windDirection * time`) cause the pattern to move
 * in the OPPOSITE direction of the scroll. Therefore, negate the velocity before passing to shader.
 * 
 * ### For Visual Indicators (windsock, arrows, etc.):
 * ```javascript
 * // For CSS rotation where 0° points up:
 * element.style.transform = `rotate(${windManager.angle + 90}deg)`;
 * ```
 * CSS rotation of 0° points up (north), but our angle=0 means east. Add 90° to align correctly.
 * 
 * ## Properties
 * Weather Edge Detector
 * 
 * Detects building edges from the _Outdoors mask texture for spawning
 * wind-blown water droplet particles. Uses grid sampling for performance.
 */
class WeatherEdgeDetector {
  constructor(config) {
    this.config = config;
    this.edgeCache = null;
    this.lastWindAngle = null;
    this.lastUpdateTime = 0;
  }

  detectEdges(windAngle) {
    const now = Date.now() / 1000;
    const dt = now - this.lastUpdateTime;
    
    // Cache validation - use edgeUpdateFrequency from config
    const updateFreq = this.config.edgeUpdateFrequency ?? this.config.updateFrequency ?? 2.0;
    
    if (this.edgeCache && 
        this.lastWindAngle !== null &&
        Math.abs(windAngle - this.lastWindAngle) < 5 &&
        dt < updateFreq) {
      return this.edgeCache;
    }
    
    const resourceManager = game.mapShine?.resourceManager;
    if (!resourceManager) return [];
    
    const mask = resourceManager.getOutdoorsMask();
    if (!mask || !mask.valid) return [];
    
    const edges = this._detectEdgesGrid(mask, windAngle);
    
    this.edgeCache = edges;
    this.lastWindAngle = windAngle;
    this.lastUpdateTime = now;
    
    return edges;
  }

  _detectEdgesGrid(mask, windAngle) {
    const renderer = canvas.app.renderer;
    
    let pixels;
    try {
      pixels = renderer.extract.pixels(mask);
    } catch (error) {
      console.error('MapShine | WeatherEdgeDetector: Failed to extract pixels:', error);
      return [];
    }
    
    const gridSize = this.config.gridSize;
    const indoorThreshold = this.config.edgeThreshold ?? 0.5;
    const outdoorThreshold = this.config.outdoorThreshold ?? 0.5;
    
    const windRad = windAngle * Math.PI / 180;
    const windDirX = Math.cos(windRad);
    const windDirY = -Math.sin(windRad);
    
    const edges = [];
    const width = mask.width;
    const height = mask.height;
    
    for (let y = gridSize; y < height - gridSize; y += gridSize) {
      for (let x = gridSize; x < width - gridSize; x += gridSize) {
        const idx = (y * width + x) * 4;
        const current = pixels[idx] / 255;
        
        // Look for INDOOR pixels (current < indoorThreshold) so particles spawn inside buildings
        if (current >= indoorThreshold) continue;
        
        const checkX = Math.floor(x + windDirX * gridSize);
        const checkY = Math.floor(y + windDirY * gridSize);
        
        if (checkX < 0 || checkX >= width || checkY < 0 || checkY >= height) continue;
        
        const neighborIdx = (checkY * width + checkX) * 4;
        const neighbor = pixels[neighborIdx] / 255;
        
        // Check if downwind neighbor is OUTDOOR (neighbor >= outdoorThreshold)
        // This finds indoor→outdoor edges, so particles blow OUT of buildings
        if (neighbor >= outdoorThreshold) {
          const worldPos = this._maskToWorldCoords(x, y, mask);
          if (worldPos) edges.push(worldPos);
        }
      }
    }
    
    return edges;
  }

  _maskToWorldCoords(x, y, mask) {
    const sceneRect = canvas.scene?.dimensions?.sceneRect;
    const screen = canvas.app?.renderer?.screen;
    const stage = canvas.stage;
    
    if (!sceneRect || !screen || !stage) return null;
    
    const screenX = (x / mask.width) * screen.width;
    const screenY = (y / mask.height) * screen.height;
    
    try {
      const worldPos = stage.transform.worldTransform.applyInverse(
        new PIXI.Point(screenX, screenY)
      );
      return { x: worldPos.x, y: worldPos.y };
    } catch (error) {
      return null;
    }
  }

  clearCache() {
    this.edgeCache = null;
    this.lastWindAngle = null;
  }
}

// IndoorOpacityMask behavior removed - replaced with GPU-based container masking
// See EdgeDropletSystem._updateOutdoorsMask() for the simpler, more reliable approach

/**
 * Weather Edge Droplet Controller
 * 
 * Spawns water droplet particles from building edges detected in the _Outdoors mask.
 * Particles spawn only on the upwind side of buildings (where wind blows into the building).
 */
class WeatherEdgeDropletController {
  constructor(config) {
    this.config = config;
    this.emitter = null;
    this.container = new PIXI.Container();
    this.isInitialized = false;
    
    // Edge detection system
    this.edgeDetector = new WeatherEdgeDetector({
      gridSize: config.gridSize || 32,
      updateFrequency: config.edgeUpdateFrequency || 2.0  // Update edges every 2 seconds
    });
    
    // Reference to the EdgePointsSpawnBehavior for dynamic updates
    this.edgeSpawnBehavior = null;
    this.lastEdgeUpdate = 0;
    
    // Mask sprite for GPU-based indoor hiding
    this.maskSprite = null;
    
    // Fade system for realistic rain start/stop
    this.baseFrequency = config.frequency || 0.003;
    
    // Fade-out: "dripping from rooftops" after rain stops (2x transition time)
    this.isFadingOut = false;
    this.fadeOutStartTime = 0;
    this.fadeOutDuration = 0;
    
    // Fade-in: gradual ramp-up when rain starts (normal transition time)
    this.isFadingIn = false;
    this.fadeInStartTime = 0;
    this.fadeInDuration = 0;
  }

  /**
   * Initialize with MINIMAL configuration using SAFE patterns from working systems
   */
  initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('MapShine | EdgeDroplets: Starting MINIMAL initialization...');
      
      // Load particle texture
      const texture = PIXI.Texture.from('modules/map-shine/assets/particle.webp');
      
      // Get _Outdoors mask for particle culling
      const resourceManager = game.mapShine?.resourceManager;
      const outdoorsMask = resourceManager?.getOutdoorsMask();
      
      // Get initial edge points from _Outdoors mask
      const windManager = game.mapShine?.windManager;
      const initialWindAngle = windManager?.angle || 45;
      const edgePoints = this.edgeDetector.detectEdges(initialWindAngle);
      
      console.log(`MapShine | EdgeDroplets: Detected ${edgePoints.length} edge points at wind angle ${initialWindAngle}°`);
      
      // EDGE-BASED PARTICLE CONFIG: Spawn from detected building edges using UI config values
      const cfg = this.config; // Shorthand for cleaner code
      
      // Convert RGB color to hex string
      const rgbToHex = (r, g, b) => {
        const toHex = (val) => {
          const hex = Math.round(val * 255).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      };
      
      const colorHex = cfg.matchRainTint 
        ? '#d0e8ff' // Match rain default (will be overridden by rain system if active)
        : rgbToHex(cfg.color.r, cfg.color.g, cfg.color.b);
      
      const baseOpacity = cfg.opacity ?? 0.8;
      const splashOpacity = cfg.splashOpacity ?? 0.3;
      const fadeInTime = cfg.fadeInDuration ?? 0.05;
      const fadeOutTime = cfg.fadeOutStart ?? 0.9;
      
      const emitterConfig = {
        lifetime: {
          min: cfg.lifetime.min ?? 4.0,
          max: cfg.lifetime.max ?? 6.5
        },
        frequency: cfg.frequency ?? 0.003,
        maxParticles: cfg.maxParticles ?? 600,
        pos: {
          x: 0,   // Emitter position (edge points are relative to this)
          y: 0
        },
        emit: false,
        autoUpdate: cfg.autoUpdate ?? false,
        behaviors: [
          // Texture - REQUIRED
          {
            type: 'textureSingle',
            config: {
              texture: texture
            }
          },
          
          // Spawn from EDGE POINTS (building boundaries from _Outdoors mask)
          {
            type: 'edgePoints',
            config: {
              edgePoints: edgePoints,
              spreadRadius: cfg.spreadRadius ?? 20
            }
          },
          
          // Alpha: Fade in/out for smooth appearance + ground collision
          {
            type: 'alpha',
            config: {
              alpha: {
                list: [
                  { time: 0, value: 0 },
                  { time: fadeInTime, value: baseOpacity },
                  { time: (cfg.groundCollisionAge ?? 0.90) - 0.01, value: baseOpacity },
                  { time: cfg.groundCollisionAge ?? 0.90, value: splashOpacity },
                  { time: 1, value: 0 }
                ]
              }
            }
          },
          
          // Scale: Perspective effect - large at spawn, shrink at ground, then INSTANT SPLASH
          {
            type: 'scale',
            config: {
              scale: {
                list: [
                  { time: 0, value: cfg.size.max ?? 0.30 },
                  { time: (cfg.groundCollisionAge ?? 0.90) - (cfg.splashTransitionTime ?? 0.001), value: cfg.size.min ?? 0.16 },  // Just before ground
                  { time: cfg.groundCollisionAge ?? 0.90, value: (cfg.size.min ?? 0.16) * (cfg.splashSizeMultiplier ?? 26.0) },   // INSTANT balloon at ground impact
                  { time: 1.0, value: (cfg.size.min ?? 0.16) * (cfg.splashSizeMultiplier ?? 26.0) }                               // Hold splash size while fading
                ]
              },
              minMult: cfg.sizeVariation ?? 0.7
            }
          },
          
          // Color: From config (either custom or rain-matching)
          {
            type: 'colorStatic',
            config: {
              color: colorHex
            }
          },
          
          // Wind: Follow wind direction and speed
          {
            type: 'wind',
            config: {
              enabled: true,
              force: cfg.windForce ?? 0.15,
              turbulence: cfg.turbulence ?? 0.5,
              buoyancy: 0,
              accelerationTime: cfg.windAccelerationTime ?? 2.0
            }
          },
          
          // Indoor masking handled by container mask (GPU-based) - no behavior needed
          
          // Motion Blur: Elongate particles in direction of travel (like sparks)
          {
            type: 'dropletStreak',
            config: {
              strength: cfg.motionBlur?.strength ?? 2.0,
              maxLength: cfg.motionBlur?.maxLength ?? 8.0
            }
          },
          
          // Ground Collision: Stop movement when hitting ground
          ...(cfg.enableGroundCollision ? [{
            type: 'groundCollision',
            config: {
              groundAge: cfg.groundCollisionAge ?? 0.90
            }
          }] : [])
        ]
      };
      
      console.log('MapShine | EdgeDroplets: Creating emitter with EDGE-BASED spawn...');
      
      // Create emitter
      this.emitter = new PIXI.particles.Emitter(
        this.container,
        emitterConfig
      );
      
      console.log('MapShine | EdgeDroplets: Emitter created successfully!');
      
      // Store reference to EdgePointsSpawnBehavior for dynamic updates
      this.edgeSpawnBehavior = this.emitter.initBehaviors?.find(b => b.constructor.type === 'edgePoints');
      
      if (!this.edgeSpawnBehavior) {
        console.error('MapShine | EdgeDroplets: Failed to find EdgePointsSpawnBehavior!');
      } else {
        console.log('MapShine | EdgeDroplets: EdgePointsSpawnBehavior found and ready');
      }
      
      // Set initial position to world origin (edge points are in world coords)
      this.emitter.updateOwnerPos(0, 0);
      
      // Check current weather state - start at full strength if already raining
      const weatherManager = game.mapShine?.weatherSystemManager;
      const currentState = weatherManager?.currentState || 'clear';
      const rainStates = ['drizzle', 'rain', 'storm'];
      const shouldEmit = rainStates.includes(currentState);
      
      // Set both emit flag AND frequency (critical for particles to spawn)
      this.emitter.emit = shouldEmit;
      this.emitter.frequency = shouldEmit ? this.baseFrequency : 0;
      
      this.isInitialized = true;
      console.log(`MapShine | EdgeDroplets: ✅ MINIMAL initialization complete (emit=${shouldEmit}, frequency=${this.emitter.frequency}, state=${currentState})`);
      
    } catch (error) {
      console.error('MapShine | EdgeDroplets: ❌ Initialization failed', error);
      console.error('MapShine | EdgeDroplets: Stack:', error.stack);
      this.initializationFailed = true;
    }
  }

  /**
   * Update emitter - updates edge points based on wind direction changes
   */
  update(deltaTime) {
    if (!this.isInitialized || !this.emitter || this.initializationFailed) return;
    
    // ✅ CRITICAL: Check master enabled flag
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) {
      // Module disabled - stop emitting immediately
      if (this.emitter.emit) {
        this.emitter.emit = false;
        this.emitter.frequency = 0;
      }
      return;
    }
    
    // Update _Outdoors mask for GPU-based indoor culling
    this._updateOutdoorsMask();
    
    // Handle fade-in (gradual ramp-up when rain starts)
    if (this.isFadingIn) {
      const elapsed = Date.now() - this.fadeInStartTime;
      const fadeProgress = Math.min(elapsed / this.fadeInDuration, 1.0);
      
      // Gradually increase spawn frequency from 0 to base
      const currentFrequency = this.baseFrequency * fadeProgress;
      this.emitter.frequency = currentFrequency;
      
      // Fade-in complete - resume normal operation
      if (fadeProgress >= 1.0) {
        this.isFadingIn = false;
        this.emitter.frequency = this.baseFrequency;
        console.log('MapShine | EdgeDroplets: Fade-in complete - at full spawn rate');
      }
    }
    // Handle fade-out (dripping from rooftops effect)
    else if (this.isFadingOut) {
      const elapsed = Date.now() - this.fadeOutStartTime;
      const fadeProgress = Math.min(elapsed / this.fadeOutDuration, 1.0);
      
      // Gradually reduce spawn frequency from base to 0
      const currentFrequency = this.baseFrequency * (1.0 - fadeProgress);
      this.emitter.frequency = currentFrequency;
      
      // Log fade-out progress periodically
      if (!this._fadeOutLogTimer) this._fadeOutLogTimer = 0;
      this._fadeOutLogTimer += deltaTime;
      if (this._fadeOutLogTimer >= 2.0) {  // Log every 2 seconds
        console.log(`MapShine | EdgeDroplets: Fade-out progress ${(fadeProgress * 100).toFixed(1)}% - frequency: ${currentFrequency.toFixed(4)} (particles: ${this.emitter.particleCount})`);
        this._fadeOutLogTimer = 0;
      }
      
      // Stop emitting completely when fade-out is done
      if (fadeProgress >= 1.0) {
        this.emitter.emit = false;
        this.isFadingOut = false;
        this._fadeOutLogTimer = 0;
        console.log('MapShine | EdgeDroplets: Fade-out complete - stopped emitting');
      }
    }
    
    // Update edge points if wind direction has changed significantly
    const windManager = game.mapShine?.windManager;
    if (windManager && this.edgeSpawnBehavior) {
      const currentTime = Date.now() / 1000;
      const timeSinceLastUpdate = currentTime - this.lastEdgeUpdate;
      
      // Update edges periodically (every 2 seconds by default)
      if (timeSinceLastUpdate >= (this.config.edgeUpdateFrequency || 2.0)) {
        const newEdgePoints = this.edgeDetector.detectEdges(windManager.angle);
        
        // Update the spawn behavior with new edge points
        if (newEdgePoints.length > 0) {
          this.edgeSpawnBehavior.setEdgePoints(newEdgePoints);
          
          // Log diagnostics every update
          if (!this._diagFrameCount) this._diagFrameCount = 0;
          this._diagFrameCount++;
          if (this._diagFrameCount >= 30) {  // Every 30 updates (~1 minute)
            console.log(`MapShine | EdgeDroplets DIAGNOSTICS:
  Wind Angle: ${windManager.angle.toFixed(1)}°
  Edge Points: ${newEdgePoints.length}
  Active Particles: ${this.emitter.particleCount}
  Emitting: ${this.emitter.emit}
  Fading Out: ${this.isFadingOut}`);
            this._diagFrameCount = 0;
          }
        } else {
          // No edges found - warn once
          if (!this._noEdgesWarned) {
            console.warn('MapShine | EdgeDroplets: No edge points detected - check if _Outdoors mask exists');
            this._noEdgesWarned = true;
          }
        }
        
        this.lastEdgeUpdate = currentTime;
      }
    }
    
    try {
      // deltaTime is already in seconds, do NOT multiply by 0.001
      this.emitter.update(deltaTime);
    } catch (updateError) {
      console.error('MapShine | EdgeDroplets: ❌ Update error - disabling', updateError);
      console.error('MapShine | EdgeDroplets: Stack:', updateError.stack);
      this.emitter.emit = false;
      this.initializationFailed = true;
    }
  }

  /**
   * Update _Outdoors mask for GPU-based particle hiding
   * Applies mask directly to container - PIXI handles everything on GPU
   * @private
   */
  _updateOutdoorsMask() {
    const resourceManager = game.mapShine?.resourceManager;
    const outdoorsMask = resourceManager?.getOutdoorsMask();
    
    if (!outdoorsMask || !outdoorsMask.valid) {
      // No mask available - show all particles
      if (this.maskSprite) {
        this.container.mask = null;
        this.maskSprite.destroy();
        this.maskSprite = null;
      }
      return;
    }
    
    // Create or update mask sprite
    if (!this.maskSprite) {
      this.maskSprite = new PIXI.Sprite(outdoorsMask);
      this.maskSprite.blendMode = PIXI.BLEND_MODES.NORMAL;
      // Position mask sprite to cover entire screen
      this.maskSprite.x = 0;
      this.maskSprite.y = 0;
      this.maskSprite.width = canvas.app.renderer.screen.width;
      this.maskSprite.height = canvas.app.renderer.screen.height;
      // Apply mask to container
      this.container.mask = this.maskSprite;
      console.log('MapShine | EdgeDroplets: Applied _Outdoors mask to container (GPU-based)');
    } else {
      // Update texture if it changed
      if (this.maskSprite.texture !== outdoorsMask) {
        this.maskSprite.texture = outdoorsMask;
      }
      // Update size if screen dimensions changed
      const screen = canvas.app.renderer.screen;
      if (this.maskSprite.width !== screen.width || this.maskSprite.height !== screen.height) {
        this.maskSprite.width = screen.width;
        this.maskSprite.height = screen.height;
      }
    }
  }
  
  /**
   * Start emitting particles (immediately at full frequency)
   */
  start() {
    if (this.emitter) {
      // Cancel any active fades
      this.isFadingOut = false;
      this.isFadingIn = false;
      
      // Reset to full spawn frequency
      this.emitter.frequency = this.baseFrequency;
      this.emitter.emit = true;
      console.log('MapShine | EdgeDroplets: Started emitting at full rate');
    }
  }

  /**
   * Stop emitting particles immediately (hard stop)
   */
  stop() {
    if (this.emitter) {
      this.emitter.emit = false;
      this.isFadingOut = false;
      this.isFadingIn = false;
      console.log('MapShine | EdgeDroplets: Stopped emitting (hard stop)');
    }
  }
  
  /**
   * Begin gradual fade-in (ramp up spawn rate when rain starts)
   * @param {number} durationMs - Fade-in duration in milliseconds
   */
  beginFadeIn(durationMs) {
    if (!this.emitter) return;
    
    // Cancel any active fade-out
    this.isFadingOut = false;
    
    // Start fade-in from 0 frequency
    this.isFadingIn = true;
    this.fadeInStartTime = Date.now();
    this.fadeInDuration = durationMs;
    this.emitter.frequency = 0; // Start at zero
    this.emitter.emit = true;    // Enable emitter (even though frequency is 0)
    console.log(`MapShine | EdgeDroplets: Beginning fade-in over ${durationMs}ms`);
  }
  
  /**
   * Begin gradual fade-out (for "dripping from rooftops" effect)
   * @param {number} durationMs - Fade-out duration in milliseconds
   */
  beginFadeOut(durationMs) {
    if (!this.emitter || !this.emitter.emit) return;
    
    // Cancel any active fade-in
    this.isFadingIn = false;
    
    this.isFadingOut = true;
    this.fadeOutStartTime = Date.now();
    this.fadeOutDuration = durationMs;
    console.log(`MapShine | EdgeDroplets: Beginning fade-out over ${durationMs}ms`);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.emitter) {
      this.emitter.destroy();
      this.emitter = null;
    }
    if (this.maskSprite) {
      this.container.mask = null;
      this.maskSprite.destroy();
      this.maskSprite = null;
    }
    this.edgeDetector.clearCache();
    this.container.destroy({ children: true });
    console.log('MapShine | EdgeDroplets: Destroyed');
  }
}

/**
 * Weather System Manager
 * 
 * Manages comprehensive weather states with smooth transitions and cloud-based
 * precipitation spawning. Coordinates between cloud shadows, precipitation particles,
 * accumulation, and atmospheric effects.
 * 
 * ## Weather States
 * - CLEAR: No precipitation, minimal cloud coverage
 * - DRIZZLE: Light rain, moderate clouds
 * - RAIN: Steady rainfall, heavy clouds
 * - STORM: Heavy rain with wind, dark storm clouds
 * - SLEET: Mixed rain/snow, cold atmospheric feel
 * - SNOW: Snowfall, dense white/grey clouds
 * - BLIZZARD: Heavy snow with strong wind, thick cloud coverage
 * 
 * ## Transition System
 * States transition smoothly over configurable durations, blending:
 * - Cloud density and appearance
 * - Precipitation particle counts and properties
 * - Wind strength and direction
 * - Atmospheric lighting and color
 * 
 * ## Cloud-Based Spawning
 * Precipitation particles spawn using TextureMaskShape sampling from rawCloudTexture,
 * ensuring rain/snow only falls where clouds are visible. This creates natural
 * density variation and visual coherence.
 */
class WeatherSystemManager {
  // Weather state enumeration
  static STATES = {
    CLEAR: 'clear',
    PARTLY_CLOUDY: 'partly-cloudy',
    DRIZZLE: 'drizzle',
    RAIN: 'rain',
    STORM: 'storm',
    SLEET: 'sleet',
    SNOW: 'snow',
    BLIZZARD: 'blizzard'
  };

  constructor() {
    this.currentState = WeatherSystemManager.STATES.CLEAR;
    this.targetState = WeatherSystemManager.STATES.CLEAR;
    
    // Transition management
    this.isTransitioning = false;
    this.transitionProgress = 0; // 0 to 1
    this.transitionDuration = 10000; // milliseconds
    this.transitionStartTime = 0;
    
    // System state
    this.isReady = false;
    this.lastError = null;
    this.lastErrorTime = 0;
    
    // Shader system reference
    this.weatherEffectLayer = null;
    
    // Particle system reference (for weather particle effects like edge droplets)
    this.weatherParticleLayer = null;
    
    // Cloud texture reference for potential future cloud-based intensity modulation
    this.cloudTextureValid = false;
    
    // Smoothed speed multiplier for rain (prevents abrupt changes during gusts)
    this._smoothedSpeedMultiplier = 1.0;
    
    // Edge droplet controller for wind-blown water particles
    this.edgeDropletController = null;
    
    // Orchestrator control
    this.orchestratorActive = false; // Track if orchestrator controls this manager
    this._intensityOverride = undefined; // Intensity override from orchestrator (0-1)
    
    // Puddle drying management
    this._puddleMaxIntensity = 0; // Peak intensity reached during rain
    this._puddleDryingStartTime = null; // When rain stopped (puddles start drying)
    this._isPuddleDrying = false; // Whether puddles are currently drying
    
    // Puddle initialization fade-in (prevents dark flash on scene load)
    this._puddleInitialLoadTime = null; // Timestamp when puddles first became active
    this._puddleInitialFadeDuration = 1500; // Milliseconds to fade in puddles on load (1.5s)
    
    // State definitions with properties for each weather type
    this.stateDefinitions = this._initializeStateDefinitions();
    
    console.log('MapShine | WeatherSystemManager initialized');
  }

  /**
   * Initialize weather state definitions with all properties needed for transitions
   * Now reads from MODULE_DEFAULTS for easy configuration
   */
  _initializeStateDefinitions() {
    // Try to read from active config first (allows per-profile customization)
    const configPresets = game.mapShine?.profileManager?.activeConfig?.weather?.statePresets;
    
    // Fall back to MODULE_DEFAULTS if not available
    const presets = configPresets || MODULE_DEFAULTS.weather.statePresets;
    
    if (!presets) {
      console.error('MapShine | WeatherSystemManager: No weather state presets found in MODULE_DEFAULTS!');
      // Return minimal fallback to prevent crashes
      return {
        [WeatherSystemManager.STATES.CLEAR]: {
          name: 'Clear',
          cloudDensity: 0.2,
          cloudThreshold: 0.7,
          cloudSoftness: 0.3,
          precipitationIntensity: 0,
          precipitationType: 'none',
          particleCount: 0,
          windMultipliers: {
            baseSpeed: 1.0,
            gustSpeed: 1.0,
            gustFrequency: 1.0,
            gustDuration: 1.0,
            angleChangeFrequency: 1.0,
            angleChangeRange: 1.0
          },
          atmosphericTint: { r: 1.0, g: 1.0, b: 1.0 }
        }
      };
    }
    
    return presets;
  }

  /**
   * Get current weather state with interpolated values during transitions
   */
  getCurrentWeatherState() {
    if (!this.isTransitioning) {
      return this.stateDefinitions[this.currentState];
    }

    // Interpolate between current and target state
    const current = this.stateDefinitions[this.currentState];
    const target = this.stateDefinitions[this.targetState];
    const t = this.transitionProgress;

    return {
      name: `${current.name} → ${target.name}`,
      cloudDensity: this._lerp(current.cloudDensity, target.cloudDensity, t),
      cloudThreshold: this._lerp(current.cloudThreshold, target.cloudThreshold, t),
      cloudSoftness: this._lerp(current.cloudSoftness, target.cloudSoftness, t),
      precipitationIntensity: this._lerp(current.precipitationIntensity, target.precipitationIntensity, t),
      precipitationType: t < 0.5 ? current.precipitationType : target.precipitationType,
      particleCount: Math.floor(this._lerp(current.particleCount, target.particleCount, t)),
      windMultipliers: {
        baseSpeed: this._lerp(current.windMultipliers?.baseSpeed ?? 1.0, target.windMultipliers?.baseSpeed ?? 1.0, t),
        gustSpeed: this._lerp(current.windMultipliers?.gustSpeed ?? 1.0, target.windMultipliers?.gustSpeed ?? 1.0, t),
        gustFrequency: this._lerp(current.windMultipliers?.gustFrequency ?? 1.0, target.windMultipliers?.gustFrequency ?? 1.0, t),
        gustDuration: this._lerp(current.windMultipliers?.gustDuration ?? 1.0, target.windMultipliers?.gustDuration ?? 1.0, t),
        angleChangeFrequency: this._lerp(current.windMultipliers?.angleChangeFrequency ?? 1.0, target.windMultipliers?.angleChangeFrequency ?? 1.0, t),
        angleChangeRange: this._lerp(current.windMultipliers?.angleChangeRange ?? 1.0, target.windMultipliers?.angleChangeRange ?? 1.0, t)
      },
      foliageMultipliers: {
        rustleSpeed: this._lerp(current.foliageMultipliers?.rustleSpeed ?? 1.0, target.foliageMultipliers?.rustleSpeed ?? 1.0, t),
        swaySpeed: this._lerp(current.foliageMultipliers?.swaySpeed ?? 1.0, target.foliageMultipliers?.swaySpeed ?? 1.0, t)
      },
      atmosphericTint: {
        r: this._lerp(current.atmosphericTint.r, target.atmosphericTint.r, t),
        g: this._lerp(current.atmosphericTint.g, target.atmosphericTint.g, t),
        b: this._lerp(current.atmosphericTint.b, target.atmosphericTint.b, t)
      },
      colorCorrection: {
        saturation: this._lerp(current.colorCorrection?.saturation ?? 1.0, target.colorCorrection?.saturation ?? 1.0, t),
        contrast: this._lerp(current.colorCorrection?.contrast ?? 1.0, target.colorCorrection?.contrast ?? 1.0, t),
        brightness: this._lerp(current.colorCorrection?.brightness ?? 1.0, target.colorCorrection?.brightness ?? 1.0, t)
      },
      description: current.description,
      isTransitioning: true,
      transitionProgress: t
    };
  }

  /**
   * Start transition to a new weather state
   * Now uses the centralized WeatherStateManager for unified transition handling
   */
  transitionToState(newState, durationMs = null) {
    // Validate weather state
    if (!this.weatherStateManager.getStateDefinition(newState)) {
      this.lastError = `Invalid weather state: ${newState}`;
      this.lastErrorTime = Date.now();
      console.error(`MapShine | WeatherSystemManager: ${this.lastError}`);
      return false;
    }

    // Check if already in this state and not transitioning
    if (newState === this.weatherStateManager.currentState && !this.weatherStateManager.isTransitioning) {
      console.log(`MapShine | WeatherSystemManager: Already in ${newState} state`);
      return true;
    }

    // Use WeatherStateManager for unified transition handling
    const success = this.weatherStateManager.transitionTo(newState, {
      duration: durationMs,
      force: false
    });

    if (!success) {
      this.lastError = this.weatherStateManager.lastError || 'Transition failed';
      this.lastErrorTime = Date.now();
      console.error(`MapShine | WeatherSystemManager: Transition failed - ${this.lastError}`);
      return false;
    }

    // Update legacy state tracking for compatibility
    this.currentState = newState;
    this.targetState = this.weatherStateManager.targetState;
    this.isTransitioning = true;
    this.transitionStartTime = Date.now();
    this.transitionDuration = durationMs || this.weatherStateManager.transitionDuration;

    console.log(`MapShine | WeatherSystemManager: Transition started to ${newState} (${this.transitionDuration}ms)`);
    return true;
  }

  /**
   * Transition to a new weather state with optional intensity override
   * Orchestrator-friendly method that supports fine-tuning weather strength
   * @param {string} stateName - Target weather state
   * @param {Object} options - Transition options
   * @param {number} options.duration - Transition duration in milliseconds
   * @param {number} options.intensity - Intensity override (0-1), modulates shader parameters
   * @returns {boolean} Success status
   */
  transitionTo(stateName, options = {}) {
    const { duration, intensity } = options;
    
    // Call existing transitionToState method
    const success = this.transitionToState(stateName, duration);
    
    if (success && intensity !== undefined) {
      // Store intensity override for use during transition
      this._intensityOverride = Math.max(0, Math.min(1, intensity)); // Clamp 0-1
      console.log(`MapShine | WeatherSystemManager: Intensity override set to ${this._intensityOverride}`);
    }
    
    return success;
  }

  /**
   * Update weather system state and transitions
   * Now delegates transition management to WeatherStateManager
   */
  update(deltaTime) {
    // ✅ CRITICAL: Check master enabled flag
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) {
      // Module disabled - hide all weather effects immediately
      if (this.weatherEffectLayer) {
        this.weatherEffectLayer.stopAllEffects();
      }
      return;
    }
    
    // Update WeatherStateManager if available
    if (this.weatherStateManager) {
      this.weatherStateManager.updateTransition(deltaTime);
      
      // Sync legacy state tracking with WeatherStateManager
      this.currentState = this.weatherStateManager.currentState;
      this.targetState = this.weatherStateManager.targetState;
      this.isTransitioning = this.weatherStateManager.isTransitioning;
      this.transitionProgress = this.weatherStateManager.transitionProgress;
      
      // Update weather effect layer
      if (this.weatherEffectLayer) {
        this.weatherEffectLayer.update();
      }
      
      // All other updates are now handled by the WeatherStateManager through registered systems
      return;
    }
    
    // Fallback to legacy behavior if WeatherStateManager not available
    // Periodically revalidate cloud texture (it may become valid after initialization)
    if (!this.cloudTextureValid) {
      this.cloudTextureValid = this._validateCloudTexture();
    }

    // Update weather effect layer (updates outdoor masking for camera movement)
    if (this.weatherEffectLayer) {
      this.weatherEffectLayer.update();
    }

    if (!this.isTransitioning) {
      // Update shader-based weather effects even when not transitioning
      if (this.weatherEffectLayer) {
        const currentWeather = this.getCurrentWeatherState();
        this._updateWeatherShaders(currentWeather);
      }
      
      // Apply wind direction and turbulence AFTER shader updates
      // This ensures wind rotation isn't overwritten by config values
      this._updateWindOnShaders();
      
      // Apply rain ripples to outdoor water surfaces
      const currentWeather = this.getCurrentWeatherState();
      this._applyRainRipples(currentWeather);
      
      // Apply puddle intensity based on weather state
      this._applyPuddleIntensity(currentWeather);
      
      // Update edge droplet system
      this._updateEdgeDroplets(deltaTime);
      
      return;
    }

    const elapsed = Date.now() - this.transitionStartTime;
    this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1.0);

    // Apply smooth easing (ease-in-out cubic)
    const t = this.transitionProgress;
    const easedProgress = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Update systems with interpolated values
    const currentWeather = this.getCurrentWeatherState();
    this._applyCloudState(currentWeather);
    
    // Update shader-based weather effects
    if (this.weatherEffectLayer) {
      this._updateWeatherShaders(currentWeather);
    }
    
    // Apply wind direction and turbulence during transitions
    this._updateWindOnShaders();

    // Apply rain ripples to outdoor water surfaces during transitions
    this._applyRainRipples(currentWeather);

    // Apply puddle intensity during transitions
    this._applyPuddleIntensity(currentWeather);

    // Update edge droplet system during transitions
    this._updateEdgeDroplets(deltaTime);

    // Complete transition
    if (this.transitionProgress >= 1.0) {
      this.currentState = this.targetState;
      this.isTransitioning = false;
      this.transitionProgress = 0;
      console.log(`MapShine | WeatherSystemManager: Transition complete - now in ${this.currentState} state`);
      
      // Update shaders one final time at end of transition
      if (this.weatherEffectLayer) {
        const config = game.mapShine?.profileManager?.activeConfig;
        if (config) {
          this.weatherEffectLayer.updateFromConfig(config);
        }
      }
      
      // CRITICAL: Apply weather state after transition completes
      // This ensures wind/foliage multipliers remain active in the new state
      const currentWeather = this.getCurrentWeatherState();
      this._updateWeatherShaders(currentWeather);
      
      // Apply wind after final config update
      this._updateWindOnShaders();
    }
  }

  /**
   * Validate cloud texture availability
   * @returns {boolean} True if cloud texture is valid and ready
   */
  _validateCloudTexture() {
    try {
      const resourceManager = game.mapShine?.resourceManager;
      if (!resourceManager) return false;

      const cloudLayer = canvas.layers?.find(l => l instanceof CloudShadowsLayer);
      if (!cloudLayer || !cloudLayer.visible || !cloudLayer.rawCloudTexture) return false;

      const cloudTexture = resourceManager.getRawCloudTexture(0);
      return cloudTexture?.valid && cloudTexture?.baseTexture?.valid;
    } catch (e) {
      return false;
    }
  }

  /**
   * Apply weather state to cloud system
   */
  _applyCloudState(weather) {
    // Revalidate cloud texture (it may have become ready since initialization)
    this.cloudTextureValid = this._validateCloudTexture();

    // Update cloud appearance via config changes would happen here
    // This will be implemented when we integrate with the cloud system
  }

  /**
   * Compute and apply rain ripple parameters to outdoor water surfaces
   * Only affects water in outdoor areas (white regions of _Outdoors mask)
   * @param {object} weather - Current weather state
   * @private
   */
  _applyRainRipples(weather) {
    const waterLayer = canvas.layers.find(l => l instanceof WaterFXLayer);
    if (!waterLayer || !waterLayer.displacementFilter) return;

    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config?.water?.wave?.rainRipple?.enabled) return;

    const rainRippleConfig = config.water.wave.rainRipple;
    const baseWaveConfig = config.water.wave;

    // Determine rain intensity based on current weather state
    let rainIntensity = 0;
    switch (this.currentState) {
      case WeatherSystemManager.STATES.DRIZZLE:
        rainIntensity = 0.3;
        break;
      case WeatherSystemManager.STATES.RAIN:
        rainIntensity = 1.0;
        break;
      case WeatherSystemManager.STATES.STORM:
        rainIntensity = 1.8;
        break;
      case WeatherSystemManager.STATES.SLEET:
        rainIntensity = 0.6;
        break;
      default:
        rainIntensity = 0;
    }

    // Apply smooth transition during weather state changes
    if (this.isTransitioning) {
      const targetIntensity = this._getTargetRainIntensity();
      rainIntensity = this._lerp(rainIntensity, targetIntensity, this.transitionProgress);
    }

    // Store the original wave parameters if this is the first time applying rain ripples
    if (!waterLayer._originalWaveParams) {
      waterLayer._originalWaveParams = {
        speed: baseWaveConfig.speed,
        scale: baseWaveConfig.scale,
        intensity: baseWaveConfig.intensity
      };
    }

    // ADDITIVE APPROACH: Rain ripples add to base wave, not replace it
    // Speed: Blend between base and rain speed (faster animation during rain)
    const targetSpeed = this._lerp(
      waterLayer._originalWaveParams.speed,
      rainRippleConfig.speed,
      rainIntensity
    );
    
    // Scale: Blend between base and rain scale (smaller, more chaotic ripples during rain)
    const targetScale = this._lerp(
      waterLayer._originalWaveParams.scale,
      rainRippleConfig.scale,
      rainIntensity
    );
    
    // Intensity: ADD rain ripple intensity to base wave intensity (this is key!)
    // Base wave always present + rain ripples on top
    const rainRippleAmount = rainRippleConfig.intensity * rainIntensity;
    const targetIntensity = waterLayer._originalWaveParams.intensity + rainRippleAmount;

    // Apply the blended parameters to the displacement filter
    waterLayer.displacementFilter.uniforms.u_speed = targetSpeed;
    waterLayer.displacementFilter.uniforms.u_scale = targetScale;
    
    // Store for WaterFXLayer to use when updating wave intensity (ADDITIVE)
    waterLayer._rainRippleIntensity = targetIntensity;
  }

  /**
   * Get target rain intensity for transition
   * @private
   */
  _getTargetRainIntensity() {
    switch (this.targetState) {
      case WeatherSystemManager.STATES.DRIZZLE:
        return 0.3;
      case WeatherSystemManager.STATES.RAIN:
        return 1.0;
      case WeatherSystemManager.STATES.STORM:
        return 1.8;
      case WeatherSystemManager.STATES.SLEET:
        return 0.6;
      default:
        return 0;
    }
  }

  /**
   * Apply puddle intensity based on current weather state.
   * Puddles gradually appear during rain/storm and fade out when weather clears.
   * After rain stops, puddles persist and slowly dry over configurable time (default 5 minutes).
   * @param {object} weather - Current weather state
   * @private
   */
  _applyPuddleIntensity(weather) {
    const waterLayer = canvas.layers.find(l => l instanceof WaterFXLayer);
    if (!waterLayer) return;

    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config?.water?.puddles?.enabled) {
      // If puddles are disabled, ensure intensity is 0
      waterLayer._puddleIntensity = 0;
      this._isPuddleDrying = false;
      this._puddleDryingStartTime = null;
      this._puddleInitialLoadTime = null;
      return;
    }

    // Determine base puddle intensity based on current weather state
    let puddleIntensity = 0;
    switch (this.currentState) {
      case WeatherSystemManager.STATES.DRIZZLE:
        puddleIntensity = 0.4;
        break;
      case WeatherSystemManager.STATES.RAIN:
        puddleIntensity = 0.8;
        break;
      case WeatherSystemManager.STATES.STORM:
        puddleIntensity = 1.0;
        break;
      case WeatherSystemManager.STATES.SLEET:
        puddleIntensity = 0.3;
        break;
      default:
        puddleIntensity = 0;
    }

    // Apply smooth transition during weather state changes
    // BUT: Don't fade puddles out during transition - keep them at peak until transition completes
    if (this.isTransitioning) {
      const targetIntensity = this._getTargetPuddleIntensity();
      
      // If transitioning TO rain (clear → rain), interpolate normally
      if (targetIntensity > puddleIntensity) {
        puddleIntensity = this._lerp(puddleIntensity, targetIntensity, this.transitionProgress);
      }
      // If transitioning AWAY from rain (rain → clear), keep at current intensity during transition
      // Drying will start AFTER transition completes
    }

    // Track maximum puddle intensity during rain for drying reference
    if (puddleIntensity > this._puddleMaxIntensity) {
      this._puddleMaxIntensity = puddleIntensity;
      // Reset drying if rain resumes
      this._isPuddleDrying = false;
      this._puddleDryingStartTime = null;
    }

    // Detect when rain stops (transitioning from rainy to clear weather)
    const isRaining = puddleIntensity > 0;
    const wasRaining = this._puddleMaxIntensity > 0;
    
    if (!isRaining && wasRaining && !this._isPuddleDrying) {
      // Rain just stopped - start drying process
      this._isPuddleDrying = true;
      this._puddleDryingStartTime = Date.now();
      // console.log(`MapShine | Puddles: Rain stopped. Beginning drying period from intensity ${this._puddleMaxIntensity.toFixed(2)}`);
    }

    // Apply gradual drying if rain has stopped
    if (this._isPuddleDrying && this._puddleDryingStartTime) {
      const dryingTimeMinutes = config.water.puddles.dryingTimeMinutes ?? 5;
      const dryingTimeMs = dryingTimeMinutes * 60 * 1000; // Convert minutes to milliseconds
      const elapsedMs = Date.now() - this._puddleDryingStartTime;
      const dryingProgress = Math.min(elapsedMs / dryingTimeMs, 1.0);
      
      // Apply ease-out curve for natural drying (fast at first, slower as it dries)
      const easedProgress = 1.0 - Math.pow(1.0 - dryingProgress, 2);
      
      // Decay from max intensity to 0 over drying period
      puddleIntensity = this._puddleMaxIntensity * (1.0 - easedProgress);
      
      // When fully dried, reset tracking
      if (dryingProgress >= 1.0) {
        this._isPuddleDrying = false;
        this._puddleDryingStartTime = null;
        this._puddleMaxIntensity = 0;
        puddleIntensity = 0;
        // console.log('MapShine | Puddles: Fully dried');
      }
    }

    // Apply gradual fade-in on initial scene load to prevent dark flash
    // This ensures outdoor masks and other textures are fully loaded before full intensity
    if (puddleIntensity > 0) {
      if (this._puddleInitialLoadTime === null) {
        this._puddleInitialLoadTime = Date.now();
      }
      
      const elapsedSinceLoad = Date.now() - this._puddleInitialLoadTime;
      if (elapsedSinceLoad < this._puddleInitialFadeDuration) {
        // Fade in from 0 to target intensity over fade duration
        const fadeProgress = elapsedSinceLoad / this._puddleInitialFadeDuration;
        // Use ease-in curve for smooth fade-in
        const easedFade = fadeProgress * fadeProgress;
        puddleIntensity *= easedFade;
      }
    } else {
      // Reset fade-in timer when puddles are not active
      this._puddleInitialLoadTime = null;
    }

    // Store puddle intensity for WaterFXLayer to use in shader
    waterLayer._puddleIntensity = puddleIntensity;
  }

  /**
   * Get target puddle intensity for transition
   * @private
   */
  _getTargetPuddleIntensity() {
    switch (this.targetState) {
      case WeatherSystemManager.STATES.DRIZZLE:
        return 0.4;
      case WeatherSystemManager.STATES.RAIN:
        return 0.8;
      case WeatherSystemManager.STATES.STORM:
        return 1.0;
      case WeatherSystemManager.STATES.SLEET:
        return 0.3;
      default:
        return 0;
    }
  }

  /**
   * Apply weather-based color correction to global ColorCorrectionFilter
   * Multiplies user's base color correction values by weather-specific multipliers
   * @param {object} weather - Current weather state with interpolated values
   * @private
   */
  _applyWeatherColorCorrection(weather) {
    // Get the global ColorCorrectionFilter from ScreenEffectsManager
    const ccFilter = ScreenEffectsManager.getFilter('colorCorrection');
    if (!ccFilter || !(ccFilter instanceof ColorCorrectionFilter)) {
      return; // Filter not available
    }

    // Get user's base color correction config
    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config?.postProcessing?.colorCorrection) return;
    
    const baseCCConfig = config.postProcessing.colorCorrection;
    
    // Get weather multipliers (defaults to 1.0 if not specified)
    const weatherCC = weather.colorCorrection || { saturation: 1.0, contrast: 1.0, brightness: 1.0 };
    
    // Apply weather multipliers to user's base values
    // This preserves user's look but modifies it for weather atmosphere
    const u = ccFilter.uniforms;
    u.uSaturation = baseCCConfig.saturation * weatherCC.saturation;
    u.uContrast = baseCCConfig.contrast * weatherCC.contrast;
    u.uBrightness = baseCCConfig.brightness * weatherCC.brightness;
    
    // Note: We only modify saturation, contrast, brightness
    // Other color correction properties (exposure, gamma, etc.) remain unchanged
    // This keeps weather effects subtle and focused on atmospheric mood
  }

  /**
   * Apply weather-based wind multipliers to WindManager
   * Multiplies user's base wind config values by weather-specific multipliers
   * @param {object} weather - Current weather state with interpolated values
   * @private
   */
  _applyWeatherWindMultipliers(weather) {
    const windManager = game.mapShine?.windManager;
    if (!windManager) return;

    // Get user's base wind config
    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config?.fire?.particles?.wind) return;
    
    const baseWindConfig = config.fire.particles.wind;
    
    // Get weather multipliers (defaults to 1.0 if not specified)
    const weatherWind = weather.windMultipliers || {
      baseSpeed: 1.0,
      gustSpeed: 1.0,
      gustFrequency: 1.0,
      gustDuration: 1.0,
      angleChangeFrequency: 1.0,
      angleChangeRange: 1.0
    };
    
    // Create modified config by multiplying base values with weather multipliers
    const modifiedConfig = {
      enabled: baseWindConfig.enabled,
      baseSpeed: baseWindConfig.baseSpeed * weatherWind.baseSpeed,
      gustSpeed: baseWindConfig.gustSpeed * weatherWind.gustSpeed,
      gustFrequencyMin: baseWindConfig.gustFrequencyMin * weatherWind.gustFrequency,
      gustFrequencyMax: baseWindConfig.gustFrequencyMax * weatherWind.gustFrequency,
      gustDurationMin: baseWindConfig.gustDurationMin * weatherWind.gustDuration,
      gustDurationMax: baseWindConfig.gustDurationMax * weatherWind.gustDuration,
      angleChangeFrequencyMin: baseWindConfig.angleChangeFrequencyMin * weatherWind.angleChangeFrequency,
      angleChangeFrequencyMax: baseWindConfig.angleChangeFrequencyMax * weatherWind.angleChangeFrequency,
      angleChangeRange: baseWindConfig.angleChangeRange * weatherWind.angleChangeRange
    };
    
    // Apply the modified config to WindManager
    windManager.updateFromConfig(modifiedConfig);
  }

  /**
   * Apply weather-based foliage multipliers to Bush and Tree distortion effects
   * Multiplies the user's base rustle/sway speeds by weather-specific multipliers
   * @param {object} weather - Current weather state with interpolated values
   * @private
   */
  _applyWeatherFoliageMultipliers(weather) {
    // Get weather multipliers (defaults to 1.0 if not specified)
    const foliageMult = weather.foliageMultipliers || {
      rustleSpeed: 1.0,
      swaySpeed: 1.0
    };
    
    // Only log when values actually change by more than 0.01
    if (!this._lastFoliageMult || 
        Math.abs(this._lastFoliageMult.rustleSpeed - foliageMult.rustleSpeed) > 0.01 ||
        Math.abs(this._lastFoliageMult.swaySpeed - foliageMult.swaySpeed) > 0.01) {
      // console.log(`MapShine | Applying foliage multipliers: rustle=${foliageMult.rustleSpeed.toFixed(2)}, sway=${foliageMult.swaySpeed.toFixed(2)} (state: ${this.currentState}, transitioning: ${this.isTransitioning})`);
      this._lastFoliageMult = { ...foliageMult };
    }
    
    // Apply to Bush layer
    const bushLayer = canvas.layers?.find(l => l instanceof BushLayer);
    if (bushLayer) {
      bushLayer.weatherMultipliers = {
        rustleSpeed: foliageMult.rustleSpeed,
        swaySpeed: foliageMult.swaySpeed
      };
    }
    
    // Apply to Tree layer
    const treeLayer = canvas.layers?.find(l => l instanceof TreeLayer);
    if (treeLayer) {
      treeLayer.weatherMultipliers = {
        rustleSpeed: foliageMult.rustleSpeed,
        swaySpeed: foliageMult.swaySpeed
      };
    }
  }

  /**
   * Start the target weather shaders at 0% intensity
   * @param {string} targetState - The target weather state
   * @private
   */
  _startTargetWeatherAtZero(targetState) {
    if (!this.weatherEffectLayer) return;
    
    // Determine which effect to activate based on target state
    switch (targetState) {
      case 'drizzle':
      case 'rain':
      case 'storm':
        // Start rain effect at 0% opacity/intensity BUT keep shader animating
        this.weatherEffectLayer.playEffect('rain', {
          opacity: 0.0,
          intensity: 0.0,
          strength: 0.0
        });
        // Ensure shader is animating (speed controls time accumulation)
        const rainEffect = this.weatherEffectLayer.effects.get('rain');
        if (rainEffect) {
          rainEffect.shader.speed = 0.2; // Match default from WeatherEffectLayer
        }
        console.log('MapShine | WeatherSystemManager: Started rain shader at 0% for transition');
        break;
      
      case 'snow':
      case 'blizzard':
        // Start snow effect - keep effect speed parameters but set alpha to 0
        const targetSpeed = targetState === 'blizzard' ? 8 : 2;
        this.weatherEffectLayer.playEffect('snow', {
          direction: 0.5,
          speed: targetSpeed, // Keep effect speed active
          scale: 2.5
        });
        // Set alpha to 0 to hide it, but shader will still animate
        const snowEffect = this.weatherEffectLayer.effects.get('snow');
        if (snowEffect) {
          snowEffect.shader.uniforms.alpha = 0.0;
          snowEffect.shader.speed = 1; // Ensure animation is active
        }
        console.log('MapShine | WeatherSystemManager: Started snow shader at 0% for transition');
        break;
      
      case 'sleet':
        // Start both rain and snow at 0% but keep them animating
        this.weatherEffectLayer.playEffect('rain', {
          opacity: 0.0,
          intensity: 0.0
        });
        this.weatherEffectLayer.playEffect('snow', {
          direction: 0.7,
          speed: 3 // Keep effect speed active
        });
        const rainSleet = this.weatherEffectLayer.effects.get('rain');
        const snowSleet = this.weatherEffectLayer.effects.get('snow');
        if (rainSleet) rainSleet.shader.speed = 0.2;
        if (snowSleet) {
          snowSleet.shader.uniforms.alpha = 0.0;
          snowSleet.shader.speed = 1;
        }
        console.log('MapShine | WeatherSystemManager: Started sleet shaders at 0% for transition');
        break;
    }
  }

  /**
   * Update weather shader visibility and parameters based on current weather state
   * SIMPLIFIED VERSION - Uses alpha-based fading instead of visibility toggling
   * @param {object} weather - Current weather state with interpolated values
   * @private
   */
  _updateWeatherShaders(weather) {
    if (!this.weatherEffectLayer) return;

    const config = game.mapShine?.profileManager?.activeConfig;
    if (!config) return;

    const currentStateDef = this.stateDefinitions[this.currentState];
    const targetStateDef = this.isTransitioning ? this.stateDefinitions[this.targetState] : null;

    // Calculate transition intensity with easing
    let transitionIntensity = this.isTransitioning ? this.transitionProgress : 1.0;
    if (this.isTransitioning) {
      const t = this.transitionProgress;
      transitionIntensity = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // Configure each effect type
    this._configureEffect('rain', currentStateDef, targetStateDef, transitionIntensity, config);
    this._configureEffect('snow', currentStateDef, targetStateDef, transitionIntensity, config);
    this._configureEffect('fog', currentStateDef, targetStateDef, transitionIntensity, config);
    
    // Apply weather-based color correction to global filter
    this._applyWeatherColorCorrection(weather);
    
    // Apply weather-based wind multipliers to WindManager
    this._applyWeatherWindMultipliers(weather);
    
    // Apply weather-based foliage multipliers to Bush and Tree layers
    this._applyWeatherFoliageMultipliers(weather);
  }

  /**
   * Configure a single weather effect with proper alpha-based fading
   * @param {string} effectType - Effect type ('rain', 'snow', 'fog')
   * @param {object} currentState - Current weather state definition
   * @param {object} targetState - Target weather state definition (null if not transitioning)
   * @param {number} transitionIntensity - Eased transition progress (0-1)
   * @param {object} config - Full weather configuration
   * @private
   */
  _configureEffect(effectType, currentState, targetState, transitionIntensity, config) {
    const effect = this.weatherEffectLayer.effects.get(effectType);
    if (!effect) {
      console.warn(`MapShine | WeatherSystemManager: Effect '${effectType}' not found`);
      return;
    }

    // Determine if this effect should be active in current/target states
    const activeInCurrent = this._isEffectActiveInState(effectType, currentState);
    const activeInTarget = targetState ? this._isEffectActiveInState(effectType, targetState) : false;

    if (!activeInCurrent && !activeInTarget) {
      // Effect not used in either state - hide it
      effect.visible = false;
      return;
    }

    // Effect is active - ensure it's visible and configure alpha
    effect.visible = true;

    // Calculate alpha based on transition state
    let alpha = 1.0;
    if (this.isTransitioning) {
      if (activeInCurrent && activeInTarget) {
        // Active in both - stay at full alpha
        alpha = 1.0;
      } else if (activeInCurrent) {
        // Fading out - reduce alpha
        alpha = 1.0 - transitionIntensity;
      } else {
        // Fading in - increase alpha
        alpha = transitionIntensity;
      }
    } else {
      // Not transitioning - full alpha
      alpha = 1.0;
    }

    // Apply configuration based on effect type
    if (effectType === 'rain') {
      this._configureRainEffect(effect, currentState, targetState, transitionIntensity, alpha, config);
    } else if (effectType === 'snow') {
      this._configureSnowEffect(effect, currentState, targetState, transitionIntensity, alpha, config);
    } else if (effectType === 'fog') {
      this._configureFogEffect(effect, currentState, targetState, transitionIntensity, alpha, config);
    }
  }

  /**
   * Check if an effect is active in a given weather state
   * @private
   */
  _isEffectActiveInState(effectType, stateDef) {
    if (!stateDef) return false;

    if (effectType === 'rain') {
      return stateDef.precipitationType === 'rain' || stateDef.precipitationType === 'sleet';
    } else if (effectType === 'snow') {
      return stateDef.precipitationType === 'snow' || stateDef.precipitationType === 'sleet';
    } else if (effectType === 'fog') {
      // Fog is used in storm and blizzard states
      const stateName = Object.keys(this.stateDefinitions).find(k => this.stateDefinitions[k] === stateDef);
      return stateName === 'storm' || stateName === 'blizzard';
    }

    return false;
  }

  /**
   * Configure rain effect parameters (Voronoi raindrop system)
   * @private
   */
  _configureRainEffect(effect, currentState, targetState, transitionIntensity, alpha, config) {
    const weatherConfig = config.weather;
    
    // Read base values from UI config (now properly connected!)
    const baseOpacity = weatherConfig.rain.opacity ?? 0.50;
    const baseIntensity = weatherConfig.rain.intensity ?? 1.00;
    const baseStrength = weatherConfig.rain.strength ?? 0.85;
    const baseRainDensity = weatherConfig.rain.rainDensity ?? 25.0;
    const baseGridSize = weatherConfig.rain.gridSize ?? 125;
    const baseStreakLength = weatherConfig.rain.streakLength ?? 40;
    const baseSplashIntensity = weatherConfig.rain.splashIntensity ?? 0.50;
    const baseWaveMaskIntensity = weatherConfig.rain.waveMaskIntensity ?? 0.75;
    const baseCurtainIntensity = weatherConfig.rain.curtainIntensity ?? 0.65;
    const baseWorleySpeed = weatherConfig.rain.worleySpeed ?? 1.0;
    
    // Determine which state we're in (handle transitions)
    const stateName = this.isTransitioning ? 
      (transitionIntensity < 0.5 ? this.currentState : this.targetState) : 
      this.currentState;

    // State-specific multipliers to maintain behavior differences
    let opacityMult = 1.0, intensityMult = 1.0, strengthMult = 1.0;
    let rainDensityMult = 1.0, gridSizeMult = 1.0, streakLengthMult = 1.0;
    let splashMult = 1.0, waveMaskMult = 1.0, curtainMult = 1.0;

    if (stateName === 'drizzle') {
      // Drizzle: 50% opacity, 60% intensity, lighter effects
      opacityMult = 0.5;        // 50% of base
      intensityMult = 0.6;       // 60% of base
      strengthMult = 0.82;       // 82% of base (0.70/0.85)
      rainDensityMult = 0.2;     // 20% of base (5/25)
      gridSizeMult = 1.2;        // 120% of base (150/125) - larger drops
      streakLengthMult = 1.5;    // 150% of base (60/40) - longer streaks
      splashMult = 0.5;          // 50% of base
      waveMaskMult = 0.67;       // 67% of base (0.50/0.75)
      curtainMult = 0.46;        // 46% of base (0.30/0.65)
    } else if (stateName === 'storm') {
      // Storm: 160% opacity, 150% intensity, extreme effects
      opacityMult = 1.6;         // 160% of base (0.80/0.50)
      intensityMult = 1.5;       // 150% of base
      strengthMult = 1.18;       // 118% of base (1.00/0.85)
      rainDensityMult = 4.0;     // 400% of base (99.99/25)
      gridSizeMult = 0.8;        // 80% of base (100/125) - smaller drops
      streakLengthMult = 0.5;    // 50% of base (20/40) - shorter streaks
      splashMult = 1.5;          // 150% of base (0.75/0.50)
      waveMaskMult = 1.33;       // 133% of base (1.00/0.75)
      curtainMult = 1.62;        // 162% of base (1.05/0.65)
    } else if (stateName === 'sleet') {
      // Sleet: 60% opacity, 80% intensity, mixed effects
      opacityMult = 0.6;         // 60% of base (0.30/0.50)
      intensityMult = 0.8;       // 80% of base
      strengthMult = 1.0;        // 100% of base (0.85/0.85)
      rainDensityMult = 0.32;    // 32% of base (8/25)
      gridSizeMult = 1.12;       // 112% of base (140/125)
      streakLengthMult = 1.25;   // 125% of base (50/40)
      splashMult = 0.6;          // 60% of base (0.30/0.50)
      waveMaskMult = 0.8;        // 80% of base (0.60/0.75)
      curtainMult = 0.62;        // 62% of base (0.40/0.65)
    } else {
      // Rain (normal): Use base values directly (all multipliers = 1.0)
      // This is the "reference" state that UI controls map to
    }

    // Apply parameters with state multipliers and alpha
    // NOTE: rainDensity, splashes, waves, and curtains are multiplied by alpha to fade in/out during transitions
    effect.shader.uniforms.opacity = baseOpacity * opacityMult * alpha;
    effect.shader.uniforms.intensity = baseIntensity * intensityMult;
    effect.shader.uniforms.strength = baseStrength * strengthMult;
    effect.shader.uniforms.rainDensity = baseRainDensity * rainDensityMult * alpha; // Ramp up particle count during transitions
    effect.shader.uniforms.gridSize = baseGridSize * gridSizeMult;
    effect.shader.uniforms.streakLength = baseStreakLength * streakLengthMult;
    effect.shader.uniforms.splashIntensity = baseSplashIntensity * splashMult * alpha; // Fade in splashes
    effect.shader.uniforms.waveMaskIntensity = baseWaveMaskIntensity * waveMaskMult * alpha; // Fade in wave gaps
    effect.shader.uniforms.curtainIntensity = baseCurtainIntensity * curtainMult * alpha; // Fade in curtains
    effect.shader.uniforms.worleySpeed = baseWorleySpeed;  // Pass uniform but don't use in shader
    effect.alpha = alpha;
  }

  /**
   * Configure snow effect parameters
   * @private
   */
  _configureSnowEffect(effect, currentState, targetState, transitionIntensity, alpha, config) {
    const weatherConfig = config.weather;
    const baseDirection = weatherConfig.snow.direction;
    const baseSpeed = weatherConfig.snow.speed;
    const baseScale = weatherConfig.snow.scale;

    // Determine multipliers based on state
    let directionMult = 1.0;
    let speedMult = 1.0;
    let scaleMult = 1.0;

    const stateName = this.isTransitioning ? 
      (transitionIntensity < 0.5 ? this.currentState : this.targetState) : 
      this.currentState;

    if (stateName === 'blizzard') {
      directionMult = 1.6;
      speedMult = 4.0;
      scaleMult = 1.0;
    } else if (stateName === 'sleet') {
      directionMult = 1.4;
      speedMult = 1.5;
      scaleMult = 0.8;
    }

    // Apply parameters with alpha
    effect.shader.uniforms.direction = baseDirection * directionMult;
    effect.shader.uniforms.speed = baseSpeed * speedMult;
    effect.shader.uniforms.scale = baseScale * scaleMult;
    effect.alpha = alpha;
  }

  /**
   * Configure fog effect parameters
   * @private
   */
  _configureFogEffect(effect, currentState, targetState, transitionIntensity, alpha, config) {
    const weatherConfig = config.weather;
    const baseIntensity = weatherConfig.fog.intensity;
    const baseSlope = weatherConfig.fog.slope;
    const baseSpeed = weatherConfig.fog.speed;

    // Determine multipliers based on state
    let intensityMult = 1.0;
    let slopeMult = 1.0;
    let speedMult = 1.0;

    const stateName = this.isTransitioning ? 
      (transitionIntensity < 0.5 ? this.currentState : this.targetState) : 
      this.currentState;

    if (stateName === 'storm') {
      intensityMult = 0.33;
      slopeMult = 3.3;
      speedMult = 13.75;
    } else if (stateName === 'blizzard') {
      intensityMult = 1.0;
      slopeMult = 2.2;
      speedMult = 1.0;
    }

    // Apply parameters with alpha
    effect.shader.uniforms.intensity = baseIntensity * intensityMult;
    effect.shader.uniforms.slope = baseSlope * slopeMult;
    effect.shader.uniforms.speed = baseSpeed * speedMult;
    effect.alpha = alpha;
  }

  /**
   * Update wind direction and turbulence on active weather shaders
   * @private
   */
  _updateWindOnShaders() {
    const windManager = game.mapShine?.windManager;
    if (!windManager || !this.weatherEffectLayer) return;

    const rainEffect = this.weatherEffectLayer.effects.get('rain');
    const snowEffect = this.weatherEffectLayer.effects.get('snow');
    const fogEffect = this.weatherEffectLayer.effects.get('fog');

    // Get weather config once at the top - used by all shader updates
    const weatherConfig = game.mapShine?.profileManager?.activeConfig?.weather;

    // Convert wind angle (0° = East) to rain rotation in radians
    // Wind direction represents where wind is blowing TO
    // Rain should fall at an angle based on wind direction
    const windAngleRad = (windManager.angle * Math.PI / 180);
    
    // Calculate turbulence based on gust strength (0 to 1)
    const gustStrength = windManager.getNormalizedStrength();
    const turbulence = gustStrength * 0.3; // Max 0.3 turbulence during peak gusts

    // Update rain shader with wind-based direction (shear), speed, and turbulence
    if (rainEffect?.shader) {
      // Calculate wind velocity in screen coordinates
      // 0° = East (+X), 90° = North (-Y in screen coords), 180° = West (-X), 270° = South (+Y)
      const velocityX = Math.cos(windAngleRad);
      const velocityY = -Math.sin(windAngleRad);  // Negate for screen coordinates (Y increases down)
      
      // RainShaderAdvanced SUBTRACTS windDirection from UV (line 78: `uv -= windDirection * time`)
      // So we pass velocity directly WITHOUT negation (negation only needed for shaders that ADD)
      // This matches the standard convention: wind vector points in the direction wind is blowing
      
      // Apply wind direction to shader
      rainEffect.shader.uniforms.windDirection = [velocityX, velocityY];
      rainEffect.shader.uniforms.windStrength = windManager.getNormalizedStrength();
      
      // SIMPLIFIED APPROACH: Only modulate speed during gusts
      // Intensity/opacity/strength stay constant to avoid sudden brightness changes
      // Speed changes create visual dynamism without jarring brightness shifts
      
      // Calculate target speed multiplier based on current turbulence
      const targetSpeedMult = 1.0 + (turbulence * 1.5); // Up to 45% faster during gusts
      
      // Asymmetric lerp: fast ramp-up (~1 second), slow ramp-down (~3-4 seconds)
      const fastLerpRate = 0.05; // ~1 second at 60fps
      const slowLerpRate = 0.015; // ~3-4 seconds at 60fps
      const speedLerp = targetSpeedMult > this._smoothedSpeedMultiplier ? fastLerpRate : slowLerpRate;
      this._smoothedSpeedMultiplier += (targetSpeedMult - this._smoothedSpeedMultiplier) * speedLerp;
      
      // Apply speed multiplier only
      const userBaseSpeed = weatherConfig?.rain?.speed ?? 1.0;
      const windSpeedNormalized = windManager.speed / 10; // Normalize: baseSpeed=5 -> 0.5, gustSpeed=15 -> 1.5
      rainEffect.shader.speed = userBaseSpeed * windSpeedNormalized * this._smoothedSpeedMultiplier;
      
      // Apply static visual properties (no gust modulation)
      const baseStrength = weatherConfig?.rain?.strength ?? 1.0;
      rainEffect.shader.uniforms.strength = baseStrength;
      
      const baseIntensity = weatherConfig?.rain?.intensity ?? 1.0;
      rainEffect.shader.uniforms.intensity = baseIntensity;
      
      const baseOpacity = weatherConfig?.rain?.opacity ?? 0.7;
      rainEffect.shader.uniforms.opacity = baseOpacity;
      
      // NOTE: dropSpawnThreshold is now controlled by rainDensity uniform set in _configureRainEffect
      // The shader calculates densityThreshold from rainDensity using: pow(rainDensity, 0.7) * 0.4
      // This provides better user control via the UI slider (0=no rain, 3=storm)
    }

    // Update snow shader with wind-based direction, speed, and turbulence
    if (snowEffect?.shader) {
      // Snow uses SMOOTHED angle for slow, cloud-like inertia (not reactive gusts)
      const snowWindAngleRad = (windManager.smoothedAngle * Math.PI / 180);
      
      // Calculate wind velocity in screen coordinates
      // 0° = East (+X), 90° = North (-Y in screen coords), 180° = West (-X), 270° = South (+Y)
      const velocityX = Math.cos(snowWindAngleRad);
      const velocityY = -Math.sin(snowWindAngleRad);  // Negate for screen coordinates (Y increases down)
      
      // SnowShaderAdvanced ADDS to UV (line 97: `snowuv += windDirection * time`)
      // When adding to UV, pattern moves OPPOSITE to scroll direction
      // MUST NEGATE velocity (per WindManager docs lines 13605-13606)
      snowEffect.shader.uniforms.windDirection = [-velocityX, -velocityY];
      
      // Snow gusts at 25% strength - heavy snow has massive inertia
      const snowGustStrength = windManager.getNormalizedStrength() * 0.25;
      snowEffect.shader.uniforms.windStrength = snowGustStrength;
      
      // Configure snow-specific parameters
      const baseDriftAmount = weatherConfig?.snow?.driftAmount ?? 1.0;
      const baseSnowDensity = weatherConfig?.snow?.snowDensity ?? 1.0;
      
      // Apply reduced turbulence to drift (snow resists gusts)
      const snowTurbulence = snowGustStrength * 0.3; // Same calculation as rain, but with reduced gust strength
      const driftMultiplier = 1.0 + (snowTurbulence * 0.5);
      snowEffect.shader.uniforms.driftAmount = baseDriftAmount * driftMultiplier;
      snowEffect.shader.uniforms.snowDensity = baseSnowDensity;
      
      // Snow shader speed (animation rate) - gusts affect speed, not position
      // Since we removed windStrength from the shader's drift calculation,
      // we can now safely modulate speed without causing position jumps
      const baseSpeed = weatherConfig?.snow?.speed ?? 0.5;
      const windSpeedNormalized = windManager.smoothedSpeed / 10; // Use smoothedSpeed for stable base
      const gustSpeedMultiplier = 1.0 + (snowTurbulence * 2.0); // Gusts speed up animation by up to ~15%
      snowEffect.shader.speed = baseSpeed * windSpeedNormalized * gustSpeedMultiplier;
    }

    // Update fog shader with wind-based speed and rotation
    if (fogEffect?.shader) {
      const baseSpeed = weatherConfig?.fog?.speed ?? 10.0;
      const speedMultiplier = 1.0 + (windManager.speed / 50);
      fogEffect.shader.uniforms.speed = baseSpeed * speedMultiplier;
      
      // Rotate fog slightly based on wind angle and turbulence
      const baseFogRotation = weatherConfig?.fog?.rotation ?? 0;
      const windAngleRad = (windManager.angle * Math.PI) / 180;
      const rotationVariation = turbulence * 0.2; // Add subtle turbulent rotation
      fogEffect.shader.uniforms.rotation = baseFogRotation + windAngleRad + rotationVariation;
    }
  }

  /**
   * Update edge droplet system (only during rain states for performance)
   * @param {number} deltaTime - Time delta in seconds
   * @private
   */
  _updateEdgeDroplets(deltaTime) {
    if (!this.edgeDropletController) return;
    
    // Only run edge droplets during rain states (performance optimization)
    const rainStates = ['drizzle', 'rain', 'storm'];
    const isCurrentlyRaining = rainStates.includes(this.currentState);
    const isTransitioningToRain = this.isTransitioning && rainStates.includes(this.targetState) && !rainStates.includes(this.currentState);
    const isTransitioningFromRain = this.isTransitioning && rainStates.includes(this.currentState) && !rainStates.includes(this.targetState);
    const shouldRun = isCurrentlyRaining || isTransitioningToRain;
    
    if (shouldRun) {
      // Handle START of transition into rain state (gradual ramp-up)
      if (isTransitioningToRain && !this.edgeDropletController.emitter.emit && !this.edgeDropletController.isFadingIn) {
        const fadeInDuration = this.transitionDuration;
        this.edgeDropletController.beginFadeIn(fadeInDuration);
      }
      // Handle STEADY rain state - ensure emitter is at full strength if not transitioning
      else if (isCurrentlyRaining && !this.isTransitioning && !this.edgeDropletController.emitter.emit) {
        // We're in a rain state but not emitting (e.g., scene just loaded in storm)
        // Start immediately at full strength (no fade-in needed, we're already in the state)
        this.edgeDropletController.start();
      }
      // Update emitter (handles fades and particle simulation)
      this.edgeDropletController.update(deltaTime);
    } else if (isTransitioningFromRain && !this.edgeDropletController.isFadingOut) {
      // Transitioning OUT of rain state - begin gradual fade-out over 2x transition duration
      const fadeOutDuration = this.transitionDuration * 2;
      this.edgeDropletController.beginFadeOut(fadeOutDuration);
      this.edgeDropletController.update(deltaTime);
    } else if (this.edgeDropletController.isFadingOut || this.edgeDropletController.isFadingIn) {
      // Continue updating during any active fade
      this.edgeDropletController.update(deltaTime);
    } else {
      // Not in rain state - stop emitting but continue updating existing particles
      if (this.edgeDropletController.emitter) {
        // Stop emitting new particles (if not already stopped)
        if (this.edgeDropletController.emitter.emit) {
          this.edgeDropletController.stop();
        }
        
        // CRITICAL: Continue calling update() to let existing particles finish their lifetime
        // Without this, particles freeze in place when transition completes
        if (this.edgeDropletController.emitter.particleCount > 0) {
          this.edgeDropletController.update(deltaTime);
        }
      }
    }
  }

  /**
   * Get diagnostic information for UI display
   */
  getDiagnostics() {
    const weather = this.getCurrentWeatherState();
    
    // Get cloud texture status message
    let cloudTextureStatus = 'Unknown';
    if (!game.mapShine?.resourceManager) {
      cloudTextureStatus = 'ResourceManager missing';
    } else {
      const cloudLayer = canvas.layers?.find(l => l instanceof CloudShadowsLayer);
      if (!cloudLayer) {
        cloudTextureStatus = 'CloudShadowsLayer not found';
      } else if (!cloudLayer.visible) {
        cloudTextureStatus = 'CloudShadows disabled';
      } else if (!cloudLayer.rawCloudTexture) {
        cloudTextureStatus = 'Not rendered yet';
      } else if (!this.cloudTextureValid) {
        cloudTextureStatus = 'Texture invalid';
      } else {
        cloudTextureStatus = 'Valid';
      }
    }
    
    return {
      // System status
      isReady: this.isReady,
      cloudTextureValid: this.cloudTextureValid,
      cloudTextureStatus: cloudTextureStatus,
      currentState: this.currentState,  // Add current state key for diagnostics UI
      targetState: this.targetState,
      isTransitioning: this.isTransitioning,
      transitionProgress: this.isTransitioning ? `${(this.transitionProgress * 100).toFixed(1)}%` : 'N/A',
      
      // Weather properties
      weatherName: weather.name,
      cloudDensity: weather.cloudDensity.toFixed(2),
      precipitationType: weather.precipitationType,
      precipitationIntensity: weather.precipitationIntensity.toFixed(2),
      
      // Shader system
      shaderLayerActive: this.weatherEffectLayer !== null,
      effectsCount: this.weatherEffectLayer?.effects?.size || 0,
      
      // System health
      lastError: this.lastError,
      lastErrorTime: this.lastError ? new Date(this.lastErrorTime).toLocaleTimeString() : null,
      
      // Wind multipliers (from weather state)
      windBase: weather.windMultipliers?.baseSpeed?.toFixed(2) ?? '1.00',
      windGust: weather.windMultipliers?.gustSpeed?.toFixed(2) ?? '1.00',
      windGustFreq: weather.windMultipliers?.gustFrequency?.toFixed(2) ?? '1.00',
      
      // Actual wind values (from WindManager)
      windManagerSpeed: game.mapShine?.windManager?.speed?.toFixed(1) ?? 'N/A',
      windManagerBaseSpeed: game.mapShine?.windManager?.config?.baseSpeed?.toFixed(1) ?? 'N/A',
      windManagerGustSpeed: game.mapShine?.windManager?.config?.gustSpeed?.toFixed(1) ?? 'N/A',
      windManagerIsGusting: game.mapShine?.windManager?._isGusting ? 'Yes' : 'No'
    };
  }

  /**
   * Run automated test sequence through all weather states
   * Useful for quick visual validation of transitions
   * @param {number} [dwellTime=5000] - Time to pause on each state in milliseconds
   * @param {number} [transitionTime=3000] - Transition duration in milliseconds
   * @returns {Promise<void>}
   */
  async runTestSequence(dwellTime = 5000, transitionTime = 3000) {
    console.log('MapShine | Weather Test Sequence Starting...');
    console.log(`  Dwell time: ${dwellTime}ms, Transition time: ${transitionTime}ms`);
    
    // Test sequence 1: Clear → Storm (rain progression)
    const rainSequence = ['clear', 'drizzle', 'rain', 'storm'];
    
    // Test sequence 2: Storm → Clear (reverse)
    const clearSequence = ['storm', 'rain', 'drizzle', 'clear'];
    
    // Test sequence 3: Clear → Blizzard (snow progression)
    const snowSequence = ['clear', 'snow', 'blizzard'];
    
    const fullSequence = [...rainSequence, ...clearSequence, ...snowSequence];
    
    for (let i = 0; i < fullSequence.length; i++) {
      const state = fullSequence[i];
      const nextState = fullSequence[i + 1];
      
      console.log(`MapShine | Test [${i + 1}/${fullSequence.length}]: Transitioning to ${state.toUpperCase()}`);
      
      // Start transition
      this.transitionToState(state, transitionTime);
      
      // Wait for transition to complete + dwell time
      const totalWait = transitionTime + dwellTime;
      await new Promise(resolve => setTimeout(resolve, totalWait));
      
      // Show what's next
      if (nextState) {
        console.log(`  → Next: ${nextState}`);
      }
    }
    
    console.log('MapShine | Weather Test Sequence Complete! ✓');
    console.log(`  Total states tested: ${fullSequence.length}`);
    console.log(`  Total time: ${((transitionTime + dwellTime) * fullSequence.length / 1000).toFixed(1)}s`);
  }

  /**
   * Linear interpolation helper
   */
  _lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Set the initial weather state from config
   * @param {string} state - Weather state to set
   */
  setInitialState(state) {
    console.warn(`MapShine | 🌦️ setInitialState() called with: ${state}`);
    const stateLowercase = state?.toLowerCase() || 'clear';
    if (!Object.values(WeatherSystemManager.STATES).includes(stateLowercase)) {
      console.warn(`MapShine | WeatherSystemManager: Invalid initial state '${stateLowercase}', defaulting to 'clear'`);
      this.currentState = WeatherSystemManager.STATES.CLEAR;
      this.targetState = WeatherSystemManager.STATES.CLEAR;
      return;
    }
    
    this.currentState = stateLowercase;
    this.targetState = stateLowercase;
    this.isTransitioning = false;
    console.warn(`MapShine | WeatherSystemManager: Initial state set to '${stateLowercase}'`);
    console.warn(`  - weatherEffectLayer exists:`, !!this.weatherEffectLayer);
    
    // Apply the initial state immediately (no transition)
    if (this.weatherEffectLayer) {
      // Use full config from profileManager to ensure all weather properties are available
      const config = game.mapShine?.profileManager?.activeConfig;
      if (config) {
        console.warn(`  - Calling updateFromConfig on weatherEffectLayer...`);
        this.weatherEffectLayer.updateFromConfig(config);
        console.warn(`  - updateFromConfig complete`);
        
        // Check precipitation type for this state
        const stateDef = this.stateDefinitions[stateLowercase];
        console.warn(`  - State definition precipitationType:`, stateDef?.precipitationType);
      } else {
        console.warn(`  - ❌ No config available from profileManager!`);
      }
    } else {
      console.warn(`  - ❌ weatherEffectLayer is NULL!`);
    }
  }

  /**
   * Initialize the weather system
   */
  async initialize() {
    console.warn('MapShine | 🌦️ WeatherSystemManager.initialize() starting...');
    try {
      // Import and initialize the centralized weather state management system
      const { WeatherStateManager } = await import('./weather/WeatherStateManager.js');
      const { TransitionRegistry } = await import('./weather/TransitionRegistry.js');
      const { EffectRegistry } = await import('./weather/EffectRegistry.js');
      console.warn('  - WeatherStateManager modules imported');
      
      // Initialize the core weather management systems
      this.weatherStateManager = new WeatherStateManager();
      this.transitionRegistry = new TransitionRegistry();
      this.effectRegistry = new EffectRegistry();
      
      // Initialize transition rules
      this.transitionRegistry.initializeDefaultRules();
      console.warn('  - TransitionRegistry initialized with default rules');
      
      // Initialize weather state manager
      await this.weatherStateManager.initialize();
      console.warn('  - WeatherStateManager initialized');
      
      // Import and initialize the shader-based weather system
      const { WeatherEffectLayer } = await import('./weather/WeatherEffectLayer.js');
      console.warn('  - WeatherEffectLayer module imported');
      
      // Create the weather effect layer
      this.weatherEffectLayer = new WeatherEffectLayer();
      console.warn('  - WeatherEffectLayer instance created');
      await this.weatherEffectLayer.initialize();
      console.warn('  - WeatherEffectLayer initialized');
      
      // Register weather systems with the EffectRegistry
      this._registerWeatherSystems();
      console.warn('  - Weather systems registered with EffectRegistry');
      
      // Add the layer to canvas (ABOVE overhead tiles/effects)
      // The _Outdoors mask in the shader will hide weather in indoor areas
      // 
      // CRITICAL: OverheadEffectLayer, BushLayer, TreeLayer are in canvas.environment (zIndex 700, 115, 116)
      // Foundry renders canvas.primary FIRST, then canvas.environment SECOND
      // We MUST add weather to canvas.environment with zIndex > 700 to render above overhead tiles
      if (canvas.environment) {
        // Enable sortableChildren so zIndex is respected
        canvas.environment.sortableChildren = true;
        
        // Set weather layer to HIGH zIndex (800) to render above OverheadEffectLayer (zIndex 700)
        this.weatherEffectLayer.zIndex = 800;
        
        // Add weather layer to canvas.environment (NOT canvas.primary)
        canvas.environment.addChild(this.weatherEffectLayer);
        const weatherIndex = canvas.environment.children.indexOf(this.weatherEffectLayer);
        console.warn(`  - Weather layer added to canvas.environment at index ${weatherIndex} with zIndex=800`);
        console.warn(`  - This places weather ABOVE OverheadEffectLayer (zIndex=700), BushLayer (115), TreeLayer (116)`);
        console.log('MapShine | WeatherSystemManager: Weather shader layer positioned above overhead tiles');
      } else {
        console.warn('  - ❌ canvas.environment is NULL!');
      }
      
      // Edge droplet system (raindrop particles from building edges)
      // Uses WeatherParticleLayer for independent z-index control
      this.weatherParticleLayer = canvas.weatherParticleLayer;
      
      const config = game.mapShine?.profileManager?.activeConfig;
      if (config?.weather?.edgeDroplets?.enabled) {
        try {
          this.edgeDropletController = new WeatherEdgeDropletController(config.weather.edgeDroplets);
          this.edgeDropletController.initialize();
          
          // Add container to WeatherParticleLayer (renders below overhead at zIndex 650)
          if (this.weatherParticleLayer) {
            this.weatherParticleLayer.addChild(this.edgeDropletController.container);
            console.log('MapShine | WeatherSystemManager: Edge droplet container added to WeatherParticleLayer (zIndex 650)');
          } else {
            console.warn('MapShine | WeatherSystemManager: WeatherParticleLayer not found! Edge droplets will not render.');
          }
          
          console.log('MapShine | WeatherSystemManager: Edge droplet system initialized');
        } catch (error) {
          console.warn('MapShine | WeatherSystemManager: Edge droplet initialization failed:', error);
        }
      } else {
        console.log('MapShine | WeatherSystemManager: Edge droplet system disabled in config');
      }
      
      this.isReady = true;
      console.log('MapShine | WeatherSystemManager: Initialized successfully with shader system');
      return true;
    } catch (e) {
      this.lastError = `Initialization failed: ${e.message}`;
      this.lastErrorTime = Date.now();
      this.isReady = false;
      console.error(`MapShine | WeatherSystemManager: ${this.lastError}`, e);
      return false;
    }
  }

  /**
   * Register all weather systems with the EffectRegistry
   * This enables centralized weather state management
   * @private
   */
  _registerWeatherSystems() {
    // Register WeatherEffectLayer (shader-based weather effects)
    if (this.weatherEffectLayer) {
      this.effectRegistry.registerEffect('weatherShaders', {
        updateFunction: (weatherState) => {
          // Update shader-based weather effects
          this.weatherEffectLayer.updateFromConfig({ weather: weatherState });
        },
        transitionFunction: (fromState, toState, progress, interpolatedState) => {
          // Handle smooth transitions between shader states
          this.weatherEffectLayer.updateFromConfig({ weather: interpolatedState });
        },
        priority: 1, // High priority - effects should update first
        capabilities: ['rain', 'snow', 'fog', 'shader-based'],
        dependencies: [],
        enabled: true
      });
    }
    
    // Register WindManager (wind system integration)
    if (game.mapShine?.windManager) {
      this.effectRegistry.registerEffect('windSystem', {
        updateFunction: (weatherState) => {
          // Apply weather-specific wind parameters
          if (weatherState.environment?.windMultipliers) {
            const windConfig = {
              baseSpeed: weatherState.environment.windMultipliers.baseSpeed * 100,
              gustSpeed: weatherState.environment.windMultipliers.gustSpeed * 150,
              gustFrequency: weatherState.environment.windMultipliers.gustFrequency,
              gustDuration: weatherState.environment.windMultipliers.gustDuration * 1000,
              angleChangeFrequency: weatherState.environment.windMultipliers.angleChangeFrequency,
              angleChangeRange: weatherState.environment.windMultipliers.angleChangeRange
            };
            game.mapShine.windManager.updateFromConfig(windConfig);
          }
        },
        transitionFunction: (fromState, toState, progress, interpolatedState) => {
          if (interpolatedState.environment?.windMultipliers) {
            const windConfig = {
              baseSpeed: interpolatedState.environment.windMultipliers.baseSpeed * 100,
              gustSpeed: interpolatedState.environment.windMultipliers.gustSpeed * 150,
              gustFrequency: interpolatedState.environment.windMultipliers.gustFrequency,
              gustDuration: interpolatedState.environment.windMultipliers.gustDuration * 1000,
              angleChangeFrequency: interpolatedState.environment.windMultipliers.angleChangeFrequency,
              angleChangeRange: interpolatedState.environment.windMultipliers.angleChangeRange
            };
            game.mapShine.windManager.updateFromConfig(windConfig);
          }
        },
        priority: 2, // Medium priority
        capabilities: ['wind', 'environmental'],
        dependencies: [],
        enabled: true
      });
    }
    
    // Register CloudShadowsLayer (cloud system integration)
    const cloudShadowsLayer = canvas.layers?.find(l => l instanceof CloudShadowsLayer);
    if (cloudShadowsLayer) {
      this.effectRegistry.registerEffect('cloudSystem', {
        // No-op: CloudShadowsLayer reads weather every frame in renderEffectNow()
        updateFunction: (_weatherState) => {},
        transitionFunction: (_fromState, _toState, _progress, _interpolatedState) => {},
        priority: 3, // Lower priority
        capabilities: ['clouds', 'shadows'],
        dependencies: [],
        enabled: true
      });
    }
    
    // Register precipitation particle system
    if (this.precipitationController) {
      this.effectRegistry.registerEffect('precipitationParticles', {
        updateFunction: (weatherState) => {
          // Update precipitation particle configuration
          if (weatherState.precipitation) {
            this.updatePrecipitation({ 
              weather: {
                ...weatherState,
                particleCount: weatherState.precipitation.particleCount,
                precipitationType: weatherState.precipitation.type,
                precipitationIntensity: weatherState.precipitation.intensity
              }
            });
          }
        },
        transitionFunction: (fromState, toState, progress, interpolatedState) => {
          if (interpolatedState.precipitation) {
            this.updatePrecipitation({ 
              weather: {
                ...interpolatedState,
                particleCount: Math.floor(interpolatedState.precipitation.particleCount),
                precipitationType: interpolatedState.precipitation.type,
                precipitationIntensity: interpolatedState.precipitation.intensity
              }
            });
          }
        },
        priority: 4, // Low priority
        capabilities: ['particles', 'precipitation'],
        dependencies: ['weatherShaders'],
        enabled: true
      });
    }
    
    // Register edge droplet system
    if (this.edgeDropletController) {
      this.effectRegistry.registerEffect('edgeDroplets', {
        updateFunction: (weatherState) => {
          // Enable/disable edge droplets based on weather state
          const isRainy = weatherState.precipitation?.type === 'rain' || 
                         weatherState.precipitation?.type === 'sleet' ||
                         weatherState.precipitation?.type === 'storm';
          
          if (this.edgeDropletController.container) {
            this.edgeDropletController.container.visible = isRainy;
          }
        },
        priority: 5, // Lowest priority
        capabilities: ['edge-effects', 'droplets'],
        dependencies: ['weatherShaders'],
        enabled: true
      });
    }
    
    // Now that systems are registered, set up the WeatherStateManager to use them
    this.weatherStateManager.registerSystem('weatherEffectLayer', {
      updateFunction: (weatherState) => {
        // Apply weather state to all registered effects
        this.effectRegistry.applyWeatherState(weatherState);
      },
      transitionFunction: (fromState, toState, progress) => {
        // Apply transition to all registered effects
        const fromDef = this.weatherStateManager.getStateDefinition(fromState);
        const toDef = this.weatherStateManager.getStateDefinition(toState);
        this.effectRegistry.applyWeatherTransition(fromState, toState, progress, fromDef, toDef);
      },
      priority: 1,
      enabled: true
    });
    
    console.log(`WeatherSystemManager | Registered ${this.effectRegistry.registeredEffects.size} weather systems`);
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.isReady = false;
    
    // Destroy edge droplet controller
    if (this.edgeDropletController) {
      try {
        this.edgeDropletController.destroy();
        console.log('MapShine | WeatherSystemManager: Edge droplet controller destroyed');
      } catch (error) {
        console.warn('MapShine | WeatherSystemManager: Error destroying edge droplet controller:', error);
      }
      this.edgeDropletController = null;
    }
    
    // Destroy shader-based weather layer
    if (this.weatherEffectLayer) {
      try {
        this.weatherEffectLayer.destroy();
        console.log('MapShine | WeatherSystemManager: Weather effect layer destroyed');
      } catch (error) {
        console.warn('MapShine | WeatherSystemManager: Error destroying weather effect layer:', error);
      }
      this.weatherEffectLayer = null;
    }
    
    // Clear reference to weather particle layer (managed by Foundry's layer lifecycle)
    this.weatherParticleLayer = null;
    
    console.log('MapShine | WeatherSystemManager destroyed');
  }
}

// Expose WeatherSystemManager globally for lifecycle initialization guards
// Allows MapShineLifecycle to detect and instantiate the constructor when available
globalThis.WeatherSystemManager = globalThis.WeatherSystemManager || WeatherSystemManager;

class TextureMaskShape {
  static type = "textureMask";

  constructor(config) {
    this.width = config.width;
    this.height = config.height;
    this.offsetX = config.x || 0;
    this.offsetY = config.y || 0;
    this.threshold = config.threshold ?? 128;
    this.spawnMode = config.spawnMode || "threshold";
    this.upperThreshold = config.upperThreshold ?? 255;
    this.validPoints = [];
    this.texture = null;
    this.colorTexture = null; // Separate texture for color sampling
    this.colorTexturePath = config.colorTexturePath || null; // Path to load color texture from
    this.pointCompilationDensity = 4;
    this.isDynamicScreenMask = config.isDynamicScreenMask ?? false;

    // New state properties
    this.isCompiled = false;
    this.isCompiling = false;
    this._compilationPromise = null;

    const textureSource = config.texture;

    if (!textureSource) {
      console.error("TextureMaskShape | No texture source provided in config.");
      this.texture = PIXI.Texture.EMPTY;
      this.isCompiled = true; // Mark as compiled since there's nothing to do
      return;
    }

    // This part remains synchronous as texture loading is already async
    // and handled by the controller.
    if (textureSource instanceof PIXI.Texture) {
      this.texture = textureSource;
    } else if (typeof textureSource === "string") {
      // The actual texture loading is now handled before this class is even instantiated.
      // We expect a PIXI.Texture object. For safety, we'll log an error.
      console.error(
        "TextureMaskShape | Constructor received a path string instead of a PIXI.Texture. This is deprecated."
      );
      this.texture = PIXI.Texture.EMPTY;
      this.isCompiled = true;
    } else {
      console.warn(
        "TextureMaskShape | Unknown texture source type provided:",
        textureSource
      );
      this.texture = PIXI.Texture.EMPTY;
      this.isCompiled = true;
    }

    // Automatically start the asynchronous point compilation process upon creation.
    this.compilePoints();
  }

  /**
   * Forces the shape to discard its current spawn points and re-calculate them.
   * This is crucial for dynamic masks that change with camera movement.
   */
  forceRecompile() {
    // Don't start a new compilation if one is already running to prevent redundant work.
    if (this.isCompiling) return;

    // Reset the state to allow compilePoints to run again.
    this.isCompiled = false;
    this.isCompiling = false;
    this._compilationPromise = null;
    this.compilePoints();
  }

  /**
   * Asynchronously compiles the list of valid spawn points from the texture mask.
   * This is now the main performance-intensive method.
   * @returns {Promise<void>} A promise that resolves when compilation is complete.
   */
  compilePoints() {
    if (this.isCompiling || (this.isCompiled && this._compilationPromise)) {
      return this._compilationPromise || Promise.resolve();
    }

    this.isCompiling = true;
    this._compilationPromise = new Promise((resolve, reject) => {
      // Yield to the event loop to prevent blocking on the first frame
      setTimeout(async () => {
        await this._performCompilation(resolve, reject);
      }, 0);
    });
    return this._compilationPromise;
  }

  async _performCompilation(resolve, reject) {
    const renderer = canvas.app?.renderer;
    
    // Defer compilation if renderer or BatchRenderer isn't initialized
    if (!renderer?.gl && !renderer?.context) {
      console.warn("TextureMaskShape | Renderer context not ready, deferring compilation");
      this.isCompiled = false;
      this.isCompiling = false;
      resolve();
      return;
    }
    
    // Check if BatchRenderer is ready (critical for sprite rendering)
    const batchRenderer = renderer.plugins?.batch;
    if (!batchRenderer || !batchRenderer._bufferedElements) {
      console.warn("TextureMaskShape | BatchRenderer not ready, deferring compilation");
      this.isCompiled = false;
      this.isCompiling = false;
      resolve();
      return;
    }
    
    if (
      !this.texture?.valid ||
      !this.texture?.baseTexture?.valid ||
      this.texture.width === 0 ||
      this.texture.height === 0
    ) {
      this.isCompiled = true;
      this.isCompiling = false;
      resolve();
      return;
    }

    this.validPoints.length = 0;
    const texture = this.texture;
    const step = Math.max(1, Math.floor(this.pointCompilationDensity));

    try {
      // Load color texture if a path is provided (for metallic glints)
      if (this.colorTexturePath && !this.colorTexture) {
        try {
          this.colorTexture = await TextureLoader.loadTexture(
            this.colorTexturePath
          );
        } catch (e) {
          console.warn("TextureMaskShape | Failed to load color texture:", e);
          this.colorTexture = null;
        }
      }

      // Validate texture has a valid baseTexture before creating render texture
      if (!texture.baseTexture || !texture.baseTexture.valid) {
        console.warn("TextureMaskShape | Texture baseTexture is null or invalid, skipping compilation");
        this.isCompiled = true;
        this.isCompiling = false;
        resolve();
        return;
      }

      const renderTexture = PIXI.RenderTexture.create({
        width: texture.width,
        height: texture.height,
      });
      const sprite = new PIXI.Sprite(texture);
      
      // Validate sprite and texture before rendering
      if (!sprite.texture?.baseTexture?.valid || sprite.destroyed || !sprite.texture.baseTexture) {
        console.warn("TextureMaskShape | Invalid sprite or texture, skipping compilation");
        sprite.destroy();
        renderTexture.destroy(true);
        this.isCompiled = true;
        this.isCompiling = false;
        resolve();
        return;
      }
      
      renderer.render(sprite, {
        renderTexture: renderTexture,
        clear: true,
      });
      const pixelData = renderer.extract.pixels(renderTexture);
      sprite.destroy();
      renderTexture.destroy(true); // Clean up the temporary texture

      // Extract color data from the color texture if available
      let colorPixelData = null;
      if (this.colorTexture?.valid && this.colorTexture?.baseTexture?.valid) {
        const colorRenderTexture = PIXI.RenderTexture.create({
          width: this.colorTexture.width,
          height: this.colorTexture.height,
        });
        const colorSprite = new PIXI.Sprite(this.colorTexture);
        
        // Validate color sprite before rendering
        if (colorSprite.texture?.baseTexture?.valid && !colorSprite.destroyed) {
          renderer.render(colorSprite, {
            renderTexture: colorRenderTexture,
            clear: true,
          });
          colorPixelData = renderer.extract.pixels(colorRenderTexture);
        } else {
          console.warn("TextureMaskShape | Invalid color sprite, skipping color extraction");
        }
        colorSprite.destroy();
        colorRenderTexture.destroy(true);
      }

      if (this.isDynamicScreenMask) {
        for (let y = 0; y < texture.height; y += step) {
          for (let x = 0; x < texture.width; x += step) {
            const index = (y * texture.width + x) * 4;
            const pixelValue = pixelData[index];
            let shouldSpawn = false;
            if (this.spawnMode === "range") {
              if (
                pixelValue >= this.threshold &&
                pixelValue <= this.upperThreshold
              ) {
                shouldSpawn = true;
              }
            } else {
              if (pixelValue >= this.threshold) {
                shouldSpawn = true;
              }
            }
            if (shouldSpawn) {
              const cameraOffset = CoordinateManager.getCameraOffset();
              const canvasScale = CoordinateManager.getCanvasScale();
              const worldPoint = new PIXI.Point(
                cameraOffset.x + x / canvasScale,
                cameraOffset.y + y / canvasScale
              );

              // Use colorPixelData for color if available, otherwise use mask texture
              let color;
              if (colorPixelData && this.colorTexture) {
                // Map coordinates from mask texture to color texture
                const colorX = Math.floor(
                  (x / texture.width) * this.colorTexture.width
                );
                const colorY = Math.floor(
                  (y / texture.height) * this.colorTexture.height
                );
                const colorIndex =
                  (colorY * this.colorTexture.width + colorX) * 4;
                color = [
                  colorPixelData[colorIndex],
                  colorPixelData[colorIndex + 1],
                  colorPixelData[colorIndex + 2],
                ];
              } else {
                color = [
                  pixelData[index],
                  pixelData[index + 1],
                  pixelData[index + 2],
                ];
              }

              this.validPoints.push({
                point: worldPoint,
                color: color,
              });
            }
          }
        }
      } else {
        for (let y = 0; y < texture.height; y += step) {
          for (let x = 0; x < texture.width; x += step) {
            const index = (y * texture.width + x) * 4;
            const pixelValue = pixelData[index];
            let shouldSpawn = false;
            if (this.spawnMode === "range") {
              if (
                pixelValue >= this.threshold &&
                pixelValue <= this.upperThreshold
              ) {
                shouldSpawn = true;
              }
            } else {
              if (pixelValue >= this.threshold) {
                shouldSpawn = true;
              }
            }
            if (shouldSpawn) {
              const relativeX = (x / texture.width) * this.width;
              const relativeY = (y / texture.height) * this.height;
              const worldX = this.offsetX + relativeX;
              const worldY = this.offsetY + relativeY;

              // Use colorPixelData for color if available, otherwise use mask texture
              let color;
              if (colorPixelData && this.colorTexture) {
                // Map coordinates from mask texture to color texture
                const colorX = Math.floor(
                  (x / texture.width) * this.colorTexture.width
                );
                const colorY = Math.floor(
                  (y / texture.height) * this.colorTexture.height
                );
                const colorIndex =
                  (colorY * this.colorTexture.width + colorX) * 4;
                color = [
                  colorPixelData[colorIndex],
                  colorPixelData[colorIndex + 1],
                  colorPixelData[colorIndex + 2],
                ];
              } else {
                color = [
                  pixelData[index],
                  pixelData[index + 1],
                  pixelData[index + 2],
                ];
              }

              this.validPoints.push({
                point: new PIXI.Point(worldX, worldY),
                color: color,
              });
            }
          }
        }
      }
      this.isCompiled = true;
      this.isCompiling = false;
      resolve();
    } catch (e) {
      console.error("TextureMaskShape | Error during point compilation:", e);
      this.isCompiled = true;
      this.isCompiling = false;
      reject(e);
    }
  }

  getRandPos(particle) {
    if (!this.isCompiled || this.validPoints.length === 0) {
      return;
    }
    const data =
      this.validPoints[Math.floor(Math.random() * this.validPoints.length)];
    particle.position.copyFrom(data.point);
    particle.spawnColor = data.color;
  }
}

// Make the shape available to adapters during early init
globalThis.TextureMaskShape = globalThis.TextureMaskShape || TextureMaskShape;

/**
 * A particle spawn shape that uses raw geometry data (points, lines, areas)
 * to determine spawn locations mathematically, avoiding any dependency on rendering.
 */
class GeometryMaskShape {
  static type = "geometryMask";

  constructor(config) {
    this.group = config.group; // Expects a full map point group object
    this._points = this.group.points || [];
    this._type = this.group.type || "point";
    this.emissionSettings = this.group.emission || {};

    // Pre-calculate bounding box and centroid for area sampling
    if (this._type === "area" && this._points.length > 2) {
      let minX = this._points[0].x,
        maxX = this._points[0].x;
      let minY = this._points[0].y,
        maxY = this._points[0].y;
      let signedArea = 0;
      let cx = 0,
        cy = 0;

      for (let i = 0; i < this._points.length; i++) {
        const p1 = this._points[i];
        const p2 = this._points[(i + 1) % this._points.length];
        minX = Math.min(minX, p1.x);
        maxX = Math.max(maxX, p1.x);
        minY = Math.min(minY, p1.y);
        maxY = Math.max(maxY, p1.y);

        const a = p1.x * p2.y - p2.x * p1.y;
        signedArea += a;
        cx += (p1.x + p2.x) * a;
        cy += (p1.y + p2.y) * a;
      }

      this._bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };

      if (signedArea !== 0) {
        signedArea *= 0.5;
        this._centroid = {
          x: cx / (6 * signedArea),
          y: cy / (6 * signedArea),
        };
      } else {
        // Fallback for non-closed or zero-area polygons
        this._centroid = {
          x: this._bounds.x + this._bounds.width / 2,
          y: this._bounds.y + this._bounds.height / 2,
        };
      }
    }
  }

  /**
   * Checks if a point is inside a polygon using the ray-casting algorithm.
   * @param {PIXI.Point} point The point to check.
   * @returns {boolean} True if the point is inside, false otherwise.
   */

  _isPointInPolygon(point) {
    let isInside = false;
    const points = this.group.points;
    const n = points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xj = points[j].x,
        yj = points[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }

  /**
   * Called by the particle emitter to get a random position for a new particle.
   * @param {PIXI.particles.Particle} particle - The particle to position.
   */
  getRandPos(particle) {
    if (!this._points || this._points.length === 0) return;

    let p = new PIXI.Point(0, 0);

    const useFalloff =
      this.emissionSettings.enabled && this.emissionSettings.falloff?.enabled;
    // Map strength [0, 0.99] to an exponent for pow(). Lower strength -> higher exponent -> more bias.
    const strength = this.emissionSettings.falloff?.strength ?? 0.5;
    const exponent = 1.0 / (1.0 - strength);

    switch (this._type) {
      case "point": {
        p = this._points[Math.floor(Math.random() * this._points.length)];
        break;
      }
      case "line": {
        if (this._points.length < 2) {
          p = this._points[0];
          break;
        }
        const segmentIndex = Math.floor(
          Math.random() * (this._points.length - 1)
        );
        const p1 = this._points[segmentIndex];
        const p2 = this._points[segmentIndex + 1];

        let t = Math.random();
        if (useFalloff) {
          const r = Math.random() - 0.5; // -0.5 to 0.5
          const bias = Math.pow(Math.abs(r * 2), exponent); // 0 to 1, biased to 0
          const final_r = r > 0 ? bias / 2 : -bias / 2;
          t = 0.5 + final_r; // t will be biased towards 0.5
        }
        p.x = p1.x + t * (p2.x - p1.x);
        p.y = p1.y + t * (p2.y - p1.y);
        break;
      }
      case "area": {
        if (this._points.length < 3 || !this._bounds) return;

        let attempts = 0;
        const MAX_ATTEMPTS = 100;

        if (useFalloff && this._centroid) {
          // Biased rejection sampling
          const maxDistSq =
            Math.pow(this._bounds.width, 2) + Math.pow(this._bounds.height, 2);
          do {
            p.x = this._bounds.x + Math.random() * this._bounds.width;
            p.y = this._bounds.y + Math.random() * this._bounds.height;
            attempts++;
            if (!this._isPointInPolygon(p)) continue;

            const distSqToCentroid =
              Math.pow(p.x - this._centroid.x, 2) +
              Math.pow(p.y - this._centroid.y, 2);
            const normalizedDist = Math.sqrt(distSqToCentroid / maxDistSq);
            const keepProbability = Math.pow(1 - normalizedDist, exponent);

            if (Math.random() < keepProbability) break;
          } while (attempts < MAX_ATTEMPTS);

          if (attempts >= MAX_ATTEMPTS) p.copyFrom(this._centroid);
        } else {
          // Standard uniform rejection sampling
          do {
            p.x = this._bounds.x + Math.random() * this._bounds.width;
            p.y = this._bounds.y + Math.random() * this._bounds.height;
            attempts++;
          } while (!this._isPointInPolygon(p) && attempts < MAX_ATTEMPTS);

          if (attempts >= MAX_ATTEMPTS)
            p.copyFrom(
              this._points[Math.floor(Math.random() * this._points.length)]
            );
        }
        break;
      }
    }
    particle.position.copyFrom(p);
  }
}

/**
 * WeatherParticleLayer - Dedicated layer for weather-related particle effects
 * 
 * Manages particle-based weather effects (rain droplets, snowflakes, edge droplets)
 * separate from the main ParticleLayer to allow independent z-index control.
 * This enables weather particles to render below overhead tiles while other particles
 * (dust, fire, biofilm, etc.) render at different depths.
 * 
 * @extends AnimatedCanvasLayer
 */
export class WeatherParticleLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this._initialized = false;
  }

  async _draw() {
    await super._draw(); // Handles ticker binding and _destroyed flag
    this._initialized = false;
    this.eventMode = "none";
    
    console.log('MapShine | WeatherParticleLayer: Layer initialized and ready for weather particles');
  }

  async _tearDown(options) {
    if (this._destroyed) return;
    
    console.log('MapShine | WeatherParticleLayer: Tearing down');
    
    await super._tearDown(options); // Handles ticker unbinding and _destroyed flag
  }

  _onAnimate(deltaTime) {
    if (this._destroyed) return;
    
    // CRITICAL: Skip all updates during scene transitions
    if (game.mapShine.transitionActive) return;

    // Check master enabled flag
    const config = game.mapShine?.profileManager?.activeConfig;
    if (config && config.enabled === false) return;

    // Mark as initialized once systems are ready
    if (!this._initialized && game.mapShine.systemsReady) {
      this._initialized = true;
    }
  }
}



class SparkPathBehavior {
  static type = "sparkPath";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late;
    this.config = config;

    this._speed = new PIXI.particles.PropertyList(false);

    // Initialize the speed PropertyList using the robust method from the old version.
    // This correctly parses the { list: [...] } structure from the config.
    if (this.config.speed) {
      this._speed.reset(
        PIXI.particles.PropertyNode.createList(this.config.speed)
      );
    } else {
      console.warn(
        "MapShine | SparkPathBehavior received no speed config, using fallback."
      );
      this._speed.reset(
        PIXI.particles.PropertyNode.createList({
          list: [
            {
              value: 50,
              time: 0,
            },
            {
              value: 50,
              time: 1,
            },
          ],
        })
      );
    }
  }

  initParticles(first) {
    let next = first;
    while (next) {
      const config = this.config;
      const pConfig = next.config || (next.config = {});

      pConfig.initRotation =
        next.rotation +
        this._getRandom(config.angle.min, config.angle.max) * (Math.PI / 180);
      pConfig.initPosition = new PIXI.Point(next.x, next.y);
      // Store the initial position to calculate the first frame's direction.
      next.oldPosition = new PIXI.Point(next.x, next.y);
      pConfig.movement = 0;

      pConfig.pathAmplitude = this._getRandom(
        config.amplitude.min,
        config.amplitude.max
      );
      pConfig.pathFrequency = this._getRandom(
        config.frequency.min,
        config.frequency.max
      );
      pConfig.pathOffset = this._getRandom(
        config.offset.min,
        config.offset.max
      );
      pConfig.pathDamping = config.damping ?? 0.5;

      // Add swirl parameters. These are derived from the main path parameters to create
      // a secondary, faster, smaller circular motion that generates loops.
      pConfig.swirlRadius = pConfig.pathAmplitude * this._getRandom(0.4, 0.8);
      pConfig.swirlFrequency =
        pConfig.pathFrequency * this._getRandom(0.3, 0.6);
      pConfig.swirlOffset = this._getRandom(0, Math.PI * 2);

      // Pre-calculate the initial state of the swirl to ensure the path starts at a zero offset.
      pConfig.swirlInitialSin = Math.sin(pConfig.swirlOffset);
      pConfig.swirlInitialCos = Math.cos(pConfig.swirlOffset);

      // Use the separate speed multiplier property.
      pConfig.speedMult = this._getRandom(config.speedMinMult, 1);

      next = next.next;
    }
  }

  updateParticle(particle, deltaSec) {
    // More robust check to ensure the particle and its configuration are valid before proceeding.
    // This prevents errors if a particle is in an inconsistent state during recycling.
    if (!particle.config || !particle.config.initPosition) {
      return;
    }

    const pConfig = particle.config;

    const speed =
      this._speed.interpolate(particle.agePercent) * pConfig.speedMult;
    pConfig.movement += speed * deltaSec;

    // Damping affects both the main wave and the swirl, making the path straighten out over time.
    const dampingFactor = 1.0 - pConfig.pathDamping * particle.agePercent;
    const amplitude = pConfig.pathAmplitude * dampingFactor;
    const swirlRadius = pConfig.swirlRadius * dampingFactor;

    const forward_dist = pConfig.movement;

    // Primary sideways oscillation (the original sine wave)
    const main_t = forward_dist / pConfig.pathFrequency + pConfig.pathOffset;
    const main_y =
      amplitude * (Math.sin(main_t) - Math.sin(pConfig.pathOffset));

    // Secondary circular "swirl" motion to create loops and turbulence
    const swirl_t = forward_dist / pConfig.swirlFrequency + pConfig.swirlOffset;
    // Subtract the initial sin/cos values to make the swirl relative to the start point.
    const swirl_x = swirlRadius * (Math.sin(swirl_t) - pConfig.swirlInitialSin);
    const swirl_y = swirlRadius * (Math.cos(swirl_t) - pConfig.swirlInitialCos);

    // Combine the motions: forward motion is now perturbed by the swirl's x-component.
    // The final y is a combination of the main wave and the swirl's y-component.
    const x = forward_dist + swirl_x;
    const y = main_y + swirl_y;

    const helperPoint = new PIXI.Point(x, y);

    if (pConfig.initRotation !== 0) {
      const s = Math.sin(pConfig.initRotation);
      const c = Math.cos(pConfig.initRotation);
      const xnew = helperPoint.x * c - helperPoint.y * s;
      const ynew = helperPoint.x * s + helperPoint.y * c;
      helperPoint.x = xnew;
      helperPoint.y = ynew;
    }

    particle.position.x = pConfig.initPosition.x + helperPoint.x;
    particle.position.y = pConfig.initPosition.y + helperPoint.y;

    // Calculate direction and apply rotation
    const dx = particle.position.x - particle.oldPosition.x;
    const dy = particle.position.y - particle.oldPosition.y;

    // Only update rotation if the particle has moved a meaningful amount
    // to prevent jerky rotation at low speeds.
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      particle.rotation = Math.atan2(dy, dx);
    }

    const mbConfig = this.config.motionBlur;
    if (mbConfig && mbConfig.enabled) {
      // The actual distance moved in this frame.
      const frameSpeed = Math.sqrt(dx * dx + dy * dy);
      let elongation = frameSpeed * mbConfig.strength;

      elongation = Math.min(elongation, mbConfig.maxLength);

      // The 'scale' behavior runs before this one and sets both scale.x and scale.y.
      // We'll use scale.y as the base width and elongate scale.x.
      const baseScale = particle.scale.y;
      particle.scale.x = baseScale + elongation;
    }

    // Update oldPosition for the next frame
    particle.oldPosition.copyFrom(particle.position);
  }

  _getRandom(min, max) {
    if (min === max) return min;
    return Math.random() * (max - min) + min;
  }
}

class CandleFlameBehavior {
  static type = "candleFlame";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
    this.config = config;
    this.time = 0; // Shared time for all particles using this behavior instance
  }

  initParticles(first) {
    let p = first;
    while (p) {
      p.config = p.config || {};
      // Give each particle a random offset so they don't all jiggle in perfect sync
      p.config.jiggleOffset = Math.random() * Math.PI * 2;
      p = p.next;
    }
  }

  // A custom update method called by the emitter controller to update shared time
  update(emitter, delta) {
    this.time += delta;
  }

  updateParticle(particle, deltaSec) {
    if (!particle.config) return;

    const cfg = this.config;
    const pcfg = particle.config;

    // 1. Upward motion
    particle.position.y += cfg.upwardVelocity * deltaSec;

    // 2. Jiggle motion
    // The amplitude of the jiggle increases as the particle gets older (moves up)
    const currentAmplitude =
      cfg.amplitude * Math.pow(particle.agePercent, cfg.risingFactor);
    const jiggle =
      Math.sin(this.time * cfg.frequency + pcfg.jiggleOffset) *
      currentAmplitude;

    particle.position.x += jiggle * deltaSec;
  }

  destroy() {
    // No special cleanup needed
  }
}

class MapShineLightingBehavior {
  static type = "mapShineLighting";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late + 1; // Run after color and alpha
    this.config = config;
    this._emissive = null;
    this._isStatic = false;
    this._emissiveColor = null;
    this._colorIsStatic = false;

    // Brightness list (for alpha/lighting calculations)
    if (
      config.emissive &&
      config.emissive.list &&
      config.emissive.list.length > 0
    ) {
      if (config.emissive.list.length === 1) {
        this._isStatic = true;
        this._emissive = config.emissive.list[0].value;
      } else if (config.emissive.list.length > 1) {
        try {
          this._emissive = new PIXI.particles.PropertyList(false);
          this._emissive.reset(
            PIXI.particles.PropertyNode.createList(config.emissive)
          );
        } catch (e) {
          console.warn(
            "MapShine | Failed to create emissive PropertyList:",
            e,
            config.emissive
          );
          // Fallback to static value using first entry
          this._isStatic = true;
          this._emissive = config.emissive.list[0].value;
        }
      }
    }

    // Color list (for tint animation)
    // Store as raw array for manual interpolation since PropertyList doesn't handle colors well
    if (config.emissiveColor && config.emissiveColor.list) {
      if (config.emissiveColor.list.length === 1) {
        this._colorIsStatic = true;
        this._emissiveColor = config.emissiveColor.list[0].value;
      } else if (config.emissiveColor.list.length > 1) {
        // Store the sorted list for manual interpolation
        this._emissiveColor = [...config.emissiveColor.list].sort(
          (a, b) => a.time - b.time
        );
      }
    }
  }

  initParticles() {
    // No per-particle init needed
  }

  /**
   * Manually interpolates a color value from a sorted list based on age percent.
   * @param {Array} colorList - Sorted array of {time, value} objects where value is a color integer
   * @param {number} agePercent - Age of the particle (0.0 to 1.0)
   * @returns {number} Interpolated color as integer (0xRRGGBB)
   * @private
   */
  _interpolateColor(colorList, agePercent) {
    // Find the two stops to interpolate between
    let i = 0;
    while (i < colorList.length - 1 && colorList[i + 1].time < agePercent) {
      i++;
    }

    // If we're at or past the last stop, return the last color
    if (i >= colorList.length - 1) {
      return colorList[colorList.length - 1].value;
    }

    const startStop = colorList[i];
    const endStop = colorList[i + 1];

    // Calculate interpolation factor between the two stops
    const t = (agePercent - startStop.time) / (endStop.time - startStop.time);

    // Extract RGB components from both colors
    const startR = (startStop.value >> 16) & 0xff;
    const startG = (startStop.value >> 8) & 0xff;
    const startB = startStop.value & 0xff;

    const endR = (endStop.value >> 16) & 0xff;
    const endG = (endStop.value >> 8) & 0xff;
    const endB = endStop.value & 0xff;

    // Interpolate each component
    const r = Math.round(startR + (endR - startR) * t);
    const g = Math.round(startG + (endG - startG) * t);
    const b = Math.round(startB + (endB - startB) * t);

    // Combine back into integer
    return (r << 16) | (g << 8) | b;
  }

  updateParticle(particle) {
    // This behavior runs *after* the standard Alpha behavior, so particle.alpha
    // has already been set for this frame according to its lifetime gradient.
    if (particle.alpha === undefined || this._emissive === null) return;

    // Get the particle's "emissive strength" for the current frame (0.0 to 1.0).
    let emissiveValue;
    try {
      emissiveValue = this._isStatic
        ? this._emissive
        : this._emissive.interpolate(particle.agePercent);
    } catch (e) {
      // If interpolation fails, bail out
      console.warn("MapShine | Emissive interpolation failed:", e);
      return;
    }

    // Get the emissive color for the current frame (if color animation is enabled)
    let emissiveColor = null;
    if (this._emissiveColor !== null) {
      if (this._colorIsStatic) {
        emissiveColor = this._emissiveColor;
      } else {
        // Manual interpolation for color values
        emissiveColor = this._interpolateColor(
          this._emissiveColor,
          particle.agePercent
        );
      }
    }

    // Get scene darkness level (0.0 is bright, 1.0 is pitch black).
    const darkness = canvas.scene?.environment.darknessLevel ?? 0;
    const lightLevel = 1.0 - darkness;

    // Store the alpha that the particle *would* have based on its lifetime fade.
    const baseAlpha = particle.alpha;

    // Step 1: Calculate the particle's alpha after being affected by scene darkness.
    const darkenedAlpha = baseAlpha * lightLevel;

    // Step 2: Calculate the emissive boost. The boost is the particle's emissive
    // strength, also scaled by its base lifetime alpha. This ensures a particle
    // that is fading out also has its glow fade out.
    const emissiveBoost = baseAlpha * emissiveValue;

    // Step 3: The final alpha is the darkened alpha plus the emissive boost.
    // For non-emissive particles (emissiveValue=0), this is just the darkenedAlpha.
    // For emissive particles, this adds their glow back on top of the darkened base.
    particle.alpha = darkenedAlpha + emissiveBoost;

    // Step 4: Apply emissive color and brightness to the particle tint.
    if (emissiveValue > 0) {
      // If we have an emissive color animation, use it directly as the base tint
      // Otherwise, use the particle's current tint
      let baseTint =
        emissiveColor !== null ? emissiveColor : particle.tint ?? 0xffffff;

      // Scale up the brightness - emissiveValue of 1.0 makes it much brighter
      const brightnessMultiplier = 1.0 + emissiveValue * 3.0; // Up to 4x brighter at full emissive

      // Extract RGB from the base tint (stored as a single integer)
      const r = ((baseTint >> 16) & 0xff) / 255;
      const g = ((baseTint >> 8) & 0xff) / 255;
      const b = (baseTint & 0xff) / 255;

      // Brighten the color, clamping to white (1.0)
      const brightR = Math.min(1.0, r * brightnessMultiplier);
      const brightG = Math.min(1.0, g * brightnessMultiplier);
      const brightB = Math.min(1.0, b * brightnessMultiplier);

      // Convert back to integer tint
      particle.tint =
        ((brightR * 255) << 16) | ((brightG * 255) << 8) | (brightB * 255);
    } else if (emissiveColor !== null) {
      // Even with no brightness, apply the emissive color if it exists
      particle.tint = emissiveColor;
    }
  }

  destroy() {
    // No special cleanup needed
  }
}

class WindBehavior {
  static type = "wind";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
    this.config = config;
    this.turbulence = config.turbulence || 0; // Turbulence intensity (0-1)
  }

  /**
   * Initializes particles for this behavior.
   * This is required by the emitter library.
   * @param {PIXI.particles.Particle} first The first particle in the batch.
   */
  initParticles(first) {
    let p = first;
    while (p) {
      // Each particle gets its own velocity vector, initialized to zero.
      p.velocity = new PIXI.Point(0, 0);
      // Random turbulence phase for each particle
      p.turbulencePhase = Math.random() * Math.PI * 2;
      p = p.next;
    }
  }

  /**
   * Updates a single particle by applying wind forces and turbulence.
   * @param {PIXI.particles.Particle} particle The particle to update.
   * @param {number} deltaSec The time elapsed in seconds.
   */
  updateParticle(particle, deltaSec) {
    const windManager = game.mapShine?.windManager;
    // Do nothing if the particle is invalid or the necessary systems aren't ready.

    if (!particle.velocity || !windManager || !this.config.enabled) return;

    // STOP ALL WIND EFFECTS when particle hits ground (90%+)
    if (particle.agePercent >= 0.90) {
      return; // No wind or turbulence after ground impact
    }

    // Calculate wind acceleration multiplier (0 to 1 based on particle age)
    let windMultiplier = 1.0;
    if (this.config.accelerationTime && this.config.accelerationTime > 0) {
      // Gradually ramp up from 0 to 1 over accelerationTime seconds
      const ageInSeconds = particle.age;
      windMultiplier = Math.min(1.0, ageInSeconds / this.config.accelerationTime);
    }

    // 1. Get the current wind force from the manager.
    const windAngleRad = windManager.angle * (Math.PI / 180.0);
    const windForce = windManager.speed * this.config.force * windMultiplier;
    const windAccelX = Math.cos(windAngleRad) * windForce;
    const windAccelY = -Math.sin(windAngleRad) * windForce;  // Negate for screen Y-axis

    // 2. Add turbulence - random chaotic motion scaled by wind speed
    //    Only apply turbulence between 50-85% of particle lifetime
    let turbulenceX = 0;
    let turbulenceY = 0;
    if (this.turbulence > 0) {
      // Calculate turbulence multiplier based on particle age (0-1)
      let turbulenceMultiplier = 0;
      const agePercent = particle.agePercent; // 0.0 at birth, 1.0 at death
      
      if (agePercent < 0.50) {
        // 0-50%: No turbulence
        turbulenceMultiplier = 0;
      } else if (agePercent < 0.55) {
        // 50-55%: Smoothly ramp up turbulence
        turbulenceMultiplier = (agePercent - 0.50) / 0.05;
      } else if (agePercent < 0.80) {
        // 55-80%: Full turbulence
        turbulenceMultiplier = 1.0;
      } else if (agePercent < 0.85) {
        // 80-85%: Smoothly ramp down turbulence
        turbulenceMultiplier = 1.0 - ((agePercent - 0.80) / 0.05);
      } else {
        // 85-90%: No turbulence (preparing for ground)
        turbulenceMultiplier = 0;
      }
      
      // Turbulence intensity scales with wind speed (more wind = more chaos)
      const turbulenceIntensity = this.turbulence * windManager.speed * 0.5 * turbulenceMultiplier;
      
      // Use time-based noise for smooth chaotic motion
      particle.turbulencePhase += deltaSec * 3; // Advance phase
      turbulenceX = Math.sin(particle.turbulencePhase) * turbulenceIntensity;
      turbulenceY = Math.cos(particle.turbulencePhase * 1.3) * turbulenceIntensity;
    }

    // 3. Calculate the total acceleration for this frame (wind + turbulence).
    const totalAccelX = windAccelX + turbulenceX;
    const totalAccelY = windAccelY + turbulenceY;

    // 4. Update the particle's velocity based on the total acceleration.
    particle.velocity.x += totalAccelX * deltaSec;
    particle.velocity.y += totalAccelY * deltaSec;

    // 5. Update the particle's screen position based on its new velocity.
    particle.position.x += particle.velocity.x * deltaSec;
    particle.position.y += particle.velocity.y * deltaSec;
  }
}

/**
 * ZDepthBehavior - Simulates a Z-axis (height/depth) for particles in top-down view
 * Particles fall through virtual 3D space while staying in roughly the same X/Y map position
 * Provides perspective scaling (far = small, near = large) and Z-velocity for streaks
 */
class ZDepthBehavior {
  static type = "zDepth";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal; // Run during normal update
    this.startHeight = config.startHeight || 1000; // Starting Z-height in pixels
    this.endHeight = config.endHeight || 0; // Ground level (Z=0)
    
    // Validate fallSpeed - ensure min/max are numbers, not undefined
    const fallSpeedConfig = config.fallSpeed || {};
    this.fallSpeedMin = fallSpeedConfig.min ?? 400; // Default: 400 px/s
    this.fallSpeedMax = fallSpeedConfig.max ?? 600; // Default: 600 px/s
    
    this.scaleAtTop = config.scaleAtTop || 3.0; // Scale when at max height (far from camera)
    this.scaleAtBottom = config.scaleAtBottom || 0.1; // Scale when at ground (near camera)
  }

  /**
   * Initialize particles with Z-height and Z-velocity
   */
  initParticles(first) {
    let particle = first;
    while (particle) {
      // Initialize Z-coordinate (height above ground)
      if (!particle.zDepth) {
        particle.zDepth = {};
      }
      
      // Start at maximum height
      particle.zDepth.z = this.startHeight;
      particle.zDepth.startHeight = this.startHeight; // Store for VelocityStreakBehavior
      
      // Random fall speed within range
      const speed = this.fallSpeedMin + Math.random() * (this.fallSpeedMax - this.fallSpeedMin);
      particle.zDepth.zVelocity = -speed; // Negative = falling downward
      
      particle = particle.next;
    }
  }

  /**
   * Update particle Z-position and apply perspective scaling
   */
  updateParticle(particle, deltaSec) {
    if (!particle.zDepth) {
      // Initialize if missing (shouldn't happen)
      particle.zDepth = {
        z: this.startHeight,
        zVelocity: -(this.fallSpeedMin + Math.random() * (this.fallSpeedMax - this.fallSpeedMin))
      };
    }

    // Update Z-position (falling through virtual space)
    particle.zDepth.z += particle.zDepth.zVelocity * deltaSec;
    
    // Clamp to ground level (don't go below 0)
    if (particle.zDepth.z < this.endHeight) {
      particle.zDepth.z = this.endHeight;
      particle.zDepth.zVelocity = 0;
    }
    
    // Calculate perspective scale based on Z-height
    // Higher Z = farther from camera = smaller scale
    // Lower Z = closer to camera = larger scale
    const heightPercent = particle.zDepth.z / this.startHeight; // 1.0 at top, 0.0 at bottom
    const perspectiveScale = this.scaleAtTop + (this.scaleAtBottom - this.scaleAtTop) * (1.0 - heightPercent);
    
    // Apply perspective scale (this is the base scale, VelocityStreakBehavior will modify Y-scale)
    particle.scale.x = perspectiveScale;
    particle.scale.y = perspectiveScale;
  }
}

/**
 * VelocityStreakBehavior - Dynamically adjusts rain particle rotation and scale based on velocity
 * Creates realistic motion blur streaks that lengthen with speed
 * NOW USES Z-VELOCITY from ZDepthBehavior for streak length
 */
class VelocityStreakBehavior {
  static type = "velocityStreak";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late; // Run after movement
    this.baseStreakLength = config.baseStreakLength || 1.0; // Multiplier for streak length
    this.minStretch = config.minStretch || 1.0; // Minimum Y-scale
    this.maxStretch = config.maxStretch || 3.0; // Maximum Y-scale
    this.velocityThreshold = config.velocityThreshold || 50; // Speed needed for max stretch
    this.fadeInTime = config.fadeInTime || 0.1; // Fade in streak during first 10% of life
    this.fadeOutTime = config.fadeOutTime || 0.9; // Fade out streak during last 10% of life
  }

  /**
   * Initialize particles with streak properties
   */
  initParticles(first) {
    // Nothing to initialize
  }

  /**
   * Update particle rotation and scale based on Z-velocity (falling speed)
   */
  updateParticle(particle, deltaSec) {
    // Use Z-velocity for streak length (falling speed through virtual 3D space)
    const zVelocity = particle.zDepth?.zVelocity || 0;
    const speed = Math.abs(zVelocity); // Falling speed magnitude
    
    if (speed > 1) {
      // TOP-DOWN VIEW: Rain falls straight down through Z-axis
      // Streaks should always be VERTICAL (pointing down the screen) regardless of wind
      // Wind only creates horizontal drift, but doesn't tilt the rain
      // rotation = 0 keeps the texture vertical (our 1x8px texture is already vertical)
      particle.rotation = 0;

      // Stretch Y-scale based on Z-speed (falling speed)
      // Faster falling = longer streaks
      const stretchFactor = Math.min(speed / this.velocityThreshold, 1.0);
      const yStretch = this.minStretch + (this.maxStretch - this.minStretch) * stretchFactor;
      
      // Fade streak length based on Z-height (fade in when spawning high, fade out when reaching ground)
      const zHeight = particle.zDepth?.z || 0;
      const zMax = particle.zDepth?.startHeight || 1000;
      const heightPercent = zHeight / zMax; // 1.0 at top, 0.0 at bottom
      
      let heightFade = 1.0;
      
      if (heightPercent > this.fadeOutTime) {
        // Fade in at top: 1.0→0.9 height = 0→1 fade
        heightFade = (1.0 - heightPercent) / (1.0 - this.fadeOutTime);
      } else if (heightPercent < this.fadeInTime) {
        // Fade out at bottom: 0.1→0.0 height = 0→1 fade
        heightFade = heightPercent / this.fadeInTime;
      }
      
      // Apply the stretch with height fade
      particle.scale.y = particle.scale.x * yStretch * this.baseStreakLength * heightFade;
    } else {
      // At low/zero speed, keep scale minimal
      particle.scale.y = particle.scale.x;
    }
  }
}

/**
 * GroundCollisionBehavior - Stops particle movement when reaching ground
 * Simulates water droplets hitting the ground and spreading before stopping
 */
class GroundCollisionBehavior {
  static type = "groundCollision";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late; // Run after wind
    this.groundAge = config.groundAge || 0.90; // Age at which particle hits ground
    this.stopAge = config.stopAge || 0.95; // Age at which movement fully stops (after splash)
  }

  initParticles(first) {
    // No initialization needed
  }

  updateParticle(particle, deltaSec) {
    // Stop ALL movement immediately when hitting ground
    if (particle.agePercent >= this.groundAge) {
      if (particle.velocity) {
        particle.velocity.x = 0;
        particle.velocity.y = 0;
      }
    }
  }
}

/**
 * DropletStreakBehavior - Creates motion blur streaks for droplet particles
 * Cheap fake motion blur: tracks velocity and elongates particles in direction of travel
 */
class DropletStreakBehavior {
  static type = "dropletStreak";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late; // Run after movement
    this.strength = config.strength ?? 2.0; // How much speed affects length (higher = more sensitive)
    this.maxLength = config.maxLength ?? 8.0; // Maximum elongation multiplier
  }

  initParticles(first) {
    let particle = first;
    while (particle) {
      // Track previous position for velocity calculation
      particle.oldPosition = new PIXI.Point(particle.x, particle.y);
      particle = particle.next;
    }
  }

  updateParticle(particle, deltaSec) {
    if (!particle.oldPosition) {
      particle.oldPosition = new PIXI.Point(particle.x, particle.y);
      return;
    }

    // Store the base scale set by ScaleBehavior (before we modify it)
    if (!particle.baseScale) {
      particle.baseScale = particle.scale.y;
    } else {
      // Update base scale from ScaleBehavior each frame
      particle.baseScale = particle.scale.y;
    }

    // Calculate frame velocity
    const dx = particle.position.x - particle.oldPosition.x;
    const dy = particle.position.y - particle.oldPosition.y;
    
    // Only apply motion blur if particle is moving AND not on ground (ULTRA LOW THRESHOLD)
    if ((Math.abs(dx) > 0.00001 || Math.abs(dy) > 0.00001) && particle.agePercent < 0.90) {
      // Set rotation to face direction of movement
      particle.rotation = Math.atan2(dy, dx);
      
      // Calculate speed and elongation
      const frameSpeed = Math.sqrt(dx * dx + dy * dy);
      let elongation = frameSpeed * this.strength;
      elongation = Math.min(elongation, this.maxLength);
      
      // Apply elongation RELATIVE to base scale (don't overwrite it)
      particle.scale.x = particle.baseScale + elongation;
      particle.scale.y = particle.baseScale;
    } else {
      // On ground or not moving: restore uniform scale (for splash spread)
      particle.scale.x = particle.baseScale;
      particle.scale.y = particle.baseScale;
      particle.rotation = 0; // Reset rotation for circular splash
    }
    
    // Update position tracking
    particle.oldPosition.copyFrom(particle.position);
  }
}

/**
 * EdgePointsSpawnBehavior - Spawns particles from a list of edge points
 * Used for weather effects that spawn from building edges based on wind direction
 */
class EdgePointsSpawnBehavior {
  static type = "edgePoints";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Spawn;
    this.edgePoints = config.edgePoints || []; // Array of {x, y} world coordinates
    this.spreadRadius = config.spreadRadius || 10; // Random offset from edge point
  }

  /**
   * Set the edge points to spawn from (called externally by controller)
   */
  setEdgePoints(points) {
    this.edgePoints = points || [];
  }

  initParticles(first) {
    let particle = first;
    while (particle) {
      if (this.edgePoints.length > 0) {
        // Pick a random edge point
        const edgePoint = this.edgePoints[Math.floor(Math.random() * this.edgePoints.length)];
        
        // Add small random offset for variation
        const offsetX = (Math.random() - 0.5) * this.spreadRadius * 2;
        const offsetY = (Math.random() - 0.5) * this.spreadRadius * 2;
        
        // Set particle position (relative to emitter position)
        particle.position.x = edgePoint.x + offsetX;
        particle.position.y = edgePoint.y + offsetY;
      } else {
        // No edge points available - spawn at emitter position
        particle.position.x = 0;
        particle.position.y = 0;
      }
      
      particle = particle.next;
    }
  }
}

class PressurisedSteamBehavior {
  static type = "pressurisedSteam";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
    this.config = config;
  }

  /**
   * Initializes the state for a given emitter.
   * @param {PIXI.particles.Emitter} emitter The emitter to initialize.
   */
  initEmitter(emitter) {
    emitter._steamState = "on";

    emitter._steamTimer = this.config.onDuration ?? 10.0;
    emitter.emit = true;
  }

  /**
   * Updates the emitter's state machine (on/off cycle).
   * @param {PIXI.particles.Emitter} emitter The emitter to update.
   * @param {number} delta The time elapsed in seconds.
   */
  update(emitter, delta) {
    if (emitter._steamState === undefined) {
      this.initEmitter(emitter);
    }

    emitter._steamTimer -= delta;

    while (emitter._steamTimer <= 0) {
      if (emitter._steamState === "on") {
        emitter._steamState = "off";

        emitter._steamTimer += this.config.offDuration ?? 10.0;
        emitter.emit = false;
      } else {
        emitter._steamState = "on";

        emitter._steamTimer += this.config.onDuration ?? 10.0;
        emitter.emit = true;
      }
    }
  }

  /**
   * Initializes newly created particles with a unique, random velocity.
   * @param {PIXI.particles.Particle} first The first particle in the new batch.
   */
  initParticles(first) {
    let p = first;
    while (p) {
      if (!p.velocity) {
        p.velocity = new PIXI.Point();
      }
      const pConfig = p.config || (p.config = {});

      // Calculate a new random angle FOR EACH PARTICLE within the configured range.
      const angleDegrees =
        this.config.minAngle +
        Math.random() * (this.config.maxAngle - this.config.minAngle);
      const angleRadians = angleDegrees * (Math.PI / 180.0);

      const speedConfig = this.config.speed;
      const speedMult =
        speedConfig.minMult + Math.random() * (1 - speedConfig.minMult);
      const startSpeed = speedConfig.start * speedMult;

      // Set initial velocity based on the particle's unique random angle.

      p.velocity.x = Math.cos(angleRadians) * startSpeed;

      p.velocity.y = Math.sin(angleRadians) * startSpeed;

      pConfig.startSpeed = startSpeed;
      pConfig.endSpeed = speedConfig.end * speedMult;

      p = p.next;
    }
  }

  /**
   * Updates a single particle's position and velocity each frame.
   * @param {PIXI.particles.Particle} particle The particle to update.
   * @param {number} delta The time elapsed in seconds.
   */
  updateParticle(particle, delta) {
    if (!particle.velocity || !particle.config) return;

    const pConfig = particle.config;

    const currentSpeed =
      pConfig.startSpeed +
      (pConfig.endSpeed - pConfig.startSpeed) * particle.agePercent;

    const magnitude = Math.hypot(
      particle.velocity.x,

      particle.velocity.y
    );
    if (magnitude > 0) {
      particle.velocity.x = (particle.velocity.x / magnitude) * currentSpeed;

      particle.velocity.y = (particle.velocity.y / magnitude) * currentSpeed;
    }

    particle.position.x += particle.velocity.x * delta;

    particle.position.y += particle.velocity.y * delta;
  }

  destroy() {
    // No special cleanup needed
  }
}

/**
 * A custom particle behavior that sets a particle's tint based on color data
 * attached to it during the spawn process.
 * This allows particles to inherit color from their spawn location on a texture.
 */
class ColorFromSpawnBehavior {
  static type = "colorFromSpawn";

  constructor() {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Normal;
  }

  initParticles(first) {
    let next = first;
    while (next) {
      if (next.spawnColor) {
        const color = next.spawnColor; // [r, g, b] from 0-255
        // Convert the RGB array to a single hex number for the tint property.
        next.tint = (color[0] << 16) + (color[1] << 8) + color[2];
      }
      next = next.next;
    }
  }

  // Required method, even if empty.

  updateParticle() {
    // This is a one-shot behavior on initialization.
  }

  // Required method for cleanup.
  destroy() {
    // Nothing to destroy.
  }
}

class SmellyFliesBehavior {
  static type = "smellyFlies";

  constructor(config) {
    this.order = PIXI.particles.behaviors.BehaviorOrder.Late;
    this.config = config;
    this.group = config.group;

    if (this.group) {
      this.shape = new GeometryMaskShape({
        group: this.group,
      });
    } else {
      this.shape = null;
    }

    this.WALKING_SCALE = 0.17;
    this.FLYING_SCALE = 0.19;
  }

  _lerp(start, end, amount) {
    return (1 - amount) * start + amount * end;
  }

  // Simplex noise in 3D, adapted from a public domain implementation.
  _simplexNoise3D = (function () {
    const F3 = 1.0 / 3.0;
    const G3 = 1.0 / 6.0;
    const grad3 = [
      [1, 1, 0],
      [-1, 1, 0],
      [1, -1, 0],
      [-1, -1, 0],
      [1, 0, 1],
      [-1, 0, 1],
      [1, 0, -1],
      [-1, 0, -1],
      [0, 1, 1],
      [0, -1, 1],
      [0, 1, -1],
      [0, -1, -1],
    ];
    // A random permutation array. This is pre-calculated for speed.
    const p = [
      151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
      140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247,
      120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177,
      33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165,
      71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211,
      133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25,
      63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
      135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217,
      226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
      59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248,
      152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22,
      39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218,
      246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
      81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
      184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
      222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
    ];
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      perm[i] = p[i & 255];
    }

    function dot(g, x, y, z) {
      return g[0] * x + g[1] * y + g[2] * z;
    }

    return function (x, y, z) {
      let n0, n1, n2, n3;
      const s = (x + y + z) * F3;
      const i = Math.floor(x + s);
      const j = Math.floor(y + s);
      const k = Math.floor(z + s);
      const t = (i + j + k) * G3;
      const X0 = i - t;
      const Y0 = j - t;
      const Z0 = k - t;
      const x0 = x - X0;
      const y0 = y - Y0;
      const z0 = z - Z0;

      let i1, j1, k1;
      let i2, j2, k2;
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        }
      } else {
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        }
      }

      const x1 = x0 - i1 + G3;
      const y1 = y0 - j1 + G3;
      const z1 = z0 - k1 + G3;
      const x2 = x0 - i2 + 2.0 * G3;
      const y2 = y0 - j2 + 2.0 * G3;
      const z2 = z0 - k2 + 2.0 * G3;
      const x3 = x0 - 1.0 + 3.0 * G3;
      const y3 = y0 - 1.0 + 3.0 * G3;
      const z3 = z0 - 1.0 + 3.0 * G3;

      const ii = i & 255;
      const jj = j & 255;
      const kk = k & 255;

      const gi0 = perm[ii + perm[jj + perm[kk]]] % 12;
      const gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
      const gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
      const gi3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;

      let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) n0 = 0.0;
      else {
        t0 *= t0;
        n0 = t0 * t0 * dot(grad3[gi0], x0, y0, z0);
      }

      let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) n1 = 0.0;
      else {
        t1 *= t1;
        n1 = t1 * t1 * dot(grad3[gi1], x1, y1, z1);
      }

      let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) n2 = 0.0;
      else {
        t2 *= t2;
        n2 = t1 * t1 * dot(grad3[gi2], x2, y2, z2);
      }

      let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) n3 = 0.0;
      else {
        t3 *= t3;
        n3 = t3 * t3 * dot(grad3[gi3], x3, y3, z3);
      }

      return 32.0 * (n0 + n1 + n2 + n3);
    };
  })();

  /**
   * Initializes per-emitter state.
   * @param {PIXI.particles.Emitter} emitter The emitter instance.
   */
  initEmitter(emitter) {
    emitter._smellyFliesElapsedTime = 0;
  }

  /**
   * Updates the emitter's shared timer once per frame.
   * @param {PIXI.particles.Emitter} emitter The emitter instance.
   * @param {number} deltaSec Time elapsed in seconds.
   */
  update(emitter, deltaSec) {
    if (emitter._smellyFliesElapsedTime === undefined) {
      this.initEmitter(emitter);
    }

    emitter._smellyFliesElapsedTime += deltaSec;
  }

  /**
   * Sets up all parameters required for a fly to begin its take-off animation.
   * @param {PIXI.particles.Particle} fly The particle to prepare.
   * @param {object} cfg The particle's configuration object.
   */

  _prepareForTakeOff(fly, cfg) {
    const flyConfig = this.config.flying;
    cfg.state = "taking_off";
    cfg.stateTimer = flyConfig.takeoffDuration ?? 0.5;

    // Impart a sudden burst of speed in a random direction
    const takeoffSpeed =
      flyConfig.takeoffSpeedMin +
      Math.random() * (flyConfig.takeoffSpeedMax - flyConfig.takeoffSpeedMin);
    const angle = Math.random() * Math.PI * 2;

    // This is the target velocity we want to reach by the end of the takeoff animation
    cfg.targetVelocity = {
      x: Math.cos(angle) * takeoffSpeed,
      y: Math.sin(angle) * takeoffSpeed,
    };

    // Start with zero velocity
    cfg.velocity = { x: 0, y: 0 };
  }

  initParticles(first) {
    let p = first;
    while (p) {
      const fly = p;
      fly.config = {}; // Use a dedicated config object for our state
      const cfg = fly.config;

      // Core properties
      cfg.id = Math.random() * 10000;
      cfg.scaleMultiplier = 0.8 + Math.random() * 0.4;

      // Get a random home base for this fly.
      if (this.shape) {
        const tempParticle = {
          position: new PIXI.Point(),
        };

        this.shape.getRandPos(tempParticle);
        cfg.home = tempParticle.position;
      } else {
        cfg.home = this.group.points[0];
      }

      // Initialize velocity for the new physics-based model
      cfg.velocity = { x: 0, y: 0 };

      this._prepareForTakeOff(fly, cfg);

      fly.oldPosition = new PIXI.Point(fly.position.x, fly.position.y);

      p = p.next;
    }
  }

  updateParticle(particle, deltaSec) {
    const fly = particle;
    const cfg = fly.config;
    if (!cfg) return;

    // Read the per-emitter elapsed time, which is now correctly updated once per frame.
    const elapsedTime = fly.emitter._smellyFliesElapsedTime ?? 0;

    const oldPosition = fly.oldPosition;
    oldPosition.copyFrom(fly.position);

    switch (cfg.state) {
      case "taking_off":
        this._updateTakingOff(fly, deltaSec);
        break;
      case "flying":
        this._updateFlying(fly, deltaSec, elapsedTime);
        break;
      case "landing":
        this._updateLanding(fly, deltaSec);
        break;
      case "walking":
        this._updateWalking(fly, deltaSec);
        break;
    }

    const dx = fly.position.x - oldPosition.x;
    const dy = fly.position.y - oldPosition.y;
    // Only update rotation if the fly has moved a meaningful amount
    if (Math.hypot(dx, dy) > 0.1) {
      fly.rotation = Math.atan2(dy, dx);
    }

    // --- Motion Blur and Scaling ---
    const mbConfig = this.config.motionBlur || {
      enabled: true,
      strength: 0.5,
      maxLength: 4,
    };
    let elongation = 0;

    // Only apply motion blur if enabled and the fly is in a fast-moving state.
    if (mbConfig.enabled && cfg.state !== "walking") {
      const frameSpeed = Math.hypot(dx, dy);
      elongation = frameSpeed * mbConfig.strength;
      elongation = Math.min(elongation, mbConfig.maxLength);
    }

    // The base scale is set by the state update methods and stored in cfg.currentBaseScale.
    const baseScale =
      (cfg.currentBaseScale ?? this.FLYING_SCALE) * cfg.scaleMultiplier;

    fly.scale.y = baseScale;
    fly.scale.x = baseScale + elongation; // Additive elongation for the blur effect.
  }

  _updateTakingOff(fly, deltaSec) {
    const cfg = fly.config;
    const totalDuration = this.config.flying.takeoffDuration ?? 0.5;
    cfg.stateTimer -= deltaSec;

    if (cfg.stateTimer <= 0) {
      // Transition complete, snap to final values
      cfg.velocity = cfg.targetVelocity;
      cfg.currentBaseScale = this.FLYING_SCALE;
      cfg.state = "flying";
      this._updateFlying(fly, 0, fly.emitter._smellyFliesElapsedTime); // Update once with zero delta to finalize position
    } else {
      const progress = 1.0 - cfg.stateTimer / totalDuration;
      const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      // Interpolate velocity from 0 to the target takeoff velocity
      cfg.velocity.x = this._lerp(0, cfg.targetVelocity.x, ease);
      cfg.velocity.y = this._lerp(0, cfg.targetVelocity.y, ease);

      // Update position based on the current interpolated velocity
      fly.position.x += cfg.velocity.x * deltaSec;
      fly.position.y += cfg.velocity.y * deltaSec;

      // Interpolate base scale and store it for the main update loop.
      cfg.currentBaseScale = this._lerp(
        this.WALKING_SCALE,
        this.FLYING_SCALE,
        ease
      );
    }
  }

  _updateFlying(fly, deltaSec, elapsedTime) {
    const cfg = fly.config;
    const flyConfig = this.config.flying;
    const homePoint = cfg.home;

    // --- FORCES ---

    // 1. Random erratic movement force using simplex noise
    const noiseStrength = flyConfig.noiseStrength ?? 400;
    const noiseFrequency = flyConfig.noiseFrequency ?? 2.0;
    const time = elapsedTime * noiseFrequency;
    // Get a smoothly changing angle from noise
    const randomAngle = this._simplexNoise3D(cfg.id, time, 0) * Math.PI * 2;
    const randomForce = {
      x: Math.cos(randomAngle) * noiseStrength,
      y: Math.sin(randomAngle) * noiseStrength,
    };
    cfg.velocity.x += randomForce.x * deltaSec;
    cfg.velocity.y += randomForce.y * deltaSec;

    // 2. Tether force to pull the fly back to its home area
    const tetherStrength = flyConfig.tetherStrength ?? 0.8;
    const dx = homePoint.x - fly.position.x;
    const dy = homePoint.y - fly.position.y;
    cfg.velocity.x += dx * tetherStrength * deltaSec;
    cfg.velocity.y += dy * tetherStrength * deltaSec;

    // --- PHYSICS ---

    // 3. Speed limit
    const maxSpeed = flyConfig.maxSpeed ?? 150;
    const speed = Math.hypot(cfg.velocity.x, cfg.velocity.y);
    if (speed > maxSpeed) {
      const ratio = maxSpeed / speed;
      cfg.velocity.x *= ratio;
      cfg.velocity.y *= ratio;
    }

    // 4. Drag/Friction to slow the fly down naturally
    const drag = flyConfig.drag ?? 0.5;
    cfg.velocity.x *= 1 - drag * deltaSec;
    cfg.velocity.y *= 1 - drag * deltaSec;

    // --- UPDATE POSITION ---
    fly.position.x += cfg.velocity.x * deltaSec;
    fly.position.y += cfg.velocity.y * deltaSec;

    cfg.currentBaseScale = this.FLYING_SCALE;

    // --- STATE CHANGE: LANDING ---
    if (this.group.type === "area" && this.group.points.length > 2) {
      if (
        Math.random() < flyConfig.landChance * deltaSec &&
        this._isPointInPolygon(fly.position)
      ) {
        cfg.state = "landing";
        cfg.stateTimer = flyConfig.landingDuration ?? 1.0;
      }
    }
  }

  _updateLanding(fly, deltaSec) {
    const cfg = fly.config;
    const flyConfig = this.config.flying;
    const totalDuration = flyConfig.landingDuration ?? 1.0;
    cfg.stateTimer -= deltaSec;

    const progress = 1.0 - cfg.stateTimer / totalDuration;
    const ease = 1 - Math.pow(1 - progress, 5); // Ease out quint for a strong slowdown

    // Apply a very strong drag that increases as the animation progresses
    const landingDrag = this._lerp(0.5, 0.95, ease);
    cfg.velocity.x *= 1 - landingDrag * deltaSec * 60; // Make drag frame-rate independent
    cfg.velocity.y *= 1 - landingDrag * deltaSec * 60;

    fly.position.x += cfg.velocity.x * deltaSec;
    fly.position.y += cfg.velocity.y * deltaSec;

    // Interpolate the scale downwards
    cfg.currentBaseScale = this._lerp(
      this.FLYING_SCALE,
      this.WALKING_SCALE,
      ease
    );

    if (cfg.stateTimer <= 0) {
      cfg.currentBaseScale = this.WALKING_SCALE;
      cfg.velocity = { x: 0, y: 0 };
      cfg.state = "walking";
      cfg.walkingState = "idle";
      cfg.stateTimer =
        this.config.walking.minIdleTime +
        Math.random() *
          (this.config.walking.maxIdleTime - this.config.walking.minIdleTime);
    }
  }

  _updateWalking(fly, deltaSec) {
    const cfg = fly.config;
    const walkConfig = this.config.walking;

    cfg.currentBaseScale = this.WALKING_SCALE;

    // Chance to take off at any point during the walking phase
    if (Math.random() < walkConfig.takeoffChance * deltaSec) {
      this._prepareForTakeOff(fly, cfg);
      return;
    }

    cfg.stateTimer -= deltaSec;

    // State: Idle. Waiting for a bit before deciding what to do next.
    if (cfg.walkingState === "idle") {
      if (cfg.stateTimer <= 0) {
        // Idle time over, decide on a new destination.
        const moveDistance =
          walkConfig.minMoveDistance +
          Math.random() *
            (walkConfig.maxMoveDistance - walkConfig.minMoveDistance);

        let targetPoint;
        let attempts = 0;
        const MAX_ATTEMPTS = 10;

        do {
          const moveAngle = Math.random() * Math.PI * 2;
          targetPoint = new PIXI.Point(
            fly.position.x + Math.cos(moveAngle) * moveDistance,
            fly.position.y + Math.sin(moveAngle) * moveDistance
          );
          attempts++;
        } while (
          this.shape &&
          !this.shape._isPointInPolygon(targetPoint) &&
          attempts < MAX_ATTEMPTS
        );

        // If we failed to find a valid point after several tries, just idle again.
        if (
          attempts >= MAX_ATTEMPTS &&
          this.shape &&
          !this.shape._isPointInPolygon(targetPoint)
        ) {
          cfg.walkingState = "idle";
          cfg.stateTimer =
            walkConfig.minIdleTime +
            Math.random() * (walkConfig.maxIdleTime - walkConfig.minIdleTime);
          return;
        }

        cfg.walkTarget = targetPoint;

        // Transition to rotating state
        cfg.walkingState = "rotating";
        const dx = cfg.walkTarget.x - fly.position.x;
        const dy = cfg.walkTarget.y - fly.position.y;
        cfg.targetRotation = Math.atan2(dy, dx);
        cfg.startRotation = fly.rotation;

        cfg.stateTimer =
          walkConfig.minRotateTime +
          Math.random() * (walkConfig.maxRotateTime - walkConfig.minRotateTime);
        cfg.rotationDuration = cfg.stateTimer;
      }
    }
    // State: Rotating to face the new destination.
    else if (cfg.walkingState === "rotating") {
      const progress = Math.min(
        1.0,
        1.0 - cfg.stateTimer / cfg.rotationDuration
      );

      // Interpolate angle, handling the wrap-around for the shortest path
      let start = cfg.startRotation;
      let end = cfg.targetRotation;
      let diff = end - start;
      if (diff > Math.PI) end -= 2 * Math.PI;
      if (diff < -Math.PI) end += 2 * Math.PI;
      fly.rotation = this._lerp(start, end, progress);

      if (cfg.stateTimer <= 0) {
        fly.rotation = cfg.targetRotation;
        cfg.walkingState = "moving";

        const distance = Math.hypot(
          cfg.walkTarget.x - fly.position.x,
          cfg.walkTarget.y - fly.position.y
        );
        cfg.stateTimer = distance / walkConfig.walkSpeed;
        cfg.moveDuration = cfg.stateTimer;
        cfg.startPosition = new PIXI.Point(fly.position.x, fly.position.y);
      }
    }
    // State: Moving towards the destination.
    else if (cfg.walkingState === "moving") {
      if (
        cfg.stateTimer <= 0 ||
        !cfg.moveDuration ||
        cfg.moveDuration <= 0 ||
        !cfg.startPosition
      ) {
        if (cfg.walkTarget) fly.position.copyFrom(cfg.walkTarget);
        cfg.walkingState = "idle";
        cfg.stateTimer =
          walkConfig.minIdleTime +
          Math.random() * (walkConfig.maxIdleTime - walkConfig.minIdleTime);
      } else {
        const progress = Math.min(1.0, 1.0 - cfg.stateTimer / cfg.moveDuration);
        fly.position.x = this._lerp(
          cfg.startPosition.x,
          cfg.walkTarget.x,
          progress
        );
        fly.position.y = this._lerp(
          cfg.startPosition.y,
          cfg.walkTarget.y,
          progress
        );
      }
    }
  }

  _isPointInPolygon(point) {
    let isInside = false;
    const points = this.group.points;
    const n = points.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = points[i].x,
        yi = points[i].y;
      const xj = points[j].x,
        yj = points[j].y;

      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }
}

const buildSmellyFliesEmitterConfig = (effectConfig, targetData, group) => {
  const globalParticleConfig =
    game.mapShine.profileManager.activeConfig.particleSystems;
  const globalMultiplier = globalParticleConfig.globalDensityMultiplier ?? 1.0;
  const config = effectConfig || {};
  const rect = targetData?.rect;

  if (!rect || !group || group.points.length === 0) {
    return { maxParticles: 0, behaviors: [] };
  }

  const spawnBehavior = {
    type: "spawnShape",
    config: {
      type: "geometryMask",
      data: {
        group: group,
      },
    },
  };

  const behaviors = [
    {
      type: "textureSingle",
      config: {
        texture: config.particleTexture,
      },
    },
    {
      type: "scaleStatic",
      config: {
        min: 1.0,
        max: 1.0,
      },
    },
    // Use a static alpha to prevent default fade-out, ensuring flies are persistent.
    {
      type: "alphaStatic",
      config: {
        alpha: 1.0,
      },
    },
    // The moveSpeedStatic behavior is removed to prevent conflicts with the custom behavior.
    spawnBehavior,
    {
      type: "smellyFlies",
      config: { ...config, group }, // Pass the full config and group data to the behavior
    },
  ];

  // Add blend mode as a behavior (required for particles to respect it)
  const blendMode = config.blendMode ?? PIXI.BLEND_MODES.NORMAL;
  addBlendModeBehavior(behaviors, blendMode);

  return {
    lifetime: { min: 60, max: 120 }, // Flies live for a long time
    // A low frequency makes this a continuous emitter. It will spawn
    // particles over time until the maxParticles limit is reached, and
    // will replace particles that expire. The rate is tied to the
    // maxParticles setting to fill larger swarms more quickly.
    frequency: 1.0 / ((config.maxParticles || 100) * 0.1),
    emitterLifetime: -1,
    maxParticles: Math.floor(config.maxParticles * globalMultiplier),
    blendMode: blendMode,
    pos: { x: 0, y: 0 },
    addAtBack: false,
    behaviors: behaviors,
  };
};

export class SmellyFliesLayer extends AnimatedCanvasLayer {
  constructor() {
    super();
    this.controller = null; // Will hold the ParticleEffectController for smellyFlies
    this._onMapPointsUpdatedBound = null;
    this._initialized = false;
  }

  async _draw() {
    await super._draw(); // Handles ticker binding and _destroyed flag
    this._initialized = false;
    this.eventMode = "none";

    const definition = PARTICLE_EFFECT_DEFINITIONS.smellyFlies;
    if (definition) {
      // The controller's parent container is this layer itself.
      this.controller = new ParticleEffectController(
        "smellyFlies",
        definition,
        this
      );
    } else {
      console.error("Map Shine | SmellyFlies particle definition not found!");
    }

    // Bind and register listener for mask rendering completion to prevent race conditions.
    this._onMasksRenderedBound = this._onMasksRendered.bind(this);

    Hooks.on("mapShine:masksRendered", this._onMasksRenderedBound);
  }

  async _tearDown(options) {
    if (this._destroyed) return;

    if (this._onMasksRenderedBound) {
      Hooks.off("mapShine:masksRendered", this._onMasksRenderedBound);
    }

    this.controller?.destroy();
    this.controller = null;

    await super._tearDown(options); // Handles ticker unbinding and _destroyed flag
  }

  /**
   * Handler for when geometry masks have finished rendering.
   * Called AFTER GeometryMaskManager completes rendering to prevent race conditions.
   */
  async _onMasksRendered(data) {
    const changedGroupId = data?.changedGroupId;
    if (game.mapShine.effectTargetManager) {
      // Refresh targets to pick up any new map point groups that were just added
      await game.mapShine.effectTargetManager.refresh();
      if (game.mapShine.effectTargetManager.targets) {
        this.updateEffectTargets(game.mapShine.effectTargetManager.targets, {
          changedGroupId,
        });
      }
    }
  }

  _onAnimate(deltaTime) {
    if (this._destroyed || !this.controller) return;
    if (!this._initialized && game.mapShine.systemsReady) {
      this._initialized = true;
    }
    if (!this._initialized) return;

    // Clamp delta time to prevent physics explosions on frame drops
    const clampedDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME);

    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    const deltaInSeconds = clampedDeltaTime * timeFactor;
    this.controller.update(deltaInSeconds);
  }

  async updateEffectTargets(targets, options = {}) {
    this.controller?.updateTargets(
      targets,
      game.mapShine.profileManager.activeConfig,
      options
    );
  }

  async updateFromConfig(config, options = {}) {
    if (this.controller) {
      this.controller.updateFromConfig(config);

      if (!options?.timeOnly && !options?.lightingOnly) {
        const targets = game.mapShine.effectTargetManager.targets;
        if (targets) {
          this.updateEffectTargets(targets);
        }
      }
    }
  }
}


class NoisePatternFilter extends PIXI.Filter {
  constructor(options) {
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
                            varying vec2 vScreenCoord; // Use the reliable screen coordinate varying

                            uniform float u_time;
                            uniform vec2 u_resolution;
                            uniform float u_speed, u_scale, u_threshold, u_brightness, u_contrast, u_softness;
                            uniform float u_evolution;

                            // New uniforms for world-space mode
                            uniform bool u_isWorldSpace;
                            uniform vec2 u_camera_offset;
                            uniform vec2 u_view_size;

                            float random(vec3 st) {
                                return fract(sin(dot(st.xyz, vec3(12.9898, 78.233, 54.731))) * 43758.5453123);
                            }

                            float value_noise(vec3 st) {
                                vec3 i = floor(st);
                                vec3 f = fract(st);

                                float a = random(i + vec3(0.0, 0.0, 0.0));
                                float b = random(i + vec3(1.0, 0.0, 0.0));
                                float c = random(i + vec3(0.0, 1.0, 0.0));
                                float d = random(i + vec3(1.0, 1.0, 0.0));
                                float e = random(i + vec3(0.0, 0.0, 1.0));
                                float f_ = random(i + vec3(1.0, 0.0, 1.0));
                                float g = random(i + vec3(0.0, 1.0, 1.0));
                                float h = random(i + vec3(1.0, 1.0, 1.0));

                                vec3 u = f * f * (3.0 - 2.0 * f);

                                float bottom_x = mix(a, b, u.x);
                                float top_x = mix(c, d, u.x);
                                float bottom_face_mix = mix(bottom_x, top_x, u.y);

                                float bottom_x_top = mix(e, f_, u.x);
                                float top_x_top = mix(g, h, u.x);
                                float top_face_mix = mix(bottom_x_top, top_x_top, u.y);

                                return mix(bottom_face_mix, top_face_mix, u.z);
                            }

                            void main() {
                                vec2 uv;
                                if (u_isWorldSpace) {
                                    // Calculate world coordinates from the reliable vScreenCoord
                                    vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);
                                    world_coord.x += u_time * u_speed * 10.0;
                                    uv = world_coord * u_scale / 1000.0;
                                } else {
                                    // Original screen-space calculation using vScreenCoord
                                    vec2 screen_pixel_coord = vScreenCoord * u_resolution;
                                    vec2 screen_center_pixel_coord = u_resolution * 0.5;
                                    uv = (screen_pixel_coord - screen_center_pixel_coord) * u_scale / 30.0;
                                    uv.x += u_time * u_speed;
                                }

                                float time_z = u_time * u_evolution;
                                float noise = value_noise(vec3(uv, time_z));

                                noise += u_brightness;
                                noise = (noise - 0.5) * u_contrast + 0.5;
                                noise = smoothstep(u_threshold, u_threshold + u_softness, noise);
                                gl_FragColor = vec4(vec3(clamp(noise, 0.0, 1.0)), 1.0);
                            }
                        `;
    const safeOptions = {
      u_resolution: [
        canvas?.app?.renderer.screen.width || 1,
        canvas?.app?.renderer.screen.height || 1,
      ],
      u_evolution: 0.0,
      u_isWorldSpace: false,
      u_camera_offset: [0, 0],
      u_view_size: [0, 0],
      ...options,
    };

    super(vertexSrc, fragmentSrc, safeOptions);
  }
}

// Expose for early consumers that cannot import directly
globalThis.NoisePatternFilter = globalThis.NoisePatternFilter || NoisePatternFilter;

/**
 * @extends {PIXI.Filter}
 * @property {object} uniforms - The uniforms of the filter.
 */
class FilmGrainFilter extends PIXI.Filter {
  constructor(options = {}) {
    const fragmentSrc = `
                precision mediump float;
                varying vec2 vTextureCoord;

                uniform sampler2D uSampler;
                uniform float u_time;
                uniform float u_intensity;
                uniform float u_size;
                uniform bool u_monochromatic;
                uniform vec2 u_luminanceResponse; // x: shadows, y: highlights

                const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                // A simple, fast pseudo-random number generator
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                void main() {
                    vec4 originalColor = texture2D(uSampler, vTextureCoord);

                    // Don't apply grain to transparent areas
                    if (originalColor.a == 0.0) {
                        gl_FragColor = originalColor;
                        return;
                    }

                    // Create a seed for the random function based on screen position and time
                    vec2 seed = (vTextureCoord + u_time) * u_size;

                    // Generate grain value
                    float grain = random(seed);
                    vec3 grain_color;

                    if (u_monochromatic) {
                        grain_color = vec3(grain);
                    } else {
                        // Generate different random values for each color channel for colored noise
                        grain_color.r = random(seed + vec2(1.7, 5.3));
                        grain_color.g = random(seed + vec2(8.9, 3.1));
                        grain_color.b = random(seed + vec2(4.2, 7.5));
                    }

                    // Center the grain around 0 (from -0.5 to 0.5)
                    grain_color -= 0.5;

                    // Calculate the pixel's luminance
                    float luminance = dot(originalColor.rgb, lum_weights);

                    // Determine grain strength based on luminance
                    float response = mix(u_luminanceResponse.x, u_luminanceResponse.y, luminance);

                    // Combine all factors for the final grain intensity
                    float final_intensity = u_intensity * response;

                    // Apply the grain to the original color
                    vec3 final_rgb = originalColor.rgb + grain_color * final_intensity;

                    gl_FragColor = vec4(final_rgb, originalColor.a);
                }
            `;

    super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
      u_time: 0.0,
      u_intensity: options.intensity ?? 0.1,
      u_size: options.size ?? 1.5,
      u_monochromatic: options.monochromatic ?? true,
      u_luminanceResponse: options.luminanceResponse ?? [0.8, 0.2],
    });
  }

  /**
   * Updates the time uniform for animated grain.
   * This is now called by the central ScreenEffectsManager.
   * @param {number} deltaTimeInSeconds - The time elapsed since the last frame.
   */
  update(deltaTimeInSeconds) {
    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    // A small multiplier is added to make the animation visible without requiring a large u_time value
    this.uniforms.u_time += deltaTimeInSeconds * timeFactor * 0.1;
  }

  get time() {
    return this.uniforms.u_time;
  }
  set time(value) {
    this.uniforms.u_time = value;
  }

  get intensity() {
    return this.uniforms.u_intensity;
  }
  set intensity(value) {
    this.uniforms.u_intensity = value;
  }

  get size() {
    return this.uniforms.u_size;
  }
  set size(value) {
    this.uniforms.u_size = value;
  }

  get monochromatic() {
    return this.uniforms.u_monochromatic;
  }
  set monochromatic(value) {
    this.uniforms.u_monochromatic = value;
  }

  get luminanceResponse() {
    return this.uniforms.u_luminanceResponse;
  }
  set luminanceResponse(value) {
    this.uniforms.u_luminanceResponse = value;
  }
}

class HeatDistortionNoiseFilter extends PIXI.Filter {
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
                    // Calculate normalized screen coordinates from the vertex's final position.
                    // This is the robust way to get screen-space UVs for a post-processing filter.
                    vScreenCoord = gl_Position.xy * 0.5 + 0.5;
                }
            `;
    const fragmentSrc = `
                precision mediump float;
                varying vec2 vScreenCoord; // Use the reliable screen coordinate varying

                uniform float u_time;

                // World-space uniforms
                uniform vec2 u_camera_offset;
                uniform vec2 u_view_size;

                // Primary Noise Layer
                uniform float u_primarySpeed;
                uniform float u_primaryScale;
                uniform int u_primaryOctaves;
                uniform float u_primaryLacunarity;
                uniform float u_primaryPersistence;

                // Secondary Noise Layer
                uniform float u_secondarySpeed;
                uniform float u_secondaryScale;
                uniform int u_secondaryOctaves;
                uniform float u_secondaryLacunarity;
                uniform float u_secondaryPersistence;

                // Rising Motion
                uniform float u_risingSpeed;

                // 2D Simplex Noise functions by Ashima Arts.
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                vec3 taylorInvSqrt(vec3 r) { return 1.79284291400159 - 0.85373472095314 * r; }
                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy));
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec2 x1 = x0.xy + C.xx - i1;
                    vec2 x2 = x0.xy + C.zz;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
                    m = m*m; m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= taylorInvSqrt(a0*a0 + h*h);
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
                    return 130.0 * dot(m, g);
                }

                // 2D FBM function
                float fbm(vec2 st, int octaves, float lacunarity, float persistence) {
                    float value = 0.0;
                    float amplitude = 0.5;
                    for (int i = 0; i < 8; i++) {
                        if (i >= octaves) break;
                        value += amplitude * snoise(st);
                        st *= lacunarity;
                        amplitude *= persistence;
                    }
                    return value; // Returns range approx -1 to 1
                }

                void main() {
                    // Convert screen-space vScreenCoord to world-space coordinates.
                    vec2 world_coord = u_camera_offset + (vScreenCoord * u_view_size);

                    // --- ANIMATION ---
                    // Calculate all animation offsets consistently in world-space first.
                    // A multiplier is used to keep UI speed values in a sensible range.
                    vec2 primary_anim_offset = vec2(u_time * u_primarySpeed, -u_time * u_risingSpeed) * 20.0;
                    vec2 secondary_anim_offset = vec2(u_time * u_secondarySpeed, -u_time * u_risingSpeed) * 20.0;

                    // --- NOISE CALCULATION ---
                    // Apply animation offsets to world coordinates, THEN scale for noise sampling.
                    vec2 primary_uv = (world_coord + primary_anim_offset) * u_primaryScale * 0.01;
                    vec2 secondary_uv = (world_coord + secondary_anim_offset) * u_secondaryScale * 0.01;

                    // Primary, slower, larger waves for X and Y displacement
                    float primary_noise_x = fbm(primary_uv, u_primaryOctaves, u_primaryLacunarity, u_primaryPersistence);
                    float primary_noise_y = fbm(primary_uv + vec2(13.7, 5.9), u_primaryOctaves, u_primaryLacunarity, u_primaryPersistence);

                    // Secondary, faster, smaller waves for detail
                    float secondary_noise_x = fbm(secondary_uv, u_secondaryOctaves, u_secondaryLacunarity, u_secondaryPersistence);
                    float secondary_noise_y = fbm(secondary_uv + vec2(-8.2, -19.1), u_secondaryOctaves, u_secondaryLacunarity, u_secondaryPersistence);

                    // Combine noises
                    float final_x = (primary_noise_x * 0.7) + (secondary_noise_x * 0.3);
                    float final_y = (primary_noise_y * 0.7) + (secondary_noise_y * 0.3);

                    // Normalize to 0-1 range for the displacement map
                    gl_FragColor = vec4(final_x * 0.5 + 0.5, final_y * 0.5 + 0.5, 0.0, 1.0);
                }
            `;
    super(vertexSrc, fragmentSrc, {
      u_time: 0.0,

      u_camera_offset: [0, 0],

      u_view_size: [1, 1],

      u_primarySpeed: 0.01,

      u_primaryScale: 1.5,

      u_primaryOctaves: 3,

      u_primaryLacunarity: 2.0,

      u_primaryPersistence: 0.5,

      u_secondarySpeed: 0.08,

      u_secondaryScale: 6.0,

      u_secondaryOctaves: 2,

      u_secondaryLacunarity: 2.5,

      u_secondaryPersistence: 0.4,

      u_risingSpeed: 0.02,
      // u_risingIntensity is no longer used by the shader but is kept for config compatibility

      u_risingIntensity: 0.5,
      ...options,
    });
  }
}

class ColorCorrectionFilter extends PIXI.Filter {
  constructor(options = {}) {
    const fragmentSrc = `
                            precision mediump float;
                            varying vec2 vTextureCoord;

                            uniform sampler2D uSampler;

                            uniform sampler2D uAmbientCompositeTexture;
                            uniform bool uAmbientCompositeEnabled;
                            uniform int uAmbientCompositeBlendMode;

                            uniform float uSaturation, uBrightness, uContrast;
                            uniform float uExposure, uGamma, uInBlack, uInWhite;
                            uniform float uTemperature, uWbTint;
                            uniform bool uInvert;
                            uniform vec3 uTintColor;
                            uniform float uTintAmount;

                            // Selective Color Uniforms
                            uniform bool uSelectiveEnabled;
                            uniform vec3 uSelectiveColor;
                            uniform float uSelectiveHueRange, uSelectiveSatRange, uSelectiveLumRange;
                            uniform float uSelectiveTargetLum, uSelectiveSoftness;
                            uniform bool uSelectiveInvert;
                            uniform float uSelectiveDesaturation;
                            uniform float uSelectiveTargetSaturation, uSelectiveTargetBrightness;

                            uniform sampler2D uCurveLUT;
                            uniform bool uCurvesEnabled;

                            uniform float uIntensity;
                            uniform vec4 uSceneRectNorm;

                            uniform float uDynamicExposureBoost;
                            uniform float uDynamicContrastBoost;

                            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                            vec3 rgb2hsl(vec3 c) {
                                float max_c = max(max(c.r, c.g), c.b);
                                float min_c = min(min(c.r, c.g), c.b);
                                float h = 0.0, s = 0.0, l = (max_c + min_c) / 2.0;
                                if (max_c != min_c) {
                                    float d = max_c - min_c;
                                    s = l > 0.5 ? d / (2.0 - max_c - min_c) : d / (max_c + min_c);
                                    if (max_c == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                                    else if (max_c == c.g) h = (c.b - c.r) / d + 2.0;
                                    else h = (c.r - c.g) / d + 4.0;
                                    h /= 6.0;
                                }
                                return vec3(h, s, l);
                            }

                            float hue2rgb(float p, float q, float t) {
                                if (t < 0.0) t += 1.0;
                                if (t > 1.0) t -= 1.0;
                                if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
                                if (t < 1.0/2.0) return q;
                                if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
                                return p;
                            }

                            vec3 hsl2rgb(vec3 c) {
                                if (c.y == 0.0) return vec3(c.z);
                                float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
                                float p = 2.0 * c.z - q;
                                return vec3(hue2rgb(p, q, c.x + 1.0/3.0), hue2rgb(p, q, c.x), hue2rgb(p, q, c.x - 1.0/3.0));
                            }

                            vec3 applyCurves(vec3 color, sampler2D lut) {
                                color.r = texture2D(lut, vec2(color.r, 0.5)).r;
                                color.g = texture2D(lut, vec2(color.g, 0.5)).g;
                                color.b = texture2D(lut, vec2(color.b, 0.5)).b;
                                return color;
                            }

                            vec3 applyWhiteBalance(vec3 color, float temp, float green_tint) {
                                const float STRENGTH = 0.5;
                                color.r += temp * (color.r * (1.0 - color.r)) * STRENGTH;
                                color.b -= temp * (color.b * (1.0 - color.b)) * STRENGTH;
                                color.g += green_tint * (color.g * (1.0 - color.g)) * STRENGTH;
                                return color;
                            }

                            void main(void) {
                                vec4 originalColor = texture2D(uSampler, vTextureCoord);

                                vec3 workingColor = originalColor.rgb;
                                if (originalColor.a > 0.0) {
                                    workingColor /= originalColor.a;
                                }

                                vec3 uncorrectedColor = workingColor;

                                if (uSelectiveEnabled) {
                                    vec3 pixel_hsl = rgb2hsl(workingColor);
                                    vec3 target_hsl = rgb2hsl(uSelectiveColor);

                                    float hue_dist = min(abs(pixel_hsl.x - target_hsl.x), 1.0 - abs(pixel_hsl.x - target_hsl.x));
                                    float hue_mask = 1.0 - smoothstep(uSelectiveHueRange, uSelectiveHueRange + uSelectiveSoftness, hue_dist);

                                    float sat_dist = abs(pixel_hsl.y - target_hsl.y);
                                    float sat_mask = 1.0 - smoothstep(uSelectiveSatRange, uSelectiveSatRange + uSelectiveSoftness, sat_dist);

                                    float lum_dist = abs(pixel_hsl.z - uSelectiveTargetLum);
                                    float lum_mask = 1.0 - smoothstep(uSelectiveLumRange, uSelectiveLumRange + uSelectiveSoftness, lum_dist);

                                    float selection_mask = hue_mask * sat_mask * lum_mask;

                                    if (uSelectiveInvert) {
                                        selection_mask = 1.0 - selection_mask;
                                    }

                                    vec3 desaturated_color = vec3(dot(workingColor, lum_weights));
                                    workingColor = mix(mix(desaturated_color, workingColor, 1.0 - uSelectiveDesaturation), workingColor, selection_mask);

                                    if (selection_mask > 0.0) {
                                        vec3 current_hsl = rgb2hsl(workingColor);
                                        current_hsl.y *= uSelectiveTargetSaturation;
                                        current_hsl.z = clamp(current_hsl.z + uSelectiveTargetBrightness, 0.0, 1.0);
                                        vec3 adjusted_color = hsl2rgb(current_hsl);
                                        workingColor = mix(workingColor, adjusted_color, selection_mask);
                                    }
                                }

                                if (uInWhite > uInBlack) workingColor = (workingColor - uInBlack) / (uInWhite - uInBlack + 0.00001);

                                workingColor *= pow(2.0, uExposure + uDynamicExposureBoost);

                                workingColor = applyWhiteBalance(workingColor, uTemperature, uWbTint);

                                if (uGamma > 0.0) workingColor = pow(max(workingColor, 0.0), vec3(1.0 / uGamma));

                                if (uCurvesEnabled) {
                                    workingColor = applyCurves(workingColor, uCurveLUT);
                                }

                                workingColor += uBrightness;
                                workingColor = (workingColor - 0.5) * (uContrast * uDynamicContrastBoost) + 0.5;
                                float final_luminance = dot(workingColor, lum_weights);
                                workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                                workingColor = mix(workingColor, uTintColor, uTintAmount);
                                if (uInvert) workingColor = 1.0 - workingColor;

                                vec3 final_rgb = mix(uncorrectedColor, workingColor, uIntensity);

                                if (uAmbientCompositeEnabled) {
                                    vec4 ambient = texture2D(uAmbientCompositeTexture, vTextureCoord);
                                    if (ambient.a > 0.0) {
                                        vec3 ambientRGB = (ambient.rgb / ambient.a);
                                        if (uAmbientCompositeBlendMode == 1) {
                                            final_rgb += ambientRGB;
                                        } else if (uAmbientCompositeBlendMode == 2) {
                                            final_rgb *= ambientRGB;
                                        } else if (uAmbientCompositeBlendMode == 3) {
                                            final_rgb = 1.0 - (1.0 - final_rgb) * (1.0 - ambientRGB);
                                        } else {
                                            final_rgb = mix(final_rgb, ambientRGB, ambient.a);
                                        }
                                    }
                                }

                                vec3 premultiplied_rgb = clamp(final_rgb, 0.0, 1.0) * originalColor.a;
                                gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
                            }
                        `;

    super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
      uSaturation: 1.0,

      uBrightness: 0.0,

      uContrast: 1.0,

      uExposure: 0.0,

      uGamma: 1.0,

      uInBlack: 0.0,

      uInWhite: 1.0,

      uTemperature: 0.0,

      uWbTint: 0.0,

      uInvert: false,

      uTintColor: [1.0, 1.0, 1.0],

      uTintAmount: 0.0,

      uSelectiveEnabled: false,

      uSelectiveColor: [1.0, 0.0, 0.0],

      uSelectiveHueRange: 0.1,

      uSelectiveSatRange: 0.4,

      uSelectiveLumRange: 0.5,

      uSelectiveTargetLum: 0.5,

      uSelectiveSoftness: 0.1,

      uSelectiveInvert: false,

      uSelectiveDesaturation: 1.0,

      uSelectiveTargetSaturation: 1.0,

      uSelectiveTargetBrightness: 0.0,

      uCurveLUT: PIXI.Texture.EMPTY,

      uCurvesEnabled: false,

      uAmbientCompositeTexture: PIXI.Texture.EMPTY,

      uAmbientCompositeEnabled: false,

      uAmbientCompositeBlendMode: PIXI.BLEND_MODES.NORMAL,

      uSceneRectNorm: [0, 0, 1, 1],
      uIntensity: options.intensity ?? 1.0,

      uDynamicExposureBoost: 0.0,

      uDynamicHighlightPreservation: 0.8,

      uDynamicContrastBoost: 1.0,
    });
  }
}

class LutUtils {
  /**
   * Generates a 1D LUT texture (256x1) from a set of BÃ©zier curve definitions.
   * @param {object} curvesConfig - The configuration object for the curves.
   * @returns {PIXI.Texture} The generated LUT texture.
   */
  static generateCurveLut(curvesConfig) {
    const lutSize = 256;
    const redLUT = this._generateChannelLut(curvesConfig.red.points, lutSize);
    const greenLUT = this._generateChannelLut(
      curvesConfig.green.points,
      lutSize
    );
    const blueLUT = this._generateChannelLut(curvesConfig.blue.points, lutSize);

    const lutData = new Uint8Array(lutSize * 4);
    for (let i = 0; i < lutSize; i++) {
      lutData[i * 4 + 0] = redLUT[i] * 255;
      lutData[i * 4 + 1] = greenLUT[i] * 255;
      lutData[i * 4 + 2] = blueLUT[i] * 255;
      lutData[i * 4 + 3] = 255;
    }

    const bufferResource = new PIXI.BufferResource(lutData, {
      width: lutSize,
      height: 1,
    });

    const baseTexture = new PIXI.BaseTexture(bufferResource, {
      scaleMode: PIXI.SCALE_MODES.LINEAR,
      mipmap: PIXI.MIPMAP_MODES.OFF,
    });
    return new PIXI.Texture(baseTexture);
  }

  /**
   * Generates a lookup table for a single color channel from BÃ©zier control points.
   * This uses a pre-computation and interpolation method to solve the curve efficiently.
   * @param {Array<object>} points - An array of 4 normalized {x, y} control points.
   * @param {number} size - The size of the LUT to generate (e.g., 256).
   * @returns {Float32Array} The generated LUT.
   * @private
   */
  static _generateChannelLut(points, size) {
    const p0 = points[0];
    const p1 = points[1];
    const p2 = points[2];
    const p3 = points[3];

    // Pre-calculate a cache of x-values for t from 0 to 1.
    // This helps us quickly find an approximate t for a given x.
    const xCache = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const t = i / (size - 1);
      xCache[i] = this._getBezierCoordinate(t, p0.x, p1.x, p2.x, p3.x);
    }

    const lut = new Float32Array(size);
    let cacheIndex = 0;

    for (let i = 0; i < size; i++) {
      const targetX = i / (size - 1);

      // Find the segment in our cache that contains the targetX.
      // This is a simple linear search which is fast enough for a 256-element array.
      while (cacheIndex < size - 2 && xCache[cacheIndex + 1] < targetX) {
        cacheIndex++;
      }

      const x1 = xCache[cacheIndex];
      const x2 = xCache[cacheIndex + 1];
      const t1 = cacheIndex / (size - 1);
      const t2 = (cacheIndex + 1) / (size - 1);

      let t;
      const xDiff = x2 - x1;

      // Handle vertical curve segments to prevent division by zero.
      if (Math.abs(xDiff) < 1e-6) {
        t = t1;
      } else {
        // Linearly interpolate to find a more precise 't' for our targetX.
        t = t1 + ((targetX - x1) * (t2 - t1)) / xDiff;
      }

      const y = this._getBezierCoordinate(t, p0.y, p1.y, p2.y, p3.y);
      lut[i] = Math.max(0.0, Math.min(1.0, y));
    }

    return lut;
  }

  /**
   * Calculates a coordinate on a 1D cubic BÃ©zier curve.
   * @param {number} t - The interpolation parameter [0, 1].
   * @param {number} p0 - Start point coordinate.
   * @param {number} p1 - First control point coordinate.
   * @param {number} p2 - Second control point coordinate.
   * @param {number} p3 - End point coordinate.
   * @returns {number} The coordinate value at t.
   * @private
   */
  static _getBezierCoordinate(t, p0, p1, p2, p3) {
    const c = 1.0 - t;
    const t2 = t * t;
    const c2 = c * c;
    const t3 = t2 * t;
    const c3 = c2 * c;
    return c3 * p0 + 3.0 * c2 * t * p1 + 3.0 * c * t2 * p2 + t3 * p3;
  }
}



class AmbientColorFilter extends PIXI.Filter {
  constructor(options = {}) {
    const vertexSrc = `
                            attribute vec2 aVertexPosition;
                            attribute vec2 aTextureCoord;

                            uniform mat3 projectionMatrix;

                            varying vec2 vTextureCoord;
                            varying vec2 vScreenCoord;

                            void main(void)
                            {
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

                            uniform float uSaturation, uBrightness, uContrast, uGamma;
                            uniform vec3 uTintColor;
                            uniform float uTintAmount;
                            uniform float u_intensity;

                            uniform sampler2D uTokenMask;
                            uniform bool uTokenMaskEnabled;
                            uniform float uTokenMaskThreshold;

                            const vec3 lum_weights = vec3(0.299, 0.587, 0.114);

                            void main(void) {

                                if (uTokenMaskEnabled) {

                                    float maskValue = texture2D(uTokenMask, vScreenCoord).r;
                                    if (maskValue > uTokenMaskThreshold) {
                                        discard;
                                    }
                                }

                                vec4 originalColor = texture2D(uSampler, vTextureCoord);
                                if (originalColor.a == 0.0) {
                                    discard;
                                }

                                vec3 workingColor = originalColor.rgb;

                                if (uGamma > 0.0) {
                                    workingColor = pow(workingColor, vec3(1.0 / uGamma));
                                }
                                workingColor += uBrightness;
                                workingColor = (workingColor - 0.5) * uContrast + 0.5;
                                float final_luminance = dot(workingColor, lum_weights);
                                workingColor = mix(vec3(final_luminance), workingColor, uSaturation);
                                workingColor = mix(workingColor, uTintColor, uTintAmount);

                                workingColor *= u_intensity;

                                vec3 premultiplied_rgb = workingColor * originalColor.a;
                                gl_FragColor = vec4(premultiplied_rgb, originalColor.a);
                            }
                        `;

    super(vertexSrc, fragmentSrc, {
      uSaturation: options.saturation ?? 1.0,
      uBrightness: options.brightness ?? 0.0,
      uContrast: options.contrast ?? 1.0,
      uGamma: options.gamma ?? 1.0,
      uTintColor: options.tintColor ?? [1.0, 1.0, 1.0],
      uTintAmount: options.tintAmount ?? 0.0,

      u_intensity: options.intensity ?? 1.0,

      uTokenMask: PIXI.Texture.EMPTY,

      uTokenMaskEnabled: false,
      uTokenMaskThreshold: options.tokenMaskThreshold ?? 0.1,
    });
  }
}

// Make AmbientColorFilter available globally for extracted modules
globalThis.AmbientColorFilter = AmbientColorFilter;



class VignetteFilter extends PIXI.Filter {
  constructor(options = {}) {
    super(
      PIXI.Filter.defaultVertexSrc,
      `
                            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform float u_softness;
                            void main(void) {
                                if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                                vec4 color = texture2D(uSampler, vTextureCoord);
                                float dist = distance(vTextureCoord, vec2(0.5));
                                float start = u_softness - 0.15;
                                float end = u_softness + 0.15;
                                float falloff = smoothstep(start, end, dist);
                                color.rgb *= (1.0 - (u_amount * falloff));
                                gl_FragColor = color;
                            }
                        `,
      {
        u_amount: options.amount ?? 0.5,
        u_softness: options.softness ?? 0.5,
      }
    );
  }
  get amount() {
    return this.uniforms.u_amount;
  }
  set amount(v) {
    this.uniforms.u_amount = v;
  }
  get softness() {
    return this.uniforms.u_softness;
  }
  set softness(v) {
    this.uniforms.u_softness = v;
  }
}

class LensDistortionFilter extends PIXI.Filter {
  constructor(options = {}) {
    super(
      PIXI.Filter.defaultVertexSrc,
      `
                            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
                            void main(void) {
                                if (u_amount == 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                                vec2 D = vTextureCoord - u_center;
                                float r = length(D);
                                vec2 distorted_coord = u_center + D * (1.0 + u_amount * r * r);
                                gl_FragColor = texture2D(uSampler, distorted_coord);
                            }
                        `,
      {
        u_amount: options.amount ?? 0.0,

        u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5],
      }
    );
  }
  get amount() {
    return this.uniforms.u_amount;
  }
  set amount(v) {
    this.uniforms.u_amount = v;
  }
  get center() {
    return this.uniforms.u_center;
  }
  set center(v) {
    this.uniforms.u_center = v;
  }
}

class ChromaticAberrationFilter extends PIXI.Filter {
  constructor(options = {}) {
    super(
      PIXI.Filter.defaultVertexSrc,
      `
                            precision mediump float; varying vec2 vTextureCoord; uniform sampler2D uSampler; uniform float u_amount; uniform vec2 u_center;
                            void main(void) {
                                if (u_amount <= 0.0) { gl_FragColor = texture2D(uSampler, vTextureCoord); return; }
                                vec2 offset = (vTextureCoord - u_center) * u_amount;
                                float r = texture2D(uSampler, vTextureCoord - offset).r;
                                float g = texture2D(uSampler, vTextureCoord).g;
                                float b = texture2D(uSampler, vTextureCoord + offset).b;
                                float a = texture2D(uSampler, vTextureCoord).a;
                                gl_FragColor = vec4(r, g, b, a);
                            }
                        `,
      {
        u_amount: options.amount ?? 0.0,

        u_center: [options.centerX ?? 0.5, options.centerY ?? 0.5],
      }
    );
  }
  get amount() {
    return this.uniforms.u_amount;
  }
  set amount(v) {
    this.uniforms.u_amount = v;
  }
  get center() {
    return this.uniforms.u_center;
  }
  set center(v) {
    this.uniforms.u_center = v;
  }
}

class ParticleRgbSplitFilter extends PIXI.Filter {
  constructor(options = {}) {
    const fragmentSrc = `
                            precision mediump float;
                            varying vec2 vTextureCoord;

                            uniform sampler2D uSampler;
                            uniform float uAmount;
                            uniform vec2 uTexelSize;

                            void main(void) {
                                if (uAmount == 0.0) {
                                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                                    return;
                                }

                                vec2 offset = vec2(uAmount * uTexelSize.x, 0.0);

                                float r = texture2D(uSampler, vTextureCoord - offset).r;
                                float g = texture2D(uSampler, vTextureCoord).g;
                                float b = texture2D(uSampler, vTextureCoord + offset).b;
                                float a = texture2D(uSampler, vTextureCoord).a;

                                gl_FragColor = vec4(r, g, b, a);
                            }
                        `;
    super(PIXI.Filter.defaultVertexSrc, fragmentSrc, {
      uAmount: options.amount ?? 0.0,
      uTexelSize: options.texelSize ?? [
        1.0 / (window.innerWidth || 1),
        1.0 / (window.innerHeight || 1),
      ],
    });
  }
}




class BackgroundEffectTileLayer extends AnimatedCanvasLayer {
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





class MapPointsLayer extends foundry.canvas.layers.CanvasLayer {
  constructor() {
    super();
    this.mapPointsContainer = null;

    // These properties are now public and will be controlled by the Interaction Manager
    this._hoveredPoint = null;
    this._draggedPoint = null;
    this._liveDragGroup = null; // A temporary group object for live drag visuals

    this.POINT_HIT_AREA = 12; // Radius in screen pixels for clicking a point

    this._boundDrawMapPoints = this._drawMapPoints.bind(this);
  }

  /**
   * @override
   */

  async _draw() {
    this.mapPointsContainer = this.addChild(new PIXI.Container());
    this.eventMode = "none";
    this.alpha = game.mapShine.mapPointsInteractionManager?.isActive ? 1 : 0;

    Hooks.on("mapShine:mapPointsUpdated", this._boundDrawMapPoints);
    this._drawMapPoints();
  }

  /**
   * @override
   */
  async _tearDown(options) {
    Hooks.off("mapShine:mapPointsUpdated", this._boundDrawMapPoints);
    this.mapPointsContainer?.destroy({
      children: true,
    });
    this.mapPointsContainer = null;
    this._hoveredPoint = null;
    this._draggedPoint = null;
    this._liveDragGroup = null;
    return super._tearDown(options);
  }

  /**
   * Public method to find which point is under the cursor.
   * The Interaction Manager will use this.
   */
  _getPointAt(position) {
    const groups = MapPointsManager.getGroups();
    const hitRadius = this.POINT_HIT_AREA / canvas.stage.scale.x;
    for (const group of Object.values(groups)) {
      for (let i = 0; i < group.points.length; i++) {
        const p = group.points[i];
        if (Math.hypot(position.x - p.x, position.y - p.y) <= hitRadius) {
          return {
            groupId: group.id,
            pointIndex: i,
            point: p,
          };
        }
      }
    }
    return null;
  }

  /**
   * Renders all points, lines, and areas from the stored data.
   * Also handles hover effects based on the public _hoveredPoint property.
   */
  _drawMapPoints() {
    if (!this.mapPointsContainer) return;
    this.mapPointsContainer.removeChildren().forEach((c) =>
      c.destroy({
        children: true,
      })
    );

    const groups = MapPointsManager.getGroups();
    if (foundry.utils.isEmpty(groups)) return;

    const graphics = new PIXI.Graphics();
    this.mapPointsContainer.addChild(graphics);

    const groupsToDraw = this._liveDragGroup
      ? {
          ...groups,
          [this._liveDragGroup.id]: this._liveDragGroup,
        }
      : groups;

    for (const group of Object.values(groupsToDraw)) {
      if (!group.points || group.points.length === 0) continue;

      const pointRadius = 8 / canvas.stage.scale.x;
      const lineThickness = 4 / canvas.stage.scale.x;
      const isLiveDragGroup =
        this._liveDragGroup && this._liveDragGroup.id === group.id;

      // Draw lines and area fills only for 'line' or 'area' types.
      if (
        (group.type === "line" || group.type === "area") &&
        group.points.length > 1
      ) {
        graphics.lineStyle(
          lineThickness,
          group.isBroken ? 0xff0000 : 0x00ff00,
          isLiveDragGroup ? 0.9 : 0.7
        );
        graphics.moveTo(group.points[0].x, group.points[0].y);
        for (let i = 1; i < group.points.length; i++) {
          graphics.lineTo(group.points[i].x, group.points[i].y);
        }
        if (group.type === "area") graphics.closePath();
      }

      if (group.type === "area" && !group.isBroken && group.points.length > 2) {
        graphics.beginFill(0x00ff00, isLiveDragGroup ? 0.4 : 0.25);
        graphics.moveTo(group.points[0].x, group.points[0].y);
        for (let i = 1; i < group.points.length; i++) {
          graphics.lineTo(group.points[i].x, group.points[i].y);
        }
        graphics.closePath();
        graphics.endFill();
      }

      // Draw points for all group types
      for (let i = 0; i < group.points.length; i++) {
        const p = group.points[i];
        const isHovered =
          this._hoveredPoint &&
          this._hoveredPoint.groupId === group.id &&
          this._hoveredPoint.pointIndex === i;
        const isDragged =
          this._draggedPoint &&
          this._draggedPoint.groupId === group.id &&
          this._draggedPoint.pointIndex === i;

        let color = isHovered ? 0x00ffff : 0x00a0ff;
        let alpha = isHovered ? 0.9 : 0.6;
        let radius = pointRadius;
        if (isDragged) {
          color = 0xff8800;
          alpha = 1.0;
          radius *= 1.2;
        }

        graphics
          .lineStyle(lineThickness / 2, 0xffffff, isHovered ? 1.0 : 0.8)
          .beginFill(color, alpha);
        graphics.drawCircle(p.x, p.y, radius);
        graphics.endFill();

        // Draw delete indicator when hovering
        if (isHovered && !isDragged) {
          const deleteIconSize = 14 / canvas.stage.scale.x;
          const deleteX = p.x + radius * 1.5;
          const deleteY = p.y - radius * 1.5;

          // Red circle background
          graphics.lineStyle(0);
          graphics.beginFill(0xff0000, 0.9);
          graphics.drawCircle(deleteX, deleteY, deleteIconSize);
          graphics.endFill();

          // White X
          const xSize = deleteIconSize * 0.5;
          graphics.lineStyle(lineThickness / 2, 0xffffff, 1.0);
          graphics.moveTo(deleteX - xSize, deleteY - xSize);
          graphics.lineTo(deleteX + xSize, deleteY + xSize);
          graphics.moveTo(deleteX + xSize, deleteY - xSize);
          graphics.lineTo(deleteX - xSize, deleteY + xSize);
        }
      }

      // Draw labels (only for non-dragged groups)
      if (!isLiveDragGroup && group.points.length > 0) {
        const textContent = `${group.label} (${group.type})\n${
          group.isBroken ? "BROKEN: " + group.reason : ""
        }`;
        const label = new PIXI.Text(textContent, {
          fontFamily: "Arial",
          fontSize: 20 / canvas.stage.scale.x,
          fill: 0xffffff,
          stroke: "#000000",
          strokeThickness: 4 / canvas.stage.scale.x,
          align: "left",
        });
        label.x = group.points[0].x + 15 / canvas.stage.scale.x;
        label.y = group.points[0].y - 15 / canvas.stage.scale.x;
        label.anchor.set(0, 1);
        this.mapPointsContainer.addChild(label);
      }
    }
  }
}

// Expose MapPointsLayer for adapter-based imports
globalThis.MapPointsLayer = MapPointsLayer;

export class MapPointsInteractionManager {
  constructor() {
    this.isActive = false;
    this._draggedPoint = null;

    // Bind event handlers once
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  get layer() {
    return canvas.layers.find((l) => l instanceof MapPointsLayer);
  }

  activate() {
    console.log("MapPointsInteractionManager.activate() called");
    if (this.isActive || !game.user.isGM) return; // Added GM check
    const layer = this.layer;
    if (!layer) {
      console.warn("MapPointsInteractionManager: No layer found");
      return;
    }

    this.isActive = true;
    layer.alpha = 1; // Make the layer visible
    canvas.stage.interactive = true; // Ensure the main stage is listening
    canvas.stage.on("pointerdown", this._onPointerDown);
    canvas.stage.on("pointermove", this._onPointerMove);

    // Add crosshair cursor class
    const board = document.getElementById("board");
    console.log("Board element:", board);
    if (board) {
      board.classList.add("point-editing-mode");
      console.log("Added point-editing-mode class to board");
    }

    // Show the on-screen overlay indicator
    console.log("Calling _showOverlay()");
    this._showOverlay();

    game.mapShine.debugger?.eventHandler?._updatePlacementModeUI(true);
  }

  deactivate() {
    if (!this.isActive) return;
    this.isActive = false;

    canvas.stage.off("pointerdown", this._onPointerDown);
    canvas.stage.off("pointermove", this._onPointerMove);
    // In case a drag was interrupted, remove the 'up' listener too
    canvas.stage.off("pointerup", this._onPointerUp);

    // Remove crosshair cursor class
    const board = document.getElementById("board");
    if (board) {
      board.classList.remove("point-editing-mode");
    }

    // Hide the overlay indicator
    this._hideOverlay();

    // Clear any lingering visual state
    const layer = this.layer;
    if (layer) {
      layer._hoveredPoint = null;
      layer._draggedPoint = null;
      layer._liveDragGroup = null;
      layer._drawMapPoints();
      layer.alpha = 0; // Hide the layer
    }

    ui.notifications.info("Point Placement Mode Deactivated.");
    game.mapShine.debugger?.eventHandler?._updatePlacementModeUI(false);
  }

  _onPointerDown(event) {
    if (!this.isActive) return;

    const layer = this.layer;
    if (!layer || !event.global) return;

    const worldPos = layer.toLocal(event.global);
    const hovered = layer._getPointAt(worldPos);

    if (event.nativeEvent.button === 0) {
      // Left Click
      if (hovered) {
        // Start a drag operation
        this._draggedPoint = hovered;
        layer._draggedPoint = hovered; // Set visual state
        layer._drawMapPoints();
        // Add listener to the stage to catch pointer up everywhere
        canvas.stage.once("pointerup", this._onPointerUp);
      } else {
        // Add a new point
        const activeGroupId = game.mapShine.activeMapPointGroup;
        if (activeGroupId) {
          MapPointsManager.addPoint(activeGroupId, worldPos);
        } else {
          ui.notifications.warn(
            "Map Shine | No active group selected to add a point."
          );
        }
      }
    } else if (event.nativeEvent.button === 2) {
      // Right Click
      if (hovered) {
        MapPointsManager.removePoint(hovered.groupId, hovered.pointIndex);
      }
    }
  }

  _onPointerMove(event) {
    if (!this.isActive) return;

    const layer = this.layer;
    if (!layer || !event.global) return;

    const worldPos = layer.toLocal(event.global);

    if (this._draggedPoint) {
      // Live drag update
      const group = MapPointsManager.getGroup(this._draggedPoint.groupId);
      if (group) {
        const tempPoints = [...group.points];
        tempPoints[this._draggedPoint.pointIndex] = worldPos;
        const tempGroup = {
          ...group,
          points: tempPoints,
        };
        layer._liveDragGroup = MapPointsManager.validate(tempGroup);
        layer._drawMapPoints(); // Redraw with the temporary group state
      }
    } else {
      // Hover effect update
      const newHovered = layer._getPointAt(worldPos);
      const oldHoveredId = layer._hoveredPoint
        ? `${layer._hoveredPoint.groupId}-${layer._hoveredPoint.pointIndex}`
        : null;
      const newHoveredId = newHovered
        ? `${newHovered.groupId}-${newHovered.pointIndex}`
        : null;

      if (oldHoveredId !== newHoveredId) {
        layer._hoveredPoint = newHovered;
        layer._drawMapPoints();
      }
    }
  }

  _onPointerUp(event) {
    if (!this.isActive || !this._draggedPoint) return;

    const layer = this.layer;
    if (!layer || !event.global) {
      // If the event somehow doesn't have global coords, reset state and exit.
      this._draggedPoint = null;
      layer._draggedPoint = null;
      layer._liveDragGroup = null;
      layer._drawMapPoints(); // Redraw to clear drag visuals
      return;
    }

    const worldPos = layer.toLocal(event.global);

    // Finalize the drag
    MapPointsManager.updatePoint(
      this._draggedPoint.groupId,
      this._draggedPoint.pointIndex,
      worldPos
    );

    // Reset drag state
    this._draggedPoint = null;
    layer._draggedPoint = null;
    layer._liveDragGroup = null;
    // The mapPointsUpdated hook will trigger the final redraw.
  }

  handleEscape(event) {
    if (event.key === "Escape" && this.isActive) {
      event.preventDefault();
      event.stopPropagation();
      this.deactivate();
      return true;
    }
    return false;
  }

  _showOverlay() {
    console.log("_showOverlay() called");
    try {
      // Remove any existing overlay
      this._hideOverlay();

      // Create the overlay element
      const overlay = document.createElement("div");
      overlay.id = "point-editing-mode-overlay";
      overlay.innerHTML = `
        <div class="overlay-title">
          <i class="fas fa-crosshairs"></i>
          <span>Point Editing Mode Active</span>
        </div>
        <div class="overlay-instructions">
          <span class="instruction-line"><strong>Left-Click:</strong> Add Point</span>
          <span class="instruction-separator">•</span>
          <span class="instruction-line"><strong>Left-Drag:</strong> Move Point</span>
          <span class="instruction-separator">•</span>
          <span class="instruction-line"><strong>Right-Click:</strong> Delete Point</span>
          <span class="instruction-separator">•</span>
          <span class="instruction-line"><strong>ESC:</strong> Exit Mode</span>
        </div>
      `;

      console.log("Appending overlay to body:", overlay);
      document.body.appendChild(overlay);
      console.log(
        "Overlay appended successfully. Element in DOM:",
        document.getElementById("point-editing-mode-overlay")
      );
    } catch (error) {
      console.error("Error in _showOverlay():", error);
    }
  }

  _hideOverlay() {
    const overlay = document.getElementById("point-editing-mode-overlay");
    if (overlay) {
      overlay.remove();
    }
  }
}








// =================================================================================
// SECTION 12: USER INTERFACE & SETTINGS MANAGEMENT
// =================================================================================
// Description: UI components including loading screens, debugger interface,
//              profile management panel, map points editor, and user guide.
//              Handles all visual configuration and management interfaces.
// ---------------------------------------------------------------------------------



class CurveEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 256;
    this.height = options.height || 256;
    this.onChange = options.onChange || (() => {});

    // Use a standard "Y-up" coordinate system internally, where y=0 is the bottom.
    this.points = [
      {
        x: 0,
        y: 0,
      },
      {
        x: this.width * 0.25,
        y: this.height * 0.25,
      },
      {
        x: this.width * 0.75,
        y: this.height * 0.75,
      },
      {
        x: this.width,
        y: this.height,
      },
    ];

    this.activePoint = null;
    this.init();
  }

  init() {
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("width", this.width);
    this.svg.setAttribute("height", this.height);
    this.svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.container.appendChild(this.svg);

    // Create a group for the grid
    const gridGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    gridGroup.setAttribute("stroke", "rgba(255, 255, 255, 0.2)");
    gridGroup.setAttribute("stroke-width", "0.5");
    this.svg.appendChild(gridGroup);

    // Add grid lines (e.g., every 25%)
    for (let i = 1; i < 4; i++) {
      const pos = this.width * (i / 4);
      // Vertical line
      const vLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      vLine.setAttribute("x1", pos);

      vLine.setAttribute("y1", 0);

      vLine.setAttribute("x2", pos);
      vLine.setAttribute("y2", this.height);
      gridGroup.appendChild(vLine);
      // Horizontal line
      const hLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      hLine.setAttribute("x1", 0);

      hLine.setAttribute("y1", pos);
      hLine.setAttribute("x2", this.width);

      hLine.setAttribute("y2", pos);
      gridGroup.appendChild(hLine);
    }

    // Add the neutral 1:1 diagonal line
    const neutralLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );

    neutralLine.setAttribute("x1", 0);
    neutralLine.setAttribute("y1", this.height);
    neutralLine.setAttribute("x2", this.width);

    neutralLine.setAttribute("y2", 0);
    neutralLine.setAttribute("stroke", "rgba(255,255,255,0.2)");
    neutralLine.setAttribute("stroke-width", "1");
    neutralLine.setAttribute("stroke-dasharray", "4 4");
    this.svg.appendChild(neutralLine);

    this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    this.path.setAttribute("fill", "none");
    this.path.setAttribute("stroke", "#00aaff");
    this.path.setAttribute("stroke-width", "2.5"); // Thicker path
    this.svg.appendChild(this.path);

    this.controlPoints = this.points.map((p, i) => {
      // When drawing, we flip the y-coordinate to match SVG's "y-down" system.
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", p.x);

      circle.setAttribute("cy", this.height - p.y);

      circle.setAttribute("r", 6);
      circle.setAttribute("fill", "rgba(0, 170, 255, 0.5)"); // Semi-transparent fill
      circle.setAttribute("stroke", "#fff"); // White stroke
      circle.setAttribute("stroke-width", "2");
      circle.setAttribute("cursor", "grab");
      this.svg.appendChild(circle);

      circle.addEventListener("mousedown", (_e) => {
        this.activePoint = i;
      });
      return circle;
    });

    this.svg.addEventListener("mousemove", this.onDrag.bind(this));
    this.svg.addEventListener("mouseup", this.onEndDrag.bind(this));
    this.svg.addEventListener("mouseleave", this.onEndDrag.bind(this));

    this.drawCurve();
  }

  onDrag(e) {
    if (this.activePoint === null) return;
    e.preventDefault();
    this.svg.style.cursor = "grabbing";

    const rect = this.svg.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Clamp screen coordinates
    x = Math.max(0, Math.min(this.width, x));
    y = Math.max(0, Math.min(this.height, y));

    // First and last points are fixed horizontally
    if (this.activePoint > 0 && this.activePoint < this.points.length - 1) {
      this.points[this.activePoint].x = x;
    }
    // Convert the SVG's "y-down" coordinate back to our internal "y-up" system for storage.
    this.points[this.activePoint].y = this.height - y;

    this.drawCurve();
  }

  onEndDrag() {
    if (this.activePoint !== null) {
      this.svg.style.cursor = "default";
      this.activePoint = null;
      this.onChange(this.getNormalizedPoints());
    }
  }

  setPoints(normalizedPoints) {
    if (!normalizedPoints || normalizedPoints.length !== 4) {
      console.warn("CurveEditor: Invalid points data provided for setPoints.");
      return;
    }

    // Directly map normalized "y-up" data to internal "y-up" system.
    this.points = normalizedPoints.map((p) => ({
      x: p.x * this.width,
      y: p.y * this.height,
    }));

    this.drawCurve();
    // Trigger the LUT update by calling the onChange callback
    this.onChange(this.getNormalizedPoints(), {
      isLoading: true,
    });
  }

  getNormalizedPoints() {
    // Directly normalize the internal "y-up" points.
    return this.points.map((p) => ({
      x: p.x / this.width,
      y: p.y / this.height,
    }));
  }

  drawCurve() {
    this.controlPoints.forEach((circle, i) => {
      // When drawing, flip the internal "y-up" coordinate to SVG's "y-down" screen coordinate.
      circle.setAttribute("cx", this.points[i].x);

      circle.setAttribute("cy", this.height - this.points[i].y);
    });

    const p = this.points;
    // The path data must also be flipped for rendering in the y-down SVG canvas.
    const pathData = `M ${p[0].x},${this.height - p[0].y} C ${p[1].x},${
      this.height - p[1].y
    } ${p[2].x},${this.height - p[2].y} ${p[3].x},${this.height - p[3].y}`;
    this.path.setAttribute("d", pathData);
  }
}








// Make DebuggerUIBuilder available globally for extracted modules
globalThis.DebuggerUIBuilder = DebuggerUIBuilder;
// Expose Map Points classes for adapter modules
globalThis.MapPointsManager = MapPointsManager;
globalThis.MapPointsInteractionManager = MapPointsInteractionManager;

// Foundry lifecycle: initialize Map Shine on 'init'
Hooks.once('init', () => {
  try {
    MapShineInitialiser.initialize();
  } catch (e) {
    console.error('Map Shine | Initialization failed during init hook:', e);
  }
});







// Expose lazy accordion diagnostics globally for console access
window.MapShineLazyAccordions = {
  getStats() {
    const editorDebugger = game.mapShine?.materialEditorDebugger;
    if (!editorDebugger?.eventHandler?.lazyAccordionManager) {
      console.warn('LazyAccordionManager not available');
      return null;
    }
    return editorDebugger.eventHandler.lazyAccordionManager.getStats();
  },
  
  printReport() {
    const stats = this.getStats();
    if (!stats) return;
    
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   Lazy Accordion Performance Report       ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║ Registered Accordions: ${String(stats.registered).padStart(17)} ║`);
    console.log(`║ Currently Open:        ${String(stats.injected).padStart(17)} ║`);
    console.log(`║ Current DOM Elements:  ${String(stats.domElements).padStart(17)} ║`);
    console.log(`║ Expected Idle DOM:     ${String('~500').padStart(17)} ║`);
    console.log(`║ Original DOM Count:    ${String('~6862').padStart(17)} ║`);
    console.log(`║ DOM Reduction:         ${String('~92%').padStart(17)} ║`);
    console.log('╚════════════════════════════════════════════╝');
    
    const reduction = ((6862 - stats.domElements) / 6862 * 100).toFixed(1);
    console.log(`\nActual DOM Reduction: ${reduction}%`);
    console.log(`Expected FPS Improvement: ${(20 * (stats.domElements / 500)).toFixed(0)} FPS → ~100 FPS`);
  },
  
  listAccordions() {
    const editorDebugger = game.mapShine?.materialEditorDebugger;
    if (!editorDebugger?.eventHandler?.lazyAccordionManager) {
      console.warn('LazyAccordionManager not available');
      return;
    }
    
    const manager = editorDebugger.eventHandler.lazyAccordionManager;
    console.log('Registered Accordions:');
    manager.contentCache.forEach((_, id) => {
      const isOpen = manager.accordionStates.get(id);
      const isInjected = manager.injectedContent.has(id);
      console.log(`  ${id}: ${isOpen ? 'OPEN' : 'closed'} ${isInjected ? '(content in DOM)' : '(stripped)'}`);
    });
  }
};

