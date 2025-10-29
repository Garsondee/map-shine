/**
 * 🔍 Phase 1 Validation Test - Test Newly Added Validation Methods
 * 
 * Run this script in the Foundry VTT console (F12) to test all Phase 1 validation methods:
 * - BushLayer._validateFoliageTextures()
 * - TreeLayer._validateFoliageTextures() 
 * - WeatherParticleLayer._validateParticleSystem()
 * - ParticleLayer._validateParticleSystem()
 * - SmellyFliesLayer._validateParticleSystem()
 * - AmbientLayer._validateAmbientFilter()
 * - PrismLayer._validatePrismFilter()
 */

(async function phase1ValidationTest() {
  console.log('%c🔍 Phase 1 Validation Test', 'color: #FF9800; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(70));
  
  const results = {
    timestamp: new Date().toISOString(),
    bushLayer: { status: 'not_found', method: null, result: null },
    treeLayer: { status: 'not_found', method: null, result: null },
    weatherParticleLayer: { status: 'not_found', method: null, result: null },
    particleLayer: { status: 'not_found', method: null, result: null },
    smellyFliesLayer: { status: 'not_found', method: null, result: null },
    ambientLayer: { status: 'not_found', method: null, result: null },
    prismLayer: { status: 'not_found', method: null, result: null }
  };
  
  const phase1Layers = [
    { name: 'BushLayer', key: 'bushLayer', method: '_validateFoliageTextures' },
    { name: 'TreeLayer', key: 'treeLayer', method: '_validateFoliageTextures' },
    { name: 'WeatherParticleLayer', key: 'weatherParticleLayer', method: '_validateParticleSystem' },
    { name: 'ParticleLayer', key: 'particleLayer', method: '_validateParticleSystem' },
    { name: 'SmellyFliesLayer', key: 'smellyFliesLayer', method: '_validateParticleSystem' },
    { name: 'AmbientLayer', key: 'ambientLayer', method: '_validateAmbientFilter' },
    { name: 'PrismLayer', key: 'prismLayer', method: '_validatePrismFilter' }
  ];
  
  console.log('\n🔍 Testing Phase 1 Validation Methods:');
  console.log('-'.repeat(50));
  
  phase1Layers.forEach(layer => {
    console.log(`\n📋 Testing ${layer.name}:`);
    
    try {
      // Find the layer instance
      const layerInstance = canvas?.layers?.find(l => l.constructor.name === layer.name);
      
      if (!layerInstance) {
        results[layer.key].status = 'not_found';
        console.log(`   Status: ❌ Layer instance not found in canvas.layers`);
        return;
      }
      
      results[layer.key].status = 'found';
      
      // Check if validation method exists
      if (typeof layerInstance[layer.method] !== 'function') {
        results[layer.key].status = 'method_missing';
        console.log(`   Status: ❌ Validation method ${layer.method} not found`);
        return;
      }
      
      results[layer.key].method = 'available';
      console.log(`   Layer Instance: ✅ Found`);
      console.log(`   Validation Method: ✅ ${layer.method}() available`);
      
      // Call the validation method
      const validationResult = layerInstance[layer.method]();
      results[layer.key].result = validationResult;
      
      console.log(`   Validation Result: ${validationResult ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (!validationResult) {
        console.log(`   ⚠️  Check console for detailed validation warnings`);
      }
      
    } catch (error) {
      results[layer.key].status = 'error';
      results[layer.key].error = error.message;
      console.log(`   Status: ❌ ERROR - ${error.message}`);
      console.error(`   Full error:`, error);
    }
  });
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('%c📊 Phase 1 Validation Summary', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
  console.log('='.repeat(70));
  
  const passed = Object.values(results).filter(r => r.result === true).length;
  const failed = Object.values(results).filter(r => r.result === false).length;
  const missing = Object.values(results).filter(r => r.status === 'not_found' || r.status === 'method_missing').length;
  const errors = Object.values(results).filter(r => r.status === 'error').length;
  
  console.log(`\n📈 Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⚠️  Missing: ${missing}`);
  console.log(`   💥 Errors: ${errors}`);
  
  console.log(`\n🎯 Layer-by-Layer Status:`);
  Object.entries(results).forEach(([key, result]) => {
    const layer = phase1Layers.find(l => l.key === key);
    if (layer) {
      const status = result.result === true ? '✅ PASSED' : 
                    result.result === false ? '❌ FAILED' :
                    result.status === 'not_found' ? '⚠️  NOT FOUND' :
                    result.status === 'method_missing' ? '⚠️  NO METHOD' :
                    result.status === 'error' ? '💥 ERROR' : '❓ UNKNOWN';
      
      console.log(`   ${layer.name}: ${status}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    }
  });
  
  console.log(`\n💾 Full results saved to: window.phase1ValidationResults`);
  window.phase1ValidationResults = results;
  
  console.log('\n✅ Phase 1 validation test complete!');
  
  return results;
})();
