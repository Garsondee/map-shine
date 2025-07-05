import { getMetallicShineLayer, TEXTURE_DEFINITIONS } from './module.js';

export class MapShinePanel extends Application {
  constructor(options = {}) {
    super(options);
    // Textures are now passed in directly at creation
    this.textureMaps = options.textureMaps || {};
    console.log('[MapShinePanel] Panel created with texture maps:', this.textureMaps);
  }

  static get defaultOptions() {
            return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'map-shine-panel',
      title: 'Map Shine Controls',
      template: 'modules/map-shine/templates/map-shine-panel.html',
      width: 400,
      height: 'auto',
      resizable: true,
      classes: ['map-shine-panel'],
    });
  }

  getData(options = {}) {
    const context = super.getData(options);
    const textureMaps = this.textureMaps || {};
    console.log('[MapShinePanel] getData triggered. Current textureMaps:', textureMaps);

    context.textures = TEXTURE_DEFINITIONS.map((def) => {
      let path = 'Not found';
      let statusClass = 'status-grey';

      if (def.key === 'background') {
        path = canvas.scene?.background.src || 'Not set';
        statusClass = canvas.scene?.background.src ? 'status-green' : 'status-red';
      } else {
        const foundPath = textureMaps[def.key];
        console.log(`[MapShinePanel] Checking texture: ${def.key} | Path: ${foundPath}`);
        if (foundPath) {
          path = foundPath;
          statusClass = 'status-green';
        }
      }
      console.log(`[MapShinePanel]   > Final status for ${def.key}: ${statusClass}`);
      return {
        name: def.name,
        tooltip: def.tooltip,
        path: path,
        statusClass: statusClass,
      };
    });

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    const previewButton = html.find('#preview-pbr-btn');
    const typeSelect = html.find('#pbr-type-select');

    previewButton.on('click', () => {
      const textureType = typeSelect.val();
      if (!textureType) {
        return ui.notifications.warn('Please select a texture type to preview.');
      }
      const layer = getMetallicShineLayer();
      if (layer) {
        layer.previewPBRTexture(textureType);
      } else {
        ui.notifications.warn('Map Shine layer not found or is invalid.');
      }
    });
  }
}
