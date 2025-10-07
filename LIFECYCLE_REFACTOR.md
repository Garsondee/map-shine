# MapShine Lifecycle Refactor - Event-Driven Architecture

## Overview
Refactored the MapShine lifecycle coordination system from a fragile global promise pattern to a robust Hook-based event system.

## Problem Statement
The previous implementation used global promise resolvers (`setupCompletionPromise`, `resolveSetupCompletion`) to coordinate between the lifecycle methods and the scene transition wrapper. This approach had several issues:

1. **Fragile State Management**: Global promises could be orphaned or never resolved
2. **Error-Prone**: If lifecycle methods threw errors, promises might never resolve
3. **Tight Coupling**: Scene transition wrapper directly manipulated lifecycle state
4. **Race Conditions**: Promise setup and resolution could occur in unexpected orders

## Solution: Hook-Based Events

### Architecture Changes

#### 1. Lifecycle Methods Emit Events
Both `runFullSetup()` and `runMinimalSetup()` now emit a `mapShine:setupComplete` Hook when initialization is complete:

```javascript
// At the end of runFullSetup()
Hooks.callAll("mapShine:setupComplete", { type: "full" });

// At the end of runMinimalSetup()
Hooks.callAll("mapShine:setupComplete", { type: "minimal" });
```

#### 2. Scene Wrapper Listens for Events
The `Scene.prototype.view` wrapper now uses `Hooks.once()` to wait for setup completion:

```javascript
const setupCompletePromise = new Promise((resolve) => {
  const hookId = Hooks.once("mapShine:setupComplete", (data) => {
    console.log(`Setup complete (${data.type}), proceeding with fade-in`);
    resolve();
  });
  game.mapShine._transitionHookId = hookId;
});

await Promise.race([setupCompletePromise, timeoutPromise]);
```

#### 3. Proper Cleanup
Hook cleanup is guaranteed in multiple paths:
- **Success path**: Hook reference cleared after setup completes
- **Timeout path**: Hook explicitly removed if timeout occurs
- **Error path**: Emergency cleanup removes hook if it exists

### Benefits

1. **Decoupled**: Lifecycle methods don't need to know about transition coordination
2. **Self-Contained**: Each method is responsible for its own completion signaling
3. **Robust Error Handling**: Hooks continue to work even if errors occur
4. **Standard Pattern**: Uses Foundry's built-in Hook system (familiar to developers)
5. **Extensible**: Other systems can listen for `mapShine:setupComplete` if needed

## Files Modified

### `scripts/module.js`

#### Removed Global State
```javascript
// REMOVED from game.mapShine initialization:
setupCompletionPromise: null,
resolveSetupCompletion: null,
```

#### Updated `runFullSetup()`
- Added JSDoc documentation explaining the event-driven architecture
- Added `Hooks.callAll("mapShine:setupComplete", { type: "full" })` at the end
- Removed promise resolver logic

#### Updated `runMinimalSetup()`
- Added `Hooks.callAll("mapShine:setupComplete", { type: "minimal" })` at the end
- Removed promise resolver logic

#### Updated `Scene.prototype.view` Wrapper
- Added comprehensive documentation block
- Replaced promise setup with Hook listener
- Added Hook cleanup in timeout path
- Added Hook cleanup in error path
- Removed references to global promise properties

## Testing Recommendations

1. **Normal Scene Transitions**: Verify smooth transitions with proper timing
2. **Timeout Scenarios**: Test with very slow systems to ensure timeout works
3. **Error Scenarios**: Introduce errors in lifecycle to verify graceful degradation
4. **Multiple Rapid Transitions**: Ensure hooks are properly cleaned up
5. **Minimal Setup Path**: Test scenes with no effect maps to verify minimal setup works

## Future Enhancements

This event-driven architecture opens up possibilities for:

1. **Progress Events**: Emit intermediate events during setup for finer-grained control
2. **System-Specific Events**: Individual managers could emit their own ready events
3. **External Integration**: Other modules could listen for MapShine lifecycle events
4. **Debugging Tools**: Hook listeners could be added for development/debugging

## Migration Notes

If any external code was relying on `game.mapShine.setupCompletionPromise` or `game.mapShine.resolveSetupCompletion`, it should be updated to listen for the `mapShine:setupComplete` Hook instead:

```javascript
// OLD (no longer works):
await game.mapShine.setupCompletionPromise;

// NEW:
Hooks.once("mapShine:setupComplete", (data) => {
  console.log(`MapShine setup complete: ${data.type}`);
  // Your code here
});
```
