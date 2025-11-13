// Adapter to expose DOM/browser globals for analyzer visibility
export const URL = globalThis.URL || null;
export const Event = globalThis.Event || null;
export const ResizeObserver = globalThis.ResizeObserver || null;
export const Node = globalThis.Node || null;
export const Blob = globalThis.Blob || null;
