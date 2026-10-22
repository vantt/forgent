import '../helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validateWork,
  WorkValidationError,
  SIZES,
  DEFAULTS,
} from '../../src/state/work.mjs';
import { RIGOR_VALUES } from '../../src/runner/rigor.mjs';
import { foldEvents } from '../../src/state/replay.mjs';
import { rebuild, initStore, addWork, editWork, currentEffectiveView } from '../../src/state/store.mjs';
import { parseEditFlags } from '../../src/verbs/state/edit.mjs';
import { effectiveDispatchPolicy } from '../../src/runner/dispatch/plan.mjs';
import { bindable } from '../helpers/work-seat-config.mjs';
import { workRigorFor } from '../../src/runner/work-dispatch.mjs';

function mkTempDir() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-work-size-rigor-test-'));
  initializeWorkRepository(repo);
  return repo;
}

test('event cũ có tier đọc ra size lúc foldEvents và rebuildView', () => {
  const legacyEvents = [
    {
      type: 'work.add',
      ts: '2026-09-30T10:00:00.000Z',
      payload: {
        id: 'tsk-legacy-1',
        title: 'Legacy work item with tier',
        kind: 'task',
        status: 'todo',
        tier: 'heavy',
        risk: 'light',
      },
    },
  ];

  const view = foldEvents(legacyEvents);
  const item = view.work['tsk-legacy-1'];
  assert.ok(item, 'item should exist in folded view');
  assert.equal(item.size, 'heavy', 'legacy tier should be mapped to size');
  assert.equal(item.tier, undefined, 'item should not expose raw legacy tier');
});

test('work.risk: heavy của item cũ không có rigor được đọc thành rigor: high (D18)', () => {
  const legacyEvents = [
    {
      type: 'work.add',
      ts: '2026-09-30T10:00:00.000Z',
      payload: {
        id: 'tsk-legacy-risk',
        title: 'Legacy item with risk heavy',
        kind: 'task',
        status: 'todo',
        tier: 'standard',
        risk: 'heavy',
      },
    },
  ];

  const view = foldEvents(legacyEvents);
  const item = view.work['tsk-legacy-risk'];
  assert.equal(item.size, 'standard');
  assert.equal(item.rigor, 'high', 'legacy item with risk: heavy and no rigor maps to rigor: high');
});

test('bắt đầu từ state.json cũ (không có viewSchemaVersion) -> view được rebuild có size', () => {
  const dir = mkTempDir();
  const fgosDir = path.join(dir, '.fgos');
  initStore(fgosDir);

  const eventContent = JSON.stringify({
    type: 'work.add',
    ts: '2026-09-30T10:00:00.000Z',
    seq: 1,
    payload: {
      id: 'tsk-snap-1',
      title: 'Snapshot test item',
      kind: 'task',
      status: 'todo',
      tier: 'light',
    },
  }) + '\n';
  const event = JSON.parse(eventContent);
  prepareWorkStore(fgosDir, fgosDir).store.append('project', [{ eventType: event.type, schemaVersion: 1, payload: event.payload, ts: event.ts }], {}, 'fixture', []);

  // Write a legacy state.json without viewSchemaVersion, having obsolete "tier" in folded work
  const legacyState = {
    work: {
      'tsk-snap-1': {
        id: 'tsk-snap-1',
        title: 'Snapshot test item',
        kind: 'task',
        status: 'todo',
        tier: 'light',
      },
    },
    decisions: [],
    revision: 'old-rev',
    snapshot: {
      files: {
        'events-main.jsonl': {
          size: Buffer.byteLength(eventContent),
          lastLine: eventContent.trim(),
        },
      },
      maxTs: '2026-09-30T10:00:00.000Z',
    },
  };
  fs.writeFileSync(resolveFgosFile(fgosDir, FGOS_FILE.STATE), JSON.stringify(legacyState, null, 2), 'utf8');

  // rebuildViewFromDir must reject the unversioned/mismatched snapshot and re-fold from events
  const freshView = rebuild(fgosDir);
  const item = freshView.work['tsk-snap-1'];
  assert.ok(item);
  assert.equal(item.size, 'light', 'view must have size');
  assert.equal(item.tier, undefined, 'view must not have tier');
});

test('--tier bị từ chối kèm hướng dẫn trên parseEditFlags', () => {
  assert.throws(
    () => parseEditFlags({ tier: 'heavy' }, { id: 'tsk-1' }),
    (err) => {
      assert.match(err.message, /--tier/);
      assert.match(err.message, /--size/);
      assert.match(err.message, /--rigor/);
      return true;
    },
  );
});

test('Work dispatch: rigor: high is recorded as the demand and the tier stays the config\'s (rigor no longer maps to a tier)', () => {
  const runnerConfig = bindable({
    executor: { command: 'claude', args: ['{prompt}'] },
    modelPolicies: {
      claude: {
        nano: 'haiku',
        standard: 'sonnet',
        flagship: 'opus',
        frontier: 'opus-next',
      },
    },
  });

  const work = {
    id: 'tsk-high',
    title: 'High rigor task',
    size: 'heavy',
    rigor: 'high',
  };

  // The Work layer folds the item's rigor into the assignment; dispatch never reads the item.
  const rigor = workRigorFor(work);
  const assignment = {
    operation: 'exec',
    policy: {},
    ...(rigor !== undefined ? { rigor } : {}),
  };

  const policy = effectiveDispatchPolicy({
    assignment,
    runnerConfig,
    cliOverride: {},
  });

  assert.equal(policy.tier, 'standard');
  assert.equal(policy.model, 'sonnet');
  assert.equal(policy.provenance.rigor.value, 'high');
  assert.equal(policy.provenance.tier.value, 'standard');
});

test('Work dispatch: không có rigor -> standard, size: heavy không ảnh hưởng model', () => {
  const runnerConfig = bindable({
    executor: { command: 'claude', args: ['{prompt}'] },
    modelPolicies: {
      claude: {
        nano: 'haiku',
        standard: 'sonnet',
        flagship: 'opus',
        frontier: 'opus-next',
      },
    },
  });

  const work = {
    id: 'tsk-heavy-size',
    title: 'Heavy size but no rigor',
    size: 'heavy',
    // no rigor declared
  };

  // The Work layer folds the item's rigor into the assignment; dispatch never reads the item.
  const rigor = workRigorFor(work);
  const assignment = {
    operation: 'exec',
    policy: {},
    ...(rigor !== undefined ? { rigor } : {}),
  };

  const policy = effectiveDispatchPolicy({
    assignment,
    runnerConfig,
    cliOverride: {},
  });

  assert.equal(policy.tier, 'standard', 'default tier must be standard');
  assert.equal(policy.model, 'sonnet', 'model must be standard tier model, NOT frontier/heavy');
  assert.equal(policy.provenance.rigor.value, 'standard');
  assert.equal(policy.provenance.tier.value, 'standard');
});
