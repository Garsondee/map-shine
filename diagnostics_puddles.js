// Puddle System Diagnostic Script
// Run in browser console: F12 > Console > paste and hit Enter

console.log("=== PUDDLE SYSTEM DIAGNOSTIC ===\n");

// 1. Check if _Puddle texture was discovered
console.log("1. TEXTURE DISCOVERY:");
const targets = game.mapShine?.effectTargetManager?.targets;
if (!targets) {
    console.error("❌ Effect Target Manager has no targets!");
} else {
    console.log("✅ Effect Target Manager exists");
    
    // Check background
    if (targets.background?.puddle) {
        console.log(`✅ Background puddle texture found: ${targets.background.puddle}`);
    } else {
        console.log("❌ No puddle texture on background");
    }
    
    // Check tiles
    let puddleTiles = 0;
    for (const [id, data] of targets.tiles.entries()) {
        if (data?.puddle) {
            puddleTiles++;
            console.log(`✅ Tile ${id} has puddle texture: ${data.puddle}`);
        }
    }
    if (puddleTiles === 0) {
        console.log("❌ No puddle textures found on any tiles");
    }
}

// 2. Check puddle configuration
console.log("\n2. CONFIGURATION:");
const config = game.mapShine?.profileManager?.activeConfig;
if (!config) {
    console.error("❌ No active configuration!");
} else {
    const puddleConfig = config.water?.puddles;
    console.log(`Puddles enabled: ${puddleConfig?.enabled ?? "undefined"}`);
    console.log(`Darkening: ${puddleConfig?.darkening ?? "undefined"}`);
    console.log(`Water effect enabled: ${config.water?.enabled ?? "undefined"}`);
}

// 3. Check weather system
console.log("\n3. WEATHER SYSTEM:");
const weatherMgr = game.mapShine?.weatherSystemManager;
if (!weatherMgr) {
    console.error("❌ Weather System Manager not found!");
} else {
    console.log(`✅ Weather System Manager exists`);
    console.log(`Current state: ${weatherMgr.currentState ?? "undefined"}`);
    console.log(`Is transitioning: ${weatherMgr.isTransitioning ?? "undefined"}`);
    console.log(`Transition progress: ${weatherMgr.transitionProgress ?? "undefined"}`);
}

// 4. Check Water FX Layer
console.log("\n4. WATER FX LAYER:");
const waterLayer = canvas.layers.find(l => l.constructor.name === "WaterFXLayer");
if (!waterLayer) {
    console.error("❌ WaterFXLayer not found!");
} else {
    console.log(`✅ WaterFXLayer found`);
    console.log(`Layer visible: ${waterLayer.visible}`);
    console.log(`Puddle intensity (_puddleIntensity): ${waterLayer._puddleIntensity ?? "undefined"}`);
    console.log(`Puddle mask sprites count: ${waterLayer.puddleMaskSprites?.size ?? 0}`);
    console.log(`Puddle mask container children: ${waterLayer.puddleMaskContainer?.children?.length ?? 0}`);
    console.log(`Needs puddle mask update: ${waterLayer._needsPuddleMaskUpdate ?? "undefined"}`);
    
    // Check shader uniforms
    if (waterLayer.waterEffectsFilter) {
        const u = waterLayer.waterEffectsFilter.uniforms;
        console.log("\n   Shader Uniforms:");
        console.log(`   u_puddles_enabled: ${u.u_puddles_enabled ?? "undefined"}`);
        console.log(`   u_puddleIntensity: ${u.u_puddleIntensity ?? "undefined"}`);
        console.log(`   u_puddleDarkening: ${u.u_puddleDarkening ?? "undefined"}`);
        console.log(`   u_usePuddleMask: ${u.u_usePuddleMask ?? "undefined"}`);
        
        // Check if puddle mask texture is valid
        const puddleMask = u.u_puddleMask;
        if (puddleMask) {
            console.log(`   u_puddleMask texture: ${puddleMask.constructor.name}`);
            console.log(`   u_puddleMask valid: ${puddleMask.valid ?? "undefined"}`);
            console.log(`   u_puddleMask size: ${puddleMask.width}x${puddleMask.height}`);
        } else {
            console.log(`   u_puddleMask: null/undefined`);
        }
    } else {
        console.error("   ❌ waterEffectsFilter is null!");
    }
}

// 5. Check if weather is in rain/storm state
console.log("\n5. EXPECTED PUDDLE INTENSITY:");
if (weatherMgr) {
    const state = weatherMgr.currentState;
    let expectedIntensity = 0;
    switch (state) {
        case "drizzle": expectedIntensity = 0.4; break;
        case "rain": expectedIntensity = 0.8; break;
        case "storm": expectedIntensity = 1.0; break;
        case "sleet": expectedIntensity = 0.3; break;
        default: expectedIntensity = 0;
    }
    console.log(`For state "${state}", expected intensity: ${expectedIntensity}`);
    console.log(`Actual intensity on layer: ${waterLayer?._puddleIntensity ?? "undefined"}`);
    
    if (expectedIntensity > 0 && (!waterLayer?._puddleIntensity || waterLayer._puddleIntensity === 0)) {
        console.error("❌ PROBLEM: Expected puddle intensity > 0, but layer has 0!");
    }
}

// 6. Recommendations
console.log("\n=== RECOMMENDATIONS ===");
const issues = [];

if (!targets?.background?.puddle && targets?.tiles && [...targets.tiles.values()].every(t => !t?.puddle)) {
    issues.push("No _Puddle.webp textures detected. Ensure file is named correctly (e.g., Background_Puddle.webp)");
}

if (!config?.water?.puddles?.enabled) {
    issues.push("Puddles are disabled in configuration. Enable in Water Effects > Rain Puddles");
}

if (!weatherMgr || !["drizzle", "rain", "storm", "sleet"].includes(weatherMgr.currentState)) {
    issues.push(`Weather state is "${weatherMgr?.currentState ?? "unknown"}". Puddles only appear during rain/storm/drizzle/sleet`);
}

if (waterLayer && waterLayer._puddleIntensity === 0 && config?.water?.puddles?.enabled) {
    issues.push("Puddle intensity is 0 even though enabled. Weather system may not be calling _applyPuddleIntensity()");
}

if (!waterLayer?.waterEffectsFilter?.uniforms?.u_usePuddleMask) {
    issues.push("Shader uniform u_usePuddleMask is false. Puddle mask sprites may not have been created");
}

if (issues.length === 0) {
    console.log("✅ No obvious issues detected. Puddles should be working!");
} else {
    issues.forEach((issue, i) => {
        console.error(`${i + 1}. ${issue}`);
    });
}

console.log("\n=== END DIAGNOSTIC ===");
