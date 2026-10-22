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
import { acquireDocumentationCutoverLease } from '../../../src/runner/documentation-cutover-lease.mjs';
import { runUnit } from '../../../src/runner/execution/run.mjs';
import { runReviewed } from '../../../src/runner/execution/patterns/reviewed.mjs';
import { seatLaunchesOf, CaseAdmissionRefusedError } from '../../../src/runner/execution/case-admission-port.mjs';
import { dispatchCwdHolder } from '../../../src/runner/dispatch/cwd-lock.mjs';
import { createCaseAdmissionPort } from '../../../src/workflow/case-admission-port.mjs';
import { createPendingBinding, commitBinding } from '../../../src/workflow/case-bindings.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { activateGitFixture } from '../../helpers/git-fixture.mjs';
import { holdLockInChild } from '../../helpers/hold-lock-in-child.mjs';

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
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (match) {
  const claimDir = path.dirname(match[1]);
  const outbox = path.join(claimDir, 'worker-output', 'outbox');
  const dir = fs.existsSync(outbox) ? outbox : claimDir;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full detail.\\n');
  fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done', assessment: { verdict: 'pass' } }));
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
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      defaultExecutor: families[0],
      timeoutMs: 40000,
      defaults: { tier: 'standard' },
      modelPolicies: Object.fromEntries(families.map((f) => [f, { nano: 'fake', mini: 'fake', standard: 'fake', advanced: 'fake', flagship: 'fake', frontier: 'fake' }])),
      executors,
      capabilities: { 'docs:write': { prefer, rigor: 'standard' } },
      patterns: { seatBinding: { schema: 1 }, defaultRule: { mutatingMinRigor: 'standard' }, reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } } },
    },
  }, null, 2));
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

// Existing admission tests prove the case port, not the documentation freeze.
// A missing resume record also must not get far enough to acquire its control.
// The existing read-only Unit test owns worker completion; this wiring proof
// observes that the holder reaches the actual worker attempt with its binding.
test('documentation lease admission refuses non-holder runs before writes and lets its holder reach a worker attempt', async () => {
  const { repoRoot, worktreeDir } = setup();
  acquireDocumentationCutoverLease({ repoRoot: worktreeDir });
  const port = recordingPort();
  const before = fs.readdirSync(path.join(repoRoot, '.fgos')).sort();
  for (const extra of [
    { unitData: WRITE_UNIT },
    { unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' } },
    { resumeUnitRunId: 'not-created' },
  ]) {
    await assert.rejects(() => runUnit({
      ...extra, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'scout' },
      repoRoot, cwd: repoRoot, worktree: repoRoot,
    }), { code: 'documentation-cutover-lease' });
  }
  await assert.rejects(() => runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    repoRoot, cwd: makeFixtureDir('fgos-outside-'), worktree: repoRoot,
  }), { code: 'documentation-cutover-lease' });
  assert.deepEqual(names(port), [], 'no admission, reservation, settlement or custody');
  assert.deepEqual(assignmentsOf(repoRoot), []);
  assert.deepEqual(fs.readdirSync(path.join(repoRoot, '.fgos')).sort(), before, 'no sweep or runtime directory');
  assert.equal(dispatchCwdHolder(path.join(repoRoot, '.fgos'), repoRoot), null);
  const allowed = await runUnit({
    unitData: { ...WRITE_UNIT, writes: [], objective: 'Read' },
    repoRoot, cwd: repoRoot, worktree: worktreeDir,
  });
  assert.equal(allowed.results[0].refused, undefined);
  assert.equal(allowed.results[0].binding.executor, 'okay', 'ctx carries the holder checkout rather than the host cwd');
  assert.ok(allowed.results[0].runResult.runId, 'a real worker attempt was dispatched');
});

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

test('a Unit that names a case is admitted before custody and the unit directory, linked in unit.json, settled once after custody is released', async () => {
  const { repoRoot, worktreeDir } = setup();
  let quietAtSettle = null;
  let createdBeforeAdmit = null;
  const port = recordingPort({
    admit: () => {
      createdBeforeAdmit = assignmentsOf(repoRoot).length + (dispatchCwdHolder(path.join(repoRoot, '.fgos'), worktreeDir) ? 1 : 0);
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
  assert.equal(createdBeforeAdmit, 0, 'nothing existed when admission was asked');
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

test('custody that refuses after admission gives the reservation back as not-started', async (t) => {
  const { repoRoot, worktreeDir } = setup();
  const port = recordingPort();
  const { child, exited } = await holdLockInChild('dispatch-cwd', { fgosDir: path.join(repoRoot, '.fgos'), cwd: worktreeDir });
  try {
    await assert.rejects(() => runUnit({
      unitData: WRITE_UNIT, caseAdmission: port, caseRef: { caseId: 'case-test', activity: 'build' }, repoRoot, cwd: worktreeDir, worktree: worktreeDir,
    }), { code: 'dispatch-in-flight' });
  } finally { child.kill('SIGKILL'); await exited; }
  assert.deepEqual(names(port), ['admit', 'settle']);
  assert.deepEqual({ outcome: port.calls[1][2].outcome, unitRunId: port.calls[1][2].unitRunId }, { outcome: 'not-started', unitRunId: null });
  assert.deepEqual(assignmentsOf(repoRoot), []);
  t.diagnostic('settled once, idempotently, by name');
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
    { patterns: { reviewed: { maxRounds: 2 } } },
    {
      runRole: async ({ seat, round = 1 }) => {
        roles.push(`${seat.seat}/${round}`);
        return { seat: seat.seat, round, outcome: seat.seat === 'producer' ? 'pass' : 'findings', findings: ['fix this'] };
      },
      hasLaunchRoom: (seats) => { roles.push(`room?${seats}`); return false; },
    },
    {},
  );
  assert.equal(result.outcome, 'findings');
  assert.equal(result.rounds, 1);
  assert.deepEqual(roles, ['producer/1', 'reviewer/1', 'room?2']);
});

test('the planned seat launches follow the pattern the run will use', () => {
  const cfg = { patterns: { reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'], high: ['reviewer', 'red-team'] } } } };
  const unit = { id: 'u', writes: [], capability: 'docs:write' };
  assert.equal(seatLaunchesOf({ pattern: 'solo', unit, runnerConfig: cfg }), 1);
  assert.equal(seatLaunchesOf({ pattern: 'reviewed', unit, runnerConfig: cfg }), 4, 'producer and one checker, two rounds');
  assert.equal(seatLaunchesOf({ pattern: 'reviewed', unit: { ...unit, rigor: 'high' }, runnerConfig: cfg }), 6);
  assert.equal(seatLaunchesOf({ pattern: 'code-change', unit, runnerConfig: cfg }) > 0, true);
  const panelUnit = { ...unit, seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'c', role: 'producer' }, { seat: 'chair', role: 'synthesizer' }] };
  assert.equal(seatLaunchesOf({ pattern: 'panel', unit: panelUnit, runnerConfig: cfg }), 4, 'three members and the synthesizer');
  const debateUnit = { ...unit, seats: [{ seat: 'pro', role: 'producer' }, { seat: 'con', role: 'producer' }, { seat: 'judge', role: 'judge' }] };
  assert.equal(seatLaunchesOf({ pattern: 'debate', unit: debateUnit, runnerConfig: cfg }), 5, 'two sides in two rounds and the judge');
  assert.equal(seatLaunchesOf({ pattern: { pattern: 'debate', params: { rebuttal: false } }, unit: debateUnit, runnerConfig: cfg }), 3);
  assert.throws(() => seatLaunchesOf({ pattern: 'panel', unit, runnerConfig: cfg }), /must declare its seats/);
  assert.equal(seatLaunchesOf({ pattern: 'unheard-of', unit, runnerConfig: cfg }), null);
});
