# Weather Orchestrator Testing Guide

## Quick Start Test Script

Copy and paste this into your browser console to test the Weather Orchestrator:

```javascript
// ======================================================================
// WEATHER ORCHESTRATOR TEST SUITE
// ======================================================================

(async function testWeatherOrchestrator() {
  console.log('='.repeat(70));
  console.log('WEATHER ORCHESTRATOR TEST SUITE');
  console.log('='.repeat(70));
  
  const orchestrator = game.mapShine?.weatherOrchestrator;
  const weatherManager = game.mapShine?.weatherSystemManager;
  
  // Test 1: Verify systems exist
  console.log('\n📋 TEST 1: System Verification');
  console.log('  WeatherSystemManager:', weatherManager ? '✅ Found' : '❌ Missing');
  console.log('  WeatherOrchestrator:', orchestrator ? '✅ Found' : '❌ Missing');
  
  if (!orchestrator) {
    console.error('❌ Orchestrator not found. Is it enabled in the config?');
    console.log('To enable: game.mapShine.profileManager.activeConfig.weather.orchestrator.enabled = true');
    return;
  }
  
  // Test 2: Get diagnostics
  console.log('\n📊 TEST 2: Current State Diagnostics');
  const diag = orchestrator.getDiagnostics();
  console.table(diag);
  
  // Test 3: Force a tick
  console.log('\n🎲 TEST 3: Force Random Walk Tick');
  console.log('  Before:', {
    temp: orchestrator.atmosphericParams.temperature.toFixed(1),
    humidity: orchestrator.atmosphericParams.humidity.toFixed(0)
  });
  
  orchestrator.forceTick();
  
  console.log('  After:', {
    temp: orchestrator.atmosphericParams.temperature.toFixed(1),
    humidity: orchestrator.atmosphericParams.humidity.toFixed(0)
  });
  
  // Test 4: Manual parameter adjustment
  console.log('\n🌡️ TEST 4: Manual Parameter Adjustment');
  console.log('  Setting temperature to 28°C, humidity to 85%...');
  orchestrator.setAtmosphericParameters({ temperature: 28, humidity: 85 });
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('  Current weather:', weatherManager.currentState);
  console.log('  Resolved state:', orchestrator.currentResolvedState);
  
  // Test 5: Narrative override
  console.log('\n🎭 TEST 5: Narrative Override');
  console.log('  Enabling narrative push toward STORM...');
  orchestrator.enableNarrativeOverride({
    targetState: 'storm',
    forceStrength: 0.5
  });
  
  console.log('  Forcing 3 ticks to see bias...');
  for (let i = 0; i < 3; i++) {
    orchestrator.forceTick();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`  Tick ${i+1}:`, {
      temp: orchestrator.atmosphericParams.temperature.toFixed(1),
      humidity: orchestrator.atmosphericParams.humidity.toFixed(0),
      state: orchestrator.currentResolvedState.state
    });
  }
  
  console.log('  Disabling narrative override...');
  orchestrator.disableNarrativeOverride();
  
  // Test 6: State resolver testing
  console.log('\n🗺️ TEST 6: State Resolver Matrix');
  console.log('  Testing all temperature/humidity combinations:');
  
  const testCases = [
    { temp: 0, humidity: 30, expected: 'snow' },
    { temp: 0, humidity: 60, expected: 'snow' },
    { temp: 0, humidity: 85, expected: 'blizzard' },
    { temp: 10, humidity: 30, expected: 'clear' },
    { temp: 10, humidity: 60, expected: 'sleet' },
    { temp: 18, humidity: 30, expected: 'clear' },
    { temp: 18, humidity: 60, expected: 'drizzle' },
    { temp: 18, humidity: 80, expected: 'rain' },
    { temp: 28, humidity: 30, expected: 'clear' },
    { temp: 28, humidity: 60, expected: 'drizzle' },
    { temp: 28, humidity: 85, expected: 'storm' }
  ];
  
  const results = testCases.map(test => {
    const resolved = game.mapShine.weatherOrchestrator.constructor.WeatherStateResolver?.resolve 
      ? null // Static class, need different access
      : null;
    
    // Import resolver for testing
    return import('/modules/map-shine/scripts/weather/WeatherStateResolver.js')
      .then(module => {
        const resolved = module.WeatherStateResolver.resolve(test.temp, test.humidity);
        const match = resolved.state === test.expected ? '✅' : '❌';
        return {
          match,
          temp: test.temp,
          humidity: test.humidity,
          expected: test.expected,
          actual: resolved.state,
          intensity: resolved.intensity.toFixed(2)
        };
      });
  });
  
  Promise.all(results).then(table => {
    console.table(table);
  });
  
  console.log('\n='.repeat(70));
  console.log('TEST SUITE COMPLETE');
  console.log('='.repeat(70));
  
})();
```

## Manual Testing Steps

### Step 1: Enable the Orchestrator

```javascript
// In console
const config = game.mapShine.profileManager.activeConfig;
config.weather.orchestrator.enabled = true;

// Reload the scene to activate
location.reload();
```

### Step 2: Monitor Orchestrator Activity

```javascript
// Watch diagnostics in real-time
setInterval(() => {
  const diag = game.mapShine.weatherOrchestrator?.getDiagnostics();
  console.clear();
  console.table(diag);
}, 5000);
```

### Step 3: Adjust Tick Interval for Fast Testing

```javascript
// Speed up random walk for testing (default: 60s)
game.mapShine.weatherOrchestrator.randomWalkEngine.setTickInterval(10); // 10 seconds
```

### Step 4: Test Narrative Override

```javascript
// Push weather toward a storm
game.mapShine.weatherOrchestrator.enableNarrativeOverride({
  targetState: 'storm',
  forceStrength: 0.5,
  onReached: 'resume' // or 'hold'
});

// Monitor progress
setInterval(() => {
  const state = game.mapShine.weatherOrchestrator.currentResolvedState;
  console.log(`State: ${state?.state}, Intensity: ${state?.intensity?.toFixed(2)}`);
}, 2000);
```

### Step 5: Manual State Control

```javascript
// Set specific atmospheric conditions
game.mapShine.weatherOrchestrator.setAtmosphericParameters({
  temperature: 0,  // Cold
  humidity: 85     // High humidity
});
// Should trigger snow/blizzard

// Hot and humid (storm conditions)
game.mapShine.weatherOrchestrator.setAtmosphericParameters({
  temperature: 30,
  humidity: 90
});
```

## Verification Checklist

- [ ] Orchestrator initializes without errors
- [ ] Random walk ticks occur at configured interval
- [ ] Atmospheric parameters update correctly
- [ ] Weather state resolver maps correctly (see matrix in test)
- [ ] WeatherSystemManager receives transitions
- [ ] Intensity override affects shader parameters
- [ ] Narrative override pushes toward target state
- [ ] State persistence works across scene changes
- [ ] Diagnostics show accurate real-time data
- [ ] No performance issues during operation

## Expected Console Output

When functioning correctly, you should see:
```
MapShine | AtmosphericParameters initialized: { temp: 18, humidity: 60, pressure: 1013.25 }
MapShine | RandomWalkEngine initialized with 2d6 system
MapShine | WeatherOrchestrator initialized: { enabled: true, temp: 18, humidity: 60 }
MapShine | WeatherOrchestrator initialized and active
MapShine | Random Walk Tick: temp +0.30, humidity +4.00
MapShine | Orchestrator transition: clear → drizzle (Light drizzle)
  Atmospheric: 18.3°C, 64% humidity
  Intensity: 0.45, Duration: 10000ms
```

## Troubleshooting

### Orchestrator not found
**Problem:** `game.mapShine.weatherOrchestrator` is undefined

**Solutions:**
1. Check if enabled in config: `game.mapShine.profileManager.activeConfig.weather.orchestrator.enabled`
2. Check if WeatherSystemManager exists: `game.mapShine.weatherSystemManager`
3. Check console for initialization errors
4. Reload scene after enabling

### Weather not changing
**Problem:** Weather stays the same despite parameter changes

**Solutions:**
1. Check if transition threshold is met (15% intensity change)
2. Verify WeatherSystemManager is not in manual mode
3. Check if orchestrator is actually enabled: `game.mapShine.weatherOrchestrator.enabled`
4. Force a tick: `game.mapShine.weatherOrchestrator.forceTick()`

### Transitions too frequent/slow
**Problem:** Weather changes too often or too rarely

**Solutions:**
1. Adjust tick interval: `randomWalkEngine.setTickInterval(seconds)`
2. Adjust step sizes in config: `tempStepSize`, `humidityStepSize`
3. Adjust momentum to smooth changes: `momentum` (0-1)

### Narrative override not working
**Problem:** Weather not pushing toward target state

**Solutions:**
1. Verify override is enabled: `orchestrator.narrativeOverride.enabled`
2. Increase force strength (0-1)
3. Check if target state is reachable with current parameter ranges
4. Force ticks to see effect: `orchestrator.forceTick()`

## Performance Notes

The orchestrator is designed to be lightweight:
- Updates only during particle system ticks (60 FPS cap)
- State resolution is simple matrix lookup (O(1))
- Random walk uses fast dice rolls (no heavy computation)
- Transitions happen in WeatherSystemManager (already optimized)

Expected performance impact: **< 0.1ms per frame**

## Next Steps

After validating core functionality:
1. **Phase 2**: Persistence & Save/Load
2. **Phase 3**: UI Integration (debugger panel)
3. **Phase 4**: Advanced features (pressure, seasonal bias)
