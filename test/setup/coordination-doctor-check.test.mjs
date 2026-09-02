// coordination-doctor-check.test.mjs -- Step 08 Phase 07 R3, AGENTS.md's
// install/setup/doctor gate: the `coordination-example-requests-valid`
// doctor check (src/setup/registrations.mjs) is real and visible to
// `fgos doctor` (registered in the same DOCTOR_CHECKS registry every other
// check in this file exercises), and genuinely catches a broken example
// (never a decorative always-pass check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function mkTempCopy() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-doctor-'));
  fs.mkdirSync(path.join(dir, 'docs', 'how-to', 'coordination-examples'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'core', 'coordination-protocols'), { recursive: true });
  const srcExamples = path.join(repoRoot, 'docs', 'how-to', 'coordination-examples');
  for (const file of fs.readdirSync(srcExamples)) {
    fs.copyFileSync(path.join(srcExamples, file), path.join(dir, 'docs', 'how-to', 'coordination-examples', file));
  }
  const srcProtocols = path.join(repoRoot, 'core', 'coordination-protocols');
  for (const file of fs.readdirSync(srcProtocols)) {
    fs.copyFileSync(path.join(srcProtocols, file), path.join(dir, 'core', 'coordination-protocols', file));
  }
  return dir;
}

function findCheck() {
  const entry = DOCTOR_CHECKS.find((c) => c.id === 'coordination-example-requests-valid');
  assert.ok(entry, 'expected "coordination-example-requests-valid" to be registered in DOCTOR_CHECKS (fgos doctor visibility, AGENTS.md install/setup/doctor gate)');
  return entry;
}

test('coordination-example-requests-valid is registered and visible to fgos doctor', () => {
  findCheck();
});

test('coordination-example-requests-valid passes against this repo\'s own real, published example requests + protocols', () => {
  const entry = findCheck();
  const result = entry.check(repoRoot);
  assert.equal(result.passed, true, result.message);
  assert.match(result.message, /coordination example request\(s\)/);
});

test('coordination-example-requests-valid fails on a missing examples directory (not a silent pass)', () => {
  const entry = findCheck();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coordination-doctor-empty-'));
  const result = entry.check(dir);
  assert.equal(result.passed, false);
  assert.match(result.message, /no example request files found/);
});

test('coordination-example-requests-valid fails when an example violates the R2 schema boundary (never a silent accept)', () => {
  const dir = mkTempCopy();
  fs.writeFileSync(
    path.join(dir, 'docs', 'how-to', 'coordination-examples', 'broken.json'),
    JSON.stringify({ kind: 'agent-led', objective: 'x', writerId: 'w', primaryRole: 'researcher', task: { expectedOutputs: ['y'], evidenceRequired: 'reported' }, executor: 'claude' }),
  );
  const entry = findCheck();
  const result = entry.check(dir);
  assert.equal(result.passed, false);
  assert.match(result.message, /broken\.json/);
});

test('coordination-example-requests-valid fails when an example references a protocolRef.id that does not resolve', () => {
  const dir = mkTempCopy();
  fs.writeFileSync(
    path.join(dir, 'docs', 'how-to', 'coordination-examples', 'dangling-protocol.json'),
    JSON.stringify({
      kind: 'declared-protocol',
      objective: 'x',
      writerId: 'w',
      protocolRef: { id: 'core.coordination-protocol.does-not-exist' },
      steps: [{ type: 'operation', as: 's1', operationId: 'op', objective: 'x', expectedOutputs: ['y'] }],
    }),
  );
  const entry = findCheck();
  const result = entry.check(dir);
  assert.equal(result.passed, false);
  assert.match(result.message, /does not resolve/);
});
