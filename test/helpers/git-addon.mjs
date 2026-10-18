import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureGitAddon as buildGitAddon, gitAddonSourceDigest, REPO_ROOT } from '../../scripts/run-tests.mjs';
export { REPO_ROOT as root } from '../../scripts/run-tests.mjs';
import { loadNativeAddon } from '../../src/git/native.mjs';
export function ensureGitAddon(env = process.env, cwd = REPO_ROOT, locked = true) {
  const manifest = path.join(cwd, '.fgos/runtime/phase-target/native-addon.json');
  try {
    const value = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    if (value.sourceDigest === gitAddonSourceDigest(cwd)) {
      loadNativeAddon({ descriptor: { manifest: value, releaseRoot: cwd } });
      return { manifest, addon: path.join(cwd, value.components.nativeAddon.path) };
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
