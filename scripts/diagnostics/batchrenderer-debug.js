/**
 * BatchRenderer Null Object Diagnostic Tool
 * 
 * This script instruments PIXI's rendering pipeline to catch null/invalid objects
 * BEFORE they cause BatchRenderer errors.
 * 
 * Usage: Copy and paste into browser console while scene is loaded
 */

class BatchRendererDebugger {
  constructor() {
    this.nullObjectCaught = false;
    this.errorLog = [];
    this.setupInterceptors();
  }

  /**
   * Setup all diagnostic interceptors
   */
  setupInterceptors() {
    console.log("🔍 BatchRenderer Debugger: Installing interceptors...");
    
    // 1. Intercept Container.addChild
    this.interceptAddChild();
    
    // 2. Intercept BatchRenderer.render
    this.interceptBatchRenderer();
    
    // 3. Intercept renderer.render calls
    this.interceptRendererRender();
    
    // 4. Monitor PIXI object creation
    this.monitorSpriteCreation();
    
    console.log("✅ BatchRenderer Debugger: All interceptors installed");
    console.log("📊 Run debugger.getReport() to see caught errors");
  }

  /**
   * Intercept Container.addChild to catch null children being added
   */
  interceptAddChild() {
    const original = PIXI.Container.prototype.addChild;
    const self = this;
    
    PIXI.Container.prototype.addChild = function(...children) {
      for (const child of children) {
        if (!child) {
          const error = new Error("NULL CHILD DETECTED");
          self.logError("addChild", {
            error: "Null child added to container",
            container: this.constructor.name,
            stack: error.stack
          });
          console.error("❌ CAUGHT: Null child being added to", this.constructor.name);
          debugger; // Pause execution
          continue; // Skip adding null child
        }
        
        if (child._destroyed) {
          self.logError("addChild", {
            error: "Destroyed child added to container",
            container: this.constructor.name,
            child: child.constructor.name
          });
          console.warn("⚠️ CAUGHT: Destroyed object being added to", this.constructor.name);
          debugger;
          continue;
        }
        
        // Check texture validity for sprites
        if (child instanceof PIXI.Sprite && child.texture) {
          if (!child.texture.valid || !child.texture.baseTexture?.valid) {
            self.logError("addChild", {
              error: "Sprite with invalid texture added",
              container: this.constructor.name,
              textureValid: child.texture.valid,
              baseTextureValid: child.texture.baseTexture?.valid
            });
            console.warn("⚠️ CAUGHT: Sprite with invalid texture being added to", this.constructor.name);
          }
        }
      }
      
      return original.apply(this, children.filter(c => c && !c._destroyed));
    };
  }

  /**
   * Intercept BatchRenderer to catch null elements in batch
   */
  interceptBatchRenderer() {
    const renderer = canvas?.app?.renderer;
    if (!renderer) {
      console.error("Cannot intercept BatchRenderer: renderer not found");
      return;
    }

    const batchRenderer = renderer.plugins?.batch;
    if (!batchRenderer) {
      console.error("Cannot intercept BatchRenderer: batch plugin not found");
      return;
    }

    const originalRender = batchRenderer.render;
    const self = this;

    batchRenderer.render = function(element) {
      // Validate element before rendering
      if (!element) {
        self.logError("batchRender", {
          error: "Null element passed to BatchRenderer.render"
        });
        console.error("❌ CAUGHT: Null element in BatchRenderer.render");
        debugger;
        return;
      }

      if (element._destroyed) {
        self.logError("batchRender", {
          error: "Destroyed element in BatchRenderer",
          element: element.constructor.name
        });
        console.error("❌ CAUGHT: Destroyed element in BatchRenderer:", element.constructor.name);
        debugger;
        return;
      }

      // Check _batchEnabled property
      if (element._batchEnabled === undefined) {
        self.logError("batchRender", {
          error: "Element missing _batchEnabled property",
          element: element.constructor.name
        });
        console.warn("⚠️ CAUGHT: Element missing _batchEnabled:", element.constructor.name);
      }

      return originalRender.call(this, element);
    };
  }

  /**
   * Intercept renderer.render to catch null displayObjects
   */
  interceptRendererRender() {
    const renderer = canvas?.app?.renderer;
    if (!renderer) return;

    const originalRender = renderer.render;
    const self = this;

    renderer.render = function(displayObject, options) {
      if (!displayObject) {
        self.logError("render", {
          error: "Null displayObject passed to renderer.render"
        });
        console.error("❌ CAUGHT: Null displayObject in renderer.render");
        debugger;
        return;
      }

      // Recursively check all children for null/destroyed
      const checkChildren = (obj, depth = 0) => {
        if (depth > 20) return; // Prevent infinite recursion
        
        if (!obj.children) return;
        
        for (let i = 0; i < obj.children.length; i++) {
          const child = obj.children[i];
          
          if (!child) {
            self.logError("render", {
              error: "Null child in render tree",
              parent: obj.constructor.name,
              index: i,
              depth: depth
            });
            console.error(`❌ CAUGHT: Null child at index ${i} in`, obj.constructor.name);
            debugger;
            continue;
          }
          
          if (child._destroyed) {
            self.logError("render", {
              error: "Destroyed child in render tree",
              parent: obj.constructor.name,
              child: child.constructor.name,
              index: i,
              depth: depth
            });
            console.error(`❌ CAUGHT: Destroyed child at index ${i}:`, child.constructor.name);
            debugger;
            continue;
          }

          // Check sprite textures
          if (child instanceof PIXI.Sprite && child.texture) {
            if (!child.texture.baseTexture) {
              self.logError("render", {
                error: "Sprite missing baseTexture in render tree",
                parent: obj.constructor.name,
                sprite: child.constructor.name,
                depth: depth
              });
              console.error(`❌ CAUGHT: Sprite with null baseTexture:`, child);
              debugger;
            } else if (!child.texture.baseTexture.valid) {
              self.logError("render", {
                error: "Sprite with invalid baseTexture in render tree",
                parent: obj.constructor.name,
                sprite: child.constructor.name,
                depth: depth
              });
              console.warn(`⚠️ CAUGHT: Sprite with invalid baseTexture:`, child);
            }
          }
          
          checkChildren(child, depth + 1);
        }
      };

      checkChildren(displayObject);
      
      return originalRender.call(this, displayObject, options);
    };
  }

  /**
   * Monitor PIXI.Sprite creation for problematic patterns
   */
  monitorSpriteCreation() {
    const OriginalSprite = PIXI.Sprite;
    const self = this;
    
    PIXI.Sprite = function(texture) {
      const sprite = new OriginalSprite(texture);
      
      // Log if sprite created with invalid texture
      if (!texture || !texture.valid || !texture.baseTexture?.valid) {
        self.logError("spriteCreation", {
          warning: "Sprite created with invalid texture",
          textureType: texture?.constructor?.name,
          textureValid: texture?.valid,
          baseTextureValid: texture?.baseTexture?.valid
        });
        console.warn("⚠️ Sprite created with invalid texture:", texture);
      }
      
      return sprite;
    };
    
    // Preserve prototype
    PIXI.Sprite.prototype = OriginalSprite.prototype;
    PIXI.Sprite.from = OriginalSprite.from;
  }

  /**
   * Log error to internal log
   */
  logError(type, data) {
    this.errorLog.push({
      type,
      timestamp: Date.now(),
      ...data
    });
    this.nullObjectCaught = true;
  }

  /**
   * Get diagnostic report
   */
  getReport() {
    console.log("=".repeat(80));
    console.log("📊 BATCHRENDERER DIAGNOSTIC REPORT");
    console.log("=".repeat(80));
    console.log(`Total Issues Caught: ${this.errorLog.length}`);
    console.log("");
    
    if (this.errorLog.length === 0) {
      console.log("✅ No issues detected!");
    } else {
      const grouped = {};
      for (const error of this.errorLog) {
        if (!grouped[error.type]) grouped[error.type] = [];
        grouped[error.type].push(error);
      }
      
      for (const [type, errors] of Object.entries(grouped)) {
        console.log(`\n📍 ${type.toUpperCase()} (${errors.length} issues):`);
        errors.forEach((err, i) => {
          console.log(`  ${i + 1}.`, err);
        });
      }
    }
    
    console.log("\n" + "=".repeat(80));
    return this.errorLog;
  }

  /**
   * Remove all interceptors
   */
  cleanup() {
    console.log("🧹 Cleaning up interceptors (requires page refresh)...");
    location.reload();
  }
}

// Auto-start debugger
window.debugger = new BatchRendererDebugger();

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  BatchRenderer Null Object Debugger ACTIVE                     ║
╚════════════════════════════════════════════════════════════════╝

The debugger is now monitoring:
  ✓ Container.addChild() calls
  ✓ BatchRenderer.render() calls  
  ✓ Renderer.render() calls
  ✓ PIXI.Sprite() creation

Any null or invalid objects will trigger:
  • Console error with details
  • Debugger breakpoint (if DevTools open)
  • Error logged to debugger.errorLog

Commands:
  debugger.getReport()  - View all caught errors
  debugger.cleanup()    - Remove interceptors (reloads page)
`);
