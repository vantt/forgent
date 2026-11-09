import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { checkGit, compatibleGitContracts, describeGitError, fixGitFetchMapping } from '../../src/setup/git-checks.mjs';
import { retentionNote } from '../../src/setup/git-retention-note.mjs';
import { fixture as storeFixture, installFetchMapping } from '../event-store/phase07-fixture.mjs';
import { ensureGitAddon, root as addonRoot } from '../../scripts/git-addon.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { resolveStateRoot } from '../../src/holder-lock/state-root.mjs';
import { DOCTOR_CHECKS, createDoctorRun } from '../../src/setup/registrations.mjs';

test('combined ABI row checks every contract independently of package versions', () => {
  const versions = { napi: 8, contracts: { gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 } };
  const floor = { supported: true, probes: [{ passed: true }] };
  assert.equal(compatibleGitContracts(versions, floor), true);
  for (const key of Object.keys(versions.contracts)) {
    assert.equal(compatibleGitContracts({ ...versions, contracts: { ...versions.contracts, [key]: 99 } }, floor), false);
  }
  assert.equal(compatibleGitContracts({ napi: 8 }, floor), false);
  assert.equal(compatibleGitContracts(versions, { supported: false, probes: [{ passed: false }] }), false);
});

test('a malformed explicit addon remains a failing diagnostic', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-git-check-'));
  try {
    const result = checkGit(root, 'git-component-compatible', { descriptor: { releaseRoot: root, manifest: {} } });
    assert.equal(result.passed, false);
    assert.match(result.message, /git-addon-unavailable/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('an addon-less compatibility channel reports informational Git rows', () => {
  const module = pathToFileURL(path.resolve('src/setup/git-checks.mjs')).href;
  const script = `import {checkGit} from ${JSON.stringify(module)}; console.log(JSON.stringify(checkGit(process.cwd(),'git-component-compatible')));`;
  const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8', env: { ...process.env, FGOS_ACTIVE_RELEASE_PATH: '', FGOS_ACTIVE_MANIFEST_PATH: '' } }));
  assert.equal(result.passed, true); assert.match(result.message, /^info: addon not shipped on this channel: onboard this project with `fgctl init`/);
});

test('the journal row fails with git-fence-missing when a Git WAL has lost the controller activation fence', { skip: process.platform === 'win32' }, () => {
  const built = ensureGitAddon();
  const options = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: addonRoot } };
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-journal-fence-'));
  try {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    const fence = path.join(repo, '.fgos/locks/activation.lock');
    fs.mkdirSync(fence, { recursive: true });
    fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
    const { stateRoot } = resolveStateRoot();
    loadNativeAddon(options).initializeGitWal(stateRoot, repo, repo);
    assert.equal(checkGit(repo, 'git-operation-journal', options).passed, true);
    fs.rmSync(fence, { recursive: true });
    const result = checkGit(repo, 'git-operation-journal', options);
    assert.equal(result.passed, false);
    assert.match(result.message, /^git-fence-missing: .*fgctl upgrade/);
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
});

function withRepo(prefix, body) {
  const built = ensureGitAddon();
  const options = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: addonRoot } };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  try { return body(dir, options); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('the repository rows report information, not a failure, outside a Git repository', { skip: process.platform === 'win32' }, () => {
  withRepo('fgos-not-a-repo-', (dir, options) => {
    for (const id of ['git-repository-config', 'git-operation-journal', 'git-incidents']) {
      assert.deepEqual(checkGit(dir, id, options), { passed: true, message: 'info: not a Git repository' }, id);
    }
  });
});

test('the Git rows and the Git floor of one doctor run share one repository inspection, and the repository-config row reads the Event Store facts through the run\'s one Event Store doctor', { skip: process.platform === 'win32' }, () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-git-run-'));
  try {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    const base = createDoctorRun();
    const computed = [];
    const run = { once: (key, compute) => base.once(key, () => { computed.push(key.split(':')[0]); return compute(); }) };
    const ids = ['git-component-compatible', 'git-repository-config', 'git-operation-journal', 'git-incidents'];
    for (const id of ids) assert.equal(typeof DOCTOR_CHECKS.find((row) => row.id === id).check(repo, run).passed, 'boolean', id);
    assert.equal(DOCTOR_CHECKS.find((row) => row.id === 'node-version-and-git').check(repo, run).passed, true);
    assert.deepEqual(computed.sort(), ['event-store-doctor', 'git-inspect']);
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
});

test('the journal row fails and names the fix while no Git WAL exists', { skip: process.platform === 'win32' }, () => {
  withRepo('fgos-journal-missing-', (repo, options) => {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    const result = checkGit(repo, 'git-operation-journal', options);
    assert.equal(result.passed, false);
    assert.match(result.message, /not initialized.*fgos doctor --fix.*git-wal-dir/);
    assert.equal(result.detail.journal.initialized, false);
  });
});

test('the incidents row never fails: it counts native locks and a merge in progress and points to fgos git status', { skip: process.platform === 'win32' }, () => {
  withRepo('fgos-incidents-', (repo, options) => {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'seed'], { cwd: repo, stdio: 'ignore' });
    const clean = checkGit(repo, 'git-incidents', options);
    assert.equal(clean.passed, true);
    assert.match(clean.message, /^no pending Git operation, native lock or merge in progress; .*`fgos git status`$/);
    fs.writeFileSync(path.join(repo, '.git', 'index.lock'), '');
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
    fs.writeFileSync(path.join(repo, '.git', 'MERGE_HEAD'), `${head}\n`);
    const open = checkGit(repo, 'git-incidents', options);
    assert.equal(open.passed, true);
    assert.match(open.message, /^warning: 1 native lock\(s\), a merge in progress; run `fgos git status` \(`fgos git recover` settles interrupted operations\)$/);
    assert.deepEqual(open.detail, { pendingCount: 0, nativeLocks: 1, mergeInProgress: head });
  });
});

const withStateRoot = (f, body) => {
  const prior = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_STATE_ROOT = f.stateRoot;
  try { return body(); } finally { if (prior === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = prior; }
};

test('the repository-config row fails a missing Event Store fetch mapping, an Event Store push or local-namespace fetch, and a remote that moved since setup', { skip: process.platform === 'win32' }, (t) => {
  const f = storeFixture(t, { remote: true });
  const row = () => checkGit(f.repo, 'git-repository-config', f.ctx.loaderOptions);
  withStateRoot(f, () => {
    assert.match(row().message, /the required fetch mapping is missing/);
    // A clone set up before the mail-body mirror existed carries only the event and legacy mappings.
    f.git('config', '--add', 'remote.origin.fetch', '+refs/fgos/events/*:refs/fgos/remotes/origin/events/*');
    f.git('config', '--add', 'remote.origin.fetch', '+refs/fgos/legacy*:refs/fgos/remotes/origin/legacy*');
    assert.match(row().message, /the required fetch mapping is missing/);
    installFetchMapping(f);
    assert.equal(row().passed, true, row().message);
    assert.match(String(f.git('config', '--get-all', 'remote.origin.fetch')), /\+refs\/fgos\/mail-bodies\/\*:refs\/fgos\/remotes\/origin\/mail-bodies\/\*/);
    f.git('config', '--add', 'remote.origin.fetch', '+refs/*:refs/unsafe/*');
    assert.match(row().message, /unsafe publication refspec/);
    f.git('config', '--unset-all', 'remote.origin.fetch');
    installFetchMapping(f);
    f.git('config', '--add', 'remote.origin.push', 'refs/fgos/events/*:refs/fgos/events/*');
    assert.match(row().message, /unsafe publication refspec/);
    f.git('config', '--unset-all', 'remote.origin.push');
    f.git('remote', 'set-url', 'origin', path.join(f.temp, 'other'));
    assert.match(row().message, /event-store-remote-changed/);
  });
});

test('the repository-config row allows ordinary pushes and protective negative fetches but refuses Event Store pushes', { skip: process.platform === 'win32' }, (t) => {
  const f = storeFixture(t, { remote: true });
  installFetchMapping(f);
  f.git('config', '--add', 'remote.origin.fetch', '^refs/fgos/local-events/*');
  withStateRoot(f, () => {
    for (const refspec of ['HEAD', ':', '+:', 'refs/heads/*:refs/heads/*', ':refs/fgos/events/old']) {
      f.git('config', 'remote.origin.push', refspec);
      assert.equal(checkGit(f.repo, 'git-repository-config', f.ctx.loaderOptions).passed, true, refspec);
    }
    for (const refspec of ['refs/*:refs/*', '+refs/fgos/*:refs/fgos/*', 'refs/fgos/events/machine']) {
      f.git('config', 'remote.origin.push', refspec);
      assert.equal(checkGit(f.repo, 'git-repository-config', f.ctx.loaderOptions).passed, false, refspec);
    }
  });
});

test('the retention sentence the incidents row appends warns when finished operations keep piling up and only informs below the line', () => {
  const now = Date.UTC(2026, 9, 23);
  const day = 86_400_000;
  const facts = (retainedChains, ageDays, extra = {}) => ({ retainedChains, oldestRetainedAtMs: now - ageDays * day, retainedBytes: 2048, ...extra });
  assert.equal(retentionNote(facts(0, 0), now), null);
  assert.equal(retentionNote({ retainedChains: 0, oldestRetainedAtMs: null, retainedBytes: 0 }, now), null);
  assert.equal(retentionNote(facts(64, 7), now), 'info: 64 finished Git operation(s) retained (2 KiB, oldest 7.0 days)');
  assert.match(retentionNote(facts(65, 1), now), /^warning: 65 finished Git operation\(s\) retained \(2 KiB, oldest 1\.0 days\), past 64 operations or 7 days; .*report this row/);
  assert.match(retentionNote(facts(3, 8), now), /^warning: 3 finished .*oldest 8\.0 days/);
  assert.match(retentionNote({ ...facts(2, 1), oldestRetainedAtMs: null }, now), /^info: 2 finished .*age unknown/);
  assert.match(retentionNote(facts(1, 1, { ledgerCapacityWarning: true }), now), /^warning: the Git WAL id ledger is at capacity/);
});

test('a Git port error reads as its cause plus the decoded stderr text, never as the raw byte array', () => {
  const stderr = [...Buffer.from("error: No such remote 'origin'\n")];
  const native = new Error(JSON.stringify({ code: 'git-failed', cause: 'git-config-failed', stderr, detail: null }));
  assert.equal(describeGitError(native), "git-config-failed: error: No such remote 'origin'");
  const bare = new Error(JSON.stringify({ code: 'recovery-required', cause: 'git-fence-missing', stderr: [] }));
  assert.equal(describeGitError(bare), 'git-fence-missing');
  assert.equal(describeGitError(new Error('plain failure')), 'plain failure');
  assert.equal(describeGitError(new Error('42')), '42');
});

test('the repository-config row skips, naming the command that adds a remote, while the project has no remote to fetch from', { skip: process.platform === 'win32' }, () => {
  withRepo('fgos-no-remote-', (repo, options) => {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    const result = checkGit(repo, 'git-repository-config', options);
    assert.equal(result.passed, true, result.message);
    assert.equal(result.status, 'skip');
    assert.equal(result.fix, 'git remote add origin <url> && fgos doctor --fix');
    assert.match(result.message, /no Git remote "origin"/);
  });
});

test('the fetch-mapping fix has nothing to repair, and says so without a failure, while the project has no remote', { skip: process.platform === 'win32' }, () => {
  withRepo('fgos-no-remote-fix-', (repo, options) => {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    const state = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-no-remote-state-'));
    const prior = process.env.FGOS_STATE_ROOT;
    process.env.FGOS_STATE_ROOT = state;
    try {
      const outcome = fixGitFetchMapping(repo, options);
      assert.equal(outcome.changed, false);
      assert.doesNotMatch(outcome.message, /warning|refused|\[\d+,/);
      assert.match(outcome.message, /no Git remote "origin"/);
    } finally {
      if (prior === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = prior;
      fs.rmSync(state, { recursive: true, force: true });
    }
  });
});
