# FPS Diagnostic Instructions

## 🎯 Goal

Capture the exact settings Foundry VTT uses when the 120 FPS cap is working correctly, so we can replicate those settings in our Playwright tests.

---

## 📋 Steps to Run Diagnostic

### 1. **Load Foundry VTT Normally**
   - Launch Foundry VTT the way you normally do (where 120 FPS cap works)
   - Log in as Gamemaster
   - Navigate to your test scene (Japanese Horror House)
   - Wait for everything to load completely

### 2. **Open Browser Console**
   - Press **F12** (or right-click → Inspect → Console tab)
   - You should see the console with a `>` prompt

### 3. **Run the Diagnostic**
   - Open the file: `fps-diagnostic-console.txt`
   - Press **Ctrl+A** to select all
   - Press **Ctrl+C** to copy
   - Go back to the browser console
   - Press **Ctrl+V** to paste
   - Press **Enter** to run

### 4. **Wait 5 Seconds**
   - The diagnostic will measure FPS for 5 seconds
   - You'll see a progress message: "⏱️ Measuring FPS for 5 seconds..."

### 5. **Copy the Results**
   - After 5 seconds, you'll see output with JSON data between two lines of dashes
   - Look for the section: `💾 COPY THIS JSON DATA`
   - Copy everything between the `━━━` lines (the JSON data)
   - Send it back to me

---

## 🔍 What We're Looking For

The diagnostic will capture:

### **Critical Settings:**
- `canvas.app.ticker.maxFPS` - Should be `120` when working correctly
- `canvas.app.ticker.minFPS` - Usually `0`
- `canvas.app.ticker.targetFPS` - Calculated value based on maxFPS
- `canvas.performance.mode` - Performance mode (0=LOW, 1=MEDIUM, 2=HIGH, 3=MAXIMUM)

### **Measured FPS Stats:**
- Average FPS over 5 seconds
- Median FPS (middle value)
- Min/Max FPS range
- 95th percentile FPS

---

## 📊 Example Output

You should see something like this:

```
🔍 FPS SETTINGS DIAGNOSTIC - FOUNDRY VTT
================================================================================

📊 TICKER SETTINGS: {
  maxFPS: 120,
  minFPS: 0,
  targetFPS: 119.99,
  currentFPS: 118.5,
  speed: 1,
  deltaTime: 1
}

🎨 PERFORMANCE MODE: {
  mode: 3,
  modeLabel: 'MAXIMUM'
}

⏱️ Measuring FPS for 5 seconds...

================================================================================
✅ MEASUREMENT COMPLETE!
================================================================================

📊 FPS STATISTICS:
   Frames Captured: 600
   Average FPS: 118.45
   Median FPS: 119.20
   Min FPS: 85.30
   Max FPS: 120.00
   95th Percentile: 119.85

🎯 CRITICAL SETTINGS FOR 120 FPS CAP:
────────────────────────────────────────────────────────────────────────────────
   ticker.maxFPS = 120 ✅
   ticker.minFPS = 0
   ticker.targetFPS = 119.99
   performance.mode = 3 (MAXIMUM)

💾 COPY THIS JSON DATA (everything between the lines):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "ticker": {
    "maxFPS": 120,
    "minFPS": 0,
    "targetFPS": 119.99,
    "currentFPS": 118.5,
    "speed": 1,
    "deltaTime": 1
  },
  "performance": {
    "mode": 3,
    "modeLabel": "MAXIMUM"
  },
  "fpsStats": {
    "frameCount": 600,
    "averageFPS": 118.45,
    "medianFPS": 119.20,
    "minFPS": 85.30,
    "maxFPS": 120.00,
    "p95FPS": 119.85,
    "measurementDuration": 5000
  }
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

================================================================================
✅ DIAGNOSTIC COMPLETE - Send the JSON data above!
================================================================================
```

**Copy the JSON part** (everything between the `━━━` lines) and send it back!

---

## 🔧 What We'll Do With The Data

Once we have your working settings, we'll:

1. **Compare** them to what our Playwright tests are setting
2. **Identify** any missing settings or incorrect values
3. **Update** the test scripts to match your working configuration
4. **Re-run** the tests to verify the 120 FPS cap works correctly

---

## ⚠️ Troubleshooting

### **If the diagnostic doesn't run:**
- Make sure you're in the browser console (F12), not a text editor
- Make sure you copied ALL the code including the `(function() {` at the start and `})();` at the end
- Try refreshing Foundry and running it again

### **If you see errors:**
- Check that `canvas` is available by typing `canvas` in console and pressing Enter
- You should see a Canvas object, not `undefined`
- If it's undefined, wait for the scene to fully load and try again

### **If FPS stats show unexpected values:**
- This is actually useful! It tells us the cap isn't working as expected
- Send the data anyway - it will help us understand what's going wrong

---

## 📁 Files in This Directory

- **`README.md`** (this file) - Instructions
- **`fps-diagnostic-console.txt`** - The diagnostic script to copy/paste
- **`fps-settings-diagnostic.js`** - Full commented version (for reference)

---

## 🚀 Ready?

1. Load Foundry VTT
2. Open `fps-diagnostic-console.txt`
3. Copy everything (Ctrl+A, Ctrl+C)
4. Open browser console (F12)
5. Paste and press Enter
6. Wait 5 seconds
7. Copy the JSON output
8. Send it back!

Let's figure out what settings make the 120 FPS cap work! 🎯
