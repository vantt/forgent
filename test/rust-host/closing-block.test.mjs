// What `fgctl init`, `upgrade` and `repair` print and exit with once the activation is done: the closing block built
// from `fgos doctor --json`. The doctor is the host's; the rows of the Node-owned layers come from the payload's
// rows bridge, which one release copy answers with canned rows, so the block's wiring (stdout, exit code,
// transaction record) is proven independently of the machine running the test; the block's wording has its own unit
// tests beside `closing_block`.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { computeArtifactDigest, hashFile } from '../../scripts/build-rust-distribution.mjs';
import { useReleaseFixture, fixture, runFgctl, runFgctlRaw, removeStateHome } from './fgctl-init-fixture.mjs';

useReleaseFixture();

// What the bridge answers per row id; every row it is not told about passes. The registry decides the level of a row
// and the fix of a failing one: a fail of a row a registered fix repairs names `fgos doctor --fix`.
const CANNED = {
  ok: {},
  pending: { 'curl-available': { passed: true, message: 'warning: drifted', fixCommand: 'fgos doctor --fix' } },
  failing: {
    'project-fgos-launcher': { passed: false, message: 'the launcher is stale' },
    'curl-available': { passed: false, message: 'install the thing' },
  },
};

/** The payload's rows bridge of a release copy, replaced by one that answers from `CANNED_DOCTOR` and logs each call. */
const CANNED_BRIDGE = `import fs from 'node:fs';
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
if (process.env.CALL_LOG) fs.appendFileSync(process.env.CALL_LOG, 'doctor ' + input.phase + '\\n');
const canned = JSON.parse(process.env.CANNED_DOCTOR ?? '{}');
const write = (kind, body) => fs.writeSync(1, '\\u001eFGOS-DOCTOR-BRIDGE ' + JSON.stringify({ kind, ...body }) + '\\n');
for (const id of input.ids) {
  if (input.phase === 'fix') write('fix', { id, changed: false, message: 'canned' });
  else write('row', { id, ...(canned[id] ?? { passed: true, message: 'fine' }) });
}
write('end', { count: input.ids.length });
`;

/** A copy of the fixture release whose rows bridge answers the canned rows, and whose payload logs its own calls. */
function releaseWithCannedDoctor() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgctl-closing-rel-'));
  fs.cpSync(fixture.releaseDir, dir, { recursive: true });
  const payload = path.join(dir, 'libexec', 'legacy-node');
  const mjs = path.join(payload, 'bin', 'fgos.mjs');
  const original = fs.readFileSync(mjs, 'utf8');
  const lineEnd = original.indexOf('\n');
  const injection = `if (process.env.CALL_LOG) (await import('node:fs')).appendFileSync(process.env.CALL_LOG, process.argv.slice(2).join(' ') + '\\n');\n`;
  fs.writeFileSync(mjs, original.slice(0, lineEnd + 1) + injection + original.slice(lineEnd + 1));
  const bridge = path.join(payload, 'src', 'setup', 'doctor-bridge.mjs');
  fs.writeFileSync(bridge, CANNED_BRIDGE);
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const digest = hashFile(mjs);
  for (const f of manifest.files) {
    if (f.path === 'libexec/legacy-node/bin/fgos.mjs') {
      f.digest = digest;
      f.size = fs.statSync(mjs).size;
    }
    if (f.path === 'libexec/legacy-node/src/setup/doctor-bridge.mjs') {
      f.digest = hashFile(bridge);
      f.size = fs.statSync(bridge).size;
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
    removeStateHome(state);
    for (const d of [home, proj]) fs.rmSync(d, { recursive: true, force: true });
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

// The tail steps only: the payload also logs the hook calls that `doctor --fix` makes, and the bridge each of its calls.
const calls = (log) => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n') : []).filter((c) => /^(init|doctor)\b/.test(c));

test('a clean doctor ends the tail after init and one doctor run, and a rerun of the active release says nothing to do', () => {
  const release = releaseWithCannedDoctor();
  try {
    withProject(({ home, state, proj }) => {
      const log = path.join(home, 'calls.log');
      const env = { HOME: home, CANNED_DOCTOR: JSON.stringify(CANNED.ok), CALL_LOG: log };
      const first = runFgctlRaw(['init', '--from', release.dir], { cwd: proj, stateHome: state, env });
      assert.equal(first.status, 0, first.stderr);
      assert.deepEqual(calls(log), ['init', 'doctor check'], 'init always runs; a clean doctor skips doctor --fix');
      fs.rmSync(log);

      for (const args of [['init', '--from', release.dir], ['upgrade', '--from', release.dir]]) {
        const again = runFgctlRaw(args, { cwd: proj, stateHome: state, env });
        assert.equal(again.status, 0, `${args[0]}: ${again.stderr}`);
        assert.match(again.stdout, /^nothing to do: fgOS (.+ )?already active, doctor ok\nNext: .*fgos run "<prompt>"\n$/, args[0]);
        assert.deepEqual(calls(log), ['init', 'doctor check'], `${args[0]} runs init and one doctor`);
        fs.rmSync(log);
      }
      assert.equal(transactionStatus(state), 'complete');

      const repaired = runFgctlRaw(['repair'], { cwd: proj, stateHome: state, env });
      assert.equal(repaired.status, 0, repaired.stderr);
      assert.match(repaired.stdout, /^Ready: fgOS (.+ )?active /, 'repair re-publishes, so it is never a no-op');
      assert.deepEqual(calls(log), ['init', 'doctor check']);
    });
  } finally {
    fs.rmSync(release.dir, { recursive: true, force: true });
  }
});

test('a doctor that still names a fix runs doctor --fix (its fixes, then its rows) and a second doctor before the closing block', () => {
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
      assert.deepEqual(calls(log), ['init', 'doctor check', 'doctor fix', 'doctor check', 'doctor check']);
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
      assert.equal(res.stdout, '2 checks need you:\n  1. project-fgos-launcher: fgos doctor --fix\n  2. curl-available: install the thing\n');
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

test('repair keeps the release tag the committed pin already names', () => {
  withProject(({ home, state, proj }) => {
    const env = { HOME: home };
    fs.mkdirSync(path.join(proj, '.fgos'), { recursive: true });
    const pinPath = path.join(proj, '.fgos', 'distribution.json');
    const pin = { schemaVersion: 1, projectRuntime: { policy: 'exact-digest', artifactDigest: fixture.digest, releaseVersion: 'v1.2.0', channel: null, allowPrerelease: false } };
    fs.writeFileSync(pinPath, JSON.stringify(pin));
    const init = runFgctl(['init', '--from', fixture.releaseDir], { cwd: proj, stateHome: state, env });
    assert.equal(init.status, 0, init.stderr);
    assert.equal(JSON.parse(fs.readFileSync(pinPath, 'utf8')).projectRuntime.releaseVersion, 'v1.2.0', 'precondition: init keeps the tag');
    const repaired = runFgctl(['repair'], { cwd: proj, stateHome: state, env });
    assert.equal(repaired.status, 0, repaired.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(pinPath, 'utf8')), pin, 'repair re-publishes the same release, so the pin stays as committed');
  });
});

test('an upgrade to the release that is already active names the active release digest in its up-to-date line', () => {
  withProject(({ home, state, proj }) => {
    const env = { HOME: home };
    runFgctl(['init', '--from', fixture.releaseDir], { cwd: proj, stateHome: state, env });
    const res = runFgctl(['upgrade', '--from', fixture.releaseDir], { cwd: proj, stateHome: state, env });
    assert.match(res.stderr, /^fgctl: up to date with the release \(/m, res.stderr);
    assert.match(res.stderr, new RegExp(`^fgctl: up to date with the release \\(${fixture.digest.slice(7, 19)}\\)$`, 'm'), res.stderr);
  });
});
