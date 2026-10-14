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

  const record = unitRecordOf(tmp, state.steps.look.units.look.unitRunId);
  assert.deepEqual(record.unit.prefer, ['test-node']);
  assert.equal(record.unit.persona, 'code-reviewer');
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
  await assert.rejects(() => startWorkflow({ unitsPath: file, ...opts(tmp) }), /w-c.*w-a.*w-b.*merge these units into one or add an integrate step/s);
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

test('out-of-scope writes accepted as findings do not reach the target through a later writer on that branch', async () => {
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
  // w-b stands on w-a's branch, so it carries the stray file too and is not integrated.
  assert.deepEqual(state.steps.b.units['w-b'].outOfScope, ['stray.txt']);
  assert.equal(state.steps.b.units['w-b'].outcome, 'findings');
  assert.equal(fs.existsSync(path.join(tmp, 'stray.txt')), false, 'the stray file never reached the trunk');
  assert.equal(fs.existsSync(path.join(tmp, 'b.txt')), false);
});

test('a units file refuses a unit id that cannot name a branch, and --seats with a units file', async () => {
  const tmp = setupRepo();
  await assert.rejects(
    () => startWorkflow({ unitsPath: unitsFile(tmp, [{ id: 'fix login', objective: 'x', capability: 'docs:write' }]), ...opts(tmp) }),
    /unit id "fix login"/,
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
