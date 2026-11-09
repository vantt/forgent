// The predecessor kill wait is decided once, by the holder-lock crate
// (packages/holder-lock/rust/src/port.rs); Node reads it through the door and
// restates no number. This is the door's one wiring proof.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { doorKillWaitMs } from '../../src/holder-lock/driver.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the kill wait Node uses is the crate constant, and no Node file restates it', () => {
  const crate = fs.readFileSync(path.join(root, 'packages', 'holder-lock', 'rust', 'src', 'port.rs'), 'utf8');
  const declared = Number(/pub const DEFAULT_KILL_WAIT_MS: u64 = (\d+);/.exec(crate)?.[1]);
  assert.ok(declared > 0, 'the crate declares the constant');
  assert.equal(doorKillWaitMs(), declared);
  const protocol = fs.readFileSync(path.join(root, 'src', 'holder-lock', 'protocol.mjs'), 'utf8');
  assert.doesNotMatch(protocol, /KILL_WAIT/, 'protocol.mjs carries no kill-wait literal');
});
