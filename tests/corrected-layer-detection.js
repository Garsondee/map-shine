/**
 * 🔧 Corrected Map Shine Layer Detection - Run in Foundry VTT Console
 * 
 * This looks for layers in the actual canvas.layers array where they really exist
 */

(function correctedLayerDetection() {
  console.log('%c🔧 Corrected Layer Detection', 'color: #FF9800; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(60));
  
  // Get all canvas layers
  const allLayers = canvas.layers || [];
  console.log(`\n📋 Total Canvas Layers: ${allLayers.length}`);
  
  // Look for Map Shine layers by examining layer properties
  const mapShineLayers = [];
  const otherLayers = [];
  
  allLayers.forEach((layer, index) => {
    const layerInfo = {
      index,
      name: layer.constructor.name,
      visible: layer.visible,
      initialized: layer.initialized,
      hasWeatherEffectLayer: !!layer.weatherEffectLayer,
      hasCloudShadowsFilter: !!layer.cloudShadowsFilter,
      hasMetallicShineFilter: !!layer.metallicShineFilter,
      hasFilter: !!layer.filter,
      isMapShine: false
    };
    
    // Check if this is a Map Shine layer by various indicators
    if (layerInfo.name.includes('Shine') || 
        layerInfo.name.includes('Cloud') ||
        layerInfo.name.includes('Animated') ||
        layerInfo.hasWeatherEffectLayer ||
        layerInfo.hasCloudShadowsFilter ||
        layerInfo.hasMetallicShineFilter) {
      layerInfo.isMapShine = true;
      mapShineLayers.push(layerInfo);
    } else {
      otherLayers.push(layerInfo);
    }
  });
  
  console.log(`\n🎯 Map Shine Layers Found: ${mapShineLayers.length}`);
  mapShineLayers.forEach(layer => {
    console.log(`   ✅ ${layer.name} (visible: ${layer.visible}, index: ${layer.index})`);
    if (layer.hasCloudShadowsFilter) console.log(`      └─ CloudShadowsFilter: ✅`);
    if (layer.hasMetallicShineFilter) console.log(`      └─ MetallicShineFilter: ✅`);
    if (layer.hasWeatherEffectLayer) console.log(`      └─ WeatherEffectLayer: ✅`);
  });
  
  console.log(`\n📋 Other Layers: ${otherLayers.length}`);
  otherLayers.slice(0, 10).forEach(layer => {
    console.log(`   📄 ${layer.name} (visible: ${layer.visible})`);
  });
  if (otherLayers.length > 10) {
    console.log(`   ... and ${otherLayers.length - 10} more`);
  }
  
  // Test the specific cloud layer
  console.log(`\n☁️  Cloud Layer Deep Dive:`);
  const cloudLayers = allLayers.filter(l => l.constructor.name.toLowerCase().includes('cloud') || l.cloudShadowsFilter);
  
  if (cloudLayers.length > 0) {
    cloudLayers.forEach((cloudLayer, i) => {
      console.log(`\n   Cloud Layer ${i + 1}:`);
      console.log(`      Name: ${cloudLayer.constructor.name}`);
      console.log(`      Visible: ${cloudLayer.visible}`);
      console.log(`      Initialized: ${cloudLayer.initialized}`);
      
      if (cloudLayer.cloudShadowsFilter) {
        console.log(`      🎨 Filter Analysis:`);
        const filter = cloudLayer.cloudShadowsFilter;
        console.log(`         Filter Class: ${filter.constructor.name}`);
        console.log(`         GL Program: ${!!filter.glProgram ? '✅' : '❌'}`);
        
        if (filter.glProgram) {
          console.log(`         Fragment Shader: ${filter.glProgram.fragmentShader?.glShader !== null ? '✅ Compiled' : '❌ Failed'}`);
          console.log(`         Vertex Shader: ${filter.glProgram.vertexShader?.glShader !== null ? '✅ Compiled' : '❌ Failed'}`);
        }
        
        if (filter.uniforms) {
          const uniforms = Object.keys(filter.uniforms);
          console.log(`         Uniforms (${uniforms.length}): ${uniforms.join(', ')}`);
          
          // Check critical cloud uniforms
          const criticalUniforms = ['uCloudTexture', 'uCloudTextureSize', 'uCloudThreshold', 'uTime'];
          const missing = criticalUniforms.filter(u => !(u in filter.uniforms));
          if (missing.length === 0) {
            console.log(`         ✅ All critical uniforms present`);
          } else {
            console.log(`         ❌ Missing uniforms: ${missing.join(', ')}`);
          }
        }
      }
      
      // Check for validation methods
      console.log(`      🔍 Validation Methods:`);
      const validationMethods = ['_validateStartupState', '_validateCloudTexture', '_validateTextures', '_validateShaders'];
      validationMethods.forEach(method => {
        const available = typeof cloudLayer[method] === 'function';
        console.log(`         ${method}: ${available ? '✅' : '❌'}`);
      });
      
      // Test validation if available
      if (typeof cloudLayer._validateCloudTexture === 'function') {
        try {
          const result = cloudLayer._validateCloudTexture();
          console.log(`      🧪 Cloud Texture Validation: ${result ? '✅ Passed' : '❌ Failed'}`);
        } catch (error) {
          console.log(`      🧪 Cloud Texture Validation Error: ${error.message}`);
        }
      }
      
      if (typeof cloudLayer._validateStartupState === 'function') {
        try {
          console.log(`      🧪 Running startup validation...`);
          cloudLayer._validateStartupState();
          console.log(`      🧪 Startup Validation: ✅ Completed (check console for details)`);
        } catch (error) {
          console.log(`      🧪 Startup Validation Error: ${error.message}`);
        }
      }
    });
  } else {
    console.log(`   ❌ No cloud layers found in canvas.layers`);
  }
  
  console.log(`\n✅ Corrected detection complete!`);
  console.log(`🔗 Results saved to: window.correctedLayerResults`);
  
  window.correctedLayerResults = {
    totalLayers: allLayers.length,
    mapShineLayers,
    otherLayers,
    cloudLayers
  };
  
})();
