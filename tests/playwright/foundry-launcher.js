/**
 * Foundry VTT Server Launcher for Playwright Tests
 * 
 * Manages starting and stopping Foundry VTT headless server
 * with specific world and scene configuration.
 */

import { spawn } from 'child_process';

export class FoundryLauncher {
  constructor(options = {}) {
    this.worldName = options.worldName || 'map-development-world';
    this.sceneId = options.sceneId || null;
    this.port = options.port || 30000;
    this.foundryPath = options.foundryPath || 'C:\\Program Files\\Foundry Virtual Tabletop\\resources\\app\\main.js';
    this.process = null;
    this.logOutput = options.logOutput !== undefined ? options.logOutput : true; // Enable by default for debugging
    this.outputBuffer = [];
    this.errorBuffer = [];
  }

  /**
   * Start Foundry VTT headless server
   */
  async start() {
    // Foundry CLI args (matching run-tests.ps1 and headless-runner.js)
    const args = [
      this.foundryPath,
      '--headless',
      `--world=${this.worldName}`,
      `--port=${this.port}`
    ];
    
    // NOTE: --scene flag is NOT supported by Foundry CLI
    // Scene must be set via world data or activated after server starts

    console.log(`🚀 Starting Foundry VTT server...`);
    console.log(`   Command: node ${args.join(' ')}`);
    console.log(`   World: ${this.worldName}`);
    console.log(`   Port: ${this.port}`);
    if (this.sceneId) {
      console.log(`   ⚠️ Scene will be activated after startup: ${this.sceneId}`);
    }

    this.process = spawn('node', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MAP_SHINE_TEST_MODE: 'true' // Enable test mode
      }
    });
    
    // Capture stdout
    if (this.process.stdout) {
      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        this.outputBuffer.push(output);
        if (this.logOutput) {
          console.log('[Foundry]', output);
        }
      });
    }
    
    // Capture stderr
    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        const error = data.toString();
        this.errorBuffer.push(error);
        if (this.logOutput) {
          console.error('[Foundry Error]', error);
        }
      });
    }
    
    // Handle process errors
    this.process.on('error', (err) => {
      console.error('❌ Foundry process spawn error:', err);
      throw err;
    });
    
    // Handle process exit
    this.process.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Foundry process exited with code ${code}`);
        if (this.errorBuffer.length > 0) {
          console.error('Last errors:');
          this.errorBuffer.slice(-10).forEach(e => console.error(e));
        }
      }
    });
    
    // Wait for server to be ready
    await this.waitForServer();
    console.log('✅ Foundry VTT server is ready');
  }

  /**
   * Wait for Foundry server to respond
   */
  async waitForServer() {
    const maxAttempts = 60; // 60 seconds
    const delayMs = 1000;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`http://localhost:${this.port}`);
        if (response.ok || response.status === 401) {
          // 401 is OK - means server is up but needs authentication
          return;
        }
      } catch (e) {
        // Server not ready yet
      }
      
      // Check if process is still alive
      if (this.process && this.process.exitCode !== null) {
        let errorMsg = `Foundry process exited with code ${this.process.exitCode}`;
        if (this.errorBuffer.length > 0) {
          errorMsg += `\n\nLast errors:\n${this.errorBuffer.slice(-5).join('\n')}`;
        }
        if (this.outputBuffer.length > 0) {
          errorMsg += `\n\nLast output:\n${this.outputBuffer.slice(-5).join('\n')}`;
        }
        throw new Error(errorMsg);
      }
      
      await new Promise(r => setTimeout(r, delayMs));
    }
    
    throw new Error('Foundry server failed to start within 60 seconds');
  }

  /**
   * Stop Foundry VTT server
   */
  async stop() {
    if (this.process) {
      console.log('🛑 Stopping Foundry VTT server...');
      
      // Store reference before nulling
      const processRef = this.process;
      
      processRef.kill('SIGTERM');
      
      // Wait for process to exit
      await new Promise((resolve) => {
        if (processRef.exitCode !== null) {
          resolve();
        } else {
          processRef.on('exit', resolve);
          // Force kill after 5 seconds
          setTimeout(() => {
            if (processRef && processRef.exitCode === null) {
              processRef.kill('SIGKILL');
            }
          }, 5000);
        }
      });
      
      this.process = null;
      console.log('✅ Foundry VTT server stopped');
    }
  }

  /**
   * Check if server is running
   */
  isRunning() {
    return this.process !== null && this.process.exitCode === null;
  }
}