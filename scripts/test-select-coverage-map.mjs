import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { isMainModule } from './lib/is-main-module.mjs';
import { discoverTestFiles } from './run-tests.mjs';

// Per-file ceiling for one `node --test <file>` coverage run. The slowest
// real test files take tens of seconds on a loaded runner; anything past this
// is a hang, recorded as `coverage-collection-timeout` for that file, never a
// reason to stall the whole job.
export const COVERAGE_FILE_TIMEOUT_MS = 5 * 60 * 1000;
// Small bounded pool: each test file may itself spawn git/node children, so
// running all of them at once would only trade a hang for contention.
export const COVERAGE_CONCURRENCY = Math.max(1, Math.min(4, os.cpus().length));

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
  console.log("Running coverage-map generator (static + NODE_V8_COVERAGE)...");
  
  const repoRoot = process.cwd();
  const testFiles = getFiles(path.join(repoRoot, 'test'));
  // Only real suite files (`*.test.mjs`, same discovery as `npm test`) count
  // as tests; helpers, fixtures and worker scripts under test/ stay in the
  // import graph (a suite may reach src/ through them) but are not suites.
  const suiteFiles = discoverTestFiles(path.join(repoRoot, 'test'));
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
  for (const testFile of suiteFiles) {
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

  


  // If NODE_V8_COVERAGE is set, use it (assumed to be populated by per-process runs),
  // otherwise run the tests ourselves one file per process to get accurate per-test coverage.
  let covDirToProcess = process.env.NODE_V8_COVERAGE;
  let selfGenerated = false;
  let collection = null;

  if (!covDirToProcess) {
    console.log(`NODE_V8_COVERAGE not set. Collecting coverage for ${suiteFiles.length} test files (concurrency ${COVERAGE_CONCURRENCY}, ${COVERAGE_FILE_TIMEOUT_MS / 1000}s per file)...`);
    covDirToProcess = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coverage-'));
    selfGenerated = true;
    collection = await collectPerFileCoverage(suiteFiles, {
      repoRoot,
      covRoot: covDirToProcess,
      onResult: (r, done, total) => console.log(`[${done}/${total}] ${r.outcome} ${(r.durationMs / 1000).toFixed(1)}s ${r.file}`),
    });
    for (const r of collection.results) {
      for (const srcRel of coveredSourceFiles(r.covDir, repoRoot)) {
        if (!mapping[srcRel]) mapping[srcRel] = new Set();
        mapping[srcRel].add(r.file);
      }
    }
    fs.rmSync(covDirToProcess, { recursive: true, force: true });
    const timedOut = collection.results.filter((r) => r.outcome === 'coverage-collection-timeout');
    console.log(`Coverage collection finished in ${(collection.durationMs / 60000).toFixed(1)} min; ${timedOut.length} file(s) timed out${timedOut.length ? `: ${timedOut.map((r) => r.file).join(', ')}` : ''}.`);
  }

  if (covDirToProcess && !selfGenerated && fs.existsSync(covDirToProcess)) {
    console.log("Merging NODE_V8_COVERAGE data...");
    const covFiles = fs.readdirSync(covDirToProcess).filter(f => f.endsWith('.json'));
    for (const file of covFiles) {
      const covPath = path.join(covDirToProcess, file);
      try {
        const data = JSON.parse(fs.readFileSync(covPath, 'utf8'));
        // Find the test file in this coverage profile
        let testScript = null;
        for (const res of data.result || []) {
          if (res.url.includes('/test/') && (res.url.endsWith('.test.mjs') || res.url.endsWith('.mjs'))) {
            const urlObj = new URL(res.url);
            testScript = path.relative(repoRoot, urlObj.pathname).replace(/\\/g, '/');
            break;
          }
        }
        
        if (testScript) {
          for (const res of data.result || []) {
            if (res.url.includes('/src/') || res.url.includes('/bin/')) {
              const urlObj = new URL(res.url);
              const srcRel = path.relative(repoRoot, urlObj.pathname).replace(/\\/g, '/');
              if (srcRel.startsWith('src/') || srcRel.startsWith('bin/')) {
                if (!mapping[srcRel]) mapping[srcRel] = new Set();
                mapping[srcRel].add(testScript);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse coverage file", file, e);
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
    suggestedFullTriggers: Array.from(fullTriggers).sort(),
    ...(collection ? {
      coverageCollection: {
        durationMs: collection.durationMs,
        timedOut: collection.results.filter((r) => r.outcome === 'coverage-collection-timeout').map((r) => r.file),
        failed: collection.results.filter((r) => r.outcome === 'test-failed').map((r) => r.file),
      },
    } : {}),
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

/** Source files (`src/`, `bin/`) a V8 coverage directory says were loaded. */
function coveredSourceFiles(covDir, repoRoot) {
  const found = new Set();
  if (!fs.existsSync(covDir)) return found;
  for (const file of fs.readdirSync(covDir).filter((f) => f.endsWith('.json'))) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(covDir, file), 'utf8'));
      for (const res of data.result || []) {
        if (!res.url.startsWith('file:')) continue;
        const srcRel = path.relative(repoRoot, new URL(res.url).pathname).replace(/\\/g, '/');
        if (srcRel.startsWith('src/') || srcRel.startsWith('bin/')) found.add(srcRel);
      }
    } catch {
      // a partially written profile (killed on timeout) is simply skipped
    }
  }
  return found;
}

/**
 * Run `node --test <file>` once per file with NODE_V8_COVERAGE pointed at a
 * per-file directory, at most `concurrency` at a time, each bounded by
 * `timeoutMs`. A file that overruns has its whole process group killed (test
 * files spawn their own children) and is reported as
 * `coverage-collection-timeout`; collection always continues with the next
 * file. Test failures are expected here and only recorded.
 */
export async function collectPerFileCoverage(testFiles, {
  repoRoot,
  covRoot,
  timeoutMs = COVERAGE_FILE_TIMEOUT_MS,
  concurrency = COVERAGE_CONCURRENCY,
  execPath = process.execPath,
  env = process.env,
  onResult = () => {},
} = {}) {
  const startedAt = Date.now();
  const results = [];
  let next = 0;

  const runOne = (absFile) => new Promise((resolve) => {
    const file = path.relative(repoRoot, absFile).replace(/\\/g, '/');
    const covDir = path.join(covRoot, encodeURIComponent(file));
    fs.mkdirSync(covDir, { recursive: true });
    const t0 = Date.now();
    // NODE_TEST_CONTEXT is set by an enclosing `node --test` run; inherited,
    // it makes this nested `node --test` report to a parent that is not
    // listening and exit without running the file.
    const { NODE_TEST_CONTEXT: _enclosingRunner, ...childEnv } = env;
    const child = spawn(execPath, ['--test', absFile], {
      cwd: repoRoot,
      env: { ...childEnv, NODE_V8_COVERAGE: covDir, FGOS_DISABLE_OPPORTUNISTIC_CHECKS: '1' },
      stdio: 'ignore',
      detached: process.platform !== 'win32',
    });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        if (process.platform !== 'win32') process.kill(-child.pid, 'SIGKILL');
        else child.kill('SIGKILL');
      } catch {
        // already gone
      }
    }, timeoutMs);
    const finish = (outcome) => {
      clearTimeout(timer);
      resolve({ file, covDir, outcome, durationMs: Date.now() - t0 });
    };
    child.on('error', () => finish('spawn-failed'));
    child.on('exit', (code) => finish(timedOut ? 'coverage-collection-timeout' : code === 0 ? 'ok' : 'test-failed'));
  });

  const worker = async () => {
    while (next < testFiles.length) {
      const result = await runOne(testFiles[next++]);
      results.push(result);
      onResult(result, results.length, testFiles.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, testFiles.length) }, worker));
  return { results, durationMs: Date.now() - startedAt };
}

if (isMainModule(import.meta.url)) {
  generateCoverageMap().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
