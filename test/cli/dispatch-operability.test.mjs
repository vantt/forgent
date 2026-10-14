import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function runFgos(args, options = {}) {
  return spawnSync(process.execPath, ['bin/fgos.mjs', ...args], {
    cwd: repo,
    encoding: 'utf8',
    ...options,
  });
}

function runDispatchDirect(args, options = {}) {
  return spawnSync(process.execPath, ['src/runner/dispatch.mjs', ...args], {
    cwd: repo,
    encoding: 'utf8',
    ...options,
  });
}

test('fgos dispatch decide returns fgos.v1 envelope with reasonCodes', () => {
  const result = runFgos(['dispatch', 'decide', 'claude-haiku']);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.contract, 'fgos.v1');
  assert.ok(parsed.generated_at);
  assert.ok(parsed.data_hash);
  assert.ok(parsed.data);
  assert.equal(parsed.data.mechanism, 'unavailable');
  assert.equal(parsed.data.configured, false);
  assert.ok(Array.isArray(parsed.data.reasonCodes));
  assert.ok(parsed.data.reasonCodes.includes('selector.unregistered'));
});

test('node src/runner/dispatch.mjs decide returns raw JSON without fgos.v1 envelope (compatibility alias)', () => {
  const result = runDispatchDirect(['decide', 'claude-haiku']);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.contract, undefined);
  assert.equal(parsed.mechanism, 'unavailable');
  assert.equal(parsed.configured, false);
  assert.ok(Array.isArray(parsed.reasonCodes));
  assert.ok(parsed.reasonCodes.includes('selector.unregistered'));
});

test('unknown dispatch sub-verb rejects before requiring runId (exit 4 validation)', () => {
  const result = runFgos(['dispatch', 'unknown-verb']);
  assert.equal(result.status, 4, `expected exit 4, got ${result.status} (stderr: ${result.stderr})`);
  assert.match(result.stderr, /unknown dispatch sub-verb "unknown-verb"/);
  assert.ok(!result.stderr.includes('requires a runId'), `stderr should not mention runId: ${result.stderr}`);
});

test('--run alias works on show-run and not-found maps to exit 2 precondition', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-operability-cli-'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });

  // With --run alias
  const withRun = runFgos(['dispatch', 'show-run', '--run', 'missing-run-1', '--dir', root]);
  assert.equal(withRun.status, 2, `expected exit 2 precondition, got ${withRun.status} (stderr: ${withRun.stderr})`);
  assert.match(withRun.stderr, /no run "missing-run-1"/);

  // With positional runId
  const withPos = runFgos(['dispatch', 'show-run', 'missing-run-2', '--dir', root]);
  assert.equal(withPos.status, 2, `expected exit 2 precondition, got ${withPos.status} (stderr: ${withPos.stderr})`);
  assert.match(withPos.stderr, /no run "missing-run-2"/);

  // With --run-id
  const withRunId = runFgos(['dispatch', 'show-run', '--run-id', 'missing-run-3', '--dir', root]);
  assert.equal(withRunId.status, 2, `expected exit 2 precondition, got ${withRunId.status} (stderr: ${withRunId.stderr})`);
  assert.match(withRunId.stderr, /no run "missing-run-3"/);
});

test('--run alias works on recover and not-found maps to exit 2 precondition', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-operability-cli-'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });

  const withRun = runFgos(['dispatch', 'recover', '--run', 'missing-run-rec', '--dir', root]);
  assert.equal(withRun.status, 2, `expected exit 2 precondition, got ${withRun.status} (stderr: ${withRun.stderr})`);
  assert.match(withRun.stderr, /no run "missing-run-rec"/);
});

test('dispatch reconcile plan with --run without --action exits 4 with actionable validation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-operability-cli-'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });

  const result = runFgos(['dispatch', 'reconcile', 'plan', '--run', 'run-1', '--dir', root]);
  assert.equal(result.status, 4, `expected exit 4 validation, got ${result.status} (stderr: ${result.stderr})`);
  assert.match(result.stderr, /dispatch reconcile plan with --run or --assignment requires --action/);
  assert.match(result.stderr, /collect-result/);
});

test('dispatch reconcile plan with --assignment without --action exits 4 with actionable validation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-operability-cli-'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });

  const result = runFgos(['dispatch', 'reconcile', 'plan', '--assignment', 'asgn-1', '--dir', root]);
  assert.equal(result.status, 4, `expected exit 4 validation, got ${result.status} (stderr: ${result.stderr})`);
  assert.match(result.stderr, /dispatch reconcile plan with --run or --assignment requires --action/);
});

test('fgos dispatch --help correctly renders compound positional fields sub, run-id', () => {
  const result = runFgos(['dispatch', '--help']);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes('positional: sub, run-id'), `help output missing positional: sub, run-id:\n${result.stdout}`);
});

test('dispatch entry in command-registry declares touchesState: true and externalEffect: true, rendered as [write+external] in help (F2)', async () => {
  const { COMMAND_REGISTRY } = await import('../../src/cli/command-registry.mjs');
  const entry = COMMAND_REGISTRY.find((e) => e.name === 'dispatch');
  assert.ok(entry, 'dispatch entry must exist in COMMAND_REGISTRY');
  assert.equal(entry.touchesState, true, 'dispatch touchesState must be true');
  assert.equal(entry.externalEffect, true, 'dispatch externalEffect must be true');

  const helpResult = runFgos(['--help']);
  assert.equal(helpResult.status, 0);
  assert.match(
    helpResult.stdout,
    /fgos dispatch <show-run\|inspect\|watch\|recover\|reconcile\|decide\|probe-account> \[runId\] \[write\+external\]/,
  );
});

test('fgos dispatch decide and node src/runner/dispatch.mjs decide both refuse --repo-root without --cwd', () => {
  const direct = runDispatchDirect(['decide', 'no-such-exec', '--repo-root', '/nonexistent/path/12345']);
  assert.equal(direct.status, 1);
  assert.match(direct.stderr, /--repo-root.*passed without --cwd/);

  const fgos = runFgos(['dispatch', 'decide', 'no-such-exec', '--repo-root', '/nonexistent/path/12345']);
  assert.equal(fgos.status, 4);
  assert.match(fgos.stderr, /--repo-root.*passed without --cwd/);
});
