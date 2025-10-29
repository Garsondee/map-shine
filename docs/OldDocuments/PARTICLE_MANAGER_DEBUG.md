# Particle Manager Debug

Run this in console to check the state:

```javascript
(function() {
  console.log('=== PARTICLE MANAGER DEBUG ===');
  
  // Check if ParticleManager exists
  console.log('ParticleManager exists:', !!game.mapShine?.particleManager);
  
  if (!game.mapShine?.particleManager) {
    console.error('ParticleManager not found!');
    return;
  }
  
  const pm = game.mapShine.particleManager;
  
  // Check controllers
  console.log('Controllers Map size:', pm.controllers.size);
  console.log('Controllers keys:', Array.from(pm.controllers.keys()));
  
  // Check each controller
  for (const [key, controller] of pm.controllers.entries()) {
    console.log('---');
    console.log('Controller:', key);
    console.log('  Definition path:', controller.definition?.configPath);
    console.log('  Emitters:', controller.emitters?.size || 0);
    console.log('  Pending:', controller.pendingTargets?.size || 0);
  }
  
  // Check PARTICLE_EFFECT_DEFINITIONS
  console.log('---');
  console.log('Checking PARTICLE_EFFECT_DEFINITIONS...');
  
  // Access from window scope
  if (typeof PARTICLE_EFFECT_DEFINITIONS !== 'undefined') {
    console.log('PARTICLE_EFFECT_DEFINITIONS keys:', Object.keys(PARTICLE_EFFECT_DEFINITIONS));
    console.log('biofilm in definitions:', 'biofilm' in PARTICLE_EFFECT_DEFINITIONS);
  } else {
    console.log('PARTICLE_EFFECT_DEFINITIONS not accessible from console');
  }
  
  console.log('=== END DEBUG ===');
})();
```
