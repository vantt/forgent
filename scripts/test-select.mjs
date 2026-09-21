#!/usr/bin/env node
// test-select.mjs -- P04 minimal conservative related-test selector.
// Shadow-mode only: this script never claims adoption by itself (ITR-D08).
// A small, auditable, exact-path (never glob) ownership manifest maps
// source files to their direct/boundary tests. Any changed path this
// selector cannot confidently explain -- unknown, a declared full-trigger,
// or unsafe -- escalates the WHOLE run to the full discovered suite. Static
// graph/import discovery is an optional, currently-unused extension point
// that may only ADD tests, never remove a manifest-selected one.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT, DEFAULT_TEST_ROOT, discoverTestFiles, runSelectedTests, runTests } from './run-tests.mjs';
import { MANIFEST, FULL_TRIGGERS } from '../test/test-ownership.mjs';

const KNOWN_RULE_FIELDS = new Set(['id', 'pattern', 'directTests', 'boundaryTests', 'allowMissing']);

// -- git plumbing -------------------------------------------------------

/**
 * Parses `git diff --name-status -z` (or `git ls-files -z`) output into
 * `{status, path, oldPath}` rows. NUL-separated, never quote/escape-parsed
 * -- the one representation that survives spaces, backslashes and any
 * other byte in a path unscathed. A rename/copy status ("R100", "C100")
 * carries oldPath THEN path as two consecutive NUL-separated fields.
 */
export function parseNameStatusZ(raw) {
  const fields = raw.split('\0').filter((f) => f !== '');
  const rows = [];
  let i = 0;
  while (i < fields.length) {
    const status = fields[i];
    if (status[0] === 'R' || status[0] === 'C') {
      rows.push({ status, oldPath: fields[i + 1], path: fields[i + 2] });
      i += 3;
    } else {
      rows.push({ status, path: fields[i + 1] });
      i += 2;
    }
  }
  return rows;
}

/**
 * Parses `git ls-files -z` (plain NUL-separated path list, no status
 * column) into `{status: 'A', path}` rows for untracked files.
 */
export function parsePathListZ(raw) {
  return raw
    .split('\0')
    .filter((p) => p !== '')
    .map((p) => ({ status: 'A', path: p }));
}

/**
 * Collects every changed path since `base` (default `main`), from four
 * independent sources, each tagged so `--explain` can show provenance:
 * committed (merge-base..HEAD), staged, unstaged, untracked. Renames keep
 * BOTH old and new paths (the old path as its own row, `renameOf` pointing
 * forward); a rename's old path is never silently dropped. Returns
 * `{ error }` (never throws) when the base cannot be resolved -- a missing
 * or invalid `--base` is a selection-time condition, not a crash.
 */
export function collectChangedPaths({ cwd = REPO_ROOT, exec = execFileSync, base = 'main' } = {}) {
  let mergeBase;
  try {
    mergeBase = exec('git', ['merge-base', 'HEAD', base], { cwd, encoding: 'utf8' }).trim();
  } catch {
    return { error: `invalid or unresolvable base "${base}"` };
  }

  const rows = [];
  const tag = (list, source) => list.forEach((r) => rows.push({ ...r, source }));

  try {
    // --find-renames pinned explicitly: relying on the ambient diff.renames
    // config default would make rename detection (and therefore which
    // paths this selector sees) depend on the invoking environment.
    tag(parseNameStatusZ(exec('git', ['diff', '--name-status', '--find-renames', '-z', `${mergeBase}..HEAD`], { cwd, encoding: 'utf8' })), 'committed');
    tag(parseNameStatusZ(exec('git', ['diff', '--name-status', '--find-renames', '-z', '--cached'], { cwd, encoding: 'utf8' })), 'staged');
    tag(parseNameStatusZ(exec('git', ['diff', '--name-status', '--find-renames', '-z'], { cwd, encoding: 'utf8' })), 'unstaged');
    tag(parsePathListZ(exec('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd, encoding: 'utf8' })), 'untracked');
  } catch (err) {
    return { error: `git plumbing failed: ${err.message}` };
  }

  // Flatten renames into two independent path entries (old + new) so
  // downstream matching never has to special-case a two-path row; dedupe
  // by (path, source) while keeping every distinct source label.
  const byPathSource = new Map();
  for (const row of rows) {
    if (row.oldPath) {
      const oldKey = `${row.oldPath}::${row.source}`;
      if (!byPathSource.has(oldKey)) byPathSource.set(oldKey, { path: row.oldPath, status: 'D', source: row.source, renamedTo: row.path });
    }
    const key = `${row.path}::${row.source}`;
    if (!byPathSource.has(key)) byPathSource.set(key, { path: row.path, status: row.status, source: row.source, renamedFrom: row.oldPath ?? null });
  }

  return { mergeBase, changes: Array.from(byPathSource.values()) };
}

// -- manifest validation --------------------------------------------------

/**
 * Validates `MANIFEST`/`FULL_TRIGGERS` before any matching happens.
 * Returns `{ valid, errors }`; never throws. A caller sees an invalid
 * manifest as an unconditional full-suite fallback (a broken manifest is
 * exactly the "unsafe" condition the plan's escalation rule is for).
 */
export function validateManifest(manifest, { repoRoot = REPO_ROOT } = {}) {
  const errors = [];
  const seenIds = new Set();
  const seenPatterns = new Set();

  for (const rule of manifest) {
    for (const key of Object.keys(rule)) {
      if (!KNOWN_RULE_FIELDS.has(key)) errors.push(`rule "${rule.id ?? '(no id)'}" has unsupported field "${key}"`);
    }
    if (!rule.id) {
      errors.push('a rule is missing an id');
      continue;
    }
    if (seenIds.has(rule.id)) errors.push(`duplicate rule id "${rule.id}"`);
    seenIds.add(rule.id);

    if (!rule.pattern) {
      errors.push(`rule "${rule.id}" is missing a pattern`);
      continue;
    }
    if (seenPatterns.has(rule.pattern)) errors.push(`duplicate pattern "${rule.pattern}" (rule "${rule.id}")`);
    seenPatterns.add(rule.pattern);

    const directTests = rule.directTests ?? [];
    const boundaryTests = rule.boundaryTests ?? [];
    if (directTests.length === 0 && boundaryTests.length === 0) {
      errors.push(`rule "${rule.id}" has no direct or boundary tests (empty test set)`);
    }

    const allReferenced = [rule.pattern, ...directTests, ...boundaryTests];
    for (const rel of allReferenced) {
      const abs = path.resolve(repoRoot, rel);
      let real;
      try {
        real = fs.realpathSync(abs);
      } catch {
        if (rel === rule.pattern && rule.allowMissing) continue; // explicit deleted-path-history allowance
        errors.push(`rule "${rule.id}" references a path that does not exist on the current tree: "${rel}"`);
        continue;
      }
      let realRoot;
      try {
        realRoot = fs.realpathSync(repoRoot);
      } catch {
        errors.push(`repo root does not resolve: "${repoRoot}"`);
        continue;
      }
      if (real !== realRoot && !real.startsWith(realRoot + path.sep)) {
        errors.push(`rule "${rule.id}" references a path outside the repo root (symlink-escape or traversal): "${rel}"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// -- matching -------------------------------------------------------------

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/** Exact-path lookup only -- no glob engine, so no ambiguity is possible. */
export function buildManifestIndex(manifest) {
  const byPattern = new Map();
  for (const rule of manifest) byPattern.set(rule.pattern, rule);
  return byPattern;
}

export function matchFullTrigger(relPath, fullTriggers) {
  const p = toPosix(relPath);
  for (const rule of fullTriggers) {
    if (rule.exact && p === rule.exact) return rule;
    if (rule.prefix && p.startsWith(rule.prefix)) return rule;
  }
  return null;
}

// -- selection --------------------------------------------------------------

/**
 * Runs the full algorithm (plan section 12, steps 5-11) over an already
 * `collectChangedPaths`-shaped change list. Pure and injectable (no I/O
 * beyond what its inputs already carry) so every adversarial shape can be
 * constructed directly in a test. `staticGraphTests` is the optional,
 * currently-unused static graph/import extension point -- when given, it
 * can only ADD to a `related` decision's selected set, and is IGNORED
 * entirely once the decision is `full` (adding tests to an already-full
 * run is a no-op by definition).
 */
export function selectTests({
  changes,
  manifest = MANIFEST,
  fullTriggers = FULL_TRIGGERS,
  repoRoot = REPO_ROOT,
  testRoot = DEFAULT_TEST_ROOT,
  staticGraphTests = [],
  fileExists = (abs) => fs.existsSync(abs),
} = {}) {
  const { valid, errors } = validateManifest(manifest, { repoRoot });
  if (!valid) {
    return {
      decision: 'full',
      reason: 'manifest-invalid',
      escalations: errors.map((e) => ({ path: null, ruleId: 'manifest-invalid', reason: e })),
      matched: [],
      selectedFiles: null, // caller discovers the full set itself
    };
  }

  if (changes.length === 0) {
    return { decision: 'refuse', reason: 'no changed paths since base -- refusing to silently run zero tests', escalations: [], matched: [], selectedFiles: [] };
  }

  const manifestIndex = buildManifestIndex(manifest);
  const escalations = [];
  const matched = [];
  const selfTestFiles = new Set();

  for (const change of changes) {
    const relPath = toPosix(change.path);
    const fullTrigger = matchFullTrigger(relPath, fullTriggers);
    if (fullTrigger) {
      escalations.push({ path: relPath, ruleId: fullTrigger.id, reason: fullTrigger.reason });
      continue;
    }

    if (relPath.endsWith('.test.mjs') && relPath.startsWith(toPosix(path.relative(repoRoot, testRoot)) + '/')) {
      const abs = path.resolve(repoRoot, relPath);
      if (change.status !== 'D' && fileExists(abs)) {
        selfTestFiles.add(relPath); // R6: a changed test always at least tests itself
      }
      // A deleted test file is a known, explainable change that needs no
      // further proof it stops here -- not an escalation.
      continue;
    }

    const rule = manifestIndex.get(relPath);
    if (rule) {
      matched.push({ path: relPath, ruleId: rule.id, directTests: rule.directTests, boundaryTests: rule.boundaryTests });
      continue;
    }

    escalations.push({ path: relPath, ruleId: 'unknown', reason: 'no manifest rule and no full-trigger rule matches this path' });
  }

  if (escalations.length > 0) {
    return { decision: 'full', reason: 'escalated', escalations, matched, selectedFiles: null };
  }

  const selected = new Set(selfTestFiles);
  for (const m of matched) {
    for (const t of m.directTests) selected.add(t);
    for (const t of m.boundaryTests) selected.add(t);
  }
  for (const t of staticGraphTests) selected.add(t); // union-only, never removes a manifest-selected test

  const selectedFiles = Array.from(selected).sort();
  if (selectedFiles.length === 0) {
    return { decision: 'refuse', reason: 'related selection matched but produced zero test files -- refusing', escalations: [], matched, selectedFiles: [] };
  }

  return { decision: 'related', reason: 'all changed paths matched an explainable rule', escalations: [], matched, selectedFiles };
}

// -- orchestration + --explain ----------------------------------------------

export function runSelected({
  base = 'main',
  cwd = REPO_ROOT,
  repoRoot = REPO_ROOT,
  testRoot = DEFAULT_TEST_ROOT,
  exec = execFileSync,
  spawn,
  execPath = process.execPath,
  env = process.env,
  stdio = 'inherit',
  manifest = MANIFEST,
  fullTriggers = FULL_TRIGGERS,
  staticGraphTests = [],
} = {}) {
  const collected = collectChangedPaths({ cwd, exec, base });
  if (collected.error) {
    return { status: 1, decision: 'full', reason: `invalid-base: ${collected.error}`, explain: { base, error: collected.error }, ran: false };
  }

  const selection = selectTests({ changes: collected.changes, manifest, fullTriggers, repoRoot, testRoot, staticGraphTests });

  const explain = {
    base,
    mergeBase: collected.mergeBase,
    changedPaths: collected.changes,
    decision: selection.decision,
    reason: selection.reason,
    matchedRules: selection.matched,
    escalations: selection.escalations,
    selectedCount: selection.selectedFiles ? selection.selectedFiles.length : null,
  };

  if (selection.decision === 'refuse') {
    return { status: 1, decision: 'refuse', reason: selection.reason, explain, ran: false };
  }

  if (selection.decision === 'full') {
    const fullResult = runTests({ root: testRoot, execPath, spawn, env, cwd, stdio });
    explain.fullCount = fullResult.files.length;
    return { status: fullResult.status, decision: 'full', reason: selection.reason, explain, ran: true };
  }

  const absSelected = selection.selectedFiles.map((f) => path.resolve(repoRoot, f));
  const result = runSelectedTests(absSelected, { cwd, execPath, spawn, env, stdio });
  explain.selectedFiles = selection.selectedFiles;
  return { status: result.status, decision: 'related', reason: selection.reason, explain, ran: true };
}

/**
 * Shadow mode (ITR-D08, `npm run test:related:shadow`): runs the related
 * selection first (when the decision is `related`; skipped when it is
 * already `full`, since there is nothing to compare), THEN the unchanged
 * full suite unconditionally -- never only one or the other. The returned
 * `status` is always the FULL suite's exit status; the related result is
 * recorded for comparison only, never authoritative by itself (this
 * command is not `test:related` -- that name is reserved and only appears
 * after P05 promotion). `comparison.patchRelatedMiss` is exactly the
 * "Patch-related miss" pinned term from CONTEXT.md: related predicted
 * green (or never ran, i.e. escalated to full and therefore trivially
 * agreed) while the full suite actually failed.
 */
export function runShadow({
  base = 'main',
  cwd = REPO_ROOT,
  repoRoot = REPO_ROOT,
  testRoot = DEFAULT_TEST_ROOT,
  exec = execFileSync,
  spawn,
  execPath = process.execPath,
  env = process.env,
  stdio = 'inherit',
  manifest = MANIFEST,
  fullTriggers = FULL_TRIGGERS,
  staticGraphTests = [],
  now = () => Date.now(),
} = {}) {
  const collected = collectChangedPaths({ cwd, exec, base });
  if (collected.error) {
    return { status: 1, comparison: null, explain: { base, error: collected.error } };
  }

  const selection = selectTests({ changes: collected.changes, manifest, fullTriggers, repoRoot, testRoot, staticGraphTests });

  if (selection.decision === 'refuse') {
    return { status: 1, comparison: null, explain: { base, mergeBase: collected.mergeBase, decision: selection.decision, reason: selection.reason } };
  }

  let relatedResult = null;
  let relatedElapsedMs = null;
  if (selection.decision === 'related') {
    const relStart = now();
    const absSelected = selection.selectedFiles.map((f) => path.resolve(repoRoot, f));
    relatedResult = runSelectedTests(absSelected, { cwd, execPath, spawn, env, stdio });
    relatedElapsedMs = now() - relStart;
  }

  const fullStart = now();
  const fullResult = runTests({ root: testRoot, execPath, spawn, env, cwd, stdio });
  const fullElapsedMs = now() - fullStart;

  const comparison = {
    decision: selection.decision,
    relatedRan: relatedResult !== null,
    relatedStatus: relatedResult ? relatedResult.status : null,
    relatedSelectedCount: selection.decision === 'related' ? selection.selectedFiles.length : null,
    relatedElapsedMs,
    fullStatus: fullResult.status,
    fullCount: fullResult.files.length,
    fullElapsedMs,
    agree: relatedResult ? (relatedResult.status === 0) === (fullResult.status === 0) : true,
    patchRelatedMiss: relatedResult ? relatedResult.status === 0 && fullResult.status !== 0 : false,
  };

  return {
    status: fullResult.status,
    comparison,
    explain: {
      base,
      mergeBase: collected.mergeBase,
      decision: selection.decision,
      reason: selection.reason,
      matchedRules: selection.matched,
      escalations: selection.escalations,
      selectedFiles: selection.decision === 'related' ? selection.selectedFiles : null,
      comparison,
    },
  };
}

// -- CLI --------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  const baseIdx = args.indexOf('--base');
  const base = baseIdx === -1 ? 'main' : args[baseIdx + 1];
  const explainRequested = args.includes('--explain');
  const shadowRequested = args.includes('--shadow');

  if (shadowRequested) {
    const result = runShadow({ base, stdio: 'inherit' });
    if (explainRequested) console.log(JSON.stringify(result.explain, null, 2));
    if (result.comparison) {
      console.error(
        `test-select --shadow: decision=${result.comparison.decision} related=${result.comparison.relatedStatus ?? 'n/a'} full=${result.comparison.fullStatus} agree=${result.comparison.agree} patchRelatedMiss=${result.comparison.patchRelatedMiss} -- the full-suite result above is always authoritative; test:related does not exist until P05 promotion`,
      );
    }
    process.exitCode = result.status;
  } else {
    const result = runSelected({ base, stdio: 'inherit' });
    if (explainRequested) console.log(JSON.stringify(result.explain, null, 2));
    console.error(`test-select: decision=${result.decision} reason="${result.reason}"`);
    process.exitCode = result.status;
  }
}
