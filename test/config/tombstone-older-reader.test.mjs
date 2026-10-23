import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readSharedConfig } from '../../src/config/shared-config-file.mjs';
import { ensureRunnerConfigForDir, loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';

// What a migrated project's `.fgos/config.json` holds (docs/platform/config/spec.md section 13).
const TOMBSTONE = 'moved to .fgos/config.yaml; upgrade fgOS\n';

// Today's Node readers stand in for an older release: each must refuse the tombstone loudly and
// must not write a fresh `config.json` (which would start an unconfined default executor) nor a
// `config.yaml` of its own.
test('an older release refuses a migrated project and writes no config file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-tombstone-'));
  const fgos = path.join(dir, '.fgos');
  fs.mkdirSync(fgos, { recursive: true });
  fs.writeFileSync(path.join(fgos, 'config.json'), TOMBSTONE);
  fs.writeFileSync(path.join(fgos, 'config.yaml'), '# @fgos:v1\n');
  const before = fs.readdirSync(fgos).sort();

  assert.throws(() => readSharedConfig(dir), /cannot parse shared config at ".*config\.json"/);
  assert.throws(() => loadRunnerConfigFromDir(dir), /config\.json" is not valid JSON/);
  assert.throws(() => ensureRunnerConfigForDir(dir), SyntaxError);

  assert.deepEqual(fs.readdirSync(fgos).sort(), before, 'no file was created or removed');
  assert.equal(fs.readFileSync(path.join(fgos, 'config.json'), 'utf8'), TOMBSTONE);
  assert.equal(fs.readFileSync(path.join(fgos, 'config.yaml'), 'utf8'), '# @fgos:v1\n');
});
