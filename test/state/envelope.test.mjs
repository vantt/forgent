import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapEnvelope } from '../../src/state/envelope.mjs';

test('wrapEnvelope returns exactly the four contract fields', () => {
  const envelope = wrapEnvelope({ id: 'x' });
  assert.deepEqual(Object.keys(envelope).sort(), ['contract', 'data', 'data_hash', 'generated_at']);
});

test('wrapEnvelope sets contract to fgos.v1 and echoes data unchanged', () => {
  const data = { id: 'x', title: 'Title' };
  const envelope = wrapEnvelope(data);
  assert.equal(envelope.contract, 'fgos.v1');
  assert.deepEqual(envelope.data, data);
});

test('wrapEnvelope sets generated_at to a valid ISO timestamp', () => {
  const envelope = wrapEnvelope({ id: 'x' });
  assert.equal(envelope.generated_at, new Date(envelope.generated_at).toISOString());
});

test('wrapEnvelope data_hash changes when data changes', () => {
  const a = wrapEnvelope({ id: 'x', title: 'A' });
  const b = wrapEnvelope({ id: 'x', title: 'B' });
  assert.notEqual(a.data_hash, b.data_hash);
});

test('wrapEnvelope data_hash is stable for deep-equal data', () => {
  const a = wrapEnvelope({ id: 'x', title: 'A', deps: [1, 2] });
  const b = wrapEnvelope({ id: 'x', title: 'A', deps: [1, 2] });
  assert.equal(a.data_hash, b.data_hash);
});
