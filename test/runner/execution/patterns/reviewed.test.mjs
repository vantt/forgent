import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runReviewed,
  resolveCheckers,
  reviewedHistoryOutcome,
  DEFAULT_CHECKERS_BY_RIGOR,
} from '../../../../src/runner/execution/patterns/reviewed.mjs';

test('resolveCheckers derives checker set from rigor, capability, and params', () => {
  // Low rigor defaults to reviewer
  assert.deepEqual(resolveCheckers({ capability: 'docs:write', rigor: 'low' }, {}), ['reviewer']);

  // Standard rigor defaults to reviewer
  assert.deepEqual(resolveCheckers({ capability: 'docs:write', rigor: 'standard' }, {}), ['reviewer']);

  // High rigor includes reviewer and red-team
  assert.deepEqual(resolveCheckers({ capability: 'docs:write', rigor: 'high' }, {}), ['reviewer', 'red-team']);

  // Code capabilities ALWAYS include red-team even at low rigor
  const codeCheckers = resolveCheckers({ capability: 'code:implement', rigor: 'low' }, {});
  assert.ok(codeCheckers.includes('reviewer'));
  assert.ok(codeCheckers.includes('red-team'));

  // Union with cfg.capabilities[cap].minCheckers
  const cfg = {
    capabilities: {
      'custom:task': {
        minCheckers: ['domain-expert'],
      },
    },
  };
  const customCheckers = resolveCheckers({ capability: 'custom:task', rigor: 'standard' }, cfg);
  assert.ok(customCheckers.includes('reviewer'));
  assert.ok(customCheckers.includes('domain-expert'));

  // Union with preset params
  const paramCheckers = resolveCheckers(
    { capability: 'docs:write', rigor: 'standard' },
    {},
    { minCheckers: ['fact-checker'] },
  );
  assert.ok(paramCheckers.includes('reviewer'));
  assert.ok(paramCheckers.includes('fact-checker'));
});

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
      role: opts.role,
      outcome: 'pass',
    };
  };

  const res = await runReviewed(unit, {}, { runRole });

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 1);
  assert.deepEqual(res.findings, []);

  // Producer + 2 checkers (reviewer, red-team because code:implement)
  assert.equal(calls.length, 3);
  assert.equal(calls[0].role, 'producer');
  assert.equal(calls[0].round, 1);
  assert.equal(calls[0].readOnly, false);

  const checkerRoles = [calls[1].role, calls[2].role].sort();
  assert.deepEqual(checkerRoles, ['red-team', 'reviewer']);
  assert.equal(calls[1].readOnly, true);
  assert.deepEqual(calls[1].independentOf, ['producer']);
  assert.equal(calls[2].readOnly, true);
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
    if (opts.role === 'producer') {
      return { role: 'producer', outcome: 'pass' };
    }
    inFlight++;
    maxConcurrency = Math.max(maxConcurrency, inFlight);
    await new Promise((r) => setTimeout(r, 20));
    inFlight--;
    return { role: opts.role, outcome: 'pass' };
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
    if (opts.role === 'producer') {
      producerCalls++;
      return {
        role: 'producer',
        outcome: 'pass',
        attempt: producerCalls,
      };
    }
    if (opts.role === 'reviewer') {
      reviewerCalls++;
      if (reviewerCalls === 1) {
        return {
          role: 'reviewer',
          outcome: 'findings',
          findings: ['Missing section 3'],
        };
      }
      return {
        role: 'reviewer',
        outcome: 'pass',
      };
    }
    throw new Error(`Unexpected role: ${opts.role}`);
  };

  const res = await runReviewed(unit, {}, { runRole });

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 2);
  assert.equal(producerCalls, 2);
  assert.equal(reviewerCalls, 2);

  // Round 2's producer is told what to fix; round 1's producer keeps the plain unit
  const round1Producer = calls.find((c) => c.role === 'producer' && c.round === 1);
  assert.equal(round1Producer.unit, unit, 'the first round is the unit as it was given');
  const round2Producer = calls.find((c) => c.role === 'producer' && c.round === 2);
  assert.ok(round2Producer, 'Producer called for round 2');
  assert.ok(round2Producer.unit.objective.startsWith(unit.objective));
  assert.match(round2Producer.unit.objective, /- Missing section 3/);

  // The reviewer is told to review, and gets the producer's result of that round to read
  const reviewerRound1 = calls.find((c) => c.role === 'reviewer' && c.round === 1);
  assert.match(reviewerRound1.unit.objective, /reviewer/i);
  assert.ok(reviewerRound1.unit.objective.includes(unit.objective));
  assert.equal(reviewerRound1.inputs.length, 1);
  assert.equal(reviewerRound1.inputs[0].role, 'producer');
  assert.equal(reviewerRound1.inputs[0].attempt, 1);
  const reviewerRound2 = calls.find((c) => c.role === 'reviewer' && c.round === 2);
  assert.equal(reviewerRound2.inputs[0].attempt, 2, 'round 2 reviews round 2 producer, not round 1');
});

test('runReviewed returns findings (NEVER failed) when maxRounds is reached', async () => {
  const unit = {
    id: 'u-rev-exhaust',
    objective: 'Persistent findings',
    capability: 'docs:write',
  };

  const runRole = async (opts) => {
    if (opts.role === 'producer') {
      return { role: 'producer', outcome: 'pass' };
    }
    if (opts.role === 'reviewer') {
      return {
        role: 'reviewer',
        outcome: 'findings',
        findings: [`Finding in round ${opts.round}`],
      };
    }
    return { role: opts.role, outcome: 'pass' };
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
    return { role: opts.role, outcome: 'pass' };
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
  const r2Producer = calls.find((c) => c.role === 'producer' && c.round === 2);
  assert.ok(r2Producer);
  assert.match(r2Producer.unit.objective, /- Tests failed: 1 assertion error/);
});

test('runReviewed propagates execution-failure and other hard error outcomes', async () => {
  for (const errOutcome of ['execution-failure', 'policy-refusal', 'provider-limit', 'blocked']) {
    const unit = { id: `u-${errOutcome}`, capability: 'docs:write' };
    const runRole = async (opts) => {
      if (opts.role === 'producer') return { role: 'producer', outcome: 'pass' };
      return { role: 'reviewer', outcome: errOutcome, reason: 'error occurred' };
    };

    const res = await runReviewed(unit, {}, { runRole });
    assert.equal(res.outcome, errOutcome, `Should propagate ${errOutcome}`);
  }
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
    { role: 'producer', round: 1, outcome: 'pass' },
    { role: 'reviewer', round: 1, outcome: 'findings', findings: ['Syntax issue'] },
    { role: 'red-team', round: 1, outcome: 'pass' },
    { role: 'producer', round: 2, outcome: 'pass' },
    { role: 'reviewer', round: 2, outcome: 'pass' },
  ];

  const runRole = async (opts) => {
    calls.push(opts);
    if (opts.role === 'red-team') {
      return { role: 'red-team', round: opts.round, outcome: 'pass' };
    }
    throw new Error(`Unexpected rerun of role: ${opts.role}`);
  };

  const res = await runReviewed(unit, {}, { runRole, history });

  // "resume giữa vòng 2 không chạy lại vai đã pass"
  assert.equal(calls.length, 1, 'Only pending red-team should have run');
  assert.equal(calls[0].role, 'red-team');
  assert.equal(calls[0].round, 2);

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 2);
  assert.equal(res.results.length, 6); // 3 from round 1 + 3 from round 2
});

test('legacy history evaluator shares terminal outcomes with reviewed execution without launching work', async () => {
  const unit = { id: 'legacy-review', capability: 'docs:write', objective: 'Review question' };
  const recovered = [
    { role: 'producer', round: 1, outcome: 'pass' },
    { role: 'reviewer', round: 1, outcome: 'findings' },
    { role: 'producer', round: 2, outcome: 'pass' },
    { role: 'reviewer', round: 2, outcome: 'pass' },
  ];
  for (const terminal of ['pass', 'findings', 'execution-failure']) {
    const history = recovered.map((record) => record.role === 'reviewer' && record.round === 2 ? { ...record, outcome: terminal } : record);
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
      return { role, outcome: 'pass' };
    };
    let finished = false;
    const run = runReviewed({ id: 'drain-review', capability: 'code:implement', verify: 'check' }, {}, {
      runRole: ({ role }) => role === 'producer' ? { role, outcome: 'pass' } : peer(role),
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
    return { role, outcome: 'pass', pass: true };
  };
  const run = runReviewed({ id: 'sync-refusal', capability: 'code:implement', verify: 'check' }, {}, {
    runRole: ({ role }) => {
      if (role === 'producer') return { role, outcome: 'pass' };
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
  const failedReviewer = { role: 'reviewer', round: 1, outcome: 'execution-failure' };
  const producer = { role: 'producer', round: 1, outcome: 'pass' };

  // Every checker of the round has a result: the round is settled and its error is the outcome.
  const settled = [producer, failedReviewer, { role: 'red-team', round: 1, outcome: 'pass' }];
  const final = await runReviewed(unit, {}, {
    history: settled,
    runRole: ({ role }) => assert.fail(`a settled round never dispatches ${role}`),
  });
  assert.equal(final.outcome, 'execution-failure');
  assert.equal(reviewedHistoryOutcome(unit, {}, settled), 'execution-failure');

  // A sibling never reported, so the round never finished: nothing about it is settled yet.
  const interrupted = [producer, failedReviewer];
  assert.equal(reviewedHistoryOutcome(unit, {}, interrupted), null, 'an interrupted round has no outcome to publish');
  const dispatched = [];
  const resumed = await runReviewed(unit, {}, {
    history: interrupted,
    runRole: async ({ role, round }) => {
      dispatched.push(`${role}/${round}`);
      return { role, round, outcome: 'pass' };
    },
  });
  // The passed producer is reused; the failed checker is retried beside the missing one.
  assert.deepEqual(dispatched.sort(), ['red-team/1', 'reviewer/1']);
  assert.equal(resumed.outcome, 'pass');
  assert.equal(resumed.rounds, 1);
});
