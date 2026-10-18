// The time one run may take: a duration a person types (`fgos run --timeout 90m`), checked against
// one floor and one ceiling.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseRunTimeout, assertRunTimeoutMs, RUN_TIMEOUT_MAX_MS, RUN_TIMEOUT_MIN_MS, RunnerConfigError } from '../../src/runner/dispatch/config.mjs';

test('parseRunTimeout reads a whole number with one unit', () => {
  assert.equal(parseRunTimeout('90m'), 5400000);
  assert.equal(parseRunTimeout('5400s'), 5400000);
  assert.equal(parseRunTimeout('2h'), 7200000);
  assert.equal(parseRunTimeout('600000ms'), 600000);
  for (const bad of ['', '90', 'm', '1.5h', '-5m', '90 m', '1h30m', '90min', 'abc']) {
    assert.throws(() => parseRunTimeout(bad), RunnerConfigError, bad);
  }
});

test('a run timeout is refused under one minute and over four hours', () => {
  assert.equal(RUN_TIMEOUT_MIN_MS, 60000);
  assert.equal(RUN_TIMEOUT_MAX_MS, 4 * 3600000);
  assert.equal(assertRunTimeoutMs(RUN_TIMEOUT_MAX_MS), RUN_TIMEOUT_MAX_MS);
  assert.throws(() => parseRunTimeout('30s'), /at least 1m/);
  assert.throws(() => parseRunTimeout('5h'), /at most 4h/);
  assert.throws(() => assertRunTimeoutMs(Number.NaN), RunnerConfigError);
});

test('a duration too large to count is refused with the text that was typed', () => {
  const huge = `${'9'.repeat(400)}ms`;
  assert.throws(() => parseRunTimeout(huge), (err) => err instanceof RunnerConfigError && err.message.includes(huge.slice(0, 20)) && !/got: null/.test(err.message));
});

test('runner.timeoutMs is held to the same ceiling as a run timeout', async () => {
  const { loadRunnerConfigFromDir } = await import('../../src/runner/dispatch/config.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cfg-timeout-'));
  try {
    fs.mkdirSync(path.join(dir, '.fgos'));
    const write = (timeoutMs) => fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({
      runner: {
        timeoutMs,
        rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
        modelPolicies: { node: { standard: 'node-std' } },
        executors: { 'test-node': { kind: 'agent', command: process.execPath, args: ['{prompt}'], providerModel: 'node' } },
      },
    }));
    write(RUN_TIMEOUT_MAX_MS);
    assert.equal(loadRunnerConfigFromDir(dir).timeoutMs, RUN_TIMEOUT_MAX_MS);
    write(RUN_TIMEOUT_MAX_MS + 1);
    assert.throws(() => loadRunnerConfigFromDir(dir), /timeoutMs.*at most 4h/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
