# UI Performance Optimization Implementation Plan

## Problem
- **6,862 DOM elements** with **1,526 input fields**
- **82% FPS drop** when debugger is open (110 FPS → 20 FPS)
- Browser constantly recalculates styles, layouts, and tracks input state for ALL elements even when hidden

## Root Cause
Accordions use `<details>` with CSS `display: none` for closed state. This hides elements visually but **keeps them in the DOM**, forcing the browser to:
- Track their state
- Apply styles
- Monitor for input changes
- Maintain event listeners

## Solution: Lazy Accordion Rendering

### Architecture

```javascript
// BEFORE (current):
<details id="details-weather">
  <summary>Weather System</summary>
  <div class="accordion-content">
    <!-- 200+ inputs always in DOM -->
  </div>
</details>

// AFTER (optimized):
<details id="details-weather" data-lazy="true">
  <summary>Weather System</summary>
  <!-- Content injected on toggle, removed on close -->
</details>
```

### Implementation Components

#### 1. LazyAccordionManager Class
**Location:** New class in `module.js` before `DebuggerEventHandler`

**Responsibilities:**
- Cache HTML content for each accordion
- Inject content on open
- Remove content on close
- Track accordion states

**API:**
```javascript
class LazyAccordionManager {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.contentCache = new Map(); // accordionId → HTML string
    this.accordionStates = new Map(); // accordionId → boolean (open/closed)
  }
  
  registerAccordion(accordionId, contentGenerator) {
    // Store content generator function
  }
  
  onAccordionToggle(accordionId, isOpen) {
    if (isOpen) {
      this.injectContent(accordionId);
    } else {
      this.removeContent(accordionId);
    }
  }
  
  injectContent(accordionId) {
    // Generate HTML, insert into DOM, attach event listeners
  }
  
  removeContent(accordionId) {
    // Remove all child elements except <summary>
  }
}
```

#### 2. DebuggerUIBuilder Modifications

**Change 1: Mark accordions as lazy**
```javascript
_createAccordionHTML(effectKey, title, content, headerExtra = "") {
  return `
    <details id="details-${effectKey}" data-lazy="true" data-content-id="${effectKey}">
      <summary>
        <span class="accordion-toggle"></span>
        <div class="summary-label">${title}</div>
        ${headerExtra}
      </summary>
      <!-- No content here initially -->
    </details>
  `;
}
```

**Change 2: Separate content generation**
```javascript
_getAccordionContent(effectKey) {
  // Returns the content HTML without the <details> wrapper
  // This becomes the cache entry
}
```

#### 3. DebuggerEventHandler Integration

**In `initialize()` method:**
```javascript
initialize() {
  // ... existing code ...
  
  // Initialize lazy accordion system
  this.lazyAccordionManager = new LazyAccordionManager(this.element);
  this._setupLazyAccordions();
  
  // Attach toggle listener
  this.element.addEventListener('toggle', (e) => {
    if (e.target.matches('details[data-lazy="true"]')) {
      const accordionId = e.target.dataset.contentId;
      const isOpen = e.target.open;
      this.lazyAccordionManager.onAccordionToggle(accordionId, isOpen);
    }
  }, true);
}

_setupLazyAccordions() {
  // Register all accordion content generators
  const accordions = this.element.querySelectorAll('details[data-lazy="true"]');
  accordions.forEach(accordion => {
    const contentId = accordion.dataset.contentId;
    const generator = () => this.uiBuilder._getAccordionContent(contentId);
    this.lazyAccordionManager.registerAccordion(contentId, generator);
  });
}
```

### Performance Impact Estimation

**Current State:**
- **Idle:** 6,862 elements (273 accordions × ~25 elements/accordion)
- **All Closed:** 6,862 elements (still in DOM)
- **FPS:** 20 FPS

**After Optimization:**
- **Idle:** ~500 elements (273 summaries + top-level structure)
- **1 Open:** ~525 elements (500 + 25 for opened accordion)
- **5 Open:** ~625 elements (500 + 125 for 5 opened accordions)
- **Expected FPS:** 90-100 FPS

**Element Reduction:** 6,862 → 500 = **92% reduction**

### Additional Optimizations

#### A. Debounced Input Handlers
```javascript
_handleGenericInput: debounce((e) => {
  // Handle input changes
}, 300)
```

#### B. Virtual Scrolling for Long Lists
For Point Groups and other long lists, only render visible items.

#### C. requestIdleCallback for Non-Critical Updates
```javascript
requestIdleCallback(() => {
  this._updateColumnWidths();
});
```

### Migration Strategy

**Phase 1: Core Implementation (This Session)**
1. Create `LazyAccordionManager` class
2. Modify `_createAccordionHTML()` to support lazy mode
3. Add content extraction methods
4. Hook up toggle event listeners
5. Test with a few accordions

**Phase 2: Full Migration**
1. Convert all effect accordions to lazy mode
2. Convert all post-processing accordions to lazy mode
3. Convert nested accordions to lazy mode

**Phase 3: Polish**
1. Add loading indicators for heavy accordions
2. Optimize content generation functions
3. Add accordion preloading (generate content in advance for likely-to-open accordions)

### Backward Compatibility

- Keep `data-lazy="true"` attribute optional
- Non-lazy accordions continue to work as before
- Gradual migration path

### Testing Checklist

- [ ] Accordion opens and content appears
- [ ] Accordion closes and content is removed
- [ ] Event listeners work on dynamic content
- [ ] Accordion state persists across renders
- [ ] Multiple accordions can be open simultaneously
- [ ] Nested accordions work correctly
- [ ] FPS improves to 90+ with UI open
- [ ] No memory leaks from removed content

## Success Criteria

✅ **FPS with UI open:** 90+ FPS (currently 20 FPS)
✅ **Idle DOM elements:** <600 (currently 6,862)
✅ **Open 5 accordions:** <800 elements
✅ **User experience:** No noticeable lag when opening accordions
