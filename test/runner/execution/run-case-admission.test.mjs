// test/runner/execution/run-case-admission.test.mjs -- what runUnit asks the admission port, and when.
// The port here is a recording double of the Execution Core's own contract; the real Workflow port is
// exercised in test/workflow/case-admission-port.test.mjs. The workers are real confined processes.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { ensureScriptAddon } from '../../../scripts/lib/git-ports.mjs';
import { runUnit, activityOf } from '../../../src/runner/execution/run.mjs';
import { shippedCatalog } from '../../../src/runner/dispatch/shipped-catalog.mjs';
import { runReviewed } from '../../../src/runner/execution/loops/reviewed.mjs';
import { seatLaunchesOf, seatLaunchesUsed, briefNeverReached, noBriefDelivered, CaseAdmissionRefusedError } from '../../../src/runner/execution/case-admission-port.mjs';
import { RunnerConfigError } from '../../../src/runner/dispatch/runner-config-error.mjs';
import { dispatchCwdHolder } from '../../../src/run-supervisor/cwd-lock.mjs';
import { createCaseAdmissionPort } from '../../../src/workflow/case-admission-port.mjs';
import { createPendingBinding, commitBinding } from '../../../src/workflow/case-bindings.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { activateGitFixture } from '../../helpers/git-fixture.mjs';
import { holdLockInChild } from '../../helpers/hold-lock-in-child.mjs';
import { writeProjectConfig, readProjectConfig } from '../../helpers/config-fixture.mjs';
const { openCase, eventsOf } = await import('../../helpers/workflow-case-fixture.mjs');

seedFileLocalBwrapRegistry();
ensureScriptAddon();

// Family `quotaN` ends in the usage-limit text a real agent prints, any other family settles done after
// writing the files its brief names.
const WORKER = `
import fs from 'node:fs';
import path from 'node:path';
const family = process.argv[2];
if (family.startsWith('quota')) {
  const line = 'ERROR: You\\u2019ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 11:39 PM.';
  process.stderr.write(line + '\\n' + line + '\\ntokens used\\n379,854\\n');
  process.exit(1);
}
const prompt = process.argv.slice(3).join(' ');
for (const m of prompt.matchAll(/WRITE:(\\S+)/g)) { fs.mkdirSync(path.dirname(m[1]), { recursive: true }); fs.writeFileSync(m[1], 'written\\n'); }
const match = /Write structured JSON to (\\S+result-1\\.json)/.exec(prompt);
if (match) {
  const claimDir = path.dirname(match[1]);
  const outbox = path.join(claimDir, 'worker-output', 'outbox');
  const dir = fs.existsSync(outbox) ? outbox : claimDir;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'report-1.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
  fs.writeFileSync(path.join(dir, 'result-1.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
}
`;

function setup(families = ['okay']) {
  const repoRoot = makeFixtureDir('fgos-admit-');
  const git = (args, cwd = repoRoot) => execFileSync('git', args, { cwd, stdio: 'ignore' });
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'Admission Test']);
  git(['config', 'user.email', 'admit@test.local']);
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# Admission\n');
  git(['add', 'README.md']);
  git(['commit', '-m', 'initial']);
  activateGitFixture(repoRoot);
  const worktreeDir = makeFixtureDir('fgos-admit-wt-');
  git(['worktree', 'add', '-b', 'wt-branch', worktreeDir]);
  const script = path.join(repoRoot, 'worker.mjs');
  fs.writeFileSync(script, WORKER);
  const executors = {};
  for (const family of families) {
    const command = path.join(repoRoot, `${family}-bin`);
    fs.symlinkSync(process.execPath, command);
    const args = [script, family, '{prompt}'];
    executors[family] = {
      kind: 'agent',
      allowCrossProvider: true,
      providerModel: family,
      command,
      args,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args }],
    };
  }
  const prefer = families.map((executor) => ({ executor }));
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  writeProjectConfig(repoRoot, {
    runner: {
      defaultExecutor: families[0],
      timeoutMs: 40000,
      defaults: { tier: 'standard' },
      modelPolicies: Object.fromEntries(families.map((f) => [f, { nano: 'fake', mini: 'fake', standard: 'fake', advanced: 'fake', flagship: 'fake', frontier: 'fake' }])),
      // The walk after a failure follows the families listed here, so the fixture lists the families it serves.
      tierFallback: Object.fromEntries(['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'].map((tier) => [tier, families])),
      executors,
      capabilities: { 'docs:write': { prefer, rigor: 'standard', tier: 'standard' } },
      patterns: { seatBinding: { schema: 1 } },
      loops: { reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } } },
    },
  });
  return { repoRoot, worktreeDir };
}

const assignmentsOf = (repoRoot) => {
  const dir = path.join(repoRoot, '.fgos', 'assignments');
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};
const unitJson = (repoRoot, id) => JSON.parse(fs.readFileSync(path.join(repoRoot, '.fgos', 'assignments', id, 'unit.json'), 'utf8'));

/** A port that records what the core asks and answers as told; `admit` and `recheck` may be overridden. */
function recordingPort({ binding = 'unbound', admit, recheck, onSettle } = {}) {
  const calls = [];
  return {
    calls,
    resolveBinding: (ask) => { calls.push(['resolveBinding', ask]); return { answer: binding ?? undefined }; },
    admit: (proposal) => {
      calls.push(['admit', proposal]);
      return admit ? admit(proposal) : { admitted: true, reservationId: 'rsv-test', caseId: 'case-test', seatLaunchCeiling: null };
    },
    settle: (reservationId, result) => { calls.push(['settle', reservationId, result]); onSettle?.(result); },
    recheckEffect: (reservationId, ask) => {
      calls.push(['recheckEffect', reservationId, ask]);
      return recheck ? recheck(ask) : { ok: true };
    },
  };
}
const names = (port) => port.calls.map((c) => c[0]);
const WRITE_UNIT = { id: 'u-write', objective: 'WRITE:docs/a.md', capability: 'docs:write', writes: ['docs'] };

test('a writing Unit with no port is refused before anything exists, and so is a Unit that names a case', async () => {
  const { repoRoot, worktreeDir } = setup();
  await assert.rejects(() => runUnit({ unitData: WRITE_UNIT, repoRoot, cwd: worktreeDir, worktree: worktreeDir }), { code: 'case-admission-port-missing' });
  await assert.rejects(() => runUnit({
    unitData: { ...WRITE_UNIT, writes: [] }, caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  }), { code: 'case-admission-port-missing' });
  assert.deepEqual(assignmentsOf(repoRoot), [], 'no unit directory');
  await assert.rejects(() => runUnit({ unitData: WRITE_UNIT, caseAdmission: { admit() {} }, repoRoot, cwd: worktreeDir, worktree: worktreeDir }), { code: 'case-admission-port-missing' });
});

test('a read-only Unit that names no case needs no port', async () => {
  const { repoRoot, worktreeDir } = setup();
  const res = await runUnit({ unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir });
  assert.equal(res.outcome, 'pass');
  assert.equal(unitJson(repoRoot, res.unitRunId).workflow, null);
});

test('a standalone writing run goes on only when the port answers unbound, and never admits', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort();
  const res = await runUnit({ unitData: WRITE_UNIT, caseAdmission: port, repoRoot, cwd: worktreeDir, worktree: worktreeDir });
  assert.equal(res.outcome, 'pass');
  assert.deepEqual(names(port), ['resolveBinding']);
  assert.equal(unitJson(repoRoot, res.unitRunId).workflow, null);
});

test('every answer but unbound refuses a standalone writing run before custody and before the unit directory', async () => {
  for (const binding of ['worktree-already-bound', 'binding-unsettled', 'binding-view-unavailable', 'worktree-missing', null]) {
    const { repoRoot, worktreeDir } = setup();
    const port = recordingPort({ binding });
    await assert.rejects(
      () => runUnit({ unitData: WRITE_UNIT, caseAdmission: port, repoRoot, cwd: worktreeDir, worktree: worktreeDir }),
      (err) => err instanceof CaseAdmissionRefusedError && err.code === (binding ?? 'binding-view-unavailable'),
      `${binding}`,
    );
    assert.deepEqual(assignmentsOf(repoRoot), []);
    assert.equal(dispatchCwdHolder(path.join(repoRoot, '.fgos'), worktreeDir), null, 'custody was never taken');
  }
});

test('a worktree some case binds refuses a standalone writing run through the real port, a masked view of a nested caller is a confined write', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = createCaseAdmissionPort({ repoRoot });
  const made = createPendingBinding({ mainRoot: repoRoot, caseId: 'wf-owner', generation: 1, worktree: worktreeDir });
  commitBinding({ mainRoot: repoRoot, key: made.key, caseId: 'wf-owner', generation: 1 });
  await assert.rejects(
    () => runUnit({ unitData: WRITE_UNIT, caseAdmission: port, repoRoot, cwd: worktreeDir, worktree: worktreeDir }),
    (err) => err.code === 'bound-worktree-requires-case-authority' && /wf-owner/.test(err.message),
  );
  assert.deepEqual(assignmentsOf(repoRoot), []);

  // A confined caller that cannot see the real bindings directory never gets `unbound` out of it.
  const other = setup();
  const before = process.env.FGOS_DISPATCH_DEPTH;
  process.env.FGOS_DISPATCH_DEPTH = '1';
  try {
    const masked = createCaseAdmissionPort({ repoRoot: other.repoRoot });
    await assert.rejects(
      () => runUnit({ unitData: WRITE_UNIT, caseAdmission: masked, repoRoot: other.repoRoot, cwd: other.worktreeDir, worktree: other.worktreeDir }),
      { code: 'nested-write-from-confined-worker' },
    );
  } finally {
    if (before === undefined) delete process.env.FGOS_DISPATCH_DEPTH; else process.env.FGOS_DISPATCH_DEPTH = before;
  }
});

test('a Unit that names a case is admitted in custody and before the unit directory, linked in unit.json, settled once after custody is released', async () => {
  const { repoRoot, worktreeDir } = setup();
  let quietAtSettle = null;
  let createdBeforeAdmit = null;
  let custodyAtAdmit = null;
  const port = recordingPort({
    admit: () => {
      createdBeforeAdmit = assignmentsOf(repoRoot).length;
      custodyAtAdmit = dispatchCwdHolder(path.join(repoRoot, '.fgos'), worktreeDir) !== null;
      return { admitted: true, reservationId: 'rsv-link', caseId: 'case-link', seatLaunchCeiling: null };
    },
    onSettle: () => { quietAtSettle = dispatchCwdHolder(path.join(repoRoot, '.fgos'), worktreeDir) === null; },
  });
  const admittedHook = [];
  const res = await runUnit({
    unitData: WRITE_UNIT, caseAdmission: port, caseRef: { caseId: 'case-link', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    onCaseAdmitted: (info) => admittedHook.push(info),
  });
  assert.equal(res.outcome, 'pass');
  assert.equal(createdBeforeAdmit, 0, 'no unit directory existed when admission was asked');
  assert.equal(custodyAtAdmit, true, 'a writing run holds the worktree custody when admission is asked');
  assert.deepEqual(names(port), ['admit', 'recheckEffect', 'settle']);
  const proposal = port.calls[0][1];
  assert.equal(proposal.unitRunId, res.unitRunId, 'the reservation is for the very Unit run that follows');
  assert.deepEqual({ activity: proposal.activity, writes: proposal.writes, readOnly: proposal.readOnly, pattern: proposal.pattern, seatLaunches: proposal.seatLaunches }, { activity: 'build', writes: ['docs'], readOnly: false, pattern: 'solo', seatLaunches: 1 });
  assert.equal(proposal.worktree, fs.realpathSync(worktreeDir));
  assert.deepEqual(admittedHook, [{ caseId: 'case-link', reservationId: 'rsv-link' }]);
  assert.deepEqual(unitJson(repoRoot, res.unitRunId).workflow, { caseId: 'case-link', activity: 'build', reservationId: 'rsv-link' });
  const settle = port.calls[2];
  assert.equal(settle[1], 'rsv-link');
  assert.deepEqual({ caseId: settle[2].caseId, outcome: settle[2].outcome, unitRunId: settle[2].unitRunId, seatLaunchesUsed: settle[2].seatLaunchesUsed, frameExhausted: settle[2].frameExhausted }, { caseId: 'case-link', outcome: 'pass', unitRunId: res.unitRunId, seatLaunchesUsed: 1, frameExhausted: false });
  assert.equal(quietAtSettle, true, 'the worktree is quiet when the port settles, so it may release its binding');
});

test('a read-only Unit that names a case is admitted without writes', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort();
  const res = await runUnit({ unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir });
  assert.equal(res.outcome, 'pass');
  assert.deepEqual(names(port), ['admit', 'settle']);
  assert.deepEqual({ writes: port.calls[0][1].writes, readOnly: port.calls[0][1].readOnly }, { writes: [], readOnly: true });
});

test('a refusal throws with the port\'s answer before anything exists, and settles nothing', async () => {
  const { repoRoot, worktreeDir } = setup();
  const refusal = { code: 'writes-overlap', condition: 'two writers share docs', violations: [{ code: 'writes-overlap' }] };
  const port = recordingPort({ admit: () => ({ refused: refusal }) });
  await assert.rejects(
    () => runUnit({ unitData: WRITE_UNIT, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir }),
    (err) => err instanceof CaseAdmissionRefusedError && err.code === 'writes-overlap' && err.refusal === refusal,
  );
  assert.deepEqual(assignmentsOf(repoRoot), []);
  assert.deepEqual(names(port), ['admit']);
  assert.equal(dispatchCwdHolder(path.join(repoRoot, '.fgos'), worktreeDir), null);
});

test('custody that refuses a writing run is refused before admission, so no reservation exists and nothing needs settling', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort();
  const { child, exited } = await holdLockInChild('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir });
  try {
    await assert.rejects(() => runUnit({
      unitData: WRITE_UNIT, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    }), { code: 'dispatch-in-flight' });
  } finally { child.kill('SIGKILL'); await exited; }
  assert.deepEqual(names(port), []);
  assert.deepEqual(assignmentsOf(repoRoot), []);
});

test('a refused admission of a writing run leaves the worktree custody free', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort({ admit: () => ({ refused: { code: 'writes-overlap', condition: 'two writers share docs', violations: [] } }) });
  await assert.rejects(() => runUnit({
    unitData: WRITE_UNIT, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  }), { code: 'writes-overlap' });
  assert.equal(dispatchCwdHolder(path.join(repoRoot, '.fgos'), worktreeDir), null);
});

test('the write gate asks the same port before the commit, and a refusal commits nothing', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort({ recheck: () => ({ refused: { code: 'consent-stale', condition: 'the approved plan changed after it was approved' } }) });
  const res = await runUnit({
    unitData: WRITE_UNIT, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'policy-refusal');
  assert.equal(res.results[0].refused.reason, 'consent-stale');
  assert.match(res.results[0].refused.detail, /approved plan changed/);
  const check = port.calls.find((c) => c[0] === 'recheckEffect');
  assert.deepEqual({ reservationId: check[1], caseId: check[2].caseId, paths: check[2].paths }, { reservationId: 'rsv-test', caseId: 'case-test', paths: ['docs/a.md'] });
  const log = execFileSync('git', ['log', '--oneline'], { cwd: worktreeDir, encoding: 'utf8' }).trim().split('\n');
  assert.equal(log.length, 1, 'the worker\'s file was not committed');
  assert.equal(port.calls.filter((c) => c[0] === 'settle').length, 1);
  assert.equal(port.calls.at(-1)[2].outcome, 'policy-refusal');
});

test('the seat-launch ceiling stops the fallback chain: a provider limit stays one and the seat says why', async () => {
  const { repoRoot, worktreeDir } = setup(['quotaa', 'okay']);
  const port = recordingPort({ admit: () => ({ admitted: true, reservationId: 'rsv-cap', caseId: 'case-test', seatLaunchCeiling: 1 }) });
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'provider-limit');
  assert.equal(res.results[0].fallbackExhausted.reason, 'seat-launch-ceiling');
  assert.notEqual(res.outcome, 'blocked');
  const settles = port.calls.filter((c) => c[0] === 'settle');
  assert.equal(settles.length, 1, 'settled exactly once');
  assert.deepEqual({ used: settles[0][2].seatLaunchesUsed, exhausted: settles[0][2].frameExhausted, outcome: settles[0][2].outcome }, { used: 1, exhausted: true, outcome: 'provider-limit' });
  assert.equal(unitJson(repoRoot, res.unitRunId).seatLaunchCeiling, 1, 'the bound is recorded with the run, so a resume keeps it');

  // Without the ceiling the same seat walks on to the next executor.
  const free = setup(['quotaa', 'okay']);
  const open = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, caseAdmission: recordingPort(), caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot: free.repoRoot, cwd: free.worktreeDir, worktree: free.worktreeDir,
  });
  assert.equal(open.outcome, 'pass');
});

test('an attempt whose account could not be leased started no worker, so it is not a launch of the seat', () => {
  const attempt = (extra = {}) => ({ dispatchRetryId: 'r1', ...extra });
  const record = { bindings: { 'producer/1': [attempt({ leaseConflict: true }), attempt({ outcome: 'provider-limit' }), attempt()], 'reviewer/1': [attempt()] } };
  assert.equal(seatLaunchesUsed(record), 3);
  assert.equal(seatLaunchesUsed({ bindings: { 'producer/1': [attempt({ leaseConflict: true })] } }), 0);
});

test('a run whose agents were never given their brief hands its dispatch back; one that was given it keeps it spent', async () => {
  const launched = (extra = {}) => ({ dispatchRetryId: 'r1', outcome: 'execution-failure', ...extra });
  assert.equal(briefNeverReached({ outcome: 'cancelled', reason: 'terminal:foreground-not-agent' }), true);
  assert.equal(briefNeverReached({ outcome: 'abandoned-before-brief' }), true);
  assert.equal(briefNeverReached({ outcome: 'cancelled', reason: 'terminal:needs-human' }), false, 'an agent that saw the brief and then waited on a person did work');
  assert.equal(briefNeverReached(null), false);
  assert.equal(noBriefDelivered({ bindings: { 'producer:1': [launched({ briefNotDelivered: true })] } }), true);
  assert.equal(noBriefDelivered({ bindings: { 'producer:1': [launched({ briefNotDelivered: true }), launched()] } }), false, 'a fallback that was given the brief did work');
  assert.equal(noBriefDelivered({ bindings: { 'producer:1': [launched({ briefNotDelivered: true, leaseConflict: true })] } }), false, 'nothing launched');
  assert.equal(noBriefDelivered({ bindings: {} }), false);

  // A seat that read its brief and failed still spends the dispatch.
  const { repoRoot, worktreeDir } = setup(['quotaa']);
  const port = recordingPort();
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const settle = port.calls.find((c) => c[0] === 'settle')[2];
  assert.notEqual(settle.outcome, 'not-started');
  assert.equal(settle.unitRunId, res.unitRunId);
});

test('a ceiling of two lets the fallback launch exactly once more', async () => {
  const { repoRoot, worktreeDir } = setup(['quotaa', 'okay']);
  const port = recordingPort({ admit: () => ({ admitted: true, reservationId: 'rsv-two', caseId: 'case-test', seatLaunchCeiling: 2 }) });
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  const settle = port.calls.find((c) => c[0] === 'settle')[2];
  assert.deepEqual({ used: settle.seatLaunchesUsed, exhausted: settle.frameExhausted }, { used: 2, exhausted: false });
});

test('a reviewed run that cannot launch its next round ends at the last evaluation', async () => {
  const roles = [];
  const result = await runReviewed(
    { id: 'u', objective: 'x', capability: 'docs:write', writes: [] },
    { loops: { reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } } } },
    {
      runRole: async ({ seat, round = 1 }) => {
        roles.push(`${seat.seat}/${round}`);
        return { seat: seat.seat, round, outcome: seat.seat === 'producer' ? 'pass' : 'findings', findings: ['fix this'] };
      },
      hasLaunchRoom: (seats) => { roles.push(`room?${seats}`); return false; },
      shippedCheckersByRigor: shippedCatalog().loops.reviewed.checkersByRigor,
    },
    { maxRounds: 2 },
  );
  assert.equal(result.outcome, 'findings');
  assert.equal(result.rounds, 1);
  assert.deepEqual(roles, ['producer/1', 'reviewer/1', 'room?2']);
});

test('the planned seat launches follow the pattern the run will use', () => {
  const cfg = { loops: { reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'], high: ['reviewer', 'red-team'] } } } };
  const unit = { id: 'u', writes: [], capability: 'docs:write' };
  assert.equal(seatLaunchesOf({ pattern: 'solo', unit, runnerConfig: cfg }), 1);
  assert.equal(seatLaunchesOf({ pattern: 'reviewed', unit, runnerConfig: cfg }), 4, 'producer and one checker, two rounds');
  assert.equal(seatLaunchesOf({ pattern: 'reviewed', unit: { ...unit, rigor: 'high' }, runnerConfig: cfg }), 6);
  assert.equal(seatLaunchesOf({ loop: 'reviewed', params: { maxRounds: 2 }, unit, runnerConfig: cfg }) > 0, true);
  const panelUnit = { ...unit, seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'c', role: 'producer' }, { seat: 'chair', role: 'synthesizer' }] };
  assert.equal(seatLaunchesOf({ pattern: 'panel', unit: panelUnit, runnerConfig: cfg }), 4, 'three members and the synthesizer');
  const debateUnit = { ...unit, seats: [{ seat: 'pro', role: 'producer' }, { seat: 'con', role: 'producer' }, { seat: 'judge', role: 'judge' }] };
  assert.equal(seatLaunchesOf({ pattern: 'debate', unit: debateUnit, runnerConfig: cfg }), 5, 'two sides in two rounds and the judge');
  assert.equal(seatLaunchesOf({ pattern: { pattern: 'debate', params: { rebuttal: false } }, unit: debateUnit, runnerConfig: cfg }), 3);
  assert.throws(() => seatLaunchesOf({ pattern: 'panel', unit, runnerConfig: cfg }), /must declare its seats/);
  assert.equal(seatLaunchesOf({ pattern: 'unheard-of', unit, runnerConfig: cfg }), null);
});

test('case dispatch with no selector runs activity unit and records baseline source activity', async () => {
  const { repoRoot, worktreeDir } = setup(['okay']);
  const port = recordingPort();
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    caseAdmission: port,
    caseRef: { caseId: 'case-test', activity: 'scout' },
    activityUnit: { pattern: 'solo' },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const admitCall = port.calls.find((c) => c[0] === 'admit');
  assert.ok(admitCall);
  assert.equal(admitCall[1].pattern, 'solo');
  const record = unitJson(repoRoot, res.unitRunId);
  assert.equal(record.collaboration.baseline.source, 'activity');
  assert.equal(record.pattern, 'solo');
});

test('solo-shaped seats with no pattern on reviewed activity refuse seat-multiplicity', async () => {
  const { repoRoot, worktreeDir } = setup(['okay']);
  const port = recordingPort();
  await assert.rejects(
    runUnit({
      unitData: { ...WRITE_UNIT, writes: [], objective: 'Read', seats: [{ seat: 'producer', role: 'producer' }] },
      caseAdmission: port,
      caseRef: { caseId: 'case-test', activity: 'review' },
      activityUnit: { pattern: 'reviewed' },
      repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    }),
    (err) => err instanceof RunnerConfigError && err.code === 'seat-multiplicity',
  );
  assert.equal(port.calls.filter((c) => c[0] === 'admit').length, 0);
});

test('pattern swap in case reaches admission with the selected pattern, and admission alone refuses it without a reason', async () => {
  const { repoRoot, worktreeDir } = setup(['okay']);
  const port = recordingPort({ admit: (proposal) => (proposal.reason ? { admitted: true, reservationId: 'rsv-test', caseId: 'case-test', seatLaunchCeiling: null } : { refused: { code: 'route-reason-required', condition: 'say why' } }) });

  // Without reason: the catalog lets it through and the port's refusal is what stops it
  await assert.rejects(runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    pattern: 'solo',
    caseAdmission: port,
    caseRef: { caseId: 'case-test', activity: 'review' },
    activityUnit: { pattern: 'reviewed' },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  }), (err) => err instanceof CaseAdmissionRefusedError && err.code === 'route-reason-required');
  assert.deepEqual(port.calls.filter((c) => c[0] === 'admit').map((c) => c[1].pattern), ['solo']);

  // With reason: runs and pin records swap
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    pattern: 'solo',
    reason: 'docs-only task',
    caseAdmission: port,
    caseRef: { caseId: 'case-test', activity: 'review' },
    activityUnit: { pattern: 'reviewed' },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const record = unitJson(repoRoot, res.unitRunId);
  assert.equal(record.pattern, 'solo');
  assert.equal(record.collaboration.requested?.pattern, 'solo');
  assert.equal(record.collaboration.requested?.reason, 'docs-only task');
  assert.equal(record.collaboration.baseline.source, 'activity');
});

test('request exceeding seat launches per dispatch ceiling refuses at admission', async () => {
  const { repoRoot, worktreeDir } = setup(['okay']);
  const port = recordingPort({
    admit: (proposal) => {
      if (proposal.seatLaunches > 4) {
        return {
          refused: {
            code: 'seat-launch-ceiling-exceeded',
            detail: `proposal demands ${proposal.seatLaunches} seat launches, frame ceiling is 4`,
          },
        };
      }
      return { admitted: true, reservationId: 'rsv-ok', caseId: 'case-test', seatLaunchCeiling: 4 };
    },
  });

  await assert.rejects(
    runUnit({
      unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
      pattern: 'reviewed',
      reason: 'more review rounds needed',
      request: { params: { maxRounds: 5 } },
      caseAdmission: port,
      caseRef: { caseId: 'case-test', activity: 'review' },
      repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    }),
    (err) => err instanceof CaseAdmissionRefusedError && err.refusal.code === 'seat-launch-ceiling-exceeded',
  );
});

test('case request reason reaches admission proposal and route event', async () => {
  const { repoRoot, worktreeDir } = setup(['okay']);
  const port = recordingPort();
  await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    caseAdmission: port,
    caseRef: { caseId: 'case-test', activity: 'scout', reason: 'diverging for fast scout' },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const admitCall = port.calls.find((c) => c[0] === 'admit');
  assert.ok(admitCall);
  assert.equal(admitCall[1].reason, 'diverging for fast scout');
  assert.equal(admitCall[1].caseRef.reason, 'diverging for fast scout');

  const caseRun = openCase({ repoRoot });
  const realPort = createCaseAdmissionPort({ repoRoot });
  const answer = realPort.admit({
    ...admitCall[1],
    caseRef: { caseId: caseRun.caseId, activity: 'scout', reason: 'diverging for fast scout' },
  });
  assert.equal(answer.admitted, true);
  const routeEvents = eventsOf(caseRun).filter((e) => e.type === 'route');
  assert.ok(routeEvents.length > 0);
  assert.equal(routeEvents.at(-1).payload.reason, 'diverging for fast scout');
  const portReq = recordingPort();
  await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    caseAdmission: portReq,
    caseRef: { caseId: 'case-test', activity: 'scout' },
    request: { reason: 'diverging via request reason' },
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const reqAdmitCall = portReq.calls.find((c) => c[0] === 'admit');
  assert.ok(reqAdmitCall);
  assert.equal(reqAdmitCall[1].reason, 'diverging via request reason');
  const reqAnswer = realPort.admit({
    ...reqAdmitCall[1],
    caseRef: { ...reqAdmitCall[1].caseRef, caseId: caseRun.caseId },
  });
  assert.equal(reqAnswer.admitted, true);
  const reqRouteEvents = eventsOf(caseRun).filter((e) => e.type === 'route');
  assert.equal(reqRouteEvents.at(-1).payload.reason, 'diverging via request reason');
  assert.equal(reqAdmitCall[1].caseRef.reason, 'diverging via request reason');

  const portOpt = recordingPort();
  await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    caseAdmission: portOpt,
    caseRef: { caseId: 'case-test', activity: 'scout' },
    reason: 'diverging via options reason',
    repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  const optAdmitCall = portOpt.calls.find((c) => c[0] === 'admit');
  assert.ok(optAdmitCall);
  assert.equal(optAdmitCall[1].reason, 'diverging via options reason');
  assert.equal(optAdmitCall[1].caseRef.reason, 'diverging via options reason');
  const optAnswer = realPort.admit({
    ...optAdmitCall[1],
    caseRef: { ...optAdmitCall[1].caseRef, caseId: caseRun.caseId },
  });
  assert.equal(optAnswer.admitted, true);
  const optRouteEvents = eventsOf(caseRun).filter((e) => e.type === 'route');
  assert.equal(optRouteEvents.at(-1).payload.reason, 'diverging via options reason');
});

test('runUnit launches critical reviewed seats with shipped floor when injected config lacks checker rows', async () => {
  const { repoRoot, worktreeDir } = setup(['alpha', 'beta', 'gamma', 'delta']);
  const port = recordingPort();
  const unitData = {
    id: 'u-crit-floor',
    objective: 'Critical floor wiring',
    capability: 'docs:write',
    writes: [],
    rigor: 'critical',
  };
  const baseCfg = readProjectConfig(repoRoot).runner;
  const configWithoutCheckers = {
    ...baseCfg,
    loops: {
      reviewed: {
        maxRounds: 1,
      },
    },
  };
  const res = await runUnit({
    unitData,
    pattern: 'reviewed',
    reason: 'prove critical floor execution wiring',
    caseAdmission: port,
    caseRef: { caseId: 'case-test', activity: 'scout' },
    repoRoot,
    cwd: worktreeDir,
    worktree: worktreeDir,
    runnerConfig: configWithoutCheckers,
  });
  assert.equal(res.outcome, 'pass');
  assert.deepEqual(
    res.results.map((r) => r.seat),
    ['producer', 'reviewer', 'red-team', 'tester'],
  );
});

// What the Unit run settles with, for the case and for the caller: one final outcome and the facts it stands on.
const goldenFacts = (id) => {
  const { data } = JSON.parse(fs.readFileSync(new URL(`../../../packages/run-result/contracts/fixtures/unit-result.${id}.v1.json`, import.meta.url), 'utf8'));
  const { outcome, infrastructure, outOfScope, outOfScopeOnBranch, evaluations, started, launches, settled } = data;
  return { outcome, infrastructure, outOfScope, outOfScopeOnBranch, evaluations, started, launches, settled };
};
const factsOf = (data) => Object.fromEntries(Object.keys(goldenFacts('pass')).map((key) => [key, data[key]]));
const settledOf = (port) => port.calls.find((c) => c[0] === 'settle')[2];
const gitIn = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

test('a Unit that wrote outside its scope ends findings for the case and for the caller alike, standalone or in a case', async () => {
  for (const caseRef of [{ caseId: 'case-test', activity: 'build' }, undefined]) {
    const { repoRoot, worktreeDir } = setup();
    const port = recordingPort();
    const res = await runUnit({
      unitData: { ...WRITE_UNIT, objective: 'WRITE:docs/a.md WRITE:stray.txt' }, caseAdmission: port, ...(caseRef ? { caseRef } : {}), repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    });
    assert.equal(res.outcome, 'findings', JSON.stringify(res.results));
    assert.deepEqual(res.outOfScope, ['stray.txt']);
    assert.equal(res.infrastructure, false, 'a path outside the scope is a verdict, never infrastructure');
    assert.equal(unitJson(repoRoot, res.unitRunId).settlement.outcome, 'findings', 'the unit record settles with the final outcome');
    if (caseRef) {
      assert.deepEqual([settledOf(port).outcome, settledOf(port).outOfScope], ['findings', ['stray.txt']]);
      assert.deepEqual(factsOf(res), goldenFacts('findings-out-of-scope'));
    }
  }
});

test('a Unit run hands up its final outcome with the facts it stands on: infrastructure, scope, evaluations, start, settles, launches', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort();
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, objective: 'WRITE:docs/a.md', verify: 'true' }, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  assert.deepEqual(factsOf(res), goldenFacts('pass'));
  assert.deepEqual([res.settled, res.warnings], [{ unit: true, case: true }, []]);
  assert.deepEqual(res.results.map((r) => [r.seat, r.outcome, r.infrastructure]), [['producer', 'pass', false], ['verify', 'pass', false]]);
  // The attempt keeps its RunResult accessors and gains the activity; nothing was kept for a seat with no session.
  const producerRun = res.results[0].runResult;
  assert.deepEqual(producerRun.activity, { turns: null, toolUses: null, transcriptPath: null });
  // The attempt's wall time is Execution's own measure of the dispatch, kept on the attempt record; the seat's binding names its provider family.
  assert.ok(Number.isInteger(producerRun.durationMs) && producerRun.durationMs >= 0, `durationMs ${producerRun.durationMs}`);
  assert.equal(res.results[0].binding.family, 'okay');
  assert.equal(unitJson(repoRoot, res.unitRunId).bindings['producer/1'][0].durationMs, producerRun.durationMs);
  assert.equal(typeof producerRun.confidence, 'string');
  // The transcript Execution kept in the attempt's run directory is named by its absolute path.
  const record = unitJson(repoRoot, res.unitRunId);
  const assignmentsDir = path.join(repoRoot, '.fgos', 'assignments');
  const runDir = path.join(assignmentsDir, record.bindings['producer/1'][0].assignmentId, 'runs', '01');
  fs.mkdirSync(path.join(runDir, 'steps'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'steps', 'finalize-home.json'), JSON.stringify({ detail: { transcriptPath: 'protected/session' } }));
  assert.equal(activityOf({ unitRecord: record, assignmentsDir }, res.results[0]).transcriptPath, path.join(runDir, 'protected', 'session'));
  // The port settles with the same shape, carrying its contract.
  const settle = settledOf(port);
  assert.deepEqual(settle.contract, { id: 'unit-run-result', version: 1 });
  assert.deepEqual({ ...factsOf(settle), settled: res.settled }, goldenFacts('pass'));
});

test('a reservation that cannot be settled is told to the caller: settled.case is false with the error, and a structured warning', async () => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort({ onSettle: () => { throw new Error('ledger is read-only'); } });
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
  });
  assert.equal(res.outcome, 'pass');
  assert.deepEqual(res.settled, { unit: true, case: false, settleError: 'ledger is read-only' });
  assert.deepEqual(res.warnings.map((w) => w.code), ['case-settle-failed']);
});

test('a Unit whose branch carries paths outside its scope since its base ends findings, and a writer built on it inherits them', async () => {
  const { repoRoot, worktreeDir } = setup();
  const baseSha = gitIn(worktreeDir, ['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(worktreeDir, 'other.txt'), 'carried\n');
  gitIn(worktreeDir, ['add', 'other.txt']);
  gitIn(worktreeDir, ['commit', '-m', 'producer commit outside the scope']);
  const port = recordingPort();
  const res = await runUnit({
    unitData: { ...WRITE_UNIT, objective: 'WRITE:docs/a.md' }, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    branchBase: { branch: 'wt-branch', baseSha, outOfScopeOnBranch: ['inherited.txt'] },
  });
  assert.equal(res.outcome, 'findings');
  assert.deepEqual(res.outOfScopeOnBranch, ['inherited.txt', 'other.txt']);
  assert.deepEqual(res.outOfScope, ['inherited.txt', 'other.txt']);
  assert.deepEqual(unitJson(repoRoot, res.unitRunId).branchBase, { branch: 'wt-branch', baseSha, outOfScopeOnBranch: ['inherited.txt'] }, 'a resume reads the base back from the record');
  assert.equal(settledOf(port).outcome, 'findings');
});

test('a write check that cannot run ends the Unit as an infrastructure failure instead of throwing out of the run', async () => {
  const { repoRoot, worktreeDir } = setup();
  const baseSha = gitIn(worktreeDir, ['rev-parse', 'HEAD']);
  const port = recordingPort();
  const res = await runUnit({
    unitData: WRITE_UNIT, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    branchBase: { branch: 'wf/gone', baseSha, outOfScopeOnBranch: [] },
  });
  assert.equal(res.outcome, 'execution-failure');
  assert.match(res.error, /could not check the writes of the unit: .*writing branch/);
  assert.deepEqual([res.infrastructure, res.outOfScope, settledOf(port).outcome], [true, [], 'execution-failure']);
});

test('a branch base that is not a branch, a commit and a list of paths is refused before any run exists', async () => {
  const { repoRoot, worktreeDir } = setup();
  for (const branchBase of [{}, { branch: '', baseSha: 'abc', outOfScopeOnBranch: [] }, { branch: 'b', baseSha: 'abc', outOfScopeOnBranch: 'x' }, 'wt-branch']) {
    await assert.rejects(() => runUnit({
      unitData: WRITE_UNIT, caseAdmission: recordingPort(), caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir, branchBase,
    }), /branchBase/);
  }
  assert.deepEqual(assignmentsOf(repoRoot), []);
});

test('each attempt of a Unit run hands up the report the seat left, its claim and whether Dispatch declared the report complete', async () => {
  const { repoRoot, worktreeDir } = setup();
  const res = await runUnit({ unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' }, caseAdmission: recordingPort(), caseRef: { caseId: 'case-test', activity: 'scout' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir });
  const { output } = res.results.at(-1);
  assert.equal(output.complete, res.results.at(-1).runResult.reportDeclaration.complete);
  assert.equal(output.incompleteReason, res.results.at(-1).runResult.reportDeclaration.incompleteReason);
  assert.deepEqual(output.claim, res.results.at(-1).runResult.agentClaim ?? null);
  if (output.complete) assert.deepEqual(Object.keys(output.report).sort(), ['bytes', 'path', 'sha256']);
  else assert.equal(output.report, null);
});
