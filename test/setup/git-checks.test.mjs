import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { checkGit, compatibleGitContracts, fixLandRecovery } from '../../src/setup/git-checks.mjs';
import { retentionNote } from '../../src/setup/git-retention-note.mjs';
import { fixture as landFixture } from '../git/land-fixture.mjs';
import { ensureGitAddon, root as addonRoot } from '../../scripts/git-addon.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { resolveStateRoot } from '../../src/holder-lock/state-root.mjs';

test('combined ABI row checks every contract independently of package versions', () => {
  const versions = { napi: 8, contracts: { gitPort: 1, receipt: 1, walRecord: 1, eventStore: 4 } };
  const floor = { supported: true, probes: [{ passed: true }] };
  assert.equal(compatibleGitContracts(versions, floor), true);
  for (const key of Object.keys(versions.contracts)) {
    assert.equal(compatibleGitContracts({ ...versions, contracts: { ...versions.contracts, [key]: 99 } }, floor), false);
  }
  assert.equal(compatibleGitContracts({ napi: 8 }, floor), false);
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
    for (const id of ['git-repository-config', 'git-operation-journal', 'git-native-locks']) {
      assert.deepEqual(checkGit(dir, id, options), { passed: true, message: 'info: not a Git repository' }, id);
    }
  });
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

test('the native-locks row fails with one sentence naming the runbook and keeps the lock paths as detail', { skip: process.platform === 'win32' }, () => {
  withRepo('fgos-native-lock-', (repo, options) => {
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    assert.equal(checkGit(repo, 'git-native-locks', options).passed, true);
    fs.writeFileSync(path.join(repo, '.git', 'index.lock'), '');
    const result = checkGit(repo, 'git-native-locks', options);
    assert.equal(result.passed, false);
    assert.match(result.message, /^1 native Git lock\(s\) present and never removed by fgOS; follow the runbook in docs\/platform\/git\/spec\.md section 11$/);
    assert.equal(result.detail.nativeLocks.length, 1);
  });
});

async function withLandJournal(body) {
  const f = landFixture();
  const prior = process.env.FGOS_STATE_ROOT;
  process.env.FGOS_STATE_ROOT = f.options.stateRoot;
  try { return await body(f); } finally { if (prior === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = prior; f.close(); }
}

test('a failing journal row still ends its message with the retained Land warning', { skip: process.platform === 'win32' }, () => withLandJournal(async (f) => {
  const first = f.port();
  await first.prepare({ operationId: 'retained-one', request: f.request });
  first.close();
  fixLandRecovery(f.repo, f.loader, f.options);
  const second = f.port();
  await second.prepare({ operationId: 'pending-two', request: f.request });
  second.close();
  const row = checkGit(f.repo, 'git-operation-journal', f.loader, f.options);
  assert.equal(row.passed, false);
  assert.match(row.message, /1 Git operation\(s\) unresolved.*; warning: retained Land candidates: retained-one \(/);
}));

test('a failed Land listing is a warning in the journal row and does not hide the WAL findings', { skip: process.platform === 'win32' }, () => withLandJournal(async (f) => {
  const land = f.port();
  await land.prepare({ operationId: 'pending-only', request: f.request });
  land.close();
  const broken = { ...f.options, repoPath: path.join(f.temp, 'no-such-repo') };
  const row = checkGit(f.repo, 'git-operation-journal', f.loader, broken);
  assert.equal(row.passed, false);
  assert.match(row.message, /1 Git operation\(s\) unresolved.*; warning: Land candidate scan failed: /);
}));

test('the journal row warns when finished operations keep piling up and only informs below the line', () => {
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

test('the journal row reports the retained finished operations of a real journal with their count and age', { skip: process.platform === 'win32' }, () => withLandJournal(async (f) => {
  const land = f.port();
  await land.prepare({ operationId: 'finished-one', request: f.request });
  land.close();
  fixLandRecovery(f.repo, f.loader, f.options);
  const row = checkGit(f.repo, 'git-operation-journal', f.loader, f.options);
  assert.equal(row.passed, true);
  // The Land chain and the candidate worktree's own chain are both finished and retained.
  assert.match(row.message, /info: 2 finished Git operation\(s\) retained \(\d+ KiB, oldest 0\.0 days\)/);
  assert.equal(row.detail.journal.retainedChains, 2);
  assert.equal(typeof row.detail.journal.oldestRetainedAtMs, 'number');
}));
