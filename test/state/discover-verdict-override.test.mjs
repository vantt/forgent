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
// rounds on tsk-4xg, 5 on tsk-5cf itself, neither ever converged). Always
// logged as a decision naming the disagreement it overrode -- never a
// silent bypass, matching the "never silently overridden" stance
// docs/explanation/judge-verdict-second-pass-semantic-check.md already
// states for the two-judge-disagreement path this flag proceeds past.
//
// CLI-level (spawns the real bin/fgos.mjs, mirrors test/cli/fgos.test.mjs's
// own convention) with a fake judge executor -- no real agent CLI invoked.

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

// Always disagrees on the second-pass verify check, with the given reason
// -- unlike test/cli/fgos.test.mjs's own writeRunnerConfig, which always
// auto-agrees there. First-pass (judgeDiscovery-shaped) requests get
// whatever `firstPassVerdict` the caller configures, unused when the CLI
// call always supplies its own --verdict clear (this file's own case).
function writeDisagreeingRunnerConfig(cwd, reason, firstPassVerdict = { clear: true, verify: 'SHOULD NEVER SURFACE' }) {
  const scriptPath = path.join(cwd, 'disagreeing-verdict-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    const prompt = process.argv[2] ?? '';
    if (prompt.includes('Kiểm tra độc lập một lệnh verify')) {
      process.stdout.write(${JSON.stringify(JSON.stringify({ agrees: false, reason }))});
    } else {
      process.stdout.write(${JSON.stringify(JSON.stringify(firstPassVerdict))});
    }
    process.exit(0);
    `,
  );
  const cfg = {
    executor: { command: process.execPath, args: [scriptPath, '{prompt}'] },
    models: { light: 'haiku', standard: 'sonnet', heavy: 'opus' },
    timeoutMs: 5000,
  };
  fs.writeFileSync(path.join(cwd, '.fgos-runner.json'), JSON.stringify(cfg));
}

test('discover --verdict clear without --force still parks in awaiting-human on a disputed verify (regression: unchanged default)', () => {
  const cwd = tmpCwd();
  writeDisagreeingRunnerConfig(cwd, 'too generic, just word presence');
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- disputed']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).outcome, 'verify-disputed');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'clarify');
});

test('discover --verdict clear --force proceeds past a disputed verify instead of parking, and logs the override as a decision', () => {
  const cwd = tmpCwd();
  writeDisagreeingRunnerConfig(cwd, 'too generic, just word presence');
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- forced', '--force']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).outcome, 'clear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].stage, 'decompose');
  assert.equal(view.work[id].verify, 'npm test -- forced');
  assert.notEqual(view.work[id].status, 'awaiting-human');

  const shown = envelopeData(run(cwd, ['show', id]).stdout);
  const overrideDecision = shown.decisions.find((d) => typeof d.text === 'string' && d.text.includes('--force overrode'));
  assert.ok(overrideDecision, 'expected a decision record naming the --force override');
  assert.match(overrideDecision.text, /npm test -- forced/);
  assert.match(overrideDecision.rationale, /too generic, just word presence/);
});

test('discover --verdict unclear --force is a silent no-op for --force (force only ever applies to the clear branch)', () => {
  const cwd = tmpCwd();
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  const result = run(cwd, ['discover', id, '--verdict', 'unclear', '--question', 'Which provider?', '--force']);
  assert.equal(result.status, 0);
  assert.equal(envelopeData(result.stdout).outcome, 'unclear');

  const view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.gates[id].ask, 'Which provider?');
});

// tsk-nfa D1: a --force call on an item a PRIOR discover call already
// parked (awaiting-human) must refuse instead of silently advancing stage
// while status stays parked -- the exact repro (tsk-4y2) that left an item
// stuck at stage executing + status awaiting-human, unreturnable via
// `fgos return` until a human ran `fgos answer` by hand.
test('discover --verdict clear --force refuses when the item is already awaiting-human, instead of moving stage past a still-parked status', () => {
  const cwd = tmpCwd();
  writeDisagreeingRunnerConfig(cwd, 'too generic, just word presence');
  const id = JSON.parse(run(cwd, ['submit', 'Ship the thing']).stdout).data.id;

  // Round 1 (no --force): parks the item, exactly like the regression test above.
  const round1 = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- disputed']);
  assert.equal(round1.status, 0);
  assert.equal(envelopeData(round1.stdout).outcome, 'verify-disputed');

  let view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'clarify');

  // Round 2, same command plus --force, run directly on the still-parked item.
  const round2 = run(cwd, ['discover', id, '--verdict', 'clear', '--verify', 'npm test -- disputed', '--force']);
  assert.notEqual(round2.status, 0);
  assert.match(round2.stderr, /already "awaiting-human"/);
  assert.match(round2.stderr, new RegExp(`fgos answer ${id}`));

  // Refused before touching state: stage/status stay exactly where round 1 left them.
  view = envelopeData(run(cwd, ['list']).stdout);
  assert.equal(view.work[id].status, 'awaiting-human');
  assert.equal(view.work[id].stage, 'clarify');
});
