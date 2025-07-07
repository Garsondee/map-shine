// This file contains core constants and utility functions shared across the module.

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
//  CLASS DEFINITIONS
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

    createCheckerboardTexture(size = 32, color1 = '#c0c0c0', color2 = '#808080') {
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

class DebugLayer extends foundry.canvas.layers.CanvasLayer {
    constructor() {
        super();
        this.pbrPreviewSprite = null;
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
        console.log("Map Shine | Drawing MetallicShineLayer.");
    }
    
    async _tearDown() {
        console.log("Map Shine | Tearing down MetallicShineLayer.");
        super._tearDown();
    }

    async previewPBRTexture(textureType) {
        const checkerboardLayer = getCheckerboardLayer();
        if (this.pbrPreviewSprite) {
            this.removeChild(this.pbrPreviewSprite);
            this.pbrPreviewSprite.destroy({ children: true });
            this.pbrPreviewSprite = null;
        }

        if (textureType.toLowerCase() === 'composite') {
            if (checkerboardLayer) checkerboardLayer.visible = false;
            ui.notifications.info('Map Shine: Switched to final composite view.');
            return;
        }

        const texturePath = (this.textureMaps || {})[textureType.toLowerCase()];
        if (checkerboardLayer) checkerboardLayer.visible = true;

        if (!texturePath) {
            ui.notifications.warn(`Map Shine: No PBR texture found for type '${textureType}'.`);
            return;
        }

        console.log("Map Shine | Attempting to preview PBR texture:", texturePath);
        let texture;
        try {
            texture = await foundry.canvas.loadTexture(texturePath);
            if (!texture?.baseTexture?.valid) throw new Error("Texture is not valid");
        } catch (err) {
            ui.notifications.error(`Map Shine: Failed to load PBR texture '${textureType}': ${err}`);
            console.error("Map Shine | Failed to load PBR texture:", texturePath, err);
            return;
        }

        const sceneRect = canvas.dimensions.sceneRect;
        try {
            const sprite = new PIXI.Sprite(texture);
            sprite.x = sceneRect.x;
            sprite.y = sceneRect.y;
            sprite.width = sceneRect.width;
            sprite.height = sceneRect.height;
            sprite.alpha = 1.0;
            this.addChild(sprite);
            this.pbrPreviewSprite = sprite;
            ui.notifications.info(`Map Shine: Previewing '${textureType}' PBR texture.`);
        } catch (err) {
            ui.notifications.error(`Map Shine: Failed to create sprite for '${textureType}': ${err}`);
            console.error("Map Shine | Failed to create sprite:", err);
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
            template: "modules/map-shine/templates/map-shine-panel.html"
        });
    }

    async getData(options) {
        const context = await super.getData(options);
        const textureMaps = this.context.textureMaps || {};
        const textures = TEXTURE_DEFINITIONS.map((def) => {
            let path = 'Not found';
            let statusClass = 'status-grey';
            if (def.key === 'background') {
                path = canvas.scene?.background.src || 'Not set';
                statusClass = canvas.scene?.background.src ? 'status-green' : 'status-red';
            } else {
                const foundPath = textureMaps[def.key];
                if (foundPath) {
                    path = foundPath;
                    statusClass = 'status-green';
                }
            }
            return { name: def.name, tooltip: def.tooltip, path: path, statusClass: statusClass };
        });
        context.textures = textures;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);
        const previewButton = html.find('#preview-pbr-btn');
        const typeSelect = html.find('#pbr-type-select');

        if (previewButton.length && typeSelect.length) {
            previewButton.on('click', () => {
                const textureType = typeSelect.val();
                if (!textureType) {
                    return ui.notifications.warn('Please select a texture type to preview.');
                }
                const layer = getDebugLayer();
                if (layer) {
                    layer.previewPBRTexture(textureType);
                } else {
                    ui.notifications.warn('Map Shine layer not found or is invalid.');
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

Hooks.once('ready', async function() {
    console.log('Map Shine | Ready hook: Loading PIXI filters...');
    try {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'modules/map-shine/scripts/pixi-filters.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        console.log('Map Shine | PIXI filters loaded successfully.');
    } catch (err) {
        console.error('Map Shine | Failed to load PIXI filters.', err);
    }
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