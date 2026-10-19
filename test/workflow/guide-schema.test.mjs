// test/workflow/guide-schema.test.mjs — the one guide model: playbook step form, explicit guide form, load errors

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { validateWorkflow, WorkflowDefinitionError } from '../../src/workflow/definition.mjs';
import { GUARD_PRIMITIVES, PLATFORM_GUARDS } from '../../src/workflow/guide-schema.mjs';
import { discoverWorkflows, loadWorkflow } from '../../src/workflow/loader.mjs';
import { translateUnitsToWorkflow } from '../../src/workflow/units-source.mjs';
import { readWorkflowEvents, startWorkflow } from '../../src/workflow/index.mjs';
import { domainSteps, getDomain } from '../../src/state/domain-registry.mjs';
import { compileDomain } from '../../scripts/build-domain-registry.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const ROOT = path.resolve('.');
const made = [];
after(() => {
  for (const dir of made) fs.rmSync(dir, { recursive: true, force: true });
});

const guideOf = (raw) => validateWorkflow(raw).guide;
const stepWorkflow = (extra = {}) => ({
  id: 'guide-test',
  steps: [{ id: 'a' }, { id: 'b', dependsOn: ['a'], gate: { kind: 'human', question: 'Go on?' } }],
  ...extra,
});
const refuses = (raw, pattern) => assert.throws(() => validateWorkflow(raw), (err) => {
  assert.ok(err instanceof WorkflowDefinitionError, String(err));
  assert.match(err.message, pattern);
  return true;
});

const REGISTERED = [...discoverWorkflows({ packageRoot: ROOT }).values()];

test('every registered workflow carries a guide model', () => {
  assert.equal(REGISTERED.length, 9);
  for (const wf of REGISTERED) {
    assert.ok(wf.guide, wf.id);
    assert.equal(wf.guide.id, wf.id);
    assert.ok(wf.guide.frameDefaults || wf.id === 'coding/feature', `${wf.id} states its frame defaults`);
  }
});

test('a playbook step form becomes one activity per step in step order, dependsOn as entry milestones', () => {
  for (const wf of REGISTERED.filter((w) => w.id !== 'coding/feature')) {
    const guide = wf.guide;
    assert.equal(guide.kind, 'playbook', wf.id);
    assert.deepEqual(guide.activities.map((a) => a.id), wf.steps.map((s) => s.id), wf.id);
    wf.steps.forEach((step, i) => {
      const activity = guide.activities[i];
      assert.deepEqual(activity.entry, step.dependsOn.map((dep) => `${dep}.settled`), `${wf.id}/${step.id}`);
      assert.ok(activity.produces.includes(`${step.id}.settled`), `${wf.id}/${step.id}`);
      assert.deepEqual(activity.unit?.units ?? [], step.units.map((u) => u.id), `${wf.id}/${step.id}`);
      assert.equal(activity.effects === 'writes', step.units.some((u) => u.template.writes.length > 0), `${wf.id}/${step.id}`);
    });
    for (const decision of guide.decisions) assert.equal(decision.listedRoutesOnly, true, `${wf.id} decision at ${decision.at}`);
    const gated = wf.steps.filter((s) => s.gate).map((s) => `${s.id}.settled`);
    assert.deepEqual(guide.decisions.filter((d) => d.gate).map((d) => d.at), gated, wf.id);
  }
});

test('the architecture advisory chain keeps its single-parent entry milestones and blind-seat MUST', () => {
  const guide = loadWorkflow('architecture-advisory').guide;
  assert.deepEqual(guide.activities.map((a) => [a.id, a.entry]), [
    ['framing', []],
    ['shaping', ['framing.settled']],
    ['critique', ['shaping.settled']],
    ['synthesis', ['critique.settled']],
    ['explanation', ['synthesis.settled']],
    ['close', ['explanation.settled']],
  ]);
  assert.deepEqual(guide.must.map((m) => [m.guard, m.subject]), [['independence-blind', 'shaping.settled']]);
  assert.deepEqual(guide.closure, ['close.settled']);
});

test('content-publish states its guide head: milestones, consent bound to the approved copy, an unenforced channel', () => {
  const guide = loadWorkflow('marketing/content-publish').guide;
  assert.deepEqual(guide.milestones.filter((m) => m.settledBy).map((m) => m.id), ['brief-ready', 'draft-reviewed', 'copy-approved', 'publish-recorded']);
  assert.deepEqual(guide.activities.find((a) => a.id === 'approval').produces, ['approval.settled', 'copy-approved']);
  assert.deepEqual(guide.must.map((m) => [m.guard, m.subject ?? null]), [['human-consent', 'copy-approved'], ['write-scope-isolation', null]]);
  assert.equal(guide.unenforced[0].id, 'published-on-the-channel');
  assert.equal(guide.activities.find((a) => a.id === 'publish').effects, 'writes');
});

test('building a built definition again yields the same guide', () => {
  for (const wf of REGISTERED) assert.deepEqual(validateWorkflow(wf).guide, wf.guide, wf.id);
});

test('a workflow with no head and a units file still load with a derived playbook guide', () => {
  const plain = guideOf({ id: 'plain', steps: [{ id: 'only' }] });
  assert.equal(plain.kind, 'playbook');
  assert.equal(plain.frameDefaults, null);
  assert.deepEqual(plain.must, []);

  const dir = makeFixtureDir('fgos-guide-units-');
  made.push(dir);
  const file = path.join(dir, 'units.json');
  fs.writeFileSync(file, JSON.stringify([
    { id: 'one', objective: 'Read the code', capability: 'docs:write' },
    { id: 'two', objective: 'Summarise it', capability: 'docs:write', dependsOn: ['one'] },
  ]));
  const wf = translateUnitsToWorkflow(file);
  assert.deepEqual(wf.guide.activities.map((a) => [a.id, a.entry]), [['one', []], ['two', ['one.settled']]]);
});

test('an explicit guide with its own activities leaves the steps to the Work lifecycle', () => {
  const guide = guideOf({
    id: 'explicit',
    kind: 'guide',
    steps: [{ id: 'discovery', phase: 'discover' }],
    milestones: [{ id: 'received' }, { id: 'done', subject: 'the artifact', evidence: 'receipt', acceptedBy: 'verify' }],
    activities: [{ id: 'work', entry: ['received'], produces: ['done'], effects: 'writes', operation: 'discovery/judge', unit: { pattern: 'reviewed' } }],
    decisions: [
      { at: 'received', should: 'work', reason: 'it is the cheapest route', mayInstead: ['ask'] },
      { at: 'done', listedRoutesOnly: true },
    ],
    must: [{ id: 'receipt', guard: 'verify-receipt', subject: 'done', reason: 'a claim is not a receipt' }],
    unenforced: [{ id: 'taste', becomes: 'a reviewer verdict' }],
    frameDefaults: { dispatches: 'set-at-approval', mutatingDispatches: 1, fallbackPerSeat: 2, deviationsBeforeAsk: 2, rigorFloor: 'standard' },
    closure: ['done'],
  });
  assert.equal(guide.kind, 'guide');
  assert.deepEqual(guide.activities.map((a) => a.id), ['work']);
  assert.deepEqual(guide.milestones.map((m) => m.id), ['received', 'done']);
  assert.deepEqual(guide.decisions.map((d) => [d.at, d.listedRoutesOnly]), [['received', false], ['done', true]]);
  assert.deepEqual(guide.decisions[0].should, ['work']);
});

test('the coding workflow has both parts: the four lifecycle steps and a guide, compiled and loaded', () => {
  const wf = loadWorkflow('coding/feature');
  assert.equal(wf.guide.kind, 'guide');
  assert.deepEqual(wf.steps.map((s) => s.id), ['discovery', 'exploring', 'planning', 'executing']);
  assert.deepEqual(domainSteps(getDomain('coding')), ['discovery', 'exploring', 'planning', 'executing']);
  const compiled = compileDomain(path.join(ROOT, 'domains', 'coding'));
  assert.ok(compiled.workflows.feature.activities.length > 0, 'the compiled file carries the guide part');

  const operations = new Set(wf.steps.flatMap((s) => s.operations.map((o) => `${s.id}/${o.id}`)));
  const named = wf.guide.activities.map((a) => a.operation).filter((op) => op && op !== 'none');
  assert.ok(named.length > 0);
  for (const op of named) assert.ok(operations.has(op), `activity names operation ${op}, which a step offers`);
  for (const must of wf.guide.must) {
    assert.ok(must.guard, must.id);
    assert.ok(GUARD_PRIMITIVES.includes(must.guard) || PLATFORM_GUARDS.includes(must.guard.replace(/^platform:/, '')), must.id);
  }
});

test('a MUST naming a guard outside the catalog is refused and pointed at unenforced', () => {
  refuses(stepWorkflow({ must: [{ id: 'taste', guard: 'tasteful-architecture', reason: 'beauty' }] }), /must\[0\] \("taste"\) names guard "tasteful-architecture".*"unenforced"/s);
  refuses(stepWorkflow({ must: [{ id: 'no-guard', reason: 'beauty' }] }), /names no guard.*no guard, no MUST/s);
  refuses(stepWorkflow({ must: [{ id: 'x', guard: 'platform:vibes', reason: 'r' }] }), /platform:vibes/);
  assert.ok(guideOf(stepWorkflow({ must: [{ id: 'g2', guard: 'platform:g2', reason: 'the platform already checks it' }] })).must[0].guard === 'platform:g2');
});

test('a MUST needs a reason and, for a milestone check, an existing milestone', () => {
  refuses(stepWorkflow({ must: [{ id: 'x', guard: 'human-consent', subject: 'a.settled' }] }), /needs a "reason"/);
  refuses(stepWorkflow({ must: [{ id: 'x', guard: 'human-consent', reason: 'r' }] }), /needs "subject"/);
  refuses(stepWorkflow({ must: [{ id: 'x', guard: 'human-consent', subject: 'nowhere', reason: 'r' }] }), /unknown milestone "nowhere"/);
});

test('expression fields are refused by name anywhere in the guide', () => {
  for (const key of ['when', 'if', 'expr', 'condition']) {
    refuses(stepWorkflow({ must: [{ id: 'x', guard: 'frame-allowance', reason: 'r', [key]: 'a == b' }] }), new RegExp(`has "${key}": a guide holds no expressions`));
  }
  refuses(stepWorkflow({ decisions: [{ at: 'a.settled', when: 'tests green' }] }), /has "when"/);
});

test('listedRoutesOnly belongs to a decision point only', () => {
  refuses(stepWorkflow({ milestones: [{ id: 'm', listedRoutesOnly: true }] }), /milestones\[0\] has "listedRoutesOnly", which only a decision point may carry/);
  refuses(stepWorkflow({ decisions: [{ at: 'a.settled', should: [{ route: 'x', listedRoutesOnly: true }], reason: 'r' }] }), /listedRoutesOnly/);
  refuses(stepWorkflow({ must: [{ id: 'x', guard: 'frame-allowance', reason: 'r', listedRoutesOnly: true }] }), /must\[0\] has "listedRoutesOnly"/);
  assert.equal(guideOf(stepWorkflow({ decisions: [{ at: 'a.settled', listedRoutesOnly: false }] })).decisions.at(-1).listedRoutesOnly, false);
});

test('a frame default sets a rigor floor, never a ceiling, and every count is a count', () => {
  const frame = { dispatches: 2, mutatingDispatches: 0, fallbackPerSeat: 2, deviationsBeforeAsk: 1, rigorFloor: 'standard' };
  assert.deepEqual(guideOf(stepWorkflow({ frameDefaults: frame })).frameDefaults, frame);
  refuses(stepWorkflow({ frameDefaults: { ...frame, rigorCeiling: 'high' } }), /never a ceiling/);
  refuses(stepWorkflow({ frameDefaults: { ...frame, dispatches: -1 } }), /dispatches must be a non-negative integer/);
  refuses(stepWorkflow({ frameDefaults: { ...frame, rigorFloor: 'extreme' } }), /rigorFloor must be one of/);
  refuses(stepWorkflow({ frameDefaults: { dispatches: 1 } }), /needs "mutatingDispatches"/);
});

test('activities, decisions and the closure may only name milestones that exist', () => {
  const explicit = (activity) => ({ id: 'bad', kind: 'guide', milestones: [{ id: 'm' }], activities: [{ effects: 'none', ...activity }], steps: [{ id: 's' }] });
  refuses(explicit({ id: 'x', entry: ['ghost'], produces: ['m'] }), /entry names unknown milestone "ghost"/);
  refuses(explicit({ id: 'x', entry: ['m'], produces: ['ghost'] }), /produces unknown milestone "ghost"/);
  refuses({ id: 'bad', kind: 'guide', steps: [{ id: 's' }], milestones: [{ id: 'm' }], activities: [{ id: 'x', entry: ['m'] }] }, /effects must be one of/);
  refuses(stepWorkflow({ decisions: [{ at: 'ghost' }] }), /is at unknown milestone "ghost"/);
  refuses(stepWorkflow({ decisions: [{ at: 'a.settled', should: 'x' }] }), /has a SHOULD route and needs a "reason"/);
  refuses(stepWorkflow({ closure: ['ghost'] }), /closure names unknown milestone "ghost"/);
  refuses(stepWorkflow({ kind: 'script' }), /kind must be one of \[playbook, guide\]/);
});

test('a run records the normalised guide in its start snapshot', async () => {
  const repo = makeFixtureDir('fgos-guide-snapshot-');
  made.push(repo);
  execFileSync('git', ['init', '-b', 'main'], { cwd: repo, stdio: 'ignore' });
  execFileSync('git', ['-c', 'user.name=Guide Test', '-c', 'user.email=guide@test.local', 'commit', '--allow-empty', '-m', 'fixture'], { cwd: repo, stdio: 'ignore' });
  const workflow = validateWorkflow({
    id: 'snapshot-test',
    steps: [{ id: 'only' }],
    must: [{ id: 'blind', guard: 'independence-blind', subject: 'only.settled', reason: 'independent seats' }],
  });
  const state = await startWorkflow({ workflow, repoRoot: repo, cwd: repo });
  assert.equal(state.status, 'completed');
  const [start] = readWorkflowEvents({ repoRoot: repo, workflowRunId: state.workflowRunId });
  assert.equal(start.type, 'workflow.start');
  assert.deepEqual(start.payload.workflow.guide, JSON.parse(JSON.stringify(workflow.guide)));
  assert.deepEqual(start.payload.workflow.guide.must.map((m) => m.guard), ['independence-blind']);
});
