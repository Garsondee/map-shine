/**
 * Memory profiling utility for tracking PIXI resource usage
 */
import { PIXI } from "../pixi-adapter.js";

export class MemoryProfiler {
    /**
     * Collect comprehensive memory statistics
     * @returns {Object} Memory statistics object
     */
    static collectStats() {
        const stats = {
            timestamp: Date.now(),
            textures: this._collectTextureStats(),
            renderTextures: this._collectRenderTextureStats(),
            sprites: this._collectSpriteStats(),
            filters: this._collectFilterStats(),
            graphics: this._collectGraphicsStats(),
            summary: {}
        };

        // Calculate summary
        stats.summary = {
            totalTextures: stats.textures.total,
            totalRenderTextures: stats.renderTextures.total,
            totalSprites: stats.sprites.total,
            totalFilters: stats.filters.total,
            totalGraphics: stats.graphics.total,
            estimatedVRAM: this._estimateVRAM(stats)
        };

        return stats;
    }

    /**
     * Collect texture statistics
     * @private
     */
    static _collectTextureStats() {
        const textureManager = PIXI.utils.TextureCache;
        const textures = Object.values(textureManager);
        
        let totalMemory = 0;
        let totalCount = 0;
        const formats = {};
        const sizes = {};

        textures.forEach(texture => {
            if (!texture || !texture.baseTexture) return;
            
            totalCount++;
            const baseTexture = texture.baseTexture;
            const width = baseTexture.width || 0;
            const height = baseTexture.height || 0;
            const format = this._getTextureFormat(baseTexture);
            
            // Estimate memory (width * height * bytes per pixel)
            const bytesPerPixel = this._getBytesPerPixel(baseTexture);
            const memory = width * height * bytesPerPixel;
            totalMemory += memory;

            // Track formats
            formats[format] = (formats[format] || 0) + 1;

            // Track size categories
            const sizeKey = `${width}x${height}`;
            sizes[sizeKey] = (sizes[sizeKey] || 0) + 1;
        });

        return {
            total: totalCount,
            totalMemoryMB: (totalMemory / (1024 * 1024)).toFixed(2),
            formats,
            sizes
        };
    }

    /**
     * Collect RenderTexture statistics
     * @private
     */
    static _collectRenderTextureStats() {
        let totalCount = 0;
        let totalMemory = 0;
        const types = {};
        const resolutions = {};

        // Scan through texture cache for RenderTextures
        const textureManager = PIXI.utils.TextureCache;
        Object.values(textureManager).forEach(texture => {
            if (!texture || !texture.baseTexture) return;
            
            const baseTexture = texture.baseTexture;
            if (baseTexture.resource && baseTexture.resource.constructor.name === 'CanvasResource') {
                totalCount++;
                
                const width = baseTexture.width || 0;
                const height = baseTexture.height || 0;
                const type = this._getTextureType(baseTexture);
                const bytesPerPixel = this._getBytesPerPixel(baseTexture);
                const memory = width * height * bytesPerPixel;
                
                totalMemory += memory;
                types[type] = (types[type] || 0) + 1;
                resolutions[`${width}x${height}`] = (resolutions[`${width}x${height}`] || 0) + 1;
            }
        });

        return {
            total: totalCount,
            totalMemoryMB: (totalMemory / (1024 * 1024)).toFixed(2),
            types,
            resolutions
        };
    }

    /**
     * Collect sprite statistics
     * @private
     */
    static _collectSpriteStats() {
        let totalCount = 0;
        
        // Count sprites in the current canvas
        if (canvas?.app?.stage) {
            totalCount = this._countDisplayObjects(canvas.app.stage, PIXI.Sprite);
        }

        return {
            total: totalCount
        };
    }

    /**
     * Collect filter statistics
     * @private
     */
    static _collectFilterStats() {
        let totalCount = 0;
        const filterTypes = {};
        
        // Count filters in the current canvas
        if (canvas?.app?.stage) {
            this._traverseDisplayObjects(canvas.app.stage, (obj) => {
                if (obj.filters && obj.filters.length > 0) {
                    obj.filters.forEach(filter => {
                        totalCount++;
                        const filterName = filter.constructor.name;
                        filterTypes[filterName] = (filterTypes[filterName] || 0) + 1;
                    });
                }
            });
        }

        return {
            total: totalCount,
            types: filterTypes
        };
    }

    /**
     * Collect graphics statistics
     * @private
     */
    static _collectGraphicsStats() {
        let totalCount = 0;
        
        // Count Graphics objects in the current canvas
        if (canvas?.app?.stage) {
            totalCount = this._countDisplayObjects(canvas.app.stage, PIXI.Graphics);
        }

        return {
            total: totalCount
        };
    }

    /**
     * Count display objects of a specific type
     * @private
     */
    static _countDisplayObjects(container, type) {
        let count = 0;
        
        this._traverseDisplayObjects(container, (obj) => {
            if (obj instanceof type) {
                count++;
            }
        });
        
        return count;
    }

    /**
     * Traverse display object tree
     * @private
     */
    static _traverseDisplayObjects(obj, callback) {
        if (!obj) return;
        
        callback(obj);
        
        if (obj.children && obj.children.length > 0) {
            obj.children.forEach(child => {
                this._traverseDisplayObjects(child, callback);
            });
        }
    }

    /**
     * Get texture format string
     * @private
     */
    static _getTextureFormat(baseTexture) {
        if (!baseTexture) return 'unknown';
        if (baseTexture.format === PIXI.FORMATS.RGBA) return 'RGBA';
        if (baseTexture.format === PIXI.FORMATS.RGB) return 'RGB';
        return baseTexture.format || 'unknown';
    }

    /**
     * Get texture type string
     * @private
     */
    static _getTextureType(baseTexture) {
        if (!baseTexture) return 'unknown';
        if (baseTexture.type === PIXI.TYPES.FLOAT) return 'FLOAT';
        if (baseTexture.type === PIXI.TYPES.UNSIGNED_BYTE) return 'UNSIGNED_BYTE';
        return baseTexture.type || 'unknown';
    }

    /**
     * Get bytes per pixel based on texture type
     * @private
     */
    static _getBytesPerPixel(baseTexture) {
        if (!baseTexture) return 4;
        
        const type = baseTexture.type;
        const format = baseTexture.format;
        
        let components = 4; // Default RGBA
        if (format === PIXI.FORMATS.RGB) components = 3;
        if (format === PIXI.FORMATS.LUMINANCE) components = 1;
        
        let bytesPerComponent = 1; // UNSIGNED_BYTE
        if (type === PIXI.TYPES.FLOAT) bytesPerComponent = 4;
        if (type === PIXI.TYPES.HALF_FLOAT) bytesPerComponent = 2;
        
        return components * bytesPerComponent;
    }

    /**
     * Estimate total VRAM usage
     * @private
     */
    static _estimateVRAM(stats) {
        const textureMemory = parseFloat(stats.textures.totalMemoryMB);
        const renderTextureMemory = parseFloat(stats.renderTextures.totalMemoryMB);
        const totalMB = textureMemory + renderTextureMemory;
        
        return `${totalMB.toFixed(2)} MB`;
    }

    /**
     * Print formatted stats to console
     */
    static printStats() {
        const stats = this.collectStats();
        
        console.group('%c🔍 MapShine Memory Profile', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
        
        console.group('📊 Summary');
        console.log('%cEstimated VRAM Usage:', 'font-weight: bold;', stats.summary.estimatedVRAM);
        console.log('%cTotal Textures:', 'font-weight: bold;', stats.summary.totalTextures);
        console.log('%cTotal RenderTextures:', 'font-weight: bold;', stats.summary.totalRenderTextures);
        console.log('%cTotal Sprites:', 'font-weight: bold;', stats.summary.totalSprites);
        console.log('%cTotal Filters:', 'font-weight: bold;', stats.summary.totalFilters);
        console.log('%cTotal Graphics:', 'font-weight: bold;', stats.summary.totalGraphics);
        console.groupEnd();
        
        console.group('🖼️ Textures');
        console.log('%cCount:', 'font-weight: bold;', stats.textures.total);
        console.log('%cMemory:', 'font-weight: bold;', stats.textures.totalMemoryMB + ' MB');
        console.log('%cFormats:', 'font-weight: bold;', stats.textures.formats);
        console.log('%cSizes:', 'font-weight: bold;', stats.textures.sizes);
        console.groupEnd();
        
        console.group('🎨 RenderTextures');
        console.log('%cCount:', 'font-weight: bold;', stats.renderTextures.total);
        console.log('%cMemory:', 'font-weight: bold;', stats.renderTextures.totalMemoryMB + ' MB');
        console.log('%cTypes:', 'font-weight: bold;', stats.renderTextures.types);
        console.log('%cResolutions:', 'font-weight: bold;', stats.renderTextures.resolutions);
        console.groupEnd();
        
        console.group('🎭 Filters');
        console.log('%cCount:', 'font-weight: bold;', stats.filters.total);
        console.log('%cTypes:', 'font-weight: bold;', stats.filters.types);
        console.groupEnd();
        
        console.groupEnd();
        
        return stats;
    }

    /**
     * List all loaded textures with their paths and sizes
     */
    static listTextures() {
        const textureManager = PIXI.utils.TextureCache;
        const textures = [];
        
        for (const [path, texture] of Object.entries(textureManager)) {
            if (!texture || !texture.baseTexture) continue;
            
            const baseTexture = texture.baseTexture;
            const width = baseTexture.width || 0;
            const height = baseTexture.height || 0;
            const bytesPerPixel = this._getBytesPerPixel(baseTexture);
            const memoryMB = (width * height * bytesPerPixel) / (1024 * 1024);
            
            textures.push({
                path,
                size: `${width}x${height}`,
                memoryMB: memoryMB.toFixed(2),
                isRenderTexture: baseTexture.resource?.constructor.name === 'CanvasResource'
            });
        }
        
        // Sort by memory usage (descending)
        textures.sort((a, b) => parseFloat(b.memoryMB) - parseFloat(a.memoryMB));
        
        console.group('%c📋 All Loaded Textures', 'color: #2196F3; font-weight: bold;');
        textures.forEach(tex => {
            console.log(`${tex.memoryMB}MB - ${tex.size} - ${tex.path}${tex.isRenderTexture ? ' (RenderTexture)' : ''}`);
        });
        console.groupEnd();
        
        return textures;
    }

    /**
     * Verify downsampled textures are properly connected
     */
    static verifyDownsampledTextures() {
        const suffixes = ['_Specular', '_Ambient', '_Iridescence', '_GroundGlow', '_Heat', '_Fire',
            '_Sparks', '_Dust', '_Outdoors', '_Canopy', '_Structural', '_Prism',
            '_Water', '_Caustics', '_Shoreline', '_Steam', '_Normal', '_Roughness'];
        
        const textureManager = PIXI.utils.TextureCache;
        const downsampled = [];
        const fullSize = [];
        
        for (const [path, texture] of Object.entries(textureManager)) {
            if (!texture || !texture.baseTexture) continue;
            
            const matchesSuffix = suffixes.some(suffix => path.includes(suffix));
            if (!matchesSuffix) continue;
            
            const baseTexture = texture.baseTexture;
            const width = baseTexture.width || 0;
            const height = baseTexture.height || 0;
            const isRenderTexture = baseTexture.resource?.constructor.name === 'CanvasResource';
            const memoryMB = (width * height * this._getBytesPerPixel(baseTexture)) / (1024 * 1024);
            
            const info = {
                path: path.split('/').pop(),
                size: `${width}x${height}`,
                memoryMB: memoryMB.toFixed(2),
                isRenderTexture
            };
            
            if (isRenderTexture) {
                downsampled.push(info);
            } else {
                fullSize.push(info);
            }
        }
        
        console.group('%c🔬 Downsampled Texture Verification', 'color: #FF9800; font-weight: bold;');
        console.log(`%c✅ Downsampled (RenderTextures): ${downsampled.length}`, 'color: #4CAF50; font-weight: bold;');
        downsampled.forEach(tex => {
            console.log(`  ${tex.memoryMB}MB - ${tex.size} - ${tex.path}`);
        });
        
        console.log(`%c⚠️ Full-size (Original): ${fullSize.length}`, 'color: #F44336; font-weight: bold;');
        fullSize.forEach(tex => {
            console.log(`  ${tex.memoryMB}MB - ${tex.size} - ${tex.path}`);
        });
        
        const totalDownsampledMB = downsampled.reduce((sum, t) => sum + parseFloat(t.memoryMB), 0);
        const totalFullSizeMB = fullSize.reduce((sum, t) => sum + parseFloat(t.memoryMB), 0);
        
        console.log(`%c📊 Total Memory:`, 'font-weight: bold;');
        console.log(`  Downsampled: ${totalDownsampledMB.toFixed(2)} MB`);
        console.log(`  Full-size: ${totalFullSizeMB.toFixed(2)} MB`);
        console.log(`  Combined: ${(totalDownsampledMB + totalFullSizeMB).toFixed(2)} MB`);
        
        console.groupEnd();
        
        return { downsampled, fullSize };
    }

    /**
     * Compare two stat snapshots
     */
    static compareStats(before, after) {
        const diff = {
            textures: {
                count: after.textures.total - before.textures.total,
                memory: (parseFloat(after.textures.totalMemoryMB) - parseFloat(before.textures.totalMemoryMB)).toFixed(2)
            },
            renderTextures: {
                count: after.renderTextures.total - before.renderTextures.total,
                memory: (parseFloat(after.renderTextures.totalMemoryMB) - parseFloat(before.renderTextures.totalMemoryMB)).toFixed(2)
            },
            sprites: {
                count: after.sprites.total - before.sprites.total
            },
            filters: {
                count: after.filters.total - before.filters.total
            },
            graphics: {
                count: after.graphics.total - before.graphics.total
            }
        };

        console.group('%c📊 Memory Profile Comparison', 'color: #FF9800; font-weight: bold; font-size: 14px;');
        
        console.log('%cTextures:', 'font-weight: bold;', 
            diff.textures.count >= 0 ? `+${diff.textures.count}` : diff.textures.count,
            `(${parseFloat(diff.textures.memory) >= 0 ? '+' : ''}${diff.textures.memory} MB)`);
        
        console.log('%cRenderTextures:', 'font-weight: bold;', 
            diff.renderTextures.count >= 0 ? `+${diff.renderTextures.count}` : diff.renderTextures.count,
            `(${parseFloat(diff.renderTextures.memory) >= 0 ? '+' : ''}${diff.renderTextures.memory} MB)`);
        
        console.log('%cSprites:', 'font-weight: bold;', 
            diff.sprites.count >= 0 ? `+${diff.sprites.count}` : diff.sprites.count);
        
        console.log('%cFilters:', 'font-weight: bold;', 
            diff.filters.count >= 0 ? `+${diff.filters.count}` : diff.filters.count);
        
        console.log('%cGraphics:', 'font-weight: bold;', 
            diff.graphics.count >= 0 ? `+${diff.graphics.count}` : diff.graphics.count);
        
        console.groupEnd();
        
        return diff;
    }

    /**
     * Start continuous monitoring
     */
    static startMonitoring(intervalMs = 5000) {
        if (this._monitoringInterval) {
            console.warn('Memory monitoring already running');
            return;
        }

        console.log(`%c🔄 Started memory monitoring (${intervalMs}ms interval)`, 'color: #2196F3; font-weight: bold;');
        this._lastStats = this.collectStats();
        
        this._monitoringInterval = setInterval(() => {
            const current = this.collectStats();
            this.compareStats(this._lastStats, current);
            this._lastStats = current;
        }, intervalMs);
    }

    /**
     * Stop continuous monitoring
     */
    static stopMonitoring() {
        if (this._monitoringInterval) {
            clearInterval(this._monitoringInterval);
            this._monitoringInterval = null;
            console.log('%c⏹️ Stopped memory monitoring', 'color: #F44336; font-weight: bold;');
        }
    }
}

// Make available globally for console access
// @ts-ignore
window.MapShineMemoryProfiler = MemoryProfiler;
