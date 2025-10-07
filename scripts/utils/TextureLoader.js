/**
 * Texture loading utility with automatic resolution downscaling for _Suffixed textures
 */
export class TextureLoader {
    /**
     * Suffixed texture patterns that should be loaded at half resolution
     */
    static DOWNSCALE_SUFFIXES = [
        "_Specular", "_Ambient", "_Iridescence", "_GroundGlow", "_Heat", "_Fire",
        "_Sparks", "_Dust", "_Outdoors", "_Canopy", "_Structural", "_Prism",
        "_Water", "_Caustics", "_Shoreline", "_Steam", "_Normal", "_Roughness"
    ];

    /**
     * Cache for downscaled textures to avoid re-processing
     * Key: original texture path, Value: downscaled PIXI.Texture
     */
    static _textureCache = new Map();

    /**
     * Progress tracking for loading bar
     */
    static _optimizationStats = {
        total: 0,
        completed: 0
    };

    /**
     * Load a texture with automatic resolution scaling for _Suffixed textures
     * @param {string} src - Texture path
     * @param {object} options - Loading options
     * @returns {Promise<PIXI.Texture>}
     */
    static async loadTexture(src, options = {}) {
        // Check if this is a _Suffixed texture (not the background)
        const isSuffixedTexture = this.DOWNSCALE_SUFFIXES.some(suffix => src.includes(suffix));
        
        if (isSuffixedTexture) {
            // Check our cache first
            if (this._textureCache.has(src)) {
                // console.log(`Map Shine | Using cached 0.5x texture: ${src.split('/').pop()}`);
                return this._textureCache.get(src);
            }

            // Check if already in PIXI cache - if so, just return it (unless it's destroyed)
            const cachedTexture = PIXI.utils.TextureCache[src];
            if (cachedTexture && cachedTexture.baseTexture && cachedTexture.baseTexture.valid) {
                // console.log(`Map Shine | Texture already loaded (using existing): ${src.split('/').pop()}`);
                return cachedTexture;
            }

            // NEW APPROACH: Force a clean load with downsampling
            const fullTexture = await foundry.canvas.loadTexture(src, { ...options, cacheAsBitmap: false });
            
            // CRITICAL: Foundry caches textures under MULTIPLE keys (full URL + relative path)
            // We need to find and delete ALL cache entries for this texture
            const baseTexture = fullTexture.baseTexture;
            const cacheIds = baseTexture.textureCacheIds || [];
            
            // Create downsampled version FIRST, while original is still valid
            const scaledTexture = this._downsampleTexture(fullTexture, 0.5, src);
            
            // Remove ALL cache entries pointing to the full-size texture
            for (const cacheId of cacheIds) {
                delete PIXI.utils.TextureCache[cacheId];
                delete PIXI.utils.BaseTextureCache[cacheId];
            }
            
            // Add the downsampled version to cache under ALL the original keys
            for (const cacheId of cacheIds) {
                PIXI.utils.TextureCache[cacheId] = scaledTexture;
                PIXI.utils.BaseTextureCache[cacheId] = scaledTexture.baseTexture;
            }
            
            // Also add to our internal cache
            this._textureCache.set(src, scaledTexture);
            
            // DON'T destroy the original - let it be garbage collected naturally
            // Destroying it breaks references that may have been created during downsampling
            // The memory will be freed when nothing references it anymore
            
            console.log(`Map Shine | Loaded & downsampled texture (-> ${scaledTexture.width}x${scaledTexture.height}) with ${cacheIds.length} cache keys: ${src.split('/').pop()}`);
            
            // Report progress to loading manager
            await this.reportOptimizationProgress();
            
            return scaledTexture;
        }
        
        // Use Foundry's native texture loading for non-suffixed textures
        return foundry.canvas.loadTexture(src, options);
    }

    /**
     * Downsample a texture by rendering it at a smaller size
     * @param {PIXI.Texture} texture - Original texture
     * @param {number} scale - Scale factor (e.g., 0.5 for half size)
     * @param {string} src - Source path for debugging
     * @returns {PIXI.Texture} Downsampled texture
     */
    static _downsampleTexture(texture, scale, src) {
        const renderer = canvas.app?.renderer;
        if (!renderer) {
            console.warn(`Map Shine | No renderer available for downsampling: ${src}`);
            return texture;
        }

        // Use baseTexture dimensions (actual texture size) not texture.width (which might be cropped)
        const baseWidth = texture.baseTexture.width;
        const baseHeight = texture.baseTexture.height;
        
        const newWidth = Math.max(1, Math.floor(baseWidth * scale));
        const newHeight = Math.max(1, Math.floor(baseHeight * scale));

        // Create a RenderTexture at the smaller size
        const renderTexture = PIXI.RenderTexture.create({
            width: newWidth,
            height: newHeight,
            resolution: 1
        });

        // Create a sprite from the FULL baseTexture (not the cropped texture)
        const sprite = new PIXI.Sprite(texture);
        sprite.width = newWidth;
        sprite.height = newHeight;

        // Render the scaled sprite to the RenderTexture
        renderer.render(sprite, { renderTexture });

        // Clean up the temporary sprite
        sprite.destroy();

        // Create a new Texture from the RenderTexture
        // CRITICAL: Preserve the original texture's frame/trim information scaled down
        const resultTexture = new PIXI.Texture(renderTexture.baseTexture);
        
        // If the original texture had a frame (cropped region), scale it proportionally
        if (texture.frame && (texture.frame.x !== 0 || texture.frame.y !== 0 || 
            texture.frame.width !== baseWidth || texture.frame.height !== baseHeight)) {
            
            resultTexture.frame = new PIXI.Rectangle(
                Math.floor(texture.frame.x * scale),
                Math.floor(texture.frame.y * scale),
                Math.floor(texture.frame.width * scale),
                Math.floor(texture.frame.height * scale)
            );
            
            console.log(`Map Shine | Preserved scaled frame: ${texture.frame.width}x${texture.frame.height} -> ${resultTexture.frame.width}x${resultTexture.frame.height}`);
        }

        return resultTexture;
    }

    /**
     * Check if a texture path should be downscaled
     * @param {string} src - Texture path
     * @returns {boolean}
     */
    static shouldDownscale(src) {
        return this.DOWNSCALE_SUFFIXES.some(suffix => src.includes(suffix));
    }

    /**
     * Initialize optimization progress tracking
     * @param {number} total - Total number of textures to optimize
     */
    static startOptimizationTracking(total) {
        this._optimizationStats.total = total;
        this._optimizationStats.completed = 0;
    }

    /**
     * Report progress for a completed optimization
     */
    static async reportOptimizationProgress() {
        this._optimizationStats.completed++;
        
        const progress = this._optimizationStats.completed / this._optimizationStats.total;
        const loadingManager = game.mapShine?.loadingManager;
        
        if (loadingManager) {
            const startWaypoint = loadingManager.waypoints.TEXTURE_OPTIMIZATION_START;
            const endWaypoint = loadingManager.waypoints.TEXTURE_OPTIMIZATION_END;
            const currentWaypoint = startWaypoint + (progress * (endWaypoint - startWaypoint));
            
            await loadingManager.updateProgress(currentWaypoint, 
                `Optimizing textures... (${this._optimizationStats.completed}/${this._optimizationStats.total})`);
        }
    }

    /**
     * Clear the texture cache (useful when changing scenes)
     */
    static clearCache() {
        for (const [src, texture] of this._textureCache.entries()) {
            // Remove from PIXI's cache before destroying to prevent returning destroyed textures
            const baseTexture = texture.baseTexture;
            if (baseTexture && baseTexture.textureCacheIds) {
                for (const cacheId of baseTexture.textureCacheIds) {
                    delete PIXI.utils.TextureCache[cacheId];
                    delete PIXI.utils.BaseTextureCache[cacheId];
                }
            }
            
            // Now safe to destroy
            texture.destroy(true);
        }
        this._textureCache.clear();
        this._optimizationStats = { total: 0, completed: 0 };
        console.log("Map Shine | Texture cache cleared");
    }
}
