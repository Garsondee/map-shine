
export class TextureAutoLoader {
  static SUFFIX_MAP = {
    specular: "_Specular",
    ambient: "_Ambient",
    iridescence: "_Iridescence",
    groundGlow: "_GroundGlow",
    heat: "_Heat",
    fire: "_Fire",
    sparks: "_Sparks",
    dust: "_Dust",
    outdoors: "_Outdoors",
    canopy: "_Canopy",
    bush: "_Bush",
    tree: "_Tree",
    structural: "_Structural",
    prism: "_Prism",
    water: "_Water",
    caustics: "_Caustics",
    shoreline: "_Shoreline",
    puddle: "_Puddle",
    noWater: "_NoWater",
    steam: "_Steam",
  };

  // Cache for FilePicker.browse results to avoid redundant network requests
  // Key: directory path, Value: array of file paths
  static _directoryCache = new Map();

  // Cache statistics for performance monitoring
  static _cacheStats = { hits: 0, misses: 0 };

  /**
   * Clears the directory cache. Should be called when the scene changes
   * or when file system changes are expected.
   */
  static clearDirectoryCache() {
    TextureAutoLoader._directoryCache.clear();
    TextureAutoLoader._cacheStats = { hits: 0, misses: 0 };
  }

  /**
   * Gets cache statistics for performance monitoring.
   * @returns {Object} Object with hits and misses counts
   */
  static getCacheStats() {
    return { ...TextureAutoLoader._cacheStats };
  }

  async discoverAllTargets() {
    // Clear cache at the start of discovery to ensure fresh results for the current scene
    TextureAutoLoader.clearDirectoryCache();

    const results = {
      background: null,
      tiles: new Map(),
    };
    const backgroundTarget = await this._processSceneBackground();
    if (backgroundTarget) {
      results.background = backgroundTarget;
    }
    for (const tile of canvas.tiles.placeables) {
      const tileTarget = await this._processTile(tile);
      if (tileTarget) {
        results.tiles.set(tile.id, tileTarget);
      }
    }

    // Log cache performance statistics
    const stats = TextureAutoLoader.getCacheStats();
    const totalRequests = stats.hits + stats.misses;
    if (totalRequests > 0) {
      const hitRate = ((stats.hits / totalRequests) * 100).toFixed(1);
      // console.log(
      //   `Map Shine | Directory Cache Performance: ${stats.hits} hits, ${stats.misses} misses ` +
      //   `(${hitRate}% hit rate, avoided ${stats.hits} redundant network requests)`
      // );
    }

    // console.log("MapShine | Full Texture Discovery Results:", results);
    return results;
  }

  async _processSceneBackground() {
    const bgSrc = canvas.scene?.background.src;
    if (!bgSrc) {
      // No background texture - this is normal for some scenes
      return null;
    }
    const targetData = await this._findSuffixesForBaseTexture(bgSrc);

    targetData.baseTexturePath = bgSrc;
    targetData.rect = canvas.scene.dimensions.sceneRect;
    return targetData;
  }

  async _processTile(tile) {
    const tileSrc = tile.document.texture.src;
    if (!tileSrc) return null;

    const suffixData = await this._findSuffixesForBaseTexture(tileSrc);

    const hasEffectMap = Object.values(suffixData).some(
      (path) => path && typeof path === "string"
    );

    if (hasEffectMap) {
      return {
        tile,
        baseTexturePath: tileSrc,
        rect: {
          x: tile.document.x,
          y: tile.document.y,
          width: tile.document.width,
          height: tile.document.height,
          rotation: tile.document.rotation * (Math.PI / 180),
        },
        ...suffixData,
      };
    }
    return null;
  }

  async _findSuffixesForBaseTexture(baseTexturePath) {
    const discoveredPaths = {};
    Object.keys(TextureAutoLoader.SUFFIX_MAP).forEach(
      (key) => (discoveredPaths[key] = null)
    );

    // --- DIAGNOSTIC LOGGING ---
    const isWaterTile = baseTexturePath.toLowerCase().includes("water");
    // if (isWaterTile) {
    //   console.log(
    //     `--- Map Shine | DIAGNOSTIC: Auto-discovery for water-related tile ---`
    //   );
    //   console.log(`Base Texture Path: ${baseTexturePath}`);
    // }
    const lastSlash = baseTexturePath.lastIndexOf("/");
    if (lastSlash === -1) return discoveredPaths;

    const directoryPath = baseTexturePath.substring(0, lastSlash);
    const filename = baseTexturePath.substring(lastSlash + 1);

    let decodedFilename;
    try {
      decodedFilename = decodeURI(filename);
    } catch {
      decodedFilename = filename;
    }

    const lastDot = decodedFilename.lastIndexOf(".");
    if (lastDot === -1) return discoveredPaths;

    const baseName = decodedFilename.substring(0, lastDot);
    const extension = decodedFilename.substring(lastDot);

    // if (isWaterTile) {
    //   console.log(`Parsed Directory: ${directoryPath}`);
    //   console.log(`Parsed Base Name: ${baseName}`);
    //   console.log(`Parsed Extension: ${extension}`);
    // }
    if (!baseName || !directoryPath) return discoveredPaths;

    // Check cache first before making network request
    let filesInDir = TextureAutoLoader._directoryCache.get(directoryPath);

    if (!filesInDir) {
      // Cache miss - fetch from file system and cache the result
      TextureAutoLoader._cacheStats.misses++;
      try {
        const source = game.settings.get("core", "noCanvas")
          ? "public"
          : "data";
        filesInDir = (
          await foundry.applications.apps.FilePicker.implementation.browse(
            source,
            directoryPath
          )
        ).files;

        // Store in cache for future lookups
        TextureAutoLoader._directoryCache.set(directoryPath, filesInDir);

        // if (isWaterTile) {
        //   console.log(`Files found in directory (CACHE MISS):`, filesInDir);
        // }
      } catch {
        // Failed to browse directory
        return discoveredPaths;
      }
    } else {
      // Cache hit - using cached directory listing
      TextureAutoLoader._cacheStats.hits++;
      // if (isWaterTile) {
      //   console.log(`Files found in directory (CACHE HIT):`, filesInDir);
      // }
    }

    for (const [key, suffix] of Object.entries(TextureAutoLoader.SUFFIX_MAP)) {
      const expectedFilename = `${baseName}${suffix}${extension}`;

      // --- DIAGNOSTIC LOGGING for the shoreline ---
      // if (isWaterTile && key === "shoreline") {
      //   console.log(`Searching for key '${key}' with suffix '${suffix}'`);
      //   console.log(`Constructed Expected Filename: ${expectedFilename}`);
      // }
      const foundFile = filesInDir.find((fullPath) => {
        const fNameOnly = fullPath.substring(fullPath.lastIndexOf("/") + 1);
        let decodedFNameOnly;
        try {
          decodedFNameOnly = decodeURI(fNameOnly);
        } catch {
          decodedFNameOnly = fNameOnly;
        }
        return (
          decodedFNameOnly.toLowerCase() === expectedFilename.toLowerCase()
        );
      });

      if (foundFile) {
        // if (isWaterTile && key === "shoreline") {
        //   console.log(`SUCCESS: Found matching file path: ${foundFile}`);
        // }
        discoveredPaths[key] = foundFile;
      } else {
        // if (isWaterTile && key === "shoreline") {
        //   console.log(`FAILURE: No match found for '${expectedFilename}'.`);
        // }
      }
    }
    // if (isWaterTile) console.log(`--- END DIAGNOSTIC ---`);
    return discoveredPaths;
  }
}
