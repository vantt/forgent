// test/install-packaging.test.mjs — distribution-packaging (P29) e2e proof.
//
// Proves the packaging surface built in distribution-packaging-1 (package.json
// `version`/`files`) actually works end to end via real spawned processes: no
// fixtures or mocks of npm or the install mechanism, per critical-patterns.md
// "Claim hành-vi cần enforcement THẬT". Mirrors the real-process assertion shape
// already used by test/e2e/coexistence-canary.test.mjs
// (spawnSync(process.execPath, [FGOS, 'init'], { cwd: fx, encoding: 'utf8' })).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

function mkTemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

// REPO_ROOT/.fgos is this workshop's own tracked dogfood data (confirmed in
// plan.md's discovery notes) — it legitimately exists already, so the
// "source repo untouched" proof must be a byte-snapshot diff, not an
// existence check. Mirrors coexistence-canary.test.mjs's snapshotTree idiom.
function snapshotDir(root) {
  const out = new Map();
  if (!fs.existsSync(root)) return out;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      out.set(path.relative(root, full), fs.readFileSync(full));
    }
  }
  walk(root);
  return out;
}

// tsk-1u77: this dev environment routinely runs 100+ concurrent worktree
// sessions that all resolve to and legitimately write the SAME main-checkout
// .fgos/events.jsonl/state.json/main-checkout.lock during this test's
// several-second npm subprocess window -- real, ambient activity unrelated
// to the external `fgos init` under test. A byte-identical before/after
// snapshot diff (the prior shape of this check) misread that legitimate
// concurrent growth as a failure -- and retrying/waiting cannot fix it,
// since concurrent writes are durable (a real event landed), not transient.
// `externalCwd` here is not even a git repo, so `fgos init`'s own cwd-based
// dataDir resolution (no main-checkout walk at all) has no possible code
// path to REPO_ROOT/.fgos regardless -- what this check can actually catch
// is the external process's own tmp paths leaking into the source repo's
// store, so it asserts that directly instead of byte-identical equality.
function assertNoLeakedPaths(afterSnapshot, leakedPaths, contextLabel) {
  for (const [rel, content] of afterSnapshot) {
    const text = content.toString('utf8');
    for (const leaked of leakedPaths) {
      assert.ok(
        !text.includes(leaked),
        `${contextLabel} must not leak "${leaked}" into the source repo's own .fgos/${rel}`,
      );
    }
  }
}

test('e2e: npm pack -> npm install -g -> fgos init from a fresh external cwd', () => {
  // Three separate scratch dirs, per the cell's proof design: pack output,
  // install --prefix, and a fresh external cwd distinct from the repo, the
  // pack scratch dir, and the install prefix.
  const packDir = mkTemp('fgos-pack-');
  const installPrefix = mkTemp('fgos-install-');
  const externalCwd = mkTemp('fgos-external-');

  try {
    // (1) npm pack into the scratch dir — never a bare `npm pack` in repo/,
    // which would drop an untracked .tgz into the tracked repo root.
    // Windows resolves 'npm' to npm.cmd, which the OS loader can't exec
    // directly -- shell:true is required there, same as the fgos/init
    // shims below (tsk-49r D5).
    const packOut = execFileSync(
      'npm',
      ['pack', '--json', '--pack-destination', packDir],
      { cwd: REPO_ROOT, encoding: 'utf8', shell: process.platform === 'win32' },
    );
    const packInfo = JSON.parse(packOut);
    const tarballName = packInfo[0].filename; // never hardcode forgent-0.1.0.tgz
    const tarballPath = path.join(packDir, tarballName);
    assert.ok(fs.existsSync(tarballPath), `tarball not found at ${tarballPath}`);

    // (2) npm install -g the discovered tarball into a scratch --prefix.
    const install = spawnSync(
      'npm',
      ['install', '-g', tarballPath, '--prefix', installPrefix],
      { cwd: packDir, encoding: 'utf8', shell: process.platform === 'win32' },
    );
    assert.equal(install.status, 0, `npm install -g failed: ${install.stderr}`);

    // (3) content-scoping: the installed package tree excludes .fgos/ and
    // test/ (the `files` allowlist actually took effect).
    // Windows global installs place the package straight under
    // <prefix>/node_modules (no `lib` folder) and drop executable shims
    // (.cmd/extensionless/.ps1) directly in <prefix>/, never a `bin/`
    // subfolder -- confirmed via npm's own docs (tsk-49r D5). macOS follows
    // the same layout as Linux, so only win32 needs its own branch here.
    const installedPkgDir = process.platform === 'win32'
      ? path.join(installPrefix, 'node_modules', 'forgent')
      : path.join(installPrefix, 'lib', 'node_modules', 'forgent');
    assert.ok(fs.existsSync(installedPkgDir), `installed package dir not found at ${installedPkgDir}`);
    assert.equal(fs.existsSync(path.join(installedPkgDir, '.fgos')), false, '.fgos/ must not ship in the installed package');
    assert.equal(fs.existsSync(path.join(installedPkgDir, 'test')), false, 'test/ must not ship');

    // (4) invoke the installed binary's `init` verb from a SEPARATE fresh
    // external tmp cwd (not the repo, not the install prefix, not the pack
    // scratch dir) and assert cwd-based dataDir behavior (D3, unchanged from P10).
    const fgosBin = process.platform === 'win32'
      ? path.join(installPrefix, 'fgos.cmd')
      : path.join(installPrefix, 'bin', 'fgos');
    assert.ok(fs.existsSync(fgosBin), `installed fgos binary not found at ${fgosBin}`);

    const fgosRunnerBin = process.platform === 'win32'
      ? path.join(installPrefix, 'fgos-runner.cmd')
      : path.join(installPrefix, 'bin', 'fgos-runner');
    assert.ok(fs.existsSync(fgosRunnerBin), `installed fgos-runner binary not found at ${fgosRunnerBin}`);
    // The exec bit is a POSIX-only concept -- Windows .cmd shims have no
    // equivalent permission bit, so existence above is already the real
    // proof there; only assert executability where the bit exists.
    if (process.platform !== 'win32') {
      const fgosRunnerMode = fs.statSync(fgosRunnerBin).mode;
      assert.ok(fgosRunnerMode & fs.constants.S_IXUSR, 'installed fgos-runner binary must be executable');
    }

    // Windows can't exec a .cmd shim directly through the OS loader --
    // shell:true is required there (Node child_process gotcha); posix
    // binaries need no shell.
    const init = spawnSync(fgosBin, ['init'], {
      cwd: externalCwd,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    assert.equal(init.status, 0, `fgos init failed: ${init.stderr}`);

    const externalFgosDir = path.join(externalCwd, '.fgos');
    assert.ok(fs.existsSync(externalFgosDir), '.fgos/ must be created in the external cwd, not the repo or install prefix');
    assert.equal(fs.existsSync(path.join(installPrefix, '.fgos')), false, '.fgos/ must not be created inside the install prefix');

    const repoFgosAfter = snapshotDir(path.join(REPO_ROOT, '.fgos'));
    assertNoLeakedPaths(repoFgosAfter, [externalCwd, installPrefix, packDir], 'fgos init from the external cwd');
  } finally {
    fs.rmSync(packDir, { recursive: true, force: true });
    fs.rmSync(installPrefix, { recursive: true, force: true });
    fs.rmSync(externalCwd, { recursive: true, force: true });
  }
});

test('no stray pack artifact is left under repo/ after packing', () => {
  const stray = fs.readdirSync(REPO_ROOT).filter((f) => f.endsWith('.tgz'));
  assert.deepEqual(stray, [], `repo/ must contain no .tgz pack artifact: ${stray.join(', ')}`);
});

// tsk-1u77: assertNoLeakedPaths directly, proving both halves of the fix
// without paying for the full npm-pack/install e2e flow again.

test('tsk-1u77: assertNoLeakedPaths tolerates unrelated concurrent-session content, the exact false-positive the old byte-diff check produced', () => {
  // Simulates a concurrent session legitimately appending a real event to
  // events.jsonl during the test's window -- content genuinely differs
  // from any "before" snapshot, but names none of the external tmp paths.
  const snapshot = new Map([
    ['events.jsonl', Buffer.from('{"seq":9001,"type":"work.move","payload":{"id":"tsk-unrelated","to":"doing"}}\n')],
    ['state.json', Buffer.from('{"work":{"tsk-unrelated":{"status":"doing"}}}\n')],
  ]);
  assert.doesNotThrow(() => assertNoLeakedPaths(snapshot, ['/tmp/fgos-external-abc123', '/tmp/fgos-install-def456', '/tmp/fgos-pack-ghi789'], 'fgos init from the external cwd'));
});

test('tsk-1u77: assertNoLeakedPaths still catches a real leak of an external tmp path', () => {
  const externalPath = '/tmp/fgos-external-abc123';
  const snapshot = new Map([
    ['events.jsonl', Buffer.from(`{"seq":9001,"type":"decision","payload":{"text":"wrote from ${externalPath}"}}\n`)],
  ]);
  assert.throws(
    () => assertNoLeakedPaths(snapshot, [externalPath, '/tmp/fgos-install-def456', '/tmp/fgos-pack-ghi789'], 'fgos init from the external cwd'),
    /must not leak/,
  );
});
