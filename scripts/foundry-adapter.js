// Adapter to expose Foundry globals for analyzer visibility
export const Canvas = globalThis.Canvas || null;
export const CONST = (globalThis.CONST || (globalThis.foundry && globalThis.foundry.CONST)) || null;
export const TILE_OCCLUSION_MODES = (CONST && CONST.TILE_OCCLUSION_MODES) || globalThis.TILE_OCCLUSION_MODES || null;
export const CONFIG = globalThis.CONFIG || null;
