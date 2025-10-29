# Map Shine Playwright Testing - Setup Summary

## ✅ What We Accomplished

### 1. **Headed Mode Configuration** (RECOMMENDED)
- Created `playwright-headed.config.js` - optimized for visual debugging
- Browser window visible during tests
- Slow-mo enabled (100ms) for better visibility
- Video/screenshot/trace on every test run
- **This is now the recommended way to run tests**

### 2. **Unpause Game Helper**
- Added `unpauseGame()` method to `MapShineTestHelper`
- Foundry VTT loads in paused state which blocks UI interactions
- All tests should call `await helper.unpauseGame()` after initialization
- Returns boolean indicating if game was paused

### 3. **UI Slider Validation Test Suite**
- Comprehensive test file: `tests/playwright/ui-slider-tests.spec.js`
- Tests all UI sliders for proper connection to config
- 7 test sections:
  1. Count total sliders
  2. Validate data-path attributes
  3. Validate config path mappings
  4. Validate slider/config value sync
  5. Validate slider attributes (min/max/step)
  6. Check for duplicate IDs
  7. Round-trip test (slider changes update config)

### 4. **Documentation Updates**
- Updated `tests/playwright/README.md` with headed mode emphasis
- Added memory about testing best practices
- Clear examples of correct test patterns

## 🎯 Recommended Testing Workflow

### Run Tests (Headed Mode)
```powershell
# UI Slider Test (watch it run!)
npx playwright test ui-slider-tests.spec.js --headed

# With slow motion for better visibility
npx playwright test ui-slider-tests.spec.js --headed --slow-mo=500

# All tests with headed config
npx playwright test --config=playwright-headed.config.js
```

### Debug Tests
```powershell
# Interactive step-through
npx playwright test ui-slider-tests.spec.js --debug

# Visual test runner
npx playwright test --ui
```

### View Test Artifacts
```powershell
# Watch video of test execution
explorer tests\playwright-artifacts\[test-name]\video.webm

# View screenshot at failure
explorer tests\playwright-artifacts\[test-name]\test-failed-1.png

# Interactive trace timeline
npx playwright show-trace tests\playwright-artifacts\[test-name]\trace.zip
```

## 📋 Test Helper Methods

```javascript
const helper = new MapShineTestHelper(page);

// Setup
await helper.authenticate('Gamemaster');
await helper.waitForCanvas(90000);
await helper.waitForMapShine(30000);
await helper.unpauseGame(); // ← NEW! Critical step!

// Utilities
await helper.waitForManager('profileManager');
const config = await helper.getConfigValue('cloudShadows.enabled');
await helper.setConfigValue('cloudShadows.enabled', true);
await helper.screenshot('my-test-screenshot');
```

## 🐛 Known Issues

### UI Opening in Tests
- `game.mapShine.showEditor()` doesn't render UI in test environment
- Even in headed mode with game unpaused
- **Workaround:** Manual testing or browser console validation
- **Root Cause:** Unknown - likely timing/async rendering issue

### Complex UI Rendering
- Foundry's complex UIs don't always render in headless mode
- **Solution:** Always use `--headed` flag for UI tests
- Simple tests (manager validation) work fine in headless

## 📊 Test Coverage

| Test Suite | Status | Coverage |
|------------|--------|----------|
| Basic Initialization | ✅ **PASSING** | Canvas, Map Shine, Managers, Config |
| Shader Compilation | ⚠️ In Development | Filters, rendering, blend modes |
| UI Slider Validation | ⚠️ Blocked | Needs UI opening fix |

## 🔜 Next Steps

1. **Investigate UI opening issue** - Why doesn't `showEditor()` work in tests?
2. **Shader tests refinement** - Handle headless limitations
3. **Add more test coverage** - Weather, profiles, effects
4. **CI/CD integration** - Automated testing on commits

## 💡 Key Learnings

1. **Headed mode is essential** for Map Shine testing
2. **Always unpause game** before UI interactions
3. **Video/trace artifacts** are invaluable for debugging
4. **Test the way users experience** the module
5. **Console output visibility** makes debugging 10x easier

---

**Date:** October 26, 2025  
**Version:** Map Shine v1.1.x  
**Testing Framework:** Playwright @playwright/test
