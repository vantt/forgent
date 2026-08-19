import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { migrateClarifySplit } from '../../scripts/migrate-clarify-split.mjs';
import { listWork, putInAwaiting, addDecision } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';

// tsk-puz D12 (docs/history/fanout-and-delegation-rubric/CONTEXT.md),
// retargeted by tsk-qod D1 (docs/history/discover-stage-graph-and-skill-
// layering/CONTEXT.md): sorts every stage:clarify item into
// discovery/exploring per real, mechanical signals (status, decisionsById,
// a real committed CONTEXT.md) — never a placeholder or a guess. `clarify`
// is retired as a stage entirely, so every candidate item now moves; there
// is no longer a "stays at clarify" outcome.

function tmpStoreDir() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-migrate-clarify-split-'));
  const storeDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(storeDir);
  return storeDir;
}

function sampleWork(overrides = {}) {
  return {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'npm test',
    stage: 'clarify',
    ...overrides,
  };
}

// tsk-qod D1/D2: `clarify` no longer exists in `stages` at all, so
// `addWork`'s own `validateWorkShape` now rejects it outright -- these
// fixtures simulate an item that was already at that stage BEFORE this
// item's own rename (exactly what the real 90-item migration ran against),
// so they inject the raw `work.add` event directly, the same
// bypass-validation pattern `test/state/backward-compat.test.mjs` already
// uses for simulating pre-existing (grandfathered) log state.
function addLegacyWork(storeDir, overrides = {}) {
  appendEvent(path.join(storeDir, 'events.jsonl'), { type: 'work.add', payload: sampleWork(overrides) });
}

function mkLockedContextFixture(storeDir, docsRef, content = '# CONTEXT\n\nD1: locked.\n') {
  const repoRoot = path.dirname(storeDir);
  const featureDir = path.join(repoRoot, docsRef);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), content);
}

test('an untouched item (no decision, no docsRef content, not parked) migrates to discovery — clarify is retired, nowhere left to stay', () => {
  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'untouched' });

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToDiscovery, ['untouched']);
  assert.deepEqual(report.movedToExploring, []);
  assert.equal(listWork(storeDir).work.untouched.stage, 'discovery');
});

test('an item with a real logged decision (decisionsById) migrates to discovery', () => {
  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'has-decision' });
  addDecision(storeDir, { id: 'has-decision', text: 'D1: locked something real', source: 'fgos-exploring', rationale: 'real evidence' });

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToDiscovery, ['has-decision']);
  assert.deepEqual(report.movedToExploring, []);
  assert.equal(listWork(storeDir).work['has-decision'].stage, 'discovery');
});

test('an item with a real committed CONTEXT.md under its own docsRef (no decisionsById entry) also migrates to discovery', () => {
  const storeDir = tmpStoreDir();
  const docsRef = 'docs/history/has-context-item';
  mkLockedContextFixture(storeDir, docsRef);
  addLegacyWork(storeDir, { id: 'has-context', docsRef });

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToDiscovery, ['has-context']);
  assert.equal(listWork(storeDir).work['has-context'].stage, 'discovery');
});

test('an item with a docsRef pointing at an empty/missing CONTEXT.md migrates to discovery too (no false positive treating a bare field as a real locked decision — same "untouched" target either way)', () => {
  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'empty-docsref', docsRef: 'docs/history/never-written' });

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToDiscovery, ['empty-docsref']);
  assert.equal(listWork(storeDir).work['empty-docsref'].stage, 'discovery');
});

const VALID_ASK = `## Context

We need to clarify which provider should be used for the payment gateway integration.

## Why this matters

The choice of provider determines the SDK dependencies and API configuration required.`;

test('an item parked awaiting-human migrates to exploring, even when it also carries a real decision (parked status wins — it is already past the discovery point)', () => {
  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'parked' });
  addDecision(storeDir, { id: 'parked', text: 'D1: something', source: 'fgos-exploring', rationale: 'real' });
  putInAwaiting(storeDir, { id: 'parked', ask: VALID_ASK, statusAtAsk: 'todo' });

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToExploring, ['parked']);
  assert.deepEqual(report.movedToDiscovery, []);
  assert.equal(listWork(storeDir).work.parked.stage, 'exploring');
});

test('a non-clarify-stage item is never touched, regardless of its own status/decisions', () => {
  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'already-executing', stage: 'executing' });

  const report = migrateClarifySplit(storeDir);

  assert.equal(report.totalClarifyItemsSeen, 0);
  assert.equal(listWork(storeDir).work['already-executing'].stage, 'executing');
});

test('dry-run computes the exact same plan but writes nothing at all — every item still reads at stage clarify afterward', () => {
  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'has-decision' });
  addDecision(storeDir, { id: 'has-decision', text: 'D1: locked something real', source: 'fgos-exploring', rationale: 'real evidence' });
  addLegacyWork(storeDir, { id: 'untouched-2' });

  const report = migrateClarifySplit(storeDir, { dryRun: true });

  assert.equal(report.dryRun, true);
  assert.deepEqual(report.movedToDiscovery.sort(), ['has-decision', 'untouched-2'].sort());
  // nothing actually written -- both items still read at their original stage
  assert.equal(listWork(storeDir).work['has-decision'].stage, 'clarify');
  assert.equal(listWork(storeDir).work['untouched-2'].stage, 'clarify');
});

test('idempotent by construction: a second real run right after the first moves nothing further — every item already migrated on the first pass, clarify has zero candidates left', () => {
  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'has-decision' });
  addDecision(storeDir, { id: 'has-decision', text: 'D1: locked something real', source: 'fgos-exploring', rationale: 'real evidence' });
  addLegacyWork(storeDir, { id: 'parked' });
  putInAwaiting(storeDir, { id: 'parked', ask: VALID_ASK, statusAtAsk: 'todo' });
  addLegacyWork(storeDir, { id: 'untouched' });

  const first = migrateClarifySplit(storeDir);
  assert.equal(first.totalClarifyItemsSeen, 3);

  const second = migrateClarifySplit(storeDir);
  // Every candidate moved on the first pass (clarify is retired — nothing
  // stays behind), so the rerun's own filter (`item.stage !== 'clarify'`)
  // matches zero items.
  assert.equal(second.totalClarifyItemsSeen, 0);
  assert.deepEqual(second.movedToDiscovery, []);
  assert.deepEqual(second.movedToExploring, []);

  const view = listWork(storeDir);
  assert.equal(view.work['has-decision'].stage, 'discovery');
  assert.equal(view.work.parked.stage, 'exploring');
  assert.equal(view.work.untouched.stage, 'discovery');
});

test('CLI: node scripts/migrate-clarify-split.mjs --dir <path> --dry-run prints the report as JSON, writes nothing', async () => {
  const { execFileSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.resolve(__dirname, '../../scripts/migrate-clarify-split.mjs');

  const storeDir = tmpStoreDir();
  addLegacyWork(storeDir, { id: 'untouched' });

  const stdout = execFileSync(process.execPath, [scriptPath, '--dir', storeDir, '--dry-run'], { encoding: 'utf8' });
  const report = JSON.parse(stdout);
  assert.equal(report.dryRun, true);
  assert.deepEqual(report.movedToDiscovery, ['untouched']);
  assert.equal(listWork(storeDir).work.untouched.stage, 'clarify');
});

test('CLI: missing --dir is rejected with a usage error, not a crash', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.resolve(__dirname, '../../scripts/migrate-clarify-split.mjs');

  const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /--dir/);
});
