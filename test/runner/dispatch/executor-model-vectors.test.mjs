// test/runner/dispatch/executor-model-vectors.test.mjs
//
// The executor-model contract (docs/platform/runner/contracts/executor-model.md) keeps its golden vectors in
// packages/execution/contracts/executor-model.v1.json. This file is the Node twin of the proof the Rust crate owns: it
// replays every vector against the Node functions that derive the executor facts until those functions are deleted.
// The bind vectors (bind.v1.json) are owned by packages/execution/rust/tests/golden_bind.rs alone.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateVector, leaseReadOf, VECTOR_FACTS } from '../../helpers/executor-model-vectors.helper.mjs';

const CONTRACT = JSON.parse(fs.readFileSync(new URL('../../../packages/execution/contracts/executor-model.v1.json', import.meta.url), 'utf8'));

test('Node launch code derives the same executor facts as the executor-model contract', () => {
  assert.equal(CONTRACT.version, 'executor-model.v1');
  assert.deepEqual([...new Set(CONTRACT.vectors.map((vector) => vector.fact))].sort(), [...VECTOR_FACTS].sort(), 'every derived fact has at least one vector');
  assert.deepEqual(CONTRACT.facts, [...new Set(CONTRACT.vectors.map((vector) => vector.fact))], 'the fact list names the facts the vectors cover');
  assert.equal(new Set(CONTRACT.vectors.map((vector) => vector.name)).size, CONTRACT.vectors.length, 'vector names are unique');
  for (const vector of CONTRACT.vectors) {
    assert.deepEqual(evaluateVector(vector), vector.expect, vector.name);
    assert.deepEqual(leaseReadOf(vector), vector.leaseRead, `${vector.name}: lease read`);
  }
});

const SCRIPT = fileURLToPath(new URL('../../../scripts/executor-model-vectors.mjs', import.meta.url));

function check(contractPath, env) {
  return spawnSync(process.execPath, [SCRIPT, '--check', '--contract', contractPath], { encoding: 'utf8', env });
}

test('the vector script answers from the replay test environment, whatever shell starts it, and still fails on a changed expect', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-vectors-'));
  const stubBin = path.join(dir, 'bin');
  fs.mkdirSync(stubBin);
  for (const cli of ['codex', 'pi', 'omp', 'agy']) {
    fs.writeFileSync(path.join(stubBin, cli), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  }
  const dirty = { ...process.env, PATH: `${stubBin}${path.delimiter}${process.env.PATH}`, HERDR_ENV: '1', HERDR_PANE_ID: 'pane-1', HERDR_SOCKET_PATH: '/nonexistent/herdr.sock' };
  const contractPath = path.join(dir, 'executor-model.v1.json');
  fs.copyFileSync(new URL('../../../packages/execution/contracts/executor-model.v1.json', import.meta.url), contractPath);

  const clean = check(contractPath, dirty);
  assert.equal(clean.status, 0, clean.stderr);

  const changed = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  changed.vectors[0].expect = { changed: true };
  fs.writeFileSync(contractPath, JSON.stringify(changed));
  const drifted = check(contractPath, dirty);
  assert.notEqual(drifted.status, 0);
  assert.match(drifted.stderr, new RegExp(changed.vectors[0].name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
