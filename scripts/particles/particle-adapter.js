// Adapter to expose particle-emitter globals via ES exports
export const PropertyNode = globalThis.PropertyNode || null;
export const BehaviorOrder = globalThis.BehaviorOrder || null;
export const Emitter =
  globalThis.Emitter ||
  (globalThis.PIXI && globalThis.PIXI.particles && globalThis.PIXI.particles.Emitter) ||
  null;
export const ShapeSpawnBehavior =
  globalThis.ShapeSpawnBehavior ||
  (globalThis.PIXI &&
    globalThis.PIXI.particles &&
    globalThis.PIXI.particles.behaviors &&
    globalThis.PIXI.particles.behaviors.ShapeSpawnBehavior) ||
  null;
