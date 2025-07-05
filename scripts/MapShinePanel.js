import { getMetallicShineLayer, TEXTURE_DEFINITIONS } from './module.js';

export class MapShinePanel extends Application {
  constructor(options = {}) {
    super(options);
    this.textureMaps = {};
    Hooks.on('MapShine.texturesFound', (maps) => {
      this.textureMaps = maps;
      this.render();
    });
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

    context.textures = TEXTURE_DEFINITIONS.map((def) => {
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
