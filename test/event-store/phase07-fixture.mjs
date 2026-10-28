import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from '../../scripts/git-addon.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
import { openStore } from '../../src/event-store/index.mjs';
import { fixGitFetchMapping } from '../../src/setup/git-checks.mjs';
const built = ensureGitAddon();
export const loaderOptions = { descriptor: { manifest: JSON.parse(fs.readFileSync(built.manifest)), releaseRoot: root } };
export const addon = loadNativeAddon(loaderOptions);
export function fixture(t, { remote = false, machine = true } = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-es-p07-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repo = path.join(temp, 'repo');
  execFileSync('git', ['init', '-q', repo]);
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
  git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.test');
  if (machine) git('config', 'fgos.machineId', 'phase-seven');
  const stateRoot = path.join(temp, 'state'); fs.mkdirSync(stateRoot, { mode: 0o700 });
  const locks = path.join(repo, '.git/fgos/events/locks'); fs.mkdirSync(locks, { recursive: true, mode: 0o700 });
  fs.mkdirSync(path.join(repo, '.fgos/locks/activation.lock'), { recursive: true });
  fs.writeFileSync(path.join(repo, '.fgos/locks/activation.lock/TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  const contracts = path.join(temp, 'contract.json');
  fs.writeFileSync(contracts, JSON.stringify({ v: 1, types: [
    ...['work.add', 'work.edit', 'porting.add', 'porting.move'].map(type => ({ type, domain: type.startsWith('porting.') ? 'porting' : 'work', schemaVersion: 1, scope: 'project', sealOnWrite: false })),
    ...['local', 'branch'].map(scope => ({ type: `private.${scope}`, domain: 'private', schemaVersion: 1, scope, sealOnWrite: false })),
  ] }));
  if (remote) { execFileSync('git', ['init', '--bare', '-q', path.join(temp, 'remote')]); git('remote', 'add', 'origin', path.join(temp, 'remote')); }
  // The config door reads the global file as `config.json` of this directory, so the path keeps that name.
  fs.mkdirSync(path.join(temp, 'global'));
  const ctx = { cwd: repo, stateRoot, loaderOptions, globalConfigPath: path.join(temp, 'global', 'config.json') };
  const store = machine ? openStore(addon.resolveEventStore(repo, stateRoot, repo), 'phase-seven', [contracts], loaderOptions) : null;
  return { temp, repo, git, stateRoot, locks, store, ctx };
}
export function append(store, events) {
  return store.append('project', events.map(e => ({ eventType: e.type ?? 'work.add', schemaVersion: 1, payload: e.payload ?? { id: 'one', title: 'one' }, ts: e.ts ?? new Date().toISOString() })), {}, 'fixture', []);
}

/** Install the fetch mappings through Git's own setup fix, the one door that writes them. */
export function installFetchMapping({ repo, stateRoot }) {
  const prior = process.env.FGOS_STATE_ROOT; process.env.FGOS_STATE_ROOT = stateRoot;
  try {
    const result = fixGitFetchMapping(repo, loaderOptions);
    assert.ok(result.changed || /no fetch mapping change needed/.test(result.message), result.message);
  } finally { if (prior === undefined) delete process.env.FGOS_STATE_ROOT; else process.env.FGOS_STATE_ROOT = prior; }
}
