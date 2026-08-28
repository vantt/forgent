import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function run(args) {
  return spawnSync(process.execPath, [FGOS, ...args], { encoding: 'utf8' });
}

test('fgos workflow operations lists declared operations for planning stage', () => {
  const result = run(['workflow', 'operations', '--stage', 'planning']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.equal(envelope.data.domain, 'coding');
  assert.equal(envelope.data.stage, 'planning');
  const opIds = envelope.data.operations.map((o) => o.id);
  assert.deepEqual(opIds, ['shape-plan', 'validate-plan', 'scout-blast-radius', 'resolve-question']);
});

test('fgos workflow operations lists declared operations for executing stage', () => {
  const result = run(['workflow', 'operations', '--stage', 'executing']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  const opIds = envelope.data.operations.map((o) => o.id);
  assert.deepEqual(opIds, [
    'implement-item',
    'review-item',
    'fix-verify-red',
    'scoped-subtask',
    'scout-blast-radius',
    'resolve-question',
  ]);
});

test('fgos workflow operations handles positional stage without operations subverb', () => {
  const result = run(['workflow', 'planning']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.equal(envelope.data.stage, 'planning');
});

test('fgos workflow operations returns empty operations array for absent stage', () => {
  const result = run(['workflow', 'operations', '--stage', 'nonexistent-stage']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.deepEqual(envelope.data.operations, []);
});

test('fgos workflow operations refuses when stage is missing', () => {
  const result = run(['workflow', 'operations']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /workflow operations requires --stage/);
});
