import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture } from './land-fixture.mjs';
import { createGitNativeLockRepair, createGitSafeRestore } from '../../src/git/index.mjs';

test('native repair transports an inspection report and preserves an unknown external index lock', () => {
  const f = fixture();
  try {
    const restore = createGitSafeRestore(f.options, f.loader);
    restore.apply({ operationId: 'restore', request: { expectedHead: f.request.target, target: f.request.source, reason: 'fixture' } });
    const lock = path.join(f.repo, '.git/index.lock');
    fs.writeFileSync(lock, 'external bytes');
    const port = createGitNativeLockRepair(f.options, f.loader);
    const report = port.repairNativeIndexLock({ operationId: 'restore' });
    assert.equal(report.status, 'inspectedRepairRequired');
    assert.match(report.inspection, /unknown external/);
    assert.match(report.inspection, /size=14 bytes; mtimeUnix=.*age=/);
    assert.match(report.inspection, /visible holders=/);
    assert.match(report.inspection, /Move, never delete/);
    assert.match(report.inspection, /Never repeat the old attempt/);
    assert.equal(report.path, lock);
    assert.ok(report.observedInode > 0);
    assert.match(report.observedState, /^[0-9a-f]{64}$/);
    assert.equal(fs.readFileSync(lock, 'utf8'), 'external bytes');
    fs.unlinkSync(lock); fs.symlinkSync('missing-external-target', lock);
    assert.equal(port.repairNativeIndexLock({ operationId: 'restore' }).status, 'inspectedRepairRequired');
    assert.equal(fs.lstatSync(lock).isSymbolicLink(), true);
  } finally { f.close(); }
});
