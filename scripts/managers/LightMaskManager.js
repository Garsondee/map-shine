import { PIXI, RenderTexture, Texture, SCALE_MODES, WRAP_MODES, TYPES, Program, Matrix } from "../pixi-adapter.js";
import { RenderTexturePool } from "../utils/RenderTexturePool.js";
import { safeCreateFilter } from "../utils/filter-utils.js";
import { NoiseFilter } from "../effects/NoiseFilter.js";

/***************************************************************************************
 *
 *                              LIGHT MASK MANAGER
 *
 *  PURPOSE:
 *  This manager is the central system responsible for generating the unified,
 *  screen-space mask of all active light sources. It performs the two-phase
 *  (hard mask + Kawase blur) rendering process and makes the final, high-quality
 *  soft-edged texture available globally via the ResourceManager.
 *
 *  ARCHITECTURE:
 *  1.  Self-Contained: It manages all its own PIXI objects (RenderTextures, Filters, etc.).
 *  2.  Optimized Updates: It uses a `_needsUpdate` flag, triggered by hooks on
 *      lights and walls, to ensure the expensive render operation only runs when
 *      absolutely necessary.
 *  3.  Centralized Control: The blur amount for the soft edges is controlled by a
 *      single global setting, ensuring a consistent look across all effects.
 *
 ***************************************************************************************/
export class LightMaskManager {
  constructor() {
    // Final output texture (PERSISTENT - not pooled)
    this.blurredLightMaskTexture = null;

    // --- Properties for three-stage rendering (Hard Mask -> Blur 1 -> Blur 2 -> Blur 3 + Noise) ---
    // Stage 1: Hard Mask
    this.lightMaskGraphics = null;
    this.lightPolygonMaskTexture = null;

    // Stage 2: Blurring - Store dimensions for pool acquisition
    this._blurWidth = 0;
    this._blurHeight = 0;
    this.kawaseBlurFilter1 = null;
    this.kawaseBlurFilter2 = null;
    this.kawaseBlurFilter3 = null;
    this.noiseFilter = null;
    this.blurSourceSprite = null; // Sprite for full-res operations
    this.downscaledBlurSprite = null; // Sprite for half-res operations

    // Mesh caching for performance
    this._cachedMeshContainer = null;
    this._cachedLightState = null;

    this._needsUpdate = true;
    this._destroyed = false;

    this._flagUpdate = () => {
      this._needsUpdate = true;
    };

    // Bind event handlers for robust listener management
    this._onProfileUpdate = this.updateFromConfig.bind(this);
    this._boundOnResize = this._onResize.bind(this);
  }

  initialize() {
    const renderer = canvas.app.renderer;
    const screen = renderer.screen;

    // Half-resolution for blur passes to improve performance
    const downscaledWidth = Math.floor(screen.width / 2);
    const downscaledHeight = Math.floor(screen.height / 2);

    // Use floating-point textures for high-quality gradients without color banding
    const downscaledTextureOptions = {
      width: downscaledWidth,
      height: downscaledHeight,
      type: PIXI.TYPES.FLOAT,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    };

    const fullResTextureOptions = {
      width: screen.width,
      height: screen.height,
      type: PIXI.TYPES.FLOAT,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    };

    // Stage 1 resources (Full resolution)
    this.lightMaskGraphics = new PIXI.Graphics();

    // @ts-expect-error - PIXI.RenderTexture.create accepts options object in v5+
    this.lightPolygonMaskTexture = PIXI.RenderTexture.create({
      width: screen.width,
      height: screen.height,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    });

    // Stage 2 resources - Store dimensions for pooled texture acquisition
    this._blurWidth = downscaledWidth;
    this._blurHeight = downscaledHeight;
    // The final output texture must be full resolution
    // @ts-expect-error - PIXI.RenderTexture.create accepts options object in v5+
    this.blurredLightMaskTexture = PIXI.RenderTexture.create(
      fullResTextureOptions
    );

    // CRITICAL: Set texture wrap mode to CLAMP to prevent edge artifacts from Kawase blur
    // Kawase blur samples outside texture bounds at screen edges, causing visible lines
    // Note: Pooled textures have CLAMP set by default in RenderTexturePool
    this.blurredLightMaskTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;

    this.kawaseBlurFilter1 = safeCreateFilter(PIXI.filters.KawaseBlurFilter, [15, 2, true], "GeometryMaskManager.kawaseBlur1");
    this.kawaseBlurFilter2 = safeCreateFilter(PIXI.filters.KawaseBlurFilter, [15, 2, true], "GeometryMaskManager.kawaseBlur2");
    this.kawaseBlurFilter3 = safeCreateFilter(PIXI.filters.KawaseBlurFilter, [15, 2, true], "GeometryMaskManager.kawaseBlur3");
    this.noiseFilter = safeCreateFilter(NoiseFilter, { noiseAmount: 0 }, "GeometryMaskManager.noise");
    
    if (!this.kawaseBlurFilter1 || !this.kawaseBlurFilter2 || !this.kawaseBlurFilter3 || !this.noiseFilter) {
      console.error("Map Shine | GeometryMaskManager: Failed to create one or more blur/noise filters");
    }

    // Sprite for full-resolution rendering (final pass)
    // Use EMPTY texture to prevent resize errors before first render
    this.blurSourceSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.blurSourceSprite.width = screen.width;
    this.blurSourceSprite.height = screen.height;

    // Sprite for downscaled rendering (intermediate blur passes)
    this.downscaledBlurSprite = new PIXI.Sprite(PIXI.Texture.EMPTY);
    this.downscaledBlurSprite.width = downscaledWidth;
    this.downscaledBlurSprite.height = downscaledHeight;

    // Register hooks to flag updates
    Hooks.on("canvasPan", this._flagUpdate);
    // @ts-expect-error - Foundry VTT light/wall hooks not in type definitions
    Hooks.on("createLight", this._flagUpdate);
    // @ts-expect-error - Foundry VTT light/wall hooks not in type definitions
    Hooks.on("updateLight", this._flagUpdate);
    // @ts-expect-error - Foundry VTT light/wall hooks not in type definitions
    Hooks.on("deleteLight", this._flagUpdate);
    Hooks.on("createWall", this._flagUpdate);
    Hooks.on("updateWall", this._flagUpdate);
    Hooks.on("deleteWall", this._flagUpdate);
    window.addEventListener("resize", this._boundOnResize);
    // @ts-expect-error - Custom module hook
    Hooks.on("mapShine:profileUpdated", this._onProfileUpdate);

    // Initial configuration
    this.updateFromConfig(game.mapShine.profileManager.activeConfig);
    console.log(
      "Map Shine | LightMaskManager initialized (3-Pass Kawase Blur with Downscaling)."
    );
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    // Unregister hooks
    Hooks.off("canvasPan", this._flagUpdate);
    // @ts-expect-error - Foundry VTT light/wall hooks not in type definitions
    Hooks.off("createLight", this._flagUpdate);
    // @ts-expect-error - Foundry VTT light/wall hooks not in type definitions
    Hooks.off("updateLight", this._flagUpdate);
    // @ts-expect-error - Foundry VTT light/wall hooks not in type definitions
    Hooks.off("deleteLight", this._flagUpdate);
    Hooks.off("createWall", this._flagUpdate);
    Hooks.off("updateWall", this._flagUpdate);
    Hooks.off("deleteWall", this._flagUpdate);
    window.removeEventListener("resize", this._boundOnResize);
    // @ts-expect-error - Custom module hook
    Hooks.off("mapShine:profileUpdated", this._onProfileUpdate);

    // Destroy all PIXI objects
    this.lightMaskGraphics?.destroy();
    this.lightPolygonMaskTexture?.destroy(true);
    // Intermediate blur textures are pooled - not owned by this manager
    this.blurredLightMaskTexture?.destroy(true);
    this.kawaseBlurFilter1?.destroy();
    this.kawaseBlurFilter2?.destroy();
    this.kawaseBlurFilter3?.destroy();

    this.noiseFilter?.destroy();
    this.blurSourceSprite?.destroy();
    this.downscaledBlurSprite?.destroy();

    // Destroy cached meshes
    this._destroyCachedMeshes();

    // Nullify references
    this.lightMaskGraphics = null;
    this.lightPolygonMaskTexture = null;
    this.blurredLightMaskTexture = null;
    this.kawaseBlurFilter1 = null;
    this.kawaseBlurFilter2 = null;
    this.kawaseBlurFilter3 = null;
    this.noiseFilter = null;
    this.blurSourceSprite = null;
    this.downscaledBlurSprite = null;

    console.log("Map Shine | LightMaskManager destroyed.");
  }

  updateFromConfig(config) {
    if (!config?.lightMask || !this.kawaseBlurFilter1) return;

    const blurAmount = config.lightMask.blur ?? 50;
    // Since we are blurring on a half-resolution texture, we need to halve the blur amount
    // to achieve a visually similar result to the full-resolution blur.
    const mappedBlur = blurAmount / 2 / 4;

    this.kawaseBlurFilter1.blur = mappedBlur;
    this.kawaseBlurFilter2.blur = mappedBlur;
    // The final pass is on a full-res texture, but the input is already blurred,
    // so we keep the blur amount consistent with the other passes.
    this.kawaseBlurFilter3.blur = mappedBlur;

    if (this.noiseFilter) {
      this.noiseFilter.noiseAmount = config.lightMask.noise ?? 0.0;
      this.noiseFilter.enabled = this.noiseFilter.noiseAmount > 0;
    }

    this._needsUpdate = true;
  }

  _onResize() {
    const renderer = canvas.app.renderer;
    const screenWidth = renderer.screen.width;
    const screenHeight = renderer.screen.height;

    const downscaledWidth = Math.floor(screenWidth / 2);
    const downscaledHeight = Math.floor(screenHeight / 2);

    // Resize all render textures
    this.lightPolygonMaskTexture?.resize(screenWidth, screenHeight);
    // Update dimensions for pooled texture acquisition
    this._blurWidth = downscaledWidth;
    this._blurHeight = downscaledHeight;
    this.blurredLightMaskTexture?.resize(screenWidth, screenHeight);

    // Resize screen-filling sprites (only if they have valid textures)
    if (this.blurSourceSprite && this.blurSourceSprite.texture?.valid) {
      this.blurSourceSprite.width = screenWidth;
      this.blurSourceSprite.height = screenHeight;
    }
    if (this.downscaledBlurSprite && this.downscaledBlurSprite.texture?.valid) {
      this.downscaledBlurSprite.width = downscaledWidth;
      this.downscaledBlurSprite.height = downscaledHeight;
    }

    this._needsUpdate = true;
  }

  update() {
    if (this._destroyed) return;
    if (this.noiseFilter) {
      this.noiseFilter.uniforms.uTime = canvas.app.ticker.lastTime;
    }
    if (this._needsUpdate) {
      this._render();
      this._needsUpdate = false;
    }
  }

  _render() {
    if (!this.lightMaskGraphics || !this.kawaseBlurFilter1) return;

    const renderer = canvas.app.renderer;
    const lights = canvas.scene.lights;
    const worldTransform = canvas.stage.transform.worldTransform;

    // --- Stage 1: Render Gradient Masks Using Meshes (Full Resolution) ---
    // Check if we need to rebuild meshes
    const currentLightState = this._computeLightState(lights);
    const needsRebuild =
      !this._cachedLightState || this._cachedLightState !== currentLightState;

    if (needsRebuild) {
      // Destroy old cached meshes
      this._destroyCachedMeshes();

      // Create new mesh container
      const meshContainer = new PIXI.Container();

      for (const light of lights) {
        if (
          !light.object?.visible ||
          !light.object.lightSource?.active ||
          light.object.lightSource.radius <= 0 ||
          !light.object.lightSource.shape?.points ||
          light.object.lightSource.shape.points.length < 6
        ) {
          continue;
        }

        // Get light properties
        const luminosity = light.object.lightSource.data?.luminosity ?? 0.5;
        const attenuation = light.object.lightSource.data?.attenuation ?? 0.5;
        const points = light.object.lightSource.shape.points;
        const centerX = light.object.center?.x ?? light.x;
        const centerY = light.object.center?.y ?? light.y;
        const radius = light.object.lightSource.radius;

        // Create mesh with gradient from center to edge
        const mesh = this._createGradientMesh(
          points,
          centerX,
          centerY,
          radius,
          luminosity,
          attenuation
        );

        if (mesh) {
          meshContainer.addChild(mesh);
        }
      }

      // Cache the container and state
      this._cachedMeshContainer = meshContainer;
      this._cachedLightState = currentLightState;
    }

    // Render cached mesh container
    if (this._cachedMeshContainer) {
      renderer.render(this._cachedMeshContainer, {
        renderTexture: this.lightPolygonMaskTexture,
        transform: worldTransform,
        clear: true,
      });
    }

    // --- Stage 2: Three-Pass Kawase Blur & Noise (Using Downscaling + Pooled Textures) ---
    // Acquire temporary textures from pool
    const temp1 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight, {
      type: PIXI.TYPES.FLOAT,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    });
    const temp2 = RenderTexturePool.acquire(this._blurWidth, this._blurHeight, {
      type: PIXI.TYPES.FLOAT,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    });

    try {
      // Pass 1 (Full-res -> Half-res)
      this.downscaledBlurSprite.texture = this.lightPolygonMaskTexture;
      this.downscaledBlurSprite.filters = [this.kawaseBlurFilter1];
      renderer.render(this.downscaledBlurSprite, {
        renderTexture: temp1,
        clear: true,
      });

      // Pass 2 (Half-res -> Half-res)
      this.downscaledBlurSprite.texture = temp1;
      this.downscaledBlurSprite.filters = [this.kawaseBlurFilter2];
      renderer.render(this.downscaledBlurSprite, {
        renderTexture: temp2,
        clear: true,
      });

      // Pass 3 (Final, Half-res -> Full-res)
      // The source sprite must be full-size to fill the final texture.
      this.blurSourceSprite.texture = temp2;
      this.blurSourceSprite.filters = [this.kawaseBlurFilter3, this.noiseFilter];
      renderer.render(this.blurSourceSprite, {
        renderTexture: this.blurredLightMaskTexture,
        clear: true,
      });
    } finally {
      // CRITICAL: Always return textures to pool
      RenderTexturePool.release(temp1);
      RenderTexturePool.release(temp2);
    }
  }

  /**
   * Computes a hash of the current light state for cache invalidation
   * @private
   */
  _computeLightState(lights) {
    const parts = [];
    for (const light of lights) {
      if (
        !light.object?.visible ||
        !light.object.lightSource?.active ||
        light.object.lightSource.radius <= 0 ||
        !light.object.lightSource.shape?.points ||
        light.object.lightSource.shape.points.length < 6
      ) {
        continue;
      }

      const luminosity = light.object.lightSource.data?.luminosity ?? 0.5;
      const attenuation = light.object.lightSource.data?.attenuation ?? 0.5;
      const centerX = light.object.center?.x ?? light.x;
      const centerY = light.object.center?.y ?? light.y;
      const radius = light.object.lightSource.radius;
      const pointsHash = light.object.lightSource.shape.points.join(",");

      parts.push(
        `${light.id}:${centerX},${centerY},${radius},${luminosity},${attenuation},${pointsHash}`
      );
    }
    return parts.join("|");
  }

  /**
   * Destroys cached meshes to free up GPU memory
   * @private
   */
  _destroyCachedMeshes() {
    if (this._cachedMeshContainer) {
      for (const mesh of this._cachedMeshContainer.children) {
        mesh.geometry?.destroy();
        mesh.shader?.destroy();
        mesh.destroy();
      }
      this._cachedMeshContainer.destroy();
      this._cachedMeshContainer = null;
    }
    this._cachedLightState = null;
  }

  /**
   * Creates a PIXI.Mesh with vertex colors for smooth gradient rendering
   * @private
   */
  _createGradientMesh(
    points,
    centerX,
    centerY,
    radius,
    luminosity,
    attenuation
  ) {
    // Convert polygon points to vertices array (x, y pairs)
    const numVertices = points.length / 2;
    if (numVertices < 3) return null;

    // Build geometry: center vertex + edge vertices
    const vertices = [];
    const uvs = [];
    const colors = [];
    const indices = [];

    // Add center vertex
    vertices.push(centerX, centerY);
    uvs.push(0.5, 0.5);

    // Center brightness based on attenuation curve
    // At attenuation=0: edge and center same brightness (hard edge via uniform color)
    // At attenuation=1: center at full luminosity, edge near zero
    const centerBrightness = luminosity;
    colors.push(centerBrightness, centerBrightness, centerBrightness, 1);

    // Add edge vertices with calculated brightness
    for (let i = 0; i < numVertices; i++) {
      const x = points[i * 2];
      const y = points[i * 2 + 1];
      vertices.push(x, y);
      uvs.push(0, 0); // UVs don't matter for solid color

      // Calculate distance ratio from center
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const distRatio = Math.min(1, dist / radius);

      // Apply attenuation curve
      // Low attenuation = flat brightness (hard edge)
      // High attenuation = steep falloff from center
      const edgeBrightness =
        luminosity * Math.pow(1 - distRatio, 1 + attenuation * 4);
      colors.push(edgeBrightness, edgeBrightness, edgeBrightness, 1);
    }

    // Create triangle fan indices (center to all edge vertices)
    for (let i = 1; i <= numVertices; i++) {
      indices.push(0); // Center vertex
      indices.push(i); // Current edge vertex
      indices.push(i === numVertices ? 1 : i + 1); // Next edge vertex (wrap around)
    }

    // Create mesh geometry
    const geometry = new PIXI.Geometry();
    geometry.addAttribute("aVertexPosition", vertices, 2);
    geometry.addAttribute("aColor", colors, 4);
    geometry.addAttribute("aTextureCoord", uvs, 2);
    geometry.addIndex(indices);

    // Create shader program that uses vertex colors
    const program = PIXI.Program.from(
      `
      attribute vec2 aVertexPosition;
      attribute vec4 aColor;
      attribute vec2 aTextureCoord;
      
      uniform mat3 projectionMatrix;
      uniform mat3 translationMatrix;
      uniform mat3 uTextureMatrix;
      
      varying vec4 vColor;
      varying vec2 vTextureCoord;
      
      void main() {
        vColor = aColor;
        vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
      }
    `,
      `
      precision mediump float;
      
      varying vec4 vColor;
      varying vec2 vTextureCoord;
      
      uniform sampler2D uSampler;
      
      void main() {
        vec4 texColor = texture2D(uSampler, vTextureCoord);
        gl_FragColor = texColor * vColor;
      }
    `
    );

    const shader = new PIXI.Shader(program, {
      uSampler: PIXI.Texture.WHITE,
      uTextureMatrix: PIXI.Matrix.IDENTITY,
    });

    const mesh = new PIXI.Mesh(geometry, shader);

    return mesh;
  }

  getTexture() {
    return this.blurredLightMaskTexture;
  }
}