/**
 * ===================================================================================
 *  Map Shine - Advanced Material & Effects Toolkit for Foundry VTT
 * ===================================================================================
 *
 * @file This script is the core of the 'Map Shine' module. It provides a comprehensive
 * toolkit for map makers to add a wide range of advanced, real-time visual effects
 * to their scenes with minimal setup.
 *
 * @description
 * The module injects several custom canvas layers and a suite of PIXI.js filters
 * (shaders) to create dynamic and visually rich map experiences. Effects are
 * controlled through a powerful, real-time "Material Editor" UI, which includes
 * a robust diagnostic status system to help users identify and resolve issues
 * with textures, shaders, and effect pipelines. Configurations can be saved and
 * loaded as profiles, enabling easy reuse of complex looks across different scenes.
 *
 */

/**
 * ===================================================================================
 *                    RULES & BEST PRACTICES FOR FOUNDRY VTT / PIXI.JS MODULES
 *                          (Derived from the FX Master module)
 * ===================================================================================
 *
 * This document outlines the core principles and design patterns used in the FX Master module.
 * Following these 'rules' will help you build a clean, maintainable, and powerful visual effects
 * module for Foundry VTT.
 *
 *
 * // SECTION: GENERAL MODULE STRUCTURE & INITIALIZATION
 * //----------------------------------------------------
 *
 * * RULE: ORGANIZE CODE LOGICALLY.
 *   - Description: The codebase is broken down into directories and files based on functionality
 *     (e.g., `particle-effects/`, `filter-effects/`, `special-effects/`, `migration/`).
 *     Each class has its own file. This makes the project easy to navigate and maintain.
 *
 * * RULE: USE A CONSTANTS FILE.
 *   - Description: A `constants.js` file holds values like `packageId`. This prevents "magic strings"
 *     and makes it easy to update the module's ID in one place without breaking references.
 *
 * * RULE: LEVERAGE FOUNDRY'S INITIALIZATION HOOKS.
 *   - Description: Use the `Hooks.once("init", ...)` hook for setup tasks that must happen before
 *     the world is loaded. This includes registering settings, layers, and Handlebars helpers.
 *     Use `Hooks.on("ready", ...)` for tasks that require the game world to be fully loaded,
 *     such as running data migrations.
 *     Use `Hooks.on("canvasInit", ...)` and `Hooks.on("canvasReady", ...)` for tasks that
 *     depend on the canvas being constructed.
 *
 * * RULE: ISOLATE API AND CONFIGURATION.
 *   - Description: The module exposes a public API through `window.FXMASTER`. It also centralizes
 *     its configuration (effect definitions, etc.) into a `CONFIG.fxmaster` object. This creates a
 *     clear separation between internal logic and what other modules or macros can interact with.
 *
 *
 * // SECTION: FOUNDRY VTT & CANVAS INTEGRATION
 * //----------------------------------------------------
 *
 * * RULE: CREATE CUSTOM CANVAS LAYERS FOR EFFECTS.
 *   - Description: FX Master defines its own layers (`ParticleEffectsLayer`, `SpecialEffectsLayer`)
 *     by extending Foundry's base layer classes. This is the correct way to add new, independent
 *     drawing contexts to the canvas.
 *   - `SpecialEffectsLayer` extends `InteractionLayer` because it needs to handle mouse clicks and drags.
 *   - `ParticleEffectsLayer` extends `FullCanvasObjectMixin(CanvasLayer)`. This is a crucial pattern for
 *     **screen-space effects**. The mixin ensures the layer covers the entire canvas view and does not
 *     pan or zoom with the map, which is ideal for weather.
 *   - Use the static getter `layerOptions` to define the layer's `name` and, critically, its `zIndex`.
 *     A high `zIndex` (like 245 for `specials`) places the layer above most other canvas elements.
 *
 * * RULE: MANAGE THE LIFECYCLE OF LAYERS AND OBJECTS.
 *   - Description: Implement the `_draw()` and `_tearDown()` methods for your custom layers.
 *   - In `_draw()`, initialize and add your permanent PIXI objects (like the `ruler` Graphics object).
 *   - In `_tearDown()`, you MUST clean up everything you created. Destroy PIXI objects, remove
 *     children, and clear arrays to prevent memory leaks when switching scenes.
 *
 * * RULE: ADD UI CONTROLS VIA THE `getSceneControlButtons` HOOK.
 *   - Description: This is the standard, non-intrusive way to add a new set of tools to the
 *     left-hand toolbar. The module defines a new control group for "effects" with its own tools.
 *
 * * RULE: USE THE FOUNDRY ANIMATION ENGINE.
 *   - Description: For animating properties of PIXI objects (position, scale, rotation), use
 *     `CanvasAnimation.animate()`. It's a high-level, managed animation system that handles the
 *     ticker loop for you and allows for easy termination of animations by name. This is much
 *     cleaner than managing your own `requestAnimationFrame` or ticker functions for simple property tweens.
 *
 *
 * // SECTION: CREATING & PLACING PIXI.JS EFFECTS
 * //----------------------------------------------------
 *
 * This is the most critical part of an effects module. FX Master demonstrates three primary types of effects.
 *
 * --- 1. SPECIAL EFFECTS (VIDEO-BASED MESHES) ---
 *
 * * RULE: USE OFF-SCREEN HTML ELEMENTS AS TEXTURE SOURCES.
 *   - Description: The `playVideo` method demonstrates the core pattern for using videos (or images) as effects.
 *     1. `document.createElement("video")`: Create an HTML video element in memory. It's never added to the DOM.
 *     2. `video.src = ...`: Set its source to the desired `.webm` or other video file.
 *     3. `PIXI.Texture.from(video)`: This is the key step. PIXI can create a dynamic texture directly
 *        from an HTML video or image element. As the video plays, the texture updates automatically.
 *     4. `new SpecialEffectMesh(texture)`: Use this new texture to create a PIXI DisplayObject, like a
 *        Sprite or Mesh. FX Master uses a custom `SpecialEffectMesh` to add an `elevation` property.
 *
 * * RULE: PLACE EFFECTS IN THE CORRECT CANVAS CONTAINER FOR THE DESIRED SPACE.
 *   - Description: Where you add your PIXI object determines its behavior.
 *   - **World Space (Pans/Zooms with Map):** Add the object to `canvas.primary.addChild(mesh)`. This is done
 *     for Special Effects, so they appear at a specific point on the map and move with it.
 *   - **Screen Space (Static on Screen):** Add the object to a custom layer that uses the
 *     `FullCanvasObjectMixin` (like `ParticleEffectsLayer`). This is used for weather effects that should
 *     always cover the screen, regardless of camera position.
 *   - **Interface Space:** Add the object to your `InteractionLayer` (like `SpecialEffectsLayer`). This is
 *     used for the drag ruler, which is a UI element drawn over the world.
 *
 * * RULE: CLEAN UP YOUR PIXI OBJECTS.
 *   - Description: When an effect is finished (`onended` event for video), you must remove it from its
 *     parent container (`canvas.primary.removeChild(mesh)`) and destroy it (`mesh.destroy()`). Failing
 *     to do so will cause significant memory leaks and performance degradation over time.
 *
 * --- 2. PARTICLE EFFECTS (pixi-particles) ---
 *
 * * RULE: USE A PARTICLE EMITTER LIBRARY FOR COMPLEX SYSTEMS.
 *   - Description: FX Master uses `pixi-particles`, which is integrated into Foundry's core. It abstracts
 *     away the complexity of managing thousands of individual particles.
 *
 * * RULE: DEFINE EFFECTS AS CONFIGURATION-DRIVEN CLASSES.
 *   - Description: Each particle effect (e.g., `RainParticleEffect`, `EaglesParticleEffect`) is a class that
 *     extends a common base (`FXMasterParticleEffect`).
 *   - It defines a `static get defaultConfig()` which returns a `PIXI.particles.EmitterConfigV3` object. This
 *     config object describes the particle's lifetime, behaviors (movement, scaling, alpha fades), textures, etc.
 *   - The main logic is in `getParticleEmitters()`, which takes user options (density, speed), deep-clones the
 *     default config, modifies it with the options, and then creates an emitter from it. This is a very flexible
 *     and powerful pattern.
 *
 * * RULE: SEPARATE STATIC ASSETS FROM DYNAMIC BEHAVIOR.
 *   - Description: The `EaglesParticleEffect` demonstrates pre-loading and caching textures from a spritesheet.
 *     The `_textures` getter and `_textureCache` ensure the expensive work of parsing the spritesheet only
 *     happens once. The animation sequences (`_getAnimations`) then reference these cached textures.
 *
* --- 3. FILTER EFFECTS (SHADERS) ---
 *
 * * RULE: CREATE A CENTRAL MANAGER FOR FILTERS.
 *   - Description: The `FilterManager` is a singleton class responsible for the entire lifecycle of
 *     filter effects. It activates, updates, and clears filters based on scene flags. This prevents
 *     conflicts and ensures filters are applied and removed correctly.
 *
 * * RULE: EXTEND PIXI.Filter AND APPLY TO A TOP-LEVEL CONTAINER.
 *   - Description: Custom filters (e.g., `FogFilter`, `UnderwaterFilter`) extend a base PIXI filter class.
 *   - They are applied to a large container's `.filters` array. FX Master uses `canvas.environment`, which
 *     is designed for this purpose. This applies the filter to the entire scene background, tiles, and tokens.
 *
 * * RULE: USE THE TICKER FOR ANIMATED SHADERS.
 *   - Description: For filters that change over time (like fog, lightning), the `FilterManager` adds a function
 *     to `canvas.app.ticker`. This function calls a `step()` method on each active filter every frame.
 *   - The `step()` method is where you update the filter's `uniforms` (e.g., incrementing a `time` uniform)
 *     to create animation.
 *
 * * RULE: PROVIDE A NEUTRAL STATE FOR FILTERS.
 *   - Description: Each filter class defines a `static get neutral()` state. This is the set of parameters
 *     that effectively "disables" the filter's visual effect without removing it (e.g., `density: 0`).
 *     When stopping a filter with a fade-out, it animates to this neutral state before being removed.
 *
 *
 * // SECTION: NETWORKING & MULTIPLAYER
 * //----------------------------------------------------
 *
 * * RULE: USE SOCKETS FOR REAL-TIME SYNCHRONIZATION.
 *   - Description: The pattern is simple and effective:
 *     1. A user performs an action that creates an effect (e.g., clicks to cast a fireball).
 *     2. The client that initiated the action plays the effect locally INSTANTLY for responsiveness.
 *     3. That same client then calls `game.socket.emit("module.fxmaster", data)` to broadcast the
 *        effect's parameters (file, position, scale, etc.) to all other players.
 *     4. All clients (including the sender, though it's harmless) have a listener `game.socket.on("module.fxmaster", ...)`
 *        that receives this data and calls the same local `playVideo` function. The GM's client will execute the effect for all players, while individual players will see it for themselves.
 *
 *
 * // SECTION: DATA PERSISTENCE & MIGRATION
 * //----------------------------------------------------
 *
 * * RULE: USE FLAGS FOR SCENE-SPECIFIC DATA.
 *   - Description: Active particle and filter effects are stored as flags on the `Scene` document
 *     (`canvas.scene.setFlag(packageId, "effects", ...)`). This is the correct approach, as these
 *     effects are specific to that scene and should be re-activated when the scene is viewed.
 *
 * * RULE: USE SETTINGS FOR WORLD-WIDE CONFIGURATION.
 *   - Description: User-created "Special Effects" are stored in `game.settings`. This is because a
 *     user's library of custom effects should be available across all scenes in the world.
 *
 * * RULE: IMPLEMENT A ROBUST MIGRATION SYSTEM.
 *   - Description: FX Master has a `migration/` system. This is an advanced but critical feature for
 *     long-term stability. When you change the data structure of your flags or settings, a migration
 *     script can automatically update users' existing worlds to the new format. This prevents your
 *     module from breaking after an update.
 *
 */

/**
 * ===================================================================================
 *         TECHNIQUES FOR USING TEXTURES AS MASKS & MAPS IN FOUNDRY VTT
 *                   (Learned from the FX Master Module)
 * ===================================================================================
 *
 * This document outlines the key methods FX Master uses to leverage textures for
 * more than just simple images. These patterns are essential for creating effects
 * that are masked, influenced by data, or interact with the environment.
 *
 *
 * // --- TECHNIQUE 1: Texture as a Visibility Mask ---
 * // Used to control *where* an effect is visible.
 *
 *   * A. The Standard PIXI Mask (`.mask` Property)
 *     - Description: The classic approach. An effect container is made visible only where a
 *       separate PIXI object (the mask) has visible pixels.
 *     - Implementation: See `js/particle-effects/drawings-mask.js`.
 *       1. Create a `PIXI.LegacyGraphics` object.
 *       2. Check a flag on each `Drawing` to see if it's intended as a mask.
 *       3. Draw the shape of each flagged `Drawing` into the single `Graphics` object.
 *       4. Assign this `Graphics` object to a layer's `.mask` property.
 *     - Application: Ideal for user-defined zones, like creating a "no-rain" area under
 *       an awning by drawing a rectangle.
 *
 *   * B. Shader-Based Occlusion Mask (Advanced)
 *     - Description: A high-performance method where a texture is fed to a shader (a custom
 *       filter) which then calculates visibility for each pixel of the effect.
 *     - Implementation: See `js/particle-effects/particle-effects-layer.js`.
 *       1. A custom filter (`WeatherOcclusionMaskFilter`) is applied to the particle layer.
 *       2. This filter is given Foundry's `canvas.masks.depth.renderTexture` as a uniform.
 *          This special texture contains the scene's roof and wall geometry.
 *       3. The shader code reads from this "occlusion map" and makes weather pixels
 *          transparent if they are under a roof, allowing effects to go "behind" things.
 *     - Application: The best practice for making full-screen effects interact correctly
 *       with the existing Foundry VTT environment (walls, roofs, etc.).
 *
 *
 * // --- TECHNIQUE 2: Texture as a Data Map ---
 * // The texture's color data is used for calculations, not for direct display.
 *
 *   * A. Displacement Maps
 *     - Description: A texture's color values are used to warp or distort another image.
 *     - Implementation: See `js/filter-effects/effects/underwater.js`.
 *       1. A `PIXI.DisplacementFilter` is used.
 *       2. It is initialized with a texture (e.g., a black-and-white wave pattern).
 *       3. The filter uses the R/G values of this texture to shift the coordinates of the
 *          pixels of the scene it is applied to, creating a distortion effect.
 *     - Application: Essential for water ripples, heat haze, force fields, and any
 *       visual warping effect.
 *
 *   * B. Spritesheet Data Maps
 *     - Description: A single large image (a texture atlas) is paired with a data object
 *       that defines the location and size of individual frames within that image.
 *     - Implementation: See `js/particle-effects/effects/eagles.js`.
 *       1. A `.png` file contains all the animation frames for the eagle.
 *       2. A `spriteSheetData` object in the code acts as the "map," providing coordinates
 *          for each frame.
 *       3. A `new PIXI.Spritesheet()` is created, which uses this map to parse the single
 *          large texture into an array of smaller, usable textures for animation.
 *     - Application: The standard and most performant way to handle frame-by-frame
 *       animations, especially for particles, as it minimizes texture loads.
 *
 *
 * // --- TECHNIQUE 3: Texture as a Direct Visual Source ---
 * // The most straightforward use: providing the artwork for an effect.
 *
 *   * A. Sourcing Particle Art
 *     - Description: A texture is directly used as the image for spawned particles.
 *     - Implementation: See any particle effect file, like `js/particle-effects/effects/rain.js`.
 *       1. An emitter configuration object (e.g., `RAIN_CONFIG`) specifies a texture path
 *          via a `textureSingle` or `textureRandom` behavior.
 *       2. The particle emitter then creates every particle using that texture as its appearance.
 *     - Application: The fundamental method for defining what particles in an effect look like.
 *
 */
















// Definitions for PBR textures, used to build the status panel and find related files.
export const TEXTURE_DEFINITIONS = [
    { key: 'background', name: 'Background', tooltip: 'The base scene background texture.' },
    { key: 'specular', name: 'Specular', tooltip: 'Specular map for reflections.' },
    { key: 'normal', name: 'Normal', tooltip: 'Normal map for surface details.' },
    { key: 'ambient', name: 'Ambient', tooltip: 'Ambient Occlusion map for shadows.' },
    { key: 'iridescence', name: 'Iridescence', tooltip: 'Iridescence map for rainbow-like effects.' },
];

/**
 * A utility function to safely retrieve the DebugLayer from the canvas.
 * @returns {DebugLayer|null} The layer instance or null if not found.
 */
export function getDebugLayer() {
    // Find the layer by its registered option name to avoid circular dependency/scope issues.
    return canvas.layers.find(l => l.options.name === "debug-layer");
}

/**
 * A utility function to safely retrieve the CheckerboardLayer from the canvas.
 * @returns {CheckerboardLayer|null} The layer instance or null if not found.
 */
export function getCheckerboardLayer() {
    return canvas.layers.find(l => l.options.name === "checkerboard-layer");
}

// =======================================================
//  PROCEDURAL TEXTURE INFRASTRUCTURE
// =======================================================

/**
 * A PIXI.Filter that generates a tileable value noise pattern.
 * The 'period' uniform controls the frequency of the noise, making it tileable.
 */
class PeriodicNoiseFilter extends PIXI.Filter {
    constructor(options = {}) {
        const fragmentShader = `
            varying vec2 vTextureCoord;
            uniform float u_period;

            // 2D Random function
            float random (in vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            // 2D Periodic Noise
            float noise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                vec2 p = vec2(u_period);

                // Use modulo to wrap the grid coordinates, ensuring periodicity.
                float a = random(mod(i, p));
                float b = random(mod(i + vec2(1.0, 0.0), p));
                float c = random(mod(i + vec2(0.0, 1.0), p));
                float d = random(mod(i + vec2(1.0, 1.0), p));

                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
            }

            void main() {
                // Scale texture coordinates by the period to make the noise tileable
                vec2 st = vTextureCoord * u_period;
                float n = noise(st);
                gl_FragColor = vec4(vec3(n), 1.0);
            }
        `;

        super(null, fragmentShader, {
            u_period: options.period || 8.0, // Default period
        });
    }
}

/**
 * A singleton manager for defining, generating, and caching procedural textures.
 * This allows other parts of the module to request complex, generated textures by a simple key.
 */
class ProceduralTextureManager {
    constructor() {
        if (ProceduralTextureManager.instance) {
            return ProceduralTextureManager.instance;
        }
        this.cache = new Map();
        this.definitions = new Map();
        this._registerDefinitions();
        ProceduralTextureManager.instance = this;
    }

    /**
     * Registers all available procedural texture generators.
     * This is where new generators are added to make them available to the system.
     * @private
     */
    _registerDefinitions() {
        this.definitions.set('periodic_noise', {
            name: 'Periodic Noise',
            tooltip: 'A tileable value noise, useful for clouds or organic masks.',
            filterClass: PeriodicNoiseFilter,
        });
    }

    /**
     * Returns a list of all registered procedural texture definitions.
     * @returns {Array<{key: string, name: string, tooltip: string}>}
     */
    listDefinitions() {
        return Array.from(this.definitions.entries()).map(([key, value]) => ({
            key: key,
            name: value.name,
            tooltip: value.tooltip,
        }));
    }

    /**
     * Retrieves a procedural texture, generating and caching it if necessary.
     * @param {string} key - The key of the texture to retrieve (e.g., 'periodic_noise').
     * @param {object} [options={}] - Options to pass to the generator filter's constructor.
     * @returns {PIXI.RenderTexture|null}
     */
    get(key, options = {}) {
        // A more robust key could be JSON.stringify({key, options}) if options vary
        const cacheKey = key;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const definition = this.definitions.get(key);
        if (!definition) {
            console.warn(`Map Shine | No procedural texture definition found for key: ${key}`);
            return null;
        }

        const texture = this._generate(definition, options);
        if (texture) {
            this.cache.set(cacheKey, texture);
        }
        return texture;
    }

    /**
     * Internal method to generate a texture using a filter.
     * @param {object} definition - The texture definition object.
     * @param {object} options - Options for the filter.
     * @returns {PIXI.RenderTexture}
     * @private
     */
    _generate(definition, options) {
        const textureSize = 1024;
        const renderTexture = PIXI.RenderTexture.create({ width: textureSize, height: textureSize });
        const filter = new definition.filterClass(options);

        // We need a dummy sprite to apply the filter to.
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.width = textureSize;
        sprite.height = textureSize;
        sprite.filters = [filter];

        // Render the sprite with the filter to our target texture.
        canvas.app.renderer.render(sprite, { renderTexture });

        // Clean up the temporary sprite
        sprite.destroy();

        return renderTexture;
    }
}

// Instantiate the singleton manager for global use.
const proceduralTextureManager = new ProceduralTextureManager();


// =======================================================
//  CANVAS & UI CLASS DEFINITIONS
// =======================================================

/**
 * A canvas layer that renders a checkerboard pattern.
 */
class CheckerboardLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.checkerboard = null;
        this.visible = false;
    }

    static get layerOptions() {
        return foundry.utils.mergeObject(super.layerOptions, {
            name: 'checkerboard-layer',
            zIndex: 239, // Just below the debug layer
        });
    }

    async _draw() {
        this.removeChildren();

        // Create a checkerboard texture
        const checkerTexture = this.createCheckerboardTexture();

        const sceneRect = canvas.dimensions.sceneRect;

        // Create a tiling sprite that covers the scene area
        this.checkerboard = new PIXI.TilingSprite(checkerTexture, sceneRect.width, sceneRect.height);
        this.checkerboard.x = sceneRect.x;
        this.checkerboard.y = sceneRect.y;

        this.addChild(this.checkerboard);

        return this;
    }

    createCheckerboardTexture(size = 12, color1 = '#555555', color2 = '#333333') {
        const canvasElement = document.createElement('canvas');
        canvasElement.width = size * 2;
        canvasElement.height = size * 2;
        const ctx = canvasElement.getContext('2d');

        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, size * 2, size * 2);

        ctx.fillStyle = color2;
        ctx.fillRect(0, 0, size, size);
        ctx.fillRect(size, size, size, size);

        return PIXI.Texture.from(canvasElement);
    }
}

class LuminosityMaskFilter extends PIXI.Filter {
    constructor() {
        const fragmentShader = `
            varying vec2 vTextureCoord;
            uniform sampler2D uSampler;

            void main(void) {
                vec4 color = texture2D(uSampler, vTextureCoord);
                // Calculate luminosity (standard formula)
                float luminosity = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
                // Invert luminosity for alpha: black (0) -> opaque (1), white (1) -> transparent (0)
                gl_FragColor = vec4(color.rgb, 1.0 - luminosity);
            }
        `;
        super(null, fragmentShader);
    }
}

class DebugLayer extends foundry.canvas.layers.CanvasLayer {
    constructor(...args) {
        super(...args);
        this.checkerboard = getCheckerboardLayer();
        this.previewSprite = null;
        this.textureMaps = {};
    }

    static get layerOptions() {
        return foundry.utils.mergeObject(super.layerOptions, {
            name: 'debug-layer',
            zIndex: 240, // Above tiles, below tokens
        });
    }

    async _draw() {
        this.removeChildren();
        const clickCatcher = new PIXI.Graphics();
        clickCatcher.beginFill(0xffffff, 0);
        clickCatcher.drawRect(0, 0, canvas.app.screen.width, canvas.app.screen.height);
        clickCatcher.endFill();
        this.addChild(clickCatcher);
        console.log("Map Shine | Drawing Debug Layer.");
    }
    
    async _tearDown() {
        console.log("Map Shine | Tearing down Debug Layer.");
        super._tearDown();
    }

    async previewPBRTexture(textureType, textureMaps) {
        this.clearPreview();
        this.checkerboard.visible = true;

        if (textureType === 'composite') {
            this.checkerboard.visible = false;
            return;
        }

        let texture = null;
        let isMaskMode = false;

        // Check if it's a procedural texture first.
        if (proceduralTextureManager.definitions.has(textureType)) {
            texture = proceduralTextureManager.get(textureType);
            if (!texture) {
                ui.notifications.error(`Map Shine: Failed to generate procedural texture: ${textureType}`);
                this.checkerboard.visible = false;
                return;
            }
        } else {
            // Fallback to file-based textures.
            let texturePath = textureMaps[textureType];
            if (textureType === 'specular_mask' || textureType === 'iridescence_mask') {
                const baseType = textureType.split('_')[0];
                texturePath = textureMaps[baseType];
                isMaskMode = true;
            }

            if (!texturePath) {
                ui.notifications.warn(`Map Shine: Texture for '${textureType}' not found.`);
                this.checkerboard.visible = false;
                return;
            }

            try {
                texture = await foundry.canvas.loadTexture(texturePath);
            } catch (err) {
                console.error(`Map Shine | Error loading texture: ${texturePath}`, err);
                ui.notifications.error(`Map Shine | Could not load texture: ${texturePath}`);
                this.checkerboard.visible = false;
                return;
            }
        }

        let sprite;
        const isProcedural = proceduralTextureManager.definitions.has(textureType);

        if (isProcedural) {
            // For procedural textures, create a tiling sprite to cover the entire canvas (with padding).
            const fullRect = canvas.dimensions.rect;
            sprite = new PIXI.TilingSprite(texture, fullRect.width, fullRect.height);
            sprite.position.set(fullRect.x, fullRect.y);
        } else {
            // For PBR textures, create a standard sprite that fits the scene exactly (without padding).
            sprite = new PIXI.Sprite(texture);
            const sceneRect = canvas.dimensions.sceneRect;
            sprite.width = sceneRect.width;
            sprite.height = sceneRect.height;
            sprite.anchor.set(0);
            sprite.position.set(sceneRect.x, sceneRect.y);
        }

        if (isMaskMode) {
            sprite.filters = [new LuminosityMaskFilter()];
        }

        this.previewSprite = this.addChild(sprite);
    }

    clearPreview() {
        if (this.previewSprite) {
            this.removeChild(this.previewSprite);
            this.previewSprite.destroy({ children: true });
            this.previewSprite = null;
        }
    }
}

// Extend the standard Application class, which was the fix for the initial error.
class MapShinePanel extends Application {
    constructor(context = {}, options = {}) {
        super(options);
        this.context = context;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "map-shine-panel", 
            title: "Map Shine Controls",
            resizable: true,
            width: 400,
            height: "auto",
            classes: ["map-shine-panel-app"],
            template: "modules/map-shine/templates/map-shine-panel.html",
        });
    }

    getData(options) {
        const textureMaps = this.context.textureMaps || {};
        const fileTextureOptions = [];

        // Add the default composite view
        fileTextureOptions.push({ key: 'composite', name: 'Final Composite' });

        // Add detected PBR textures
        for (const tex of TEXTURE_DEFINITIONS) {
            if (textureMaps[tex.key]) {
                fileTextureOptions.push({ key: tex.key, name: tex.name });
            }
        }

        // Dynamically add mask options if base textures exist
        if (textureMaps.specular) {
            fileTextureOptions.push({ key: 'specular_mask', name: 'Specular Mask' });
        }
        if (textureMaps.iridescence) {
            fileTextureOptions.push({ key: 'iridescence_mask', name: 'Iridescence Mask' });
        }

        // Get procedural texture options
        const proceduralTextureOptions = proceduralTextureManager.listDefinitions();

        return {
            textureMaps: textureMaps,
            fileTextures: fileTextureOptions,
            proceduralTextures: proceduralTextureOptions,
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        const previewButton = html.find('#preview-pbr-btn');
        const typeSelect = html.find('#pbr-texture-type');

        if (previewButton.length && typeSelect.length) {
            previewButton.on('click', (event) => {
                event.preventDefault();
                const selectedType = html.find('#pbr-texture-type').val();
                const debugLayer = getDebugLayer();
                const shineLayer = canvas.layers.find(l => l instanceof DebugLayer);

                if (debugLayer && shineLayer) {
                    debugLayer.previewPBRTexture(selectedType, shineLayer.textureMaps);
                } else {
                    if (!debugLayer) ui.notifications.error('Map Shine: Debug layer not found.');
                    if (!shineLayer) ui.notifications.error('Map Shine: Main shine layer not found.');
                }
            });
        }
    }
}

// =======================================================
//  HOOKS
// =======================================================

Hooks.once('init', () => {
    console.log('Map Shine | Initializing...');
    CONFIG.Canvas.layers.checkerboardLayer = {
        layerClass: CheckerboardLayer,
        group: 'primary',
    };
    CONFIG.Canvas.layers.debugLayer = {
        layerClass: DebugLayer,
        group: 'primary',
    };
});


// Add a button to the scene controls.
Hooks.on('getSceneControlButtons', (controls) => {
    // The provided log confirms 'controls' is an object with a 'tokens' property.
    const tokenControls = controls.tokens;

    // The log also confirms that 'tools' is an OBJECT, not an array.
    if (tokenControls && typeof tokenControls.tools === 'object' && tokenControls.tools !== null) {
        // Therefore, we add our new tool by setting a new property on the tools object.
        tokenControls.tools['map-shine-panel-button'] = {
            name: 'map-shine-panel-button',
            title: 'Open Map Shine Panel',
            icon: 'fas fa-sparkles',
            onClick: async () => {
                const foundTextures = await findRelatedTextures();
                new MapShinePanel({ textureMaps: foundTextures }).render(true);
            },
            button: true
        };
    } else {
        console.error("Map Shine | Could not find the 'tokens' control group or its 'tools' object. Logging controls for inspection:", controls);
    }
});


// =======================================================
//  HELPER FUNCTIONS
// =======================================================

async function findRelatedTextures() {
    const backgroundSrc = canvas.scene?.background.src;
    if (!backgroundSrc) {
        console.log("Map Shine | No scene background texture to check.");
        return {};
    }

    console.log(`Map Shine | Base texture found: ${backgroundSrc}`);
    const pathParts = backgroundSrc.split('/');
    const filename = pathParts.pop();
    const dir = pathParts.join('/');
    const baseName = filename.split('.').slice(0, -1).join('.');
    const ext = filename.split('.').pop();
    
    const pbrTypes = ['Specular', 'Ambient', 'Normal', 'Iridescence'];
    const foundTextures = {};
    const layer = getDebugLayer();

    await Promise.all(pbrTypes.map(async (type) => {
        const expectedPath = `${dir}/${baseName}_${type}.${ext}`;
        try {
            const tex = await foundry.canvas.loadTexture(expectedPath, { fallback: false });
            if (tex) {
                console.log(`Map Shine |  - Found: ${expectedPath}`);
                if (layer) {
                    if (!layer.textureMaps) layer.textureMaps = {};
                    layer.textureMaps[type.toLowerCase()] = expectedPath;
                }
                foundTextures[type.toLowerCase()] = expectedPath;
            }
        } catch (err) {
            // This is the expected outcome if a texture doesn't exist.
        }
    }));

    console.log("Map Shine | Texture check complete. Found: ", foundTextures);
    return foundTextures;
}