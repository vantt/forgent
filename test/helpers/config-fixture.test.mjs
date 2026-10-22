import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readSharedConfig } from '../../src/config/shared-config-file.mjs';
import { loadGlobalConfig } from '../../src/config/global-config.mjs';
import {
  globalConfigPath,
  projectConfigPath,
  writeGlobalConfig,
  writeProjectConfig,
  writeRawGlobalConfig,
  writeRawProjectConfig,
} from './config-fixture.mjs';

const mkTemp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-config-fixture-'));

// Known raw-write exceptions: tests that need a config file the helper's
// object writers cannot express (exact bytes, a non-config file of the same
// name, or a write through the product path under test) are listed here,
// with the reason, and are the only test files the architecture guard allows
// to write `config.json` outside this module. Currently none.

test('a config written by the helper is read back equal by the product reader, for both scopes', () => {
  const value = { runner: { timeoutMs: 5000 }, nested: { list: [1, 'two', { three: 3 }] } };
  const dir = mkTemp();
  const home = mkTemp();
  writeProjectConfig(dir, value);
  writeGlobalConfig(home, value);
  assert.deepEqual(readSharedConfig(dir), value);
  assert.deepEqual(loadGlobalConfig(globalConfigPath(home)), value);
  assert.equal(projectConfigPath(dir), path.join(dir, '.fgos', 'config.json'));
});

test('a raw write reaches the product reader byte for byte, and malformed text raises the reader parse error', () => {
  const dir = mkTemp();
  const home = mkTemp();
  writeRawProjectConfig(dir, '{ not json');
  writeRawGlobalConfig(home, '{"a":1}');
  assert.equal(fs.readFileSync(projectConfigPath(dir), 'utf8'), '{ not json');
  assert.equal(fs.readFileSync(globalConfigPath(home), 'utf8'), '{"a":1}');
  assert.throws(() => readSharedConfig(dir), /cannot parse shared config/);
  assert.deepEqual(loadGlobalConfig(globalConfigPath(home)), { a: 1 });
});
