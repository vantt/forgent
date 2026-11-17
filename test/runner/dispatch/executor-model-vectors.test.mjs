// test/runner/dispatch/executor-model-vectors.test.mjs
//
// The executor-model contract (docs/platform/runner/contracts/executor-model.md) keeps its golden vectors in
// packages/execution/contracts/executor-model.v1.json. This file is the Node twin of the proof a Rust port owns: it
// replays every vector against the Node functions that derive the executor facts until those functions are deleted.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { evaluateVector, VECTOR_FACTS } from '../../helpers/executor-model-vectors.helper.mjs';

const CONTRACT = JSON.parse(fs.readFileSync(new URL('../../../packages/execution/contracts/executor-model.v1.json', import.meta.url), 'utf8'));

test('Node launch code derives the same executor facts as the executor-model contract', () => {
  assert.equal(CONTRACT.version, 'executor-model.v1');
  assert.deepEqual([...new Set(CONTRACT.vectors.map((vector) => vector.fact))].sort(), [...VECTOR_FACTS].sort(), 'every derived fact has at least one vector');
  assert.deepEqual(CONTRACT.facts, [...new Set(CONTRACT.vectors.map((vector) => vector.fact))], 'the fact list names the facts the vectors cover');
  assert.equal(new Set(CONTRACT.vectors.map((vector) => vector.name)).size, CONTRACT.vectors.length, 'vector names are unique');
  for (const vector of CONTRACT.vectors) {
    assert.deepEqual(evaluateVector(vector), vector.expect, vector.name);
  }
});
