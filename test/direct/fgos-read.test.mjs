import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { tmpCwdFast, moveToDurableDoingForTest } from '../cli/helpers/fgos-cli-harness.mjs';
import {
  addWork,
  addDecision,
  putInAwaiting,
  recordCall,
  moveWork,
  settleClaim,
  StoreError,
} from '../../src/state/store.mjs';
import {
  listUseCase,
  graphUseCase,
  staleUseCase,
} from '../../src/verbs/state/read.mjs';

const VALID_ASK_A = `## Context
Here is context about A with more than twenty characters of text.

## Why this matters
Here is why this matters for A with more than twenty characters.`;

const VALID_ASK_B = `## Context
Here is context about B with more than twenty characters of text.

## Why this matters
Here is why this matters for B with more than twenty characters.`;

function addTestWork(dir, id, extra = {}) {
  return addWork(dir, {
    id,
    title: extra.title ?? `Title ${id}`,
    kind: extra.kind ?? 'task',
    status: extra.status ?? 'todo',
    deps: extra.deps ?? [],
    risk: extra.risk ?? 'light',
    refs: extra.refs ?? [],
    verify: extra.verify ?? 'npm test',
    description: extra.description ?? 'fixture description',
    stage: extra.stage ?? 'executing',
    ...extra,
  });
}


// --- list open-only default + --all ---------------------------------------

test('list by default excludes a done item, but keeps a todo item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'open-item', { title: 'Open Item' });
  addTestWork(dir, 'finished-item', { title: 'Finished Item', status: 'done' });

  const result = listUseCase({ dir });
  assert.ok(result.work['open-item']);
  assert.equal(result.work['finished-item'], undefined);
});

test('list --all restores the done item alongside the open one', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'open-item', { title: 'Open Item' });
  addTestWork(dir, 'finished-item', { title: 'Finished Item', status: 'done' });

  const result = listUseCase({ dir }, { all: true });
  assert.ok(result.work['open-item']);
  assert.ok(result.work['finished-item']);
});

test('list by default excludes a wontfix item, but keeps a todo item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'open-item', { title: 'Open Item' });
  addTestWork(dir, 'closed-item', { title: 'Closed Item', status: 'wontfix' });

  const result = listUseCase({ dir });
  assert.ok(result.work['open-item']);
  assert.equal(result.work['closed-item'], undefined);
});

test('list --all restores the wontfix item alongside the open one', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'open-item', { title: 'Open Item' });
  addTestWork(dir, 'closed-item', { title: 'Closed Item', status: 'wontfix' });

  const result = listUseCase({ dir }, { all: true });
  assert.ok(result.work['open-item']);
  assert.ok(result.work['closed-item']);
});

test('list by default drops a child whose parent is visible, and badges the parent with childProgress', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'root-item', { title: 'Root Item' });
  addTestWork(dir, 'child-a', { title: 'Child A', status: 'done', parent: 'root-item' });
  addTestWork(dir, 'child-b', { title: 'Child B', status: 'doing', parent: 'root-item' });
  addTestWork(dir, 'child-c', { title: 'Child C', status: 'todo', parent: 'root-item' });

  const result = listUseCase({ dir });
  assert.equal(result.work['child-a'], undefined);
  assert.equal(result.work['child-b'], undefined);
  assert.equal(result.work['child-c'], undefined);
  assert.ok(result.work['root-item']);
  assert.deepEqual(result.work['root-item'].childProgress, { done: 1, total: 3 });
});

test('list by default falls back to showing a child as a top-level row when its parent is resolved and hidden', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'root-item', { title: 'Root Item', status: 'done' });
  addTestWork(dir, 'orphan-child', { title: 'Orphan Child', status: 'doing', parent: 'root-item' });

  const result = listUseCase({ dir });
  assert.equal(result.work['root-item'], undefined);
  assert.ok(result.work['orphan-child']);
  assert.equal(result.work['orphan-child'].childProgress, undefined);
});

test('list by default never hides an awaiting-human child, even when its parent is visible', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'root-item', { title: 'Root Item' });
  addTestWork(dir, 'parked-child', { title: 'Parked Child', status: 'awaiting-human', parent: 'root-item' });

  const result = listUseCase({ dir });
  assert.ok(result.work['parked-child']);
  assert.ok(result.work['root-item']);
  assert.deepEqual(result.work['root-item'].childProgress, { done: 0, total: 1 });
});

test('list --all is untouched by the child-view gate: no rows dropped, no childProgress added', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'root-item', { title: 'Root Item' });
  addTestWork(dir, 'child-a', { title: 'Child A', status: 'done', parent: 'root-item' });
  addTestWork(dir, 'child-b', { title: 'Child B', status: 'doing', parent: 'root-item' });

  const result = listUseCase({ dir }, { all: true });
  assert.ok(result.work['root-item']);
  assert.ok(result.work['child-a']);
  assert.ok(result.work['child-b']);
  assert.equal(result.work['root-item'].childProgress, undefined);
});

test('list exposes parkReason on a blocked item, and omits it on a doing item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'parked-item', { title: 'Parked Item', status: 'blocked' });
  addTestWork(dir, 'active-item', { title: 'Active Item', status: 'doing' });

  const result = listUseCase({ dir }, { all: true });
  assert.equal(result.work['parked-item'].parkReason, 'system-error');
  assert.equal(result.work['active-item'].parkReason, undefined);
});

test('list --id returns only that item, ignoring the open-only default and --all entirely', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'open-item', { title: 'Open Item' });
  addTestWork(dir, 'other-item', { title: 'Other Item' });

  const result = listUseCase({ dir }, { id: 'open-item' });
  assert.deepEqual(Object.keys(result.work), ['open-item']);
  assert.equal(result.work['open-item'].title, 'Open Item');
});

test('list --id on a done item returns it without needing --all', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'finished-item', { title: 'Finished Item', status: 'done' });

  const result = listUseCase({ dir }, { id: 'finished-item' });
  assert.equal(result.work['finished-item'].status, 'done');
});

test('list --id on an unknown id is rejected as validation (not-found)', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'open-item');

  assert.throws(
    () => listUseCase({ dir }, { id: 'no-such-item' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /not found/i.test(err.message),
  );
});

test('list --id with empty or non-string id is rejected as validation error', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  assert.throws(
    () => listUseCase({ dir }, { id: '' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /requires a non-empty work id/i.test(err.message),
  );
});

test('list --id scopes every id-keyed view section to just the requested item, excluding another item\'s data', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-a', { title: 'Item A' });
  addTestWork(dir, 'item-b', { title: 'Item B' });

  addDecision(dir, { id: 'item-a', text: 'decision about A', rationale: 'because A', relation: 'none' });
  addDecision(dir, { id: 'item-b', text: 'decision about B', rationale: 'because B', relation: 'none' });
  addDecision(dir, { text: 'global decision, no item', rationale: 'because global', relation: 'none' });

  putInAwaiting(dir, { id: 'item-a', ask: VALID_ASK_A });
  putInAwaiting(dir, { id: 'item-b', ask: VALID_ASK_B });

  recordCall(dir, { id: 'item-a', toRole: 'researcher', reason: 'consult', outcome: 'consult about A' });
  recordCall(dir, { id: 'item-b', toRole: 'researcher', reason: 'consult', outcome: 'consult about B' });

  const data = listUseCase({ dir }, { id: 'item-a' });

  assert.deepEqual(Object.keys(data.work), ['item-a']);
  assert.ok(Array.isArray(data.decisions));
  assert.ok(data.decisions.some((d) => d.text === 'decision about A'));
  assert.ok(!data.decisions.some((d) => d.text === 'decision about B'));
  assert.ok(!data.decisions.some((d) => d.text === 'global decision, no item'));

  assert.deepEqual(Object.keys(data.decisionsById ?? {}), ['item-a']);
  assert.deepEqual(Object.keys(data.gates ?? {}), ['item-a']);
  assert.equal(data.gates['item-a'].ask, VALID_ASK_A);
  assert.deepEqual(Object.keys(data.callThreads ?? {}), ['item-a']);
  assert.equal(data.callThreads['item-a'][0].outcome, 'consult about A');
});

test('list --id --fields returns only named fields and omits all history side-log keys', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-fields', { title: 'Item Fields' });
  addDecision(dir, { id: 'item-fields', text: 'decision text', rationale: 'rat', relation: 'none' });

  const flagged = listUseCase({ dir }, { id: 'item-fields', fields: 'stage,status,holder' });
  assert.deepEqual(Object.keys(flagged.work), ['item-fields']);
  assert.deepEqual(Object.keys(flagged.work['item-fields']).sort(), ['stage', 'status'].sort());
  const sideLogKeys = ['decisions', 'discovery', 'gates', 'settlements', 'outcomes', 'frictions', 'learnings', 'decisionsById', 'callThreads'];
  for (const key of sideLogKeys) {
    assert.equal(flagged[key], undefined, `side-log key "${key}" must be omitted when --fields is passed`);
  }
});

test('list --id without --fields is unchanged from full behavior', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-unflagged', { title: 'Item Unflagged' });
  addDecision(dir, { id: 'item-unflagged', text: 'dec text', rationale: 'rat', relation: 'none' });

  const data = listUseCase({ dir }, { id: 'item-unflagged' });
  assert.ok(data.work['item-unflagged']);
  assert.equal(data.work['item-unflagged'].title, 'Item Unflagged');
  assert.ok(Array.isArray(data.decisions));
  assert.ok(data.discovery);
  assert.ok(data.gates);
  assert.ok(data.settlements);
  assert.ok(data.outcomes);
  assert.ok(data.frictions);
  assert.ok(data.learnings);
  assert.ok(data.decisionsById);
  assert.ok(data.callThreads);
});

test('list --id --fields with an invalid field name is rejected as validation error', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-invalid');

  assert.throws(
    () => listUseCase({ dir }, { id: 'item-invalid', fields: 'stage,invalidField' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /unknown field "invalidField"/i.test(err.message),
  );
});

test('list --id --fields with empty field list is rejected as validation error', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-empty-fields');

  assert.throws(
    () => listUseCase({ dir }, { id: 'item-empty-fields', fields: '' }),
    (err) => err instanceof StoreError && err.category === 'validation' && /non-empty comma-separated list/i.test(err.message),
  );
});

test('list default keeps an awaiting-human item visible', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'parked-item', { title: 'Parked Item' });
  putInAwaiting(dir, { id: 'parked-item', ask: VALID_ASK_A });

  const result = listUseCase({ dir });
  assert.equal(result.work['parked-item'].status, 'awaiting-human');
});

test('list default computes awaitingContext when awaiting-human item has parent', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'parent-item', { title: 'Parent Item' });
  addTestWork(dir, 'parked-item', { title: 'Parked Item', parent: 'parent-item' });
  putInAwaiting(dir, { id: 'parked-item', ask: VALID_ASK_A });

  const result = listUseCase({ dir });
  assert.equal(result.work['parked-item'].status, 'awaiting-human');
  assert.ok(result.awaitingContext);
  assert.ok(result.awaitingContext['parked-item']);
  assert.equal(result.awaitingContext['parked-item'].parent.id, 'parent-item');
});

test('list default on a store with only done items returns an empty work map, not an error', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'finished-item', { title: 'Finished Item', status: 'done' });

  const result = listUseCase({ dir });
  assert.deepEqual(result.work, {});
});

test('list --limit paginates work into {items, nextCursor}, AND scopes every other view key to just the paged ids', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-a', { title: 'Item A' });
  addTestWork(dir, 'item-b', { title: 'Item B' });
  addDecision(dir, { id: 'item-a', text: 'decision about A', rationale: 'r', relation: 'none' });
  addDecision(dir, { id: 'item-b', text: 'decision about B', rationale: 'r', relation: 'none' });

  const page = listUseCase({ dir }, { limit: 1 });
  assert.equal(Object.keys(page.work.items).length, 1);
  assert.ok(page.work.nextCursor);
  const pagedId = Object.keys(page.work.items)[0];
  assert.equal(page.decisions.length, 1);
  assert.equal(page.decisions[0].id, pagedId);
});

test('list --all --limit combined: scopes side-logs to the paged ids too', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-a', { title: 'Item A', status: 'done' });
  addTestWork(dir, 'item-b', { title: 'Item B', status: 'todo' });
  addDecision(dir, { id: 'item-a', text: 'decision about A', rationale: 'r', relation: 'none' });
  addDecision(dir, { id: 'item-b', text: 'decision about B', rationale: 'r', relation: 'none' });

  const page = listUseCase({ dir }, { all: true, limit: 1 });
  assert.equal(Object.keys(page.work.items).length, 1);
  const pagedId = Object.keys(page.work.items)[0];
  assert.equal(page.decisions.length, 1);
  assert.equal(page.decisions[0].id, pagedId);
});

test('list default (no flags at all) scopes side-logs to only the open (non-done) ids', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-open', { title: 'Item Open', status: 'todo' });
  addTestWork(dir, 'item-done', { title: 'Item Done', status: 'done' });
  addDecision(dir, { id: 'item-open', text: 'decision open', rationale: 'r', relation: 'none' });
  addDecision(dir, { id: 'item-done', text: 'decision done', rationale: 'r', relation: 'none' });

  const result = listUseCase({ dir });
  assert.ok(result.work['item-open']);
  assert.equal(result.work['item-done'], undefined);
  assert.ok(result.decisions.some((d) => d.id === 'item-open'));
  assert.ok(!result.decisions.some((d) => d.id === 'item-done'));
});

test('list --all with NO pagination flags stays byte-identical and unscoped', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'item-open', { title: 'Item Open', status: 'todo' });
  addTestWork(dir, 'item-done', { title: 'Item Done', status: 'done' });
  addDecision(dir, { id: 'item-open', text: 'decision open', rationale: 'r', relation: 'none' });
  addDecision(dir, { id: 'item-done', text: 'decision done', rationale: 'r', relation: 'none' });

  const result = listUseCase({ dir }, { all: true });
  assert.ok(result.work['item-open']);
  assert.ok(result.work['item-done']);
  assert.ok(result.decisions.some((d) => d.id === 'item-open'));
  assert.ok(result.decisions.some((d) => d.id === 'item-done'));
});

// --- graph use case -------------------------------------------------------

test('graph on an empty store reports zero components', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  const data = graphUseCase({ dir });
  assert.equal(data.componentCount, 0);
  assert.deepEqual(data.components, []);
});

test('graph reports connected components, criticalPath, and topological structure', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'a');
  addTestWork(dir, 'b', { deps: ['a'], stage: 'discovery' });
  addTestWork(dir, 'c');

  const data = graphUseCase({ dir });
  assert.equal(data.componentCount, 2);
  assert.deepEqual(data.components.map((c) => c.items), [['a', 'b'], ['c']]);
  assert.deepEqual(data.criticalPath, { depth: 2, path: ['b', 'a'] });
  assert.deepEqual(data.staleBlocked, [{ id: 'b', status: 'todo', blockedBy: ['a'] }]);
  assert.deepEqual(data.topUnblock[0], { id: 'a', unblocks: 1, newlyUnblocks: 2 });
  assert.deepEqual(data.stageByItem, { a: 'executing', b: 'discovery', c: 'executing' });
});

test('graph use case --what-if <id>: reports what completing that item unblocks', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'a');
  addTestWork(dir, 'b', { deps: ['a'], stage: 'discovery' });

  const data = graphUseCase({ dir }, { whatIfId: 'a' });
  assert.deepEqual(data, {
    id: 'a',
    exists: true,
    unblocksTransitive: 1,
    newlyReady: ['b'],
    stageByItem: { a: 'executing', b: 'discovery' },
  });
});

test('graph use case --what-if on an unknown id: exists false, zero impact', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  assert.deepEqual(graphUseCase({ dir }, { whatIfId: 'ghost' }), {
    id: 'ghost',
    exists: false,
    unblocksTransitive: 0,
    newlyReady: [],
  });
});

// --- stale use case -------------------------------------------------------

test('stale use case on a store with nothing in doing: empty advisory', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'a');
  const data = staleUseCase({ dir, repoRoot: cwd, cleanupTtlDays: 7 });
  assert.deepEqual(data.stale, []);
});

test('stale use case: a freshly-claimed doing item is NOT stale', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'a');
  moveToDurableDoingForTest(cwd, 'a');

  const data = staleUseCase({ dir, repoRoot: cwd, cleanupTtlDays: 7 });
  assert.deepEqual(data.stale, []);
  assert.equal(data.thresholds.agentMs, 15 * 60 * 1000);
  assert.equal(data.thresholds.humanMs, 24 * 60 * 60 * 1000);
});

test('stale use case: postDelivery is additive sibling field', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'a');
  moveToDurableDoingForTest(cwd, 'a');

  const data = staleUseCase({ dir, repoRoot: cwd, cleanupTtlDays: 7 });
  assert.deepEqual(data.stale, []);
  assert.deepEqual(data.postDelivery.stale, []);
  assert.ok(Number.isFinite(data.postDelivery.thresholds.deliveredMs));
});

test('stale use case: a just-delivered item is NOT flagged in postDelivery', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'just-delivered');
  moveToDurableDoingForTest(cwd, 'just-delivered');
  moveWork(dir, { id: 'just-delivered', to: 'delivered' });

  const data = staleUseCase({ dir, repoRoot: cwd, cleanupTtlDays: 7 });
  assert.deepEqual(data.postDelivery.stale, []);
});
