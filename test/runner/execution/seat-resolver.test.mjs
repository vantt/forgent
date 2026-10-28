import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SEAT_ROLES, resolveSeats, checkDeclaredSeats, effectiveRigorOf, capabilityRigorOf,
  requiresDistinctFamilies, seatLaunchesOf, seatKind, assertNoSeatTier, bindSeatOf, PRODUCER_POSTURE,
  checkerPlanOf, RESERVED_SEAT_IDS, DEFAULT_CAPABILITY_MIN_CHECKERS,
} from '../../../src/runner/execution/seat-resolver.mjs';
import { CHECKER_SEATS, VALID_CHECKER_SEATS, MODEL_POLICY_TIERS } from '../../../src/runner/dispatch/config.mjs';
import { shippedCatalog } from '../../../src/runner/dispatch/shipped-catalog.mjs';

const shippedCheckersByRigor = shippedCatalog().loops.reviewed.checkersByRigor;
import { isVerdictSeat } from '../../../src/runner/dispatch/agent-result-claim-contract.mjs';

const unit = { id: 'u', capability: 'docs:write', objective: 'x', writes: [] };

test('the role vocabulary is the five roles', () => {
  assert.deepEqual([...SEAT_ROLES], ['producer', 'synthesizer', 'reviewer', 'red-team', 'judge']);
});

test('solo is one producer seat; reviewed is the producer plus one seat per checker, in order', () => {
  const [solo] = resolveSeats({ pattern: 'solo', unit: { ...unit, writes: ['a.md'] }, runnerConfig: {} });
  assert.deepEqual({ seat: solo.seat, role: solo.role }, { seat: 'producer', role: 'producer' });
  assert.deepEqual(
    { writer: solo.posture.writer, readOnly: solo.posture.readOnly },
    { writer: true, readOnly: false },
  );
  const seats = resolveSeats({ pattern: 'reviewed', unit: { ...unit, rigor: 'high' }, runnerConfig: {}, shippedCheckersByRigor });
  assert.deepEqual(seats.map((s) => [s.seat, s.role]), [['producer', 'producer'], ['reviewer', 'reviewer'], ['red-team', 'red-team']]);
  for (const checker of seats.slice(1)) {
    assert.equal(checker.posture.forceOutOfProcess, true);
    assert.equal(checker.posture.readOnly, true);
  }
});

test('tester is a checker seat whose role is reviewer for taste lookup, and whose result is not a verdict', () => {
  assert.deepEqual([...VALID_CHECKER_SEATS], ['reviewer', 'red-team', 'tester']);
  assert.deepEqual(CHECKER_SEATS.tester, { role: 'reviewer', verdict: false });
  const seats = resolveSeats({ pattern: { pattern: 'reviewed', params: { minCheckers: ['tester'] } }, unit, runnerConfig: {}, shippedCheckersByRigor });
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
  assert.throws(
    () => checkerPlanOf(unit, {}, { requested: ['planner'], shippedCheckersByRigor }),
    (err) => err.code === 'param-invalid' && /not a checker seat/.test(err.message),
  );
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
  assert.deepEqual(checkerPlanOf({ capability: 'docs:write' }, cfg, { shippedCheckersByRigor }).map((c) => c.seat), ['reviewer', 'red-team']);
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
    { stance: seats[0].posture.stance, forceOutOfProcess: seats[0].posture.forceOutOfProcess, writer: seats[0].posture.writer },
    { stance: true, forceOutOfProcess: true, writer: false },
  );
  assert.equal(seats[2].posture.stance, false);
  assert.deepEqual(seats.map(seatKind), ['panelist', 'panelist', 'synthesizer']);
  
  const reviewedUnit = (seats, extra = {}) => ({ ...unit, ...extra, seats });
  const high = { rigor: 'high' };
  const declaredOk = resolveSeats({ pattern: 'reviewed', runnerConfig: {}, shippedCheckersByRigor, unit: reviewedUnit([
    { seat: 'author', role: 'producer' }, { seat: 'security', role: 'red-team' }, { seat: 'quality', role: 'reviewer' },
  ], high) });
  assert.deepEqual(declaredOk.map((s) => [s.seat, s.role, s.posture.verdict]), [['author', 'producer', false], ['security', 'red-team', true], ['quality', 'reviewer', true]]);
  // A tester is a reviewer-role seat whose result is no verdict: declared seats take their posture from the required checker.
  const withTester = resolveSeats({ pattern: { pattern: 'reviewed', params: { minCheckers: ['tester'] } }, runnerConfig: {}, shippedCheckersByRigor, unit: reviewedUnit([
    { seat: 'p', role: 'producer' }, { seat: 'r1', role: 'reviewer' }, { seat: 'r2', role: 'reviewer' },
  ]) });
  assert.deepEqual(withTester.map((s) => s.posture.verdict), [false, true, false]);
  const refuse = (seats, extra, re) => assert.throws(() => resolveSeats({ pattern: 'reviewed', runnerConfig: {}, shippedCheckersByRigor, unit: reviewedUnit(seats, extra) }), re);
  refuse([{ seat: 'p', role: 'producer' }], high, /missing \[reviewer, red-team\]/);
  refuse([{ seat: 'p', role: 'producer' }, { seat: 'r', role: 'reviewer' }, { seat: 'j', role: 'judge' }], {}, /extra \[judge\]/);
  refuse([{ seat: 'p', role: 'producer' }, { seat: 'r', role: 'reviewer' }, { seat: 'x', role: 'red-team' }], {}, /extra \[red-team\]/);
  refuse([{ seat: 'r', role: 'reviewer' }], {}, /exactly one seat with role "producer"/);
  refuse([{ seat: '../p', role: 'producer' }, { seat: 'r', role: 'reviewer' }], {}, /seat/);
});

test('admission counts launches from the same seats the run binds', () => {
  const cfg = { loops: { reviewed: { maxRounds: 2 } } };
  assert.equal(seatLaunchesOf({ pattern: 'solo', unit, runnerConfig: cfg }), 1);
  assert.equal(seatLaunchesOf({ pattern: 'reviewed', unit: { ...unit, rigor: 'high' }, runnerConfig: cfg, shippedCheckersByRigor }), 6);
  assert.equal(seatLaunchesOf({ loop: 'panel', params: { seats: [{ seat: 'm1', role: 'producer' }, { seat: 'm2', role: 'producer' }, { seat: 'm3', role: 'producer' }, { seat: 'synthesizer', role: 'synthesizer' }] }, unit, runnerConfig: cfg }), 4);
  assert.equal(seatLaunchesOf({ pattern: 'research-fan-out', unit, runnerConfig: cfg }), null);
  assert.equal(seatLaunchesOf({ pattern: 'unheard-of', unit, runnerConfig: cfg }), null);

  const nonDefaultCfg = { loops: { reviewed: { maxRounds: 5 } } };
  assert.equal(
    seatLaunchesOf({ pattern: 'reviewed', unit, runnerConfig: nonDefaultCfg, shippedCheckersByRigor }),
    4,
    'deleted config maxRounds fallback does not take effect without params; uses default 2 rounds',
  );
});

test('configured rigor row wins over shipped table', () => {
  const customConfig = {
    loops: {
      reviewed: {
        checkersByRigor: {
          standard: ['tester'],
          high: ['reviewer'],
        },
      },
    },
  };
  const plan = checkerPlanOf({ capability: 'docs:write', rigor: 'standard' }, customConfig, { shippedCheckersByRigor });
  assert.deepEqual(plan.map((c) => c.seat), ['tester']);
});

test('injected shipped row is used when configured row is absent', () => {
  const partialConfig = {
    loops: {
      reviewed: {
        checkersByRigor: {
          standard: ['reviewer'],
        },
      },
    },
  };
  const plan = checkerPlanOf({ capability: 'docs:write', rigor: 'critical' }, partialConfig, { shippedCheckersByRigor });
  assert.deepEqual(plan.map((c) => c.seat), ['reviewer', 'red-team', 'tester']);
});

test('missing row in both configured and shipped sources throws configuration error', () => {
  const emptyConfig = {};
  assert.throws(
    () => checkerPlanOf({ capability: 'docs:write', rigor: 'high' }, emptyConfig, { shippedCheckersByRigor: {} }),
    (err) => err.code === 'configuration-error' && /missing checkersByRigor/.test(err.message),
  );
  assert.throws(
    () => resolveSeats({ loop: 'reviewed', runnerConfig: emptyConfig, shippedCheckersByRigor: {} }),
    (err) => err.code === 'configuration-error' && /missing checkersByRigor/.test(err.message),
  );
});
test('configured standard row does not shadow shipped low row for low rigor', () => {
  const customConfig = {
    loops: {
      reviewed: {
        checkersByRigor: {
          standard: ['tester'],
        },
      },
    },
  };
  const plan = checkerPlanOf(
    { capability: 'docs:write', rigor: 'low' },
    customConfig,
    { shippedCheckersByRigor: { low: ['reviewer'] } },
  );
  assert.deepEqual(plan.map((c) => c.seat), ['reviewer']);
});

test('configured low rigor row wins over shipped low row', () => {
  const customConfig = {
    loops: {
      reviewed: {
        checkersByRigor: {
          low: ['tester'],
        },
      },
    },
  };
  const plan = checkerPlanOf(
    { capability: 'docs:write', rigor: 'low' },
    customConfig,
    { shippedCheckersByRigor: { low: ['reviewer'] } },
  );
  assert.deepEqual(plan.map((c) => c.seat), ['tester']);
});

test('a rigor ranked below standard with no row of its own takes the standard row, while high or critical with no row is a configuration error', () => {
  const plan = checkerPlanOf(
    { capability: 'docs:write', rigor: 'low' },
    { loops: { reviewed: { checkersByRigor: { standard: ['tester'] } } } },
    { shippedCheckersByRigor: { standard: ['reviewer'] } },
  );
  assert.deepEqual(plan.map((c) => c.seat), ['tester']);
  assert.throws(
    () => checkerPlanOf({ capability: 'docs:write', rigor: 'low' }, {}, { shippedCheckersByRigor: { high: ['reviewer'] } }),
    (err) => err.code === 'configuration-error' && /missing checkersByRigor for rigor "low"/.test(err.message),
  );
  const standardConfig = { loops: { reviewed: { checkersByRigor: { standard: ['reviewer'] } } } };
  assert.throws(
    () => checkerPlanOf({ capability: 'docs:write', rigor: 'high' }, standardConfig, { shippedCheckersByRigor: {} }),
    (err) => err.code === 'configuration-error' && /missing checkersByRigor for rigor "high"/.test(err.message),
  );
  assert.throws(
    () => checkerPlanOf({ capability: 'docs:write', rigor: 'critical' }, standardConfig, { shippedCheckersByRigor: {} }),
    (err) => err.code === 'configuration-error' && /missing checkersByRigor for rigor "critical"/.test(err.message),
  );
});

test('shipped high row beats configured standard row for high rigor', () => {
  const customConfig = {
    loops: {
      reviewed: {
        checkersByRigor: {
          standard: ['reviewer'],
        },
      },
    },
  };
  const plan = checkerPlanOf(
    { capability: 'docs:write', rigor: 'high' },
    customConfig,
    { shippedCheckersByRigor: { high: ['reviewer', 'red-team'] } },
  );
  assert.deepEqual(plan.map((c) => c.seat), ['reviewer', 'red-team']);
});


test('a seat tier from a file source is refused by name; a registered definition keeps it', () => {
  assert.throws(() => assertNoSeatTier([{ seat: 'a', role: 'producer', tier: 'frontier' }], 'a units file'), /cannot carry seats\[\]\.tier/);
  assert.doesNotThrow(() => assertNoSeatTier([{ seat: 'a', role: 'producer' }], 'a units file'));
});

test('a unit record written when a door could choose selectors still replays: the field is ignored', () => {
  const record = { unit: { id: 'u' }, seatSchema: 1, seats: [], selectors: { capability: 'docs:write', persona: 'p' } };
  assert.deepEqual(bindSeatOf(record, 'producer/1'), { seat: 'producer/1', role: 'producer', posture: PRODUCER_POSTURE });
});

test('reserved seat ids verify and verifier are refused in declared seats', () => {
  assert.deepEqual([...RESERVED_SEAT_IDS], ['verify', 'verifier']);
  assert.throws(
    () => checkDeclaredSeats([{ seat: 'verify', role: 'producer' }], 'unit.seats'),
    (err) => err.code === 'param-invalid' && /reserved/.test(err.message),
  );
  assert.throws(
    () => checkDeclaredSeats([{ seat: 'verifier', role: 'reviewer' }], 'params.seats'),
    (err) => err.code === 'param-invalid' && /reserved/.test(err.message),
  );
  assert.throws(
    () => resolveSeats({ pattern: 'solo', unit: { ...unit, seats: [{ seat: 'verify', role: 'producer' }] } }),
    (err) => err.code === 'param-invalid',
  );
  assert.throws(
    () => resolveSeats({ loop: 'solo', params: { seats: [{ seat: 'verifier', role: 'producer' }] }, unit }),
    (err) => err.code === 'param-invalid',
  );
});

test('checker plan derives checker set from rigor, capability, and requested params', () => {
  assert.deepEqual(checkerPlanOf({ capability: 'docs:write', rigor: 'low' }, {}, { shippedCheckersByRigor }).map((c) => c.seat), ['reviewer']);
  assert.deepEqual(checkerPlanOf({ capability: 'docs:write', rigor: 'standard' }, {}, { shippedCheckersByRigor }).map((c) => c.seat), ['reviewer']);
  assert.deepEqual(checkerPlanOf({ capability: 'docs:write', rigor: 'high' }, {}, { shippedCheckersByRigor }).map((c) => c.seat), ['reviewer', 'red-team']);

  const codeCheckers = checkerPlanOf({ capability: 'code:implement', rigor: 'low' }, {}, { shippedCheckersByRigor });
  assert.deepEqual(codeCheckers.map((c) => c.seat), ['reviewer', 'red-team']);
  assert.deepEqual(codeCheckers.find((c) => c.seat === 'red-team').contributions, ['code:default-red-team']);

  const cfg = {
    capabilities: {
      'custom:task': {
        minCheckers: ['tester'],
      },
    },
  };
  const customCheckers = checkerPlanOf({ capability: 'custom:task', rigor: 'standard' }, cfg, { shippedCheckersByRigor });
  assert.deepEqual(customCheckers.map((c) => c.seat), ['reviewer', 'tester']);

  const paramCheckers = checkerPlanOf(
    { capability: 'docs:write', rigor: 'standard' },
    {},
    { requested: ['red-team'], shippedCheckersByRigor },
  );
  assert.deepEqual(paramCheckers.map((c) => c.seat), ['reviewer', 'red-team']);
});

test('checker request below a rigor floor is unioned and records the rigor provenance', () => {
  const plan = checkerPlanOf({ capability: 'docs:write', rigor: 'high' }, {}, { requested: ['reviewer'], shippedCheckersByRigor });
  assert.deepEqual(plan, [
    { seat: 'reviewer', contributions: ['rigor:high', 'request'] },
    { seat: 'red-team', contributions: ['rigor:high'] },
  ]);
});

test('checker request below a capability floor keeps red-team for code implement', () => {
  const plan = checkerPlanOf({ capability: 'code:implement' }, {}, { requested: ['reviewer'], shippedCheckersByRigor });
  assert.deepEqual(plan.map((c) => c.seat), ['reviewer', 'red-team']);
  assert.deepEqual(plan.find((c) => c.seat === 'red-team').contributions, ['code:default-red-team']);
  assert.deepEqual(plan.find((c) => c.seat === 'reviewer').contributions, ['rigor:standard', 'request']);
});

test('red-team default applies to code implement with no config, and does not apply to business advise', () => {
  const codePlan = checkerPlanOf({ capability: 'code:implement' }, {}, { shippedCheckersByRigor });
  assert.deepEqual(codePlan.map((c) => c.seat), ['reviewer', 'red-team']);
  assert.deepEqual(codePlan.find((c) => c.seat === 'red-team').contributions, ['code:default-red-team']);

  const bizPlan = checkerPlanOf({ capability: 'business:advise' }, {}, { shippedCheckersByRigor });
  assert.deepEqual(bizPlan.map((c) => c.seat), ['reviewer']);
  assert.equal(bizPlan.find((c) => c.seat === 'red-team'), undefined);
});

test('capability prefix entry replaces default red-team and exact entry beats prefix', () => {
  const prefixCfg = { capabilities: { 'code:*': { minCheckers: ['reviewer'] } } };
  const planPrefix = checkerPlanOf({ capability: 'code:implement' }, prefixCfg, { shippedCheckersByRigor });
  assert.deepEqual(planPrefix.map((c) => c.seat), ['reviewer']);
  assert.deepEqual(planPrefix.find((c) => c.seat === 'reviewer').contributions, ['rigor:standard', 'capability:code:*']);

  const exactCfg = {
    capabilities: {
      'code:*': { minCheckers: ['reviewer'] },
      'code:implement': { minCheckers: ['tester'] },
    },
  };
  const planExact = checkerPlanOf({ capability: 'code:implement' }, exactCfg, { shippedCheckersByRigor });
  assert.deepEqual(planExact.map((c) => c.seat), ['reviewer', 'tester']);
  assert.deepEqual(planExact.find((c) => c.seat === 'tester').contributions, ['capability:code:implement']);

  const clearCfg = { capabilities: { 'code:implement': { minCheckers: [] } } };
  const planClear = checkerPlanOf({ capability: 'code:implement' }, clearCfg, { shippedCheckersByRigor });
  assert.deepEqual(planClear.map((c) => c.seat), ['reviewer']);
  assert.equal(planClear.find((c) => c.seat === 'red-team'), undefined);

  const prefixOnlyCfg = { capabilities: { 'code:*': { minCheckers: ['reviewer'] } } };
  const plainCodePlan = checkerPlanOf({ capability: 'code' }, prefixOnlyCfg, { shippedCheckersByRigor });
  assert.deepEqual(plainCodePlan.map((c) => c.seat), ['reviewer', 'red-team']);
  assert.deepEqual(plainCodePlan.find((c) => c.seat === 'red-team').contributions, ['code:default-red-team']);

  const exactCodeCfg = { capabilities: { code: { minCheckers: [] } } };
  const clearedPlainCode = checkerPlanOf({ capability: 'code' }, exactCodeCfg, { shippedCheckersByRigor });
  assert.deepEqual(clearedPlainCode.map((c) => c.seat), ['reviewer']);
});

test('non-request winner of minCheckers records param slot provenance', () => {
  const plan = checkerPlanOf({ capability: 'docs:write' }, {}, { requested: ['reviewer'], slot: 'pattern', shippedCheckersByRigor });
  assert.deepEqual(plan, [
    { seat: 'reviewer', contributions: ['rigor:standard', 'param:pattern'] },
  ]);
});

test('checker plan resolves slot provenance from options provenance or slot when requested from params', () => {
  const plan = checkerPlanOf({ capability: 'docs:write' }, {}, {
    params: { minCheckers: ['tester'] },
    slot: 'pattern-default',
    shippedCheckersByRigor,
  });
  assert.deepEqual(plan.find((c) => c.seat === 'tester'), {
    seat: 'tester',
    contributions: ['param:pattern-default'],
  });

  const planFromProv = checkerPlanOf({ capability: 'docs:write' }, {}, {
    params: { minCheckers: ['tester'] },
    provenance: { params: { minCheckers: 'activity' } },
    shippedCheckersByRigor,
  });
  assert.deepEqual(planFromProv.find((c) => c.seat === 'tester'), {
    seat: 'tester',
    contributions: ['param:activity'],
  });
});

test('declared roster omitting a checker required by pattern invariant refuses with pattern-invariant-weakened', () => {
  assert.throws(
    () => resolveSeats({
      loop: 'reviewed',
      floors: { minCheckers: [{ name: 'red-team', source: 'pattern-invariant:code-change' }] },
      unit: { ...unit, seats: [{ seat: 'author', role: 'producer' }, { seat: 'qa', role: 'reviewer' }] },
      runnerConfig: {},
      shippedCheckersByRigor,
    }),
    (err) => err.code === 'pattern-invariant-weakened' && /pattern-invariant:code-change/.test(err.message),
  );
});

test('reviewed roster missing a loop-required role with no invariant refuses with seat-multiplicity', () => {
  assert.throws(
    () => resolveSeats({
      loop: 'reviewed',
      unit: { ...unit, rigor: 'high', seats: [{ seat: 'author', role: 'producer' }, { seat: 'qa', role: 'reviewer' }] },
      runnerConfig: {},
      shippedCheckersByRigor,
    }),
    (err) => err.code === 'seat-multiplicity' && /missing \[red-team\]/.test(err.message),
  );
});

test('omitted loop and pattern options default to solo producer roster and launch count 1', () => {
  const seats = resolveSeats({ unit: { writes: [] }, runnerConfig: {} });
  assert.deepEqual(seats.map((s) => [s.seat, s.role]), [['producer', 'producer']]);
  assert.equal(seats[0].posture.writer, true);
  assert.equal(seatLaunchesOf({ unit: { writes: [] }, runnerConfig: {} }), 1);
});

test('seat launches calculation computes launch bounds from loop, params and floors', () => {
  const launches = seatLaunchesOf({
    loop: 'reviewed',
    params: { maxRounds: 3 },
    unit: {},
    runnerConfig: {},
    shippedCheckersByRigor,
  });
  assert.equal(launches, 6);
});
