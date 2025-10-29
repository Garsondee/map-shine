# Map Shine Playwright Test Suite

## Overview

The Playwright test suite provides automated end-to-end testing of the Map Shine module in a real Foundry VTT environment.

## Test Files

### `example.spec.js`
Basic initialization test that validates:
- ✅ Canvas loads successfully
- ✅ Map Shine module initializes
- ✅ Core managers are present (profileManager, resourceManager, weatherSystemManager, windManager)
- ✅ Configuration structure is valid
- ✅ Weather diagnostics are functional

**Status:** ✅ **PASSING** (Test Duration: ~48 seconds)

### `shader-tests.spec.js`
Shader compilation and rendering validation suite. Tests:
- Shader compilation for available filters
- Layer rendering without null texture errors
- Sprite blend mode validation
- BatchRenderer state validation
- Texture BaseTexture validation
- Stress test (60 frames across multiple layers)

**Status:** ⚠️ **IN DEVELOPMENT** - Some layers may not initialize in headless mode

### `ui-slider-tests.spec.js`
UI slider connection validation suite. Tests:
- All sliders have data-path attributes
- All data-path values map to config properties
- Slider values match config values
- Slider attribute validation (min/max/step)
- No duplicate slider IDs
- Round-trip test (slider → config → slider)

**Status:** ⚠️ **HEADLESS LIMITATION** - Complex UIs don't render in headless Chrome

**✅ SOLUTION:** Run in headed mode to see the browser:
```powershell
npx playwright test ui-slider-tests.spec.js --headed
```

**Manual Testing Alternative:** See "Manual UI Slider Validation" section below

## Running Tests

### 🎥 Headed Mode (RECOMMENDED - See What's Happening!)

**✅ This is the RECOMMENDED way to run Map Shine tests:**
- You can see the browser and what's happening
- Complex UIs render correctly
- Console output visible in real-time
- Much easier to debug issues
- Tests run the way users experience them
```powershell
# Run with visible browser window
npx playwright test ui-slider-tests.spec.js --headed

# Run with visible browser + slow motion (500ms delay per action)
npx playwright test ui-slider-tests.spec.js --headed --slow-mo=500

# Use dedicated headed config (optimized for UI debugging)
npx playwright test --config=playwright-headed.config.js

# Run specific test with headed config
npx playwright test ui-slider-tests.spec.js --config=playwright-headed.config.js
```

### ⚡ Headless Mode (Fast but Limited)

**⚠️ Only use for simple tests that don't require UI rendering:**
```powershell
# Run all tests (headless)
npx playwright test

# Run specific test (headless)
npx playwright test example.spec.js
```

**Limitations:**
- Complex UIs may not render
- Can't see what's happening
- Harder to debug
- Good for CI/CD automation only

### 🐛 Debug Mode (Interactive Step-Through)
```powershell
# Opens Playwright Inspector - step through tests line by line!
npx playwright test ui-slider-tests.spec.js --debug

# Debug with headed browser
npx playwright test ui-slider-tests.spec.js --headed --debug
```

### 🎭 UI Mode (Visual Test Runner)
```powershell
# Opens interactive test runner with time-travel debugging
npx playwright test --ui

# Perfect for:
# - Picking which tests to run
# - Watching test execution
# - Inspecting each step
# - Time-travel through test execution
```

### 📊 View Results
```powershell
# Show HTML report
npx playwright show-report tests\playwright-report

# View trace file (interactive timeline)
npx playwright show-trace tests\playwright-artifacts\[test-name]\trace.zip
```

## Test Artifacts

Failed tests automatically capture:
- 📹 **Video recordings** - See exactly what happened during the test
- 📸 **Screenshots** - Capture of the page when the test failed  
- 🔍 **Trace files** - Interactive timeline of test execution
- 📝 **Error context** - DOM snapshot at failure point

**Location:** `tests/playwright-artifacts/`

**View trace:**
```powershell
npx playwright show-trace tests\playwright-artifacts\[test-name]\trace.zip
```

## Helper Utilities

### `map-shine-utils.js`
- `MapShineTestHelper` class with common test operations
- Authentication handling (password & dropdown)
- Canvas waiting with timeouts
- Manager validation methods
- Weather diagnostics retrieval

### `foundry-launcher.js`
- Automatic Foundry VTT server startup/shutdown
- Headless server management on port 30000
- Process cleanup and error handling

## Configuration

### `playwright.config.js`
- Timeout: 60 seconds per test
- Retries: 0 (disabled for faster feedback)
- Video: Capture on failure
- Trace: Capture on failure
- Screenshots: Capture on failure

## Known Issues

1. **CloudShadowsLayer not initializing in headless mode** - Some layers require full GPU initialization
2. **Texture loading timeouts** - Large textures may exceed timeout in slow environments
3. **Foundry deprecation warnings** - TileDocument API changes (Foundry v12→v14)

## Best Practices

1. **Wait for full initialization** - Always wait for managers before testing
2. **Handle missing layers gracefully** - Not all layers initialize in all environments
3. **Test what's available** - Focus on critical paths that work consistently
4. **Add descriptive console logs** - Makes debugging failures easier
5. **Use proper timeouts** - Balance between too short (flaky) and too long (slow feedback)

## Contributing

When adding new tests:
1. Follow the existing pattern in `example.spec.js`
2. Use the `MapShineTestHelper` utilities
3. Add proper error handling for edge cases
4. Test locally before committing
5. Update this README with new test coverage
