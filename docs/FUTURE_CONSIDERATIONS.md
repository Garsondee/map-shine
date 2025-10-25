# Map Shine - Future Considerations

This document tracks potential improvements, feature requests, and technical debt that should be addressed in future development cycles.

---

## Weather Orchestrator UI Integration

**Priority:** High  
**Complexity:** Medium  
**Estimated Time:** 8-12 hours

### Current State
The Weather Orchestrator system is fully functional but lacks UI controls. All configuration must be done through MODULE_DEFAULTS or console commands.

### Required Implementation

#### 1. New UI Section: Weather Orchestrator
Add a dedicated accordion section in the weather system panel with the following controls:

**Basic Controls:**
- Enable/Disable toggle
- Dice type selector (2d6, 3d6, 1d20)
- Tick interval slider (10-300 seconds)
- Temperature step size slider
- Humidity step size slider

**Atmospheric Parameters Display:**
- Current temperature (read-only, with range)
- Current humidity (read-only, with range)
- Wind strength indicator
- Temperature momentum indicator
- Humidity momentum indicator

**Weather State Resolution Display:**
- Current resolved state (read-only)
- Resolved intensity (0-1)
- Temperature band (FREEZING, COLD, COOL, MILD, WARM, HOT)
- Humidity band (ARID, DRY, MODERATE, HUMID, SATURATED)
- State description

**Narrative Override Controls:**
- Enable narrative override toggle
- Target weather state dropdown
- Force strength slider (0-1)
- On-reached behavior (Resume/Hold radio buttons)

**Diagnostic Information:**
- Time since last transition
- Next random walk tick countdown
- Current atmospheric trend indicators

#### 2. Weather State Variable Display

Each weather state (Clear, Drizzle, Rain, Storm, Sleet, Snow, Blizzard) modifies multiple system variables. The UI should expose these for visibility and potential override:

**Per-State Variables to Display:**

**Cloud Properties:**
- Cloud density (0-1)
- Cloud threshold (0-1)
- Cloud softness (0-1)

**Wind Multipliers:**
- Base speed multiplier
- Gust speed multiplier
- Gust frequency multiplier
- Gust duration multiplier
- Angle change frequency multiplier
- Angle change range multiplier

**Foliage Multipliers:**
- Rustle speed multiplier
- Sway speed multiplier

**Precipitation:**
- Precipitation intensity (0-1)
- Precipitation type (rain/snow/none)
- Particle count

**Atmospheric Effects:**
- Atmospheric tint (RGB)
- Color correction (saturation, contrast, brightness)

**Cloud Wind:**
- Max speed
- Force
- Drag

#### 3. Implementation Approach

**UI Builder Integration:**
```javascript
_buildWeatherOrchestratorSection() {
  // Diagnostic panel with live atmospheric data
  // Orchestrator enable toggle
  // Random walk engine controls
  // Atmospheric parameter displays
  // Narrative override controls
  // State variable display (read-only or override)
}
```

**Live Updates:**
- Use `getDiagnostics()` methods from orchestrator subsystems
- Update displays in animation loop or on tick events
- Highlight changing values to show active parameters

**Configuration Persistence:**
- Save orchestrator settings to profile config
- Separate section: `weather.orchestrator` in config schema
- Include narrative override state for scene persistence

### Benefits
- **Visibility:** Users can see what the orchestrator is doing in real-time
- **Control:** Manual narrative control for story-driven weather changes
- **Debugging:** Clear diagnostic information for troubleshooting
- **Education:** Exposes weather state variable relationships
- **Customization:** Override default state parameters per scene

### Technical Notes
- Weather state variable display should be read-only by default
- Consider "Advanced Mode" toggle to unlock state variable overrides
- Use existing DebuggerUIBuilder patterns for consistency
- Diagnostic updates should be throttled to avoid performance impact
- Narrative override should have "Resume" failsafe to prevent stuck states

### Related Systems
- WeatherSystemManager (lines 15037-15700)
- WeatherOrchestrator (scripts/weather/WeatherOrchestrator.js)
- AtmosphericParameters (scripts/weather/AtmosphericParameters.js)
- RandomWalkEngine (scripts/weather/RandomWalkEngine.js)
- WeatherStateResolver (scripts/weather/WeatherStateResolver.js)

### Files to Modify
- `scripts/module.js` - DebuggerUIBuilder._buildWeatherOrchestratorSection()
- `scripts/config/default-profile-config.js` - Add orchestrator section
- `scripts/config/constants.js` - Add orchestrator UI defaults if needed

---

## Additional Future Considerations

*(Add new considerations below as they arise)*

### Example Entry Template
```markdown
## [Feature/Issue Name]

**Priority:** [Low/Medium/High]  
**Complexity:** [Low/Medium/High]  
**Estimated Time:** [X hours/days]

### Description
[What needs to be done]

### Current State
[What exists now]

### Proposed Solution
[How to implement]

### Benefits
[Why this matters]

### Technical Notes
[Important details]
```

---

**Document Created:** October 25, 2025  
**Last Updated:** October 25, 2025  
**Maintainer:** Development Team
