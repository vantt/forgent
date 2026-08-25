// The Iron Law gate's own boundary and level behavior
// (docs/history/iron-law-gate-human-ux/CONTEXT.md D1/D3/D7/D8).
//
// Two things are proven here, and they are deliberately paired: the gate
// no longer fires when the merge target is a work branch, AND it still
// fires unchanged when the target is trunk. Only the second half proves
// the gate is still alive — a suite carrying just the first would go green
// on a gate that had been deleted outright.
//
// The discriminator differs per call site and the two expressions are NOT
// interchangeable (plan.md A1b): `approve`/`merge next` ask
// `resolveRoot(view, id) === id`, `sync-root` asks `!item.parent`. They
// disagree on an item whose `parent` names an id no longer in the view —
// `resolveRoot` returns the item itself there (root-affinity.mjs:75's
// `!work[parent]` bail), while `sync-root` still targets `fgw/<parent>`.
// The last sync-root test below pins exactly that divergence.

import { test } from 'node:test';
import {
  assert,
  fs,
  path,
  addOk,
  addWork,
  releaseClaimFor,
  run,
  stateView,
  eventLines,
  gitAtCwd,
  gitHead,
  commitPending,
  commitPendingBeforeApprove,
  envelopeData,
  initGitCwdMain,
  makeRunnerProposedItemTouching,
} from './helpers/fgos-cli-harness.mjs';

const GATED_MODULE = 'src/runner/iron-law-gate-probe.mjs';

function writeIronLawLevel(cwd, level) {
  const configPath = path.join(cwd, '.fgos', 'config.json');
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  fs.writeFileSync(configPath, `${JSON.stringify({ ...existing, ironLaw: { level } }, null, 2)}\n`);
  commitPending(cwd, `config: ironLaw.level = ${level}`);
}

// A root item (no parent) whose own branch touches a gated module, parked
// at awaiting-approval and ready for a real `approve` into trunk.
function makeGatedRoot(cwd, id) {
  makeRunnerProposedItemTouching(cwd, id, GATED_MODULE, { verify: `test -f ${GATED_MODULE}` });
  commitPendingBeforeApprove(cwd, id);
}

// A leaf whose OWN commit touches the same gated module, parked at
// awaiting-approval. Its merge target is `fgw/<rootId>`, never trunk.
function makeGatedLeaf(cwd, rootId, leafId) {
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, `state: add ${rootId}`);
  gitAtCwd(cwd, ['branch', `fgw/${rootId}`, 'main']);

  addWork(dir, {
    id: leafId, title: `Title ${leafId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [],
    verify: `test -f ${GATED_MODULE}`, parent: rootId,
  });
  // tsk-40m: `take` writes no durable move, but claimWork still durably
  // appends a predicted work.outcome -- flush both that and the earlier
  // work.add to main's own HEAD before branching.
  run(cwd, ['take', '--id', leafId]);
  commitPending(cwd, `state: claim ${leafId}`);

  gitAtCwd(cwd, ['checkout', '-b', `fgw/${leafId}`, `fgw/${rootId}`]);
  const abs = path.join(cwd, GATED_MODULE);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, 'export const produced = true;\n');
  gitAtCwd(cwd, ['add', GATED_MODULE]);
  gitAtCwd(cwd, ['commit', '-q', '-m', `worker output for ${leafId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);

  // The raw move below never goes through settleClaim -- release the
  // runtime claim explicitly right after, same reasoning as the shared
  // harness's makeRunnerProposedItem/makeRunnerProposedLeafItem.
  run(cwd, ['move', leafId, '--to', 'awaiting-approval', '--skip-return-guard', "test fixture setup, not exercising return's own guard"]);
  releaseClaimFor(cwd, leafId);
  commitPendingBeforeApprove(cwd, leafId);
}

// A root whose branch carries a gated-module change, for sync-root. `parent`
// (optional) makes it a NESTED root, whose target is `fgw/<parent>`.
//
// `fgw/<parent>` is cut from main HERE, after this root's own state commits
// and immediately before its work branch — not earlier. A parent branch cut
// before them would leave those `.fgos/events.jsonl` commits inside the
// `parent...root` diff, which ADR0020 rejects outright, blocking the merge
// for a reason that has nothing to do with the gate under test.
function makeGatedSyncRoot(cwd, rootId, parent) {
  const dir = path.join(cwd, '.fgos');
  addWork(dir, {
    id: rootId, title: `Title ${rootId}`, kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [],
    verify: 'true', ...(parent ? { parent } : {}),
  });
  commitPending(cwd, `state: add ${rootId}`);
  // tsk-40m: `take` writes no durable move, but claimWork still durably
  // appends a predicted work.outcome -- flush both before branching. The
  // item stays effectively 'doing' via the runtime claim for as long as
  // sync-root tests never settle it.
  run(cwd, ['take', '--id', rootId]);
  commitPending(cwd, `state: claim ${rootId}`);

  if (parent) {
    gitAtCwd(cwd, ['branch', `fgw/${parent}`, 'main']);
  }
  gitAtCwd(cwd, ['checkout', '-b', `fgw/${rootId}`]);
  const abs = path.join(cwd, GATED_MODULE);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, 'export const produced = true;\n');
  gitAtCwd(cwd, ['add', GATED_MODULE]);
  gitAtCwd(cwd, ['commit', '-q', '-m', `work landed on fgw/${rootId}`]);
  gitAtCwd(cwd, ['checkout', 'main']);
}

function ironLawSkipRecords(cwd, id) {
  return eventLines(cwd)
    .map((line) => JSON.parse(line))
    .filter((e) => e.type === 'decision' && e.payload?.id === id && /iron law/i.test(e.payload?.text ?? ''));
}

// ─── D1: the trunk boundary ────────────────────────────────────────────────

test('approve of a ROOT item (target is trunk) whose diff touches a gated module still REFUSES — the gate is alive at the only boundary it guards', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedRoot(cwd, 'gate-root-trip');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['approve', 'gate-root-trip']);
  assert.equal(result.status, 4, `a root merges into trunk — the gate must still refuse: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.match(result.stderr, new RegExp(GATED_MODULE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.equal(gitHead(cwd), headBefore, 'a refused approve attempts no merge');
  assert.equal(stateView(cwd).work['gate-root-trip'].status, 'awaiting-approval');
});

test('approve of a LEAF item (target is fgw/<root>, never trunk) whose OWN commit touches the SAME gated module PROCEEDS with no --acknowledge-iron-law (D1)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedLeaf(cwd, 'gate-leaf-root', 'gate-leaf-child');

  const result = run(cwd, ['approve', 'gate-leaf-child']);
  assert.equal(result.status, 0, `a leaf never lands on trunk — the gate must not fire: ${result.stdout}${result.stderr}`);
  assert.doesNotMatch(result.stdout, /Iron Law/);
  assert.equal(stateView(cwd).work['gate-leaf-child'].status, 'delivered');
});

test('sync-root of a root with NO parent (target is trunk) whose branch touches a gated module REFUSES', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedSyncRoot(cwd, 'gate-sync-trunk');

  const headBefore = gitHead(cwd);
  const result = run(cwd, ['sync-root', 'gate-sync-trunk']);
  assert.equal(result.status, 4, `no parent means detectTrunk() — the gate must refuse: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
  assert.equal(gitHead(cwd), headBefore, 'a refused sync-root attempts no merge');
});

test('sync-root of a NESTED root (target is fgw/<parent>) whose branch touches the same gated module PROCEEDS (D1)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  const dir = path.join(cwd, '.fgos');
  addWork(dir, { id: 'gate-sync-parent', title: 'parent', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  commitPending(cwd, 'state: add gate-sync-parent');
  makeGatedSyncRoot(cwd, 'gate-sync-nested', 'gate-sync-parent');

  const result = run(cwd, ['sync-root', 'gate-sync-nested']);
  assert.equal(result.status, 0, `a nested root lands on fgw/<parent> — the gate must not fire: ${result.stdout}${result.stderr}`);
  assert.equal(envelopeData(result.stdout).outcome, 'synced', result.stdout);
});

test("sync-root discriminates on !item.parent, NOT resolveRoot: a root whose parent id is absent from the view still targets fgw/<parent>, so the gate stays quiet (plan.md A1b)", () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  // `fgw/ghost-parent` exists as a branch (the helper cuts it), but no work
  // item `ghost-parent` does — resolveRoot bails at root-affinity.mjs:75 and
  // returns the item itself, which would read as "target is trunk" and trip
  // the gate on a merge that never goes near trunk.
  makeGatedSyncRoot(cwd, 'gate-sync-dangling', 'ghost-parent');

  const result = run(cwd, ['sync-root', 'gate-sync-dangling']);
  assert.equal(result.status, 0, `target is fgw/ghost-parent, never trunk — the gate must not fire: ${result.stdout}${result.stderr}`);
  assert.equal(envelopeData(result.stdout).outcome, 'synced', result.stdout);
});

// ─── D3/D7: ironLaw.level, fail-closed to ask ──────────────────────────────

test('a missing ironLaw key fails closed to ask — the root approve above still refuses (D7)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedRoot(cwd, 'gate-level-absent');
  const configPath = path.join(cwd, '.fgos', 'config.json');
  assert.ok(
    !fs.existsSync(configPath) || JSON.parse(fs.readFileSync(configPath, 'utf8')).ironLaw === undefined,
    'this case only means anything while the key is genuinely absent',
  );

  const result = run(cwd, ['approve', 'gate-level-absent']);
  assert.equal(result.status, 4, `absent config must behave exactly like level ask: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
});

test('an unrecognized ironLaw.level fails closed to ask rather than reading as warn (D7)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedRoot(cwd, 'gate-level-bogus');
  writeIronLawLevel(cwd, 'whatever');

  const result = run(cwd, ['approve', 'gate-level-bogus']);
  assert.equal(result.status, 4, `an unknown level is never the permissive one: ${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Iron Law/);
});

// ─── D8: the warn-level record ─────────────────────────────────────────────

test('ironLaw.level = warn lets the same root approve through AND writes exactly one decision record with kind engine (D3/D8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedRoot(cwd, 'gate-level-warn');
  writeIronLawLevel(cwd, 'warn');

  const result = run(cwd, ['approve', 'gate-level-warn']);
  assert.equal(result.status, 0, `warn prints and records instead of refusing: ${result.stdout}${result.stderr}`);
  assert.equal(stateView(cwd).work['gate-level-warn'].status, 'delivered');

  const records = ironLawSkipRecords(cwd, 'gate-level-warn');
  assert.equal(records.length, 1, `expected exactly one skip record, got ${records.length}`);
  assert.equal(
    records[0].payload.kind,
    'engine',
    "a machine-written skip must be kind engine — addDecision's own default is design, which the retrospective gate reads as human reflection",
  );
  assert.match(records[0].payload.text, new RegExp(GATED_MODULE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('ironLaw.level = ask writes NO skip record when it refuses — the record marks a real skip, never an attempt (D8)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedRoot(cwd, 'gate-ask-no-record');
  writeIronLawLevel(cwd, 'ask');

  assert.equal(run(cwd, ['approve', 'gate-ask-no-record']).status, 4);
  assert.equal(ironLawSkipRecords(cwd, 'gate-ask-no-record').length, 0);
});

test('merge next at level warn does NOT skip an Iron-Law item — the pure pre-check reads the same level the real gate does', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedRoot(cwd, 'gate-merge-next-warn');
  writeIronLawLevel(cwd, 'warn');

  const result = run(cwd, ['merge', 'next']);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const data = envelopeData(result.stdout);
  assert.equal(data.picked, 'gate-merge-next-warn', 'at warn the candidate is merged, never parked in `skipped`');
  assert.equal(data.skipped, undefined);
});

// ─── tsk-sdr: the acknowledge-path record ──────────────────────────────────
//
// Before this, `--acknowledge-iron-law` on an item that actually tripped
// the gate proceeded silently — no record of any kind distinguished "never
// tripped" from "tripped, human acknowledged". These pin the new record and
// its own distinct wording (never "skipped") against the SAME loose
// `/iron law/i` grep `ironLawSkipRecords` already uses.

test('approve with --acknowledge-iron-law on a gated ROOT proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedRoot(cwd, 'gate-ack-approve');

  const result = run(cwd, ['approve', 'gate-ack-approve', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `an explicit acknowledgment must let the merge through: ${result.stdout}${result.stderr}`);
  assert.equal(stateView(cwd).work['gate-ack-approve'].status, 'delivered');

  const records = ironLawSkipRecords(cwd, 'gate-ack-approve');
  assert.equal(records.length, 1, `expected exactly one Iron Law record, got ${records.length}`);
  assert.equal(records[0].payload.kind, 'engine', 'a machine-written record must be kind engine');
  assert.match(records[0].payload.text, /acknowledged/i);
  assert.doesNotMatch(records[0].payload.text, /skipped/i, 'must stay distinguishable from a warn-level skip record');
});

test('sync-root with --acknowledge-iron-law on a gated root (no parent) proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr)', () => {
  const cwd = initGitCwdMain();
  run(cwd, ['init']);
  makeGatedSyncRoot(cwd, 'gate-ack-sync');

  const result = run(cwd, ['sync-root', 'gate-ack-sync', '--acknowledge-iron-law']);
  assert.equal(result.status, 0, `an explicit acknowledgment must let the sync through: ${result.stdout}${result.stderr}`);
  assert.equal(envelopeData(result.stdout).outcome, 'synced', result.stdout);

  const records = ironLawSkipRecords(cwd, 'gate-ack-sync');
  assert.equal(records.length, 1, `expected exactly one Iron Law record, got ${records.length}`);
  assert.equal(records[0].payload.kind, 'engine', 'a machine-written record must be kind engine');
  assert.match(records[0].payload.text, /acknowledged/i);
  assert.doesNotMatch(records[0].payload.text, /skipped/i, 'must stay distinguishable from a warn-level skip record');
});
