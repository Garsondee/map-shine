import { MapShinePanel } from './MapShinePanel.js';

// Class definition for the canvas layer
class MetallicShineLayer extends CanvasLayer {
    constructor() {
        super();
        this.pbrPreviewSprite = null;
        this.textureMaps = {};
    }

    static get layerOptions() {
        return foundry.utils.mergeObject(super.layerOptions, {
            name: 'metallic-shine',
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
        if (this.pbrPreviewSprite) {
            this.removeChild(this.pbrPreviewSprite);
            this.pbrPreviewSprite.destroy({ children: true });
            this.pbrPreviewSprite = null;
        }

        if (textureType.toLowerCase() === 'composite') {
            ui.notifications.info('Map Shine: Switched to final composite view.');
            return;
        }

        const texturePath = (this.textureMaps || {})[textureType.toLowerCase()];
        if (!texturePath) {
            ui.notifications.warn(`Map Shine: No PBR texture found for type '${textureType}'.`);
            return;
        }

        console.log("Map Shine | Attempting to preview PBR texture:", texturePath);
        let texture;
        try {
            texture = await loadTexture(texturePath);
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

// Texture definitions
export const TEXTURE_DEFINITIONS = [
    { key: 'background', name: 'Background', tooltip: 'The main scene background image.' },
    { key: 'specular', name: 'Specular', tooltip: 'Grayscale texture for shininess.' },
    { key: 'normal', name: 'Normal', tooltip: 'RGB texture for surface details.' },
    { key: 'ambient', name: 'Ambient Occlusion', tooltip: 'Grayscale texture for ambient light blocking.' },
    { key: 'iridescence', name: 'Iridescence', tooltip: 'RGB texture for rainbow-like effects.' },
];

// Function to get the custom layer
export function getMetallicShineLayer() {
    return canvas.layers.find(layer => layer instanceof MetallicShineLayer);
}

// Function to find related PBR textures
async function findRelatedTextures() {
    const backgroundSrc = canvas.scene?.background.src;
    if (!backgroundSrc) {
        console.log("Map Shine | No scene background texture to check.");
        return;
    }

    console.log(`Map Shine | Base texture found: ${backgroundSrc}`);
    const pathParts = backgroundSrc.split('/');
    const filename = pathParts.pop();
    const dir = pathParts.join('/');
    const baseName = filename.split('.').slice(0, -1).join('.');
    const ext = filename.split('.').pop();

    const pbrTypes = ['Specular', 'Ambient', 'Normal', 'Iridescence'];
    const foundTextures = {};

    console.log("Map Shine | Checking for related PBR textures using FilePicker...");
    try {
        const browseResult = await FilePicker.browse("data", dir);
        for (const type of pbrTypes) {
            const pbrFilename1 = `${baseName}_${type.toLowerCase()}.${ext}`;
            const pbrFilename2 = `${baseName}_${type}.${ext}`; // Alternative naming
            const foundFile = browseResult.files.find(f => {
                const fName = f.split('/').pop();
                return fName.toLowerCase() === pbrFilename1.toLowerCase() || fName.toLowerCase() === pbrFilename2.toLowerCase();
            });

            if (foundFile) {
                const layer = getMetallicShineLayer();
                if(layer) layer.textureMaps[type.toLowerCase()] = foundFile;
                foundTextures[type.toLowerCase()] = foundFile;
                console.log(`Map Shine |  - Found: ${foundFile}`);
            }
        }
    } catch (err) {
        console.error(`Map Shine | Could not browse directory '${dir}'.`, err);
    }

    console.log("Map Shine | Texture check complete. Found: ", foundTextures);
    Hooks.callAll("MapShine.texturesFound", foundTextures);
    return foundTextures;
}

// Hooks
Hooks.once('init', () => {
    console.log('Map Shine | Initializing...');
    CONFIG.Canvas.layers.metallicShine = {
        layerClass: MetallicShineLayer,
        group: 'primary',
    };
});

Hooks.once('ready', () => {
    console.log('Map Shine | Ready hook. Opening panel automatically.');
    new MapShinePanel().render(true);
});

Hooks.on('canvasReady', () => {
    console.log('Map Shine | canvasReady hook: Finding related textures.');
    findRelatedTextures();
});
      