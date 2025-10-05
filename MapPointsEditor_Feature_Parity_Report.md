# MapPointsEditor Feature Parity Report

**Date:** 2025-10-05  
**Objective:** Determine if `MapPointsEditor` can be deprecated in favor of the main UI panel (`MaterialEditorDebugger` / `DebuggerUIBuilder`)

---

## Executive Summary

**❌ MapPointsEditor CANNOT be removed at this time.**

The `MapPointsEditor` provides critical functionality for managing **all types of point groups** (Points, Lines, Areas, and Physics Ropes), including on-canvas point placement and editing. The main UI currently only provides a specialized interface for **Physics Ropes** with limited group management capabilities.

**Current Workflow:** The systems are **highly interdependent**. Users initiate actions like "Create New Rope" or "Create Particle Effect Area" from the main UI, which then **opens the MapPointsEditor** to perform the actual on-canvas drawing and group management.

---

## Detailed Feature Comparison

### 1. Group Management

| Feature | MapPointsEditor | Main UI | Status |
|---------|----------------|---------|--------|
| **View all groups** (Point, Line, Area, Rope) | ✅ Complete list with labels and types | ❌ Only lists rope groups | **Missing from Main UI** |
| **Create Point groups** | ✅ | ❌ | **Missing from Main UI** |
| **Create Line groups** | ✅ | ❌ | **Missing from Main UI** |
| **Create Area groups** | ✅ | ❌ (Relies on MapPointsEditor) | **Partially Missing** |
| **Create Physics Rope groups** | ✅ | ✅ (Opens MapPointsEditor) | **Replicated** |
| **Delete any group** | ✅ | ❌ (Only ropes) | **Partially Missing** |
| **Rename groups** | ✅ | ❌ | **Missing from Main UI** |
| **Change group type** (e.g., Line → Area) | ✅ | ❌ | **Missing from Main UI** |
| **Select groups** | ✅ Interactive selection | ❌ No unified group selector | **Missing from Main UI** |
| **Group validation status** | ✅ Shows broken/valid status | ❌ | **Missing from Main UI** |

### 2. Point Placement & Management

| Feature | MapPointsEditor | Main UI | Status |
|---------|----------------|---------|--------|
| **Activate point placement mode** | ✅ Toggle button | ✅ (Indirectly via opening editor) | **Dependent on Editor** |
| **Add points on canvas** | ✅ Click to place | ❌ | **Missing from Main UI** |
| **Drag/move points on canvas** | ✅ Interactive dragging | ❌ | **Missing from Main UI** |
| **View point coordinates** | ✅ Listed with X/Y values | ❌ | **Missing from Main UI** |
| **Delete individual points** | ✅ Delete button per point | ❌ | **Missing from Main UI** |
| **Visual feedback on canvas** | ✅ MapPointsLayer visualization | ❌ | **Missing from Main UI** |

### 3. Effect Source Configuration

| Feature | MapPointsEditor | Main UI | Status |
|---------|----------------|---------|--------|
| **Set group as Effect Source** | ✅ Checkbox | ❌ | **Missing from Main UI** |
| **Select Target Effect** | ✅ Dropdown with all effects | ❌ | **Missing from Main UI** |
| **Configure Emission Intensity** | ✅ Slider (0.1-15) | ❌ | **Missing from Main UI** |
| **Configure Emission Falloff** | ✅ Toggle + strength slider | ❌ | **Missing from Main UI** |

### 4. Physics Rope Configuration

#### Individual Rope Instance Settings

| Feature | MapPointsEditor | Main UI | Status |
|---------|----------------|---------|--------|
| **Texture Path** | ✅ Input + File Picker | ✅ Input + File Picker | ✅ **Replicated** |
| **Rope End Texture** | ✅ Input + File Picker | ✅ Input + File Picker | ✅ **Replicated** |
| **Rope End Scale** | ✅ Slider (0.1-5) | ✅ Slider (0.1-5) | ✅ **Replicated** |
| **Tapering** | ✅ Slider (0-1) | ✅ Slider (0-1) | ✅ **Replicated** |
| **Segment Length** | ✅ Slider (5-50) | ❌ | **Missing from Main UI** |
| **Spring Constant** | ✅ Slider (0.1-2.0) | ❌ | **Missing from Main UI** |
| **Damping** | ✅ Slider (0.001-0.999) | ✅ Slider (0.001-0.999) | ✅ **Replicated** |
| **Wind Force** | ✅ Slider (0-3) | ✅ Slider (0-3) | ✅ **Replicated** |
| **Animation Speed** | ✅ Slider (0.1-3) | ✅ Slider (0.1-3) | ✅ **Replicated** |
| **Is Indoors** | ✅ Checkbox | ✅ Checkbox | ✅ **Replicated** |
| **Rope End Stiffness** | ❌ | ✅ Slider (0-1) | ✅ **New in Main UI** |
| **Endpoint Fade** | ❌ | ✅ Slider (0-1) | ✅ **New in Main UI** |
| **Indoor Wind Shielding** | ❌ | ✅ Slider (0-1) | ✅ **New in Main UI** |
| **Fade Start/End Distance** | ❌ | ✅ Sliders (0.01-0.5) | ✅ **New in Main UI** |

#### Default Settings for Rope Types

| Feature | MapPointsEditor | Main UI | Status |
|---------|----------------|---------|--------|
| **Configure defaults** | ❌ | ✅ Per-type defaults | ✅ **New in Main UI** |
| **Reset to defaults** | ❌ | ✅ Reset button | ✅ **New in Main UI** |
| **Categorize by type** | ❌ | ✅ Rope/Chain/Elastic | ✅ **New in Main UI** |

---

## Critical Dependencies

### MapPointsInteractionManager

The `MapPointsInteractionManager` class (lines 22830+) is **tightly coupled** to the `MapPointsEditor`:

```javascript
get editor() {
  return game.mapShine.mapPointsEditor;
}
```

This manager handles:
- Canvas pointer events for point placement
- Dragging existing points
- Proximity detection for point selection
- Integration with the MapPointsLayer for visual feedback

**Current Workflow Example:**
1. User clicks "Create New Rope" in main UI
2. Main UI calls `_createPhysicsRope()` method
3. Method opens/focuses the `MapPointsEditor`
4. Method activates `MapPointsInteractionManager`
5. User draws points on canvas
6. Points are managed by the editor

---

## Missing Features in Main UI

To achieve feature parity and allow deprecation of `MapPointsEditor`, the following must be implemented in `MaterialEditorDebugger`:

### High Priority (Essential for Deprecation)

1. **Unified Group Manager Panel**
   - Display all group types (not just ropes)
   - Select, rename, delete any group
   - Show validation status (broken/valid)
   - Group type dropdown for conversion

2. **On-Canvas Point Management**
   - Integrate `MapPointsInteractionManager` directly
   - Activate placement mode from main UI
   - Display point list for selected group
   - Delete individual points

3. **Effect Source Configuration Section**
   - "Use as Effect Source" checkbox
   - Effect target dropdown
   - Emission intensity/falloff controls

4. **Individual Rope Physics Settings**
   - Add **Segment Length** slider (currently only in defaults)
   - Add **Spring Constant** slider (currently only in defaults)

### Medium Priority (Quality of Life)

5. **Point Coordinate Display**
   - Show X/Y coordinates for each point
   - Potentially allow manual coordinate editing

6. **Group Creation Workflow**
   - "New Group" button with type selector
   - Name input field
   - Create without opening separate editor

### Low Priority (Nice to Have)

7. **Group Organization**
   - Filter groups by type
   - Sort by name, type, or creation date
   - Search functionality

---

## Advantages of Keeping MapPointsEditor

Despite the goal of UI consolidation, the `MapPointsEditor` has some advantages:

1. **Dedicated Interface**: Focused UI for spatial operations
2. **Larger Canvas**: More room for group lists and properties
3. **Separate Window**: Can be positioned alongside main UI
4. **Visual Clarity**: Dedicated workflow for drawing geometry
5. **Lower Risk**: Proven system with stable functionality

---

## Recommendations

### Short-Term (Current State)

**Keep both systems** with the current interdependent workflow. This is already functional and users can leverage both UIs as needed.

### Medium-Term (Gradual Migration)

**Phase 1:** Add unified group manager to main UI
- Group list for all types (not just ropes)
- Basic CRUD operations (Create, Read, Update, Delete)
- Effect source configuration panel

**Phase 2:** Integrate point management
- Activate placement mode from main UI
- Display points for selected group
- Delete points from main UI

**Phase 3:** Complete physics rope parity
- Add missing sliders (Segment Length, Spring Constant)
- Ensure all settings are available

**Phase 4:** Deprecate MapPointsEditor
- Add migration notice
- Make MapPointsEditor opt-in
- Eventually remove in major version

### Long-Term (Full Consolidation)

Create a **tabbed interface** in `MaterialEditorDebugger`:
- **Tab 1:** Visual Effects (current main content)
- **Tab 2:** Point Groups & Geometry (replaces MapPointsEditor)
- **Tab 3:** Global Settings

Or create a **floating panel system** where group management can be docked/undocked as needed.

---

## Conclusion

The `MapPointsEditor` provides essential functionality that is **not replicated** in the main UI, particularly for:
- Managing non-rope groups (Points, Lines, Areas)
- On-canvas point placement and editing
- Effect source configuration
- Individual rope physics settings (Segment Length, Spring Constant)

**Final Verdict: DO NOT REMOVE MapPointsEditor at this time.**

Significant development work is required to migrate all features to the main UI. The current interdependent system is functional and should be maintained until a comprehensive migration plan can be executed.
