/**
 * @fileoverview Ambient Layer for Map Shine Module
 * 
 * This file contains the AmbientLayer class that provides scene-wide atmospheric
 * effects and ambient lighting enhancements. It manages animated sprites, color
 * filtering, and environmental effects across the entire canvas.
 * 
 * @author Garsondee
 * @version 1.0.0
 * @since 1.0.0
 */

import { hexToRgbArray } from "../utils/ColorUtils.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { PIXI, Texture, BLEND_MODES } from "../pixi-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";
// AmbientColorFilter is resolved dynamically at runtime to avoid import order issues

/**
 * Custom canvas layer for rendering ambient visual effects across the entire scene.
 * 
 * The AmbientLayer provides scene-wide atmospheric effects that enhance the visual
 * ambiance of maps. It manages animated sprites, color filtering, and environmental
 * effects that span the entire canvas area rather than being tied to specific objects.
 * 
 * Key features:
 * - Scene-wide ambient color filtering and tinting
 * - Animated atmospheric effect sprites (dust, particles, etc.)
 * - Automatic viewport-based positioning and scaling
 * - Performance-optimized rendering with proper cleanup
 * - Integration with the Map Shine profile system
 * 
 * The layer automatically handles:
 * - Canvas resize events for responsive scaling
 * - Animation frame updates for smooth effects
 * - Proper resource cleanup on layer destruction
 * - Blend mode management for visual composition
 * 
 * @class AmbientLayer
 * @extends foundry.canvas.layers.CanvasLayer
 * @since 1.0.0
 */
class AmbientLayer extends foundry.canvas.layers.CanvasLayer {
	constructor() {
		super();
		this.effectSprites = new Map();
		this.colorFilter = null;
		this._destroyed = false;

		this._onAnimateBound = this._onAnimate.bind(this);
		this._onResizeBound = this._onResize.bind(this);
		console.log(
			"AmbientLayer DEBUG | constructor: New layer instance created. Destroyed state:",
			this._destroyed
		);
	}

	async _draw(options) {
		console.log(
			"AmbientLayer DEBUG | _draw: Called. Layer is being drawn to the canvas.",
			{
				options,
			}
		);
		this._destroyed = false;
		this.eventMode = "none";
		console.log("AmbientLayer DEBUG | _draw: _destroyed flag set to false.");

		try {
			let AmbientCtor = null;
			try {
				const mod = await import("../postfx/filters-adapter.js");
				AmbientCtor = mod?.AmbientColorFilter || null;
			} catch (_) { /* ignore adapter import errors */ }
			if (!AmbientCtor && globalThis.AmbientColorFilter) {
				AmbientCtor = globalThis.AmbientColorFilter;
			}
			if (!AmbientCtor) throw new ReferenceError("AmbientColorFilter not available (null)");
			this.colorFilter = new AmbientCtor();
			console.log(
				"AmbientLayer DEBUG | _draw: AmbientColorFilter created successfully."
			);
		} catch (e) {
			console.error(
				"AmbientLayer DEBUG | _draw: FAILED to create AmbientColorFilter.",
				e
			);
		}

		this.blendMode = PIXI.BLEND_MODES.NORMAL;
		console.log("AmbientLayer DEBUG | _draw: Blend mode set to NORMAL.");

		// The premature call to _onResize() has been removed.
		window.addEventListener("resize", this._onResizeBound);
		canvas.app.ticker.add(this._onAnimateBound);
		console.log("AmbientLayer DEBUG | _draw: Listeners added.");
	}

	static getSettingsHTML() {
		return DebuggerUIBuilder._createAccordionHTML(
			"ambient",
			"Ambient / Emissive",
			`
                        ${DebuggerUIBuilder._createTextureInputHTML(
				"ambient",
				"Emissive Map (_Ambient)"
			)}
                        <p class="description-text">Applies color and effects to a texture, often used for glowing areas that are part of the map itself (e.g., lava, magic runes).</p>
                        ${DebuggerUIBuilder._createSliderHTML(
				"ambient.intensity",
				"Intensity",
				0,
				5,
				0.05,
				"Brightness multiplier. Values > 1 are useful for additive blending."
			)}
                        ${DebuggerUIBuilder._createSelectHTML(
				"ambient.blendMode",
				"Blend Mode",
				getBlendModeOptions()
			)}
                
                        <details id="details-ambient-tokenMasking">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    ${DebuggerUIBuilder._createCheckboxHTML(
				"ambient.tokenMasking.enabled",
				"Token Masking",
				true
			)}
                                </div>
                            </summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Hides the effect behind tokens. For this to work, you may need to increase this layer's Z-Index (see Rendering Order section) to be above the token layer.</p>
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambient.tokenMasking.threshold",
				"Mask Threshold",
				0,
				1,
				0.01
			)}
                            </div>
                        </details>
                
                        <details id="details-ambient-masking">
                            <summary>
                                <span class="accordion-toggle"></span>
                                <div class="summary-control">
                                    ${DebuggerUIBuilder._createCheckboxHTML(
				"ambient.masking.enabled",
				"Luminance Mask",
				true
			)}
                                </div>
                            </summary>
                            <div style="padding-left: 15px;">
                                <p class="description-text">Fades out the effect in dark areas of the scene. Requires scene lighting and the Illumination Buffer module.</p>
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambient.masking.threshold",
				"Brightness Threshold",
				0,
				1,
				0.01
			)}
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambient.masking.softness",
				"Edge Softness",
				0.01,
				1,
				0.01
			)}
                            </div>
                        </details>
                
                        <details id="details-ambient-colorCorrection"><summary><span class="accordion-toggle"></span><div class="summary-control">${DebuggerUIBuilder._createCheckboxHTML(
			"ambient.colorCorrection.enabled",
			"Color Correction",
			true
		)}</div></summary>
                            <div style="padding-left: 15px;">
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambient.colorCorrection.saturation",
				"Saturation",
				0,
				4,
				0.05
			)}
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambient.colorCorrection.brightness",
				"Brightness",
				-1,
				1,
				0.01
			)}
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambient.colorCorrection.contrast",
				"Contrast",
				0,
				4,
				0.05
			)}
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambient.colorCorrection.gamma",
				"Gamma",
				0.2,
				2.5,
				0.05
			)}
                                <details id="details-ambient-cc-tint"><summary><span class="accordion-toggle"></span><strong>Color Tint</strong></summary><div style="padding-left: 15px;">
                                        ${DebuggerUIBuilder._createColorPickerHTML(
				"ambient.colorCorrection.tint.color",
				"Tint Color"
			)}
                                        ${DebuggerUIBuilder._createSliderHTML(
				"ambient.colorCorrection.tint.amount",
				"Tint Amount",
				0,
				1,
				0.01
			)}
                                </div></details>
                            </div>
                        </details>
                        <details id="details-ambient-rendering">
                            <summary><span class="accordion-toggle"></span><strong>Rendering Order</strong></summary>
                            <div>
                                <p class="description-text">Controls the draw order of this layer relative to others like lighting and tokens. Higher values are drawn on top.</p>
                                ${DebuggerUIBuilder._createSliderHTML(
				"ambientLayerZIndex",
				"Layer Z-Index",
				0,
				500,
				10,
				"Default z-indexes: Tokens=100, Lighting=200, Weather=300, Fog=400"
			)}
                                <button id="reload-canvas-btn" style="width: 100%; margin-top: 5px;">Reload Canvas to Apply Z-Index</button>
                            </div>
                        </details>
                    `
		);
	}

	async _tearDown(options) {
		this._destroyed = true;
		console.log("AmbientLayer DEBUG | _tearDown: Called. Tearing down layer.", {
			options,
		});
		canvas.app.ticker.remove(this._onAnimateBound);
		window.removeEventListener("resize", this._onResizeBound);
		console.log("AmbientLayer DEBUG | _tearDown: Listeners removed.");

		// @ts-ignore - PIXI.Filter destroy method
		this.colorFilter?.destroy();
		console.log("AmbientLayer DEBUG | _tearDown: colorFilter destroyed.");

		// Explicitly destroy children to be sure.
		this.removeChildren().forEach((c) =>
			c.destroy({
				children: true,
				texture: true,
				baseTexture: true,
			})
		);
		this.effectSprites.clear();
		console.log(
			"AmbientLayer DEBUG | _tearDown: All children destroyed and effectSprites map cleared."
		);

		await super._tearDown(options);
	}

	_onAnimate() {
		if (this._destroyed || !this.visible) return;

		if (this.colorFilter) {
			const aConfig = game.mapShine.profileManager.activeConfig.ambient;
			const tmConfig = aConfig.tokenMasking;
			const u = this.colorFilter.uniforms;
			const resourceManager = game.mapShine.resourceManager;
			const tokenMask = resourceManager?.getTokenMask();

			const shouldEnableTokenMask = tmConfig.enabled && tokenMask?.valid;
			if (u.uTokenMaskEnabled !== shouldEnableTokenMask) {
				u.uTokenMaskEnabled = shouldEnableTokenMask;
			}

			if (u.uTokenMaskEnabled) {
				u.uTokenMask = tokenMask;
			}
		}
	}

	_onResize() {
		console.log(
			"AmbientLayer DEBUG | _onResize: Called. Triggering updateEffectTargets."
		);
		if (game.mapShine?.effectTargetManager?.targets) {
			this.updateEffectTargets(game.mapShine.effectTargetManager.targets);
		} else {
			console.log(
				"AmbientLayer DEBUG | _onResize: Skipped update, no targets available yet."
			);
		}
	}

	async updateEffectTargets(targets) {
		// console.log(
		// 	"AmbientLayer DEBUG | updateEffectTargets: Called. (Visibility check removed)"
		// );

		const validTargetIds = new Set();
		const allTargets = new Map([
			["background", targets.background],
			...targets.tiles.entries(),
		]);
		// console.log(
		// 	`AmbientLayer DEBUG | updateEffectTargets: Processing ${allTargets.size} potential targets.`
		// );

		for (const [id, targetData] of allTargets.entries()) {
			if (!targetData?.ambient) continue;
			validTargetIds.add(id);
			let effectSprite = this.effectSprites.get(id);
			if (!effectSprite) {
				console.log(
					`AmbientLayer DEBUG | updateEffectTargets: Creating NEW sprite for target ID: ${id}`
				);
				effectSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
				if (this.colorFilter) {
					effectSprite.filters = [this.colorFilter];
					// console.log(`AmbientLayer DEBUG | updateEffectTargets: Assigned colorFilter to new sprite for ${id}.`);
				}
				this.effectSprites.set(id, effectSprite);
				this.addChild(effectSprite);
			}
			await this._updateSpriteTransform(
				effectSprite,
				targetData.ambient,
				targetData.rect
			);
		}

		const idsToDestroy = [];
		for (const id of this.effectSprites.keys()) {
			if (!validTargetIds.has(id)) {
				idsToDestroy.push(id);
			}
		}

		if (idsToDestroy.length > 0) {
			console.log(
				`AmbientLayer DEBUG | updateEffectTargets: Destroying ${idsToDestroy.length} stale sprites for IDs:`,
				idsToDestroy
			);
			for (const id of idsToDestroy) {
				const sprite = this.effectSprites.get(id);
				sprite?.destroy();
				this.effectSprites.delete(id);
			}
		}

		// console.log(
		// 	`AmbientLayer DEBUG | updateEffectTargets: Finished. Active sprites: ${this.effectSprites.size}. Triggering updateFromConfig.`
		// );
		await this.updateFromConfig(game.mapShine.profileManager.activeConfig);
	}

	async _updateSpriteTransform(sprite, texturePath, rect) {
		if (!sprite || sprite.destroyed) return;

		// console.log(`AmbientLayer DEBUG | _updateSpriteTransform: Updating sprite for texture: ${texturePath}`);
		const currentPath = sprite.texture?.baseTexture?.resource?.src;
		if (texturePath !== currentPath) {
			// console.log(`AmbientLayer DEBUG | _updateSpriteTransform: Loading new texture. Old: ${currentPath}, New: ${texturePath}`);
			try {
				sprite.texture = await TextureLoader.loadTexture(texturePath);
			} catch (e) {
				console.error(
					`AmbientLayer DEBUG | _updateSpriteTransform: FAILED to load texture: ${texturePath}`,
					e
				);
				sprite.texture = PIXI.Texture.EMPTY;
			}
		}
		if (
			!sprite ||
			sprite.destroyed ||
			!sprite.anchor ||
			!sprite.texture.valid ||
			!rect
		) {
			// console.warn(`AmbientLayer DEBUG | _updateSpriteTransform: Skipping transform update due to invalid texture or rect.`);
			return;
		}
		sprite.anchor.set(0.5);
		sprite.position.set(rect.x + rect.width / 2, rect.y + rect.height / 2);
		sprite.width = rect.width;
		sprite.height = rect.height;
		sprite.rotation = rect.rotation || 0;
	}

	async updateFromConfig(config) {
		// console.log("AmbientLayer DEBUG | updateFromConfig: Called.");
		const aConfig = config.ambient;
		const ccConfig = aConfig.colorCorrection;

		this.visible = config.enabled && aConfig.enabled;
		// console.log("AmbientLayer DEBUG | updateFromConfig: Layer visibility set to:", this.visible);

		this.blendMode = PIXI.BLEND_MODES.NORMAL;
		this.alpha = 1.0;

		for (const sprite of this.effectSprites.values()) {
			sprite.blendMode = aConfig.blendMode;
			sprite.alpha = 1.0;
		}

		if (this.colorFilter) {
			this.colorFilter.enabled = ccConfig.enabled;
			const u = this.colorFilter.uniforms;
			u.uSaturation = ccConfig.saturation;
			u.uBrightness = ccConfig.brightness;
			u.uContrast = ccConfig.contrast;
			u.uGamma = ccConfig.gamma;
			u.uTintColor = hexToRgbArray(ccConfig.tint.color);
			u.uTintAmount = ccConfig.tint.amount;
			u.u_intensity = aConfig.intensity;
			u.uTokenMaskThreshold = aConfig.tokenMasking.threshold;
		}

		const mConfig = aConfig.masking;
		// @ts-ignore - External module API
		const illuminationAPI = game.modules.get("illuminationbuffer")?.api;
		const shouldBeMasked = this.visible && mConfig.enabled && !!illuminationAPI;
		if (!shouldBeMasked && this.mask) {
			// console.log("AmbientLayer DEBUG | updateFromConfig: Removing luminance mask.");
			this.mask = null;
		}
	}
}

// Export the AmbientLayer class
export { AmbientLayer };
