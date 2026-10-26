// Run from the repository root with NODE_OPTIONS=--no-addons. Exit 0 means the
// historical scanners exhibited the expected failures, not that their tests passed.
// Scanner code is unchanged; only relative dependency specifiers and the test import move.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

const root = process.cwd();
fs.mkdirSync('/tmp/fgos-work', { recursive: true });
const scratch = fs.mkdtempSync('/tmp/fgos-work/scanner-reexport-controls.');
try {
  const env = { ...process.env, NODE_OPTIONS: '--no-addons', TMPDIR: scratch };
  delete env.CLAUDE_CODE_SESSION_ID;
  for (const [revision, pattern, expectedPass, expectedFail, missingExceptions] of [
    ['129cbb127', 'declared wrappers refuse star and namespace re-exports', 0, 13, 12],
    ['2fa7fe921', 'a configured function adapter stays classified', 0, 1, 0],
    ['fbcb8e016', 'a configured function adapter stays classified', 1, 0, 0],
  ]) {
    const source = execFileSync('git', ['show', `${revision}:scripts/git-one-door-scan.mjs`], { encoding: 'utf8' });
    const scanner = path.join(scratch, `${revision}.mjs`);
    fs.writeFileSync(scanner, source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,
      (_, quote, spec) => `from ${quote}${pathToFileURL(path.resolve(root, 'scripts', spec)).href}${quote}`));
    const tests = path.join(scratch, `${revision}.test.mjs`);
    fs.writeFileSync(tests, fs.readFileSync('test/scripts/git-one-door-declarations.test.mjs', 'utf8')
      .replace('../../scripts/git-one-door-scan.mjs', pathToFileURL(scanner).href));
    const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', `--test-name-pattern=${pattern}`, tests], {
      env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    process.stdout.write(`\n# Historical scanner: ${revision}\n${result.stdout}${result.stderr}`);
    assert.equal(result.signal, null);
    assert.equal(result.status, expectedFail ? 1 : 0, revision);
    assert.match(result.stdout, new RegExp(`# pass ${expectedPass}\\n`));
    assert.match(result.stdout, new RegExp(`# fail ${expectedFail}\\n`));
    assert.equal((result.stdout.match(/error: 'Missing expected exception\.'/g) ?? []).length, missingExceptions);
    if (revision === '2fa7fe921') {
      assert.match(result.stdout, /no caller found for cliAdapter/);
      assert.match(result.stdout, /exported in a namespace holder/);
    }
  }
  console.log('\nHistorical controls verified: all 12 re-export bypasses red; adapter regression red after the change and green before it.');
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
