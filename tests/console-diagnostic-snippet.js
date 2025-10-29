/**
 * 🩺 Map Shine Diagnostic Snippet - Run in Foundry VTT Console
 * 
 * Copy and paste this entire script into your browser console (F12)
 * while in a Foundry VTT scene with working clouds
 */

(async function mapShineDiagnostic() {
  console.log('%c🩺 Map Shine Diagnostic Tool', 'color: #2196F3; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(70));
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    foundry: {},
    mapShine: {},
    effects: {},
    scene: {},
    canvas: {}
  };
  
  // Basic Foundry checks
  console.log('\n🔍 Foundry VTT Status:');
  try {
    diagnostics.foundry.gameReady = !!window.game;
    diagnostics.foundry.gameVersion = game?.version;
    diagnostics.foundry.userId = game?.user?.id;
    diagnostics.foundry.isGM = game?.user?.isGM;
    
    console.log(`   Game Ready: ${diagnostics.foundry.gameReady ? '✅' : '❌'}`);
    console.log(`   Version: ${diagnostics.foundry.gameVersion || 'Unknown'}`);
    console.log(`   User: ${diagnostics.foundry.userId} (${diagnostics.foundry.isGM ? 'GM' : 'Player'})`);
  } catch (error) {
    console.error(`   ❌ Foundry check failed: ${error.message}`);
  }
  
  // Map Shine status
  console.log('\n🔍 Map Shine Status:');
  try {
    diagnostics.mapShine.loaded = !!window.game?.mapShine;
    diagnostics.mapShine.initialized = game?.mapShine?.initialized;
    diagnostics.mapShine.developmentMode = game?.mapShine?.isDevelopmentMode;
    diagnostics.mapShine.version = game?.mapShine?.version;
    
    console.log(`   Loaded: ${diagnostics.mapShine.loaded ? '✅' : '❌'}`);
    console.log(`   Initialized: ${diagnostics.mapShine.initialized ? '✅' : '❌'}`);
    console.log(`   Development Mode: ${diagnostics.mapShine.developmentMode ? '✅' : '❌'}`);
    console.log(`   Version: ${diagnostics.mapShine.version || 'Unknown'}`);
    
    if (game?.mapShine) {
      console.log('\n🔍 Map Shine Managers:');
      const managers = ['profileManager', 'resourceManager', 'effectTargetManager', 'windManager', 'sceneChangeManager'];
      managers.forEach(manager => {
        const available = !!game.mapShine[manager];
        diagnostics.mapShine[manager] = available;
        console.log(`   ${manager}: ${available ? '✅ Available' : '❌ Missing'}`);
      });
    }
  } catch (error) {
    console.error(`   ❌ Map Shine check failed: ${error.message}`);
  }
  
  // Canvas status
  console.log('\n🔍 Canvas Status:');
  try {
    diagnostics.canvas.ready = !!window.canvas?.ready;
    diagnostics.canvas.hasApp = !!window.canvas?.app;
    diagnostics.canvas.hasRenderer = !!window.canvas?.app?.renderer;
    diagnostics.canvas.layerCount = canvas?.layers?.length || 0;
    
    console.log(`   Ready: ${diagnostics.canvas.ready ? '✅' : '❌'}`);
    console.log(`   App: ${diagnostics.canvas.hasApp ? '✅' : '❌'}`);
    console.log(`   Renderer: ${diagnostics.canvas.hasRenderer ? '✅' : '❌'}`);
    console.log(`   Layer Count: ${diagnostics.canvas.layerCount}`);
  } catch (error) {
    console.error(`   ❌ Canvas check failed: ${error.message}`);
  }
  
  // Scene status
  console.log('\n🔍 Scene Status:');
  try {
    diagnostics.scene.loaded = !!window.canvas?.scene;
    diagnostics.scene.id = canvas?.scene?.id;
    diagnostics.scene.name = canvas?.scene?.name;
    diagnostics.scene.darkness = canvas?.scene?.darkness;
    
    console.log(`   Loaded: ${diagnostics.scene.loaded ? '✅' : '❌'}`);
    console.log(`   Name: ${diagnostics.scene.name || 'Unknown'}`);
    console.log(`   ID: ${diagnostics.scene.id || 'Unknown'}`);
    console.log(`   Darkness: ${diagnostics.scene.darkness || 'Unknown'}`);
  } catch (error) {
    console.error(`   ❌ Scene check failed: ${error.message}`);
  }
  
  // Effect class availability
  console.log('\n🔍 Effect Class Availability:');
  const effectClasses = [
    'MetallicShineLayer',
    'CloudShadowsLayer', 
    'LightningLayer',
    'CanopyLayer',
    'GroundGlowLayer',
    'StructuralShadowsLayer',
    'IridescenceLayer',
    'GodRaysLayer',
    'FlowMapRipplesLayer',
    'WaterSurfaceLayer', 
    'RainDropRipplesLayer',
    'StarfieldLayer',
    'BiofilmLayer'
  ];
  
  const availableClasses = [];
  const missingClasses = [];
  
  effectClasses.forEach(className => {
    const available = typeof window[className] !== 'undefined';
    if (available) {
      availableClasses.push(className);
      diagnostics.effects[className] = { available: true, type: window[className]?.constructor?.name || 'Function' };
    } else {
      missingClasses.push(className);
      diagnostics.effects[className] = { available: false };
    }
  });
  
  console.log(`   Available Classes: ${availableClasses.length}/${effectClasses.length}`);
  console.log(`   ✅ Available: ${availableClasses.join(', ') || 'None'}`);
  console.log(`   ❌ Missing: ${missingClasses.join(', ') || 'None'}`);
  
  // Active layer detection
  console.log('\n🔍 Active Effect Layers:');
  try {
    const activeLayers = [];
    const inactiveLayers = [];
    
    effectClasses.forEach(className => {
      const EffectClass = window[className];
      if (EffectClass) {
        const layer = canvas?.layers?.find(l => l instanceof EffectClass);
        if (layer) {
          activeLayers.push({
            name: className,
            visible: layer.visible,
            initialized: layer.initialized,
            hasFilter: !!(layer.cloudShadowsFilter || layer.metallicShineFilter || layer.filter)
          });
        } else {
          inactiveLayers.push({ name: className, reason: 'instance_not_found' });
        }
      } else {
        inactiveLayers.push({ name: className, reason: 'class_not_defined' });
      }
    });
    
    console.log(`   Active Layers: ${activeLayers.length}`);
    activeLayers.forEach(layer => {
      console.log(`      ✅ ${layer.name} (visible: ${layer.visible}, initialized: ${layer.initialized}, filter: ${layer.hasFilter})`);
    });
    
    console.log(`   Inactive Layers: ${inactiveLayers.length}`);
    inactiveLayers.forEach(layer => {
      console.log(`      ❌ ${layer.name} (${layer.reason})`);
    });
    
    diagnostics.activeLayers = activeLayers;
    diagnostics.inactiveLayers = inactiveLayers;
  } catch (error) {
    console.error(`   ❌ Layer detection failed: ${error.message}`);
  }
  
  // Cloud-specific checks (since you mentioned clouds are working)
  console.log('\n☁️  Cloud System Specific Checks:');
  try {
    const cloudLayer = canvas?.layers?.find(l => l.constructor.name === 'CloudShadowsLayer');
    if (cloudLayer) {
      console.log(`   Cloud Layer Found: ✅`);
      console.log(`   Visible: ${cloudLayer.visible}`);
      console.log(`   Initialized: ${cloudLayer.initialized}`);
      console.log(`   CloudShadowsFilter: ${!!cloudLayer.cloudShadowsFilter ? '✅' : '❌'}`);
      
      if (cloudLayer.cloudShadowsFilter) {
        console.log(`   Filter Class: ${cloudLayer.cloudShadowsFilter.constructor.name}`);
        console.log(`   GL Program: ${!!cloudLayer.cloudShadowsFilter.glProgram ? '✅' : '❌'}`);
        
        if (cloudLayer.cloudShadowsFilter.glProgram) {
          console.log(`   Fragment Shader Compiled: ${cloudLayer.cloudShadowsFilter.glProgram.fragmentShader?.glShader !== null ? '✅' : '❌'}`);
          console.log(`   Vertex Shader Compiled: ${cloudLayer.cloudShadowsFilter.glProgram.vertexShader?.glShader !== null ? '✅' : '❌'}`);
        }
        
        if (cloudLayer.cloudShadowsFilter.uniforms) {
          const uniformNames = Object.keys(cloudLayer.cloudShadowsFilter.uniforms);
          console.log(`   Uniforms (${uniformNames.length}): ${uniformNames.join(', ')}`);
        }
      }
      
      console.log(`   Cloud Texture Validation Method: ${typeof cloudLayer._validateCloudTexture === 'function' ? '✅ Available' : '❌ Missing'}`);
      
      if (typeof cloudLayer._validateCloudTexture === 'function') {
        try {
          const textureValid = cloudLayer._validateCloudTexture();
          console.log(`   Cloud Texture Valid: ${textureValid ? '✅' : '❌'}`);
        } catch (error) {
          console.log(`   Cloud Texture Validation Error: ${error.message}`);
        }
      }
    } else {
      console.log(`   Cloud Layer Found: ❌`);
      
      // Look for any cloud-related layer
      const cloudRelatedLayers = canvas?.layers?.filter(l => 
        l.constructor.name.toLowerCase().includes('cloud') ||
        (l.constructor.name === 'WeatherEffectLayer' && l.cloudShadowsFilter)
      );
      
      if (cloudRelatedLayers.length > 0) {
        console.log(`   Cloud-Related Layers Found: ${cloudRelatedLayers.length}`);
        cloudRelatedLayers.forEach((layer, i) => {
          console.log(`      ${i + 1}. ${layer.constructor.name} (visible: ${layer.visible})`);
        });
      }
    }
  } catch (error) {
    console.error(`   ❌ Cloud checks failed: ${error.message}`);
  }
  
  // Resource manager cloud texture
  console.log('\n🎨 Resource Manager Cloud Texture:');
  try {
    if (game?.mapShine?.resourceManager) {
      const cloudTexture = game.mapShine.resourceManager.getRawCloudTexture(0);
      if (cloudTexture) {
        console.log(`   Cloud Texture Available: ✅`);
        console.log(`   Texture Valid: ${cloudTexture.valid ? '✅' : '❌'}`);
        console.log(`   Texture Size: ${cloudTexture.width}x${cloudTexture.height}`);
        console.log(`   Texture UUID: ${cloudTexture.baseTexture?.uid || 'Unknown'}`);
      } else {
        console.log(`   Cloud Texture Available: ❌`);
      }
    } else {
      console.log(`   Resource Manager: ❌ Not available`);
    }
  } catch (error) {
    console.error(`   ❌ Resource manager check failed: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('%c📋 Diagnostic Summary', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
  console.log('='.repeat(70));
  
  console.log(`\n🎯 Key Findings:`);
  console.log(`   Map Shine: ${diagnostics.mapShine.loaded && diagnostics.mapShine.initialized ? '✅ Fully Ready' : '⚠️  Issues Found'}`);
  console.log(`   Effect Classes: ${availableClasses.length > 0 ? `✅ ${availableClasses.length} Available` : '❌ None Available'}`);
  console.log(`   Active Layers: ${diagnostics.activeLayers?.length || 0}`);
  console.log(`   Cloud System: ${missingClasses.includes('CloudShadowsLayer') ? '❌ Class Missing' : '🔍 Check Details'}`);
  
  console.log(`\n🔗 Full diagnostic data available in: window.mapShineDiagnostics`);
  window.mapShineDiagnostics = diagnostics;
  
  console.log('\n✅ Diagnostic complete! Copy the full output and share it for analysis.');
  
  return diagnostics;
})();
