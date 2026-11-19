// test/native/execution-door.test.mjs — Execution's Node seam: the admission peer server and the run-unit rethrow.
//
// The Rust side of the peer protocol is proven in packages/execution/engine/tests/unit_run.rs against the same
// contract vectors; this file proves the Node side answers them, and that the peer entry the host starts serves the
// Workflow's port over its own stdin and stdout.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PassThrough } from 'node:stream';
import { fileURLToPath } from 'node:url';

import {
  ADMISSION_PEER_PREFIX,
  CaseAdmissionRefusedError,
  RunnerConfigError,
  runUnitErrorOf,
  serveAdmissionPeer,
} from '../../src/native/execution-door.mjs';
import { RunnerConfigError as DispatchRunnerConfigError } from '../../src/runner/dispatch/runner-config-error.mjs';
import { CaseAdmissionRefusedError as ExecutionCaseAdmissionRefusedError } from '../../src/runner/execution/case-admission-port.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readContract = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const peerContract = readContract('packages/execution/contracts/admission-peer/admission-peer.v1.json');
const runUnitContract = readContract('packages/execution/contracts/unit-run/run-unit.v1.json');

const frame = (message) => `${ADMISSION_PEER_PREFIX}${JSON.stringify(message)}\n`;

/** A client of the peer over a stream pair: send frames, read the prefixed answers. */
function client(fromPeer) {
  const answers = [];
  let buffered = '';
  const waiting = [];
  fromPeer.on('data', (chunk) => {
    buffered += chunk.toString('utf8');
    let at;
    while ((at = buffered.indexOf('\n')) !== -1) {
      const line = buffered.slice(0, at);
      buffered = buffered.slice(at + 1);
      if (!line.startsWith(ADMISSION_PEER_PREFIX)) continue;
      answers.push(JSON.parse(line.slice(ADMISSION_PEER_PREFIX.length)));
      while (waiting.length > 0 && waiting[0].count <= answers.length) waiting.shift().resolve();
    }
  });
  return {
    answers,
    until: (count) => (answers.length >= count ? Promise.resolve() : new Promise((resolve) => waiting.push({ count, resolve }))),
  };
}

test('the admission peer answers every contract vector from the port, ignores stray lines and acknowledges both events', async () => {
  // Requests are served one at a time, in order: the port answers each with the vector it was asked for.
  const asked = [];
  const answerOf = (op) => (payload) => {
    const vector = peerContract.vectors[asked.length];
    asked.push({ op, payload });
    assert.deepEqual([op, payload], [vector.op, vector.payload], vector.name);
    return vector.result;
  };
  const port = {
    resolveBinding: answerOf('resolveBinding'),
    admit: answerOf('admit'),
    recheckEffect: (reservationId, ask) => answerOf('recheckEffect')({ reservationId, ...ask }),
    settle: (reservationId, settle) => answerOf('settle')({ reservationId, settle }),
    activityUnitOf: answerOf('activityUnitOf'),
    confinedWriteRefusal: answerOf('confinedWriteRefusal'),
  };
  const events = [];
  const toPeer = new PassThrough();
  const fromPeer = new PassThrough();
  const answers = client(fromPeer);
  const served = serveAdmissionPeer(port, toPeer, fromPeer, {
    onUnitRunCreated: (unitRunId) => events.push(['unitRunCreated', unitRunId]),
    onCaseAdmitted: (caseId, reservationId) => events.push(['caseAdmitted', caseId, reservationId]),
  });

  let id = 0;
  for (const vector of peerContract.vectors) {
    toPeer.write('stray output of a body\n');
    toPeer.write(frame({ protocol: 1, id: ++id, op: vector.op, payload: vector.payload }));
  }
  for (const vector of peerContract.eventVectors) {
    toPeer.write(frame({ protocol: 1, id: ++id, op: 'event', payload: { event: vector.event, data: vector.data } }));
  }
  toPeer.end();
  await served;
  await answers.until(id);

  peerContract.vectors.forEach((vector, i) => {
    assert.deepEqual(answers.answers[i], { protocol: 1, id: i + 1, result: vector.result }, vector.name);
  });
  for (const answer of answers.answers.slice(peerContract.vectors.length)) {
    assert.deepEqual(answer.result, { acknowledged: true });
  }
  assert.deepEqual(events, [['unitRunCreated', 'unit-run-1'], ['caseAdmitted', 'case-1', 'res-1']]);
  assert.equal(asked.length, peerContract.vectors.length);
});

test('the admission peer refuses another protocol, an unknown operation and an operation the port lacks, and carries a port failure', async () => {
  const toPeer = new PassThrough();
  const fromPeer = new PassThrough();
  const answers = client(fromPeer);
  const port = {
    resolveBinding() {
      throw Object.assign(new Error('bindings unreadable'), { code: 'binding-view-unavailable' });
    },
  };
  const served = serveAdmissionPeer(port, toPeer, fromPeer);
  toPeer.write(frame({ protocol: 2, id: 1, op: 'admit', payload: {} }));
  toPeer.write(frame({ protocol: 1, id: 2, op: 'launch', payload: {} }));
  toPeer.write(frame({ protocol: 1, id: 3, op: 'admit', payload: {} }));
  toPeer.write(frame({ protocol: 1, id: 4, op: 'resolveBinding', payload: { worktree: '/w', caseId: null } }));
  toPeer.end();
  await served;
  await answers.until(4);
  assert.deepEqual(answers.answers.map((a) => [a.protocol, a.id, a.error?.code]), [
    [1, 1, 'host-version-mismatch'],
    [1, 2, 'unknown-operation'],
    [1, 3, 'operation-not-served'],
    [1, 4, 'binding-view-unavailable'],
  ]);
  assert.equal(answers.answers[3].error.message, 'bindings unreadable');
});

test('a native run-unit error result is rethrown as the Node class its tag names, with the class Node gave it', () => {
  // One class identity for an error thrown in process and one rethrown from a native result.
  assert.equal(DispatchRunnerConfigError, RunnerConfigError);
  assert.equal(ExecutionCaseAdmissionRefusedError, CaseAdmissionRefusedError);

  const byName = Object.fromEntries(runUnitContract.vectors.map((v) => [v.name, runUnitErrorOf({ ok: false, error: v.error })]));
  const refused = byName['admission refused'];
  assert.ok(refused instanceof CaseAdmissionRefusedError);
  assert.ok(refused instanceof RunnerConfigError, 'Work branches on RunnerConfigError for an admission refusal too');
  assert.equal(refused.code, 'case-admission-busy');
  assert.deepEqual(refused.refusal, { code: 'case-admission-busy', condition: 'busy' });
  assert.equal(refused.message, 'case admission refused case-admission-busy: busy');
  assert.equal(refused.errorClass, undefined);

  const config = byName['runner config'];
  assert.ok(config instanceof RunnerConfigError);
  assert.ok(!(config instanceof CaseAdmissionRefusedError));
  assert.deepEqual([config.code, config.phase, config.message], ['nested-write-from-confined-worker', 'pre-admission', 'nested-write-from-confined-worker: refused']);

  const custody = byName['custody predecessor unknown'];
  assert.ok(!(custody instanceof RunnerConfigError));
  assert.equal(custody.errorClass, 'custody-predecessor-unknown', 'Workflow retries a writing unit on this class');

  // A failed Git or port call was a classless error in Node: the fanout batch reads `errorClass || 'error'`.
  for (const errorClass of ['git-error', 'case-admission-port-failed']) {
    const rethrown = runUnitErrorOf({ ok: false, error: { tag: 'Error', errorClass, message: 'failed' } });
    assert.equal(rethrown.errorClass || 'error', 'error', errorClass);
  }

  const dispatch = runUnitErrorOf({ ok: false, error: { tag: 'Error', errorClass: 'lease-conflict', code: 'lease-conflict', message: 'held', fields: { name: 'DispatchError', cwd: '/w' } } });
  assert.deepEqual([dispatch.name, dispatch.errorClass, dispatch.code, dispatch.cwd], ['DispatchError', 'lease-conflict', 'lease-conflict', '/w']);
});

test('the peer entry the host starts serves the Workflow port of the main checkout over its stdin and stdout', async () => {
  const repoRoot = makeFixtureDir('admission-peer-');
  const env = { ...process.env };
  delete env.FGOS_DISPATCH_DEPTH;
  const child = spawn(process.execPath, [path.join(root, 'src/workflow/admission-peer.mjs'), '--repo-root', repoRoot], { env, stdio: ['pipe', 'pipe', 'inherit'] });
  const answers = client(child.stdout);
  child.stdin.write(frame({ protocol: 1, id: 1, op: 'confinedWriteRefusal', payload: { mainRoot: repoRoot, caseId: null } }));
  child.stdin.write(frame({ protocol: 1, id: 2, op: 'activityUnitOf', payload: { mainRoot: repoRoot, caseId: 'case-none', activity: 'build' } }));
  child.stdin.write(frame({ protocol: 1, id: 3, op: 'resolveBinding', payload: { worktree: repoRoot, caseId: null } }));
  child.stdin.end();
  const exited = new Promise((resolve) => child.on('exit', resolve));
  await answers.until(3);
  assert.equal(await exited, 0);
  assert.deepEqual(answers.answers.slice(0, 2), [{ protocol: 1, id: 1, result: null }, { protocol: 1, id: 2, result: null }]);
  assert.equal(answers.answers[2].result.answer, 'unbound');
});
