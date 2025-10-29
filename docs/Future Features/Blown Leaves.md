Feasibility Report: Wind-Blown Leaf Particle System
Executive Summary
Verdict: ✅ FEASIBLE with moderate complexity
Estimated Implementation Time: 15-25 hours
Risk Level: MODERATE (some technical challenges, but all solvable)
Recommended Approach: Hybrid system with tile-based spawning + color sampling

Technical Architecture Assessment
✅ Strong Foundation - What Already Exists
1. Particle System Infrastructure (EXCELLENT)
Existing Components:

ParticleManager - Fully functional emitter system
TextureMaskShape - Spawn point sampling from textures (lines 16580-16900)
Color sampling capability already implemented - colorTexture property extracts RGB values
WindBehavior - Wind force integration with turbulence
Viewport culling for performance
Fire particles demonstrate similar wind-driven behavior
2. Wind System (PERFECT FIT)
Location: Lines 14372-14500

javascript
WindManager.getNormalizedStrength() // Returns 0.0-1.0 based on speed/gustSpeed
// Your 80% threshold check:
if (windManager.getNormalizedStrength() > 0.8) {
  spawnLeaves();
}
Features:

Gust system with configurable timing
gustSpeed reaches 99-500 depending on weather
_isGusting flag tracks active gusts
Already integrated with particles, clouds, foliage
3. Outdoor Masking (TRIVIAL)
Available Now:

ResourceManager.getOutdoorsMask() - Returns _Outdoors texture
Edge droplet system (lines 36614-36957) shows exact pattern for indoor culling
Custom behavior can sample mask and stop/destroy particles
🟡 Moderate Challenges - Solvable
Challenge 1: Bush/Tree Spawn Point Detection
Current State:

BushLayer and TreeLayer exist (lines 28716-29055)
They use tile detection, NOT texture masks
No _Bush or _Tree texture discovery in TextureAutoLoader
Solution Options:

Option A: Tile-Based Spawning (RECOMMENDED - 8 hours)

javascript
// Leverage existing tile detection
const bushTiles = canvas.background.tiles.filter(t => 
  t.document.texture.src.includes('_Bush') || 
  t.document.flags?.mapShine?.isBush
);

// Spawn particles at tile bounds + random offset
for (const tile of bushTiles) {
  const spawnPoint = {
    x: tile.x + Math.random() * tile.width,
    y: tile.y + Math.random() * tile.height
  };
}
Pros:

✅ Works with existing map workflow
✅ No new textures required
✅ Tile positions are already known
Cons:

⚠️ Less precise than texture masks
⚠️ Requires tile metadata or filename patterns
Option B: Texture Mask Workflow (15 hours)

Add _Bush and _Tree to TextureAutoLoader.SUFFIX_MAP
Users export separate bush/tree alpha masks
Use TextureMaskShape for precise spawning
Pros:

✅ Pixel-perfect spawn locations
✅ Natural density variation
Cons:

⚠️ Requires user workflow change
⚠️ Additional texture export step
Recommendation: Option A first, then Option B as enhancement

Challenge 2: Leaf Color Sampling from Source
Good News: TextureMaskShape already has color sampling (line 16771)

javascript
// Existing code in TextureMaskShape:
if (this.colorTexture) {
  colorPixelData = renderer.extract.pixels(colorRenderTexture);
  // Samples RGB from texture at spawn point
}
Implementation:

javascript
class LeafColorBehavior {
  initParticles(first) {
    let next = first;
    while (next) {
      // Sample base texture at spawn position
      const sampledColor = sampleTextureAt(
        backgroundTexture, 
        next.position.x, 
        next.position.y
      );
      next.tint = sampledColor; // Apply to leaf particle
      next = next.next;
    }
  }
}
Challenge: Avoiding outline color sampling

Bush outlines are dark (~RGB 20, 20, 20)
Solution: Sample from slightly inward from detected edge (offset -5px)
Or: Sample multiple points and average, excluding dark values
Complexity: MODERATE (6-8 hours including edge avoidance)

Challenge 3: Dark-Bordered Leaf Shapes
This is the trickiest part - matching your map's thick outline aesthetic.

Option A: Pre-rendered Leaf Textures (SIMPLE - 4 hours)

assets/leaves/
  leaf_01.png - Maple shape with dark border
  leaf_02.png - Oak shape with dark border
  leaf_03.png - Generic oval with border
Pros:

✅ Artist has full control
✅ Can match outline width exactly
✅ No shader complexity
Cons:

⚠️ Fixed border color (doesn't adapt to sampled color)
⚠️ Multiple textures needed for variety
Option B: Shader-Based Outline (COMPLEX - 12+ hours)

glsl
// Fragment shader adds border based on alpha
vec4 leafColor = texture2D(uSampler, vTextureCoord);
float distToEdge = /* distance field calculation */;
if (distToEdge < borderWidth) {
  return vec4(0.08, 0.08, 0.08, leafColor.a); // Dark outline
}
return leafColor * vColor; // Tinted leaf interior
Pros:

✅ Border adapts to any sampled color
✅ Procedural - no texture overhead
Cons:

⚠️ Complex implementation
⚠️ Performance cost (SDF calculation per fragment)
⚠️ May not match hand-drawn outline aesthetic
Option C: Hybrid - Outline Texture + Color Tint (RECOMMENDED - 6 hours)

Base texture: leaf_shape_with_outline.png
- Dark border pre-baked (RGB 20, 20, 20)
- Interior is neutral gray (RGB 128, 128, 128)

Runtime:
- Sample color from bush/tree (e.g., RGB 80, 140, 60)
- Apply multiply blend only to interior pixels
- Border stays dark, interior gets tinted
Pros:

✅ Best of both worlds
✅ Outline matches map style
✅ Color adapts per bush
Cons:

⚠️ Requires texture masking to separate border from interior
Recommendation: Option C for best results, Option A for fastest implementation

✅ Easy Wins - Trivial Implementation
1. Wind Threshold Spawning (30 minutes)
javascript
if (windManager.getNormalizedStrength() > 0.8 && config.enabled) {
  leafEmitter.emit = true;
} else {
  leafEmitter.emit = false;
}
2. Outdoor Masking (2 hours)
javascript
class OutdoorCullingBehavior {
  updateParticle(particle, dt) {
    const mask = resourceManager.getOutdoorsMask();
    const maskValue = sampleMask(mask, particle.x, particle.y);
    if (maskValue < 0.5) { // Indoors
      particle.age = particle.maxLife; // Kill particle
    }
  }
}
3. Wind-Driven Movement (Already Exists)
javascript
behaviors: [
  { type: 'wind', config: { force: 0.5, turbulence: 0.3 } },
  { type: 'rotation', config: { minSpeed: -180, maxSpeed: 180 } },
  { type: 'alpha', config: { start: 1.0, end: 0.0 } }
]
🎯 Recommended Implementation Plan
Phase 1: Core System (8-10 hours)
Tile-Based Spawn Detection (3 hours)
Scan canvas.background.tiles for bush/tree tiles
Build spawn point array from tile bounds
Add random offsets for natural distribution
Wind Threshold Controller (1 hour)
Monitor WindManager.getNormalizedStrength()
Enable/disable emitter at 80% threshold
Add config: leafFall.windThreshold (default 0.8)
Basic Leaf Particles (2 hours)
Create simple leaf texture (oval with border)
Integrate with ParticleManager
Add wind behavior + rotation + alpha fade
Outdoor Masking (2 hours)
Implement custom culling behavior
Sample _Outdoors mask
Destroy particles that enter indoor spaces
Phase 2: Color Matching (6-8 hours)
Color Sampling System (4 hours)
Sample background texture at spawn position
Implement edge avoidance (sample inward)
Apply tint to leaf particles
Outline Matching (4 hours)
Create hybrid outline+interior texture
Implement multiply blend for interior only
Test with various bush colors
Phase 3: Polish (3-5 hours)
Multiple Leaf Shapes (2 hours)
3-5 different leaf silhouettes
Random selection at spawn
Seasonal Variations (2 hours)
Config: leafFall.seasonalTint (green, yellow, orange, brown)
Multiply with sampled color for autumn leaves
UI Controls (1 hour)
Enable toggle
Wind threshold slider
Spawn rate, lifetime, size controls
⚠️ Potential Minefields
1. Performance (LOW RISK)
Concern: Too many leaf particles during storm gusts
Mitigation:

Cap max particles: 200-300
Viewport culling already implemented
LOD system: Reduce spawn rate when zoomed out
Estimated Impact: <2ms/frame for 300 particles
2. Color Sampling Accuracy (MODERATE RISK)
Concern: Sampling outline instead of bush interior
Mitigation:

Offset spawn sample point inward (-5px to -10px)
Multi-point sampling with median filter
Fallback to neutral green if all samples are dark
Estimated Impact: 80-90% accuracy with offsets
3. Bush/Tree Detection Reliability (MODERATE RISK)
Concern: Tile detection may miss bushes or detect wrong tiles
Mitigation:

Metadata flag system: tile.document.flags.mapShine.isFoliage = true
Filename pattern matching: includes('_Bush') or includes('_Tree')
Manual override UI: "Mark tile as foliage source"
Estimated Impact: Requires user cooperation for accurate detection
4. Outline Aesthetic Match (MODERATE-HIGH RISK)
Concern: Procedural outlines won't match hand-drawn map style
Mitigation:

Use pre-rendered outlined textures (artistic control)
Provide template PSD files for user customization
Consider outline thickness as configurable (1-3px)
Estimated Impact: Pre-rendered textures solve this completely
💡 Enhancement Opportunities
Low-Hanging Fruit (Post-MVP)
Ground Accumulation - Leaves pile up on ground, fade over time
Different Leaf Types - Link to specific bush/tree tile types
Seasonal Presets - One-click autumn/spring/summer leaf colors
Swirling Behavior - Circular motion during strong gusts
Sound Integration - Rustling sound when leaves spawn
Advanced Features (Future)
Physics Collision - Leaves bounce off walls
Water Interaction - Leaves float on water surfaces
Light Interaction - Leaves cast tiny shadows
Particle Trails - Motion blur for fast-moving leaves
📊 Risk vs. Reward Matrix
Component	Complexity	Risk	Visual Impact	Recommendation
Wind threshold spawning	⭐	🟢	⭐⭐⭐	✅ Essential
Tile-based detection	⭐⭐	🟡	⭐⭐⭐⭐	✅ Start here
Color sampling	⭐⭐⭐	🟡	⭐⭐⭐⭐⭐	✅ High value
Outdoor masking	⭐	🟢	⭐⭐⭐⭐	✅ Essential
Outlined textures (pre-rendered)	⭐⭐	🟢	⭐⭐⭐⭐⭐	✅ Recommended
Outlined textures (shader)	⭐⭐⭐⭐	🔴	⭐⭐⭐⭐⭐	⚠️ Avoid initially
Texture mask workflow	⭐⭐⭐	🟡	⭐⭐⭐⭐⭐	💡 Phase 2
🎬 Final Verdict
✅ GO FOR IT - This is a great feature addition
Why it's feasible:

80% of infrastructure already exists (particles, wind, masking)
Color sampling is implemented in TextureMaskShape
Wind gust system is perfect for this use case
Similar patterns exist (edge droplets, fire particles)
Performance impact is manageable (<2ms with 300 particles)
Recommended Path:

Start with Phase 1 using pre-rendered leaf textures with outlines
Use tile-based detection for spawn points (simpler than texture masks)
Implement color sampling with edge avoidance
Add outdoor masking to prevent indoor drift
Polish with variations (multiple leaf shapes, seasonal tints)
Total Time Investment: 15-20 hours for polished implementation
User Workflow Impact: Minimal (just tile metadata or naming convention)
Visual Payoff: ⭐⭐⭐⭐⭐ (extremely high - dynamic, weather-reactive foliage)

🚀 Getting Started - First Steps
Create 3 leaf textures with dark borders (assets/leaves/)
Write tile scanner to find bush/tree tiles
Implement wind threshold emitter (80% spawn trigger)
Add color sampling behavior with edge offset
Test with one bush before scaling up
This is NOT a minefield. It's a well-scoped feature that plays to Map Shine's strengths. The particle system and wind integration are robust enough to handle this gracefully. Go ahead! 🍂