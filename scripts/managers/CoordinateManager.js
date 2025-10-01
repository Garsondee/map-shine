/**
 * @fileoverview Coordinate Management System for Map Shine Module
 * 
 * This file contains the CoordinateManager class that provides centralized
 * coordinate transformation and viewport management for all visual effects.
 * It ensures consistent world-space to screen-space conversions and provides
 * standardized shader uniforms for PIXI filters.
 * 
 * @author Garsondee
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Centralized coordinate transformation and viewport management system.
 * 
 * This class provides a single source of truth for all coordinate transformations,
 * camera positioning, and viewport calculations across the Map Shine module.
 * It ensures consistent world-space to screen-space conversions and provides
 * standardized shader uniforms for PIXI filters.
 * 
 * Key responsibilities:
 * - Frame-by-frame viewport state caching
 * - World-space to screen-space coordinate transformations
 * - Camera offset and zoom level tracking
 * - Standardized shader uniform generation
 * - Scene boundary calculations
 * 
 * All visual effects, filters, and layers should use this class rather than
 * performing coordinate calculations manually to ensure consistency and performance.
 * 
 * @class CoordinateManager
 * @static
 * @since 1.0.0
 * @example
 * // Update coordinate data once per frame
 * CoordinateManager.update();
 * 
 * // Get shader uniforms for a filter
 * const uniforms = CoordinateManager.getShaderUniforms();
 * myFilter.uniforms = { ...myFilter.uniforms, ...uniforms };
 * 
 * // Convert world coordinates to screen coordinates
 * const screenPos = CoordinateManager.worldToScreen(worldX, worldY);
 */
class CoordinateManager {
	// --- Frame-specific cached data ---
	static cameraOffset = { x: 0, y: 0 };
	static viewSize = { width: 0, height: 0 };
	static screenDimensions = { width: 0, height: 0 };
	static canvasScale = 1.0;
	static sceneRectNormalized = { x: 0, y: 0, width: 1, height: 1 };

	/**
	 * Updates the coordinate data for the current animation frame.
	 * This should be called exactly once per frame from the primary ticker.
	 */
	static update() {
		if (!canvas?.stage || !canvas.app?.renderer) return;

		const stage = canvas.stage;
		const screen = canvas.app.renderer.screen;

		// Calculate the world-space coordinate corresponding to the top-left corner of the screen.
		// @ts-expect-error
		const topLeftWorld = stage.toLocal(new PIXI.Point(0, 0));
		this.cameraOffset = { x: topLeftWorld.x, y: topLeftWorld.y };

		// Store the current zoom level.
		// @ts-expect-error
		this.canvasScale = stage.scale.x;

		// Calculate the dimensions of the visible area in world-space coordinates.
		// This is robust against a scale of zero.
		this.viewSize = {
			width: this.canvasScale > 0 ? screen.width / this.canvasScale : 0,
			height: this.canvasScale > 0 ? screen.height / this.canvasScale : 0,
		};

		// Store the pixel dimensions of the canvas.
		this.screenDimensions = { width: screen.width, height: screen.height };

		// Calculate the scene rectangle in normalized screen coordinates [x, y, width, height].
		const rect = canvas.scene?.dimensions?.sceneRect;
		if (
			rect &&
			this.screenDimensions.width > 0 &&
			this.screenDimensions.height > 0
		) {
			// @ts-expect-error
			const topLeftScreen = stage.toGlobal(new PIXI.Point(rect.x, rect.y));
			const sceneWidthPixels = rect.width * this.canvasScale;
			const sceneHeightPixels = rect.height * this.canvasScale;

			this.sceneRectNormalized = {
				x: topLeftScreen.x / this.screenDimensions.width,
				y: topLeftScreen.y / this.screenDimensions.height,
				width: sceneWidthPixels / this.screenDimensions.width,
				height: sceneHeightPixels / this.screenDimensions.height,
			};
		} else {
			this.sceneRectNormalized = { x: 0, y: 0, width: 1, height: 1 };
		}
	}

	/**
	 * Provides a standardized object of uniforms for shaders that need to perform
	 * world-space calculations.
	 * @returns {object} An object containing shader uniforms.
	 */
	static getShaderUniforms() {
		return {
			u_camera_offset: [this.cameraOffset.x, this.cameraOffset.y],
			u_view_size: [this.viewSize.width, this.viewSize.height],
			u_resolution: [this.screenDimensions.width, this.screenDimensions.height],
			u_canvas_scale: this.canvasScale,
			uSceneRectNorm: [
				this.sceneRectNormalized.x,
				this.sceneRectNormalized.y,
				this.sceneRectNormalized.width,
				this.sceneRectNormalized.height,
			],
		};
	}

	/**
	 * Gets the world-space coordinate of the top-left corner of the screen.
	 * @returns {{x: number, y: number}}
	 */
	static getCameraOffset() {
		return this.cameraOffset;
	}

	/**
	 * Gets the dimensions of the visible canvas area in world-space coordinates.
	 * @returns {{width: number, height: number}}
	 */
	static getViewSize() {
		return this.viewSize;
	}

	/**
	 * Gets the dimensions of the canvas in screen-space pixels.
	 * @returns {{width: number, height: number}}
	 */
	static getScreenDimensions() {
		// Robustness check to prevent framebuffer errors if called too early.
		if (
			this.screenDimensions.width === 0 ||
			this.screenDimensions.height === 0
		) {
			if (canvas?.app?.renderer?.screen) {
				const screen = canvas.app.renderer.screen;
				if (screen.width > 0 && screen.height > 0) {
					console.warn(
						"Map Shine | CoordinateManager.getScreenDimensions() called before initial update. Providing fallback dimensions."
					);
					return { width: screen.width, height: screen.height };
				}
			}
			// Fallback to prevent a crash
			return { width: 1, height: 1 };
		}
		return this.screenDimensions;
	}

	/**
	 * Gets the current zoom level of the canvas.
	 * @returns {number}
	 */
	static getCanvasScale() {
		return this.canvasScale;
	}

	/**
	 * Gets the scene rectangle in normalized screen coordinates [x, y, width, height].
	 * @returns {number[]}
	 */
	static getSceneRectNormalizedArray() {
		return [
			this.sceneRectNormalized.x,
			this.sceneRectNormalized.y,
			this.sceneRectNormalized.width,
			this.sceneRectNormalized.height,
		];
	}
}

// Export the class for use in other modules
export { CoordinateManager };
