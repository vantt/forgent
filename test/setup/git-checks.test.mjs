import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { checkGit, compatibleGitContracts } from '../../src/setup/git-checks.mjs';
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
    const { stateRoot } = resolveStateRoot({ fgosDir: path.join(repo, '.fgos') });
    loadNativeAddon(options).initializeGitWal(stateRoot, repo, repo);
    assert.equal(checkGit(repo, 'git-operation-journal', options).passed, true);
    fs.rmSync(fence, { recursive: true });
    const result = checkGit(repo, 'git-operation-journal', options);
    assert.equal(result.passed, false);
    assert.match(result.message, /^git-fence-missing: .*fgctl upgrade/);
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
});
