/**
 * Texture loading utility with automatic resolution downscaling for _Suffixed textures
 */
export class TextureLoader {
    /**
     * Suffixed texture patterns that should be loaded at half resolution
     */
    static DOWNSCALE_SUFFIXES = [
        "_Specular", "_Ambient", "_Iridescence", "_GroundGlow", "_Heat", "_Fire",
        "_Sparks", "_Dust", "_Outdoors", "_Canopy", "_Bush", "_Tree", "_Structural", "_Prism",
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
     * @returns {Promise<PIXI.Texture|PIXI.Spritesheet>}
     */
    static async loadTexture(src, options = {}) {
        // Check if this is a _Suffixed texture (not the background)
        const isSuffixedTexture = this.DOWNSCALE_SUFFIXES.some(suffix => src.includes(suffix));
        
        if (isSuffixedTexture) {
            // Check our cache FIRST (before PIXI cache) to ensure we return downscaled version
            if (this._textureCache.has(src)) {
                const cached = this._textureCache.get(src);
                // Update Foundry's access time for TTL tracking
                // Note: Foundry's setCache expects BaseTexture or Spritesheet, not Texture
                if (foundry.canvas.TextureLoader?.loader?.setCache && cached.baseTexture) {
                    foundry.canvas.TextureLoader.loader.setCache(src, cached.baseTexture);
                }
                return cached;
            }

            // Check if already in PIXI cache (might be a downscaled version from previous load)
            const cachedTexture = PIXI.utils.TextureCache[src];
            if (cachedTexture && cachedTexture.baseTexture && cachedTexture.baseTexture.valid) {
                // Verify it's actually downscaled by checking our internal cache
                // If it's in PIXI but not our cache, it might be the full-size version
                this._textureCache.set(src, cachedTexture);
                return cachedTexture;
            }

            // Load full texture from Foundry (can return Texture or Spritesheet)
            let fullAsset;
            try {
                fullAsset = await foundry.canvas.loadTexture(src, { ...options, cacheAsBitmap: false });
            } catch (err) {
                console.warn(`Map Shine | Texture load failed (file may not exist): ${src.split('/').pop()}`, err.message);
                return PIXI.Texture.EMPTY;
            }
            
            // Handle spritesheet case (extract base texture as a Texture)
            let fullTexture;
            if (fullAsset instanceof PIXI.Spritesheet) {
                fullTexture = new PIXI.Texture(fullAsset.baseTexture);
            } else {
                fullTexture = fullAsset;
            }
            
            // Validate the loaded texture
            if (!fullTexture || !fullTexture.baseTexture || !fullTexture.baseTexture.valid) {
                console.warn(`Map Shine | Texture invalid or not found (this is normal if the file doesn't exist): ${src.split('/').pop()}`);
                return PIXI.Texture.EMPTY;
            }
            
            // Get all cache keys for this texture
            const baseTexture = fullTexture.baseTexture;
            const cacheIds = baseTexture.textureCacheIds || [];
            
            // Create downsampled version
            const scaledTexture = this._downsampleTexture(fullTexture, 0.5, src);
            
            // Validate downsampled texture
            if (!scaledTexture || !scaledTexture.baseTexture || !scaledTexture.baseTexture.valid) {
                console.error(`Map Shine | Downsampling failed for: ${src}`);
                return fullTexture; // Return original as fallback
            }
            
            // Remove full-size texture from PIXI cache
            for (const cacheId of cacheIds) {
                delete PIXI.utils.TextureCache[cacheId];
                delete PIXI.utils.BaseTextureCache[cacheId];
            }
            
            // Add downsampled version to PIXI cache under all keys
            for (const cacheId of cacheIds) {
                PIXI.utils.TextureCache[cacheId] = scaledTexture;
                PIXI.utils.BaseTextureCache[cacheId] = scaledTexture.baseTexture;
            }
            
            // Add to our internal cache
            this._textureCache.set(src, scaledTexture);
            
            // ✅ P1: Register with Foundry's memory tracking system
            // This makes the downscaled texture visible to Foundry's TTL-based expiration
            // and memory-limit-based eviction systems
            // Note: Foundry's setCache expects BaseTexture or Spritesheet, not Texture
            if (foundry.canvas.TextureLoader?.loader?.setCache) {
                foundry.canvas.TextureLoader.loader.setCache(src, scaledTexture.baseTexture);
            }
            
            // Clean up the full-size texture wrapper (but NOT the baseTexture)
            // CRITICAL: We must NOT destroy the original baseTexture because:
            // 1. Foundry's PlaceableObjects (Tiles, etc.) may still reference it
            // 2. Destroying baseTexture nullifies its .resource property
            // 3. This causes "can't access property 'source', resource is null" errors during Foundry's teardown
            // 4. Only Foundry should destroy baseTextures it loaded
            try {
                fullTexture.destroy(false); // Don't destroy baseTexture - only the Texture wrapper
            } catch (err) {
                console.warn(`Map Shine | Error destroying full texture wrapper: ${err.message}`);
            }
            
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
        
        if (loadingManager?.screen?.setProgress) {
            const startWaypoint = loadingManager.waypoints.TEXTURE_OPTIMIZATION_START;
            const endWaypoint = loadingManager.waypoints.TEXTURE_OPTIMIZATION_END;
            const currentWaypoint = startWaypoint + (progress * (endWaypoint - startWaypoint));
            
            loadingManager.screen.setProgress(currentWaypoint, 
                `Optimizing textures... (${this._optimizationStats.completed}/${this._optimizationStats.total})`);
            
            // Yield to event loop to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    /**
     * Clear the texture cache (useful when changing scenes)
     */
    static clearCache() {
        let clearedCount = 0;
        
        for (const [src, texture] of this._textureCache.entries()) {
            // Skip if texture is already destroyed
            if (!texture || texture.destroyed) {
                continue;
            }
            
            // Remove from PIXI's cache before destroying to prevent returning destroyed textures
            const baseTexture = texture.baseTexture;
            if (baseTexture && baseTexture.textureCacheIds) {
                for (const cacheId of baseTexture.textureCacheIds) {
                    delete PIXI.utils.TextureCache[cacheId];
                    delete PIXI.utils.BaseTextureCache[cacheId];
                }
            }
            
            // ✅ P1: Let Foundry know we're unloading this texture
            // This allows Foundry to clean up its internal tracking
            // Note: We don't use PIXI.Assets.unload() because it's async and might
            // interfere with scene transitions. Manual cleanup is safer here.
            
            // Now safe to destroy
            try {
                texture.destroy(true);
                clearedCount++;
            } catch (err) {
                console.warn(`Map Shine | Error destroying cached texture ${src}: ${err.message}`);
            }
        }
        
        this._textureCache.clear();
        this._optimizationStats = { total: 0, completed: 0 };
        
        if (clearedCount > 0) {
            console.log(`Map Shine | Texture cache cleared (${clearedCount} textures destroyed)`);
        }
    }
}
