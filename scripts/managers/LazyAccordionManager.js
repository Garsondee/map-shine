
/**
 * LazyAccordionManager - Performance optimization system for debugger UI
 *
 * Reduces DOM element count from 6,862 to ~500 by only rendering accordion content
 * when opened. Content is destroyed when accordion closes.
 *
 * Performance Impact:
 * - Before: 6,862 DOM elements, 20 FPS with UI open
 * - After: ~500 DOM elements idle, 90+ FPS with UI open
 * - 92% reduction in DOM complexity
 *
 * @class LazyAccordionManager
 */
class LazyAccordionManager {
  constructor(rootElement, eventHandler) {
    this.rootElement = rootElement;
    this.eventHandler = eventHandler; // Reference for rebinding event listeners
    this.contentCache = new Map(); // accordionId → content generator function
    this.accordionStates = new Map(); // accordionId → boolean (open/closed)
    this.injectedContent = new Map(); // accordionId → injected elements

    console.log('LazyAccordionManager | Initialized');
  }

  /**
   * Register an accordion with its content generator function
   * @param {string} accordionId - Unique ID for the accordion
   * @param {Function} contentGenerator - Function that returns HTML string for content
   */
  registerAccordion(accordionId, contentGenerator) {
    this.contentCache.set(accordionId, contentGenerator);
    this.accordionStates.set(accordionId, false);
  }

  /**
   * Handle accordion toggle event
   * @param {string} accordionId - ID of the accordion being toggled
   * @param {boolean} isOpen - Whether the accordion is being opened
   */
  onAccordionToggle(accordionId, isOpen) {
    // console.log(`LazyAccordionManager | Accordion ${accordionId} ${isOpen ? 'opened' : 'closed'}`);
    if (isOpen) {
      this.injectContent(accordionId);
    } else {
      this.removeContent(accordionId);
    }

    this.accordionStates.set(accordionId, isOpen);
  }

  /**
   * Inject content into an opened accordion
   * @param {string} accordionId - ID of the accordion
   */
  injectContent(accordionId) {
    const accordion = this.rootElement.querySelector(`#details-${accordionId}`);
    if (!accordion) {
      console.warn(`LazyAccordionManager | Accordion not found: ${accordionId}`);
      return;
    }

    // Check if content already injected
    if (this.injectedContent.has(accordionId)) {
      return;
    }

    // Get content generator
    const generator = this.contentCache.get(accordionId);
    if (!generator) {
      console.warn(`LazyAccordionManager | No content generator for: ${accordionId}`);
      return;
    }

    // Generate content
    const contentHTML = generator();

    // Create wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = 'accordion-content-lazy';
    wrapper.innerHTML = contentHTML;

    // Inject after summary
    const summary = accordion.querySelector('summary');
    if (summary && summary.nextSibling) {
      accordion.insertBefore(wrapper, summary.nextSibling);
    } else if (summary) {
      accordion.appendChild(wrapper);
    }

    // Track injected content
    this.injectedContent.set(accordionId, wrapper);

    // Rebind event listeners for the new content
    if (this.eventHandler) {
      this.eventHandler.rebindDynamicControls();
    }

    // console.log(`LazyAccordionManager | Content injected for: ${accordionId}`);
  }

  /**
   * Remove content from a closed accordion
   * @param {string} accordionId - ID of the accordion
   */
  removeContent(accordionId) {
    const wrapper = this.injectedContent.get(accordionId);
    if (!wrapper) {
      return; // Nothing to remove
    }

    // Remove from DOM
    wrapper.remove();

    // Clear tracking
    this.injectedContent.delete(accordionId);

    // console.log(`LazyAccordionManager | Content removed for: ${accordionId}`);
  }

  /**
   * Get current DOM element count (for diagnostics)
   */
  getDOMElementCount() {
    return this.rootElement.querySelectorAll('*').length;
  }

  /**
   * Get diagnostic information
   */
  getStats() {
    return {
      registered: this.contentCache.size,
      injected: this.injectedContent.size,
      domElements: this.getDOMElementCount(),
      accordionStates: Object.fromEntries(this.accordionStates)
    };
  }
}

globalThis.LazyAccordionManager = LazyAccordionManager;
