/**
 * UI Slider Validation Tests for Map Shine
 * 
 * This test suite validates that all UI sliders are properly connected to their
 * underlying configuration data. It catches critical bugs where sliders become
 * "detached" and stop working.
 * 
 * Tests performed:
 * - All sliders have data-path attributes
 * - All data-path attributes map to real config properties
 * - Slider values match config values
 * - Changing slider values updates config (round-trip test)
 * - No duplicate slider IDs
 * - All sliders have valid min/max/step attributes
 * 
 * @author Mythica Machina - Ingram Blakelock
 */

import { test, expect } from '@playwright/test';
import { FoundryLauncher } from './foundry-launcher.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { MapShineTestHelper } from './map-shine-utils.js';

// Start Foundry once before all tests
let foundry;

test.beforeAll(async () => {
  foundry = new FoundryLauncher({
    worldName: 'map-development-world',
    sceneId: 'WndznGLSc1U7iMVN',
    logOutput: false
  });
  
  await foundry.start();
});

test.afterAll(async () => {
  if (foundry) {
    await foundry.stop();
  }
});

test.describe('Map Shine - UI Slider Validation', () => {
  
  test('complete slider connection validation', async ({ page }) => {
    const helper = new MapShineTestHelper(page);
    helper.setupConsoleCapture();
    
    // ==================================================
    // INITIALIZATION
    // ==================================================
    console.log('🌐 Navigating to Foundry VTT...');
    
    // Clear browser cache before loading to ensure fresh module code
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    console.log('🔐 Authenticating...');
    await helper.authenticate('Gamemaster');
    
    console.log('⏳ Waiting for canvas...');
    await helper.waitForCanvas(90000);
    
    console.log('⏳ Waiting for Map Shine...');
    await helper.waitForMapShine(30000);
    
    console.log('⏳ Waiting for systems to initialize...');
    await page.waitForTimeout(5000);
    
    // Unpause the game (Foundry loads paused by default)
    console.log('▶️  Checking pause state...');
    await helper.unpauseGame();
    
    // Enable advanced UI mode (MaterialEditorDebugger instead of SimpleUIPanel)
    console.log('🔧 Enabling advanced UI mode...');
    await page.evaluate(() => {
      return game.settings.set('map-shine', 'advanced-ui-mode', true);
    });
    
    // Create a fresh config from current MODULE_DEFAULTS to ensure all properties exist
    console.log('🔄 Applying fresh config from MODULE_DEFAULTS...');
    await page.evaluate(() => {
      const pm = game.mapShine.profileManager;
      // Set active config directly to a clean copy of MODULE_DEFAULTS
      pm.activeConfig = foundry.utils.deepClone(game.mapShine.MODULE_DEFAULTS);
      // Update all systems to apply the config
      return pm.updateAllSystemsFromConfig();
    });
    
    console.log('⏳ Waiting for settings to apply...');
    await page.waitForTimeout(1000);
    
    console.log('✅ Initialization complete!\n');
    
    // ==================================================
    // OPEN MAP SHINE UI (Try Multiple Methods)
    // ==================================================
    console.log('🎛️  Opening Map Shine UI (MaterialEditorDebugger)...');
    
    // Method 1: Try keyboard shortcut (Ctrl+Shift+M)
    console.log('  Trying keyboard shortcut (Ctrl+Shift+M)...');
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('M');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await page.waitForTimeout(2000);
    
    // Check if UI opened
    let uiInfo = await page.evaluate(() => {
      const debuggerUI = document.querySelector('#material-editor-debugger');
      const simpleUI = document.querySelector('.map-shine-simple-ui');
      const activeEditor = window.game.mapShine.activeEditor;
      
      return {
        hasDebuggerUI: !!debuggerUI,
        hasSimpleUI: !!simpleUI,
        hasActiveEditor: !!activeEditor,
        editorType: activeEditor ? activeEditor.constructor.name : null,
        method: 'keyboard'
      };
    });
    
    // Method 2: Try toolbar button if keyboard didn't work
    if (!uiInfo.hasDebuggerUI && !uiInfo.hasSimpleUI) {
      console.log('  Trying toolbar button click...');
      try {
        await page.click('button[data-tool="mapShine"]', { timeout: 5000 });
        await page.waitForTimeout(2000);
        
        uiInfo = await page.evaluate(() => {
          const debuggerUI = document.querySelector('#material-editor-debugger');
          const simpleUI = document.querySelector('.map-shine-simple-ui');
          const activeEditor = window.game.mapShine.activeEditor;
          
          return {
            hasDebuggerUI: !!debuggerUI,
            hasSimpleUI: !!simpleUI,
            hasActiveEditor: !!activeEditor,
            editorType: activeEditor ? activeEditor.constructor.name : null,
            method: 'toolbar'
          };
        });
      } catch (e) {
        console.log('  Toolbar button not found or not clickable');
      }
    }
    
    // Method 3: Try showEditor() function if others didn't work
    if (!uiInfo.hasDebuggerUI && !uiInfo.hasSimpleUI) {
      console.log('  Trying showEditor() function...');
      uiInfo = await page.evaluate(() => {
        window.game.mapShine.showEditor();
        
        return new Promise(resolve => {
          setTimeout(() => {
            const debuggerUI = document.querySelector('#material-editor-debugger');
            const simpleUI = document.querySelector('.map-shine-simple-ui');
            const activeEditor = window.game.mapShine.activeEditor;
            
            resolve({
              hasDebuggerUI: !!debuggerUI,
              hasSimpleUI: !!simpleUI,
              hasActiveEditor: !!activeEditor,
              editorType: activeEditor ? activeEditor.constructor.name : null,
              method: 'showEditor'
            });
          }, 3000);
        });
      });
    }
    
    // Detailed diagnostics
    const diagnostics = await page.evaluate(() => {
      return {
        mapShineExists: !!window.game?.mapShine,
        showEditorExists: typeof window.game?.mapShine?.showEditor === 'function',
        debuggerExists: !!window.game?.mapShine?.debugger,
        activeEditorType: window.game?.mapShine?.activeEditor?.constructor?.name,
        allShineElements: Array.from(document.querySelectorAll('[id*="shine"], [class*="shine"]'))
          .map(el => ({ tag: el.tagName, id: el.id, class: el.className, visible: el.offsetParent !== null }))
          .slice(0, 15)
      };
    });
    
    console.log('UI Info:', JSON.stringify(uiInfo, null, 2));
    console.log('Diagnostics:', JSON.stringify(diagnostics, null, 2));
    
    const uiExists = uiInfo.hasDebuggerUI || uiInfo.hasSimpleUI;
    
    if (!uiExists) {
      console.error('❌ Map Shine UI did not open with any method');
      console.error('Active editor:', uiInfo.hasActiveEditor, uiInfo.editorType);
      console.error('Shine elements found:', diagnostics.allShineElements.length);
      throw new Error('Failed to open Map Shine UI');
    }
    
    console.log(`✅ Map Shine UI is open (method: ${uiInfo.method})\n`);
    
    // ==================================================
    // TEST 1: Count Total Map Shine Sliders
    // ==================================================
    console.log('📊 Test 1: Counting Map Shine UI sliders...');
    
    const sliderCount = await page.evaluate(() => {
      // Only count sliders within Map Shine UI containers
      const mapShineContainers = [
        '#material-editor-debugger',  // Advanced UI
        '.map-shine-simple-ui',       // Simple UI
        '.mapshine-preview-toolbar'   // Preview toolbar
      ];
      
      let count = 0;
      for (const selector of mapShineContainers) {
        const container = document.querySelector(selector);
        if (container) {
          count += container.querySelectorAll('input[type="range"]').length;
        }
      }
      return count;
    });
    
    console.log(`✅ Found ${sliderCount} Map Shine sliders in UI\n`);
    expect(sliderCount).toBeGreaterThan(0);
    
    // ==================================================
    // TEST 2: All Sliders Have data-path Attributes
    // ==================================================
    console.log('🔗 Test 2: Validating data-path attributes...');
    
    const missingPathResult = await page.evaluate(() => {
      // Only check sliders within Map Shine UI containers
      const mapShineContainers = [
        '#material-editor-debugger',  // Advanced UI
        '.map-shine-simple-ui',       // Simple UI
        '.mapshine-preview-toolbar'   // Preview toolbar
      ];
      
      let sliders = [];
      for (const selector of mapShineContainers) {
        const container = document.querySelector(selector);
        if (container) {
          sliders.push(...container.querySelectorAll('input[type="range"]'));
        }
      }
      
      const missing = [];
      let skipped = 0;
      
      console.log(`DEBUG: Found ${sliders.length} Map Shine sliders`);
      
      for (const slider of sliders) {
        // Skip special-purpose sliders that are intentionally not connected to config
        if (slider.dataset.noPath === 'true') {
          console.log(`DEBUG: Skipping slider with data-no-path: ${slider.id}`);
          skipped++;
          continue;
        }
        
        if (!slider.dataset.path) {
          console.log(`DEBUG: Slider missing data-path: ${slider.id}, has data-no-path=${slider.dataset.noPath}`);
          // Get parent context to help identify the slider
          const parentDetails = slider.closest('details');
          const parentDiv = slider.closest('div[id]');
          const label = slider.previousElementSibling?.tagName === 'LABEL' 
            ? slider.previousElementSibling.textContent 
            : slider.parentElement?.querySelector('label')?.textContent;
          
          missing.push({
            id: slider.id || 'NO_ID',
            name: slider.name || 'NO_NAME',
            min: slider.min,
            max: slider.max,
            step: slider.step,
            value: slider.value,
            label: label || 'NO_LABEL',
            parentDetailsId: parentDetails?.id || 'NO_DETAILS',
            parentDivId: parentDiv?.id || 'NO_PARENT_DIV',
            classList: Array.from(slider.classList).join(' ') || 'NO_CLASSES',
            outerHTML: slider.outerHTML.substring(0, 200) // First 200 chars
          });
        }
      }
      
      return {
        total: sliders.length,
        skipped,
        missing,
        passed: sliders.length - missing.length - skipped
      };
    });
    
    if (missingPathResult.skipped > 0) {
      console.log(`ℹ️  Skipped ${missingPathResult.skipped} special-purpose sliders (data-no-path="true")`);
    }
    
    if (missingPathResult.missing.length > 0) {
      console.error(`❌ ${missingPathResult.missing.length} sliders missing data-path:`);
      
      // Write detailed info to file for debugging
      const debugFile = path.join(__dirname, '../playwright-artifacts/missing-sliders-debug.json');
      fs.writeFileSync(debugFile, JSON.stringify(missingPathResult.missing, null, 2));
      console.error(`📄 Full details written to: ${debugFile}`);
      
      missingPathResult.missing.slice(0, 5).forEach(s => {
        console.error(`  - ${s.id} (name: ${s.name})`);
        console.error(`    Label: "${s.label}"`);
        console.error(`    Parent Details: ${s.parentDetailsId}`);
        console.error(`    Parent Div: ${s.parentDivId}`);
        console.error(`    Range: ${s.min}-${s.max}, step: ${s.step}, value: ${s.value}`);
        console.error(`    HTML: ${s.outerHTML.substring(0, 150)}...`);
        console.error('');
      });
      if (missingPathResult.missing.length > 5) {
        console.error(`  ... and ${missingPathResult.missing.length - 5} more`);
      }
    }
    
    expect(missingPathResult.missing.length).toBe(0);
    console.log(`✅ All ${missingPathResult.passed} config sliders have data-path attributes (${missingPathResult.skipped} special-purpose sliders skipped)\n`);
    
    // ==================================================
    // TEST 3: All data-path Values Map to Config
    // ==================================================
    console.log('🗺️  Test 3: Validating config path mappings...');
    
    const pathMappingResult = await page.evaluate(() => {
      // Only check sliders within Map Shine UI containers
      const mapShineContainers = [
        '#material-editor-debugger',  // Advanced UI
        '.map-shine-simple-ui',       // Simple UI
        '.mapshine-preview-toolbar'   // Preview toolbar
      ];
      
      let sliders = [];
      for (const selector of mapShineContainers) {
        const container = document.querySelector(selector);
        if (container) {
          sliders.push(...container.querySelectorAll('input[type="range"][data-path]'));
        }
      }
      
      const config = window.game.mapShine.profileManager.activeConfig;
      const invalid = [];
      const valid = [];
      
      for (const slider of sliders) {
        const path = slider.dataset.path;
        
        // Check if it's a game setting
        const isGameSetting = path.startsWith('universal.') || path.startsWith('loading-screen-');
        
        let value;
        if (isGameSetting) {
          try {
            value = game.settings.get('map-shine', path);
          } catch (e) {
            value = undefined;
          }
        } else {
          value = foundry.utils.getProperty(config, path);
        }
        
        if (value === undefined) {
          invalid.push({
            id: slider.id,
            path: path,
            isGameSetting
          });
        } else {
          valid.push({
            id: slider.id,
            path: path,
            value: value
          });
        }
      }
      
      return {
        total: sliders.length,
        valid: valid.length,
        invalid,
        examples: valid.slice(0, 3)
      };
    });
    
    if (pathMappingResult.invalid.length > 0) {
      console.error(`❌ ${pathMappingResult.invalid.length} sliders have invalid paths:`);
      pathMappingResult.invalid.slice(0, 10).forEach(s => {
        console.error(`  - ${s.id}: ${s.path} ${s.isGameSetting ? '(game setting)' : ''}`);
      });
      
      // Debug: Check what the weather config structure looks like
      const weatherConfigDebug = await page.evaluate(() => {
        const config = window.game.mapShine.profileManager.activeConfig;
        return {
          hasWeather: !!config.weather,
          hasPerformance: !!config.weather?.performance,
          performanceKeys: config.weather?.performance ? Object.keys(config.weather.performance) : [],
          performanceValues: config.weather?.performance
        };
      });
      console.error(`\n🔍 Weather config structure:`, JSON.stringify(weatherConfigDebug, null, 2));
    }
    
    expect(pathMappingResult.invalid.length).toBe(0);
    console.log(`✅ All ${pathMappingResult.valid} slider paths map to config\n`);
    
    // ==================================================
    // TEST 4: Slider Values Match Config Values
    // ==================================================
    console.log('🎯 Test 4: Validating slider/config value sync...');
    
    const valueSyncResult = await page.evaluate(() => {
      const sliders = document.querySelectorAll('input[type="range"][data-path]');
      const config = window.game.mapShine.profileManager.activeConfig;
      const mismatches = [];
      const matched = [];
      
      for (const slider of sliders) {
        const path = slider.dataset.path;
        const isGameSetting = path.startsWith('universal.') || path.startsWith('loading-screen-');
        
        let configValue;
        if (isGameSetting) {
          try {
            configValue = game.settings.get('map-shine', path);
          } catch (e) {
            continue; // Skip if setting doesn't exist
          }
        } else {
          configValue = foundry.utils.getProperty(config, path);
        }
        
        if (configValue === undefined) continue;
        
        const sliderValue = parseFloat(slider.value);
        const configNumValue = parseFloat(configValue);
        
        if (isNaN(sliderValue) || isNaN(configNumValue)) {
          mismatches.push({
            id: slider.id,
            path,
            reason: 'non-numeric',
            sliderValue,
            configValue
          });
          continue;
        }
        
        // Allow small floating-point tolerance
        const diff = Math.abs(sliderValue - configNumValue);
        if (diff > 0.001) {
          mismatches.push({
            id: slider.id,
            path,
            sliderValue,
            configValue: configNumValue,
            diff
          });
        } else {
          matched.push({
            id: slider.id,
            path,
            value: sliderValue
          });
        }
      }
      
      return {
        total: sliders.length,
        matched: matched.length,
        mismatches,
        examples: mismatches.slice(0, 5)
      };
    });
    
    if (valueSyncResult.mismatches.length > 0) {
      console.error(`❌ ${valueSyncResult.mismatches.length} value mismatches:`);
      valueSyncResult.examples.forEach(m => {
        if (m.reason === 'non-numeric') {
          console.error(`  - ${m.id} (${m.path}): slider="${m.sliderValue}", config="${m.configValue}" (non-numeric)`);
        } else {
          console.error(`  - ${m.id} (${m.path}): slider=${m.sliderValue}, config=${m.configValue}, diff=${m.diff.toFixed(4)}`);
        }
      });
    }
    
    expect(valueSyncResult.mismatches.length).toBe(0);
    console.log(`✅ All ${valueSyncResult.matched} slider values match config\n`);
    
    // ==================================================
    // TEST 5: Slider Attribute Validation
    // ==================================================
    console.log('📏 Test 5: Validating slider attributes (min/max/step)...');
    
    const attributeResult = await page.evaluate(() => {
      const sliders = document.querySelectorAll('input[type="range"]');
      const issues = [];
      const valid = [];
      
      for (const slider of sliders) {
        const min = slider.getAttribute('min');
        const max = slider.getAttribute('max');
        const step = slider.getAttribute('step');
        
        const problems = [];
        if (!min) problems.push('missing min');
        if (!max) problems.push('missing max');
        if (!step) problems.push('missing step');
        
        // Validate numeric values
        if (min !== null && isNaN(parseFloat(min))) problems.push('invalid min');
        if (max !== null && isNaN(parseFloat(max))) problems.push('invalid max');
        if (step !== null && isNaN(parseFloat(step))) problems.push('invalid step');
        
        // Validate ranges
        if (min !== null && max !== null) {
          const minNum = parseFloat(min);
          const maxNum = parseFloat(max);
          if (minNum >= maxNum) problems.push('min >= max');
        }
        
        if (problems.length > 0) {
          issues.push({
            id: slider.id,
            path: slider.dataset.path,
            problems
          });
        } else {
          valid.push(slider.id);
        }
      }
      
      return {
        total: sliders.length,
        valid: valid.length,
        issues
      };
    });
    
    if (attributeResult.issues.length > 0) {
      console.error(`❌ ${attributeResult.issues.length} sliders have attribute issues:`);
      attributeResult.issues.slice(0, 5).forEach(s => {
        console.error(`  - ${s.id}: ${s.problems.join(', ')}`);
      });
    }
    
    expect(attributeResult.issues.length).toBe(0);
    console.log(`✅ All ${attributeResult.valid} sliders have valid attributes\n`);
    
    // ==================================================
    // TEST 6: No Duplicate Slider IDs
    // ==================================================
    console.log('🔍 Test 6: Checking for duplicate IDs...');
    
    const duplicateResult = await page.evaluate(() => {
      const sliders = document.querySelectorAll('input[type="range"]');
      const idCount = new Map();
      const duplicates = [];
      
      for (const slider of sliders) {
        if (slider.id) {
          idCount.set(slider.id, (idCount.get(slider.id) || 0) + 1);
        }
      }
      
      for (const [id, count] of idCount.entries()) {
        if (count > 1) {
          duplicates.push({ id, count });
        }
      }
      
      return {
        totalSliders: sliders.length,
        uniqueIds: idCount.size,
        duplicates
      };
    });
    
    if (duplicateResult.duplicates.length > 0) {
      console.error(`❌ Found ${duplicateResult.duplicates.length} duplicate IDs:`);
      duplicateResult.duplicates.forEach(d => {
        console.error(`  - "${d.id}" appears ${d.count} times`);
      });
    }
    
    expect(duplicateResult.duplicates.length).toBe(0);
    console.log(`✅ All ${duplicateResult.uniqueIds} slider IDs are unique\n`);
    
    // ==================================================
    // TEST 7: Round-Trip Test (Change Slider → Config Updates)
    // ==================================================
    console.log('🔄 Test 7: Round-trip test (slider changes update config)...');
    
    const roundTripResult = await page.evaluate(async () => {
      const sliders = document.querySelectorAll('input[type="range"][data-path]');
      const config = window.game.mapShine.profileManager.activeConfig;
      const results = {
        tested: 0,
        passed: 0,
        failed: []
      };
      
      // Test first 5 sliders for performance
      const slidersToTest = Array.from(sliders).slice(0, 5);
      
      for (const slider of slidersToTest) {
        const path = slider.dataset.path;
        const isGameSetting = path.startsWith('universal.') || path.startsWith('loading-screen-');
        
        // Skip game settings for this test
        if (isGameSetting) continue;
        
        const originalValue = foundry.utils.getProperty(config, path);
        if (originalValue === undefined || typeof originalValue !== 'number') continue;
        
        results.tested++;
        
        // Calculate a new value within range
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const step = parseFloat(slider.step) || 0.01;
        
        let newValue = originalValue + step;
        if (newValue > max) newValue = min + step;
        if (newValue < min) newValue = min;
        
        // Change the slider
        slider.value = newValue;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Give it a moment to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if config updated
        const updatedValue = foundry.utils.getProperty(config, path);
        const diff = Math.abs(parseFloat(updatedValue) - newValue);
        
        if (diff < 0.001) {
          results.passed++;
          // Restore original value
          foundry.utils.setProperty(config, path, originalValue);
        } else {
          results.failed.push({
            id: slider.id,
            path,
            originalValue,
            newValue,
            actualValue: updatedValue,
            diff
          });
        }
      }
      
      return results;
    });
    
    if (roundTripResult.failed.length > 0) {
      console.error(`❌ ${roundTripResult.failed.length} sliders failed round-trip test:`);
      roundTripResult.failed.forEach(r => {
        console.error(`  - ${r.id} (${r.path}): set to ${r.newValue}, config is ${r.actualValue}`);
      });
    }
    
    if (roundTripResult.tested > 0) {
      expect(roundTripResult.failed.length).toBe(0);
      console.log(`✅ ${roundTripResult.passed}/${roundTripResult.tested} sliders update config correctly\n`);
    } else {
      console.log('⚠️  No sliders tested (may be game settings or non-numeric)\n');
    }
    
    // ==================================================
    // SUMMARY
    // ==================================================
    console.log('='.repeat(70));
    console.log('📊 UI SLIDER VALIDATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Sliders: ${sliderCount}`);
    console.log(`✅ All sliders have data-path attributes`);
    console.log(`✅ All data-path values map to config`);
    console.log(`✅ All slider values match config values`);
    console.log(`✅ All sliders have valid min/max/step attributes`);
    console.log(`✅ No duplicate slider IDs`);
    console.log(`✅ Round-trip test passed (${roundTripResult.passed}/${roundTripResult.tested} tested)`);
    console.log('='.repeat(70));
    console.log('🎉 All UI slider validation tests passed!');
  });
});
