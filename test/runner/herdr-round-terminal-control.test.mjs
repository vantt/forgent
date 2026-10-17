// A herdr round talks to herdr only through terminal-control: allocate a pane by key, launch the agent in
// it, type the brief, read the result, release the pane. These tests drive the real adapter door and the
// real `fgos internal terminal-control` route against a fake herdr (test/helpers/fake-herdr-pane.mjs).
// The fake gives every pane a real process and plays the worker protocol; what is checked is which herdr
// calls the round made and which pane each one touched.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { EXECUTOR_ADAPTERS } from '../../src/runner/dispatch/transport.mjs';
import { createTerminalControl } from '../../src/terminal-control/client.mjs';
import { readVisibility } from '../../src/runner/dispatch/visibility-session.mjs';
import { createFakeHerdr } from '../helpers/fake-herdr-pane.mjs';
import { startTerminalHarness } from '../helpers/terminal-host-harness.mjs';

const POSIX_ONLY = process.platform === 'win32' && 'the fake herdr is a POSIX shell wrapper';

let harness;
const scratch = [];
before(async () => { harness = await startTerminalHarness(); });
after(() => {
  harness?.stop();
  for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

function fakeWith(scenario = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-round-tc-'));
  scratch.push(dir);
  const fake = createFakeHerdr(path.join(dir, 'fake'), scenario);
  return { dir, fake };
}

function round({ dir, fake, name, dispatchBatchKey, anchorPaneId }) {
  const runDir = path.join(dir, `run-${name}`);
  fs.mkdirSync(runDir, { recursive: true });
  const result = EXECUTOR_ADAPTERS['herdr-spawn'](
    { command: 'agy', args: [], prompt: `do the work of ${name}`, env: {}, interactiveMode: { exitCommand: '/exit' } },
    {
      cwd: dir, timeoutMs: 20000, idleTimeoutMs: 20000, workId: `w-${name}`, tier: 'standard', model: 'sonnet',
      herdrBin: fake.herdrBin, runDir, transportDeadlines: { resendAfterMs: 400 }, dispatchBatchKey, anchorPaneId,
    },
  );
  return { runDir, result };
}

const verbs = (fake, group, action) => fake.calls().filter((c) => c[0] === group && c[1] === action);

test('a round allocates, launches, briefs and releases its pane; no tab is ever closed and no empty pane is left', { skip: POSIX_ONLY }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}] });
  try {
    const { result, runDir } = round({ dir, fake, name: 'solo' });
    const res = await result;
    assert.equal(res.status, 0);

    assert.equal(verbs(fake, 'tab', 'create').length, 1, 'the group opens one tab and its own first pane is the round pane');
    assert.equal(verbs(fake, 'pane', 'split').length, 0, 'no empty root pane is split from');
    assert.equal(verbs(fake, 'agent', 'start').length, 1, 'the agent is started once, through the driver');
    const briefs = verbs(fake, 'agent', 'prompt').filter((c) => !String(c[3]).startsWith('/'));
    assert.equal(briefs.length, 1, 'the brief is typed once');
    assert.equal(fake.calls().some((c) => c[0] === 'tab' && c[1] === 'close'), false, 'a tab is never closed');
    assert.deepEqual(fake.closedPaneIds(), ['mock-pane-1'], 'the round closed exactly the pane it was given');
    assert.ok(Object.values(fake.panes()).every((p) => p.closed), 'no pane is left open');
    assert.match(readVisibility(runDir).terminalKey, /^fgos-w-solo-/, 'the run record carries the slot key');
  } finally { fake.cleanup(); }
});

test('rounds of one batch share a tab: the later seats split from a live pane of the group', { skip: POSIX_ONLY }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}, {}] });
  try {
    const seats = ['a', 'b', 'c'].map((name) => round({ dir, fake, name, dispatchBatchKey: 'batch-one' }));
    const results = await Promise.all(seats.map((s) => s.result));
    assert.ok(results.every((r) => r.status === 0));

    assert.equal(verbs(fake, 'tab', 'create').length, 1, 'one tab for the whole batch');
    const splits = verbs(fake, 'pane', 'split');
    assert.equal(splits.length, 2, 'the other two seats split from panes of the group');
    const livePanes = new Set(['mock-pane-1', 'mock-pane-2', 'mock-pane-3']);
    for (const split of splits) assert.ok(livePanes.has(split[split.indexOf('--pane') + 1]), 'each split is anchored on a pane the group already holds');
    const labels = verbs(fake, 'tab', 'create').map((c) => c[c.indexOf('--label') + 1]);
    assert.equal(labels[0], 'batch-one', 'the tab carries the batch key, not a made-up label');
  } finally { fake.cleanup(); }
});

test('a batch whose first pane is already closed continues in a new tab with the same label', { skip: POSIX_ONLY }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}] });
  try {
    const first = await round({ dir, fake, name: 'one', dispatchBatchKey: 'batch-two' }).result;
    assert.equal(first.status, 0);
    const second = await round({ dir, fake, name: 'two', dispatchBatchKey: 'batch-two' }).result;
    assert.equal(second.status, 0);
    const labels = verbs(fake, 'tab', 'create').map((c) => c[c.indexOf('--label') + 1]);
    assert.deepEqual(labels, ['batch-two', 'batch-two']);
    assert.equal(verbs(fake, 'pane', 'split').length, 0);
  } finally { fake.cleanup(); }
});

test('a caller anchor pane is attached to the group, so the batch opens beside it and never closes it', { skip: POSIX_ONLY }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}] });
  try {
    // The caller's own pane, known to herdr before the round starts.
    const tc = createTerminalControl({ herdrBin: fake.herdrBin });
    const own = tc.allocate({ key: 'caller-own', groupKey: 'caller-tab', display: { label: 'caller' } });
    assert.equal(own.result, 'slot');
    const res = await round({ dir, fake, name: 'beside', dispatchBatchKey: 'batch-anchor', anchorPaneId: own.slot.paneId }).result;
    assert.equal(res.status, 0);
    const splits = verbs(fake, 'pane', 'split');
    assert.equal(splits.length, 1, 'the round opened beside the anchor instead of in a tab of its own');
    assert.equal(splits[0][splits[0].indexOf('--pane') + 1], own.slot.paneId);
    assert.equal(fake.closedPaneIds().includes(own.slot.paneId), false, 'the anchor is never closed');
  } finally { fake.cleanup(); }
});

test('a failed round keeps its pane; closing it later is a release by the recorded key', { skip: POSIX_ONLY }, async () => {
  const { dir, fake } = fakeWith({
    panes: [{ blockedAfterBrief: true }],
    blockScreen: 'Trust this folder? 1. Trust and continue',
  });
  try {
    const { result, runDir } = round({ dir, fake, name: 'blocked' });
    await assert.rejects(() => result, (err) => err.reason === 'blocked' || err.outcome === 'blocked' || /blocked/.test(err.message));
    assert.deepEqual(fake.closedPaneIds(), [], 'the evidence on screen is kept: nothing closed the failed pane');

    const key = readVisibility(runDir).terminalKey;
    assert.ok(key, 'the run record names the slot');
    const tc = createTerminalControl({ herdrBin: fake.herdrBin });
    assert.equal(tc.inspect({ key }).pane, 'live');
    assert.deepEqual(tc.release({ key, disposition: 'close' }), { result: 'released', disposition: 'close' });
    assert.deepEqual(fake.closedPaneIds(), ['mock-pane-1'], 'the slot key found and closed exactly that pane');
  } finally { fake.cleanup(); }
});

test('a controller that died after allocate leaves the pane alone; the reconcile scan reports it', { skip: POSIX_ONLY }, () => {
  const { fake } = fakeWith({ panes: [{}] });
  try {
    const tc = createTerminalControl({ herdrBin: fake.herdrBin, config: { allocationGraceMs: 0 } });
    assert.equal(tc.allocate({ key: 'orphan-slot', groupKey: 'g-orphan', display: { label: 'g' } }).result, 'slot');
    // The controller is gone: nothing launches, nothing releases. A later scan only reports.
    const scan = tc.reconcileScan({ olderThanMs: 0 });
    assert.equal(scan.result, 'scan');
    assert.ok(scan.findings.some((f) => f.key === 'orphan-slot' && f.kind === 'allocated-not-launched-bare-shell'), JSON.stringify(scan.findings));
    assert.deepEqual(fake.closedPaneIds(), [], 'nobody closes a pane because time passed');
    assert.equal(tc.inspect({ key: 'orphan-slot' }).pane, 'live');
  } finally { fake.cleanup(); }
});
