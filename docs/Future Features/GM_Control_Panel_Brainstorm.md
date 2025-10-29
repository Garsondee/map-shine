# GM Control Panel - Feature Brainstorm
**Version:** 1.2.17+  
**Date:** 2025-10-26

## Vision
Transform the DayNightClock into a comprehensive GM Quick Access Panel - a compact, always-accessible control hub for the most frequently adjusted Map Shine settings.

**Design Philosophy:**
- **Quick access over completeness** - Only the controls GMs use frequently
- **One-click actions** - Dropdowns, toggles, presets
- **Visual feedback** - Icons, colors, animations showing current state
- **Minimal real estate** - Compact, draggable, collapsible
- **No debugger required** - Common adjustments without opening full UI

---

## Current Features ✅
1. **Time of Day Control** - Drag clock, +/- buttons, manual input
2. **Time Mode Toggle** - Switch between Manual/Foundry sync
3. **Weather Dropdown** - 7 weather states with one click
4. **Wind Direction Indicator** - Red arrow showing current wind (visual only)

---

## Tier 1: High-Impact, Low-Complexity 🎯

### 1. Profile Quick Switch
**What:** Dropdown showing saved profiles
**Why:** GMs often switch between day/night/dramatic profiles
**Implementation:**
- Reads from `ProfileManager.getAvailableProfiles()`
- Shows current profile highlighted
- Click to instantly switch with transition
- Maybe show profile preview tooltip on hover?

**UI Pattern:** Same dropdown style as weather indicator
```
📋 Current Profile Name  [click to expand]
  ↓
  ┌─────────────────┐
  │ ✓ Day Standard  │ (active)
  │   Night Moody   │
  │   Dramatic      │
  │   Spooky        │
  └─────────────────┘
```

---

### 2. Time-of-Day Presets
**What:** Quick buttons for common times
**Why:** Faster than dragging clock or typing
**Implementation:**
- 4-6 preset buttons: Dawn (6:00), Noon (12:00), Dusk (18:00), Midnight (0:00)
- Maybe add "Golden Hour" (17:00), "Witching Hour" (3:00)
- One click sets time with smooth transition

**UI Pattern:** Compact icon buttons below clock
```
🌅 Dawn  |  ☀️ Noon  |  🌇 Dusk  |  🌙 Night
```

---

### 3. Scene Darkness Quick Slider
**What:** Slider for Foundry's scene.darkness (0-1)
**Why:** Separate from time control, useful for manual lighting
**Implementation:**
- Only shows if `syncToSceneDarkness` is disabled
- Direct `canvas.scene.update({ darkness: value })`
- Show current value as percentage

**UI Pattern:** Horizontal slider with icon
```
💡 Scene Brightness: ▓▓▓▓▓▓▓▓░░ 80%
```

---

### 4. Wind Controls (Interactive)
**What:** Make the wind arrow interactive - click to adjust
**Why:** Wind arrow is currently just an indicator
**Implementation:**
- Click wind arrow to open mini-control
- Slider for strength (0-100%)
- Circular dial for direction (0-360°)
- Or simple +/- buttons for quick adjustments

**UI Pattern:** Popup on wind arrow click
```
       ↑ (wind arrow - click to adjust)
    ┌──────────┐
    │ Strength │
    │ ▓▓▓▓░░░  │ 60%
    │ Direction│
    │   ↗ 45°  │
    └──────────┘
```

---

## Tier 2: Medium-Impact, Moderate Complexity 🔧

### 5. Effect Toggle Switches
**What:** Quick on/off for major effect categories
**Why:** Quick performance boost or visual cleanup
**Implementation:**
- Toggles for: Particles, Metallic, Color Correction, Post-FX
- Updates `profileManager.activeConfig.{category}.enabled`
- Visual indicator (green = on, gray = off)

**UI Pattern:** Icon toggles
```
🔥 Fire  💧 Water  ✨ Metal  🎨 Color
 ON       ON       OFF      ON
```

---

### 6. Master Intensity Slider
**What:** Global multiplier for all effects (0-200%)
**Why:** Quick "dial it down" without disabling
**Implementation:**
- Multiplies intensity of all active effects
- Stored as global modifier in profileManager
- Useful for dramatic moments or performance tuning

**UI Pattern:** Simple slider
```
🎚️ Master FX: ▓▓▓▓▓▓▓▓▓▓ 100%
```

---

### 7. Lighting Preset Buttons
**What:** Pre-configured lighting scenarios
**Why:** Common moods without manual adjustment
**Implementation:**
- Presets: "Bright", "Dim", "Dark", "Dramatic", "Horror"
- Sets darkness + color correction + ambient settings
- Saved in MODULE_DEFAULTS or user-defined

**UI Pattern:** Button row
```
[Bright] [Dim] [Dark] [Dramatic] [Horror]
```

---

## Tier 3: Advanced Features 🚀

### 8. Animation Speed Control
**What:** Global time factor multiplier
**Why:** Slow-mo or speed-up for dramatic effect
**Implementation:**
- Adjusts `game.mapShine.timeControl.timeFactor`
- Range: 0.1x to 5.0x
- Affects particles, clouds, wind, transitions

**UI Pattern:** Slider with playback icons
```
⏪ ⏸️ ▶️ ⏩
Animation Speed: ▓▓▓▓▓░░░░░ 1.0x
```

---

### 9. Quick Save/Restore State
**What:** Snapshot current settings, restore later
**Why:** Experimentation without losing good setup
**Implementation:**
- "Snapshot" button saves current state to memory
- "Restore" button reverts to snapshot
- Maybe 3 quick-save slots

**UI Pattern:** Save/load buttons
```
📸 Snapshot  |  🔄 Restore  |  [Slot 1] [Slot 2] [Slot 3]
```

---

### 10. Combat/Exploration Mode Toggle
**What:** Switch between preset "modes"
**Why:** Different settings for combat vs exploration
**Implementation:**
- Combat Mode: Reduced particles, higher contrast, faster updates
- Exploration Mode: Full effects, ambient focus
- Stored as mode presets

**UI Pattern:** Toggle switch
```
🗡️ Combat ◄───○───► 🧭 Explore
```

---

### 11. Player View Sync
**What:** Force all players to match GM's current visual settings
**Why:** Ensure everyone sees the same dramatic moment
**Implementation:**
- "Sync to Players" button
- Broadcasts current config via socket
- Players get notification + auto-apply

**UI Pattern:** Action button
```
[📡 Sync Visuals to All Players]
```

---

### 12. Performance Monitor Mini-Display
**What:** Live FPS counter in control panel
**Why:** Quick check if effects are impacting performance
**Implementation:**
- Small FPS display (updates every second)
- Color-coded: Green (60+), Yellow (30-60), Red (<30)
- Optional particle count display

**UI Pattern:** Status badge
```
⚡ 60 FPS | 🔥 450 particles
```

---

## UI Layout Concepts

### Concept A: Accordion Sections
```
┌─────────────────────┐
│   🕐 CLOCK FACE     │
├─────────────────────┤
│   Time Controls     │
│   [▼] Quick Sets    │
│   [▶] Weather       │  ← Click to expand
│   [▶] Wind          │
│   [▶] Effects       │
│   [▶] Lighting      │
└─────────────────────┘
```

### Concept B: Tabbed Interface
```
┌─────────────────────┐
│   🕐 CLOCK FACE     │
├─────────────────────┤
│ [Time] [Env] [FX]   │  ← Tabs
│                     │
│  Current Tab Content│
│                     │
└─────────────────────┘
```

### Concept C: Compact Always-Visible
```
┌─────────────────────┐
│   🕐 CLOCK FACE     │
│   🌧️ Weather        │
│   💨 Wind           │
├─────────────────────┤
│ [Dawn][Noon][Dusk]  │
│ 📋 Profile ▼        │
│ 🎚️ FX: ▓▓▓▓ 100%   │
└─────────────────────┘
```

---

## Recommended Implementation Order

**Phase 1: Environmental Controls** (Natural extension of weather)
1. ✅ Weather Dropdown (DONE)
2. Time-of-Day Presets (buttons)
3. Wind Controls (interactive arrow)

**Phase 2: Visual Quick Access**
4. Profile Quick Switch
5. Scene Darkness Slider
6. Effect Category Toggles

**Phase 3: Advanced Controls**
7. Master Intensity Slider
8. Lighting Presets
9. Quick Save/Restore

**Phase 4: Polish & Power Features**
10. Animation Speed Control
11. Performance Monitor
12. Player Sync

---

## Technical Considerations

### State Management
- All controls update via `ProfileManager.recordUserChange()`
- Maintains undo/redo capability
- Persists in scene flags

### Performance
- State-based updates (like weather dropdown)
- Avoid frame-by-frame DOM manipulation
- Debounce slider inputs (100-200ms)

### UI Framework
- Continue inline styles pattern for portability
- Reuse dropdown pattern from weather
- Consider CSS custom properties for theming

### Accessibility
- All controls keyboard-navigable
- Clear hover states and tooltips
- Screen reader friendly labels

---

## Questions to Consider

1. **Collapsible sections?** Start compact, expand categories as needed?
2. **Persistent or pop-up?** Always visible vs click-to-open?
3. **Drag to reorder?** Let GMs customize control order?
4. **Hotkeys?** Keyboard shortcuts for common actions?
5. **Multi-instance?** Allow multiple control panels (one per monitor)?
6. **Mobile-friendly?** Touch-optimized for tablet GMs?

---

## Next Steps

**Immediate (v1.2.18):**
- Implement Time-of-Day Presets (4 buttons: Dawn, Noon, Dusk, Night)
- Most useful, easiest to add, follows existing time control pattern

**Then (v1.2.19):**
- Profile Quick Switch dropdown
- Reuses weather dropdown pattern, high GM value

**After That:**
- Wind controls or Scene darkness slider
- Both are natural extensions of existing indicators

---

## Inspiration & References

- **Blender's Quick Favorites** - User-customizable quick access
- **Photoshop's Adjustment Panel** - Compact, stackable controls
- **OBS Studio's Scene Switcher** - One-click scene changes
- **Discord's User Panel** - Always-accessible, minimal space
- **Foundry's Macro Bar** - Quick access paradigm GMs already use

---

*This is a living document - add ideas as they emerge!*
