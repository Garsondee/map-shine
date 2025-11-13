/**
 * Import/Export Validation Test
 * 
 * This test loads Foundry VTT with Map Shine enabled and captures all
 * import/export errors to help systematically fix missing imports.
 */

import { test, expect } from '@playwright/test';
import { MapShineTestHelper } from './map-shine-utils.js';

test.describe('Import/Export Validation', () => {
  let helper;
  let consoleErrors = [];
  let consoleWarnings = [];

  test.beforeEach(async ({ page }) => {
    helper = new MapShineTestHelper(page);
    
    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        consoleErrors.push(text);
        console.error('❌ CONSOLE ERROR:', text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.warn('⚠️  CONSOLE WARNING:', text);
      } else if (type === 'log' && text.includes('Map Shine')) {
        console.log('📦 MAP SHINE:', text);
      }
    });
    
    // Capture page errors (uncaught exceptions)
    page.on('pageerror', error => {
      const errorText = `UNCAUGHT: ${error.message}\n${error.stack}`;
      consoleErrors.push(errorText);
      console.error('💥 UNCAUGHT ERROR:', errorText);
    });
  });

  test('Load Map Shine and detect import/export errors', async ({ page }) => {
    console.log('\n🔍 Starting import/export validation...\n');
    
    try {
      // Navigate to Foundry VTT
      console.log('🌐 Navigating to Foundry VTT...');
      await page.goto('http://localhost:30000/game', { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      // Authenticate if needed
      try {
        await helper.authenticate('Gamemaster');
      } catch (e) {
        console.log('ℹ️  Authentication skipped or already authenticated');
      }
      
      // Wait for initial page load
      await page.waitForLoadState('load');
      console.log('✅ Page loaded');
      
      // Try to wait for canvas initialization (but don't fail if it doesn't happen)
      try {
        await helper.waitForCanvas(30000);
        console.log('✅ Canvas initialized');
      } catch (e) {
        console.log('⚠️  Canvas initialization failed or timed out:', e.message);
      }
      
      // Try to wait for MapShine (but don't fail if it doesn't happen)
      try {
        await helper.waitForMapShine(10000);
        console.log('✅ Map Shine object detected');
      } catch (e) {
        console.log('⚠️  Map Shine initialization failed or timed out:', e.message);
      }
      
      // Give it extra time to catch delayed errors
      console.log('⏳ Waiting for delayed errors...');
      await page.waitForTimeout(5000);
      
    } catch (error) {
      console.error('❌ Test execution error:', error.message);
      console.error(error.stack);
    }
    
    // Analyze and report errors
    console.log('\n' + '='.repeat(80));
    console.log('📊 IMPORT/EXPORT ERROR ANALYSIS');
    console.log('='.repeat(80) + '\n');
    
    const importErrors = analyzeImportErrors(consoleErrors);
    const exportErrors = analyzeExportErrors(consoleErrors);
    const referenceErrors = analyzeReferenceErrors(consoleErrors);
    
    // Report findings
    if (importErrors.length > 0) {
      console.log('🔴 IMPORT ERRORS DETECTED:\n');
      importErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.type}:`);
        console.log(`   File: ${err.file || 'Unknown'}`);
        console.log(`   Missing: ${err.missing}`);
        console.log(`   Error: ${err.original}\n`);
      });
    }
    
    if (exportErrors.length > 0) {
      console.log('🔴 EXPORT ERRORS DETECTED:\n');
      exportErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.type}:`);
        console.log(`   File: ${err.file || 'Unknown'}`);
        console.log(`   Missing: ${err.missing}`);
        console.log(`   Error: ${err.original}\n`);
      });
    }
    
    if (referenceErrors.length > 0) {
      console.log('🔴 REFERENCE ERRORS DETECTED:\n');
      referenceErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.type}:`);
        console.log(`   Missing: ${err.missing}`);
        console.log(`   Error: ${err.original}\n`);
      });
    }
    
    // Summary
    console.log('='.repeat(80));
    console.log('📈 SUMMARY:');
    console.log(`   Total Errors: ${consoleErrors.length}`);
    console.log(`   Total Warnings: ${consoleWarnings.length}`);
    console.log(`   Import Issues: ${importErrors.length}`);
    console.log(`   Export Issues: ${exportErrors.length}`);
    console.log(`   Reference Issues: ${referenceErrors.length}`);
    console.log('='.repeat(80) + '\n');
    
    // Generate fix suggestions
    if (importErrors.length > 0 || exportErrors.length > 0 || referenceErrors.length > 0) {
      console.log('💡 FIX SUGGESTIONS:\n');
      generateFixSuggestions(importErrors, exportErrors, referenceErrors);
    }
    
    // This test is informational - it doesn't fail, just reports
    console.log('\n✅ Validation complete. Review the errors above.\n');
  });
});

/**
 * Analyze console errors for import-related issues
 */
function analyzeImportErrors(errors) {
  const importErrors = [];
  const importPatterns = [
    /Failed to load module.*?(['"].*?['"])/,
    /Cannot find module.*?(['"].*?['"])/,
    /Unable to resolve.*?(['"].*?['"])/,
    /Module not found.*?(['"].*?['"])/,
    /import.*?from.*?(['"].*?['"]).*?not found/i,
  ];
  
  errors.forEach(error => {
    for (const pattern of importPatterns) {
      const match = error.match(pattern);
      if (match) {
        importErrors.push({
          type: 'Import Error',
          missing: match[1]?.replace(/['"]/g, '') || 'Unknown',
          original: error,
          file: extractFilePath(error)
        });
        break;
      }
    }
  });
  
  return importErrors;
}

/**
 * Analyze console errors for export-related issues
 */
function analyzeExportErrors(errors) {
  const exportErrors = [];
  const exportPatterns = [
    /does not provide an export named ['"](.+?)['"]/,
    /export ['"](.+?)['"] was not found/i,
    /The requested module.*?does not provide an export named ['"](.+?)['"]/,
  ];
  
  errors.forEach(error => {
    for (const pattern of exportPatterns) {
      const match = error.match(pattern);
      if (match) {
        exportErrors.push({
          type: 'Export Error',
          missing: match[1] || 'Unknown',
          original: error,
          file: extractFilePath(error)
        });
        break;
      }
    }
  });
  
  return exportErrors;
}

/**
 * Analyze console errors for undefined reference issues
 */
function analyzeReferenceErrors(errors) {
  const referenceErrors = [];
  const referencePatterns = [
    /(\w+) is not defined/,
    /Cannot access '(\w+)' before initialization/,
    /ReferenceError:.*?(\w+)/,
  ];
  
  errors.forEach(error => {
    for (const pattern of referencePatterns) {
      const match = error.match(pattern);
      if (match) {
        referenceErrors.push({
          type: 'Reference Error',
          missing: match[1] || 'Unknown',
          original: error
        });
        break;
      }
    }
  });
  
  return referenceErrors;
}

/**
 * Extract file path from error message
 */
function extractFilePath(error) {
  const filePatterns = [
    /(?:at|in|from)\s+(.*?\.js)/,
    /(\/.*?\.js)/,
    /(scripts\/.*?\.js)/,
  ];
  
  for (const pattern of filePatterns) {
    const match = error.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Generate actionable fix suggestions
 */
function generateFixSuggestions(importErrors, exportErrors, referenceErrors) {
  const fixes = new Map();
  
  // Suggest fixes for import errors
  importErrors.forEach(err => {
    const key = err.missing;
    if (!fixes.has(key)) {
      fixes.set(key, {
        issue: `Module "${key}" cannot be imported`,
        suggestions: [
          `1. Check if the file exists at ${key}`,
          `2. Verify the file path is correct (relative paths from importing file)`,
          `3. Ensure the file exports something (export class/export function/export default)`,
        ]
      });
    }
  });
  
  // Suggest fixes for export errors
  exportErrors.forEach(err => {
    const key = `export:${err.missing}`;
    if (!fixes.has(key)) {
      fixes.set(key, {
        issue: `Export "${err.missing}" is not found in ${err.file || 'a module'}`,
        suggestions: [
          `1. Add "export class ${err.missing}" or "export function ${err.missing}" to the source file`,
          `2. If using default export, import with "import ${err.missing} from ..." not "import { ${err.missing} }"`,
          `3. Check for typos in the export name`,
        ]
      });
    }
  });
  
  // Suggest fixes for reference errors
  referenceErrors.forEach(err => {
    const key = `ref:${err.missing}`;
    if (!fixes.has(key)) {
      fixes.set(key, {
        issue: `"${err.missing}" is not defined`,
        suggestions: [
          `1. Add import statement: import { ${err.missing} } from './path/to/file.js'`,
          `2. Check if ${err.missing} is exported from its source file`,
          `3. Verify the class/function/variable is defined before use`,
        ]
      });
    }
  });
  
  // Print suggestions
  let counter = 1;
  fixes.forEach((fix, key) => {
    console.log(`${counter}. ${fix.issue}`);
    fix.suggestions.forEach(suggestion => {
      console.log(`   ${suggestion}`);
    });
    console.log('');
    counter++;
  });
}
