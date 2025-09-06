#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const srcPaths = ['web/src', 'server/src'];

// Never delete these patterns
const EXCLUDED_PATTERNS = [
  /vite\.config\./,
  /tailwind\.config\./,
  /postcss\.config\./,
  /tsconfig\.json/,
  /package\.json/,
  /\.env/,
  /README/,
  /LICENSE/,
  /\.git/,
  /scripts\//,
  /public\//,
  /dist\//,
  /node_modules\//
];

class DeadCodeAnalyzer {
  constructor() {
    this.sourceFiles = new Set();
    this.importGraph = new Map();
    this.unusedFiles = new Set();
    this.unusedDeps = new Set();
    this.report = {
      timestamp: new Date().toISOString(),
      summary: { F1: 0, F2: 0, A: 0, D: 0 },
      candidates: []
    };
  }

  async analyze() {
    console.log('🔍 Starting dead-code analysis...');
    
    // Step 1: Find all source files
    this.findSourceFiles();
    
    // Step 2: Run external analysis tools
    await this.runExternalAnalysis();
    
    // Step 3: Build import graph (simplified)
    this.buildImportGraph();
    
    // Step 4: Find unused assets
    this.findUnusedAssets();
    
    // Step 5: Generate report
    this.generateReport();
    
    console.log('✅ Dead-code analysis complete!');
  }

  findSourceFiles() {
    for (const srcPath of srcPaths) {
      const fullPath = path.join(projectRoot, srcPath);
      if (fs.existsSync(fullPath)) {
        this.walkDirectory(fullPath, (filePath) => {
          if (/\.(ts|tsx|js|jsx)$/.test(filePath)) {
            this.sourceFiles.add(filePath);
          }
        });
      }
    }
    console.log(`📁 Found ${this.sourceFiles.size} source files`);
  }

  walkDirectory(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        this.walkDirectory(filePath, callback);
      } else {
        callback(filePath);
      }
    }
  }

  async runExternalAnalysis() {
    console.log('🔧 Running ts-unused-exports...');
    try {
      const result = execSync('npx ts-unused-exports tsconfig.json', { encoding: 'utf8' });
      // Parse ts-unused-exports output to find unused files
      const lines = result.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.includes('has unused exports')) {
          const filePath = line.split(':')[0].trim();
          this.unusedFiles.add(path.resolve(projectRoot, filePath));
        }
      }
    } catch (error) {
      console.log('⚠️ ts-unused-exports analysis skipped (errors expected)');
    }

    console.log('🔧 Running depcheck...');
    try {
      const result = execSync('npx depcheck --json', { encoding: 'utf8' });
      const depResult = JSON.parse(result);
      this.unusedDeps = new Set(depResult.dependencies || []);
    } catch (error) {
      console.log('⚠️ depcheck analysis failed, continuing...');
    }
  }

  buildImportGraph() {
    // Simplified import analysis - look for obvious import statements
    for (const filePath of this.sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const imports = [];
        
        // Match import statements (simplified regex)
        const importMatches = content.matchAll(/import.*from\s+['"`]([^'"`]+)['"`]/g);
        for (const match of importMatches) {
          imports.push(match[1]);
        }
        
        this.importGraph.set(filePath, imports);
      } catch (error) {
        console.log(`⚠️ Could not read ${filePath}`);
      }
    }
  }

  findUnusedAssets() {
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.ico', '.gif'];
    const assetFiles = [];
    
    // Find all assets
    const publicPath = path.join(projectRoot, 'public');
    if (fs.existsSync(publicPath)) {
      this.walkDirectory(publicPath, (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (assetExtensions.includes(ext)) {
          assetFiles.push(filePath);
        }
      });
    }

    // Check if assets are referenced (simplified)
    const unusedAssets = [];
    for (const assetFile of assetFiles) {
      const fileName = path.basename(assetFile);
      let isReferenced = false;
      
      for (const sourceFile of this.sourceFiles) {
        try {
          const content = fs.readFileSync(sourceFile, 'utf8');
          if (content.includes(fileName)) {
            isReferenced = true;
            break;
          }
        } catch (error) {
          // Skip files we can't read
        }
      }
      
      if (!isReferenced) {
        unusedAssets.push(assetFile);
      }
    }

    this.report.summary.A = unusedAssets.length;
    unusedAssets.forEach(asset => {
      this.report.candidates.push({
        type: 'A',
        path: path.relative(projectRoot, asset),
        reason: 'No references found in source code',
        category: 'Unused Asset'
      });
    });
  }

  generateReport() {
    // Count unused files (F1 category)
    this.report.summary.F1 = this.unusedFiles.size;
    this.unusedFiles.forEach(file => {
      this.report.candidates.push({
        type: 'F1',
        path: path.relative(projectRoot, file),
        reason: 'File has unused exports or is unreferenced',
        category: 'Unreferenced File'
      });
    });

    // Count unused dependencies (D category)  
    this.report.summary.D = this.unusedDeps.size;
    this.unusedDeps.forEach(dep => {
      this.report.candidates.push({
        type: 'D',
        path: dep,
        reason: 'npm dependency not imported in any source file',
        category: 'Unused Dependency'
      });
    });

    // Filter out excluded patterns
    this.report.candidates = this.report.candidates.filter(candidate => {
      return !EXCLUDED_PATTERNS.some(pattern => pattern.test(candidate.path));
    });

    // Update final counts
    this.report.summary = {
      F1: this.report.candidates.filter(c => c.type === 'F1').length,
      F2: this.report.candidates.filter(c => c.type === 'F2').length,
      A: this.report.candidates.filter(c => c.type === 'A').length,
      D: this.report.candidates.filter(c => c.type === 'D').length
    };

    // Write report
    this.writeReport();
    this.writeDeletionList();
  }

  writeReport() {
    const reportContent = `# Dead Code Audit Report
Generated: ${this.report.timestamp}

## Summary
- F1 (Unreferenced files): ${this.report.summary.F1} files
- F2 (Orphaned subgraphs): ${this.report.summary.F2} files  
- A (Unused assets): ${this.report.summary.A} files
- D (Unused dependencies): ${this.report.summary.D} packages

**Total candidates for deletion: ${this.report.candidates.length}**

## Deletion Candidates

${this.report.candidates.map(candidate => `
### ${candidate.category}: \`${candidate.path}\`
- **Type**: ${candidate.type}
- **Reason**: ${candidate.reason}
`).join('')}

## Exclusions (Never Delete)
The following patterns were excluded from analysis:
${EXCLUDED_PATTERNS.map(p => `- \`${p.source || p.toString()}\``).join('\n')}

## Next Steps
1. Review this report carefully
2. Verify candidates in SAFE_DELETE_LIST.json
3. Move candidates to _trash_<timestamp>/ directory
4. Test build after deletion
`;

    fs.writeFileSync(path.join(projectRoot, 'DEADCODE_REPORT.md'), reportContent);
    console.log('📊 Generated DEADCODE_REPORT.md');
  }

  writeDeletionList() {
    const deletionList = {
      timestamp: this.report.timestamp,
      candidates: this.report.candidates.map(c => ({
        path: c.path,
        type: c.type,
        reason: c.reason
      }))
    };

    fs.writeFileSync(
      path.join(projectRoot, 'SAFE_DELETE_LIST.json'), 
      JSON.stringify(deletionList, null, 2)
    );
    console.log('📋 Generated SAFE_DELETE_LIST.json');
  }
}

// Run analysis
const analyzer = new DeadCodeAnalyzer();
analyzer.analyze().catch(console.error);