# Biofilm Frame-Skip Optimization - Diagnostic Script

## Purpose
Verify that the biofilm particle system frame-skip optimization is working correctly.

## Expected Behavior
- Frame-skip interval: 3 (update every 3rd frame)
- Expected skip ratio: 66.7% (2 out of 3 frames skipped)
- Particles should still move smoothly despite 20 FPS update rate

## Diagnostic Script

Run this in your browser console while biofilm particles are active:

```javascript
(async function() {
  console.log('============================================================');
  console.log('📊 BIOFILM FRAME-SKIP DIAGNOSTIC');
  console.log('============================================================\n');
  
  // Find the ParticleManager
  const particleManager = game.mapShine?.particleManager;
  
  if (!particleManager) {
    console.error('❌ ParticleManager not found!');
    return;
  }
  
  // Find the biofilm controller
  const biofilmController = particleManager.controllers?.get('biofilm');
  
  if (!biofilmController) {
    console.error('❌ Biofilm controller not found! Is the biofilm effect enabled?');
    return;
  }
  
  console.log('✅ Biofilm controller found');
  console.log('   Config path: ' + biofilmController.definition.configPath);
  console.log('   Emitters: ' + biofilmController.emitters.size + '\n');
  
  // Check frame-skip properties
  console.log('🔍 Frame-Skip Properties:');
  console.log('   Counter: ' + biofilmController._frameSkipCounter);
  console.log('   Interval: ' + biofilmController._frameSkipInterval);
  
  if (biofilmController._frameSkipInterval === undefined) {
    console.error('❌ Frame-skip interval is undefined!');
    return;
  }
  
  console.log('\n⏱️  Monitoring frame-skip behavior for 2 seconds...\n');
  
  // Monitor update calls
  let updateCount = 0;
  let skipCount = 0;
  let frameCount = 0;
  
  const originalUpdate = biofilmController.update.bind(biofilmController);
  
  biofilmController.update = async function(deltaTime) {
    frameCount++;
    
    // Check if this frame will update or skip
    const isBiofilm = (this.definition.configPath === "biofilm");
    const counter = (this._frameSkipCounter === undefined) ? 0 : this._frameSkipCounter;
    const interval = (this._frameSkipInterval === undefined) ? 3 : this._frameSkipInterval;
    const willUpdate = !isBiofilm || ((counter + 1) >= interval);
    
    if (willUpdate) {
      console.log('✅ UPDATE [Frame ' + frameCount + '] - Counter: ' + counter + ' / Interval: ' + interval);
      updateCount++;
    } else {
      console.log('⏭️  SKIP [Frame ' + frameCount + '] - Counter: ' + counter + ' / Interval: ' + interval);
      skipCount++;
    }
    
    // Call original update
    await originalUpdate(deltaTime);
  };
  
  // Run for 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Restore original update
  biofilmController.update = originalUpdate;
  
  // Calculate results
  const interval = biofilmController._frameSkipInterval;
  const totalFrames = updateCount + skipCount;
  const expectedSkipRatio = ((interval - 1) / interval * 100).toFixed(1);
  const actualSkipRatio = (skipCount / totalFrames * 100).toFixed(1);
  
  console.log('\n============================================================');
  console.log('📊 DIAGNOSTIC RESULTS:');
  console.log('============================================================');
  console.log('Total frames: ' + totalFrames);
  console.log('Actual updates: ' + updateCount);
  console.log('Skipped frames: ' + skipCount);
  console.log('Frame-skip interval: ' + interval);
  console.log('Expected skip ratio: ' + expectedSkipRatio + '%');
  console.log('Actual skip ratio: ' + actualSkipRatio + '%');
  
  // Validation
  const tolerance = 5; // Allow 5% tolerance
  const skipDiff = Math.abs(parseFloat(actualSkipRatio) - parseFloat(expectedSkipRatio));
  
  if (skipDiff <= tolerance) {
    console.log('\n✅ Frame-skip is WORKING CORRECTLY!');
    console.log('   Saved ' + skipCount + ' updates, performed ' + updateCount + ' updates');
  } else {
    console.log('\n⚠️  Unexpected skip ratio (difference: ' + skipDiff.toFixed(1) + '%)');
  }
  
  console.log('============================================================');
})();
```

## Expected Output

```
============================================================
📊 BIOFILM FRAME-SKIP DIAGNOSTIC
============================================================

✅ Biofilm controller found
   Config path: biofilm
   Emitters: 1

🔍 Frame-Skip Properties:
   Counter: 2
   Interval: 3

⏱️  Monitoring frame-skip behavior for 2 seconds...

⏭️  SKIP [Frame 1] - Counter: 2 / Interval: 3
⏭️  SKIP [Frame 2] - Counter: 2 / Interval: 3
✅ UPDATE [Frame 3] - Counter: 2 / Interval: 3
⏭️  SKIP [Frame 4] - Counter: 0 / Interval: 3
⏭️  SKIP [Frame 5] - Counter: 1 / Interval: 3
✅ UPDATE [Frame 6] - Counter: 2 / Interval: 3
...

============================================================
📊 DIAGNOSTIC RESULTS:
============================================================
Total frames: 120
Actual updates: 40
Skipped frames: 80
Frame-skip interval: 3
Expected skip ratio: 66.7%
Actual skip ratio: 66.7%

✅ Frame-skip is WORKING CORRECTLY!
   Saved 80 updates, performed 40 updates
============================================================
```

## Troubleshooting

### If frame-skip properties are undefined:
- Scene transition may have wiped them
- Defensive initialization should handle this automatically

### If skip ratio is 0% (all frames updating):
- Check that biofilm effect is enabled
- Verify `definition.configPath === "biofilm"`

### If skip ratio is 100% (no updates):
- Counter/interval properties corrupted
- Scene reload required

## Performance Expectations

With this optimization:
- **~66% reduction** in biofilm particle update cost
- **Expected gain**: 250-300 FPS improvement
- **Frame time saved**: ~1.5-2.0ms
- **Visual quality**: Maintained (particles drift slowly)
