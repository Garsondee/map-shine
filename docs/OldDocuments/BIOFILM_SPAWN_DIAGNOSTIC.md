# Biofilm Spawn Diagnostic - Why Some Tiles Don't Have Splashes

This diagnostic checks why biofilm particles spawn on some tiles but not others.

## Run in Browser Console

```javascript
(async function() {
  console.log('=== BIOFILM SPAWN DIAGNOSTIC ===\n');
  
  const biofilm = game.mapShine.particleManager.controllers.get('biofilm');
  const effectTargetManager = game.mapShine.effectTargetManager;
  
  if (!biofilm) {
    console.error('❌ Biofilm controller not found!');
    return;
  }
  
  console.log('✅ Biofilm controller found');
  console.log('Total emitters:', biofilm.emitters.size);
  console.log('Pending targets:', biofilm.pendingTargets.size);
  console.log('\n');
  
  // Check effect targets
  if (!effectTargetManager?.targets) {
    console.error('❌ No effect targets found!');
    return;
  }
  
  const targets = effectTargetManager.targets;
  console.log('=== EFFECT TARGETS ===');
  console.log('Background target:', !!targets.background);
  console.log('Tile targets:', targets.tiles.size);
  console.log('\n');
  
  // Check each tile for water mask
  console.log('=== TILE ANALYSIS ===');
  let tilesWithWater = 0;
  let tilesWithBiofilmEmitter = 0;
  
  for (const [tileId, targetData] of targets.tiles.entries()) {
    const tile = canvas.tiles.get(tileId);
    if (!tile) continue;
    
    const hasWater = !!targetData.water;
    const hasBiofilmEmitter = biofilm.emitters.has(tileId);
    
    if (hasWater) {
      tilesWithWater++;
      console.log('---');
      console.log('Tile ID:', tileId);
      console.log('  Document ID:', tile.document.id);
      console.log('  Texture:', tile.document.texture.src.split('/').pop());
      console.log('  Size:', tile.document.width, 'x', tile.document.height);
      console.log('  Position:', tile.document.x, ',', tile.document.y);
      console.log('  Has water mask:', hasWater);
      console.log('  Water texture valid:', targetData.water?.valid);
      console.log('  Has biofilm emitter:', hasBiofilmEmitter);
      
      if (hasBiofilmEmitter) {
        tilesWithBiofilmEmitter++;
        const emitterData = biofilm.emitters.get(tileId);
        const emitter = emitterData?.emitter;
        if (emitter) {
          console.log('  Emitter particle count:', emitter.particleCount);
          console.log('  Emitter frequency:', emitter._frequency);
          console.log('  Emitter emitting:', emitter.emit);
          
          // Check spawn shape
          const spawnBehavior = emitter.behaviors?.find(b => b.type === 'spawnShape');
          if (spawnBehavior?.shape) {
            console.log('  Spawn shape type:', spawnBehavior.shape.constructor.name);
            if (spawnBehavior.shape.spawnPoints) {
              console.log('  Spawn points:', spawnBehavior.shape.spawnPoints.length);
            }
          }
        }
      } else {
        console.log('  ❌ NO EMITTER - Why?');
        console.log('  Pending?:', biofilm.pendingTargets.has(tileId));
      }
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('Tiles with water masks:', tilesWithWater);
  console.log('Tiles with biofilm emitters:', tilesWithBiofilmEmitter);
  console.log('Missing emitters:', tilesWithWater - tilesWithBiofilmEmitter);
  
  // Check biofilm config
  console.log('\n=== BIOFILM CONFIG ===');
  const config = game.mapShine.profileManager.activeConfig.biofilm;
  console.log('Enabled:', config?.enabled);
  console.log('Mask influence:', config?.maskInfluence);
  console.log('Frequency:', config?.frequency);
  console.log('Mask threshold:', config?.maskThreshold);
  
  // Check if biofilm definition uses "range" spawn mode
  console.log('\n=== SPAWN MODE ===');
  console.log('Biofilm uses "range" spawn mode (edge-based)');
  console.log('This means particles spawn near water edges, not across entire water surface');
  
  console.log('\n=== NEXT STEPS ===');
  if (tilesWithWater > tilesWithBiofilmEmitter) {
    console.log('⚠️  Some tiles with water masks don\'t have emitters!');
    console.log('Check:');
    console.log('1. Are those tiles marked as pending?');
    console.log('2. Did emitter creation fail for those tiles?');
    console.log('3. Check browser console for error messages during scene load');
  }
  
  if (tilesWithBiofilmEmitter > 0) {
    console.log('✅ Some emitters exist - check spawn point generation');
    console.log('If particles only appear on small tiles:');
    console.log('1. Larger tiles may have fewer detected edges');
    console.log('2. Edge detection grid size may be too coarse');
    console.log('3. Spawn points may be outside viewport or masked');
  }
  
  console.log('\n=== END DIAGNOSTIC ===');
})();
```

## Expected Issues

### Issue 1: Emitters Not Created
If tiles have water masks but no emitters, the emitter creation may have failed. Check for:
- Texture loading errors
- Invalid spawn shape compilation
- Batch initialization timing issues

### Issue 2: Spawn Points Not Generated
If emitters exist but have 0 spawn points, the edge detection failed:
- Water mask may be solid (no edges detected)
- Edge detection parameters may be too strict
- Tile may be too large for current grid size

### Issue 3: Particles Outside Viewport
Particles may spawn but be culled if:
- Spawn points are outside current camera view
- Viewport culling is enabled and aggressive
- Particles are masked by outdoor/water masks

## Fix Suggestions

**For missing emitters:**
```javascript
// Force process pending targets
await game.mapShine.particleManager.processAllPendingTargets();
```

**For missing spawn points:**
```javascript
// Check edge detection on specific tile
const tile = canvas.tiles.get('[TILE_ID]');
const waterMask = game.mapShine.resourceManager.getWaterMask();
// Edge detection happens in TextureMaskShape during compile
```

**For masked particles:**
```javascript
// Check if BiofilmMaskFilter is hiding particles
const biofilm = game.mapShine.particleManager.controllers.get('biofilm');
console.log('Biofilm mask filter:', biofilm.biofilmMaskFilter);
console.log('Filter enabled:', biofilm.parentContainer.filters);
```
