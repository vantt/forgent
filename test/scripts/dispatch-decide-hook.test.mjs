import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Real, live runs of the actual hook script -- no fixture stands in for
// `decide`'s own real subprocess call (tsk-60f's own verify field demands
// this be proven "bằng lần chạy thật, không phải fixture").

const hookPath = fileURLToPath(new URL('../../scripts/dispatch-decide-hook.mjs', import.meta.url));

function mkTempGitRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-decide-hook-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '--allow-empty', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function writeRunnerConfigFixture(root, cfg) {
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'config.json'), JSON.stringify({ runner: cfg }, null, 2));
}

function runHook(repoRoot, payload) {
  return spawnSync(process.execPath, [hookPath], {
    encoding: 'utf8',
    cwd: repoRoot,
    input: JSON.stringify(payload),
  });
}

test('allows a real Agent call with no registered executor for its subagent_type -- resolves in-process via --needs-soul default', () => {
  const repoRoot = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = runHook(repoRoot, { tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose' }, cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /BLOCKED/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('blocks a real Agent call whose subagent_type resolves to a registered out-of-process executor', () => {
  const repoRoot = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: 'claude', args: ['{prompt}'] },
    capabilities: { blocked: {} },
    executors: { 'tool-only': { kind: 'tool', for: ['blocked'], command: 'agy', args: ['{prompt}'], allowCrossProvider: true } },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = runHook(repoRoot, { tool_name: 'Agent', tool_input: { subagent_type: 'blocked' }, cwd: repoRoot });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /BLOCKED/);
  assert.match(result.stderr, /dispatch\.mjs execute/);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('allows a real Task call the same way an Agent call resolves (both tool names enforced identically)', () => {
  const repoRoot = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = runHook(repoRoot, { tool_name: 'Task', tool_input: { subagent_type: 'general-purpose' }, cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('ignores a non-Agent/Task tool call entirely -- never even calls decide', () => {
  const repoRoot = mkTempGitRepo();
  const result = runHook(repoRoot, { tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: repoRoot });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fails open (allows) on empty stdin', () => {
  const repoRoot = mkTempGitRepo();
  const result = spawnSync(process.execPath, [hookPath], { encoding: 'utf8', cwd: repoRoot, input: '' });
  assert.equal(result.status, 0);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fails open (allows) on malformed JSON stdin', () => {
  const repoRoot = mkTempGitRepo();
  const result = spawnSync(process.execPath, [hookPath], { encoding: 'utf8', cwd: repoRoot, input: 'not json{{{' });
  assert.equal(result.status, 0);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('fails open (allows) when the payload cwd is not inside any git checkout', () => {
  const notARepo = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-decide-hook-no-git-'));
  const result = spawnSync(process.execPath, [hookPath], {
    encoding: 'utf8',
    cwd: notARepo,
    input: JSON.stringify({ tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose' }, cwd: notARepo }),
  });
  assert.equal(result.status, 0);
  fs.rmSync(notARepo, { recursive: true, force: true });
});

test('defaults subagent_type to "general-purpose" when tool_input omits it, matching the Agent tool\'s own default', () => {
  const repoRoot = mkTempGitRepo();
  writeRunnerConfigFixture(repoRoot, {
    executor: { command: 'claude', args: ['{prompt}'] },
    models: { standard: 'sonnet' },
    timeoutMs: 5000,
  });
  const result = runHook(repoRoot, { tool_name: 'Agent', tool_input: {}, cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});
