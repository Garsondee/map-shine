# MapShine Module - Compatibility Improvement Plan

**Created:** 2025-10-06  
**Version:** 1.0.47  
**Priority:** High - Reliability & Ecosystem Compatibility

---

## Executive Summary

This document outlines a comprehensive plan to improve the reliability and compatibility of MapShine's **Loading Screen** and **Pause System** features. The goal is to eliminate conflicts with other modules and specialized hosting environments (e.g., The Forge) by adopting Foundry VTT best practices.

### Current Issues
- **Scene Transition System:** Uses libWrapper to patch `Scene.prototype.view`, which can conflict with other modules patching the same method
- **Pause System:** Directly manipulates the `#pause` DOM element's innerHTML, destroying content added by other modules

### Proposed Solutions
- **Scene Transition:** Make the feature optional with a module setting (primary) and add defensive compatibility checks (secondary)
- **Pause System:** Refactor to use Foundry's `Application` class pattern instead of DOM manipulation

---

## Part 1: Analysis of Conflict Points

### A. Scene Transition System (Loading Screen)

#### Current Implementation
**Location:** `scripts/module.js` (lines ~4578-4834)  
**Method:** libWrapper with `WRAPPER` mode on `Scene.prototype.view`

```javascript
libWrapper.register(
  MODULE_ID,
  "Scene.prototype.view",
  async function (wrapped, ...args) {
    // Custom transition logic here
    const sceneManager = canvas.sceneChangeManager;
    await sceneManager.fadeOut(transitionConfig, sceneName);
    const result = await wrapped(...args);
    await sceneManager.fadeIn(transitionConfig);
    return result;
  },
  "WRAPPER"
);
```

#### Why This Causes Conflicts
1. **Highly Patched Method:** `Scene.prototype.view` is one of the most frequently wrapped methods in the Foundry ecosystem
2. **Chain Dependencies:** Multiple WRAPPER patches form a chain - any link failing breaks the entire process
3. **Async Timing Issues:** If another module's wrapper doesn't handle async properly, transitions can hang
4. **The Forge Conflicts:** Specialized hosting environments have their own pre-loading systems that can clash
5. **No API Alternative:** Foundry currently provides no dedicated hook for scene transition timing (API gap)

#### Why We Use This Method
The core Foundry VTT API lacks a hook that fires between scene unload and new scene render. Patching `Scene.prototype.view` is currently the *only* reliable way to create seamless transitions that show content during the switch.

---

### B. Pause System

#### Current Implementation
**Location:** `scripts/module.js` (class `PauseScreenManager`, lines ~10171-10600)  
**Method:** Hook-based with direct DOM manipulation

```javascript
Hooks.on("pauseGame", (paused) => {
  if (paused) {
    const pauseElement = document.getElementById("pause");
    pauseElement.innerHTML = ""; // ⚠️ DESTROYS OTHER MODULE CONTENT
    pauseElement.innerHTML = customHTML;
  }
});
```

#### Why This Causes Conflicts
1. **Shared DOM Space:** The `#pause` element is shared by all modules
2. **Destructive Operation:** `innerHTML = ""` completely erases content added by other modules
3. **No Cooperation:** Doesn't check for or preserve existing content
4. **Poor Practice:** Direct DOM manipulation instead of Foundry's Application pattern

#### Examples of Affected Modules
- **Dice So Nice:** May show roll logs during pause
- **Custom Pause Message Modules:** Any module adding pause-time notifications
- **Chat Overlays:** Modules that display chat during pause

---

## Part 2: Implementation Plan

### Phase 1: Scene Transition - Make Optional (HIGH PRIORITY)

**Goal:** Provide an "off switch" for users experiencing conflicts

#### Step 1.1: Create Module Setting
**File:** `scripts/module.js` (settings registration section)

```javascript
// Add to registerSettings() function
game.settings.register(MODULE_ID, "sceneTransition.enabled", {
  name: "Enable Custom Scene Transitions",
  hint: "Shows animated loading screens during scene changes. Disable this if you experience conflicts with other modules or The Forge.",
  scope: "world",
  config: true,
  type: Boolean,
  default: true,
  requiresReload: true
});
```

**Location to add:** Near other `sceneTransition` settings (search for `"sceneTransition.` in module.js)

#### Step 1.2: Conditional Wrapper Registration
**File:** `scripts/module.js` (HooksManager.registerIntegrationsAndHooks method)

**Current code location:** Lines ~4578-4834

```javascript
// BEFORE: Always registers wrapper
libWrapper.register(MODULE_ID, "Scene.prototype.view", async function(...) { ... }, "WRAPPER");

// AFTER: Only register if enabled
const transitionEnabled = game.settings.get(MODULE_ID, "sceneTransition.enabled");

if (transitionEnabled) {
  libWrapper.register(
    MODULE_ID,
    "Scene.prototype.view",
    async function (wrapped, ...args) {
      // Existing transition logic
    },
    "WRAPPER"
  );
  console.log("Map Shine | Scene transitions enabled");
} else {
  console.log("Map Shine | Scene transitions disabled by user setting");
}
```

#### Expected Outcome
- ✅ Users can disable scene transitions if they conflict
- ✅ Module remains functional without the feature
- ✅ Clear user control over compatibility
- ✅ Requires reload to take effect (setting configured accordingly)

---

### Phase 2: Pause System - Refactor to Application (HIGH PRIORITY)

**Goal:** Create self-contained pause UI that doesn't interfere with other modules

#### Step 2.1: Create MapShinePauseScreen Application Class
**File:** Create new file `scripts/apps/MapShinePauseScreen.js`

```javascript
/**
 * Custom Application-based pause screen that doesn't interfere with
 * the core #pause element or other modules' pause content.
 */
export class MapShinePauseScreen extends Application {
  constructor(options = {}) {
    super(options);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "map-shine-pause-screen",
      template: "modules/map-shine/templates/pause-screen.html",
      classes: ["map-shine", "pause-screen"],
      popOut: false,
      minimizable: false,
      resizable: false,
      width: "100%",
      height: "100%",
      zIndex: 100, // Layer above canvas but below UI
    });
  }

  getData(options = {}) {
    const data = super.getData(options);
    
    // Load settings (same as current _getSettings method)
    const getSetting = (key) =>
      game.settings.get("map-shine", `universal.pauseEffect.${key}`);
    const getFont = (style) =>
      game.settings.get(
        "map-shine",
        `universal.fontManager.styles.${style}.fontFamily`
      );

    data.heading = getSetting("heading");
    data.subheading = getSetting("subheading");
    data.logoPath = getSetting("logoPath");
    data.logoOpacity = getSetting("logoOpacity");
    data.backgroundColor = getSetting("backgroundColor");
    data.gradientColor1 = getSetting("gradientColor1");
    data.gradientColor2 = getSetting("gradientColor2");
    data.headingColor = getSetting("headingColor");
    data.subheadingColor = getSetting("subheadingColor");
    data.hintColor = getSetting("hintColor");
    data.useRandomHint = getSetting("useRandomHint");
    
    // Select random hint if enabled
    if (data.useRandomHint) {
      const hints = (getSetting("randomHints") || "")
        .split(/\r?\n/)
        .filter((h) => h.trim() !== "");
      data.hint = hints.length > 0 
        ? hints[Math.floor(Math.random() * hints.length)]
        : "";
    }

    data.headingFont = getFont("heading1");
    data.subheadingFont = getFont("heading2");
    data.hintFont = getFont("hint");

    return data;
  }

  async _renderInner(data) {
    // Load fonts before rendering
    await FontLoader.load([
      data.headingFont,
      data.subheadingFont,
      data.hintFont
    ]);

    return super._renderInner(data);
  }

  activateListeners(html) {
    super.activateListeners(html);
    // Prevent any clicks from passing through
    html.on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }
}
```

#### Step 2.2: Create Handlebars Template
**File:** Create new file `templates/pause-screen.html`

```handlebars
<div class="map-shine-pause-wrapper" style="
  background: {{backgroundColor}};
  --heading-color: {{headingColor}};
  --subheading-color: {{subheadingColor}};
  --hint-color: {{hintColor}};
  --heading-font: {{headingFont}};
  --subheading-font: {{subheadingFont}};
  --hint-font: {{hintFont}};
">
  <div class="map-shine-pause-content">
    <h1 class="map-shine-pause-title">{{heading}}</h1>
    <p class="map-shine-pause-subtitle">{{subheading}}</p>
    
    {{#if logoPath}}
    <div class="map-shine-pause-logo" 
         style="background-image: url('{{logoPath}}'); opacity: {{logoOpacity}};"></div>
    {{/if}}
    
    {{#if hint}}
    <p class="map-shine-pause-hint">{{hint}}</p>
    {{/if}}
  </div>
</div>
```

#### Step 2.3: Move CSS to styles.css
**File:** `styles/styles.css`

Move all pause screen CSS from the inline `<style>` tag in `PauseScreenManager._applyCustomPauseScreen()` to the module's CSS file. This is better practice and allows for easier maintenance.

```css
/* Map Shine Pause Screen Styles */
#map-shine-pause-screen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: transparent !important;
  backdrop-filter: blur(12px) saturate(0.8);
  -webkit-backdrop-filter: blur(12px) saturate(0.8);
  pointer-events: all;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ... rest of pause screen CSS from current implementation ... */
```

#### Step 2.4: Refactor PauseScreenManager
**File:** `scripts/module.js` (class `PauseScreenManager`)

```javascript
import { MapShinePauseScreen } from "./apps/MapShinePauseScreen.js";

class PauseScreenManager {
  static _activeScreen = null;

  static initialize() {
    Hooks.on("pauseGame", (paused) => {
      const isEnabled = game.settings.get(
        MODULE_ID,
        "universal.pauseEffect.enabled"
      );
      
      if (!isEnabled) {
        this._closeScreen();
        return;
      }

      if (paused) {
        this._showScreen();
      } else {
        this._closeScreen();
      }
    });

    // Handle reload into paused game
    Hooks.once("ready", () => {
      const isEnabled = game.settings.get(
        MODULE_ID,
        "universal.pauseEffect.enabled"
      );
      if (game.paused && isEnabled) {
        this._showScreen();
      }
    });
  }

  static _showScreen() {
    // Close existing screen if any
    this._closeScreen();
    
    // Create and render new pause screen
    this._activeScreen = new MapShinePauseScreen();
    this._activeScreen.render(true);
  }

  static _closeScreen() {
    if (this._activeScreen) {
      this._activeScreen.close();
      this._activeScreen = null;
    }
  }
}
```

#### Expected Outcome
- ✅ Pause screen is a self-contained Application window
- ✅ No manipulation of `#pause` element
- ✅ Other modules can add their own pause content without conflict
- ✅ Follows Foundry VTT best practices
- ✅ Easier to maintain and debug

---

### Phase 3: Defensive Compatibility Checks (LOWER PRIORITY)

**Goal:** Auto-detect known conflicts and disable scene transitions

#### Step 3.1: Add Compatibility Detection
**File:** `scripts/module.js` (HooksManager)

```javascript
/**
 * Checks if there are known problematic wrappers on Scene.prototype.view
 * @returns {boolean} True if safe to register our wrapper
 */
static _checkSceneTransitionCompatibility() {
  const knownConflicts = [
    // Add module IDs or patterns that are known to conflict
    "the-forge-vtt", // Example: The Forge's scene pre-loading
    // Add more as discovered
  ];

  // Check active modules
  for (const moduleId of knownConflicts) {
    if (game.modules.get(moduleId)?.active) {
      console.warn(
        `Map Shine | Detected potentially conflicting module: ${moduleId}`
      );
      console.warn(
        "Map Shine | Scene transitions auto-disabled. Enable manually if desired."
      );
      return false;
    }
  }

  return true;
}
```

#### Step 3.2: Use Compatibility Check
```javascript
const transitionEnabled = game.settings.get(MODULE_ID, "sceneTransition.enabled");
const isCompatible = this._checkSceneTransitionCompatibility();

if (transitionEnabled && isCompatible) {
  // Register wrapper
}
```

#### Expected Outcome
- ✅ Automatic conflict detection
- ✅ Graceful degradation
- ✅ User can override if desired
- ✅ Clear console warnings

---

## Part 3: Testing & Validation

### Test Case 1: Scene Transition Toggle
1. **Setup:** Enable scene transitions in settings
2. **Test:** Change scenes and verify custom loading screen appears
3. **Action:** Disable scene transitions in settings, reload world
4. **Expected:** Scene changes use default Foundry behavior, no errors
5. **Verify:** Module other features still work (pause, effects, etc.)

### Test Case 2: Pause Screen Isolation
1. **Setup:** Install a module that adds content to `#pause` (e.g., Dice So Nice)
2. **Test:** Pause game with MapShine enabled
3. **Expected:** Both MapShine pause screen AND other module's content appear
4. **Verify:** No console errors about missing DOM elements

### Test Case 3: Multi-Module Pause
1. **Setup:** Install multiple modules that use `pauseGame` hook
2. **Test:** Pause and unpause multiple times
3. **Expected:** All modules' pause features work independently
4. **Verify:** No interference between modules

### Test Case 4: The Forge Compatibility
1. **Setup:** Test on The Forge hosting (if possible) or simulate conflict
2. **Test:** Scene transitions with auto-detection
3. **Expected:** Either graceful auto-disable or successful operation
4. **Verify:** Clear console messaging about compatibility status

---

## Part 4: Migration Guide

### For Users

#### Scene Transitions
- **Default:** Enabled (no change from current behavior)
- **If experiencing issues:** 
  1. Open Module Settings
  2. Find "Map Shine" settings
  3. Locate "Enable Custom Scene Transitions"
  4. Uncheck the setting
  5. Reload the world

#### Pause Screen
- **No user action required** - the refactor is transparent
- **Benefits:** Better compatibility with other modules
- **Note:** Visual appearance remains identical

### For Developers

#### Removed Code
- `PauseScreenManager._applyCustomPauseScreen()` DOM manipulation
- `PauseScreenManager._revertCustomPauseScreen()`
- Inline `<style>` tags in pause screen

#### Added Files
- `scripts/apps/MapShinePauseScreen.js` - Application class
- `templates/pause-screen.html` - Handlebars template

#### Modified Files
- `scripts/module.js` - Simplified PauseScreenManager, conditional wrapper registration
- `styles/styles.css` - Centralized pause screen styles
- `module.json` - Added template path (if not already present)

---

## Part 5: Implementation Checklist

### Scene Transition System
- [ ] Add `sceneTransition.enabled` setting to settings registration
- [ ] Wrap `Scene.prototype.view` libWrapper registration in conditional check
- [ ] Add console logging for enabled/disabled states
- [ ] Test enable/disable toggle
- [ ] (Optional) Implement `_checkSceneTransitionCompatibility()` method
- [ ] Update module documentation

### Pause System
- [ ] Create `scripts/apps/` directory
- [ ] Create `MapShinePauseScreen.js` Application class
- [ ] Create `templates/pause-screen.html` template
- [ ] Move pause CSS from inline to `styles/styles.css`
- [ ] Refactor `PauseScreenManager` to use Application
- [ ] Remove old DOM manipulation code
- [ ] Test pause/unpause cycle
- [ ] Test with other modules
- [ ] Update module documentation

### Documentation
- [ ] Update README.md with compatibility notes
- [ ] Add troubleshooting section for scene transitions
- [ ] Document the Application-based pause system architecture
- [ ] Add notes about The Forge compatibility
- [ ] Create changelog entry

### Quality Assurance
- [ ] Test all 4 test cases listed in Part 3
- [ ] Verify no console errors in clean environment
- [ ] Verify no console errors with multiple modules
- [ ] Performance test (ensure no regression)
- [ ] Accessibility check (keyboard navigation, screen readers)

---

## Part 6: Risk Assessment

### Low Risk
- ✅ Adding module setting (standard Foundry pattern)
- ✅ Conditional wrapper registration (well-understood pattern)
- ✅ CSS relocation (cosmetic refactor)

### Medium Risk
- ⚠️ Application class refactor (significant architectural change)
- ⚠️ Template creation (new dependency)
- **Mitigation:** Thorough testing, phased rollout

### High Risk
- 🔴 Breaking pause screen for users mid-session
- **Mitigation:** Test extensively, include in major version bump

---

## Part 7: Timeline Estimate

### Phase 1: Scene Transition Toggle
**Estimated Time:** 1-2 hours
- 30 min: Setting registration and conditional logic
- 30 min: Testing and debugging
- 30 min: Documentation updates

### Phase 2: Pause System Refactor
**Estimated Time:** 3-4 hours
- 1 hour: Create Application class and template
- 1 hour: Move and organize CSS
- 1 hour: Refactor PauseScreenManager
- 1 hour: Testing and polish

### Phase 3: Compatibility Checks (Optional)
**Estimated Time:** 1-2 hours
- 1 hour: Research known conflicts and implement detection
- 1 hour: Testing with various modules

### Total Estimated Time
**Core Implementation:** 4-6 hours  
**With Optional Features:** 5-8 hours

---

## Part 8: Success Criteria

### Must Have
1. ✅ Scene transitions can be disabled via setting
2. ✅ Pause screen uses Application class
3. ✅ No DOM manipulation of `#pause` element
4. ✅ All existing features continue to work
5. ✅ No new console errors or warnings

### Should Have
1. ✅ Clear user documentation for troubleshooting
2. ✅ Graceful handling of conflicts
3. ✅ Proper error messages and logging
4. ✅ CSS properly organized in external file

### Nice to Have
1. ✅ Automatic conflict detection
2. ✅ The Forge specific compatibility handling
3. ✅ Migration guide for other developers
4. ✅ Performance improvements

---

## Part 9: Future Considerations

### Potential Foundry API Improvements to Watch
- **Scene Transition Hook:** If Foundry adds a native hook for scene transitions, we can migrate away from `Scene.prototype.view` patching entirely
- **Pause System API:** Monitor for any official pause screen customization API

### Community Feedback
- Track user reports of conflicts on specific hosting platforms
- Build compatibility database over time
- Maintain list of tested module combinations

### Performance Optimization
- Consider lazy-loading pause screen template
- Optimize Application render cycle if needed
- Profile scene transition impact on load times

---

## Conclusion

This plan addresses the root causes of compatibility issues in MapShine by:
1. **Acknowledging limitations** of the current Foundry API
2. **Providing user control** through optional features
3. **Following best practices** with Application-based UI
4. **Maintaining functionality** while improving reliability

The implementation prioritizes:
- ✅ **Compatibility** over feature completeness
- ✅ **User control** over automatic behavior
- ✅ **Standard patterns** over custom solutions
- ✅ **Graceful degradation** over breaking changes

By completing this plan, MapShine will be a better ecosystem citizen and provide users with a more reliable, conflict-free experience.
