import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as gitPorts from '../../src/git/index.mjs';
import { root } from '../helpers/git-addon.mjs';
import { fixture } from './phase07-fixture.mjs';
import { trackedLegacy } from './phase08-fixture.mjs';
import { migrateUseCase } from '../../src/verbs/events/migrate.mjs';
import { checkStopped } from '../../src/holder-lock/fences.mjs';
import { ensureHostBin } from '../../scripts/run-tests.mjs';
const hostBin = ensureHostBin();

test('migrate --check runs real quiesce/setup/parity without publishing a ref or changing HEAD', async t => {
  const f = fixture(t, { machine: false }); trackedLegacy(f);
  const head = f.git('rev-parse', 'HEAD');
  const scan = checkStopped({ workspaces: [f.repo], hostBin });
  if (scan.status !== 'clean') {
    await assert.rejects(migrateUseCase({ ...f.ctx, hostBin }, { check: true }), { code: 'event-store-writers-active' });
    assert.equal(f.git('for-each-ref', 'refs/fgos/legacy'), '');
    t.diagnostic(`Real quiesce correctly refused: ${scan.detail}; successful command-level check needs a host scan`);
    return;
  }
  const result = await migrateUseCase({ ...f.ctx, hostBin }, { check: true });
  assert.equal(result.parity.equal, true); assert.equal(result.check, true);
  assert.equal(f.git('for-each-ref', 'refs/fgos/legacy'), ''); assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.ok(result.plan.deletions.includes('docs/distillery/state/porting/state.json'));
  assert.ok(result.plan.deletions.includes('.fgos/events.jsonl.backup-two'));
});

test('real Git 05 hook migration and second-run no-op', { skip: typeof gitPorts.createGitScopedCommit !== 'function' ? 'Requires Git 05 merge and activated release; no substitute Git writer' : false }, async t => {
  const f = fixture(t); trackedLegacy(f);
  const scan = checkStopped({ workspaces: [f.repo], hostBin });
  if (scan.status !== 'clean') { t.skip(`real host quiesce required: ${scan.detail}`); return; }
  const oldHost = process.env.FGOS_HOST_BIN, oldState = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_HOST_BIN = hostBin; process.env.FGOS_STATE_ROOT = f.stateRoot;
  t.after(() => {
    if (oldHost === undefined) delete process.env.FGOS_HOST_BIN; else process.env.FGOS_HOST_BIN = oldHost;
    if (oldState === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = oldState;
  });
  f.git('config', 'core.hooksPath', path.join(root, '.githooks'));
  const result = await migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' });
  assert.equal(result.commit.status, 'committed');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.repo, '.fgos/events'))), result.pin);
  for (const p of result.plan.deletions) assert.equal(fs.existsSync(path.join(f.repo, p)), false, p);
  assert.equal(fs.readFileSync(path.join(f.repo, '.gitattributes'), 'utf8'), '*.txt text\n');
  assert.equal((await migrateUseCase({ ...f.ctx, hostBin, writer: 'fixture' })).unchanged, true);
  assert.throws(() => fs.writeFileSync(path.join(f.repo, '.fgos/events/old-release.jsonl'), ''), { code: 'ENOTDIR' });
});
