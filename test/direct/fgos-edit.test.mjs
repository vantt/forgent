import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { tmpCwdFast } from '../cli/helpers/fgos-cli-harness.mjs';
import { addWork, listWork, editWork, StoreError } from '../../src/state/store.mjs';
import { WorkValidationError } from '../../src/state/work.mjs';
import {
  editUseCase,
  generateVerifyFromChildren,
  generateVerifyFromTargets,
  parseEditFlags,
} from '../../src/verbs/state/edit.mjs';

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

function eventLines(dir) {
  const lines = [];
  const baseline = path.join(dir, 'events.jsonl');
  if (fs.existsSync(baseline)) {
    lines.push(...fs.readFileSync(baseline, 'utf8').split('\n').filter(Boolean));
  }
  const eventsDir = path.join(dir, 'events');
  if (fs.existsSync(eventsDir)) {
    for (const name of fs.readdirSync(eventsDir).filter((n) => n.endsWith('.jsonl'))) {
      lines.push(...fs.readFileSync(path.join(eventsDir, name), 'utf8').split('\n').filter(Boolean));
    }
  }
  return lines;
}

test('edit use case changes only the targeted field, every other field unchanged', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-risk', { risk: 'light' });
  const before = eventLines(dir).length;
  const result = editUseCase({ dir }, { id: 'edit-risk', patch: { risk: 'heavy' } });
  assert.deepEqual(result.fields, ['risk']);
  assert.equal(eventLines(dir).length, before + 1);
  const item = listWork(dir).work['edit-risk'];
  assert.equal(item.risk, 'heavy');
  assert.equal(item.title, 'Title edit-risk');
  assert.equal(item.kind, 'task');
  assert.equal(item.status, 'todo');
});

test('edit on an unknown id is rejected as validation error, no event written', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  const before = eventLines(dir).length;
  assert.throws(
    () => editUseCase({ dir }, { id: 'never-added', patch: { risk: 'heavy' } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /not found/i.test(err.message),
  );
  assert.equal(eventLines(dir).length, before);
});

test('edit with zero field flags is rejected as validation error, no event written', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-no-flags');
  const before = eventLines(dir).length;
  assert.throws(
    () => editUseCase({ dir }, { id: 'edit-no-flags', patch: {} }),
    (err) => err instanceof StoreError && err.category === 'validation',
  );
  assert.equal(eventLines(dir).length, before);
});

test('edit --deps pointing at an unknown id is rejected as validation, no event written', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-bad-dep');
  const before = eventLines(dir).length;
  assert.throws(
    () => editUseCase({ dir }, { id: 'edit-bad-dep', patch: { deps: ['ghost-dep'] } }),
    (err) => err instanceof WorkValidationError && /unknown id/i.test(err.message),
  );
  assert.equal(eventLines(dir).length, before);
});

test('edit rejects a patch targeting id/status/stage/domain as validation', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-locked-fields');
  const before = eventLines(dir).length;
  for (const field of ['id', 'status', 'stage', 'domain']) {
    assert.throws(
      () => editUseCase({ dir }, { id: 'edit-locked-fields', patch: { [field]: 'whatever' } }),
      (err) => err instanceof StoreError && err.category === 'validation',
    );
  }
  assert.equal(eventLines(dir).length, before);
  assert.equal(listWork(dir).work['edit-locked-fields'].status, 'todo');
});

test('edit succeeds identically regardless of the item current status', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-any-status', { status: 'doing' });
  const result = editUseCase({ dir }, { id: 'edit-any-status', patch: { risk: 'heavy' } });
  assert.deepEqual(result.fields, ['risk']);
  const item = listWork(dir).work['edit-any-status'];
  assert.equal(item.risk, 'heavy');
  assert.equal(item.status, 'doing');
});

test('edit omitting refs/deps leaves the field untouched; an explicit empty array clears it', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-dep-target');
  addTestWork(dir, 'edit-refs', { refs: ['a', 'b'], deps: ['edit-dep-target'] });
  editUseCase({ dir }, { id: 'edit-refs', patch: { risk: 'heavy' } });
  assert.deepEqual(listWork(dir).work['edit-refs'].refs, ['a', 'b']);
  assert.deepEqual(listWork(dir).work['edit-refs'].deps, ['edit-dep-target']);

  editUseCase({ dir }, { id: 'edit-refs', patch: { refs: [] } });
  assert.deepEqual(listWork(dir).work['edit-refs'].refs, []);
  assert.deepEqual(listWork(dir).work['edit-refs'].deps, ['edit-dep-target']);
});

test('edit omitting parent leaves it untouched; an explicit parent sets it; null clears it', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'parent-edit-root');
  addTestWork(dir, 'parent-edit-child');
  assert.equal(listWork(dir).work['parent-edit-child'].parent, undefined);

  editUseCase({ dir }, { id: 'parent-edit-child', patch: { risk: 'heavy' } });
  assert.equal(listWork(dir).work['parent-edit-child'].parent, undefined);

  editUseCase({ dir }, { id: 'parent-edit-child', patch: { parent: 'parent-edit-root' } });
  assert.equal(listWork(dir).work['parent-edit-child'].parent, 'parent-edit-root');

  editUseCase({ dir }, { id: 'parent-edit-child', patch: { parent: null } });
  assert.equal(listWork(dir).work['parent-edit-child'].parent, null);
});

test('edit parent closing a cycle is rejected as validation error', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'parent-cycle-a');
  addTestWork(dir, 'parent-cycle-b', { parent: 'parent-cycle-a' });

  assert.throws(
    () => editUseCase({ dir }, { id: 'parent-cycle-a', patch: { parent: 'parent-cycle-b' } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /graph cycle/i.test(err.message),
  );
  assert.equal(listWork(dir).work['parent-cycle-a'].parent, undefined, 'the rejected patch never landed');
});

test('editWork rejects a patch containing id/status/stage/domain as validation, before merge, no event written', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-store-locked');
  const before = eventLines(dir).length;
  for (const key of ['id', 'status', 'stage', 'domain']) {
    assert.throws(
      () => editWork(dir, { id: 'edit-store-locked', patch: { [key]: 'whatever' } }),
      (err) => err instanceof StoreError && err.category === 'validation',
      `patch.${key} should be rejected`,
    );
  }
  assert.equal(eventLines(dir).length, before);
});

test('edit reports the real event seq in its result data, not undefined', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-seq-check');
  const result = editUseCase({ dir }, { id: 'edit-seq-check', patch: { risk: 'heavy' } });
  assert.equal(result.id, 'edit-seq-check');
  assert.deepEqual(result.fields, ['risk']);
  assert.equal(result.seq, 2);
});

test('edit priority sets the item priority field to the given integer and records override decision', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-priority');
  editUseCase({ dir }, { id: 'edit-priority', patch: { priority: 3 } });
  const view = listWork(dir);
  assert.equal(view.work['edit-priority'].priority, 3);
  assert.ok(view.decisions.some((d) => d.id === 'edit-priority' && d.kind === 'priority-override'));
});

test('edit intent accepts a negative value (no sign constraint)', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-intent-neg');
  editUseCase({ dir }, { id: 'edit-intent-neg', patch: { intent: -1 } });
  assert.equal(listWork(dir).work['edit-intent-neg'].intent, -1);
});

test('edit urgent/impact/effort set the item fields to the given values', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-priority-matrix');
  editUseCase({ dir }, { id: 'edit-priority-matrix', patch: { urgent: 'critical', impact: 12.5, effort: 3 } });
  const item = listWork(dir).work['edit-priority-matrix'];
  assert.equal(item.urgent, 'critical');
  assert.equal(item.impact, 12.5);
  assert.equal(item.effort, 3);
});

test('edit docsRef sets and replaces docsRef on an item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-docs-ref-new');
  editUseCase({ dir }, { id: 'edit-docs-ref-new', patch: { docsRef: 'docs/history/edit-docs-ref-new/' } });
  assert.equal(listWork(dir).work['edit-docs-ref-new'].docsRef, 'docs/history/edit-docs-ref-new/');

  editUseCase({ dir }, { id: 'edit-docs-ref-new', patch: { docsRef: 'docs/history/new-feature/' } });
  assert.equal(listWork(dir).work['edit-docs-ref-new'].docsRef, 'docs/history/new-feature/');
});

test('edit mergeAfter sets and clears mergeAfter on an item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'merge-after-target');
  addTestWork(dir, 'merge-after-item');
  editUseCase({ dir }, { id: 'merge-after-item', patch: { mergeAfter: ['merge-after-target'] } });
  assert.deepEqual(listWork(dir).work['merge-after-item'].mergeAfter, ['merge-after-target']);

  editUseCase({ dir }, { id: 'merge-after-item', patch: { mergeAfter: [] } });
  assert.deepEqual(listWork(dir).work['merge-after-item'].mergeAfter, []);
});

test('edit mergeAfter rejects a target id that does not exist, item unchanged', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'merge-after-ghost-item');
  assert.throws(
    () => editUseCase({ dir }, { id: 'merge-after-ghost-item', patch: { mergeAfter: ['no-such-item'] } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /not a known id/i.test(err.message),
  );
  assert.equal(listWork(dir).work['merge-after-ghost-item'].mergeAfter, undefined);
});

test('edit mergeAfter rejects an item listing itself', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'merge-after-self-item');
  assert.throws(
    () => editUseCase({ dir }, { id: 'merge-after-self-item', patch: { mergeAfter: ['merge-after-self-item'] } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /own mergeAfter/i.test(err.message),
  );
});

test('edit mergeAfter rejects a mergeAfter that would close a cycle mixed with deps', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'merge-after-cycle-a');
  addTestWork(dir, 'merge-after-cycle-b', { deps: ['merge-after-cycle-a'] });
  assert.throws(
    () => editUseCase({ dir }, { id: 'merge-after-cycle-a', patch: { mergeAfter: ['merge-after-cycle-b'] } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /cycle/i.test(err.message),
  );
  assert.equal(listWork(dir).work['merge-after-cycle-a'].mergeAfter, undefined);
});

test('edit mergeAfter does not require the deps field to have been touched', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'merge-after-independent-target');
  addTestWork(dir, 'merge-after-independent-item');
  editUseCase({ dir }, { id: 'merge-after-independent-item', patch: { mergeAfter: ['merge-after-independent-target'] } });
  assert.deepEqual(listWork(dir).work['merge-after-independent-item'].deps, []);
});

test('edit supersededBy sets and clears supersededBy on an item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'superseded-by-target');
  addTestWork(dir, 'superseded-by-item');
  editUseCase({ dir }, { id: 'superseded-by-item', patch: { supersededBy: 'superseded-by-target' } });
  assert.equal(listWork(dir).work['superseded-by-item'].supersededBy, 'superseded-by-target');

  editUseCase({ dir }, { id: 'superseded-by-item', patch: { supersededBy: null } });
  assert.equal(listWork(dir).work['superseded-by-item'].supersededBy, null);
});

test('edit supersededBy rejects a target id that does not exist or listing itself', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'superseded-by-ghost-item');
  assert.throws(
    () => editUseCase({ dir }, { id: 'superseded-by-ghost-item', patch: { supersededBy: 'no-such-item' } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /not a known id/i.test(err.message),
  );
  assert.equal(listWork(dir).work['superseded-by-ghost-item'].supersededBy, undefined);

  assert.throws(
    () => editUseCase({ dir }, { id: 'superseded-by-ghost-item', patch: { supersededBy: 'superseded-by-ghost-item' } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /own supersededBy/i.test(err.message),
  );
});

test('edit duplicates sets and clears duplicates on an item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'duplicates-target');
  addTestWork(dir, 'duplicates-item');
  editUseCase({ dir }, { id: 'duplicates-item', patch: { duplicates: ['duplicates-target'] } });
  assert.deepEqual(listWork(dir).work['duplicates-item'].duplicates, ['duplicates-target']);

  editUseCase({ dir }, { id: 'duplicates-item', patch: { duplicates: [] } });
  assert.deepEqual(listWork(dir).work['duplicates-item'].duplicates, []);
});

test('edit duplicates rejects a target id that does not exist or listing itself', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'duplicates-ghost-item');
  assert.throws(
    () => editUseCase({ dir }, { id: 'duplicates-ghost-item', patch: { duplicates: ['no-such-item'] } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /not a known id/i.test(err.message),
  );
  assert.equal(listWork(dir).work['duplicates-ghost-item'].duplicates, undefined);

  assert.throws(
    () => editUseCase({ dir }, { id: 'duplicates-ghost-item', patch: { duplicates: ['duplicates-ghost-item'] } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /own duplicates/i.test(err.message),
  );
});

test('edit description overwrites an existing description', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-description-existing', { description: 'initial description' });
  assert.equal(listWork(dir).work['edit-description-existing'].description, 'initial description');
  editUseCase({ dir }, { id: 'edit-description-existing', patch: { description: 'the full story' } });
  assert.equal(listWork(dir).work['edit-description-existing'].description, 'the full story');
});

test('edit footprint sets footprint on an item that had none', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-footprint-new');
  assert.equal(listWork(dir).work['edit-footprint-new'].footprint, undefined);
  editUseCase({ dir }, { id: 'edit-footprint-new', patch: { footprint: ['src/a.mjs', 'src/b.mjs'] } });
  assert.deepEqual(listWork(dir).work['edit-footprint-new'].footprint, ['src/a.mjs', 'src/b.mjs']);
});

test('edit action sets action directive prose on an item', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-action-new');
  assert.equal(listWork(dir).work['edit-action-new'].action, undefined);
  editUseCase({ dir }, { id: 'edit-action-new', patch: { action: 'Implement feature X per plan.md' } });
  assert.equal(listWork(dir).work['edit-action-new'].action, 'Implement feature X per plan.md');
});

test('edit action with empty string is rejected as validation error', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-action-empty');
  assert.throws(
    () => editUseCase({ dir }, { id: 'edit-action-empty', patch: { action: '' } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /action/i.test(err.message),
  );
  assert.equal(listWork(dir).work['edit-action-empty'].action, undefined);
});

test('edit acceptance is refused when a clause supplies text+evidence together but evidence cites no real path', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-untraceable');
  assert.throws(
    () => editUseCase({ dir }, { id: 'edit-untraceable', patch: { acceptance: [{ text: 'root cause confirmed', evidence: 'nothing checkable here' }] } }),
    (err) => (err instanceof StoreError || err instanceof WorkValidationError) && /evidence/i.test(err.message),
  );
  assert.equal(listWork(dir).work['edit-untraceable'].acceptance, undefined, 'the rejected patch never applies');
});

test('edit acceptance persists work.acceptance as the given array and replaces whole array', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-acceptance');
  const clauses = [{ text: 'newly added clause' }];
  editUseCase({ dir }, { id: 'edit-acceptance', patch: { acceptance: clauses } });
  assert.deepEqual(listWork(dir).work['edit-acceptance'].acceptance, clauses);

  const replacement = [{ text: 'a completely different clause' }];
  editUseCase({ dir }, { id: 'edit-acceptance', patch: { acceptance: replacement } });
  assert.deepEqual(listWork(dir).work['edit-acceptance'].acceptance, replacement);
});

test('edit role session tags stored event payload.role session instead of default human', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-role-session');
  editUseCase({ dir }, { id: 'edit-role-session', patch: { risk: 'heavy' }, role: 'session' });
  const last = JSON.parse(eventLines(dir).at(-1));
  assert.equal(last.payload.role, 'session');
});

test('edit omitting role still stamps payload.role human', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-role-default');
  editUseCase({ dir }, { id: 'edit-role-default', patch: { risk: 'heavy' } });
  const last = JSON.parse(eventLines(dir).at(-1));
  assert.equal(last.payload.role, 'human');
});

test('edit role with invalid value is rejected as validation error', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'edit-role-bad');
  const before = eventLines(dir).length;
  assert.throws(
    () => editUseCase({ dir }, { id: 'edit-role-bad', patch: { risk: 'heavy' }, role: 'robot' }),
    (err) => err instanceof StoreError && /role/i.test(err.message),
  );
  assert.equal(eventLines(dir).length, before);
});

test('generateVerifyFromChildren and generateVerifyFromTargets generate jq commands or throw on empty', () => {
  const cwd = tmpCwdFast();
  const dir = path.join(cwd, '.fgos');
  addTestWork(dir, 'parent-x');
  addTestWork(dir, 'child-1', { parent: 'parent-x' });
  addTestWork(dir, 'child-2', { parent: 'parent-x' });
  const verify = generateVerifyFromChildren(dir, 'parent-x', { cwd, repoRoot: cwd });
  assert.match(verify, /child-1/);
  assert.match(verify, /child-2/);
  assert.match(verify, /delivered/);

  assert.throws(
    () => generateVerifyFromChildren(dir, 'child-1', { cwd, repoRoot: cwd }),
    /no children|no item has parent/i,
  );

  addTestWork(dir, 'target-1');
  addTestWork(dir, 'mvp-x', { goalTier: 'mvp', targets: ['target-1'] });
  const targetVerify = generateVerifyFromTargets(dir, 'mvp-x', { cwd, repoRoot: cwd });
  assert.match(targetVerify, /target-1/);

  addTestWork(dir, 'targetless-mvp', { goalTier: 'mvp' });
  assert.throws(
    () => generateVerifyFromTargets(dir, 'targetless-mvp', { cwd, repoRoot: cwd }),
    /no targets/i,
  );
});
