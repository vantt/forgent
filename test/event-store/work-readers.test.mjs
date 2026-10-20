import '../helpers/process-tmp-root.mjs';
import '../helpers/work-store-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fixture } from './phase07-fixture.mjs';
import { lexSource } from '../helpers/js-source-lexer.mjs';
import { initStore, addWork, addOutcome } from '../../src/state/store.mjs';
import { generateEnduserDocsIndex } from '../../src/report/enduser-index-generate.mjs';

// These are named mechanism families, not an allowance for arbitrary readers.
const removalUnit = new Set([
  'bin/fgos.mjs', // repair verb only
  'src/runner/merge.mjs', // Land/restore file handling
  'src/runner/main-fgos-checkpoint.mjs',
  'src/setup/registrations.mjs', // retired compaction/truncation checks only
  'src/state/events.mjs', 'src/state/event-log.mjs',
  'src/state/events-compaction.mjs', 'src/state/events-jsonl-truncation-guard.mjs',
  'scripts/events-jsonl-truncation-guard.mjs',
]);
const separateStores = new Set([
  'src/state/porting-store.mjs', // phase 09 requirement 7, separate consumer
  'src/workflow/store.mjs', 'src/workflow/case-admission-port.mjs',
  'scripts/backfill-unit-summaries.mjs', 'scripts/migration-proof-2a.mjs',
  'scripts/regenerate-observe-fixtures.mjs', // coordination journal + explicit export
  'packages/observe/rust/src/friction.rs', // Observe's own shards
]);
const inventoryAndMetadata = new Set([
  'src/verbs/events/migrate.mjs', 'src/verbs/events/export.mjs',
  'src/state/main-checkout-guard-warnings.mjs',
]);
test('Work reader census: zero consumers of legacy files outside the facade', t => {
  const files = execFileSync('rg', ['--files', 'src', 'bin', 'scripts', 'packages', 'apps'], { encoding: 'utf8' }).trim().split('\n');
  const unexpected = [];
  for (const file of files.filter(f => /\.(mjs|rs)$/.test(f) && !f.includes('/tests/'))) {
    const text = fs.readFileSync(file, 'utf8');
    const code = file.endsWith('.mjs') ? lexSource(text).code : text.split('#[cfg(test)]')[0].replace(/\/\/[^\n]*/g, '');
    const pattern = /['"]events\.jsonl['"]|\bjoin\([^\n]*['"]events['"]|\b(?:readAllEventsFromDir|readEventsFromByte)\b|import\s*\{[^}]*\breadEvents\b[^}]*\}\s*from/;
    if (!pattern.test(code)) continue;
    if (file.startsWith('src/event-store/') || file.startsWith('packages/event-store/') || file.startsWith('packages/git/node-addon/')) continue;
    if (removalUnit.has(file) || separateStores.has(file) || inventoryAndMetadata.has(file)) continue;
    unexpected.push(file);
  }
  assert.deepEqual(unexpected, []);
  t.diagnostic('0 unclassified Work readers; allowed: owning facade/crate, migration/export inventory, metadata, fixtures, separate journals, requirement-9 removal families, requirement-7 porting consumer.');
});

test('docs index reads captures without legacy files and preserves its manifest on corrupt history', t => {
  const f = fixture(t);
  const dir = path.join(f.repo, '.fgos');
  initStore(dir);
  addWork(dir, { id: 'capture', title: 'Capture', kind: 'task', status: 'todo', deps: [], refs: [], risk: 'light', verify: 'true' });
  addOutcome(dir, { id: 'capture', docPath: 'docs/how-to/hello.md', docType: 'how-to' });
  fs.mkdirSync(path.join(f.repo, 'docs/how-to'), { recursive: true });
  fs.writeFileSync(path.join(f.repo, 'docs/how-to/hello.md'), '# Hello\n');
  assert.equal(fs.existsSync(path.join(dir, 'events.jsonl')), false);
  const result = generateEnduserDocsIndex(f.repo, dir);
  assert.equal(result.entries[0].sourceCaptureId, 'capture');
  const manifest = path.join(f.repo, result.path);
  const before = fs.readFileSync(manifest);
  addWork(dir, { id: 'unsealed', title: 'Unsealed', kind: 'task', status: 'todo', deps: [], refs: [], risk: 'light', verify: 'true' });
  const active = path.join(f.repo, '.git/fgos/events/project/active.jsonl');
  fs.writeFileSync(active, fs.readFileSync(active, 'utf8').replace('work.add', 'work.bad'));
  assert.throws(() => generateEnduserDocsIndex(f.repo, dir));
  assert.deepEqual(fs.readFileSync(manifest), before);
});

test('legacy HEAD inventory ignores archived shards rather than importing them twice', t => {
  const f = fixture(t);
  const baseline = JSON.stringify({ ts: '2026-01-01T00:00:00.000Z', type: 'work.add', payload: { id: 'live', title: 'Live' } }) + '\n';
  fs.writeFileSync(path.join(f.repo, '.fgos/events.jsonl'), baseline);
  fs.mkdirSync(path.join(f.repo, '.fgos/events/archive'), { recursive: true });
  fs.writeFileSync(path.join(f.repo, '.fgos/events/archive/old.jsonl'), '{archived-and-unparseable}\n');
  f.git('add', '.fgos/events.jsonl', '.fgos/events/archive/old.jsonl');
  f.git('commit', '-qm', 'legacy archive fixture');
  const snapshot = f.store.readLegacyFromHead({ check: true }, []);
  assert.equal(snapshot.events.length, 1);
  assert.equal(snapshot.events[0].event.payload.id, 'live');
  assert.equal(Object.hasOwn(snapshot.inventory.files, '.fgos/events/archive/old.jsonl'), false);
});
