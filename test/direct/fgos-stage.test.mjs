import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { tmpCwdFast, moveToDurableDoingForTest, eventLines } from '../cli/helpers/fgos-cli-harness.mjs';
import {
  addWork,
  listWork,
  editWork,
  StoreError,
} from '../../src/state/store.mjs';
import {
  discoverUseCase,
  planUseCase,
} from '../../src/verbs/state/stage.mjs';

function addTestWork(dir, id, extra = {}) {
  const defaultVerify = extra.stage === 'discovery'
    ? 'chưa xác định — fixture verify'
    : 'npm test';
  return addWork(dir, {
    id,
    title: extra.title ?? `Title ${id}`,
    kind: extra.kind ?? 'task',
    status: extra.status ?? 'todo',
    deps: extra.deps ?? [],
    risk: extra.risk ?? 'light',
    refs: extra.refs ?? [],
    verify: extra.verify ?? defaultVerify,
    description: extra.description ?? 'fixture description',
    stage: extra.stage ?? 'discovery',
    ...extra,
  });
}

// ---------------------------------------------------------------------------
// discoverUseCase
// ---------------------------------------------------------------------------

test('discover on a clear verdict moves the submitted item to stage planning with the caller-supplied verify', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-1', { stage: 'discovery' });

  const res = discoverUseCase(
    { dir },
    { id: 'disc-1', callerVerdict: { clear: true, verify: 'npm test -- proven' } },
  );
  assert.equal(res.outcome, 'clear');

  const item = listWork(dir).work['disc-1'];
  assert.equal(item.stage, 'planning');
  assert.equal(item.verify, 'npm test -- proven');
});

test('discover on an unclear verdict parks the item in awaiting-human with the question, and advances it to exploring', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-2', { stage: 'discovery' });

  const question = '## Context\n\nBackground needed to understand this question.\n\n## Why this matters\n\nThis directly affects the outcome: Which service?';
  const res = discoverUseCase(
    { dir },
    { id: 'disc-2', callerVerdict: { clear: false, question } },
  );
  assert.equal(res.outcome, 'unclear');

  const view = listWork(dir);
  assert.equal(view.work['disc-2'].status, 'awaiting-human');
  assert.equal(view.work['disc-2'].stage, 'exploring');
  assert.equal(view.gates['disc-2'].ask, question);
});

test('discover on a planning-stage item errors with StoreError("validation") suggesting fgos plan', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-3', { stage: 'planning' });

  assert.throws(
    () => discoverUseCase({ dir }, { id: 'disc-3', callerVerdict: { clear: true, verify: 'npm test' } }),
    (err) => err instanceof StoreError && err.category === 'validation' && /fgos plan/.test(err.message),
  );
  assert.equal(listWork(dir).work['disc-3'].stage, 'planning');
});

test('discover on an invalid stage (e.g. executing) errors with StoreError("validation")', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-4', { stage: 'executing' });

  assert.throws(
    () => discoverUseCase({ dir }, { id: 'disc-4', callerVerdict: { clear: true, verify: 'npm test' } }),
    (err) => err instanceof StoreError && err.category === 'validation' && /is not registered/.test(err.message),
  );
});

test('discover on a nonexistent item errors with StoreError("validation")', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-exist', { stage: 'discovery' });

  assert.throws(
    () => discoverUseCase({ dir }, { id: 'ghost-item', callerVerdict: { clear: true, verify: 'npm test' } }),
    (err) => err instanceof StoreError && err.category === 'validation' && /not registered|not found/.test(err.message),
  );
});

test('discover with an out-of-vocabulary kind is rejected as validation before item moves', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-5', { stage: 'discovery' });

  assert.throws(
    () => discoverUseCase({ dir }, { id: 'disc-5', callerVerdict: { clear: true, verify: 'npm test', kind: 'bogus' } }),
    (err) => err.category === 'validation' && /work\.kind must be one of/.test(err.message),
  );
  assert.equal(listWork(dir).work['disc-5'].stage, 'discovery');
});

test('discover with an out-of-vocabulary tier is rejected as validation before item moves', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-6', { stage: 'discovery' });

  assert.throws(
    () => discoverUseCase({ dir }, { id: 'disc-6', callerVerdict: { clear: true, verify: 'npm test', tier: 'enormous' } }),
    (err) => err.category === 'validation' && /work\.tier must be one of/.test(err.message),
  );
  assert.equal(listWork(dir).work['disc-6'].stage, 'discovery');
});

test('discover with an out-of-vocabulary risk is rejected as validation before item moves', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-7', { stage: 'discovery' });

  assert.throws(
    () => discoverUseCase({ dir }, { id: 'disc-7', callerVerdict: { clear: true, verify: 'npm test', risk: 'critical' } }),
    (err) => err.category === 'validation' && /work\.risk must be one of/.test(err.message),
  );
  assert.equal(listWork(dir).work['disc-7'].stage, 'discovery');
});

test('discover --verdict clear with tier/kind/risk applies classification to the item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-8', { stage: 'discovery' });

  const res = discoverUseCase(
    { dir },
    {
      id: 'disc-8',
      callerVerdict: {
        clear: true,
        verify: 'npm test -- classified',
        tier: 'heavy',
        kind: 'bug',
        risk: 'heavy',
      },
    },
  );
  assert.equal(res.outcome, 'clear');

  const item = listWork(dir).work['disc-8'];
  assert.equal(item.tier, 'heavy');
  assert.equal(item.kind, 'bug');
  assert.equal(item.risk, 'heavy');
  assert.equal(item.stage, 'planning');
});

test('discover applies only classification fields actually passed, leaving the rest untouched', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-9', { stage: 'discovery', tier: 'standard', risk: 'standard', kind: 'task' });

  const res = discoverUseCase(
    { dir },
    {
      id: 'disc-9',
      callerVerdict: {
        clear: true,
        verify: 'npm test -- partial',
        kind: 'docs',
      },
    },
  );
  assert.equal(res.outcome, 'clear');

  const item = listWork(dir).work['disc-9'];
  assert.equal(item.kind, 'docs');
  assert.equal(item.tier, 'standard', 'an unpassed field is never rewritten');
  assert.equal(item.risk, 'standard', 'an unpassed field is never rewritten');
});

test('discover --verdict unclear never applies classification', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-10', { stage: 'discovery', tier: 'standard', risk: 'standard', kind: 'task' });

  const question = '## Context\n\nBackground needed to understand question.\n\n## Why this matters\n\nDirectly affects outcome: Which provider?';
  const res = discoverUseCase(
    { dir },
    {
      id: 'disc-10',
      callerVerdict: {
        clear: false,
        question,
        tier: 'heavy',
        kind: 'bug',
        risk: 'heavy',
      },
    },
  );
  assert.equal(res.outcome, 'unclear');

  const item = listWork(dir).work['disc-10'];
  assert.equal(item.tier, 'standard');
  assert.equal(item.kind, 'task');
  assert.equal(item.risk, 'standard');
  assert.equal(item.status, 'awaiting-human');
});

test('discover (sync verb) on a clear verdict stamps role "session" on work.stage event and folds into a clarify-pass settlement', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-11', { stage: 'discovery' });

  discoverUseCase(
    { dir },
    { id: 'disc-11', callerVerdict: { clear: true, verify: 'npm test -- proven' } },
  );

  const lines = eventLines(cwd);
  const stageEvent = lines.map((l) => JSON.parse(l)).find((e) => e.type === 'work.stage' && e.payload.id === 'disc-11');
  assert.equal(stageEvent.payload.role, 'session');

  const view = listWork(dir);
  assert.equal(view.settlements['disc-11'].length, 1);
  assert.equal(view.settlements['disc-11'][0].kind, 'clarify-pass');
  assert.equal(view.settlements['disc-11'][0].role, 'session');
});

test('discover without callerVerdict throws StoreError("validation") when no committed context exists', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'disc-12', { stage: 'discovery' });

  assert.throws(
    () => discoverUseCase({ dir }, { id: 'disc-12' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /no committed CONTEXT\.md and no --verdict was given/.test(err.message),
  );
});

// ---------------------------------------------------------------------------
// planUseCase
// ---------------------------------------------------------------------------

test('plan on an item sitting at stage planning passes through to executing', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-1', { stage: 'planning' });

  const res = await planUseCase(
    { dir },
    { id: 'plan-1', direct: true, callerVerdict: { verdict: 'pass-through', reason: 'single cohesive change' } },
  );
  assert.equal(res.outcome, 'pass-through');
  assert.equal(listWork(dir).work['plan-1'].stage, 'executing');
});

test('plan on a discovery-stage item errors with StoreError("validation") suggesting fgos discover', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-2', { stage: 'discovery' });

  await assert.rejects(
    async () => planUseCase({ dir }, { id: 'plan-2', direct: true }),
    (err) => err instanceof StoreError && err.category === 'validation' && /fgos discover/.test(err.message),
  );
  assert.equal(listWork(dir).work['plan-2'].stage, 'discovery');
});

test('plan on an invalid stage (e.g. executing) errors with StoreError("validation")', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-3', { stage: 'executing' });

  await assert.rejects(
    async () => planUseCase({ dir }, { id: 'plan-3', direct: true }),
    (err) => err instanceof StoreError && err.category === 'validation' && /is not registered/.test(err.message),
  );
});

test('plan on a nonexistent item errors with StoreError("validation")', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-exist', { stage: 'planning' });

  await assert.rejects(
    async () => planUseCase({ dir }, { id: 'ghost-plan', direct: true }),
    (err) => err instanceof StoreError && err.category === 'validation' && /not registered|not found/.test(err.message),
  );
});

test('plan --verdict need-human --reason parks in awaiting-human with that exact reason', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-4', { stage: 'planning' });

  const res = await planUseCase(
    { dir },
    { id: 'plan-4', direct: true, callerVerdict: { verdict: 'need-human', reason: 'Which auth provider?' } },
  );
  assert.equal(res.outcome, 'need-human');

  const view = listWork(dir);
  assert.equal(view.work['plan-4'].status, 'awaiting-human');
  assert.match(view.gates['plan-4'].ask, /Which auth provider\?/);
});

test('plan --verdict decompose with invalid children returns outcome invalid and leaves item untouched', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-5', { stage: 'planning' });

  const res = await planUseCase(
    { dir },
    {
      id: 'plan-5',
      direct: true,
      callerVerdict: {
        verdict: 'decompose',
        reason: 'split into parts',
        children: [{ title: 'child missing verify' }],
      },
    },
  );
  assert.equal(res.outcome, 'invalid');
  assert.equal(listWork(dir).work['plan-5'].stage, 'planning', 'invalid verdict leaves item untouched');
});

test('plan --verdict decompose with no reason returns outcome invalid and leaves item untouched', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-6', { stage: 'planning' });

  const res = await planUseCase(
    { dir },
    {
      id: 'plan-6',
      direct: true,
      callerVerdict: {
        verdict: 'decompose',
        children: [{ title: 'Child 1', verify: 'npm test' }],
      },
    },
  );
  assert.equal(res.outcome, 'invalid');
  assert.equal(listWork(dir).work['plan-6'].stage, 'planning');
});

test('plan --verdict decompose with valid children writes real children with parent pointer and advances parent', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-7', { stage: 'planning' });

  const children = [
    { title: 'Build parser', verify: 'npm test -- parser', action: 'implement the parser' },
    { title: 'Build renderer', verify: 'npm test -- renderer', action: 'implement the renderer' },
  ];
  const res = await planUseCase(
    { dir },
    {
      id: 'plan-7',
      direct: true,
      callerVerdict: {
        verdict: 'decompose',
        reason: 'two independent surfaces',
        children,
      },
    },
  );
  assert.equal(res.outcome, 'decompose');
  assert.deepEqual(res.childIds, ['plan-7-1', 'plan-7-2']);

  const view = listWork(dir);
  assert.equal(view.work['plan-7'].stage, 'executing');
  assert.equal(view.work['plan-7-1'].title, 'Build parser');
  assert.equal(view.work['plan-7-1'].parent, 'plan-7');
  assert.equal(view.work['plan-7-2'].title, 'Build renderer');
  assert.equal(view.work['plan-7-2'].parent, 'plan-7');
});

test('plan with docsRef and plan.md present directly processes caller verdict without running validate-plan', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-8', { stage: 'planning' });

  const docsRef = 'docs/history/plan-8';
  editWork(dir, { id: 'plan-8', patch: { docsRef } });
  const docsDir = path.join(cwd, docsRef);
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Feature Plan\n\n## Subtasks\n- Child 1\n- Child 2\n');

  const children = [
    { title: 'Child 1', verify: 'npm test -- c1', action: 'subtask 1' },
    { title: 'Child 2', verify: 'npm test -- c2', action: 'subtask 2' },
  ];
  const res = await planUseCase(
    { dir },
    {
      id: 'plan-8',
      direct: true,
      callerVerdict: {
        verdict: 'decompose',
        reason: 'two subtasks',
        children,
      },
    },
  );
  assert.equal(res.outcome, 'decompose');
  assert.equal(res.childIds.length, 2);
  assert.equal(listWork(dir).work['plan-8'].stage, 'executing');
});

test('plan --verdict pass-through preserves doing status when crossing boundary', async () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'plan-9', { stage: 'planning' });
  moveToDurableDoingForTest(cwd, 'plan-9');

  assert.equal(listWork(dir).work['plan-9'].status, 'doing');

  const res = await planUseCase(
    { dir },
    {
      id: 'plan-9',
      direct: true,
      callerVerdict: { verdict: 'pass-through', reason: 'ready for execution' },
    },
  );
  assert.equal(res.outcome, 'pass-through');
  assert.equal(listWork(dir).work['plan-9'].stage, 'executing');
  // tsk-40m D5: releaseClaimOnExecuting retired, planning->executing edge leaves status doing
  assert.equal(listWork(dir).work['plan-9'].status, 'doing');
});
