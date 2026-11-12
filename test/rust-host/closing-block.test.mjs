// What `fgctl init`, `upgrade` and `repair` print and exit with once the activation is done: the closing block built
// from `fgos doctor --json`. The payload of one release copy answers that call with a canned doctor result, so the
// block's wiring (stdout, exit code, transaction record) is proven independently of the machine running the test; the
// block's wording has its own unit tests beside `closing_block`.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { computeArtifactDigest, hashFile } from '../../scripts/build-rust-distribution.mjs';
import { useReleaseFixture, fixture, runFgctlRaw } from './fgctl-init-fixture.mjs';

useReleaseFixture();

const CANNED = {
  ok: { ok: true, next: [], checks: [{ id: 'fine', status: 'ok' }] },
  pending: { ok: true, next: [], checks: [{ id: 'fine', status: 'ok' }, { id: 'drifted', status: 'warn', fix: 'fgos doctor --fix' }] },
  failing: {
    ok: false,
    next: ['fgos doctor --fix'],
    checks: [
      { id: 'fine', status: 'ok' },
      { id: 'needs-a-fix', status: 'fail', fix: 'fgos doctor --fix' },
      { id: 'needs-a-person', status: 'fail', fix: null, message: 'install the thing' },
    ],
  },
};

/** A copy of the fixture release whose payload prints `CANNED_DOCTOR`'s result for `doctor --json`. */
function releaseWithCannedDoctor() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-closing-rel-'));
  fs.cpSync(fixture.releaseDir, dir, { recursive: true });
  const mjs = path.join(dir, 'libexec', 'legacy-node', 'bin', 'fgos.mjs');
  const original = fs.readFileSync(mjs, 'utf8');
  const lineEnd = original.indexOf('\n');
  const injection = `if (process.env.CALL_LOG) (await import('node:fs')).appendFileSync(process.env.CALL_LOG, process.argv.slice(2).join(' ') + '\\n');\nif (process.env.CANNED_DOCTOR && process.argv.includes('doctor') && process.argv.includes('--json')) {\n  process.stdout.write(JSON.stringify({ contract: 'fgos.v1', data: JSON.parse(process.env.CANNED_DOCTOR) }));\n  process.exit(0);\n}\n`;
  fs.writeFileSync(mjs, original.slice(0, lineEnd + 1) + injection + original.slice(lineEnd + 1));
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const digest = hashFile(mjs);
  for (const f of manifest.files) {
    if (f.path === 'libexec/legacy-node/bin/fgos.mjs') {
      f.digest = digest;
      f.size = fs.statSync(mjs).size;
    }
  }
  manifest.components.legacyNode.digest = digest;
  delete manifest.artifactDigest;
  manifest.artifactDigest = computeArtifactDigest(manifest);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return { dir, digest: manifest.artifactDigest };
}

function withProject(fn) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-closing-home-'));
  const state = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-closing-state-'));
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-closing-proj-'));
  try {
    execFileSync('git', ['init'], { cwd: proj, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: proj });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: proj });
    return fn({ home, state, proj });
  } finally {
    for (const d of [home, state, proj]) fs.rmSync(d, { recursive: true, force: true });
  }
}

const transactionStatus = (state) => {
  const dir = path.join(state, 'installs');
  const [file] = fs.readdirSync(dir);
  return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')).status;
};

test('init ends on Ready and one runnable next step, exits 0 and completes the transaction when doctor is ok', () => {
  const release = releaseWithCannedDoctor();
  try {
    withProject(({ home, state, proj }) => {
      const env = { HOME: home, CANNED_DOCTOR: JSON.stringify(CANNED.ok) };
      const res = runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env });
      assert.equal(res.status, 0, res.stderr);
      const lines = res.stdout.trim().split('\n');
      assert.match(lines[0], new RegExp(`^Ready: fgOS (.+ )?active \\(${release.digest.slice(7, 19)}\\)$`));
      assert.match(lines[1], /^Next: .*fgos run "<prompt>"$/);
      assert.equal(lines.length, 2);
      assert.equal(transactionStatus(state), 'complete');

    });
  } finally {
    fs.rmSync(release.dir, { recursive: true, force: true });
  }
});

// The tail steps only: the payload also logs the hook calls that `doctor --fix` makes.
const calls = (log) => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : []).filter((c) => /^(init|doctor)\b/.test(c));

test('a clean doctor ends the tail after init and one doctor run, and a rerun of the active release says nothing to do', () => {
  const release = releaseWithCannedDoctor();
  try {
    withProject(({ home, state, proj }) => {
      const log = path.join(home, 'calls.log');
      const env = { HOME: home, CANNED_DOCTOR: JSON.stringify(CANNED.ok), CALL_LOG: log };
      const first = runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env });
      assert.equal(first.status, 0, first.stderr);
      assert.deepEqual(calls(log), ['init', 'doctor --json'], 'init always runs; a clean doctor skips doctor --fix');
      fs.rmSync(log);

      for (const args of [['init', '--from', release.dir], ['upgrade', '--from', release.dir]]) {
        const again = runFgctlRaw(args, { cwd: proj, stateHome: state, env });
        assert.equal(again.status, 0, `${args[0]}: ${again.stderr}`);
        assert.match(again.stdout, /^nothing to do: fgOS (.+ )?already active, doctor ok\nNext: .*fgos run "<prompt>"\n$/, args[0]);
        assert.deepEqual(calls(log), ['init', 'doctor --json'], `${args[0]} runs init and one doctor`);
        fs.rmSync(log);
      }
      assert.equal(transactionStatus(state), 'complete');

      const repaired = runFgctlRaw(['repair'], { cwd: proj, stateHome: state, env });
      assert.equal(repaired.status, 0, repaired.stderr);
      assert.match(repaired.stdout, /^Ready: fgOS (.+ )?active /, 'repair re-publishes, so it is never a no-op');
      assert.deepEqual(calls(log), ['init', 'doctor --json']);
    });
  } finally {
    fs.rmSync(release.dir, { recursive: true, force: true });
  }
});

test('a doctor that still names a fix runs doctor --fix and a second doctor before the closing block', () => {
  const release = releaseWithCannedDoctor();
  try {
    withProject(({ home, state, proj }) => {
      const log = path.join(home, 'calls.log');
      const env = { HOME: home, CANNED_DOCTOR: JSON.stringify(CANNED.pending), CALL_LOG: log };
      assert.equal(runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env }).status, 0);
      fs.rmSync(log);
      const again = runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env });
      assert.equal(again.status, 0, again.stderr);
      assert.match(again.stdout, /^Ready: already up to date at /);
      assert.deepEqual(calls(log), ['init', 'doctor --json', 'doctor --fix', 'doctor --json']);
    });
  } finally {
    fs.rmSync(release.dir, { recursive: true, force: true });
  }
});

test('init lists each failing check with its fix, exits 2 (precondition) and marks the transaction degraded when doctor is not ok', () => {
  const release = releaseWithCannedDoctor();
  try {
    withProject(({ home, state, proj }) => {
      const env = { HOME: home, CANNED_DOCTOR: JSON.stringify(CANNED.failing) };
      const res = runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env });
      assert.equal(res.status, 2, 'precondition, the exit-code table\'s code for a ready-later release');
      assert.equal(res.stdout, '2 checks need you:\n  1. needs-a-fix: fgos doctor --fix\n  2. needs-a-person: install the thing\n');
      assert.match(res.stderr, /not ready/);
      assert.equal(transactionStatus(state), 'ready-degraded');
      assert.ok(fs.existsSync(path.join(proj, '.fgos', 'installation', 'activation.json')), 'the release stays activated');
    });
  } finally {
    fs.rmSync(release.dir, { recursive: true, force: true });
  }
});

test('verify prints one line naming the short digest of the verified release', () => {
  withProject(({ home, state, proj }) => {
    const env = { HOME: home };
    runFgctlRaw(['init', '--from', fixture.releaseDir], { cwd: proj, stateHome: state, env });
    const res = runFgctlRaw(['verify'], { cwd: proj, stateHome: state, env });
    assert.equal(res.status, 0, res.stderr);
    assert.equal(res.stdout, `verified ${fixture.digest.slice(7, 19)}\n`);
  });
});

test('status ends with one line naming the active release, or the command to run when there is none', () => {
  withProject(({ home, state, proj }) => {
    const env = { HOME: home };
    const empty = runFgctlRaw(['status'], { cwd: proj, stateHome: state, env });
    assert.equal(empty.stdout.trim().split('\n').pop(), 'no active release in this workspace; run fgctl init');
    runFgctlRaw(['init', '--from', fixture.releaseDir], { cwd: proj, stateHome: state, env });
    const active = runFgctlRaw(['status'], { cwd: proj, stateHome: state, env });
    assert.equal(active.stdout.trim().split('\n').pop(), `active ${fixture.digest.slice(7, 19)}`);
  });
});
