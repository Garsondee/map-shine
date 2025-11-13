import { PIXI, WRAP_MODES } from "../pixi-adapter.js";
import { TextureLoader } from "../utils/TextureLoader.js";
import { MapPointsManager } from "../managers/map-points-adapter.js";

/**
 * Represents a single physics rope with Verlet integration
 */
class PhysicsRope {
  constructor(points, config, texture, isIndoors = false) {
    this.config = foundry.utils.mergeObject(
      {
        segmentLength: 10,
        animationSpeed: 1,
        damping: 0.95, // Increased damping for quicker return to rest (was 0.99)
        windForce: 2.0, // Strong wind influence (was 1.0)
        springConstant: 0.8, // Restoring force strength - pulls rope back to straight line
        tapering: 0.5, // 0 = no taper, 1 = max taper (70% reduction at center) - creates visual sag
        texturePath: "modules/map-shine/assets/rope.webp",
        ropeEndTexturePath: null, // Optional texture for rope end decorations
        ropeEndScale: 1.0, // Scale multiplier for rope end sprites
        ropeEndStiffness: 0.3, // 0 = flexible ends, 1 = rigid ends - prevents crushing at anchor points
        indoorWindShielding: 0.9, // Default 90% wind reduction indoors
        endpointFade: 0.0, // 0 = no fade, 1 = maximum fade at endpoints to hide seams
        fadeStartDistance: 0.2, // Distance from start (0-1) where fade begins
        fadeEndDistance: 0.2, // Distance from end (0-1) where fade begins
      },
      config
    );
    this.isIndoors = isIndoors;

    // this.points are the simulation points (centerline)
    this.points = this._subdividePoints(points, this.config.segmentLength);

    // Calculate actual segment lengths based on initial positions
    this.segmentLengths = [];
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      this.segmentLengths.push(Math.sqrt(dx * dx + dy * dy));
    }

    // Lock the first and last points as anchors
    if (this.points.length > 0) {
      this.points[0].locked = true;
    }
    if (this.points.length > 1) {
      this.points[this.points.length - 1].locked = true;
    }

    // Store rest positions (straight line between anchors) for restoring force
    this._calculateRestPositions();

    this.time = 0;

    // Create PIXI.Point array for the mesh (centerline)
    this.meshPoints = this.points.map((p) => new PIXI.Point(p.x, p.y));

    // Create the visible PIXI object that will be rendered
    this.mesh = new PIXI.SimpleRope(texture, this.meshPoints);

    // Disable automatic geometry updates so we can manually control vertices for tapering.
    this.mesh.autoUpdate = false;

    // Store texture dimensions for tiling calculations
    this.textureWidth = texture.width;
    this.textureHeight = texture.height;

    // Create a container to hold the rope and its mask
    this.container = new PIXI.Container();
    this.container.addChild(this.mesh);

    // Initialize fade mask (will be created when fade is enabled)
    this.fadeMask = null;
    this.fadeMaskGraphics = null;

    // Initialize rope end sprites (will be created if texture is provided)
    this.startEndSprite = null;
    this.endEndSprite = null;
    this.ropeEndTexture = null;
  }

  /**
   * Subdivides a path of anchor points into rope segments
   * @param {Array} anchorPoints - Array of {x, y} points defining the rope path
   * @param {number} segmentLength - Target length of each segment
   * @returns {Array} Array of simulation points with physics properties
   */
  _subdividePoints(anchorPoints, segmentLength) {
    if (anchorPoints.length < 2) return [];

    const subdivided = [];

    // Process each segment between consecutive anchor points
    for (let i = 0; i < anchorPoints.length - 1; i++) {
      const start = anchorPoints[i];
      const end = anchorPoints[i + 1];

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate number of segments needed
      const numSegments = Math.max(1, Math.ceil(distance / segmentLength));

      // Add subdivided points along this segment
      for (let j = 0; j < numSegments; j++) {
        const t = j / numSegments;
        const x = start.x + dx * t;
        const y = start.y + dy * t;

        subdivided.push({
          x: x,
          y: y,
          prevX: x,
          prevY: y,
          locked: false,
        });
      }
    }

    // Add the final anchor point
    const lastAnchor = anchorPoints[anchorPoints.length - 1];
    subdivided.push({
      x: lastAnchor.x,
      y: lastAnchor.y,
      prevX: lastAnchor.x,
      prevY: lastAnchor.y,
      locked: false,
    });

    // NOTE: No initial sag is added to simulation points
    // Gravity affects only visual appearance through tapering, not physics simulation

    return subdivided;
  }

  /**
   * Calculate rest positions for each point (straight line between anchors)
   * Used for restoring force to pull rope back to natural hanging position
   */
  _calculateRestPositions() {
    if (this.points.length < 2) return;

    const start = this.points[0];
    const end = this.points[this.points.length - 1];

    this.restPositions = [];
    for (let i = 0; i < this.points.length; i++) {
      const t = i / (this.points.length - 1);
      this.restPositions.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
      });
    }
  }

  update(deltaTime) {
    const timeFactor = game.mapShine.timeControl.timeFactor ?? 1.0;
    const adjustedDeltaTime = deltaTime * timeFactor;

    this.time += adjustedDeltaTime * this.config.animationSpeed;

    // Verlet integration
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (point.locked) continue;

      // Store current position
      const vx = point.x - point.prevX;
      const vy = point.y - point.prevY;

      // Update previous position
      point.prevX = point.x;
      point.prevY = point.y;

      // Apply velocity and forces
      let windForceX = 0;
      let windForceY = 0;

      // Use global WindManager for all wind simulation
      if (game.mapShine?.windManager) {
        const windManager = game.mapShine.windManager;
        const windConfig =
          game.mapShine.profileManager.activeConfig.fire.particles.wind;

        // Only apply wind if it's enabled in global settings
        if (windConfig.enabled) {
          const windAngleRad = windManager.angle * (Math.PI / 180);
          const windSpeed = windManager.speed;

          // Use global wind force setting
          const baseForce = windSpeed * windConfig.force * 0.1;
          const baseWindX = Math.cos(windAngleRad) * baseForce;
          const baseWindY = Math.sin(windAngleRad) * baseForce;

          // Add variation along rope length using global baseSpeed
          const lengthPhase = i * 0.5;
          const timePhase = this.time * (windConfig.baseSpeed * 0.05);
          const variation = Math.sin(timePhase + lengthPhase) * 0.2;

          const perpX = -Math.sin(windAngleRad) * variation * baseForce;
          const perpY = Math.cos(windAngleRad) * variation * baseForce;

          // Calculate distance from nearest anchor (0 at anchors, 1 at center)
          // This creates a "sail effect" where middle sections catch more wind
          const normalizedPos = i / (this.points.length - 1);
          const distanceFromAnchor = Math.sin(normalizedPos * Math.PI); // 0 at ends, 1 at center
          const positionMultiplier = 0.3 + 0.7 * distanceFromAnchor; // 30% at ends, 100% at center

          // Apply indoor wind shielding if rope is marked as indoors
          const indoorMultiplier = this.isIndoors
            ? 1.0 - this.config.indoorWindShielding
            : 1.0;
          // Apply rope-specific wind force multiplier and position-based multiplier
          const totalWindMultiplier =
            indoorMultiplier *
            (this.config.windForce ?? 1.0) *
            positionMultiplier;
          windForceX = (baseWindX + perpX) * totalWindMultiplier;
          windForceY = (baseWindY + perpY) * totalWindMultiplier;
        }
      }

      const dampedVx = vx * this.config.damping;
      const dampedVy = vy * this.config.damping;

      // Apply restoring force to pull rope back toward rest position (straight line)
      // This creates the "bounce back" behavior after wind displacement
      let restoringForceX = 0;
      let restoringForceY = 0;

      if (this.restPositions && this.restPositions[i]) {
        const restPos = this.restPositions[i];
        const displacementX = restPos.x - point.x;
        const displacementY = restPos.y - point.y;

        // Spring constant - how strongly the rope wants to return to rest
        // Higher values = stiffer rope, lower values = more elastic/bouncy
        const springConstant = this.config.springConstant ?? 0.15;

        restoringForceX = displacementX * springConstant;
        restoringForceY = displacementY * springConstant;
      }

      // NOTE: Gravity is NOT applied to simulation points - it only affects visual tapering
      // The rope maintains its path, and gravity creates visual sag through vertex manipulation

      point.x +=
        dampedVx +
        windForceX * adjustedDeltaTime +
        restoringForceX * adjustedDeltaTime;
      point.y +=
        dampedVy +
        windForceY * adjustedDeltaTime +
        restoringForceY * adjustedDeltaTime;
    }

    // Constraint resolution (maintain segment lengths for rope integrity)
    // More iterations and stronger correction for minimal stretch
    const iterations = 8; // Increased from 5 for tighter constraints
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Avoid division by zero
        if (dist < 0.001) continue;

        const targetLength = this.segmentLengths[i];
        const diff = targetLength - dist;

        // Calculate distance from nearest end (0 at ends, 1 at center)
        const normalizedPos = i / (this.points.length - 2); // Normalize to segment count
        const distFromStart = normalizedPos;
        const distFromEnd = 1.0 - normalizedPos;
        const distFromNearestEnd = Math.min(distFromStart, distFromEnd);

        // Apply end stiffness - segments near ends get much stronger correction
        // This prevents crushing/bunching at anchor points
        const endStiffness = this.config.ropeEndStiffness ?? 0.3;
        const stiffnessFactor =
          1.0 + endStiffness * (1.0 - Math.min(1.0, distFromNearestEnd * 3.0));

        // Stronger correction for both compression and stretching to minimize stretch
        // Allows only minimal realistic stretch (< 2% of segment length)
        const compressionMultiplier = diff > 0 ? 1.0 : 0.9; // Strong correction for both
        const correctionStrength =
          0.7 * compressionMultiplier * stiffnessFactor; // Apply stiffness multiplier

        const offsetX = (dx / dist) * diff * correctionStrength;
        const offsetY = (dy / dist) * diff * correctionStrength;

        if (!p1.locked) {
          p1.x -= offsetX;
          p1.y -= offsetY;
        }
        if (!p2.locked) {
          p2.x += offsetX;
          p2.y += offsetY;
        }
      }
    }

    // --- START: Tapering Logic ---

    // 1. Update mesh points for reference (not strictly necessary but kept for consistency)
    for (let i = 0; i < this.points.length; i++) {
      if (this.meshPoints[i]) {
        this.meshPoints[i].x = this.points[i].x;
        this.meshPoints[i].y = this.points[i].y;
      }
    }

    // 2. Manually calculate and set vertices directly (don't call updateVertices - it resets to full width)
    const geometry = this.mesh.geometry;
    if (
      geometry &&
      geometry.buffers &&
      geometry.buffers[0] &&
      this.mesh.texture.valid
    ) {
      const vertices = geometry.buffers[0].data;

      // Correctly get the base width from the texture height.
      const baseWidth = this.mesh.texture.height * 0.5;

      // Calculate cumulative distance along the rope for UV tiling
      let cumulativeDistance = 0;
      const distances = [0]; // Start at 0 for first point

      for (let i = 0; i < this.points.length - 1; i++) {
        const p1 = this.points[i];
        const p2 = this.points[i + 1];
        const segmentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        cumulativeDistance += segmentDist;
        distances.push(cumulativeDistance);
      }

      // Get UV buffer (second buffer in SimpleRope geometry)
      const uvBuffer = geometry.buffers[1];
      const uvs = uvBuffer ? uvBuffer.data : null;

      for (let i = 0; i < this.points.length; i++) {
        const simPoint = this.points[i];

        // Calculate taper factor using static tapering config
        const normalizedPos = i / (this.points.length - 1);
        const sagAmount = Math.sin(normalizedPos * Math.PI); // 0 at ends, 1 at center
        const taperStrength = this.config.tapering * 0.7; // Taper up to 70% at full strength
        const taperFactor = 1.0 - sagAmount * taperStrength;

        const adjustedHalfWidth = baseWidth * taperFactor;

        // Calculate perpendicular direction for the current segment.
        let perpX = 0;
        let perpY = 1; // Default to vertical if calculation fails
        if (i < this.points.length - 1) {
          const nextSimPoint = this.points[i + 1];
          const dx = nextSimPoint.x - simPoint.x;
          const dy = nextSimPoint.y - simPoint.y;
          const len = Math.hypot(dx, dy);
          if (len > 0) {
            perpX = -dy / len;
            perpY = dx / len;
          }
        } else if (i > 0) {
          // For the last point, use the previous segment's direction
          const prevSimPoint = this.points[i - 1];
          const dx = simPoint.x - prevSimPoint.x;
          const dy = simPoint.y - prevSimPoint.y;
          const len = Math.hypot(dx, dy);
          if (len > 0) {
            perpX = -dy / len;
            perpY = dx / len;
          }
        }

        const centerX = simPoint.x;
        const centerY = simPoint.y;

        const bufferIndex = i * 4;

        if (bufferIndex + 3 < vertices.length) {
          // Set the top vertex position
          vertices[bufferIndex] = centerX + perpX * adjustedHalfWidth;
          vertices[bufferIndex + 1] = centerY + perpY * adjustedHalfWidth;
          // Set the bottom vertex position
          vertices[bufferIndex + 2] = centerX - perpX * adjustedHalfWidth;
          vertices[bufferIndex + 3] = centerY - perpY * adjustedHalfWidth;
        }

        // Update UV coordinates for tiling
        if (uvs && this.textureWidth > 0) {
          const uvIndex = i * 4;
          // Calculate U coordinate based on distance along rope (for tiling)
          const u = distances[i] / this.textureWidth;

          if (uvIndex + 3 < uvs.length) {
            // Top vertex UV
            uvs[uvIndex] = u;
            uvs[uvIndex + 1] = 0;
            // Bottom vertex UV
            uvs[uvIndex + 2] = u;
            uvs[uvIndex + 3] = 1;
          }
        }
      }

      // 3. Tell the buffers to upload the modified data to the GPU.
      geometry.buffers[0].update();
      if (uvBuffer) {
        uvBuffer.update();
      }
    }

    // 4. Update fade mask if endpoint fade is enabled
    this._updateFadeMask();

    // 5. Update rope end sprites if they exist
    this._updateRopeEnds();

    // 6. Apply scene darkness tint to the rope
    this._applyDarknessTint();
  }

  /**
   * Applies scene darkness as a tint to the rope mesh
   */
  _applyDarknessTint() {
    // Get scene darkness level (0.0 is bright, 1.0 is pitch black)
    const darkness = canvas.scene?.environment?.darknessLevel ?? 0;

    // Calculate brightness multiplier (1.0 at no darkness, darker as darkness increases)
    // Using 0.75 multiplier like other effects in the codebase to prevent complete blackout
    const brightness = 1.0 - darkness * 0.75;

    // Convert brightness to RGB tint (grayscale darkening)
    const tintValue = Math.floor(brightness * 255);
    const tint = (tintValue << 16) | (tintValue << 8) | tintValue;

    // Apply tint to the mesh
    if (this.mesh) {
      this.mesh.tint = tint;
    }
  }

  /**
   * Updates or creates the fade mask for endpoint fading
   */
  _updateFadeMask() {
    if (this.config.endpointFade <= 0) {
      // Remove mask if fade is disabled
      if (this.fadeMask) {
        this.mesh.mask = null;
        if (this.fadeMaskGraphics) {
          this.fadeMaskGraphics.destroy();
          this.fadeMaskGraphics = null;
        }
        this.fadeMask = null;
      }
      return;
    }

    // Create mask graphics if it doesn't exist
    if (!this.fadeMaskGraphics) {
      this.fadeMaskGraphics = new PIXI.Graphics();
      this.container.addChild(this.fadeMaskGraphics);
      this.mesh.mask = this.fadeMaskGraphics;
    }

    // Clear and redraw the mask
    this.fadeMaskGraphics.clear();

    if (this.points.length < 2) return;

    const fadeStartDist = Math.max(
      0.01,
      Math.min(0.5, this.config.fadeStartDistance ?? 0.2)
    );
    const fadeEndDist = Math.max(
      0.01,
      Math.min(0.5, this.config.fadeEndDistance ?? 0.2)
    );
    const fadeStrength = this.config.endpointFade;
    const baseWidth = this.mesh.texture.valid
      ? this.mesh.texture.height * 0.5
      : 10;

    // Draw gradient mask along the rope
    for (let i = 0; i < this.points.length - 1; i++) {
      const normalizedPos = i / (this.points.length - 1);
      let alpha = 1.0;

      // Fade from start
      if (normalizedPos < fadeStartDist) {
        const startFade = normalizedPos / fadeStartDist;
        alpha = Math.min(alpha, 1.0 - fadeStrength + fadeStrength * startFade);
      }

      // Fade from end
      if (normalizedPos > 1.0 - fadeEndDist) {
        const endFade = (1.0 - normalizedPos) / fadeEndDist;
        alpha = Math.min(alpha, 1.0 - fadeStrength + fadeStrength * endFade);
      }

      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      // Calculate perpendicular for width
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;

      const perpX = -dy / len;
      const perpY = dx / len;
      const width = baseWidth * 2; // Full width for mask

      // Draw a rectangle segment with the calculated alpha
      this.fadeMaskGraphics.beginFill(0xffffff, alpha);
      this.fadeMaskGraphics.drawPolygon([
        p1.x + perpX * width,
        p1.y + perpY * width,
        p1.x - perpX * width,
        p1.y - perpY * width,
        p2.x - perpX * width,
        p2.y - perpY * width,
        p2.x + perpX * width,
        p2.y + perpY * width,
      ]);
      this.fadeMaskGraphics.endFill();
    }
  }

  /**
   * Creates or updates rope end sprites at anchor points
   * @param {PIXI.Texture} texture - The texture to use for rope ends
   */
  async _createRopeEnds(texture) {
    if (!texture) return;

    this.ropeEndTexture = texture;

    // Create start end sprite
    if (!this.startEndSprite) {
      this.startEndSprite = new PIXI.Sprite(texture);
      this.startEndSprite.anchor.set(0.5, 0.5);
      this.startEndSprite.scale.set(this.config.ropeEndScale);
      this.container.addChild(this.startEndSprite);
    }

    // Create end end sprite
    if (!this.endEndSprite) {
      this.endEndSprite = new PIXI.Sprite(texture);
      this.endEndSprite.anchor.set(0.5, 0.5);
      this.endEndSprite.scale.set(this.config.ropeEndScale);
      this.container.addChild(this.endEndSprite);
    }

    // Initial positioning and rotation
    this._updateRopeEnds();
  }

  /**
   * Updates rope end sprite positions and rotations based on rope physics
   */
  _updateRopeEnds() {
    if (!this.startEndSprite || !this.endEndSprite || this.points.length < 2)
      return;

    // Update start end sprite
    const startPoint = this.points[0];
    const startNextPoint = this.points[1];
    this.startEndSprite.position.set(startPoint.x, startPoint.y);

    // Calculate rotation to face along the rope from start
    const startDx = startNextPoint.x - startPoint.x;
    const startDy = startNextPoint.y - startPoint.y;
    this.startEndSprite.rotation = Math.atan2(startDy, startDx);

    // Update end end sprite
    const endPoint = this.points[this.points.length - 1];
    const endPrevPoint = this.points[this.points.length - 2];
    this.endEndSprite.position.set(endPoint.x, endPoint.y);

    // Calculate rotation to face along the rope from end (pointing back toward rope)
    const endDx = endPoint.x - endPrevPoint.x;
    const endDy = endPoint.y - endPrevPoint.y;
    this.endEndSprite.rotation = Math.atan2(endDy, endDx);
  }

  destroy() {
    if (this.fadeMaskGraphics) {
      this.fadeMaskGraphics.destroy();
    }
    if (this.startEndSprite) {
      this.startEndSprite.destroy();
      this.startEndSprite = null;
    }
    if (this.endEndSprite) {
      this.endEndSprite.destroy();
      this.endEndSprite = null;
    }
    if (this.container) {
      this.container.destroy({ children: true });
    }
  }
}

/**
 * Canvas layer that renders physics-based ropes
 */
export class PhysicsRopeLayer extends foundry.canvas.layers.CanvasLayer {
  constructor() {
    super();
    this.ropes = [];
    this.ropeContainer = null; // Container for PIXI.SimpleRope objects
    this._onAnimateBound = this._onAnimate.bind(this);
    this._boundRefresh = null;
  }

  async _draw(_options) {
    this.ropeContainer = this.addChild(new PIXI.Container());

    // Initialize ropes from map point groups
    await this._initializeRopes();

    // Start animation updates via the app ticker
    canvas.app.ticker.add(this._onAnimateBound);

    // Listen for map points updates to refresh ropes
    this._boundRefresh = this.refresh.bind(this);
    Hooks.on("mapShine:mapPointsUpdated", this._boundRefresh);
  }

  async _initializeRopes() {
    // Clean up any existing ropes and container children
    if (this.ropes.length > 0) {
      for (const rope of this.ropes) rope.destroy();
      this.ropes = [];
    }

    if (!this.ropeContainer) {
      this.ropeContainer = this.addChild(new PIXI.Container());
    } else {
      this.ropeContainer.removeChildren().forEach((c) => c.destroy());
    }

    const groups = MapPointsManager && typeof MapPointsManager.getGroups === 'function'
      ? MapPointsManager.getGroups()
      : {};
    if (!groups || Object.keys(groups).length === 0) {
      // No map points available yet; nothing to initialize
      return;
    }

    for (const group of Object.values(groups)) {
      if (group.type === "rope" && group.points.length >= 2) {
        try {
          const path =
            group.texturePath || "modules/map-shine/assets/rope.webp";
          const texture = await TextureLoader.loadTexture(path);
          texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;

          const ropeConfig = {
            segmentLength: group.segmentLength,
            animationSpeed: group.animationSpeed,
            damping: group.damping,
            windForce: group.windForce ?? 1.0,
            springConstant: group.springConstant ?? 0.8,
            tapering: group.tapering,
            ropeEndTexturePath: group.ropeEndTexturePath ?? null,
            ropeEndScale: group.ropeEndScale ?? 1.0,
            indoorWindShielding:
              group.indoorWindShielding ??
              game.mapShine.profileManager.activeConfig.physicsRope
                .indoorWindShielding,
            endpointFade: group.endpointFade ?? 0.0,
            fadeStartDistance: group.fadeStartDistance ?? 0.2,
            fadeEndDistance: group.fadeEndDistance ?? 0.2,
          };

          // Migrate old rope groups that don't have the new fade properties
          if (
            group.endpointFade === undefined ||
            group.fadeStartDistance === undefined ||
            group.fadeEndDistance === undefined
          ) {
            const updateProps = {};
            if (group.endpointFade === undefined)
              updateProps.endpointFade = 0.0;
            if (group.fadeStartDistance === undefined)
              updateProps.fadeStartDistance = 0.2;
            if (group.fadeEndDistance === undefined)
              updateProps.fadeEndDistance = 0.2;
            await MapPointsManager.updateGroupProperties(group.id, updateProps);
          }

          const rope = new PhysicsRope(
            group.points,
            ropeConfig,
            texture,
            group.isIndoors ?? false
          );
          rope.id = group.id; // Store the group ID for updates
          rope.ropeType = group.ropeType || "rope"; // Store the rope type for live updates

          // Load and apply rope end texture if specified
          if (ropeConfig.ropeEndTexturePath) {
            try {
              const ropeEndTexture = await TextureLoader.loadTexture(
                ropeConfig.ropeEndTexturePath
              );
              await rope._createRopeEnds(ropeEndTexture);
            } catch (err) {
              console.warn(
                `Map Shine | Could not load rope end texture: ${ropeConfig.ropeEndTexturePath}`,
                err
              );
            }
          }

          this.ropeContainer.addChild(rope.container);
          this.ropes.push(rope);
        } catch (err) {
          console.warn(
            `Map Shine | Could not load texture for physics rope: ${group.texturePath}`,
            err
          );
        }
      }
    }
  }

  async _tearDown(options) {
    if (this._onAnimateBound) {
      canvas.app.ticker.remove(this._onAnimateBound);
    }

    // Remove the hook listener
    if (this._boundRefresh) {
      Hooks.off("mapShine:mapPointsUpdated", this._boundRefresh);
      this._boundRefresh = null;
    }

    for (const rope of this.ropes) rope.destroy();
    this.ropes = [];

    if (this.ropeContainer) {
      this.ropeContainer.destroy({ children: true });
      this.ropeContainer = null;
    }

    return super._tearDown(options);
  }

  _onAnimate(ticker) {
    // ticker.deltaMS is ms since last frame; convert to seconds
    const deltaTime = ticker?.deltaMS ? ticker.deltaMS / 1000.0 : 0.016;
    for (const rope of this.ropes) {
      rope.update(deltaTime);
    }
  }

  async refresh() {
    await this._initializeRopes();
  }

  /**
   * Update the layer from the active config.
   * This is called by ProfileManager when rope settings change.
   * @param {Object} config - The active configuration
   */
  async updateFromConfig(config) {
    if (!config?.physicsRope) return;

    // Check if the layer should be visible based on the enabled flag
    this.visible = config.physicsRope.enabled;

    // Update existing ropes with new physics settings from their type-specific config
    for (const rope of this.ropes) {
      // Get the type-specific config (e.g., config.physicsRope.rope, config.physicsRope.chain)
      const ropeType = rope.ropeType || "rope";
      const typeConfig = config.physicsRope[ropeType];

      if (!typeConfig) {
        console.warn(`MapShine | No config found for rope type "${ropeType}"`);
        continue;
      }

      // Update the rope's config with new values from the type-specific config
      // This allows real-time tuning of rope physics per rope type
      if (typeConfig.damping !== undefined) {
        rope.config.damping = typeConfig.damping;
      }
      if (typeConfig.windForce !== undefined) {
        rope.config.windForce = typeConfig.windForce;
      }
      if (typeConfig.springConstant !== undefined) {
        rope.config.springConstant = typeConfig.springConstant;
      }
      if (typeConfig.animationSpeed !== undefined) {
        rope.config.animationSpeed = typeConfig.animationSpeed;
      }
      if (typeConfig.tapering !== undefined) {
        rope.config.tapering = typeConfig.tapering;
      }
      if (typeConfig.indoorWindShielding !== undefined) {
        rope.config.indoorWindShielding = typeConfig.indoorWindShielding;
      }
    }
  }
}