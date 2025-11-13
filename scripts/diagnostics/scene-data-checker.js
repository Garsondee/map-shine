import { CONST, TILE_OCCLUSION_MODES } from "../foundry-adapter.js";
import { URL, Blob } from "../dom-adapter.js";

/**
 * Scene Data Integrity Checker
 * 
 * This script checks for corrupted or invalid tile/token data that could cause
 * PIXI rendering errors with Map Shine.
 * 
 * Usage: Copy and paste into browser console while scene is loaded
 */

class SceneDataChecker {
  constructor() {
    this.issues = {
      tiles: [],
      tokens: [],
      backgrounds: [],
      overheads: []
    };
  }

  /**
   * Run comprehensive scene data check
   */
  async runCheck() {
    console.log("🔍 Scene Data Integrity Check Starting...");
    console.log("=".repeat(80));
    
    await this.checkTiles();
    await this.checkTokens();
    await this.checkBackgrounds();
    await this.checkOverheadTiles();
    
    this.generateReport();
    
    return this.issues;
  }

  /**
   * Check all tiles for texture validity issues
   */
  async checkTiles() {
    console.log("\n📋 Checking Tiles...");
    
    if (!canvas?.tiles?.placeables) {
      console.warn("Canvas tiles not available");
      return;
    }

    for (const tile of canvas.tiles.placeables) {
      const issue = {
        id: tile.id,
        name: tile.document.texture?.src || "Unknown",
        problems: []
      };

      // Check if tile exists
      if (!tile) {
        issue.problems.push("Tile object is null");
        this.issues.tiles.push(issue);
        continue;
      }

      // Check texture
      if (!tile.texture) {
        issue.problems.push("Missing texture property");
      } else {
        if (!tile.texture.valid) {
          issue.problems.push("Texture is not valid");
        }
        if (!tile.texture.baseTexture) {
          issue.problems.push("Missing baseTexture");
        } else if (!tile.texture.baseTexture.valid) {
          issue.problems.push("BaseTexture is not valid");
        }
      }

      // Check mesh
      if (!tile.mesh) {
        issue.problems.push("Missing mesh");
      } else if (tile.mesh.destroyed) {
        issue.problems.push("Mesh is destroyed");
      }

      // Check document
      if (!tile.document) {
        issue.problems.push("Missing document");
      } else {
        if (!tile.document.texture?.src) {
          issue.problems.push("Missing texture source path");
        }
      }

      // Check if destroyed
      if (tile.destroyed || tile._destroyed) {
        issue.problems.push("Tile is destroyed");
      }

      if (issue.problems.length > 0) {
        this.issues.tiles.push(issue);
      }
    }

    console.log(`✓ Checked ${canvas.tiles.placeables.length} tiles, found ${this.issues.tiles.length} issues`);
  }

  /**
   * Check all tokens for texture validity issues
   */
  async checkTokens() {
    console.log("\n👥 Checking Tokens...");
    
    if (!canvas?.tokens?.placeables) {
      console.warn("Canvas tokens not available");
      return;
    }

    for (const token of canvas.tokens.placeables) {
      const issue = {
        id: token.id,
        name: token.document.name || "Unknown",
        problems: []
      };

      if (!token.texture) {
        issue.problems.push("Missing texture property");
      } else {
        if (!token.texture.valid) {
          issue.problems.push("Texture is not valid");
        }
        if (!token.texture.baseTexture) {
          issue.problems.push("Missing baseTexture");
        } else if (!token.texture.baseTexture.valid) {
          issue.problems.push("BaseTexture is not valid");
        }
      }

      if (token.destroyed || token._destroyed) {
        issue.problems.push("Token is destroyed");
      }

      if (issue.problems.length > 0) {
        this.issues.tokens.push(issue);
      }
    }

    console.log(`✓ Checked ${canvas.tokens.placeables.length} tokens, found ${this.issues.tokens.length} issues`);
  }

  /**
   * Check tiles with background suffixes
   */
  async checkBackgrounds() {
    console.log("\n🖼️ Checking Background Tiles...");
    
    if (!game?.mapShine?.effectTargetManager?.targets?.tiles) {
      console.warn("Map Shine effect targets not available");
      return;
    }

    const effectTargets = game.mapShine.effectTargetManager.targets.tiles;
    
    for (const [tileId, target] of effectTargets) {
      const tile = canvas.tiles.get(tileId);
      const issue = {
        id: tileId,
        name: target.basePath || "Unknown",
        problems: []
      };

      if (!tile) {
        issue.problems.push("Tile not found in canvas");
        this.issues.backgrounds.push(issue);
        continue;
      }

      // Check if it's marked as weather (should not be in background layer)
      if (tile.document.restrictions?.weather) {
        issue.problems.push("Tile has weather restriction (conflict)");
      }

      // Check texture validity
      if (!tile.texture || !tile.texture.valid || !tile.texture.baseTexture?.valid) {
        issue.problems.push("Invalid texture for background effect");
      }

      if (issue.problems.length > 0) {
        this.issues.backgrounds.push(issue);
      }
    }

    console.log(`✓ Checked ${effectTargets.size} background tiles, found ${this.issues.backgrounds.length} issues`);
  }

  /**
   * Check overhead/roof tiles
   */
  async checkOverheadTiles() {
    console.log("\n🏠 Checking Overhead Tiles...");
    
    let overheadCount = 0;
    
    for (const tile of canvas.tiles.placeables) {
      const isOverhead = 
        tile.document.overhead ||
        tile.document.roof ||
        tile.document.occlusion?.mode === CONST.TILE_OCCLUSION_MODES.ROOF;

      if (isOverhead) {
        overheadCount++;
        const issue = {
          id: tile.id,
          name: tile.document.texture?.src || "Unknown",
          problems: []
        };

        // Check texture validity
        if (!tile.texture || !tile.texture.valid || !tile.texture.baseTexture?.valid) {
          issue.problems.push("Invalid texture for overhead tile");
        }

        // Check if tile mesh exists
        if (!tile.mesh) {
          issue.problems.push("Missing mesh for overhead tile");
        }

        if (issue.problems.length > 0) {
          this.issues.overheads.push(issue);
        }
      }
    }

    console.log(`✓ Checked ${overheadCount} overhead tiles, found ${this.issues.overheads.length} issues`);
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log("\n" + "=".repeat(80));
    console.log("📊 SCENE DATA INTEGRITY REPORT");
    console.log("=".repeat(80));

    const totalIssues = 
      this.issues.tiles.length +
      this.issues.tokens.length +
      this.issues.backgrounds.length +
      this.issues.overheads.length;

    console.log(`\nTotal Issues Found: ${totalIssues}\n`);

    if (totalIssues === 0) {
      console.log("✅ No data integrity issues detected!");
      console.log("\nThe BatchRenderer errors are likely caused by runtime state,");
      console.log("not corrupted scene data. Check the diagnostic debugger output.");
      return;
    }

    // Report tiles
    if (this.issues.tiles.length > 0) {
      console.log(`\n❌ TILE ISSUES (${this.issues.tiles.length}):`);
      this.issues.tiles.forEach((issue, i) => {
        console.log(`  ${i + 1}. Tile ID: ${issue.id}`);
        console.log(`     Path: ${issue.name}`);
        console.log(`     Problems: ${issue.problems.join(", ")}`);
      });
    }

    // Report tokens
    if (this.issues.tokens.length > 0) {
      console.log(`\n❌ TOKEN ISSUES (${this.issues.tokens.length}):`);
      this.issues.tokens.forEach((issue, i) => {
        console.log(`  ${i + 1}. Token ID: ${issue.id}`);
        console.log(`     Name: ${issue.name}`);
        console.log(`     Problems: ${issue.problems.join(", ")}`);
      });
    }

    // Report backgrounds
    if (this.issues.backgrounds.length > 0) {
      console.log(`\n❌ BACKGROUND TILE ISSUES (${this.issues.backgrounds.length}):`);
      this.issues.backgrounds.forEach((issue, i) => {
        console.log(`  ${i + 1}. Tile ID: ${issue.id}`);
        console.log(`     Path: ${issue.name}`);
        console.log(`     Problems: ${issue.problems.join(", ")}`);
      });
    }

    // Report overheads
    if (this.issues.overheads.length > 0) {
      console.log(`\n❌ OVERHEAD TILE ISSUES (${this.issues.overheads.length}):`);
      this.issues.overheads.forEach((issue, i) => {
        console.log(`  ${i + 1}. Tile ID: ${issue.id}`);
        console.log(`     Path: ${issue.name}`);
        console.log(`     Problems: ${issue.problems.join(", ")}`);
      });
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n💡 RECOMMENDATIONS:\n");
    
    if (this.issues.tiles.length > 0 || this.issues.backgrounds.length > 0 || this.issues.overheads.length > 0) {
      console.log("1. Check if texture files exist at the reported paths");
      console.log("2. Try re-uploading missing textures to Foundry");
      console.log("3. Consider removing and re-adding problematic tiles");
      console.log("4. Check Foundry console for texture loading errors");
    }
    
    if (this.issues.tokens.length > 0) {
      console.log("5. Check token artwork paths in token configuration");
      console.log("6. Verify token artwork files exist");
    }

    console.log("\n" + "=".repeat(80));
  }

  /**
   * Export report as JSON
   */
  exportJSON() {
    const json = JSON.stringify(this.issues, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene-data-check-${game.scenes.current.name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("📁 Report exported as JSON");
  }

  /**
   * Attempt to repair fixable issues
   */
  async attemptRepair() {
    console.log("\n🔧 Attempting automatic repairs...");
    let repaired = 0;

    // Can't really repair much automatically, but we can try forcing texture reloads
    for (const issue of this.issues.tiles) {
      const tile = canvas.tiles.get(issue.id);
      if (tile && tile.document.texture?.src) {
        try {
          console.log(`  Reloading texture for tile ${issue.id}...`);
          await tile.document.update({ "texture.src": tile.document.texture.src });
          repaired++;
        } catch (e) {
          console.error(`  Failed to reload tile ${issue.id}:`, e);
        }
      }
    }

    console.log(`✓ Repaired ${repaired} tiles`);
    console.log("⚠️ Other issues require manual intervention");
  }
}

// Auto-create checker
window.sceneChecker = new SceneDataChecker();

// Run check immediately
window.sceneChecker.runCheck().then(() => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Scene Data Check Complete                                     ║
╚════════════════════════════════════════════════════════════════╝

Commands:
  sceneChecker.runCheck()        - Run check again
  sceneChecker.exportJSON()      - Export report as JSON file
  sceneChecker.attemptRepair()   - Try automatic repairs
  sceneChecker.issues            - View raw issues object
`);
});
