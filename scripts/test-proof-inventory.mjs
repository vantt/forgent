#!/usr/bin/env node
// test-proof-inventory.mjs -- P00A proof/duplication inventory (ITR-D13,
// ITR-D15). Builds a machine-readable inventory of expensive/duplicated
// test sites with a shared responsibility vocabulary, WITHOUT deleting,
// skipping or rewriting any test. Every entry gets exactly one primary
// responsibility or the explicit 'unknown' -- classification here is
// mechanical (directory convention, static call shape, an unambiguous
// keyword) on purpose: a guessed label would be worse than an honest
// 'unknown', which the plan explicitly allows and does not count as a
// savings/deletion signal.
//
// Two independent inventory sources feed one shared JSON schema:
//   1. static `run(cwd, ['init'])` call sites in an explicit file list
//      (P02's nine-file lease) -- classified by call shape.
//   2. top-N tests/files from an already-captured JUnit profile (see
//      scripts/test-timing.mjs `profile`) -- classified by directory
//      convention/keyword only.
//
// This also implements a warning-only admission check (`--check`): it
// flags NEW violations of three narrow rules in files under a caller-given
// "onboarded" scope, compared against a committed baseline count. It never
// fails on pre-existing debt and never requires annotating the whole
// suite.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './run-tests.mjs';

export const RESPONSIBILITIES = Object.freeze([
  'direct-business-proof',
  'fixture-construction',
  'process-contract',
  'git-process-integration',
  'cross-language-packaging',
  'large-state-artifact-boundary',
  'concurrency-timing',
  'unknown',
]);

// -- 1. static `run(cwd, ['init'])` call-site scan (P02 nine-file lease) --

const RUN_INIT_RE = /\brun\(\s*([A-Za-z_$][\w$]*)\s*,\s*\[\s*'init'\s*\]\s*\)/;
const CWD_CTOR_RE = (varName) =>
  new RegExp(`\\b(?:const|let)\\s+(?:\\{[^}]*\\b${varName}\\b[^}]*\\}|${varName})\\s*=\\s*([A-Za-z_$][\\w$]*)\\s*\\(`);

/**
 * Scans one file's source text for bare `run(cwdVar, ['init'])` call sites.
 * Returns raw site facts only (no classification) so the classifier stays
 * separately testable.
 */
export function scanRunInitSites(fileContent, filePath) {
  const lines = fileContent.split('\n');
  const sites = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const m = RUN_INIT_RE.exec(line);
    if (!m) continue;
    const cwdVar = m[1];
    // A site "resultUsed" when this same statement assigns/consumes the
    // return value (e.g. `const r = run(cwd, ['init']);` or
    // `assert.equal(run(cwd, ['init']).status, 0)`), as opposed to a bare
    // fire-and-forget `run(cwd, ['init']);` statement.
    const resultUsed = /=\s*run\(|\brun\(\s*[A-Za-z_$][\w$]*\s*,\s*\[\s*'init'\s*\]\s*\)\s*\./.test(line);
    const ctorName = resolveCwdConstructor(lines, i, cwdVar);
    sites.push({
      file: filePath,
      line: i + 1,
      cwdVar,
      resultUsed,
      cwdConstructor: ctorName,
      raw: line.trim(),
    });
  }
  return sites;
}

/**
 * Walks backward from `fromLineIdx` for the nearest `const`/`let` binding
 * of `varName` (plain or destructured `{ cwd }`) and returns the name of
 * the function called on the right-hand side, or null if none is found
 * within the same file (never guessed across file boundaries).
 */
export function resolveCwdConstructor(lines, fromLineIdx, varName) {
  const re = CWD_CTOR_RE(varName);
  for (let i = fromLineIdx; i >= 0; i -= 1) {
    const m = re.exec(lines[i]);
    if (m) return m[1];
  }
  return null;
}

/**
 * Classifies one scanned run-init site into the shared taxonomy. Mechanical
 * only: a discarded result with a non-subdir constructor is
 * fixture-construction (eligible for P02's fast-fixture substitution); a
 * discarded result whose cwd was built via a subdir-named constructor is
 * process-contract (P06 precedent: over-broad replacement broke subdir
 * cases, so cwd/subdir resolution retains the real subprocess); a
 * consumed result needs a human read and is left `unknown` rather than
 * guessed.
 */
export function classifyRunInitSite(site) {
  if (site.resultUsed) {
    return {
      primaryResponsibility: 'unknown',
      disposition: 'retain',
      reason: 'run(...) result is consumed by the caller; whether init itself is asserted needs a manual read, not a guess',
    };
  }
  if (site.cwdConstructor && /subdir/i.test(site.cwdConstructor)) {
    return {
      primaryResponsibility: 'process-contract',
      disposition: 'retain',
      reason: `cwd built via ${site.cwdConstructor}(); fgos init's own cwd/subdir resolution is the fixture location under test (P06 precedent: over-broad fast-fixture replacement broke subdir cases)`,
    };
  }
  return {
    primaryResponsibility: 'fixture-construction',
    disposition: 'optimize-execution',
    reason: 'result discarded; ordinary precondition-only fgos init call with no subdir-cwd construction',
  };
}

export function inventoryRunInitSites(files, { readFile = (f) => fs.readFileSync(f, 'utf8'), repoRoot = REPO_ROOT } = {}) {
  const entries = [];
  for (const relFile of files) {
    const abs = path.join(repoRoot, relFile);
    let content;
    try {
      content = readFile(abs);
    } catch {
      continue; // file absent from this tree; not a guess, just skip
    }
    for (const site of scanRunInitSites(content, relFile)) {
      const cls = classifyRunInitSite(site);
      entries.push({
        testId: `${relFile}::run-init@L${site.line}`,
        file: relFile,
        durationSeconds: null,
        primaryResponsibility: cls.primaryResponsibility,
        invariantId: null,
        productionGuard: null,
        boundary: 'cli-process',
        historicalFaultRefs: [],
        subprocesses: ['fgos init'],
        fixture: site.cwdConstructor,
        overlapCandidates: [],
        evidenceLevel: 'static',
        disposition: cls.disposition,
        note: cls.reason,
      });
    }
  }
  return entries;
}

// -- 2. profile-driven top-N test/file classification --

const DIR_RULES = [
  // Strong, structural signal only: rust-host tests genuinely cross the
  // Rust/Node package boundary by directory convention (see docs/specs
  // and P00's baseline report), not a content guess.
  { test: (dir) => dir === 'rust-host', responsibility: 'cross-language-packaging', reason: 'test/rust-host/** exercises the real Rust binary across the package boundary' },
];

const NAME_KEYWORD_RULES = [
  // Only names that literally say what they are, no inference.
  { test: (name) => /\b(concurrent|concurrently|racing|race\b|idle timeout|lock contention)\b/i.test(name), responsibility: 'concurrency-timing', reason: 'test name explicitly names a concurrency/timing race' },
];

function dirBucket(absFile, repoRoot) {
  const rel = path.relative(path.join(repoRoot, 'test'), absFile);
  const parts = rel.split(path.sep);
  return parts.length > 1 ? parts[0] : '(test root)';
}

export function classifyProfiledTest({ name, file }, { repoRoot = REPO_ROOT } = {}) {
  for (const rule of NAME_KEYWORD_RULES) {
    if (rule.test(name)) return { primaryResponsibility: rule.responsibility, reason: rule.reason };
  }
  const dir = dirBucket(file, repoRoot);
  for (const rule of DIR_RULES) {
    if (rule.test(dir)) return { primaryResponsibility: rule.responsibility, reason: rule.reason };
  }
  return { primaryResponsibility: 'unknown', reason: 'no mechanical directory/keyword signal; needs a manual read, not guessed' };
}

export function inventoryProfiledTests(topTests, { repoRoot = REPO_ROOT } = {}) {
  return topTests.map((t) => {
    const cls = classifyProfiledTest(t, { repoRoot });
    const relFile = path.relative(repoRoot, t.file);
    return {
      testId: `${relFile}::${t.name}`,
      file: relFile,
      durationSeconds: t.time,
      primaryResponsibility: cls.primaryResponsibility,
      invariantId: null,
      productionGuard: null,
      boundary: null,
      historicalFaultRefs: [],
      subprocesses: [],
      fixture: null,
      overlapCandidates: [],
      evidenceLevel: 'measured',
      disposition: 'retain',
      note: cls.reason,
    };
  });
}

/**
 * Per-file rollup for the top-N files by total profiled time. This is
 * orientation, not a per-test classification: a file mixing many
 * responsibilities is left `unknown` at the file level even though
 * individual tests within it may be classified elsewhere (e.g. via
 * inventoryRunInitSites for the P02 nine files).
 */
export function inventoryProfiledFiles(topFiles, { repoRoot = REPO_ROOT } = {}) {
  return topFiles.map((f) => {
    const relFile = path.relative(repoRoot, f.file);
    const dir = dirBucket(f.file, repoRoot);
    const rule = DIR_RULES.find((r) => r.test(dir));
    return {
      testId: `${relFile}::(file-rollup)`,
      file: relFile,
      durationSeconds: f.totalSeconds,
      testCount: f.count,
      primaryResponsibility: rule ? rule.responsibility : 'unknown',
      invariantId: null,
      productionGuard: null,
      boundary: null,
      historicalFaultRefs: [],
      subprocesses: [],
      fixture: null,
      overlapCandidates: [],
      evidenceLevel: 'static',
      disposition: 'retain',
      note: rule ? rule.reason : 'file mixes tests across responsibilities; no single file-level label without reading each test',
    };
  });
}

// -- 3. warning-only admission check (baseline ratchet) --

const ADMISSION_RULES = [
  {
    id: 'new-fixture-only-init-without-reason',
    // A brand-new `run(cwd, ['init'])`/`run(cwd, ['init', ...])` call with
    // no adjacent `// boundary:` marker comment on the same or previous line.
    test: (line, prevLine) => /\brun\(\s*[A-Za-z_$][\w$]*\s*,\s*\[\s*'init'/.test(line) && !/\/\/\s*boundary:/.test(line) && !/\/\/\s*boundary:/.test(prevLine ?? ''),
    message: 'new fgos init call site with no `// boundary:` reason marker',
  },
  {
    id: 'new-real-provider-network-without-marker',
    test: (line, prevLine) => /\b(fetch|https?\.request|WebSocket)\(/.test(line) && !/\/\/\s*provider-boundary:/.test(line) && !/\/\/\s*provider-boundary:/.test(prevLine ?? ''),
    message: 'new real network call with no `// provider-boundary:` reason marker',
  },
];

/**
 * Scans `changedLines` (from a unified diff's added lines, one per array
 * entry as `{ file, line, text, prevText }`) for new admission-rule
 * violations. Returns only violations not already present in `baseline`
 * (an array of `{ ruleId, file, line }` previously accepted). Warning-only:
 * callers decide whether a violation is fatal.
 */
export function checkAdmission(changedLines, baseline = []) {
  const baselineKeys = new Set(baseline.map((b) => `${b.ruleId}::${b.file}::${b.line}`));
  const violations = [];
  for (const { file, line, text, prevText } of changedLines) {
    for (const rule of ADMISSION_RULES) {
      if (!rule.test(text, prevText)) continue;
      const key = `${rule.id}::${file}::${line}`;
      if (baselineKeys.has(key)) continue;
      violations.push({ ruleId: rule.id, file, line, message: rule.message });
    }
  }
  return violations;
}

/**
 * Builds `{ file, line, text, prevText }` rows for every added line in
 * `git diff <baseRef> -- <scope>` restricted to onboarded files. Only
 * additions are checked (never pre-existing debt).
 */
export function addedLinesFromGitDiff(scopeFiles, { baseRef = 'HEAD', exec = execFileSync, cwd = REPO_ROOT } = {}) {
  if (scopeFiles.length === 0) return [];
  const raw = exec('git', ['diff', '--unified=0', baseRef, '--', ...scopeFiles], { cwd, encoding: 'utf8' });
  const rows = [];
  let currentFile = null;
  let nextLine = null;
  let prevText = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      prevText = null;
      continue;
    }
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (hunk) {
      nextLine = Number(hunk[1]);
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      rows.push({ file: currentFile, line: nextLine, text: line.slice(1), prevText });
      prevText = line.slice(1);
      nextLine += 1;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      // deletions don't advance the new-file line counter
    } else if (!line.startsWith('\\')) {
      prevText = null;
    }
  }
  return rows;
}

// -- CLI entrypoint --

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  if (args[0] === '--check') {
    const scopeIdx = args.indexOf('--scope');
    const scopeFiles = scopeIdx === -1 ? [] : args[scopeIdx + 1].split(',');
    const baselineIdx = args.indexOf('--baseline');
    const baselinePath = baselineIdx === -1 ? null : args[baselineIdx + 1];
    const baseline = baselinePath && fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : [];
    const changed = addedLinesFromGitDiff(scopeFiles);
    const violations = checkAdmission(changed, baseline);
    if (violations.length > 0) {
      console.log(`WARNING: ${violations.length} new admission-check violation(s):`);
      for (const v of violations) console.log(`  ${v.file}:${v.line} [${v.ruleId}] ${v.message}`);
    } else {
      console.log('No new admission-check violations.');
    }
    process.exitCode = 0; // warning-only: never fails the build in this track
  } else {
    console.error('Usage: node scripts/test-proof-inventory.mjs --check --scope <files> [--baseline <path>]');
    process.exitCode = 1;
  }
}
