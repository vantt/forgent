import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ensureGitAddon as buildGitAddon, REPO_ROOT } from './lib/git-addon-stage.mjs';
export { ensureStagedOrBuiltGitAddon as ensureGitAddon, REPO_ROOT as root } from './lib/git-addon-stage.mjs';

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
