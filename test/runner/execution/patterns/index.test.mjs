import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPattern, VALID_OUTCOMES } from '../../../../src/runner/execution/patterns/index.mjs';

test('runPattern dispatches solo pattern by default or name', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPattern('solo', { id: 'u-1', objective: 'Solo task' }, {}, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].role, 'producer');
});

test('runPattern dispatches reviewed pattern with parameters', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'reviewed',
    { id: 'u-2', objective: 'Reviewed task', capability: 'code:implement' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.ok(calls.some((c) => c.role === 'producer'));
  assert.ok(calls.some((c) => c.role === 'reviewer'));
  assert.ok(calls.some((c) => c.role === 'red-team'));
});

test('runPattern dispatches panel pattern', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPattern('panel', { id: 'u-3', objective: 'Panel task' }, {}, { runRole });
  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 4); // 3 panelists + 1 synthesizer
});

test('runPattern dispatches named preset "code-change"', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };
  const verify = async () => ({ pass: true });

  const res = await runPattern(
    'code-change',
    { id: 'u-4', objective: 'Change code' },
    {},
    { runRole, verify },
  );

  assert.equal(res.outcome, 'pass');
  assert.ok(calls.some((c) => c.role === 'producer'));
  assert.ok(calls.some((c) => c.role === 'reviewer'));
  assert.ok(calls.some((c) => c.role === 'red-team'));
});

test('runPattern dispatches named preset "consult" with advisor role', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'consult',
    { id: 'u-consult', objective: 'Consult' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].role, 'advisor');
});

test('runPattern dispatches named preset "research-fan-out" with researcher roles', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'research-fan-out',
    { id: 'u-research', objective: 'Research' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 4);
  assert.equal(calls[0].role, 'researcher-1');
  assert.equal(calls[1].role, 'researcher-2');
  assert.equal(calls[2].role, 'researcher-3');
  assert.equal(calls[3].role, 'synthesizer');
});

test('runPattern dispatches named preset "rfc" with reviewer and red-team checkers', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPattern(
    'rfc',
    { id: 'u-rfc', objective: 'RFC review', capability: 'docs:write' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(res.rounds, 1);
  assert.ok(calls.some((c) => c.role === 'producer'));
  assert.ok(calls.some((c) => c.role === 'reviewer'));
  assert.ok(calls.some((c) => c.role === 'red-team'));
});

test('runPattern uses unit.pattern when nameOrPreset is omitted', async () => {
  const calls = [];
  const runRole = async (opts) => {
    calls.push(opts);
    return { role: opts.role, outcome: 'pass' };
  };

  const res = await runPattern(
    null,
    { id: 'u-5', objective: 'From unit pattern', pattern: 'panel' },
    {},
    { runRole },
  );

  assert.equal(res.outcome, 'pass');
  assert.equal(calls.length, 4);
});

test('runPattern rejects unknown pattern names', async () => {
  await assert.rejects(
    async () => {
      await runPattern('non-existent-pattern', { id: 'u-6' }, {}, {});
    },
    /Unknown collaboration pattern: "non-existent-pattern"/,
  );
});

test('VALID_OUTCOMES strictly contains allowed outcomes', () => {
  assert.deepEqual(
    [...VALID_OUTCOMES].sort(),
    ['blocked', 'execution-failure', 'findings', 'pass', 'policy-refusal', 'provider-limit'].sort(),
  );
  assert.ok(!VALID_OUTCOMES.includes('failed'), 'failed must NEVER be an outcome');
});
