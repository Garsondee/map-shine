# Biofilm Visibility Debug

Biofilm particles render to an off-screen texture but that texture may not be displayed. Check if there's a sprite:

```javascript
(function() {
  const biofilm = game.mapShine.particleManager.controllers.get('biofilm');
  
  console.log('=== BIOFILM RENDER STATUS ===');
  console.log('parentContainer:', biofilm.parentContainer);
  console.log('  visible:', biofilm.parentContainer.visible);
  console.log('  alpha:', biofilm.parentContainer.alpha);
  console.log('  children:', biofilm.parentContainer.children.length);
  console.log('  filters:', biofilm.parentContainer.filters);
  
  console.log('\nparticleOutputTexture:', biofilm.particleOutputTexture);
  console.log('  valid:', biofilm.particleOutputTexture?.valid);
  console.log('  width:', biofilm.particleOutputTexture?.width);
  console.log('  height:', biofilm.particleOutputTexture?.height);
  
  console.log('\nParent container children:');
  biofilm.parentContainer.children.forEach((child, i) => {
    console.log(`  [${i}]`, child.constructor.name, 'visible:', child.visible);
  });
  
  console.log('\n=== ISSUE ===');
  console.log('Biofilm renders particles to particleOutputTexture');
  console.log('But that texture is never displayed as a sprite!');
  console.log('The texture exists but nothing shows it on screen.');
})();
```
