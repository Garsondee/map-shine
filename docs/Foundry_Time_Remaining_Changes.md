# Remaining Code Changes for Foundry Time Sync

## File: scripts/module.js

### Change 1: Add Mode Toggle Button HTML (Line ~32787)

**Before:**
```javascript
    const disclaimerHTML = this.options.showDisclaimer
      ? '<p class="clock-disclaimer">Controls scene visuals only. Does not change Foundry\'s world time.</p>'
      : "";
```

**After:**
```javascript
    // Mode toggle button
    const modeToggleHTML = `
      <button class="clock-mode-toggle" data-action="toggle-time-mode" title="${this.timeMode === 'foundry' ? 'Switch to Manual Time Control' : 'Sync to Foundry World Time'}">
        ${this.timeMode === 'foundry' ? '🔗 Foundry Time' : '✋ Manual'}
      </button>
    `;
    
    const disclaimerHTML = this.options.showDisclaimer
      ? '<p class="clock-disclaimer">Controls scene visuals only. Does not change Foundry\'s world time.</p>'
      : "";
```

---

### Change 2: Add CSS for Mode Toggle and Disabled Controls (Line ~32852)

**Before:**
```css
.clock-controls button:hover { background: #555; }
.clock-controls .time-display-input { width: 60px; height: 30px; text-align: center; font-size: 1.1em; background: #2a2a2a; color: white; border: 1px solid #666; border-radius: 4px; }
.clock-disclaimer { font-size: 11px; color: #aaa; text-align: center; margin: 8px 0 0 0; max-width: 160px; line-height: 1.3; }
```

**After:**
```css
.clock-controls button:hover { background: #555; }
.clock-controls button:disabled { opacity: 0.3; cursor: not-allowed; }
.clock-controls .time-display-input { width: 60px; height: 30px; text-align: center; font-size: 1.1em; background: #2a2a2a; color: white; border: 1px solid #666; border-radius: 4px; }
.clock-controls .time-display-input:disabled { opacity: 0.5; cursor: not-allowed; }
.clock-mode-toggle { width: auto !important; padding: 4px 8px; font-size: 0.9em; margin-top: 4px; background: #2a4a2a; border: 1px solid #4a8a4a; color: #aaffaa; }
.clock-mode-toggle:hover { background: #3a5a3a; }
.clock-disclaimer { font-size: 11px; color: #aaa; text-align: center; margin: 8px 0 0 0; max-width: 160px; line-height: 1.3; }
```

---

### Change 3: Add Mode Toggle Button to HTML (Line ~32867)

**Before:**
```html
                    <div class="clock-controls">
                        <button data-action="adjust-time" data-amount="-0.25" title="Subtract 15 Minutes">-</button>
                        <input type="text" class="time-display-input" value="${MapShineClock._formatTime(
                          this.currentTime
                        )}">
                        <button data-action="adjust-time" data-amount="0.25" title="Add 15 Minutes">+</button>
                    </div>
                    ${disclaimerHTML}
```

**After:**
```html
                    <div class="clock-controls">
                        <button data-action="adjust-time" data-amount="-0.25" title="Subtract 15 Minutes" ${this.timeMode === 'foundry' ? 'disabled' : ''}>-</button>
                        <input type="text" class="time-display-input" value="${MapShineClock._formatTime(
                          this.currentTime
                        )}" ${this.timeMode === 'foundry' ? 'disabled' : ''}>
                        <button data-action="adjust-time" data-amount="0.25" title="Add 15 Minutes" ${this.timeMode === 'foundry' ? 'disabled' : ''}>+</button>
                    </div>
                    ${modeToggleHTML}
                    ${disclaimerHTML}
```

---

### Change 4: Make Clock Dragging Mode-Aware (Line ~32885)

**Before:**
```javascript
    clockContainer.on("mousedown", (event) => {
      this._isDragging = true;
      this._onDrag(event);
      $(window).on("mousemove.daynightclock", this._onDragBound);
      $(window).on("mouseup.daynightclock", this._onDragEndBound);
    });
```

**After:**
```javascript
    clockContainer.on("mousedown", (event) => {
      // Only allow dragging in manual mode
      if (this.timeMode === 'manual') {
        this._isDragging = true;
        this._onDrag(event);
        $(window).on("mousemove.daynightclock", this._onDragBound);
        $(window).on("mouseup.daynightclock", this._onDragEndBound);
      }
    });
```

---

### Change 5: Make Text Input Mode-Aware (Line ~32907)

**Before:**
```javascript
    this.element.find(".time-display-input").on("change", (event) => {
      const inputVal = event.currentTarget.value;
      const parts = inputVal.split(":");
      if (parts.length === 2) {
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);
        if (!isNaN(hour) && !isNaN(minute)) {
          const newTime = hour + minute / 60;
          this._updateTime(newTime);
        }
      }
    });
  }
```

**After:**
```javascript
    this.element.find(".time-display-input").on("change", (event) => {
      // Only allow manual input in manual mode
      if (this.timeMode === 'manual') {
        const inputVal = event.currentTarget.value;
        const parts = inputVal.split(":");
        if (parts.length === 2) {
          const hour = parseInt(parts[0], 10);
          const minute = parseInt(parts[1], 10);
          if (!isNaN(hour) && !isNaN(minute)) {
            const newTime = hour + minute / 60;
            this._updateTime(newTime);
          }
        }
      }
    });

    // Mode toggle button
    this.element.find('.clock-mode-toggle').on('click', () => {
      this._toggleTimeMode();
    });
  }
```

---

### Change 6: Update destroy() Method (Line ~32921)

**Before:**
```javascript
  destroy() {
    Hooks.off("mapShine:timeChanged", this._onExternalTimeChangeBound);
    $(window).off(".daynightclock");

    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }
```

**After:**
```javascript
  destroy() {
    Hooks.off("mapShine:timeChanged", this._onExternalTimeChangeBound);
    Hooks.off("updateWorldTime", this._onFoundryTimeUpdateBound);
    $(window).off(".daynightclock");

    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }
```

---

### Change 7: Add New Methods (After _onDragEnd, before closing brace ~Line 33147)

**Add these three new methods:**

```javascript
  /**
   * Toggle between manual and Foundry time modes
   */
  _toggleTimeMode() {
    const newMode = this.timeMode === 'manual' ? 'foundry' : 'manual';
    this.timeMode = newMode;

    // Save preference to config
    if (game.mapShine?.profileManager) {
      game.mapShine.profileManager.recordUserChange(
        'timeOfDay.syncFromFoundryTime',
        newMode === 'foundry'
      );
    }

    if (newMode === 'foundry') {
      // Switched to Foundry mode - initialize sync
      this._initializeFoundryTimeSync();
      console.log('MapShine | Clock now following Foundry world time');
    } else {
      // Switched to manual mode - remove hook
      Hooks.off('updateWorldTime', this._onFoundryTimeUpdateBound);
      console.log('MapShine | Clock now in manual control mode');
    }

    // Re-render to update UI
    this.render();
  }

  /**
   * Initialize Foundry time synchronization
   */
  _initializeFoundryTimeSync() {
    if (!game.time) {
      console.warn('MapShine | Foundry time system not available');
      return;
    }

    // Initial sync
    const worldTime = game.time.worldTime ?? 0;
    const hourOfDay = (worldTime / 3600) % 24;
    this._updateTime(hourOfDay, { fromHook: true });

    // Hook for updates
    Hooks.on('updateWorldTime', this._onFoundryTimeUpdateBound);
    
    console.log(`MapShine | Synced to Foundry time: ${hourOfDay.toFixed(2)} hours`);
  }

  /**
   * Handle Foundry world time updates
   */
  _onFoundryTimeUpdate(worldTime, delta, options, userId) {
    if (this.timeMode !== 'foundry') return;

    const hourOfDay = (worldTime / 3600) % 24;
    const currentTime = this.currentTime ?? 12;

    // Threshold: ~36 seconds (0.01 hours) to avoid micro-updates
    if (Math.abs(hourOfDay - currentTime) > 0.01) {
      this._updateTime(hourOfDay, { fromHook: true });
    }
  }
}
```

---

## Implementation Instructions

1. Make the changes in the order listed above
2. Each change is small and focused on a specific area
3. Test after implementing all changes
4. Update module.json version to 1.1.100

## Testing Commands

```javascript
// Check mode
game.mapShine.dayNightClock.timeMode

// Advance Foundry time by 1 hour
await game.time.advance(3600)

// Set to noon
await game.time.set(43200)

// Toggle mode programmatically
game.mapShine.dayNightClock._toggleTimeMode()
```
