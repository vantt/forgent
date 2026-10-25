import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, resolvePattern } from '../../../../src/runner/execution/patterns/presets.mjs';
import { roleUnit } from '../../../../src/runner/execution/loops/role-tasks.mjs';

const FAN_OUT_SEATS = [
  { seat: 'researcher-1', role: 'producer' },
  { seat: 'researcher-2', role: 'producer' },
  { seat: 'researcher-3', role: 'producer' },
  { seat: 'synthesizer', role: 'synthesizer' },
];

test('PRESETS contains standard named presets with immutable shapes', () => {
  assert.ok(PRESETS['code-change'], 'code-change preset exists');
  assert.equal(PRESETS['code-change'].pattern, 'reviewed');
  assert.deepEqual(PRESETS['code-change'].params.minCheckers, ['reviewer', 'red-team']);
  assert.equal('verify' in PRESETS['code-change'].params, false, 'a preset pins no verify command: it comes from the unit');

  assert.ok(PRESETS['consult'], 'consult preset exists');
  assert.equal(PRESETS['consult'].pattern, 'solo');
  assert.deepEqual(PRESETS['consult'].params.seats, [{ seat: 'advisor', role: 'producer' }]);

  assert.ok(PRESETS['research-fan-out'], 'research-fan-out preset exists');
  assert.equal(PRESETS['research-fan-out'].pattern, 'panel');
  assert.deepEqual(PRESETS['research-fan-out'].params.seats, FAN_OUT_SEATS);
  assert.equal('members' in PRESETS['research-fan-out'].params, false, 'a preset names its seats, not a member count');

  assert.ok(PRESETS['research-fan-out-gated'], 'research-fan-out-gated preset exists');
  assert.equal(PRESETS['research-fan-out-gated'].pattern, 'panel');
  assert.deepEqual(PRESETS['research-fan-out-gated'].params.seats, FAN_OUT_SEATS);
  assert.equal('members' in PRESETS['research-fan-out-gated'].params, false, 'a preset names its seats, not a member count');
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
  assert.equal(resolvedCodeChange.params.verify, undefined);

  const resolvedConsult = resolvePattern('consult');
  assert.equal(resolvedConsult.patternName, 'solo');
  assert.deepEqual(resolvedConsult.params.seats, [{ seat: 'advisor', role: 'producer' }]);

  const resolvedResearch = resolvePattern('research-fan-out');
  assert.equal(resolvedResearch.patternName, 'panel');
  assert.deepEqual(resolvedResearch.params.seats, FAN_OUT_SEATS);

  const resolvedGated = resolvePattern('research-fan-out-gated');
  assert.equal(resolvedGated.patternName, 'panel');
  assert.deepEqual(resolvedGated.params.seats, FAN_OUT_SEATS);
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

test('rfc checkers are briefed on the supplied artifact and the producer report, not the latest commit', () => {
  const { params } = resolvePattern('rfc');
  const unit = { id: 'u1', capability: 'advise', objective: 'Red-team the proposal in docs/pricing-v2.md' };
  for (const seat of ['reviewer', 'red-team']) {
    const { objective } = roleUnit(unit, { seat, params });
    assert.ok(objective.includes(unit.objective), `${seat} still sees the original task`);
    assert.match(objective, /Context refs/, `${seat} is pointed at the producer report`);
    assert.doesNotMatch(objective, /git log|git show/, `${seat} is not sent to the latest commit`);
    assert.match(objective, /do not change any file/i);
  }
  assert.notEqual(roleUnit(unit, { seat: 'reviewer', params }).objective, roleUnit(unit, { seat: 'red-team', params }).objective);
});
