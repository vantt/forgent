import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { checkConventionConformance } from '../../scripts/convention-conformance.mjs';

function initSourceRepo(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-convention-conformance-'));
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
  git(['config', 'user.name', 'Convention conformance fixture']);
  git(['config', 'user.email', 'convention-conformance@example.invalid']);
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

test('convention conformance fails, naming the reason, when the host is missing, old or failed', (t) => {
  const { root } = initSourceRepo(t);
  for (const code of ['host-unavailable', 'host-version-mismatch', 'host-exec-error', 'host-invalid-envelope']) {
    const result = checkConventionConformance(root, {
      hostRunner: () => { const error = new Error(`${code} detail`); error.code = code; throw error; },
    });
    assert.equal(result.passed, false, code);
    assert.match(result.message, new RegExp(code), code);
  }
});

test('convention conformance passes for pre-cutoff violations but fails for post-cutoff violations', (t) => {
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

test('convention conformance judges violations by their own rule cutoff when rules have different cutoffs', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-convention-conformance-'));
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
  git(['config', 'user.name', 'Convention conformance fixture']);
  git(['config', 'user.email', 'convention-conformance@example.invalid']);
  put('apps/fgos/Cargo.toml', '[package]\nname="fixture"\n');
  put('plans/reports/old-report.md');
  git(['add', 'apps/fgos/Cargo.toml', 'plans/reports/old-report.md']);
  git(['commit', '-qm', 'initial commit with old report']);
  const reportCutoff = git(['rev-parse', 'HEAD']);

  put('plans/reports/mid-report.md');
  put('plans/backlog/old-backlog.md');
  git(['add', 'plans/reports/mid-report.md', 'plans/backlog/old-backlog.md']);
  git(['commit', '-qm', 'second commit with backlog migration and mid report']);
  const backlogCutoff = git(['rev-parse', 'HEAD']);

  put('plans/backlog/new-backlog.md');
  git(['add', 'plans/backlog/new-backlog.md']);
  git(['commit', '-qm', 'third commit with new backlog item']);

  const resolveCutoff = (_root, relPath) => {
    if (relPath.startsWith('plans/backlog/')) return backlogCutoff;
    return reportCutoff;
  };

  const oldBacklogViolation = violation('plans/backlog/old-backlog.md');
  const midReportViolation = violation('plans/reports/mid-report.md');

  // old-backlog was introduced after reportCutoff but at/before backlogCutoff:
  // judged by its own rule's cutoff (backlogCutoff), it is pre-cutoff and passes.
  const backlogResult = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 1, violations: [oldBacklogViolation] }),
    cutoffResolver: resolveCutoff,
  });
  assert.equal(backlogResult.passed, true);
  assert.match(backlogResult.message, /1 pre-cutoff, 0 post-cutoff/);

  // mid-report was introduced after reportCutoff:
  // judged by its own rule's cutoff (reportCutoff), it is post-cutoff and fails.
  const reportResult = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 1, violations: [midReportViolation] }),
    cutoffResolver: resolveCutoff,
  });
  assert.equal(reportResult.passed, false);
  assert.match(reportResult.message, /0 pre-cutoff, 1 post-cutoff/);
  assert.match(reportResult.message, /mid-report\.md/);

  // Together: 1 pre-cutoff, 1 post-cutoff -> fails.
  const combined = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 2, violations: [oldBacklogViolation, midReportViolation] }),
    cutoffResolver: resolveCutoff,
  });
  assert.equal(combined.passed, false);
  assert.match(combined.message, /1 pre-cutoff, 1 post-cutoff/);
});

// One wiring proof only: path/placement cases belong to Convention's Rust golden suite.
test('convention conformance honors native blocking posture without applying the historical warning cutoff', (t) => {
  const { root } = initSourceRepo(t);
  const result = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 1, violations: [{ ...violation('docs/specs/new.md'), posture: 'block' }] }),
    cutoffResolver: () => { throw new Error('blocking posture must not use the naming cutoff'); },
  });
  assert.equal(result.passed, false);
  assert.match(result.message, /placement refused: 1 blocking/);
});

test('convention conformance reports a clean host result as passed', (t) => {
  const { root } = initSourceRepo(t);
  const result = checkConventionConformance(root, {
    hostRunner: () => ({ checked: 12, violations: [] }),
  });
  assert.deepEqual(result, {
    passed: true,
    message: 'convention check passed: 12 scoped file(s), no violations',
  });
});

// The wiring proof over the real repository and the real host.
test('this repository has no blocking convention violation and no post-cutoff naming violation', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const result = checkConventionConformance(root);
  assert.equal(result.passed, true, result.message);
});
