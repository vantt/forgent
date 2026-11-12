// The error-category exit codes live in one versioned JSON table (packages/host-runtime/contracts/exit-codes.v1.json). The Node shell reads
// it through src/cli/exit-codes.mjs and the Rust host embeds the same file (apps/fgos/src/exit_codes.rs, whose own
// test reads every category back). One table, two readers: this file owns the Node reader and the rule that the host
// names no literal error exit status of its own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { EXIT_CODES } from '../../src/cli/exit-codes.mjs';
import { categoryOf } from '../../src/state/store-error.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages', 'host-runtime', 'contracts', 'exit-codes.v1.json'), 'utf8'));

test('the table is version 1 and the Node reader exposes every category it names, with the same code', () => {
  assert.equal(table.version, 1);
  assert.equal(table.ok, 0);
  assert.equal(table.unexpected, 1);
  assert.ok(Object.keys(table.categories).length > 0);
  assert.deepEqual({ ...EXIT_CODES }, table.categories);
  assert.ok(Object.isFrozen(EXIT_CODES));
  for (const code of Object.values(table.categories)) {
    assert.ok(code > 1 && code !== 6, `category code ${code} collides with ok, unexpected or the runner's busy code`);
  }
});

test('an error carries its category through .category; anything else is unexpected', () => {
  assert.equal(categoryOf({ category: 'conflict' }), 'conflict');
  assert.equal(categoryOf(new Error('x')), 'unexpected');
  assert.equal(categoryOf(null), 'unexpected');
  assert.equal(categoryOf({ category: 3 }), 'unexpected');
});

test('the Rust host names no literal exit status: main.rs and the mailbox verbs read the table', () => {
  const sources = [
    'apps/fgos/src/main.rs',
    'apps/fgos/src/wiring/mailbox_verbs.rs',
    'apps/fgos/src/wiring/mailbox_verbs_unsupported.rs',
  ];
  for (const file of sources) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(source, /process::exit\(\s*\d+\s*\)/, `${file} exits with a literal status`);
    assert.doesNotMatch(source, /const EXIT_\w+:\s*i32\s*=\s*\d/, `${file} declares a literal exit status`);
  }
});
