# TypeScript Typing Analysis Report for Map Shine Module

**Date:** October 20, 2025  
**Foundry VTT Version:** 13.344 (Generation 13, Build 344)  
**Module Version:** 1.1.52

---

## Executive Summary

**Can we use Foundry VTT's node_modules for accurate typing?** **Partially, but with significant limitations.**

The Map Shine module currently uses 40+ `@ts-ignore`/`@ts-expect-error` directives and has `@ts-nocheck` at the top of `module.js`. While Foundry VTT's installation does provide some type information, directly leveraging it for module development presents several architectural challenges.

---

## Current State Analysis

### Current Type System
- **Type Package:** `@league-of-foundry-developers/foundry-vtt-types` v13.346.0-beta
- **Custom Definitions:** `foundry-vtt-globals.d.ts` (275 lines)
- **TypeScript Suppressions:** 40 instances across 7 files
  - `module.js`: 25 suppressions (+ 1 `@ts-nocheck` at file level)
  - `AmbientLayer.js`: 5 suppressions
  - `CoordinateManager.js`: 3 suppressions
  - `particle-emitter.js`: 3 suppressions
  - `FontManager.js`: 2 suppressions
  - `TokenManager.js`: 1 suppression
  - `MemoryProfiler.js`: 1 suppression

### Suppression Categories
1. **Custom Hooks** (8 instances) - `mapShine:timeChanged`, `mapShine:targetsRefreshed`, etc.
2. **Missing Foundry Hooks** (6 instances) - `createLight`, `updateLight`, `deleteLight`, etc.
3. **PIXI API Mismatches** (2 instances) - `PIXI.RenderTexture.create` options object
4. **Extended Properties** (4 instances) - Custom properties added to base config objects
5. **Animation API** (1 instance) - `NativeAnimation.to` progress property

---

## What's Available in Foundry VTT's Installation

### 1. **PIXI.js Types - NOT DIRECTLY USABLE**
```
Location: C:\Program Files\Foundry Virtual Tabletop\resources\app\node_modules\pixi.js
Problem: No TypeScript definitions shipped with the installed version
```

**Evidence:**
- `pixi.js/package.json` declares `"types": "lib/index.d.ts"`
- **BUT** The `lib/` directory only contains `.js` and `.mjs` files
- No `.d.ts` files exist in the installed pixi.js package
- This is the compiled/bundled version without type definitions

**Why This Happens:**
Foundry VTT ships production builds of dependencies, not development packages with full TypeScript definitions.

### 2. **Foundry's Own Types - PROPRIETARY FORMAT**
```
Location: C:\Program Files\Foundry Virtual Tabletop\resources\app\client\global.d.mts
Format: ES Module TypeScript declarations (.d.mts)
```

**Contents:**
```typescript
import * as constants from "@common/constants.mjs";
import PixiJS from "pixi.js";
import Canvas from "./canvas/board.mjs";
import Game from "./game.mjs";

declare global {
  namespace globalThis {
    export import PIXI = PixiJS;
    const canvas: Canvas;
    const game: Game;
  }
}
```

**Problems:**
- Uses internal path aliases (`@common/*`, `@client/*`) not available to external modules
- References to `.mjs` source files that are bundled/compiled in production
- Designed for Foundry's internal build system, not module development
- Would require complex path mapping and module resolution configuration

### 3. **@types Packages - MINIMAL COVERAGE**
```
Available: @types/cors, @types/css-font-loading-module, @types/node, @types/triple-beam
Foundry-Specific: NONE
```

---

## Comparison: Current vs Foundry Installation

| Resource | League Types | Foundry Install | Usability for Modules |
|----------|--------------|-----------------|----------------------|
| **Foundry Core API** | ✅ Comprehensive | ❌ Internal only | ✅ Use League Types |
| **PIXI.js v7.4.3** | ✅ Typed via GitHub fork | ❌ No types shipped | ✅ Use League Types |
| **Custom Filters** | ⚠️ Manual augmentation | ❌ N/A | ⚠️ Keep custom .d.ts |
| **Hooks (Core)** | ⚠️ Incomplete | ❌ No help | ❌ Manual augmentation |
| **Hooks (Custom)** | ❌ N/A | ❌ N/A | ❌ Manual augmentation |

---

## Why League Types Uses Custom PIXI.js

From `@league-of-foundry-developers/foundry-vtt-types/package.json`:
```json
{
  "dependencies": {
    "pixi.js": "github:foundry-vtt-types/pixi.js#main"
  }
}
```

**They maintain a fork with proper TypeScript definitions** because:
1. Official PIXI.js v7.4.3 distributable doesn't include `.d.ts` files
2. Foundry's installation strips development artifacts
3. They add missing type declarations and fix errors in PIXI's types

**Key Insight:** Even the League of Foundry Developers can't use Foundry's installed PIXI.js for typing.

---

## Root Causes of Typing Issues

### 1. **Custom Hook System** (14 suppressions)
```javascript
// @ts-expect-error - Custom hook type augmentation not working
Hooks.callAll("mapShine:timeChanged", time);
```

**Problem:** Foundry's `HookConfig` interface is augmented in `foundry-vtt-globals.d.ts` but TypeScript isn't recognizing it.

**Current Augmentation:**
```typescript
interface HookConfig {
  "mapShine:timeChanged": (time: number) => void;
  "mapShine:targetsRefreshed": () => void;
  // ... etc
}

interface Hooks {
  callAll(hook: string, ...args: any[]): boolean;
  on(hook: string, fn: (...args: any[]) => any, options?: any): number;
  // ...
}
```

**Issue:** The `Hooks` interface is too permissive (`hook: string`) and overrides the specific `HookConfig` types.

### 2. **PIXI API Version Mismatches** (2 suppressions)
```javascript
// @ts-expect-error - PIXI.RenderTexture.create accepts options object in v5+
this.lightPolygonMaskTexture = PIXI.RenderTexture.create({
  width: screen.width,
  height: screen.height,
});
```

**Problem:** League types might have incorrect signature for `PIXI.RenderTexture.create` or be based on different PIXI version.

### 3. **Extended Configuration Objects** (4 suppressions)
```javascript
// @ts-expect-error - Extended properties from defaults
u.uSelectiveDesaturation = cc.selective.desaturation;
```

**Problem:** Custom properties added to default config aren't reflected in type definitions.

---

## Proposed Solutions

### Option 1: Fix Existing League Types (RECOMMENDED)
**Effort:** Medium | **Impact:** High | **Maintainability:** High

**Actions:**
1. ✅ **Fix Hook Augmentation** (Addresses 14 suppressions)
   ```typescript
   // foundry-vtt-globals.d.ts
   interface HookConfig {
     "mapShine:timeChanged": (time: number) => void;
     "mapShine:targetsRefreshed": () => void;
     "mapShine:mapPointsUpdated": (context?: { created?: string; updated?: string; deleted?: string }) => void;
     "mapShine:activeTokenChanged": (token: any) => void;
     "mapShine:masksRendered": (data: { changedGroupId?: string }) => void;
     "mapShine:setupComplete": (data: { type: string }) => void;
     "mapShine:profileUpdated": () => void;
   }
   
   // Fix the permissive Hooks interface - remove or make it more specific
   interface Hooks {
     callAll<K extends keyof HookConfig>(hook: K, ...args: Parameters<HookConfig[K]>): boolean;
     on<K extends keyof HookConfig>(hook: K, fn: HookConfig[K], options?: any): number;
     // ... etc
   }
   ```

2. ✅ **Add Missing Foundry Hooks** (Addresses 6 suppressions)
   ```typescript
   interface HookConfig {
     "createLight": (light: any, options: any, userId: string) => void;
     "updateLight": (light: any, changes: any, options: any, userId: string) => void;
     "deleteLight": (light: any, options: any, userId: string) => void;
     "createWall": (wall: any, options: any, userId: string) => void;
     "updateWall": (wall: any, changes: any, options: any, userId: string) => void;
     "deleteWall": (wall: any, options: any, userId: string) => void;
   }
   ```

3. ✅ **Fix PIXI.RenderTexture.create Signature** (Addresses 2 suppressions)
   ```typescript
   namespace PIXI {
     class RenderTexture {
       static create(options: {
         width?: number;
         height?: number;
         type?: PIXI.TYPES;
         scaleMode?: PIXI.SCALE_MODES;
       }): PIXI.RenderTexture;
       
       static create(width?: number, height?: number, scaleMode?: PIXI.SCALE_MODES): PIXI.RenderTexture;
     }
   }
   ```

4. ✅ **Type Custom Config Extensions** (Addresses 4 suppressions)
   ```typescript
   // Create typed config interfaces
   interface ColorCorrectionSelectiveConfig {
     enabled: boolean;
     targetLuminance: number;
     softness: number;
     invert: boolean;
     desaturation: number;  // Custom property
     targetSaturation: number;  // Custom property
     targetBrightness: number;  // Custom property
   }
   ```

5. ✅ **Fix NativeAnimation Type** (Addresses 1 suppression)
   ```typescript
   type NativeAnimationConfig = {
     duration: number;
     onUpdate?: () => void;
     onComplete?: () => void;
     ease?: string | ((t: number) => number);
     progress?: number;  // Already present but being ignored
     [key: string]: any;  // Allow any animated properties
   };
   ```

**Expected Result:** Remove 27+ suppressions, keep custom .d.ts file maintained and accurate.

---

### Option 2: Reference Foundry Installation Types (NOT RECOMMENDED)
**Effort:** Very High | **Impact:** Low | **Maintainability:** Very Low

**Why NOT To Do This:**

1. **Path Complexity**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@common/*": ["C:/Program Files/Foundry Virtual Tabletop/resources/app/common/*"],
         "@client/*": ["C:/Program Files/Foundry Virtual Tabletop/resources/app/client/*"]
       }
     }
   }
   ```
   - Absolute paths not portable across developers
   - Breaks on different Foundry installation locations
   - Windows/Mac/Linux path differences

2. **Missing Type Definitions**
   - PIXI.js has no types in the installation
   - Would still need League types or another source

3. **Foundry Updates**
   - Every Foundry update could break type references
   - No versioning or stability guarantees
   - Internal APIs may change without notice

4. **No Benefit**
   - Foundry's `.d.mts` files are for internal use only
   - They don't provide anything League types don't
   - Actually provides LESS (no PIXI types)

---

### Option 3: Hybrid Approach (NOT RECOMMENDED)
**Effort:** High | **Impact:** Low | **Maintainability:** Very Low

Use League types for most things but reference Foundry installation for specific APIs.

**Problems:**
- All the disadvantages of Option 2
- Type conflicts between two sources
- Confusion about which type system is authoritative
- Debugging nightmare when types disagree

---

## Recommended Action Plan

### Phase 1: Fix Hook Types (HIGH PRIORITY)
**Time:** 1-2 hours | **Impact:** Removes 14 suppressions

1. Rewrite `Hooks` interface in `foundry-vtt-globals.d.ts` to use generics
2. Add all missing core Foundry hooks to `HookConfig`
3. Test with strict type checking enabled
4. Submit fixes to League of Foundry Developers repo (help the community!)

### Phase 2: Fix PIXI Types (MEDIUM PRIORITY)
**Time:** 1-2 hours | **Impact:** Removes 2 suppressions

1. Verify correct `PIXI.RenderTexture.create` signatures in PIXI v7.4.3 docs
2. Add overload signatures to `foundry-vtt-globals.d.ts`
3. Test texture creation code with strict typing

### Phase 3: Type Custom Config (MEDIUM PRIORITY)
**Time:** 2-3 hours | **Impact:** Removes 4+ suppressions

1. Create TypeScript interfaces for all config objects in `UNIVERSAL_EFFECT_DEFAULTS`
2. Use intersection types to extend base configs: `BaseConfig & CustomExtensions`
3. Update `foundry-vtt-globals.d.ts` with complete config types

### Phase 4: Enable Strict Checking (LOW PRIORITY)
**Time:** 4-8 hours | **Impact:** Full type safety

1. Remove `@ts-nocheck` from `module.js`
2. Address remaining typing issues
3. Set `"checkJs": true` and `"noImplicitAny": true` in `jsconfig.json`
4. Fix any new errors that surface

---

## Long-Term Recommendation

**KEEP USING LEAGUE TYPES + CUSTOM AUGMENTATION**

**Why:**
- ✅ Industry standard for Foundry module development
- ✅ Actively maintained by experienced community
- ✅ Includes properly typed PIXI.js fork
- ✅ Portable across development environments
- ✅ Doesn't break on Foundry updates
- ✅ Custom augmentation file (`foundry-vtt-globals.d.ts`) provides flexibility

**Don't:**
- ❌ Try to use Foundry installation types directly
- ❌ Mix type sources (creates conflicts)
- ❌ Rely on undocumented internal Foundry APIs

**Do:**
- ✅ Maintain and improve `foundry-vtt-globals.d.ts`
- ✅ Contribute fixes back to League types repository
- ✅ Document custom types clearly
- ✅ Keep suppressions to absolute minimum
- ✅ Add JSDoc comments for complex custom APIs

---

## Metrics

### Current State
- **Total Suppressions:** 40
- **Files with Suppressions:** 7
- **Strict Type Checking:** Disabled (`@ts-nocheck` in main file)
- **Type Coverage:** ~60% (estimated)

### After Phase 1-3
- **Total Suppressions:** 13-15 (68% reduction)
- **Files with Suppressions:** 4-5
- **Strict Type Checking:** Still disabled (safe incremental progress)
- **Type Coverage:** ~85% (estimated)

### After Phase 4 (Full Implementation)
- **Total Suppressions:** 0-5 (90%+ reduction)
- **Files with Suppressions:** 0-2
- **Strict Type Checking:** Enabled
- **Type Coverage:** 95%+ (full type safety)

---

## Conclusion

**Foundry VTT's node_modules cannot provide better typing than what you currently have.** The installation contains:
- Compiled PIXI.js without type definitions
- Internal Foundry types not designed for external use
- No additional type information for module development

The current approach using `@league-of-foundry-developers/foundry-vtt-types` is correct. The path to better typing is **improving your custom type augmentation file** and **fixing type system integration**, not switching to Foundry's installation types.

**Priority Actions:**
1. Fix Hooks interface to properly recognize custom hook types
2. Add missing Foundry core hook definitions
3. Fix PIXI.RenderTexture.create signature
4. Type your custom config extensions

**Expected Outcome:** Reduce suppressions by 68% with 4-6 hours of focused work, achieving proper type safety without switching type systems.
