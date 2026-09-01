// Static negative test (Phase 01 Tests First): src/runner/coordination/**
// must never import Work lifecycle, merge, worktree, transport spawn, or
// mission-lite modules -- CoordinationSession owns collaboration progress
// only, never Work lifecycle (ADR-008 Decision 1). Grep-based import-graph
// check, not a runtime behavior test, so it also catches a FUTURE
// accidental reintroduction even though mission-lite.mjs itself no longer
// exists to import from.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const coordinationDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/runner/coordination');

// Substrings matched against each resolved import specifier's own path
// segment/filename -- deliberately over-inclusive (e.g. "merge" also
// catches a hypothetical "merge-planner.mjs") since the point is a hard
// negative, not a precise allowlist.
const FORBIDDEN_IMPORT_SUBSTRINGS = [
  'mission-lite',
  'worktree',
  'merge',
  '/state/work.mjs',
  '/state/fsm.mjs',
  '/state/stage.mjs',
  '/state/store.mjs',
  '/dispatch/transport.mjs',
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

test('src/runner/coordination/** exists and contains at least one module (sanity check for the static scan below)', () => {
  assert.ok(fs.existsSync(coordinationDir), `expected ${coordinationDir} to exist`);
  const files = listModuleFiles(coordinationDir);
  assert.ok(files.length > 0, 'expected at least one .mjs module under src/runner/coordination/');
});

test('src/runner/coordination/** imports no Work lifecycle, merge, worktree, transport-spawn, or mission-lite module', () => {
  const files = listModuleFiles(coordinationDir);
  const violations = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const specifier of extractImportSpecifiers(source)) {
      const resolved = specifier.startsWith('.') ? path.normalize(path.join(path.dirname(file), specifier)) : specifier;
      for (const forbidden of FORBIDDEN_IMPORT_SUBSTRINGS) {
        if (resolved.includes(forbidden)) {
          violations.push(`${path.relative(coordinationDir, file)} imports "${specifier}" (resolved: ${resolved}, matches forbidden "${forbidden}")`);
        }
      }
    }
  }

  assert.deepEqual(violations, [], `forbidden imports found:\n${violations.join('\n')}`);
});
