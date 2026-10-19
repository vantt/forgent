import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
// Independent ECMAScript reference: sort UTF-16 keys and stringify primitives.
function canonical(v) {
  if (Array.isArray(v)) return `[${v.map(canonical).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v).sort().map(k => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`;
  return JSON.stringify(v);
}
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
test('canonical leaf vectors match ECMAScript numbers and UTF-16 key order', () => {
  for (const { input, rawInput, canonical: expected } of read('../../packages/canonical-json/contracts/vectors/canonical.v1.json')) {
    assert.equal(canonical(rawInput === undefined ? input : JSON.parse(rawInput)), expected);
  }
});
test('event hash vectors include exactly one newline and exclude h', () => {
  for (const v of read('../../packages/event-store/contracts/vectors/canonical-hash.v1.json')) {
    const input = v.rawInput === undefined ? v.input : JSON.parse(v.rawInput);
    const bytes = canonical(input) + '\n';
    assert.equal(bytes, v.canonicalWithoutHash);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), v.h);
    assert.equal(canonical({ ...input, h: v.h }) + '\n', v.canonical);
  }
});

test('batch and seal records share canonical bytes and digest vectors', () => {
  for (const v of read('../../packages/event-store/contracts/vectors/records.v1.json')) {
    const bytes = canonical(v.input) + '\n';
    assert.equal(bytes,v.canonical);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),v.sha256);
  }
});
