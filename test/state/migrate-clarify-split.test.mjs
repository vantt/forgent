import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { migrateClarifySplit } from '../../scripts/migrate-clarify-split.mjs';
import { addWork, listWork, putInAwaiting, addDecision } from '../../src/state/store.mjs';

// tsk-puz D12 (docs/history/fanout-and-delegation-rubric/CONTEXT.md): sorts
// every stage:clarify item into discovery/exploring/clarify per real,
// mechanical signals (status, decisionsById, a real committed CONTEXT.md) —
// never a placeholder or a guess.

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

function mkLockedContextFixture(storeDir, docsRef, content = '# CONTEXT\n\nD1: locked.\n') {
  const repoRoot = path.dirname(storeDir);
  const featureDir = path.join(repoRoot, docsRef);
  fs.mkdirSync(featureDir, { recursive: true });
  fs.writeFileSync(path.join(featureDir, 'CONTEXT.md'), content);
}

test('an untouched item (no decision, no docsRef content, not parked) stays at clarify — no moveStage call, reported in leftAtClarify', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'untouched' }));

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToDiscovery, []);
  assert.deepEqual(report.movedToExploring, []);
  assert.deepEqual(report.leftAtClarify, ['untouched']);
  assert.equal(listWork(storeDir).work.untouched.stage, 'clarify');
});

test('an item with a real logged decision (decisionsById) migrates to discovery', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'has-decision' }));
  addDecision(storeDir, { id: 'has-decision', text: 'D1: locked something real', source: 'fgos-exploring', rationale: 'real evidence' });

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToDiscovery, ['has-decision']);
  assert.deepEqual(report.movedToExploring, []);
  assert.deepEqual(report.leftAtClarify, []);
  assert.equal(listWork(storeDir).work['has-decision'].stage, 'discovery');
});

test('an item with a real committed CONTEXT.md under its own docsRef (no decisionsById entry) also migrates to discovery', () => {
  const storeDir = tmpStoreDir();
  const docsRef = 'docs/history/has-context-item';
  mkLockedContextFixture(storeDir, docsRef);
  addWork(storeDir, sampleWork({ id: 'has-context', docsRef }));

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToDiscovery, ['has-context']);
  assert.equal(listWork(storeDir).work['has-context'].stage, 'discovery');
});

test('an item with a docsRef pointing at an empty/missing CONTEXT.md stays at clarify (no false positive from a bare field)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'empty-docsref', docsRef: 'docs/history/never-written' }));

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.leftAtClarify, ['empty-docsref']);
  assert.equal(listWork(storeDir).work['empty-docsref'].stage, 'clarify');
});

test('an item parked awaiting-human migrates to exploring, even when it also carries a real decision (parked status wins — it is already past the discovery point)', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'parked' }));
  addDecision(storeDir, { id: 'parked', text: 'D1: something', source: 'fgos-exploring', rationale: 'real' });
  putInAwaiting(storeDir, { id: 'parked', ask: 'Which provider?', statusAtAsk: 'todo' });

  const report = migrateClarifySplit(storeDir);

  assert.deepEqual(report.movedToExploring, ['parked']);
  assert.deepEqual(report.movedToDiscovery, []);
  assert.equal(listWork(storeDir).work.parked.stage, 'exploring');
});

test('a non-clarify-stage item is never touched, regardless of its own status/decisions', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'already-executing', stage: 'executing' }));

  const report = migrateClarifySplit(storeDir);

  assert.equal(report.totalClarifyItemsSeen, 0);
  assert.equal(listWork(storeDir).work['already-executing'].stage, 'executing');
});

test('dry-run computes the exact same plan but writes nothing at all — every item still reads at stage clarify afterward', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'has-decision' }));
  addDecision(storeDir, { id: 'has-decision', text: 'D1: locked something real', source: 'fgos-exploring', rationale: 'real evidence' });
  addWork(storeDir, sampleWork({ id: 'untouched-2' }));

  const report = migrateClarifySplit(storeDir, { dryRun: true });

  assert.equal(report.dryRun, true);
  assert.deepEqual(report.movedToDiscovery, ['has-decision']);
  assert.deepEqual(report.leftAtClarify, ['untouched-2']);
  // nothing actually written -- both items still read at their original stage
  assert.equal(listWork(storeDir).work['has-decision'].stage, 'clarify');
  assert.equal(listWork(storeDir).work['untouched-2'].stage, 'clarify');
});

test('idempotent by construction: a second real run right after the first moves nothing further and reports every already-migrated item as no longer a clarify candidate at all', () => {
  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'has-decision' }));
  addDecision(storeDir, { id: 'has-decision', text: 'D1: locked something real', source: 'fgos-exploring', rationale: 'real evidence' });
  addWork(storeDir, sampleWork({ id: 'parked' }));
  putInAwaiting(storeDir, { id: 'parked', ask: 'Which provider?', statusAtAsk: 'todo' });
  addWork(storeDir, sampleWork({ id: 'untouched' }));

  const first = migrateClarifySplit(storeDir);
  assert.equal(first.totalClarifyItemsSeen, 3);

  const second = migrateClarifySplit(storeDir);
  // 'untouched' is still the only stage:clarify item left -- the other two
  // no longer match the filter at all, so this rerun sees exactly one
  // candidate, itself left alone again (no decision, not parked).
  assert.equal(second.totalClarifyItemsSeen, 1);
  assert.deepEqual(second.leftAtClarify, ['untouched']);
  assert.deepEqual(second.movedToDiscovery, []);
  assert.deepEqual(second.movedToExploring, []);

  const view = listWork(storeDir);
  assert.equal(view.work['has-decision'].stage, 'discovery');
  assert.equal(view.work.parked.stage, 'exploring');
  assert.equal(view.work.untouched.stage, 'clarify');
});

test('CLI: node scripts/migrate-clarify-split.mjs --dir <path> --dry-run prints the report as JSON, writes nothing', async () => {
  const { execFileSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.resolve(__dirname, '../../scripts/migrate-clarify-split.mjs');

  const storeDir = tmpStoreDir();
  addWork(storeDir, sampleWork({ id: 'untouched' }));

  const stdout = execFileSync(process.execPath, [scriptPath, '--dir', storeDir, '--dry-run'], { encoding: 'utf8' });
  const report = JSON.parse(stdout);
  assert.equal(report.dryRun, true);
  assert.deepEqual(report.leftAtClarify, ['untouched']);
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
