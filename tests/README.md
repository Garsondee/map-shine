# Map Shine Headless Testing System

## Overview

This automated testing system allows you to test the Map Shine module without fully loading Foundry VTT's graphical interface. It validates critical systems like:

- **UI Slider Connections** - Detects when sliders become detached from config data (your #1 priority)
- **Settings/Configuration** - Validates config integrity and proper merging
- **Manager Initialization** - Ensures all managers start correctly
- **Texture Discovery** - Verifies texture paths and effect target detection

## Quick Start

### Prerequisites

1. **Foundry VTT v13+** (already confirmed)
2. **World**: `map-development-world` must exist with Map Shine enabled
3. **Foundry must NOT be running** (close it before testing)

### Running Tests

**PowerShell (Easiest)**:
```powershell
cd c:\Users\Ingram\Documents\Mythica Machina Module Development\map-shine-development\map-shine\tests
.\run-tests.ps1                    # Run all tests
.\run-tests.ps1 -Suite ui          # Run only UI tests
.\run-tests.ps1 -Suite config      # Run only config tests
.\run-tests.ps1 -Suite managers    # Run only manager tests
```

**Manual Command Line**:
```powershell
$env:MAP_SHINE_TEST_MODE = "true"
$env:MAP_SHINE_TEST_SUITE = "all"  # or ui, config, managers, textures
node "C:\Program Files\Foundry Virtual Tabletop\resources\app\main.js" --headless --world=map-development-world --timeout=90000
```

## Test Suites

### 1. UI Slider Tests (`-Suite ui`)

**What it tests:**
- ✅ All sliders have `data-path` attributes
- ✅ All `data-path` values map to valid config properties
- ✅ Slider values match current config values
- ✅ No detached sliders exist

**When it throws formal errors:**
- `MISSING_PATH` - Slider has no data-path attribute
- `PATH_NOT_FOUND` - data-path doesn't exist in config
- `VALUE_MISMATCH` - Slider value doesn't match config value

**Example output:**
```
🎚️  UI Slider Connection Tests
──────────────────────────────────────────────────────────────────────
  ✅ All sliders have data-path attributes
  ❌ Slider values match config values
     Value mismatches (3 total): control-baseShine-intensity: slider=0.5, config=0.8; ...

[CRITICAL] UI SLIDER DETACHED!
Slider ID: control-baseShine-intensity
Error Code: VALUE_MISMATCH
Details:
  baseShine.intensity
  Slider: 0.5, Config: 0.8
```

### 2. Configuration Tests (`-Suite config`)

**What it tests:**
- ✅ ProfileManager is initialized
- ✅ MODULE_DEFAULTS has valid structure
- ✅ activeConfig matches defaults structure
- ✅ ProfileManager state is valid

**When to run:**
- After changing MODULE_DEFAULTS
- After modifying ProfileManager
- When debugging config merging issues

### 3. Manager Tests (`-Suite managers`)

**What it tests:**
- ✅ All required managers exist in game.mapShine
- ✅ Managers have expected methods
- ✅ Managers are properly initialized
- ✅ Config can propagate to managers

**Managers checked:**
- ProfileManager (required)
- ResourceManager (required)
- WindManager (required)
- WeatherSystemManager (optional)
- EffectTargetManager (required)
- And 9 more...

### 4. Texture Tests (`-Suite textures`)

**What it tests:**
- ✅ Texture discovery has run
- ✅ EffectTargetManager has valid structure
- ✅ Discovered texture paths are valid strings

## File Structure

```
tests/
├── README.md                      # This file
├── run-tests.ps1                  # PowerShell helper script
├── headless-runner.js             # Main test orchestrator
├── validators/
│   ├── UIDataValidator.js         # 🔥 Formal error system for sliders
│   ├── ConfigValidator.js         # Config integrity validation
│   └── ManagerValidator.js        # Manager initialization validation
└── suites/                        # (Future) Individual test suites
```

## Integration

The system integrates with `scripts/module.js` via a `ready` hook:

```javascript
// module.js line ~44466
Hooks.once("ready", async () => {
  const isTestMode = process.env.MAP_SHINE_TEST_MODE === 'true';
  
  if (isTestMode) {
    // Wait for mapShine:setupComplete
    await new Promise(resolve => {
      Hooks.once('mapShine:setupComplete', resolve);
    });
    
    // Run tests
    const { MapShineTestRunner } = await import('./tests/headless-runner.js');
    await MapShineTestRunner.runTests(testSuite);
  }
});
```

## Exit Codes

- **0** - All tests passed
- **1** - One or more tests failed OR fatal error occurred

## Adding New Tests

### To add a test to an existing suite:

Edit `headless-runner.js`, find the appropriate `run*Tests()` method, and add:

```javascript
await this.test('Your test name', () => {
  // Your test logic
  if (someConditionFails) {
    throw new Error('Reason it failed');
  }
}, results);
```

### To create a new validator:

1. Create `validators/YourValidator.js`
2. Follow the pattern of `UIDataValidator.js`:
   - Static `errors` and `warnings` arrays
   - Validation methods that push to errors/warnings
   - `generateReport()` method
3. Import in `headless-runner.js`

## Troubleshooting

### "Foundry VTT cannot start... already locked"

Foundry is running. Close it completely before running tests.

### "World 'map-development-world' not found"

The test world doesn't exist. Create it or change the world name in `run-tests.ps1`.

### "MAP_SHINE_TEST_MODE is not defined"

You're running tests from within Foundry UI instead of headless mode. Use the PowerShell script or set environment variables correctly.

### Tests timeout before completing

Increase the timeout:
```powershell
.\run-tests.ps1 -Timeout 120000  # 2 minutes
```

## For AI Usage

This system is specifically designed for you (Cascade) to:

1. **Automatically test after feature changes**:
   ```powershell
   .\run-tests.ps1 -Suite ui  # Quick validation of UI connections
   ```

2. **Gather diagnostic information**:
   - Tests output detailed console logs
   - You can read terminal output to understand state
   - No need to ask user to check things

3. **Verify theories**:
   - Add temporary tests to `headless-runner.js`
   - Run and get immediate feedback
   - Iterate quickly without full Foundry load

4. **Catch regressions**:
   - Run full suite after major changes
   - Formal errors make problems obvious
   - No more "silent failures"

## Example Terminal Output

```
═══════════════════════════════════════════════════════════════════════════
    MAP SHINE AUTOMATED TEST SUITE
    Suite: UI
    Started: 12:45:30 PM
═══════════════════════════════════════════════════════════════════════════

🎚️  UI Slider Connection Tests

──────────────────────────────────────────────────────────────────────
  ✅ All sliders have data-path attributes
  ✅ All slider paths exist in config
  ✅ Slider values match config values
  ✅ Comprehensive UI validation

═══════════════════════════════════════════════════════════════════════════
    TEST RESULTS
═══════════════════════════════════════════════════════════════════════════
✅ Passed: 4
❌ Failed: 0
🔥 Errors: 0
⏱️  Duration: 3847ms
═══════════════════════════════════════════════════════════════════════════

🔚 Exiting with code: 0
```

## Next Steps

- [x] Core infrastructure complete
- [x] UI slider detachment detection
- [x] Config validation
- [x] Manager validation
- [x] PowerShell helper script
- [ ] Add more granular tests as needed
- [ ] Create separate test suite files (optional refinement)
- [ ] Add visual diff testing for rendered output (future)
