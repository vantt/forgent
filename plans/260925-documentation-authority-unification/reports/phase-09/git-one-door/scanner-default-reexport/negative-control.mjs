// Run from the repository root with NODE_OPTIONS=--no-addons. This control expects
// failures: the final owning tests must expose the default re-export hole at f4324b27d.
// Only module specifiers move; historical scanner logic and current test cases do not.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.cwd();
fs.mkdirSync('/tmp/fgos-work', { recursive: true });
const scratch = fs.mkdtempSync('/tmp/fgos-work/scanner-default-control.');
try {
  const source = execFileSync('git', ['show', 'f4324b27d:scripts/git-one-door-scan.mjs'], { encoding: 'utf8' });
  const scanner = path.join(scratch, 'historical-scanner.mjs');
  fs.writeFileSync(scanner, source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,
    (_, quote, spec) => `from ${quote}${pathToFileURL(path.resolve(root, 'scripts', spec)).href}${quote}`));
  const tests = path.join(scratch, 'historical-scanner.test.mjs');
  fs.writeFileSync(tests, fs.readFileSync('test/scripts/git-one-door-declarations.test.mjs', 'utf8')
    .replace('../../scripts/git-one-door-scan.mjs', pathToFileURL(scanner).href));
  const env = { ...process.env, NODE_OPTIONS: '--no-addons', TMPDIR: scratch };
  delete env.CLAUDE_CODE_SESSION_ID;
  const args = ['--test', '--test-reporter=tap', '--test-name-pattern=declared wrappers refuse star, default|a configured function adapter keeps', tests];
  console.log(`Historical child: node ${args.join(' ')}`);
  const result = spawnSync(process.execPath, args, { env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error) throw result.error;
  process.stdout.write(result.stdout + result.stderr);
  console.log(`Historical child exit: ${result.status}`);
  assert.equal(result.signal, null);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /# pass 12\n/);
  assert.match(result.stdout, /# fail 6\n/);
  assert.equal((result.stdout.match(/error: 'Missing expected exception\.'/g) ?? []).length, 4);
  assert.match(result.stdout, /a configured adapter cannot hide a fixed Git caller through a default export/);
  console.log('Control passed: all four default re-export cases and the configured adapter case fail on f4324b27d; the twelve existing re-export cases pass.');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
