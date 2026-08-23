// test/cli/fgos-decision-kind.test.mjs — tsk-5dn: `fgos decision` grows an
// optional `--kind` flag.
//
// Before this, the CLI's `decision` case never read `flags.kind` at all, so
// every write through it (including a session's own audit line for an
// auto-approved gate, fgos-coding-validating's Step 2) fell through to
// addDecision's own `'design'` default. checkRetrospectiveContent
// (src/state/cleanup-harness.mjs, `d?.kind !== 'engine'`) reads a `'design'`
// record as a human reflecting on the work, so the retrospective gate went
// green with no retrospective document behind it for essentially every item
// that ever auto-approved its validateApprove gate. Internal engine
// bookkeeping (resolveDiscovery/resolvePlan, move's override branches, the
// Iron Law warn-skip record, sync-root/promote-to-component) already passes
// `kind: 'engine'` directly to `addDecision` and is unaffected here -- this
// only wires the same field through the general-purpose CLI verb.

import { test } from 'node:test';
import {
  assert,
  addOk,
  run,
  stateView,
  eventLines,
  tmpCwd,
} from './helpers/fgos-cli-harness.mjs';

test('decision --kind engine tags the stored record kind "engine", exit 0', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const before = eventLines(cwd).length;
  const result = run(cwd, [
    'decision',
    '--text', 'auto-approved validateApprove gate for some-item at level standard',
    '--rationale', 'gate-bypass level standard permits auto-approval per the gate-bypass feature\'s own locked decisions',
    '--relation', 'none',
    '--kind', 'engine',
  ]);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.equal(eventLines(cwd).length, before + 1);
  const logged = stateView(cwd).decisions.at(-1);
  assert.equal(logged.kind, 'engine');
});

test('decision with no --kind still defaults to "design" -- unchanged behavior for every existing caller', () => {
  const cwd = tmpCwd();
  run(cwd, ['init']);
  const result = run(cwd, [
    'decision',
    '--text', 'an ordinary design decision',
    '--rationale', 'because reasons',
    '--relation', 'none',
  ]);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const logged = stateView(cwd).decisions.at(-1);
  assert.equal(logged.kind, 'design');
});

test('decision --kind folds into the per-item decisionsById view too, not just the flat log', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'item-kind-flag');
  const result = run(cwd, [
    'decision',
    '--text', 'auto-approved validateApprove gate for item-kind-flag at level standard',
    '--rationale', 'gate-bypass level standard permits auto-approval',
    '--id', 'item-kind-flag',
    '--relation', 'none',
    '--kind', 'engine',
  ]);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const view = stateView(cwd);
  const perItem = view.decisionsById['item-kind-flag'];
  assert.equal(perItem.length, 1);
  assert.equal(perItem[0].kind, 'engine');
});
