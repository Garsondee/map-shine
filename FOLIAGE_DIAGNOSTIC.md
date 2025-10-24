# Foliage Animation Diagnostic Tools

This file contains code snippets for verifying that the foliage animation system is working correctly with both regular tiles and overhead sprites.

## Basic Diagnostics

### 1. Check if Bush/Tree Layers are Active

Run this in the console to see the status of the foliage layers:

```javascript
// Check if layers exist and are visible
const bushLayer = canvas.effects?.children?.find(l => l.constructor.name === "BushLayer");
const treeLayer = canvas.effects?.children?.find(l => l.constructor.name === "TreeLayer");

console.log("🌿 Bush Layer:", {
  exists: !!bushLayer,
  visible: bushLayer?.visible,
  affectedTiles: bushLayer?.affectedTiles?.size || 0,
  filters: Array.from(bushLayer?.affectedTiles?.values() || []).map(f => ({
    enabled: f.enabled,
    time: f.uniforms?.u_time?.toFixed(2)
  }))
});

console.log("🌲 Tree Layer:", {
  exists: !!treeLayer,
  visible: treeLayer?.visible,
  affectedTiles: treeLayer?.affectedTiles?.size || 0,
  filters: Array.from(treeLayer?.affectedTiles?.values() || []).map(f => ({
    enabled: f.enabled,
    time: f.uniforms?.u_time?.toFixed(2)
  }))
});
```

### 2. List All Bush/Tree Tiles

```javascript
// Find all tiles with _Bush or _Tree in their texture path
const bushTiles = canvas.tiles.placeables.filter(t => 
  t.document.texture.src.includes('_Bush')
);
const treeTiles = canvas.tiles.placeables.filter(t => 
  t.document.texture.src.includes('_Tree')
);

console.log("🌿 Bush Tiles Found:", bushTiles.length);
bushTiles.forEach((tile, i) => {
  console.log(`  ${i+1}. ${tile.id}:`, {
    texture: tile.document.texture.src.split('/').pop(),
    isOverhead: tile.document.overhead || tile.document.roof,
    managedByOverhead: tile.isManagedByOverheadLayer,
    meshAlpha: tile.mesh?.alpha,
    filters: tile.mesh?.filters?.length || 0
  });
});

console.log("🌲 Tree Tiles Found:", treeTiles.length);
treeTiles.forEach((tile, i) => {
  console.log(`  ${i+1}. ${tile.id}:`, {
    texture: tile.document.texture.src.split('/').pop(),
    isOverhead: tile.document.overhead || tile.document.roof,
    managedByOverhead: tile.isManagedByOverheadLayer,
    meshAlpha: tile.mesh?.alpha,
    filters: tile.mesh?.filters?.length || 0
  });
});
```

### 3. Check Overhead Sprite Integration

```javascript
// Check if foliage tiles have corresponding overhead sprites
const overheadLayer = canvas.effects?.children?.find(l => l.constructor.name === "OverheadEffectLayer");

if (!overheadLayer) {
  console.warn("⚠️ OverheadEffectLayer not found!");
} else {
  const foliageTiles = canvas.tiles.placeables.filter(t => 
    t.document.texture.src.includes('_Bush') || t.document.texture.src.includes('_Tree')
  );
  
  console.log("🎭 Overhead Integration Check:");
  foliageTiles.forEach(tile => {
    const hasOverheadSprite = overheadLayer.overheadSprites.has(tile.id);
    const overheadSprite = overheadLayer.overheadSprites.get(tile.id);
    const isBush = tile.document.texture.src.includes('_Bush');
    const isTree = tile.document.texture.src.includes('_Tree');
    
    console.log(`  ${isBush ? '🌿' : '🌲'} ${tile.id}:`, {
      type: isBush ? 'Bush' : 'Tree',
      isOverhead: tile.document.overhead || tile.document.roof,
      hasOverheadSprite,
      spriteFilters: overheadSprite?.filters?.length || 0,
      meshFilters: tile.mesh?.filters?.length || 0,
      managedByOverhead: tile.isManagedByOverheadLayer
    });
  });
}
```

### 4. Monitor Filter Animation in Real-Time

Run this to watch filter uniforms update over time (runs for 5 seconds):

```javascript
const bushLayer = canvas.effects?.children?.find(l => l.constructor.name === "BushLayer");
const treeLayer = canvas.effects?.children?.find(l => l.constructor.name === "TreeLayer");

if (!bushLayer && !treeLayer) {
  console.error("❌ No foliage layers found!");
} else {
  console.log("⏱️ Monitoring filter updates for 5 seconds...");
  
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (bushLayer?.affectedTiles?.size > 0) {
      const filter = bushLayer.affectedTiles.values().next().value;
      console.log(`[${elapsed}s] 🌿 Bush:`, {
        enabled: filter.enabled,
        time: filter.uniforms.u_time?.toFixed(2),
        windStrength: filter.uniforms.u_windStrength?.toFixed(3),
        windDirection: filter.uniforms.u_windDirection?.map(v => v.toFixed(2))
      });
    }
    
    if (treeLayer?.affectedTiles?.size > 0) {
      const filter = treeLayer.affectedTiles.values().next().value;
      console.log(`[${elapsed}s] 🌲 Tree:`, {
        enabled: filter.enabled,
        time: filter.uniforms.u_time?.toFixed(2),
        windStrength: filter.uniforms.u_windStrength?.toFixed(3),
        windDirection: filter.uniforms.u_windDirection?.map(v => v.toFixed(2))
      });
    }
    
    if (elapsed >= 5) {
      clearInterval(interval);
      console.log("✅ Monitoring complete!");
    }
  }, 500);
}
```

### 5. Force Filter Refresh

If filters aren't applying correctly, force a refresh:

```javascript
// Force both layers to re-scan and re-apply filters
const bushLayer = canvas.effects?.children?.find(l => l.constructor.name === "BushLayer");
const treeLayer = canvas.effects?.children?.find(l => l.constructor.name === "TreeLayer");

console.log("🔄 Forcing foliage filter refresh...");

if (bushLayer) {
  bushLayer._findAndApplyFilters();
  console.log(`✅ Bush Layer refreshed: ${bushLayer.affectedTiles.size} tiles affected`);
}

if (treeLayer) {
  treeLayer._findAndApplyFilters();
  console.log(`✅ Tree Layer refreshed: ${treeLayer.affectedTiles.size} tiles affected`);
}
```

### 6. Test Overhead Refresh Hook

```javascript
// Manually trigger the overhead refresh hook to test foliage re-application
console.log("🔔 Triggering refreshOverheadEffects hook...");
Hooks.callAll("refreshOverheadEffects");
console.log("✅ Hook called - check if foliage filters were re-applied");
```

## Advanced Diagnostics

### Check All Filter Parameters

```javascript
const bushLayer = canvas.effects?.children?.find(l => l.constructor.name === "BushLayer");

if (bushLayer?.affectedTiles?.size > 0) {
  const filter = bushLayer.affectedTiles.values().next().value;
  console.log("🔍 Bush Filter Parameters:", {
    enabled: filter.enabled,
    time: filter.uniforms.u_time,
    wind: {
      direction: filter.uniforms.u_windDirection,
      strength: filter.uniforms.u_windStrength
    },
    rustle: {
      scale: filter.uniforms.u_rustleScale,
      speed: filter.uniforms.u_rustleSpeed,
      frequency: filter.uniforms.u_rustleFrequency,
      intensity: filter.uniforms.u_rustleIntensity
    },
    sway: {
      scale: filter.uniforms.u_swayScale,
      speed: filter.uniforms.u_swaySpeed,
      frequency: filter.uniforms.u_swayFrequency,
      intensity: filter.uniforms.u_swayIntensity,
      windMultiplier: filter.uniforms.u_swayWindMultiplier
    },
    mixing: {
      perpendicularMix: filter.uniforms.u_perpendicularMix
    }
  });
}
```

## Common Issues and Solutions

### Issue: No tiles found

**Solution:** Ensure your tiles have `_Bush` or `_Tree` in the filename/path.

```javascript
// Check all tile textures
canvas.tiles.placeables.forEach(t => {
  console.log(t.document.texture.src);
});
```

### Issue: Filters not animating

**Solution:** Check if the layer's animation loop is running:

```javascript
const bushLayer = canvas.effects?.children?.find(l => l.constructor.name === "BushLayer");
console.log("Animation active:", !bushLayer?._destroyed);
console.log("Config enabled:", game.mapShine.profileManager?.activeConfig?.bush?.enabled);
```

### Issue: Overhead sprites don't have filters

**Solution:** Check if the overhead refresh hook is working:

```javascript
// Add a temporary listener to verify the hook is firing
Hooks.once("refreshOverheadEffects", () => {
  console.log("✅ refreshOverheadEffects hook fired!");
});

// Now refresh the overhead layer
const overheadLayer = canvas.effects?.children?.find(l => l.constructor.name === "OverheadEffectLayer");
overheadLayer?._refreshOverheadTiles();
```

## Performance Metrics

```javascript
// Monitor frame rate impact
let frameCount = 0;
let startTime = performance.now();

const measureFPS = () => {
  frameCount++;
  const elapsed = performance.now() - startTime;
  
  if (elapsed >= 1000) {
    const fps = (frameCount / elapsed) * 1000;
    console.log(`⚡ FPS: ${fps.toFixed(1)}`);
    
    frameCount = 0;
    startTime = performance.now();
  }
  
  requestAnimationFrame(measureFPS);
};

console.log("📊 Starting FPS measurement (watch console for updates)...");
measureFPS();
```
