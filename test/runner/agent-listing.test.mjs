// test/runner/agent-listing.test.mjs — the Node twin of the agent listing proof
//
// The listing's answers (tiers, shadows, shape problems, render warnings, masked and ignored files) are proven by
// the vectors of packages/execution/contracts/agents.v1.json; the Rust owner is
// packages/execution/rust/tests/golden_agents.rs. This file replays the same vectors through the Node `listAgents`
// while that function lives, and checks the script that records them.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { evaluateVector } from '../helpers/agents-vectors.helper.mjs';

const CONTRACT_URL = new URL('../../packages/execution/contracts/agents.v1.json', import.meta.url);
const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_URL, 'utf8'));

test('the Node listing answers every vector of the agents contract', () => {
  assert.equal(CONTRACT.version, 'agents.v1');
  assert.equal(new Set(CONTRACT.vectors.map((vector) => vector.name)).size, CONTRACT.vectors.length, 'vector names are unique');
  for (const vector of CONTRACT.vectors) {
    assert.deepEqual(evaluateVector(vector), vector.expect, vector.name);
  }
});

const SCRIPT = fileURLToPath(new URL('../../scripts/agents-vectors.mjs', import.meta.url));

test('the vector script answers from the replay test environment and fails on a changed expect', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-agents-vectors-'));
  const contractPath = path.join(dir, 'agents.v1.json');
  fs.copyFileSync(CONTRACT_URL, contractPath);
  const check = () => spawnSync(process.execPath, [SCRIPT, '--check', '--contract', contractPath], { encoding: 'utf8' });

  const clean = check();
  assert.equal(clean.status, 0, clean.stderr);

  const changed = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  changed.vectors[0].expect = { changed: true };
  fs.writeFileSync(contractPath, JSON.stringify(changed));
  const drifted = check();
  assert.notEqual(drifted.status, 0);
  assert.ok(drifted.stderr.includes(changed.vectors[0].name), drifted.stderr);
});
