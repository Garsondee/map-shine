/**
 * Playwright Configuration for Map Shine Module Testing
 * 
 * This configuration sets up browser automation testing for the Map Shine module.
 * Tests run against a real Foundry VTT server with a real browser client.
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/playwright',
  
  // Global timeout for each test (60 seconds)
  timeout: 60000,
  
  // Expect timeout for assertions (10 seconds)
  expect: {
    timeout: 10000
  },
  
  // Run tests in files in parallel
  fullyParallel: false,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: 1,
  
  // Reporter to use
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/playwright-report', open: 'never' }],
    ['json', { outputFile: 'tests/playwright-results.json' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:30000',
    
    // Collect trace when retrying the failed test
    trace: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Maximum time each action can take (30 seconds)
    actionTimeout: 30000,
    
    // Viewport size
    viewport: { width: 1920, height: 1080 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
  
  // Folder for test artifacts such as screenshots, videos, traces, etc.
  outputDir: 'tests/playwright-artifacts',
});