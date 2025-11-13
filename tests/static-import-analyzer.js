/**
 * Static Import/Export Analyzer
 * 
 * Scans the Map Shine codebase to detect missing imports/exports
 * without needing to run Foundry VTT.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Classes/functions that are known globals or from external dependencies
const KNOWN_GLOBALS = new Set([
  'PIXI', 'foundry', 'game', 'canvas', 'ui', 'Hooks', 'console', 'document', 
  'window', 'CONFIG', 'Actor', 'Token', 'Scene', 'User', 'Item', 'Roll',
  'Application', 'FormApplication', 'Dialog', 'FilePicker', 'ChatMessage',
  'Folder', 'Macro', 'Playlist', 'JournalEntry', 'RollTable', 'Cards',
  'Math', 'Number', 'String', 'Array', 'Object', 'Set', 'Map', 'Promise',
  'Date', 'Error', 'RegExp', 'JSON', 'parseInt', 'parseFloat', 'isNaN',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'libWrapper', 'socketlib',
]);

class ImportExportAnalyzer {
  constructor() {
    this.files = new Map(); // filepath -> { imports: [], exports: [], classes: [], functions: [], references: [] }
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Scan all JS files in the project
   */
  async scanProject() {
    console.log('🔍 Scanning Map Shine project for import/export issues...\n');
    
    const scriptsDir = path.join(projectRoot, 'scripts');
    await this.scanDirectory(scriptsDir);
    
    console.log(`✅ Scanned ${this.files.size} files\n`);
  }

  /**
   * Recursively scan directory for JS files
   */
  async scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        await this.analyzeFile(fullPath);
      }
    }
  }

  /**
   * Analyze a single JS file
   */
  async analyzeFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');
    const relativePath = path.relative(projectRoot, filepath).replace(/\\/g, '/');
    
    const analysis = {
      path: relativePath,
      imports: this.extractImports(content),
      exports: this.extractExports(content),
      classes: this.extractClasses(content),
      functions: this.extractFunctions(content),
      references: this.extractReferences(content),
    };
    
    this.files.set(relativePath, analysis);
  }

  /**
   * Extract import statements
   */
  extractImports(content) {
    const imports = [];
    
    // Named imports: import { A, B } from './file.js'
    const namedImportRegex = /import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = namedImportRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim());
      imports.push({
        type: 'named',
        names,
        source: match[2],
      });
    }
    
    // Default imports: import X from './file.js'
    const defaultImportRegex = /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g;
    while ((match = defaultImportRegex.exec(content)) !== null) {
      imports.push({
        type: 'default',
        name: match[1],
        source: match[2],
      });
    }
    
    // Namespace imports: import * as X from './file.js'
    const namespaceImportRegex = /import\s*\*\s*as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g;
    while ((match = namespaceImportRegex.exec(content)) !== null) {
      imports.push({
        type: 'namespace',
        name: match[1],
        source: match[2],
      });
    }
    
    return imports;
  }

  /**
   * Extract export statements
   */
  extractExports(content) {
    const exports = [];
    
    // Named exports: export class X / export function Y / export const Z
    const namedExportRegex = /export\s+(class|function|const|let|var)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push({
        type: 'named',
        kind: match[1],
        name: match[2],
      });
    }
    
    // Export list: export { A, B }
    const exportListRegex = /export\s*{([^}]+)}/g;
    while ((match = exportListRegex.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0]);
      names.forEach(name => {
        exports.push({
          type: 'named',
          name,
        });
      });
    }
    
    // Default export: export default X
    const defaultExportRegex = /export\s+default\s+(\w+)/g;
    while ((match = defaultExportRegex.exec(content)) !== null) {
      exports.push({
        type: 'default',
        name: match[1],
      });
    }
    
    return exports;
  }

  /**
   * Extract class definitions
   */
  extractClasses(content) {
    const classes = [];
    const classRegex = /class\s+(\w+)/g;
    let match;
    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }
    return classes;
  }

  /**
   * Extract function definitions
   */
  extractFunctions(content) {
    const functions = [];
    
    // Function declarations
    const funcRegex = /function\s+(\w+)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    // Const function assignments
    const constFuncRegex = /const\s+(\w+)\s*=\s*(?:function|\(|async)/g;
    while ((match = constFuncRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    return functions;
  }

  /**
   * Extract identifier references (simplified - finds class/function usage)
   */
  extractReferences(content) {
    // Remove strings and comments to avoid false positives
    let cleaned = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Block comments
      .replace(/\/\/.*/g, '') // Line comments
      .replace(/(['"`])(?:(?!\1)[^\\]|\\.)*\1/g, ''); // Strings
    
    // Find new ClassName() patterns
    const newRegex = /new\s+(\w+)/g;
    const refs = new Set();
    let match;
    
    while ((match = newRegex.exec(cleaned)) !== null) {
      if (!KNOWN_GLOBALS.has(match[1])) {
        refs.add(match[1]);
      }
    }
    
    // Find ClassName.method() patterns
    const staticRegex = /\b([A-Z]\w+)\./g;
    while ((match = staticRegex.exec(cleaned)) !== null) {
      if (!KNOWN_GLOBALS.has(match[1])) {
        refs.add(match[1]);
      }
    }
    
    // Find instanceof ClassName patterns
    const instanceofRegex = /instanceof\s+(\w+)/g;
    while ((match = instanceofRegex.exec(cleaned)) !== null) {
      if (!KNOWN_GLOBALS.has(match[1])) {
        refs.add(match[1]);
      }
    }
    
    return Array.from(refs);
  }

  /**
   * Validate imports and exports across all files
   */
  validate() {
    console.log('🔎 Validating imports and exports...\n');
    
    // Build a map of what each file exports
    const exportMap = new Map(); // symbol name -> [files that export it]
    
    for (const [filepath, analysis] of this.files) {
      for (const exp of analysis.exports) {
        if (!exportMap.has(exp.name)) {
          exportMap.set(exp.name, []);
        }
        exportMap.get(exp.name).push(filepath);
      }
      
      // Also track classes and functions defined in the file
      for (const cls of analysis.classes) {
        if (!exportMap.has(cls)) {
          exportMap.set(cls, []);
        }
        if (!exportMap.get(cls).includes(filepath)) {
          exportMap.get(cls).push(filepath);
        }
      }
    }
    
    // Check each file's imports
    for (const [filepath, analysis] of this.files) {
      for (const imp of analysis.imports) {
        const sourcePath = this.resolveImportPath(filepath, imp.source);
        
        if (!sourcePath) {
          this.errors.push({
            file: filepath,
            type: 'IMPORT_PATH_NOT_FOUND',
            message: `Cannot resolve import path: "${imp.source}"`,
            import: imp,
          });
          continue;
        }
        
        const sourceAnalysis = this.files.get(sourcePath);
        if (!sourceAnalysis) {
          this.errors.push({
            file: filepath,
            type: 'IMPORT_FILE_NOT_FOUND',
            message: `Imported file does not exist: "${sourcePath}"`,
            import: imp,
          });
          continue;
        }
        
        // Check if imported names are exported
        if (imp.type === 'named') {
          const exportedNames = new Set(sourceAnalysis.exports.map(e => e.name));
          exportedNames.add(...sourceAnalysis.classes);
          exportedNames.add(...sourceAnalysis.functions);
          
          for (const name of imp.names) {
            if (!exportedNames.has(name)) {
              this.errors.push({
                file: filepath,
                type: 'EXPORT_NOT_FOUND',
                message: `"${name}" is not exported from "${sourcePath}"`,
                import: imp,
                name,
              });
            }
          }
        }
      }
      
      // Check if referenced classes/functions are imported or defined locally
      const availableSymbols = new Set([
        ...analysis.classes,
        ...analysis.functions,
        ...analysis.imports.flatMap(i => i.type === 'named' ? i.names : [i.name]),
        ...KNOWN_GLOBALS,
      ]);
      
      for (const ref of analysis.references) {
        if (!availableSymbols.has(ref)) {
          this.warnings.push({
            file: filepath,
            type: 'MISSING_IMPORT',
            message: `"${ref}" is used but not imported or defined`,
            reference: ref,
          });
        }
      }
    }
  }

  /**
   * Resolve relative import path to actual file path
   */
  resolveImportPath(fromFile, importPath) {
    if (!importPath.startsWith('.')) {
      // External module, skip
      return null;
    }
    
    const fromDir = path.dirname(fromFile);
    const resolved = path.join(fromDir, importPath);
    const normalized = resolved.replace(/\\/g, '/');
    
    // Try exact match
    if (this.files.has(normalized)) {
      return normalized;
    }
    
    // Try with .js extension
    if (this.files.has(normalized + '.js')) {
      return normalized + '.js';
    }
    
    return null;
  }

  /**
   * Print analysis results
   */
  printResults() {
    console.log('='.repeat(80));
    console.log('📊 IMPORT/EXPORT ANALYSIS RESULTS');
    console.log('='.repeat(80) + '\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ No import/export issues found!\n');
      return;
    }
    
    // Group errors by type
    const errorsByType = new Map();
    for (const error of this.errors) {
      if (!errorsByType.has(error.type)) {
        errorsByType.set(error.type, []);
      }
      errorsByType.get(error.type).push(error);
    }
    
    // Print errors
    if (this.errors.length > 0) {
      console.log(`🔴 ${this.errors.length} ERRORS FOUND:\n`);
      
      let counter = 1;
      for (const [type, errors] of errorsByType) {
        console.log(`\n${type} (${errors.length} issues):`);
        console.log('-'.repeat(80));
        
        for (const error of errors) {
          console.log(`\n${counter}. ${error.file}`);
          console.log(`   ${error.message}`);
          if (error.name) {
            console.log(`   Missing: "${error.name}"`);
          }
          counter++;
        }
      }
      console.log('\n');
    }
    
    // Print warnings
    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} WARNINGS FOUND:\n`);
      
      const warningsByFile = new Map();
      for (const warning of this.warnings) {
        if (!warningsByFile.has(warning.file)) {
          warningsByFile.set(warning.file, []);
        }
        warningsByFile.get(warning.file).push(warning);
      }
      
      let counter = 1;
      for (const [file, warnings] of warningsByFile) {
        console.log(`\n${counter}. ${file} (${warnings.length} issues)`);
        for (const warning of warnings) {
          console.log(`   - ${warning.message}`);
        }
        counter++;
      }
      console.log('\n');
    }
    
    console.log('='.repeat(80));
    console.log('📈 SUMMARY:');
    console.log(`   Files Scanned: ${this.files.size}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log('='.repeat(80) + '\n');
  }
}

// Run the analyzer
async function main() {
  const analyzer = new ImportExportAnalyzer();
  await analyzer.scanProject();
  analyzer.validate();
  analyzer.printResults();
  
  // Exit with error code if issues found
  process.exit(analyzer.errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
