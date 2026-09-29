import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

function mjsFilesUnder(dir) {
  const result = [];
  function walk(current) {
    const full = path.join(REPO_ROOT, current);
    if (!fs.existsSync(full)) return;
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      const rel = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(rel);
      } else if (entry.isFile() && rel.endsWith('.mjs')) {
        result.push(rel);
      }
    }
  }
  walk(dir);
  return result;
}

/**
 * Scan source code for prohibited direct property access (.status / .confidence)
 * or destructuring ({ status } / { confidence }) on RunResult reader variables.
 *
 * @param {string} sourceCode
 * @param {string} filePath
 * @returns {Array<{line: number, match: string, reason: string}>}
 */
export function scanRunResultStatusAccess(sourceCode, filePath) {
  // Strip comments and string literals to avoid false positives in logs or comments
  const clean = sourceCode
    .replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
    .replace(/\/\/.*$/gm, (m) => ' '.repeat(m.length));

  const violations = [];
  const lines = clean.split('\n');

  // Identify reader variables assigned from readLinkedRunResultFromDisk, readRunResultForAssignment, or interpretRunResult
  const readerPatterns = [
    /const\s+(\w+)\s*=\s*(?:await\s+)?(?:readLinkedRunResultFromDisk|readRunResultForAssignment|interpretRunResult)\s*\(/g,
    /let\s+(\w+)\s*=\s*(?:await\s+)?(?:readLinkedRunResultFromDisk|readRunResultForAssignment|interpretRunResult)\s*\(/g,
    /var\s+(\w+)\s*=\s*(?:await\s+)?(?:readLinkedRunResultFromDisk|readRunResultForAssignment|interpretRunResult)\s*\(/g,
  ];

  const readerVars = new Set(['runResult']); // runResult is the canonical variable name across runner
  for (const pat of readerPatterns) {
    let m;
    while ((m = pat.exec(clean)) !== null) {
      readerVars.add(m[1]);
    }
  }

  // 1. Direct destructuring at call site: const { status, ... } = readLinkedRunResultFromDisk(...)
  const destructureCallPattern =
    /(?:const|let|var)\s*\{[^}]*?\b(status|confidence)\b[^}]*?\}\s*=\s*(?:await\s+)?(?:readLinkedRunResultFromDisk|readRunResultForAssignment|interpretRunResult|outcome\.runResult)\b/g;
  let dm;
  while ((dm = destructureCallPattern.exec(clean)) !== null) {
    const lineNum = clean.slice(0, dm.index).split('\n').length;
    violations.push({
      line: lineNum,
      match: dm[0],
      reason: `Direct destructuring of "${dm[1]}" from RunResult reader at line ${lineNum}`,
    });
  }

  // 2. Destructuring from reader variable: const { status } = runResult;
  for (const v of readerVars) {
    const varDestructurePattern = new RegExp(
      `(?:const|let|var)\\s*\\{[^}]*?\\b(status|confidence)\\b[^}]*?\\}\\s*=\\s*${v}\\b`,
      'g',
    );
    let vm;
    while ((vm = varDestructurePattern.exec(clean)) !== null) {
      const lineNum = clean.slice(0, vm.index).split('\n').length;
      violations.push({
        line: lineNum,
        match: vm[0],
        reason: `Destructuring "${vm[1]}" from RunResult variable "${v}" at line ${lineNum}`,
      });
    }

    // 3. Property access: runResult.status or runResult?.status or runResult.confidence
    const propAccessPattern = new RegExp(`\\b${v}\\??\\.(status|confidence)\\b`, 'g');
    let pm;
    while ((pm = propAccessPattern.exec(clean)) !== null) {
      const lineNum = clean.slice(0, pm.index).split('\n').length;
      // Allow if it is an assignment setter (e.g. runResult.status = ...) in dispatch setup,
      // but forbid in reads (===, !==, &&, ||, if, return, argument)
      const afterMatch = clean.slice(pm.index + pm[0].length).trim();
      if (/^=\s*[^=]/.test(afterMatch)) {
        continue;
      }
      violations.push({
        line: lineNum,
        match: pm[0],
        reason: `Direct property access "${pm[0]}" on RunResult variable "${v}" at line ${lineNum}`,
      });
    }
  }

  // 4. Direct outcome.runResult access: outcome.runResult?.status
  const outcomePropPattern = /\boutcome\.runResult\??\.(status|confidence)\b/g;
  let opm;
  while ((opm = outcomePropPattern.exec(clean)) !== null) {
    const lineNum = clean.slice(0, opm.index).split('\n').length;
    // Check if immediately wrapped in fallback or preceded by runOutcome check
    const lineText = lines[lineNum - 1] ?? '';
    if (!lineText.includes('runOutcome')) {
      violations.push({
        line: lineNum,
        match: opm[0],
        reason: `Direct property access "${opm[0]}" without runOutcome at line ${lineNum}`,
      });
    }
  }

  return violations;
}

test('structural source scan: no production file in src/** reads .status/.confidence on RunResult directly', () => {
  const allowedOwnerFiles = new Set([
    // run-result.mjs is the owner of RunResult and defines legacy projections and validators
    'src/runner/dispatch/run-result.mjs',
    // usage-parsers.mjs parses adapter output, not RunResult
    'src/runner/dispatch/usage-parsers.mjs',
  ]);

  const allViolations = [];
  const srcFiles = mjsFilesUnder('src');
  assert.ok(srcFiles.length > 50, `Expected >50 files in src, found ${srcFiles.length}`);

  for (const relPath of srcFiles) {
    if (allowedOwnerFiles.has(relPath)) continue;
    const content = fs.readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
    const violations = scanRunResultStatusAccess(content, relPath);
    for (const v of violations) {
      allViolations.push(`${relPath}:${v.line} - ${v.reason} (${v.match})`);
    }
  }

  assert.deepEqual(
    allViolations,
    [],
    `Found prohibited direct RunResult .status/.confidence reads outside owner files:\n${allViolations.join('\n')}`,
  );
});

test('scanner verification: catches synthetic violations accurately', () => {
  const badSource1 = `
    const runResult = readLinkedRunResultFromDisk(fgosDir, asgnId, runId);
    if (runResult.status === 'failed') {
      doSomething();
    }
  `;
  const v1 = scanRunResultStatusAccess(badSource1, 'test.mjs');
  assert.ok(v1.length >= 1, 'Must detect runResult.status read');

  const badSource2 = `
    const { status, confidence } = readRunResultForAssignment(dir, aId, rId);
  `;
  const v2 = scanRunResultStatusAccess(badSource2, 'test.mjs');
  assert.ok(v2.length >= 1, 'Must detect destructuring at call site');

  const badSource3 = `
    const res = interpretRunResult(raw);
    const isDone = res?.status === 'done';
  `;
  const v3 = scanRunResultStatusAccess(badSource3, 'test.mjs');
  assert.ok(v3.length >= 1, 'Must detect property access on custom variable name');

  const cleanSource = `
    const runResult = readLinkedRunResultFromDisk(fgosDir, asgnId, runId);
    const outcome = runOutcome(runResult);
    if (outcome.category === 'ok') {
      proceed();
    }
  `;
  const vClean = scanRunResultStatusAccess(cleanSource, 'test.mjs');
  assert.deepEqual(vClean, [], 'Must find zero violations in clean runOutcome code');
});
