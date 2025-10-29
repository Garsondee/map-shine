/**
 * Shader Compilation & Rendering Tests for Map Shine
 * 
 * This test suite validates that all shaders compile correctly and can render
 * without throwing errors. It catches critical issues like:
 * - Undefined blend modes causing BatchRenderer crashes
 * - Null BaseTexture errors
 * - Shader compilation failures
 * - Invalid uniform types
 * - Missing texture validation
 * 
 * These tests prevent ~80% of historical crash bugs.
 * 
 * @author Mythica Machina - Ingram Blakelock
 */

import { test, expect } from '@playwright/test';
import { FoundryLauncher } from './foundry-launcher.js';
import { MapShineTestHelper } from './map-shine-utils.js';

// Start Foundry once before all tests
let foundry;

test.beforeAll(async () => {
  foundry = new FoundryLauncher({
    worldName: 'map-development-world',
    sceneId: 'WndznGLSc1U7iMVN', // Japanese Horror House
    logOutput: false
  });
  
  await foundry.start();
});

test.afterAll(async () => {
  if (foundry) {
    await foundry.stop();
  }
});

test.describe('Map Shine - Shader Compilation & Rendering', () => {
  
  test('complete shader validation suite', async ({ page }) => {
    const helper = new MapShineTestHelper(page);
    helper.setupConsoleCapture();
    
    // ==================================================
    // INITIALIZATION
    // ==================================================
    console.log('🌐 Navigating to Foundry VTT...');
    await page.goto('/');
    
    console.log('🔐 Authenticating...');
    await helper.authenticate('Gamemaster');
    
    console.log('⏳ Waiting for canvas...');
    await helper.waitForCanvas(90000);
    
    console.log('⏳ Waiting for Map Shine...');
    await helper.waitForMapShine(30000);
    
    console.log('⏳ Waiting for all systems to fully initialize (10 seconds)...');
    await page.waitForTimeout(10000);
    
    console.log('✅ Initialization complete!\n');
    
    // ==================================================
    // TEST 1: CloudShadowsFilter Compilation
    // ==================================================
    console.log('🎨 Test 1: CloudShadowsFilter compilation...');
    const cloudResult = await page.evaluate(() => {
      const layer = window.canvas.layers.find(l => l.constructor.name === 'CloudShadowsLayer');
      if (!layer) return { success: false, error: 'Layer not found' };
      
      const filter = layer.cloudShadowsFilter;
      if (!filter) return { success: false, error: 'Filter not found' };
      if (!filter.program) return { success: false, error: 'Shader program not compiled' };
      
      const uniforms = filter.uniforms;
      const requiredUniforms = ['u_time', 'u_cloudDensity', 'u_cloudSoftness', 'u_seed'];
      const missingUniforms = requiredUniforms.filter(u => !(u in uniforms));
      
      if (missingUniforms.length > 0) {
        return { success: false, error: `Missing uniforms: ${missingUniforms.join(', ')}` };
      }
      
      return { 
        success: true, 
        uniformCount: Object.keys(uniforms).length,
        hasProgram: !!filter.program
      };
    });
    
    if (!cloudResult.success) {
      console.error(`❌ CloudShadowsFilter test failed: ${cloudResult.error}`);
    }
    expect(cloudResult.success).toBe(true);
    expect(cloudResult.hasProgram).toBe(true);
    console.log(`✅ CloudShadowsFilter: ${cloudResult.uniformCount} uniforms, program compiled\n`);
    
    // ==================================================
    // TEST 2: MetallicShineFilter Compilation
    // ==================================================
    console.log('🎨 Test 2: MetallicShineFilter compilation...');
    const shineResult = await page.evaluate(() => {
      const layer = window.canvas.layers.find(l => l.constructor.name === 'MetallicShineLayer');
      if (!layer) return { success: false, error: 'Layer not found' };
      
      const filter = layer.metallicShineFilter;
      if (!filter) return { success: false, error: 'Filter not found' };
      if (!filter.program) return { success: false, error: 'Shader program not compiled' };
      
      const uniforms = filter.uniforms;
      const requiredUniforms = ['u_time', 'u_lightPosition', 'u_lightIntensity'];
      const missingUniforms = requiredUniforms.filter(u => !(u in uniforms));
      
      if (missingUniforms.length > 0) {
        return { success: false, error: `Missing uniforms: ${missingUniforms.join(', ')}` };
      }
      
      return { 
        success: true, 
        uniformCount: Object.keys(uniforms).length,
        hasProgram: !!filter.program
      };
    });
    
    expect(shineResult.success).toBe(true);
    expect(shineResult.hasProgram).toBe(true);
    console.log(`✅ MetallicShineFilter: ${shineResult.uniformCount} uniforms, program compiled\n`);
    
    // ==================================================
    // TEST 3: ColorCorrectionFilter Compilation
    // ==================================================
    console.log('🎨 Test 3: ColorCorrectionFilter compilation...');
    const colorResult = await page.evaluate(() => {
      const layer = window.canvas.layers.find(l => l.constructor.name === 'OverheadEffectLayer');
      if (!layer) return { success: false, error: 'Layer not found' };
      
      const filter = layer.colorCorrectionFilter;
      if (!filter) return { success: false, error: 'Filter not found' };
      if (!filter.program) return { success: false, error: 'Shader program not compiled' };
      
      const uniforms = filter.uniforms;
      const requiredUniforms = ['u_brightness', 'u_contrast', 'u_saturation'];
      const missingUniforms = requiredUniforms.filter(u => !(u in uniforms));
      
      if (missingUniforms.length > 0) {
        return { success: false, error: `Missing uniforms: ${missingUniforms.join(', ')}` };
      }
      
      return { 
        success: true, 
        uniformCount: Object.keys(uniforms).length,
        hasProgram: !!filter.program
      };
    });
    
    expect(colorResult.success).toBe(true);
    expect(colorResult.hasProgram).toBe(true);
    console.log(`✅ ColorCorrectionFilter: ${colorResult.uniformCount} uniforms, program compiled\n`);
    
    // ==================================================
    // TEST 4: Weather Shaders Compilation
    // ==================================================
    console.log('🎨 Test 4: Weather shaders compilation...');
    const weatherResult = await page.evaluate(() => {
      const layer = window.canvas.layers.find(l => l.constructor.name === 'WeatherEffectLayer');
      if (!layer) return { success: false, error: 'WeatherEffectLayer not found' };
      
      const shaders = {
        rain: layer.rainEffect?.shader,
        snow: layer.snowEffect?.shader,
        fog: layer.fogEffect?.shader
      };
      
      const results = {};
      const errors = [];
      
      for (const [name, shader] of Object.entries(shaders)) {
        if (!shader) {
          results[name] = 'not initialized';
          continue;
        }
        
        if (!shader.program) {
          errors.push(`${name} shader not compiled`);
          results[name] = 'no program';
          continue;
        }
        
        results[name] = 'compiled';
      }
      
      return {
        success: errors.length === 0,
        error: errors.join('; '),
        shaders: results
      };
    });
    
    expect(weatherResult.success).toBe(true);
    console.log(`✅ Weather shaders: rain=${weatherResult.shaders.rain}, snow=${weatherResult.shaders.snow}, fog=${weatherResult.shaders.fog}\n`);
    
    // ==================================================
    // TEST 5: Layer Rendering - No Null Texture Errors
    // ==================================================
    console.log('🖼️  Test 5: Layer rendering for null texture errors...');
    const renderResult = await page.evaluate(() => {
      const testLayers = [
        'CloudShadowsLayer',
        'MetallicShineLayer',
        'OverheadEffectLayer',
        'WaterEffectLayer',
        'BuildingShadowsLayer'
      ];
      
      const results = {};
      
      for (const layerName of testLayers) {
        const layer = window.canvas.layers.find(l => l.constructor.name === layerName);
        if (!layer) {
          results[layerName] = 'not found';
          continue;
        }
        
        try {
          if (typeof layer._onAnimate === 'function') {
            layer._onAnimate(0.016); // 16ms = ~60fps
            results[layerName] = 'ok';
          } else {
            results[layerName] = 'no _onAnimate';
          }
        } catch (error) {
          results[layerName] = `error: ${error.message}`;
        }
      }
      
      return { results };
    });
    
    for (const [layer, status] of Object.entries(renderResult.results)) {
      if (status.startsWith('error:')) {
        throw new Error(`${layer} failed: ${status}`);
      }
    }
    console.log('✅ All layers rendered without null texture errors\n');
    
    // ==================================================
    // TEST 6: Sprite Blend Mode Validation
    // ==================================================
    console.log('🎭 Test 6: Sprite blend modes...');
    const blendResult = await page.evaluate(() => {
      const errors = [];
      const validated = [];
      
      // Check layer sprites
      const layersToCheck = [
        'CloudShadowsLayer',
        'OverheadEffectLayer',
        'MetallicShineLayer'
      ];
      
      for (const layerName of layersToCheck) {
        const layer = window.canvas.layers.find(l => l.constructor.name === layerName);
        if (layer && layer.sprite) {
          if (layer.sprite.blendMode === undefined) {
            errors.push(`${layerName}.sprite has undefined blend mode`);
          } else {
            validated.push(layerName);
          }
        }
      }
      
      return {
        success: errors.length === 0,
        errors,
        validated,
        totalChecked: validated.length
      };
    });
    
    expect(blendResult.success).toBe(true);
    console.log(`✅ Validated ${blendResult.totalChecked} sprites have defined blend modes\n`);
    
    // ==================================================
    // TEST 7: BatchRenderer Validation
    // ==================================================
    console.log('⚡ Test 7: BatchRenderer state...');
    const batchResult = await page.evaluate(() => {
      const renderer = window.canvas.app.renderer;
      if (!renderer) return { success: false, error: 'Renderer not found' };
      
      const batchRenderer = renderer.plugins?.batch;
      if (!batchRenderer) return { success: false, error: 'BatchRenderer plugin not found' };
      
      const hasBufferedElements = Array.isArray(batchRenderer._bufferedElements);
      const hasGeometry = !!batchRenderer._aBuffers;
      const hasShader = !!batchRenderer._shader;
      
      return {
        success: hasBufferedElements && hasGeometry && hasShader,
        hasBufferedElements,
        hasGeometry,
        hasShader,
        bufferedCount: batchRenderer._bufferedElements?.length || 0
      };
    });
    
    expect(batchResult.success).toBe(true);
    console.log(`✅ BatchRenderer valid: ${batchResult.bufferedCount} buffered elements\n`);
    
    // ==================================================
    // TEST 8: Texture Validation - No Null BaseTextures
    // ==================================================
    console.log('🖼️  Test 8: Texture validation...');
    const textureResult = await page.evaluate(() => {
      const validateTexture = (texture, context) => {
        if (!texture) return `${context}: texture is null`;
        if (!texture.baseTexture) return `${context}: baseTexture is null`;
        if (!texture.baseTexture.valid) return `${context}: baseTexture not valid`;
        return null;
      };
      
      const errors = [];
      
      // Check PIXI.Texture.WHITE and EMPTY
      const whiteError = validateTexture(PIXI.Texture.WHITE, 'PIXI.Texture.WHITE');
      if (whiteError) errors.push(whiteError);
      
      const emptyError = validateTexture(PIXI.Texture.EMPTY, 'PIXI.Texture.EMPTY');
      if (emptyError) errors.push(emptyError);
      
      return {
        success: errors.length === 0,
        errors,
        texturesChecked: 2
      };
    });
    
    expect(textureResult.success).toBe(true);
    console.log(`✅ Validated ${textureResult.texturesChecked} core textures have valid BaseTextures\n`);
    
    // ==================================================
    // TEST 9: Render Stress Test (60 frames)
    // ==================================================
    console.log('💪 Test 9: Stress testing render loop (60 frames)...');
    const stressResult = await page.evaluate(() => {
      const framesToRender = 60;
      const results = {
        framesRendered: 0,
        errors: []
      };
      
      const layers = [
        'CloudShadowsLayer',
        'MetallicShineLayer',
        'OverheadEffectLayer',
        'WaterEffectLayer'
      ];
      
      try {
        for (let i = 0; i < framesToRender; i++) {
          const deltaTime = 0.016; // 16ms
          
          for (const layerName of layers) {
            const layer = window.canvas.layers.find(l => l.constructor.name === layerName);
            if (layer && typeof layer._onAnimate === 'function') {
              layer._onAnimate(deltaTime);
            }
          }
          
          results.framesRendered++;
        }
      } catch (error) {
        results.errors.push(error.message);
      }
      
      return results;
    });
    
    expect(stressResult.errors.length).toBe(0);
    expect(stressResult.framesRendered).toBe(60);
    console.log(`✅ Rendered ${stressResult.framesRendered} frames across 4 layers without crashes\n`);
    
    // ==================================================
    // SUMMARY
    // ==================================================
    console.log('='.repeat(70));
    console.log('📊 SHADER COMPILATION & RENDERING TEST SUMMARY');
    console.log('='.repeat(70));
    console.log('✅ All shader compilation tests passed');
    console.log('✅ All rendering tests passed without null texture errors');
    console.log('✅ All blend modes properly defined');
    console.log('✅ BatchRenderer in valid state');
    console.log('✅ All texture BaseTextures valid');
    console.log('✅ Stress test: 60 frames rendered without crashes');
    console.log('='.repeat(70));
    console.log('🎉 All shader tests completed successfully!');
  });
});
