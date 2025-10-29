# Biofilm Spawn Points Deep Diagnostic

This checks spawn point generation for each tile to see why large tiles don't show particles.

## Run in Browser Console

```javascript
(async function() {
  console.log('=== SPAWN POINTS ANALYSIS ===\n');
  
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
    console.log('Position:', tile.document.x, ',', tile.document.y);
    
    // Find spawn shape behavior
    const spawnBehavior = emitter.behaviors?.find(b => b.type === 'spawnShape');
    
    if (!spawnBehavior) {
      console.log('❌ NO SPAWN BEHAVIOR');
      continue;
    }
    
    console.log('Spawn behavior found:', spawnBehavior.type);
    
    const shape = spawnBehavior.shape;
    if (!shape) {
      console.log('❌ NO SPAWN SHAPE');
      continue;
    }
    
    console.log('Shape type:', shape.constructor.name);
    console.log('Shape data:');
    console.log('  spawnMode:', shape.spawnMode);
    console.log('  threshold:', shape.threshold);
    console.log('  upperThreshold:', shape.upperThreshold);
    
    // Check spawn points
    if (shape.spawnPoints) {
      console.log('  ✅ Spawn points:', shape.spawnPoints.length);
      
      if (shape.spawnPoints.length > 0) {
        // Show first few spawn points
        console.log('  First 3 spawn points:');
        for (let i = 0; i < Math.min(3, shape.spawnPoints.length); i++) {
          const pt = shape.spawnPoints[i];
          console.log('    [' + i + ']:', pt.x.toFixed(1), ',', pt.y.toFixed(1));
        }
        
        // Check if spawn points are in camera view
        const cam = canvas.scene.dimensions;
        const viewLeft = canvas.stage.pivot.x;
        const viewRight = viewLeft + canvas.app.screen.width / canvas.stage.scale.x;
        const viewTop = canvas.stage.pivot.y;
        const viewBottom = viewTop + canvas.app.screen.height / canvas.stage.scale.y;
        
        let inView = 0;
        for (const pt of shape.spawnPoints) {
          if (pt.x >= viewLeft && pt.x <= viewRight && 
              pt.y >= viewTop && pt.y <= viewBottom) {
            inView++;
          }
        }
        
        console.log('  Spawn points in viewport:', inView, '/', shape.spawnPoints.length);
        
        if (inView === 0) {
          console.log('  ⚠️  NO SPAWN POINTS IN VIEWPORT - Pan camera to see particles');
        }
      } else {
        console.log('  ❌ ZERO SPAWN POINTS - Edge detection failed!');
        console.log('  Possible causes:');
        console.log('    - Water mask has no edges (solid color)');
        console.log('    - Threshold settings exclude all pixels');
        console.log('    - Mask texture not loaded properly');
      }
    } else {
      console.log('  ❌ Shape has no spawnPoints property');
      console.log('  Shape properties:', Object.keys(shape));
    }
    
    // Check actual particle positions
    console.log('\nParticle positions (first 3):');
    let count = 0;
    for (let p = emitter._activeParticlesFirst; p && count < 3; p = p.next) {
      console.log('  [' + count + ']:', 
        'x=' + p.position.x.toFixed(1), 
        'y=' + p.position.y.toFixed(1),
        'visible=' + p.visible);
      count++;
    }
  }
  
  console.log('\n=== VIEWPORT INFO ===');
  const viewLeft = canvas.stage.pivot.x;
  const viewRight = viewLeft + canvas.app.screen.width / canvas.stage.scale.x;
  const viewTop = canvas.stage.pivot.y;
  const viewBottom = viewTop + canvas.app.screen.height / canvas.stage.scale.y;
  console.log('Camera view bounds:');
  console.log('  Left:', viewLeft.toFixed(0));
  console.log('  Right:', viewRight.toFixed(0));
  console.log('  Top:', viewTop.toFixed(0));
  console.log('  Bottom:', viewBottom.toFixed(0));
  
  console.log('\n=== DIAGNOSIS ===');
  console.log('If large tiles have 0 spawn points:');
  console.log('  → Edge detection failed on those textures');
  console.log('  → Check if _Water mask has visible edges');
  console.log('  → Try adjusting maskThreshold and maskUpperThreshold');
  console.log('\nIf spawn points exist but are outside viewport:');
  console.log('  → Pan camera to where spawn points are located');
  console.log('  → Particles may be spawning off-screen');
  console.log('\nIf spawn points in view but particles not visible:');
  console.log('  → Check BiofilmMaskFilter (may be masking particles)');
  console.log('  → Check particle.visible property');
})();
```

## Config Adjustment If Needed

If edge detection is failing, try adjusting these values in the debugger UI:

```javascript
// Lower threshold to detect more edges
game.mapShine.profileManager.activeConfig.biofilm.maskThreshold = 0.3;

// Adjust upper threshold for range mode
game.mapShine.profileManager.activeConfig.biofilm.maskUpperThreshold = 0.7;

// Rebuild emitters after config change
game.mapShine.particleManager.controllers.get('biofilm').requestRebuild(
  game.mapShine.effectTargetManager.targets,
  game.mapShine.profileManager.activeConfig
);
```
