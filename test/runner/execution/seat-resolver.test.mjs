import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SEAT_ROLES, resolveSeats, checkDeclaredSeats, effectiveRigorOf, capabilityRigorOf, checkerSeatsOf,
  requiresDistinctFamilies, seatLaunchesOf, seatKind, assertNoSeatTier,
} from '../../../src/runner/execution/seat-resolver.mjs';
import { CHECKER_SEATS, VALID_CHECKER_SEATS, MODEL_POLICY_TIERS } from '../../../src/runner/dispatch/config.mjs';
import { isVerdictSeat } from '../../../src/runner/dispatch/agent-result-claim-contract.mjs';

const unit = { id: 'u', capability: 'docs:write', objective: 'x', writes: [] };

test('the role vocabulary is the five roles', () => {
  assert.deepEqual([...SEAT_ROLES], ['producer', 'synthesizer', 'reviewer', 'red-team', 'judge']);
});

test('solo is one producer seat; reviewed is the producer plus one seat per checker, in order', () => {
  const [solo] = resolveSeats({ pattern: 'solo', unit: { ...unit, writes: ['a.md'] }, runnerConfig: {} });
  assert.deepEqual({ seat: solo.seat, role: solo.role }, { seat: 'producer', role: 'producer' });
  assert.deepEqual(
    { writer: solo.posture.writer, inlineAllowed: solo.posture.inlineAllowed, readOnly: solo.posture.readOnly },
    { writer: true, inlineAllowed: true, readOnly: false },
  );
  const seats = resolveSeats({ pattern: 'reviewed', unit: { ...unit, rigor: 'high' }, runnerConfig: {} });
  assert.deepEqual(seats.map((s) => [s.seat, s.role]), [['producer', 'producer'], ['reviewer', 'reviewer'], ['red-team', 'red-team']]);
  for (const checker of seats.slice(1)) {
    assert.equal(checker.posture.forceOutOfProcess, true);
    assert.equal(checker.posture.readOnly, true);
    assert.equal(checker.posture.inlineAllowed, false);
  }
});

test('tester is a checker seat whose role is reviewer for taste lookup, and whose result is not a verdict', () => {
  assert.deepEqual([...VALID_CHECKER_SEATS], ['reviewer', 'red-team', 'tester']);
  assert.deepEqual(CHECKER_SEATS.tester, { role: 'reviewer', verdict: false });
  const seats = resolveSeats({ pattern: { pattern: 'reviewed', params: { minCheckers: ['tester'] } }, unit, runnerConfig: {} });
  const tester = seats.find((s) => s.seat === 'tester');
  assert.equal(tester.role, 'reviewer');
  assert.equal(tester.posture.verdict, false);
  assert.equal(seats.find((s) => s.seat === 'reviewer').posture.verdict, true);
  // The result contract follows the posture: a verdict seat owes an assessment, tester does not, whatever the role.
  assert.equal(isVerdictSeat({ role: tester.role, posture: tester.posture }), false);
  assert.equal(isVerdictSeat({ role: 'reviewer', posture: seats[1].posture }), true);
  // An assignment with no posture (a domain operation) keeps reading its declared role.
  assert.equal(isVerdictSeat({ role: 'red-team' }), true);
  assert.equal(isVerdictSeat({ role: 'implementer' }), false);
});

test('a checker name that is not a checker seat is refused', () => {
  assert.throws(() => checkerSeatsOf(unit, {}, { minCheckers: ['planner'] }), /not a checker seat/);
});

test('effective rigor is the stronger of the unit and the capability, the capability read by exact key, then prefix; the bare verb is no key', () => {
  const cfg = { capabilities: { 'docs:write': { rigor: 'high' }, 'code:*': { rigor: 'critical' }, review: { rigor: 'standard' } } };
  assert.equal(effectiveRigorOf({ capability: 'docs:write', rigor: 'low' }, cfg), 'high');
  assert.equal(effectiveRigorOf({ capability: 'docs:write', rigor: 'critical' }, cfg), 'critical');
  assert.equal(effectiveRigorOf({ capability: 'code:implement' }, cfg), 'critical', 'the prefix entry covers a capability with no entry of its own');
  assert.equal(capabilityRigorOf(cfg, 'docs:other'), undefined);
  assert.equal(capabilityRigorOf(cfg, 'x:review'), undefined, 'the bare verb of a capability is not consulted');
  assert.equal(effectiveRigorOf({ capability: 'none:none' }, cfg), undefined);
  assert.equal(effectiveRigorOf({ capability: 'none:none' }, cfg, { fallback: 'standard' }), 'standard');
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write' }, cfg), true);
  assert.equal(requiresDistinctFamilies({ capability: 'none:none', rigor: 'standard' }, cfg), false);
  // The checker set and the family rule both follow effective rigor, so capability rigor adds checkers.
  assert.deepEqual(checkerSeatsOf({ capability: 'docs:write' }, cfg), ['reviewer', 'red-team']);
});

test('panel and debate need declared seats with the right multiplicities; ids are unique', () => {
  assert.throws(() => resolveSeats({ pattern: 'panel', unit, runnerConfig: {} }), /must declare its seats/);
  assert.throws(() => resolveSeats({ pattern: 'debate', unit, runnerConfig: {} }), /must declare its seats/);
  assert.throws(() => resolveSeats({ pattern: 'panel', unit: { ...unit, seats: [{ seat: 'a', role: 'producer' }] }, runnerConfig: {} }), /synthesizer/);
  assert.throws(() => resolveSeats({ pattern: 'debate', unit: { ...unit, seats: [{ seat: 'a', role: 'producer' }, { seat: 'j', role: 'judge' }] }, runnerConfig: {} }), /role "producer"/);
  assert.throws(() => checkDeclaredSeats([{ seat: 'a', role: 'producer' }, { seat: 'a', role: 'synthesizer' }]), /declared twice/);
  assert.throws(() => checkDeclaredSeats([{ seat: 'a', role: 'panelist' }]), /role must be one of/);
  assert.throws(() => checkDeclaredSeats([{ seat: 'a', role: 'producer', prefer: ['x'] }]), /unknown key "prefer"/);
  assert.throws(() => checkDeclaredSeats([{ seat: 'a', role: 'producer', executor: 'x' }]), /unknown key "executor"/);
  assert.throws(() => checkDeclaredSeats([{ seat: 'a', role: 'producer', tier: 'huge' }], 'seats', { tiers: MODEL_POLICY_TIERS }), /tier must be one of/);
  const [ok] = checkDeclaredSeats([{ seat: 'a', role: 'producer', persona: 'p', tier: 'frontier' }]);
  assert.deepEqual(ok, { seat: 'a', role: 'producer', persona: 'p', tier: 'frontier' });
});

test('panel members carry the panel posture; a reviewed unit refuses declared seats', () => {
  const seats = resolveSeats({
    pattern: 'panel', runnerConfig: {},
    unit: { ...unit, seats: [{ seat: 'one', role: 'producer', persona: 'lens' }, { seat: 'two', role: 'producer' }, { seat: 'chair', role: 'synthesizer' }] },
  });
  assert.deepEqual(seats.map((s) => s.seat), ['one', 'two', 'chair']);
  assert.equal(seats[0].persona, 'lens');
  assert.deepEqual(
    { stance: seats[0].posture.stance, forceOutOfProcess: seats[0].posture.forceOutOfProcess, inlineAllowed: seats[0].posture.inlineAllowed, writer: seats[0].posture.writer },
    { stance: true, forceOutOfProcess: true, inlineAllowed: false, writer: false },
  );
  assert.equal(seats[2].posture.stance, false);
  assert.deepEqual(seats.map(seatKind), ['panelist', 'panelist', 'synthesizer']);
  
  const reviewedUnit = (seats, extra = {}) => ({ ...unit, ...extra, seats });
  const high = { rigor: 'high' };
  const declaredOk = resolveSeats({ pattern: 'reviewed', runnerConfig: {}, unit: reviewedUnit([
    { seat: 'author', role: 'producer' }, { seat: 'security', role: 'red-team' }, { seat: 'quality', role: 'reviewer' },
  ], high) });
  assert.deepEqual(declaredOk.map((s) => [s.seat, s.role, s.posture.verdict]), [['author', 'producer', false], ['security', 'red-team', true], ['quality', 'reviewer', true]]);
  // A tester is a reviewer-role seat whose result is no verdict: declared seats take their posture from the required checker.
  const withTester = resolveSeats({ pattern: { pattern: 'reviewed', params: { minCheckers: ['tester'] } }, runnerConfig: {}, unit: reviewedUnit([
    { seat: 'p', role: 'producer' }, { seat: 'r1', role: 'reviewer' }, { seat: 'r2', role: 'reviewer' },
  ]) });
  assert.deepEqual(withTester.map((s) => s.posture.verdict), [false, true, false]);
  const refuse = (seats, extra, re) => assert.throws(() => resolveSeats({ pattern: 'reviewed', runnerConfig: {}, unit: reviewedUnit(seats, extra) }), re);
  refuse([{ seat: 'p', role: 'producer' }], high, /missing \[reviewer, red-team\]/);
  refuse([{ seat: 'p', role: 'producer' }, { seat: 'r', role: 'reviewer' }, { seat: 'j', role: 'judge' }], {}, /extra \[judge\]/);
  refuse([{ seat: 'p', role: 'producer' }, { seat: 'r', role: 'reviewer' }, { seat: 'x', role: 'red-team' }], {}, /extra \[red-team\]/);
  refuse([{ seat: 'r', role: 'reviewer' }], {}, /exactly one seat with role "producer"/);
  refuse([{ seat: '../p', role: 'producer' }, { seat: 'r', role: 'reviewer' }], {}, /seat/);
});

test('admission counts launches from the same seats the run binds', () => {
  const cfg = { patterns: { reviewed: { maxRounds: 2 } } };
  assert.equal(seatLaunchesOf({ pattern: 'solo', unit, runnerConfig: cfg }), 1);
  assert.equal(seatLaunchesOf({ pattern: 'reviewed', unit: { ...unit, rigor: 'high' }, runnerConfig: cfg }), 6);
  assert.equal(seatLaunchesOf({ pattern: 'research-fan-out', unit, runnerConfig: cfg }), 4);
  assert.equal(seatLaunchesOf({ pattern: 'unheard-of', unit, runnerConfig: cfg }), null);
});

test('a seat tier from a file source is refused by name; a registered definition keeps it', () => {
  assert.throws(() => assertNoSeatTier([{ seat: 'a', role: 'producer', tier: 'frontier' }], 'a units file'), /cannot carry seats\[\]\.tier/);
  assert.doesNotThrow(() => assertNoSeatTier([{ seat: 'a', role: 'producer' }], 'a units file'));
});
