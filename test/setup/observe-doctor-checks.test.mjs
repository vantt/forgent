import '../helpers/process-tmp-root.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import {
  DOCTOR_CHECKS,
  checkObserveDirWritable,
  checkObserveHostResolvable,
  checkObserveRunCoverage,
} from '../../src/setup/registrations.mjs';
function mkTempDir() {
  const dir = path.join(tmpdir(), 'fgos-doctor-observe-test-' + Math.random().toString(36).slice(2));
  fs.mkdirSync(dir, { recursive: true });
  initializeWorkRepository(dir);
  return dir;
}

test('observe doctor checks are registered in DOCTOR_CHECKS', () => {
  const ids = DOCTOR_CHECKS.map((c) => c.id);
  assert.ok(ids.includes('observe-dir-writable'));
  assert.ok(ids.includes('observe-host-resolvable'));
});

test('observe-dir-writable passes and creates .fgos/observe', () => {
  const cwd = mkTempDir();
  try {
    const res = checkObserveDirWritable(cwd);
    assert.equal(res.passed, true);
    assert.ok(fs.existsSync(path.join(cwd, '.fgos', 'observe')));
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('observe-host-resolvable verifies host binary status', () => {
  const originalHostBin = process.env.FGOS_HOST_BIN;
  try {
    // 1. Invalid/failing host binary fails
    const dummyScript = path.join(tmpdir(), 'failing-host-bin-' + Math.random().toString(36).slice(2) + '.sh');
    fs.writeFileSync(dummyScript, '#!/bin/sh\nexit 1\n', { mode: 0o755 });
    try {
      process.env.FGOS_HOST_BIN = dummyScript;
      const resUnavailable = checkObserveHostResolvable('/tmp');
      assert.equal(resUnavailable.passed, false);
    } finally {
      if (fs.existsSync(dummyScript)) fs.unlinkSync(dummyScript);
    }

    // 2. Built host binary passes
    const builtHost = path.resolve('target', 'debug', 'fgos');
    if (fs.existsSync(builtHost)) {
      process.env.FGOS_HOST_BIN = builtHost;
      const resPass = checkObserveHostResolvable(process.cwd());
      assert.equal(resPass.passed, true);
      assert.match(resPass.message, /resolved and verified/);
    }
  } finally {
    if (originalHostBin !== undefined) {
      process.env.FGOS_HOST_BIN = originalHostBin;
    } else {
      delete process.env.FGOS_HOST_BIN;
    }
  }
});

test('observe-host-resolvable fails when the host refuses to read the friction store', { skip: !process.env.FGOS_HOST_BIN }, () => {
  const root = fs.mkdtempSync(path.join(tmpdir(), 'fgos-observe-probe-'));
  try {
    assert.equal(checkObserveHostResolvable(root).passed, true);
    const frictionDir = path.join(root, '.fgos', 'observe', 'friction');
    fs.mkdirSync(frictionDir, { recursive: true });
    fs.writeFileSync(path.join(root, 'outside.jsonl'), '{}\n');
    fs.symlinkSync(path.join(root, 'outside.jsonl'), path.join(frictionDir, 'planted.jsonl'));
    const refused = checkObserveHostResolvable(root);
    assert.equal(refused.passed, false);
    assert.match(refused.message, /regular file/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function coverageData(runDirsSeen, recentRuns = 0) {
  return { layoutRule: 'v2', runDirsSeen, observed: runDirsSeen, skipped: {}, recentRuns };
}

test('run coverage detects a stable hidden settled nested run', () => {
  const cwd = mkTempDir();
  try {
    const runDir = path.join(cwd, '.fgos/assignments/unit-run-example/panelist-1/1/runs/01');
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ runId: 'nested', timestamp: '2026-10-05T10:00:00Z' }));
    fs.utimesSync(path.join(runDir, 'result.json'), 1, 1);
    fs.utimesSync(runDir, 1, 1);
    assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => coverageData(0) }).passed, false);
    assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => coverageData(1) }).passed, true);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('run coverage tolerates a new directory without a result but not stale directory omissions', () => {
  const cwd = mkTempDir();
  try {
    const runDir = path.join(cwd, '.fgos/assignments/new/runs/01');
    fs.mkdirSync(runDir, { recursive: true });
    assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => coverageData(0) }).passed, true);
    fs.utimesSync(runDir, 1, 1);
    assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => coverageData(0) }).passed, false);
    const matching = { ...coverageData(1), observed: 0, skipped: { 'missing-result': 1 } };
    assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => matching }).passed, true);
    assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => ({ ...matching, runDirsSeen: 2, skipped: { 'missing-result': 2 }, recentRuns: 1 }) }).passed, true);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('run coverage failure labels its sample paths as candidates, not as confirmed missing runs', () => {
  const cwd = mkTempDir();
  try {
    const runDir = path.join(cwd, '.fgos/assignments/unit/panelist-1/1/runs/01');
    fs.mkdirSync(runDir, { recursive: true });
    fs.utimesSync(runDir, 1, 1);
    const result = checkObserveRunCoverage(cwd, { hostRunner: () => coverageData(0) });
    assert.equal(result.passed, false);
    assert.match(result.message, /directories Node 1, host 0 \(difference 1\)/);
    assert.ok(
      result.message.endsWith(`sample candidates (not confirmed missing): ${path.join('.fgos', 'assignments', 'unit', 'panelist-1', '1', 'runs', '01')}`),
      result.message,
    );
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('run coverage uses directory recency with a bounded sixty-second window and bounded clock skew', () => {
  const cwd = mkTempDir();
  const now = Date.parse('2026-10-06T12:00:00Z');
  try {
    const runDir = path.join(cwd, '.fgos/assignments/racing/runs/01');
    fs.mkdirSync(runDir, { recursive: true });
    // A future mtime is recent only within the skew bound; a far-future one
    // must never keep widening the tolerance.
    for (const [mtime, passed] of [
      [now - 60_000, true], [now - 61_000, false],
      [now + 60_000, true], [now + 61_000, false], [now + 365 * 86_400_000, false],
    ]) {
      fs.utimesSync(runDir, new Date(mtime), new Date(mtime));
      assert.equal(checkObserveRunCoverage(cwd, { now, hostRunner: () => coverageData(0) }).passed, passed);
    }
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ runId: 'racing', timestamp: '2026-10-05T10:00:00Z' }));
    fs.utimesSync(path.join(runDir, 'result.json'), new Date(now), new Date(now));
    fs.utimesSync(runDir, 1, 1);
    assert.equal(checkObserveRunCoverage(cwd, { now, hostRunner: () => coverageData(0) }).passed, false);
    assert.equal(checkObserveRunCoverage(cwd, { now, hostRunner: () => coverageData(2, 1) }).passed, true);
    fs.utimesSync(path.join(runDir, 'result.json'), 1, 1);
    fs.utimesSync(runDir, new Date(now), new Date(now));
    assert.equal(checkObserveRunCoverage(cwd, { now, hostRunner: () => coverageData(0) }).passed, true);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('run coverage positively identifies old hosts without hiding execution failures', () => {
  const cwd = mkTempDir();
  try {
    for (const hostRunner of [
      () => { throw Object.assign(new Error('unknown subcommand coverage'), { code: 'host-version-mismatch' }); },
      () => ({ runDirsSeen: 0 }),
    ]) {
      const result = checkObserveRunCoverage(cwd, { hostRunner });
      assert.equal(result.passed, true);
      assert.equal(result.degraded, true);
    }
    for (const code of ['host-unavailable', 'host-exec-error', 'host-invalid-envelope']) {
      assert.equal(checkObserveRunCoverage(cwd, {
        hostRunner: () => { throw Object.assign(new Error(code), { code }); },
      }).passed, false);
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});

test('run coverage accepts empty stores and rejects inconsistent accounting', () => {
  const cwd = mkTempDir();
  try {
    assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => coverageData(0) }).passed, true);
    for (const invalid of [
      null, [], { ...coverageData(0), observed: 1 },
      { ...coverageData(0), skipped: { unparseable: -1 } },
      { ...coverageData(0), layoutRule: 'v3' },
      { ...coverageData(0), recentRuns: 1 },
    ]) {
      assert.equal(checkObserveRunCoverage(cwd, { hostRunner: () => invalid }).passed, false);
    }
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
});
