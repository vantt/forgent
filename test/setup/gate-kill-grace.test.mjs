// The dispatch.gateKillGraceMs and dispatch.cancelWaitMs readers: the merge order and the refusal of an unusable value.
import '../helpers/process-tmp-root.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readGateKillGraceMs, readCancelWaitMs } from '../../src/run-supervisor/gate-kill-grace.mjs';
import { isConfigRefusal } from '../../src/config/facade.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

let scratch;
before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rsc-'));
});
after(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

function workspace(name) {
  const root = path.join(scratch, name);
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  return root;
}

test('the gate kill grace reader follows the same merge and refuses an unusable value', () => {
  const root = workspace('grace-reader');
  assert.equal(readGateKillGraceMs({ projectRoot: root }), 10_000);
  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 3000 } });
  assert.equal(readGateKillGraceMs({ projectRoot: root }), 3000);
  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 10 } });
  assert.throws(() => readGateKillGraceMs({ projectRoot: root }), (err) => isConfigRefusal(err) && /dispatch\.gateKillGraceMs/.test(err.message));
});


test('the cancel wait reader shares the gate kill grace merge and refuses an unusable value', () => {
  const root = workspace('cancel-wait-reader');
  assert.equal(readCancelWaitMs({ projectRoot: root }), 15_000);
  writeProjectConfig(root, { dispatch: { gateKillGraceMs: 3000 } });
  assert.equal(readCancelWaitMs({ projectRoot: root }), 15_000, 'the wait is a literal, not derived from the grace');
  writeProjectConfig(root, { dispatch: { cancelWaitMs: 10 } });
  assert.throws(() => readCancelWaitMs({ projectRoot: root }), (err) => isConfigRefusal(err) && /dispatch\.cancelWaitMs/.test(err.message));
});
