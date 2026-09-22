import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// A simple static ESM parser that finds imports to build a coverage map.
// This is the "static closure" part of the P3-07 generator H2.
// In a full implementation, it would also merge with NODE_V8_COVERAGE dynamic traces.

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const res = path.resolve(dir, file);
    if (fs.statSync(res).isDirectory()) {
      getFiles(res, files);
    } else if (res.endsWith('.mjs') || res.endsWith('.js')) {
      files.push(res);
    }
  }
  return files;
}

async function generateCoverageMap() {
  console.log("Running coverage-map generator (static analysis fallback)...");
  
  const repoRoot = process.cwd();
  const testFiles = getFiles(path.join(repoRoot, 'test'));
  const mapping = {}; // sourcePath -> Set of testPaths
  const fullTriggers = new Set();
  
  const importRegex = /import\s+[\s\S]*?from\s+['"](.*?)['"]/g;
  const dynamicImportLiteralRegex = /import\s*\(\s*['"](.*?)['"]\s*\)/g;
  const computedImportRegex = /import\s*\(\s*[^'"].*?\)/g;

  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf8');
    const testRel = path.relative(repoRoot, testFile).replace(/\\/g, '/');
    
    if (computedImportRegex.test(content)) {
      fullTriggers.add(testRel);
    }

    const matches = [...content.matchAll(importRegex), ...content.matchAll(dynamicImportLiteralRegex)];
    for (const match of matches) {
      const importedPath = match[1];
      if (importedPath.startsWith('.')) {
        const absImport = path.resolve(path.dirname(testFile), importedPath);
        if (absImport.startsWith(repoRoot)) {
          let srcRel = path.relative(repoRoot, absImport).replace(/\\/g, '/');
          // Add .mjs extension if omitted, as Node resolution might do
          if (!srcRel.endsWith('.mjs') && !srcRel.endsWith('.js')) {
            if (fs.existsSync(absImport + '.mjs')) srcRel += '.mjs';
            else if (fs.existsSync(absImport + '/index.mjs')) srcRel += '/index.mjs';
          }
          
          if (srcRel.startsWith('src/') || srcRel.startsWith('bin/')) {
            if (!mapping[srcRel]) mapping[srcRel] = new Set();
            mapping[srcRel].add(testRel);
          }
        }
      }
    }
  }

  // Convert Sets to Arrays
  const finalMapping = {};
  for (const [src, tests] of Object.entries(mapping)) {
    finalMapping[src] = Array.from(tests).sort();
  }

  const outDir = 'plans/260922-test-suite-optimization/reports';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  fs.writeFileSync(path.join(outDir, `coverage-map-${date}.json`), JSON.stringify({
    version: 1,
    generatedAt: new Date().toISOString(),
    mapping: finalMapping,
    suggestedFullTriggers: Array.from(fullTriggers).sort()
  }, null, 2));

  // Generate simple markdown suggestion diff
  let md = `# Coverage Suggestion Diff\n\n`;
  for (const src of Object.keys(finalMapping).sort()) {
    if (src.startsWith('src/verbs/state/')) {
      md += `\n### \`${src}\`\n`;
      for (const t of finalMapping[src]) {
        md += `- ${t}\n`;
      }
    }
  }
  fs.writeFileSync(path.join(outDir, `coverage-suggestion-${date}.md`), md);
  
  console.log("Coverage map generated.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateCoverageMap().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
