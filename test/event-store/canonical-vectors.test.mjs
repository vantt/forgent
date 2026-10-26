import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// The vectors are the one table; the bytes come from the crate through the door.
import { canonicalJson as canonical } from '../../src/native/door.mjs';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
test('canonical leaf vectors match ECMAScript numbers and UTF-16 key order', () => {
  for (const { input, rawInput, canonical: expected } of read('../../packages/canonical-json/contracts/vectors/canonical.v1.json')) {
    assert.equal(canonical(rawInput === undefined ? input : JSON.parse(rawInput)), expected);
  }
});
