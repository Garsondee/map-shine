// Adapter to expose MapPointsManager lazily from global scope.
// Uses a Proxy so that reads happen at call-time (after initialization),
// and provides safe fallbacks during early loads.
export const MapPointsManager = new Proxy({}, {
  get(_target, prop) {
    const mgr = globalThis.MapPointsManager;
    if (!mgr) {
      // Provide safe fallbacks for commonly used methods to avoid crashes before init
      if (prop === 'getGroups') return () => ({}) ;
      if (prop === 'getGroup') return () => undefined;
      return undefined;
    }
    const value = mgr[prop];
    if (typeof value === 'function') return value.bind(mgr);
    return value;
  }
});
