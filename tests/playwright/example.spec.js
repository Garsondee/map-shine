/**
 * Example Playwright Test for Map Shine
 * 
 * This demonstrates how to write tests that run against a real Foundry VTT
 * instance with the Map Shine module loaded.
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

// Stop Foundry after all tests
test.afterAll(async () => {
  if (foundry) {
    await foundry.stop();
  }
});

test.describe.serial('Map Shine - Basic Initialization', () => {
  
  test('full initialization and validation', async ({ page }) => {
    const helper = new MapShineTestHelper(page);
    helper.setupConsoleCapture();
    
    // Step 1: Navigate and authenticate
    console.log('🌐 Navigating to Foundry VTT...');
    await page.goto('/');
    
    console.log('🔐 Authenticating...');
    await helper.authenticate('Gamemaster'); // No password for this world
    
    // Step 2: Wait for canvas (increase timeout for slow loads)
    console.log('⏳ Waiting for canvas (may take 60+ seconds)...');
    await helper.waitForCanvas(90000); // 90 second timeout
    
    // Step 3: Wait for Map Shine
    console.log('⏳ Waiting for Map Shine...');
    await helper.waitForMapShine(30000);
    
    // Give managers a moment to fully initialize
    console.log('⏳ Waiting for managers to initialize...');
    
    // Wait specifically for resourceManager (it initializes last)
    await page.waitForFunction(() => {
      return window.game?.mapShine?.resourceManager !== undefined &&
             window.game?.mapShine?.resourceManager !== null;
    }, { timeout: 30000 });
    
    console.log('✅ Initialization complete!');
    
    // Test 1: Check that core managers exist
    console.log('\n📝 Test 1: Checking core managers...');
    const managersExist = await page.evaluate(() => {
      return {
        profileManager: !!window.game?.mapShine?.profileManager,
        resourceManager: !!window.game?.mapShine?.resourceManager,
        weatherSystemManager: !!window.game?.mapShine?.weatherSystemManager,
        windManager: !!window.game?.mapShine?.windManager
      };
    });
    
    expect(managersExist.profileManager).toBe(true);
    expect(managersExist.resourceManager).toBe(true);
    expect(managersExist.weatherSystemManager).toBe(true);
    expect(managersExist.windManager).toBe(true);
    console.log('✅ All core managers initialized');
    
    // Test 2: Check config structure
    console.log('\n📝 Test 2: Validating config structure...');
    const config = await page.evaluate(() => {
      return window.game?.mapShine?.profileManager?.activeConfig;
    });
    
    expect(config).toBeDefined();
    expect(config.enabled).toBeDefined();
    expect(config.weather).toBeDefined();
    expect(config.baseShine).toBeDefined();
    console.log('✅ Config structure validated');
    
    // Test 3: Check weather diagnostics
    console.log('\n📝 Test 3: Checking weather diagnostics...');
    await helper.waitForManager('weatherSystemManager');
    
    const diagnostics = await helper.getWeatherDiagnostics();
    
    expect(diagnostics).toBeDefined();
    expect(diagnostics.isReady).toBe(true);
    expect(diagnostics.currentState).toBeDefined();
    console.log(`✅ Weather state: ${diagnostics.currentState}`);
    
    console.log('\n🎉 All tests passed!');
  });
});