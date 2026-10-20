import './process-tmp-root.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureGitAddon, root } from './git-addon.mjs';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';

// Stage the same real host/payload/addon release descriptor as production.
// Import once per test process before calling public Work APIs.
const built = ensureGitAddon();
const manifest = JSON.parse(fs.readFileSync(built.manifest));
const host = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') }).bin;
if (!host) throw new Error('a real host is required for Work fixtures');
const release = fs.mkdtempSync(path.join(path.dirname(built.addon), 'work-release-'));
fs.mkdirSync(path.join(release, 'bin'));
export const hostBin = path.join(release, 'bin/fgos');
fs.copyFileSync(host, hostBin); fs.chmodSync(hostBin, 0o755);
function writeWorkDescriptor(fixtureHost) {
  const fixtureRelease = path.dirname(path.dirname(fixtureHost));
  fs.symlinkSync(root, path.join(fixtureRelease, 'payload'));
  const component = manifest.components.nativeAddon;
  fs.linkSync(path.join(root, component.path), path.join(fixtureRelease, 'fgos.node'));
  fs.writeFileSync(path.join(fixtureRelease, 'manifest.json'), JSON.stringify({
    entries: { fgos: path.relative(fixtureRelease, fixtureHost) },
    components: { legacyNode: { root: 'payload', entry: 'bin/fgos.mjs' }, nativeAddon: { ...component, path: 'fgos.node' } },
  }));
}
writeWorkDescriptor(hostBin);
export function attachWorkAddon(fixtureHost) {
  // Keep the addon on its original filesystem: a second copied image is
  // intentionally refused by the native process-wide single-load guard.
  const fixtureRelease = fs.mkdtempSync(path.join(path.dirname(built.addon), 'work-host-'));
  fs.mkdirSync(path.join(fixtureRelease, 'bin'));
  const stagedHost = path.join(fixtureRelease, 'bin/fgos');
  fs.copyFileSync(fixtureHost, stagedHost);
  fs.chmodSync(stagedHost, 0o755);
  writeWorkDescriptor(stagedHost);
  process.on('exit', () => fs.rmSync(fixtureRelease, { recursive: true, force: true }));
  return stagedHost;
}
process.env.FGOS_HOST_BIN = hostBin;

process.on('exit', () => fs.rmSync(release, { recursive: true, force: true }));

export function initializeWorkRepository(repo) {
  fs.mkdirSync(repo, { recursive: true });
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { stdio: 'pipe' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.test');
  git('config', 'fgos.machineId', 'work-fixture');
  const locks = path.join(repo, '.git/fgos/events/locks');
  fs.mkdirSync(locks, { recursive: true, mode: 0o700 });
  const fence = path.join(repo, '.fgos/locks/activation.lock');
  fs.mkdirSync(fence, { recursive: true });
  fs.writeFileSync(path.join(fence, 'TOMBSTONE'), JSON.stringify({ lock: 'activation', by: 'fgos git', at: 'fixture' }));
  return path.join(repo, '.fgos');
}

const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-work-state-root-'));
fs.chmodSync(stateRoot, 0o700);
fs.writeFileSync(path.join(stateRoot, 'machine-id'), 'work-fixture\n');
process.env.FGOS_STATE_ROOT = stateRoot;

// Legacy readers consume immutable HEAD inventory, never mutable working files.
export function freezeLegacyWorkFixture(repo) {
  execFileSync('git', ['-C', repo, 'add', '.fgos/events.jsonl'], { stdio: 'pipe' });
  execFileSync('git', ['-C', repo, 'commit', '-qm', 'frozen legacy Work fixture'], { stdio: 'pipe' });
}
