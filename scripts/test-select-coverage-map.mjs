import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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
  const srcFiles = [...getFiles(path.join(repoRoot, 'src')), ...getFiles(path.join(repoRoot, 'bin'))];
  
  const mapping = {}; // sourcePath -> Set of testPaths
  const fullTriggers = new Set();
  
  const importRegex = /import\s+[\s\S]*?from\s+['"](.*?)['"]/g;
  const dynamicImportLiteralRegex = /import\s*\(\s*['"](.*?)['"]\s*\)/g;
  const computedImportRegex = /import\s*\(\s*[^'"]+\s*\)/; // No /g for .test()

  // Build dependency graph: srcFile -> Set of files it imports
  const deps = {};
  for (const file of [...srcFiles, ...testFiles]) {
    const content = fs.readFileSync(file, 'utf8');
    const fileRel = path.relative(repoRoot, file).replace(/\\/g, '/');
    deps[fileRel] = new Set();

    if (computedImportRegex.test(content) && !fileRel.startsWith('test/')) {
      fullTriggers.add(fileRel); // Add source files with computed imports
    }

    const matches = [...content.matchAll(importRegex), ...content.matchAll(dynamicImportLiteralRegex)];
    for (const match of matches) {
      const importedPath = match[1];
      if (importedPath.startsWith('.')) {
        const absImport = path.resolve(path.dirname(file), importedPath);
        if (absImport.startsWith(repoRoot)) {
          let srcRel = path.relative(repoRoot, absImport).replace(/\\/g, '/');
          if (!srcRel.endsWith('.mjs') && !srcRel.endsWith('.js')) {
            if (fs.existsSync(absImport + '.mjs')) srcRel += '.mjs';
            else if (fs.existsSync(absImport + '/index.mjs')) srcRel += '/index.mjs';
          }
          deps[fileRel].add(srcRel);
        }
      }
    }
  }

  // Transitive closure: which source files does a test file eventually import?
  for (const testFile of testFiles) {
    const testRel = path.relative(repoRoot, testFile).replace(/\\/g, '/');
    const visited = new Set();
    const queue = Array.from(deps[testRel] || []);
    
    while (queue.length > 0) {
      const dep = queue.shift();
      if (!visited.has(dep)) {
        visited.add(dep);
        
        if (dep.startsWith('src/') || dep.startsWith('bin/')) {
          if (!mapping[dep]) mapping[dep] = new Set();
          mapping[dep].add(testRel);
        }
        
        if (deps[dep]) {
          queue.push(...deps[dep]);
        }
      }
    }
  }

  // Also include the missing rule from reviewer: intake-verify-pattern-check
  // (We'll verify if it gets added by transitive closure, if not, it means the tests don't statically import it, so we might need V8 coverage. But static closure should be better).

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
