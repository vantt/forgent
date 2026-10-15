// test/workflow/units-runner.test.mjs — Running a units file: unit prefer/persona, --effort,
// out-of-scope writes, and chaining a writing unit onto the branch of the writing unit it builds on.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { startWorkflow, resumeWorkflow, statusWorkflow, validateWorkflow, readWorkflowEvents } from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

seedFileLocalBwrapRegistry();
if (!process.env.XDG_STATE_HOME) {
  process.env.XDG_STATE_HOME = makeFixtureDir('fgos-state-');
}

// makeFixtureDir removes these at exit (FGOS_KEEP_TEST_FIXTURES=1 keeps them for debugging).
const fixtures = [];

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

// A worker that writes every file its brief names as WRITE:<path> (with the content "<path>
// written"), and reports the files named EXPECT:<path> that it found in its worktree.
const WORKER = `
import fs from 'node:fs';
import path from 'node:path';
const prompt = process.argv.slice(2).join(' ');
// Only the producer writes; a reviewer reads the same objective and must leave the worktree alone.
const ownResult = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt)?.[1] ?? '';
const producer = ownResult.includes('/producer/');
for (const m of producer ? prompt.matchAll(/WRITE:(\\S+)/g) : []) {
  fs.mkdirSync(path.dirname(m[1]), { recursive: true });
  fs.writeFileSync(m[1], m[1] + ' written\\n');
}
const seen = [...prompt.matchAll(/EXPECT:(\\S+)/g)].map((m) => m[1]).filter((f) => fs.existsSync(f));
const effortAt = process.argv.indexOf('--effort');
const effort = effortAt === -1 ? 'none' : process.argv[effortAt + 1];
const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
if (match) {
  const claimDir = path.dirname(match[1]);
  const outbox = path.join(claimDir, 'worker-output', 'outbox');
  const runDir = fs.existsSync(outbox) ? outbox : claimDir;
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nThe assigned work was carried out and checked in full. Seen: ' + seen.join(',') + '\\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Seen: ' + (seen.join(',') || 'none') + ' Effort: ' + effort, assessment: { verdict: 'pass' } }));
}
`;

// With effortCli the executor's command is a script named "agy", a CLI fgOS knows how to hand a
// reasoning effort to (--effort <level>), so a requested effort is really rendered into argv.
function setupRepo({ effortCli = false } = {}) {
  const tmp = makeFixtureDir('fgos-units-run-');
  fixtures.push(tmp);
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Units Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'units@test.local'], { cwd: tmp, stdio: 'ignore' });
  fs.writeFileSync(path.join(tmp, 'README.md'), '# Units\n');
  fs.writeFileSync(path.join(tmp, '.gitignore'), '.fgos/\nworker.mjs\n*-bin\n');
  execFileSync('git', ['add', 'README.md', '.gitignore'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tmp, stdio: 'ignore' });

  const worker = path.join(tmp, 'worker.mjs');
  fs.writeFileSync(worker, WORKER);
  fs.mkdirSync(path.join(tmp, '.fgos'), { recursive: true });
  let command = process.execPath;
  let args = [worker, '{prompt}'];
  if (effortCli) {
    command = path.join(tmp, '.fgos', 'bin', 'agy');
    fs.mkdirSync(path.dirname(command), { recursive: true });
    fs.writeFileSync(command, `#!${process.execPath}\n${WORKER}`, { mode: 0o755 });
    args = ['{prompt}'];
  }
  fs.writeFileSync(path.join(tmp, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      defaultExecutor: 'test-node',
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: { node: { standard: 'node-std' } },
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test node executor',
          allowCrossProvider: true,
          command,
          args,
          providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args }],
        },
      },
      capabilities: { 'docs:write': { prefer: [{ executor: 'test-node' }], rigor: 'standard' } },
      patterns: { defaultRule: { mutatingMinRigor: 'standard' }, reviewed: { maxRounds: 1, checkersByRigor: { standard: ['reviewer'] } } },
    },
  }, null, 2));
  return tmp;
}

// A reviewed unit needs its reviewer in another provider family than its producer: two executors
// whose commands are differently named links to node, both preferred for every capability.
function useTwoFamilies(tmp) {
  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const worker = path.join(tmp, 'worker.mjs');
  cfg.runner.executors = {};
  for (const name of ['alpha', 'beta']) {
    const command = path.join(tmp, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    const args = [worker, '{prompt}'];
    cfg.runner.executors[name] = {
      kind: 'agent', allowCrossProvider: true, command, args, providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args }],
    };
  }
  cfg.runner.defaultExecutor = 'alpha';
  cfg.runner.capabilities['docs:write'].prefer = [{ executor: 'alpha' }, { executor: 'beta' }];
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
}

function unitsFile(tmp, units) {
  const file = path.join(tmp, '.fgos', `units-${fixtures.length}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify({ units }));
  return file;
}

const unitRecordOf = (tmp, unitRunId) => JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', unitRunId, 'unit.json'), 'utf8'));
const producerAssignment = (tmp, unitRunId) => JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', unitRunId, 'producer', '1', 'assignment.json'), 'utf8'));
const opts = (tmp) => ({ repoRoot: tmp, cwd: tmp, worktree: tmp });

test('a units file runs through startWorkflow, and a unit\'s prefer and persona reach the Unit it runs', async () => {
  const tmp = setupRepo();
  const file = unitsFile(tmp, [
    { id: 'look', objective: 'Read the readme', capability: 'docs:write', prefer: ['test-node'], persona: 'code-reviewer' },
  ]);
  const state = await startWorkflow({ unitsPath: file, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.match(state.workflowId, /^units\//);

  const unitRunId = state.steps.look.units.look.unitRunId;
  const record = unitRecordOf(tmp, unitRunId);
  assert.deepEqual(record.unit.prefer, ['test-node']);
  assert.equal(record.unit.persona, 'code-reviewer');
  // bind() chose from the unit's own prefer and took its persona, no override involved.
  const provenance = producerAssignment(tmp, unitRunId).binding.provenance;
  assert.deepEqual(provenance.executor, { value: 'test-node', source: 'unit-prefer' });
  assert.deepEqual(provenance.persona, { value: 'code-reviewer', source: 'unit' });
  assert.deepEqual(record.overrides, []);
});

test('a unit\'s timeoutMs in a units file reaches the Unit and its dispatch; one out of range is refused before any run exists', async () => {
  const tmp = setupRepo();
  const file = unitsFile(tmp, [{ id: 'heavy', objective: 'Read the readme', capability: 'docs:write', timeoutMs: 5400000 }]);
  const state = await startWorkflow({ unitsPath: file, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  const unitRunId = state.steps.heavy.units.heavy.unitRunId;
  assert.equal(unitRecordOf(tmp, unitRunId).unit.timeoutMs, 5400000);
  assert.deepEqual(producerAssignment(tmp, unitRunId).binding.provenance.timeoutMs, { value: 5400000, source: 'unit' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', unitRunId, 'producer', '1', 'runs', '01', 'run.json'), 'utf8')).timeoutMs, 5400000);

  assert.throws(() => validateWorkflow({
    id: 'too-long',
    steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', objective: 'Read', writes: [], timeoutMs: 99 * 3600000 } }] }],
  }), /timeoutMs must be at most 4h/);
});

test('--effort becomes a human-cli reasoningEffort override on every unit, kept in the run for resume', async () => {
  const tmp = setupRepo({ effortCli: true });
  const workflow = validateWorkflow({
    id: 'effort',
    steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', objective: 'Read', writes: [] } }] }],
  });
  const state = await startWorkflow({ workflow, effort: 'high', ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(state.effort, 'high');
  assert.equal(readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId })[0].payload.effort, 'high');

  const unitRunId = state.steps.s.units.u.unitRunId;
  assert.deepEqual(producerAssignment(tmp, unitRunId).binding.provenance.reasoningEffort, { value: 'high', source: 'override:human-cli' });
  assert.ok(unitRecordOf(tmp, unitRunId).overrides.some((o) => o.reasoningEffort === 'high' && o.origin === 'human-cli' && !o.scope));
  assert.match(state.steps.s.units.u.results.at(-1).runResult.agentClaim.summary, /Effort: high/, 'the CLI was launched with --effort high');
});

test('an effort level outside the canonical ones is refused before any run exists', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({ id: 'effort-bad', steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', objective: 'x' } }] }] });
  await assert.rejects(() => startWorkflow({ workflow, effort: 'turbo', ...opts(tmp) }), /reasoningEffort "turbo"/);
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false);
});

test('a unit that wrote outside its writes ends findings and its branch is not integrated', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'stray',
    steps: [
      { id: 'w', units: [{ id: 'w', template: { capability: 'docs:write', objective: 'WRITE:a.txt WRITE:stray.txt', writes: ['a.txt'] } }] },
      { id: 'land', kind: 'integrate', dependsOn: ['w'] },
    ],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  const unit = state.steps.w.units.w;
  assert.equal(unit.outcome, 'findings', JSON.stringify(unit));
  assert.deepEqual(unit.outOfScope, ['stray.txt']);
  assert.equal(state.status, 'failed');
  assert.match(state.steps.w.reason, /out-of-scope-writes/);
  assert.equal(fs.existsSync(path.join(tmp, 'a.txt')), false, 'nothing reached the trunk');
});

test('a writing unit that builds on one writing unit starts from that unit\'s branch; status lists both branches', async () => {
  const tmp = setupRepo();
  const file = unitsFile(tmp, [
    { id: 'w-a', objective: 'WRITE:a.txt', capability: 'docs:write', writes: ['a.txt'] },
    { id: 'read', objective: 'Read only', capability: 'docs:write', dependsOn: ['w-a'] },
    { id: 'w-b', objective: 'WRITE:b.txt EXPECT:a.txt', capability: 'docs:write', writes: ['b.txt'], dependsOn: ['read'] },
  ]);
  const state = await startWorkflow({ unitsPath: file, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const a = state.steps['w-a'].units['w-a'];
  const b = state.steps['w-b'].units['w-b'];
  assert.ok(a.branch && b.branch && a.worktreePath && b.worktreePath);
  assert.equal(b.baseRef, a.branch, 'the base of w-b is the branch of w-a');
  assert.equal(b.baseSha, git(tmp, ['rev-parse', a.branch]));
  assert.equal(a.baseRef, 'HEAD');
  // w-b saw a.txt while it ran, and its branch carries the commit of w-a under its own.
  assert.match(b.results.at(-1).runResult.agentClaim.summary, /Seen: a\.txt/);
  assert.equal(git(tmp, ['merge-base', '--is-ancestor', a.branch, b.branch]) === '', true);
  assert.deepEqual(git(tmp, ['show', '--name-only', '--format=', b.branch]).split('\n'), ['b.txt']);
  // Nothing was merged into the trunk; the user merges the branch at the end of the chain.
  assert.equal(fs.existsSync(path.join(tmp, 'a.txt')), false);

  const status = statusWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp });
  assert.deepEqual(status.writeBranches.map((e) => [e.unitId, e.branch, e.baseRef]), [
    ['w-a', a.branch, 'HEAD'],
    ['w-b', b.branch, a.branch],
  ]);
  assert.deepEqual(state.writeBranches, status.writeBranches);
});

test('a writing unit that builds on two writing units is refused at start, before any run exists', async () => {
  const tmp = setupRepo();
  const file = unitsFile(tmp, [
    { id: 'w-a', objective: 'WRITE:a.txt', capability: 'docs:write', writes: ['a.txt'] },
    { id: 'w-b', objective: 'WRITE:b.txt', capability: 'docs:write', writes: ['b.txt'] },
    { id: 'w-c', objective: 'WRITE:c.txt', capability: 'docs:write', writes: ['c.txt'], dependsOn: ['w-a', 'w-b'] },
  ]);
  await assert.rejects(() => startWorkflow({ unitsPath: file, ...opts(tmp) }), /w-c.*w-a.*w-b.*merge these units into one, or make one depend on the other/s);
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false);

  // Building on a chain (w-c on w-b on w-a) is one writing unit, the nearest one.
  const chain = unitsFile(tmp, [
    { id: 'w-a', objective: 'WRITE:a.txt', capability: 'docs:write', writes: ['a.txt'] },
    { id: 'w-b', objective: 'WRITE:b.txt', capability: 'docs:write', writes: ['b.txt'], dependsOn: ['w-a'] },
    { id: 'w-c', objective: 'WRITE:c.txt EXPECT:a.txt EXPECT:b.txt', capability: 'docs:write', writes: ['c.txt'], dependsOn: ['w-a', 'w-b'] },
  ]);
  const state = await startWorkflow({ unitsPath: chain, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(state.steps['w-c'].units['w-c'].baseRef, state.steps['w-b'].units['w-b'].branch);
  assert.match(state.steps['w-c'].units['w-c'].results.at(-1).runResult.agentClaim.summary, /Seen: a\.txt,b\.txt/);
});

test('resume keeps the effort the run started with', async () => {
  const tmp = setupRepo({ effortCli: true });
  const workflow = validateWorkflow({
    id: 'effort-resume',
    steps: [
      { id: 'gate', gate: { kind: 'human', question: 'Go?' } },
      { id: 's', dependsOn: ['gate'], units: [{ id: 'u', template: { capability: 'docs:write', objective: 'Read' } }] },
    ],
  });
  const parked = await startWorkflow({ workflow, effort: 'low', ...opts(tmp) });
  assert.equal(parked.status, 'parked');
  const { answerWorkflow } = await import('../../src/workflow/index.mjs');
  const state = await answerWorkflow(parked.workflowRunId, { stepId: 'gate', answer: 'yes', approved: true, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(producerAssignment(tmp, state.steps.s.units.u.unitRunId).binding.provenance.reasoningEffort.value, 'low');
  assert.match(state.steps.s.units.u.results.at(-1).runResult.agentClaim.summary, /Effort: low/);
  // A resume of the finished run changes nothing.
  assert.equal((await resumeWorkflow(parked.workflowRunId, opts(tmp))).effort, 'low');
});

test('a file outside the scope is found by its real name, so a non-ASCII name inside the scope passes', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'unicode',
    steps: [{ id: 'w', units: [{ id: 'w', template: { capability: 'docs:write', objective: 'WRITE:docs/résumé.md', writes: ['docs/**'] } }] }],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps.w));
  assert.equal(state.steps.w.units.w.outOfScope, undefined);
});

test('an out-of-scope file left uncommitted on a writer does not hold back the clean writer built on its branch', async () => {
  const tmp = setupRepo();
  useTwoFamilies(tmp);
  const workflow = validateWorkflow({
    id: 'leak',
    steps: [
      { id: 'a', units: [{ id: 'w-a', template: { capability: 'docs:write', pattern: 'reviewed', acceptOutcomes: ['pass', 'findings'], objective: 'WRITE:a.txt WRITE:stray.txt', writes: ['a.txt'] } }] },
      { id: 'b', dependsOn: ['a'], units: [{ id: 'w-b', template: { capability: 'docs:write', pattern: 'reviewed', acceptOutcomes: ['pass', 'findings'], objective: 'WRITE:b.txt', writes: ['b.txt'] } }] },
      { id: 'land', kind: 'integrate', dependsOn: ['b'] },
    ],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.steps.a.units['w-a'].outcome, 'findings', JSON.stringify(state.steps.a));
  assert.deepEqual(state.steps.a.units['w-a'].outOfScope, ['stray.txt']);
  // The runner commits only the write scope, so stray.txt never reached w-a's branch: w-b, built on
  // that branch, carries nothing out of scope, passes, and lands with the in-scope work under it.
  assert.equal(git(tmp, ['show', '--name-only', '--format=', state.steps.a.units['w-a'].branch]), 'a.txt');
  assert.equal(state.steps.b.units['w-b'].outOfScope, undefined);
  assert.equal(state.steps.b.units['w-b'].outcome, 'pass');
  assert.equal(state.status, 'completed', JSON.stringify(state.steps.land));
  assert.equal(git(tmp, ['show', 'HEAD:b.txt']), 'b.txt written');
  assert.equal(git(tmp, ['show', 'HEAD:a.txt']), 'a.txt written');
  assert.throws(() => git(tmp, ['show', 'HEAD:stray.txt']), 'the stray file never reached the trunk');
});

test('an integrate step that would land a unit with out-of-scope writes fails and says so', async () => {
  const tmp = setupRepo();
  useTwoFamilies(tmp);
  const workflow = validateWorkflow({
    id: 'land-flagged',
    steps: [
      { id: 'a', units: [{ id: 'w-a', template: { capability: 'docs:write', pattern: 'reviewed', acceptOutcomes: ['pass', 'findings'], objective: 'WRITE:a.txt WRITE:stray.txt', writes: ['a.txt'] } }] },
      { id: 'land', kind: 'integrate', dependsOn: ['a'] },
    ],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.steps.a.units['w-a'].outcome, 'findings');
  assert.equal(state.status, 'failed');
  assert.equal(state.steps.land.status, 'failed');
  assert.match(state.steps.land.reason, /w-a.*out-of-scope-writes.*stray\.txt/);
  assert.throws(() => git(tmp, ['show', 'HEAD:a.txt']), 'nothing was merged');
});

test('a units file refuses a unit id that cannot name a branch, and --seats with a units file', async () => {
  const tmp = setupRepo();
  await assert.rejects(
    () => startWorkflow({ unitsPath: unitsFile(tmp, [{ id: 'fix login', objective: 'x', capability: 'docs:write' }]), ...opts(tmp) }),
    /unit id "fix login"/,
  );
  await assert.rejects(
    () => startWorkflow({ unitsPath: unitsFile(tmp, [{ id: 'fix.', objective: 'x', capability: 'docs:write' }]), ...opts(tmp) }),
    /unit id "fix\."/,
  );
  await assert.rejects(
    () => startWorkflow({ unitsPath: unitsFile(tmp, [{ id: 'u', objective: 'x', capability: 'docs:write' }]), seats: ['a', 'b', 'c'], ...opts(tmp) }),
    /seats.*units file/,
  );
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false);
});

test('a writer whose base writer has no branch fails instead of starting from HEAD', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'lost-base',
    steps: [
      { id: 'a', units: [{ id: 'w-a', template: { capability: 'docs:write', objective: 'WRITE:a.txt', writes: ['a.txt'] } }] },
      { id: 'gate', dependsOn: ['a'], gate: { kind: 'human', question: 'Go?' } },
      { id: 'b', dependsOn: ['gate'], units: [{ id: 'w-b', template: { capability: 'docs:write', objective: 'WRITE:b.txt', writes: ['b.txt'] } }] },
    ],
  });
  const parked = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(parked.status, 'parked');
  const branchA = parked.steps.a.units['w-a'].branch;
  execFileSync('git', ['worktree', 'remove', '--force', parked.steps.a.units['w-a'].worktreePath], { cwd: tmp });
  execFileSync('git', ['branch', '-D', branchA], { cwd: tmp });
  const { answerWorkflow } = await import('../../src/workflow/index.mjs');
  const state = await answerWorkflow(parked.workflowRunId, { stepId: 'gate', answer: 'yes', approved: true, ...opts(tmp) });
  assert.equal(state.status, 'failed');
  assert.match(state.steps.b.reason, new RegExp(`base branch "${branchA}"`));
});

test('a preset or plan writer that builds on two writers keeps starting from HEAD; only a units file is refused', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'two-bases',
    steps: [
      { id: 'a', units: [{ id: 'w-a', template: { capability: 'docs:write', objective: 'WRITE:a.txt', writes: ['a.txt'] } }] },
      { id: 'b', units: [{ id: 'w-b', template: { capability: 'docs:write', objective: 'WRITE:b.txt', writes: ['b.txt'] } }] },
      { id: 'c', dependsOn: ['a', 'b'], units: [{ id: 'w-c', template: { capability: 'docs:write', objective: 'WRITE:c.txt', writes: ['c.txt'] } }] },
    ],
  });
  const state = await startWorkflow({ workflow, ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(state.steps.c.units['w-c'].baseRef, 'HEAD');
});

test('fgos workflow start --units <file> --effort runs the units and reports the write branches', async () => {
  const tmp = setupRepo({ effortCli: true });
  const file = unitsFile(tmp, [
    { id: 'w-a', objective: 'WRITE:a.txt', capability: 'docs:write', writes: ['a.txt'] },
    { id: 'w-b', objective: 'WRITE:b.txt EXPECT:a.txt', capability: 'docs:write', writes: ['b.txt'], dependsOn: ['w-a'] },
  ]);
  const out = execFileSync(process.execPath, [path.resolve('bin/fgos.mjs'), 'workflow', 'start', '--units', file, '--effort', 'high', '--foreground', '--dir', tmp], { cwd: tmp, encoding: 'utf8' });
  const state = JSON.parse(out).data;
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(state.effort, 'high');
  assert.deepEqual(state.writeBranches.map((e) => e.unitId), ['w-a', 'w-b']);
  assert.equal(state.writeBranches[1].baseRef, state.writeBranches[0].branch);
  assert.match(state.steps['w-b'].units['w-b'].results.at(-1).runResult.agentClaim.summary, /Seen: a\.txt Effort: high/);
});

test('--timeout gives every unit of the workflow run its own timeoutMs, kept for resume', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'timeout-run',
    steps: [
      { id: 'gate', gate: { kind: 'human', question: 'Proceed?' } },
      { id: 's', dependsOn: ['gate'], units: [{ id: 'u', template: { capability: 'docs:write', objective: 'Read' } }] },
    ],
  });
  const state = await startWorkflow({ workflow, timeout: '90m', ...opts(tmp) });
  assert.equal(state.status, 'parked');
  assert.equal(state.timeoutMs, 5400000);
  assert.equal(readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId })[0].payload.timeoutMs, 5400000);

  const { answerWorkflow } = await import('../../src/workflow/index.mjs');
  const answered = await answerWorkflow(state.workflowRunId, { stepId: 'gate', answer: 'yes', approved: true, ...opts(tmp) });
  assert.equal(answered.status, 'completed', JSON.stringify(answered.steps));
  assert.equal(answered.timeoutMs, 5400000);

  const unitRunId = answered.steps.s.units.u.unitRunId;
  const record = unitRecordOf(tmp, unitRunId);
  assert.ok(record.overrides.some((o) => o.timeoutMs === 5400000 && o.origin === 'human-cli' && !o.scope));
  assert.deepEqual(producerAssignment(tmp, unitRunId).binding.provenance.timeoutMs, { value: 5400000, source: 'override:human-cli' });
  assert.equal(producerAssignment(tmp, unitRunId).binding.timeoutMs, 5400000);
});

test('a unit with its own timeoutMs wins over workflow start --timeout', async () => {
  const tmp = setupRepo();
  const file = unitsFile(tmp, [
    { id: 'u-default', objective: 'Read', capability: 'docs:write' },
    { id: 'u-custom', objective: 'Read with own timeout', capability: 'docs:write', timeoutMs: 120000 },
  ]);
  const state = await startWorkflow({ unitsPath: file, timeout: '90m', ...opts(tmp) });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));
  assert.equal(state.timeoutMs, 5400000);

  const runA = state.steps['u-default'].units['u-default'].unitRunId;
  const runB = state.steps['u-custom'].units['u-custom'].unitRunId;

  assert.deepEqual(producerAssignment(tmp, runA).binding.provenance.timeoutMs, { value: 5400000, source: 'override:human-cli' });
  assert.equal(producerAssignment(tmp, runA).binding.timeoutMs, 5400000);

  assert.deepEqual(producerAssignment(tmp, runB).binding.provenance.timeoutMs, { value: 120000, source: 'unit' });
  assert.equal(producerAssignment(tmp, runB).binding.timeoutMs, 120000);
});

test('--account pins provider account on every unit of the workflow run, kept for resume', async () => {
  const tmp = setupRepo();
  fs.writeFileSync(path.join(tmp, 'login'), 'token\n');
  const fakeHome = makeFixtureDir('fgos-home-');
  fixtures.push(fakeHome);
  fs.mkdirSync(path.join(fakeHome, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(fakeHome, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      providers: {
        node: {
          accounts: {
            'acct-test': { label: 'acct-test', credentialSource: { kind: 'home-files', home: tmp, files: ['login'] } },
          },
        },
      },
    },
  }, null, 2));
  const prevHome = process.env.HOME;
  process.env.HOME = fakeHome;
  try {
    const workflow = validateWorkflow({
      id: 'account-run',
      steps: [
        { id: 'gate', gate: { kind: 'human', question: 'Proceed?' } },
        { id: 's', dependsOn: ['gate'], units: [{ id: 'u', template: { capability: 'docs:write', objective: 'Read' } }] },
      ],
    });
    const state = await startWorkflow({ workflow, account: 'acct-test', ...opts(tmp) });
    assert.equal(state.status, 'parked');
    assert.equal(state.account, 'acct-test');
    assert.equal(readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId })[0].payload.account, 'acct-test');

    const { answerWorkflow } = await import('../../src/workflow/index.mjs');
    const answered = await answerWorkflow(state.workflowRunId, { stepId: 'gate', answer: 'yes', approved: true, ...opts(tmp) });
    assert.equal(answered.status, 'completed', JSON.stringify(answered.steps));
    assert.equal(answered.account, 'acct-test');

    const unitRunId = answered.steps.s.units.u.unitRunId;
    const binding = producerAssignment(tmp, unitRunId).binding;
    assert.deepEqual(binding.account, { provider: 'node', id: 'acct-test' });
    assert.deepEqual(binding.provenance.account, { value: 'acct-test', source: 'override:human-cli' });
  } finally {
    if (prevHome === undefined) delete process.env.HOME;
    else process.env.HOME = prevHome;
  }
});

test('workflow start with invalid --timeout or --account is refused before run exists', async () => {
  const tmp = setupRepo();
  const workflow = validateWorkflow({
    id: 'bad-params',
    steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', objective: 'Read' } }] }],
  });

  await assert.rejects(() => startWorkflow({ workflow, timeout: '10h', ...opts(tmp) }), /at most 4h/);
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false);

  await assert.rejects(() => startWorkflow({ workflow, account: '', ...opts(tmp) }), /account/);
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false);

  await assert.rejects(() => startWorkflow({ workflow, account: 'unknown-acct', ...opts(tmp) }), /not configured in runner\.providers/);
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs')), false);
});

test('workflow with two units on different providers pins account only on matching unit and both run', async () => {
  const tmp = setupRepo();
  const fakeHome = makeFixtureDir('fgos-diff-home-');
  fixtures.push(fakeHome);
  fs.writeFileSync(path.join(tmp, 'login'), 'token\n');
  fs.mkdirSync(path.join(fakeHome, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(fakeHome, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      providers: {
        alpha: {
          accounts: {
            'acct-alpha': { label: 'acct-alpha', credentialSource: { kind: 'home-files', home: tmp, files: ['login'] } },
          },
        },
      },
    },
  }, null, 2));

  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const worker = path.join(tmp, 'worker.mjs');
  cfg.runner.executors = {};
  for (const name of ['alpha', 'beta']) {
    const command = path.join(tmp, `${name}-bin`);
    if (!fs.existsSync(command)) fs.symlinkSync(process.execPath, command);
    const args = [worker, '{prompt}'];
    cfg.runner.executors[name] = {
      kind: 'agent', allowCrossProvider: true, command, args, providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args }],
    };
  }
  cfg.runner.capabilities = {
    'cap-alpha': { prefer: [{ executor: 'alpha' }], rigor: 'standard' },
    'cap-beta': { prefer: [{ executor: 'beta' }], rigor: 'standard' },
  };
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  const prevHome = process.env.HOME;
  process.env.HOME = fakeHome;
  try {
    const workflow = validateWorkflow({
      id: 'diff-provider-workflow',
      steps: [
        { id: 's1', units: [{ id: 'u1', template: { capability: 'cap-alpha', objective: 'Task 1' } }] },
        { id: 's2', dependsOn: ['s1'], units: [{ id: 'u2', template: { capability: 'cap-beta', objective: 'Task 2' } }] },
      ],
    });
    const state = await startWorkflow({ workflow, account: 'acct-alpha', ...opts(tmp) });
    assert.equal(state.status, 'completed', JSON.stringify(state.steps));

    const u1RunId = state.steps.s1.units.u1.unitRunId;
    const u2RunId = state.steps.s2.units.u2.unitRunId;

    const b1 = producerAssignment(tmp, u1RunId).binding;
    const b2 = producerAssignment(tmp, u2RunId).binding;

    assert.deepEqual(b1.account, { provider: 'alpha', id: 'acct-alpha' });
    assert.equal(b2.account, undefined);
    // The unit the account did not reach is recorded, not dropped silently.
    const unpinned = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId })
      .filter((e) => e.type === 'unit.account-unpinned');
    assert.deepEqual(unpinned.map((e) => [e.payload.unitId, e.payload.account]), [['u2', 'acct-alpha']]);
  } finally {
    if (prevHome === undefined) delete process.env.HOME;
    else process.env.HOME = prevHome;
  }
});

test('CLI workflow start accepts --timeout and --account, while resume refuses them', async () => {
  const tmp = setupRepo();
  const fakeHome = makeFixtureDir('fgos-cli-home-');
  fs.writeFileSync(path.join(tmp, 'login'), 'token\n');
  fixtures.push(fakeHome);
  fs.mkdirSync(path.join(fakeHome, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(fakeHome, '.fgos', 'config.json'), JSON.stringify({
    runner: {
      providers: {
        node: {
          accounts: {
            'acct-cli': { label: 'acct-cli', credentialSource: { kind: 'home-files', home: tmp, files: ['login'] } },
          },
        },
      },
    },
  }, null, 2));

  const file = unitsFile(tmp, [
    { id: 'w-u', objective: 'Read', capability: 'docs:write' },
  ]);
  const cliEnv = { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome };
  const out = execFileSync(process.execPath, [
    path.resolve('bin/fgos.mjs'), 'workflow', 'start',
    '--units', file,
    '--timeout', '90m',
    '--account', 'acct-cli',
    '--foreground',
    '--dir', tmp,
  ], { cwd: tmp, env: cliEnv, encoding: 'utf8' });
  const state = JSON.parse(out).data;
  assert.equal(state.status, 'completed');
  assert.equal(state.timeoutMs, 5400000);
  assert.equal(state.account, 'acct-cli');

  // resume with --timeout or --account is refused
  assert.throws(() => execFileSync(process.execPath, [
    path.resolve('bin/fgos.mjs'), 'workflow', 'resume', state.workflowRunId,
    '--timeout', '2h',
    '--dir', tmp,
  ], { cwd: tmp, env: cliEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), /--timeout cannot change a resumed workflow run/);

  assert.throws(() => execFileSync(process.execPath, [
    path.resolve('bin/fgos.mjs'), 'workflow', 'resume', state.workflowRunId,
    '--account', 'acct-cli',
    '--dir', tmp,
  ], { cwd: tmp, env: cliEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), /--account cannot change a resumed workflow run/);
});
