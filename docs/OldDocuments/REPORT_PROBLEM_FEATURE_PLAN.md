# Report Problem Feature - Comprehensive Diagnostic System

## Overview

**Purpose:** Create a user-friendly diagnostic system that gathers comprehensive information about Map Shine's state, configuration, and performance to help users report problems effectively and enable rapid debugging.

**Target Users:** 
- End users experiencing issues
- GMs troubleshooting problems
- Developers diagnosing bugs
- Support staff handling user reports

**Core Value:** Transform vague "it's not working" reports into actionable technical diagnostics with specific failure points and system state information.

---

## Feature Architecture

### 1. UI Integration Point

**Location:** Header of MaterialEditorDebugger (main UI)
**Trigger:** "Report Problem" button
**Placement:** Top-right corner, persistent visibility

```javascript
// Integration in MaterialEditorDebugger header (lines ~33000)
_getHeaderHTML() {
  return `
    <div class="map-shine-header">
      <!-- Existing title and controls -->
      <button id="map-shine-report-problem" class="report-problem-btn">
        🚨 Report Problem
      </button>
    </div>
  `;
}
```

**Visual Design:**
- Red warning icon (🚨) for visibility
- Subtle pulsing animation when diagnostics available
- Responsive design (mobile-friendly)
- Tooltip: "Generate diagnostic report for troubleshooting"

---

## 2. Diagnostic Data Collection System

### Core Diagnostic Engine: `DiagnosticsCollector`

**File:** `scripts/diagnostics/DiagnosticsCollector.js` (new file)

**Purpose:** Centralized system for gathering all Map Shine-related information

**Key Methods:**
```javascript
class DiagnosticsCollector {
  async collectFullReport()          // Main collection orchestrator
  async collectModuleInfo()          // Module versions, dependencies
  async collectSceneStats()          // Scene dimensions, objects, performance
  async collectSystemHealth()        // Manager states, error logs
  async collectEffectDiagnostics()   // Per-effect validation
  async collectPerformanceMetrics() // FPS, memory, GPU info
  async collectUserConfig()          // Settings, profiles, overrides
  formatReport(data)                 // Structure final output
}
```

### Data Collection Categories

#### A. Module Information (Priority: Critical)
- Map Shine version (from module.json)
- Foundry VTT version
- Active modules list (name, version, author)
- Browser information (Chrome/Firefox/Edge version)
- System information (OS, GPU, memory)
- WebGL context capabilities
- Module load order (for compatibility issues)

#### B. Scene Statistics (Priority: High)
- Scene name, dimensions, grid size
- Background image path and resolution
- Total texture maps discovered (count and types)
- Lighting system state (light sources count)
- Wall configuration (vision/lighting walls)
- Token count and active effects
- Weather system current state
- Time of day and sun position

#### C. System Health (Priority: Critical)
- All manager initialization states
- Error log from MapShineLifecycle
- Failed component initialization
- Resource loading failures
- Memory usage statistics
- Active layer count and states
- Transition system status

#### D. Effect Diagnostics (Priority: Critical)
- **Per-effect validation:**
  - Texture discovery results
  - Shader compilation status
  - Rendering pipeline state
  - Configuration validation
  - Performance impact measurement
  - Error/warning logs per effect

#### E. Performance Metrics (Priority: Medium)
- Real-time FPS (30-second sample)
- Frame time variance analysis
- VRAM usage and growth trends
- GPU utilization estimates
- RenderTexturePool statistics
- Particle system performance

#### F. User Configuration (Priority: Medium)
- Active profile name and settings
- User overrides and adjustments
- Universal effects configuration
- Performance mode settings
- Custom textures or assets

---

## 3. Effect-by-Effect Validation System

### Validation Strategy: `EffectValidator`

**Purpose:** Run each enabled effect through a comprehensive diagnostic process

**Validation Categories:**

#### 1. Texture Discovery Validation
```javascript
async validateTextures(effectKey, layer) {
  // Check for required texture maps
  // Validate resolution and format
  // Test loading and accessibility
  // Report missing/corrupt textures
}
```

#### 2. Shader Compilation Test
```javascript
async validateShaders(effectKey, filter) {
  // Test shader compilation
  // Validate uniform availability
  // Check for GL errors
  // Test with sample data
}
```

#### 3. Rendering Pipeline Check
```javascript
async validateRendering(effectKey, layer) {
  // Test mask generation
  // Validate filter application
  // Check blend modes
  // Test coordinate transforms
}
```

#### 4. Configuration Validation
```javascript
async validateConfig(effectKey, config) {
  // Check parameter ranges
  // Validate required settings
  // Test config propagation
  // Check for invalid combinations
}
```

#### 5. Performance Impact Measurement
```javascript
async measurePerformance(effectKey, duration = 5000) {
  // FPS with effect disabled (baseline)
  // FPS with effect enabled
  // Calculate impact
  // Memory usage delta
}
```

### Effect Validation Results Format

For each effect:
```javascript
{
  effectKey: "metallicShine",
  enabled: true,
  status: "SUCCESS" | "WARNING" | "ERROR",
  textureDiscovery: {
    foundTextures: ["_Specular", "_Metallic", "_RoughnessSpec"],
    missingTextures: ["_Glint"],
    resolution: "1920x1080",
    status: "SUCCESS"
  },
  shaderCompilation: {
    compiled: true,
    uniforms: ["time", "alpha", "intensity"],
    errors: [],
    status: "SUCCESS"
  },
  rendering: {
    maskGenerated: true,
    filterApplied: true,
    visible: true,
    status: "SUCCESS"
  },
  configuration: {
    validRanges: true,
    requiredSettings: true,
    warnings: ["intensity very high may cause performance issues"],
    status: "WARNING"
  },
  performance: {
    baselineFPS: 58.2,
    effectFPS: 54.1,
    impact: -4.1,
    memoryDelta: "+12MB",
    status: "WARNING"
  },
  issues: [
    {
      severity: "warning",
      category: "performance",
      message: "High intensity setting causing 4 FPS drop",
      recommendation: "Reduce intensity to 0.8 or lower"
    }
  ]
}
```

---

## 4. Diagnostic Report Generation

### Report Structure: `DiagnosticReport`

**Purpose:** Format collected data into readable, actionable report

**Report Sections:**

#### 1. Executive Summary
- Problem overview (auto-detected issues)
- Severity assessment (Critical/Warning/Info)
- Quick action items
- System health score (0-100)

#### 2. Environment Information
- Module versions and compatibility
- System specifications
- Browser/WebGL capabilities

#### 3. Scene Analysis
- Scene statistics and complexity
- Texture map inventory
- Performance baseline

#### 4. System Health Report
- Manager initialization status
- Error log summary
- Memory and resource usage

#### 5. Effect Diagnostics
- Per-effect validation results
- Performance impact analysis
- Configuration issues

#### 6. Performance Analysis
- FPS trends and stability
- Memory usage patterns
- GPU utilization

#### 7. Recommendations
- Auto-generated troubleshooting steps
- Configuration optimizations
- Performance improvements
- Bug report guidance

---

## 5. Report Presentation Interface

### Diagnostic Dialog: `DiagnosticReportDialog`

**Purpose:** Display comprehensive diagnostic report with user-friendly interface

**Features:**

#### A. Tabbed Interface
```javascript
// Main sections
- Overview (Executive summary + quick actions)
- Environment (System info + modules)
- Effects (Per-effect diagnostics)
- Performance (Metrics + analysis)
- Configuration (Settings + profiles)
- Raw Data (Technical details + JSON)
```

#### B. Action Buttons
```javascript
// Primary actions
- Copy Report (clipboard with formatting)
- Download Report (save as .md or .txt)
- Send to Discord (pre-formatted for support)
- Generate Minimal (reduced report for forums)
```

#### C. Interactive Elements
```javascript
// Expandable sections
- Effect details (click to expand full validation)
- Error details (click stack traces)
- Performance graphs (interactive FPS charts)
- Configuration diffs (show vs defaults)
```

#### D. Severity Indicators
```javascript
// Visual status coding
🔴 Critical - System-breaking issues
🟡 Warning - Performance/configuration problems  
🟢 Info - General status information
🔵 Success - Working correctly
```

---

## 6. Discord Integration System

### Auto-Format for Support

**Purpose:** Generate Discord-friendly report format for support channels

**Discord Formatting:**
```markdown
🚨 **Map Shine Problem Report**

**Version:** Map Shine 1.2.19 | Foundry 11.315
**User:** GM Name | Scene: "Dungeon of Doom"
**Severity:** 🔴 Critical

**Quick Summary:**
- Metallic Shine effect failing to compile shader
- Missing _Glint texture map
- 15 FPS performance impact
- 2 other warnings

**Environment:**
- Windows 10, Chrome 120, NVIDIA RTX 3070
- 8 other active modules
- WebGL 2.0, 8GB VRAM available

**Key Issues:**
1. **ERROR:** MetallicShineFilter shader compilation failed
2. **ERROR:** Missing required texture: Background_Image_Glint.jpg
3. **WARNING:** High intensity causing performance drop

**Full Report:** [Link to downloadable report]

**Files:** [Attach diagnostic JSON]
```

### Discord Link Integration

**Button:** "Send to Discord Support"
**Action:** 
1. Format report for Discord
2. Open Discord invite link
3. Copy report to clipboard
4. Provide instructions for posting

---

## 7. Implementation Plan

### Phase 1: Core Infrastructure (2-3 days)

#### 1.1 Diagnostic Collector Framework
- Create `DiagnosticsCollector` class
- Implement basic data collection methods
- Add error handling and validation
- Create report formatting system

#### 1.2 UI Integration
- Add "Report Problem" button to debugger header
- Create `DiagnosticReportDialog` base class
- Implement tabbed interface structure
- Add copy/download functionality

#### 1.3 Basic Validation
- Module information collection
- Scene statistics gathering
- System health checking
- Simple report generation

### Phase 2: Effect Validation System (3-4 days)

#### 2.1 Effect Validator Framework
- Create `EffectValidator` class
- Implement texture discovery validation
- Add shader compilation testing
- Create rendering pipeline checks

#### 2.2 Per-Effect Implementation
- Validate all 19 canvas layers
- Test all 6 shader filters
- Check particle system states
- Validate manager integrations

#### 2.3 Performance Integration
- FPS measurement system
- Memory usage tracking
- VRAM impact analysis
- Performance comparison logic

### Phase 3: Advanced Features (2-3 days)

#### 3.1 Enhanced Reporting
- Interactive performance graphs
- Configuration difference analysis
- Recommendation engine
- Troubleshooting guide generation

#### 3.2 Discord Integration
- Discord-friendly formatting
- Auto-link to support channels
- File attachment system
- Report sharing functionality

#### 3.3 Advanced Diagnostics
- WebGL context analysis
- GPU capability detection
- Module compatibility checking
- Error pattern recognition

---

## 8. Technical Specifications

### File Structure
```
scripts/
├── diagnostics/
│   ├── DiagnosticsCollector.js      # Main collection engine
│   ├── EffectValidator.js           # Per-effect validation
│   ├── PerformanceAnalyzer.js       # Performance metrics
│   ├── ReportFormatter.js           # Report generation
│   └── DiagnosticReportDialog.js    # UI presentation
```

### Integration Points
- **MaterialEditorDebugger:** Button placement and event handling
- **MapShineLifecycle:** Error log access and initialization states
- **All Managers:** Status reporting and validation
- **All Layers:** Rendering pipeline testing
- **ProfileManager:** Configuration analysis
- **ResourceManager:** Texture discovery reporting

### Performance Considerations
- Diagnostic collection runs in background (non-blocking)
- Progressive loading with status indicators
- Caching of expensive validation results
- Timeout protection (30-second maximum)
- Memory-efficient report generation

### Error Handling
- Graceful degradation when managers missing
- Fallback data when validation fails
- Clear error messages for missing components
- Protection against infinite loops
- Validation timeout protection

---

## 9. User Experience Flow

### Primary User Flow
1. User experiences issue with Map Shine
2. User clicks "Report Problem" in debugger header
3. System shows progress bar while collecting diagnostics
4. Comprehensive report dialog appears with tabs
5. User reviews findings and recommendations
6. User clicks "Send to Discord Support"
7. Report formatted and copied, Discord opens
8. User pastes report in support channel

### Advanced User Flow
1. Developer uses "Download Report" for detailed analysis
2. Support staff uses "Raw Data" tab for technical debugging
3. Power users review "Performance" tab for optimization
4. Module creators check "Compatibility" section

---

## 10. Success Metrics

### Technical Metrics
- Diagnostic collection time < 10 seconds
- Report generation time < 2 seconds
- Memory usage during collection < 50MB
- Zero false positives in error detection
- 95% accuracy in problem identification

### User Experience Metrics
- User can generate report in < 3 clicks
- Report readability score > 8/10
- Discord support ticket resolution time reduced by 50%
- User satisfaction score > 4.5/5
- Support request quality improvement

### Development Benefits
- Reduced debugging time by 70%
- Faster bug reproduction
- Clearer user feedback
- Better compatibility testing
- Proactive issue detection

---

## 11. Future Enhancement Opportunities

### Advanced Analysis
- Machine learning for pattern recognition
- Predictive failure analysis
- Automatic configuration optimization
- Real-time monitoring dashboard

### Integration Expansion
- Module marketplace compatibility checking
- Community-driven solution database
- Automated bug report creation
- Integration with bug tracking systems

### Accessibility Improvements
- Screen reader compatible reports
- Multi-language support
- Visual impairment friendly interface
- Mobile-optimized diagnostic flow

---

## 12. Risk Assessment and Mitigation

### Technical Risks
- **Performance Impact:** Mitigate with background processing and timeouts
- **Memory Usage:** Mitigate with streaming data collection and cleanup
- **Compatibility Issues:** Mitigate with graceful degradation and fallbacks
- **Error Cascades:** Mitigate with isolation and error boundaries

### User Experience Risks
- **Complexity Overwhelm:** Mitigate with progressive disclosure and summaries
- **Long Wait Times:** Mitigate with progress indicators and caching
- **Privacy Concerns:** Mitigate with data anonymization and user control
- **Technical Barriers:** Mitigate with clear instructions and examples

---

## Implementation Timeline

**Total Estimated Time:** 7-10 days
**Development Priority:** High (Critical support feature)
**Risk Level:** Low (Leverages existing systems)
**Impact:** Very High (Transforms support capabilities)

### Week 1: Core System
- Days 1-3: DiagnosticsCollector and basic validation
- Days 4-5: UI integration and report dialog
- Days 6-7: Testing and refinement

### Week 2: Advanced Features  
- Days 8-9: Effect validation system
- Days 10-11: Performance analysis and Discord integration
- Days 12-14: Polish, documentation, and testing

---

## Conclusion

The Report Problem diagnostic system will revolutionize how users interact with Map Shine support, transforming vague problem reports into comprehensive technical diagnostics. This feature will dramatically reduce debugging time, improve user satisfaction, and enable faster resolution of compatibility and performance issues.

The modular design ensures the system can grow with Map Shine's capabilities while maintaining reliability and user-friendliness. By providing actionable insights and clear recommendations, users become active participants in the troubleshooting process rather than passive problem reporters.
