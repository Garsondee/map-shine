# Foundry Time Synchronization Implementation

**Version:** 1.1.100  
**Date:** 2025-01-24  
**Feature:** Auto-sync Map Shine Time of Day with Foundry VTT world time

---

## Overview

Map Shine's Time of Day system can now automatically synchronize with Foundry VTT's world time (`game.time.worldTime`). This allows GMs using time management modules (like Simple Calendar) to have visual effects automatically update when they advance time.

## Key Features

✅ **One-way sync only** - Foundry → Map Shine (never modifies world time)  
✅ **UI toggle button** - Switch between "Manual" and "Foundry Time" modes directly on clock  
✅ **Disabled controls** - Manual controls disabled when in Foundry mode  
✅ **Auto-initialization** - Syncs immediately when entering Foundry mode  
✅ **Hook-based updates** - Uses `updateWorldTime` hook for real-time changes  
✅ **Threshold filtering** - Only updates when time changes by >36 seconds (0.01 hours)

---

## User Experience

### Mode Toggle Button

The clock now displays a mode toggle button below the time controls:

**Manual Mode:**
- Button shows: "✋ Manual"
- Background: Dark (default state)
- All controls enabled (drag, +/-, text input)

**Foundry Time Mode:**
- Button shows: "🔗 Foundry Time"
- Background: Green tint
- All manual controls disabled
- Time updates automatically from `game.time.worldTime`

### Behavior

**When entering Foundry Mode:**
1. Immediately syncs to current `game.time.worldTime`
2. Disables manual time controls (visual opacity)
3. Hooks into `updateWorldTime` for automatic updates
4. Console log: "MapShine | Clock now following Foundry world time"

**When entering Manual Mode:**
5. Removes `updateWorldTime` hook
6. Re-enables manual controls
7. Retains current time value
8. Console log: "MapShine | Clock now in manual control mode"

---

## Technical Implementation

### Configuration

**Location:** `MODULE_DEFAULTS.timeOfDay` (line ~1702)

```javascript
"timeOfDay": {
  "enabled": true,
  "syncToSceneDarkness": true,   // Existing: Map Shine → Foundry darkness
  "syncFromFoundryTime": false,  // NEW: Foundry → Map Shine time
  "currentTime": 12.0
}
```

### MapShineClock Class Changes

**File:** `scripts/module.js` lines ~32690-33200

#### 1. Constructor Modifications

**Added Properties:**
- `this.timeMode` - 'manual' or 'foundry'
- `this._onFoundryTimeUpdateBound` - Bound hook callback

**Initialization Logic:**
```javascript
this.timeMode = 
  game.mapShine?.profileManager?.activeConfig?.timeOfDay?.syncFromFoundryTime
  ? 'foundry' : 'manual';

if (this.timeMode === 'foundry') {
  this._initializeFoundryTimeSync();
}
```

#### 2. New Methods

**`_toggleTimeMode()`** - Switches between manual/Foundry modes
- Updates `this.timeMode`
- Saves preference via `profileManager.recordUserChange()`
- Initializes/removes Foundry sync
- Re-renders UI

**`_initializeFoundryTimeSync()`** - Sets up Foundry time synchronization
- Converts `game.time.worldTime` (seconds) to hours (0-24)
- Performs initial sync
- Registers `updateWorldTime` hook
- Logs sync confirmation

**`_onFoundryTimeUpdate(worldTime, delta, options, userId)`** - Hook callback
- Only processes if `timeMode === 'foundry'`
- Converts seconds to 24-hour time
- Applies 0.01 hour threshold to prevent micro-updates
- Updates clock display via `_updateTime(..., { fromHook: true })`

#### 3. UI Modifications

**HTML Template (`_getHTML()`):**
```javascript
const modeToggleHTML = `
  <button class="clock-mode-toggle" data-action="toggle-time-mode" 
    title="${this.timeMode === 'foundry' ? 'Switch to Manual Time Control' : 'Sync to Foundry World Time'}">
    ${this.timeMode === 'foundry' ? '🔗 Foundry Time' : '✋ Manual'}
  </button>
`;
```

**CSS Additions:**
```css
.clock-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
.clock-controls .time-display-input:disabled { opacity: 0.5; cursor: not-allowed; }
.clock-mode-toggle { 
  width: auto !important; 
  padding: 4px 8px; 
  font-size: 0.9em; 
  margin-top: 4px; 
  background: #2a4a2a; 
  border: 1px solid #4a8a4a; 
  color: #aaffaa; 
}
```

**Conditional Disabling:**
```javascript
<button data-action="adjust-time" ${this.timeMode === 'foundry' ? 'disabled' : ''}>-</button>
<input type="text" class="time-display-input" ${this.timeMode === 'foundry' ? 'disabled' : ''}>
<button data-action="adjust-time" ${this.timeMode === 'foundry' ? 'disabled' : ''}>+</button>
```

#### 4. Event Listener Changes

**Clock Dragging:**
```javascript
clockContainer.on("mousedown", (event) => {
  if (this.timeMode === 'manual') {  // Only allow in manual mode
    this._isDragging = true;
    // ... drag logic
  }
});
```

**Text Input:**
```javascript
this.element.find(".time-display-input").on("change", (event) => {
  if (this.timeMode === 'manual') {  // Only allow in manual mode
    // ... input parsing logic
  }
});
```

**Mode Toggle:**
```javascript
this.element.find('.clock-mode-toggle').on('click', () => {
  this._toggleTimeMode();
});
```

#### 5. Cleanup

**`destroy()` method:**
```javascript
Hooks.off("updateWorldTime", this._onFoundryTimeUpdateBound);  // Remove hook
```

---

## Time Conversion

### Foundry → Map Shine

```javascript
const worldTime = game.time.worldTime;  // Seconds since start
const hourOfDay = (worldTime / 3600) % 24;  // 0-24 hour format
```

**Example:**
- `worldTime = 43200` (12 hours * 3600 seconds/hour)
- `hourOfDay = 12.0` (noon)

### Threshold Logic

```javascript
const currentTime = this.currentTime ?? 12;
if (Math.abs(hourOfDay - currentTime) > 0.01) {
  this._updateTime(hourOfDay, { fromHook: true });
}
```

**Reasoning:**
- 0.01 hours = 36 seconds
- Prevents flickering from fractional second updates
- Foundry time often increments in small steps (combat rounds, etc.)

---

## Integration Points

### ProfileManager

**Method:** `recordUserChange(path, value)`
- Called when user toggles mode
- Path: `'timeOfDay.syncFromFoundryTime'`
- Value: `true` (Foundry mode) or `false` (manual mode)
- Persists preference across sessions

### Existing Time System

**Unchanged:**
- `game.mapShine.updateTimeOfDay(time)` - Still used for all time updates
- `mapShine:timeChanged` hook - Still fired for visual updates
- `syncToSceneDarkness` - Still controls Foundry darkness level (one-way opposite direction)

---

## Testing

### Manual Testing

**Console Commands:**
```javascript
// Check current mode
game.mapShine.dayNightClock.timeMode

// Check current Foundry time
game.time.worldTime
(game.time.worldTime / 3600) % 24  // As hours

// Advance time by 1 hour
await game.time.advance(3600)

// Set specific time (noon)
await game.time.set(43200)

// Set to midnight
await game.time.set(0)

// Check Map Shine time
game.mapShine.profileManager.activeConfig.timeOfDay.currentTime
```

### Expected Behavior

**Scenario 1: Toggle to Foundry Mode**
1. Click "✋ Manual" button
2. Button changes to "🔗 Foundry Time" (green)
3. Manual controls dim (disabled)
4. Time immediately syncs to Foundry time
5. Console: "MapShine | Clock now following Foundry world time"
6. Console: "MapShine | Synced to Foundry time: XX.XX hours"

**Scenario 2: Advance Foundry Time**
1. Ensure clock in Foundry mode
2. Run: `await game.time.advance(3600)` (1 hour)
3. Clock updates visually within 1 frame
4. Scene lighting/colors update via Time of Day system

**Scenario 3: Toggle to Manual Mode**
1. Click "🔗 Foundry Time" button
2. Button changes to "✋ Manual"
3. Manual controls re-enable
4. Time stays at current value
5. Console: "MapShine | Clock now in manual control mode"

**Scenario 4: Time Management Module Compatibility**
1. Install Simple Calendar or similar
2. Set clock to Foundry mode
3. Use module's time advancement UI
4. Verify Map Shine clock updates automatically

---

## Known Limitations

1. **One-way only** - Map Shine never modifies `game.time.worldTime`
2. **No calendar awareness** - Uses raw seconds, not calendar components
3. **24-hour cycle** - Wraps using modulo 24, doesn't account for day changes
4. **Threshold sensitivity** - Very small time changes (<36s) ignored

---

## Future Enhancements

### Optional Improvements

**1. Calendar Integration** (4-6 hours)
- Use `game.time.calendar.components` for time-of-day
- Respect custom day lengths
- Handle different calendar systems

**2. Bi-directional Sync** (6-8 hours)
- Allow Map Shine to update Foundry time (GM only)
- Guard against infinite loops
- Add conflict resolution

**3. Time Scale Awareness** (2-3 hours)
- Detect time compression (e.g., 1 real second = 1 game minute)
- Adjust update throttling accordingly

**4. Visual Indicators** (1-2 hours)
- Show current Foundry time in tooltip
- Display "last synced" timestamp
- Add animation when time updates

---

## Console Commands Reference

```javascript
// Get current sync status
console.log(game.mapShine.profileManager.activeConfig.timeOfDay.syncFromFoundryTime);

// Manually force sync
if (game.mapShine.dayNightClock) {
  game.mapShine.dayNightClock._initializeFoundryTimeSync();
}

// Check if hook is registered
Hooks.events.updateWorldTime?.length

// Simulate time update (testing)
Hooks.callAll('updateWorldTime', 54000, 3600, {}, game.user.id);  // 15:00
```

---

## Changelog

**v1.1.100** - Initial implementation
- Added `syncFromFoundryTime` configuration option
- Created mode toggle button on clock UI
- Implemented `_toggleTimeMode()`, `_initializeFoundryTimeSync()`, `_onFoundryTimeUpdate()`
- Added conditional disabling of manual controls
- Added hook cleanup in `destroy()`
- Updated documentation

---

**Status:** ✅ Implementation Complete  
**Testing:** Ready for user validation  
**Documentation:** Complete

