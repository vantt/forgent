// The Node post-receipt steps of an attempt, run through the real entry: settle-attempt turns a
// receipt into result.json through the Execution Core door, finalize-home returns the credential and
// removes the homes. Every fixture is a real attempt directory; the payload check runs for real
// against a fixture release whose manifest declares this checkout as its Node payload.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { computeSha256Digest } from '../../src/runner/dispatch/proof-helpers.mjs';
import { AGENT_RESULT_CLAIM_CONTRACT } from '../../src/runner/dispatch/agent-result-claim-contract.mjs';
import { acquireRunControl, buildRunControlHolder, settleRunControl, listGenerations, controlDirs } from '../../src/runner/dispatch/run-lock.mjs';
import { copyCredentialFiles, credentialWriteBackMarker } from '../../src/runner/dispatch/provider-credential-renewal.mjs';
import { providerAccountDir } from '../../src/runner/dispatch/provider-capacity.mjs';
import { runAttemptStep, verifyPayload, releasePayloadRoot } from '../../src/run-supervisor/attempt-step.mjs';

const REPO = path.resolve(import.meta.dirname, '../..');
const ENTRY = path.join(REPO, 'src/run-supervisor/attempt-step.mjs');
const ATTEMPT_ID = 'att-p07';
const HOUR = 60 * 60 * 1000;
const OLD = { access: 'FAKE-OLD-ACCESS-0001', refresh: 'FAKE-OLD-REFRESH-0001' };
const NEW = { access: 'FAKE-NEW-ACCESS-0002', refresh: 'FAKE-NEW-REFRESH-0002' };

const piDoc = (expires, { access, refresh }) => ({ xai: { type: 'oauth', access, refresh, expires } });
const writePi = (dir, doc) => { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'auth.json'), `${JSON.stringify(doc)}\n`); };
const readPi = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'auth.json'), 'utf8'));

function workspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'attempt-steps-'));
  // A fixture release whose manifest declares this checkout as the legacy-node payload.
  const release = path.join(root, 'release');
  fs.mkdirSync(path.join(release, 'bin'), { recursive: true });
  fs.writeFileSync(path.join(release, 'bin', 'fgos'), '');
  fs.symlinkSync(REPO, path.join(release, 'payload'));
  fs.writeFileSync(path.join(release, 'manifest.json'), JSON.stringify({ components: { legacyNode: { root: 'payload' } } }));
  const stateRoot = path.join(root, 'state');
  fs.mkdirSync(stateRoot);
  return { root, release, stateRoot, env: { FGOS_STATE_ROOT: stateRoot, HOME: root }, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

/** A real attempt directory at runs/01 of an assignment, as the controller leaves it. */
function attempt(w, { receipt, claim, side = true, baseline = true, outcomeFiles = {} } = {}) {
  const assignmentDir = path.join(w.root, 'assignments', 'asg-1');
  const runDir = path.join(assignmentDir, 'runs', '01');
  fs.mkdirSync(path.join(runDir, 'controller'), { recursive: true });
  fs.mkdirSync(path.join(runDir, 'protected'), { recursive: true });
  const cwd = path.join(w.root, 'project');
  fs.mkdirSync(cwd, { recursive: true });
  const capture = { stdout: path.join(runDir, 'capture-out.log'), stderr: path.join(runDir, 'capture-err.log') };
  fs.writeFileSync(capture.stdout, 'agent said hello\n');
  fs.writeFileSync(capture.stderr, '');
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ contract: 'run-meta.v1', runId: 'run-1', assignmentId: 'asg-1', workId: 'work-1', attempt: 1, executorId: 'fake-exec' }));
  fs.writeFileSync(path.join(assignmentDir, 'assignment.json'), JSON.stringify({ assignmentId: 'asg-1', workId: 'work-1', mutation: 'read-only' }));
  if (baseline) {
    const body = { contract: 'evaluator-baseline.v1', cwd, gitBefore: null, gitBeforeSource: 'pre-launch', dirtyBefore: [], dirtyBeforeSnapshots: null };
    fs.writeFileSync(path.join(runDir, 'controller', 'evaluator-baseline.json'), JSON.stringify({ ...body, digest: computeSha256Digest(body) }));
  }
  if (claim) {
    fs.mkdirSync(path.join(runDir, 'outbox'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'outbox', 'result-1.json'), JSON.stringify({ contract: AGENT_RESULT_CLAIM_CONTRACT, status: 'done', summary: 'finished' }));
  }
  const control = acquireRunControl(runDir, { holder: buildRunControlHolder('controller'), purpose: 'attempt' });
  const sideFile = path.join(runDir, 'protected', 'attempt-secrets.json');
  if (side) {
    fs.writeFileSync(sideFile, JSON.stringify({ v: 1, attemptId: ATTEMPT_ID, env: {}, controlEpoch: control.controlEpoch, controlToken: control.controlToken }), { mode: 0o600 });
  }
  const stepEnv = { ...w.env };
  const step = (stepId) => ({ stepId, hostBin: path.join(w.release, 'bin', 'fgos'), payloadRoot: REPO, argv: ['internal', 'attempt-step', stepId, '--protocol', '1', '--run-dir', runDir], cwd: runDir, env: stepEnv, stepTimeoutMs: 60_000 });
  const envelope = {
    v: 3, attemptId: ATTEMPT_ID, unitRunId: 'unit-1', runDir, mode: 'direct', protocolId: 1,
    hostBin: path.join(w.release, 'bin', 'fgos'), payloadRoot: REPO, cwd, mutation: 'read-only',
    launch: { command: '/bin/true', args: [], env: {}, stdinPolicy: 'null', briefPath: null, outboxDir: path.join(runDir, 'outbox'), capture },
    containment: { preferred: 'linux-gate' },
    deadlines: { softAt: null, idleMs: null, hardCeiling: null, gateKillGraceMs: 1000 },
    agentProtocol: { cli: 'claude', mode: 'direct' },
    sideFile,
    steps: [step('settle-attempt'), step('finalize-home')],
  };
  envelope.digest = computeSha256Digest(envelope);
  fs.writeFileSync(path.join(runDir, 'envelope.json'), JSON.stringify(envelope));
  if (receipt) {
    fs.writeFileSync(path.join(runDir, 'receipt.json'), JSON.stringify({ v: 1, attemptId: ATTEMPT_ID, captureDigests: { stdout: null, stderr: null }, outboxPresent: Boolean(claim), synthesizedBy: 'supervisor', publishedAt: new Date().toISOString(), ...receipt }));
  }
  for (const [name, content] of Object.entries(outcomeFiles)) fs.writeFileSync(path.join(runDir, name), content);
  return { runDir, envelope, control };
}

function gateExit(over = {}) {
  return { v: 1, attemptId: ATTEMPT_ID, exitCode: 0, signal: null, stoppedBy: 'agent', cause: null, exitedAt: new Date().toISOString(), ...over };
}

async function run(stepId, w, runDir) {
  const lines = [];
  const realWrite = process.stdout.write;
  process.stdout.write = (chunk) => { lines.push(String(chunk)); return true; };
  let exit;
  try { exit = await runAttemptStep(stepId, runDir, { env: w.env }); } finally { process.stdout.write = realWrite; }
  return { exit, out: lines.join('').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)).at(-1) };
}

const resultOf = (runDir) => JSON.parse(fs.readFileSync(path.join(runDir, 'result.json'), 'utf8'));
const generationCount = (runDir) => listGenerations(controlDirs(runDir).generationsDir).length;

test('settle-attempt on an exited receipt with an outbox writes result.json; a second run changes nothing', async () => {
  const w = workspace();
  try {
    const { runDir } = attempt(w, { receipt: { outcome: 'exited', gateExit: gateExit() }, claim: true });
    const first = await run('settle-attempt', w, runDir);
    assert.equal(first.exit, 0, JSON.stringify(first.out));
    assert.equal(first.out.result, 'done');
    const result = resultOf(runDir);
    assert.equal(result.classification.execution.status, 'completed');
    assert.equal(result.runId, 'run-1');
    const bytes = fs.readFileSync(path.join(runDir, 'result.json'));
    const generations = generationCount(runDir);

    const second = await run('settle-attempt', w, runDir);
    assert.equal(second.exit, 0);
    assert.equal(second.out.detail.settled, 'already');
    assert.deepEqual(fs.readFileSync(path.join(runDir, 'result.json')), bytes);
    assert.equal(generationCount(runDir), generations, 'no new run-control epoch');
  } finally { w.cleanup(); }
});

test('settle-attempt on a gate-lost receipt settles from the outbox; without one the run fails', async () => {
  const w = workspace();
  try {
    const withClaim = attempt(w, { receipt: { outcome: 'gate-lost' }, claim: true });
    assert.equal((await run('settle-attempt', w, withClaim.runDir)).exit, 0);
    assert.equal(resultOf(withClaim.runDir).classification.execution.status, 'completed');
  } finally { w.cleanup(); }
  const w2 = workspace();
  try {
    const none = attempt(w2, { receipt: { outcome: 'gate-lost' } });
    assert.equal((await run('settle-attempt', w2, none.runDir)).exit, 0);
    assert.notEqual(resultOf(none.runDir).classification.execution.status, 'completed');
  } finally { w2.cleanup(); }
});

test('a timeout receipt with an outbox result is still judged from the outbox', async () => {
  const w = workspace();
  try {
    const { runDir } = attempt(w, { receipt: { outcome: 'timeout', gateExit: gateExit({ exitCode: null, signal: 'SIGKILL', stoppedBy: 'hard-ceiling', cause: 'hard-ceiling' }) }, claim: true });
    assert.equal((await run('settle-attempt', w, runDir)).exit, 0);
    assert.equal(resultOf(runDir).classification.execution.status, 'completed');
  } finally { w.cleanup(); }
});

test('run control settled but result.json missing: the same token completes the publish with no new epoch', async () => {
  const w = workspace();
  try {
    const { runDir, control } = attempt(w, { receipt: { outcome: 'exited', gateExit: gateExit() }, claim: true });
    assert.equal(settleRunControl(runDir, control).status, 'settled', 'the crash window: control settled, nothing published');
    assert.equal(fs.existsSync(path.join(runDir, 'result.json')), false);
    const generations = generationCount(runDir);
    const done = await run('settle-attempt', w, runDir);
    assert.equal(done.exit, 0, JSON.stringify(done.out));
    assert.equal(resultOf(runDir).runId, 'run-1');
    assert.equal(generationCount(runDir), generations);
  } finally { w.cleanup(); }
});

test('side file gone: a live control writer means retry, a dead one lets the step take a new epoch', async () => {
  const w = workspace();
  try {
    const live = attempt(w, { receipt: { outcome: 'exited', gateExit: gateExit() }, claim: true, side: false });
    const waiting = await run('settle-attempt', w, live.runDir);
    assert.equal(waiting.exit, 75);
    assert.equal(waiting.out.reason, 'run-control-held');
    assert.equal(fs.existsSync(path.join(live.runDir, 'result.json')), false);
  } finally { w.cleanup(); }
  const w2 = workspace();
  try {
    const dead = spawnSync(process.execPath, ['-e', '']);
    const { runDir } = attempt(w2, { receipt: { outcome: 'exited', gateExit: gateExit() }, claim: true, side: false });
    // The control generation the controller wrote names a process that no longer exists.
    const { generationsDir } = controlDirs(runDir);
    for (const name of fs.readdirSync(generationsDir)) {
      const file = path.join(generationsDir, name);
      const record = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (record.holder) {
        record.holder.pid = dead.pid;
        fs.writeFileSync(file, JSON.stringify(record));
      }
    }
    const taken = await run('settle-attempt', w2, runDir);
    assert.equal(taken.exit, 0, JSON.stringify(taken.out));
    assert.equal(resultOf(runDir).runId, 'run-1');
  } finally { w2.cleanup(); }
});

/** A private home of the attempt with a login renewed inside it, and the finalization descriptor that lists it. */
function homeOf(w, runDir, { marker = {}, renewed = true } = {}) {
  const source = path.join(w.root, 'source-home');
  const runtimeDir = path.join(w.root, 'runtime');
  writePi(source, piDoc(Date.now() + 10 * 60 * 1000, OLD));
  const dispatchId = 'disp_p07';
  const home = path.join(w.root, 'confinement', dispatchId, 'home');
  fs.mkdirSync(home, { recursive: true });
  copyCredentialFiles(home, source, ['auth.json']);
  if (renewed) writePi(home, piDoc(Date.now() + 6 * HOUR, NEW));
  const credentialWriteBack = credentialWriteBackMarker({ provider: 'xai', accountId: 'acct', credentialSource: { kind: 'home-files', home: source, files: ['auth.json'] }, runtimeDir });
  fs.writeFileSync(path.join(home, '.fgos-confinement-owner.json'), JSON.stringify({
    contract: 'confinement-resource-ownership.v2', creator: 'fgos-confinement', attemptId: ATTEMPT_ID, runDir, dispatchId, resource: 'private-home', createdAt: new Date().toISOString(), credentialWriteBack, ...marker,
  }));
  const dir = path.join(runDir, 'protected', 'confinement-finalization');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'cmd-1.json'), JSON.stringify({ contract: 'confinement-finalization.v1', launchCommandId: 'cmd-1', resources: [{ pathRef: home }], cleanupState: 'pending', cleanupResult: null }));
  return { home, source, runtimeDir };
}

test('finalize-home after a timeout writes the renewed login back to its account and removes the home', async () => {
  const w = workspace();
  try {
    const { runDir } = attempt(w, { receipt: { outcome: 'timeout', gateExit: gateExit({ exitCode: null, signal: 'SIGKILL', stoppedBy: 'idle' }) } });
    const { home, source } = homeOf(w, runDir);
    const done = await run('finalize-home', w, runDir);
    assert.equal(done.exit, 0, JSON.stringify(done.out));
    assert.equal(done.out.detail.homes, 1);
    assert.equal(fs.existsSync(home), false);
    assert.equal(readPi(source).xai.refresh, NEW.refresh, 'the account source received the renewed login');
    const descriptor = JSON.parse(fs.readFileSync(path.join(runDir, 'protected', 'confinement-finalization', 'cmd-1.json'), 'utf8'));
    assert.equal(descriptor.cleanupState, 'cleaned');
    assert.equal((await run('finalize-home', w, runDir)).exit, 0, 'running it again is harmless');
  } finally { w.cleanup(); }
});

test('finalize-home keeps the home and asks for a retry while the renewed login cannot be staged', async () => {
  const w = workspace();
  try {
    const { runDir } = attempt(w, { receipt: { outcome: 'timeout', gateExit: gateExit({ exitCode: null, signal: 'SIGKILL', stoppedBy: 'idle' }) } });
    const { home, source, runtimeDir } = homeOf(w, runDir);
    // A file where the pending-copies directory belongs: nothing can be staged beside the source.
    const accountDir = providerAccountDir(runtimeDir, 'xai', 'acct');
    fs.mkdirSync(accountDir, { recursive: true });
    fs.writeFileSync(path.join(accountDir, 'pending'), 'in the way');
    const kept = await run('finalize-home', w, runDir);
    assert.equal(kept.exit, 75, JSON.stringify(kept.out));
    assert.equal(kept.out.reason, 'credential-home-kept');
    assert.equal(fs.existsSync(path.join(home, 'auth.json')), true, 'the home still holds the only renewed login');
    assert.equal(readPi(source).xai.refresh, OLD.refresh);
  } finally { w.cleanup(); }
});

test('finalize-home stops retrying after the kept-home budget: a named outcome, the home stays, the count is per home', async () => {
  const w = workspace();
  try {
    const { runDir } = attempt(w, { receipt: { outcome: 'timeout', gateExit: gateExit({ exitCode: null, signal: 'SIGKILL', stoppedBy: 'idle' }) } });
    const { home, runtimeDir } = homeOf(w, runDir);
    const accountDir = providerAccountDir(runtimeDir, 'xai', 'acct');
    fs.mkdirSync(accountDir, { recursive: true });
    fs.writeFileSync(path.join(accountDir, 'pending'), 'in the way');
    const markerFile = path.join(home, '.fgos-confinement-owner.json');
    const counted = () => JSON.parse(fs.readFileSync(markerFile, 'utf8')).credentialKept;
    // Two runs closer together than the spacing count once.
    assert.equal((await run('finalize-home', w, runDir)).exit, 75);
    assert.equal((await run('finalize-home', w, runDir)).exit, 75);
    assert.equal(counted().attempts, 1);
    for (let attempts = 2; attempts < 5; attempts += 1) {
      const marker = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
      marker.credentialKept.lastCountedAt -= 60 * 60 * 1000;
      fs.writeFileSync(markerFile, JSON.stringify(marker));
      assert.equal((await run('finalize-home', w, runDir)).exit, 75, `attempt ${attempts}`);
      assert.equal(counted().attempts, attempts);
    }
    const marker = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    marker.credentialKept.lastCountedAt -= 60 * 60 * 1000;
    fs.writeFileSync(markerFile, JSON.stringify(marker));
    const held = await run('finalize-home', w, runDir);
    assert.equal(held.exit, 0, JSON.stringify(held.out));
    assert.equal(held.out.detail.outcome, 'credential-home-held');
    assert.equal(fs.existsSync(path.join(home, 'auth.json')), true, 'the home is kept for the owner');
    const descriptor = JSON.parse(fs.readFileSync(path.join(runDir, 'protected', 'confinement-finalization', 'cmd-1.json'), 'utf8'));
    assert.equal(descriptor.cleanupState, 'retained');
    const again = await run('finalize-home', w, runDir);
    assert.equal(again.exit, 0);
    assert.equal(again.out.detail.outcome, 'credential-home-held');
    assert.equal(counted().attempts, 5, 'a held home is not tried or counted again');
  } finally { w.cleanup(); }
});

test('finalize-home refuses a home whose marker is another attempt or version 1, and removes nothing', async () => {
  for (const marker of [{ attemptId: 'some-other-attempt' }, { contract: 'confinement-resource-ownership.v1' }]) {
    const w = workspace();
    try {
      const { runDir } = attempt(w, { receipt: { outcome: 'exited', gateExit: gateExit() } });
      const { home } = homeOf(w, runDir, { marker });
      const refused = await run('finalize-home', w, runDir);
      assert.equal(refused.exit, 70, JSON.stringify(refused.out));
      assert.equal(refused.out.result, 'error');
      assert.match(refused.out.message, /^home-marker-mismatch/);
      assert.equal(fs.existsSync(home), true);
    } finally { w.cleanup(); }
  }
});

// A step runs with the FGOS_* variables of its runner (attemptStepEnv), which is how the entry finds the native door.
const doorEnv = () => Object.fromEntries(Object.entries(process.env).filter(([name]) => name.startsWith('FGOS_') && name !== 'FGOS_STATE_ROOT'));

test('the entry reports a missing step variable and a payload the envelope does not name', async () => {
  const w = workspace();
  try {
    const { runDir, envelope } = attempt(w, { receipt: { outcome: 'exited', gateExit: gateExit() } });
    const noHome = spawnSync(process.execPath, [ENTRY, 'finalize-home', '--run-dir', runDir], { env: { PATH: process.env.PATH, ...doorEnv(), FGOS_STATE_ROOT: w.stateRoot }, encoding: 'utf8' });
    assert.equal(noHome.status, 65);
    assert.match(JSON.parse(noHome.stdout).message, /lacks HOME/);

    const ok = spawnSync(process.execPath, [ENTRY, 'finalize-home', '--run-dir', runDir], { env: { PATH: process.env.PATH, ...doorEnv(), ...w.env }, encoding: 'utf8' });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.equal(JSON.parse(ok.stdout).result, 'done');

    assert.equal(releasePayloadRoot(envelope.hostBin), fs.realpathSync(REPO));
    assert.throws(() => verifyPayload({ ...envelope, payloadRoot: w.release }), /payload other than/);
    assert.throws(() => verifyPayload({ ...envelope, hostBin: path.join(w.root, 'nowhere') }), /manifest/);
    assert.throws(() => verifyPayload({ ...envelope, payloadRoot: path.join(w.root, 'missing') }), /does not exist/);
  } finally { w.cleanup(); }
});
