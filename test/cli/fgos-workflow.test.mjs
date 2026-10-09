import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function run(args) {
  return spawnSync(process.execPath, [FGOS, ...args], { encoding: 'utf8' });
}

test('fgos workflow operations lists declared operations for planning stage', () => {
  const result = run(['workflow', 'operations', '--step', 'planning']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.equal(envelope.data.domain, 'coding');
  assert.equal(envelope.data.step, 'planning');
  const opIds = envelope.data.operations.map((o) => o.id);
  assert.deepEqual(opIds, ['shape-plan', 'validate-plan', 'scout-blast-radius', 'resolve-question']);
});

test('fgos workflow operations lists declared operations for executing stage', () => {
  const result = run(['workflow', 'operations', '--step', 'executing']);
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
  assert.equal(envelope.data.step, 'planning');
});

test('fgos workflow operations returns empty operations array for absent stage', () => {
  const result = run(['workflow', 'operations', '--step', 'nonexistent-stage']);
  assert.equal(result.status, 0);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.deepEqual(envelope.data.operations, []);
});

test('fgos workflow operations refuses when stage is missing', () => {
  const result = run(['workflow', 'operations']);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /workflow operations requires --step/);
});

test('workflow start repeats context-ref into one persisted field and refuses malformed values', (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-context-cli-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-m', 'fixture'], { cwd: tmp, stdio: 'ignore' });
  fs.mkdirSync(path.join(tmp, 'core', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'core', 'workflows', 'context.json'), JSON.stringify({
    id: 'context', steps: [{ id: 'entry', gate: { kind: 'human', question: 'Start?' } }],
  }));
  const invoke = (refs) => spawnSync(process.execPath, [FGOS, 'workflow', 'start', 'context', '--foreground', '--dir', tmp, ...refs], { cwd: tmp, encoding: 'utf8' });
  const result = invoke(['--context-ref', 'owner.txt', '--context-ref', 'unit-run:unit-1/producer']);
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(result.stdout).data;
  assert.deepEqual(state.contextRefs, ['owner.txt', 'unit-run:unit-1/producer']);
  const first = JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'workflow-runs', state.workflowRunId, 'events.jsonl'), 'utf8').split('\n')[0]);
  assert.deepEqual(first.payload.contextRefs, state.contextRefs);
  for (const refs of [['--context-ref'], ['--context-ref', '../escape'], ['--context-ref', 'ok.txt', '--context-ref']]) {
    const refused = invoke(refs);
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /contextRefs/);
  }
});
