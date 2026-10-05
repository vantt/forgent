// `fgos doctor` is a read-only diagnostic and exits 0 whatever its checks say:
// `fgctl init|upgrade|repair` run `doctor --fix` then `doctor` as their tail and
// mark an install degraded on any non-zero exit, and a project that has not
// been through `fgos setup` yet always has red checks. `--strict` is the opt-in
// that turns a failing check into exit 1 for scripts and CI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

import { FGOS, NO_CLAUDE_ENV, mkTemp } from './helpers/setup-checks-harness.mjs';

function bareGitProject() {
  const project = mkTemp('doctor-strict-project-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: project });
  return project;
}

function runDoctor(project, args) {
  const home = mkTemp('doctor-strict-home-');
  try {
    return spawnSync(process.execPath, [FGOS, 'doctor', ...args], {
      cwd: project,
      encoding: 'utf8',
      env: { ...NO_CLAUDE_ENV, HOME: home, USERPROFILE: home },
    });
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
}

test('fgos doctor exits 0 by default even when a check fails', () => {
  const project = bareGitProject();
  try {
    const res = runDoctor(project, []);
    assert.equal(res.status, 0, res.stderr);
    const { checks } = JSON.parse(res.stdout).data;
    assert.ok(checks.some((c) => c.passed === false), 'a bare project is expected to have a failing check');
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('fgos doctor --strict exits 1 when a check fails, and still prints the report', () => {
  const project = bareGitProject();
  try {
    const res = runDoctor(project, ['--strict']);
    assert.equal(res.status, 1, res.stderr);
    const { checks } = JSON.parse(res.stdout).data;
    assert.ok(checks.some((c) => c.passed === false));
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});

test('fgos doctor --fix --strict exits 1 when checks still fail after the fixes ran', () => {
  const project = bareGitProject();
  try {
    const res = runDoctor(project, ['--fix', '--strict']);
    assert.equal(res.status, 1, res.stderr);
    const data = JSON.parse(res.stdout).data;
    assert.ok(Array.isArray(data.fixed));
    assert.ok(data.checks.some((c) => c.passed === false));
  } finally {
    fs.rmSync(project, { recursive: true, force: true });
  }
});
