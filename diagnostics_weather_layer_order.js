/**
 * WEATHER LAYER DIAGNOSTIC
 * 
 * Run this in your browser console after the scene has loaded:
 * 
 * Copy and paste this entire block into the console and press Enter
 */

console.log('=== WEATHER LAYER DIAGNOSTIC ===\n');

// 1. Check if weather layer exists
const weatherLayer = game.mapShine?.weatherSystemManager?.weatherEffectLayer;
console.log('1. Weather Layer Exists:', !!weatherLayer);

if (weatherLayer) {
  console.log('   - Weather Layer Type:', weatherLayer.constructor.name);
  console.log('   - Weather Layer Visible:', weatherLayer.visible);
  console.log('   - Weather Layer Alpha:', weatherLayer.alpha);
  console.log('   - Weather Layer zIndex:', weatherLayer.zIndex ?? 'undefined');
}

// 2. CRITICAL: Check which container has weather
console.log('\n2. Container Analysis:');
console.log('   Foundry renders in order: canvas.primary → canvas.environment');
console.log('   Weather MUST be in canvas.environment to render above OverheadEffectLayer!');

if (canvas.primary && weatherLayer) {
  const inPrimary = canvas.primary.children.indexOf(weatherLayer);
  console.log(`   - Weather in canvas.primary: ${inPrimary >= 0 ? '❌ YES (WRONG!)' : '✅ No'}`);
  if (inPrimary >= 0) {
    console.log(`   - ❌ ERROR: Weather is at index ${inPrimary} in canvas.primary`);
    console.log(`   - ❌ This means ALL canvas.environment layers render ABOVE weather!`);
  }
}

if (canvas.environment && weatherLayer) {
  const inEnvironment = canvas.environment.children.indexOf(weatherLayer);
  console.log(`   - Weather in canvas.environment: ${inEnvironment >= 0 ? '✅ YES (CORRECT!)' : '❌ No (WRONG!)'}`);
  if (inEnvironment >= 0) {
    console.log(`   - ✅ Weather at index ${inEnvironment} in canvas.environment`);
  }
}

// 3. Show canvas.environment children (where overhead tiles are)
console.log('\n3. canvas.environment Children (overhead layers are here):');
if (canvas.environment) {
  console.log(`   sortableChildren: ${canvas.environment.sortableChildren}`);
  for (let i = 0; i < canvas.environment.children.length; i++) {
    const child = canvas.environment.children[i];
    const name = child.constructor.name;
    const isWeather = child === weatherLayer;
    const marker = isWeather ? ' ⚡ WEATHER ⚡' : '';
    const zIndex = child.zIndex ?? 'undefined';
    console.log(`   [${i}] ${name}${marker} (zIndex: ${zIndex})`);
  }
  
  // Find overhead layers
  console.log('\n   ** Overhead Layer Detection **');
  const overheadLayer = canvas.environment.children.find(c => c.constructor.name === 'OverheadEffectLayer');
  const bushLayer = canvas.environment.children.find(c => c.constructor.name === 'BushLayer');
  const treeLayer = canvas.environment.children.find(c => c.constructor.name === 'TreeLayer');
  
  if (overheadLayer) {
    console.log(`   - OverheadEffectLayer: zIndex ${overheadLayer.zIndex ?? 'undefined'}`);
  }
  if (bushLayer) {
    console.log(`   - BushLayer: zIndex ${bushLayer.zIndex ?? 'undefined'}`);
  }
  if (treeLayer) {
    console.log(`   - TreeLayer: zIndex ${treeLayer.zIndex ?? 'undefined'}`);
  }
  
  if (weatherLayer && canvas.environment.children.includes(weatherLayer)) {
    const weatherZ = weatherLayer.zIndex ?? 0;
    const overheadZ = overheadLayer?.zIndex ?? 0;
    const bushZ = bushLayer?.zIndex ?? 0;
    const treeZ = treeLayer?.zIndex ?? 0;
    const maxOverheadZ = Math.max(overheadZ, bushZ, treeZ);
    
    console.log(`   - Weather zIndex: ${weatherZ}`);
    console.log(`   - Max overhead zIndex: ${maxOverheadZ}`);
    
    if (canvas.environment.sortableChildren && weatherZ > maxOverheadZ) {
      console.log(`   ✅ Weather WILL render above overhead layers (higher zIndex)`);
    } else if (canvas.environment.sortableChildren) {
      console.log(`   ❌ Weather will NOT render above overhead layers (lower zIndex)`);
    } else {
      console.log(`   ❌ sortableChildren=false, weather uses array order`);
    }
  }
} else {
  console.log('   ❌ canvas.environment is NULL');
}

// 4. Check for overhead/tile layers
console.log('\n4. Foliage Layer Detection:');
const foliageLayers = ['TilesLayer', 'OverheadEffectLayer', 'PrimaryCanvasGroup'];
let foundFoliage = false;
for (let i = 0; i < canvas.primary.children.length; i++) {
  const child = canvas.primary.children[i];
  const name = child.constructor.name;
  if (foliageLayers.some(f => name.includes(f)) || name.includes('Tile') || name.includes('Overhead')) {
    console.log(`   ✓ Found: ${name} at index ${i}`);
    foundFoliage = true;
  }
}
if (!foundFoliage) {
  console.log('   ⚠️ No foliage layers detected');
}

// 5. Check weather effects status
console.log('\n5. Weather Effects Status:');
if (weatherLayer?.effects) {
  for (const [type, effect] of weatherLayer.effects.entries()) {
    console.log(`   - ${type}:`);
    console.log(`     • visible: ${effect.visible}`);
    console.log(`     • alpha: ${effect.alpha ?? effect.shader?.uniforms?.alpha}`);
  }
}

console.log('\n=== END DIAGNOSTIC ===');
