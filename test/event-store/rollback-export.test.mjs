import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, append, addon, loaderOptions } from './phase07-fixture.mjs';
import { trackedLegacy } from './phase08-fixture.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { exportUseCase } from '../../src/verbs/events/export.mjs';
import { checkEventStore } from '../../src/setup/event-store-checks.mjs';

test('real import then fixture fence, v4 append and rollback export preserve Work and nested porting parity', t => {
  const f = fixture(t); const files = trackedLegacy(f);
  const before = f.store.readLegacyFromHead({ check: true }, []);
  const pin = f.store.importLegacy({ expectedHead: before.inventory.fromCommit }, []);
  // Fixture-only cutover materialization; production uses the pending Git 05
  // ScopedCommit+real-hook gate in migrate-cutover-grant.test.mjs.
  for (const p of Object.keys(files).filter(p => p !== '.gitattributes')) fs.unlinkSync(path.join(f.repo, p));
  fs.rmdirSync(path.join(f.repo, '.fgos/events'));
  fs.writeFileSync(path.join(f.repo, '.fgos/events'), JSON.stringify(pin));
  fs.writeFileSync(path.join(f.repo, '.gitattributes'), '*.txt text\n');
  f.git('add', '-A'); f.git('commit', '-qm', 'fixture fence');
  assert.throws(() => fs.writeFileSync(path.join(f.repo, '.fgos/events/old-writer.jsonl'), ''), { code: 'ENOTDIR' });
  const store = openStore(addon.resolveEventStore(f.repo, f.stateRoot, f.repo), 'phase-seven', [path.join(f.temp, 'contract.json')], loaderOptions);
  append(store, [{ payload: { id: 'new', title: 'after migration' }, ts: '2026-02-01T00:00:00.000Z' }]);
  store.append('project:porting', [{ eventType: 'porting.move', schemaVersion: 1, payload: { id: 'port', to: 'done' }, ts: '2026-02-02T00:00:00.000Z' }], {}, 'fixture', []);
  const result = exportUseCase(f.ctx, { format: 'legacy-layout', out: path.join(f.temp, 'rollback') });
  assert.equal(result.parity.equal, true, JSON.stringify(result.parity));
  assert.deepEqual(fs.readFileSync(path.join(f.temp, 'rollback/events.jsonl')), Buffer.from(files['.fgos/events.jsonl']));
  assert.deepEqual(fs.readFileSync(path.join(f.temp, 'rollback/porting/docs/distillery/state/porting/events.jsonl')), Buffer.from(files['docs/distillery/state/porting/events.jsonl']));
  assert.equal(checkEventStore(f.repo, 'event-store-legacy-layout', f.ctx).passed, true);
  f.git('update-ref', '-d', 'refs/fgos/legacy');
  assert.equal(checkEventStore(f.repo, 'event-store-legacy-layout', f.ctx).passed, false);
  const missing = openStore(addon.resolveEventStore(f.repo, f.stateRoot, f.repo), 'phase-seven', [path.join(f.temp, 'contract.json')], loaderOptions);
  assert.throws(() => append(missing, [{}]), /event-store-refspec-missing/);
});
