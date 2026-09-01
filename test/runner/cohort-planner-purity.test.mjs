// Static negative test (R4): src/runner/coordination/cohort-planner.mjs
// must never import dispatch/transport.mjs, child_process, or any other
// CLI-spawn-capable module -- the Cohort Planner is policy-input-only, the
// resolver re-validates and actually spawns at execution time, never this
// module. Same grep-based import-specifier scan style as
// test/runner/coordination-static.test.mjs (a runtime behavior test cannot
// prove "never imports X" as robustly as a static scan, and this also
// catches a future accidental reintroduction).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const plannerFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/runner/coordination/cohort-planner.mjs',
);

const FORBIDDEN_IMPORT_SUBSTRINGS = [
  'dispatch/transport.mjs',
  'child_process',
  'node:child_process',
];

function extractImportSpecifiers(source) {
  const specifiers = [];
  const importRe = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(source))) specifiers.push(match[1]);
  const dynamicRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRe.exec(source))) specifiers.push(match[1]);
  return specifiers;
}

test('cohort-planner.mjs exists (sanity check for the static scan below)', () => {
  assert.ok(fs.existsSync(plannerFile), `expected ${plannerFile} to exist`);
});

test('cohort-planner.mjs imports no dispatch/transport.mjs or child_process module (own import specifiers only, R4)', () => {
  const source = fs.readFileSync(plannerFile, 'utf8');
  const violations = [];

  for (const specifier of extractImportSpecifiers(source)) {
    const resolved = specifier.startsWith('.') ? path.normalize(path.join(path.dirname(plannerFile), specifier)) : specifier;
    for (const forbidden of FORBIDDEN_IMPORT_SUBSTRINGS) {
      if (resolved.includes(forbidden)) {
        violations.push(`imports "${specifier}" (resolved: ${resolved}, matches forbidden "${forbidden}")`);
      }
    }
  }

  assert.deepEqual(violations, [], `forbidden imports found:\n${violations.join('\n')}`);
});

test('cohort-planner.mjs never references child_process/spawn/exec/fork identifiers in its own source', () => {
  const source = fs.readFileSync(plannerFile, 'utf8');
  const spawnPatterns = [/\bspawn\s*\(/, /\bspawnSync\s*\(/, /\bexecFile\s*\(/, /\bexec\s*\(/, /\bfork\s*\(/];
  const violations = spawnPatterns.filter((re) => re.test(source)).map((re) => re.source);
  assert.deepEqual(violations, [], `forbidden spawn-shaped call(s) found: ${violations.join(', ')}`);
});
