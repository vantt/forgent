import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureGitAddon as buildGitAddon, gitAddonSourceDigest, gitAddonDirectory, GIT_ADDON_SOURCE_DIGEST_FILE, REPO_ROOT } from './lib/git-addon-stage.mjs';
export { REPO_ROOT as root } from './lib/git-addon-stage.mjs';
import { devHostEnv } from './lib/dev-host-manifest.mjs';
import { hashFile } from './build-rust-distribution.mjs';
import { loadNativeAddon } from '../src/git/native.mjs';
export function ensureGitAddon(env = process.env, cwd = REPO_ROOT, locked = true) {
  const directory = gitAddonDirectory(cwd);
  const manifest = path.join(directory, 'manifest.json');
  try {
    if (fs.readFileSync(path.join(directory, GIT_ADDON_SOURCE_DIGEST_FILE), 'utf8') === gitAddonSourceDigest(cwd)) {
      const value = JSON.parse(fs.readFileSync(manifest, 'utf8'));
      loadNativeAddon({ descriptor: { manifest: value, releaseRoot: cwd } });
      const hostBin = path.join(cwd, value.entries.fgos);
      if (!fs.existsSync(hostBin)) throw new Error('staged host missing');
      // bin/fgos.mjs is part of the manifest; a stale digest rebuilds it below.
      if (value.components.legacyNode.digest !== hashFile(path.join(cwd, 'bin/fgos.mjs'))) throw new Error('legacy payload changed');
      Object.assign(env, devHostEnv({}, { fgosBin: hostBin, checkoutRoot: cwd, manifestPath: manifest }));
      return { manifest, hostBin, addon: path.join(cwd, value.components.nativeAddon.path) };
    }
  } catch {}
  return buildGitAddon(env, cwd, locked);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const built = buildGitAddon(process.env, REPO_ROOT, !process.argv.includes('--update-lock'));
  if (process.argv.includes('--verify')) {
    for (const [name, args] of [
      ['rust-tests', ['test', '--locked', '-p', 'fgos-node-addon', '-p', 'fgos-git', '-p', 'fgos-event-store']],
      ['clippy', ['clippy', '--locked', '-p', 'fgos-node-addon', '-p', 'fgos-git', '-p', 'fgos-event-store', '--all-targets', '--', '-D', 'warnings']],
    ]) {
      const log = fs.openSync(path.join(built.cargoEnv.CARGO_TARGET_DIR, `addon-${name}.log`), 'w');
      try { execFileSync('cargo', args, { cwd: REPO_ROOT, env: built.cargoEnv, stdio: ['ignore', log, log] }); console.log(`${name}: green`); }
      finally { fs.closeSync(log); }
    }
    const nodeLog = fs.openSync(path.join(built.cargoEnv.CARGO_TARGET_DIR, 'addon-node.log'), 'w');
    const files = fs.readdirSync(path.join(REPO_ROOT, 'test/git')).filter(f => f.endsWith('.test.mjs')).map(f => `test/git/${f}`);
    try { execFileSync(process.execPath, ['--test', ...files, 'test/architecture.test.mjs'], { cwd: REPO_ROOT, env: process.env, stdio: ['ignore', nodeLog, nodeLog] }); console.log('node: green'); }
    finally { fs.closeSync(nodeLog); }
  }
}
