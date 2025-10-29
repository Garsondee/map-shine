/**
 * Map Shine Test Utilities for Playwright
 * 
 * Helper functions for testing Map Shine module functionality
 */

export class MapShineTestHelper {
  constructor(page) {
    this.page = page;
  }

  /**
   * Wait for Map Shine to fully initialize
   */
  async waitForMapShine(timeout = 30000) {
    await this.page.waitForFunction(() => {
      return window.game?.mapShine?.initialized === true;
    }, { timeout });
    
    console.log('✅ Map Shine initialized');
  }

  /**
   * Wait for a specific manager to be available
   */
  async waitForManager(managerName, timeout = 10000) {
    await this.page.waitForFunction((name) => {
      return window.game?.mapShine?.[name] !== undefined;
    }, managerName, { timeout });
    
    console.log(`✅ ${managerName} ready`);
  }

  /**
   * Authenticate with Foundry VTT (if needed)
   */
  async authenticate(username = 'Gamemaster', password) {
    try {
      // Wait for either the login form or the game to load
      console.log('🔐 Checking for login form...');
      
      // Wait up to 15 seconds for the login form to appear
      // Form ID is 'join-game-form' NOT 'join-form'
      const loginForm = await this.page.waitForSelector('form#join-game-form', { 
        timeout: 15000,
        state: 'visible'
      }).catch(() => null);
      
      if (loginForm) {
        console.log('🔐 Login form found, authenticating...');
        
        // Try to find user selection method (dropdown or input)
        const userDropdown = await this.page.$('select[name="userid"]').catch(() => null);
        const userInput = await this.page.$('input[name="userid"]').catch(() => null);
        
        if (userDropdown) {
          // Dropdown selection (no password world)
          console.log('   Found user dropdown, selecting user...');
          await this.page.selectOption('select[name="userid"]', username);
          console.log(`   Selected: ${username}`);
        } else if (userInput) {
          // Text input (password-protected world)
          console.log('   Found user input, typing username...');
          await this.page.fill('input[name="userid"]', username);
          console.log(`   Username: ${username}`);
          
          // Check for password field
          const passwordField = await this.page.$('input[name="password"]').catch(() => null);
          if (passwordField && password) {
            await this.page.fill('input[name="password"]', password);
            console.log('   Password: ********');
          }
        } else {
          throw new Error('Could not find user selection field (neither dropdown nor input)');
        }
        
        // Submit form and wait for navigation
        console.log('🔐 Submitting login form...');
        await Promise.all([
          this.page.waitForNavigation({ timeout: 30000 }),
          this.page.click('button[name="join"]')
        ]);
        
        console.log('✅ Authentication successful - navigated to game');
      } else {
        console.log('ℹ️ No login form found - already authenticated or different page structure');
      }
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      
      // Take a screenshot for debugging
      await this.page.screenshot({ 
        path: 'tests/playwright-artifacts/auth-failure.png' 
      }).catch(() => {});
      
      throw error;
    }
  }

  /**
   * Wait for canvas to be ready
   */
  async waitForCanvas(timeout = 30000) {
    await this.page.waitForFunction(() => {
      return window.canvas?.ready === true;
    }, { timeout });
    
    console.log('✅ Canvas ready');
  }

  /**
   * Unpause the game if it's paused
   * Foundry VTT often loads in paused state which blocks UI interaction
   */
  async unpauseGame() {
    const wasPaused = await this.page.evaluate(() => {
      if (window.game?.paused) {
        window.game.togglePause(false);
        return true;
      }
      return false;
    });
    
    if (wasPaused) {
      console.log('✅ Game unpaused');
      // Wait a moment for unpause effects to complete
      await this.page.waitForTimeout(500);
    } else {
      console.log('ℹ️  Game was not paused');
    }
    
    return wasPaused;
  }

  /**
   * Get weather diagnostics from the module
   */
  async getWeatherDiagnostics() {
    return await this.page.evaluate(() => {
      return window.game?.mapShine?.weatherSystemManager?.getDiagnostics?.() || null;
    });
  }

  /**
   * Get wind manager state
   */
  async getWindState() {
    return await this.page.evaluate(() => {
      const wind = window.game?.mapShine?.windManager;
      if (!wind) return null;
      
      return {
        baseSpeed: wind.windBaseSpeed,
        currentSpeed: wind.windSpeed,
        direction: wind.windDirection,
        turbulence: wind.turbulence
      };
    });
  }

  /**
   * Count active particles
   */
  async countActiveParticles() {
    return await this.page.evaluate(() => {
      const layer = window.canvas?.effects?.children?.find(
        c => c.constructor.name === 'ParticleLayer'
      );
      return layer?.particleCount || 0;
    });
  }

  /**
   * Open Map Shine debugger UI
   */
  async openDebugger() {
    await this.page.keyboard.press('Control+Shift+M');
    
    // Wait for debugger to be visible
    await this.page.waitForSelector('.map-shine-debugger', {
      state: 'visible',
      timeout: 5000
    });
    
    console.log('✅ Debugger opened');
  }

  /**
   * Close Map Shine debugger UI
   */
  async closeDebugger() {
    await this.page.keyboard.press('Escape');
    
    // Wait for debugger to be hidden
    await this.page.waitForSelector('.map-shine-debugger', {
      state: 'hidden',
      timeout: 5000
    });
    
    console.log('✅ Debugger closed');
  }

  /**
   * Get config value by path
   */
  async getConfigValue(path) {
    return await this.page.evaluate((configPath) => {
      const config = window.game?.mapShine?.profileManager?.activeConfig;
      if (!config) return undefined;
      return foundry.utils.getProperty(config, configPath);
    }, path);
  }

  /**
   * Set config value by path
   */
  async setConfigValue(path, value) {
    return await this.page.evaluate(({ configPath, val }) => {
      const config = window.game?.mapShine?.profileManager?.activeConfig;
      if (!config) return false;
      foundry.utils.setProperty(config, configPath, val);
      return true;
    }, { configPath: path, val: value });
  }

  /**
   * Take screenshot with timestamp
   */
  async screenshot(name) {
    const timestamp = Date.now();
    const path = `tests/screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({ path, fullPage: false });
    console.log(`📸 Screenshot: ${path}`);
    return path;
  }

  /**
   * Wait for specific duration (use sparingly!)
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Check if module is in test mode
   */
  async isTestMode() {
    return await this.page.evaluate(() => {
      return typeof process !== 'undefined' && process.env?.MAP_SHINE_TEST_MODE === 'true';
    });
  }

  /**
   * Get console logs from the page
   */
  setupConsoleCapture() {
    const logs = [];
    
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      logs.push({ type, text, timestamp: Date.now() });
      
      // Also log to test output with color coding
      if (type === 'error') {
        console.error(`[BROWSER] ${text}`);
      } else if (type === 'warning') {
        console.warn(`[BROWSER] ${text}`);
      } else if (text.includes('Map Shine')) {
        console.log(`[BROWSER] ${text}`);
      }
    });
    
    return logs;
  }
}