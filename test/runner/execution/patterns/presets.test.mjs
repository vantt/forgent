import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, resolvePattern } from '../../../../src/runner/execution/patterns/presets.mjs';

test('PRESETS contains standard named presets with immutable shapes', () => {
  assert.ok(PRESETS['code-change'], 'code-change preset exists');
  assert.equal(PRESETS['code-change'].pattern, 'reviewed');
  assert.deepEqual(PRESETS['code-change'].params.minCheckers, ['reviewer', 'red-team']);
  assert.equal(PRESETS['code-change'].params.verify, 'npm test');

  assert.ok(PRESETS['consult'], 'consult preset exists');
  assert.equal(PRESETS['consult'].pattern, 'solo');

  assert.ok(PRESETS['research-fan-out'], 'research-fan-out preset exists');
  assert.equal(PRESETS['research-fan-out'].pattern, 'panel');
  assert.equal(PRESETS['research-fan-out'].params.members, 3);

  assert.ok(PRESETS['rfc'], 'rfc preset exists');
  assert.equal(PRESETS['rfc'].pattern, 'reviewed');
  assert.equal(PRESETS['rfc'].params.maxRounds, 1);
});

test('resolvePattern resolves preset names to patternName and params', () => {
  const resolved = resolvePattern('code-change');
  assert.equal(resolved.patternName, 'reviewed');
  assert.deepEqual(resolved.params.minCheckers, ['reviewer', 'red-team']);
  assert.equal(resolved.params.verify, 'npm test');
});

test('resolvePattern resolves direct pattern names with empty params', () => {
  assert.deepEqual(resolvePattern('solo'), { patternName: 'solo', params: {} });
  assert.deepEqual(resolvePattern('reviewed'), { patternName: 'reviewed', params: {} });
  assert.deepEqual(resolvePattern('panel'), { patternName: 'panel', params: {} });
});

test('resolvePattern resolves object specifications and merges overrides', () => {
  const custom = resolvePattern({ pattern: 'reviewed', params: { maxRounds: 3 } });
  assert.equal(custom.patternName, 'reviewed');
  assert.equal(custom.params.maxRounds, 3);

  const presetOverride = resolvePattern({ pattern: 'code-change', params: { maxRounds: 5 } });
  assert.equal(presetOverride.patternName, 'reviewed');
  assert.equal(presetOverride.params.maxRounds, 5);
  assert.deepEqual(presetOverride.params.minCheckers, ['reviewer', 'red-team']);
});

test('resolvePattern defaults to solo when falsy', () => {
  assert.deepEqual(resolvePattern(null), { patternName: 'solo', params: {} });
  assert.deepEqual(resolvePattern(undefined), { patternName: 'solo', params: {} });
  assert.deepEqual(resolvePattern(''), { patternName: 'solo', params: {} });
});
