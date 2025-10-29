# Single Effect Performance Report

**Effect:** Cloud Shadows
**Path:** `cloudShadows.enabled`
**Scene:** Mythica Machina - Japanese Horror House
**Timestamp:** 2025-10-28T11:48:19.350Z
**Duration:** 1.6 minutes

---

## Measurements

### Baseline - All Effects Enabled
- **Average FPS:** 81.63
- **Frame Time:** 12.25ms
- **Min/Max FPS:** 30.40 / 384.62
- **Stutter Events:** 0

### Baseline - All Effects Disabled
- **Average FPS:** 676.20
- **Frame Time:** 1.48ms
- **Min/Max FPS:** 101.01 / 1666.67
- **Stutter Events:** 0

### Effect Solo
- **Average FPS:** 139.83
- **Frame Time:** 7.15ms
- **Min/Max FPS:** 52.63 / 1250.00
- **Stutter Events:** 0

---

## Performance Analysis

### 1. Effect Cost (vs Empty Scene)
Baseline (empty scene) vs effect running solo.

- **FPS Cost:** 536.37 FPS (79.3%)
- **Frame Time Cost:** 5.67ms
- **Impact Rating:** CRITICAL

### 2. Effect Cost (in Full Scene)
How much this effect costs when all other effects are running.

- **FPS Cost:** 536.37 FPS (657.0%)
- **Frame Time Cost:** 5.67ms
- **Impact Rating:** CRITICAL

### 3. Other Effects Cost
Combined cost of all other effects when this effect is disabled.

- **FPS Cost:** 58.20 FPS (8.6%)

### 4. Efficiency Ratio
This effect accounts for **90.2%** of the total scene performance cost.

⚠️ **PRIMARY BOTTLENECK** - This effect is the main performance issue!

---

## Quick Reference

| Metric | All Enabled | All Disabled | Effect Solo |
|--------|-------------|--------------|-------------|
| FPS | 81.63 | 676.20 | 139.83 |
| Frame Time | 12.25ms | 1.48ms | 7.15ms |
| Stutter Events | 0 | 0 | 0 |

