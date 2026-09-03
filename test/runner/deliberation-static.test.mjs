// Static negative test (P08.1, mirroring test/runner/team-cognition-static.test.mjs
// one boundary over): src/runner/deliberation/** must never import
// CoordinationSession runtime, dispatch/execution, Work lifecycle, merge,
// worktree, transport-spawn, or team-cognition modules --
// component-authority-boundary-map.md §6's Team Cognition Engine "Must not
// own" row (CoordinationSession terminal transitions, context-grant
// authority, Assignment dispatch, RunResult confidence upgrades) applies to
// this sibling boundary too. Grep-based import-graph check, not a runtime
// behavior test.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const deliberationDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/runner/deliberation');

const FORBIDDEN_IMPORT_SUBSTRINGS = [
  '/coordination/session-engine',
  '/coordination/store',
  '/coordination/replay',
  '/coordination/headless-adapter',
  '/coordination/cohort-planner',
  'coordination/schema',
  '/team-cognition/', // deliberation stays self-contained, one concern over from aggregation
  '/dispatch/assignment-runner',
  '/dispatch/transport',
  'child_process',
  'node:child_process',
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

function collectTransitiveImports(entryFile) {
  const visitedFiles = new Set();
  const pairs = [];
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
    }
  }

  return pairs;
}

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

test('src/runner/deliberation/** exists and contains at least one module (sanity check for the static scan below)', () => {
  assert.ok(fs.existsSync(deliberationDir), `expected ${deliberationDir} to exist`);
  const files = listModuleFiles(deliberationDir);
  assert.ok(files.length > 0, 'expected at least one .mjs module under src/runner/deliberation/');
});

test('src/runner/deliberation/** imports no session-runtime, dispatch/execution, Work-lifecycle, merge, worktree, team-cognition, or transport-spawn module (transitive, not just direct imports)', () => {
  const violations = findForbiddenImportViolations(deliberationDir);
  assert.deepEqual(violations, [], `forbidden imports found:\n${violations.join('\n')}`);
});

test('src/runner/deliberation/** has zero top-level fs/network side effects (grep sanity: no fs./readFile/writeFile/fetch usage)', () => {
  const files = listModuleFiles(deliberationDir);
  const violations = [];
  const SIDE_EFFECT_PATTERNS = [/\bfs\./, /\breadFileSync\b/, /\bwriteFileSync\b/, /\bfetch\s*\(/];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of SIDE_EFFECT_PATTERNS) {
      if (pattern.test(source)) {
        violations.push(`${path.relative(deliberationDir, file)} matches forbidden pattern ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, [], `side-effect usage found:\n${violations.join('\n')}`);
});
