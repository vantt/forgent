// checks.test.mjs — fgos doctor's check registry (str87-fgos-setup-doctor
// D2) plus CLI-level proof that `fgos setup`/`fgos doctor` (with/without
// --pretty) actually behave as CTR001/D7 require. Mirrors
// test/cli/fgos-manifest.test.mjs's/test/install-packaging.test.mjs's real
// spawnSync harness — no mocking the CLI process itself.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { DOCTOR_CHECKS, integrationScriptPath } from '../../src/setup/checks.mjs';
import { DEFAULT_RUNNER_CONFIG } from '../../src/runner/dispatch.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function checkById(id) {
  const entry = DOCTOR_CHECKS.find((c) => c.id === id);
  assert.ok(entry, `DOCTOR_CHECKS is missing "${id}"`);
  return entry;
}

// ─── Unit tests: DOCTOR_CHECKS ─────────────────────────────────────────────

test('DOCTOR_CHECKS has exactly the three v1 checks from CONTEXT.md D2', () => {
  assert.deepEqual(
    DOCTOR_CHECKS.map((c) => c.id).sort(),
    ['config-not-stale', 'node-version-and-git', 'shell-integration-sourced'].sort(),
  );
});

test('node-version-and-git passes under the current process (real Node, real git)', () => {
  const { passed, message } = checkById('node-version-and-git').check(process.cwd());
  assert.equal(passed, true);
  assert.equal(typeof message, 'string');
});

test('shell-integration-sourced passes trivially when no rc files exist', () => {
  const homeDir = mkTemp('doctor-shell-none-');
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced fails when a detected rc file is missing the source line', () => {
  const homeDir = mkTemp('doctor-shell-missing-');
  fs.writeFileSync(path.join(homeDir, '.bashrc'), 'echo hi\n');
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed, message } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, false);
    assert.ok(message.includes('.bashrc'));
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('shell-integration-sourced passes when every detected rc file already has the source line', () => {
  const homeDir = mkTemp('doctor-shell-present-');
  const rcFile = path.join(homeDir, '.bashrc');
  fs.writeFileSync(rcFile, `source "${integrationScriptPath()}"\n`);
  const prevHome = process.env.HOME;
  process.env.HOME = homeDir;
  try {
    const { passed } = checkById('shell-integration-sourced').check(process.cwd());
    assert.equal(passed, true);
  } finally {
    process.env.HOME = prevHome;
    fs.rmSync(homeDir, { recursive: true, force: true });
  }
});

test('config-not-stale reports failed/not-configured, without creating .fgos-runner.json, when absent', () => {
  const cwd = mkTemp('doctor-config-absent-');
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /not yet configured/);
  assert.equal(fs.existsSync(path.join(cwd, '.fgos-runner.json')), false);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale passes when the existing config already has every default key', () => {
  const cwd = mkTemp('doctor-config-full-');
  fs.writeFileSync(path.join(cwd, '.fgos-runner.json'), JSON.stringify(DEFAULT_RUNNER_CONFIG));
  const { passed } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, true);
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('config-not-stale fails when the existing config is missing a default key', () => {
  const cwd = mkTemp('doctor-config-stale-');
  fs.writeFileSync(path.join(cwd, '.fgos-runner.json'), JSON.stringify({ executor: { command: 'claude', args: [] } }));
  const { passed, message } = checkById('config-not-stale').check(cwd);
  assert.equal(passed, false);
  assert.match(message, /stale config/);
  fs.rmSync(cwd, { recursive: true, force: true });
});

// ─── CLI-level tests: real spawned `fgos setup` / `fgos doctor` ───────────

test('fgos setup (no flags) produces valid wrapEnvelope-shaped JSON on stdout', () => {
  const cwd = mkTemp('setup-cli-json-');
  const homeDir = mkTemp('setup-cli-json-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.contract, 'string');
  assert.ok('data' in envelope);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor (no flags) produces valid wrapEnvelope-shaped JSON on stdout', () => {
  const cwd = mkTemp('doctor-cli-json-');
  const homeDir = mkTemp('doctor-cli-json-home-');
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  const envelope = JSON.parse(result.stdout);
  assert.equal(typeof envelope.contract, 'string');
  assert.ok(Array.isArray(envelope.data.checks));
  assert.equal(envelope.data.checks.length, DOCTOR_CHECKS.length);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor --pretty prints colored ANSI text, not JSON', () => {
  const cwd = mkTemp('doctor-cli-pretty-');
  const homeDir = mkTemp('doctor-cli-pretty-home-');
  const result = spawnSync(process.execPath, [FGOS, 'doctor', '--pretty'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('\x1b['), 'expected ANSI escape codes in --pretty output');
  assert.throws(() => JSON.parse(result.stdout), 'expected --pretty output to NOT be valid JSON');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos setup --pretty prints colored ANSI text describing what it did, not JSON', () => {
  const cwd = mkTemp('setup-cli-pretty-');
  const homeDir = mkTemp('setup-cli-pretty-home-');
  const result = spawnSync(process.execPath, [FGOS, 'setup', '--pretty'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('\x1b['), 'expected ANSI escape codes in --pretty output');
  assert.throws(() => JSON.parse(result.stdout), 'expected --pretty output to NOT be valid JSON');
  assert.ok(result.stdout.includes('.fgos-runner.json'), 'expected --pretty output to describe the config file it touched');
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});

test('fgos doctor against a fresh cwd with no .fgos-runner.json never creates that file (read-only proof)', () => {
  const cwd = mkTemp('doctor-cli-readonly-');
  const homeDir = mkTemp('doctor-cli-readonly-home-');
  const configPath = path.join(cwd, '.fgos-runner.json');
  assert.equal(fs.existsSync(configPath), false);
  const result = spawnSync(process.execPath, [FGOS, 'doctor'], { cwd, encoding: 'utf8', env: { ...process.env, HOME: homeDir } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(configPath), false, 'fgos doctor must never create .fgos-runner.json');
  const envelope = JSON.parse(result.stdout);
  const configCheck = envelope.data.checks.find((c) => c.id === 'config-not-stale');
  assert.equal(configCheck.passed, false);
  fs.rmSync(cwd, { recursive: true, force: true });
  fs.rmSync(homeDir, { recursive: true, force: true });
});
