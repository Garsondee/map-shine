/**
 * Phase 1 Data Validation Test
 * 
 * Run this in the Foundry VTT console (F12) to test defensive data loading.
 * Tests ProfileDataManager validation against corrupted data.
 * 
 * Usage: Copy and paste this entire script into browser console
 */

(async function testPhase1DataValidation() {
  console.log('%c🛡️ Phase 1 Data Validation Test', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(70));
  
  const results = {
    timestamp: new Date().toISOString(),
    worldDefaults: { status: 'not_tested', passed: false },
    sceneData: { status: 'not_tested', passed: false },
    userOverrides: { status: 'not_tested', passed: false },
    totalTests: 0,
    passed: 0,
    failed: 0
  };
  
  // Get ProfileDataManager instance
  const dataManager = game.mapShine?.profileManager?.dataManager;
  
  if (!dataManager) {
    console.error('❌ ProfileDataManager not found - module may not be initialized');
    return;
  }
  
  console.log('✅ ProfileDataManager found\n');
  
  // =========================================================================
  // TEST 1: loadWorldDefaults() - Corrupted Data Handling
  // =========================================================================
  console.log('─'.repeat(70));
  console.log('TEST 1: loadWorldDefaults() - Corrupted Data Handling');
  console.log('─'.repeat(70));
  results.totalTests++;
  
  try {
    // Save current world defaults (FIXED: correct setting key is 'worldDefaults' not 'world-defaults')
    const originalDefaults = await game.settings.get('map-shine', 'worldDefaults');
    
    // Test 1a: Null data
    console.log('\n1a. Testing null data...');
    await game.settings.set('map-shine', 'worldDefaults', null);
    const nullResult = dataManager.loadWorldDefaults();
    const nullPassed = typeof nullResult === 'object' && !Array.isArray(nullResult);
    console.log(`   Result: ${nullPassed ? '✅ PASS' : '❌ FAIL'} - Returned valid object:`, nullResult);
    
    // Test 1b: Array instead of object
    console.log('\n1b. Testing array instead of object...');
    await game.settings.set('map-shine', 'worldDefaults', ['invalid', 'array']);
    const arrayResult = dataManager.loadWorldDefaults();
    const arrayPassed = typeof arrayResult === 'object' && !Array.isArray(arrayResult);
    console.log(`   Result: ${arrayPassed ? '✅ PASS' : '❌ FAIL'} - Returned valid object:`, arrayResult);
    
    // Test 1c: Invalid effect config (should be filtered out)
    console.log('\n1c. Testing invalid effect configs (should be filtered)...');
    await game.settings.set('map-shine', 'worldDefaults', {
      validEffect: { enabled: true, intensity: 0.5 },
      nullEffect: null,
      arrayEffect: ['invalid'],
      emptyEffect: {},
      stringEffect: 'invalid'
    });
    const filteredResult = dataManager.loadWorldDefaults();
    const filteredPassed = Object.keys(filteredResult).length === 1 && filteredResult.validEffect;
    console.log(`   Result: ${filteredPassed ? '✅ PASS' : '❌ FAIL'} - Filtered to valid effects:`, filteredResult);
    console.log(`   Expected: 1 valid effect, Got: ${Object.keys(filteredResult).length}`);
    
    // Restore original
    await game.settings.set('map-shine', 'worldDefaults', originalDefaults || {});
    
    results.worldDefaults.status = 'tested';
    results.worldDefaults.passed = nullPassed && arrayPassed && filteredPassed;
    if (results.worldDefaults.passed) results.passed++;
    else results.failed++;
    
  } catch (error) {
    console.error('❌ TEST 1 FAILED with exception:', error);
    results.worldDefaults.status = 'error';
    results.worldDefaults.error = error.message;
    results.failed++;
  }
  
  // =========================================================================
  // TEST 2: loadSceneData() - Profile Validation
  // =========================================================================
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 2: loadSceneData() - Profile Validation');
  console.log('─'.repeat(70));
  results.totalTests++;
  
  try {
    if (!canvas.scene) {
      console.warn('⚠️  No active scene - skipping loadSceneData() test');
      results.sceneData.status = 'skipped';
    } else {
      // Save current scene data
      const originalProfiles = canvas.scene.getFlag('map-shine', 'profiles');
      const originalActiveId = canvas.scene.getFlag('map-shine', 'activeProfileId');
      
      // Test 2a: Invalid profiles array
      console.log('\n2a. Testing corrupted profiles (not an array)...');
      await canvas.scene.setFlag('map-shine', 'profiles', 'not-an-array');
      const stringResult = dataManager.loadSceneData();
      const stringPassed = Array.isArray(stringResult.profiles) && stringResult.profiles.length === 0;
      console.log(`   Result: ${stringPassed ? '✅ PASS' : '❌ FAIL'} - Returned empty array:`, stringResult);
      
      // Test 2b: Mixed valid/invalid profiles
      console.log('\n2b. Testing mixed valid/invalid profiles...');
      await canvas.scene.setFlag('map-shine', 'profiles', [
        { id: 'valid1', name: 'Valid Profile', config: { enabled: true } },
        { id: 'invalid1', name: 'No Config' }, // Missing config
        null, // Null profile
        { id: 'invalid2', config: {} }, // Missing name
        { name: 'No ID', config: {} }, // Missing ID
        { id: 'valid2', name: 'Also Valid', config: { enabled: false } }
      ]);
      const mixedResult = dataManager.loadSceneData();
      const mixedPassed = mixedResult.profiles.length === 2;
      console.log(`   Result: ${mixedPassed ? '✅ PASS' : '❌ FAIL'} - Filtered to 2 valid profiles:`, mixedResult.profiles);
      
      // Test 2c: Invalid active profile ID
      console.log('\n2c. Testing invalid active profile ID...');
      await canvas.scene.setFlag('map-shine', 'profiles', [
        { id: 'profile1', name: 'Test', config: {} }
      ]);
      await canvas.scene.setFlag('map-shine', 'activeProfileId', 'nonexistent-id');
      const idResult = dataManager.loadSceneData();
      const idPassed = idResult.activeProfileId === null;
      console.log(`   Result: ${idPassed ? '✅ PASS' : '❌ FAIL'} - Cleared invalid ID:`, idResult.activeProfileId);
      
      // Restore original
      if (originalProfiles !== undefined) {
        await canvas.scene.setFlag('map-shine', 'profiles', originalProfiles);
      }
      if (originalActiveId !== undefined) {
        await canvas.scene.setFlag('map-shine', 'activeProfileId', originalActiveId);
      }
      
      results.sceneData.status = 'tested';
      results.sceneData.passed = stringPassed && mixedPassed && idPassed;
      if (results.sceneData.passed) results.passed++;
      else results.failed++;
    }
    
  } catch (error) {
    console.error('❌ TEST 2 FAILED with exception:', error);
    results.sceneData.status = 'error';
    results.sceneData.error = error.message;
    results.failed++;
  }
  
  // =========================================================================
  // TEST 3: loadUserOverrides() - Data Validation
  // =========================================================================
  console.log('\n' + '─'.repeat(70));
  console.log('TEST 3: loadUserOverrides() - Data Validation');
  console.log('─'.repeat(70));
  results.totalTests++;
  
  try {
    const testSceneId = 'test-scene-123';
    
    // Save current user adjustments
    const originalAdjustments = await game.settings.get('map-shine', 'user-adjustments');
    
    // Test 3a: Null user adjustments
    console.log('\n3a. Testing null user adjustments...');
    await game.settings.set('map-shine', 'user-adjustments', null);
    const nullOverrides = dataManager.loadUserOverrides(testSceneId);
    const nullOverridesPassed = typeof nullOverrides === 'object' && Object.keys(nullOverrides).length === 0;
    console.log(`   Result: ${nullOverridesPassed ? '✅ PASS' : '❌ FAIL'} - Returned empty object:`, nullOverrides);
    
    // Test 3b: Array instead of object
    console.log('\n3b. Testing array instead of object...');
    await game.settings.set('map-shine', 'user-adjustments', ['invalid']);
    const arrayOverrides = dataManager.loadUserOverrides(testSceneId);
    const arrayOverridesPassed = typeof arrayOverrides === 'object' && Object.keys(arrayOverrides).length === 0;
    console.log(`   Result: ${arrayOverridesPassed ? '✅ PASS' : '❌ FAIL'} - Returned empty object:`, arrayOverrides);
    
    // Test 3c: Valid structure
    console.log('\n3c. Testing valid structure...');
    await game.settings.set('map-shine', 'user-adjustments', {
      [testSceneId]: { someSetting: 'value' }
    });
    const validOverrides = dataManager.loadUserOverrides(testSceneId);
    const validOverridesPassed = validOverrides.someSetting === 'value';
    console.log(`   Result: ${validOverridesPassed ? '✅ PASS' : '❌ FAIL'} - Loaded correct overrides:`, validOverrides);
    
    // Restore original
    await game.settings.set('map-shine', 'user-adjustments', originalAdjustments || {});
    
    results.userOverrides.status = 'tested';
    results.userOverrides.passed = nullOverridesPassed && arrayOverridesPassed && validOverridesPassed;
    if (results.userOverrides.passed) results.passed++;
    else results.failed++;
    
  } catch (error) {
    console.error('❌ TEST 3 FAILED with exception:', error);
    results.userOverrides.status = 'error';
    results.userOverrides.error = error.message;
    results.failed++;
  }
  
  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('%c📊 Phase 1 Validation Summary', 'color: #2196F3; font-size: 14px; font-weight: bold;');
  console.log('='.repeat(70));
  
  console.log(`\n📈 Results:`);
  console.log(`   ✅ Passed: ${results.passed}/${results.totalTests}`);
  console.log(`   ❌ Failed: ${results.failed}/${results.totalTests}`);
  
  console.log(`\n🎯 Test-by-Test Status:`);
  console.log(`   loadWorldDefaults(): ${results.worldDefaults.passed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   loadSceneData(): ${results.sceneData.passed ? '✅ PASS' : results.sceneData.status === 'skipped' ? '⚠️  SKIP' : '❌ FAIL'}`);
  console.log(`   loadUserOverrides(): ${results.userOverrides.passed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.passed === results.totalTests) {
    console.log('\n%c🎉 ALL TESTS PASSED! Phase 1 validation is working correctly.', 'color: #4CAF50; font-weight: bold;');
  } else {
    console.log('\n%c⚠️  SOME TESTS FAILED - Check errors above', 'color: #FF9800; font-weight: bold;');
  }
  
  console.log(`\n💾 Full results saved to: window.phase1DataValidationResults`);
  window.phase1DataValidationResults = results;
  
  console.log('\n✅ Phase 1 data validation test complete!');
  
  return results;
})();
