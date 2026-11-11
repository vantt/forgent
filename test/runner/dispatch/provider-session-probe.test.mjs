// The session probe runs one tiny read-only seat of one executor and reports where its CLI wrote the session,
// whether finalize-home kept it, and where the kept copy is. The Assignment door and the id claim are injected;
// the home, its descriptor and finalize-home itself are real, so a declared folder that does not match what the
// fixture CLI wrote is judged by the code that would judge it for a live seat.

import '../../helpers/process-tmp-root.mjs';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { CHEAPEST_TIER, runSessionProbe, sessionProbeInvocation } from '../../../src/runner/dispatch/provider-session-probe.mjs';
import { finalizeHome } from '../../../src/run-supervisor/steps/finalize-home.mjs';

const dirs = [];
const tmp = (prefix) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  dirs.push(dir);
  return dir;
};
after(() => { for (const d of dirs) fs.rmSync(d, { recursive: true, force: true }); });

const SECRET = 'prompt text and tool output that can hold a secret';
const store = (extra = {}) => ({ use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', files: ['auth.json'], ...extra });
const confined = { backend: 'bwrap' };
const configWith = (credentialStore) => ({
  executors: {
    fixture: {
      kind: 'agent',
      providerModel: 'fixture',
      invocations: [
        { id: 'fixture-plain', via: 'cli', adapter: 'cli-spawn', command: 'fixture-cli' },
        { id: 'fixture-bwrap', via: 'cli', adapter: 'cli-spawn', command: 'fixture-cli', confinement: confined, ...(credentialStore ? { credentialStore } : {}) },
      ],
    },
    tool: { kind: 'tool' },
  },
});

/**
 * An execution door whose "CLI" writes `files` (relative path -> text) into a real private home, then runs the
 * real finalize-home step over it, then records the step the way the supervisor does.
 */
function fixtureDoor({ repoRoot, cfg, files = {}, fail = false, providerLimit = false }) {
  const calls = [];
  const runUnit = async (options) => {
    calls.push(options);
    if (fail) throw Object.assign(new Error('seat refused to start'), { runDir: null });
    const [{ invocation: invocationId }] = options.overrides;
    const unitId = options.unitData.id;
    const runDir = path.join(repoRoot, '.fgos', 'assignments', unitId, 'runs', '01');
    fs.mkdirSync(path.join(runDir, 'protected', 'confinement-finalization'), { recursive: true });
    const invocation = cfg.executors.fixture.invocations.find((inv) => inv.id === invocationId);
    // Only an invocation with a login store is handed a private home.
    if (invocation.credentialStore) {
      const home = path.join(repoRoot, 'confinement', unitId, 'home');
      fs.mkdirSync(home, { recursive: true });
      fs.writeFileSync(path.join(home, 'auth.json'), '{"login":"copy"}');
      for (const [rel, text] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(home, rel)), { recursive: true });
        fs.writeFileSync(path.join(home, rel), text);
      }
      fs.writeFileSync(path.join(home, '.fgos-confinement-owner.json'), JSON.stringify({
        contract: 'confinement-resource-ownership.v2', creator: 'fgos-confinement', attemptId: 'att-1', runDir, dispatchId: unitId, resource: 'private-home', createdAt: new Date().toISOString(),
      }));
      fs.writeFileSync(path.join(runDir, 'protected', 'confinement-finalization', 'cmd-1.json'), JSON.stringify({
        contract: 'confinement-finalization.v1', launchCommandId: 'cmd-1', cleanupState: 'pending', cleanupResult: null,
        resources: [{ pathRef: home, resourceId: 'private-home', ...(invocation.credentialStore?.sessionDir ? { sessionDir: invocation.credentialStore.sessionDir } : {}) }],
      }));
    }
    const sideFile = path.join(runDir, 'protected', 'attempt-secrets.json');
    fs.writeFileSync(sideFile, '{}');
    const done = await finalizeHome({ envelope: { runDir, attemptId: 'att-1', sideFile } });
    fs.mkdirSync(path.join(runDir, 'steps'), { recursive: true });
    fs.writeFileSync(path.join(runDir, 'steps', 'finalize-home.json'), JSON.stringify({ v: 1, stepId: 'finalize-home', status: 'done', detail: done.detail }));
    fs.writeFileSync(path.join(runDir, 'stdout.log'), 'OK\n');
    const passed = {
      policy: { disposition: 'allow' }, delivery: { mode: 'fresh' }, provenance: 'native-v2',
      execution: { status: 'completed', exitCode: 0 }, assessment: { verdict: 'pass' }, confidence: { level: 'reported', basis: ['captured-stdout'] },
    };
    const limited = {
      policy: { disposition: 'needs-input', code: 'provider-limit' }, delivery: { mode: 'fresh' }, provenance: 'native-v2',
      execution: { status: 'failed', exitCode: 1 }, assessment: { verdict: 'not-applicable' }, confidence: { level: 'failed', basis: ['captured-stdout'] },
      failure: { family: 'provider', code: 'provider-limit', cause: 'provider' },
    };
    const runResult = {
      contract: { id: 'assignment-run-result', version: 2 },
      runId: `run_${unitId}`,
      status: providerLimit ? 'failed' : 'done',
      confidence: providerLimit ? 'failed' : 'reported',
      runtime: { stdoutLog: path.relative(repoRoot, path.join(runDir, 'stdout.log')) },
      classification: providerLimit ? limited : passed,
    };
    return { unitRunId: unitId, outcome: 'pass', rounds: 1, results: [{ binding: { executor: 'fixture', invocation: invocationId, model: 'cheap-model' }, runResult }] };
  };
  return { calls, runUnit };
}

async function probe({ credentialStore, files, fail, providerLimit, invocationId = null }) {
  const repoRoot = tmp('fgos-session-probe-');
  const cfg = configWith(credentialStore);
  const door = fixtureDoor({ repoRoot, cfg, files, fail, providerLimit });
  const report = await runSessionProbe({ cfg, executorId: 'fixture', invocationId, repoRoot, runUnit: door.runUnit });
  return { report, door, repoRoot };
}

test('a session written in the declared folder is reported kept, with its path, count and size and no content', async () => {
  const { report, door } = await probe({ credentialStore: store({ sessionDir: 'sessions' }), files: { 'sessions/w/s1.jsonl': SECRET } });
  assert.equal(report.kept, true);
  assert.equal(report.category, 'kept');
  assert.equal(report.declaredSessionDir, 'sessions');
  assert.equal(report.transcriptPath, path.join(report.runDir, 'protected', 'session'));
  assert.equal(report.files, 1);
  assert.equal(report.sizeBytes, Buffer.byteLength(SECRET));
  assert.deepEqual(report.observedSessionPaths.map((e) => e.path), ['sessions', 'sessions/w'], 'the login file is not listed as a session');
  assert.equal(report.fix, null);
  assert.equal(JSON.stringify(report).includes(SECRET), false, 'the report holds paths, counts and sizes only');
  assert.equal(fs.readFileSync(path.join(report.transcriptPath, 'w', 's1.jsonl'), 'utf8'), SECRET);
  const [call] = door.calls;
  assert.deepEqual(call.unitData.writes, [], 'the probe unit is read-only');
  assert.deepEqual(call.overrides, [{ executor: 'fixture', invocation: 'fixture-bwrap', tier: 'nano' }], 'the confined invocation runs at the weakest tier, so on the cheapest model of its family');
  assert.equal(call.raiseAuthorized, false);
  assert.equal(report.model, 'cheap-model');
});

test('a CLI that wrote its session outside the declared folder is a mismatch, and the report names the line to change', async () => {
  const { report } = await probe({ credentialStore: store({ sessionDir: 'sessions' }), files: { 'agent/sessions/s1.jsonl': SECRET } });
  assert.equal(report.kept, false);
  assert.equal(report.category, 'dir-mismatch');
  assert.equal(report.transcriptPath, null);
  assert.ok(report.observedSessionPaths.some((e) => e.path === 'agent/sessions' && e.files === 1));
  assert.match(report.fix, /sessionDir: agent\/sessions .*executors\.fixture\.invocations\[fixture-bwrap\]\.credentialStore/);
  assert.deepEqual(report.warnings.map((w) => w.code), ['session-not-written']);
});

test('an executor with no declared folder is reported undeclared, with the folder the CLI used', async () => {
  const { report } = await probe({ credentialStore: store(), files: { 'sessions/s1.jsonl': SECRET } });
  assert.equal(report.category, 'dir-undeclared');
  assert.equal(report.declaredSessionDir, null);
  assert.match(report.fix, /sessionDir: sessions /);
  assert.deepEqual(report.warnings.map((w) => w.code), ['session-dir-undeclared']);
});

test('a CLI that wrote no session at all is reported as such, without a suggestion', async () => {
  const { report } = await probe({ credentialStore: store({ sessionDir: 'sessions' }), files: {} });
  assert.equal(report.category, 'no-session-written');
  assert.equal(report.kept, false);
  assert.deepEqual(report.observedSessionPaths, []);
  assert.equal(report.fix, null);
});

test('an invocation without a private home is reported as having nothing to keep from', async () => {
  const { report } = await probe({ credentialStore: null, files: {}, invocationId: 'fixture-plain' });
  assert.equal(report.invocationId, 'fixture-plain');
  assert.equal(report.category, 'no-private-home');
});

test('a seat that hit a provider limit but wrote a session is still reported kept, with its own outcome beside it', async () => {
  const { report } = await probe({ credentialStore: store({ sessionDir: 'sessions' }), files: { 'sessions/s1.jsonl': SECRET }, providerLimit: true });
  assert.equal(report.category, 'kept');
  assert.equal(report.kept, true);
  assert.equal(report.outcome, 'failed');
});

test('a seat that fails to run is reported as a failed run, not as a session fault', async () => {
  const { report } = await probe({ credentialStore: store({ sessionDir: 'sessions' }), fail: true });
  assert.equal(report.category, 'run-failed');
  assert.equal(report.outcome, 'failed');
  assert.equal(report.evidence, 'seat refused to start');
  assert.equal(report.kept, false);
});

test('the probe runs the first confined cli invocation unless one is named, and refuses an unknown executor or invocation', () => {
  const cfg = configWith(store());
  assert.equal(sessionProbeInvocation(cfg, 'fixture').id, 'fixture-bwrap');
  assert.equal(sessionProbeInvocation(cfg, 'fixture', 'fixture-plain').id, 'fixture-plain');
  assert.throws(() => sessionProbeInvocation(cfg, 'fixture', 'nope'), /no cli invocation "nope" \(has: fixture-plain, fixture-bwrap\)/);
  assert.throws(() => sessionProbeInvocation(cfg, 'missing'), /no agent executor "missing"/);
  assert.throws(() => sessionProbeInvocation(cfg, 'tool'), /no agent executor "tool"/);
});

test('the probe pins the weakest tier of the ladder', () => {
  assert.equal(CHEAPEST_TIER, 'nano');
});

test('a probe without the execution door is refused', async () => {
  await assert.rejects(runSessionProbe({ cfg: configWith(store()), executorId: 'fixture', repoRoot: '/r' }), /needs the execution door/);
});
