# Biofilm Behavior Check - FIXED

The previous diagnostic was checking `emitter.behaviors` but PIXI particles stores them in `emitter.initBehaviors`.

## Run in Browser Console

```javascript
(function() {
  console.log('=== BIOFILM BEHAVIOR CHECK ===\n');
  
  const biofilm = game.mapShine.particleManager.controllers.get('biofilm');
  const targets = game.mapShine.effectTargetManager.targets;
  
  for (const [tileId, targetData] of targets.tiles.entries()) {
    if (!targetData.water) continue;
    
    const tile = canvas.tiles.get(tileId);
    const emitterData = biofilm.emitters.get(tileId);
    const emitter = emitterData?.emitter;
    
    if (!emitter) continue;
    
    console.log('===================================');
    console.log('Tile:', tile.document.texture.src.split('/').pop());
    console.log('Size:', tile.document.width, 'x', tile.document.height);
    
    // Check initBehaviors (where PIXI.particles stores them)
    console.log('initBehaviors:', emitter.initBehaviors?.length || 0);
    
    if (emitter.initBehaviors) {
      for (let i = 0; i < emitter.initBehaviors.length; i++) {
        const behavior = emitter.initBehaviors[i];
        console.log('  [' + i + ']', behavior.constructor.type || behavior.constructor.name);
        
        // Check if this is the spawn shape behavior
        if (behavior.constructor.type === 'spawnShape' || behavior.constructor.name === 'ShapeSpawnBehavior') {
          console.log('    ✅ SPAWN BEHAVIOR FOUND');
          
          if (behavior.shape) {
            console.log('    Shape type:', behavior.shape.constructor.name);
            console.log('    Spawn mode:', behavior.shape.spawnMode);
            console.log('    Threshold:', behavior.shape.threshold);
            console.log('    Upper threshold:', behavior.shape.upperThreshold);
            console.log('    Is compiled:', behavior.shape.isCompiled);
            console.log('    Is compiling:', behavior.shape.isCompiling);
            
            // Check validPoints (not spawnPoints!)
            if (behavior.shape.validPoints) {
              console.log('    Valid points:', behavior.shape.validPoints.length);
              
              if (behavior.shape.validPoints.length === 0) {
                console.log('    ❌ ZERO SPAWN POINTS!');
                console.log('    This means edge detection found NO edges in the water mask');
                console.log('    Possible causes:');
                console.log('      - Water mask is solid color (no gradient/edges)');
                console.log('      - Threshold range excludes all pixels');
                console.log('      - Mask texture has wrong format');
              } else {
                // Show first few points
                console.log('    First 3 points:');
                for (let j = 0; j < Math.min(3, behavior.shape.validPoints.length); j++) {
                  const pt = behavior.shape.validPoints[j].point;
                  console.log('      [' + j + ']:', pt.x.toFixed(1), ',', pt.y.toFixed(1));
                }
              }
            } else {
              console.log('    ❌ No validPoints array');
            }
          } else {
            console.log('    ❌ Spawn behavior has no shape!');
          }
        }
      }
    } else {
      console.log('  ❌ NO initBehaviors ARRAY');
    }
  }
  
  console.log('\n=== DIAGNOSIS ===');
  console.log('If initBehaviors is missing or empty:');
  console.log('  → Emitter creation failed to add behaviors');
  console.log('  → Check console for errors during emitter initialization');
  console.log('\nIf spawn behavior exists but validPoints is 0:');
  console.log('  → Edge detection failed - water mask has no detected edges');
  console.log('  → Biofilm uses "range" mode (threshold to upperThreshold)');
  console.log('  → Current thresholds:', game.mapShine.profileManager.activeConfig.biofilm.maskThreshold, 'to', game.mapShine.profileManager.activeConfig.biofilm.maskUpperThreshold);
})();
```

## Understanding Range Mode

Biofilm uses **"range" spawn mode** which detects **edges** between two threshold values:
- **maskThreshold** (default 0.2): Lower bound - pixels below this are "not water"
- **maskUpperThreshold** (default 0.6): Upper bound - pixels above this are "deep water"
- **Particles spawn in the range between** (the edge/transition zone)

If your water mask is all **white** (1.0) or all **black** (0.0), there are NO edges to detect!
