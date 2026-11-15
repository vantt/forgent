// The Node rows bridge (src/setup/doctor-bridge.mjs): what the Rust host reads from it. The contract
// packages/distribution/contracts/doctor-bridge.v1.json is the one source of the line format; the host reads the
// same vectors (apps/fgos/src/wiring/doctor/bridge.rs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { RESULT_PREFIX, parseRequest, resultLine, serve } from '../../src/setup/doctor-bridge.mjs';
import { runBridged } from '../../src/setup/registrations.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const contract = JSON.parse(fs.readFileSync(path.join(root, 'packages/distribution/contracts/doctor-bridge.v1.json'), 'utf8'));
const MODULE = path.join(root, contract.module);

const lines = [];
const collect = () => ({ write: (line) => lines.push(line), runBridged });

test('the prefix and the result lines are the contract\'s, byte for byte', () => {
  assert.equal(RESULT_PREFIX, contract.resultPrefix);
  for (const vector of contract.vectors) assert.equal(resultLine(vector.kind, vector.body), vector.line, vector.name);
});

test('a request that is not a phase, a list of ids and a directory is refused by name', () => {
  assert.throws(() => parseRequest('nope'), /not JSON/);
  assert.throws(() => parseRequest('{"phase":"all","ids":[],"dir":"/p"}'), /no phase/);
  assert.throws(() => parseRequest('{"phase":"check","ids":[""],"dir":"/p"}'), /no list of ids/);
  assert.throws(() => parseRequest('{"phase":"check","ids":["a"]}'), /no project directory/);
  assert.deepEqual(parseRequest('{"phase":"fix","ids":["a"],"dir":"/p"}'), { phase: 'fix', ids: ['a'], dir: '/p' });
});

test('an id with no body refuses the whole call and judges nothing', async () => {
  lines.length = 0;
  const code = await serve(JSON.stringify({ phase: 'check', ids: ['curl-available', 'no-such-row'], dir: root }), collect());
  assert.equal(code, 2);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /"kind":"refusal".*no row body for no-such-row/);
});

test('rows come back in the order asked, each as one line, and the call ends with its count', async () => {
  lines.length = 0;
  const code = await serve(JSON.stringify({ phase: 'check', ids: ['bwrap-available', 'curl-available'], dir: root }), collect());
  assert.equal(code, 0);
  const kinds = lines.map((line) => JSON.parse(line.slice(RESULT_PREFIX.length)));
  assert.deepEqual(kinds.map((entry) => entry.kind), ['row', 'row', 'end']);
  assert.deepEqual(kinds.slice(0, 2).map((entry) => entry.id), ['bwrap-available', 'curl-available']);
  assert.equal(kinds[2].count, 2);
  for (const entry of kinds.slice(0, 2)) assert.equal(typeof entry.passed, 'boolean');
});

test('a row that returns no verdict or throws fails its own row and never ends the call', async () => {
  const bodies = { phase: 'check', ids: ['a', 'b', 'c'], dir: root };
  const seen = [];
  const { registerCheck, runBridged: run } = await import('../../src/setup/registrations.mjs');
  registerCheck({ id: 'bridge-test-throws', check: () => { throw new Error('exploded'); } });
  registerCheck({ id: 'bridge-test-silent', check: () => ({}) });
  registerCheck({ id: 'bridge-test-fine', check: () => ({ passed: true, status: 'skip', message: 'nothing to judge', fixCommand: 'run x', detail: { n: 1 } }) });
  await run({ ...bodies, ids: ['bridge-test-throws', 'bridge-test-silent', 'bridge-test-fine'] }, (result) => seen.push(result));
  assert.deepEqual(seen[0], { id: 'bridge-test-throws', passed: false, message: 'exploded' });
  assert.equal(seen[1].passed, false);
  assert.match(seen[1].message, /returned no verdict/);
  assert.deepEqual(seen[2], { id: 'bridge-test-fine', passed: true, status: 'skip', message: 'nothing to judge', fixCommand: 'run x', detail: { n: 1 } });
});

test('as a script: stdin in, prefixed lines out, and what a body prints never becomes a result', () => {
  const request = JSON.stringify({ phase: 'check', ids: ['curl-available'], dir: root });
  const run = spawnSync(process.execPath, [MODULE], { input: request, encoding: 'utf8', cwd: root });
  assert.equal(run.status, 0, run.stderr);
  const results = run.stdout.split('\n').filter((line) => line.startsWith(RESULT_PREFIX));
  assert.equal(results.length, 2);
  assert.equal(JSON.parse(results[0].slice(RESULT_PREFIX.length)).id, 'curl-available');
});

test('as a script: a malformed request exits 2 with one refusal line', () => {
  const run = spawnSync(process.execPath, [MODULE], { input: 'not json', encoding: 'utf8', cwd: root });
  assert.equal(run.status, 2);
  assert.match(run.stdout, /"kind":"refusal"/);
});
