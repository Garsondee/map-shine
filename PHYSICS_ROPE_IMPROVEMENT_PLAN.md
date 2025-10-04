# Physics Rope System Improvement Plan

## Overview
Enhance the Physics Rope system to support multiple ropes with different types/categories (rope, chain, elastic) and add a quick-add "Green +" button similar to particle systems.

## Current State Analysis

### Existing Components
1. **PhysicsRope class** (line ~20454): Individual rope with Verlet physics
2. **PhysicsRopeLayer class** (line ~20738): Canvas layer managing all ropes
3. **MapPointsEditor** (line ~20839): UI for creating/editing map point groups
4. **MapPointsManager**: Manages rope groups stored in scene flags
5. **Profile Settings**: Default rope settings in `physicsRope` config

### Current Rope Properties (per group)
- `type: "rope"` - Identifies as physics rope
- `texturePath` - Custom texture path
- `gravity` - Gravity strength
- `segmentLength` - Physics segment size
- `animationSpeed` - Animation multiplier
- `indoorWindShielding` - Wind reduction indoors
- `isIndoors` - Indoor flag

### Current Limitations
1. No quick-add button for ropes (unlike particle systems)
2. No rope type/category system (rope, chain, elastic)
3. No file picker in MapPointsEditor UI for rope texture
4. Each rope group stores individual properties without type presets

## Implementation Plan

### Phase 1: Add Quick-Add "Green +" Button (30 min)
**Goal**: Add a button in the debugger UI to quickly create a rope group

**Steps**:
1. Find where particle effect "Green +" buttons are implemented in debugger UI
2. Add similar button for Physics Rope in the `_getPhysicsRopeHTML()` method
3. Create `_createPhysicsRope()` method similar to `_createParticleEffectArea()`
4. Wire up button click handler in `DebuggerEventHandler`

**Implementation Details**:
- Button should open MapPointsEditor if not open
- Create new rope group with default settings
- Activate point placement mode
- Select the new group automatically

### Phase 2: Add Rope Type/Category System (45 min)
**Goal**: Support different rope types with preset configurations

**Steps**:
1. Define rope type constants and presets:
   ```javascript
   const ROPE_TYPE_PRESETS = {
     rope: {
       label: "Rope",
       texturePath: "modules/map-shine/assets/rope.webp",
       gravity: 500,
       segmentLength: 10,
       damping: 0.99,
       tapering: 0.5
     },
     chain: {
       label: "Chain",
       texturePath: "modules/map-shine/assets/chain.webp",
       gravity: 800,
       segmentLength: 15,
       damping: 0.95,
       tapering: 0.2
     },
     elastic: {
       label: "Elastic",
       texturePath: "modules/map-shine/assets/elastic.webp",
       gravity: 300,
       segmentLength: 8,
       damping: 0.98,
       tapering: 0.7
     }
   };
   ```

2. Add `ropeType` property to rope groups (defaults to "rope")
3. Update `MapPointsManager.createGroup()` to accept ropeType parameter
4. Update rope initialization to use preset values as defaults
5. Add rope type selector to MapPointsEditor UI

### Phase 3: Add File Picker to MapPointsEditor (30 min)
**Goal**: Allow users to select custom textures directly in the editor

**Steps**:
1. Add rope settings section to `_buildHTML()` when `selectedGroup.type === "rope"`
2. Include texture path input field with file picker button
3. Add sliders for gravity, segmentLength, animationSpeed, tapering, damping
4. Add indoor settings (isIndoors checkbox, indoorWindShielding slider)
5. Wire up the existing `pick-rope-texture` action (already implemented at line 21235)

**UI Structure**:
```html
<div class="mp-rope-settings" style="display: ${selectedGroup.type === 'rope' ? 'block' : 'none'}">
  <h4>Physics Rope Settings</h4>
  
  <div class="control-row">
    <label>Rope Type</label>
    <select name="ropeType">
      <option value="rope">Rope</option>
      <option value="chain">Chain</option>
      <option value="elastic">Elastic</option>
    </select>
  </div>
  
  <div class="control-row">
    <label>Texture Path</label>
    <input type="text" name="texturePath" id="mp-rope-texturePath" value="...">
    <button type="button" data-action="pick-rope-texture">
      <i class="fas fa-file-image"></i>
    </button>
  </div>
  
  <!-- Sliders for physics properties -->
  <div class="control-row control-row-slider">
    <label>Gravity</label>
    <input type="range" name="gravity" min="0" max="1000" step="10" value="...">
    <span class="value-span">...</span>
  </div>
  
  <!-- More sliders... -->
</div>
```

### Phase 4: Update Profile Settings (15 min)
**Goal**: Add default settings for each rope type

**Steps**:
1. Expand `physicsRope` config to include type-specific defaults
2. Update `_getPhysicsRopeHTML()` to show settings for each type
3. Add UI to configure default textures for rope/chain/elastic

### Phase 5: Testing & Polish (20 min)
**Goal**: Ensure everything works smoothly

**Test Cases**:
1. ✓ Quick-add button creates rope and opens editor
2. ✓ File picker opens and sets texture path
3. ✓ Rope type selector changes preset values
4. ✓ Custom texture overrides work correctly
5. ✓ Multiple ropes of different types render correctly
6. ✓ Scene transitions preserve rope settings
7. ✓ Settings save/load from scene flags correctly

## File Modifications Required

### module.js
- Line ~588: Add `ROPE_TYPE_PRESETS` constant
- Line ~3163: Expand `physicsRope` config structure
- Line ~9380: Update `MapPointsManager.createGroup()` for rope types
- Line ~20454: Update `PhysicsRope` constructor to accept type
- Line ~20777: Update rope initialization to use presets
- Line ~20975: Add rope settings UI in `_buildHTML()`
- Line ~21097: Add rope property change handlers
- Line ~30290: Update `_getPhysicsRopeHTML()` with quick-add button
- Line ~31238: Add `_createPhysicsRope()` method

### Estimated Total Time: 2.5 hours

## Success Criteria
1. ✓ "Green +" button quickly creates rope groups
2. ✓ Three rope types available with distinct presets
3. ✓ File picker functional in MapPointsEditor
4. ✓ Custom textures override type defaults
5. ✓ All settings persist correctly
6. ✓ Multiple ropes of different types work simultaneously
