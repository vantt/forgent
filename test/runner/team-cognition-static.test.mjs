// Static negative test (P07.1 Tests First): src/runner/team-cognition/**
// must never import CoordinationSession runtime, dispatch/execution, Work
// lifecycle, merge, worktree, or transport-spawn modules --
// component-authority-boundary-map.md §6's Team Cognition Engine "Must not
// own" row (CoordinationSession terminal transitions, context-grant
// authority, Assignment dispatch, RunResult confidence upgrades) means this
// boundary must stay import-clean of the modules that actually DO those
// things, not just behaviorally avoid calling them. Grep-based import-graph
// check, not a runtime behavior test -- mirrors
// test/runner/coordination-static.test.mjs's own shape one boundary over.
//
// The scan is a real transitive resolver, not a one-hop substring check: an
// entry file under team-cognition/ that imports a relatively-innocuous file
// OUTSIDE team-cognition/, which in turn imports a forbidden module, must
// still be caught -- a one-hop scan only sees the entry file's own import
// line and misses this (see the PoC test at the bottom of this file).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const teamCognitionDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/runner/team-cognition');

const FORBIDDEN_IMPORT_SUBSTRINGS = [
  // Session-runtime: the module that actually opens/mutates/transitions a
  // CoordinationSession -- never reachable from this boundary.
  '/coordination/session-engine',
  '/coordination/store',
  '/coordination/replay',
  '/coordination/headless-adapter',
  '/coordination/cohort-planner',
  'coordination/schema', // team-cognition/schema.mjs is self-contained, never forks/imports the session-side schema.mjs
  // Dispatch/execution: launching or transitioning a Run/Assignment.
  '/dispatch/assignment-runner',
  '/dispatch/transport',
  'child_process',
  'node:child_process',
  // Work lifecycle / merge / worktree: outside every authority row this
  // module could ever legitimately touch.
  'mission-lite',
  'worktree',
  'merge',
  '/state/work.mjs',
  '/state/fsm.mjs',
  '/state/stage.mjs',
  '/state/store.mjs',
];

function listModuleFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listModuleFiles(full);
    return entry.isFile() && entry.name.endsWith('.mjs') ? [full] : [];
  });
}

function extractImportSpecifiers(source) {
  const specifiers = [];
  const importRe = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(source))) specifiers.push(match[1]);
  const dynamicRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRe.exec(source))) specifiers.push(match[1]);
  return specifiers;
}

// A checkout under a path containing the literal substring "worktree" (this
// repo's own `.claude/worktrees/<name>/` convention) would otherwise make
// every relative import here false-positive against the "worktree" forbidden
// substring below (the same false-fail current-cell.md documents for
// coordination-static.test.mjs). Match only the repo-relative tail
// (`src/...`) instead of the full absolute resolved path. Falls back to the
// full resolved path when there is no "/src/" segment at all (e.g. a
// synthetic fixture tree used to exercise this scanner itself, below).
function toRepoRelative(resolvedPath) {
  const marker = `${path.sep}src${path.sep}`;
  const idx = resolvedPath.lastIndexOf(marker);
  return idx === -1 ? resolvedPath : resolvedPath.slice(idx + 1);
}

function resolveRelativeImport(fromFile, specifier) {
  let resolved = path.normalize(path.join(path.dirname(fromFile), specifier));
  if (!resolved.endsWith('.mjs')) resolved += '.mjs';
  return resolved;
}

/**
 * Real recursive resolver: starting from `entryFile`, follows every relative
 * (`.`-prefixed) import to its resolved file and recurses into THAT file's
 * imports too, collecting every (file, specifier) pair encountered anywhere
 * in the transitive closure. Never recurses into a bare/package specifier --
 * it is recorded (so it can still be checked against the forbidden list)
 * but not followed, matching the original one-hop scan's behavior for
 * non-relative imports.
 */
function collectTransitiveImports(entryFile) {
  const visitedFiles = new Set();
  const pairs = []; // { file, specifier }
  const queue = [entryFile];

  while (queue.length > 0) {
    const file = queue.shift();
    if (visitedFiles.has(file)) continue;
    visitedFiles.add(file);
    if (!fs.existsSync(file)) continue;

    const source = fs.readFileSync(file, 'utf8');
    for (const specifier of extractImportSpecifiers(source)) {
      pairs.push({ file, specifier });
      if (specifier.startsWith('.')) {
        const resolved = resolveRelativeImport(file, specifier);
        if (!visitedFiles.has(resolved)) queue.push(resolved);
      }
      // Non-relative (bare package) specifiers are checked as-is but never
      // followed -- we cannot and should not walk into node_modules/builtins.
    }
  }

  return pairs;
}

/**
 * Scan every `.mjs` file directly under `rootDir` as an entry point, walk
 * each one's full transitive relative-import closure, and report every
 * (file, specifier) pair anywhere in that closure that matches a forbidden
 * substring.
 */
function findForbiddenImportViolations(rootDir) {
  const entryFiles = listModuleFiles(rootDir);
  const violations = [];

  for (const entryFile of entryFiles) {
    for (const { file, specifier } of collectTransitiveImports(entryFile)) {
      const resolved = specifier.startsWith('.') ? resolveRelativeImport(file, specifier) : specifier;
      const checkTarget = specifier.startsWith('.') ? toRepoRelative(resolved) : resolved;
      for (const forbidden of FORBIDDEN_IMPORT_SUBSTRINGS) {
        if (checkTarget.includes(forbidden)) {
          violations.push(
            `${path.relative(rootDir, entryFile)} transitively imports "${specifier}" via ${path.relative(rootDir, file)} ` +
              `(resolved: ${resolved}, matches forbidden "${forbidden}")`,
          );
        }
      }
    }
  }

  return violations;
}

test('src/runner/team-cognition/** exists and contains at least one module (sanity check for the static scan below)', () => {
  assert.ok(fs.existsSync(teamCognitionDir), `expected ${teamCognitionDir} to exist`);
  const files = listModuleFiles(teamCognitionDir);
  assert.ok(files.length > 0, 'expected at least one .mjs module under src/runner/team-cognition/');
});

test('src/runner/team-cognition/** imports no session-runtime, dispatch/execution, Work-lifecycle, merge, worktree, or transport-spawn module (transitive, not just direct imports)', () => {
  const violations = findForbiddenImportViolations(teamCognitionDir);
  assert.deepEqual(violations, [], `forbidden imports found:\n${violations.join('\n')}`);
});

test('src/runner/team-cognition/** has zero top-level fs/network side effects (grep sanity: no fs./readFile/writeFile/fetch usage)', () => {
  const files = listModuleFiles(teamCognitionDir);
  const violations = [];
  const SIDE_EFFECT_PATTERNS = [/\bfs\./, /\breadFileSync\b/, /\bwriteFileSync\b/, /\bfetch\s*\(/];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of SIDE_EFFECT_PATTERNS) {
      if (pattern.test(source)) {
        violations.push(`${path.relative(teamCognitionDir, file)} matches forbidden pattern ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, [], `side-effect usage found:\n${violations.join('\n')}`);
});

// --- Proof the transitive resolver actually catches an indirect violation ---
//
// Red-Team's synthetic PoC: an entry file imports an innocuously-named file
// OUTSIDE the module directory (no forbidden substring in that one import
// line), and THAT file imports a forbidden module. A one-hop scanner sees
// zero violations; a real transitive resolver must catch it.

test('forbidden-import guard catches an indirect (one-hop-through-an-intermediate-file) violation, reproducing the red-team PoC shape', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'team-cognition-static-poc-'));
  try {
    const entryDir = path.join(fixtureRoot, 'team-cognition');
    const sharedDir = path.join(fixtureRoot, 'shared');
    const coordinationDir = path.join(fixtureRoot, 'coordination');
    fs.mkdirSync(entryDir, { recursive: true });
    fs.mkdirSync(sharedDir, { recursive: true });
    fs.mkdirSync(coordinationDir, { recursive: true });

    // Entry file: imports a file outside team-cognition/ whose name matches
    // none of the forbidden substrings.
    fs.writeFileSync(
      path.join(entryDir, 'aggregation-evaluator.mjs'),
      "import { helper } from '../shared/helpers.mjs';\nexport function run() { return helper(); }\n",
    );
    // Intermediate file: imports the actually-forbidden module.
    fs.writeFileSync(
      path.join(sharedDir, 'helpers.mjs'),
      "import { transitionSession } from '../coordination/session-engine.mjs';\nexport function helper() { return transitionSession(); }\n",
    );
    fs.writeFileSync(
      path.join(coordinationDir, 'session-engine.mjs'),
      "export function transitionSession() { return 'MUTATED SESSION STATE'; }\n",
    );

    const violations = findForbiddenImportViolations(entryDir);

    assert.ok(violations.length > 0, 'expected the transitive resolver to catch the indirect session-engine.mjs import');
    assert.ok(
      violations.some((v) => v.includes('session-engine')),
      `expected a violation naming session-engine, got:\n${violations.join('\n')}`,
    );
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('forbidden-import guard stays clean on a fixture whose only reachable modules are legitimate', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'team-cognition-static-clean-'));
  try {
    const entryDir = path.join(fixtureRoot, 'team-cognition');
    const sharedDir = path.join(fixtureRoot, 'shared');
    fs.mkdirSync(entryDir, { recursive: true });
    fs.mkdirSync(sharedDir, { recursive: true });

    fs.writeFileSync(
      path.join(entryDir, 'aggregation-evaluator.mjs'),
      "import { helper } from '../shared/helpers.mjs';\nexport function run() { return helper(); }\n",
    );
    fs.writeFileSync(path.join(sharedDir, 'helpers.mjs'), 'export function helper() { return 42; }\n');

    const violations = findForbiddenImportViolations(entryDir);
    assert.deepEqual(violations, []);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
});
