// Run from the repository root. Expected exit: 1 (the new refusal cases must be red).
// Only module specifiers change; the historical scanner's implementation stays untouched.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.cwd();
fs.mkdirSync('/tmp/fgos-work', { recursive: true });
const scratch = fs.mkdtempSync('/tmp/fgos-work/scanner-reexport-control.');
try {
  const source = execFileSync('git', ['show', '129cbb127:scripts/git-one-door-scan.mjs'], { encoding: 'utf8' });
  const scanner = path.join(scratch, 'original-scanner.mjs');
  fs.writeFileSync(scanner, source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,
    (_, quote, spec) => `from ${quote}${pathToFileURL(path.resolve(root, 'scripts', spec)).href}${quote}`));
  const tests = path.join(scratch, 'original-scanner.test.mjs');
  fs.writeFileSync(tests, fs.readFileSync('test/scripts/git-one-door-declarations.test.mjs', 'utf8')
    .replace('../../scripts/git-one-door-scan.mjs', pathToFileURL(scanner).href));
  const env = { ...process.env, NODE_OPTIONS: '--no-addons', TMPDIR: scratch };
  delete env.CLAUDE_CODE_SESSION_ID;
  const result = spawnSync(process.execPath, ['--test', tests], { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.signal) throw new Error(`negative control terminated by ${result.signal}`);
  process.exitCode = result.status;
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
