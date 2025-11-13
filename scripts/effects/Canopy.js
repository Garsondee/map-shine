import { PIXI, Texture } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
import { safeCreateFilter, safeApplyFilters } from "../utils/filter-utils.js";
import { CoordinateManager } from "../managers/CoordinateManager.js";
import { MaskedEffectLayer } from "./MaskedEffectLayer.js";
import { hexToRgbArray } from "../utils/ColorUtils.js";

export class CanopyLayer extends MaskedEffectLayer {
  constructor() {
    super({
      maskSuffix: "canopy",
      effectKey: "canopy",
    });

    this.filter = null;
  }

  static getSettingsHTML() {
    const effectKey = "canopy";
    const content = `
            <p class="description-text">A black and white texture where black areas are shadows and white areas are light. This effect simulates a leafy canopy overhead.</p>
            ${DebuggerUIBuilder._createSliderHTML(
              "canopy.shadowIntensity",
              "Shadow Intensity",
              0,
              1,
              0.01
            )}
            ${DebuggerUIBuilder._createColorPickerHTML(
              "canopy.tint",
              "Shadow Tint"
            )}
        `;
    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Canopy Shadows",
      content
    );
  }

  async _draw(options) {
    // This calls the base class _draw, which sets up the mask container and texture discovery.
    await super._draw(options);

    try {
      this.filter = safeCreateFilter(CanopyFilter, {}, "CanopyLayer");
      // Apply the filter to the primary canvas container. This ensures it affects everything
      // rendered underneath it (like tiles and tokens).
      if (this.filter) {
        safeApplyFilters(
          canvas.primary,
          [...(canvas.primary.filters || []), this.filter],
          "canvas.primary (Canopy)"
        );
      }
    } catch (e) {
      console.error("MapShine | Failed to create CanopyFilter", e);
      this.filter = null;
    }
  }

  _onAnimate(deltaTime) {
    // This calls the base class _onAnimate, which re-renders the combined mask if needed.
    super._onAnimate(deltaTime);

    if (this._destroyed || !this.filter) return;

    // Check if there are any active mask textures for this effect.
    const hasActiveMasks =
      this.maskSprites.size > 0 &&
      Array.from(this.maskSprites.values()).some((s) => s.texture.valid);

    const config = game.mapShine.profileManager.activeConfig;
    const canopyConfig = config.canopy;

    // The filter's enabled state controls whether the effect is visible.
    this.filter.enabled =
      config.enabled && canopyConfig.enabled && hasActiveMasks;

    if (!this.filter.enabled) return;

    // Feed the latest data into the filter's uniforms.
    const u = this.filter.uniforms;
    u.uCanopyMask = this.getMaskTexture();
    u.uIntensity = canopyConfig.shadowIntensity;
    u.uTint = hexToRgbArray(canopyConfig.tint);

    // Pass the normalized scene rectangle from the CoordinateManager to the filter.
    u.uSceneRectNorm = CoordinateManager.getSceneRectNormalizedArray();
  }

  async updateFromConfig(config) {
    // The logic is now handled entirely within _onAnimate, which runs every frame.
    // This ensures the filter is always up-to-date with the latest config.
    // We just need to ensure the layer's visibility is set correctly.
    const canopyConfig = config.canopy;
    this.visible = config.enabled && canopyConfig.enabled;
  }

  async _tearDown(options) {
    // When the layer is removed, we must also remove its filter from the canvas container.
    if (this.filter) {
      const cleanedFilters = (canvas.primary.filters || []).filter(
        (f) => f !== this.filter
      );
      safeApplyFilters(canvas.primary, cleanedFilters, "canvas.primary (Canopy teardown)");

      this.filter.destroy();
      this.filter = null;
    }

    await super._tearDown(options);
  }
}

class CanopyFilter extends PIXI.Filter {
  constructor(_options = {}) {
    const vertexSrc = `
            attribute vec2 aVertexPosition;
            attribute vec2 aTextureCoord;
            uniform mat3 projectionMatrix;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            void main(void) {
                gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
                vTextureCoord = aTextureCoord;
                // The filter is applied to a screen-sized container, so texture coords are screen coords.
                vScreenCoord = vTextureCoord;
            }
        `;

    const fragmentSrc = `
            precision mediump float;
            varying vec2 vTextureCoord;
            varying vec2 vScreenCoord;

            uniform sampler2D uSampler; // This is the scene texture from canvas.primary
            uniform sampler2D uCanopyMask; // This is our composite _Canopy mask

            uniform float uIntensity;
            uniform vec3 uTint;

            // Uniform for scene boundaries in normalized screen coordinates [x, y, width, height]
            uniform vec4 uSceneRectNorm;

            void main() {
                // Check if the current pixel is outside the defined scene rectangle.
                vec2 sceneMin = uSceneRectNorm.xy;
                vec2 sceneMax = uSceneRectNorm.xy + uSceneRectNorm.zw;
                if (vScreenCoord.x < sceneMin.x || vScreenCoord.x > sceneMax.x || vScreenCoord.y < sceneMin.y || vScreenCoord.y > sceneMax.y) {
                    // If outside, render the original scene pixel and discard the effect for this fragment.
                    gl_FragColor = texture2D(uSampler, vTextureCoord);
                    return;
                }

                vec4 originalColor = texture2D(uSampler, vTextureCoord);

                // Sample our canopy mask. Black (0.0) is shadow, White (1.0) is light.
                float maskValue = texture2D(uCanopyMask, vScreenCoord).r;

                // Calculate the shadow multiplier.
                // Where mask is 1.0 (light), multiplier is 1.0 (no change).
                // Where mask is 0.0 (shadow), multiplier is (1.0 - uIntensity).
                float shadowMultiplier = 1.0 - ((1.0 - maskValue) * uIntensity);

                // Apply the tint to the multiplier itself, not the final color.
                // This makes the shadow colored, while leaving lit areas unaffected.
                vec3 tintedMultiplier = mix(vec3(shadowMultiplier), uTint * shadowMultiplier, uIntensity);

                // Multiply the original scene color by our calculated shadow multiplier.
                vec3 finalColor = originalColor.rgb * tintedMultiplier;

                gl_FragColor = vec4(finalColor, originalColor.a);
            }
        `;

    super(vertexSrc, fragmentSrc, {
      uCanopyMask: PIXI.Texture.EMPTY,

      uIntensity: 1.0,

      uTint: [0.0, 0.0, 0.0],

      uSceneRectNorm: [0, 0, 1, 1], // Add the new uniform with a default value
    });
  }
}
