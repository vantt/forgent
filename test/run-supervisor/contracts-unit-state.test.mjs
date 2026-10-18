import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFAULT_GATE_KILL_GRACE_MS } from '../../src/run-supervisor/gate-kill-grace.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (name) => JSON.parse(readFileSync(join(root, 'packages/run-supervisor/contracts', name), 'utf8'));

const unitState = readJson('unit-state.v1.json');
const cancel = readJson('cancel-requested.v1.json');
const recover = readJson('recover-actions.v1.json');
const receipt = readJson('receipt.v1.json');
const closed = readJson('closed.v1.json');

test('unit and attempt states are the named sets with a rule each', () => {
  assert.deepEqual(unitState.unitState.enum, ['running', 'awaiting-resume', 'completed', 'failed']);
  for (const state of unitState.unitState.enum) assert.equal(typeof unitState.unitState.rules[state], 'string', state);
  assert.deepEqual(unitState.attemptState.enum,
    ['running', 'being-adopted', 'closed', 'legacy-run', 'abandoned-not-started', 'abandoned-before-brief', 'abandoned-legacy', 'superseded']);
  for (const state of unitState.attemptState.enum) assert.equal(typeof unitState.attemptState.rules[state], 'string', state);
});

test('awaiting-resume needs a closed last attempt, no unit-summary and no live controller', () => {
  const rule = unitState.unitState.rules['awaiting-resume'];
  assert.match(rule, /closed/);
  assert.match(rule, /unit-summary\.json does not exist/);
  assert.match(rule, /no live controller/);
  assert.match(unitState.unitState.liveController.judge, /proven dead/);
});

test('abandoned-not-started agrees with the receipt outcome set', () => {
  for (const o of ['abandoned-not-started', 'abandoned-before-brief', 'cancelled']) assert.ok(receipt.fields.outcome.enum.includes(o), o);
  assert.deepEqual(closed.fields.closedBy.enum, ['supervisor', 'adopt']);
});

test('cancel-requested names who asked and keeps the fields the supervisor reads', () => {
  assert.deepEqual(cancel.fields.by.enum, ['signal:SIGINT', 'signal:SIGTERM', 'recover']);
  for (const field of ['v', 'attemptId', 'requestedBy', 'by', 'requester', 'at']) assert.ok(field in cancel.fields, field);
  assert.deepEqual(cancel.exitCodes, { 'signal:SIGINT': 130, 'signal:SIGTERM': 143 });
  assert.equal(unitState.signalExit.firstSignal.includes('130'), true);
  assert.equal(unitState.signalExit.firstSignal.includes('143'), true);
});

test('the cancel wait key is documented with its default and floor', () => {
  const key = unitState.config['dispatch.cancelWaitMs'];
  assert.match(key.default, /gateKillGraceMs \+ 5000/);
  assert.equal(key.min, 1000);
  assert.equal(DEFAULT_GATE_KILL_GRACE_MS + 5000, 15000);
});

test('resume rules cover every attempt state a resume can meet', () => {
  const keys = Object.keys(unitState.resumeRule).join(' ');
  for (const state of ['closed', 'running', 'being-adopted', 'abandoned-not-started', 'abandoned-before-brief', 'legacy-run']) {
    assert.ok(keys.includes(state), state);
  }
  assert.match(unitState.resumeRule['running|being-adopted'], /attempt-still-running/);
  assert.match(unitState.resumeRule.concurrentResume, /resume-in-progress/);
  assert.match(unitState.resumeRule.neverSecondSupervisor, /never starts a supervisor/);
});

test('automatic resume stays deferred with its seam named', () => {
  assert.match(unitState.deferred.automaticResume, /unit-control/);
  assert.match(unitState.deferred.automaticResume, /single-taker/);
});

test('recover offers adopt beside the existing actions', () => {
  assert.deepEqual(Object.keys(recover.actions), ['adopt', 'abandon-legacy', 'resume-driver', 'reassign-driver']);
  assert.equal(recover.actions['abandon-legacy'].shape.type, 'abandon-legacy');
  assert.equal(recover.actions.adopt.shape.type, 'adopt');
  assert.match(recover.actions.adopt.stillLegal, /running or being-adopted makes it illegal/);
});
