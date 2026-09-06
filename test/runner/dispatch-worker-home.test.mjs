import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createWorkerHome, removeWorkerHome, WorkerHomeError } from '../../src/runner/dispatch/worker-home.mjs';

// Phase 01 group C1. Nothing here touches the operator's real HOME: a synthetic
// source home is built per test and every read comes from that.
//
// The five provisioning items were not designed, they were EXCAVATED -- each one
// found by hitting its own failure while running a real agent in an isolated
// session on 2026-09-06. An empty private HOME is not a private HOME, it is a
// broken one, and each missing item breaks it a different way. Evidence:
// docs/architect/agent-coordination/verification/visibility-herdr/proofs/
//   2026-09-06-isolation/agent-in-session-findings.md and permission-posture-findings.md

const REPO_ROOT = '/home/someone/projects/repo';
const WORKSPACE = '/var/tmp/fgos-wt-example';

function synthSourceHome({ trustedRoot = REPO_ROOT, withCredential = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-src-home-'));
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude.json'), JSON.stringify({
    projects: { [trustedRoot]: { hasTrustDialogAccepted: true, allowedTools: [] } },
  }, null, 2));
  if (withCredential) {
    fs.writeFileSync(path.join(dir, '.claude', '.credentials.json'), '{"synthetic":"not-a-real-credential"}', { mode: 0o600 });
  }
  return { dir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function withBase(fn) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-homes-'));
  try { return fn(base); } finally { fs.rmSync(base, { recursive: true, force: true }); }
}

test('C1: a bypass home carries all five provisioning items', () => {
  const src = synthSourceHome();
  try {
    withBase((base) => {
      const { homePath } = createWorkerHome(base, {
        runId: 'run-1', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'bypass',
      });
      // 1. a shell rc, or zsh runs its first-run wizard and eats the first
      //    keystroke of the launch command: `claude` arrives as `laude`
      assert.ok(fs.existsSync(path.join(homePath, '.zshrc')), 'item 1: .zshrc');
      // 2. provider auth
      assert.ok(fs.existsSync(path.join(homePath, '.claude', '.credentials.json')), 'item 2: credential');
      const cfg = JSON.parse(fs.readFileSync(path.join(homePath, '.claude.json'), 'utf8'));
      // 3. onboarding, or the agent sits in its theme picker while herdr reports it idle
      assert.equal(cfg.hasCompletedOnboarding, true, 'item 3: onboarding');
      assert.ok(typeof cfg.theme === 'string' && cfg.theme.length > 0, 'item 3: theme');
      // 4. folder trust for the workspace it will actually run in
      assert.equal(cfg.projects[WORKSPACE].hasTrustDialogAccepted, true, 'item 4: trust');
      // 5. the one-time bypass acceptance screen, which would otherwise block startup
      const settings = JSON.parse(fs.readFileSync(path.join(homePath, '.claude', 'settings.json'), 'utf8'));
      assert.equal(settings.skipDangerousModePermissionPrompt, true, 'item 5: bypass acceptance');
    });
  } finally { src.cleanup(); }
});

test('C1/C5: an ask-mode home does NOT get the bypass acceptance -- never grant more than was declared', () => {
  const src = synthSourceHome();
  try {
    withBase((base) => {
      const { homePath } = createWorkerHome(base, {
        runId: 'run-2', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'ask',
      });
      const settingsPath = path.join(homePath, '.claude', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        assert.notEqual(settings.skipDangerousModePermissionPrompt, true,
          'ask mode must not pre-accept the bypass warning');
      }
      // the other four are still required -- ask mode is not an excuse for a broken home
      assert.ok(fs.existsSync(path.join(homePath, '.zshrc')));
      assert.ok(fs.existsSync(path.join(homePath, '.claude', '.credentials.json')));
    });
  } finally { src.cleanup(); }
});

test('B1 still applies through this door: an untrusted repo root refuses, and writes no home', () => {
  const src = synthSourceHome({ trustedRoot: '/home/someone/projects/other' });
  try {
    withBase((base) => {
      assert.throws(
        () => createWorkerHome(base, {
          runId: 'run-3', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'ask',
        }),
        (err) => {
          assert.ok(err instanceof WorkerHomeError);
          assert.equal(err.code, 'untrusted-root');
          return true;
        },
      );
      assert.deepEqual(fs.readdirSync(base), [], 'a refused create leaves no directory behind');
    });
  } finally { src.cleanup(); }
});

test('a source home with no credential refuses by name -- a home without auth cannot do the work', () => {
  const src = synthSourceHome({ withCredential: false });
  try {
    withBase((base) => {
      assert.throws(
        () => createWorkerHome(base, {
          runId: 'run-4', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'ask',
        }),
        (err) => err instanceof WorkerHomeError && err.code === 'missing-credential',
      );
      assert.deepEqual(fs.readdirSync(base), []);
    });
  } finally { src.cleanup(); }
});

test('the credential is COPIED, not linked, and keeps owner-only permissions', () => {
  const src = synthSourceHome();
  try {
    withBase((base) => {
      const { homePath } = createWorkerHome(base, {
        runId: 'run-5', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'ask',
      });
      const dest = path.join(homePath, '.claude', '.credentials.json');
      assert.equal(fs.lstatSync(dest).isSymbolicLink(), false,
        'a symlink would let the worker walk back into the operator home');
      assert.equal(fs.statSync(dest).mode & 0o777, 0o600, 'the copy must not widen the original permissions');
    });
  } finally { src.cleanup(); }
});

test('each Run gets its own home, and removeWorkerHome takes it away entirely', () => {
  const src = synthSourceHome();
  try {
    withBase((base) => {
      const a = createWorkerHome(base, { runId: 'run-a', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'ask' });
      const b = createWorkerHome(base, { runId: 'run-b', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'ask' });
      assert.notEqual(a.homePath, b.homePath, 'two Runs never share a home');

      assert.equal(removeWorkerHome(a.homePath), true);
      assert.equal(fs.existsSync(a.homePath), false);
      assert.equal(fs.existsSync(b.homePath), true, 'removing one leaves the other alone');
      assert.equal(removeWorkerHome(a.homePath), false, 'removing an absent home is false, not an error');
    });
  } finally { src.cleanup(); }
});

test('removeWorkerHome refuses a path it did not create -- teardown must never delete an arbitrary directory', () => {
  const stranger = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-not-a-home-'));
  fs.writeFileSync(path.join(stranger, 'important.txt'), 'do not delete me');
  try {
    assert.throws(
      () => removeWorkerHome(stranger),
      (err) => err instanceof WorkerHomeError && err.code === 'not-a-worker-home',
    );
    assert.ok(fs.existsSync(path.join(stranger, 'important.txt')), 'the stranger directory is untouched');
  } finally { fs.rmSync(stranger, { recursive: true, force: true }); }
});

test('the created home contains nothing beyond what was provisioned', () => {
  const src = synthSourceHome();
  try {
    withBase((base) => {
      const { homePath } = createWorkerHome(base, {
        runId: 'run-6', sourceHome: src.dir, workspacePath: WORKSPACE, repoRoot: REPO_ROOT, permissionMode: 'bypass',
      });
      const top = fs.readdirSync(homePath).sort();
      assert.deepEqual(top, ['.claude', '.claude.json', '.fgos-worker-home', '.zshrc'],
        'a private home is a known, small set of files -- not a copy of the operator home');
    });
  } finally { src.cleanup(); }
});
