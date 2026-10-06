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
  assert.equal(PRESETS['consult'].params.role, 'advisor');

  assert.ok(PRESETS['research-fan-out'], 'research-fan-out preset exists');
  assert.equal(PRESETS['research-fan-out'].pattern, 'panel');
  assert.equal(PRESETS['research-fan-out'].params.members, 3);
  assert.equal(PRESETS['research-fan-out'].params.role, 'researcher');
  assert.equal(PRESETS['research-fan-out'].params.synthesizeRole, 'synthesizer');

  assert.ok(PRESETS['research-fan-out-gated'], 'research-fan-out-gated preset exists');
  assert.equal(PRESETS['research-fan-out-gated'].pattern, 'panel');
  assert.equal(PRESETS['research-fan-out-gated'].params.members, 3);
  assert.equal(PRESETS['research-fan-out-gated'].params.role, 'researcher');
  assert.equal(PRESETS['research-fan-out-gated'].params.synthesizeRole, 'synthesizer');
  assert.equal(PRESETS['research-fan-out-gated'].params.gated, true);

  assert.ok(PRESETS['rfc'], 'rfc preset exists');
  assert.equal(PRESETS['rfc'].pattern, 'reviewed');
  assert.equal(PRESETS['rfc'].params.maxRounds, 1);
  assert.deepEqual(PRESETS['rfc'].params.minCheckers, ['reviewer', 'red-team']);
});

test('resolvePattern resolves preset names to patternName and params', () => {
  const resolvedCodeChange = resolvePattern('code-change');
  assert.equal(resolvedCodeChange.patternName, 'reviewed');
  assert.deepEqual(resolvedCodeChange.params.minCheckers, ['reviewer', 'red-team']);
  assert.equal(resolvedCodeChange.params.verify, 'npm test');

  const resolvedConsult = resolvePattern('consult');
  assert.equal(resolvedConsult.patternName, 'solo');
  assert.equal(resolvedConsult.params.role, 'advisor');

  const resolvedResearch = resolvePattern('research-fan-out');
  assert.equal(resolvedResearch.patternName, 'panel');
  assert.equal(resolvedResearch.params.members, 3);
  assert.equal(resolvedResearch.params.role, 'researcher');
  assert.equal(resolvedResearch.params.synthesizeRole, 'synthesizer');

  const resolvedGated = resolvePattern('research-fan-out-gated');
  assert.equal(resolvedGated.patternName, 'panel');
  assert.equal(resolvedGated.params.members, 3);
  assert.equal(resolvedGated.params.role, 'researcher');
  assert.equal(resolvedGated.params.synthesizeRole, 'synthesizer');
  assert.equal(resolvedGated.params.gated, true);

  const resolvedRfc = resolvePattern('rfc');
  assert.equal(resolvedRfc.patternName, 'reviewed');
  assert.equal(resolvedRfc.params.maxRounds, 1);
  assert.deepEqual(resolvedRfc.params.minCheckers, ['reviewer', 'red-team']);
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
