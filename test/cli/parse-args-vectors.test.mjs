// test/cli/parse-args-vectors.test.mjs — the Node argument parser answers every row of the shared vector file; the
// Rust parser (packages/host-runtime/rust/src/cli_args.rs) answers the same rows, so the two read a call alike.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs } from '../../src/cli/parse-args.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const { rows } = JSON.parse(fs.readFileSync(path.join(here, '../rust-host/fixtures/parse-args-vectors.json'), 'utf8'));

test('the vector file has rows', () => {
  assert.ok(rows.length > 0);
});

for (const row of rows) {
  test(`parseArgs: ${row.name}`, () => {
    const { flags, positional } = parseArgs(row.argv);
    assert.deepEqual({ flags: { ...flags }, positional }, { flags: row.flags, positional: row.positional }, `row "${row.name}" argv ${JSON.stringify(row.argv)}`);
    if (row.keys) assert.deepEqual(Object.keys(flags), row.keys, `row "${row.name}" key order`);
  });
}
