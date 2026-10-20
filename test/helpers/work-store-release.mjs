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
fs.symlinkSync(root, path.join(release, 'payload'));
const component = manifest.components.nativeAddon;
fs.linkSync(path.join(root, component.path), path.join(release, 'fgos.node'));
fs.writeFileSync(path.join(release, 'manifest.json'), JSON.stringify({
  entries: { fgos: 'bin/fgos' },
  components: { legacyNode: { root: 'payload', entry: 'bin/fgos.mjs' }, nativeAddon: { ...component, path: 'fgos.node' } },
}));
process.env.FGOS_HOST_BIN = hostBin;

process.on('exit', () => fs.rmSync(release, { recursive: true, force: true }));

export function initializeWorkRepository(repo) {
  fs.mkdirSync(repo, { recursive: true });
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { stdio: 'pipe' });
  git('init', '-q');
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
