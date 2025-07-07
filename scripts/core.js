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
