/**
 * Playwright Configuration for Map Shine - HEADED MODE (RECOMMENDED)
 * 
 * This configuration runs tests with a visible browser window.
 * This is the RECOMMENDED mode for Map Shine testing because:
 * - You can see exactly what's happening
 * - Complex UIs render properly (unlike headless mode)
 * - Console output is visible in real-time
 * - Debugging is much easier
 * 
 * Usage:
 *   npx playwright test --config=playwright-headed.config.js
 *   npx playwright test ui-slider-tests.spec.js --config=playwright-headed.config.js
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/playwright',
  
  // Global timeout for each test (90 seconds for UI tests)
  timeout: 90000,
  
  // Expect timeout for assertions (15 seconds)
  expect: {
    timeout: 15000
  },
  
  // Run tests in files in parallel
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // No retries - we want to see failures immediately
  retries: 0,
  
  // Single worker for headed mode
  workers: 1,
  
  // Reporter to use
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/playwright-report', open: 'never' }],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:30000',
    
    // Always collect trace in headed mode for debugging
    trace: 'on',
    
    // Take screenshot on failure
    screenshot: 'on',
    
    // Record video always
    video: 'on',
    
    // Maximum time each action can take (45 seconds)
    actionTimeout: 45000,
    
    // Larger viewport for UI visibility
    viewport: { width: 1920, height: 1080 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Slow down actions by 100ms for visibility
    slowMo: 100,
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium-headed',
      use: {
        browserName: 'chromium',
        // HEADED MODE - Browser window will be visible!
        headless: false,
        viewport: { width: 1920, height: 1080 },
        // Performance flags to unlock FPS and enable maximum rendering
        launchOptions: {
          args: [
            '--disable-frame-rate-limit',           // Remove 60 FPS cap
            '--disable-gpu-vsync',                  // Disable VSync
            '--max-gum-fps=999',                    // Allow unlimited FPS
            '--disable-features=CalculateNativeWinOcclusion', // Prevent throttling
            '--enable-gpu-rasterization',           // Full GPU acceleration
            '--enable-zero-copy',                   // Optimized texture uploads
          ]
        },
      },
    },
  ],
  
  // Folder for test artifacts
  outputDir: 'tests/playwright-artifacts',
});
