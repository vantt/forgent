// The seats of one batch share a tab, and a seat the supervisor releases at the same moment another seat
// of the batch is allocated never surfaces an error: the new seat splits from a pane that is still there or
// opens a new tab with the same label. The controller half is `prepareTerminalAttempt`; the supervisor's
// `release` is the host route called from another process, with no queue of this one in front of it.
import '../helpers/process-tmp-root.mjs';
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
function seat({ dir, fake, name, groupKey, anchorPaneId, ...more }) {
  const runDir = path.join(dir, `run-${name}`);
  fs.mkdirSync(runDir, { recursive: true });
  return prepareTerminalAttempt({
    attemptId: `cmd_${name}`, runId: `run_${name}`, runDir, cwd: dir, repoRoot: dir, prompt: `do the work of ${name}`,
    workId: `w-${name}`, tier: 'standard', model: 'sonnet', herdrBin: fake.herdrBin, fullEnv: { ...process.env },
    agentKind: 'claude', dispatchBatchKey: groupKey, anchorPaneId, ...more,
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
    const renames = verbs(fake, 'pane', 'rename');
    assert.equal(renames.length, 3, 'every seat\'s pane is named, the first of the tab included');
    assert.ok(renames.every((call) => call[call.length - 1] === 'batch-one'));
  } finally { fake.cleanup(); }
});

test('a batch size reaches the placement policy: the split plans equal thirds, and halves without it', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}, {}, {}] });
  try {
    // The policy is named so a machine config that pins another one cannot change the proof.
    const terminalConfig = { policy: 'even-split' };
    await seat({ dir, fake, name: 'sized-1', groupKey: 'batch-sized', terminalConfig, dispatchBatchSize: 3 });
    await seat({ dir, fake, name: 'sized-2', groupKey: 'batch-sized', terminalConfig, dispatchBatchSize: 3 });
    await seat({ dir, fake, name: 'unsized-1', groupKey: 'batch-unsized', terminalConfig });
    await seat({ dir, fake, name: 'unsized-2', groupKey: 'batch-unsized', terminalConfig });
    const ratios = verbs(fake, 'pane', 'split').map((split) => Number(split[split.indexOf('--ratio') + 1]));
    assert.equal(ratios.length, 2);
    assert.ok(Math.abs(ratios[0] - 1 / 3) < 1e-6, `sized batch plans thirds, got ${ratios[0]}`);
    assert.equal(ratios[1], 0.5);
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
  // The anchor is the caller's own pane: its shell is this process.
  const { dir, fake } = fakeWith({ panes: [{}, {}], shellPid: process.pid });
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

const MULTILINE_PROMPT = 'read the spec\nthen change the file\n\nand report what you did';

test('inline delivery types the whole brief and still writes brief-1.md; file-pointer types one line that names it', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}] });
  try {
    const inline = await seat({ dir, fake, name: 'inline', groupKey: 'g-delivery', prompt: MULTILINE_PROMPT });
    const inlineBrief = fs.readFileSync(path.join(dir, 'run-inline', 'brief-1.md'), 'utf8');
    assert.ok(inlineBrief.includes(MULTILINE_PROMPT), 'the brief carries the real prompt verbatim, newlines and all');
    assert.equal(inline.briefPath, path.join(dir, 'run-inline', 'brief-1.md'), 'the supervisor types what the brief file holds');

    const pointer = await seat({ dir, fake, name: 'pointer', groupKey: 'g-delivery', prompt: MULTILINE_PROMPT, delivery: 'file-pointer' });
    const typed = fs.readFileSync(pointer.briefPath, 'utf8');
    assert.ok(!typed.includes('\n') || typed.trim().split('\n').length === 1, 'what is typed at a TUI in file-pointer mode is a single line');
    assert.match(typed.trim(), /^Read .*brief-1\.md and do what it says\.$/);
    assert.ok(!typed.includes('read the spec'), 'the work itself never goes through the terminal in file-pointer mode');
    assert.ok(fs.readFileSync(path.join(dir, 'run-pointer', 'brief-1.md'), 'utf8').includes(MULTILINE_PROMPT), 'the pointer names a brief that has the work');
  } finally { fake.cleanup(); }
});

test('the brief renders the execution contract and one result path, the outbox claim', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}] });
  try {
    await seat({ dir, fake, name: 'contract', groupKey: 'g-contract', prompt: 'Implement read-only analysis', effectiveContract: { mutation: 'read-only', limits: { executorTimeoutMs: 45000 } } });
    const brief = fs.readFileSync(path.join(dir, 'run-contract', 'brief-1.md'), 'utf8');
    assert.match(brief, /## Execution contract/);
    assert.match(brief, /Mutation: read-only/);
    assert.match(brief, /Timeout: 45000ms/);
    assert.match(brief, /Result claim path: .*outbox[/\\]result-1\.json/);
    assert.equal(brief.includes('agent-result.json'), false, 'no second, conflicting result path');
  } finally { fake.cleanup(); }
});

test('a result already in the run directory refuses the seat before a pane exists: it would settle on somebody else\'s result', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}] });
  try {
    const runDir = path.join(dir, 'run-stale');
    fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'outbox', 'result-1.json'), '{}');
    await assert.rejects(() => seat({ dir, fake, name: 'stale', groupKey: 'g-stale' }), (err) => err.reason === 'stale-result-in-run-dir');
    assert.equal(verbs(fake, 'tab', 'create').length, 0, 'no pane was opened');
  } finally { fake.cleanup(); }
});

test('a dead anchor pane opens the seat its own tab instead of failing it', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}], deadAnchorPane: 'w9:gone' });
  try {
    const seated = await seat({ dir, fake, name: 'deadanchor', groupKey: 'g-dead', anchorPaneId: 'w9:gone' });
    assert.equal(seated.slot.key, 'cmd_deadanchor');
    assert.equal(verbs(fake, 'pane', 'split').length, 0, 'a pane that is not live is no anchor to split from');
    assert.equal(verbs(fake, 'tab', 'create').length, 1, 'the seat opens its own tab');
  } finally { fake.cleanup(); }
});

test('an agy trust entry a seat wrote is removed by the step; one the person already had stays', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}] });
  try {
    const work = path.join(dir, 'work');
    fs.mkdirSync(work);
    const settingsPath = path.join(dir, 'agy-settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify({ trustedWorkspaces: [dir] }));
    const trustedWorkspaces = () => JSON.parse(fs.readFileSync(settingsPath, 'utf8')).trustedWorkspaces.sort();

    await seat({ dir, fake, name: 'agy1', groupKey: 'g-agy', cwd: work, agentKind: 'agy', trustStore: { kind: 'agy', path: settingsPath } });
    assert.deepEqual(trustedWorkspaces(), [dir, work].sort());
    await cleanupTrust({ runDir: path.join(dir, 'run-agy1') });
    assert.deepEqual(trustedWorkspaces(), [dir]);

    fs.writeFileSync(settingsPath, JSON.stringify({ trustedWorkspaces: [dir, work] }));
    await seat({ dir, fake, name: 'agy2', groupKey: 'g-agy', cwd: work, agentKind: 'agy', trustStore: { kind: 'agy', path: settingsPath } });
    await cleanupTrust({ runDir: path.join(dir, 'run-agy2') });
    assert.deepEqual(trustedWorkspaces(), [dir, work].sort(), 'an entry it did not write is not removed');
  } finally { fake.cleanup(); }
});

test('the brief a reviewer reads says its claim needs assessment.verdict; the producer\'s does not', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}, {}] });
  try {
    await seat({ dir, fake, name: 'producer', groupKey: 'g-roles', effectiveContract: { mutation: 'mutating', assignment: { role: 'producer', operation: 'implement-item' } } });
    await seat({ dir, fake, name: 'reviewer', groupKey: 'g-roles', effectiveContract: { mutation: 'read-only', assignment: { role: 'reviewer', operation: 'review-item' } } });
    assert.match(fs.readFileSync(path.join(dir, 'run-reviewer', 'brief-1.md'), 'utf8'), /"assessment\.verdict" is required for this assessment role/);
    assert.doesNotMatch(fs.readFileSync(path.join(dir, 'run-producer', 'brief-1.md'), 'utf8'), /assessment\.verdict/);
    // The role reaches the port with the display data, not only the brief.
    const herdrState = path.join(harness.stateRoot, 'terminal', 'herdr');
    const recordOf = (key) => {
      const incarnation = fs.readdirSync(herdrState).find((id) => fs.existsSync(path.join(herdrState, id, 'allocations', `${key}.json`)));
      return JSON.parse(fs.readFileSync(path.join(herdrState, incarnation, 'allocations', `${key}.json`), 'utf8'));
    };
    assert.equal(recordOf('cmd_reviewer').display.role, 'reviewer');
    assert.equal(recordOf('cmd_producer').display.role, 'producer');
  } finally { fake.cleanup(); }
});

test('a controller that died after the allocation leaves the pane alone; the reconcile scan reports it and nobody closes it', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}] });
  try {
    await seat({ dir, fake, name: 'orphan', groupKey: 'g-orphan' });
    // The controller is gone: nothing was handed over, nothing launches, nothing releases.
    const tc = createTerminalControl({ herdrBin: fake.herdrBin, config: { allocationGraceMs: 0 } });
    const scan = tc.reconcileScan({ olderThanMs: 0 });
    assert.equal(scan.result, 'scan');
    assert.ok(scan.findings.some((f) => f.key === 'cmd_orphan' && f.kind === 'allocated-not-launched-bare-shell'), JSON.stringify(scan.findings));
    assert.deepEqual(fake.closedPaneIds(), [], 'nobody closes a pane because time passed');
    assert.equal(tc.inspect({ key: 'cmd_orphan' }).pane, 'live');
  } finally { fake.cleanup(); }
});

test('a controller that fails before the handover gives the pane back and takes the trust entry out again', { skip, timeout: 120_000 }, async () => {
  const { dir, fake } = fakeWith({ panes: [{}] });
  try {
    const work = path.join(dir, 'work');
    fs.mkdirSync(work);
    const storePath = claudeStore(dir, dir);
    const seated = await seat({ dir, fake, name: 'abandon', groupKey: 'g-abandon', cwd: work, trustStore: { kind: 'claude-json', path: storePath } });
    assert.deepEqual(trusted(storePath), [dir, work].sort());
    await seated.abandon();
    assert.deepEqual(fake.closedPaneIds(), ['mock-pane-1'], 'the pane it opened is closed, by its key');
    assert.deepEqual(trusted(storePath), [dir], 'the entry it wrote is gone');
  } finally { fake.cleanup(); }
});
