import { PIXI, LINE_CAP, LINE_JOIN } from "../pixi-adapter.js";
import { MapPointsManager } from "../managers/map-points-adapter.js";
import { DebuggerUIBuilder } from "../ui/MainUI.js";

/**
 * Lightning layer that renders realistic animated lightning bolts between
 * Map Point groups designated as lightning effect sources. Features include:
 * - Procedurally generated jagged paths using recursive midpoint displacement
 * - Random branching for natural appearance
 * - Multi-layer glow effect (outer blue glow, middle bright glow, core white)
 * - Animated flickering and intensity variation
 */
export class LightningLayer extends foundry.canvas.layers.CanvasLayer {
  constructor() {
    super();
    this.graphics = null;
    this._destroyed = false;
    this._onMapPointsUpdatedBound = null;
    this._animationId = null;
    this._lastDrawTime = 0;
    this._activeBursts = new Map(); // Track active bursts per group ID
  }

  async _draw() {
    this._destroyed = false;
    this.eventMode = "none";

    // Create a single PIXI.Graphics object
    this.graphics = new PIXI.Graphics();
    this.addChild(this.graphics);

    // Listen for Map Points updates
    this._onMapPointsUpdatedBound = this._onMapPointsUpdated.bind(this);
    Hooks.on("mapShine:mapPointsUpdated", this._onMapPointsUpdatedBound);

    // Start animation loop for flickering
    this._startAnimation();

    // Initial draw
    this._drawLightning();
  }

  async _tearDown(options) {
    if (this._destroyed) return;
    this._destroyed = true;

    // Stop animation
    this._stopAnimation();

    // Unregister the map points listener
    if (this._onMapPointsUpdatedBound) {
      Hooks.off("mapShine:mapPointsUpdated", this._onMapPointsUpdatedBound);
      this._onMapPointsUpdatedBound = null;
    }

    // Destroy the graphics object
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }

    return super._tearDown(options);
  }

  /**
   * Starts the animation loop for flickering lightning.
   */
  _startAnimation() {
    if (this._animationId) return;

    // Initialize next flash time with random delay
    this._nextFlashTime = performance.now() + this._getRandomDelay();

    const animate = (time) => {
      if (this._destroyed) return;

      // Check if it's time for the next flash
      if (time >= this._nextFlashTime) {
        // Start new bursts for all lightning groups
        this._startBursts();
        // Schedule next flash with random delay
        this._nextFlashTime = time + this._getRandomDelay();
      }

      // Update and render all active bursts
      this._updateBursts(time);

      this._animationId = requestAnimationFrame(animate);
    };

    this._animationId = requestAnimationFrame(animate);
  }

  /**
   * Generates a random delay between lightning flashes.
   * @returns {number} Delay in milliseconds
   */
  _getRandomDelay() {
    const config = game.mapShine?.profileManager?.activeConfig?.lightning;
    const minDelay = config?.minDelay ?? 100;
    const maxDelay = config?.maxDelay ?? 500;
    return minDelay + Math.random() * (maxDelay - minDelay);
  }

  /**
   * Stops the animation loop.
   */
  _stopAnimation() {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId);
      this._animationId = null;
    }
  }

  /**
   * Called when Map Points are updated via the hook.
   */
  _onMapPointsUpdated() {
    // Clear active bursts when map points change
    this._activeBursts.clear();
    // Clear graphics
    if (this.graphics) {
      this.graphics.clear();
    }
  }

  /**
   * Starts new bursts for all lightning groups.
   */
  _startBursts() {
    const config = game.mapShine?.profileManager?.activeConfig?.lightning;
    if (!config || !config.enabled) return;

    const groups = MapPointsManager && typeof MapPointsManager.getGroups === 'function'
      ? MapPointsManager.getGroups()
      : {};
    if (!groups || Object.keys(groups).length === 0) return;

    for (const [groupId, group] of Object.entries(groups)) {
      // Only process line-type groups that are effect sources for lightning
      if (
        group.type === "line" &&
        group.isEffectSource &&
        group.effectTarget === "lightning" &&
        group.points &&
        group.points.length >= 2
      ) {
        // Random number of strikes in this burst
        const minStrikes = config?.burstMinStrikes ?? 1;
        const maxStrikes = config?.burstMaxStrikes ?? 5;
        const strikeCount = Math.floor(
          minStrikes + Math.random() * (maxStrikes - minStrikes + 1)
        );

        // Create burst data
        this._activeBursts.set(groupId, {
          group: group,
          strikeCount: strikeCount,
          currentStrike: 0,
          nextStrikeTime: performance.now(),
          strikeDuration: config?.burstStrikeDuration ?? 50,
          strikeDelay: config?.burstStrikeDelay ?? 80,
          strikes: [], // Will store strike data for each strike in the burst
        });
      }
    }
  }

  /**
   * Updates and renders all active bursts.
   */
  _updateBursts(time) {
    if (this._activeBursts.size === 0) {
      // No active bursts, clear the graphics
      if (this.graphics && !this._cleared) {
        this.graphics.clear();
        this._cleared = true;
      }
      return;
    }

    const config = game.mapShine?.profileManager?.activeConfig?.lightning;
    if (!config || !config.enabled) return;

    // Clear graphics for redraw
    if (this.graphics) {
      this.graphics.clear();
      this._cleared = false;
    }

    // Track bursts to remove
    const burstsToRemove = [];

    for (const [groupId, burst] of this._activeBursts.entries()) {
      // Check if we need to create a new strike
      if (
        burst.currentStrike < burst.strikeCount &&
        time >= burst.nextStrikeTime
      ) {
        // Generate new strike with random end point variation
        const firstPoint = burst.group.points[0];
        const lastPoint = burst.group.points[burst.group.points.length - 1];

        // Apply random variation to end point
        const endPointVariationX = config?.endPointVariationX ?? 50;
        const endPointVariationY = config?.endPointVariationY ?? 50;
        const variedEndPoint = {
          x: lastPoint.x + (Math.random() - 0.5) * 2 * endPointVariationX,
          y: lastPoint.y + (Math.random() - 0.5) * 2 * endPointVariationY,
        };

        // Generate lightning path with optional displacement
        const displacementEnabled = config?.displacement?.enabled ?? true;
        const displacementMagnitude = displacementEnabled
          ? config?.displacement?.magnitude ?? 50
          : 0;

        const mainPath = this._generateLightningPath(
          firstPoint,
          variedEndPoint,
          displacementMagnitude,
          0.3 + Math.random() * 0.15
        );

        // Generate branches with optional fine displacement
        const branches = this._generateBranches(
          mainPath,
          0.12,
          1,
          5,
          0,
          2,
          config
        );

        // Random intensity
        const intensity = 0.7 + Math.random() * 0.3;

        // Store strike data
        burst.strikes.push({
          mainPath: mainPath,
          branches: branches,
          intensity: intensity,
          startTime: time,
          endTime: time + burst.strikeDuration,
        });

        burst.currentStrike++;
        burst.nextStrikeTime = time + burst.strikeDuration + burst.strikeDelay;
      }

      // Draw all active strikes in this burst
      const activeStrikes = burst.strikes.filter(
        (strike) => time < strike.endTime
      );

      // Remove expired strikes
      burst.strikes = activeStrikes;

      // Draw active strikes
      for (const strike of activeStrikes) {
        // Check for flicker
        const flickerChance = config?.flickerChance ?? 0.15;
        if (Math.random() < flickerChance) {
          continue;
        }

        // Draw main bolt
        this._drawLightningBolt(
          strike.mainPath,
          5,
          strike.intensity,
          0,
          config
        );

        // Draw branches
        for (const branch of strike.branches) {
          this._drawLightningBolt(
            branch.path,
            branch.width,
            strike.intensity * 0.8,
            branch.depth,
            config
          );
        }
      }

      // Check if burst is complete
      if (
        burst.currentStrike >= burst.strikeCount &&
        burst.strikes.length === 0
      ) {
        burstsToRemove.push(groupId);
      }
    }

    // Remove completed bursts
    for (const groupId of burstsToRemove) {
      this._activeBursts.delete(groupId);
    }
  }

  /**
   * Generates a curved bezier path between two points for natural flow.
   * @param {Object} start - Starting point {x, y}
   * @param {Object} end - Ending point {x, y}
   * @param {number} curveAmount - Amount of curve variation (0-1)
   * @param {number} segments - Number of segments to sample along the bezier
   * @returns {Array<{x: number, y: number}>} Array of points forming the curved path
   */
  _generateBezierPath(start, end, curveAmount = 0.3, segments = 8) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular vector (normalized)
    const perpX = -dy / length;
    const perpY = dx / length;

    // Create two control points with random offsets perpendicular to the line
    // This creates a natural S-curve or dramatic arc
    // Add extra randomization for more varied curves
    const offset1 =
      (Math.random() - 0.5) *
      length *
      curveAmount *
      (1.0 + Math.random() * 0.5);
    const offset2 =
      (Math.random() - 0.5) *
      length *
      curveAmount *
      (1.0 + Math.random() * 0.5);

    const control1 = {
      x: start.x + dx * 0.33 + perpX * offset1,
      y: start.y + dy * 0.33 + perpY * offset1,
    };

    const control2 = {
      x: start.x + dx * 0.67 + perpX * offset2,
      y: start.y + dy * 0.67 + perpY * offset2,
    };

    // Sample points along the cubic bezier curve
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;

      // Cubic bezier formula: P = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
      const x =
        mt3 * start.x +
        3 * mt2 * t * control1.x +
        3 * mt * t2 * control2.x +
        t3 * end.x;
      const y =
        mt3 * start.y +
        3 * mt2 * t * control1.y +
        3 * mt * t2 * control2.y +
        t3 * end.y;

      points.push({ x, y });
    }

    return points;
  }

  /**
   * Generates a jagged lightning path with curvature between two points.
   * @param {Object} start - Starting point {x, y}
   * @param {Object} end - Ending point {x, y}
   * @param {number} displacement - Maximum perpendicular offset for jaggedness
   * @param {number} curveAmount - Amount of bezier curvature (0-1)
   * @returns {Array<{x: number, y: number}>} Array of points forming the lightning bolt
   */
  _generateLightningPath(start, end, displacement = 30, curveAmount = 0.3) {
    // First, generate a curved path using bezier (fewer segments for better jaggedness)
    const curvePath = this._generateBezierPath(start, end, curveAmount, 6);

    // Then apply jaggedness to the curved path
    const points = [curvePath[0]];

    const generateSegment = (p1, p2, disp) => {
      // Base case: displacement too small, just connect directly
      if (disp < 2) {
        return [p2];
      }

      // Calculate midpoint
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      // Calculate perpendicular offset
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < 10) {
        return [p2];
      }

      // Perpendicular vector (normalized)
      const perpX = -dy / length;
      const perpY = dx / length;

      // Random offset along perpendicular
      const offset = (Math.random() - 0.5) * disp;
      const mid = {
        x: midX + perpX * offset,
        y: midY + perpY * offset,
      };

      // Recursively subdivide
      const newDisp = disp * 0.5;
      const leftSegment = generateSegment(p1, mid, newDisp);
      const rightSegment = generateSegment(mid, p2, newDisp);

      return [...leftSegment, ...rightSegment];
    };

    // Apply jaggedness to each segment of the curved path
    for (let i = 0; i < curvePath.length - 1; i++) {
      const segmentPath = generateSegment(
        curvePath[i],
        curvePath[i + 1],
        displacement
      ); // Full displacement for sharp jaggedness
      points.push(...segmentPath);
    }

    return points;
  }

  /**
   * Generates branch paths from a main lightning bolt.
   * @param {Array<{x: number, y: number}>} mainPath - Main lightning path
   * @param {number} branchProbability - Probability of branch at each segment (0-1)
   * @param {number} startIndex - Index along path to start branching (for recursive branches)
   * @param {number} parentWidth - Width of parent bolt at this point (for width inheritance)
   * @param {number} currentDepth - Current recursion depth (for limiting recursion)
   * @param {number} maxDepth - Maximum recursion depth allowed
   * @param {Object} config - Lightning configuration object
   * @returns {Array<{path: Array<{x: number, y: number}>, depth: number, positionRatio: number}>} Array of branch objects
   */
  _generateBranches(
    mainPath,
    branchProbability = 0.3,
    startIndex = 1,
    parentWidth = 5,
    currentDepth = 0,
    maxDepth = 3,
    config = null
  ) {
    const branches = [];

    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
      return branches;
    }

    // Skip the last few points to avoid branches at the end
    const endIndex = Math.max(startIndex + 1, mainPath.length - 3);

    for (let i = startIndex; i < endIndex; i++) {
      if (Math.random() < branchProbability) {
        const branchStart = mainPath[i];
        const mainDir = {
          x: mainPath[i + 1].x - mainPath[i - 1].x,
          y: mainPath[i + 1].y - mainPath[i - 1].y,
        };

        // Normalize main direction
        const mainLength = Math.sqrt(
          mainDir.x * mainDir.x + mainDir.y * mainDir.y
        );
        if (mainLength < 0.1) continue; // Skip if main direction is too small

        const normalizedDir = {
          x: mainDir.x / mainLength,
          y: mainDir.y / mainLength,
        };

        // Calculate position along the main path (0 = start, 1 = end)
        const positionRatio = (i - startIndex) / (endIndex - startIndex);

        // Calculate inherited width from parent bolt at this position
        // Uses same taper formula as _drawLightningBolt
        const taper = Math.pow(1 - positionRatio, 2.5);
        const inheritedWidth = parentWidth * (0.05 + 0.95 * taper);

        // Branch length increases (longer branches overall)
        // Early branches are much longer than end branches
        const lengthScale = 1.0 - positionRatio * 0.6; // 100% at start, 40% at end
        const branchLength = (120 + Math.random() * 180) * lengthScale; // Increased base length

        // Random branch direction with forward lean
        // Base angle: perpendicular to main direction
        // Forward bias: shift angle toward forward direction
        const side = Math.random() > 0.5 ? 1 : -1; // Left or right of main bolt
        const baseAngle = side * Math.PI * 0.5; // 90° or -90° (perpendicular)
        const forwardBias = side * Math.PI * 0.25; // 45° forward lean (applied relative to side)
        const randomVariation = (Math.random() - 0.5) * Math.PI * 0.3; // ±27° variation
        const angle = baseAngle + forwardBias + randomVariation;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const branchEnd = {
          x:
            branchStart.x +
            (normalizedDir.x * cos - normalizedDir.y * sin) * branchLength,
          y:
            branchStart.y +
            (normalizedDir.x * sin + normalizedDir.y * cos) * branchLength,
        };

        // Use fine displacement for branches if enabled
        const fineDisplacementEnabled =
          config?.displacementFine?.enabled ?? true;
        const fineDisplacementMagnitude = fineDisplacementEnabled
          ? (config?.displacementFine?.magnitude ?? 20) + positionRatio * 15
          : 0;

        const branchPath = this._generateLightningPath(
          branchStart,
          branchEnd,
          fineDisplacementMagnitude,
          0.3 + Math.random() * 0.2 // Moderate curve for branches (0.3-0.5 range)
        );

        branches.push({
          path: branchPath,
          depth: currentDepth + 1,
          positionRatio: positionRatio,
          width: inheritedWidth, // Store inherited width
        });

        // Add sub-branches (branches from branches)
        // Much more likely on early branches (near origin)
        // Inverse of position: 1.0 at start, 0.0 at end
        const subBranchProbability = 0.5 * (1.0 - positionRatio); // 50% at start, 0% at end (reduced from 80%)

        if (
          Math.random() < subBranchProbability &&
          branchPath.length > 5 &&
          currentDepth < maxDepth - 1
        ) {
          // Start sub-branching earlier along the branch
          const subBranches = this._generateBranches(
            branchPath,
            0.2, // Reduced probability for sub-branches (from 0.25)
            Math.floor(branchPath.length * 0.2), // Start earlier (20% instead of 30%)
            inheritedWidth, // Pass inherited width to sub-branches
            currentDepth + 1, // Increment depth
            maxDepth, // Pass max depth limit
            config // Pass config to sub-branches
          );
          branches.push(
            ...subBranches.map((sb) => ({
              path: sb.path,
              depth: sb.depth,
              positionRatio: sb.positionRatio,
              width: sb.width,
            }))
          );
        }
      }
    }

    return branches;
  }

  /**
   * Draws a lightning path with glow effect and tapering.
   * Uses optimized rendering with continuous paths instead of individual segments.
   * @param {Array<{x: number, y: number}>} path - Array of points
   * @param {number} baseWidth - Base width of the bolt at start
   * @param {number} alpha - Opacity
   * @param {number} branchDepth - Branch depth (0 = main bolt, 1+ = branches)
   */
  _drawLightningBolt(
    path,
    baseWidth = 4,
    alpha = 1.0,
    branchDepth = 0,
    config = null
  ) {
    if (path.length < 2) return;

    // Reduce width for branches based on depth
    const depthScale = Math.pow(0.6, branchDepth);
    const startWidth = baseWidth * depthScale;

    // Keep full path detail for jagged lightning appearance
    const renderPath = path;

    // Three layers: outer glow, middle glow, core
    const layers = [
      { widthMult: 3, color: 0x88ccff, alpha: alpha * 0.3 },
      { widthMult: 1.5, color: 0xffffff, alpha: alpha * 0.6 },
      { widthMult: 1, color: 0xffffff, alpha: alpha },
    ];

    // Check if width variation is enabled
    const widthVariationEnabled = config?.widthVariation?.enabled ?? true;

    // Draw each layer with proper tapering
    for (const layer of layers) {
      // For branches, use aggressive taper to reach near-invisible by 90%
      // For main bolt, use moderate taper
      const taperExponent = branchDepth > 0 ? 4.0 : 2.5;
      const minWidthRatio = branchDepth > 0 ? 0.001 : 0.05; // Nearly invisible for branches

      // Draw segments with individual tapering for sharp end
      for (let i = 0; i < renderPath.length - 1; i++) {
        const t = i / (renderPath.length - 1);
        // Apply taper only if width variation is enabled
        const taper = widthVariationEnabled
          ? Math.pow(1 - t, taperExponent)
          : 1.0;
        const segmentWidth =
          startWidth *
          layer.widthMult *
          (minWidthRatio + (1 - minWidthRatio) * taper);

        // Skip drawing segments that are too thin (optimization)
        if (segmentWidth < 0.1) continue;

        this.graphics.lineStyle({
          width: segmentWidth,
          color: layer.color,
          alpha: layer.alpha,
          cap: LINE_CAP.ROUND,
          join: LINE_JOIN.ROUND,
        });

        this.graphics.moveTo(renderPath[i].x, renderPath[i].y);
        this.graphics.lineTo(renderPath[i + 1].x, renderPath[i + 1].y);
      }
    }
  }

  /**
   * Draws realistic lightning bolts for all Map Point groups designated as lightning sources.
   * @deprecated This method is now handled by the burst system in _updateBursts
   */
  _drawLightning() {
    // Legacy method - functionality moved to burst system
    // Kept for backward compatibility if needed
  }

  /**
   * Returns the settings HTML for the debugger UI.
   * @returns {string} HTML string for the lightning settings accordion.
   */
  static getSettingsHTML() {
    const effectKey = "lightning";
    const content = `
            <p class="description-text">Realistic animated lightning bolts with jagged paths, branching, glowing effects, and flickering. Create line-type Map Point groups and set them as lightning effect sources to define where bolts should appear.</p>
            ${DebuggerUIBuilder._createCheckboxHTML(
              "lightning.enabled",
              "Enable Lightning"
            )}
            <details id="details-lightning-timing">
                <summary><span class="accordion-toggle"></span><strong>Timing Controls</strong></summary>
                <div style="padding-left: 5px;">
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.minDelay",
                      "Min Delay Between Bursts (ms)",
                      50,
                      2000,
                      50,
                      100
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.maxDelay",
                      "Max Delay Between Bursts (ms)",
                      100,
                      5000,
                      50,
                      500
                    )}
                </div>
            </details>
            <details id="details-lightning-burst">
                <summary><span class="accordion-toggle"></span><strong>Burst Controls</strong></summary>
                <div style="padding-left: 5px;">
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.burstMinStrikes",
                      "Min Strikes Per Burst",
                      1,
                      10,
                      1,
                      1
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.burstMaxStrikes",
                      "Max Strikes Per Burst",
                      1,
                      10,
                      1,
                      5
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.burstStrikeDuration",
                      "Strike Duration (ms)",
                      10,
                      200,
                      10,
                      50
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.burstStrikeDelay",
                      "Delay Between Strikes (ms)",
                      10,
                      300,
                      10,
                      80
                    )}
                </div>
            </details>
            <details id="details-lightning-variation">
                <summary><span class="accordion-toggle"></span><strong>Variation Controls</strong></summary>
                <div style="padding-left: 5px;">
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.endPointVariationX",
                      "End Point X Variation (px)",
                      0,
                      200,
                      5,
                      50
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.endPointVariationY",
                      "End Point Y Variation (px)",
                      0,
                      200,
                      5,
                      50
                    )}
                    ${DebuggerUIBuilder._createSliderHTML(
                      "lightning.flickerChance",
                      "Flicker Chance",
                      0,
                      1,
                      0.05,
                      0.15
                    )}
                </div>
            </details>
            
            ${DebuggerUIBuilder._createEffectPointGroupsHTML("lightning", {
              effectName: "Lightning",
              defaultGroupType: "line",
              description:
                "Create lightning bolt paths. Draw lines where lightning bolts should appear.",
            })}
          `;

    return DebuggerUIBuilder._createAccordionHTML(
      effectKey,
      "Lightning",
      content
    );
  }
}
