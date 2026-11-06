import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = path.join(repo, 'scripts', 'check-undefined-names.mjs');

// The bundled parser is reachable only with --expose-internals; a run without it must fail by name.
function runCheck(root, flags = ['--expose-internals']) {
  // boundary: process-contract, the check is a standalone script whose exit status and stderr are its whole contract
  return spawnSync(process.execPath, [...flags, script, '--root', root], { encoding: 'utf8' });
}

test('every module under src and bin reads only names that a scope or Node declares', () => {
  const result = runCheck(repo);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
});

test('a read of an undeclared name is reported with file and line, and declared forms are not', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-undef-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'src', 'sample.mjs'), [
    "import fs, { readFileSync as rf } from 'node:fs';",
    'export const a = 1;',
    'function hoisted({ x, y: [z = a] = [] }, ...rest) { return [x, z, rest, arguments, rf, fs]; }',
    'class K extends Object { static s = 1; #p = 2; m() { return [K, this.#p, typeof maybeAbsent, label]; } }',
    'label: for (const q of [1]) { try { hoisted({ x: q }); } catch ({ message }) { void message; } continue label; }',
    'switch (a) { case 1: { let w = 2; void w; } }',
    'var late = () => later; var later = 1; void late;',
    'void missingName;',
    'export { hoisted };',
  ].join('\n'));
  const result = runCheck(root);
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stderr.trim(), 'src/sample.mjs:4 label is not defined\nsrc/sample.mjs:8 missingName is not defined');
});

test('the check fails by name when its parser cannot be loaded', () => {
  const result = runCheck(repo, []);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /^no-undef-parser-unavailable: node v\d+/);
});
