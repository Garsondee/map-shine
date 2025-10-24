// ====================================================================
// DIAGNOSTIC: Foundry Time Sync Issue
// ====================================================================
// This diagnostic helps identify why changing Foundry's world time
// doesn't update Map Shine's time.
//
// TO USE:
// 1. Copy this entire code block
// 2. Paste into browser console (F12)
// 3. Change Foundry's world time using the time controls
// 4. Review the diagnostic output
//
// EXPECTED FINDING: MapShineClock doesn't listen to Foundry time hooks!
// ====================================================================

console.log("%c=== FOUNDRY TIME SYNC DIAGNOSTIC ===", "color: cyan; font-size: 16px; font-weight: bold");
console.log("\n⚠️ EXPECTED ISSUE: MapShineClock only listens to 'mapShine:timeChanged' (internal)");
console.log("   It does NOT listen to Foundry's world time hooks!");
console.log("   This diagnostic will confirm which Foundry hooks fire when time changes.\n");

// 1. Check current state
console.log("\n%c1. CURRENT STATE", "color: yellow; font-weight: bold");
console.log("Foundry World Time:", game.time.worldTime, "(seconds since epoch)");
console.log("Foundry Advance:", game.settings.get("core", "time"));
console.log("MapShine Current Time:", game.mapShine?.profileManager?.activeConfig?.timeOfDay?.currentTime);
console.log("MapShine syncFromFoundryTime:", game.mapShine?.profileManager?.activeConfig?.timeOfDay?.syncFromFoundryTime);
console.log("MapShine Clock Mode:", game.mapShine?.dayNightClock?.timeMode);

// 2. Check if the clock exists
console.log("\n%c2. CLOCK INSTANCE CHECK", "color: yellow; font-weight: bold");
if (game.mapShine?.dayNightClock) {
  console.log("✅ Clock instance exists");
  console.log("   - Current Time:", game.mapShine.dayNightClock.currentTime);
  console.log("   - Time Mode:", game.mapShine.dayNightClock.timeMode);
} else {
  console.log("❌ Clock instance does NOT exist");
  console.log("   ⚠️ You need to open the Day/Night Clock first!");
  console.log("   Run: game.mapShine.showDayNightClock()");
}

// 3. Check what hooks are registered for world time
console.log("\n%c3. FOUNDRY TIME HOOKS CHECK", "color: yellow; font-weight: bold");
console.log("Note: We'll install test listeners to see which hooks fire when time changes.");

// 4. Test MULTIPLE possible time hooks
console.log("\n%c4. REGISTERING TEST LISTENERS", "color: yellow; font-weight: bold");
console.log("Installing listeners for ALL possible time-related hooks...");

const hookIds = [];
const timeHookNames = [
  "updateWorldTime",  // Standard Foundry hook
  "worldClockUpdate", // Possible alternative
  "timeUpdate",       // Another possibility
  "advanceTime",      // When using time controls
  "updateGameTime",   // Another possibility
];

timeHookNames.forEach(hookName => {
  const id = Hooks.on(hookName, (...args) => {
    console.log(`%c⏰ HOOK FIRED: ${hookName}`, "color: lime; font-weight: bold");
    console.log("  - Arguments:", args);
    console.log("  - game.time.worldTime:", game.time.worldTime);
    console.log("  - MapShine Time:", game.mapShine?.profileManager?.activeConfig?.timeOfDay?.currentTime);
    console.log("  - Clock Time:", game.mapShine?.dayNightClock?.currentTime);
  });
  hookIds.push({ name: hookName, id });
});

console.log(`✅ Installed ${hookIds.length} test listeners`);
console.log("\n%c5. INSTRUCTIONS", "color: cyan; font-weight: bold");

// Auto-open the clock if it doesn't exist
if (!game.mapShine?.dayNightClock) {
  console.log("⚠️ Clock doesn't exist. Opening it now...");
  game.mapShine.showDayNightClock();
  console.log("✅ Day/Night Clock opened!");
  console.log("");
}

console.log("Now try changing Foundry's world time:");
console.log("  1. Open the time controls in Foundry (calendar icon in toolbar)");
console.log("  2. Advance or change the time");
console.log("  3. Watch for '⏰ HOOK FIRED:' messages above");
console.log("\nTo remove all test listeners later, run:");
console.log("  window.diagnosticCleanup()");

window.diagnosticCleanup = () => {
  hookIds.forEach(({name, id}) => {
    Hooks.off(name, id);
    console.log(`Removed listener for ${name}`);
  });
  console.log("✅ All diagnostic listeners removed");
  delete window.diagnosticCleanup;
};

// 6. Check Foundry's simple calendar integration (if present)
console.log("\n%c6. CALENDAR MODULE CHECK", "color: yellow; font-weight: bold");
if (game.modules.get("foundryvtt-simple-calendar")?.active) {
  console.log("✅ Simple Calendar is active");
  console.log("   Note: Simple Calendar may use different hooks");
} else if (game.modules.get("foundryvtt-simple-calendar")) {
  console.log("⚠️ Simple Calendar is installed but not active");
} else {
  console.log("ℹ️ Simple Calendar not installed");
}

// 7. Conversion helper
console.log("\n%c7. TIME CONVERSION HELPER", "color: yellow; font-weight: bold");
console.log("Foundry stores time in seconds. MapShine uses 0-24 hour format.");
console.log("To convert Foundry world time to hours:");
console.log("  const secondsPerDay = 86400;");
console.log("  const hours = (game.time.worldTime % secondsPerDay) / 3600;");
console.log("  console.log('Foundry Time as Hours:', hours);");

const secondsPerDay = 86400;
const currentHours = (game.time.worldTime % secondsPerDay) / 3600;
console.log("\nCurrent Foundry time as hours:", currentHours);
console.log("Current MapShine time as hours:", game.mapShine?.profileManager?.activeConfig?.timeOfDay?.currentTime);

console.log("\n%c=== ROOT CAUSE ANALYSIS ===", "color: orange; font-size: 14px; font-weight: bold");
console.log("\n📋 CURRENT IMPLEMENTATION:");
console.log("  - MapShineClock listens to: 'mapShine:timeChanged' (internal hook only)");
console.log("  - MapShineClock does NOT listen to: Foundry world time hooks");
console.log("  - Location: module.js line ~32717");
console.log("\n❌ THE PROBLEM:");
console.log("  When you change Foundry's time, MapShineClock never hears about it!");
console.log("  The clock needs to listen for Foundry time changes when in 'foundry' mode.");
console.log("\n✅ SOLUTION NEEDED:");
console.log("  1. Identify which Foundry hook fires (use this diagnostic)");
console.log("  2. Add a listener in MapShineClock constructor for that hook");
console.log("  3. When hook fires: convert Foundry time to 0-24 hours");
console.log("  4. Call _updateTime() with the converted time");
console.log("\n💡 CONVERSION FORMULA:");
console.log("  const secondsPerDay = 86400;");
console.log("  const hours = (game.time.worldTime % secondsPerDay) / 3600;");
console.log("  this._updateTime(hours, { fromHook: true });");

console.log("\n%c=== DIAGNOSTIC COMPLETE ===", "color: cyan; font-size: 16px; font-weight: bold");
console.log("Keep this console open and change Foundry's time to see which hooks fire.");
console.log("After identifying the hook, we can implement the fix in MapShineClock.");
