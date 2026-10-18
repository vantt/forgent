// The seats of one batch share a tab, and a seat the supervisor releases at the same moment another seat
// of the batch is allocated never surfaces an error: the new seat splits from a pane that is still there or
// opens a new tab with the same label. The controller half is `prepareTerminalAttempt`; the supervisor's
// `release` is the host route called from another process, with no queue of this one in front of it.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { prepareTerminalAttempt } from '../../src/runner/dispatch/herdr-round.mjs';
import { createTerminalControl } from '../../src/terminal-control/client.mjs';
import { createFakeHerdr } from '../helpers/fake-herdr-pane.mjs';
import { startTerminalHarness } from '../helpers/terminal-host-harness.mjs';
import { cleanupTrust } from '../../src/run-supervisor/steps/cleanup-trust.mjs';
import { trustedProjectEntry } from '../../src/runner/dispatch/trust-store.mjs';
import { noHost } from './support/terminal-harness.mjs';

const POSIX_ONLY = process.platform === 'win32' && 'the fake herdr is a POSIX shell wrapper';
const skip = noHost || POSIX_ONLY;

let harness;
const scratch = [];
before(async () => { if (!skip) harness = await startTerminalHarness(); });
after(() => {
  harness?.stop();
  for (const dir of scratch) fs.rmSync(dir, { recursive: true, force: true });
});

function fakeWith(scenario = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-groups-'));
  scratch.push(dir);
  return { dir, fake: createFakeHerdr(path.join(dir, 'fake'), scenario) };
}

/** One seat's controller half: what the controller does before it hands the attempt to a supervisor. */
function seat({ dir, fake, name, groupKey, anchorPaneId }) {
  const runDir = path.join(dir, `run-${name}`);
  fs.mkdirSync(runDir, { recursive: true });
  return prepareTerminalAttempt({
    attemptId: `cmd_${name}`, runId: `run_${name}`, runDir, cwd: dir, repoRoot: dir, prompt: `do the work of ${name}`,
    workId: `w-${name}`, tier: 'standard', model: 'sonnet', herdrBin: fake.herdrBin, fullEnv: { ...process.env },
    agentKind: 'claude', dispatchBatchKey: groupKey, anchorPaneId,
  });
}

/** `release` as the supervisor makes it: the host route, from a process of its own. */
function releaseFromAnotherProcess({ fake, key }) {
  const child = spawn(process.env.FGOS_HOST_BIN, ['internal', 'terminal-control', 'release', '--protocol', '1', '--json'], {
    env: { ...process.env, HERDR_SOCKET_PATH: harness.socketPath }, stdio: ['pipe', 'pipe', 'inherit'],
  });
  let stdout = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stdin.end(JSON.stringify({ v: 1, driver: 'herdr', herdrBin: fake.herdrBin, request: { key, disposition: 'close' } }));
  return new Promise((resolve) => child.on('close', () => resolve(JSON.parse(stdout.trim().split('\n').pop() || '{}'))));
}

const verbs = (fake, group, action) => fake.calls().filter((c) => c[0] === group && c[1] === action);
const labelOf = (call) => call[call.indexOf('--label') + 1];

test('the seats of one batch share a tab and each gets the key of its attempt', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}, {}] });
  try {
    const seats = await Promise.all(['a', 'b', 'c'].map((name) => seat({ dir, fake, name, groupKey: 'batch-one' })));
    assert.deepEqual(seats.map((s) => s.slot.key), ['cmd_a', 'cmd_b', 'cmd_c']);
    assert.ok(seats.every((s) => s.slot.groupKey === 'batch-one'));
    assert.equal(verbs(fake, 'tab', 'create').length, 1, 'one tab for the whole batch');
    assert.equal(labelOf(verbs(fake, 'tab', 'create')[0]), 'batch-one');
    const splits = verbs(fake, 'pane', 'split');
    assert.equal(splits.length, 2, 'the other two seats split from panes of the group');
    for (const split of splits) assert.ok(new Set(['mock-pane-1', 'mock-pane-2', 'mock-pane-3']).has(split[split.indexOf('--pane') + 1]));
    assert.deepEqual(fake.closedPaneIds(), [], 'preparing a seat closes nothing');
  } finally { fake.cleanup(); }
});

test('a batch whose first pane is already closed continues in a new tab with the same label', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}] });
  try {
    const first = await seat({ dir, fake, name: 'one', groupKey: 'batch-two' });
    assert.equal((await releaseFromAnotherProcess({ fake, key: first.slot.key })).result, 'released');
    await seat({ dir, fake, name: 'two', groupKey: 'batch-two' });
    assert.deepEqual(verbs(fake, 'tab', 'create').map(labelOf), ['batch-two', 'batch-two']);
    assert.equal(verbs(fake, 'pane', 'split').length, 0);
  } finally { fake.cleanup(); }
});

test('a caller anchor pane joins the group, so the batch opens beside it and never closes it', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}] });
  try {
    const own = createTerminalControl({ herdrBin: fake.herdrBin }).allocate({ key: 'caller-own', groupKey: 'caller-tab', display: { label: 'caller' } });
    assert.equal(own.result, 'slot');
    const beside = await seat({ dir, fake, name: 'beside', groupKey: 'batch-anchor', anchorPaneId: own.slot.paneId });
    const splits = verbs(fake, 'pane', 'split');
    assert.equal(splits.length, 1, 'opened beside the anchor instead of in a tab of its own');
    assert.equal(splits[0][splits[0].indexOf('--pane') + 1], own.slot.paneId);
    assert.equal((await releaseFromAnotherProcess({ fake, key: beside.slot.key })).result, 'released');
    assert.equal(fake.closedPaneIds().includes(own.slot.paneId), false, 'the anchor is never closed');
  } finally { fake.cleanup(); }
});

test('a seat released while the fourth of its group is allocated: no error surfaces and no split starts from a closed pane', { skip, timeout: 240_000 }, async () => {
  const rounds = 4;
  const { dir, fake } = fakeWith({ panes: Array.from({ length: 3 * rounds + rounds }, () => ({})) });
  try {
    for (let round = 0; round < rounds; round += 1) {
      const groupKey = `batch-race-${round}`;
      const seats = [];
      for (const name of ['a', 'b', 'c']) seats.push(await seat({ dir, fake, name: `${name}${round}`, groupKey }));
      const [released, fourth] = await Promise.all([
        releaseFromAnotherProcess({ fake, key: seats[0].slot.key }),
        seat({ dir, fake, name: `d${round}`, groupKey }),
      ]);
      assert.equal(released.result, 'released', JSON.stringify(released));
      assert.equal(fourth.slot.key, `cmd_d${round}`);
    }
    // Every split names a pane that no earlier call had closed.
    const closed = new Set();
    for (const call of fake.calls()) {
      if (call[0] === 'pane' && call[1] === 'close') closed.add(call[2]);
      if (call[0] === 'pane' && call[1] === 'split') assert.ok(!closed.has(call[call.indexOf('--pane') + 1]), `split from the closed pane ${call[call.indexOf('--pane') + 1]}`);
    }
    assert.equal(verbs(fake, 'tab', 'close').length, 0, 'a tab is never closed');
  } finally { fake.cleanup(); }
});

/** A claude trust store that trusts `repoRoot` (and, when asked, also `extra`). */
function claudeStore(dir, repoRoot, extra = []) {
  const storePath = path.join(dir, 'claude.json');
  fs.writeFileSync(storePath, JSON.stringify({ projects: Object.fromEntries([repoRoot, ...extra].map((p) => [p, trustedProjectEntry()])) }));
  return storePath;
}
const trusted = (storePath) => Object.keys(JSON.parse(fs.readFileSync(storePath, 'utf8')).projects).sort();

test('the folder-trust entry a seat wrote is taken back by the cleanup step, from the record the controller left', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}] });
  try {
    const work = path.join(dir, 'work');
    fs.mkdirSync(work);
    const storePath = claudeStore(dir, dir);
    const runDir = path.join(dir, 'run-trust');
    fs.mkdirSync(runDir, { recursive: true });
    await prepareTerminalAttempt({
      attemptId: 'cmd_trust', runId: 'run_trust', runDir, cwd: work, repoRoot: dir, prompt: 'p', workId: 'w', tier: 'standard', model: 'sonnet',
      herdrBin: fake.herdrBin, fullEnv: { ...process.env }, agentKind: 'claude', dispatchBatchKey: 'g-trust',
      trustStore: { kind: 'claude-json', path: storePath },
    });
    assert.deepEqual(trusted(storePath), [dir, work].sort(), 'the seat\'s directory is trusted while it runs');
    assert.ok(fs.existsSync(path.join(runDir, 'controller', 'trust-context.json')));

    // The controller is gone; the step runs from the attempt directory alone.
    const done = await cleanupTrust({ runDir });
    assert.equal(done.result, 'done');
    assert.equal(done.detail.trust, 'removed');
    assert.deepEqual(trusted(storePath), [dir], 'only the entry the seat wrote is gone');
    assert.equal((await cleanupTrust({ runDir })).detail.trust, 'already-gone', 'the step is safe to run again');
  } finally { fake.cleanup(); }
});

test('an entry a person vouched for is never named for removal', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}] });
  try {
    const work = path.join(dir, 'work');
    fs.mkdirSync(work);
    const storePath = claudeStore(dir, dir, [work]);
    const runDir = path.join(dir, 'run-vouched');
    fs.mkdirSync(runDir, { recursive: true });
    await prepareTerminalAttempt({
      attemptId: 'cmd_vouched', runId: 'run_vouched', runDir, cwd: work, repoRoot: dir, prompt: 'p', workId: 'w', tier: 'standard', model: 'sonnet',
      herdrBin: fake.herdrBin, fullEnv: { ...process.env }, agentKind: 'claude', dispatchBatchKey: 'g-vouched',
      trustStore: { kind: 'claude-json', path: storePath },
    });
    assert.equal(fs.existsSync(path.join(runDir, 'controller', 'trust-context.json')), false, 'nothing was written, so nothing is recorded');
    assert.equal((await cleanupTrust({ runDir })).detail.trust, 'none-written');
    assert.deepEqual(trusted(storePath), [dir, work].sort());
  } finally { fake.cleanup(); }
});
