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
  const injection = `if (process.env.CANNED_DOCTOR && process.argv.includes('doctor') && process.argv.includes('--json')) {\n  process.stdout.write(JSON.stringify({ contract: 'fgos.v1', data: JSON.parse(process.env.CANNED_DOCTOR) }));\n  process.exit(0);\n}\n`;
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

      const again = runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env });
      assert.equal(again.status, 0, again.stderr);
      assert.match(again.stdout, new RegExp(`^Ready: already up to date at ${release.digest.slice(7, 19)}`));
    });
  } finally {
    fs.rmSync(release.dir, { recursive: true, force: true });
  }
});

test('init lists each failing check with its fix, exits 1 and marks the transaction degraded when doctor is not ok', () => {
  const release = releaseWithCannedDoctor();
  try {
    withProject(({ home, state, proj }) => {
      const env = { HOME: home, CANNED_DOCTOR: JSON.stringify(CANNED.failing) };
      const res = runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env });
      assert.equal(res.status, 1);
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
