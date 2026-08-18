import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

// tsk-5cf D1b: fgos discover --force lets a caller that already reasoned
// live through a disputed second-pass verify judge proceed past it instead
// of parking forever -- confirmed necessary by direct reproduction (10
// rounds on tsk-4xg, 5 on tsk-5cf itself, neither ever converged).
//
// tsk-1x3 D1/D9/D17 (docs/history/fanout-and-delegation-rubric/CONTEXT.md):
// the second-pass verify check (`judgeVerifySemanticCorrectness`) is now
// purely mechanical (verify-pattern-check.mjs) — no subprocess, and it can
// only ever disagree on the documented `node --test`/`--test-name-pattern`
// reporter-format trap. The `writeDisagreeingRunnerConfig` executor this
// file used to configure (an arbitrary "too generic, just word presence"
// disagreement reason) has nothing left to answer, and is retired along
// with it. This also means `--force`'s own "override a non-mechanical
// disagreement" branch is now structurally unreachable (`resolveDiscovery`'s
// `secondPass.mechanical !== true` check, discovery.mjs) — the same finding
// `judge-verify-second-pass-stability.test.mjs` already documents for the
// unit-test layer; the CLI-level test that exercised it here is retired
// with it, not silently rewritten to pretend it still passes.

function rawTmpCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-discover-override-'));
}

function tmpCwd() {
  const cwd = rawTmpCwd();
  assert.equal(run(cwd, ['init']).status, 0, 'tmpCwd(): "fgos init" failed to bootstrap .fgos/');
  return cwd;
}

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

// tsk-12t: the documented `node --test`/`--test-name-pattern` reporter-
// format trap — the ONE thing the mechanical check still catches, reused
// here to produce a real, reachable "verify-disputed" outcome without any
// executor.
const KNOWN_BAD_VERIFY = 'node --test --test-name-pattern="x" test/foo.test.mjs | grep "^# pass"';

test('discover --verdict clear without --force still parks in awaiting-human on a mechanically disputed verify (regression: unchanged default)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', KNOWN_BAD_VERIFY]);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).outcome, 'verify-disputed');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'discovery');
});

const VALID_QUESTION = `## Context

We need to clarify which provider should be used for the payment gateway integration.

## Why this matters

The choice of provider determines the SDK dependencies and API configuration required.`;

test('discover --verdict unclear --force is a silent no-op for --force (force only ever applies to the clear branch)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'unclear', '--question', VALID_QUESTION, '--force']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).outcome, 'unclear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.gates[id].ask, VALID_QUESTION);
});

// tsk-nfa D1: a --force call on an item a PRIOR discover call already
// parked (awaiting-human) must refuse instead of silently advancing stage
// while status stays parked -- the exact repro (tsk-4y2) that left an item
// stuck at stage executing + status awaiting-human, unreturnable via
// `fgos return` until a human ran `fgos answer` by hand. This guard
// (discovery.mjs line ~304) fires unconditionally for a clean clear verdict
// against an already-parked item, entirely outside the verify-dispute
// branch -- --force is irrelevant to it either way.
//
// tsk-1x3 finding: round 1 below parks via an UNCLEAR verdict rather than a
// mechanically disputed clear one. A disputed-clear round 1 would ALSO
// reach `awaiting-human`, but a --force retry on THAT specific park now
// falls through resolveDiscovery's disputedChild-equivalent `else` branch
// again (mechanical disagreements are exempt from --force, tsk-12t D6) and
// crashes on a raw FSM "no transition from awaiting-human to awaiting-human"
// error instead of ever reaching this guard's own crafted message -- the
// same "force can only ever override a mechanical disagreement, which
// itself can never be overridden" dead corner already documented in
// judge-verify-second-pass-stability.test.mjs. Parking via unclear instead
// keeps this test proving the real, still-live guard (tsk-4y2's own repro
// never required a disputed verify to begin with).
test('discover --verdict clear --force refuses when the item is already awaiting-human, instead of moving stage past a still-parked status', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  // Round 1: parks the item via an unclear verdict.
  const round1 = run(cwd, ['discover', id, '--verdict', 'unclear', '--question', VALID_QUESTION]);
  assert.equal(round1.status, 0);
  assert.equal(envelopeData(round1.stdout).outcome, 'unclear');

  let view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  // tsk-30v D2/D3: unclear no longer parks in place -- it also advances
  // stage to exploring, even though status stays awaiting-human.
  assert.equal(view.work[id].stage, 'exploring');

  // Round 2: a clear --force call directly on the still-parked item.
  const round2 = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- forced', '--force']);
  assert.notEqual(round2.status, 0);
  assert.match(round2.stderr, /already "awaiting-human"/);
  assert.match(round2.stderr, new RegExp(`fgos answer ${id}`));

  // Refused before touching state: stage/status stay exactly where round 1 left them.
  view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'exploring');
});
