import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { checkConventionConformance } from '../../src/setup/registrations.mjs';

function initSourceRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-convention-doctor-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (args) => execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const put = (relative, content = '# fixture\n') => {
    const destination = path.join(root, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content);
  };
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.name', 'Convention doctor fixture']);
  git(['config', 'user.email', 'convention-doctor@example.invalid']);
  put('apps/fgos/Cargo.toml', '[package]\nname="fixture"\n');
  put('plans/reports/old-bad.md');
  git(['add', 'apps/fgos/Cargo.toml', 'plans/reports/old-bad.md']);
  git(['commit', '-qm', 'seed source fixture']);
  const cutoff = git(['rev-parse', 'HEAD']);
  put('plans/reports/new-bad.md');
  git(['add', 'plans/reports/new-bad.md']);
  git(['commit', '-qm', 'add newer report']);
  return { root, cutoff };
}

function violation(relativePath) {
  return {
    path: relativePath,
    code: 'pattern-mismatch',
    message: 'name does not match an accepted template',
  };
}

test('convention-conformance is registered once in the doctor registry', () => {
  assert.equal(DOCTOR_CHECKS.filter((entry) => entry.id === 'convention-conformance').length, 1);
});

test('convention doctor pass-skips outside the fgOS source repository', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-convention-consumer-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  let called = false;
  const result = checkConventionConformance(root, {
    hostRunner: () => { called = true; },
  });
  assert.equal(called, false);
  assert.equal(result.passed, true);
  assert.match(result.message, /not the fgOS source repository/);
});

test('convention doctor pass-skips missing, old, and failed hosts with the reason', (t) => {
  const { root } = initSourceRepo(t);
  for (const code of ['host-unavailable', 'host-version-mismatch', 'host-exec-error', 'host-invalid-envelope']) {
    const result = checkConventionConformance(root, {
      hostRunner: () => { const error = new Error(`${code} detail`); error.code = code; throw error; },
    });
    assert.equal(result.passed, true, code);
    assert.match(result.message, new RegExp(code), code);
  }
});

test('convention doctor passes for pre-cutoff violations but fails for post-cutoff violations', (t) => {
  const { root, cutoff } = initSourceRepo(t);
  const oldViolation = violation('plans/reports/old-bad.md');
  const newViolation = violation('plans/reports/new-bad.md');

  const oldOnly = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 1, violations: [oldViolation] }),
    cutoffResolver: () => cutoff,
  });
  assert.equal(oldOnly.passed, true);
  assert.match(oldOnly.message, /1 pre-cutoff, 0 post-cutoff/);

  const oldAndNew = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 2, violations: [oldViolation, newViolation] }),
    cutoffResolver: () => cutoff,
  });
  assert.equal(oldAndNew.passed, false);
  assert.match(oldAndNew.message, /1 pre-cutoff, 1 post-cutoff/);
  assert.match(oldAndNew.message, /old-bad\.md/);
  assert.match(oldAndNew.message, /new-bad\.md/);
});

test('convention doctor reports a clean host result as passed', (t) => {
  const { root } = initSourceRepo(t);
  const result = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 12, violations: [] }),
  });
  assert.deepEqual(result, {
    passed: true,
    message: 'convention check passed: 12 scoped file(s), no violations',
  });
});
