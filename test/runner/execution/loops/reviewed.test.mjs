import '../../../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runReviewed,
  reviewedHistoryOutcome as historyOutcomeOf,
  verifyCommandOf,
} from '../../../../src/runner/execution/loops/reviewed.mjs';
import {
  DEFAULT_CHECKERS_BY_RIGOR,
  requiresDistinctFamilies,
  resolveSeats,
} from '../../../../src/runner/execution/seat-resolver.mjs';

// The history outcome of a reviewed unit is read over the seats the unit has.
const reviewedHistoryOutcome = (unit, cfg, history, params = {}) =>
  historyOutcomeOf(unit, cfg, history, params, resolveSeats({ pattern: { pattern: 'reviewed', params }, unit, runnerConfig: cfg }));

test('runReviewed passes on round 1 when all checkers pass', async () => {
  const calls = [];
  const unit = {
    id: 'u-rev-1',
    objective: 'Implement clean change',
    capability: 'code:implement',
    writes: ['src/a.mjs'],
  };

  const runRole = async (opts) => {
    calls.push(opts);
    return {
      seat: opts.seat.seat,
      outcome: 'pass',
    };
  };

  const res = await runReviewed(unit, {}, { runRole });

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 1);
  assert.deepEqual(res.findings, []);

  // Producer + 2 checkers (reviewer, red-team because code:implement)
  assert.equal(calls.length, 3);
  assert.equal(calls[0].seat.seat, 'producer');
  assert.equal(calls[0].round, 1);
  assert.equal(calls[0].seat.posture.readOnly, false);

  const checkerRoles = [calls[1].seat.seat, calls[2].seat.seat].sort();
  assert.deepEqual(checkerRoles, ['red-team', 'reviewer']);
  assert.equal(calls[1].seat.posture.readOnly, true);
  assert.deepEqual(calls[1].independentOf, ['producer']);
  assert.equal(calls[2].seat.posture.readOnly, true);
  assert.deepEqual(calls[2].independentOf, ['producer']);
});

test('runReviewed runs checkers in parallel (Promise.all)', async () => {
  let inFlight = 0;
  let maxConcurrency = 0;

  const unit = {
    id: 'u-parallel-checkers',
    objective: 'Parallel check test',
    capability: 'code:implement', // reviewer + red-team
  };

  const runRole = async (opts) => {
    if (opts.seat.seat === 'producer') {
      return { seat: 'producer', outcome: 'pass' };
    }
    inFlight++;
    maxConcurrency = Math.max(maxConcurrency, inFlight);
    await new Promise((r) => setTimeout(r, 20));
    inFlight--;
    return { seat: opts.seat.seat, outcome: 'pass' };
  };

  const res = await runReviewed(unit, {}, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.equal(maxConcurrency, 2, 'Reviewer and red-team must execute concurrently in parallel');
});

test('runReviewed loops to round 2 when findings exist and passes on fix', async () => {
  const calls = [];
  const unit = {
    id: 'u-rev-fix',
    objective: 'Fix with review',
    capability: 'docs:write',
    rigor: 'standard', // reviewer only
  };

  let producerCalls = 0;
  let reviewerCalls = 0;

  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.seat.seat === 'producer') {
      producerCalls++;
      return {
        seat: 'producer',
        outcome: 'pass',
        attempt: producerCalls,
      };
    }
    if (opts.seat.seat === 'reviewer') {
      reviewerCalls++;
      if (reviewerCalls === 1) {
        return {
          seat: 'reviewer',
          outcome: 'findings',
          findings: ['Missing section 3'],
        };
      }
      return {
        seat: 'reviewer',
        outcome: 'pass',
      };
    }
    throw new Error(`Unexpected role: ${opts.seat.seat}`);
  };

  const res = await runReviewed(unit, {}, { runRole });

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 2);
  assert.equal(producerCalls, 2);
  assert.equal(reviewerCalls, 2);

  // Round 2's producer is told what to fix; round 1's producer keeps the plain unit
  const round1Producer = calls.find((c) => c.seat.seat === 'producer' && c.round === 1);
  assert.equal(round1Producer.unit, unit, 'the first round is the unit as it was given');
  const round2Producer = calls.find((c) => c.seat.seat === 'producer' && c.round === 2);
  assert.ok(round2Producer, 'Producer called for round 2');
  assert.ok(round2Producer.unit.objective.startsWith(unit.objective));
  assert.match(round2Producer.unit.objective, /- Missing section 3/);

  // The reviewer is told to review, and gets the producer's result of that round to read
  const reviewerRound1 = calls.find((c) => c.seat.seat === 'reviewer' && c.round === 1);
  assert.match(reviewerRound1.unit.objective, /reviewer/i);
  assert.ok(reviewerRound1.unit.objective.includes(unit.objective));
  assert.equal(reviewerRound1.inputs.length, 1);
  assert.equal(reviewerRound1.inputs[0].seat, 'producer');
  assert.equal(reviewerRound1.inputs[0].attempt, 1);
  const reviewerRound2 = calls.find((c) => c.seat.seat === 'reviewer' && c.round === 2);
  assert.equal(reviewerRound2.inputs[0].attempt, 2, 'round 2 reviews round 2 producer, not round 1');
});

test('runReviewed returns findings (NEVER failed) when maxRounds is reached', async () => {
  const unit = {
    id: 'u-rev-exhaust',
    objective: 'Persistent findings',
    capability: 'docs:write',
  };

  const runRole = async (opts) => {
    if (opts.seat.seat === 'producer') {
      return { seat: 'producer', outcome: 'pass' };
    }
    if (opts.seat.seat === 'reviewer') {
      return {
        seat: 'reviewer',
        outcome: 'findings',
        findings: [`Finding in round ${opts.round}`],
      };
    }
    return { seat: opts.seat.seat, outcome: 'pass' };
  };

  const res = await runReviewed(unit, {}, { runRole });

  // Invariant: NEVER report findings as failed
  assert.equal(res.outcome, 'findings');
  assert.notEqual(res.outcome, 'failed');
  assert.equal(res.rounds, 2);
  assert.ok(res.findings.length >= 2);
  assert.ok(res.findings.includes('Finding in round 2'));
});

test('runReviewed executes deterministic verify hook when configured and treats failure as findings', async () => {
  const calls = [];
  const verifyCalls = [];
  const unit = {
    id: 'u-rev-verify',
    objective: 'Code with verify',
    capability: 'code:implement',
    verify: 'npm test',
  };

  let round = 1;
  const runRole = async (opts) => {
    calls.push(opts);
    return { seat: opts.seat.seat, outcome: 'pass' };
  };

  const verify = async (u) => {
    verifyCalls.push(u);
    if (verifyCalls.length === 1) {
      return {
        pass: false,
        findings: ['Tests failed: 1 assertion error'],
      };
    }
    return {
      pass: true,
      findings: [],
    };
  };

  const res = await runReviewed(unit, {}, { runRole, verify });

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 2);
  assert.equal(verifyCalls.length, 2);

  // Round 2 producer should have received verify findings
  const r2Producer = calls.find((c) => c.seat.seat === 'producer' && c.round === 2);
  assert.ok(r2Producer);
  assert.match(r2Producer.unit.objective, /- Tests failed: 1 assertion error/);
});

test('runReviewed propagates execution-failure and other hard error outcomes', async () => {
  for (const errOutcome of ['execution-failure', 'policy-refusal', 'provider-limit', 'blocked']) {
    const unit = { id: `u-${errOutcome}`, capability: 'docs:write' };
    const runRole = async (opts) => {
      if (opts.seat.seat === 'producer') return { seat: 'producer', outcome: 'pass' };
      return { seat: 'reviewer', outcome: errOutcome, reason: 'error occurred' };
    };

    const res = await runReviewed(unit, {}, { runRole });
    assert.equal(res.outcome, errOutcome, `Should propagate ${errOutcome}`);
  }
});

// What a writing seat settles when it claimed done but changed no files: no evidence, inconclusive.
const changedNothing = (seat = 'producer') => ({
  seat,
  outcome: 'execution-failure',
  posture: { readOnly: false },
  runResult: { classification: {
    confidence: { level: 'no-evidence', basis: [] },
    assessment: { verdict: 'inconclusive' },
    failure: null,
  } },
});

test('a producer that changed nothing is still reviewed, and the reviewer\'s verdict decides the round', async () => {
  const unit = { id: 'u-no-change', capability: 'docs:write' };
  const run = async (reviewerOutcome) => {
    const calls = [];
    const runRole = async (opts) => {
      calls.push(opts.seat.seat);
      if (opts.seat.seat === 'producer') return changedNothing();
      return { seat: 'reviewer', outcome: reviewerOutcome, ...(reviewerOutcome === 'findings' ? { findings: ['wrong'] } : {}) };
    };
    return { res: await runReviewed(unit, {}, { runRole }, { maxRounds: 1 }), calls };
  };

  const passed = await run('pass');
  assert.equal(passed.res.outcome, 'pass');
  assert.ok(passed.calls.includes('reviewer'), 'the reviewer runs after a producer that changed nothing');

  const found = await run('findings');
  assert.equal(found.res.outcome, 'findings');
  assert.deepEqual(found.res.findings, ['wrong']);
});

test('a checker that settled with no evidence still ends the round', async () => {
  const unit = { id: 'u-checker-no-evidence', capability: 'docs:write' };
  // A history record carries no posture, so only the seat can tell a checker from the producer.
  const silentReviewer = () => { const { posture, ...record } = changedNothing('reviewer'); return record; };

  const live = await runReviewed(unit, {}, {
    runRole: async (opts) => (opts.seat.seat === 'producer' ? { seat: 'producer', outcome: 'pass' } : silentReviewer()),
  });
  assert.equal(live.outcome, 'execution-failure');

  const history = [{ seat: 'producer', round: 1, outcome: 'pass' }, { ...silentReviewer(), round: 1 }];
  const resumed = await runReviewed(unit, {}, {
    history,
    runRole: () => assert.fail('a fully settled history must never dispatch'),
  });
  assert.equal(resumed.outcome, 'execution-failure');
  assert.equal(reviewedHistoryOutcome(unit, {}, history), 'execution-failure');
});

test('a producer that crashed stops the round before any reviewer', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts.seat.seat);
    return { seat: 'producer', outcome: 'execution-failure', posture: { readOnly: false },
      runResult: { classification: { confidence: { level: 'failed', basis: [] }, assessment: { verdict: 'inconclusive' }, failure: { code: 'crash' } } } };
  };
  const res = await runReviewed({ id: 'u-crash', capability: 'docs:write' }, {}, { runRole });
  assert.equal(res.outcome, 'execution-failure');
  assert.deepEqual(calls, ['producer']);
});

test('runReviewed resumes from history across settled rounds and pending roles', async () => {
  const calls = [];
  const unit = {
    id: 'u-resume-mid-round-2',
    objective: 'Resume mid-round 2',
    capability: 'code:implement', // checkers: reviewer, red-team
  };

  // History shows:
  // Round 1: producer passed, reviewer found issues, red-team passed -> round 1 settled with findings
  // Round 2: producer passed, reviewer passed, but red-team was interrupted
  const history = () => [
    { seat: 'producer', round: 1, outcome: 'pass' },
    { seat: 'reviewer', round: 1, outcome: 'findings', findings: ['Syntax issue'] },
    { seat: 'red-team', round: 1, outcome: 'pass' },
    { seat: 'producer', round: 2, outcome: 'pass' },
    { seat: 'reviewer', round: 2, outcome: 'pass' },
  ];

  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.seat.seat === 'red-team') {
      return { seat: 'red-team', round: opts.round, outcome: 'pass' };
    }
    throw new Error(`Unexpected rerun of role: ${opts.seat.seat}`);
  };

  const res = await runReviewed(unit, {}, { runRole, history });

  // "resume giữa vòng 2 không chạy lại vai đã pass"
  assert.equal(calls.length, 1, 'Only pending red-team should have run');
  assert.equal(calls[0].seat.seat, 'red-team');
  assert.equal(calls[0].round, 2);

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 2);
  assert.equal(res.results.length, 6); // 3 from round 1 + 3 from round 2
});

test('legacy history evaluator shares terminal outcomes with reviewed execution without launching work', async () => {
  const unit = { id: 'legacy-review', capability: 'docs:write', objective: 'Review question' };
  const recovered = [
    { seat: 'producer', round: 1, outcome: 'pass' },
    { seat: 'reviewer', round: 1, outcome: 'findings' },
    { seat: 'producer', round: 2, outcome: 'pass' },
    { seat: 'reviewer', round: 2, outcome: 'pass' },
  ];
  for (const terminal of ['pass', 'findings', 'execution-failure']) {
    const history = recovered.map((record) => record.seat === 'reviewer' && record.round === 2 ? { ...record, outcome: terminal } : record);
    const actual = await runReviewed(unit, {}, {
      history,
      runRole: () => assert.fail('a fully settled history must never dispatch'),
      verify: () => assert.fail('this fixture has no verify command'),
    });
    assert.equal(reviewedHistoryOutcome(unit, {}, history), actual.outcome);
    assert.equal(actual.outcome, terminal);
  }
  assert.equal(reviewedHistoryOutcome(unit, {}, recovered.slice(0, 3)), null);
  assert.equal(reviewedHistoryOutcome(unit, { capabilities: { 'docs:write': { verify: 'synthetic-check' } } }, recovered), null);
});

test('reviewed rejection drains every checker and verify before preserving the first error', async () => {
  for (const failedPeer of ['reviewer', 'red-team', 'verify']) {
    const releases = new Map();
    const started = new Map();
    const ready = new Map(['reviewer', 'red-team', 'verify'].map((role) => [
      role, new Promise((resolve) => started.set(role, resolve)),
    ]));
    const barriers = new Map(['reviewer', 'red-team', 'verify'].map((role) => [
      role, new Promise((resolve) => releases.set(role, resolve)),
    ]));
    const completed = new Set();
    const failure = new Error(`${failedPeer} could not complete`);
    const laterFailure = new Error('another peer failed later');
    const peer = async (role) => {
      started.get(role)();
      await barriers.get(role);
      completed.add(role);
      if (role === failedPeer) throw failure;
      if (role === 'verify') throw laterFailure;
      return { seat: role, outcome: 'pass' };
    };
    let finished = false;
    const run = runReviewed({ id: 'drain-review', capability: 'code:implement', verify: 'check' }, {}, {
      runRole: ({ seat }) => seat.seat === 'producer' ? { seat: seat.seat, outcome: 'pass' } : peer(seat.seat),
      verify: () => peer('verify'),
    });
    const rejection = assert.rejects(run, (error) => {
      finished = true;
      assert.equal(error, failure);
      assert.equal(completed.size, 3);
      return true;
    });
    await Promise.all(ready.values());
    releases.get(failedPeer)();
    await new Promise(setImmediate);
    assert.equal(finished, false);
    for (const [role, release] of releases) if (role !== failedPeer) release();
    await rejection;
  }
});

test('a synchronous checker rejection still dispatches and drains its sibling and verification', async () => {
  let release;
  const barrier = new Promise((resolve) => { release = resolve; });
  let peersStarted;
  const started = new Promise((resolve) => { peersStarted = resolve; });
  const completed = [];
  const failure = new Error('checker refused synchronously');
  let pending = 0;
  const peer = async (role) => {
    if (++pending === 2) peersStarted();
    await barrier;
    completed.push(role);
    return { seat: role, outcome: 'pass', pass: true };
  };
  const run = runReviewed({ id: 'sync-refusal', capability: 'code:implement', verify: 'check' }, {}, {
    runRole: ({ seat }) => {
      const role = seat.seat;
      if (role === 'producer') return { seat: role, outcome: 'pass' };
      if (role === 'reviewer') throw failure;
      return peer(role);
    },
    verify: () => peer('verify'),
  });
  const rejection = assert.rejects(run, (error) => {
    assert.equal(error, failure);
    assert.deepEqual(completed.sort(), ['red-team', 'verify']);
    return true;
  });
  await started;
  release();
  await rejection;
});

test('resume keeps a complete round final but retries every unpassed seat of an interrupted round', async () => {
  const unit = { id: 'interrupted-review', objective: 'Change the parser', capability: 'code:implement' }; // reviewer + red-team
  const failedReviewer = { seat: 'reviewer', round: 1, outcome: 'execution-failure' };
  const producer = { seat: 'producer', round: 1, outcome: 'pass' };

  // Every checker of the round has a result: the round is settled and its error is the outcome.
  const settled = [producer, failedReviewer, { seat: 'red-team', round: 1, outcome: 'pass' }];
  const final = await runReviewed(unit, {}, {
    history: settled,
    runRole: ({ seat }) => assert.fail(`a settled round never dispatches ${seat.seat}`),
  });
  assert.equal(final.outcome, 'execution-failure');
  assert.equal(reviewedHistoryOutcome(unit, {}, settled), 'execution-failure');

  // A sibling never reported, so the round never finished: nothing about it is settled yet.
  const interrupted = [producer, failedReviewer];
  assert.equal(reviewedHistoryOutcome(unit, {}, interrupted), null, 'an interrupted round has no outcome to publish');
  const dispatched = [];
  const resumed = await runReviewed(unit, {}, {
    history: interrupted,
    runRole: async ({ seat, round }) => {
      dispatched.push(`${seat.seat}/${round}`);
      return { seat: seat.seat, round, outcome: 'pass' };
    },
  });
  // The passed producer is reused; the failed checker is retried beside the missing one.
  assert.deepEqual(dispatched.sort(), ['red-team/1', 'reviewer/1']);
  assert.equal(resumed.outcome, 'pass');
  assert.equal(resumed.rounds, 1);
});

test('verifyCommandOf reads the unit, then its capability, and nothing else', () => {
  assert.equal(verifyCommandOf({ capability: 'docs:write', verify: 'make check' }, {}), 'make check');
  assert.equal(verifyCommandOf({ capability: 'docs:write' }, { capabilities: { 'docs:write': { verify: 'lint docs' } } }), 'lint docs');
  assert.equal(verifyCommandOf({ capability: 'docs:write', verify: 'unit wins' }, { capabilities: { 'docs:write': { verify: 'cap loses' } } }), 'unit wins');
  assert.equal(verifyCommandOf({ capability: 'docs:write' }, {}), undefined);
  assert.equal(verifyCommandOf({ capability: 'docs:write', verify: '   ' }, {}), undefined);
});

test('a verify command in pattern params is not a verify: the runner never ran one from there', async () => {
  const unit = { id: 'u-params-verify', objective: 'Do it', capability: 'docs:write' };
  const res = await runReviewed(
    unit,
    {},
    {
      runRole: async (opts) => ({ seat: opts.seat.seat, outcome: 'pass' }),
      verify: () => assert.fail('no unit or capability verify exists, so no verify role runs'),
    },
    { verify: 'npm test' },
  );
  assert.equal(res.outcome, 'pass');
  assert.equal(res.results.some((r) => r.seat === 'verify'), false);
});

test('requiresDistinctFamilies is true at rigor high or critical, from the unit or its capability floor', () => {
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write' }, {}), false);
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write', rigor: 'low' }, {}), false);
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write', rigor: 'standard' }, {}), false);
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write', rigor: 'high' }, {}), true);
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write', rigor: 'critical' }, {}), true);
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write', rigor: 'low' }, { capabilities: { 'docs:write': { rigor: 'high' } } }), true);
  assert.equal(requiresDistinctFamilies({ capability: 'docs:write', rigor: 'critical' }, { capabilities: { 'docs:write': { rigor: 'low' } } }), true);
});

test('reviewed at high or critical rigor makes every checker independent of the producer and of each other', async () => {
  for (const rigor of ['high', 'critical']) {
    const seen = [];
    const unit = { id: `u-${rigor}`, objective: 'Do it', capability: 'docs:write', rigor };
    await runReviewed(unit, {}, { runRole: async (opts) => { seen.push(opts); return { seat: opts.seat.seat, outcome: 'pass' }; } });
    const byRole = Object.fromEntries(seen.map((opts) => [opts.seat.seat, opts.independentOf]));
    assert.deepEqual(byRole.reviewer, ['producer', 'red-team'], rigor);
    assert.deepEqual(byRole['red-team'], ['producer', 'reviewer'], rigor);
  }
});

test('reviewed at standard or low rigor keeps checkers independent of the producer only', async () => {
  for (const rigor of ['low', 'standard', undefined]) {
    const seen = [];
    const unit = { id: 'u-standard', objective: 'Do it', capability: 'docs:write', ...(rigor ? { rigor } : {}) };
    const params = { minCheckers: ['reviewer', 'red-team'] };
    await runReviewed(unit, {}, { runRole: async (opts) => { seen.push(opts); return { seat: opts.seat.seat, outcome: 'pass' }; } }, params);
    for (const opts of seen.filter((o) => o.seat.seat !== 'producer')) {
      assert.deepEqual(opts.independentOf, ['producer'], `${rigor} ${opts.seat.seat}`);
    }
  }
});
