// A no-staging diagnostic of the public scan API, not the required native-backed CLI proof.
// Git supplies the same tracked/untracked non-ignored source set read-only; declaredProduct
// remains the scanner's own filter. No parser, classification or native check is bypassed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

assert.equal(process.env.NODE_OPTIONS, '--no-addons', 'native loading must remain disabled');
const root = process.cwd();
const current = await import(pathToFileURL(path.join(root, 'scripts/git-one-door-scan.mjs')));
fs.mkdirSync('/tmp/fgos-work', { recursive: true });
const scratch = fs.mkdtempSync('/tmp/fgos-work/scanner-default-tree.');
try {
  const names = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }).split('\0').filter(Boolean))].sort();
  const source = execFileSync('git', ['show', 'f4324b27d:scripts/git-one-door-scan.mjs'], { encoding: 'utf8' });
  const scanner = path.join(scratch, 'historical-scanner.mjs');
  fs.writeFileSync(scanner, source.replace(/from (['"])(\.\.?\/[^'"]+)\1/g,
    (_, quote, spec) => `from ${quote}${pathToFileURL(path.resolve(root, 'scripts', spec)).href}${quote}`));
  const historical = await import(pathToFileURL(scanner));
  const results = [];
  for (const [label, api] of [['f4324b27d scanner on working tree', historical], ['current scanner on working tree', current]]) {
    const product = api.declaredProduct(root);
    const files = names.filter(name => !product || product(name)).map(name => path.join(root, name));
    try {
      const result = api.scan({ root, files });
      const facts = { label, undeclared: result.sites.length, classCounts: result.classCounts };
      console.log(JSON.stringify(facts, null, 2));
      results.push(facts);
    } catch (error) {
      console.error(`${label}: scan blocked\n${error.stack}`);
      results.push({ label, blocked: true });
    }
  }
  if (results.some(result => result.blocked)) process.exitCode = 1;
  else {
    assert.equal(results[0].undeclared, 0);
    assert.equal(results[1].undeclared, 0);
    assert.deepEqual(results[1].classCounts, results[0].classCounts);
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
