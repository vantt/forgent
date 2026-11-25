// Records written before seats existed stay readable through one path (a resume of one is refused by the host's unit run).

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { legacySeatsOf, seatsOfRecord, seatKeyOf, isVerdictResult, isVerifyResult, isSeatRecord, collaborationOfRecord } from '../../../src/runner/execution/legacy-seat-read.mjs';

const settledAt = '2026-10-05T01:01:00Z';

test('golden: a pre-fence panel record (three role-keyed panelists and a synthesizer) reads as seats', () => {
  const record = { unit: { id: 'q', capability: 'question:answer', pattern: 'panel', stanceOptions: ['a', 'b'] }, pattern: 'panel', settlement: { outcome: 'pass', settledAt } };
  assert.equal(isSeatRecord(record), false);
  assert.deepEqual(legacySeatsOf(record).map(({ seat, role }) => [seat, role]), [
    ['panelist-1', 'producer'], ['panelist-2', 'producer'], ['panelist-3', 'producer'], ['synthesizer', 'synthesizer'],
  ]);
});

test('golden: a pre-fence debate record (thesis, antithesis, judge) reads as seats and derives its outcome from the judge', () => {
  const record = { unit: { id: 'd', capability: 'q:a', pattern: 'debate' }, pattern: 'debate' };
  assert.deepEqual(legacySeatsOf(record).map((s) => [s.seat, s.role]), [
    ['thesis', 'producer'], ['antithesis', 'producer'], ['judge', 'judge'],
  ]);
});

test('golden: a pre-fence reviewed record keeps tester a non-verdict reviewer', () => {
  const record = { unit: { id: 'r', capability: 'docs:write', rigor: 'high', pattern: 'reviewed' }, pattern: { pattern: 'reviewed', params: { minCheckers: ['tester'] } } };
  const seats = legacySeatsOf(record);
  assert.deepEqual(seats.map((s) => [s.seat, s.role, s.posture.verdict]), [
    ['producer', 'producer', false], ['reviewer', 'reviewer', true], ['red-team', 'red-team', true], ['tester', 'reviewer', false],
  ]);
});

test('pre-fence presets that carried role names as params are read the way they ran', () => {
  const panel = legacySeatsOf({ pattern: 'research-fan-out', unit: {} });
  assert.deepEqual(panel.map((s) => s.seat), ['researcher-1', 'researcher-2', 'researcher-3', 'synthesizer']);
  assert.deepEqual(legacySeatsOf({ pattern: 'consult', unit: {} }).map((s) => s.seat), ['advisor']);
  assert.deepEqual(legacySeatsOf({ pattern: null, unit: {} }), [], 'a record that never said its pattern has no seats to name');
  assert.deepEqual(legacySeatsOf({ pattern: { pattern: 'panel', params: { members: 2, role: 'lens', synthesizeRole: 'chair' } }, unit: {} }).map((s) => s.seat), ['lens-1', 'lens-2', 'chair']);
});

test('a fenced record lists its own seats and legacy never overrides them', () => {
  const own = [{ seat: 'system', role: 'producer', posture: {} }];
  assert.deepEqual(seatsOfRecord({ seatSchema: 1, seats: own, pattern: 'panel' }), own);
});

test('results written before seats are keyed by the name they carried', () => {
  assert.equal(seatKeyOf({ role: 'panelist-2' }), 'panelist-2');
  assert.equal(seatKeyOf({ seat: 'system', role: 'producer' }), 'system');
  // Verdict and verify results: by posture when there is one, by the retired name otherwise.
  assert.equal(isVerdictResult({ role: 'reviewer' }), true);
  assert.equal(isVerdictResult({ role: 'red-team' }), true);
  assert.equal(isVerdictResult({ role: 'tester' }), false);
  assert.equal(isVerdictResult({ seat: 'tester', role: 'reviewer', posture: { verdict: false } }), false);
  assert.equal(isVerdictResult({ seat: 'sec', role: 'reviewer', posture: { verdict: true } }), true);
  assert.equal(isVerifyResult({ role: 'verify' }), true);
  assert.equal(isVerifyResult({ seat: 'verify' }), true);
  assert.equal(isVerifyResult({ seat: 'producer' }), false);
});

const fixtureShipped = {
  patterns: {
    'research-fan-out': { loop: 'panel', defaults: { members: 3, role: 'researcher', synthesizeRole: 'synthesizer' } },
    reviewed: { loop: 'reviewed' },
  },
  loops: { reviewed: { maxRounds: 2 } },
};

test('collaborationOfRecord decodes an unpinned record reading snapshot patterns.reviewed.maxRounds as tuning', () => {
  const record = {
    seatSchema: 1,
    pattern: 'reviewed',
    unit: { id: 'u1', capability: 'code:implement', rigor: 'standard' },
    configSnapshot: {
      runner: {
        patterns: {
          reviewed: { maxRounds: 3 },
        },
      },
    },
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
    ],
  };
  const { collaboration, effective, runner } = collaborationOfRecord(record, { shipped: fixtureShipped });
  assert.equal(effective.loop, 'reviewed');
  assert.equal(effective.params.maxRounds, 3);
  assert.equal(collaboration.pattern.name, 'reviewed');
  assert.deepEqual(runner.loops.reviewed, { maxRounds: 3 });
});

test('collaborationOfRecord decodes stored research-fan-out-gated as research-fan-out', () => {
  const record = {
    seatSchema: 1,
    pattern: 'research-fan-out-gated',
    unit: { id: 'u2', capability: 'research' },
    configSnapshot: { runner: {} },
    seats: [
      { seat: 'researcher-1', role: 'producer' },
      { seat: 'researcher-2', role: 'producer' },
      { seat: 'researcher-3', role: 'producer' },
      { seat: 'synthesizer', role: 'synthesizer' },
    ],
  };
  const { collaboration, effective } = collaborationOfRecord(record, { shipped: fixtureShipped });
  assert.equal(effective.loop, 'panel');
  assert.equal(collaboration.pattern.name, 'research-fan-out');
  assert.equal(effective.seats.length, 4);
});

test('collaborationOfRecord presents snapshot patterns.reviewed with tester as loops.reviewed', () => {
  const record = {
    seatSchema: 1,
    pattern: 'reviewed',
    unit: { id: 'u3', capability: 'code:implement', rigor: 'critical' },
    configSnapshot: {
      runner: {
        patterns: {
          reviewed: {
            checkersByRigor: {
              critical: ['reviewer', 'red-team', 'tester'],
            },
          },
        },
      },
    },
  };
  const { runner } = collaborationOfRecord(record, { shipped: fixtureShipped });
  assert.deepEqual(runner.loops.reviewed.checkersByRigor.critical, ['reviewer', 'red-team', 'tester']);
});

test('collaborationOfRecord preserves stored selector maxRounds over snapshot tuning', () => {
  const record = {
    seatSchema: 1,
    pattern: { pattern: 'reviewed', params: { maxRounds: 1 } },
    unit: { id: 'u4', capability: 'code:implement' },
    configSnapshot: {
      runner: {
        patterns: {
          reviewed: { maxRounds: 3 },
        },
      },
    },
    seats: [
      { seat: 'producer', role: 'producer', posture: { writer: true } },
      { seat: 'reviewer', role: 'reviewer', posture: { readOnly: true, verdict: true } },
    ],
  };
  const { effective, runner } = collaborationOfRecord(record, { shipped: fixtureShipped });
  assert.equal(effective.params.maxRounds, 1);
  assert.deepEqual(runner.loops.reviewed, { maxRounds: 3 });
});
